(()=>{
'use strict';
let timer=null,busy=false,again=false,etag='',delay=3000,failures=0,started=false;
const active=()=>document.visibilityState!=='hidden'&&navigator.onLine!==false;
function schedule(){clearTimeout(timer);if(active())timer=setTimeout(check,delay);}
async function check(){
 if(!started||!active())return;if(busy){again=true;return;}busy=true;
 try{
  const response=await fetch('homework_revision_api.php',{cache:'no-store',headers:etag?{'If-None-Match':etag}:{}});
  if(response.status===304){delay=Math.min(15000,delay*1.5);}
  else{
   if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(!data.ok||!data.revision)throw Error('Invalid revision');
   if(data.revision!==etag){await StudentSchedule.refreshHomework();etag=data.revision;delay=3000;}
  }
  failures=0;
 }catch(error){failures++;delay=Math.min(60000,3000*2**Math.min(failures,5));console.warn('宿題の更新を再試行します',error.message);}
 finally{busy=false;if(again){again=false;queueMicrotask(check);}else schedule();}
}
function wake(){delay=3000;clearTimeout(timer);check();}
document.addEventListener('visibilitychange',()=>{if(active())wake();else clearTimeout(timer);});
window.addEventListener('online',wake);window.addEventListener('pageshow',wake);window.addEventListener('focus',wake);
window.addEventListener('storage',event=>{if(event.key==='lesson-homework-saved')wake();});
if(window.BroadcastChannel){const channel=new BroadcastChannel('lesson-homework');channel.onmessage=wake;}
Promise.resolve(window.StudentSchedule?.ready).then(ok=>{if(ok){started=true;wake();}});
window.StudentHomeworkLive={check:wake,get status(){return {busy,etag,delay,failures};}};
})();
