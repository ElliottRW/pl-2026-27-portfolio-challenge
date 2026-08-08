# ⚽ Premier League 2026/27 Portfolio Challenge — Scoring Rules

> **Status: PROVISIONAL.** Final rules are being agreed on a call — update this
> file (and `js/rules.js`, `js/data.js` `SCORING`) once they're settled.

## 📋 Current Placeholder

| Result | Points |
|--------|--------|
| Win    | +3 pts |
| Draw   | +1 pt  |
| Loss   |  0 pts |

Each club plays 38 league matches across the season.

- **4 clubs per entry** with a budget of **100 credits.**
- Points from all 4 clubs are added together for your total score.

## 💡 Open Questions For the Rules Call

- Should there be bonus points for final league position (e.g. top 4, top 6,
  avoiding relegation) — mirroring the World Cup version's "progression"
  bonuses?
- Cup competitions (FA Cup, League Cup, Europe) in scope, or Premier League
  matches only?
- Should costs/tiers in `js/data.js` (`TEAM_DATA`) be revisited once the
  group has picked entries, or fixed before the draft closes?
- How often should the leaderboard refresh (the World Cup version polled
  matches.json every 30 minutes via GitHub Actions)?
