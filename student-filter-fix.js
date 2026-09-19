
(function(){
  'use strict';

  function val(id){
    const el=document.getElementById(id);
    return el ? String(el.value||'').trim() : '';
  }

  function getCardText(card){
    return String(card.innerText||card.textContent||'');
  }

  function matches(card){
    const cls=val('classFilter');
    const teacher=val('teacherFilter');
    const room=val('roomFilter');
    const type=val('typeFilter');
    const subject=val('subjectFilter');

    const text=getCardText(card);
    const dataClass=String(card.dataset.class||'');
    const dataTeacher=String(card.dataset.teacher||'');
    const dataRoom=String(card.dataset.room||'');
    const dataType=String(card.dataset.type||'');
    const dataSubject=String(card.dataset.subject||card.dataset.subjects||'');

    if(cls && cls!=='すべて' && !(dataClass.includes(cls) || text.includes(cls))) return false;
    if(teacher && teacher!=='すべて' && !(dataTeacher.includes(teacher) || text.includes(teacher))) return false;
    if(room && room!=='すべて' && !(dataRoom.includes(room) || text.includes(room))) return false;
    if(type && type!=='すべて' && !(dataType.includes(type) || text.includes(type))) return false;
    if(subject && subject!=='すべて' && !(dataSubject.includes(subject) || text.includes(subject))) return false;

    return true;
  }

  function applyFilters(){
    const cards=[...document.querySelectorAll('.event[data-key],.event-card[data-key]')];

    cards.forEach(card=>{
      card.style.display=matches(card)?'':'none';
    });

    // OFF・休講日・キャンプなどの特別表示は、授業カードがなくても日付ごと残す。
    document.querySelectorAll('.day-group,.date-group,.schedule-day').forEach(group=>{
      const hasOff=group.classList.contains('has-off-day') || !!group.querySelector('.off-day');
      const hasSpecial=hasOff || group.classList.contains('has-special-day') || !!group.querySelector('.special');
      const hasVisibleCard=[...group.querySelectorAll('.event[data-key],.event-card[data-key]')]
        .some(card=>card.style.display!=='none');

      if(hasOff || hasSpecial){
        // OFF・休講日・サマーキャンプ等は絞り込み対象外。
        // ただし「終了した日も表示」がOFFの過去日は必ず非表示にする。
        if(group.classList.contains('hidden-past-day')){
          group.style.removeProperty('display');
        }else{
          group.style.setProperty('display','block','important');
        }
      }else{
        group.style.display=hasVisibleCard?'':'none';
      }
    });
  }

  function scheduleApply(){
    setTimeout(applyFilters,80);
    setTimeout(applyFilters,250);
    setTimeout(applyFilters,600);
  }

  ['classFilter','teacherFilter','roomFilter','typeFilter','subjectFilter'].forEach(id=>{
    document.addEventListener('change',e=>{
      if(e.target && e.target.id===id) scheduleApply();
    });
  });

  document.addEventListener('click',e=>{
    const id=e.target&&e.target.id;
    if(id==='clearFilters'){
      ['classFilter','teacherFilter','roomFilter','typeFilter','subjectFilter'].forEach(fid=>{
        const el=document.getElementById(fid);
        if(el){
          if(el.tagName==='SELECT'){
            el.selectedIndex=0;
          }else{
            el.value='';
          }
        }
      });
      scheduleApply();
    }

    if(['studentSearch','studentSearchBtn'].includes(id)){
      scheduleApply();
    }
  });

  document.addEventListener('keydown',e=>{
    const id=e.target&&e.target.id;
    if(e.key==='Enter' && ['studentName','studentSearchInput'].includes(id)){
      scheduleApply();
    }
  });

  // DOM再描画後も現在の絞り込み条件を再適用
  let timer=null;
  const observer=new MutationObserver(mutations=>{
    if(!mutations.some(m=>m.addedNodes&&m.addedNodes.length)) return;
    clearTimeout(timer);
    timer=setTimeout(applyFilters,120);
  });

  function start(){
    const target=
      document.querySelector('#schedule') ||
      document.querySelector('#scheduleContainer') ||
      document.querySelector('main') ||
      document.body;

    if(target){
      observer.observe(target,{childList:true,subtree:true});
    }

    scheduleApply();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start);
  }else{
    start();
  }
})();
