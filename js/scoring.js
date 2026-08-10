'use strict';

// ── LEAGUE STANDINGS ─────────────────────────────────────────────────────────
// Real Premier League table (not the portfolio's win/draw/loss weighting —
// SCORING may one day diverge from classic football scoring, but the table
// itself never does). Only FINISHED matches count. Premier League fixtures
// only — matches.json is sourced from ESPN's `eng.1` competition feed, so
// cup games never appear here; the group agreed cups are out of scope.
//
// Tie-break: points → goal difference → goals for → name (alphabetical,
// as a simplified stand-in for head-to-head once real tiebreaks matter).

let _standingsCache = { matches: null, table: null };

function computeStandings(matches) {
  const table = {};
  for (const name of Object.keys(TEAM_DATA)) {
    table[name] = { name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
  }

  for (const m of matches) {
    if (m.status !== 'FINISHED' || !m.score?.winner) continue;
    const home = getDisplayName(m.homeTeam?.name);
    const away = getDisplayName(m.awayTeam?.name);
    const hg = m.score.fullTime?.home;
    const ag = m.score.fullTime?.away;
    if (!table[home] || !table[away] || hg == null || ag == null) continue;

    table[home].played++; table[away].played++;
    table[home].gf += hg;  table[home].ga += ag;
    table[away].gf += ag;  table[away].ga += hg;

    if (m.score.winner === 'DRAW') {
      table[home].drawn++; table[home].pts += 1;
      table[away].drawn++; table[away].pts += 1;
    } else if (m.score.winner === 'HOME_TEAM') {
      table[home].won++;   table[home].pts += 3;
      table[away].lost++;
    } else {
      table[away].won++;   table[away].pts += 3;
      table[home].lost++;
    }
  }

  return Object.values(table)
    .map(t => ({ ...t, gd: t.gf - t.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
}

/** Standings for a given matches array, memoised on array identity. */
function getStandings(matches) {
  if (_standingsCache.matches !== matches) {
    _standingsCache = { matches, table: computeStandings(matches) };
  }
  return _standingsCache.table;
}

/**
 * True once every fixture in the season has been played. Requires the full
 * fixture count (each of the 20 clubs plays each other twice), not just
 * "everything in whatever array we got is FINISHED" — guards against the
 * position bonus firing early on a partial/truncated matches.json.
 */
function seasonComplete(matches) {
  const clubCount = Object.keys(TEAM_DATA).length;
  const expectedFixtures = clubCount * (clubCount - 1);
  return matches.length === expectedFixtures && matches.every(m => m.status === 'FINISHED');
}

/**
 * Final-league-position bonus, agreed on the 2026-08-10 rules call:
 *   - 1st place is worth 20 pts, 20th is worth 1 pt (basePts = 21 - position).
 *   - Blended with the pre-season predicted position: finishing better than
 *     predicted adds points, finishing worse subtracts them, 1 pt per place
 *     (delta = predictedPosition - actualPosition).
 *   e.g. Arsenal predicted 1st, finish 5th → basePts 16, delta -4 → 12 pts.
 * Only actually awarded once the season is over (seasonComplete) — see
 * SCORING.md for why it's a *final* position bonus, not a live one.
 */
function positionBonus(displayName, standings) {
  const actualPos    = standings.findIndex(t => t.name === displayName) + 1;
  const predictedPos = TEAM_DATA[displayName]?.predictedPosition ?? null;
  if (!actualPos || !predictedPos) {
    return { actualPos: actualPos || null, predictedPos, basePts: 0, delta: 0, total: 0 };
  }
  const basePts = 21 - actualPos;
  const delta   = predictedPos - actualPos;
  return { actualPos, predictedPos, basePts, delta, total: basePts + delta };
}

// ── SCORING CALCULATOR ────────────────────────────────────────────────────────

/**
 * Calculate a club's match record and total portfolio points from a list of
 * match objects (as produced by .github/workflows/update-matches.yml).
 *
 * Scoring rules (defined in SCORING in data.js):
 *   Win          → SCORING.WIN  pts
 *   Draw         → SCORING.DRAW pts
 *   Loss         → 0 pts
 *   Clean sheet  → SCORING.CLEAN_SHEET pts per match conceding 0 (win or draw)
 *   Goal bonus   → 1 pt per goal scored above SCORING.GOAL_BONUS_THRESHOLD in
 *                  a single match (e.g. a 5-goal game = +2)
 *   Final league position bonus → see positionBonus() above (only once
 *   seasonComplete).
 */
function teamStats(displayName, matches) {
  const mine = matches.filter(m =>
    getDisplayName(m.homeTeam?.name) === displayName ||
    getDisplayName(m.awayTeam?.name) === displayName
  );

  let wins = 0, draws = 0, losses = 0, cleanSheets = 0, goalBonusPts = 0;
  for (const m of mine) {
    if (m.status !== 'FINISHED' || !m.score?.winner) continue;
    const isHome = getDisplayName(m.homeTeam?.name) === displayName;
    if (m.score.winner === 'DRAW')                          draws++;
    else if ((m.score.winner === 'HOME_TEAM') === isHome)   wins++;
    else                                                    losses++;

    const goalsFor     = isHome ? m.score.fullTime?.home : m.score.fullTime?.away;
    const goalsAgainst = isHome ? m.score.fullTime?.away : m.score.fullTime?.home;
    if (goalsAgainst === 0) cleanSheets++;
    if (goalsFor > SCORING.GOAL_BONUS_THRESHOLD) goalBonusPts += goalsFor - SCORING.GOAL_BONUS_THRESHOLD;
  }

  const matchPts = wins * SCORING.WIN + draws * SCORING.DRAW;
  const bonusPts = cleanSheets * SCORING.CLEAN_SHEET + goalBonusPts;

  const standings = getStandings(matches);
  const position   = positionBonus(displayName, standings);
  const complete   = seasonComplete(matches);
  const positionPts = complete ? position.total : 0;

  return {
    wins, draws, losses, matchPts,
    cleanSheets, goalBonusPts, bonusPts,
    position, seasonComplete: complete, positionPts,
    total: matchPts + bonusPts + positionPts,
  };
}

/** Points scored per credit spent — used to rank value-for-money picks. */
function ptsPerCredit(pts, credits) {
  return credits > 0 ? pts / credits : 0;
}
