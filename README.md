# Curio Web

Curio's first-party AI workspace, built with FastAPI, Jinja, CSS and native JavaScript modules. The model, database and authentication services remain in the separate Curio backend. No Node build step is needed.

```sh
python -m pip install -r requirements.txt
# Optional environment settings (defaults shown):
export CURIO_API_BASE=http://127.0.0.1:8001
export CURIO_WS_BASE=ws://127.0.0.1:8001
python -m uvicorn main:app --host 127.0.0.1 --port 8017
```

Use the same hostname for both servers and allow the interface origin in the backend configuration. REST requests include credentials, the session CSRF token and the existing identity header. The backend enforces authentication. When signed out, the interface permits drafting and asks for sign-in before submission. Sign-in drafts survive the authentication reload when session storage is available.

`CURIO_INTERFACE_DEVELOPMENT=true` explicitly enables the existing browser-local demo identity. The sidebar and settings identify it as a demo, not a secure account. It requires a backend that permits development mode.

## Workspace

- **Chat:** real general-mode requests, image attachments, stage/tool progress, safe Markdown, local and authenticated durable history, memory, supported voice dictation and Curio Live.
- **Work:** a separate task draft and examples. Execution, files, approvals and deliverables are unavailable. “Continue in Chat” transfers the draft without submitting it or replacing an existing Chat draft. No unsupported `work` value is sent.
- **Appearance:** CSS follows the operating system automatically, including live changes. There is no manual preference or localStorage override. Media-qualified browser theme colors and `color-scheme` match the system.

Chat and Work switching, sidebar collapse and mobile navigation do not start, stop or replace accepted runs. New Chat and conversation selection are blocked during a run. History comes from actual conversations, never sample content. The retained `/marketplace/history/conversations` and `/marketplace/conversations/{id}` backend paths are the existing authenticated conversation endpoints; no service dashboard remains.

Interview, service navigation/pages, category tabs, fictional discovery, the decorative orb and manual theme controls have been removed. General-purpose Live camera capture, dictation and voice replies remain. Camera permission is requested only after Enable camera; closing Live stops capture while an accepted question may finish in Chat. Physical device and speech-service availability vary by browser.

## Verification

```sh
python -m pip install -r requirements-test.txt
python -m pytest -q
python -m uvicorn tests.serve_browser:app --host 127.0.0.1 --port 8018
```

Open `/browser-tests` and `/theme-tests` on port 8018. These run the actual templates and production ES modules against a controlled local HTTP/SSE/WebSocket backend, isolated storage and synthetic camera/dictation. They never mount in `main.py` and never contact the real backend. The expected simulated retry error is part of the test protocol.

Test-only visual routes:

- `/__test/appearance?appearance=light` or `dark`: real backend configuration with a forced CSS palette for screenshots; no fake account or conversation data.
- `/__test/app?appearance=light` or `dark`: controlled backend, useful for active-conversation verification.

The browser tool cannot emulate OS appearance directly. Palette routes modify only test CSS media matching. Production uses the unmodified native `prefers-color-scheme` queries. Physical OS changes and physical media devices are separate manual checks.

See [design foundations](docs/design-system.md) and [current verification evidence](docs/validation.md). `test-results/` is ignored by Git and contains local screenshots/reports when generated. Older model trace JSON and archived images are historical evidence, not claims about this build.
