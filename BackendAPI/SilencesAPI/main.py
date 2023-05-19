import os
import tempfile
import uuid
import subprocess
from google.cloud import storage
from urllib.parse import urlparse
import re
from pydub import AudioSegment, silence
from flask import jsonify 

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

def generate_filter_complex(segments):
    """
    Generates the filter_complex string for the FFmpeg command, used to remove silence segments from a video.
    
    Args:
        segments (list): A list of dictionaries containing the 'start' and 'end' times of silence segments to remove from the video.
                         Example: [{'start': 5.0, 'end': 10.0}, {'start': 20.0, 'end': 25.0}]

    Returns:
        str: The filter_complex string to be used in the FFmpeg command.
    """
    filter_complex = ''
    segment_count = len(segments) + 1
    
    for i in range(segment_count):
        if i == 0:
            filter_complex += f'[0:v]trim=start=0:end={segments[i]["start"]},setpts=PTS-STARTPTS[v{i}];'
            filter_complex += f'[0:a]atrim=start=0:end={segments[i]["start"]},asetpts=PTS-STARTPTS[a{i}];'
        elif i < segment_count - 1:
            filter_complex += f'[0:v]trim=start={segments[i-1]["end"]}:end={segments[i]["start"]},setpts=PTS-STARTPTS[v{i}];'
            filter_complex += f'[0:a]atrim=start={segments[i-1]["end"]}:end={segments[i]["start"]},asetpts=PTS-STARTPTS[a{i}];'
        else:
            filter_complex += f'[0:v]trim=start={segments[i-1]["end"]},setpts=PTS-STARTPTS[v{i}];'
            filter_complex += f'[0:a]atrim=start={segments[i-1]["end"]},asetpts=PTS-STARTPTS[a{i}];'
            
    filter_complex += ''.join(f'[v{i}][a{i}]' for i in range(segment_count))
    filter_complex += f'concat=n={segment_count}:v=1:a=1[outv][outa]'

    return filter_complex

def detect_silences(audiofile_loc,silence_threshold=-50,min_silence_duration=1000):
  print(audiofile_loc,silence_threshold,min_silence_duration)
  # Load the audio file
  audio_file = audiofile_loc
  audio = AudioSegment.from_wav(audio_file)

  # Extract the silent intervals
  silent_intervals = silence.detect_silence(audio, min_silence_len=min_silence_duration, silence_thresh=silence_threshold)

  segments = [
                {'start': ele[0]/1000, 'end': ele[1]/1000} for ele in silent_intervals
            ]
  print(segments)

  return segments

def remove_silence(request):
    """
    This function removes silence segments from a video stored in Google Cloud Storage (GCS) and saves the edited video in GCS.

    Args:
        request_json (dict): A dictionary containing the 'input_gs_path' of the video to be processed.

    Returns:
        dict: A dictionary containing the 'output_gs_path' and 'public_shared_url' of the edited video.
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
        silence_threshold = -50
        min_silence_duration = 1000
        input_gs_path = request_json['input_gs_path']
        if silence_threshold in request_json:
          silence_threshold = request_json['silence_threshold']
        if min_silence_duration in request_json:
          min_silence_duration = request_json['min_silence_duration']

        input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)
        file_name = 'silences_' + input_video_gcs.split('/')[-1]
        output_video_gcs = '/'.join(input_video_gcs.split('/')[0:-2]) + '/edited_files/' + file_name
        output_gs_path = f"gs://{input_bucket_name}/{output_video_gcs}"

        client = storage.Client()
        bucket = client.get_bucket(input_bucket_name)
        input_blob = bucket.blob(input_video_gcs)

        with tempfile.TemporaryDirectory() as tmpdir:
            input_video_local = os.path.join(tmpdir, input_video_gcs.split("/")[-1])
            input_blob.download_to_filename(input_video_local)
            tmp_audio_file = os.path.join(tmpdir,"input_audio.wav")

            output_video_local = os.path.join(tmpdir, file_name)

            command = f"ffmpeg -i {input_video_local} -vn -c:a pcm_s16le {tmp_audio_file}"
            result = subprocess.run(command, shell=True, stderr=subprocess.PIPE, text=True)

            silent_intervals  = detect_silences(tmp_audio_file,silence_threshold,min_silence_duration)

            if not silent_intervals:
                return {"message": "No silences found in the video. No changes were made."}

            filter_complex = generate_filter_complex(silent_intervals)

            command = f'ffmpeg -i {input_video_local} -filter_complex "{filter_complex}" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -movflags +faststart {output_video_local}'
            subprocess.run(command, shell=True, check=True)

            output_blob = bucket.blob(output_video_gcs)
            output_blob.upload_from_filename(output_video_local)
        
        output_video_access_token = generate_token(input_bucket_name,output_video_gcs)

        response = jsonify({"output_gs_path": output_gs_path,"public_shared_url":output_video_access_token})
        return (response,200,headers)

    except KeyError as e:
        raise KeyError(f"Key not found in request_json: {e}")

    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")