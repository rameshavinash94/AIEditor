import os
import base64
import requests
import json
import time
import tempfile
from google.cloud import storage
from urllib.parse import urlparse
from tempfile import TemporaryDirectory
import zipfile
import subprocess
from flask import jsonify

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "aieditorv1-aab20db3d78f.json"

def extract_bucket_and_video(gs_path):
    parsed_uri = urlparse(gs_path)
    if not parsed_uri.scheme == 'gs':
        raise ValueError("Invalid GCS URI. Make sure it starts with 'gs://'")
    bucket_name = parsed_uri.netloc
    video = parsed_uri.path.strip('/')
    return bucket_name, video

def generate_token(input_bucket_name,input_video_gcs):
    client = storage.Client()
    input_bucket = client.get_bucket(input_bucket_name)
    blob = input_bucket.blob(input_video_gcs)
    access_token = blob.generate_signed_url(version='v4', expiration=6000)
    return access_token

def totoise_tts_v1(text,audio_url):
    url = "https://apps.beam.cloud/ibedm"
    payload = {"text": f"{text}", "preset": "standard", "audio_url": f"{audio_url}"}
    headers = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Authorization": "Basic NWZiMzYwOTIwN2JhNWI4ZDZjMmQyYTM0NDNjM2JkNzQ6OTU0NGE1NjBmMmViNDQwMzBlNjFmM2NiNWI0ZDg5OWQ=",
    "Connection": "keep-alive",
    "Content-Type": "application/json"
    }

    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))

    return response.json()["task_id"]

def task_status(task_id):
    payload = {"action": "retrieve","task_id": f"{task_id}"}
    url = "https://api.slai.io/beam/task"
    headers = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Authorization": "Basic NWZiMzYwOTIwN2JhNWI4ZDZjMmQyYTM0NDNjM2JkNzQ6OTU0NGE1NjBmMmViNDQwMzBlNjFmM2NiNWI0ZDg5OWQ=",
    "Connection": "keep-alive",
    "Content-Type": "application/json"
    }
    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
    return response.json()

def clone_voice(request):
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
    input_text = request_json['input_text']
    input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)

    file_name = input_video_gcs.split("/")[-1]

    print(file_name)

    #generate audio access token
    audio_access_token = generate_token(input_bucket_name,input_video_gcs)

    print(audio_access_token)

    #call tortoise model on beam.cloud
    tortoise_output = totoise_tts_v1(input_text,audio_access_token)

    #cloned audio path
    cloned_audio_recording_loc = '/'.join(input_video_gcs.split('/')[0:-2]) + '/audio_files/cloned_' + file_name

    tortoise_status=''
    tts_response = ''

    while (tortoise_status!='COMPLETE'):
        time.sleep(5)
        tts_response = task_status(tortoise_output)
        tortoise_status = tts_response['status']
    
    tortoise_file_url = tts_response["outputs"]["cloned_voice"]

    print(tortoise_file_url)

    with tempfile.TemporaryDirectory() as temp_dir:
        response = requests.get(tortoise_file_url)
        # Save the zipped file to the temporary directory
        zip_path = os.path.join(temp_dir, 'cloned_voice.zip')
        with open(zip_path, 'wb') as f:
            f.write(response.content)

        # Extract the contents of the zipped file to the temporary directory
        with zipfile.ZipFile(zip_path, 'r') as zip_file:
            zip_file.extractall(temp_dir)

        # output tortoise file path 
        tortoise_file_path = os.path.join(temp_dir, 'cloned_voice/generated-audio.wav')

        print(tortoise_file_path)

        #write audio file to google cloud storage bucket
        client = storage.Client()
        bucket = client.get_bucket(input_bucket_name)
        cloned_voice_blob = bucket.blob(cloned_audio_recording_loc)
        cloned_voice_blob.upload_from_filename(tortoise_file_path)

    #generate access_token for the cloned voice
    cloned_voice_access_token = generate_token(input_bucket_name,cloned_audio_recording_loc)

    #gs path
    output_final_cloned_gs = f"gs://{input_bucket_name}/{cloned_audio_recording_loc}"

    response = jsonify({"output_gs_path": output_final_cloned_gs,"public_shared_url":cloned_voice_access_token})
    return (response,200,headers)