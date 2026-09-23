import {it,expect} from 'vitest'
import {createRobot,advanceTo} from '../src/game/engine'
import {HOUR} from '../src/game/config'
import {clearProgress,collect,emptyCollection,KEYS,loadRobot,parseSave,validateSave,writeRobot} from '../src/game/save'
class MemoryStorage{items=new Map<string,string>();getItem(k:string){return this.items.get(k)??null}setItem(k:string,v:string){this.items.set(k,v)}removeItem(k:string){this.items.delete(k)}}
it('round trips a valid save',()=>{const s=createRobot('NOVA',0,'a');expect(parseSave(JSON.stringify(s))).toEqual(s)})
it('keeps the last valid backup and offers recovery of a corrupt primary',()=>{const storage=new MemoryStorage(),s=createRobot('NOVA',0,'a');writeRobot(storage,s,emptyCollection(),0);const second={...s,name:'BEEP'};writeRobot(storage,second,emptyCollection(),0);storage.setItem(KEYS.robot,'broken');const loaded=loadRobot(storage,0);expect(loaded.kind).toBe('invalid');if(loaded.kind==='invalid')expect(loaded.backup?.name).toBe('NOVA');expect(storage.getItem(KEYS.robot)).toBe('broken')})
it('warns on unavailable storage without erasing in-memory state',()=>{const broken={getItem(){throw new Error('disabled')},setItem(){throw new Error('disabled')}};expect(loadRobot(broken).kind).toBe('unavailable')})
it('rejects future schemas, invalid values and oversized imports',()=>{const s=createRobot('BEEP',0,'a');expect(()=>parseSave(JSON.stringify({...s,schemaVersion:99}))).toThrow(/version/);expect(()=>parseSave(' '.repeat(100001))).toThrow(/100 KB/);expect(()=>validateSave({...s,meters:{...s.meters,battery:-1}})).toThrow();expect(()=>validateSave({...s,name:'<img src=x>1234567'})).toThrow();expect(()=>validateSave({...s,choices:[{lessonId:'upgrade',route:'guardian'}]})).toThrow()})
it('migrates a known v1 save without retroactive neglect',()=>{const s=parseSave(JSON.stringify({schemaVersion:1,name:'BEEP',stage:'buddy',status:'shutdown',choices:[]}),123456);expect(s.bornAtMs).toBe(123456);expect(s.lastMaintenanceAtMs).toBe(123456);expect(s.status).toBe('awake');expect(s.meters.battery).toBe(40);expect(s.wear).toBe(0);expect(s.xp).toBe(0);expect(s.stage).toBe('buddy')})
it('records a memorial once and retains at most the most recent 50',()=>{let c=emptyCollection();for(let i=0;i<55;i++){const s=advanceTo(createRobot('BEEP',i*HOUR,`run-${i}`),(i+50)*HOUR).state;c=collect(c,s);c=collect(c,s)}expect(c.memorials).toHaveLength(50);expect(c.memorials[0].runId).toBe('run-5');expect(c.memorials.at(-1)?.runId).toBe('run-54')})
it('can reconstruct a memorial from the terminal primary save',()=>{const s=advanceTo(createRobot('BEEP',0,'a'),50*HOUR).state;const recovered=collect(emptyCollection(),parseSave(JSON.stringify(s)));expect(recovered.memorials[0].diedAtMs).toBe(44.5*HOUR)})
it('clears only game progress, including corrupt saves and the recovery backup',()=>{
 const storage=new MemoryStorage();for(const key of Object.values(KEYS))storage.setItem(key,'unreadable');storage.setItem('another-app','keep')
 clearProgress(storage);expect(loadRobot(storage).kind).toBe('empty');expect(storage.getItem(KEYS.backup)).toBeNull();expect(storage.getItem(KEYS.collection)).toBeNull();expect(storage.getItem(KEYS.settings)).toBe('unreadable');expect(storage.getItem('another-app')).toBe('keep')
 clearProgress(storage);expect(storage.items.size).toBe(2)
})
it('restores earlier deletions when a progress reset fails partway through',()=>{
 for(const failAt of [KEYS.backup,KEYS.collection,KEYS.robot]){
  const storage=new MemoryStorage();for(const key of Object.values(KEYS))storage.setItem(key,key);const original=new Map(storage.items)
  storage.removeItem=(key:string)=>{if(key===failAt)throw new Error('blocked');storage.items.delete(key)}
  expect(()=>clearProgress(storage)).toThrow('blocked');expect(storage.items).toEqual(original)
 }
})
