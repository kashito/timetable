(()=>{
'use strict';
const esc=Workspace.esc,emojis=['👍','❤️','😊','🙏'],labels={'👍':'いいね','❤️':'ハート','😊':'笑顔','🙏':'ありがとう'};
function dateParts(value){
 const m=String(value||'').match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);if(!m)return null;
 const stamp=Date.UTC(+m[1],+m[2]-1,+m[3]),d=new Date(stamp);
 if(d.getUTCFullYear()!==+m[1]||d.getUTCMonth()!==+m[2]-1||d.getUTCDate()!==+m[3])return null;
 return {stamp,iso:`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`,weekday:'日月火水木金土'[d.getUTCDay()]};
}
function tokyoParts(value=new Date()){return Object.fromEntries(new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(value).map(p=>[p.type,p.value]));}
function relative(stamp){const p=tokyoParts(),today=Date.UTC(+p.year,+p.month-1,+p.day),days=Math.round((today-stamp)/86400000);return days===0?'今日':days>0?days+'日前':-days+'日後';}
function dateLabel(value){const d=dateParts(value);return d?`${d.iso}（${d.weekday}） · ${relative(d.stamp)}`:String(value||'日付未登録');}
function dateTimeLabel(value){if(!value)return '';const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value);const p=tokyoParts(d),date=dateParts(`${p.year}-${p.month}-${p.day}`);return `${date.iso.replaceAll('-','.')}（${date.weekday}） ${p.hour}:${p.minute} · ${relative(date.stamp)}`;}
function attendanceUrl(item){
 const u=new URL(item.groupId?'lesson_group.html':'teacher2026summer_vertical.html',location.href);if(item.groupId)u.searchParams.set('v','20260916-r53');
 if(item.groupId)u.searchParams.set('id',item.groupId);else{if(item.teacher)u.searchParams.set('teacher',item.teacher);u.searchParams.set('openKey',item.eventKey);u.searchParams.set('date',item.date);}
 u.searchParams.set('attendance','1');return u.pathname.split('/').pop()+u.search;
}
function attendanceHtml(items){
 if(!Array.isArray(items))return '<p class="record-attendance-warning">出欠を読み込めませんでした。ページを再読み込みしてください。</p>';
 if(!items.length)return '<p class="record-attendance-warning">対応する授業が見つかりません。</p>';
 let shown=items;
 if(items.length>1&&items.every(i=>JSON.stringify([i.statuses,i.missing,i.total])===JSON.stringify([items[0].statuses,items[0].missing,items[0].total])))shown=[{...items[0],slot:items.map(i=>i.slot).join('')}];
 return '<h3>参加者・出欠</h3>'+shown.map(item=>{
  const lines=Object.entries(item.statuses||{}).filter(([,names])=>names.length).map(([status,names])=>`<div class="record-attendance-row"><strong>${esc(status)}</strong><span>${names.map(esc).join('、')}</span></div>`).join('');
  const needsEntry=(item.missing||[]).length||!item.total;
  return `<div class="record-attendance-slot">${items.length>1?`<h4>${esc(item.slot)}</h4>`:''}${lines}${item.missing?.length?`<div class="record-attendance-row is-missing"><strong>未記録</strong><span>${item.missing.map(esc).join('、')}</span></div>`:''}${needsEntry?`<p class="record-attendance-prompt">${item.editable?`<a href="${esc(attendanceUrl(item))}">出欠を記録してください。</a>`:'出欠未記録（対応する授業予定がないため、管理者に確認してください）'}</p>`:`<a class="record-attendance-edit" href="${esc(attendanceUrl(item))}">${item.editable?'出欠を確認・修正':'授業の詳細を確認'}</a>`}</div>`;
 }).join('');
}
function reactionsHtml(record,reply=null){
 if(reply&&!reply.id)return '';
 const target=reply||record,reactions=target.reactions||{},mine=reactions[StaffAuth.user?.id]?.emoji||'',replyId=reply?.id||'';
 const groups=emojis.map(emoji=>({emoji,names:Object.values(reactions).filter(r=>r.emoji===emoji).map(r=>r.name||'先生')}));
 return `<div class="karte-reactions" data-reaction-target="${esc(replyId)}">${reply?'<span class="karte-reaction-label">この返信にリアクション</span>':''}<div class="karte-reaction-buttons" role="group" aria-label="${reply?'返信':'カルテ'}のリアクション">${groups.map(({emoji,names})=>`<button type="button" class="karte-reaction ${mine===emoji?'is-mine':''}" data-reaction="${emoji}" data-reply-id="${esc(replyId)}" data-expected="${esc(mine)}" aria-pressed="${mine===emoji}" aria-label="${labels[emoji]} ${names.length}人${mine===emoji?'。自分のリアクションを取り消す':''}" title="${esc(names.length?emoji+' '+names.join('、'):labels[emoji])}"><span aria-hidden="true">${emoji}</span>${names.length?`<span>${names.length}</span>`:''}</button>`).join('')}</div>${groups.some(g=>g.names.length)?`<details class="karte-reaction-people"><summary>誰がリアクションしたか</summary>${groups.filter(g=>g.names.length).map(g=>`<p>${g.emoji} ${g.names.map(esc).join('、')}</p>`).join('')}</details>`:''}<span class="karte-reaction-message" role="status"></span></div>`;
}
function refreshDates(){document.querySelectorAll('[data-record-date]').forEach(el=>el.textContent='📅 '+dateLabel(el.dataset.recordDate));document.querySelectorAll('[data-record-time]').forEach(el=>el.textContent=(el.dataset.recordTimeLabel||'')+dateTimeLabel(el.dataset.recordTime));}
window.KarteUI={dateLabel,dateTimeLabel,attendanceHtml,reactionsHtml,refreshDates};
setInterval(refreshDates,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDates();});
})();
