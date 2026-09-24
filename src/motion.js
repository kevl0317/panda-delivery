// Presentation layer over the game's own markup: page entrances, basket catches,
// countdown pops, result stars and 图鉴 pictures. It only adds classes and
// decorative elements; game state and rules stay in app.js and engine.js.
(function(){
 const main=document.getElementById('main'),modal=document.getElementById('modal'),content=document.getElementById('modalContent');
 if(!main||!modal||!content)return;
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const restart=(el,cls,ms)=>{el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);clearTimeout(el.thTimer);el.thTimer=setTimeout(()=>el.classList.remove(cls),ms);};
 const kind=()=>main.querySelector('.warehouse')?'game':main.querySelector('.hero')?'home':main.querySelector('.journey-finale')?'finale':'other';
 let page=kind(),watchers=[];
 const watch=(target,options,fn)=>{if(!target)return;const o=new MutationObserver(fn);o.observe(target,options);watchers.push(o);};

 // Every screen replaces #main's children. Re-rendering the same screen (a new
 // chapter tab on the home page) keeps the page still and only moves its cards.
 new MutationObserver(()=>{
  const next=kind();main.classList.toggle('th-same',next===page&&next!=='game');page=next;
  watchers.forEach(o=>o.disconnect());watchers=[];
  if(next==='game')watchGame();
 }).observe(main,{childList:true});

 function watchGame(){
  const feedback=main.querySelector('#feedback'),lanes=main.querySelector('#lanes'),warehouse=main.querySelector('#warehouse'),time=main.querySelector('#timeLeft');
  watch(feedback,{childList:true},()=>{if(feedback.textContent)restart(feedback,'th-pop',420);});
  // A delivered parcel leaves a ghost copy in its lane; answer at that basket.
  watch(lanes,{childList:true,subtree:true},records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1&&n.classList.contains('parcel')&&!n.id)catchEffect(n);});
  let count='';
  const scene=()=>{
   // The level intro shows the destination city above its title.
   const intro=warehouse.querySelector('.overlay #startPractice')?.closest('.overlay');
   try{if(intro&&!intro.querySelector('.intro-city'))intro.insertAdjacentHTML('afterbegin',`<div class="intro-city" aria-hidden="true">${cityTile(state.level)}</div>`);}catch{}
   const c=warehouse.querySelector('.count');if(!c){count='';return;}
   if(c.textContent!==count){count=c.textContent;restart(c,'th-tick',650);}
  };
  watch(warehouse,{childList:true,subtree:true},scene);scene();
  let low=null;
  watch(time,{childList:true},()=>{const s=parseInt(time.textContent,10),is=s>0&&s<=10;if(is!==low){low=is;time.closest('.stat')?.classList.toggle('is-low',is);}});
 }
 function catchEffect(ghost){
  const lane=ghost.parentElement,x=parseFloat(ghost.style.left)/100;
  if(!lane||!(x>=0)||typeof PandaEngine==='undefined')return;
  const i=PandaEngine.hit(x),basket=i<0?null:lane.querySelector(`.basket[data-basket="${i}"]`);if(!basket)return;
  const ok=ghost.querySelector('.label')?.title===basket.querySelector('.basket-body>span')?.title;
  restart(basket,ok?'is-catch':'is-miss',600);
  if(reduced())return;
  const box=(basket.querySelector('.basket-body')||basket).getBoundingClientRect(),own=lane.getBoundingClientRect();
  const pop=document.createElement('span');pop.className='catch-pop'+(ok?'':' is-bad');pop.textContent=ok?'+1':'✗';pop.setAttribute('aria-hidden','true');
  pop.style.left=`${box.left+box.width/2-own.left}px`;pop.style.top=`${box.top-own.top+box.height*.18}px`;
  lane.append(pop);setTimeout(()=>pop.remove(),850);
 }

 // Result, 图鉴 and other dialogs share #modalContent.
 new MutationObserver(decorateModal).observe(content,{childList:true});
 function decorateModal(){
  const stars=content.querySelector('.result-stars');
  modal.classList.toggle('th-result',!!stars);
  if(!stars){modal.classList.remove('th-win');decorateCollection();return;}
  if(stars.dataset.th)return;
  const marks=[...stars.textContent.trim()],won=marks.filter(m=>m==='★').length;
  stars.dataset.th='1';stars.setAttribute('role','img');stars.setAttribute('aria-label',`${won} 颗星`);
  stars.innerHTML=marks.map((m,i)=>`<span class="${m==='★'?'is-on':'is-off'}" style="--i:${i}" aria-hidden="true">${m}</span>`).join('');
  modal.classList.toggle('th-win',won>0);
  const seal=content.querySelector('.chapter-seal');
  try{if(seal&&!seal.querySelector('.city-art')&&state)seal.insertAdjacentHTML('afterbegin',cityTile(state.level));}catch{}
  if(won>0&&!reduced())content.insertAdjacentHTML('afterbegin',confetti(24+won*6));
 }
 function confetti(n){
  const colors=['#b8732a','#2e8574','#3f6fa6','#bf5a4c','#8563ad','#f3c95f','#e58aa4'];
  return `<div class="th-confetti" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i style="--x:${(i*37+11)%100}%;--d:${(i%9*.12+.2).toFixed(2)}s;--t:${(2.2+i%5*.3).toFixed(2)}s;--r:${(i%2?1:-1)*(200+i*31%240)}deg;--c:${colors[i%colors.length]}"></i>`).join('')}</div>`;
 }
 function decorateCollection(){
  content.querySelectorAll('.collection article').forEach((article,i)=>{
   if(article.querySelector('.city-art'))return;
   const id=Number(article.querySelector('h3')?.textContent.match(/K(\d+)/)?.[1]);
   if(id>=1&&id<=25)article.insertAdjacentHTML('afterbegin',cityTile(id));
   article.style.animationDelay=`${Math.min(i,12)*40}ms`;
  });
 }

 // A small gold ring answers every press, drawn above dialogs when one is open.
 document.addEventListener('pointerdown',e=>{
  if(reduced()||e.button>0)return;
  const ring=document.createElement('span');ring.className='th-ripple';ring.setAttribute('aria-hidden','true');
  ring.style.left=`${Math.min(Math.max(e.clientX,20),innerWidth-20)}px`;ring.style.top=`${Math.min(Math.max(e.clientY,20),innerHeight-20)}px`;
  (e.target.closest?.('dialog[open]')||document.body).append(ring);setTimeout(()=>ring.remove(),500);
 },{passive:true,capture:true});
})();
