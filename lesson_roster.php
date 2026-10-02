<?php
// Helpers for the effective roster of one lesson occurrence.
// Extra invitations live in class_state.json and never alter class membership.
function lessonInvitedStudents($state){
 $values=is_array($state)&&is_array($state['invitedStudents']??null)?$state['invitedStudents']:[];$out=[];
 foreach($values as $name){if(!is_string($name))continue;$name=trim($name);if($name!=='')$out[$name]=true;}
 $names=array_keys($out);sort($names,SORT_NATURAL);return $names;
}
function lessonStudentActive($student,$date){
 if(!array_key_exists('在籍期間',$student))return true;
 foreach($student['在籍期間']??[] as $period)if((empty($period['from'])||$period['from']<=$date)&&(empty($period['until'])||$date<$period['until']))return true;
 return false;
}
function lessonVisibleStudentNames($students,$directory,$date){
 $names=[];foreach($students as $student){$name=trim((string)($student['生徒名']??''));if($name===''||!empty($directory['hiddenStudents'][$name])||!lessonStudentActive($student,$date))continue;$names[$name]=true;}
 $out=array_keys($names);sort($out,SORT_NATURAL);return $out;
}
function lessonValidateInvitedStudents($value,$students,$directory,$date){
 if(!is_array($value)||array_keys($value)!==($value?range(0,count($value)-1):[])||count($value)>500)staffFail('追加招集の生徒を選び直してください。',400);
 $allowed=array_fill_keys(lessonVisibleStudentNames($students,$directory,$date),true);$out=[];
 foreach($value as $name){if(!is_string($name)||strlen($name)>300||preg_match('/[\x00-\x1f\x7f]/u',$name))staffFail('追加招集の生徒を選び直してください。',400);$name=trim($name);if($name===''||!isset($allowed[$name]))staffFail('追加招集の生徒が見つかりません。生徒管理を確認してください。',409);$out[$name]=true;}
 $names=array_keys($out);sort($names,SORT_NATURAL);return $names;
}
function lessonRosterNames($students,$directory,$class,$date,$state=[]){
 $names=[];foreach($students as $student){$name=trim((string)($student['生徒名']??''));if($name===''||($student['クラス']??'')!==$class||!empty($directory['hiddenStudents'][$name])||!lessonStudentActive($student,$date))continue;$names[$name]=true;}
 foreach(lessonInvitedStudents($state) as $name)if(empty($directory['hiddenStudents'][$name]))$names[$name]=true;
 $out=array_keys($names);sort($out,SORT_NATURAL);return $out;
}
?>
