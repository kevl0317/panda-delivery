const {chromium}=require('C:/Users/24510/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');

async function completeWave(page){
 return page.evaluate(()=>{
  cancelAnimationFrame(raf);
  for(const c of state.parcels.slice()){
   const duration=state.mode==='practice'?6.5:E.duration(state.level,c.sequenceIndex);
   c.elapsed=E.timeAt([.25,.52,.79][state.basketRows[c.lane].indexOf(c.kind)],duration);
   投递(c.lane);endParcel(c);
  }
 });
}

(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:960}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'index.html')).href);
  await page.screenshot({path:path.join(__dirname,'test-home.png'),fullPage:true});
  assert.equal(await page.locator('#freePracticeBtn').count(),0);
  await page.click('#continueBtn');await page.click('#startPractice');
  for(let wave=0;wave<3;wave++){
   await completeWave(page);
   assert.equal(await page.evaluate(()=>state.practiceIndex),wave+1);
   if(wave<2)await page.click('#practiceNext');
  }
  assert.equal(await page.evaluate(()=>state.mode),'practiceWait');
  assert.equal(await page.locator('#practiceNext').innerText(),'正式出发');
  await page.evaluate(()=>{prepare(18);officialStart();cancelAnimationFrame(raf);});
  await page.screenshot({path:path.join(__dirname,'test-game.png'),fullPage:true});
  await page.click('#pauseBtn');assert.ok(await page.locator('#modal').isVisible());await page.click('#resume');

  // Complete every configured round; concurrent levels must account for all 24 pieces.
  for(let level=1;level<=25;level++){
   const result=await page.evaluate(level=>{
    prepare(level);officialStart();cancelAnimationFrame(raf);let guard=0;
    while(state.mode==='playing'&&guard++<30){
     for(const c of state.parcels.slice()){
      c.elapsed=E.timeAt([.25,.52,.79][state.basketRows[c.lane].indexOf(c.kind)],E.duration(level,c.sequenceIndex));
      投递(c.lane);endParcel(c);
     }
    }
    return {correct:state.correct,missed:state.missed,wrong:state.wrong,index:state.index,mode:state.mode,stars:save.best[level]?.stars};
   },level);
   const total=level<21?12:24;
   assert.deepEqual(result,{correct:total,missed:0,wrong:0,index:total,mode:'result',stars:3},`Level ${level}`);
   assert.equal(await page.locator('.lane').count(),level<16?1:2);
   if(level===18){
    assert.equal(await page.locator('.two-lanes .lane').count(),2);
    assert.equal(await page.locator('.basket .item-icon[aria-label="空心星形"] path[fill="none"]').count(),2);
   }
   assert.equal(await page.locator('.result-knowledge').count(),1);
   const annotated=await page.locator('.knowledge-bubble ruby').evaluateAll(es=>es.map(e=>e.firstChild.textContent));
   assert.equal(new Set(annotated).size,annotated.length);
   const expectedReading=level===13?['yí']:level===21?['zhào']:[];
   assert.deepEqual(await page.locator('.game-heading rt').allTextContents(),expectedReading);
   assert.deepEqual(await page.locator('.knowledge-bubble .eyebrow rt').allTextContents(),expectedReading);
   assert.equal(await page.locator('.knowledge-bubble p rt').count(),0);
   const heading=await page.locator('.knowledge-bubble .eyebrow').evaluate(e=>{const c=e.cloneNode(true);c.querySelectorAll('rt,rp').forEach(n=>n.remove());return c.textContent;});
   assert.equal(heading,await page.evaluate(level=>'熊猫讲给你听 · '+C[level-1].knowledgeTitle,level));
   assert.ok(!(await page.locator('#modalContent').innerText()).includes('undefined'));
   const body=await page.locator('.result-knowledge p').evaluate(e=>{const c=e.cloneNode(true);c.querySelectorAll('rt,rp').forEach(n=>n.remove());return c.textContent;});
   assert.equal(body,await page.evaluate(level=>C[level-1].knowledge,level));
  }

  await page.click('#journeyEnd');
  assert.equal(await page.locator('.journey-map').count(),1);
  assert.equal(await page.locator('.finale-badge').count(),5);
  assert.equal(await page.locator('.finale-badge.is-locked').count(),0);
  await page.click('[data-journey="4"]');
  assert.equal(await page.locator('[data-journey="4"]').getAttribute('aria-pressed'),'true');
  await page.click('#finaleHome');
  assert.ok((await page.locator('main').innerText()).includes('75 / 75'));
  await page.reload();
  assert.ok((await page.locator('main').innerText()).includes('75 / 75'));

  await page.evaluate(()=>prepare(1));await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:path.join(__dirname,'test-mobile.png'),fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));

  // Use the live animation clock and trusted pointer input; Space stays inactive.
  await page.evaluate(()=>{
   prepare(1);officialStart();cancelAnimationFrame(raf);
   const c=state.parcels[0];c.kind=state.basketRows[0][1];mountParcel(c);
   state.last=performance.now();raf=requestAnimationFrame(tick);
  });
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>state.correct),0);
  await page.waitForFunction(()=>travel(state.parcels[0]).x>.45&&travel(state.parcels[0]).x<.58,{},{timeout:9000});
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>state.correct),0);
  await page.locator('#parcel0').click({force:true});assert.equal(await page.evaluate(()=>state.correct),1);
  await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>state.correct),1);
  await page.click('#pauseBtn');
  const paused=await page.evaluate(()=>({round:state.roundElapsed,items:state.parcels.map(c=>c.elapsed)}));
  await page.waitForTimeout(350);
  assert.deepEqual(await page.evaluate(()=>({round:state.roundElapsed,items:state.parcels.map(c=>c.elapsed)})),paused);
  await page.click('#resume');
  await page.waitForFunction(()=>state.index===1,{},{timeout:1500});
  await page.evaluate(()=>{
   prepare(22);officialStart();cancelAnimationFrame(raf);
   for(const c of state.parcels)c.elapsed=E.timeAt([.25,.52,.79][state.basketRows[c.lane].indexOf(c.kind)],E.duration(22,c.sequenceIndex));
   state.last=performance.now();tick(state.last);cancelAnimationFrame(raf);
  });
  await page.screenshot({path:path.join(__dirname,'test-mobile-play.png'),fullPage:true});
  await page.locator('#parcel0').click({force:true});await page.locator('#parcel1').click({force:true});
  assert.equal(await page.evaluate(()=>state.correct),2);
  assert.ok(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>home());await page.screenshot({path:path.join(__dirname,'test-mobile-home.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: practice, 25 full rounds, independent lanes, pinyin/cards, finale, saved progress, Space disabled, pause/resume, mobile pointer delivery and no browser exceptions.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
