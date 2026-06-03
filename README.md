# 🤖 小机器人去充电 · 儿童编程启蒙游戏

> 一个零依赖、打开即玩的图形化编程启蒙游戏，为 **6 岁左右**的孩子设计。
> 孩子用方向按钮给小机器人排好一串命令，让它走迷宫、收集宝贝、到电池处充电——
> 在游戏中自然学会**顺序、循环、规划与调试**这些编程核心思维。

<p align="center">
  <a href="https://nicholasjgnb.github.io/kids_programming/"><b>▶ 在线试玩</b></a> ·
  <a href="docs/家长指南.md">家长指南</a> ·
  <a href="microbit-小车教程.md">硬件衔接教程</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a>
</p>

<p align="center">
  <a href="https://github.com/NicholasJGNB/kids_programming/actions"><img alt="CI" src="https://github.com/NicholasJGNB/kids_programming/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-green.svg">
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-brightgreen.svg">
  <img alt="Made for kids" src="https://img.shields.io/badge/made%20for-kids-ff69b4.svg">
  <img alt="中文" src="https://img.shields.io/badge/lang-中文-blue.svg">
</p>

---

## ✨ 特性

- 🎮 **打开即玩**：单个 HTML 文件，零依赖、零安装，双击或访问链接即可，离线也能玩
- 🧩 **真正的编程概念**：顺序、**循环（Scratch 式"圈住"积木）**、调试，循序渐进
- 🗺️ **18 个精心设计的关卡**：难度按"动脑分"（岔路决策 + 宝贝规划）平滑递增，全部经程序验证可解
- 🏗️ **自由搭建模式**：孩子和家长可以自己造关、互相出题，关卡玩不完
- 🎨 **丰富又不杂乱**：障碍/奖励多种皮肤，每关最多 2 种，画面有趣不眼花
- 📱 **全设备适配**：手机竖屏/横屏、平板、电脑自动切换布局
- 🔊 **音效与动画**：走步、撞击、收集、过关撒花，反馈即时
- 🌱 **通向真硬件**：配套 [micro:bit 小车教程](microbit-小车教程.md)，把屏幕上的命令变成真小车的动作

## 🚀 快速开始

### 直接玩
访问在线版本即可：**<https://nicholasjgnb.github.io/kids_programming/>**

### 本地运行
项目是纯静态、零依赖的，有两种方式：

```bash
# 方式 1：直接用浏览器打开（最简单）
#   下载后双击 index.html 即可

# 方式 2：起一个本地服务器（推荐，避免个别浏览器的本地文件限制）
git clone https://github.com/NicholasJGNB/kids_programming.git
cd kids_programming
python3 -m http.server 8000
# 然后浏览器打开 http://localhost:8000
```

> 不需要 Node、不需要构建、不需要安装任何依赖。

## 🎯 玩法一分钟上手

1. 点方向键 **⬆ ⬇ ⬅ ➡** 给机器人排命令，命令会显示在命令条里
2. 想重复动作？点 **🔁 重复** 开一个"圈"，把动作放进去，圈里的动作会重复 N 次
3. 点 **▶ 出发！**，机器人照着命令走向 🔋 电池（路上有宝贝要先捡完）
4. 走错了用 **↩ 撤回** / **🗑 清空** 重来；点 **🗏 选关** 跳关或 **🏗 自己造一关**

详细玩法、教学建议、软硬件成长路线见 **[家长指南](docs/家长指南.md)**。

## 🧱 技术栈

- 纯 **HTML + CSS + 原生 JavaScript**，**零运行时依赖**
- 音效用 **Web Audio API** 实时合成（不含任何音频文件）
- 关卡评估/测试用 **Node.js**（仅开发时需要）

设计取舍：刻意保持"单文件、零依赖、下载即玩"，让任何人——尤其是非技术的家长和老师——都能零门槛使用和分发。

## 📁 项目结构

```
kids_programming/
├── index.html              # 游戏页面（结构）
├── css/
│   └── style.css           # 样式
├── js/                     # 游戏逻辑（按 <script> 顺序加载，共享全局作用域、零依赖）
│   ├── levels.js           #   关卡数据与障碍/奖励皮肤
│   ├── state.js            #   全局状态与 DOM 引用
│   ├── board.js            #   棋盘渲染·选关·机器人定位
│   ├── editor.js           #   自由搭建（造关）模式
│   ├── program.js          #   命令条·循环·运行·特效·音效
│   └── main.js             #   按钮事件绑定与启动
├── tests/                  # 测试
│   ├── levels.test.js      #   关卡可解性
│   ├── loop.test.js        #   循环展开逻辑
│   └── smoke.e2e.js        #   Playwright 端到端冒烟测试
├── tools/
│   └── eval-levels.js      # 关卡难度评估（步数/岔路/宝贝/动脑分 + 可解性）
├── docs/
│   └── 家长指南.md          # 面向家长的玩法说明与成长路线
├── microbit-小车教程.md     # 软件→硬件：micro:bit 小车上手教程
├── .github/                # CI 工作流 + Issue/PR 模板
├── package.json            # 脚本入口（test / eval / serve）
├── CONTRIBUTING.md · CHANGELOG.md · LICENSE
```

## 🧪 关卡评估工具

改了关卡后，可以跑这个脚本检查每一关的难度指标，并自动校验"有没有走不通的坏关"：

```bash
node tools/eval-levels.js
```

它会输出每关的**步数、岔路口数、宝贝数、动脑分**，并验证起点能否到达终点和所有宝贝。

## 🤝 参与贡献

欢迎贡献新关卡、新功能、翻译或 bug 修复！请先阅读 **[CONTRIBUTING.md](CONTRIBUTING.md)**。

适合上手的方向：设计新关卡、新增障碍/奖励皮肤、界面文案润色、英文翻译（i18n）、无障碍改进。

## 📜 许可证

[MIT](LICENSE) © 2026 NicholasJGNB — 可自由使用、修改、分发，包括教学与商业用途。

---

<p align="center">从屏幕上的小机器人，到孩子手里真正会动的小车，一起踏出编程的第一步 🚀</p>
