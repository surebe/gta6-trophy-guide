// render-roadmap.js — the seven-stage roadmap to the Platinum, with the
// "Next up" rail (roadmap order, earned work skipped) at the top and one
// section per stage. Shared by the Roadmap tab; the tracker reuses the
// Next up rail on its own.

import { GRADE_LABELS, escapeHtml, nextUp, refChips, stageInfo, trophiesInStage } from './trophy-data.js';
import { displayName } from './filters.js';

export function nextUpCards(trophies, progress) {
  const upcoming = nextUp(trophies, (id) => progress.earned[id] === true, 4);
  if (!upcoming.length) return '<p class="empty-note">Everything is earned. Platinum run complete.</p>';
  return upcoming
    .map(
      (trophy, index) => `<button type="button" class="nextup-card" data-open-trophy="${trophy.id}">
        <span class="nextup-rank">${index + 1}</span>
        <span class="nextup-body">
          <strong>${escapeHtml(displayName(trophy, progress))}</strong>
          <span>${GRADE_LABELS[trophy.grade]} · Stage ${trophy.stage}${trophy.missable ? ' · <em class="nextup-warn">possibly missable — do it in Chapter 1</em>' : ''}${trophy.count ? ` · counter ${Math.min(progress.counters[trophy.id] ?? 0, trophy.count)}/${trophy.count}` : ''}</span>
        </span>
      </button>`,
    )
    .join('');
}

export function renderRoadmap(element, trophies, progress) {
  const sections = trophies.length
    ? [1, 2, 3, 4, 5, 6, 7]
        .map((stage) => {
          const info = stageInfo(stage);
          const members = trophiesInStage(trophies, stage);
          const done = members.filter((trophy) => progress.earned[trophy.id] === true).length;
          const rows = members
            .map((trophy) => {
              const earned = progress.earned[trophy.id] === true;
              return `<button type="button" class="road-row ${earned ? 'is-earned' : ''}" data-open-trophy="${trophy.id}">
                <span class="grade-dot grade-${trophy.grade}"></span>
                <span class="road-name">${escapeHtml(displayName(trophy, progress))}</span>
                ${trophy.missable ? '<span class="badge badge-missable">Missable</span>' : ''}
                ${(trophy.disputes ?? []).length ? '<span class="badge badge-dispute">Sources differ</span>' : ''}
                <span class="road-state">${earned ? '✓ earned' : trophy.count ? `${Math.min(progress.counters[trophy.id] ?? 0, trophy.count)}/${trophy.count}` : 'to do'}</span>
              </button>`;
            })
            .join('');
          return `<section class="stage-block">
            <header class="stage-head">
              <span class="stage-num">${stage}</span>
              <div>
                <h3>${escapeHtml(info.title)}</h3>
                <p>${escapeHtml(info.blurb)} ${refChips(info.refs)}</p>
              </div>
              <span class="stage-progress">${done}/${members.length}</span>
            </header>
            <div class="road-rows">${rows}</div>
          </section>`;
        })
        .join('')
    : '';
  element.innerHTML = `
    <section class="nextup-panel">
      <h2>Next up <span>in roadmap order</span></h2>
      <div class="nextup-grid">${nextUpCards(trophies, progress)}</div>
    </section>
    ${sections}`;
}
