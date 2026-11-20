// render-checklist.js — the tracker checklist: one row per trophy with its
// grade, official name and description, kind and stage, counter progress,
// and the badges that matter at a glance (missable, sources differ, hidden).

import { GRADE_LABELS, KIND_LABELS, escapeHtml } from './trophy-data.js';
import { displayDescription, displayName, isMasked } from './filters.js';

function badges(trophy) {
  const out = [];
  if (trophy.missable) out.push('<span class="badge badge-missable">Missable</span>');
  if ((trophy.disputes ?? []).length) {
    out.push(`<span class="badge badge-dispute">Sources differ · ${trophy.disputes.length}</span>`);
  }
  if (trophy.hidden) out.push('<span class="badge badge-hidden">Hidden</span>');
  return out.join(' ');
}

function counterMeta(trophy, progress) {
  if (!trophy.count) return '';
  const value = Math.min(progress.counters[trophy.id] ?? 0, trophy.count);
  const pct = Math.round((value / trophy.count) * 100);
  return `<span class="row-counter"><span class="bar bar-mini"><span style="width:${pct}%"></span></span>${value}/${trophy.count}</span>`;
}

export function renderChecklist(element, trophies, progress, selectedId) {
  if (!trophies.length) {
    element.innerHTML = '<p class="empty-note">No trophies match the current filters.</p>';
    return;
  }
  element.innerHTML = trophies
    .map((trophy) => {
      const earned = progress.earned[trophy.id] === true;
      const masked = isMasked(trophy, progress);
      const classes = ['trophy-row', earned ? 'is-earned' : '', trophy.id === selectedId ? 'is-selected' : '']
        .filter(Boolean)
        .join(' ');
      return `<article class="${classes}" data-trophy-id="${trophy.id}" tabindex="0" role="button" aria-pressed="${trophy.id === selectedId}">
        <label class="row-check" title="Mark earned">
          <input type="checkbox" data-earn="${trophy.id}" ${earned ? 'checked' : ''}>
        </label>
        <span class="grade-dot grade-${trophy.grade}" title="${GRADE_LABELS[trophy.grade]}"></span>
        <div class="row-main">
          <div class="row-name">${escapeHtml(displayName(trophy, progress))} ${badges(trophy)}</div>
          <div class="row-desc">${escapeHtml(displayDescription(trophy, progress))}</div>
          <div class="row-meta"><span>${KIND_LABELS[trophy.kind] ?? trophy.kind}</span><span>Stage ${trophy.stage}</span>${counterMeta(trophy, progress)}</div>
        </div>
        <span class="row-id">#${trophy.id}</span>
      </article>`;
    })
    .join('');
}
