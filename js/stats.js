'use strict';

// ── DATA TAB — PURE CALCULATION HELPERS ─────────────────────────────────────
// Ported from the World Cup 2026 portfolio challenge's stats.js, adapted for
// a league season: no elimination/stage concept, gameweeks instead of
// calendar match-days, and clean-sheet/goal bonuses instead of progression
// bonuses.

/** Total draft credits spent by a participant. */
function creditsUsed(participant) {
  return participant.teams.reduce((sum, team) => sum + (TEAM_DATA[team]?.cost ?? 0), 0);
}

/**
 * Returns a Map of teamName → pickCount across all participant entries,
 * sorted descending by pick count.
 */
function teamPickCounts(participants) {
  const counts = new Map();
  for (const p of participants) {
    for (const team of p.teams) {
      counts.set(team, (counts.get(team) ?? 0) + 1);
    }
  }
  return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
}

// ── GAMEWEEK SCORING (subset) ────────────────────────────────────────────────
// Match + clean-sheet + goal-bonus points within a single gameweek. Excludes
// the final-league-position bonus, which is a season-total concept and can't
// be attributed to one gameweek.

function gameweekPts(team, matches, gw) {
  const mine = matches.filter(m =>
    m.matchday === gw &&
    (getDisplayName(m.homeTeam?.name) === team || getDisplayName(m.awayTeam?.name) === team)
  );

  let wins = 0, draws = 0, cleanSheets = 0, goalBonusPts = 0;
  for (const m of mine) {
    if (m.status !== 'FINISHED' || !m.score?.winner) continue;
    const isHome = getDisplayName(m.homeTeam?.name) === team;
    if (m.score.winner === 'DRAW')                        draws++;
    else if ((m.score.winner === 'HOME_TEAM') === isHome) wins++;

    const goalsFor     = isHome ? m.score.fullTime?.home : m.score.fullTime?.away;
    const goalsAgainst = isHome ? m.score.fullTime?.away : m.score.fullTime?.home;
    if (goalsAgainst === 0) cleanSheets++;
    if (goalsFor > SCORING.GOAL_BONUS_THRESHOLD) goalBonusPts += goalsFor - SCORING.GOAL_BONUS_THRESHOLD;
  }

  return wins * SCORING.WIN + draws * SCORING.DRAW + cleanSheets * SCORING.CLEAN_SHEET + goalBonusPts;
}

/** Score all participants against a single gameweek. Returns array sorted highest → lowest. */
function scoreParticipantsInGameweek(participants, matches, gw) {
  return participants
    .map(p => {
      let total = 0;
      const breakdown = {};
      for (const team of p.teams) {
        const pts = gameweekPts(team, matches, gw);
        breakdown[team] = pts;
        total += pts;
      }
      return { ...p, total, breakdown };
    })
    .sort((a, b) => b.total - a.total);
}

/** Gameweek numbers with at least one finished match, most recent first. */
function allGameweeksPlayed(matches) {
  const set = new Set(
    matches.filter(m => m.status === 'FINISHED' && m.matchday != null).map(m => m.matchday)
  );
  return [...set].sort((a, b) => b - a);
}

// ── BONUS POINTS BREAKDOWN ────────────────────────────────────────────────────

/** A club's clean sheets, 4+-goal games, and resulting bonus points, season-to-date. */
function teamBonusBreakdown(team, matches) {
  const mine = matches.filter(m =>
    m.status === 'FINISHED' && m.score?.winner &&
    (getDisplayName(m.homeTeam?.name) === team || getDisplayName(m.awayTeam?.name) === team)
  );

  let cleanSheets = 0, bigWinGames = 0, goalBonusPts = 0;
  for (const m of mine) {
    const isHome = getDisplayName(m.homeTeam?.name) === team;
    const goalsFor     = isHome ? m.score.fullTime?.home : m.score.fullTime?.away;
    const goalsAgainst = isHome ? m.score.fullTime?.away : m.score.fullTime?.home;
    if (goalsAgainst === 0) cleanSheets++;
    if (goalsFor >= 4)      bigWinGames++;
    if (goalsFor > SCORING.GOAL_BONUS_THRESHOLD) goalBonusPts += goalsFor - SCORING.GOAL_BONUS_THRESHOLD;
  }

  return { cleanSheets, bigWinGames, goalBonusPts, bonusPts: cleanSheets * SCORING.CLEAN_SHEET + goalBonusPts };
}

// ── HINDSIGHT BEST ENTRY ──────────────────────────────────────────────────────

/**
 * Brute-force search for all tied best 4-club entries within 100 credits,
 * based on points scored so far. C(20,4) = 4,845 combinations — trivial.
 * Returns { entries: [{teams, cost}], score }.
 */
function bestHindsightEntry(matches) {
  const names  = Object.keys(TEAM_DATA);
  const n      = names.length;
  const scores = names.map(t => teamStats(t, matches).total);
  const costs  = names.map(t => TEAM_DATA[t].cost);

  let bestScore = -1, entries = [];

  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      const cij = costs[i] + costs[j];
      if (cij > 100) continue;
      const sij = scores[i] + scores[j];
      for (let k = j + 1; k < n - 1; k++) {
        const cijk = cij + costs[k];
        if (cijk > 100) continue;
        const sijk = sij + scores[k];
        for (let l = k + 1; l < n; l++) {
          const c4 = cijk + costs[l];
          if (c4 > 100) continue;
          const s4 = sijk + scores[l];
          if (s4 > bestScore) {
            bestScore = s4;
            entries   = [{ teams: [names[i], names[j], names[k], names[l]], cost: c4 }];
          } else if (s4 === bestScore) {
            entries.push({ teams: [names[i], names[j], names[k], names[l]], cost: c4 });
          }
        }
      }
    }
  }

  return { entries, score: bestScore };
}
