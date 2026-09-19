<?php
declare(strict_types=1);
if(!defined('HISTORY_CARD_STATS_V61')){http_response_code(404);exit;}
const HC61_PREFIX="<?php http_response_code(404); exit; ?>\n";
function hc61_dir(): string {$dir=__DIR__.'/data/card-stats-v61';if(!is_dir($dir)&&!@mkdir($dir,0750,true)&&!is_dir($dir))throw new RuntimeException('集計を保存できません。');return $dir;}
function hc61_read(string $file): ?array {if(!is_file($file))return null;$s=file_get_contents($file);if($s===false||!str_starts_with($s,HC61_PREFIX))throw new RuntimeException('集計の保存内容を確認してください。');$value=json_decode(substr($s,strlen(HC61_PREFIX)),true);if(!is_array($value))throw new RuntimeException('集計の保存内容を確認してください。');return $value;}
function hc61_write(string $file,array $value): void {$temp=$file.'.pending-'.bin2hex(random_bytes(8)).'.php';if(file_put_contents($temp,HC61_PREFIX.json_encode($value,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),LOCK_EX)===false)throw new RuntimeException('集計を保存できません。');@chmod($temp,0640);if(!rename($temp,$file)){@unlink($temp);throw new RuntimeException('集計を更新できません。');}}
function hc61_key(string $question,string $fingerprint): string {return hash('sha256',$question."\0".$fingerprint);}
function hc61_add(array $r,string $scope,bool $display=false): void {
 if(($r['answerMode']??'')!=='cards'&&!(($r['answerMode']??'')==='handwriting'&&is_array($r['cardWork']??null)))return;
 $question=$r['questionId']??'';$fingerprint=$r['questionFingerprint']??'';
 if(!is_string($question)||!is_string($fingerprint)||!preg_match('/^[A-Za-z0-9-]{3,100}$/D',$question)||!preg_match('/^q53-[a-f0-9]{8}$/D',$fingerprint))return;
 $dir=hc61_dir();$key=hc61_key($question,$fingerprint);$file=$dir.'/'.$key.'.php';$lock=fopen($dir.'/'.$key.'-lock.php','c+');if(!$lock||!flock($lock,LOCK_EX))throw new RuntimeException('集計待ちです。');
 try{$data=hc61_read($file)??['version'=>1,'shown'=>0,'answered'=>0,'correct'=>0,'attempts'=>[]];$id=hash('sha256',$scope."\0".$r['id']);$old=$data['attempts'][$id]??null;$revision=$display?-1:(int)($r['revision']??0);
  if($old!==null&&$old['revision']>=$revision)return;
  $right=!$display&&($r['reason']??'')==='answer'&&is_bool($r['right']??null)?$r['right']:null;
  if($old===null)$data['shown']++;elseif(is_bool($old['right'])){$data['answered']--;if($old['right'])$data['correct']--;}
  if(is_bool($right)){$data['answered']++;if($right)$data['correct']++;}
  $data['attempts'][$id]=['revision'=>$revision,'right'=>$right];hc61_write($file,$data);
 }finally{flock($lock,LOCK_UN);fclose($lock);}
}
// Backfill existing records in bounded batches. New records are indexed as they save.
function hc61_backfill(int $limit=300): bool {
 $dir=hc61_dir();$file=$dir.'/migration.php';$state=hc61_read($file);if(($state['complete']??false)===true)return true;
 $lock=fopen($dir.'/migration-lock.php','c+');if(!$lock||!flock($lock,LOCK_EX|LOCK_NB)){if($lock)fclose($lock);return false;}
 try{$state=hc61_read($file)??['cursor'=>'','complete'=>false];if($state['complete'])return true;$files=[];
  foreach(['data/learning-v53/*/*.php','data/members-v58/records/*/*.php'] as $pattern)foreach(glob(__DIR__.'/'.$pattern)?:[] as $path){$base=basename($path,'.php');if(preg_match('/^[A-Za-z0-9-]{16,80}$/D',$base)&&!str_starts_with($base,'pending-'))$files[]=$path;}
  sort($files,SORT_STRING);$n=0;$started=microtime(true);$complete=true;
  foreach($files as $path){if(strcmp($path,$state['cursor'])<=0)continue;if($n>=$limit||($n>0&&microtime(true)-$started>1.5)){$complete=false;break;}$r=hc61_read($path);if($r){$scope=str_contains($path,'/members-v58/records/')?'member:'.basename(dirname($path)):'visitor:'.basename(dirname($path));hc61_add($r,$scope);}$state['cursor']=$path;$n++;}
  $state['complete']=$complete;hc61_write($file,$state);return $complete;
 }finally{flock($lock,LOCK_UN);fclose($lock);}
}
function hc61_summary(string $question,string $fingerprint): array {$data=hc61_read(hc61_dir().'/'.hc61_key($question,$fingerprint).'.php');return ['shown'=>(int)($data['shown']??0),'answered'=>(int)($data['answered']??0),'correct'=>(int)($data['correct']??0)];}
