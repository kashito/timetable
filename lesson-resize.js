(()=>{
 const SLOT_TIMES={
  '①':['13:30','14:10'],'②':['14:20','15:00'],'③':['15:10','15:50'],'④':['16:00','16:40'],
  '⑤':['16:50','17:30'],'⑥':['17:40','18:20'],'⑦':['18:30','19:10'],'⑧':['19:20','20:00'],
  '⑨':['20:10','20:50'],'⑩':['21:00','21:40'],'⑪':['21:50','22:30']
 };
 const minutes=value=>{const m=String(value||'').match(/^(\d{2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):NaN};
 const time=value=>String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
 const snap=(value,min,max)=>Math.max(min,Math.min(max,Math.round(value/5)*5));
 function slots(card){try{return JSON.parse(card.dataset.linkedSlots||'null')||[card.dataset.slot]}catch{return [card.dataset.slot]}}
 function matchingCell(card,slot){
  const first=card.closest('.generator-slot');if(!first)return null;
  return [...document.querySelectorAll('.generator-slot')].find(cell=>cell.dataset.date===first.dataset.date&&cell.dataset.room===first.dataset.room&&cell.dataset.slot===slot)||null;
 }
 function innerRect(cell){
  const rect=cell.getBoundingClientRect(),css=getComputedStyle(cell);
  const left=rect.left+(parseFloat(css.paddingLeft)||0),right=rect.right-(parseFloat(css.paddingRight)||0);
  return {left,right,width:Math.max(1,right-left)};
 }
 function geometry(card,start=card.dataset.start,end=card.dataset.end){
  const ss=slots(card),first=card.closest('.generator-slot'),last=matchingCell(card,ss.at(-1));
  if(!first||!last||!SLOT_TIMES[ss[0]]||!SLOT_TIMES[ss.at(-1)])return null;
  const a=innerRect(first),b=innerRect(last),firstNom=SLOT_TIMES[ss[0]],lastNom=SLOT_TIMES[ss.at(-1)];
  const left=a.left+a.width*Math.max(0,minutes(start)-minutes(firstNom[0]))/40;
  const right=b.right-b.width*Math.max(0,minutes(lastNom[1])-minutes(end))/40;
  return {first,last,a,b,left,right};
 }
 function paint(card,start,end){
  const g=geometry(card,start,end);if(!g)return;
  const leftTrim=Math.max(0,g.left-g.a.left),rightTrim=Math.max(0,g.b.right-g.right);
  card.style.setProperty('margin-left',leftTrim+'px','important');
  card.style.setProperty('width',Math.max(24,g.b.right-g.a.left-leftTrim-rightTrim)+'px','important');
 }
 function message(options,value,error=false){
  const el=typeof options.status==='string'?document.querySelector(options.status):options.status;
  if(el){el.textContent=value;el.dataset.error=error?'true':'false';}
 }
 async function post(payload,options){
  const response=await fetch('lesson_resize_api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({}));
  if(response.ok&&result.ok)return result;
  for(const flag of ['fixedConflict','roomConflict'])if(result[flag]&&!payload['override'+(flag==='fixedConflict'?'Fixed':'Room')]){
   if(!confirm(result.error||'この変更を続けますか？'))throw new Error('変更を取り消しました。');
   payload['override'+(flag==='fixedConflict'?'Fixed':'Room')]=true;return post(payload,options);
  }
  throw new Error(result.error||'時刻を保存できませんでした。');
 }
 function addHandles(card,options){
  if(card.dataset.resizeBound==='1'||!card.dataset.sourceKey||!card.dataset.start||!card.dataset.end)return;
  card.dataset.resizeBound='1';card.classList.add('lesson-resizable');
  for(const edge of ['start','end']){
   const handle=document.createElement('button');handle.type='button';handle.className='lesson-resize-handle lesson-resize-'+edge;handle.dataset.resizeEdge=edge;
   handle.setAttribute('aria-label',edge==='start'?'開始時刻をドラッグして変更':'終了時刻をドラッグして変更');handle.title=handle.getAttribute('aria-label');
   const bubble=document.createElement('span');bubble.className='lesson-resize-time';handle.append(bubble);card.append(handle);
   handle.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();});
   handle.addEventListener('pointerdown',event=>{
    if(event.button!==0&&event.pointerType==='mouse')return;
    event.preventDefault();event.stopPropagation();
    const ss=slots(card),slot=edge==='start'?ss[0]:ss.at(-1),cell=edge==='start'?card.closest('.generator-slot'):matchingCell(card,slot),bounds=SLOT_TIMES[slot];
    if(!cell||!bounds)return;
    const rect=innerRect(cell),min=minutes(bounds[0]),max=minutes(bounds[1]),oldStart=card.dataset.start,oldEnd=card.dataset.end;
    let candidate=edge==='start'?minutes(oldStart):minutes(oldEnd);const oldDraggable=card.draggable;card.draggable=false;card.classList.add('is-resizing');
    const update=clientX=>{
     const raw=min+(Math.max(rect.left,Math.min(rect.right,clientX))-rect.left)/rect.width*(max-min);
     candidate=edge==='start'?snap(raw,min,minutes(oldEnd)-5):snap(raw,minutes(oldStart)+5,max);
     bubble.textContent=time(candidate);paint(card,edge==='start'?time(candidate):oldStart,edge==='end'?time(candidate):oldEnd);
    };
    update(event.clientX);handle.setPointerCapture?.(event.pointerId);
    const move=e=>{e.preventDefault();update(e.clientX)};
    const finish=async e=>{
     handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',cancel);
     card.classList.remove('is-resizing');card.draggable=oldDraggable;
     const next=time(candidate),before=edge==='start'?oldStart:oldEnd;
     if(next===before){paint(card,oldStart,oldEnd);return;}
     if(!confirm((edge==='start'?'開始':'終了')+'時刻を '+before+' → '+next+' に変更しますか？')){paint(card,oldStart,oldEnd);return;}
     handle.disabled=true;message(options,'授業時刻を保存しています…');
     try{
      await post({sourceKey:card.dataset.sourceKey,edge,time:next,expectedStart:oldStart,expectedEnd:oldEnd,requestId:crypto.randomUUID?.()||String(Date.now())+'-resize'},options);
      message(options,(card.dataset.linkedId?'連結授業':'授業')+'の時刻を変更しました。');
      if(typeof options.reload==='function')await options.reload();else location.reload();
     }catch(error){paint(card,oldStart,oldEnd);message(options,error.message||String(error),true);if((error.message||'')!=='変更を取り消しました。')alert(error.message||error);}
     finally{handle.disabled=false;}
    };
    const cancel=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',finish);handle.removeEventListener('pointercancel',cancel);card.classList.remove('is-resizing');card.draggable=oldDraggable;paint(card,oldStart,oldEnd);};
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',cancel);
   });
  }
  paint(card,card.dataset.start,card.dataset.end);
 }
 function bind(root=document,options={}){requestAnimationFrame(()=>root.querySelectorAll('.lesson[data-source-key],.event[data-source-key]').forEach(card=>addHandles(card,options)));}
 window.LessonResize={bind,minutes,time,snap};
})();
