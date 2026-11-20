# Leonida Ledger — GTA VI Trophy Guide

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

A complete, fully cited trophy guide for Grand Theft Auto VI, built for the
[make.fun GTA 6 Trophy Guide bounty](https://make.fun/competitions/gta6-trophy-guide-01).

## What is inside

- **All 55 trophies, verified**: 1 Platinum / 2 Gold / 6 Silver / 46 Bronze,
  28 hidden, exactly 1,000 Gamerscore — cross-checked against 16 published
  lists and guides, every one read in full (see the Sources tab in the app).
- **596 walkthrough steps, 100% cited** — every step carries numbered
  citations `[n]`, and every step is backed by 2+ sources. Steps are written
  as a walkthrough: one action each, with the mission, NPC, place, time or
  menu path named.
- **60 "SOURCES DIFFER" boxes** printed on the trophies themselves: where the
  published guides disagree, both sides are shown with citations, plus our
  call. No disagreement is silently hidden.
- **Two-row audit bar, computed from the data**: list verification (trophy
  count, grade split, Gamerscore, hidden count, step and citation coverage,
  dispute count) and research depth (pages/sites read with date, at-risk
  strands, unconfirmed trophies, source coverage, 1,175 tracked collectible
  targets).
- **Roadmap-first tracker**: trophies grouped by the 7 roadmap stages with
  per-stage progress and a "Next Up" rail; detail panel with the official
  description quote, badges (MISSABLE / AT RISK / UNCONFIRMED / SOURCES
  DIFFER / COLLECTIBLE / stage), collectible progress bars, per-step
  checklists, and a per-trophy source rail.
- **Spoiler shield ON by default**, search and grade filters, Roadmap /
  Missables & Risk / Sources tabs, progress saved in localStorage, and
  export/import of your progress as JSON.
- **Exactly one missable trophy** — Positive Mental Attitude — flagged
  everywhere it matters, with the Chapter 1 balcony meditation called out in
  the roadmap's first stage.

## Run it

```
node main.ts            # validates the data, copies app/ + screenshots/, writes dossier.json
```

Set `MAKEFUN_OUTPUT_DIR` to choose the output directory (default `/output`).
The program validates every floor before emitting: trophy composition,
Gamerscore, step citation coverage, dispute coverage, source coverage and
the app text budget — and exits non-zero if any check fails. Two consecutive
runs produce byte-identical `dossier.json`.

To browse the guide locally, serve the `app/` folder with any static file
server and open `index.html`. The app is fully offline: it loads nothing
from the network.

## Sources

PowerPyx, GTABase, KeenGamer, Push Square, EGamers, Insider Gaming,
OutputLag, HowToVideoGame, GamesFuze, Press Start, GTA Zone, GTAScoop,
TrueAchievements, GameMapa, games.gg and Radio Times — each read in full on
2026-11-21 and cited by number throughout the guide. The app's Sources tab
lists every page with its URL, read date, and an honest claim count counted
from the guide's own data.

Fan-made guide. Not affiliated with Rockstar Games or Take-Two Interactive.
