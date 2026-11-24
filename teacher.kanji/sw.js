/* Service worker: lets the app open offline once it has been loaded. Change CACHE to force an update. */
const CACHE = 'teacher-app-v2';
const FILES = ["./", "assessment-new.html", "assessments.html", "assignments.html", "assistant.html", "attendance.html", "dashboard.html", "developer.html", "exercises.html", "index.html", "learner.html", "learners.html", "lesson-plan-new.html", "marks.html", "materials.html", "more.html", "paper.html", "plan-view.html", "plans.html", "records.html", "register.html", "reminders.html", "reports.html", "scan.html", "schemes.html", "settings.html", "workplan.html", "styles.css", "data.js", "zambia.js", "schemes.js", "files.js", "extra.js", "tools.js", "pages.js", "script.js", "auth.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('dashboard.html'))));
});
