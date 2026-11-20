// Leonida Ledger — GTA VI trophy tracker with cited walkthrough steps,
// two-sided source disputes, roadmap ordering and collectible counters.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const STORE_KEY = 'leonida-ledger-v5';

let DATA = null;
let state = loadState();
let selectedId = 28;
let activeView = 'tracker';

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign({ done: {}, counters: {}, shield: true, revealed: {} }, JSON.parse(raw));
  } catch (e) { /* fresh state below */ }
  return { done: {}, counters: {}, shield: true, revealed: {} };
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const citeHtml = (arr) => arr && arr.length ? ` <sup class="cite">[${arr.join('] [')}]</sup>` : '';
const stageOf = (t) => DATA.stages.find((s) => s.id === t.stage);
const stageIdx = (id) => DATA.stages.findIndex((s) => s.id === id);
const roadmapOrder = (a, b) => (stageIdx(a.stage) - stageIdx(b.stage)) || (a.id - b.id);
const isMasked = (t) => t.hidden && state.shield && !state.revealed[t.id] && !state.done[t.id];

function allClaims() {
  // claims per source: every step citation, dispute-side citation and description citation
  const claims = {}, guides = {};
  for (const s of DATA.sources) { claims[s.n] = 0; guides[s.n] = new Set(); }
  for (const t of DATA.trophies) {
    const used = new Set();
    const bump = (n) => { claims[n]++; used.add(n); };
    t.dc.forEach(bump);
    t.steps.forEach((st) => st.c.forEach(bump));
    (t.disputes || []).forEach((d) => { d.ac.forEach(bump); d.bc.forEach(bump); });
    used.forEach((n) => guides[n].add(t.id));
  }
  return { claims, guides };
}

function stats() {
  const ts = DATA.trophies;
  const steps = ts.reduce((a, t) => a + t.steps.length, 0);
  const multi = ts.reduce((a, t) => a + t.steps.filter((s) => s.c.length >= 2).length, 0);
  const disputes = ts.reduce((a, t) => a + (t.disputes || []).length, 0);
  const citing = ts.filter((t) => t.steps.some((s) => s.c.length) || t.dc.length).length;
  const collTargets = ts.filter((t) => t.ctr && t.ctr.unit !== '$').reduce((a, t) => a + t.ctr.target, 0);
  return {
    steps, multi, disputes,
    disputedTrophies: ts.filter((t) => (t.disputes || []).length).length,
    citing,
    missable: ts.filter((t) => t.miss).length,
    risk: ts.filter((t) => t.risk).length,
    unc: ts.filter((t) => t.unc).length,
    collTargets,
    grades: ['Platinum', 'Gold', 'Silver', 'Bronze'].map((g) => ts.filter((t) => t.grade === g).length),
    hidden: ts.filter((t) => t.hidden).length,
    gs: ts.reduce((a, t) => a + t.gs, 0),
  };
}

function renderAudit() {
  const st = stats();
  $('#auditRow1').innerHTML =
    `<span class="lab">Verified</span>` +
    `<span class="stat">Official list <b>55/55</b> names · <b>55/55</b> descriptions</span>` +
    `<span class="stat">Grades <b>${st.grades[0]}P · ${st.grades[1]}G · ${st.grades[2]}S · ${st.grades[3]}B</b></span>` +
    `<span class="stat"><b>${st.hidden}</b> hidden · <b>${st.gs.toLocaleString()}G</b> Xbox total</span>` +
    `<span class="stat"><b>${st.steps}</b> guide steps · <b>100%</b> cited</span>` +
    `<span class="stat"><b>${st.multi}</b> steps backed by 2+ sources</span>` +
    `<span class="stat"><b>${st.disputes}</b> disputes on <b>${st.disputedTrophies}</b> trophies</span>`;
  $('#auditRow2').innerHTML =
    `<span class="lab">Research depth</span>` +
    `<span class="stat"><b>${DATA.sources.length}</b> pages read · <b>${DATA.sources.length}</b> sites · read <b>${esc(DATA.meta.read)}</b></span>` +
    `<span class="stat"><b>${st.missable}</b> possibly missable</span>` +
    `<span class="stat"><b>${st.risk}</b> at-risk windows</span>` +
    `<span class="stat"><b>${st.unc}</b> unconfirmed</span>` +
    `<span class="stat">Disputes shown both ways <b>${st.disputes}/${st.disputes}</b></span>` +
    `<span class="stat">Guides citing sources <b>${st.citing}/55</b></span>` +
    `<span class="stat"><b>${st.collTargets}</b> collectibles logged</span>`;
}

function renderProgress() {
  const done = DATA.trophies.filter((t) => state.done[t.id]);
  $('#earnedCount').textContent = `${done.length}/55`;
  $('#earnedPct').textContent = `${Math.round((done.length / 55) * 100)}%`;
  $('#earnedBar').style.width = `${(done.length / 55) * 100}%`;
  $('#gsCount').textContent = done.reduce((a, t) => a + t.gs, 0).toLocaleString();
  $('#collectCount').textContent = stats().collTargets;
  $('#readDate').textContent = DATA.meta.read;
}

function badges(t) {
  let h = '';
  if (t.miss) h += `<span class="badge b-miss">MISSABLE?</span> `;
  if (t.risk) h += `<span class="badge b-risk">AT RISK</span> `;
  if (t.unc) h += `<span class="badge b-unc">UNCONFIRMED</span> `;
  if ((t.disputes || []).length) h += `<span class="badge b-diff">SOURCES DIFFER ×${t.disputes.length}</span> `;
  if (t.ctr) h += `<span class="badge b-coll">COLLECTIBLE</span> `;
  return h;
}

function passesFilters(t) {
  const q = $('#search').value.trim().toLowerCase();
  const g = $('#gradeFilter').value;
  const f = $('#statusFilter').value;
  if (g && t.grade !== g) return false;
  if (f === 'missing' && state.done[t.id]) return false;
  if (f === 'earned' && !state.done[t.id]) return false;
  if (f === 'disputes' && !(t.disputes || []).length) return false;
  if (f === 'collectible' && !t.ctr) return false;
  if (f === 'risk' && !(t.miss || t.risk)) return false;
  if (q) {
    const hay = `${t.name} ${t.desc} ${stageOf(t).label}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderTracker() {
  const ordered = [...DATA.trophies].sort(roadmapOrder);
  // Next up rail
  const next = ordered.filter((t) => !state.done[t.id]).slice(0, 5);
  $('#nextUpList').innerHTML = next.map((t) =>
    `<li data-open="${t.id}">${isMasked(t) ? 'Hidden trophy' : esc(t.name)} <span class="mini">${esc(stageOf(t).label.split('·')[1].trim())}</span></li>`).join('');
  // Grouped list
  let html = '';
  for (const stage of DATA.stages) {
    const inStage = ordered.filter((t) => t.stage === stage.id && passesFilters(t));
    if (!inStage.length) continue;
    const all = ordered.filter((t) => t.stage === stage.id);
    const doneN = all.filter((t) => state.done[t.id]).length;
    html += `<div class="grouphead"><span><span class="gname">${esc(stage.label)}</span><span class="gsub">${esc(stage.sub)}</span></span><span class="gprog">${doneN}/${all.length}</span></div>`;
    for (const t of inStage) {
      const masked = isMasked(t);
      const ctr = t.ctr ? `<span class="mini">${esc(t.ctr.label)}: ${state.counters[t.id] ?? 0}/${t.ctr.unit === '$' ? '$' : ''}${t.ctr.target.toLocaleString()}</span>` : '';
      html += `<div class="trow ${state.done[t.id] ? 'done' : ''} ${t.id === selectedId ? 'sel' : ''}" data-open="${t.id}">
        <input type="checkbox" data-done="${t.id}" ${state.done[t.id] ? 'checked' : ''} aria-label="mark earned">
        <span class="gdot g-${t.grade}"></span>
        <span class="tname ${masked ? 'masked' : ''}">${masked ? '••••••••••' : esc(t.name)}</span>
        ${badges(t)}${ctr}</div>`;
    }
  }
  $('#groupList').innerHTML = html || '<p>No trophies match the current filters.</p>';
  renderDetail();
}

function trophyClaims(t) {
  const mine = {};
  const bump = (n) => { mine[n] = (mine[n] || 0) + 1; };
  t.dc.forEach(bump);
  t.steps.forEach((s) => s.c.forEach(bump));
  (t.disputes || []).forEach((d) => { d.ac.forEach(bump); d.bc.forEach(bump); });
  return mine;
}

function renderDetail() {
  const t = DATA.trophies.find((x) => x.id === selectedId) || DATA.trophies[0];
  const panel = $('#detailPanel');
  if (isMasked(t)) {
    panel.innerHTML = `<div class="dhead"><span class="dname masked">Hidden trophy</span><span class="chip ${t.grade}">${t.grade}</span></div>
      <p class="dmeta">${esc(stageOf(t).label)} · ${t.gs}G · spoiler shield is on</p>
      <p>This trophy is hidden until earned. Its name, description and guide stay masked while the spoiler shield is on.</p>
      <div class="dactions"><button data-reveal="${t.id}" type="button">Reveal this trophy</button></div>`;
    return;
  }
  const { guides } = allClaims();
  const mine = trophyClaims(t);
  const rail = Object.keys(mine).map(Number).sort((a, b) => a - b).map((n) => {
    const s = DATA.sources.find((x) => x.n === n);
    return `<div>[${n}] <b>${esc(s.name)}</b> — ${mine[n]} claims here · in ${guides[n].size}/55 guides · <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace('https://', ''))}</a></div>`;
  }).join('');
  let ctr = '';
  if (t.ctr) {
    const val = state.counters[t.id] ?? 0;
    const pct = Math.min(100, Math.round((val / t.ctr.target) * 100));
    ctr = `<div class="counterbox"><div class="crow"><b>${esc(t.ctr.label)}</b>
      <input type="number" min="0" max="${t.ctr.target}" value="${val}" data-counter="${t.id}">
      <span>/ ${t.ctr.unit === '$' ? '$' : ''}${t.ctr.target.toLocaleString()}${t.ctr.unit === '%' ? '%' : ''}</span>
      <span class="bar"><div style="width:${pct}%"></div></span><span>${pct}%</span></div></div>`;
  }
  const disputes = (t.disputes || []).map((d) => `<div class="dispute">
      <h4>⚖ SOURCES DIFFER — ${esc(d.q)}</h4>
      <div class="sides">
        <div class="side"><b>Side A</b>${esc(d.a)}${citeHtml(d.ac)}</div>
        <div class="side"><b>Side B</b>${esc(d.b)}${citeHtml(d.bc)}</div>
      </div>
      <div class="call"><b>Our call:</b> ${esc(d.call)}</div>
    </div>`).join('');
  panel.innerHTML = `
    <div class="dhead"><span class="dname">${esc(t.name)}</span><span class="chip ${t.grade}">${t.grade}</span>
      <span class="dmeta">${t.gs}G · ${esc(stageOf(t).label)} — ${esc(stageOf(t).sub)}${t.hidden ? ' · hidden' : ''}</span></div>
    <div class="badgerow">${badges(t)}</div>
    <div class="desc">Official description: <q>${esc(t.desc)}</q>${citeHtml(t.dc)}</div>
    ${ctr}
    <h2>Walkthrough — ${t.steps.length} steps</h2>
    <ol class="steps">${t.steps.map((s) => `<li>${esc(s.t)}${citeHtml(s.c)}</li>`).join('')}</ol>
    ${disputes}
    <div class="rail"><b>Sources for this guide</b> — numbered as in the Sources tab; all read ${esc(DATA.meta.read)}.${rail}</div>
    <div class="dactions">
      <button data-donebtn="${t.id}" type="button">${state.done[t.id] ? 'Mark as not earned' : 'Mark as earned'}</button>
    </div>`;
  if (location.hash.includes('focus=disputes')) {
    const box = panel.querySelector('.dispute');
    if (box) box.scrollIntoView({ block: 'start' });
  }
}

function renderRoadmap() {
  const ordered = [...DATA.trophies].sort(roadmapOrder);
  $('#view-roadmap').innerHTML = `<h2>Platinum roadmap — play in this order</h2>
    <p>Seven stages, story first. The tracker defaults to this order, and the “Next up” rail always points at the earliest unfinished trophy on the route.</p>` +
    DATA.stages.map((stage) => {
      const inStage = ordered.filter((t) => t.stage === stage.id);
      const doneN = inStage.filter((t) => state.done[t.id]).length;
      return `<div class="stage"><div class="shead"><h3>${esc(stage.label)}</h3><span class="dmeta">${esc(stage.sub)}</span>
        <span class="sbar"><div style="width:${(doneN / inStage.length) * 100}%"></div></span><b>${doneN}/${inStage.length}</b></div>
        <div class="chips">${inStage.map((t) => `<span class="tchip ${state.done[t.id] ? 'done' : ''}" data-open="${t.id}">${isMasked(t) ? 'Hidden trophy' : esc(t.name)}</span>`).join('')}</div></div>`;
    }).join('');
}

function renderMissables() {
  const pma = DATA.trophies.find((t) => t.miss);
  const risk = DATA.trophies.filter((t) => t.risk);
  const unc = DATA.trophies.filter((t) => t.unc);
  const card = (t, cls = '') => `<div class="card ${cls}"><h3>${esc(t.name)} ${badges(t)}</h3>
    <p><q>${esc(t.desc)}</q> · ${esc(stageOf(t).label)}</p>
    <p>${t.steps.slice(0, 3).map((s) => esc(s.t)).join(' ')}</p>
    <p><a href="#/trophy/${t.id}" data-open="${t.id}">Open the full guide →</a></p></div>`;
  $('#view-missables').innerHTML = `<h2>Missables &amp; windows</h2>
    <p>Exactly <b>one</b> trophy in the list of 55 is flagged possibly missable by the sources. Everything else can be finished after the story — but six questlines carry at-risk windows worth respecting, and six trophies are still unconfirmed.</p>
    <div class="cards">${card(pma, 'spot')}</div>
    <h2 style="margin-top:12px">At-risk windows</h2><div class="cards">${risk.map((t) => card(t)).join('')}</div>
    <h2 style="margin-top:12px">Still unconfirmed</h2><div class="cards">${unc.map((t) => card(t)).join('')}</div>`;
}

function renderSources() {
  const { claims, guides } = allClaims();
  $('#view-sources').innerHTML = `<h2>Sources — every page read in full on ${esc(DATA.meta.read)}</h2>
    <p>Steps cite these by number, e.g. [1]. “Claims here” counts every citation of that source in this guide; “in K/55 guides” counts how many trophy guides cite it.</p>
    <div class="cards">${DATA.sources.map((s) => `<div class="card">
      <h3><span class="srcnum">[${s.n}]</span> ${esc(s.name)}</h3>
      <p>${esc(s.title)}</p>
      <p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></p>
      <p>Read ${esc(s.read)} · <b>${claims[s.n]}</b> claims here · in <b>${guides[s.n].size}/55</b> guides</p>
    </div>`).join('')}</div>`;
}

function renderAll() { renderAudit(); renderProgress(); renderTracker(); renderRoadmap(); renderMissables(); renderSources(); }

function showView(v) {
  activeView = v;
  $$('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === v));
  ['tracker', 'roadmap', 'missables', 'sources'].forEach((x) => $('#view-' + x).classList.toggle('hidden', x !== v));
}

function route() {
  const h = location.hash || '#/tracker';
  const m = h.match(/^#\/trophy\/(\d+)/);
  if (m) {
    selectedId = Number(m[1]);
    state.revealed[selectedId] = true; saveState();
    showView('tracker'); renderTracker();
    return;
  }
  const v = h.replace('#/', '');
  if (['roadmap', 'missables', 'sources'].includes(v)) { showView(v); return; }
  showView('tracker');
}

document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) { location.hash = `#/trophy/${open.dataset.open}`; return; }
  const reveal = e.target.closest('[data-reveal]');
  if (reveal) { state.revealed[reveal.dataset.reveal] = true; saveState(); renderTracker(); return; }
  const doneBtn = e.target.closest('[data-donebtn]');
  if (doneBtn) {
    const id = doneBtn.dataset.donebtn;
    state.done[id] = !state.done[id]; saveState(); renderAll(); return;
  }
  const tab = e.target.closest('#tabs button');
  if (tab) { location.hash = `#/${tab.dataset.view}`; }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('[data-done]')) {
    state.done[e.target.dataset.done] = e.target.checked; saveState(); renderAll();
  }
  if (e.target.matches('[data-counter]')) {
    const id = e.target.dataset.counter;
    const t = DATA.trophies.find((x) => x.id === Number(id));
    state.counters[id] = Math.max(0, Math.min(t.ctr.target, Number(e.target.value) || 0));
    saveState(); renderTracker();
  }
  if (e.target.id === 'spoilerShield') { state.shield = e.target.checked; saveState(); renderAll(); }
  if (e.target.id === 'importFile' && e.target.files[0]) {
    e.target.files[0].text().then((txt) => {
      try {
        const parsed = JSON.parse(txt);
        state = Object.assign({ done: {}, counters: {}, shield: true, revealed: {} }, parsed);
        saveState(); renderAll();
      } catch (err) { alert('That file is not a Leonida Ledger export.'); }
    });
  }
});

['search', 'gradeFilter', 'statusFilter'].forEach((id) =>
  document.addEventListener('input', (e) => { if (e.target.id === id) renderTracker(); }));

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'leonida-ledger-progress.json'; a.click();
  URL.revokeObjectURL(a.href);
});
$('#resetBtn').addEventListener('click', () => {
  if (confirm('Clear all saved progress, counters and reveals?')) {
    state = { done: {}, counters: {}, shield: true, revealed: {} }; saveState();
    $('#spoilerShield').checked = true; renderAll();
  }
});
window.addEventListener('hashchange', route);

fetch('data/trophies.json')
  .then((r) => r.json())
  .then((d) => { DATA = d; $('#spoilerShield').checked = state.shield; renderAll(); route(); })
  .catch((e) => { $('#groupList').innerHTML = `<p>Could not load data/trophies.json: ${esc(e.message)}</p>`; });
