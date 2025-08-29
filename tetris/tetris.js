(function(){
  const canvas=document.getElementById('board');
  const ctx=canvas.getContext('2d');
  const nextCanvas=document.getElementById('next');
  const nextCtx=nextCanvas.getContext('2d');

  const scale=24; const cols=10; const rows=20;
  canvas.width=cols*scale; canvas.height=rows*scale;

  const COLORS=[null,'#00f0f0','#0000f0','#f0a000','#f0f000','#00f000','#a000f0','#f00000'];
  const SHAPES=[ [], [[1,1,1,1]], [[2,0,0],[2,2,2]], [[0,0,3],[3,3,3]], [[4,4],[4,4]], [[0,5,5],[5,5,0]], [[6,6,6],[0,6,0]], [[7,7,0],[0,7,7]] ];

  function rotate(matrix){
    const N=matrix.length; const res=Array.from({length:N},()=>Array(N).fill(0));
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) res[c][N-1-r]=matrix[r][c];
    return res;
  }

  function createMatrix(w,h){const m=[]; for(let i=0;i<h;i++) m.push(new Array(w).fill(0)); return m;}

  let arena=createMatrix(cols,rows);
  let player={pos:{x:0,y:0},matrix:null,score:0,lines:0,level:1};
  let dropInterval=1000; let dropCounter=0; let lastTime=0; let gameOver=false; let paused=false;

  function randomPiece(){
    const id=Math.floor(Math.random()*7)+1;
    const shape=SHAPES[id].map(row=>row.slice());
    const size=Math.max(shape.length,shape[0].length);
    const matrix=Array.from({length:size},()=>Array(size).fill(0));
    for(let r=0;r<shape.length;r++) for(let c=0;c<shape[r].length;c++) matrix[r][c]=shape[r][c];
    return {id,matrix};
  }

  function merge(arena,player){
    player.matrix.forEach((row,y)=>{
      row.forEach((val,x)=>{
        if(val){arena[y+player.pos.y][x+player.pos.x]=val}
      });
    });
  }

  function collide(arena,player){
    const m=player.matrix; const o=player.pos;
    for(let y=0;y<m.length;y++) for(let x=0;x<m[y].length;x++){
      if(m[y][x]!==0){
        if(!arena[y+o.y] || arena[y+o.y][x+o.x]!==0) return true;
      }
    }
    return false;
  }

  function sweep(){
    let rowCount=0;
    outer: for(let y=arena.length-1;y>=0;y--){
      for(let x=0;x<arena[y].length;x++) if(arena[y][x]===0) continue outer;
      const row=arena.splice(y,1)[0].fill(0); arena.unshift(row); y++; rowCount++;
    }
    if(rowCount>0){
      const points=[0,40,100,300,1200];
      player.score+=points[rowCount]*player.level;
      player.lines+=rowCount;
      player.level=Math.floor(player.lines/10)+1;
      dropInterval=Math.max(100,1000-(player.level-1)*75);
      updateHUD();
    }
  }

  let next=randomPiece();
  function playerReset(){
    if(!next) next=randomPiece();
    player.matrix=next.matrix.map(r=>r.slice());
    player.pos.y=0; player.pos.x=Math.floor((cols-player.matrix[0].length)/2);
    next=randomPiece();
    if(collide(arena,player)){
      arena=createMatrix(cols,rows); player.score=0; player.lines=0; player.level=1;
      gameOver=true; updateHUD();
      setTimeout(()=>{alert('게임오버');},100);
    }
    updateNext();
  }

  function playerDrop(){player.pos.y++; if(collide(arena,player)){player.pos.y--; merge(arena,player); sweep(); playerReset();} dropCounter=0;}
  function playerMove(dir){player.pos.x+=dir; if(collide(arena,player)) player.pos.x-=dir;}
  function playerRotate(){const pos=player.pos.x; player.matrix=rotate(player.matrix); let offset=1; while(collide(arena,player)){player.pos.x+=offset; offset=-(offset+(offset>0?1:-1)); if(offset>player.matrix[0].length){player.matrix=rotate(rotate(rotate(player.matrix))); player.pos.x=pos; return;}}}

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<arena.length;y++){
      for(let x=0;x<arena[y].length;x++){
        const val=arena[y][x];
        if(val){ctx.fillStyle=COLORS[val]; ctx.fillRect(x*scale,y*scale,scale-1,scale-1);}
      }
    }
    player.matrix.forEach((row,y)=>{
      row.forEach((val,x)=>{
        if(val){ctx.fillStyle=COLORS[val]; ctx.fillRect((x+player.pos.x)*scale,(y+player.pos.y)*scale,scale-1,scale-1);}
      });
    });
  }

  function updateNext(){
    nextCtx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
    const size=next.matrix.length; const tile=Math.floor(nextCanvas.width/size);
    for(let y=0;y<size;y++) for(let x=0;x<size;x++){
      const v=next.matrix[y][x];
      if(v){nextCtx.fillStyle=COLORS[v]; nextCtx.fillRect(x*tile,y*tile,tile-2,tile-2);}
    }
  }

  function updateHUD(){
    document.getElementById('score').innerText=player.score;
    document.getElementById('lines').innerText=player.lines;
    document.getElementById('level').innerText=player.level;
  }

  function update(time=0){if(paused){lastTime=time; requestAnimationFrame(update); return;} const deltaTime=time-lastTime; lastTime=time; dropCounter+=deltaTime; if(dropCounter>dropInterval){playerDrop();} draw(); requestAnimationFrame(update);}

  document.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft') playerMove(-1);
    else if(e.key==='ArrowRight') playerMove(1);
    else if(e.key==='ArrowDown') playerDrop();
    else if(e.key==='ArrowUp') playerRotate();
    else if(e.code==='Space'){while(!collide(arena,player)){player.pos.y++} player.pos.y--; merge(arena,player); sweep(); playerReset();}
  });

  document.getElementById('
