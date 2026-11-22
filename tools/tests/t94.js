const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.click('#bg-btn');
for (let i = 0; i < 60; i++) { await pg.waitForTimeout(500); if (await pg.evaluate(() => gameState) === 'PLAYING') break; await pg.evaluate(() => { const b = document.querySelector('.aug-card'); if (b) b.click(); }); }
const out = [];
out.push(await pg.evaluate(async () => { const me = players[0], e = players[1]; e.x = me.x + 60; e.y = me.y; const b0 = e.build.length; e.spawnShield = 0; me.spawnShield = 0; dealDamage(me, 99999, e.id, {}); await new Promise(r => setTimeout(r, 300)); return `người chơi chết: state ${gameState} hạng #${me.bgPlace} · kẻ hạ nhận thẻ: ${e.build.length - b0} · e.hp ${Math.round(e.hp)}/${e.maxHp}`; }));
await pg.waitForTimeout(1500);
out.push(await pg.evaluate(() => `vẫn chơi tiếp: ${gameState} · camera theo ${players.find(q => q.hp > 0 && Math.abs(q.x - camera.x) < 400) ? 'người còn sống' : '?'}`));
await pg.evaluate(() => { players.slice(1).forEach((p, i) => { if (i > 0) { p.spawnShield = 0; p.st.invuln = 0; p.air = 0; p.travel = null; p.reaperPass = 0; dealDamage(p, 99999, players[1].id, {}); if (p.hp > 0) killPlayer(p, players[1].id); } }); });
for (let i = 0; i < 12; i++) { await pg.waitForTimeout(500); if (await pg.evaluate(() => gameState) === 'GAMEOVER') break; }
out.push(await pg.evaluate(() => `kết thúc: ${gameState} · tiêu đề "${$('go-title').textContent}" · "${$('go-score').textContent}"`));
await pg.click('#rematch-btn'); await pg.waitForTimeout(800);
out.push(await pg.evaluate(() => `tái đấu: ${gameState} người ${players.length} BG ${BG.on}`));
await pg.evaluate(() => goMenu()); await pg.waitForTimeout(300);
out.push(await pg.evaluate(() => `về menu: BG ${BG.on} maxWins ${settings.maxWins} mode ${settings.mode}`));
console.log(out.join('\n')); console.log(errs.slice(0, 6).join('\n') || 'NO ERRORS'); await b.close(); })();
