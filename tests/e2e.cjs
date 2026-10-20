/* Main-journey check + screenshots. Needs Playwright: PLAYWRIGHT=path/to/@playwright/test node tests/e2e.cjs
   Server must be running (BASE_URL, default http://localhost:4173). */
const { chromium } = require(process.env.PLAYWRIGHT || '@playwright/test');
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = process.env.SHOTS || 'shots';
const fs = require('fs'); fs.mkdirSync(OUT, { recursive: true });
const VP = { phone:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2}, tablet:{width:820,height:1180,isMobile:true,hasTouch:true}, desktop:{width:1440,height:900} };
const fails = []; const ok = (c, m) => { console.log((c?'PASS ':'FAIL ')+m); if(!c) fails.push(m); };

(async () => {
  const browser = await chromium.launch();
  for (const theme of ['dark','light']) {
    for (const [name, vp] of Object.entries(VP)) {
      const ctx = await browser.newContext({ viewport:{width:vp.width,height:vp.height}, isMobile:!!vp.isMobile, hasTouch:!!vp.hasTouch, deviceScaleFactor:vp.deviceScaleFactor||1, colorScheme:theme });
      const page = await ctx.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(BASE + (name==='desktop' ? '/' : '/?mode=home'), { waitUntil:'domcontentloaded' });
      const tag = `${name}-${theme}`;
      if (name === 'desktop') {
        await page.waitForSelector('#chat-home.on .sb-welcome');
        await page.waitForSelector('.sb-mode:not(:has-text("Checking"))');
        await page.waitForTimeout(700); await page.screenshot({ path:`${OUT}/${tag}-1-welcome-empty.png` });
        ok(await page.locator('#chat-home .sb-chip').count() === 6, `${tag}: 6 suggested prompts`);
        await page.route('**/api/chat', r => setTimeout(() => r.continue().catch(()=>{}), 1500));
        await page.locator('#chat-home .sb-chip').first().click();
        await page.waitForSelector('#chat-home .sb-typing');
        await page.screenshot({ path:`${OUT}/${tag}-2-loading.png` });
        await page.waitForSelector('#chat-home .sb-msg.bot .sb-meta', { timeout:15000 });
        await page.locator('#chat-home textarea').fill('Tell me about the bluetooth mesh project');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelectorAll('#chat-home .sb-msg.bot .sb-meta').length === 2, null, { timeout:15000 });
        await page.waitForTimeout(500); await page.screenshot({ path:`${OUT}/${tag}-3-success.png` });
        ok(await page.locator('#chat-home .sb-hist .sb-btn').count() >= 1, `${tag}: conversation saved to history`);
        await page.unroute('**/api/chat');
        await page.route('**/api/chat', r => r.fulfill({ status:429, contentType:'application/json', body:JSON.stringify({ error:'Too many questions. Try again in 60s.' }) }));
        await page.locator('#chat-home textarea').fill('What are my skills?'); await page.keyboard.press('Enter');
        await page.waitForSelector('#chat-home .sb-error');
        await page.waitForTimeout(500); await page.screenshot({ path:`${OUT}/${tag}-4-error.png` });
        ok(true, `${tag}: error state with retry`);
        await page.unroute('**/api/chat');
        // Enter the desktop OS and open Sable as a window
        await page.locator('#chat-home [data-nav="os"]').click();
        await page.waitForSelector('#desktop.on', { timeout:20000 });
        await page.waitForTimeout(800);
        await page.keyboard.press('Alt+a');
        await page.waitForSelector('.win .sb', { timeout:5000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path:`${OUT}/${tag}-5-desktop-os-sable-window.png` });
        ok(true, `${tag}: desktop OS opens Sable window (Alt+A)`);
        // Back to chat via the mode pill
        await page.locator('#mode-pill [data-mode="chat"]').click();
        await page.waitForSelector('#chat-home.on', { timeout:5000 });
        ok(true, `${tag}: return to chat from OS`);
        // Resize to phone width without reload -> mobile shell
        await page.setViewportSize({ width:390, height:844 });
        await page.waitForSelector('#mobile-os.on', { timeout:5000 });
        ok(true, `${tag}: resize to phone switches to mobile OS without reload`);
        await page.setViewportSize({ width:1440, height:900 });
        await page.waitForSelector('#chat-home.on', { timeout:5000 });
        ok(true, `${tag}: resize back restores the chat`);
      } else {
        await page.waitForSelector('#mobile-os.on .ou-home');
        await page.waitForTimeout(300);
        await page.screenshot({ path:`${OUT}/${tag}-1-home.png` });
        await page.locator('#mobile-os .ou-home .ou-app[data-app="projects"]').click();
        await page.waitForSelector('#mobile-os .ou-win.on .ou-row');
        await page.waitForTimeout(400);
        await page.screenshot({ path:`${OUT}/${tag}-2-projects-app.png` });
        await page.locator('#mobile-os [data-back]').click();
        await page.waitForTimeout(400);
        ok(!(await page.locator('#mobile-os .ou-win.on').count()), `${tag}: back closes the app`);
        // swipe up opens the app drawer
        await page.evaluate(() => { const el=document.querySelector('#mobile-os'); const t=(type,y)=>el.dispatchEvent(new TouchEvent(type,{bubbles:true,touches:type==='touchend'?[]:[new Touch({identifier:1,target:el,clientX:200,clientY:y})],changedTouches:[new Touch({identifier:1,target:el,clientX:200,clientY:y})]})); t('touchstart',500); t('touchend',280); });
        await page.waitForTimeout(450);
        ok(await page.locator('#mobile-os .ou-drawer.on').count() === 1, `${tag}: swipe up opens app drawer`);
        await page.screenshot({ path:`${OUT}/${tag}-3-app-drawer.png` });
        await page.keyboard.press('Escape'); await page.waitForTimeout(400);
        await page.locator('#mobile-os .ou-ask').click();
        await page.waitForSelector('#mobile-os .ou-win.on .sb-welcome');
        await page.waitForTimeout(400);
        await page.waitForTimeout(400); await page.screenshot({ path:`${OUT}/${tag}-4-assistant-empty.png` });
        await page.locator('#mobile-os .sb-chip').nth(1).click();
        await page.waitForSelector('#mobile-os .sb-msg.bot .sb-meta', { timeout:15000 });
        await page.waitForTimeout(300);
        await page.screenshot({ path:`${OUT}/${tag}-5-assistant-answer.png` });
        ok(true, `${tag}: assistant answers on mobile`);
        const small = await page.evaluate(() => [...document.querySelectorAll('#mobile-os .ou-win.on button, #mobile-os .ou-home button')].filter(b=>{const r=b.getBoundingClientRect(); return !b.closest("[inert]") && r.width>0 && (r.height<47.5||r.width<47.5);}).map(b=>b.getAttribute('aria-label')||b.textContent.trim()).slice(0,5));
        ok(small.length===0, `${tag}: touch targets >= 48px ${small.join('|')}`);
      }
      ok(errors.length===0, `${tag}: no page errors ${errors.join(' | ')}`);
      await ctx.close();
    }
  }
  await browser.close();
  console.log(fails.length ? `\n${fails.length} failed` : '\nall passed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
