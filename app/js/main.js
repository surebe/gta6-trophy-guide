// main.js — boots the Leonida Ledger v2: loads the dataset, restores saved
// progress, wires the toolbar and the four tabs (Tracker, Roadmap,
// Missables, Sources), and applies the URL parameters used to stage views
// (?tab=roadmap|missables|sources, ?trophy=<id>, ?sample=1, ?shield=0,
// ?disputed=1).

import { computeAudit, loadDataset, trophyById } from './trophy-data.js';
import {
  applySampleProgress,
  exportProgress,
  getProgress,
  importProgress,
  loadProgress,
  onProgressChange,
  resetProgress,
  setSpoilerShield,
  stepCounter,
  toggleEarned,
} from './progress-store.js';
import { GRADE_FILTERS, KIND_FILTERS, applyFilters, createDefaultFilters } from './filters.js';
import { renderChecklist } from './render-checklist.js';
import { renderDetail } from './render-detail.js';
import { renderMissables } from './render-missables.js';
import { nextUpCards, renderRoadmap } from './render-roadmap.js';
import { renderSources } from './render-sources.js';
import { computeStats, renderAuditBar, renderHeaderStats, renderStats } from './render-stats.js';

const elements = {};
let dataset = null;
let trophies = [];
let filters = createDefaultFilters();
let selectedId = 28;
let activeTab = 'tracker';

function cacheElements() {
  for (const id of [
    'headerStats', 'auditBar', 'statsPanel', 'searchInput', 'statusSelect', 'sortSelect',
    'shieldToggle', 'kindChips', 'gradeChips', 'disputedChip', 'resultCount',
    'sampleBtn', 'exportBtn', 'importBtn', 'importFile', 'resetBtn',
    'nextUp', 'checklist', 'detail',
    'view-tracker', 'view-roadmap', 'view-missables', 'view-sources',
  ]) {
    elements[id] = document.getElementById(id);
  }
  elements.tabButtons = [...document.querySelectorAll('.tab-btn')];
}

function buildChips() {
  elements.kindChips.innerHTML = KIND_FILTERS.map(
    (entry) => `<button type="button" class="chip-btn ${entry.key === filters.kind ? 'is-active' : ''}" data-kind="${entry.key}">${entry.label}</button>`,
  ).join('');
  elements.gradeChips.innerHTML = GRADE_FILTERS.map(
    (entry) => `<button type="button" class="chip-btn ${entry.key === filters.grade ? 'is-active' : ''}" data-grade="${entry.key}">${entry.label}</button>`,
  ).join('');
  const disputedCount = trophies.filter((trophy) => (trophy.disputes ?? []).length).length;
  elements.disputedChip.textContent = `Sources differ · ${disputedCount}`;
  elements.disputedChip.classList.toggle('is-active', filters.disputedOnly);
  elements.disputedChip.setAttribute('aria-pressed', String(filters.disputedOnly));
}

function renderTracker() {
  const progress = getProgress();
  const stats = computeStats(trophies, progress);
  renderHeaderStats(elements.headerStats, stats);
  renderStats(elements.statsPanel, stats);
  elements.nextUp.innerHTML = nextUpCards(trophies, progress);
  const visible = applyFilters(trophies, filters, progress);
  elements.resultCount.textContent = `${visible.length} of ${trophies.length} trophies shown`;
  renderChecklist(elements.checklist, visible, progress, selectedId);
  renderDetail(elements.detail, dataset, trophyById(trophies, selectedId), progress);
}

function renderActiveTab() {
  const progress = getProgress();
  renderHeaderStats(elements.headerStats, computeStats(trophies, progress));
  for (const tab of ['tracker', 'roadmap', 'missables', 'sources']) {
    elements[`view-${tab}`].hidden = tab !== activeTab;
  }
  for (const button of elements.tabButtons) {
    button.classList.toggle('is-active', button.dataset.tab === activeTab);
  }
  if (activeTab === 'tracker') renderTracker();
  if (activeTab === 'roadmap') {
    renderRoadmap(elements['view-roadmap'], trophies, progress);
    renderHeaderStats(elements.headerStats, computeStats(trophies, progress));
  }
  if (activeTab === 'missables') renderMissables(elements['view-missables'], dataset, progress);
  if (activeTab === 'sources') renderSources(elements['view-sources'], dataset);
}

function selectTrophy(id, switchToTracker = false) {
  if (trophyById(trophies, id)) selectedId = Number(id);
  if (switchToTracker) activeTab = 'tracker';
  renderActiveTab();
}

function wireEvents() {
  elements.searchInput.addEventListener('input', (event) => {
    filters.query = event.target.value;
    renderTracker();
  });
  elements.statusSelect.addEventListener('change', (event) => {
    filters.status = event.target.value;
    renderTracker();
  });
  elements.sortSelect.addEventListener('change', (event) => {
    filters.sort = event.target.value;
    renderTracker();
  });
  elements.shieldToggle.addEventListener('change', (event) => {
    setSpoilerShield(event.target.checked);
  });
  elements.kindChips.addEventListener('click', (event) => {
    const button = event.target.closest('[data-kind]');
    if (!button) return;
    filters.kind = button.dataset.kind;
    buildChips();
    renderTracker();
  });
  elements.gradeChips.addEventListener('click', (event) => {
    const button = event.target.closest('[data-grade]');
    if (!button) return;
    filters.grade = button.dataset.grade;
    buildChips();
    renderTracker();
  });
  elements.disputedChip.addEventListener('click', () => {
    filters.disputedOnly = !filters.disputedOnly;
    buildChips();
    renderTracker();
  });
  elements.sampleBtn.addEventListener('click', () => applySampleProgress());
  elements.exportBtn.addEventListener('click', () => exportProgress());
  elements.importBtn.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      importProgress(await file.text());
    } catch (error) {
      alert(error.message);
    }
    event.target.value = '';
  });
  elements.resetBtn.addEventListener('click', () => {
    if (confirm('Clear all saved progress and counters?')) resetProgress();
  });
  for (const button of elements.tabButtons) {
    button.addEventListener('click', () => {
      activeTab = button.dataset.tab;
      renderActiveTab();
    });
  }
  elements.checklist.addEventListener('change', (event) => {
    const input = event.target.closest('[data-earn]');
    if (input) toggleEarned(trophyById(trophies, input.dataset.earn));
  });
  elements.checklist.addEventListener('click', (event) => {
    if (event.target.closest('[data-earn]')) return;
    const row = event.target.closest('[data-trophy-id]');
    if (row) selectTrophy(row.dataset.trophyId);
  });
  document.body.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-trophy]');
    if (open) {
      selectTrophy(open.dataset.openTrophy, true);
      return;
    }
    const ref = event.target.closest('[data-ref]');
    if (ref) {
      activeTab = 'sources';
      renderActiveTab();
      return;
    }
    const earn = event.target.closest('[data-toggle-earn]');
    if (earn) {
      toggleEarned(trophyById(trophies, earn.dataset.toggleEarn));
      return;
    }
    const counter = event.target.closest('[data-counter]');
    if (counter) {
      const trophy = trophyById(trophies, selectedId);
      if (trophy) stepCounter(trophy, Number(counter.dataset.counter));
    }
  });
  onProgressChange(() => renderActiveTab());
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('sample') === '1') applySampleProgress();
  if (params.get('shield') === '0') {
    setSpoilerShield(false);
    elements.shieldToggle.checked = false;
  }
  if (params.get('disputed') === '1') filters.disputedOnly = true;
  if (params.get('trophy')) selectedId = Number(params.get('trophy')) || selectedId;
  const tab = params.get('tab');
  if (['tracker', 'roadmap', 'missables', 'sources'].includes(tab)) activeTab = tab;
}

async function boot() {
  cacheElements();
  loadProgress();
  dataset = await loadDataset();
  trophies = dataset.trophies;
  renderAuditBar(elements.auditBar, computeAudit(dataset));
  buildChips();
  wireEvents();
  applyUrlParams();
  buildChips();
  renderActiveTab();
}

boot().catch((error) => {
  document.getElementById('checklist').innerHTML = `<p class="empty-note">The ledger could not load: ${error.message}</p>`;
});
