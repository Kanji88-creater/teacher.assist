/* New pages: settings, more, lesson plans (Zambian format), schemes, developer tools, records of work,
   individual work plan, class register, reminders, reports, learners. Needs data.js and zambia.js. */

/* ---------- small helpers ---------- */
const qs = k => new URLSearchParams(location.search).get(k);
const fmtD = d => d ? new Date(d + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const nl = t => esc(t || '').replace(/\n/g, '<br>');
const sel = (label, name, opts, val) => `<label>${label}<select name="${name}">${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(t)}</option>`; }).join('')}</select></label>`;
const fld = (label, name, val = '', type = 'text', attrs = '') => `<label>${label}<input type="${type}" name="${name}" value="${esc(val)}" ${attrs}></label>`;
const area = (label, name, val = '', rows = 3) => `<label>${label}<textarea name="${name}" rows="${rows}">${esc(val)}</textarea></label>`;
const docHead = (title, sub) => `<div class="doc-head"><b>${esc(S.settings.school || 'School name (set it in Settings)')}</b><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
const printBtn = extra => `<div class="btns noprint"><button class="btn btn-solid" data-act="print">Print / Save as PDF</button>${extra || ''}</div>`;
const tbl = (cols, rows) => `<div class="tblwrap"><table class="tbl"><thead><tr>${cols.map(c => `<th>${c.l}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${nl(c.type === 'date' ? fmtD(r[c.k]) : r[c.k])}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cols.length}">&nbsp;</td></tr>`}</tbody></table></div>`;
const sign = labels => `<table class="tbl sign"><tr>${labels.map(l => `<th>${l}</th>`).join('')}</tr><tr>${labels.map(() => '<td>&nbsp;<br>&nbsp;<br>Signature:<br>Date:</td>').join('')}</tr></table>`;
const needCls = () => { const c = cls(); return c ? c : null; };

/* editable rows (records of work, work plan) */
function rowsEditor(cols, rows, doc) {
  return `<div class="tblwrap"><table class="tbl"><thead><tr>${cols.map(c => `<th>${c.l}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r, i) => `<tr>${cols.map(c => `<td>${c.opts ? `<select name="${c.k}">${c.opts.map(o => `<option${r[c.k] === o ? ' selected' : ''}>${o}</option>`).join('')}</select>` : c.type === 'date' ? `<input type="date" name="${c.k}" value="${esc(r[c.k] || '')}">` : `<textarea name="${c.k}" rows="2">${esc(r[c.k] || '')}</textarea>`}</td>`).join('')}<td><button class="btn btn-danger btn-sm" type="button" data-act="rowDel" data-i="${i}" data-doc="${doc}" aria-label="Remove row">x</button></td></tr>`).join('')}</tbody></table></div>`;
}
function collectRows(f, cols) {
  const fd = new FormData(f), n = fd.getAll(cols[0].k).length;
  return Array.from({ length: n }, (_, i) => Object.fromEntries(cols.map(c => [c.k, fd.getAll(c.k)[i] || ''])));
}
const REC_COLS = [{ k: 'date', l: 'Date', type: 'date' }, { k: 'cls', l: 'Class / subject' }, { k: 'topic', l: 'Topic / content covered' }, { k: 'methods', l: 'Methods' }, { k: 'aids', l: 'Aids used' }, { k: 'eval', l: 'Evaluation / remarks' }];
const IWP_COLS = [{ k: 'kra', l: 'Key result area' }, { k: 'activities', l: 'Activities' }, { k: 'target', l: 'Target / indicator' }, { k: 'time', l: 'Timeframe' }, { k: 'resources', l: 'Resources' }, { k: 'status', l: 'Status', opts: ['Not started', 'In progress', 'Done'] }, { k: 'review', l: 'Review remarks' }];
const DOCS = { record: { cols: REC_COLS, list: () => S.records }, iwp: { cols: IWP_COLS, list: () => S.iwp } };
const curDoc = d => DOCS[d].list().find(x => x.id === qs('id'));
X.acts.rowAdd = d => { const f = document.querySelector('form[data-form=' + d.doc + ']'), o = curDoc(d.doc); o.rows = collectRows(f, DOCS[d.doc].cols); o.rows.push({}); save(); render(true); };
X.acts.rowDel = d => { const f = document.querySelector('form[data-form=' + d.doc + ']'), o = curDoc(d.doc); o.rows = collectRows(f, DOCS[d.doc].cols); o.rows.splice(Number(d.i), 1); save(); render(true); };

/* ---------- settings and More ---------- */
X.views.settings = () => head('Settings') + `<section class="card"><form class="form" data-form="settings">
  ${fld('School name', 'school', S.settings.school)}
  ${fld('Your name (teacher)', 'teacher', S.settings.teacher)}
  ${fld('Head of Department (HOD)', 'hod', S.settings.hod)}
  ${fld('Deputy Head Teacher (DHT)', 'dht', S.settings.dht)}
  ${fld('Days the HOD and the DHT have to check a weekly record (7 or more)', 'reviewDays', S.settings.reviewDays, 'number', 'min="7"')}
  ${fld('Standard class size (Zambian default is 40)', 'classSize', S.settings.classSize, 'number', 'min="1"')}
  ${fld('AI service address (optional)', 'aiUrl', S.settings.aiUrl, 'url', 'placeholder="https://your-ai-service.example.com"')}
  ${fld('AI access code (optional)', 'aiCode', S.settings.aiCode, 'password')}
  <button class="btn btn-solid">Save settings</button></form></section>
  <p class="muted">Defaults follow the Zambian Ministry rule of 40 pupils per class at primary level and the chain of documents: scheme of work, lesson plan, record of work, checked by the HOD and then the Deputy Head Teacher. Always confirm against your school's and the Ministry's current instructions.</p>`;
X.forms.settings = f => { Object.assign(S.settings, { school: f.school.value.trim(), teacher: f.teacher.value.trim(), hod: f.hod.value.trim(), dht: f.dht.value.trim(), reviewDays: Math.max(7, Number(f.reviewDays.value) || 7), classSize: Math.max(1, Number(f.classSize.value) || 40), aiUrl: f.aiUrl.value.trim(), aiCode: f.aiCode.value.trim() }); };
X.views.more = () => head('More') + '<div class="stack">' + [
  ['reports.html', 'Reports', 'Graphs, pupil table and a printable class report'],
  ['register.html', 'Class register', 'Printable monthly attendance register'],
  ['records.html', 'Records of work', 'Weekly records for the HOD and Deputy Head to check'],
  ['workplan.html', 'Individual work plan', 'Your work plan with targets, printable'],
  ['schemes.html', 'Schemes of work', 'Provided and personal schemes, printable'],
  ['materials.html', 'Teaching materials', 'Upload books and past papers, find teaching aids'],
  ['scan.html', 'Scan documents', 'Scan pages with your camera and save as PDF'],
  ['assistant.html', 'AI assistant', 'Draft lesson plans and assessments'],
  ['reminders.html', 'Reminders', 'What needs improvement and what is due'],
  ['settings.html', 'Settings', 'School, HOD, Deputy Head and AI connection']
].map(([h, t, s]) => item(h, t, s, '<span class="count">&rsaquo;</span>')).join('') + '</div><p class="muted"><a href="developer.html">Developer tools</a></p>';

/* ---------- lesson plans ---------- */
const allSchemes = () => [...(window.DEV_SCHEMES || []).map(s => ({ ...s, source: 'dev' })), ...S.schemes.map(s => ({ ...s, source: 'mine' }))];
const findScheme = id => allSchemes().find(s => s.id === id);
const aidsHtml = list => { let last = -1, h = ''; list.forEach(a => { if (a.t !== last) { h += `<h3 class="tier">${TIERS[a.t]}</h3>`; last = a.t; } h += `<label class="item aid"><span><b>${esc(a.n)}</b><small>${esc(a.use)}</small><small><b>Inclusion:</b> ${esc(a.acc)}</small></span><input type="checkbox" class="aidchk" value="${esc(a.n)}"></label>`; }); return h + '<button type="button" class="btn btn-solid btn-sm" data-act="addAids">Add selected to my plan</button>'; };
X.views['plan-new'] = () => {
  const c = cls(); if (!c) return head('Lesson plan') + noClass();
  const id = qs('id'), p = id ? S.plans.find(x => x.id === id) : null, sc = qs('scheme') ? findScheme(qs('scheme')) : null, row = sc ? sc.rows.find(r => String(r.week) === qs('week')) : null;
  const v = p || (row ? { title: row.topic, subject: sc.subject, outcomes: row.outcomes, aids: row.aids, evaluation: row.assess, refs: row.refs || '', week: row.week } : {});
  return head(p ? 'Edit lesson plan' : 'Lesson plan') + `<section class="card"><form class="form" data-form="plan2" id="planForm">
  <input type="hidden" name="planId" value="${p ? p.id : ''}">
  ${fld('Subject', 'subject', v.subject || '', 'text', 'list="subjList" required')}<datalist id="subjList">${SUBJECTS.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
  ${fld('Class', 'grade', v.grade || c.name)}
  ${fld('Date', 'date', v.date || iso(new Date()), 'date', 'required')}
  ${fld('Duration (minutes)', 'duration', v.duration || 40, 'number', 'min="10"')}
  ${fld('Topic', 'title', v.title || '', 'text', 'required')}
  ${fld('Sub-topic', 'subtopic', v.subtopic || '')}
  ${area('Rationale (why this lesson matters to learners)', 'rationale', v.rationale)}
  ${area('Learning outcomes: by the end of the lesson learners should be able to...', 'outcomes', v.outcomes)}
  ${area('Prerequisite knowledge', 'prior', v.prior, 2)}
  ${area('Teaching and learning aids', 'aids', v.aids)}
  <div class="btns"><button type="button" class="btn btn-outline btn-sm" data-act="suggestAids">Suggest aids, cheapest first</button><button type="button" class="btn btn-outline btn-sm" data-act="planRefs">Add my uploaded materials</button></div>
  <div id="aidList" class="stack"></div>
  ${area('References (books, past papers)', 'refs', v.refs, 2)}
  ${area('Introduction', 'intro', v.intro)}
  ${area('Development (steps and timing)', 'development', v.development, 5)}
  ${area('Conclusion', 'conclusion', v.conclusion)}
  ${area('Evaluation (how you will check learning)', 'evaluation', v.evaluation)}
  ${area('Inclusion: adaptations for learners of all abilities and disabilities', 'inclusion', v.inclusion, 6)}
  <div class="btns"><button type="button" class="btn btn-outline btn-sm" data-act="suggestIncl">Suggest inclusive adaptations</button><a class="btn btn-outline btn-sm" href="assistant.html">Draft with AI assistant</a></div>
  ${sel('Status', 'status', [['draft', 'Draft'], ['ready', 'Ready']], v.status || 'draft')}
  <button class="btn btn-solid">Save lesson plan</button></form></section><a class="btn btn-outline" href="plans.html">Back to lesson plans</a>`;
};
const PLAN_KEYS = ['subject', 'grade', 'date', 'duration', 'title', 'subtopic', 'rationale', 'outcomes', 'prior', 'aids', 'refs', 'intro', 'development', 'conclusion', 'evaluation', 'inclusion', 'status'];
X.forms.plan2 = f => {
  const d = {}; PLAN_KEYS.forEach(k => { d[k] = f[k].value.trim(); }); d.objectives = d.outcomes; d.activities = d.development;
  if (f.planId.value) Object.assign(S.plans.find(x => x.id === f.planId.value), d); else S.plans.push({ id: uid(), classId: cls().id, remarks: '', ...d });
};
X.redir.plan2 = 'plans.html';
const planForm = () => document.querySelector('#planForm');
X.acts.suggestAids = () => { const f = planForm(); $('#aidList').innerHTML = aidsHtml(suggestAids(f.subject.value, f.title.value + ' ' + f.subtopic.value)); };
X.acts.addAids = () => { const f = planForm(), pick = [...document.querySelectorAll('.aidchk:checked')].map(i => '- ' + i.value); if (!pick.length) return toast('Tick the aids you want'); const have = f.aids.value; f.aids.value = (have ? have.trim() + '\n' : '') + pick.filter(l => !have.includes(l)).join('\n'); toast('Added to aids'); };
X.acts.suggestIncl = () => { const f = planForm(); f.inclusion.value = inclusionText(classNeeds(cls())); };

X.views['plan-view'] = () => {
  const p = S.plans.find(x => x.id === qs('id')); if (!p) return head('Lesson plan') + '<p class="muted">Lesson plan not found.</p><a class="btn btn-outline" href="plans.html">Back</a>';
  const c = S.classes.find(x => x.id === p.classId) || { name: p.grade || '', pupils: [] }, b = c.pupils.filter(x => x.sex === 'M').length, g = c.pupils.filter(x => x.sex === 'F').length;
  const r = (a, v) => `<tr><th>${a}</th><td>${nl(v)}</td></tr>`;
  return head('Lesson plan') + printBtn(`<a class="btn btn-outline" href="lesson-plan-new.html?id=${p.id}">Edit</a>`) + `<article class="doc">${docHead('LESSON PLAN')}
  <table class="tbl bio">${r('Teacher', S.settings.teacher)}${r('Subject', p.subject)}${r('Class', p.grade || c.name)}${r('Date', fmtD(p.date))}${r('Duration', (p.duration || '') + ' minutes')}${r('Enrolment', 'Boys: ' + b + '   Girls: ' + g + '   Total: ' + c.pupils.length)}${r('Topic', p.title)}${r('Sub-topic', p.subtopic)}</table>
  <table class="tbl">${r('Rationale', p.rationale)}${r('Learning outcomes', p.outcomes || p.objectives)}${r('Prerequisite knowledge', p.prior)}${r('Teaching and learning aids', p.aids)}${r('References', p.refs)}</table>
  <h3>Lesson development</h3><table class="tbl">${r('Introduction', p.intro)}${r('Development', p.development || p.activities)}${r('Conclusion', p.conclusion)}${r('Evaluation', p.evaluation)}</table>
  <h3>Inclusion: learners of all abilities and disabilities</h3><table class="tbl"><tr><td>${nl(p.inclusion) || '&nbsp;'}</td></tr></table>
  <h3>Teacher's reflection / remarks</h3><table class="tbl"><tr><td>${nl(p.remarks) || '&nbsp;<br>&nbsp;<br>&nbsp;'}</td></tr></table>${sign(['Teacher', 'Head of Department', 'Deputy Head Teacher'])}</article>`;
};

/* ---------- schemes of work ---------- */
const parseScheme = t => t.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { const p = l.split(/\s*\|\s*|\t/); return { week: p[0] || '', topic: p[1] || '', outcomes: p[2] || '', methods: p[3] || '', aids: p[4] || '', assess: p[5] || '' }; });
const SCH_COLS = [{ k: 'week', l: 'Week' }, { k: 'topic', l: 'Topic' }, { k: 'outcomes', l: 'Specific outcomes' }, { k: 'methods', l: 'Methods' }, { k: 'aids', l: 'Aids' }, { k: 'assess', l: 'Assessment' }];
const schemeForm = (kind) => `<form class="form" data-form="${kind}">${fld('Title', 'title', '', 'text', 'placeholder="e.g. Physics Grade 11 Term 1" required')}${fld('Grade', 'grade', '', 'text', 'required')}${fld('Subject', 'subject', '', 'text', 'list="subjList" required')}${sel('Term', 'term', ['Term 1', 'Term 2', 'Term 3'])}${area('Rows, one per line: week | topic | specific outcomes | methods | aids | assessment', 'rows', '', 6)}<button class="btn btn-solid">Save scheme</button></form><datalist id="subjList">${SUBJECTS.map(s => `<option value="${esc(s)}">`).join('')}</datalist>`;
X.views.schemes = () => {
  const id = qs('id'), s = id && findScheme(id);
  if (id) return !s ? head('Scheme of work') + '<p class="muted">Scheme not found.</p><a class="btn btn-outline" href="schemes.html">Back</a>' :
    head('Scheme of work') + printBtn('<a class="btn btn-outline" href="schemes.html">Back</a>') + `<article class="doc">${docHead('SCHEME OF WORK', esc(s.title) + ' · Grade ' + esc(s.grade) + ' · ' + esc(s.subject) + ' · ' + esc(s.term))}${tbl(SCH_COLS, s.rows)}<p class="muted noprint">Tap a week to plan that lesson:</p><div class="btns noprint">${s.rows.map(r => `<a class="btn btn-outline btn-sm" href="lesson-plan-new.html?scheme=${s.id}&week=${encodeURIComponent(r.week)}">Week ${esc(r.week)}</a>`).join('')}</div>${sign(['Teacher', 'Head of Department', 'Deputy Head Teacher'])}</article>`;
  const files = window.DEV_SCHEME_FILES || [];
  return head('Schemes of work') + `<section><h2>Schemes</h2><div class="stack">${allSchemes().map(x => item('schemes.html?id=' + x.id, esc(x.title), 'Grade ' + esc(x.grade) + ' · ' + esc(x.subject) + ' · ' + esc(x.term) + ' · ' + x.rows.length + ' weeks', `<span class="pill ${x.source === 'dev' ? 'ready' : 'draft'}">${x.source === 'dev' ? 'Provided' : 'Mine'}</span>`)).join('') || '<p class="muted">No schemes yet. Add your own below. Schemes provided by the app developer appear here too.</p>'}</div></section>
  ${files.length ? `<section><h2>Scheme documents to download</h2><div class="stack">${files.map(f => item('schemes/' + encodeURIComponent(f.file), esc(f.title), esc((f.grade || '') + ' ' + (f.subject || '') + ' ' + (f.term || '')), '<span class="count">&darr;</span>')).join('')}</div></section>` : ''}
  <section class="card"><h2>Add my own scheme</h2>${schemeForm('scheme')}</section>
  <div class="btns"><button class="btn btn-outline" data-act="copyScheme">Copy a provided scheme to mine</button></div>`;
};
X.forms.scheme = f => { S.schemes.push({ id: uid(), title: f.title.value.trim(), grade: f.grade.value.trim(), subject: f.subject.value.trim(), term: f.term.value, rows: parseScheme(f.rows.value) }); };
X.acts.copyScheme = () => { const dev = allSchemes().filter(s => s.source === 'dev'); if (!dev.length) return toast('No provided schemes yet'); dev.forEach(s => { if (!S.schemes.some(m => m.title === s.title && m.grade === s.grade)) S.schemes.push({ ...s, id: uid(), source: 'mine' }); }); save(); toast('Copied to your schemes'); render(true); };

/* ---------- developer tools: build schemes.js for everyone ---------- */
const devDraft = () => { try { const d = JSON.parse(localStorage.getItem('td-dev-draft')); if (d) return d; } catch (e) {} return { schemes: (window.DEV_SCHEMES || []).slice(), files: (window.DEV_SCHEME_FILES || []).slice() }; };
const devSave = d => { try { localStorage.setItem('td-dev-draft', JSON.stringify(d)); } catch (e) {} };
const csvRows = t => { const rows = []; let r = [], c = '', q = false; for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"' && t[i + 1] === '"') { c += '"'; i++; } else if (ch === '"') q = false; else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { r.push(c); c = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); c = ''; if (r.some(x => x.trim())) rows.push(r); r = []; } else c += ch; } r.push(c); if (r.some(x => x.trim())) rows.push(r); return rows; };
function importCsv(text) {
  const rows = csvRows(text), head0 = rows[0].map(h => h.trim().toLowerCase()), ix = k => head0.indexOf(k), d = devDraft(), map = {};
  rows.slice(1).forEach(r => { const g = k => (ix(k) >= 0 ? (r[ix(k)] || '').trim() : ''), key = g('grade') + '|' + g('subject') + '|' + g('term'); if (!map[key]) map[key] = { id: uid(), title: g('subject') + ' Grade ' + g('grade') + ' ' + g('term'), grade: g('grade'), subject: g('subject'), term: g('term'), rows: [] }; map[key].rows.push({ week: g('week'), topic: g('topic'), outcomes: g('outcomes'), methods: g('methods'), aids: g('aids'), assess: g('assessment'), refs: g('references') }); });
  const add = Object.values(map); d.schemes.push(...add); devSave(d); return add.length;
}
X.views.developer = () => { const d = devDraft(); return head('Developer tools') + `<p class="muted">For the app developer. Build the schemes of work that every teacher sees, then download <b>schemes.js</b> and put it in the app folder (replacing the old one) before you upload the site again. Raise the version number in sw.js so phones update.</p>
  <section class="card"><h2>Add a scheme</h2>${schemeForm('devscheme')}</section>
  <section class="card"><h2>Import from a spreadsheet (CSV)</h2><p class="muted">Columns: grade, subject, term, week, topic, outcomes, methods, aids, assessment, references. Save the sheet as CSV.</p><label>CSV file<input type="file" id="devCsv" accept=".csv,text/csv"></label><button class="btn btn-outline btn-sm" data-act="csvTemplate">Download CSV template</button></section>
  <section class="card"><h2>Add a scheme document (PDF or Word)</h2><p class="muted">Copy the file into a folder named <b>schemes</b> next to index.html, then list it here.</p><form class="form" data-form="devfile">${fld('Title', 'title', '', 'text', 'required')}${fld('Grade', 'grade')}${fld('Subject', 'subject')}${sel('Term', 'term', ['Term 1', 'Term 2', 'Term 3', 'All terms'])}<label>Choose the file<input type="file" name="pick"></label><button class="btn btn-solid">Add document</button></form></section>
  <section><h2>Schemes (${d.schemes.length})</h2><div class="stack">${d.schemes.map((s, i) => `<div class="item"><span><b>${esc(s.title)}</b><small>Grade ${esc(s.grade)} · ${esc(s.subject)} · ${esc(s.term)} · ${s.rows.length} weeks</small></span><button class="btn btn-danger btn-sm" data-act="devDel" data-i="${i}">Remove</button></div>`).join('') || '<p class="muted">None yet.</p>'}</div>
  <h2>Documents (${d.files.length})</h2><div class="stack">${d.files.map((f, i) => `<div class="item"><span><b>${esc(f.title)}</b><small>${esc(f.file)}</small></span><button class="btn btn-danger btn-sm" data-act="devDelFile" data-i="${i}">Remove</button></div>`).join('') || '<p class="muted">None yet.</p>'}</div></section>
  <button class="btn btn-solid" data-act="devDownload">Download schemes.js</button>`; };
X.forms.devscheme = f => { const d = devDraft(); d.schemes.push({ id: uid(), title: f.title.value.trim(), grade: f.grade.value.trim(), subject: f.subject.value.trim(), term: f.term.value, rows: parseScheme(f.rows.value) }); devSave(d); };
X.forms.devfile = f => { const d = devDraft(), file = f.pick.files[0]; if (!file) return toast('Choose the file first'); d.files.push({ title: f.title.value.trim(), grade: f.grade.value.trim(), subject: f.subject.value.trim(), term: f.term.value, file: file.name }); devSave(d); };
X.acts.devDel = d => { const x = devDraft(); x.schemes.splice(Number(d.i), 1); devSave(x); render(true); };
X.acts.devDelFile = d => { const x = devDraft(); x.files.splice(Number(d.i), 1); devSave(x); render(true); };
const saveBlob = (name, type, content) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); };
X.acts.devDownload = () => { const d = devDraft(); saveBlob('schemes.js', 'text/javascript', '/* Developer-supplied schemes of work. Generated by developer.html */\nwindow.DEV_SCHEMES = ' + JSON.stringify(d.schemes, null, 1) + ';\nwindow.DEV_SCHEME_FILES = ' + JSON.stringify(d.files, null, 1) + ';\n'); };
X.acts.csvTemplate = () => saveBlob('schemes-template.csv', 'text/csv', 'grade,subject,term,week,topic,outcomes,methods,aids,assessment,references\n11,Physics,Term 1,1,Motion,"Describe motion; calculate speed","Demonstration; group work","Stopwatch; measuring tape","Oral questions","Learner\'s book"\n');

/* ---------- records of work (weekly, checked by HOD then Deputy Head) ---------- */
const recState = r => r.dht ? ['DHT checked', 'ready'] : r.hod ? ['HOD checked', 'watch'] : r.submittedOn ? ['Submitted', 'watch'] : ['Draft', 'draft'];
const dueTxt = r => { const rd = S.settings.reviewDays || 7, t = iso(new Date()); if (r.dht) return 'Fully checked.'; if (r.hod) { const d = iso(addDays(new Date(r.hod.date + 'T00:00'), rd)); return 'Deputy Head to check by ' + fmtD(d) + (t > d ? ' (overdue)' : ''); } if (r.submittedOn) { const d = iso(addDays(new Date(r.submittedOn + 'T00:00'), rd)); return 'HOD to check by ' + fmtD(d) + (t > d ? ' (overdue)' : ''); } return 'Not submitted yet.'; };
X.views.records = () => {
  const c = cls(); if (!c) return head('Records of work') + noClass();
  const id = qs('id'), r = id && S.records.find(x => x.id === id);
  if (!id) return head('Records of work') + `<section class="card"><h2>New weekly record</h2><form class="form" data-form="recnew">${fld('Week beginning (Monday)', 'week', iso(mondayOf(new Date())), 'date', 'required')}<button class="btn btn-solid">Start record for ${esc(c.name)}</button></form></section>
  <section><h2>Your records</h2><div class="stack">${S.records.slice().sort((a, b) => b.weekStart.localeCompare(a.weekStart)).map(x => { const st = recState(x); return item('records.html?id=' + x.id, 'Week of ' + fmtD(x.weekStart), esc((S.classes.find(k => k.id === x.classId) || {}).name || '') + ' · ' + dueTxt(x), `<span class="pill ${st[1]}">${st[0]}</span>`); }).join('') || '<p class="muted">No records yet.</p>'}</div></section>
  <p class="muted">Records are weekly. After you submit a week, the HOD checks it and then the Deputy Head Teacher; each has at least ${S.settings.reviewDays || 7} days (set in Settings).</p>`;
  if (!r) return head('Record of work') + '<p class="muted">Record not found.</p><a class="btn btn-outline" href="records.html">Back</a>';
  const cn = (S.classes.find(k => k.id === r.classId) || {}).name || '', st = recState(r);
  return head('Record of work') + `<form class="form" data-form="record" data-id="${r.id}">
  <div class="item"><span><b>Week of ${fmtD(r.weekStart)}</b><small>${esc(cn)} · ${dueTxt(r)}</small></span><span class="pill ${st[1]}">${st[0]}</span></div>
  <div class="noprint">${r.submittedOn ? '' : rowsEditor(REC_COLS, r.rows, 'record')}
  ${r.submittedOn ? '<p class="muted">This record has been submitted and is locked for checking.</p>' : `<div class="btns"><button type="button" class="btn btn-outline btn-sm" data-act="rowAdd" data-doc="record">Add row</button><button type="button" class="btn btn-outline btn-sm" data-act="recFill">Fill from my lesson plans this week</button></div><div class="btns"><button class="btn btn-outline">Save record</button><button type="button" class="btn btn-solid" data-act="recSubmit">Submit for checking</button></div>`}
  ${r.submittedOn && !r.hod ? `<section class="card form"><h2>HOD check</h2>${fld('HOD name', 'hodName', S.settings.hod)}${fld('Date checked', 'hodDate', iso(new Date()), 'date')}${area('Comment', 'hodComment', '', 2)}<button type="button" class="btn btn-solid" data-act="recHod">Mark as checked by HOD</button></section>` : ''}
  ${r.hod && !r.dht ? `<section class="card form"><h2>Deputy Head Teacher check</h2>${fld('DHT name', 'dhtName', S.settings.dht)}${fld('Date checked', 'dhtDate', iso(new Date()), 'date')}${area('Comment', 'dhtComment', '', 2)}<button type="button" class="btn btn-solid" data-act="recDht">Mark as checked by Deputy Head</button></section>` : ''}
  ${printBtn()}</div></form>
  <article class="doc only-print">${docHead('RECORD OF WORK', 'Teacher: ' + esc(S.settings.teacher) + ' · Class: ' + esc(cn) + ' · Week beginning: ' + fmtD(r.weekStart))}${tbl(REC_COLS, r.rows)}
  <table class="tbl sign"><tr><th>Head of Department</th><th>Deputy Head Teacher</th></tr><tr><td>${r.hod ? esc(r.hod.name) + '<br>Date: ' + fmtD(r.hod.date) + '<br>' + nl(r.hod.comment) : '&nbsp;<br>Signature:<br>Date:'}</td><td>${r.dht ? esc(r.dht.name) + '<br>Date: ' + fmtD(r.dht.date) + '<br>' + nl(r.dht.comment) : '&nbsp;<br>Signature:<br>Date:'}</td></tr></table></article>`;
};
X.forms.recnew = f => { const c = cls(); let r = S.records.find(x => x.classId === c.id && x.weekStart === f.week.value); if (!r) { r = { id: uid(), classId: c.id, weekStart: f.week.value, rows: [{}], submittedOn: '', hod: null, dht: null }; S.records.push(r); } X.lastId = r.id; };
X.redir.recnew = () => 'records.html?id=' + X.lastId;
X.forms.record = f => { const r = S.records.find(x => x.id === f.dataset.id); if (!r.submittedOn) r.rows = collectRows(f, REC_COLS); };
const recForm = () => document.querySelector('form[data-form=record]');
X.acts.recFill = () => { const r = curDoc('record'), f = recForm(); r.rows = collectRows(f, REC_COLS).filter(x => Object.values(x).some(Boolean)); const end = iso(addDays(new Date(r.weekStart + 'T00:00'), 6)), c = S.classes.find(k => k.id === r.classId); S.plans.filter(p => p.classId === r.classId && p.date >= r.weekStart && p.date <= end).sort((a, b) => a.date.localeCompare(b.date)).forEach(p => r.rows.push({ date: p.date, cls: (c ? c.name : '') + ' ' + (p.subject || ''), topic: p.title + (p.subtopic ? ': ' + p.subtopic : ''), methods: (p.development || '').split('\n')[0].slice(0, 120), aids: (p.aids || '').replace(/\n- /g, ', ').replace(/^- /, ''), eval: p.evaluation || '' })); if (!r.rows.length) r.rows.push({}); save(); toast('Filled from lesson plans'); render(true); };
X.acts.recSubmit = () => { const r = curDoc('record'); r.rows = collectRows(recForm(), REC_COLS); if (!r.rows.some(x => x.topic && x.topic.trim())) return toast('Add at least one day of work first'); r.submittedOn = iso(new Date()); save(); toast('Submitted for HOD check'); render(true); };
X.acts.recHod = () => { const r = curDoc('record'), f = recForm(); if (!f.hodName.value.trim()) return toast('Enter the HOD name'); r.hod = { name: f.hodName.value.trim(), date: f.hodDate.value || iso(new Date()), comment: f.hodComment.value.trim() }; save(); toast('Checked by HOD'); render(true); };
X.acts.recDht = () => { const r = curDoc('record'), f = recForm(); if (!f.dhtName.value.trim()) return toast('Enter the Deputy Head name'); r.dht = { name: f.dhtName.value.trim(), date: f.dhtDate.value || iso(new Date()), comment: f.dhtComment.value.trim() }; save(); toast('Checked by Deputy Head'); render(true); };

/* ---------- individual work plan ---------- */
const IWP_START = [
  { kra: 'Teaching and learning', activities: 'Prepare schemes of work, lesson plans and records of work for all my classes', target: 'Documents up to date and submitted on time', time: 'Every week', resources: 'Syllabus, teacher\'s guide', status: 'Not started' },
  { kra: 'Assessment and records', activities: 'Set, mark and record assessments; analyse results', target: 'Results recorded and analysed each term', time: 'Each term', resources: 'Mark book, this app', status: 'Not started' },
  { kra: 'Learner support and inclusion', activities: 'Identify learners who need help and plan extra support; use inclusive methods', target: 'Support plan for learners below the pass mark', time: 'Ongoing', resources: 'Teaching aids, peer support', status: 'Not started' },
  { kra: 'Professional development', activities: 'Take part in school-based CPD and lesson study', target: 'Attend planned sessions', time: 'Termly', resources: 'School CPD programme', status: 'Not started' },
  { kra: 'School and community', activities: 'Co-curricular duties and meetings with parents', target: 'Duties carried out', time: 'Termly', resources: '', status: 'Not started' }
];
X.views.workplan = () => {
  const id = qs('id'), w = id && S.iwp.find(x => x.id === id);
  if (!id) return head('Individual work plan') + `<section class="card"><h2>New work plan</h2><form class="form" data-form="iwpnew">${sel('Term', 'term', ['Term 1', 'Term 2', 'Term 3', 'Whole year'])}${fld('Year', 'year', new Date().getFullYear(), 'number', 'required')}<button class="btn btn-solid">Create with starter rows</button></form></section>
  <section><h2>Your work plans</h2><div class="stack">${S.iwp.map(x => item('workplan.html?id=' + x.id, esc(x.term) + ' ' + x.year, x.rows.filter(r => r.status === 'Done').length + ' of ' + x.rows.length + ' done', '<span class="count">&rsaquo;</span>')).join('') || '<p class="muted">No work plans yet.</p>'}</div></section>
  <p class="muted">The starter rows are suggestions. Replace them with the targets agreed with your supervisor.</p>`;
  if (!w) return head('Work plan') + '<p class="muted">Work plan not found.</p><a class="btn btn-outline" href="workplan.html">Back</a>';
  return head('Individual work plan') + `<form class="form" data-form="iwp" data-id="${w.id}"><div class="noprint">${rowsEditor(IWP_COLS, w.rows, 'iwp')}<div class="btns"><button type="button" class="btn btn-outline btn-sm" data-act="rowAdd" data-doc="iwp">Add row</button><button class="btn btn-solid">Save work plan</button></div>${printBtn()}</div></form>
  <article class="doc only-print">${docHead('INDIVIDUAL WORK PLAN', 'Teacher: ' + esc(S.settings.teacher) + ' · ' + esc(w.term) + ' ' + w.year)}${tbl(IWP_COLS, w.rows)}${sign(['Teacher', 'Head of Department', 'Head Teacher'])}</article>`;
};
X.forms.iwpnew = f => { const w = { id: uid(), term: f.term.value, year: f.year.value, rows: IWP_START.map(r => ({ ...r })) }; S.iwp.push(w); X.lastId = w.id; };
X.redir.iwpnew = () => 'workplan.html?id=' + X.lastId;
X.forms.iwp = f => { S.iwp.find(x => x.id === f.dataset.id).rows = collectRows(f, IWP_COLS); };

/* ---------- class register (printable) ---------- */
X.views.register = () => {
  const c = cls(); if (!c) return head('Class register') + noClass();
  const m = qs('month') || iso(new Date()).slice(0, 7), [y, mo] = m.split('-').map(Number), n = new Date(y, mo, 0).getDate(), days = [];
  for (let d = 1; d <= n; d++) { const w = new Date(y, mo - 1, d).getDay(); if (w && w < 6) days.push(d); }
  const rec = d => S.att[c.id + '|' + m + '-' + String(d).padStart(2, '0')] || {};
  const rowsH = c.pupils.map((p, i) => { let pr = 0, ab = 0; const cells = days.map(d => { const v = rec(d)[p.id]; if (v === 'P') pr++; if (v === 'A') ab++; return `<td class="${v === 'A' ? 'abs' : ''}">${v || ''}</td>`; }).join(''); return `<tr><td>${i + 1}</td><td class="nm">${esc(p.name)}</td><td>${p.sex}</td>${cells}<td>${pr}</td><td>${ab}</td></tr>`; }).join('');
  const tot = days.map(d => Object.values(rec(d)).filter(v => v === 'P').length);
  return head('Class register') + `<div class="noprint"><label>Month<input type="month" value="${m}" data-qs="month"></label></div>` + printBtn('<a class="btn btn-outline" href="attendance.html">Take attendance</a>') + `<style>@media print{@page{size:landscape}}</style>
  <article class="doc">${docHead('CLASS REGISTER', esc(c.name) + ' · ' + new Date(y, mo - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + ' · Teacher: ' + esc(S.settings.teacher))}
  <div class="tblwrap"><table class="tbl reg"><thead><tr><th>No.</th><th>Name</th><th>Sex</th>${days.map(d => `<th>${d}</th>`).join('')}<th>P</th><th>A</th></tr></thead><tbody>${rowsH}<tr><td></td><td class="nm"><b>Present each day</b></td><td></td>${tot.map(t => `<td>${t || ''}</td>`).join('')}<td></td><td></td></tr></tbody></table></div>
  <p class="muted">P = present, A = absent. Enrolment: boys ${c.pupils.filter(p => p.sex === 'M').length}, girls ${c.pupils.filter(p => p.sex === 'F').length}, total ${c.pupils.length}.</p>${sign(['Class teacher', 'Head of Department', 'Deputy Head Teacher'])}</article>`;
};

/* ---------- reminders ---------- */
X.views.reminders = () => { const a = alerts(), ok = 'Notification' in window; return head('Reminders') + `<section><h2>Needs your attention (${a.length})</h2><div class="stack">${a.map(x => item(x.link, esc(x.text), '', `<span class="pill ${x.lvl === 'high' ? 'support' : x.lvl === 'med' ? 'watch' : 'draft'}">${x.lvl === 'high' ? 'Urgent' : x.lvl === 'med' ? 'Soon' : 'Note'}</span>`)).join('') || '<p class="muted">Nothing needs attention right now.</p>'}</div></section>
  ${ok ? `<button class="btn btn-outline" data-act="notifyOn">Turn on phone notifications</button><p class="muted">Notifications appear when you open the app. They do not wake the phone while the app is closed.</p>` : ''}
  <section class="card"><h2>Add a reminder</h2><form class="form" data-form="reminder">${fld('Reminder', 'title', '', 'text', 'required')}${fld('Date', 'due', iso(new Date()), 'date', 'required')}<button class="btn btn-solid">Add reminder</button></form></section>
  <section><h2>My reminders</h2><div class="stack">${S.reminders.map(r => `<div class="item"><span><b>${esc(r.title)}</b><small>${fmtD(r.due)}${r.done ? ' · done' : ''}</small></span><span class="btns"><button class="btn btn-outline btn-sm" data-act="remDone" data-id="${r.id}">${r.done ? 'Undo' : 'Done'}</button><button class="btn btn-danger btn-sm" data-act="remDel" data-id="${r.id}">Delete</button></span></div>`).join('') || '<p class="muted">None yet.</p>'}</div></section>`; };
X.forms.reminder = f => { S.reminders.push({ id: uid(), title: f.title.value.trim(), due: f.due.value, done: false }); };
X.acts.remDone = d => { const r = S.reminders.find(x => x.id === d.id); r.done = !r.done; save(); render(true); };
X.acts.remDel = d => { S.reminders = S.reminders.filter(x => x.id !== d.id); save(); render(true); };
X.acts.notifyOn = () => Notification.requestPermission().then(p => toast(p === 'granted' ? 'Notifications are on' : 'Notifications were not allowed'));

/* ---------- reports: graphs and a printable class report ---------- */
X.views.reports = () => {
  const c = cls(); if (!c) return head('Reports') + noClass();
  const as = S.assess.filter(a => a.classId === c.id), st = pupilStats(c), tr = classTrend(c), t = termly(as), at = attCount(c);
  const cnt = b => st ? st.rows.filter(r => band(r.v) === b).length : 0, rate = at.pr + at.ab ? Math.round(at.pr / (at.pr + at.ab) * 100) : null;
  const rows = c.pupils.map(p => { const v = as.filter(a => a.scores[p.id] != null).map(a => a.scores[p.id] / a.max * 100), a2 = attCount(c, p.id); return { p, m: v.length ? avg(v) : null, ar: a2.pr + a2.ab ? Math.round(a2.pr / (a2.pr + a2.ab) * 100) : null }; }).sort((a, b) => (b.m == null) - (a.m == null) || b.m - a.m);
  const rem = m => m == null ? '' : m >= 70 ? 'Strong' : m >= 50 ? 'Satisfactory' : 'Needs support';
  return head('Reports') + printBtn() + `<article class="doc">${docHead('CLASS PERFORMANCE REPORT', esc(c.name) + ' · Teacher: ' + esc(S.settings.teacher))}
  <section class="stack noprintgap">${item('', 'Class average', st ? st.n + ' pupils with marks' : 'No marks yet', st ? pill(st.mean) : '')}${item('', 'Attendance rate', at.pr + at.ab ? at.pr + ' present, ' + at.ab + ' absent' : 'Not recorded', rate == null ? '' : pill(rate))}${item('', 'Progress', trendNote(c), '')}</section>
  <section class="card"><h2>Progress over time</h2><div class="chart">${multiLine(tr.labels, tr.series)}</div></section>
  <section class="card"><h2>Pupils by band</h2><div class="chart">${donut([{ label: 'Strong (70%+)', v: cnt('strong'), color: '#15803D' }, { label: 'Satisfactory (50-69%)', v: cnt('watch'), color: '#B45309' }, { label: 'Needs support (below 50%)', v: cnt('support'), color: '#B91C1C' }])}</div></section>
  <section class="card"><h2>Termly performance</h2><div class="chart">${chart(t.labels, t.vals)}</div></section>
  <section><h2>Pupil results</h2><div class="tblwrap"><table class="tbl"><thead><tr><th>No.</th><th>Name</th><th>Sex</th><th>Average</th><th>Attendance</th><th>Remark</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.p.name)}</td><td>${r.p.sex}</td><td>${r.m == null ? '-' : Math.round(r.m) + '%'}</td><td>${r.ar == null ? '-' : r.ar + '%'}</td><td>${rem(r.m)}</td></tr>`).join('')}</tbody></table></div></section>${sign(['Teacher', 'Head of Department', 'Deputy Head Teacher'])}</article>`;
};

/* ---------- learners: quick and bulk entry ---------- */
const parsePupils = text => text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => { l = l.replace(/^\d+[.)\s-]+\s*/, ''); const p = l.split(/[,;\t]/).map(s => s.trim()); const sx = /^(m|male|boy|b)$/i.test(p[1] || '') ? 'M' : /^(f|female|girl|g)$/i.test(p[1] || '') ? 'F' : ''; return { id: uid(), name: p[0], sex: sx, needs: [] }; }).filter(p => p.name && !/^(name|pupil|learner)s?$/i.test(p.name));
function addPupils(list) { const c = cls(), have = new Set(c.pupils.map(p => p.name.toLowerCase())); let n = 0; list.forEach(p => { if (!have.has(p.name.toLowerCase())) { c.pupils.push(p); have.add(p.name.toLowerCase()); n++; } }); return n; }
X.views.learners = () => {
  const c = cls(), lv = Object.entries(LEVELS);
  let out = head('Learners') + `<a class="btn btn-outline" href="attendance.html">Take attendance</a><section class="card"><h2>Add a class</h2><form class="form" data-form="classnew">${fld('Class name', 'name', '', 'text', 'placeholder="e.g. Grade 10C Physics" required')}${sel('Level', 'level', lv, 'senior')}${fld('Standard class size', 'size', S.settings.classSize || DEFAULT_CLASS_SIZE, 'number', 'min="1"')}<button class="btn btn-solid">Add class</button></form></section>`;
  if (!c) return out;
  const n = c.pupils.length, size = c.size || DEFAULT_CLASS_SIZE;
  out += `<section class="card"><h2>${esc(c.name)}</h2><p class="muted">${n} of ${size} pupils${n > size ? ' (above the standard)' : ''}</p><div class="meter"><i class="${n > size ? 'over' : ''}" style="width:${Math.min(100, n / size * 100)}%"></i></div>
  <form class="form" data-form="classedit">${sel('Level', 'level', lv, c.level)}${fld('Standard class size', 'size', size, 'number', 'min="1"')}<button class="btn btn-outline btn-sm">Save class settings</button></form></section>
  <section class="card"><h2>Add pupils quickly</h2>
  <form class="form" data-form="pupil1"><label>Pupil name<input name="name" id="quickName" autocomplete="off" required placeholder="Type a name, press Enter"></label>${sel('Sex', 'sex', [['', '-'], ['M', 'Boy'], ['F', 'Girl']], X.lastSex || '')}<button class="btn btn-solid">Add pupil</button></form>
  <form class="form" data-form="pupilsBulk" style="margin-top:14px">${area('Paste a whole list (one pupil per line, optional ", M" or ", F")', 'names', '', 6)}<button class="btn btn-solid">Add all names</button></form>
  <label style="margin-top:14px">Or import a CSV or text file<input type="file" id="pupFile" accept=".csv,.txt,text/csv,text/plain"></label>
  <div class="btns" style="margin-top:10px"><button class="btn btn-outline btn-sm" data-act="fillSlots">Fill to ${size} numbered places</button><button class="btn btn-outline btn-sm" data-act="sortAZ">Sort A to Z</button></div></section>
  <section><h2>Pupils (${n})</h2><form class="form" data-form="pupilsEdit"><div class="stack">${c.pupils.map((p, i) => `<div class="item"><span class="pno">${i + 1}</span><input name="pn" value="${esc(p.name)}" aria-label="Name"><select name="ps" aria-label="Sex" style="width:80px"><option value=""${p.sex === '' ? ' selected' : ''}>-</option><option value="M"${p.sex === 'M' ? ' selected' : ''}>M</option><option value="F"${p.sex === 'F' ? ' selected' : ''}>F</option></select><a class="btn btn-outline btn-sm" href="learner.html?id=${p.id}">Open</a><button type="button" class="btn btn-danger btn-sm" data-act="pupDel" data-id="${p.id}" aria-label="Remove">x</button></div>`).join('') || '<p class="muted">No pupils yet.</p>'}</div>${n ? '<button class="btn btn-solid">Save name changes</button>' : ''}</form></section>
  <button class="btn btn-danger" data-act="clsDel">Delete this class</button>`;
  return out + '<button class="btn btn-outline" data-act="logout">Log out</button><button class="btn btn-outline" data-act="reset">Reset to sample data</button><button class="btn btn-danger" data-act="clear">Clear everything</button>';
};
X.after.learners = () => { const q = $('#quickName'); if (q && X.focusQuick) { q.focus(); X.focusQuick = false; } };
X.forms.classnew = f => { const c = { id: uid(), name: f.name.value.trim(), level: f.level.value, size: Math.max(1, Number(f.size.value) || 40), pupils: [] }; S.classes.push(c); S.cur = c.id; };
X.forms.classedit = f => { const c = cls(); c.level = f.level.value; c.size = Math.max(1, Number(f.size.value) || 40); };
X.forms.pupil1 = f => { X.lastSex = f.sex.value; X.focusQuick = true; addPupils([{ id: uid(), name: f.name.value.trim(), sex: f.sex.value, needs: [] }]); };
X.forms.pupilsBulk = f => { const n = addPupils(parsePupils(f.names.value)); toast(n + ' pupils added'); };
X.forms.pupilsEdit = f => { const c = cls(), names = new FormData(f).getAll('pn'), sx = new FormData(f).getAll('ps'); c.pupils.forEach((p, i) => { if (names[i] && names[i].trim()) p.name = names[i].trim(); p.sex = sx[i] || ''; }); };
X.acts.fillSlots = () => { const c = cls(); const list = []; for (let i = c.pupils.length + 1; i <= (c.size || 40); i++) list.push({ id: uid(), name: 'Pupil ' + i, sex: '', needs: [] }); c.pupils.push(...list); save(); toast(list.length + ' places added. Rename them when you have the names.'); render(true); };
X.acts.sortAZ = () => { cls().pupils.sort((a, b) => a.name.localeCompare(b.name)); save(); render(true); };
X.change = e => { if (e.target.id === 'pupFile' && e.target.files[0]) e.target.files[0].text().then(t => { const n = addPupils(parsePupils(t)); save(); toast(n + ' pupils imported'); render(true); }); };

/* ---------- learner profile: sex and support needs (private, used for inclusive planning) ---------- */
const findPupil = id => { let r = null; S.classes.forEach(c => { const p = c.pupils.find(x => x.id === id); if (p) r = p; }); return r; };
X.views.learner = id => { const p = findPupil(id); return vLearner(id) + (p ? `<section class="card"><h2>Learning support needs</h2><p class="muted">Private. Used only to suggest inclusive teaching methods; never printed on lesson plans.</p><form class="form" data-form="pupilinfo" data-pid="${p.id}">${sel('Sex', 'sex', [['', '-'], ['M', 'Boy'], ['F', 'Girl']], p.sex)}${Object.entries(NEEDS).map(([k, t]) => `<label class="item"><span>${t}</span><input type="checkbox" name="need" value="${k}" style="width:auto"${(p.needs || []).includes(k) ? ' checked' : ''}></label>`).join('')}<button class="btn btn-solid">Save</button></form></section>` : ''); };
X.forms.pupilinfo = f => { const p = findPupil(f.dataset.pid); p.sex = f.sex.value; p.needs = new FormData(f).getAll('need'); };
