/*
 * 全局状态与 DOM 引用
 *
 * 注意：本游戏刻意不使用 ES 模块，各 js 文件按 index.html 中 <script> 的顺序
 * 依次加载、共享同一个全局作用域——这样保留了"双击 index.html 即可游玩"的零依赖特性。
 */

let levelIndex = 0;       // -1 表示正在玩"自己造的关"
// 命令序列。每一项是方向 'up'/'down'/'left'/'right'，
// 或一个循环标记 { loop: N } —— 表示"它后面的动作重复 N 次"
let program = [];
let robot = null;        // {x, y, dir}
let isRunning = false;
let cleared = new Set(); // 已通关的关卡序号（用来显示 ⭐）
let starsLeft = new Set(); // 本关还没捡到的星星
let customLevel = null;  // 自己造的关卡数据
let editing = false;     // 是否在搭建模式
let editBrush = 'wall';  // 当前画笔

const boardEl   = document.getElementById('board');
const programEl = document.getElementById('program');
const overlayEl = document.getElementById('overlay');
const toastEl   = document.getElementById('toast');
