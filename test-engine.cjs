const assert=require('node:assert/strict');
const E=require('./engine.js');
for(let l=1;l<=25;l++){
 for(let trial=0;trial<150;trial++){
  const a=E.sequence(l);assert.equal(a.length,12);
  for(const kind of E.kinds(l))assert.equal(a.filter(x=>x.kind===kind).length,4);
  a.forEach(x=>{assert.ok(x.yes&&!x.stamp);assert.ok(E.allowed(l,x.kind));assert.ok([0,1].includes(x.lane));assert.equal(x.phase,0);});
 }
 assert.ok(Math.abs(Array.from({length:12},(_,i)=>E.duration(l,i)).reduce((a,b)=>a+b,0)-60)<.001);
 const min=l<=10?9:10;
 assert.equal(E.result(l,min).win,true);assert.equal(E.result(l,min-1).win,false);
 assert.equal(E.result(l,12).score,100);assert.equal(E.result(l,12).stars,3);
 assert.equal(E.result(l,0).score,0);
 for(const x of [.25,.52,.79])assert.ok(Math.abs(E.position(E.timeAt(x,E.duration(l,0)),E.duration(l,0))-x)<.001);
}
assert.equal(E.hit(.25),0);assert.equal(E.hit(.52),1);assert.equal(E.hit(.79),2);assert.equal(E.hit(.05),-1);
console.log('PASS: 3750 matching sequences, scoring boundaries and travel timing.');
