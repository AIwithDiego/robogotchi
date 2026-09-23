import { ACTIONS } from '../game/config'
import { actionReason } from '../game/engine'
import { chargeEfficiency, integrityMax } from '../game/neglect'
import type { CareAction, RobotSave } from '../game/types'
import { Icon } from './Icon'
export function CarePanel({state,disabled,onAction}:{state:RobotSave;disabled:boolean;onAction:(a:CareAction)=>void}){
 const icons=['bolt','heart','shield','fan','rust']
 return <><div className="meters" aria-label="Robot condition">{Object.entries(state.meters).map(([key,value],i)=><div className={`meter meter-${key} ${((key==='battery'||key==='integrity')&&value<25)||(key==='rust'&&value>=40)||(key==='heat'&&value>=85)?'danger':''}`} key={key}><span><Icon name={icons[i]} size={13}/>{key}</span><strong>{Math.round(value)}<small>{key==='integrity'&&state.wear>0?`/${integrityMax(state)}`:'%'}</small></strong><div className="meter-track" role="meter" aria-label={key} aria-valuemin={0} aria-valuemax={key==='integrity'?integrityMax(state):100} aria-valuenow={Math.round(value)}><i style={{width:`${value}%`}}/></div></div>)}</div><div className="actions">{ACTIONS.map((a,i)=>{const reason=disabled?'Active in another tab':a==='play'?(state.status==='awake'?undefined:'Your robot needs care'):actionReason(state,a);return <button className={`care-button ${a==='charge'&&state.careSessions===0?'hint':''}`} disabled={!!reason} onClick={e=>{e.currentTarget.focus();onAction(a)}} key={a} aria-describedby={`reason-${a}`}><Icon name={['bolt','tool','play','fan'][i]}/><strong>{['Charge','Clean & repair','Play','Cool down'][i]}</strong><span id={`reason-${a}`}>{reason??[`+${35*chargeEfficiency(state.meters.rust)} battery · +10 heat`,'Repair · remove rust','3 arcade games','−25 heat · +5 joy'][i]}</span></button>})}</div></>
}
