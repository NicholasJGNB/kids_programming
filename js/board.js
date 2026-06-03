/*
 * 棋盘渲染 · 选关 · 机器人定位
 *
 * 注意：本游戏刻意不使用 ES 模块，各 js 文件按 index.html 中 <script> 的顺序
 * 依次加载、共享同一个全局作用域——这样保留了"双击 index.html 即可游玩"的零依赖特性。
 */

function level() { return levelIndex === -1 ? customLevel : LEVELS[levelIndex]; }

/* 渲染地图与机器人初始位置 */
function buildBoard() {
  const lv = level();
  boardEl.style.gridTemplateColumns = `repeat(${lv.cols}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${lv.rows}, 1fr)`;
  boardEl.innerHTML = '';

  for (let y = 0; y < lv.rows; y++) {
    for (let x = 0; x < lv.cols; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      if (lv.walls.some(w => w.x === x && w.y === y)) {
        cell.classList.add('wall');
        cell.textContent = pickEmoji(WALL_EMOJIS, x, y, 0);
      }
      if (lv.goal && lv.goal.x === x && lv.goal.y === y) {
        cell.classList.add('goal');
        cell.textContent = '🔋';
      }
      if ((lv.stars || []).some(s => s.x === x && s.y === y)) {
        cell.classList.add('star');
        cell.dataset.star = '1';
        cell.textContent = pickEmoji(REWARD_EMOJIS, x, y, 4);
      }
      // 编辑模式下，起点格显示一个淡淡的🤖标记
      if (editing && lv.start && lv.start.x === x && lv.start.y === y && !(lv.goal && lv.goal.x===x && lv.goal.y===y)) {
        cell.classList.add('startmark');
        cell.textContent = '🤖';
      }
      boardEl.appendChild(cell);
    }
  }

  // 这一关还没捡到的星星（坐标字符串集合）
  starsLeft = new Set((lv.stars || []).map(s => s.x + ',' + s.y));

  // 机器人（编辑模式下若还没放起点，就先不显示机器人）
  if (lv.start) {
    robot = { x: lv.start.x, y: lv.start.y };
    const r = document.createElement('div');
    r.className = 'robot';
    r.id = 'robot';
    r.textContent = '🤖';
    boardEl.appendChild(r);
    placeRobot(false);
  } else {
    robot = null;
  }

  // 状态栏文字
  const label = document.getElementById('levelLabel');
  if (levelIndex === -1) {
    label.textContent = editing ? t('label.buildEdit') : t('label.buildPlay');
  } else {
    label.textContent = t('label.level', { n: levelIndex + 1 });
  }
  // 关卡提示：内置关用 hint.N，自由关用 customLevel.hintKey
  let hintText = '';
  if (levelIndex === -1) {
    hintText = customLevel && customLevel.hintKey ? t(customLevel.hintKey) : '';
  } else {
    hintText = t('hint.' + (levelIndex + 1));
  }
  document.getElementById('goalHint').textContent = hintText;
  renderLevelSelect();
}

/* 选关：一排可点的关卡按钮，全部可选，当前关高亮，通关的带 ⭐ */
function renderLevelSelect() {
  const box = document.getElementById('levelSelect');
  box.innerHTML = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    if (i === levelIndex) btn.classList.add('current');
    if (cleared.has(i)) btn.classList.add('done');
    btn.textContent = (i + 1);
    btn.onclick = () => goToLevel(i);
    box.appendChild(btn);
  }
}

/* 跳到指定关卡 */
function goToLevel(i) {
  if (isRunning) return;          // 运行中不许切关
  closeLevelPicker();
  if (i === levelIndex) return;   // 已经在这关
  levelIndex = i;
  program = [];
  renderProgram();
  buildBoard();
}

/* 打开 / 关闭选关浮层 */
function openLevelPicker() {
  if (isRunning) return;
  renderLevelSelect();
  document.getElementById('levelOverlay').classList.add('show');
}
function closeLevelPicker() {
  document.getElementById('levelOverlay').classList.remove('show');
}
