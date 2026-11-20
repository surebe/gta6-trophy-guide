// Leonida Ledger — GTA VI trophy guide and tracker.
// Static, offline: the whole guide lives in data/trophies.json. Progress stays
// in this browser's localStorage; nothing is sent anywhere.
const KEY = 'leonida-ledger-v1';
const $ = (id) => document.getElementById(id);
const KIND_LABEL = {
  story: 'Story', character: 'Character questline', activity: 'Activity',
  partner: 'Partner', robbery: 'Robbery', explore: 'Exploration',
  misc: 'One-off', platinum: 'Platinum',
};

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const sourcesById = new Map(doc.sources.map((s) => [s.id, s]));
const params = new URLSearchParams(location.search);

let state = load();
let spoilerOn = params.get('spoilers') !== 'off';
let revealed = new Set();
let selectedId = null;
let currentTab = 'tracker';

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && Array.isArray(raw.earned)) {
      return { earned: new Set(raw.earned), counts: raw.counts ?? {} };
    }
  } catch { /* corrupted save: start fresh */ }
  return { earned: new Set(), counts: {} };
}
function save() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...state.earned], counts: state.counts }));
}

// ---------- derived numbers, computed live from the dataset ----------
function totals() {
  const steps = trophies.flatMap((t) => t.steps);
  const multi = steps.filter((s) => s.s.length >= 2).length;
  const disputes = trophies.flatMap((t) => t.disputes);
  const disputed = trophies.filter((t) => t.disputes.length > 0).length;
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hidden = 0;
  for (const t of trophies) { grades[t.grade]++; if (t.hidden) hidden++; }
  return { steps: steps.length, multi, disputes: disputes.length, disputed, grades, hidden };
}
function citeCounts() {
  const steps = new Map();
  const trophiesHit = new Map();
  for (const s of doc.sources) { steps.set(s.id, 0); trophiesHit.set(s.id, new Set()); }
  for (const t of trophies) {
    for (const st of t.steps) {
      for (const id of new Set(st.s)) {
        steps.set(id, (steps.get(id) ?? 0) + 1);
        trophiesHit.get(id)?.add(t.id);
      }
    }
  }
  return { steps, trophiesHit };
}

// ---------- audit bar and stats ----------
function renderAudit() {
  const n = totals();
  $('audit').innerHTML =
    `<b>${trophies.length} trophies</b> · ${n.grades.platinum} Platinum · ${n.grades.gold} Gold · ` +
    `${n.grades.silver} Silver · ${n.grades.bronze} Bronze · ${n.hidden} hidden · ` +
    `<b>${n.steps} guide steps</b> · ${n.steps}/${n.steps} cited · ${n.multi} with 2+ sources · ` +
    `<b>${n.disputes} disputes</b> across ${n.disputed} trophies · ${doc.sources.length} sources read 20 Nov 2026`;
}
function renderStats() {
  const earned = state.earned.size;
  let points = 0, gs = 0;
  for (const id of state.earned) {
    const t = byId.get(id);
    if (t) { points += t.points; gs += t.gamerscore; }
  }
  const totalPoints = trophies.reduce((a, t) => a + t.points, 0);
  const totalGs = trophies.reduce((a, t) => a + t.gamerscore, 0);
  const pct = Math.round((earned / trophies.length) * 100);
  $('stats').innerHTML =
    stat('Earned', `${earned} / ${trophies.length}`) +
    stat('Points', `${points} / ${totalPoints}`) +
    stat('Gamerscore', `${gs} / ${totalGs}`) +
    stat('Complete', `${pct}%`) +
    stat('Disputes shown', `${totals().disputes}`);
  function stat(k, v) { return `<div class="stat"><span class="k">${k}</span><span class="v">${v}</span></div>`; }
}

// ---------- tracker list ----------
function isVisible(t) {
  const q = $('search').value.trim().toLowerCase();
  if ($('kindFilter').value !== 'all' && t.kind !== $('kindFilter').value) return false;
  if ($('gradeFilter').value !== 'all' && t.grade !== $('gradeFilter').value) return false;
  if ($('statusFilter').value === 'earned' && !state.earned.has(t.id)) return false;
  if ($('statusFilter').value === 'todo' && state.earned.has(t.id)) return false;
  if ($('disputedOnly').checked && t.disputes.length === 0) return false;
  if (q) {
    const hay = [t.name, t.description, t.guide, ...t.disputes.map((d) => d.q)].join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
function masked(t) { return spoilerOn && t.hidden && !revealed.has(t.id); }
function gradeBadge(t) { return `<span class="badge ${t.grade}">${t.grade}</span>`; }

function renderList() {
  const list = $('trophyList');
  list.replaceChildren();
  const shown = trophies.filter(isVisible);
  $('listCount').textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (state.earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', (e) => { e.stopPropagation(); toggleEarned(t.id, box.checked); });
    box.addEventListener('click', (e) => e.stopPropagation());
    const mid = document.createElement('div');
    if (masked(t)) {
      mid.innerHTML = `<div class="trophy-name"><span class="hidden-tag">Hidden trophy</span> — tap to reveal</div>` +
        `<div class="trophy-desc">Spoiler shield is on. Reveal it to see the name and guide.</div>`;
      const rev = document.createElement('button');
      rev.type = 'button';
      rev.className = 'reveal-btn';
      rev.textContent = 'Reveal this trophy';
      rev.addEventListener('click', (e) => { e.stopPropagation(); revealed.add(t.id); renderList(); });
      mid.append(rev);
    } else {
      mid.innerHTML = `<div class="trophy-name"></div><div class="trophy-desc"></div>` +
        `<div class="trophy-meta">${gradeBadge(t)}<span class="pill">${KIND_LABEL[t.kind]}</span>` +
        `<span class="pill">${t.points} pts · ${t.gamerscore}G</span>` +
        (t.count ? `<span class="pill">${countText(t)}</span>` : '') +
        (t.disputes.length ? `<span class="pill disputed">${t.disputes.length} dispute${t.disputes.length > 1 ? 's' : ''}</span>` : '') +
        `</div>`;
      mid.querySelector('.trophy-name').textContent = t.name;
      mid.querySelector('.trophy-desc').textContent = t.description;
    }
    const right = document.createElement('div');
    right.className = 'trophy-meta';
    right.textContent = t.steps.length + ' steps';
    li.append(box, mid, right);
    li.addEventListener('click', () => selectTrophy(t.id));
    list.append(li);
  }
}
function countText(t) {
  const v = state.counts[t.id] ?? 0;
  return `${v}/${fmtCount(t.count)} ${t.countLabel}`;
}
function fmtCount(n) { return n >= 1000 ? n.toLocaleString('en-US') : String(n); }

function toggleEarned(id, on) {
  if (on) state.earned.add(id); else state.earned.delete(id);
  save(); renderStats(); renderList(); renderRoadmap(); renderNextUp();
  if (selectedId === id) renderDetail();
}

// ---------- detail pane ----------
function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
  $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function renderDetail() {
  const el = $('detail');
  const t = byId.get(selectedId);
  if (!t) {
    el.innerHTML = '<p class="detail-empty">Pick a trophy to see its guide, cited steps, counter and any dispute.</p>';
    return;
  }
  if (masked(t)) {
    el.innerHTML = `<h2>Hidden trophy</h2><p class="desc">Spoiler shield is on for this one.</p>` +
      `<button type="button" class="reveal-btn" id="detailReveal">Reveal this trophy</button>`;
    $('detailReveal').addEventListener('click', () => { revealed.add(t.id); renderList(); renderDetail(); });
    return;
  }
  const stepsHtml = t.steps.map((s, i) =>
    `<li>${escapeHtml(s.t)}${s.s.map((id) => `<span class="cite" title="${escapeHtml(sourcesById.get(id)?.title ?? id)}">${escapeHtml(sourcesById.get(id)?.site ?? id)}</span>`).join('')}</li>`).join('');
  const disputesHtml = t.disputes.map((d) =>
    `<div class="dispute"><h4>Sources differ — ${escapeHtml(d.q)}</h4>` +
    `<p class="side-a">${escapeHtml(d.a)}</p><p class="side-b">${escapeHtml(d.b)}</p>` +
    `<p class="call">${escapeHtml(d.call)}</p></div>`).join('');
  const railIds = [...new Set(t.steps.flatMap((s) => s.s))];
  const rail = railIds.map((id) => {
    const s = sourcesById.get(id);
    return `<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.site)}</a>`;
  }).join('');
  const v = state.counts[t.id] ?? 0;
  el.innerHTML =
    `<h2></h2><p class="desc"></p>` +
    `<div class="trophy-meta">${gradeBadge(t)}<span class="pill">${KIND_LABEL[t.kind]}</span>` +
    `<span class="pill">${t.points} pts · ${t.gamerscore}G</span>` +
    (t.hidden ? `<span class="pill">Hidden</span>` : '') + `</div>` +
    `<label class="earned-toggle"><input type="checkbox" id="detailEarned"> Earned</label>` +
    `<p class="guide"></p>` +
    (t.count ? `<h3>Counter</h3><div class="counter"><button type="button" id="countDown" aria-label="Decrease counter">−</button><span class="count-val" id="countVal"></span><button type="button" id="countUp" aria-label="Increase counter">+</button></div>` : '') +
    `<h3>Guide — ${t.steps.length} steps</h3><ol class="steps">${stepsHtml}</ol>` +
    (t.disputes.length ? `<h3>Sources differ (${t.disputes.length})</h3>${disputesHtml}` : '') +
    `<h3>Sources for this trophy</h3><div class="sources-rail">${rail}</div>`;
  el.querySelector('h2').textContent = t.name;
  el.querySelector('.desc').textContent = t.description;
  el.querySelector('.guide').textContent = t.guide;
  const chk = $('detailEarned');
  chk.checked = state.earned.has(t.id);
  chk.addEventListener('change', () => toggleEarned(t.id, chk.checked));
  if (t.count) {
    const show = () => { $('countVal').textContent = `${v}/${fmtCount(t.count)} ${t.countLabel}`; };
    $('countVal').textContent = `${v}/${fmtCount(t.count)} ${t.countLabel}`;
    $('countDown').addEventListener('click', () => bumpCount(t, -1));
    $('countUp').addEventListener('click', () => bumpCount(t, 1));
    show();
  }
}
function bumpCount(t, d) {
  const v = Math.max(0, Math.min(t.count, (state.counts[t.id] ?? 0) + d));
  state.counts[t.id] = v;
  if (v >= t.count) state.earned.add(t.id);
  save(); renderStats(); renderList(); renderDetail();
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- roadmap ----------
function renderRoadmap() {
  const ol = $('roadmap');
  ol.replaceChildren();
  for (const stage of doc.roadmap) {
    const done = stage.trophies.every((id) => state.earned.has(id));
    const li = document.createElement('li');
    if (done) li.className = 'done';
    const chips = stage.trophies.map((id) => {
      const t = byId.get(id);
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = masked(t) ? 'Hidden trophy' : t.name;
      if (state.earned.has(id)) b.className = 'earned';
      b.addEventListener('click', () => { showTab('tracker'); selectTrophy(id); });
      return b;
    });
    li.innerHTML = `<h3><span class="stage-n">Stage ${stage.n}</span><span></span></h3><p></p><div class="stage-trophies"></div>`;
    li.querySelector('h3 span:last-child').textContent = stage.title;
    li.querySelector('p').textContent = stage.text;
    const wrap = li.querySelector('.stage-trophies');
    for (const b of chips) wrap.append(b);
    ol.append(li);
  }
}
function renderNextUp() {
  const el = $('nextup');
  const stage = doc.roadmap.find((s) => s.trophies.some((id) => !state.earned.has(id)));
  const next = trophies.filter((t) => !state.earned.has(t.id)).slice(0, 3);
  if (!stage) {
    el.innerHTML = '<h2>Platinum done.</h2><p>Every trophy is earned. Vice Got a Price! is yours.</p>';
    return;
  }
  el.innerHTML = `<h2>Next up — Stage ${stage.n}: ${escapeHtml(stage.title)}</h2>` +
    `<p>${escapeHtml(stage.text)}</p>` +
    `<p>Still to do next: ${next.map((t) => escapeHtml(masked(t) ? 'Hidden trophy' : t.name)).join(' · ')}</p>`;
  document.querySelectorAll('#tab-roadmap .roadmap li').forEach((li, i) => {
    li.classList.toggle('next', doc.roadmap[i] === stage);
  });
}

// ---------- missables ----------
function renderMissables() {
  const pma = byId.get(28);
  $('missables').innerHTML =
    `<div class="miss-card alert"><h2>⚠ The one trophy that can lock you out: Positive Mental Attitude</h2>` +
    `<p><b>Do Lucia's balcony meditation in Chapter 1, before the chapter ends.</b> After the mission Down to Earth, find Lucia in the kitchen in the morning. She walks out to the balcony — follow her, talk to her and choose Accept.</p>` +
    `<p>The meditation raises your counter by 1, but it is not marked as a Meditation Spot like the other 17. Whether the trophy needs it is <b>unconfirmed</b> in every guide we read — PowerPyx, GTABase, KeenGamer, EGamers and GTA Zone all say so, while OutputLag's short answer says it counts. Do it anyway: it costs two minutes and it is the only known lockout risk in the whole list.</p>` +
    `<p>Then meditate at the other 17 spots with both characters — each spot counts twice, once per character. The last one needs both characters together, after Coffee Break in Chapter 2.</p></div>` +
    `<div class="miss-card"><h2>Timed: Yago's race</h2>` +
    `<p>Race Against Yago, in Yago's street-racing strand in Chapter 3, carries an hourglass icon. OutputLag is the only guide that flags it: do it the moment it appears, and save first. The strand counts toward Strangers &amp; Freaks.</p></div>` +
    `<div class="miss-card"><h2>Save like there is no replay — because there is not</h2>` +
    `<p>15 manual save slots plus 1 autosave. No mission replay, no New Game+. Keep one save at the start of every chapter and one untouched save from just before the final mission, and rotate the rest.</p></div>` +
    `<div class="miss-card"><h2>Everything else can wait</h2>` +
    `<p>Every other trophy, story ones included, can be earned after the credits. Nothing on the 100% checklist is missable, and the character questlines all stay open after the story.</p></div>`;
}

// ---------- sources ----------
function renderSources() {
  const { steps, trophiesHit } = citeCounts();
  const body = $('sourcesBody');
  body.replaceChildren();
  for (const s of doc.sources) {
    const tr = document.createElement('tr');
    const a = document.createElement('a');
    a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = `${s.title} — ${s.site}`;
    const td0 = document.createElement('td'); td0.append(a);
    const td1 = document.createElement('td'); td1.textContent = s.read;
    const td2 = document.createElement('td'); td2.textContent = String(steps.get(s.id) ?? 0);
    const td3 = document.createElement('td'); td3.textContent = String(trophiesHit.get(s.id)?.size ?? 0);
    tr.append(td0, td1, td2, td3);
    body.append(tr);
  }
}

// ---------- tabs, filters, footer ----------
function showTab(name) {
  currentTab = name;
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tabpage').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
for (const id of ['search', 'kindFilter', 'gradeFilter', 'statusFilter', 'disputedOnly']) {
  $(id).addEventListener('input', renderList);
  $(id).addEventListener('change', renderList);
}
$('spoilerBtn').addEventListener('click', () => {
  spoilerOn = !spoilerOn;
  $('spoilerBtn').textContent = spoilerOn ? 'Spoilers: hidden' : 'Spoilers: shown';
  $('spoilerBtn').setAttribute('aria-pressed', String(spoilerOn));
  renderList(); renderRoadmap(); if (selectedId) renderDetail();
});
function applySample(persist) {
  const sample = { earned: [2, 3, 4, 5, 6, 8, 21, 36], counts: { 15: 137, 31: 64, 28: 9, 32: 41 } };
  state = { earned: new Set(sample.earned), counts: { ...sample.counts } };
  if (persist) save();
  renderAll();
}
$('sampleBtn').addEventListener('click', () => applySample(true));
$('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...state.earned], counts: state.counts }, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const raw = JSON.parse(await file.text());
    if (!Array.isArray(raw.earned)) throw new Error('bad file');
    state = { earned: new Set(raw.earned.filter((id) => byId.has(id))), counts: raw.counts ?? {} };
    save(); renderAll();
  } catch { alert('That file is not a Leonida Ledger progress export.'); }
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies and counters?')) return;
  state = { earned: new Set(), counts: {} };
  save(); renderAll();
});

function renderAll() {
  renderAudit(); renderStats(); renderList(); renderRoadmap(); renderNextUp(); renderMissables(); renderSources();
  if (selectedId) renderDetail();
}
renderAll();
$('spoilerBtn').textContent = spoilerOn ? 'Spoilers: hidden' : 'Spoilers: shown';
$('spoilerBtn').setAttribute('aria-pressed', String(spoilerOn));
if (params.get('sample') === '1') applySample(false);
const tabParam = params.get('tab');
if (tabParam && ['tracker', 'roadmap', 'missables', 'sources'].includes(tabParam)) showTab(tabParam);
const trophyParam = Number(params.get('trophy'));
if (trophyParam && byId.has(trophyParam)) {
  if (spoilerOn && byId.get(trophyParam).hidden) revealed.add(trophyParam);
  selectTrophy(trophyParam);
}
