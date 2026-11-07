<?php
// Called by the authenticated shared-notes API, under the existing atomic-write lock.
function snStaff(){static $staff=null;if($staff===null){$staff=[];foreach(staffAccounts() as $id=>$u)if(!empty($u['active']))$staff[]=['id'=>(string)$id,'name'=>$u['name'],'role'=>$u['role']];}return $staff;}
function snClassRecipients($class){static $classes=null;if($classes===null){$classes=[];foreach(policyRows() as $r){$cls=snClass($r['クラス']??'');$date=str_replace('/','-',$r['日付']??'');if($cls!==''&&empty($r['日区分']))$classes[$cls][]=[$date,trim($r['担当講師']??'')];}}$rows=$classes[$class]??[];$future=array_values(array_filter($rows,fn($r)=>$r[0]>=date('Y-m-d')));if($future)$rows=$future;elseif($rows){$last=max(array_column($rows,0));$rows=array_values(array_filter($rows,fn($r)=>$r[0]===$last));}$names=array_unique(array_column($rows,1));$ids=[];foreach(snStaff() as $u)if(in_array($u['name'],$names,true)||((!$names||in_array('',$names,true))&&$u['role']==='admin'))$ids[]=$u['id'];if(!$ids)foreach(snStaff() as $u)if($u['role']==='admin')$ids[]=$u['id'];return $ids;}
function snTargets($in,$class){$ids=$in['assigneeIds']??null;if($ids===null)return snClassRecipients($class);if(!is_array($ids)||!$ids||count($ids)>100)staffFail('担当者を選んでください。',400);$valid=array_column(snStaff(),'id');foreach($ids as $id)if(!is_string($id)||!in_array($id,$valid,true))staffFail('担当者が変更されています。再読み込みしてください。',400);return array_values(array_unique($ids));}
function snMine($r){global $actor;return in_array($actor['id'],$r['recipientIds']??[],true);}
function snCanManage($r){global $actor;return $actor['role']==='admin'||($r['authorId']??'')===$actor['id'];}
function snExtraProjection($r){global $actor;$r['todo']=!empty($r['todo']);$r['mine']=snMine($r);$r['unread']=$r['mine']&&empty($r['done'])&&empty($r['reads'][$actor['id']]);$r['canComplete']=$actor['role']==='admin'||!$r['todo']||$r['mine'];$r['canManage']=snCanManage($r);$staff=array_column(snStaff(),null,'id');$r['assignees']=array_map(fn($id)=>['id'=>$id,'name'=>$staff[$id]['name']??($r['recipientNames'][$id]??'以前の担当者')],$r['recipientIds']??[]);return $r;}
function snInbox(){global $data;$items=[];foreach($data['notes'] as $r){$r['className']=snClass($r['className']);$items[]=snProjection($r);}return $items;}
function snRecipientNames($ids){$names=[];foreach(snStaff() as $u)if(in_array($u['id'],$ids,true))$names[$u['id']]=$u['name'];return $names;}

// Read-only history projection. Never migrate old text or invent its author/date.
function snVirtualNotes(){
 global $data;$legacy=[];
 foreach(readJsonStrict(__DIR__.'/data/class_state.json') as $key=>$state){
  if(strpos((string)$key,'__CLASS_MEMO__|')!==0)continue;
  $class=snClass(substr($key,15));$text=trim((string)($state['teacherMemo']??''));
  if($class!==''&&$text!=='')$legacy[$class][$text]=true;
 }
 foreach(readJsonStrict(__DIR__.'/data/class_memos.json') as $class=>$text){
  $class=snClass((string)$class);
  if($class!==''&&is_string($text)&&trim($text)!=='')$legacy[$class][trim($text)]=true;
 }
 $stored=[];foreach($data['notes'] as $note)if(!empty($note['legacy']))$stored[snClass($note['className'])][(string)$note['text']]=true;
 $virtual=[];foreach($legacy as $class=>$texts)foreach(array_keys($texts) as $text){
  $text=(string)$text;if(isset($stored[$class][$text]))continue;
  $id='legacy_'.hash('sha256',$class.'|'.$text);
  $virtual[$id]=['id'=>$id,'className'=>$class,'text'=>$text,'legacy'=>true,'author'=>null,'authorId'=>null,'createdAt'=>null,'done'=>false,'completionHistory'=>[]];
 }
 return $virtual;
}
function snTimeline(){
 global $data;$out=[];$staff=array_column(snStaff(),null,'id');
 foreach(array_merge(snVirtualNotes(),$data['notes']) as $note){
  $names=[];foreach($note['recipientIds']??[] as $id)$names[]=$staff[$id]['name']??($note['recipientNames'][$id]??'以前の担当者');
  $out[]=['id'=>$note['id'],'className'=>snClass($note['className']),'text'=>$note['text'],
   'author'=>$note['author']??null,'createdAt'=>$note['createdAt']??null,'legacy'=>!empty($note['legacy']),
   'todo'=>!empty($note['todo']),'done'=>!empty($note['done']),'doneAt'=>$note['doneAt']??null,
   'doneBy'=>$note['doneBy']??null,'assigneeNames'=>array_values(array_unique($names))];
 }
 return $out;
}
