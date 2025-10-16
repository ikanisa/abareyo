// Enhanced interactivity for the GIKUNDIRO fan hub prototype
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  renderScoreboard();
  setupFixturesTabs();
  setupPoll();
});

function setupNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

function renderScoreboard() {
  const scoreboardEl = document.querySelector('[data-scoreboard]');
  const eventsEl = document.querySelector('[data-scoreboard-events]');
  if (!scoreboardEl || !eventsEl) return;

  const matchState = {
    timer: "58'",
    home: {
      name: 'Rayon Sports',
      score: 2,
      crest: '🔵',
    },
    away: {
      name: 'APR FC',
      score: 1,
      crest: '⚫',
    },
    events: [
      { minute: 58, description: 'Goal! Mugisha (Assist: Niyonzima)', team: 'home' },
      { minute: 44, description: 'Save! Kwizera denies APR header', team: 'home' },
      { minute: 31, description: 'Goal! Tuyisenge levels for APR', team: 'away' },
      { minute: 19, description: 'Yellow card — Niyomugabo (APR)', team: 'away' },
    ],
  };

  const scoreboardTeams = document.createElement('div');
  scoreboardTeams.className = 'scoreboard__teams';
  scoreboardTeams.innerHTML = `
    <div class="team team--home">
      <span class="team-crest" aria-hidden="true">${matchState.home.crest}</span>
      <span class="team-name">${matchState.home.name}</span>
      <span class="team-score">${matchState.home.score}</span>
    </div>
    <div class="scoreboard__timer" role="timer">${matchState.timer}</div>
    <div class="team team--away">
      <span class="team-crest" aria-hidden="true">${matchState.away.crest}</span>
      <span class="team-name">${matchState.away.name}</span>
      <span class="team-score">${matchState.away.score}</span>
    </div>
  `;

  const eventsFragment = document.createDocumentFragment();
  matchState.events
    .sort((a, b) => b.minute - a.minute)
    .forEach(event => {
      const li = document.createElement('li');
      li.textContent = `${event.minute}' — ${event.description}`;
      eventsFragment.appendChild(li);
    });

  scoreboardEl.querySelector('.scoreboard__teams')?.replaceWith(scoreboardTeams);
  eventsEl.replaceChildren(eventsFragment);
}

function setupFixturesTabs() {
  const tabButtons = document.querySelectorAll('[data-fixtures-tab]');
  const listEl = document.querySelector('[data-fixtures-list]');
  if (!tabButtons.length || !listEl) return;

  const fixtures = {
    upcoming: [
      { title: 'Rayon Sports vs APR FC', meta: 'Saturday · 18:00 · Kigali Pelé Stadium' },
      { title: 'Gasogi United vs Rayon Sports', meta: 'Wed 20 Mar · 20:30 · Kigali Arena' },
      { title: 'Rayon Sports vs Kiyovu', meta: 'Sun 31 Mar · 17:00 · Nyamirambo' },
    ],
    results: [
      { title: 'Rayon Sports 3 - 1 Etincelles', meta: 'Player of the Match: Hakizimana' },
      { title: 'Police FC 0 - 2 Rayon Sports', meta: 'Clean sheet for Kwizera' },
      { title: 'Rayon Sports 1 - 1 Mukura VS', meta: 'Unbeaten in 7 matches' },
    ],
  };

  const renderList = category => {
    const fragment = document.createDocumentFragment();
    fixtures[category].forEach(item => {
      const article = document.createElement('article');
      article.className = 'fixture-card';
      article.innerHTML = `<h3>${item.title}</h3><p>${item.meta}</p>`;
      fragment.appendChild(article);
    });
    listEl.replaceChildren(fragment);
  };

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.fixturesTab;
      if (!category || !fixtures[category]) return;

      tabButtons.forEach(tab => {
        tab.classList.remove('is-active');
        tab.setAttribute('aria-selected', String(tab === button));
      });
      button.classList.add('is-active');
      renderList(category);
    });
  });

  renderList('upcoming');
}

function setupPoll() {
  const poll = document.querySelector('[data-poll]');
  if (!poll) return;

  const options = Array.from(poll.querySelectorAll('.poll-option'));
  if (!options.length) return;

  let hasVoted = false;
  let votes = options.map(option => Number.parseInt(option.dataset.votes || '0', 10));

  try {
    hasVoted = Boolean(localStorage.getItem('gikundiro:poll:voted'));
  } catch (error) {
    hasVoted = false;
  }

  const updatePercentages = () => {
    const total = votes.reduce((sum, value) => sum + value, 0);
    options.forEach((option, index) => {
      const percentEl = option.querySelector('.poll-percent');
      if (!percentEl) return;
      const percentage = total > 0 ? Math.round((votes[index] / total) * 100) : 0;
      percentEl.textContent = `${percentage}%`;
    });
    const totalLabel = poll.querySelector('[data-total-votes]');
    if (totalLabel) {
      totalLabel.textContent = `${total.toLocaleString()} vote${total === 1 ? '' : 's'}`;
    }
  };

  const lockPoll = () => {
    poll.classList.add('poll-voted');
    try {
      localStorage.setItem('gikundiro:poll:voted', 'true');
    } catch (error) {
      // localStorage may be unavailable in some contexts; ignore.
    }
  };

  if (hasVoted) {
    poll.classList.add('poll-voted');
  }

  options.forEach((option, index) => {
    option.addEventListener('click', () => {
      if (hasVoted) return;
      votes[index] += 1;
      hasVoted = true;
      options.forEach(btn => btn.classList.remove('selected'));
      option.classList.add('selected');
      lockPoll();
      updatePercentages();
    });
  });

  updatePercentages();
}
