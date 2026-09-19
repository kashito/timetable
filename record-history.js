(()=>{
'use strict';
const dayMs=86400000,today=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const shift=(date,days)=>new Date(Date.parse(date+'T00:00:00Z')+days*dayMs).toISOString().slice(0,10);
const normal=date=>String(date||'').replaceAll('/','-');
const className=new URL(location.href).searchParams.get('class')||'';let allRecords=[],autoBusy=false,growHistory=()=>{};
let anchor=today(),start=shift(anchor,-6),end=anchor,future=false,timings={},order='desc';
function timing(record){
 const saved=timings[record.eventKey];if(saved)return saved;
 const date=normal(record.date),slots=[...'①②③④⑤⑥⑦⑧⑨⑩⑪'],ends=['14:10','15:00','15:50','16:40','17:30','18:20','19:10','20:00','20:50','21:40','22:30'];
 const found=[...String(record.slot||'')].map(s=>slots.indexOf(s)).filter(i=>i>=0);
 return {date,endAt:found.length?date+'T'+ends[Math.max(...found)]+':00+09:00':null};
}
function includes(record){
 const t=timing(record),date=normal(t.date),chosen=document.getElementById('date').value;
 if(chosen)return date===chosen;
 if(!date||date<start||date>end)return false;
 if(future)return true;
 if(t.endAt)return Date.parse(t.endAt)<=Date.now();
 return date<today(); // Today's lessons with an unknown end time cannot be assumed finished.
}
function newest(a,b){const x=timing(a),y=timing(b);return normal(y.date).localeCompare(normal(x.date))||String(y.endAt||'').localeCompare(String(x.endAt||''))||String(b.slot||'').localeCompare(String(a.slot||''));}
function sort(a,b){return (order==='asc'?-1:1)*newest(a,b);}
function update(){
 const chosen=document.getElementById('date').value,label=document.getElementById('recordRange');
 label.textContent=chosen?chosen.replaceAll('-','/')+' の授業（開始前・授業中も含む）':start.replaceAll('-','/')+' ～ '+end.replaceAll('-','/')+(future?'（開始前・授業中も含む）':' の終了した授業');
}
function install(render){
 const host=document.getElementById('recordHistory');
 host.innerHTML='<div class="record-history-buttons"><button type="button" id="recordsEarlier">← 過去7日を追加</button><button type="button" id="recordsRecent">終了した授業に戻る</button><button type="button" id="recordsLater">先の7日を追加 →</button></div><label class="record-sort">授業の並び順 <select id="recordsOrder"><option value="desc">新しい順（降順）</option><option value="asc">古い順（昇順）</option></select></label><p id="recordRange" role="status"></p>';
 document.getElementById('recordsOrder').onchange=e=>{if((document.querySelector('.card.is-editing')||[...document.querySelectorAll('.replyInput')].some(el=>el.value.trim()))&&!confirm('入力中の内容を閉じて、並び順を変更しますか？')){e.target.value=order;return;}order=e.target.value;render();};
 const chosen=()=>document.getElementById('date');
 function change(which){
  if(document.querySelector('.card.is-editing')||[...document.querySelectorAll('.replyInput')].some(el=>el.value.trim())){if(!confirm('入力中の内容を閉じて、表示期間を変更しますか？'))return;}
  if(chosen().value){start=chosen().value;end=start;future=true;}
  if(which==='earlier')start=shift(start,-7);
  if(which==='later'){end=shift(end,7);future=true;}
  if(which==='recent'){anchor=today();start=shift(anchor,-6);end=anchor;future=false;}
  chosen().value='';render();
 }
 document.getElementById('recordsEarlier').onclick=()=>change('earlier');
 document.getElementById('recordsRecent').onclick=()=>change('recent');
 document.getElementById('recordsLater').onclick=()=>change('later');
 if(className){const more=document.createElement('button');more.type='button';more.id='recordsAutoMore';more.className='ws-button';more.textContent='過去のカルテをさらに表示';document.getElementById('list').after(more);const grow=()=>{if(autoBusy||chosen().value||document.getElementById('recordsReadPanel').hidden)return;const older=allRecords.filter(r=>String(r.className||'').trim()===className&&normal(timing(r).date)<start).sort(newest);if(!older.length){more.textContent='この授業の過去のカルテはここまでです';return;}if(document.querySelector('.card.is-editing')||[...document.querySelectorAll('.replyInput')].some(e=>e.value.trim())){more.textContent='入力を保存してから、過去のカルテを表示';return;}autoBusy=true;start=normal(timing(older[Math.min(older.length,20)-1]).date);render();more.textContent='過去のカルテをさらに表示';setTimeout(()=>{autoBusy=false;},200);};growHistory=grow;more.onclick=grow;new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))grow();},{rootMargin:'250px'}).observe(more);}
 update();
}
window.RecordHistory={includes,sort,install,update,timing,setRecords:value=>{allRecords=value||[];setTimeout(growHistory,100);},setTimings:value=>{timings=value||{};}};
})();
