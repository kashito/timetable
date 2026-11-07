(()=>{'use strict';
let started=false,ticket=0;const id='teacherTodoEntry';
async function refresh(){if(!started)return;const seq=++ticket;const count=document.querySelector('#'+id+' .todo-entry-count');try{const j=await Workspace.api('shared_notes_api.php?todos=1&scope=mine&countOnly=1');if(seq===ticket&&count)count.textContent='未完了 '+j.pending+'件 →';}catch(e){if(seq===ticket&&count)count.textContent='一覧へ →';}}
StaffAuth.ready.then(async({user})=>{if(!user)return;await Workspace.ready;const main=document.querySelector('main');if(!main)return;const link=document.createElement('a');link.id=id;link.className='teacher-todo-entry';link.href='shared_todos.html';link.innerHTML='<span>自分のTODO<small>科目をまたいで確認・授業詳細へ</small></span><span class="todo-entry-count">一覧へ →</span>';main.prepend(link);started=true;refresh();});
window.addEventListener('pageshow',refresh);window.addEventListener('focus',refresh);document.addEventListener('shared-notes-changed',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});setInterval(()=>{if(!document.hidden)refresh();},60000);
})();
