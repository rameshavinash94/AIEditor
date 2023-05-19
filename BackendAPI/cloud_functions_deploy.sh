# Set your project ID and region
PROJECT_ID="aieditorv1"
REGION="us-west2"

# Set the Cloud Storage bucket name where you uploaded the zip files
BUCKET_NAME="clound_functions_api"

# Sample Example - Create and deploy each Cloud Function with entrypoint specified
gcloud functions deploy transcribe_audio \
  --project $PROJECT_ID \
  --region $REGION \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point transcribe_audio \
  --timeout 480s \
  --set-env-vars GOOGLE_FUNCTION_NAME=main.py \
  --service-account avinash@aieditorv1.iam.gserviceaccount.com \
  --source gs://$BUCKET_NAME/CloudFunctionsZip/TranscribeAPI.zip