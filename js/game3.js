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
   * Initialize a round
   */
  function initRound(words, difficulty, onRoundComplete) {
    state.mistakes = 0;
    state.currentIndex = 0;
    state.onRoundComplete = onRoundComplete;

    // Pick an English voice if available
    state.voice = pickVoice();

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

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    // Try to find "Samantha" first
    let voice = voices.find(v => v.name === 'Samantha' && v.lang.startsWith('en'));
    if (voice) return voice;
    // Fallback to any English voice
    voice = voices.find(v => v.lang.startsWith('en'));
    return voice;
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
        <div class="listen-label">Luister goed en kies het goede woord!</div>
        <button id="listen-replay" class="btn btn-secondary listen-replay-btn">🔁 Opnieuw Luisteren</button>
        <div class="listen-options">
          ${options.map((opt, i) => `
            <button class="listen-option" data-dutch="${opt}" data-correct="${opt === word.dutch}">
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
    const options = shuffle([correct, ...shuffledWrong]);
    return options;
  }

  /**
   * Attach event listeners to a game area
   */
  function attachEvents(gameArea) {
    const replayBtn = gameArea.querySelector('#listen-replay');
    const options = gameArea.querySelectorAll('.listen-option');

    // Speak the current word
    speakCurrentWord();

    if (replayBtn) {
      replayBtn.addEventListener('click', speakCurrentWord);
    }

    options.forEach(btn => {
      btn.addEventListener('click', () => handleOptionClick(btn));
    });

    function speakCurrentWord() {
      speechSynthesis.cancel();
      const word = state.pairs[state.currentIndex].english;
      const u = new SpeechSynthesisUtterance(word);
      if (state.voice) u.voice = state.voice;
      u.rate = 0.85;
      speechSynthesis.speak(u);
    }

    function handleOptionClick(btn) {
      if (btn.disabled) return;

      const isCorrect = btn.dataset.correct === 'true';

      if (isCorrect) {
        btn.classList.add('correct');
        showFeedback(true, 'Goed zo! ✨');

        // Disable all options
        options.forEach(o => o.disabled = true);

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
        btn.classList.add('wrong');
        state.mistakes++;
        showFeedback(false, `Nee, dat is niet goed. Probeer opnieuw! 🪄`);
        btn.disabled = true;
        btn.classList.add('wrong');
        setTimeout(() => {
          btn.classList.remove('wrong');
        }, 500);
      }
    }
  }

  function calculateStars() {
    if (state.mistakes === 0) return 3;
    if (state.mistakes <= 2) return 2;
    return 1;
  }

  function showFeedback(isCorrect, message) {
    const feedbackEl = document.getElementById('listen-feedback');
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
      'Luister goed! 👂',
      'Welk woord hoor je? 🎧',
      'Kies het goede Nederlandse woord! 🏰',
      'Je kunt dit! ✨'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  return {
    initRound,
    attachEvents,
    getMascotMessage
  };
})();
