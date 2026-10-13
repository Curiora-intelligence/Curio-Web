/* Exercises production UI with the isolated HTTP/SSE/WS backend in serve_browser.py. */
const $=s=>document.querySelector(s);
const report=document.createElement('pre');report.id='browser-results';report.style.cssText='position:fixed;bottom:10px;right:10px;z-index:1000;max-width:550px;max-height:40vh;overflow:auto;background:var(--surface-elevated);color:var(--text-primary);border:1px solid var(--border-control);padding:16px;font:12px/1.6 monospace;white-space:pre-wrap';document.body.append(report);
let passes=0;const ok=(v,label)=>{if(!v)throw Error(label);report.textContent+=`PASS ${label}\n`;passes++;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(check,label){for(let n=0;n<100;n++){if(await check())return;await pause(50);}throw Error(`Timed out: ${label}`);}
function input(selector,value){$(selector).value=value;$(selector).dispatchEvent(new Event('input',{bubbles:true}));}
async function fixture(){return(await fetch('/__fixtures/state')).json();}
async function idle(){await until(()=>!$('#new-chat').disabled,'run completion');}
try{
await until(()=>$('#new-chat').onclick&&$('#history-list button'),'initialization');
const {state,renderAnswer}=await import('/static/js/chat.js');
const {validateImage}=await import('/static/js/api.js');
const {frameSize,captureJPEG}=await import('/static/js/live.js');
const {speechText}=await import('/static/js/voice.js');
ok($('#profile-name').textContent==='Test account','account response populates identity');
ok($('#send').disabled,'empty composer disabled');
$('[data-prompt]').click();ok($('#message').value.includes('write or edit')&&!$('#send').disabled,'quick action prepares an editable draft');
input('#message','Existing Chat draft');$('#work-tab').click();input('#work-message','Work draft');$('#chat-tab').click();
ok($('#message').value==='Existing Chat draft','Chat draft survives Work switching');
$('#work-tab').click();ok($('#work-message').value==='Work draft','Work draft survives Chat switching');
ok($('#work-panel .send-button').disabled,'unsupported Work execution disabled');
const before=(await fixture()).submissions.length;$('#continue-in-chat').click();
ok($('#message').value==='Existing Chat draft\n\nWork draft','Continue in Chat preserves both drafts');
ok((await fixture()).submissions.length===before,'switches and draft transfer send no request');
$('#message').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true}));
ok((await fixture()).submissions.length===before,'IME Enter never submits');
const shift=new KeyboardEvent('keydown',{key:'Enter',shiftKey:true,bubbles:true,cancelable:true});$('#message').dispatchEvent(shift);ok(!shift.defaultPrevented,'Shift+Enter remains multiline');
input('#message','Explain a clear plan');$('#chat-form').requestSubmit();await until(()=>state.busy,'accepted run');
input('#message','Draft during the run');$('#work-tab').click();await idle();$('#chat-tab').click();
ok(state.messages.length===2,'SSE replay does not duplicate messages');
ok(state.messages[1].activity.length===1,'SSE replay deduplicates progress IDs');
ok($('#message').value==='Draft during the run','running request and draft survive switching views');
ok(!$('#chat-panel').classList.contains('empty')&&$('#welcome').hidden,'active conversation hides landing');
let last=(await fixture()).submissions.at(-1);ok(last.mode==='general'&&last.user_id==='fixture-user'&&last.request_id,'multipart mode, identity and request ID retained');
ok(last.csrf==='test-csrf'&&last.identity==='fixture-user','CSRF and identity headers retained');
ok($('#messages pre')&&$('#messages table')&&!$('#messages script'),'safe Markdown, code and tables render');
ok(!$('#messages a[href^="javascript:"]'),'unsafe Markdown links remain inert');
ok([...$('#messages').querySelectorAll('a')].every(a=>a.rel.includes('noopener')),'external source links protected');
$('#new-chat').click();ok(state.messages.length===0&&$('#chat-panel').classList.contains('empty'),'New Chat clears only active conversation');
ok($('#history-list').textContent.includes('Explain a clear plan'),'real conversation appears in local history');
input('#history-search','Explain a clear plan');ok($('#history-list').querySelectorAll('button').length===1,'history search filters actual conversations');
$('#history-list button').click();ok(state.messages.length===2,'local conversation reopens');
input('#history-search','Stored conversation');$('#history-list button').click();await idle();ok($('#messages').textContent.includes('history endpoint'),'durable history endpoint retained');input('#history-search','');
$('#new-chat').click();input('#message','[poll] recover via status');$('#chat-form').requestSubmit();await until(()=>state.busy,'poll submission');await idle();ok(state.messages.length===2&&!state.messages[1].error,'malformed SSE falls back to read-only polling');
$('#new-chat').click();input('#message','[retry] same request');$('#chat-form').requestSubmit();await until(()=>$('#messages .text-button'),'retry action');$('#messages .text-button').click();await idle();
const retries=(await fixture()).submissions.filter(r=>r.message.startsWith('[retry]')).slice(-2);ok(retries.length===2&&retries[0].request_id===retries[1].request_id,'retry preserves idempotency key');ok(state.messages.length===2&&!state.messages[1].error,'retry reuses original response placeholder');
let invalid=0;for(const f of [new File(['x'],'bad.txt',{type:'text/plain'}),new File([],'empty.png',{type:'image/png'}),{type:'image/png',size:16*1024*1024}]){try{validateImage(f);}catch{invalid++;}}ok(invalid===3,'invalid, empty and oversized attachments rejected');
const blob=await new Promise(r=>{const c=document.createElement('canvas');c.width=8;c.height=8;c.toBlob(r,'image/png');});const file=new File([blob],'fixture.png',{type:'image/png'});validateImage(file);
const data=new DataTransfer();data.items.add(file);$('#image-file').files=data.files;$('#image-file').dispatchEvent(new Event('change'));ok(!$('#attachment').hidden,'valid image appears in composer');
$('#new-chat').click();const secondImage=new DataTransfer();secondImage.items.add(file);$('#image-file').files=secondImage.files;$('#image-file').dispatchEvent(new Event('change'));$('#chat-form').requestSubmit();await until(()=>state.busy,'image submission');await idle();ok((await fixture()).submissions.at(-1).image==='fixture.png','actual multipart image submission');
$('#memories-button').click();await until(()=>$('#memory-cards').textContent.includes('Concise explanations'),'memories');ok(true,'memory endpoint values render');$('#memory-dialog').close();
$('#microphone').click();window.__recognition.onresult({results:[[{transcript:'Dictated draft'}]]});ok($('#message').value==='Dictated draft','dictation fills editable draft');const dictationCount=(await fixture()).submissions.length;$('#microphone').click();ok((await fixture()).submissions.length===dictationCount,'dictation never auto-submits');ok(speechText('**Hello** `world`')==='Hello world','voice text normalization retained');
$('#open-live').click();await until(()=>!$('#live-send').disabled,'Live configuration');ok((await fixture()).socketEvents.at(-1).mode==='general','Live uses supported general mode');
window.__denyCamera=true;$('#enable-camera').click();await until(()=>$('#live-observation').textContent.includes('declined'),'denied camera');ok(true,'camera denial leaves text Live usable');window.__denyCamera=false;$('#enable-camera').click();await until(()=>$('#camera').videoWidth>0,'camera preview');
const jpeg=await captureJPEG($('#camera'));ok(jpeg?.jpeg&&atob(jpeg.jpeg).length<=512*1024,'sampled JPEG respects payload limit');ok(frameSize(4000,2000).width===1280,'frame sizing bounded');
await until(()=>!$('#live-send').disabled,'frame completion');input('#live-message','A Live question');$('#live-form').requestSubmit();await until(()=>state.busy,'Live question');$('#close-live').click();ok(window.__testStreams.every(s=>s.getTracks().every(t=>t.readyState==='ended')),'closing Live releases every camera track');await idle();ok(state.messages.at(-1).text==='Live fixture answer','accepted Live answer finishes in Chat after closing');
const renderer=document.createElement('div');renderAnswer(renderer,'<img src=x onerror=alert(1)>');ok(!renderer.querySelector('img'),'HTML remains inert text');
const count=(await fixture()).submissions.length;const recovery=document.createElement('iframe');recovery.src='/__test/app?recovery=true';document.body.append(recovery);await until(()=>recovery.contentDocument?.querySelector('#messages')?.textContent.includes('Recovered answer'),'reload recovery');ok((await fixture()).submissions.length===count,'accepted-run recovery never creates another POST');recovery.remove();
ok(!window.__errors.length,'no JavaScript errors or unhandled rejections');report.textContent+=`\n${passes} checks passed. Controlled backend/media; no model or physical device access.`;report.dataset.result='passed';
}catch(error){report.textContent+=`\nFAIL ${error.stack}`;report.dataset.result='failed';}
