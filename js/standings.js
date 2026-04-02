/* ============================================
   STANDINGS & SCHEDULE - league.html
   Dynamic leagues from Firebase: leagues/{id}/
   ============================================ */

let allLeagues = {};
let selectedLeagueId = null;
let currentFixture = '1';
let leagueListener = null;

// ---- Load all leagues for dropdown ----
function initLeaguePage() {
  db.ref('leagues').on('value', (snapshot) => {
    allLeagues = snapshot.val() || {};
    populateDropdown();
  });
}

// ---- Populate dropdown ----
function populateDropdown() {
  const select = document.getElementById('leagueSelect');
  const noMsg = document.getElementById('noLeagueMsg');
  const section = document.getElementById('standingsSection');

  if (!select) return;

  const sorted = Object.entries(allLeagues)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  if (sorted.length === 0) {
    select.innerHTML = '<option value="" disabled selected>אין ליגות זמינות</option>';
    if (noMsg) noMsg.style.display = 'block';
    if (section) section.style.display = 'none';
    return;
  }

  if (noMsg) noMsg.style.display = 'none';

  // Build options
  let html = '<option value="" disabled>בחרו ליגה...</option>';
  sorted.forEach(([id, league]) => {
    const isSelected = id === selectedLeagueId ? ' selected' : '';
    html += `<option value="${id}"${isSelected}>${league.name || 'ליגה'}</option>`;
  });
  select.innerHTML = html;

  // If we had a selection, keep it; otherwise auto-select first
  if (!selectedLeagueId && sorted.length > 0) {
    selectedLeagueId = sorted[0][0];
    select.value = selectedLeagueId;
    onLeagueSelected(selectedLeagueId);
  } else if (selectedLeagueId) {
    // Re-render current league (data may have changed)
    renderStandings();
    renderFixtureTabs();
    renderFixtures();
  }
}

// ---- Dropdown change handler ----
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('leagueSelect');
  if (select) {
    select.addEventListener('change', (e) => {
      onLeagueSelected(e.target.value);
    });
  }
});

function onLeagueSelected(leagueId) {
  selectedLeagueId = leagueId;
  currentFixture = '1';

  const section = document.getElementById('standingsSection');
  if (section) section.style.display = 'block';

  // Attach real-time listener for this specific league
  if (leagueListener) {
    db.ref('leagues/' + leagueListener).off();
  }
  leagueListener = leagueId;

  db.ref('leagues/' + leagueId).on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      allLeagues[leagueId] = data;
    }
    renderStandings();
    renderFixtureTabs();
    renderFixtures();
  });
}

// ---- Render Standings Table ----
function renderStandings() {
  const tbody = document.getElementById('standingsBody');
  if (!tbody || !selectedLeagueId) return;

  const league = allLeagues[selectedLeagueId];
  if (!league || !league.standings) {
    tbody.innerHTML = '<tr><td colspan="10" style="padding:32px; text-align:center; color:var(--text-secondary);">אין נתונים זמינים עדיין</td></tr>';
    return;
  }

  const teams = Object.entries(league.standings).map(([key, t]) => ({
    name: t.name || key,
    p: t.p || 0,
    w: t.w || 0,
    sPlus: t.sPlus || 0,
    sMinus: t.sMinus || 0,
    gPlus: t.gPlus || 0,
    gMinus: t.gMinus || 0
  }));

  // Sort: wins → set diff → game diff
  teams.sort((a, b) => {
    if (b.w !== a.w) return b.w - a.w;
    const sdDiff = (b.sPlus - b.sMinus) - (a.sPlus - a.sMinus);
    if (sdDiff !== 0) return sdDiff;
    return (b.gPlus - b.gMinus) - (a.gPlus - a.gMinus);
  });

  const medals = ['gold', 'silver', 'bronze'];
  const medalIcons = ['🥇', '🥈', '🥉'];

  tbody.innerHTML = teams.map((t, i) => {
    const sd = t.sPlus - t.sMinus;
    const gd = t.gPlus - t.gMinus;
    const rankClass = i < 3 ? medals[i] : '';
    const rankDisplay = i < 3 ? medalIcons[i] : (i + 1);

    return `
      <tr style="animation: fadeInUp 0.4s ease ${i * 0.05}s backwards;">
        <td><span class="rank ${rankClass}">${rankDisplay}</span></td>
        <td>${escHtml(t.name)}</td>
        <td>${t.p}</td>
        <td><span class="wins">${t.w}</span></td>
        <td>${t.sPlus}</td>
        <td>${t.sMinus}</td>
        <td class="${sd > 0 ? 'positive' : sd < 0 ? 'negative' : ''}">${sd > 0 ? '+' : ''}${sd}</td>
        <td>${t.gPlus}</td>
        <td>${t.gMinus}</td>
        <td class="${gd > 0 ? 'blue-positive' : gd < 0 ? 'negative' : ''}">${gd > 0 ? '+' : ''}${gd}</td>
      </tr>
    `;
  }).join('');
}

// ---- Render Fixture Tabs dynamically ----
function renderFixtureTabs() {
  const container = document.getElementById('fixtureTabs');
  if (!container || !selectedLeagueId) return;

  const league = allLeagues[selectedLeagueId];
  const schedule = league?.schedule || {};
  const fixtureKeys = Object.keys(schedule).sort((a, b) => {
    const numA = parseInt(a.replace('fixture', '')) || 0;
    const numB = parseInt(b.replace('fixture', '')) || 0;
    return numA - numB;
  });

  if (fixtureKeys.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = fixtureKeys.map(key => {
    const num = key.replace('fixture', '');
    const isActive = num === currentFixture ? ' active' : '';
    return `<button class="tab-btn${isActive}" data-tab="${num}">מחזור ${num}</button>`;
  }).join('');

  // Attach click handlers
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFixture = btn.getAttribute('data-tab');
      renderFixtures();
    });
  });
}

// ---- Render Fixtures ----
function renderFixtures() {
  const panel = document.getElementById('fixturePanel');
  if (!panel || !selectedLeagueId) return;

  const league = allLeagues[selectedLeagueId];
  const schedule = league?.schedule || {};
  const fixtureKey = 'fixture' + currentFixture;
  const fixture = schedule[fixtureKey];

  if (!fixture) {
    panel.innerHTML = '<div style="padding:32px; text-align:center; color:var(--text-secondary);">אין משחקים במחזור זה</div>';
    return;
  }

  const months = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

  let html = '';
  const matches = Object.values(fixture);

  matches.forEach(match => {
    // Date
    let dateStr = '';
    if (match.date) {
      try {
        const d = new Date(match.date);
        dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        if (match.time) dateStr += ` · ${match.time}`;
      } catch (e) {
        dateStr = match.date;
      }
    }

    const hasScore = match.scoreA != null && match.scoreB != null;
    const scoreDisplay = hasScore
      ? `${match.scoreA} – ${match.scoreB}`
      : 'vs';
    const scoreClass = hasScore ? '' : 'pending';

    html += `
      ${dateStr ? `<div class="fixture-date">${dateStr}</div>` : ''}
      <div class="fixture-card">
        <div class="fixture-team">${escHtml(match.teamA || '—')}</div>
        <div class="fixture-score ${scoreClass}">${scoreDisplay}</div>
        <div class="fixture-team away">${escHtml(match.teamB || '—')}</div>
      </div>
    `;
  });

  panel.innerHTML = html || '<div style="padding:32px; text-align:center; color:var(--text-secondary);">אין משחקים</div>';
}

// ---- Utility ----
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Initialize ----
if (typeof db !== 'undefined') {
  initLeaguePage();
}
