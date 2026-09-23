const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'app.js'),'utf8').split('function showModal')[0];
function setup(){
 const tones=[],warmups=[],contexts=[],events=[];let resolveResume;
 class AudioContext{
  constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=48000;this.destination={};this.resumeCalls=0;contexts.push(this);}
  resume(){this.resumeCalls++;if(this.fail)return Promise.reject(Error('blocked'));return new Promise(resolve=>{resolveResume=()=>{this.state='running';this.currentTime=7;events.push('resumed');resolve();};});}
  createBuffer(channels,length,sampleRate){const data=Array.from({length:channels},()=>new Float32Array(length));return {numberOfChannels:channels,length,sampleRate,getChannelData:channel=>data[channel]};}
  createBufferSource(){
   const node={buffer:null,disconnected:false,connect:destination=>assert.equal(destination,this.destination),disconnect(){node.disconnected=true;},start(){
    assert.equal(node.buffer.numberOfChannels,1);assert.equal(node.buffer.length,Math.ceil(48000*.06));assert.equal(node.buffer.sampleRate,48000);
    assert.ok(node.buffer.getChannelData(0).every(value=>value===0),'audio warmup must stay silent');
    warmups.push(node);events.push('warmup-start');queueMicrotask(()=>{events.push('warmup-end');node.onended?.();});
   }};return node;
  }
  createOscillator(){const o={frequency:{value:0},connect(){},disconnect(){},start(time){events.push('tone');tones.push({time,frequency:o.frequency.value});},stop(){o.onended?.();}};return o;}
  createGain(){return {connect(){},disconnect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}
 }
 const sandbox={PandaEngine:{},GAME_CONTENT:[],document:{querySelector(){}},localStorage:{getItem(){return null;}},window:{AudioContext},queueMicrotask};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 return {tones,warmups,contexts,events,run:s=>vm.runInContext(s,sandbox),resume:()=>resolveResume()};
}
(async()=>{
 const a=setup();const first=a.run('beep(true)');
 assert.equal(a.contexts.length,1);assert.equal(a.tones.length,0);
 a.resume();await first;assert.equal(a.tones[0].frequency,660);assert.ok(a.tones[0].time>=7);
 assert.equal(a.warmups.length,1);assert.ok(a.warmups[0].disconnected);assert.deepEqual(a.events,['resumed','warmup-start','warmup-end','tone']);
 await a.run('beep(false)');assert.equal(a.tones[1].frequency,190);
 assert.equal(a.warmups.length,1,'a running context should not warm up on every delivery');
 a.contexts[0].state='suspended';const later=a.run('beep(true)');assert.equal(a.tones.length,2);a.resume();await later;assert.equal(a.tones.length,3);
 const concurrent=setup();const wakes=[concurrent.run('ensureAudio()'),concurrent.run('ensureAudio()'),concurrent.run('beep(true)')];
 assert.equal(concurrent.contexts.length,1);assert.equal(concurrent.contexts[0].resumeCalls,1,'overlapping clicks must share the pending resume');assert.equal(concurrent.tones.length,0);
 concurrent.resume();const results=await Promise.all(wakes);assert.equal(results[0],concurrent.contexts[0]);assert.equal(results[1],concurrent.contexts[0]);
 assert.equal(concurrent.warmups.length,1,'overlapping calls must share one silent warmup');assert.equal(concurrent.tones.length,1);assert.deepEqual(concurrent.events,['resumed','warmup-start','warmup-end','tone']);
 const muted=setup();await muted.run('save.sound=false;beep(true)');assert.equal(muted.contexts.length,0);
 const pending=setup();const waiting=pending.run('beep(true)');pending.run('save.sound=false');pending.resume();await waiting;assert.equal(pending.tones.length,0);
 a.contexts[0].state='suspended';a.contexts[0].fail=true;await a.run('beep(true)');assert.equal(a.tones.length,3);
 console.log('PASS: first tone waits for resume and silent warmup, concurrent audio initialization, correct/error tones, mute and resume failure.');
})().catch(e=>{console.error(e);process.exitCode=1;});
