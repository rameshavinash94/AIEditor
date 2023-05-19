# AIEditor

## Project Logo
![alt text](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/images/Logo.png)

## Getting Started with Create React App
This project was bootstrapped with an initial set of files and configurations using [Create React App](https://github.com/facebook/create-react-app).

## Project Architecture
![alt text](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/images/Project_architecture.png)

## Project Design
1) Login/Signup page
![alt text](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/images/Login%3ASignupPage.png)
2) EditorPage.png
![alt text](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/images/Editor%20Page.png)

## Project Featuress
1. Youtube Video Downloader
2. Automatic Transcription (Using Video Model from Google)
3. Personalized Voice Cloning and Lip Syncing
4. Speaker Diarization
5. PII Redaction (Using Text Davinci Model from OpenAI)
6. Video Concatenation
7. Modify Resolution
8. Video Trimming
9. Modify Resolution
10. Video Cutting
11. URL Shortening
12. SRT file download

## Steps to run the code

1. Deploy the Backend API folder in google cloud or create a flask applciation
  Update respective api calls
2. Set up firebase for register/login api and enable sign/in with email/password feature and Update the API keys. [Reference Link: https://console.firebase.google.com/project/aieditorv1/authentication]
3. Frontend is a React Application.
4. We have deployed Tortoise TTS and Wav2Lip model in Beam.cloud for seamless integration and scalability. [Reference link: https://docs.beam.cloud/getting-started/quickstart]
5. Get API keys for openai account and replace them in extract_pii.py file to use GPT Turbo 3.5 model. [Reference Link: https://platform.openai.com/docs/introduction]
6. To run this project simpliy clone the repo and make sure you have node installed
7. In the terminal type "npm install react-scripts" followed by "npm start" to run the react application on your localhost.

## Project Documents
1) [View project report](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/Documents/CMPE295_Project_reportv2%20(1).pdf)
2) [View project presentation](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/Documents/Project_Presentation.pdf)
3) [View project poster](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/Documents/projectPosterv1.pdf)

## Project Demo
1) [Elevator Pitch Video](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/Videos/Elevator_pitch.mp4)
2) [Project Demo](https://github.com/rameshavinash94/AIEditor/blob/nevil_test/Videos/Final_demo.mp4)

## Summary:
The effort to create an AI-based audio and video editing tool aimed to provide an all-in-one collaborative editing solution that made editing easier for users of all skill levels. The project's components included a thorough review of the state-of-the-art, a close examination of the system architecture, the application of client and data-tier technologies, performance benchmarks, and considerations for deployment, operations, and maintenance. Modern technology was added into the created solution, allowing users to modify their recordings as quickly as editing a Google Doc, including real-time voice cloning, automatic transcription, and text-to-speech conversion.
