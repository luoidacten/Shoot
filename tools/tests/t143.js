const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
const SP = process.env.SP || '.';
const T = async (name, fn, arg) => console.log(name + ': ' + await pg.evaluate(fn, arg));
const shot = async (f, w = 380, h = 220, dx = -80) => { const r = await pg.evaluate(() => { const me = players[0], z = camera.zoom || 1; return { x: SCREEN_W / 2 + (me.x - camera.x) * z, y: SCREEN_H / 2 + (me.y - camera.y) * z }; }); await pg.screenshot({ path: SP + '/' + f, clip: { x: r.x + dx, y: r.y - h / 2, width: w, height: h } }); };
await pg.evaluate(() => { const me = players[0]; me.adv = 'polyMaster'; });
// Rìu Săn 2 dạng
await T('Rìu Săn: chém nạp → Nện Đất → Shotgun', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('AXEGUN'), me = players[0], w = getCurrentWeapon(me); const out = []; for (let i = 0; i < 2; i++) { me.cooldown = 0; es[0].x = me.x + 60; es[0].y = me.y; fireWeapon(me, w, 0, 0, es[0]); await s(300); } out.push(`nòng ${w.ch} dạng ${w.form}`); const x0 = me.x; me.cooldown = 0; es[0].x = me.x + 70; fireWeapon(me, w, 0, 1, es[0]); await s(500); out.push(`→ dạng ${w.form} type ${w.type} bật lùi ${Math.round(x0 - me.x)} -${D()} · ô "${ammoText(w)}"`); return out.join(' | '); });
await T('Shotgun: chạm 1 nòng, giữ song nòng', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const me = players[0], w = getCurrentWeapon(me), es = players.slice(1); es[0].hp = 5000; es[0].x = me.x + 120; es[0].y = me.y; let n0 = bullets.length; me.cooldown = 0; fireWeapon(me, w, 0, 0, es[0]); const a = bullets.length - n0; await s(300); w.ch = 2; n0 = bullets.length; me.cooldown = 0; fireWeapon(me, w, 0, 1, es[0]); const b2 = bullets.length - n0; await s(400); return `1 nòng ${a} viên · song nòng ${b2} viên · -${Math.round(5000 - es[0].hp)} · nòng còn ${w.ch}`; });
await T('Shotgun hết đạn: Lao Xoay → Rìu', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const me = players[0], w = getCurrentWeapon(me), es = players.slice(1); es[0].hp = 5000; w.ch = 0; es[0].x = me.x + 120; es[0].y = me.y; const x0 = me.x; me.cooldown = 0; fireWeapon(me, w, 0, 1, es[0]); await s(500); return `dạng ${w.form} · lao ${Math.round(me.x - x0)}px · -${Math.round(5000 - es[0].hp)} · nòng ${w.ch}`; });
await T('Dạng súng tự nạp 2s', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const me = players[0], w = getCurrentWeapon(me); agSetForm22(w, 'gun'); w.ch = 0; w.reg22 = 0; await s(2300); return 'nòng sau 2.3s: ' + w.ch; });
await T('Đa Hình: đổi dạng → buff', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('AXEGUN'), me = players[0], w = getCurrentWeapon(me); me.pmBuffT = 0; await s(100); me.cooldown = 0; fireWeapon(me, w, 0, 1, es[0]); await s(200); return 'pmBuffT ' + (me.pmBuffT > world.time); });
await T('Trang Bị Phụ dạng súng: Đạn Sên Săn', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('AXEGUN'), me = players[0], w = getCurrentWeapon(me); agSetForm22(w, 'gun'); w.ch = 0; es[0].x = me.x + 300; me.skillAng = 0; gunModCast(me); await s(600); return `-${D()} nòng ${w.ch}`; });
await pg.evaluate(() => { const es = R('AXEGUN'), me = players[0], w = getCurrentWeapon(me); agSetForm22(w, 'gun'); w.ch = 2; me.angle = 0; es.forEach(e => e.x = 4000); }); await pg.waitForTimeout(150); await shot('i_axegun_gun.png', 160, 90, -40);
await pg.evaluate(() => { const me = players[0], w = getCurrentWeapon(me); agSetForm22(w, 'axe'); w.ch = 1; }); await pg.waitForTimeout(150); await shot('i_axegun_axe.png', 160, 90, -40);
await pg.evaluate(() => { players[0].adv = null; });
// Trường Kiếm: vệt chém + hiệu ứng
for (const E of ['KIM', 'THUY', 'MOC', 'HOA', 'THO']) {
  await pg.evaluate((E) => { zones.length = 0; const es = R('LONGSWORD'), me = players[0], w = getCurrentWeapon(me); lsSet21(w, E); es[0].x = me.x + 70; es[0].y = me.y; me.ls21N = 0; me.cooldown = 0; me.hp = 300; fireWeapon(me, w, 0, 0, es[0]); }, E);
  await pg.waitForTimeout(110); await shot('i_slash_' + E + '.png', 240, 150, -60);
  await T('  chém ' + E, () => { const e = players[1], me = players[0]; return `slow ${(e.st.slow || 0).toFixed(1)} burn ${(e.st.burn || 0).toFixed(1)} mark ${e.nhMark22 && e.nhMark22.E} · máu mình ${Math.round(me.hp)} · vệt ${W22.filter(f => f.kind === 'nhSlash').length}`; });
}
// KTC 5 hệ
for (const E of ['KIM', 'THUY', 'MOC', 'HOA', 'THO']) {
  await pg.evaluate((E) => { zones.length = 0; obstacles.length = 0; const es = R('LONGSWORD'), me = players[0], w = getCurrentWeapon(me); lsSet21(w, E); es[0].x = me.x + 230; es[0].y = me.y + 20; es[1].x = me.x + 300; es[1].y = me.y - 60; me.skillAng = 0; me.skillDist = 250; const sl = me.skills.findIndex(q => q.id === 'hightech'); me.skills[sl].cd = 0; castSkill(me, sl, { x: 0.65, y: 0 }); }, E);
  await pg.waitForTimeout(E === 'KIM' ? 650 : E === 'MOC' ? 1200 : 420); await shot('i_ht_' + E + '.png', 460, 260, -60);
  await pg.waitForTimeout(1500); await T('  KTC ' + E, () => `-${D()} · hình nộm 2 -${Math.round(5000 - players[2].hp)}`);
}
// Bậc Thầy: 5 kiếm rơi, nhặt
await pg.evaluate(() => { const es = R('LONGSWORD'), me = players[0]; es[0].x = me.x + 100; me.skillAng = 0; meleeTechCast(me); });
await pg.waitForTimeout(1200); await shot('i_pick.png', 300, 260, -150);
await T('Bậc Thầy: 5 kiếm rơi', () => W22.filter(f => f.kind === 'pickSword').map(f => f.E).join(','));
for (const E of ['KIM', 'THUY', 'MOC', 'HOA', 'THO']) await T('  nhặt ' + E + ' → đòn đặc trưng', async (E) => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('LONGSWORD'), me = players[0], w = getCurrentWeapon(me); obstacles.length = 0; es[0].x = me.x + 90; es[0].y = me.y; meleeTechCast(me); await s(1000); const sw = W22.find(f => f.kind === 'pickSword' && f.E === E); me.x = sw.x; me.y = sw.y; await s(100); const got = me.nhSig22 && me.nhSig22.E, left = W22.filter(f => f.kind === 'pickSword').length; es[0].hp = 5000; es[0].x = me.x + 80; es[0].y = me.y; es[0].st = freshStatus(); me.hp = 300; me.cooldown = 0; fireWeapon(me, w, 0, 0, es[0]); await s(900); return `nhận ${got}, kiếm còn ${left} · -${D()} · băng ${es[0].frozenT > world.time} trói ${(es[0].st.root || 0).toFixed(1)} cháy ${(es[0].st.burn || 0).toFixed(1)} choáng ${(es[0].stun || 0).toFixed(1)} · máu mình ${Math.round(me.hp)} · đá ${obstacles.filter(o => o.rock21).length}`; }, E);
console.log(errs.join('\n') || 'NO ERRORS'); await b.close(); })();
