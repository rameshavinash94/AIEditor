from pickle import TRUE
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
from google.cloud import storage

def create_file_with_gcs_locations(bucket_name, file_name, location1, location2):
    """Creates a text file with two GCS locations in it
    Arg: 
    bucket_name: name of the bucket
    file_name: name of the text file to be created
    location1 (str): the gs url to the first video file
    location2 (str): the gs url to the second video file        

    """
    
    # Initialize the storage client
    storage_client = storage.Client()

    # Get the bucket object
    bucket = storage_client.bucket(bucket_name)

    # Create a new blob object with the specified file name and path
    blob = bucket.blob('test_user/test_project/tmp_files/' + file_name)

    # Write the two GCS locations to the file
    file_path = f"/tmp/{file_name}"
    with open(file_path, "w") as file:
        file.write(f"file '{location1}'\n")
        file.write(f"file '{location2}'\n")
# with open('/content/filelist.txt', 'w') as file:
#     # Write file addresses to the text file
#     file.write(f"file '{output_video1}'\n")
#     file.write(f"file '{output_video2}'\n")
    # Upload the file to GCS
    blob.upload_from_filename(file_path)

    print(f"File {file_name} created with GCS locations {location1} and {location2}.")
# Check compatibility of input videos



def change_video_compatibility(request):

    """
    Function to change the frame rate and video compability(codec) if needed.

    Args:
        input_gs_path1 (str): the gs url to the first video (resolution fixed) file
        input_gs_path2 (str): the gs url to the second video (resolution fixed) file        

    Returns:
       Returns:
        A dictionary containing the following keys:
            - output_gs_path1: str, the Google Cloud Storage path to the compatible first video file
            - output_gs_path2: str, the Google Cloud Storage path to the compatible second video file
            - public_shared_url1: str, a publicly accessible URL to the compatible first video file
            - public_shared_url2: str, a publicly accessible URL to the compatible second video file
    
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
      input_gs_path1 = request_json['input_gs_path1']
      input_gs_path2 = request_json['input_gs_path2']
      

      
      input_bucket_name1, input_video_gcs1 = extract_bucket_and_video(input_gs_path1)
      file_name1 = 'compatible_' + input_video_gcs1.split('/')[-1].split('.')[0] + '.mp4'

      output_video_gcs1 = '/'.join(input_video_gcs1.split('/')[0:-2]) + '/edited_files/' + file_name1
      print(output_video_gcs1)
      output_gs_path1 = f"gs://{input_bucket_name1}/{output_video_gcs1}"


      client = storage.Client()
      bucket1 = client.get_bucket(input_bucket_name1)
      input_blob1 = bucket1.blob(input_video_gcs1)

      input_bucket_name2, input_video_gcs2 = extract_bucket_and_video(input_gs_path2)
      file_name2 = 'compatible_' + input_video_gcs2.split('/')[-1].split('.')[0] + '.mp4'

      output_video_gcs2 = '/'.join(input_video_gcs2.split('/')[0:-2]) + '/edited_files/' + file_name2
      print(output_video_gcs2)
      output_gs_path2 = f"gs://{input_bucket_name2}/{output_video_gcs2}"

      bucket2 = client.get_bucket(input_bucket_name2)
      input_blob2 = bucket1.blob(input_video_gcs2)

    
      with tempfile.TemporaryDirectory() as tmpdir:
          input_video_local1 = os.path.join(tmpdir, input_video_gcs1.split("/")[-1])
          print("input_video_local1",input_video_local1)
          input_blob1.download_to_filename(input_video_local1)
          output_video_local1 = os.path.join(tmpdir, file_name1)
          print(input_blob1)

          input_video_local2 = os.path.join(tmpdir, input_video_gcs2.split("/")[-1])
          print("input_video_local2",input_video_local2)
          input_blob2.download_to_filename(input_video_local2)
          output_video_local2 = os.path.join(tmpdir, file_name2)
          print(input_blob1)

          codec_name1, width1, height1, r_frame_rate1 = check_video_compatibility(input_video_local1)
          codec_name2, width2, height2, r_frame_rate2 = check_video_compatibility(input_video_local2)


          if codec_name1 != codec_name2 or r_frame_rate1 != r_frame_rate2:
            # Convert input videos to a common codec (H.264) and frame rate (30 fps)
            cmd1 = ['ffmpeg', '-i', input_video_local1, '-c:v', 'libx264', '-r', '30', '-crf', '18', '-vf', f'scale={width1}:{height1}', '-y', output_video_local1]
            cmd2 = ['ffmpeg', '-i', input_video_local2, '-c:v', 'libx264', '-r', '30', '-crf', '18', '-vf', f'scale={width2}:{height2}', '-y', output_video_local2]
            subprocess.check_call(cmd1)
            subprocess.check_call(cmd2)
            
            output_blob1 = bucket1.blob(output_video_gcs1)
            print("output_blob1",output_blob1)
            output_blob1.upload_from_filename(output_video_local1)

            output_blob2 = bucket1.blob(output_video_gcs2)
            print("output_blob2",output_blob2)
            output_blob2.upload_from_filename(output_video_local2)

            create_file_with_gcs_locations("editor_users","location.txt",output_gs_path1,output_gs_path2)
            output_video_access_token1 = generate_token(input_bucket_name1,output_video_gcs1)
            output_video_access_token2 = generate_token(input_bucket_name2,output_video_gcs2)
            response = jsonify({"output_gs_path1": output_gs_path1, "output_gs_path2":output_gs_path2,"public_shared_URL1":output_video_access_token1,"public_shared_URL2":output_video_access_token2})
            
          else:
            create_file_with_gcs_locations("editor_users","location1.txt",input_gs_path1,input_gs_path2)
            output_video_access_token1 = generate_token(input_bucket_name1,input_gs_path1)
            output_video_access_token2 = generate_token(input_bucket_name2,input_gs_path2)
            response = jsonify({"output_gs_path1": input_gs_path1, "output_gs_path2":input_gs_path2, "public_shared_URL1":output_video_access_token1,"public_shared_URL2":output_video_access_token2})
      return (response, 200, headers)
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")

    #       print(cmd1)
    #       print(input_video_local3)
          
    #       output_gs_path1 = f"gs://{input_bucket_name1}/enhanced_video_quality/{output_video_gcs1}"
    #       output_gs_path2 = f"gs://{input_bucket_name2}/enhanced_video_quality/{output_video_gcs2}"
          
          
    #       output_blob1 = bucket1.blob(output_video_gcs1)
    #       output_blob1.upload_from_filename(output_video_local1)
    #       print(output_blob1)

    #       output_video_local2 = os.path.join(tmpdir, output_video_gcs2)
    #       output_blob2 = bucket1.blob(input_video_local4)
    #       output_blob2.upload_from_filename(output_video_local2)
    #       print(output_blob2)

    # logging.info("The updated video file is uploaded on the path: %s", output_gs_path)

    # return {"output_gs_path1": input_gs_path1, "output_gs_path2":input_gs_path2}