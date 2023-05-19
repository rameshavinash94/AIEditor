import os
import tempfile
import uuid
import subprocess
import logging
from google.cloud import storage
from urllib.parse import urlparse
from flask import jsonify


os.environ['PATH'] = f"{os.environ['PATH']}:{os.path.join(os.getcwd(), 'bin')}"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "aieditorv1-aab20db3d78f.json"
def extract_bucket_and_video(gs_path):
    """
    Extracts the bucket name and video path from a GCS URI.

    Args:
        gs_path (str): The GCS URI of the video.

    Returns:
        tuple: A tuple containing the bucket name and video path.
    """
    parsed_uri = urlparse(gs_path)
    if not parsed_uri.scheme == 'gs':
        raise ValueError("Invalid GCS URI. Make sure it starts with 'gs://'")

    bucket_name = parsed_uri.netloc
    video = parsed_uri.path.strip('/')
    return bucket_name, video

def generate_token(input_bucket_name,input_video_gcs):
    """
    Generates a signed URL for a video stored in GCS.

    Args:
        input_bucket_name (str): The name of the bucket containing the video.
        input_video_gcs (str): The GCS path of the video.

    Returns:
        str: The signed URL for the video.
    """
    client = storage.Client()
    input_bucket = client.get_bucket(input_bucket_name)
    blob = input_bucket.blob(input_video_gcs)
    access_token = blob.generate_signed_url(version='v4', expiration=6000)
    return access_token

def check_video_compatibility(video_path):

    """
    Function to check compatibility between 2 videos
    Arg:
    video_path: gs_path of the video file

    return:
    width: width in pixel of the video
    height: height in pixel of the video
    r_frame_rate: frame rate of the video
    codec: encoding method followed in the video
    """
    cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,r_frame_rate', '-of', 'default=noprint_wrappers=1', video_path]
    print(cmd)
    output = subprocess.check_output(cmd).decode('utf-8')
    codec_name, width, height, r_frame_rate = None, None, None, None
    for line in output.split('\n'):
        if 'codec_name' in line:
            codec_name = line.split('=')[1]
        elif 'width' in line:
            width = int(line.split('=')[1])
        elif 'height' in line:
            height = int(line.split('=')[1])
        elif 'r_frame_rate' in line:
            r_frame_rate = line.split('=')[1]
    return codec_name, width, height, r_frame_rate

def change_video_resolution(request):

    """
    Function to change the width and height(video resolution) if needed.

    Args:
        input_gs_path (str): the gs url to the  video file    

    Returns:
       Returns:
        A dictionary containing the following keys:
            - output_gs_path: str, the Google Cloud Storage path to the new_resoluted video file
            - public_shared_url: str, a publicly accessible URL to the new_resoluted  video file
    """

    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*'
    }
    try:
      request_json = request.get_json(silent=True)
      input_gs_path = request_json['input_gs_path']
      resolution =  request_json['resolution']
      input_width, input_length = map(int, resolution.split('x'))

      input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)
      video_name = input_video_gcs.split("/")[-1]
    
      
      file_name = 'changed_resolution' + input_video_gcs.split('/')[-1].split('.')[0] + '.mp4'

      output_video_gcs = '/'.join(input_video_gcs.split('/')[0:-2]) + '/edited_files/' + file_name
      print(output_video_gcs)
      output_gs_path = f"gs://{input_bucket_name}/{output_video_gcs}"

      client = storage.Client()
      bucket = client.get_bucket(input_bucket_name)
      input_blob = bucket.blob(input_video_gcs)

      with tempfile.TemporaryDirectory() as tmpdir:
          input_video_local = os.path.join(tmpdir, input_video_gcs.split("/")[-1])
          print("input_video_local",input_video_local)

          input_blob.download_to_filename(input_video_local)
          print(input_blob)
          logging.info("The video was downloaded from the bucket")

          output_video_local = os.path.join(tmpdir, file_name)
          print("output_video_local",output_video_local)

          codec_name, width, height, r_frame_rate = check_video_compatibility(input_video_local)

          if width != input_width or height != input_length:
            command = f'ffmpeg -i {input_video_local} -vf "scale={resolution}" -c:v libx264 -crf 18 -y {output_video_local}'
            print(command)
            subprocess.run(command, shell=True, check=True)

            logging.info("The resolution change command ran successfully")
            output_blob = bucket.blob(output_video_gcs)
            print("output_blob",output_blob)
            output_blob.upload_from_filename(output_video_local)

            output_video_access_token = generate_token(input_bucket_name,output_video_gcs)
            response = jsonify({"output_gs_path": output_gs_path,"public_shared_url":output_video_access_token})
            return (response, 200, headers)

          else:
            output_video_access_token = generate_token(input_bucket_name,input_gs_path)
            response = jsonify({"output_gs_path": input_gs_path,"public_shared_url":output_video_access_token})
            return (response, 200, headers)

    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")      
    