/**
 * Progress tracking — saves to localStorage
 */
const Progress = (() => {
  const STORAGE_KEY = 'english-games-progress';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefault();
    } catch {
      return getDefault();
    }
  }

  function getDefault() {
    return {
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
   * Get or create progress for a topic
   */
  function getTopicProgress(topicId) {
    const data = load();
    if (!data.topics[topicId]) {
      data.topics[topicId] = {
        difficulty1: { stars: 0, completed: false },
        difficulty2: { stars: 0, completed: false },
        difficulty3: { stars: 0, completed: false }
      };
      save(data);
    }
    return data.topics[topicId];
  }

  /**
   * Record round result
   */
  function recordResult(topicId, difficulty, stars) {
    const data = load();
    const topic = data.topics[topicId];
    const diff = topic['difficulty' + difficulty];

    // Only update if better score
    if (stars > diff.stars) {
      diff.stars = stars;
    }
    if (stars >= 2) {
      diff.completed = true;
    }

    // Auto-advance: if difficulty 1 completed with 2+ stars, mark difficulty 2 as unlocked
    // We track this via completed flag
    data.totalStars = (data.totalStars || 0) - (diff.stars - stars); // adjust
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
      for (let d = 1; d <= 3; d++) {
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
    for (let d = 1; d <= 3; d++) {
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

  return {
    load,
    getTopicProgress,
    recordResult,
    isUnlocked,
    getStars,
    isTopicComplete,
    getTotalStars
  };
})();
