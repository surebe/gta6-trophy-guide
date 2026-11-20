// render-detail.js — the detail pane for the selected trophy: official data,
// the earned toggle, the collectible counter, our guide with per-step
// numbered citations, any SOURCES DIFFER dispute boxes, and the rail that
// lists exactly which sources this guide rests on.

import { GRADE_LABELS, KIND_LABELS, escapeHtml, refChips, refsForTrophy, sourceByNumber } from './trophy-data.js';
import { displayDescription, displayName } from './filters.js';

// One dispute, shown both ways: side A, side B, and the call this guide
// makes. Shared with the Missables tab.
export function renderDispute(dispute) {
  return `<section class="dispute-box">
    <h4><span class="dispute-tag">Sources differ</span> ${escapeHtml(dispute.topic)}</h4>
    <div class="dispute-sides">
      <div class="dispute-side">
        <span class="dispute-side-label">One side</span>
        <p>${escapeHtml(dispute.a.claim)}</p>
        <div class="dispute-refs">${refChips(dispute.a.refs)}</div>
      </div>
      <div class="dispute-side">
        <span class="dispute-side-label">The other side</span>
        <p>${escapeHtml(dispute.b.claim)}</p>
        <div class="dispute-refs">${refChips(dispute.b.refs)}</div>
      </div>
    </div>
    <p class="dispute-call"><strong>Our call:</strong> ${escapeHtml(dispute.call.replace(/^Our call:\s*/i, ''))}</p>
  </section>`;
}

function counterBlock(trophy, progress) {
  if (!trophy.count) return '';
  const value = Math.min(progress.counters[trophy.id] ?? 0, trophy.count);
  const pct = Math.round((value / trophy.count) * 100);
  return `<section class="counter-box" aria-label="Collectible counter">
    <button type="button" class="counter-btn" data-counter="-1" aria-label="One less">−</button>
    <div class="counter-readout">
      <div class="counter-line"><strong>${value} of ${trophy.count}</strong> <span>collected · reaching ${trophy.count} marks it earned</span></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
    </div>
    <button type="button" class="counter-btn" data-counter="1" aria-label="One more">+</button>
  </section>`;
}

function sourcesRail(dataset, trophy) {
  const refs = refsForTrophy(trophy);
  const rows = refs
    .map((n) => {
      const source = sourceByNumber(dataset, n);
      if (!source) return '';
      return `<li class="rail-source">
        <span class="rail-ref">[${source.n}]</span>
        <div>
          <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name)}</a>
          <span class="rail-title">${escapeHtml(source.title)}</span>
          <span class="rail-read">read ${escapeHtml(source.read)}</span>
        </div>
      </li>`;
    })
    .join('');
  return `<aside class="detail-rail">
    <h3>Sources for this guide</h3>
    <ul class="rail-list">${rows}</ul>
    <p class="rail-note">Steps cite these by number, like [${refs[0] ?? 1}]. The full list, with how many guides cite each source, is on the Sources tab.</p>
  </aside>`;
}

export function renderDetail(element, dataset, trophy, progress) {
  if (!trophy) {
    element.innerHTML = '<p class="empty-note">Select a trophy to read its guide.</p>';
    return;
  }
  const earned = progress.earned[trophy.id] === true;
  const steps = (trophy.steps ?? [])
    .map((step) => `<li><span class="step-text">${escapeHtml(step.text)}</span> ${refChips(step.refs)}</li>`)
    .join('');
  const disputes = (trophy.disputes ?? []).map(renderDispute).join('');
  const flags = [
    trophy.missable ? '<span class="badge badge-missable">Possibly missable</span>' : '',
    trophy.hidden ? '<span class="badge badge-hidden">Hidden trophy</span>' : '',
    (trophy.disputes ?? []).length ? `<span class="badge badge-dispute">Sources differ · ${trophy.disputes.length}</span>` : '',
  ].join(' ');
  element.innerHTML = `
  <div class="detail-main">
    <div class="detail-head">
      <span class="grade-chip grade-${trophy.grade}">${GRADE_LABELS[trophy.grade]}</span>
      <span class="detail-kind">${KIND_LABELS[trophy.kind] ?? trophy.kind} · Stage ${trophy.stage} · #${trophy.id}</span>
      <span class="detail-flags">${flags}</span>
    </div>
    <h2>${escapeHtml(displayName(trophy, progress))}</h2>
    <blockquote class="official-desc">“${escapeHtml(displayDescription(trophy, progress))}” <span>— official description</span></blockquote>
    <div class="detail-actions">
      <button type="button" class="earn-btn ${earned ? 'is-earned' : ''}" data-toggle-earn="${trophy.id}">${earned ? '✓ Earned — tap to undo' : 'Mark as earned'}</button>
    </div>
    ${counterBlock(trophy, progress)}
    <p class="guide-text">${escapeHtml(trophy.guide)}</p>
    <h3 class="detail-subhead">How to earn it</h3>
    <ol class="step-list">${steps}</ol>
    ${disputes}
  </div>
  ${sourcesRail(dataset, trophy)}`;
}
