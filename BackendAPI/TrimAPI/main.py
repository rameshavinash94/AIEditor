import os
import tempfile
import subprocess
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

def trim(request):
    """
    Trims a video stored in GCS and returns a signed URL for the trimmed video.

    Args:
        request_json (dict): A dictionary containing the input GCS path, start and end times.

    Returns:
        dict: A dictionary containing the GCS path and signed URL of the trimmed video,
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
        start = request_json['start']
        end = request_json['end']
        
        input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)
        file_name = 'trimmed_' + input_video_gcs.split('/')[-1]
        output_video_gcs = '/'.join(input_video_gcs.split('/')[0:-2]) + '/edited_files/' + file_name
        output_gs_path = f"gs://{input_bucket_name}/{output_video_gcs}"
        
        client = storage.Client()
        bucket = client.get_bucket(input_bucket_name)
        input_blob = bucket.blob(input_video_gcs)

        with tempfile.TemporaryDirectory() as tmpdir:
            input_video_local = os.path.join(tmpdir, input_video_gcs.split("/")[-1])
            input_blob.download_to_filename(input_video_local)

            output_video_local = os.path.join(tmpdir, file_name)
            command = f'ffmpeg -i {input_video_local} -ss {start} -to {end} -c:v libx264 -c:a aac -movflags +faststart -force_key_frames "expr:gte(t,n_forced*1)" {output_video_local}'
            subprocess.run(command, shell=True, check=True)

            output_blob = bucket.blob(output_video_gcs)
            output_blob.upload_from_filename(output_video_local)

        output_video_access_token = generate_token(input_bucket_name,output_video_gcs)

        response = jsonify({"output_gs_path": output_gs_path,"public_shared_url":output_video_access_token})

        return (response, 200, headers)

    except ValueError as ve:
        return {"error": str(ve)}
    
    except KeyError as ke:
        return {"error": f"Missing required parameter: {str(ke)}"}
    
    except subprocess.CalledProcessError as cpe:
        return {"error": f"FFmpeg failed with error code {cpe.returncode}: {cpe.stderr}"}
    
    except Exception as e:
        return {"error": str(e)}