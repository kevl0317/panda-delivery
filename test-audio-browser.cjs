const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/24510/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:900}});
  await page.addInitScript(()=>{
   window.audioProbe={tones:[]};
   const connect=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(destination,...args){
    const result=connect.call(this,destination,...args);
    if(this instanceof GainNode && destination instanceof AudioDestinationNode){
     const analyser=this.context.createAnalyser();analyser.fftSize=2048;connect.call(this,analyser);
     audioProbe.tones.push({analyser,peak:0});
    }
    return result;
   };
   setInterval(()=>{for(const tone of audioProbe.tones){const samples=new Float32Array(tone.analyser.fftSize);tone.analyser.getFloatTimeDomainData(samples);tone.peak=Math.max(tone.peak,...samples.map(Math.abs));}},5);
  });
  await page.goto(pathToFileURL(path.resolve(__dirname,'index.html')).href);
  await page.click('#continueBtn');await page.click('#startPractice');
  async function aim(){await page.evaluate(()=>{cancelAnimationFrame(raf);const c=state.parcels[0];const basket=state.basketRows[c.lane].indexOf(c.kind);c.elapsed=E.timeAt([.25,.52,.79][basket],6.5);state.last=performance.now();tick(state.last);cancelAnimationFrame(raf);});}
  async function tap(){const rect=await page.locator('#parcel0').boundingBox();await page.mouse.click(rect.x+rect.width/2,rect.y+rect.height/2);}
  async function next(){await page.evaluate(()=>endParcel(state.parcels[0]));await page.click('#practiceNext');await aim();}
  await aim();await tap();
  await page.waitForFunction(()=>audioProbe.tones.length===1&&audioProbe.tones[0].peak>.008);
  assert.equal(await page.evaluate(()=>state.correct),1);
  await next();await tap();await page.waitForFunction(()=>audioProbe.tones.length===2&&audioProbe.tones[1].peak>.008);
  await next();await page.evaluate(()=>audioContext.suspend());await tap();
  await page.waitForFunction(()=>audioProbe.tones.length===3&&audioProbe.tones[2].peak>.008);
  await page.click('#soundBtn');await page.evaluate(()=>{practiceStart();cancelAnimationFrame(raf);});await aim();await tap();await page.waitForTimeout(350);
  assert.equal(await page.evaluate(()=>audioProbe.tones.length),3);
  console.log('PASS: fresh real clicks produce first/second audio signals; suspended recovery and mute. Peaks:',await page.evaluate(()=>audioProbe.tones.map(t=>Number(t.peak.toFixed(3)))));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
