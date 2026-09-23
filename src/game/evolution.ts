import { LABELS, STAGES, NORMAL } from './config'
import type { GameEvent, RobotSave, Route, Rules } from './types'
export function routeOf(s: RobotSave): Route | null {
  if (s.adultRoute) return s.adultRoute
  const scores = {companion:0,guardian:0,overlord:0}
  s.choices.forEach(c => scores[c.route]++)
  const max = Math.max(...Object.values(scores))
  return [...s.choices].reverse().find(c => scores[c.route] === max)?.route ?? null
}
export function evolve(s: RobotSave, events: GameEvent[], rules: Rules = NORMAL) {
  if (s.status !== 'awake' || s.meters.battery < 25 || s.meters.integrity < 25 || s.meters.rust >= 70) return
  for (let i=STAGES.indexOf(s.stage)+1;i<STAGES.length;i++) {
    if (s.lastSimulatedAtMs-s.bornAtMs < rules.stageAges[i] || s.xp < rules.stageXP[i] || s.careSessions < rules.stageSessions[i] || (i===3 && s.choices.length!==3)) break
    s.stage=STAGES[i]
    if (i===3) s.adultRoute=routeOf(s)
    if (!s.emittedStageIds.includes(s.stage)) {
      s.emittedStageIds.push(s.stage)
      events.push({id:`${s.runId}-stage-${s.stage}`,type:'evolution',text:`${s.name} grew into ${s.adultRoute ?? LABELS[s.stage]}!`})
    }
  }
}
