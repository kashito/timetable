<?php
require_once __DIR__.'/staff_security.php';
header('Cache-Control: private, no-store');header('Vary: Cookie');
function bgFail($s,$code=400){staffFail($s,$code);}
function bgText($in,$k,$max){$v=$in[$k]??'';if(!is_string($v)||strlen($v)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/',$v))bgFail('案内の文字数・形式を確認してください。');return trim($v);}
function bgVersion($r){return hash('sha256',json_encode($r,JSON_UNESCAPED_UNICODE));}
function bgSeconds($v){if(!is_int($v)||$v<5||$v>600)bgFail('表示時間は5〜600秒で指定してください。');return $v;}
function bgProjection($r,$board,$date,$admin){$out=['board'=>$board,'date'=>$date,'mainSeconds'=>$r['mainSeconds']??30,'slides'=>array_values(array_filter($r['slides']??[],fn($s)=>$admin||$s['visible'])),'canEdit'=>$admin,'updatedAt'=>$r['updatedAt']??null];if($admin)$out['version']=bgVersion($r);return $out;}
try{
 $method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))bgFail('Method not allowed',405);
 $in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))bgFail('入力内容を確認してください。');
 $board=bgText($in,'board',8)?:'all';$date=bgText($in,'date',10)?:date('Y-m-d');
 if(!in_array($board,['all','blue'],true)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))bgFail('掲示板・日付を確認してください。');
 $actor=$method==='POST'?staffRequire(true):staffCurrent();$admin=$actor&&$actor['role']==='admin'&&empty($actor['mustChange']);if($method==='GET'&&($in['preview']??'')==='student')$admin=false;
 $file=__DIR__.'/data/board_guides.php';$data=readJsonStrict($file,['schema'=>1,'days'=>[]]);if(($data['schema']??null)!==1||!is_array($data['days']??null))dataError('案内の保存形式を確認してください。上書きせず停止しました。');
 $key=$board.':'.$date;$day=$data['days'][$key]??[];$imageDir=__DIR__.'/data/board_guide_images';
 if($method==='GET'&&($in['action']??'')==='image'){
  $id=bgText($in,'id',64);if(!preg_match('/^[a-f0-9]{64}$/D',$id))bgFail('画像がありません。',404);
  $image=null;foreach($day['slides']??[] as $s)if(($admin||$s['visible'])&&($s['image']['id']??'')===$id)$image=$s['image'];
  if(!$image||!is_file($imageDir.'/'.$id.'.php'))bgFail('画像は公開されていません。',404);
  $raw=file_get_contents($imageDir.'/'.$id.'.php');$guard="<?php exit; ?>\n";if(substr($raw,0,strlen($guard))!==$guard)throw new RuntimeException('image guard');$raw=substr($raw,strlen($guard));
  header('Content-Type: '.$image['mime']);header('X-Content-Type-Options: nosniff');header("Content-Security-Policy: default-src 'none'; sandbox");header('Content-Length: '.strlen($raw));echo $raw;exit;
 }
 header('Content-Type: application/json; charset=utf-8');
 if($method==='GET'){echo json_encode(['ok'=>true,'guide'=>bgProjection($day,$board,$date,$admin)],JSON_UNESCAPED_UNICODE);exit;}
 $request=bgText($in,'requestId',64);if(!preg_match('/^[a-f0-9]{32}$/D',$request))bgFail('編集画面を開き直してください。');
 $incoming=$in['slides']??null;if(!is_array($incoming)||$incoming!==array_values($incoming)||count($incoming)>12)bgFail('案内は1日12件まで登録できます。');
 $allowed=[];foreach($day['slides']??[] as $s)if(!empty($s['image']))$allowed[$s['image']['id']]=$s['image'];
 $slides=[];$ids=[];$blobs=[];$total=0;
 foreach($incoming as $s){
  if(!is_array($s))bgFail('案内の形式を確認してください。');$id=bgText($s,'id',32);if(!preg_match('/^[a-f0-9]{32}$/D',$id)||isset($ids[$id]))bgFail('案内の番号を確認してください。');$ids[$id]=true;
  if(!is_bool($s['visible']??null))bgFail('表示チェックを確認してください。');
  $kind=$s['kind']??'notice';if(!in_array($kind,['notice','countdown'],true))bgFail('案内の種類を確認してください。');
  $r=['kind'=>$kind,'id'=>$id,'title'=>bgText($s,'title',300),'body'=>bgText($s,'body',12000),'visible'=>$s['visible'],'seconds'=>bgSeconds($s['seconds']??null),'image'=>null];
  $upload=$s['imageData']??'';if(!is_string($upload))bgFail('画像を確認してください。');
  if($upload!==''){
   if(strlen($upload)>1500000||!preg_match('/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+\/=]+)$/D',$upload,$m))bgFail('PNG・JPEG・WebP・GIFの画像（1枚1MBまで）を選んでください。');
   $bytes=base64_decode($m[2],true);$info=$bytes!==false?@getimagesizefromstring($bytes):false;$mime='image/'.$m[1];
   if(!$info||($info['mime']??'')!==$mime||strlen($bytes)>1048576||$info[0]*$info[1]>40000000)bgFail('画像の形式・サイズを確認してください（1枚1MBまで）。');
   $hash=hash('sha256',$bytes);$blobs[$hash]=$bytes;$r['image']=['id'=>$hash,'mime'=>$mime,'size'=>strlen($bytes)];
  }elseif(!empty($s['image'])){if(!is_array($s['image'])||!isset($allowed[$s['image']['id']??'']))bgFail('保存済みの画像を確認してください。');$r['image']=$allowed[$s['image']['id']];}
  $total+=$r['image']['size']??0;if($total>4194304)bgFail('1日の案内画像は合計4MBまでです。');
  if($kind!=='countdown'&&$r['body']===''&&!$r['image'])bgFail('案内の文章か画像を追加してください。');if($r['title']==='')$r['title']='案内';$slides[]=$r;
 }
 $fields=['mainSeconds'=>bgSeconds($in['mainSeconds']??null),'slides'=>$slides];$hash=bgVersion($fields);
 if(($day['receipt']['id']??'')===$request&&($day['receipt']['actor']??'')===$actor['id']){if(($day['receipt']['hash']??'')!==$hash)bgFail('前の内容は保存済みです。一覧を確認してください。',409);echo json_encode(['ok'=>true,'duplicate'=>true,'guide'=>bgProjection($day,$board,$date,true)],JSON_UNESCAPED_UNICODE);exit;}
 if(!hash_equals(bgVersion($day),bgText($in,'version',64)))bgFail('別の画面で案内が更新されました。入力を控え、開き直してください。',409);
 $created=[];try{
  if($blobs&&!is_dir($imageDir)&&!@mkdir($imageDir,0775,true)&&!is_dir($imageDir))throw new RuntimeException('image directory');
  foreach($blobs as $id=>$bytes){$path=$imageDir.'/'.$id.'.php';if(is_file($path))continue;$h=@fopen($path,'xb');if(!$h)throw new RuntimeException('image create');$created[]=$path;$body="<?php exit; ?>\n".$bytes;try{if(fwrite($h,$body)!==strlen($body))throw new RuntimeException('image write');}finally{fclose($h);}}
  $history=$day['history']??[];if($day){$old=$day;unset($old['history'],$old['receipt']);$history[]=$old;}
  $day=$fields+['updatedAt'=>date('c'),'updatedBy'=>$actor['name'],'history'=>$history,'receipt'=>['id'=>$request,'actor'=>$actor['id'],'hash'=>$hash]];$data['days'][$key]=$day;
  if(!safeJsonWriteAtomic($file,$data))throw new RuntimeException('guide save');
 }catch(Throwable $e){foreach($created as $path)@unlink($path);throw $e;}
 echo json_encode(['ok'=>true,'guide'=>bgProjection($day,$board,$date,true)],JSON_UNESCAPED_UNICODE);
}catch(Throwable $e){error_log('[board_guides] '.get_class($e).' '.basename($e->getFile()).':'.$e->getLine());staffFail('案内を保存・読み込みできませんでした。入力を残して再度お試しください。',500);}
