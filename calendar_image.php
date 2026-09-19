<?php
require_once __DIR__.'/calendar_events.php';
header('Cache-Control: private, no-store');header('Vary: Cookie');header('X-Content-Type-Options: nosniff');header("Content-Security-Policy: default-src 'none'; sandbox");
$d=ceData();$id=ceText($_GET,'id',24,true);$r=$d['events'][$id]??null;$viewer=staffCurrent();$canPreview=($viewer['role']??'')==='admin'&&empty($viewer['mustChange']);
if(!$r||(!cePublished($r,$d)&&!$canPreview)||empty($r['image'])){http_response_code(404);exit;}
$imageId=$r['image']['id'];if(!preg_match('/^[a-f0-9]{24}$/',$imageId)){http_response_code(404);exit;}
$file=__DIR__.'/data/calendar_images/'.$imageId.'.php';if(!is_file($file)){http_response_code(404);exit;}$im=readJsonStrict($file);$bytes=base64_decode($im['base64']??'',true);
if($bytes===false||!in_array($im['mime']??'',['image/jpeg','image/png','image/webp'],true)){http_response_code(404);exit;}
header('Content-Type: '.$im['mime']);header('Content-Length: '.strlen($bytes));header('Content-Disposition: inline');echo $bytes;
