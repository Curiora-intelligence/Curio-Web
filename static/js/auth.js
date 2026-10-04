import {account,config,$} from './config.js';
import {request,jsonPost} from './api.js';
export function initAuth(){
  for(const link of document.querySelectorAll('[data-role]'))link.hidden=link.dataset.role!==account?.role;
  if($('#account-button'))$('#account-button').onclick=()=>location.href='/account';
  const dialog=$('#auth-dialog');if(!dialog)return;
  if(!account && !config.development)dialog.showModal();
  dialog.addEventListener('cancel',event=>{if(!account)event.preventDefault();});
  let registering=false;
  $('#auth-switch').onclick=()=>{registering=!registering;$('#registration-fields').hidden=!registering;$('#auth-submit').textContent=registering?'Register':'Sign in';$('#auth-switch').textContent=registering?'Already have an account':'Create an account';dialog.querySelector('h2').textContent=registering?'Create your account':'Sign in to Curio';};
  $('#auth-form').onsubmit=async event=>{
    event.preventDefault();const button=$('#auth-submit');button.disabled=true;$('#auth-error').hidden=true;
    try{
      const form=new FormData(event.target);const body={email:form.get('email'),password:form.get('password')};if(registering){body.name=form.get('name');body.role=form.get('role');}
      const result=await jsonPost(registering?'/auth/register':'/auth/login',body);
      localStorage.setItem('curio_user_id',result.id);location.reload();
    }catch(error){$('#auth-error').textContent=error.message;$('#auth-error').hidden=false;}finally{button.disabled=false;}
  };
}
