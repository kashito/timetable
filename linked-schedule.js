(()=>{
 const slots=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪'];
 const key=r=>[r.date,r.slot,r.cls,r.teacher,r.type,(r.subjects||[]).join('+')].join('|');
 // Only join the rows actually visible to this person, after exemptions and filters.
 function merge(rows,keyOf=key,roomOf=r=>r.room){
  const buckets=new Map(),out=[];
  for(const row of rows){const group=LessonGroups.forSource(row.sourceKey)||LessonGroups.forKey(keyOf(row));if(!group){out.push(row);continue;}
   const bucket=JSON.stringify([group.id,row.date,row.cls,row.teacher,roomOf(row)]);
   if(!buckets.has(bucket))buckets.set(bucket,{group,rows:[]});buckets.get(bucket).rows.push(row);
  }
  for(const {group,rows:members} of buckets.values()){
   members.sort((a,b)=>slots.indexOf(a.slot)-slots.indexOf(b.slot));let part=[];
   const emit=()=>{if(!part.length)return;const first=part[0],last=part.at(-1);out.push({...first,end:last.end,_linked:{id:group.id,mealBreak:!!group.mealBreak,members:part,keys:part.map(keyOf),slots:part.map(r=>r.slot),partial:part.length<group.sources.length}});part=[];};
   for(const r of members){if(part.length&&slots.indexOf(r.slot)!==slots.indexOf(part.at(-1).slot)+1)emit();part.push(r);}emit();
  }
  return out.sort((a,b)=>(a.date+a.start+a.cls).localeCompare(b.date+b.start+b.cls));
 }
 function keys(card){try{return JSON.parse(card.dataset.linkedKeys||'null')||[card.dataset.key];}catch{return [card.dataset.key];}}
 const cardReady=(card,fallback=()=>false)=>keys(card).every(k=>window.LessonFixed?.isReady(k,fallback(k))??fallback(k));
 const label=r=>r._linked?r._linked.slots.join('')+(r._linked.partial?'（連結の一部）':' 連結'):r.slot;
 function attributes(r){return r._linked?`data-linked-id="${Workspace.esc(r._linked.id)}" data-linked-keys="${Workspace.esc(JSON.stringify(r._linked.keys))}" data-linked-slots="${Workspace.esc(JSON.stringify(r._linked.slots))}"`:'';}
 function controls(r){return ''; } // A merged lesson has one shared pair of controls.

 function lanes(rows){const units=merge(rows).map(r=>({row:r,start:slots.indexOf(r.slot),end:slots.indexOf(r._linked?.members.at(-1).slot||r.slot)})).sort((a,b)=>a.start-b.start||b.end-a.end),tracks=[];
  for(const u of units){let lane=tracks.findIndex(t=>{for(let i=u.start;i<=u.end;i++)if(t[i])return false;return true;});if(lane<0){lane=tracks.length;tracks.push([]);}for(let i=u.start;i<=u.end;i++)tracks[lane][i]=u;u.lane=lane;}return {units,count:Math.max(1,tracks.length)};
 }
 function layout(){const grid=document.querySelector('.teacher-room-calendar');if(!grid)return;
  for(const card of grid.querySelectorAll('.event[data-linked-keys]')){const cell=card.closest('.generator-slot'),ss=JSON.parse(card.dataset.linkedSlots),last=[...grid.querySelectorAll('.generator-slot')].find(c=>c.dataset.date===cell.dataset.date&&c.dataset.room===cell.dataset.room&&c.dataset.slot===ss.at(-1));if(!last)continue;
   const css=getComputedStyle(last),width=last.getBoundingClientRect().right-parseFloat(css.paddingRight)-parseFloat(css.borderRightWidth)-card.getBoundingClientRect().left;
   card.style.setProperty('width',Math.max(0,width)+'px','important');
   card.classList.remove('has-linked-extension');

   for(const el of card.querySelectorAll(':scope > .event-title,:scope > .event-teacher,:scope > .event-meta'))el.title=el.textContent;
  }
 }
 // A spanning card can receive a drop over any of its member columns.
 function dropCell(cell,x){const grid=cell.closest('.teacher-room-calendar'),heads=[...grid.querySelectorAll('.slot-head')],i=heads.findIndex(h=>{const r=h.getBoundingClientRect();return x>=r.left&&x<r.right;});return i<0?cell:[...grid.querySelectorAll('.teacher-drop-slot')].find(c=>c.dataset.date===cell.dataset.date&&c.dataset.room===cell.dataset.room&&c.dataset.slot===slots[i])||cell;}
 window.LinkedSchedule={merge,keys,cardReady,label,attributes,controls,lanes,layout,dropCell};
 let frame=null;const redraw=()=>{if(frame!==null)return;frame=requestAnimationFrame(()=>{frame=null;if(typeof render==='function')render();});};
 document.addEventListener('change',e=>{if(e.target.id==='hideReadyToggle')redraw();});
 document.addEventListener('lesson-state-changed',()=>{if(document.getElementById('hideReadyToggle')?.checked)redraw();});
 window.addEventListener('resize',layout,{passive:true});
})();
