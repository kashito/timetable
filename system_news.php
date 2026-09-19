<?php
require_once __DIR__.'/staff_security.php';
require_once __DIR__.'/system_updates_content.php';
function newsData(){
 $d=readJsonStrict(__DIR__.'/data/system_news.php',['schema'=>1,'posts'=>[],'settings'=>[],'reads'=>[]]);
 foreach(['posts','settings','reads'] as $k)if(!isset($d[$k])||!is_array($d[$k]))dataError('更新履歴・お知らせのデータ形式を確認してください。上書きせず停止しました。');
 if(!isset($d['opens']))$d['opens']=[];if(!is_array($d['opens']))dataError('既読記録の形式を確認してください。上書きせず停止しました。');
 return $d;
}
function newsVersion($r){return hash('sha256',json_encode($r,JSON_UNESCAPED_UNICODE));}
function newsArticles($d){
 // Automatic updates start as admin-only. Only an administrator's saved audience publishes them.
 $out=[];foreach(systemUpdateArticles() as $r){$id=$r['id'];$out[$id]=array_replace($r,['audience'=>'admin'],$d['settings'][$id]??[],['id'=>$id,'builtin'=>true]);}
 foreach($d['posts'] as $id=>$r)$out[$id]=$r+['builtin'=>false];return $out;
}
function newsExpired($r){return !empty($r['visibleUntil'])&&$r['visibleUntil']<date('Y-m-d');}
function newsVisible($r,$viewer,$student='',$manage=false){
 if(newsExpired($r)&&!($manage&&$viewer&&$viewer['role']==='admin'))return false;
 if($viewer&&$viewer['role']==='admin')return true;
 if(empty($r['published']))return false;
 if(($r['audience']??'')==='selected_students')return $viewer||($student!==''&&in_array($student,$r['targetStudents']??[],true));
 return $viewer?in_array($r['audience'],['teachers','students','everyone'],true):in_array($r['audience'],['students','everyone'],true);
}
function newsText($in,$k,$max,$required=false){
 $v=$in[$k]??'';if(!is_string($v)||strlen($v)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$v)||($required&&trim($v)===''))staffFail('必須項目と文字数を確認してください。',400);return trim($v);
}
function newsReader($viewer){
 if($viewer)return ['key'=>'staff:'.$viewer['id'],'kind'=>'staff','name'=>$viewer['name']];
 $token=$_COOKIE['timetable_news_device']??'';
 if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/D',$token)){$token=bin2hex(random_bytes(32));setcookie('timetable_news_device',$token,['expires'=>time()+31536000,'path'=>rtrim(str_replace('\\','/',dirname($_SERVER['SCRIPT_NAME'])),'/').'/','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off','httponly'=>true,'samesite'=>'Lax']);}
 // This is a browser acknowledgement, never an authenticated student identity.
 return ['key'=>'device:'.hash('sha256',$token),'kind'=>'device','name'=>null];
}
function newsProjection($r,$d,$viewer,$reader,$detail=false){
 $out=array_intersect_key($r,array_flip(['id','title','audience','color','published','createdAt','updatedAt','author','updatedBy','revision','builtin','kind','sortOrder']));
 $out['visibleUntil']=$r['visibleUntil']??'';$out['expired']=newsExpired($r);if($viewer)$out['targetStudents']=$r['targetStudents']??[];
 $content=!empty($r['builtin'])?html_entity_decode(strip_tags($r['bodyHtml']),ENT_QUOTES|ENT_HTML5,'UTF-8'):$r['body'];
 $content=preg_replace('/\s+/u',' ',trim($content));preg_match('/\A.{0,150}/us',$content,$m);$out['preview']=($m[0]??'').(strlen($content)>strlen($m[0]??'')?'…':'');
 $reads=$d['reads'][$r['id']][(string)$r['revision']]??[];$mine=$reads[$reader['key']]??null;
 $out['seen']=!empty($mine['active']);$out['seenAt']=$out['seen']?$mine['at']:null;$out['counts']=['staff'=>0,'device'=>0];$readers=[];
 $out['read']=$out['seen']||isset($d['opens'][$r['id']][(string)$r['revision']][$reader['key']]);
 foreach($reads as $v)if(!empty($v['active'])){$out['counts'][$v['kind']]++;if($v['kind']==='staff')$readers[]=['name'=>$v['name'],'at'=>$v['at']];}
 if($viewer&&$viewer['role']==='admin'){$out['version']=newsVersion($r);if($detail)$out['readers']=$readers;}
 if($detail){$out['version']=newsVersion($r);if(!empty($r['builtin']))$out['bodyHtml']=$r['bodyHtml'];else $out['body']=$r['body'];}
 return $out;
}
function newsChoice($in,$key,$choices){$v=$in[$key]??null;if(!is_string($v)||!in_array($v,$choices,true))staffFail('公開先・カード色を確認してください。',400);return $v;}
function newsSettings($in,$existing=[]){
 if(!is_bool($in['published']??null))staffFail('公開状態を確認してください。',400);
 $audience=newsChoice($in,'audience',['teachers','students','everyone','admin','selected_students']);
 $until=array_key_exists('visibleUntil',$in)?newsText($in,'visibleUntil',10):($existing['visibleUntil']??'');
 if($until!==''&&(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$until)||!checkdate((int)substr($until,5,2),(int)substr($until,8,2),(int)substr($until,0,4))))staffFail('表示終了日を確認してください。',400);
 $targets=$in['targetStudents']??($existing['targetStudents']??[]);
 if($audience==='selected_students'){
  if(!is_array($targets)||count($targets)<1||count($targets)>200)staffFail('対象の生徒を1人以上選んでください。',400);
  $dir=__DIR__.'/data';$students=readJsonStrict($dir.'/student_master.json',readJsonStrict($dir.'/schedule_data.json')['students']??[]);$known=array_fill_keys(array_column($students,'生徒名'),true);
  foreach($targets as $name)if(!is_string($name)||!isset($known[$name]))staffFail('登録されている生徒を選んでください。',400);
  $targets=array_values(array_unique($targets));sort($targets,SORT_STRING);
 }else $targets=[];
 return ['audience'=>$audience,'color'=>newsChoice($in,'color',['blue','green','amber','rose','purple','slate']),'published'=>$in['published'],'visibleUntil'=>$until,'targetStudents'=>$targets];
}
