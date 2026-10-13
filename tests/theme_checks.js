/* Development-only browser checks. Run from a same-origin page loading this module.
 * Uses the real / page and assets, but excludes unrelated application modules.
 * Storage and system appearance are isolated per iframe; no user data is changed.
 */
const report = document.createElement('pre');
report.id = 'theme-check-results';
report.style.cssText = 'white-space:pre-wrap;font:14px/1.6 monospace;padding:24px';
document.body.append(report);
let passes = 0;
const ok = (value, label) => {
  if (!value) throw Error(label);
  passes++;
  report.textContent += `PASS ${label}\n`;
};
const source = await (await fetch('/')).text();
let frame;
async function preview({system = 'light', saved = null, blocked = false, width = 1440} = {}) {
  frame?.remove();
  frame = document.createElement('iframe');
  frame.title = 'Isolated Curio theme test';
  frame.style.cssText = `display:block;width:${width}px;height:900px;border:0`;
  const fixture = `<script>
    window.__errors = [];
    window.addEventListener('error', e => __errors.push(e.message));
    const values = new Map(${JSON.stringify(saved === null ? [] : [['curio_theme', saved]])});
    window.__stored = values;
    const storage = {getItem:k => values.get(k) ?? null, setItem:(k,v) => values.set(k,String(v)), removeItem:k => values.delete(k)};
    Object.defineProperty(window, 'localStorage', {configurable:true, get:() => {
      if (${blocked}) throw new DOMException('Storage blocked','SecurityError'); return storage;
    }});
    const media = new EventTarget(); media.matches = ${system === 'dark'};
    window.matchMedia = () => media;
    window.__system = dark => {media.matches=dark;media.dispatchEvent(new Event('change'));};
  <\/script>`;
  // Retain only the two production theme scripts, not auth/transport or vendor modules.
  let html = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, tag => /js\/theme(?:-init)?\.js/.test(tag) ? tag : '');
  html = html.replace('<head>', `<head><base href="${location.origin}/">${fixture}`);
  html = html.replace(/(<script[^>]+theme-init\.js[^>]*><\/script>)/,
    '$1<script>window.__firstTheme=document.documentElement.dataset.theme; window.__firstBody=document.body;<\/script>');
  const loaded = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Theme preview load timed out')), 10000);
    frame.onload = () => { clearTimeout(timeout); resolve(); };
  });
  frame.srcdoc = html;
  document.body.append(frame);
  await loaded;
  return {win:frame.contentWindow, doc:frame.contentDocument};
}
function choose(doc, value) {
  const select = doc.querySelector('#theme-preference');
  select.value = value;
  select.dispatchEvent(new frame.contentWindow.Event('change'));
}
function contrast(a, b) {
  const luminance = color => {
    const values = color.match(/[\d.]+/g).slice(0,3).map(Number).map(n => {
      n /= 255; return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
    });
    return values[0]*.2126 + values[1]*.7152 + values[2]*.0722;
  };
  const x=luminance(a), y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
try {
  let {win, doc} = await preview({system:'dark'});
  ok(win.__firstTheme === 'dark' && win.__firstBody === null, 'system theme applied in head before body parsing');
  ok(doc.documentElement.dataset.themePreference === 'system', 'new visitors follow System');
  ok(doc.querySelector('meta[name="theme-color"]').content === '#111214', 'dark browser theme-color');
  win.__system(false);
  ok(doc.documentElement.dataset.theme === 'light', 'System reacts to device changes');
  choose(doc, 'dark');
  ok(win.__stored.get('curio_theme') === 'dark', 'manual selection persists');
  win.__system(true); win.__system(false);
  ok(doc.documentElement.dataset.theme === 'dark', 'manual selection ignores device changes');
  choose(doc, 'system');
  ok(doc.documentElement.dataset.theme === 'light' && win.__stored.get('curio_theme') === 'system', 'System selection persists and resolves immediately');
  win.dispatchEvent(new win.StorageEvent('storage', {key:'curio_theme', newValue:'dark'}));
  ok(doc.documentElement.dataset.theme === 'dark' && doc.querySelector('#theme-preference').value === 'dark', 'cross-tab changes synchronize appearance and selector');
  win.dispatchEvent(new win.StorageEvent('storage', {key:null, newValue:null}));
  ok(doc.documentElement.dataset.themePreference === 'system', 'cross-tab storage clear returns to System');
  win.dispatchEvent(new win.PageTransitionEvent('pagehide'));
  win.__system(true);
  ok(doc.documentElement.dataset.theme === 'light', 'pagehide releases the system listener');
  win.dispatchEvent(new win.PageTransitionEvent('pageshow', {persisted:true}));
  ok(doc.documentElement.dataset.theme === 'dark', 'back-forward cache restore reconnects theme tracking');
  win.__system(false);
  ok(doc.documentElement.dataset.theme === 'light', 'system listener works after restoration');
  ({win, doc} = await preview({system:'light', saved:'dark'}));
  ok(win.__firstTheme === 'dark', 'saved dark preference wins before paint on a light system');
  ({win, doc} = await preview({system:'dark', saved:'light'}));
  ok(win.__firstTheme === 'light', 'saved light preference wins before paint on a dark system');
  ({win, doc} = await preview({system:'dark', saved:'invalid'}));
  ok(win.__firstTheme === 'dark' && doc.documentElement.dataset.themePreference === 'system', 'invalid saved values fall back safely');
  ({win, doc} = await preview({system:'dark', blocked:true}));
  choose(doc, 'light');
  ok(doc.documentElement.dataset.theme === 'light' && !win.__errors.length, 'blocked storage permits an in-memory manual preference');

  for (const theme of ['light','dark']) {
    for (const width of [390,768,1440]) {
      ({win, doc} = await preview({saved:theme, width}));
      const style = element => win.getComputedStyle(element);
      ok(doc.documentElement.scrollWidth <= width, `${theme} layout has no horizontal overflow at ${width}px`);
      ok(style(doc.documentElement).colorScheme === theme, `${theme} native controls use the matching color scheme at ${width}px`);
      const host = doc.querySelector('#messages');
      host.innerHTML = '<article class="message assistant"><div class="message-label">CURIO</div><div class="message-body"><p>Theme fixture</p><pre class="answer-code">const answer = 42;</pre></div></article><article class="message user"><div class="message-body">User fixture</div></article>';
      for (const selector of ['.message-body', '.message-label', '.helper', '.answer-code', '.primary', '.input']) {
        const el=doc.querySelector(selector), st=style(el);
        let parent=el, bg=st.backgroundColor;
        while (bg === 'rgba(0, 0, 0, 0)' && parent.parentElement) {parent=parent.parentElement;bg=style(parent).backgroundColor;}
        ok(contrast(st.color,bg) >= 4.5, `${theme} ${selector} contrast at ${width}px`);
      }
      for (const id of ['settings-dialog','memory-dialog','live-dialog','discovery-dialog','auth-dialog']) {
        const dialog=doc.getElementById(id); if (!dialog) continue;
        dialog.showModal();
        ok(contrast(style(dialog).color,style(dialog).backgroundColor) >= 4.5, `${theme} ${id} readable at ${width}px`);
        ok(dialog.getBoundingClientRect().width <= width, `${theme} ${id} fits ${width}px`);
        dialog.close();
      }
      const rules=[...doc.styleSheets].flatMap(sheet=>[...sheet.cssRules]);
      ok(rules.some(rule=>rule.conditionText?.includes('prefers-reduced-motion') && rule.cssText.includes('scroll-behavior: auto')), `${theme} reduced-motion rule is present`);
      ok(!win.__errors.length, `${theme} fixture has no JavaScript errors at ${width}px`);
    }
  }
  frame?.remove();
  report.textContent += `\n${passes} theme checks passed. Application transport and authentication were not exercised.`;
  report.dataset.result = 'passed';
} catch (error) {
  report.textContent += `\nFAIL ${error.stack}`;
  report.dataset.result = 'failed';
}
