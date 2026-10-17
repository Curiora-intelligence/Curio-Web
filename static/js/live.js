import {cancelCurioSpeech} from './voice.js';
import {setVoiceState} from '../curiora/voice-control.js';
import {$, emit, userId, config} from './config.js';
import {websocketUrl} from './api.js';
import {state, setBusy, addMessage, completeReply, failReply, renderAnswer} from './chat.js';

// Curio Speak uses the existing /live/ws transcript contract. No camera or audio frames.
let socket = null, configured = false, inFlight = null, reply = null;
let connectionTimer, backoffTimer, recognition = null, recognitionButton = null;
let dictationTarget = null, speaking = false, voiceError = false, recognitionListening = false;
const workAvailability = $('#work-availability').textContent;
function status(text) { $('#live-state').textContent = text; }
function updateVoiceVisual() {
  const open=$('#live-dialog').open;
  const visual=!open ? 'idle' : voiceError ? 'error' : recognitionListening && dictationTarget?.id==='live-message' ? 'listening' : speaking ? 'speaking' : inFlight==='reason' ? 'responding' : configured ? 'ready' : 'connecting';
  setVoiceState($('#open-live'),visual,{label:open ? 'Curio Speak active — return to voice conversation' : 'Open Curio Speak'});
  setVoiceState($('#speak-session-control'),visual,{label:'Stop and leave Curio Speak'});
}
function controls() { $('#live-send').disabled = !configured || !!inFlight || !$('#live-message').value.trim(); updateVoiceVisual(); }
function send(payload) {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(payload)); return true;
}
function disconnect() {
  clearTimeout(connectionTimer); clearTimeout(backoffTimer);
  const current = socket; socket = null; configured = false; inFlight = null;
  current?.close(); controls();
}
function handle(event) {
  let data; try { data = JSON.parse(event.data); } catch { return; }
  if (data.type === 'ready') {
    inFlight = 'configure';
    send({type: 'configure', mode: 'general', ...(state.conversationId ? {conversation_id: state.conversationId} : {}), ...(state.location || {})});
  } else if (data.type === 'configured') {
    clearTimeout(connectionTimer); configured = true; voiceError = false; inFlight = null; status('Ready for your question.');
  } else if (data.type === 'response' && reply) {
    voiceError = false;
    try {
      completeReply(reply, data);
      if (reply.error) status(reply.text);
      else { renderAnswer($('#live-answer'), data.answer); status('Ready for your next thought.'); }
    }
    catch { failReply(reply, 'Curio returned an incomplete response. Check your conversation before trying again.'); status('The response could not be read. Check your chat.'); }
    reply = null; inFlight = null;
  } else if (data.type === 'busy') {
    if (reply) { failReply(reply, 'Curio is busy. Your question was not accepted. Please try again shortly.'); reply = null; }
    inFlight = 'backoff'; status('Curio is busy. Try your question again in a moment.');
    const current = socket;
    backoffTimer = setTimeout(() => { if (socket === current) { inFlight = null; controls(); } }, 5000);
  } else if (data.type === 'error') {
    voiceError = true;
    const message = data.message || 'Curio could not answer. Please try again.';
    status(message); if (reply) { failReply(reply, message); reply = null; } inFlight = null;
  }
  if (!$('#live-dialog').open && !inFlight) disconnect();
  controls();
}
function connect() {
  voiceError = false; disconnect(); status('Connecting for your conversation…');
  let current;
  try { current = new WebSocket(websocketUrl()); }
  catch { voiceError = true; updateVoiceVisual(); status('Curio Speak could not connect. Close this window and try again.'); return; }
  socket = current;
  connectionTimer = setTimeout(() => {
    if (!configured && socket === current) { voiceError = true; disconnect(); status('Curio Speak is taking too long to connect. Close this window and try again.'); }
  }, 15000);
  current.onmessage = event => { if (socket === current) handle(event); };
  current.onerror = () => { if (socket === current) { voiceError = true; updateVoiceVisual(); status('Curio Speak is unavailable. Check your connection and try again.'); } };
  current.onclose = () => {
    if (socket !== current) return;
    voiceError = true; disconnect(); status('Connection closed. Close this window and reopen Curio Speak to reconnect.');
    if (reply) { failReply(reply, 'The Speak connection closed. This question may have finished on the server; it has not been resent. Check your history before trying again.'); reply = null; }
  };
}
function openLive() {
  if (state.busy) return;
  if (userId === 'guest' && !config.development) { emit('auth-required'); return; }
  stopDictation(); $('#live-dialog').showModal(); $('#live-answer').textContent = ''; connect();
}
function closeLive() {
  const waitingForAnswer = inFlight === 'reason';
  $('#live-dialog').close(); stopDictation(); cancelCurioSpeech();
  // An accepted answer can finish in Chat even after the user closes Speak.
  if (!waitingForAnswer) disconnect();
}
function voiceStatus(message = '') {
  if ($('#live-dialog').open) { status(message || 'Ready for your question.'); return; }
  if (dictationTarget?.id === 'work-message') { $('#work-availability').textContent = message || workAvailability; return; }
  $('#voice-status').textContent = message; $('#voice-status').hidden = !message;
}
function stopDictation() {
  const current = recognition; recognition = null; recognitionListening = false;
  if (current) { current.onstart = current.onresult = current.onerror = current.onend = null; try { current.stop(); } catch { /* Already ended. */ } }
  recognitionButton?.setAttribute('aria-pressed', 'false'); recognitionButton?.classList.remove('listening'); recognitionButton = null;
  emit('dictation-state', false); updateVoiceVisual();
}
function dictate(target, button) {
  cancelCurioSpeech();
  if (recognition) { stopDictation(); voiceStatus(); return; }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { voiceStatus('Dictation is unavailable in this browser. You can keep typing.'); return; }
  const current = new Recognition(); recognition = current; recognitionButton = button; dictationTarget = target;
  current.lang = navigator.language || 'en-IN'; current.continuous = true; current.interimResults = true;
  const original = target.value;
  voiceStatus('Listening… Stop dictation to review your text.'); button.classList.add('listening'); button.setAttribute('aria-pressed', 'true'); emit('dictation-state', true); updateVoiceVisual();
  current.onstart = () => { if (recognition === current) { recognitionListening = true; updateVoiceVisual(); } };
  current.onresult = event => {
    if (recognition !== current) return;
    let text = ''; for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript + ' ';
    target.value = (original + ' ' + text).trim().slice(0, 16000); target.dispatchEvent(new Event('input'));
  };
  current.onerror = event => {
    if (recognition !== current) return;
    stopDictation();
    if (['aborted', 'no-speech'].includes(event.error)) { voiceStatus(); return; }
    const message = ['not-allowed', 'service-not-allowed'].includes(event.error)
      ? 'Microphone access was declined. Allow it in browser settings to dictate, or keep typing.'
      : event.error === 'audio-capture' ? 'No microphone is available. Check your device or keep typing.'
      : 'Dictation is unavailable right now. Try again or keep typing.';
    voiceStatus(message);
  };
  current.onend = () => { if (recognition === current) { stopDictation(); voiceStatus(); } };
  try { current.start(); } catch { stopDictation(); voiceStatus('Dictation could not start. Try again or keep typing.'); }
}
export function initLive() {
  document.addEventListener('stop-dictation', stopDictation);
  document.addEventListener('workspace-changed', () => { stopDictation(); voiceStatus(); });
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
    for (const id of ['#microphone', '#work-microphone', '#live-microphone']) {
      const button = $(id);
      button.disabled = true; button.title = 'Dictation is unavailable in this browser'; button.setAttribute('aria-label', 'Dictation is unavailable in this browser');
    }
  }
  $('#open-live').onclick = openLive; $('#close-live').onclick = closeLive;
  $('#speak-session-control').onclick = closeLive;
  $('#live-dialog').addEventListener('close', updateVoiceVisual);
  document.addEventListener('curio-speaking', event => { speaking=!!event.detail; updateVoiceVisual(); });
  updateVoiceVisual();
  $('#live-dialog').addEventListener('cancel', event => { event.preventDefault(); closeLive(); });
  $('#microphone').onclick = () => dictate($('#message'), $('#microphone'));
  $('#work-microphone').onclick = () => dictate($('#work-message'), $('#work-microphone'));
  $('#live-microphone').onclick = () => dictate($('#live-message'), $('#live-microphone'));
  for (const id of ['#message', '#work-message']) $(id).addEventListener('input', event => {
    if (event.isTrusted && recognition && dictationTarget === $(id)) stopDictation();
    if (!recognition) { if (id === '#message') $('#voice-status').hidden = true; else $('#work-availability').textContent = workAvailability; }
  });
  $('#live-message').addEventListener('input', controls);
  $('#live-form').onsubmit = event => {
    event.preventDefault(); const text = $('#live-message').value.trim(); if (!text || !configured || inFlight) return;
    voiceError = false; inFlight = 'reason'; controls(); stopDictation();
    addMessage('user', text); reply = addMessage('assistant', 'Considering your question…', true); setBusy(true);
    status('Considering your question…'); $('#live-answer').textContent = '';
    if (!send({type: 'transcript', text})) { failReply(reply, 'Curio Speak is disconnected. Reopen Speak and try again.'); reply = null; inFlight = null; controls(); }
    else { $('#live-message').value = ''; }
  };
  document.addEventListener('conversation-changed', () => { stopDictation(); voiceStatus(); if ($('#live-dialog').open) closeLive(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopDictation(); });
  window.addEventListener('pagehide', () => {
    stopDictation();
    if (reply) {
      failReply(reply, 'The page left Curio Speak before its answer arrived. This question may have finished on the server; check your history before trying again.');
      reply = null;
    }
    disconnect();
  });
}
