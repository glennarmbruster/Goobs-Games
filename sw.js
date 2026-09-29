/* Goobs-Games service worker: keeps the menu and every game on the phone for offline play.
   Each part has its own version and its own cache. To publish an update, bump ONLY the
   version of the part that changed; unchanged parts are not downloaded again. */
const VERSIONS = {
  shell: '2.38.0',     // menu, manifest, icons, /shared (ads, themes, storage)
  zoodoku: '1.8.1',
  woodpile: '1.1.2',
  patchwork: '2.1.1',
  cubecorral: '3.2.2',
  screwball: '2.3.1',
  skeehop: '1.1.0',
  merge: '1.1.2',
  tapaway: '1.1.0',
  homerun: '1.4.0',
  match3: '1.0.2',
  snake: '1.0.0',
  solitaire: '1.0.0',
  meanbirds: '1.0.2',
  aliens: '1.0.0',
  worddice: '1.0.0',
  digger: '1.0.1',
  blocks: '1.0.0',
  maze: '1.0.0',
  mahjong: '1.1.0',
  dice: '1.0.0',
  daily: '1.0.4',
  mines: '1.0.1',
  bubbles: '1.0.0',
  bricks: '1.0.0',
  topple: '1.3.0',
  barrage: '1.1.0',
  siege: '1.0.0',
  hoops: '1.0.0',
  beacon: '0.3.0',
  sort: '1.0.0',
  triple: '1.0.0',
  pinball: '1.1.0',
  parking: '1.0.0',
  minigolf: '1.0.0',
  board: '1.0.0',
  three: '0.186.1',  // shared 3D library; bump only when three.js itself changes
  planck: '1.5.0',   // shared 2D physics library (planck.js); bump only when planck itself changes
  cannon: '0.20.0'   // shared 3D physics library (cannon-es) for Number Nook's Chain Cube
};
const GROUPS = {
  shell: [
    './', 'index.html', 'manifest.json',
    'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
    'shared/goobs.js', 'shared/goobs.css', 'shared/ads.js', 'shared/animals.svg'
  ],
  zoodoku: ['games/zoodoku/', 'games/zoodoku/index.html'],
  woodpile: ['games/woodpile/', 'games/woodpile/index.html'],
  patchwork: ['games/patchwork/', 'games/patchwork/index.html'],
  cubecorral: ['games/cubecorral/', 'games/cubecorral/index.html'],
  screwball: ['games/screwball/', 'games/screwball/index.html'],
  skeehop: ['games/skeehop/', 'games/skeehop/index.html'],
  merge: ['games/merge/', 'games/merge/index.html'],
  tapaway: ['games/tapaway/', 'games/tapaway/index.html'],
  homerun: ['games/homerun/', 'games/homerun/index.html'],
  match3: ['games/match3/', 'games/match3/index.html'],
  snake: ['games/snake/', 'games/snake/index.html'],
  solitaire: ['games/solitaire/', 'games/solitaire/index.html'],
  meanbirds: ['games/meanbirds/', 'games/meanbirds/index.html'],
  aliens: ['games/aliens/', 'games/aliens/index.html'],
  worddice: ['games/worddice/', 'games/worddice/index.html', 'games/worddice/words.txt'],
  digger: ['games/digger/', 'games/digger/index.html'],
  blocks: ['games/blocks/', 'games/blocks/index.html'],
  maze: ['games/maze/', 'games/maze/index.html'],
  mahjong: ['games/mahjong/', 'games/mahjong/index.html'],
  dice: ['games/dice/', 'games/dice/index.html'],
  daily: ['games/daily/', 'games/daily/index.html'],
  mines: ['games/mines/', 'games/mines/index.html'],
  bubbles: ['games/bubbles/', 'games/bubbles/index.html'],
  bricks: ['games/bricks/', 'games/bricks/index.html'],
  topple: ['games/topple/', 'games/topple/index.html'],
  barrage: ['games/barrage/', 'games/barrage/index.html'],
  siege: ['games/siege/', 'games/siege/index.html'],
  hoops: ['games/hoops/', 'games/hoops/index.html'],
  beacon: ['games/beacon/', 'games/beacon/index.html'],
  sort: ['games/sort/', 'games/sort/index.html'],
  triple: ['games/triple/', 'games/triple/index.html'],
  pinball: ['games/pinball/', 'games/pinball/index.html'],
  parking: ['games/parking/', 'games/parking/index.html'],
  minigolf: ['games/minigolf/', 'games/minigolf/index.html'],
  board: ['games/board/', 'games/board/index.html'],
  three: ['shared/three.module.min.js'],
  planck: ['shared/planck.min.js'],
  cannon: ['shared/cannon-es.min.js']
};
const PREFIX = 'goobs-';
const cacheName = (g) => PREFIX + g + '-' + VERSIONS[g];
const CURRENT = Object.keys(GROUPS).map(cacheName);

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all(Object.keys(GROUPS).map(async (g) => {
    const cache = await caches.open(cacheName(g));
    const missing = [];
    for (const url of GROUPS[g]) if (!(await cache.match(url))) missing.push(url);
    // Fetch each file fresh: cache: 'reload' skips the phone's HTTP cache, and the ?v= query skips GitHub's web cache,
    // which can hand out the old copy of a file for a few minutes after an upload (that once left a phone with a new
    // menu and an old goobs.js stored together). Stored under the plain address. Any failure = try again next time.
    if (missing.length) await Promise.all(missing.map(async (u) => {
      const res = await fetch(new Request(u + (u.indexOf('?') < 0 ? '?' : '&') + 'v=' + VERSIONS[g] + '-' + Date.now(), { cache: 'reload' }));
      if (!res.ok) throw new Error('fetch ' + u + ' ' + res.status);
      await cache.put(u, res);
    }));
  })));
  // no skipWaiting: the page shows "Update available" and the player chooses when to reload
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && !CURRENT.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'VERSION' && event.source) event.source.postMessage({ versions: VERSIONS });
});

async function fromCache(req) {
  for (const name of CURRENT) {
    const cache = await caches.open(name);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
  }
  return null;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    let hit = await fromCache(req);
    if (!hit && url.pathname.endsWith('/')) hit = await fromCache(new Request(url.href + 'index.html'));
    if (hit) return hit;
    try {
      return await fetch(req);
    } catch (e) {
      if (req.mode === 'navigate') {
        const home = await fromCache(new Request(new URL('./index.html', self.registration.scope).href));
        if (home) return home;
      }
      throw e;
    }
  })());
});
