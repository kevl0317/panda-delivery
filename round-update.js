// Use the active design for rules; keep story and knowledge text intact.
GAME_CONTENT.forEach(c=>{
 const design=PandaEngine.config(c.id),round=PandaEngine.round(c.id);
 c.rule='每件快递都要投递：图案与篮筐一致，进入框内时点击。';
 c.threshold=`${round.total}件中正确投递至少${design.pass}件`;
 const lanes=design.simultaneous?'上下双线同时出件，共12组，每线12件':design.laneMode==='single'?'单线':design.laneMode==='alternating'?'上下双线交替':'上下双线随机，每线6件';
 const baskets=(design.independentBaskets?'上下篮筐位置不同，关内保持固定。':'')+(design.simultaneous?'每组两件对应不同列，先后入框。':'');
 c.detail=`${design.focus}。${lanes}；三种图案各${round.total/3}件。${baskets}单件完整行程${PandaEngine.duration(c.id,0)}秒，60秒独立计时。`;
});
