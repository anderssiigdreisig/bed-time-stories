# Bedtime Stories

A locally hosted web app for creating personalized bedtime stories for my daughter. The frontend will use React, with a Python backend that calls the OpenAI API to generate stories and uses SQLite to store stories and app data.

## Goals

- Generate a new bedtime story from a prompt or a few story preferences.
- Make stories easy to read in a responsive web interface at home, including on a phone.
- Keep story data in a local SQLite database.

## Planned Technology

- React for the web frontend
- FastAPI for the Python backend
- OpenAI API for story generation
- SQLite for local data storage

## Status

This project is under development. Setup and run instructions will be added when the application structure is in place.

## Backend

The FastAPI backend exposes `GET /api/health` and `POST /api/generate`. The generate endpoint accepts a prompt and optional `skill` instructions and `context`, then returns the model reply. OpenAPI documentation is available at `/docs` while the server is running.

Configure `OPENAI_API_KEY` in the environment before starting the server. OpenAI API usage may require billing; a ChatGPT subscription does not include API usage. OpenAI-compatible providers can be configured with `OPENAI_BASE_URL` and `OPENAI_MODEL`. If using a local provider that does not require authentication, setting `OPENAI_BASE_URL` is sufficient.

Run the API locally with:

```bash
uv sync
export OPENAI_API_KEY="your-api-key"
uv run uvicorn bed_time_stories.main:app --host 0.0.0.0 --reload
```

Run the tests with `uv run pytest`.

## Frontend

The React frontend lives in `frontend/`. Start the backend in one terminal, then start Vite in another:

```bash
uv run uvicorn bed_time_stories.main:app --reload
cd frontend
npm install
npm run dev
```

Vite proxies `/api` requests to FastAPI at `http://127.0.0.1:8000`. Its development server listens on the local network so you can open the frontend on a phone connected to the same Wi-Fi. Allow port `5173` through the PC firewall for your private network only.

## Home Network Access

The app is intended to run on a home PC and be accessible from a phone on the same Wi-Fi network. The PC will host the FastAPI backend and the built React frontend. The phone's browser will load the interface from the PC and send requests to the backend; SQLite and the OpenAI API key will remain on the PC.

The backend will need to listen on the PC's local network interface, and the PC firewall should allow access only on the private home network. Use the PC's local network address to open the app on a phone. Do not expose the app with router port forwarding. For access away from home, use a private VPN rather than making the app public. A simple sign-in or PIN may be added to restrict access to people on the Wi-Fi network.

## Privacy

Stories and app data are intended to be stored locally. Story generation sends prompts to the OpenAI API, so avoid including identifying or otherwise sensitive information. Keep API credentials on the backend and out of source control.
