# ⚽ Premier League 2026/27 Portfolio Challenge — Scoring Rules

> **Status: PROVISIONAL.** Final rules are being agreed on a call — update this
> file (and `js/rules.js`, `js/data.js` `SCORING`) once they're settled.

## 📋 Current Placeholder (live in code)

| Result | Points |
|--------|--------|
| Win    | +3 pts |
| Draw   | +1 pt  |
| Loss   |  0 pts |

Each club plays 38 league matches across the season.

- **4 clubs per entry** with a budget of **100 credits.**
- Points from all 4 clubs are added together for your total score.

## 🗣️ Discussion Draft (not yet wired into code)

Proposal circulated by ellwsn ahead of the 2026-08-10 rules call, on top of
the win/draw/loss placeholder above:

| Result / Event                          | Points                        |
|------------------------------------------|--------------------------------|
| Clean sheet                               | +1 pt                         |
| Goals scored over 3 in a single game      | +1 pt per goal above 3 (e.g. a 5-goal game = +2) |

Deliberately **not implemented in `js/scoring.js` yet** — holding off until
the call confirms these. Update `js/scoring.js` and this table together once
they're settled.

## 💡 Open Questions For the Rules Call

- Should there be bonus points for final league position — e.g. 1st place
  worth 20 pts down to 20th worth 1 pt — mirroring the World Cup version's
  "progression" bonuses? (Raised in the same pre-call discussion, still
  unresolved.)
- Cup competitions (FA Cup, League Cup, Europe) in scope, or Premier League
  matches only?
- `js/data.js` (`TEAM_DATA`) costs are currently the group's pre-call
  discussion-draft prices (ellwsn's swaps on Matt's list) — confirm or
  revise at the call.
- How often should the leaderboard refresh (the World Cup version polled
  matches.json every 30 minutes via GitHub Actions)?
