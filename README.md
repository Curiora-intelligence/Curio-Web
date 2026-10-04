# Curio Interface

First-party cookie-authenticated interface for [Curio](https://github.com/Curiora-intelligence/Curio). FastAPI serves Jinja2, CSS and native JavaScript; no Node build or model/database access occurs in this repository.

```sh
python -m pip install -r requirements.txt -r requirements-test.txt
# Set CURIO_API_BASE=http://127.0.0.1:8001 and CURIO_WS_BASE=ws://127.0.0.1:8001
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Use the same hostname for both servers and include the interface origin in the backend's allowlist. Required account sign-in is the default. Cookies use credentials and mutations attach the session CSRF token. A browser-local ID is not the security identity; explicit development mode supports legacy fixtures only.

Service chat is primary. Discover/map, provider details, structured comparison, saved services, durable requests/confirmations, notifications, history, profiles, provider and admin portals share backend data. Personal/Food/Shopping/Research/Career, Mock Interview, voice and Live remain. Uploaded images enter Qwen perception then the full GPT/tool loop. Activity lists safe backend events without hidden reasoning.

Leaflet 1.9.4 and its license are vendored. Map tiles load after an explicit button with OpenStreetMap attribution. Geolocation is requested only through Use my location. Dictation/voice playback depend on browser support; sampled Live camera and optional timing/RMS metrics retain permission controls. No raw microphone audio is uploaded to Curio.

```sh
python -m pytest -q
uvicorn tests.serve_browser:app --host 127.0.0.1 --port 8002
```

Browser checks: `/browser-tests`, `/browser-interview-tests`, `/browser-marketplace-tests`, and the marketplace route with `?page=requests`, `notifications`, `history`, `provider`, `admin`, or `saved`. Fixtures are development-only and never mounted by the production app.

[Round-2 demo and validation](docs/round2-demo.md). Backend setup, architecture, API reference and the full 39-row coverage table are in the Curio repository. Older validation/demo files describe Round-1 snapshots.
