/* Zambian standards, teaching aids, inclusion, reminders and extra charts. Needs data.js first. */

/* ---- Standards used as defaults ---- */
const LEVELS = { primary: 'Primary (Grades 1-7)', junior: 'Junior Secondary (Grades 8-9)', senior: 'Senior Secondary (Grades 10-12)' };
const DEFAULT_CLASS_SIZE = 40; // Ministry rule: no more than 40 pupils per teacher at primary; 42 is the junior secondary target
const SUBJECTS = ['English', 'Mathematics', 'Integrated Science', 'Science', 'Social Studies', 'Civic Education', 'Religious Education', 'Zambian Languages', 'Creative and Technology Studies', 'Home Economics', 'Physical Education', 'Music', 'Art and Design', 'Design and Technology', 'ICT', 'Business Studies', 'Physics', 'Chemistry', 'Biology', 'Additional Mathematics', 'Geography', 'History', 'Literature in English', 'Commerce', 'Principles of Accounts', 'Agricultural Science', 'Computer Studies', 'Food and Nutrition', 'Fashion and Fabrics'];

/* ---- Teaching aids: cheapest and easiest to find first ---- */
const TIERS = ['Free: found around you', 'Very low cost: made or bought locally', 'Low cost: stationery and school stock', 'School resources: laboratory, library, charts', 'Digital: needs power or data'];
const A = (n, t, tags, use, acc) => ({ n, t, tags: tags.split(' '), use, acc });
const AIDS = [
  A('Chalkboard drawings and diagrams', 0, 'all', 'Draw key ideas large and neat; use coloured chalk for labels.', 'Say aloud everything you write or draw; write large; seat low-vision learners near the board.'),
  A('Learners themselves: role play, movement, action songs', 0, 'all', 'Act out the idea (a market, a river, a circuit, a story).', 'Give every learner a role they can do; use verbal cues for learners with low vision; sign or gesture for learners with hearing loss.'),
  A('Stones, bottle tops, sticks, seeds, maize cobs', 0, 'maths science', 'Count, group, sort, measure and model with real objects.', 'Real objects can be felt, so they work well for learners with visual impairment.'),
  A('School grounds and surroundings: nature walk, garden, weather', 0, 'science social', 'Observe, collect and record real examples outside the classroom.', 'Plan an accessible route; pair learners with a buddy; use shade for learners with albinism.'),
  A('Local stories, songs, proverbs and resource persons', 0, 'language social arts', 'Use stories and songs from the community to build vocabulary and ideas.', 'Allow answers in a Zambian language first; repeat key words slowly.'),
  A('Water, sand, soil, ash and clay', 0, 'science arts maths', 'Demonstrate mixing, flow, mass, shape and measuring.', 'Hands-on work helps learners with learning difficulties.'),
  A('Pupils\' exercise books, peer teaching and group work', 0, 'all', 'Mixed-ability groups of 5 to 6; learners explain to each other.', 'Pair a learner who needs help with a supportive peer; give each member a role.'),
  A('Waste materials: cartons, newspaper, plastic bottles, tins', 0, 'all', 'Make models, containers and measuring tools.', 'Make models with different textures so they can be felt.'),
  A('Hand-drawn charts on manila paper or old calendars', 1, 'all', 'Prepare charts before the lesson and keep them for revision.', 'Use thick dark markers and large letters; read the chart aloud.'),
  A('Number lines, place-value cards and fraction strips from cardboard', 1, 'maths', 'Cut from cardboard or paper; learners handle and compare them.', 'Add raised marks or string for touch; use bold colours.'),
  A('Flash cards for words, letters and symbols', 1, 'language maths', 'Quick recall, matching and sorting games.', 'Add pictures; use large print; allow pointing instead of speaking.'),
  A('Counters and an abacus made from beads or bottle tops on string', 1, 'maths', 'Counting, addition, subtraction and place value.', 'Touch-based, so suitable for learners with visual impairment.'),
  A('Locally made measuring tools: string tape, bottle jugs, balance from a hanger', 1, 'maths science', 'Measure length, volume and mass with improvised tools.', 'Mark scales with notches or tape so they can be felt.'),
  A('Magnet, torch bulb, battery and wire for simple circuits', 1, 'science', 'Improvised experiments with electricity and magnetism.', 'Describe what is happening aloud; let learners handle the parts.'),
  A('Clay or cardboard models (cells, shapes, solar system)', 1, 'science maths', 'Learners build models to explain structure.', 'Models give a touch-based way to learn; label with large print and a spoken description.'),
  A('Sketch maps and sand-tray maps', 1, 'social', 'Draw the school area, then a district or country.', 'Use string or glue to make raised borders for touch.'),
  A('Textbooks, teacher\'s guides and past examination papers', 2, 'all', 'Use for examples, exercises and exam-style questions (upload them in Teaching materials).', 'Provide large-print or read-aloud sections; share one book between a group.'),
  A('Geometry set, protractor, compass and graph paper', 2, 'maths', 'Construction, angles, graphs and data.', 'Use a tactile ruler or pre-marked templates for learners with low vision.'),
  A('Newspapers and magazines', 2, 'language social', 'Real reading texts, advertisements and data.', 'Choose short passages; pair readers with listeners.'),
  A('Atlas and wall maps', 2, 'social', 'Locate places and compare regions.', 'Describe the map aloud; use enlarged copies.'),
  A('Hand lens, thermometer, simple science kit', 2, 'science', 'Observe small details; measure temperature.', 'Pair learners so one reads the instrument aloud.'),
  A('Laboratory apparatus and specimens', 3, 'science', 'Experiments and demonstrations.', 'Allow extra time; give clear step-by-step spoken instructions; make benches reachable.'),
  A('Library readers and story books', 3, 'language', 'Reading practice and comprehension.', 'Provide large-print or audio versions where possible.'),
  A('Wall charts and posters (periodic table, body systems, map of Zambia)', 3, 'science social', 'Display and refer to during the lesson.', 'Describe the content aloud; provide a small copy for learners who sit far back.'),
  A('Musical instruments and art materials', 3, 'arts', 'Practical creative work.', 'Offer different ways to take part: playing, singing, drawing, describing.'),
  A('Scientific calculator and phone calculator', 4, 'maths science', 'Check calculations and handle data.', 'Use talking calculator apps for learners with visual impairment.'),
  A('Radio or audio lessons', 4, 'all', 'Use recorded or broadcast lessons.', 'Helps learners with visual impairment; provide a written summary for learners with hearing loss.'),
  A('Offline videos and simulations on a phone, tablet or computer', 4, 'science maths social', 'Show processes that are hard to see in class.', 'Switch on captions; describe the images aloud.'),
  A('Computers and offline learning apps', 4, 'ict all', 'Practice and research where power and devices exist.', 'Use screen readers, larger text and high contrast settings.')
];
function suggestAids(subject, topic) {
  const s = (subject + ' ' + topic).toLowerCase(), want = [];
  if (/math|algebra|geometr|number|fraction|statist|trigon|mensur|equation/.test(s)) want.push('maths');
  if (/science|physic|chem|bio|agric|energy|force|cell|plant|animal|electric|light|heat|motion|magnet/.test(s)) want.push('science');
  if (/english|language|read|writ|comprehens|literat|grammar|cinyanja|chibemba|chitonga|silozi|kiikaonde|lunda|luvale|nyanja|bemba|tonga/.test(s)) want.push('language');
  if (/social|geograph|histor|civic|map|religio|commerce|business|account|economic/.test(s)) want.push('social');
  if (/art|music|design|home econ|craft|technolog|fashion|food|nutrition|practical/.test(s)) want.push('arts');
  if (/ict|computer/.test(s)) want.push('ict');
  return AIDS.map((a, i) => ({ ...a, i })).filter(a => a.tags.includes('all') || a.tags.some(t => want.includes(t))).sort((a, b) => a.t - b.t || a.i - b.i);
}

/* ---- Inclusion: learners of all abilities and disabilities ---- */
const NEEDS = { vi: 'Visual impairment or low vision', hi: 'Hearing impairment', pd: 'Physical disability', ld: 'Learning difficulty', id: 'Intellectual disability', sc: 'Speech or communication difficulty', alb: 'Albinism (low vision, sun sensitivity)', gift: 'Gifted or advanced learner', lang: 'Learning in a second language' };
const UNIVERSAL = [
  'Teach each idea in more than one way: show it, say it, and let learners do it.',
  'Use mixed-ability groups and pair work so learners help each other, which also copes with large classes.',
  'Set tasks at three levels (basic, core, extension) so every learner can succeed.',
  'Give short, clear instructions; repeat them and check understanding often.',
  'Make sure girls and boys, and quiet learners, all get turns to answer.',
  'Seat learners who need to see or hear better near the front.'
];
const TIPS = {
  vi: ['Read aloud everything you write; describe pictures and diagrams.', 'Use large, bold, high-contrast print and tactile materials such as cut-outs and string diagrams.', 'Give extra time and a buddy to help with copying.'],
  hi: ['Face the class when speaking and keep your face lit; seat the learner near the front.', 'Write key words and instructions on the board; use pictures, gestures and demonstrations.', 'Repeat other learners\' answers; use Zambian Sign Language where a signer or a peer can help.'],
  pd: ['Make the seating, paths and materials reachable.', 'Allow alternatives to writing, such as oral answers or a scribe.', 'Adapt practical tasks and give group roles the learner can do; allow extra time.'],
  ld: ['Break tasks into small steps; use real objects before symbols.', 'Repeat with different examples; revise often.', 'Praise small steps of progress and give short, achievable tasks.'],
  id: ['Use simple language and one instruction at a time.', 'Link tasks to real-life activities; repeat often.', 'Set simpler outcomes for the same topic and give short individual support time.'],
  sc: ['Accept pointing, drawing or writing as answers.', 'Give thinking time; use picture cards and pair talk first.'],
  alb: ['Seat close to the board, away from glare; use large print and high contrast.', 'Protect from strong sun during outdoor lessons: shade, hat, long sleeves.'],
  gift: ['Give extension tasks and higher-order questions.', 'Let the learner explain to peers or lead a group.'],
  lang: ['Explain key ideas in a familiar Zambian language when helpful; give key English words with pictures.', 'Speak slowly; allow oral answers before written ones; pair with a supportive peer.']
};
const classNeeds = c => { const s = new Set(); c.pupils.forEach(p => (p.needs || []).forEach(n => s.add(n))); return [...s]; };
function inclusionText(keys) {
  const out = ['For all learners:'].concat(UNIVERSAL.map(t => '- ' + t));
  (keys || []).forEach(k => { if (TIPS[k]) { out.push('', NEEDS[k] + ':'); TIPS[k].forEach(t => out.push('- ' + t)); } });
  return out.join('\n');
}

/* ---- Reminders: what needs improvement and what is due ---- */
function alerts() {
  const out = [], today = iso(new Date()), rd = (S.settings && S.settings.reviewDays) || 7;
  S.classes.forEach(c => {
    const as = S.assess.filter(a => a.classId === c.id && assAvg(a) != null).sort((a, b) => a.date.localeCompare(b.date));
    if (as.length) { const l = as[as.length - 1], m = Math.round(assAvg(l)); if (m < 50) out.push({ lvl: 'high', text: c.name + ': ' + l.title + ' averaged ' + m + '%. Improvement is needed.', link: 'reports.html' }); }
    if (as.length >= 3) { const v = as.slice(-3).map(assAvg); if (v[0] > v[1] && v[1] > v[2]) out.push({ lvl: 'med', text: c.name + ': the class average has fallen for three assessments in a row.', link: 'reports.html' }); }
    const low = [], drop = [];
    c.pupils.forEach(p => {
      const sc = as.filter(a => a.scores[p.id] != null).map(a => a.scores[p.id] / a.max * 100);
      if (!sc.length) return;
      if (avg(sc) < 50) low.push(p); else if (sc.length >= 2 && sc[sc.length - 2] - sc[sc.length - 1] >= 15) drop.push(p);
    });
    if (low.length) out.push({ lvl: 'med', text: low.length > 3 ? low.length + ' pupils in ' + c.name + ' are averaging below 50%. Plan extra support.' : low.map(p => p.name).join(', ') + ' (' + c.name + ') averaging below 50%. Plan extra support.', link: 'reports.html' });
    if (drop.length) out.push({ lvl: 'med', text: drop.length > 3 ? drop.length + ' pupils in ' + c.name + ' dropped 15 points or more in the last assessment.' : drop.map(p => p.name).join(', ') + ' (' + c.name + ') dropped 15 points or more in the last assessment.', link: 'reports.html' });
    const cut = iso(addDays(new Date(), -14)), abs = [];
    c.pupils.forEach(p => { let n = 0; Object.keys(S.att).forEach(k => { const [cid, d] = k.split('|'); if (cid === c.id && d >= cut && S.att[k][p.id] === 'A') n++; }); if (n >= 3) abs.push(p); });
    if (abs.length) out.push({ lvl: 'med', text: abs.length > 3 ? abs.length + ' pupils in ' + c.name + ' were absent 3 or more times in two weeks.' : abs.map(p => p.name).join(', ') + ' (' + c.name + ') absent 3 or more times in two weeks.', link: 'attendance.html' });
    if (c.pupils.length > (c.size || DEFAULT_CLASS_SIZE)) out.push({ lvl: 'low', text: c.name + ' has ' + c.pupils.length + ' pupils, above the standard of ' + (c.size || DEFAULT_CLASS_SIZE) + '.', link: 'learners.html' });
    const pend = S.assess.filter(a => a.classId === c.id && !Object.keys(a.scores).length && a.date < iso(addDays(new Date(), -7)));
    if (pend.length) out.push({ lvl: 'low', text: pend.length + ' assessment(s) in ' + c.name + ' still have no marks.', link: 'assessments.html' });
  });
  const lastWk = iso(addDays(mondayOf(new Date()), -7));
  S.classes.forEach(c => { if (S.assess.length || S.plans.length) { const r = S.records.find(x => x.classId === c.id && x.weekStart === lastWk); if (!r || !r.submittedOn) out.push({ lvl: 'med', text: 'Record of work for ' + c.name + ' (week of ' + lastWk + ') is not submitted yet.', link: 'records.html' }); } });
  S.records.forEach(r => {
    const cn = (S.classes.find(c => c.id === r.classId) || {}).name || 'class';
    if (r.submittedOn && !r.hod && today > iso(addDays(new Date(r.submittedOn + 'T00:00'), rd))) out.push({ lvl: 'high', text: 'HOD check is overdue: record of work for ' + cn + ', week of ' + r.weekStart + '.', link: 'records.html?id=' + r.id });
    if (r.hod && !r.dht && today > iso(addDays(new Date(r.hod.date + 'T00:00'), rd))) out.push({ lvl: 'high', text: 'Deputy Head check is overdue: record of work for ' + cn + ', week of ' + r.weekStart + '.', link: 'records.html?id=' + r.id });
  });
  S.reminders.filter(r => !r.done && r.due <= today).forEach(r => out.push({ lvl: 'med', text: 'Reminder: ' + r.title, link: 'reminders.html' }));
  return out;
}
function notify(msg) {
  try {
    if (navigator.serviceWorker && location.protocol !== 'file:') navigator.serviceWorker.ready.then(r => r.showNotification('Teacher Dashboard', { body: msg, icon: 'icon-192.png' }));
    else new Notification('Teacher Dashboard', { body: msg });
  } catch (e) {}
}

/* ---- Extra charts ---- */
function multiLine(labels, series) {
  const n = labels.length; if (!n) return '<p class="muted">No marks recorded yet.</p>';
  const X = i => n > 1 ? 34 + 290 * i / (n - 1) : 180, Y = v => 120 - v * 1.1, step = Math.ceil(n / 7);
  let s = '<svg viewBox="0 0 330 145" role="img" aria-label="Line graph of progress">';
  [0, 50, 100].forEach(g => { s += `<line x1="30" y1="${Y(g)}" x2="326" y2="${Y(g)}" stroke="#D5DBD6"${g === 50 ? ' stroke-dasharray="4 4"' : ''}/><text x="26" y="${Y(g) + 4}" style="text-anchor:end">${g}</text>`; });
  series.forEach(se => {
    let seg = [];
    const flush = () => { if (seg.length > 1) s += `<polyline fill="none" stroke="${se.color}" stroke-width="2.5" stroke-linejoin="round" points="${seg.join(' ')}"/>`; seg = []; };
    se.vals.forEach((v, i) => { if (v == null) flush(); else seg.push(X(i) + ',' + Y(v)); });
    flush();
    se.vals.forEach((v, i) => { if (v != null) s += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="${se.color}"/>`; });
  });
  labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) s += `<text x="${X(i)}" y="138">${esc(l)}</text>`; });
  return s + '</svg><ul class="legend">' + series.map(se => `<li style="color:${se.color}"><i class="dot"></i>${esc(se.name)}</li>`).join('') + '<li class="muted">Dashed line = 50% pass mark</li></ul>';
}
function donut(parts) {
  const tot = parts.reduce((a, p) => a + p.v, 0); if (!tot) return '<p class="muted">No marks recorded yet.</p>';
  const R = 40, C = 2 * Math.PI * R; let off = 0, s = '<svg viewBox="0 0 120 120" style="max-width:180px;display:block;margin:0 auto" role="img" aria-label="Pupils by performance band"><g transform="rotate(-90 60 60)">';
  parts.forEach(p => { const l = p.v / tot * C; s += `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${p.color}" stroke-width="18" stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-off}"/>`; off += l; });
  return s + `</g><text x="60" y="66" style="text-anchor:middle;font-size:18px;font-weight:700;fill:#1B2A26">${tot}</text></svg><ul class="legend">` + parts.map(p => `<li style="color:${p.color}"><i class="dot"></i>${p.label}: ${p.v}</li>`).join('') + '</ul>';
}
function classTrend(c) {
  const as = S.assess.filter(a => a.classId === c.id && assAvg(a) != null).sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  const pct = (a, f) => Math.round(f(...Object.values(a.scores)) / a.max * 100);
  return { as, labels: as.map(a => a.date.slice(5)), series: [
    { name: 'Class average', color: '#0F766E', vals: as.map(a => Math.round(assAvg(a))) },
    { name: 'Highest', color: '#15803D', vals: as.map(a => pct(a, Math.max)) },
    { name: 'Lowest', color: '#B91C1C', vals: as.map(a => pct(a, Math.min)) }] };
}
function trendNote(c) {
  const v = classTrend(c).series[0].vals; if (v.length < 2) return 'Record at least two assessments to see the trend.';
  const d = v[v.length - 1] - v[v.length - 2];
  return d > 0 ? 'Improving: up ' + d + ' points on the previous assessment.' : d < 0 ? 'Improvement needed: down ' + Math.abs(d) + ' points on the previous assessment.' : 'No change from the previous assessment.';
}
