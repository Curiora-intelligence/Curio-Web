import {initShell} from './shell.js';

// Shell interactions become ready before authentication or backend requests finish.
initShell();
async function start() {
  const [context, chat, memory, live, auth, voice] = await Promise.all([
    import('./config.js'), import('./chat.js'), import('./memory.js'),
    import('./live.js'), import('./auth.js'), import('./voice.js'),
  ]);
  const {$, userId, account, config, storage} = context;
  $('#profile-name').textContent = account?.name || (config.development ? 'Local demo' : 'Your space');
  $('#profile-id').textContent = account ? 'Signed in' : config.development ? 'Development mode' : 'Not signed in';
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
}
start().catch(() => {
  const notice = document.querySelector('#notice'); notice.hidden = false;
  document.querySelector('#notice-message').textContent = 'Curio could not initialize. Reload the page to try again.';
});
