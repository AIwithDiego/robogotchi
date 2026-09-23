import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { advanceTo, createRobot } from '../../src/game/engine'
import { HOUR } from '../../src/game/config'
import { collect, emptyCollection, KEYS, memoryOf } from '../../src/game/save'
const time=new Date('2026-09-15T10:00:00Z')
async function seed(page:Page,broken=false){
 const robot=createRobot('ORIGINAL',time.getTime(),'original-run');robot.lifeLessons=[{lessonId:'rain',answer:0}];robot.arcade.stack={best:700,rounds:5};robot.activities.coffee=2;robot.xp=20;robot.careSessions=1;robot.appearance={colour:'lilac',shape:'round',accessory:'bow',decoration:'trophy'}
 let album=collect(emptyCollection(),advanceTo(createRobot('REMEMBERED',time.getTime()-60*HOUR,'past-run'),time.getTime()).state)
 album={...album,discoveries:['guardian'],memories:[...album.memories,memoryOf(robot,'keepsake','A keeper')]}
 await page.addInitScript(({keys,robot,album,broken})=>{if(!sessionStorage.getItem('seeded-restart')){
  localStorage.setItem(keys.robot,broken?'broken':JSON.stringify(robot));localStorage.setItem(keys.backup,JSON.stringify(robot));localStorage.setItem(keys.collection,broken?'broken':JSON.stringify(album));localStorage.setItem(keys.settings,JSON.stringify({sound:false,reducedMotion:true}));localStorage.setItem('unrelated','keep');sessionStorage.setItem('seeded-restart','1')
 }},{keys:KEYS,robot,album,broken})
 await page.goto('/');await expect(page.getByRole('heading',{name:broken?'Your save needs a hand.':'ORIGINAL',exact:true})).toBeVisible()
}
const read=(page:Page)=>page.evaluate(keys=>({robot:JSON.parse(localStorage.getItem(keys.robot)||'null'),backup:localStorage.getItem(keys.backup),album:JSON.parse(localStorage.getItem(keys.collection)||'null'),settings:localStorage.getItem(keys.settings),unrelated:localStorage.getItem('unrelated')}),KEYS)
async function openErase(page:Page){await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Start from scratch',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('This cannot be undone')}
test.beforeEach(async({page})=>{await page.clock.install({time})})

test('start from scratch cancels safely, then clears every run and album before renaming',async({page})=>{
 await seed(page);const before=await read(page);await openErase(page)
 await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await read(page)).toEqual(before)
 await openErase(page);await page.getByRole('button',{name:'Delete progress & start fresh'}).click()
 const name=page.getByLabel('Every great robot starts with a name.');await expect(name).toBeVisible();await expect(name).toHaveValue('');await expect(name).toBeFocused()
 expect(await read(page)).toEqual({robot:null,backup:null,album:null,settings:before.settings,unrelated:'keep'})
 await page.clock.runFor(7000);await page.reload();expect((await read(page)).robot).toBeNull();expect((await read(page)).album).toBeNull()
 await page.getByRole('button',{name:/Try the 60-second demo/}).click();await page.clock.runFor(2000);await page.getByRole('button',{name:/Exit demo/}).click();await expect(name).toBeVisible();expect((await read(page)).robot).toBeNull()
 await name.fill('NOVA');await page.getByRole('button',{name:'Sky',exact:true}).click();await page.getByRole('button',{name:'Boxy',exact:true}).click();await page.getByRole('button',{name:/Boot my robot/}).click();await page.reload()
 const fresh=await read(page);expect(fresh.robot.runId).not.toBe('original-run');expect(fresh.robot.name).toBe('NOVA');expect(fresh.robot.appearance).toEqual({colour:'sky',shape:'boxy',accessory:'none',decoration:'none'});expect(fresh.robot.xp).toBe(0);expect(fresh.robot.lifeLessons).toEqual([]);expect(fresh.robot.arcade.stack).toEqual({best:0,rounds:0});expect(fresh.robot.activities.coffee).toBe(0);expect(fresh.album.discoveries).toEqual([]);expect(fresh.album.memorials).toEqual([]);expect(fresh.album.memories).toHaveLength(1);expect(fresh.album.memories[0].runId).toBe(fresh.robot.runId)
})
test('raise another robot lets you name and style it while keeping the existing album',async({page})=>{
 await seed(page);const before=await read(page);await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Raise another robot',exact:true}).click()
 await page.getByLabel('Your new robot’s name').fill('  PIXEL  ');await page.getByRole('button',{name:'Rose',exact:true}).click();expect((await read(page)).robot.runId).toBe('original-run')
 await page.getByRole('button',{name:'Boot new robot',exact:true}).click();await page.reload();await expect(page.getByRole('heading',{name:'PIXEL',exact:true})).toBeVisible()
 const after=await read(page);expect(after.robot.appearance.colour).toBe('rose');expect(after.robot.lifeLessons).toEqual([]);expect(after.robot.arcade.stack.rounds).toBe(0);expect(after.album.memories).toEqual(expect.arrayContaining(before.album.memories));expect(after.album.discoveries).toEqual(before.album.discoveries);expect(after.album.memorials).toEqual(before.album.memorials)
})
test('start from scratch also clears a corrupt primary and corrupt album',async({page})=>{
 await seed(page,true);await page.getByRole('button',{name:'Start from scratch',exact:true}).click();await page.getByRole('button',{name:'Delete progress & start fresh'}).click();await expect(page.getByLabel('Every great robot starts with a name.')).toBeVisible();expect((await read(page)).backup).toBeNull()
 await page.getByLabel('Every great robot starts with a name.').fill('RECOVERED');await page.getByRole('button',{name:/Boot my robot/}).click();await page.reload();await expect(page.getByRole('heading',{name:'RECOVERED',exact:true})).toBeVisible();expect((await read(page)).album.memories).toHaveLength(1)
})
test('a failed erase keeps the current run and shows an actionable error',async({page})=>{
 await seed(page);const before=await read(page);await page.evaluate(blocked=>{const remove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(key){if(key===blocked)throw new DOMException('Blocked','SecurityError');return remove.call(this,key)}},KEYS.collection)
 await openErase(page);await page.getByRole('button',{name:'Delete progress & start fresh'}).click();await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Could not finish clearing progress');expect(await read(page)).toEqual(before)
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('heading',{name:'ORIGINAL',exact:true})).toBeVisible()
})
test('the demo cannot erase real progress and can restart with its own name',async({page})=>{
 await seed(page);const before=await read(page);await page.getByRole('button',{name:'60-second demo',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();await expect(page.getByRole('button',{name:'Start from scratch',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Restart demo',exact:true}).click()
 await page.getByLabel('Your new robot’s name').fill('DEMO');await page.getByRole('button',{name:'Boot new demo',exact:true}).click();await expect(page.getByRole('heading',{name:'DEMO',exact:true})).toBeVisible();expect(await read(page)).toEqual(before)
 await page.getByRole('button',{name:/Exit demo/}).click();await expect(page.getByRole('heading',{name:'ORIGINAL',exact:true})).toBeVisible();expect((await read(page)).robot.runId).toBe('original-run')
})
test('a second tab cannot erase progress and follows the owner back to the welcome screen',async({page,context})=>{
 await seed(page);const second=await context.newPage();await second.goto('/');await expect(second.getByText(/Your robot is active in another tab/)).toBeVisible();await second.getByRole('button',{name:'Settings',exact:true}).click();await expect(second.getByRole('button',{name:'Start from scratch',exact:true})).toBeDisabled();await second.getByRole('button',{name:'Close dialog'}).click()
 await openErase(page);await page.getByRole('button',{name:'Delete progress & start fresh'}).click();await expect(second.getByLabel('Every great robot starts with a name.')).toBeVisible();expect((await read(second)).album).toBeNull()
 await page.close();await second.getByRole('button',{name:'Take over',exact:true}).click();await expect(second.getByRole('button',{name:/Boot my robot/})).toBeEnabled();expect((await read(second)).robot).toBeNull()
})
