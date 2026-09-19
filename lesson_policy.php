<?php
require_once __DIR__.'/staff_security.php';
function policyKey($r){$subs=array_values(array_filter(array_map('trim',preg_split('/[,、，]/u',(string)($r['科目']??'')))));return implode('|',[str_replace('/','-',trim((string)($r['日付']??''))),trim((string)($r['時間番号']??'')),trim((string)($r['クラス']??'')),trim((string)($r['担当講師']??'')),trim((string)($r['種別']??'')),implode('+',$subs)]);}
function policyRows(){
 $dir=__DIR__.'/data';$base=readJsonStrict($dir.'/schedule_data.json');$edits=readJsonStrict($dir.'/edited_lessons.json');$out=[];
 foreach($base['schedule']??[] as $i=>$r){$k='XLSX:'.implode('|',[$i,str_replace('-','/',$r['日付']??''),$r['時間番号']??'',$r['クラス']??'',$r['担当講師']??'']);$r=$edits[$k]??$r;if(empty($r['_deleted'])){$r['_sourceKey']=$k;$out[]=$r;}}
 foreach(readJsonStrict($dir.'/added_lessons.json') as $r){$k='ADD:'.($r['_追加ID']??'');$r=$edits[$k]??$r;if(empty($r['_deleted'])){$r['_sourceKey']=$k;$out[]=$r;}}
 $rooms=readJsonStrict($dir.'/room_overrides.json');foreach($out as &$r){$key=canonicalLessonKey(policyKey($r));if(isset($rooms[$key]['room']))$r['教室']=$rooms[$key]['room'];}unset($r);return $out;
}
function policyConflict($flag,$message){http_response_code(409);header('Content-Type: application/json; charset=utf-8');echo json_encode(['ok'=>false,$flag=>true,'error'=>$message],JSON_UNESCAPED_UNICODE);exit;}
function guardFixedLesson($key,$in){$all=readJsonStrict(__DIR__.'/data/lesson_fixed.json');$key=canonicalLessonKey($key);if(!empty($all[$key]['fixed'])&&empty($in['overrideFixed']))policyConflict('fixedConflict','この授業は「予定を固定」済みで、生徒にも固定として表示されています。それでも変更しますか？');}
function scheduleFieldsChanged($a,$b){foreach(['日付','時間番号','クラス','種別','担当講師','教室','開始','終了','科目'] as $f){$x=trim((string)($a[$f]??''));$y=trim((string)($b[$f]??''));if($f==='日付'){$x=str_replace('/','-',$x);$y=str_replace('/','-',$y);}if($x!==$y)return true;}return false;}
function guardRoomSharing($row,$source,$in){
 $room=trim((string)($row['教室']??''));if($room===''||$room==='PC'||!empty($in['overrideRoom']))return;
 $date=str_replace('/','-',$row['日付']??'');$clashes=[];
 foreach(policyRows() as $r){if(($r['_sourceKey']??'')===$source||!empty($r['日区分'])||str_replace('/','-',$r['日付']??'')!==$date||($r['教室']??'')!==$room)continue;
  $overlap=($r['時間番号']??'')===($row['時間番号']??'');
  if(!empty($r['開始'])&&!empty($r['終了'])&&!empty($row['開始'])&&!empty($row['終了']))$overlap=$r['開始']<$row['終了']&&$row['開始']<$r['終了'];
  if($overlap)$clashes[]=$r['クラス']??'授業';
 }
 if($clashes)policyConflict('roomConflict',$date.' '.$room.'教室には「'.implode('」「',array_unique($clashes)).'」があります。同じ教室で同時に指導する予定として配置しますか？');
}
