// Permanent settings stay separate from the temporary save-transfer tools.
let settingsSession=null,settingsNoticeTimer=0;
function showSettings(){
 const modal=$('#modal');
 if(!modal.dataset.settingsView||!modal.open){
  const resume=!!state&&!state.paused&&['playing','practice','countdown'].includes(state.mode);
  settingsSession={game:state,resume,previous:modal.open?Array.from($('#modalContent').childNodes):null,focus:document.activeElement};
  if(resume)state.paused=true;
 }
 showModal(`<h2>设置</h2><div class="setting-row"><span>音效</span><button class="secondary" id="settingsSoundBtn" aria-label="音效" aria-pressed="${!!save.sound}">${save.sound?'已开启':'已关闭'}</button></div><p class="settings-note">关卡进度、星级和知识卡自动保存在当前浏览器。</p><button class="secondary clear-save-warning" id="clearSaveBtn">清除本地记录</button><div class="modal-actions"><button class="primary" id="closeSettings" autofocus>完成</button></div>`);
 modal.dataset.settingsView='settings';
 $('#settingsSoundBtn').onclick=()=>{
  toggleSound();
  const button=$('#settingsSoundBtn');button.textContent=save.sound?'已开启':'已关闭';button.setAttribute('aria-pressed',String(!!save.sound));
 };
 $('#clearSaveBtn').onclick=confirmClearProgress;$('#closeSettings').onclick=closeSettings;
 $('#closeSettings').focus();
}
function closeSettings(){
 const session=settingsSession;settingsSession=null;
 if(session?.previous&&session.game===state){
  delete $('#modal').dataset.settingsView;
  $('#modalContent').replaceChildren(...session.previous);
  const heading=$('#modalContent h2');if(heading)$('#modal').setAttribute('aria-labelledby',heading.id);else $('#modal').removeAttribute('aria-labelledby');
  if(session.focus?.isConnected)session.focus.focus({preventScroll:true});
  return;
 }
 closeModal();
 if(session?.resume&&session.game===state){state.paused=false;state.last=performance.now();}
 $('#settingsBtn').focus({preventScroll:true});
}
function confirmClearProgress(){
 showModal(`<h2>清除本地记录？</h2><p>将清除本浏览器的关卡进度、星级成绩和知识卡收藏，重新从第1关开始。</p><p id="clearSaveError" role="alert"></p><div class="modal-actions"><button class="primary" id="cancelClearSave" autofocus>取消</button><button class="secondary clear-save-warning" id="confirmClearSave">确认清除</button></div>`);
 $('#modal').dataset.settingsView='clear';
 $('#cancelClearSave').onclick=()=>{showSettings();$('#clearSaveBtn').focus();};
 $('#cancelClearSave').focus();
 $('#confirmClearSave').onclick=()=>{
  const cleared={...save,best:{}};
  try{localStorage.setItem('panda-post-v1',JSON.stringify(cleared));}
  catch{$('#clearSaveError').textContent='清除失败，原有记录未修改。请检查浏览器存储权限后重试。';return;}
  // An import started before clearing must not restore those records later.
  progressRevision++;save=cleared;settingsSession=null;home();
  const notice=$('#settingsNotice');notice.textContent='本地记录已清除，可以从第1关重新出发。';
  clearTimeout(settingsNoticeTimer);settingsNoticeTimer=setTimeout(()=>{notice.textContent='';},5000);
 };
}
$('#settingsBtn').onclick=showSettings;
$('#modal').addEventListener('cancel',event=>{
 const view=$('#modal').dataset.settingsView;if(!view)return;
 event.preventDefault();
 if(view==='clear'){showSettings();$('#clearSaveBtn').focus();}else closeSettings();
});
