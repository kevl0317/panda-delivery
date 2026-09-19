const assert=require('node:assert/strict');
const E=require('./engine.js');
for(let l=1;l<=25;l++)for(let trial=0;trial<150;trial++){
 const a=E.sequence(l);assert.equal(a.length,12);assert.equal(a.filter(x=>x.yes).length,8);assert.equal(a.filter(x=>x.stamp).length,l<4?0:l===4?4:2);
 let last=null,run=0;
 a.forEach(x=>{assert.ok(x.kind);assert.equal(E.allowed(l,x.kind,x.lane,x.active,x.phase)&&!x.stamp,x.yes);run=x.yes===last?run+1:1;last=x.yes;assert.ok(run<=(x.yes?6:2));});
 if(l===13){assert.equal(a.slice(0,6).filter(x=>x.yes).length,4);assert.equal(a.slice(6).filter(x=>x.yes).length,4);}
 if(l===14)for(const i of [3,7])assert.ok(a[i].stamp&&a.slice(i-3,i).every(x=>x.yes));
 if(l===19)for(const i of [2,6])assert.ok(a[i].yes&&a.slice(i-2,i).every(x=>!x.yes));
}
assert.equal(E.hit(.25),0);assert.equal(E.hit(.52),1);assert.equal(E.hit(.79),2);assert.equal(E.hit(.05),-1);
assert.equal(E.result(1,7,3).score,83);assert.equal(E.result(1,7,3).stars,1);assert.equal(E.result(25,8,4).stars,3);assert.equal(E.result(25,6,4).win,false);
console.log('PASS: 3,750 generated rounds; eligibility, quantities, sequence constraints, phase split, hit windows and scoring.');
for(let l=1;l<=25;l++)for(let i=0;i<12;i++){
 const d=E.duration(l,i);assert.ok(d>=4);assert.equal(E.position(.6,d),.05);
 for(const x of [.25,.52,.79]){assert.ok(Math.abs(E.position(E.timeAt(x,d),d)-x)<1e-9);assert.ok(E.timeAt(x+.105,d)-E.timeAt(x-.105,d)>.7);}
}
console.log('PASS: every formal basket window > 0.7 seconds, preview hold and matching hit geometry.');

for(let l=1;l<=25;l++){let seconds=l===13?3:0;for(let i=0;i<E.ROUND.total;i++)seconds+=E.duration(l,i);assert.ok(Math.abs(seconds-60)<1e-8);} console.log("PASS: all 25 rounds are 60 seconds, including rule switch.");