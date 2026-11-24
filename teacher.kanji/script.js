/* Home page. Needs data.js loaded first. */
const state = { view: 'weekly' };

function renderWork(c) {
  const as = S.assess.filter(a => a.classId === c.id), pl = S.plans.filter(p => p.classId === c.id);
  const ex = as.filter(a => a.type === 'exercise'), asg = as.filter(a => a.type === 'assignment');
  const waiting = l => l.filter(a => !Object.keys(a.scores).length).length;
  const at = S.att[c.id + '|' + iso(new Date())];
  $('#work').innerHTML =
    item('plans.html', 'Lesson plans', pl.filter(p => p.status === 'ready').length + ' ready, ' + pl.filter(p => p.status === 'draft').length + ' drafts', `<span class="count">${pl.length}</span>`) +
    item('exercises.html', 'Exercises', waiting(ex) + ' waiting for marks', `<span class="count">${ex.length}</span>`) +
    item('assignments.html', 'Assignments', waiting(asg) + ' waiting for marks', `<span class="count">${asg.length}</span>`) +
    item('attendance.html', 'Attendance', at ? Object.values(at).filter(v => v === 'P').length + ' of ' + c.pupils.length + ' present today' : 'Not taken yet today', '');
}
function renderChart(c) {
  const as = S.assess.filter(a => a.classId === c.id), d = state.view === 'weekly' ? weekly(as) : termly(as);
  $('#perfNote').textContent = c.name + ': average % ' + (state.view === 'weekly' ? 'per day this week' : 'per term this year');
  $('#chart').innerHTML = chart(d.labels, d.vals) + (d.vals.some(v => v != null) ? '' : '<p class="muted">No marks recorded for this period yet.</p>');
}
function renderPupils(c) {
  const st = pupilStats(c);
  $('#pupils').innerHTML = st
    ? item('learner.html?id=' + st.top.p.id, 'Top performer', esc(st.top.p.name), pill(st.top.v)) +
      item('reports.html', 'Class average', st.n + ' pupils with marks', pill(st.mean)) +
      item('learner.html?id=' + st.low.p.id, 'Lowest', esc(st.low.p.name), pill(st.low.v))
    : '<p class="muted">Enter marks to see the top, average and lowest results.</p>';
}
function renderStats(c) {
  const st = pupilStats(c), at = attCount(c), rate = at.pr + at.ab ? Math.round(at.pr / (at.pr + at.ab) * 100) + '%' : '–';
  const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
  $('#stats').innerHTML = stat(c.pupils.length, 'Pupils') + stat(S.assess.filter(a => a.classId === c.id).length, 'Assessments') + stat(st ? st.mean + '%' : '–', 'Class average') + stat(rate, 'Attendance rate');
}
function renderAlerts() {
  const a = alerts(), box = $('#alerts');
  if (!a.length) { box.innerHTML = ''; return; }
  const cl = { high: 'support', med: 'watch', low: 'draft' }, lab = { high: 'Urgent', med: 'Check', low: 'Note' };
  box.innerHTML = `<h2>Needs your attention (${a.length})</h2><div class="stack">${a.slice(0, 5).map(x => item(x.link, esc(x.text), '', `<span class="pill ${cl[x.lvl]}">${lab[x.lvl]}</span>`)).join('')}</div>${a.length > 5 ? '<a class="btn btn-outline" href="reminders.html" style="margin-top:8px">See all reminders</a>' : ''}`;
  try { if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('td-notified') !== iso(new Date())) { localStorage.setItem('td-notified', iso(new Date())); notify(a.length + ' item(s) need your attention.'); } } catch (e) {}
}
function renderTrend(c) { const t = classTrend(c); $('#trend').innerHTML = `<p class="muted">${esc(trendNote(c))}</p>` + multiLine(t.labels, t.series); }
function render() {
  const c = cls(), sel = $('#classSelect');
  sel.innerHTML = S.classes.map(k => `<option value="${k.id}"${k.id === S.cur ? ' selected' : ''}>${esc(k.name)}</option>`).join('');
  sel.style.display = S.classes.length ? '' : 'none';
  if (!c) { $('#work').innerHTML = noClass(); $('#chart').innerHTML = ''; $('#pupils').innerHTML = ''; $('#perfNote').textContent = ''; $('#stats').innerHTML = ''; $('#alerts').innerHTML = ''; $('#trend').innerHTML = ''; return; }
  renderStats(c); renderAlerts(); renderTrend(c); renderWork(c); renderChart(c); renderPupils(c);
}

$('#greeting').textContent = 'Good morning' + (USER ? ', ' + USER.split(' ')[0] : '');
$('#today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
$('#classSelect').addEventListener('change', e => { S.cur = e.target.value; save(); render(); });
document.querySelectorAll('.tabs button').forEach(btn =>
  btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b === btn));
    renderChart(cls());
  })
);
render();
