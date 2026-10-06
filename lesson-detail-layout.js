(()=>{'use strict';
// Both detail entry points use the same order, panels and numbered sections.
function single(modal){
 const body=modal.querySelector('#opsBody');if(!body)return;
 modal.classList.add('lesson-detail-single');
 const record=body.querySelector('.record-sec'),attendance=body.querySelector('.attSel')?.closest('.ops-sec')||body.querySelector('.attendance-bulk-actions')?.closest('.ops-sec'),message=body.querySelector('#publicNote')?.closest('.ops-sec');
 const main=document.createElement('div'),reference=document.createElement('div'),columns=document.createElement('div');
 columns.className='group-detail-columns';main.className='group-main-column';reference.className='group-reference-column';
 for(const [section,title,step] of [[attendance,'出欠を記録',1],[record,'カルテ・宿題を記録',2],[message,'生徒へのメッセージ・資料',3]]){
  if(!section)continue;section.classList.add('ws-panel');const heading=section.querySelector('h3');if(heading){heading.textContent=title;heading.insertAdjacentHTML('afterbegin','<span class="group-step">'+step+'</span> ');}main.append(section);
 }
 const carried=record?.querySelector('[data-recording-key]'),due=record?.querySelector('.lesson-due-label');if(carried&&due){const field=record.querySelector('#lessonDueHomework'),help=field.nextElementSibling,box=document.createElement('div');box.className='lesson-due-editor';box.append(due,field);if(help?.tagName==='SMALL')box.append(help);record.querySelector('.record-headline').after(carried,box);}
 const contacts=attendance?.querySelector('#scOpsContacts');if(contacts){const panel=document.createElement('section');panel.className='ops-sec ws-panel';panel.innerHTML='<h3>入退室・生徒からの連絡</h3>';panel.append(contacts);reference.append(panel);}
 for(const section of [...body.querySelectorAll(':scope>.ops-sec')]){section.classList.add('ws-panel');const fold=document.createElement('details'),summary=document.createElement('summary'),heading=section.querySelector('h3');summary.textContent=heading?.textContent||'授業準備';heading?.remove();fold.append(summary);while(section.firstChild)fold.append(section.firstChild);section.append(fold);reference.append(section);}
 columns.append(main,reference);const summary=body.querySelector('[role="status"]');if(summary)summary.after(columns);else body.prepend(columns);
 const save=body.querySelector('#opsSave');if(save)save.textContent='まとめて保存';
}
function generator(mode){
 const modal=document.getElementById('modal'),ops=document.getElementById('generatorOps');if(!modal||!ops)return;
 modal.classList.toggle('lesson-detail-generator',mode==='edit');if(mode!=='edit'||ops.dataset.detailLayout)return;ops.dataset.detailLayout='1';
 const record=document.getElementById('generatorRecordEditor'),attendance=document.getElementById('generatorAttendanceList')?.closest('.generator-ops-section'),shared=document.getElementById('fTeacherSharedMemo')?.closest('.generator-ops-section'),columns=document.createElement('div'),main=document.createElement('div'),reference=document.createElement('div');
 columns.className='group-detail-columns';main.className='group-main-column';reference.className='group-reference-column';
 for(const [section,title,step] of [[attendance,'出欠を記録',1],[record,'カルテ・宿題を記録',2]]){if(!section)continue;section.classList.add('ws-panel');const heading=section.querySelector('h3');heading.innerHTML='<span class="group-step">'+step+'</span> '+title;main.append(section);}
 if(shared){shared.classList.add('ws-panel');const fold=document.createElement('details'),summary=document.createElement('summary');summary.textContent='先生共有メモ';shared.querySelector('h3')?.remove();fold.append(summary);while(shared.firstChild)fold.append(shared.firstChild);shared.append(fold);reference.append(shared);}
 const contacts=document.getElementById('scGeneratorContacts');if(contacts){const panel=document.createElement('section');panel.className='ws-panel';panel.innerHTML='<h3>入退室・生徒からの連絡</h3>';panel.append(contacts);reference.prepend(panel);}
 columns.append(main,reference);ops.append(columns);modal.querySelector('.modal-actions')?.classList.add('group-savebar');
}
window.LessonDetailLayout={single,generator};
})();
