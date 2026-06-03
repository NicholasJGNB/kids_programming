/*
 * 端到端冒烟测试：用 Playwright 真实启动浏览器加载游戏，确认拆分后的
 * HTML/CSS/JS 能正常协同工作、无控制台报错、核心交互可用。
 *
 * 运行：node tests/smoke.e2e.js
 * 需要：npm i -D playwright，且已安装浏览器（npx playwright install chromium）
 */
"use strict";
const { spawn } = require("child_process");
const path = require("path");

(async () => {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.log("⚠ 跳过 e2e：未安装 playwright（npm i -D playwright）");
    process.exit(0);
  }

  const root = path.join(__dirname, "..");
  const port = 8131;
  const srv = spawn("python3", ["-m", "http.server", String(port)], { cwd: root });
  await new Promise(r => setTimeout(r, 1000));

  let browser, ok = false, errors = [];
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));

    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);

    const cells = await page.locator("#board .cell").count();
    const robot = await page.locator("#robot").count();
    await page.locator("#btnRight").click();
    await page.locator("#btnUp").click();
    const chips = await page.locator("#program .chip").count();
    await page.locator("#btnLoop").click();
    const loopChip = await page.locator("#program .loop-chip").count();
    await page.locator("#levelToggle").click();
    const levelBtns = await page.locator("#levelSelect .level-btn").count();

    console.log(`地图格子=${cells} 机器人=${robot} 命令=${chips} 循环块=${loopChip} 选关按钮=${levelBtns}`);
    console.log("控制台错误:", errors.length ? errors.slice(0, 5) : "无");

    ok = errors.length === 0 && cells === 16 && robot === 1 &&
         chips === 2 && loopChip === 1 && levelBtns === 18;
  } finally {
    if (browser) await browser.close();
    srv.kill();
  }

  console.log(ok ? "✓ 端到端冒烟测试通过" : "✗ 端到端冒烟测试失败");
  process.exit(ok ? 0 : 1);
})();
