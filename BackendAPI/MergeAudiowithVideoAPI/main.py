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




def merge_new_audio_with_video(request):
    """
    Function to merge silenced audio to the new video.

    Args:
        input_gs_video_path (str): the gs url to the input video file
        input_gs_audio_path (str): the gs url to the silenced audio file        

    Returns:
       Returns:
        A dictionary containing the following keys:
            - output_gs_path1: str, the Google Cloud Storage path to the  video file merged with silenced audio
            - public_shared_url: str, a publicly accessible URL to the video file merged with silenced audio
    
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
      input_gs_video_path = request_json['input_gs_video_path']
      input_gs_audio_path = request_json['input_gs_audio_path']
      

      
      input_bucket_name1, input_video_gcs1 = extract_bucket_and_video(input_gs_video_path)
      file_name1 = 'merged_video_' + input_video_gcs1.split('/')[-1].split('.')[0] + '.mp4'

      output_video_gcs1 = '/'.join(input_video_gcs1.split('/')[0:-2]) + '/edited_files/' + file_name1
      # final_output_video_gcs1 = f"merged_video/{output_video_gcs1}"
      output_gs_path1 = f"gs://{input_bucket_name1}/{output_video_gcs1}"

      client = storage.Client()
      bucket1 = client.get_bucket(input_bucket_name1)
      input_blob1 = bucket1.blob(input_video_gcs1)

      input_bucket_name2, input_audio_gcs2 = extract_bucket_and_video(input_gs_audio_path)
      audio_name2 = 'silenced_audio_' + input_audio_gcs2.split('/')[-1].split('.')[0] + '.wav'
      

      bucket2 = client.get_bucket(input_bucket_name2)
      input_blob2 = bucket2.blob(input_audio_gcs2)

    
    
      with tempfile.TemporaryDirectory() as tmpdir:
          input_video_local1 = os.path.join(tmpdir, input_video_gcs1.split("/")[-1])
          print("input_video_local1",input_video_local1)
          input_blob1.download_to_filename(input_video_local1)
          output_video_local1 = os.path.join(tmpdir, file_name1)
          print(input_blob1)

          input_audio_local2 = os.path.join(tmpdir, input_audio_gcs2.split("/")[-1])
          print("input_video_local2",input_audio_local2)
          input_blob2.download_to_filename(input_audio_local2)
          print(input_blob1)
          command = f"ffmpeg -i {input_video_local1} -i {input_audio_local2} -c:v copy -map 0:v:0 -map 1:a:0 -shortest {output_video_local1}"

          process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
          output, error = process.communicate()


          
          output_blob1 = bucket1.blob(output_video_gcs1)
          print("output_blob1",output_blob1)
          output_blob1.upload_from_filename(output_video_local1)
          output_video_access_token = generate_token(input_bucket_name1,output_video_gcs1)

          response = jsonify({"output_gs_path1": output_gs_path1,"public_shared_url":output_video_access_token})
      return (response, 200, headers)
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")
