// Chess engine handling board state, legal moves, and game rules
const ChessEngine = (function () {
  'use strict';

  // Board coordinates: files a-h map to columns 0-7, ranks 8-1 map to rows 0-7
  const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

  function squareToCoords(square) {
    if (!square || square.length !== 2) return null;
    const c = FILES.indexOf(square[0]);
    const r = RANKS.indexOf(square[1]);
    if (c === -1 || r === -1) return null;
    return { r, c };
  }

  function coordsToSquare(r, c) {
    if (r < 0 || r > 7 || c < 0 || c > 7) return null;
    return FILES[c] + RANKS[r];
  }

  function cloneBoard(board) {
    return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
  }

  // Set up the starting position
  function initialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const backRow = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: backRow[c], color: 'b', moved: false, id: `b_${backRow[c]}_${c}` };
      board[1][c] = { type: 'p', color: 'b', moved: false, id: `b_p_${c}` };
    }

    for (let c = 0; c < 8; c++) {
      board[6][c] = { type: 'p', color: 'w', moved: false, id: `w_p_${c}` };
      board[7][c] = { type: backRow[c], color: 'w', moved: false, id: `w_${backRow[c]}_${c}` };
    }

    return board;
  }

  class Engine {
    constructor() {
      this.reset();
    }

    reset() {
      this.board = initialBoard();
      this.turn = 'w';
      this.castlingRights = {
        w: { k: true, q: true },
        b: { k: true, q: true }
      };
      this.enPassantTarget = null;
      this.halfmoveClock = 0;
      this.fullmoveNumber = 1;

      this.moveHistory = [];
      this.redoStack = [];
      this.positionHistory = [];

      // Possible statuses: active, checkmate, stalemate, draw-50move,
      // draw-repetition, draw-insufficient, draw-agreement, resigned, timeout
      this.gameStatus = 'active';
      this.winner = null;

      this.recordPosition();
    }

    recordPosition() {
      this.positionHistory.push(this.generatePositionKey());
    }

    // Build a FEN-like key for repetition detection
    generatePositionKey() {
      let fen = '';
      for (let r = 0; r < 8; r++) {
        let empty = 0;
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (!p) {
            empty++;
          } else {
            if (empty > 0) { fen += empty; empty = 0; }
            fen += p.color === 'w' ? p.type.toUpperCase() : p.type;
          }
        }
        if (empty > 0) fen += empty;
        if (r < 7) fen += '/';
      }

      fen += ` ${this.turn}`;

      let castle = '';
      if (this.castlingRights.w.k) castle += 'K';
      if (this.castlingRights.w.q) castle += 'Q';
      if (this.castlingRights.b.k) castle += 'k';
      if (this.castlingRights.b.q) castle += 'q';
      fen += ` ${castle || '-'}`;

      // Only include en passant square if a legal capture is actually possible
      let epStr = '-';
      if (this.enPassantTarget) {
        if (this.canPerformLegalEnPassant(this.board, this.turn, this.enPassantTarget)) {
          epStr = coordsToSquare(this.enPassantTarget.r, this.enPassantTarget.c);
        }
      }
      fen += ` ${epStr}`;

      return fen;
    }

    // Check if any pawn can legally perform en passant right now
    canPerformLegalEnPassant(board, color, epTarget) {
      const pawnRow = color === 'w' ? epTarget.r + 1 : epTarget.r - 1;
      const attackCols = [epTarget.c - 1, epTarget.c + 1];

      for (const c of attackCols) {
        if (c >= 0 && c <= 7) {
          const p = board[pawnRow][c];
          if (p && p.color === color && p.type === 'p') {
            const simBoard = cloneBoard(board);
            simBoard[epTarget.r][epTarget.c] = simBoard[pawnRow][c];
            simBoard[pawnRow][c] = null;
            simBoard[pawnRow][epTarget.c] = null;

            if (!this.isKingInCheckOnBoard(simBoard, color)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    // Can the attacker color hit the target square?
    isSquareAttacked(board, targetR, targetC, attackerColor) {
      // Pawn attacks
      const pawnDir = attackerColor === 'w' ? 1 : -1;
      const pawnR = targetR + pawnDir;
      if (pawnR >= 0 && pawnR <= 7) {
        for (const dc of [-1, 1]) {
          const pawnC = targetC + dc;
          if (pawnC >= 0 && pawnC <= 7) {
            const p = board[pawnR][pawnC];
            if (p && p.color === attackerColor && p.type === 'p') return true;
          }
        }
      }

      // Knight attacks
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightOffsets) {
        const nr = targetR + dr;
        const nc = targetC + dc;
        if (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          const p = board[nr][nc];
          if (p && p.color === attackerColor && p.type === 'n') return true;
        }
      }

      // King attacks (adjacent squares)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const kr = targetR + dr;
          const kc = targetC + dc;
          if (kr >= 0 && kr <= 7 && kc >= 0 && kc <= 7) {
            const p = board[kr][kc];
            if (p && p.color === attackerColor && p.type === 'k') return true;
          }
        }
      }

      // Sliding pieces: rook/queen on straights, bishop/queen on diagonals
      const directions = [
        { dr: -1, dc: 0, types: ['r', 'q'] },
        { dr: 1, dc: 0, types: ['r', 'q'] },
        { dr: 0, dc: -1, types: ['r', 'q'] },
        { dr: 0, dc: 1, types: ['r', 'q'] },
        { dr: -1, dc: -1, types: ['b', 'q'] },
        { dr: -1, dc: 1, types: ['b', 'q'] },
        { dr: 1, dc: -1, types: ['b', 'q'] },
        { dr: 1, dc: 1, types: ['b', 'q'] }
      ];

      for (const dir of directions) {
        let nr = targetR + dir.dr;
        let nc = targetC + dir.dc;
        while (nr >= 0 && nr <= 7 && nc >= 0 && nc <= 7) {
          const p = board[nr][nc];
          if (p) {
            if (p.color === attackerColor && dir.types.includes(p.type)) return true;
            break;
          }
          nr += dir.dr;
          nc += dir.dc;
        }
      }

      return false;
    }

    findKingSquare(board, color) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.color === color && p.type === 'k') return { r, c };
        }
      }
      return null;
    }

    isKingInCheckOnBoard(board, color) {
      const kingSq = this.findKingSquare(board, color);
      if (!kingSq) return false;
      return this.isSquareAttacked(board, kingSq.r, kingSq.c, color === 'w' ? 'b' : 'w');
    }

    isKingInCheck(color = this.turn) {
      return this.isKingInCheckOnBoard(this.board, color);
    }

    // Generate all moves without checking if they leave the king in check
    getPseudoLegalMoves(board = this.board, color = this.turn, castlingRights = this.castlingRights, enPassantTarget = this.enPassantTarget) {
      const moves = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (!piece || piece.color !== color) continue;

          switch (piece.type) {
            case 'p': this.getPawnMoves(board, r, c, color, enPassantTarget, moves); break;
            case 'n': this.getKnightMoves(board, r, c, color, moves); break;
            case 'b': this.getSlidingMoves(board, r, c, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]], moves); break;
            case 'r': this.getSlidingMoves(board, r, c, color, [[-1, 0], [1, 0], [0, -1], [0, 1]], moves); break;
            case 'q': this.getSlidingMoves(board, r, c, color, [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], moves); break;
            case 'k': this.getKingMoves(board, r, c, color, castlingRights, moves); break;
          }
        }
      }

      return moves;
    }

    getPawnMoves(board, r, c, color, epTarget, moves) {
      const dir = color === 'w' ? -1 : 1;
      const startRank = color === 'w' ? 6 : 1;
      const promoRank = color === 'w' ? 0 : 7;

      // One square forward
      const fr = r + dir;
      if (fr >= 0 && fr <= 7 && !board[fr][c]) {
        if (fr === promoRank) {
          for (const promo of ['q', 'r', 'b', 'n']) {
            moves.push({ from: { r, c }, to: { r: fr, c }, promotion: promo });
          }
        } else {
          moves.push({ from: { r, c }, to: { r: fr, c } });
        }

        // Two squares forward from starting rank
        const ffr = r + 2 * dir;
        if (r === startRank && !board[ffr][c]) {
          moves.push({ from: { r, c }, to: { r: ffr, c } });
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const tc = c + dc;
        if (tc >= 0 && tc <= 7) {
          const tr = r + dir;
          if (tr >= 0 && tr <= 7) {
            const targetPiece = board[tr][tc];
            if (targetPiece && targetPiece.color !== color) {
              if (tr === promoRank) {
                for (const promo of ['q', 'r', 'b', 'n']) {
                  moves.push({ from: { r, c }, to: { r: tr, c: tc }, promotion: promo });
                }
              } else {
                moves.push({ from: { r, c }, to: { r: tr, c: tc } });
              }
            } else if (epTarget && epTarget.r === tr && epTarget.c === tc) {
              moves.push({ from: { r, c }, to: { r: tr, c: tc }, isEnPassant: true });
            }
          }
        }
      }
    }

    getKnightMoves(board, r, c, color, moves) {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const tr = r + dr;
        const tc = c + dc;
        if (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
          const target = board[tr][tc];
          if (!target || target.color !== color) {
            moves.push({ from: { r, c }, to: { r: tr, c: tc } });
          }
        }
      }
    }

    getSlidingMoves(board, r, c, color, directions, moves) {
      for (const [dr, dc] of directions) {
        let tr = r + dr;
        let tc = c + dc;
        while (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
          const target = board[tr][tc];
          if (!target) {
            moves.push({ from: { r, c }, to: { r: tr, c: tc } });
          } else {
            if (target.color !== color) {
              moves.push({ from: { r, c }, to: { r: tr, c: tc } });
            }
            break;
          }
          tr += dr;
          tc += dc;
        }
      }
    }

    getKingMoves(board, r, c, color, castlingRights, moves) {
      // Normal king moves (one square any direction)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const tr = r + dr;
          const tc = c + dc;
          if (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
            const target = board[tr][tc];
            if (!target || target.color !== color) {
              moves.push({ from: { r, c }, to: { r: tr, c: tc } });
            }
          }
        }
      }

      // Castling: king must be on e1/e8, path must be clear, no check through
      const enemyColor = color === 'w' ? 'b' : 'w';
      const kRank = color === 'w' ? 7 : 0;
      if (r === kRank && c === 4) {
        // Kingside
        if (castlingRights[color].k) {
          if (!board[kRank][5] && !board[kRank][6]) {
            if (
              !this.isSquareAttacked(board, kRank, 4, enemyColor) &&
              !this.isSquareAttacked(board, kRank, 5, enemyColor) &&
              !this.isSquareAttacked(board, kRank, 6, enemyColor)
            ) {
              moves.push({ from: { r, c }, to: { r: kRank, c: 6 }, isCastle: 'k' });
            }
          }
        }
        // Queenside
        if (castlingRights[color].q) {
          if (!board[kRank][1] && !board[kRank][2] && !board[kRank][3]) {
            if (
              !this.isSquareAttacked(board, kRank, 4, enemyColor) &&
              !this.isSquareAttacked(board, kRank, 3, enemyColor) &&
              !this.isSquareAttacked(board, kRank, 2, enemyColor)
            ) {
              moves.push({ from: { r, c }, to: { r: kRank, c: 2 }, isCastle: 'q' });
            }
          }
        }
      }
    }

    // Filter pseudo-legal moves down to only those that don't leave king in check
    getLegalMoves(color = this.turn) {
      if (this.gameStatus !== 'active') return [];

      const pseudoMoves = this.getPseudoLegalMoves(this.board, color, this.castlingRights, this.enPassantTarget);
      const legalMoves = [];

      for (const move of pseudoMoves) {
        if (this.isMoveLegal(move, color)) {
          legalMoves.push(move);
        }
      }

      return legalMoves;
    }

    // Simulate a move and check if the king is still safe
    isMoveLegal(move, color = this.turn) {
      const simBoard = cloneBoard(this.board);
      const { from, to, isEnPassant, isCastle } = move;

      const piece = simBoard[from.r][from.c];
      simBoard[to.r][to.c] = piece;
      simBoard[from.r][from.c] = null;

      if (isEnPassant) {
        const capturedPawnRow = color === 'w' ? to.r + 1 : to.r - 1;
        simBoard[capturedPawnRow][to.c] = null;
      }

      if (isCastle === 'k') {
        const r = color === 'w' ? 7 : 0;
        simBoard[r][5] = simBoard[r][7];
        simBoard[r][7] = null;
      } else if (isCastle === 'q') {
        const r = color === 'w' ? 7 : 0;
        simBoard[r][3] = simBoard[r][0];
        simBoard[r][0] = null;
      }

      return !this.isKingInCheckOnBoard(simBoard, color);
    }

    // Apply a move to the board. Returns false if the move is illegal.
    makeMove(candidateMove) {
      if (this.gameStatus !== 'active') return false;

      const legalMoves = this.getLegalMoves(this.turn);
      const move = legalMoves.find(m =>
        m.from.r === candidateMove.from.r &&
        m.from.c === candidateMove.from.c &&
        m.to.r === candidateMove.to.r &&
        m.to.c === candidateMove.to.c &&
        (m.promotion || null) === (candidateMove.promotion || null)
      );

      if (!move) return false;

      const { from, to, promotion, isEnPassant, isCastle } = move;
      const piece = this.board[from.r][from.c];
      const captured = this.board[to.r][to.c];

      // Snapshot the board before applying, needed for SAN disambiguation
      const preMoveBoard = cloneBoard(this.board);

      // Save everything we need to undo this move later
      const moveRecord = {
        from: { ...from },
        to: { ...to },
        piece: { ...piece },
        captured: captured ? { ...captured } : null,
        capturedSquare: { ...to },
        promotion: promotion || null,
        isCastle: isCastle || null,
        isEnPassant: !!isEnPassant,
        castlingRightsBefore: JSON.parse(JSON.stringify(this.castlingRights)),
        enPassantTargetBefore: this.enPassantTarget ? { ...this.enPassantTarget } : null,
        halfmoveClockBefore: this.halfmoveClock,
        san: ''
      };

      // Move the piece
      this.board[to.r][to.c] = piece;
      this.board[from.r][from.c] = null;
      piece.moved = true;

      // Handle en passant capture (remove the captured pawn)
      if (isEnPassant) {
        const epPawnRow = this.turn === 'w' ? to.r + 1 : to.r - 1;
        moveRecord.captured = { ...this.board[epPawnRow][to.c] };
        moveRecord.capturedSquare = { r: epPawnRow, c: to.c };
        this.board[epPawnRow][to.c] = null;
      }

      // Pawn promotion
      if (promotion) {
        this.board[to.r][to.c] = {
          type: promotion,
          color: this.turn,
          moved: true,
          id: `${this.turn}_${promotion}_${Date.now()}`
        };
      }

      // Move the rook for castling
      if (isCastle === 'k') {
        const r = this.turn === 'w' ? 7 : 0;
        const rook = this.board[r][7];
        this.board[r][5] = rook;
        this.board[r][7] = null;
        if (rook) rook.moved = true;
      } else if (isCastle === 'q') {
        const r = this.turn === 'w' ? 7 : 0;
        const rook = this.board[r][0];
        this.board[r][3] = rook;
        this.board[r][0] = null;
        if (rook) rook.moved = true;
      }

      // Update castling rights when king or rook moves
      if (piece.type === 'k') {
        this.castlingRights[this.turn].k = false;
        this.castlingRights[this.turn].q = false;
      } else if (piece.type === 'r') {
        if (from.r === 7 && from.c === 7) this.castlingRights.w.k = false;
        if (from.r === 7 && from.c === 0) this.castlingRights.w.q = false;
        if (from.r === 0 && from.c === 7) this.castlingRights.b.k = false;
        if (from.r === 0 && from.c === 0) this.castlingRights.b.q = false;
      }

      // Revoke castling if a rook gets captured on its home square
      if (moveRecord.captured && moveRecord.captured.type === 'r') {
        const capSq = moveRecord.capturedSquare;
        if (capSq.r === 7 && capSq.c === 7) this.castlingRights.w.k = false;
        if (capSq.r === 7 && capSq.c === 0) this.castlingRights.w.q = false;
        if (capSq.r === 0 && capSq.c === 7) this.castlingRights.b.k = false;
        if (capSq.r === 0 && capSq.c === 0) this.castlingRights.b.q = false;
      }

      // Set en passant target if a pawn double-stepped
      if (piece.type === 'p' && Math.abs(to.r - from.r) === 2) {
        this.enPassantTarget = { r: (from.r + to.r) / 2, c: from.c };
      } else {
        this.enPassantTarget = null;
      }

      // Halfmove clock: reset on pawn move or capture, otherwise increment
      if (piece.type === 'p' || moveRecord.captured) {
        this.halfmoveClock = 0;
      } else {
        this.halfmoveClock++;
      }

      if (this.turn === 'b') {
        this.fullmoveNumber++;
      }

      // Switch sides
      const movedColor = this.turn;
      this.turn = this.turn === 'w' ? 'b' : 'w';

      // Build the SAN string using the pre-move board for disambiguation
      moveRecord.san = this.generateSAN(moveRecord, movedColor, legalMoves, preMoveBoard);
      this.moveHistory.push(moveRecord);
      this.redoStack = [];

      this.evaluateGameStatus();
      this.recordPosition();

      return true;
    }

    // Build standard algebraic notation for the move
    // Uses preMoveBoard so disambiguation lookups see pieces in their original positions
    generateSAN(moveRecord, movedColor, legalMoves, preMoveBoard) {
      const { from, to, promotion, isCastle, isEnPassant, piece, captured } = moveRecord;
      const pType = piece.type;

      if (isCastle === 'k') return 'O-O';
      if (isCastle === 'q') return 'O-O-O';

      let san = '';
      const isCapture = !!captured || isEnPassant;

      if (pType !== 'p') {
        san += pType.toUpperCase();

        // Disambiguate when multiple same-type pieces can reach the same square
        const ambiguous = legalMoves.filter(m => {
          if (m.from.r === from.r && m.from.c === from.c) return false;
          if (m.to.r !== to.r || m.to.c !== to.c) return false;
          const p = preMoveBoard[m.from.r][m.from.c];
          return p && p.type === pType && p.color === movedColor;
        });

        if (ambiguous.length > 0) {
          const sameFile = ambiguous.some(m => m.from.c === from.c);
          const sameRank = ambiguous.some(m => m.from.r === from.r);

          if (!sameFile) {
            san += FILES[from.c];
          } else if (!sameRank) {
            san += RANKS[from.r];
          } else {
            san += FILES[from.c] + RANKS[from.r];
          }
        }
      } else {
        if (isCapture) {
          san += FILES[from.c];
        }
      }

      if (isCapture) san += 'x';
      san += coordsToSquare(to.r, to.c);
      if (promotion) san += '=' + promotion.toUpperCase();

      // Add check/checkmate symbols
      const nextTurnLegal = this.getLegalMoves(this.turn);
      const inCheck = this.isKingInCheck(this.turn);

      if (inCheck) {
        san += nextTurnLegal.length === 0 ? '#' : '+';
      }

      return san;
    }

    // Check all draw/checkmate/stalemate conditions
    evaluateGameStatus() {
      const nextLegalMoves = this.getLegalMoves(this.turn);
      const inCheck = this.isKingInCheck(this.turn);

      if (nextLegalMoves.length === 0) {
        if (inCheck) {
          this.gameStatus = 'checkmate';
          this.winner = this.turn === 'w' ? 'b' : 'w';
        } else {
          this.gameStatus = 'stalemate';
          this.winner = 'draw';
        }
        return;
      }

      // 50-move rule (100 half-moves)
      if (this.halfmoveClock >= 100) {
        this.gameStatus = 'draw-50move';
        this.winner = 'draw';
        return;
      }

      if (this.isInsufficientMaterial()) {
        this.gameStatus = 'draw-insufficient';
        this.winner = 'draw';
        return;
      }

      // Threefold repetition
      const currentKey = this.generatePositionKey();
      let count = 0;
      for (const k of this.positionHistory) {
        if (k === currentKey) count++;
      }
      if (count >= 3) {
        this.gameStatus = 'draw-repetition';
        this.winner = 'draw';
        return;
      }

      this.gameStatus = 'active';
    }

    // K vs K, K+B vs K, K+N vs K, K+B vs K+B (same color bishops)
    isInsufficientMaterial() {
      const pieces = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p) pieces.push({ ...p, r, c });
        }
      }

      if (pieces.length === 2) return true;

      if (pieces.length === 3) {
        const nonKing = pieces.find(p => p.type !== 'k');
        if (nonKing && (nonKing.type === 'b' || nonKing.type === 'n')) return true;
      }

      if (pieces.length === 4) {
        const bishops = pieces.filter(p => p.type === 'b');
        if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
          const b1Color = (bishops[0].r + bishops[0].c) % 2;
          const b2Color = (bishops[1].r + bishops[1].c) % 2;
          if (b1Color === b2Color) return true;
        }
      }

      return false;
    }

    undo() {
      if (this.moveHistory.length === 0) return false;

      const moveRecord = this.moveHistory.pop();
      this.redoStack.push(moveRecord);

      const { from, to, piece, captured, capturedSquare, promotion, isCastle, isEnPassant, castlingRightsBefore, enPassantTargetBefore, halfmoveClockBefore } = moveRecord;

      // Put the piece back where it was
      this.board[from.r][from.c] = piece;
      this.board[to.r][to.c] = null;

      // Restore any captured piece
      if (captured && capturedSquare) {
        this.board[capturedSquare.r][capturedSquare.c] = captured;
      }

      // Undo rook movement for castling
      if (isCastle === 'k') {
        const r = piece.color === 'w' ? 7 : 0;
        this.board[r][7] = this.board[r][5];
        this.board[r][5] = null;
        if (this.board[r][7]) this.board[r][7].moved = false;
      } else if (isCastle === 'q') {
        const r = piece.color === 'w' ? 7 : 0;
        this.board[r][0] = this.board[r][3];
        this.board[r][3] = null;
        if (this.board[r][0]) this.board[r][0].moved = false;
      }

      // Restore previous state
      this.castlingRights = JSON.parse(JSON.stringify(castlingRightsBefore));
      this.enPassantTarget = enPassantTargetBefore ? { ...enPassantTargetBefore } : null;
      this.halfmoveClock = halfmoveClockBefore;

      if (this.turn === 'w') this.fullmoveNumber--;
      this.turn = this.turn === 'w' ? 'b' : 'w';

      this.gameStatus = 'active';
      this.winner = null;
      this.positionHistory.pop();

      return true;
    }

    // FIX: Save and restore redoStack around makeMove so it doesn't get wiped
    redo() {
      if (this.redoStack.length === 0) return false;
      const moveRecord = this.redoStack.pop();
      const savedRedoStack = [...this.redoStack];
      const result = this.makeMove(moveRecord);
      this.redoStack = savedRedoStack;
      return result;
    }

    resign(color) {
      if (this.gameStatus !== 'active') return;
      this.gameStatus = 'resigned';
      this.winner = color === 'w' ? 'b' : 'w';
    }

    agreeDraw() {
      if (this.gameStatus !== 'active') return;
      this.gameStatus = 'draw-agreement';
      this.winner = 'draw';
    }

    timeout(colorOnClock) {
      if (this.gameStatus !== 'active') return;
      this.gameStatus = 'timeout';
      this.winner = colorOnClock === 'w' ? 'b' : 'w';
    }

    // Figure out what each side has captured by comparing board to initial piece counts
    getCapturedPieces() {
      const whiteCaptured = [];
      const blackCaptured = [];
      const currentPieces = { w: {}, b: {} };

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p) {
            currentPieces[p.color][p.type] = (currentPieces[p.color][p.type] || 0) + 1;
          }
        }
      }

      const initialCounts = { p: 8, r: 2, n: 2, b: 2, q: 1, k: 1 };

      for (const type of ['p', 'n', 'b', 'r', 'q']) {
        const whiteOnBoard = currentPieces.w[type] || 0;
        const blackOnBoard = currentPieces.b[type] || 0;

        const missingWhite = initialCounts[type] - whiteOnBoard;
        const missingBlack = initialCounts[type] - blackOnBoard;

        for (let i = 0; i < missingWhite; i++) whiteCaptured.push(type);
        for (let i = 0; i < missingBlack; i++) blackCaptured.push(type);
      }

      return {
        whiteCaptured, // white pieces that got captured (black took them)
        blackCaptured  // black pieces that got captured (white took them)
      };
    }

    getMaterialAdvantage() {
      let whiteScore = 0;
      let blackScore = 0;

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = this.board[r][c];
          if (p) {
            const val = ChessPieces.VALUES[p.type] || 0;
            if (p.color === 'w') whiteScore += val;
            else blackScore += val;
          }
        }
      }

      return {
        white: whiteScore - blackScore,
        black: blackScore - whiteScore
      };
    }

    generatePGN(headers = {}) {
      let pgn = '';
      pgn += `[Event "${headers.event || 'Furqan Chess Game'}"]\n`;
      pgn += `[Site "${headers.site || 'Local'}"]\n`;
      pgn += `[Date "${headers.date || new Date().toISOString().split('T')[0]}"]\n`;
      pgn += `[Round "${headers.round || '1'}"]\n`;
      pgn += `[White "${headers.white || 'Player 1'}"]\n`;
      pgn += `[Black "${headers.black || 'Player 2'}"]\n`;

      let resultStr = '*';
      if (this.winner === 'w') resultStr = '1-0';
      else if (this.winner === 'b') resultStr = '0-1';
      else if (this.winner === 'draw') resultStr = '1/2-1/2';

      pgn += `[Result "${resultStr}"]\n\n`;

      let moveText = '';
      for (let i = 0; i < this.moveHistory.length; i++) {
        if (i % 2 === 0) moveText += `${Math.floor(i / 2) + 1}. `;
        moveText += `${this.moveHistory[i].san} `;
      }
      moveText += resultStr;

      return pgn + moveText;
    }
  }

  return {
    Engine: Engine,
    squareToCoords: squareToCoords,
    coordsToSquare: coordsToSquare,
    FILES: FILES,
    RANKS: RANKS
  };
})();
