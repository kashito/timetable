(()=>{'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
const trailing=/[.,!?;:、。）」』】〕〉》＞]+$/u;
function linkedText(value){
  const text=String(value??''),pattern=/https?:\/\/[^\s<>"']+/giu;
  let html='',last=0,match;
  while((match=pattern.exec(text))){
    html+=esc(text.slice(last,match.index));
    const raw=match[0],tail=raw.match(trailing)?.[0]||'',url=tail?raw.slice(0,-tail.length):raw;
    html+=url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`:'';
    html+=esc(tail);last=match.index+raw.length;
  }
  return html+esc(text.slice(last));
}
async function copy(value){
  const text=String(value??'');
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}
  const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();
  try{if(!document.execCommand('copy'))throw Error('copy failed');}finally{area.remove();}
}
window.SharedNoteView={linkedText,copy};
})();
