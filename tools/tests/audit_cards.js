const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = [];
pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1200);
const only = process.argv[2] ? process.argv[2].split(',') : null;
const res = await pg.evaluate(() => {
  SB.panel = false; sbPanel(true); obstacles.length = 0; bushes.length = 0; crates.length = 0;
  const me = players[0], F = players[1], B = players[2]; players.slice(3).forEach(q => { q.x = 3800; q.y = 3800; q.hp = 0; });
  const CX = 1500, CY = 1500, out = []; let AIM = 0;
  const ids = Object.keys(CARDS).filter(id => CARDS[id].kind === 'S' && !['meleeTech', 'gunMod', 'hightech'].includes(id));
  for (const id of ids) { const r = [];
    for (const th of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      me.build = [id]; try { sbRebuild(me); } catch (e) {}
      const R = skillRange(CARDS[id]), d = Math.min(R * 0.6, 220);
      me.inventory = [makeWeapon('PISTOL', me), makeWeapon('KNIFE', me)]; me.weaponIdx = 0;
      Object.assign(me, { x: CX, y: CY, angle: th, aimAngle: th + 1.4, travel: null, air: 0, hp: me.maxHp, shotQueue: [], cooldown: 0, vx: 0, vy: 0, stun: 0, dashTime: 0, mech: null }); me.st = freshStatus(); (me.skills || []).forEach(s => s.cd = 0);
      [[F, th], [B, th + Math.PI]].forEach(([q, a]) => { Object.assign(q, { hp: 5000, maxHp: 5000, armor: 0, stun: 0, kx: 0, ky: 0, travel: null, air: 0, dead: false, x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, vx: 0, vy: 0 }); q.st = freshStatus(); });
      bullets.length = 0; zones.length = 0; decoys.length = 0; strikes.length = 0;
      let e = '';
      try { castSkill(me, 0, { x: Math.cos(th) * d / R, y: Math.sin(th) * d / R }); for (let i = 0; i < 150; i++) { if (!me.travel && !(me.dashTime > 0)) me.angle = th; me.aimAngle = th + 1.4; [F, B].forEach(q => { q.kx = q.ky = 0; q.vx = q.vy = 0; }); update(1 / 60); if (i % 20 === 0) draw(); } } catch (er) { e = 'ERR ' + er.message; }
      r.push(e || `${Math.round(5000 - F.hp)}/${Math.round(5000 - B.hp)}`);
    }
    out.push({ id, name: CARDS[id].name, acts: { cast: r } });
  }
  return out;
});
const lines = [];
for (const r of res) { const arr = r.acts.cast, flags = []; arr.forEach((s, i) => { if (s.startsWith('ERR')) flags.push(s); else { const [f, bk] = s.split('/').map(Number); if (bk > f + 5) flags.push(`@${i * 90}° SAI HƯỚNG`); } }); const fs = arr.map(s => +(s.split('/')[0]) || 0); if (Math.max(...fs) > 0 && Math.min(...fs) === 0) flags.push('chỉ trúng vài hướng'); lines.push(`${r.id.padEnd(14)} ${r.name.padEnd(22)} ${arr.join(' ')}${flags.length ? '  ⚠ ' + flags.join(', ') : ''}`); }
console.log(lines.join('\n'));
console.log([...new Set(errs)].slice(0, 30).join('\n') || 'NO ERRORS'); await b.close(); })();
