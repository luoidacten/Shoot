const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 620 } }); const errs = []; pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1,3).join(' | ')));
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
await pg.evaluate(() => startSandbox()); await pg.waitForTimeout(1500);
await pg.evaluate(() => { SB.panel = false; sbPanel(true); SB.noCd = false; SB.ammo = false; obstacles.length = 0; bushes.length = 0; crates.length = 0; const me = players[0]; me.build = ['meleeTech', 'gunMod', 'hightech']; sbRebuild(me);
  window.R = (id) => { const me = players[0], es = players.slice(1); me.inventory = [makeWeapon(id, me), makeWeapon('PISTOL', me)]; me.weaponIdx = 0; me.x = 800; me.y = 900; me.angle = 0; me.skillAng = 0; me.skillDist = 200; me.travel = null; me.air = 0; me.st = freshStatus(); me.hp = me.maxHp; me.shotQueue = []; me.cooldown = 0; bullets.length = 0; me.skills.forEach(s => s.cd = 0); me.urN = 0; me.urStab = 0; me.snkN = 0; me.dartMulti = 0; me.musketReady = false; me.vx = me.vy = 0;
    es.forEach((q, i) => { q.hp = q.maxHp = 5000; q.armor = 0; q.stun = 0; q.kx = q.ky = 0; q.st = freshStatus(); q.travel = null; q.air = 0; q.x = 900; q.y = 900 + i * 500; q.dead = false; q.snakePoison = 0; q.disarmT = 0; q.angle = 0; }); return es; };
  window.D = () => Math.round(5000 - players[1].hp); });
console.log(await pg.evaluate(async () => { const o = [];
  // 1) mould độc quyền
  const me = players[0]; me.build = []; applyBuild(me); let bad = 0; for (let i = 0; i < 300; i++) { const w = makeWeapon('VANTUONG', me); if (w.mods.some(k => VT[k].excl)) bad++; } o.push(`gậy thường có mould độc quyền: ${bad}/300`);
  // 2) thẻ thay lợi thế
  me.adv = 'minimap'; me.minimap = true; me.build = ['commander']; applyBuild(me); o.push(`Chỉ Huy: lợi thế ${me.adv} (cũ ${me.advOld}) minimap ${me.minimap} · ${ADVANTAGES[me.adv].name}`);
  let ex = 0; for (let i = 0; i < 40; i++) { cmdArm(me); me.inventory = []; cmdArm(me); if (me.inventory.some(w => w.mods.some(k => VT[k].excl))) ex++; } o.push(`gậy Chỉ Huy có thể ra mould độc quyền: ${ex}/40 lần`);
  const p2 = players[2]; p2.adv = 'stealth'; p2.build = ['seven']; applyBuild(p2); o.push(`Sát Thủ 7: lợi thế ${p2.adv} (cũ ${p2.advOld})`);
  // 3) Hiệu Chỉnh online (giả lập)
  const g = players[1]; g.adv = 'keenSense'; g.build = ['commander']; applyBuild(g); g.remote = true; g.isBot = false; const sent = []; const NS = netSendTo, NR = net.role; netSendTo = (id, m) => sent.push([id, m]); net.role = 'host';
  g.calCd = 0; vtBtnCal(g); o.push(`chủ phòng gửi: ${JSON.stringify(sent[0] && sent[0][1])} tới ${sent[0] && sent[0][0] === g.id}`);
  // phía khách nhận lệnh → mở bảng
  net.role = 'guest'; const ups = []; const NS2 = netSend; netSend = m => ups.push(m); onNetData(sent[0][1]); o.push(`máy khách mở bảng: ${$('vt-cal').style.display}`);
  document.querySelectorAll('#vt-cal .m').forEach(b => { if (b.classList.contains('on')) b.click(); }); document.querySelector('#vt-cal .m[data-k="beam"]').click(); document.querySelector('#vt-cal .m[data-k="frost"]').click(); document.querySelector('#vt-cal .go').click(); o.push(`khách gửi lên: ${JSON.stringify(ups[0])} · bảng ${$('vt-cal').style.display}`);
  net.role = 'host'; onHostData({ id: g.id }, ups[0]); o.push(`chủ phòng áp dụng cho khách: ${getCurrentWeapon(g).mods.join('+')}`);
  onHostData({ id: g.id }, { t: 'vtCalSet', sel: ['xxx', 'frost'] }); o.push(`gửi bậy bị bỏ qua: ${getCurrentWeapon(g).mods.join('+')}`);
  netSendTo = NS; netSend = NS2; net.role = NR; g.remote = false;
  return o.join('\n'); }));
console.log(errs.slice(0, 6).join('\n') || 'NO ERRORS'); await b.close(); })();
