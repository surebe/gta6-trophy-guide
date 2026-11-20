# Leonida Ledger — GTA VI Trophy Guide & Tracker

[![GTA 6 Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01/)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01/)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01/)

A complete Grand Theft Auto VI trophy guide and tracker for the [gta6-trophy-guide-01 bounty](https://make.fun/c/gta6-trophy-guide-01/): all 55 trophies (1 Platinum, 2 Gold, 6 Silver, 46 Bronze; 28 hidden), a 7-stage roadmap to the Platinum, a Missables tab, and a Sources tab. Fully static and offline — open `app/index.html`, no build step, nothing loaded over the network.

## What is inside

- **Tracker** — checklist with progress saved locally, search, filters (kind, grade, status, disputed-only), a spoiler shield over the 28 hidden trophies, a collectible counter with a stepper on every counted trophy, and a detail pane per trophy: a short guide, numbered steps with per-step citations, a sources rail, and a "Sources differ" box wherever the guides disagree.
- **Roadmap** — 7 stages in order with a Next-up rail that always points at the first unfinished stage.
- **Missables** — leads with Positive Mental Attitude, the one trophy that can lock you out: Lucia's Chapter 1 balcony meditation, plus the timed Yago race and save discipline (no mission replay).
- **Sources** — the 12 guides this ledger was written from, read 20 November 2026, with live counts of how many steps cite each one.
- **Progress tools** — export, import, reset, and a sample-progress loader.

## Audit (computed live from the dataset)

- 55 trophies, grades 1 / 2 / 6 / 46, 28 hidden
- 420 guide steps — 420/420 cited, 418 backed by 2+ sources
- 33 disputes across 25 trophies, each showing both sides with citations and an explicit "our call"
- 12 sources read: PowerPyx, GTABase, KeenGamer, EGamers, Insider Gaming, HowToVideoGame, Exophase, OutputLag, Push Square, GTA Zone, GamesFuze, GTAScoop

Five hidden trophies have no confirmed unlock method in any guide we read (In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There, Ten Pin). They are marked unconfirmed with the best leads we found — never guessed.

## Run it

```sh
node serve.ts        # serves app/ at http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the dataset first (55 trophies, grade split, 28 hidden, every step cited, every dispute showing both sides, all 12 sources used, roadmap covering all 55 exactly once, source bytes inside the dossier text cap, 4 screenshots inside their caps), then copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.
