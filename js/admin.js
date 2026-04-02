/* ============================================
   ADMIN PANEL - Padel League Beer Sheva
   ============================================ */

const ADMIN_PASSWORD = 'bspadel2026';

// ---- Toast Notification ----
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + (type || '');
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ---- Login ----
function tryLogin() {
  const pw = document.getElementById('passwordInput').value;
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminAuth', 'true');
    showAdmin();
  } else {
    const err = document.getElementById('loginError');
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 2500);
  }
}

function showAdmin() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  loadLeagues();
  loadBroadcastState();
}

// Auto-login if session valid
if (sessionStorage.getItem('adminAuth') === 'true') {
  document.addEventListener('DOMContentLoaded', showAdmin);
}

// Enter key on password
document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('passwordInput');
  if (pwInput) {
    pwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryLogin();
    });
  }
});

// ---- Tabs ----
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
});

// ============================================================
//  LEAGUE MANAGEMENT
// ============================================================

let leaguesCache = {};

function loadLeagues() {
  db.ref('leagues').on('value', snap => {
    leaguesCache = snap.val() || {};
    renderLeagues();
  }, err => {
    showToast('שגיאה בטעינת ליגות: ' + err.message, 'error');
  });
}

function renderLeagues() {
  const container = document.getElementById('leaguesList');
  if (!Object.keys(leaguesCache).length) {
    container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.9rem;">אין ליגות עדיין. צור ליגה חדשה למעלה.</p>';
    return;
  }

  // Sort by order
  const sorted = Object.entries(leaguesCache).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  container.innerHTML = sorted.map(([id, league]) => {
    const pairs = league.pairs || {};
    const standings = league.standings || {};
    const schedule = league.schedule || {};
    const pairEntries = Object.entries(pairs);
    const standingEntries = Object.entries(standings);
    const scheduleEntries = Object.entries(schedule).sort();

    return `
      <div class="league-card" data-id="${id}">
        <div class="league-card-header" onclick="toggleLeague(this)">
          <span class="arrow">&#9654;</span>
          <span class="league-name">${escHtml(league.name || '')}</span>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();renameLeague('${id}','${escAttr(league.name || '')}')">ערוך שם</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteLeague('${id}','${escAttr(league.name || '')}')">מחק</button>
        </div>
        <div class="league-card-body">

          <!-- Add Pair -->
          <div class="sub-section">
            <h4>זוגות</h4>
            <div class="input-row">
              <input type="text" id="pairInput-${id}" placeholder='שם הזוג (למשל: שי & תומר)'>
              <button class="btn btn-gold btn-sm" onclick="addPair('${id}')">הוסף זוג</button>
            </div>
            <div>
              ${pairEntries.length ? pairEntries.map(([pid, p]) => `
                <div class="pair-item">
                  <span>${escHtml(p.name || '')}</span>
                  <button class="btn btn-danger btn-sm" onclick="deletePair('${id}','${pid}','${escAttr(p.name || '')}')">מחק</button>
                </div>
              `).join('') : '<p style="color:var(--text-secondary);font-size:0.85rem;">אין זוגות עדיין</p>'}
            </div>
          </div>

          <!-- Generate Schedule -->
          <div class="sub-section">
            <h4>לוח משחקים</h4>
            <button class="btn btn-gold" onclick="generateSchedule('${id}')">צור לוח משחקים (Round Robin)</button>
            ${scheduleEntries.length ? scheduleEntries.map(([fixtureKey, matches]) => {
              const matchEntries = Object.entries(matches);
              const fixtureNum = fixtureKey.replace('fixture', '');
              return `
                <div class="fixture-block">
                  <h5>סיבוב ${fixtureNum}</h5>
                  ${matchEntries.map(([mid, m]) => `
                    <div class="match-row">
                      <div class="match-teams">${escHtml(m.teamA || '')} נגד ${escHtml(m.teamB || '')}</div>
                      <div class="match-scores">
                        <label>סטים A:</label>
                        <input type="number" min="0" id="sA-${id}-${fixtureKey}-${mid}" value="${m.scoreA != null ? m.scoreA : ''}">
                        <label>סטים B:</label>
                        <input type="number" min="0" id="sB-${id}-${fixtureKey}-${mid}" value="${m.scoreB != null ? m.scoreB : ''}">
                        <label>גיימים A:</label>
                        <input type="number" min="0" id="gA-${id}-${fixtureKey}-${mid}" value="${m.gamesA != null ? m.gamesA : ''}">
                        <label>גיימים B:</label>
                        <input type="number" min="0" id="gB-${id}-${fixtureKey}-${mid}" value="${m.gamesB != null ? m.gamesB : ''}">
                        <button class="btn btn-gold btn-sm" onclick="saveMatchScore('${id}','${fixtureKey}','${mid}')">שמור</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `;
            }).join('') : '<p style="color:var(--text-secondary);font-size:0.85rem;margin-top:8px;">לא נוצר לוח משחקים עדיין</p>'}
          </div>

          <!-- Standings -->
          <div class="sub-section">
            <h4>טבלת דירוג</h4>
            ${standingEntries.length ? `
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>זוג</th>
                    <th>P</th>
                    <th>W</th>
                    <th>S+</th>
                    <th>S-</th>
                    <th>G+</th>
                    <th>G-</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${standingEntries.map(([sid, s]) => `
                    <tr>
                      <td>${escHtml(s.name || '')}</td>
                      <td id="stdP-${id}-${sid}">${s.p || 0}</td>
                      <td><input type="number" min="0" id="stdW-${id}-${sid}" value="${s.w || 0}"></td>
                      <td><input type="number" min="0" id="stdSP-${id}-${sid}" value="${s.sPlus || 0}"></td>
                      <td><input type="number" min="0" id="stdSM-${id}-${sid}" value="${s.sMinus || 0}"></td>
                      <td><input type="number" min="0" id="stdGP-${id}-${sid}" value="${s.gPlus || 0}"></td>
                      <td><input type="number" min="0" id="stdGM-${id}-${sid}" value="${s.gMinus || 0}"></td>
                      <td><button class="btn btn-gold btn-sm" onclick="saveStanding('${id}','${sid}')">שמור</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color:var(--text-secondary);font-size:0.85rem;">אין נתוני דירוג. הוסף זוגות וצור לוח משחקים.</p>'}
          </div>

        </div>
      </div>
    `;
  }).join('');
}

// ---- Toggle league card ----
function toggleLeague(header) {
  header.classList.toggle('open');
  header.nextElementSibling.classList.toggle('open');
}

// ---- Create league ----
function createLeague() {
  const nameInput = document.getElementById('newLeagueName');
  const name = nameInput.value.trim();
  if (!name) { showToast('הזן שם ליגה', 'error'); return; }

  const order = Object.keys(leaguesCache).length + 1;
  const newRef = db.ref('leagues').push();
  newRef.set({ name, order })
    .then(() => { nameInput.value = ''; showToast('ליגה נוצרה בהצלחה', 'success'); })
    .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

// ---- Rename league ----
function renameLeague(id, currentName) {
  const newName = prompt('שם חדש לליגה:', currentName);
  if (newName === null || !newName.trim()) return;
  db.ref('leagues/' + id + '/name').set(newName.trim())
    .then(() => showToast('שם הליגה עודכן', 'success'))
    .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

// ---- Delete league ----
function deleteLeague(id, name) {
  if (!confirm('למחוק את "' + name + '"? פעולה זו בלתי הפיכה!')) return;
  db.ref('leagues/' + id).remove()
    .then(() => showToast('ליגה נמחקה', 'success'))
    .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

// ---- Add pair ----
function addPair(leagueId) {
  const input = document.getElementById('pairInput-' + leagueId);
  const name = input.value.trim();
  if (!name) { showToast('הזן שם זוג', 'error'); return; }

  const pairRef = db.ref('leagues/' + leagueId + '/pairs').push();
  const pairId = pairRef.key;

  const updates = {};
  updates['leagues/' + leagueId + '/pairs/' + pairId] = { name };
  updates['leagues/' + leagueId + '/standings/' + pairId] = {
    name, p: 0, w: 0, sPlus: 0, sMinus: 0, gPlus: 0, gMinus: 0
  };

  db.ref().update(updates)
    .then(() => { input.value = ''; showToast('זוג נוסף בהצלחה', 'success'); })
    .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

// ---- Delete pair ----
function deletePair(leagueId, pairId, name) {
  if (!confirm('למחוק את "' + name + '"?')) return;
  const updates = {};
  updates['leagues/' + leagueId + '/pairs/' + pairId] = null;
  updates['leagues/' + leagueId + '/standings/' + pairId] = null;
  db.ref().update(updates)
    .then(() => showToast('זוג נמחק', 'success'))
    .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

// ---- Generate Round-Robin Schedule ----
function generateRoundRobin(pairs) {
  const n = pairs.length;
  if (n < 2) return [];

  const teams = [...pairs];
  if (n % 2 !== 0) teams.push({ name: 'BYE', id: 'bye' });

  const numRounds = teams.length - 1;
  const half = teams.length / 2;
  const teamIndexes = teams.map((_, i) => i).slice(1);
  const rounds = [];

  for (let round = 0; round < numRounds; round++) {
    const matches = [];
    const newIndexes = [0, ...teamIndexes];

    for (let i = 0; i < half; i++) {
      const home = newIndexes[i];
      const away = newIndexes[newIndexes.length - 1 - i];

      if (teams[home].name !== 'BYE' && teams[away].name !== 'BYE') {
        matches.push({
          teamA: teams[home].name,
          teamAId: teams[home].id,
          teamB: teams[away].name,
          teamBId: teams[away].id
        });
      }
    }
    rounds.push(matches);
    teamIndexes.push(teamIndexes.shift());
  }
  return rounds;
}

function generateSchedule(leagueId) {
  const league = leaguesCache[leagueId];
  if (!league || !league.pairs) {
    showToast('אין זוגות בליגה. הוסף זוגות תחילה.', 'error');
    return;
  }

  const pairs = Object.entries(league.pairs).map(([id, p]) => ({ id, name: p.name }));
  if (pairs.length < 2) {
    showToast('נדרשים לפחות 2 זוגות ליצירת לוח משחקים', 'error');
    return;
  }

  if (league.schedule && Object.keys(league.schedule).length > 0) {
    if (!confirm('קיים לוח משחקים. האם לדרוס אותו?')) return;
  }

  const rounds = generateRoundRobin(pairs);
  const scheduleData = {};

  rounds.forEach((matches, i) => {
    const fixtureKey = 'fixture' + (i + 1);
    scheduleData[fixtureKey] = {};
    matches.forEach((m, j) => {
      const matchId = 'match' + (j + 1);
      scheduleData[fixtureKey][matchId] = {
        teamA: m.teamA,
        teamAId: m.teamAId,
        teamB: m.teamB,
        teamBId: m.teamBId,
        scoreA: null,
        scoreB: null,
        gamesA: null,
        gamesB: null,
        date: null,
        time: null
      };
    });
  });

  db.ref('leagues/' + leagueId + '/schedule').set(scheduleData)
    .then(() => showToast('לוח משחקים נוצר בהצלחה! ' + rounds.length + ' סיבובים', 'success'))
    .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

// ---- Save match score + update standings ----
function saveMatchScore(leagueId, fixtureKey, matchId) {
  const sA = parseInt(document.getElementById('sA-' + leagueId + '-' + fixtureKey + '-' + matchId).value) || 0;
  const sB = parseInt(document.getElementById('sB-' + leagueId + '-' + fixtureKey + '-' + matchId).value) || 0;
  const gA = parseInt(document.getElementById('gA-' + leagueId + '-' + fixtureKey + '-' + matchId).value) || 0;
  const gB = parseInt(document.getElementById('gB-' + leagueId + '-' + fixtureKey + '-' + matchId).value) || 0;

  const matchPath = 'leagues/' + leagueId + '/schedule/' + fixtureKey + '/' + matchId;

  // Get the match data to find team IDs
  const match = leaguesCache[leagueId].schedule[fixtureKey][matchId];
  const teamAId = match.teamAId;
  const teamBId = match.teamBId;

  if (!teamAId || !teamBId) {
    showToast('חסרים מזהי קבוצות. נסה ליצור מחדש את לוח המשחקים.', 'error');
    return;
  }

  // Determine previous scores to undo them from standings
  const prevScoreA = match.scoreA;
  const prevScoreB = match.scoreB;
  const prevGamesA = match.gamesA || 0;
  const prevGamesB = match.gamesB || 0;
  const hadPreviousScore = prevScoreA != null && prevScoreB != null;

  const standingsRef = 'leagues/' + leagueId + '/standings';

  db.ref(standingsRef).once('value').then(snap => {
    const standings = snap.val() || {};
    const stA = standings[teamAId] || { name: match.teamA, p: 0, w: 0, sPlus: 0, sMinus: 0, gPlus: 0, gMinus: 0 };
    const stB = standings[teamBId] || { name: match.teamB, p: 0, w: 0, sPlus: 0, sMinus: 0, gPlus: 0, gMinus: 0 };

    // Undo previous score if existed
    if (hadPreviousScore) {
      stA.p -= 1;
      stB.p -= 1;
      stA.sPlus -= prevScoreA;
      stA.sMinus -= prevScoreB;
      stB.sPlus -= prevScoreB;
      stB.sMinus -= prevScoreA;
      stA.gPlus -= prevGamesA;
      stA.gMinus -= prevGamesB;
      stB.gPlus -= prevGamesB;
      stB.gMinus -= prevGamesA;
      if (prevScoreA > prevScoreB) stA.w -= 1;
      else if (prevScoreB > prevScoreA) stB.w -= 1;
    }

    // Apply new score
    stA.p += 1;
    stB.p += 1;
    stA.sPlus += sA;
    stA.sMinus += sB;
    stB.sPlus += sB;
    stB.sMinus += sA;
    stA.gPlus += gA;
    stA.gMinus += gB;
    stB.gPlus += gB;
    stB.gMinus += gA;
    if (sA > sB) stA.w += 1;
    else if (sB > sA) stB.w += 1;

    const updates = {};
    updates[matchPath + '/scoreA'] = sA;
    updates[matchPath + '/scoreB'] = sB;
    updates[matchPath + '/gamesA'] = gA;
    updates[matchPath + '/gamesB'] = gB;
    updates[standingsRef + '/' + teamAId] = stA;
    updates[standingsRef + '/' + teamBId] = stB;

    return db.ref().update(updates);
  })
  .then(() => showToast('תוצאה נשמרה ודירוג עודכן', 'success'))
  .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

// ---- Save individual standing row (manual edit) ----
function saveStanding(leagueId, standingId) {
  const w  = parseInt(document.getElementById('stdW-'  + leagueId + '-' + standingId).value) || 0;
  const sp = parseInt(document.getElementById('stdSP-' + leagueId + '-' + standingId).value) || 0;
  const sm = parseInt(document.getElementById('stdSM-' + leagueId + '-' + standingId).value) || 0;
  const gp = parseInt(document.getElementById('stdGP-' + leagueId + '-' + standingId).value) || 0;
  const gm = parseInt(document.getElementById('stdGM-' + leagueId + '-' + standingId).value) || 0;
  const p  = sp + sm; // P = total sets played (games played auto-calculated)

  const existing = leaguesCache[leagueId].standings[standingId] || {};

  db.ref('leagues/' + leagueId + '/standings/' + standingId).update({
    w, sPlus: sp, sMinus: sm, gPlus: gp, gMinus: gm, p: w // p = games played = wins + losses; use w as minimum
  }).then(() => {
    // Recalculate P as total matches by counting scored matches for this pair
    recalcPlayed(leagueId, standingId);
    showToast('דירוג עודכן', 'success');
  }).catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

function recalcPlayed(leagueId, pairId) {
  const schedule = leaguesCache[leagueId].schedule || {};
  let played = 0;
  Object.values(schedule).forEach(fixture => {
    Object.values(fixture).forEach(m => {
      if ((m.teamAId === pairId || m.teamBId === pairId) && m.scoreA != null && m.scoreB != null) {
        played++;
      }
    });
  });
  db.ref('leagues/' + leagueId + '/standings/' + pairId + '/p').set(played);
}

// ============================================================
//  BROADCAST CONTROL
// ============================================================

let bcState = {};

function loadBroadcastState() {
  db.ref('match').on('value', snap => {
    bcState = snap.val() || {};
    // Update UI
    document.getElementById('bcStreamURL').value = bcState.streamURL || '';
    document.getElementById('bcTeamA').value = bcState.teamAName || '';
    document.getElementById('bcTeamB').value = bcState.teamBName || '';
    document.getElementById('bcPlayersA').value = bcState.playersA || '';
    document.getElementById('bcPlayersB').value = bcState.playersB || '';

    document.getElementById('bcSetsA').textContent = bcState.setsA || 0;
    document.getElementById('bcSetsB').textContent = bcState.setsB || 0;
    document.getElementById('bcScoreA').textContent = bcState.scoreA || 0;
    document.getElementById('bcScoreB').textContent = bcState.scoreB || 0;
    document.getElementById('bcPointsA').textContent = bcState.pointsA || 0;
    document.getElementById('bcPointsB').textContent = bcState.pointsB || 0;

    // Serve indicator
    document.getElementById('serveA').classList.toggle('active', bcState.serving === 'A');
    document.getElementById('serveB').classList.toggle('active', bcState.serving === 'B');
  });
}

function saveBroadcastInfo() {
  const updates = {
    streamURL: document.getElementById('bcStreamURL').value.trim(),
    teamAName: document.getElementById('bcTeamA').value.trim(),
    teamBName: document.getElementById('bcTeamB').value.trim(),
    playersA: document.getElementById('bcPlayersA').value.trim(),
    playersB: document.getElementById('bcPlayersB').value.trim()
  };
  db.ref('match').update(updates)
    .then(() => showToast('פרטי שידור נשמרו', 'success'))
    .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

function resetBroadcast() {
  if (!confirm('לאפס את כל נתוני השידור?')) return;
  db.ref('match').set({
    streamURL: '',
    teamAName: '',
    teamBName: '',
    playersA: '',
    playersB: '',
    setsA: 0,
    setsB: 0,
    scoreA: 0,
    scoreB: 0,
    pointsA: 0,
    pointsB: 0,
    serving: 'A',
    setHistory: null
  })
  .then(() => showToast('שידור אופס', 'success'))
  .catch(err => showToast('שגיאה: ' + err.message, 'error'));
}

function adjustScore(team, field, delta) {
  const key = field + team; // e.g., setsA, scoreB, pointsA
  const current = parseInt(bcState[key]) || 0;
  const newVal = Math.max(0, current + delta);
  db.ref('match/' + key).set(newVal);
}

function setServe(team) {
  db.ref('match/serving').set(team);
}

// ---- Utility ----
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
