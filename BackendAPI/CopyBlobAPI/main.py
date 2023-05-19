import io
import os
import tempfile
import uuid
import subprocess
from google.cloud import storage
from urllib.parse import urlparse
from flask import jsonify

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

def copy_blob(request):
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
  request_json = request.get_json(silent=True)
  input_gs_path = request_json['input_gs_path']
  input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)

  # Create a client object.
  client = storage.Client()

  bucket = client.get_bucket(input_bucket_name)

  # Get the source blob object.
  source_blob = bucket.blob(input_video_gcs)
  destination_blob_file_name = input_video_gcs.split("/")[-1].split(".")[0] + '_copy.mp4'
  destination_blob_name = '/'.join(input_video_gcs.split('/')[0:-2]) + '/tmp_files/' + destination_blob_file_name

  # Create the destination blob object.
  blob_copy = bucket.copy_blob(
      source_blob, bucket, destination_blob_name
  )

  output_copy_video = generate_token(input_bucket_name,destination_blob_name)

  return (jsonify({"output_gs_path": f"gs://{input_bucket_name}/{destination_blob_name}","public_shared_url":output_copy_video}),200,headers)