// LocalStorage helpers for persisting settings and match statistics
const ChessStorage = (function () {
  'use strict';

  const SETTINGS_KEY = 'furqan_chess_settings';
  const STATS_KEY = 'furqan_chess_stats';

  const defaultSettings = {
    theme: 'dark',
    boardTheme: 'classic',
    showCoords: true,
    showMoveHints: true,
    autoFlip: false,
    soundEnabled: true
  };

  const defaultStats = {
    gamesPlayed: 0,
    whiteWins: 0,
    blackWins: 0,
    draws: 0
  };

  function loadSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return { ...defaultSettings };
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch (e) {
      return { ...defaultSettings };
    }
  }

  function saveSettings(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
  }

  function loadStats() {
    try {
      const data = localStorage.getItem(STATS_KEY);
      if (!data) return { ...defaultStats };
      return { ...defaultStats, ...JSON.parse(data) };
    } catch (e) {
      return { ...defaultStats };
    }
  }

  function saveStats(stats) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) {}
  }

  function recordGameResult(winner) {
    const stats = loadStats();
    stats.gamesPlayed++;
    if (winner === 'w') stats.whiteWins++;
    else if (winner === 'b') stats.blackWins++;
    else if (winner === 'draw') stats.draws++;
    saveStats(stats);
    return stats;
  }

  return {
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadStats: loadStats,
    saveStats: saveStats,
    recordGameResult: recordGameResult
  };
})();
