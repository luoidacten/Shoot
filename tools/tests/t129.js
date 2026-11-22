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
  let me = players[0]; me.adv = 'stealth'; R('PISTOL'); me = players[0];
  for (const k of ['vtMark', 'arty', 'orbital']) { openPicker('skill', 0, k); const V = bgWin(); o.push(`${k}: cấp ${picker.lv} · cửa sổ ${V ? V.w + '×' + V.h : 'toàn map'}`); picker = null; }
  me.adv = 'minimap'; openPicker('skill', 0, 'vtMark'); o.push(`có Bản Đồ Nhỏ: vtMark cấp ${picker.lv}`); picker = null; me.adv = 'stealth';
  R('VANTUONG'); openPicker('skill', 0, 'arty'); o.push(`cầm Vạn Tượng: arty cấp ${picker.lv}`); const pt = pickerPoint(SCREEN_W / 2, SCREEN_H / 2); o.push(`chạm giữa bảng → ${pt && Math.round(pt.x)},${pt && Math.round(pt.y)} (bạn ${Math.round(me.x)},${Math.round(me.y)})`); picker = null;
  const w = getCurrentWeapon(me);
  // đổi mould hồi 1s
  me.vtSwapCd = 0; const a = vtCur(w); vtSwap(me, w); const b = vtCur(w); vtSwap(me, w); const c = vtCur(w); await s(1100); vtSwap(me, w); o.push(`đổi mould: ${a}→${b}, bấm lại ngay: ${c} (bị chặn) , sau 1.1s: ${vtCur(w)}`);
  // Tuyệt Diệt Quang đứng yên
  me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me); R('VANTUONG'); me = players[0]; const w2 = getCurrentWeapon(me); w2.mods = ['steel', 'marker']; w2.mi = 1; vtSetType(w2); me.pickTarget = { a: { x: 1400, y: 900 }, b: { x: 1400, y: 900 } }; vtGiant(me); me.pickTarget = null; await s(2000); o.push(`Tuyệt Diệt: sau 2s vẫn đứng yên ${me.st.root > 0}`);
  return o.join('\n'); }));
await E(() => { R('VANTUONG'); picker = null; openPicker('weapon', 0, 'vtMark'); });
await pg.waitForTimeout(400); await pg.screenshot({ path: 'tac_mini.png' });
await E(() => { picker = null; R('PISTOL'); players[0].adv = 'stealth'; openPicker('skill', 0, 'arty'); }); await pg.waitForTimeout(400); await pg.screenshot({ path: 'tac_mid.png' });
await E(() => { picker = null; R('VANTUONG'); const me = players[0]; me.build = ['commander']; applyBuild(me); const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 1.5; camera.x = players[0].x; camera.y = players[0].y; }; });
await pg.waitForTimeout(700); await pg.screenshot({ path: 'oc.png', clip: { x: 350, y: 160, width: 400, height: 300 } });
console.log(errs.slice(0, 6).join('\n') || 'NO ERRORS'); await b.close(); })();
