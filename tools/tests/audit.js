const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = [];
pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 300)); });
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1200);
const only = process.argv[2] ? process.argv[2].split(',') : null;
const res = await pg.evaluate((only) => {
  SB.panel = false; sbPanel(true); SB.noCd = false; obstacles.length = 0; bushes.length = 0; crates.length = 0;
  const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  const F = players[1], B = players[2]; players.slice(3).forEach(q => { q.x = 3800; q.y = 3800; q.hp = 0; });
  const CX = 1500, CY = 1500, out = [];
  const reset = (id, th, d) => {
    me.inventory = [makeWeapon(id, me), makeWeapon(id === 'PISTOL' ? 'KNIFE' : 'PISTOL', me)]; me.weaponIdx = 0;
    Object.assign(me, { x: CX, y: CY, angle: th, skillAng: th, skillDist: d, travel: null, air: 0, hp: me.maxHp, shotQueue: [], cooldown: 0, vx: 0, vy: 0, stun: 0, dashTime: 0 }); me.st = freshStatus(); me.skills.forEach(s => s.cd = 0);
    [[F, th], [B, th + Math.PI]].forEach(([q, a]) => { Object.assign(q, { hp: 5000, maxHp: 5000, armor: 0, stun: 0, kx: 0, ky: 0, travel: null, air: 0, dead: false, x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, angle: a + Math.PI, vx: 0, vy: 0 }); q.st = freshStatus(); });
    bullets.length = 0; zones.length = 0; decoys.length = 0;
  };
  let AIM = 0; const step = (sec, th) => { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { if (!me.travel && !(me.dashTime > 0)) me.angle = th; me.aimAngle = AIM; [F, B].forEach(q => { q.kx = q.ky = 0; q.vx = q.vy = 0; }); update(1 / 60); if (i % 15 === 0) draw(); } };
  const dmg = () => [Math.round(5000 - F.hp), Math.round(5000 - B.hp)];
  const ids = Object.keys(WEAPONS).filter(id => !only || only.includes(id));
  for (const id of ids) {
    const w0 = makeWeapon(id, me); const melee = w0.type === 'MELEE' || w0.type === 'SHIELD' || id === 'NONE';
    const row = { id, name: w0.name, type: w0.type, acts: {} };
    const actions = { tap: 0, charge: 1, [melee ? 'meleeTech' : 'gunMod']: 's', hightech: 's' };
    for (const [act, v] of Object.entries(actions)) {
      const r = [];
      for (const th of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        const d = act === 'tap' || act === 'charge' ? (melee ? Math.max(50, (w0.range || 60) * 0.7 + 20) : 230) : (melee ? 130 : 230);
        reset(id, th, d); AIM = v === 's' ? th + 1.4 : th; me.aimAngle = AIM; let e = '';
        try {
          if (v === 's') { const slot = me.skills.findIndex(s => s.id === act), card = CARDS[act], R = skillRange(card); castSkill(me, slot, { x: Math.cos(th) * Math.min(1, d / R), y: Math.sin(th) * Math.min(1, d / R) }); }
          else { const w = getCurrentWeapon(me); if (v) { me.charge = 1; } fireWeapon(me, w, th, v, F); me.charge = 0; }
          step(1.6, th);
        } catch (er) { e = 'ERR ' + er.message; }
        const [f, bk] = dmg(); r.push(e || `${f}/${bk}`);
      }
      row.acts[act] = r;
    }
    // tầm đánh thực (đòn chạm) theo 2 hướng ngược nhau, so với hình vẽ
    if (melee) { const reach = []; for (const th of [0, Math.PI]) { let mx = 0, vis = 0; for (let d = 30; d <= 320; d += 15) { reset(id, th, d); for (const k of Object.keys(me)) if (/^[a-z]{1,6}(N|Last|Next)$/.test(k)) delete me[k]; me.lastFireT = -9; B.x = 3700; B.y = 3700; slashes.length = 0; AIM = th; try { fireWeapon(me, getCurrentWeapon(me), th, 0, F); step(0.05, th); vis = Math.max(vis, ...slashes.filter(s => s.ownerId === me.id).map(s => s.range || 0), 0); step(0.45, th); } catch (er) {} if (5000 - F.hp > 0) mx = d; } reach.push(mx + '|' + Math.round(vis)); } row.reach = reach; }
    out.push(row);
  }
  return out;
}, only);
const lines = [];
for (const r of res) {
  const flags = [];
  for (const [act, arr] of Object.entries(r.acts)) {
    arr.forEach((s, i) => { if (s.startsWith('ERR')) flags.push(`${act}@${i * 90}° ${s}`); else { const [f, bk] = s.split('/').map(Number); if (bk > f && bk > 0) flags.push(`${act}@${i * 90}° SAI HƯỚNG (trước ${f} sau ${bk})`); } });
    const fs = arr.map(s => +(s.split('/')[0]) || 0); const mx = Math.max(...fs), mn = Math.min(...fs); if (mx > 0 && mn === 0) flags.push(`${act} chỉ trúng ở một số hướng [${arr.join(' ')}]`);
  }
  if (r.reach) { const [a, c] = r.reach.map(x => x.split('|').map(Number)); if (Math.abs(a[0] - c[0]) > 15) flags.push(`tầm lệch theo hướng ${a[0]} vs ${c[0]}`); if (a[1] && Math.abs(a[0] - a[1]) > 45) flags.push(`hitbox ${a[0]} ≠ hình vẽ ${a[1]}`); }
  lines.push(`${r.id.padEnd(11)} ${r.type.padEnd(6)} ${Object.entries(r.acts).map(([k, v]) => k + ':' + v.join(' ')).join(' | ')}${r.reach ? ' | reach ' + r.reach.join(' ') : ''}${flags.length ? '\n   ⚠ ' + flags.join('\n   ⚠ ') : ''}`);
}
console.log(lines.join('\n'));
console.log([...new Set(errs)].slice(0, 30).join('\n') || 'NO ERRORS'); await b.close(); })();
