// Loaded once by the shared base, independently of application/API initialization.
const theme = window.CurioTheme;
const selector = document.querySelector('#theme-preference');
let connected = false;
function refresh() {
  theme.apply();
  if (selector) selector.value = theme.preference;
}
function selectTheme() { theme.set(selector.value); refresh(); }
function syncStorage(event) {
  if (event.key !== theme.key && event.key !== null) return;
  try { if (event.storageArea && event.storageArea !== localStorage) return; } catch { return; }
  theme.set(event.newValue, false);
  refresh();
}
function connect() {
  if (connected) return;
  connected = true;
  selector?.addEventListener('change', selectTheme);
  if (theme.media?.addEventListener) theme.media.addEventListener('change', refresh);
  else theme.media?.addListener(refresh);
  window.addEventListener('storage', syncStorage);
  refresh();
}
function disconnect() {
  connected = false;
  selector?.removeEventListener('change', selectTheme);
  if (theme.media?.removeEventListener) theme.media.removeEventListener('change', refresh);
  else theme.media?.removeListener(refresh);
  window.removeEventListener('storage', syncStorage);
}
window.addEventListener('pagehide', disconnect);
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  try { theme.set(localStorage.getItem(theme.key), false); } catch { /* Preserve in-memory choice. */ }
  connect();
});
connect();
