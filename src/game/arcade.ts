import type { ArcadeKind } from './types'
export type Command='left'|'right'|'up'|'down'|'rotate'|'drop'|'fire'
export interface Controls { left?:boolean;right?:boolean;up?:boolean;down?:boolean;fire?:boolean;targetY?:number }
export const W=360,H=440
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
const SHAPES=[[[1,1,1,1]],[[2,2],[2,2]],[[0,3,0],[3,3,3]],[[0,4,4],[4,4,0]],[[5,5,0],[0,5,5]],[[6,0,0],[6,6,6]],[[0,0,7],[7,7,7]]]
export const BLOCK_COLOURS=['','#a6ebd0','#f2d68e','#c6b3ee','#a8cbe9','#ebabb5','#efae7f','#9ed9ba']
export interface Piece {cells:number[][];x:number;y:number}
export interface Stack {board:number[][];piece:Piece;next:number[][];bag:number[];fall:number;lines:number}
export interface Pong {player:number;enemy:number;x:number;y:number;vx:number;vy:number;you:number;bot:number;rally:number;serve:number}
export interface Bullet {x:number;y:number;enemy:boolean}
export interface Alien {x:number;y:number;alive:boolean}
export interface Space {x:number;bullets:Bullet[];aliens:Alien[];direction:number;shoot:number;enemyShoot:number;wave:number;lives:number;invincible:number}
export interface ArcadeModel {kind:ArcadeKind;elapsed:number;score:number;over:boolean;result:string;stack:Stack;pong:Pong;space:Space}
function nextPiece(s:Stack,random= Math.random){
 if(!s.bag.length){s.bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=Math.floor(random()*(i+1));[s.bag[i],s.bag[j]]=[s.bag[j],s.bag[i]]}}
 return SHAPES[s.bag.pop()!].map(r=>[...r])
}
function fleet(wave:number):Alien[]{return Array.from({length:24},(_,i)=>({x:43+(i%6)*47,y:52+Math.floor(i/6)*32+Math.min(16,(wave-1)*4),alive:true}))}
export function newArcade(kind:ArcadeKind,random=Math.random):ArcadeModel {
 const stack:Stack={board:Array.from({length:16},()=>Array(10).fill(0)),piece:{cells:[],x:3,y:0},next:[],bag:[],fall:0,lines:0}
 stack.piece.cells=nextPiece(stack,random);stack.next=nextPiece(stack,random)
 return {kind,elapsed:0,score:0,over:false,result:'',stack,pong:{player:220,enemy:220,x:180,y:220,vx:-185,vy:80,you:0,bot:0,rally:0,serve:.8},space:{x:180,bullets:[],aliens:fleet(1),direction:1,shoot:0,enemyShoot:1,wave:1,lives:3,invincible:0}}
}
export function fits(s:Stack,p:Piece):boolean {
 return p.cells.every((row,y)=>row.every((n,x)=>!n||(p.x+x>=0&&p.x+x<10&&p.y+y<16&&(p.y+y<0||!s.board[p.y+y][p.x+x]))))
}
export function ghostY(s:Stack){let y=s.piece.y;while(fits(s,{...s.piece,y:y+1}))y++;return y}
function lock(m:ArcadeModel){
 const s=m.stack
 s.piece.cells.forEach((r,y)=>r.forEach((n,x)=>{if(n&&y+s.piece.y>=0)s.board[y+s.piece.y][x+s.piece.x]=n}))
 const remaining=s.board.filter(r=>!r.every(Boolean)),cleared=16-remaining.length
 s.board=[...Array.from({length:cleared},()=>Array(10).fill(0)),...remaining]
 s.lines+=cleared;m.score+=[0,100,300,500,800][cleared]*(1+Math.floor(s.lines/5))
 s.piece={cells:s.next,x:3,y:0};s.next=nextPiece(s);s.fall=0
 if(!fits(s,s.piece)){m.over=true;m.result='Stack full. One more try?'}
}
export function command(m:ArcadeModel,c:Command){
 if(m.over||m.kind!=='stack')return
 const s=m.stack,p=s.piece
 if(c==='left'||c==='right'){const next={...p,x:p.x+(c==='left'?-1:1)};if(fits(s,next))s.piece=next}
 if(c==='rotate'||c==='up'){
  const cells=p.cells[0].map((_,x)=>p.cells.map(r=>r[x]).reverse())
  for(const kick of [0,-1,1,-2,2]){const next={...p,cells,x:p.x+kick};if(fits(s,next)){s.piece=next;break}}
 }
 if(c==='down'){if(fits(s,{...p,y:p.y+1})){p.y++;m.score++}else lock(m)}
 if(c==='drop'){const y=ghostY(s);m.score+=(y-p.y)*2;p.y=y;lock(m)}
}
export function step(m:ArcadeModel,dt:number,keys:Controls={}){
 if(m.over||!Number.isFinite(dt)||dt<=0)return
 dt=Math.min(dt,.04);m.elapsed+=dt
 if(m.elapsed>=(m.kind==='space'?90:120)){m.over=true;m.result='Time! A fine day at the arcade.';return}
 if(m.kind==='stack'){
  m.stack.fall+=dt
  const interval=Math.max(.12,.8-Math.floor(m.stack.lines/5)*.09)
  if(m.stack.fall>=interval){m.stack.fall=0;const s=m.stack;if(fits(s,{...s.piece,y:s.piece.y+1}))s.piece.y++;else lock(m)}
 }else if(m.kind==='pong'){
  const p=m.pong
  p.player=clamp(keys.targetY??p.player+((keys.down?1:0)-(keys.up?1:0))*310*dt,40,H-40)
  const aim=p.vx>0?p.y+Math.sin(m.elapsed*2)*22:H/2
  p.enemy=clamp(p.enemy+clamp(aim-p.enemy,-(115+p.you*9)*dt,(115+p.you*9)*dt),40,H-40)
  if(p.serve>0){p.serve-=dt;return}
  p.x+=p.vx*dt;p.y+=p.vy*dt
  if(p.y<8){p.y=8;p.vy=Math.abs(p.vy)}if(p.y>H-8){p.y=H-8;p.vy=-Math.abs(p.vy)}
  if(p.vx<0&&p.x<=31&&p.x>=12&&Math.abs(p.y-p.player)<46){p.x=31;p.rally++;m.score+=10;const speed=Math.min(365,200+p.rally*14);p.vx=speed;p.vy=(p.y-p.player)*5}
  if(p.vx>0&&p.x>=W-31&&p.x<=W-12&&Math.abs(p.y-p.enemy)<46){p.x=W-31;p.vx=-Math.min(365,Math.abs(p.vx)+8);p.vy=(p.y-p.enemy)*5}
  if(p.x<0||p.x>W){if(p.x>W){p.you++;m.score+=100}else p.bot++;p.rally=0;p.x=W/2;p.y=H/2;p.vx=-190;p.vy=p.you%2?95:-95;p.serve=.65}
  if(p.you>=7||p.bot>=7){m.over=true;m.result=p.you>=7?'You beat Paddle Bot!':'Paddle Bot wins this one.';if(p.you>=7)m.score+=500}
 }else{
  const s=m.space
  s.x=clamp(s.x+((keys.right?1:0)-(keys.left?1:0))*260*dt,18,W-18)
  s.shoot-=dt;s.enemyShoot-=dt;s.invincible=Math.max(0,s.invincible-dt)
  if(keys.fire&&s.shoot<=0){s.bullets.push({x:s.x,y:H-42,enemy:false});s.shoot=.2}
  const alive=s.aliens.filter(a=>a.alive),speed=(20+s.wave*7+(24-alive.length)*1.6)*s.direction
  alive.forEach(a=>a.x+=speed*dt)
  if(alive.some(a=>a.x<18||a.x>W-18)){s.direction*=-1;alive.forEach(a=>{a.x=clamp(a.x,18,W-18);a.y+=14})}
  if(s.enemyShoot<=0&&alive.length){const a=alive[Math.floor((m.elapsed*7)%alive.length)];s.bullets.push({x:a.x,y:a.y+12,enemy:true});s.enemyShoot=Math.max(.25,1.0-s.wave*.12)}
  s.bullets.forEach(b=>{
   b.y+=(b.enemy?150+s.wave*15:-360)*dt
   if(!b.enemy){const a=alive.find(a=>a.alive&&Math.abs(a.x-b.x)<15&&Math.abs(a.y-b.y)<13);if(a){a.alive=false;b.y=-999;m.score+=25*s.wave}}
   else if(s.invincible===0&&Math.abs(b.x-s.x)<17&&Math.abs(b.y-(H-26))<17){s.lives--;s.invincible=1.5;b.y=999}
  })
  s.bullets=s.bullets.filter(b=>b.y>-10&&b.y<H+10)
  if(s.lives<=0||alive.some(a=>a.y>H-55)){m.over=true;m.result='Patrol complete. The galaxy thanks you.'}
  else if(s.aliens.every(a=>!a.alive)){m.score+=200;s.wave++;s.aliens=fleet(s.wave);s.bullets=[];s.enemyShoot=1}
 }
 if(m.elapsed>=(m.kind==='space'?90:120)){m.over=true;m.result='Time! A fine day at the arcade.'}
}

export function draw(ctx:CanvasRenderingContext2D,m:ArcadeModel){
 ctx.fillStyle='#102a30';ctx.fillRect(0,0,W,H)
 ctx.fillStyle='#234048';for(let y=18;y<H;y+=24)for(let x=18;x<W;x+=24)ctx.fillRect(x,y,1,1)
 ctx.font='14px monospace'
 if(m.kind==='stack'){
  const s=m.stack,cell=23,ox=18,oy=30
  ctx.fillStyle='#0b2025';ctx.fillRect(ox,oy,230,368)
  const block=(x:number,y:number,n:number,ghost=false)=>{ctx.fillStyle=BLOCK_COLOURS[n];ctx.globalAlpha=ghost?.18:1;ctx.fillRect(ox+x*cell+1,oy+y*cell+1,cell-2,cell-2);ctx.globalAlpha=1;if(!ghost){ctx.fillStyle='#ffffff45';ctx.fillRect(ox+x*cell+3,oy+y*cell+3,cell-6,3)}}
  s.board.forEach((r,y)=>r.forEach((n,x)=>{if(n)block(x,y,n)}))
  s.piece.cells.forEach((r,y)=>r.forEach((n,x)=>{if(n){block(s.piece.x+x,ghostY(s)+y,n,true);block(s.piece.x+x,s.piece.y+y,n)}}))
  ctx.fillStyle='#a9c5bc';ctx.fillText('NEXT',270,48);s.next.forEach((r,y)=>r.forEach((n,x)=>{if(n){ctx.fillStyle=BLOCK_COLOURS[n];ctx.fillRect(268+x*17,65+y*17,15,15)}}))
  ctx.fillStyle='#a9c5bc';ctx.fillText('LINES',270,157);ctx.fillStyle='#f5f2d5';ctx.font='24px monospace';ctx.fillText(String(s.lines),270,188);ctx.font='14px monospace';ctx.fillStyle='#a9c5bc';ctx.fillText('LEVEL',270,242);ctx.fillText(String(1+Math.floor(s.lines/5)),270,270)
  ctx.strokeStyle='#35555a';ctx.strokeRect(ox-.5,oy-.5,231,369)
 }else if(m.kind==='pong'){
  const p=m.pong;ctx.fillStyle='#315055';for(let y=10;y<H;y+=22)ctx.fillRect(W/2-1,y,2,10)
  ctx.font='bold 52px monospace';ctx.fillStyle='#63847e';ctx.fillText(String(p.you),90,70);ctx.fillText(String(p.bot),235,70)
  ctx.fillStyle='#a9efd0';ctx.fillRect(16,p.player-38,11,76);ctx.fillStyle='#f0d48d';ctx.fillRect(W-27,p.enemy-38,11,76)
  ctx.fillStyle='#fff8de';ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);ctx.fill()
  if(p.serve>0){ctx.font='14px monospace';ctx.fillStyle='#e2eaca';ctx.fillText('READY…',147,270)}
 }else{
  const s=m.space
  // Tiny functional pixel sprites keep silhouettes legible at game speed.
  const sprite=['00100100','00011000','01111110','11011011','11111111','10100101','00100100']
  s.aliens.filter(a=>a.alive).forEach(a=>{ctx.fillStyle=s.wave%2?'#c5b3f4':'#f0d48d';sprite.forEach((r,y)=>[...r].forEach((v,x)=>{if(v==='1')ctx.fillRect(a.x-12+x*3,a.y-10+y*3,3,3)}))})
  ctx.globalAlpha=s.invincible>0?.45:1;ctx.fillStyle='#a9efd0';ctx.beginPath();ctx.moveTo(s.x,H-44);ctx.lineTo(s.x-16,H-15);ctx.lineTo(s.x,H-22);ctx.lineTo(s.x+16,H-15);ctx.closePath();ctx.fill();ctx.globalAlpha=1
  s.bullets.forEach(b=>{ctx.fillStyle=b.enemy?'#f2aa99':'#a9efd0';ctx.fillRect(b.x-2,b.y-6,4,12)})
  ctx.fillStyle='#b7d0c5';ctx.fillText('WAVE '+s.wave,16,23);ctx.fillText('SHIELDS '+s.lives,240,23)
 }
}
