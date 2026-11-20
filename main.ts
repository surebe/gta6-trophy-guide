// Leonida Ledger entrypoint: validate the guide dataset, then hand the app in.
// It copies app/ and screenshots/ from beside this file to /output (or
// MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json with
// the kit's buildDossier from vendor/makefun-frontend.ts, which the scorer
// re-runs byte for byte. Validation runs first so a bad dataset never ships.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const TEXT_MAX_BYTES = 163840;
const DOSSIER_MAX_BYTES = 1572864; // 1.5 MiB
const SHOT_MAX = 4;
const SHOT_MAX_BYTES = 262144;

function fail(msg) {
  throw new Error(`Leonida Ledger: ${msg}`);
}

// ---------- read and validate the dataset ----------
const dataPath = join(here, 'app', 'data', 'trophies.json');
const doc = JSON.parse(readFileSync(dataPath, 'utf8'));
const trophies = doc.trophies;
const sourceIds = new Set(doc.sources.map((s) => s.id));

if (!Array.isArray(trophies) || trophies.length !== 55) fail(`expected 55 trophies, found ${trophies?.length}`);
const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
const names = new Set();
let hidden = 0;
let steps = 0;
let multi = 0;
let disputes = 0;
let disputedTrophies = 0;
const usedSources = new Set();

for (const t of trophies) {
  if (typeof t.name !== 'string' || !t.name) fail(`trophy ${t.id}: no name`);
  if (names.has(t.name)) fail(`duplicate trophy name: ${t.name}`);
  names.add(t.name);
  if (!(t.grade in grades)) fail(`${t.name}: bad grade ${t.grade}`);
  grades[t.grade]++;
  if (t.hidden) hidden++;
  if (typeof t.description !== 'string' || !t.description.trim()) fail(`${t.name}: blank description`);
  if (typeof t.guide !== 'string' || !t.guide.trim()) fail(`${t.name}: blank guide`);
  if (!Array.isArray(t.steps) || t.steps.length === 0) fail(`${t.name}: no guide steps`);
  if (!Array.isArray(t.disputes)) fail(`${t.name}: disputes is not an array`);
  if (t.disputes.length > 0) disputedTrophies++;
  for (const s of t.steps) {
    steps++;
    if (!Array.isArray(s.s) || s.s.length === 0) fail(`${t.name}: a step with no citation`);
    if (typeof s.t !== 'string' || !s.t.trim()) fail(`${t.name}: a blank step`);
    for (const id of s.s) {
      if (!sourceIds.has(id)) fail(`${t.name}: step cites unknown source ${id}`);
      usedSources.add(id);
    }
    if (s.s.length >= 2) multi++;
  }
  for (const d of t.disputes) {
    disputes++;
    for (const k of ['q', 'a', 'b', 'call']) {
      if (typeof d[k] !== 'string' || !d[k].trim()) fail(`${t.name}: dispute missing ${k}`);
    }
    if (!Array.isArray(d.s) || d.s.length < 2) fail(`${t.name}: dispute without both sides cited`);
    for (const id of d.s) {
      if (!sourceIds.has(id)) fail(`${t.name}: dispute cites unknown source ${id}`);
      usedSources.add(id);
    }
  }
}
if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
  fail(`grade split is ${JSON.stringify(grades)}, expected 1/2/6/46`);
}
if (hidden !== 28) fail(`expected 28 hidden trophies, found ${hidden}`);
const missable = trophies.filter((t) => t.name === 'Positive Mental Attitude');
if (missable.length !== 1) fail('Positive Mental Attitude must appear exactly once');
if (doc.sources.length !== 12) fail(`expected 12 sources, found ${doc.sources.length}`);
if (usedSources.size !== 12) fail(`only ${usedSources.size} of 12 sources are cited`);
if (!Array.isArray(doc.roadmap) || doc.roadmap.length !== 7) fail('roadmap must have 7 stages');
const roadmapIds = doc.roadmap.flatMap((s) => s.trophies);
if (new Set(roadmapIds).size !== 55 || roadmapIds.length !== 55) fail('roadmap must cover all 55 trophies exactly once');

// ---------- source bytes must fit the dossier text cap ----------
function sourceBytes(dir, acc = { bytes: 0, files: [] }) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sourceBytes(p, acc);
    else if (/\.(html|js|mjs|css|json)$/.test(e.name) && !e.name.endsWith('.min.js') && !e.name.endsWith('.min.css')) {
      acc.bytes += statSync(p).size;
      acc.files.push(p);
    }
  }
  return acc;
}
const appSources = sourceBytes(join(here, 'app'));
if (appSources.bytes > 160000) fail(`app sources are ${appSources.bytes} bytes, over the 160000 budget for the dossier text cap`);

// ---------- screenshots ----------
const shotDir = join(here, 'screenshots');
if (!existsSync(shotDir)) fail('no screenshots/ directory');
const shots = readdirSync(shotDir).filter((n) => !n.startsWith('.')).sort();
if (shots.length === 0) fail('screenshots/ holds no image');
if (shots.length > SHOT_MAX) fail(`screenshots/ holds ${shots.length} files, over the ${SHOT_MAX} allowed`);
for (const n of shots) {
  const size = statSync(join(shotDir, n)).size;
  if (size > SHOT_MAX_BYTES) fail(`screenshots/${n} is ${size} bytes, over the ${SHOT_MAX_BYTES} allowed`);
}

// ---------- hand it in ----------
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotDir, join(out, 'screenshots'), { recursive: true });
const dossierBytes = buildDossier(out, {
  text_max_bytes: TEXT_MAX_BYTES,
  screenshots: { max: SHOT_MAX, max_bytes: SHOT_MAX_BYTES },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(out, 'dossier.json'), dossierBytes);

// ---------- verify what was written ----------
const dossier = JSON.parse(Buffer.from(dossierBytes).toString('utf8'));
if (dossierBytes.length > DOSSIER_MAX_BYTES) fail(`dossier.json is ${dossierBytes.length} bytes, over the ${DOSSIER_MAX_BYTES} allowed`);
if (typeof dossier.text !== 'string' || dossier.text.includes('[Cut at ')) {
  fail('dossier text was cut at the cap — a source file did not fit whole');
}
if (!Array.isArray(dossier.images) || dossier.images.length !== shots.length) {
  fail('dossier images do not match screenshots/');
}

console.log(`Leonida Ledger OK — ${trophies.length} trophies (${grades.platinum}P/${grades.gold}G/${grades.silver}S/${grades.bronze}B, ${hidden} hidden)`);
console.log(`guide steps: ${steps} (all cited, ${multi} with 2+ sources); disputes: ${disputes} across ${disputedTrophies} trophies; sources: ${usedSources.size}`);
console.log(`app sources: ${appSources.bytes} bytes in ${appSources.files.length} files; screenshots: ${shots.map((n) => `${n} ${statSync(join(shotDir, n)).size}B`).join(', ')}`);
console.log(`dossier.json: ${dossierBytes.length} bytes; text: ${Buffer.byteLength(dossier.text, 'utf8')} bytes, no cut`);
