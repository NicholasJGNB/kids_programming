/*
 * 命令条 · 循环 · 运行 · 特效 · 音效
 *
 * 注意：本游戏刻意不使用 ES 模块，各 js 文件按 index.html 中 <script> 的顺序
 * 依次加载、共享同一个全局作用域——这样保留了"双击 index.html 即可游玩"的零依赖特性。
 */

/* 机器人当前格子若有星星，就把它收集掉 */
function collectStarHere() {
  const key = robot.x + ',' + robot.y;
  if (!starsLeft.has(key)) return;
  starsLeft.delete(key);
  const cell = boardEl.querySelector(`.cell[data-star][data-x="${robot.x}"][data-y="${robot.y}"]`);
  let emoji = '⭐';
  if (cell) {
    emoji = cell.textContent || '⭐';
    cell.classList.remove('star');
    cell.removeAttribute('data-star');
    cell.textContent = '';
  }
  // 飞出刚捡到的那个奖励的小动画 + 叮的一声
  starBurst(robot.x, robot.y, emoji);
  tone(1318, 0.12, 0, 'triangle', 0.2);
  tone(1760, 0.12, 0.06, 'triangle', 0.18);
}

/* 收集奖励时冒出的小动画 */
function starBurst(x, y, emoji) {
  const cell = boardEl.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
  if (!cell) return;
  const s = document.createElement('div');
  s.className = 'star-burst';
  s.textContent = emoji || '⭐';
  s.style.left = (cell.offsetLeft + cell.offsetWidth / 2 - 14) + 'px';
  s.style.top  = (cell.offsetTop + cell.offsetHeight / 2 - 14) + 'px';
  boardEl.appendChild(s);
  setTimeout(() => s.remove(), 600);
}

/* 把机器人div对齐到目标格子的真实位置（自动算准间距和留白） */
function placeRobot(animate) {
  const r = document.getElementById('robot');
  const cell = boardEl.querySelector(`.cell[data-x="${robot.x}"][data-y="${robot.y}"]`);
  if (!cell) return;
  if (!animate) r.style.transition = 'none';
  // offsetLeft/Top 是相对于 #board（已设为 position:relative）的精确像素位置
  r.style.left   = cell.offsetLeft + 'px';
  r.style.top    = cell.offsetTop + 'px';
  r.style.width  = cell.offsetWidth + 'px';
  r.style.height = cell.offsetHeight + 'px';
  if (!animate) {
    // 强制重绘后恢复动画
    void r.offsetWidth;
    r.style.transition = '';
  }
}

/* 当前打开着的循环（它的 body 在收集后续动作）；null 表示没开循环 */
let openLoop = null;

/* 一个方向命令做成箭头方块 */
function makeChip(cmd, key) {
  const chip = document.createElement('div');
  chip.className = 'chip cmd-' + cmd;
  chip.dataset.key = key;
  chip.textContent = ARROW[cmd];
  return chip;
}

/* 渲染程序条。循环是一个紫色"圈"，里面装着被重复的动作 */
function renderProgram() {
  programEl.innerHTML = '';
  if (program.length === 0) return;
  program.forEach((item, i) => {
    if (typeof item === 'object' && item.loop !== undefined) {
      // 循环"圈"
      const box = document.createElement('div');
      box.className = 'loop-chip' + (item.open ? ' open' : '');
      box.dataset.index = i;
      // 次数调节
      const head = document.createElement('div');
      head.className = 'loop-head';
      head.innerHTML =
        `<button class="loop-btn" data-act="dec" data-i="${i}">−</button>` +
        `<span class="loop-x">×</span>` +
        `<span class="loop-count">${item.loop}</span>` +
        `<button class="loop-btn" data-act="inc" data-i="${i}">＋</button>`;
      box.appendChild(head);
      // 圈里的动作
      const body = document.createElement('div');
      body.className = 'loop-body';
      item.body.forEach((c, j) => body.appendChild(makeChip(c, i + '-' + j)));
      if (item.open && item.body.length === 0) {
        const ph = document.createElement('span');
        ph.className = 'loop-ph';
        ph.textContent = '把动作放进来…';
        body.appendChild(ph);
      }
      box.appendChild(body);
      programEl.appendChild(box);
    } else {
      programEl.appendChild(makeChip(item, '' + i));
    }
  });
  programEl.scrollLeft = programEl.scrollWidth;
}

/* 命令总数（含循环里的），防止排太多 */
function totalCount() {
  let n = 0;
  for (const it of program) n += (typeof it === 'object' && it.loop !== undefined) ? it.body.length + 1 : 1;
  return n;
}

/* 点 🔁：没开循环就开一个圈，已开就收口 */
function addLoop() {
  if (isRunning) return;
  if (openLoop) {
    // 收口；如果圈里是空的，就把这个空圈删掉
    if (openLoop.body.length === 0) program = program.filter(it => it !== openLoop);
    openLoop.open = false;
    openLoop = null;
    tone(560, 0.08, 0, 'square', 0.12);
  } else {
    if (totalCount() >= 60) { toast('命令有点太多啦～'); return; }
    openLoop = { loop: 2, body: [], open: true };
    program.push(openLoop);
    tone(740, 0.07, 0, 'square', 0.12);
  }
  updateLoopBtn();
  renderProgram();
}

/* 循环按钮文字随状态变化 */
function updateLoopBtn() {
  const b = document.getElementById('btnLoop');
  if (b) b.textContent = openLoop ? '✓ 结束圈' : '🔁 重复';
}

/* 调整循环次数（2~9） */
function changeLoop(i, delta) {
  if (isRunning) return;
  const item = program[i];
  if (!item || item.loop === undefined) return;
  item.loop = Math.max(2, Math.min(9, item.loop + delta));
  renderProgram();
  tone(880, 0.05, 0, 'square', 0.1);
}

/* 加方向命令：圈开着就放进圈里，否则放到外面 */
function addCommand(cmd) {
  if (isRunning) return;
  if (totalCount() >= 60) { toast('命令有点太多啦～'); return; }
  if (openLoop) openLoop.body.push(cmd);
  else program.push(cmd);
  renderProgram();
}

/* 撤回：优先从打开的圈里撤，圈空了再撤外面 */
function undo() {
  if (isRunning) return;
  if (openLoop && openLoop.body.length > 0) {
    openLoop.body.pop();
  } else if (openLoop) {
    // 空圈，撤回就把圈也去掉
    program = program.filter(it => it !== openLoop);
    openLoop = null;
    updateLoopBtn();
  } else {
    program.pop();
  }
  renderProgram();
}

function clearProgram() {
  if (isRunning) return;
  program = [];
  openLoop = null;
  updateLoopBtn();
  renderProgram();
  buildBoard(); // 机器人回到起点
}

function setButtonsDisabled(disabled) {
  document.querySelectorAll('button').forEach(b => {
    if (b.id !== 'cardBtn') b.disabled = disabled;
  });
}

/* 把带循环的命令展开成一串实际要走的步骤。
   循环"圈"会把它 body 里的动作整组重复 N 次。
   返回数组，每项 { dir, key }，key 指向要高亮的命令方块。 */
function flattenProgram() {
  const steps = [];
  program.forEach((item, i) => {
    if (typeof item === 'object' && item.loop !== undefined) {
      for (let r = 0; r < item.loop; r++) {
        item.body.forEach((c, j) => steps.push({ dir: c, key: i + '-' + j }));
      }
    } else {
      steps.push({ dir: item, key: '' + i });
    }
  });
  return steps;
}

function clearRunHighlight() {
  programEl.querySelectorAll('.running').forEach(c => c.classList.remove('running'));
}

/* 运行程序：一步步执行 */
async function run() {
  if (isRunning) return;
  // 出发前自动收口还开着的循环圈
  if (openLoop) {
    if (openLoop.body.length === 0) program = program.filter(it => it !== openLoop);
    openLoop.open = false;
    openLoop = null;
    updateLoopBtn();
    renderProgram();
  }
  const steps = flattenProgram();
  if (steps.length === 0) {
    toast('先给机器人下几个走路命令吧～');
    return;
  }
  isRunning = true;
  setButtonsDisabled(true);
  // 重建地图：机器人回起点、星星重新出现
  buildBoard();
  const lv = level();
  await sleep(300);

  for (let s = 0; s < steps.length; s++) {
    clearRunHighlight();
    const active = programEl.querySelector(`[data-key="${steps[s].key}"]`);
    if (active) {
      active.classList.add('running');
      // 只在命令条内部横向滚动，让当前命令居中可见（不动整个页面）
      const box = active.closest('.loop-chip') || active;
      programEl.scrollLeft = box.offsetLeft - programEl.clientWidth / 2 + box.offsetWidth / 2;
    }
    const cmd = steps[s].dir;

    const d = MOVE_DELTA[cmd];
    const nx = robot.x + d.x;
    const ny = robot.y + d.y;
    if (!canMoveTo(nx, ny)) {
      // 撞墙或出界：朝障碍方向冲一下、撞击、再弹回
      soundBump();
      await crash(d, nx, ny);
      const hitRock = level().walls.some(w => w.x === nx && w.y === ny);
      finishRun(false,
        hitRock ? '咣！撞到障碍啦！' : '哎呀，撞墙啦！',
        hitRock ? '前面有障碍挡路，机器人过不去，要绕开它哦～' : '机器人不能走出地图，再想想怎么走～',
        '😵', '再试一次');
      return;
    }
    robot.x = nx;
    robot.y = ny;
    placeRobot(true);
    soundStep();
    await sleep(450);

    // 踩到星星就收集
    collectStarHere();

    // 到达终点：必须把星星都捡完才算过关
    if (robot.x === lv.goal.x && robot.y === lv.goal.y) {
      if (starsLeft.size > 0) {
        clearRunHighlight();
        await sleep(200);
        finishRun(false, '还差宝贝！',
          `还有 ${starsLeft.size} 个宝贝没捡到呢，先把它们都收集齐再来充电～`,
          '🤔', '再试一次');
        return;
      }
      clearRunHighlight();
      cheer();
      if (levelIndex === -1) {
        // 自己造的关：通关
        soundWin();
        await sleep(700);
        finishRun(true, '通关啦！🎉', '你自己造的关也能通关，真厉害！', '🎉', '再玩一次');
        return;
      }
      cleared.add(levelIndex);  // 记下这一关已通关，显示 ⭐
      const isLast = levelIndex === LEVELS.length - 1;
      if (isLast) soundCheer(); else soundWin();
      await sleep(700);
      finishRun(true,
        isLast ? '全部通关啦！🏆' : '太棒啦！',
        isLast ? '你是真正的小小程序员！可以从头再玩，或挑战实体机器人～' : '机器人充上电了！',
        isLast ? '🏆' : '🎉',
        isLast ? '再玩一次' : '下一关 →',
        isLast);
      return;
    }
  }

  // 程序走完但没到终点
  clearRunHighlight();
  await sleep(200);
  finishRun(false, '差一点点！', '机器人还没走到电池那里，再加几个命令试试～', '🤔', '再试一次');
}

function canMoveTo(x, y) {
  const lv = level();
  if (x < 0 || y < 0 || x >= lv.cols || y >= lv.rows) return false;
  if (lv.walls.some(w => w.x === x && w.y === y)) return false;
  return true;
}

function finishRun(success, title, text, emoji, btnLabel, isFinalWin) {
  isRunning = false;
  setButtonsDisabled(false);
  if (success) confetti(isFinalWin ? 160 : 90); // 过关撒花，通关撒更多
  document.getElementById('cardEmoji').textContent = emoji;
  document.getElementById('cardTitle').textContent = title;
  document.getElementById('cardText').textContent = text;
  const btn = document.getElementById('cardBtn');
  btn.textContent = btnLabel;
  overlayEl.classList.add('show');

  btn.onclick = () => {
    overlayEl.classList.remove('show');
    if (success) {
      if (levelIndex === -1) {
        // 自己造的关：留在原关，清空命令重玩
      } else if (isFinalWin) { levelIndex = 0; }
      else { levelIndex++; }
      program = [];
      renderProgram();
      buildBoard();
    } else {
      // 失败：保留程序，机器人回起点，方便修改
      buildBoard();
    }
  };
}

/* 撞击效果：机器人朝障碍方向冲一截再弹回，障碍格晃动并冒 💥 */
async function crash(dir, tx, ty) {
  const r = document.getElementById('robot');
  // 机器人朝障碍方向冲出约 40% 一格的距离
  const push = 0.4;
  const lungeX = dir.x * r.offsetWidth * push;
  const lungeY = dir.y * r.offsetHeight * push;
  r.style.transition = 'translate .12s ease-out';
  r.style.translate = `${lungeX}px ${lungeY}px`;
  await sleep(120);

  // 撞上的瞬间：💥 + 石头晃动 + 机器人受惊变大一下
  showBurst(tx, ty, dir);
  const rock = boardEl.querySelector(`.cell.wall[data-x="${tx}"][data-y="${ty}"]`);
  if (rock) { rock.classList.add('shake'); setTimeout(() => rock.classList.remove('shake'), 400); }
  r.classList.add('bump');

  // 弹回原位
  r.style.translate = '0 0';
  await sleep(380);
  r.classList.remove('bump');
  r.style.transition = '';
  r.style.translate = '';
}

/* 在格子(或地图边界)位置冒出一个 💥 */
function showBurst(tx, ty, dir) {
  const lv = level();
  // 若目标格在地图内就用该格，否则用机器人当前格作为撞击点
  const inMap = tx >= 0 && ty >= 0 && tx < lv.cols && ty < lv.rows;
  const cx = inMap ? tx : robot.x;
  const cy = inMap ? ty : robot.y;
  const cell = boardEl.querySelector(`.cell[data-x="${cx}"][data-y="${cy}"]`);
  if (!cell) return;
  const b = document.createElement('div');
  b.className = 'crash-burst';
  b.textContent = '💥';
  b.style.left = (cell.offsetLeft + cell.offsetWidth / 2 - 15) + 'px';
  b.style.top  = (cell.offsetTop  + cell.offsetHeight / 2 - 15) + 'px';
  boardEl.appendChild(b);
  setTimeout(() => b.remove(), 650);
}

/* 撒花特效：从屏幕顶部落下一堆彩色碎纸 */
function confetti(count) {
  const colors = ['#ff6b9d','#ffd86b','#5b8def','#4cc38a','#ff9f43','#b98bff','#ff5e5e'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const size = 8 + Math.random() * 8;
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.width = size + 'px';
    p.style.height = (size * 0.6) + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDelay = (Math.random() * 0.4) + 's';
    p.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3600);
  }
}
function cheer() {
  const r = document.getElementById('robot');
  r.classList.add('cheer');
}

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ===== 音效（用浏览器自带的 Web Audio 合成，不需要音频文件）===== */
let audioCtx = null;
function getAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  // 手机/浏览器要求用户点击后才能出声，这里在需要时唤醒
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
// 播放一个音符：频率 freq(Hz)、时长 dur(秒)、起始延迟 when(秒)、波形 type
function tone(freq, dur, when = 0, type = 'sine', vol = 0.22) {
  const ctx = getAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // 用淡入淡出包络，避免"啪"的爆音
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}
function soundStep()  { tone(660, 0.12, 0, 'triangle', 0.18); }              // 走一步：清脆"嘀"
function soundBump()  { tone(150, 0.28, 0, 'sawtooth', 0.25); }             // 撞墙：低沉"咚"
function soundWin()   {                                                     // 过关：一小段上行旋律
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, i * 0.13, 'triangle', 0.22));
}
function soundCheer() {                                                      // 通关：更长更欢快
  [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.26, i * 0.12, 'triangle', 0.22));
}

// 手机浏览器要求"用户点击后"才允许出声，第一次触摸时唤醒音频
function unlockAudio() {
  getAudio();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('touchstart', unlockAudio);
}
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('touchstart', unlockAudio);

// 点方向键时给个轻轻的"咔"声，让孩子知道命令记下了
function addCommandWithSound(cmd) {
  addCommand(cmd);
  tone(880, 0.06, 0, 'square', 0.12);
}
