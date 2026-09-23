import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { ArcadeKind, RobotSave } from '../game/types'
import { ARCADE } from '../game/personality'
import { command, draw, H, newArcade, step, W } from '../game/arcade'
import type { Command, Controls } from '../game/arcade'
import { Robot } from './Robot'
interface Session {id:string;care:boolean}
interface Props {state:RobotSave;disabled:boolean;onStart:(kind:ArcadeKind)=>Session|null;onFinish:(id:string,score:number,seconds:number)=>void}
export function Arcade({state,disabled,onStart,onFinish}:Props){
 const [selected,setSelected]=useState<ArcadeKind|null>(null),[session,setSession]=useState<Session|null>(null)
 const start=(kind:ArcadeKind)=>{const s=onStart(kind);if(s){setSelected(kind);setSession(s)}}
 return <div className="arcade">
 {!session||!selected?<><p className="arcade-intro">A little friendly competition. Pick a game.</p><div className="arcade-menu">{(Object.keys(ARCADE) as ArcadeKind[]).map((kind,i)=><button disabled={disabled||state.status!=='awake'} key={kind} onClick={()=>start(kind)} style={{'--game-colour':ARCADE[kind].colour} as React.CSSProperties}><span className="arcade-number">0{i+1}</span><span><strong>{ARCADE[kind].name}</strong><small>{ARCADE[kind].description}</small><em>BEST {state.arcade[kind].best.toLocaleString()} · {state.arcade[kind].rounds} rounds</em></span><span aria-hidden="true">↗</span></button>)}</div><p className="arcade-note">Care rounds use 5 battery and add 8 heat. Finish at least 10 seconds of play for +20 happiness. During cooldowns or low power, practice is free. Growth credits still follow the care schedule.</p></>:<ArcadeRound key={session.id} kind={selected} session={session} state={state} disabled={disabled} onFinish={onFinish} onBack={()=>{setSession(null);setSelected(null)}} onRestart={()=>start(selected)}/>}
 </div>
}
function ArcadeRound({kind,session,state,disabled,onFinish,onBack,onRestart}:{kind:ArcadeKind;session:Session;state:RobotSave;disabled:boolean;onFinish:Props['onFinish'];onBack:()=>void;onRestart:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),model=useRef(newArcade(kind)),keys=useRef<Controls>({}),settled=useRef(false),pausedRef=useRef(false),held=useRef<ReturnType<typeof setInterval>|null>(null)
 const [paused,setPaused]=useState(false),[hud,setHud]=useState({score:0,seconds:0,over:false,result:''})
 const finish=()=>{if(settled.current)return;settled.current=true;const m=model.current;onFinish(session.id,m.score,m.elapsed)}
 const finishEffect=useEffectEvent(finish)
 const protect=useEffectEvent(()=>{if(disabled||state.status!=='awake'){pausedRef.current=true;setPaused(true);keys.current={}}})
 const stopHeld=()=>{if(held.current)clearInterval(held.current);held.current=null;keys.current={}}
 const pause=(next:boolean)=>{pausedRef.current=next;setPaused(next);stopHeld()}
 useEffect(()=>{
  const c=canvas.current!,ctx=c.getContext('2d')!;const ratio=Math.min(window.devicePixelRatio||1,2);c.width=W*ratio;c.height=H*ratio;ctx.scale(ratio,ratio)
  let raf=0,last=0,lastHUD=0
  const frame=(t:number)=>{protect();const dt=last?(t-last)/1000:0;last=t
   if(!pausedRef.current&&!document.hidden){step(model.current,dt,keys.current);if(model.current.over)finishEffect()}
   draw(ctx,model.current)
   if(t-lastHUD>100||model.current.over){const m=model.current;setHud({score:m.score,seconds:Math.floor(m.elapsed),over:m.over,result:m.result});lastHUD=t}
   raf=requestAnimationFrame(frame)
  }
  raf=requestAnimationFrame(frame);c.focus()
  const hide=()=>{if(document.hidden){pausedRef.current=true;setPaused(true);keys.current={}}}
  const blur=()=>{pausedRef.current=true;setPaused(true);keys.current={}}
  document.addEventListener('visibilitychange',hide);window.addEventListener('blur',blur)
  return()=>{cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',hide);window.removeEventListener('blur',blur);if(held.current)clearInterval(held.current)}
 },[])
 const release=(c:Command)=>{if(kind==='stack')stopHeld();else if(c in keys.current)delete keys.current[c as keyof Controls]}
 const press=(c:Command)=>{if(pausedRef.current||model.current.over)return;if(kind==='stack')command(model.current,c);else if(c==='up'||c==='down'||c==='left'||c==='right'||c==='fire')keys.current[c]=true}
 const keyCommand=(key:string):Command|undefined=>({ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:kind==='stack'?'rotate':'up',w:'up',ArrowDown:'down',s:'down',' ':kind==='stack'?'drop':'fire'} as Record<string,Command>)[key]
 const controls: Array<[Command,string,string]>=kind==='stack'?[['left','←','Move left'],['rotate','↻','Rotate'],['right','→','Move right'],['down','↓','Soft drop'],['drop','⤓','Drop']]:kind==='pong'?[['up','↑','Move up'],['down','↓','Move down']]:[['left','←','Move left'],['fire','●','Fire'],['right','→','Move right']]
 const end=()=>{model.current.over=true;model.current.result='Round saved. See you back in the room.';finish();onBack()}
 const drag=(clientY:number)=>{const r=canvas.current!.getBoundingClientRect();keys.current.targetY=Math.max(0,Math.min(H,(clientY-r.top)/r.height*H))}
 return <div className="arcade-round">
 <div className="arcade-hud"><div><span>SCORE</span><strong aria-label="Current score">{hud.score.toLocaleString()}</strong></div><div><span>{ARCADE[kind].name}</span><strong>{Math.max(0,(kind==='space'?90:120)-hud.seconds)}s</strong></div><button className="secondary" disabled={hud.over||disabled||state.status!=='awake'} onClick={()=>pause(!paused)}>{paused?'Resume':'Pause'}</button></div>
 <div className="arcade-display"><canvas ref={canvas} tabIndex={0} aria-label={ARCADE[kind].name+' playfield. '+ARCADE[kind].controls} onKeyDown={e=>{if(e.key==='p'||e.key==='P'){e.preventDefault();pause(!pausedRef.current);return}const c=keyCommand(e.key);if(c){e.preventDefault();if(!e.repeat||kind==='stack'&&c!=='drop'&&c!=='rotate')press(c)}}} onKeyUp={e=>{const c=keyCommand(e.key);if(c&&c in keys.current){delete keys.current[c as keyof Controls];e.preventDefault()}}} onPointerDown={e=>{if(kind==='pong'){e.currentTarget.setPointerCapture(e.pointerId);drag(e.clientY)}}} onPointerMove={e=>{if(kind==='pong'&&e.buttons)drag(e.clientY)}} onPointerUp={()=>{delete keys.current.targetY}} onPointerCancel={stopHeld}>
 {ARCADE[kind].name}. Use the controls below to play.
 </canvas>
 {(paused||hud.over)&&<div className="arcade-overlay"><span className="eyebrow">{hud.over?'ROUND COMPLETE':'TAKE YOUR TIME'}</span><h3>{hud.over?hud.result:'Paused'}</h3>{hud.over?<><p>{hud.score} points{hud.score>0&&hud.score>=state.arcade[kind].best?' · A personal best!':''}</p><button className="primary" onClick={onRestart} disabled={disabled||state.status!=='awake'}>Play again</button><button className="text-button" onClick={onBack}>Choose another game</button></>:<><p>{disabled?'Your robot is active in another tab.':state.status!=='awake'?'Your robot needs emergency care.':'Your game waits while you are away.'}</p><button className="primary" onClick={()=>{pause(false);canvas.current?.focus()}} disabled={disabled||state.status!=='awake'}>Resume game</button></>}</div>}
 </div>
 <div className="arcade-touch" aria-label="Game controls">{controls.map(([c,label,title])=><button key={c} aria-label={title} disabled={paused||hud.over||disabled} onPointerDown={e=>{e.preventDefault();if(kind==='stack')stopHeld();e.currentTarget.setPointerCapture(e.pointerId);press(c);if(kind==='stack'&&['left','right','down'].includes(c))held.current=setInterval(()=>press(c),110)}} onPointerUp={()=>release(c)} onPointerCancel={()=>release(c)} onLostPointerCapture={()=>release(c)} onClick={e=>{if(e.detail===0){press(c);setTimeout(()=>release(c),150)}}}>{label}<small>{title}</small></button>)}</div>
 <p className="arcade-keyboard">{ARCADE[kind].controls} · P pause</p>
 <div className="arcade-companion"><Robot state={state} small/><p>{hud.over?'One more? I was just getting emotionally invested.':hud.score>=100?'Look at you go. I am recording this as teamwork.':session.care?'A little playtime together. Make it past 10 seconds for a happiness boost.':'Free practice. All the fun, no battery cost.'}</p></div>
 <button className="text-button" onClick={end}>{hud.over?'Back to arcade':'End round & return'}</button>
 </div>
}
