// CellMate: real phone helper. Real business data (OpenStreetMap via Photon + Overpass), free AI (Pollinations via ai-helper.js),
// real tel:/sms: links on the user's own phone, and everything saved only in this browser (localStorage).
const $ = s => document.querySelector(s);
const screen = $('#screen'), logEl = $('#log');
const KEY = 'cellmate.v1';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const blank = () => ({ loc: '', geo: null, contacts: [], events: [], notes: [], jobs: [], cur: null });
let S; try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Storage is full. Delete some photos from Notes.'); } };
const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
const telHref = p => 'tel:' + String(p).replace(/[^\d+]/g, '');
const smsHref = (p, body) => 'sms:' + (p ? String(p).replace(/[^\d+]/g, '') : '') + (body ? (isApple ? '&' : '?') + 'body=' + encodeURIComponent(body) : '');
const gmaps = (q) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const job = () => S.jobs.find(j => j.id === S.cur);

function clock() { $('#clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/, ''); }
setInterval(clock, 10000); clock();
let t0 = Date.now();
function log(msg, cls = '') { if (logEl.querySelector('.muted')) logEl.innerHTML = ''; const li = document.createElement('li'); if (cls) li.className = cls;
  li.innerHTML = `<span class="t">${((Date.now() - t0) / 1000).toFixed(1)}s</span>${msg}`; logEl.appendChild(li); logEl.scrollTop = 1e9; return li; }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.add('hidden'), 2600); }

/* ---------- phone screens (all real data) ---------- */
const APPS = [['phone', 'Phone', '📞', '#22c55e'], ['messages', 'Messages', '💬', '#16a34a'], ['camera', 'Camera', '📷', '#4b5563'], ['maps', 'Maps', '🗺️', '#0ea5e9'],
  ['contacts', 'Contacts', '👥', '#f59e0b'], ['browser', 'Browser', '🌐', '#3b82f6'], ['calendar', 'Calendar', '📅', '#ef4444'], ['notes', 'Notes', '📝', '#eab308']];
function home() {
  const j = job(), next = S.events.filter(e => new Date(e.start) >= new Date(Date.now() - 36e5)).sort((a, b) => a.start.localeCompare(b.start))[0];
  screen.innerHTML = `<div class="home">
   <div class="widget"><div style="opacity:.8;font-size:12px">CELLMATE · YOUR PHONE HELPER</div><div class="big" id="wtask">${j ? esc(j.title) : 'Ready for a job'}</div>
   <div style="font-size:12px;opacity:.85">${S.contacts.length} contacts · ${next ? 'Next: ' + esc(next.title) + ' ' + new Date(next.start).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'Nothing booked'}</div></div>
   ${APPS.map(([id, n, i, c]) => `<button class="app" data-app="${id}"><span class="ic" style="background:${c}">${i}</span>${n}</button>`).join('')}
  </div>
  <div class="dock">${APPS.slice(0, 4).map(([id, n, i, c]) => `<button class="app" data-app="${id}" aria-label="${n}"><span class="ic" style="background:${c}">${i}</span></button>`).join('')}</div>`;
  screen.querySelectorAll('.app').forEach(b => b.onclick = () => openApp(b.dataset.app));
}
$('#homebar').onclick = home;
function view(title, inner, cls = '') { screen.innerHTML = `<div class="view ${cls}"><div class="vh">${title}<button class="ghost tiny" data-home style="color:#2563eb;border-color:#ccd">Home</button></div>${inner}</div>`;
  screen.querySelector('[data-home]').onclick = home; return screen.firstChild; }
function openApp(id, arg) {
  if (id === 'phone') return keypad(arg || '');
  if (id === 'contacts') return contactsView();
  if (id === 'messages') return messagesView();
  if (id === 'calendar') return calView(arg);
  if (id === 'notes') return notesView();
  if (id === 'maps') return mapView(arg);
  if (id === 'browser') return browserView(arg);
  if (id === 'camera') return camView();
}
function keypad(num) {
  view('Keypad', `<div class="keypad"><div class="num" id="num">${esc(num)}</div><div class="keys">${'123456789*0#'.split('').map(k => `<div class="key" data-k="${k}">${k}</div>`).join('')}</div>
    <a class="callbtn" id="kcall" href="#" aria-label="Call">📞</a><p class="empty" style="text-align:center">Opens your phone's dialer.</p></div>`);
  const upd = () => { const n = $('#num').textContent; $('#kcall').href = n ? telHref(n) : '#'; };
  screen.querySelectorAll('.key').forEach(k => k.onclick = () => { $('#num').textContent += k.dataset.k; upd(); });
  $('#num').ondblclick = () => { $('#num').textContent = ''; upd(); }; upd();
  $('#kcall').onclick = e => { if (!$('#num').textContent) { e.preventDefault(); toast('Type a number first'); } };
}
function contactsView() {
  view('Contacts', `<div class="body">${S.contacts.length ? S.contacts.map(c => `<div class="listi"><div>${esc(c.name)}<div class="sub">${esc(c.phone || 'no phone listed')}${c.addr ? ' · ' + esc(c.addr) : ''}</div></div>
    <div class="ra">${c.phone ? `<a href="${telHref(c.phone)}" aria-label="Call">📞</a><a href="${smsHref(c.phone)}" aria-label="Text">💬</a>` : ''}<a href="#" data-del="${c.id}" aria-label="Delete">🗑️</a></div></div>`).join('') : '<p class="empty">No contacts yet. Run a job to find businesses, or add one below.</p>'}</div>
    <form id="cAdd"><input name="n" placeholder="Name" required><input name="p" placeholder="Phone" type="tel" required><button class="pbtn">Add contact</button></form>`);
  screen.querySelectorAll('[data-del]').forEach(a => a.onclick = e => { e.preventDefault(); S.contacts = S.contacts.filter(c => c.id !== a.dataset.del); save(); contactsView(); });
  $('#cAdd').onsubmit = e => { e.preventDefault(); const f = e.target; S.contacts.unshift({ id: uid(), name: f.n.value.trim(), phone: f.p.value.trim(), src: 'you' }); save(); contactsView(); };
}
function messagesView() {
  const j = job(), list = j ? j.biz.filter(b => b.phone) : [];
  view('Messages<small>drafts open in your texting app</small>', `<div class="body">${j && j.plan ? `<div class="listi" style="display:block"><b>Text for this job</b><div class="sub" style="white-space:pre-wrap;color:#333">${esc(j.plan.text)}</div></div>` : ''}
   ${list.length ? list.map(b => `<a class="listi" href="${smsHref(b.phone, j.plan ? j.plan.text : '')}"><div>${esc(b.name)}<div class="sub">${esc(b.phone)}</div></div>›</a>`).join('') : '<p class="empty">Run a job and the businesses with phone numbers show up here with your text ready to send.</p>'}</div>`);
}
function fmtLocal(d) { const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }
function calView(prefill) {
  const ev = S.events.slice().sort((a, b) => a.start.localeCompare(b.start));
  const def = new Date(); def.setDate(def.getDate() + 1); def.setHours(10, 0, 0, 0);
  view(`Calendar<small>${new Date().toDateString()}</small>`, `<div class="body">${ev.length ? ev.map(e => `<div class="listi"><div>${esc(e.title)}<div class="sub">${new Date(e.start).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}${e.phone ? ' · ' + esc(e.phone) : ''}</div></div>
     <div class="ra"><a href="${gcal(e)}" target="_blank" rel="noopener" title="Add to Google Calendar">G</a><a href="#" data-ics="${e.id}" title="Download .ics">⤓</a><a href="#" data-del="${e.id}" title="Delete">🗑️</a></div></div>`).join('') : '<p class="empty">Nothing booked yet.</p>'}</div>
    <form id="eAdd"><input name="t" placeholder="What (e.g. Plumber visit)" required value="${esc(prefill?.title || '')}"><input name="d" type="datetime-local" required value="${fmtLocal(def)}"><input name="p" type="hidden" value="${esc(prefill?.phone || '')}"><button class="pbtn">Book it</button></form>`);
  screen.querySelectorAll('[data-del]').forEach(a => a.onclick = e => { e.preventDefault(); S.events = S.events.filter(x => x.id !== a.dataset.del); save(); calView(); });
  screen.querySelectorAll('[data-ics]').forEach(a => a.onclick = e => { e.preventDefault(); ics(S.events.find(x => x.id === a.dataset.ics)); });
  $('#eAdd').onsubmit = e => { e.preventDefault(); const f = e.target; const d = new Date(f.d.value); if (isNaN(d)) return toast('Pick a date and time');
    const evn = { id: uid(), title: f.t.value.trim(), start: d.toISOString(), phone: f.p.value, job: S.cur }; S.events.push(evn); save(); log(`📅 Booked <b>${esc(evn.title)}</b>, ${d.toLocaleString()}`, 'done'); calView(); renderReport(); toast('Booked. Tap G or ⤓ to add it to your real calendar.'); };
}
const icsDate = d => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
function gcal(e) { const s = new Date(e.start), en = new Date(s.getTime() + 36e5);
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(e.title) + '&dates=' + icsDate(s) + '/' + icsDate(en) + '&details=' + encodeURIComponent(e.phone ? 'Phone: ' + e.phone : 'Booked with CellMate'); }
function ics(e) { const s = new Date(e.start), en = new Date(s.getTime() + 36e5);
  const txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CellMate//EN', 'BEGIN:VEVENT', 'UID:' + e.id + '@cellmate', 'DTSTAMP:' + icsDate(Date.now()), 'DTSTART:' + icsDate(s), 'DTEND:' + icsDate(en), 'SUMMARY:' + e.title.replace(/[,;]/g, ' '), e.phone ? 'DESCRIPTION:Phone ' + e.phone : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
  download('cellmate-booking.ics', txt, 'text/calendar'); }
function download(name, text, type = 'text/plain') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function notesView() {
  view('Notes', `<div class="body">${S.notes.length ? S.notes.map(n => `<div class="listi" style="display:block"><div class="sub">${new Date(n.t).toLocaleString()}</div>${n.img ? `<img src="${n.img}" alt="photo" style="max-width:100%;border-radius:8px;margin:6px 0">` : ''}<div style="white-space:pre-wrap">${esc(n.text)}</div><a href="#" data-del="${n.id}">Delete</a></div>`).join('') : '<p class="empty">No notes yet.</p>'}</div>
    <form id="nAdd"><textarea name="x" rows="2" placeholder="Write a note" required></textarea><button class="pbtn">Save note</button></form>`);
  screen.querySelectorAll('[data-del]').forEach(a => a.onclick = e => { e.preventDefault(); S.notes = S.notes.filter(x => x.id !== a.dataset.del); save(); notesView(); });
  $('#nAdd').onsubmit = e => { e.preventDefault(); S.notes.unshift({ id: uid(), t: Date.now(), text: e.target.x.value.trim() }); save(); notesView(); };
}
function mapView(b) {
  const g = b && b.lat ? b : S.geo;
  if (!g) return view('Maps', '<p class="empty">Enter your town and run a job to see the map.</p>');
  const d = .02, bbox = [g.lon - d, g.lat - d, g.lon + d, g.lat + d].join(',');
  view(esc(b?.name || S.loc || 'Map'), `<div class="map"><iframe title="Map" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${g.lat},${g.lon}"></iframe>
    <div class="mapcard">${b ? `<b>${esc(b.name)}</b><br>${esc(b.addr || '')}<br>` : ''}<a style="color:#2563eb" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${g.lat},${g.lon}">Directions ↗</a></div></div>`);
}
function browserView(q) {
  const j = job(); q = q || (j ? (j.plan?.business || j.title) + ' near ' + (S.loc || '') : '');
  view('Browser', `<div class="body"><form id="bq" style="padding:0"><input name="q" value="${esc(q)}" placeholder="Search the web"><button class="pbtn">Search</button></form>
    ${q ? `<a class="listi" target="_blank" rel="noopener" href="https://duckduckgo.com/?q=${encodeURIComponent(q)}">DuckDuckGo: ${esc(q)} ↗</a>
    <a class="listi" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(q)}">Google: ${esc(q)} ↗</a>
    <a class="listi" target="_blank" rel="noopener" href="${gmaps(q)}">Google Maps: ${esc(q)} ↗</a>` : ''}</div>`);
  $('#bq').onsubmit = e => { e.preventDefault(); browserView(e.target.q.value.trim()); };
}
function camView() {
  view('Camera<small>proof photos go to Notes</small>', `<div class="cam" style="flex-direction:column;gap:12px;padding:20px"><label class="pbtn" style="width:80%">📷 Take or pick a photo<input id="camIn" type="file" accept="image/*" capture="environment" hidden></label><p class="empty" style="color:#aaa">Uses your phone's camera. The photo is shrunk and saved only in this browser.</p></div>`, 'dark');
  $('#camIn').onchange = async e => { const f = e.target.files[0]; if (!f) return; const img = await shrink(f);
    S.notes.unshift({ id: uid(), t: Date.now(), text: 'Photo' + (job() ? ' for: ' + job().title : ''), img }); save(); log('📷 Saved a photo to Notes', 'done'); notesView(); };
}
function shrink(file) { return new Promise(r => { const i = new Image(); i.onload = () => { const m = 640, k = Math.min(1, m / Math.max(i.width, i.height)), c = document.createElement('canvas');
  c.width = i.width * k; c.height = i.height * k; c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); r(c.toDataURL('image/jpeg', .7)); URL.revokeObjectURL(i.src); }; i.src = URL.createObjectURL(file); }); }

/* ---------- real business search (OpenStreetMap) ---------- */
const TAGS = [
  [/plumb|leak|pipe|drain|water heater/i, 'plumber', ['craft=plumber']], [/electric/i, 'electrician', ['craft=electrician']],
  [/hvac|heating|air.?condition|furnace|a\/c\b/i, 'HVAC', ['craft=hvac']], [/roof/i, 'roofer', ['craft=roofer']],
  [/lock ?smith|locked out/i, 'locksmith', ['shop=locksmith', 'craft=locksmith']], [/storage/i, 'storage units', ['shop=storage_rental']],
  [/mov(er|ing)/i, 'movers', ['office=moving_company', 'shop=moving']], [/tire|tyre/i, 'tire shop', ['shop=tyres']],
  [/mechanic|auto repair|car repair|brake|oil change|transmission|truck repair/i, 'auto repair', ['shop=car_repair']],
  [/tow/i, 'towing', ['shop=car_repair', 'office=towing']], [/pawn/i, 'pawn shop', ['shop=pawnbroker']], [/dentist|tooth/i, 'dentist', ['amenity=dentist']],
  [/\bvet\b|veterinar/i, 'veterinarian', ['amenity=veterinary']], [/pest|termite|exterminat/i, 'pest control', ['craft=pest_control']],
  [/lawn|landscap|yard|tree/i, 'landscaping', ['craft=gardener', 'shop=garden_centre']], [/clean/i, 'cleaning', ['craft=cleaning', 'shop=dry_cleaning']],
  [/handyman|odd job/i, 'handyman', ['craft=handyman']], [/paint/i, 'painter', ['craft=painter']], [/carpent|cabinet/i, 'carpenter', ['craft=carpenter']],
  [/appliance|washer|dryer|fridge/i, 'appliance repair', ['craft=electronics_repair', 'shop=appliance']], [/hardware|lumber|supplies/i, 'hardware store', ['shop=hardware', 'shop=doityourself']],
  [/glass|windshield/i, 'glass repair', ['craft=glaziery', 'shop=car_parts']], [/rental|rent a|truck rental|equipment/i, 'rental', ['amenity=car_rental', 'shop=rental']]];
function pickTags(text) { for (const [re, label, tags] of TAGS) if (re.test(text)) return { label, tags }; return null; }
async function getJSON(url, opt = {}, ms = 25000) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); if (opt.signal) opt.signal.addEventListener('abort', () => c.abort());
  try { const r = await fetch(url, { ...opt, signal: c.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); } }
async function geocode(q) {
  const d = await getJSON('https://photon.komoot.io/api/?limit=1&q=' + encodeURIComponent(q));
  const f = d.features && d.features[0]; if (!f) throw new Error('place not found');
  const p = f.properties; return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], label: [p.name, p.state, p.country].filter(Boolean).join(', ') };
}
async function overpass(tags, nameRe, g, radius) {
  const around = `(around:${radius},${g.lat},${g.lon})`;
  const parts = tags.map(t => { const [k, v] = t.split('='); return `nwr["${k}"="${v}"]${around};`; });
  if (nameRe) parts.push(`nwr["name"~"${nameRe.replace(/["\\]/g, '')}",i]["phone"]${around};`);
  const q = `[out:json][timeout:30];(${parts.join('')});out center tags 60;`;
  const EPS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  const ctl = EPS.map(() => new AbortController());
  const d = await Promise.any(EPS.map((ep, i) => getJSON(ep + '?data=' + encodeURIComponent(q), { signal: ctl[i].signal }, 50000)
    .then(r => { if (!r || !Array.isArray(r.elements)) throw new Error('bad'); ctl.forEach((c, k) => k !== i && c.abort()); return r; })))
    .catch(() => { throw new Error('map servers busy'); });
  const dist = (a, b) => { const R = 6371, x = (b.lat - a.lat) * Math.PI / 180, y = (b.lon - a.lon) * Math.PI / 180 * Math.cos(a.lat * Math.PI / 180); return R * Math.hypot(x, y); };
  const seen = new Set();
  return (d.elements || []).map(e => { const t = e.tags || {}, lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
    return { id: 'osm' + e.type[0] + e.id, name: t.name || t.brand || '', phone: t.phone || t['contact:phone'] || '', web: t.website || t['contact:website'] || '',
      addr: [[t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '), t['addr:city']].filter(Boolean).join(', '), hours: t.opening_hours || '', lat, lon,
      km: lat ? dist(g, { lat, lon }) : 99, src: 'OpenStreetMap' }; })
    .filter(b => b.name && !seen.has(b.name.toLowerCase()) && seen.add(b.name.toLowerCase()))
    .sort((a, b) => (!!b.phone - !!a.phone) || a.km - b.km).slice(0, 8);
}

/* ---------- free AI plan ---------- */
const SYS = `You help a small-business owner do a phone job themselves. Reply ONLY with a JSON object with exactly these keys, in this order:
"title": short job title, max 6 words.
"business": the kind of business to call, 1-3 plain words (e.g. "plumber", "storage units").
"text": a ready-to-send SMS to each business, under 300 characters, written as the owner, signed [your name].
"script": a short honest call script the owner reads aloud, 2-4 sentences.
"questions": an array of 3 to 5 short questions to ask each business.
"tips": an array of 2 or 3 short tips for a good price or outcome.
Never invent business names, prices, phone numbers or websites.`
function fallbackPlan(task, label) {
  return { title: task.slice(0, 40), business: label || 'local business', script: `Hi, my name is [your name]. I'm calling about ${task.replace(/^(call|find|get)\s+/i, '')}. Do you have time to help with this, and what would it cost?`,
    questions: ['Can you do it, and how soon?', 'What is the total price, including trip or call-out fees?', 'Is there a warranty or guarantee?', 'Are you licensed and insured?'],
    text: `Hi, this is [your name]. I'm looking for help with: ${task.slice(0, 180)}. Are you available, and what would it cost? Thanks!`, tips: ['Ask every business the same questions so quotes compare fairly.', 'Ask for the price in a text so you have it in writing.'], fallback: true };
}

function normPlan(p, task) {
  p = Object.fromEntries(Object.entries(p).map(([k, v]) => [k.toLowerCase().replace(/[^a-z]/g, ''), v]));
  const fb = fallbackPlan(task, p.business); const str = v => Array.isArray(v) ? v.join('\n') : (typeof v === 'object' && v ? Object.values(v).join('\n') : String(v || ''));
  const o = { title: str(p.title) || fb.title, business: str(p.business) || fb.business, script: str(p.script), questions: arr(p.questions).length ? arr(p.questions).map(str) : fb.questions,
    text: str(p.text || p.sms || p.smstext || p.message || p.textmessage || p.smsmessage) || fb.text, tips: arr(p.tips).map(str) };
  const scrub = t => String(t).replace(/(\+?1[\s.-]?)?\(?\d{3}\)?[\s.\u2011-]?\d{3}[\s.\u2011-]?\d{4}/g, '[phone number]').replace(/\b(https?:\/\/|www\.)\S+/gi, '[website]');
  for (const k of ['title', 'business', 'script', 'text']) o[k] = scrub(o[k]);
  o.questions = [...new Set(o.questions.map(scrub))].slice(0, 6); o.tips = o.tips.map(scrub).slice(0, 3);
  if (!p.text && !p.sms && !p.message) o.text = fb.text;
  return o;
}
/* ---------- running a job ---------- */
let running = false;
async function runJob(task) {
  if (running) return; running = true; $('#runBtn').disabled = true; $('#runBtn').textContent = 'Working…';
  t0 = Date.now(); logEl.innerHTML = '';
  const loc = $('#locInput').value.trim(); S.loc = loc;
  const j = { id: uid(), task, title: task.slice(0, 48), at: Date.now(), plan: null, biz: [], quotes: {}, loc }; S.jobs.unshift(j); S.jobs = S.jobs.slice(0, 20); S.cur = j.id; save();
  log(`🧾 Job: <b>${esc(task)}</b>`);
  const tg = pickTags(task);
  const aiLi = log('✨ Free AI is writing your call script and text…');
  const aiP = window.AIHelper ? AIHelper.ask(SYS, `Job: ${task}\nLocation: ${loc || 'not given'}`, { json: true,
      onWait: s => { aiLi.lastChild.textContent = `✨ Free AI is busy. Your plan starts in ${s}s…`; } })
      .then(t => { const p = AIHelper.parseJSON(t); if (!p || !p.script) throw new Error('bad'); return normPlan(p, task); })
      .catch(() => null) : Promise.resolve(null);
  let bizP = Promise.resolve([]);
  if (loc) {
    bizP = (async () => {
      const g = (S.geo && S.geo.q === loc) ? S.geo : { ...(await geocode(loc)), q: loc }; S.geo = g; save();
      log(`📍 Found <b>${esc(g.label)}</b>`);
      if (!tg) return [];
      log(`🔎 Searching OpenStreetMap for <b>${tg.label}</b> near you…`);
      return await overpass(tg.tags, null, g, 40000);
    })().catch(e => { log('⚠️ Business search failed (' + esc(e.message) + '). Use the Google Maps link below.'); return []; });
  } else log('ℹ️ Add your town to find nearby businesses.');
  const [plan, biz] = await Promise.all([aiP, bizP]);
  j.plan = plan || fallbackPlan(task, tg?.label);
  if (plan) { j.title = String(plan.title || j.title).slice(0, 60); aiLi.lastChild.textContent = '✨ Call script, questions and text are ready'; aiLi.className = 'done'; }
  else aiLi.lastChild.textContent = '✨ Free AI is busy right now, so here is a basic script. Tap "Rewrite with AI" in a minute.';
  if (!tg && plan && plan.business && loc && S.geo) {
    const tg2 = pickTags(plan.business);
    try { log(`🔎 Searching OpenStreetMap for <b>${esc(plan.business)}</b>…`); j.biz = await overpass(tg2 ? tg2.tags : [], tg2 ? null : plan.business.split(/\s+/)[0], S.geo, 30000); } catch (e) { log('⚠️ Business search failed. Use the Google Maps link below.'); }
  } else j.biz = biz;
  for (const b of j.biz) if (b.phone && !S.contacts.find(c => c.id === b.id)) S.contacts.push({ id: b.id, name: b.name, phone: b.phone, addr: b.addr, src: 'OpenStreetMap' });
  log(j.biz.length ? `👥 ${j.biz.length} businesses found (${j.biz.filter(b => b.phone).length} with phone numbers), saved to Contacts` : '👥 No listings in OpenStreetMap for this yet. Google Maps search link is below.', j.biz.length ? 'done' : '');
  save(); renderReport(); renderHistory(); home();
  log('✅ Ready. Tap a green Call button, then log each quote.', 'done');
  running = false; $('#runBtn').disabled = false; $('#runBtn').textContent = 'Run job';
}
async function rewrite() {
  const j = job(); if (!j || running) return; const btn = $('#rwBtn'); btn.disabled = true; btn.textContent = 'Writing…';
  try { const p = AIHelper.parseJSON(await AIHelper.ask(SYS, `Job: ${j.task}\nLocation: ${j.loc || 'not given'}`, { json: true, onWait: s => btn.textContent = `AI busy, ${s}s…` }));
    if (!p || !p.script) throw 0; j.plan = normPlan(p, j.task); save(); renderReport(); toast('New script ready'); } catch (e) { toast('Free AI is busy. Try again in a minute.'); }
  if (btn.isConnected) { btn.disabled = false; btn.textContent = '✨ Rewrite with AI'; }
}
const arr = v => Array.isArray(v) ? v : (v ? String(v).split(/\n+/) : []);
function reportText(j) {
  const p = j.plan || {}, q = j.quotes || {}, ev = S.events.filter(e => e.job === j.id);
  return [`CellMate job report: ${j.title}`, `Job: ${j.task}`, j.loc ? `Where: ${j.loc}` : '', `Date: ${new Date(j.at).toLocaleString()}`, '', 'CALL SCRIPT', p.script || '', '', 'QUESTIONS', ...arr(p.questions).map(x => '- ' + x), '', 'TEXT', p.text || '', '',
    'BUSINESSES & QUOTES', ...(j.biz.length ? j.biz.map(b => `- ${b.name}${b.phone ? ' ' + b.phone : ''}${q[b.id]?.price ? ' · quote $' + q[b.id].price : ''}${q[b.id]?.note ? ' · ' + q[b.id].note : ''}`) : ['(none logged)']),
    ...(ev.length ? ['', 'BOOKED', ...ev.map(e => `- ${e.title}, ${new Date(e.start).toLocaleString()}`)] : [])].filter(x => x !== null).join('\n');
}
function renderReport() {
  const j = job(), el = $('#report'); if (!j || !j.plan) { el.classList.add('hidden'); return; }
  const p = j.plan, q = j.quotes || (j.quotes = {});
  const priced = j.biz.filter(b => +q[b.id]?.price > 0), best = priced.sort((a, b) => q[a.id].price - q[b.id].price)[0];
  const mapsQ = (p.business || j.task) + (j.loc ? ' near ' + j.loc : '');
  el.innerHTML = `<h4 style="margin-top:0">📋 ${esc(j.title)}</h4>
   <h4>What to say</h4><pre id="rScript">${esc(p.script)}</pre>
   <h4>Ask every business</h4><ul>${arr(p.questions).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
   <h4>Text to send</h4><pre id="rText">${esc(p.text)}</pre>
   ${arr(p.tips).length ? `<h4>Tips</h4><ul>${arr(p.tips).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
   <h4>Businesses ${j.biz.length ? `<span class="muted" style="font-weight:400">(OpenStreetMap, check details before you go)</span>` : ''}</h4>
   <div id="bizList">${j.biz.map(b => `<div class="biz ${best && best.id === b.id ? 'best' : ''}" data-id="${b.id}"><div class="nm">${esc(b.name)}${best && best.id === b.id ? ' · lowest quote' : ''}</div>
     <div class="sub">${[b.phone || 'No phone listed', b.addr, b.km < 99 ? b.km.toFixed(1) + ' km' : '', b.hours].filter(Boolean).map(esc).join(' · ')}</div>
     <div class="acts">${b.phone ? `<a class="call" href="${telHref(b.phone)}">📞 Call</a><a href="${smsHref(b.phone, p.text)}">💬 Text</a>` : ''}${b.web ? `<a href="${esc(b.web)}" target="_blank" rel="noopener">🌐 Site</a>` : ''}
       <a href="${gmaps(b.name + ' ' + (b.addr || j.loc || ''))}" target="_blank" rel="noopener">🗺️ Maps</a><button data-map="${b.id}">Show on phone</button><button data-book="${b.id}">📅 Book</button></div>
     <div class="qrow"><input class="q" inputmode="decimal" placeholder="Quote $" value="${esc(q[b.id]?.price || '')}" data-q="${b.id}"><input class="n" placeholder="Notes (when, fees…)" value="${esc(q[b.id]?.note || '')}" data-n="${b.id}"></div></div>`).join('')
     || '<p class="muted">No listings found in OpenStreetMap. Search Google Maps, then add numbers in Contacts on the phone.</p>'}</div>
   <div class="btnrow"><a href="${gmaps(mapsQ)}" target="_blank" rel="noopener">🗺️ More on Google Maps</a><button id="rwBtn">✨ Rewrite with AI</button><button id="cpBtn">Copy report</button><button id="dlBtn">Download report</button></div>
   <p class="muted" style="margin:8px 0 0;font-size:13px">${p.fallback ? 'Basic script (free AI was busy). ' : 'Written by free AI, so read it over before you use it. '}Calls and texts open on your phone. Nothing is sent automatically.</p>`;
  el.classList.remove('hidden');
  el.querySelectorAll('[data-q],[data-n]').forEach(i => i.onchange = () => { const id = i.dataset.q || i.dataset.n; q[id] = q[id] || {};
    if (i.dataset.q) q[id].price = i.value.replace(/[^\d.]/g, ''); else q[id].note = i.value; save(); renderReport(); });
  el.querySelectorAll('[data-map]').forEach(b => b.onclick = () => { mapView(j.biz.find(x => x.id === b.dataset.map)); $('#phone').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  el.querySelectorAll('[data-book]').forEach(b => b.onclick = () => { const x = j.biz.find(y => y.id === b.dataset.book); calView({ title: (p.business ? p.business[0].toUpperCase() + p.business.slice(1) + ': ' : '') + x.name, phone: x.phone }); $('#phone').scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('Pick the time, then tap Book it'); });
  $('#rwBtn').onclick = rewrite;
  $('#cpBtn').onclick = async () => { try { await navigator.clipboard.writeText(reportText(j)); toast('Report copied'); } catch (e) { toast('Copy blocked. Use Download.'); } };
  $('#dlBtn').onclick = () => download('cellmate-report.txt', reportText(j));
}
function renderHistory() {
  const h = $('#history'); const others = S.jobs.filter(j => j.id !== S.cur);
  h.innerHTML = others.length ? '<h3>Past jobs</h3>' + others.map(j => `<div class="hj"><span>${esc(j.title)} <span class="muted">${new Date(j.at).toLocaleDateString()}</span></span><span><button data-open="${j.id}">Open</button> <button data-rm="${j.id}">Delete</button></span></div>`).join('') : '';
  h.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { S.cur = b.dataset.open; save(); renderReport(); renderHistory(); home(); $('#report').scrollIntoView({ behavior: 'smooth' }); });
  h.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { S.jobs = S.jobs.filter(j => j.id !== b.dataset.rm); save(); renderHistory(); });
}

/* ---------- wiring ---------- */
const PRESETS = [['Plumber quotes', 'Get quotes from 3 plumbers for a leaking kitchen sink, today if possible'], ['Storage unit', 'Find a 10x10 storage unit and compare monthly prices'],
  ['Tire shop', 'Find a tire shop that can replace two truck tires today and compare prices'], ['Movers', 'Get quotes from local movers for a 2-bedroom apartment move on Saturday'],
  ['Locksmith', 'I am locked out of my truck, find a locksmith who can come now'], ['Pawn shops', 'Call pawn shops to see who buys power tools and what they pay']];
$('#presets').innerHTML = PRESETS.map(([t, d], i) => `<button class="preset" type="button" data-i="${i}"><b>${t}</b>${d}</button>`).join('');
$('#presets').querySelectorAll('.preset').forEach(b => b.onclick = () => { $('#taskInput').value = PRESETS[b.dataset.i][1]; $('#taskInput').focus(); });
$('#locInput').value = S.loc || '';
$('#taskForm').onsubmit = e => { e.preventDefault(); const t = $('#taskInput').value.trim(); if (t) runJob(t); };
$('#gpsBtn').onclick = () => { if (!navigator.geolocation) return toast('Location not available');
  navigator.geolocation.getCurrentPosition(async p => { const g = { lat: p.coords.latitude, lon: p.coords.longitude };
    try { const d = await getJSON(`https://photon.komoot.io/reverse?lat=${g.lat}&lon=${g.lon}&limit=1`); const pr = d.features?.[0]?.properties || {};
      const label = [pr.city || pr.town || pr.village || pr.name, pr.state].filter(Boolean).join(', ') || `${g.lat.toFixed(3)}, ${g.lon.toFixed(3)}`;
      $('#locInput').value = label; S.loc = label; S.geo = { ...g, label, q: label }; save(); toast('Location set'); } catch (e) { toast('Could not look up your town. Type it instead.'); } },
  () => toast('Location blocked. Type your town instead.'), { timeout: 15000 }); };
$('#resetBtn').onclick = () => { if (!confirm('Delete all CellMate jobs, contacts, bookings and notes saved in this browser?')) return; S = blank(); save(); logEl.innerHTML = '<li class="muted">Waiting for a job…</li>'; $('#locInput').value = ''; renderReport(); renderHistory(); home(); };
home(); renderReport(); renderHistory();
window.__cellmate = { state: () => S };
