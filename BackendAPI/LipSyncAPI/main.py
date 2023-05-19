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

def wav2lip(audio_url,video_url):
    url = url = "https://apps.beam.cloud/5m245"
    payload = {"audio_url": f"{audio_url}", "video_url": f"{video_url}"}
    headers = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate",
    "Authorization": "Basic NWZiMzYwOTIwN2JhNWI4ZDZjMmQyYTM0NDNjM2JkNzQ6OTU0NGE1NjBmMmViNDQwMzBlNjFmM2NiNWI0ZDg5OWQ=",
    "Connection": "keep-alive",
    "Content-Type": "application/json"
    }
    response = requests.request("POST", url, headers=headers, data=json.dumps(payload))
    return response.json()

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

def lip_sync(request):
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
    video_url = request_json["video_url"]
    audio_url = request_json["audio_url"]
    input_gs_path = request_json["input_gs_path"]
    input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)

    print(video_url,audio_url,input_gs_path)

    file_name = input_video_gcs.split("/")[-1].split(".")[0]
    
    #way2lip cloned video path
    cloned_video_loc  = '/'.join(input_video_gcs.split('/')[0:-2]) + '/edited_files/cloned_' + file_name + '.mp4'

    #pass to wav2lip model to trigger task hosted on beam.cloud
    output_task_id = wav2lip(audio_url,video_url)

    client = storage.Client()

    print("task_id",output_task_id)
    status = ''
    response = ''

    while (status!='COMPLETE'):
        time.sleep(5)
        response = task_status(output_task_id["task_id"])
        status = response['status']
    
    if "outputs" not in response or "output" not in response["outputs"]:
        return ("Some issues occurred", 200, headers)

    outfile_file_url = response["outputs"]["output"]

    with tempfile.TemporaryDirectory() as temp_dir:
        response = requests.get(outfile_file_url)
        # Save the zipped file to the temporary directory
        zip_path = os.path.join(temp_dir, 'output.zip')
        with open(zip_path, 'wb') as f:
            f.write(response.content)

        # Extract the contents of the zipped file to the temporary directory
        with zipfile.ZipFile(zip_path, 'r') as zip_file:
            zip_file.extractall(temp_dir)

        # output lip sync video file path 
        file_path = os.path.join(temp_dir, 'output/output.mp4')

        #upload to gcs
        video_bucket = client.get_bucket(input_bucket_name)
        output_blob = video_bucket.blob(cloned_video_loc)
        output_blob.upload_from_filename(file_path)

        #generate access token
        output_cloned_final_video = generate_token(input_bucket_name,cloned_video_loc)

        #gs path
        output_cloned_final_video_gs = f"gs://{input_bucket_name}/{cloned_video_loc}"

    response = jsonify({"output_gs_path": output_cloned_final_video_gs,"public_shared_url":output_cloned_final_video})

    return (response,200,headers)