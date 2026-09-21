(()=>{
  const preference='timetable.generator.headerCollapsed';
  // Re-rendering replaces every grid cell. Keep the visible date/room anchored
  // even if a lesson added above it changes row heights.
  function capture(){
    const grid=document.getElementById('gridWrap');if(!grid)return null;
    const rect=grid.getBoundingClientRect(),head=grid.querySelector('.head');
    const edge=Math.max(0,rect.top,head?.getBoundingClientRect().bottom||0);
    const cell=[...grid.querySelectorAll('.generator-slot')].find(e=>{const r=e.getBoundingClientRect();return r.bottom>edge&&r.top<innerHeight;});
    return {top:window.scrollY,left:grid.scrollLeft,anchor:cell?{...cell.dataset,offset:cell.getBoundingClientRect().top}:null};
  }
  function restore(position){
    const grid=document.getElementById('gridWrap');if(!grid||!position)return;
    window.scrollTo({top:position.top,behavior:'instant'});grid.scrollLeft=position.left;
    const a=position.anchor;if(!a)return;
    const cell=[...grid.querySelectorAll('.generator-slot')].find(e=>e.dataset.date===a.date&&e.dataset.slot===a.slot&&e.dataset.room===a.room);
    if(cell)window.scrollBy({top:cell.getBoundingClientRect().top-a.offset,behavior:'instant'});
  }
  function scrollStart(){const grid=document.getElementById('gridWrap');if(grid&&grid.getBoundingClientRect().top<0)window.scrollTo({top:window.scrollY+grid.getBoundingClientRect().top,behavior:'instant'});}
  window.GeneratorView={capture,restore,scrollStart};
  async function install(){
    await StaffAuth.ready;
    if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
    const grid=document.getElementById('gridWrap');
    if(!grid||document.getElementById('generatorViewBar'))return;
    const bar=document.createElement('div');bar.id='generatorViewBar';
    bar.innerHTML='<div class="generator-view-summary"><strong>コマ生成</strong><span id="generatorCompactFilters"></span><span id="generatorCompactStatus" role="status"></span></div><div class="generator-view-actions"><a id="generatorWholeScheduleLink" href="teacher2026summer.html">全体時間割</a><button id="generatorHeaderToggle" type="button" aria-expanded="true">上部を折りたたむ</button></div><div id="generatorDateNavigation" role="group" aria-label="カレンダーの表示日付"></div>';
    document.body.prepend(bar);
    const dateNavigation=document.getElementById('generatorDateNavigation');
    function mountHistory(){
      const historyControls=document.getElementById('historyControls');
      if(!historyControls)return false;
      // Keep the existing controls and handlers outside the collapsible main area.
      dateNavigation.appendChild(historyControls);
      document.getElementById('historyEarlier').textContent='← 前の7日';
      return true;
    }
    if(!mountHistory()){
      const observer=new MutationObserver(()=>{if(mountHistory())observer.disconnect();});
      observer.observe(grid.parentElement,{childList:true});
    }
    document.addEventListener('history-window-change',()=>{
      scrollStart();
    });
    const button=document.getElementById('generatorHeaderToggle');
    let collapsed=false;try{collapsed=localStorage.getItem(preference)==='1';}catch(e){}
    const controls=[document.querySelector('body > header'),document.querySelector('.workspace-nav'),
      ...[...grid.parentElement.children].filter(element=>element!==grid)];
    button.setAttribute('aria-controls',controls.filter(Boolean).map((element,index)=>{
      if(!element.id)element.id='generatorHeaderPart'+index;return element.id;
    }).join(' '));
    function summary(){
      const filters=[['teacherFilter','講師'],['classFilter','授業'],['generatorRoomFilter','教室'],['generatorStudentFilter','生徒']]
        .map(([id,label])=>{const value=document.getElementById(id)?.value;return value?`${label}：${value==='__UNSET__'?'未設定':value}`:'';}).filter(Boolean);
      document.getElementById('generatorCompactFilters').textContent=filters.join(' ／ ')||'すべての予定';
      document.getElementById('generatorCompactStatus').textContent=document.getElementById('status')?.textContent||'';
    }
    function size(){document.documentElement.style.setProperty('--generator-viewbar-height',bar.getBoundingClientRect().height+'px');}
    function apply(){
      document.documentElement.classList.toggle('generator-focused',collapsed);
      button.textContent=collapsed?'上部メニューを開く':'上部を折りたたむ';
      button.setAttribute('aria-expanded',String(!collapsed));summary();size();
    }
    button.addEventListener('click',()=>{
      collapsed=!collapsed;try{localStorage.setItem(preference,collapsed?'1':'0');}catch(e){}
      apply();if(collapsed)window.scrollTo({top:0,behavior:'instant'});
    });
    document.addEventListener('change',summary);
    const status=document.getElementById('status');if(status)new MutationObserver(summary).observe(status,{childList:true,characterData:true,subtree:true});
    new ResizeObserver(size).observe(bar);apply();
  }
  install().catch(error=>console.warn('上部メニューの表示設定を読み込めませんでした',error));
})();
