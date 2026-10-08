<?php
require_once __DIR__.'/homework_completion.php';staffSession();header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
$method=$_SERVER['REQUEST_METHOD']??'GET';$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式が不正です',400);$student=$in['student']??'';if(!is_string($student)||strlen($student)>300||trim($student)==='')staffFail('生徒を確認してください',400);$items=homeworkCatalog($student);
if($method==='POST'){
 staffCsrf();if(($in['confirmedStudent']??false)!==true)staffFail('生徒を確認してください',400);$states=homeworkStudentStates();$before=$states;$action=$in['action']??'check';
 if($action==='migrate'){$ids=$in['completed']??null;if(!is_array($ids)||count($ids)>1000)staffFail('移行内容を確認してください',400);$known=array_column($items,null,'id');foreach($ids as $id){if(!is_string($id)||!isset($known[$id]))staffFail('宿題が更新されました',409);if(!isset($states[$student][$id]))$states[$student][$id]=['checked'=>true,'at'=>date('c'),'origin'=>'legacy-browser'];}}
 elseif($action==='check'){$id=$in['taskId']??'';$known=array_column($items,null,'id');if(!is_string($id)||!isset($known[$id])||!is_bool($in['checked']??null))staffFail('宿題を確認してください',409);if(!hash_equals($known[$id]['revision'],(string)($in['expectedRevision']??'')))staffFail('別の画面で宿題の完了が更新されました。最新の状態を確認してください。',409);$states[$student][$id]=['checked'=>$in['checked'],'at'=>date('c'),'origin'=>'explicit'];}
 else staffFail('操作を確認してください',400);
 if($states!==$before&&!safeJsonWriteAtomic(__DIR__.'/data/student_homework_checks.php',$states))staffFail('完了状態を保存できません',500);$items=homeworkCatalog($student);
}elseif($method!=='GET')staffFail('Method not allowed',405);
echo json_encode(['ok'=>true,'student'=>$student,'items'=>$items],JSON_UNESCAPED_UNICODE);
