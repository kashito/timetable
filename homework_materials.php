<?php
// Homework materials use the existing attachment store and download endpoint.
function homeworkMaterialKey($id){
 if(!is_string($id)||!preg_match('/^(hwc_[a-f0-9]{24}|hwx_[a-f0-9]{32})$/D',$id))staffFail('宿題を確認してください',400);
 return 'HOMEWORK:'.$id;
}
function homeworkMaterialUploadValidate(){
 staffRequire();$file=$_FILES['file']??null;
 if(!is_array($file)||!is_string($file['name']??null)||!is_string($file['tmp_name']??null)||($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK)staffFail('ファイルを選び直してください',400);
 if(($file['size']??0)<=0||$file['size']>20*1024*1024)staffFail('資料は20MB以下にしてください',400);
 $ext=strtolower(pathinfo($file['name'],PATHINFO_EXTENSION));
 $types=['pdf'=>['application/pdf'],'png'=>['image/png'],'jpg'=>['image/jpeg'],'jpeg'=>['image/jpeg'],'gif'=>['image/gif'],'webp'=>['image/webp'],'txt'=>['text/plain'],'csv'=>['text/plain','text/csv','application/csv'],'docx'=>['application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/zip'],'xlsx'=>['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip'],'pptx'=>['application/vnd.openxmlformats-officedocument.presentationml.presentation','application/zip']];
 if(!isset($types[$ext])||!function_exists('finfo_open'))staffFail('PDF・画像・テキスト・Office形式の配布教材を選んでください',400);
 $info=finfo_open(FILEINFO_MIME_TYPE);$mime=finfo_file($info,$file['tmp_name']);if(PHP_VERSION_ID<80500)finfo_close($info);
 if(!in_array($mime,$types[$ext],true))staffFail('ファイルの形式と内容が一致しません',400);
 if(in_array($ext,['docx','xlsx','pptx'],true)){
  if(!class_exists('ZipArchive'))staffFail('Office資料を確認できません。PDFにして添付してください',400);
  $zip=new ZipArchive();if($zip->open($file['tmp_name'])!==true)staffFail('Office資料を確認してください',400);
  $main=['docx'=>'word/document.xml','xlsx'=>'xl/workbook.xml','pptx'=>'ppt/presentation.xml'][$ext];$valid=$zip->locateName('[Content_Types].xml')!==false&&$zip->locateName($main)!==false;$zip->close();if(!$valid)staffFail('Office資料の内容を確認してください',400);
 }
}
function homeworkMaterialMap(){
 $out=[];foreach(readJsonStrict(__DIR__.'/data/student_attachments.json') as $row){$key=(string)($row['key']??'');if(strpos($key,'HOMEWORK:')!==0)continue;$out[substr($key,9)][]=['id'=>$row['id'],'name'=>$row['name'],'size'=>$row['size']??0,'url'=>'student_file_download.php?id='.rawurlencode($row['id'])];}return $out;
}
function homeworkMaterialItems($ids,$map){$items=[];foreach(array_unique($ids) as $id)foreach($map[$id]??[] as $file)$items[$file['id']]=$file;return array_values($items);}
