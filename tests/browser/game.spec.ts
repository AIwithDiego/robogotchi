import {test,expect} from '@playwright/test'
import type {Page} from '@playwright/test'
import {createRobot} from '../../src/game/engine'
import {HOUR} from '../../src/game/config'
import {KEYS} from '../../src/game/save'
const startTime=new Date('2026-09-14T12:00:00Z')
async function boot(page:Page,name='NOVA'){await page.goto('/');await expect(page.getByRole('button',{name:/Boot my robot/})).toBeEnabled();await page.getByLabel('Every great robot starts with a name.').fill(name);await page.getByRole('button',{name:/Boot my robot/}).click();await expect(page.getByRole('heading',{name})).toBeVisible()}
test.beforeEach(async({page})=>{await page.clock.install({time:startTime})})
test('name, care, persistence and responsive layout',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('/');await expect(page.getByRole('button',{name:/Boot my robot/})).toBeEnabled()
 await page.screenshot({path:`test-results/${info.project.name}-landing.png`,fullPage:true})
 await page.getByRole('button',{name:/Boot my robot/}).click();await expect(page.getByRole('heading',{name:'BEEP',exact:true})).toBeVisible()
 await page.getByRole('button',{name:/^Charge/}).click();await expect(page.getByRole('meter',{name:'battery',exact:true})).toHaveAttribute('aria-valuenow','100')
 await expect(page.getByText('1 care session',{exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'BEEP',exact:true})).toBeVisible();await expect(page.getByRole('meter',{name:'battery',exact:true})).toHaveAttribute('aria-valuenow','100')
 await page.screenshot({path:`test-results/${info.project.name}-care.png`,fullPage:true})
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.setViewportSize({width:720,height:360});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.evaluate(()=>{document.documentElement.style.fontSize='200%'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 expect(errors).toEqual([])
})
test('a custom name, keyboard lesson and arcade care round',async({page})=>{
 await boot(page,'NOVA');await page.clock.fastForward(46000)
 await page.getByRole('button',{name:'A Help them get another.'}).focus();await page.keyboard.press('Enter');await expect(page.getByText('Leaning companion',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:/^Play 3 arcade games/}).click();await page.getByRole('button',{name:/01 Circuit Stack/}).click()
 await page.keyboard.press('ArrowLeft');await page.keyboard.press('Space');await page.clock.runFor(11000)
 await page.getByRole('button',{name:'End round & return'}).click();await page.getByRole('button',{name:'Close dialog'}).click()
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.robot);expect(saved.meters.happiness).toBeGreaterThan(84);expect(saved.arcade.stack.rounds).toBe(1);expect(saved.lastResolvedMinigameId).toBeTruthy()
})
test('refreshing an active arcade round keeps its cost and gives no reward',async({page})=>{
 await boot(page);await page.getByRole('button',{name:/^Play 3 arcade games/}).click();await page.getByRole('button',{name:/01 Circuit Stack/}).click();await expect(page.getByLabel(/Circuit Stack playfield/)).toBeVisible();await page.reload();await expect(page.getByRole('heading',{name:'NOVA',exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(0);const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.robot);expect(saved.meters.battery).toBeLessThanOrEqual(60);expect(saved.meters.happiness).toBeLessThanOrEqual(65);expect(saved.arcade.stack.rounds).toBe(0);expect(saved.xp).toBe(0)
})
for(const [route,choices] of Object.entries({companion:['A Help them get another.','A Ask if they want breakfast.','A Empathy core.'],guardian:['B Secure the sandwich perimeter.','B Explain your capabilities calmly.','B Protection protocols.'],overlord:['C Claim it. Establish dominance.','C Add them to The List.','C Command authority.']})){
 test(`demo evolves into ${route} and preview is isolated`,async({page},info)=>{
  await boot(page);await page.getByRole('button',{name:/^Charge/}).click();const original=await page.evaluate(key=>localStorage.getItem(key),KEYS.robot)
  await page.getByRole('button',{name:'60-second demo',exact:true}).click();await page.clock.fastForward(8500);await page.getByRole('button',{name:choices[0]}).click();await page.clock.fastForward(14000);await page.getByRole('button',{name:choices[1]}).click();await page.clock.fastForward(14000);await page.getByRole('button',{name:choices[2]}).click();await page.clock.fastForward(10000)
  await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('heading',{name:`Meet your ${route}.`,exact:true})).toBeVisible()
  await page.screenshot({path:`test-results/${info.project.name}-${route}.png`,fullPage:true})
  expect(await page.evaluate(key=>localStorage.getItem(key),KEYS.robot)).toBe(original)
  await page.getByRole('dialog').getByRole('button',{name:'Preview neglect',exact:true}).click();await page.getByRole('button',{name:'72 hours unattended',exact:true}).click();await expect(page.getByText('A little light, remembered.')).toBeVisible();await expect(page.getByText(/Death occurred at 2d 14h/)).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),KEYS.robot)).toBe(original)
  await page.getByRole('button',{name:/Back to my demo/}).click();await expect(page.getByText('A little light, remembered.')).toHaveCount(0);await page.getByRole('button',{name:/Exit demo/}).click();await expect(page.getByRole('heading',{name:'NOVA',exact:true})).toBeVisible();const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.robot);expect(saved.stage).toBe('bootling');expect(saved.meters.battery).toBeLessThan(100)
 })
}
test('offline death, one memorial and replay',async({page})=>{
 const s=createRobot('RUSTY',startTime.getTime()-48*HOUR,'dead-qa')
 await page.addInitScript(({key,state})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state))},{key:KEYS.robot,state:s})
 await page.goto('/');await expect(page.getByText('A little light, remembered.')).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'Boot a new robot',exact:true})).toBeEnabled();const c=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.collection);expect(c.memorials).toHaveLength(1);expect(c.memorials[0].ageMs).toBe(44.5*HOUR)
 await page.getByRole('button',{name:'Boot a new robot',exact:true}).click();await expect(page.getByRole('heading',{name:'BEEP',exact:true})).toBeVisible();await page.getByRole('button',{name:/^Memories/}).click();await expect(page.getByText('RUSTY',{exact:true})).toBeVisible()
})
test('emergency repair returns control and records lasting wear',async({page})=>{
 const s=createRobot('RESCUE',startTime.getTime()-34*HOUR,'rescue-qa')
 await page.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:KEYS.robot,state:s})
 await page.goto('/');await expect(page.getByRole('button',{name:'Emergency repair & reboot',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Emergency repair & reboot',exact:true}).click();await expect(page.getByRole('meter',{name:'battery',exact:true})).toHaveAttribute('aria-valuenow','40');await expect(page.getByText('5% wear',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/^Charge/})).toBeEnabled()
})
test('secondary tab cannot mutate and explicit takeover reloads latest state',async({page,context})=>{
 await boot(page);await page.getByRole('button',{name:/^Charge/}).click();const second=await context.newPage();await second.goto('/');await expect(second.getByText(/Your robot is active in another tab/)).toBeVisible();await expect(second.getByRole('button',{name:/^Clean & repair/})).toBeDisabled();await page.close();await second.getByRole('button',{name:'Take over',exact:true}).click();await expect(second.getByRole('button',{name:/^Clean & repair/})).toBeEnabled();await expect(second.getByRole('meter',{name:'battery',exact:true})).toHaveAttribute('aria-valuenow','100')
})
test('corrupt primary is preserved and backup recovery is explicit',async({page})=>{
 const backup=createRobot('BACKUP',startTime.getTime(),'backup-qa')
 await page.addInitScript(({keys,state})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(keys.robot,'broken json');localStorage.setItem(keys.backup,JSON.stringify(state));sessionStorage.setItem('seeded','1')}},{keys:KEYS,state:backup});await page.goto('/');await expect(page.getByText('Your save needs a hand.')).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem(key),KEYS.robot)).toBe('broken json');await page.getByRole('button',{name:'Recover last valid backup'}).click();await expect(page.getByRole('heading',{name:'BACKUP',exact:true})).toBeVisible()
})
test('storage failure stays playable with a visible warning',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError')}})
 await boot(page);await expect(page.getByText(/Saving unavailable. Keep this tab open/)).toBeVisible();await page.getByRole('button',{name:/^Charge/}).click();await expect(page.getByRole('meter',{name:'battery',exact:true})).toHaveAttribute('aria-valuenow','100')
})
test('settings, reduced motion and invalid import work through production controls',async({page})=>{
 await boot(page);await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Reduced motion',{exact:false}).check();await expect(page.locator('.app')).toHaveClass(/reduce-motion/);await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":99}')});await expect(page.getByRole('alert')).toContainText('version');await page.getByRole('button',{name:'Close dialog'}).click();await expect(page.getByRole('button',{name:'Settings',exact:true})).toBeFocused()
})
test('arcade pauses without spending round time and resolves once',async({page})=>{
 await boot(page);await page.getByRole('button',{name:/^Play 3 arcade games/}).click();await page.getByRole('button',{name:/01 Circuit Stack/}).click()
 await page.clock.runFor(2200);await page.getByRole('button',{name:'Pause',exact:true}).click();const time=await page.locator('.arcade-hud').textContent();await page.clock.runFor(10000);expect(await page.locator('.arcade-hud').textContent()).toBe(time)
 await page.getByRole('button',{name:'Resume game',exact:true}).click();await page.clock.runFor(10000);await page.getByRole('button',{name:'End round & return'}).click()
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.robot);expect(saved.arcade.stack.rounds).toBe(1);expect(saved.meters.happiness).toBeGreaterThan(84);await page.getByRole('button',{name:'Close dialog'}).click()
 const again=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),KEYS.robot);expect(again.arcade.stack.rounds).toBe(1)
})
test('valid import reconciles elapsed time and preserves the current run if cancelled',async({page})=>{
 await boot(page);await page.getByRole('button',{name:'Settings',exact:true}).click()
 const imported=createRobot('IMPORTED',startTime.getTime()-HOUR,'imported-qa')
 page.once('dialog',d=>d.dismiss());await page.locator('input[type=file]').setInputFiles({name:'robot.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))})
 await expect(page.getByRole('heading',{name:'NOVA',exact:true})).toBeAttached()
 page.once('dialog',d=>d.accept());await page.locator('input[type=file]').setInputFiles({name:'robot.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))})
 await page.getByRole('button',{name:'Close dialog'}).click();await expect(page.getByRole('heading',{name:'IMPORTED',exact:true})).toBeVisible();await expect(page.getByRole('meter',{name:'battery',exact:true})).toHaveAttribute('aria-valuenow','63')
})
test('conservative fallback stops writers when another tab appears',async({page,context})=>{
 await context.addInitScript(()=>Object.defineProperty(navigator,'locks',{get:()=>undefined}))
 await boot(page);const second=await context.newPage();await second.goto('/');await expect(second.getByText(/Another tab was detected/)).toBeVisible();await expect(page.getByRole('button',{name:/^Charge/})).toBeDisabled();await expect(second.getByRole('button',{name:/^Charge/})).toBeDisabled();await second.close();await page.getByRole('button',{name:'Take over',exact:true}).click();await expect(page.getByRole('button',{name:/^Charge/})).toBeEnabled()
})
test('blocked storage reads still allow play and demo return retains the in-memory robot',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('Blocked','SecurityError')};Storage.prototype.setItem=()=>{throw new DOMException('Blocked','SecurityError')}})
 await boot(page);await page.getByRole('button',{name:/^Charge/}).click();await expect(page.getByRole('meter',{name:'battery',exact:true})).toHaveAttribute('aria-valuenow','100');await page.getByRole('button',{name:'60-second demo',exact:true}).click();await page.clock.fastForward(10000);await page.getByRole('button',{name:/Exit demo/}).click();await expect(page.getByRole('heading',{name:'NOVA',exact:true})).toBeVisible();await expect(page.getByRole('meter',{name:'battery',exact:true})).toHaveAttribute('aria-valuenow','100')
})
