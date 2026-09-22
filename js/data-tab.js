'use strict';

// ── DATA TAB ──────────────────────────────────────────────────────────────────
// Ported/adapted from the World Cup 2026 portfolio challenge's data-tab.js.
// Dropped: Points Gap, Remaining Potential, Podium Scenarios, What's at Stake,
// Eliminated — all tied to a knockout tournament nearing its end, which makes
// no sense a few gameweeks into a 38-game league season. Also dropped the
// Active/Eliminated status pills throughout, since no club is ever
// "eliminated" mid-Premier-League-season the way a World Cup team is knocked
// out. Added: Bonus Points, which doesn't exist in the World Cup version
// (different scoring model there).

function renderDataTab() {
  renderBestManager();
  renderBestIndividualPick();
  renderHindsightBest();
  renderBonusPoints();
  renderCivilWar();
  renderSharedPicks();
  renderMatchdayHistory();
}

// ── BEST MANAGER (participant pts-per-credit) ─────────────────────────────────

function renderBestManager() {
  const el = document.getElementById('data-best-manager');
  if (!el) return;

  const participants = _participants || [];
  if (!participants.length) {
    el.innerHTML = `<div class="empty-state"><span class="icon">📊</span>No entries yet.</div>`;
    return;
  }

  const rows = participants
    .map(p => {
      const credits = creditsUsed(p);
      const total   = _matches ? p.teams.reduce((s, t) => s + teamStats(t, _matches).total, 0) : 0;
      const ppcRaw  = credits ? total / credits : 0;
      return { ...p, credits, total, ppc: ptsPerCredit(total, credits), ppcRaw };
    })
    .sort((a, b) => b.ppcRaw - a.ppcRaw || b.total - a.total || a.name.localeCompare(b.name));

  const maxPpc = rows[0]?.ppc || 1;
  const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  const tableRows = rows.map((p, i) => {
    const rank  = i + 1;
    const medal = MEDALS[rank] ?? rank;
    const bar   = maxPpc ? Math.round((p.ppc / maxPpc) * 100) : 0;
    return `<tr>
      <td><span class="rank-num${rank <= 3 ? ` r${rank}` : ''}">${medal}</span></td>
      <td style="font-weight:700;white-space:nowrap">${nameWithTip(p)}</td>
      <td style="text-align:center;color:var(--muted)">${p.credits}</td>
      <td style="text-align:center">${p.total}</td>
      <td>
        <div class="ppc-cell">
          <div class="ppc-bar-wrap"><div class="ppc-bar" style="width:${bar}%"></div></div>
          <span class="ppc-val">${p.ppc.toFixed(2)}</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Rank</th><th>Name</th><th title="Credits spent">Credits</th>
        <th>Total Pts</th><th>Pts / Credit</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>`;
}

// ── BEST INDIVIDUAL PICK (club pts-per-credit, picked clubs only) ────────────

function renderBestIndividualPick() {
  const el = document.getElementById('data-best-individual-pick');
  if (!el) return;

  const picks       = teamPickCounts(_participants || []);
  const pickedTeams = [...picks.keys()];

  if (!pickedTeams.length) {
    el.innerHTML = `<div class="empty-state"><span class="icon">📊</span>No picks yet.</div>`;
    return;
  }

  const rows = pickedTeams
    .map(team => {
      const cost   = TEAM_DATA[team]?.cost ?? 0;
      const pts    = _matches ? teamStats(team, _matches).total : 0;
      const ppcRaw = cost ? pts / cost : 0;
      return { team, cost, pts, ppc: ptsPerCredit(pts, cost), ppcRaw, pickCount: picks.get(team) ?? 0 };
    })
    .sort((a, b) => b.ppcRaw - a.ppcRaw || b.pts - a.pts || a.team.localeCompare(b.team));

  const maxPpc = rows[0]?.ppc || 1;

  const tableRows = rows.map(r => {
    const bar = maxPpc ? Math.round((r.ppc / maxPpc) * 100) : 0;
    return `<tr>
      <td style="font-weight:600;white-space:nowrap">${esc(r.team)}</td>
      <td style="text-align:center"><span class="cost-chip">${r.cost}</span></td>
      <td style="text-align:center">${r.pts}</td>
      <td>
        <div class="ppc-cell">
          <div class="ppc-bar-wrap"><div class="ppc-bar" style="width:${bar}%"></div></div>
          <span class="ppc-val">${r.ppc.toFixed(2)}</span>
        </div>
      </td>
      <td style="text-align:center">${r.pickCount}×</td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <table>
      <thead><tr>
        <th>Club</th><th>Cost</th><th>Points</th><th>Pts / Credit</th>
        <th title="Times picked">Picks</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>`;
}

// ── HINDSIGHT BEST ENTRY ──────────────────────────────────────────────────────

function renderHindsightBest() {
  const el = document.getElementById('data-hindsight');
  if (!el) return;

  if (!_matches?.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:0.85rem">No data yet.</p>';
    return;
  }

  const { entries, score } = bestHindsightEntry(_matches);
  if (!entries.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:0.85rem">No data yet.</p>';
    return;
  }

  const leaderScore = (_participants || [])
    .map(p => p.teams.reduce((s, t) => s + teamStats(t, _matches).total, 0))
    .reduce((max, s) => Math.max(max, s), 0);

  const diff     = score - leaderScore;
  const vsLeader = leaderScore > 0
    ? `vs actual leader's <strong>${leaderScore} pts</strong> — ${diff > 0 ? `<span style="color:var(--green)">+${diff} ahead</span>` : diff === 0 ? 'exactly matched' : `<span style="color:var(--muted)">${diff} behind</span>`}`
    : '';

  const sorted = entries.slice().sort((a, b) => a.cost - b.cost);

  const buildTeamRows = ({ teams, cost }) => teams
    .slice()
    .sort((a, b) => teamStats(b, _matches).total - teamStats(a, _matches).total)
    .map(t => {
      const pts = teamStats(t, _matches).total;
      return `<div class="hindsight-row">
        <span class="hindsight-team">${esc(t)}</span>
        <span class="cost-chip">${TEAM_DATA[t].cost}</span>
        <span class="hindsight-pts">${pts} pts</span>
      </div>`;
    }).join('') + `<div class="hindsight-footer">
      <span>Budget: <strong>${cost} / 100 credits</strong></span>
      <span class="hindsight-total">${score} pts</span>
    </div>`;

  const buildOption = (entry, idx) =>
    `<div class="hindsight-option">
      ${idx > 0 ? '<hr class="hindsight-divider">' : ''}
      ${sorted.length > 1 ? `<div class="hindsight-option-label">Option ${idx + 1} · ${entry.cost} credits</div>` : ''}
      <div class="hindsight-teams">${buildTeamRows(entry)}</div>
    </div>`;

  let html;
  if (sorted.length === 1) {
    html = buildOption(sorted[0], 0);
  } else {
    const rest = sorted.slice(1).map((entry, i) => buildOption(entry, i + 1)).join('');
    html = `
      ${buildOption(sorted[0], 0)}
      <button class="hindsight-toggle" id="hindsight-toggle">
        <span>Show ${sorted.length - 1} more tied option${sorted.length - 1 > 1 ? 's' : ''}</span>
        <span class="chevron">▾</span>
      </button>
      <div class="hindsight-dropdown" id="hindsight-dropdown">${rest}</div>`;
  }

  el.innerHTML = `${html}${vsLeader ? `<p class="rules-note" style="margin-top:0.75rem">${vsLeader}</p>` : ''}`;

  const toggle = el.querySelector('#hindsight-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const drop   = el.querySelector('#hindsight-dropdown');
      const isOpen = drop.classList.toggle('open');
      toggle.querySelector('.chevron').textContent = isOpen ? '▴' : '▾';
    });
  }
}

// ── BONUS POINTS ──────────────────────────────────────────────────────────────

function renderBonusPoints() {
  const el = document.getElementById('data-bonus-points');
  if (!el) return;

  if (!_matches?.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:0.85rem">No data yet.</p>';
    return;
  }

  const rows = Object.keys(TEAM_DATA)
    .map(team => ({ team, ...teamBonusBreakdown(team, _matches) }))
    .sort((a, b) => b.bonusPts - a.bonusPts || b.cleanSheets - a.cleanSheets || a.team.localeCompare(b.team));

  const totalCleanSheets = rows.reduce((s, r) => s + r.cleanSheets, 0);
  const totalBigWins     = rows.reduce((s, r) => s + r.bigWinGames, 0);
  const totalBonusPts    = rows.reduce((s, r) => s + r.bonusPts, 0);

  const summary = `
    <div class="stats-grid" style="margin-bottom:1.25rem">
      <div class="stat-card"><div class="val">${totalCleanSheets}</div><div class="lbl">Clean Sheets</div></div>
      <div class="stat-card"><div class="val">${totalBigWins}</div><div class="lbl">Games with 4+ Goals</div></div>
      <div class="stat-card"><div class="val">${totalBonusPts}</div><div class="lbl">Total Bonus Pts</div></div>
    </div>`;

  const earners = rows.filter(r => r.bonusPts > 0);
  if (!earners.length) {
    el.innerHTML = summary + `<p style="color:var(--muted);font-size:0.85rem">No bonus points earned yet.</p>`;
    return;
  }

  const tableRows = earners.map(r => `<tr>
    <td style="font-weight:600;white-space:nowrap">${esc(r.team)}</td>
    <td style="text-align:center">${r.cleanSheets}</td>
    <td style="text-align:center">${r.bigWinGames}</td>
    <td><span class="pts-pill">${r.bonusPts}</span></td>
  </tr>`).join('');

  el.innerHTML = summary + `
    <table>
      <thead><tr>
        <th>Club</th><th title="Matches conceding 0">Clean Sheets</th>
        <th title="Matches scoring 4 or more goals">Big Wins</th><th>Bonus Pts</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>`;
}

// ── CIVIL WAR ─────────────────────────────────────────────────────────────────
// Fixtures where one participant holds both clubs playing each other —
// grouped by gameweek (World Cup version grouped by tournament stage instead).

function renderCivilWar() {
  const el = document.getElementById('data-civil-war');
  if (!el) return;

  const ps = _participants || [];
  const byGw = {};

  for (const m of _matches || []) {
    const home = getDisplayName(m.homeTeam?.name);
    const away = getDisplayName(m.awayTeam?.name);
    if (!home || !away) continue;
    for (const p of ps) {
      if (!p.teams.includes(home) || !p.teams.includes(away)) continue;
      const date = new Date(m.utcDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      let result;
      if (m.status === 'FINISHED' && m.score?.winner) {
        const hg     = m.score.fullTime?.home ?? '?';
        const ag     = m.score.fullTime?.away ?? '?';
        const winner = m.score.winner === 'HOME_TEAM' ? home : m.score.winner === 'AWAY_TEAM' ? away : null;
        result = winner ? `${hg}–${ag} · <strong>${esc(winner)}</strong> won` : `${hg}–${ag} · Draw`;
      } else if (m.status === 'IN_PLAY' || m.status === 'PAUSED') {
        result = '🔴 LIVE';
      } else {
        result = `upcoming · ${date}`;
      }
      const gw = m.matchday ?? 0;
      (byGw[gw] = byGw[gw] || []).push({ p, home, away, result, utcDate: m.utcDate, status: m.status });
    }
  }

  const gws = Object.keys(byGw).map(Number).sort((a, b) => b - a); // most recent first

  if (!gws.length) {
    el.innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No civil war fixtures — nobody holds both sides of the same match.</p>`;
    return;
  }

  // Every gameweek's fixtures are scheduled from day one (unlike a knockout
  // bracket, where only the current stage's fixtures are known), so "first
  // non-finished gameweek in descending order" would just always be GW38.
  // Reuse the Matches tab's actual "closest to now" logic instead.
  const activeGw = getActiveGameweek(byGw, gws);

  const sections = gws.map(gw => {
    const rows   = byGw[gw].slice().sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
    const isOpen = gw === activeGw;
    const count  = rows.length;

    const rowsHtml = rows.map(r => `
      <div class="civil-war-row">
        <div class="civil-war-participant">${nameWithTip(r.p)}</div>
        <div class="civil-war-fixture">
          <span class="civil-war-teams">${esc(r.home)} <span class="vs">vs</span> ${esc(r.away)}</span>
          <span class="civil-war-stage">${r.result}</span>
        </div>
      </div>`).join('');

    return `<div class="match-section">
      <button class="match-section-toggle${isOpen ? ' open' : ''}">
        <span>Gameweek ${gw} <span style="font-weight:400;color:var(--muted)">(${count})</span></span>
        <span class="chevron">▾</span>
      </button>
      <div class="match-section-body${isOpen ? ' open' : ''}">${rowsHtml}</div>
    </div>`;
  }).join('');

  el.innerHTML = sections;

  el.querySelectorAll('.match-section-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const open = btn.classList.toggle('open');
      btn.nextElementSibling.classList.toggle('open', open);
    });
  });
}

// ── SHARED PICKS ──────────────────────────────────────────────────────────────

function renderSharedPicks() {
  const el = document.getElementById('data-shared-picks');
  if (!el) return;

  const counts = teamPickCounts(_participants || []);
  const shared = [...counts.entries()].filter(([, n]) => n > 1);

  if (!shared.length) {
    el.innerHTML = `<p style="color:var(--muted);font-size:0.85rem;padding:0.5rem 0">No clubs are shared between participants yet.</p>`;
    return;
  }

  el.innerHTML = shared.map(([team, count]) => {
    const pts     = _matches ? teamStats(team, _matches).total : 0;
    const pickers = (_participants || []).filter(p => p.teams.includes(team)).map(p => nameWithTip(p)).join(', ');
    return `<div class="shared-team-card">
      <div class="shared-team-name">${esc(team)} <span style="color:var(--muted);font-weight:400">×${count}</span></div>
      <div class="shared-team-meta">Picked by <strong>${pickers}</strong></div>
      <div class="shared-team-stats"><span class="pts-pill">${pts} pts</span></div>
    </div>`;
  }).join('');
}

// ── MATCHDAY ──────────────────────────────────────────────────────────────────
// Per-gameweek leaderboard: match + clean-sheet + goal-bonus points only (no
// position bonus, which is a season-total concept).

function renderMatchdayHistory() {
  const el = document.getElementById('data-matchday');
  if (!el) return;

  const gws = allGameweeksPlayed(_matches || []);
  if (!gws.length) {
    el.innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No matches played yet.</p>`;
    return;
  }

  const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  const sections = gws.map((gw, idx) => {
    const scored  = scoreParticipantsInGameweek(_participants || [], _matches, gw);
    const isOpen  = idx === 0; // most recent open by default
    const scorers = scored.filter(p => p.total > 0);

    const rows = scorers.map((p, i) => {
      const rank  = i + 1;
      const medal = MEDALS[rank] ?? rank;
      const pills = p.teams
        .filter(t => p.breakdown[t] > 0)
        .sort((a, b) => a.localeCompare(b))
        .map(t => `<span class="team-pill">${esc(t)}<span class="pts-chip">+${p.breakdown[t]}</span></span>`)
        .join('');
      return `<tr>
        <td><span class="rank-num${rank <= 3 ? ` r${rank}` : ''}">${medal}</span></td>
        <td style="font-weight:700;white-space:nowrap">${nameWithTip(p)}</td>
        <td>${pills}</td>
        <td class="total-score">${p.total}</td>
      </tr>`;
    }).join('');

    return `<div class="match-section">
      <button class="match-section-toggle${isOpen ? ' open' : ''}">
        <span>Gameweek ${gw}</span>
        <span class="chevron">▾</span>
      </button>
      <div class="match-section-body${isOpen ? ' open' : ''}">
        <table style="margin-top:0.25rem">
          <thead><tr><th>Rank</th><th>Name</th><th>Scoring Clubs</th><th style="text-align:right">Pts</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = sections;

  el.querySelectorAll('.match-section-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const open = btn.classList.toggle('open');
      btn.nextElementSibling.classList.toggle('open', open);
    });
  });
}
