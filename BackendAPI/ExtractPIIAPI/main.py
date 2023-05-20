from flask import jsonify
import openai
# import ast
import os
import json

# os.environ['PATH'] = f"{os.environ['PATH']}:{os.path.join(os.getcwd(), 'bin')}"
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "newkey.json"

def extract_pii(request):
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
      input_text = request_json["input_text"]
      requested_categories = request_json.get("categories")

      openai.api_key = "**********************"
      model_engine = "text-davinci-002"
    #   prompt = ("Identify all the PIIs, and return them with their categories as a dictionary with category name as keyword and value as a list. There can be multiple values in the same PII category : '{}'\n\n".format(input_text))

    #   if requested_categories:
    #       prompt += "Return PII categories: {}\n\n".format(", ".join(requested_categories))
    #   else:
    #       prompt += "Return all PII categories.\n\n"
      if requested_categories:
          categories = ','.join(requested_categories)
          prompt = f"Identify PII for the categories :{categories} and return them with their category name as a json key and value as a list for the text:{input_text}.Ensure the results are very accurate and follow the format in the strict manner. Filter off anything which does not follow the format."
      else:
          prompt = f"Identify PII for all the categories and return them with their category name as a json key and value as a list for the text:{input_text}. Ensure the results are very accurate and follow the format in the strict manner. Filter off anything which does not follow the format"
      response = openai.Completion.create(
          engine=model_engine,
          prompt=prompt,
          max_tokens=1024,
          n=1,
          stop=None,
          temperature=0.2
      )
      output = response.choices[0].text

      json_output= json.loads(output)
    #   my_string_with_apostrophes = "'''" + output + "'''"
    #   my_string_without_apostrophes = my_string_with_apostrophes.strip("'")
    #   output_dictionary = ast.literal_eval(output)
      response = jsonify(json_output)
      return (response, 200, headers)
      
    #   if requested_categories:
    #       response = jsonify({category: output_dictionary[category] for category in requested_categories if category in output_dictionary})
    #       return (response, 200, headers)      
    #   else:
    #       response = jsonify(output_dictionary)
    #       return (response, 200, headers)
          
    except Exception as e:
        raise Exception(f"An unexpected error occurred: {e}")
