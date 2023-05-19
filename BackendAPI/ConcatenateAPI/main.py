import argparse
from google.cloud.video import transcoder_v1
from google.cloud.video.transcoder_v1.services.transcoder_service import (
    TranscoderServiceClient,
) 
from google.protobuf import duration_pb2 as duration
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

def create_job_with_concatenated_inputs(
    project_id,
    location,
    input1_uri,
    start_time_input1,
    end_time_input1,
    input2_uri,
    input3_uri,
    start_time_input3,
    output_uri,
):
    """Creates a job based on an ad-hoc job configuration that concatenates two input videos.

    Args:
        project_id (str): The GCP project ID.
        location (str): The location to start the job in.
        input1_uri (str): Uri of the first video in the Cloud Storage bucket.
        start_time_input1 (str): Start time, in fractional seconds ending in 's'
          (e.g., '0s'), relative to the first input video timeline.
        end_time_input1 (str): End time, in fractional seconds ending in 's'
          (e.g., '8.1s'), relative to the first input video timeline.
        input2_uri (str): Uri of the second video in the Cloud Storage bucket.
        start_time_input2 (str): Start time, in fractional seconds ending in 's'
          (e.g., '3.5s'), relative to the second input video timeline.
        end_time_input2 (str): End time, in fractional seconds ending in 's'
          (e.g., '15s'), relative to the second input video timeline.
        output_uri (str): Uri of the video output folder in the Cloud Storage
          bucket."""

    s1 = duration.Duration()
    s1.FromJsonString(start_time_input1)
    e1 = duration.Duration()
    e1.FromJsonString(end_time_input1)

    # s2 = duration.Duration()
    # s2.FromJsonString(start_time_input2)
    # e2 = duration.Duration()
    # e2.FromJsonString(end_time_input2)

    s3 = duration.Duration()
    s3.FromJsonString(start_time_input3)

    client = TranscoderServiceClient()

    parent = f"projects/{project_id}/locations/{location}"
    job = transcoder_v1.types.Job()
    job.output_uri = output_uri
    job.config = transcoder_v1.types.JobConfig(
        inputs=[
            transcoder_v1.types.Input(
                key="input1",
                uri=input1_uri,
            ),
            transcoder_v1.types.Input(
                key="input2",
                uri=input2_uri,
            ),
            transcoder_v1.types.Input(
                key="input3",
                uri=input3_uri,
            )
        ],
        edit_list=[
            transcoder_v1.types.EditAtom(
                key="atom1",
                inputs=["input1"],
                start_time_offset=s1,
                end_time_offset=e1,
            ),
            transcoder_v1.types.EditAtom(
                key="atom2",
                inputs=["input2"],
            ),
            transcoder_v1.types.EditAtom(
                key="atom3",
                inputs=["input3"],
                start_time_offset=s3,
            )
        ],
        elementary_streams=[
            transcoder_v1.types.ElementaryStream(
                key="video-stream0",
                video_stream=transcoder_v1.types.VideoStream(
                    h264=transcoder_v1.types.VideoStream.H264CodecSettings(
                        height_pixels=480,
                        width_pixels=854,
                        bitrate_bps=550000,
                        frame_rate=60,
                    ),
                ),
            ),
            transcoder_v1.types.ElementaryStream(
                key="audio-stream0",
                audio_stream=transcoder_v1.types.AudioStream(
                    codec="aac", bitrate_bps=64000
                ),
            ),
        ],
        mux_streams=[
            transcoder_v1.types.MuxStream(
                key="sd",
                container="mp4",
                elementary_streams=["video-stream0", "audio-stream0"],
            ),
        ],
    )
    response = client.create_job(parent=parent, job=job)
    print(f"Job: {response.name}")
    return response

def get_job_state(job_name):
    """Gets a job's state.
    Args:
        project_id: The GCP project ID.
        location: The location this job is in.
        job_id: The job ID."""

    client = TranscoderServiceClient()
    response = client.get_job(name=job_name)

    # print(f"Job state: {str(response.state)}")
    return response

def merge(request):
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
    input1_gs_path = request_json['input1_gs_path']
    input2_gs_path = request_json['input2_gs_path']
    replace_start = request_json['replace_start']
    replace_end = request_json['replace_end']
    input_bucket_name, input_video_gcs = extract_bucket_and_video(input1_gs_path)

    #file name
    file_name = input_video_gcs.split("/")[-1].split(".")[0]

    #file extension
    extension = input_video_gcs.split(".")[1]

    #Transcoder API final output gs path
    transcoder_final = '/'.join(input_video_gcs.split('/')[0:-2]) + '/edited_files/'
    transcoder_final_gs = f"gs://{input_bucket_name}/" + '/'.join(input_video_gcs.split('/')[0:-2]) + '/edited_files/'

    #copy complete path
    copy_complete_file_name = '/'.join(input_video_gcs.split('/')[0:-2]) + '/tmp_files/' + file_name

    #video copy gs path
    input_copy_path = f"gs://{input_bucket_name}/{copy_complete_file_name}_copy.{extension}"

    # call the transcoder job
    transcoder_job = create_job_with_concatenated_inputs(
    "aieditor-383809",
    "us-west2",
    input1_gs_path,
    "0s",
    f"{replace_start}s",
    input2_gs_path,
    input_copy_path,
    f"{replace_end}s",
    transcoder_final_gs)
    transcoder_job_name = transcoder_job.name
    transcoder_job_state = -1

    print(transcoder_job_name)

    while transcoder_job_state not in [3, 4]:
      transcoder_job_state = get_job_state(transcoder_job_name).state
      print(transcoder_job_state)
      time.sleep(2)

    if transcoder_job_state==4:
      return ("some error occured",200,headers)
    
    #generate access token
    output_final_video = generate_token(input_bucket_name,f"{transcoder_final}sd.mp4")

    print(output_final_video)

    #gs path
    output_final_video_gs = f"gs://{input_bucket_name}/{transcoder_final}sd.mp4"

    response = jsonify({"output_gs_path": output_final_video_gs,"public_shared_url":output_final_video})
    return (response,200,headers)