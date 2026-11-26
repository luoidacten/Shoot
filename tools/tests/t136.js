const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); if (process.env.NOBUFF) await pg.evaluate(() => { window.NOBUFF = 1; }); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
const ids = await pg.evaluate(() => Object.values(WEAPONS).filter(w => w.type === 'GUN' && w.magSize > 0 && !(typeof PICKER_WEAPONS !== 'undefined' && PICKER_WEAPONS[w.id]) && !(typeof TAC_WEAPONS !== 'undefined' && TAC_WEAPONS.includes(w.id)) && !POLY_WEPS.includes(w.id) && !w.robo && !['MUSKET', 'ROBOGUN', 'AIRCALL', 'BOMBTAB', 'LASERDES', 'SMOKETAB', 'ORBITAB', 'MARKBOMB', 'MARKPARA', 'GUIDEBOMB', 'CELLBURN'].includes(w.id)).map(w => w.id));
const only = process.argv[2] ? process.argv[2].split(',') : ids;
const out = [];
for (const id of only) {
  const r = await pg.evaluate(async (id) => { const s = ms => new Promise(r => setTimeout(r, ms));
    const es = R(id), me = players[0], w = getCurrentWeapon(me); me.critChance = 0; const e = es[0]; w.reserve = 99; if (window.NOBUFF) for (const k in GUN_BUFF_R15) GUN_BUFF_R15[k] = 1; const X = me.x, Y = me.y; e.x = X + 120; e.y = Y;
    const pin = setInterval(() => { me.x = X; me.y = Y; me.dashTime = 0; me.kx = me.ky = 0; e.x = X + 120; e.y = Y; e.kx = e.ky = 0; e.stun = 0; e.st = freshStatus(); }, 10);
    const R0 = Math.random; let seed = 7; Math.random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const mag = w.mag; let n = 0;
    try { while (n < mag && w.mag > 0) { me.cooldown = 0; me.angle = 0; fireWeapon(me, w, 0, ['SNIPER', 'RAILGUN'].includes(w.id) ? 1 : 0, e); n++; await s(Math.max(40, (w.fireRate || 10) / 60 * 1000)); if (w.id === 'BOOMERANG') await s(900); } await s(1500); }
    finally { clearInterval(pin); Math.random = R0; }
    return { id, name: w.name, mag, shots: n, dmg: D() }; }, id);
  out.push(r); console.log(JSON.stringify(r));
}
require('fs').writeFileSync(process.argv[3] || 'mag2.json', JSON.stringify(out));
console.log(errs.join('\n') || 'NO ERRORS'); await b.close(); })();
