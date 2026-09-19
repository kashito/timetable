(()=>{'use strict';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),requested=(params.get('name')||params.get('student')||'').trim();
if(StaffAuth.page!=='student.html'){
 if(params.get('from')!=='student_schedule'||!requested)return;
 const href='student.html?v=20260914-r39&name='+encodeURIComponent(requested),install=()=>{const main=document.querySelector('main');if(main&&!$('studentScheduleReturn')){const a=document.createElement('a');a.id='studentScheduleReturn';a.className='ws-button';a.textContent='← '+requested+'さんの時間割に戻る';a.href=href;main.prepend(a);}document.querySelectorAll('.workspace-nav a,.db-foot a,.db-monitor-link').forEach(a=>{const u=new URL(a.href);if(u.pathname.endsWith('/student.html'))a.href=href;else if(u.pathname.endsWith('/daily_board.html')||u.pathname.endsWith('/system_updates.php')){u.searchParams.set('student',requested);u.searchParams.set('from','student_schedule');a.href=u.pathname+u.search;}});};
 install();StaffAuth.ready.then(install);new MutationObserver(install).observe(document.body,{childList:true,subtree:true});return;
}
let selected='',numberTicket=0,lastNumber=0;
const head=$('studentHeader'),details=$('studentHeaderDetails'),toggle=$('studentHeaderToggle');
const resize=()=>document.documentElement.style.setProperty('--student-header-height',head.getBoundingClientRect().height+'px');
function arrange(){
 for(const [id,dest] of [['historyControls','studentDateTools'],['calendarEventBar','studentExtraTools'],['studentManageReturn','studentExtraTools']]){const el=$(id);if(el&&el.parentNode!==$(dest))$(dest).append(el);}
 const legend=document.querySelector('.legend');if(legend&&legend.parentNode!==$('studentExtraTools'))$('studentExtraTools').append(legend);
 const nav=document.querySelector('body>.workspace-nav');if(nav)$('studentOtherMenu').append(nav);
 $('studentOtherMenu').querySelectorAll('a').forEach(a=>{const p=new URL(a.href).pathname;if(selected&&p.endsWith('/student.html')){a.href='student.html?v=20260914-r39&name='+encodeURIComponent(selected);a.textContent='自分の時間割';}if(selected&&(p.endsWith('/daily_board.html')||p.endsWith('/system_updates.php'))){const u=new URL(a.href);u.searchParams.set('student',selected);u.searchParams.set('from','student_schedule');a.href=u.pathname+u.search;}});
 resize();
}
toggle.onclick=()=>{details.hidden=!details.hidden;toggle.setAttribute('aria-expanded',String(!details.hidden));toggle.title=details.hidden?'日付・メニューを開く':'日付・メニューを閉じる';resize();};
async function number(force=false){if(!selected||(!force&&Date.now()-lastNumber<60000))return;lastNumber=Date.now();const name=selected,ticket=++numberTicket,el=$('studentRegistrationNumber');el.hidden=false;
 try{const j=await Workspace.api('student_identity_api.php?name='+encodeURIComponent(name));if(ticket!==numberTicket||selected!==name)return;el.textContent=j.registrationNumber?'塾籍 '+j.registrationNumber:j.numberStatus==='unavailable'?'番号の確認待ち':'';el.hidden=!el.textContent;el.title=j.numberSource==='attendance'?'入退室アプリの塾籍番号':j.numberSource==='profile'?'生徒情報に登録済みの塾籍番号':'入退室の生徒対応を確認してください';}
 catch(e){if(ticket===numberTicket){el.textContent='番号の確認待ち';el.title='塾籍番号を取得できませんでした。';}}
}
function identity(name){if(!name)return;const changed=selected!==name;selected=name;$('studentDisplayName').textContent=name+'さん';$('studentInitialChoice').hidden=true;$('studentName').readOnly=true;$('studentSearch').disabled=true;
 const u=new URL(location.href);u.searchParams.set('name',name);u.searchParams.delete('student');history.replaceState(null,'',u);
 $('studentDailyLink').href='daily_board.html?student='+encodeURIComponent(name)+'&from=student_schedule';arrange();if(changed){lastNumber=0;number();}
}
if(requested){$('studentInitialChoice').classList.add('student-initial-hidden');$('studentMessage').textContent='予定を読み込み中…';}
document.addEventListener('student-schedule-selected',e=>identity(e.detail.name));
window.addEventListener('pageshow',()=>number(true));window.addEventListener('focus',()=>number(true));document.addEventListener('visibilitychange',()=>{if(!document.hidden)number(true);});setInterval(()=>{if(!document.hidden)number();},60000);
arrange();new MutationObserver(arrange).observe(document.body,{childList:true});new MutationObserver(arrange).observe(document.querySelector('.app'),{childList:true});if(window.ResizeObserver)new ResizeObserver(resize).observe(head);
window.StudentSchedule?.ready.then(()=>identity(StudentSchedule.getStudentName()));
})();
