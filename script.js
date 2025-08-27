// script.js : Pygame 체스 포팅
// 많은 부분을 원본 파이게임 코드 구조와 동일하게 유지했습니다.

const WIDTH = 640, HEIGHT = 640;
const ROWS = 8, COLS = 8;
const SQ = WIDTH / COLS;
const FPS = 60;

const LIGHT = [240,217,181];
const DARK = [181,136,99];
const HIGHLIGHT = [246,246,105];
const SELECTED = [186,202,68];
const LAST_MOVE = [170,162,58];
const TEXT = [25,25,25];

function rgb(arr){
  return `rgb(${arr[0]},${arr[1]},${arr[2]})`;
}

// ------------------------------
// Move, Board (포팅)
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
    let promo = this.promotion ? '='+this.promotion : '';
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
    // [wk, wq, bk, bq]
    this.castle_rights = [true,true,true,true];
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
    // pawn
    if(white_attacker){
      for(let dc of [-1,1]){
        let rr=r-1, cc=c+dc;
        if(this.in_bounds(rr,cc) && this.grid[rr][cc] === 'P') return true;
      }
    } else {
      for(let dc of [-1,1]){
        let rr=r+1, cc=c+dc;
        if(this.in_bounds(rr,cc) && this.grid[rr][cc] === 'p') return true;
      }
    }

    // knight
    let knights = white_attacker ? 'N' : 'n';
    let knMoves = [[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1]];
    for(let [dr,dc] of knMoves){
      let rr=r+dr, cc=c+dc;
      if(this.in_bounds(rr,cc) && this.grid[rr][cc] === knights) return true;
    }

    // bishop/queen diagonals
    let bishops = white_attacker ? 'B' : 'b';
    let queens = white_attacker ? 'Q' : 'q';
    let diagDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for(let [dr,dc] of diagDirs){
      let rr=r+dr, cc=c+dc;
      while(this.in_bounds(rr,cc)){
        let p = this.grid[rr][cc];
        if(p !== '.'){
          if(p === bishops || p === queens) return true;
          break;
        }
        rr += dr; cc += dc;
      }
    }

    // rook/queen straight
    let rooks = white_attacker ? 'R' : 'r';
    let straightDirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for(let [dr,dc] of straightDirs){
      let rr=r+dr, cc=c+dc;
      while(this.in_bounds(rr,cc)){
        let p = this.grid[rr][cc];
        if(p !== '.'){
          if(p === rooks || p === queens) return true;
          break;
        }
        rr += dr; cc += dc;
      }
    }

    // king
    let king = white_attacker ? 'K' : 'k';
    for(let dr=-1; dr<=1; dr++){
      for(let dc=-1; dc<=1; dc++){
        if(dr===0 && dc===0) continue;
        let rr=r+dr, cc=c+dc;
        if(this.in_bounds(rr,cc) && this.grid[rr][cc] === king) return true;
      }
    }

    return false;
  }

  in_check(white_turn){
    let [kr,kc] = this.king_pos(white_turn);
    return this.square_attacked_by(kr,kc, !white_turn);
  }

  generate_pseudo_legal(){
    let moves = [];
    let side_white = this.white_to_move;
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        let p = this.grid[r][c];
        if(p==='.') continue;
        if(side_white && !this.is_white(p)) continue;
        if(!side_white && !this.is_black(p)) continue;
        let up = p.toUpperCase();
        if(up==='P') this._pawn_moves(r,c,moves);
        else if(up==='N') this._knight_moves(r,c,moves);
        else if(up==='B') this._slider_moves(r,c,moves,true,false);
        else if(up==='R') this._slider_moves(r,c,moves,false,true);
        else if(up==='Q') this._slider_moves(r,c,moves,true,true);
        else if(up==='K') this._king_moves(r,c,moves);
      }
    }
    return moves;
  }

  generate_legal(){
    let legal = [];
    for(let m of this.generate_pseudo_legal()){
      this.push(m);
      if(!this.in_check(!this.white_to_move)) legal.push(m);
      this.pop();
    }
    return legal;
  }

  _pawn_moves(r,c,moves){
    let p = this.grid[r][c];
    let white = /[A-Z]/.test(p);
    let dir = white ? -1 : 1;
    let start_row = white ? 6 : 1;
    let prom_row = white ? 0 : 7;
    let one = [r+dir, c];
    if(this.in_bounds(one[0],one[1]) && this.grid[one[0]][one[1]] === '.'){
      if(one[0] === prom_row){
        const promos = ['Q','R','B','N'];
        for(let promo of promos) moves.push(new Move([r,c], one, p, '.', white ? promo : promo.toLowerCase()));
      } else {
        moves.push(new Move([r,c], one, p));
      }
      let two = [r+2*dir, c];
      if(r === start_row && this.in_bounds(two[0],two[1]) && this.grid[two[0]][two[1]] === '.'){
        moves.push(new Move([r,c], two, p));
      }
    }
    // captures
    for(let dc of [-1,1]){
      let to = [r+dir, c+dc];
      if(this.in_bounds(to[0],to[1])){
        let tgt = this.grid[to[0]][to[1]];
        if(tgt !== '.' && (this.is_white(p) !== this.is_white(tgt))){
          if(to[0] === prom_row){
            const promos = ['Q','R','B','N'];
            for(let promo of promos) moves.push(new Move([r,c], to, p, tgt, this.is_white(p) ? promo : promo.toLowerCase()));
          } else {
            moves.push(new Move([r,c], to, p, tgt));
          }
        }
      }
    }

    // en passant
    if(this.en_passant){
      let [er,ec] = this.en_passant;
      if(r + dir === er && Math.abs(c - ec) === 1){
        moves.push(new Move([r,c], [er,ec], p, white ? 'p' : 'P', null, false, true));
      }
    }
  }

  _knight_moves(r,c,moves){
    let p = this.grid[r][c];
    let deltas = [[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1]];
    for(let [dr,dc] of deltas){
      let rr=r+dr, cc=c+dc;
      if(!this.in_bounds(rr,cc)) continue;
      let tgt = this.grid[rr][cc];
      if(tgt === '.' || this.is_white(tgt) !== this.is_white(p)){
        moves.push(new Move([r,c],[rr,cc],p,tgt));
      }
    }
  }

  _slider_moves(r,c,moves,diagonals,straights){
    let p = this.grid[r][c];
    let dirs = [];
    if(diagonals) dirs.push([1,1],[1,-1],[-1,1],[-1,-1]);
    if(straights) dirs.push([1,0],[-1,0],[0,1],[0,-1]);
    for(let [dr,dc] of dirs){
      let rr=r+dr, cc=c+dc;
      while(this.in_bounds(rr,cc)){
        let tgt = this.grid[rr][cc];
        if(tgt === '.'){
          moves.push(new Move([r,c],[rr,cc],p,'.'));
        } else {
          if(this.is_white(tgt) !== this.is_white(p)){
            moves.push(new Move([r,c],[rr,cc],p,tgt));
          }
          break;
        }
        rr += dr; cc += dc;
      }
    }
  }

  _king_moves(r,c,moves){
    let p = this.grid[r][c];
    for(let dr=-1; dr<=1; dr++){
      for(let dc=-1; dc<=1; dc++){
        if(dr===0 && dc===0) continue;
        let rr=r+dr, cc=c+dc;
        if(!this.in_bounds(rr,cc)) continue;
        let tgt = this.grid[rr][cc];
        if(tgt === '.' || this.is_white(tgt) !== this.is_white(p)){
          moves.push(new Move([r,c],[rr,cc],p,tgt));
        }
      }
    }
    // castling
    let white = /[A-Z]/.test(p);
    let kr = white ? 7 : 0, kc = 4;
    if(r===kr && c===kc){
      let [wk,wq,bk,bq] = this.castle_rights;
      let rights = white ? [wk,wq] : [bk,bq];
      let enemy = !white;
      // king side
      if(rights[0]){
        if(this.grid[r][5] === '.' && this.grid[r][6] === '.'){
          if(!(this.square_attacked_by(r,4,enemy) || this.square_attacked_by(r,5,enemy) || this.square_attacked_by(r,6,enemy))){
            moves.push(new Move([r,c],[r,6],p,'.',null,true));
          }
        }
      }
      // queen side
      if(rights[1]){
        if(this.grid[r][1] === '.' && this.grid[r][2] === '.' && this.grid[r][3] === '.'){
          if(!(this.square_attacked_by(r,4,enemy) || this.square_attacked_by(r,3,enemy) || this.square_attacked_by(r,2,enemy))){
            moves.push(new Move([r,c],[r,2],p,'.',null,true));
          }
        }
      }
    }
  }

  push(m){
    let [src_r, src_c] = m.src;
    let [dst_r, dst_c] = m.dst;

    m.prev_en_passant = this.en_passant ? [this.en_passant[0], this.en_passant[1]] : null;
    m.prev_castle_rights = this.castle_rights.slice();

    let piece = m.piece;
    // en passant capture
    if(m.is_en_passant){
      let cap_r = dst_r + (this.is_white(m.piece) ? 1 : -1);
      m.captured = this.grid[cap_r][dst_c];
      this.grid[cap_r][dst_c] = '.';
    }

    // normal move
    this.set_piece(m.src, '.');
    this.set_piece(m.dst, m.piece);

    // castling: move rook
    if(m.is_castle){
      if(dst_c === 6){
        let rook_from = [src_r,7], rook_to = [src_r,5];
        let rook = this.piece_at(rook_from);
        this.set_piece(rook_from, '.');
        this.set_piece(rook_to, rook);
      } else {
        let rook_from = [src_r,0], rook_to = [src_r,3];
        let rook = this.piece_at(rook_from);
        this.set_piece(rook_from, '.');
        this.set_piece(rook_to, rook);
      }
    }

    // promotion
    if(m.promotion){
      this.set_piece(m.dst, m.promotion);
    }

    // castle rights updates
    if(piece === 'K'){
      this.castle_rights[0] = false; this.castle_rights[1] = false;
    } else if(piece === 'k'){
      this.castle_rights[2] = false; this.castle_rights[3] = false;
    }
    if(m.src[0] === 7 && m.src[1] === 7 || m.dst[0]===7 && m.dst[1]===7) this.castle_rights[0] = false;
    if(m.src[0] === 7 && m.src[1] === 0 || m.dst[0]===7 && m.dst[1]===0) this.castle_rights[1] = false;
    if(m.src[0] === 0 && m.src[1] === 7 || m.dst[0]===0 && m.dst[1]===7) this.castle_rights[2] = false;
    if(m.src[0] === 0 && m.src[1] === 0 || m.dst[0]===0 && m.dst[1]===0) this.castle_rights[3] = false;

    // en passant target
    this.en_passant = null;
    if(piece.toUpperCase() === 'P' && Math.abs(dst_r-src_r) === 2){
      let mid_r = (dst_r + src_r) / 2;
      this.en_passant = [mid_r, src_c];
    }

    this.white_to_move = !this.white_to_move;
    this.move_history.push(m);
    this.last_move = m;
  }

  pop(){
    if(this.move_history.length === 0) return;
    let m = this.move_history.pop();
    let [src_r, src_c] = m.src;
    let [dst_r, dst_c] = m.dst;

    // basic restore
    this.set_piece(m.src, m.piece);
    this.set_piece(m.dst, m.captured);

    // promotion restore - pawn back at src
    if(m.promotion){
      let pawn = /[A-Z]/.test(m.piece) ? 'P' : 'p';
      this.set_piece(m.src, pawn);
    }

    // castling restore
    if(m.is_castle){
      if(dst_c === 6){
        let rook_from = [src_r,7], rook_to = [src_r,5];
        let rook = this.piece_at(rook_to);
        this.set_piece(rook_to, '.');
        this.set_piece(rook_from, rook);
      } else {
        let rook_from = [src_r,0], rook_to = [src_r,3];
        let rook = this.piece_at(rook_to);
        this.set_piece(rook_to, '.');
        this.set_piece(rook_from, rook);
      }
    }

    // en passant restore
    if(m.is_en_passant){
      this.set_piece(m.dst, '.');
      let cap_r = m.dst[0] + (this.is_white(m.piece) ? 1 : -1);
      this.set_piece([cap_r, m.dst[1]], m.captured);
    }

    // side, rights, en_passant
    this.white_to_move = !this.white_to_move;
    this.en_passant = m.prev_en_passant ? [m.prev_en_passant[0], m.prev_en_passant[1]] : null;
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
    this.canvas = document.getElementById('board-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.board = new Board();
    this.selected = null;
    this.cached_legal = [];
    this.promotion_pending = null; // Move placeholder
    this.last_tick = 0;

    this.statusEl = document.getElementById('status');
    document.getElementById('reset-btn').addEventListener('click', ()=>this.reset());
    document.getElementById('undo-btn').addEventListener('click', ()=>this.undo());
    window.addEventListener('keydown', (e)=>this.onKey(e));
    this.canvas.addEventListener('mousedown', (e)=>this.onMouse(e));

    // promo overlay
    this.promoOverlay = document.getElementById('promo-overlay');
    this.promoOptions = document.getElementById('promo-options');
    this.promoOverlay.addEventListener('mousedown',(ev)=> {
      // click outside handled by target check
      if(ev.target === this.promoOverlay) {
        // do nothing
      }
    });

    this.draw();
    // animation loop
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loop(timestamp){
    // simple render tick (no heavy logic)
    if(timestamp - this.last_tick > 1000 / FPS){
      this.draw();
      this.last_tick = timestamp;
    }
    requestAnimationFrame(this.loop);
  }

  reset(){
    this.board = new Board();
    this.selected = null;
    this.cached_legal = [];
    this.promotion_pending = null;
    this.hidePromotion();
  }

  undo(){
    this.board.pop();
    this.selected = null;
    this.cached_legal = [];
    this.promotion_pending = null;
    this.hidePromotion();
  }

  onKey(e){
    if(e.key === 'r' || e.key === 'R') this.reset();
    if(e.key === 'u' || e.key === 'U') this.undo();
  }

  rc_from_mouse(evt){
    const rect = this.canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    let c = Math.floor(x / SQ);
    let r = Math.floor(y / SQ);
    return [r,c];
  }

  onMouse(e){
    if(this.promotion_pending){
      // overlay will handle
      return;
    }
    let [r,c] = this.rc_from_mouse(e);
    if(!(r>=0 && r<8 && c>=0 && c<8)) return;

    if(this.selected){
      for(let m of this.cached_legal){
        if(m.src[0]==this.selected[0] && m.src[1]==this.selected[1] && m.dst[0]==r && m.dst[1]==c){
          // promotion?
          if(m.piece.toUpperCase() === 'P'){
            if((/[A-Z]/.test(m.piece) && m.dst[0] === 0) || (/[a-z]/.test(m.piece) && m.dst[0] === 7)){
              // temporary queen promotion and show overlay
              m.promotion = /[A-Z]/.test(m.piece) ? 'Q' : 'q';
              this.board.push(m);
              // store pending move as copy (we'll pop and re-push with user's choice)
              this.promotion_pending = new Move(m.src, m.dst, m.piece, m.captured, null, m.is_castle, m.is_en_passant, m.prev_en_passant, m.prev_castle_rights);
              this.showPromotion(/[A-Z]/.test(m.piece));
              this.selected = null;
              this.cached_legal = [];
              return;
            }
          }
          // normal move
          this.board.push(m);
          this.selected = null;
          this.cached_legal = [];
          return;
        }
      }
    }

    // select logic
    let p = this.board.grid[r][c];
    if(p !== '.' && (/[A-Z]/.test(p) === this.board.white_to_move)){
      this.selected = [r,c];
      this.cached_legal = this.board.legal_moves();
    } else {
      this.selected = null;
      this.cached_legal = [];
    }
  }

  showPromotion(isWhite){
    // options Q R B N (case depends on color)
    this.promoOptions.innerHTML = '';
    const opts = ['Q','R','B','N'];
    for(let ch of opts){
      let el = document.createElement('div');
      el.className = 'promo-option';
      el.textContent = ch;
      el.addEventListener('click', ()=>{
        this.choosePromotion(isWhite ? ch : ch.toLowerCase());
      });
      this.promoOptions.appendChild(el);
    }
    this.promoOverlay.classList.remove('hidden');
  }

  hidePromotion(){
    this.promoOverlay.classList.add('hidden');
  }

  choosePromotion(promoChar){
    if(!this.promotion_pending) return;
    // we had pushed a temporary queen promotion; revert and push final
    this.board.pop();
    this.promotion_pending.promotion = promoChar;
    this.board.push(this.promotion_pending);
    this.promotion_pending = null;
    this.hidePromotion();
  }

  draw(){
    // clear
    this.ctx.clearRect(0,0,WIDTH,HEIGHT);

    // draw squares
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        let color = ((r+c)%2===0) ? rgb(LIGHT) : rgb(DARK);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(c*SQ, r*SQ, SQ, SQ);
      }
    }

    // last move highlight
    if(this.board.last_move){
      let sr = this.board.last_move.src[0], sc = this.board.last_move.src[1];
      let dr = this.board.last_move.dst[0], dc = this.board.last_move.dst[1];
      this.ctx.fillStyle = rgb(LAST_MOVE);
      this.ctx.fillRect(sc*SQ, sr*SQ, SQ, SQ);
      this.ctx.fillRect(dc*SQ, dr*SQ, SQ, SQ);
    }

    // selected and legal
    if(this.selected){
      this.ctx.fillStyle = rgb(SELECTED);
      this.ctx.fillRect(this.selected[1]*SQ, this.selected[0]*SQ, SQ, SQ);
      for(let m of this.cached_legal){
        if(m.src[0] === this.selected[0] && m.src[1] === this.selected[1]){
          let rr = m.dst[0], cc = m.dst[1];
          // draw circle
          this.ctx.beginPath();
          this.ctx.fillStyle = rgb(HIGHLIGHT);
          this.ctx.arc(cc*SQ + SQ/2, rr*SQ + SQ/2, 10, 0, Math.PI*2);
          this.ctx.fill();
        }
      }
    }

    // pieces
    for(let r=0;r<8;r++){
      for(let c=0;c<8;c++){
        let p = this.board.grid[r][c];
        if(p === '.') continue;
        this.draw_piece(r,c,p);
      }
    }

    // status text
    let status = this.board.white_to_move ? "백 차례" : "흑 차례";
    if(this.board.checkmate()){
      status = this.board.white_to_move ? "체크메이트 — 흑 승" : "체크메이트 — 백 승";
    } else if(this.board.stalemate()){
      status = "스테일메이트 — 무승부";
    }
    this.statusEl.textContent = status;
  }

  draw_piece(r,c,p){
    let centerX = c*SQ + SQ/2, centerY = r*SQ + SQ/2;
    let radius = SQ/2 - 6;
    let fill = /[A-Z]/.test(p) ? '#f0f0f0' : '#202020';
    let edge = '#3c3c3c';
    // circle
    this.ctx.beginPath();
    this.ctx.fillStyle = fill;
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI*2);
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = edge;
    this.ctx.stroke();
    // text
    this.ctx.fillStyle = /[A-Z]/.test(p) ? '#000' : '#fff';
    this.ctx.font = `${Math.floor(SQ*0.45)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(p.toUpperCase(), centerX, centerY + 2);
  }
}

// ------------------------------
// 시작
// ------------------------------
window.addEventListener('load', ()=> {
  const g = new Game();
});
