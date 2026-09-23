import { useState } from 'react'
import type { Accessory, Appearance, Colour, Memory, RobotSave, Shape } from '../game/types'
import { COLOURS, SHAPES, roomOf, ROOM_NAMES, unlocks } from '../game/personality'
import { availableLessons, LIFE_LESSONS } from '../game/lessons'
import { createRobot } from '../game/engine'
import { LABELS } from '../game/config'
import { duration } from '../game/clock'
import { Robot } from './Robot'

export function StylePicker({value,onChange}:{value:Appearance;onChange:(v:Appearance)=>void}){
 return <div className="style-picker"><fieldset><legend>Colour</legend><div className="colour-options">{(Object.keys(COLOURS) as Colour[]).map(c=><button type="button" key={c} className={value.colour===c?'selected':''} aria-label={COLOURS[c].name} aria-pressed={value.colour===c} onClick={()=>onChange({...value,colour:c})}><i style={{background:COLOURS[c].body}}/>{COLOURS[c].name}</button>)}</div></fieldset><fieldset><legend>Shape</legend><div className="shape-options">{(Object.keys(SHAPES) as Shape[]).map(s=><button type="button" key={s} aria-pressed={value.shape===s} className={value.shape===s?'selected':''} onClick={()=>onChange({...value,shape:s})}>{SHAPES[s]}</button>)}</div></fieldset></div>
}
export function RoomDecor({value}:{value:Appearance['decoration']}){
 return value==='none'?null:<span className="room-decoration" role="img" aria-label={value==='plant'?'Your little plant':'Arcade trophy'}>{value==='plant'?'🪴':'🏆'}</span>
}
export function Restyle({state,onSave}:{state:RobotSave;onSave:(a:Appearance)=>void}){
 const [draft,setDraft]=useState({...state.appearance}),unlocked=unlocks(state)
 return <div className="restyle"><div className="style-preview" style={{backgroundImage:'url(/rooms/'+roomOf(state)+'.jpg)'}}><Robot state={{...state,appearance:draft}}/><RoomDecor value={draft.decoration}/></div><StylePicker value={draft} onChange={setDraft}/><fieldset><legend>A little extra</legend><div className="accessory-options">{([['none','Just me','Always yours'],['bow','Bow tie','1 care session'],['headphones','Headphones','3 arcade rounds'],['crown','Tiny crown','Play all 3 games']] as Array<[Accessory,string,string]>).map(([id,label,reason])=><button key={id} className={draft.accessory===id?'selected':''} aria-pressed={draft.accessory===id} disabled={!unlocked[id]} onClick={()=>setDraft({...draft,accessory:id})}><strong>{label}</strong><small>{unlocked[id]?'Unlocked':reason}</small></button>)}</div></fieldset><fieldset><legend>Room treasures</legend><div className="accessory-options">{([['none','Keep it simple','Always yours'],['plant','Little plant','3 extra lessons'],['trophy','Arcade trophy','5 arcade rounds']] as const).map(([id,label,reason])=><button key={id} className={draft.decoration===id?'selected':''} aria-pressed={draft.decoration===id} disabled={!unlocked[id]} onClick={()=>setDraft({...draft,decoration:id})}><strong>{label}</strong><small>{unlocked[id]?'Unlocked':reason}</small></button>)}</div></fieldset><p>Colour and shape are yours to change. Your personality and memories stay with you.</p><button className="primary" onClick={()=>onSave(draft)}>Save my look</button></div>
}
export function LessonBook({state,disabled,onTeach}:{state:RobotSave;disabled:boolean;onTeach:(id:string,answer:number)=>void}){
 const [selected,setSelected]=useState<string|null>(null),[reply,setReply]=useState(''),[history,setHistory]=useState(false)
 const available=availableLessons(state),current=available.find(l=>l.id===selected)??available[0]
 return <div className="lesson-book"><div className="book-tabs"><button className={!history?'selected':''} onClick={()=>setHistory(false)}>Learn together</button><button className={history?'selected':''} onClick={()=>setHistory(true)}>Our conversations ({state.lifeLessons.length})</button></div><p>Little questions about being human. New topics arrive as you grow. Your three core lessons still decide your adult personality.</p>
 {history?<div className="lesson-history">{state.lifeLessons.length===0?<p>Your first conversation is waiting.</p>:[...state.lifeLessons].reverse().map(c=>{const l=LIFE_LESSONS.find(l=>l.id===c.lessonId)!;return <article key={l.id}><span className="eyebrow">{l.topic}</span><h3>{l.question}</h3><p><strong>You:</strong> {l.answers[c.answer]}</p><blockquote>{l.replies[c.answer]}</blockquote></article>})}</div>:<>
 {reply&&<div className="lesson-reply" role="status"><span>{state.name} remembers</span><p>“{reply}”</p></div>}
 {current?<><label className="topic-select">Today’s conversation<select value={current.id} onChange={e=>{setSelected(e.target.value);setReply('')}}>{available.map(l=><option value={l.id} key={l.id}>{l.topic} · {l.question}</option>)}</select></label><article className="conversation"><span className="eyebrow">{current.topic}</span><h3>{current.question}</h3><div className="lesson-choices">{current.answers.map((a,i)=><button disabled={disabled||state.status!=='awake'} key={a} onClick={()=>{onTeach(current.id,i);setReply(current.replies[i]);setSelected(null)}}><span>{String.fromCharCode(65+i)}</span>{a}</button>)}</div></article></>:<div className="book-complete"><h3>{state.lifeLessons.length===21?'A wonderfully complicated little mind.':'A little wiser already.'}</h3><p>{state.lifeLessons.length===21?'All 21 extra conversations are saved in your history.':'More conversations open at the next age. You can revisit everything you have taught me.'}</p></div>}
 <p className="book-count">{state.lifeLessons.length} / 21 extra lessons learned · {available.length} available now</p></>}
 </div>
}
export function MemoryScene({memory}:{memory:Memory}){
 const s=createRobot(memory.name,memory.atMs-memory.ageMs,memory.runId)
 s.stage=memory.stage;s.adultRoute=memory.route;s.appearance=memory.appearance
 return <div className="memory-scene" style={{backgroundImage:'url(/rooms/'+roomOf(s)+'.jpg)'}}><Robot state={s} reaction={memory.pose}/><RoomDecor value={memory.appearance.decoration}/><span>{ROOM_NAMES[roomOf(s)]}</span></div>
}
export function CaptureMemory({state,pose,onCapture,disabled}:{state:RobotSave;pose:string;onCapture:(caption:string,snapshot:Memory)=>boolean;disabled:boolean}){
 const [caption,setCaption]=useState(''),[saved,setSaved]=useState(false)
 // Snapshot when the camera opens; subsequent ticks and pose timers must not change the preview.
 const [snapshot]=useState<Memory>(()=>({id:'preview',runId:state.runId,name:state.name,stage:state.stage,route:state.adultRoute,appearance:{...state.appearance},pose:['dance','weights','coffee'].includes(pose)?pose as Memory['pose']:'',atMs:state.lastSimulatedAtMs,ageMs:state.lastSimulatedAtMs-state.bornAtMs,caption:'',kind:'photo'}))
 return <form className="capture-memory" onSubmit={e=>{e.preventDefault();if(onCapture(caption,snapshot))setSaved(true)}}><MemoryScene memory={snapshot}/><label htmlFor="memory-caption">Give this moment a caption</label><input id="memory-caption" maxLength={120} placeholder="A little moment together." value={caption} onChange={e=>setCaption(e.target.value)} disabled={saved}/><p>{state.name} · {LABELS[state.stage]} · {duration(snapshot.ageMs)} together</p><button className="primary" disabled={disabled||saved} type="submit">{saved?'Saved to your album':'Save this memory'}</button>{saved&&<p role="status">You’ll find it in Memories, alongside your milestones.</p>}{disabled&&<p>Memories are saved with your real robot. Exit the demo to keep a moment.</p>}</form>
}
export function MemoryAlbum({memories,onDelete,disabled}:{memories:Memory[];onDelete:(id:string)=>void;disabled:boolean}){
 const [filter,setFilter]=useState<'all'|'photo'|'milestone'>('all')
 const shown=[...memories].reverse().filter(m=>filter==='all'||m.kind===filter)
 return <section className="memory-album"><p>Use <strong>Save a memory</strong> beside your robot to keep a moment. Evolution and first arcade rounds are captured automatically. Your latest 80 moments stay here; exports include the album.</p><div className="book-tabs">{(['all','photo','milestone'] as const).map(f=><button key={f} aria-pressed={f===filter} className={f===filter?'selected':''} onClick={()=>setFilter(f)}>{f==='all'?'All moments':f==='photo'?'My snapshots':'Milestones'}</button>)}</div>{shown.length===0?<p className="empty-memory">No moments here yet. Your robot is ready for its close-up.</p>:<div className="memory-grid">{shown.map(m=><article className="memory-card" key={m.id}><MemoryScene memory={m}/><div><span className="eyebrow">{m.kind==='photo'?'SAVED BY YOU':'MILESTONE'} · {LABELS[m.stage]}</span><h3>{m.caption}</h3><p>{m.name} · {duration(m.ageMs)} old</p><time dateTime={new Date(m.atMs).toISOString()}>{new Date(m.atMs).toLocaleDateString()}</time>{m.kind==='photo'&&<button className="text-button" disabled={disabled} aria-label={'Delete memory: '+m.caption} onClick={()=>{if(window.confirm('Delete this snapshot from your album?'))onDelete(m.id)}}>Delete</button>}</div></article>)}</div>}</section>
}
