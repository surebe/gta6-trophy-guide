// render-roadmap.js — renders the seven-stage roadmap to the Platinum:
// stage order, the official-description reasoning behind each stage, the
// trophies that sit in it, per-stage progress, and the missable warning in
// stage 1 where it belongs.

import { ROADMAP_STAGES, escapeHtml, trophiesInStage } from './trophy-data.js';
import { displayName } from './filters.js';

function stageSectionHtml(stageEntry, trophies, progress) {
  const inStage = trophiesInStage(trophies, stageEntry.stage);
  const earnedCount = inStage.filter((trophy) => progress.earned[trophy.id]).length;
  const pct = inStage.length ? Math.round((earnedCount / inStage.length) * 100) : 0;
  const chips = inStage
    .map((trophy) => {
      const earned = Boolean(progress.earned[trophy.id]);
      return (
        `<button type="button" class="chip${earned ? ' is-earned' : ''}" data-action="select" data-goto="list" data-id="${trophy.id}">` +
        `<span class="chip-dot grade-text-${trophy.grade}">●</span>${escapeHtml(displayName(trophy, progress))}` +
        (earned ? ' ✓' : '') +
        (trophy.missable ? ' <span class="badge badge-missable">Missable</span>' : '') +
        '</button>'
      );
    })
    .join('');
  const warning =
    stageEntry.stage === 1
      ? '<div class="missable-warning"><strong>Missable warning:</strong> Positive Mental Attitude starts here. ' +
        'Meditate on the balcony at Jason\u2019s house during Chapter 1 — the spot is reported to vanish when the chapter ends. ' +
        'It is the only missable trophy in the game; everything else can be cleaned up in free roam after the story.</div>'
      : '';
  return (
    `<section class="roadmap-stage${earnedCount === inStage.length ? ' is-complete' : ''}">` +
    '<header class="roadmap-stage-head">' +
    `<span class="stage-number">${stageEntry.stage}</span>` +
    `<h3>${escapeHtml(stageEntry.title)}</h3>` +
    `<span class="stage-progress">${earnedCount} / ${inStage.length}</span>` +
    '</header>' +
    `<div class="counter-track stage-track"><div class="counter-fill" style="width:${pct}%"></div></div>` +
    `<p class="stage-blurb">${escapeHtml(stageEntry.blurb)}</p>` +
    warning +
    `<div class="chip-row">${chips}</div>` +
    '</section>'
  );
}

export function renderRoadmap(container, trophies, progress) {
  const sections = ROADMAP_STAGES.map((stageEntry) => stageSectionHtml(stageEntry, trophies, progress)).join('');
  container.innerHTML =
    '<div class="roadmap-intro"><h2>Roadmap to the Platinum</h2>' +
    '<p>Seven stages, in the order the official trophy descriptions suggest: story first with the one missable kept safe, ' +
    'then the character strands, the counted grinds, the crime and secret trophies, and the 100% completion Gold last. ' +
    'One playthrough is enough, free roam continues after the story, and guides put the full list at roughly 200 hours.</p></div>' +
    sections +
    '<p class="roadmap-note">Cleanup rule of thumb: if a trophy is not a story trophy and not Positive Mental Attitude, ' +
    'it can still be earned after the credits. Never use cheats on a trophy run — they disable trophies and saving.</p>';
}
