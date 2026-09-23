import { CONFIG } from './config'
import type { GameEvent, RobotSave } from './types'
export const integrityMax = (s: RobotSave) => 100-s.wear
export const chargeEfficiency = (rust: number) => rust >= CONFIG.rustHeavy ? .6 : rust >= CONFIG.rustDamage ? .8 : 1
export const rustBand = (rust: number) => rust >= 70 ? 'Heavy corrosion' : rust >= 40 ? 'Corroded joints' : rust >= 20 ? 'Rust spots' : 'Clean plates'
export function checkLife(s: RobotSave, events: GameEvent[]) {
  if (s.status==='dead') return
  if (s.status==='awake' && (s.meters.battery===0 || s.meters.integrity===0)) {
    s.status='critical'; s.criticalSinceMs=s.lastSimulatedAtMs
    s.criticalCause=s.meters.battery===0 ? (s.meters.integrity===0?'both':'power') : 'structure'
    s.wear=Math.min(CONFIG.maxWear,s.wear+CONFIG.wearPerShutdown)
    s.meters.integrity=Math.min(s.meters.integrity,integrityMax(s)); s.pendingMinigame=null
    events.push({id:`${s.runId}-critical-${s.criticalSinceMs}`,type:'critical',text:'Core offline. Emergency repair is available for 12 hours.'})
  }
  if(s.status==='critical' && s.criticalSinceMs!==null && s.lastSimulatedAtMs>=s.criticalSinceMs+CONFIG.criticalWindow) {
    s.status='dead'; s.diedAtMs=s.criticalSinceMs+CONFIG.criticalWindow; s.lastSimulatedAtMs=s.diedAtMs
    s.pendingMinigame=null
    events.push({id:`${s.runId}-death`,type:'dead',text:`${s.name}’s core has permanently shut down.`})
  }
}
export function moodOf(s:RobotSave) {
  if (s.status==='dead') return 'Remembered'
  if (s.status==='critical') return 'Critical shutdown'
  if (s.meters.rust>=70) return 'Heavy corrosion'
  if (s.meters.heat>=85) return 'Overheated'
  if (s.meters.battery<25) return 'Low battery'
  if (s.meters.integrity<25) return 'Needs repair'
  if (s.meters.happiness<25) return 'Feeling lonely'
  return 'Feeling good'
}
