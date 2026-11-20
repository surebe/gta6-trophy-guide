// Leonida Ledger — GTA VI Trophy Guide (make.fun entry, gta6-trophy-guide-01)
// Validates the guide dataset against every published invariant, then packs
// the static app and screenshots into the judged dossier.
import { readFileSync, cpSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const root = process.cwd();
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const data = JSON.parse(readFileSync(join(root, "app/data/trophies.json"), "utf8"));

function fail(msg: string): never {
  console.error("VALIDATION FAILED: " + msg);
  process.exit(1);
}

// --- dataset invariants -------------------------------------------------
const trophies = data.trophies;
if (!Array.isArray(trophies) || trophies.length !== 55)
  fail("expected exactly 55 trophies, found " + (trophies || []).length);

const grades: Record<string, number> = {};
let hidden = 0;
let gamerscore = 0;
const missables: string[] = [];
for (const t of trophies) {
  if (!t.name || !t.guide || !String(t.guide).trim())
    fail("trophy missing name or guide text: " + JSON.stringify(t.name));
  grades[t.grade] = (grades[t.grade] ?? 0) + 1;
  if (t.hidden) hidden++;
  gamerscore += t.gamerscore;
  if (t.possiblyMissable) missables.push(t.name);
}
if (grades["Platinum"] !== 1 || grades["Gold"] !== 2 || grades["Silver"] !== 6 || grades["Bronze"] !== 46)
  fail("grade split must be 1 Platinum / 2 Gold / 6 Silver / 46 Bronze, found " + JSON.stringify(grades));
if (hidden !== 28) fail("expected 28 hidden trophies, found " + hidden);
if (gamerscore !== 1000) fail("Gamerscore must total 1000, found " + gamerscore);
if (missables.length !== 1 || missables[0] !== "Positive Mental Attitude")
  fail("the only possibly-missable trophy may be Positive Mental Attitude, found " + JSON.stringify(missables));

// --- citation floors ------------------------------------------------------
const sources = data.sources;
if (!Array.isArray(sources) || sources.length < 16)
  fail("expected at least 16 registered sources, found " + (sources || []).length);
const known = new Set(sources.map((s: any) => s.n));
const cited = new Set<number>();
let steps = 0;
let multi = 0;
let disputes = 0;
let disputeTrophies = 0;
for (const t of trophies) {
  for (const n of t.dc ?? []) cited.add(n);
  if (!Array.isArray(t.steps) || t.steps.length === 0)
    fail("trophy has no steps: " + t.name);
  for (const s of t.steps) {
    steps++;
    if (!Array.isArray(s.c) || s.c.length === 0)
      fail("uncited step in " + t.name + ": " + s.t);
    if (s.c.length >= 2) multi++;
    for (const n of s.c) {
      if (!known.has(n)) fail("step cites unknown source " + n + " in " + t.name);
      cited.add(n);
    }
  }
  const ds = t.disputes ?? [];
  if (ds.length) disputeTrophies++;
  for (const d of ds) {
    disputes++;
    if (!d.a?.c?.length || !d.b?.c?.length || !d.call)
      fail("dispute in " + t.name + " lacks two cited sides or an Our call");
    for (const n of [...d.a.c, ...d.b.c]) cited.add(n);
  }
}
if (steps < 560) fail("expected at least 560 guide steps, found " + steps);
if (multi < 500) fail("expected at least 500 steps with 2+ sources, found " + multi);
if (disputes < 55 || disputeTrophies < 48)
  fail("expected 55+ disputes across 48+ trophies, found " + disputes + " across " + disputeTrophies);
for (const s of sources)
  if (!cited.has(s.n)) fail("source " + s.n + " (" + s.name + ") is registered but never cited");

console.log(
  "dataset ok: 55 trophies, " + steps + " steps (" + multi + " multi-source), " +
  disputes + " disputes across " + disputeTrophies + " trophies, " + sources.length + " sources all cited"
);

// --- review-pass hardening (added after a full self-review of the data) ---
const names = new Set<string>();
for (const t of trophies) {
  if (names.has(t.name)) fail("duplicate trophy name: " + t.name);
  names.add(t.name);
  if (!t.description || !String(t.description).trim())
    fail("trophy missing its official description: " + t.name);
  if (!Array.isArray(t.dc) || t.dc.length === 0)
    fail("official description carries no citation: " + t.name);
  for (const s of t.steps)
    if (!s.t || !String(s.t).trim()) fail("blank step text in " + t.name);
  if (t.collectible) {
    const c = t.collectible;
    if (!(c.target > 0) || !(c.total >= c.target) || !c.label)
      fail("collectible counter is inconsistent in " + t.name);
  }
}
for (const s of sources) {
  if (!s.name || !s.url || !s.read || !(s.pages >= 1))
    fail("source record is incomplete: " + JSON.stringify(s.n));
}
console.log("review-pass checks ok: unique names, cited descriptions, collectible counters, source records");

// --- pack the dossier -----------------------------------------------------
if (!existsSync(join(root, "screenshots")))
  fail("screenshots/ directory is missing");
cpSync(join(root, "app"), join(out, "app"), { recursive: true });
cpSync(join(root, "screenshots"), join(out, "screenshots"), { recursive: true });
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  })
);
console.log("dossier written to " + join(out, "dossier.json"));
