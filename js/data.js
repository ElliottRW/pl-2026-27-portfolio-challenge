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

/** "1" → "1st", "5" → "5th", etc. */
function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

// ── SCORING RULES ─────────────────────────────────────────────────────────────
// FINAL — agreed on the 2026-08-10 rules call (+ follow-up confirming the
// clean sheet / goal bonuses). Full breakdown in SCORING.md:
//   Win            → WIN pts
//   Draw           → DRAW pts
//   Clean sheet    → CLEAN_SHEET pts per match conceding 0
//   Goal bonus     → 1 pt per goal scored above GOAL_BONUS_THRESHOLD in a
//                    single match (e.g. a 5-goal game = +2)
//   + final league-position bonus (see positionBonus() in scoring.js)
const SCORING = { WIN: 3, DRAW: 1, CLEAN_SHEET: 1, GOAL_BONUS_THRESHOLD: 3 };

// ── CLUB CATALOGUE ────────────────────────────────────────────────────────────
// cost             = draft credit value (budget is 100, pick 4 clubs)
// tier             = display grouping (1 = title contenders … 6 = promoted/underdogs)
// predictedPosition = the group's pre-season predicted finish (1-20), agreed
//                     alongside cost. Drives the final-league-position bonus
//                     in scoring.js — see SCORING.md.
//
// FINAL — the group's draft prices (ellwsn's swaps on top of Matt's list,
// circulated ahead of the 2026-08-10 rules call: Chelsea/Liverpool swapped,
// Villa/Man Utd swapped, Newcastle moved below Fulham, Sunderland moved
// above Everton) are confirmed as the final costs — see SCORING.md.
const TEAM_DATA = {
  // Tier 1 — Title Contenders
  'Arsenal':                 { cost: 43, tier: 1, predictedPosition:  1 },
  'Manchester City':         { cost: 41, tier: 1, predictedPosition:  2 },
  'Chelsea':                 { cost: 38, tier: 1, predictedPosition:  3 },
  'Liverpool':               { cost: 35, tier: 1, predictedPosition:  4 },
  // Tier 2 — European Hopefuls
  'Manchester United':       { cost: 33, tier: 2, predictedPosition:  5 },
  'Aston Villa':             { cost: 31, tier: 2, predictedPosition:  6 },
  'Tottenham Hotspur':       { cost: 29, tier: 2, predictedPosition:  7 },
  'Brighton & Hove Albion':  { cost: 27, tier: 2, predictedPosition:  8 },
  // Tier 3 — Upper Mid-table
  'Crystal Palace':          { cost: 25, tier: 3, predictedPosition:  9 },
  'AFC Bournemouth':         { cost: 23, tier: 3, predictedPosition: 10 },
  'Brentford':               { cost: 22, tier: 3, predictedPosition: 11 },
  // Tier 4 — Mid-table
  'Fulham':                  { cost: 20, tier: 4, predictedPosition: 12 },
  'Newcastle United':        { cost: 19, tier: 4, predictedPosition: 13 },
  'Sunderland':              { cost: 18, tier: 4, predictedPosition: 14 },
  // Tier 5 — Relegation Battle
  'Everton':                 { cost: 17, tier: 5, predictedPosition: 15 },
  'Leeds United':            { cost: 16, tier: 5, predictedPosition: 16 },
  'Nottingham Forest':       { cost: 15, tier: 5, predictedPosition: 17 },
  // Tier 6 — Promoted Underdogs
  'Ipswich Town':            { cost: 13, tier: 6, predictedPosition: 18 },
  'Coventry City':           { cost: 11, tier: 6, predictedPosition: 19 },
  'Hull City':               { cost:  9, tier: 6, predictedPosition: 20 },
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
