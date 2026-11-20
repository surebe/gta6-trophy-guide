// filters.js — search, filter and sort state for the tracker, kept pure so
// the checklist rendering stays a thin shell over it.

import { GRADE_ORDER } from './trophy-data.js';

export const KIND_FILTERS = [
  { key: 'all', label: 'All kinds' },
  { key: 'story', label: 'Story' },
  { key: 'activities', label: 'Activities' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'completion', label: 'Completion' },
];

export const GRADE_FILTERS = [
  { key: 'all', label: 'All grades' },
  { key: 'platinum', label: 'Platinum' },
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
  { key: 'bronze', label: 'Bronze' },
];

export function createDefaultFilters() {
  return { query: '', kind: 'all', grade: 'all', status: 'all', disputedOnly: false, sort: 'list' };
}

function matchesQuery(trophy, query) {
  if (!query) return true;
  const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function applyFilters(trophies, filters, progress) {
  const filtered = trophies.filter((trophy) => {
    if (!matchesQuery(trophy, filters.query)) return false;
    if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.disputedOnly && !(trophy.disputes ?? []).length) return false;
    const earned = progress.earned[trophy.id] === true;
    if (filters.status === 'earned' && !earned) return false;
    if (filters.status === 'unearned' && earned) return false;
    return true;
  });
  const byId = (a, b) => a.id - b.id;
  switch (filters.sort) {
    case 'grade':
      return filtered.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || byId(a, b));
    case 'name':
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    case 'stage':
      return filtered.sort((a, b) => a.stage - b.stage || byId(a, b));
    default:
      return filtered.sort(byId);
  }
}

// A trophy's identity is masked while the spoiler shield is on, the trophy
// is hidden, and the player has not earned it yet.
export function isMasked(trophy, progress) {
  return progress.spoilerShield && trophy.hidden && progress.earned[trophy.id] !== true;
}

export function displayName(trophy, progress) {
  return isMasked(trophy, progress) ? 'Hidden trophy' : trophy.name;
}

export function displayDescription(trophy, progress) {
  return isMasked(trophy, progress)
    ? 'Withheld by the spoiler shield — earn it, or lower the shield to peek.'
    : trophy.description;
}
