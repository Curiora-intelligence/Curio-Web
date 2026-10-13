import {speakCurio, cancelCurioSpeech} from './voice.js';
import {$, emit, config, notice, element, storage, userId,account} from './config.js';
import {request, runForm, validateImage} from './api.js';
import {watchRun} from './sse.js';

const historyKey = `curio_chats:${userId}`, pendingKey = `curio_pending:${userId}`;
const stageLabels = {understanding:'Understanding your request…', memory:'Checking relevant context…', perception:'Analyzed image', confirmation:'Requested exact action confirmation', reasoning:'Working on your request…', tool_execution:'Checking available options…', verification:'Verifying the result…', response:'Preparing response…'};
export const state = {conversationId:null, localId:crypto.randomUUID(), messages:[], mode:'general', busy:false, location:null};
let image = null, stopWatching = null;
const nodes = new Map();
let history = storage.read(historyKey, []);
if (!Array.isArray(history)) history = [];
history = history.filter(item => item && typeof item.id === "string" && Array.isArray(item.messages));

function save() {
  if (!state.messages.length) return;
  const item = {id:state.localId, conversationId:state.conversationId, mode:state.mode, messages:state.messages.slice(-100), title:state.messages.find(m => m.role === 'user')?.text.slice(0,60) || 'Live conversation', updated:Date.now()};
  history = [item, ...history.filter(c => c.id !== item.id)].slice(0,30);
  storage.write(historyKey, history); renderHistory();
}
function renderHistory() {
  const list = $('#history-list'), query = $('#history-search').value.trim().toLowerCase(); list.replaceChildren();
  const entries = history.filter(item => String(item.title).toLowerCase().includes(query));
  if (!entries.length) list.append(element('p','sidebar-empty',query ? 'No matching conversations' : 'No conversations yet'));
  for (const item of entries) {
    const button = element('button','history-entry',item.title); button.disabled = state.busy;
    button.setAttribute('aria-current', String(item.id === state.localId));
    button.onclick = () => {
      if (state.busy) return;
      if (!item.messages.length && item.conversationId && account) { openDurableConversation(item.conversationId); return; }
      state.localId = item.id; state.conversationId = item.conversationId; state.messages = item.messages;
      renderAll(); $('#scrim').click(); emit('show-chat'); emit('conversation-changed');
    };
    list.append(button);
  }
}
function updateComposer() { $('#send').disabled = state.busy || (!$('#message').value.trim() && !image); }
export function setBusy(busy) {
  state.busy = busy; updateComposer(); $('#new-chat').disabled = busy; $('#open-live').disabled = busy;
  $('#message').setAttribute('aria-busy', String(busy));
  for (const button of document.querySelectorAll('.history-entry')) button.disabled = busy;
  $('#composer-note').textContent = busy ? 'Curio is working. You can keep writing.' : '';
}
function syncConversation() {
  const empty = !state.messages.length;
  $('#welcome').hidden = !empty; $('#chat-stage').classList.toggle('empty',empty); $('#chat-panel').classList.toggle('empty',empty);
}
function renderActivity(message, node) {
  const container = node.querySelector('.message-activity'); container.replaceChildren();
  if (!message.activity?.length) return;
  const details = $('#progress-template').content.firstElementChild.cloneNode(true);
  for (const entry of message.activity) {
    const row=element('li','activity-step');
    if(typeof entry==='string')row.append(element('span','',entry));
    else row.append(element('strong','activity-label',entry.label),element('span','',entry.detail));
    details.querySelector('ol').append(row);
  }
  details.open=message.pending || !!message.activity.some(entry=>typeof entry!=='string');
  container.append(details);
}
function updateMessage(message) {
  const node = nodes.get(message.id); if (!node) return;
  node.className = `message ${message.role} ${message.pending ? 'pending' : ''} ${message.error ? 'failed' : ''}`;
  const body = node.querySelector('.message-body');
  if (message.role === 'assistant' && !message.pending && !message.error) renderAnswer(body, message.text);
  else body.textContent = message.text;
  node.querySelector('.message-label').textContent = message.role === 'user' ? 'YOU' : 'CURIO';
  renderActivity(message,node);
}
export function addMessage(role, text, pending = false) {
  const message = {id:crypto.randomUUID(),role,text,pending,activity:[]}; state.messages.push(message);
  const node = $('#message-template').content.firstElementChild.cloneNode(true); nodes.set(message.id,node); $('#messages').append(node); updateMessage(message);
  $('#page-label').textContent = 'Your conversation'; syncConversation();
  requestAnimationFrame(() => { $('#chat-stage').scrollTop = $('#chat-stage').scrollHeight; }); return message;
}
function renderAll() {
  $('#messages').replaceChildren(); nodes.clear();
  for (const message of state.messages) { const node=$('#message-template').content.firstElementChild.cloneNode(true); nodes.set(message.id,node); $('#messages').append(node); updateMessage(message); }
  syncConversation();
  $('#page-label').textContent = state.messages.length ? 'Your conversation' : 'A fresh conversation'; renderHistory();
}
export function completeReply(reply, data) {
  if (typeof data.answer !== 'string' || !data.conversation_id || data.user_id !== userId) { failReply(reply, 'Curio returned an incomplete response. Reopen this chat to check again.'); return; }
  reply.text = data.answer; reply.pending = false; reply.error = false; state.conversationId = data.conversation_id;
  updateMessage(reply); save(); storage.remove(pendingKey); setBusy(false); emit('memory-refresh'); speakCurio(data.answer);
}
export function failReply(reply, message) { reply.text=message; reply.pending=false; reply.error=true; updateMessage(reply); save(); storage.remove(pendingKey); setBusy(false); }
function follow(id, reply) {
  stopWatching?.();
  stopWatching = watchRun(id, {
    stage(data) { if (!stageLabels[data.stage]) return; reply.text=stageLabels[data.stage]; if(data.stage==='memory' && data.remembered?.length)reply.activity.push({label:'Remembered',detail:data.remembered.join(' • ')}); else if(!['verification','response'].includes(data.stage))reply.activity.push({label:'Stage',detail:reply.text}); updateMessage(reply); },
    tool(data) { if (!['started','finished','failed'].includes(data.status)) return; reply.activity.push({label:data.status==='started'?'Using tool':data.status==='finished'?'Tool result returned':'Tool unavailable',detail:data.status==='finished'?`${data.tool} · Tool result returned`:data.tool}); updateMessage(reply); },
    connection(text) { $('#composer-note').textContent = text; },
    final(data) { completeReply(reply,data); },
    error(message) { failReply(reply,message); },
    done() { stopWatching = null; },
  });
}
async function accept(form, reply) {
  setBusy(true); reply.pending=true; reply.error=false; reply.text='Connecting to Curio…'; updateMessage(reply); notice();
  try {
    const result = await request('/curio/runs',{method:'POST',body:form});
    if (!result.request_id) throw new Error('Curio did not return a request ID.');
    reply.text = 'Request accepted. Waiting for Curio…'; updateMessage(reply); save();
    storage.write(pendingKey, {runId:result.request_id, localId:state.localId, replyId:reply.id}); follow(result.request_id,reply);
  } catch (error) {
    failReply(reply,error.message);
    const retry=element('button','text-button','Retry this submission');
    retry.onclick = () => { retry.remove(); accept(form,reply); };
    nodes.get(reply.id).querySelector('.message-activity').append(retry);
  }
}
export function initChat() {
  try {
    const draft = JSON.parse(sessionStorage.getItem('curio_signin_draft'));
    sessionStorage.removeItem('curio_signin_draft');
    if (draft?.userId === userId) {
      $('#message').value = String(draft.chat || '').slice(0,16000);
      $('#work-message').value = String(draft.work || '').slice(0,16000);
      for (const id of ['#message','#work-message']) $(id).dispatchEvent(new Event('input'));
    }
  } catch { /* Optional session storage must not prevent initialization. */ }
  $('#chat-form').onsubmit = (event) => {
    event.preventDefault(); if (state.busy) return;
    if (!account && !config.development) { emit('auth-required'); return; }
    cancelCurioSpeech(); emit('stop-dictation');
    const text=$('#message').value.trim(); if (!text && !image) return;
    const form=runForm({text, image, conversationId:state.conversationId, mode:'general', location:state.location, requestId:crypto.randomUUID()});
    addMessage('user',text + (image ? `\n[Image: ${image.name}]` : '')); const reply=addMessage('assistant','Connecting to Curio…',true);
    $('#message').value=''; $('#message').dispatchEvent(new Event('input')); clearImage(); accept(form,reply);
  };
  $('#message').onkeydown = (event) => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); $('#chat-form').requestSubmit(); } };
  $('#new-chat').onclick = () => { if (state.busy) return; stopWatching?.(); state.conversationId=null; state.localId=crypto.randomUUID(); state.messages=[]; $('#message').value=''; $('#message').dispatchEvent(new Event('input')); clearImage(); notice(); renderAll(); emit('show-chat'); emit('conversation-changed'); emit('memory-refresh'); $('#scrim').click(); $('#message').focus(); };
  $('#history-button').onclick = () => { $('#history-list').scrollIntoView({block:'nearest'}); };
  $('#history-search').addEventListener('input',renderHistory);
  $('#message').addEventListener('input',updateComposer);
  for (const button of document.querySelectorAll('[data-prompt]')) button.onclick = () => { if(state.busy) return; $('#message').value=button.dataset.prompt; $('#message').dispatchEvent(new Event('input')); $('#message').focus(); };
  $('#attach-image').onclick = () => $('#image-file').click();
  $('#image-file').onchange = () => { const file=$('#image-file').files[0]; if (!file) return; try { validateImage(file); image=file; $('#attachment span').textContent=file.name; $('#attachment').hidden=false; updateComposer(); notice(); } catch(error) { clearImage(); notice(error.message); } };
  $('#remove-image').onclick = clearImage;
  renderHistory();
  if(account)loadDurableHistory();
  const pending=storage.read(pendingKey), conversation=history.find(c=>c.id===pending?.localId);
  if (conversation && pending?.runId) { Object.assign(state,{localId:conversation.id,conversationId:conversation.conversationId,messages:conversation.messages}); renderAll(); const reply=state.messages.find(m=>m.id===pending.replyId); if(reply) { setBusy(true); follow(pending.runId,reply); } }
  const requested=new URLSearchParams(location.search).get('conversation'); if (requested && account && !state.busy) openDurableConversation(requested);
  updateComposer();
}
function clearImage() { image=null; $('#image-file').value=''; $('#attachment').hidden=true; updateComposer(); }

// Safe, small Markdown renderer. Source buttons never open automatically.
export function renderAnswer(container, text) {
  container.replaceChildren();const sources=new Map();
  function link(label,url){
    const anchor=element('a','',label);
    try{const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol) || parsed.username || parsed.password)throw Error();
      anchor.href=parsed.href;anchor.target='_blank';anchor.rel='noopener noreferrer';sources.set(parsed.href,parsed.hostname);
    }catch{return document.createTextNode(label);}
    return anchor;
  }
  function inline(parent,value){
    const pattern=/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<>]+|\*[^*]+\*)/g;let cursor=0;
    for(const match of value.matchAll(pattern)){
      parent.append(document.createTextNode(value.slice(cursor,match.index)));const token=match[0];let node;
      if(token.startsWith('**'))node=element('strong','',token.slice(2,-2));
      else if(token.startsWith('*'))node=element('em','',token.slice(1,-1));
      else if(token.startsWith('`'))node=element('code','',token.slice(1,-1));
      else if(token.startsWith('[')){const split=token.indexOf('](');node=link(token.slice(1,split),token.slice(split+2,-1));}
      else {const url=token.replace(/[.,;!?)]+$/,'');node=link(url,url);}
      parent.append(node);cursor=match.index+token.length;
    }parent.append(document.createTextNode(value.slice(cursor)));
  }
  let list=null,code=null;const lines=String(text).split('\n');
  const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(value=>value.trim());
  for(let index=0;index<lines.length;index++){
    const line=lines[index];
    if(line.trim().startsWith('```')){if(code)code=null;else{code=element('pre','answer-code','');container.append(code);}list=null;continue;}
    if(code){code.textContent+=line+'\n';continue;}if(!line.trim()){list=null;continue;}
    if(line.trim().startsWith('|') && /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[index+1]||'')){
      const scroll=element('div','answer-table-scroll'),table=element('table','answer-table'),head=element('thead'),body=element('tbody'),row=element('tr');
      scroll.tabIndex=0;scroll.setAttribute('aria-label','Answer table');
      for(const value of cells(line)){const cell=element('th');cell.scope='col';inline(cell,value);row.append(cell);}head.append(row);table.append(head,body);index++;
      while(index+1<lines.length && lines[index+1].trim().startsWith('|')){const row=element('tr');for(const value of cells(lines[++index])){const cell=element('td');inline(cell,value);row.append(cell);}body.append(row);}
      scroll.append(table);container.append(scroll);list=null;continue;
    }
    const bullet=line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);
    if(bullet){if(!list){list=element('ul');container.append(list);}const item=element('li');inline(item,bullet[1]);list.append(item);}
    else{list=null;const heading=line.match(/^#{1,4}\s+(.+)/);const paragraph=element(heading?'h3':'p');inline(paragraph,heading?heading[1]:line);container.append(paragraph);}
  }
  if(sources.size){const cards=element('div','source-links');for(const [url,host] of sources){const button=link(`Open ${host} ↗`,url);button.className='source-link';cards.append(button);}container.append(cards);}
}

async function loadDurableHistory() {
  try {
    // This existing backend route also owns general conversations; keep its contract.
    const data = await request('/marketplace/history/conversations');
    for (const entry of data.conversations || []) {
      if (!history.some(item => item.conversationId === entry.id)) history.push({id:entry.id,conversationId:entry.id,mode:'general',messages:[],title:entry.title});
    }
    renderHistory();
  } catch { /* Browser-local conversations remain available offline. */ }
}
export async function openDurableConversation(id) {
  if (state.busy) return;
  setBusy(true); $('#composer-note').textContent = 'Loading conversation…';
  try {
    const data = await request(`/marketplace/conversations/${encodeURIComponent(id)}`);
    state.conversationId = id; state.localId = id;
    state.messages = data.messages.map(item => ({id:item.id,role:item.role,text:item.content,activity:[]}));
    renderAll(); emit('show-chat'); emit('conversation-changed'); $('#scrim').click();
  } catch(error) { notice(error.message); }
  finally { setBusy(false); }
}
