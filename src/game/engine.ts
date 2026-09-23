import { ACTIONS, CONFIG as C, HOUR, LESSONS, NORMAL } from './config'
import { defaultAppearance, defaultArcade } from './personality'
import { evolve } from './evolution'
import { chargeEfficiency, checkLife, integrityMax } from './neglect'
import type { CareAction, GameEvent, Result, RobotSave, Route, Rules } from './types'
export function createRobot(name:string, now:number, runId:string):RobotSave {
  return {schemaVersion:3,runId,revision:0,name:name.trim().slice(0,16)||'BEEP',stage:'bootling',status:'awake',bornAtMs:now,lastSimulatedAtMs:now,lastMaintenanceAtMs:now,criticalSinceMs:null,criticalCause:null,diedAtMs:null,wear:0,careSessions:0,lastCareSessionAtMs:null,xp:0,meters:{...C.initial},choices:[],adultRoute:null,cooldownUntil:{charge:0,repair:0,play:0,cool:0},globalActionUntil:0,emittedStageIds:['bootling'],outcomeSeen:false,pendingMinigame:null,lastResolvedMinigameId:null,lastSavedAtMs:now,appearance:defaultAppearance(),lifeLessons:[],arcade:defaultArcade(),activities:{dance:0,weights:0,coffee:0}}
}
const clamp = (s:RobotSave) => {
  for (const k of Object.keys(s.meters) as (keyof typeof s.meters)[]) s.meters[k]=Math.max(0,Math.min(k==='integrity'?integrityMax(s):100,s.meters[k]))
}
// Piecewise-linear integration: work is bounded by thresholds, never by elapsed seconds.
export function advanceTo(input:RobotSave, now:number, rules:Rules=NORMAL):Result {
  const s=structuredClone(input), events:GameEvent[]=[]
  if (!Number.isFinite(now) || s.status==='dead') return {state:s,events}
  checkLife(s,events)
  const target=Math.max(now,s.lastSimulatedAtMs)
  while(s.lastSimulatedAtMs<target && (s.status as RobotSave['status'])!=='dead') {
    const t=s.lastSimulatedAtMs, m=s.meters, grace=s.lastMaintenanceAtMs+C.rustGrace
    const rustRate=t>=grace && m.rust<100 ? C.rates.rust : 0
    // Equality at Heat 85 has zero duration while cooling, so damage ends at this boundary.
    const integrityRate=(m.rust>=40?C.rates.corrosion:0)+(m.heat>85?C.rates.overheat:0)
    let dt=target-t
    const boundary=(delta:number,rate:number) => {if(rate!==0 && delta/rate>0) dt=Math.min(dt,delta/rate*HOUR)}
    if(t<grace) dt=Math.min(dt,grace-t)
    boundary(-m.battery,C.rates.battery); boundary(-m.happiness,C.rates.happiness)
    boundary(-m.heat,C.rates.heat)
    if(m.heat>85) boundary(85-m.heat,C.rates.heat)
    for(const b of [20,40,70,100]) if(m.rust<b) boundary(b-m.rust,rustRate)
    if(m.integrity>0) boundary(-m.integrity,integrityRate)
    if(s.status==='critical') dt=Math.min(dt,s.criticalSinceMs!+C.criticalWindow-t)
    if(dt<=0) {checkLife(s,events); break}
    const h=dt/HOUR
    m.battery+=C.rates.battery*h; m.happiness+=C.rates.happiness*h; m.heat+=C.rates.heat*h
    m.rust+=rustRate*h; m.integrity+=integrityRate*h
    // Snap numerical residue only at machine-precision-sized distances from boundaries.
    for(const k of Object.keys(m) as (keyof typeof m)[]) for(const b of [0,20,40,70,85,100]) if(Math.abs(m[k]-b)<1e-10) m[k]=b
    clamp(s)
    const advanced=t+dt
    s.lastSimulatedAtMs=Math.abs(advanced-Math.round(advanced))<1e-6?Math.round(advanced):advanced
    checkLife(s,events)
  }
  evolve(s,events,rules)
  return {state:s,events}
}
export function careTargets(s:RobotSave):string[] {
  const m=s.meters
  return [m.battery<60?'Battery ≥60':null,m.integrity<60?'Integrity ≥60':null,m.rust>=20?'Rust <20':null,m.happiness<40?'Happiness ≥40':null].filter((x):x is string=>!!x)
}
function credit(s:RobotSave,events:GameEvent[]) {
  if(s.status!=='awake'||careTargets(s).length|| (s.lastCareSessionAtMs!==null && s.lastSimulatedAtMs-s.lastCareSessionAtMs<C.sessionGap))return
  s.careSessions++;s.lastCareSessionAtMs=s.lastSimulatedAtMs
  if(s.stage!=='adult')s.xp=Math.min(C.maxXP,s.xp+C.sessionXP)
  events.push({id:`${s.runId}-care-${s.careSessions}`,type:'care',text:s.stage==='adult'?'Care session complete. Looking good.':'+20 growth XP · Care session complete.'})
}
export function actionReason(s:RobotSave,a:CareAction):string|undefined {
  if(s.status!=='awake')return s.status==='critical'?'Emergency repair needed':'This core is at rest'
  const now=s.lastSimulatedAtMs
  const until=Math.max(s.globalActionUntil,s.cooldownUntil[a])
  if(now<until)return `Ready in ${Math.ceil((until-now)/1000)}s`
  const m=s.meters
  if(a==='charge'&&m.battery>85)return 'Battery is topped up'
  if(a==='repair'&&!((m.integrity<=90&&m.integrity<integrityMax(s))||m.rust>=5||m.heat>=10))return 'No maintenance needed'
  if(a==='play') {
    if(s.pendingMinigame)return 'Circuit already running'
    if(m.battery<15)return 'Needs 15 battery'
    if(m.heat>=85)return 'Cool down first'
    if(m.rust>=70)return 'Clean the corroded joints first'
  }
  if(a==='cool'&&m.heat<10)return 'Already cool'
}
function finish(s:RobotSave,events:GameEvent[],rules:Rules,reward=true):Result {
  clamp(s);checkLife(s,events);if(reward)credit(s,events);evolve(s,events,rules);s.revision++
  return {state:s,events}
}
export function applyAction(input:RobotSave,a:CareAction,now:number,rules:Rules=NORMAL,game?:{id:string;sequence:number[]}):Result {
  const {state:s,events}=advanceTo(input,now,rules)
  if(!ACTIONS.includes(a))return {state:s,events,rejectionReason:'Unknown action'}
  const reason=actionReason(s,a);if(reason)return {state:s,events,rejectionReason:reason}
  if(a==='play'&&(!game||!game.id||game.sequence.length!==3||game.sequence.some(n=>!Number.isInteger(n)||n<1||n>4)))return {state:s,events,rejectionReason:'Invalid circuit'}
  const before={...s.meters},m=s.meters,t=s.lastSimulatedAtMs
  if(a==='charge'){m.battery+=C.charge*chargeEfficiency(m.rust);m.heat+=C.chargeHeat}
  if(a==='repair'){m.integrity+=C.repair;m.rust-=C.repairRust;m.heat-=C.repairCooling;s.lastMaintenanceAtMs=t}
  if(a==='cool'){m.heat-=C.coolHeat;m.happiness+=C.coolHappiness}
  if(a==='play'){m.battery-=C.playBattery;m.heat+=C.playHeat;s.pendingMinigame=structuredClone(game!)}
  clamp(s);s.cooldownUntil[a]=t+rules.cooldowns[a];s.globalActionUntil=t+rules.globalLock
  const changes=(Object.keys(m) as (keyof typeof m)[]).filter(k=>Math.abs(m[k]-before[k])>.01).map(k=>`${k[0].toUpperCase()+k.slice(1)} ${m[k]-before[k]>0?'+':''}${Math.round((m[k]-before[k])*10)/10}`)
  events.push({id:`${s.runId}-action-${t}-${s.revision}`,type:'action',text:changes.join(' · ')})
  return finish(s,events,rules,a!=='play')
}
export function finishMinigame(input:RobotSave,id:string,answer:number[]|null,now:number,rules:Rules=NORMAL):Result {
  const {state:s,events}=advanceTo(input,now,rules)
  if(s.status!=='awake'||!s.pendingMinigame||s.pendingMinigame.id!==id||s.lastResolvedMinigameId===id)return {state:s,events,rejectionReason:'Circuit already closed'}
  const success=answer!==null&&answer.length===3&&answer.every((n,i)=>n===s.pendingMinigame!.sequence[i])
  s.pendingMinigame=null;s.lastResolvedMinigameId=id
  if(answer===null)return finish(s,events,rules,false)
  const gain=Math.min(100-s.meters.happiness,success?C.playSuccess:C.playFailure)
  s.meters.happiness+=gain
  events.push({id:`${id}-result`,type:'action',text:`${success?'Circuit complete!':'Good practice.'} Happiness +${Math.round(gain)}.`})
  return finish(s,events,rules)
}
export function chooseLesson(input:RobotSave,lessonId:string,route:Route,now:number,rules:Rules=NORMAL):Result {
  const {state:s,events}=advanceTo(input,now,rules),i=s.choices.length
  if(s.status!=='awake'||s.stage==='adult'||i>=3||LESSONS[i].id!==lessonId||!['companion','guardian','overlord'].includes(route)||s.lastSimulatedAtMs-s.bornAtMs<rules.lessonAges[i])return {state:s,events,rejectionReason:'Lesson is not available'}
  s.choices.push({lessonId,route});events.push({id:`${s.runId}-${lessonId}`,type:'lesson',text:'Lesson stored. You are making an impression.'})
  return finish(s,events,rules,false)
}
export function recover(input:RobotSave,now:number,rules:Rules=NORMAL):Result {
  const {state:s,events}=advanceTo(input,now,rules)
  if(s.status!=='critical')return {state:s,events,rejectionReason:s.status==='dead'?'The recovery window has ended':'No emergency repair needed'}
  s.status='awake';s.meters={battery:40,integrity:40,heat:10,rust:Math.max(0,s.meters.rust-20),happiness:s.meters.happiness}
  s.criticalSinceMs=null;s.criticalCause=null;s.lastMaintenanceAtMs=s.lastSimulatedAtMs
  events.push({id:`${s.runId}-reboot-${s.lastSimulatedAtMs}`,type:'recovery',text:'Core restored. A little care will get me back on my feet.'})
  return finish(s,events,rules,false)
}
export function nextCareAt(s:RobotSave):number|null {
  if(s.status!=='awake'||s.meters.battery<25||s.meters.integrity<25||s.meters.rust>=20)return null
  let lo=s.lastSimulatedAtMs,hi=lo+100*HOUR
  for(let i=0;i<38;i++) {
    const mid=(lo+hi)/2,p=advanceTo(s,mid).state
    if(p.status!=='awake'||p.meters.battery<25||p.meters.rust>=20)hi=mid;else lo=mid
  }
  return hi
}
