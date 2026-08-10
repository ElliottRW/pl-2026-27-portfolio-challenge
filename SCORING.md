# ⚽ Premier League 2026/27 Portfolio Challenge — Scoring Rules

> **Status: PARTIALLY FINALIZED.** Match points, cup scope, and the final
> league-position bonus were agreed on the 2026-08-10 rules call and are live
> in code. Clean sheet / goal bonuses and the draft club prices are still
> open — see the sections below.

## 📋 Match Results (live in code)

| Result | Points |
|--------|--------|
| Win    | +3 pts |
| Draw   | +1 pt  |
| Loss   |  0 pts |

Each club plays 38 Premier League matches across the season. **Cup
competitions (FA Cup, League Cup, Europe) are out of scope** — agreed on the
2026-08-10 call — and `matches.json` only ever contains Premier League
fixtures (sourced from ESPN's `eng.1` competition feed), so there's nothing
to filter in code.

- **4 clubs per entry** with a budget of **100 credits.**
- Points from all 4 clubs are added together for your total score.

## 🏁 Final League Position Bonus (live in code, agreed 2026-08-10)

- 1st place is worth **20 pts**, 20th place is worth **1 pt**
  (`basePts = 21 - finishPosition`).
- Blended with the pre-season predicted position (`predictedPosition` in
  `js/data.js` `TEAM_DATA`): finishing **better** than predicted adds points,
  finishing **worse** subtracts them — 1 pt per place
  (`delta = predictedPosition - finishPosition`).
- **Worked example:** Arsenal are predicted 1st. If they finish 5th:
  `basePts = 21 - 5 = 16`, `delta = 1 - 5 = -4` (the "lose 4 points" case
  from the call), for a total position bonus of **12 pts**.
- Implemented in `positionBonus()` in `js/scoring.js`, and only actually
  added to a club's total once the season is fully complete (all 380
  fixtures `FINISHED`) — it's a *final* position bonus, not a live one. The
  **Teams tab** has a new **League Pos** column that tracks live position vs.
  predicted throughout the season regardless, so the group can watch it
  build even before it counts.
- If this formula reading turns out to not match what was actually agreed
  on the call, flag it — the delta/base split above was the most literal
  reading of "lose 4 points" but is easy to adjust in `positionBonus()`.

## 🗣️ Still Open / Discussion Draft (not yet wired into code)

Proposal circulated by ellwsn ahead of the 2026-08-10 call — not decided on
the call, so still not implemented:

| Result / Event                          | Points                        |
|------------------------------------------|--------------------------------|
| Clean sheet                               | +1 pt                         |
| Goals scored over 3 in a single game      | +1 pt per goal above 3 (e.g. a 5-goal game = +2) |

## 💡 Still Open

- `js/data.js` (`TEAM_DATA`) costs are currently the group's pre-call
  discussion-draft prices (ellwsn's swaps on Matt's list) — not confirmed as
  final.
- How often should the leaderboard refresh (the World Cup version polled
  matches.json every 30 minutes via GitHub Actions — this project already
  does the same, see `.github/workflows/update-matches.yml`)?
