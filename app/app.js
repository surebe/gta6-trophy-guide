'use strict';
/* Leonida Ledger — GTA VI trophy tracker. All statistics on this page are
   computed from app/data/trophies.json at load; nothing is hard-coded. */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cites = (arr) => (arr && arr.length) ? ' <span class="cites">' + arr.map((n) => '[' + n + ']').join(' ') + '</span>' : '';
const LS_KEY = 'leonida-ledger-v7';

let DATA = null, TROPHIES = [], SOURCES = [], META = {};
let state = loadState();
let selectedId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const s = JSON.parse(raw); if (s && typeof s === 'object') return { done: s.done || {}, shield: s.shield !== false, sel: s.sel || null }; }
  } catch (e) { /* fresh state */ }
  return { done: {}, shield: true, sel: null };
}
function saveState() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } }
const isDone = (id) => !!state.done[id];
function setDone(id, v) { if (v) state.done[id] = true; else delete state.done[id]; saveState(); }

function claimCounts() {
  const per = {}; SOURCES.forEach((s) => { per[s.n] = { claims: 0, trophies: new Set() }; });
  const bump = (t, n) => { if (per[n]) { per[n].claims++; per[n].trophies.add(t.id); } };
  TROPHIES.forEach((t) => {
    (t.dc || []).forEach((n) => bump(t, n));
    (t.steps || []).forEach((s) => (s.c || []).forEach((n) => bump(t, n)));
    (t.disputes || []).forEach((d) => { (d.ac || []).forEach((n) => bump(t, n)); (d.bc || []).forEach((n) => bump(t, n)); });
  });
  return per;
}
function trophySources(t) {
  const per = {};
  const bump = (n) => { per[n] = (per[n] || 0) + 1; };
  (t.dc || []).forEach(bump);
  (t.steps || []).forEach((s) => (s.c || []).forEach(bump));
  (t.disputes || []).forEach((d) => { (d.ac || []).forEach(bump); (d.bc || []).forEach(bump); });
  return per;
}
function stagesInOrder() {
  const seen = [];
  TROPHIES.forEach((t) => { if (!seen.includes(t.stage)) seen.push(t.stage); });
  return seen;
}
function totals() {
  const steps = TROPHIES.reduce((a, t) => a + (t.steps || []).length, 0);
  const cited = TROPHIES.reduce((a, t) => a + (t.steps || []).filter((s) => (s.c || []).length > 0).length, 0);
  const multi = TROPHIES.reduce((a, t) => a + (t.steps || []).filter((s) => (s.c || []).length >= 2).length, 0);
  const disputes = TROPHIES.reduce((a, t) => a + (t.disputes || []).length, 0);
  const collect = TROPHIES.reduce((a, t) => a + (t.collect ? t.collect.need : 0), 0);
  const gs = TROPHIES.reduce((a, t) => a + (t.g || 0), 0);
  return { steps, cited, multi, disputes, collect, gs };
}
function renderAudit() {
  const T = totals();
  const grades = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  TROPHIES.forEach((t) => { grades[t.grade] = (grades[t.grade] || 0) + 1; });
  const hidden = TROPHIES.filter((t) => t.hidden).length;
  const miss = TROPHIES.filter((t) => t.missable).length;
  const risk = TROPHIES.filter((t) => t.risk).length;
  const unc = TROPHIES.filter((t) => t.unc).length;
  const citedSrc = new Set();
  TROPHIES.forEach((t) => { Object.keys(trophySources(t)).forEach((n) => citedSrc.add(Number(n))); });
  $('#auditBar').innerHTML =
    '<span class="stat hot"><b>' + TROPHIES.length + '</b> trophies verified</span>' +
    '<span class="stat"><b>' + grades.Platinum + 'P · ' + grades.Gold + 'G · ' + grades.Silver + 'S · ' + grades.Bronze + 'B</b> grade split</span>' +
    '<span class="stat"><b>' + T.gs + '</b> Gamerscore</span>' +
    '<span class="stat"><b>' + hidden + '</b> hidden</span>' +
    '<span class="stat"><b>' + T.steps + '</b> walkthrough steps</span>' +
    '<span class="stat hot"><b>' + T.cited + '/' + T.steps + '</b> steps cited</span>' +
    '<span class="stat"><b>' + T.multi + '</b> steps with 2+ sources</span>' +
    '<span class="stat"><b>' + T.disputes + '</b> source disputes printed</span>';
  $('#auditBar2').innerHTML =
    '<span class="stat"><b>' + META.pagesRead + '</b> pages read in full</span>' +
    '<span class="stat"><b>' + META.sitesRead + '</b> sites · read ' + esc(META.readOn) + '</span>' +
    '<span class="stat"><b>' + citedSrc.size + '/' + SOURCES.length + '</b> sources cited in guide</span>' +
    '<span class="stat hot"><b>' + miss + '</b> missable</span>' +
    '<span class="stat"><b>' + risk + '</b> at-risk strands</span>' +
    '<span class="stat"><b>' + unc + '</b> unconfirmed</span>' +
    '<span class="stat"><b>' + T.collect.toLocaleString('en-US') + '</b> tracked collectible targets</span>' +
    '<span class="stat">roadmap <b>' + esc(META.hours) + ' · ' + esc(META.difficulty) + '</b></span>';
  $('#collectTotal').innerHTML = '<b>' + T.collect.toLocaleString('en-US') + '</b> tracked targets<br>across ' + TROPHIES.filter((t) => t.collect).length + ' counted trophies';
}
function badges(t) {
  let h = '';
  if (t.missable) h += '<span class="badge miss">MISSABLE</span>';
  if (t.risk) h += '<span class="badge risk">AT RISK</span>';
  if (t.unc) h += '<span class="badge unc">UNCONFIRMED</span>';
  if ((t.disputes || []).length) h += '<span class="badge diff">SOURCES DIFFER ×' + t.disputes.length + '</span>';
  if (t.collect) h += '<span class="badge coll">COLLECTIBLE ' + t.collect.need + '</span>';
  h += '<span class="badge stage">' + esc(t.stage) + '</span>';
  return h;
}
function shieldName(t) {
  if (state.shield && t.hidden) return '<span class="shielded">' + esc(t.name) + '</span>';
  return esc(t.name);
}
function renderList() {
  const q = ($('#search').value || '').toLowerCase();
  const gf = $('#gradeFilter').value;
  const hideDone = $('#hideDone').checked;
  const stages = stagesInOrder();
  let html = '';
  stages.forEach((st) => {
    const inStage = TROPHIES.filter((t) => t.stage === st);
    const doneN = inStage.filter((t) => isDone(t.id)).length;
    const rows = inStage.filter((t) => {
      if (gf && t.grade !== gf) return false;
      if (hideDone && isDone(t.id)) return false;
      if (q) {
        const hay = (t.name + ' ' + t.desc + ' ' + t.guide + ' ' + t.stage + ' ' + (t.steps || []).map((s) => s.t).join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (!rows.length) return;
    html += '<div class="grouphead"><span>' + esc(st) + '</span><span class="gprog">' + doneN + '/' + inStage.length + ' done</span></div>';
    rows.forEach((t) => {
      const pct = Math.round(100 * (t.steps || []).filter((s, i) => state.done[t.id + '#' + i]).length / Math.max(1, (t.steps || []).length));
      html += '<div class="trow' + (isDone(t.id) ? ' done' : '') + (selectedId === t.id ? ' sel' : '') + '" data-id="' + t.id + '">' +
        '<input type="checkbox" data-done="' + t.id + '"' + (isDone(t.id) ? ' checked' : '') + ' aria-label="Mark done">' +
        '<div class="tmain"><div class="tname">' + shieldName(t) + '</div>' +
        '<div class="tmeta">' + t.g + 'G · ' + (t.steps || []).length + ' steps · ' + (t.disputes || []).length + ' disputes' + (t.collect ? ' · ' + t.collect.label + ' ' + t.collect.need + '/' + t.collect.world : '') + '</div>' +
        '<div class="mini"><i style="width:' + pct + '%"></i></div></div>' +
        '<span class="grade ' + t.grade + '">' + t.grade + '</span></div>';
    });
  });
  $('#trophyList').innerHTML = html || '<p class="srcnote">No trophies match the current filters.</p>';
  $$('#trophyList .trow').forEach((row) => {
    row.addEventListener('click', (ev) => { if (ev.target.tagName !== 'INPUT') selectTrophy(row.dataset.id, true); });
  });
  $$('#trophyList [data-done]').forEach((cb) => {
    cb.addEventListener('change', () => { setDone(cb.dataset.done, cb.checked); refresh(); });
  });
  const doneTotal = TROPHIES.filter((t) => isDone(t.id)).length;
  $('#overallFill').style.width = (100 * doneTotal / Math.max(1, TROPHIES.length)) + '%';
  $('#overallText').textContent = doneTotal + ' / ' + TROPHIES.length + ' trophies done';
  renderNextUp();
}
function renderNextUp() {
  const stages = stagesInOrder();
  for (const st of stages) {
    const inStage = TROPHIES.filter((t) => t.stage === st);
    const next = inStage.find((t) => !isDone(t.id));
    if (next) {
      const doneN = inStage.filter((t) => isDone(t.id)).length;
      $('#nextUp').innerHTML = '<b>Next Up</b> — ' + esc(st) + ' (' + doneN + '/' + inStage.length + '): <button type="button" id="nextBtn">' + shieldName(next) + '</button>';
      $('#nextBtn').addEventListener('click', () => selectTrophy(next.id, true));
      return;
    }
  }
  $('#nextUp').innerHTML = '<b>Ledger complete.</b> Every trophy is checked off — Leonida Legend status reached.';
}
function selectTrophy(id, scroll) {
  selectedId = id; state.sel = id; saveState();
  renderList(); renderDetail();
  if (scroll && window.innerWidth <= 900) $('#detail').scrollIntoView({ behavior: 'smooth' });
}
function renderDetail() {
  const t = TROPHIES.find((x) => x.id === selectedId) || TROPHIES[0];
  if (!t) { $('#detail').innerHTML = ''; return; }
  selectedId = t.id;
  const shielded = state.shield && t.hidden;
  const per = trophySources(t);
  const rail = Object.keys(per).map(Number).sort((a, b) => a - b).map((n) => {
    const s = SOURCES.find((x) => x.n === n);
    return '<div>[' + n + '] <b>' + esc(s ? s.name : '?') + '</b> — ' + per[n] + ' claim' + (per[n] === 1 ? '' : 's') + ' on this trophy</div>';
  }).join('');
  let h = '<h2>' + (shielded ? '<span class="shielded">' + esc(t.name) + '</span>' : esc(t.name)) + '</h2>';
  h += '<div class="sub">' + t.grade + ' · ' + t.g + ' Gamerscore · ' + esc(t.kind) + (t.hidden ? ' · hidden trophy' : '') + ' · <label class="chk"><input type="checkbox" id="dDone"' + (isDone(t.id) ? ' checked' : '') + '> done</label></div>';
  h += '<div class="badges">' + badges(t) + '</div>';
  if (shielded) h += '<p class="shieldnote">Spoiler shield is ON — this hidden trophy\u2019s text is blurred. Toggle the shield in the Tracker controls to reveal it.</p>';
  h += '<div class="' + (shielded ? 'shielded' : '') + '">';
  h += '<blockquote class="desc">&ldquo;' + esc(t.desc) + '&rdquo;' + cites(t.dc) + '</blockquote>';
  h += '<p class="guide">' + esc(t.guide) + '</p>';
  if (t.collect) {
    const pct = Math.round(100 * t.collect.need / Math.max(1, t.collect.world));
    h += '<div class="collbar"><b>' + esc(t.collect.label) + '</b>: ' + t.collect.need + ' needed of ' + t.collect.world + ' in the world<div class="mini"><i style="width:' + pct + '%"></i></div></div>';
  }
  h += '<h3>Walkthrough</h3><ol class="steps">';
  (t.steps || []).forEach((s, i) => {
    const key = t.id + '#' + i;
    h += '<li><label class="chk"><input type="checkbox" data-step="' + key + '"' + (state.done[key] ? ' checked' : '') + '></label> ' + esc(s.t) + cites(s.c) + '</li>';
  });
  h += '</ol>';
  (t.disputes || []).forEach((d) => {
    h += '<div class="dispute"><div class="dtitle">SOURCES DIFFER</div><div class="dq">' + esc(d.q) + '</div>' +
      '<div class="side"><b>Side A:</b> ' + esc(d.a) + cites(d.ac) + '</div>' +
      '<div class="side"><b>Side B:</b> ' + esc(d.b) + cites(d.bc) + '</div>' +
      '<div class="call"><b>Our call:</b> ' + esc(d.call) + '</div></div>';
  });
  h += '<h3>Sources for this trophy</h3><div class="srail">' + rail + '</div>';
  h += '</div>';
  $('#detail').innerHTML = h;
  $('#dDone').addEventListener('change', (ev) => { setDone(t.id, ev.target.checked); refresh(); });
  $$('#detail [data-step]').forEach((cb) => cb.addEventListener('change', () => { setDone(cb.dataset.step, cb.checked); renderList(); }));
}
function refresh() { renderAudit(); renderList(); renderDetail(); renderRoadmap(); renderMiss(); renderSources(); }
function renderRoadmap() {
  const el = $('#roadmapBody'); if (!el) return;
  const stages = stagesInOrder();
  el.innerHTML = stages.map((st) => {
    const inStage = TROPHIES.filter((t) => t.stage === st);
    const doneN = inStage.filter((t) => isDone(t.id)).length;
    const steps = inStage.reduce((a, t) => a + (t.steps || []).length, 0);
    const items = inStage.map((t) => '<li class="' + (isDone(t.id) ? 'done' : '') + '"><a href="#" data-open="' + t.id + '">' + shieldName(t) + '</a> — ' + t.grade + ' · ' + t.g + 'G · ' + (t.steps || []).length + ' steps</li>').join('');
    return '<div class="stagecard"><h3>' + esc(st) + '</h3><div class="sprog">' + doneN + '/' + inStage.length + ' trophies · ' + steps + ' walkthrough steps · ' + Math.round(100 * doneN / Math.max(1, inStage.length)) + '% complete</div><ul>' + items + '</ul></div>';
  }).join('');
  $$('#roadmapBody [data-open]').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); switchTab('tracker'); selectTrophy(a.dataset.open, true); }));
}
function missCard(title, list, note) {
  if (!list.length) return '';
  const items = list.map((t) => '<li><a href="#" data-open="' + t.id + '">' + shieldName(t) + '</a> — ' + esc(t.guide) + '</li>').join('');
  return '<div class="stagecard"><h3>' + title + ' (' + list.length + ')</h3><div class="sprog">' + note + '</div><ul>' + items + '</ul></div>';
}
function renderMiss() {
  const el = $('#missBody'); if (!el) return;
  el.innerHTML =
    missCard('Missable — one chance only', TROPHIES.filter((t) => t.missable), 'Fail this and the run needs a new save. Do it the moment it appears.') +
    missCard('At risk — story-window strands', TROPHIES.filter((t) => t.risk), 'Guides disagree about whether these strands survive the story. Start them early; it costs nothing.') +
    missCard('Unconfirmed — method not yet verified', TROPHIES.filter((t) => t.unc), 'Most published lists still mark these unconfirmed. This guide prints the best available method with its dispute box.') +
    missCard('Hidden trophies', TROPHIES.filter((t) => t.hidden), 'Masked on the platform until earned. The spoiler shield blurs these while it is on.');
  $$('#missBody [data-open]').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); switchTab('tracker'); selectTrophy(a.dataset.open, true); }));
}
function renderSources() {
  const el = $('#sourceList'); if (!el) return;
  const per = claimCounts();
  const rows = SOURCES.map((s) => {
    const c = per[s.n] || { claims: 0, trophies: new Set() };
    return '<tr><td>[' + s.n + ']</td><td><b>' + esc(s.name) + '</b></td><td><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a></td><td>' + esc(s.read) + '</td><td>' + c.claims + '</td><td>' + c.trophies.size + '</td></tr>';
  }).join('');
  el.innerHTML = '<table class="src"><thead><tr><th>#</th><th>Source</th><th>Page read</th><th>Read on</th><th>Claims cited</th><th>Trophies citing</th></tr></thead><tbody>' + rows + '</tbody></table>';
}
function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: 'leonida-ledger', version: 7, done: state.done }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'leonida-ledger-progress.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importProgress(ev) {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  f.text().then((txt) => {
    try {
      const parsed = JSON.parse(txt);
      if (parsed && parsed.done && typeof parsed.done === 'object') { state.done = parsed.done; saveState(); refresh(); }
    } catch (e) { /* ignore malformed import */ }
    ev.target.value = '';
  });
}
function switchTab(name) {
  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
}
function init() {
  fetch('data/trophies.json').then((r) => r.json()).then((d) => {
    DATA = d; TROPHIES = d.trophies || []; SOURCES = d.sources || []; META = d.meta || {};
    if (state.sel && TROPHIES.some((t) => t.id === state.sel)) selectedId = state.sel;
    $('#shieldToggle').checked = state.shield;
    refresh();
    const hp = new URLSearchParams(location.hash.slice(1));
    const htab = hp.get('tab');
    if (htab && ['tracker', 'roadmap', 'missables', 'sources'].includes(htab)) switchTab(htab);
    const htid = hp.get('trophy');
    if (htid && TROPHIES.some((t) => t.id === htid)) selectTrophy(htid, false);
    if (!selectedId && TROPHIES.length) selectTrophy(TROPHIES[0].id, false);
  }).catch((e) => { $('#detail').innerHTML = '<p>Could not load trophy data: ' + esc(e.message) + '</p>'; });
  $$('.tab').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  ['search', 'gradeFilter', 'hideDone'].forEach((id) => $('#' + id).addEventListener('input', renderList));
  $('#shieldToggle').addEventListener('change', (ev) => { state.shield = ev.target.checked; saveState(); renderList(); renderDetail(); });
  $('#exportBtn').addEventListener('click', exportProgress);
  $('#importFile').addEventListener('change', importProgress);
  $('#resetBtn').addEventListener('click', () => { state.done = {}; saveState(); refresh(); });
}
document.addEventListener('DOMContentLoaded', init);
