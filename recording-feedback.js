(()=>{'use strict';
 const fieldStatus=(attendance,memo,homework)=>[
  attendance?'出席：記録済み':'出席：未入力あり',
  String(memo||'').trim()?'カルテ：記録済み':'カルテ：未記入',
  String(homework||'').trim()?'宿題：記録済み':'宿題：未記入'
 ];
 function consumeLink(){
  const url=new URL(location.href);
  for(const field of ['openKey','recordTask','fromNotice','attendance'])url.searchParams.delete(field);
  history.replaceState(history.state,'',url.pathname+url.search+url.hash);
 }
 function showSaved(attendance,memo,homework){
  consumeLink();
  let box=document.getElementById('teacherRecordingSaved');
  if(!box){box=document.createElement('div');box.id='teacherRecordingSaved';box.className='ws-panel';box.setAttribute('role','status');document.querySelector('main').prepend(box);}
  box.replaceChildren();const text=document.createElement('p');text.textContent='保存しました。'+fieldStatus(attendance,memo,homework).join(' ／ ');box.append(text);
  if(!String(memo||'').trim()||!String(homework||'').trim()){
   const note=document.createElement('p');note.textContent='出席を記録済みでも、カルテ・宿題の未記入通知は残ります。宿題がない場合は「宿題なし」で保存してください。';box.append(note);
  }
  const link=document.createElement('a');link.href='lesson_records.html#lessonTasks';link.textContent='残っている未記録を確認';box.append(link);
  box.scrollIntoView({block:'nearest'});
 }
 window.RecordingFeedback={fieldStatus,consumeLink,showSaved};
})();
