<?php
// Daily notices stay on their own date; only rotation timing/countdown repeats.
function bgDefaultRotation(){return ['mainSeconds'=>20,'slides'=>[['kind'=>'countdown','id'=>'00000000000000000000000000000001','title'=>'試験カウントダウン','body'=>'','visible'=>true,'seconds'=>10,'image'=>null]]];}
function bgRotation($r){return ['mainSeconds'=>$r['mainSeconds']??20,'slides'=>array_values(array_filter($r['slides']??[],fn($s)=>($s['kind']??'notice')==='countdown'))];}
function bgDefaults($data,$board,$date){
 if(isset($data['defaults'][$board]))return $data['defaults'][$board];
 // Read legacy settings without migrating or overwriting production data.
 $latest='';$previous=null;
 foreach($data['days'] as $key=>$r){if(strpos($key,$board.':')!==0)continue;$d=substr($key,strlen($board)+1);if($d<=$date&&$d>$latest){$latest=$d;$previous=$r;}}
 return $previous!==null?bgRotation($previous):bgDefaultRotation();
}
function bgEffective($data,$board,$date){return $data['days'][$board.':'.$date]??bgDefaults($data,$board,$date);}
function bgStateVersion($data,$board,$date){return bgVersion([$data['days'][$board.':'.$date]??null,bgDefaults($data,$board,$date)]);}
