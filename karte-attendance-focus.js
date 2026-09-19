(()=>{
const params=new URLSearchParams(location.search);if(params.get('attendance')!=='1')return;
let done=false,jumped=false;
function focus(){
 if(done)return;
 const jump=document.getElementById('historyJump'),date=params.get('date');
 if(!jumped&&jump&&/^\d{4}-\d{2}-\d{2}$/.test(date||'')){jumped=true;jump.value=date;jump.dispatchEvent(new Event('change',{bubbles:true}));}
 const modal=document.getElementById('teacherOpsModal'),group=document.getElementById('groupContent');
 const target=modal&&!modal.classList.contains('hidden')&&modal.dataset.currentKey===params.get('openKey')?modal.querySelector('.attSel'):group&&!group.hidden?group.querySelector('[data-group-attendance]'):null;
 if(!target)return;done=true;observer.disconnect();
 requestAnimationFrame(()=>{(target.closest('section')||target).scrollIntoView({block:'start'});target.focus({preventScroll:true});});
}
const observer=new MutationObserver(focus);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});focus();
setTimeout(()=>observer.disconnect(),30000);
})();
