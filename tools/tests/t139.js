const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await pg.evaluate(() => { AudioSys.init(); }); await pg.waitForTimeout(3000);
console.log(await pg.evaluate(() => 'đã nạp: ' + ['laser', 'teleport', 'zap', 'ground', 'clang', 'glass', 'ricochet', 'sniper', 'cannon', 'magic', 'spell', 'whip', 'freeze', 'heal', 'shield', 'shield_up', 'throw'].map(k => k + (SND.buf[k] ? '✓' : '✗')).join(' ')));
const T = async (name, fn, arg) => console.log(name + ': ' + await pg.evaluate(fn, arg));
await pg.evaluate(() => { window.HEARD = async (fn, ms = 900) => { const before = Object.assign({}, SND.lastSfx); await fn(); await new Promise(r => setTimeout(r, ms)); return Object.keys(SND.lastSfx).filter(k => SND.lastSfx[k] !== before[k]).join(','); }; });
const cases = [
  ['Bắn tỉa', "const es = R('SNIPER'), me = players[0]; fireWeapon(me, getCurrentWeapon(me), 0, 1, es[0]);"],
  ['Hoả Mai', "const es = R('MUSKET'), me = players[0]; fireWeapon(me, getCurrentWeapon(me), 0, 1, es[0]);"],
  ['Railgun', "const es = R('RAILGUN'), me = players[0]; fireWeapon(me, getCurrentWeapon(me), 0, 1, es[0]);"],
  ['Súng Điện', "const es = R('TESLA'), me = players[0]; es[0].x = me.x + 100; for (let i = 0; i < 5; i++) { me.cooldown = 0; fireWeapon(me, getCurrentWeapon(me), 0, 0, es[0]); }"],
  ['Roi Xích', "const es = R('WHIP'), me = players[0]; es[0].x = me.x + 150; fireWeapon(me, getCurrentWeapon(me), 0, 0, es[0]);"],
  ['Roi Điện', "const es = R('EWHIP'), me = players[0]; es[0].x = me.x + 150; es[1].x = me.x + 180; es[1].y = me.y + 40; fireWeapon(me, getCurrentWeapon(me), 0, 0, es[0]);"],
  ['Búa (giữ nhảy đập)', "const es = R('HAMMER'), me = players[0]; fireWeapon(me, getCurrentWeapon(me), 0, 1, es[0]);"],
  ['Phi Tiêu', "const es = R('SHURIKEN'), me = players[0]; fireWeapon(me, getCurrentWeapon(me), 0, 0, es[0]);"],
  ['Bom Lửa vỡ', "const es = R('FIREBOMBW'), me = players[0]; fireWeapon(me, getCurrentWeapon(me), 0, 0, es[0]);"],
  ['Khiên đỡ đạn', "const es = R('SHIELD'), me = players[0], e = es[0]; e.inventory = [makeWeapon('PISTOL', e)]; e.weaponIdx = 0; e.x = me.x + 200; e.y = me.y; me.angle = 0; fireWeapon(e, getCurrentWeapon(e), Math.PI, 0, me);"],
  ['Kiếm Ánh Sáng chẻ đạn', "const es = R('LIGHTSABER'), me = players[0], e = es[0]; me.noMind = true; e.inventory = [makeWeapon('PISTOL', e)]; e.weaponIdx = 0; e.x = me.x + 200; e.y = me.y; me.angle = 0; fireWeapon(e, getCurrentWeapon(e), Math.PI, 0, me);"],
  ['Đạn nảy tường', "const es = R('PISTOL'), me = players[0]; es.forEach(e => e.x = 4000); obstacles.push({ x: me.x + 120, y: me.y - 100, w: 30, h: 200 }); const b = spawnBullet(me, me.x + 20, me.y, 0, { speed: 20, damage: 5, range: 500, bounces: 2 }); b.bounces = 2;"],
  ['Súng Băng đóng băng', "const es = R('ICEGUN'), me = players[0]; obstacles.length = 0; es[0].x = me.x + 120; es[0].frozenT = world.time + 1;"],
  ['Ném vũ khí', "const es = R('KATANA'), me = players[0]; throwWeapon(me, getCurrentWeapon(me), es[0]);"],
  ['Kim Cô: Định Thân', "const es = R('RUYIBANG'), me = players[0]; dinhThan(es[0], 1, me.id);"],
];
for (const [n, code] of cases) await T(n, (code) => HEARD(async () => { try { eval(code); } catch (e) { return 'ERR ' + e.message; } }), code);
// kỹ năng / phép
await T('Kỹ năng Dịch Chuyển', () => HEARD(async () => { const me = players[0]; R('PISTOL'); me.build = ['blink', 'heal', 'shieldS']; sbRebuild(me); me.skills.forEach(s => s.cd = 0); castSkill(me, me.skills.findIndex(s => s.id === 'blink'), { x: 1, y: 0 }); }));
await T('Kỹ năng Hồi Phục', () => HEARD(async () => { const me = players[0]; me.hp = 300; castSkill(me, me.skills.findIndex(s => s.id === 'heal'), null); }));
await T('Kỹ năng Khiên NL', () => HEARD(async () => { const me = players[0]; castSkill(me, me.skills.findIndex(s => s.id === 'shieldS'), null); }));
await T('Vạn Tượng mould Lazer', () => HEARD(async () => { const es = R('VANTUONG'), me = players[0], w = getCurrentWeapon(me); w.mods = ['laser', 'thunder']; w.mi = 0; fireWeapon(me, w, 0, 0, es[0]); }));
await T('Vạn Tượng mould Lôi Tích', () => HEARD(async () => { const es = R('VANTUONG'), me = players[0], w = getCurrentWeapon(me); w.mods = ['thunder', 'laser']; w.mi = 0; es[0].x = me.x + 80; fireWeapon(me, w, 0, 0, es[0]); }));
console.log(errs.join('\n') || 'NO ERRORS'); await b.close(); })();
