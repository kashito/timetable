<?php
try{
 require_once __DIR__.'/student_contacts.php';header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');staffSession();$owner=scOwner();$method=$_SERVER['REQUEST_METHOD'];
 $in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式を確認してください。',400);$action=scText($in,'action',30,true);$data=scData();$now=date('c');
 function scRespond($value){$j=json_encode($value,JSON_UNESCAPED_UNICODE);if($j===false)throw new RuntimeException('Contact response encoding failed');echo $j;}
 if($method==='GET'){
  if($action==='context'){$student=scText($in,'student',300,true);$keys=json_decode(scText($in,'keys',24000,true),true);scRespond(['ok'=>true,'context'=>scContext($student,$keys)]);exit;}
  if($action==='mine'){$student=scText($in,'student',300,true);$items=[];foreach($data as $item)if(hash_equals($item['owner'],$owner)&&$item['student']===$student)$items[]=scPublic($item);}
  elseif($action==='inbox'){$actor=staffRequire();$items=[];$filterKeys=isset($in['keys'])?scKeys(json_decode(scText($in,'keys',24000,true),true),true):null;foreach($data as $item)if(scCanRead($item,$actor)){if($filterKeys){$current=scAttendanceContext($item);if(!array_intersect($filterKeys,array_keys($current))&&!array_intersect($filterKeys,array_column($item['lessons'],'key')))continue;}$items[]=scPublic($item,true);}$count=count(array_filter($items,fn($x)=>empty($x['read'])));if(($in['countOnly']??'')==='1'){scRespond(['ok'=>true,'count'=>$count]);exit;}}
  else staffFail('不明な操作です。',400);
  usort($items,fn($a,$b)=>strcmp($b['createdAt'],$a['createdAt']));scRespond(['ok'=>true,'items'=>$items]);exit;
 }
 if($method!=='POST')staffFail('Method not allowed',405);staffCsrf();
 if($action==='send'){
  $student=scText($in,'student',300,true);$keys=scKeys($in['keys']??null);$selected=scKeys($in['selectedKeys']??null);foreach($selected as $key)if(!in_array($key,$keys,true))staffFail('対象コマを確認してください。',400);
  $kind=scText($in,'kind',20,true);if(!in_array($kind,['absence','late'],true))staffFail('欠席か遅刻を選んでください。',400);
  $arrival=scText($in,'arrival',5);if($arrival!==''&&(!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$arrival)||$kind!=='late'))staffFail('到着予定時刻を確認してください。',400);
  $reason=scText($in,'reason',3000);if(($in['confirmedStudent']??null)!==true)staffFail('生徒名と授業を確認してください。',400);$requestId=scText($in,'requestId',80,true);if(!preg_match('/^[a-zA-Z0-9_-]{16,80}$/D',$requestId))staffFail('連絡画面を開き直してください。',400);
  if(!is_array($in['plan']??null))staffFail('授業内容への取り組み方を確認してください。',400);$plan=scPlan($in['plan']);
  $hash=scVersion([$student,$keys,$selected,$kind,$arrival,$reason,$plan]);
  foreach($data as $item)if(hash_equals($item['owner'],$owner)&&$item['requestId']===$requestId){if(!hash_equals($item['requestHash'],$hash))staffFail('前の連絡は保存されています。送信済みの連絡を確認してください。',409);scRespond(['ok'=>true,'item'=>scPublic($item),'duplicate'=>true]);exit;}
  $context=scContext($student,$keys);if(!hash_equals($context['version'],scText($in,'version',64,true)))staffFail('予定が変更されました。入力を控えて連絡画面を開き直してください。',409);
  $lessons=array_values(array_filter($context['lessons'],fn($r)=>in_array($r['key'],array_map('canonicalLessonKey',$selected),true)));$sources=array_column($lessons,'sourceKey');$recent=0;
  foreach($data as $item)if(hash_equals($item['owner'],$owner)){if(strtotime($item['createdAt'])>time()-3600)$recent++;if($item['student']===$student&&empty($item['cancelledAt'])&&array_intersect($sources,array_column($item['lessons'],'sourceKey')))staffFail('この授業には送信済みの連絡があります。内容を変更する場合は、先の連絡を取り消してから送信してください。',409);}
  if($recent>=60)staffFail('短時間に多くの連絡が送られています。少し時間をおいてください。',429);
  $id=bin2hex(random_bytes(16));$data[$id]=['id'=>$id,'owner'=>$owner,'student'=>$student,'lessons'=>$lessons,'kind'=>$kind,'arrival'=>$arrival,'reason'=>$reason,'plan'=>$plan,'planUpdatedAt'=>$now,'createdAt'=>$now,'cancelledAt'=>null,'confirmations'=>[],'revision'=>1,'reads'=>[],'requestId'=>$requestId,'requestHash'=>$hash,'history'=>[['action'=>'sent','at'=>$now,'plan'=>$plan]]];
 }elseif(in_array($action,['cancel','plan','read','confirm'],true)){
  $id=scText($in,'id',64,true);$item=$data[$id]??null;
  if($action==='read'||$action==='confirm'){$actor=staffRequire();if(!$item||!scCanRead($item,$actor))staffFail('連絡が見つかりません。',404);}
  elseif(!$item||!hash_equals($item['owner'],$owner))staffFail('このブラウザーから送った連絡ではありません。',404);
  if(!hash_equals(scItemVersion($item),scText($in,'version',64,true)))staffFail('連絡の状態が変わりました。再読み込みして確認してください。',409);
  if($action==='cancel'){if(empty($item['cancelledAt'])){$item['cancelledAt']=$now;$item['revision']++;$item['history'][]=['action'=>'cancelled','at'=>$now];}}
  elseif($action==='plan'){if(!empty($item['cancelledAt']))staffFail('取り消した連絡の内容は変更できません。',409);if(!is_array($in['plan']??null))staffFail('取り組み方を確認してください。',400);$plan=scPlan($in['plan']);if($item['plan']!==$plan){$item['plan']=$plan;$item['planUpdatedAt']=$now;$item['revision']++;$item['history'][]=['action'=>'plan_updated','at'=>$now,'plan'=>$plan];}}
  elseif($action==='read'){$item['reads'][$actor['id']]=$item['revision'];}
  else{
   if(!empty($item['cancelledAt']))staffFail('取り消された申告です。授業の出欠画面で実際の出欠を確認してください。',409);
   $current=scAttendanceContext($item);if(count($current)!==count($item['lessons']))staffFail('授業が削除・変更されています。現在の予定を確認してください。',409);
   if(!hash_equals(scVersion($current),scText($in,'attendanceVersion',64,true)))staffFail('出欠または授業が更新されました。再読み込みして確認してください。',409);
   $values=$in['attendance']??null;if(!is_array($values)||count($values)!==count($current)||array_diff(array_keys($values),array_keys($current)))staffFail('対象コマの出欠を選んでください。',400);
   $states=readJsonStrict(__DIR__.'/data/class_state.json');foreach($values as $key=>$value){if(!in_array($value,['出席','遅刻','欠席','早退','免除','その他'],true))staffFail('出欠を選んでください。',400);$state=$states[$key]??[];$state['attendance'][$item['student']]=$value;$state['attendanceTouched']=true;$state['updatedAt']=$now;$state['updatedBy']=$actor['name'];if(isset($state['exemptionOverrides'][$item['student']])){$state['exemptionOverrides'][$item['student']]=$value==='免除';unset($state['exemptionUndo'][$item['student']]);}$states[$key]=$state;$item['confirmations'][$key]=['value'=>$value,'at'=>$now,'by'=>$actor['name'],'actorId'=>$actor['id']];}
   $item['history'][]=['action'=>'attendance_confirmed','at'=>$now,'by'=>$actor['name'],'actorId'=>$actor['id'],'values'=>$values];$item['reads'][$actor['id']]=$item['revision'];
  }
  $data[$id]=$item;
 }else staffFail('不明な操作です。',400);
 require_once __DIR__.'/lesson_links.php';$changes=[__DIR__.'/data/student_contacts.php'=>$data];if(isset($states))$changes[__DIR__.'/data/class_state.json']=$states;
 if(!safeDataTransaction($changes))staffFail('保存できませんでした。入力内容を残して再度お試しください。',500);
 if(isset($states))$GLOBALS['scAttendanceStates']=$states;
 scRespond(['ok'=>true,'item'=>scPublic($data[$id],in_array($action,['confirm','read'],true))]);
}catch(Throwable $e){error_log('[student_contact_api] '.get_class($e).' at '.basename($e->getFile()).':'.$e->getLine());http_response_code(500);header('Content-Type: application/json; charset=utf-8');echo json_encode(['ok'=>false,'error'=>'連絡を処理できませんでした。入力内容を控えて送信済みの連絡を確認してください。（SC_SERVER）'],JSON_UNESCAPED_UNICODE);}
