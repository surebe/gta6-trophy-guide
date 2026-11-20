// trophy-data.js — dataset access for the Leonida Ledger v2.
//
// Loads app/data/trophies.json (the official 55-trophy list, our own guides,
// per-step source citations and the recorded source disputes), and provides
// the roadmap stage text, the PlayStation point values, the audit figures
// the header bar shows, and the "next up" ordering used by both the tracker
// and the roadmap.

export const GRADE_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 180 };

export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

export const KIND_LABELS = {
  story: 'Story',
  activities: 'Activities',
  collectibles: 'Collectibles',
  completion: 'Completion',
};

// Seven stages, in the order a single playthrough meets them. The shape
// follows the published roadmaps (story first, then strands, then the long
// counters, then the 100% checklist) with the wording written for this page.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Chapter 1 — Arrival in Leonida',
    blurb:
      'Play the opening chapter: Gone Fishing and the first missions. Before the chapter closes, meditate on the balcony at Jason’s house — that spot feeds Positive Mental Attitude, the game’s only possibly-missable trophy.',
    refs: [1, 4],
  },
  {
    stage: 2,
    title: 'Chapters 2–4 — The Story Widens',
    blurb:
      'Push through Chapters 2, 3 and 4 and their named missions: Breakfast Run, The Cartel Heist, Child’s Play and Headliners. Start stranger strands as they appear — whether they can expire is disputed, and the dispute is recorded on Strangers & Freaks.',
    refs: [1, 3],
  },
  {
    stage: 3,
    title: 'Endgame — The Final Missions',
    blurb:
      'Finish VCIA Takedown and Operation Savage Glory, then the final mission for the hidden story Gold. Free roam continues after the credits and there is no mission replay, so nothing in the later stages is lost by finishing the story now.',
    refs: [1],
  },
  {
    stage: 4,
    title: 'Strangers & Character Strands',
    blurb:
      'Close out the named character lines — Andy, Kenton, Billy, Randy and Tyrone — plus Bret’s unique hunt. Eight finished strands also earn the Strangers & Freaks Silver, and each finale carries a hidden trophy of its own.',
    refs: [2],
  },
  {
    stage: 5,
    title: 'Counters & Collectibles — The Long Grind',
    blurb:
      'The long counters: 250 stunts, 42 Shooting Range golds, drone-race wins at 14 locations, 20 race wins, 50 challenges, 3 card sets, 100 WAiNK locations, 100 vehicles and the whole map explored. These tick up fastest when worked in the background of everything else.',
    refs: [1, 5],
  },
  {
    stage: 6,
    title: 'Crime, Cash & One-Off Secrets',
    blurb:
      'Robberies, money and the hidden one-off secrets: bank vaults, an armored truck, chained shop robberies, a tank, a showroom escape, $250,000 laundered, $100,000 spent, every garage bought and 10 vehicles registered. All of it is free-roam work with no story deadline.',
    refs: [3, 5],
  },
  {
    stage: 7,
    title: '100% Completion & The Platinum',
    blurb:
      'Attain 100% Completion for the second Gold — the long pole of the roughly 200-hour Platinum — and the Platinum itself follows automatically once all 54 other trophies are earned.',
    refs: [1, 4],
  },
];

let cachedDataset = null;

export async function loadDataset() {
  if (cachedDataset) return cachedDataset;
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`Could not load trophy data (${response.status})`);
  cachedDataset = await response.json();
  return cachedDataset;
}

export function trophyById(trophies, id) {
  return trophies.find((trophy) => trophy.id === Number(id)) ?? null;
}

export function trophiesInStage(trophies, stage) {
  return trophies.filter((trophy) => trophy.stage === stage);
}

export function stageInfo(stage) {
  return ROADMAP_STAGES.find((entry) => entry.stage === stage) ?? null;
}

export function sourceByNumber(dataset, n) {
  return dataset.sources.find((source) => source.n === Number(n)) ?? null;
}

// Every source number a trophy's guide relies on: its steps first, then any
// dispute it carries.
export function refsForTrophy(trophy) {
  const seen = new Set();
  for (const step of trophy.steps ?? []) for (const ref of step.refs ?? []) seen.add(ref);
  for (const dispute of trophy.disputes ?? []) {
    for (const ref of dispute.a.refs ?? []) seen.add(ref);
    for (const ref of dispute.b.refs ?? []) seen.add(ref);
  }
  return [...seen].sort((a, b) => a - b);
}

// Map of source number -> how many of the 55 guides cite it.
export function citedInCounts(dataset) {
  const counts = new Map(dataset.sources.map((source) => [source.n, 0]));
  for (const trophy of dataset.trophies) {
    for (const n of refsForTrophy(trophy)) counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  return counts;
}

// The audit figures shown under the header. Everything is counted from the
// dataset itself, so the bar can never promise more than the data holds.
export function computeAudit(dataset) {
  const trophies = dataset.trophies;
  const gradeSplit = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let steps = 0;
  let citedSteps = 0;
  let doubleCitedSteps = 0;
  let guidesWithSource = 0;
  let disputes = 0;
  for (const trophy of trophies) {
    gradeSplit[trophy.grade] = (gradeSplit[trophy.grade] ?? 0) + 1;
    if (refsForTrophy(trophy).length > 0) guidesWithSource += 1;
    disputes += (trophy.disputes ?? []).length;
    for (const step of trophy.steps ?? []) {
      steps += 1;
      const distinct = new Set(step.refs ?? []);
      if (distinct.size >= 1) citedSteps += 1;
      if (distinct.size >= 2) doubleCitedSteps += 1;
    }
  }
  return {
    total: trophies.length,
    withName: trophies.filter((t) => t.name?.trim()).length,
    withDescription: trophies.filter((t) => t.description?.trim()).length,
    withGrade: trophies.filter((t) => t.grade in GRADE_POINTS).length,
    gradeSplit,
    hidden: trophies.filter((t) => t.hidden).length,
    missable: trophies.filter((t) => t.missable).length,
    steps,
    citedSteps,
    doubleCitedSteps,
    guidesWithSource,
    disputes,
    disputedTrophies: trophies.filter((t) => (t.disputes ?? []).length > 0).length,
    sources: dataset.sources.length,
    readDate: dataset.readDate,
  };
}

// The next trophies to work on: roadmap order (stage, then list order),
// skipping anything already earned. The Platinum only shows when it is the
// last thing left.
export function nextUp(trophies, isEarned, limit = 4) {
  const pending = trophies
    .filter((trophy) => !isEarned(trophy.id))
    .sort((a, b) => a.stage - b.stage || a.id - b.id);
  const withoutPlatinum = pending.filter((trophy) => trophy.grade !== 'platinum');
  const pool = withoutPlatinum.length > 0 ? withoutPlatinum : pending;
  return pool.slice(0, limit);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Renders a step's citation numbers as compact [n] chips.
export function refChips(refs) {
  return (refs ?? [])
    .map((n) => `<button type="button" class="ref-chip" data-ref="${n}" title="See source ${n}">[${n}]</button>`)
    .join(' ');
}
