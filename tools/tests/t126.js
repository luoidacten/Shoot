const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
const E = f => pg.evaluate(f);
console.log(await E(async () => { const s = ms => new Promise(r => setTimeout(r, ms)), o = [];
  // Bộ Chỉ Điểm Laser
  let es = R('LASERDES'), me = players[0], w = getCurrentWeapon(me); o.push(`LASERDES lượt ${w.mag}/${w.magSize}`); es[0].x = 1100; es[0].y = 1000; useStrikeWeapon(me, w, { x: 1000, y: 880 }, { x: 1300, y: 880 }); await s(2600); o.push(`laser tăng cường (lệch đường 120 vẫn bám): -${D()} cháy ${es[0].st.burn > 0 || 'hết'} · còn ${w.mag} lượt`);
  // mould Điểm Đánh Dấu: Trang Bị Phụ với pickTarget
  es = R('VANTUONG'); me = players[0]; w = getCurrentWeapon(me); w.mods = ['steel', 'marker']; w.mi = 1; vtSetType(w); es[0].x = 1100; es[0].y = 900;
  o.push(`picker gunMod=${CARDS.gunMod.picker} hightech=${CARDS.hightech.picker}`);
  const g = me.skills.findIndex(q => q.id === 'gunMod'); me.pickTarget = { a: { x: 950, y: 900 }, b: { x: 1250, y: 900 } }; castSkill(me, g, null); me.pickTarget = null; await s(3000); o.push(`ĐĐD Trang Bị Phụ laser A→B: -${D()}`);
  es = R('VANTUONG'); w = getCurrentWeapon(me); w.mods = ['steel', 'marker']; w.mi = 1; vtSetType(w); es[0].x = 1300; es[0].y = 900; const h = me.skills.findIndex(q => q.id === 'hightech'); me.pickTarget = { a: { x: 1300, y: 900 }, b: { x: 1300, y: 900 } }; castSkill(me, h, null); me.pickTarget = null; await s(2200); o.push(`ĐĐD KTC → Tuyệt Diệt Quang: địch hp ${Math.round(es[0].hp)} · gậy còn ${me.inventory.some(q => q.id === 'VANTUONG')}`);
  // nội tại bảng
  R('VANTUONG'); openPicker('skill', 1, 'laser'); await s(200); o.push(`bảng mở ${!!picker} adv sau vẽ ${me.adv}`); picker = null;
  return o.join('\n'); }));
await E(() => { const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 1.0; camera.x = 1150; camera.y = 900; }; R('LASERDES'); const me = players[0]; players[1].x = 1150; players[1].y = 950; useStrikeWeapon(me, getCurrentWeapon(me), { x: 1000, y: 900 }, { x: 1350, y: 900 }); });
await pg.waitForTimeout(1400); await pg.screenshot({ path: 'laser_new.png' });
await E(() => { R('VANTUONG'); const me = players[0], w = getCurrentWeapon(me); w.mods = ['steel', 'marker']; w.mi = 1; vtSetType(w); players[1].x = 1400; me.pickTarget = { a: { x: 1400, y: 900 }, b: { x: 1400, y: 900 } }; HT.VANTUONG[1](me); me.pickTarget = null; });
await pg.waitForTimeout(1000); await pg.screenshot({ path: 'giant_warn.png' }); await pg.waitForTimeout(700); await pg.screenshot({ path: 'giant_fire.png' });
await E(() => { R('LASERDES'); const me = players[0]; me.inventory = [makeWeapon('LASERDES', me), makeWeapon('ORBITAB', me)]; camera.zoom = 3; const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 3.2; camera.x = players[0].x + 20; camera.y = players[0].y; }; });
await pg.waitForTimeout(300); await pg.screenshot({ path: 'art_laserdes.png', clip: { x: 400, y: 200, width: 300, height: 220 } });
await E(() => { players[0].weaponIdx = 1; }); await pg.waitForTimeout(300); await pg.screenshot({ path: 'art_orbitab.png', clip: { x: 400, y: 200, width: 300, height: 220 } });
await E(() => { R('VANTUONG'); openPicker('skill', 1, 'laser'); }); await pg.waitForTimeout(400); await pg.screenshot({ path: 'picker_vt.png' });
console.log(errs.slice(0, 6).join('\n') || 'NO ERRORS'); await b.close(); })();
