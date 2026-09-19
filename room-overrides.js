
(function(){
  'use strict';

  let cache={};

  async function loadRoomOverrides(){
    try{
      const r=await fetch('room_override_api.php?v='+Date.now(),{cache:'no-store'});
      const j=await r.json();
      cache=(j&&j.ok&&j.overrides&&typeof j.overrides==='object')?j.overrides:{};
    }catch(e){
      console.warn('教室変更データの読込に失敗',e);
      cache={};
    }
    return cache;
  }

  function getOverride(key){
    if(cache[key]) return cache[key];

    const parts=String(key||'').split('|');
    if(parts.length>=3){
      const prefix=parts.slice(0,3).join('|')+'|';
      const matchedKey=Object.keys(cache).find(k=>String(k).startsWith(prefix));
      if(matchedKey) return cache[matchedKey];
    }

    return null;
  }

  function classForRoom(room){
    switch(String(room||'').trim()){
      case '白': return 'room-white';
      case '青': return 'room-blue';
      case '黄': return 'room-yellow';
      case 'ガラス': return 'room-glass';
      case 'PC': return 'room-pc';
      case '自宅可': return 'room-home';
      default: return '';
    }
  }

  function applyRoomOverridesToCards(){
    const roomClasses=['room-white','room-blue','room-yellow','room-glass','room-pc','room-home'];

    document.querySelectorAll('.event[data-key],.event-card[data-key]').forEach(card=>{
      const key=card.dataset.key||'';
      const o=getOverride(key);
      if(!o || o.room===undefined) return;

      const room=String(o.room||'').trim();
      card.dataset.room=room;

      roomClasses.forEach(c=>card.classList.remove(c));
      const roomClass=classForRoom(room);
      if(roomClass) card.classList.add(roomClass);

      let roomBadge=[...card.querySelectorAll('.event-badge,.tag,.badge,span')].find(el=>{
        const t=String(el.textContent||'').trim();
        return /^(🏫\s*)?(白|青|黄|ガラス|PC|自宅可)$/.test(t);
      });

      if(room){
        if(!roomBadge){
          roomBadge=document.createElement('span');
          roomBadge.className='event-badge room-badge room-override-badge';
          const host=card.querySelector('.event-badges') || card.querySelector('.tags') || card;
          host.appendChild(roomBadge);
        }
        roomBadge.textContent='🏫 '+room;
        roomBadge.dataset.room=room;
      }else if(roomBadge && roomBadge.classList.contains('room-override-badge')){
        roomBadge.remove();
      }
    });
  }

  async function refreshRoomOverrides(){
    await loadRoomOverrides();
    applyRoomOverridesToCards();
  }

  window.RoomOverrides={
    load:loadRoomOverrides,
    get:getOverride,
    refresh:refreshRoomOverrides,
    apply:applyRoomOverridesToCards
  };

  window.addEventListener('load',()=>{
    setTimeout(refreshRoomOverrides,700);
    setTimeout(refreshRoomOverrides,1600);
    setTimeout(refreshRoomOverrides,2800);
  });

  document.addEventListener('change',e=>{
    const id=e.target&&e.target.id;
    if(['classFilter','teacherFilter','roomFilter','typeFilter','subjectFilter','viewSelect'].includes(id)){
      setTimeout(refreshRoomOverrides,150);
      setTimeout(refreshRoomOverrides,500);
    }
  });

  document.addEventListener('click',e=>{
    const id=e.target&&e.target.id;
    if(id==='clearFilters'){
      setTimeout(refreshRoomOverrides,150);
      setTimeout(refreshRoomOverrides,500);
    }
  });


  // 生徒ページの検索・絞り込み後にカードDOMが再生成されても教室表示を再適用
  let roomApplyTimer=null;
  function debounceRoomApply(){
    clearTimeout(roomApplyTimer);
    roomApplyTimer=setTimeout(()=>{
      try{
        applyRoomOverridesToCards();
      }catch(e){
        console.warn('教室表示の再適用に失敗',e);
      }
    },120);
  }

  document.addEventListener('input',e=>{
    const id=e.target&&e.target.id;
    if(['studentName','studentSearchInput','classFilter','typeFilter','roomFilter'].includes(id)){
      debounceRoomApply();
    }
  });

  document.addEventListener('keydown',e=>{
    const id=e.target&&e.target.id;
    if(e.key==='Enter' && ['studentName','studentSearchInput'].includes(id)){
      setTimeout(debounceRoomApply,100);
    }
  });

  document.addEventListener('click',e=>{
    const id=e.target&&e.target.id;
    if(['studentSearch','studentSearchBtn','clearFilters'].includes(id)){
      setTimeout(debounceRoomApply,100);
      setTimeout(debounceRoomApply,350);
    }
  });

  // アプリ側のrender()でカードが作り直された場合も自動追従
  const roomObserver=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes&&m.addedNodes.length)){
      debounceRoomApply();
    }
  });

  function startRoomObserver(){
    const target=
      document.querySelector('#schedule') ||
      document.querySelector('#scheduleContainer') ||
      document.querySelector('main') ||
      document.body;

    if(target){
      roomObserver.observe(target,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',startRoomObserver);
  }else{
    startRoomObserver();
  }

})();
