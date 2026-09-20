'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process');
const root=path.resolve(process.argv[2]),php=process.argv[3];
const counts={php:0,javascript:0,inline:0},errors=[];
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 if(['data','sessions','.git','vendor'].includes(entry.name))continue;
 const file=path.join(dir,entry.name);if(entry.isDirectory()){scan(file);continue;}if(!entry.isFile())throw Error('Unexpected file type');
 const name=path.relative(root,file).replaceAll('\\','/');
 if(entry.name.endsWith('.js')){try{new vm.Script(fs.readFileSync(file,'utf8'),{filename:name});counts.javascript++;}catch{errors.push(name+': JavaScript syntax');}}
 if(/\.(html|php)$/.test(entry.name))for(const m of fs.readFileSync(file,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(/\bsrc\s*=/.test(m[1])||/type\s*=\s*["'](?:application\/json|importmap)/i.test(m[1])||!m[2].trim())continue;
  // PHP-generated JSON is a JavaScript expression, not literal PHP in the browser.
  // Only normalize json_encode expressions; PHP itself is checked separately by -l.
  // Other dynamic templates stay fail-closed and require a rendered-page review.
  const code=m[2].replace(/<\?=\s*json_encode\([\s\S]*?\)\s*\?>/g,'null');
  try{new vm.Script(code,{filename:name});counts.inline++;}catch{errors.push(name+': inline JavaScript syntax');}
 }
 if(entry.name.endsWith('.php')){const result=cp.spawnSync(php,['-l',file],{encoding:'utf8',windowsHide:true,timeout:15000});if(result.status===0)counts.php++;else errors.push(name+': PHP syntax');}
}}
scan(root);console.log(JSON.stringify({counts,errors}));if(errors.length)process.exit(1);
