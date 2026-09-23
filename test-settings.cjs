const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/24510/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(process.env.PANDA_TEST_URL||pathToFileURL(path.resolve(__dirname,'index.html')).href);
  await page.evaluate(()=>{save.sound=false;save.best={1:{score:100,stars:3}};persist();home();});
  assert.equal(await page.locator('#clearSaveBtn').count(),0,'Reset belongs in settings, not the home transfer controls');
  await page.click('#settingsBtn');
  assert.equal(await page.locator('#clearSaveBtn').isVisible(),true);
  if(process.env.QA_SCREENSHOTS)await page.screenshot({path:'qa-settings-desktop.png'});
  await page.click('#closeSettings');
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Page fits ${width}px`);
   assert.equal(await page.locator('header').evaluate(header=>{
    const brand=header.querySelector('.brand').getBoundingClientRect(),nav=header.querySelector('nav').getBoundingClientRect();
    return brand.right<=nav.left&&nav.right<=innerWidth;
   }),true,`Header controls fit ${width}px`);
   await page.click('#settingsBtn');
   await page.click('#clearSaveBtn');
   assert.equal(await page.locator('#modal').evaluate(modal=>modal.scrollWidth<=modal.clientWidth),true);
   assert.equal(await page.locator('#confirmClearSave').isVisible(),true);
   if(process.env.QA_SCREENSHOTS&&width===390)await page.screenshot({path:'qa-settings-mobile.png'});
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#clearSaveBtn').isVisible(),true);
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#modal').evaluate(modal=>modal.open),false);
  }
  await page.setViewportSize({width:1280,height:720});
  for(const mode of ['playing','practice','countdown']){
   await page.evaluate(mode=>{
    prepare(21);
    if(mode==='practice')practiceStart();
    else if(mode==='countdown')countdown();
    else {officialStart();raf=requestAnimationFrame(tick);}
   },mode);
   await page.click('#settingsBtn');
   const frozen=await page.evaluate(()=>({round:state.roundElapsed,elapsed:state.elapsed,parcels:state.parcels.map(p=>p.elapsed)}));
   await page.waitForTimeout(250);
   assert.equal(await page.evaluate(()=>state.paused),true);
   assert.deepEqual(await page.evaluate(()=>({round:state.roundElapsed,elapsed:state.elapsed,parcels:state.parcels.map(p=>p.elapsed)})),frozen,`${mode} must freeze in settings`);
   await page.click('#clearSaveBtn');
   await page.click('#cancelClearSave');
   assert.equal(await page.evaluate(()=>state.paused),true,'Cancel clearing keeps settings open and the game paused');
   await page.click('#closeSettings');
   assert.equal(await page.evaluate(()=>state.paused),false);
   await page.waitForTimeout(200);
   const advanced=await page.evaluate(()=>({round:state.roundElapsed,elapsed:state.elapsed,parcels:state.parcels.map(p=>p.elapsed)}));
   assert.notDeepEqual(advanced,frozen,`${mode} resumes after settings close`);
   if(mode==='playing')assert.ok(advanced.round-frozen.round<.5,'Closing settings must not charge the paused time');
  }
  await page.evaluate(()=>{prepare(21);officialStart();raf=requestAnimationFrame(tick);});
  await page.click('#pauseBtn');
  await page.click('#pauseSettings');
  await page.click('#closeSettings');
  assert.equal(await page.evaluate(()=>state.paused),true,'An already paused game remains paused');
  assert.equal(await page.locator('#resume').isVisible(),true,'Return to the original pause dialog');
  await page.click('#resume');
  assert.equal(await page.evaluate(()=>state.paused),false);
  await page.click('#settingsBtn');
  await page.click('#clearSaveBtn');
  await page.click('#confirmClearSave');
  assert.equal(await page.evaluate(()=>state),null);
  assert.deepEqual(await page.evaluate(()=>save.best),{});
  assert.equal(await page.locator('#modal').evaluate(modal=>modal.open),false);
  assert.match(await page.locator('#settingsNotice').innerText(),/已清除/);
  assert.equal(await page.locator('#continueBtn').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: settings entry, desktop/mobile fit, active practice/countdown/game pause and resume, clear cancellation, pre-existing pause restoration, and reset during a game.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
