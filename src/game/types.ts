export type Route = 'companion' | 'guardian' | 'overlord'
export type Stage = 'bootling' | 'buddy' | 'prototype' | 'adult'
export type CareAction = 'charge' | 'repair' | 'play' | 'cool'
export type ArcadeKind = 'stack' | 'pong' | 'space'
export type Activity = 'dance' | 'weights' | 'coffee'
export type Colour = 'mint' | 'sunshine' | 'sky' | 'rose' | 'lilac' | 'graphite'
export type Shape = 'classic' | 'round' | 'boxy'
export type Accessory = 'none' | 'bow' | 'headphones' | 'crown'
export interface Appearance { colour: Colour; shape: Shape; accessory: Accessory; decoration: 'none' | 'plant' | 'trophy' }
export interface ArcadeRecord { best: number; rounds: number }
export type Cause = 'power' | 'structure' | 'both'
export interface Meters { battery: number; happiness: number; integrity: number; heat: number; rust: number }
export interface RobotSave {
  schemaVersion: 3; runId: string; revision: number; name: string; stage: Stage;
  status: 'awake' | 'critical' | 'dead'; bornAtMs: number; lastSimulatedAtMs: number;
  lastMaintenanceAtMs: number; criticalSinceMs: number | null; criticalCause: Cause | null;
  diedAtMs: number | null; wear: number; careSessions: number; lastCareSessionAtMs: number | null;
  xp: number; meters: Meters; choices: Array<{ lessonId: string; route: Route }>;
  adultRoute: Route | null; cooldownUntil: Record<CareAction, number>; globalActionUntil: number;
  emittedStageIds: Stage[]; outcomeSeen: boolean;
  pendingMinigame: null | { id: string; sequence: number[]; kind?: ArcadeKind; care?: boolean };
  lastResolvedMinigameId: string | null; lastSavedAtMs: number;
  appearance: Appearance; lifeLessons: Array<{ lessonId: string; answer: number }>;
  arcade: Record<ArcadeKind, ArcadeRecord>; activities: Record<Activity, number>;
}
export interface GameEvent { id: string; type: 'critical' | 'dead' | 'evolution' | 'care' | 'action' | 'lesson' | 'recovery'; text: string }
export interface Result { state: RobotSave; events: GameEvent[]; rejectionReason?: string }
export interface Rules { stageAges: number[]; lessonAges: number[]; stageXP: number[]; stageSessions: number[]; cooldowns: Record<CareAction, number>; globalLock: number }
export interface Memorial { runId: string; name: string; stage: Stage; route: Route | null; diedAtMs: number; ageMs: number; cause: Cause; wear: number }
export interface Memory {
  id: string; runId: string; name: string; stage: Stage; route: Route | null;
  appearance: Appearance; pose: Activity | ''; atMs: number; ageMs: number;
  caption: string; kind: 'photo' | 'milestone';
}
export interface Collection { discoveries: Route[]; memorials: Memorial[]; memories: Memory[]; milestoneIds: string[] }
