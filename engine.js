(function (root) {
  const cities = ['南充','广安','垫江','万州','宜昌','荆门','武汉','合肥','南京','上海','无锡','淮安','临沂','济南','北京','石家庄','郑州','武汉','长沙','广州','肇庆','梧州','南宁','百色','昆明'];
  function kinds(level, phase=0) {
    if ([5,10,15,20,25].includes(level)) return ['蓝色竹叶','蓝色花朵','橙色竹叶'];
    return ({1:['竹叶','花朵','圆点'],2:['蓝色','橙色','紫色'],3:['圆形','方形','三角形'],4:['竹叶','花朵','圆点'],6:['双竹叶','单竹叶','花朵'],7:['向右','向左','向上'],8:['花朵','圆点','竹叶'],9:['双圆点','单圆点','三圆点'],11:['蓝色圆形','蓝色方形','橙色圆形'],12:['实心星形','空心星形','实心圆形'],13:phase?['黄色','蓝色','紫色']:['蓝色','黄色','紫色'],14:['圆形','方形','三角形'],16:['蓝色','橙色','紫色'],17:['竹叶','花朵','圆点'],18:['竹叶','花朵','圆点'],19:['向上','向右','向下'],21:['肇庆','梧州','南宁'],22:['圆形','星形','三角形'],23:['蓝色','橙色','紫色'],24:['花朵','竹叶','圆点']})[level];
  }
  function allowed(level, kind, lane=0, active=0, phase=0) {
    const k=kinds(level,phase);
    if(level===4) return true;
    if(level===8||level===18) return kind===k[0]||kind===k[1];
    if(level===17) return kind===k[0]&&lane===active;
    if(level===22) return kind===k[lane];
    return kind===k[0];
  }
  const random=a=>a[Math.floor(Math.random()*a.length)];
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function flags(n, yes, prefix=[]) {
    for(let tries=0;tries<100000;tries++){
      const used=prefix.filter(Boolean).length;
      const a=prefix.concat(shuffle(Array(yes-used).fill(true).concat(Array(n-prefix.length-yes+used).fill(false))));
      let last=null,run=0,ok=true;
      for(const f of a){run=f===last?run+1:1;last=f;if(run>(f?6:2)){ok=false;break;}}
      if(ok)return a;
    }
    throw Error('无法生成合法序列');
  }
  function sequence(level){
    let f;
    if(level===13){do { f=flags(6,4).concat(flags(6,4)); }while(f.some((v,i)=>i>0&&f.slice(Math.max(0,i-(v?6:2)),i+1).length===(v?7:3)&&f.slice(i-(v?6:2),i+1).every(x=>x===v)));}
    else f=flags(12,8,level===14?[true,true,true,false,true,true,true,false]:level===19?[false,false,true,true,false,false,true]:[]);
    let badIndices=f.flatMap((v,i)=>v?[]:[i]);
    let stamps=new Set(level===4?badIndices:level>=5?shuffle(badIndices.slice()).slice(0,2):[]);
    if(level===14){stamps=new Set([3,7]);}
    return f.map((yes,i)=>{
      const phase=level===13&&i>=6?1:0,k=kinds(level,phase),active=Math.floor(Math.random()*2);
      let lane=level===16?i%2:level>=17&&[17,20,22,25].includes(level)?Math.floor(Math.random()*2):0;
      let choices=k.filter(x=>allowed(level,x,lane,active,phase));
      if((yes||stamps.has(i))&&!choices.length){lane=active;choices=k.filter(x=>allowed(level,x,lane,active,phase));}
      const kind=random(yes||stamps.has(i)?choices:k.filter(x=>!allowed(level,x,lane,active,phase)));
      return {kind,lane,active,stamp:stamps.has(i),yes,phase};
    });
  }
  // A short preview at the entrance precedes movement. Even the final stage
  // gives about 0.7 s inside a basket, instead of the former 0.14–0.22 s.
  const ROUND={total:12,targets:8,releases:4,switchAt:6};
  function duration(level,index){return level===13?57/12:level>=24?[5.4,5,4.6][Math.floor(index/4)]:5;}
  function position(elapsed,duration){return .05+.9*Math.max(0,Math.min(1,(elapsed-.65)/(duration-.9)));}
  function timeAt(x,duration){return .65+(x-.05)/.9*(duration-.9);}
  function result(level,correct,passed){const target=correct/ROUND.targets,release=passed/ROUND.releases,error=1-release,score=Math.round(target*60+release*40);const win=target>=(level<=10?.75:.8)&&error<=.25;return {target,release,error,score,win,stars:win?(score>=95?3:score>=90?2:1):0};}
  function hit(x){return [.25,.52,.79].findIndex(c=>Math.abs(x-c)<=.105);}
  const api={ROUND,cities,kinds,allowed,sequence,duration,position,timeAt,result,hit};
  if(typeof module!=='undefined') module.exports=api;
  root.PandaEngine=api;
})(typeof window!=='undefined'?window:globalThis);
