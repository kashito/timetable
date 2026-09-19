<?php
require_once __DIR__.'/staff_security.php';
require_once __DIR__.'/codex_memo_responses.php';
header('Cache-Control: private, no-store');header('Vary: Cookie');header('X-Content-Type-Options: nosniff');
$actor=staffRequire(true);$file=__DIR__.'/data/codex_memos.php';$imageDir=__DIR__.'/data/codex_memo_images';
function cmReply($v){header('Content-Type: application/json; charset=utf-8');echo json_encode($v,JSON_UNESCAPED_UNICODE);exit;}
function cmText($in,$key,$max,$required=false){$v=$in[$key]??'';if(!is_string($v)||strlen($v)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$v)||($required&&trim($v)===''))staffFail('入力内容・文字数を確認してください。',400);return trim($v);}
function cmId($v){if(!is_string($v)||!preg_match('/^[a-f0-9]{24}$/D',$v))staffFail('メモが見つかりません。',404);return $v;}
function cmVersion($r){return hash('sha256',json_encode($r,JSON_UNESCAPED_UNICODE));}
function cmStatus($r){return !empty($r['doneAt'])?'done':(in_array($r['status']??'',['reviewing','hold','returned'],true)?$r['status']:'open');}
function cmStatusLabel($r){return ['done'=>'対応完了','reviewing'=>'検証中','hold'=>'保留','returned'=>'差し戻し','open'=>'未対応'][cmStatus($r)];}
function cmPublic($r){unset($r['requestId'],$r['requestHash']);$r['updates']=array_map(function($u){unset($u['requestId'],$u['requestHash']);return $u;},$r['updates']??[]);$r['version']=cmVersion($r);$r['referenceCode']='CM-'.$r['id'];$r['responses']=cmResponses($r['id']);$r['status']=cmStatus($r);return $r;}
function cmImages($r){$images=$r['images']??[];foreach($r['updates']??[] as $u)$images=array_merge($images,$u['images']??[]);return $images;}
function cmPage($v){
 $parts=parse_url($v);$base=rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'])),'/');
 if($parts===false||isset($parts['scheme'])||isset($parts['host'])||strpos($v,'\\')!==false||preg_match('/[\x00-\x20\x7f]/',$v))staffFail('記録元のページを確認してください。',400);
 $path=$parts['path']??'';$name=substr($path,strlen($base)+1);
 if(strpos($path,$base.'/')!==0||!preg_match('/^[a-zA-Z0-9_-]+\.(?:html|php)$/D',$name)||!is_file(__DIR__.'/'.$name)||stripos(file_get_contents(__DIR__.'/'.$name),'<!doctype html')===false)staffFail('このシステムの画面からメモを作成してください。',400);
 return $v;
}
function cmImageBytes($image){
 $id=cmId($image['id']);$raw=@file_get_contents(__DIR__.'/data/codex_memo_images/'.$id.'.php');$prefix="<?php exit; ?>\n";
 if($raw===false||substr($raw,0,strlen($prefix))!==$prefix||strlen($raw)-strlen($prefix)!==$image['size'])staffFail('画像を読み込めません。管理者に保存先の確認を依頼してください。',500);
 return substr($raw,strlen($prefix));
}
function cmExportText($items,$origin){
 $s="# 時間割システム CODEXメモ\n\n以下の未対応メモの内容を確認して、修正してください。元の運用データは保持してください。回答・修正結果は、このメモの結果欄にも残してください。\n画像は同梱の images フォルダにあります。対応完了への変更は、管理者が修正を確認してから行います。\n\n";
 foreach($items as $r){$s.="## メモ ".$r['id']."\nページ：".$r['pageTitle']."\nURL：".$origin.$r['pagePath']."\n画面内の場所：".$r['context']."\n記入：".$r['createdBy']." ／ ".$r['createdAt']."\n\n".$r['text']."\n\n";foreach($r['images'] as $i)$s.='画像：images/'.$r['id'].'/'.$i['id'].'.'.$i['ext']."\n";$s.="\n";foreach($r['updates']??[] as $index=>$u){$s.="### 追記 ".($index+1)."\n記入：".$u['createdBy']." ／ ".$u['createdAt']."\nページ：".$u['pageTitle']."\nURL：".$origin.$u['pagePath']."\n画面内の場所：".$u['context']."\n\n".$u['text']."\n";foreach($u['images']??[] as $i)$s.='画像：images/'.$r['id'].'/'.$i['id'].'.'.$i['ext']."\n";$s.="\n";}$s.="相談コード：CM-".$r['id']."\n種別：".(($r['kind']??'request')==='question'?'質問':'修正依頼')."\n対応状況：".(!empty($r['doneAt'])?'対応完了：'.$r['doneBy'].' '.$r['doneAt']:cmStatusLabel($r))."\n";foreach(cmResponses($r['id']) as $a)$s.="\n【".$a['kind']." / ".$a['release']."】 ".$a['by']." / ".$a['at']."\n".$a['text']."\n";foreach($r['history']??[] as $h)$s.="操作履歴：".$h['action'].(isset($h['status'])?' ('.$h['status'].')':'')." / ".$h['by']." / ".$h['at']."\n";$s.="\n追加の質問：\n\n";}return $s;
}
// Stored ZIP entries keep exports available on hosts without the ZipArchive extension.
function cmZip($entries){
 $stream=fopen('php://temp/maxmemory:2097152','w+b');$central='';$offset=0;$count=0;
 foreach($entries as $name=>$body){$size=strlen($body);$crc=crc32($body);$header=pack('VvvvvvVVVvv',0x04034b50,20,0x0800,0,0,0x21,$crc,$size,$size,strlen($name),0).$name;fwrite($stream,$header.$body);$central.=pack('VvvvvvvVVVvvvvvVV',0x02014b50,20,20,0x0800,0,0,0x21,$crc,$size,$size,strlen($name),0,0,0,0,0,$offset).$name;$offset+=strlen($header)+$size;$count++;}
 fwrite($stream,$central.pack('VvvvvVVv',0x06054b50,0,0,$count,$count,strlen($central),$offset,0));$length=ftell($stream);rewind($stream);
 header('Content-Type: application/zip');header('Content-Disposition: attachment; filename="codex-memos-'.date('Ymd-His').'.zip"');header('Content-Length: '.$length);fpassthru($stream);fclose($stream);exit;
}
try{
 $method=$_SERVER['REQUEST_METHOD'];if(!in_array($method,['GET','POST'],true))staffFail('Method not allowed',405);
 $in=$method==='GET'?$_GET:($_POST?:json_decode(file_get_contents('php://input'),true));if(!is_array($in))staffFail('データを読み取れません。画像の合計サイズを小さくして再度お試しください。',400);
 $action=cmText($in,'action',20)?:'list';$data=readJsonStrict($file,['schema'=>1,'items'=>[]]);
 if(($data['schema']??null)!==1||!is_array($data['items']??null))staffFail('メモの保存形式を確認してください。既存データは変更していません。',500);
 if($method==='GET'){
  if($action==='image'){$r=$data['items'][cmId($in['memo']??'')]??null;$image=null;foreach(cmImages($r??[]) as $i)if($i['id']===($in['id']??''))$image=$i;if(!$image)staffFail('画像が見つかりません。',404);$bytes=cmImageBytes($image);header('Content-Type: '.$image['mime']);header('Content-Length: '.strlen($bytes));header('Content-Security-Policy: default-src \'none\'; sandbox');header('Content-Disposition: inline; filename="memo-image.'.$image['ext'].'"');echo $bytes;exit;}
  if($action!=='list')staffFail('操作を確認してください。',400);
  $items=array_values($data['items']);if(isset($in['id']))$items=array_values(array_filter($items,fn($r)=>$r['id']===cmId($in['id'])));elseif(($in['includeDone']??'')!=='1')$items=array_values(array_filter($items,fn($r)=>empty($r['doneAt'])));
  usort($items,fn($a,$b)=>strcmp($b['updatedAt']??$b['createdAt'],$a['updatedAt']??$a['createdAt'])?:strcmp($b['id'],$a['id']));cmReply(['ok'=>true,'items'=>array_map('cmPublic',$items)]);
 }
 if($action==='export'||$action==='history_export'){
  $ids=$in['ids']??null;if(!is_array($ids)||!$ids||count($ids)>100)staffFail('未対応メモを1〜100件選んでください。',400);$selected=[];$entries=[];$size=0;
  foreach(array_unique($ids) as $id){$r=$data['items'][cmId($id)]??null;if(!$r||($action==='export'&&!empty($r['doneAt'])))staffFail('メモの状態が変わりました。一覧を再読み込みしてください。',409);$selected[]=$r;foreach(cmImages($r) as $i){$size+=$i['size'];if($size>24*1024*1024)staffFail('画像が多いため、検索でメモを絞り込んでからZIPを作成してください（合計24MBまで）。',400);$entries['images/'.$id.'/'.$i['id'].'.'.$i['ext']]=cmImageBytes($i);}}
  $host=$_SERVER['HTTP_HOST']??'';$origin=preg_match('/^[a-zA-Z0-9.\-:\[\]]+$/D',$host)?((!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off'?'https':'http').'://'.$host):'';
  $entries=['instructions.md'=>cmExportText($selected,$origin)]+$entries;cmZip($entries);
 }
 if($action==='status'){
  $id=cmId($in['id']??'');$r=$data['items'][$id]??null;if(!$r)staffFail('メモが見つかりません。',404);
  $next=$in['status']??'';if(!in_array($next,['open','reviewing','hold','returned','done'],true))staffFail('状態を選んでください。',400);
  if(!hash_equals(cmPublic($r)['version'],cmText($in,'version',64,true)))staffFail('別の画面で更新されました。再読み込みしてください。',409);
  if(cmStatus($r)!==$next){$r['status']=$next;$r['doneAt']=$next==='done'?date('c'):null;$r['doneBy']=$next==='done'?$actor['name']:null;$r['updatedAt']=date('c');$r['history'][]=['action'=>'status','status'=>$next,'at'=>date('c'),'by'=>$actor['name']];$data['items'][$id]=$r;if(!safeJsonWriteAtomic($file,$data))staffFail('状態を保存できませんでした。',500);}
  cmReply(['ok'=>true,'item'=>cmPublic($r)]);
 }
 if($action==='done'){
  $id=cmId($in['id']??'');$r=$data['items'][$id]??null;if(!$r)staffFail('メモが見つかりません。',404);
  if(!is_bool($in['done']??null))staffFail('対応状況を確認してください。',400);
  if(!hash_equals(cmPublic($r)['version'],cmText($in,'version',64,true)))staffFail('別の画面で更新されました。一覧を再読み込みしてください。',409);
  if((!empty($r['doneAt']))!==$in['done']){$r['status']=$in['done']?'done':'open';$r['doneAt']=$in['done']?date('c'):null;$r['doneBy']=$in['done']?$actor['name']:null;$r['updatedAt']=date('c');$r['history'][]=['action'=>$in['done']?'done':'reopen','at'=>date('c'),'by'=>$actor['name']];$data['items'][$id]=$r;if(!safeJsonWriteAtomic($file,$data))staffFail('保存できませんでした。もう一度お試しください。',500);}
  cmReply(['ok'=>true,'item'=>cmPublic($r)]);
 }
 if(!in_array($action,['create','append'],true))staffFail('操作を確認してください。',400);
 $kind=cmText($in,'kind',20)?:'request';if(!in_array($kind,['request','question'],true))staffFail('メモの種類を確認してください。',400);
 $text=cmText($in,'text',24000);$pageTitle=cmText($in,'pageTitle',600,true);$pagePath=cmPage(cmText($in,'pagePath',6000,true));$context=cmText($in,'context',1500);$requestId=cmText($in,'requestId',64,true);
 if(!preg_match('/^[a-f0-9]{32}$/D',$requestId))staffFail('画面を開き直してください。',400);
 $target=null;$targetId=null;
 if($action==='append'){$targetId=cmId($in['id']??'');$target=$data['items'][$targetId]??null;if(!$target)staffFail('追記先のメモが見つかりません。',404);}
 $uploads=$_FILES['images']??null;$images=[];$total=0;
 if($uploads){if(!is_array($uploads['name']??null)||count($uploads['name'])>4)staffFail('画像は4枚まで添付できます。',400);
  foreach($uploads['name'] as $index=>$unused){$err=$uploads['error'][$index]??UPLOAD_ERR_NO_FILE;if($err!==UPLOAD_ERR_OK)staffFail('画像を読み込めません。1枚2MB以下にしてください。',400);$tmp=$uploads['tmp_name'][$index];$bytes=@file_get_contents($tmp);if($bytes===false||strlen($bytes)===0||strlen($bytes)>2*1024*1024)staffFail('画像は1枚2MB以下にしてください。',400);$total+=strlen($bytes);if($total>6*1024*1024)staffFail('画像は合計6MB以下にしてください。',400);
   $info=@getimagesize($tmp);$mime=$info['mime']??'';$types=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp','image/gif'=>'gif'];if(!$info||!isset($types[$mime])||$info[0]*$info[1]>40000000)staffFail('PNG・JPEG・WebP・GIFの画像を選んでください（4000万画素まで）。',400);
   $images[]=['bytes'=>$bytes,'mime'=>$mime,'ext'=>$types[$mime],'size'=>strlen($bytes)];
  }
 }
 if($text===''&&!$images)staffFail('メモを入力するか、画像を添付してください。',400);
 $hash=hash('sha256',json_encode([$kind,$text,$pageTitle,$pagePath,$context,array_map(fn($i)=>hash('sha256',$i['bytes']),$images)],JSON_UNESCAPED_UNICODE));
 foreach($data['items'] as $r)if($action==='create'&&($r['requestId']??'')===$requestId&&$r['createdById']===$actor['id']){if(($r['requestHash']??'')!==$hash)staffFail('前の内容は保存済みです。一覧で確認してください。',409);cmReply(['ok'=>true,'duplicate'=>true,'item'=>cmPublic($r)]);}
 if($target){
  foreach($target['updates']??[] as $u)if(($u['requestId']??'')===$requestId&&$u['createdById']===$actor['id']){if(($u['requestHash']??'')!==$hash)staffFail('前の追記は保存済みです。一覧で確認してください。',409);cmReply(['ok'=>true,'duplicate'=>true,'item'=>cmPublic($target)]);}
  if(!hash_equals(cmPublic($target)['version'],cmText($in,'version',64,true)))staffFail('このメモに更新があります。「追記先を再読み込み」で最新の内容を確認してから保存してください。入力内容は残しています。',409);
  if(count($target['updates']??[])>=100)staffFail('このメモへの追記は100件までです。',400);
  $existingBytes=array_sum(array_column(cmImages($target),'size'));if($existingBytes+$total>24*1024*1024)staffFail('このメモの画像は、追記分を含め合計24MBまでです。',400);
 }
 $id=$targetId??bin2hex(random_bytes(12));$stored=[];$paths=[];
 if($images&&!is_dir($imageDir)&&!@mkdir($imageDir,0775,true)&&!is_dir($imageDir))staffFail('画像の保存先を作れません。入力内容を残しています。',500);
 try{foreach($images as $i){$imageId=bin2hex(random_bytes(12));$path=$imageDir.'/'.$imageId.'.php';$raw="<?php exit; ?>\n".$i['bytes'];$handle=@fopen($path,'xb');if(!$handle)throw new RuntimeException('image storage');$paths[]=$path;$written=fwrite($handle,$raw);fclose($handle);if($written!==strlen($raw))throw new RuntimeException('image write');@chmod($path,0664);unset($i['bytes']);$stored[]=['id'=>$imageId]+$i;}
  $r=['id'=>$id,'kind'=>$kind,'text'=>$text,'pageTitle'=>$pageTitle,'pagePath'=>$pagePath,'context'=>$context,'images'=>$stored,'createdAt'=>date('c'),'updatedAt'=>date('c'),'createdBy'=>$actor['name'],'createdById'=>$actor['id'],'doneAt'=>null,'doneBy'=>null,'history'=>[],'requestId'=>$requestId,'requestHash'=>$hash];
  if($target){$entry=['id'=>bin2hex(random_bytes(12)),'text'=>$text,'pageTitle'=>$pageTitle,'pagePath'=>$pagePath,'context'=>$context,'images'=>$stored,'createdAt'=>date('c'),'createdBy'=>$actor['name'],'createdById'=>$actor['id'],'requestId'=>$requestId,'requestHash'=>$hash];$r=$target;$r['updates'][]=$entry;$r['updatedAt']=date('c');
   if(!empty($r['doneAt'])){$r['history'][]=['action'=>'reopen','at'=>date('c'),'by'=>$actor['name'],'reason'=>'append'];$r['status']='open';$r['doneAt']=null;$r['doneBy']=null;}
   $r['history'][]=['action'=>'append','id'=>$entry['id'],'at'=>$entry['createdAt'],'by'=>$actor['name']];
  }
  $data['items'][$id]=$r;if(!safeJsonWriteAtomic($file,$data))throw new RuntimeException('memo write');
 }catch(Throwable $e){foreach($paths as $p)@unlink($p);throw $e;}
 cmReply(['ok'=>true,'item'=>cmPublic($r)]);
}catch(Throwable $e){error_log('[codex_memos] '.get_class($e));staffFail('メモを処理できませんでした。入力内容を残して、再度お試しください。',500);}
