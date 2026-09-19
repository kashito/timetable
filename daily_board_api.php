<?php
require_once __DIR__.'/staff_security.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
header('Vary: Cookie');
function dbReply($data){echo json_encode($data,JSON_UNESCAPED_UNICODE);}
function dbText($in,$key,$max,$required=false){
 $v=$in[$key]??'';
 if(!is_string($v)||strlen($v)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$v)||($required&&trim($v)===''))staffFail('開始時刻・対象・場所・指示の入力を確認してください。',400);
 return trim($v);
}
function dbVersion($day){return hash('sha256',json_encode($day,JSON_UNESCAPED_UNICODE));}
function dbProjection($day,$date,$admin){
 $rows=$day['rows']??[];if(!$admin)$rows=array_values(array_filter($rows,fn($r)=>($r['visible']??true)!==false));
 $out=['date'=>$date,'rows'=>$rows,'settings'=>$GLOBALS['dbSettings'],'boardId'=>$GLOBALS['dbBoardId'],'updatedAt'=>$day['updatedAt']??null,'serverTime'=>date('c'),'canEdit'=>$admin];
 if($admin){$out['version']=dbVersion([$day,$GLOBALS['dbSettings']]);$out['updatedBy']=$day['updatedBy']??'';}
 return $out;
}
try{
 $method=$_SERVER['REQUEST_METHOD'];
 if(!in_array($method,['GET','POST'],true))staffFail('Method not allowed',405);
 $in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);
 if(!is_array($in))staffFail('入力形式を確認してください。',400);
 $date=dbText($in,'date',10)?:date('Y-m-d');
 if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))staffFail('日付を確認してください。',400);
 $actor=$method==='POST'?staffRequire(true):staffCurrent();$admin=$actor&&$actor['role']==='admin'&&empty($actor['mustChange']);if($method==='GET'&&($in['preview']??'')==='student')$admin=false;
 $boardId=dbText($in,'board',20)?:'all';if(!in_array($boardId,['all','blue'],true))staffFail('掲示板を確認してください。',400);$GLOBALS['dbBoardId']=$boardId;
 $file=__DIR__.'/data/'.($boardId==='blue'?'blue_board.php':'daily_board.php');$data=readJsonStrict($file,['schema'=>1,'days'=>[]]);
 if(($data['schema']??null)!==1||!is_array($data['days']??null))dataError('今日の動きのデータ形式を確認してください。上書きせず停止しました。');
 $day=$data['days'][$date]??[];
 $settings=$data['settings']??['title'=>$boardId==='blue'?'青教室の指示':'今日の動き','background'=>$boardId==='blue'?'gray':'blue'];$GLOBALS['dbSettings']=$settings;
 if($method==='GET'){dbReply(['ok'=>true,'board'=>dbProjection($day,$date,$admin)]);exit;}
 $rows=$in['rows']??null;
 if(!is_array($rows)||$rows!==array_values($rows)||count($rows)>150)staffFail('指示は1日150件以内で登録してください。',400);
 $normalized=[];$ids=[];$oldRows=array_column($day['rows']??[],null,'id');
 foreach($rows as $r){
  if(!is_array($r))staffFail('指示の形式を確認してください。',400);
  $id=dbText($r,'id',80,true);if(!preg_match('/^[a-zA-Z0-9_-]{12,80}$/D',$id)||isset($ids[$id]))staffFail('編集画面を開き直してください。',400);$ids[$id]=true;
  $kind=$r['kind']??'instruction';$visible=$r['visible']??true;if(!in_array($kind,['instruction','note'],true)||!is_bool($visible))staffFail('指示の種類・表示チェックを確認してください。',400);
  $time=dbText($r,'time',5,$kind==='instruction');if(($time!==''||$kind==='instruction')&&!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/D',$time))staffFail('開始時刻を入力してください。',400);
  $highlight=$r['highlight']??($oldRows[$id]['highlight']??false);$animation=$r['animation']??($oldRows[$id]['animation']??'none');if(!is_bool($highlight)||!in_array($animation,['none','pulse','scroll'],true))staffFail('ハイライト・アニメーションの設定を確認してください。',400);
  $normalized[]=array_replace($oldRows[$id]??[],['id'=>$id,'kind'=>$kind,'visible'=>$visible,'highlight'=>$highlight,'animation'=>$animation,'time'=>$time,'target'=>dbText($r,'target',600,$kind==='instruction'),'place'=>dbText($r,'place',300,$kind==='instruction'),'instruction'=>dbText($r,'instruction',12000,true)]);
 }
 $nextSettings=$settings;
 if(isset($in['settings'])){if(!is_array($in['settings']))staffFail('タイトル・背景色を確認してください。',400);$nextSettings=['title'=>dbText($in['settings'],'title',300,true),'background'=>dbText($in['settings'],'background',20,true)];if(!in_array($nextSettings['background'],['gray','blue','green','cream','white','dark'],true))staffFail('背景色を選んでください。',400);}
 $requestId=dbText($in,'requestId',80,true);if(!preg_match('/^[a-zA-Z0-9_-]{16,80}$/D',$requestId))staffFail('編集画面を開き直してください。',400);
 $hash=dbVersion([$normalized,$nextSettings]);$receipt=$day['receipt']??[];
 if(($receipt['id']??'')===$requestId&&($receipt['actor']??'')===$actor['id']){
  if(($receipt['hash']??'')!==$hash)staffFail('前の内容は保存済みです。一覧を確認してから編集し直してください。',409);
  dbReply(['ok'=>true,'duplicate'=>true,'board'=>dbProjection($day,$date,true)]);exit;
 }
 if(!hash_equals(dbVersion([$day,$settings]),dbText($in,'version',64,true)))staffFail('別の画面で更新されています。入力内容を控え、一覧を読み込み直して確認してください。',409);
 if(($day['rows']??[])===$normalized&&$settings===$nextSettings){dbReply(['ok'=>true,'unchanged'=>true,'board'=>dbProjection($day,$date,true)]);exit;}
 $history=$day['history']??[];if($day){$previous=$day;unset($previous['history'],$previous['receipt']);$history[]=$previous;}
 $day=['rows'=>$normalized,'updatedAt'=>date('c'),'updatedBy'=>$actor['name'],'updatedById'=>$actor['id'],'history'=>$history,'receipt'=>['id'=>$requestId,'actor'=>$actor['id'],'hash'=>$hash]];
 $data['days'][$date]=$day;
 if($settings!==$nextSettings)$data['settingsHistory'][]=['settings'=>$settings,'at'=>date('c'),'by'=>$actor['name']];$data['settings']=$nextSettings;$GLOBALS['dbSettings']=$nextSettings;
 if(!safeJsonWriteAtomic($file,$data))staffFail('保存できませんでした。入力内容を残して再度お試しください。',500);
 dbReply(['ok'=>true,'board'=>dbProjection($day,$date,true)]);
}catch(Throwable $e){error_log('[daily_board] '.get_class($e).' at '.basename($e->getFile()).':'.$e->getLine());http_response_code(500);dbReply(['ok'=>false,'error'=>'今日の動きを処理できませんでした。入力内容を残して再度お試しください。']);}
