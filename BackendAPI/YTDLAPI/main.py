import os
import tempfile
import uuid
import subprocess
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

def youtube_downloader(request):
  """
    Downloads a YouTube video and uploads it to a Google Cloud Storage bucket.
    
    Args:
        request_json (dict): A dictionary containing the following keys:
            - URL (str): The URL of the YouTube video to download.
            - input_gs_path (str): The Google Cloud Storage path of the input video.
    
    Returns:
        dict: A dictionary containing the following keys:
            - output_gs_path (str): The Google Cloud Storage path of the output video.
            - public_shared_url (str): A signed URL that can be used to access the output video.
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
    url = request_json['URL']
    input_gs_path = request_json['input_gs_path']
    input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)
    file_name = input_video_gcs.split('/')[-1]
    output_video_gcs = '/'.join(input_video_gcs.split('/')[0:-2]) + '/source_files/' + file_name
    output_gs_path = f"gs://{input_bucket_name}/{output_video_gcs}"
    
    client = storage.Client() 
    bucket = client.get_bucket(input_bucket_name)
    
    with tempfile.TemporaryDirectory() as tmpdir:
          output_video_local = os.path.join(tmpdir, file_name)
          command = f'yt-dlp -f "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[ext=mp4]" --merge-output-format mp4 -o "{output_video_local}" "{url}"'
          # result = subprocess.run(command, shell=True, capture_output=True)
          process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
          output, error = process.communicate()
                  
          output_blob = bucket.blob(output_video_gcs)
          
          output_blob.upload_from_filename(output_video_local)

          #output shared signed access token
          output_video = generate_token(input_bucket_name,output_video_gcs)
    
    response = jsonify({"output_gs_path": output_gs_path,"public_shared_url":output_video})
    return (response, 200, headers)
        
  except Exception as e:
    return {"errror": str(e)}