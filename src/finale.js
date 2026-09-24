// Journey finale: a hand-drawn road-trip schematic, not a geographic boundary or
// navigation map. Each chapter colour ties a route ribbon to its badge.
const JOURNEY_CHAPTERS=[
 {name:'熊猫出川',road:'G42',roadName:'沪蓉高速',seal:'三峡',color:'#b8732a'},
 {name:'一路向东',road:'G42',roadName:'沪蓉高速',seal:'上海天际线',color:'#2e8574'},
 {name:'北上北京',road:'G2',roadName:'京沪高速',seal:'祈年殿',color:'#3f6fa6'},
 {name:'南下广州',road:'G4',roadName:'京港澳高速',seal:'广州塔',color:'#bf5a4c'},
 {name:'开往春城',road:'G80',roadName:'广昆高速',seal:'斗南鲜花',color:'#8563ad'}
];
// Stop 0 is 成都 and stop n is level n: [x, y, label side]. Level 18 returns to
// the level 7 stop, so G42 and G4 cross at one 武汉 station.
const JOURNEY_STOPS=[
 [90,338,'s'],[160,318,'n'],[226,336,'n'],[292,352,'n'],[356,326,'n'],[462,336,'n'],
 [522,312,'n'],[590,336,'se'],[676,306,'n'],[756,292,'s'],[872,322,'s'],
 [836,262,'e'],[820,206,'e'],[796,156,'e'],[744,112,'e'],[640,86,'n'],
 [598,142,'w'],[574,222,'w'],null,[566,428,'e'],[584,530,'s'],
 [506,548,'s'],[428,532,'s'],[338,550,'s'],[246,530,'s'],[122,508,'s']
];
JOURNEY_STOPS[18]=JOURNEY_STOPS[7];
// Each road shield sits on a quiet stretch: [segment, position along it].
const JOURNEY_SHIELDS=[[4,.4],[4,.5],[4,.38],[2,.5],[2,.5]];
let journeyFrame=0,journeyFocus=-1;
const journeyStops=i=>[i?i*5:0,i*5+1,i*5+2,i*5+3,i*5+4,i*5+5];
const journeyStars=i=>[1,2,3,4,5].reduce((n,k)=>n+(save.best[i*5+k]?.stars||0),0);
const journeyEase=t=>t<.5?4*t*t*t:1-Math.pow(2-2*t,3)/2;
const journeyReduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const jn=v=>+v.toFixed(1);
function roadShield(road){return `<span class="road-shield">${road}</span>`;}
// Catmull-Rom through the points as cubic Béziers, so roads and rivers bend softly.
function journeyCurve(points,closed=false){
 const n=points.length,at=i=>closed?points[(i+n)%n]:points[Math.max(0,Math.min(n-1,i))],segs=[];
 for(let i=0;i<(closed?n:n-1);i++){
  const a=at(i-1),b=at(i),c=at(i+1),e=at(i+2);
  segs.push([b,[b[0]+(c[0]-a[0])/6,b[1]+(c[1]-a[1])/6],[c[0]-(e[0]-b[0])/6,c[1]-(e[1]-b[1])/6],c]);
 }
 const d=`M${jn(segs[0][0][0])} ${jn(segs[0][0][1])}`+segs.map(([,c1,c2,c])=>`C${jn(c1[0])} ${jn(c1[1])} ${jn(c2[0])} ${jn(c2[1])} ${jn(c[0])} ${jn(c[1])}`).join('')+(closed?'Z':'');
 return {d,segs};
}
function journeyBez([p,c1,c2,q],t){const u=1-t;return [0,1].map(k=>u*u*u*p[k]+3*u*u*t*c1[k]+3*u*t*t*c2[k]+t*t*t*q[k]);}
// Painted landscape stays separate from accurate labels and interactive roads.
function journeyTerrain(){
 const yangtze=journeyCurve([[-10,472],[40,450],[100,428],[160,412],[220,398],[290,386],[340,376],[382,360],[440,382],[520,380],[590,378],[642,364],[690,338],[724,306],[756,272],[800,250],[846,238],[910,232],[970,228]]);
 const yellow=journeyCurve([[-10,178],[30,170],[70,150],[98,116],[130,82],[180,64],[250,58],[320,62],[372,76],[398,106],[410,150],[424,188],[470,204],[530,204],[574,198],[612,186],[662,158],[700,122],[742,94],[800,72],[870,58],[970,48]]);
 const jialing=journeyCurve([[196,228],[194,262],[186,298],[190,334],[204,370],[214,406]]);
 const xiang=journeyCurve([[462,506],[494,482],[528,462],[546,436],[540,412],[528,402]]);
 const xijiang=journeyCurve([[150,612],[210,598],[270,594],[338,600],[420,596],[500,602],[548,614],[570,634]]);
 const compass=`<g class="t-compass" transform="translate(898 520)"><circle class="c-ring" r="31"/><circle class="c-ring2" r="24"/><path class="c-minor" transform="rotate(45) scale(.6)" d="M0-36 6-6 36 0 6 6 0 36-6 6-36 0-6-6Z"/><path class="c-major" d="M0-36 6-6 36 0 6 6 0 36-6 6-36 0-6-6Z"/><path class="c-lit" d="M0-36 6-6 0 0ZM36 0 6 6 0 0ZM0 36-6 6 0 0ZM-36 0-6-6 0 0Z"/><circle class="c-pin" r="3"/><text class="c-north" y="-40">北</text></g>`;
 const rivers=[yangtze,yellow,jialing,xiang,xijiang],names=['jm-yangtze','jm-yellow','jm-jialing','jm-xiang','jm-xijiang'];
 return `<g class="map-terrain" aria-hidden="true"><image class="map-landscape" href="assets/journey-terrain.png" x="0" y="0" width="960" height="620" preserveAspectRatio="none"/><text class="t-name" x="512" y="26">长城</text>${compass}</g>
 <g class="map-water-labels" aria-hidden="true"><defs>${rivers.map((r,i)=>`<path id="${names[i]}" d="${r.d}" fill="none"/>`).join('')}</defs>
  <text class="w-name" dy="24"><textPath href="#jm-yangtze" startOffset="175">长江</textPath></text>
  <text class="w-name is-yellow" dy="-11"><textPath href="#jm-yellow" startOffset="268">黄河</textPath></text>
  <text class="w-name" dy="-8"><textPath href="#jm-xijiang" startOffset="296">西江</textPath></text>
  <text class="w-label" x="210" y="262">嘉陵江</text><text class="w-label" x="500" y="452" text-anchor="end">湘江</text>
  <text class="w-label" x="494" y="428" text-anchor="end">洞庭湖</text><text class="w-label" x="672" y="404">鄱阳湖</text><text class="w-label" x="50" y="572" text-anchor="middle">滇池</text>
 </g>`;
}
function journeyMap(){
 const P=JOURNEY_STOPS,curves=JOURNEY_CHAPTERS.map((_,i)=>journeyCurve(journeyStops(i).map(n=>P[n])));
 const shield=road=>{const w=road.length>2?44:36;return `<rect class="shield-body" x="${-w/2}" y="-13" width="${w}" height="26" rx="5"/><rect class="shield-cap" x="${-w/2+2.5}" y="-10.5" width="${w-5}" height="6" rx="2"/><text class="shield-text" y="8">${road}</text>`;};
 const routes=curves.map(({d,segs},i)=>{const c=JOURNEY_CHAPTERS[i],[seg,t]=JOURNEY_SHIELDS[i],[x,y]=journeyBez(segs[seg],t);return `<g class="map-route" data-chapters="${i}" style="--route:${c.color}"><path class="route-halo" d="${d}" pathLength="1"/><path class="route-casing" d="${d}" pathLength="1"/><path class="route-core" d="${d}" pathLength="1"/><path class="route-dash" d="${d}"/><g class="map-shield" transform="translate(${jn(x)} ${jn(y)})">${shield(c.road)}</g></g>`;}).join('');
 const place=([x,y,side])=>({n:[x,y-14,'middle'],s:[x,y+25,'middle'],e:[x+14,y+5,'start'],w:[x-14,y+5,'end'],se:[x+13,y+26,'start']})[side];
 const stops=[1,2,3,4,6,7,8,9,11,12,13,14,16,17,19,21,22,23,24].map(l=>{
  const [x,y]=P[l],[tx,ty,anchor]=place(P[l]),i=Math.floor((l-1)/5),twice=l===7;
  return `<g class="map-stop${twice?' is-interchange':''}" data-chapters="${twice?'1 3':i}" data-level="${l}" style="--route:${JOURNEY_CHAPTERS[i].color}"><title>${twice?'第 7 站、第 18 站':`第 ${l} 站`} · ${E.cities[l-1]}</title><circle cx="${x}" cy="${y}" r="${twice?9:6.5}"/><text x="${tx}" y="${ty}" text-anchor="${anchor}">${E.cities[l-1]}</text></g>`;
 }).join('');
 const hubs=[0,5,10,15,20,25].map(l=>{
  const [x,y,side]=P[l],i=l/5,n=l-1,name=l?E.cities[n]:'成都',text=l===0?'成都 · 出发':l===25?'昆明 · 终点':name;
  const w=[...text].reduce((sum,ch)=>sum+(ch.codePointAt(0)<0x2e80?4.5:15),0)+26,ly=side==='n'?-47:48;
  const art=l?`<image href="assets/cities-atlas.png" x="${-(n%5*62+31)}" y="${-(Math.floor(n/5)*62+31)}" width="310" height="310" preserveAspectRatio="none" clip-path="url(#jm-hub)"/>`:`<image href="assets/logo.png?v=2" x="-24" y="-24" width="48" height="48" clip-path="url(#jm-hub)"/>`;
  return `<g class="map-hub" data-chapters="${l===0?0:l===25?4:`${i-1} ${i}`}"${l?` data-level="${l}"`:''} style="--route:${l?JOURNEY_CHAPTERS[i-1].color:'#1f5a3f'}" transform="translate(${x} ${y})"><title>${l?`第 ${l} 站 · ${name} · ${JOURNEY_CHAPTERS[i-1].seal}纪念章`:'成都 · 熊猫快递局出发'}</title><g class="hub-art"><circle class="hub-shadow" cy="3" r="30"/><circle class="hub-ring" r="29"/><circle class="hub-gap" r="25.5"/>${art}<circle class="hub-gold" r="23"/></g><g class="hub-label" transform="translate(0 ${ly})"><rect x="${-w/2}" y="-12.5" width="${w}" height="25" rx="12.5"/><text y="5">${text}</text></g></g>`;
 }).join('');
 // Face crop of assets/panda.png: centre (605, 350), radius 277 source pixels.
 const k=12.5/277,pin=`<g class="map-pin" aria-hidden="true"><ellipse class="pin-shadow" rx="8" ry="3"/><g class="pin-body"><path class="pin-drop" d="M0 0C-5-8-16-16-16-29A16 16 0 1 1 16-29C16-16 5-8 0 0Z"/><circle class="pin-window" cy="-29" r="12.5"/><image href="assets/panda.png" x="${jn(-605*k)}" y="${jn(-29-350*k)}" width="${jn(1199*k)}" height="${jn(1312*k)}" clip-path="url(#jm-face)"/></g></g>`;
 return `<svg class="journey-map" viewBox="0 0 960 620" role="img" aria-label="旅程路线示意图：成都出发，沿G42经宜昌到上海，G2北上北京，G4经武汉南下广州，G80开往昆明"><defs>
  <clipPath id="jm-hub"><circle r="23"/></clipPath><clipPath id="jm-face"><circle cy="-29" r="12.5"/></clipPath></defs>
  ${journeyTerrain()}
  <g class="map-routes">${routes}</g>${stops}${hubs}${pin}
  <text class="map-note" x="944" y="606" text-anchor="end">旅程路线示意 · 非导航地图</text>
 </svg>`;
}
function journeyDetail(i){
 if(i<0){
  const ends=['成都',...[5,10,15,20,25].map(l=>E.cities[l-1])];
  return `<div class="route-overview"><div class="route-line">${ends.map((city,k)=>`<span class="route-end">${city}</span>${k<5?`<button class="route-leg" data-leg="${k}" style="--route:${JOURNEY_CHAPTERS[k].color}" aria-label="查看第 ${k+1} 章 ${JOURNEY_CHAPTERS[k].name}：${city} 到 ${ends[k+1]}"><span>${JOURNEY_CHAPTERS[k].road}</span></button>`:''}`).join('')}</div><p>点一点纪念章或路段，回看每一段路上的城市。</p></div>`;
 }
 const c=JOURNEY_CHAPTERS[i],from=i?E.cities[i*5-1]:'成都';
 return `<div class="route-head" style="--route:${c.color}">${roadShield(c.road)}<div class="route-title"><strong>第 ${i+1} 章 · ${c.name}</strong><span>${c.roadName} · ${from} → ${E.cities[i*5+4]}</span></div><span class="route-stars">★ ${journeyStars(i)} / 15</span><button class="route-all" data-all>看全程</button></div><div class="route-stops">${[1,2,3,4,5].map(k=>{const l=i*5+k,s=save.best[l]?.stars||0;return `<button class="route-stop" data-zoom="${l}" aria-label="放大查看第 ${l} 站 ${E.cities[l-1]}">${cityTile(l)}<span class="stop-name"><small>${String(l).padStart(2,'0')}</small>${E.cities[l-1]}</span><span class="stop-stars" aria-label="${s} 颗星">${'★'.repeat(s)}${'☆'.repeat(3-s)}</span></button>`;}).join('')}</div>`;
}
function showJourney(){
 cancelAnimationFrame(raf);cancelAnimationFrame(journeyFrame);closeModal();state=null;journeyFocus=-1;
 const stars=Object.values(save.best).reduce((n,x)=>n+x.stars,0),done=Object.keys(save.best).length,seals=JOURNEY_CHAPTERS.filter((_,i)=>save.best[(i+1)*5]).length;
 const colors=[...JOURNEY_CHAPTERS.map(c=>c.color),'#f3c95f','#fff0c0'];
 const confetti=Array.from({length:30},(_,i)=>`<i style="--x:${(i*37+7)%100}%;--d:${(i%10*.17).toFixed(2)}s;--t:${(2.6+i%5*.35).toFixed(2)}s;--r:${(i%2?1:-1)*(220+i*29%260)}deg;--c:${colors[i%colors.length]}"></i>`).join('');
 const roads=[...new Map(JOURNEY_CHAPTERS.map(c=>[c.road,c.roadName]))];
 $('#main').innerHTML=`<section class="journey-finale">
  <div class="finale-hero"><div class="hero-burst" aria-hidden="true"></div><div class="hero-confetti" aria-hidden="true">${confetti}</div>
   <img class="hero-panda" src="assets/panda.png" alt="熊猫快递员挥手庆祝">
   <div class="hero-copy"><span class="hero-kicker">熊猫快递局 · 旅程纪念</span><h1><span>最后一件，</span><span>送达春城！</span></h1><p>从成都到昆明，${done} 站的风景，都装进了你的快递旅程。</p>
    <ul class="hero-stats"><li><b>${done}<small>/25</small></b><span>抵达站点</span></li><li><b>★ ${stars}<small>/75</small></b><span>收集星星</span></li><li><b>${seals}<small>/5</small></b><span>章节纪念章</span></li></ul></div>
   <button class="secondary hero-home" id="finaleHome">← 返回首页</button></div>
  <div class="finale-layout">
   <div class="journey-map-panel"><div class="map-head"><h2>快递旅程路线图</h2><ul class="map-legend">${roads.map(([road,name])=>`<li>${roadShield(road)}${name}</li>`).join('')}</ul><button class="map-replay" id="journeyReplay">▶ 重走一遍</button></div>
    <div class="journey-map-scroll"><div class="journey-map-frame">${journeyMap()}</div></div>
    <p class="map-swipe" aria-hidden="true">← 左右滑动看完整路线 →</p>
    <div class="finale-route" id="finaleRoute" aria-live="polite">${journeyDetail(-1)}</div></div>
   <aside class="finale-badges" aria-label="章节纪念章">${JOURNEY_CHAPTERS.map((c,i)=>{const earned=!!save.best[(i+1)*5];return `<button class="finale-badge${earned?'':' is-locked'}" data-journey="${i}" aria-pressed="false" style="--badge:${c.color}"><span class="badge-medal">${cityTile((i+1)*5)}<span class="badge-check" aria-hidden="true">${earned?'✓':'?'}</span></span><span class="badge-text"><span class="badge-meta">${roadShield(c.road)}第 ${i+1} 章</span><strong>${c.name}</strong><span class="badge-seal">${c.seal}纪念章${earned?'':' · 未获得'}</span></span><span class="badge-stars">★ ${journeyStars(i)}<small>/15</small></span></button>`;}).join('')}</aside>
  </div>
  <section class="finale-letter" aria-label="熊猫快递员的感谢信"><div class="letter-card">
   <div class="letter-stamp" aria-hidden="true"><img src="assets/panda.png" alt=""><span>熊猫快递局</span><b>25站</b></div>
   <svg class="letter-postmark" viewBox="0 0 210 120" aria-hidden="true"><circle class="pm-ring" cx="60" cy="60" r="52"/><circle class="pm-ring" cx="60" cy="60" r="34"/><path id="jm-postmark" fill="none" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0"/><text class="pm-arc"><textPath href="#jm-postmark">熊猫快递局 · 全程送达 · 熊猫快递局 · 全程送达 ·</textPath></text><text class="pm-city" x="60" y="59">昆明</text><text class="pm-date" x="60" y="78">终点站</text><path class="pm-wave" d="M118 42q11-8 22 0t22 0t22 0t22 0M118 60q11-8 22 0t22 0t22 0t22 0M118 78q11-8 22 0t22 0t22 0t22 0"/></svg>
   <p class="letter-to">亲爱的小快递员：</p>
   <p>从成都到昆明，谢谢你陪我把每份心意送到家！</p>
   <p>${JOURNEY_CHAPTERS.map(c=>c.seal).join('、')}，五枚纪念章都已收进旅程纪念册。</p>
   <p>下次出发，我们再一起上路！</p>
   <p class="letter-sign">你的搭档 · 熊猫快递员</p></div>
   <div class="letter-actions"><button class="primary" id="finaleHomeEnd">返回首页</button><button class="secondary" id="finaleCards">城市知识图鉴</button></div></section>
 </section>`;
 $('#finaleHome').onclick=home;$('#finaleHomeEnd').onclick=home;$('#finaleCards').onclick=()=>$('#collectionBtn').click();
 document.querySelectorAll('[data-journey]').forEach(button=>button.onclick=()=>{const i=+button.dataset.journey;selectJourney(i===journeyFocus?-1:i);});
 $('#finaleRoute').onclick=e=>{const zoom=e.target.closest('[data-zoom]'),leg=e.target.closest('[data-leg]');if(zoom)zoomCity(+zoom.dataset.zoom);else if(leg)selectJourney(+leg.dataset.leg);else if(e.target.closest('[data-all]'))selectJourney(-1);};
 // 武汉 shows its second visit while the G4 chapter is in focus.
 $('.journey-map').onclick=e=>{const stop=e.target.closest('[data-level]');if(stop)zoomCity(+stop.dataset.level===7&&journeyFocus===3?18:+stop.dataset.level);};
 $('#journeyReplay').onclick=()=>{selectJourney(-1,false);playJourney();};
 window.scrollTo(0,0);playJourney();
}
function journeyDraw(route,p){
 route.classList.toggle('is-hidden',p<=0);route.classList.toggle('is-drawing',p>0&&p<1);
 route.querySelectorAll('[pathLength]').forEach(path=>path.style.strokeDasharray=p>0&&p<1?`${p} 1`:'');
}
// The pin hops off a station medallion when it departs and back on when it arrives.
function journeyPin(route,p){
 const path=route.querySelector('.route-core'),point=path.getPointAtLength(path.getTotalLength()*p);
 const hop=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);},lift=26*Math.max(hop(1-p/.12),hop((p-.88)/.12));
 $('.map-pin').setAttribute('transform',`translate(${point.x.toFixed(1)} ${(point.y-lift).toFixed(1)})`);
}
function playJourney(){
 const map=$('.journey-map');if(!map)return;cancelAnimationFrame(journeyFrame);
 const routes=[...map.querySelectorAll('.map-route')],hubs=[...map.querySelectorAll('.map-hub')],badges=[...document.querySelectorAll('.finale-badge')],leg=1200;
 const finish=()=>{routes.forEach(r=>journeyDraw(r,1));badges.forEach(b=>{b.classList.remove('is-waiting');if(!b.classList.contains('is-locked'))b.classList.add('is-stamped');});map.classList.remove('is-playing');};
 if(journeyReduced()){finish();journeyPin(routes[4],1);return;}
 badges.forEach(b=>{b.classList.remove('is-stamped');b.classList.add('is-waiting');});hubs.forEach(h=>h.classList.remove('is-reached'));
 map.classList.add('is-playing');map.journeyFinish=finish;hubs[0].classList.add('is-reached');
 const start=performance.now();let reached=-1;
 const step=now=>{
  if(!map.isConnected)return;
  const t=Math.max(0,Math.min(5,(now-start)/leg)),i=Math.min(4,Math.floor(t)),p=t>=5?1:journeyEase(t-i);
  routes.forEach((r,j)=>journeyDraw(r,j<i?1:j>i?0:p));journeyPin(routes[i],p);
  for(const done=t>=5?4:i-1;reached<done;){reached++;hubs[reached+1].classList.add('is-reached');const b=badges[reached];b.classList.remove('is-waiting');if(!b.classList.contains('is-locked'))b.classList.add('is-stamped');}
  if(t<5)journeyFrame=requestAnimationFrame(step);else finish();
 };
 journeyFrame=requestAnimationFrame(step);
}
function selectJourney(i,travel=true){
 const map=$('.journey-map');if(!map)return;
 if(map.classList.contains('is-playing')){cancelAnimationFrame(journeyFrame);map.journeyFinish();}
 journeyFocus=i;
 document.querySelectorAll('[data-journey]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.journey===i)));
 map.classList.toggle('has-focus',i>=0);
 map.querySelectorAll('[data-chapters]').forEach(el=>el.classList.toggle('is-muted',i>=0&&!el.dataset.chapters.split(' ').includes(String(i))));
 $('#finaleRoute').innerHTML=journeyDetail(i);
 if(!travel)return;
 const route=map.querySelectorAll('.map-route')[i<0?4:i];cancelAnimationFrame(journeyFrame);
 if(i<0||journeyReduced()){journeyPin(route,1);return;}
 const start=performance.now();
 const step=now=>{if(!route.isConnected)return;const t=Math.max(0,Math.min(1,(now-start)/1100));journeyPin(route,journeyEase(t));if(t<1)journeyFrame=requestAnimationFrame(step);};
 journeyFrame=requestAnimationFrame(step);
}
