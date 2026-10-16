import { $ } from './config.js';
import { jsonPost } from './api.js';
export function initAuth() {
  const dialog = $('#auth-dialog'); if (!dialog) return;
  document.addEventListener('auth-required', () => dialog.showModal());
  let registering = false;
  $('#auth-switch').onclick = () => { registering = !registering; $('#registration-fields').hidden = !registering; $('#auth-submit').textContent = registering ? 'Register' : 'Sign in'; $('#auth-switch').textContent = registering ? 'Already have an account' : 'Create an account'; dialog.querySelector('h2').textContent = registering ? 'Create your account' : 'Sign in to Curio'; };
  $('#auth-form').onsubmit = async event => {
    event.preventDefault(); const button = $('#auth-submit'); button.disabled = true; $('#auth-error').hidden = true;
    try {
      const form = new FormData(event.target); const body = { email: form.get('email'), password: form.get('password') }; if (registering) { body.name = form.get('name'); body.role = form.get('role'); }
      const result = await jsonPost(registering ? '/auth/register' : '/auth/login', body);
      try { localStorage.setItem('curio_user_id', result.id); } catch { }
      try { sessionStorage.setItem('curio_signin_draft', JSON.stringify({ userId: result.id, chat: $('#message').value, work: $('#work-message').value })); } catch { }
      location.reload();
    } catch (error) { $('#auth-error').textContent = error.message; $('#auth-error').hidden = false; } finally { button.disabled = false; }
  };
}
