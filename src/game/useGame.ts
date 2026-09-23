import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { advanceTo, applyAction, chooseLesson, createRobot, finishMinigame, recover } from './engine'
import { DEMO, NORMAL, REVEALS } from './config'
import { claimTab } from './tabOwnership'
import { clearProgress, collect, emptyCollection, KEYS, loadCollection, loadRobot, parseExport, writeRobot, memoryOf, mergeCollections } from './save'
import type { LoadResult } from './save'
import type { Activity, Appearance, ArcadeKind, CareAction, Collection, Memory, Result, RobotSave, Route } from './types'
import { chime } from './sound'
import { duration, visibleClock } from './clock'
import { activityLine } from './personality'
import { beginArcade, endArcade, doActivity, rememberedLine, restyle, teachLife } from './extras'
import { rustBand } from './neglect'
export interface Settings {sound:boolean;reducedMotion:boolean}
export function useGame(){
  const [robot,setRobot]=useState<RobotSave|null>(null),[mode,setMode]=useState<'normal'|'demo'>('normal')
  const [owner,setOwner]=useState(false),[ownershipMessage,setOwnershipMessage]=useState('Connecting to your robot…'),[attempt,setAttempt]=useState(0)
  const [issue,setIssue]=useState(''),[loadError,setLoadError]=useState<Extract<LoadResult,{kind:'invalid'}>|null>(null)
  const [collection,setCollection]=useState<Collection>(emptyCollection),[message,setMessage]=useState('Human detected. Are you my charger?')
  const [feedback,setFeedback]=useState(''),[reaction,setReaction]=useState(''),[returnSummary,setReturnSummary]=useState('')
  const [settings,setSettings]=useState<Settings>(()=>{try{const v=JSON.parse(localStorage.getItem(KEYS.settings)||'{}');return {sound:v.sound===true,reducedMotion:typeof v.reducedMotion==='boolean'?v.reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches}}catch{return {sound:false,reducedMotion:false}}})
  const current=useRef(robot),modeRef=useRef(mode),owns=useRef(false),col=useRef(collection),prefs=useRef(settings),lastSave=useRef(0),collectionValid=useRef(true),storageFailed=useRef(false),normalMemory=useRef<RobotSave|null>(null)
  const [demoClock]=useState(visibleClock)
  const commit=(s:RobotSave|null)=>{current.current=s;setRobot(s)}
  const remember=(s:RobotSave)=>{col.current=collect(col.current,s);setCollection(col.current)}
  const persist=(s:RobotSave)=>{
    if(modeRef.current!=='normal'||!owns.current)return
    remember(s)
    try{if(!collectionValid.current)throw new Error('Memory collection needs recovery. Export your robot before replacing this run.');writeRobot(localStorage,s,col.current);lastSave.current=Date.now();storageFailed.current=false;setIssue(Date.now()<s.lastSimulatedAtMs?'Your device clock moved backwards. The saved timeline is being retained.':'')}
    catch(e){storageFailed.current=true;setIssue(e instanceof Error&&e.message.startsWith('Memory')?e.message:'Saving unavailable. Keep this tab open and export your robot to keep it safe.')}
  }
  const now=()=>modeRef.current==='demo'?demoClock.tick(!document.hidden):Date.now()
  const rules=()=>modeRef.current==='demo'?DEMO:NORMAL
  const show=(result:Result,save=true,action?:string)=>{
    commit(result.state)
    if(result.rejectionReason)setFeedback(result.rejectionReason)
    else if(result.events.length){
      const event=result.events.at(-1)!,evolution=result.events.filter(e=>e.type==='evolution').at(-1)
      setFeedback(result.events.filter(e=>e.type!=='evolution').map(e=>e.text).join(' '))
      if(evolution){setMessage(evolution.text);setReaction('evolution');chime(prefs.current.sound,'evolution')}
      else if(event.type==='critical'||event.type==='dead'||event.type==='recovery')setMessage(event.text)
      else if(event.type==='lesson')setMessage(event.id.includes('-life-')?event.text:['Noted. Humans are complicated.','Updating my very small worldview.','My purpose is getting suspiciously specific.'][result.state.choices.length-1])
      else if(action){const lines:Record<string,string>={charge:'My ambition now matches my battery.',repair:'Fresh joints. Questionable intentions.',play:'I call this intellectual enrichment.',cool:'Keeping a cool head. Literally.'};setMessage(lines[action]??event.text);setReaction(action);chime(prefs.current.sound,event.type==='care'?'care':'action')}
    }
    if(save)persist(result.state)
  }
  const read=(write:boolean)=>{
    if(storageFailed.current&&current.current&&modeRef.current==='normal'){show(advanceTo(current.current,Date.now()),write);return}
    let saved:LoadResult
    try{saved=loadRobot(localStorage)}catch{saved={kind:'unavailable',message:'Saving unavailable. You can play this session and export your robot.'}}
    if(saved.kind==='unavailable'){collectionValid.current=true;storageFailed.current=true}
    else try{col.current=loadCollection(localStorage);setCollection(col.current);collectionValid.current=true}catch{collectionValid.current=false;setIssue('Memory collection needs recovery. Export your robot before replacing this run.')}
    if(saved.kind==='invalid'){setLoadError(saved);commit(null);return}
    setLoadError(null)
    if(saved.kind==='ok'){
      const prior=saved.state,gap=Date.now()-prior.lastSimulatedAtMs,r=advanceTo(prior,Date.now())
      r.state.pendingMinigame=current.current?.pendingMinigame?.kind&&current.current.pendingMinigame.id===r.state.pendingMinigame?.id?current.current.pendingMinigame:null
      if(gap>60_000){const changes=(Object.keys(prior.meters) as (keyof typeof prior.meters)[]).map(k=>[k,Math.round(r.state.meters[k]-prior.meters[k])] as const).filter(([,n])=>n!==0).map(([k,n])=>`${k} ${n>0?'+':''}${n}`);setReturnSummary(`Away ${duration(gap)} · ${changes.join(' · ')||'No significant meter change'} · ${rustBand(r.state.meters.rust)}${r.state.stage!==prior.stage?' · Grew into '+r.state.stage:''}${r.state.status!=='awake'?' · '+r.state.status:''}.`);setMessage(rememberedLine(r.state))}
      if(gap<=60_000&&r.state.status==='awake')setMessage(r.state.lifeLessons.length?rememberedLine(r.state):r.state.adultRoute?REVEALS[r.state.adultRoute]:r.state.stage==='prototype'?'Bigger plans. Same charger.':r.state.stage==='buddy'?'I have hands now. This changes everything.':'Human detected. Are you my charger?')
      if(gap<0)setIssue('Your device clock moved backwards. Care resumes when it catches up.')
      show(r,write)
    }else if(saved.kind==='unavailable')setIssue(saved.message)
    else {commit(null);setReaction('');setReturnSummary('');setMessage('Human detected. Are you my charger?')}
  }
  const readEffect=useEffectEvent(read)
  useEffect(()=>claimTab((value,notice)=>{owns.current=value;setOwner(value);setOwnershipMessage(notice??'');if(modeRef.current==='normal')readEffect(value)}),[attempt])
  const tick=useEffectEvent(()=>{
    if(document.hidden||!current.current)return
    const r=advanceTo(current.current,now(),rules());show(r,false)
    if(modeRef.current==='normal'&&owns.current&&(Date.now()-lastSave.current>=5000||r.events.length>0))persist(r.state)
  })
  const visibility=useEffectEvent(()=>{
    if(modeRef.current==='demo')demoClock.tick(document.hidden)
    if(!current.current)return
    if(document.hidden){
      const s=current.current
      const r=s.pendingMinigame&&!s.pendingMinigame.kind?finishMinigame(s,s.pendingMinigame.id,null,now(),rules()):advanceTo(s,now(),rules());show(r)
    }else if(modeRef.current==='normal'&&owns.current)read(true)
  })
  const sync=useEffectEvent((e:StorageEvent)=>{if(e.key===KEYS.robot&&!owns.current&&modeRef.current==='normal')read(false)})
  useEffect(()=>{const timer=setInterval(tick,1000);document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',visibility);window.addEventListener('storage',sync);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',visibility);window.removeEventListener('storage',sync)}},[])
  useEffect(()=>{if(!reaction)return;const t=setTimeout(()=>setReaction(''),['dance','weights','coffee'].includes(reaction)?7000:1500);return()=>clearTimeout(t)},[reaction])
  const allowed=()=>modeRef.current==='demo'||owns.current
  const boot=(name:string,demo=false,appearance?:Appearance)=>{
    if(!demo&&!owns.current)return false
    if(!demo&&!collectionValid.current){setIssue('Restore your memory collection before replacing this run, or use Start from scratch to erase it.');return false}
    if(!demo&&current.current&&modeRef.current==='normal'){
      persist(current.current)
      if(current.current.status==='dead')try{localStorage.setItem(KEYS.collection,JSON.stringify(col.current))}catch{setIssue('Could not preserve this memorial. Export your robot before starting a new run.');return false}
    }
    if(demo&&modeRef.current==='normal')normalMemory.current=current.current
    modeRef.current=demo?'demo':'normal';setMode(modeRef.current);demoClock.reset()
    const s=createRobot(name,demo?0:Date.now(),crypto.randomUUID());if(appearance)s.appearance=appearance;setReaction('');setLoadError(null);setReturnSummary('');setMessage('Human detected. Are you my charger?');setFeedback('Core online. Try a charge.');commit(s);persist(s);return true
  }
  const startFresh=()=>{
    if(!owns.current||modeRef.current==='demo')return false
    try{clearProgress(localStorage)}catch{setIssue('Could not finish clearing saved progress. Keep this tab open and try again, or export your robot first.');return false}
    // Clear refs as well as React state so timers and demo return cannot restore the old run.
    commit(null);normalMemory.current=null;col.current=emptyCollection();setCollection(col.current)
    collectionValid.current=true;storageFailed.current=false;lastSave.current=0;demoClock.reset()
    setLoadError(null);setIssue('');setReaction('');setFeedback('');setReturnSummary('');setMessage('Human detected. Are you my charger?')
    return true
  }
  const action=(a:CareAction)=>{if(!current.current||!allowed())return;const sequence=Array.from({length:3},()=>1+Math.floor(Math.random()*4));show(applyAction(current.current,a,now(),rules(),a==='play'?{id:crypto.randomUUID(),sequence}:undefined),true,a)}
  const lesson=(id:string,route:Route)=>{if(current.current&&allowed())show(chooseLesson(current.current,id,route,now(),rules()))}
  const emergency=()=>{if(current.current&&allowed())show(recover(current.current,now(),rules()))}
  const circuit=(id:string,answer:number[]|null)=>{if(current.current&&allowed()){show(finishMinigame(current.current,id,answer,now(),rules()),true,'play');chime(prefs.current.sound,'play')}}
  const leaveDemo=()=>{modeRef.current='normal';setMode('normal');setFeedback('');setReaction('');const retained=normalMemory.current;normalMemory.current=null;if(retained&&owns.current){show(advanceTo(retained,Date.now()));setMessage('You returned. I have updated my trust spreadsheet.')}else{commit(null);read(owns.current)}}
  const markOutcome=()=>{if(current.current&&allowed()){const s={...current.current,outcomeSeen:true,revision:current.current.revision+1};commit(s);persist(s)}}
  const importSave=(raw:string)=>{
    if(!owns.current||modeRef.current==='demo')throw new Error('Return to your real robot in the active tab before importing.')
    const parsed=parseExport(raw),imported=parsed.robot
    if(!window.confirm(`Replace the current run with ${imported.name}? Its real elapsed time will be applied. Existing memories are kept.`))return
    if(current.current){persist(current.current);if(current.current.status==='dead'){try{localStorage.setItem(KEYS.collection,JSON.stringify(col.current))}catch{throw new Error('Could not preserve the current memorial. Export it before replacing the run.')}}}
    if(parsed.collection){col.current=mergeCollections(col.current,parsed.collection);setCollection(col.current)}
    imported.pendingMinigame=null;setLoadError(null);show(advanceTo(imported,Date.now()))
  }
  const restore=()=>{if(!loadError?.backup||!owns.current)return;show(advanceTo({...loadError.backup,pendingMinigame:null},Date.now()));setLoadError(null)}
  const updateSettings=(next:Settings)=>{prefs.current=next;setSettings(next);try{localStorage.setItem(KEYS.settings,JSON.stringify(next))}catch{setIssue('Preferences could not be saved in this browser.')}}
  const exportSave=()=>{
    if(!current.current||modeRef.current==='demo')return
    const s=advanceTo(current.current,Date.now()).state,blob=new Blob([JSON.stringify({format:'robogotchi-backup',robot:s,collection:col.current},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`robogotchi-${s.name.replace(/[^a-z0-9_-]/gi,'_')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)
  }
  const styleRobot=(appearance:Appearance)=>{if(!current.current||!allowed())return;const s=restyle(current.current,appearance);commit(s);persist(s);setFeedback('A fresh look. Still the same little core.')}
  const activity=(a:Activity)=>{if(!current.current||!allowed()||current.current.status!=='awake')return;const s=doActivity(current.current,a);commit(s);persist(s);setReaction(a);setMessage(activityLine(s,a));chime(prefs.current.sound,'action')}
  const teach=(id:string,answer:number)=>{if(current.current&&allowed())show(teachLife(current.current,id,answer,now(),rules()))}
  const startArcade=(kind:ArcadeKind):{id:string;care:boolean}|null=>{
    if(!current.current||!allowed())return null
    const id=crypto.randomUUID(),r=beginArcade(current.current,kind,id,now(),rules());show(r,true,'play')
    return r.rejectionReason?null:{id,care:!!r.state.pendingMinigame?.care}
  }
  const finishArcade=(id:string,score:number,seconds:number)=>{
    if(!current.current||!allowed())return
    const pending=current.current.pendingMinigame,kind=pending?.kind,first=kind&&current.current.arcade[kind].rounds===0
    const r=endArcade(current.current,id,score,seconds,now(),rules());show(r,true,'play')
    if(first&&kind&&r.state.arcade[kind].rounds>0&&modeRef.current==='normal'){
      const memory=memoryOf(r.state,r.state.runId+'-first-'+kind,'First '+({stack:'Circuit Stack',pong:'Paddle Bot',space:'Space Patrol'}[kind])+' round: '+score+' points.','milestone')
      if(!col.current.memories.some(m=>m.id===memory.id)){col.current={...col.current,memories:[...col.current.memories,memory].slice(-80)};setCollection(col.current);persist(r.state)}
    }
  }
  const capture=(caption:string,snapshot:Memory)=>{
    if(!current.current||!allowed()||modeRef.current==='demo')return false
    const pose=['dance','weights','coffee'].includes(reaction)?reaction as Activity:''
    const memory=snapshot.runId===current.current.runId?{...snapshot,id:crypto.randomUUID(),caption:(caption.trim()||'A little moment together.').slice(0,120)}:memoryOf(current.current,crypto.randomUUID(),caption||'A little moment together.','photo',pose)
    col.current={...col.current,memories:[...col.current.memories,memory].slice(-80)};setCollection(col.current);persist(current.current);setFeedback('Memory saved to your album.');return true
  }
  const deleteMemory=(id:string)=>{
    if(!current.current||!allowed()||modeRef.current==='demo')return
    // Automatic milestones stay so they cannot be regenerated after deletion.
    col.current={...col.current,memories:col.current.memories.filter(m=>m.id!==id||m.kind==='milestone')};setCollection(col.current);persist(current.current)
  }
  return {startFresh,styleRobot,activity,teach,startArcade,finishArcade,capture,deleteMemory,robot,mode,owner,ownershipMessage,takeOver:()=>setAttempt(n=>n+1),issue,loadError,collection,message,feedback,reaction,returnSummary,dismissReturn:()=>setReturnSummary(''),settings,updateSettings,boot,action,lesson,emergency,circuit,leaveDemo,markOutcome,importSave,restore,exportSave}
}
