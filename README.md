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

- **Chat:** real general-mode requests, image attachments, stage/tool progress, safe Markdown, local and authenticated durable history, memory, supported voice dictation and Curio Speak.
- **Work:** a separate task draft and examples. Execution, files, approvals and deliverables are unavailable. “Open desktop app” is disabled with an explanation until a verified launch or download destination is supplied. Chat and Work drafts remain independent. No unsupported `work` value is sent.
- **Appearance:** CSS follows the operating system automatically, including live changes. There is no manual preference or localStorage override. Media-qualified browser theme colors and `color-scheme` match the system.

Chat and Work switching, sidebar collapse and mobile navigation do not start, stop or replace accepted runs. New Chat and conversation selection are blocked during a run. History comes from actual conversations, never sample content. The retained `/marketplace/history/conversations` and `/marketplace/conversations/{id}` backend paths are the existing authenticated conversation endpoints; no service dashboard remains.

Interview, service navigation/pages, category tabs, fictional discovery, the decorative orb and manual theme controls have been removed. The compact Chat composer shows Curio Speak when empty and Send when text or an image is present, in the same trailing position. Curio Speak uses the verified voice-only transcript contract on the existing `/live/ws/{user_id}` endpoint. The independent neutral microphone dictates editable text into Chat or Work without sending. Dictation also remains available inside Speak; sending is explicit. Optional browser speech synthesis provides spoken replies. There is no camera access or raw audio streaming in Web. Closing Speak stops dictation while an accepted answer may finish in Chat. Physical microphone and speech-service availability vary by browser.

The plus button opens a flat capability menu; only **Add photos & files** opens the picker. Chat supports JPEG, PNG, WebP and GIF up to 15 MB. Library, image generation, direct web search, GitHub and Gmail remain visibly unavailable until their interface integrations are verified. Work uploads remain unavailable. Optional backend web tools do not establish a working direct menu action.

The top-right **Temporary chat** control is an unavailable UI shell. Its tooltip explains that chats continue to use normal history and memory; it does not start a private session or change retention.

The compact Low / Medium / High selector defaults to Medium and persists the same preference across Chat, Work and reloads. It explicitly states that the preference is **not applied to responses yet**: the inspected backend has no supported request field for thinking effort. No quota or context-size claims are made.

## Verification

```sh
python -m pip install -r requirements-test.txt
python -m pytest -q
node --test tests/placeholder.test.mjs
python -m uvicorn tests.serve_browser:app --host 127.0.0.1 --port 8018
```

Open `/browser-tests` and `/theme-tests` on port 8018. These run the actual templates and production ES modules against a controlled local HTTP/SSE/WebSocket backend, isolated storage and synthetic dictation. They never mount in `main.py` and never contact the real backend. The expected simulated retry error is part of the test protocol.

Test-only visual routes:

- `/__test/appearance?appearance=light` or `dark`: real backend configuration with a forced CSS palette for screenshots; no fake account or conversation data.
- `/__test/app?appearance=light` or `dark`: controlled backend, useful for active-conversation verification.

The browser tool cannot emulate OS appearance directly. Palette routes modify only test CSS media matching. Production uses the unmodified native `prefers-color-scheme` queries. Physical OS changes and physical media devices are separate manual checks.

See [design foundations](docs/design-system.md) and [current verification evidence](docs/validation.md). `test-results/` is ignored by Git and contains local screenshots/reports when generated. Older model trace JSON and archived images are historical evidence, not claims about this build.

## Deployment assets

The page references `/static/v-<content-hash>/…` URLs. The hash covers names and contents of all static files; relative ES-module imports inherit the same version directory. Changed CSS or JavaScript therefore changes the whole asset URL namespace, without a bundler. HTML and legacy unversioned asset URLs use `Cache-Control: no-cache`; current versioned assets use a year-long immutable cache. A conditional `304 Not Modified` is normal successful validation. Missing files and obsolete version URLs return `404`.

Deploy the static tree atomically with the templates. Do not mutate files within a running release during a page load. An already-open tab may need a reload after deployment if it has not fetched all modules; retain previous release assets at the proxy/CDN if seamless overlap is required. Hashes are computed from current disk contents so local edits also invalidate URLs. The asset helper only changes frontend static serving; Curio API routes are unchanged.

## Desktop handoff

No verified desktop URI scheme, launch URL or download destination exists in the inspected local Curiora projects. To activate `#open-desktop`, supply the actual registered native URL scheme or official HTTPS destination, then wire it in the existing Work partial/module and test it on supported operating systems. No guessed URL or automatic transfer to Chat is configured.
