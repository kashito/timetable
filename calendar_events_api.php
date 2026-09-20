<?php
function ceRespond($value){$json=json_encode($value,JSON_UNESCAPED_UNICODE);if($json===false)throw new RuntimeException('Calendar response encoding failed');echo $json;}
try {
require_once __DIR__.'/calendar_events.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
$method=$_SERVER['REQUEST_METHOD'];$manage=isset($_GET['manage']);$actor=($method!=='GET'||$manage)?staffRequire(true):null;$d=ceData();
if($method==='GET'){
 if(isset($_GET['id'])){$id=ceText($_GET,'id',24,true);$r=$d['events'][$id]??null;if(!$r||(!$manage&&!cePublished($r,$d)))staffFail('お知らせが見つからないか、公開されていません。',404);ceRespond(['ok'=>true,'event'=>ceProjection($r,$d,$manage)]);exit;}
 $studentMode=array_key_exists('student',$_GET)&&!$manage;$studentName=$studentMode?ceText($_GET,'student',300):'';$school=$studentMode?ceStudentSchool($studentName,$d):null;$studentRows=$studentMode?ceStudentRows():[];$directory=$studentMode?readJsonStrict(__DIR__.'/data/directory_state.json'):[];
 $events=[];foreach($d['events'] as $r){if(!$manage&&!cePublished($r,$d))continue;if($studentMode&&!ceStudentMatches($r,$studentName,$school,$studentRows,$directory))continue;$events[]=ceProjection($r,$d,$manage);}
 usort($events,fn($a,$b)=>strcmp($b['startDate'],$a['startDate'])?:strcmp($b['id'],$a['id']));
 $schools=[];foreach($d['schools'] as $r)if($manage||empty($r['archived']))$schools[]=$manage?array_merge(ceSchool($r),['archived'=>!empty($r['archived']),'version'=>ceVersion($r)]):ceSchool($r);
 usort($schools,fn($a,$b)=>strcmp($a['name'],$b['name']));
 ceRespond(['ok'=>true,'schools'=>$studentMode?($school?[$school]:[]):$schools,'events'=>$events,'studentSchool'=>$school]+($manage?['classes'=>ceClasses()]:[]));exit;
}
if($method!=='POST')staffFail('Method not allowed',405);
$in=(strpos($_SERVER['CONTENT_TYPE']??'','multipart/form-data')!==false)?json_decode($_POST['payload']??'',true):json_decode(file_get_contents('php://input'),true);
if(!is_array($in))staffFail('入力内容を確認してください。画像が大きい場合はサイズを小さくして再度お試しください。',400);
$action=ceText($in,'action',40,true);$id=ceText($in,'id',24);$now=date('c');
if($action==='school_save'){
 $name=ceText($in,'name',600,true);$r=$id!==''?($d['schools'][$id]??null):null;if($id!==''&&!$r)staffFail('学校が見つかりません。',404);
 if($r&&!hash_equals(ceVersion($r),ceText($in,'version',64)))staffFail('学校情報が更新されました。開き直して確認してください。',409);
 foreach($d['schools'] as $other)if($other['id']!==$id&&in_array($name,array_merge([$other['name']],$other['aliases']??[]),true))staffFail('その学校名は登録済みです。非表示の学校も確認してください。',409);
 if(!$r){$id=bin2hex(random_bytes(12));$r=['id'=>$id,'aliases'=>[],'createdAt'=>$now];}
 elseif($r['name']!==$name)$r['aliases']=array_values(array_unique(array_merge($r['aliases']??[],[$r['name']])));
 if(!is_bool($in['archived']??null))staffFail('学校の表示状態を確認してください。',400);
 $r=array_replace($r,['name'=>$name,'archived'=>$in['archived'],'updatedAt'=>$now,'updatedBy'=>$actor['name']]);$d['schools'][$id]=$r;
}elseif($action==='event_save'){
 $r=$id!==''?($d['events'][$id]??null):null;if($id!==''&&!$r)staffFail('行事・お知らせが見つかりません。',404);
 if($r&&!hash_equals(ceVersion($r),ceText($in,'version',64)))staffFail('行事・お知らせが更新されました。開き直して確認してください。',409);
 $kind=ceText($in,'kind',10,true);if(!in_array($kind,['school','notice'],true))staffFail('登録の種類を確認してください。',400);
 $schoolId=$kind==='school'?ceText($in,'schoolId',24,true):'';
 if($kind==='school'&&(!isset($d['schools'][$schoolId])||(!empty($d['schools'][$schoolId]['archived'])&&(!$r||$schoolId!==$r['schoolId']))))staffFail('表示中の学校を選択してください。',400);
 $start=ceDate($in['startDate']??null);$end=ceDate($in['endDate']??null);if($end<$start)staffFail('終了日は開始日以降にしてください。',400);
 foreach(['published','archived','removeImage'] as $flag)if(!is_bool($in[$flag]??null))staffFail('公開・非表示・画像の設定を確認してください。',400);
 $category=ceText($in,'category',40);if(!in_array($category,['test','exam','mock','trip','festival','other','closure','announcement'],true))staffFail('行事の種類を確認してください。',400);
 $targets=$in['targetClasses']??($r['targetClasses']??[]);
 if(!is_array($targets)||$targets!==array_values($targets)||count($targets)>200)staffFail('対象クラスを確認してください。',400);
 $allowed=array_merge(ceClasses(),$r['targetClasses']??[]);foreach($targets as $c)if(!is_string($c)||!in_array($c,$allowed,true))staffFail('対象クラスを選び直してください。',400);
 $targets=array_values(array_unique($targets));sort($targets,SORT_STRING);
 $fields=['targetClasses'=>$targets,'kind'=>$kind,'schoolId'=>$schoolId,'title'=>ceText($in,'title',480,true),'startDate'=>$start,'endDate'=>$end,'body'=>ceText($in,'body',30000),'category'=>$category,'published'=>$in['published'],'archived'=>$in['archived']];
 $upload=null;
 if(isset($_FILES['image'])&&$_FILES['image']['error']!==UPLOAD_ERR_NO_FILE){
  $f=$_FILES['image'];if($f['error']!==UPLOAD_ERR_OK)staffFail('画像を送信できませんでした。画像サイズとサーバーの上限を確認してください。',400);
  if($f['size']<=0||$f['size']>5*1024*1024)staffFail('画像は5MB以下にしてください。',400);
  $meta=@getimagesize($f['tmp_name']);$mime=$meta['mime']??'';
  if(!$meta||!in_array($mime,['image/jpeg','image/png','image/webp'],true)||$meta[0]*$meta[1]>30000000||max($meta[0],$meta[1])>10000)staffFail('JPEG・PNG・WebPの画像を選んでください（3,000万画素以下）。',400);
  $bytes=@file_get_contents($f['tmp_name']);if($bytes===false)staffFail('画像を読み込めません。',500);
  $upload=['mime'=>$mime,'base64'=>base64_encode($bytes),'hash'=>hash('sha256',$bytes)];
 }
 $hash=ceVersion([$fields,$in['removeImage'],$upload['hash']??'']);
 if(!$r){$requestId=ceText($in,'requestId',80,true);if(!preg_match('/^[a-zA-Z0-9_-]{16,80}$/',$requestId))staffFail('画面を開き直してください。',400);
  foreach($d['events'] as $previous)if(($previous['requestId']??'')===$requestId&&($previous['authorId']??'')===$actor['id']){if(($previous['requestHash']??'')!==$hash)staffFail('前の投稿は保存済みです。一覧で確認してください。入力は残しています。',409);ceRespond(['ok'=>true,'event'=>ceProjection($previous,$d,true),'duplicate'=>true]);exit;}
  $id=bin2hex(random_bytes(12));$r=['id'=>$id,'createdAt'=>$now,'authorId'=>$actor['id'],'requestId'=>$requestId,'requestHash'=>$hash];
 }
 $r=array_replace($r,$fields,['updatedAt'=>$now,'updatedBy'=>$actor['name']]);if($in['removeImage'])unset($r['image']);
 if($upload){$imageId=bin2hex(random_bytes(12));$dir=__DIR__.'/data/calendar_images';if(!is_dir($dir)&&!@mkdir($dir,0775,true)&&!is_dir($dir))staffFail('画像の保存先を作れません。',500);
  if(!safeJsonWriteAtomic($dir.'/'.$imageId.'.php',$upload))staffFail('画像を保存できません。',500);
  $r['image']=['id'=>$imageId,'name'=>preg_replace('/[\x00-\x1f\x7f]/u','',basename($_FILES['image']['name']))];
 }
 $d['events'][$id]=$r;
}else staffFail('不明な操作です。',400);
if(!safeJsonWriteAtomic(__DIR__.'/data/calendar_events.php',$d))staffFail('保存できませんでした。入力内容を残しています。',500);
ceRespond(['ok'=>true]+($action==='event_save'?['event'=>ceProjection($r,$d,true)]:['school'=>array_merge(ceSchool($r),['archived'=>$r['archived'],'version'=>ceVersion($r)])]));

}catch(Throwable $e){error_log('[calendar_events_api] '.get_class($e).' at '.basename($e->getFile()).':'.$e->getLine());http_response_code(500);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');ceRespond(['ok'=>false,'error'=>'学校・お知らせの処理を完了できませんでした。入力内容を控えて一覧を再読み込みし、保存されているか確認してください。（CE_SERVER）']);}
