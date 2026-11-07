(()=>{'use strict';
const $=(root,selector)=>root.querySelector(selector);
function heading(section,title,step){
 let h=$(section,':scope > h3, :scope > h2, :scope > .group-section-title, :scope > .record-headline');
 if(h?.classList.contains('record-headline')){const link=h.querySelector('a');if(link)section.append(link);}
 const replacement=document.createElement('h3');replacement.className='lesson-detail-heading';replacement.innerHTML='<span class="group-step">'+step+'</span><span>'+title+'</span>';
 if(h)h.replaceWith(replacement);else section.prepend(replacement);
 section.classList.add('lesson-detail-card','ws-panel');return replacement;
}
function card(kind,title,step,description){const section=document.createElement('section');section.className='lesson-detail-card lesson-detail-'+kind;heading(section,title,step);const p=document.createElement('p');p.className='lesson-detail-description';p.textContent=description;section.append(p);return section;}
function fieldParts(field){
 if(!field)return [];const nodes=[field],editor=field._homeworkItems?.root;
 if(editor)nodes.push(editor);
 // Helpers may mount before this script on a slow connection. Move the existing
 // nodes with their field rather than recreating controls or losing listeners.
 for(let node=field.nextElementSibling;node&&(node===editor||node.classList.contains('recording-tbd')||node.classList.contains('group-field-help'));node=node.nextElementSibling){if(!nodes.includes(node))nodes.push(node);}
 // Keep an already-created homework editor attached to its backing field.
 const label=field.closest('label')||field.parentElement.querySelector('label[for="'+field.id+'"]');
 if(label){if(label.contains(field))label.before(field);label.remove();}
 return nodes;
}
function inputLabel(section,field,text){const label=document.createElement('label');label.htmlFor=field.id;label.className='lesson-detail-field-label';label.textContent=text;section.append(label,...fieldParts(field));field.setAttribute('aria-label',text);}
function splitRecord(record,ids){
 if(!record||record.dataset.mobileLayout)return;record.dataset.mobileLayout='1';
 const due=$(record,ids.due),memo=$(record,ids.memo),next=$(record,ids.next);if(!due||!memo||!next)return;
 const dueHelp=due.nextElementSibling?.tagName==='SMALL'?due.nextElementSibling:null;
 const dueCard=card('due','このコマまでの宿題',2,'授業のはじめに確認。前回からの宿題と、このコマを期限にした宿題です。');
 const memoCard=card('karte','カルテ（この授業の記録）',3,'授業で取り組んだ内容、生徒の様子、次回の指導への引き継ぎを記録します。');
 const nextCard=card('next','次回までの宿題',4,'授業のおわりに入力。ここに書いた宿題を、次回の授業へ引き継ぎます。');
 due.dataset.homeworkLabel='このコマまでの宿題';next.dataset.homeworkLabel='次回までの宿題';
 const carried=$(record,'[data-recording-key], #generatorCarriedHomework');
 if(carried)dueCard.append(carried);else{let previous=$(record,'.recording-previous');if(!previous){previous=document.createElement('aside');previous.className='recording-previous';}dueCard.append(previous);}
 inputLabel(dueCard,due,'このコマまでの宿題を追加・編集');
 if(dueHelp)dueHelp.remove();
 const note=document.createElement('small');note.textContent='前回からの宿題への追加欄です。宿題の内容や期限を変更したら「'+(due.id==='generatorDueHomework'?'カルテ・宿題を保存」または「変更を保存':'まとめて保存')+'」で確定します。';dueCard.append(note);
 inputLabel(memoCard,memo,'カルテ本文');
 const links=$(record,'.group-record-links, .record-list-mini-link');if(links)memoCard.append(links);
 const tests=$(record,'.recording-tests');if(tests)memoCard.append(tests);
 const countdown=$(record,'#groupNextLesson');if(countdown)nextCard.append(countdown);
 const none=$(record,'[data-homework-none]')?.parentElement;
 inputLabel(nextCard,next,'次回までに取り組む内容');if(none)nextCard.append(none);
 if(!none){const p=document.createElement('small');p.textContent='宿題がない日は「宿題なし」と入力してください。';nextCard.append(p);}
 const oldHeading=$(record,':scope > h3, :scope > .group-section-title, :scope > .record-headline');oldHeading?.remove();
 // Only remove the old explanatory labels. Retain replies, files, save actions and their listeners.
 for(const node of [...record.children])if(node.tagName==='LABEL'&&!node.querySelector('input,textarea,select')||node.tagName==='SMALL')node.remove();
 record.classList.add('lesson-detail-records');record.prepend(dueCard,memoCard,nextCard);
 for(const field of [memo]){const fit=()=>{field.style.height='auto';field.style.height=Math.max(156,field.scrollHeight)+'px';};field.addEventListener('input',fit);field.addEventListener('focus',fit);}
}
function teacherPanel(section,input){
 if(!section||!input)return;const details=$(section,':scope > details');if(details){details.querySelector('summary')?.remove();while(details.firstChild)section.append(details.firstChild);details.remove();}
 heading(section,'先生への連絡',5);section.classList.add('lesson-detail-teachers');section.querySelector(':scope > p.ws-muted')?.remove();
 const description=document.createElement('p');description.className='lesson-detail-description';description.textContent='先生同士の連絡・相談です。同じクラスの全日程で共有します。この授業だけの指導記録は「カルテ」に記入してください。';section.querySelector('.lesson-detail-heading').after(description);
 input.setAttribute('aria-label','先生への連絡（同じクラスの全日程で共有）');input.rows=4;
 const label=document.createElement('label');label.htmlFor=input.id;label.className='lesson-detail-field-label';label.textContent='先生への連絡を入力';input.before(label);
 const help=document.createElement('small');help.className='lesson-detail-save-help';help.textContent='「共有メモを投稿」または「'+(input.id==='fTeacherSharedMemo'?'変更を保存':'まとめて保存')+'」で共有します。';section.append(help);
}
function single(modal){
 const body=$(modal,'#opsBody');if(!body)return;modal.classList.add('lesson-detail-single','lesson-detail-mobile');
 const record=$(body,'.record-sec'),attendance=$(body,'.attSel')?.closest('.ops-sec')||$(body,'.attendance-bulk-actions')?.closest('.ops-sec'),message=$(body,'#publicNote')?.closest('.ops-sec'),teacher=$(body,'#teacherMemo')?.closest('.ops-sec');
 const main=document.createElement('div'),reference=document.createElement('div'),columns=document.createElement('div');columns.className='group-detail-columns';main.className='group-main-column';reference.className='group-reference-column';
 if(attendance){heading(attendance,'出欠を記録',1);main.append(attendance);}
 if(record){splitRecord(record,{due:'#lessonDueHomework',memo:'#lessonRecordMemo',next:'#lessonHomework'});main.append(record);}
 if(teacher){teacherPanel(teacher,$(teacher,'#teacherMemo'));main.append(teacher);}
 if(message){heading(message,'生徒へのメッセージ・資料',6);main.append(message);}
 const contacts=attendance?.querySelector('#scOpsContacts');if(contacts){const panel=document.createElement('section');panel.className='ops-sec ws-panel';panel.innerHTML='<h3>入退室・生徒からの連絡</h3>';panel.append(contacts);reference.append(panel);}
 for(const section of [...body.querySelectorAll(':scope > .ops-sec')]){section.classList.add('ws-panel');const fold=document.createElement('details'),summary=document.createElement('summary'),h=section.querySelector('h3');summary.textContent=h?.textContent||'授業準備';h?.remove();fold.append(summary);while(section.firstChild)fold.append(section.firstChild);section.append(fold);reference.append(section);}
 columns.append(main,reference);const summary=$(body,'[role="status"]');if(summary)summary.after(columns);else body.prepend(columns);const save=$(body,'#opsSave');if(save)save.textContent='まとめて保存';
}
function group(){
 const record=document.getElementById('groupRecordSection');if(!record)return;document.body.classList.add('lesson-detail-mobile');
 heading(document.getElementById('groupAttendanceSection'),'出欠を記録',1);
 splitRecord(record,{due:'#groupDueHomework',memo:'#groupMemo',next:'#groupHomework'});
 const input=document.getElementById('groupSharedMemo'),teacher=input?.closest('.ws-panel');if(teacher){teacherPanel(teacher,input);record.after(teacher);}
 const message=document.getElementById('groupStudentMessage');if(message)heading(message,'生徒へのメッセージ',6);
}
function generator(mode){
 const modal=document.getElementById('modal'),ops=document.getElementById('generatorOps');if(!modal||!ops)return;
 modal.classList.toggle('lesson-detail-generator',mode==='edit');modal.classList.toggle('lesson-detail-mobile',mode==='edit');if(mode!=='edit'||ops.dataset.detailLayout)return;ops.dataset.detailLayout='1';
 const record=document.getElementById('generatorRecordEditor'),attendance=document.getElementById('generatorAttendanceList')?.closest('.generator-ops-section'),shared=document.getElementById('fTeacherSharedMemo')?.closest('.generator-ops-section'),columns=document.createElement('div'),main=document.createElement('div'),reference=document.createElement('div');columns.className='group-detail-columns';main.className='group-main-column';reference.className='group-reference-column';
 if(attendance){heading(attendance,'出欠を記録',1);main.append(attendance);}
 if(record){splitRecord(record,{due:'#generatorDueHomework',memo:'#generatorRecordMemo',next:'#generatorHomework'});main.append(record);}
 if(shared){teacherPanel(shared,document.getElementById('fTeacherSharedMemo'));main.append(shared);}
 const contacts=document.getElementById('scGeneratorContacts');if(contacts){const panel=document.createElement('section');panel.className='ws-panel';panel.innerHTML='<h3>入退室・生徒からの連絡</h3>';panel.append(contacts);reference.prepend(panel);}
 columns.append(main,reference);ops.append(columns);modal.querySelector('.modal-actions')?.classList.add('group-savebar');
}
window.LessonDetailLayout={single,generator,group};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',group);else group();
})();