<?php
// Small, public change token only: no lesson/student contents or writes.
header('Cache-Control: no-store');
$parts=[];foreach(['lesson_records.json','lesson_groups.json','schedule_data.json','added_lessons.json','edited_lessons.json','lesson_key_aliases.json'] as $name){$path=__DIR__.'/data/'.$name;$parts[]=is_file($path)?hash_file('sha256',$path):'';}
$etag='"'.hash('sha256',implode('|',$parts)).'"';header('ETag: '.$etag);
if(($_SERVER['HTTP_IF_NONE_MATCH']??'')===$etag){http_response_code(304);exit;}
header('Content-Type: application/json; charset=utf-8');echo json_encode(['ok'=>true,'revision'=>$etag]);
