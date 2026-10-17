/* Native Safari inspection of the actual production templates and loaded modules.
 * All controls and evidence plumbing in this file are development-only.
 */
const $=s=>document.querySelector(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
const appearance=new URLSearchParams(location.search).get('appearance')||'dark';
const toolbar=document.createElement('aside');
toolbar.style.cssText='position:fixed;z-index:9999;bottom:0;left:0;right:0;padding:12px;background:#eee;color:#111;font:13px system-ui;border-top:1px solid #aaa;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
toolbar.innerHTML=`<strong>Safari · actual Curio</strong><a href="?appearance=light">Light</a><a href="?appearance=dark">Dark</a><button id="safari-diagnose">Diagnose loaded control</button><button id="safari-sequence">Record sequence</button><button id="safari-reduced">Verify reduced motion</button><output id="safari-result">Ready</output>`;
document.body.append(toolbar);
let records=[];
const output=$('#safari-result'),surface=$('.mode-indicator'),path=surface.querySelector('path');
const sample=(time=0)=>({time,d:path.getAttribute('d'),cssD:getComputedStyle(path).d,rect:surface.getBoundingClientRect().toJSON(),state:$('.mode-switch').dataset.curioraMotion});
const save=(name,data)=>fetch('/__test/safari-result?name='+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
const metadata=async()=>{
 const module=performance.getEntriesByType('resource').find(r=>r.name.includes('/curiora/liquid.js'))?.name;
 const source=module?await fetch(module).then(r=>r.text()):'';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source));
 const sha=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const manifest=module?await fetch(new URL('snapshot.json',module)).then(r=>r.json()):null;
 return {userAgent:navigator.userAgent,appearance,cssPathSupported:CSS.supports('d','path("M0 0 L1 1")'),nativeAnimate:typeof path.animate,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,duration:getComputedStyle($('.mode-switch')).getPropertyValue('--curiora-liquid-duration'),module,sha,manifest,snapshotMatches:sha===manifest?.files['static/curiora/liquid.js'],surfaces:document.querySelectorAll('.mode-indicator').length,paths:surface.querySelectorAll('path').length};
};
async function travel(mode){
 const start=performance.now(),before=sample(0);$(`#${mode}-tab`).click();const afterClick=sample(0),frames=[afterClick];
 await new Promise(resolve=>{function tick(now){frames.push(sample(now-start));if(now-start<410)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
 return {mode,before,afterClick,frames};
}
$('#safari-diagnose').onclick=async()=>{
 output.textContent='Diagnosing…';$('#chat-tab').click();await wait(450);
 const data={metadata:await metadata(),transition:await travel('work')};await save(data.metadata.manifest?.version==='1.0.0'?'baseline':'diagnostic',data);
 output.textContent=`CSS d: ${data.metadata.cssPathSupported}; reduced: ${data.metadata.reduced}; motion: ${data.transition.afterClick.state}; distinct shapes: ${new Set(data.transition.frames.map(f=>f.d+'|'+f.cssD)).size}; snapshot match: ${data.metadata.snapshotMatches}`;
};
$('#safari-sequence').onclick=async()=>{
 records=[];$('#chat-tab').click();await wait(500);
 output.textContent='Chat → Work · 360ms';records.push(await travel('work'));await wait(500);
 output.textContent='Work → Chat · 360ms';records.push(await travel('chat'));await wait(500);
 output.textContent='Rapid reversals';const rapid=[];
 for(const mode of ['work','chat','work','chat','work','chat']){const before=sample();$(`#${mode}-tab`).click();rapid.push({mode,before,after:sample()});await wait(85);}
 await wait(450);const final=sample();
 const checks={animated:records.every(r=>r.afterClick.state==='flowing'&&new Set(r.frames.map(f=>f.d)).size>=5),extended:records.every(r=>Math.max(...r.frames.map(f=>f.rect.width))>r.before.rect.width*1.18),settled:records.every(r=>r.frames.at(-1).state==='rest'),continuous:rapid.every(r=>r.before.d===r.after.d&&r.before.rect.x===r.after.rect.x),rapidSettled:final.state==='rest'&&$('#chat-tab').getAttribute('aria-selected')==='true'};
 const data={metadata:await metadata(),records,rapid,final,checks};await save(appearance,data);output.textContent=`${Object.values(checks).every(Boolean)?'PASS':'FAIL'} ${appearance}: animated, stretched, settled, reversal continuity. ${data.metadata.manifest?.version}`;
};
$('#safari-reduced').onclick=async()=>{
 if(!new URLSearchParams(location.search).has('reduced')){location.href='?appearance='+appearance+'&reduced=1';return;}
 const changes=[];
 for(const mode of ['work','chat','work','chat']){
   $(`#${mode}-tab`).click();const frame=sample();changes.push({mode,frame,aligned:Math.abs(frame.rect.left-$(`#${mode}-tab`).getBoundingClientRect().left)<.1});await wait(80);
 }
 const data={metadata:await metadata(),changes,passed:changes.every(r=>r.frame.state==='rest'&&r.aligned),emulatedMedia:true};
 await save('reduced',data);output.textContent=`${data.passed?'PASS':'FAIL'} reduced motion: immediate actual product selection (media emulated; OS unchanged)`;
};
