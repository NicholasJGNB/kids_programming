/*
 * 循环逻辑测试：验证 flattenProgram() 把"循环圈"正确展开成实际步骤
 *   循环模型：{ loop: N, body: [...] } 表示把 body 里的动作整组重复 N 次
 * 运行：node tests/loop.test.js
 *
 * 做法：从 js/program.js 中抽取 flattenProgram 的函数源码，在受控作用域里
 * 注入一个可设置的全局 program，逐个用例校验展开结果。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'program.js'), 'utf8');
// flattenProgram 依赖 pushItemSteps（招式展开），两个函数一起抽出来
const pushSrc = src.match(/function pushItemSteps\([\s\S]*?\n\}/)[0];
const flatSrc = src.match(/function flattenProgram\(\)\s*\{[\s\S]*?\n\}/)[0];

// 构造一个工厂：传入 program 和 myMove（招式定义），返回 flattenProgram 的结果
const makeFlatten = new Function(
  'program',
  'myMove',
  `${pushSrc}\n${flatSrc}\n return flattenProgram();`
);
const dirs = (p, myMove = []) =>
  makeFlatten(p, myMove)
    .map((s) => s.dir)
    .join(',');

// —— 用例 ——
// 圈住后面：圈里两个动作重复 2 次
assert.strictEqual(dirs([{ loop: 2, body: ['right', 'up'] }]), 'right,up,right,up');
// 圈前有普通动作
assert.strictEqual(dirs(['up', { loop: 3, body: ['right'] }]), 'up,right,right,right');
// 圈后还有普通动作
assert.strictEqual(dirs([{ loop: 2, body: ['right'] }, 'up']), 'right,right,up');
// 圈前圈后都有
assert.strictEqual(
  dirs(['up', { loop: 2, body: ['right', 'down'] }, 'left']),
  'up,right,down,right,down,left'
);
// 纯方向
assert.strictEqual(dirs(['up', 'right']), 'up,right');
// 空圈不产生步骤
assert.strictEqual(dirs([{ loop: 3, body: [] }]), '');
// 次数为 1 等于不循环
assert.strictEqual(dirs([{ loop: 1, body: ['right', 'up'] }]), 'right,up');

// 招式（自定义积木）展开：调用 {fn:true} 展开成 myMove 定义的动作
assert.strictEqual(dirs([{ fn: true }], ['right', 'up']), 'right,up');
// 招式 + 普通命令混排
assert.strictEqual(dirs(['up', { fn: true }, 'left'], ['right', 'down']), 'up,right,down,left');
// 招式放进循环：循环2次[招式(右上)] = 右上右上
assert.strictEqual(dirs([{ loop: 2, body: [{ fn: true }] }], ['right', 'up']), 'right,up,right,up');

// key 用于运行时高亮，校验格式：圈内 "i-j"，圈外 "i"
const steps = makeFlatten(['up', { loop: 2, body: ['right'] }]);
assert.strictEqual(steps[0].key, '0'); // 第0项普通动作
assert.strictEqual(steps[1].key, '1-0'); // 第1项循环的 body[0]，第1遍
assert.strictEqual(steps[2].key, '1-0'); // 第2遍仍指向同一块

console.log('✓ 循环+招式逻辑测试通过：11 个用例全部正确');
