// Chess clock with increment support and timeout detection
const ChessClock = (function () {
  'use strict';

  class Clock {
    constructor(config = {}) {
      this.initialTime = config.time || 10 * 60;
      this.increment = config.increment || 0;

      this.whiteTime = this.initialTime * 1000;
      this.blackTime = this.initialTime * 1000;

      this.activeColor = 'w';
      this.isRunning = false;
      this.lastTickTime = null;
      this.timerId = null;

      this.onTick = config.onTick || null;
      this.onTimeout = config.onTimeout || null;
    }

    setConfig(timeInSeconds, incrementInSeconds) {
      this.initialTime = timeInSeconds;
      this.increment = incrementInSeconds;
      this.reset();
    }

    reset() {
      this.stop();
      this.whiteTime = this.initialTime * 1000;
      this.blackTime = this.initialTime * 1000;
      this.activeColor = 'w';
      if (this.onTick) this.onTick(this.whiteTime, this.blackTime);
    }

    start(color = 'w') {
      if (this.initialTime === 0) return; // unlimited mode, no clock
      this.stop();
      this.activeColor = color;
      this.isRunning = true;
      this.lastTickTime = Date.now();

      this.timerId = setInterval(() => {
        this.update();
      }, 100);
    }

    stop() {
      this.isRunning = false;
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
    }

    update() {
      if (!this.isRunning || !this.lastTickTime) return;

      const now = Date.now();
      const elapsed = now - this.lastTickTime;
      this.lastTickTime = now;

      if (this.activeColor === 'w') {
        this.whiteTime = Math.max(0, this.whiteTime - elapsed);
        if (this.whiteTime <= 0) {
          this.stop();
          if (this.onTimeout) this.onTimeout('w');
        }
      } else {
        this.blackTime = Math.max(0, this.blackTime - elapsed);
        if (this.blackTime <= 0) {
          this.stop();
          if (this.onTimeout) this.onTimeout('b');
        }
      }

      if (this.onTick) this.onTick(this.whiteTime, this.blackTime);
    }

    // Called after each move — adds increment and starts the other player's clock
    switchTurn(nextColor) {
      if (!this.isRunning && this.initialTime > 0) {
        this.start(nextColor);
        return;
      }

      if (this.isRunning && this.increment > 0) {
        if (this.activeColor === 'w') {
          this.whiteTime += this.increment * 1000;
        } else {
          this.blackTime += this.increment * 1000;
        }
      }

      this.activeColor = nextColor;
      this.lastTickTime = Date.now();
      if (this.onTick) this.onTick(this.whiteTime, this.blackTime);
    }

    // Format milliseconds into MM:SS or high-precision under 10 seconds
    static formatTime(timeMs) {
      if (timeMs === null || timeMs === undefined || timeMs < 0) return '--:--';
      const totalSeconds = Math.ceil(timeMs / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;

      if (totalSeconds < 10) {
        const dec = Math.floor((timeMs % 1000) / 100);
        return `00:0${Math.floor(timeMs / 1000)}.${dec}`;
      }

      const mm = String(mins).padStart(2, '0');
      const ss = String(secs).padStart(2, '0');
      return `${mm}:${ss}`;
    }
  }

  return Clock;
})();
