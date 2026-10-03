/* ═══════════════════════════════════════════════
   서비스 워커: 앱 화면 파일을 휴대폰에 보관해 두는 도우미
   · 인터넷이 되면 → 항상 서버에서 최신 파일을 받아 쓰고, 받은 것을 보관함에 넣어 둔다.
   · 인터넷이 안 되면 → 보관해 둔 파일로 화면을 띄운다.
   · 날씨·미세먼지 API와 글꼴(다른 주소)은 건드리지 않는다. 날씨는 늘 새로 받아야 하니까.
   ═══════════════════════════════════════════════ */
const CACHE = "morning-weather-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// 이름이 바뀐 옛 보관함은 지운다
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())))
  );
});
