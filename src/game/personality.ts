import type { Appearance, Activity, ArcadeKind, RobotSave } from './types'

export const COLOURS = {
  mint: { name: 'Mint', light: '#f7fff0', body: '#afddc4', dark: '#6b9c88' },
  sunshine: { name: 'Sunshine', light: '#fff4cf', body: '#f1c766', dark: '#b08035' },
  sky: { name: 'Sky', light: '#e5f8ff', body: '#87bddf', dark: '#4c7fa1' },
  rose: { name: 'Rose', light: '#ffe8ec', body: '#e9a3b3', dark: '#a5667e' },
  lilac: { name: 'Lilac', light: '#f2eaff', body: '#bea3e6', dark: '#8266a8' },
  graphite: { name: 'Graphite', light: '#a7b9bc', body: '#657b83', dark: '#354b56' },
} as const
export const SHAPES = { classic: 'Classic', round: 'Round', boxy: 'Boxy' } as const
export const ARCADE: Record<ArcadeKind, { name: string; description: string; controls: string; colour: string }> = {
  stack: { name: 'Circuit Stack', description: 'Find a fit. Clear a row. Keep your cool.', controls: '← → move · ↑ rotate · ↓ soft drop · Space drop', colour: '#a9efd0' },
  pong: { name: 'Paddle Bot', description: 'One paddle. One cheeky opponent. First to 7.', controls: '↑ ↓ or W S · drag your paddle up and down', colour: '#f0d48d' },
  space: { name: 'Space Patrol', description: 'Dodge, shoot and send the invaders packing.', controls: '← → or A D · Space shoot · 3 shields', colour: '#c5b3f4' },
}
export const defaultAppearance = (): Appearance => ({ colour: 'mint', shape: 'classic', accessory: 'none', decoration: 'none' })
export const defaultArcade = () => ({ stack: {best:0,rounds:0}, pong: {best:0,rounds:0}, space: {best:0,rounds:0} })
export const roomOf = (s: Pick<RobotSave,'stage'|'adultRoute'>) => s.stage === 'adult' ? s.adultRoute ?? 'companion' : s.stage
export const ROOM_NAMES: Record<string,string> = {bootling:'Charging nursery',buddy:'Playroom',prototype:'Workshop',companion:'Cozy studio',guardian:'City lookout',overlord:'Secret lair'}
export const totalRounds = (s:RobotSave) => Object.values(s.arcade).reduce((n,r)=>n+r.rounds,0)
export function unlocks(s:RobotSave) {
  return {none:true,bow:s.careSessions>=1,headphones:totalRounds(s)>=3,crown:Object.values(s.arcade).every(r=>r.rounds>0),plant:s.lifeLessons.length>=3,trophy:totalRounds(s)>=5}
}
const lines: Record<Activity, [string,string,string]> = {
  dance:['These moves are stored in my emotional support folder.','Perimeter secure. Deploying jazz hands.','Behold the dance of your future ruler.'],
  weights:['Training to carry all your feelings. And a grocery bag.','One more rep. Someone must carry the team.','Today: tiny weights. Tomorrow: the weight of an empire.'],
  coffee:['One warm cup. Zero practical reasons.','Caffeine acquired. Vigilance remains at 100%.','My demands: world peace, absolute power, oat milk.'],
}
export function activityLine(s:RobotSave,a:Activity) {
  return lines[a][s.adultRoute==='guardian'?1:s.adultRoute==='overlord'?2:0]
}
