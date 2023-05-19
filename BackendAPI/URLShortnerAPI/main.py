from flask import jsonify
import requests
import json
import os

# os.environ['PATH'] = f"{os.environ['PATH']}:{os.path.join(os.getcwd(), 'bin')}"
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "newkey.json"

def shorten_URL(request):
    """
    Function to extract the pii text frokm the given transcript
    Arg:
    input_text: Transcript for the audio (Not word level)
    requested_categories(optional): the category names which user wants to detect PII from transcript
    Default:all the categories

    Output:
    output_dictionary: 
    Key: category Name
    Value: PII text under this category
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
      request_json = request.get_json()
      url = request_json["URL"]
      
      domain = "9c6n.short.gy"
      # Create a data dictionary
      data = {
          "domain": domain,
          "originalURL": url
      }

      # Make the API request
      response = requests.post("https://api.short.io/links/public", headers={
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'authorization': 'pk_qF5vS3M4mqLpNwgg'
      }, data=json.dumps(data))
      print(response)
      # Parse the response
      short_url = response.json()['shortURL']

      output_dictionary = {"shortened_url":short_url}
      response1 = jsonify(output_dictionary)
      return (response1, 200, headers)
          
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")
