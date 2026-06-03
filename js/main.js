/*
 * 按钮事件绑定与启动
 *
 * 注意：本游戏刻意不使用 ES 模块，各 js 文件按 index.html 中 <script> 的顺序
 * 依次加载、共享同一个全局作用域——这样保留了"双击 index.html 即可游玩"的零依赖特性。
 */

/* 绑定按钮 */
document.getElementById('btnUp').onclick    = () => addCommandWithSound('up');
document.getElementById('btnDown').onclick  = () => addCommandWithSound('down');
document.getElementById('btnLeft').onclick  = () => addCommandWithSound('left');
document.getElementById('btnRight').onclick = () => addCommandWithSound('right');
document.getElementById('btnLoop').onclick    = addLoop;
document.getElementById('btnUndo').onclick    = undo;
document.getElementById('btnClear').onclick   = clearProgram;
document.getElementById('btnRun').onclick     = run;

// 循环块上的 − / ＋ 调次数（事件委托）
programEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.loop-btn');
  if (!btn) return;
  const i = parseInt(btn.dataset.i, 10);
  changeLoop(i, btn.dataset.act === 'inc' ? 1 : -1);
});
document.getElementById('levelToggle').onclick = openLevelPicker;
document.getElementById('levelClose').onclick  = closeLevelPicker;
// 点浮层空白处也能关闭
document.getElementById('levelOverlay').onclick = (e) => {
  if (e.target.id === 'levelOverlay') closeLevelPicker();
};

// 自由搭建相关按钮
document.getElementById('levelBuild').onclick   = startEditor;
document.getElementById('btnEditSize').onclick  = cycleEditSize;
document.getElementById('btnEditClear').onclick = clearEditor;
document.getElementById('btnEditBack').onclick  = exitEditor;
document.getElementById('btnEditPlay').onclick  = playCustom;
// 选画笔
document.getElementById('palette').addEventListener('click', (e) => {
  const b = e.target.closest('.brush');
  if (b) selectBrush(b.dataset.brush);
});
// 编辑模式下点格子作画
boardEl.addEventListener('click', (e) => {
  if (!editing) return;
  const cell = e.target.closest('.cell');
  if (!cell) return;
  editCellAt(parseInt(cell.dataset.x, 10), parseInt(cell.dataset.y, 10));
});

// 窗口尺寸变化时重新摆放机器人
window.addEventListener('resize', () => { if (robot) placeRobot(false); });

// 开始游戏
buildBoard();
renderProgram();

// 注册 Service Worker（让游戏可装到桌面、离线可玩）。
// 仅在 https 或 localhost 下生效；file:// 直接打开会跳过，不影响游玩。
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 离线功能不可用也无妨 */ });
  });
}
