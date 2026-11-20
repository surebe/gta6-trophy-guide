// progress-store.js — owns the player's saved progress for the tracker.
// Persists earned trophies, per-trophy counters and display settings to
// localStorage, and provides export, import, reset and sample-progress
// helpers. Every mutation saves immediately and notifies subscribers.

const STORAGE_KEY = 'leonida-ledger-progress-v1';

let state = createEmptyProgress();
const listeners = new Set();

export function createEmptyProgress() {
  return {
    earned: {},
    counters: {},
    settings: { spoiler: false, revealHidden: false },
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state = createEmptyProgress();
      return state;
    }
    state = sanitizeProgress(JSON.parse(raw));
  } catch {
    state = createEmptyProgress();
  }
  return state;
}

export function sanitizeProgress(data) {
  const clean = createEmptyProgress();
  if (data && typeof data === 'object') {
    if (data.earned && typeof data.earned === 'object') {
      for (const [id, date] of Object.entries(data.earned)) {
        if (/^\d+$/.test(id)) clean.earned[id] = String(date).slice(0, 10);
      }
    }
    if (data.counters && typeof data.counters === 'object') {
      for (const [id, n] of Object.entries(data.counters)) {
        const value = Math.max(0, Math.floor(Number(n) || 0));
        if (/^\d+$/.test(id) && value > 0) clean.counters[id] = value;
      }
    }
    if (data.settings && typeof data.settings === 'object') {
      clean.settings.spoiler = Boolean(data.settings.spoiler);
      clean.settings.revealHidden = Boolean(data.settings.revealHidden);
    }
  }
  return clean;
}

export function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode); the tracker still works in memory.
  }
}

export function getProgress() {
  return state;
}

export function onProgressChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  saveProgress();
  for (const listener of listeners) listener(state);
}

export function isEarned(id) {
  return Boolean(state.earned[id]);
}

export function earnedDate(id) {
  return state.earned[id] ?? null;
}

export function setEarned(id, earned) {
  if (earned) {
    state.earned[id] = new Date().toISOString().slice(0, 10);
  } else {
    delete state.earned[id];
  }
  emitChange();
}

export function toggleEarned(id) {
  setEarned(id, !isEarned(id));
}

export function getCounter(id) {
  return state.counters[id] ?? 0;
}

export function setCounter(id, value, total) {
  const clamped = Math.max(0, Math.min(total, Math.floor(value)));
  if (clamped > 0) {
    state.counters[id] = clamped;
  } else {
    delete state.counters[id];
  }
  // Reaching the tracked total completes the trophy's requirement.
  if (clamped >= total && !state.earned[id]) {
    state.earned[id] = new Date().toISOString().slice(0, 10);
  }
  emitChange();
}

export function getSetting(key) {
  return state.settings[key];
}

export function setSetting(key, value) {
  state.settings[key] = Boolean(value);
  emitChange();
}

export function resetProgress() {
  state = createEmptyProgress();
  emitChange();
}

export function exportProgress() {
  const payload = JSON.stringify(
    { app: 'leonida-ledger', version: 1, exportedAt: new Date().toISOString(), progress: state },
    null,
    2,
  );
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function importProgress(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const incoming = parsed && parsed.progress ? parsed.progress : parsed;
  state = sanitizeProgress(incoming);
  emitChange();
  return state;
}

// A believable mid-game state for trying the tracker (and for presentation):
// the story is done through Chapter 3, the missable meditation is under way,
// and the long counters are part-filled.
export function applySampleProgress() {
  const today = new Date().toISOString().slice(0, 10);
  state = createEmptyProgress();
  for (const id of [2, 3, 4, 5, 8, 16, 20, 21, 44]) {
    state.earned[id] = today;
  }
  state.counters = {
    15: 86,
    17: 19,
    18: 5,
    19: 7,
    25: 3,
    30: 1,
    31: 37,
    32: 18,
    35: 42,
    55: 4,
  };
  emitChange();
}
