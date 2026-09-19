<?php
require_once __DIR__.'/staff_security.php';
function ceData(){
 $d=readJsonStrict(__DIR__.'/data/calendar_events.php',['schema'=>1,'schools'=>[],'events'=>[]]);
 if(!isset($d['schools'],$d['events'])||!is_array($d['schools'])||!is_array($d['events']))dataError('学校行事・お知らせのデータ形式を確認してください。上書きせず停止しました。');
 return $d;
}
function ceVersion($r){return hash('sha256',json_encode($r,JSON_UNESCAPED_UNICODE));}
function ceText($in,$key,$max,$required=false){$s=$in[$key]??'';if(!is_string($s)||strlen($s)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$s)||($required&&trim($s)===''))staffFail('必須項目と文字数を確認してください。',400);return trim($s);}
function ceDate($s){$d=is_string($s)?DateTimeImmutable::createFromFormat('!Y-m-d',$s):false;if(!$d||$d->format('Y-m-d')!==$s)staffFail('開始日・終了日を確認してください。',400);return $s;}
function cePublished($r,$d){return !empty($r['published'])&&empty($r['archived'])&&($r['kind']==='notice'||isset($d['schools'][$r['schoolId']])&&empty($d['schools'][$r['schoolId']]['archived']));}
function ceSchool($r){return ['id'=>$r['id'],'name'=>$r['name']];}
function ceProjection($r,$d,$admin=false){
 $out=array_intersect_key($r,array_flip(['id','kind','schoolId','title','startDate','endDate','body','category','published','archived','createdAt','updatedAt']));
 $out['schoolName']=$d['schools'][$r['schoolId']??'']['name']??'';$out['image']=!empty($r['image'])?['url'=>'calendar_image.php?id='.rawurlencode($r['id']).'&v='.rawurlencode($r['image']['id']),'name'=>$r['image']['name']]:null;
 if($admin){$out['version']=ceVersion($r);$out['updatedBy']=$r['updatedBy']??'';}return $out;
}
function ceStudentSchool($name,$d){
 if($name==='')return null;$base=readJsonStrict(__DIR__.'/data/schedule_data.json');$students=readJsonStrict(__DIR__.'/data/student_master.json',$base['students']??[]);$exists=false;
 foreach($students as $s)if(($s['生徒名']??'')===$name){$exists=true;break;}if(!$exists)return null;
 $profiles=readJsonStrict(__DIR__.'/data/student_profiles.php');$school=trim((string)($profiles[$name]['school']??''));if($school==='')return null;
 foreach($d['schools'] as $r)if(empty($r['archived'])&&in_array($school,array_merge([$r['name']],$r['aliases']??[]),true))return ceSchool($r);
 return null;
}
