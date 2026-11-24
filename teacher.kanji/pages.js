/* Logic for every page except Home. Needs data.js loaded first. */
/* ================= Views ================= */
let perfView = 'weekly';



function vMarks(id) {
  if (!id) return vMarkPick();
  const a = S.assess.find(x => x.id === id), c = a && S.classes.find(x => x.id === a.classId);
  if (!a || !c) return head('Marks') + '<p class="muted">Assessment not found.</p><a class="btn btn-outline" href="assessments.html">Back</a>';
  return `<header class="top"><div><p class="muted">${esc(c.name)} · out of ${a.max}</p><h1>${esc(a.title)}</h1></div></header>
  ${c.pupils.length ? `<form class="stack" data-form="marks" data-id="${a.id}">${c.pupils.map(p => `<label class="item"><b>${esc(p.name)}</b><input class="mark" type="number" name="${p.id}" min="0" max="${a.max}" step="any" inputmode="decimal" value="${a.scores[p.id] ?? ''}"></label>`).join('')}
  <button class="btn btn-solid">Save marks</button><a class="btn btn-outline" href="assessments.html">Back</a></form>` : '<div class="card stack"><p>This class has no pupils yet.</p><a class="btn btn-solid" href="learners.html">Add pupils</a></div>'}`;
}

let attDate = iso(new Date()), attKey = null, attDraft = {};
function vAttendance() {
  const c = cls(); if (!c) return head('Attendance') + noClass();
  const key = c.id + '|' + attDate;
  if (attKey !== key) { attKey = key; attDraft = { ...(S.att[key] || {}) }; }
  const vals = Object.values(attDraft);
  return head('Attendance') + `
  <section class="card form"><label>Date<input type="date" id="attDate" value="${attDate}"></label></section>
  ${c.pupils.length ? `<section class="stack">${c.pupils.map(p => `<div class="item"><b>${esc(p.name)}</b><div class="seg">
    <button class="p" data-act="mark" data-p="${p.id}" data-v="P" aria-pressed="${attDraft[p.id] === 'P'}">Present</button>
    <button class="a" data-act="mark" data-p="${p.id}" data-v="A" aria-pressed="${attDraft[p.id] === 'A'}">Absent</button></div></div>`).join('')}</section>
  <p class="muted">${vals.filter(v => v === 'P').length} present · ${vals.filter(v => v === 'A').length} absent · ${c.pupils.length - vals.length} not marked</p>
  <div class="btns"><button class="btn btn-outline" data-act="allPresent">Mark all present</button><button class="btn btn-solid" data-act="attSave">Save attendance</button></div>`
  : '<div class="card stack"><p>This class has no pupils yet.</p><a class="btn btn-solid" href="learners.html">Add pupils</a></div>'}`;
}

function vLearners() {
  const c = cls();
  let out = head('Learners') + `<a class="btn btn-outline" href="attendance.html">Take attendance</a>
  <section class="card"><h2>Add a class</h2><form class="form" data-form="class"><label>Class name<input name="name" placeholder="e.g. Grade 10C Physics" required></label><button class="btn btn-solid">Add class</button></form></section>`;
  if (c) {
    const as = S.assess.filter(a => a.classId === c.id);
    out += `<section class="card"><h2>Add pupils to ${esc(c.name)}</h2><form class="form" data-form="pupils"><label>Pupil names (one per line)<textarea name="names" rows="4" required></textarea></label><button class="btn btn-solid">Add pupils</button></form></section>
    <section><h2>Pupils (${c.pupils.length})</h2><div class="stack">${c.pupils.map(p => { const v = as.filter(a => a.scores[p.id] != null).map(a => a.scores[p.id] / a.max * 100);
      return `<div class="item"><span><a href="learner.html?id=${p.id}" style="color:inherit"><b>${esc(p.name)}</b></a><small>${v.length ? 'Average over ' + v.length + ' assessments' : 'No marks yet'}</small></span><span class="btns">${v.length ? pill(avg(v)) : ''}<button class="btn btn-danger btn-sm" data-act="pupDel" data-id="${p.id}">Remove</button></span></div>`; }).join('') || '<p class="muted">No pupils yet.</p>'}</div></section>
    <button class="btn btn-danger" data-act="clsDel">Delete this class</button>`;
  }
  return out + `<button class="btn btn-outline" data-act="logout">Log out</button><button class="btn btn-outline" data-act="reset">Reset to sample data</button><button class="btn btn-danger" data-act="clear">Clear everything</button>`;
}


function lineChart(labels, vals) {
  const n = vals.length, step = n > 1 ? 290 / (n - 1) : 0, X = i => 20 + step * i, Y = v => 100 - v * 0.9;
  let s = `<svg viewBox="0 0 330 130" role="img" aria-label="Line chart of results over time"><line x1="0" y1="100" x2="330" y2="100" stroke="#D5DBD6"/><line x1="0" y1="${Y(50)}" x2="330" y2="${Y(50)}" stroke="#D5DBD6" stroke-dasharray="4 4"/>`;
  s += `<polyline fill="none" stroke="#0F766E" stroke-width="2.5" points="${vals.map((v, i) => X(i) + ',' + Y(v)).join(' ')}"/>`;
  vals.forEach((v, i) => { s += `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="#0F766E"/>`; if (n <= 8) s += `<text class="val" x="${X(i)}" y="${Y(v) - 9}">${Math.round(v)}%</text><text x="${X(i)}" y="118">${esc(labels[i])}</text>`; });
  return s + '</svg>';
}
function vLearner(id) {
  let c, p; S.classes.forEach(k => { const f = k.pupils.find(x => x.id === id); if (f) { c = k; p = f; } });
  if (!p) return head('Learner') + '<p class="muted">Learner not found.</p><a class="btn btn-outline" href="learners.html">Back</a>';
  const rs = S.assess.filter(a => a.classId === c.id && a.scores[p.id] != null).sort((a, b) => a.date.localeCompare(b.date));
  const vals = rs.map(a => a.scores[p.id] / a.max * 100), mean = vals.length ? avg(vals) : null;
  const st = pupilStats(c), rank = st ? st.rows.findIndex(r => r.p.id === p.id) + 1 : 0, at = attCount(c, p.id);
  return `<header class="top"><div><p class="muted">${esc(c.name)}</p><h1>${esc(p.name)}</h1></div></header>
  <section class="stack">${item('', 'Average', rs.length + ' assessments', mean == null ? '' : pill(mean))}
  ${item('', 'Class position', rank ? 'out of ' + st.n + ' pupils' : 'No marks yet', rank ? `<span class="count">${rank}</span>` : '')}
  ${item('', 'Attendance', at.pr + at.ab ? at.pr + ' present, ' + at.ab + ' absent' : 'Not recorded', at.pr + at.ab ? pill(at.pr / (at.pr + at.ab) * 100) : '')}</section>
  <section class="card"><h2>Progress</h2>${vals.length ? multiLine(rs.map(a => a.date.slice(5)), [{ name: p.name, color: '#0F766E', vals }, { name: 'Class average', color: '#B45309', vals: rs.map(a => Math.round(assAvg(a))) }]) : '<p class="muted">Enter marks to see progress.</p>'}</section>
  <section><h2>Results</h2><div class="stack">${rs.slice().reverse().map(a => item('', esc(a.title), TYPES[a.type] + ' · ' + a.date, `<span>${a.scores[p.id]}/${a.max} ${pill(a.scores[p.id] / a.max * 100)}</span>`)).join('') || '<p class="muted">No results yet.</p>'}</div></section>
  <a class="btn btn-outline" href="learners.html">Back to learners</a>`;
}
function vReports() {
  const c = cls(); if (!c) return head('Reports') + noClass();
  const as = S.assess.filter(a => a.classId === c.id).sort((a, b) => a.date.localeCompare(b.date));
  const marked = as.filter(a => assAvg(a) != null).slice(-8), st = pupilStats(c), t = termly(as), at = attCount(c);
  const cnt = b => st ? st.rows.filter(r => band(r.v) === b).length : 0;
  return head('Reports') + `
  <section class="stack">${item('', 'Class average', st ? st.n + ' pupils with marks' : 'No marks yet', st ? pill(st.mean) : '')}
  ${item('', 'Attendance rate', at.pr + at.ab ? at.pr + ' present, ' + at.ab + ' absent' : 'Not recorded', at.pr + at.ab ? pill(at.pr / (at.pr + at.ab) * 100) : '')}
  ${item('', 'Pupils by band', 'Strong, Watch, Support', `<span class="btns"><span class="pill strong">${cnt('strong')}</span><span class="pill watch">${cnt('watch')}</span><span class="pill support">${cnt('support')}</span></span>`)}</section>
  <section class="card"><h2>Results by assessment</h2><p class="muted">Class average % for the last ${marked.length} marked assessments</p>${marked.length ? chart(marked.map(a => a.date.slice(5)), marked.map(a => Math.round(assAvg(a)))) : '<p class="muted">No marked assessments yet.</p>'}</section>
  <section class="card"><h2>Termly performance</h2>${chart(t.labels, t.vals)}</section>
  <section><h2>Pupil ranking</h2><div class="stack">${st ? st.rows.map((r, i) => item('learner.html?id=' + r.p.id, (i + 1) + '. ' + esc(r.p.name), 'View progress', pill(r.v))).join('') : '<p class="muted">Enter marks to see the ranking.</p>'}</div></section>
  <button class="btn btn-outline" data-act="print">Print report</button>`;
}


const planCard = p => `
  <div class="item col"><div class="row"><span><b>${esc(p.title)}</b><small>${p.date}</small></span>${pill(p.status === 'ready' ? 'Ready' : 'Draft', p.status)}</div>
  ${p.objectives ? `<small><b>Objectives:</b> ${esc(p.objectives)}</small>` : ''}${p.activities ? `<small><b>Activities:</b> ${esc(p.activities)}</small>` : ''}
  <div class="btns"><a class="btn btn-solid btn-sm" href="plan-view.html?id=${p.id}">View / print</a><a class="btn btn-outline btn-sm" href="lesson-plan-new.html?id=${p.id}">Edit</a><button class="btn btn-outline btn-sm" data-act="planToggle" data-id="${p.id}">Mark as ${p.status === 'ready' ? 'draft' : 'ready'}</button><button class="btn btn-danger btn-sm" data-act="planDel" data-id="${p.id}">Delete</button></div></div>`;
function vPlans() {
  const c = cls(); if (!c) return head('Lesson plans') + noClass();
  const list = S.plans.filter(p => p.classId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  return head('Lesson plans') + `<a class="btn btn-solid" href="lesson-plan-new.html">New lesson plan</a>
  <section><h2>Your lesson plans</h2><div class="stack">${list.map(planCard).join('') || '<p class="muted">No lesson plans yet.</p>'}</div></section>`;
}
function vPlanNew() {
  if (!cls()) return head('New lesson plan') + noClass();
  return head('New lesson plan') + `<section class="card"><form class="form" data-form="plan">
    <label>Topic<input name="title" required></label>
    <label>Date<input type="date" name="date" value="${iso(new Date())}" required></label>
    <label>Objectives<textarea name="objectives" rows="3"></textarea></label>
    <label>Activities<textarea name="activities" rows="3"></textarea></label>
    <label>Status<select name="status"><option value="draft">Draft</option><option value="ready">Ready</option></select></label>
    <button class="btn btn-solid">Save lesson plan</button></form></section><a class="btn btn-outline" href="plans.html">Back to lesson plans</a>`;
}
function vAssessList(type, title) {
  const c = cls(); if (!c) return head(title) + noClass();
  const list = S.assess.filter(a => a.classId === c.id && (!type || a.type === type)).sort((a, b) => b.date.localeCompare(a.date));
  return head(title) + `<a class="btn btn-solid" href="assessment-new.html${type ? '?type=' + type : ''}">Create ${type ? TYPES[type].toLowerCase() : 'assessment'}</a>
  <section><div class="stack">${list.map(a => { const m = assAvg(a); return `
    <div class="item col"><div class="row"><span><b>${esc(a.title)}</b><small>${TYPES[a.type]} · ${a.date} · out of ${a.max}</small></span>${m == null ? '<span class="muted">No marks yet</span>' : pill(m)}</div>
    <div class="btns"><a class="btn btn-solid btn-sm" href="marks.html?id=${a.id}">Enter marks</a>${a.questions ? `<a class="btn btn-outline btn-sm" href="paper.html?id=${a.id}">Print paper</a>` : ''}<button class="btn btn-danger btn-sm" data-act="assDel" data-id="${a.id}">Delete</button></div></div>`; }).join('') || '<p class="muted">Nothing here yet.</p>'}</div></section>`;
}
function vAssessNew() {
  if (!cls()) return head('Create assessment') + noClass();
  const t = new URLSearchParams(location.search).get('type') || 'test';
  return head('Create assessment') + `<section class="card"><form class="form" data-form="assess">
    <label>Title<input name="title" required></label>
    <label>Type<select name="type">${Object.keys(TYPES).map(k => `<option value="${k}"${k === t ? ' selected' : ''}>${TYPES[k]}</option>`).join('')}</select></label>
    <label>Date<input type="date" name="date" value="${iso(new Date())}" required></label>
    <label>Total marks<input type="number" name="max" min="1" value="100" required></label>
    <button class="btn btn-solid">Create assessment</button></form></section><a class="btn btn-outline" href="assessments.html">Back to assessments</a>`;
}
function vMarkPick() {
  const c = cls(); if (!c) return head('Enter marks') + noClass();
  const list = S.assess.filter(a => a.classId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  return head('Enter marks') + `<p class="muted">Choose an assessment to enter marks for.</p><div class="stack">${list.map(a => item('marks.html?id=' + a.id, esc(a.title), TYPES[a.type] + ' · ' + a.date + ' · out of ' + a.max, assAvg(a) == null ? '<span class="muted">No marks yet</span>' : pill(assAvg(a)))).join('') || '<p class="muted">No assessments yet.</p>'}</div><a class="btn btn-outline" href="assessment-new.html">Create assessment</a>`;
}

/* ================= Routing and rendering ================= */
function render(keep) {
  const y = scrollY, r = document.body.dataset.page, id = new URLSearchParams(location.search).get('id');
  const views = { plans: vPlans, 'plan-new': vPlanNew, assessments: () => vAssessList('', 'Assessments'), exercises: () => vAssessList('exercise', 'Exercises'), assignments: () => vAssessList('assignment', 'Assignments'), 'assessment-new': vAssessNew, marks: () => vMarks(id), attendance: vAttendance, learners: vLearners, learner: () => vLearner(id), reports: vReports };
  const all = { ...views, ...X.views }; $('#app').innerHTML = (all[r] || vReports)(id); if (X.after[r]) X.after[r]();
  const active = { 'plan-new': 'plans', 'plan-view': 'plans', assessments: 'assess', exercises: 'assess', assignments: 'assess', 'assessment-new': 'assess', marks: 'assess', paper: 'assess', attendance: 'learners', learner: 'learners' }[r] || (['reports', 'register', 'records', 'workplan', 'schemes', 'materials', 'scan', 'assistant', 'reminders', 'settings', 'developer'].includes(r) ? 'more' : r);
  document.querySelectorAll('.nav a').forEach(l => l.setAttribute('aria-current', l.dataset.r === active ? 'page' : 'false'));
  scrollTo(0, keep ? y : 0);
}
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1800); }
const done = (msg, keep = true) => { save(); if (msg) toast(msg); render(keep); };

/* ================= Events ================= */
const forms = {
  plan(f) { S.plans.push({ id: uid(), classId: cls().id, title: f.title.value.trim(), date: f.date.value, objectives: f.objectives.value.trim(), activities: f.activities.value.trim(), status: f.status.value }); },
  assess(f) { S.assess.push({ id: uid(), classId: cls().id, title: f.title.value.trim(), type: f.type.value, date: f.date.value, max: Math.max(1, Number(f.max.value) || 100), scores: {} }); },
  class(f) { const c = { id: uid(), name: f.name.value.trim(), pupils: [] }; S.classes.push(c); S.cur = c.id; },
  pupils(f) { f.names.value.split('\n').map(s => s.trim()).filter(Boolean).forEach(n => cls().pupils.push({ id: uid(), name: n })); },
  marks(f) {
    const a = S.assess.find(x => x.id === f.dataset.id); a.scores = {};
    f.querySelectorAll('input').forEach(i => { const v = parseFloat(i.value); if (i.value !== '' && isFinite(v)) a.scores[i.name] = Math.min(a.max, Math.max(0, v)); });
    
  }
};
document.addEventListener('submit', e => { e.preventDefault(); const f = e.target, k = f.dataset.form, h = forms[k] || X.forms[k]; if (h) { h(f); save(); if (X.noRender[k]) return; const g = { plan: 'plans.html', assess: 'assessments.html', marks: 'assessments.html' }[k] || X.redir[k], go = typeof g === 'function' ? g(f) : g; if (go) location.href = go; else { toast('Saved'); render(true); } } });

const acts = {
  logout: () => { localStorage.removeItem('td-user'); location.href = 'index.html'; },
  print: () => window.print(),
  tab: d => { perfView = d.v; render(true); },
  planToggle: d => { const p = S.plans.find(x => x.id === d.id); p.status = p.status === 'ready' ? 'draft' : 'ready'; done(); },
  planDel: d => { if (confirm('Delete this lesson plan?')) { S.plans = S.plans.filter(x => x.id !== d.id); done('Deleted'); } },
  assDel: d => { if (confirm('Delete this assessment and its marks?')) { S.assess = S.assess.filter(x => x.id !== d.id); done('Deleted'); } },
  pupDel: d => { if (confirm('Remove this pupil and their marks?')) { const c = cls(); c.pupils = c.pupils.filter(x => x.id !== d.id); S.assess.forEach(a => delete a.scores[d.id]); done('Removed'); } },
  clsDel: () => { const c = cls(); if (confirm('Delete ' + c.name + ' with all its pupils, marks and plans?')) { S.classes = S.classes.filter(x => x.id !== c.id); S.assess = S.assess.filter(a => a.classId !== c.id); S.plans = S.plans.filter(p => p.classId !== c.id); S.cur = S.classes[0] ? S.classes[0].id : null; done('Class deleted'); } },
  mark: d => { attDraft[d.p] = d.v; render(true); },
  allPresent: () => { cls().pupils.forEach(p => { attDraft[p.id] = 'P'; }); render(true); },
  attSave: () => { S.att[attKey] = { ...attDraft }; done('Attendance saved'); },
  reset: () => { if (confirm('Replace everything with the sample data?')) { S = migrate(seed()); attKey = null; done('Sample data restored', false); } },
  clear: () => { if (confirm('Delete all classes, pupils, marks and plans?')) { S = migrate({ cur: null, classes: [], assess: [], plans: [], att: {} }); attKey = null; done('All data cleared', false); } }
};
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'), fn = b && (acts[b.dataset.act] || X.acts[b.dataset.act]); if (fn) fn(b.dataset, b); });
document.addEventListener('change', e => {
  if (e.target.id === 'classSelect') { S.cur = e.target.value; save(); render(true); }
  if (e.target.id === 'attDate' && e.target.value) { attDate = e.target.value; render(true); }
  if (e.target.dataset.qs && e.target.value) { const u = new URLSearchParams(location.search); u.set(e.target.dataset.qs, e.target.value); location.search = u.toString(); }
  X.change(e);
});
render();
