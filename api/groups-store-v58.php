<?php
declare(strict_types=1);
if(!defined('HISTORY_MEMBER_API_V58')){http_response_code(404);exit;}
require_once __DIR__.'/member-store-v58.php';
function hg58_group(string $id): array {if(!preg_match('/^g[a-f0-9]{32}$/D',$id))hm58_fail('所属を確認してください。');$g=hm58_read(hm58_dir('groups').'/'.$id.'.php');if(!$g)hm58_fail('所属が見つかりません。',404);return $g;}
function hg58_save(array $g): void {hm58_write(hm58_dir('groups').'/'.$g['id'].'.php',$g);}
function hg58_admin(array $g,string $member): void {if(($g['members'][$member]['role']??'')!=='admin')hm58_fail('この所属の管理者だけが利用できます。',403);}
function hg58_index(string $id,string $group,bool $add): void {$p=hm58_dir('affiliations').'/'.$id.'.php';$v=hm58_read($p)??['groups'=>[]];$ids=array_values(array_filter($v['groups'],fn($s)=>$s!==$group));if($add)$ids[]=$group;hm58_write($p,['groups'=>$ids]);}
function hg58_mine(string $id): array {$index=hm58_read(hm58_dir('affiliations').'/'.$id.'.php')??['groups'=>[]];$rows=[];foreach($index['groups'] as $gid){$g=hg58_group($gid);$rel=$g['members'][$id]??null;if(!$rel)continue;$row=['id'=>$gid,'name'=>$g['name'],'role'=>$rel['role'],'joinedAt'=>$rel['joinedAt'],'memberCount'=>count($g['members'])];if($rel['role']==='admin')$row['inviteCode']=$g['inviteCode'];$rows[]=$row;}return $rows;}
function hg58_for_record(string $id,string $started): array {return array_values(array_map(fn($g)=>$g['id'],array_filter(hg58_mine($id),fn($g)=>strtotime($started)>=strtotime($g['joinedAt']))));}
function hg58_scope(array $record,array $scope): bool {return in_array($scope['groupId'],$record['organizationIds']??[],true)&&strtotime($record['startedAt']??'')>=strtotime($scope['joinedAt']);}
