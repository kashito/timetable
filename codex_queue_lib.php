<?php
// Phase one: a separate queue. Existing memo/lesson/account files are never written.
if(realpath($_SERVER['SCRIPT_FILENAME']??'')===__FILE__){http_response_code(404);exit;}
require_once __DIR__.'/data_safety.php';
function cqFail($message,$code=400){throw new RuntimeException($message,$code);}
function cqNow(){return date('c');}
function cqId($id){if(!is_string($id)||!preg_match('/^[a-f0-9]{24}$/D',$id))cqFail('対象が見つかりません。',404);return $id;}
function cqText($value,$max=12000){if(!is_string($value)||strlen($value)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$value))cqFail('入力形式を確認してください。');return trim($value);}
function cqLabels(){return ['unprocessed'=>'未処理','queued'=>'処理待ち','running'=>'Codex処理中','fixed'=>'修正済み','testing'=>'テスト中','tested'=>'修正・テスト完了（未反映）','deploying'=>'本番反映中','deployed'=>'本番反映済み','review'=>'要確認','failed'=>'失敗','hold'=>'保留'];}
function cqLoad(){
 $file=__DIR__.'/data/codex_queue.php';if(!file_exists($file))return ['schema'=>1,'jobs'=>[]];
 if(is_link($file))cqFail('キューの保存先を確認してください。',500);
 $raw=@file_get_contents($file);if($raw===false||substr($raw,0,14)!=='<?php exit; ?>')cqFail('キューを読み込めません。',500);
 $data=json_decode(trim(substr($raw,14)),true);
 if(($data['schema']??null)!==1||!is_array($data['jobs']??null))cqFail('キューの形式を確認してください。既存データは変更していません。',500);
 return $data;
}
function cqSave($data){if(!safeJsonWriteAtomic(__DIR__.'/data/codex_queue.php',$data))cqFail('キューを保存できませんでした。',500);}
function cqMemos(){
 $data=readJsonStrict(__DIR__.'/data/codex_memos.php',['schema'=>1,'items'=>[]]);
 if(($data['schema']??null)!==1||!is_array($data['items']??null))cqFail('メモの形式を確認してください。',500);
 return $data['items'];
}
function cqMemoVersion($memo){
 unset($memo['requestId'],$memo['requestHash']);
 $memo['updates']=array_map(function($u){unset($u['requestId'],$u['requestHash']);return $u;},$memo['updates']??[]);
 return hash('sha256',json_encode($memo,JSON_UNESCAPED_UNICODE));
}
function cqSnapshot($memo){
 $keys=['id','kind','text','pageTitle','pagePath','context','images','createdAt','createdBy','updates'];
 $out=array_intersect_key($memo,array_flip($keys));$out['referenceCode']='CM-'.$memo['id'];
 $out['updates']=array_map(function($u){return array_intersect_key($u,array_flip(['id','text','pageTitle','pagePath','context','images','createdAt','createdBy']));},$memo['updates']??[]);
 return $out;
}
function cqFingerprint($memo){return hash('sha256',json_encode(cqSnapshot($memo),JSON_UNESCAPED_UNICODE));}
function cqPublic($job){unset($job['leaseHash'],$job['snapshot']);$job['version']=hash('sha256',json_encode($job,JSON_UNESCAPED_UNICODE));return $job;}
function cqSetStatus(&$job,$status,$by,$message=''){
 if(!isset(cqLabels()[$status]))cqFail('状態を確認してください。');
 $now=cqNow();$job['status']=$status;$job['statusChangedAt']=$now;$job['updatedAt']=$now;
 $job['history'][]=['status'=>$status,'at'=>$now,'by'=>$by,'message'=>$message];
}
function cqExpire(&$data){
 $changed=false;
 foreach($data['jobs'] as &$job)if(in_array($job['status'],['running','fixed','testing'],true)&&strtotime($job['leaseUntil']??'')<time()){
  $job['error']='処理プログラムからの応答が途絶えました。候補と実行記録を確認してから再実行してください。';
  $job['finishedAt']=cqNow();unset($job['leaseHash']);cqSetStatus($job,'review','システム',$job['error']);$changed=true;
 }
 return $changed;
}
function cqSummaryForMemo($id){
 static $cache=null;if($cache===null)$cache=cqLoad();$found=null;
 foreach($cache['jobs'] as $job)if($job['memoId']===$id)$found=$job;
 return $found?array_intersect_key(cqPublic($found),array_flip(['id','status','level','updatedAt','answer','error'])):null;
}
function cqResponses($id){
 static $cache=null;if($cache===null)$cache=cqLoad();$out=[];
 foreach($cache['jobs'] as $job)if($job['memoId']===$id&&!empty($job['finishedAt'])){
  $text=($job['answer']??'')."\n状態：".(cqLabels()[$job['status']]??$job['status']);
  if(!empty($job['changedFiles']))$text.="\n変更ファイル：".implode('、',$job['changedFiles']);
  foreach($job['tests']??[] as $test)$text.="\n".$test['name'].'：'.($test['passed']?'成功':'失敗');
  if(!empty($job['error']))$text.="\n".$job['error'];
  $text.="\n第1段階のためcommit・push・本番反映はしていません。修正キューの詳細で結果を確認してください。";
  $out[]=['id'=>'queue-'.$job['id'],'release'=>'修正キュー 第1段階','kind'=>'Codex処理結果','by'=>'Codex','at'=>$job['finishedAt'],'text'=>$text];
 }
 return $out;
}
function cqNewJob($memo,$actor){
 $now=cqNow();$id=bin2hex(random_bytes(12));
 return ['id'=>$id,'memoId'=>$memo['id'],'referenceCode'=>'CM-'.$memo['id'],'pageTitle'=>$memo['pageTitle'],'pagePath'=>$memo['pagePath'],
  'requestText'=>$memo['text'],'memoCreatedAt'=>$memo['createdAt'],'createdAt'=>$now,'createdBy'=>$actor['name'],'createdById'=>$actor['id'],
  'snapshot'=>cqSnapshot($memo),'memoFingerprint'=>cqFingerprint($memo),'status'=>'queued','level'=>null,'levelReason'=>'',
  'statusChangedAt'=>$now,'updatedAt'=>$now,'startedAt'=>null,'finishedAt'=>null,'leaseUntil'=>null,'worker'=>null,
  'changedFiles'=>[],'tests'=>[],'commitSha'=>null,'actionsRunId'=>null,'deploymentResult'=>'not_requested',
  'answer'=>'','error'=>'','candidateId'=>null,'baseCommit'=>null,'patchSha256'=>null,'completedAt'=>null,'history'=>[
   ['status'=>'queued','at'=>$now,'by'=>$actor['name'],'message'=>'Codexへ送信。第1段階のため本番反映はしません。']]];
}
function cqAdmin($action,$input,$actor){
 $data=cqLoad();$memos=cqMemos();
 if($action==='list'){
  $items=array_map('cqPublic',array_values($data['jobs']));
  return ['ok'=>true,'phase'=>1,'autoPush'=>false,'labels'=>cqLabels(),'items'=>$items];
 }
 if(cqExpire($data))cqSave($data);
 if($action==='enqueue'||$action==='retry'){
  $id=cqId($input['memoId']??'');$memo=$memos[$id]??null;if(!$memo)cqFail('メモが見つかりません。',404);
  if(!empty($memo['doneAt']))cqFail('対応完了のメモです。必要なら未対応に戻してから送信してください。',409);
  if(!hash_equals(cqMemoVersion($memo),cqText($input['memoVersion']??'',64)))cqFail('メモが更新されました。再読み込みして内容を確認してください。',409);
  $same=null;
  foreach($data['jobs'] as $job)if($job['memoId']===$id){
   if(in_array($job['status'],['queued','running','fixed','testing'],true))return ['ok'=>true,'duplicate'=>true,'item'=>cqPublic($job)];
   if($job['memoFingerprint']===cqFingerprint($memo))$same=$job;
  }
  if($same&&$action==='enqueue')return ['ok'=>true,'duplicate'=>true,'item'=>cqPublic($same)];
  $job=cqNewJob($memo,$actor);$data['jobs'][$job['id']]=$job;cqSave($data);return ['ok'=>true,'item'=>cqPublic($job)];
 }
 if(in_array($action,['approve','deploy'],true))cqFail('第1段階では本番反映できません。修正候補を確認して手動で取り込んでください。',409);
 $id=cqId($input['id']??'');if(!isset($data['jobs'][$id]))cqFail('キューが見つかりません。',404);$job=&$data['jobs'][$id];
 if(!hash_equals(cqPublic($job)['version'],cqText($input['version']??'',64)))cqFail('処理状況が更新されました。再読み込みしてください。',409);
 if($action==='hold'||$action==='stop'){
  if(in_array($job['status'],['tested','failed','review','deployed'],true))cqFail('完了した処理は停止できません。',409);
  unset($job['leaseHash']);$job['leaseUntil']=null;cqSetStatus($job,'hold',$actor['name'],$action==='stop'?'停止を要求しました。':'管理者が保留しました。');
 }elseif($action==='complete'){
  if(!in_array($job['status'],['tested','review','failed','hold'],true))cqFail('処理中は確認済みにできません。',409);
  $job['completedAt']=cqNow();$job['completedBy']=$actor['name'];$job['updatedAt']=cqNow();
  $job['history'][]=['status'=>$job['status'],'at'=>cqNow(),'by'=>$actor['name'],'message'=>'処理結果を確認済みにしました。本番反映済みへの変更ではありません。'];
 }else cqFail('操作を確認してください。');
 cqSave($data);return ['ok'=>true,'item'=>cqPublic($job)];
}
function cqWorkerJob(&$data,$input){
 $id=cqId($input['id']??'');if(!isset($data['jobs'][$id]))cqFail('キューが見つかりません。',404);
 $job=$data['jobs'][$id];$token=cqText($input['token']??'',64);
 if(!isset($job['leaseHash'])||!hash_equals($job['leaseHash'],hash('sha256',$token)))cqFail('処理権限が失効しました。',409);
 if(strtotime($job['leaseUntil']??'')<time())cqFail('処理期限が切れました。',409);
 $memos=cqMemos();$memo=$memos[$job['memoId']]??null;
 if(!$memo||!empty($memo['doneAt'])||!hash_equals($job['memoFingerprint'],cqFingerprint($memo))){
  $job['error']='処理中に元のメモが変更されました。候補を自動採用せず停止しました。';$job['finishedAt']=cqNow();unset($job['leaseHash']);
  cqSetStatus($job,'review','システム',$job['error']);$data['jobs'][$id]=$job;cqSave($data);cqFail($job['error'],409);
 }
 return $id;
}
function cqWorker($action,$input){
 $data=cqLoad();if(cqExpire($data))cqSave($data);
 if($action==='claim'){
  foreach($data['jobs'] as $job)if(in_array($job['status'],['running','fixed','testing'],true))return ['ok'=>true,'job'=>null,'busy'=>true];
  foreach($data['jobs'] as $id=>$job)if($job['status']==='queued'){
   $memos=cqMemos();$memo=$memos[$job['memoId']]??null;
   if(!$memo||!empty($memo['doneAt'])||!hash_equals($job['memoFingerprint'],cqFingerprint($memo))){$job['error']='送信後にメモが変更されました。内容を確認して再送信してください。';$job['finishedAt']=cqNow();cqSetStatus($job,'review','システム',$job['error']);$data['jobs'][$id]=$job;cqSave($data);continue;}
   $token=bin2hex(random_bytes(32));$job['leaseHash']=hash('sha256',$token);$job['leaseUntil']=date('c',time()+120);
   $job['startedAt']=cqNow();$job['worker']=cqText($input['worker']??'local',100);cqSetStatus($job,'running','Codex');
   $data['jobs'][$id]=$job;cqSave($data);$public=cqPublic($job);$public['snapshot']=$job['snapshot'];$public['token']=$token;
   require_once __DIR__.'/codex_memo_responses.php';$public['previousResponses']=array_merge(cmResponses($job['memoId']),cqResponses($job['memoId']));
   return ['ok'=>true,'job'=>$public];
  }
  return ['ok'=>true,'job'=>null];
 }
 $id=cqWorkerJob($data,$input);$job=&$data['jobs'][$id];
 if($action==='heartbeat'){
  if(!in_array($job['status'],['running','fixed','testing'],true))cqFail('処理は終了しています。',409);
  $job['leaseUntil']=date('c',time()+120);cqSave($data);return ['ok'=>true,'status'=>$job['status']];
 }
 if($action==='image'){
  $imageId=cqId($input['imageId']??'');$images=$job['snapshot']['images']??[];
  foreach($job['snapshot']['updates']??[] as $u)$images=array_merge($images,$u['images']??[]);$found=null;
  foreach($images as $image)if(($image['id']??'')===$imageId)$found=$image;
  if(!$found)cqFail('この依頼の添付画像ではありません。',404);
  $path=__DIR__.'/data/codex_memo_images/'.$imageId.'.php';if(is_link($path))cqFail('画像の保存形式を確認してください。',500);
  $raw=@file_get_contents($path);$prefix="<?php exit; ?>\n";$body=substr((string)$raw,strlen($prefix));
  $info=@getimagesizefromstring($body);$types=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp','image/gif'=>'gif'];
  if($raw===false||substr($raw,0,strlen($prefix))!==$prefix||strlen($body)!==($found['size']??0)||strlen($body)>2*1024*1024||!$info||!isset($types[$info['mime']]))cqFail('画像を読み込めません。',500);
  return ['ok'=>true,'id'=>$imageId,'ext'=>$types[$info['mime']],'sha256'=>hash('sha256',$body),'base64'=>base64_encode($body)];
 }
 if($action==='progress'){
  $next=$input['status']??'';$allowed=['running'=>['fixed'],'fixed'=>['testing'],'testing'=>[]];
  if(!in_array($next,$allowed[$job['status']]??[],true))cqFail('処理の順序を確認してください。',409);
  $level=$input['level']??null;if(!in_array($level,[1,2,3],true))cqFail('処理レベルを確認してください。');
  if($level===3)cqFail('LEVEL 3は改修できません。',409);
  if(isset($job['level'])&&$level<$job['level'])cqFail('処理レベルを下げることはできません。',409);
  $job['level']=$level;$job['levelReason']=cqText($input['levelReason']??'',3000);cqSetStatus($job,$next,'Codex');cqSave($data);
  return ['ok'=>true,'item'=>cqPublic($job)];
 }
 if($action==='result'){
  $result=$input['result']??null;if(!is_array($result))cqFail('結果の形式を確認してください。');
  $status=$result['status']??'';$level=$result['level']??null;
  if(!in_array($status,['tested','review','failed'],true)||!in_array($level,[1,2,3],true))cqFail('結果の状態を確認してください。');
  if(($result['commitSha']??null)!==null||($result['actionsRunId']??null)!==null||($result['deploymentResult']??'not_requested')!=='not_requested')cqFail('第1段階では本番反映結果を登録できません。');
  if($level===3&&$status!=='review')cqFail('LEVEL 3は要確認で停止してください。');
  if(isset($job['level'])&&$level<$job['level'])cqFail('処理レベルを下げることはできません。');
  $tests=$result['tests']??[];if(!is_array($tests)||count($tests)>100)cqFail('テスト結果を確認してください。');
  foreach($tests as $t)if(!is_array($t)||!is_bool($t['passed']??null)||!is_string($t['name']??null)||strlen($t['name'])>300||!is_string($t['detail']??'')||strlen($t['detail']??'')>1500)cqFail('テスト結果の形式を確認してください。');
  $files=$result['changedFiles']??[];if(!is_array($files)||count($files)>=100)cqFail('変更ファイル数を確認してください。');
  if($level===3&&$files)cqFail('LEVEL 3の改修結果は登録できません。');
  foreach($files as $p)if(!is_string($p)||strlen($p)>300||preg_match('~(?:^|/)(?:\.\.|data|\.git|\.deploy|\.github)(?:/|$)|[\\\\\x00-\x1f]~',$p)||substr($p,0,1)==='/')cqFail('保護された変更ファイルを結果へ登録できません。');
  $digest=hash('sha256',json_encode($result,JSON_UNESCAPED_UNICODE));
  if(isset($job['resultDigest'])){if(hash_equals($job['resultDigest'],$digest))return ['ok'=>true,'duplicate'=>true,'item'=>cqPublic($job)];cqFail('別の結果が登録されています。',409);}
  if($status==='tested'&&($job['status']!=='testing'||!$tests||in_array(false,array_column($tests,'passed'),true)))cqFail('テスト成功が確認できません。',409);
  if($level===2&&$status==='tested')cqFail('LEVEL 2は要確認で停止してください。');
  if(!in_array($job['status'],['running','fixed','testing'],true))cqFail('結果を受け付けられない状態です。',409);
  $job['level']=$level;$job['levelReason']=cqText($result['levelReason']??'',3000);$job['answer']=cqText($result['answer']??'',24000);$job['error']=cqText($result['error']??'',6000);
  $job['changedFiles']=$files;$job['tests']=$tests;$job['candidateId']=cqText($result['candidateId']??'',120);$job['baseCommit']=cqText($result['baseCommit']??'',40);$job['patchSha256']=cqText($result['patchSha256']??'',64);
  $job['finishedAt']=cqNow();$job['resultDigest']=$digest;$job['leaseUntil']=date('c',time()+120);cqSetStatus($job,$status,'Codex');cqSave($data);
  return ['ok'=>true,'item'=>cqPublic($job)];
 }
 cqFail('処理コマンドを確認してください。');
}
