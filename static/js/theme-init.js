/* Blocking head script: resolve appearance before styles or body paint. */
(() => {
  const key = 'curio_theme';
  const valid = value => ['light', 'dark', 'system'].includes(value) ? value : 'system';
  const media = window.matchMedia?.('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = valid(localStorage.getItem(key)); } catch { /* Storage is optional. */ }
  function apply() {
    const resolved = preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = resolved === 'dark' ? '#111214' : '#ffffff';
    return resolved;
  }
  window.CurioTheme = Object.freeze({
    key, media,
    get preference() { return preference; },
    apply,
    set(value, persist = true) {
      preference = valid(value);
      if (persist) { try { localStorage.setItem(key, preference); } catch { /* Keep the in-memory choice. */ } }
      return apply();
    },
  });
  apply();
})();
