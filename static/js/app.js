import {initShell} from './shell.js';

// Shell interactions become ready before authentication or backend requests finish.
initShell();
async function start() {
  const [context, api, chat, memory, live, auth, voice] = await Promise.all([
    import('./config.js'), import('./api.js'), import('./chat.js'), import('./memory.js'),
    import('./live.js'), import('./auth.js'), import('./voice.js'),
  ]);
  const {$, userId, account, config, storage} = context;
  $('#profile-name').textContent = account?.name || (config.development ? 'Local demo' : 'Your space');
  $('#profile-id').textContent = account ? 'Signed in' : config.development ? 'Browser identity · not an account' : 'Not signed in';
  $('#user-id').value = userId;
  $('#identity-description').textContent = account ? 'Connected to your Curio account.' : config.development ? 'Development mode uses a browser-local ID. This is not secure authentication.' : 'Sign in to use your Curio account. Your draft stays here while you sign in.';
  $('#settings-button').onclick = () => $('#settings-dialog').showModal();
  $('#sign-in').hidden = !!account || config.development;
  $('#sign-in').onclick = () => { $('#settings-dialog').close(); $('#auth-dialog').showModal(); };
  auth.initAuth(); chat.initChat(); memory.initMemory(); live.initLive();
  voice.bindVoiceToggle($('#voice-toggle'));
  const inspector = storage.read('curio_inspector',true);
  $('#show-inspector').checked = inspector; document.body.classList.toggle('hide-inspector',!inspector);
  $('#show-inspector').onchange = () => { const enabled = $('#show-inspector').checked; document.body.classList.toggle('hide-inspector',!enabled); storage.write('curio_inspector',enabled); };
  let checking = false;
  async function checkConnection() {
    if (checking) return; checking = true;
    const badge = $('#connection-status'); let label, description, connected = false;
    try { const health = await api.request('/health'); connected = health.status === 'ok'; label = connected ? 'Connected' : 'Check connection'; description = connected ? 'Connected to the Curio backend' : 'The backend needs attention'; }
    catch { label = 'Offline'; description = 'Curio backend is unavailable. Check the backend connection and retry.'; }
    finally {
      badge.classList.toggle('connected',connected); badge.classList.toggle('offline',!connected);
      $('#connection-label').textContent = label; badge.title = description; badge.setAttribute('aria-label', `${description}. Check again`);
      checking = false;
    }
  }
  $('#connection-status').onclick = checkConnection; checkConnection();
  let timer = setInterval(() => { if (!document.hidden) checkConnection(); },30000);
  window.addEventListener('pagehide', () => clearInterval(timer));
  window.addEventListener('pageshow', event => { if (event.persisted) { checkConnection(); timer = setInterval(() => { if (!document.hidden) checkConnection(); },30000); } });
}
start().catch(() => {
  const notice = document.querySelector('#notice'); notice.hidden = false;
  notice.textContent = 'Curio could not initialize. Reload the page to try again.';
});
