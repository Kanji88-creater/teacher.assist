/* Teaching materials, scanner (with PDF), AI assistant and printable test papers. Needs data.js, zambia.js, files.js, extra.js. */

/* developer CSV import and scanner file picker share the change handler */
const prevChange = X.change;
X.change = e => {
  if (prevChange) prevChange(e);
  const t = e.target;
  if (t.id === 'devCsv' && t.files[0]) t.files[0].text().then(txt => { try { toast(importCsv(txt) + ' schemes imported'); } catch (x) { toast('Could not read that CSV file'); } render(true); });
  if (t.id === 'scanFile' && t.files.length) addScanFiles([...t.files]).then(() => { t.value = ''; });
};

/* ================= Teaching materials ================= */
const KINDS = { textbook: 'Textbook', paper: 'Past paper', syllabus: 'Syllabus', scheme: 'Scheme of work', notes: 'Notes', scan: 'Scanned document', other: 'Other' };
const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const subjList = `<datalist id="subjList">${SUBJECTS.map(s => `<option value="${esc(s)}">`).join('')}</datalist>`;

X.views.materials = () => head('Teaching materials') + `
  <section class="card"><h2>Upload books and past papers</h2>
  <p class="muted">Files are kept on this device. Add the topics each file covers so the app can suggest it when you plan a lesson. The app cannot read inside PDFs, so it matches on the title, subject and topics you type.</p>
  <form class="form" data-form="materials">
    <label>Files<input type="file" name="upload" multiple required></label>
    ${sel('Type', 'kind', Object.entries(KINDS).filter(([k]) => k !== 'scan'))}
    ${fld('Subject', 'subject', '', 'text', 'list="subjList"')}${subjList}
    ${fld('Grade', 'grade')}
    ${fld('Topics covered (separate with commas)', 'topics')}
    <button class="btn btn-solid">Upload</button></form></section>
  <section class="card"><h2>Find materials and teaching aids for a topic</h2><div class="form">
    ${fld('Subject', 'fSubject', '', 'text', 'list="subjList"')}${fld('Topic', 'fTopic')}
    <button class="btn btn-outline" type="button" data-act="matFind">Find</button></div><div id="findOut"></div></section>
  <section><h2>My library</h2><div id="lib" class="stack"><p class="muted">Loading...</p></div><p class="muted" id="storage"></p></section>`;
X.noRender.materials = true;
X.forms.materials = async f => {
  let n = 0;
  for (const file of [...f.upload.files]) {
    try { await filePut({ id: uid(), name: file.name, mime: file.type, size: file.size, kind: f.kind.value, subject: f.subject.value.trim(), grade: f.grade.value.trim(), topics: f.topics.value.trim(), date: iso(new Date()), blob: file }); n++; }
    catch (e) { toast('Could not store ' + file.name + '. The device may be out of space.'); }
  }
  if (n) { toast(n + ' file(s) uploaded'); f.reset(); }
  loadLib();
};
const libItem = m => `<div class="item col"><div class="row"><span><b>${esc(m.name)}</b><small>${KINDS[m.kind] || 'File'}${m.subject ? ' · ' + esc(m.subject) : ''}${m.grade ? ' · Grade ' + esc(m.grade) : ''} · ${fmtSize(m.size)}</small></span></div>${m.topics ? `<small><b>Topics:</b> ${esc(m.topics)}</small>` : ''}<div class="btns"><button class="btn btn-solid btn-sm" data-act="matOpen" data-id="${m.id}">Open</button><button class="btn btn-outline btn-sm" data-act="matSave" data-id="${m.id}">Download</button><button class="btn btn-danger btn-sm" data-act="matDel" data-id="${m.id}">Delete</button></div></div>`;
async function loadLib() {
  const box = $('#lib'); if (!box) return;
  let list = [];
  try { list = await fileAll(); } catch (e) { box.innerHTML = '<p class="muted">This browser blocked file storage.</p>'; return; }
  list.sort((a, b) => b.date.localeCompare(a.date));
  box.innerHTML = list.map(libItem).join('') || '<p class="muted">No files yet. Upload a book or past paper above.</p>';
  try { const e = await navigator.storage.estimate(); $('#storage').textContent = 'Storage used on this device: ' + fmtSize(e.usage || 0) + (e.quota ? ' of about ' + fmtSize(e.quota) : ''); } catch (x) {}
}
X.after.materials = loadLib;
async function findMaterials(subject, topic) {
  const words = ((subject || '') + ' ' + (topic || '')).toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
  const list = await fileAll().catch(() => []);
  return list.filter(m => { const hay = (m.name + ' ' + m.subject + ' ' + m.topics).toLowerCase(); return words.some(w => hay.includes(w)); });
}
X.acts.matFind = async () => {
  const s = document.querySelector('[name=fSubject]').value, t = document.querySelector('[name=fTopic]').value, hits = await findMaterials(s, t);
  $('#findOut').innerHTML = '<h3>Your materials</h3>' + (hits.length ? hits.map(m => item('', esc(m.name), (KINDS[m.kind] || '') + (m.topics ? ' · ' + esc(m.topics) : ''), '')).join('') : '<p class="muted">No matching files. Upload books or past papers for this topic.</p>') + '<h3>Teaching aids, cheapest first</h3>' + aidsHtml(suggestAids(s, t));
};
X.acts.matOpen = async d => { const m = await fileGet(d.id); if (m) window.open(URL.createObjectURL(m.blob), '_blank'); };
X.acts.matSave = async d => { const m = await fileGet(d.id); if (!m) return; const a = document.createElement('a'); a.href = URL.createObjectURL(m.blob); a.download = m.name; a.click(); };
X.acts.matDel = async d => { if (confirm('Delete this file?')) { await fileDel(d.id); loadLib(); loadSaved(); } };

/* ================= Scanner ================= */
let scanPages = [], stream = null;
X.views.scan = () => head('Scan documents') + `
  <section class="card form noprint">
    <video id="cam" playsinline autoplay muted style="width:100%;border-radius:12px;background:#000;display:none"></video>
    <div class="btns"><button class="btn btn-solid" type="button" data-act="camStart">Open camera</button><button class="btn btn-solid" type="button" id="shot" data-act="camShot" hidden>Capture page</button></div>
    <label>Or take or choose photos<input type="file" id="scanFile" accept="image/*" multiple capture="environment"></label>
    <label class="item"><span>Document mode (black and white, sharper text)</span><input type="checkbox" id="docMode" checked style="width:auto"></label>
    <p class="muted">Tip: lay the page flat in good light and fill the frame. Scanned PDFs are saved in your library under Teaching materials.</p>
  </section>
  <section><h2>Pages (<span id="pgCount">0</span>)</h2><div id="pages" class="scanGrid"></div>
  <div class="form noprint" style="margin-top:12px"><label>Document name<input id="scanName" placeholder="e.g. Grade 11A Physics Test 1"></label>
  <div class="btns"><button class="btn btn-solid" data-act="scanSave">Save as PDF</button><button class="btn btn-outline" data-act="scanPrint">Print</button><button class="btn btn-danger" data-act="scanClear">Clear pages</button></div></div></section>
  <div id="scanPrint" class="only-print"></div>
  <section class="noprint"><h2>Saved scans</h2><div id="saved" class="stack"></div></section>`;
const procCanvas = (src, docMode) => {
  const w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height, sc = Math.min(1, 1600 / w);
  const c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(h * sc);
  const x = c.getContext('2d'); x.drawImage(src, 0, 0, c.width, c.height);
  if (docMode) { const im = x.getImageData(0, 0, c.width, c.height), d = im.data; for (let i = 0; i < d.length; i += 4) { let g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; g = (g - 120) * 1.7 + 150; g = g < 0 ? 0 : g > 255 ? 255 : g; d[i] = d[i + 1] = d[i + 2] = g; } x.putImageData(im, 0, 0); }
  return c;
};
function drawPages() {
  if (!$('#pages')) return;
  $('#pages').innerHTML = scanPages.map((p, i) => `<div class="scanItem"><img src="${p.url}" alt="Page ${i + 1}"><div class="btns"><button class="btn btn-outline btn-sm" data-act="pgRot" data-i="${i}">Rotate</button><button class="btn btn-danger btn-sm" data-act="pgDel" data-i="${i}">Remove</button></div></div>`).join('') || '<p class="muted">No pages yet.</p>';
  $('#pgCount').textContent = scanPages.length;
}
const addCanvas = c => { scanPages.push({ url: c.toDataURL('image/jpeg', 0.82), w: c.width, h: c.height }); drawPages(); };
async function addScanFiles(files) {
  for (const f of files) {
    const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = URL.createObjectURL(f); });
    if (img) addCanvas(procCanvas(img, $('#docMode').checked));
  }
}
X.acts.camStart = async () => {
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); const v = $('#cam'); v.srcObject = stream; v.style.display = 'block'; $('#shot').hidden = false; }
  catch (e) { toast('Camera not available here. Use the photo picker below, which opens your phone camera.'); }
};
X.acts.camShot = () => { const v = $('#cam'); if (v && v.videoWidth) addCanvas(procCanvas(v, $('#docMode').checked)); };
X.acts.pgDel = d => { scanPages.splice(+d.i, 1); drawPages(); };
X.acts.pgRot = d => {
  const p = scanPages[+d.i], img = new Image();
  img.onload = () => { const c = document.createElement('canvas'); c.width = img.height; c.height = img.width; const x = c.getContext('2d'); x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(img, 0, 0); scanPages[+d.i] = { url: c.toDataURL('image/jpeg', 0.82), w: c.width, h: c.height }; drawPages(); };
  img.src = p.url;
};
X.acts.scanClear = () => { scanPages = []; drawPages(); };
X.acts.scanPrint = () => { if (!scanPages.length) { toast('Add a page first'); return; } $('#scanPrint').innerHTML = scanPages.map(p => `<img src="${p.url}" style="width:100%;page-break-after:always">`).join(''); window.print(); };
function makePdf(pages) {
  const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const put = d => { const b = typeof d === 'string' ? enc.encode(d) : d; parts.push(b); len += b.length; };
  const begin = n => { offs[n] = len; put(n + ' 0 obj\n'); };
  const N = pages.length, kids = pages.map((_, i) => (5 + 3 * i) + ' 0 R').join(' ');
  put('%PDF-1.4\n');
  begin(1); put('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  begin(2); put(`<< /Type /Pages /Kids [${kids}] /Count ${N} >>\nendobj\n`);
  pages.forEach((p, i) => {
    const img = 3 + 3 * i, con = 4 + 3 * i, pg = 5 + 3 * i, sc = Math.min(555 / p.w, 802 / p.h), dw = p.w * sc, dh = p.h * sc, x = (595 - dw) / 2, y = (842 - dh) / 2;
    begin(img); put(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`); put(p.bytes); put('\nendstream\nendobj\n');
    const cs = `q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
    begin(con); put(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream\nendobj\n`);
    begin(pg); put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ${img} 0 R >> >> /Contents ${con} 0 R >>\nendobj\n`);
  });
  const total = 3 + 3 * N, xr = len;
  let t = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) t += String(offs[n]).padStart(10, '0') + ' 00000 n \n';
  put(t + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}
X.acts.scanSave = async () => {
  if (!scanPages.length) { toast('Add at least one page'); return; }
  const name = ($('#scanName').value.trim() || 'Scan ' + iso(new Date())).replace(/[\\/:*?"<>|]/g, '-');
  const blob = makePdf(scanPages.map(p => ({ ...p, bytes: Uint8Array.from(atob(p.url.split(',')[1]), ch => ch.charCodeAt(0)) })));
  try { await filePut({ id: uid(), name: name + '.pdf', mime: 'application/pdf', size: blob.size, kind: 'scan', subject: '', grade: '', topics: '', date: iso(new Date()), blob }); toast('PDF saved to your library'); }
  catch (e) { toast('Could not keep a copy here; downloading instead'); }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '.pdf'; a.click();
  scanPages = []; drawPages(); loadSaved();
};
async function loadSaved() {
  const box = $('#saved'); if (!box) return;
  const list = (await fileAll().catch(() => [])).filter(m => m.kind === 'scan').sort((a, b) => b.date.localeCompare(a.date));
  box.innerHTML = list.map(libItem).join('') || '<p class="muted">No saved scans yet.</p>';
}
X.after.scan = () => { drawPages(); loadSaved(); };

/* ================= AI assistant (with template fallback) ================= */
const AI_SYS = 'You are an assistant for teachers in Zambia. Follow the Zambian school system: primary Grades 1-7, junior secondary Grades 8-9, senior secondary Grades 10-12. Lesson plans have bio data, rationale, learning outcomes, teaching and learning aids (cheapest and easiest to find first), introduction, development, conclusion and evaluation. Plan for large classes (about 40 pupils), mixed abilities, and inclusion of learners with disabilities. Use simple clear English and examples from Zambian life. When asked for JSON, reply with JSON only and no other text.';
async function callAI(user) {
  const r = await fetch(S.settings.aiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(S.settings.aiCode ? { 'x-access-code': S.settings.aiCode } : {}) }, body: JSON.stringify({ system: AI_SYS, messages: [{ role: 'user', content: user }] }) });
  if (!r.ok) throw new Error('service returned ' + r.status);
  return (await r.json()).text || '';
}
const parseJson = t => JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
function draftPlan(f) {
  const t = f.topic, m = Math.max(20, Number(f.minutes) || 40), mn = k => Math.round(m * k), c = cls();
  return {
    topic: t, subtopic: '',
    rationale: `This lesson helps learners understand ${t} and use it in everyday situations in their community.`,
    outcomes: `By the end of the lesson, learners should be able to:\n1. Explain the meaning of ${t} in their own words.\n2. Give examples of ${t} from their surroundings.\n3. Apply what they have learnt to complete a simple task on ${t}.`,
    prior: `What learners already know from the previous lesson and from everyday life about ${t}.`,
    aids: suggestAids(f.subject, t).slice(0, 6).map(a => '- ' + a.n).join('\n'),
    refs: "Learner's book and teacher's guide for the grade; relevant past examination papers.",
    intro: `(${mn(0.1)} min) Greet learners and check attendance. Recall the previous lesson with two quick questions. Ask a question that links ${t} to something learners have seen at home or in the community.`,
    development: `(${mn(0.65)} min)\n1. Introduce the key ideas of ${t} using a demonstration or real objects.\n2. Learners work in mixed-ability groups of 5 to 6 on a short task; give each member a role.\n3. Groups report back; correct misconceptions.\n4. Individual practice with basic, core and extension questions so every learner can take part.`,
    conclusion: `(${mn(0.1)} min) Summarise the main points with learners. Give a short home task.`,
    evaluation: `(${mn(0.15)} min) Ask three oral or written questions on ${t}. Mark a sample of books and note learners who need re-teaching.`,
    inclusion: inclusionText(c ? classNeeds(c) : [])
  };
}
function draftTest(f) {
  const t = f.topic;
  return { title: 'Test: ' + t, total: 20, guide: 'Award marks for correct, relevant points. Accept answers in the learner\'s own correct words.', items: [
    { section: 'A', q: `State the meaning of ${t}.`, marks: 2 }, { section: 'A', q: `Give two examples of ${t} from your surroundings.`, marks: 2 }, { section: 'A', q: `Name three things you must know about ${t}.`, marks: 3 },
    { section: 'B', q: `Explain how ${t} is used in everyday life.`, marks: 4 }, { section: 'B', q: `Describe one problem that can be solved using ${t}. Show how.`, marks: 4 },
    { section: 'C', q: `Discuss why ${t} is important to your community.`, marks: 5 }] };
}
X.views.assistant = () => head('AI assistant') + `
  <p class="muted noprint">${S.settings.aiUrl ? 'AI service connected.' : 'No AI service is connected, so you will get template drafts. The developer can connect one in Settings.'}</p>
  <section class="card noprint"><form class="form" id="aiForm">
    ${sel('What do you need?', 'mode', [['plan', 'Lesson plan'], ['test', 'Test or assessment'], ['ask', 'Ask a question']])}
    ${fld('Subject', 'subject', qs('subject') || '', 'text', 'list="subjList"')}${subjList}
    ${fld('Grade or class', 'grade', (cls() || {}).name || '')}
    ${fld('Topic', 'topic', qs('topic') || '')}
    ${fld('Lesson length (minutes)', 'minutes', '40', 'number', 'min="10"')}
    ${area('Extra instructions, or your question', 'notes', '', 3)}
    <button type="button" class="btn btn-solid" data-act="aiRun">Create</button></form></section>
  <div id="aiOut"></div>`;
let AIOUT = null;
const PLAN_LABELS = [['rationale', 'Rationale'], ['outcomes', 'Learning outcomes'], ['prior', 'Prerequisite knowledge'], ['aids', 'Teaching and learning aids'], ['refs', 'References'], ['intro', 'Introduction'], ['development', 'Development'], ['conclusion', 'Conclusion'], ['evaluation', 'Evaluation'], ['inclusion', 'Inclusion: all abilities and disabilities']];
const nl2br = s => esc(s || '').replace(/\n/g, '<br>');
function renderAi(o, note) {
  const d = o.data, warn = note ? `<p class="muted"><b>${esc(note)}</b></p>` : '';
  if (o.mode === 'plan') return `<section class="card">${warn}<h2>${esc(d.topic || o.info.topic)}</h2>${PLAN_LABELS.map(([k, l]) => d[k] ? `<h3>${l}</h3><p>${nl2br(d[k])}</p>` : '').join('')}<div class="btns noprint"><button class="btn btn-solid" data-act="aiSavePlan">Save as lesson plan</button></div></section>`;
  return `<section class="card">${warn}<h2>${esc(d.title)}</h2>${(d.items || []).map((i, n) => `<p>${n + 1}. ${esc(i.q)} <b>(${i.marks})</b></p>`).join('')}<p><b>Total: ${esc(String(d.total))} marks</b></p>${d.guide ? `<h3>Marking guide</h3><p>${nl2br(d.guide)}</p>` : ''}<div class="btns noprint"><button class="btn btn-solid" data-act="aiSaveTest">Save as assessment</button><button class="btn btn-outline" data-act="print">Print</button></div></section>`;
}
X.acts.aiRun = async () => {
  const f = document.querySelector('#aiForm'), v = n => f[n].value.trim(), mode = v('mode'), out = $('#aiOut');
  if (mode !== 'ask' && !v('topic')) { toast('Enter a topic'); return; }
  const info = { subject: v('subject'), grade: v('grade'), topic: v('topic'), minutes: v('minutes'), notes: v('notes') }, c = cls();
  if (mode === 'ask' && !S.settings.aiUrl) { out.innerHTML = '<div class="card"><p>Questions need a connected AI service. Ask the developer to connect one in Settings. You can still create template lesson plans and tests here.</p></div>'; return; }
  out.innerHTML = '<p class="muted">Working...</p>';
  let data = null, note = '';
  try {
    if (S.settings.aiUrl) {
      const mats = (await findMaterials(info.subject, info.topic)).slice(0, 8).map(m => m.name).join('; ');
      const needs = c ? classNeeds(c).map(k => NEEDS[k]).join('; ') : '';
      const ctx = `Grade or class: ${info.grade}. Subject: ${info.subject}. Topic: ${info.topic}. Lesson length: ${info.minutes} minutes. Class size: about ${c ? (c.pupils.length || c.size) : 40}. Learner needs in this class: ${needs || 'none recorded'}. Teacher's uploaded materials that may help: ${mats || 'none'}. Extra instructions: ${info.notes || 'none'}.`;
      if (mode === 'plan') data = parseJson(await callAI(ctx + '\nWrite a lesson plan as JSON with these string keys only: topic, subtopic, rationale, outcomes, prior, aids, refs, intro, development, conclusion, evaluation, inclusion. In aids list the cheapest and easiest to find aids first. In inclusion give practical adaptations for learners with visual, hearing, physical, learning and intellectual difficulties, albinism, and for gifted learners.'));
      else if (mode === 'test') data = parseJson(await callAI(ctx + '\nWrite a test as JSON: {"title": string, "total": number, "items": [{"section": "A", "q": string, "marks": number}], "guide": string}. The marks must add up to total.'));
      else { out.innerHTML = `<section class="card"><p>${nl2br(await callAI(ctx + '\nQuestion: ' + info.notes))}</p></section>`; return; }
    } else { data = mode === 'plan' ? draftPlan(info) : draftTest(info); note = 'Template draft (no AI service connected). Edit it before use.'; }
  } catch (e) {
    if (mode === 'ask') { out.innerHTML = `<div class="card"><p>The AI service did not answer (${esc(e.message)}). Try again.</p></div>`; return; }
    data = mode === 'plan' ? draftPlan(info) : draftTest(info); note = 'The AI service did not answer (' + e.message + '). Showing a template draft instead.';
  }
  AIOUT = { mode, data, info }; out.innerHTML = renderAi(AIOUT, note);
};
X.acts.aiSavePlan = () => {
  const { data: d, info } = AIOUT, c = cls(), id = uid();
  S.plans.push({ id, classId: c.id, title: d.topic || info.topic, subtopic: d.subtopic || '', subject: info.subject, grade: info.grade || c.name, date: iso(new Date()), duration: info.minutes, rationale: d.rationale || '', outcomes: d.outcomes || '', prior: d.prior || '', aids: d.aids || '', refs: d.refs || '', intro: d.intro || '', development: d.development || '', conclusion: d.conclusion || '', evaluation: d.evaluation || '', inclusion: d.inclusion || '', objectives: d.outcomes || '', activities: d.development || '', remarks: '', status: 'draft' });
  save(); location.href = 'plan-view.html?id=' + id;
};
X.acts.aiSaveTest = () => {
  const { data: d, info } = AIOUT, c = cls(), items = (d.items || []).map(i => ({ section: i.section || '', q: i.q, marks: Number(i.marks) || 1 }));
  S.assess.push({ id: uid(), classId: c.id, title: d.title || 'Test: ' + info.topic, type: 'test', date: iso(new Date()), max: items.reduce((a, i) => a + i.marks, 0) || Number(d.total) || 20, scores: {}, questions: items, guide: d.guide || '' });
  save(); location.href = 'assessments.html';
};

/* ================= Printable test paper ================= */
X.views.paper = () => {
  const a = S.assess.find(x => x.id === qs('id'));
  if (!a || !a.questions) return head('Test paper') + '<p class="muted">Test paper not found.</p><a class="btn btn-outline" href="assessments.html">Back</a>';
  const c = S.classes.find(x => x.id === a.classId) || { name: '' };
  let last = '';
  return head('Test paper') + printBtn('<a class="btn btn-outline" href="assessments.html">Back</a>') + `<article class="doc">${docHead(a.title.toUpperCase(), esc(c.name) + ' · ' + fmtD(a.date) + ' · Total: ' + a.max + ' marks')}
    <p>Name: ______________________________ &nbsp; Class: ____________ &nbsp; Score: ______ / ${a.max}</p>
    <p><i>Answer all questions. Show your working where needed.</i></p>
    ${a.questions.map((q, i) => { const h = q.section && q.section !== last ? `<h3>Section ${esc(q.section)}</h3>` : ''; last = q.section || last; return h + `<p>${i + 1}. ${esc(q.q)} <b>(${q.marks} mark${q.marks === 1 ? '' : 's'})</b></p><p style="border-bottom:1px solid #999;height:28px"></p>`; }).join('')}</article>
    ${a.guide ? `<section class="card noprint"><h2>Marking guide (not printed with the paper)</h2><p>${nl2br(a.guide)}</p></section>` : ''}`;
};
