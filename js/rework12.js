/** ==================== ÉP XUNG RIÊNG CHO TỪNG MOULD (16 chiêu độc nhất) ====================
 *  Nạp sau rework11.js. Thay Ép Xung chung (Quá Tải) bằng chiêu riêng của mould đang dùng.
 */
const W12 = [];
const ocNear = (p, R) => enemiesOf(p).filter(e => e.hp > 0 && dist(e.x, e.y, p.x, p.y) < R);
const ocTxt = (p, s, c) => floatText(p.x, p.y - 58, s, c || '#f0abfc', 16);

const VT_OC = {
    thunder: ['LÔI VỰC', 'Bão sét 4 giây quanh bạn (bán kính 220): mỗi 0.35 giây sét đánh 1 kẻ trong vùng (choáng), bạn chạy nhanh hơn.',
        p => { p.vtStormT = world.time + 4; p.st.haste = Math.max(p.st.haste || 0, 4); }, { aim: null, shape: 'selfaoe', aoe: 220 }],
    steel: ['THÉP HOÁ', 'Hoá tượng thép 2.5 giây: miễn mọi sát thương & đẩy lùi (vẫn đánh được nhưng không di chuyển); kết thúc nện sóng chấn sát thương chuẩn.',
        p => { p.vtStatueT = world.time + 2.5; p.st.root = Math.max(p.st.root || 0, 2.5); }, { aim: null, shape: 'selfaoe', aoe: 160 }],
    laser: ['LƯỚI LAZER', '4 tia lazer xoay quanh bạn 3.5 giây (dài 270), cắt mọi kẻ đi qua.',
        p => { p.vtLatticeT = world.time + 3.5; p.vtLatA = p.angle; }, { aim: null, shape: 'selfaoe', aoe: 270 }],
    cannon: ['PHÁO ĐÀI DI ĐỘNG', '4 giây thành pháo đài: tự động nã pháo vào kẻ gần nhất mỗi 0.45 giây (tầm 560), bạn chậm lại.',
        p => { p.vtTurretT = world.time + 4; p.vtTurretN = 0; p.st.slow = Math.max(p.st.slow || 0, 4); }, { aim: null, shape: 'selfaoe', aoe: 560 }],
    marker: ['ĐÁNH DẤU TỬ VONG', 'Đánh dấu mọi kẻ địch trong 750: lộ vị trí 6 giây và nhận thêm 25% sát thương từ mọi nguồn.',
        p => { ocNear(p, 750).forEach(e => { e.vtDoomT = world.time + 6; e.vtDoomBy = p.id; spotFor(e, p.id, 6); floatText(e.x, e.y - 50, '☠ ĐÁNH DẤU', '#f472b6', 13); }); W12.push({ kind: 'doomPulse', owner: p.id, x: p.x, y: p.y, t: 0.7, T: 0.7 }); }, { aim: null, shape: 'selfaoe', aoe: 750 }],
    white: ['ĐẠI ẢO THUẬT', 'Biến mất (tàng hình 3 giây), 3 ảo ảnh lao ra 3 hướng; ảo ảnh vỡ (bị đánh / hết giờ) nổ khói làm choáng.',
        p => { p.st.invis = Math.max(p.st.invis || 0, 3); smoke(p.x, p.y, 8, 'rgba(248,250,252,0.5)', 22); [-0.9, 0, 0.9].forEach(o => { const d = { x: p.x, y: p.y, angle: p.angle + o, speed: 300, owner: p.id, t: 2, hp: 1, color: p.color, radius: p.radius, label: p.label }; decoys.push(d); W12.push({ kind: 'trick', owner: p.id, d, t: 2.2, T: 2.2 }); }); }, { aim: null, shape: 'self', aoe: 40 }],
    frost: ['KỶ BĂNG HÀ', 'Vùng băng 4 giây (bán kính 250): kẻ bên trong chậm 60%; đứng trong vùng 1.2 giây bị ĐÓNG BĂNG (trói 1.5 giây, nhận thêm 30% sát thương).',
        p => { W12.push({ kind: 'iceAge', owner: p.id, x: p.x, y: p.y, R: 250, t: 4, T: 4 }); }, { aim: null, shape: 'selfaoe', aoe: 250 }],
    flame: ['PHƯỢNG HOÀNG', 'Hoá phượng hoàng lướt 380 theo hướng chọn, để lại dải lửa; trong 8 giây nếu bị hạ sẽ TÁI SINH với 35% máu (1 lần).',
        p => { const a = aimDir(p), x0 = p.x, y0 = p.y, s = umbFreeSpot(p, p.x + Math.cos(a) * 380, p.y + Math.sin(a) * 380); startTravel(p, s.x, s.y, 0.35, null, null, 40); p.st.invuln = Math.max(p.st.invuln || 0, 0.4); for (let i = 0; i <= 6; i++) zones.push({ type: 'fire', x: x0 + (s.x - x0) * i / 6, y: y0 + (s.y - y0) * i / 6, r: 45, t: 3, maxT: 3, owner: p.id, tick: 0 }); enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, x0, y0, s.x, s.y) < e.radius + 40) { dealDamage(e, 30 * vD(p), p.id, { knock: 200, angle: a }); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 3); e.st.burnBy = p.id; } } }); p.vtPhoenixT = world.time + 8; W12.push({ kind: 'phoenix', owner: p.id, t: 0.6, T: 0.6, a }); }, { aim: 'dir', R: 380, shape: 'line', w: 80 }],
    gravity: ['ĐẢO TRỌNG LỰC', 'Đảo trọng lực bán kính 340: mọi kẻ địch bị nhấc bổng 1 giây rồi bị nện xuống đất (sát thương + choáng).',
        p => { const L = ocNear(p, 340).filter(e => !(e.air > 0)); L.forEach(e => { startTravel(e, e.x, e.y, 1, null, null, 110); e.stun = Math.max(e.stun, 1); }); W12.push({ kind: 'gravFlip', owner: p.id, x: p.x, y: p.y, t: 1, T: 1 }); p.shotQueue.push({ t: 1.02, fn: () => { L.forEach(e => { if (e.hp > 0) { dealDamage(e, 42 * vM(p), p.id, { knock: 1 }); e.stun = Math.max(e.stun, 0.5); ring(e.x, e.y, 6, 50, '#a78bfa', 0.35, 4); } }); addShake(8); AudioSys.playAt('slam', p.x, p.y, 0.6); } }); }, { aim: null, shape: 'selfaoe', aoe: 340 }],
    wind: ['PHONG THẦN', '4 giây hoá gió: chạy nhanh +60%, đạn bay tới bị gió thổi lệch, chạm vào địch thì hất văng.',
        p => { p.vtWindT = world.time + 4; p.st.haste = Math.max(p.st.haste || 0, 4); }, { aim: null, shape: 'selfaoe', aoe: 90 }],
    blood: ['HUYẾT KHẾ', 'Khế ước máu với tối đa 3 kẻ gần (400) trong 5 giây: 45% sát thương bạn nhận chia đều sang họ, mỗi giây hút 6 máu mỗi người.',
        p => { p.vtLink = { ids: ocNear(p, 400).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y)).slice(0, 3).map(e => e.id), until: world.time + 5, tick: 0 }; }, { aim: null, shape: 'selfaoe', aoe: 400 }],
    chain: ['XÍCH THIÊN LA', 'Cắm cọc xích: mọi kẻ địch trong 330 bị xích vào cọc 3.5 giây (không chạy xa quá 110), bị siết sát thương liên tục.',
        p => { const L = ocNear(p, 330).map(e => e.id); W12.push({ kind: 'net', owner: p.id, x: p.x, y: p.y, ids: L, t: 3.5, T: 3.5, tick: 0 }); }, { aim: null, shape: 'selfaoe', aoe: 330 }],
    eshield: ['THÀNH LUỸ PHẢN KÍCH', 'Dựng thành luỹ 3 giây: hấp thụ TOÀN BỘ sát thương nhận vào, hết giờ phóng sóng năng lượng hình nón trả lại (tối đa 320).',
        p => { p.vtFort = { until: world.time + 3, abs: 0 }; p.st.root = Math.max(p.st.root || 0, 3); }, { aim: 'dir', R: 320, shape: 'cone', half: 0.6 }],
    esword: ['VẠN KIẾM QUY TÂM', '12 thanh kiếm vây quanh điểm chọn rồi cùng đâm vào tâm sau 0.8 giây (bán kính 150): sát thương lớn + choáng.',
        p => { const a = aimDir(p), d = Math.max(80, Math.min(360, p.skillDist || 300)), s = rayFree(p.x, p.y, a, d); W12.push({ kind: 'swRing', owner: p.id, x: p.x + Math.cos(a) * s.d, y: p.y + Math.sin(a) * s.d, R: 150, t: 0.8, T: 0.8 }); }, { aim: 'point', R: 360, shape: 'point', aoe: 150, arc: true }],
    egun: ['ĐẠN TRUY KÍCH', '4 giây: mỗi phát bắn thường kèm 2 tên lửa mini TỰ BÁM kẻ gần nhất.',
        p => { p.vtHomeT = world.time + 4; }, { aim: null, shape: 'self', aoe: 40 }],
    beam: ['LASER TUYỆT DIỆT', 'Cắm gậy, cảnh báo rồi bắn tia khổng lồ theo hướng chọn: 260 sát thương chuẩn + choáng.', p => vtLineAnnihilate(p), { aim: 'dir', R: 1100, shape: 'line', w: 90 }]
};
// mỗi mould: tên + mô tả Ép Xung
Object.keys(VT_OC).forEach(k => { if (VT[k]) VT[k].oc = VT_OC[k][0]; });
vtOverclock = function (p) {
    const w = getCurrentWeapon(p); if (!w || w.id !== 'VANTUONG' || !w.mods) { if (!p.isBot) floatText(p.x, p.y - 30, 'Cần cầm Vạn Tượng', '#94a3b8', 12); return; }
    const id = vtCur(w), O = VT_OC[id]; if (!O) return;
    W12.push({ kind: 'ocFlash', owner: p.id, col: VT[id].col, t: 0.45, T: 0.45 });
    if (id !== 'beam') ocTxt(p, `⚡ ÉP XUNG · ${VT[id].icon} ${O[0]}`, VT[id].col);
    AudioSys.playAt('rail', p.x, p.y, 0.6); addShake(4);
    O[2](p, w);
};
CARDS.overclock.desc = 'Mỗi mould có 1 chiêu ÉP XUNG riêng, độc nhất: ' + Object.keys(VT_OC).map(k => `${VT[k].icon} ${VT_OC[k][0]}`).join(' · ') + '.';
const _skillProfileR12 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (id === 'overclock' && w && w.id === 'VANTUONG' && w.mods) { const k = vtCur(w), O = VT_OC[k]; return { ...O[3], col: '240,171,252', tag: `⚡ ${VT[k].icon} ${O[0]}` }; }
    return _skillProfileR12(p, id);
};
// bảng Hiệu Chỉnh: thêm dòng Ép Xung của từng mould
const _vtCalRenderR12 = vtCalRender;
vtCalRender = function () { _vtCalRenderR12(); document.querySelectorAll('#vt-cal .m').forEach(b => { const k = b.dataset.k, sp = b.querySelector('span:last-child'); if (VT_OC[k] && sp && !sp.querySelector('.oc')) { const d = document.createElement('div'); d.className = 'k oc'; d.style.color = '#f0abfc'; d.textContent = `Ép Xung: ${VT_OC[k][0]}`; sp.appendChild(d); } }); };

/* ============================== MÓC SÁT THƯƠNG ============================== */
const _dealDamageR12 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (!target || target.hp <= 0) return _dealDamageR12(target, dmg, attackerId, opts);
    const now = world.time, atk = attackerId !== -1 && players.find(q => q.id === attackerId), foe = atk && atk !== target;
    if (target.vtDoomT > now && foe) dmg *= 1.25;                       // Đánh Dấu Tử Vong
    if (target.vtFrozenT > now && foe) dmg *= 1.3;                      // Kỷ Băng Hà
    if (target.vtStatueT > now && foe) { if (Math.random() < 0.3) spark(target.x, target.y, '#e2e8f0', 4, 160); return; } // Thép Hoá
    if (target.vtFort && target.vtFort.until > now && foe) { target.vtFort.abs += dmg; if (Math.random() < 0.4) spark(target.x, target.y, '#7dd3fc', 4, 140); return; } // Thành Luỹ
    if (target.vtLink && target.vtLink.until > now && foe && !target._vtLinkIn) { // Huyết Khế: chia 45% sang kẻ bị khế
        const L = target.vtLink.ids.map(id => players.find(q => q.id === id)).filter(e => e && e.hp > 0);
        if (L.length) { const part = dmg * 0.45 / L.length; dmg *= 0.55; target._vtLinkIn = true; try { L.forEach(e => { _dealDamageR12(e, part, target.id, { zone: true }); beams.push({ x1: target.x, y1: target.y, x2: e.x, y2: e.y, life: 0.12, maxLife: 0.12, color: '#dc2626' }); }); } finally { target._vtLinkIn = false; } }
    }
    if (target.vtPhoenixT > now && target.hp - dmg <= 0) { // Phượng Hoàng: tái sinh
        target.vtPhoenixT = 0; target.hp = target.maxHp * 0.35; target.st.invuln = Math.max(target.st.invuln || 0, 1.2);
        W12.push({ kind: 'rebirth', owner: target.id, t: 1, T: 1 }); flash('#fb923c', 0.15); AudioSys.playAt('legend', target.x, target.y, 0.5);
        floatText(target.x, target.y - 60, '🔥 PHƯỢNG HOÀNG TÁI SINH!', '#fdba74', 17);
        enemiesOf(target).forEach(e => { if (dist(e.x, e.y, target.x, target.y) < 150 + e.radius) { dealDamage(e, 30, target.id, { knock: 400, angle: Math.atan2(e.y - target.y, e.x - target.x) }); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 3); e.st.burnBy = target.id; } } });
        return;
    }
    return _dealDamageR12(target, dmg, attackerId, opts);
};
// Đạn Truy Kích: mỗi phát bắn thường kèm 2 tên lửa tự bám
const _fireWeaponR12 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const r = _fireWeaponR12(p, w, ang, charge, enemy);
    if (w && w.id === 'VANTUONG' && p.vtHomeT > world.time && (charge || 0) < 0.9 && !p._vtMirror) [-0.6, 0.6].forEach(o => W12.push({ kind: 'missile', owner: p.id, x: p.x, y: p.y, a: ang + o, sp: 520, t: 2, T: 2 }));
    return r;
};

/* ============================== CẬP NHẬT ============================== */
const _resetRoundR12 = resetPlayerForRound;
resetPlayerForRound = function (p) { ['vtStormT', 'vtStatueT', 'vtLatticeT', 'vtTurretT', 'vtDoomT', 'vtFrozenT', 'vtPhoenixT', 'vtWindT', 'vtHomeT'].forEach(k => p[k] = 0); p.vtLink = null; p.vtFort = null; for (let i = W12.length - 1; i >= 0; i--) if (W12[i].owner === p.id) W12.splice(i, 1); return _resetRoundR12(p); };
const _upeR12 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR12(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    const now = world.time;
    players.forEach(p => {
        if (p.hp <= 0) { p.vtLink = null; p.vtFort = null; return; }
        if (p.vtStormT > now) { p.vtStormTick = (p.vtStormTick || 0) - dt; if (p.vtStormTick <= 0) { p.vtStormTick = 0.35; const L = ocNear(p, 220).filter(e => !(e.air > 0)); const e = L[Math.floor(Math.random() * L.length)]; if (e) { beams.push({ x1: e.x + 20, y1: e.y - 420, x2: e.x, y2: e.y, life: 0.25, maxLife: 0.25, color: '#fde047', zig: true }); dealDamage(e, 16 * vD(p), p.id, { knock: 1 }); e.stun = Math.max(e.stun, 0.45); spark(e.x, e.y, '#fef08a', 10, 220); AudioSys.playAt('rail', e.x, e.y, 0.3); } } }
        if (p.vtStatueT && p.vtStatueT <= now) { p.vtStatueT = 0; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 160 + e.radius) { trueDamage(e, 42 * vM(p), p.id); e.stun = Math.max(e.stun, 0.6); } }); ring(p.x, p.y, 10, 160, '#cbd5e1', 0.5, 7); addShake(10); AudioSys.playAt('slam', p.x, p.y, 0.7); floatText(p.x, p.y - 50, '🔩 VỠ TƯỢNG!', '#e2e8f0', 14); }
        if (p.vtStatueT > now) { p.kx = p.ky = 0; }
        if (p.vtLatticeT > now) { p.vtLatA = (p.vtLatA || 0) + dt * 2.4; p.vtLatTick = (p.vtLatTick || 0) - dt; if (p.vtLatTick <= 0) { p.vtLatTick = 0.1; enemiesOf(p).forEach(e => { if (e.air > 0) return; for (let k = 0; k < 4; k++) { const a = p.vtLatA + k * Math.PI / 2, ex = p.x + Math.cos(a) * 270, ey = p.y + Math.sin(a) * 270; if (segDist(e.x, e.y, p.x, p.y, ex, ey) < e.radius + 8) { dealDamage(e, 9 * vD(p), p.id, { knock: 30, angle: a + Math.PI / 2 }); break; } } }); } }
        if (p.vtTurretT > now) { p.vtTurretTick = (p.vtTurretTick || 0) - dt; if (p.vtTurretTick <= 0) { p.vtTurretTick = 0.45; const e = ocNear(p, 560).sort((u, v) => dist(u.x, u.y, p.x, p.y) - dist(v.x, v.y, p.x, p.y))[0]; if (e) { W9.push({ kind: 'axShell', owner: p.id, x0: p.x, y0: p.y, x: e.x, y: e.y, t: 0.45, T: 0.45 }); dropBomb(p, e.x, e.y, 30 * vD(p), 75, 0.45); p.angle = Math.atan2(e.y - p.y, e.x - p.x); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.35); } } }
        if (p.vtWindT > now) {
            for (const b of bullets) { if (b.owner === p.id || dist(b.x, b.y, p.x, p.y) > 90) continue; const a = Math.atan2(b.y - p.y, b.x - p.x); b.angle = a + (angleDiff(b.angle, a) > 0 ? 0.9 : -0.9); }
            enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < p.radius + e.radius + 10 && !(e.vtGustT > now)) { e.vtGustT = now + 0.6; const a = Math.atan2(e.y - p.y, e.x - p.x); dealDamage(e, 12 * vD(p), p.id, { knock: 520, angle: a }); spark(e.x, e.y, '#a7f3d0', 8, 220); } });
        }
        const L = p.vtLink; if (L) { if (L.until <= now) p.vtLink = null; else { L.tick -= dt; if (L.tick <= 0) { L.tick = 0.5; L.ids.forEach(id => { const e = players.find(q => q.id === id); if (e && e.hp > 0) { _dealDamageR12(e, 3, p.id, { zone: true }); p.hp = Math.min(p.maxHp, p.hp + 3); } }); } } }
        const F = p.vtFort; if (F && F.until <= now) { p.vtFort = null; const D = Math.min(320, F.abs + 30), a = p.angle; enemiesOf(p).forEach(e => { if (dist(e.x, e.y, p.x, p.y) < 320 + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.6) dealDamage(e, D * vD(p), p.id, { knock: 500, angle: a }); }); W12.push({ kind: 'fortWave', owner: p.id, a, t: 0.5, T: 0.5 }); addShake(8); AudioSys.playAt('explosion', p.x, p.y, 0.6); floatText(p.x, p.y - 50, `🛡️ PHẢN KÍCH ${Math.round(D)}`, '#7dd3fc', 16); }
    });
    for (let i = W12.length - 1; i >= 0; i--) {
        const f = W12[i], o = players.find(q => q.id === f.owner); if (!o) { W12.splice(i, 1); continue; }
        f.t -= dt;
        if (f.kind === 'trick') { const alive = decoys.includes(f.d) && f.d.hp > 0 && f.d.t > 0; if (!alive || f.t <= 0) { const x = f.d.x, y = f.d.y; enemiesOf(o).forEach(e => { if (dist(e.x, e.y, x, y) < 90 + e.radius) { e.stun = Math.max(e.stun, 0.8); floatText(e.x, e.y - 44, '🎩 BỊ LỪA!', '#f8fafc', 12); } }); smoke(x, y, 6, 'rgba(248,250,252,0.55)', 18); ring(x, y, 6, 90, '#f8fafc', 0.4, 4); const k = decoys.indexOf(f.d); if (k >= 0) decoys.splice(k, 1); W12.splice(i, 1); } continue; }
        if (f.kind === 'iceAge') { enemiesOf(o).forEach(e => { if (dist(e.x, e.y, f.x, f.y) < f.R + e.radius) { e.st.slow = Math.max(e.st.slow || 0, 0.3); e.vtIceIn = (e.vtIceBy === f ? e.vtIceIn || 0 : 0) + dt; e.vtIceBy = f; if (e.vtIceIn >= 1.2 && !(e.vtFrozenT > world.time)) { e.vtFrozenT = world.time + 1.5; e.st.root = Math.max(e.st.root || 0, 1.5); floatText(e.x, e.y - 44, '❄ ĐÓNG BĂNG', '#bae6fd', 13); ring(e.x, e.y, 4, 34, '#bae6fd', 0.4, 4); } } }); }
        if (f.kind === 'net') { f.tick -= dt; f.ids.forEach(id => { const e = players.find(q => q.id === id); if (!e || e.hp <= 0) return; const d = dist(e.x, e.y, f.x, f.y); if (d > 110) { const a = Math.atan2(e.y - f.y, e.x - f.x), nx = f.x + Math.cos(a) * 110, ny = f.y + Math.sin(a) * 110; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } } if (f.tick <= 0) dealDamage(e, 6 * vM(o), o.id, { knock: 1 }); }); if (f.tick <= 0) f.tick = 0.5; }
        if (f.kind === 'missile') { const e = enemiesOf(o).filter(q => q.hp > 0 && !(q.air > 0)).sort((u, v) => dist(u.x, u.y, f.x, f.y) - dist(v.x, v.y, f.x, f.y))[0]; if (e) { const want = Math.atan2(e.y - f.y, e.x - f.x), d = angleDiff(want, f.a); f.a += Math.max(-6 * dt, Math.min(6 * dt, d)); } f.sp = Math.min(900, f.sp + 900 * dt); f.x += Math.cos(f.a) * f.sp * dt; f.y += Math.sin(f.a) * f.sp * dt; if (e && dist(e.x, e.y, f.x, f.y) < e.radius + 6) { dealDamage(e, 8 * vD(o), o.id, { knock: 60, angle: f.a }); spark(f.x, f.y, '#fde047', 6, 160); W12.splice(i, 1); continue; } if (pointInObstacle(f.x, f.y, 2)) { spark(f.x, f.y, '#fde047', 4, 120); W12.splice(i, 1); continue; } }
        if (f.t > 0) continue;
        if (f.kind === 'swRing') { enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, f.x, f.y) < f.R + e.radius) { dealDamage(e, 110 * vM(o), o.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.6); } }); W12.push({ kind: 'swBurst', owner: o.id, x: f.x, y: f.y, t: 0.4, T: 0.4 }); addShake(8); hitStop(0.06); AudioSys.playAt('crit', f.x, f.y, 0.7); }
        W12.splice(i, 1);
    }
};

/* ============================== HÌNH VẼ ============================== */
const _drawW2FxR12 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR12(now);
    ctx.save(); ctx.lineCap = 'round';
    const T = world.time;
    players.forEach(p => {
        if (p.hp <= 0) return;
        if (p.vtStormT > T) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(253,224,71,${0.35 + Math.sin(now * 20) * 0.2})`; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -now * 60; ctx.beginPath(); ctx.arc(p.x, p.y, 220, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); for (let i = 0; i < 3; i++) { const a = now * 3 + i * 2.09; let x = p.x + Math.cos(a) * 30, y = p.y + Math.sin(a) * 30; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k < 4; k++) { x += Math.cos(a) * 25 + (Math.random() - 0.5) * 18; y += Math.sin(a) * 25 + (Math.random() - 0.5) * 18; ctx.lineTo(x, y); } ctx.strokeStyle = 'rgba(254,240,138,0.6)'; ctx.stroke(); } ctx.restore(); }
        if (p.vtStatueT > T) { ctx.save(); ctx.fillStyle = 'rgba(148,163,184,0.55)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = 'rgba(71,85,105,0.8)'; ctx.lineWidth = 1.2; for (let i = 0; i < 5; i++) { const a = i * 1.26; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(a) * p.radius, p.y + Math.sin(a) * p.radius); ctx.stroke(); } ctx.restore(); }
        if (p.vtLatticeT > T) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const a = p.vtLatA + k * Math.PI / 2, ex = p.x + Math.cos(a) * 270, ey = p.y + Math.sin(a) * 270; [[10, 'rgba(244,63,94,0.35)'], [3, 'rgba(255,228,230,0.95)']].forEach(([wd, c]) => { ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ex, ey); ctx.stroke(); }); ctx.fillStyle = '#fb7185'; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * 40, p.y + Math.sin(a) * 40, 5, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
        if (p.vtTurretT > T) { ctx.save(); ctx.strokeStyle = 'rgba(251,146,60,0.6)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * (p.radius + 4), p.y + Math.sin(a) * (p.radius + 4)); ctx.lineTo(p.x + Math.cos(a) * (p.radius + 14), p.y + Math.sin(a) * (p.radius + 14)); ctx.stroke(); } ctx.setLineDash([6, 10]); ctx.strokeStyle = 'rgba(251,146,60,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 560, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        if (p.vtDoomT > T) { ctx.save(); ctx.font = `14px ${FONT}`; ctx.textAlign = 'center'; ctx.globalAlpha = 0.6 + Math.sin(now * 8) * 0.3; ctx.fillText('☠', p.x, p.y - p.radius - 22); ctx.strokeStyle = 'rgba(244,114,182,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 6, now * 2, now * 2 + 4.5); ctx.stroke(); ctx.restore(); }
        if (p.vtFrozenT > T) { ctx.save(); ctx.fillStyle = 'rgba(186,230,253,0.45)'; ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.047, r = p.radius + 8 + (i % 2) * 5; i ? ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r) : ctx.moveTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        if (p.vtPhoenixT > T) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; [-1, 1].forEach(s => { ctx.fillStyle = `rgba(251,146,60,${0.35 + Math.sin(now * 10) * 0.15})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + s * 30, p.y - 30, p.x + s * 40 + Math.sin(now * 8) * 4, p.y + 4); ctx.quadraticCurveTo(p.x + s * 20, p.y + 8, p.x, p.y); ctx.fill(); }); ctx.restore(); }
        if (p.vtWindT > T) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(167,243,208,0.55)'; ctx.lineWidth = 2.5; for (let r = 0; r < 3; r++) { const a0 = now * (10 - r * 2) + r; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 12 + r * 12, a0, a0 + 2); ctx.stroke(); } ctx.restore(); }
        if (p.vtLink && p.vtLink.until > T) { ctx.save(); ctx.strokeStyle = `rgba(220,38,38,${0.5 + Math.sin(now * 8) * 0.25})`; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.lineDashOffset = now * 40; p.vtLink.ids.forEach(id => { const e = players.find(q => q.id === id); if (e && e.hp > 0) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(e.x, e.y); ctx.stroke(); ctx.fillStyle = '#ef4444'; ctx.font = `12px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('🩸', e.x, e.y - e.radius - 18); } }); ctx.restore(); }
        if (p.vtFort && p.vtFort.until > T) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const k = Math.min(1, p.vtFort.abs / 320); ctx.fillStyle = `rgba(56,189,248,${0.12 + k * 0.25})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 22, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i * 1.047 + now; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 22, a, a + 0.8); ctx.stroke(); } ctx.globalCompositeOperation = 'source-over'; ctx.font = `800 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#e0f2fe'; ctx.fillText(`🛡️ ${Math.round(p.vtFort.abs)}`, p.x, p.y - p.radius - 30); ctx.restore(); }
    });
    W12.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = 1 - Math.max(0, f.t) / f.T, k = 1 - u;
        if (f.kind === 'ocFlash') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = f.col; ctx.globalAlpha = k; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius + 8 + u * 50, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius + 20 + u * 80, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'doomPulse') { ctx.strokeStyle = `rgba(244,114,182,${k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 750 * u, 0, Math.PI * 2); ctx.stroke(); }
        else if (f.kind === 'iceAge') { ctx.save(); const g = ctx.createRadialGradient(f.x, f.y, 10, f.x, f.y, f.R); g.addColorStop(0, 'rgba(224,242,254,0.25)'); g.addColorStop(1, 'rgba(125,211,252,0.12)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(186,230,253,0.7)'; ctx.lineWidth = 2; ctx.stroke(); for (let i = 0; i < 10; i++) { const a = i * 0.628 + 0.3, r = f.R * (0.3 + (i % 3) * 0.22); ctx.strokeStyle = 'rgba(240,249,255,0.5)'; ctx.lineWidth = 1.5; const x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r; for (let j = 0; j < 3; j++) { const b = j * 1.047; ctx.beginPath(); ctx.moveTo(x - Math.cos(b) * 7, y - Math.sin(b) * 7); ctx.lineTo(x + Math.cos(b) * 7, y + Math.sin(b) * 7); ctx.stroke(); } } ctx.restore(); }
        else if (f.kind === 'net') { ctx.save(); ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(f.x, f.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(203,213,225,0.85)'; f.ids.forEach(id => { const e = players.find(q => q.id === id); if (e && e.hp > 0) { ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(e.x, e.y); ctx.stroke(); } }); ctx.setLineDash([]); ctx.strokeStyle = 'rgba(148,163,184,0.3)'; ctx.beginPath(); ctx.arc(f.x, f.y, 110, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        else if (f.kind === 'gravFlip') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(167,139,250,${k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 340 * (0.3 + u * 0.7), 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 12; i++) { const a = i * 0.52, r = 60 + ((now * 120 + i * 40) % 280); ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); ctx.lineTo(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r - 18); ctx.stroke(); } ctx.restore(); }
        else if (f.kind === 'swRing') { for (let i = 0; i < 12; i++) { const a = i * 0.5236 + u * 0.6, r = f.R * (1 - Math.pow(u, 3) * 0.95) + 18; ctx.save(); ctx.translate(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); ctx.rotate(a + Math.PI); ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-6, -3); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#0ea5e9'; ctx.fillRect(-10, -4, 4, 8); ctx.restore(); } ctx.strokeStyle = `rgba(186,230,253,${0.3 + u * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, Math.PI * 2); ctx.stroke(); }
        else if (f.kind === 'swBurst') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, 150); g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(125,211,252,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 150, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'missile') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.fillStyle = '#fde047'; ctx.fillRect(-6, -2, 10, 4); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(251,146,60,0.7)'; ctx.beginPath(); ctx.arc(-8, 0, 3 + Math.random() * 2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'phoenix') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(251,146,60,${0.5 * k})`; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius + 30 * k, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'rebirth') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(o.x, o.y, 4, o.x, o.y, 150); g.addColorStop(0, `rgba(254,215,170,${k})`); g.addColorStop(1, 'rgba(234,88,12,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, 150 * (0.4 + u * 0.6), 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'fortWave') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(o.x, o.y); ctx.rotate(f.a); ctx.strokeStyle = `rgba(125,211,252,${k})`; ctx.lineWidth = 10 * k + 2; ctx.beginPath(); ctx.arc(0, 0, 40 + u * 280, -0.6, 0.6); ctx.stroke(); ctx.restore(); }
    });
    ctx.restore();
};

/* ============================== NỎ NỔ: tên ghim cả vào TƯỜNG, 1 giây sau nổ ============================== */
const _fireWeaponR12b = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const n = bullets.length, r = _fireWeaponR12b(p, w, ang, charge, enemy);
    if (w && w.id === 'XBOWX') bullets.slice(n).forEach(b => { if (b.owner === p.id) b.xbBolt = true; });
    return r;
};
const _upeR12b = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR12b(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; if (!b.xbBolt || b._stuck) continue;
        const step = (b.speed || 20) * 1.6, nx = b.x + Math.cos(b.angle) * step, ny = b.y + Math.sin(b.angle) * step;
        if (pointInObstacle(nx, ny, 0) || nx < 0 || ny < 0 || nx > MAP_W || ny > MAP_H) { // sắp cắm vào tường → ghim lại
            let x = b.x, y = b.y; for (let k = 0; k < 8; k++) { const tx = x + Math.cos(b.angle) * step / 8, ty = y + Math.sin(b.angle) * step / 8; if (pointInObstacle(tx, ty, 0)) break; x = tx; y = ty; }
            W12.push({ kind: 'wallBolt', owner: b.owner, x, y, a: b.angle, big: b.color === '#ef4444', t: 1, T: 1 });
            bullets.splice(i, 1); spark(x, y, '#fdba74', 4, 120); AudioSys.playAt('block', x, y, 0.2);
        }
    }
    for (let i = W12.length - 1; i >= 0; i--) { const f = W12[i]; if (f.kind === 'wallBolt' && f.t <= dt) { explode(f.x - Math.cos(f.a) * 6, f.y - Math.sin(f.a) * 6, f.owner, f.big ? 32 : 17, f.big ? 115 : 72); W12.splice(i, 1); } }
};
const _drawW2FxR12b = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR12b(now);
    W12.forEach(f => {
        if (f.kind !== 'wallBolt') return; const u = 1 - Math.max(0, f.t) / f.T;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(2, 0); ctx.stroke(); ctx.fillStyle = '#fb923c'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-18, -3); ctx.lineTo(-18, 3); ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(251,146,60,${0.4 + Math.sin(now * (10 + u * 30)) * 0.35})`; ctx.beginPath(); ctx.arc(f.x, f.y, (f.big ? 7 : 4) + u * 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
};
