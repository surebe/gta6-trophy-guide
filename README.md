# Leonida Ledger — GTA VI Trophy Guide & Tracker

![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)
![rank](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/rank.svg)
![reward](https://make.fun/badge/gta6-trophy-guide-01/surebe/gta6-trophy-guide/reward.svg)

An offline web app that guides and tracks all **55 PlayStation 5 trophies of Grand Theft Auto VI** — built for the [make.fun gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

Every trophy carries its official name, description and grade, plus an original guide written for this app that cites its sources: what to do, where and how, and when it can be missed. The one missable trophy — **Positive Mental Attitude** — is flagged everywhere it matters, starting with the Chapter 1 warning in the roadmap.

## Features

- **Checklist tracker** — mark trophies earned, with per-trophy counters for the tracked totals (250 stunts, 42 Shooting Range golds, 100 WAiNK locations, and more). Progress saves automatically in the browser (localStorage).
- **Export / import / reset** — download your progress as a JSON file, import it back on any machine, or reset the ledger. A sample-progress button fills in a believable mid-game state so you can try everything.
- **Search and filters** — full-text search, kind filters (story, collectibles, activities, completion, missable, and online — GTA VI has no online trophies), grade filters, earned status and four sort orders.
- **Spoiler protection** — a toggle that covers story trophies until you earn them, plus PlayStation-style masking of the 28 hidden trophies with a separate reveal switch.
- **Roadmap to the Platinum** — seven stages built from the official descriptions: story chapters and named missions, the character strands, the counted grinds, crime and secrets, and the 100% completion Gold last.
- **Statistics** — overall completion, trophy points (bronze 15 / silver 30 / gold 90 / platinum 180), per-grade and per-kind progress, missable status, and "next up" suggestions from your counters.
- **Detail pane for every trophy** — the full guide in our own words, numbered steps, tracked progress, and the sources each guide is based on.

## Run it

The app is plain static files under `app/` with no build step and no network requests. Serve that folder with any static file server and open it in a desktop browser:

```sh
node serve.ts            # serves app/ at http://localhost:8080
# or
python3 -m http.server 8080 --directory app
```

Handy URL parameters for jumping straight to a view: `?view=roadmap`, `?trophy=28`, `?filter=missable`, `?spoiler=1`, `?sample=1`.

## Verify and hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the trophy dataset (55 trophies, the 1/2/6/46 grade split, a guide for each), copies `app/` and `screenshots/` to the output directory, and writes the `dossier.json` summary with the vendored make.fun frontend library in `vendor/` (left unchanged, as the scorer requires).

## Sources

Trophy names, descriptions and grades are the official PlayStation 5 list as published on 2026-11-18. The guides are original writing for this app, based on — and citing — these sources: [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/), [GTABase](https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series), [EGamers](https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/), [Insider Gaming](https://insider-gaming.com/complete-gta-6-trophy-list-how-to-get-all-trophies-achievements/) and [howtovideogame](https://howtovideogame.com/gta-6-trophies/).

## License

MIT — see `LICENSE`. Leonida Ledger is a fan-made tool; it is not affiliated with Rockstar Games or Take-Two Interactive, and it contains no Rockstar artwork or logos.
