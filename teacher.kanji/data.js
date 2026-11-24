if (!localStorage.getItem('td-user')) location.replace('index.html');
const USER = localStorage.getItem('td-user') || '';
/* Shared data store, calculations and helpers. Loaded first on every page. */
/* ================= Data store (saved in this browser) ================= */
const KEY = 'teacher-dashboard-v1';
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
const band = v => v >= 70 ? 'strong' : v >= 50 ? 'watch' : 'support';
const TYPES = { test: 'Test', exercise: 'Exercise', assignment: 'Assignment' };

function seed() {
  const now = new Date(), y = now.getFullYear(), mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const mk = (name, n) => ({ id: uid(), name, pupils: Array.from({ length: n }, (_, i) => ({ id: uid(), name: 'Pupil ' + String.fromCharCode(65 + i) })) });
  const c1 = mk('Grade 11A Physics', 8), c2 = mk('Grade 12B Mathematics', 6); c1.level = c2.level = 'senior';
  const dates = [new Date(y, 1, 10), new Date(y, 5, 12), new Date(y, 9, 6), mon];
  if (now > mon) dates.push(now);
  const assess = [];
  [c1, c2].forEach((c, ci) => dates.forEach((d, j) => {
    const max = j % 2 ? 20 : 50, scores = {};
    c.pupils.forEach((p, i) => { scores[p.id] = Math.round(max * (0.3 + 0.65 * (((i + 1) * 37 + (j + 1) * 17 + (ci + 1) * 11) % 100) / 100)); });
    assess.push({ id: uid(), classId: c.id, title: ['Test', 'Exercise', 'Assignment'][j % 3] + ' ' + (j + 1), type: ['test', 'exercise', 'assignment'][j % 3], date: iso(d), max, scores });
  }));
  assess.push({ id: uid(), classId: c1.id, title: 'Motion exercise', type: 'exercise', date: iso(now), max: 20, scores: {} });
  return { cur: c1.id, classes: [c1, c2], assess,
    plans: [{ id: uid(), classId: c1.id, title: 'Projectile motion', date: iso(now), objectives: 'Describe the path of a projectile.', activities: 'Demonstration, worked examples, group exercise.', status: 'ready' }], att: {} };
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = d => addDays(d, -((new Date(d).getDay() + 6) % 7));
const X = { views: {}, acts: {}, forms: {}, redir: {}, after: {}, noRender: {}, change() {} }; // hooks used by extra.js and tools.js
function migrate(s) {
  s.settings = Object.assign({ school: '', teacher: USER || '', hod: '', dht: '', reviewDays: 7, classSize: 40, aiUrl: '', aiCode: '' }, s.settings || {});
  ['records', 'iwp', 'schemes', 'reminders'].forEach(k => { if (!s[k]) s[k] = []; });
  s.classes.forEach(c => { c.level = c.level || 'primary'; c.size = c.size || 40; c.pupils.forEach(p => { p.sex = p.sex || ''; p.needs = p.needs || []; }); });
  return s;
}
function load() { try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.classes) return migrate(r); } catch (e) {} return migrate(seed()); }
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function cls() { let c = S.classes.find(x => x.id === S.cur); if (!c && S.classes.length) { c = S.classes[0]; S.cur = c.id; } return c; }

/* ================= Calculations ================= */
const assAvg = a => { const v = Object.values(a.scores).map(s => s / a.max * 100); return v.length ? avg(v) : null; };
const periodAvg = list => { const v = list.map(assAvg).filter(x => x != null); return v.length ? Math.round(avg(v)) : null; };
function weekly(as) {
  const now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return { labels, vals: labels.map((_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return periodAvg(as.filter(a => a.date === iso(d))); }) };
}
function termly(as) {
  const y = new Date().getFullYear();
  return { labels: ['Term 1', 'Term 2', 'Term 3'], vals: [0, 1, 2].map(t => periodAvg(as.filter(a => { const d = new Date(a.date + 'T00:00'); return d.getFullYear() === y && Math.floor(d.getMonth() / 4) === t; }))) };
}
function pupilStats(c) {
  const as = S.assess.filter(a => a.classId === c.id);
  const rows = c.pupils.map(p => { const v = as.filter(a => a.scores[p.id] != null).map(a => a.scores[p.id] / a.max * 100); return { p, v: v.length ? avg(v) : null }; }).filter(r => r.v != null);
  if (!rows.length) return null;
  rows.sort((a, b) => b.v - a.v);
  return { top: rows[0], low: rows[rows.length - 1], mean: Math.round(avg(rows.map(r => r.v))), n: rows.length, rows };
}

/* ================= View helpers ================= */
const pill = (v, c) => `<span class="pill ${c || band(v)}">${typeof v === 'number' ? Math.round(v) + '%' : v}</span>`;
const item = (href, t, sub, right) => `<${href ? 'a href="' + href + '"' : 'div'} class="item"><span><b>${t}</b><small>${sub}</small></span>${right}</${href ? 'a' : 'div'}>`;
function head(title) {
  const opts = S.classes.map(c => `<option value="${c.id}"${c.id === S.cur ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  return `<header class="top"><div><p class="muted">${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>${title}</h1></div>${S.classes.length ? `<select id="classSelect" aria-label="Choose class">${opts}</select>` : ''}</header>`;
}
const noClass = () => `<div class="card stack"><p>Add your first class to get started.</p><a class="btn btn-solid" href="learners.html">Add a class</a></div>`;
function chart(labels, vals) {
  const n = labels.length, slot = 330 / n, bw = Math.min(56, slot * 0.6);
  let s = `<svg viewBox="0 0 330 130" role="img" aria-label="Bar chart of class performance"><line x1="0" y1="100" x2="330" y2="100" stroke="#D5DBD6"/>`;
  vals.forEach((v, i) => {
    const x = slot * i + (slot - bw) / 2, cx = x + bw / 2;
    if (v == null) s += `<text x="${cx}" y="95">–</text>`;
    else { const h = Math.round(v * 0.9); s += `<rect class="bar ${band(v)}" x="${x}" y="${100 - h}" width="${bw}" height="${h}" rx="4"/><text class="val" x="${cx}" y="${95 - h}">${v}%</text>`; }
    s += `<text x="${cx}" y="118">${labels[i]}</text>`;
  });
  return s + '</svg>';
}


function attCount(c, pid) {
  let pr = 0, ab = 0;
  Object.keys(S.att).filter(k => k.startsWith(c.id + '|')).forEach(k => { const rec = S.att[k]; (pid ? [rec[pid]] : Object.values(rec)).forEach(v => { if (v === 'P') pr++; if (v === 'A') ab++; }); });
  return { pr, ab };
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
