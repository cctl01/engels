/**
 * Game 5: Sentence Builder (Zinnenmagiër)
 * A Dutch sentence is shown. The player rebuilds the English sentence by
 * tapping the shuffled word tiles. Tapping a placed tile puts it back.
 */
const Game5 = (() => {
  const MAX_SENTENCES = 5;

  // Wrong attempts on the same sentence before the answer is revealed
  const REVEAL_AFTER = 2;

  let state = {
    sentences: [],
    index: 0,
    mistakes: 0,
    sentenceMistakes: 0,
    bank: [],
    answer: [],
    locked: false,
    onRoundComplete: null
  };

  /**
   * Initialize a round
   */
  function initRound(sentences, difficulty, onRoundComplete) {
    state.mistakes = 0;
    state.index = 0;
    state.onRoundComplete = onRoundComplete;

    const shuffled = shuffle([...(sentences || [])]);
    state.sentences = shuffled.slice(0, MAX_SENTENCES).map(normalizeSentence);

    setupSentence();

    return renderGame();
  }

  /**
   * Accept both "english": "The cat sits on the chair." and
   * "english": ["The", "cat", "sits", "on", "the", "chair"]
   */
  function normalizeSentence(s) {
    const english = Array.isArray(s.english) ? s.english.join(' ') : String(s.english);

    return {
      dutch: String(s.dutch).trim(),
      english: english.trim(),
      words: Array.isArray(s.english) ? toWords(s.english) : toWords(english)
    };
  }

  /**
   * Split a sentence into word tiles without punctuation, so a tile never
   * shows "chair." or "pencil,". Apostrophes inside a word are kept.
   */
  function toWords(english) {
    const list = Array.isArray(english) ? english : String(english).split(/\s+/);

    return list
      .map(w => String(w).replace(/^[^A-Za-z0-9'’]+/, '').replace(/[^A-Za-z0-9'’]+$/, ''))
      .filter(w => w.length > 0);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function current() {
    return state.sentences[state.index];
  }

  /**
   * Reset the tiles for the current sentence
   */
  function setupSentence() {
    const sentence = current();

    state.sentenceMistakes = 0;
    state.answer = [];
    state.locked = false;

    state.bank = shuffle(sentence.words.map((word, i) => ({ id: i, word, used: false })));

    // A bank that happens to read left-to-right as the answer is too easy
    if (state.bank.map(t => t.word).join(' ') === sentence.words.join(' ')) {
      state.bank.reverse();
    }
  }

  /**
   * Render the game area
   */
  function renderGame() {
    const sentence = current();
    const progress = state.index + 1;
    const total = state.sentences.length;

    return `
      <div class="build-game">
        <div class="build-progress">${progress} / ${total}</div>

        <div class="build-dutch">${sentence.dutch}</div>

        <div class="build-label">Maak van de woorden hieronder de Engelse zin!</div>

        <div class="build-answer" id="build-answer">${answerHtml()}</div>

        <div class="build-bank" id="build-bank">${bankHtml()}</div>

        <div class="build-actions">
          <button id="build-check" class="btn btn-primary" disabled>Controleer ✓</button>
          <button id="build-clear" class="btn btn-secondary">Wissen</button>
        </div>

        <div id="build-feedback" class="feedback"></div>
      </div>
    `;
  }

  function answerHtml() {
    const total = current().words.length;
    const slots = [];

    for (let i = 0; i < total; i++) {
      const id = state.answer[i];
      slots.push(
        '<div class="build-slot">' + (id === undefined ? '' : chipHtml(id, true)) + '</div>'
      );
    }

    return slots.join('');
  }

  function bankHtml() {
    return state.bank
      .filter(t => !t.used)
      .map(t => chipHtml(t.id, false))
      .join('');
  }

  function chipHtml(id, inAnswer) {
    const tile = state.bank.find(t => t.id === id);
    if (!tile) return '';

    // In the bank every tile is lowercase: a capital letter would mark the
    // first word of the sentence. Once placed, the real spelling shows again,
    // so the finished sentence still reads correctly and "I" stays "I".
    const text = inAnswer ? tile.word : tile.word.toLowerCase();

    return `<button class="build-chip ${inAnswer ? 'in-answer' : ''}" data-id="${id}">${text}</button>`;
  }

  function refreshBoard() {
    const answerEl = document.getElementById('build-answer');
    const bankEl = document.getElementById('build-bank');

    if (answerEl) answerEl.innerHTML = answerHtml();
    if (bankEl) bankEl.innerHTML = bankHtml();

    setCheckEnabled(!state.locked && state.answer.length === current().words.length);
  }

  function setCheckEnabled(enabled) {
    const btn = document.getElementById('build-check');
    if (btn) btn.disabled = !enabled;
  }

  /**
   * Attach event listeners to a game area
   */
  function attachEvents(gameArea) {
    const answerEl = gameArea.querySelector('#build-answer');
    const bankEl = gameArea.querySelector('#build-bank');
    const checkBtn = gameArea.querySelector('#build-check');
    const clearBtn = gameArea.querySelector('#build-clear');

    if (answerEl) {
      answerEl.addEventListener('click', e => {
        const chip = e.target.closest('.build-chip');
        if (chip) returnToBank(parseInt(chip.dataset.id));
      });
    }

    if (bankEl) {
      bankEl.addEventListener('click', e => {
        const chip = e.target.closest('.build-chip');
        if (chip) placeWord(parseInt(chip.dataset.id));
      });
    }

    if (checkBtn) checkBtn.addEventListener('click', check);

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (state.locked) return;
        state.answer = [];
        state.bank.forEach(t => { t.used = false; });
        clearFeedback();
        refreshBoard();
      });
    }
  }

  function placeWord(id) {
    if (state.locked) return;

    const tile = state.bank.find(t => t.id === id);
    if (!tile || tile.used) return;

    tile.used = true;
    state.answer.push(id);

    clearFeedback();
    refreshBoard();
  }

  function returnToBank(id) {
    if (state.locked) return;

    const at = state.answer.indexOf(id);
    if (at === -1) return;

    state.answer.splice(at, 1);

    const tile = state.bank.find(t => t.id === id);
    if (tile) tile.used = false;

    clearFeedback();
    refreshBoard();
  }

  function compare() {
    return current().words.map((word, i) => {
      const tile = state.bank.find(t => t.id === state.answer[i]);
      return !!tile && sameWord(tile.word, word);
    });
  }

  /**
   * Ignore case, apostrophes and leftover punctuation
   */
  function sameWord(a, b) {
    const clean = w => w.toLowerCase().replace(/['’]/g, '');
    return clean(a) === clean(b);
  }

  function check() {
    if (state.locked) return;
    if (state.answer.length !== current().words.length) return;

    const flags = compare();
    const correctCount = flags.filter(Boolean).length;
    markSlots(flags);

    if (correctCount === current().words.length) {
      state.locked = true;
      setCheckEnabled(false);
      showFeedback(true, 'Perfecte zin! ✨');
      advanceAfter(1500);
      return;
    }

    state.mistakes++;
    state.sentenceMistakes++;

    if (state.sentenceMistakes >= REVEAL_AFTER) {
      state.locked = true;
      setCheckEnabled(false);
      revealAnswer();
      showFeedback(false, `De juiste zin is: ${current().english} 🪄`);
      advanceAfter(5000);
    } else {
      showFeedback(
        false,
        `Bijna! ${correctCount} van de ${current().words.length} woorden staan goed. 🪄`
      );
    }
  }

  /**
   * Colour the placed tiles green (right place) or red (wrong place)
   */
  function markSlots(flags) {
    const answerEl = document.getElementById('build-answer');
    if (!answerEl) return;

    answerEl.querySelectorAll('.build-chip').forEach((chip, i) => {
      chip.classList.remove('right', 'wrong');
      chip.classList.add(flags[i] ? 'right' : 'wrong');
    });
  }

  /**
   * Fill the slots with the correct sentence so the player can see it
   */
  function revealAnswer() {
    const answerEl = document.getElementById('build-answer');
    const bankEl = document.getElementById('build-bank');

    if (answerEl) {
      answerEl.innerHTML = current().words
        .map(w => `<button class="build-chip in-answer right">${w}</button>`)
        .join('');
    }
    if (bankEl) bankEl.innerHTML = '';
  }

  function advanceAfter(ms) {
    setTimeout(() => {
      state.index++;

      if (state.index < state.sentences.length) {
        setupSentence();

        const gameAreaEl = document.getElementById('game-area');
        gameAreaEl.innerHTML = renderGame();
        attachEvents(gameAreaEl);
      } else {
        const stars = calculateStars();

        if (state.onRoundComplete) {
          state.onRoundComplete(stars);
        }
      }
    }, ms);
  }

  function calculateStars() {
    if (state.mistakes === 0) return 3;
    if (state.mistakes <= 2) return 2;

    return 1;
  }

  function showFeedback(isCorrect, message) {
    const feedbackEl = document.getElementById('build-feedback');

    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');

      clearTimeout(feedbackEl.timer);
      feedbackEl.timer = setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback';
      }, 4500);
    }
  }

  function clearFeedback() {
    const feedbackEl = document.getElementById('build-feedback');

    if (feedbackEl) {
      clearTimeout(feedbackEl.timer);
      feedbackEl.textContent = '';
      feedbackEl.className = 'feedback';
    }
  }

  function getMascotMessage() {
    const name = Progress.getPlayerName() || 'Kanjer';
    const messages = [
      'Klik de woorden in de goede volgorde! 🔤',
      `Jij kunt zinnen toveren, ${name}! 🪄`,
      'Lees de Nederlandse zin en maak hem Engels! ✨',
      'Klik een woord aan om het te plaatsen! 🧙‍♂️',
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
