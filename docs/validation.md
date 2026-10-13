# Visual refinement verification — 14 October 2026

Original checkout: `/Users/saiganeshsattenapalli/my projects/Curiora/Curio-Web`.
Branch: `round2-service-resolution`. Baseline: `d07c25e` (`UI rebuild`). The checkout was clean before this refinement. No worktree, clone, commit or push was created.

## Implemented

- Neutral dark tokens (`#0b0b0d` canvas, `#111113` sidebar, `#1b1b1e` composer) and Campus light/system typography. Native CSS appearance queries remain automatic.
- Slim, single-row Chat composer with multiline growth, attachments, dictation and Curio Speak. Campus typing/deleting placeholder behavior has focus, input, IME, dictation, reduced-motion, visibility and page-lifecycle guards.
- Voice-only Speak uses the verified existing WebSocket `configure` / `transcript` / `response` contract. Camera UI, camera permission requests and sampled frames are removed from Web. Internal `live-*` DOM hooks and `/live/ws` naming are retained to avoid changing the backend contract.
- Permanent connection badges, background health polling, profile gear and Work-to-Chat transfer are removed. Profile settings remain accessible. Work preserves its draft and honestly disables desktop launch until a verified destination exists.
- Routine recognition interruptions are quiet. Permission/device failures use contextual text; attachment errors remain dismissible without changing composer position. Chat's existing failed-request/retry flow is retained.
- Content-versioned static paths cover CSS and the entire native ES-module dependency tree. HTML and legacy URLs revalidate; versioned assets are immutable. `main.py` and the home router change only to support these frontend assets.

## Missing-script finding

Git commit `a3bce8c` deleted `static/js/marketplace.js`; `d07c25e` already had no production import of it. Searches of current templates and production JavaScript found no remaining reference. The final browser run made no request for the deleted script and loaded the complete versioned module tree successfully. The exact source of the historical request is not proven. No obsolete Marketplace implementation was restored.

The Python suite renders the actual page and verifies every current static asset returns 200. Conditional requests produce 304, which is normal cache validation. An explicit request for the intentionally deleted script correctly remains 404; the application should never issue it. Unknown old asset-version paths also intentionally return 404 rather than serving changed bytes as immutable content.

## Tests actually executed

| Check | Result |
| --- | --- |
| `python -m pytest -q` | 7 passed |
| `node --test tests/placeholder.test.mjs` | 6 passed |
| `/browser-tests` | 52 passed against controlled REST/SSE/WebSocket and dictation fixtures |
| `/theme-tests` | 162 passed, light/dark at 390, 768, 1024 and 1440px |
| Browser static requests | All 19 unique assets returned 200; no `marketplace.js` request |
| Browser console / unhandled JavaScript errors | None in the final functional run |
| Node `--check` across production and browser-test JavaScript | 14 files passed |
| `python -m compileall -q app main.py tests` | Passed |
| `git diff --check` | Passed |
| Actual Jinja page and its 10 referenced static URLs via FastAPI TestClient | All 200 |

Python: `/Users/saiganeshsattenapalli/miniforge3/envs/aiml/bin/python`.
Node: `/Users/saiganeshsattenapalli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.

The placeholder tests execute the production module with deterministic timers and DOM/event doubles. They verify all four prompts, input preservation, pause/resume conditions, preference changes and disposal. They do not substitute for visual browser verification.

## Browser verification

The application runs from the original project on `http://127.0.0.1:8017/`; the existing test harness runs on `http://127.0.0.1:8018/`. Browser access resumed after the user opened the local page and confirmed continuation. Earlier approval/tool interruptions were resolved; no browser access blocker remains.

The final functional run passed 52 checks. Coverage includes editable prompts, independent drafts, IME and Shift+Enter, real multipart fields/CSRF/identity headers, SSE event deduplication, polling fallback, idempotent retry, accepted-run recovery without another POST, local/durable history, memories, safe Markdown/code/tables/URLs, image validation and upload, dictation without implicit submission, permission denial, quiet normal recognition stops, and voice-only Speak over a real local WebSocket. Closing Speak allows an accepted response to finish in Chat. Leaving the page releases pending UI state with an explicit uncertainty message instead of silently resending.

The typing animation was observed in the browser and the suite verified that it leaves the input value empty and stops on focus. More detailed lifecycle/reduced-motion cases use the six deterministic module tests. The theme suite passed 162 assertions across eight light/dark viewport combinations, including contrast, overflow, centering, dialogs, focus, drawer isolation and appearance-rule changes without reload. It emulates the appearance CSS query rather than changing macOS settings.

Static resource timing recorded successful responses for the entire versioned tree, with no deleted-script request. Test harness JavaScript also now uses content-revision query strings and revalidation headers after a stale test-script response was observed during iteration. Final results use the revised script and current production asset namespace `v-b80aead31e52a1bb`.

Evidence: [functional checks and asset requests](../test-results/refinement-browser-checks.txt), [theme/layout checks](../test-results/refinement-theme-checks.txt), [console output](../test-results/refinement-console.json).

## Screenshots captured and inspected

Desktop dark captures use the real application under the current native dark appearance. Light captures use the actual templates/modules and real backend configuration with only the CSS appearance query emulated. Error, active-conversation and Speak views use the controlled backend and are verification fixtures, not model-output claims. Test account/history content never enters the production page.

| View | Screenshot | Viewport |
| --- | --- | --- |
| Dark Chat | [refined-chat-dark.jpg](../test-results/refined-chat-dark.jpg) | 1440 × 900 |
| Light Chat | [refined-chat-light.jpg](../test-results/refined-chat-light.jpg) | 1440 × 900 |
| Dark Work | [refined-work-dark.jpg](../test-results/refined-work-dark.jpg) | 1440 × 900 |
| Light Work | [refined-work-light.jpg](../test-results/refined-work-light.jpg) | 1440 × 900 |
| Composer focused | [refined-composer-focused.jpg](../test-results/refined-composer-focused.jpg) | 1440 × 900 |
| Multiline composer | [refined-composer-multiline.jpg](../test-results/refined-composer-multiline.jpg) | 1440 × 900 |
| Mobile Chat | [refined-mobile.jpg](../test-results/refined-mobile.jpg) | 390 × 844 |
| Mobile sidebar | [refined-mobile-sidebar.jpg](../test-results/refined-mobile-sidebar.jpg) | 390 × 844 |
| Failed request with retry | [refined-failed-request.jpg](../test-results/refined-failed-request.jpg) | 1440 × 900 |
| Active conversation/code/table | [refined-active-conversation.jpg](../test-results/refined-active-conversation.jpg) | 1440 × 900 |
| Curio Speak | [refined-speak.jpg](../test-results/refined-speak.jpg) | 1440 × 900 |

The captured layout retains the supplied ChatGPT reference hierarchy and approved structure. The desktop composer measures 61px tall, compared with 101px before refinement; three entered lines expand it to 108px. At 390px width it measures 358 × 58px and stays within the viewport. Dark canvas inspection returns `rgb(11, 11, 13)`. The narrower composer, 42px actions, 16px/1.45 input type and native font stack follow the inspected Campus source, with smaller application headings and no Campus marketing glow. Campus itself was not rendered for a side-by-side screenshot comparison; that specific comparison remains a limitation.

## Limitations

- The configured backend at `http://127.0.0.1:8001/health` refused connections in an actual network check. No real backend login, model inference or database integration success is claimed. The interface honestly remains signed out.
- No physical microphone, browser speech service, speech playback, OS appearance setting, mobile keyboard or assistive-technology session was tested.
- Speak supports browser transcription and optional browser speech synthesis, not raw audio streaming. The backend transcript path does not require a camera frame.
- No verified desktop launch scheme or official download URL was found in the local Curiora projects. Supply a real destination before activating the Work button.
- Campus typography/materials/composer sources were inspected and adapted. No separate Campus rendering was created; a rendered side-by-side Campus comparison was not completed.
- Deployment must publish templates/static assets together. For overlapping releases, retain prior hashed assets at the proxy/CDN; otherwise an old tab with unfetched modules needs a reload.

No failed assertions remain in the executed suites. The expected fixture 503 exercises retry behavior; it is not an unresolved product error. Browser viewport overrides were reset after screenshots. No commits or pushes were made.

## Changed files and patch

The complete current patch, including new untracked source/test files, is saved locally at [refinement.diff](../test-results/refinement.diff). It does not stage files. The file manifest follows.

| Change | File |
| --- | --- |
| Modified | `README.md` |
| Added | `app/core/assets.py` |
| Modified | `app/routers/home.py` |
| Modified | `docs/design-system.md` |
| Modified | `docs/validation.md` |
| Modified | `main.py` |
| Modified | `static/css/app.css` |
| Modified | `static/css/base.css` |
| Modified | `static/css/chat.css` |
| Modified | `static/css/live.css` |
| Modified | `static/css/materials.css` |
| Modified | `static/css/tokens.css` |
| Modified | `static/js/app.js` |
| Modified | `static/js/chat.js` |
| Modified | `static/js/config.js` |
| Modified | `static/js/live.js` |
| Added | `static/js/placeholder.js` |
| Modified | `static/js/shell.js` |
| Modified | `templates/base.html` |
| Modified | `templates/components/composer.html` |
| Modified | `templates/components/icons.html` |
| Modified | `templates/components/live_modal.html` |
| Modified | `templates/components/sidebar.html` |
| Modified | `templates/components/work.html` |
| Modified | `templates/index.html` |
| Modified | `tests/browser_checks.js` |
| Modified | `tests/browser_setup.js` |
| Added | `tests/placeholder.test.mjs` |
| Modified | `tests/serve_browser.py` |
| Modified | `tests/test_pages.py` |
