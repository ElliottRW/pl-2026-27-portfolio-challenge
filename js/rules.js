'use strict';

// ── RULES TAB ─────────────────────────────────────────────────────────────────

function renderRules() {
  const el = document.getElementById('tab-rules');
  if (!el) return;

  el.innerHTML = `
    <div class="card">
      <div class="card-title">📋 How It Works</div>
      <p style="font-size:0.85rem;color:var(--muted);margin-bottom:1.25rem">
        Each entry picks <strong>4 clubs</strong> with a budget of <strong>100 credits.</strong>
        Points from all 4 clubs are added together across the 2026/27 season.
      </p>

      <div class="banner banner-warn" style="margin-bottom:1.25rem">
        ⚠️ Match points, cup scope, and the final league-position bonus were
        agreed on the 2026-08-10 rules call and are live below. Clean
        sheet/goal bonuses and club prices are still being discussed — see
        <code>SCORING.md</code> in the repo for notes.
      </div>

      <div class="rules-section">
        <h3 class="rules-heading">Match Results</h3>
        <table class="rules-table">
          <thead><tr><th>Result</th><th>Points</th></tr></thead>
          <tbody>
            <tr><td>Win</td><td class="pts">+3 pts</td></tr>
            <tr><td>Draw</td><td class="pts">+1 pt</td></tr>
            <tr><td>Loss</td><td class="pts muted">0 pts</td></tr>
          </tbody>
        </table>
        <p class="rules-note">Standard football points, mirroring the real Premier League table. Each club plays 38 Premier League matches across the season — cup competitions (FA Cup, League Cup, Europe) don't count.</p>
      </div>

      <div class="rules-section">
        <h3 class="rules-heading">Final League Position Bonus</h3>
        <table class="rules-table">
          <thead><tr><th>Finish</th><th>Points</th></tr></thead>
          <tbody>
            <tr><td>1st</td><td class="pts">20 pts</td></tr>
            <tr><td>2nd</td><td class="pts">19 pts</td></tr>
            <tr><td>&hellip;</td><td class="pts muted">&hellip;</td></tr>
            <tr><td>20th</td><td class="pts">1 pt</td></tr>
          </tbody>
        </table>
        <p class="rules-note">
          Blended with each club's pre-season predicted position (see the Teams tab): finish
          <strong>better</strong> than predicted and you gain a point per place, finish
          <strong>worse</strong> and you lose one. E.g. a club predicted 1st that finishes 5th
          scores 21&minus;5 = 16 base points, minus 4 for underperforming its prediction by
          4 places &mdash; 12 points total. Only awarded once the season is fully complete;
          the Teams tab's <strong>League Pos</strong> column tracks the live picture all season.
        </p>
      </div>
    </div>`;
}
