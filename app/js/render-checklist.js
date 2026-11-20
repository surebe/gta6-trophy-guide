// render-checklist.js — renders the trophy checklist column: one card per
// trophy with its grade cup, official name and description, kind and stage
// tags, HIDDEN and MISSABLE badges, an earned toggle and, for counted
// trophies, a progress stepper with a bar.

import { escapeHtml } from './trophy-data.js';
import { displayDescription, displayName, isMasked } from './filters.js';

// An original trophy-cup glyph drawn for this app; its fill follows the
// trophy's grade through CSS.
export function cupSvg(grade, extraClass = '') {
  return (
    `<svg class="cup cup-${grade} ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` +
    '<path d="M6 2h12v3h4v2.5A4.5 4.5 0 0 1 17.5 12h-.79A6 6 0 0 1 13.5 15.4V18h3.5v3H7v-3h3.5v-2.6A6 6 0 0 1 7.29 12H6.5A4.5 4.5 0 0 1 2 7.5V5h4V2zm0 5.17A3.5 3.5 0 0 1 4 5H4v2.5c0 1.2.86 2.2 2 2.44V7.17zM20 5h-2v4.94c1.14-.25 2-1.24 2-2.44V5z"/>' +
    '</svg>'
  );
}

function checkSvg() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 16.6 4.8 12.2l-1.7 1.7 6.1 6.1L21 8.2l-1.7-1.7z"/></svg>';
}

function badgesFor(trophy) {
  let html = '';
  if (trophy.hidden) html += '<span class="badge badge-hidden">Hidden</span>';
  if (trophy.missable) html += '<span class="badge badge-missable">Missable</span>';
  return html;
}

function counterHtml(trophy, progress) {
  if (!trophy.count) return '';
  const value = progress.counters[trophy.id] ?? 0;
  const pct = Math.min(100, Math.round((value / trophy.count) * 100));
  const ready = value >= trophy.count && !progress.earned[trophy.id];
  return (
    `<div class="counter" data-counter="${trophy.id}">` +
    `<button type="button" class="step-btn" data-action="dec" data-id="${trophy.id}" aria-label="Decrease counter">−</button>` +
    `<div class="counter-track"><div class="counter-fill" style="width:${pct}%"></div></div>` +
    `<span class="counter-text">${value} / ${trophy.count}</span>` +
    `<button type="button" class="step-btn" data-action="inc" data-id="${trophy.id}" aria-label="Increase counter">+</button>` +
    (ready ? '<span class="counter-ready">Complete — marked earned</span>' : '') +
    '</div>'
  );
}

export function trophyCardHtml(trophy, progress, selectedId) {
  const earned = Boolean(progress.earned[trophy.id]);
  const masked = isMasked(trophy, progress);
  const selected = trophy.id === selectedId;
  return (
    `<article class="card grade-edge-${trophy.grade}${earned ? ' is-earned' : ''}${selected ? ' is-selected' : ''}${masked ? ' is-masked' : ''}" ` +
    `data-action="select" data-id="${trophy.id}" tabindex="0" role="button" aria-pressed="${selected}">` +
    `<button type="button" class="earn-toggle" data-action="toggle" data-id="${trophy.id}" ` +
    `aria-label="${earned ? 'Mark as not earned' : 'Mark as earned'}" aria-pressed="${earned}">${earned ? checkSvg() : ''}</button>` +
    cupSvg(trophy.grade) +
    '<div class="card-body">' +
    `<h3 class="card-name">${escapeHtml(displayName(trophy, progress))}</h3>` +
    `<p class="card-desc">${escapeHtml(displayDescription(trophy, progress))}</p>` +
    '<div class="card-meta">' +
    `<span class="pill pill-${trophy.grade}">${trophy.grade}</span>` +
    `<span class="tag">${trophy.kind}</span>` +
    `<span class="tag">Stage ${trophy.stage}</span>` +
    badgesFor(trophy) +
    (earned ? `<span class="earned-date">Earned ${escapeHtml(progress.earned[trophy.id])}</span>` : '') +
    '</div>' +
    counterHtml(trophy, progress) +
    '</div>' +
    '</article>'
  );
}

export function renderChecklist(container, trophies, progress, selectedId) {
  if (trophies.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><h3>No trophies match</h3>' +
      '<p>Try a different search or filter. GTA VI has no online trophies, so the Online filter is empty by design.</p></div>';
    return;
  }
  container.innerHTML = trophies.map((trophy) => trophyCardHtml(trophy, progress, selectedId)).join('');
}
