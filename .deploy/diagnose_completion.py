"""Optional read-only production diagnostic over the existing pinned deployment SSH."""
import deploy

SOURCE = r'''
import hashlib,json,pathlib,re
root=pathlib.Path('/home/users/0/lolipop.jp-dp30304343/web/2026summer/data')
def read(name):
 p=root/name
 if not p.is_file():return {}
 text=p.read_text(encoding='utf8')
 if text.startswith('<?php exit; ?>'):text=text[14:]
 return json.loads(text)
records=read('lesson_records.json');all_records=[]
def visit(key,record):
 if not isinstance(record,dict):return
 all_records.append((key,record))
 for field in ('sourceRecords','recordHistory'):
  for old_key,old in record.get(field,{}).items():visit(old_key,old)
for key,record in records.items():visit(key,record)
checks={}
for key,record in all_records:
 for identity,value in record.get('homeworkChecks',{}).items():
  if (value.get('checked',False) if isinstance(value,dict) else value):checks[identity]=True
sources=[(key,record)for key,record in all_records if 'P18.19' in record.get('homework','')]
result={'checkedTaskCount':len(checks),'topLevelCheckedCount':sum(1 for r in records.values()for v in r.get('homeworkChecks',{}).values()if(v.get('checked',False)if isinstance(v,dict)else v)), 'sourceRecords':[]}
for key,record in sources:
 lines=[line.strip()for line in record.get('homework','').splitlines()if line.strip()]
 matched=[]
 for identity in set([key,record.get('eventKey',key)]):
  matches=[]
  for text in lines:
   found=[]
   for index in range(2000):
    task='hw_'+hashlib.sha256((identity+'\0'+str(index)+'\0'+text).encode()).hexdigest()[:24]
    if task in checks:found.append(index)
   matches.append(found)
  matched.append(matches)
 result['sourceRecords'].append({'keyHash':hashlib.sha256(key.encode()).hexdigest()[:12],'eventIdentityDifferent':record.get('eventKey',key)!=key,'lineCount':len(lines),'matchedCheckIndices':matched,'nested':key not in records,'sourceArchiveCount':len(record.get('sourceRecords',{}))})
result['checkIdFormats']={prefix:sum(k.startswith(prefix)for k in checks)for prefix in ('hw_','hwlocal-','hwc_')}
print(json.dumps(result))
'''
print(deploy.run_remote_python(SOURCE.encode('utf8')).decode('utf8'))
