// filters.js — pure search, filter and sort logic for the checklist, plus
// the spoiler rules that decide when a trophy's identity stays covered.

import { GRADE_ORDER } from './trophy-data.js';

export const KIND_FILTERS = [
  { key: 'all', label: 'All kinds' },
  { key: 'story', label: 'Story' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'activities', label: 'Activities' },
  { key: 'completion', label: 'Completion' },
  { key: 'missable', label: 'Missable' },
  { key: 'online', label: 'Online (0)' },
];

export const GRADE_FILTERS = [
  { key: 'all', label: 'All grades' },
  { key: 'platinum', label: 'Platinum' },
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'bronze', label: 'Bronze' },
];

export function createDefaultFilters() {
  return { query: '', kind: 'all', grade: 'all', status: 'all', sort: 'list' };
}

// A trophy stays covered when it is a hidden trophy the player has not
// revealed, or — while spoiler protection is on — a story trophy the
// player has not earned yet. Earned trophies are always shown in full.
export function isMasked(trophy, progress) {
  if (progress.earned[trophy.id]) return false;
  if (trophy.hidden && !progress.settings.revealHidden) return true;
  if (trophy.kind === 'story' && progress.settings.spoiler) return true;
  return false;
}

export function displayName(trophy, progress) {
  if (!isMasked(trophy, progress)) return trophy.name;
  return trophy.hidden ? 'Hidden Trophy' : 'Story Trophy';
}

export function displayDescription(trophy, progress) {
  if (!isMasked(trophy, progress)) return trophy.description;
  return trophy.hidden
    ? 'This trophy is hidden on PlayStation until it is earned.'
    : 'Spoiler protection is on: earn this story trophy to reveal it.';
}

function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable;
  if (kind === 'online') return trophy.kind === 'online';
  return trophy.kind === kind;
}

function matchesQuery(trophy, query) {
  if (!query) return true;
  const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function matchesStatus(trophy, status, progress) {
  if (status === 'all') return true;
  const earned = Boolean(progress.earned[trophy.id]);
  return status === 'earned' ? earned : !earned;
}

export function applyFilters(trophies, filters, progress) {
  const filtered = trophies.filter(
    (trophy) =>
      matchesKind(trophy, filters.kind) &&
      (filters.grade === 'all' || trophy.grade === filters.grade) &&
      matchesStatus(trophy, filters.status, progress) &&
      matchesQuery(trophy, filters.query),
  );
  return sortTrophies(filtered, filters.sort, progress);
}

export function sortTrophies(trophies, sort, progress) {
  const sorted = [...trophies];
  if (sort === 'grade') {
    sorted.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  } else if (sort === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'progress') {
    const ratio = (trophy) =>
      trophy.count ? (progress.counters[trophy.id] ?? 0) / trophy.count : -1;
    sorted.sort((a, b) => ratio(b) - ratio(a) || a.id - b.id);
  } else {
    sorted.sort((a, b) => a.id - b.id);
  }
  return sorted;
}
