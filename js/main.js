/*
 * 按钮事件绑定与启动
 *
 * 注意：本游戏刻意不使用 ES 模块，各 js 文件按 index.html 中 <script> 的顺序
 * 依次加载、共享同一个全局作用域——这样保留了"双击 index.html 即可游玩"的零依赖特性。
 */

/* 防误触：禁止文字选中、右键/长按菜单、拖拽（按钮的 click 不受影响，照常可点）。
   这样小朋友点到按钮以外的地方不会出现"选中高亮"等浏览器行为。 */
['selectstart', 'contextmenu', 'dragstart', 'gesturestart'].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault())
);

/* 绑定按钮 */
document.getElementById('btnUp').onclick = () => addCommandWithSound('up');
document.getElementById('btnDown').onclick = () => addCommandWithSound('down');
document.getElementById('btnLeft').onclick = () => addCommandWithSound('left');
document.getElementById('btnRight').onclick = () => addCommandWithSound('right');
document.getElementById('btnLoop').onclick = addLoop;
document.getElementById('btnUndo').onclick = undo;
document.getElementById('btnClear').onclick = clearProgram;
document.getElementById('btnRun').onclick = run;

// 命令序列里的交互（事件委托）：删除某个命令、调循环次数
programEl.addEventListener('click', (e) => {
  const del = e.target.closest('.del');
  if (del) {
    deleteCmd(del.dataset.del);
    return;
  }
  const btn = e.target.closest('.loop-btn');
  if (btn) {
    const i = parseInt(btn.dataset.i, 10);
    changeLoop(i, btn.dataset.act === 'inc' ? 1 : -1);
  }
});
document.getElementById('levelToggle').onclick = openLevelPicker;
document.getElementById('levelClose').onclick = closeLevelPicker;
// 点浮层空白处也能关闭
document.getElementById('levelOverlay').onclick = (e) => {
  if (e.target.id === 'levelOverlay') closeLevelPicker();
};

// 自由搭建相关按钮
document.getElementById('levelBuild').onclick = startEditor;
document.getElementById('btnEditSize').onclick = cycleEditSize;
document.getElementById('btnEditClear').onclick = clearEditor;
document.getElementById('btnEditBack').onclick = exitEditor;
document.getElementById('btnEditPlay').onclick = playCustom;
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
window.addEventListener('resize', () => {
  if (robot) placeRobot(false);
});

// 语言切换：中 ⇄ EN
document.getElementById('langToggle').onclick = () => {
  setLang(getLang() === 'zh' ? 'en' : 'zh');
};

// 语言切换后，重绘需要动态文案的部分（状态栏标签、关卡提示、命令条占位、循环按钮）
function refreshDynamicI18n() {
  buildBoard(); // 重绘状态栏标签 + 关卡提示
  renderProgram(); // 命令条里的占位文字
  updateLoopBtn(); // 🔁/结束圈 按钮文案
}

// 开始游戏
applyI18n(); // 先按当前语言把静态文案刷一遍
buildBoard();
renderProgram();

// 注册 Service Worker（让游戏可装到桌面、离线可玩）。
// 仅在 https 或 localhost 下生效；file:// 直接打开会跳过，不影响游玩。
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* 离线功能不可用也无妨 */
    });
  });
  // 已经由旧版 SW 控制时，若出现新版本接管就自动刷新一次，立刻用上最新代码。
  // （首次访问还没有 controller，不会触发刷新，避免无谓的重载）
  if (navigator.serviceWorker.controller) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }
}
