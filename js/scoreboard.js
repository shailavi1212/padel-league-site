/* ============================================
   SCOREBOARD - Live Broadcast (index.html)
   Real-time Firebase connection
   ============================================ */

const SCORE_DELAY = 14000; // 14 seconds delay
let scoreQueue = [];
let currentMatchData = null;

// ---- YouTube URL Parser ----
function getYouTubeEmbedURL(url) {
  if (!url) return null;
  let videoId = null;

  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/watch')) {
    const params = new URLSearchParams(url.split('?')[1]);
    videoId = params.get('v');
  } else if (url.includes('youtube.com/live/')) {
    videoId = url.split('youtube.com/live/')[1]?.split('?')[0];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`;
  }
  return null;
}

// ---- Update Stream ----
function updateStream(url) {
  const wrapper = document.getElementById('videoWrapper');
  const placeholder = document.getElementById('videoPlaceholder');
  const liveBadge = document.getElementById('liveBadge');

  if (!wrapper) return;

  const embedURL = getYouTubeEmbedURL(url);

  if (embedURL) {
    // Remove placeholder, add iframe
    if (placeholder) placeholder.style.display = 'none';

    let iframe = wrapper.querySelector('iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      wrapper.appendChild(iframe);
    }
    iframe.src = embedURL;

    // Show live badge
    if (liveBadge) {
      liveBadge.classList.remove('offline');
    }
  } else {
    // No stream — show placeholder
    if (placeholder) placeholder.style.display = 'flex';
    const iframe = wrapper.querySelector('iframe');
    if (iframe) iframe.remove();

    if (liveBadge) {
      liveBadge.classList.add('offline');
    }
  }
}

// ---- Apply Score Data to DOM ----
function applyScoreData(d) {
  if (!d) return;

  const scoreboard = document.getElementById('scoreboard');
  if (scoreboard) scoreboard.style.display = 'block';

  // Team names
  const teamAName = document.getElementById('teamAName');
  const teamBName = document.getElementById('teamBName');
  const playersA = document.getElementById('playersA');
  const playersB = document.getElementById('playersB');

  if (teamAName && d.teamA) teamAName.textContent = d.teamA;
  if (teamBName && d.teamB) teamBName.textContent = d.teamB;
  if (playersA && d.playersA) playersA.textContent = d.playersA;
  if (playersB && d.playersB) playersB.textContent = d.playersB;

  // Scores with pulse animation
  const fields = [
    { id: 'scoreA', key: 'scoreA' },
    { id: 'scoreB', key: 'scoreB' },
    { id: 'setsA', key: 'setsA' },
    { id: 'setsB', key: 'setsB' },
    { id: 'pointsA', key: 'pointsA' },
    { id: 'pointsB', key: 'pointsB' }
  ];

  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (el && d[f.key] !== undefined) {
      const newVal = String(d[f.key]);
      if (el.textContent !== newVal) {
        el.textContent = newVal;
        el.classList.add('pulse');
        setTimeout(() => el.classList.remove('pulse'), 600);
      }
    }
  });

  // Serving indicator
  const rowA = document.getElementById('rowA');
  const rowB = document.getElementById('rowB');
  if (rowA && rowB) {
    rowA.classList.toggle('serving', d.serving === 'A');
    rowB.classList.toggle('serving', d.serving === 'B');
  }

  // Set History
  if (d.setHistory) {
    ['A', 'B'].forEach(team => {
      const container = document.getElementById(`setHistory${team}`);
      if (container && d.setHistory[team]) {
        container.innerHTML = '';
        Object.values(d.setHistory[team]).forEach(score => {
          const span = document.createElement('span');
          span.className = 'set-score';
          span.textContent = score;
          container.appendChild(span);
        });
      }
    });
  }
}

// ---- Score Delay Queue ----
function processScoreQueue() {
  const now = Date.now();
  while (scoreQueue.length > 0 && now - scoreQueue[0].time >= SCORE_DELAY) {
    const item = scoreQueue.shift();
    applyScoreData(item.data);
  }
  requestAnimationFrame(processScoreQueue);
}

// ---- Firebase Listeners ----
function initScoreboard() {
  // Listen for match data
  db.ref('match').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // Stream URL
    if (data.streamURL) {
      updateStream(data.streamURL);
    }

    // Queue score data with delay
    scoreQueue.push({
      time: Date.now(),
      data: data
    });
  });

  // Listen for sponsors
  db.ref('sponsors').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const track = document.getElementById('sponsorsTrack');
    if (!track) return;

    // Build sponsor elements
    let html = '';
    const sponsors = Object.values(data);

    // Double for seamless loop
    const allSponsors = [...sponsors, ...sponsors];
    allSponsors.forEach(s => {
      if (s.image) {
        html += `<img src="${s.image}" alt="${s.name || 'ספונסר'}" loading="lazy">`;
      } else if (s.name) {
        html += `<div class="sponsor-placeholder">${s.name}</div>`;
      }
    });

    if (html) track.innerHTML = html;
  });

  // Start processing queue
  processScoreQueue();
}

// Initialize
if (typeof db !== 'undefined') {
  initScoreboard();
}
