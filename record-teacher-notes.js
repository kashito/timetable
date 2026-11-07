(()=>{
'use strict';
let notes=[],aliases={};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function className(value){let name=String(value||'').trim();const seen=new Set();while(typeof aliases[name]==='string'&&!seen.has(name)){seen.add(name);name=aliases[name];}return name;}
function time(note){
 const value=String(note.createdAt||'');
 // Old undated notes are never assigned the current date or an inferred lesson date.
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))return {date:'',endAt:null};
 const timestamp=Date.parse(value);return Number.isFinite(timestamp)?{date:new Date(timestamp+9*3600000).toISOString().slice(0,10),endAt:value}:{date:'',endAt:null};
}
function teachers(item){return item.kind==='teacher-note'?[item.author,...(item.assigneeNames||[])].filter(Boolean):[item.teacher].filter(Boolean);}
function entries(records){return [...records,...notes];}
async function read(){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch('shared_notes_api.php?timeline=1&v='+Date.now(),{cache:'no-store',signal:controller.signal}),data=await response.json();
 if(!response.ok||!data.ok||!Array.isArray(data.notes))throw Error('先生への連絡を読み込めませんでした。');
 notes=data.notes.map(note=>({...note,kind:'teacher-note',eventKey:'NOTE:'+note.id}));aliases=data.classNameAliases||{};
 return notes.length;
 }finally{clearTimeout(timeout);}
}
function card(note){
 const timestamp=time(note),name=className(note.className),when=timestamp.endAt?new Date(timestamp.endAt).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'日時不明（以前の連絡）';
 return `<article class="card teacher-note${note.done?' is-done':''}" data-key="${esc(note.eventKey)}" data-note-id="${esc(note.id)}"><div class="meta"><span class="chip teacher-note-kind">先生への連絡</span>${note.todo?'<span class="chip">TODO</span>':''}${note.done?'<span class="chip">'+(note.todo?'完了':'非表示')+'</span>':''}<span class="chip">投稿：${esc(when)}</span></div><div class="record-heading"><button type="button" class="classLink" data-class="${esc(name)}">${esc(name||'授業')}</button></div><p class="teacher-note-scope">同じクラスの全日程で共有する連絡</p><div class="record-byline"><span class="speaker tone-gray">投稿者：${esc(note.author||'記録なし')}</span></div>${note.assigneeNames?.length?'<p class="teacher-note-to">宛先：'+esc(note.assigneeNames.join('・'))+'</p>':''}<div class="teacher-note-text">${KarteUI.linkedText(note.text)}</div>${!timestamp.endAt?'<p class="teacher-note-unknown">投稿日時の記録がないため、時系列の末尾に表示しています。</p>':''}${note.done?'<p class="updated">'+(note.todo?'完了':'非表示')+'：'+esc(note.doneBy||'記録なし')+(note.doneAt?' ／ '+esc(KarteUI.dateTimeLabel(note.doneAt)):'')+'</p>':''}<div class="cardActions"><a class="detailBtn" href="class_schedule.html?class=${encodeURIComponent(name)}" target="_blank" rel="noopener">この授業の予定へ</a></div></article>`;
}
window.RecordTeacherNotes={read,entries,className,teachers,time,card};
})();
