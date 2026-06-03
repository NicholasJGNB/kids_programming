/*
 * 自由搭建（造关）模式
 *
 * 注意：本游戏刻意不使用 ES 模块，各 js 文件按 index.html 中 <script> 的顺序
 * 依次加载、共享同一个全局作用域——这样保留了"双击 index.html 即可游玩"的零依赖特性。
 */

/* ===== 自由搭建模式 ===== */
function startEditor() {
  if (isRunning) return;
  closeLevelPicker();
  editing = true;
  levelIndex = -1;
  document.body.classList.add('editing');
  // 新建一张空白 6x6 地图，先放好起点和电池
  customLevel = {
    cols: 6, rows: 6,
    start: { x: 0, y: 5 },
    goal:  { x: 5, y: 0 },
    walls: [],
    stars: [],
    hint: ''
  };
  program = [];
  renderProgram();
  buildBoard();
}

/* 在编辑模式点格子：根据当前画笔修改地图 */
function editCellAt(x, y) {
  const lv = customLevel;
  const isStart = lv.start && lv.start.x === x && lv.start.y === y;
  const isGoal  = lv.goal  && lv.goal.x === x && lv.goal.y === y;
  const wallIdx = lv.walls.findIndex(w => w.x === x && w.y === y);
  const starIdx = lv.stars.findIndex(s => s.x === x && s.y === y);

  const removeAll = () => {
    if (wallIdx >= 0) lv.walls.splice(wallIdx, 1);
    if (starIdx >= 0) lv.stars.splice(starIdx, 1);
  };

  switch (editBrush) {
    case 'wall':
      if (isStart || isGoal) { toast('这里是起点或电池哦'); return; }
      if (wallIdx >= 0) { lv.walls.splice(wallIdx, 1); }   // 再点一次擦掉
      else { if (starIdx >= 0) lv.stars.splice(starIdx, 1); lv.walls.push({ x, y }); }
      break;
    case 'star':
      if (isStart || isGoal) { toast('这里是起点或电池哦'); return; }
      if (starIdx >= 0) { lv.stars.splice(starIdx, 1); }
      else { if (wallIdx >= 0) lv.walls.splice(wallIdx, 1); lv.stars.push({ x, y }); }
      break;
    case 'start':
      if (isGoal) { toast('这里已经是电池啦'); return; }
      removeAll();
      lv.start = { x, y };
      break;
    case 'goal':
      if (isStart) { toast('这里已经是起点啦'); return; }
      removeAll();
      lv.goal = { x, y };
      break;
    case 'erase':
      if (isStart || isGoal) { toast('起点和电池不能擦掉，换个位置放就行'); return; }
      removeAll();
      break;
  }
  tone(700, 0.05, 0, 'square', 0.1);
  buildBoard();
}

/* 选画笔 */
function selectBrush(b) {
  editBrush = b;
  document.querySelectorAll('.palette .brush').forEach(el => {
    el.classList.toggle('current', el.dataset.brush === b);
  });
}

/* 换地图大小（在 5/6/7/8 之间循环） */
function cycleEditSize() {
  const sizes = [5, 6, 7, 8];
  const cur = customLevel.cols;
  const next = sizes[(sizes.indexOf(cur) + 1) % sizes.length];
  customLevel.cols = next;
  customLevel.rows = next;
  // 把超出新边界的东西清掉
  const inb = (p) => p.x < next && p.y < next;
  customLevel.walls = customLevel.walls.filter(inb);
  customLevel.stars = customLevel.stars.filter(inb);
  if (!inb(customLevel.start)) customLevel.start = { x: 0, y: next - 1 };
  if (!inb(customLevel.goal))  customLevel.goal  = { x: next - 1, y: 0 };
  toast('地图变成 ' + next + '×' + next);
  buildBoard();
}

/* 清空当前搭建（保留起点电池） */
function clearEditor() {
  customLevel.walls = [];
  customLevel.stars = [];
  buildBoard();
}

/* 校验自己造的关能不能走通（BFS） */
function validateCustom() {
  const lv = customLevel;
  if (!lv.start || !lv.goal) return '要有一个起点🤖和一个电池🔋哦';
  const wall = new Set(lv.walls.map(w => w.x + ',' + w.y));
  const free = (x, y) => x >= 0 && y >= 0 && x < lv.cols && y < lv.rows && !wall.has(x + ',' + y);
  const seen = new Set([lv.start.x + ',' + lv.start.y]);
  const q = [[lv.start.x, lv.start.y]];
  while (q.length) {
    const [x, y] = q.shift();
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx,dy]) => {
      const nx = x+dx, ny = y+dy, k = nx+','+ny;
      if (free(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    });
  }
  if (!seen.has(lv.goal.x + ',' + lv.goal.y)) return '机器人走不到电池，挪挪石头试试～';
  for (const s of lv.stars) {
    if (!seen.has(s.x + ',' + s.y)) return '有个宝贝被障碍围住了，机器人拿不到哦';
  }
  return null; // 没问题
}

/* 从搭建切换到试玩 */
function playCustom() {
  const err = validateCustom();
  if (err) { toast(err); return; }
  editing = false;
  document.body.classList.remove('editing');
  customLevel.hint = '你自己造的关，加油！';
  program = [];
  renderProgram();
  buildBoard();
}

/* 退出搭建，回到第1关 */
function exitEditor() {
  editing = false;
  document.body.classList.remove('editing');
  levelIndex = 0;
  program = [];
  renderProgram();
  buildBoard();
}
