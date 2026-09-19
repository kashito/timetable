<?php
function newsRespond($value){$j=json_encode($value,JSON_UNESCAPED_UNICODE);if($j===false)throw new RuntimeException('News response encoding failed');echo $j;}
try {
require_once __DIR__.'/system_news.php';header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('Vary: Cookie');
$viewer=staffCurrent();if($viewer&&!empty($viewer['mustChange']))staffFail('先に自分のパスワードを設定してください。');$reader=newsReader($viewer);$data=newsData();$articles=newsArticles($data);
$method=$_SERVER['REQUEST_METHOD'];$in=$method==='GET'?$_GET:json_decode(file_get_contents('php://input'),true);if(!is_array($in))staffFail('入力形式を確認してください。',400);
$student=newsText($in,'student',300);$visibilityViewer=($in['studentView']??'')==='1'?null:$viewer;
$id=newsText($in,'id',80);$post=$id!==''?($articles[$id]??null):null;
if($method==='GET'){
 if($id!==''){if(!$post||!newsVisible($post,$visibilityViewer,$student,$method==='GET'))staffFail('この記事は公開されていないか、閲覧できる対象ではありません。',404);newsRespond(['ok'=>true,'article'=>newsProjection($post,$data,$viewer,$reader,true)]);exit;}
 $items=[];foreach($articles as $r)if(newsVisible($r,$visibilityViewer,$student,($in['includeExpired']??'')==='1'))$items[]=newsProjection($r,$data,$viewer,$reader);
 usort($items,fn($a,$b)=>strcmp($b['createdAt'],$a['createdAt'])?:(($b['sortOrder']??0)<=>($a['sortOrder']??0))?:strcmp($b['id'],$a['id']));newsRespond(['ok'=>true,'articles'=>$items,'canManage'=>$viewer&&$viewer['role']==='admin','readerKind'=>$reader['kind']]);exit;
}
if($method!=='POST')staffFail('Method not allowed',405);staffCsrf();$action=newsText($in,'action',20,true);$now=date('c');
if($action==='visibility'){
 $actor=staffRequire(true);if(!$post)staffFail('記事が見つかりません。',404);
 if(!hash_equals(newsVersion($post),newsText($in,'version',64,true)))staffFail('記事が更新されています。再読み込みしてください。',409);
 if(!is_bool($in['published']??null))staffFail('表示状態を確認してください。',400);
 if(!empty($post['builtin'])){$old=$data['settings'][$id]??[];$history=$old['history']??[];$snapshot=$old;unset($snapshot['history']);$history[]=$snapshot;$data['settings'][$id]=array_replace($old,['published'=>$in['published'],'updatedAt'=>$now,'updatedBy'=>$actor['name'],'history'=>$history]);}
 else {$old=$post;unset($old['history']);$post['history'][]=$old;$data['posts'][$id]=array_replace($post,['published'=>$in['published'],'updatedAt'=>$now,'updatedBy'=>$actor['name']]);}
}elseif($action==='save'){
 $actor=staffRequire(true);if($id!==''&&!$post)staffFail('記事が見つかりません。',404);
 if($post&&!hash_equals(newsVersion($post),newsText($in,'version',64,true)))staffFail('記事が更新されました。入力内容を控えて、開き直して確認してください。',409);
 $fields=newsSettings($in,$post??[]);
 if(!$post||empty($post['builtin']))$fields+=['title'=>newsText($in,'title',600,true),'body'=>newsText($in,'body',60000,true)];
 if(!$post){
  $requestId=newsText($in,'requestId',80,true);if(!preg_match('/^[a-zA-Z0-9_-]{16,80}$/D',$requestId))staffFail('投稿画面を開き直してください。',400);$hash=newsVersion($fields);
  foreach($data['posts'] as $r)if(($r['requestId']??'')===$requestId&&($r['authorId']??'')===$actor['id']){if(($r['requestHash']??'')!==$hash)staffFail('前の投稿は保存済みです。一覧を確認してください。入力内容は残しています。',409);newsRespond(['ok'=>true,'id'=>$r['id'],'duplicate'=>true]);exit;}
  $id='news_'.bin2hex(random_bytes(12));$post=['id'=>$id,'kind'=>'notice','builtin'=>false,'authorId'=>$actor['id'],'author'=>$actor['name'],'createdAt'=>$now,'revision'=>1,'requestId'=>$requestId,'requestHash'=>$hash,'history'=>[]];
 }else{
  if(empty($post['builtin'])){$previous=array_intersect_key($post,array_flip(['title','body','audience','color','published','visibleUntil','targetStudents','updatedAt','updatedBy','revision']));$post['history'][]=$previous;if($post['title']!==$fields['title']||$post['body']!==$fields['body'])$post['revision']++;}
 }
 if(!empty($post['builtin'])){$existing=$data['settings'][$id]??[];$history=$existing['history']??[];if($existing){unset($existing['history']);$history[]=$existing;}$data['settings'][$id]=$fields+['updatedAt'=>$now,'updatedBy'=>$actor['name'],'history'=>$history];}
 else $data['posts'][$id]=array_replace($post,$fields,['updatedAt'=>$now,'updatedBy'=>$actor['name']]);
}elseif($action==='open'){
 if(!$post||!newsVisible($post,$visibilityViewer,$student,$method==='GET'))staffFail('この記事は公開されていないか、閲覧できる対象ではありません。',404);
 if(!hash_equals(newsVersion($post),newsText($in,'version',64,true)))staffFail('記事が変更されました。詳細を開き直してください。',409);
 if(isset($data['opens'][$id][(string)$post['revision']][$reader['key']])){newsRespond(['ok'=>true,'id'=>$id,'duplicate'=>true]);exit;}
 $data['opens'][$id][(string)$post['revision']][$reader['key']]=$now;
}elseif($action==='seen'){
 if(!$post||!newsVisible($post,$visibilityViewer,$student,$method==='GET'))staffFail('この記事は公開されていないか、閲覧できる対象ではありません。',404);
 if(!is_bool($in['seen']??null))staffFail('確認状態を選んでください。',400);
 if(!hash_equals(newsVersion($post),newsText($in,'version',64,true)))staffFail('記事が変更されました。詳細を開き直して内容を確認してください。',409);
 $revision=(string)$post['revision'];$old=$data['reads'][$id][$revision][$reader['key']]??null;
 if(!$old||(bool)$old['active']!==$in['seen']){$history=$old['history']??[];$history[]=['active'=>$in['seen'],'at'=>$now];$data['reads'][$id][$revision][$reader['key']]=['kind'=>$reader['kind'],'name'=>$reader['name'],'active'=>$in['seen'],'at'=>$now,'history'=>$history];}
 else {newsRespond(['ok'=>true,'id'=>$id,'duplicate'=>true]);exit;}
}else staffFail('不明な操作です。',400);
if(!safeJsonWriteAtomic(__DIR__.'/data/system_news.php',$data))staffFail('保存できませんでした。入力内容を残して再度お試しください。',500);
newsRespond(['ok'=>true,'id'=>$id]);
}catch(Throwable $e){error_log('[system_news_api] '.get_class($e).' at '.basename($e->getFile()).':'.$e->getLine());http_response_code(500);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');newsRespond(['ok'=>false,'error'=>'更新履歴・お知らせの処理を完了できませんでした。入力内容を控えて一覧を確認してください。（NEWS_SERVER）']);}
