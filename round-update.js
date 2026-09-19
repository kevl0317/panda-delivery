// All parcels are sorted by matching their symbol to a basket.
GAME_CONTENT.forEach(c=>{
  c.rule='每件快递都要投递：图案与篮筐一致，进入框内时点击。';
  c.threshold=`12件中正确投递至少${c.id<=10?9:10}件`;
  c.detail='每关12件，三种图案各4件；不再有放过、盖章或换班规则。';
});
