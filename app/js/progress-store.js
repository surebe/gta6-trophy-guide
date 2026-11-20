// progress-store.js — the player's saved progress for the Leonida Ledger.
//
// Persists three things to localStorage: which trophies are earned, the
// per-trophy collectible counters, and whether the spoiler shield is on.
// Earned state and counters are kept consistent with each other: filling a
// counter to its target earns the trophy, and ticking a counted trophy off
// fills its counter. Everything is exportable to (and importable from) a
// small JSON file so a run can move between browsers.

const STORAGE_KEY = 'leonida-ledger-v2-progress';

let state = { earned: {}, counters: {}, spoilerShield: true };
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, file quirks); the tracker
    // keeps working in memory for the session.
  }
}

function emit() {
  persist();
  for (const listener of listeners) listener(state);
}

export function onProgressChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        state = {
          earned: parsed.earned ?? {},
          counters: parsed.counters ?? {},
          spoilerShield: parsed.spoilerShield !== false,
        };
      }
    }
  } catch {
    // Corrupt storage falls back to a clean slate.
  }
  return state;
}

export function getProgress() {
  return state;
}

export function isEarned(id) {
  return state.earned[id] === true;
}

export function getCounter(id) {
  return state.counters[id] ?? 0;
}

export function setCounter(trophy, value) {
  const target = trophy.count ?? 0;
  const clamped = Math.max(0, Math.min(target, Math.floor(Number(value) || 0)));
  state.counters[trophy.id] = clamped;
  if (target > 0) state.earned[trophy.id] = clamped >= target;
  emit();
}

export function stepCounter(trophy, delta) {
  setCounter(trophy, getCounter(trophy.id) + delta);
}

export function toggleEarned(trophy) {
  const next = !isEarned(trophy.id);
  state.earned[trophy.id] = next;
  if (trophy.count) state.counters[trophy.id] = next ? trophy.count : 0;
  emit();
}

export function setSpoilerShield(on) {
  state.spoilerShield = on === true;
  emit();
}

export function resetProgress() {
  state = { earned: {}, counters: {}, spoilerShield: state.spoilerShield };
  emit();
}

// A believable mid-run save used for demos and screenshots: Chapter 1 done,
// the balcony meditation banked but the set unfinished, counters under way.
export function applySampleProgress() {
  state = {
    earned: { 2: true, 3: true, 20: true, 21: true },
    counters: { 15: 86, 17: 19, 18: 6, 19: 8, 25: 3, 28: 7, 30: 1, 31: 43, 32: 17, 35: 38, 55: 4 },
    spoilerShield: state.spoilerShield,
  };
  emit();
}

export function exportProgress() {
  const payload = JSON.stringify(
    { app: 'leonida-ledger', version: 2, exportedAt: new Date().toISOString(), earned: state.earned, counters: state.counters },
    null,
    2,
  );
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'leonida-ledger-progress.json';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importProgress(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || typeof parsed.earned !== 'object' || typeof parsed.counters !== 'object') {
    throw new Error('That file does not look like a Leonida Ledger progress export.');
  }
  const earned = {};
  for (const [key, value] of Object.entries(parsed.earned)) if (value === true) earned[key] = true;
  const counters = {};
  for (const [key, value] of Object.entries(parsed.counters)) {
    const n = Math.floor(Number(value));
    if (Number.isFinite(n) && n > 0) counters[key] = n;
  }
  state = { earned, counters, spoilerShield: state.spoilerShield };
  emit();
}
