import os
import subprocess
import tempfile
import uuid
from google.cloud import storage
from urllib.parse import urlparse
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

def cuts(request):
    """
    Trims multiple segments from a video stored in GCS and returns a signed URL for the edited video.

    Args:
        request_json (dict): A dictionary containing the input GCS path and segments to remove.

    Returns:
        dict: A dictionary containing the GCS path and signed URL of the edited video,
            or an error message if an error occurred.
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
        segments_to_remove = request_json['segments_to_remove']
        
        def generate_filter_complex(segments):
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

        input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)
        file_name = 'cuts_' + input_video_gcs.split('/')[-1]
        output_video_gcs = '/'.join(input_video_gcs.split('/')[0:-2]) + '/edited_files/' + file_name
        output_gs_path = f"gs://{input_bucket_name}/{output_video_gcs}"

        client = storage.Client()
        bucket = client.get_bucket(input_bucket_name)
        input_blob = bucket.blob(input_video_gcs)

        with tempfile.TemporaryDirectory() as tmpdir:
            input_video_local = os.path.join(tmpdir, input_video_gcs.split("/")[-1])
            input_blob.download_to_filename(input_video_local)

            output_video_local = os.path.join(tmpdir, file_name)
            filter_complex = generate_filter_complex(segments_to_remove)
            command = f'ffmpeg -i {input_video_local} -filter_complex "{filter_complex}" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -movflags +faststart {output_video_local}'
            subprocess.run(command, shell=True, check=True)

            output_blob = bucket.blob(output_video_gcs)
            output_blob.upload_from_filename(output_video_local)
        
        output_video_access_token = generate_token(input_bucket_name,output_video_gcs)

        response = jsonify({"output_gs_path": output_gs_path,"public_shared_url":output_video_access_token})

        return (response, 200, headers)

    except Exception as e:
        return {"error": str(e)}