// render-missables.js — the Missables tab. It leads with the one trophy
// every source agrees is at risk (Positive Mental Attitude), shows its
// disputes in full, and then states plainly that nothing else on the list
// is flagged missable — with the receipts for that claim.

import { escapeHtml, refChips, trophyById } from './trophy-data.js';
import { renderDispute } from './render-detail.js';

export function renderMissables(element, dataset, progress) {
  const trophies = dataset.trophies;
  const risk = trophyById(trophies, 28);
  const value = Math.min(progress.counters[risk.id] ?? 0, risk.count);
  const disputes = (risk.disputes ?? []).map(renderDispute).join('');
  element.innerHTML = `
  <section class="missable-lead">
    <div class="missable-lead-head">
      <span class="badge badge-missable badge-big">Possibly missable — the only one</span>
      <span class="missable-stage">Roadmap stage ${risk.stage} · Chapter 1 window</span>
    </div>
    <h2>${escapeHtml(risk.name)}</h2>
    <blockquote class="official-desc">“${escapeHtml(risk.description)}” <span>— official description</span></blockquote>
    <p class="guide-text">${escapeHtml(risk.guide)}</p>
    <div class="missable-counter-line">Your counter: <strong>${value} of ${risk.count}</strong> meditations
      <span class="bar bar-inline"><span style="width:${Math.round((value / risk.count) * 100)}%"></span></span>
      <button type="button" class="earn-btn" data-open-trophy="${risk.id}">Open in tracker</button>
    </div>
    ${disputes}
  </section>
  <section class="missable-rest">
    <h3>And nothing else</h3>
    <p>Every other trophy on the list can still be earned after the story: free roam continues, and the guides we read flag no other missable. ${refChips([1, 2, 3])}</p>
    <p>Two honest watch-outs that are <em>not</em> missables: using cheats disables trophies and saving, so keep cheats off for a trophy run ${refChips([3])}; and there is no mission replay, so choice-driven moments resolve once, on your single playthrough ${refChips([1])}. The one open question about timing — whether stranger strands can expire — is recorded as a dispute on Strangers &amp; Freaks (#25).</p>
  </section>`;
}
