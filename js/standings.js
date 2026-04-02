/* ============================================
   STANDINGS & SCHEDULE - league-standings.html
   Firebase real-time data
   ============================================ */

let standingsData = {};
let scheduleData = {};
let currentGroup = 'A';
let currentFixture = '1';

// ---- Render Standings Table ----
function renderStandings() {
  const tbody = document.getElementById('standingsBody');
  if (!tbody) return;

  const groupKey = `group${currentGroup}`;
  const groupData = standingsData[groupKey];

  if (!groupData) {
    tbody.innerHTML = '<tr><td colspan="10" style="padding:32px; text-align:center; color:var(--text-secondary);">אין נתונים זמינים</td></tr>';
    return;
  }

  // Convert to array and sort
  const teams = Object.entries(groupData).map(([key, t]) => ({
    name: t.name || key,
    p: t.p || 0,
    w: t.w || 0,
    sPlus: t.sPlus || 0,
    sMinus: t.sMinus || 0,
    gPlus: t.gPlus || 0,
    gMinus: t.gMinus || 0
  }));

  teams.sort((a, b) => {
    if (b.w !== a.w) return b.w - a.w;
    const sdA = a.sPlus - a.sMinus;
    const sdB = b.sPlus - b.sMinus;
    if (sdB !== sdA) return sdB - sdA;
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
        <td>${t.name}</td>
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

// ---- Render Fixtures ----
function renderFixtures() {
  const panel = document.getElementById('fixturePanel');
  if (!panel) return;

  const groupKey = `group${currentGroup}`;
  const groupSchedule = scheduleData[groupKey];
  const fixtureKey = `fixture${currentFixture}`;

  if (!groupSchedule || !groupSchedule[fixtureKey]) {
    panel.innerHTML = '<div style="padding:32px; text-align:center; color:var(--text-secondary);">אין משחקים במחזור זה</div>';
    return;
  }

  const matches = groupSchedule[fixtureKey];
  const months = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

  let html = '';

  Object.values(matches).forEach(match => {
    // Date formatting
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

    const hasScore = match.scoreA !== undefined && match.scoreB !== undefined;
    const scoreDisplay = hasScore
      ? `<span>${match.scoreA} – ${match.scoreB}</span>`
      : '<span>vs</span>';
    const scoreClass = hasScore ? '' : 'pending';

    html += `
      ${dateStr ? `<div class="fixture-date">${dateStr}</div>` : ''}
      <div class="fixture-card">
        <div class="fixture-team">${match.teamA || '—'}</div>
        <div class="fixture-score ${scoreClass}">${scoreDisplay}</div>
        <div class="fixture-team away">${match.teamB || '—'}</div>
      </div>
    `;
  });

  panel.innerHTML = html;
}

// ---- Tab Event Listeners ----
function initStandingsTabs() {
  // Group tabs
  const standingsTabs = document.getElementById('standingsTabs');
  if (standingsTabs) {
    standingsTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        standingsTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGroup = btn.getAttribute('data-group');
        renderStandings();
        renderFixtures();
      });
    });
  }

  // Fixture tabs
  const fixtureTabs = document.getElementById('fixtureTabs');
  if (fixtureTabs) {
    fixtureTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        fixtureTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFixture = btn.getAttribute('data-tab');
        renderFixtures();
      });
    });
  }
}

// ---- Firebase Listeners ----
function initStandingsData() {
  // Standings
  db.ref('standings').on('value', (snapshot) => {
    standingsData = snapshot.val() || {};
    renderStandings();
  });

  // Schedule
  db.ref('schedule').on('value', (snapshot) => {
    scheduleData = snapshot.val() || {};
    renderFixtures();
  });
}

// Initialize
initStandingsTabs();
if (typeof db !== 'undefined') {
  initStandingsData();
}
