/* Test-only browser storage and media. Production never loads this module. */
const values = new Map();
Object.defineProperty(window,'localStorage',{value:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),clear:()=>values.clear()}});
window.__errors = [];
window.addEventListener('error',event=>window.__errors.push(event.message));
window.addEventListener('unhandledrejection',event=>window.__errors.push(String(event.reason)));
if (new URLSearchParams(location.search).has('recovery')) {
  localStorage.setItem('curio_chats:fixture-user',JSON.stringify([{id:'recovered-local',conversationId:'recovered-conversation',title:'Recovered chat',mode:'Personal',messages:[{id:'recovered-reply',role:'assistant',text:'Waiting',pending:true,activity:[]}]}]));
  localStorage.setItem('curio_pending:fixture-user',JSON.stringify({localId:'recovered-local',runId:'recovered-run',replyId:'recovered-reply'}));
}
window.__mediaRequests = 0;
Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{
  window.__mediaRequests++; throw new Error('Camera access must never be requested by Curio Web');
}});
window.SpeechRecognition = class {
  start(){window.__recognition=this;}
  stop(){this.onend?.();}
};

// Test OS preference changes without touching the user's system settings.
const nativeMatchMedia = window.matchMedia.bind(window);
const motionQuery = new EventTarget();
motionQuery.matches = false;
motionQuery.media = '(prefers-reduced-motion: reduce)';
window.matchMedia = query => query === motionQuery.media ? motionQuery : nativeMatchMedia(query);
window.__setReducedMotion = matches => { motionQuery.matches = matches; motionQuery.dispatchEvent(new Event('change')); };
