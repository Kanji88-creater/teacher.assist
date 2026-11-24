const $ = s => document.querySelector(s);
const ACC = 'td-account', USER = 'td-user';
let mode = 'signup';
const accounts = () => { try { return JSON.parse(localStorage.getItem(ACC)) || []; } catch (e) { return []; } };
async function hash(t) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { return btoa(unescape(encodeURIComponent(t))); }
}
function setMode(m) {
  mode = m;
  $('#tSignup').setAttribute('aria-selected', m === 'signup'); $('#tLogin').setAttribute('aria-selected', m === 'login');
  $('#nameRow').hidden = m === 'login'; $('#go').textContent = m === 'signup' ? 'Create account' : 'Log in'; $('#err').textContent = '';
}
$('#tSignup').onclick = () => setMode('signup');
$('#tLogin').onclick = () => setMode('login');
$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, email = f.email.value.trim().toLowerCase(), h = await hash(f.pw.value), list = accounts();
  if (mode === 'signup') {
    const name = f.name.value.trim();
    if (!name) { $('#err').textContent = 'Enter your name.'; return; }
    if (list.some(a => a.email === email)) { $('#err').textContent = 'An account with this email already exists. Log in instead.'; return; }
    list.push({ name, email, h });
    try { localStorage.setItem(ACC, JSON.stringify(list)); localStorage.setItem(USER, name); } catch (x) { $('#err').textContent = 'Your browser blocked saving. Allow site data and try again.'; return; }
  } else {
    const a = list.find(x => x.email === email && x.h === h);
    if (!a) { $('#err').textContent = 'Email or password is incorrect.'; return; }
    localStorage.setItem(USER, a.name);
  }
  location.href = 'dashboard.html';
});
function showSession() {
  const u = localStorage.getItem(USER);
  $('#openBox').hidden = !u; $('#formBox').hidden = !!u;
  if (u) $('#welcome').textContent = 'Signed in as ' + u + '.';
}
$('#out').onclick = () => { localStorage.removeItem(USER); showSession(); };
setMode('signup'); showSession();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
