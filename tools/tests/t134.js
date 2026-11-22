const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const out = [];
for (const dev of (process.env.DEV ? [process.env.DEV] : ['Pixel 7 landscape', 'iPhone 12 landscape', 'Galaxy S9+ landscape'])) {
const ctx = await b.newContext({ ...devices[dev] }); const pg = await ctx.newPage(); const errs = [];
pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1200);
await pg.evaluate(() => { const me = players[0]; me.build = ['commander']; sbRebuild(me); cmdArm(me); });
await pg.waitForTimeout(500);
const ov = await pg.evaluate(() => { const L = touchLayout(), cs = []; for (const k in L) { if (Array.isArray(L[k])) L[k].forEach(q => cs.push([q.k, q])); else if (L[k].x !== undefined && k !== 'stick') cs.push([k, L[k]]); }
  return ['vt-swap', 'vt-calb'].map(id => { const r = document.getElementById(id).getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2, R = r.width / 2; const hit = cs.filter(([k, q]) => Math.hypot(q.x - x, q.y - y) < q.r + R).map(([k]) => k); return `${id}@${Math.round(x)},${Math.round(y)} r${R} đè:[${hit}]`; }).join(' ') + ` · ${innerWidth}x${innerHeight}`; });
await pg.screenshot({ path: dev.split(' ')[0] + '.png' });
// mở Hiệu Chỉnh rồi vuốt
await pg.evaluate(() => vtBtnCal(players[0])); await pg.waitForTimeout(400);
const box = await pg.evaluate(() => { const bx = document.querySelector('#vt-cal .box'); const r = bx.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.6, sh: bx.scrollHeight, ch: bx.clientHeight }; });
const cdp = await ctx.newCDPSession(pg);
const X = Math.round(box.x); let Y = Math.round(box.y);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X, y: Y }] });
for (let k = 0; k < 12; k++) { Y -= 15; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X, y: Y }] }); await pg.waitForTimeout(16); }
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await pg.waitForTimeout(500);
const top = await pg.evaluate(() => document.querySelector('#vt-cal .box').scrollTop);
await pg.screenshot({ path: dev.split(' ')[0] + '_cal.png' });
out.push(`${dev}: ${ov} · bảng cao ${box.sh}/${box.ch} vuốt → scrollTop ${top} · ${errs.join(';') || 'NO ERRORS'}`); await ctx.close(); }
console.log(out.join('\n')); await b.close(); })();
