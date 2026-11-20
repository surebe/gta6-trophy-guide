# Leonida Ledger — GTA VI Trophy Guide

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

Entry for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

A complete, evidence-first trophy guide for Grand Theft Auto VI (PS5 / Xbox Series X|S):
all **55 trophies** — 1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 hidden, 1,000 Gamerscore —
researched from **12 published guides read in full** and rebuilt as a working tracker app.

## What is inside

- **501 walkthrough steps, every one cited** with numbered sources — 430 of them backed by
  two or more independent guides. Steps are written as actions (go here, talk to them, open
  this menu), never as bare facts.
- **48 source disputes shown both ways** across 46 trophies: wherever the guides disagree —
  a trophy target, a method, an unconfirmed trigger — the detail panel carries a
  SOURCES DIFFER box with Side A, Side B and our call.
- **A two-row audit bar** on the first screen: the official-list verification (55/55 names
  and descriptions, grade split, hidden count) and the research depth behind it (pages and
  sites read, read date, 1 possibly missable, at-risk windows, unconfirmed count).
- **Roadmap-first tracker**: trophies are grouped by the seven roadmap stages with per-stage
  progress, plus a “Next up” rail that always points at the earliest unfinished trophy.
- **Spoiler shield on by default** — hidden trophies stay masked until you reveal them.
- **Collectible counters** with progress bars: 647 countable targets (stunts, scans,
  meditations, card sets, challenges, vaults and more) plus the two money grinds.
- Checklist with locally saved progress, counter values, search and filters
  (grade / status / disputes / collectible / at-risk), and progress export & import.
- A dedicated **Missables & Windows** view: the single possibly-missable trophy
  (Positive Mental Attitude), the six at-risk quest windows, and the six trophies whose
  triggers are still unconfirmed.
- A **Sources** tab that lists all 12 numbered sources with page title, URL, read date,
  and how many claims each one backs in this guide.

## Run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
node main.ts         # validates the dataset, then writes the hand-in to /output
MAKEFUN_OUTPUT_DIR=out node main.ts   # same, into ./out outside the grader
```

`main.ts` refuses to hand in a guide that breaks its own advertised numbers: it re-checks
the 55-trophy invariants, the citation and dispute floors, and the scorer's size caps
before copying anything.

## Layout

- `app/` — the static guide app (ES modules, no build step, loads nothing over the network)
- `app/data/trophies.json` — the full dataset: trophies, steps, citations, disputes, counters, sources
- `screenshots/` — four 1280×800 JPEG views of the app; `shots.json` says what each one shows
- `vendor/makefun-frontend.ts` — the vendored make.fun library that writes `dossier.json`
