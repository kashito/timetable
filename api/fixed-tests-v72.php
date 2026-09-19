<?php
declare(strict_types=1);
// Immutable public worksheets. An unguessable URL grants read access; a separate
// browser-held secret lists only the author's own sets. No existing admin state
// or question-bank file is modified by this endpoint.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
ini_set('display_errors','0');
const HF72_HEADER="<?php http_response_code(404); exit; ?>\n";
const HF72_MAX_BYTES=4194304;
function hf72_reply(array $data,int $status=200): void {http_response_code($status);echo json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function hf72_fail(string $message,int $status=400): void {hf72_reply(['ok'=>false,'error'=>$message],$status);}
function hf72_list($v,int $min=0,int $max=10000): bool {return is_array($v)&&array_values($v)===$v&&count($v)>=$min&&count($v)<=$max;}
function hf72_string($v,int $max,bool $empty=false): bool {return is_string($v)&&($empty||trim($v)!=='')&&strlen($v)<=$max&&!preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/',$v);}
function hf72_decode(string $raw) {
    $convert=static function($v)use(&$convert){
        // Empty card dictionaries must remain {} across PHP's JSON round trip.
        if(is_object($v)){$fields=get_object_vars($v);if(!$fields)return new stdClass();$v=$fields;}
        if(is_array($v))foreach($v as $key=>$item)$v[$key]=$convert($item);
        return $v;
    };
    return $convert(json_decode($raw,false,64,JSON_THROW_ON_ERROR));
}
function hf72_tree($v,int $depth=0): void {
    if($depth>40)hf72_fail('出題セットの構造が深すぎます。');
    if(is_string($v)&&strlen($v)>250000)hf72_fail('出題セットの文章が長すぎます。');
    if(is_array($v))foreach($v as $key=>$item){
        if(in_array($key,['__proto__','constructor','prototype'],true))hf72_fail('出題セットの構造が正しくありません。');
        hf72_tree($item,$depth+1);
    }
}
function hf72_validate($doc): array {
    if(!is_array($doc)||($doc['schemaVersion']??null)!==1||($doc['packedVersion']??null)!==1||!hf72_list($doc['pointTable']??null,0,10000))hf72_fail('出題セットの形式が正しくありません。');
    hf72_tree($doc);$p=$doc['paper']??null;$s=$doc['settings']??null;
    foreach($doc['pointTable'] as $point)if(!is_array($point)||!is_numeric($point['lat']??null)||!is_numeric($point['lng']??null)||abs((float)$point['lat'])>90||abs((float)$point['lng'])>180)hf72_fail('地図データを確認してください。');
    if(!is_array($p)||!is_array($s)||!hf72_list($p['items']??null,1,300)||
      !hf72_string($p['id']??null,100)||!preg_match('/^[A-Za-z0-9_-]+$/D',$p['id'])||
      !hf72_string($p['title']??null,400)||!hf72_string($p['createdAt']??null,50)||
      ($p['types']??null)!==['visual']||($s['mode']??null)!=='visual'||($s['questionCount']??null)!==count($p['items']))hf72_fail('問題数・形式・タイトルを確認してください。');
    if(!in_array($s['studyMode']??null,['training','test'],true)||!in_array($s['answerMode']??null,['choice','handwriting','voice_choices','voice_hidden'],true)||
       !in_array($s['difficulty']??null,['none','easy','standard','hard'],true)||!in_array($s['layoutMode']??null,['auto','mobile','desktop'],true)||
       !is_int($s['count']??null)||$s['count']<2||$s['count']>10||($s['priority']??null)!=='random'||
       !(($s['choiceCount']??null)==='max'||(is_int($s['choiceCount']??null)&&$s['choiceCount']>=2&&$s['choiceCount']<=20)))hf72_fail('答案の設定を確認してください。');
    foreach(['hideYears','chronological','feedbackAudio','questionSound','readQuestion','listeningSound'] as $key)if(!is_bool($s[$key]??null))hf72_fail('表示の設定を確認してください。');
    if(!is_array($s['mapBorders']??null))hf72_fail('地図の設定を確認してください。');
    foreach(['country','prefecture'] as $key)if(!is_bool($s['mapBorders'][$key]??null))hf72_fail('地図の設定を確認してください。');
    $f=$s['filter']??null;if(!is_array($f))hf72_fail('出題範囲を確認してください。');
    foreach(['subjects','eras','categories','regions','visualGroups'] as $key){
        if(!hf72_list($f[$key]??null,1,100))hf72_fail('出題範囲を確認してください。');
        foreach($f[$key] as $value)if(!hf72_string($value,160))hf72_fail('出題範囲を確認してください。');
    }
    $seen=[];$expanded=0;$pointSizes=array_map(static function($p){return strlen(json_encode($p,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));},$doc['pointTable']);
    foreach($p['items'] as $q){
        if(!is_array($q)||($q['type']??null)!=='visual'||!hf72_string($q['id']??null,200)||
          !preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]*$/D',$q['id'])||isset($seen[$q['id']])||
          !hf72_string($q['prompt']??null,20000)||!hf72_list($q['options']??null,1,500)||!hf72_list($q['answers']??null,1,500)||
          !hf72_string($q['explanation']??null,100000,true))hf72_fail('保存する問題の内容を確認してください。');
        $seen[$q['id']]=true;
        foreach($q['options'] as $option)if(!hf72_string($option,10000))hf72_fail('選択肢を確認してください。');
        if(count(array_unique($q['answers'],SORT_REGULAR))!==count($q['answers']))hf72_fail('正解番号が重複しています。');
        foreach($q['answers'] as $answer)if(!is_int($answer)||$answer<0||$answer>=count($q['options']))hf72_fail('正解番号を確認してください。');
        if(isset($q['points'])&&(!hf72_list($q['points'],1,500)||count($q['points'])!==count($q['options'])))hf72_fail('地図の候補を確認してください。');
        foreach($q['points']??[] as $ref){if(!is_int($ref)||$ref<0||$ref>=count($doc['pointTable']))hf72_fail('地図の候補を確認してください。');$expanded+=$pointSizes[$ref];}
        if($expanded>67108864)hf72_fail('このテストの地図データが大きすぎます。問題数を減らして保存してください。',413);
        if(isset($q['shuffle'])&&(!is_array($q['shuffle'])||!is_array($q['shuffleSnapshot']??null)))hf72_fail('カードの初期配置を確認してください。');
        foreach(['handwriting','cardWork','shuffleResponse','shuffleEvaluation','shuffleSubmittedResponse','mapSelectedIndices','reviewResult'] as $private)if(array_key_exists($private,$q))hf72_fail('解答済みの記録は出題セットに保存できません。');
    }
    // Only this document shape can be stored; caller-supplied IDs/owners ignored.
    return ['schemaVersion'=>1,'packedVersion'=>1,'pointTable'=>$doc['pointTable'],'paper'=>$p,'settings'=>$s];
}
function hf72_read(string $path): array {
    $raw=file_get_contents($path);
    if($raw===false||substr($raw,0,strlen(HF72_HEADER))!==HF72_HEADER)throw new RuntimeException('store');
    $doc=hf72_decode(substr($raw,strlen(HF72_HEADER)));
    if(!is_array($doc))throw new RuntimeException('store');return $doc;
}
function hf72_write(string $path,array $value): void {
    $bytes=HF72_HEADER.json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    $temp=dirname($path).'/.write-'.bin2hex(random_bytes(12)).'.php';
    try{if(file_put_contents($temp,$bytes)!==strlen($bytes)||!rename($temp,$path))throw new RuntimeException('write');}
    finally{if(is_file($temp))unlink($temp);}
}
try{
    $method=$_SERVER['REQUEST_METHOD']??'GET';$action=$_GET['action']??'get';
    if(!in_array($action,['get','list','create'],true)||($action==='create'?$method!=='POST':$method!=='GET'))hf72_fail('この操作には対応していません。',405);
    $dir=__DIR__.'/data/fixed-tests-v72';
    if($action==='get'){
        $id=$_GET['id']??null;if(!is_string($id)||!preg_match('/^[a-f0-9]{32}$/D',$id))hf72_fail('テストのURLが正しくありません。');
        $path=$dir.'/'.$id.'.php';if(!is_file($path))hf72_fail('保存したテストが見つかりません。配布されたURLを確認してください。',404);
        $stored=hf72_read($path);hf72_reply(['ok'=>true,'test'=>$stored['test']]);
    }
    $owner=$_SERVER['HTTP_X_TEST_OWNER']??'';
    if(!is_string($owner)||!preg_match('/^[a-f0-9]{64}$/D',$owner))hf72_fail('このブラウザーの保存情報を確認できません。',403);
    $ownerHash=hash('sha256',$owner);
    if($action==='create'){
        if(strpos(strtolower($_SERVER['CONTENT_TYPE']??''),'application/json')!==0)hf72_fail('JSON形式で送信してください。',415);
        if(($_SERVER['HTTP_SEC_FETCH_SITE']??'')==='cross-site')hf72_fail('同じサイトから操作してください。',403);
        if(isset($_SERVER['HTTP_ORIGIN'])){
            $origin=parse_url($_SERVER['HTTP_ORIGIN']);$originHost=strtolower(($origin['host']??'').(isset($origin['port'])?':'.$origin['port']:''));
            $scheme=(($_SERVER['HTTPS']??'')==='on'||($_SERVER['REQUEST_SCHEME']??'')==='https')?'https':'http';
            if(($origin['scheme']??'')!==$scheme||$originHost!==strtolower($_SERVER['HTTP_HOST']??''))hf72_fail('同じサイトから操作してください。',403);
        }
        if((int)($_SERVER['CONTENT_LENGTH']??0)>HF72_MAX_BYTES)hf72_fail('テストが大きすぎます。問題数を減らしてください。',413);
        $raw=file_get_contents('php://input',false,null,0,HF72_MAX_BYTES+1);
        if($raw===false||strlen($raw)>HF72_MAX_BYTES)hf72_fail('テストが大きすぎます。問題数を減らしてください。',413);
        try{$payload=hf72_decode($raw);}catch(Throwable $e){hf72_fail('出題セットのデータが正しくありません。');}
        $doc=hf72_validate($payload);
    }
    if($action==='list'&&!is_dir($dir))hf72_reply(['ok'=>true,'sets'=>[]]);
    if(!is_dir($dir)&&!mkdir($dir,0770,true)&&!is_dir($dir))throw new RuntimeException('directory');
    $lock=fopen($dir.'/.index-lock.php','c');if(!$lock||!flock($lock,$action==='list'?LOCK_SH:LOCK_EX))throw new RuntimeException('lock');
    try{
        $indexPath=$dir.'/index.php';$index=is_file($indexPath)?hf72_read($indexPath):['version'=>1,'sets'=>[],'bytes'=>0,'recent'=>[]];
        if(($index['version']??null)!==1||!is_array($index['sets']??null)||!is_array($index['recent']??null)||!is_int($index['bytes']??null))throw new RuntimeException('index');
        $owned=array_values(array_filter($index['sets'],static function($s)use($ownerHash){return hash_equals($ownerHash,$s['owner']);}));
        if($action==='list'){
            $rows=array_reverse(array_map(static function($s){unset($s['owner'],$s['hash'],$s['bytes']);return $s;},$owned));
            $result=['ok'=>true,'sets'=>$rows];
        }else{
            $hash=hash('sha256',json_encode($doc,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));
            $duplicate=null;foreach($owned as $s)if(hash_equals($hash,$s['hash'])){$duplicate=$s;break;}
            if($duplicate){$saved=hf72_read($dir.'/'.$duplicate['id'].'.php');$result=['ok'=>true,'test'=>$saved['test']];}
            else{
                if(count($owned)>=200||count($index['sets'])>=5000)hf72_fail('保存できるテスト数の上限に達しました。サーバー管理者に確認してください。',429);
                $now=time();$ip=hash('sha256',$_SERVER['REMOTE_ADDR']??'unknown');
                $index['recent']=array_values(array_filter($index['recent'],static function($r)use($now){return $r['at']>$now-3600;}));
                $recent=array_filter($index['recent'],static function($r)use($ip){return $r['ip']===$ip;});
                if(count($recent)>=60)hf72_fail('短時間に多くのテストを作成しています。時間をおいて再試行してください。',429);
                do{$id=bin2hex(random_bytes(16));$path=$dir.'/'.$id.'.php';}while(file_exists($path));
                $savedAt=gmdate('c');$test=$doc+['id'=>$id,'savedAt'=>$savedAt];$stored=['test'=>$test];
                $bytes=strlen(HF72_HEADER.json_encode($stored,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR));
                if($index['bytes']+$bytes>268435456)hf72_fail('テスト保存領域がいっぱいです。サーバー管理者に確認してください。',507);
                hf72_write($path,$stored);
                $index['sets'][]=['id'=>$id,'owner'=>$ownerHash,'hash'=>$hash,'title'=>$doc['paper']['title'],'paperId'=>$doc['paper']['id'],'savedAt'=>$savedAt,'count'=>count($doc['paper']['items']),'bytes'=>$bytes];
                $index['bytes']+=$bytes;$index['recent'][]=['ip'=>$ip,'at'=>$now];
                try{hf72_write($indexPath,$index);}catch(Throwable $e){unlink($path);throw $e;}
                $result=['ok'=>true,'test'=>$test];
            }
        }
    }finally{flock($lock,LOCK_UN);fclose($lock);}
    hf72_reply($result);
}catch(Throwable $e){error_log('Fixed test storage: '.$e->getMessage());hf72_fail('出題セットを保存・読み込みできません。api/data の書き込み設定と空き容量を確認してください。既存のテストは保持しています。',500);}
