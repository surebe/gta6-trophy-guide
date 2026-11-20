// render-stats.js — renders the statistics band: overall completion,
// trophy points, per-grade and per-kind progress bars, the missable
// trophy's status, and the nearest unfinished counted trophies as
// "next up" suggestions.

import { GRADE_POINTS, escapeHtml } from './trophy-data.js';
import { displayName } from './filters.js';

function barRow(label, earned, total) {
  const pct = total ? Math.round((earned / total) * 100) : 0;
  return (
    '<div class="stat-row">' +
    `<span class="stat-row-label">${escapeHtml(label)}</span>` +
    `<div class="counter-track"><div class="counter-fill" style="width:${pct}%"></div></div>` +
    `<span class="stat-row-value">${earned} / ${total}</span>` +
    '</div>'
  );
}

function groupCounts(trophies, progress, keyOf) {
  const groups = new Map();
  for (const trophy of trophies) {
    const key = keyOf(trophy);
    if (!groups.has(key)) groups.set(key, { earned: 0, total: 0 });
    const group = groups.get(key);
    group.total += 1;
    if (progress.earned[trophy.id]) group.earned += 1;
  }
  return groups;
}

export function computeStats(trophies, progress) {
  const earnedTrophies = trophies.filter((trophy) => progress.earned[trophy.id]);
  const points = earnedTrophies.reduce((sum, trophy) => sum + (GRADE_POINTS[trophy.grade] ?? 0), 0);
  const totalPoints = trophies.reduce((sum, trophy) => sum + (GRADE_POINTS[trophy.grade] ?? 0), 0);
  return {
    earned: earnedTrophies.length,
    total: trophies.length,
    percent: trophies.length ? Math.round((earnedTrophies.length / trophies.length) * 100) : 0,
    points,
    totalPoints,
  };
}

export function nextUpTrophies(trophies, progress, limit = 4) {
  return trophies
    .filter((trophy) => trophy.count && !progress.earned[trophy.id])
    .map((trophy) => ({
      trophy,
      value: progress.counters[trophy.id] ?? 0,
      ratio: (progress.counters[trophy.id] ?? 0) / trophy.count,
    }))
    .sort((a, b) => b.ratio - a.ratio || a.trophy.id - b.trophy.id)
    .slice(0, limit);
}

export function renderStats(container, trophies, progress) {
  const stats = computeStats(trophies, progress);
  const byGrade = groupCounts(trophies, progress, (trophy) => trophy.grade);
  const byKind = groupCounts(trophies, progress, (trophy) => trophy.kind);
  const missable = trophies.find((trophy) => trophy.missable);
  const nextUp = nextUpTrophies(trophies, progress);

  const gradeRows = ['platinum', 'gold', 'silver', 'bronze']
    .map((grade) => {
      const group = byGrade.get(grade) ?? { earned: 0, total: 0 };
      return barRow(grade, group.earned, group.total);
    })
    .join('');
  const kindRows = ['story', 'collectibles', 'activities', 'completion']
    .map((kind) => {
      const group = byKind.get(kind) ?? { earned: 0, total: 0 };
      return barRow(kind, group.earned, group.total);
    })
    .join('');
  const nextUpHtml = nextUp.length
    ? nextUp
        .map(
          ({ trophy, value }) =>
            `<button type="button" class="next-up-item" data-action="select" data-id="${trophy.id}">` +
            `${escapeHtml(displayName(trophy, progress))} <span>${value} / ${trophy.count}</span></button>`,
        )
        .join('')
    : '<p class="next-up-empty">Every counted trophy is complete. Finish the rest from the roadmap.</p>';

  container.innerHTML =
    '<div class="stat-block stat-overall">' +
    `<div class="stat-big">${stats.percent}%</div>` +
    `<div class="stat-caption">${stats.earned} of ${stats.total} trophies earned</div>` +
    `<div class="counter-track"><div class="counter-fill" style="width:${stats.percent}%"></div></div>` +
    `<div class="stat-caption">${stats.points} / ${stats.totalPoints} trophy points</div>` +
    '</div>' +
    `<div class="stat-block"><h3>By grade</h3>${gradeRows}</div>` +
    `<div class="stat-block"><h3>By kind</h3>${kindRows}</div>` +
    '<div class="stat-block"><h3>Next up</h3>' +
    (missable
      ? `<p class="missable-status">Missable: ${escapeHtml(missable.name)} — ` +
        (progress.earned[missable.id] ? 'earned, safe.' : 'not earned yet. Meditate at Jason\u2019s house in Chapter 1.') +
        '</p>'
      : '') +
    `<div class="next-up-list">${nextUpHtml}</div>` +
    '</div>';
}
