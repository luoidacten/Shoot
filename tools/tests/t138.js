const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
const T = async (name, fn, arg) => console.log(name + ': ' + await pg.evaluate(fn, arg));
// giữ cưa: gọi fireWeapon mỗi 16ms trong t giây
await pg.evaluate(() => { window.HOLD = async (me, w, sec, e) => { const t0 = performance.now(); while (performance.now() - t0 < sec * 1000) { me.cooldown = 0; if (e) { e.x = me.x + 45; e.y = me.y; } fireWeapon(me, w, 0, 0, e); await new Promise(r => setTimeout(r, 16)); } }; });
await T('Cưa giữ 1.5s', async () => { const es = R('CHAINSAW'), me = players[0], w = getCurrentWeapon(me); const d0 = w.durability; await HOLD(me, w, 1.5, es[0]); return `rồ ${me.sawRev.toFixed(2)} nhiệt ${Math.round(me.sawHeat)} sát thương ${D()} (≈${Math.round(D() / 1.5)}/giây) độ bền ${d0}→${w.durability}`; });
await T('Cưa giữ tới quá nhiệt', async () => { const es = R('CHAINSAW'), me = players[0], w = getCurrentWeapon(me); me.sawHeat = 0; me.sawJam = 0; let t = 0; while (!(me.sawJam > world.time) && t < 8) { await HOLD(me, w, 0.25, es[0]); t += 0.25; } return `quá nhiệt sau ~${t.toFixed(2)}s, máy chết tới ${(me.sawJam - world.time).toFixed(1)}s`; });
await T('Lao cưa khi thả', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('CHAINSAW'), me = players[0], w = getCurrentWeapon(me); me.sawHeat = 0; me.sawJam = 0; es[1].x = me.x + 150; es[1].y = me.y; await HOLD(me, w, 1.0, null); const x0 = me.x, h1 = es[1].hp; await s(400); return `lướt ${Math.round(me.x - x0)}px, địch trên đường -${Math.round(h1 - es[1].hp)}`; });
await T('Đĩa cưa bay (Bậc Thầy)', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('CHAINSAW'), me = players[0]; es[0].x = me.x + 200; me.skillAng = 0; me.sawHeat = 80; meleeTechCast(me); await s(1300); return `-${D()} (đi + về), nhiệt ${Math.round(me.sawHeat)}, đĩa còn ${W17.filter(f => f.kind === 'disc').length}`; });
await T('Bão cưa (KTC)', async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('CHAINSAW'), me = players[0]; es[0].x = me.x + 80; HT.CHAINSAW[1](me); await s(2000); return `-${D()}`; });
await T('Vạn Tượng buff', () => Object.keys(VT).map(k => `${k}:×${VT[k].buff.out.toFixed(2)}/${VT[k].buff.inn.toFixed(2)}`).join(' '));
await T('Chỉ Huy', () => { const p = players[0]; p.build = ['commander']; resetPlayerForRound(p); const r = `máu ${p.maxHp}, cdMult ${p.cdMult.toFixed(2)}, dmgMult ${p.dmgMult.toFixed(2)}`; p.build = ['meleeTech', 'gunMod', 'hightech']; resetPlayerForRound(p); return r; });
for (const f of [1, 2]) await T('Huyền Cơ dạng ' + f, async (f) => { const s = ms => new Promise(r => setTimeout(r, ms)); const es = R('UMBRELLA'), me = players[0], w = getCurrentWeapon(me), e = es[0]; w.form = f; me.lastFireT = -9; e.inventory = [makeWeapon('PISTOL', e)]; e.weaponIdx = 0; e.x = me.x + 220; e.y = me.y; me.angle = 0; e.cooldown = 0; fireWeapon(e, getCurrentWeapon(e), Math.PI, 0, me); let root = 0, slow = 0; for (let k = 0; k < 30; k++) { await s(20); me.angle = 0; root = Math.max(root, me.st.root || 0); slow = Math.max(slow, me.st.slow || 0); } return `root ${root.toFixed(2)} · slow ${slow.toFixed(2)} · máu ${Math.round(me.hp)}/${me.maxHp}`; }, f);
// ảnh 16 đầu gậy
await pg.evaluate(() => { const es = R('VANTUONG'); es.forEach(e => e.x = 4000); });
const shots = [];
for (const k of await pg.evaluate(() => Object.keys(VT))) {
  const r = await pg.evaluate((k) => { const me = players[0], w = getCurrentWeapon(me); w.mods = [k, k === 'thunder' ? 'laser' : 'thunder']; w.mi = 0; me.angle = 0; me.aimAngle = 0; const z = camera.zoom || 1; return { x: SCREEN_W / 2 + (me.x - camera.x) * z, y: SCREEN_H / 2 + (me.y - camera.y) * z }; }, k);
  await pg.waitForTimeout(120);
  const f = (process.env.SP || '.') + '/vt_' + k + '.png'; await pg.screenshot({ path: f, clip: { x: r.x - 30, y: r.y - 30, width: 100, height: 60 } }); shots.push(f);
}
await pg.evaluate(() => { const es = R('CHAINSAW'), me = players[0]; es[0].x = me.x + 45; es[0].y = me.y; me.sawRev = 0.9; me.sawHeat = 85; me.sawLastT = world.time; });
await pg.waitForTimeout(80); { const r = await pg.evaluate(() => { const me = players[0], z = camera.zoom || 1; return { x: SCREEN_W / 2 + (me.x - camera.x) * z, y: SCREEN_H / 2 + (me.y - camera.y) * z }; }); await pg.screenshot({ path: (process.env.SP || '.') + '/saw.png', clip: { x: r.x - 60, y: r.y - 50, width: 160, height: 100 } }); }
console.log('ảnh: ' + shots.length);
console.log(errs.join('\n') || 'NO ERRORS'); await b.close(); })();
