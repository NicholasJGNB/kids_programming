/*
 * 关卡数据与障碍/奖励皮肤
 *
 * 注意：本游戏刻意不使用 ES 模块，各 js 文件按 index.html 中 <script> 的顺序
 * 依次加载、共享同一个全局作用域——这样保留了"双击 index.html 即可游玩"的零依赖特性。
 */

"use strict";

/* ===== 关卡数据 =====
   每一关是一张方格地图。
   start 起点 / goal 电池终点 / walls 障碍(走不进) / stars 路上要收集的宝贝(可选)
   有 stars 的关卡，必须把所有宝贝都捡完、再走到🔋才算过关。
   障碍和宝贝的"皮肤"由 WALL_EMOJIS / REWARD_EMOJIS 随位置变化，更丰富。
*/
const LEVELS = [
  // —— 第一组：认识走路（无障碍）——
  { // 1 往右直直走
    cols: 4, rows: 4, start: {x:0,y:3}, goal: {x:3,y:3}, walls: [],
  },
  { // 2 往上走
    cols: 4, rows: 4, start: {x:0,y:3}, goal: {x:0,y:0}, walls: [],
  },
  { // 3 拐一个弯
    cols: 4, rows: 4, start: {x:0,y:3}, goal: {x:3,y:0}, walls: [],
  },
  { // 4 路上捡一颗星星
    cols: 5, rows: 5, start: {x:0,y:4}, goal: {x:4,y:4}, walls: [],
    stars: [ {x:2,y:4} ],
  },

  // —— 第二组：开始有石头 ——
  { // 5 绕开一块石头
    cols: 5, rows: 5, start: {x:0,y:4}, goal: {x:4,y:4}, walls: [ {x:2,y:4} ],
  },
  { // 6 走 L 形
    cols: 5, rows: 5, start: {x:0,y:4}, goal: {x:4,y:0},
    walls: [ {x:1,y:0},{x:1,y:1},{x:1,y:2},{x:1,y:3} ],
  },
  { // 7 边走边捡两颗星
    cols: 5, rows: 5, start: {x:0,y:4}, goal: {x:4,y:0}, walls: [],
    stars: [ {x:2,y:4},{x:2,y:0} ],
  },
  { // 8 门洞：中间留一个口
    cols: 5, rows: 5, start: {x:0,y:4}, goal: {x:4,y:4},
    walls: [ {x:2,y:4},{x:2,y:3},{x:2,y:1},{x:2,y:0} ],
  },

  // —— 第三组：S 形与小迷宫 ——
  { // 9 S 形迷宫
    cols: 6, rows: 6, start: {x:0,y:5}, goal: {x:5,y:0},
    walls: [
      {x:1,y:1},{x:1,y:2},{x:1,y:3},{x:1,y:4},
      {x:3,y:1},{x:3,y:2},{x:3,y:3},{x:3,y:4},{x:3,y:5}
    ],
  },
  { // 10 绕圈捡星
    cols: 6, rows: 6, start: {x:0,y:5}, goal: {x:0,y:0},
    walls: [ {x:1,y:1},{x:1,y:2},{x:1,y:3},{x:1,y:4},{x:2,y:1},{x:3,y:1},{x:4,y:1} ],
    stars: [ {x:5,y:5},{x:5,y:0} ],
  },
  { // 11 蛇形迷宫（比第10关更绕一点）
    cols: 6, rows: 6, start: {x:0,y:5}, goal: {x:5,y:0},
    walls: [
      {x:1,y:2},{x:2,y:2},{x:3,y:2},{x:4,y:2},{x:5,y:2},
      {x:0,y:4},{x:1,y:4},{x:2,y:4},{x:4,y:4},{x:5,y:4}
    ],
  },
  { // 12 三颗星星
    cols: 6, rows: 6, start: {x:0,y:5}, goal: {x:5,y:0},
    walls: [ {x:2,y:5},{x:2,y:4},{x:2,y:3},{x:4,y:0},{x:4,y:1},{x:4,y:2} ],
    stars: [ {x:1,y:0},{x:3,y:5},{x:5,y:5} ],
  },

  // —— 第四组：开放式迷宫，要在岔路口做选择 + 规划宝贝收集顺序（真正动脑）——
  { // 13 开放迷宫 + 2宝贝
    cols: 6, rows: 6, start: {x:0,y:5}, goal: {x:5,y:0},
    walls: [
      {x:4,y:0},{x:2,y:1},{x:2,y:2},{x:3,y:2},{x:0,y:3},
      {x:4,y:3},{x:5,y:3},{x:0,y:4},{x:1,y:4},{x:2,y:4}
    ],
    stars: [ {x:4,y:1},{x:1,y:5} ],
  },
  { // 14 开放迷宫 + 2宝贝（更大）
    cols: 7, rows: 7, start: {x:0,y:6}, goal: {x:6,y:0},
    walls: [
      {x:2,y:0},{x:5,y:0},{x:4,y:1},{x:5,y:1},{x:1,y:2},{x:5,y:2},
      {x:1,y:3},{x:5,y:3},{x:2,y:4},{x:4,y:4},{x:2,y:5},{x:3,y:6}
    ],
    stars: [ {x:6,y:1},{x:0,y:5} ],
  },
  { // 15 开放迷宫 + 3宝贝
    cols: 7, rows: 7, start: {x:0,y:6}, goal: {x:6,y:0},
    walls: [
      {x:4,y:0},{x:5,y:0},{x:1,y:1},{x:4,y:1},{x:0,y:2},{x:5,y:2},
      {x:2,y:3},{x:3,y:5},{x:3,y:6},{x:5,y:6}
    ],
    stars: [ {x:0,y:0},{x:6,y:6},{x:0,y:3} ],
  },
  { // 16 开放迷宫 + 3宝贝（更绕）
    cols: 7, rows: 7, start: {x:0,y:6}, goal: {x:6,y:0},
    walls: [
      {x:1,y:0},{x:2,y:0},{x:3,y:1},{x:4,y:2},{x:1,y:3},{x:5,y:3},
      {x:0,y:4},{x:1,y:4},{x:2,y:4},{x:4,y:5},{x:5,y:6},{x:6,y:6}
    ],
    stars: [ {x:0,y:0},{x:5,y:0},{x:0,y:5} ],
  },

  // —— 终极挑战（8×8 大迷宫 + 多个宝贝）——
  { // 17 大迷宫 + 3宝贝
    cols: 8, rows: 8, start: {x:0,y:7}, goal: {x:7,y:0},
    walls: [
      {x:4,y:1},{x:6,y:1},{x:3,y:2},{x:4,y:2},{x:5,y:2},{x:7,y:2},
      {x:0,y:3},{x:4,y:3},{x:5,y:3},{x:6,y:3},{x:7,y:3},{x:2,y:4},
      {x:3,y:4},{x:5,y:4},{x:6,y:4},{x:2,y:5},{x:6,y:5},{x:3,y:6},
      {x:6,y:6},{x:1,y:7}
    ],
    stars: [ {x:6,y:0},{x:0,y:6},{x:7,y:4} ],
  },
  { // 18 终极：大迷宫 + 4个宝贝
    cols: 8, rows: 8, start: {x:0,y:7}, goal: {x:7,y:0},
    walls: [
      {x:4,y:0},{x:2,y:1},{x:3,y:1},{x:6,y:1},{x:2,y:2},{x:5,y:2},
      {x:4,y:3},{x:7,y:3},{x:2,y:4},{x:3,y:4},{x:5,y:4},{x:6,y:4},
      {x:0,y:5},{x:2,y:6},{x:2,y:7},{x:4,y:7}
    ],
    stars: [ {x:0,y:0},{x:6,y:0},{x:0,y:6},{x:7,y:7} ],
  }
];

// 四个方向各走一格
const MOVE_DELTA = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1,  y: 0 }
};
const ARROW = { up: '⬆', down: '⬇', left: '⬅', right: '➡' };

// 障碍物和奖励的"皮肤"——每关固定挑选最多2种，关内只在这2种里变化，丰富又不乱
const WALL_EMOJIS   = ['🪨','💩','🌵','🔥','🧱','🌳','🚧','🦔'];
const REWARD_EMOJIS = ['⭐','💎','🍎','🍓','🎁','🍪','🍰','🍭','🍌','🏆'];
// 根据关卡序号，固定取出这一关要用的两种皮肤
function levelSkins(list, salt) {
  const n = levelIndex + salt;
  const a = list[n % list.length];
  const b = list[(n * 7 + 3) % list.length];
  return a === b ? [a] : [a, b];   // 万一撞上同一个，就只用一种
}
// 关内：按坐标在这一关的两种皮肤里固定选一个（同格不变、相邻可不同）
function pickEmoji(list, x, y, salt) {
  const skins = levelSkins(list, salt);
  return skins[(x + y) % skins.length];
}
