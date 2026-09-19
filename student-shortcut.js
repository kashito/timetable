(()=>{
 const params=new URLSearchParams(location.search),name=(params.get('name')||params.get('student')||'').trim();if(!name)return;
 async function open(){
  await StaffAuth.ready;await Workspace.ready;
  if(window.isStudentManagementPreview?.()){
   const a=document.createElement('a');a.id='studentManageReturn';a.className='ws-button';a.textContent='← 生徒管理に戻る';
   a.href='student_manage.html?student='+encodeURIComponent(name)+(Workspace.hiddenStudent(name)?'&hidden=1':'');
   a.style.cssText='display:inline-flex;margin:12px 12px 0';const search=document.querySelector('.search-box');if(search)search.before(a);else document.body.prepend(a);
  }
  if(!window.StudentSchedule||!await StudentSchedule.ready)return;
  document.getElementById('studentName').value=name;await StudentSchedule.search();
 }
 open().catch(e=>{const message=document.getElementById('studentMessage');if(message)message.textContent='予定を開けませんでした。'+e.message;});
})();
