// Main UI controller — handles rendering, input, and game flow
const ChessUI = (function () {
  'use strict';

  let engine = null;
  let clock = null;

  let settings = ChessStorage.loadSettings();
  let stats = ChessStorage.loadStats();

  let boardOrientation = 'w'; // which color sits at the bottom
  let selectedSquare = null;
  let currentLegalMoves = [];

  let reviewMoveIndex = null; // null = live game, number = viewing past position

  // Drag state
  let dragStartSquare = null;

  function init() {
    engine = new ChessEngine.Engine();
    clock = new ChessClock({
      time: 10 * 60,
      increment: 0,
      onTick: updateClockDisplay,
      onTimeout: handleTimeout
    });

    applySettings();
    bindEvents();
    renderAll();
  }

  function applySettings() {
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${settings.theme}`);

    const boardEl = document.getElementById('chessboard');
    if (boardEl) {
      boardEl.classList.remove('board-theme-classic', 'board-theme-wood', 'board-theme-slate', 'board-theme-emerald', 'board-theme-midnight');
      boardEl.classList.add(`board-theme-${settings.boardTheme}`);
      boardEl.classList.toggle('show-coords', settings.showCoords);
    }

    ChessSound.setEnabled(settings.soundEnabled);
    updateSoundBtnIcon();
  }

  function bindEvents() {
    // Header buttons
    document.getElementById('btn-new-game').addEventListener('click', openNewGameModal);
    document.getElementById('btn-settings').addEventListener('click', openSettingsModal);
    document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('btn-sound-toggle').addEventListener('click', toggleSound);

    // Toolbar buttons
    document.getElementById('btn-undo').addEventListener('click', handleUndo);
    document.getElementById('btn-redo').addEventListener('click', handleRedo);
    document.getElementById('btn-flip').addEventListener('click', handleFlipBoard);
    document.getElementById('btn-resign').addEventListener('click', confirmResign);
    document.getElementById('btn-draw').addEventListener('click', confirmDraw);

    // Close buttons on all modals
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', e => {
        closeModal(e.target.closest('.modal'));
      });
    });

    // New game form
    document.getElementById('form-new-game').addEventListener('submit', startNewGameFromForm);

    // Promotion piece selection
    document.querySelectorAll('.promo-option').forEach(opt => {
      opt.addEventListener('click', handlePromotionChoice);
    });

    // Confirm dialog buttons
    document.getElementById('btn-confirm-yes').addEventListener('click', executeConfirmation);
    document.getElementById('btn-confirm-no').addEventListener('click', () => closeModal('modal-confirm'));

    // Game over actions
    document.getElementById('btn-pgn-copy').addEventListener('click', copyPGN);
    document.getElementById('btn-pgn-download').addEventListener('click', downloadPGN);
    document.getElementById('btn-rematch').addEventListener('click', () => {
      closeModal('modal-game-over');
      openNewGameModal();
    });

    // Settings controls
    document.getElementById('setting-app-theme').addEventListener('change', e => {
      settings.theme = e.target.value;
      ChessStorage.saveSettings(settings);
      applySettings();
    });
    document.getElementById('setting-board-theme').addEventListener('change', e => {
      settings.boardTheme = e.target.value;
      ChessStorage.saveSettings(settings);
      applySettings();
    });
    document.getElementById('setting-coords').addEventListener('change', e => {
      settings.showCoords = e.target.checked;
      ChessStorage.saveSettings(settings);
      applySettings();
    });
    document.getElementById('setting-hints').addEventListener('change', e => {
      settings.showMoveHints = e.target.checked;
      ChessStorage.saveSettings(settings);
      applySettings();
    });
    document.getElementById('setting-autoflip').addEventListener('change', e => {
      settings.autoFlip = e.target.checked;
      ChessStorage.saveSettings(settings);
      applySettings();
    });
    document.getElementById('setting-sound').addEventListener('change', e => {
      settings.soundEnabled = e.target.checked;
      ChessStorage.saveSettings(settings);
      applySettings();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeAllModals();
        clearSelection();
      } else if (e.key === 'f' || e.key === 'F') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
          handleFlipBoard();
        }
      } else if (e.key === 'ArrowLeft') {
        if (reviewMoveIndex !== null && reviewMoveIndex > 0) {
          jumpToMove(reviewMoveIndex - 1);
        } else if (reviewMoveIndex === null && engine.moveHistory.length > 0) {
          jumpToMove(engine.moveHistory.length - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (reviewMoveIndex !== null) {
          if (reviewMoveIndex < engine.moveHistory.length - 1) {
            jumpToMove(reviewMoveIndex + 1);
          } else {
            jumpToMove(null);
          }
        }
      }
    });

    window.addEventListener('resize', renderBoard);
  }

  // Re-render everything
  function renderAll() {
    renderBoard();
    renderPlayerCards();
    renderMoveHistory();
    updateControlsState();
    updateStatsDisplay();
  }

  // Draw the 8x8 board with pieces, highlights, and move hints
  function renderBoard() {
    const boardEl = document.getElementById('chessboard');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const isFlipped = boardOrientation === 'b';
    const isLive = reviewMoveIndex === null;

    // Show either the live board or a historical position
    let displayBoard = engine.board;
    let lastMove = isLive ? engine.moveHistory[engine.moveHistory.length - 1] : null;

    if (!isLive && reviewMoveIndex >= 0 && reviewMoveIndex < engine.moveHistory.length) {
      const tempEng = new ChessEngine.Engine();
      for (let i = 0; i <= reviewMoveIndex; i++) {
        tempEng.makeMove(engine.moveHistory[i]);
      }
      displayBoard = tempEng.board;
      lastMove = engine.moveHistory[reviewMoveIndex];
    }

    const inCheck = isLive && engine.isKingInCheck(engine.turn);

    for (let displayR = 0; displayR < 8; displayR++) {
      for (let displayC = 0; displayC < 8; displayC++) {
        const r = isFlipped ? 7 - displayR : displayR;
        const c = isFlipped ? 7 - displayC : displayC;

        const sqName = ChessEngine.coordsToSquare(r, c);
        const squareEl = document.createElement('div');
        squareEl.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        squareEl.dataset.r = r;
        squareEl.dataset.c = c;
        squareEl.dataset.square = sqName;

        // Rank and file labels along edges
        if (settings.showCoords) {
          if (displayC === 0) {
            const rankLabel = document.createElement('span');
            rankLabel.className = 'coord coord-rank';
            rankLabel.textContent = ChessEngine.RANKS[r];
            squareEl.appendChild(rankLabel);
          }
          if (displayR === 7) {
            const fileLabel = document.createElement('span');
            fileLabel.className = 'coord coord-file';
            fileLabel.textContent = ChessEngine.FILES[c];
            squareEl.appendChild(fileLabel);
          }
        }

        // Highlight selected square
        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
          squareEl.classList.add('selected');
        }

        // Highlight last move squares
        if (lastMove) {
          if ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c)) {
            squareEl.classList.add('last-move');
          }
        }

        const piece = displayBoard[r][c];

        // King in check glow
        if (inCheck && piece && piece.type === 'k' && piece.color === engine.turn) {
          squareEl.classList.add('in-check');
          if (engine.gameStatus === 'checkmate') {
            squareEl.classList.add('checkmate');
          }
        }

        // Show dots / rings for legal moves
        if (isLive && selectedSquare && settings.showMoveHints) {
          const moveHint = currentLegalMoves.find(m => m.to.r === r && m.to.c === c);
          if (moveHint) {
            const hintEl = document.createElement('div');
            hintEl.className = (piece || moveHint.isEnPassant) ? 'hint-capture' : 'hint-dot';
            squareEl.appendChild(hintEl);
          }
        }

        // Render the piece SVG
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = `piece ${piece.color}-${piece.type}`;
          pieceEl.innerHTML = ChessPieces.getSVG(piece.color, piece.type);
          pieceEl.draggable = true;

          pieceEl.addEventListener('dragstart', e => handleDragStart(e, r, c));
          pieceEl.addEventListener('dragend', handleDragEnd);

          squareEl.appendChild(pieceEl);
        }

        squareEl.addEventListener('click', () => handleSquareClick(r, c));
        squareEl.addEventListener('dragover', e => e.preventDefault());
        squareEl.addEventListener('drop', e => handleDrop(e, r, c));

        boardEl.appendChild(squareEl);
      }
    }
  }

  function handleSquareClick(r, c) {
    // Clicking during review returns to live position
    if (reviewMoveIndex !== null) {
      jumpToMove(null);
      return;
    }

    if (engine.gameStatus !== 'active') return;

    const clickedPiece = engine.board[r][c];

    // Clicked own piece — select it and show legal moves
    if (clickedPiece && clickedPiece.color === engine.turn) {
      if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
        clearSelection();
      } else {
        selectedSquare = { r, c };
        const legalMoves = engine.getLegalMoves(engine.turn);
        currentLegalMoves = legalMoves.filter(m => m.from.r === r && m.from.c === c);
        ChessSound.playClick();
        renderBoard();
      }
      return;
    }

    // Clicked a target square with a piece already selected
    if (selectedSquare) {
      const moveCandidate = currentLegalMoves.find(m => m.to.r === r && m.to.c === c);
      if (moveCandidate) {
        const movingPiece = engine.board[selectedSquare.r][selectedSquare.c];
        if (movingPiece.type === 'p' && (r === 0 || r === 7)) {
          openPromotionModal(selectedSquare, { r, c });
          return;
        }
        executeMove(moveCandidate);
      } else {
        clearSelection();
        renderBoard();
      }
    }
  }

  function handleDragStart(e, r, c) {
    if (reviewMoveIndex !== null || engine.gameStatus !== 'active') {
      e.preventDefault();
      return;
    }

    const piece = engine.board[r][c];
    if (!piece || piece.color !== engine.turn) {
      e.preventDefault();
      return;
    }

    selectedSquare = { r, c };
    const legalMoves = engine.getLegalMoves(engine.turn);
    currentLegalMoves = legalMoves.filter(m => m.from.r === r && m.from.c === c);
    renderBoard();

    dragStartSquare = { r, c };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${r},${c}`);
  }

  function handleDragEnd() {
    dragStartSquare = null;
    if (selectedSquare) {
      clearSelection();
      renderBoard();
    }
  }

  function handleDrop(e, targetR, targetC) {
    e.preventDefault();
    if (!selectedSquare) return;

    const moveCandidate = currentLegalMoves.find(m => m.to.r === targetR && m.to.c === targetC);
    if (moveCandidate) {
      const movingPiece = engine.board[selectedSquare.r][selectedSquare.c];
      if (movingPiece.type === 'p' && (targetR === 0 || targetR === 7)) {
        openPromotionModal(selectedSquare, { r: targetR, c: targetC });
        return;
      }
      executeMove(moveCandidate);
    } else {
      clearSelection();
      renderBoard();
    }
  }

  // Make the move, play the right sound, and update everything
  function executeMove(move) {
    const success = engine.makeMove(move);
    if (!success) {
      clearSelection();
      renderBoard();
      return;
    }

    clearSelection();

    // Play the appropriate sound effect
    const lastRecord = engine.moveHistory[engine.moveHistory.length - 1];
    if (engine.gameStatus === 'checkmate' || engine.gameStatus === 'stalemate') {
      ChessSound.playGameOver();
    } else if (engine.isKingInCheck(engine.turn)) {
      ChessSound.playCheck();
    } else if (lastRecord.isCastle) {
      ChessSound.playCastle();
    } else if (lastRecord.promotion) {
      ChessSound.playPromotion();
    } else if (lastRecord.captured) {
      ChessSound.playCapture();
    } else {
      ChessSound.playMove();
    }

    clock.switchTurn(engine.turn);

    // Auto-flip board so the current player always faces their pieces
    if (settings.autoFlip) {
      boardOrientation = engine.turn;
    }

    renderAll();

    if (engine.gameStatus !== 'active') {
      handleGameOver();
    }
  }

  function clearSelection() {
    selectedSquare = null;
    currentLegalMoves = [];
  }

  // Show the promotion picker modal
  function openPromotionModal(from, to) {
    const modal = document.getElementById('modal-promotion');
    modal.dataset.fromR = from.r;
    modal.dataset.fromC = from.c;
    modal.dataset.toR = to.r;
    modal.dataset.toC = to.c;

    const color = engine.turn;
    document.querySelectorAll('.promo-option').forEach(opt => {
      const type = opt.dataset.type;
      opt.innerHTML = ChessPieces.getSVG(color, type);
    });

    openModal('modal-promotion');
  }

  function handlePromotionChoice(e) {
    const opt = e.currentTarget;
    const type = opt.dataset.type;

    const modal = document.getElementById('modal-promotion');
    const from = { r: parseInt(modal.dataset.fromR), c: parseInt(modal.dataset.fromC) };
    const to = { r: parseInt(modal.dataset.toR), c: parseInt(modal.dataset.toC) };

    closeModal('modal-promotion');
    executeMove({ from, to, promotion: type });
  }

  // Update both player cards (name, avatar, captured pieces, material advantage)
  function renderPlayerCards() {
    const topColor = boardOrientation === 'w' ? 'b' : 'w';
    const bottomColor = boardOrientation === 'w' ? 'w' : 'b';

    updatePlayerCard('top', topColor);
    updatePlayerCard('bottom', bottomColor);
  }

  function updatePlayerCard(position, color) {
    const prefix = `player-${position}`;
    const nameEl = document.getElementById(`${prefix}-name`);
    const avatarEl = document.getElementById(`${prefix}-avatar`);
    const cardEl = document.getElementById(`${prefix}-card`);
    const capturedEl = document.getElementById(`${prefix}-captured`);
    const advEl = document.getElementById(`${prefix}-advantage`);

    const isWhite = color === 'w';
    const isTurn = engine.turn === color && engine.gameStatus === 'active';

    if (cardEl) cardEl.classList.toggle('active-turn', isTurn);
    if (nameEl) nameEl.textContent = isWhite ? 'White' : 'Black';
    if (avatarEl) avatarEl.innerHTML = ChessPieces.getSVG(color, 'k');

    // Show pieces this player has captured
    const capturedData = engine.getCapturedPieces();
    const capturedList = isWhite ? capturedData.blackCaptured : capturedData.whiteCaptured;

    if (capturedEl) {
      capturedEl.innerHTML = '';
      const enemyColor = color === 'w' ? 'b' : 'w';
      capturedList.forEach(type => {
        const pieceIcon = document.createElement('span');
        pieceIcon.className = 'captured-piece';
        pieceIcon.innerHTML = ChessPieces.getSVG(enemyColor, type);
        capturedEl.appendChild(pieceIcon);
      });
    }

    // Material advantage number
    const materialAdv = engine.getMaterialAdvantage();
    const diff = isWhite ? materialAdv.white : materialAdv.black;
    if (advEl) advEl.textContent = diff > 0 ? `+${diff}` : '';
  }

  function updateClockDisplay(whiteTimeMs, blackTimeMs) {
    const topColor = boardOrientation === 'w' ? 'b' : 'w';
    const bottomColor = boardOrientation === 'w' ? 'w' : 'b';

    const topTime = topColor === 'w' ? whiteTimeMs : blackTimeMs;
    const bottomTime = bottomColor === 'w' ? whiteTimeMs : blackTimeMs;

    const topClockEl = document.getElementById('player-top-clock');
    const bottomClockEl = document.getElementById('player-bottom-clock');

    if (topClockEl) topClockEl.textContent = ChessClock.formatTime(topTime);
    if (bottomClockEl) bottomClockEl.textContent = ChessClock.formatTime(bottomTime);
  }

  function handleTimeout(loserColor) {
    engine.timeout(loserColor);
    ChessSound.playGameOver();
    renderAll();
    handleGameOver();
  }

  // Build the move list panel from the engine's history
  function renderMoveHistory() {
    const listEl = document.getElementById('move-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const moves = engine.moveHistory;
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1];

      const rowEl = document.createElement('div');
      rowEl.className = 'move-row';

      const numEl = document.createElement('span');
      numEl.className = 'move-num';
      numEl.textContent = `${moveNum}.`;
      rowEl.appendChild(numEl);

      const whiteSanEl = document.createElement('span');
      whiteSanEl.className = `move-san ${reviewMoveIndex === i ? 'active' : ''}`;
      whiteSanEl.textContent = whiteMove.san;
      whiteSanEl.addEventListener('click', () => jumpToMove(i));
      rowEl.appendChild(whiteSanEl);

      if (blackMove) {
        const blackSanEl = document.createElement('span');
        blackSanEl.className = `move-san ${reviewMoveIndex === i + 1 ? 'active' : ''}`;
        blackSanEl.textContent = blackMove.san;
        blackSanEl.addEventListener('click', () => jumpToMove(i + 1));
        rowEl.appendChild(blackSanEl);
      }

      listEl.appendChild(rowEl);
    }

    // Scroll to bottom when viewing live position
    if (reviewMoveIndex === null) {
      listEl.scrollTop = listEl.scrollHeight;
    }
  }

  function jumpToMove(index) {
    reviewMoveIndex = index;
    renderBoard();
    renderMoveHistory();
  }

  function updateControlsState() {
    const isLive = reviewMoveIndex === null;
    document.getElementById('btn-undo').disabled = !isLive || engine.moveHistory.length === 0;
    document.getElementById('btn-redo').disabled = !isLive || engine.redoStack.length === 0;
    updateStatusMessage();
  }

  function updateStatusMessage(customMsg) {
    const statusEl = document.getElementById('game-status-text');
    if (!statusEl) return;

    if (customMsg) {
      statusEl.textContent = customMsg;
      return;
    }

    if (engine.gameStatus === 'active') {
      const turnText = engine.turn === 'w' ? "White's turn" : "Black's turn";
      const checkText = engine.isKingInCheck(engine.turn) ? ' (CHECK!)' : '';
      statusEl.textContent = `${turnText}${checkText}`;
    } else {
      statusEl.textContent = getGameOverReasonText();
    }
  }

  function getGameOverReasonText() {
    switch (engine.gameStatus) {
      case 'checkmate':
        return `CHECKMATE! ${engine.winner === 'w' ? 'White' : 'Black'} wins!`;
      case 'stalemate':
        return 'STALEMATE! Game drawn.';
      case 'draw-50move':
        return 'DRAW! 50-move rule reached.';
      case 'draw-repetition':
        return 'DRAW! Threefold repetition.';
      case 'draw-insufficient':
        return 'DRAW! Insufficient material.';
      case 'draw-agreement':
        return 'DRAW by mutual agreement.';
      case 'resigned':
        return `RESIGNATION! ${engine.winner === 'w' ? 'White' : 'Black'} wins!`;
      case 'timeout':
        return `TIMEOUT! ${engine.winner === 'w' ? 'White' : 'Black'} wins on time!`;
      default:
        return 'Game Over';
    }
  }

  function handleGameOver() {
    clock.stop();
    stats = ChessStorage.recordGameResult(engine.winner);
    updateStatsDisplay();

    const titleEl = document.getElementById('game-over-title');
    const messageEl = document.getElementById('game-over-message');

    if (titleEl) {
      if (engine.winner === 'draw') {
        titleEl.textContent = 'GAME DRAWN';
      } else {
        titleEl.textContent = `${engine.winner === 'w' ? 'WHITE' : 'BLACK'} WINS!`;
      }
    }

    if (messageEl) messageEl.textContent = getGameOverReasonText();

    setTimeout(() => openModal('modal-game-over'), 400);
  }

  function updateStatsDisplay() {
    const playedEl = document.getElementById('stat-played');
    const wWinsEl = document.getElementById('stat-wwins');
    const bWinsEl = document.getElementById('stat-bwins');
    const drawsEl = document.getElementById('stat-draws');

    if (playedEl) playedEl.textContent = stats.gamesPlayed;
    if (wWinsEl) wWinsEl.textContent = stats.whiteWins;
    if (bWinsEl) bWinsEl.textContent = stats.blackWins;
    if (drawsEl) drawsEl.textContent = stats.draws;
  }

  function handleUndo() {
    engine.undo();
    reviewMoveIndex = null;
    clearSelection();
    clock.switchTurn(engine.turn);
    renderAll();
  }

  function handleRedo() {
    engine.redo();
    reviewMoveIndex = null;
    clearSelection();
    clock.switchTurn(engine.turn);
    renderAll();
  }

  function handleFlipBoard() {
    boardOrientation = boardOrientation === 'w' ? 'b' : 'w';
    renderAll();
  }

  function confirmResign() {
    if (engine.gameStatus !== 'active') return;
    openConfirmModal(
      'RESIGN GAME?',
      'Are you sure you want to resign the game?',
      () => {
        engine.resign(engine.turn);
        ChessSound.playGameOver();
        renderAll();
        handleGameOver();
      }
    );
  }

  function confirmDraw() {
    if (engine.gameStatus !== 'active') return;
    openConfirmModal(
      'OFFER DRAW?',
      'Both players agree to a draw?',
      () => {
        engine.agreeDraw();
        ChessSound.playGameOver();
        renderAll();
        handleGameOver();
      }
    );
  }

  let pendingConfirmationAction = null;
  function openConfirmModal(title, text, action) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-text').textContent = text;
    pendingConfirmationAction = action;
    openModal('modal-confirm');
  }

  function executeConfirmation() {
    closeModal('modal-confirm');
    if (pendingConfirmationAction) {
      pendingConfirmationAction();
      pendingConfirmationAction = null;
    }
  }

  function openNewGameModal() {
    openModal('modal-new-game');
  }

  function openSettingsModal() {
    document.getElementById('setting-app-theme').value = settings.theme;
    document.getElementById('setting-board-theme').value = settings.boardTheme;
    document.getElementById('setting-coords').checked = settings.showCoords;
    document.getElementById('setting-hints').checked = settings.showMoveHints;
    document.getElementById('setting-autoflip').checked = settings.autoFlip;
    document.getElementById('setting-sound').checked = settings.soundEnabled;
    openModal('modal-settings');
  }

  function startNewGameFromForm(e) {
    e.preventDefault();
    closeModal('modal-new-game');

    const timeChoice = document.getElementById('new-game-time').value;

    boardOrientation = 'w';

    // Parse time control
    let timeInSec = 600;
    let incInSec = 0;
    if (timeChoice === '1+0') { timeInSec = 60; incInSec = 0; }
    else if (timeChoice === '3+0') { timeInSec = 180; incInSec = 0; }
    else if (timeChoice === '5+0') { timeInSec = 300; incInSec = 0; }
    else if (timeChoice === '10+0') { timeInSec = 600; incInSec = 0; }
    else if (timeChoice === '15+10') { timeInSec = 900; incInSec = 10; }
    else if (timeChoice === '30+0') { timeInSec = 1800; incInSec = 0; }
    else if (timeChoice === '0+0') { timeInSec = 0; incInSec = 0; }

    engine.reset();
    clock.setConfig(timeInSec, incInSec);
    if (timeInSec > 0) clock.start('w');

    reviewMoveIndex = null;
    clearSelection();
    renderAll();
  }

  function toggleTheme() {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    ChessStorage.saveSettings(settings);
    applySettings();
  }

  function toggleSound() {
    settings.soundEnabled = !settings.soundEnabled;
    ChessStorage.saveSettings(settings);
    applySettings();
  }

  function updateSoundBtnIcon() {
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) btn.textContent = settings.soundEnabled ? '🔊' : '🔇';
  }

  function copyPGN() {
    const pgn = engine.generatePGN();
    navigator.clipboard.writeText(pgn).then(() => {
      const btn = document.getElementById('btn-pgn-copy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy PGN'; }, 1500);
    });
  }

  function downloadPGN() {
    const pgn = engine.generatePGN();
    const blob = new Blob([pgn], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `furqan_chess_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openModal(modalId) {
    closeAllModals();
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  function closeModal(modalOrId) {
    const modal = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
    if (modal) modal.classList.remove('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  }

  return { init: init };
})();
