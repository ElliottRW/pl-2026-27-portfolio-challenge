'use strict';

// ── TEAMS TAB ─────────────────────────────────────────────────────────────────

/** Renders the League Pos cell: live table position vs. predicted, with a bonus badge. */
function renderPositionCell(s, anyPlayed) {
  if (!anyPlayed || !s.position.actualPos) {
    return `<td style="text-align:center;color:var(--muted);font-size:0.8rem">—</td>`;
  }

  const { actualPos, predictedPos, delta, total } = s.position;
  const badgeClass = delta > 0 ? 'up' : delta < 0 ? 'down' : 'even';
  const badgeLabel = delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '=';
  const bonusNote  = s.seasonComplete
    ? `bonus ${total >= 0 ? '+' : ''}${total} pts`
    : 'bonus applies once the season finishes';
  const tooltip = `Predicted ${ordinal(predictedPos)} — ${bonusNote}`;

  return `<td style="text-align:center">
    <span style="font-weight:700">${ordinal(actualPos)}</span>
    <span class="pos-badge ${badgeClass}" title="${esc(tooltip)}">${badgeLabel}</span>
  </td>`;
}

function renderTeams() {
  const rows = [];
  const anyPlayed = !!(_matches && _matches.some(m => m.status === 'FINISHED'));

  for (let tier = 1; tier <= 6; tier++) {
    // Tier header row
    rows.push(`<tr class="tier-row"><td colspan="8">${TIER_LABELS[tier]}</td></tr>`);

    // Clubs within this tier, sorted highest cost first
    const teams = Object.entries(TEAM_DATA)
      .filter(([, d]) => d.tier === tier)
      .sort((a, b) => b[1].cost - a[1].cost);

    for (const [name, data] of teams) {
      const s = _matches
        ? teamStats(name, _matches)
        : { wins: 0, draws: 0, losses: 0, total: 0, bonusPts: 0, positionPts: 0, matchPts: 0, position: {}, seasonComplete: false };
      const ppc = ptsPerCredit(s.total, data.cost);
      const ptsTip = `Match ${s.matchPts} + bonus ${s.bonusPts} (${s.cleanSheets || 0} clean sheet${s.cleanSheets === 1 ? '' : 's'}, +${s.goalBonusPts || 0} goal bonus) + position ${s.positionPts}`;

      // Tooltip showing who picked this club
      const pickers = _participants ? _participants.filter(p => p.teams.includes(name)).map(p => p.name) : [];
      const teamLabel = pickers.length
        ? `<span class="has-tip" data-tip="${esc(pickers.join(', '))}">${esc(name)}</span>`
        : esc(name);

      rows.push(`<tr>
        <td style="font-weight:600;white-space:nowrap">${teamLabel}</td>
        <td><span class="cost-chip">${data.cost}</span></td>
        <td style="text-align:center">${s.wins}</td>
        <td style="text-align:center">${s.draws}</td>
        <td style="text-align:center">${s.losses}</td>
        ${renderPositionCell(s, anyPlayed)}
        <td><span class="pts-pill" title="${esc(ptsTip)}">${s.total}</span></td>
        <td style="text-align:center;color:var(--muted);font-size:0.8rem">${ppc > 0 ? ppc.toFixed(2) : '—'}</td>
      </tr>`);
    }
  }

  document.getElementById('teams-tbody').innerHTML = rows.join('');
}
