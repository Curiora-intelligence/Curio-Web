# Curio design foundations and shell

The implementation uses the local Curiora Campus, Curiora Design System, Curiora Website and Curiora Research sources as brand references. In particular: Campus `design-system.css`, `base.css`, `components.css`, `home.css`, `visual-intelligence.css`, its base/home/navbar/composer templates and `curio.js`; shared `tokens.css`, `typography.css`, `glass.css`, `components.css`, `signature.css` and playground; Website design-system/components and Research research.css/base template. Their CSS is not imported into this application.

The approved HTML preview and supplied ChatGPT Chat/Work screenshots determine spatial hierarchy. The implementation uses an independent Curio wordmark and simple line icons. The shell has a 268px sidebar (246px on smaller desktops), a 200px centered switch, a 770px readable column and restrained 26–30px welcome headings. At 760px and below, navigation becomes a modal drawer. No hardcoded conversations, pinned collections or projects are inserted.

## Source ownership

- `tokens.css`: semantic light defaults and native dark media query; typography, geometry, spacing and material colors.
- `base.css`: shared controls, dialogs, focus, native form styling and reduced motion.
- `materials.css`: optional glass treatment with opaque fallback. Reading surfaces are opaque.
- `app.css`: sidebar, header, workspace geometry and Work shell.
- `chat.css`: conversation, composer, progress, code/table and responsive reading styles.
- `memory.css`, `live.css`: retained component surfaces.
- Jinja partials: sidebar, composer, Work, icons, memory and Speak.
- `shell.js`: workspace selection, responsive drawer/focus, draft preservation and textarea sizing. It has no transport dependencies.
- `motion.js`: one interruptible selected capsule; leading/trailing-edge geometry, settlement, resize and reduced-motion handling. No chat or network state.
- `composer.js`: flat capability menu, keyboard/focus/viewport handling and persistent effort preference; no transport dependencies.
- `chat.js`: conversation/history, submission and accepted-run ownership.
- `api.js`, `sse.js`: unchanged HTTP/multipart and event/recovery contracts.
- `live.js`: Curio Speak through the existing general-mode WebSocket transcript contract, browser dictation and microphone error handling. No Web camera access.
- `placeholder.js`: Campus-inspired typing rhythm with focus, input, IME, dictation, visibility, page-lifecycle and reduced-motion guards.

## Tokens

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#fafaf9` | `#0c0c0c` |
| Sidebar | `#f1f1f0` | `#101010` |
| Raised neutral surface | `#f3f3f2` | `#181818` |
| Primary text | `#111318` | `#eeeeef` |
| Secondary text | `#68686d` | `#a0a0a3` |
| Action blue | `#0071e3` | `#5da8ff` |
| Text on shared accent | `#ffffff` | `#0c1524` |
| Composer primary fill | `#0071e3` | `#1479e8` |
| Composer primary icon | `#ffffff` | `#ffffff` |

Secondary text uses accessible neutral grays in both appearances. `--accent-text` is a separate accessible link color. Input boundaries use `--border-control`; layout separators use the quieter `--border-subtle`.

The system font stack includes native Apple fonts by name, followed by Helvetica Neue, Segoe UI and Arial. No fonts are fetched or bundled. Code uses the system monospace stack. The Chat composer is a 48px resting capsule with a 25px radius, 36px actions and 16px/22px input text, close to Campus's 52px navigation pill. On mobile it is 50px tall with 44px touch targets. It grows for multiline input; Work retains its taller drafting area. Other radii remain semantic, with quieter 16px Work cards. Glass is limited to composers and their popovers, with 28px blur, softly translucent warm white or neutral graphite, an inner highlight and no color saturation or ambient glow.

The Chat composer orders controls as Plus → input → thinking effort → dictation microphone → Speak/Send. Empty or whitespace-only input shows Curio Speak; text or an image attachment shows Send. A pending request keeps Send disabled even when the input is empty. The inactive button uses native `hidden`, so it is neither visible nor keyboard-focusable. Only the incoming action animates (160ms opacity); there is no scaling, overlap or layout shift, and reduced motion disables the transition. Clearing a focused action returns focus to the input. The empty placeholder clips without scrollbars; actual multiline drafts retain scrolling. Independent neutral microphones dictate editable text into Chat and Work, never submitting automatically. Curio Speak retains editable transcripts and optional browser-spoken replies; it is not verified real-time speech-to-speech.

`composer_menus.html` supplies one shared, ungrouped capability list above the active composer. Rows have neutral icons, concise descriptions and subtle full-row hover. Only the upload row opens the image picker, supporting JPEG/PNG/WebP/GIF up to 15 MB in Chat. Other rows explicitly show Unavailable; Work upload shows Chat only. Menus scroll within the available visual viewport. Arrow keys, Home and End navigate rows; Escape restores opener focus, Tab resumes normal navigation, and outside pointer/focus or a workspace change dismisses the menu. Unavailable rows remain discoverable with arrow keys but cannot activate.

Both effort triggers share Low / Medium / High, default Medium, saved under `curio_thinking_effort`. Storage failure is disclosed as a page-only preference. The menu and trigger accessible label explicitly say it is not applied to responses yet. No inference field, quota panel or token/context-size claim is introduced. The inspected gateway exposes no effort setting; one backend runtime currently hardcodes Low. This presentation preference must not be mapped to inference until a supported contract exists.

## Interaction materials

The 15 October refinement keeps the geometry intact while using a warm near-white canvas, layered white controls and neutral near-black dark surfaces. Glass borders are softened independently of accessible input boundaries and focus rings. Shared `--hover-field` and `--hover-border` tokens provide quiet neutral responses for utility icons, sidebar items and quick actions. Blue remains reserved for primary actions and meaningful focus/selection.

The selected Chat/Work capsule is one persistent material surface animated over 320ms with the Web Animations API. Its leading edge extends first, its center follows, and its trailing edge catches up. Five geometry keyframes interpolate bounded left/right edges, a small vertical compression and directional corner radii. Width reaches about 1.45 times its resting width, then returns to the exact destination segment. Labels and the outer shell stay fixed. A static, extremely faint blue density gradient belongs to the deforming surface; there is no independent moving highlight, tide pseudo-element, outside shadow, bounce or continuous frame loop.

A reversal samples the visible geometry before cancelling the previous animation. The replacement begins at that shape; a guarded finish restores a stable rounded pill. Resize, page exit and a reduced-motion preference change settle immediately. CSS also sets the mode duration to zero for reduced motion. Workspace state, drafts and transports remain owned by their existing modules.

Composer primary icons use opaque white in both appearances, with dedicated blue fill tokens that keep at least 3:1 icon contrast. Existing compact 7–8px hover shadows and pressed feedback remain. Speak bars respond once over 300ms with 0/35/70ms delays: the short outer bars grow while the inner bars contract, staying within the existing icon. Send retains its 1.5px upward lift. These effects require a hover-capable pointer and no reduced-motion preference; otherwise icons remain static.

The unintended horizontal composer line came from the textarea's inset focus shadow. That shadow is removed. Textarea keyboard focus now outlines the composer perimeter with a neutral 2px ring and 2px offset; child buttons retain their own focus outlines. Composer geometry, glass, neutral surfaces and blue focus feedback for controls are preserved.
Effort text is 14px, medium weight, with aligned chevrons and more breathing room in both composers. Quick actions use 13px text with neutral rounded hover surfaces. Neither change affects submission or inference.

The top-right Temporary Chat button is an `aria-disabled` presentation shell, still keyboard-discoverable. Its native title is “Temporary chat”; its accessible description and hover/focus explanation state that it is unavailable and that normal history and memory still apply. Escape dismisses the explanation. No temporary-session state, retention promise or backend request exists.

## System appearance

Light tokens live on `:root`; dark tokens are inside `@media (prefers-color-scheme: dark)`. The root uses `color-scheme: light dark`. Two media-qualified `theme-color` meta tags follow system appearance. Stylesheets in the head block initial rendering until the correct palette is available. No JavaScript theme initialization, root class toggle or storage override is needed. Old stored `curio_theme` values are ignored without deleting user storage.

Keep future manual preference support separate from these semantic values; it is intentionally absent in this release.

## Interaction and accessibility

Chat and Work are tab panels with a keyboard-operable tablist. Arrow keys, Home and End select tabs. A view switch never touches a run watcher or resets a draft. Unsupported Work controls use native disabled states and explanatory text. The desktop handoff is explicitly unavailable until a verified destination is supplied; it does not copy or submit a draft.

The mobile drawer makes the background inert, traps Tab, supports Escape and returns focus to its opener. Native dialogs provide focus containment. Textareas use a neutral focus outline around the composer perimeter and retain IME-safe Enter/Shift+Enter behavior. `100dvh`, safe-area padding and visual viewport height keep the application bounded and help accommodate software keyboards; real mobile keyboard checks remain necessary.

Messages, code and tables are independently scrollable within the main column. Content is built with DOM text nodes; raw HTML is never inserted by the Markdown renderer. All component transitions respect reduced motion. The only idle animation is the typing placeholder; reduced motion renders static text. It never changes an input value or its accessible label. There are no ambient animation effects.

## Future refinement boundaries

Typography/spacing can evolve in tokens and CSS. Composer controls live in the Chat/Work partials, shared menu partial and composer module, with Chat/Speak handlers retaining submission ownership. Sidebar navigation lives in its partial and shell module. Work can receive a separate transport adapter when a real backend contract exists. These changes do not require another framework or shell rewrite.

## Feedback

There is no permanent connection badge or background health polling. Authentication remains checked at initialization; real HTTP/SSE/WebSocket operations detect failures when used. Failed Chat requests retain their existing conversation error and retry action. Attachment errors use a dismissible notice above the composer, outside normal layout flow. Routine dictation `aborted` and `no-speech` events stay quiet. Permission and device failures use small contextual text that does not shift the composer. Essential settings remain reachable through the profile button without a gear.

## Asset ownership

`app/core/assets.py` fingerprints static source and serves versioned URLs; `home.py` supplies the version to Jinja. Relative native module imports share the versioned directory. Theme CSS remains render-blocking in the head and uses native appearance queries, so no theme JavaScript or preference storage is introduced.
