(function (root) {
  const cities = ['南充','广安','垫江','万州','宜昌','荆门','武汉','合肥','南京','上海','无锡','淮安','临沂','济南','北京','石家庄','郑州','武汉','长沙','广州','肇庆','梧州','南宁','百色','昆明'];
  // The same level definition drives sequence generation, lanes and rule text.
  const LEVELS=[
    ['竹叶,花朵,圆点','认识图案'],
    ['蓝色,橙色,紫色','区分颜色'],
    ['圆形,方形,三角形','区分形状'],
    ['竹叶,花朵,圆点','篮筐换位置，按标记找家'],
    ['蓝色竹叶,蓝色花朵,橙色竹叶','第一章综合：颜色与图案'],
    ['双竹叶,单竹叶,花朵','观察图案数量'],
    ['向右,向左,向上','观察箭头方向'],
    ['实心星形,空心星形,实心圆形','区分实心与空心'],
    ['双圆点,单圆点,三圆点','比较一、二、三个点'],
    ['蓝色双圆点,蓝色单圆点,橙色双圆点','第二章综合：颜色与数量'],
    ['蓝色圆形,蓝色方形,橙色圆形','同时辨认颜色和形状'],
    ['蓝色实心星形,蓝色空心星形,橙色实心星形','同时辨认颜色和填充'],
    ['蓝色竹叶,黄色竹叶,黄色花朵','同色异形、同形异色'],
    ['蓝色向上,蓝色向右,橙色向上','同时辨认颜色和方向'],
    ['蓝色竹叶,蓝色花朵,橙色竹叶','第三章复习：组合图案配对'],
    ['蓝色,橙色,紫色','认识双线：上下交替'],
    ['竹叶,花朵,圆点','双线随机：注意快递从哪条线出现'],
    ['实心星形,空心星形,实心圆形','上下篮筐错位：辨认相近图案'],
    ['向上,向右,向下','略微提速：观察方向和篮筐位置'],
    ['蓝色竹叶,蓝色花朵,橙色竹叶','再次提速：双线组合图案'],
    ['肇庆,梧州,南宁','两线同时出件：分别找到城市篮筐'],
    ['单圆点,双圆点,三圆点','两线同时出件：辨认圆点数量'],
    ['蓝色实心星形,蓝色空心星形,橙色实心星形','两线同时出件：分辨颜色与填充'],
    ['蓝色向上,蓝色向右,橙色向上','两线同时出件：提速辨认颜色与方向'],
    ['蓝色单竹叶,蓝色双竹叶,橙色双竹叶','终站挑战：同时辨认颜色、数量与篮筐位置']
  ].map(([symbols,focus],i)=>({kinds:symbols.split(','),focus,lanes:i<15?1:2,laneMode:i<15?'single':i===15?'alternating':i<20?'random':'simultaneous',shuffleBaskets:i>=3,independentBaskets:i>=17,simultaneous:i>=20,pass:i<10?9:i<20?10:20}));
  function config(level){return LEVELS[level-1];}
  function kinds(level){return config(level).kinds.slice();}
  function allowed(level,kind){return config(level).kinds.includes(kind);}
  function shuffle(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
  function baskets(level){
    const settings=config(level),base=kinds(level);
    if(settings.shuffleBaskets)shuffle(base);
    if(settings.lanes===1)return [base];
    // All three columns differ between lanes, while staying fixed for the round.
    const offset=settings.independentBaskets?1+Math.floor(Math.random()*2):0;
    return [base,base.map((_,i)=>base[(i+offset)%base.length])];
  }
  function sequence(level,basketRows){
    const settings=config(level),ks=kinds(level),randomLanes=settings.laneMode==='random';
    if(settings.simultaneous){
      const rows=basketRows||baskets(level);
      // Every ordered pair of different target columns occurs twice. This
      // preserves four of each symbol per lane without simultaneous clicks.
      const pairs=[[0,1],[0,2],[1,0],[1,2],[2,0],[2,1]];
      const pool=[...pairs,...pairs];
      let waves=pool;
      for(let attempt=0;attempt<80;attempt++){
        const candidate=shuffle(pool.slice());
        if(candidate.every((pair,i)=>i<2||pair.every((col,lane)=>col!==candidate[i-1][lane]||col!==candidate[i-2][lane]))){waves=candidate;break;}
      }
      // The unshuffled fallback is balanced, separated and has no triples.
      return waves.flatMap(pair=>pair.map((column,lane)=>({kind:rows[lane][column],lane,active:0,stamp:false,yes:true,phase:0})));
    }
    const pool=ks.flatMap(kind=>Array.from({length:4},(_,i)=>({kind,lane:randomLanes?i%2:0})));
    const valid=a=>a.every((x,i)=>(i<2||x.kind!==a[i-1].kind||x.kind!==a[i-2].kind)&&(!randomLanes||i<3||x.lane!==a[i-1].lane||x.lane!==a[i-2].lane||x.lane!==a[i-3].lane));
    let schedule;
    for(let attempt=0;attempt<80;attempt++){const candidate=shuffle(pool.slice());if(valid(candidate)){schedule=candidate;break;}}
    // Bounded generation, including when an RNG repeatedly returns one value.
    schedule??=Array.from({length:12},(_,i)=>({kind:ks[i%3],lane:randomLanes?i%2:0}));
    return schedule.map((x,i)=>({...x,lane:settings.laneMode==='alternating'?i%2:x.lane,active:0,stamp:false,yes:true,phase:0}));
  }
  // The baseline remains available to older callers; level-aware code uses round().
  const ROUND={total:12,targets:12,releases:0,seconds:60,settle:.35};
  function round(level){const total=config(level).simultaneous?24:12;return {...ROUND,total,targets:total};}
  function duration(level,index){return level<=18?5:level===19?4.8:level===20?4.6:[5,4.8,4.6,4.4,4.2][level-21];}
  function position(elapsed,duration){return .05+.9*Math.max(0,Math.min(1,(elapsed-.65)/(duration-.9)));}
  function timeAt(x,duration){return .65+(x-.05)/.9*(duration-.9);}
  function result(level,correct){const target=correct/round(level).total,score=Math.round(target*100),win=correct>=config(level).pass;return {target,score,win,stars:win?(score>=95?3:score>=90?2:1):0};}
  function hit(x){return [.25,.52,.79].findIndex(c=>Math.abs(x-c)<=.105);}
  const api={ROUND,round,cities,config,kinds,allowed,baskets,sequence,duration,position,timeAt,result,hit};
  if(typeof module!=='undefined') module.exports=api;
  root.PandaEngine=api;
})(typeof window!=='undefined'?window:globalThis);
