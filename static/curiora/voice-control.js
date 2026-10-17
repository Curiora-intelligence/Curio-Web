// Original Curiora geometry. JSON literal is also consumed by the source-snapshot tool.
export const VOICE_PATHS = ["M4.25 10.25v3.5","M8.125 7.125v9.75","M12 3.75v16.5","M15.875 7.125v9.75","M19.75 10.25v3.5"];
export const VOICE_STROKE = 1.8;

export function createVoiceIcon(doc = document, size = 20) {
  const ns='http://www.w3.org/2000/svg', svg=doc.createElementNS(ns,'svg');
  for(const [name,value] of Object.entries({width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':VOICE_STROKE,'stroke-linecap':'round','aria-hidden':'true'}))svg.setAttribute(name,value);
  const group=doc.createElementNS(ns,'g'); group.classList.add('curiora-voice-wave');
  for(const d of VOICE_PATHS){const path=doc.createElementNS(ns,'path');path.setAttribute('d',d);group.append(path);}
  svg.append(group);return svg;
}

/** Visual state only. The host supplies genuine session/recognition state and labels.
 * No audio sampling, timers, speech services or synthetic level animation.
 */
export function setVoiceState(button, state = 'idle', {label} = {}) {
  if(!['idle','connecting','ready','listening','responding','speaking','error'].includes(state))throw new Error('Unknown voice state');
  button.dataset.voiceState=state;
  if(label)button.setAttribute('aria-label',label);
}
