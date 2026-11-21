# Leonida Ledger — GTA VI Trophy Guide & Tracker

![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/reward.svg)

An offline trophy guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5, built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01).

**The first screen is the point.** The app opens on **Positive Mental Attitude** — the list's only missable trophy, and a visible one — with its full walkthrough, numbered citations and SOURCES DIFFER box readable at once. The spoiler shield is ON by default, and it can never blur the opening view, because the default trophy is not hidden (the build script refuses to hand in a guide whose default trophy is hidden).

## What is inside

- **Verified list:** 55 trophies — 1 Platinum / 2 Gold / 6 Silver / 46 Bronze, 28 hidden, exactly 1,000 Gamerscore, one missable.
- **613 walkthrough steps, every one cited** with numbered `[n]` source references; 519 steps are backed by two or more sources.
- **58 source disputes across all 55 trophies**, each shown in the main detail flow as a SOURCES DIFFER box: Side A and Side B, both cited, plus our call.
- **16 guide pages read in full across 15 sites** (PowerPyx, GTABase, KeenGamer, Push Square, EGamers, Insider Gaming ×2, OutputLag, HowToVideoGame, GamesFuze, Press Start, GTA Zone, GTAScoop, TrueAchievements, GameMapa, games.gg) — the Sources tab counts every claim from the citation data itself.
- Tracker in roadmap order with per-stage progress and a **Next Up** rail; Roadmap, Missables & Risks, and Sources tabs; search and grade/state filters.
- Collectible counters in the header and per trophy with progress bars and steppers; checklist progress saved in `localStorage`, with export/import as JSON.
- Official trophy descriptions quoted as PlayStation publishes them, each with its own citations; badges for MISSABLE, AT RISK, UNCONFIRMED, SOURCES DIFFER, COLLECTIBLE and HIDDEN trophies.

## Run it

Open `app/index.html` in a browser, or serve the folder:

```
node serve.ts   # then open http://localhost:8080
```

## Hand it in

```
mkdir -p /tmp/out && MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

`main.ts` re-validates the data (counts, floors, citation integrity, and the not-hidden default rule) before copying `app/` and `screenshots/` to the output directory and writing `dossier.json` with the vendored make.fun library.
