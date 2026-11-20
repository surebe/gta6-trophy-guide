// Leonida Ledger — hand-in program for the gta6-trophy-guide-01 submission.
//
// The guide is the static web app in app/ (plain HTML, CSS and ES modules,
// no build step, fully offline). This program validates the trophy dataset
// against the citation model the guide is built on — 55 trophies in the
// official split, every guide step carrying at least one valid source
// citation, disputes in their two-sided shape — then copies app/ and
// screenshots/ into the output directory and writes dossier.json there
// with the vendored make.fun frontend library.
//
// Run it the way the grader does, or locally with an output override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const EXPECTED_TOTAL = 55;
const EXPECTED_GRADES = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const EXPECTED_HIDDEN = 28;
const EXPECTED_MISSABLE = [28];
// The collectible totals the guides were verified against.
const EXPECTED_COUNTS = { 15: 250, 17: 42, 18: 14, 19: 20, 25: 8, 28: 18, 30: 3, 31: 100, 32: 50, 34: 3, 35: 100, 36: 5, 40: 5, 55: 10 };

function fail(message) {
  throw new Error(`trophies.json: ${message}`);
}

function validateDataset() {
  const dataset = JSON.parse(readFileSync(join(repoRoot, 'app', 'data', 'trophies.json'), 'utf8'));

  // The numbered source directory every citation points into.
  const sources = dataset.sources;
  if (!Array.isArray(sources) || sources.length === 0) fail('a non-empty sources array is required');
  const sourceNumbers = new Set();
  for (const source of sources) {
    if (!Number.isInteger(source.n) || sourceNumbers.has(source.n)) fail(`source numbers must be unique integers, got ${source.n}`);
    sourceNumbers.add(source.n);
    if (!source.name?.trim() || !source.title?.trim()) fail(`source ${source.n} needs a name and a title`);
    if (!/^https:\/\//.test(source.url ?? '')) fail(`source ${source.n} needs an https URL`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.read ?? '')) fail(`source ${source.n} needs a read date (YYYY-MM-DD)`);
  }
  const checkRefs = (refs, where) => {
    if (!Array.isArray(refs) || refs.length === 0) fail(`${where} must cite at least one source`);
    for (const ref of refs) if (!sourceNumbers.has(ref)) fail(`${where} cites unknown source ${ref}`);
  };

  const trophies = dataset.trophies;
  if (!Array.isArray(trophies) || trophies.length !== EXPECTED_TOTAL) {
    fail(`must list ${EXPECTED_TOTAL} trophies, found ${trophies?.length}`);
  }
  const gradeCounts = {};
  const seenIds = new Set();
  let steps = 0;
  let disputes = 0;
  for (const trophy of trophies) {
    if (seenIds.has(trophy.id)) fail(`duplicate trophy id ${trophy.id}`);
    seenIds.add(trophy.id);
    gradeCounts[trophy.grade] = (gradeCounts[trophy.grade] ?? 0) + 1;
    if (!trophy.name?.trim()) fail(`trophy ${trophy.id} is missing its official name`);
    if (!trophy.description?.trim()) fail(`trophy ${trophy.id} is missing its official description`);
    if (!trophy.guide?.trim()) fail(`trophy ${trophy.id} (${trophy.name}) has an empty guide`);
    if (!Array.isArray(trophy.steps) || trophy.steps.length === 0) fail(`trophy ${trophy.id} has no guide steps`);
    for (const step of trophy.steps) {
      if (!step.text?.trim()) fail(`trophy ${trophy.id} has an empty guide step`);
      checkRefs(step.refs, `trophy ${trophy.id} step "${step.text.slice(0, 32)}…"`);
      steps += 1;
    }
    for (const dispute of trophy.disputes ?? []) {
      if (!dispute.topic?.trim() || !dispute.call?.trim()) fail(`trophy ${trophy.id} has a dispute without a topic or a call`);
      if (!dispute.a?.claim?.trim() || !dispute.b?.claim?.trim()) fail(`trophy ${trophy.id} dispute "${dispute.topic}" must state both sides`);
      checkRefs(dispute.a.refs, `trophy ${trophy.id} dispute side A`);
      checkRefs(dispute.b.refs, `trophy ${trophy.id} dispute side B`);
      disputes += 1;
    }
    const expectedCount = EXPECTED_COUNTS[trophy.id];
    if (expectedCount !== undefined && trophy.count !== expectedCount) {
      fail(`trophy ${trophy.id} count must be ${expectedCount}, found ${trophy.count}`);
    }
  }
  for (const [grade, expected] of Object.entries(EXPECTED_GRADES)) {
    if (gradeCounts[grade] !== expected) fail(`expected ${expected} ${grade} trophies, found ${gradeCounts[grade] ?? 0}`);
  }
  const hidden = trophies.filter((trophy) => trophy.hidden).length;
  if (hidden !== EXPECTED_HIDDEN) fail(`expected ${EXPECTED_HIDDEN} hidden trophies, found ${hidden}`);
  const missable = trophies.filter((trophy) => trophy.missable).map((trophy) => trophy.id);
  if (JSON.stringify(missable) !== JSON.stringify(EXPECTED_MISSABLE)) {
    fail(`missable trophies must be exactly ${EXPECTED_MISSABLE}, found ${missable}`);
  }
  console.log(
    `Leonida Ledger dataset OK: ${trophies.length} trophies (1 platinum, 2 gold, 6 silver, 46 bronze), ` +
      `${hidden} hidden, missable ${missable}, ${steps} guide steps all cited to ${sources.length} sources, ${disputes} disputes shown both ways.`,
  );
}

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  const screenshotsDir = join(repoRoot, 'screenshots');
  if (existsSync(screenshotsDir)) {
    cpSync(screenshotsDir, join(outputDir, 'screenshots'), { recursive: true });
  }
  // The scorer's caps for this bounty: at most 4 screenshots of 256 KiB,
  // at most 993 files and 48 MiB under app/, and 160 KiB of source text in
  // the dossier the judge reads.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  console.log(`Handed in to ${outputDir}: app/, screenshots/ and dossier.json (${dossier.length} bytes).`);
}

validateDataset();
handIn();
