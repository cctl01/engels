/**
 * Game 4: Memory
 * Flip cards to find the pair of an English word and its Dutch translation.
 * One extra "wizard" card without a pair is added so the last pair is not a
 * dead giveaway. Only the Dutch card shows the image, so the game cannot be
 * won by matching pictures.
 */
const Game4 = (() => {
  const MAX_PAIRS = 7;

  let state = {
    pairs: [],
    cards: [],
    flipped: [],
    matched: 0,
    mistakes: 0,
    locked: false,
    onRoundComplete: null
  };

  /**
   * Initialize a round
   */
  function initRound(words, difficulty, onRoundComplete) {
    state.pairs = [];
    state.cards = [];
    state.flipped = [];
    state.matched = 0;
    state.mistakes = 0;
    state.locked = false;
    state.onRoundComplete = onRoundComplete;

    const count = Math.min(words.length, MAX_PAIRS);
    const shuffled = shuffle([...words]).slice(0, count);
    state.pairs = shuffled.map(w => ({
      english: w.english,
      dutch: w.dutch,
      image: w.image
    }));
    state.cards = buildDeck(state.pairs);

    return renderGame();
  }

  /**
   * Build the deck: one card per language per pair, plus one unpaired card
   */
  function buildDeck(pairs) {
    const cards = [];

    pairs.forEach((p, i) => {
      cards.push({ pair: i, lang: 'nl', text: p.dutch, image: p.image });
      cards.push({ pair: i, lang: 'en', text: p.english, image: null });
    });

    if (pairs.length >= 2) {
      cards.push({ pair: -1, lang: 'extra', text: '', image: null });
    }

    return shuffle(cards);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Render the game area
   */
  function renderGame() {
    const total = state.cards.length;
    const cols = gridColumns(total);
    const colsSmall = gridColumnsSmall(total);

    return `
      <div class="memory-game" style="--memory-cols:${cols}; --memory-cols-small:${colsSmall};">
        <div class="memory-status" id="memory-status">${statusText()}</div>
        <div class="memory-grid">
          ${state.cards.map((card, i) => cardHtml(card, i)).join('')}
        </div>
      </div>
    `;
  }

  function cardHtml(card, index) {
    if (card.lang === 'extra') {
      return `
        <div class="memory-card" data-index="${index}" data-pair="-1">
          <div class="memory-inner">
            <div class="memory-face memory-cover">🪄</div>
            <div class="memory-face memory-word memory-extra">
              <span class="memory-emoji">🧙‍♂️</span>
              <span class="memory-text">Geen paar</span>
            </div>
          </div>
        </div>
      `;
    }

    const flag = card.lang === 'nl' ? '🇳🇱' : '🇬🇧';
    const image = card.image
      ? `<img src="${card.image}" alt="" onerror="this.style.display='none'">`
      : '';
    const sizeClass = textSizeClass(card.text);

    return `
      <div class="memory-card" data-index="${index}" data-pair="${card.pair}">
        <div class="memory-inner">
          <div class="memory-face memory-cover">🪄</div>
          <div class="memory-face memory-word ${sizeClass}">
            <span class="memory-flag">${flag}</span>
            ${image}
            <span class="memory-text">${card.text}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Pick a smaller font for longer words so phrases still fit on a card
   */
  function textSizeClass(text) {
    if (text.length > 18) return 'text-tiny';
    if (text.length > 10) return 'text-small';
    return '';
  }

  function gridColumns(total) {
    if (total <= 4) return 2;
    if (total <= 6) return 3;
    if (total <= 12) return 4;
    return 5;
  }

  function gridColumnsSmall(total) {
    // Phones are narrow: never more than 3 columns, otherwise the text on
    // cards with long phrases becomes too small to read. The grid scrolls.
    return total <= 4 ? 2 : 3;
  }

  function statusText() {
    return `Paren: ${state.matched} / ${state.pairs.length} · Fouten: ${state.mistakes}`;
  }

  function updateStatus() {
    const el = document.getElementById('memory-status');
    if (el) el.textContent = statusText();
  }

  /**
   * Attach event listeners to a game area
   */
  function attachEvents(gameArea) {
    gameArea.querySelectorAll('.memory-card').forEach(card => {
      card.addEventListener('click', () => handleFlip(card));
    });
  }

  function handleFlip(card) {
    if (state.locked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    state.flipped.push(card);

    if (state.flipped.length < 2) return;

    const [first, second] = state.flipped;
    const pairA = first.dataset.pair;
    const pairB = second.dataset.pair;

    if (pairA === pairB && pairA !== '-1') {
      // Found a pair
      state.flipped = [];
      state.matched++;
      first.classList.add('matched');
      second.classList.add('matched');
      updateStatus();
      showFeedback(true, 'Paar gevonden! ✨');

      if (state.matched === state.pairs.length) {
        state.locked = true;
        setTimeout(() => {
          const stars = calculateStars();
          if (state.onRoundComplete) {
            state.onRoundComplete(stars);
          }
        }, 1000);
      }
    } else {
      // No pair — flip both back
      state.mistakes++;
      state.locked = true;
      first.classList.add('wrong');
      second.classList.add('wrong');
      updateStatus();
      showFeedback(false, 'Geen paar. Onthoud waar de kaarten liggen! 🧠');

      setTimeout(() => {
        first.classList.remove('flipped', 'wrong');
        second.classList.remove('flipped', 'wrong');
        state.flipped = [];
        state.locked = false;
      }, 2000);
    }
  }

  /**
   * Memory has more flips than the other games, so the thresholds scale with
   * the number of pairs instead of using a flat 0/2 mistake limit.
   */
  function calculateStars() {
    const pairs = state.pairs.length;
    if (state.mistakes <= Math.ceil(pairs * 1.5)) return 3;
    if (state.mistakes <= pairs * 2) return 2;
    return 1;
  }

  function showFeedback(isCorrect, message) {
    const feedbackEl = document.getElementById('game-feedback');
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');
      clearTimeout(feedbackEl.timer);
      feedbackEl.timer = setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback';
      }, 1500);
    }
  }

  function getMascotMessage() {
    const name = Progress.getPlayerName() || 'Kanjer';
    const messages = [
      'Onthoud waar de kaarten liggen! 🧠',
      `Jij hebt een perfect geheugen, ${name}! 🧙‍♂️`,
      'Alles omdraaien en goed kijken! 🪄',
      'Koppel het Engelse woord aan het Nederlandse woord! 🃏',
      'Hogwarts is trots op je! 🏰'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  return {
    initRound,
    attachEvents,
    getMascotMessage
  };
})();
