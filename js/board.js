/*
 * 棋盘渲染 · 选关 · 机器人定位
 *
 * 注意：本游戏刻意不使用 ES 模块，各 js 文件按 index.html 中 <script> 的顺序
 * 依次加载、共享同一个全局作用域——这样保留了"双击 index.html 即可游玩"的零依赖特性。
 */

function level() {
  return levelIndex === -1 ? customLevel : LEVELS[levelIndex];
}

/* 每组关卡一个主题：草地 / 沙漠 / 雪地 / 太空，让 18 关有"旅程感"
   分组与关卡设计一致：1-4 草地、5-8 沙漠、9-12 雪地、13-18 太空 */
function themeForLevel() {
  if (levelIndex === -1) return 'grass'; // 自由关用草地
  if (levelIndex < 4) return 'grass';
  if (levelIndex < 8) return 'desert';
  if (levelIndex < 12) return 'snow';
  return 'space';
}
const THEME_FLOATIES = {
  grass: ['☁️', '☁️', '🦋', '🌼'],
  desert: ['☁️', '🌵', '☀️', '🪨'],
  snow: ['❄️', '❄️', '☁️', '⛄'],
  space: ['⭐', '✨', '🪐', '🌟'],
};
function applyTheme() {
  const theme = themeForLevel();
  if (document.body.dataset.theme === theme && document.getElementById('bg').childElementCount)
    return;
  document.body.dataset.theme = theme;
  // 重新铺一层缓缓漂浮的氛围粒子
  const bg = document.getElementById('bg');
  bg.innerHTML = '';
  const set = THEME_FLOATIES[theme] || THEME_FLOATIES.grass;
  for (let i = 0; i < 9; i++) {
    const f = document.createElement('span');
    f.className = 'floatie';
    f.textContent = set[i % set.length];
    f.style.left = Math.round(Math.random() * 92) + 'vw';
    f.style.top = Math.round(Math.random() * 88) + 'vh';
    f.style.fontSize = 16 + Math.round(Math.random() * 22) + 'px';
    f.style.animationDuration = 7 + Math.round(Math.random() * 8) + 's';
    f.style.animationDelay = '-' + Math.round(Math.random() * 8) + 's';
    f.style.opacity = (0.25 + Math.random() * 0.4).toFixed(2);
    bg.appendChild(f);
  }
}

/* 渲染地图与机器人初始位置 */
function buildBoard() {
  const lv = level();
  applyTheme();
  boardEl.style.gridTemplateColumns = `repeat(${lv.cols}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${lv.rows}, 1fr)`;
  boardEl.innerHTML = '';

  for (let y = 0; y < lv.rows; y++) {
    for (let x = 0; x < lv.cols; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      if (lv.walls.some((w) => w.x === x && w.y === y)) {
        cell.classList.add('wall');
        cell.textContent = pickEmoji(WALL_EMOJIS, x, y, 0);
      }
      if (lv.goal && lv.goal.x === x && lv.goal.y === y) {
        cell.classList.add('goal');
        cell.innerHTML = '<span class="ic">🔋</span>';
      }
      if ((lv.stars || []).some((s) => s.x === x && s.y === y)) {
        cell.classList.add('star');
        cell.dataset.star = '1';
        cell.innerHTML = '<span class="ic">' + pickEmoji(REWARD_EMOJIS, x, y, 4) + '</span>';
      }
      // 编辑模式下，起点格显示一个淡淡的🤖标记
      if (
        editing &&
        lv.start &&
        lv.start.x === x &&
        lv.start.y === y &&
        !(lv.goal && lv.goal.x === x && lv.goal.y === y)
      ) {
        cell.classList.add('startmark');
        cell.textContent = '🤖';
      }
      boardEl.appendChild(cell);
    }
  }

  // 这一关还没捡到的星星（坐标字符串集合）
  starsLeft = new Set((lv.stars || []).map((s) => s.x + ',' + s.y));

  // 机器人（编辑模式下若还没放起点，就先不显示机器人）
  if (lv.start) {
    robot = { x: lv.start.x, y: lv.start.y };
    const r = document.createElement('div');
    r.className = 'robot';
    r.id = 'robot';
    // 外层负责定位，内层 face 负责呼吸/眨眼/弹跳等动画，互不打架
    r.innerHTML = '<span class="face">🤖</span>';
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

  // 地图淡入（关卡切换更顺滑）；运行中重建棋盘时不重复播放，免得每次出发都缩放
  if (!isRunning) {
    boardEl.classList.remove('board-in');
    void boardEl.offsetWidth;
    boardEl.classList.add('board-in');
  }
}

/* 选关：一排可点的关卡按钮，当前关高亮，已通关的在数字下方显示获得的星级 */
function renderLevelSelect() {
  const box = document.getElementById('levelSelect');
  box.innerHTML = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    if (i === levelIndex) btn.classList.add('current');
    const got = levelStars[i] || 0;
    btn.innerHTML =
      `<span class="lv-num">${i + 1}</span>` +
      (got ? `<span class="lv-stars">${'⭐'.repeat(got)}</span>` : '');
    btn.onclick = () => goToLevel(i);
    box.appendChild(btn);
  }
}

/* 算这一关的"最短步数"（含按最优顺序捡完所有宝贝），用来给星级评分 */
function bfsDist(lv, a, b) {
  const wall = new Set((lv.walls || []).map((w) => w.x + ',' + w.y));
  const free = (x, y) => x >= 0 && y >= 0 && x < lv.cols && y < lv.rows && !wall.has(x + ',' + y);
  const seen = new Set([a[0] + ',' + a[1]]);
  let q = [[a[0], a[1], 0]];
  while (q.length) {
    const [x, y, d] = q.shift();
    if (x === b[0] && y === b[1]) return d;
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = nx + ',' + ny;
      if (free(nx, ny) && !seen.has(k)) {
        seen.add(k);
        q.push([nx, ny, d + 1]);
      }
    }
  }
  return Infinity;
}
function permute(a) {
  if (a.length <= 1) return [a];
  const out = [];
  a.forEach((v, i) =>
    permute(a.slice(0, i).concat(a.slice(i + 1))).forEach((p) => out.push([v, ...p]))
  );
  return out;
}
function optimalSteps() {
  const lv = level();
  const stars = (lv.stars || []).map((s) => [s.x, s.y]);
  const S = [lv.start.x, lv.start.y],
    G = [lv.goal.x, lv.goal.y];
  if (!stars.length) return bfsDist(lv, S, G);
  let best = Infinity;
  for (const order of permute(stars)) {
    let d = 0,
      cur = S;
    for (const s of order) {
      d += bfsDist(lv, cur, s);
      cur = s;
    }
    d += bfsDist(lv, cur, G);
    best = Math.min(best, d);
  }
  return best;
}

/* 根据走的步数和最短步数算星级：走最短=3星，多一点=2星，绕远=1星 */
function starsForRun(used, optimal) {
  if (used <= optimal) return 3;
  if (used <= optimal + 4) return 2;
  return 1;
}

/* 跳到指定关卡 */
function goToLevel(i) {
  if (isRunning) return; // 运行中不许切关
  closeLevelPicker();
  if (i === levelIndex) return; // 已经在这关
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
