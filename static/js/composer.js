// Presentation preferences only. No capability or inference fields are added to requests.
export function initComposerControls() {
  const $ = selector => document.querySelector(selector);
  const capability = $('#capability-menu'), effortMenu = $('#effort-menu');
  const effortButtons = [...document.querySelectorAll('[data-effort-trigger]')];
  const options = [...effortMenu.querySelectorAll('[data-effort]')];
  const key = 'curio_thinking_effort', choices = ['low', 'medium', 'high'];
  let preference = 'medium', storageAvailable = true, opened = null, opener = null;
  function restorePreference() {
    try { const value = localStorage.getItem(key); preference = choices.includes(value) ? value : 'medium'; }
    catch { storageAvailable = false; }
    syncPreference();
  }
  function syncPreference() {
    const label = preference[0].toUpperCase() + preference.slice(1);
    for (const button of effortButtons) {
      button.querySelector('[data-effort-label]').textContent = label;
      button.title = `Thinking effort: ${label}. Preference only, not applied to responses yet.`;
      button.setAttribute('aria-label', button.title);
    }
    for (const option of options) option.setAttribute('aria-checked', String(option.dataset.effort === preference));
    $('#effort-availability').textContent = 'Preference only. Not applied to responses yet.' + (storageAvailable ? '' : ' Storage is unavailable; this choice lasts for this page.');
  }
  function close(restoreFocus = true) {
    if (!opened) return;
    opened.hidden = true; opened = null;
    const previous = opener; opener = null;
    previous.setAttribute('aria-expanded', 'false');
    if (restoreFocus && previous.getClientRects().length) previous.focus({preventScroll: true});
  }
  function position() {
    if (!opened) return;
    if (!opener.getClientRects().length) { close(false); return; }
    const viewport = window.visualViewport, inset = 12;
    const leftEdge = viewport?.offsetLeft || 0, topEdge = viewport?.offsetTop || 0;
    const width = viewport?.width || document.documentElement.clientWidth;
    const anchor = opener.closest('.composer').getBoundingClientRect();
    opened.style.maxWidth = `${width - inset * 2}px`;
    opened.style.maxHeight = `${Math.max(48, Math.min(440, anchor.top - topEdge - inset - 8))}px`;
    const menuWidth = opened.offsetWidth;
    const x = opened === effortMenu ? opener.getBoundingClientRect().right - menuWidth : anchor.left;
    opened.style.left = `${Math.max(leftEdge + inset, Math.min(x, leftEdge + width - menuWidth - inset))}px`;
    opened.style.top = `${Math.max(topEdge + inset, anchor.top - opened.offsetHeight - 8)}px`;
  }
  function items() { return [...opened.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')]; }
  function focusItem(item) {
    for (const node of items()) node.tabIndex = node === item ? 0 : -1;
    item.focus({preventScroll: true}); item.scrollIntoView({block: 'nearest'});
  }
  function open(menu, button, last = false) {
    if (opened === menu && opener === button) { close(); return; }
    close(false); opened = menu; opener = button;
    if (menu === capability) {
      const work = button.id === 'work-capabilities';
      $('#upload-image').setAttribute('aria-disabled', String(work));
      $('#upload-availability').textContent = work ? 'Chat only' : 'Images only';
      $('#upload-image').title = work ? 'Image uploads are available in Chat only' : 'Choose a supported image from your device';
    }
    menu.hidden = false; button.setAttribute('aria-expanded', 'true'); position();
    focusItem(last ? items().at(-1) : menu === effortMenu ? options.find(option => option.dataset.effort === preference) : items()[0]);
  }
  for (const button of [$('#attach-image'), $('#work-capabilities'), ...effortButtons]) {
    const menu = button.hasAttribute('data-effort-trigger') ? effortMenu : capability;
    button.onclick = () => open(menu, button);
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(menu, button, event.key === 'ArrowUp'); }
    });
  }
  $('#upload-image').onclick = () => {
    if ($('#upload-image').getAttribute('aria-disabled') === 'true') return;
    close(); $('#image-file').click();
  };
  for (const option of options) option.onclick = () => {
    preference = option.dataset.effort;
    try { localStorage.setItem(key, preference); storageAvailable = true; } catch { storageAvailable = false; }
    syncPreference(); close();
  };
  for (const menu of [capability, effortMenu]) menu.addEventListener('keydown', event => {
    if (!opened) return;
    const list = items(), index = list.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
      focusItem(list[next]);
    } else if (event.key === 'Tab') close(); // Native Tab continues from the opener.
    else if (['Enter', ' '].includes(event.key) && document.activeElement.getAttribute('aria-disabled') === 'true') event.preventDefault();
  });
  document.addEventListener('keydown', event => { if (opened && event.key === 'Escape') { event.preventDefault(); close(); } });
  document.addEventListener('pointerdown', event => { if (opened && !opened.contains(event.target) && !opener.contains(event.target)) close(); });
  document.addEventListener('focusin', event => { if (opened && !opened.contains(event.target) && !opener.contains(event.target)) close(false); });
  document.addEventListener('workspace-changed', () => close(false));
  window.addEventListener('resize', position);
  window.visualViewport?.addEventListener('resize', position);
  window.visualViewport?.addEventListener('scroll', position);
  window.addEventListener('pagehide', () => close(false));
  window.addEventListener('pageshow', restorePreference);
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) restorePreference(); });
  restorePreference();
}
