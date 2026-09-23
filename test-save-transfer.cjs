const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/24510/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const source=await browser.newPage({reducedMotion:'reduce'});
  const url=pathToFileURL(path.resolve(__dirname,'index.html')).href;
  await source.goto(url);
  await source.evaluate(()=>{for(let i=1;i<=25;i++)save.best[i]={stars:2,score:92};save.sound=true;persist();home();});
  const downloaded=source.waitForEvent('download');await source.click('#exportSaveBtn');const download=await downloaded;
  assert.ok(download.suggestedFilename().includes('25站'));
  const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);
  const buffer=Buffer.concat(chunks),data=JSON.parse(buffer.toString());
  assert.equal(Object.keys(data.best).length,25);assert.equal(data.sound,undefined);
  const target=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const errors=[];target.on('pageerror',e=>errors.push(e.message));await target.goto(url);
  assert.equal(await target.evaluate(()=>Object.keys(save.best).length),0);
  await target.evaluate(()=>{save.best={1:{stars:3,score:100}};save.sound=false;persist();home();});
  async function upload(content){await target.locator('#importSaveFile').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:content});}
  await upload(buffer);await target.waitForFunction(()=>document.querySelector('#saveStatus').textContent.includes('导入成功'));
  assert.deepEqual(await target.evaluate(()=>({count:Object.keys(save.best).length,first:save.best[1],last:save.best[25],sound:save.sound,unlocked:unlocked()})),{count:25,first:{stars:3,score:100},last:{stars:2,score:92},sound:false,unlocked:25});
  assert.ok(await target.locator('#journeyMemory').isVisible());
  for(let i=0;i<5;i++){await target.click('[data-chapter="'+i+'"]');assert.equal(await target.locator('.level:disabled').count(),0);}
  assert.ok(await target.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await target.reload();assert.equal(await target.evaluate(()=>Object.keys(save.best).length),25);
  const before=await target.evaluate(()=>localStorage.getItem('panda-post-v1'));
  for(const bad of ['broken',JSON.stringify({game:'wrong',version:1,best:{}}),JSON.stringify({...data,best:{26:{stars:3,score:100}}}),JSON.stringify({...data,best:{1:{stars:9,score:100}}})]){
   await upload(Buffer.from(bad));await target.waitForFunction(()=>document.querySelector('#saveStatus').textContent.length>0);
   assert.equal(await target.evaluate(()=>localStorage.getItem('panda-post-v1')),before);
  }
  await upload(buffer);await target.waitForFunction(()=>document.querySelector('#saveStatus').textContent.includes('导入成功'));
  assert.equal(await target.evaluate(()=>localStorage.getItem('panda-post-v1')),before,'Reimporting is idempotent');
  await target.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('blocked');};});
  await upload(buffer);await target.waitForFunction(()=>document.querySelector('#saveStatus').textContent.includes('未能保存'));
  assert.equal(await target.evaluate(()=>JSON.stringify(save)),before);
  assert.deepEqual(errors,[]);
  await download.delete();
  console.log('PASS: real export/import across separate browsers, all25 unlock, merge maxima, sound preserved, reload persistence, invalid files, idempotence, storage failure and mobile layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
