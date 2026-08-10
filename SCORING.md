# ⚽ Premier League 2026/27 Portfolio Challenge — Scoring Rules

> **Status: FINAL.** All rules agreed on the 2026-08-10 rules call (plus a
> same-day follow-up confirming clean sheet/goal bonuses, club prices, and
> refresh cadence) are live in code.

## 📋 Match Results

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

## 🎯 Bonus Points

| Result / Event                          | Points                        |
|------------------------------------------|--------------------------------|
| Clean sheet                               | +1 pt per match conceding 0 (win or draw) |
| Goals scored over 3 in a single game      | +1 pt per goal above 3 (e.g. a 5-goal game = +2) |

Both computed per match in `teamStats()` in `js/scoring.js`
(`SCORING.CLEAN_SHEET`, `SCORING.GOAL_BONUS_THRESHOLD`).

## 🏁 Final League Position Bonus

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
  **Teams tab** has a **League Pos** column that tracks live position vs.
  predicted throughout the season regardless, so the group can watch it
  build even before it counts.
- If this formula reading turns out to not match what was actually agreed
  on the call, flag it — the delta/base split above was the most literal
  reading of "lose 4 points" but is easy to adjust in `positionBonus()`.

## 💰 Club Prices

`js/data.js` (`TEAM_DATA`) costs are the group's final draft prices
(ellwsn's swaps on top of Matt's list: Chelsea/Liverpool swapped,
Villa/Man Utd swapped, Newcastle moved below Fulham, Sunderland moved above
Everton). Confirmed final — not the earlier supercomputer-model pricing.

## 🔄 Refresh Cadence

Confirmed: every 30 minutes, matching the World Cup version. Already
implemented via `.github/workflows/update-matches.yml`, which polls ESPN and
commits `matches.json` on a `*/30 * * * *` cron schedule; the front end
re-fetches on the same interval (`js/app.js`).
