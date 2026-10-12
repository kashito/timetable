<?php
require_once __DIR__.'/api_response.php';
require_once __DIR__.'/staff_security.php';$actor=staffRequire(true);require_once __DIR__.'/student_ng_rules.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
$method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))staffFail('Method not allowed',405);$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力を確認してください。',400);
$base=readJsonStrict(__DIR__.'/data/schedule_data.json');$master=readJsonStrict(__DIR__.'/data/student_master.json',$base['students']??[]);$names=[];foreach($master as $student)if(trim((string)($student['生徒名']??''))!=='')$names[(string)$student['生徒名']]=true;$names=array_keys($names);sort($names,SORT_NATURAL);
if($method==='GET'&&($in['action']??'')==='students'){echo json_encode(['ok'=>true,'students'=>$names],JSON_UNESCAPED_UNICODE);exit;}
$name=trim((string)($in['student']??''));if(!in_array($name,$names,true))staffFail('生徒が見つかりません。生徒管理から開き直してください。',404);$data=studentNgData();
function snItems($data,$name){$items=array_values(array_filter($data['entries'],fn($entry)=>$entry['student']===$name));usort($items,fn($a,$b)=>strcmp($a['fromAt'],$b['fromAt'])?:strcmp($a['id'],$b['id']));return $items;}
function snReply($data,$name,$duplicate=false){$items=snItems($data,$name);echo json_encode(['ok'=>true,'student'=>$name,'items'=>$items,'version'=>hash('sha256',json_encode($items,JSON_UNESCAPED_UNICODE)),'duplicate'=>$duplicate],JSON_UNESCAPED_UNICODE);}
if($method==='GET'){snReply($data,$name);exit;}
$current=snItems($data,$name);if(!hash_equals(hash('sha256',json_encode($current,JSON_UNESCAPED_UNICODE)),(string)($in['version']??'')))staffFail('NG日時が更新されています。入力を控えてから一覧を読み込み直してください。',409);
$action=$in['action']??'save';$id=$in['id']??'';if(!is_string($id)||($id!==''&&!preg_match('/^[a-f0-9]{24}$/D',$id)))staffFail('NG項目を確認してください。',400);$old=$id!==''?($data['entries'][$id]??null):null;if($id!==''&&(!$old||$old['student']!==$name))staffFail('NG項目が見つかりません。',404);
if($action==='delete'){if(!$old)staffFail('解除するNGを選んでください。',400);unset($data['entries'][$id]);}
elseif($action==='save'){$from=$in['fromAt']??null;$until=$in['untilAt']??null;if(studentNgTime($from)===null||studentNgTime($until)===null||studentNgTime($from)>=studentNgTime($until))staffFail('開始・終了日時を日本時間で指定してください。終了は開始より後にしてください。',400);$note=$in['note']??'';if(!is_string($note)||strlen($note)>3000||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$note))staffFail('補足は1000文字程度までで入力してください。',400);
 foreach($current as $entry)if($entry['id']!==$id&&$entry['fromAt']===$from&&$entry['untilAt']===$until){if($id===''){snReply($data,$name,true);exit;}staffFail('同じNG日時が登録済みです。既存の項目を編集してください。',400);}
 if(count($current)>=500&&!$old)staffFail('1人500件以内で登録してください。',400);$id=$id?:bin2hex(random_bytes(12));$data['entries'][$id]=array_replace($old??[],['id'=>$id,'student'=>$name,'fromAt'=>$from,'untilAt'=>$until,'note'=>trim($note),'createdAt'=>$old['createdAt']??date('c'),'updatedAt'=>date('c'),'updatedBy'=>$actor['name']]);
}else staffFail('操作を確認してください。',400);
if(!safeJsonWriteAtomic(__DIR__.'/data/student_ng.php',$data))staffFail('NG日時を保存できませんでした。',500);snReply($data,$name);
