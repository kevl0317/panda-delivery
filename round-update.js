// One-minute edition: keep all narrative and category rules; replace counts.
GAME_CONTENT.forEach(c=>{
  c.threshold=`目标投递率≥${c.id<=10?75:80}%；误投最多1件`;
  c.detail=c.detail.replaceAll('32','8').replaceAll('13件','4件').replaceAll('7件×章和6件不匹配','2件×章和2件不匹配');
});
GAME_CONTENT[12].rule='前6件只投蓝色标签；后6件只投黄色标签；×章均放过';
GAME_CONTENT[12].detail='第6件结束后换班3秒；前后各4投2放，换班计入60秒。';
GAME_CONTENT[13].detail='两次连续3件应投后接1件×章；全关8投4放。';
GAME_CONTENT[18].detail='两次连续2件应放过后接1件应投；全关8投4放。';
GAME_CONTENT[23].detail='12件分三段，每段4件，间隔5.4、5、4.6秒，总计60秒。';
GAME_CONTENT[24].detail='最终验收：8投4放，左右随机出现，节奏同第24关。';
