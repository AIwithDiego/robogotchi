import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { CONFIG } from '../game/config'
import { Icon } from './Icon'
export function MemoryCircuit({game,reduced,onFinish}:{game:{id:string;sequence:number[]};reduced:boolean;onFinish:(id:string,answer:number[]|null)=>void}){
 const [phase,setPhase]=useState<'watch'|'input'>('watch'),[flash,setFlash]=useState(0),[answer,setAnswer]=useState<number[]>([]),[remaining,setRemaining]=useState(15),[replayed,setReplayed]=useState(false),[round,setRound]=useState(0)
 const [sequence]=useState(()=>[...game.sequence])
 const finished=useRef(false),answerRef=useRef<number[]>([])
 const close=(value:number[]|null)=>{if(finished.current)return;finished.current=true;onFinish(game.id,value)}
 const timeout=useEffectEvent(()=>close([-1]))
 useEffect(()=>{
   const start=performance.now(),playback=3*(CONFIG.playbackFlash+CONFIG.playbackGap)
   const timer=setInterval(()=>{const elapsed=performance.now()-start
    if(elapsed<playback){setFlash(elapsed%700<500?sequence[Math.floor(elapsed/700)]:0)}
    else{setPhase('input');setFlash(0);const left=Math.max(0,Math.ceil((CONFIG.inputTime-(elapsed-playback))/1000));setRemaining(left);if(left===0)timeout()}
   },50);return()=>clearInterval(timer)
 },[sequence,round])
 const press=(n:number)=>{if(phase!=='input'||finished.current)return;const next=[...answerRef.current,n];answerRef.current=next;setAnswer(next);if(next.some((v,i)=>v!==sequence[i])||next.length===3)close(next)}
 const key=useEffectEvent((e:KeyboardEvent)=>{if(/^[1-4]$/.test(e.key)&&!(e.target instanceof HTMLInputElement)){e.preventDefault();press(Number(e.key))}})
 useEffect(()=>{window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
 function replay(){setReplayed(true);setPhase('watch');setAnswer([]);answerRef.current=[];setRemaining(15);setRound(r=>r+1)}
 return <section className="memory-panel" aria-label="Memory Circuit"><div className="panel-heading"><span className="eyebrow">MEMORY CIRCUIT</span><span>{phase==='watch'?'Watch closely':`${remaining}s left`}</span></div><h3>{phase==='watch'?'A little brain training.':'Your turn. Repeat the sequence.'}</h3><p aria-live="polite">{phase==='watch'?(reduced?`Remember: ${game.sequence.join(' → ')}`:`Watch the numbered pads light up.`):`${answer.length} of 3 entered · Use keys 1–4 or tap.`}</p><div className="circuit-pads">{[1,2,3,4].map(n=><button key={n} className={`pad pad-${n} ${phase==='watch'&&flash===n&&!reduced?'lit':''}`} disabled={phase==='watch'} onClick={()=>press(n)} aria-label={`Pad ${n}`}>{n}{phase==='watch'&&flash===n&&!reduced&&<span>WATCH</span>}</button>)}</div><div className="panel-actions"><button className="text-button" onClick={replay} disabled={replayed||phase==='watch'}>Replay {replayed?'used':'once'}</button><button className="text-button" onClick={()=>close(null)}>Cancel <Icon name="close" size={14}/></button></div><p className="fine-print">Starting used 5 battery. Leaving the page cancels the circuit without a reward.</p></section>
}
