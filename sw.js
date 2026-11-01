// 家計簿ページ用 Service Worker（撤去用キルスイッチ版）
// 以前のSWが古いキャッシュを返し続けて更新が届かなくなる問題が起きたため、
// この版は有効化された時点で全キャッシュを削除し、自分自身を登録解除する。
// 以後の更新はページ側の build-id チェックのみで行う。

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (err) {}
      try {
        await self.registration.unregister();
      } catch (err) {}
      try {
        const wins = await self.clients.matchAll({ type: "window" });
        for (const w of wins) {
          try {
            await w.navigate(w.url);
          } catch (err) {}
        }
      } catch (err) {}
    })()
  );
});

// fetch は一切横取りしない（常にネットワークへ素通し）
