# Curio design foundations and shell

The implementation uses the local Curiora Campus, Curiora Design System, Curiora Website and Curiora Research sources as brand references. In particular: Campus `design-system.css`, `base.css`, `components.css`, `home.css`, `visual-intelligence.css`, its base/home/navbar/composer templates and `curio.js`; shared `tokens.css`, `typography.css`, `glass.css`, `components.css`, `signature.css` and playground; Website design-system/components and Research research.css/base template. Their CSS is not imported into this application.

The approved HTML preview and supplied ChatGPT Chat/Work screenshots determine spatial hierarchy. The implementation uses an independent Curio wordmark and simple line icons. The shell has a 268px sidebar (246px on smaller desktops), a 216px centered switch, a 770px readable column and restrained 26–32px welcome headings. At 760px and below, navigation becomes a modal drawer. No hardcoded conversations, pinned collections or projects are inserted.

## Source ownership

- `tokens.css`: semantic light defaults and native dark media query; typography, geometry, spacing and material colors.
- `base.css`: shared controls, dialogs, focus, native form styling and reduced motion.
- `materials.css`: optional glass treatment with opaque fallback. Reading surfaces are opaque.
- `app.css`: sidebar, header, workspace geometry and Work shell.
- `chat.css`: conversation, composer, progress, code/table and responsive reading styles.
- `memory.css`, `live.css`: retained component surfaces.
- Jinja partials: sidebar, composer, Work, icons, memory and Live.
- `shell.js`: workspace selection, responsive drawer/focus, draft transfer and textarea sizing. It has no transport dependencies.
- `chat.js`: conversation/history, submission and accepted-run ownership.
- `api.js`, `sse.js`: unchanged HTTP/multipart and event/recovery contracts.
- `live.js`: supported general-mode WebSocket, sampled camera and dictation; Interview-only analysis was removed.

## Tokens

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#ffffff` | `#0e0f11` |
| Sidebar | `#f5f5f7` | `#111216` |
| Raised neutral surface | `#f5f5f7` | `#1d1f24` |
| Primary text | `#111318` | `#f5f5f7` |
| Secondary text | `#66666e` | `#aaacb6` |
| Action blue | `#0071e3` | `#5da8ff` |
| Text on blue | `#ffffff` | `#0c1524` |

Secondary text is slightly stronger than the marketing palette to support compact navigation and helper text. `--accent-text` is a separate accessible link color. Input boundaries use `--border-control`; layout separators use the quieter `--border-subtle`.

The system font stack includes native Apple fonts by name, followed by Helvetica Neue, Segoe UI and Arial. No fonts are fetched or bundled. Code uses the system monospace stack. Radii are 4, 8, 12, 20 and 28px; only segmented controls and circular actions use the pill radius. Glass is limited to composer/overlay materials, with 20px blur and moderate saturation.

## System appearance

Light tokens live on `:root`; dark tokens are inside `@media (prefers-color-scheme: dark)`. The root uses `color-scheme: light dark`. Two media-qualified `theme-color` meta tags follow system appearance. Stylesheets in the head block initial rendering until the correct palette is available. No JavaScript theme initialization, root class toggle or storage override is needed. Old stored `curio_theme` values are ignored without deleting user storage.

Keep future manual preference support separate from these semantic values; it is intentionally absent in this release.

## Interaction and accessibility

Chat and Work are tab panels with a keyboard-operable tablist. Arrow keys, Home and End select tabs. A view switch never touches a run watcher or resets a draft. Unsupported Work controls use native disabled states and explanatory text. Work-to-Chat transfer never submits and rejects overlong combined drafts without truncation.

The mobile drawer makes the background inert, traps Tab, supports Escape and returns focus to its opener. Native dialogs provide focus containment. Textareas use a visible composer focus ring and retain IME-safe Enter/Shift+Enter behavior. `100dvh`, safe-area padding and visual viewport height keep the application bounded and help accommodate software keyboards; real mobile keyboard checks remain necessary.

Messages, code and tables are independently scrollable within the main column. Content is built with DOM text nodes; raw HTML is never inserted by the Markdown renderer. All component transitions respect reduced motion. There are no ambient animation effects.

## Future refinement boundaries

Typography/spacing can evolve in tokens and CSS. Composer controls remain in one partial plus Chat/Live handlers. Sidebar navigation lives in its partial and shell module. Work can receive a separate transport adapter when a real backend contract exists. These changes do not require another framework or shell rewrite.
