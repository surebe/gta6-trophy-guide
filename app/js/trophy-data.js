// trophy-data.js — loads the trophy dataset and provides lookups, the
// roadmap stage definitions, the trophy point values and the directory of
// sources every guide cites.

export const SOURCE_LINKS = {
  Exophase: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  GTABase: 'https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series',
  EGamers: 'https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/',
  'Insider Gaming': 'https://insider-gaming.com/complete-gta-6-trophy-list-how-to-get-all-trophies-achievements/',
  howtovideogame: 'https://howtovideogame.com/gta-6-trophies/',
};

// PlayStation trophy point values, used by the statistics panel.
export const GRADE_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 180 };

export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

// The roadmap is built from the official descriptions: story chapters and
// named missions first, then the character strands those descriptions name,
// then the counted grinds, the crime and secret trophies, and finally the
// 100% completion Gold that the Platinum hangs on.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Chapter 1 — Landfall in Leonida',
    blurb:
      'Play the opening chapter: Gone Fishing and the Chapter 1 missions. Before the chapter closes, meditate on the balcony at Jason\u2019s house — that spot feeds Positive Mental Attitude, the game\u2019s only missable trophy, and it is reported to disappear once Chapter 1 ends.',
  },
  {
    stage: 2,
    title: 'Chapters 2–4 — Building the Empire',
    blurb:
      'Push through Chapters 2, 3 and 4 and their named missions: Breakfast Run, The Cartel Heist, Child\u2019s Play and Headliners. Start stranger and character strands as they appear on the map — some chains are reported to have windows tied to story progress, so do not stockpile them all for later.',
  },
  {
    stage: 3,
    title: 'Endgame — The Final Missions',
    blurb:
      'Finish VCIA Takedown and Operation Savage Glory, then the final mission for the hidden story Gold. Free roam continues after the credits and there is no mission replay, so everything non-story can safely wait — nothing in the later stages is lost by finishing the story now.',
  },
  {
    stage: 4,
    title: 'Strangers & Character Lines',
    blurb:
      'Close out the character quest lines the descriptions name — Andy, Kenton, Billy, Randy and Tyrone — plus Bret\u2019s unique hunt. Eight finished strands also earn the Strangers & Freaks Silver, and each finale carries a hidden trophy of its own.',
  },
  {
    stage: 5,
    title: 'The Leonida Grind — Activities & Collectibles',
    blurb:
      'The long counters: 250 stunts, 42 Shooting Range golds, drone races at 14 locations, 20 race wins, 50 challenges, 3 card sets, 100 WAiNK locations, 100 vehicles and the whole map explored. These tick up fastest when you work them in the background of everything else.',
  },
  {
    stage: 6,
    title: 'Crime, Cash & Secrets',
    blurb:
      'Robberies, money and the hidden one-off secrets: bank vaults, an armored truck, shop chains with your partner, a tank, a showroom escape, $250,000 laundered and $100,000 spent, every garage bought and 10 vehicles registered. All of it is free-roam work with no story deadline.',
  },
  {
    stage: 7,
    title: '100% — The Long Road Home',
    blurb:
      'Attain 100% Completion for the second Gold — the long pole of the roughly 200-hour Platinum — and the Platinum itself follows automatically once all 54 other trophies are earned. Everything not locked to the story can be cleaned up in free roam, so this stage is a sweep, not a restart.',
  },
];

let cachedTrophies = null;

export async function loadTrophies() {
  if (cachedTrophies) return cachedTrophies;
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`Could not load trophy data (${response.status})`);
  const data = await response.json();
  cachedTrophies = data.trophies;
  return cachedTrophies;
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

export function totalPoints(trophies) {
  return trophies.reduce((sum, trophy) => sum + (GRADE_POINTS[trophy.grade] ?? 0), 0);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
