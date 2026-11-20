# Leonida Ledger — GTA VI Trophy Guide

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounties/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/rank.svg)](https://make.fun/bounties/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/reward.svg)](https://make.fun/bounties/gta6-trophy-guide-01)

Entry for the make.fun bounty [GTA 6 Trophy Guide](https://make.fun/bounties/gta6-trophy-guide-01).

A complete, fully cited trophy guide and tracker for Grand Theft Auto VI:

- **All 55 trophies** with their official names, descriptions and grades (1 Platinum / 2 Gold / 6 Silver / 46 Bronze, 28 hidden, 1,000 Gamerscore) — verified line by line against the published list.
- **603 walkthrough steps**, every one carrying numbered citations; 507 of them are backed by two or more sources.
- **70 documented disagreements** between sources, each shown both ways with an "Our call" — platinum time estimates, the five hidden one-off triggers, finale chapter attribution, and more.
- **16 sources read in full** on 2026-11-20 (PowerPyx, GTABase, KeenGamer, Push Square, EGamers, Insider Gaming, OutputLag, HowToVideoGame, GamesFuze, Press Start, GTA Zone, GTAScoop, TrueAchievements, GameMapa, games.gg, Radio Times), all cited at least once.
- Tracker defaults to roadmap order with per-stage progress and a Next Up rail; spoiler shield on by default; collectible counters (1,349 targets); progress saved locally with export/import; filters for story, missable watch, collectibles and activities.

## Run it

```
node main.ts
```

`main.ts` validates the dataset (counts, grade split, hidden total, Gamerscore, citation floors, dispute coverage) and packs the static app plus screenshots into the dossier. The app itself is plain HTML/CSS/JS in `app/` — open `app/index.html` through any static server to use the tracker.
