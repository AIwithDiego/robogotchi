import { advanceTo, actionReason, applyAction, finishMinigame } from './engine'
import { NORMAL } from './config'
import { availableLessons, LIFE_LESSONS } from './lessons'
import { ARCADE, unlocks } from './personality'
import type { Activity, Appearance, ArcadeKind, Result, RobotSave, Rules } from './types'

export function teachLife(input:RobotSave,id:string,answer:number,now:number,rules:Rules=NORMAL):Result {
 const r=advanceTo(input,now,rules),s=r.state,l=availableLessons(s).find(l=>l.id===id)
 if(s.status!=='awake'||!l||!Number.isInteger(answer)||answer<0||answer>2)return {...r,rejectionReason:'This lesson is not available.'}
 s.lifeLessons.push({lessonId:id,answer});s.revision++
 r.events.push({id:s.runId+'-life-'+id,type:'lesson',text:l.replies[answer]})
 return r
}
export function restyle(input:RobotSave,appearance:Appearance):RobotSave {
 const unlocked=unlocks(input)
 if(!unlocked[appearance.accessory]||!unlocked[appearance.decoration])return input
 return {...input,appearance:{...appearance},revision:input.revision+1}
}
export function doActivity(input:RobotSave,activity:Activity):RobotSave {
 if(input.status!=='awake')return input
 return {...input,activities:{...input.activities,[activity]:Math.min(1000000,input.activities[activity]+1)},revision:input.revision+1}
}
export function beginArcade(input:RobotSave,kind:ArcadeKind,id:string,now:number,rules:Rules=NORMAL):Result {
 let r=advanceTo(input,now,rules)
 if(r.state.status!=='awake'||r.state.pendingMinigame||!ARCADE[kind])return {...r,rejectionReason:'Finish the current round first.'}
 const care=!actionReason(r.state,'play')
 if(care)r=applyAction(r.state,'play',now,rules,{id,sequence:[1,2,3]})
 r.state.pendingMinigame={id,sequence:[1,2,3],kind,care};r.state.revision++
 return r
}
export function endArcade(input:RobotSave,id:string,score:number,seconds:number,now:number,rules:Rules=NORMAL):Result {
 let r=advanceTo(input,now,rules);const pending=r.state.pendingMinigame
 if(!pending?.kind||pending.id!==id||r.state.lastResolvedMinigameId===id)return {...r,rejectionReason:'This round is already closed.'}
 const kind=pending.kind,completed=Number.isFinite(seconds)&&seconds>=10&&Number.isInteger(score)&&score>=0&&score<=10000000&&r.state.status==='awake'
 if(pending.care){r=finishMinigame(r.state,id,completed?[1,2,3]:null,now,rules);r.events.forEach(e=>{e.text=e.text.replace('Circuit complete!','Playtime complete!')})}
 else {r.state.pendingMinigame=null;r.state.lastResolvedMinigameId=id}
 if(completed){const record=r.state.arcade[kind];record.rounds=Math.min(1000000,record.rounds+1);const best=score>record.best;record.best=Math.max(record.best,score);r.events.push({id:id+'-score',type:'action',text:(best?'New personal best! ':'')+ARCADE[kind].name+': '+score+' points.'})}
 r.state.revision++
 return r
}
export function rememberedLine(s:RobotSave):string {
 const c=s.lifeLessons.at(-1),l=LIFE_LESSONS.find(l=>l.id===c?.lessonId)
 return l&&c?'I remember: '+l.replies[c.answer]:s.adultRoute==='overlord'?'My favourite subject has returned. I mean, human.':s.adultRoute==='guardian'?'You are home. All systems feel safer.':'You returned. That is my favourite part.'
}
