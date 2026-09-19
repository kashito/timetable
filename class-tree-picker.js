(()=>{
'use strict';
const select=document.getElementById('fClassSelect'),custom=document.getElementById('fClassCustom');if(!select||!custom)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
const numerals={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6};
function groupPath(name){
  const text=String(name||'').normalize('NFKC').trim();
  const match=text.match(/^(小(?:学校|学生|学)?|中(?:学校|学生|学)?|高(?:等学校|校生|校)?)\s*([1-6一二三四五六])(?!\d)(?:年生?)?/);
  if(match){
    const school=match[1][0],grade=Number(match[2])||numerals[match[2]];
    // Classes explicitly spanning grades stay together instead of choosing one grade.
    if(/^[・、/&+～~\-]\s*(?:小(?:学校|学生|学)?|中(?:学校|学生|学)?|高(?:等学校|校生|校)?)?\s*[1-6一二三四五六]/.test(text.slice(match[0].length).trim()))return ['学年共通・その他','複数学年'];
    if(grade>=1&&grade<=(school==='小'?6:3))return [{小:'小学生',中:'中学生',高:'高校生'}[school],grade+'年生'];
  }
  if(/^中学受験/.test(text))return ['中学受験'];
  if(/高校入試|高校受験/.test(text))return ['中学生','高校入試・受験'];
  if(/^小学|^小学生/.test(text))return ['小学生','学年共通'];
  if(/^中学/.test(text))return ['中学生','学年共通'];
  if(/^高校|^高校生|^高等学校/.test(text))return ['高校生','学年共通'];
  return ['学年共通・その他'];
}
const trigger=document.createElement('button');trigger.type='button';trigger.id='classTreeOpen';trigger.className='class-tree-trigger';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','classTreeDialog');select.after(trigger);select.classList.add('class-tree-native');
const dialog=document.createElement('dialog');dialog.id='classTreeDialog';dialog.className='class-tree-dialog';dialog.setAttribute('aria-labelledby','classTreeHeading');
dialog.innerHTML='<div class="class-tree-head"><h2 id="classTreeHeading">学年からクラスを選択</h2><button type="button" id="classTreeClose">閉じる</button></div><div class="class-tree-search"><label for="classTreeSearch">クラス名・学年で検索</label><input id="classTreeSearch" type="search" placeholder="例：中1、算数、英検" autocomplete="off"><span id="classTreeCount" role="status"></span></div><div id="classTreeList" class="class-tree-list"></div><div class="class-tree-foot"><button type="button" id="classTreeCustom">その他（自由入力）</button></div>';
document.body.appendChild(dialog);
const search=dialog.querySelector('#classTreeSearch'),list=dialog.querySelector('#classTreeList'),expanded=new Set();
const current=()=>select.value==='__CUSTOM__'?custom.value:select.value;
const names=()=>[...select.options].filter(o=>o.value&&o.value!=='__CUSTOM__'&&!o.disabled).map(o=>o.value);
function render(){
  const all=[...new Set(names())],q=normalize(search.value),chosen=current();
  const matches=all.filter(name=>!q||normalize(name).includes(q)||normalize(groupPath(name).join('')).includes(q));
  const roots=new Map();
  for(const name of matches){const path=groupPath(name);let node=roots;for(const label of path){if(!node.has(label))node.set(label,{children:new Map(),names:[]});const group=node.get(label);if(label===path[path.length-1])group.names.push(name);node=group.children;}}
  const rootOrder=['小学生','中学生','中学受験','高校生','学年共通・その他'];
  const compare=(a,b)=>a.localeCompare(b,'ja',{numeric:true});
  const count=node=>node.names.length+[...node.children.values()].reduce((n,x)=>n+count(x),0);
  function branch(label,node,parents=[]){
    const path=[...parents,label],id=JSON.stringify(path),open=!!q||expanded.has(id);
    return `<details data-class-branch="${esc(id)}" ${open?'open':''}><summary>${esc(label)} <span class="class-tree-number">${count(node)}</span></summary><div class="class-tree-children">${[...node.children.keys()].sort(compare).map(key=>branch(key,node.children.get(key),path)).join('')}${node.names.sort(compare).map(name=>`<button type="button" class="class-tree-choice ${name===chosen?'is-selected':''}" data-class-value="${esc(name)}" ${name===chosen?'aria-current="true"':''}><span>${esc(name)}</span>${name===chosen?'<span class="class-tree-selected">選択中</span>':''}</button>`).join('')}</div></details>`;
  }
  list.innerHTML=matches.length?[...roots.keys()].sort((a,b)=>rootOrder.indexOf(a)-rootOrder.indexOf(b)).map(label=>branch(label,roots.get(label))).join(''):'<p class="class-tree-empty">該当するクラスがありません。検索語を変えるか、自由入力で指定してください。</p>';
  dialog.querySelector('#classTreeCount').textContent=q?`${matches.length}件 / 全${all.length}件`:`${all.length}件のクラス`;
}
function sync(){
  trigger.disabled=select.disabled;const value=current();
  trigger.innerHTML=`<span class="class-tree-current">${esc(value||'クラスを選択')}</span><span class="class-tree-hint">学年から選ぶ ▾</span>`;
  trigger.setAttribute('aria-label',(value?value+'。':'')+'学年からクラスを選択');
  if(dialog.open)render();
}
function choose(value){
  if(select.disabled)return;
  if(![...select.options].some(o=>o.value===value&&!o.disabled))return;
  select.value=value;dialog.close();select.dispatchEvent(new Event('change',{bubbles:true}));sync();
  if(value==='__CUSTOM__')custom.focus();else trigger.focus();
}
trigger.addEventListener('click',()=>{
  if(select.disabled)return;search.value='';expanded.clear();
  for(const name of names()){
    const path=groupPath(name);path.forEach((_,index)=>expanded.add(JSON.stringify(path.slice(0,index+1))));
  }
  render();dialog.showModal();search.focus();
});
list.addEventListener('click',e=>{const button=e.target.closest('[data-class-value]');if(button)choose(button.dataset.classValue);});
list.addEventListener('toggle',e=>{if(search.value||!e.target.matches('details[data-class-branch]'))return;const key=e.target.dataset.classBranch;e.target.open?expanded.add(key):expanded.delete(key);},true);
dialog.querySelector('#classTreeCustom').addEventListener('click',()=>choose('__CUSTOM__'));
dialog.querySelector('#classTreeClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dialog.close();}});
dialog.addEventListener('close',()=>{if(select.value!=='__CUSTOM__'||document.activeElement!==custom)trigger.focus();});
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
search.addEventListener('input',render);select.addEventListener('change',sync);custom.addEventListener('input',sync);
new MutationObserver(sync).observe(select,{childList:true,attributes:true,attributeFilter:['disabled']});
window.ClassTreePicker={sync,groupPath};sync();
})();
