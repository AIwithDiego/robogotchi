import { ACTIONS, LESSONS, ROUTES, STAGES } from './config'
import { createRobot } from './engine'
import { COLOURS, SHAPES, defaultAppearance, defaultArcade } from './personality'
import { LIFE_LESSONS } from './lessons'
import type { Appearance, Collection, Memory, Memorial, RobotSave } from './types'
export const KEYS={robot:'robogotchi.v2.robot',backup:'robogotchi.v2.backup',collection:'robogotchi.v2.collection',settings:'robogotchi.settings'}
export interface StorageLike { getItem(key:string):string|null;setItem(key:string,value:string):void }
export function clearProgress(storage:StorageLike&{removeItem(key:string):void}):void {
  // Remove the primary last, so other tabs read the already-cleared collection.
  const entries=[KEYS.backup,KEYS.collection,KEYS.robot].map(key=>[key,storage.getItem(key)] as const)
  const removed:typeof entries=[]
  try{for(const entry of entries){storage.removeItem(entry[0]);removed.push(entry)}}
  catch(error){
    // A blocked write must not turn a failed reset into a partial deletion.
    for(const [key,value] of removed.reverse())try{if(value!==null)storage.setItem(key,value)}catch{/* Report failure; never claim a successful reset. */}
    throw error
  }
}
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)
const number=(x:unknown,min=0,max=Number.MAX_SAFE_INTEGER):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max
const integer=(x:unknown,min=0,max=Number.MAX_SAFE_INTEGER)=>number(x,min,max)&&Number.isInteger(x)
const str=(x:unknown,max=150):x is string=>typeof x==='string'&&x.length>0&&x.length<=max
const nullableTime=(x:unknown)=>x===null||number(x)
export function validateSave(value:unknown):RobotSave {
  if(!object(value)||value.schemaVersion!==3)throw new Error('This save version is not supported. Your original save is untouched.')
  const s=value
  if(!str(s.runId)||!str(s.name,16)||s.name.trim()!==s.name||!STAGES.includes(s.stage as never)||!['awake','critical','dead'].includes(s.status as string))throw new Error('Invalid robot identity or state.')
  for(const k of ['bornAtMs','lastSimulatedAtMs','lastMaintenanceAtMs','lastSavedAtMs','globalActionUntil'])if(!number(s[k]))throw new Error(`Invalid ${k}.`)
  for(const k of ['criticalSinceMs','diedAtMs','lastCareSessionAtMs'])if(!nullableTime(s[k]))throw new Error(`Invalid ${k}.`)
  if(!integer(s.wear,0,40)||!integer(s.xp,0,120)||!integer(s.careSessions)||!integer(s.revision))throw new Error('Invalid growth or wear.')
  if(!object(s.meters)||Object.entries({battery:100,happiness:100,integrity:100-(s.wear as number),heat:100,rust:100}).some(([k,max])=>!number((s.meters as Record<string,unknown>)[k],0,max)))throw new Error('Invalid care meters.')
  if(!object(s.cooldownUntil)||ACTIONS.some(k=>!number((s.cooldownUntil as Record<string,unknown>)[k])))throw new Error('Invalid cooldowns.')
  if(!Array.isArray(s.choices)||s.choices.length>3||s.choices.some((c,i)=>!object(c)||c.lessonId!==LESSONS[i].id||!ROUTES.includes(c.route as never)))throw new Error('Invalid lessons.')
  if(s.adultRoute!==null&&!ROUTES.includes(s.adultRoute as never))throw new Error('Invalid adult route.')
  if(s.criticalCause!==null&&!['power','structure','both'].includes(s.criticalCause as string))throw new Error('Invalid shutdown cause.')
  if(typeof s.outcomeSeen!=='boolean'||!Array.isArray(s.emittedStageIds)||s.emittedStageIds.length!==new Set(s.emittedStageIds).size||s.emittedStageIds.some(x=>!STAGES.includes(x)))throw new Error('Invalid evolution history.')
  if(s.lastResolvedMinigameId!==null&&!str(s.lastResolvedMinigameId))throw new Error('Invalid circuit history.')
  if(s.pendingMinigame!==null){const g=s.pendingMinigame;if(!object(g)||!str(g.id)||!Array.isArray(g.sequence)||g.sequence.length!==3||g.sequence.some(x=>!integer(x,1,4)))throw new Error('Invalid circuit.')}
  validateAppearance(s.appearance)
  if(!Array.isArray(s.lifeLessons)||s.lifeLessons.length>21||s.lifeLessons.some(c=>!object(c)||!LIFE_LESSONS.some(l=>l.id===c.lessonId)||!integer(c.answer,0,2))||new Set(s.lifeLessons.map(c=>c.lessonId)).size!==s.lifeLessons.length)throw new Error('Invalid life lessons.')
  if(!object(s.arcade)||['stack','pong','space'].some(k=>{const r=(s.arcade as Record<string,unknown>)[k];return !object(r)||!integer(r.best,0,10000000)||!integer(r.rounds,0,1000000)}))throw new Error('Invalid arcade records.')
  if(!object(s.activities)||['dance','weights','coffee'].some(k=>!integer((s.activities as Record<string,unknown>)[k],0,1000000)))throw new Error('Invalid activities.')
  if(object(s.pendingMinigame)&&s.pendingMinigame.kind!==undefined&&(!['stack','pong','space'].includes(s.pendingMinigame.kind as string)||typeof s.pendingMinigame.care!=='boolean'))throw new Error('Invalid arcade session.')
  const r=s as unknown as RobotSave
  if(r.lastSimulatedAtMs<r.bornAtMs||r.lastMaintenanceAtMs>r.lastSimulatedAtMs||(r.lastCareSessionAtMs!==null&&r.lastCareSessionAtMs>r.lastSimulatedAtMs)||!r.emittedStageIds.includes(r.stage))throw new Error('Inconsistent save timeline.')
  if(r.status==='awake'&&(r.criticalSinceMs!==null||r.criticalCause!==null||r.diedAtMs!==null))throw new Error('Inconsistent awake state.')
  if(r.status!=='awake'&&(r.criticalSinceMs===null||r.criticalCause===null||r.criticalSinceMs>r.lastSimulatedAtMs||r.pendingMinigame))throw new Error('Inconsistent shutdown state.')
  if(r.status==='dead'&&(r.diedAtMs===null||r.diedAtMs!==r.lastSimulatedAtMs))throw new Error('Inconsistent memorial time.')
  if(r.status!=='dead'&&r.diedAtMs!==null)throw new Error('Inconsistent death state.')
  if(r.stage==='adult'&&!r.adultRoute)throw new Error('Adult route is missing.')
  return structuredClone(r)
}
export function parseSave(raw:string,now=Date.now()):RobotSave {
  if(new TextEncoder().encode(raw).length>100_000)throw new Error('Save files must be smaller than 100 KB.')
  let data:unknown
  try{data=JSON.parse(raw)}catch{throw new Error('This save is not valid JSON.')}
  if(object(data)&&data.schemaVersion===1){
    if(!str(data.name,16)||!STAGES.includes(data.stage as never))throw new Error('The older save is invalid.')
    const migrated=createRobot(data.name,now,str(data.runId)?data.runId:crypto.randomUUID())
    migrated.stage=data.stage as RobotSave['stage'];migrated.emittedStageIds=STAGES.slice(0,STAGES.indexOf(migrated.stage)+1)
    migrated.choices=Array.isArray(data.choices)?data.choices:[]
    migrated.adultRoute=(data.adultRoute??data.route??null) as RobotSave['adultRoute']
    if(migrated.stage!=='adult')migrated.adultRoute=null
    if(data.status==='shutdown'||data.status==='critical'){migrated.meters.battery=40;migrated.meters.integrity=40}
    return validateSave(migrated)
  }
  if(object(data)&&data.schemaVersion===2)data={...data,schemaVersion:3,appearance:defaultAppearance(),lifeLessons:[],arcade:defaultArcade(),activities:{dance:0,weights:0,coffee:0}}
  return validateSave(data)
}
export type LoadResult={kind:'empty'}|{kind:'ok';state:RobotSave}|{kind:'invalid';message:string;backup:RobotSave|null}|{kind:'unavailable';message:string}
export function loadRobot(storage:StorageLike,now=Date.now()):LoadResult {
  try {
    const raw=storage.getItem(KEYS.robot);if(!raw)return {kind:'empty'}
    try{return {kind:'ok',state:parseSave(raw,now)}}catch(error){let backup:RobotSave|null=null;try{const b=storage.getItem(KEYS.backup);if(b)backup=parseSave(b,now)}catch{/* Leave invalid records untouched. */}return {kind:'invalid',message:(error as Error).message,backup}}
  }catch{return {kind:'unavailable',message:'Saving unavailable. You can play this session and export your robot.'}}
}
export const emptyCollection=():Collection=>({discoveries:[],memorials:[],memories:[],milestoneIds:[]})
export function loadCollection(storage:StorageLike):Collection {
  const raw=storage.getItem(KEYS.collection);if(!raw)return emptyCollection()
  return validateCollection(JSON.parse(raw))
}
export function validateCollection(c:unknown):Collection {
  if(!object(c)||!Array.isArray(c.discoveries)||c.discoveries.some(x=>!ROUTES.includes(x))||!Array.isArray(c.memorials)||c.memorials.some(m=>!object(m)||!str(m.runId)||!str(m.name,16)||!STAGES.includes(m.stage as never)||!nullableTime(m.diedAtMs)||!number(m.ageMs)||!['power','structure','both'].includes(m.cause as string)||!(m.route===null||ROUTES.includes(m.route as never))||!number(m.wear,0,40)))throw new Error('The memory collection could not be read. Export your current robot before starting over.')
  const memories=c.memories===undefined?[]:c.memories
  if(!Array.isArray(memories)||memories.length>80||memories.some(m=>!object(m)||!str(m.id,200)||!str(m.runId)||!str(m.name,16)||!STAGES.includes(m.stage as never)||!(m.route===null||ROUTES.includes(m.route as never))||!number(m.atMs,0,8.64e15)||!number(m.ageMs,0,m.atMs as number)||typeof m.caption!=='string'||m.caption.length>120||!['photo','milestone'].includes(m.kind as string)||!['','dance','weights','coffee'].includes(m.pose as string)))throw new Error('Invalid memory album.')
  memories.forEach(m=>validateAppearance(m.appearance))
  if(c.memorials.length>50||c.discoveries.length>3||new Set(memories.map(m=>m.id)).size!==memories.length)throw new Error('Invalid memory collection.')
  const milestoneIds=c.milestoneIds??memories.filter(m=>m.kind==='milestone').map(m=>m.id)
  if(!Array.isArray(milestoneIds)||milestoneIds.length>256||milestoneIds.some(id=>!str(id,200)))throw new Error('Invalid milestone history.')
  return structuredClone({...c,memories,milestoneIds}) as unknown as Collection
}
export function collect(c:Collection,s:RobotSave):Collection {
  const next=structuredClone(c)
  if(s.adultRoute&&!next.discoveries.includes(s.adultRoute))next.discoveries.push(s.adultRoute)
  if(s.status==='dead'&&!next.memorials.some(m=>m.runId===s.runId)) {
    const memorial:Memorial={runId:s.runId,name:s.name,stage:s.stage,route:s.adultRoute,diedAtMs:s.diedAtMs!,ageMs:s.diedAtMs!-s.bornAtMs,cause:s.criticalCause!,wear:s.wear}
    next.memorials.push(memorial);next.memorials.sort((a,b)=>a.diedAtMs-b.diedAtMs);next.memorials=next.memorials.slice(-50)
  }
  // Stable milestone IDs make collecting idempotent, including after a interrupted write.
  if(s.status==='awake')for(const stage of [s.stage]){
    const id=s.runId+'-milestone-'+stage
    if(!next.milestoneIds.includes(id)){next.memories.push(memoryOf(s,id,stage==='bootling'?'Our first hello.':'Hello, '+stage+'.','milestone'));next.milestoneIds.push(id);next.milestoneIds=next.milestoneIds.slice(-256)}
  }
  next.memories=next.memories.slice(-80)
  return next
}
export function writeRobot(storage:StorageLike,state:RobotSave,collection:Collection,now=Date.now()):void {
  const next={...state,lastSavedAtMs:now}
  validateSave(next)
  const old=storage.getItem(KEYS.robot)
  if(old){let valid=false;try{parseSave(old,now);valid=true}catch{/* A corrupt primary is never made into a backup. */}if(valid)storage.setItem(KEYS.backup,old)}
  // Primary death remains enough to reconstruct the memorial if the second write is interrupted.
  storage.setItem(KEYS.robot,JSON.stringify(next));storage.setItem(KEYS.collection,JSON.stringify(collect(collection,state)))
}

export function validateAppearance(value:unknown):Appearance {
 if(!object(value)||typeof value.colour!=='string'||!Object.hasOwn(COLOURS,value.colour)||typeof value.shape!=='string'||!Object.hasOwn(SHAPES,value.shape)||!['none','bow','headphones','crown'].includes(value.accessory as string)||!['none','plant','trophy'].includes(value.decoration as string))throw new Error('Invalid robot appearance.')
 return structuredClone(value) as unknown as Appearance
}
export function memoryOf(s:RobotSave,id:string,caption:string,kind:Memory['kind']='photo',pose:Memory['pose']=''):Memory {
 return {id,runId:s.runId,name:s.name,stage:s.stage,route:s.adultRoute,appearance:{...s.appearance},pose,atMs:s.lastSimulatedAtMs,ageMs:s.lastSimulatedAtMs-s.bornAtMs,caption:caption.trim().slice(0,120),kind}
}
export function parseExport(raw:string):{robot:RobotSave;collection:Collection|null} {
 if(new TextEncoder().encode(raw).length>250000)throw new Error('Backup files must be smaller than 250 KB.')
 let d:unknown;try{d=JSON.parse(raw)}catch{throw new Error('This save is not valid JSON.')}
 if(object(d)&&d.format==='robogotchi-backup')return {robot:parseSave(JSON.stringify(d.robot)),collection:validateCollection(d.collection)}
 return {robot:parseSave(raw),collection:null}
}
export function mergeCollections(a:Collection,b:Collection):Collection {
 const byId=<T,>(items:T[],id:(v:T)=>string)=>[...new Map(items.map(v=>[id(v),v])).values()]
 return {milestoneIds:[...new Set([...a.milestoneIds,...b.milestoneIds])].slice(-256),discoveries:[...new Set([...a.discoveries,...b.discoveries])],memorials:byId([...a.memorials,...b.memorials],m=>m.runId).sort((x,y)=>x.diedAtMs-y.diedAtMs).slice(-50),memories:byId([...a.memories,...b.memories],m=>m.id).sort((x,y)=>x.atMs-y.atMs).slice(-80)}
}
