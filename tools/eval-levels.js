#!/usr/bin/env node
/*
 * 关卡设计评估脚本
 * 用法：node tools/eval-levels.js
 *
 * 从 index.html 里读出 LEVELS，对每一关算几个指标，帮助判断关卡设计是否合理：
 *   - 步数：真实最短步数（按最优顺序捡完所有宝贝再到电池）—— 衡量"操作量"
 *   - 岔路：可走格里有 ≥3 个可走方向的格子数 —— 衡量"要不要做选择"
 *   - 宝贝：要收集的宝贝数 —— 多个宝贝就要"规划收集顺序"，最费脑
 *   - 动脑分：宝贝数×10 + 岔路×0.5 + 步数×0.3 —— 综合的"思维难度"
 *
 * 重要结论：步数多 ≠ 动脑多。一条没有岔路的长走廊步数很多，但孩子只要
 * "撞墙就拐弯"机械地走即可；真正动脑的是"要在岔路口做选择 + 规划宝贝顺序"。
 * 评估关卡递进时，应主要看【动脑分】而不是单纯的步数。
 *
 * 脚本还会校验：每一关是否可解（起点能到终点和所有宝贝）、起点/终点/宝贝
 * 是否压在墙上。任何一关不可解都是致命问题。
 */
"use strict";
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const LEVELS = eval(html.match(/const LEVELS = (\[[\s\S]*?\n\]);/)[1]);

function bfs(lv, a, b) {
  const wall = new Set((lv.walls || []).map(w => w.x + "," + w.y));
  const free = (x, y) => x >= 0 && y >= 0 && x < lv.cols && y < lv.rows && !wall.has(x + "," + y);
  const seen = new Set([a[0] + "," + a[1]]);
  let q = [[a[0], a[1], 0]];
  while (q.length) {
    const [x, y, d] = q.shift();
    if (x === b[0] && y === b[1]) return d;
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy, k = nx + "," + ny;
      if (free(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny, d + 1]); }
    });
  }
  return Infinity;
}
function perms(a) {
  if (a.length <= 1) return [a];
  let r = [];
  a.forEach((v, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => r.push([v, ...p])));
  return r;
}
// 真实最短步数：枚举宝贝收集顺序取最优
function trueMin(lv) {
  const st = (lv.stars || []).map(s => [s.x, s.y]);
  const S = [lv.start.x, lv.start.y], G = [lv.goal.x, lv.goal.y];
  if (!st.length) return bfs(lv, S, G);
  let best = Infinity;
  perms(st).forEach(o => { let d = 0, c = S; o.forEach(s => { d += bfs(lv, c, s); c = s; }); d += bfs(lv, c, G); best = Math.min(best, d); });
  return best;
}
// 岔路口：可走格里有 ≥3 个可走邻居的格子数
function junctions(lv) {
  const wall = new Set((lv.walls || []).map(w => w.x + "," + w.y));
  const free = (x, y) => x >= 0 && y >= 0 && x < lv.cols && y < lv.rows && !wall.has(x + "," + y);
  let j = 0;
  for (let y = 0; y < lv.rows; y++) for (let x = 0; x < lv.cols; x++) {
    if (!free(x, y)) continue;
    let deg = 0;
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx, dy]) => { if (free(x + dx, y + dy)) deg++; });
    if (deg >= 3) j++;
  }
  return j;
}

const bad = [];
console.log("关 | 尺寸 | 步数 | 岔路 | 宝贝 | 动脑分 | 递进");
console.log("---|------|------|------|------|--------|------");
let prev = 0;
LEVELS.forEach((lv, i) => {
  const n = i + 1;
  const steps = trueMin(lv);
  const j = junctions(lv);
  const stars = (lv.stars || []).length;
  const score = Math.round(stars * 10 + j * 0.5 + steps * 0.3);
  const wall = new Set((lv.walls || []).map(w => w.x + "," + w.y));
  const blocked = p => wall.has(p.x + "," + p.y);
  if (steps === Infinity) bad.push(`第${n}关走不通`);
  if (blocked(lv.start)) bad.push(`第${n}关起点压墙`);
  if (blocked(lv.goal)) bad.push(`第${n}关终点压墙`);
  (lv.stars || []).forEach(s => { if (blocked(s)) bad.push(`第${n}关宝贝压墙`); });
  const grp = i < 4 ? 1 : i < 8 ? 2 : i < 12 ? 3 : 4;
  const newGroup = i % 4 === 0;
  const arrow = newGroup ? "—新组—" : (score >= prev ? "↗" : "↘");
  console.log(
    `第${String(n).padStart(2)} | ${(lv.cols + "×" + lv.rows).padStart(4)} | ${String(steps).padStart(4)} | ${String(j).padStart(4)} | ${String(stars).padStart(4)} | ${String(score).padStart(6)} | 组${grp} ${arrow}`
  );
  prev = score;
});
console.log();
if (bad.length) {
  console.log("⚠ 发现问题：" + bad.join("；"));
  process.exit(1);
} else {
  console.log("✓ 全部 " + LEVELS.length + " 关均可解，起点/终点/宝贝都不压墙");
}
