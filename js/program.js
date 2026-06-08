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
  s.style.left = cell.offsetLeft + cell.offsetWidth / 2 - 14 + 'px';
  s.style.top = cell.offsetTop + cell.offsetHeight / 2 - 14 + 'px';
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
  r.style.left = cell.offsetLeft + 'px';
  r.style.top = cell.offsetTop + 'px';
  r.style.width = cell.offsetWidth + 'px';
  r.style.height = cell.offsetHeight + 'px';
  if (!animate) {
    // 强制重绘后恢复动画
    void r.offsetWidth;
    r.style.transition = '';
  }
}

/* 当前打开着的循环（它的 body 在收集后续动作）；null 表示没开循环 */
let openLoop = null;

/* 一个命令做成一整行：箭头 + 文字 + 删除按钮（点 ✕ 删掉它） */
function makeCmdRow(cmd, key) {
  const row = document.createElement('div');
  row.className = 'cmd-row cmd-' + cmd;
  row.dataset.key = key;
  row.innerHTML =
    `<span class="ico">${ARROW[cmd]}</span>` +
    `<span class="cmd-label">${t('btn.' + cmd)}</span>` +
    `<button class="del" data-del="${key}" aria-label="delete">✕</button>`;
  return row;
}

/* 渲染命令序列：每个命令竖着排一行；循环是一个紫色框，里面装着被重复的命令。 */
function renderProgram() {
  programEl.innerHTML = '';
  if (program.length === 0) return;
  program.forEach((item, i) => {
    if (typeof item === 'object' && item.loop !== undefined) {
      // 循环框
      const box = document.createElement('div');
      box.className = 'loop-block' + (item.open ? ' open' : '');
      box.dataset.index = i;
      const head = document.createElement('div');
      head.className = 'loop-head';
      head.innerHTML =
        `<span class="loop-ico">🔁</span>` +
        `<button class="loop-btn" data-act="dec" data-i="${i}">−</button>` +
        `<span class="loop-x">×</span>` +
        `<span class="loop-count">${item.loop}</span>` +
        `<button class="loop-btn" data-act="inc" data-i="${i}">＋</button>` +
        `<button class="del" data-del="${i}" aria-label="delete">✕</button>`;
      box.appendChild(head);
      // 圈里的命令
      const body = document.createElement('div');
      body.className = 'loop-body';
      item.body.forEach((c, j) => body.appendChild(makeCmdRow(c, i + '-' + j)));
      if (item.body.length === 0) {
        const ph = document.createElement('div');
        ph.className = 'loop-ph';
        ph.textContent = t('loop.placeholder');
        body.appendChild(ph);
      }
      box.appendChild(body);
      programEl.appendChild(box);
    } else {
      programEl.appendChild(makeCmdRow(item, '' + i));
    }
  });
  // 加命令后自动滚到底，露出最新一行
  programEl.scrollTop = programEl.scrollHeight;
}

/* 删除某个命令：path 为 "i"（顶层命令或整个循环）或 "i-j"（循环里的第 j 个） */
function deleteCmd(path) {
  if (isRunning) return;
  const parts = path.split('-').map(Number);
  if (parts.length === 1) {
    const removed = program[parts[0]];
    if (removed === openLoop) {
      openLoop = null;
      updateLoopBtn();
    }
    program.splice(parts[0], 1);
  } else {
    const [i, j] = parts;
    if (program[i] && program[i].body) program[i].body.splice(j, 1);
  }
  tone(420, 0.05, 0, 'square', 0.1);
  renderProgram();
}

/* 命令总数（含循环里的），防止排太多 */
function totalCount() {
  let n = 0;
  for (const it of program)
    n += typeof it === 'object' && it.loop !== undefined ? it.body.length + 1 : 1;
  return n;
}

/* 点 🔁：没开循环就开一个圈，已开就收口 */
function addLoop() {
  if (isRunning) return;
  if (openLoop) {
    // 收口；如果圈里是空的，就把这个空圈删掉
    if (openLoop.body.length === 0) program = program.filter((it) => it !== openLoop);
    openLoop.open = false;
    openLoop = null;
    tone(560, 0.08, 0, 'square', 0.12);
  } else {
    if (totalCount() >= 60) {
      toast(t('toast.tooMany'));
      return;
    }
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
  if (b) b.textContent = openLoop ? t('btn.loopEnd') : t('btn.loop');
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
  if (totalCount() >= 60) {
    toast(t('toast.tooMany'));
    return;
  }
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
    program = program.filter((it) => it !== openLoop);
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
  document.querySelectorAll('button').forEach((b) => {
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
  programEl.querySelectorAll('.running').forEach((c) => c.classList.remove('running'));
}

/* 运行程序：一步步执行 */
async function run() {
  if (isRunning) return;
  // 出发前自动收口还开着的循环圈
  if (openLoop) {
    if (openLoop.body.length === 0) program = program.filter((it) => it !== openLoop);
    openLoop.open = false;
    openLoop = null;
    updateLoopBtn();
    renderProgram();
  }
  const steps = flattenProgram();
  if (steps.length === 0) {
    toast(t('toast.needCmd'));
    return;
  }
  isRunning = true;
  setButtonsDisabled(true);
  // 重建地图：机器人回起点、星星重新出现
  buildBoard();
  const lv = level();
  await sleep(300);

  let movesUsed = 0; // 实际走了多少步，用来评星级
  for (let s = 0; s < steps.length; s++) {
    clearRunHighlight();
    const active = programEl.querySelector(`[data-key="${steps[s].key}"]`);
    if (active) {
      active.classList.add('running');
      // 只在命令列表内部竖向滚动，让当前命令居中可见（不动整个页面）
      const box = active.closest('.loop-block') || active;
      programEl.scrollTop = box.offsetTop - programEl.clientHeight / 2 + box.offsetHeight / 2;
    }
    const cmd = steps[s].dir;

    const d = MOVE_DELTA[cmd];
    const nx = robot.x + d.x;
    const ny = robot.y + d.y;
    if (!canMoveTo(nx, ny)) {
      // 撞墙或出界：朝障碍方向冲一下、撞击、再弹回
      soundBump();
      await crash(d, nx, ny);
      const hitRock = level().walls.some((w) => w.x === nx && w.y === ny);
      finishRun(
        false,
        hitRock ? t('run.hitWallTitle') : t('run.hitEdgeTitle'),
        hitRock ? t('run.hitWallTextRock') : t('run.hitEdgeText'),
        '😵',
        t('run.retry')
      );
      return;
    }
    robot.x = nx;
    robot.y = ny;
    movesUsed++;
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
        finishRun(
          false,
          t('run.needStarsTitle'),
          t('run.needStarsText', { n: starsLeft.size }),
          '🤔',
          t('run.retry')
        );
        return;
      }
      clearRunHighlight();
      cheer();
      if (levelIndex === -1) {
        // 自己造的关：通关
        soundWin();
        await sleep(700);
        finishRun(true, t('run.customWinTitle'), t('run.customWinText'), '🎉', t('run.replay'));
        return;
      }
      // 评星级：走最短路 3 星，多绕一点 2 星，绕远 1 星；记住每关最好成绩
      const stars = starsForRun(movesUsed, optimalSteps());
      if (stars > (levelStars[levelIndex] || 0)) {
        levelStars[levelIndex] = stars;
        saveStars();
      }
      const isLast = levelIndex === LEVELS.length - 1;
      if (isLast) soundCheer();
      else soundWin();
      await sleep(700);
      finishRun(
        true,
        isLast ? t('run.allClearTitle') : t('card.win.title'),
        isLast ? t('run.allClearText') : t('card.win.text'),
        isLast ? '🏆' : '🎉',
        isLast ? t('run.replay') : t('card.next'),
        isLast,
        stars,
        movesUsed
      );
      return;
    }
  }

  // 程序走完但没到终点
  clearRunHighlight();
  await sleep(200);
  finishRun(false, t('run.notReachTitle'), t('run.notReachText'), '🤔', t('run.retry'));
}

function canMoveTo(x, y) {
  const lv = level();
  if (x < 0 || y < 0 || x >= lv.cols || y >= lv.rows) return false;
  if (lv.walls.some((w) => w.x === x && w.y === y)) return false;
  return true;
}

function finishRun(success, title, text, emoji, btnLabel, isFinalWin, stars, movesUsed) {
  isRunning = false;
  setButtonsDisabled(false);
  if (success) confetti(isFinalWin ? 160 : 90); // 过关撒花，通关撒更多
  document.getElementById('cardEmoji').textContent = emoji;
  document.getElementById('cardTitle').textContent = title;
  document.getElementById('cardText').textContent = text;
  // 三星评分：通关时显示获得几颗星 + 走了几步
  const starsEl = document.getElementById('cardStars');
  if (stars) {
    starsEl.innerHTML =
      '⭐'.repeat(stars) + '<span class="empty">' + '☆'.repeat(3 - stars) + '</span>';
    starsEl.classList.add('show');
    document.getElementById('cardSteps').textContent =
      movesUsed != null ? t('result.steps', { n: movesUsed }) : '';
  } else {
    starsEl.classList.remove('show');
    document.getElementById('cardSteps').textContent = '';
  }
  const btn = document.getElementById('cardBtn');
  btn.textContent = btnLabel;
  overlayEl.classList.add('show');

  btn.onclick = () => {
    overlayEl.classList.remove('show');
    if (success) {
      if (levelIndex === -1) {
        // 自己造的关：留在原关，清空命令重玩
      } else if (isFinalWin) {
        levelIndex = 0;
      } else {
        levelIndex++;
      }
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
  if (rock) {
    rock.classList.add('shake');
    setTimeout(() => rock.classList.remove('shake'), 400);
  }
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
  b.style.left = cell.offsetLeft + cell.offsetWidth / 2 - 15 + 'px';
  b.style.top = cell.offsetTop + cell.offsetHeight / 2 - 15 + 'px';
  boardEl.appendChild(b);
  setTimeout(() => b.remove(), 650);
}

/* 撒花特效：从屏幕顶部落下一堆彩色碎纸 */
function confetti(count) {
  const colors = ['#ff6b9d', '#ffd86b', '#5b8def', '#4cc38a', '#ff9f43', '#b98bff', '#ff5e5e'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    const size = 8 + Math.random() * 8;
    p.style.left = Math.random() * 100 + 'vw';
    p.style.width = size + 'px';
    p.style.height = size * 0.6 + 'px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDelay = Math.random() * 0.4 + 's';
    p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
function soundStep() {
  tone(660, 0.12, 0, 'triangle', 0.18);
} // 走一步：清脆"嘀"
function soundBump() {
  tone(150, 0.28, 0, 'sawtooth', 0.25);
} // 撞墙：低沉"咚"
function soundWin() {
  // 过关：一小段上行旋律
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, i * 0.13, 'triangle', 0.22));
}
function soundCheer() {
  // 通关：更长更欢快
  [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
    tone(f, 0.26, i * 0.12, 'triangle', 0.22)
  );
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
