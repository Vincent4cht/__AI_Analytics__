<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# AI Analytics

This project is a React + Express app that can be run locally or deployed to a standard Node.js host such as Render.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy the `.env.example` file to `.env` and update it with your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and replace `your_gemini_api_key_here` with your actual API key from https://ai.google.dev/
3. Run the app in development:
   `npm run dev`
   The app will be available at `http://localhost:3000`

## Build and Run for Production

1. Build the frontend and server bundle:
   `npm run build`
2. Start the production server:
   `npm start`

## Deploy to Render

- Set `GEMINI_API_KEY` in Render environment variables.
- Render will provide a `PORT` value automatically.
- Use `npm run build` in the build step and `npm start` in the start command.
