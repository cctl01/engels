/**
 * Game 3: Listen & Choose
 * An English word is spoken (TTS), player selects the correct Dutch translation
 */
const Game3 = (() => {
  let state = {
    words: [],
    pairs: [],
    currentIndex: 0,
    mistakes: 0,
    onRoundComplete: null,
    voice: null
  };

  /**
   * Pick the best available English voice.
   *
   * Preference:
   * 1. Default British English voice
   * 2. Any British English voice
   * 3. Any English voice
   * 4. Browser fallback
   */
  function pickVoice() {
    const voices = speechSynthesis.getVoices();

    return (
      voices.find(v => v.lang === 'en-GB' && v.default) ||
      voices.find(v => v.lang === 'en-GB') ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  }

  /**
   * Update the cached voice.
   *
   * Browsers may load the list of available TTS voices asynchronously,
   * so this function is also called whenever "voiceschanged" fires.
   */
  function updateVoice() {
    state.voice = pickVoice();
  }

  // Try immediately in case voices are already available.
  updateVoice();

  // Update again when the browser finishes loading/changing its voices.
  if ('speechSynthesis' in window) {
    speechSynthesis.addEventListener('voiceschanged', updateVoice);
  }

  /**
   * Initialize a round
   */
  function initRound(words, difficulty, onRoundComplete) {
    state.mistakes = 0;
    state.currentIndex = 0;
    state.onRoundComplete = onRoundComplete;

    // Refresh the voice in case the browser has loaded more voices since startup.
    updateVoice();

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

    // Get all words for this round to build options
    const allDutch = state.pairs.map(p => p.dutch);
    const options = buildOptions(allDutch, word.dutch);

    return `
      <div class="listen-game">
        <div class="listen-progress">${progress} / ${total}</div>

        <div class="listen-icon">🔊</div>

        <div class="listen-label">
          Luister goed en kies het goede woord!
        </div>

        <button
          id="listen-replay"
          class="btn btn-secondary listen-replay-btn"
        >
          🔁 Opnieuw Luisteren
        </button>

        <div class="listen-options">
          ${options.map(opt => `
            <button
              class="listen-option"
              data-dutch="${opt}"
              data-correct="${opt === word.dutch}"
            >
              ${opt}
            </button>
          `).join('')}
        </div>

        <div id="listen-feedback" class="feedback"></div>
      </div>
    `;
  }

  function buildOptions(allDutch, correct) {
    // Pick 3 wrong answers
    const wrong = allDutch.filter(d => d !== correct);
    const shuffledWrong = shuffle([...wrong]).slice(0, 3);

    return shuffle([correct, ...shuffledWrong]);
  }

  /**
   * Attach event listeners to a game area
   */
  function attachEvents(gameArea) {
    const replayBtn = gameArea.querySelector('#listen-replay');
    const options = gameArea.querySelectorAll('.listen-option');

    // Speak the current word automatically
    speakCurrentWord();

    if (replayBtn) {
      replayBtn.addEventListener('click', speakCurrentWord);
    }

    options.forEach(btn => {
      btn.addEventListener('click', () => handleOptionClick(btn));
    });

    /**
     * Speak the current English word.
     */
    function speakCurrentWord() {
      speechSynthesis.cancel();

      const word = state.pairs[state.currentIndex].english;

      // The voice list may have become available since the previous attempt.
      if (!state.voice) {
        updateVoice();
      }

      const utterance = new SpeechSynthesisUtterance(word);

      // VERY IMPORTANT:
      // Tell the browser that this is English even if no explicit
      // English voice has been selected yet.
      utterance.lang = 'en-GB';

      if (state.voice) {
        utterance.voice = state.voice;
      }

      // Slightly slower than normal speech for language learning.
      utterance.rate = 0.85;

      speechSynthesis.speak(utterance);
    }

    function handleOptionClick(btn) {
      if (btn.disabled) return;

      const isCorrect = btn.dataset.correct === 'true';

      if (isCorrect) {
        btn.classList.add('correct');

        showFeedback(true, 'Goed zo! ✨');

        // Disable all options
        options.forEach(o => {
          o.disabled = true;
        });

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
        }, 1000);

      } else {
        state.mistakes++;

        showFeedback(
          false,
          'Nee, dat is niet goed. Probeer opnieuw! 🪄'
        );

        btn.disabled = true;
        btn.classList.add('wrong');

        setTimeout(() => {
          btn.classList.remove('wrong');
        }, 500);
      }
    }
  }

  /**
   * Calculate the round score.
   */
  function calculateStars() {
    if (state.mistakes === 0) return 3;
    if (state.mistakes <= 2) return 2;

    return 1;
  }

  function showFeedback(isCorrect, message) {
    const feedbackEl = document.getElementById('listen-feedback');

    if (feedbackEl) {
      feedbackEl.textContent = message;
      feedbackEl.className =
        'feedback ' + (isCorrect ? 'correct' : 'wrong');

      setTimeout(() => {
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback';
      }, 1500);
    }
  }

  function getMascotMessage() {
    const messages = [
      'Luister goed! 👂',
      'Welk woord hoor je? 🎧',
      'Kies het goede Nederlandse woord! 🏰',
      'Je kunt dit! ✨'
    ];

    return messages[
      Math.floor(Math.random() * messages.length)
    ];
  }

  return {
    initRound,
    attachEvents,
    getMascotMessage
  };
})();