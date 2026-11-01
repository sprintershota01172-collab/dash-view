// 家計簿ページ用 Service Worker
// 方針：開いたときは前回のキャッシュを即座に返し、裏で最新版を取りに行く。
// 新しい版（build-id が変化）が届いたらページへ通知し、ページ側が一度だけ再読み込みして切り替える。
// オフライン時はキャッシュがそのまま表示される。

const CACHE = "kakeibo-page-v1";
const SCOPE_URL = new URL("space-2.html", self.registration.scope).href;

function buildIdOf(text) {
  const m = text.match(/<meta\s+name="build-id"\s+content="([^"]+)"/);
  return m ? m[1] : null;
}

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.mode !== "navigate" || !url.pathname.endsWith("/space-2.html")) {
    return; // ページ本体の表示リクエストだけ扱う（チェック用fetch等は素通し）
  }
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(SCOPE_URL);

      const fetchFresh = async () => {
        const res = await fetch(SCOPE_URL + "?sw=" + Date.now(), { cache: "no-store" });
        if (!res.ok) return null;
        const freshText = await res.clone().text();
        await cache.put(SCOPE_URL, res.clone());
        if (cached) {
          const cachedText = await cached.clone().text();
          if (buildIdOf(freshText) !== buildIdOf(cachedText)) {
            const wins = await self.clients.matchAll({ type: "window" });
            wins.forEach((w) => w.postMessage("update-available"));
          }
        }
        return res;
      };

      if (cached) {
        e.waitUntil(fetchFresh().catch(() => {}));
        return cached;
      }
      const fresh = await fetchFresh();
      if (fresh) return fresh;
      throw new Error("offline and no cache");
    })()
  );
});
