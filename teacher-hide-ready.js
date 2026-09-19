
(function(){
  'use strict';

  function addToggle(){
    if(document.getElementById('hideReadyToggle')) return;

    const host=
      document.querySelector('.filters') ||
      document.querySelector('#filters') ||
      document.querySelector('main') ||
      document.body;

    const wrap=document.createElement('label');
    wrap.className='hide-ready-control';
    wrap.innerHTML='<input type="checkbox" id="hideReadyToggle"> 準備済みを薄く表示';
    host.insertBefore(wrap,host.firstChild);

    const cb=wrap.querySelector('#hideReadyToggle');
    cb.addEventListener('change',apply);
    apply();
  }

  function apply(){
    const hide=!!document.getElementById('hideReadyToggle')?.checked;
    document.querySelectorAll('.event[data-key],.event-card[data-key]').forEach(card=>{
      card.classList.toggle('hide-ready-card',hide && card.classList.contains('is-ready'));
    });
  }

  function refresh(){
    setTimeout(apply,120);
    setTimeout(apply,500);
  }

  window.addEventListener('load',()=>{
    setTimeout(addToggle,500);
    setTimeout(refresh,1400);
  });

  document.addEventListener('change',e=>{
    const id=e.target&&e.target.id;
    if(['classFilter','teacherFilter','roomFilter','typeFilter','subjectFilter','viewSelect'].includes(id)){
      refresh();
    }
  });

  document.addEventListener('click',e=>{
    if(e.target&&e.target.id==='clearFilters') refresh();
  });
})();
