# Form Check

Form Check is a personal project that will be a weightlifting form analyzing web application, allowing users to upload videos of their weightlifting form ( from the front and side angles ), and using AI to analyze their form / provide feedback on form improvements.

The various phases of this project will include:

## Phase 1 - POC

The simplest, fastest implementation that utilizes AI - a front-end react app built with vite that will
- allow users to upload a max 30 second video in .mov/.mp4
- allow users to preview the video
- allow users to submit the video, which will
    - extract frames from video in intervals
    - convert frames to base64 images
    - send key frames to a lambda function which will
    - proxy request to claude api to keep api key secure
    - display claude response in ui
- deploy to AWS ( likely S3, CloudFront, API Gateway along with Lambda )
- optimize by limiting frame count to 10 frames max, and compare results
- add client-side video validation for size / format
- verify that the UI is mobile friendly, and well tested

## Phase 2 - User authentication

If Phase 1 is worth using, then Phase 2 will expand on it by adding a back-end in Python that allows users to register and log in. 

## Phase 3 - Form Check AI Enhancements

Investigate what steps can be taken to enhance the quality of form feedback, such as utilizing a RAG system. Consider adding in a Chat feature, and persisting user history as part of the context provided to the AI. 