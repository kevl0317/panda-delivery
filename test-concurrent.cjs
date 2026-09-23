const {chromium}=require('C:/Users/24510/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');

async function start(page,level=21,live=false){
 await page.evaluate(({level,live})=>{
  prepare(level);officialStart();cancelAnimationFrame(raf);
  state.last=performance.now();if(live)raf=requestAnimationFrame(tick);
 },{level,live});
}
async function place(page,lane,column){
 await page.evaluate(({lane,column})=>{
  const c=state.parcels.find(c=>c.lane===lane);
  const target=column??state.basketRows[lane].indexOf(c.kind);
  c.elapsed=E.timeAt([.25,.52,.79][target],E.duration(state.level,c.sequenceIndex));
  state.last=performance.now();tick(state.last);cancelAnimationFrame(raf);
 },{lane,column});
}

(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'index.html')).href);

  await start(page);
  assert.equal(await page.locator('.parcel[id]:not(.done)').count(),2);
  const rows=await page.evaluate(()=>state.basketRows);
  assert.ok(rows[0].every((kind,i)=>kind!==rows[1][i]));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const selector of ['#parcel0','#parcel1','#lane1 .basket-body']){
   const box=await page.locator(selector).first().boundingBox();
   assert.ok(box&&box.y>=0&&box.y+box.height<=720,`${selector} fits a small desktop`);
  }

  // Rapid clicks and pointer drags cannot select city labels or drag artwork.
  await page.evaluate(()=>getSelection().removeAllRanges());
  await page.locator('#lane0 .destination-icon').first().dblclick({force:true});
  assert.equal(await page.evaluate(()=>getSelection().toString()),'');
  const labelBox=await page.locator('#lane1 .destination-icon').first().boundingBox();
  await page.mouse.move(labelBox.x,labelBox.y+labelBox.height/2);await page.mouse.down();
  await page.mouse.move(labelBox.x+labelBox.width+40,labelBox.y+labelBox.height/2,{steps:8});await page.mouse.up();
  assert.equal(await page.evaluate(()=>getSelection().toString()),'');
  assert.ok(await page.locator('#warehouse img').evaluateAll(imgs=>imgs.every(img=>!img.draggable)));
  assert.equal(await page.locator('#lane0 .basket img').first().evaluate(img=>img.dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true}))),false);
  assert.ok(await page.locator('#warehouse .basket, #warehouse .parcel, #warehouse .destination-icon').evaluateAll(els=>els.every(el=>getComputedStyle(el).userSelect==='none')));

  // New early/late tolerance accepts edge clicks outside the drawn parcel.
  for(const delta of [-.125,.125]){
   await start(page,25);
   await page.evaluate(delta=>{
    const c=state.parcels[0];c.kind=state.basketRows[0][1];mountParcel(c);
    c.elapsed=E.timeAt(.52+delta,E.duration(25,0));state.last=performance.now();tick(state.last);cancelAnimationFrame(raf);
   },delta);
   const rect=await page.locator('#parcel0').boundingBox();
   await page.mouse.click(rect.x-10,rect.y+rect.height/2);
   assert.equal(await page.evaluate(()=>state.correct),1,'Near-edge pointer click accepts the expanded time window');
   assert.equal(await page.evaluate(()=>state.parcels[1].resolved),false);
  }
  await start(page,25);
  await page.evaluate(()=>{
   const c=state.parcels[0];c.kind=state.basketRows[0][1];mountParcel(c);
   c.elapsed=E.timeAt(.385,E.duration(25,0));state.last=performance.now();tick(state.last);cancelAnimationFrame(raf);
  });
  await page.locator('#parcel0').click({force:true});
  assert.deepEqual(await page.evaluate(()=>({correct:state.correct,wrong:state.wrong,resolved:state.parcels[0].resolved})),{correct:0,wrong:0,resolved:false},'Gap between baskets stays neutral');
  await start(page,21);

  // A completed upper parcel leaves the lower parcel independently usable.
  await place(page,0);
  const lowerBefore=await page.evaluate(()=>({...state.parcels.find(c=>c.lane===1)}));
  await page.locator('#parcel0').click({force:true});
  assert.equal(await page.evaluate(()=>state.correct),1);
  assert.ok(await page.locator('#parcel0').evaluate(p=>p.classList.contains('done')));
  assert.ok(await page.locator('#parcel1').isVisible());
  assert.equal(await page.locator('#parcel1').evaluate(p=>p.classList.contains('done')),false);
  assert.deepEqual(await page.evaluate(()=>({...state.parcels.find(c=>c.lane===1)})),lowerBefore);
  await page.evaluate(()=>{state.last=performance.now();raf=requestAnimationFrame(tick);});
  await page.waitForTimeout(450);
  await page.evaluate(()=>cancelAnimationFrame(raf));
  assert.ok(await page.evaluate(previous=>state.parcels.find(c=>c.lane===1).elapsed>previous+.2,lowerBefore.elapsed));
  assert.equal(await page.evaluate(()=>state.parcels.find(c=>c.lane===1).resolved),false);
  assert.equal(await page.locator('#parcel1').evaluate(p=>p.classList.contains('done')),false);
  await page.evaluate(()=>{投递(0);投递(0);endParcel(state.parcels.find(c=>c.lane===0));});
  assert.deepEqual(await page.evaluate(()=>({correct:state.correct,index:state.index,next:state.nextIndex})),{correct:1,index:1,next:2});
  await place(page,1);await page.locator('#parcel1').click({force:true});
  await page.evaluate(()=>endParcel(state.parcels.find(c=>c.lane===1)));
  assert.deepEqual(await page.evaluate(()=>({correct:state.correct,index:state.index,next:state.nextIndex,lanes:state.parcels.map(c=>c.lane)})),{correct:2,index:2,next:4,lanes:[0,1]});

  // A column from the other row is incorrect even when it holds that symbol.
  await start(page,21);
  const otherColumn=await page.evaluate(()=>state.basketRows[1].indexOf(state.parcels.find(c=>c.lane===0).kind));
  await place(page,0,otherColumn);await page.locator('#parcel0').click({force:true});
  assert.equal(await page.evaluate(()=>state.wrong),1);
  assert.equal(await page.evaluate(()=>state.correct),0);
  assert.equal(await page.evaluate(()=>state.parcels.find(c=>c.lane===1).resolved),false);
  await place(page,1);await page.locator('#parcel1').click({force:true});
  assert.equal(await page.evaluate(()=>state.correct),1);

  // At the same x coordinate, each button must dispatch to its own lane.
  await start(page,23);
  await page.evaluate(()=>{
   for(const c of state.parcels){c.kind=state.basketRows[c.lane][1];mountParcel(c);c.elapsed=E.timeAt(.52,E.duration(state.level,c.sequenceIndex));}
   state.last=performance.now();tick(state.last);cancelAnimationFrame(raf);
  });
  await page.locator('#parcel1').click({force:true});
  assert.deepEqual(await page.evaluate(()=>state.parcels.map(c=>c.resolved)),[false,true]);
  await page.locator('#parcel0').click({force:true});
  assert.deepEqual(await page.evaluate(()=>({correct:state.correct,wrong:state.wrong})),{correct:2,wrong:0});

  // Both timers advance with real frames, freeze while paused, and resume normally.
  await start(page,24,true);await page.waitForTimeout(260);
  const advancing=await page.evaluate(()=>({round:state.roundElapsed,elapsed:state.parcels.map(c=>c.elapsed)}));
  assert.ok(advancing.elapsed.every(t=>t>.1));
  assert.ok(Math.abs(advancing.elapsed[0]-advancing.elapsed[1])<.01);
  await page.click('#pauseBtn');
  const paused=await page.evaluate(()=>({round:state.roundElapsed,elapsed:state.parcels.map(c=>c.elapsed)}));
  await page.waitForTimeout(350);
  assert.deepEqual(await page.evaluate(()=>({round:state.roundElapsed,elapsed:state.parcels.map(c=>c.elapsed)})),paused);
  await page.click('#resume');await page.waitForTimeout(180);
  const resumed=await page.evaluate(()=>({round:state.roundElapsed,elapsed:state.parcels.map(c=>c.elapsed)}));
  assert.ok(resumed.round>paused.round&&resumed.round-paused.round<.33);
  for(let lane=0;lane<2;lane++)assert.ok(resumed.elapsed[lane]>paused.elapsed[lane]&&resumed.elapsed[lane]-paused.elapsed[lane]<.33);

  // Expiry accounts for pending, unfinished and unspawned parcels exactly once.
  await start(page,21);await place(page,0);await page.locator('#parcel0').click({force:true});
  const timedOut=await page.evaluate(()=>{
   state.roundElapsed=59.98;state.last=performance.now()-50;tick(performance.now());cancelAnimationFrame(raf);
   return {mode:state.mode,index:state.index,correct:state.correct,wrong:state.wrong,missed:state.missed,round:state.roundElapsed};
  });
  assert.deepEqual(timedOut,{mode:'result',index:24,correct:1,wrong:0,missed:23,round:60});
  await page.evaluate(()=>{投递(1);tick(performance.now());cancelAnimationFrame(raf);});
  assert.equal(await page.evaluate(()=>state.missed),23);

  // An active click animation must not affect a retried round or the home screen.
  await start(page,21);await place(page,0);await page.locator('#parcel0').click({force:true});
  await page.click('#retryBtn');await page.click('#confirm');
  assert.equal(await page.evaluate(()=>state.mode),'ready');
  await page.waitForTimeout(430);
  assert.deepEqual(await page.evaluate(()=>({correct:state.correct,index:state.index,mode:state.mode})),{correct:0,index:0,mode:'ready'});
  assert.equal(await page.locator('.parcel:not([id])').count(),0);
  await page.evaluate(()=>{officialStart();state.last=performance.now();raf=requestAnimationFrame(tick);});
  await page.click('#backHomeBtn');await page.click('#confirm');await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>state),null);assert.equal(await page.locator('.parcel').count(),0);

  // Simultaneous practice contains three pairs and needs both deliveries per pair.
  await page.evaluate(()=>{prepare(21);practiceStart();cancelAnimationFrame(raf);});
  for(let wave=0;wave<3;wave++){
   assert.ok(await page.evaluate(()=>state.basketRows[0].indexOf(state.parcels[0].kind)!==state.basketRows[1].indexOf(state.parcels[1].kind)),'Practice also separates target columns');
   const first=await page.evaluate(()=>{
    const c=state.parcels.find(c=>c.lane===0);c.elapsed=E.timeAt([.25,.52,.79][state.basketRows[0].indexOf(c.kind)],6.5);
    投递(0);endParcel(c);return {mode:state.mode,index:state.practiceIndex};
   });
   assert.deepEqual(first,{mode:'practice',index:wave});
   await page.evaluate(()=>{
    const c=state.parcels.find(c=>c.lane===1);c.elapsed=E.timeAt([.25,.52,.79][state.basketRows[1].indexOf(c.kind)],6.5);
    投递(1);endParcel(c);
   });
   assert.deepEqual(await page.evaluate(()=>({mode:state.mode,index:state.practiceIndex})),{mode:'practiceWait',index:wave+1});
   if(wave<2){await page.click('#practiceNext');await page.evaluate(()=>cancelAnimationFrame(raf));}
  }

  // Move both parcels on one chronological clock and click in arrival order.
  // Never reposition an individual parcel: this exercises real wave timing.
  await page.setViewportSize({width:390,height:844});
  for(let level=21;level<=25;level++){
   await start(page,level);
   const firstLanes=new Set();
   async function advance(seconds){
    await page.evaluate(seconds=>{
     for(let left=seconds;left>1e-8&&state.mode==='playing';){
      const step=Math.min(left,1/60);tick(state.last+step*1000);cancelAnimationFrame(raf);left-=step;
     }
    },seconds);
   }
   for(let wave=0;wave<12;wave++){
    const targets=await page.evaluate(()=>state.parcels.map(c=>{
     const column=state.basketRows[c.lane].indexOf(c.kind);
     return {lane:c.lane,column,time:E.timeAt([.25,.52,.79][column],E.duration(state.level,c.sequenceIndex))};
    }).sort((a,b)=>a.time-b.time));
    assert.notEqual(targets[0].column,targets[1].column);assert.ok(targets[1].time-targets[0].time>=.989);
    firstLanes.add(targets[0].lane);
    for(const target of targets){
     const elapsed=await page.evaluate(lane=>state.parcels.find(c=>c.lane===lane).elapsed,target.lane);
     await advance(target.time-elapsed);await page.locator('#parcel'+target.lane).click({force:true});
    }
    await advance(.37);
   }
   assert.equal(firstLanes.size,2,'Both upper-first and lower-first deliveries occur');
   assert.deepEqual(await page.evaluate(()=>({correct:state.correct,missed:state.missed,wrong:state.wrong,mode:state.mode})),{correct:24,missed:0,wrong:0,mode:'result'});
   assert.ok(await page.evaluate(()=>state.roundElapsed<60),'All pairs can be completed before the normal deadline');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: non-selectable artwork, distinct paired targets, chronological dual clicks in all late levels, independent scoring/settling, pause, timeout, retry/home and paired practice.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
