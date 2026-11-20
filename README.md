# Leonida Ledger — GTA VI Trophy Guide & Tracker

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI PlayStation 5 trophies** (1 Platinum, 2 Gold, 6 Silver, 46 Bronze), built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/bounty/gta6-trophy-guide-01).

Every guide was written for this page, and every fact in it carries its receipts: 301 guide steps cite numbered sources like [1], each trophy's detail pane lists the sources that guide rests on, and where the sources disagree — which mission really ends the story, the Chapter 1 meditation, the 15-vs-18 meditation count, whether stranger strands can expire, whether the hidden one-off methods are even known yet — the disagreement is shown both ways with the call this guide makes. Sixteen disputes across fifteen trophies are recorded that way.

## What's inside

- **Audit bar** — live counts computed from the dataset itself: 55/55 official names, descriptions and grades, the grade split, 28 hidden trophies, total guide steps, steps cited, guides citing a source, claims backed by 2+ sources, disputes, and the date the sources were read.
- **Tracker** — checklist with saved progress (localStorage), a prominent collectible counter (− / + stepper, progress bar) per counted trophy, search, kind/grade/status filters, a “Sources differ” filter chip, export / import / reset and sample progress.
- **Detail pane** — official description, our guide, numbered steps with per-step citations, SOURCES DIFFER boxes, and a “Sources for this guide” rail with URLs and read dates.
- **Roadmap** — seven stages to the Platinum with a “Next up” rail in roadmap order.
- **Missables tab** — leads with Positive Mental Attitude, the game's only possibly-missable trophy, its Chapter 1 window and both of its disputes, honestly framed.
- **Sources tab** — every source, numbered to match the citations, with a live “cited in N/55 guides” count for each.
- **Spoiler shield** — the 28 hidden trophies stay masked until earned or until you lower the shield.

## Run it

The app is plain static files — no build step, no network. Serve the folder and open it:

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

or open `app/index.html` in a desktop browser. Progress is stored in the browser's localStorage and can be exported to a JSON file from the toolbar.

## Hand in (the bounty program)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the dataset (55 trophies in the official split, every guide step cited to a valid source, disputes in two-sided shape, verified collectible counts), then copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun frontend library.

## Data & sources

`app/data/trophies.json` holds the official trophy names and descriptions as PlayStation publishes them, plus guides written for this entry. The numbered sources are PowerPyx, GTABase, EGamers, KeenGamer, HowToVideoGame, Exophase and Insider Gaming — each read on 2026-11-20 and listed in full, with URLs, on the app's Sources tab.
