const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
const E = f => pg.evaluate(f);
const res = await E(async () => {
  const s = ms => new Promise(r => setTimeout(r, ms)), out = [];
  for (let fi = 0; fi < 7; fi++) {
    const row = [];
    for (const k of ['E', 'M', 'G', 'H']) {
      const es = R('MULTICUBE'), me = players[0], w = getCurrentWeapon(me); es[0].x = 960; es[0].y = 900; es[1].x = 3000;
      me.cubeEntryT = 0; w.form = fi; const F = cubeForm(w); w.type = F.type; w.range = F.range; w.cubeAmmo = CUBE_AMMO[F.id];
      if (k === "E") { me.cubeEntryT = 0; me._cubeExact = true; cubeSetForm(me, w, fi); me._cubeExact = false; }
      else { const slot = me.skills.findIndex(q => q.id === { M: 'meleeTech', G: 'gunMod', H: 'hightech' }[k]); castSkill(me, slot, { x: 0.5, y: 0 }); }
      await s(1500); row.push(`${k}:${D()}`);
    }
    // đánh thường
    const es = R('MULTICUBE'), me = players[0], w = getCurrentWeapon(me); es[0].x = 960; w.form = fi; const F = cubeForm(w); w.type = F.type; w.cubeAmmo = CUBE_AMMO[F.id]; me.cooldown = 0; fireWeapon(me, w, 0, 0, es[0]); await s(900); row.push(`đánh:${D()}`);
    out.push(`${F.icon} ${F.name.padEnd(8)} ${row.join(' ')}`);
  }
  // hết đạn tự chuyển
  const es = R('MULTICUBE'), me = players[0], w = getCurrentWeapon(me); me._cubeExact = true; cubeSetForm(me, w, 3); me._cubeExact = false; const seq = [];
  for (let i = 0; i < 5; i++) { me.cooldown = 0; fireWeapon(me, w, 0, 0, es[0]); seq.push(cubeForm(w).id + ':' + w.cubeAmmo + ' ' + ammoText(w)); await s(450); }
  out.push('bắn tỉa hết đạn: ' + seq.join(' → ') + ' → giờ ' + cubeForm(w).name);
  return out;
});
console.log(res.join('\n'));
await E(() => { const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 1.4; camera.x = players[0].x + 100; camera.y = players[0].y; }; });
const shots = [[3, 'H', 450], [4, 'G', 300], [1, 'H', 750], [5, 'G', 250], [6, 'H', 900], [0, 'M', 300]]; let k = 0;
for (const [fi, sk, wt] of shots) { await pg.evaluate(([fi, sk]) => { const es = R('MULTICUBE'), me = players[0], w = getCurrentWeapon(me); es[0].x = 1050; w.form = fi; const F = cubeForm(w); w.type = F.type; const slot = me.skills.findIndex(q => q.id === { M: 'meleeTech', G: 'gunMod', H: 'hightech' }[sk]); castSkill(me, slot, { x: 0.6, y: 0 }); }, [fi, sk]); await pg.waitForTimeout(wt); await pg.screenshot({ path: 'cube_' + (k++) + '.png', clip: { x: 250, y: 60, width: 640, height: 500 } }); }
console.log(errs.slice(0, 6).join('\n') || 'NO ERRORS'); await b.close(); })();
