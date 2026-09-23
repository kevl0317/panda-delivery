// Portable progress only: importing never changes the receiving player's sound setting.
function parseProgressFile(text){
 let data;try{data=JSON.parse(text);}catch{throw new Error('文件无法读取，请选择导出的 JSON 存档。');}
 if(!data||data.game!=='panda-delivery'||data.version!==1||!data.best||typeof data.best!=='object'||Array.isArray(data.best))throw new Error('这不是支持的熊猫快递局存档。');
 const best={},entries=Object.entries(data.best);
 if(entries.length>25)throw new Error('存档中的关卡记录不正确。');
 for(const [level,record] of entries){
  if(!/^(?:[1-9]|1\d|2[0-5])$/.test(level)||!record||!Number.isInteger(record.stars)||record.stars<1||record.stars>3||!Number.isInteger(record.score)||record.score<0||record.score>100)throw new Error('存档中的成绩不正确，原有进度未修改。');
  best[level]={stars:record.stars,score:record.score};
 }
 return best;
}
function progressNotice(message){
 const status=document.getElementById('saveStatus');if(status)status.textContent=message;
}
function exportProgress(){
 const data={game:'panda-delivery',version:1,exportedAt:new Date().toISOString(),best:save.best};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=`熊猫快递局存档-${Object.keys(save.best).length}站-${new Date().toISOString().slice(0,10)}.json`;
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 progressNotice('已导出存档，把下载的文件发给测试者即可。');
}
async function importProgress(file){
 if(!file)return;
 const revision=++progressRevision;
 try{
  if(file.size>100*1024)throw new Error('文件过大，请选择熊猫快递局导出的存档。');
  const text=await file.text();if(revision!==progressRevision)return;
  const imported=parseProgressFile(text),best={...save.best};
  for(const [level,record] of Object.entries(imported)){
   const old=best[level];best[level]=old?{stars:Math.max(old.stars,record.stars),score:Math.max(old.score,record.score)}:record;
  }
  const merged={...save,best};
  // Commit only after storage succeeds; a rejected file never changes progress.
  try{localStorage.setItem('panda-post-v1',JSON.stringify(merged));}catch{throw new Error('浏览器未能保存存档，原有进度未修改。请检查存储权限后重试。');}
  save=merged;home();progressNotice(`导入成功！已抵达 ${Object.keys(best).length} / 25 站，已保留更高成绩。`);
 }catch(error){if(revision===progressRevision)progressNotice(error.message||'导入失败，原有进度未修改。');}
}
function bindProgressTransfer(){
 document.getElementById('exportSaveBtn').onclick=exportProgress;
 const input=document.getElementById('importSaveFile');
 document.getElementById('importSaveBtn').onclick=()=>input.click();
 input.onchange=()=>{const file=input.files[0];input.value='';void importProgress(file);};
}
