'use strict';

// ── UTILITIES ─────────────────────────────────────────────────────────────────

/** HTML-escape a value for safe insertion into markup. */
const esc = s => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * Render a participant's display name, wrapped in a tooltip span when an
 * email username is available — helps disambiguate abbreviated or duplicate names.
 * e.g. "John S" → hovers to show "John.Stephenson"
 */
function nameWithTip(p) {
  if (!p.emailUser) return esc(p.name);
  return `<span class="has-tip" data-tip="${esc(p.emailUser)}">${esc(p.name)}</span>`;
}

/** Human-readable "time ago" string from a timestamp. */
function timeAgo(ts) {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── SCORING RULES ─────────────────────────────────────────────────────────────
// PROVISIONAL — standard football points (Win 3 / Draw 1 / Loss 0), summed
// across the full 38-game season. Placeholder pending the rules call — see
// SCORING.md for notes on what's still to be decided (position bonuses etc).
const SCORING = { WIN: 3, DRAW: 1 };

// ── CLUB CATALOGUE ────────────────────────────────────────────────────────────
// cost  = draft credit value (budget is 100, pick 4 clubs)
// tier  = display grouping (1 = title contenders … 6 = promoted/underdogs)
//
// Costs are derived from Compare.bet's supercomputer-predicted 2026/27 final
// table (published via GiveMeSport, 10,000-simulation Elo/market model):
// https://www.givemesport.com/supercomputer-predicts-2026-27-premier-league-table/
//
// Predicted points are mapped onto cost through a convex curve —
// cost = 3 + 52 * ((pts - 19) / (88 - 19)) ^ 1.8 — rather than a straight
// linear scale. A linear mapping still lets the four best-predicted clubs
// (Arsenal/City/Liverpool/Chelsea) be "the" obvious pick every time; the
// convexity pushes their combined cost to ~177 (vs. a 100 budget for 4
// clubs), so stacking multiple elites is deliberately unaffordable and
// entries have to trade quality for value instead of all converging on the
// same top-4 portfolio. Re-run this if the group agrees final rules that
// change scoring (e.g. position bonuses) enough to warrant re-pricing.
const TEAM_DATA = {
  // Tier 1 — Title Contenders (predicted 1st–4th)
  'Arsenal':                 { cost: 55, tier: 1 },
  'Manchester City':         { cost: 51, tier: 1 },
  'Liverpool':               { cost: 38, tier: 1 },
  'Chelsea':                 { cost: 33, tier: 1 },
  // Tier 2 — European Hopefuls (predicted 5th–8th)
  'Aston Villa':             { cost: 30, tier: 2 },
  'Manchester United':       { cost: 26, tier: 2 },
  'Newcastle United':        { cost: 23, tier: 2 },
  'Tottenham Hotspur':       { cost: 21, tier: 2 },
  // Tier 3 — Upper Mid-table (predicted 9th–11th)
  'Brighton & Hove Albion':  { cost: 18, tier: 3 },
  'Crystal Palace':          { cost: 16, tier: 3 },
  'AFC Bournemouth':         { cost: 15, tier: 3 },
  // Tier 4 — Mid-table (predicted 12th–14th)
  'Brentford':               { cost: 13, tier: 4 },
  'Fulham':                  { cost: 12, tier: 4 },
  'Everton':                 { cost: 11, tier: 4 },
  // Tier 5 — Relegation Battle (predicted 15th–17th)
  'Leeds United':            { cost:  9, tier: 5 },
  'Nottingham Forest':       { cost:  8, tier: 5 },
  'Sunderland':              { cost:  7, tier: 5 },
  // Tier 6 — Promoted Underdogs (predicted 18th–20th)
  'Ipswich Town':            { cost:  6, tier: 6 },
  'Coventry City':           { cost:  4, tier: 6 },
  'Hull City':               { cost:  3, tier: 6 },
};

// ── TIER LABELS ───────────────────────────────────────────────────────────────
const TIER_LABELS = {
  1: 'Tier 1 — Title Contenders',
  2: 'Tier 2 — European Hopefuls',
  3: 'Tier 3 — Upper Mid-table',
  4: 'Tier 4 — Mid-table',
  5: 'Tier 5 — Relegation Battle',
  6: 'Tier 6 — Promoted Underdogs',
};

// ── API NAME NORMALISATIONS ───────────────────────────────────────────────────
// Maps names returned by the API to the canonical names used in TEAM_DATA.
const API_NAME_MAP = {
  'Man City':          'Manchester City',
  'Man Utd':           'Manchester United',
  'Man United':        'Manchester United',
  'Spurs':             'Tottenham Hotspur',
  'Tottenham':         'Tottenham Hotspur',
  'Brighton':          'Brighton & Hove Albion',
  'Bournemouth':       'AFC Bournemouth',
  "Nott'm Forest":     'Nottingham Forest',
  'Newcastle':         'Newcastle United',
  'Leeds':             'Leeds United',
  'Wolves':            'Wolverhampton Wanderers',
};

/**
 * Map an API team name to the canonical display name used in TEAM_DATA.
 * Falls back to the raw value if no match is found.
 */
function getDisplayName(name) {
  if (!name) return null;
  if (API_NAME_MAP[name]) return API_NAME_MAP[name];
  if (TEAM_DATA[name])    return name;
  const lower = name.toLowerCase();
  for (const key of Object.keys(TEAM_DATA)) {
    if (key.toLowerCase() === lower) return key;
  }
  return name;
}

/**
 * Resolve a raw string (e.g. from a CSV or form submission) to the canonical
 * club name in TEAM_DATA. Returns null if no match found.
 */
function findTeam(raw) {
  const s = raw.trim();
  if (TEAM_DATA[s])    return s;
  if (API_NAME_MAP[s]) return API_NAME_MAP[s];
  const lower = s.toLowerCase();
  for (const key of Object.keys(TEAM_DATA)) {
    if (key.toLowerCase() === lower) return key;
  }
  return null;
}
