// The timetable scrolls horizontally in its own container and vertically with the page.
// Keep only the time row on screen after the controls have scrolled out of view.
(()=>{
 const generator=document.getElementById('gridWrap');
 const schedule=generator||document.getElementById('schedule');if(!schedule||(!generator&&!document.body.classList.contains('compact-whole-schedule')))return;
 const bar=document.createElement('div');bar.id='wholeTimeHeader';bar.hidden=true;bar.setAttribute('aria-hidden','true');document.body.append(bar);
 let grid=null,heads=[],frame=0;
 function rebuild(){
  grid=schedule.querySelector(generator?'#grid > .generator-grid':'.teacher-generator-layout');heads=grid?[...grid.children].filter(e=>e.classList.contains('head')):[];
  const row=document.createElement('div');row.className='whole-time-row';
  for(const head of heads){const cell=head.cloneNode(true);cell.removeAttribute('id');cell.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));row.append(cell);}
  bar.replaceChildren(row);request();
 }
 function update(){
  frame=0;const rect=schedule.getBoundingClientRect(),height=heads[0]?.getBoundingClientRect().height||0;
  bar.hidden=!grid||!height||rect.top+schedule.clientTop>=0||rect.bottom<=height;
  if(bar.hidden)return;
  bar.style.left=(rect.left+schedule.clientLeft)+'px';bar.style.width=schedule.clientWidth+'px';bar.style.height=height+'px';
  const row=bar.firstElementChild;row.style.gridTemplateColumns=getComputedStyle(grid).gridTemplateColumns;row.style.width=grid.getBoundingClientRect().width+'px';row.style.height=height+'px';
  row.style.transform=`translateX(${-schedule.scrollLeft}px)`;row.firstElementChild.style.transform=`translateX(${schedule.scrollLeft}px)`;
 }
 function request(){if(!frame)frame=requestAnimationFrame(update);}
 new MutationObserver(rebuild).observe(generator?document.getElementById('grid'):schedule,{childList:true});
 new ResizeObserver(request).observe(schedule);
 window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',request);
 schedule.addEventListener('scroll',request,{passive:true});rebuild();
})();
