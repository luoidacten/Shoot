const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
console.log(await pg.evaluate(() => { const p = players[0]; resetPlayerForRound(p); return `máu sau reset hiệp: ${p.hp}/${p.maxHp}`; }));
// so sánh: bật/tắt nerf cho cùng 1 đòn
console.log(await pg.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const out = [];
  for (const id of ['MADAO', 'DARTS', 'SHOTGUN', 'RAILGUN', 'URUMI', 'TESLA', 'PISTOL', 'KATANA', 'MUSKET']) {
    const res = [];
    for (const on of [false, true]) {
      const saved = EASY_NERF_R14[id]; if (!on) delete EASY_NERF_R14[id];
      const es = R(id), me = players[0], w = getCurrentWeapon(me); es[0].x = me.x + (id === 'KATANA' || id === 'URUMI' ? 70 : 160); me.cooldown = 0;
      if (id === 'TESLA') { for (let k = 0; k < 30; k++) { me.cooldown = 0; fireWeapon(me, w, 0, 0, es[0]); await s(16); } } else fireWeapon(me, w, 0, id === 'MUSKET' ? 1 : 0, es[0]);
      await s(700); res.push(D()); if (saved) EASY_NERF_R14[id] = saved;
    }
    out.push(`${id}: ${res[0]} → ${res[1]}${res[0] ? ' (×' + (res[1] / res[0]).toFixed(2) + ')' : ''}`);
  } return out.join('\n'); }));
console.log(errs.join('\n') || 'NO ERRORS'); await b.close(); })();
