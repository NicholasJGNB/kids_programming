# 贡献指南

感谢你愿意为《小机器人去充电》出一份力！这是一个面向孩子的编程启蒙游戏，
我们尤其欢迎能让它**更有趣、更易懂、更普惠**的改进。

## 行为准则

请保持友善、尊重、有耐心。这是一个教育向的开源项目，目标是帮助孩子爱上编程。

## 怎么参与

### 报告问题 / 提建议
- 在 [Issues](https://github.com/NicholasJGNB/kids_programming/issues) 里新建。
- 是 bug 的话，请附上：**怎么复现**、**期望结果**、**实际结果**、设备和浏览器（如 iPhone Safari / 电脑 Chrome）。
- 是新点子的话，简单说说**为什么对孩子有帮助**。

### 提交代码（Pull Request）
1. Fork 本仓库，从默认分支拉出一个新分支：`git checkout -b feat/我的改进`
2. 做修改（见下方"开发约定"）。
3. 如果改了关卡，**务必跑一遍** `node tools/eval-levels.js` 确认所有关卡仍可解。
4. 提交并推送，发起 Pull Request，说明你改了什么、为什么。

## 本地开发

项目零依赖，不需要构建：

```bash
git clone https://github.com/NicholasJGNB/kids_programming.git
cd kids_programming
python3 -m http.server 8000   # 然后浏览器打开 http://localhost:8000
```

测试 / 关卡校验需要 Node.js：

```bash
node tools/eval-levels.js     # 关卡难度指标 + 可解性校验
npm test                      # 运行测试（见 tests/）
```

## 开发约定

- **保持零依赖、单文件可玩**。这是本项目最重要的原则——不要引入需要构建步骤或运行时依赖的方案。如果某个改进确实需要，请先开 issue 讨论。
- **代码风格**：跟随现有代码——2 空格缩进、`const`/`let`、中文注释解释"为什么"。
- **改关卡** → 必须通过 `node tools/eval-levels.js`（所有关卡可解、无起终点/宝贝压墙）。
- **改循环/执行逻辑** → 跑 `npm test` 确保通过。
- **文案面向孩子**：用词简单、友好、鼓励，避免专业术语。

## 适合新手的方向

- 🗺️ 设计新关卡（注意难度递进，用评估脚本验证）
- 🎨 新增障碍/奖励的 emoji 皮肤
- 🌍 英文翻译 / 国际化（i18n）
- ♿ 无障碍改进（键盘操作、屏幕阅读器）
- 📝 完善文档、修正错别字

谢谢你！🎉
