
(function(){
  'use strict';

  function resizeTeacherMemo(){
    const ta=document.getElementById('teacherMemo');
    if(!ta) return;
    ta.style.height='auto';
    const target=Math.min(Math.max(ta.scrollHeight,180),420);
    ta.style.height=target+'px';
  }

  document.addEventListener('input',e=>{
    if(e.target && e.target.id==='teacherMemo'){
      resizeTeacherMemo();
    }
  });

  document.addEventListener('click',e=>{
    const card=e.target && e.target.closest ? e.target.closest('.event[data-key],.event-card[data-key]') : null;
    if(card){
      setTimeout(resizeTeacherMemo,150);
      setTimeout(resizeTeacherMemo,400);
    }
  },true);

  window.addEventListener('load',()=>setTimeout(resizeTeacherMemo,1000));
})();
