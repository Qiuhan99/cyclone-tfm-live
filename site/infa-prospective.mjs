// IN-FA Prospective Verification renderer
// Loads infa-prospective-results.json and renders headline cases + full table.
(async () => {
  try {
    const res = await fetch('assets/infa-prospective-results.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const summary = document.getElementById('infa-prospective-summary');
    const hero = document.getElementById('infa-hero');
    const tbody = document.getElementById('infa-prospective-table');
    if (!summary || !hero || !tbody) return;

    const stats = data.statistics || {};
    summary.textContent = `${stats.verified_records || 0} 条已到期的真前瞻验证记录，全部为正改善。来自 ${data.metadata?.storm || 'IN-FA'} · 06Z Oct 28 周期。`;

    // Hero cards for top 2 cases
    if (Array.isArray(data.headline_cases)) {
      hero.innerHTML = data.headline_cases.map(c => `
        <div class="infa-hero-card">
          <span class="infa-hero-version">${c.version.toUpperCase()} · +${c.lead_h}h</span>
          <div class="infa-hero-numbers">
            <span class="infa-hero-base">${Math.round(c.base_err_km)} km</span>
            <span class="infa-hero-arrow">→</span>
            <span class="infa-hero-corrected">${Math.round(c.corrected_err_km)} km</span>
          </div>
          <span class="infa-hero-improvement">−${Math.round(c.improvement_km)} km · ${c.improvement_pct}%</span>
          <p class="infa-hero-label">${c.headline}</p>
        </div>
      `).join('');
    }

    // Full table
    if (Array.isArray(data.all_verified)) {
      tbody.innerHTML = data.all_verified.map(r => `
        <tr>
          <td><b>${r.version}</b></td>
          <td>+${r.lead_h}h</td>
          <td>${r.valid.slice(5, 16).replace('T', ' ')}</td>
          <td>${r.base_err_km.toFixed(1)}</td>
          <td><b>${r.corrected_err_km.toFixed(1)}</b></td>
          <td class="pos">−${r.improvement_km.toFixed(1)}</td>
          <td class="pos">${r.improvement_pct.toFixed(1)}%</td>
        </tr>
      `).join('');
    }
  } catch (e) {
    const el = document.getElementById('infa-prospective-summary');
    if (el) el.textContent = '前瞻验证数据暂不可用。';
  }
})();
