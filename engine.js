(function (root) {
  const cities = ['南充','广安','垫江','万州','宜昌','荆门','武汉','合肥','南京','上海','无锡','淮安','临沂','济南','北京','石家庄','郑州','武汉','长沙','广州','肇庆','梧州','南宁','百色','昆明'];
  function kinds(level, phase=0) {
    if ([5,10,15,20,25].includes(level)) return ['蓝色竹叶','蓝色花朵','橙色竹叶'];
    return ({1:['竹叶','花朵','圆点'],2:['蓝色','橙色','紫色'],3:['圆形','方形','三角形'],4:['竹叶','花朵','圆点'],6:['双竹叶','单竹叶','花朵'],7:['向右','向左','向上'],8:['花朵','圆点','竹叶'],9:['双圆点','单圆点','三圆点'],11:['蓝色圆形','蓝色方形','橙色圆形'],12:['实心星形','空心星形','实心圆形'],13:phase?['黄色','蓝色','紫色']:['蓝色','黄色','紫色'],14:['圆形','方形','三角形'],16:['蓝色','橙色','紫色'],17:['竹叶','花朵','圆点'],18:['竹叶','花朵','圆点'],19:['向上','向右','向下'],21:['肇庆','梧州','南宁'],22:['圆形','星形','三角形'],23:['蓝色','橙色','紫色'],24:['花朵','竹叶','圆点']})[level];
  }
  function allowed(level, kind) {return kinds(level).includes(kind);}
  function sequence(level){
    const pool=kinds(level).flatMap(kind=>Array(4).fill(kind));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return pool.map((kind,i)=>({kind,lane:level===16?i%2:[17,20,22,25].includes(level)?Math.floor(Math.random()*2):0,active:0,stamp:false,yes:true,phase:0}));
  }
  // A short preview at the entrance precedes movement. Even the final stage
  // gives about 0.7 s inside a basket, instead of the former 0.14–0.22 s.
  const ROUND={total:12,targets:12,releases:0};
  function duration(level,index){return level>=24?[5.4,5,4.6][Math.floor(index/4)]:5;}
  function position(elapsed,duration){return .05+.9*Math.max(0,Math.min(1,(elapsed-.65)/(duration-.9)));}
  function timeAt(x,duration){return .65+(x-.05)/.9*(duration-.9);}
  function result(level,correct){const target=correct/ROUND.total,score=Math.round(target*100),win=target>=(level<=10?.75:.8);return {target,score,win,stars:win?(score>=95?3:score>=90?2:1):0};}
  function hit(x){return [.25,.52,.79].findIndex(c=>Math.abs(x-c)<=.105);}
  const api={ROUND,cities,kinds,allowed,sequence,duration,position,timeAt,result,hit};
  if(typeof module!=='undefined') module.exports=api;
  root.PandaEngine=api;
})(typeof window!=='undefined'?window:globalThis);
