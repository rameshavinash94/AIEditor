import os
from google.cloud import storage
import tempfile
import uuid
import subprocess
from google.cloud import storage
from urllib.parse import urlparse
from tempfile import TemporaryDirectory
from google.cloud import speech
from flask import jsonify 
from pydub import AudioSegment
import requests
import io

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

def get_audio_duration(url):
    # Download audio file from URL and load it into an AudioSegment object
    audio_file = requests.get(url)
    audio = AudioSegment.from_file(io.BytesIO(audio_file.content))
    # Get audio duration in seconds
    audio_duration = audio.duration_seconds

    return audio_duration

def add_non_speech_intervals(word_timestamps, min_silence_duration, end_duration):
    non_speech_timestamps = []
    previous_end_time = 0
    
    for word, start_time, end_time in word_timestamps:
        # Insert a "non-speech" interval between the previous end time and the current start time
        if start_time > previous_end_time + (min_silence_duration / 1000):
            non_speech_interval = ("~" * 10, previous_end_time, start_time)
            non_speech_timestamps.append(non_speech_interval)
        
        # Append the speech interval
        speech_interval = (word, start_time, end_time)
        non_speech_timestamps.append(speech_interval)
        
        # Update the previous end time
        previous_end_time = end_time
        
    # Insert a final "non-speech" interval between the last end time and the end of the audio
    end_duration_seconds = (end_duration/1000)
    if previous_end_time < end_duration_seconds:
        if end_duration_seconds > previous_end_time + (min_silence_duration / 1000):
            non_speech_interval = ("~" * 10, previous_end_time, end_duration_seconds)
            non_speech_timestamps.append(non_speech_interval)

    return non_speech_timestamps

def transcribe_audio(request):
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
    frame_rate = int(input_gs_path.split('/')[-1].split('_')[0])
    input_bucket_name, input_video_gcs = extract_bucket_and_video(input_gs_path)

    #generate accees token
    tmp_token = generate_token(input_bucket_name,input_video_gcs)

    #get audio duration
    audio_duration = get_audio_duration(tmp_token) * 1000

    if not input_gs_path:
        return 'Please provide a valid uri.'

    client = speech.SpeechClient()

    audio = speech.RecognitionAudio(uri=input_gs_path)
    diarization_config = speech.SpeakerDiarizationConfig(
    enable_speaker_diarization=True,
    min_speaker_count=1,
    max_speaker_count=10,
)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code="en-US",
        sample_rate_hertz = frame_rate,
        audio_channel_count=1,
        enable_word_time_offsets=True,
        enable_spoken_punctuation=True,
        enable_spoken_emojis=True,
        enable_automatic_punctuation = True,
        max_alternatives=1,
        model= "video",
        speech_contexts=[speech.SpeechContext(phrases=['Hmm','hmm','uhm','uh','um','ah','like','you know','so','actually','basically','literally','really','very','pretty','stuff','things','kinda','sorta','maybe','perhaps','right','okay','ok','alright','well','anyway','anyways','anyhow','anyhows','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos','anyways','anyway','anyways','anywho','anywhoo','anywhos'])]
    )

    operation = client.long_running_recognize(config=config, audio=audio)
    response = operation.result(timeout=90)
    transcript = ''
    word_timestamps = []
    for result in response.results:
        transcript += result.alternatives[0].transcript
        for word_info in result.alternatives[0].words:
          word = word_info.word
          start_time = word_info.start_time
          end_time = word_info.end_time
          word_timestamps.append((word,start_time.total_seconds(),end_time.total_seconds()))

    final_word_timestamps = add_non_speech_intervals(word_timestamps,min_silence_duration=1000,end_duration=audio_duration)

    response = jsonify({"transcript": transcript, "word_timestamps": final_word_timestamps})
    return (response, 200, headers)