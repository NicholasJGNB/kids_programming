/*
 * 关卡测试：验证 js/levels.js 里的每一关都可解
 *   - 起点 / 终点 / 宝贝都不压在墙上
 *   - 机器人能从起点走到终点，并能到达所有宝贝
 * 运行：node tests/levels.test.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

// 从 js/levels.js 中取出 LEVELS 数组（该文件是浏览器全局脚本，这里用正则截取）
const src = fs.readFileSync(path.join(__dirname, "..", "js", "levels.js"), "utf8");
const LEVELS = eval(src.match(/const LEVELS = (\[[\s\S]*?\n\]);/)[1]);

function bfs(lv, a, b) {
  const wall = new Set((lv.walls || []).map(w => w.x + "," + w.y));
  const free = (x, y) => x >= 0 && y >= 0 && x < lv.cols && y < lv.rows && !wall.has(x + "," + y);
  const seen = new Set([a[0] + "," + a[1]]);
  let q = [[a[0], a[1]]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === b[0] && y === b[1]) return true;
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy, k = nx + "," + ny;
      if (free(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    });
  }
  return false;
}

let passed = 0;
LEVELS.forEach((lv, i) => {
  const n = i + 1;
  const wall = new Set((lv.walls || []).map(w => w.x + "," + w.y));
  const blocked = p => wall.has(p.x + "," + p.y);

  assert.ok(lv.start && lv.goal, `第${n}关缺少起点或终点`);
  assert.ok(!blocked(lv.start), `第${n}关起点压在墙上`);
  assert.ok(!blocked(lv.goal), `第${n}关终点压在墙上`);
  (lv.stars || []).forEach(s => assert.ok(!blocked(s), `第${n}关有宝贝压在墙上`));

  const S = [lv.start.x, lv.start.y], G = [lv.goal.x, lv.goal.y];
  assert.ok(bfs(lv, S, G), `第${n}关：机器人走不到电池`);
  (lv.stars || []).forEach(s =>
    assert.ok(bfs(lv, S, [s.x, s.y]), `第${n}关：宝贝(${s.x},${s.y})拿不到`)
  );
  passed++;
});

assert.strictEqual(LEVELS.length, 18, "关卡总数应为 18");
console.log(`✓ 关卡测试通过：全部 ${passed} 关可解，起点/终点/宝贝均不压墙`);
