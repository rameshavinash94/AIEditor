import os
import tempfile
import uuid
import subprocess
import logging
from google.cloud import storage
from urllib.parse import urlparse
import re
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

def mute_audio_multiple_intervals(request):

    """
    Function to mute the audio in given intervals.

    Args:
        input_gs_path (str): the gs url to the  video file    
        interval (dict): interval with start_time(key)()(string): end_time(int)(value)
    Returns:
       Returns:
        A dictionary containing the following keys:
            - output_gs_path: str, the Google Cloud Storage path to the muted audio file
            - public_shared_url: str, a publicly accessible URL to the muted audio file
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

      interval = request_json['interval']
      # start_time = 10
      # end_time = 15

      start_time = []
      for key in interval.keys():
        if isinstance(key, str):
          start_time.append(float(key))
        else:
          start_time.append(key)

      end_time = list(interval.values())

      print(start_time)
      print(end_time)
      input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)
      # video_name = input_video_gcs.split("/")[-1]
      # logging.info("Video name : %s", video_name)

      file_name = 'silenced_' + input_video_gcs.split('/')[-1].split('.')[0] + '.wav'

      output_audio_gcs = '/'.join(input_video_gcs.split('/')[0:-2]) + '/audio_files/' + file_name
      print(output_audio_gcs)
      output_gs_path = f"gs://{input_bucket_name}/{output_audio_gcs}"

      # output_video_gcs = f"{uuid.uuid4().hex}_{video_name}"
      # final_output_video_gcs = f"Silenced_Audio/{output_video_gcs}"
      # output_gs_path = f"gs://{input_bucket_name}/Silenced_Audio/{output_video_gcs}"
      

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

          for i in range(len(start_time)):
            start = start_time[i]
            end = end_time[i]
            file_name = output_video_local.split('.')[0]
            file_extension = output_video_local.split('.')[1]
            output_video_local = file_name + str(i) + '.' + file_extension
            subprocess.check_call(['ffmpeg', '-i', input_video_local, '-af', f'volume=enable=\'between(t,{start},{end})\':volume=0', output_video_local])
            input_video_local = output_video_local
            
            print(i,"input_video_local",input_video_local)
            print(i,"output_video_local",output_video_local)
          
          output_video_local1 = re.sub(r'\d+(?=\.wav$)', '', output_video_local)
          print("output_video_local1",output_video_local1)
          logging.info("The resolution change command ran successfully")
          output_blob = bucket.blob(output_audio_gcs)
          print("output_blob",output_blob)
          output_blob.upload_from_filename(output_video_local)
          output_audio_access_token = generate_token(input_bucket_name,output_audio_gcs)

          # print("output_blob",output_blob)
          response = jsonify({"output_gs_path": output_gs_path,"public_shared_url": output_audio_access_token })
          return (response, 200, headers)
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")         
    
    