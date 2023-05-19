import re
import string
from flask import jsonify
def find_silence_interval(request):

  """ 
  Function to determine silence intervals 
    #input 
    #1)word_timestamps (Format : [word, start_time, end_time, speaker label]), 
    #2) input_text(List of strings to be silenced){Values of the dictionary from extract_pii}

  Return:

  Dictionary: Start_time: key
  End_time: value
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
    request_data = request.get_json()
    input_text = request_data["input_text"]
    input_text = lowercase_lst = [s.lower() for s in input_text]
    for i, word in enumerate(input_text):
    # Remove all punctuations except ' and "
      input_text[i] = word.translate(str.maketrans('', '', string.punctuation.replace("'", '').replace('"', '')))

      
    word_timestamps = request_data["word_timestamps"]
    punctuations = string.punctuation.replace("'", "").replace('"', '')

    # Remove all punctuations except single quote and double quote

    for i in range(len(word_timestamps)):
      word = word_timestamps[i][0]
      for char in punctuations:
          word = word.replace(char, "")
      word_timestamps[i][0] = word

    word_timestamps = [[word.lower(), start_time, end_time] for word, start_time, end_time in word_timestamps]

    silence_interval = {}
    for i in range(len(input_text)):
      search_string = input_text[i]
      pattern = r'[^\w\s@.]'
      clean_string = re.sub(pattern, ' ', search_string)

      search_words = clean_string.split()
      found = False
      start_time = 0
      end_time = 0
      
      for i in range(len(word_timestamps) - len(search_words) + 1):
        if all(word_timestamps[i+j][0] == search_words[j] for j in range(len(search_words))):
          start_time = word_timestamps[i][1]
          end_time = word_timestamps[i + len(search_words) - 1][2]
          found = True
          break
      silence_interval[start_time] = end_time
    response = jsonify(silence_interval)
    return (response, 200, headers)
  except Exception as e:
      raise Exception(f"An unexpected error occurred: {e}")