(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LessonInvitations=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 function normalize(values){const unique=new Set((Array.isArray(values)?values:[]).map(value=>String(value||'').trim()).filter(Boolean));return [...unique].sort((a,b)=>a.localeCompare(b,'ja',{numeric:true}));}
 function merge(regular,invited){return normalize([...normalize(regular),...normalize(invited)]);}
 function markup(candidates,regular,invited){
  const regularSet=new Set(normalize(regular)),selected=new Set(normalize(invited)),choices=normalize(candidates).filter(name=>!regularSet.has(name));
  const rows=choices.map(name=>`<label class="lesson-invite-row" data-invite-name="${esc(name.toLocaleLowerCase())}"><input type="checkbox" data-lesson-invite value="${esc(name)}" ${selected.has(name)?'checked':''}><span>${esc(name)}</span></label>`).join('');
  return `<details class="lesson-invite-control"><summary>➕ 追加招集の生徒 <b data-invite-count>${selected.size}名</b></summary><p>通常の参加クラスは変えず、この授業だけ予定表・出欠・カルテの対象に追加します。</p><input type="search" data-invite-search placeholder="生徒名で検索" aria-label="追加招集する生徒を検索"><div class="lesson-invite-list">${rows||'<small>追加できる生徒はいません。</small>'}</div><small>選択を外して保存すると、この授業の追加招集を解除します。</small></details>`;
 }
 function selected(root){return normalize([...root.querySelectorAll('[data-lesson-invite]:checked')].map(input=>input.value));}
 function bind(root){
  const search=root.querySelector('[data-invite-search]'),count=root.querySelector('[data-invite-count]');if(!search)return;
  const update=()=>{const query=search.value.trim().toLocaleLowerCase();root.querySelectorAll('[data-invite-name]').forEach(row=>row.hidden=!!query&&!row.dataset.inviteName.includes(query));};
  search.addEventListener('input',update);root.addEventListener('change',event=>{if(event.target.matches('[data-lesson-invite]')&&count)count.textContent=selected(root).length+'名';});
 }
 return{normalize,merge,markup,selected,bind};
});
