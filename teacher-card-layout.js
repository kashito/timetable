
(function(){
  'use strict';

  const roomOrder={
    '':0,
    '未設定':0,
    '未定':0,
    '白':1,
    '青':2,
    '黄':3,
    'ガラス':4,
    'PC':5,
    '自宅可':6
  };

  function roomOf(card){
    const dataRoom=String(card.dataset.room||'').trim();
    if(dataRoom) return dataRoom;

    const texts=[...card.querySelectorAll('.event-badge,.tag,.badge,span')]
      .map(el=>String(el.textContent||'').replace(/^🏫\s*/,'').trim());

    return texts.find(t=>Object.prototype.hasOwnProperty.call(roomOrder,t))||'';
  }

  function cardNodes(cell){
    return [...cell.children].filter(el=>
      el.matches && el.matches('.event[data-key],.event-card[data-key]')
    );
  }

  function sortCardsByRoom(){
    const cells=document.querySelectorAll(
      '.time-cell,.slot-cell,.schedule-cell,td'
    );

    cells.forEach(cell=>{
      const cards=cardNodes(cell);
      if(cards.length<2) return;

      cards
        .map((card,index)=>({
          card,
          index,
          order:roomOrder[roomOf(card)] ?? 99
        }))
        .sort((a,b)=>a.order-b.order || a.index-b.index)
        .forEach(item=>cell.appendChild(item.card));
    });
  }

  function dateRowCells(dateCell){
    const cells=[dateCell];
    let node=dateCell.nextElementSibling;
    for(let i=0;i<11 && node;i++,node=node.nextElementSibling){
      cells.push(node);
    }
    return cells;
  }

  function equalizeCardHeights(){
    const dateCells=[...document.querySelectorAll('.date-cell')];

    if(dateCells.length){
      dateCells.forEach(dateCell=>{
        const cards=dateRowCells(dateCell)
          .flatMap(cell=>[...cell.querySelectorAll('.event[data-key],.event-card[data-key]')]);

        if(!cards.length) return;

        cards.forEach(card=>card.style.height='auto');
        const maxHeight=Math.max(...cards.map(card=>Math.ceil(card.getBoundingClientRect().height)));
        cards.forEach(card=>card.style.height=maxHeight+'px');
      });
      return;
    }

    // table row fallback
    document.querySelectorAll('tr').forEach(row=>{
      const cards=[...row.querySelectorAll('.event[data-key],.event-card[data-key]')];
      if(!cards.length) return;
      cards.forEach(card=>card.style.height='auto');
      const maxHeight=Math.max(...cards.map(card=>Math.ceil(card.getBoundingClientRect().height)));
      cards.forEach(card=>card.style.height=maxHeight+'px');
    });
  }

  function applyLayout(){
    sortCardsByRoom();
    requestAnimationFrame(equalizeCardHeights);
  }

  let timer=null;
  function scheduleLayout(){
    clearTimeout(timer);
    timer=setTimeout(applyLayout,120);
    setTimeout(applyLayout,450);
  }

  window.addEventListener('load',()=>{
    setTimeout(applyLayout,700);
    setTimeout(applyLayout,1600);
    setTimeout(applyLayout,2800);
  });

  window.addEventListener('resize',scheduleLayout);

  document.addEventListener('change',e=>{
    const id=e.target&&e.target.id;
    if([
      'classFilter','teacherFilter','roomFilter',
      'typeFilter','subjectFilter','viewSelect',
      'hideReadyToggle','pastDayToggle'
    ].includes(id)){
      scheduleLayout();
    }
  });

  document.addEventListener('click',e=>{
    const id=e.target&&e.target.id;
    if([
      'clearFilters','roomChangeSave','roomOverrideSave',
      'opsSave','teacherFilterToggle'
    ].includes(id)){
      scheduleLayout();
    }
  });

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.addedNodes&&m.addedNodes.length)){
      scheduleLayout();
    }
  });

  function startObserver(){
    const target=
      document.querySelector('#schedule') ||
      document.querySelector('#scheduleContainer') ||
      document.querySelector('.schedule-grid') ||
      document.querySelector('main') ||
      document.body;

    observer.observe(target,{childList:true,subtree:true});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',startObserver);
  }else{
    startObserver();
  }
})();
