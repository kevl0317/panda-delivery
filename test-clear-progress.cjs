const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/24510/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const url=process.env.PANDA_TEST_URL||pathToFileURL(path.resolve(__dirname,'index.html')).href;
 const errors=[];
 try{
  async function seededPage(){
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(url);
   await page.evaluate(()=>{
    save={best:{},sound:false,testSetting:'keep'};
    for(let level=1;level<=25;level++)save.best[level]={stars:3,score:100};
    persist();localStorage.setItem('unrelated-game-progress','keep-me');home();
   });
   return page;
  }
  async function snapshot(page){
   return page.evaluate(()=>({memory:JSON.stringify(save),stored:localStorage.getItem('panda-post-v1'),unrelated:localStorage.getItem('unrelated-game-progress')}));
  }
  async function openSettings(page){
   assert.equal(await page.locator('#clearSaveBtn').isVisible(),false,'Clear records must not appear directly on the home page');
   await page.click('#settingsBtn');
   assert.equal(await page.locator('#modal').evaluate(modal=>modal.open),true);
   assert.equal(await page.locator('#clearSaveBtn').isVisible(),true,'Clear records belongs inside settings');
   assert.equal(await page.locator('#closeSettings').isVisible(),true);
  }
  async function closeSettings(page){
   await page.click('#closeSettings');
   assert.equal(await page.locator('#modal').evaluate(modal=>modal.open),false);
   assert.equal(await page.evaluate(()=>document.activeElement.id),'settingsBtn');
  }
  async function expectSound(page,enabled){
   assert.equal(await page.locator('#settingsSoundBtn').getAttribute('aria-pressed'),String(enabled));
   assert.equal(await page.locator('#settingsSoundBtn').innerText(),enabled?'已开启':'已关闭');
   assert.equal(await page.locator('#soundBtn').count(),0,'Sound control must only appear inside settings');
   assert.equal(await page.evaluate(()=>save.sound),enabled);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('panda-post-v1')).sound),enabled);
  }
  async function expectReset(page){
   assert.deepEqual(await page.evaluate(()=>({best:save.best,sound:save.sound,setting:save.testSetting,chapter,unlocked:unlocked()})),{best:{},sound:false,setting:'keep',chapter:0,unlocked:1});
   assert.equal(await page.locator('#journeyMemory').count(),0);
   assert.match(await page.locator('.journey-counts').innerText(),/已抵达\s*0\s*\/\s*25/);
   assert.match(await page.locator('.journey-counts').innerText(),/★\s*0\s*\/\s*75/);
   assert.equal(await page.locator('.level:disabled').count(),4);
   assert.equal(await page.locator('.level:not(:disabled)').count(),1);
   assert.equal(await page.locator('.chapter[aria-pressed="true"]').getAttribute('data-chapter'),'0');
   assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-game-progress')),'keep-me');
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('panda-post-v1'))),{best:{},sound:false,testSetting:'keep'});
  }

  const page=await seededPage();
  const before=await snapshot(page);
  assert.equal(await page.locator('#clearSaveBtn').count(),0,'The initial home page must not contain a clear records button');
  await openSettings(page);
  await expectSound(page,false);
  await page.click('#settingsSoundBtn');
  await expectSound(page,true);
  assert.equal(await page.evaluate(()=>Object.keys(save.best).length),25,'Changing sound must preserve all progress');
  await closeSettings(page);
  await openSettings(page);
  await expectSound(page,true);
  await page.click('#settingsSoundBtn');
  await expectSound(page,false);
  await closeSettings(page);
  assert.deepEqual(await snapshot(page),before,'Settings sound control must keep progress intact');
  // Take a real portable backup, keeping its contents in memory only.
  const downloadEvent=page.waitForEvent('download');
  await page.click('#exportSaveBtn');
  const download=await downloadEvent,chunks=[];
  for await(const chunk of await download.createReadStream())chunks.push(chunk);
  const backup=Buffer.concat(chunks);
  await download.delete();

  await openSettings(page);
  await page.click('#clearSaveBtn');
  assert.equal(await page.locator('#modal').evaluate(modal=>modal.open),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'cancelClearSave');
  await page.click('#cancelClearSave');
  assert.equal(await page.locator('#modal').evaluate(modal=>modal.open),true);
  assert.equal(await page.locator('#closeSettings').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'clearSaveBtn');
  assert.deepEqual(await snapshot(page),before,'Cancel must not change any saved records');
  await closeSettings(page);

  await openSettings(page);
  await page.click('#clearSaveBtn');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#modal').evaluate(modal=>modal.open),true);
  assert.equal(await page.locator('#closeSettings').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'clearSaveBtn');
  assert.deepEqual(await snapshot(page),before,'Escape must not change any saved records');
  await closeSettings(page);

  await openSettings(page);
  await page.click('#clearSaveBtn');
  await page.click('#confirmClearSave');
  assert.equal(await page.locator('#modal').evaluate(modal=>modal.open),false);
  assert.match(await page.locator('#settingsNotice').innerText(),/本地记录已清除/);
  await expectReset(page);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.click('#collectionBtn');
  assert.match(await page.locator('.collection-summary').innerText(),/0\s*\/\s*25/);
  assert.equal(await page.locator('.collection article').count(),0);
  assert.equal(await page.locator('.collection-empty').isVisible(),true);
  await page.click('#closeCollection');
  await page.reload();
  await expectReset(page);
  await openSettings(page);
  await expectSound(page,false);
  await closeSettings(page);

  await page.locator('#importSaveFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:backup});
  await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent.includes('导入成功'));
  assert.equal(await page.evaluate(()=>Object.keys(save.best).length),25);
  assert.equal(await page.evaluate(()=>save.sound),false);
  assert.equal(await page.locator('#journeyMemory').isVisible(),true);
  await page.click('#collectionBtn');
  assert.equal(await page.locator('.collection article').count(),25);
  await page.click('#closeCollection');

  const failurePage=await seededPage(),beforeFailure=await snapshot(failurePage);
  await failurePage.evaluate(()=>{
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){if(key==='panda-post-v1')throw new Error('Storage unavailable');return original.call(this,key,value);};
  });
  await openSettings(failurePage);
  await failurePage.click('#clearSaveBtn');
  await failurePage.click('#confirmClearSave');
  assert.equal(await failurePage.locator('#modal').evaluate(modal=>modal.open),true);
  assert.ok((await failurePage.locator('#clearSaveError').innerText()).trim().length>0);
  assert.equal(await failurePage.locator('#confirmClearSave').isEnabled(),true);
  assert.equal(await failurePage.locator('#cancelClearSave').isEnabled(),true);
  assert.deepEqual(await snapshot(failurePage),beforeFailure,'A failed storage write must preserve memory and disk records');
  await failurePage.click('#cancelClearSave');
  assert.equal(await failurePage.locator('#closeSettings').isVisible(),true);
  await closeSettings(failurePage);
  assert.equal(await failurePage.locator('#journeyMemory').isVisible(),true);

  const racePage=await seededPage();
  await racePage.evaluate(()=>{
   window.pendingImport=importProgress({size:1,text:()=>new Promise(resolve=>{window.resolvePendingImport=resolve;})});
  });
  await openSettings(racePage);
  await racePage.click('#clearSaveBtn');
  await racePage.click('#confirmClearSave');
  await racePage.evaluate(async text=>{window.resolvePendingImport(text);await window.pendingImport;},backup.toString());
  await expectReset(racePage);
  assert.match(await racePage.locator('#settingsNotice').innerText(),/本地记录已清除/);
  assert.deepEqual(errors,[]);
  console.log('PASS: clear records only in settings, settings-only sound control, clear confirmation and default cancel focus, cancel/Escape return to settings, progress and collection reset, settings and unrelated storage preserved, reload persistence, backup restoration, storage failure, pending-import race, mobile layout.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
