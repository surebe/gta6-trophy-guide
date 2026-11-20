// main.js — boots the Leonida Ledger: loads the trophy data, restores the
// saved progress, wires the toolbar and the three views (checklist, detail
// pane, roadmap), and applies the URL parameters used to stage views
// (?view=roadmap, ?trophy=<id>, ?filter=<kind|grade>, ?spoiler=1,
// ?sample=1).

import { loadTrophies, trophyById } from './trophy-data.js';
import {
  applySampleProgress,
  exportProgress,
  getCounter,
  getProgress,
  importProgress,
  loadProgress,
  onProgressChange,
  resetProgress,
  setCounter,
  setSetting,
  toggleEarned,
} from './progress-store.js';
import { KIND_FILTERS, GRADE_FILTERS, applyFilters, createDefaultFilters } from './filters.js';
import { renderChecklist } from './render-checklist.js';
import { renderDetail } from './render-detail.js';
import { renderRoadmap } from './render-roadmap.js';
import { computeStats, renderStats } from './render-stats.js';

const elements = {};
let trophies = [];
let filters = createDefaultFilters();
let selectedId = null;
let view = 'list';

function cacheElements() {
  for (const id of [
    'searchInput', 'kindChips', 'gradeChips', 'statusSelect', 'sortSelect',
    'spoilerToggle', 'revealToggle', 'viewListBtn', 'viewRoadmapBtn',
    'sampleBtn', 'exportBtn', 'importBtn', 'importFile', 'resetBtn',
    'statsPanel', 'checklist', 'detail', 'roadmap', 'listLayout', 'resultCount', 'headerStats',
  ]) {
    elements[id] = document.getElementById(id);
  }
}

function buildChips() {
  elements.kindChips.innerHTML = KIND_FILTERS.map(
    (entry) =>
      `<button type="button" class="chip-btn" data-kind="${entry.key}">${entry.label}</button>`,
  ).join('');
  elements.gradeChips.innerHTML = GRADE_FILTERS.map(
    (entry) =>
      `<button type="button" class="chip-btn" data-grade="${entry.key}">${entry.label}</button>`,
  ).join('');
}

function syncToolbar() {
  for (const btn of elements.kindChips.querySelectorAll('[data-kind]')) {
    btn.classList.toggle('is-active', btn.dataset.kind === filters.kind);
  }
  for (const btn of elements.gradeChips.querySelectorAll('[data-grade]')) {
    btn.classList.toggle('is-active', btn.dataset.grade === filters.grade);
  }
  elements.statusSelect.value = filters.status;
  elements.sortSelect.value = filters.sort;
  const progress = getProgress();
  elements.spoilerToggle.checked = Boolean(progress.settings.spoiler);
  elements.revealToggle.checked = Boolean(progress.settings.revealHidden);
  elements.viewListBtn.classList.toggle('is-active', view === 'list');
  elements.viewRoadmapBtn.classList.toggle('is-active', view === 'roadmap');
}

function render() {
  const progress = getProgress();
  syncToolbar();
  const stats = computeStats(trophies, progress);
  elements.headerStats.textContent =
    `${stats.earned} / ${stats.total} earned · ${stats.percent}% · ${stats.points} pts`;
  renderStats(elements.statsPanel, trophies, progress);

  const visible = applyFilters(trophies, filters, progress);
  elements.resultCount.textContent =
    view === 'list' ? `Showing ${visible.length} of ${trophies.length} trophies` : 'Roadmap — 7 stages';
  elements.listLayout.hidden = view !== 'list';
  elements.roadmap.hidden = view !== 'roadmap';
  if (view === 'list') {
    renderChecklist(elements.checklist, visible, progress, selectedId);
  } else {
    renderRoadmap(elements.roadmap, trophies, progress);
  }
  renderDetail(elements.detail, trophyById(trophies, selectedId), progress);
}

function selectTrophy(id, { gotoList = false } = {}) {
  selectedId = Number(id);
  if (gotoList) view = 'list';
  render();
  if (view === 'list') {
    elements.detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function handleAction(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { action, id } = target.dataset;
  const trophy = trophyById(trophies, id);
  if (action === 'toggle') {
    event.stopPropagation();
    if (trophy) {
      toggleEarned(trophy.id);
      selectedId = trophy.id;
    }
  } else if (action === 'inc' || action === 'dec') {
    event.stopPropagation();
    if (trophy && trophy.count) {
      const delta = action === 'inc' ? 1 : -1;
      setCounter(trophy.id, getCounter(trophy.id) + delta, trophy.count);
      selectedId = trophy.id;
    }
  } else if (action === 'select') {
    selectTrophy(id, { gotoList: target.dataset.goto === 'list' });
  } else if (action === 'unmask') {
    if (trophy) {
      if (trophy.hidden) setSetting('revealHidden', true);
      if (trophy.kind === 'story') setSetting('spoiler', false);
    }
  }
}

function wireEvents() {
  document.body.addEventListener('click', handleAction);
  elements.searchInput.addEventListener('input', () => {
    filters.query = elements.searchInput.value.trim();
    render();
  });
  elements.kindChips.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-kind]');
    if (!btn) return;
    filters.kind = btn.dataset.kind;
    view = 'list';
    render();
  });
  elements.gradeChips.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-grade]');
    if (!btn) return;
    filters.grade = btn.dataset.grade;
    view = 'list';
    render();
  });
  elements.statusSelect.addEventListener('change', () => {
    filters.status = elements.statusSelect.value;
    render();
  });
  elements.sortSelect.addEventListener('change', () => {
    filters.sort = elements.sortSelect.value;
    render();
  });
  elements.spoilerToggle.addEventListener('change', () => {
    setSetting('spoiler', elements.spoilerToggle.checked);
  });
  elements.revealToggle.addEventListener('change', () => {
    setSetting('revealHidden', elements.revealToggle.checked);
  });
  elements.viewListBtn.addEventListener('click', () => {
    view = 'list';
    render();
  });
  elements.viewRoadmapBtn.addEventListener('click', () => {
    view = 'roadmap';
    render();
  });
  elements.sampleBtn.addEventListener('click', () => {
    applySampleProgress();
  });
  elements.exportBtn.addEventListener('click', () => exportProgress());
  elements.importBtn.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', async () => {
    const file = elements.importFile.files?.[0];
    if (!file) return;
    try {
      await importProgress(file);
    } catch {
      alert('That file could not be read as Leonida Ledger progress.');
    }
    elements.importFile.value = '';
  });
  elements.resetBtn.addEventListener('click', () => {
    if (confirm('Reset all saved progress, counters and settings?')) resetProgress();
  });
  onProgressChange(render);
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('sample') === '1') applySampleProgress();
  if (params.get('spoiler') === '1') setSetting('spoiler', true);
  if (params.get('reveal') === '1') setSetting('revealHidden', true);
  const filter = params.get('filter');
  if (filter) {
    if (KIND_FILTERS.some((entry) => entry.key === filter)) {
      filters.kind = filter;
    } else if (GRADE_FILTERS.some((entry) => entry.key === filter)) {
      filters.grade = filter;
    }
  }
  if (params.get('view') === 'roadmap') view = 'roadmap';
  const trophyParam = params.get('trophy');
  if (trophyParam && trophyById(trophies, trophyParam)) {
    selectedId = Number(trophyParam);
    if (params.get('view') !== 'roadmap') view = 'list';
  }
}

async function boot() {
  cacheElements();
  buildChips();
  loadProgress();
  try {
    trophies = await loadTrophies();
  } catch (error) {
    elements.checklist.innerHTML =
      `<div class="empty-state"><h3>Trophy data failed to load</h3><p>${error.message}</p></div>`;
    return;
  }
  applyUrlParams();
  if (selectedId === null && trophies.length) selectedId = trophies[0].id;
  wireEvents();
  render();
}

boot();
