(()=>{
'use strict';
const host=document.getElementById('schedule')||document.getElementById('grid');if(!host||!window.Workspace)return;
let records={},loading=false,queued=false;
const text=value=>String(value||'').trim();
function cardKey(card){return card.dataset.key||'';}
function cardClass(card){return text(card.dataset.class||card.querySelector('.event-title,.lesson>strong,strong')?.textContent)||'クラス未設定';}
function decorate(){
 host.querySelectorAll('[data-homework-date]').forEach(container=>{
  const date=container.dataset.homeworkDate,found=new Map();
  host.querySelectorAll(`[data-date="${CSS.escape(date)}"][data-key]`).forEach(card=>{
   if(!card.matches('.event,.lesson'))return;const homework=text(records[cardKey(card)]?.homework);if(!homework)return;
   const cls=cardClass(card);for(const line of homework.replace(/\r/g,'').split('\n').map(text).filter(Boolean))found.set(cls+'\0'+line,{cls,line});
  });
  container.replaceChildren();
  if(found.size){const label=document.createElement('strong');label.className='whole-day-homework-label';label.textContent='📚 宿題';container.append(label);}
  for(const {cls,line} of found.values()){const item=document.createElement('span');item.className='whole-day-homework-item';const name=document.createElement('b');name.textContent=cls;item.append(name,document.createTextNode('：'+line));container.append(item);}
  container.hidden=!found.size;container.closest('.teacher-day-info')?.classList.toggle('has-homework',!!found.size);
 });
}
function enqueue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate();});}
async function load(){if(loading)return;loading=true;try{const result=await Workspace.api('lesson_record_api.php?action=homework&v='+Date.now());records=result.records||{};decorate();}catch(error){console.warn('宿題一覧を読み込めませんでした',error);}finally{loading=false;}}
new MutationObserver(enqueue).observe(host,{childList:true,subtree:true});document.addEventListener('lesson-recording-saved',load);window.addEventListener('focus',load);StaffAuth.ready.then(load);
})();
