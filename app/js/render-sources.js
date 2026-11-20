// render-sources.js — the Sources tab: every source this guide rests on,
// numbered to match the [n] citations in the guides, with the date it was
// read and a live count of how many of the 55 guides cite it.

import { citedInCounts, escapeHtml } from './trophy-data.js';

export function renderSources(element, dataset) {
  const counts = citedInCounts(dataset);
  const total = dataset.trophies.length;
  const cards = dataset.sources
    .map((source) => {
      const cited = counts.get(source.n) ?? 0;
      const pct = total ? Math.round((cited / total) * 100) : 0;
      return `<article class="source-card">
        <div class="source-head"><span class="rail-ref">[${source.n}]</span><h3>${escapeHtml(source.name)}</h3></div>
        <p class="source-title">${escapeHtml(source.title)}</p>
        <a class="source-url" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.url)}</a>
        <div class="source-meta">
          <span>Read ${escapeHtml(source.read)}</span>
          <span class="source-cited">Cited in <strong>${cited}/${total}</strong> guides</span>
        </div>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </article>`;
    })
    .join('');
  element.innerHTML = `
  <section class="sources-intro">
    <h2>Sources</h2>
    <p>Every guide on this page was written for it. The facts inside them — the official names, descriptions and grades, the counts, the roadmap shape, the missable warning — cite the sources below by number, like [1], beside the step that uses them. Where the sources disagree with each other, the disagreement is shown on the trophy itself under “Sources differ”, with both versions and the call this guide makes. All sources were read on ${escapeHtml(dataset.readDate)}.</p>
  </section>
  <div class="source-grid">${cards}</div>`;
}
