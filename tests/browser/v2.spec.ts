import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createRobot } from '../../src/game/engine'
import { KEYS } from '../../src/game/save'
const time=new Date('2026-09-15T10:00:00Z')
const saved=(page:Page)=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.robot)
async function boot(page:Page){await page.goto('/');await page.getByRole('button',{name:/Boot my robot/}).click();await expect(page.getByRole('heading',{name:'BEEP',exact:true})).toBeVisible();await page.clock.fastForward(1600)}
test.beforeEach(async({page})=>{await page.clock.install({time})})
test('choose a colour and shape at boot, restyle later and keep the original memory',async({page},info)=>{
 await page.goto('/');await page.getByRole('button',{name:'Lilac',exact:true}).click();await page.getByRole('button',{name:'Round',exact:true}).click();await page.getByRole('button',{name:/Boot my robot/}).click();await page.clock.fastForward(1600)
 expect((await saved(page)).appearance).toMatchObject({colour:'lilac',shape:'round'});await page.getByRole('button',{name:'Save a memory',exact:true}).click();await page.getByLabel('Give this moment a caption').fill('My first purple morning');await page.getByRole('button',{name:'Save this memory'}).click();await expect(page.getByRole('dialog').getByRole('status')).toContainText(/You’ll find it/);await page.getByRole('button',{name:'Close dialog'}).click()
 await page.getByRole('button',{name:/Change my look/}).click();await page.getByRole('button',{name:'Sunshine',exact:true}).click();await page.getByRole('button',{name:'Boxy',exact:true}).click();await page.getByRole('button',{name:'Save my look'}).click();await page.reload()
 expect((await saved(page)).appearance).toMatchObject({colour:'sunshine',shape:'boxy'});await page.getByRole('button',{name:/^Memories/}).click();await expect(page.getByRole('heading',{name:'My first purple morning'})).toBeVisible()
 const album=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.collection);expect(album.memories.find((m:{caption:string})=>m.caption==='My first purple morning').appearance.colour).toBe('lilac')
 await page.screenshot({path:'test-results/'+info.project.name+'-v2-album.png',fullPage:true})
})
test('fun activities show poses without care costs, and the camera freezes the pose',async({page})=>{
 await boot(page);const before=await saved(page)
 for(const [button,pose] of [['Dance','dance'],['Do weights','weights'],['Get coffee','coffee']]){
  await page.getByRole('button',{name:button,exact:true}).click();await expect(page.locator('.habitat>.robot')).toHaveClass(new RegExp(pose));const after=await saved(page);expect(after.meters.battery).toBeCloseTo(before.meters.battery,1);expect(after.xp).toBe(before.xp)
 }
 await page.getByRole('button',{name:'Save a memory',exact:true}).click();await page.clock.runFor(8000);await page.getByLabel('Give this moment a caption').fill('Coffee break');await page.getByRole('button',{name:'Save this memory'}).click()
 const c=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.collection);expect(c.memories.at(-1).pose).toBe('coffee')
})
test('extra lessons are stored, recalled and do not change the core route',async({page})=>{
 await boot(page);await page.getByRole('button',{name:/More life lessons/}).click();await page.getByRole('button',{name:'A Wait. Tiny journeys count.'}).click();await expect(page.getByRole('dialog').getByRole('status')).toContainText('Patience installed');await page.getByRole('button',{name:/Our conversations/}).click();await expect(page.getByRole('heading',{name:'A snail is crossing the path. We are late.'})).toBeVisible();await page.reload()
 const s=await saved(page);expect(s.lifeLessons).toEqual([{lessonId:'rain',answer:0}]);expect(s.choices).toEqual([]);expect(s.xp).toBe(0);await expect(page.locator('.speech')).toContainText('I remember: Patience installed')
})
for(const [kind,label,control] of [['pong','02 Paddle Bot','Move down'],['space','03 Space Patrol','Fire']] as const){
 test(label+' responds to pointer controls, records a round and can restart',async({page},info)=>{
  await boot(page);await page.getByRole('button',{name:/^Play 3 arcade games/}).click();await page.getByRole('button',{name:new RegExp(label)}).click()
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  const target=page.getByRole('button',{name:control,exact:true});await target.scrollIntoViewIfNeeded();const box=await target.boundingBox();expect(box).toBeTruthy()
  await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();await page.clock.runFor(500);await page.mouse.up()
  if(kind==='space'){await page.getByLabel(/Space Patrol playfield/).focus();await page.keyboard.down('Space')}
  await page.clock.runFor(11500);if(kind==='space')await page.keyboard.up('Space')
  await page.screenshot({path:'test-results/'+info.project.name+'-v2-'+kind+'.png'})
  await page.getByRole('button',{name:/^(End round & return|Back to arcade)$/}).click();expect((await saved(page)).arcade[kind].rounds).toBe(1);expect(errors).toEqual([])
  await page.getByRole('button',{name:new RegExp(label)}).click();await expect(page.getByLabel(new RegExp(kind==='pong'?'Paddle Bot playfield':'Space Patrol playfield'))).toBeVisible()
  await page.getByRole('button',{name:'Close dialog'}).click();expect((await saved(page)).arcade[kind].rounds).toBe(1)
 })
}
test('old saved robot upgrades in place and adult rooms follow the existing route',async({page})=>{
 const s=createRobot('LEGACY',time.getTime(),'legacy');s.stage='adult';s.adultRoute='guardian';s.outcomeSeen=true;s.emittedStageIds=['bootling','buddy','prototype','adult']
 const old={...s,schemaVersion:2,appearance:undefined,lifeLessons:undefined,arcade:undefined,activities:undefined}
 await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('seeded-v2')){localStorage.setItem(key,JSON.stringify(value));sessionStorage.setItem('seeded-v2','1')}},{key:KEYS.robot,value:old})
 await page.goto('/');await expect(page.getByRole('heading',{name:'LEGACY',exact:true})).toBeVisible();await expect(page.locator('.habitat')).toHaveCSS('background-image',/guardian.jpg/);expect((await saved(page)).runId).toBe('legacy');expect((await saved(page)).schemaVersion).toBe(3)
 await page.getByRole('button',{name:/More life lessons/}).click();await expect(page.getByText('21 available now',{exact:false})).toBeVisible()
})
test('demo customization and lessons cannot alter the real album or robot',async({page})=>{
 await boot(page);const original=await saved(page),album=await page.evaluate(key=>localStorage.getItem(key),KEYS.collection)
 await page.getByRole('button',{name:'60-second demo',exact:true}).click();await page.getByRole('button',{name:/Change my look/}).click();await page.getByRole('button',{name:'Rose',exact:true}).click();await page.getByRole('button',{name:'Save my look'}).click();await page.getByRole('button',{name:'Dance',exact:true}).click();await expect(page.getByRole('button',{name:'Save a memory',exact:true})).toBeDisabled()
 await page.getByRole('button',{name:/More life lessons/}).click();await page.getByRole('button',{name:'A Wait. Tiny journeys count.'}).click();await page.getByRole('button',{name:'Close dialog'}).click();expect(await saved(page)).toEqual(original);expect(await page.evaluate(key=>localStorage.getItem(key),KEYS.collection)).toBe(album)
 await page.getByRole('button',{name:/Exit demo/}).click();expect((await saved(page)).appearance.colour).toBe('mint')
})
test('a full backup restores the robot and merges snapshots, with an explicit delete',async({page})=>{
 await boot(page);await page.getByRole('button',{name:'Save a memory',exact:true}).click();await page.getByLabel('Give this moment a caption').fill('A keeper');await page.getByRole('button',{name:'Save this memory'}).click();await page.getByRole('button',{name:'Close dialog'}).click()
 await page.getByRole('button',{name:'Settings',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export save'}).click();const download=await downloadPromise;const stream=await download.createReadStream();const chunks:Buffer[]=[];for await(const chunk of stream!)chunks.push(chunk);const buffer=Buffer.concat(chunks);const backup=JSON.parse(buffer.toString());expect(backup.collection.memories.some((m:{caption:string})=>m.caption==='A keeper')).toBe(true)
 page.once('dialog',d=>d.accept());await page.locator('input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer});await page.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('button',{name:/^Memories/}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete memory: A keeper'}).click();await expect(page.getByRole('heading',{name:'A keeper'})).toHaveCount(0)
})

test('hidden arcade pauses and resumes the same paid round',async({page})=>{
 await boot(page);await page.getByRole('button',{name:/^Play 3 arcade games/}).click();await page.getByRole('button',{name:/01 Circuit Stack/}).click();await page.clock.runFor(1200);const before=await saved(page)
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await page.clock.runFor(20000)
 await expect(page.getByRole('heading',{name:'Paused',exact:true})).toBeVisible()
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))})
 expect((await saved(page)).pendingMinigame.id).toBe(before.pendingMinigame.id)
 await page.getByRole('button',{name:'Resume game'}).click();await page.clock.runFor(11000);await page.getByRole('button',{name:'End round & return'}).click();expect((await saved(page)).arcade.stack.rounds).toBe(1);expect((await saved(page)).meters.battery).toBeGreaterThan(59)
})
test('all six rooms load and a complete round unlocks cosmetics without changing growth',async({page})=>{
 await boot(page)
 for(const room of ['bootling','buddy','prototype','companion','guardian','overlord']){const r=await page.request.get('/rooms/'+room+'.jpg');expect(r.ok()).toBe(true);expect(r.headers()['content-type']).toContain('image/jpeg')}
 await page.getByRole('button',{name:/^Charge/}).click();await page.getByRole('button',{name:/Change my look/}).click();await page.getByRole('button',{name:/Bow tie Unlocked/}).click();await page.getByRole('button',{name:'Save my look'}).click();expect((await saved(page)).appearance.accessory).toBe('bow')
 await page.getByRole('button',{name:/^Play 3 arcade games/}).click();await page.getByRole('button',{name:/03 Space Patrol/}).click();await page.clock.runFor(11000);await page.getByRole('button',{name:'End round & return'}).click();expect((await saved(page)).xp).toBe(20)
})
