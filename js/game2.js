/**
 * Game 2: Type the Translation
 * Dutch word shown with image, player types the English translation
 */
const Game2 = (() => {
  let state = {
    words: [],
    pairs: [],
    currentIndex: 0,
    mistakes: 0,
    wordMistakes: 0,
    onRoundComplete: null
  };

  /**
   * Initialize a round
   */
  function initRound(words, difficulty, onRoundComplete) {
    state.mistakes = 0;
    state.currentIndex = 0;
    state.onRoundComplete = onRoundComplete;

    // Shuffle and pick words
    const count = Math.min(words.length, 5);
    const shuffled = shuffle([...words]).slice(0, count);
    state.pairs = shuffled.map(w => ({
      english: w.english,
      dutch: w.dutch,
      image: w.image
    }));

    return renderGame();
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
    const word = state.pairs[state.currentIndex];
    const progress = state.currentIndex + 1;
    const total = state.pairs.length;

    state.wordMistakes = 0;

    return `
      <div class="type-game">
        <div class="type-progress">${progress} / ${total}</div>
        <div class="type-image">
          <img src="${word.image}" alt="" style="max-height:200px;">
        </div>
        <div class="type-word">${word.dutch}</div>
        <div class="type-label">Hoe heet dit in het Engels?</div>
        <div class="type-input-area">
          <input type="text" id="type-answer" class="type-input" placeholder="Typ het Engelse woord..." autocomplete="off" spellcheck="false">
          <button id="type-submit" class="btn btn-primary">Controleer</button>
        </div>
        <div id="type-feedback" class="feedback"></div>
      </div>
    `;
  }

  /**
   * Attach event listeners to a game area
   */
  function attachEvents(gameArea) {
    const input = gameArea.querySelector('#type-answer');
    const submitBtn = gameArea.querySelector('#type-submit');

    if (input) {
      input.focus();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          checkAnswer();
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', checkAnswer);
    }

    function checkAnswer() {
      const answer = input.value.trim().toLowerCase();
      const correct = state.pairs[state.currentIndex].english.toLowerCase();

      if (!answer) return;

      if (answer.replace(/['’]/g, '') === correct.replace(/['’]/g, '')) {
        // Correct!
        showFeedback(true, 'Goed zo! ✨');
        input.disabled = true;
        submitBtn.disabled = true;

        setTimeout(() => {
          state.currentIndex++;
          if (state.currentIndex < state.pairs.length) {
            const gameAreaEl = document.getElementById('game-area');
            gameAreaEl.innerHTML = renderGame();
            attachEvents(gameAreaEl);
          } else {
            // Round complete
            const stars = calculateStars();
            if (state.onRoundComplete) {
              state.onRoundComplete(stars);
            }
          }
        }, 1000);
      } else {
        // Wrong
        state.mistakes++;
        state.wordMistakes++;
        if (state.wordMistakes >= 2) {
          showFeedback(false, `Het goede woord is: ${correct}! 🪄`);
          input.disabled = true;
          submitBtn.disabled = true;
          setTimeout(() => {
            state.currentIndex++;
            if (state.currentIndex < state.pairs.length) {
              const gameAreaEl = document.getElementById('game-area');
              gameAreaEl.innerHTML = renderGame();
              attachEvents(gameAreaEl);
            } else {
              const stars = calculateStars();
              if (state.onRoundComplete) {
                state.onRoundComplete(stars);
              }
            }
          }, 5000);
        } else {
          showFeedback(false, `Nee, dat is niet goed. Probeer opnieuw! 🪄`);
          input.value = '';
          input.focus();
        }
      }
    }
  }

  function calculateStars() {
    if (state.mistakes === 0) return 3;
    if (state.mistakes <= 2) return 2;
    return 1;
  }

  function showFeedback(isCorrect, message) {
    const feedbackEl = document.getElementById('type-feedback');
    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');
      setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback';
      }, 4500);
    }
  }

  function getMascotMessage() {
    const name = Progress.getPlayerName() || 'Kanjer';
    const messages = [
      `Typ het Engelse woord, ${name}! ⚡`,
      `Je kent ze wel, ${name}! 🏰`,
      'Focus! Het komt vast goed! ✨',
      'Succes! Je kunt dit! 💫'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  return {
    initRound,
    attachEvents,
    getMascotMessage
  };
})();
