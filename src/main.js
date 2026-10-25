const $ = s => document.querySelector(s);
const screen = $('#screen'), logEl = $('#log');
let fast = false, running = false, t0 = 0;
const wait = ms => new Promise(r => setTimeout(r, fast ? ms / 4 : ms));
const APPS = [
  ['phone','Phone','📞','#22c55e'],['messages','Messages','💬','#16a34a'],['camera','Camera','📷','#4b5563'],['maps','Maps','🗺️','#0ea5e9'],
  ['contacts','Contacts','👥','#f59e0b'],['browser','Browser','🌐','#3b82f6'],['calendar','Calendar','📅','#ef4444'],['notes','Notes','📝','#eab308']];
const contacts = [['Owner (you)','(423) 555-0100'],['Ace Plumbing','(423) 555-0181'],['Rapid Rooter','(423) 555-0177'],['Scenic City Plumbing','(423) 555-0139'],['Family Heirloom Storage','(423) 555-0110'],['Cannon Self-Storage','(423) 555-0163'],['Dana (lead)','(423) 555-0122'],['Marcus (lead)','(423) 555-0155']];
let calendar = [['9 AM',''],['10 AM','Team standup'],['11 AM',''],['12 PM',''],['1 PM',''],['2 PM',''],['3 PM','']];
let notes = [];

function clock(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}).replace(/\s?[AP]M/,'');}
setInterval(clock, 10000); clock();

function log(msg, cls=''){ if(logEl.querySelector('.muted')) logEl.innerHTML=''; const li=document.createElement('li'); if(cls) li.className=cls;
  const s=((Date.now()-t0)/1000).toFixed(1); li.innerHTML=`<span class="t">${s}s</span>${msg}`; logEl.appendChild(li); logEl.scrollTop=1e9; }
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.add('hidden'),2600);}

function home(){
  screen.innerHTML = `<div class="home">
   <div class="widget"><div style="opacity:.8;font-size:12px">CELLMATE AGENT · ON SHIFT</div><div class="big" id="wtask">Ready for a job</div><div style="font-size:12px;opacity:.8">Line (423) 555-0142 · Calls today: <span id="wcalls">${stats.calls}</span> · Texts: <span id="wtexts">${stats.texts}</span></div></div>
   ${APPS.map(([id,n,i,c])=>`<button class="app" data-app="${id}"><span class="ic" style="background:${c}">${i}</span>${n}</button>`).join('')}
  </div>
  <div class="dock">${APPS.slice(0,4).map(([id,n,i,c])=>`<button class="app" data-app="${id}"><span class="ic" style="background:${c}">${i}</span></button>`).join('')}</div>`;
  screen.querySelectorAll('.app').forEach(b=>b.onclick=()=>{ if(!running) openApp(b.dataset.app); });
}
const stats={calls:0,texts:0};
$('#homebar').onclick=()=>{ if(!running) home(); };

function cursorTo(el){ return new Promise(async r=>{ let c=screen.querySelector('.cursor'); if(!c){c=document.createElement('div');c.className='cursor';c.style.left='50%';c.style.top='60%';screen.appendChild(c);} 
  const a=el.getBoundingClientRect(), s=screen.getBoundingClientRect(); c.style.left=(a.left-s.left+a.width/2-13)+'px'; c.style.top=(a.top-s.top+a.height/2-13)+'px'; await wait(550); r(); }); }
async function tapApp(id){ home(); await wait(400); const b=screen.querySelector(`.home .app[data-app="${id}"]`); await cursorTo(b); b.classList.add('tap'); await wait(250); openApp(id); await wait(400); }

function view(title, inner, cls=''){ screen.innerHTML=`<div class="view ${cls}"><div class="vh">${title}</div>${inner}</div>`; return screen.firstChild; }
function openApp(id){
  if(id==='phone') return keypad('');
  if(id==='contacts') return view('Contacts',`<div class="body">${contacts.map(([n,p])=>`<div class="listi" data-n="${n}"><div>${n}<div class="sub">${p}</div></div>📞</div>`).join('')}</div>`);
  if(id==='messages') return view('Messages',`<div class="body">${contacts.slice(1).map(([n])=>`<div class="listi"><div>${n}<div class="sub">Tap to open thread</div></div>›</div>`).join('')}</div>`);
  if(id==='calendar') return renderCal();
  if(id==='notes') return view('Notes',`<div class="body">${notes.length?notes.map(n=>`<div class="listi" style="display:block">${n}</div>`).join(''):'<p class="sub" style="padding:10px;color:#777">No notes yet.</p>'}</div>`);
  if(id==='maps') return renderMap('Chattanooga, TN','Search a place');
  if(id==='browser') return renderBrowser('cellmate.app',[]);
  if(id==='camera') return renderCam();
}
function keypad(num){ return view('Keypad',`<div class="keypad"><div class="num" id="num">${num}</div><div class="keys">${'123456789*0#'.split('').map(k=>`<div class="key" data-k="${k}">${k}</div>`).join('')}</div><div class="callbtn">📞</div></div>`); }
async function dial(number){ keypad(''); await wait(300); const digits=number.replace(/\D/g,''); let shown='';
  for(const d of digits){ const k=screen.querySelector(`.key[data-k="${d}"]`); k.classList.add('on'); shown+=d; $('#num').textContent=fmt(shown); await wait(90); k.classList.remove('on'); }
  await cursorTo(screen.querySelector('.callbtn')); }
const fmt=d=>d.length>6?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:d;
async function call(name, number, lines){
  await tapApp('phone'); log(`📞 Dialing <b>${name}</b> ${number}`); await dial(number);
  view('',`<div class="incall" style="display:flex;flex-direction:column;height:100%"><div class="who">${name}</div><div class="st" id="cst">calling…</div><div class="transcript" id="tr"></div><div class="endcall">✆</div></div>`,'dark');
  stats.calls++; await wait(1100); $('#cst').textContent='00:01 · AI agent call · recorded';
  let sec=1; const tm=setInterval(()=>{sec++; const e=$('#cst'); if(e) e.textContent=`00:${String(sec).padStart(2,'0')} · AI agent call · recorded`;},fast?250:1000);
  for(const [who,txt] of lines){ const b=document.createElement('div'); b.className='bub '+(who==='a'?'me':'them'); b.textContent=txt; $('#tr').appendChild(b); $('#tr').scrollTop=1e9; await wait(Math.min(2200, 600+txt.length*22)); }
  clearInterval(tm); await cursorTo(screen.querySelector('.endcall')); $('#cst').textContent='Call ended'; await wait(500);
}
async function text(name, msgs){
  await tapApp('messages'); log(`💬 Texting <b>${name}</b>`);
  view(`${name}<small>iMessage / SMS</small>`,`<div class="body" id="th"></div><div class="compose"><div id="cp"></div>➤</div>`);
  for(const [who,txt] of msgs){ if(who==='a'){ let s=''; for(const ch of txt){ s+=ch; $('#cp').textContent=s; await wait(18);} await wait(200); $('#cp').textContent=''; stats.texts++; }
    else await wait(900);
    const b=document.createElement('div'); b.className='bub '+(who==='a'?'me':'them'); b.textContent=txt; $('#th').appendChild(b); await wait(500); }
}
function renderMap(title, card, route){
  return view(title,`<div class="map"><svg viewBox="0 0 330 520">
   <rect width="330" height="520" fill="#e8eef3"/><path d="M0 120 L330 160 M0 330 L330 300 M90 0 L120 520 M240 0 L220 520" stroke="#fff" stroke-width="14"/>
   <path d="M0 230 Q160 260 330 210" stroke="#fde68a" stroke-width="10" fill="none"/><rect x="140" y="380" width="80" height="60" fill="#bbf7d0" rx="8"/>
   <path d="M30 40 Q60 0 160 30 T330 20" stroke="#93c5fd" stroke-width="22" fill="none"/>
   ${route?`<path id="rt" d="M105 450 L112 330 L230 300 L222 160" stroke="#2563eb" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="600" stroke-dashoffset="600"><animate attributeName="stroke-dashoffset" to="0" dur="1.6s" fill="freeze"/></path><circle cx="105" cy="450" r="9" fill="#2563eb" stroke="#fff" stroke-width="3"/><text x="214" y="148" font-size="26">📍</text>`:''}
  </svg><div class="mapcard">${card}</div></div>`);
}
function renderBrowser(url, results){ return view('',`<div class="browser" style="display:flex;flex-direction:column;height:100%"><div class="url">🔒 ${url}</div><div class="body">${results.map(r=>`<div class="result"><a>${r[0]}</a><div class="g">${r[1]}</div>${r[2]}</div>`).join('')}</div></div>`); }
async function browse(q, results){ await tapApp('browser'); log(`🌐 Searching the web: “${q}”`); renderBrowser('search?q='+encodeURIComponent(q).slice(0,30)+'…',[]); await wait(700);
  for(let i=1;i<=results.length;i++){ renderBrowser('search?q='+encodeURIComponent(q).slice(0,30)+'…',results.slice(0,i)); await wait(350);} await wait(700); }
function renderCal(newIdx){ return view(`Today<small>${new Date().toDateString()}</small>`,`<div class="body cal">${calendar.map(([h,e],i)=>`<div class="day"><div class="hr">${h}</div><div class="ev ${e?'':'empty'} ${i===newIdx?'new':''}">${e}</div></div>`).join('')}</div>`); }
async function book(slot, title){ await tapApp('calendar'); const i=calendar.findIndex(c=>c[0]===slot); calendar[i][1]=title; renderCal(i); log(`📅 Booked <b>${title}</b> at ${slot}`); await wait(1500); }
function renderCam(){ const v=view('',`<div class="cam"><div class="scene" id="scn">🏚️</div></div><div class="shutter"></div>`,'dark'); return v; }
async function photo(emoji, caption){ await tapApp('camera'); $('#scn').textContent=emoji; log(`📷 Taking proof photo: ${caption}`); await wait(800); await cursorTo(screen.querySelector('.shutter'));
  const f=document.createElement('div'); f.className='flash'; screen.querySelector('.cam').appendChild(f); await wait(600); toast('📷 Photo saved & attached to report'); await wait(700); }
async function navigate(dest, eta){ await tapApp('maps'); log(`🗺️ Routing to <b>${dest}</b>`); renderMap('Directions',`<b>${dest}</b><br><span style="color:#16a34a">${eta}</span> · fastest route`,true); await wait(2200); }
async function note(txt){ notes.unshift(txt); await tapApp('notes'); openApp('notes'); log('📝 Saved summary to Notes'); await wait(1200); }
async function addContact(n,p){ await tapApp('contacts'); if(!contacts.find(c=>c[0]===n)) contacts.push([n,p]); openApp('contacts'); const el=[...screen.querySelectorAll('.listi')].find(e=>e.dataset.n===n); el?.classList.add('hl'); el?.scrollIntoView({block:'center'}); log(`👥 Saved contact <b>${n}</b>`); await wait(1100); }

const JOBS = [
 { key:'plumb', title:'Book a plumber', desc:'Call 3 plumbers, get quotes, book the cheapest for today.', kw:/plumb|leak|pipe|repair|contractor|quote/i,
   run: async()=>{
    await browse('emergency plumber Chattanooga TN',[['Ace Plumbing – 24/7','★ 4.8 · (423) 555-0181','Same-day service, free estimates.'],['Rapid Rooter','★ 4.6 · (423) 555-0177','Drains & leaks, $89 trip fee.'],['Scenic City Plumbing','★ 4.9 · (423) 555-0139','Licensed, family-owned.']]);
    await call('Ace Plumbing','(423) 555-0181',[['a',"Hi, this is CellMate, an AI assistant calling for a customer. Do you have anyone open today for a kitchen sink leak?"],['t',"We can do 4 PM. $145 flat for the visit and repair if it's simple."],['a',"Thanks, I'm collecting a couple quotes and may call back."]]);
    await call('Scenic City Plumbing','(423) 555-0139',[['a',"Hi, I'm an AI assistant calling for a customer. Any openings today for a sink leak?"],['t',"Yes, 1 PM works. $110 for the visit, parts extra if needed."],['a',"Great, please book 1 PM. I'll text you the address."],['t',"You're on the schedule."]]);
    await text('Scenic City Plumbing',[['a','Confirming 1 PM today: 1415 Market St, Chattanooga. Kitchen sink leak. Customer approved $110 visit.'],['t','Got it 👍 Tech is Ray, see you at 1.']]);
    await book('1 PM','🔧 Scenic City Plumbing – Ray ($110)');
    await text('Owner (you)',[['a','Booked Scenic City Plumbing 1 PM today, $110 (cheapest of 2 quotes; Ace was $145). Ray is the tech.']]);
    return ['Plumber booked for 1 PM today','2 calls, 2 texts, 1 calendar event','Saved you $35 vs. the first quote'];
 }},
 { key:'storage', title:'Find storage-unit deals', desc:'Call storage facilities about upcoming auctions and map the best one.', kw:/storage|auction|unit|locker|deal|pawn/i,
   run: async()=>{
    await browse('storage unit auctions Chattanooga this week',[['Family Heirloom Storage – online auction','Ends Oct 26','2 units listed: B53, 175.'],['Cannon Self-Storage – lien sale','Nov 3–10','Units listed on auction site.']]);
    await call('Family Heirloom Storage','(423) 555-0110',[['a',"Hi, I'm an AI assistant calling for a buyer. Can someone view units B53 or 175 before the auction ends?"],['t',"Viewing is by photo only, but you can come by the office Thursday at 2 to ask questions."],['a',"Perfect, we'll be there Thursday at 2. Thank you!"]]);
    await addContact('Family Heirloom Storage','(423) 555-0110');
    await navigate('1415 Crawford St, Chattanooga','14 min · 6.2 mi');
    await book('2 PM','📦 Family Heirloom Storage – ask about B53/175');
    await note('Storage deals: Family Heirloom auction ends Oct 26 (units B53, 175). Cannon sale Nov 3–10. Office visit Thu 2 PM.');
    return ['Found 2 auctions this week','Visit set for Thursday 2 PM','Route and contact saved'];
 }},
 { key:'leads', title:'Text back new leads', desc:'Follow up with 2 new leads by text and log who wants a call.', kw:/lead|text|follow|customer|sales|client/i,
   run: async()=>{
    await text('Dana (lead)',[['a',"Hi Dana, this is CellMate, the AI assistant for Walt's business. You asked about a quote yesterday. Still interested?"],['t','Yes! Can someone call me after 3?'],['a',"Absolutely. I'll set a 3 PM call."]]);
    await text('Marcus (lead)',[['a',"Hi Marcus, this is CellMate, the AI assistant for Walt's business. Want to pick a time to talk about your project?"],['t','Not right now, maybe next month.'],['a',"No problem. I'll check back in 30 days."]]);
    await book('3 PM','📞 Call Dana – hot lead');
    await note('Leads: Dana = HOT (call 3 PM today). Marcus = follow up in 30 days.');
    return ['2 leads followed up in under a minute','1 hot lead booked for 3 PM','1 lead set for a 30-day reminder'];
 }},
 { key:'inspect', title:'Proof-of-work photo', desc:'Drive to a job, snap a proof photo and send the owner a report.', kw:/photo|picture|camera|inspect|proof|drive|map|route/i,
   run: async()=>{
    await navigate('Job site – 220 Broad St','9 min · 3.1 mi');
    await photo('🏠','front of property at 220 Broad St');
    await text('Owner (you)',[['a','Arrived at 220 Broad St 11:02 AM. Proof photo attached 📷. Gate was unlocked, lawn crew on site.'],['t','Thanks! 👍']]);
    await note('220 Broad St check-in 11:02 AM: photo attached, crew on site.');
    return ['Route and arrival logged','Proof photo taken & sent','Owner got the update by text'];
 }},
];

$('#presets').innerHTML = JOBS.map(j=>`<button class="preset" data-k="${j.key}"><b>${j.title}</b>${j.desc}</button>`).join('');
$('#presets').onclick = e => { const b=e.target.closest('.preset'); if(b) runJob(JOBS.find(j=>j.key===b.dataset.k), b.querySelector('b').textContent); };
$('#taskForm').onsubmit = e => { e.preventDefault(); const q=$('#taskInput').value.trim(); if(!q) return; runJob(JOBS.find(j=>j.kw.test(q)) || JOBS[0], q); };
$('#fast').onchange = e => fast = e.target.checked;
$('#resetBtn').onclick = () => { if(running) return; stats.calls=stats.texts=0; calendar=calendar.map(([h])=>[h,h==='10 AM'?'Team standup':'']); notes=[]; logEl.innerHTML='<li class="muted">Waiting for a job…</li>'; $('#report').classList.add('hidden'); home(); };

async function runJob(job, label){
  if(running) return; running=true; t0=Date.now(); document.querySelectorAll('.preset,.taskform button').forEach(b=>b.disabled=true);
  logEl.innerHTML=''; $('#report').classList.add('hidden'); log(`🧠 New job: <b>${label}</b> → plan: ${job.desc}`); home(); $('#wtask').textContent=label; await wait(900);
  try { const res = await job.run(); home(); toast('✅ Job done — report sent to owner');
    log('✅ Job complete','done');
    $('#report').innerHTML=`<h4>✅ Job report · ${((Date.now()-t0)/1000).toFixed(0)}s</h4><ul>${res.map(r=>`<li>${r}</li>`).join('')}</ul><p class="muted" style="margin:6px 0 0">The agent said it was an AI on every call and asked before spending money.</p>`;
    $('#report').classList.remove('hidden');
  } catch(err){ console.error(err); log('⚠️ Something went wrong — phone reset'); home(); }
  running=false; document.querySelectorAll('.preset,.taskform button').forEach(b=>b.disabled=false);
}
home();
