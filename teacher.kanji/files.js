/* Stores uploaded books, past papers and scans on this device (IndexedDB). */
const dbOpen = () => new Promise((res, rej) => { const r = indexedDB.open('td-files', 1); r.onupgradeneeded = () => r.result.createObjectStore('files', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const dbTx = async (mode, fn) => { const db = await dbOpen(); return new Promise((res, rej) => { const t = db.transaction('files', mode), rq = fn(t.objectStore('files')); t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error); }); };
const filePut = rec => dbTx('readwrite', s => s.put(rec));
const fileAll = () => dbTx('readonly', s => s.getAll());
const fileGet = id => dbTx('readonly', s => s.get(id));
const fileDel = id => dbTx('readwrite', s => s.delete(id));
