(function(){
  'use strict';

  const START='2026-07-21';
  const END='2026-08-31';
  const DAY=['日','月','火','水','木','金','土'];
  let running=false;
  let timer=null;

  function dates(){
    const out=[];
    let cur=Date.parse(START+'T00:00:00Z');
    const end=Date.parse(END+'T00:00:00Z');
    while(cur<=end){
      const d=new Date(cur);
      out.push(d.toISOString().slice(0,10));
      cur+=86400000;
    }
    return out;
  }

  function selected(){
    const status=document.getElementById('status');
    return !!(status && /さん（/.test(status.textContent||''));
  }

  function title(date){
    const d=new Date(date+'T00:00:00');
    return '<div class="day-title"><span>'+date.slice(5).replace('-','/')+'（'+DAY[d.getDay()]+'）</span></div>';
  }

  function off(date){
    return '<div class="special off-day" data-off-date="'+date+'">OFF</div>';
  }

  function ensure(){
    if(running || !selected()) return;
    const schedule=document.getElementById('schedule');
    if(!schedule) return;
    running=true;
    try{
      const all=dates();
      const map=new Map(Array.from(schedule.querySelectorAll('.day-group[data-date]')).map(g=>[g.dataset.date,g]));

      for(const date of all){
        let group=map.get(date);
        if(!group){
          group=document.createElement('section');
          group.className='day-group';
          group.dataset.date=date;
          group.innerHTML=title(date)+off(date);

          const next=Array.from(schedule.querySelectorAll('.day-group[data-date]'))
            .find(g=>(g.dataset.date||'')>date);
          if(next) schedule.insertBefore(group,next);
          else schedule.appendChild(group);
          map.set(date,group);
        }else{
          const hasEvent=!!group.querySelector('.event-card[data-key],.event[data-key]');
          const hasSpecial=!!group.querySelector('.special,.off-day,[data-off-date]');
          const filterEmpty=group.querySelector('.empty');
          if(!hasEvent && !hasSpecial){
            if(filterEmpty) filterEmpty.remove();
            group.insertAdjacentHTML('beforeend',off(date));
          }
        }

        // 絞り込み補助スクリプトなどがOFF日を非表示にしても復元する。
        if(group.querySelector('.off-day,[data-off-date]') && !group.classList.contains('hidden-past-day')){
          group.style.removeProperty('display');
        }
      }
    } finally {
      running=false;
    }
  }

  function queue(){
    clearTimeout(timer);
    timer=setTimeout(ensure,40);
  }

  function start(){
    const schedule=document.getElementById('schedule');
    if(!schedule) return;
    new MutationObserver(queue).observe(schedule,{childList:true,subtree:true});
    document.addEventListener('click',e=>{
      if(e.target && ['studentSearch','studentSearchBtn','clearFilters'].includes(e.target.id)){
        setTimeout(ensure,80);
        setTimeout(ensure,300);
      }
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Enter' && e.target && ['studentName','studentSearchInput'].includes(e.target.id)){
        setTimeout(ensure,80);
        setTimeout(ensure,300);
      }
    });
    setTimeout(ensure,100);
    setTimeout(ensure,600);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
