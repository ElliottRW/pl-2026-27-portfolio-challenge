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
// Costs are a provisional first pass based on pre-season odds — revisit once
// the group has agreed final rules.
const TEAM_DATA = {
  // Tier 1 — Title Contenders
  'Arsenal':                 { cost: 50, tier: 1 },
  'Manchester City':         { cost: 46, tier: 1 },
  'Liverpool':               { cost: 44, tier: 1 },
  'Manchester United':       { cost: 40, tier: 1 },
  // Tier 2 — Top Six Hopefuls
  'Chelsea':                 { cost: 36, tier: 2 },
  'Newcastle United':        { cost: 32, tier: 2 },
  'Aston Villa':             { cost: 28, tier: 2 },
  'Tottenham Hotspur':       { cost: 26, tier: 2 },
  // Tier 3 — Upper Mid-table
  'Nottingham Forest':       { cost: 22, tier: 3 },
  'Brighton & Hove Albion':  { cost: 20, tier: 3 },
  'AFC Bournemouth':         { cost: 18, tier: 3 },
  'Crystal Palace':          { cost: 17, tier: 3 },
  // Tier 4 — Mid-table
  'Fulham':                  { cost: 15, tier: 4 },
  'Everton':                 { cost: 14, tier: 4 },
  'Brentford':                { cost: 13, tier: 4 },
  'Leeds United':            { cost: 12, tier: 4 },
  // Tier 5 — Relegation Battle
  'Sunderland':              { cost: 10, tier: 5 },
  'Coventry City':           { cost:  8, tier: 5 },
  // Tier 6 — Promoted Underdogs
  'Ipswich Town':            { cost:  6, tier: 6 },
  'Hull City':               { cost:  4, tier: 6 },
};

// ── TIER LABELS ───────────────────────────────────────────────────────────────
const TIER_LABELS = {
  1: 'Tier 1 — Title Contenders',
  2: 'Tier 2 — Top Six Hopefuls',
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
