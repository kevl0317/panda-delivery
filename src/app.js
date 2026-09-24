const E=PandaEngine, C=GAME_CONTENT, $=s=>document.querySelector(s);
let save={best:{},sound:true};try{save={...save,...JSON.parse(localStorage.getItem('panda-post-v1')||'{}')};}catch{}
let chapter=0,state=null,raf=0,audioContext=null,audioWake=null,progressRevision=0;
const persist=()=>{try{localStorage.setItem('panda-post-v1',JSON.stringify(save));}catch{}};
const unlocked=()=>Math.min(25,Math.max(0,...Object.keys(save.best).map(Number))+1);
// Start the output path during the opening gesture, before a delivery tone.
async function ensureAudio(){
 if(!save.sound)return null;
 try{
  if(!audioContext||audioContext.state==='closed')audioContext=new (window.AudioContext||window.webkitAudioContext)();
  const context=audioContext;
  if(!audioWake||audioWake.context!==context||(!audioWake.pending&&context.state!=='running')){
   const wake={context,pending:true,promise:null};audioWake=wake;
   wake.promise=(async()=>{
    if(context.state!=='running')await context.resume();
    if(context.state!=='running')return null;
    // A short silent buffer wakes the audio device without an extra sound.
    await new Promise(resolve=>{
     const source=context.createBufferSource();
     source.buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.06),context.sampleRate);
     source.connect(context.destination);source.onended=()=>{source.disconnect();resolve();};source.start();
    });
    return context;
   })().catch(()=>null).finally(()=>{wake.pending=false;});
  }
  const contextReady=await audioWake.promise;
  return contextReady?.state==='running'?contextReady:null;
 }catch{return null;}
}
async function beep(ok){
 const context=await ensureAudio();
 if(!context||!save.sound)return;
 try{
  const o=context.createOscillator(),g=context.createGain(),start=context.currentTime+.015;
  o.connect(g);g.connect(context.destination);o.frequency.value=ok?660:190;
  g.gain.setValueAtTime(.001,start);g.gain.linearRampToValueAtTime(.09,start+.015);
  g.gain.exponentialRampToValueAtTime(.001,start+.24);
  o.onended=()=>{o.disconnect();g.disconnect();};o.start(start);o.stop(start+.26);
 }catch{}
}
function showModal(html){const modal=$('#modal');delete modal.dataset.settingsView;$('#modalContent').innerHTML=html;const heading=$('#modalContent h2');if(heading){heading.id='modalTitle';modal.setAttribute('aria-labelledby',heading.id);}else{modal.removeAttribute('aria-labelledby');}if(!modal.open)modal.showModal();}
function zoomCity(level){
 const viewer=document.createElement('dialog');viewer.className='city-viewer';viewer.setAttribute('aria-label',E.cities[level-1]+' · '+CITY_FEATURES[level-1]);
 viewer.innerHTML=`<button class="secondary city-viewer-close" autofocus>× 关闭</button>${cityTile(level)}<div class="city-viewer-caption">${E.cities[level-1]} · ${CITY_FEATURES[level-1]}</div>`;
 document.body.append(viewer);viewer.querySelector('button').onclick=()=>viewer.close();
 viewer.addEventListener('click',e=>{if(e.target===viewer){const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)viewer.close();}});
 viewer.addEventListener('close',()=>viewer.remove());viewer.showModal();
}
function closeModal(){const modal=$('#modal');delete modal.dataset.settingsView;modal.close();}
function art(){return '<button type="button" class="courier-button" id="courierBtn" aria-label="和熊猫打招呼"><span class="courier-reaction"><img class="courier-art" src="assets/panda.png" alt="" draggable="false"></span></button>';}
function greetCourier(){
 const reaction=$('#courierBtn .courier-reaction');
 reaction.getAnimations().forEach(animation=>animation.cancel());
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 reaction.animate(reduced?[
  {filter:'brightness(1.14)'},{filter:'brightness(1.14)'}
 ]:[
  {transform:'translateY(0) scale(1)'},
  {transform:'translateY(3px) scale(.97)',offset:.18},
  {transform:'translateY(-18px) scale(.98)',offset:.48},
  {transform:'translateY(0) scale(.99)',offset:.76},
  {transform:'translateY(-4px) scale(1)',offset:.88},
  {transform:'translateY(0) scale(1)'}
 ],{duration:reduced?320:620,easing:'ease-in-out'});
}
function home(){cancelAnimationFrame(raf);state=null;closeModal();const next=unlocked();chapter=Math.floor((next-1)/5);renderHome();}
function renderHome(){const next=unlocked(),done=Object.keys(save.best).length;
 $('#main').innerHTML=`<section class="hero"><div><h1>熊猫<em>快递局</em></h1><div class="actions"><button class="primary" id="continueBtn">${done?'继续旅程':'出发'} <span>→</span></button>${save.best[25]?'<button class="secondary" id="journeyMemory">旅程纪念册</button>':''}</div></div>${art()}</section><div class="section-top"><h2>快递旅程</h2><div class="journey-counts"><span>已抵达 <b>${done}</b> / 25 站</span><span>★ ${Object.values(save.best).reduce((n,x)=>n+x.stars,0)} / 75</span></div></div><div class="chapters" role="group" aria-label="选择旅程章节">${['熊猫出川','一路向东','北上北京','南下广州','开往春城'].map((x,i)=>`<button class="chapter ${i===chapter?'selected':''}" data-chapter="${i}" aria-pressed="${i===chapter}">0${i+1} ${x}</button>`).join('')}</div><div class="level-grid">${C.slice(chapter*5,chapter*5+5).map(x=>stationCard(x,next)).join('')}</div><section class="save-transfer" aria-label="存档管理"><div class="save-actions"><button class="secondary" id="exportSaveBtn">导出存档</button><button class="secondary" id="importSaveBtn">导入存档</button></div><p>把存档发给朋友，导入后即可选择已解锁的关卡。</p><p id="saveStatus" role="status" aria-live="polite"></p><input type="file" id="importSaveFile" accept=".json,application/json" hidden></section>`;
 bindProgressTransfer();
 $('#continueBtn').onclick=()=>prepare(next);if($('#journeyMemory'))$('#journeyMemory').onclick=showJourney;
 $('#courierBtn').onclick=greetCourier;
 document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{chapter=+b.dataset.chapter;renderHome();});
 document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>prepare(+b.dataset.level));
}
function prepare(level,practiceOnly=false){
 cancelAnimationFrame(raf);closeModal();
 const basketRows=E.baskets(level);
 state={level,practiceOnly,basketRows,basketKinds:basketRows[0],mode:'ready',index:0,nextIndex:0,correct:0,passed:0,missed:0,wrong:0,elapsed:0,roundElapsed:0,seq:E.sequence(level,basketRows),parcels:[],last:0,paused:false,practiceIndex:0};renderGame();
 overlay(`<div class="eyebrow">第 ${level} 站 · ${E.cities[level-1]}</div><h2>${E.config(level).simultaneous?'上下同时来，分别点快递':'入框就点'}</h2>${tutorialArt(level)}<div class="actions"><button class="${level<=3||practiceOnly?'primary':'secondary'}" id="startPractice">${level<=3||practiceOnly?'试一试':'练习'}</button>${level>3&&!practiceOnly?'<button class="primary" id="startOfficial">出发 →</button>':''}</div><button class="quiet rule-detail" id="ruleDetail">规则 ⓘ</button>`);
 $('#ruleDetail').onclick=()=>showModal(`<div class="eyebrow">第 ${level} 站 · ${E.cities[level-1]}</div><h2>本关规则</h2><p>${C[level-1].rule}</p><p>${C[level-1].detail}</p><p class="modal-note">通关目标：${C[level-1].threshold}。<br>练习不计入正式成绩，通关后收藏本关知识卡。</p><button class="primary" onclick="closeModal()">知道了</button>`);
 $('#startPractice').onclick=practiceStart;if($('#startOfficial'))$('#startOfficial').onclick=countdown;
}
function dual(){return E.config(state.level).lanes===2;}
function symbol(k){return k.replace('蓝色','').replace('橙色','').replace('黄色','').replace('紫色','').replace('双竹叶','竹竹').replace('单竹叶','竹').replace('竹叶','竹').replace('花朵','✿').replace('双圆点','••').replace('单圆点','•').replace('三圆点','•••').replace('圆点','•').replace('实心星形','★').replace('空心星形','☆').replace('实心圆形','●').replace('圆形','●').replace('方形','■').replace('三角形','▲').replace('星形','★').replace('向右','→').replace('向左','←').replace('向上','↑').replace('向下','↓')||'●';}
function color(k){return k.includes('蓝')?'blue':k.includes('橙')?'orange':k.includes('紫')?'purple':k.includes('黄')?'yellow':'';}
function renderGame(){const {level}=state;
 $('#main').innerHTML=`<div class="game-heading"><div><h1>第 ${String(level).padStart(2,'0')} 站 · <span class="game-city">${annotatePinyin(E.cities[level-1])}</span></h1></div><div class="game-tools"><button class="primary back-home" id="backHomeBtn">← 返回首页</button><button class="quiet" id="retryBtn">重来</button><button class="secondary" id="pauseBtn">暂停</button></div></div><div class="stats"><div class="stat">已处理<strong id="processed">0 / ${E.round(state.level).total}</strong></div><div class="stat">入篮<strong id="correct">0</strong></div><div class="stat">◷<strong id="timeLeft">—</strong></div><div class="progress-track"><i id="progress" style="width:0"></i></div></div><section class="warehouse ${dual()?'two-lanes':''}" id="warehouse"><div id="lanes"></div><div class="game-bottom"><div id="feedback" class="feedback" aria-live="polite"></div></div></section>`;
 $('#backHomeBtn').onclick=()=>confirmLeave(home,'返回旅程首页？');$('#retryBtn').onclick=()=>confirmLeave(()=>prepare(level,state.practiceOnly),'重新开始本关？');$('#pauseBtn').onclick=togglePause;renderLanes();
}
function renderLanes(){
 $('#lanes').innerHTML=state.basketRows.map((ks,lane)=>`<div class="lane" id="lane${lane}">${dual()?`<span class="lane-name">${lane?'下线':'上线'}</span>`:''}<div class="belt"></div>${ks.map((k,i)=>`<div class="basket" data-lane="${lane}" data-basket="${i}" style="left:${[25,52,79][i]}%"><div class="basket-body"><img src="assets/basket.png" alt="" draggable="false"><span title="${k}">${itemIcon(k)}</span></div></div>`).join('')}<button class="parcel done" id="parcel${lane}" data-lane="${lane}" aria-label="点击投放快递"></button></div>`).join('');
 document.querySelectorAll('.parcel').forEach(p=>p.onclick=()=>投递(+p.dataset.lane));
}
function overlay(html){$('#warehouse .overlay')?.remove();const d=document.createElement('div');d.className='overlay';d.innerHTML=html;$('#warehouse').append(d);}
function removeOverlay(){$('#warehouse .overlay')?.remove();}
function practiceStart(){
 state.mode='practice';state.practiceIndex=0;state.correct=0;state.passed=0;state.missed=0;state.wrong=0;
 renderLanes();removeOverlay();nextPractice();state.last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);
}
function createParcel(item,sequenceIndex){return {...item,sequenceIndex,elapsed:0,resolved:false,ended:false,practiceOk:false};}
function nextPractice(){
 const kinds=E.kinds(state.level),pair=E.config(state.level).simultaneous;
 const upperKind=kinds[state.practiceIndex%3],upperColumn=state.basketRows[0].indexOf(upperKind);
 state.parcels=Array.from({length:pair?2:1},(_,i)=>createParcel({kind:i?state.basketRows[1][(upperColumn+1)%3]:upperKind,lane:pair?i:dual()?state.practiceIndex%2:0},i));
 hideParcels();state.parcels.forEach(mountParcel);feedback(`练习 ${state.practiceIndex+1} / 3`);updateStats();
}
function countdown(){state.mode='countdown';state.elapsed=0;state.parcels=[];renderLanes();overlay('<span class="eyebrow">准备发车</span><div class="count">3</div>');state.last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}
function officialStart(){state.mode='playing';state.roundElapsed=0;state.index=0;state.nextIndex=0;state.correct=0;state.passed=0;state.missed=0;state.wrong=0;state.seq=E.sequence(state.level,state.basketRows);state.last=performance.now();removeOverlay();mountCurrent();}
function hideParcels(){document.querySelectorAll('.parcel').forEach(p=>{if(!p.id)p.remove();else p.classList.add('done');});document.querySelectorAll('.basket.active').forEach(b=>b.classList.remove('active'));}
function mountCurrent(){
 const amount=E.config(state.level).simultaneous?2:1;
 const start=state.nextIndex;
 state.parcels=state.seq.slice(start,start+amount).map((item,i)=>createParcel(item,start+i));
 state.nextIndex+=state.parcels.length;hideParcels();state.parcels.forEach(mountParcel);updateStats();
}
function mountParcel(c){
 const p=$('#parcel'+c.lane);p.innerHTML=`<div class="box"><img src="assets/parcel.png" alt="" draggable="false"><span class="label" title="${c.kind}">${itemIcon(c.kind)}</span></div>`;
 p.style.left='5%';p.classList.remove('done');p.setAttribute('aria-label',`${dual()?c.lane?'下线，':'上线，':''}${c.kind}快递，点击投放`);
}
function travel(c){const duration=state.mode==='practice'?6.5:E.duration(state.level,c.sequenceIndex);return {duration,x:E.position(c.elapsed,duration)};}
function 投递(lane){
 if(!state||!['practice','playing'].includes(state.mode)||state.paused||$('#modal').open)return;
 const c=state.parcels.find(p=>p.lane===lane&&!p.ended);if(!c||c.resolved)return;
 const {duration,x}=travel(c),basket=E.hit(x);
 if(c.elapsed>=duration-.25||basket<0){feedback('等入框',true);return;}
 const ok=state.basketRows[lane][basket]===c.kind;
 c.resolved=true;c.resolvedAt=c.elapsed;c.practiceOk=ok;
 const parcel=$('#parcel'+lane),ghost=parcel.cloneNode(true);ghost.removeAttribute('id');ghost.disabled=true;ghost.style.left=x*100+'%';ghost.style.pointerEvents='none';parcel.parentNode.append(ghost);
 ghost.animate(ok?[{transform:'translateX(-50%)',opacity:1},{transform:'translate(-50%, 65px) scale(.5)',opacity:0}]:[{transform:'translateX(-50%)',opacity:1},{transform:'translate(-50%, -35px) rotate(15deg)',opacity:0}],{duration:330,easing:'ease-in',fill:'forwards'}).onfinish=()=>ghost.remove();parcel.classList.add('done');
 if(ok){state.correct++;feedback('✓ 送达！');beep(true);}else{state.wrong++;feedback('篮子不对',true);beep(false);}updateStats();
}
function feedback(text,bad=false){$('#feedback').textContent=text;$('#feedback').className='feedback'+(bad?' bad':'');}
function endParcel(c){
 if(!state||!['playing','practice'].includes(state.mode)||!state.parcels.includes(c)||c.ended)return;
 c.ended=true;$('#parcel'+c.lane).classList.add('done');
 if(!c.resolved){state.missed++;feedback('错过啦',true);c.practiceOk=false;}
 if(state.mode==='practice'){
  if(!state.parcels.every(p=>p.ended))return;
  const ok=state.parcels.every(p=>p.practiceOk);if(ok)state.practiceIndex++;
  state.mode='practiceWait';overlay(`<h2>${ok?'✓ 漂亮！':'再试一次'}</h2><div class="practice-dots">${'●'.repeat(state.practiceIndex)+'○'.repeat(3-state.practiceIndex)}</div>${ok?'':tutorialArt(state.level)}<button class="primary" id="practiceNext">${ok&&state.practiceIndex===3?state.practiceOnly?'再练一次':'正式出发':'继续练习'}</button>${ok&&state.practiceIndex===3?'<button class="quiet" id="practiceHome">返回首页</button>':''}`);
  $('#practiceNext').onclick=()=>{if(state.practiceIndex===3){state.practiceOnly?practiceStart():countdown();}else{state.mode='practice';removeOverlay();nextPractice();state.last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}};if($('#practiceHome'))$('#practiceHome').onclick=home;return;
 }
 state.index++;updateStats();if(state.index===E.round(state.level).total){finish();return;}
 if(state.parcels.every(p=>p.ended))mountCurrent();
}
function updateStats(){
 if(!state)return;const total=E.round(state.level).total;
 $('#processed').textContent=state.mode==='practice'?`${state.practiceIndex} / 3`:`${state.index} / ${total}`;
 $('#correct').textContent=state.correct;$('#progress').style.width=state.index/total*100+'%';
 $('#timeLeft').textContent=state.mode==='practice'?'慢速':Math.max(0,Math.ceil(E.round(state.level).seconds-state.roundElapsed))+' 秒';
}
function tick(now){
 if(!state)return;const frameSeconds=Math.max(0,(now-state.last)/1000),dt=Math.min(frameSeconds,.08);state.last=now;
 if(state.paused){raf=requestAnimationFrame(tick);return;}
 if(state.mode==='countdown'){state.elapsed+=dt;const n=3-Math.floor(state.elapsed);if(n>0)$('.count').textContent=n;else officialStart();}
 else if(['playing','practice'].includes(state.mode)){
  const round=E.round(state.level);
  if(state.mode==='playing'){
   state.roundElapsed+=frameSeconds;
   if(state.roundElapsed>=round.seconds){state.roundElapsed=round.seconds;state.missed=round.total-state.correct-state.wrong;state.index=round.total;state.parcels.forEach(c=>c.ended=true);hideParcels();updateStats();finish();return;}
  }
  // Snapshot: finishing the second lane may create a new wave during this loop.
  for(const c of state.parcels.slice()){
   if(c.ended)continue;c.elapsed+=dt;
   const {duration,x}=travel(c);$('#parcel'+c.lane).style.left=x*100+'%';
   document.querySelectorAll(`.basket[data-lane="${c.lane}"]`).forEach(b=>b.classList.toggle('active',!c.resolved&&E.hit(x)===+b.dataset.basket&&c.elapsed<duration-.25));
   if(c.elapsed>=duration||(c.resolved&&c.elapsed-c.resolvedAt>=round.settle))endParcel(c);
  }
  updateStats();
 }
 if(state&&['playing','practice','countdown'].includes(state.mode))raf=requestAnimationFrame(tick);
}
function togglePause(){if(!state||!['playing','practice','countdown'].includes(state.mode))return;if(!state.paused){state.paused=true;showModal('<h2>已暂停</h2><img class="pause-panda" src="assets/panda.png" alt="休息中的熊猫快递员"><div class="modal-actions"><button class="primary" id="resume">继续</button><button class="secondary" id="pauseSettings">设置</button><button class="secondary" id="pauseHome">返回首页</button></div>');$('#resume').onclick=()=>{closeModal();state.paused=false;state.last=performance.now();};$('#pauseSettings').onclick=showSettings;$('#pauseHome').onclick=home;}}
function confirmLeave(action,title){if(!state||['ready','result','practiceWait'].includes(state.mode)){action();return;}state.paused=true;showModal(`<h2>${title}</h2><p>本局进度将重置。</p><div class="modal-actions"><button class="primary" id="confirm">确定</button><button class="secondary" id="cancel">继续游戏</button></div>`);$('#confirm').onclick=()=>{closeModal();action();};$('#cancel').onclick=()=>{closeModal();state.paused=false;state.last=performance.now();};}
// Only annotate the two characters requested by the player. Each surface
// owns its seen set, so the game heading cannot consume a card annotation.
function annotatePinyin(text,seen=new Set()){
 const readings={'沂':'yí','肇':'zhào'};
 return Array.from(text).map(ch=>{const safe=ch.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');if(!readings[ch]||seen.has(ch))return safe;seen.add(ch);return `<ruby>${safe}<rp>（</rp><rt><span class="pinyin-reading">${readings[ch]}</span></rt><rp>）</rp></ruby>`;}).join('');
}
function knowledgeReading(card){
 const seen=new Set();
 return {title:annotatePinyin(card.knowledgeTitle||E.cities[card.id-1],seen),body:annotatePinyin(card.knowledge,seen)};
}
function finish(){state.mode='result';cancelAnimationFrame(raf);const {level,correct,passed,missed,wrong}=state,r=E.result(level,correct,passed),reading=knowledgeReading(C[level-1]);if(r.win){const old=save.best[level];if(!old||r.score>old.score)save.best[level]={stars:r.stars,score:r.score};persist();}
 showModal(`<div class="eyebrow">${E.cities[level-1]}</div><div class="result-stars">${'★'.repeat(r.stars)+'☆'.repeat(3-r.stars)}</div><h2 class="result-title" tabindex="-1" autofocus>${r.win?level===25?'全程送达！':'顺利送达！':'再接再厉！'}</h2><div class="result-metrics"><div>得分<strong>${r.score}</strong></div></div><details class="score-details"><summary>成绩详情</summary><p>送达 ${correct} / ${E.round(state.level).total} · 漏投 ${missed} · 投错 ${wrong}</p></details>${r.win&&level%5===0?`<div class="chapter-seal">✦ ${['三峡','上海天际线','祈年殿','广州塔','斗南鲜花'][level/5-1]}纪念章</div>`:''}<article class="knowledge-card result-knowledge panda-knowledge"><img class="knowledge-panda" src="assets/panda.png" alt="熊猫快递员正在讲解"><div class="knowledge-bubble"><span class="eyebrow">熊猫讲给你听 · ${reading.title}</span><button class="knowledge-zoom" aria-label="放大${E.cities[level-1]}图片" onclick="zoomCity(${level})">${cityTile(level)}<span aria-hidden="true">⤢</span></button><p>${reading.body}</p></div></article><div class="modal-actions">${r.win&&level<25?'<button class="primary" id="nextLevel">下一站 →</button>':''}${r.win&&level===25?'<button class="primary" id="journeyEnd">展开旅程地图 →</button>':''}<button class="${r.win?'secondary':'primary'}" id="replay">再试一次</button><button class="secondary" id="resultHome">返回首页</button></div>`);
 if($('#journeyEnd'))$('#journeyEnd').onclick=showJourney;if($('#nextLevel'))$('#nextLevel').onclick=()=>prepare(level+1);$('#replay').onclick=()=>prepare(level);$('#resultHome').onclick=home;
}
$('#homeBtn').onclick=()=>confirmLeave(home,'返回旅程首页？');
$('#collectionBtn').onclick=()=>{if(state&&state.mode!=='result'&&state.mode!=='ready'){togglePause();return;}const cards=C.filter(x=>save.best[x.id]);showModal(`<h2>城市知识图鉴</h2><p class="collection-summary">已收藏 <strong>${cards.length} / 25</strong> 张</p><div class="collection">${cards.map(x=>{const reading=knowledgeReading(x);return `<article><h3>K${String(x.id).padStart(2,'0')} · ${reading.title}</h3><p>${reading.body}</p></article>`;}).join('')||'<p class="collection-empty">还没有知识卡</p>'}</div><div class="modal-actions"><button class="primary" id="closeCollection">关闭图鉴</button></div>`);$('#closeCollection').onclick=closeModal;};
function toggleSound(){save.sound=!save.sound;persist();if(save.sound)void ensureAudio();}
$('#modal').addEventListener('cancel',e=>{if(state?.paused)e.preventDefault();});
for(const eventName of ['pointerdown','click'])document.addEventListener(eventName,e=>{if(e.target.closest('button'))void ensureAudio();},{capture:true});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&state&&['playing','practice'].includes(state.mode)&&!$('#modal').open){e.preventDefault();}if(e.code==='Escape'&&!$('#modal').open)togglePause();});
// Repeated gameplay clicks must not start text selection or native image drag.
for(const eventName of ['selectstart','dragstart'])document.addEventListener(eventName,e=>{if(e.target.closest('#warehouse,.game-heading,.stats,button'))e.preventDefault();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state&&!state.paused)togglePause();});
home();
