(()=>{
'use strict';
const root=document.getElementById('studentHomeworkHub'),button=document.getElementById('studentHomeworkToggle'),badge=document.getElementById('studentHomeworkCount'),body=document.getElementById('studentHomeworkBody');if(!root||!button||!badge||!body)return;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let student='',tasks=[],open=false;
function hash(value){let result=2166136261;for(let i=0;i<value.length;i++){result^=value.charCodeAt(i);result=Math.imul(result,16777619);}return (result>>>0).toString(16).padStart(8,'0');}
function key(){return 'student-homework-state-v1:'+hash(student);}
function state(){try{const value=JSON.parse(localStorage.getItem(key())||'{}');return {completed:value.completed||{},hidden:value.hidden||{}};}catch{return {completed:{},hidden:{}};}}
function save(value){try{localStorage.setItem(key(),JSON.stringify(value));}catch{}}
function remaining(value){const due=new Date(value),milliseconds=due-Date.now();if(!Number.isFinite(due.getTime()))return '';if(milliseconds<=0)return '期限を過ぎています';let minutes=Math.max(1,Math.ceil(milliseconds/60000)),days=Math.floor(minutes/1440);minutes-=days*1440;const hours=Math.floor(minutes/60);minutes-=hours*60;return 'あと'+(days?days+'日':'')+(hours?hours+'時間':'')+minutes+'分';}
function dueLabel(task){const due=new Date(task.dueAt);if(!Number.isFinite(due.getTime()))return '';return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'}).format(due)+'まで';}
function render(){
 root.hidden=!student;if(!student)return;const current=state(),active=tasks.filter(task=>!current.hidden[task.id]),hidden=tasks.filter(task=>current.hidden[task.id]),pending=active.filter(task=>!current.completed[task.id]).length;
 badge.textContent=String(pending);badge.hidden=false;button.setAttribute('aria-expanded',String(open));body.hidden=!open;
 if(!open)return;
 const rows=active.map(task=>`<article class="student-homework-hub-item${current.completed[task.id]?' is-complete':''}"><label><input type="checkbox" data-homework-complete="${esc(task.id)}" ${current.completed[task.id]?'checked':''}><span><strong>${esc(task.className)}</strong><b>${esc(task.text)}</b><small>${esc(dueLabel(task))}（${esc(remaining(task.dueAt))}）</small></span></label><button type="button" data-homework-hide="${esc(task.id)}">非表示</button></article>`).join('');
 const hiddenRows=hidden.map(task=>`<li><span>${esc(task.className)}：${esc(task.text)}</span><button type="button" data-homework-restore="${esc(task.id)}">再表示</button></li>`).join('');
 body.innerHTML=(rows||'<p class="student-homework-hub-empty">表示する宿題はありません。</p>')+(hidden.length?`<details class="student-homework-hidden"><summary>非表示にした宿題 ${hidden.length}件</summary><ul>${hiddenRows}</ul></details>`:'');
}
button.addEventListener('click',()=>{open=!open;render();});
body.addEventListener('change',event=>{const id=event.target.dataset.homeworkComplete;if(!id)return;const current=state();if(event.target.checked)current.completed[id]=true;else delete current.completed[id];save(current);render();});
body.addEventListener('click',event=>{const hide=event.target.dataset.homeworkHide,restore=event.target.dataset.homeworkRestore;if(!hide&&!restore)return;const current=state();if(hide)current.hidden[hide]=true;if(restore)delete current.hidden[restore];save(current);render();});
function update(name,items){student=String(name||'');const seen=new Map();for(const item of items||[]){const raw=[student,item.dueAt,item.className,item.text].join('\0'),task={...item,id:'hwlocal-'+hash(raw)};seen.set(task.id,task);}tasks=[...seen.values()].sort((a,b)=>String(a.dueAt).localeCompare(String(b.dueAt))||String(a.className).localeCompare(String(b.className),'ja'));render();}
window.StudentHomeworkHub={update};if(window.__studentHomeworkHubData)update(window.__studentHomeworkHubData.name,window.__studentHomeworkHubData.items);setInterval(()=>{if(open)render();},60000);
})();
