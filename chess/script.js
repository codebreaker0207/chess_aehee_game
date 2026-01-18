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
            "rnbqkbnr".split(''),
            "pppppppp".split(''),
            "........".split(''),
            "........".split(''),
            "........".split(''),
            "........".split(''),
            "PPPPPPPP".split(''),
            "RNBQKBNR".split('')
        ];
        this.white_to_move = true;
        this.castle_rights = [true, true, true, true]; // [wk, wq, bk, bq]
        this.en_passant = null;
        this.move_history = [];
        this.last_move = null;
    }

    in_bounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
    piece_at(rc){ return this.grid[rc[0]][rc[1]]; }
    set_piece(rc,p){ this.grid[rc[0]][rc[1]] = p; }
    is_white(p){ return p !== '.' && /[A-Z]/.test(p); }
    is_black(p){ return p !== '.' && /[a-z]/.test(p); }

    king_pos(white){
        const target = white ? 'K' : 'k';
        for(let r=0;r<8;r++){
            for(let c=0;c<8;c++){
                if(this.grid[r][c]===target) return [r,c];
            }
        }
        return [-1,-1];
    }

    square_attacked_by(r,c,white_attacker){
        // pawn (FIXED: 방향 수정)
        if (white_attacker) {
            for (let dc of [-1, 1]) {
                const rr = r + 1, cc = c + dc; // (r,c)를 공격하려면 (r+1, c±1)에 백 폰 존재
                if (this.in_bounds(rr, cc) && this.grid[rr][cc] === 'P') return true;
            }
        } else {
            for (let dc of [-1, 1]) {
                const rr = r - 1, cc = c + dc; // (r,c)를 공격하려면 (r-1, c±1)에 흑 폰 존재
                if (this.in_bounds(rr, cc) && this.grid[rr][cc] === 'p') return true;
            }
        }
        // knight
        const knights = white_attacker ? 'N' : 'n';
        const knMoves = [[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1]];
        for (const [dr,dc] of knMoves){
            const rr=r+dr, cc=c+dc;
            if (this.in_bounds(rr,cc) && this.grid[rr][cc] === knights) return true;
        }
        // bishop/queen diagonals
        const bishops = white_attacker ? 'B' : 'b';
        const queens = white_attacker ? 'Q' : 'q';
        const diagDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr,dc] of diagDirs){
            let rr=r+dr, cc=c+dc;
            while (this.in_bounds(rr,cc)){
                const p = this.grid[rr][cc];
                if (p !== '.') { if (p===bishops || p===queens) return true; break; }
                rr+=dr; cc+=dc;
            }
        }
        // rook/queen straight
        const rooks = white_attacker ? 'R' : 'r';
        const straightDirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr,dc] of straightDirs){
            let rr=r+dr, cc=c+dc;
            while (this.in_bounds(rr,cc)){
                const p = this.grid[rr][cc];
                if (p !== '.') { if (p===rooks || p===queens) return true; break; }
                rr+=dr; cc+=dc;
            }
        }
        // king
        const king = white_attacker ? 'K' : 'k';
        for (let dr=-1; dr<=1; dr++){
            for (let dc=-1; dc<=1; dc++){
                if (dr===0 && dc===0) continue;
                const rr=r+dr, cc=c+dc;
                if (this.in_bounds(rr,cc) && this.grid[rr][cc] === king) return true;
            }
        }
        return false;
    }

    in_check(white_turn){
        const [kr,kc] = this.king_pos(white_turn);
        return this.square_attacked_by(kr,kc, !white_turn);
    }

    generate_pseudo_legal(){
        const moves = [];
        const side_white = this.white_to_move;
        for(let r=0;r<8;r++){
            for(let c=0;c<8;c++){
                const p = this.grid[r][c];
                if (p==='.') continue;
                if (side_white && !this.is_white(p)) continue;
                if (!side_white && !this.is_black(p)) continue;
                const up = p.toUpperCase();
                if (up==='P') this._pawn_moves(r,c,moves);
                else if (up==='N') this._knight_moves(r,c,moves);
                else if (up==='B') this._slider_moves(r,c,moves,true,false);
                else if (up==='R') this._slider_moves(r,c,moves,false,true);
                else if (up==='Q') this._slider_moves(r,c,moves,true,true);
                else if (up==='K') this._king_moves(r,c,moves);
            }
        }
        return moves;
    }
    generate_legal(){
        const legal = [];
        for (const m of this.generate_pseudo_legal()){
            // 명시적 킹 캡처 금지
            if (m.captured === 'k' || m.captured === 'K') continue;

            this.push(m);
            // 이동 결과, 자신의 킹이 체크면 불법
            if (!this.in_check(!this.white_to_move)) legal.push(m);
            this.pop();
        }
        return legal;
    }

    _pawn_moves(r,c,moves){
        const p = this.grid[r][c];
        const white = /[A-Z]/.test(p);
        const dir = white ? -1 : 1;
        const start_row = white ? 6 : 1;
        const prom_row = white ? 0 : 7;

        const one = [r+dir, c];
        if (this.in_bounds(one[0],one[1]) && this.grid[one[0]][one[1]] === '.'){
            if (one[0] === prom_row){
                for (const promo of ['Q','R','B','N'])
                    moves.push(new Move([r,c], one, p, '.', white ? promo : promo.toLowerCase()));
            } else {
                moves.push(new Move([r,c], one, p));
            }
            const two = [r+2*dir, c];
            if (r === start_row && this.in_bounds(two[0],two[1]) && this.grid[two[0]][two[1]] === '.'){
                moves.push(new Move([r,c], two, p));
            }
        }
        // captures
        for (const dc of [-1,1]){
            const to = [r+dir, c+dc];
            if (this.in_bounds(to[0],to[1])){
                const tgt = this.grid[to[0]][to[1]];
                if (tgt !== '.' && (this.is_white(p) !== this.is_white(tgt))){
                    if (to[0] === prom_row){
                        for (const promo of ['Q','R','B','N'])
                            moves.push(new Move([r,c], to, p, tgt, this.is_white(p) ? promo : promo.toLowerCase()));
                    } else {
                        moves.push(new Move([r,c], to, p, tgt));
                    }
                }
            }
        }
        // en passant
        if (this.en_passant){
            const [er,ec] = this.en_passant;
            if (r + dir === er && Math.abs(c - ec) === 1){
                moves.push(new Move([r,c], [er,ec], p, white ? 'p' : 'P', null, false, true));
            }
        }
    }

    _knight_moves(r,c,moves){                
        const p = this.grid[r][c];
        const deltas = [[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1]];
        for (const [dr,dc] of deltas){
            const rr=r+dr, cc=c+dc;
            if (!this.in_bounds(rr,cc)) continue;
            const tgt = this.grid[rr][cc];
            if (tgt === '.' || this.is_white(tgt) !== this.is_white(p)){
                moves.push(new Move([r,c],[rr,cc],p,tgt));
            }
        }
    }

    _slider_moves(r,c,moves,diagonals,straights){
        const p = this.grid[r][c];
        const dirs = [];
        if (diagonals) dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
        if (straights)  dirs.push([1,0],[-1,0],[0,1],[0,-1]);
        for (const [dr,dc] of dirs){
            let rr=r+dr, cc=c+dc;
            while (this.in_bounds(rr,cc)){
                const tgt = this.grid[rr][cc];
                if (tgt === '.'){
                    moves.push(new Move([r,c],[rr,cc],p,'.'));
                } else {
                    if (this.is_white(tgt) !== this.is_white(p))
                        moves.push(new Move([r,c],[rr,cc],p,tgt));
                    break;
                }
            }
        }
    }

    _king_moves(r,c,moves){
        const p = this.grid[r][c];
        // king steps
        for (let dr=-1; dr<=1; dr++){
            for (let dc=-1; dc<=1; dc++){
                if (dr===0 && dc===0) continue;
                const rr=r+dr, cc=c+dc;
                if (!this.in_bounds(rr,cc)) continue;
                const tgt = this.grid[rr][cc];
                if (tgt === '.' || this.is_white(tgt) !== this.is_white(p)){
                    moves.push(new Move([r,c],[rr,cc],p,tgt));
                }
            }
        }
        // castling
        const white = /[A-Z]/.test(p);
        const kr = white ? 7 : 0, kc = 4;
        if (r===kr && c===kc){
            const [wk,wq,bk,bq] = this.castle_rights;
            const rights = white ? [wk,wq] : [bk,bq];
            const enemy = !white;
            // king side
            if (rights[0]){
                if (this.grid[r][5]==='.' && this.grid[r][6]==='.' &&
                    !(this.square_attacked_by(r,4,enemy) || this.square_attacked_by(r,5,enemy) || this.square_attacked_by(r,6,enemy))){
                    moves.push(new Move([r,c],[r,6],p,'.',null,true));
                }
            }
            // queen side
            if (rights[1]){
                if (this.grid[r][1]==='.' && this.grid[r][2]==='.' && this.grid[r][3]==='.' &&
                    !(this.square_attacked_by(r,4,enemy) || this.square_attacked_by(r,3,enemy) || this.square_attacked_by(r,2,enemy))){
                    moves.push(new Move([r,c],[r,2],p,'.',null,true));
                }
            }
        }
    }

    push(m){
        const [src_r, src_c] = m.src;
        const [dst_r, dst_c] = m.dst;

        m.prev_en_passant = this.en_passant ? [...this.en_passant] : null;
        m.prev_castle_rights = this.castle_rights.slice();

        const piece = m.piece;

        // en passant capture
        if (m.is_en_passant){
            const cap_r = dst_r + (this.is_white(piece) ? 1 : -1);
            m.captured = this.grid[cap_r][dst_c];
            this.grid[cap_r][dst_c] = '.';
        }

        // normal move
        this.set_piece(m.src, '.');
        this.set_piece(m.dst, piece);

        // castling: move rook (CLEAN)
        if (m.is_castle){
            if (dst_c === 6){
                const rook_from = [src_r, 7], rook_to = [src_r, 5];
                const rook = this.piece_at(rook_from);
                this.set_piece(rook_from, '.');
                this.set_piece(rook_to, rook);
            } else {
                const rook_from = [src_r, 0], rook_to = [src_r, 3];
                const rook = this.piece_at(rook_from);
                this.set_piece(rook_from, '.');
                this.set_piece(rook_to, rook);
            }
        }

        // promotion
        if (m.promotion){
            this.set_piece(m.dst, m.promotion);
        }

        // castle rights updates (괄호 명확화)
        if (piece === 'K'){ this.castle_rights[0] = false; this.castle_rights[1] = false; }
        else if (piece === 'k'){ this.castle_rights[2] = false; this.castle_rights[3] = false; }

        if (((m.src[0] === 7 && m.src[1] === 7) || (m.dst[0] === 7 && m.dst[1] === 7))) this.castle_rights[0] = false; // WK-side rook
        if (((m.src[0] === 7 && m.src[1] === 0) || (m.dst[0] === 7 && m.dst[1] === 0))) this.castle_rights[1] = false; // WQ-side rook
        if (((m.src[0] === 0 && m.src[1] === 7) || (m.dst[0] === 0 && m.dst[1] === 7))) this.castle_rights[2] = false; // BK-side rook
        if (((m.src[0] === 0 && m.src[1] === 0) || (m.dst[0] === 0 && m.dst[1] === 0))) this.castle_rights[3] = false; // BQ-side rook

        // en passant target
        this.en_passant = null;
        if (piece.toUpperCase() === 'P' && Math.abs(dst_r - src_r) === 2){
            const mid_r = (dst_r + src_r) / 2;
            this.en_passant = [mid_r, src_c];
        }

        this.white_to_move = !this.white_to_move;
        this.move_history.push(m);
        this.last_move = m;
    }

    pop(){
        if (this.move_history.length === 0) return;

        const m = this.move_history.pop();
        const [src_r, src_c] = m.src;
        const [dst_r, dst_c] = m.dst;

        // basic restore
        this.set_piece(m.src, m.piece);
        this.set_piece(m.dst, m.captured);

        // promotion restore - pawn back at src
        if (m.promotion){
            const pawn = /[A-Z]/.test(m.piece) ? 'P' : 'p';
            this.set_piece(m.src, pawn);
        }

        // castling restore (CLEAN)
        if (m.is_castle){
            if (dst_c === 6){
                const rook_from = [src_r, 7], rook_to = [src_r, 5];
                const rook = this.piece_at(rook_to);
                this.set_piece(rook_to, '.');
                this.set_piece(rook_from, rook);
            } else {
                const rook_from = [src_r, 0], rook_to = [src_r, 3];
                const rook = this.piece_at(rook_to);
                this.set_piece(rook_to, '.');
                this.set_piece(rook_from, rook);
            }
        }

        // en passant restore
        if (m.is_en_passant){
            this.set_piece(m.dst, '.');
            const cap_r = m.dst[0] + (this.is_white(m.piece) ? 1 : -1);
            this.set_piece([cap_r, m.dst[1]], m.captured);
        }
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





        
        
