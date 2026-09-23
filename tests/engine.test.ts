import { describe,it,expect } from 'vitest'
import { advanceTo,applyAction,chooseLesson,createRobot,finishMinigame,nextCareAt,recover } from '../src/game/engine'
import { CONFIG,DEMO,HOUR,LESSONS,NORMAL } from '../src/game/config'
import { routeOf } from '../src/game/evolution'
import { integrityMax,moodOf } from '../src/game/neglect'
import type { RobotSave,Route } from '../src/game/types'
const born=()=>createRobot('BEEP',0,'test-run')
function ready(age=72*HOUR){const s=born();s.lastSimulatedAtMs=age;s.lastMaintenanceAtMs=age;s.xp=120;s.careSessions=6;s.meters={battery:100,integrity:100,happiness:100,rust:0,heat:0};return s}
function compare(a:RobotSave,b:RobotSave){for(const key of Object.keys(a.meters) as (keyof typeof a.meters)[])expect(a.meters[key]).toBeCloseTo(b.meters[key],7);expect(a.status).toBe(b.status);expect(a.wear).toBe(b.wear);expect(a.diedAtMs).toBe(b.diedAtMs);expect(a.criticalSinceMs).toBeCloseTo(b.criticalSinceMs??0,5)}
describe('care and neglect',()=>{
 it('starts with the prescribed meters and trims names',()=>{expect(createRobot('  ',0,'x').name).toBe('BEEP');expect(createRobot('  Pixel  ',0,'x').name).toBe('Pixel');expect(born().meters).toEqual(CONFIG.initial)})
 it('is safe through a 12-hour night',()=>{const s=advanceTo(born(),12*HOUR).state;expect(s.meters).toEqual({battery:41,happiness:47,integrity:80,heat:0,rust:0});expect(s.status).toBe('awake')})
 it('starts rust immediately after grace and damages integrity at 40',()=>{expect(advanceTo(born(),13*HOUR).state.meters.rust).toBe(2);const s=advanceTo(born(),32*HOUR).state;expect(s.meters.rust).toBe(40);expect(s.meters.integrity).toBe(80);expect(advanceTo(s,32.5*HOUR).state.meters.integrity).toBe(79)})
 it('records the exact unattended critical and death times',()=>{const s=advanceTo(born(),48*HOUR).state;expect(s.status).toBe('dead');expect(s.criticalSinceMs).toBe(32.5*HOUR);expect(s.diedAtMs).toBe(44.5*HOUR);expect(s.lastSimulatedAtMs).toBe(s.diedAtMs);expect(s.wear).toBe(5);expect(s.criticalCause).toBe('power');expect(s.stage).toBe('bootling')})
 it('gives a fully charged clean robot 50 hours then a 12-hour recovery window',()=>{const s=ready(0);const r=advanceTo(s,100*HOUR).state;expect(r.criticalSinceMs).toBe(50*HOUR);expect(r.diedAtMs).toBe(62*HOUR)})
 it('reconciles one large gap exactly like many short updates',()=>{let s=born();for(let i=1;i<=192;i++)s=advanceTo(s,i*.25*HOUR).state;compare(s,advanceTo(born(),48*HOUR).state)})
 it('handles irregular millisecond boundaries and long absences',()=>{let s=born(),t=0;for(let i=0;i<120;i++){t+=1234567;s=advanceTo(s,t).state}const whole=advanceTo(born(),t).state;compare(s,whole);expect(advanceTo(s,10000*HOUR).state.diedAtMs).toBe(44.5*HOUR)})
 it('stops heat damage exactly at the cooling boundary',()=>{const s=born();s.meters.heat=100;const r=advanceTo(s,HOUR).state;expect(r.meters.heat).toBe(80);expect(r.meters.integrity).toBe(74);const at=born();at.meters.heat=85;expect(advanceTo(at,HOUR).state.meters.integrity).toBe(80)})
 it('charges with a beneficial reward, then rejects repeat input',()=>{const r=applyAction(born(),'charge',0);expect(r.state.meters.battery).toBe(100);expect(r.state.meters.heat).toBe(25);expect(r.state.xp).toBe(20);expect(r.state.careSessions).toBe(1);const again=applyAction(r.state,'charge',0);expect(again.rejectionReason).toBeTruthy();expect(again.state).toEqual(r.state)})
 it.each([[39.99,35],[40,28],[70,21]])('uses pre-action rust %s for charge gain %s',(rust,gain)=>{const s=born();s.meters.battery=40;s.meters.rust=rust;expect(applyAction(s,'charge',0).state.meters.battery).toBe(40+gain)})
 it('accepts cooldown exactly at expiry and respects the global lock',()=>{const s=born();s.meters.battery=20;const r=applyAction(s,'charge',0).state;expect(applyAction(r,'cool',1999).rejectionReason).toBeTruthy();expect(applyAction(r,'cool',2000).rejectionReason).toBeUndefined();expect(applyAction(r,'charge',19999).rejectionReason).toBeTruthy();expect(applyAction(r,'charge',20000).rejectionReason).toBeUndefined()})
 it('repairs rust and resets grace without resetting age or reward cooldown',()=>{const s=born();s.meters.rust=70;s.meters.integrity=50;s.lastCareSessionAtMs=0;const r=applyAction(s,'repair',1000).state;expect(r.meters.rust).toBe(30);expect(r.lastMaintenanceAtMs).toBe(1000);expect(r.bornAtMs).toBe(0);expect(r.lastCareSessionAtMs).toBe(0);expect(advanceTo(r,12*HOUR+1000).state.meters.rust).toBe(30)})
 it('repair respects wear-adjusted maximum and beneficial eligibility',()=>{const s=born();s.wear=40;s.meters.integrity=60;s.meters.heat=0;expect(applyAction(s,'repair',0).rejectionReason).toBeTruthy();s.meters.integrity=50;expect(applyAction(s,'repair',0).state.meters.integrity).toBe(60)})
 it('blocks play on rust 70, heat 85 or battery under 15',()=>{for(const [key,value] of [['rust',70],['heat',85],['battery',14]] as const){const s=born();s.meters[key]=value;expect(applyAction(s,'play',0,NORMAL,{id:'g',sequence:[1,2,3]}).rejectionReason).toBeTruthy()}})
 it('does not defer critical time merely by reopening',()=>{const s=advanceTo(born(),35*HOUR).state;expect(advanceTo(s,44.5*HOUR).state.status).toBe('dead');expect(s.criticalSinceMs).toBe(32.5*HOUR)})
 it('recovers before the deadline but never at it',()=>{const s=advanceTo(born(),33*HOUR).state;const r=recover(s,44.5*HOUR-1).state;expect(r.status).toBe('awake');expect(r.meters.battery).toBe(40);expect(r.meters.integrity).toBe(40);expect(r.wear).toBe(5);expect(r.xp).toBe(0);expect(recover(s,44.5*HOUR).state.status).toBe('dead')})
 it('counts each new critical entry once and caps lasting wear',()=>{let s=born();for(let i=0;i<12;i++){s.meters.battery=0;s=advanceTo(s,i).state;expect(advanceTo(s,i).state.wear).toBe(s.wear);s=recover(s,i).state}expect(s.wear).toBe(40);expect(integrityMax(s)).toBe(60)})
 it('records combined failure and freezes dead state',()=>{const s=born();s.meters.battery=0;s.meters.integrity=0;const dead=advanceTo(s,12*HOUR).state;expect(dead.criticalCause).toBe('both');expect(applyAction(dead,'repair',200*HOUR).state).toEqual(dead);expect(moodOf(dead)).toBe('Remembered')})
 it('retains high-water time after a backward clock jump',()=>{const s=advanceTo(born(),HOUR).state;expect(advanceTo(s,0).state).toEqual(s)})
 it('estimates the first care warning with the same simulation',()=>{expect(nextCareAt(born())).toBeCloseTo(20*HOUR,1);const s=ready(0);expect(nextCareAt(s)).toBeCloseTo(22*HOUR,1);s.meters.rust=20;expect(nextCareAt(s)).toBeNull()})
})
describe('care sessions, lessons and evolution',()=>{
 it('never awards XP for time, teaching or play startup',()=>{let s=advanceTo(born(),45000).state;s=chooseLesson(s,'sandwich','companion',45000).state;expect(s.xp).toBe(0);s=applyAction(s,'play',45000,NORMAL,{id:'g',sequence:[1,2,3]}).state;expect(s.xp).toBe(0)})
 it('requires six elapsed hours between care credits',()=>{let s=applyAction(born(),'charge',0).state;s.lastSimulatedAtMs=6*HOUR-1;s.lastMaintenanceAtMs=s.lastSimulatedAtMs;s.meters={battery:65,happiness:65,integrity:80,heat:15,rust:0};s=applyAction(s,'charge',6*HOUR-1).state;expect(s.careSessions).toBe(1);s.cooldownUntil.charge=0;s.globalActionUntil=0;s.meters.battery=65;s=applyAction(s,'charge',6*HOUR).state;expect(s.careSessions).toBe(2);expect(s.xp).toBe(40)})
 it('needs healthy condition for a credit',()=>{const s=born();s.meters.happiness=39;expect(applyAction(s,'charge',0).state.careSessions).toBe(0)})
 it('requires age, XP, sessions and health for growth',()=>{const s=ready(12*HOUR-1);expect(advanceTo(s,s.lastSimulatedAtMs).state.stage).toBe('bootling');s.lastSimulatedAtMs=12*HOUR;s.xp=19;expect(advanceTo(s,s.lastSimulatedAtMs).state.stage).toBe('bootling');s.xp=20;s.careSessions=0;expect(advanceTo(s,s.lastSimulatedAtMs).state.stage).toBe('bootling');s.careSessions=1;s.meters.rust=70;expect(advanceTo(s,s.lastSimulatedAtMs).state.stage).toBe('bootling');s.meters.rust=0;expect(advanceTo(s,s.lastSimulatedAtMs).state.stage).toBe('buddy')})
 it.each(['companion','guardian','overlord'] as Route[])('reaches %s adult and deduplicates evolution',(route)=>{const s=ready();s.choices=LESSONS.map(l=>({lessonId:l.id,route}));const r=advanceTo(s,72*HOUR);expect(r.state.stage).toBe('adult');expect(r.state.adultRoute).toBe(route);expect(r.events.filter(e=>e.type==='evolution')).toHaveLength(3);expect(advanceTo(r.state,72*HOUR).events).toHaveLength(0)})
 it('never evolves a dead or critical robot',()=>{const s=ready();s.meters.battery=0;s.choices=LESSONS.map(l=>({lessonId:l.id,route:'overlord'}));expect(advanceTo(s,72*HOUR).state.stage).toBe('bootling')})
 it('enforces ordered, unlocked and one-time lessons',()=>{const s=born();expect(chooseLesson(s,'sandwich','guardian',44999).rejectionReason).toBeTruthy();let r=chooseLesson(s,'toaster','guardian',45000);expect(r.rejectionReason).toBeTruthy();r=chooseLesson(s,'sandwich','guardian',45000);expect(r.state.choices).toHaveLength(1);expect(chooseLesson(r.state,'sandwich','overlord',50000).rejectionReason).toBeTruthy()})
 it('ties use latest choice among tied routes; two beats one',()=>{const s=born();s.choices=[{lessonId:'sandwich',route:'guardian'},{lessonId:'toaster',route:'companion'}];expect(routeOf(s)).toBe('companion');s.choices.push({lessonId:'upgrade',route:'overlord'});expect(routeOf(s)).toBe('overlord');s.choices[0].route='companion';expect(routeOf(s)).toBe('companion')})
 it('demo reaches adulthood with real choices at 45 seconds',()=>{let s=born();s=chooseLesson(s,'sandwich','overlord',8000,DEMO).state;s=chooseLesson(s,'toaster','overlord',22000,DEMO).state;s=chooseLesson(s,'upgrade','overlord',36000,DEMO).state;s=advanceTo(s,45000,DEMO).state;expect(s.stage).toBe('adult');expect(s.adultRoute).toBe('overlord');expect(s.xp).toBe(0)})
 it('keeps crediting attended adults without adding growth XP',()=>{const s=ready();s.stage='adult';s.adultRoute='guardian';s.emittedStageIds=['bootling','buddy','prototype','adult'];s.xp=40;s.meters.battery=65;const r=applyAction(s,'charge',72*HOUR).state;expect(r.careSessions).toBe(7);expect(r.xp).toBe(40)})
})
describe('memory circuit',()=>{
 const start=()=>applyAction(born(),'play',0,NORMAL,{id:'circuit-1',sequence:[1,2,3]}).state
 it('reserves cost and sequence before completion',()=>{const s=start();expect(s.meters.battery).toBe(60);expect(s.meters.heat).toBe(23);expect(s.pendingMinigame?.sequence).toEqual([1,2,3]);expect(s.cooldownUntil.play).toBe(30000)})
 it('success gives happiness and can earn one care credit',()=>{const s=finishMinigame(start(),'circuit-1',[1,2,3],0).state;expect(s.meters.happiness).toBe(85);expect(s.xp).toBe(20);expect(finishMinigame(s,'circuit-1',[1,2,3],0).state).toEqual(s)})
 it('mistakes give 5 but cancellation gives nothing',()=>{expect(finishMinigame(start(),'circuit-1',[4],0).state.meters.happiness).toBe(70);const r=finishMinigame(start(),'circuit-1',null,0).state;expect(r.meters.happiness).toBe(65);expect(r.xp).toBe(0);expect(r.cooldownUntil.play).toBe(30000)})
 it('critical shutdown cancels without rewarding a late callback',()=>{const s=start();const r=finishMinigame(s,'circuit-1',[1,2,3],31*HOUR);expect(r.state.status).toBe('critical');expect(r.state.pendingMinigame).toBeNull();expect(r.state.xp).toBe(0)})
})
describe('complete normal care schedule',()=>{
 it.each(['companion','guardian','overlord'] as Route[])('raises a healthy %s with morning/evening care and keeps the adult alive',(route)=>{
  let s=born()
  for(let visit=0;visit<=12;visit++){
   const t=visit*12*HOUR;s=advanceTo(s,t).state
   const charged=applyAction(s,'charge',t);expect(charged.rejectionReason).toBeUndefined();s=charged.state
   const game={id:`visit-${visit}`,sequence:[2,4,1]};const played=applyAction(s,'play',t+2000,NORMAL,game);expect(played.rejectionReason).toBeUndefined();s=played.state
   s=finishMinigame(s,game.id,game.sequence,t+4500).state
   const repaired=applyAction(s,'repair',t+4500);expect(repaired.rejectionReason).toBeUndefined();s=repaired.state
   while(s.choices.length<3&&t+45000>=NORMAL.lessonAges[s.choices.length]){s=chooseLesson(s,LESSONS[s.choices.length].id,route,t+45000).state}
   expect(s.status).toBe('awake');expect(s.wear).toBe(0)
   if(visit>=6){expect(s.stage).toBe('adult');expect(s.adultRoute).toBe(route)}
  }
  expect(s.careSessions).toBe(13);expect(s.xp).toBe(120)
 })
})
