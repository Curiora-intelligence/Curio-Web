import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Unit-level DOM/event doubles and a deterministic clock; real-browser checks are separate.
const source = (await readFile(new URL('../static/js/placeholder.js', import.meta.url), 'utf8')).replace('export function', 'function');
function harness(reduced = false) {
  let now = 0, next = 0, visible = true;
  const jobs = new Map(), document = new EventTarget(), window = new EventTarget(), motion = new EventTarget(), input = new EventTarget();
  Object.assign(document, {hidden: false, activeElement: null});
  Object.assign(input, {value: '', placeholder: '', getClientRects: () => visible ? [{}] : []});
  motion.matches = reduced;
  const context = vm.createContext({document, window, matchMedia: () => motion, AbortController,
    setTimeout: (fn, delay) => { const id = ++next; jobs.set(id, {fn, at: now + delay}); return id; },
    clearTimeout: id => jobs.delete(id)});
  vm.runInContext(source, context);
  const dispose = context.initTypingPlaceholder(input);
  return {document, window, input, motion, dispose, jobs,
    hideInput: () => { visible = false; },
    advance(ms) { const end = now + ms; for (;;) { const first = [...jobs].sort((a,b) => a[1].at-b[1].at)[0]; if (!first || first[1].at > end) break; now = first[1].at; jobs.delete(first[0]); first[1].fn(); } now = end; },
    event(target, name, detail) { const event = new Event(name); event.detail = detail; target.dispatchEvent(event); }};
}
const full = 'Ask Curio anything…';
test('idle placeholder types/deletes without changing the input value', () => {
  const h = harness(); assert.equal(h.input.placeholder, full); h.advance(2650);
  assert.notEqual(h.input.placeholder, full); assert.equal(h.input.value, '');
  const seen = new Set(); for (let i=0;i<400;i++) { h.advance(100); seen.add(h.input.placeholder); }
  for (const text of ['What would you like to explore?', 'Need help understanding something?', "Tell Curio what you're thinking…"]) assert.ok(seen.has(text));
  h.dispose();
});
test('focus and typed drafts stop all animation timers', () => {
  const h = harness(); h.document.activeElement = h.input; h.event(h.input,'focus'); h.advance(9000);
  assert.equal(h.input.placeholder, full); assert.equal(h.jobs.size, 0);
  h.input.value = 'My untouched draft'; h.document.activeElement = null; h.event(h.input,'blur'); h.advance(9000);
  assert.equal(h.input.value, 'My untouched draft'); assert.equal(h.jobs.size, 0); h.dispose();
});
test('IME and active dictation pause until their completion', () => {
  const h = harness(); h.event(h.input,'compositionstart'); h.advance(9000); assert.equal(h.jobs.size, 0);
  h.event(h.input,'compositionend'); assert.equal(h.jobs.size, 1);
  h.event(h.document,'dictation-state',true); h.advance(9000); assert.equal(h.jobs.size, 0);
  h.event(h.document,'dictation-state',false); assert.equal(h.jobs.size, 1); h.dispose();
});
test('hidden document and hidden workspace suspend animation', () => {
  const h = harness(); h.document.hidden = true; h.event(h.document,'visibilitychange'); assert.equal(h.jobs.size, 0);
  h.document.hidden = false; h.event(h.document,'visibilitychange'); assert.equal(h.jobs.size, 1);
  h.hideInput(); h.event(h.document,'workspace-changed'); assert.equal(h.jobs.size, 0); h.dispose();
});
test('reduced motion starts static and responds to preference changes', () => {
  const h = harness(true); h.advance(9000); assert.equal(h.input.placeholder, full); assert.equal(h.jobs.size, 0);
  h.motion.matches = false; h.event(h.motion,'change'); assert.equal(h.jobs.size, 1);
  h.advance(2650); h.motion.matches = true; h.event(h.motion,'change'); assert.equal(h.jobs.size, 0); assert.equal(h.input.placeholder, full); h.dispose();
});
test('page lifecycle resumes once; disposal removes listeners and timers', () => {
  const h = harness(); h.event(h.window,'pagehide'); assert.equal(h.jobs.size, 0);
  h.event(h.window,'pageshow'); h.event(h.window,'pageshow'); assert.equal(h.jobs.size, 1);
  h.dispose(); h.event(h.input,'blur'); h.event(h.window,'pageshow'); assert.equal(h.jobs.size, 0);
});
