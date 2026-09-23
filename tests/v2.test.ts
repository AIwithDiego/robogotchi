import { expect, it } from 'vitest'
import { advanceTo, createRobot } from '../src/game/engine'
import { beginArcade, doActivity, endArcade, restyle, teachLife } from '../src/game/extras'
import { collect, emptyCollection, memoryOf, mergeCollections, parseExport, parseSave, validateCollection, validateSave } from '../src/game/save'
import { availableLessons, LIFE_LESSONS } from '../src/game/lessons'
import { command, fits, ghostY, newArcade, step } from '../src/game/arcade'
import { HOUR } from '../src/game/config'
import { unlocks } from '../src/game/personality'
const robot=()=>createRobot('BEEP',0,'v2-test')
it('upgrades the previous save without changing identity, timeline, care or personality',()=>{
 const s=robot();s.choices=[{lessonId:'sandwich',route:'guardian'}]
 const old={...s,schemaVersion:2,appearance:undefined,lifeLessons:undefined,arcade:undefined,activities:undefined}
 const upgraded=parseSave(JSON.stringify(old))
 expect(upgraded.schemaVersion).toBe(3);expect(upgraded.runId).toBe(s.runId);expect(upgraded.meters).toEqual(s.meters);expect(upgraded.choices).toEqual(s.choices);expect(upgraded.bornAtMs).toBe(0);expect(upgraded.appearance.colour).toBe('mint')
})
it('rejects malformed customization, lessons, scores and sessions',()=>{
 const s=robot()
 for(const extra of [{appearance:{...s.appearance,colour:'__proto__'}},{lifeLessons:[{lessonId:'rain',answer:3}]},{lifeLessons:[{lessonId:'rain',answer:0},{lessonId:'rain',answer:1}]},{arcade:{...s.arcade,stack:{best:Infinity,rounds:2}}},{pendingMinigame:{id:'x',sequence:[1,2,3],kind:'other',care:true}}])expect(()=>validateSave({...s,...extra})).toThrow()
})
it('migrates the old memory collection and exports the complete album',()=>{
 const c=validateCollection({discoveries:['guardian'],memorials:[]}),s=robot()
 c.memories.push(memoryOf(s,'photo','Our first dance.','photo','dance'))
 const backup=parseExport(JSON.stringify({format:'robogotchi-backup',robot:s,collection:c}))
 expect(backup.robot).toEqual(s);expect(backup.collection?.memories[0].pose).toBe('dance')
 expect(parseExport(JSON.stringify(s)).collection).toBeNull()
})
it('freezes appearance and pose in a memory',()=>{
 const s=robot(),m=memoryOf(s,'photo','Hello','photo','coffee');s.appearance.colour='rose';s.stage='adult'
 expect(m.appearance.colour).toBe('mint');expect(m.stage).toBe('bootling');expect(m.pose).toBe('coffee')
})
it('bounds the album without re-creating evicted milestones on every save',()=>{
 const s=robot();let c=collect(emptyCollection(),s)
 for(let i=0;i<90;i++){c.memories.push(memoryOf(s,'p'+i,'Photo'));c=collect(c,s)}
 expect(c.memories).toHaveLength(80);expect(c.memories[0].id).toBe('p10')
 expect(collect(c,s)).toEqual(c)
})
it('merges albums by stable identity and preserves existing memories',()=>{
 const a=collect(emptyCollection(),robot()),b=structuredClone(a);b.memories.push(memoryOf(robot(),'manual','Hello'))
 expect(mergeCollections(a,b).memories).toHaveLength(2)
})
it('activities and restyling have no care or growth effects',()=>{
 const s=robot();s.careSessions=1
 for(const activity of ['dance','weights','coffee'] as const){const next=doActivity(s,activity);expect(next.meters).toEqual(s.meters);expect(next.xp).toBe(s.xp);expect(next.activities[activity]).toBe(1)}
 const styled=restyle(s,{...s.appearance,shape:'round',colour:'lilac',accessory:'bow'})
 expect(styled.appearance.colour).toBe('lilac');expect(styled.meters).toEqual(s.meters)
 expect(restyle(robot(),{...s.appearance,accessory:'crown'}).appearance.accessory).toBe('none')
})
it('all 21 extra lessons are unique, age gated and leave core votes intact',()=>{
 const s=robot();expect(new Set(LIFE_LESSONS.map(l=>l.id)).size).toBe(21);expect(availableLessons(s)).toHaveLength(4)
 expect(teachLife(s,'purpose',0,0).rejectionReason).toBeTruthy()
 const taught=teachLife(s,'rain',0,0).state;expect(taught.lifeLessons).toHaveLength(1);expect(taught.meters).toEqual(s.meters);expect(taught.choices).toEqual([]);expect(teachLife(taught,'rain',1,0).rejectionReason).toBeTruthy()
})
it('adult lessons never change a locked route or grant XP',()=>{
 const s=robot();s.stage='adult';s.adultRoute='guardian';s.emittedStageIds.push('adult')
 let next=s;for(const l of LIFE_LESSONS)next=teachLife(next,l.id,2,0).state
 expect(next.lifeLessons).toHaveLength(21);expect(next.adultRoute).toBe('guardian');expect(next.xp).toBe(0)
})
it('a care round charges once and resolves once, with bounded care rewards',()=>{
 const s=beginArcade(robot(),'stack','one',0).state
 expect(s.meters.battery).toBe(60);expect(s.pendingMinigame?.care).toBe(true)
 const r=endArcade(s,'one',120,11,11000)
 expect(r.state.arcade.stack).toEqual({best:120,rounds:1});expect(r.state.meters.happiness).toBeGreaterThan(84)
 expect(endArcade(r.state,'one',500,11,11000).state).toEqual(r.state)
 expect(r.state.choices).toHaveLength(0)
})
it('quit or too-short arcade rounds give no happiness or records',()=>{
 const s=beginArcade(robot(),'pong','one',0).state,r=endArcade(s,'one',100,2,2000)
 expect(r.state.meters.happiness).toBeLessThanOrEqual(65);expect(r.state.arcade.pong.rounds).toBe(0);expect(r.state.pendingMinigame).toBeNull()
})
it('practice rounds work under cooldown and low power without care costs',()=>{
 const s=robot();s.meters.battery=10
 const playing=beginArcade(s,'space','one',0).state
 expect(playing.pendingMinigame?.care).toBe(false);expect(playing.meters).toEqual(s.meters)
 const r=endArcade(playing,'one',100,15,15000).state
 expect(r.meters).toEqual(advanceTo(s,15000).state.meters);expect(r.arcade.space.best).toBe(100);expect(r.xp).toBe(0)
})
it('arcade cannot start when critical, or leave a reward after death',()=>{
 const s=advanceTo(robot(),33*HOUR).state;expect(beginArcade(s,'pong','one',33*HOUR).rejectionReason).toBeTruthy()
 const running=beginArcade(robot(),'space','one',0).state;expect(endArcade(running,'one',100,20,50*HOUR).state.arcade.space.rounds).toBe(0)
})
it('cosmetics unlock from concrete milestones',()=>{
 const s=robot();expect(unlocks(s).headphones).toBe(false);s.arcade.stack.rounds=3;expect(unlocks(s).headphones).toBe(true);expect(unlocks(s).crown).toBe(false);s.arcade.pong.rounds=1;s.arcade.space.rounds=1;expect(unlocks(s).crown).toBe(true);expect(unlocks(s).trophy).toBe(true)
})
it('Circuit Stack collides, rotates at the wall, clears a row and ends on top-out',()=>{
 const m=newArcade('stack',()=>.5),s=m.stack
 s.piece={cells:[[1,1,1,1]],x:0,y:0};command(m,'left');expect(s.piece.x).toBe(0);command(m,'rotate');expect(fits(s,s.piece)).toBe(true);expect(ghostY(s)).toBe(12)
 s.board[15]=[1,1,1,1,0,0,1,1,1,1];s.piece={cells:[[2,2]],x:4,y:0};command(m,'drop');expect(s.lines).toBe(1);expect(m.score).toBeGreaterThanOrEqual(100)
 s.board=Array.from({length:16},()=>Array(10).fill(0));s.board[0][3]=1;s.next=[[2,2],[2,2]];s.piece={cells:[[1]],x:0,y:14};command(m,'drop');expect(m.over).toBe(true)
})
it('Paddle Bot bounces from a paddle, awards points and ends at seven',()=>{
 const m=newArcade('pong'),p=m.pong;p.serve=0;p.x=32;p.y=p.player;p.vx=-200;step(m,.02);expect(p.vx).toBeGreaterThan(0);expect(m.score).toBe(10)
 p.x=359;p.vx=200;p.y=10;p.you=6;step(m,.02);expect(m.over).toBe(true);expect(p.you).toBe(7);expect(m.score).toBe(610)
})
it('Space Patrol destroys enemies, advances waves and respects shields',()=>{
 const m=newArcade('space'),s=m.space;s.aliens=[{x:180,y:100,alive:true}];s.bullets=[{x:180,y:104,enemy:false}];step(m,.02);expect(s.wave).toBe(2);expect(m.score).toBe(225)
 s.invincible=0;s.lives=1;s.bullets=[{x:s.x,y:410,enemy:true}];step(m,.02);expect(m.over).toBe(true);expect(s.lives).toBe(0)
})
it('every arcade game has a bounded round and ignores updates after finishing',()=>{
 for(const kind of ['stack','pong','space'] as const){const m=newArcade(kind);m.elapsed=121;step(m,.02);expect(m.over).toBe(true);const before=structuredClone(m);step(m,.02,{fire:true});expect(m).toEqual(before)}
})

it('rejects invalid snapshot dates and non-string customization values',()=>{
 const s=robot(),c=collect(emptyCollection(),s)
 expect(()=>validateCollection({...c,memories:[{...c.memories[0],atMs:Number.MAX_SAFE_INTEGER}]})).toThrow()
 expect(()=>validateCollection({...c,memories:[{...c.memories[0],ageMs:100}]})).toThrow()
 expect(()=>validateSave({...s,appearance:{...s.appearance,colour:['mint']}})).toThrow()
})
it('preserves long valid legacy run identifiers in automatic milestones',()=>{
 const s=createRobot('BEEP',0,'a'.repeat(150));const c=collect(emptyCollection(),s)
 expect(validateCollection(c)).toEqual(c)
})
