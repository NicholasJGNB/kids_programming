/*
 * Service Worker：把游戏文件缓存下来，实现"离线也能玩"。
 * 策略：网络优先（network-first）——联网时总是拿最新的文件，顺手更新缓存；
 *       断网时才用上次缓存的版本。这样游戏更新后用户能立刻看到，又保留离线可玩。
 *
 * 改了游戏文件后，把下面的 CACHE 版本号 +1（联网用户会自动拿到新版）。
 */
const CACHE = 'robot-game-v5';

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

// 请求：网络优先。联网就拿最新的并更新缓存；失败（断网）才回退到缓存。
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return; // 只管自己的文件
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() =>
        // 断网：用缓存；连缓存都没有就兜底给首页
        caches.match(e.request).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
