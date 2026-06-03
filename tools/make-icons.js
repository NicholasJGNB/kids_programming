/*
 * 生成 PWA 图标（纯 Node，无第三方依赖，用内置 zlib 编码 PNG）。
 * 画一个简单的小机器人头像：蓝色圆角背景 + 机器人脸。
 * 运行：node tools/make-icons.js   → 在 icons/ 生成 192 和 512 两个 PNG
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// —— 极简 PNG 编码（RGBA）——
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 每行前置 1 字节 filter(0)
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// —— 画图工具 ——
function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    // alpha 混合到已有像素上
    const ia = a / 255,
      na = 1 - ia;
    buf[i] = Math.round(r * ia + buf[i] * na);
    buf[i + 1] = Math.round(g * ia + buf[i + 1] * na);
    buf[i + 2] = Math.round(b * ia + buf[i + 2] * na);
    buf[i + 3] = Math.max(buf[i + 3], a);
  };
  const rect = (x0, y0, w, h, r, g, b, a) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, r, g, b, a);
  };
  const roundRect = (x0, y0, w, h, rad, r, g, b, a = 255) => {
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        // 圆角裁剪
        const dx = Math.max(rad - x, x - (w - 1 - rad), 0);
        const dy = Math.max(rad - y, y - (h - 1 - rad), 0);
        if (dx * dx + dy * dy <= rad * rad) set(x0 + x, y0 + y, r, g, b, a);
      }
  };
  const disc = (cx, cy, rad, r, g, b, a = 255) => {
    for (let y = cy - rad; y <= cy + rad; y++)
      for (let x = cx - rad; x <= cx + rad; x++) {
        const dx = x - cx,
          dy = y - cy;
        if (dx * dx + dy * dy <= rad * rad) set(x, y, r, g, b, a);
      }
  };

  const S = size;
  // 背景：蓝色圆角方块（和游戏主色 #5b8def 一致）
  roundRect(0, 0, S, S, Math.round(S * 0.22), 0x5b, 0x8d, 0xef);
  // 机器人天线
  rect(
    Math.round(S * 0.49),
    Math.round(S * 0.16),
    Math.round(S * 0.02),
    Math.round(S * 0.08),
    255,
    255,
    255
  );
  disc(Math.round(S * 0.5), Math.round(S * 0.15), Math.round(S * 0.03), 0xff, 0xd8, 0x6b);
  // 机器人头（白色圆角方块）
  const hx = Math.round(S * 0.24),
    hy = Math.round(S * 0.26),
    hw = Math.round(S * 0.52),
    hh = Math.round(S * 0.44);
  roundRect(hx, hy, hw, hh, Math.round(S * 0.1), 255, 255, 255);
  // 眼睛（蓝色圆点）
  const eyeR = Math.round(S * 0.055);
  disc(Math.round(S * 0.39), Math.round(S * 0.45), eyeR, 0x3f, 0x6f, 0xd1);
  disc(Math.round(S * 0.61), Math.round(S * 0.45), eyeR, 0x3f, 0x6f, 0xd1);
  // 眼睛高光
  disc(Math.round(S * 0.405), Math.round(S * 0.435), Math.round(S * 0.02), 255, 255, 255);
  disc(Math.round(S * 0.625), Math.round(S * 0.435), Math.round(S * 0.02), 255, 255, 255);
  // 嘴巴（橙色小横条）
  rect(
    Math.round(S * 0.42),
    Math.round(S * 0.58),
    Math.round(S * 0.16),
    Math.round(S * 0.03),
    0xff,
    0x9f,
    0x43
  );

  return encodePNG(S, S, buf);
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
[192, 512].forEach((sz) => {
  const png = makeIcon(sz);
  fs.writeFileSync(path.join(outDir, `icon-${sz}.png`), png);
  console.log(`✓ icons/icon-${sz}.png (${png.length} 字节)`);
});
// 苹果触摸图标用 192 那张即可
fs.copyFileSync(path.join(outDir, 'icon-192.png'), path.join(outDir, 'apple-touch-icon.png'));
console.log('✓ icons/apple-touch-icon.png');
