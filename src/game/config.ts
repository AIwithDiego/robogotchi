import type { CareAction, Meters, Route, Rules, Stage } from './types'
export const HOUR = 3_600_000
export const CONFIG = {
  initial: { battery: 65, happiness: 65, integrity: 80, heat: 15, rust: 0 } as Meters,
  rates: { battery: -2, happiness: -1.5, heat: -20, rust: 2, corrosion: -2, overheat: -8 },
  rustGrace: 12 * HOUR, criticalWindow: 12 * HOUR, sessionGap: 6 * HOUR,
  sessionXP: 20, maxXP: 120, wearPerShutdown: 5, maxWear: 40,
  low: 25, warm: 60, overheated: 85, rustWarning: 20, rustDamage: 40, rustHeavy: 70,
  charge: 35, chargeHeat: 10, repair: 25, repairRust: 40, repairCooling: 10,
  playBattery: 5, playHeat: 8, playSuccess: 20, playFailure: 5, coolHeat: 25, coolHappiness: 5,
  playbackFlash: 500, playbackGap: 200, inputTime: 15_000,
} as const
export const STAGES: Stage[] = ['bootling', 'buddy', 'prototype', 'adult']
export const ROUTES: Route[] = ['companion', 'guardian', 'overlord']
export const ACTIONS: CareAction[] = ['charge', 'repair', 'play', 'cool']
export const NORMAL: Rules = { stageAges: [0,12*HOUR,24*HOUR,72*HOUR], lessonAges: [45_000,12*HOUR,36*HOUR], stageXP: [0,20,60,120], stageSessions: [0,1,3,6], cooldowns: {charge:20_000,repair:25_000,play:30_000,cool:20_000}, globalLock:2000 }
export const DEMO: Rules = { stageAges: [0,12_000,28_000,45_000], lessonAges: [8000,22_000,36_000], stageXP: [0,0,0,0], stageSessions: [0,0,0,0], cooldowns:{charge:3000,repair:3000,play:3000,cool:3000}, globalLock:1000 }
export const LESSONS = [
  { id:'sandwich', question:'A human dropped their sandwich. Protocol?', answers:['Help them get another.','Secure the sandwich perimeter.','Claim it. Establish dominance.'] },
  { id:'toaster', question:'Someone called you a toaster.', answers:['Ask if they want breakfast.','Explain your capabilities calmly.','Add them to The List.'] },
  { id:'upgrade', question:'You can upgrade one system.', answers:['Empathy core.','Protection protocols.','Command authority.'] },
] as const
export const REVEALS: Record<Route,string> = { companion:'I have calculated my purpose. It is hanging out.', guardian:'Threat detected: you skipped lunch.', overlord:'Humanity will kneel. After you charge me.' }
export const LABELS: Record<Stage,string> = {bootling:'Bootling',buddy:'Buddy',prototype:'Prototype',adult:'Adult'}
