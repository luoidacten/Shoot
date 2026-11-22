const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
const E = f => pg.evaluate(f), out = [];
out.push('ĐA HÌNH: ' + await E(() => `POLY có VANTUONG ${POLY_WEPS.includes('VANTUONG')} · mould ${VT_IDS.length} (gần ${VT_IDS.filter(k => VT[k].type === 'MELEE').length}/xa ${VT_IDS.filter(k => VT[k].type === 'GUN').length})`));
const rows = await E(async () => { const s = ms => new Promise(r => setTimeout(r, ms)), o = [];
  for (const id of ['eshield', 'esword', 'egun', 'beam']) { const r = []; const setup = () => { const es = R('VANTUONG'), me = players[0], w = getCurrentWeapon(me); const other = VT_IDS.find(k => k !== id && VT[k].type !== VT[id].type); w.mods = [other, id]; w.mi = 1; vtSetType(w); es[0].x = VT[id].type === 'GUN' ? 1050 : 890; es[0].y = 900; return { me, w, es }; };
    let c = setup(); c.me.cooldown = 0; fireWeapon(c.me, c.w, 0, 0, c.es[0]); await s(900); r.push(`đánh -${D()}`); c = setup(); c.w.mi = 0; vtSetType(c.w); fireWeapon(c.me, c.w, 0, 1, c.es[0]); await s(900); r.push(`chuyển -${D()} khiên ${Math.round(c.me.st.shield || 0)}`);
    c = setup(); const slot = c.me.skills.findIndex(q => q.id === (VT[id].K[0] === 'M' ? 'meleeTech' : 'gunMod')); c.me.skills[slot].cd = 0; castSkill(c.me, slot, { x: 0.6, y: 0 }); if (id === 'eshield') { for (let k = 0; k < 4; k++) spawnBullet(c.es[0], 1000, 900, Math.PI, { speed: 12, damage: 20, range: 400 }); } await s(2200); r.push(`${VT[id].K[1]} -${D()} máu ta ${Math.round(c.me.hp)}/${c.me.maxHp}`);
    o.push(`${VT[id].icon} ${VT[id].name} [${VT[id].type === 'GUN' ? 'XA' : 'GẦN'}] ${r.join(' · ')}`); }
  // Chỉ Huy Sư Đoàn
  let me = players[0]; me.build = ['commander']; applyBuild(me); o.push(`CHỈ HUY: túi ${me.inventory.map(w => w.id + '[' + w.mods.join('+') + ']').join(' , ')} · skills ${me.skills.map(q => q.id).join(',')} · skip ${skipsPick(me)} · nhặt AR ${wepAllowed(me, WEAPONS.AR)}`);
  let ok = 0; for (let i = 0; i < 60; i++) { pickCount = 0; players[2].build = []; players[2].adv = 'stealth'; if (cardsForPick(players[2], 'build', 3).includes('commander')) ok++; } o.push(`thẻ xuất hiện lần đầu ${ok}/60`);
  const w = getCurrentWeapon(me); const h = me.skills.findIndex(q => q.id === 'overclock'); me.skills[h].cd = 0; players[1].x = me.x + 100; players[1].y = me.y; players[1].hp = 5000; castSkill(me, h, null); o.push(`QUY NHẤT ${me.vtFuse > world.time} mould vẫn ${vtCur(w)}`); const hp0 = players[1].hp; me.cooldown = 0; fireWeapon(me, w, 0, 0, players[1]); await s(700); o.push(`đòn kép -${Math.round(hp0 - players[1].hp)}`);
  me.calCd = 0; vtBtnCal(me); o.push(`HUD mở ${$('vt-cal').style.display} · ${document.querySelectorAll('#vt-cal .m').length} thẻ`);
  return o; });
console.log(out.concat(rows).join('\n'));
await pg.waitForTimeout(300); await pg.screenshot({ path: 'cal_hud.png' });
const after = await E(async () => { const s = ms => new Promise(r => setTimeout(r, ms)), o = []; const bs = [...document.querySelectorAll('#vt-cal .m')]; bs.find(b => b.dataset.k === 'beam').click(); bs.find(b => b.dataset.k === 'gravity') && document.querySelector('#vt-cal .m[data-k="eshield"]').click(); document.querySelector('#vt-cal .go').click(); const me = players[0], w = getCurrentWeapon(me); o.push(`sau HIỆU CHỈNH: ${w.mods.join('+')} · HUD ${$('vt-cal').style.display}`);
  // Sát thủ 7
  me.build = ['seven']; applyBuild(me); o.push(`SÁT THỦ 7: túi ${me.inventory.map(w => w.id).join(',')} · skills ${me.skills.map(q => q.id).join(',')}`);
  me.weaponIdx = 1; const es = players[1]; es.x = me.x + 70; es.y = me.y; es.hp = 5000; MDS.length = 0; me.mdGauge = 0; me.cooldown = 0; fireWeapon(me, getCurrentWeapon(me), 0, 0, es); await s(100); o.push(`Kéo trúng → mảnh ${MDS.filter(q => q.owner === me.id).length} · Giải Phóng ${me.mdGauge}%`);
  const sl = me.skills.findIndex(q => q.id === 'mdBlades'); es.x = me.x + 300; es.hp = 5000; castSkill(me, sl, { x: 1, y: 0 }); await s(900); o.push(`Vạn Đao Quy Nhất (định hướng): cầm ${getCurrentWeapon(me).id} -${Math.round(5000 - es.hp)}`);
  // Ma Đao Giải Phóng
  me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me); R('MADAO'); es.x = me.x + 150; es.y = me.y; es.hp = 5000; me.mdGauge = 100; me.cooldown = 0; fireWeapon(me, getCurrentWeapon(me), 0, 1, es); await s(400); const h0 = me.hp; dealDamage(me, 50, es.id, {}); o.push(`GIẢI PHÓNG: bất tử ${me.hp === h0} choáng địch ${es.stun > 0}`); await s(4200); o.push(`GĐ3 sẵn ${me.mdP3 > world.time}`); const e0 = es.hp; es.x = me.x + 260; es.y = me.y; me.cooldown = 0; fireWeapon(me, getCurrentWeapon(me), 0, 0, es); await s(700); o.push(`GĐ3 kiếm đâm -${Math.round(e0 - es.hp)} lướt tới x ${Math.round(me.x)}`);
  return o; });
console.log(after.join('\n'));
await E(() => { const U = updateCamera; updateCamera = function (dt) { U(dt); camera.zoom = 1.3; camera.x = players[0].x + 120; camera.y = players[0].y; }; const me = players[0], es = players[1]; es.x = me.x + 250; es.y = me.y; me.mdP3 = world.time + 3; me.cooldown = 0; fireWeapon(me, getCurrentWeapon(me), 0, 0, es); });
await pg.waitForTimeout(600); await pg.screenshot({ path: 'md_p3.png' });
await E(() => { R('VANTUONG'); const me = players[0], w = getCurrentWeapon(me); w.mods = ['eshield', 'beam']; w.mi = 1; vtSetType(w); players[1].x = 1100; me.cooldown = 0; fireWeapon(me, w, 0, 0, players[1]); });
await pg.waitForTimeout(250); await pg.screenshot({ path: 'vt_beam.png', clip: { x: 200, y: 60, width: 700, height: 500 } });
console.log(errs.slice(0, 8).join('\n') || 'NO ERRORS'); await b.close(); })();
