import { LESSONS, ROUTES } from '../game/config'
import type { RobotSave, Route, Rules } from '../game/types'
import { duration } from '../game/clock'
import { Icon } from './Icon'
export function TeachingCard({state,rules,disabled,onChoose}:{state:RobotSave;rules:Rules;disabled:boolean;onChoose:(id:string,route:Route)=>void}){
 const i=state.choices.length,age=state.lastSimulatedAtMs-state.bornAtMs
 if(i>=3)return <div className="lessons-done"><Icon name="check"/><span>Three lessons. A personality of its own.</span></div>
 const ready=age>=rules.lessonAges[i],lesson=LESSONS[i]
 return <section className={`teaching ${ready?'ready':''}`}><div className="panel-heading"><span className="eyebrow">LIFE LESSON {String(i+1).padStart(2,'0')}</span><Icon name="book" size={18}/></div>{ready?<><h3>{lesson.question}</h3><p>Your lessons shape who I become. Choose once.</p><div className="lesson-choices">{lesson.answers.map((answer,index)=><button key={answer} disabled={disabled||state.status!=='awake'} onClick={()=>onChoose(lesson.id,ROUTES[index])}><span>{String.fromCharCode(65+index)}</span>{answer}<Icon name="arrow" size={15}/></button>)}</div>{state.status!=='awake'&&<p>Lessons resume after an emergency repair.</p>}</>:<><h3>A curious little mind.</h3><p>Next lesson in <strong>{duration(rules.lessonAges[i]-age,true)}</strong>. Keep caring while your robot gets ready.</p></>}</section>
}
