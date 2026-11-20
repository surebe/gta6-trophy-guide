// Leonida Ledger — entry point for the gta6-trophy-guide-01 submission.
//
// The guide itself is the static web app in app/ (plain HTML, CSS and ES
// modules with no build step; it runs fully offline in a desktop browser).
// This program is the hand-in step: it first validates the trophy dataset
// the app ships, then copies app/ and screenshots/ into the output
// directory and writes dossier.json there with the vendored make.fun
// frontend library, byte for byte as the scorer expects.
//
// Run it the way the grader does, or locally with an output override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The dataset contract the guide is judged against: the official list has
// 55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze — and every trophy
// must carry a non-empty guide of our own.
const EXPECTED_TOTAL = 55;
const EXPECTED_GRADES = { platinum: 1, gold: 2, silver: 6, bronze: 46 };

function validateTrophyDataset() {
  const datasetPath = join(repoRoot, 'app', 'data', 'trophies.json');
  const dataset = JSON.parse(readFileSync(datasetPath, 'utf8'));
  const trophies = dataset.trophies;
  if (!Array.isArray(trophies) || trophies.length !== EXPECTED_TOTAL) {
    throw new Error(`trophies.json must list ${EXPECTED_TOTAL} trophies, found ${trophies?.length}`);
  }
  const gradeCounts = {};
  for (const trophy of trophies) {
    gradeCounts[trophy.grade] = (gradeCounts[trophy.grade] ?? 0) + 1;
    if (typeof trophy.name !== 'string' || trophy.name.trim() === '') {
      throw new Error(`trophy ${trophy.id} is missing its official name`);
    }
    if (typeof trophy.guide !== 'string' || trophy.guide.trim() === '') {
      throw new Error(`trophy ${trophy.id} (${trophy.name}) has an empty guide`);
    }
  }
  for (const [grade, expected] of Object.entries(EXPECTED_GRADES)) {
    if (gradeCounts[grade] !== expected) {
      throw new Error(`expected ${expected} ${grade} trophies, found ${gradeCounts[grade] ?? 0}`);
    }
  }
  const hidden = trophies.filter((trophy) => trophy.hidden).length;
  const missable = trophies.filter((trophy) => trophy.missable).length;
  console.log(
    `Leonida Ledger dataset OK: ${trophies.length} trophies ` +
      `(${EXPECTED_GRADES.platinum} platinum, ${EXPECTED_GRADES.gold} gold, ` +
      `${EXPECTED_GRADES.silver} silver, ${EXPECTED_GRADES.bronze} bronze), ` +
      `${hidden} hidden, ${missable} missable, every guide present.`,
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

validateTrophyDataset();
handIn();
