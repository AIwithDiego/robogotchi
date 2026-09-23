import { useState } from 'react'
import { StylePicker } from './CompanionExtras'
import { defaultAppearance } from '../game/personality'
import type { Appearance, RobotSave } from '../game/types'

export function RestartRobot({robot,demo,disabled,onBoot,onCancel}:{robot:RobotSave|null;demo:boolean;disabled:boolean;onBoot:(name:string,appearance:Appearance)=>boolean;onCancel:()=>void}){
 const [name,setName]=useState(''),[appearance,setAppearance]=useState(defaultAppearance),[error,setError]=useState('')
 return <form className="restart-panel" onSubmit={e=>{e.preventDefault();if(!onBoot(name,appearance))setError('Could not start a new robot. Check the save notice, or use Start from scratch in Settings to clear damaged progress.')}}>
  <p>{demo?'Restart this demo with a new name and look. Your real robot and album stay safe.':robot?`This replaces ${robot.name} and resets its growth, lessons, scores and unlocks. Your memory album, discovered forms and memorials are kept.`:'Start a new robot while keeping your memory album, discovered forms and memorials.'}</p>
  {!demo&&robot&&robot.status!=='dead'&&<p>Your current robot will be replaced when you boot the new one. Export a save in Settings first if you want to keep this run.</p>}
  <label htmlFor="new-robot-name">Your new robot’s name</label>
  <input id="new-robot-name" maxLength={16} value={name} placeholder="BEEP" autoComplete="off" onChange={e=>setName(e.target.value)}/>
  <StylePicker value={appearance} onChange={setAppearance}/>
  {error&&<p role="alert" className="error-text">{error}</p>}
  <div className="panel-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="submit" className="primary" disabled={disabled}>{demo?'Boot new demo':'Boot new robot'}</button></div>
 </form>
}

export function EraseProgress({disabled,canExport,onExport,onErase,onCancel}:{disabled:boolean;canExport:boolean;onExport:()=>void;onErase:()=>boolean;onCancel:()=>void}){
 const [error,setError]=useState('')
 return <div className="restart-panel">
  <p>This permanently deletes all game progress saved in this browser:</p>
  <ul><li>Your robot, name, look, growth and lessons.</li><li>Arcade scores, accessories and room unlocks.</li><li>All memories, memorials and discovered forms.</li><li>The automatic recovery backup.</li></ul>
  <p>You’ll return to the welcome screen to choose a new name and look. Sound and motion preferences stay the same.</p>
  <p>This cannot be undone without an exported save.</p>
  {canExport&&<button className="text-button" onClick={onExport}>Export save first</button>}
  {error&&<p role="alert" className="error-text">{error}</p>}
  <div className="panel-actions"><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary erase-button" disabled={disabled} onClick={()=>{if(!onErase())setError('Could not finish clearing progress. Check that this is the active game tab and your browser allows saving, then try again.')}}>Delete progress & start fresh</button></div>
 </div>
}
