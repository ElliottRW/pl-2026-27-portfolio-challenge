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
        ⚠️ These rules are a <strong>provisional placeholder</strong> — final scoring
        is being decided on a call and will be updated here once agreed. See
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
        <p class="rules-note">Standard football points, mirroring the real Premier League table. Each club plays 38 matches across the season.</p>
      </div>
    </div>`;
}
