const CACHE_NAME = 'id-registration-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap'
];

// 安裝時，同時快取遠端 CDN 資源 (Tailwind 與 Noto 字型)，確保 100% 離線樣式不跑版
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] 正在快取核心離線資源...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 啟動與清理舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PWA SW] 正在清理舊版快取:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 請求攔截：快取優先
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Firebase 與 Gemini 相關網路請求不作快取攔截
        if (event.request.url.includes('firebase') || event.request.url.includes('googleapis')) {
          return response;
        }
        return response;
      }).catch((err) => {
        console.warn('[PWA SW] 離線且無此資源之快取：', event.request.url);
      });
    })
  );
});