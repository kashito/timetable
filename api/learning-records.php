<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(array $data,int $code=200): void {http_response_code($code);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST')respond(['ok'=>false,'error'=>'POSTが必要です。'],405);
$origin=$_SERVER['HTTP_ORIGIN']??'';
if($origin!==''){$host=parse_url($origin,PHP_URL_HOST);$actual=preg_replace('/:\d+$/','',$_SERVER['HTTP_HOST']??'');if(!$host||strcasecmp($host,$actual)!==0)respond(['ok'=>false,'error'=>'送信元を確認してください。'],403);}
$key=$_SERVER['HTTP_X_LEARNING_KEY']??'';

if((int)($_SERVER['CONTENT_LENGTH']??0)>2000000)respond(['ok'=>false,'error'=>'送信内容が大きすぎます。'],413);
$raw=file_get_contents('php://input',false,null,0,2000001);
if($raw===false||strlen($raw)>2000000)respond(['ok'=>false,'error'=>'送信内容が大きすぎます。'],413);
$body=json_decode($raw,true);$input=$body['records']??null;
if(!is_array($input)||count($input)<1||count($input)>20)respond(['ok'=>false,'error'=>'記録の形式を確認してください。'],400);
$member=null;$requestedMember=null;foreach($input as $r){if(!is_array($r))respond(['ok'=>false,'error'=>'記録の形式を確認してください。'],400);$id=$r['memberId']??null;if($id!==null){if(!is_string($id)||!preg_match('/^m[a-f0-9]{32}$/D',$id)||($requestedMember!==null&&$requestedMember!==$id))respond(['ok'=>false,'error'=>'ユーザー情報を確認してください。'],401);$requestedMember=$id;}elseif(($r['participantType']??'')==='member')respond(['ok'=>false,'error'=>'ユーザー情報がありません。'],401);}
if($requestedMember!==null){define('HISTORY_MEMBER_API_V58',true);require_once __DIR__.'/member-store-v58.php';require_once __DIR__.'/groups-store-v58.php';hm58_check_post();$member=hm58_current();if(!$member||$member['id']!==$requestedMember)respond(['ok'=>false,'error'=>'記録したユーザーでログインしてください。'],401);foreach($input as $r)if(($r['memberId']??null)!==$member['id']||($r['profileId']??null)!==$member['id'])respond(['ok'=>false,'error'=>'ユーザーの異なる記録は一緒に送れません。'],401);}
elseif(!is_string($key)||!preg_match('/^[a-f0-9]{64}$/D',$key))respond(['ok'=>false,'error'=>'記録用の識別情報がありません。'],401);
$records=[];
foreach($input as $r){
 if(!is_array($r)||($r['schemaVersion']??null)!==1||!is_string($r['id']??null)||!is_string($r['profileId']??null)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$r['id']??'')||!preg_match('/^[a-zA-Z0-9-]{16,80}$/D',$r['profileId']??''))respond(['ok'=>false,'error'=>'識別情報が正しくありません。'],400);
 $cardsMode=($r['answerMode']??'')==='cards';$cardContent=$cardsMode||(($r['answerMode']??'')==='handwriting'&&isset($r['cardWork']));
 foreach(['profileLabel'=>150,'questionId'=>250,'instanceQuestionId'=>250,'questionFingerprint'=>1000,'bankRevision'=>1024,'softwareRelease'=>40,'subject'=>40,'genre'=>80,'region'=>80,'climateZone'=>100,'prompt'=>15000,'answerText'=>$cardContent?120000:5000,'startedAt'=>40,'answeredAt'=>40,'updatedAt'=>40,'difficulty'=>40,'priority'=>80] as $field=>$limit)if(!is_string($r[$field]??null)||strlen($r[$field])>$limit)respond(['ok'=>false,'error'=>'記録項目を確認してください。'],400);
 $judgment=$r['judgment']??(is_bool($r['right']??null)?($r['right']?'correct':'incorrect'):null);
 $validRight=($judgment==='uncertain'&&array_key_exists('right',$r)&&$r['right']===null&&($r['reason']??'')==='answer'&&($r['answerMode']??'')==='handwriting'&&($r['gradingSource']??'')==='self')||($judgment==='correct'&&($r['right']??null)===true)||($judgment==='incorrect'&&($r['right']??null)===false);
 if(!in_array($r['answerMode']??'', ['choice','voice_choices','voice_hidden','handwriting','cards'],true)||!in_array($r['gradingSource']??'', ['self','automatic','manual-correction'],true)||!in_array($r['reason']??'', ['answer','skip','reveal'],true)||!in_array($r['stage']??'', ['map','name'],true)||!$validRight)respond(['ok'=>false,'error'=>'判定を確認してください。'],400);
 foreach(['elapsedMs','wallElapsedMs','revision'] as $field)if(!is_int($r[$field]??null)||$r[$field]<0||$r[$field]>315360000000)respond(['ok'=>false,'error'=>'時間・版を確認してください。'],400);
 foreach(['startedAt','answeredAt','updatedAt'] as $field)if(strtotime($r[$field])===false)respond(['ok'=>false,'error'=>'日時を確認してください。'],400);
 foreach(['options','correctAnswers','selectedIndices'] as $field)if(!is_array($r[$field]??null)||count($r[$field])>1000)respond(['ok'=>false,'error'=>'解答内容を確認してください。'],400);
 foreach(array_merge($r['options'],$r['correctAnswers']) as $v)if(!is_string($v)||strlen($v)>($cardContent?8000:3000))respond(['ok'=>false,'error'=>'選択肢を確認してください。'],400);
 foreach($r['selectedIndices'] as $v)if(!is_int($v)||$v<0||$v>=count($r['options']))respond(['ok'=>false,'error'=>'選択番号を確認してください。'],400);
 $handwriting=$r['handwriting']??null;
 if($handwriting!==null){
  if(!is_array($handwriting)||!is_array($handwriting['strokes']??null)||count($handwriting['strokes'])>15000)respond(['ok'=>false,'error'=>'筆記データを確認してください。'],400);
  $count=0;foreach($handwriting['strokes'] as $stroke){if(!is_array($stroke))respond(['ok'=>false,'error'=>'筆記データを確認してください。'],400);foreach($stroke as $point){if(++$count>15000||!is_array($point)||count($point)!==2)respond(['ok'=>false,'error'=>'筆記データが大きすぎます。'],400);foreach($point as $v)if(!is_numeric($v)||!is_finite((float)$v)||$v<0||$v>1)respond(['ok'=>false,'error'=>'筆記座標を確認してください。'],400);}}
  $strokeWidths=$handwriting['strokeWidths']??array_fill(0,count($handwriting['strokes']),2.7);
  if(!is_array($strokeWidths)||count($strokeWidths)!==count($handwriting['strokes']))respond(['ok'=>false,'error'=>'筆記の太さを確認してください。'],400);
  foreach($strokeWidths as $width)if(!is_numeric($width)||!is_finite((float)$width)||$width<1||$width>12)respond(['ok'=>false,'error'=>'筆記の太さを確認してください。'],400);
  $aspectRatio=$handwriting['aspectRatio']??(10/3);if(!is_numeric($aspectRatio)||!is_finite((float)$aspectRatio)||$aspectRatio<.5||$aspectRatio>10)respond(['ok'=>false,'error'=>'筆記欄の形を確認してください。'],400);
  $handwriting=['aspectRatio'=>(float)$aspectRatio,'strokeWidths'=>$strokeWidths,'strokes'=>$handwriting['strokes'],'submitted'=>($handwriting['submitted']??false)===true,'right'=>$r['right'],'judgment'=>$judgment];
 }
 $cardWork=null;$work=$r['cardWork']??null;
 if($cardsMode||$work!==null){
  if((!$cardsMode&&($r['answerMode']??'')!=='handwriting')||!is_array($work)||strlen(json_encode($work,JSON_UNESCAPED_UNICODE))>200000||($work['version']??null)!==1||!in_array($work['kind']??'', ['sentence','spelling','order','japanese','fill'],true)||!in_array($work['answerZone']??'', ['answer','think1','think2','think3','think4'],true))respond(['ok'=>false,'error'=>'カードの記録形式を確認してください。'],400);
  if(!in_array($work['timerMode']??'', ['none','stopwatch','countdown'],true)||!is_int($work['timerSeconds']??null)||$work['timerSeconds']<10||$work['timerSeconds']>7200||!is_bool($work['timedOut']??null)||!is_int($work['elapsedMs']??null)||$work['elapsedMs']!==$r['elapsedMs'])respond(['ok'=>false,'error'=>'カードの計測時間を確認してください。'],400);
  if(!is_array($work['zones']??null)||(array_values($work['zones'])!==$work['zones'])||count($work['zones'])<2||count($work['zones'])>18)respond(['ok'=>false,'error'=>'解答エリアを確認してください。'],400);
  $zones=[];$ids=[];$total=0;foreach($work['zones'] as $z){
   if(!is_array($z)||!is_string($z['id']??null)||!preg_match('/^(?:pool|answer|slot(?:[0-9]|1[01])|think[1-4])$/D',$z['id'])||in_array($z['id'],$ids,true)||!is_string($z['label']??null)||strlen($z['label'])>160||!is_array($z['cards']??null)||(array_values($z['cards'])!==$z['cards']))respond(['ok'=>false,'error'=>'エリアの内容を確認してください。'],400);
   $ids[]=$z['id'];$cards=[];foreach($z['cards'] as $c){
    if(++$total>240||!is_array($c)||!is_string($c['text']??null)||strlen($c['text'])>480||!is_string($c['origin']??null)||strlen($c['origin'])>600||!array_key_exists('group',$c)||($c['group']!==null&&(!is_string($c['group'])||!preg_match('/^[A-Za-z0-9-]{8,100}$/D',$c['group']))))respond(['ok'=>false,'error'=>'カードの内容を確認してください。'],400);
    $cards[]=['text'=>$c['text'],'origin'=>$c['origin'],'group'=>$c['group']];
   }
   $zone=['id'=>$z['id'],'label'=>$z['label'],'cards'=>$cards];
   if(isset($z['rows'])){if($z['id']==='pool'||!is_array($z['rows'])||(array_values($z['rows'])!==$z['rows'])||count($z['rows'])<1||count($z['rows'])>500)respond(['ok'=>false,'error'=>'改行の内容を確認してください。'],400);$rows=[];$at=0;$previousDepth=0;foreach($z['rows'] as $i=>$row){if(!is_array($row)||!is_int($row['at']??null)||$row['at']<$at||$row['at']>count($cards)||($i===0&&$row['at']!==0)||!is_string($row['note']??null)||strlen($row['note'])>480||preg_match('/[\x00-\x1f]/',$row['note']))respond(['ok'=>false,'error'=>'改行や行メモを確認してください。'],400);$depth=array_key_exists('depth',$row)?$row['depth']:0;if(!is_int($depth)||$depth<0||$depth>8||($i===0&&$depth!==0)||$depth>$previousDepth+1)respond(['ok'=>false,'error'=>'行の階層を確認してください。'],400);$at=$row['at'];$previousDepth=$depth;$cleanRow=['at'=>$at,'note'=>$row['note']];if($depth>0)$cleanRow['depth']=$depth;
    if(array_key_exists('memo',$row)){if(!is_string($row['memo'])||strlen($row['memo'])>2000||preg_match_all('/./us',$row['memo'])+preg_match_all('/[\x{10000}-\x{10FFFF}]/u',$row['memo'])>500||preg_match('/[\x00-\x1f]/',$row['memo']))respond(['ok'=>false,'error'=>'日本語メモを確認してください。'],400);if($row['memo']!=='')$cleanRow['memo']=$row['memo'];}
    if(array_key_exists('cardsVisible',$row)){if(!is_bool($row['cardsVisible']))respond(['ok'=>false,'error'=>'カードの表示を確認してください。'],400);if(!$row['cardsVisible'])$cleanRow['cardsVisible']=false;}
    $rows[]=$cleanRow;}$zone['rows']=$rows;}
   $zones[]=$zone;
  }
  foreach(['pool',($work['kind']==='fill'?'slot0':'answer')] as $required)if(!in_array($required,$ids,true))respond(['ok'=>false,'error'=>'必要なエリアがありません。'],400);
  if($work['answerZone']!=='answer'&&!in_array($work['answerZone'],$ids,true))respond(['ok'=>false,'error'=>'採点する案がありません。'],400);
  if($work['timedOut']&&($work['timerMode']!=='countdown'||$work['elapsedMs']<$work['timerSeconds']*1000))respond(['ok'=>false,'error'=>'時間切れの記録を確認してください。'],400);
  $cardWork=['version'=>1,'kind'=>$work['kind'],'answerZone'=>$work['answerZone'],'timerMode'=>$work['timerMode'],'timerSeconds'=>$work['timerSeconds'],'elapsedMs'=>$work['elapsedMs'],'timedOut'=>$work['timedOut'],'zones'=>$zones];
 }
 if(!in_array($r['studyMode']??'training',['training','test'],true))respond(['ok'=>false,'error'=>'学習モードを確認してください。'],400);
 foreach(['grade'=>160,'unit'=>400] as $field=>$limit)if(isset($r[$field])&&(!is_string($r[$field])||strlen($r[$field])>$limit))respond(['ok'=>false,'error'=>'学年・単元を確認してください。'],400);
 if(isset($r['answerFormat'])&&!in_array($r['answerFormat'],['single','sequence','unordered'],true))respond(['ok'=>false,'error'=>'解答形式を確認してください。'],400);
 if(isset($r['questionRevision'])&&(!is_int($r['questionRevision'])||$r['questionRevision']<1||$r['questionRevision']>1000000))respond(['ok'=>false,'error'=>'問題の版を確認してください。'],400);
 if(isset($r['tags'])&&(!is_array($r['tags'])||(array_values($r['tags'])!==$r['tags'])||count($r['tags'])>20))respond(['ok'=>false,'error'=>'分類を確認してください。'],400);foreach($r['tags']??[] as $tag)if(!is_string($tag)||!trim($tag)||strlen($tag)>160||preg_match('/[\x00-\x1f]/',$tag))respond(['ok'=>false,'error'=>'分類を確認してください。'],400);
 if(array_key_exists('fixedSetId',$r)){
  if(!is_string($r['fixedSetId'])||!preg_match('/^[a-f0-9]{32}$/D',$r['fixedSetId']))respond(['ok'=>false,'error'=>'固定テストのIDを確認してください。'],400);
  foreach(['fixedSetTitle'=>400,'fixedPaperId'=>100] as $field=>$limit)if(isset($r[$field])&&(!is_string($r[$field])||strlen($r[$field])>$limit||preg_match('/[\x00-\x1f]/',$r[$field])))respond(['ok'=>false,'error'=>'固定テストの情報を確認してください。'],400);
 }
 if(array_key_exists('variation',$r)){
  $v=$r['variation'];if(!is_array($v))respond(['ok'=>false,'error'=>'バリエーションの記録を確認してください。'],400);
  foreach(['baseQuestionId'=>250,'formKey'=>70,'wordKey'=>70,'group'=>30,'label'=>720] as $k=>$limit)if(!is_string($v[$k]??null)||strlen($v[$k])>$limit)respond(['ok'=>false,'error'=>'バリエーションの記録を確認してください。'],400);
  if(!in_array($v['group'],['base','statement','negative','question','wh','modal','words'],true))respond(['ok'=>false,'error'=>'文型の記録を確認してください。'],400);
  $r['variation']=array_intersect_key($v,array_flip(['baseQuestionId','formKey','wordKey','group','label']));
 }
 $allowed=['variation','fixedSetId','fixedSetTitle','fixedPaperId','tags','answerFormat','grade','unit','questionRevision','schemaVersion','id','profileId','profileLabel','questionId','instanceQuestionId','questionFingerprint','bankRevision','softwareRelease','subject','genre','region','climateZone','stage','prompt','options','correctAnswers','startedAt','answeredAt','elapsedMs','wallElapsedMs','answerMode','gradingSource','right','reason','difficulty','priority','selectedIndices','answerText','revision','updatedAt'];
 $record=array_intersect_key($r,array_flip($allowed));$record['judgment']=$judgment;$record['studyMode']=in_array($r['studyMode']??'training',['training','test'],true)?($r['studyMode']??'training'):'training';$record['participantType']=$member?'member':'visitor';$record['memberId']=$member?$member['id']:null;if($member){$record['profileLabel']=$member['displayName'];$record['organizationIds']=hg58_for_record($member['id'],$record['startedAt']);}$record['surveyVersion']=null;$record['surveyResponses']=null;$record['handwriting']=$handwriting;$record['hintUsed']=($r['hintUsed']??false)===true;$record['mapNumbersVisible']=($r['mapNumbersVisible']??true)===true;
 if($cardWork!==null)$record['cardWork']=$cardWork;
 $records[]=$record;
}
// The random browser credential scopes writes; it is never stored or returned.
// PHP-guarded files remain unreadable through a normal web request, even on
// installations where .htaccess is not supported. Existing ranking data is separate.
$dir=$member?hm58_records_dir($member['id']):__DIR__.'/data/learning-v53/'.hash('sha256',$key);
if(!is_dir($dir)&&!@mkdir($dir,0750,true)&&!is_dir($dir))respond(['ok'=>false,'error'=>'記録フォルダに書き込めません。'],503);
$lock=@fopen($dir.'/write-lock.php','c+');if(!$lock||!flock($lock,LOCK_EX))respond(['ok'=>false,'error'=>'保存待ちです。再送してください。'],503);
define('HISTORY_CARD_STATS_V61',true);require_once __DIR__.'/card-stats-store-v61.php';
function index_card61(array $row,string $scope): void {try{hc61_add($row,$scope);}catch(Throwable $e){respond(['ok'=>false,'error'=>'解答は保存しました。集計の再送を待っています。'],503);}}
$scope=$member?'member:'.$member['id']:'visitor:'.hash('sha256',$key);
$prefix="<?php http_response_code(404); exit; ?>\n";$accepted=[];
foreach($records as $record){
 $file=$dir.'/'.$record['id'].'.php';
 if(is_file($file)){$existing=file_get_contents($file);$old=json_decode(substr($existing,strlen($prefix)),true);if(!is_array($old))respond(['ok'=>false,'error'=>'既存の記録を確認してください。'],503);if($old['profileId']!==$record['profileId']||$old['questionId']!==$record['questionId'])respond(['ok'=>false,'error'=>'記録IDが重複しています。'],409);if($member)$record['organizationIds']=$old['organizationIds']??[];if($old['revision']>=$record['revision']){index_card61($old,$scope);$accepted[]=$record['id'];continue;}}
 $record['receivedAt']=gmdate('c');$json=json_encode($record,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
 $temp=$dir.'/pending-'.bin2hex(random_bytes(8)).'.php';if(file_put_contents($temp,$prefix.$json)===false||!rename($temp,$file)){@unlink($temp);respond(['ok'=>false,'error'=>'記録を保存できません。'],503);}@chmod($file,0640);index_card61($record,$scope);$accepted[]=$record['id'];
}
flock($lock,LOCK_UN);fclose($lock);respond(['ok'=>true,'accepted'=>$accepted]);
