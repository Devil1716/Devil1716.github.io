/* 390px One UI shell screenshots + contrast/touch-target audit. */
const { chromium } = require(process.env.PLAYWRIGHT || '@playwright/test');
const BASE = process.env.BASE_URL || 'http://localhost:4173', OUT = process.env.SHOTS || 'shots/oneui';
require('fs').mkdirSync(OUT, { recursive:true });
const AUDIT = () => {
  const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const [r,g,b] = m.slice(0,3).map(v => { v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }); return .2126*r+.7152*g+.0722*b; };
  const bgOf = el => { for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; const a = c.match(/[\d.]+/g); if (a && (a.length < 4 || +a[3] > .9)) return c; } return 'rgb(0,0,0)'; };
  const bad = [], small = [];
  document.querySelectorAll('#mobile-os *').forEach(el => {
    const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]') && !el.closest('.ou-ico') ) {}
    if (el.closest('.ou-win:not(.on), .ou-drawer:not(.on), .ou-qp:not(.on), .ou-recents:not(.on)')) return;
    if (el.closest('[inert]')) return;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (own && +cs.opacity > .5) { const fg = lum(cs.color), bg = lum(bgOf(el)); const ratio = (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05); const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.6 && +cs.fontWeight >= 700); if (ratio < (big?3:4.5)) bad.push(`${el.textContent.trim().slice(0,30)} ${ratio.toFixed(2)}`); }
    if ((el.matches('button, a, input, [role=button]')) && !el.closest('.sb-body p, .sb-body li') && (r.height < 47.5 || r.width < 47.5) && !el.matches('.ou-search input')) small.push(`${(el.getAttribute('aria-label')||el.textContent).trim().slice(0,24)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  });
  return { bad:[...new Set(bad)].slice(0,8), small:[...new Set(small)].slice(0,8) };
};
(async () => {
  const b = await chromium.launch(); let issues = 0;
  for (const theme of ['light','dark']) {
    const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2, colorScheme:theme });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(t => localStorage.setItem('sable.theme', t), theme);
    await p.goto(BASE + '/?mode=home'); await p.waitForSelector('#mobile-os.on .ou-home'); await p.waitForTimeout(600);
    const shot = async (n) => { await p.waitForTimeout(650); await p.screenshot({ path:`${OUT}/${theme}-${n}.png` }); const a = await p.evaluate(AUDIT); if (a.bad.length || a.small.length) { issues++; console.log(theme, n, JSON.stringify(a)); } };
    await shot('01-home');
    await p.evaluate(() => { const g = document.querySelector('.ou-pages'); g.scrollTo({ left:g.clientWidth }); }); await shot('02-home-page2');
    await p.evaluate(() => document.querySelector('.ou-pages').scrollTo({ left:0 }));
    await p.evaluate(() => MobileOS.openQP()); await shot('03-quick-panel');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.evaluate(() => MobileOS.openDrawer()); await shot('04-app-drawer');
    await p.keyboard.type('pro'); await shot('05-drawer-search');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    for (const [i, id] of ['projects','skills','about','oss','contact','settings'].entries()) {
      await p.locator(`#mobile-os .ou-home [data-app="${id}"]`).first().click().catch(async () => { await p.evaluate(x => MobileOS.openApp(x), id); });
      await shot(`${String(6+i*2).padStart(2,'0')}-${id}`);
      await p.evaluate(() => document.querySelector('.ou-scroll').scrollTo({ top:260 })); await shot(`${String(7+i*2).padStart(2,'0')}-${id}-collapsed`);
      if (id === 'projects') { await p.evaluate(() => document.querySelector('.ou-scroll').scrollTo({ top:0 })); await p.locator('#mobile-os .ou-win [data-sub]').nth(1).click(); await shot('07b-project-detail'); await p.keyboard.press('Escape'); await p.waitForTimeout(300); }
      await p.keyboard.press('Escape'); await p.waitForTimeout(350);
    }
    await p.locator('#mobile-os .ou-ask').click(); await p.waitForSelector('#mobile-os .ou-win.on .sb-welcome'); await shot('20-sable-empty');
    await p.locator('#mobile-os .sb-chip').nth(1).click(); await p.waitForSelector('#mobile-os .sb-msg.bot .sb-meta', { timeout:15000 }); await shot('21-sable-answer');
    await p.route('**/api/chat', r => r.fulfill({ status:429, contentType:'application/json', body:'{"error":"Too many questions. Try again in 60s."}' }));
    await p.locator('#mobile-os textarea').fill('What are my skills?'); await p.keyboard.press('Enter'); await p.waitForSelector('#mobile-os .sb-error'); await shot('22-sable-error');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.evaluate(() => MobileOS.openRecents()); await shot('23-recents');
    if (errs.length) { issues++; console.log('page errors', errs); }
    await ctx.close();
  }
  await b.close(); console.log(issues ? `${issues} screens with issues` : 'audit clean'); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
