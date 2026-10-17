// Curiora interactions 1.0.1 — presentation only, no product or transport state.
const clamp = n => Math.max(0, Math.min(1, n));
const smooth = n => { const t = clamp(n); return t*t*(3-2*t); };
const mix = (a,b,t) => a+(b-a)*t;

/** Eight connected cubic curves: a full leading shoulder and a tapered tail.
 * Every frame has identical path topology, including the rounded resting state.
 */
function outlinePoints(width, height, amount = 0, direction = 1) {
  const r = Math.min(height/2-1, width/2-1), a = clamp(amount);
  let tail = r*(1-.24*a), head = r*(1-.015*a);
  if (direction<0) [tail,head]=[head,tail];
  const cy = height/2;
  const left = 1+tail, right = width-1-head, mid = (left+right)/2;
  const topTail = cy-tail, topHead = cy-head, bottomTail = cy+tail, bottomHead = cy+head;
  const waistTop = mix(topTail,topHead,.5)+height*.045*a;
  const waistBottom = mix(bottomTail,bottomHead,.5)-height*.025*a;
  const k = .55228475;
  const commands = [
    ['M',left,topTail],
    ['C',left+(mid-left)*.55,topTail,mid-(mid-left)*.35,waistTop,mid,waistTop],
    ['C',mid+(right-mid)*.35,waistTop,right-(right-mid)*.55,topHead,right,topHead],
    ['C',right+head*k,topHead,width-1,cy-head*k,width-1,cy],
    ['C',width-1,cy+head*k,right+head*k,bottomHead,right,bottomHead],
    ['C',right-(right-mid)*.55,bottomHead,mid+(right-mid)*.35,waistBottom,mid,waistBottom],
    ['C',mid-(mid-left)*.35,waistBottom,left+(mid-left)*.55,bottomTail,left,bottomTail],
    ['C',left-tail*k,bottomTail,1,cy+tail*k,1,cy],
    ['C',1,cy-tail*k,left-tail*k,topTail,left,topTail]
  ];
  return commands.flatMap(([, ...points]) => points);
}

function outlinePath(points) {
  return 'M'+points.slice(0,2).map(n=>Number(n.toFixed(3))).join(' ')+' '+
    Array.from({length:8},(_,i)=>'C'+points.slice(2+i*6,8+i*6).map(n=>Number(n.toFixed(3))).join(' ')).join(' ')+' Z';
}

export function liquidOutline(width, height, amount = 0, direction = 1) {
  return outlinePath(outlinePoints(width,height,amount,direction));
}

/** Nonlinear leading/trailing progress. Boundaries never overshoot either end. */
export function liquidFrame(start, end, height, t) {
  const direction = end.x+end.width/2 >= start.x+start.width/2 ? 1 : -1;
  const leading = smooth(t/.83), trailing = smooth((t-.10)/.90);
  const left = mix(start.x,end.x,direction>0 ? trailing : leading);
  const right = mix(start.x+start.width,end.x+end.width,direction>0 ? leading : trailing);
  const distance = Math.abs(end.x-start.x)/Math.max(end.width,1);
  const amount = Math.sin(Math.PI*clamp(t))**1.2*Math.min(1,distance);
  const width=right-left, points=outlinePoints(width,height,amount,direction);
  if (start.points) {
    // Carry the last painted contour into a reversal, then smoothly release its
    // displacement. Normalize x to the changing surface width; topology is fixed.
    const rest=outlinePoints(start.width,height), carry=1-smooth(t/.5);
    for(let i=0;i<points.length;i++) points[i]+=(start.points[i]-rest[i])*carry*(i%2===0?width/start.width:1);
  }
  return {x:left,width,points,d:outlinePath(points)};
}

export function createSegmentedControl(control, {selected, onSelect = () => {}, reducedMotion = false} = {}) {
  const doc = control.ownerDocument, win = doc.defaultView;
  const buttons = [...control.querySelectorAll(':scope > button')];
  const available = () => buttons.filter(button => !button.disabled && button.getAttribute('aria-disabled')!=='true');
  if (buttons.length<2) throw new Error('A segmented control needs at least two buttons.');
  if (!control.hasAttribute('role')) control.setAttribute('role','radiogroup');
  for(const button of buttons)if(!button.hasAttribute('role'))button.setAttribute('role',control.getAttribute('role')==='tablist'?'tab':'radio');
  let current = selected || buttons.find(button => button.getAttribute('aria-selected')==='true' || button.getAttribute('aria-checked')==='true') || available()[0];
  if (!available().includes(current)) current=available()[0];
  if (!current) throw new Error('A segmented control needs an enabled segment.');
  let active = null, visible = null, forcedReduced = reducedMotion, destroyed = false;
  const media = win.matchMedia('(prefers-reduced-motion: reduce)');
  const indicator = control.querySelector('.curiora-liquid') || doc.createElement('span');
  indicator.classList.add('curiora-liquid'); indicator.setAttribute('aria-hidden','true');
  if (!indicator.parentElement) control.prepend(indicator);
  const svg = doc.createElementNS('http://www.w3.org/2000/svg','svg');
  const path = doc.createElementNS(svg.namespaceURI,'path');
  svg.setAttribute('aria-hidden','true'); svg.append(path); indicator.replaceChildren(svg);
  control.style.setProperty('--curiora-segments',buttons.length);
  const origin = () => control.getBoundingClientRect().left+control.clientLeft;
  function target() { const r=current.getBoundingClientRect(); return {x:r.left-origin(),width:r.width}; }
  const height = () => indicator.getBoundingClientRect().height;
  function paint(frame) {
    visible=frame;
    indicator.style.transform=`translateX(${frame.x}px)`;
    indicator.style.width=`${frame.width}px`;
    path.setAttribute('d',frame.d);
  }
  function cancel() {
    if(active) { active.stop(); active=null; }
  }
  function settle() {
    cancel(); const end=target();
    paint(liquidFrame(end,end,height(),1));
    control.dataset.curioraMotion='rest';
  }
  function flow(start,end,h,duration) {
    let raf=null, elapsed=0, started=null, playing=true;
    const stop=()=>{if(raf!==null)win.cancelAnimationFrame(raf);raf=null;playing=false;};
    // A small inspection handle retains the earlier pause/seek/play API. It is
    // not a native Animation: production rendering only writes SVG attributes.
    const animation={
      stop,
      ready:Promise.resolve(),
      effect:{getTiming:()=>({duration})},
      get currentTime(){return elapsed;},
      set currentTime(value){
        if(active!==animation)return;
        elapsed=Math.max(0,Math.min(duration,Number(value)||0));
        started=win.performance.now()-elapsed;
        paint(liquidFrame(start,end,h,elapsed/duration));
      },
      pause(){if(active===animation)stop();},
      play(){if(active!==animation||playing)return;playing=true;started=win.performance.now()-elapsed;raf=win.requestAnimationFrame(tick);},
      finish(){if(active===animation)settle();},
      cancel(){if(active===animation)settle();}
    };
    function tick(now) {
      raf=null;
      if(active!==animation||!playing)return;
      // Start with the first deliverable frame; a background/initial frame delay
      // must not consume the entire visible transition before it is painted.
      if(started===null)started=now-elapsed;
      elapsed=Math.min(duration,Math.max(0,now-started));
      paint(liquidFrame(start,end,h,elapsed/duration));
      if(elapsed>=duration)settle();
      else raf=win.requestAnimationFrame(tick);
    }
    active=animation;control.dataset.curioraMotion='flowing';
    // Keep the last painted geometry until the next frame. Never write the end
    // state underneath an animation: there is only one authoritative surface.
    raf=win.requestAnimationFrame(tick);
  }
  function semantics() {
    for (const button of buttons) {
      const attribute=button.getAttribute('role')==='tab' ? 'aria-selected' : 'aria-checked';
      button.setAttribute(attribute,String(button===current)); button.tabIndex=button===current ? 0 : -1;
    }
  }
  function select(button, {notify=false, focus=false} = {}) {
    if (destroyed || !available().includes(button)) return;
    if (button!==current) {
      // This is exactly the last painted frame, including its numeric contour.
      const start=visible;
      cancel(); current=button; semantics();
      const end=target(), h=height();
      const token=win.getComputedStyle(control).getPropertyValue('--curiora-liquid-duration').trim();
      const duration=parseFloat(token)*(token.endsWith('ms')?1:1000);
      if (media.matches || forcedReduced || !(duration>0)) settle();
      else flow(start,end,h,duration);
      if (notify) onSelect(button);
    }
    if (focus) button.focus();
  }
  const click = event => { const button=event.target.closest('button'); if(buttons.includes(button))select(button,{notify:true}); };
  const keydown = event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key) || !buttons.includes(event.target)) return;
    event.preventDefault(); const choices=available(), index=choices.indexOf(event.target);
    const rtl=win.getComputedStyle(control).direction==='rtl';
    const step=(event.key==='ArrowRight' ? 1 : -1)*(rtl ? -1 : 1);
    const next=event.key==='Home' ? choices[0] : event.key==='End' ? choices.at(-1) : choices[(index+step+choices.length)%choices.length];
    select(next,{notify:true,focus:true});
  };
  control.addEventListener('click',click); control.addEventListener('keydown',keydown);
  media.addEventListener('change',settle); win.addEventListener('pagehide',settle);
  // ResizeObserver delivers an initial notification even without a resize.
  // Ignore it so a first interaction is never cancelled by initialization.
  let size=control.getBoundingClientRect();
  const resize=new win.ResizeObserver(()=>{
    const next=control.getBoundingClientRect();
    if(next.width!==size.width||next.height!==size.height){size=next;settle();}
  }); resize.observe(control);
  semantics(); settle();
  return {select, settle, get selected(){return current;}, get animations(){return active?[active]:[];},
    setReducedMotion(value){forcedReduced=!!value;settle();},
    destroy(){settle();destroyed=true;resize.disconnect();media.removeEventListener('change',settle);win.removeEventListener('pagehide',settle);control.removeEventListener('click',click);control.removeEventListener('keydown',keydown);}
  };
}
