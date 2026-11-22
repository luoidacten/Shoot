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
  // Chỉ Huy: 3 skill
  let me = players[0]; me.build = ['commander']; applyBuild(me); o.push(`CHỈ HUY skills: ${me.skills.map(q => q.id).join(', ')}`);
  let w = getCurrentWeapon(me); w.mods = ['steel', 'beam']; w.mi = 1; vtSetType(w); const es = players[1]; es.x = me.x + 400; es.y = me.y; es.hp = 5000; es.st = freshStatus();
  const oc = me.skills.findIndex(q => q.id === 'overclock'); castSkill(me, oc, { x: 1, y: 0 }); await s(1600); o.push(`Ép Xung (mould Tia Lazer) → Laser Tuyệt Diệt: -${Math.round(5000 - es.hp)}`);
  w.mi = 0; vtSetType(w); me.skills[oc].cd = 0; castSkill(me, oc, null); o.push(`Ép Xung (Thép Đặc) → Quy Nhất ${me.vtFuse > world.time}`);
  const h = me.skills.findIndex(q => q.id === 'hightech'); me.skills[h].cd = 0; const c0 = vtCur(w); castSkill(me, h, null); o.push(`KTC đổi mould ${c0} → ${vtCur(w)}`);
  await s(100); o.push(`nút 🔄 ${$('vt-swap').style.display} · nút 🎛️ ${$('vt-calb').style.display}`);
  vtBtnCal(me); o.push(`Hiệu Chỉnh từ nút: bảng ${$('vt-cal').style.display} · hồi ${Math.ceil(me.calCd)}s`); vtCalClose();
  const c1 = vtCur(w); me.vtBtnT = 0; vtBtnSwap(me); o.push(`nút 🔄: ${c1} → ${vtCur(w)}`);
  // Tuyệt Diệt Quang (gậy thường)
  me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me); R('VANTUONG'); me = players[0]; w = getCurrentWeapon(me); w.mods = ['steel', 'marker']; w.mi = 1; vtSetType(w);
  es.x = 1300; es.y = 950; es.hp = 5000; const k = me.skills.findIndex(q => q.id === 'hightech'); me.pickTarget = { a: { x: 1300, y: 900 }, b: { x: 1300, y: 900 } }; castSkill(me, k, null); me.pickTarget = null; await s(300);
  o.push(`Tuyệt Diệt: bị lộ ${!!(me.st.spot && me.st.spot[es.id] > world.time)} · cột sáng ${zones.some(z => z.type === 'selfBeacon')}`); await s(1800); o.push(`→ địch hp ${Math.round(es.hp)} · gậy còn ${me.inventory.some(q => q.id === 'VANTUONG')}`);
  // Bộ định vị vệ tinh
  R('ORBITAB'); orbitalStrike(players[0], 1100, 900); o.push(`ORBITAB vùng ${zones.filter(z => z.type === 'orbitalWarn2').length}`);
  return o.join('\n'); }));
await E(() => { const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 0.9; camera.x = 1100; camera.y = 900; }; });
await pg.waitForTimeout(800); await pg.screenshot({ path: 'orb_warn.png' }); await pg.waitForTimeout(1400); await pg.screenshot({ path: 'orb_beam.png' });
await E(() => { R('VANTUONG'); const me = players[0], w = getCurrentWeapon(me); w.mods = ['steel', 'marker']; w.mi = 1; vtSetType(w); me.pickTarget = { a: { x: 1250, y: 900 }, b: { x: 1250, y: 900 } }; HT.VANTUONG[1](me); me.pickTarget = null; });
await pg.waitForTimeout(900); await pg.screenshot({ path: 'td_warn.png' });
await E(() => { R('ORBITAB'); const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 3.2; camera.x = players[0].x + 20; camera.y = players[0].y - 10; }; });
await pg.waitForTimeout(400); await pg.screenshot({ path: 'art_orb.png', clip: { x: 380, y: 160, width: 340, height: 260 } });
console.log(errs.slice(0, 6).join('\n') || 'NO ERRORS'); await b.close(); })();
