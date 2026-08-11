// Sound effects using Web Audio API synthesis (no external files needed)
const ChessSound = (function () {
  'use strict';

  let audioCtx = null;
  let enabled = true;

  function initCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playTone(freq, type, duration, startGain = 0.3, endGain = 0.01) {
    if (!enabled) return;
    try {
      initCtx();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(startGain, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(endGain, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked until a user gesture
    }
  }

  return {
    setEnabled: function (val) { enabled = !!val; },
    isEnabled: function () { return enabled; },

    playMove: function () {
      if (!enabled) return;
      try {
        initCtx();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } catch (e) {}
    },

    playCapture: function () {
      if (!enabled) return;
      try {
        initCtx();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.09);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    },

    playCheck: function () {
      if (!enabled) return;
      playTone(880, 'sine', 0.12, 0.4, 0.01);
      setTimeout(() => playTone(1174.66, 'sine', 0.18, 0.4, 0.01), 80);
    },

    playCastle: function () {
      if (!enabled) return;
      this.playMove();
      setTimeout(() => this.playMove(), 70);
    },

    playPromotion: function () {
      if (!enabled) return;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        setTimeout(() => playTone(freq, 'sine', 0.15, 0.3, 0.01), idx * 60);
      });
    },

    playGameOver: function () {
      if (!enabled) return;
      [440, 349.23, 293.66].forEach((freq, idx) => {
        setTimeout(() => playTone(freq, 'triangle', 0.25, 0.4, 0.01), idx * 120);
      });
    },

    playClick: function () {
      if (!enabled) return;
      playTone(600, 'sine', 0.03, 0.15, 0.01);
    }
  };
})();
