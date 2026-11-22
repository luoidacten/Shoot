const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
const out = []; const E = f => pg.evaluate(f);
out.push('RAYGUN: ' + await E(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('ENERGY'), me = players[0]; es[0].x = 1100; gunModCast(me); await s(2500); const a = `drone ${RG.length} · -${D()} · tầm nhìn drone ${visionSources(me).filter(v => v.kind === 'drone').length}`;
  R('ENERGY'); RG.length = 0; es[0].x = 1300; es[0].y = 905; HT.ENERGY[1](me); await s(300); return a + ` · KTC: lộ ${isSpotted(es[0], me.id)} drone do thám ${RG.filter(d => d.scout).length}`; }));
out.push('KÉO: ' + await E(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('SCISSORS'), me = players[0], w = getCurrentWeapon(me); const r = []; for (let i = 0; i < 3; i++) { me.cooldown = 0; const h = es[0].hp; es[0].x = me.x + 60; fireWeapon(me, w, 0, 0, es[0]); await s(30); r.push(Math.round(h - es[0].hp)); }
  R('SCISSORS'); es[0].x = 1040; es[0].armor = 0.8; me.cooldown = 0; fireWeapon(me, w, 0, 1, es[0]); await s(200); const st = SC.map(f => f.kind).join(','); await s(800); const a = ` · ném: ${st} -${D()}`; await s(1000);
  R('SCISSORS'); SC.length = 0; es[0].x = 1150; const i = me.skills.findIndex(s => s.id === 'hightech'); me.skDownAt[i] = world.time - 2.1; HT.SCISSORS[1](me); await s(900); const b2 = ` · KTC 2s: -${D()} khóa ném ${me.scLock > world.time}`;
  R('SCISSORS'); SC.length = 0; me.scLock = 0; meleeTechCast(me); await s(400); return 'combo ' + r.join('/') + a + b2 + ` · Bậc Thầy: lùi x ${Math.round(me.x)} ném kế ${me.scNextThrow}`; }));
out.push('MA ĐAO: ' + await E(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('MADAO'), me = players[0], w = getCurrentWeapon(me); MDS.length = 0; es[0].armor = 0.8; const r = []; for (let i = 0; i < 4; i++) { me.cooldown = 0; const h = es[0].hp; es[0].x = me.x + 70; es[0].y = me.y; fireWeapon(me, w, 0, 0, es[0]); await s(220); r.push(Math.round(h - es[0].hp)); }
  const a = `combo ${r.join('/')} · mảnh ${MDS.length}`; me.cooldown = 0; fireWeapon(me, w, 0, 1, es[0]); await s(500); const b2 = ` · thu: ${Math.round(me.mdGauge)}% boost ${me.mdBoost}`;
  me.mdGauge = 100; me.cooldown = 0; es[0].x = me.x + 120; es[0].hp = 5000; fireWeapon(me, w, 0, 1, es[0]); await s(4500); const c2 = ` · VẠN NHẬN: -${D()} trận ${!!me.mdField}`;
  R('MADAO'); HT.MADAO[1](me); await s(300); const d2 = ` · Ma Đao Bộ: lốc ${me.mdTornadoT > world.time} mdEmp ${me.mdEmp}`; castSkill(me, me.skills.findIndex(s => s.id === 'hightech'), { x: 1, y: 0 }); await s(300);
  R('MADAO'); for (let i = 0; i < 8; i++) mdDrop(me, me.x + 50, me.y, 1); es[0].x = me.x + 150; meleeTechCast(me); await s(500); const e2 = ` · Bậc Thầy: -${D()} trói ${es[0].st.root > 0}`;
  R('MADAO'); for (let i = 0; i < 10; i++) mdDrop(me, me.x - 100, me.y + 60, 1); es[0].x = me.x + 300; me.angle = 0; mdExclusive(me); await s(1000); return a + b2 + c2 + d2 + e2 + ` · Độc quyền: -${D()} nút ${$('md-ex').style.display}`; }));
console.log(out.join('\n'));
await E(() => { const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 1.3; camera.x = players[0].x + 60; camera.y = players[0].y; }; R('MADAO'); for (let i = 0; i < 10; i++) mdDrop(players[0], 900, 900, 1, players[1].id); players[0].mdGauge = 60; HT.MADAO[1](players[0]); });
await pg.waitForTimeout(500); await pg.screenshot({ path: 'r2_md.png' });
await E(() => { R('SCISSORS'); SC.length = 0; players[1].x = 1050; fireWeapon(players[0], getCurrentWeapon(players[0]), 0, 1, null); }); await pg.waitForTimeout(450); await pg.screenshot({ path: 'r2_sc.png' });
await E(() => { R('ENERGY'); players[1].x = 1000; gunModCast(players[0]); }); await pg.waitForTimeout(1500); await pg.screenshot({ path: 'r2_rg.png' });
console.log(errs.slice(0, 6).join('\n') || 'NO ERRORS'); await b.close(); })();
