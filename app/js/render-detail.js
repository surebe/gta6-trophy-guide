// render-detail.js — renders the detail pane for the selected trophy: its
// official data, the full original guide with numbered steps, a missable
// warning where one applies, its counter, and its cited sources as links.

import { SOURCE_LINKS, escapeHtml, stageInfo } from './trophy-data.js';
import { cupSvg } from './render-checklist.js';
import { displayDescription, displayName, isMasked } from './filters.js';

function sourceListHtml(trophy) {
  const items = trophy.sources
    .map((name) => {
      const url = SOURCE_LINKS[name];
      if (!url) return `<li>${escapeHtml(name)}</li>`;
      return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a></li>`;
    })
    .join('');
  return `<div class="detail-sources"><h4>Sources for this guide</h4><ul>${items}</ul></div>`;
}

function counterHtml(trophy, progress) {
  if (!trophy.count) return '';
  const value = progress.counters[trophy.id] ?? 0;
  const pct = Math.min(100, Math.round((value / trophy.count) * 100));
  return (
    '<div class="detail-counter">' +
    '<h4>Tracked progress</h4>' +
    '<div class="counter counter-large">' +
    `<button type="button" class="step-btn" data-action="dec" data-id="${trophy.id}" aria-label="Decrease counter">−</button>` +
    `<div class="counter-track"><div class="counter-fill" style="width:${pct}%"></div></div>` +
    `<span class="counter-text">${value} / ${trophy.count}</span>` +
    `<button type="button" class="step-btn" data-action="inc" data-id="${trophy.id}" aria-label="Increase counter">+</button>` +
    '</div></div>'
  );
}

function maskedDetailHtml(trophy, progress) {
  const reason = trophy.hidden
    ? 'This trophy is hidden on PlayStation until it is earned, so its name, description and guide stay covered.'
    : 'Spoiler protection is on, and this story trophy has not been earned yet, so its name, description and guide stay covered.';
  return (
    '<div class="detail-masked">' +
    cupSvg(trophy.grade, 'cup-large cup-dim') +
    `<h2>${escapeHtml(displayName(trophy, progress))}</h2>` +
    `<p class="detail-official">${escapeHtml(displayDescription(trophy, progress))}</p>` +
    `<p class="masked-note">${reason}</p>` +
    '<div class="detail-actions">' +
    `<button type="button" class="btn btn-primary" data-action="toggle" data-id="${trophy.id}">Mark as earned</button>` +
    `<button type="button" class="btn" data-action="unmask" data-id="${trophy.id}">Reveal anyway</button>` +
    '</div>' +
    `<p class="masked-meta">Grade: ${trophy.grade} · Kind: ${trophy.kind} · Roadmap stage ${trophy.stage}</p>` +
    '</div>'
  );
}

export function renderDetail(container, trophy, progress) {
  if (!trophy) {
    container.innerHTML =
      '<div class="detail-empty"><h2>Pick a trophy</h2>' +
      '<p>Select any trophy in the checklist to read its full guide, its steps and its sources.</p></div>';
    return;
  }
  if (isMasked(trophy, progress)) {
    container.innerHTML = maskedDetailHtml(trophy, progress);
    return;
  }
  const earned = Boolean(progress.earned[trophy.id]);
  const stage = stageInfo(trophy.stage);
  const steps = trophy.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('');
  container.innerHTML =
    '<div class="detail-head">' +
    cupSvg(trophy.grade, 'cup-large') +
    '<div>' +
    `<h2>${escapeHtml(trophy.name)}</h2>` +
    `<p class="detail-official">&ldquo;${escapeHtml(trophy.description)}&rdquo;</p>` +
    '</div></div>' +
    '<div class="detail-meta">' +
    `<span class="pill pill-${trophy.grade}">${trophy.grade}</span>` +
    `<span class="tag">${trophy.kind}</span>` +
    (trophy.hidden ? '<span class="badge badge-hidden">Hidden</span>' : '') +
    (trophy.missable ? '<span class="badge badge-missable">Missable</span>' : '') +
    `<span class="tag">Stage ${trophy.stage}${stage ? ` — ${escapeHtml(stage.title)}` : ''}</span>` +
    '</div>' +
    (trophy.missable
      ? '<div class="missable-warning"><strong>Missable — the only one in the game.</strong> ' +
        'The first meditation spot, on the balcony at Jason\u2019s house, is reported to disappear once Chapter 1 ends. ' +
        'Meditate there during Chapter 1; do not leave it for the clean-up.</div>'
      : '') +
    counterHtml(trophy, progress) +
    '<div class="detail-guide"><h3>The guide</h3>' +
    `<p>${escapeHtml(trophy.guide)}</p></div>` +
    `<div class="detail-steps"><h4>Step by step</h4><ol>${steps}</ol></div>` +
    sourceListHtml(trophy) +
    '<div class="detail-actions">' +
    (earned
      ? `<span class="earned-stamp">Earned ${escapeHtml(progress.earned[trophy.id])}</span>` +
        `<button type="button" class="btn" data-action="toggle" data-id="${trophy.id}">Mark as not earned</button>`
      : `<button type="button" class="btn btn-primary" data-action="toggle" data-id="${trophy.id}">Mark as earned</button>`) +
    '</div>';
}
