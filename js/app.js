/**
 * Main app - screens, topic loading, navigation
 */
const App = (() => {
  const DIFFICULTIES = [
    { id: 1, icon: '🧩', name: 'Woorden Koppelen', desc: 'Sleep het Engelse woord naar het Nederlandse woord' },
    { id: 2, icon: '⌨️', name: 'Typ het Woord', desc: 'Typ het Engelse woord bij de Nederlandse vertaling' },
    { id: 3, icon: '🎧', name: 'Luister en Kies', desc: 'Luister naar het Engelse woord en kies het Nederlandse woord' },
    { id: 4, icon: '🃏', name: 'Memory', desc: 'Draai kaarten om en vind het Engelse-Nederlandse paar' }
  ];

  let currentTopic = null;
  let currentTopicId = null;
  let currentDifficulty = null;

  function getDifficulty(id) {
    return DIFFICULTIES.find(d => d.id === id);
  }

  function init() {
    const name = Progress.getPlayerName();
    if (!name) {
      showScreen('screen-name');
      setupNameScreen();
      return;
    }
    showScreen('screen-welcome');
    setWelcomeMessage(name);
    updateHomeButton();
    loadTopics();
    setupNavigation();
    updateTotalStars();
  }

  function setWelcomeMessage(name) {
    const speech = document.getElementById('welcome-speech');
    if (speech) {
      speech.textContent = `Welkom, ${name}! Kies een onderwerp om je magische vaardigheden te verbeteren!`;
    }
  }

  function setupNameScreen() {
    const input = document.getElementById('player-name-input');
    const submitBtn = document.getElementById('player-name-submit');
    const feedback = document.getElementById('name-feedback');

    function submitName() {
      const name = Progress.setPlayerName(input.value);
      if (name) {
        setWelcomeMessage(name);
        showScreen('screen-welcome');
        updateHomeButton();
        loadTopics();
        setupNavigation();
        updateTotalStars();
      } else {
        feedback.textContent = 'Vul alsjeblieft een naam in! 🪄';
        feedback.className = 'feedback wrong';
        setTimeout(() => {
          feedback.textContent = '';
          feedback.className = 'feedback';
        }, 2000);
      }
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', submitName);
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitName();
      });
      input.focus();
    }
  }

  function updateHomeButton() {
    const homeBtn = document.getElementById('btn-home');
    if (homeBtn) {
      homeBtn.style.display = currentTopic ? 'inline-block' : 'none';
    }
  }

  function updateTotalStars() {
    const el = document.getElementById('total-stars-display');
    if (el) {
      const total = Progress.getTotalStars();
      el.textContent = `⭐ Totale sterren: ${total}`;
    }
  }

  
  async function loadTopics() {
    const list = document.getElementById('topic-list');
    list.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">Onderwerpen laden...</p>';
  
    try {
      // Load the list of available topics
      const response = await fetch('./data/topics.json');
  
      if (!response.ok) {
        throw new Error('Kan topics.json niet laden');
      }
  
      const topicIndex = await response.json();
  
      if (!topicIndex.topics || !Array.isArray(topicIndex.topics)) {
        throw new Error('Ongeldig topics.json formaat');
      }
  
      const topics = topicIndex.topics;
  
      if (topics.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">Geen onderwerpen gevonden.</p>';
        return;
      }
  
      list.innerHTML = topics.map(topicId => `
        <div class="topic-card" data-topic-id="${topicId}">
          <div class="topic-icon">🏰</div>
          <div class="topic-name">${topicId}</div>
        </div>
      `).join('');
  
      list.querySelectorAll('.topic-card').forEach(card => {
        card.addEventListener('click', async () => {
          const topicId = card.dataset.topicId;
  
          try {
            const response = await fetch('./data/' + encodeURIComponent(topicId) + '.json');
  
            if (!response.ok) {
              throw new Error('Kan bestand niet laden: ' + topicId);
            }
  
            const data = await response.json();
  
            if (!data.words || !Array.isArray(data.words)) {
              throw new Error('Ongeldig formaat: geen "words" array gevonden');
            }
  
            currentTopic = data;
            currentTopicId = topicId;
  
            updateHomeButton();
            showDifficultyScreen();
  
          } catch (err) {
            alert('Fout bij laden van onderwerp: ' + err.message);
          }
        });
      });
  
    } catch (err) {
      list.innerHTML =
        '<p style="text-align:center;color:#999;grid-column:1/-1;">Fout bij laden: ' +
        err.message + '</p>';
    }
  }


  function showDifficultyScreen() {
    showScreen('screen-difficulty');
    document.getElementById('difficulty-topic-title').textContent =
      currentTopic.topic || currentTopicId;

    const list = document.getElementById('difficulty-list');
    list.innerHTML = DIFFICULTIES.map(d => {
      const unlocked = Progress.isUnlocked(currentTopicId, d.id);
      const stars = Progress.getStars(currentTopicId, d.id);
      const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      return `
        <div class="difficulty-card ${unlocked ? '' : 'locked'}" data-difficulty="${d.id}">
          <div class="diff-icon">${d.icon}</div>
          <div class="diff-info">
            <div class="diff-name">${d.name}</div>
            <div class="diff-desc">${d.desc}</div>
          </div>
          ${unlocked ? `<div class="diff-stars">${starStr}</div>` : `<div class="lock-icon">🔒</div>`}
        </div>
      `;
    }).join('');

    list.querySelectorAll('.difficulty-card').forEach(card => {
      card.addEventListener('click', () => {
        const diff = parseInt(card.dataset.difficulty);
        if (Progress.isUnlocked(currentTopicId, diff)) {
          currentDifficulty = diff;
          startGame();
        }
      });
    });
  }

  function startGame() {
    showScreen('screen-game');
    document.getElementById('game-difficulty-label').textContent =
      getDifficulty(currentDifficulty).name;
    document.getElementById('game-stars').textContent =
      '⭐'.repeat(Progress.getStars(currentTopicId, currentDifficulty));

    const gameArea = document.getElementById('game-area');

    if (currentDifficulty === 1) {
      document.getElementById('game-mascot').textContent = Game1.getMascotMessage();
      gameArea.innerHTML = Game1.initRound(
        currentTopic.words,
        currentDifficulty,
        (stars) => handleRoundComplete(stars)
      );
      Game1.attachEvents(gameArea);
    } else if (currentDifficulty === 2) {
      document.getElementById('game-mascot').textContent = Game2.getMascotMessage();
      gameArea.innerHTML = Game2.initRound(
        currentTopic.words,
        currentDifficulty,
        (stars) => handleRoundComplete(stars)
      );
      Game2.attachEvents(gameArea);
    } else if (currentDifficulty === 3) {
      document.getElementById('game-mascot').textContent = Game3.getMascotMessage();
      gameArea.innerHTML = Game3.initRound(
        currentTopic.words,
        currentDifficulty,
        (stars) => handleRoundComplete(stars)
      );
      Game3.attachEvents(gameArea);
    } else if (currentDifficulty === 4) {
      document.getElementById('game-mascot').textContent = Game4.getMascotMessage();
      gameArea.innerHTML = Game4.initRound(
        currentTopic.words,
        currentDifficulty,
        (stars) => handleRoundComplete(stars)
      );
      Game4.attachEvents(gameArea);
    }
  }

  function handleRoundComplete(stars) {
    const result = Progress.recordResult(currentTopicId, currentDifficulty, stars);
    updateTotalStars();
    showScreen('screen-complete');

    const mascots = { 3: '🧙‍♂️', 2: '🦉', 1: '🧝‍♀️' };
    const messages = {
      3: 'Perfect! Je bent een ware tovenaar! ⚡',
      2: 'Goed gedaan! Blijf oefenen! 🪄',
      1: 'Goed begonnen! Probeer het opnieuw! 🎯'
    };

    document.getElementById('complete-mascot').textContent = mascots[stars];
    document.getElementById('complete-title').textContent =
      stars >= 2 ? 'Gefeliciteerd!' : 'Ronde Afgerond!';
    document.getElementById('complete-stars').textContent =
      '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('complete-message').textContent = messages[stars];

    const actions = document.getElementById('complete-actions');
    actions.innerHTML = '';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-secondary';
    retryBtn.textContent = '🔄 Opnieuw Spelen';
    retryBtn.addEventListener('click', startGame);
    actions.appendChild(retryBtn);

    const next = getDifficulty(currentDifficulty + 1);
    if (next && result.completed && result.stars >= 2) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-success';
      nextBtn.textContent = `➡️ Speel ${next.name}`;
      nextBtn.addEventListener('click', () => {
        currentDifficulty = currentDifficulty + 1;
        startGame();
      });
      actions.appendChild(nextBtn);
    }

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← Spelletjes Kies';
    backBtn.addEventListener('click', showDifficultyScreen);
    actions.appendChild(backBtn);
  }

  function setupNavigation() {
    document.getElementById('btn-back').addEventListener('click', () => {
      currentTopic = null;
      currentTopicId = null;
      currentDifficulty = null;
      updateHomeButton();
      showScreen('screen-welcome');
    });

    document.getElementById('btn-diff-back').addEventListener('click', () => {
      currentTopic = null;
      currentTopicId = null;
      currentDifficulty = null;
      updateHomeButton();
      showScreen('screen-welcome');
      loadTopics();
    });

    const homeBtn = document.getElementById('btn-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        currentTopic = null;
        currentTopicId = null;
        currentDifficulty = null;
        updateHomeButton();
        showScreen('screen-welcome');
        loadTopics();
      });
    }
  }

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
