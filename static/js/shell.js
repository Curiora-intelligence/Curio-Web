import {initTypingPlaceholder} from './placeholder.js';
import {initComposerControls} from './composer.js';
import {initLiquidSelection} from './motion.js';

// Presentation state only. Workspace navigation never owns or cancels chat runs.
export function initShell() {
  const $ = selector => document.querySelector(selector);
  const app = $('#app'), sidebar = $('#sidebar'), main = $('#main'), menu = $('#menu');
  const narrow = matchMedia('(max-width: 760px)');
  let mobileOpen = false, collapsed = false, returnFocus = menu;
  function syncSidebar() {
    const visible = narrow.matches ? mobileOpen : !collapsed;
    app.classList.toggle('sidebar-collapsed', !narrow.matches && collapsed);
    sidebar.classList.toggle('open', narrow.matches && mobileOpen);
    sidebar.inert = !visible;
    menu.setAttribute('aria-expanded', String(visible));
    $('#scrim').hidden = !narrow.matches || !mobileOpen;
    main.inert = narrow.matches && mobileOpen;
    if (narrow.matches && mobileOpen) { sidebar.setAttribute('role','dialog'); sidebar.setAttribute('aria-modal','true'); }
    else { sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); }
  }
  function closeSidebar() {
    if (narrow.matches) mobileOpen = false;
    else collapsed = true;
    syncSidebar();
    menu.focus();
  }
  menu.onclick = () => { returnFocus = document.activeElement; if (narrow.matches) mobileOpen = true; else collapsed = false; syncSidebar(); $('#collapse-sidebar').focus(); };
  $('#collapse-sidebar').onclick = closeSidebar;
  $('#scrim').onclick = () => { mobileOpen = false; syncSidebar(); if (narrow.matches) returnFocus?.focus(); };
  document.addEventListener('keydown', event => {
    if (!narrow.matches || !mobileOpen || document.querySelector('dialog[open]')) return;
    if (event.key === 'Escape') { event.preventDefault(); closeSidebar(); }
    if (event.key === 'Tab') {
      const items = [...sidebar.querySelectorAll('a,button,input')].filter(node => !node.disabled && node.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  narrow.addEventListener('change', () => { mobileOpen = false; syncSidebar(); });
  syncSidebar();

  const temporaryChat = $('#temporary-chat'), utility = temporaryChat.closest('.header-utility');
  temporaryChat.addEventListener('focus', () => utility.classList.remove('hint-dismissed'));
  utility.addEventListener('pointerenter', () => utility.classList.remove('hint-dismissed'));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') utility.classList.add('hint-dismissed'); });

  const selectMode = initLiquidSelection($('.mode-switch'), name => workspace(name));
  function workspace(name, focus = false) {
    selectMode(name);
    for (const kind of ['chat','work']) {
      const selected = kind === name;
      const tab = $(`#${kind}-tab`);
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      $(`#${kind}-panel`).hidden = !selected;
      if (selected && focus) tab.focus();
    }
    // Recompute height after a hidden draft returns to the layout.
    const textarea = name === 'chat' ? $('#message') : $('#work-message');
    textarea.dispatchEvent(new Event('input'));
    document.dispatchEvent(new CustomEvent('workspace-changed', {detail:name}));
  }
  document.addEventListener('show-chat', () => workspace('chat'));
  for (const textarea of document.querySelectorAll('.composer textarea')) {
    const resize = () => { if (!textarea.getClientRects().length) return; textarea.style.height = 'auto'; textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`; };
    textarea.addEventListener('input', resize);
    resize();
  }
  for (const button of document.querySelectorAll('[data-work-prompt]')) button.onclick = () => {
    $('#work-message').value = button.dataset.workPrompt;
    $('#work-message').dispatchEvent(new Event('input')); $('#work-message').focus();
  };
  $('#dismiss-notice').onclick = () => { $('#notice').hidden = true; };
  initTypingPlaceholder($('#message'));
  initComposerControls();
  $('#search-button').onclick = () => {
    const box = $('#history-search-box'); box.hidden = !box.hidden;
    $('#search-button').setAttribute('aria-expanded', String(!box.hidden));
    if (!box.hidden) $('#history-search').focus();
    else { $('#history-search').value = ''; $('#history-search').dispatchEvent(new Event('input')); }
  };
  for (const button of document.querySelectorAll('[data-close]')) button.onclick = () => document.getElementById(button.dataset.close).close();
  // The visual viewport keeps controls reachable above mobile keyboards.
  const viewport = window.visualViewport;
  const resizeViewport = () => { if (viewport && viewport.scale === 1) document.documentElement.style.setProperty('--app-height', `${viewport.height}px`); };
  viewport?.addEventListener('resize', resizeViewport); resizeViewport();
}
