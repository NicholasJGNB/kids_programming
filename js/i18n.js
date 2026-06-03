/*
 * 国际化（i18n）：中英双语文案字典 + 翻译函数 t()。
 *
 * - 文案集中在这里，按 key 取用，JS 里用 t('key')，HTML 里用 data-i18n="key"。
 * - 语言自动按浏览器判断，并记在 localStorage；可用 setLang() 手动切换。
 * - 不依赖任何库，保持"零依赖、双击即玩"。
 */
'use strict';

const I18N = {
  zh: {
    // —— 页面/标题 ——
    'app.title': '小机器人去充电 · 编程启蒙游戏',
    'app.h1': '🤖 小机器人去充电',
    'status.levelPrefix': '第',
    'status.levelSuffix': '关',
    'status.goalHint': '帮机器人找到电池！',
    'btn.levelSelect': '🗺 选关',
    // —— 方向/操作按钮 ——
    'btn.up': '上',
    'btn.down': '下',
    'btn.left': '左',
    'btn.right': '右',
    'btn.loop': '🔁 重复',
    'btn.loopEnd': '✓ 结束圈',
    'btn.undo': '↩ 撤回',
    'btn.clear': '🗑 清空',
    'btn.run': '▶ 出发！',
    // —— 编辑器 ——
    'edit.hint': '先点一个工具，再点格子来画 👇',
    'edit.wall': '障碍',
    'edit.star': '宝贝',
    'edit.start': '起点',
    'edit.goal': '电池',
    'edit.erase': '擦掉',
    'edit.size': '📐 换大小',
    'edit.clear': '🗑 清空',
    'edit.back': '← 返回',
    'edit.play': '▶ 开始玩',
    // —— 选关浮层 ——
    'picker.title': '选择关卡',
    'picker.build': '🏗 自己造一关',
    'picker.close': '关闭',
    // —— 结算卡片默认 ——
    'card.win.title': '太棒啦！',
    'card.win.text': '机器人充上电了！',
    'card.next': '下一关 →',
    // —— 状态栏标签 ——
    'label.level': '第 {n} 关',
    'label.buildEdit': '🏗 搭建中',
    'label.buildPlay': '🏗 自由关',
    // —— 运行/提示 ——
    'toast.needCmd': '先给机器人下几个走路命令吧～',
    'toast.tooMany': '命令有点太多啦～',
    'loop.placeholder': '把动作放进来…',
    'run.hitWallTitle': '咣！撞到障碍啦！',
    'run.hitWallTextRock': '前面有障碍挡路，机器人过不去，要绕开它哦～',
    'run.hitEdgeTitle': '哎呀，撞墙啦！',
    'run.hitEdgeText': '机器人不能走出地图，再想想怎么走～',
    'run.needStarsTitle': '还差宝贝！',
    'run.needStarsText': '还有 {n} 个宝贝没捡到呢，先把它们都收集齐再来充电～',
    'run.notReachTitle': '差一点点！',
    'run.notReachText': '机器人还没走到电池那里，再加几个命令试试～',
    'run.retry': '再试一次',
    'run.allClearTitle': '全部通关啦！🏆',
    'run.allClearText': '你是真正的小小程序员！可以从头再玩，或挑战实体机器人～',
    'run.replay': '再玩一次',
    'run.customWinTitle': '通关啦！🎉',
    'run.customWinText': '你自己造的关也能通关，真厉害！',
    // —— 编辑器提示 ——
    'edit.needStartGoal': '要有一个起点🤖和一个电池🔋哦',
    'edit.starTrapped': '有个宝贝被障碍围住了，机器人拿不到哦',
    'edit.noReach': '机器人走不到电池，挪挪石头试试～',
    'edit.cantEraseSG': '起点和电池不能擦掉，换个位置放就行',
    'edit.isStartOrGoal': '这里是起点或电池哦',
    'edit.alreadyGoal': '这里已经是电池啦',
    'edit.alreadyStart': '这里已经是起点啦',
    'edit.resized': '地图变成 {n}×{n}',
    'edit.customHint': '你自己造的关，加油！',
    // —— 关卡提示 ——
    'hint.1': '一直往右走，找到电池！',
    'hint.2': '一直往上走就到啦！',
    'hint.3': '先往右，再往上走！',
    'hint.4': '路上有个宝贝，记得捡走它！',
    'hint.5': '当心障碍，要绕过去！',
    'hint.6': '先一直往上，再往右走！',
    'hint.7': '把两个宝贝都捡到，再去充电！',
    'hint.8': '墙上有个洞，从中间钻过去！',
    'hint.9': '弯弯绕绕，慢慢想，你一定行！',
    'hint.10': '先去右边捡两个宝贝，再绕回来！',
    'hint.11': '左右来回穿过两道墙，绕到顶上！',
    'hint.12': '三个宝贝都要捡到哦，动动脑筋！',
    'hint.13': '两个宝贝在两边，想想先拿哪个不绕远！',
    'hint.14': '岔路很多，挑一条能把两个宝贝都捡到的路！',
    'hint.15': '三个宝贝分散在各处，好好规划路线哦！',
    'hint.16': '先想好顺序，别让机器人白跑冤枉路！',
    'hint.17': '好大的迷宫！三个宝贝藏得很远，慢慢规划。',
    'hint.18': '最后一关！四个宝贝在四角，规划好就是编程小高手！',
    // —— 语言切换 ——
    'btn.lang': 'EN',
  },
  en: {
    'app.title': 'Robot to the Charger · Coding for Kids',
    'app.h1': '🤖 Robot to the Charger',
    'status.levelPrefix': 'Level',
    'status.levelSuffix': '',
    'status.goalHint': 'Help the robot find the battery!',
    'btn.levelSelect': '🗺 Levels',
    'btn.up': 'Up',
    'btn.down': 'Down',
    'btn.left': 'Left',
    'btn.right': 'Right',
    'btn.loop': '🔁 Repeat',
    'btn.loopEnd': '✓ End loop',
    'btn.undo': '↩ Undo',
    'btn.clear': '🗑 Clear',
    'btn.run': '▶ Go!',
    'edit.hint': 'Pick a tool, then tap a cell to draw 👇',
    'edit.wall': 'Wall',
    'edit.star': 'Treasure',
    'edit.start': 'Start',
    'edit.goal': 'Battery',
    'edit.erase': 'Erase',
    'edit.size': '📐 Resize',
    'edit.clear': '🗑 Clear',
    'edit.back': '← Back',
    'edit.play': '▶ Play',
    'picker.title': 'Choose a Level',
    'picker.build': '🏗 Build your own',
    'picker.close': 'Close',
    'card.win.title': 'Great job!',
    'card.win.text': 'The robot is charged up!',
    'card.next': 'Next →',
    'label.level': 'Level {n}',
    'label.buildEdit': '🏗 Building',
    'label.buildPlay': '🏗 Custom',
    'toast.needCmd': 'Add a few move commands first ~',
    'toast.tooMany': "That's a lot of commands ~",
    'loop.placeholder': 'Drop actions here…',
    'run.hitWallTitle': 'Bonk! Hit an obstacle!',
    'run.hitWallTextRock': "There's an obstacle ahead — go around it!",
    'run.hitEdgeTitle': 'Oops, hit the wall!',
    'run.hitEdgeText': "The robot can't leave the map — try another way ~",
    'run.needStarsTitle': 'Treasures left!',
    'run.needStarsText': '{n} treasure(s) still uncollected — grab them all before charging ~',
    'run.notReachTitle': 'So close!',
    'run.notReachText': "The robot didn't reach the battery — add a few more commands ~",
    'run.retry': 'Try again',
    'run.allClearTitle': 'All levels cleared! 🏆',
    'run.allClearText': "You're a real little programmer! Play again, or try a real robot ~",
    'run.replay': 'Play again',
    'run.customWinTitle': 'Cleared! 🎉',
    'run.customWinText': 'You beat your own level — awesome!',
    'edit.needStartGoal': 'You need a start 🤖 and a battery 🔋',
    'edit.starTrapped': "A treasure is walled in — the robot can't reach it",
    'edit.noReach': "The robot can't reach the battery — move some walls ~",
    'edit.cantEraseSG': "Start and battery can't be erased — just move them",
    'edit.isStartOrGoal': "That's the start or the battery",
    'edit.alreadyGoal': "That's already the battery",
    'edit.alreadyStart': "That's already the start",
    'edit.resized': 'Map is now {n}×{n}',
    'edit.customHint': 'Your own level — you got this!',
    'hint.1': 'Just keep going right to find the battery!',
    'hint.2': "Just keep going up and you're there!",
    'hint.3': 'Go right first, then up!',
    'hint.4': "There's a treasure on the way — grab it!",
    'hint.5': 'Watch out for the obstacle — go around it!',
    'hint.6': 'Go all the way up first, then right!',
    'hint.7': 'Collect both treasures, then go charge!',
    'hint.8': "There's a gap in the wall — slip through the middle!",
    'hint.9': 'Twists and turns — take your time, you can do it!',
    'hint.10': 'Grab the two treasures on the right, then loop back!',
    'hint.11': 'Weave left and right past the walls to the top!',
    'hint.12': 'Collect all three treasures — put on your thinking cap!',
    'hint.13': 'Two treasures on each side — which to grab first?',
    'hint.14': 'Lots of forks — find a path that grabs both treasures!',
    'hint.15': 'Three treasures scattered around — plan your route!',
    'hint.16': "Plan the order so the robot doesn't waste moves!",
    'hint.17': 'A big maze! Three treasures hidden far — plan carefully.',
    'hint.18': "Final level! Four treasures in the corners — plan it and you're a coding star!",
    'btn.lang': '中',
  },
};

let currentLang = (function () {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch (e) {}
  const nav = (navigator.language || 'zh').toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
})();

// 取一条文案；vars 用于 {n} 这类占位替换
function t(key, vars) {
  let s = I18N[currentLang] && I18N[currentLang][key];
  if (s === undefined) s = I18N.zh[key] !== undefined ? I18N.zh[key] : key;
  if (vars) for (const k in vars) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
  return s;
}

function getLang() {
  return currentLang;
}

function setLang(lang) {
  if (lang !== 'zh' && lang !== 'en') return;
  currentLang = lang;
  try {
    localStorage.setItem('lang', lang);
  } catch (e) {}
  applyI18n();
}

// 把页面上所有带 data-i18n 的元素文本刷新为当前语言
function applyI18n() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.title = t('app.title');
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  // 一些需要动态重绘的地方（状态栏标签、命令条占位、循环按钮）交给各模块在重绘时用 t()
  if (typeof refreshDynamicI18n === 'function') refreshDynamicI18n();
}
