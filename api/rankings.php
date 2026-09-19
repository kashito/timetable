<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
ini_set('display_errors', '0');
const STORE_HEADER = "<?php http_response_code(404); exit; ?>\n";
function reply(array $data, int $status=200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(string $message, int $status=400): void { reply(['ok'=>false,'error'=>$message],$status); }
function integer($value, int $min, int $max): bool { return is_int($value) && $value >= $min && $value <= $max; }
function string_list($value, array $allowed): array {
    if (!is_array($value) || !$value || count($value)>count($allowed)) fail('出題条件が正しくありません。');
    foreach ($value as $entry) if (!is_string($entry) || !in_array($entry,$allowed,true)) fail('出題条件が正しくありません。');
    if (count(array_unique($value))!==count($value)) fail('出題条件が重複しています。');
    sort($value,SORT_STRING);return array_values($value);
}
function normalize_config($c): array {
    if (!is_array($c)) fail('出題条件がありません。');
    // v52: keep the practice and ranking genre sets in sync.
    $historyGroups=['人物','建造物','場所','資料','戦い','その他','一問一答','条約・法律'];
    $geographyGroups=['国','都道府県','首都','県庁所在地','港','世界遺産','伝統工芸','名産','産業','祭・行事','地理資料','国の連想','地形'];
    $modes=['order','quiz','select','odd','visual'];
    if (!in_array($c['mode']??null,$modes,true) || !integer($c['questionCount']??null,1,300) || !integer($c['cardCount']??null,2,10)) fail('問題形式・問題数が正しくありません。');
    if (!is_string($c['bank']??null) || !preg_match('/^[a-f0-9]{8}$/D',$c['bank'])) fail('問題集の識別情報が正しくありません。');
    $f=$c['filter']??[];
    if(!is_array($f))fail('出題条件が正しくありません。');
    $subjects=$c['mode']==='visual'?string_list(array_key_exists('subjects',$f)?$f['subjects']:['歴史'],['歴史','地理','数学','理科','英語','国語','公民','その他']):['歴史'];
    if($subjects===['地理'])foreach(['eras'=>['地理（現代）'],'categories'=>['地理']] as $field=>$active){
        if(($f[$field]??null)===[])$f[$field]=$active;
    }
    $priority=$c['priority']??'random';if(!in_array($priority,['random','personal_wrong','personal_low','personal_high','global_low','global_high','favorites','unanswered'],true))fail('出題の優先設定が正しくありません。');
    $normalized=['mode'=>$c['mode'],'questionCount'=>$c['questionCount'],'cardCount'=>$c['mode']==='order'?$c['cardCount']:4,'bank'=>$c['bank'],'filter'=>[
      'eras'=>string_list($f['eras']??null,['原始・古代','飛鳥','奈良','平安','鎌倉','室町','安土桃山','江戸','明治','大正','昭和（戦前）','昭和（戦後）','平成・令和','世界（古代）','世界（中世）','世界（近世）','世界（近代）','世界（現代）','地理（現代）']),
      'categories'=>string_list($f['categories']??null,['できごと','法律','政治','戦い','文化','外交','経済・社会','地理']),
      'regions'=>string_list($f['regions']??null,['日本','世界']),
      'visualGroups'=>$c['mode']==='visual'?string_list($f['visualGroups']??null,array_merge($historyGroups,$geographyGroups,['追加問題'])):['人物','建造物','場所','資料']
    ]];
    if($c['mode']==='visual'&&($c['chronological']??false)===true)$priority='random';
    if($priority!=='random')$normalized['priority']=$priority;
    $answerMode=$c['answerMode']??'choice';if(!in_array($answerMode,['choice','voice_choices','voice_hidden','handwriting'],true)||($answerMode!=='choice'&&!in_array($c['mode'],['quiz','odd','visual'],true)))fail('解答方法が正しくありません。');
    if($answerMode!=='choice')$normalized['answerMode']=$answerMode;
    if(!in_array($c['studyMode']??'training',['training','test'],true))fail('学習モードが正しくありません。');
    if(($c['studyMode']??'training')==='test')$normalized['studyMode']='test';
    if($c['mode']==='visual'&&array_key_exists('choiceCount',$c)){if($c['choiceCount']!=='max'&&!integer($c['choiceCount'],2,20))fail('選択肢は2〜20個または「最大」を選択してください。');$normalized['choiceCount']=$c['choiceCount'];}
    // Optional v19 study conditions only distinguish boards when enabled.
    // Omitted/false flags retain every older board fingerprint.
    if($c['mode']==='visual')foreach(['hideYears','chronological'] as $flag){
        if(array_key_exists($flag,$c)&&!is_bool($c[$flag]))fail('年号・出題順の設定が正しくありません。');
        if(($c[$flag]??false)===true)$normalized[$flag]=true;
    }
    // v20 defaults retain old board keys; selected geography and nonstandard
    // difficulty form separate boards without changing any existing records.
    if($c['mode']==='visual'){
        if($subjects!==['歴史'])$normalized['filter']['subjects']=$subjects;
        else {
            // Geography filters are dormant in a history-only test. Removing
            // their newly added defaults keeps custom historical boards stable.
            foreach(['eras'=>['地理（現代）'],'categories'=>['地理'],'visualGroups'=>$geographyGroups] as $field=>$unused){
                $normalized['filter'][$field]=array_values(array_diff($normalized['filter'][$field],$unused));
                if(!$normalized['filter'][$field])fail('歴史の出題範囲を選択してください。');
            }
        }
        if($subjects===['地理']){
            $normalized['filter']['eras']=['地理（現代）'];
            $normalized['filter']['categories']=['地理'];
            $normalized['filter']['visualGroups']=array_values(array_intersect($normalized['filter']['visualGroups'],array_merge($geographyGroups,['追加問題'])));
            if(!$normalized['filter']['visualGroups'])fail('地理の出題範囲を選択してください。');
        }
        $difficulty=array_key_exists('difficulty',$c)?$c['difficulty']:'standard';
        if(!in_array($difficulty,['none','easy','standard','hard'],true))fail('難易度の設定が正しくありません。');
        if($difficulty!=='standard')$normalized['difficulty']=$difficulty;
    }
    $units=[];
    if(array_key_exists('units',$f)){
        $units=$f['units'];
        if(!is_array($units)||(array_values($units)!==$units)||count($units)>2000)fail('カテゴリーの設定を確認してください。');
        foreach($units as $unit)if(!is_string($unit)||trim($unit)===''||strlen($unit)>400)fail('カテゴリーの設定を確認してください。');
        if(count(array_unique($units))!==count($units))fail('カテゴリーが重複しています。');
        if(isset($f['unit'])&&$f['unit']!==''&&(count($units)!==1||$units[0]!==$f['unit']))fail('カテゴリーの設定が一致しません。');
        $f['unit']=count($units)===1?$units[0]:'';
    }
    foreach(['grade'=>160,'unit'=>400,'answerFormat'=>40] as $field=>$limit)if(isset($f[$field])&&$f[$field]!==''){if(!is_string($f[$field])||strlen($f[$field])>$limit||($field==='answerFormat'&&!in_array($f[$field],['single','sequence','unordered'],true)))fail('学年・単元・解答形式を確認してください。');$normalized['filter'][$field]=$f[$field];}
    if(count($units)>1){sort($units,SORT_STRING);$normalized['filter']['units']=$units;}
    if(array_key_exists('fixedSetId',$c)){
        $setId=$c['fixedSetId'];if(!is_string($setId)||!preg_match('/^[a-f0-9]{32}$/D',$setId))fail('固定テストのIDを確認してください。');
        $path=__DIR__.'/data/fixed-tests-v72/'.$setId.'.php';
        if(!is_file($path))fail('保存したテストが見つかりません。',404);
        $raw=file_get_contents($path);if($raw===false||substr($raw,0,strlen(STORE_HEADER))!==STORE_HEADER)fail('保存したテストを確認できません。',500);
        $saved=json_decode(substr($raw,strlen(STORE_HEADER)),true);$settings=$saved['test']['settings']??null;
        if(!is_array($settings)||$c['questionCount']!==$settings['questionCount']||$c['mode']!==$settings['mode']||($c['studyMode']??'training')!==$settings['studyMode'])fail('固定テストの設定が一致しません。');
        $normalized['fixedSetId']=$setId;
    }
    return $normalized;
}
function read_store(string $path): array {
    if (!file_exists($path)) return ['version'=>1,'boards'=>[],'attempts'=>[],'results'=>[]];
    $raw=file_get_contents($path);
    if ($raw===false || substr($raw,0,strlen(STORE_HEADER))!==STORE_HEADER) throw new RuntimeException('保存データを読み込めません。既存の記録は変更していません。');
    $state=json_decode(substr($raw,strlen(STORE_HEADER)),true);
    if (!is_array($state) || ($state['version']??null)!==1 || !is_array($state['results']??null) || !is_array($state['attempts']??null) || !is_array($state['boards']??null)) throw new RuntimeException('保存データを読み込めません。既存の記録は変更していません。');
    return $state;
}
function atomic_write(string $path, string $bytes): void {
    $tmp=dirname($path).'/.write-'.bin2hex(random_bytes(12)).'.php';
    try {
        if (file_put_contents($tmp,$bytes)!==strlen($bytes)) throw new RuntimeException('記録を書き込めません。サーバーの空き容量・書き込み設定を確認してください。');
        if (!rename($tmp,$path)) throw new RuntimeException('記録を更新できませんでした。もう一度お試しください。');
    } finally { if (is_file($tmp)) unlink($tmp); }
}
function save_store(string $path,array $state): void {
    $json=json_encode($state,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR);
    if (is_file($path)) { $previous=file_get_contents($path);if($previous===false)throw new RuntimeException('バックアップを読めません。既存の記録は変更していません。');atomic_write(dirname($path).'/rankings-backup.php',$previous); }
    atomic_write($path,STORE_HEADER.$json);
}
function ranked(array $records,string $board): array {
    $rows=array_values(array_filter($records,static function($r)use($board){return $r['board']===$board;}));
    usort($rows,static function($a,$b){
        $score=$b['correct']*$a['total']-$a['correct']*$b['total'];
        if($score!==0)return $score<=>0;
        return ($a['elapsedMs']<=>$b['elapsedMs']) ?: strcmp($a['completedAt'],$b['completedAt']) ?: strcmp($a['id'],$b['id']);
    });
    return $rows;
}
try {
    $method=$_SERVER['REQUEST_METHOD']??'GET';$action=$_GET['action']??'boards';
    if (!in_array($method,['GET','POST'],true)) fail('対応していない操作です。',405);
    if ($method==='POST') {
        $origin=$_SERVER['HTTP_ORIGIN']??'';
        if($origin!=='') { $parts=parse_url($origin);$host=strtolower(($parts['host']??'').(isset($parts['port'])?':'.$parts['port']:''));if($host!==strtolower($_SERVER['HTTP_HOST']??'')||($parts['scheme']??'')!==((($_SERVER['HTTPS']??'')==='on'||($_SERVER['REQUEST_SCHEME']??'')==='https')?'https':'http'))fail('このページからは記録できません。',403); }
        if (stripos($_SERVER['CONTENT_TYPE']??'','application/json')!==0) fail('JSON形式で送信してください。',415);
        $raw=file_get_contents('php://input',false,null,0,32769);
        if ($raw===false || strlen($raw)>32768) fail('送信データが大きすぎます。',413);
        $body=json_decode($raw,true);if (!is_array($body)) fail('送信データが正しくありません。');
    }
    $directory=__DIR__.'/data';
    if (!is_dir($directory) && !mkdir($directory,0750,true) && !is_dir($directory)) throw new RuntimeException('記録フォルダを作成できません。サーバーの書き込み設定を確認してください。');
    $lock=fopen($directory.'/lock.php','c+');
    if(!$lock || !flock($lock,LOCK_EX))throw new RuntimeException('記録ファイルが使用中です。もう一度お試しください。');
    if(filesize($directory.'/lock.php')===0)fwrite($lock,STORE_HEADER);
    $path=$directory.'/rankings-store.php';$state=read_store($path);$now=microtime(true);$response=[];
    if ($method==='POST' && $action==='start') {
        $name=$body['username']??null;
        if(!is_string($name) || !preg_match('/\A[^\p{C}\r\n]{1,20}\z/u',trim($name)))fail('ユーザー名は1〜20文字で入力してください。');
        $name=trim($name);$config=normalize_config($body['config']??null);$total=$body['total']??null;
        if(!integer($total,$config['questionCount'],isset($config['fixedSetId'])?$config['questionCount']:($config['mode']==='visual'?$config['questionCount']*2:$config['questionCount'])))fail('採点する問題数が正しくありません。');
        foreach($state['attempts'] as $key=>$attempt)if($now-$attempt['startedAt']>2592000)unset($state['attempts'][$key]);
        if(count($state['attempts'])>=10000)fail('ただいま記録テストが混み合っています。時間をおいてお試しください。',429);
        $config['total']=$total;
        $board=hash('sha256',json_encode($config,JSON_UNESCAPED_UNICODE));$token=bin2hex(random_bytes(24));$id=bin2hex(random_bytes(12));
        $state['attempts'][$token]=['id'=>$id,'username'=>$name,'config'=>$config,'board'=>$board,'total'=>$total,'startedAt'=>$now];
        save_store($path,$state);$response=['ok'=>true,'token'=>$token,'attemptId'=>$id,'board'=>$board];
    } elseif ($method==='POST' && $action==='finish') {
        $token=$body['token']??'';
        if(!is_string($token)||!preg_match('/^[a-f0-9]{48}$/D',$token))fail('記録テストの情報が正しくありません。');
        $receipt=hash('sha256',$token);
        $existing=null;foreach($state['results'] as $result)if(($result['receipt']??'')===$receipt){$existing=$result;break;}
        if($existing){$row=$existing;}
        else {
            $attempt=$state['attempts'][$token]??null;if(!$attempt)fail('開始記録が見つかりません。テストを最初から開始してください。',409);
            if($now-$attempt['startedAt']>2592000)fail('記録の再送期限（30日）が過ぎました。',409);
            $correct=$body['correct']??null;$elapsed=$body['elapsedMs']??null;$skipped=$body['skipped']??null;
            if(!integer($correct,0,$attempt['total'])||!integer($skipped,0,$attempt['total']-$correct)||!integer($elapsed,0,86400000)||$elapsed>($now-$attempt['startedAt'])*1000+1000)fail('結果の値が正しくありません。');
            $policy=$body['priorityPolicy']??($attempt['config']['priority']??'random');
            if($policy!=='mixed'&&$policy!==($attempt['config']['priority']??'random'))fail('出題の優先設定が正しくありません。');
            $answerMode=$body['answerModePolicy']??($attempt['config']['answerMode']??'choice');
            if($answerMode!=='mixed'&&$answerMode!==($attempt['config']['answerMode']??'choice'))fail('解答方法が正しくありません。');
            if($policy==='mixed'||$answerMode==='mixed'){
                $fixedTotal=$attempt['config']['total'];unset($attempt['config']['total'],$attempt['config']['priority'],$attempt['config']['answerMode']);
                if($policy!=='random')$attempt['config']['priority']=$policy;
                if($answerMode!=='choice')$attempt['config']['answerMode']=$answerMode;
                $attempt['config']['total']=$fixedTotal;$attempt['board']=hash('sha256',json_encode($attempt['config'],JSON_UNESCAPED_UNICODE));
            }
            $row=['id'=>$attempt['id'],'receipt'=>$receipt,'board'=>$attempt['board'],'username'=>$attempt['username'],'correct'=>$correct,'total'=>$attempt['total'],'skipped'=>$skipped,'elapsedMs'=>$elapsed,'completedAt'=>gmdate('Y-m-d\TH:i:s\Z',(int)floor($attempt['startedAt']+$elapsed/1000))];
            $state['boards'][$row['board']]=$attempt['config'];$state['results'][]=$row;unset($state['attempts'][$token]);save_store($path,$state);
        }
        $rows=ranked($state['results'],$row['board']);$rank=1;foreach($rows as $i=>$r)if($r['id']===$row['id']){$rank=$i+1;break;}
        unset($row['receipt']);$response=['ok'=>true,'record'=>$row,'rank'=>$rank,'participants'=>count($rows)];
    } elseif ($method==='GET' && $action==='boards') {
        $boards=[];foreach($state['boards'] as $key=>$config){$rows=ranked($state['results'],$key);$boards[]=['key'=>$key,'config'=>$config,'count'=>count($rows),'latest'=>max(array_column($rows,'completedAt'))];}
        usort($boards,static function($a,$b){return strcmp($b['latest'],$a['latest']);});$response=['ok'=>true,'boards'=>$boards];
    } elseif ($method==='GET' && $action==='list') {
        $board=$_GET['board']??'';if(!is_string($board)||!preg_match('/^[a-f0-9]{64}$/D',$board))fail('ランキングの条件を選んでください。');
        $page=max(1,(int)($_GET['page']??1));$rows=ranked($state['results'],$board);$pages=max(1,(int)ceil(count($rows)/50));$page=min($page,$pages);
        $result=[];foreach(array_slice($rows,($page-1)*50,50) as $i=>$r){unset($r['receipt']);$r['rank']=($page-1)*50+$i+1;$result[]=$r;}
        $response=['ok'=>true,'rows'=>$result,'page'=>$page,'pages'=>$pages,'count'=>count($rows),'config'=>$state['boards'][$board]??null];
    } else fail('対応していない操作です。',405);
    flock($lock,LOCK_UN);fclose($lock);reply($response);
} catch (Throwable $e) { error_log('History ranking: '.$e->getMessage());reply(['ok'=>false,'error'=>$e instanceof RuntimeException?$e->getMessage():'記録処理に失敗しました。既存の記録は保持しています。'],500); }
