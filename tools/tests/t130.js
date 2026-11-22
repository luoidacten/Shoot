const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
console.log(await pg.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)), o = [];
  for (const id of VT_IDS) {
    R('VANTUONG'); const me = players[0]; me.build = ['commander']; applyBuild(me); const w = getCurrentWeapon(me); const other = VT_IDS.find(k => k !== id && VT[k].type !== VT[id].type); w.mods = [id, other]; w.mi = 0; vtSetType(w);
    const es = players[1]; Object.assign(es, { x: me.x + 140, y: me.y, hp: 5000, stun: 0, air: 0, travel: null }); es.st = freshStatus(); me.hp = me.maxHp; me.st = freshStatus();
    const oc = me.skills.findIndex(q => q.id === 'overclock'); me.skills[oc].cd = 0; castSkill(me, oc, { x: 0.3, y: 0 });
    let extra = '';
    if (id === 'steel' || id === 'eshield') { const h = me.hp; dealDamage(me, 60, es.id, {}); extra = ` · nhận ${Math.round(h - me.hp)}/60`; }
    if (id === 'blood') { const h = me.hp; dealDamage(me, 60, es.id, {}); extra = ` · nhận ${Math.round(h - me.hp)}/60 (chia sang địch)`; }
    if (id === 'flame') { await s(500); dealDamage(me, 9999, es.id, {}); extra = ` · bị hạ → tái sinh, máu ${Math.round(me.hp)}`; }
    if (id === 'egun') { for (let i = 0; i < 4; i++) { me.cooldown = 0; fireWeapon(me, w, 0, 0, es); await s(250); } }
    if (id === 'marker') { const h = es.hp; dealDamage(es, 100, me.id, {}); extra = ` · đòn 100 → ${Math.round(h - es.hp)}`; }
    await s(id === 'frost' ? 2500 : id === 'beam' ? 1600 : 3200);
    o.push(`${VT[id].icon} ${VT_OC[id][0].padEnd(20)} địch -${Math.round(5000 - es.hp)}${es.vtFrozenT > world.time ? ' (đóng băng)' : ''}${extra}`);
  }
  return o.join('\n'); }));
await pg.evaluate(() => { const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 1.1; camera.x = players[0].x + 80; camera.y = players[0].y; }; });
let k = 0;
for (const [id, wt] of [['laser', 700], ['thunder', 900], ['frost', 1600], ['esword', 500], ['chain', 900], ['blood', 700]]) {
  await pg.evaluate(id => { R('VANTUONG'); const me = players[0]; me.build = ['commander']; applyBuild(me); const w = getCurrentWeapon(me); w.mods = [id, VT_IDS.find(k => k !== id && VT[k].type !== VT[id].type)]; w.mi = 0; vtSetType(w); [players[1], players[2]].forEach((e, i) => { Object.assign(e, { x: me.x + 130 + i * 40, y: me.y - 60 + i * 120, hp: 5000, stun: 0 }); e.st = freshStatus(); }); me.skills.forEach(q => q.cd = 0); castSkill(me, me.skills.findIndex(q => q.id === 'overclock'), { x: 0.3, y: 0 }); }, id);
  await pg.waitForTimeout(wt); await pg.screenshot({ path: 'oc_' + (k++) + '.png', clip: { x: 200, y: 40, width: 700, height: 540 } });
}
console.log(errs.slice(0, 6).join('\n') || 'NO ERRORS'); await b.close(); })();
