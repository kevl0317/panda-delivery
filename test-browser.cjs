const {chromium}=require('C:/Users/24510/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1365,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'index.html')).href);
 await page.screenshot({path:path.join(__dirname,'test-home.png'),fullPage:true});
 assert.equal(await page.locator('#freePracticeBtn').count(),0);await page.click('#continueBtn');await page.click('#startPractice');
 await page.evaluate(()=>{cancelAnimationFrame(raf);state.elapsed=E.timeAt([.25,.52,.79][state.basketKinds.indexOf(state.current.kind)],6.5);投递();});
 assert.equal(await page.locator('#correct').innerText(),'1');
 await page.evaluate(()=>{endParcel();});await page.click('#practiceNext');
 await page.evaluate(()=>{cancelAnimationFrame(raf);state.elapsed=E.timeAt([.25,.52,.79][state.basketKinds.indexOf(state.current.kind)],6.5);投递();endParcel();});await page.click('#practiceNext');
 await page.evaluate(()=>{cancelAnimationFrame(raf);state.elapsed=E.timeAt([.25,.52,.79][state.basketKinds.indexOf(state.current.kind)],6.5);投递();endParcel();});
 assert.equal(await page.evaluate(()=>state.practiceIndex),3);
 await page.evaluate(()=>{prepare(18);officialStart();cancelAnimationFrame(raf);state.elapsed=.3;});
 await page.screenshot({path:path.join(__dirname,'test-game.png'),fullPage:true});
 await page.click('#pauseBtn');assert.ok(await page.locator('#modal').isVisible());await page.click('#resume');
 // Exercise every complete official round, including the level-13 switch.
 for(let l=1;l<=25;l++){
  const result=await page.evaluate(l=>{prepare(l);officialStart();cancelAnimationFrame(raf);let guard=0;
   while(state.mode!=='result'&&guard++<50){if(state.mode==='switch'){state.mode='playing';removeOverlay();mountCurrent();}const c=state.current;if(c.yes){const basket=state.basketKinds.indexOf(c.kind);state.elapsed=E.timeAt([.25,.52,.79][basket],E.duration(l,state.index));投递();}endParcel();}
   return {correct:state.correct,passed:state.passed,mode:state.mode,stars:save.best[l]?.stars};},l);
  assert.deepEqual(result,{correct:12,passed:0,mode:'result',stars:3});
  assert.equal(await page.locator('.result-knowledge').count(),1);
  assert.equal(await page.locator('.knowledge-bubble .eyebrow').innerText(),await page.evaluate(l=>'熊猫讲给你听 · '+C[l-1].knowledgeTitle,l));
  assert.ok(!(await page.locator('#modalContent').innerText()).includes('undefined'));
  assert.equal(await page.locator('.result-knowledge p').innerText(),await page.evaluate(l=>C[l-1].knowledge,l));
 }
 await page.evaluate(()=>prepare(1));await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(__dirname,'test-mobile.png'),fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.reload();assert.ok((await page.locator('main').innerText()).includes('75 / 75'));
 // A real animation-frame round with keyboard input, not a simulated hit.
 await page.evaluate(()=>{prepare(1);officialStart();state.current={kind:'竹叶',yes:true,lane:0,active:0,stamp:false,phase:0};state.basketKinds=['花朵','竹叶','圆点'];renderLanes();mountParcel();state.last=performance.now();raf=requestAnimationFrame(tick);});
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>state.correct),0);
 await page.waitForFunction(()=>travel().x>.45&&travel().x<.58,{},{timeout:9000});
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>state.correct),1);
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>state.correct),1);
 await page.click('#pauseBtn');const elapsed=await page.evaluate(()=>state.elapsed);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>state.elapsed),elapsed);await page.click('#resume');
 await page.waitForFunction(()=>state.index===1,{},{timeout:1500});
 await page.evaluate(()=>{cancelAnimationFrame(raf);prepare(22);officialStart();cancelAnimationFrame(raf);state.current={kind:'星形',yes:true,lane:1,active:0,stamp:false,phase:0};mountParcel();const b=state.basketKinds.indexOf('星形');state.elapsed=E.timeAt([.25,.52,.79][b],E.duration(22,0));tick(performance.now());cancelAnimationFrame(raf);});
 await page.screenshot({path:path.join(__dirname,'test-mobile-play.png'),fullPage:true});
 await page.click('#deliverBtn');assert.equal(await page.evaluate(()=>state.correct),1);
 assert.ok(await page.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)));
 await page.evaluate(()=>home());await page.screenshot({path:path.join(__dirname,'test-mobile-home.png'),fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: practice flow, pause/resume, 25 full rounds, completion, persisted progress, mobile width, no browser exceptions.');
})().catch(e=>{console.error(e);process.exit(1);});
