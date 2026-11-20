// render-stats.js — two bands computed live from the dataset and the saved
// progress: the audit bar under the header (what this guide can prove about
// its own data) and the statistics strip (how the player's run is going).

import { GRADE_LABELS, GRADE_POINTS } from './trophy-data.js';

export function renderAuditBar(element, audit) {
  const split = `${audit.gradeSplit.platinum} Platinum · ${audit.gradeSplit.gold} Gold · ${audit.gradeSplit.silver} Silver · ${audit.gradeSplit.bronze} Bronze`;
  const items = [
    ['Official list', `${audit.withName}/${audit.total} names · ${audit.withDescription}/${audit.total} descriptions · ${audit.withGrade}/${audit.total} grades`],
    ['Split', split],
    ['Hidden', `${audit.hidden}`],
    ['Guide steps', `${audit.steps}`],
    ['Steps cited', `${audit.citedSteps}/${audit.steps}`],
    ['Guides citing a source', `${audit.guidesWithSource}/${audit.total}`],
    ['Claims with 2+ sources', `${audit.doubleCitedSteps}`],
    ['Disputes shown both ways', `${audit.disputes}`],
    ['Sources read', audit.readDate],
  ];
  element.innerHTML =
    `<span class="audit-title">Audit</span>` +
    items.map(([label, value]) => `<span class="audit-item"><em>${label}</em> ${value}</span>`).join('<span class="audit-sep">|</span>');
}

export function computeStats(trophies, progress) {
  const earned = trophies.filter((trophy) => progress.earned[trophy.id] === true);
  const pointsEarned = earned.reduce((sum, trophy) => sum + GRADE_POINTS[trophy.grade], 0);
  const pointsTotal = trophies.reduce((sum, trophy) => sum + GRADE_POINTS[trophy.grade], 0);
  const byGrade = {};
  for (const grade of Object.keys(GRADE_POINTS)) {
    byGrade[grade] = {
      earned: trophies.filter((t) => t.grade === grade && progress.earned[t.id] === true).length,
      total: trophies.filter((t) => t.grade === grade).length,
    };
  }
  const counted = trophies.filter((trophy) => trophy.count);
  const counterDone = counted.reduce((sum, trophy) => sum + Math.min(progress.counters[trophy.id] ?? 0, trophy.count), 0);
  const counterTotal = counted.reduce((sum, trophy) => sum + trophy.count, 0);
  return {
    earnedCount: earned.length,
    total: trophies.length,
    pointsEarned,
    pointsTotal,
    byGrade,
    counterDone,
    counterTotal,
    percent: trophies.length ? Math.round((earned.length / trophies.length) * 100) : 0,
  };
}

export function renderStats(element, stats) {
  const gradeCells = Object.keys(GRADE_POINTS)
    .map((grade) => {
      const cell = stats.byGrade[grade];
      const pct = cell.total ? Math.round((cell.earned / cell.total) * 100) : 0;
      return `<div class="stat-grade">
        <span class="grade-dot grade-${grade}"></span><span class="stat-grade-label">${GRADE_LABELS[grade]}</span> <strong>${cell.earned}/${cell.total}</strong>
        <span class="bar bar-grade"><span style="width:${pct}%"></span></span>
      </div>`;
    })
    .join('');
  element.innerHTML = `
    <div class="stat-main">
      <div class="stat-big">${stats.percent}%</div>
      <div class="stat-main-text">
        <strong>${stats.earnedCount} of ${stats.total} trophies earned</strong>
        <span>${stats.pointsEarned} of ${stats.pointsTotal} trophy points · counters ${stats.counterDone}/${stats.counterTotal}</span>
      </div>
    </div>
    <div class="stat-grades">${gradeCells}</div>`;
}

export function renderHeaderStats(element, stats) {
  element.textContent = `${stats.earnedCount}/${stats.total} earned · ${stats.pointsEarned} pts · ${stats.percent}%`;
}
