/* Development-only frame sampling of the actual production indicator. */
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function checkLiquid(win, doc, ok, prefix) {
  const $ = selector => doc.querySelector(selector), indicator = $('.mode-indicator');
  $('#chat-tab').click(); await pause(380);
  const shell = $('.mode-switch').getBoundingClientRect();
  const labels = ['chat','work'].map(mode => $(`#${mode}-tab`).getBoundingClientRect().toJSON());
  const width = indicator.getBoundingClientRect().width;
  const shadow = win.getComputedStyle($('.mode-switch')).boxShadow;
  for (const mode of ['work','chat']) {
    $(`#${mode}-tab`).click();
    const animation = indicator.getAnimations()[0];
    ok(!!animation && animation.effect.getTiming().duration === 320, `${prefix}: ${mode} uses one 320ms geometry animation`);
    animation.pause();
    const frames = [];
    for (let time=0; time<=320; time+=16) {
      animation.currentTime = time;
      const rect = indicator.getBoundingClientRect();
      frames.push(rect);
      ok(rect.left >= shell.left && rect.right <= shell.right && rect.top >= shell.top && rect.bottom <= shell.bottom,
        `${prefix}: ${mode} frame ${time}ms stays inside glass`);
    }
    ok(frames[4].width > width*1.25 && frames[11].width > width*1.4, `${prefix}: ${mode} visibly stretches and flows`);
    ok(frames[17].width < frames[11].width && Math.abs(frames[20].width-width)<.1, `${prefix}: ${mode} tail recovers its resting width`);
    const leading = mode==='work' ? 'right' : 'left', trailing = mode==='work' ? 'left' : 'right';
    ok(Math.abs(frames[4][leading]-frames[0][leading]) > Math.abs(frames[4][trailing]-frames[0][trailing])*5, `${prefix}: ${mode} leading edge moves before tail`);
    ok(labels.every((rect,index) => JSON.stringify(rect) === JSON.stringify($(`#${['chat','work'][index]}-tab`).getBoundingClientRect().toJSON())), `${prefix}: ${mode} labels remain stationary`);
    animation.finish(); await pause(30);
    ok(!indicator.getAnimations().length && $('.mode-switch').dataset.motion==='rest', `${prefix}: ${mode} fully stops at rest`);
    ok(Math.abs(indicator.getBoundingClientRect().left-$(`#${mode}-tab`).getBoundingClientRect().left)<.1, `${prefix}: ${mode} aligns exactly`);
  }
  let previous;
  for (const mode of ['work','chat','work','chat','work']) {
    $(`#${mode}-tab`).click();
    const animation=indicator.getAnimations()[0]; animation.pause(); animation.currentTime=0;
    const start=indicator.getBoundingClientRect();
    if(previous)ok(Math.abs(start.left-previous.left)<.1&&Math.abs(start.width-previous.width)<.1, `${prefix}: rapid reversal inherits visible geometry`);
    animation.currentTime=80; previous=indicator.getBoundingClientRect();
  }
  indicator.getAnimations()[0].play(); await pause(380);
  ok(!indicator.getAnimations().length && $('#work-tab').getAttribute('aria-selected')==='true' && !$('#work-panel').hidden, `${prefix}: rapid switching settles correctly`);
  ok(doc.querySelectorAll('.mode-indicator').length===1 && win.getComputedStyle(indicator,'::after').content==='none', `${prefix}: one material surface without tide layer`);
  ok(win.getComputedStyle($('.mode-switch')).overflow==='hidden' && win.getComputedStyle($('.mode-switch')).boxShadow===shadow, `${prefix}: clipped motion adds no external halo`);
  $('#chat-tab').click(); await pause(380);
  $('#work-tab').click(); win.__setReducedMotion(true);
  ok(!indicator.getAnimations().length && Math.abs(indicator.getBoundingClientRect().left-$('#work-tab').getBoundingClientRect().left)<.1, `${prefix}: OS reduced-motion change cancels active travel`);
  $('#chat-tab').click();
  ok(!indicator.getAnimations().length, `${prefix}: reduced motion selects immediately`);
  win.__setReducedMotion(false);
}

// A visible frame scrubber drives real tabs and pauses their real WAAPI animation.
// It does not clone the control or recreate its motion in a mockup.
if (location.pathname==='/motion-tests') {
  document.body.innerHTML=`<header><strong>Curio · rendered motion inspection</strong>
    <select aria-label="Appearance"><option>dark</option><option>light</option></select>
    <button id="forward">Chat → Work</button><button id="reverse">Work → Chat</button>
    <button id="play" disabled>Play 320ms</button><button id="next">Next 16ms frame</button><button id="hover">Freeze next icon hover</button>
    <label>Time <input aria-label="Animation time" type="number" min="0" max="320" step="16" value="0"></label>
    <output>Ready</output></header><iframe title="Actual Curio application"></iframe>`;
  const frame=document.querySelector('iframe'), output=document.querySelector('output'), time=document.querySelector('input');
  let animation;
  const appearance=document.querySelector('select');
  const play=document.querySelector('#play');
  const load=()=>{animation=null;play.disabled=true;output.textContent='Ready';frame.src=`/__test/app?appearance=${appearance.value}`;};
  appearance.onchange=load; load();
  const sample=()=>{if(!animation)return;animation.currentTime=Number(time.value);output.textContent='Rendering…';requestAnimationFrame(()=>requestAnimationFrame(()=>{output.textContent=`${time.value} / 320ms · ${time.value<70?'stretch':time.value<265?'flow':'settle'}`;}));};
  const begin=async mode=>{
    play.disabled=true;output.textContent='Preparing transition…';
    const doc=frame.contentDocument;doc.getElementById(`${mode==='work'?'chat':'work'}-tab`).click();await pause(380);
    doc.getElementById(`${mode}-tab`).click();animation=doc.querySelector('.mode-indicator').getAnimations()[0];
    animation.pause();time.value=0;play.disabled=false;sample();
  };
  document.querySelector('#forward').onclick=()=>begin('work');
  document.querySelector('#reverse').onclick=()=>begin('chat');
  play.onclick=()=>{animation.currentTime=0;animation.play();output.textContent='Playing at actual 320ms speed';};
  document.querySelector('#next').onclick=()=>{time.value=Math.min(320,Number(time.value)+16);sample();};
  time.oninput=sample;
  document.querySelector('#hover').onclick=()=>{
    const doc=frame.contentDocument;
    output.textContent='Hover Speak or Send to inspect its actual animation at 150ms';
    const freeze=event=>{
      const button=event.target.closest('#open-live,#send');if(!button)return;
      doc.removeEventListener('pointerover',freeze);
      requestAnimationFrame(()=>{
        const animations=button.getAnimations({subtree:true});
        for(const item of animations){item.pause();item.currentTime=150;}
        output.textContent=`Frozen ${button.id}: ${animations.length} animations at 150ms`;
      });
    };
    doc.addEventListener('pointerover',freeze);
  };
}
