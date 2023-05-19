from pydub import AudioSegment
import io
import os
import wave
from google.cloud import storage
import os
import tempfile
import uuid
import subprocess
from google.cloud import storage
from urllib.parse import urlparse
from tempfile import TemporaryDirectory
from flask import jsonify

def stereo_to_mono(audio_file_name):
    sound = AudioSegment.from_wav(audio_file_name)
    sound = sound.set_channels(1)
    sound.export(audio_file_name, format="wav")

def frame_rate_channel(audio_file_name):
    with wave.open(audio_file_name, "rb") as wave_file:
        frame_rate = wave_file.getframerate()
        channels = wave_file.getnchannels()
        return frame_rate,channels


os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "aieditorv1-aab20db3d78f.json"
os.environ['PATH'] = f"{os.environ['PATH']}:{os.path.join(os.getcwd(), 'bin')}"

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

def extract_audio(request):
    """
    Extracts audio from a video file stored in Google Cloud Storage.

    Args:
        request: HTTP request containing JSON payload with the following keys:
            - input_gs_path: str, the Google Cloud Storage path to the input video file

    Returns:
        A dictionary containing the following keys:
            - output_gs_path: str, the Google Cloud Storage path to the extracted audio file
            - public_shared_url: str, a publicly accessible URL to the extracted audio file
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

      input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)
      file_name = 'audio_' + input_video_gcs.split('/')[-1].split('.')[0] + '.wav'

      client = storage.Client()
      input_bucket = client.get_bucket(input_bucket_name)
      input_blob = input_bucket.blob(input_video_gcs)

      with TemporaryDirectory() as tmpdir:
          input_video_local = os.path.join(tmpdir, input_video_gcs.split("/")[-1])
          output_audio_local = os.path.join(tmpdir, file_name)

          input_blob.download_to_filename(input_video_local)

          command = f'ffmpeg -i {input_video_local} -vn -c:a pcm_s16le {output_audio_local}'
          subprocess.run(command, shell=True, check=True)
          
          frame_rate,channels = frame_rate_channel(output_audio_local)

          if channels > 1:
            stereo_to_mono(output_audio_local)

          output_audio_gcs = '/'.join(input_video_gcs.split('/')[0:-2]) + f'/audio_files/{frame_rate}_' + file_name
          output_gs_path = f"gs://{input_bucket_name}/{output_audio_gcs}"

          output_blob = input_bucket.blob(output_audio_gcs)
          output_blob.upload_from_filename(output_audio_local)
      
      output_audio_access_token = generate_token(input_bucket_name,output_audio_gcs)
      response = jsonify({"output_gs_path": output_gs_path,"public_shared_url":output_audio_access_token})
      return (response, 200, headers)

    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")