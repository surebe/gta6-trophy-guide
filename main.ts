// Leonida Ledger — entry program for gta6-trophy-guide-01.
//
// What this program does, in order:
//   1. Loads app/data/trophies.json and proves the guide still meets every
//      editorial invariant the entry advertises (55 trophies with the exact
//      grade split, 28 hidden, a single possible missable, every step cited,
//      the multi-source and dispute floors, 12 sources).
//   2. Measures the app against the scorer's caps before anything is copied.
//   3. Copies app/ and screenshots/ into the output directory and writes
//      dossier.json through the vendored make.fun library, untouched.
//
// Run locally with:  MAKEFUN_OUTPUT_DIR=/tmp/ledger-out node main.ts
// Any failed check prints the failures and exits non-zero; nothing is
// copied or written in that case.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const failures = [];
const check = (ok, label) => { if (!ok) failures.push(label); };

// ---------- 1. Dataset invariants ----------
const data = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = data.trophies;
const sources = data.sources;
const stageIds = new Set(data.stages.map((s) => s.id));

check(Array.isArray(trophies) && trophies.length === 55, `expected 55 trophies, found ${trophies?.length}`);
check(new Set(trophies.map((t) => t.id)).size === 55, 'trophy ids are not unique');
check(sources.length === 12, `expected 12 sources, found ${sources.length}`);
check(sources.every((s, i) => s.n === i + 1 && s.name && s.url && s.read), 'sources must be numbered 1..12 with name, url and read date');

const gradeCount = (g) => trophies.filter((t) => t.grade === g).length;
check(gradeCount('Platinum') === 1, `Platinum count is ${gradeCount('Platinum')}, expected 1`);
check(gradeCount('Gold') === 2, `Gold count is ${gradeCount('Gold')}, expected 2`);
check(gradeCount('Silver') === 6, `Silver count is ${gradeCount('Silver')}, expected 6`);
check(gradeCount('Bronze') === 46, `Bronze count is ${gradeCount('Bronze')}, expected 46`);
check(trophies.filter((t) => t.hidden).length === 28, 'hidden trophy count is not 28');
check(trophies.reduce((a, t) => a + t.gs, 0) === 1000, 'Gamerscore total is not 1000');

const missables = trophies.filter((t) => t.miss);
check(missables.length === 1 && missables[0].name === 'Positive Mental Attitude',
  `expected the single missable to be Positive Mental Attitude, found ${missables.map((t) => t.name).join(', ') || 'none'}`);

let stepTotal = 0, stepMulti = 0, disputeTotal = 0, disputedTrophies = 0;
for (const t of trophies) {
  check(stageIds.has(t.stage), `${t.name}: unknown stage "${t.stage}"`);
  check(typeof t.desc === 'string' && t.desc.length > 0, `${t.name}: missing official description`);
  check(Array.isArray(t.dc) && t.dc.length >= 2, `${t.name}: description needs 2+ citations`);
  check(Array.isArray(t.steps) && t.steps.length >= 4, `${t.name}: suspiciously few steps (${t.steps?.length})`);
  for (const s of t.steps) {
    stepTotal++;
    if (Array.isArray(s.c) && s.c.length >= 2) stepMulti++;
    check(Array.isArray(s.c) && s.c.length >= 1, `${t.name}: uncited step "${String(s.t).slice(0, 40)}…"`);
    check((s.c || []).every((n) => Number.isInteger(n) && n >= 1 && n <= 12), `${t.name}: citation outside 1..12`);
    check(typeof s.t === 'string' && s.t.length >= 20, `${t.name}: step text too thin`);
  }
  const ds = t.disputes || [];
  if (ds.length) disputedTrophies++;
  for (const d of ds) {
    disputeTotal++;
    check(d.q && d.a && d.b && d.call, `${t.name}: dispute missing a side or the call`);
    check((d.ac || []).length >= 1 && (d.bc || []).length >= 1, `${t.name}: dispute side without citation`);
  }
  if (t.ctr) check(Number.isFinite(t.ctr.target) && t.ctr.target > 0 && t.ctr.label, `${t.name}: malformed counter`);
}
check(stepTotal >= 420, `only ${stepTotal} guide steps, floor is 420`);
check(stepMulti >= 418, `only ${stepMulti} steps backed by 2+ sources, floor is 418`);
check(disputeTotal >= 33, `only ${disputeTotal} disputes, floor is 33`);
check(disputedTrophies >= 25, `disputes cover only ${disputedTrophies} trophies, floor is 25`);

// ---------- 2. Scorer caps ----------
const TEXT_MAX = 163840, SHOT_MAX = 4, SHOT_BYTES = 262144, APP_MAX_FILES = 993, APP_MAX_BYTES = 50331648;
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
const appFiles = walk(join(here, 'app'));
const textBytes = appFiles
  .filter((f) => /\.(html|css|js|json|md|txt)$/i.test(f))
  .reduce((a, f) => a + statSync(f).size, 0);
check(appFiles.length <= APP_MAX_FILES, `app/ has ${appFiles.length} files, cap is ${APP_MAX_FILES}`);
check(appFiles.reduce((a, f) => a + statSync(f).size, 0) <= APP_MAX_BYTES, 'app/ exceeds the byte cap');
check(textBytes <= TEXT_MAX, `app text is ${textBytes} bytes, cap is ${TEXT_MAX}`);

const shotDir = join(here, 'screenshots');
const shots = existsSync(shotDir) ? readdirSync(shotDir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort() : [];
check(shots.length >= 3 && shots.length <= SHOT_MAX, `expected 3-${SHOT_MAX} screenshots, found ${shots.length}`);
for (const f of shots) check(statSync(join(shotDir, f)).size <= SHOT_BYTES, `screenshot ${f} exceeds ${SHOT_BYTES} bytes`);

// ---------- Verdict ----------
if (failures.length) {
  console.error(`Leonida Ledger validation FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('Leonida Ledger — validation passed');
console.log(`  trophies: 55 (1 Platinum / 2 Gold / 6 Silver / 46 Bronze, 28 hidden, 1000G)`);
console.log(`  steps: ${stepTotal}, all cited; ${stepMulti} backed by 2+ sources`);
console.log(`  disputes: ${disputeTotal} across ${disputedTrophies} trophies; sources: 12`);
console.log(`  missable: Positive Mental Attitude only; app text: ${textBytes} bytes; screenshots: ${shots.length}`);

// ---------- 3. Hand-in ----------
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotDir)) cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: TEXT_MAX,
  screenshots: { max: SHOT_MAX, max_bytes: SHOT_BYTES },
  app_max_files: APP_MAX_FILES,
  app_max_bytes: APP_MAX_BYTES,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`  dossier.json written to ${out} (${Buffer.byteLength(dossier)} bytes)`);
