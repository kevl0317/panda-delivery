const assert=require('node:assert/strict');
const E=require('./engine.js');
function noThreeSame(items){
 items.forEach((x,i)=>{if(i>=2)assert.ok(x.kind!==items[i-1].kind||x.kind!==items[i-2].kind,'No three identical symbols in a row on a lane');});
}
function checkSequence(level,basketRows=E.baskets(level)){
 const a=E.sequence(level,basketRows),design=E.config(level),round=E.round(level);
 assert.equal(a.length,round.total);
 for(const kind of E.kinds(level)){
  assert.equal(a.filter(x=>x.kind===kind).length,round.total/3);
  if(design.laneMode==='random'||design.simultaneous)for(const lane of [0,1]){
   assert.equal(a.filter(x=>x.kind===kind&&x.lane===lane).length,round.total/6);
  }
 }
 a.forEach((x,i)=>{
  assert.ok(x.yes&&!x.stamp&&E.allowed(level,x.kind));assert.equal(x.phase,0);
  if(level<16)assert.equal(x.lane,0);
  if(level===16||design.simultaneous)assert.equal(x.lane,i%2);
  if(design.laneMode==='random'&&i>=3)assert.ok([a[i-1],a[i-2],a[i-3]].some(y=>y.lane!==x.lane),'No four parcels on the same lane');
 });
 if(design.simultaneous){
  for(const lane of [0,1])noThreeSame(a.filter(x=>x.lane===lane));
  const pairs=new Map();
  for(let i=0;i<a.length;i+=2){
   const columns=a.slice(i,i+2).map(x=>basketRows[x.lane].indexOf(x.kind));
   assert.notEqual(columns[0],columns[1],'A pair must target different columns in the actual basket layout');
   const times=columns.map(col=>E.timeAt([.25,.52,.79][col],E.duration(level,i)));
   assert.ok(Math.abs(times[0]-times[1])>=.989,'Leave at least 0.99 seconds between target centers');
   const key=columns.join(',');pairs.set(key,(pairs.get(key)||0)+1);
  }
  assert.equal(pairs.size,6);assert.ok([...pairs.values()].every(count=>count===2),'Balance both click orders across all distinct target pairs');
 }
 else noThreeSame(a);
 if(level>=16)assert.equal(a.filter(x=>x.lane===0).length,round.total/2);
}
function checkBaskets(level){
 const lanes=E.baskets(level),settings=E.config(level);
 assert.equal(lanes.length,settings.lanes);
 for(const items of lanes)assert.deepEqual(items.slice().sort(),E.kinds(level).sort());
 if(level<=3)assert.deepEqual(lanes[0],E.kinds(level));
 if(level===16||level===17)assert.deepEqual(lanes[0],lanes[1]);
 if(level>=18)for(let i=0;i<3;i++)assert.notEqual(lanes[0][i],lanes[1][i],'Upper and lower baskets must differ in every column');
}
const realRandom=Math.random;
try{
 let seed=0x50414e44;
 Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let level=1;level<=25;level++){
  const settings=E.config(level),round=E.round(level),total=level>=21?24:12;
  assert.equal(settings.lanes,level<16?1:2);
  assert.equal(settings.shuffleBaskets,level>3);assert.equal(new Set(E.kinds(level)).size,3);
  assert.equal(settings.independentBaskets,level>=18);assert.equal(settings.simultaneous,level>=21);
  assert.deepEqual(round,{total,targets:total,releases:0,seconds:60,settle:.35});
  for(let trial=0;trial<150;trial++){checkSequence(level);checkBaskets(level);}
  const min=level<=10?9:level<=20?10:20;
  assert.equal(settings.pass,min);
  assert.equal(E.result(level,min).win,true);assert.equal(E.result(level,min-1).win,false);
  assert.equal(E.result(level,total).stars,3);assert.equal(E.result(level,total).score,100);
  assert.equal(E.result(level,level>=21?23:12).stars,3);
  assert.equal(E.result(level,level>=21?22:11).stars,2);
  assert.equal(E.result(level,min).stars,1);assert.equal(E.result(level,0).score,0);
  const seconds=level<=18?5:level===19?4.8:level===20?4.6:[5,4.8,4.6,4.4,4.2][level-21];
  for(let i=0;i<total;i++)assert.equal(E.duration(level,i),seconds,'No within-level speed jumps');
  const waves=total/(settings.simultaneous?2:1);
  assert.ok(waves*seconds<=round.seconds,'Every parcel gets a complete journey within the round');
  for(const x of [.25,.52,.79]){
   assert.ok(Math.abs(E.position(E.timeAt(x,seconds),seconds)-x)<.001);
   assert.ok(E.timeAt(x+E.HIT_RADIUS,seconds)-E.timeAt(x-E.HIT_RADIUS,seconds)>=.953,'Keep at least 0.95 seconds to click in the finale');
  }
 }
 for(const value of [0,.5,.999]){Math.random=()=>value;for(let l=1;l<=25;l++){checkSequence(l);checkBaskets(l);}}
 // All permutations, including fallback with pathological random sources.
 const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 for(const value of [0,.5,.999]){
  Math.random=()=>value;
  for(let level=21;level<=25;level++)for(const top of orders)for(const bottom of orders){
   const kinds=E.kinds(level);checkSequence(level,[top.map(i=>kinds[i]),bottom.map(i=>kinds[i])]);
  }
 }
}finally{Math.random=realRandom;}
assert.deepEqual(E.kinds(16),['蓝色','橙色','紫色']);
assert.deepEqual(E.kinds(17),['竹叶','花朵','圆点']);
assert.deepEqual(E.kinds(18),['实心星形','空心星形','实心圆形']);
assert.deepEqual(E.kinds(25),['蓝色单竹叶','蓝色双竹叶','橙色双竹叶']);
assert.equal(E.ROUND.total,12,'The baseline remains backwards compatible');
assert.equal(E.duration(21,0),E.duration(18,0),'Reset the first simultaneous stage to the pre-speedup pace');
assert.ok(E.duration(25,0)>3.9,'The finale stays slower than the original 3.9-second version');
for(let level=22;level<=25;level++)assert.ok(E.duration(level,0)<E.duration(level-1,0),'Every stage after the reset is faster than the preceding stage');
assert.ok(E.duration(25,0)<E.duration(20,0),'The final stage exceeds the previous chapter peak speed');
assert.equal(E.hit(.05),-1);assert.equal(E.hit(.25),0);assert.equal(E.hit(.52),1);assert.equal(E.hit(.79),2);
console.log('PASS: balanced schedules, all paired basket permutations, distinct targets with 0.99s separation, bounded generation, slower speeds, stage21 reset, scoring and click windows.');

for(const [i,center] of [.25,.52,.79].entries()){
 assert.equal(E.hit(center-.13),i);assert.equal(E.hit(center+.13),i);
 assert.equal(E.hit(center-.131),-1);assert.equal(E.hit(center+.131),-1);
}
assert.equal(E.hit(.385),-1);assert.equal(E.hit(.655),-1);
