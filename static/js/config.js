export const config = Object.freeze(JSON.parse(document.querySelector('#curio-config').textContent));
export const storage = {
  read(key, fallback = null) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing remains usable. */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { } },
};
export let account=null,csrfToken='';
try {const response=await fetch(`${config.apiBase}/auth/me`,{credentials:'include'});if(response.ok){account=await response.json();csrfToken=account?.csrf||'';}}catch{}
export const userId=account?.id || (config.development ? (localStorage.getItem('curio_user_id') || 'demo-sai') : 'guest');
if(config.development){try{localStorage.setItem('curio_user_id',userId);}catch{}}
export const modes = { Service: 'discovery', Personal: 'general', Food: 'discovery', Shopping: 'shopping', Research: 'general', Career: 'general', Interview: 'interview' };
export const $ = (selector) => document.querySelector(selector);
export const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
export function notice(message = '') { $('#notice').textContent = message; $('#notice').hidden = !message; }
export function element(tag, className, text) { const node = document.createElement(tag); node.className = className || ''; if (text !== undefined) node.textContent = text; return node; }
