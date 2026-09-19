
(function(){
  'use strict';

  let cache={};
  let busy=false;

  async function loadState(){
    if(busy) return cache;
    busy=true;
    try{
      const r=await fetch('state_api.php?v='+Date.now(),{cache:'no-store'});
      const j=await r.json();
      cache=(j&&j.ok&&j.state&&typeof j.state==='object') ? j.state : {};
    }catch(e){
      console.warn('共有データ表示用の読込に失敗',e);
    }finally{
      busy=false;
    }
    return cache;
  }

  function classNameOf(card){
    return String(
      card.dataset.class ||
      (card.querySelector('.event-title') && card.querySelector('.event-title').textContent) ||
      ''
    ).trim();
  }

  function ensureBadge(card, cls, text, title){
    let el=card.querySelector('.'+cls);
    if(!el){
      el=document.createElement('span');
      el.className='event-badge comment-indicator '+cls;
      el.textContent=text;
      el.title=title;
      const host=card.querySelector('.event-badges') || card;
      host.appendChild(el);
    }
    return el;
  }

  function removeBadge(card, cls){
    const el=card.querySelector('.'+cls);
    if(el) el.remove();
  }

  function applyState(){
    document.querySelectorAll('.event[data-key],.event-card[data-key]').forEach(card=>{
      const key=card.dataset.key || '';
      const st={...(cache[key] || {}),ready:window.LinkedSchedule?LinkedSchedule.cardReady(card,k=>!!cache[k]?.ready):(window.LessonFixed?.isReady(key,!!cache[key]?.ready)??!!cache[key]?.ready)};

      // 準備完了
      card.classList.toggle('is-ready', !!st.ready);
      let ready=card.querySelector('.ready-badge');
      if(st.ready){
        if(!ready){
          ready=document.createElement('span');
          ready.className='ready-badge';
          ready.textContent='✓ 準備完了';
          (card.querySelector('.event-badges') || card).appendChild(ready);
        }
      }else if(ready){
        ready.remove();
      }

      // 生徒共有メッセージ
      if(st.publicNote && String(st.publicNote).trim()){
        ensureBadge(card,'public-comment-indicator','📢','生徒共有メッセージあり');
      }else{
        removeBadge(card,'public-comment-indicator');
      }

      // 教師メモ（クラス単位）
      const cls=classNameOf(card);
      const classMemo=cache['__CLASS_MEMO__|'+cls] || {};
      if(classMemo.teacherMemo && String(classMemo.teacherMemo).trim()){
        ensureBadge(card,'teacher-comment-indicator','💬','教師メモあり');
      }else{
        removeBadge(card,'teacher-comment-indicator');
      }
    });
  }

  async function refresh(){
    await loadState();
    applyState();
  }

  function scheduleRefresh(){
    setTimeout(refresh,120);
    setTimeout(refresh,500);
  }

  // 初回表示
  window.addEventListener('load',()=>{
    setTimeout(refresh,700);
    setTimeout(refresh,1600);
    setTimeout(refresh,2800);
  });

  // 絞り込み後の再描画に対応
  document.addEventListener('change',e=>{
    const id=e.target && e.target.id;
    if(['classFilter','teacherFilter','roomFilter','typeFilter','subjectFilter','viewSelect'].includes(id)){
      scheduleRefresh();
    }
  });

  document.addEventListener('click',e=>{
    const id=e.target && e.target.id;
    if(id==='clearFilters'){
      scheduleRefresh();
    }
  });
})();
