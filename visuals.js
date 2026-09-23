// Shared symbols keep rules, parcel labels and basket labels visually identical.
function itemIcon(kind){
 const color=kind.includes('蓝')?'#2586d1':kind.includes('橙')?'#e67a25':kind.includes('紫')?'#9958b9':kind.includes('黄')?'#e8b823':'#247b51';
 const leaf='<path d="M15 36C8 22 11 10 25 7c2 14-2 23-10 29Z"/><path d="M21 36c-1-13 7-21 19-20-1 13-8 20-19 20Z"/><path d="m15 42 11-25" fill="none" stroke="currentColor" stroke-width="3"/>';
 let shape='';
 if(kind.includes('竹叶'))shape=kind.includes('双')?`<g transform="translate(-2 4) scale(.7)">${leaf}</g><g transform="translate(20 4) scale(.7)">${leaf}</g>`:leaf;
 else if(kind.includes('花朵'))shape='<path d="M24 18C9 1 2 23 16 26 0 36 21 47 25 33c6 15 24-2 11-9C50 9 25 1 24 18Z"/><circle cx="25" cy="25" r="5" fill="#ffe3a0"/>';
 else if(kind.includes('圆点')){const n=kind.includes('双')?2:kind.includes('三')?3:1;shape=Array.from({length:n},(_,i)=>`<circle cx="${24+(i-(n-1)/2)*15}" cy="25" r="6.5"/>`).join('');}
 else if(kind.includes('星形'))shape=`<path d="m24 5 6 13 14 2-10 10 2 14-12-7-12 7 2-14L4 20l14-2Z" ${kind.includes('空心')?'fill="none" stroke="currentColor" stroke-width="3"':''}/>`;
 else if(kind.includes('方形'))shape='<rect x="9" y="9" width="30" height="30" rx="3"/>';
 else if(kind.includes('三角'))shape='<path d="M24 6 44 40H4Z"/>';
 else if(kind.includes('向')){const a=kind.includes('左')?180:kind.includes('上')?-90:kind.includes('下')?90:0;shape=`<path transform="rotate(${a} 24 24)" d="M5 19h23V8l17 16-17 16V29H5Z"/>`;}
 else if(['肇庆','梧州','南宁'].includes(kind))return `<span class="destination-icon" aria-label="${kind}">${kind}</span>`;
 else shape='<circle cx="24" cy="24" r="17"/>';
 return `<svg class="item-icon" viewBox="0 0 48 48" role="img" aria-label="${kind}" style="color:${color};fill:currentColor">${shape}</svg>`;
}
function tutorialArt(level){
 const kinds=PandaEngine.kinds(level);
 const lane=kind=>`<div class="tutorial-art" aria-hidden="true"><div class="demo-track"></div><div class="demo-frame"><img src="assets/basket.png" alt="" draggable="false"><span>${itemIcon(kind)}</span></div><div class="demo-parcel"><img src="assets/parcel.png" alt="" draggable="false"><span>${itemIcon(kind)}</span></div><span class="demo-hand">👈</span><span class="demo-spark">✦</span></div>`;
 return PandaEngine.config(level).simultaneous?`<div class="tutorial-pair" aria-hidden="true">${kinds.slice(0,2).map(k=>`<div class="demo-lane">${lane(k)}</div>`).join('')}</div>`:lane(kinds[0]);
}
