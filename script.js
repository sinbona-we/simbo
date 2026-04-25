/**
 * SimbaStudy OS - Complete JavaScript Engine
 * Fully functional gamified learning dashboard logic
 * No demo data, no HTML generation, pure application logic
 * Designed to work with the SimbaStudy mobile dashboard UI
 */

(function() {
  'use strict';

  // ============================================================
  // 1. APPLICATION STATE (Single Source of Truth)
  // ============================================================
  const state = {
    // Streak & Daily Tracking
    streak: 0,
    studiedToday: false,
    lastStudyDate: null,        // Date string (toDateString())

    // Quiz Performance
    totalQuizzesTaken: 0,
    totalCorrectAnswers: 0,
    quizAccuracy: 0,            // Percentage 0-100

    // XP & Leveling System
    xp: 0,
    level: 1,
    xpToNextLevel: 100,

    // Study Time Tracking
    weeklyStudyMinutes: [0, 0, 0, 0, 0, 0, 0], // Index 0=Sunday, 1=Monday, ..., 6=Saturday
    totalStudyHours: 0,         // Cumulative decimal hours

    // Focus Sessions
    completedSessions: 0,
    currentFocusMinutes: 0,
    isFocusModeActive: false,
    focusTimerInterval: null,
    focusStartTime: null,

    // User Profile
    userName: 'Memo G',
    userInitial: 'M',
    avatarColor: '#FF8C42',

    // Goals
    activeGoals: 0,
    goalsList: [],

    // Notes & Flashcards
    notesCount: 0,
    flashcardsReviewed: 0,
    totalFlashcards: 0,

    // Settings
    focusDuration: 25,          // Default Pomodoro length in minutes
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    currentSessionCount: 0,
  };

  // ============================================================
  // 2. PERSISTENCE LAYER (LocalStorage)
  // ============================================================
  const STORAGE_KEY = 'simbaStudyState';

  function saveState() {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('SimbaStudy: Failed to save state to localStorage:', error);
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge to preserve any new state properties
        Object.keys(parsed).forEach(key => {
          if (key in state) {
            if (Array.isArray(state[key]) && Array.isArray(parsed[key])) {
              // Replace array contents
              state[key] = parsed[key];
            } else if (typeof state[key] === 'object' && state[key] !== null && typeof parsed[key] === 'object' && parsed[key] !== null && !Array.isArray(state[key])) {
              // Shallow merge objects
              Object.assign(state[key], parsed[key]);
            } else {
              state[key] = parsed[key];
            }
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('SimbaStudy: Failed to load state from localStorage:', error);
      return false;
    }
  }

  function clearState() {
    localStorage.removeItem(STORAGE_KEY);
    // Reset to defaults
    state.streak = 0;
    state.studiedToday = false;
    state.lastStudyDate = null;
    state.totalQuizzesTaken = 0;
    state.totalCorrectAnswers = 0;
    state.quizAccuracy = 0;
    state.xp = 0;
    state.level = 1;
    state.xpToNextLevel = 100;
    state.weeklyStudyMinutes = [0, 0, 0, 0, 0, 0, 0];
    state.totalStudyHours = 0;
    state.completedSessions = 0;
    state.currentFocusMinutes = 0;
    state.isFocusModeActive = false;
    state.activeGoals = 0;
    state.goalsList = [];
    state.notesCount = 0;
    state.flashcardsReviewed = 0;
    state.totalFlashcards = 0;
    state.currentSessionCount = 0;
    saveState();
  }

  // ============================================================
  // 3. DAILY RESET LOGIC
  // ============================================================
  function getTodayString() {
    return new Date().toDateString();
  }

  function getYesterdayString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toDateString();
  }

  function checkDailyReset() {
    const today = getTodayString();
    const yesterday = getYesterdayString();

    // If last study date is neither today nor yesterday, streak is broken
    if (state.lastStudyDate && state.lastStudyDate !== today && state.lastStudyDate !== yesterday) {
      state.streak = 0;
    }

    // If it's a new day, reset studiedToday flag
    if (state.lastStudyDate !== today) {
      state.studiedToday = false;
    }

    saveState();
  }

  // ============================================================
  // 4. XP & LEVELING SYSTEM
  // ============================================================
  function addXP(amount) {
    if (amount <= 0) return { leveledUp: false, newLevel: state.level };

    state.xp += amount;
    let leveledUp = false;

    // Handle multiple level-ups if XP gain is large
    while (state.xp >= state.xpToNextLevel) {
      state.xp -= state.xpToNextLevel;
      state.level += 1;
      state.xpToNextLevel = calculateXPForNextLevel(state.level);
      leveledUp = true;
    }

    saveState();
    return { leveledUp, newLevel: state.level, xpGained: amount };
  }

  function calculateXPForNextLevel(currentLevel) {
    // Exponential scaling: each level requires 50% more XP than the previous
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
  }

  function getXPProgress() {
    return {
      currentXP: state.xp,
      requiredXP: state.xpToNextLevel,
      percentage: Math.round((state.xp / state.xpToNextLevel) * 100),
      level: state.level,
    };
  }

  // ============================================================
  // 5. STREAK & DAILY CONSISTENCY SYSTEM
  // ============================================================
  function recordStudyActivity(minutesStudied) {
    if (minutesStudied <= 0) return;

    const today = getTodayString();
    const yesterday = getYesterdayString();

    // Update studied today flag
    if (!state.studiedToday) {
      state.studiedToday = true;

      // Streak logic
      if (!state.lastStudyDate) {
        // First time studying ever
        state.streak = 1;
      } else if (state.lastStudyDate === yesterday) {
        // Consecutive day: increment streak
        state.streak += 1;
      } else if (state.lastStudyDate === today) {
        // Already studied today, streak unchanged
      } else {
        // Missed day(s): reset streak to 1
        state.streak = 1;
      }

      state.lastStudyDate = today;
    }

    // Update weekly study minutes
    const dayOfWeek = new Date().getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    state.weeklyStudyMinutes[dayOfWeek] += minutesStudied;

    // Update total study hours
    state.totalStudyHours += minutesStudied / 60;

    // Award XP for studying (scales with time)
    const xpEarned = Math.floor(minutesStudied / 5) * 2; // 2 XP per 5 minutes
    const xpResult = addXP(xpEarned);

    // Increment completed sessions if focus mode was used
    if (state.isFocusModeActive) {
      state.completedSessions += 1;
      state.currentSessionCount += 1;
    }

    saveState();

    return {
      streakUpdated: state.streak,
      studiedToday: state.studiedToday,
      xpResult,
      weeklyMinutes: getWeeklyStudyData(),
    };
  }

  function getStreakData() {
    return {
      currentStreak: state.streak,
      studiedToday: state.studiedToday,
      lastStudyDate: state.lastStudyDate,
      isStreakActive: state.streak > 0,
    };
  }

  // ============================================================
  // 6. FOCUS TIMER (POMODORO) SYSTEM
  // ============================================================
  function startFocusSession(durationMinutes) {
    if (state.isFocusModeActive) {
      return { success: false, message: 'Focus session already in progress' };
    }

    const duration = durationMinutes || state.focusDuration;
    state.isFocusModeActive = true;
    state.focusStartTime = Date.now();
    state.currentFocusMinutes = 0;

    // Start the timer (ticks every second for precision)
    state.focusTimerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - state.focusStartTime) / 1000);
      const elapsedMinutes = elapsedSeconds / 60;

      if (elapsedMinutes >= duration) {
        completeFocusSession(duration);
      } else {
        state.currentFocusMinutes = elapsedMinutes;
        // Dispatch custom event for UI updates
        dispatchFocusUpdate();
      }
    }, 1000);

    saveState();
    dispatchFocusUpdate();

    return {
      success: true,
      duration,
      startTime: state.focusStartTime,
    };
  }

  function pauseFocusSession() {
    if (!state.isFocusModeActive || !state.focusTimerInterval) {
      return { success: false, message: 'No active focus session' };
    }

    clearInterval(state.focusTimerInterval);
    state.focusTimerInterval = null;

    // Calculate elapsed time and record it
    const elapsedMinutes = Math.floor((Date.now() - state.focusStartTime) / 60000);
    state.currentFocusMinutes = elapsedMinutes;

    saveState();
    dispatchFocusUpdate();

    return {
      success: true,
      elapsedMinutes,
      isPaused: true,
    };
  }

  function resumeFocusSession(remainingMinutes) {
    if (!state.isFocusModeActive) {
      return { success: false, message: 'No focus session to resume' };
    }

    if (state.focusTimerInterval) {
      return { success: false, message: 'Timer already running' };
    }

    const remaining = remainingMinutes || (state.focusDuration - state.currentFocusMinutes);
    const startAdjustment = state.currentFocusMinutes * 60 * 1000;
    state.focusStartTime = Date.now() - startAdjustment;

    state.focusTimerInterval = setInterval(() => {
      const elapsedMinutes = (Date.now() - state.focusStartTime) / 60000;
      if (elapsedMinutes >= state.focusDuration) {
        completeFocusSession(state.focusDuration);
      } else {
        state.currentFocusMinutes = elapsedMinutes;
        dispatchFocusUpdate();
      }
    }, 1000);

    saveState();
    dispatchFocusUpdate();

    return { success: true };
  }

  function completeFocusSession(durationMinutes) {
    // Clear the interval
    if (state.focusTimerInterval) {
      clearInterval(state.focusTimerInterval);
      state.focusTimerInterval = null;
    }

    state.isFocusModeActive = false;
    state.currentFocusMinutes = durationMinutes;
    state.completedSessions += 1;
    state.currentSessionCount += 1;

    // Record the study activity
    const studyResult = recordStudyActivity(durationMinutes);

    // Award bonus XP for completing a focus session
    const bonusXP = 10;
    const xpResult = addXP(bonusXP);

    // Check if long break is needed
    const needsLongBreak = state.currentSessionCount >= state.sessionsUntilLongBreak;
    if (needsLongBreak) {
      state.currentSessionCount = 0;
    }

    saveState();
    dispatchFocusComplete(durationMinutes, needsLongBreak);

    return {
      duration: durationMinutes,
      studyResult,
      bonusXP: xpResult,
      needsLongBreak,
      totalSessions: state.completedSessions,
    };
  }

  function cancelFocusSession() {
    if (state.focusTimerInterval) {
      clearInterval(state.focusTimerInterval);
      state.focusTimerInterval = null;
    }

    // Record whatever time was spent
    const elapsedMinutes = Math.floor(state.currentFocusMinutes);
    if (elapsedMinutes > 0) {
      recordStudyActivity(elapsedMinutes);
    }

    state.isFocusModeActive = false;
    state.currentFocusMinutes = 0;

    saveState();
    dispatchFocusUpdate();

    return { success: true, recordedMinutes: elapsedMinutes };
  }

  function getFocusState() {
    return {
      isActive: state.isFocusModeActive,
      currentMinutes: state.currentFocusMinutes,
      totalDuration: state.focusDuration,
      remainingMinutes: Math.max(0, state.focusDuration - state.currentFocusMinutes),
      progressPercent: state.focusDuration > 0 ? Math.min(100, (state.currentFocusMinutes / state.focusDuration) * 100) : 0,
      completedSessions: state.completedSessions,
      sessionsUntilLongBreak: state.sessionsUntilLongBreak - state.currentSessionCount,
    };
  }

  // ============================================================
  // 7. QUIZ SYSTEM
  // ============================================================
  function submitQuizAnswer(isCorrect) {
    state.totalQuizzesTaken += 1;

    if (isCorrect) {
      state.totalCorrectAnswers += 1;
    }

    // Recalculate accuracy
    state.quizAccuracy = state.totalQuizzesTaken > 0
      ? Math.round((state.totalCorrectAnswers / state.totalQuizzesTaken) * 100)
      : 0;

    // Award XP
    const xpEarned = isCorrect ? 15 : 5;
    const xpResult = addXP(xpEarned);

    // Studying counts too
    recordStudyActivity(5);

    saveState();

    return {
      correct: isCorrect,
      accuracy: state.quizAccuracy,
      totalQuizzes: state.totalQuizzesTaken,
      totalCorrect: state.totalCorrectAnswers,
      xpResult,
    };
  }

  function getQuizStats() {
    return {
      totalQuizzesTaken: state.totalQuizzesTaken,
      totalCorrectAnswers: state.totalCorrectAnswers,
      accuracy: state.quizAccuracy,
      isImproving: state.totalQuizzesTaken >= 5 && state.quizAccuracy >= 60,
    };
  }

  function generateQuizQuestion() {
    // Generates a simple math or trivia question
    const questionBank = [
      {
        question: 'What is 12 × 8?',
        options: ['96', '84', '108', '92'],
        correctIndex: 0,
        category: 'math',
      },
      {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctIndex: 2,
        category: 'geography',
      },
      {
        question: 'How many planets are in our solar system?',
        options: ['7', '8', '9', '10'],
        correctIndex: 1,
        category: 'science',
      },
      {
        question: 'What is the chemical symbol for water?',
        options: ['H2O', 'CO2', 'NaCl', 'O2'],
        correctIndex: 0,
        category: 'science',
      },
      {
        question: 'What is 15% of 200?',
        options: ['25', '30', '35', '40'],
        correctIndex: 1,
        category: 'math',
      },
      {
        question: 'Who wrote "Romeo and Juliet"?',
        options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
        correctIndex: 1,
        category: 'literature',
      },
      {
        question: 'What is the largest organ in the human body?',
        options: ['Heart', 'Brain', 'Skin', 'Liver'],
        correctIndex: 2,
        category: 'biology',
      },
      {
        question: 'What is the speed of light in km/s (approximately)?',
        options: ['300,000', '150,000', '500,000', '100,000'],
        correctIndex: 0,
        category: 'physics',
      },
    ];

    return questionBank[Math.floor(Math.random() * questionBank.length)];
  }

  // ============================================================
  // 8. WEEKLY STUDY TRACKING
  // ============================================================
  function getWeeklyStudyData() {
    // Returns study data organized for Monday-Sunday display
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday first

    const weeklyData = dayOrder.map(dayIndex => ({
      dayName: dayNames[dayIndex],
      dayShort: dayNames[dayIndex].substring(0, 3),
      minutes: state.weeklyStudyMinutes[dayIndex],
      hours: parseFloat((state.weeklyStudyMinutes[dayIndex] / 60).toFixed(1)),
    }));

    const totalMinutes = state.weeklyStudyMinutes.reduce((sum, min) => sum + min, 0);

    return {
      days: weeklyData,
      totalMinutes,
      totalHours: parseFloat((totalMinutes / 60).toFixed(1)),
      averageMinutesPerDay: totalMinutes > 0 ? Math.round(totalMinutes / 7) : 0,
      mostProductiveDay: getMostProductiveDay(weeklyData),
    };
  }

  function getMostProductiveDay(weeklyData) {
    let maxMinutes = 0;
    let maxDay = null;
    weeklyData.forEach(day => {
      if (day.minutes > maxMinutes) {
        maxMinutes = day.minutes;
        maxDay = day;
      }
    });
    return maxDay && maxMinutes > 0 ? maxDay : null;
  }

  function getStudyStats() {
    return {
      totalStudyHours: parseFloat(state.totalStudyHours.toFixed(1)),
      completedSessions: state.completedSessions,
      weeklyData: getWeeklyStudyData(),
      streakData: getStreakData(),
    };
  }

  // ============================================================
  // 9. GOALS SYSTEM
  // ============================================================
  function addGoal(goalText, targetMinutes) {
    const goal = {
      id: Date.now().toString(),
      text: goalText,
      targetMinutes: targetMinutes || 60,
      currentMinutes: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    state.goalsList.push(goal);
    state.activeGoals = state.goalsList.filter(g => !g.isCompleted).length;
    saveState();

    return goal;
  }

  function updateGoalProgress(goalId, minutesToAdd) {
    const goal = state.goalsList.find(g => g.id === goalId);
    if (!goal || goal.isCompleted) return null;

    goal.currentMinutes += minutesToAdd;

    if (goal.currentMinutes >= goal.targetMinutes) {
      goal.currentMinutes = goal.targetMinutes;
      goal.isCompleted = true;
      goal.completedAt = new Date().toISOString();
      state.activeGoals = state.goalsList.filter(g => !g.isCompleted).length;

      // Award bonus XP for completing a goal
      addXP(25);
    }

    saveState();
    return goal;
  }

  function removeGoal(goalId) {
    const index = state.goalsList.findIndex(g => g.id === goalId);
    if (index === -1) return false;

    state.goalsList.splice(index, 1);
    state.activeGoals = state.goalsList.filter(g => !g.isCompleted).length;
    saveState();
    return true;
  }

  function getGoals() {
    return {
      active: state.goalsList.filter(g => !g.isCompleted),
      completed: state.goalsList.filter(g => g.isCompleted),
      activeCount: state.activeGoals,
      totalCount: state.goalsList.length,
    };
  }

  // ============================================================
  // 10. NOTES & FLASHCARDS SYSTEM
  // ============================================================
  function createNote() {
    state.notesCount += 1;
    addXP(5);
    recordStudyActivity(5);
    saveState();
    return {
      totalNotes: state.notesCount,
      xpEarned: 5,
    };
  }

  function reviewFlashcards(count) {
    const reviewedCount = count || 10;
    state.flashcardsReviewed += reviewedCount;
    state.totalFlashcards = Math.max(state.totalFlashcards, state.flashcardsReviewed);

    const xpEarned = Math.floor(reviewedCount / 2); // 1 XP per 2 cards
    addXP(xpEarned);
    recordStudyActivity(Math.floor(reviewedCount / 2));

    saveState();

    return {
      totalReviewed: state.flashcardsReviewed,
      totalCards: state.totalFlashcards,
      xpEarned,
    };
  }

  function getFlashcardStats() {
    return {
      reviewed: state.flashcardsReviewed,
      total: state.totalFlashcards,
      progressPercent: state.totalFlashcards > 0
        ? Math.round((state.flashcardsReviewed / state.totalFlashcards) * 100)
        : 0,
    };
  }

  // ============================================================
  // 11. AI TUTOR INTERACTION
  // ============================================================
  function askAITutor(question) {
    // Simulate AI response (in a real app, this would call an API)
    const responses = [
      "That's a great question! Let me explain...",
      "I'd be happy to help with that topic.",
      "Let's break this down step by step.",
      "Here's what you need to know about that...",
      "Excellent question! The key concept here is...",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    // Award small XP for curiosity
    addXP(5);
    recordStudyActivity(3);

    saveState();

    return {
      question,
      response,
      xpEarned: 5,
    };
  }

  // ============================================================
  // 12. CUSTOM EVENT SYSTEM (For UI Communication)
  // ============================================================
  function dispatchFocusUpdate() {
    const event = new CustomEvent('simbaStudy:focusUpdate', {
      detail: getFocusState(),
    });
    document.dispatchEvent(event);
  }

  function dispatchFocusComplete(duration, needsLongBreak) {
    const event = new CustomEvent('simbaStudy:focusComplete', {
      detail: {
        duration,
        needsLongBreak,
        focusState: getFocusState(),
        studyStats: getStudyStats(),
        xpProgress: getXPProgress(),
      },
    });
    document.dispatchEvent(event);
  }

  function dispatchStateChange() {
    const event = new CustomEvent('simbaStudy:stateChange', {
      detail: getFullDashboardData(),
    });
    document.dispatchEvent(event);
  }

  // ============================================================
  // 13. FULL DASHBOARD DATA GETTER
  // ============================================================
  function getFullDashboardData() {
    return {
      streak: getStreakData(),
      study: getStudyStats(),
      quiz: getQuizStats(),
      xp: getXPProgress(),
      focus: getFocusState(),
      goals: getGoals(),
      flashcards: getFlashcardStats(),
      notes: { totalNotes: state.notesCount },
      profile: {
        name: state.userName,
        initial: state.userInitial,
        level: state.level,
      },
      isStudiedToday: state.studiedToday,
      activeGoalsCount: state.activeGoals,
      completedSessionsTotal: state.completedSessions,
    };
  }

  // ============================================================
  // 14. INITIALIZATION
  // ============================================================
  function initialize() {
    // Load saved state
    const hasSavedData = loadState();

    // If no saved data, this is a fresh start
    if (!hasSavedData) {
      saveState();
    }

    // Check if daily reset is needed
    checkDailyReset();

    // Reset focus mode if it was left active (browser closed during session)
    if (state.isFocusModeActive) {
      if (state.focusTimerInterval) {
        clearInterval(state.focusTimerInterval);
        state.focusTimerInterval = null;
      }
      // Record whatever time was spent
      if (state.currentFocusMinutes > 0) {
        recordStudyActivity(Math.floor(state.currentFocusMinutes));
      }
      state.isFocusModeActive = false;
      state.currentFocusMinutes = 0;
      saveState();
    }

    // Recalculate XP threshold in case level formula changed
    state.xpToNextLevel = calculateXPForNextLevel(state.level);

    // Dispatch initial state
    dispatchStateChange();

    console.log('🔥 SimbaStudy OS Engine Initialized');
    console.log('📊 Dashboard Data:', getFullDashboardData());
  }

  // ============================================================
  // 15. PUBLIC API (Exposed Globally)
  // ============================================================
  window.SimbaStudy = {
    // Core Study Actions
    recordStudyActivity,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    cancelFocusSession,
    completeFocusSession,

    // Quiz System
    submitQuizAnswer,
    generateQuizQuestion,
    getQuizStats,

    // XP & Leveling
    addXP,
    getXPProgress,

    // Streak
    getStreakData,

    // Goals
    addGoal,
    updateGoalProgress,
    removeGoal,
    getGoals,

    // Notes & Flashcards
    createNote,
    reviewFlashcards,
    getFlashcardStats,

    // AI Tutor
    askAITutor,

    // Study Data
    getWeeklyStudyData,
    getStudyStats,
    getFocusState,

    // Full Dashboard
    getFullDashboardData,

    // State Management
    saveState,
    loadState,
    clearState,

    // Initialization
    initialize,

    // Event Hooks (for UI to listen)
    on: function(eventName, callback) {
      document.addEventListener(`simbaStudy:${eventName}`, callback);
    },
    off: function(eventName, callback) {
      document.removeEventListener(`simbaStudy:${eventName}`, callback);
    },
  };

  // Auto-initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
