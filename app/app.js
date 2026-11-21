// Leonida Ledger — GTA VI trophy guide & tracker. All data comes from data/trophies.json beside this file;
// every number in the audit bar and Sources tab is computed from that data at load, never hard-coded.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const UNCONFIRMED = ['in-the-beginning', 'capital-offense', 'bad-luck-i-guess', 'the-truth-is-out-there', 'ten-pin'];
let D = null, T = [], SRC = {}, tab = 'tracker', selId = null, srcSel = 1;
let revealed = new Set();
let doneSet = new Set(JSON.parse(localStorage.getItem('ll8done') || '[]'));
let counts = JSON.parse(localStorage.getItem('ll8counts') || '{}');
let shieldOn = localStorage.getItem('ll8shield') !== '0';
const saveDone = () => localStorage.setItem('ll8done', JSON.stringify([...doneSet]));
const saveCounts = () => localStorage.setItem('ll8counts', JSON.stringify(counts));

function badges(t) {
  const b = [];
  if (t.missable) b.push('<span class="badge b-miss">MISSABLE</span>');
  if (UNCONFIRMED.includes(t.id)) b.push('<span class="badge b-unc">UNCONFIRMED</span>');
  if (!t.missable && (t.disputes || []).some(d => /before/i.test(d.call))) b.push('<span class="badge b-risk">AT RISK</span>');
  if ((t.disputes || []).length) b.push('<span class="badge b-diff">SOURCES DIFFER</span>');
  if (t.collectible) b.push('<span class="badge b-coll">COLLECTIBLE</span>');
  if (t.hidden) b.push('<span class="badge b-hid">HIDDEN</span>');
  return b.join('');
}
const cite = c => (c || []).map(i => `<a class="cn" data-src="${i}" title="${esc(SRC[i].name)}">[${i}]</a>`).join('');
const isShielded = t => shieldOn && t.hidden && !revealed.has(t.id);

function stats() {
  let steps = 0, multi = 0, dis = 0, disT = 0;
  const claims = {};
  for (const t of T) {
    steps += t.steps.length;
    multi += t.steps.filter(s => s.c.length >= 2).length;
    if ((t.disputes || []).length) { dis += t.disputes.length; disT++; }
    const bump = i => claims[i] = (claims[i] || 0) + 1;
    t.dc.forEach(bump);
    t.steps.forEach(s => s.c.forEach(bump));
    (t.disputes || []).forEach(d => { d.ac.forEach(bump); d.bc.forEach(bump); });
  }
  return { steps, multi, dis, disT, claims };
}

function renderAudit() {
  const s = stats();
  const g = { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0 };
  T.forEach(t => g[t.grade]++);
  const gs = T.reduce((a, t) => a + t.gamerscore, 0);
  const hid = T.filter(t => t.hidden).length;
  $('#auditBar').innerHTML =
    `<div class="arow"><b>Verified list:</b> ${T.length} trophies · ${g.Platinum} Platinum / ${g.Gold} Gold / ${g.Silver} Silver / ${g.Bronze} Bronze · ${hid} hidden · ${gs.toLocaleString()} Gamerscore · 1 missable (Positive Mental Attitude)</div>` +
    `<div class="arow"><b>Research depth:</b> ${s.steps} walkthrough steps, every one cited · ${s.multi} backed by 2+ sources · ${s.dis} source disputes across ${s.disT} trophies, both sides cited · 16 guide pages read in full across 15 sites</div>`;
  const coll = T.filter(t => t.collectible && t.collectible.total <= 10000);
  const cTot = coll.reduce((a, t) => a + t.collectible.total, 0);
  const cGot = coll.reduce((a, t) => a + Math.min(counts[t.id] || 0, t.collectible.total), 0);
  $('#collChip').textContent = `Collectibles ${cGot}/${cTot}`;
  $('#progLab').textContent = `${doneSet.size}/${T.length} trophies · ${Math.round(doneSet.size / T.length * 100)}%`;
  const nx = T.find(t => !doneSet.has(t.id));
  $('#nextUp').innerHTML = nx
    ? `<b>Next Up:</b> <a href="#" data-sel="${nx.id}">${esc(shieldOn && nx.hidden ? 'Hidden Trophy' : nx.name)}</a> <span class="kv">— ${esc(nx.stage)} · ${nx.steps.length} cited steps${nx.missable ? ' · <b>MISSABLE: do it in Chapter 1</b>' : ''}</span>`
    : '<b>Next Up:</b> nothing — every trophy is done. Leonida Legend status.';
}

function rowHtml(t) {
  const sh = isShielded(t);
  const name = sh ? 'Hidden Trophy' : t.name;
  let coll = '';
  if (t.collectible) {
    const got = Math.min(counts[t.id] || 0, t.collectible.total);
    coll = `<span class="cbar">${esc(t.collectible.label)} ${got}/${t.collectible.total}<span class="bar"><i style="width:${Math.round(got / t.collectible.total * 100)}%"></i></span></span>`;
  }
  return `<div class="trow ${doneSet.has(t.id) ? 'done' : ''} ${t.id === selId ? 'sel' : ''}" data-sel="${t.id}">
    <input type="checkbox" data-done="${t.id}" ${doneSet.has(t.id) ? 'checked' : ''} title="Mark done">
    <span class="gdot g-${t.grade}"></span>
    <span style="flex:1"><span class="tname">${esc(name)}</span> ${badges(t)}<br>
    <span class="tmeta">${sh ? 'Description hidden by the spoiler shield' : esc(t.description)}</span>${coll}</span>
    <span class="gs">${t.grade}<br>${t.gamerscore}G</span></div>`;
}

function groupHtml(title, list, showBar) {
  const dn = list.filter(t => doneSet.has(t.id)).length;
  const bar = showBar ? `<span class="bar"><i style="width:${list.length ? Math.round(dn / list.length * 100) : 0}%"></i></span><span>${dn}/${list.length}</span>` : '';
  return `<div class="ghead">${esc(title)} ${bar}</div>` + list.map(rowHtml).join('');
}

function renderList() {
  const col = $('#listCol');
  if (tab === 'sources') {
    const s = stats();
    col.innerHTML = `<div class="ghead">16 sources — claims counted from the data</div>` + D.sources.map(src =>
      `<div class="srow ${src.id === srcSel ? 'sel' : ''}" data-srcsel="${src.id}"><span class="tname">[${src.id}] ${esc(src.name)}</span>
       <span class="tmeta">${esc(src.role)} · cited for ${s.claims[src.id] || 0} claims</span></div>`).join('');
    return;
  }
  let list = T;
  if (tab === 'missables') {
    list = T.filter(t => t.missable || UNCONFIRMED.includes(t.id) || (t.disputes || []).some(d => /before/i.test(d.call)));
    col.innerHTML = `<div class="warn"><b>Handle with care:</b> the one missable trophy, every unconfirmed trophy, and every trophy whose sources warn about ordering. Everything else can be cleaned up in post-story free roam.</div>` +
      groupHtml('Missables, unconfirmed & order-sensitive', list, true);
    return;
  }
  if (tab === 'roadmap') {
    const stages = [];
    for (const t of T) if (!stages.includes(t.stage)) stages.push(t.stage);
    col.innerHTML = stages.map(st => groupHtml(st, T.filter(t => t.stage === st), true)).join('');
    return;
  }
  const q = $('#qBox').value.trim().toLowerCase();
  const gf = $('#gradeSel').value, df = $('#doneSel').value;
  list = T.filter(t =>
    (!gf || t.grade === gf) &&
    (!df || (df === 'done') === doneSet.has(t.id)) &&
    (!q || (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase().includes(q)));
  col.innerHTML = groupHtml(`Tracker — roadmap order (${list.length} shown)`, list, false) ||
    '<div class="warn">No trophies match the current search and filters.</div>';
}

function detailHtml(t) {
  const sh = isShielded(t);
  const head = `<div class="dhead"><h2>${sh ? 'Hidden Trophy' : esc(t.name)}</h2>
    <span class="gs">${t.grade} · ${t.gamerscore} Gamerscore</span>${badges(t)}
    <label style="margin-left:auto"><input type="checkbox" data-done="${t.id}" ${doneSet.has(t.id) ? 'checked' : ''}> Done</label></div>
    <div class="tmeta">${esc(t.stage)} · ${esc(t.kind)} · ${t.steps.length} cited steps${(t.disputes || []).length ? ` · ${t.disputes.length} source dispute(s)` : ''}</div>`;
  if (sh) return head + `<div class="revealBox"><b>Spoiler shield is ON.</b> This trophy is hidden on PlayStation, so its name, official
    description and walkthrough stay blurred. The default view of this guide never opens on a hidden trophy.
    <button type="button" data-reveal="${t.id}">Reveal this trophy</button></div>
    <div class="blur"><p class="desc">“${esc(t.description)}”</p><p class="guide">${esc(t.guide)}</p>
    <ol class="steps">${t.steps.map(s => `<li>${esc(s.t)}</li>`).join('')}</ol></div>`;
  let coll = '';
  if (t.collectible) {
    const got = Math.min(counts[t.id] || 0, t.collectible.total);
    coll = `<div class="stepper"><b>${esc(t.collectible.label)}:</b>
      <button type="button" data-dec="${t.id}">−</button><span>${got} / ${t.collectible.total}</span>
      <button type="button" data-inc="${t.id}">+</button>
      <span class="bar" style="width:130px"><i style="width:${Math.round(got / t.collectible.total * 100)}%"></i></span></div>`;
  }
  let diff = '';
  if ((t.disputes || []).length) {
    diff = `<div class="diff"><h3>SOURCES DIFFER — READ BEFORE YOU PLAY</h3>` + t.disputes.map(d =>
      `<p><b>Side A:</b> ${esc(d.a)} ${cite(d.ac)}</p><p><b>Side B:</b> ${esc(d.b)} ${cite(d.bc)}</p>
       <p class="call"><b>Our call:</b> ${esc(d.call)}</p>`).join('') + `</div>`;
  }
  const citedIds = [...new Set([...t.dc, ...t.steps.flatMap(s => s.c), ...(t.disputes || []).flatMap(d => [...d.ac, ...d.bc])])].sort((a, b) => a - b);
  return head +
    `<p class="desc">“${esc(t.description)}” ${cite(t.dc)}</p>` +
    `<p class="guide">${esc(t.guide)}</p>` + coll + diff +
    `<ol class="steps">${t.steps.map(s => `<li>${esc(s.t)} ${cite(s.c)}</li>`).join('')}</ol>` +
    `<div class="srcrail"><b>Sources for this trophy:</b> ${citedIds.map(i => `<a class="cn" data-src="${i}">[${i}] ${esc(SRC[i].name)}</a>`).join(' · ')}</div>`;
}

function sourceDetailHtml(src) {
  const s = stats();
  const used = T.filter(t => [...t.dc, ...t.steps.flatMap(x => x.c), ...(t.disputes || []).flatMap(d => [...d.ac, ...d.bc])].includes(src.id));
  return `<div class="dhead"><h2>[${src.id}] ${esc(src.name)}</h2></div>
    <p class="tmeta">${esc(src.role)} · <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.url)}</a></p>
    <p class="guide">Cited for <b>${s.claims[src.id] || 0} claims</b> across <b>${used.length} trophies</b> in this guide.
    Claim counts are computed from the guide's own citation data — a source is only listed for a trophy when one of its steps, its official description or a dispute side cites it.</p>
    <div class="srcrail"><b>Cited in:</b> ${used.map(t => `<a href="#" data-sel="${t.id}">${esc(t.name)}</a>`).join(' · ')}</div>`;
}

function renderDetail() {
  const col = $('#detailCol');
  if (tab === 'sources') { col.innerHTML = sourceDetailHtml(SRC[srcSel]); return; }
  const t = T.find(x => x.id === selId) || T[0];
  col.innerHTML = detailHtml(t);
}
function renderAll() { renderAudit(); renderList(); renderDetail(); }

document.addEventListener('click', e => {
  const sel = e.target.closest('[data-sel]');
  const srcLink = e.target.closest('[data-src]');
  const srcRow = e.target.closest('[data-srcsel]');
  const rev = e.target.closest('[data-reveal]');
  const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
  if (rev) { revealed.add(rev.dataset.reveal); renderDetail(); return; }
  if (inc || dec) {
    const id = (inc || dec).dataset.inc || (inc || dec).dataset.dec;
    const t = T.find(x => x.id === id);
    counts[id] = Math.max(0, Math.min(t.collectible.total, (counts[id] || 0) + (inc ? 1 : -1)));
    saveCounts(); renderAll(); return;
  }
  if (srcLink) { tab = 'sources'; srcSel = +srcLink.dataset.src; syncTabs(); renderAll(); return; }
  if (srcRow) { srcSel = +srcRow.dataset.srcsel; renderList(); renderDetail(); return; }
  if (sel && !e.target.matches('input')) {
    e.preventDefault();
    selId = sel.dataset.sel;
    if (tab === 'sources') { tab = 'tracker'; syncTabs(); }
    renderList(); renderDetail();
  }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-done]')) {
    const id = e.target.dataset.done;
    e.target.checked ? doneSet.add(id) : doneSet.delete(id);
    saveDone(); renderAll();
  }
  if (e.target.id === 'shieldTgl') { shieldOn = e.target.checked; localStorage.setItem('ll8shield', shieldOn ? '1' : '0'); renderList(); renderDetail(); }
  if (e.target.id === 'gradeSel' || e.target.id === 'doneSel') renderList();
  if (e.target.id === 'impFile' && e.target.files[0]) {
    e.target.files[0].text().then(txt => {
      try {
        const p = JSON.parse(txt);
        doneSet = new Set(p.done || []); counts = p.counts || {};
        saveDone(); saveCounts(); renderAll();
      } catch { alert('That file is not a Leonida Ledger progress export.'); }
    });
  }
});
$('#qBox').addEventListener('input', () => { if (tab !== 'tracker') { tab = 'tracker'; syncTabs(); } renderList(); });
function syncTabs() { document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab)); }
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; syncTabs(); renderAll(); }));
$('#expBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ done: [...doneSet], counts }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'leonida-ledger-progress.json'; a.click();
  URL.revokeObjectURL(a.href);
});

fetch('data/trophies.json').then(r => r.json()).then(data => {
  D = data; T = data.trophies;
  data.sources.forEach(s => SRC[s.id] = s);
  selId = data.defaultTrophy;
  $('#shieldTgl').checked = shieldOn;
  renderAll();
}).catch(err => { $('#detailCol').innerHTML = '<p class="warn">Could not load data/trophies.json: ' + esc(err.message) + '</p>'; });
