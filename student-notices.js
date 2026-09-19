(()=>{'use strict';
let selected='',generation=0,lastLoaded=0;
async function show(name,force=false){
 const link=document.getElementById('studentNoticeLink'),badge=document.getElementById('studentNoticeCount');if(!link||!badge)return;
 if(name===selected&&!force&&Date.now()-lastLoaded<60000)return;
 const changed=selected!==name;selected=name;lastLoaded=Date.now();const ticket=++generation;if(changed){badge.hidden=true;badge.textContent='';}
 link.href='system_updates.php?from=student_schedule'+(name?'&student='+encodeURIComponent(name):'');
 try{if(name)sessionStorage.setItem('newsStudent',name);else sessionStorage.removeItem('newsStudent');}catch(e){}
 if(changed)window.Workspace?.refreshRequestNotices?.();
 try{await StaffAuth.ready;const j=await Workspace.api('system_news_api.php?studentView=1'+(name?'&student='+encodeURIComponent(name):''));if(ticket!==generation)return;
  const count=j.articles.filter(r=>!r.read).length;badge.textContent=count>99?'99+':String(count);badge.hidden=!count;link.setAttribute('aria-label','塾からのお知らせ'+(count?'、未読 '+count+'件':''));link.title='塾からのお知らせを別ページで開く';
 }catch(e){if(ticket===generation){badge.hidden=false;badge.textContent='!';link.title='未読件数を確認できません。お知らせページで確認してください。';link.setAttribute('aria-label','塾からのお知らせ、件数を確認できません');}}
}
document.addEventListener('student-schedule-selected',e=>show(e.detail.name));
window.addEventListener('focus',()=>show(selected,true));window.addEventListener('pageshow',()=>show(selected,true));setInterval(()=>{if(!document.hidden)show(selected,true);},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)show(selected,true);});
show(window.StudentSchedule?.getStudentName()||'');
})();
