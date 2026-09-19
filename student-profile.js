(()=>{
 const $=id=>document.getElementById(id),esc=Workspace.esc;let profiles={},busy=false,dirty=false;
 function summary(p){return {registrationNumber:p.registrationNumber||'',school:p.school||'',addressShort:p.addressShort||''};}
 async function profileApi(query='',payload){
  const saving=!!payload,fail=(text,uncertain=false)=>Object.assign(new Error(text),{uncertain});let r,raw;
  try{r=await fetch('student_profile_api.php?client=r38'+(query?'&'+query:''),{cache:'no-store',...(saving?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{})});raw=await r.text();}
  catch(e){throw fail(saving?'サーバーと通信できず、保存結果を確認できませんでした。入力内容は残っています。接続を確認してもう一度保存してください。':'生徒情報を読み込めませんでした。接続を確認して開き直してください。',saving);}
  let j;try{j=JSON.parse(raw);}catch(e){}
  if(!j||typeof j!=='object'||Array.isArray(j)||typeof j.ok!=='boolean')throw fail((saving?'生徒情報の保存結果を確認できませんでした。入力内容は残っています。もう一度保存してください。':'生徒情報を読み込めませんでした。時間をおいて開き直してください。')+'（応答形式・HTTP '+r.status+'）',saving);
  if(!r.ok||!j.ok)throw fail(typeof j.error==='string'?j.error:'生徒情報の処理を完了できませんでした。',saving&&j.uncertain===true);
  if((saving||query.startsWith('action=detail'))&&(!j.profile||typeof j.profile!=='object'||typeof j.version!=='string'))throw fail('生徒情報の応答が不完全です。入力内容は残っています。もう一度お試しください。',saving);
  return j;
 }
 function savedPatchMatches(profile,patch){
  return Object.entries(patch).every(([key,value])=>key==='extras'?JSON.stringify((profile.extras||[]).map(r=>({id:r.id,label:r.label,value:r.value})))===JSON.stringify(value.map(r=>({id:r.id,label:r.label.trim(),value:r.value.trim()})).filter(r=>r.label||r.value)):profile[key]===value.trim());
 }
 async function refresh(){const j=await profileApi();profiles=j.profiles||{};return profiles;}
 function kanjiNumber(s){if(/^\d+$/.test(s))return String(Number(s));const digits={'〇':0,'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};if(!/[十百]/.test(s))return s.split('').map(c=>digits[c]??c).join('');let sum=0,n=0;for(const c of s){if(c==='百'||c==='十'){sum+=(n||1)*(c==='百'?100:10);n=0;}else n=digits[c]??0;}return String(sum+n);}
 function shortAddress(address){
  let s=String(address||'').normalize('NFKC').trim().replace(/^〒?\s*\d{3}[-\s]?\d{4}\s*/,'').replace(/\s+/g,'');
  s=s.replace(/^(東京都|北海道|京都府|大阪府|.{2,3}県)/,'');
  if(/^[^郡]+郡[^町村]+[町村]/.test(s))s=s.replace(/^[^郡]+郡[^町村]+[町村]/,'');
  else {s=s.replace(/^.+?市(?:市)?/,'');s=s.replace(/^[^区]+区/,'');}
  const chome=s.match(/^(.+?)([\d〇零一二三四五六七八九十百]+)丁目/);if(chome)return chome[1]+kanjiNumber(chome[2]);
  const block=s.match(/^([^\d]+?)(\d+)(?:[-−ー－]|番地?|号|$)/);if(block)return block[1]+String(Number(block[2]));
  return s.slice(0,100);
 }
 function message(text,error=false){$('studentProfileMessage').textContent=text;$('studentProfileMessage').classList.toggle('error',error);}
 function lock(value){busy=value;$('studentProfileDialog').querySelectorAll('input,textarea,button').forEach(e=>e.disabled=value);}
 function close(){if(busy)return;if(dirty&&!confirm('生徒情報の未保存の変更を取り消して閉じますか？'))return;$('studentProfileDialog').close();dirty=false;}
 async function open(name){
  let d=$('studentProfileDialog');if(!d){d=document.createElement('dialog');d.id='studentProfileDialog';d.className='ws-dialog directory-dialog student-profile-dialog';document.body.appendChild(d);}
  d.innerHTML=`<div class="ws-dialog-inner"><div class="ws-dialog-head"><h2>${esc(name)}の生徒情報</h2><button id="studentProfileClose" class="ws-button">閉じる</button></div><div class="ws-dialog-body"><p class="ws-muted">生徒管理で使う情報です。管理者のみ閲覧・編集できます。</p><div class="student-profile-fields"><label>塾籍番号<input id="profileNumber" maxlength="40" autocomplete="off" placeholder="例：001234"><small id="profileNumberSource"></small></label><label>所属学校<input id="profileSchool" list="registeredSchoolChoices" maxlength="200" autocomplete="off" placeholder="学校名"><datalist id="registeredSchoolChoices"></datalist><small id="registeredSchoolHint">学校行事を自動表示する学校を選択できます。</small></label><label>住所<input id="profileAddress" maxlength="500" autocomplete="off" placeholder="例：大阪府豊中市幸町３丁目1番2号"></label><label>一覧に表示する住所<input id="profileAddressShort" maxlength="100" autocomplete="off" placeholder="例：幸町3"></label></div><div class="ws-controls"><button id="profileSuggestAddress" class="ws-button">住所から短縮表示を作る</button></div><p class="ws-muted">住所入力から短縮表示を作ります。町名・丁目の読み取りが合わない場合は手直しできます。</p><section class="ws-panel"><h3>追加情報</h3><p class="ws-muted">今後必要になる情報は、項目名と内容を追加して保存できます。</p><div id="profileExtras"></div><button id="profileAddExtra" class="ws-button">項目を追加</button></section></div><div class="ws-dialog-foot"><span id="studentProfileMessage" class="ws-message" role="status"></span><button id="studentProfileSave" class="ws-button primary">生徒情報を保存</button></div></div>`;
  Workspace.api('calendar_events_api.php').then(j=>{$('registeredSchoolChoices').innerHTML=j.schools.map(s=>`<option value="${esc(s.name)}"></option>`).join('');}).catch(()=>{$('registeredSchoolHint').textContent='学校候補を読み込めません。学校名は直接入力できます。';});
  dirty=false;d.oninput=null;d.oncancel=e=>{e.preventDefault();close();};$('studentProfileClose').onclick=close;d.showModal();lock(true);message('読み込み中…');
  let data;try{data=await profileApi('action=detail&name='+encodeURIComponent(name));}catch(e){busy=false;$('studentProfileClose').disabled=false;message(e.message,true);return;}
  const p=data.profile||{};for(const [id,key] of [['profileNumber','registrationNumber'],['profileSchool','school'],['profileAddress','address'],['profileAddressShort','addressShort']])$(id).value=p[key]||'';
  if(data.linkedRegistrationNumber){$('profileNumber').value=data.linkedRegistrationNumber;$('profileNumber').readOnly=true;$('profileNumberSource').textContent='入退室アプリから取得しています。番号の変更は入退室側で行います。';}else{$('profileNumberSource').innerHTML='入退室の番号を使う場合は <a href="presence.html">生徒の対応を設定</a> してください。';}
  let extras=p.extras||[],autoAddress=!p.addressShort||p.addressShort===shortAddress(p.address);
  function renderExtras(){ $('profileExtras').innerHTML=extras.map((r,i)=>`<div class="student-profile-extra"><label>項目名<input data-extra-label="${i}" maxlength="50" value="${esc(r.label)}" placeholder="項目名"></label><label>内容<textarea data-extra-value="${i}" maxlength="4000">${esc(r.value)}</textarea></label><button class="ws-button" data-extra-remove="${i}">削除</button></div>`).join('');}
  d.oninput=e=>{dirty=true;if(e.target.id==='profileAddress'&&autoAddress)$('profileAddressShort').value=shortAddress(e.target.value);if(e.target.id==='profileAddressShort')autoAddress=false;if(e.target.dataset.extraLabel!==undefined)extras[Number(e.target.dataset.extraLabel)].label=e.target.value;if(e.target.dataset.extraValue!==undefined)extras[Number(e.target.dataset.extraValue)].value=e.target.value;};
  $('profileSuggestAddress').onclick=()=>{$('profileAddressShort').value=shortAddress($('profileAddress').value);autoAddress=true;dirty=true;};
  $('profileAddExtra').onclick=()=>{if(extras.length>=30){message('追加情報は30項目までです。',true);return;}extras.push({id:[...crypto.getRandomValues(new Uint8Array(12))].map(n=>n.toString(16).padStart(2,'0')).join(''),label:'',value:''});renderExtras();dirty=true;};
  $('profileExtras').onclick=e=>{const button=e.target.closest('[data-extra-remove]');if(button){extras.splice(Number(button.dataset.extraRemove),1);renderExtras();dirty=true;}};
  $('studentProfileSave').onclick=async()=>{
   if(busy)return;lock(true);message('保存中…');
   const patch={...(data.linkedRegistrationNumber?{}:{registrationNumber:$('profileNumber').value}),school:$('profileSchool').value,address:$('profileAddress').value,addressShort:$('profileAddressShort').value,extras};
   try{
    let j;try{j=await profileApi('',{action:'save',name,version:data.version,profile:patch});}
    catch(e){
     // A lost response may follow a successful write. Read back without resubmitting.
     if(e.uncertain){message('保存結果を確認しています…');let stored;try{stored=await profileApi('action=detail&name='+encodeURIComponent(name));}catch(ignored){}
      if(stored&&savedPatchMatches(stored.profile,patch))j=stored;
     }
     if(!j)throw e;
    }
    profiles[name]=j.summary||summary(j.profile);if(data.linkedRegistrationNumber){profiles[name].registrationNumber=data.linkedRegistrationNumber;profiles[name].numberSource='attendance';}
    dirty=false;d.close();document.dispatchEvent(new Event('student-profiles-updated'));$('studentManageMessage').textContent=name+'の生徒情報を保存しました。';
   }catch(e){message(e.message,true);}finally{lock(false);}
  };
  lock(false);renderExtras();message('');
 }
 window.StudentProfiles={refresh,get:name=>profiles[name]||{},shortAddress};
 document.addEventListener('click',e=>{const button=e.target.closest('[data-student-profile]');if(button&&!busy&&StaffAuth.user?.role==='admin')open(button.dataset.studentProfile);});
 window.addEventListener('beforeunload',e=>{if(dirty&&$('studentProfileDialog')?.open){e.preventDefault();e.returnValue='';}});
})();
