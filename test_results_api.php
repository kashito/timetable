<?php
require_once __DIR__.'/test_results_data.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
$actor=staffRequire();$file=__DIR__.'/data/test_results.php';
function trReply($v){echo json_encode(['ok'=>true]+$v,JSON_UNESCAPED_UNICODE);exit;}
function trVersion($r){return hash('sha256',json_encode($r,JSON_UNESCAPED_UNICODE));}
function trPublic($r){static $directory=null;if($directory===null)$directory=readJsonStrict(__DIR__.'/data/directory_state.json');unset($r['requestId'],$r['requestHash']);$r['version']=trVersion($r);$r['statuses']=trStatuses($r);$r['pendingStudents']=trPendingNames($r,$directory);return $r;}
function trText($v,$max){if(!is_string($v)||strlen($v)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$v))staffFail('入力内容を確認してください。',400);return trim($v);}
try{
 $method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))staffFail('操作を確認してください。',405);
 $in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力内容を確認してください。',400);
 $data=trReadData();
 $key=trText($in['key']??'',1000);$context=$key!==''?recordingContext($key):null;
 if($method==='GET'){
  $items=array_values($data['items']);if($context)$items=array_values(array_filter($items,fn($r)=>($r['key']??'')===$context['key']||((empty($r['groupId'])&&empty($context['groupId']))&&($r['sources']??[])===$context['sources'])));
  usort($items,fn($a,$b)=>strcmp($b['date'],$a['date'])?:strcmp($b['createdAt'],$a['createdAt']));trReply(['items'=>array_map('trPublic',$items),'context'=>$context,'canArchive'=>$actor['role']==='admin']);
 }
 if(!$context)staffFail('授業の詳細から記録してください。',400);
 $id=trText($in['id']??'',24);$old=$id!==''?($data['items'][$id]??null):null;
 if($id!==''&&!$old)staffFail('テストが見つかりません。',404);
 if($old&&$old['key']!==$context['key']&&($old['sources']??[])!==$context['sources'])staffFail('テストの授業を確認してください。',409);
 $action=$in['action']??'save';
 if($action==='archive'){
  if($actor['role']!=='admin')staffFail('テストの非表示は管理者のみ行えます。',403);
  if(!$old||!is_bool($in['archived']??null))staffFail('テストを選んでください。',400);
  if(!hash_equals(trPublic($old)['version'],(string)($in['version']??'')))staffFail('結果が更新されています。再読み込みしてください。',409);
  $old['history'][]=['action'=>'archive','archived'=>$in['archived'],'at'=>date('c'),'by'=>$actor['name']];$old['archived']=$in['archived'];$old['updatedAt']=date('c');$old['updatedBy']=$actor['name'];$data['items'][$id]=$old;
  if(!safeJsonWriteAtomic($file,$data))staffFail('保存できませんでした。',500);trReply(['item'=>trPublic($old)]);
 }
 if($action!=='save')staffFail('操作を確認してください。',400);
 $name=trText($in['name']??'',600);$total=$in['total']??null;$scores=$in['scores']??null;$note=trText($in['note']??'',12000);
 if($name===''||!is_int($total)||$total<1||$total>100000||!is_array($scores)||count($scores)>500)staffFail('テスト名・問題数（1〜100000問）・生徒の結果を確認してください。',400);
 $allowed=array_fill_keys(array_merge($context['students'],array_keys($old['scores']??[])),true);$normalized=$old['scores']??[];$statuses=trStatuses($old??[]);$inputStatuses=$in['statuses']??null;
 if($inputStatuses!==null&&(!is_array($inputStatuses)||array_diff_key($inputStatuses,$scores)||array_diff_key($scores,$inputStatuses)))staffFail('生徒ごとの報告状態を確認してください。',400);
 foreach($scores as $student=>$score){
  if(!is_string($student)||!isset($allowed[$student]))staffFail('生徒の一覧が変わりました。再読み込みしてください。',409);
  if($score!==null&&(!is_int($score)||$score<0||$score>$total))staffFail($student.'の正解数を0〜'.$total.'問で入力してください。',400);
  $status=$inputStatuses!==null?$inputStatuses[$student]:($score!==null?'reported':(($statuses[$student]??'ungraded')==='reported'?'ungraded':($statuses[$student]??'ungraded')));
  if(!in_array($status,['reported','unreported','exempt','ungraded'],true)||($status==='reported')!==($score!==null))staffFail($student.'の報告状態と正解数を確認してください。',400);
  $normalized[$student]=$score;$statuses[$student]=$status;
 }
 foreach($normalized as $student=>$score)if($score!==null&&$score>$total)staffFail('問題数が保存済みの正解数より少なくなっています。',400);
 $requestId=trText($in['requestId']??'',80);if(!preg_match('/^[a-zA-Z0-9_-]{16,80}$/D',$requestId))staffFail('画面を開き直してください。',400);
 $hash=trVersion([$context['key'],$id,$name,$total,$scores,$note,$inputStatuses]);
 foreach($data['items'] as $r)if(($r['requestId']??'')===$requestId&&($r['updatedById']??'')===$actor['id']){if(($r['requestHash']??'')!==$hash)staffFail('前の内容は保存済みです。一覧を確認してください。',409);trReply(['item'=>trPublic($r),'duplicate'=>true]);}
 if($old&&!hash_equals(trPublic($old)['version'],(string)($in['version']??'')))staffFail('別の画面で結果が更新されました。入力を控えて再読み込みしてください。',409);
 $id=$id?:bin2hex(random_bytes(12));$r=$old??['id'=>$id,'createdAt'=>date('c'),'createdBy'=>$actor['name'],'history'=>[],'archived'=>false];
 if($old){$previous=$old;unset($previous['history'],$previous['requestHash'],$previous['requestId']);$r['history'][]=['action'=>'edit','at'=>date('c'),'by'=>$actor['name'],'previous'=>$previous];}
 foreach(['key','date','className','teacher','slots','groupId','sources'] as $field)$r[$field]=$context[$field];
 $r['name']=$name;$r['total']=$total;$r['scores']=$normalized;$r['statuses']=$statuses;$r['note']=$note;$r['updatedAt']=date('c');$r['updatedBy']=$actor['name'];$r['updatedById']=$actor['id'];$r['requestId']=$requestId;$r['requestHash']=$hash;$data['items'][$id]=$r;
 if(!safeJsonWriteAtomic($file,$data))staffFail('保存できませんでした。入力を残しています。',500);trReply(['item'=>trPublic($r)]);
}catch(Throwable $e){error_log('[test_results] '.get_class($e).' '.$e->getLine());staffFail('テスト結果を処理できませんでした。再読み込みしてください。',500);}
