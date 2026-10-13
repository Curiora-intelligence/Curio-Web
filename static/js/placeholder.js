// Campus's typing/deleting rhythm, adapted to a general composer with lifecycle guards.
const prompts = ['Ask Curio anything…', 'What would you like to explore?', 'Need help understanding something?', "Tell Curio what you're thinking…"];
export function initTypingPlaceholder(input) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  let timer, index = 0, length = prompts[0].length, deleting = true;
  let composing = false, dictating = false, suspended = false;
  const paused = () => suspended || document.hidden || motion.matches || composing || dictating || input.value || document.activeElement === input || !input.getClientRects().length;
  function stop() { clearTimeout(timer); timer = undefined; }
  function tick() {
    stop();
    if (paused()) { input.placeholder = prompts[0]; return; }
    length += deleting ? -1 : 1;
    input.placeholder = prompts[index].slice(0, length);
    let delay = deleting ? 35 : 85;
    if (!deleting && length === prompts[index].length) { deleting = true; delay = 2600; }
    else if (deleting && length === 0) { deleting = false; index = (index + 1) % prompts.length; delay = 450; }
    timer = setTimeout(tick, delay);
  }
  function sync() {
    stop(); input.placeholder = prompts[0]; index = 0; length = prompts[0].length; deleting = true;
    if (!paused()) timer = setTimeout(tick, 2600);
  }
  function on(target, name, handler) { target.addEventListener(name, handler, {signal: listeners.signal}); }
  for (const event of ['focus', 'blur', 'input']) on(input, event, sync);
  on(input, 'compositionstart', () => { composing = true; sync(); });
  on(input, 'compositionend', () => { composing = false; sync(); });
  on(document, 'dictation-state', event => { dictating = event.detail; sync(); });
  on(document, 'visibilitychange', sync);
  on(document, 'workspace-changed', sync);
  on(motion, 'change', sync);
  on(window, 'pagehide', () => { suspended = true; sync(); });
  on(window, 'pageshow', () => { suspended = false; sync(); });
  sync();
  return () => { stop(); listeners.abort(); input.placeholder = prompts[0]; };
}
