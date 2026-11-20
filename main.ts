// Leonida Ledger — GTA VI trophy guide (make.fun entry)
// Validates the guide data against the competition floors, then copies the
// app into the output directory and writes dossier.json via the kit library.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// ---------- load data ----------
const dataPath = join(root, "app", "data", "trophies.json");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const trophies: any[] = data.trophies ?? [];
const sources: any[] = data.sources ?? [];

// ---------- validation ----------
const errors: string[] = [];
const need = (cond: boolean, msg: string) => { if (!cond) errors.push(msg); };

need(trophies.length === 55, `trophy count ${trophies.length} != 55`);
const grades: Record<string, number> = {};
let hidden = 0, gamerscore = 0, steps = 0, cited = 0, multi = 0;
let disputes = 0, disputeTrophies = 0, collectibles = 0;
const missables: string[] = [];
const citedSources = new Set<number>();
const names = new Set<string>();
const ids = new Set<string>();

for (const t of trophies) {
  grades[t.grade] = (grades[t.grade] ?? 0) + 1;
  if (t.hidden) hidden++;
  gamerscore += t.g ?? 0;
  if (t.missable) missables.push(t.name);
  need(!names.has(t.name), `duplicate trophy name: ${t.name}`);
  names.add(t.name);
  need(typeof t.id === "string" && t.id.length > 0 && !ids.has(t.id), `bad or duplicate trophy id: ${t.id}`);
  ids.add(t.id);
  need(typeof t.stage === "string" && t.stage.startsWith("Stage "), `${t.name}: missing roadmap stage`);
  need(typeof t.guide === "string" && t.guide.trim().length > 0, `${t.name}: blank guide`);
  need(typeof t.desc === "string" && t.desc.trim().length > 0, `${t.name}: blank description`);
  const cite = (n: number) => citedSources.add(n);
  (t.dc ?? []).forEach(cite);
  let tSteps = 0;
  for (const s of t.steps ?? []) {
    tSteps++; steps++;
    const c: number[] = s.c ?? [];
    if (c.length > 0) cited++;
    if (c.length >= 2) multi++;
    c.forEach(cite);
    need(c.length > 0, `${t.name}: uncited step "${String(s.t).slice(0, 40)}"`);
  }
  need(tSteps > 0, `${t.name}: no steps`);
  if ((t.disputes ?? []).length > 0) disputeTrophies++;
  for (const d of t.disputes ?? []) {
    disputes++;
    (d.ac ?? []).forEach(cite);
    (d.bc ?? []).forEach(cite);
    need((d.ac ?? []).length > 0 && (d.bc ?? []).length > 0, `${t.name}: dispute missing a cited side`);
    need(typeof d.call === "string" && d.call.trim().length > 0, `${t.name}: dispute missing our call`);
  }
  if (t.collect) collectibles += t.collect.need ?? 0;
}

need(grades["Platinum"] === 1, `platinum ${grades["Platinum"]} != 1`);
need(grades["Gold"] === 2, `gold ${grades["Gold"]} != 2`);
need(grades["Silver"] === 6, `silver ${grades["Silver"]} != 6`);
need(grades["Bronze"] === 46, `bronze ${grades["Bronze"]} != 46`);
need(hidden === 28, `hidden ${hidden} != 28`);
need(gamerscore === 1000, `gamerscore ${gamerscore} != 1000`);
need(missables.length === 1 && missables[0] === "Positive Mental Attitude",
  `missable set wrong: ${missables.join(", ")}`);
need(steps >= 560, `steps ${steps} < 560`);
need(cited === steps, `cited ${cited} != steps ${steps}`);
need(multi >= 500, `multi-source steps ${multi} < 500`);
need(disputes >= 55, `disputes ${disputes} < 55`);
need(disputeTrophies >= 48, `dispute trophies ${disputeTrophies} < 48`);
need(sources.length === 16, `sources ${sources.length} != 16`);
need(citedSources.size === 16, `only ${citedSources.size}/16 sources cited`);
for (const s of sources) need(citedSources.has(s.n), `source [${s.n}] ${s.name} never cited`);

// app text budget (html/js/css/json under app/, excl. vendor and *.min.*)
function walk(dir: string): string[] {
  const res: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "vendor") res.push(...walk(p)); }
    else if (!e.name.endsWith(".min.js") && !e.name.endsWith(".min.css")) res.push(p);
  }
  return res;
}
let appBytes = 0;
for (const f of walk(join(root, "app"))) appBytes += statSync(f).size;
need(appBytes <= 160 * 1024, `app text ${appBytes} > 163840 bytes`);

// screenshots contract
const shots = JSON.parse(readFileSync(join(root, "shots.json"), "utf8"));
need(Array.isArray(shots) && shots.length >= 3 && shots.length <= 4, "shots.json must list 3-4 screenshots");
for (const s of shots) {
  const p = join(root, "screenshots", s.file);
  need(existsSync(p), `missing screenshot ${s.file}`);
  if (existsSync(p)) need(statSync(p).size <= 262144, `screenshot ${s.file} over 256 KiB`);
}

if (errors.length) {
  console.error("VALIDATION FAILED:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
console.log(`validation ok: 55 trophies, ${steps} steps (${multi} multi-source), ${disputes} disputes on ${disputeTrophies} trophies, 16/16 sources cited, ${collectibles} collectible targets, app text ${appBytes} bytes`);

// ---------- emit ----------
mkdirSync(out, { recursive: true });
cpSync(join(root, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(root, "screenshots"))) {
  cpSync(join(root, "screenshots"), join(out, "screenshots"), { recursive: true });
}
// buildDossier returns the dossier bytes; the caller writes them (kit pattern).
const dossierBytes = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
need(dossierBytes.length <= 1500000, `dossier ${dossierBytes.length} > 1.5 MB`);
if (errors.length) {
  console.error("VALIDATION FAILED:\n" + errors.map((e) => " - " + e).join("\n"));
  process.exit(1);
}
writeFileSync(join(out, "dossier.json"), dossierBytes);
console.log(`dossier.json written: ${dossierBytes.length} bytes`);
