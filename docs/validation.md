# Rebuild verification — 13 October 2026

Implemented in the original `/Users/saiganeshsattenapalli/my projects/Curiora/Curio-Web` checkout on `round2-service-resolution`, from the clean local baseline `a3bce8c985ce0c6d833cf315a7b2c90cc6a1f328`. No new checkout, clone, worktree, commit or push. The baseline already contained the user's earlier entrypoint/router changes and deleted Interview/service JavaScript. Those deletions were not reverted; the newly authorized rebuild removed obsolete dependents instead.

## Results

| Verification | Final result |
| --- | --- |
| `python -m pytest -q` | **5 passed** in 0.29s |
| `/browser-tests` | **43 passed** against controlled HTTP/SSE/WebSocket and media fixtures |
| `/theme-tests` | **162 passed**, light/dark at 390, 768, 1024 and 1440px |
| Node `--check` for every production/test JS module | **13 passed** |
| `python -m compileall -q app main.py tests` | Passed |
| `git diff --check` | Passed |
| Actual `main:app` page and referenced static assets | HTTP 200 |
| Orphaned Interview, category tabs, service UI, Leaflet, manual-theme imports | None in production templates/CSS/JS |

Runtime used: `/Users/saiganeshsattenapalli/miniforge3/envs/aiml/bin/python`. JavaScript syntax used the bundled Node runtime under `.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.

The production application runs on `http://127.0.0.1:8017/`. The separate **test process in the same repository**, `tests.serve_browser:app`, runs on port 8018. It renders the real templates and imports the production ES modules. It is never mounted by the production application.

The functional suite covers identity display, editable quick actions, Chat/Work draft retention, transfer without submission, IME-safe Enter and Shift+Enter, actual multipart submission and headers, SSE ID deduplication, polling fallback, idempotent retry, accepted-run recovery without another POST, local/durable history, safe Markdown/code/tables/URLs, image type/size validation and upload, memory responses, dictation without implicit send, WebSocket general-mode configuration, permission denial, bounded JPEG capture, camera-track cleanup and completion of an accepted Live answer after closing its dialog. No unhandled JavaScript errors were reported.

The first browser run exposed a test-fixture issue: clearing a file input also cleared the reused DataTransfer FileList. The test now supplies a new FileList for the second upload; the final suite passes. No failed checks remain in the final executed suites. One automatic approval review initially treated committed test deletions as uncommitted user work; after verifying HEAD and the latest rebuild authorization, implementation and verification continued.

## Visual verification

Compared with the supplied ChatGPT screenshots and approved HTML: the final shell retains the stable sidebar, truly centered segmented control, central heading/composer/actions group and open negative space. Curio uses its own brand, a smaller navigation inventory backed by actual features, no model picker, no fabricated collections, and an explicitly unavailable Work execution state. The active composer remains docked while messages scroll independently. Measured at 1440 × 900: document height 900px, message viewport y=76–748px, composer y=756–857px.

Desktop dark captures use the actual production app and current system dark appearance. Desktop light and mobile light captures use the same application with the real backend configuration, with **only the CSS appearance query emulated** by the test server. The active conversation uses a controlled backend response, not a real model answer; the inert script/URL strings in that image deliberately demonstrate safe rendering.

| Screenshot | Viewport |
| --- | --- |
| [active-conversation.jpg](../test-results/active-conversation.jpg) | 1440 × 900 |
| [desktop-chat-dark.jpg](../test-results/desktop-chat-dark.jpg) | 1440 × 900 |
| [desktop-chat-light.jpg](../test-results/desktop-chat-light.jpg) | 1440 × 900 |
| [desktop-work-dark.jpg](../test-results/desktop-work-dark.jpg) | 1440 × 900 |
| [desktop-work-light.jpg](../test-results/desktop-work-light.jpg) | 1440 × 900 |
| [mobile-chat.jpg](../test-results/mobile-chat.jpg) | 390 × 844 |
| [mobile-sidebar.jpg](../test-results/mobile-sidebar.jpg) | 390 × 844 |

Local result files: [functional assertions](../test-results/browser-checks.txt), [theme/layout assertions](../test-results/theme-checks.txt), [complete patch](../test-results/rebuild.diff). These evidence files are in the existing Git-ignored `test-results/` convention; source tests and documentation are included in the patch.

## Limits and tests not executed

- The configured real backend was unavailable. Production displays Offline and Not signed in. No real model inference, database writes, real login/registration or backend integration success is claimed.
- Work execution, project/file workflows, approvals and deliverables have no verified backend contract and are not implemented. Work is an honest draft shell; no `mode=work` request exists.
- Physical camera, microphone, speech-service output and OS permission prompts were not exercised. Browser tests use canvas media, controlled speech recognition and a real local WebSocket fixture.
- Native OS settings were not changed. Dark was inspected under the actual system setting; light/dark transitions were checked by reevaluating the same CSS media rules in test-only styles. No Windows machine or cross-browser fleet was available.
- Real mobile software keyboard, touch hardware and assistive-technology sessions were not available. Responsive layout, focus, inert background, Escape behavior, safe-area rules and visual-viewport handling were checked in desktop browser viewports.
- The former Interview and service-dashboard suites do not apply to intentionally removed features. The replacement suites retain coverage of supported Chat/Live behavior.

## Engineering preservation and performance

`api.js`, `sse.js`, `voice.js`, `main.py`, `app/routers/home.py` and `app/core/config.py` are byte-for-byte unchanged from the local baseline. The useful durable history routes retain their existing `/marketplace/…` API paths even though service presentation is removed. Authentication remains enforced by the backend. Draft transfer does not discard text when the combined message would exceed the existing 16,000-character limit.

Production CSS/JS source plus map vendor assets went from 256,175 bytes to 73,485 bytes (uncompressed source comparison, not a network/performance benchmark). The Leaflet assets and imports are removed. No framework, bundler, polling for theme changes or additional transport watcher was added.

## Complete source file manifest

Statuses are against the local baseline above. All paths are inside the original checkout. The complete Git patch includes additions as well as tracked edits/deletions.

| Change | Path |
| --- | --- |
| Modified | `README.md` |
| Deleted | `docs/demo.md` |
| Deleted | `docs/round2-demo.md` |
| Modified | `static/css/app.css` |
| Modified | `static/css/base.css` |
| Modified | `static/css/chat.css` |
| Deleted | `static/css/interview.css` |
| Modified | `static/css/live.css` |
| Deleted | `static/css/marketplace.css` |
| Modified | `static/css/materials.css` |
| Modified | `static/css/memory.css` |
| Modified | `static/css/tokens.css` |
| Modified | `static/js/app.js` |
| Modified | `static/js/auth.js` |
| Modified | `static/js/chat.js` |
| Modified | `static/js/config.js` |
| Modified | `static/js/live.js` |
| Modified | `static/js/memory.js` |
| Deleted | `static/js/theme-init.js` |
| Deleted | `static/js/theme.js` |
| Deleted | `static/vendor/leaflet/LICENSE` |
| Deleted | `static/vendor/leaflet/leaflet.css` |
| Deleted | `static/vendor/leaflet/leaflet.js` |
| Modified | `templates/base.html` |
| Modified | `templates/components/auth.html` |
| Modified | `templates/components/composer.html` |
| Modified | `templates/components/live_modal.html` |
| Modified | `templates/components/memory_panel.html` |
| Modified | `templates/components/sidebar.html` |
| Modified | `templates/index.html` |
| Deleted | `templates/interview.html` |
| Deleted | `templates/marketplace.html` |
| Modified | `tests/theme_checks.js` |
| Added | `docs/design-system.md` |
| Added | `requirements-test.txt` |
| Added | `static/js/shell.js` |
| Added | `templates/components/icons.html` |
| Added | `templates/components/work.html` |
| Added | `tests/browser_checks.js` |
| Added | `tests/browser_setup.js` |
| Added | `tests/serve_browser.py` |
| Added | `tests/test_pages.py` |

## Next refinement boundaries

Typography and spacing, composer controls, sidebar behavior, Work capability integration, and motion can each be refined independently through the dedicated partials/modules. No additional implementation stage has been started after this rebuild.
