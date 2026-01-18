// script.js : Pygame 체스 포팅 (유니코드 DOM 기반, 체크메이트, 킹 캡처 명시적 방지)

const WIDTH = 640, HEIGHT = 640;
const ROWS = 8, COLS = 8;
const SQ = WIDTH / COLS;
const FPS = 60;

// CSS 클래스 정의
const LIGHT_COLOR = 'light';
const DARK_COLOR = 'dark';
const HIGHLIGHT_CLASS = 'highlight';
const SELECTED_CLASS = 'selected';
const LAST_MOVE_CLASS = 'last-move';

// FEN 문자와 유니코드를 연결하는 맵 객체
const PIECE_TO_UNICODE = {
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
};

const PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

const MATE_SCORE = 100000;

function evaluateBoard(board){
    if (board.checkmate()){
        return board.white_to_move ? -MATE_SCORE : MATE_SCORE;
    }
    if (board.stalemate()){
        return 0;
    }
    let score = 0;
    for (let r=0; r<8; r++){
        for (let c=0; c<8; c++){
            const p = board.grid[r][c];
            if (p === '.') continue;
            const value = PIECE_VALUES[p.toLowerCase()] || 0;
            score += /[A-Z]/.test(p) ? value : -value;
        }
    }
    return score;
}

function minimax(board, depth, alpha, beta){
    if (depth === 0 || board.checkmate() || board.stalemate()){
        return evaluateBoard(board);
    }
    const moves = board.legal_moves();
    if (board.white_to_move){
        let maxEval = -Infinity;
        for (const m of moves){
            board.push(m);
            const evalScore = minimax(board, depth - 1, alpha, beta);
            board.pop();
            if (evalScore > maxEval) maxEval = evalScore;
            if (evalScore > alpha) alpha = evalScore;
            if (beta <= alpha) break;
        }
        return maxEval;
    }
    let minEval = Infinity;
    for (const m of moves){
        board.push(m);
        const evalScore = minimax(board, depth - 1, alpha, beta);
        board.pop();
        if (evalScore < minEval) minEval = evalScore;
        if (evalScore < beta) beta = evalScore;
        if (beta <= alpha) break;
    }
    return minEval;
}

// ------------------------------
// Move, Board
// ------------------------------
class Move {
    constructor(src, dst, piece, captured='.', promotion=null, is_castle=false, is_en_passant=false, prev_en_passant=null, prev_castle_rights=[false,false,false,false]){
        this.src = src;
        this.dst = dst;
        this.piece = piece;
        this.captured = captured;
        this.promotion = promotion;
        this.is_castle = is_castle;
        this.is_en_passant = is_en_passant;
        this.prev_en_passant = prev_en_passant;
        this.prev_castle_rights = prev_castle_rights.slice();
    }
    toString(){
        const promo = this.promotion ? '='+this.promotion : '';
        return `${this.piece}${this.src}->${this.dst}${promo}`;
    }
}

class Board {
    constructor(){
        this.grid = [
@@ -388,210 +447,289 @@ class Board {
        // side, rights, en_passant
        this.white_to_move = !this.white_to_move;
        this.en_passant = m.prev_en_passant ? [...m.prev_en_passant] : null;
        this.castle_rights = m.prev_castle_rights.slice();
        this.last_move = this.move_history.length ? this.move_history[this.move_history.length-1] : null;
    }

    legal_moves(){ return this.generate_legal(); }
    has_legal_move(){ return this.legal_moves().length > 0; }
    checkmate(){ return this.in_check(this.white_to_move) && !this.has_legal_move(); }
    stalemate(){ return (!this.in_check(this.white_to_move)) && (!this.has_legal_move()); }
}

// ------------------------------
// UI / Game
// ------------------------------
class Game {
    constructor(){
        this.boardEl = document.getElementById('chessboard');
        this.board = new Board();
        this.selected = null;
        this.cached_legal = [];
        this.promotion_pending = null;
        this.last_tick = 0;

        this.statusEl = document.getElementById('status');
        this.aiLevelEl = document.getElementById('ai-level');
        this.aiToggleEl = document.getElementById('ai-toggle');
        this.aiEnabled = this.aiToggleEl ? this.aiToggleEl.checked : true;
        this.aiLevel = this.aiLevelEl ? this.aiLevelEl.value : 'normal';
        this.aiThinking = false;
        document.getElementById('reset-btn').addEventListener('click', ()=>this.reset());
        document.getElementById('undo-btn').addEventListener('click', ()=>this.undo());
        window.addEventListener('keydown', (e)=>this.onKey(e));
        this.boardEl.addEventListener('click', (e)=>this.onBoardClick(e));
        if (this.aiLevelEl){
            this.aiLevelEl.addEventListener('change', ()=>{
                this.aiLevel = this.aiLevelEl.value;
            });
        }
        if (this.aiToggleEl){
            this.aiToggleEl.addEventListener('change', ()=>{
                this.aiEnabled = this.aiToggleEl.checked;
                this.maybeMakeAiMove();
            });
        }

        this.promoOverlay = document.getElementById('promo-overlay');
        this.promoOptions = document.getElementById('promo-options');
        this.promoOverlay.addEventListener('click', (ev)=>{
            if (ev.target.classList.contains('promo-piece')) {
                // 내부에서 처리
            } else if (ev.target === this.promoOverlay) {
                // 바깥 클릭 무시
            }
        });

        this.setupBoardUI();
        this.draw();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    setupBoardUI(){
        this.boardEl.innerHTML = '';
        for (let r=0; r<ROWS; r++){
            for (let c=0; c<COLS; c++){
                const squareEl = document.createElement('div');
                squareEl.className = 'square ' + (((r+c)%2===0) ? LIGHT_COLOR : DARK_COLOR);
                squareEl.dataset.row = r;
                squareEl.dataset.col = c;
                squareEl.innerHTML = `<span class="piece" data-row="${r}" data-col="${c}"></span>`;
                this.boardEl.appendChild(squareEl);
            }
        }
    }

    getSquareEl(r,c){
        return this.boardEl.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
    }

    getPieceEl(r,c){
        const sq = this.getSquareEl(r,c);
        return sq ? sq.querySelector('.piece') : null;
    }

    loop(timestamp){
        if (timestamp - this.last_tick > 1000 / FPS){
            this.last_tick = timestamp;
        }
        requestAnimationFrame(this.loop);
    }

    reset(){
        this.board = new Board();
        this.selected = null;
        this.cached_legal = [];
        this.promotion_pending = null;
        this.aiThinking = false;
        this.hidePromotion();
        this.draw();
    }

    undo(){
        this.board.pop();
        this.selected = null;
        this.cached_legal = [];
        this.promotion_pending = null;
        this.aiThinking = false;
        this.hidePromotion();
        this.draw();
        this.maybeMakeAiMove();
    }

    onKey(e){
        if (e.key === 'r' || e.key === 'R') this.reset();
        if (e.key === 'u' || e.key === 'U') this.undo();
    }

    onBoardClick(e){
        // 게임 종료 시 입력 차단
        if (this.board.checkmate() || this.board.stalemate()) return;
        if (this.promotion_pending) return;

        const target = e.target.closest('.square');
        if (!target) return;

        const r = parseInt(target.dataset.row, 10);
        const c = parseInt(target.dataset.col, 10);
        if (!(r>=0 && r<8 && c>=0 && c<8)) return;

        if (this.selected){
            // 선택된 말의 합법수만 캐싱된 상태에서 매칭
            for (const m of this.cached_legal){
                if (m.dst[0]===r && m.dst[1]===c){
                    // 프로모션?
                    if (m.piece.toUpperCase() === 'P'){
                        const destRow = m.dst[0];
                        const isWhite = /[A-Z]/.test(m.piece);
                        if ((isWhite && destRow===0) || (!isWhite && destRow===7)){
                            // 임시 이동 상태로 프로모션 선택 띄우기
                            this.board.push(m);
                            this.promotion_pending = new Move(m.src, m.dst, m.piece, m.captured, null, m.is_castle, m.is_en_passant, m.prev_en_passant, m.prev_castle_rights);
                            this.board.pop();

                            this.selected = null;
                            this.cached_legal = [];
                            this.draw();
                            this.showPromotion(isWhite, r, c);
                            return;
                        }
                    }
                    // 일반 이동
                    this.board.push(m);
                    this.selected = null;
                    this.cached_legal = [];
                    this.draw();
                    this.maybeMakeAiMove();
                    return;
                }
            }
        }

        // 선택 로직: 현재 차례의 말만 선택
        const p = this.board.grid[r][c];
        if (p !== '.' && (/[A-Z]/.test(p) === this.board.white_to_move)){
            this.selected = [r,c];
            // 전체 합법수에서 선택 말의 수만 필터링하여 캐싱
            const all = this.board.legal_moves();
            this.cached_legal = all.filter(m => m.src[0]===r && m.src[1]===c);
        } else {
            this.selected = null;
            this.cached_legal = [];
        }
        this.draw();␊
    }␊

    showPromotion(isWhite, r, c){
        this.promoOptions.innerHTML = '';
        const opts = ['Q','R','B','N'];
        for (const ch of opts){
            const promoChar = isWhite ? ch : ch.toLowerCase();
            const el = document.createElement('div');
            el.className = 'promo-piece';
            el.textContent = PIECE_TO_UNICODE[promoChar];
            el.classList.add(isWhite ? 'white' : 'black');
            el.addEventListener('click', ()=> this.choosePromotion(promoChar));
            this.promoOptions.appendChild(el);
        }
        this.promoOverlay.classList.remove('hidden');
    }

    hidePromotion(){
        this.promoOverlay.classList.add('hidden');
    }

    choosePromotion(promoChar){
        if (!this.promotion_pending) return;
        this.promotion_pending.promotion = promoChar;
        this.board.push(this.promotion_pending);
        this.promotion_pending = null;
        this.hidePromotion();
        this.draw();
        this.maybeMakeAiMove();
    }

    isAiTurn(){
        return this.aiEnabled && !this.board.white_to_move && !this.promotion_pending &&
            !this.board.checkmate() && !this.board.stalemate();
    }

    getAiDepth(){
        if (this.aiLevel === 'easy') return 1;
        if (this.aiLevel === 'hard') return 3;
        return 2;
    }

    selectAiMove(){
        const moves = this.board.legal_moves();
        if (moves.length === 0) return null;
        if (this.aiLevel === 'easy'){
            return moves[Math.floor(Math.random() * moves.length)];
        }
        const depth = this.getAiDepth();
        let bestMove = null;
        let bestScore = this.board.white_to_move ? -Infinity : Infinity;
        for (const m of moves){
            this.board.push(m);
            const score = minimax(this.board, depth - 1, -Infinity, Infinity);
            this.board.pop();
            if (this.board.white_to_move){
                if (score > bestScore){
                    bestScore = score;
                    bestMove = m;
                }
            } else {
                if (score < bestScore){
                    bestScore = score;
                    bestMove = m;
                }
            }
        }
        return bestMove || moves[0];
    }

    maybeMakeAiMove(){
        if (!this.isAiTurn() || this.aiThinking) return;
        this.aiThinking = true;
        setTimeout(()=>{
            if (!this.isAiTurn()){
                this.aiThinking = false;
                return;
            }
            const move = this.selectAiMove();
            if (move){
                this.board.push(move);
                this.selected = null;
                this.cached_legal = [];
                this.draw();
            }
            this.aiThinking = false;
        }, 200);
    }

    draw(){
        // 1) 하이라이트/선택 초기화
        this.boardEl.querySelectorAll('.square').forEach(el=>{
            el.classList.remove(SELECTED_CLASS, HIGHLIGHT_CLASS, LAST_MOVE_CLASS);
        });

        // 2) 마지막 수 하이라이트
        if (this.board.last_move){
            const {src, dst} = this.board.last_move;
            this.getSquareEl(src[0], src[1])?.classList.add(LAST_MOVE_CLASS);
            this.getSquareEl(dst[0], dst[1])?.classList.add(LAST_MOVE_CLASS);
        }

        // 3) 선택 및 합법 목적지 하이라이트
        if (this.selected){
            const [sr, sc] = this.selected;
            this.getSquareEl(sr, sc)?.classList.add(SELECTED_CLASS);
            for (const m of this.cached_legal){
                this.getSquareEl(m.dst[0], m.dst[1])?.classList.add(HIGHLIGHT_CLASS);
            }
        }

        // 4) 말 렌더링 (유니코드)
        for (let r=0; r<ROWS; r++){


@@ -92,60 +92,84 @@ h1 {
