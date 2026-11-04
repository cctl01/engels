/**
 * Game 1: Word Match
 * Drag English words to Dutch translations (or vice versa)
 */
const Game1 = (() => {
  let state = {
    words: [],
    difficulty: 1,       // 1=EN→NL, 2=NL→EN, 3=Listen→Match
    pairs: [],           // current round pairs
    matched: 0,
    mistakes: 0,
    dragging: null,
    onRoundComplete: null
  };

  /**
   * Initialize a round
   */
  function initRound(words, difficulty, onRoundComplete) {
    state.difficulty = difficulty;
    state.matched = 0;
    state.mistakes = 0;
    state.onRoundComplete = onRoundComplete;

    // Shuffle and pick words (more words for higher difficulty)
    const count = Math.min(words.length, getWordCount(difficulty));
    const shuffled = shuffle([...words]).slice(0, count);
    state.pairs = shuffled.map(w => ({
      english: w.english,
      dutch: w.dutch,
      image: w.image
    }));

    return renderGame();
  }

  function getWordCount(difficulty) {
    // Easy: 4 words, Medium: 6 words, Hard: 8 words
    return [4, 6, 8][difficulty - 1] || 4;
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
    const isENtoNL = state.difficulty === 1;
    const leftLabel = isENtoNL ? '🇬🇧 English' : '🇳🇱 Nederlands';
    const rightLabel = isENtoNL ? '🇳🇱 Nederlands' : '🇬🇧 English';

    const leftWords = state.pairs.map((p, i) => ({
      id: `left-${i}`,
      text: isENtoNL ? p.english : p.dutch,
      pairIndex: i,
      lang: isENtoNL ? 'en' : 'nl'
    }));

    const rightWords = shuffle(state.pairs.map((p, i) => ({
      id: `right-${i}`,
      text: isENtoNL ? p.dutch : p.english,
      pairIndex: i,
      lang: isENtoNL ? 'nl' : 'en'
    })));

    return `
      <div class="game-column">
        <div class="game-column-title">${leftLabel}</div>
        ${leftWords.map(w => {
          const img = state.pairs[w.pairIndex].image;
          return `
            <div class="word-card" draggable="true" data-pair="${w.pairIndex}" data-side="left" data-lang="${w.lang}">
              ${w.text}
            </div>
          `;
        }).join('')}
      </div>
      <div class="game-column">
        <div class="game-column-title">${rightLabel}</div>
        ${rightWords.map(w => {
          const img = state.pairs[w.pairIndex].image;
          return `
            <div class="word-card" data-pair="${w.pairIndex}" data-side="right" data-lang="${w.lang}">
              <div class="card-image"><img src="${img}" alt="" style="max-height:100px;"></div>
              ${w.text}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Attach event listeners to a game area
   */
  function attachEvents(gameArea) {
    const cards = gameArea.querySelectorAll('.word-card');

    cards.forEach(card => {
      // Drag events
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragend', handleDragEnd);
      // Drop events
      card.addEventListener('dragover', handleDragOver);
      card.addEventListener('dragenter', handleDragEnter);
      card.addEventListener('dragleave', handleDragLeave);
      card.addEventListener('drop', handleDrop);
      // Click events (for mobile/touch fallback)
      card.addEventListener('click', handleClick);
    });
  }

  let selectedCard = null;

  function handleDragStart(e) {
    if (this.classList.contains('matched')) {
      e.preventDefault();
      return;
    }
    state.dragging = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.pair);
  }

  function handleDragEnd(e) {
    this.classList.remove('dragging');
    state.dragging = null;
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(e) {
    e.preventDefault();
    if (!this.classList.contains('matched') && this !== state.dragging) {
      this.classList.add('drop-target');
    }
  }

  function handleDragLeave(e) {
    this.classList.remove('drop-target');
  }

  function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drop-target');

    if (!state.dragging || this === state.dragging) return;
    if (this.classList.contains('matched') || state.dragging.classList.contains('matched')) return;

    // Only allow matching left to right
    if (this.dataset.side !== 'right' || state.dragging.dataset.side !== 'left') return;

    checkMatch(state.dragging, this);
  }

  function handleClick(e) {
    const card = this;
    if (card.classList.contains('matched')) return;

    if (!selectedCard) {
      // First click — select a left card
      if (card.dataset.side === 'left') {
        selectedCard = card;
        card.style.border = '3px solid #7c4dff';
        card.style.background = '#ede7f6';
      }
    } else {
      // Second click — try to match
      if (selectedCard.dataset.side === 'left' && card.dataset.side === 'right') {
        checkMatch(selectedCard, card);
      }
      // Deselect
      selectedCard.style.border = '';
      selectedCard.style.background = '';
      selectedCard = null;
    }
  }

  function checkMatch(leftCard, rightCard) {
    const leftPair = parseInt(leftCard.dataset.pair);
    const rightPair = parseInt(rightCard.dataset.pair);

    if (leftPair === rightPair) {
      // Correct match!
      leftCard.classList.add('matched');
      rightCard.classList.add('matched');
      leftCard.draggable = false;
      state.matched++;

      showFeedback(true, 'Goed zo! ✨');

      if (state.matched === state.pairs.length) {
        // Round complete!
        setTimeout(() => {
          const stars = calculateStars();
          if (state.onRoundComplete) {
            state.onRoundComplete(stars);
          }
        }, 600);
      }
    } else {
      // Wrong match
      state.mistakes++;
      leftCard.classList.add('wrong');
      rightCard.classList.add('wrong');
      showFeedback(false, `Nee, dat is niet goed. Probeer opnieuw! 🪄`);

      setTimeout(() => {
        leftCard.classList.remove('wrong');
        rightCard.classList.remove('wrong');
      }, 500);
    }
  }

  function calculateStars() {
    if (state.mistakes === 0) return 3;
    if (state.mistakes <= 2) return 2;
    return 1;
  }

  function showFeedback(isCorrect, message) {
    const feedbackEl = document.getElementById('game-feedback');
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');
      setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback';
      }, 1500);
    }
  }

  function getMascotMessage() {
    const messages = [
      'Succes, jongen/meisje! Je kunt dit! ⚡',
      'Let goed op de plaatjes! 👀',
      'Sleep het Engelse woord naar het Nederlandse woord! 🎯',
      'Je doet het geweldig! 💫',
      'Tover de woorden samen! ✨',
      'Hogwarts is trots op je! 🏰'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  return {
    initRound,
    attachEvents,
    getMascotMessage,
    getWordCount
  };
})();
