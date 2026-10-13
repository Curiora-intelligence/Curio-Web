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
window.__testStreams = [];
Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:async()=>{
  if(window.__denyCamera) throw new DOMException('Permission denied','NotAllowedError');
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#527dad';ctx.fillRect(0,0,640,480);
  const stream=canvas.captureStream(10);window.__testStreams.push(stream);return stream;
}});
window.SpeechRecognition = class {
  start(){window.__recognition=this;}
  stop(){this.onend?.();}
};
