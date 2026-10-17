/* Observe actual painted attribute geometry; no CSS path-animation fallback passes. */
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function checkLiquid(win,doc,ok,prefix){
  win.frameElement?.scrollIntoView({block:'center'});
  const $=s=>doc.querySelector(s),indicator=$('.mode-indicator'),path=indicator.querySelector('path');
  const read=()=>({rect:indicator.getBoundingClientRect(),d:path.getAttribute('d')});
  $('#chat-tab').click();await pause(410);
  const shell=$('.mode-switch').getBoundingClientRect(),width=read().rect.width;
  const labels=['chat','work'].map(mode=>$(`#${mode}-tab`).getBoundingClientRect().toJSON());
  for(const mode of ['work','chat']){
    const frames=[read()],started=win.performance.now();$(`#${mode}-tab`).click();
    ok($('.mode-switch').dataset.curioraMotion==='flowing',`${prefix}: ${mode} must animate when motion is enabled`);
    await new Promise(resolve=>{
      const sample=()=>{frames.push(read());if(win.performance.now()-started<400)win.requestAnimationFrame(sample);else resolve();};
      win.requestAnimationFrame(sample);
    });
    ok(new Set(frames.map(f=>f.d)).size>=5,`${prefix}: ${mode} paints at least five distinct SVG contours in real time`);
    ok(frames.every(({rect})=>rect.left>=shell.left-.1&&rect.right<=shell.right+.1),`${prefix}: ${mode} remains contained`);
    ok(Math.max(...frames.map(f=>f.rect.width))>width*1.18&&Math.max(...frames.map(f=>f.rect.width))<width*1.4,`${prefix}: ${mode} visibly extends then contracts`);
    ok(frames.some(f=>f.d!==frames[0].d&&f.d!==frames.at(-1).d),`${prefix}: ${mode} has intermediate silhouette deformation`);
    ok(labels.every((rect,i)=>JSON.stringify(rect)===JSON.stringify($(`#${['chat','work'][i]}-tab`).getBoundingClientRect().toJSON())),`${prefix}: ${mode} labels remain stationary`);
    ok($('.mode-switch').dataset.curioraMotion==='rest',`${prefix}: ${mode} fully stops at rest`);
    ok(Math.abs(read().rect.left-$(`#${mode}-tab`).getBoundingClientRect().left)<.1,`${prefix}: ${mode} aligns exactly`);
    ok(!indicator.getAnimations({subtree:true}).length&&!path.style.d,`${prefix}: ${mode} uses attributes without CSS d or WAAPI`);
  }
  for(const mode of ['work','chat','work','chat','work']){
    const before=read();$(`#${mode}-tab`).click();const after=read();
    ok(before.d===after.d&&before.rect.left===after.rect.left&&before.rect.width===after.rect.width,`${prefix}: reversal begins at last visible frame`);await pause(75);
  }
  await pause(410);
  ok($('.mode-switch').dataset.curioraMotion==='rest'&&$('#work-tab').getAttribute('aria-selected')==='true'&&!$('#work-panel').hidden,`${prefix}: rapid switching settles correctly`);
  const resting=read();await pause(70);ok(read().d===resting.d&&read().rect.left===resting.rect.left,`${prefix}: idle geometry stays unchanged`);
  ok(doc.querySelectorAll('.mode-indicator').length===1&&indicator.querySelectorAll('path').length===1,`${prefix}: one material surface`);
  ok(win.getComputedStyle($('.mode-switch')).overflow==='hidden'&&win.getComputedStyle(indicator).boxShadow==='none',`${prefix}: clipped motion adds no external halo`);
  $('#chat-tab').click();await pause(410);$('#work-tab').click();win.__setReducedMotion(true);
  ok($('.mode-switch').dataset.curioraMotion==='rest'&&Math.abs(read().rect.left-$('#work-tab').getBoundingClientRect().left)<.1,`${prefix}: OS reduced-motion change cancels active travel`);
  $('#chat-tab').click();ok($('.mode-switch').dataset.curioraMotion==='rest',`${prefix}: reduced motion selects immediately`);win.__setReducedMotion(false);
}

// This viewer runs the actual product and records live frames, not paused CSS keyframes.
if(location.pathname==='/motion-tests'){
  document.body.innerHTML=`<header><strong>Curio · live SVG motion verification</strong><select aria-label="Appearance"><option>dark</option><option>light</option></select><button>Run motion checks</button></header><iframe title="Actual Curio application"></iframe><pre id="motion-results"></pre>`;
  const frame=document.querySelector('iframe'),appearance=document.querySelector('select'),report=document.querySelector('pre');
  const load=()=>{frame.src=`/__test/app?appearance=${appearance.value}`;};appearance.onchange=load;load();
  document.querySelector('button').onclick=async()=>{report.textContent='';try{await checkLiquid(frame.contentWindow,frame.contentDocument,(v,label)=>{if(!v)throw Error(label);report.textContent+=`PASS ${label}\n`;},appearance.value);report.dataset.result='passed';}catch(error){report.textContent+=`FAIL ${error.stack}`;report.dataset.result='failed';}};
}
