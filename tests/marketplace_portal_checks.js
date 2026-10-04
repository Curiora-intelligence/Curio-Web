const page=document.querySelector('#marketplace-root').dataset.page;
const report=document.createElement('pre');report.id='portal-check-results';report.style='position:fixed;top:0;right:0;max-width:430px;z-index:20000;background:white;padding:12px;font-size:11px';document.body.append(report);let passed=0;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));async function until(fn){for(let i=0;i<100;i++){if(fn())return;await pause(40);}throw Error('Timed out waiting for UI');}function ok(value,label){if(!value)throw Error(label);passed++;report.textContent+='PASS '+label+'\n';}
const root=document.querySelector('#marketplace-root');
try{
 await until(()=>marketChecks.calls.some(c=>c.path==='/marketplace/notifications'));
 if(page==='requests'){
  ok(root.textContent.includes('COMPLETED') && root.textContent.includes('Demo Plumber'),'persistent request and provider rendered');
  [...root.querySelectorAll('button')].find(b=>b.textContent==='Review service.create_request').click();await until(()=>document.querySelector('dialog[open]'));ok(!marketChecks.calls.some(c=>c.path.endsWith('/confirm')),'reopened pending confirmation stays unexecuted');document.querySelector('dialog[open] .row button').click();
  [...root.querySelectorAll('button')].find(b=>b.textContent==='Status and events').click();await until(()=>document.querySelector('dialog[open]')?.textContent.includes('COMPLETED'));ok(document.querySelector('dialog[open]').textContent.includes('REQUESTED'),'authoritative request event timeline rendered');document.querySelector('dialog[open] .row button').click();
  root.querySelector('form').requestSubmit();await until(()=>marketChecks.calls.some(c=>c.path==='/marketplace/feedback'));ok(marketChecks.calls.some(c=>c.path==='/marketplace/reviews' && JSON.parse(c.body).request_id==='request1'),'review bound to completed request');ok(root.textContent.includes('Review saved'),'completed review success displayed');
 }else if(page==='notifications'){
  ok(root.textContent.includes('New · ACCEPTED'),'unread provider status update displayed');root.querySelector('button').click();await until(()=>marketChecks.read && root.textContent.includes('Read ·'));ok(!root.querySelector('button'),'read notification persisted and rerendered');
 }else if(page==='history'){
  ok(root.querySelector('a').getAttribute('href')==='/?conversation=conversation1','durable conversation reopens by server ID');ok(root.textContent.includes('request.status_changed') && root.textContent.includes('request1'),'authorized audit and request history rendered');
 }else if(page==='saved'){
  ok(root.textContent.includes('Saved service'),'durable shortlist rendered');ok([...root.querySelectorAll('button')].some(b=>b.textContent==='Unsave'),'saved list exposes owner-scoped unsave control');
 }else if(page==='provider'){
  ok(root.textContent.includes('Incoming requests') && root.textContent.includes('REQUESTED'),'provider incoming request rendered');ok(root.querySelector('input[name=price]').value==='450','owned structured price rendered');ok(root.querySelector('input[type=datetime-local]'),'availability editing is present');ok(root.textContent.includes('Good demo service'),'provider reviews rendered');ok(!document.querySelector('[data-role=PROVIDER]').hidden && document.querySelector('[data-role=ADMIN]').hidden,'provider navigation excludes admin access');
 }else if(page==='admin'){
  ok(root.textContent.includes('search_count') && root.textContent.includes('12'),'aggregate persisted analytics rendered');ok([...root.querySelectorAll('button')].some(b=>b.textContent==='Approve'),'provider verification action present');ok(root.textContent.includes('Review moderation') && root.textContent.includes('Audit'),'moderation and audit surfaces present');ok(!document.querySelector('[data-role=ADMIN]').hidden && document.querySelector('[data-role=PROVIDER]').hidden,'admin navigation matches role');
 }
 ok(marketChecks.calls.filter(c=>c.method!=='GET').every(c=>c.csrf==='csrf-test'),'all portal mutations attach session CSRF');report.textContent+='\n'+passed+' '+page+' checks passed';
}catch(e){report.textContent+='\nFAIL '+e.stack;}
