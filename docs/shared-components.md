# Curiora source distribution

Curiora-Design-System owns `css/controls.css`, `js/liquid.js`, `js/voice-control.js` and the original voice geometry exported by that module. Curio-Web consumes interactions **1.0.1** as a content-pinned source snapshot. There is no runtime dependency on the sibling checkout, GitHub, a package registry or a build tool.

## Updating the snapshot

From Curio-Web, run:

```sh
python3 sync_curiora.py --source ../Curiora-Design-System
python3 sync_curiora.py --source ../Curiora-Design-System --check
```

The tool reads only the explicit `distribution.json` list and generates:

- `static/curiora/controls.css`
- `static/curiora/liquid.js`
- `static/curiora/voice-control.js`
- `static/curiora/snapshot.json`
- `templates/components/curiora_voice.html`

Do not edit generated copies. Make visual changes in the shared repository, then regenerate. The manifest records the exact SHA-256 for every output, a combined snapshot pin, release version, source base commit and whether the source files were uncommitted when copied. The uncommitted flag is deliberate during review: no commit was created for this task. A content hash identifies the precise reviewed source even before a commit exists.

`--check` verifies file bytes and the content pin. It tolerates a later source commit with unchanged bytes. The product's `tests/test_curiora.py` verifies the snapshot without requiring the Design System checkout, so CI and deployments remain self-contained.

## Product integration

The Jinja head loads the shared opt-in stylesheet after local styles. All assets, including relative `../curiora/` native module imports, use the existing content-hashed `/static/v-…/` directory and immutable cache validation. No cross-repository runtime imports exist.

`static/js/motion.js` adapts application workspace names to the shared controller. The shared module owns visual selection, keyboard navigation and ARIA selected state; `shell.js` owns panels, draft resizing and the workspace event. It never reopens or cancels a transport.

The icon macro includes the generated shared stroke partial, so the glyph is present on first paint. `live.js` supplies genuine connected, recognition-start, waiting-for-answer and speech-start states to the shared visual helper. The dialog's stop/leave button uses existing close behavior, including allowing an accepted answer to finish in Chat. The separate dictation microphone and Speak/Send slot retain their existing responsibilities.

## Local review

The independent shared playground works with any static HTTP server. Curio's development verification server also serves the existing Design System's public `css`, `js` and `playground` directories at `/design-system/`; production `main.py` does not mount these routes.

- Shared preview: `http://127.0.0.1:8018/design-system/playground/controls.html`
- Shared browser assertions: add `?tests=1`.
- Product assertions: `/theme-tests` and `/browser-tests`.

No OS appearance or motion settings are changed by these review tools. Voice states in the playground are explicitly labeled visual previews; no microphone or simulated audio levels are used.
