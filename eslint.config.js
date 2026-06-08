/*
 * ESLint 配置（扁平配置，ESLint 9+）。
 *
 * 本项目刻意采用"多文件共享同一全局作用域"的架构（见 README / 各 js 文件头注释），
 * 因此在一个文件定义、在另一个文件使用的函数与变量都是合法的全局引用。
 * 下面把这些跨文件全局显式声明为 writable，避免 no-undef 误报。
 */
'use strict';

// 游戏各 js 文件之间共享的全局（函数 + 顶层状态/常量）
const SHARED_GLOBALS = [
  // 函数
  'addCommand',
  'addCommandWithSound',
  'addLoop',
  'applyI18n',
  'bfsDist',
  'buildBoard',
  'canMoveTo',
  'deleteCmd',
  'optimalSteps',
  'permute',
  'saveStars',
  'starsForRun',
  'changeLoop',
  'cheer',
  'clearEditor',
  'clearProgram',
  'clearRunHighlight',
  'closeLevelPicker',
  'collectStarHere',
  'confetti',
  'crash',
  'cycleEditSize',
  'editCellAt',
  'exitEditor',
  'finishRun',
  'flattenProgram',
  'getAudio',
  'getLang',
  'goToLevel',
  'level',
  'levelSkins',
  'makeChip',
  'openLevelPicker',
  'pickEmoji',
  'placeRobot',
  'playCustom',
  'refreshDynamicI18n',
  'renderLevelSelect',
  'renderProgram',
  'run',
  'selectBrush',
  'setButtonsDisabled',
  'setLang',
  'showBurst',
  'sleep',
  'speak',
  'soundBump',
  'soundCheer',
  'soundStep',
  'soundWin',
  'starBurst',
  'startEditor',
  't',
  'toast',
  'tone',
  'totalCount',
  'undo',
  'unlockAudio',
  'updateLoopBtn',
  'validateCustom',
  // 顶层状态与常量
  'ARROW',
  'I18N',
  'LEVELS',
  'MOVE_DELTA',
  'REWARD_EMOJIS',
  'WALL_EMOJIS',
  'audioCtx',
  'boardEl',
  'levelStars',
  'currentLang',
  'customLevel',
  'editBrush',
  'editing',
  'isRunning',
  'levelIndex',
  'openLoop',
  'overlayEl',
  'program',
  'programEl',
  'robot',
  'starsLeft',
  'toastEl',
  'toastTimer',
];

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  localStorage: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  fetch: 'readonly',
  caches: 'readonly',
  AudioContext: 'readonly',
  webkitAudioContext: 'readonly',
  speechSynthesis: 'readonly',
  SpeechSynthesisUtterance: 'readonly',
  URL: 'readonly',
  RegExp: 'readonly',
  Set: 'readonly',
  Promise: 'readonly',
  Math: 'readonly',
  console: 'readonly',
};

const sharedWritable = Object.fromEntries(SHARED_GLOBALS.map((n) => [n, 'writable']));

module.exports = [
  // 浏览器侧游戏代码
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...browserGlobals, ...sharedWritable },
    },
    rules: {
      // no-undef 仍开启——能抓到拼错的变量/函数名（很有价值）。
      'no-undef': 'error',
      // 本架构下，函数/变量常在 A 文件定义、B 文件使用，ESLint 按文件单独分析
      // 会把它们误判为"未使用 / 可改 const"，故对共享全局文件关闭这两条。
      'no-unused-vars': 'off',
      'prefer-const': 'off',
      eqeqeq: ['warn', 'smart'],
      'no-var': 'error',
    },
  },
  // Node 侧脚本（测试、工具）
  {
    files: ['tests/**/*.js', 'tools/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-undef': 'error',
    },
  },
  // Service Worker
  {
    files: ['sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        location: 'readonly',
        URL: 'readonly',
        Promise: 'readonly',
        console: 'readonly',
      },
    },
    rules: { 'no-undef': 'error' },
  },
];
