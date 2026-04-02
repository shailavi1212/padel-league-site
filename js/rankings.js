/* ============================================
   RANKINGS - rankings.html
   Overall player rankings from Firebase
   ============================================ */

let rankingsData = [];
let activeGradeFilter = 'all';

// ---- Render Rankings Table ----
function renderRankings() {
  const tbody = document.getElementById('rankingsBody');
  if (!tbody) return;

  const searchTerm = document.getElementById('searchInput')?.value?.trim().toLowerCase() || '';

  let filtered = rankingsData;

  // Filter by grade
  if (activeGradeFilter !== 'all') {
    filtered = filtered.filter(r => r.grade === activeGradeFilter);
  }

  // Filter by search
  if (searchTerm) {
    filtered = filtered.filter(r =>
      (r.name || '').toLowerCase().includes(searchTerm)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="padding:32px; text-align:center; color:var(--text-secondary);">לא נמצאו תוצאות</td></tr>';
    return;
  }

  const medals = ['gold', 'silver', 'bronze'];
  const medalIcons = ['🥇', '🥈', '🥉'];

  tbody.innerHTML = filtered.map((r, i) => {
    const globalRank = r.rank || (i + 1);
    const rankClass = globalRank <= 3 ? medals[globalRank - 1] : '';
    const rankDisplay = globalRank <= 3 ? medalIcons[globalRank - 1] : globalRank;
    const gradeClass = (r.grade || 'd').toLowerCase();

    let changeHtml = '<span class="rank-change same">—</span>';
    if (r.change > 0) {
      changeHtml = `<span class="rank-change up">▲ ${r.change}</span>`;
    } else if (r.change < 0) {
      changeHtml = `<span class="rank-change down">▼ ${Math.abs(r.change)}</span>`;
    }

    return `
      <tr style="animation: fadeInUp 0.3s ease ${i * 0.03}s backwards;">
        <td><span class="rank ${rankClass}">${rankDisplay}</span></td>
        <td>${r.name || '—'}</td>
        <td><span class="grade-badge ${gradeClass}">${r.grade || '—'}</span></td>
        <td style="font-family:var(--font-display); font-size:20px; color:var(--gold);">${r.points || 0}</td>
        <td>${changeHtml}</td>
      </tr>
    `;
  }).join('');
}

// ---- Initialize ----
function initRankings() {
  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderRankings);
  }

  // Grade filter tabs
  const filterTabs = document.getElementById('rankingFilters');
  if (filterTabs) {
    filterTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeGradeFilter = btn.getAttribute('data-group');
        renderRankings();
      });
    });
  }

  // Firebase listener
  if (typeof db !== 'undefined') {
    db.ref('rankings').on('value', (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        rankingsData = [];
        renderRankings();
        return;
      }

      // Convert to array and sort by points
      rankingsData = Object.entries(data).map(([key, r]) => ({
        name: r.name || key,
        grade: r.grade || 'D',
        points: r.points || 0,
        change: r.change || 0
      }));

      rankingsData.sort((a, b) => b.points - a.points);
      rankingsData.forEach((r, i) => r.rank = i + 1);

      renderRankings();
    });
  }
}

initRankings();
