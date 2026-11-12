/**
 * Progress tracking — saves to localStorage
 */
const Progress = (() => {
  const STORAGE_KEY = 'english-games-progress';
  const DIFFICULTY_COUNT = 4;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefault();
    } catch {
      return getDefault();
    }
  }

  function getDefault() {
    return {
      name: null,
      topics: {},
      totalStars: 0,
      streak: 0,
      lastPlayed: null
    };
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Progress entry for a single difficulty
   */
  function getDifficultyEntry() {
    return { stars: 0, completed: false };
  }

  /**
   * Progress entry for a topic, with all difficulties
   */
  function getTopicEntry() {
    const topic = {};
    for (let d = 1; d <= DIFFICULTY_COUNT; d++) {
      topic['difficulty' + d] = getDifficultyEntry();
    }
    return topic;
  }

  /**
   * Get or create progress for a topic
   */
  function getTopicProgress(topicId) {
    const data = load();
    if (!data.topics[topicId]) {
      data.topics[topicId] = getTopicEntry();
      save(data);
    }
    return data.topics[topicId];
  }

  /**
   * Record round result
   */
  function recordResult(topicId, difficulty, stars) {
    const data = load();
    if (!data.topics[topicId]) {
      data.topics[topicId] = getTopicEntry();
    }
    const topic = data.topics[topicId];
    const key = 'difficulty' + difficulty;

    // Older saves may not have this difficulty yet
    if (!topic[key]) {
      topic[key] = getDifficultyEntry();
    }
    const diff = topic[key];

    // Only update if better score
    if (stars > diff.stars) {
      diff.stars = stars;
    }
    if (stars >= 2) {
      diff.completed = true;
    }

    data.totalStars = calculateTotalStars(data);
    data.streak = calculateStreak(data);
    data.lastPlayed = new Date().toISOString();

    save(data);
    return diff;
  }

  function calculateTotalStars(data) {
    let total = 0;
    for (const topicId in data.topics) {
      const topic = data.topics[topicId];
      for (let d = 1; d <= DIFFICULTY_COUNT; d++) {
        total += (topic['difficulty' + d]?.stars || 0);
      }
    }
    return total;
  }

  function calculateStreak(data) {
    // Simple streak: count consecutive days played
    // For now, just return a basic counter
    return data.streak || 0;
  }

  /**
   * Check if a difficulty is unlocked
   * Difficulty 1 always unlocked. Difficulty N+1 unlocked if difficulty N has 2+ stars.
   */
  function isUnlocked(topicId, difficulty) {
    const progress = getTopicProgress(topicId);
    if (difficulty === 1) return true;
    const prev = progress['difficulty' + (difficulty - 1)];
    return prev && prev.completed && prev.stars >= 2;
  }

  /**
   * Get stars for a difficulty
   */
  function getStars(topicId, difficulty) {
    const progress = getTopicProgress(topicId);
    return progress['difficulty' + difficulty]?.stars || 0;
  }

  /**
   * Check if all difficulties are completed for a topic
   */
  function isTopicComplete(topicId) {
    const progress = getTopicProgress(topicId);
    for (let d = 1; d <= DIFFICULTY_COUNT; d++) {
      if (!progress['difficulty' + d]?.completed) return false;
    }
    return true;
  }

  /**
   * Get total stars across all topics
   */
  function getTotalStars() {
    const data = load();
    return calculateTotalStars(data);
  }

  /**
   * Get the player's name
   */
  function getPlayerName() {
    const data = load();
    return data.name || null;
  }

  /**
   * Set the player's name (only if not already set)
   */
  function setPlayerName(name) {
    const data = load();
    if (data.name) return data.name; // already set, ignore
    data.name = name.trim();
    if (!data.name) return null;
    save(data);
    return data.name;
  }

  return {
    load,
    getTopicProgress,
    recordResult,
    isUnlocked,
    getStars,
    isTopicComplete,
    getTotalStars,
    getPlayerName,
    setPlayerName
  };
})();
