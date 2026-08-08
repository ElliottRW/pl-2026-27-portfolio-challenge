'use strict';

// ── SCORING CALCULATOR ────────────────────────────────────────────────────────

/**
 * Calculate a club's match record and total portfolio points from a list of
 * match objects (as produced by .github/workflows/update-matches.yml).
 *
 * Scoring rules (defined in SCORING in data.js) — PROVISIONAL:
 *   Win  → SCORING.WIN  pts
 *   Draw → SCORING.DRAW pts
 *   Loss → 0 pts
 *
 * No end-of-season position bonuses yet — add them here once the rules call
 * has settled on final scoring (see SCORING.md).
 */
function teamStats(displayName, matches) {
  const mine = matches.filter(m =>
    getDisplayName(m.homeTeam?.name) === displayName ||
    getDisplayName(m.awayTeam?.name) === displayName
  );

  let wins = 0, draws = 0, losses = 0;
  for (const m of mine) {
    if (m.status !== 'FINISHED' || !m.score?.winner) continue;
    const isHome = getDisplayName(m.homeTeam?.name) === displayName;
    if (m.score.winner === 'DRAW')                          draws++;
    else if ((m.score.winner === 'HOME_TEAM') === isHome)   wins++;
    else                                                    losses++;
  }

  const matchPts = wins * SCORING.WIN + draws * SCORING.DRAW;

  return { wins, draws, losses, matchPts, total: matchPts };
}

/** Points scored per credit spent — used to rank value-for-money picks. */
function ptsPerCredit(pts, credits) {
  return credits > 0 ? pts / credits : 0;
}
