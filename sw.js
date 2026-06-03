/*
 * Service Worker：把游戏文件缓存下来，实现"离线也能玩"。
 * 策略：安装时预缓存所有静态资源；请求时优先用缓存（cache-first）。
 *
 * 改了游戏文件后，把下面的 CACHE 版本号 +1，用户下次联网打开就会拿到新版。
 */
const CACHE = 'robot-game-v2';

const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/i18n.js',
  './js/levels.js',
  './js/state.js',
  './js/board.js',
  './js/editor.js',
  './js/program.js',
  './js/main.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

// 安装：预缓存所有资源
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// 激活：清掉旧版本缓存
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// 请求：缓存优先，命中就用缓存，没命中再走网络（并顺手存起来）
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          // 只缓存同源的成功响应
          if (res.ok && new URL(e.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html')); // 离线兜底
    })
  );
});
