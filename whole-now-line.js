(()=>{
 let line=null,observedGrid=null,frame=null;
 const resize=new ResizeObserver(()=>requestDraw());
 const minutes=text=>{const [h,m]=text.split(':').map(Number);return h*60+m;};
 function draw(){
  const grid=document.querySelector('#schedule .teacher-room-calendar');
  if(grid!==observedGrid){resize.disconnect();observedGrid=grid;if(grid)resize.observe(grid);}
  if(!grid){line?.remove();line=null;return;}
  const now=new Date(),date=now.toLocaleDateString('sv-SE'),time=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
  const cells=[...grid.querySelectorAll('.generator-slot[data-date]')].filter(c=>c.dataset.date===date&&c.getBoundingClientRect().height>0);
  const heads=[...grid.querySelectorAll(':scope > .slot-head')].map(el=>{
   const times=el.textContent.match(/\d{1,2}:\d{2}/g);return times?.length===2?{el,start:minutes(times[0]),end:minutes(times[1])}:null;
  }).filter(Boolean);
  let x=null;
  for(let i=0;i<heads.length;i++){
   const h=heads[i],r=h.el.getBoundingClientRect();
   if(time>=h.start&&time<=h.end){x=r.left+r.width*(time-h.start)/(h.end-h.start);break;}
   if(heads[i+1]&&time>h.end&&time<heads[i+1].start){x=r.right;break;}
  }
  if(!cells.length||x===null){if(line)line.hidden=true;return;}
  if(!line||line.parentElement!==grid){line?.remove();line=document.createElement('div');line.className='whole-current-line';line.innerHTML='<span class="whole-current-label"></span>';grid.appendChild(line);}
  const gr=grid.getBoundingClientRect(),boxes=cells.map(c=>c.getBoundingClientRect()),top=Math.min(...boxes.map(r=>r.top)),bottom=Math.max(...boxes.map(r=>r.bottom));
  line.hidden=false;line.style.left=(x-gr.left-grid.clientLeft)+'px';line.style.top=(top-gr.top-grid.clientTop)+'px';line.style.height=(bottom-top)+'px';
  const label='現在 '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  if(line.firstElementChild.textContent!==label)line.firstElementChild.textContent=label;
 }
 function requestDraw(){if(frame!==null)return;frame=requestAnimationFrame(()=>{frame=null;draw();});}
 window.WholeNowLine={draw:requestDraw};
 function start(){
  const root=document.getElementById('schedule');if(!root)return;
  new MutationObserver(changes=>{if(changes.some(m=>!m.target.closest?.('.whole-current-line')&&[...m.addedNodes,...m.removedNodes].some(n=>!n.matches?.('.whole-current-line'))))requestDraw();}).observe(root,{childList:true,subtree:true});
  window.addEventListener('resize',requestDraw,{passive:true});document.addEventListener('visibilitychange',requestDraw);document.addEventListener('history-window-change',requestDraw);
  setInterval(requestDraw,15000);requestDraw();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
