/** ==================== RAYGUN (drone) · KÉO · MA ĐAO NGÀN LƯỠI (làm lại) ====================
 *  Nạp sau rework1.js.
 */
const RG = []; // drone của Raygun
const SC = []; // vật thể của Kéo
const MDS = []; // mảnh Ma Đao
const r2 = p => p.meleeMult || 1;

/* ============================== 1) RAYGUN (Súng Năng Lượng) ============================== */
// tầm nhìn từ drone (mù theo chủ: chủ bị mù / đứng trong khói thì drone cũng mù)
const _visionSourcesRG = visionSources;
visionSources = function (v) {
    const base = _visionSourcesRG(v); if (!v) return base;
    const extra = [];
    if (!(v.st && v.st.blind > 0) && !inSmoke(v.x, v.y)) RG.forEach(d => { if (d.hp > 0 && sameSide(v, d.owner)) extra.push({ x: d.x, y: d.y, r: d.scout ? 250 : 220, kind: 'drone' }); });
    return extra.length ? base.concat(extra) : base;
};
function rgDrones(p) {
    for (let i = RG.length - 1; i >= 0; i--) if (RG[i].owner === p.id && !RG[i].scout) RG.splice(i, 1);
    for (let k = 0; k < 2; k++) RG.push({ owner: p.id, x: p.x, y: p.y, hp: 45, t: 14, a: k * Math.PI, shotT: 0.5 + k * 0.4 });
    floatText(p.x, p.y - 44, '🛸 DRONE TẤN CÔNG ×2', '#c4b5fd', 15); AudioSys.playAt('rail', p.x, p.y, 0.4);
}
function rgScout(p) { // luồng điện làm lộ vị trí + drone do thám bay theo đường đó
    const a = aimDir(p), L = 900, ex = p.x + Math.cos(a) * L, ey = p.y + Math.sin(a) * L;
    beams.push({ x1: p.x, y1: p.y, x2: ex, y2: ey, life: 0.4, maxLife: 0.4, color: '#a78bfa', zig: true });
    enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, p.x, p.y, ex, ey) < e.radius + 30) { spotFor(e, p.id, 5); e.st.reveal = Math.max(e.st.reveal || 0, 1.5); dealDamage(e, 20 * (p.dmgMult || 1), p.id, { knock: 1 }); e.st.slow = Math.max(e.st.slow || 0, 1); floatText(e.x, e.y - 44, '⚡ LỘ VỊ TRÍ', '#c4b5fd', 13); } });
    RG.push({ owner: p.id, x: p.x, y: p.y, hp: 30, t: 4, a, scout: true, sp: 260, d: 0, L });
    AudioSys.playAt('rail', p.x, p.y, 0.6); addShake(3); floatText(p.x, p.y - 44, '⚡ LUỒNG ĐIỆN DO THÁM', '#c4b5fd', 15);
}
function updateRG(dt) {
    for (let i = RG.length - 1; i >= 0; i--) {
        const d = RG[i], o = players.find(q => q.id === d.owner); d.t -= dt;
        if (!o || o.hp <= 0 || d.t <= 0 || d.hp <= 0) { if (d.hp <= 0) { spark(d.x, d.y, '#c4b5fd', 12, 220); floatText(d.x, d.y - 20, '💥 DRONE HỎNG', '#c4b5fd', 12); } RG.splice(i, 1); continue; }
        // bị bắn phá
        for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner !== o.id && dist(b.x, b.y, d.x, d.y) < 12 + (b.size || 3)) { d.hp -= b.damage || 10; spark(b.x, b.y, '#c4b5fd', 4, 160); bullets.splice(j, 1); } }
        if (d.scout) { const st = d.sp * dt; d.x += Math.cos(d.a) * st; d.y += Math.sin(d.a) * st; d.d += st; if (d.d >= d.L || d.x < 0 || d.y < 0 || d.x > MAP_W || d.y > MAP_H) d.t = 0; continue; }
        // mục tiêu: địch mà CHỦ đang nhìn thấy (tàng hình / khói làm chủ mất tầm nhìn thì drone cũng mù)
        const blind = (o.st && o.st.blind > 0) || inSmoke(o.x, o.y);
        const tgt = blind ? null : enemiesOf(o).filter(e => !(e.air > 0) && dist(e.x, e.y, o.x, o.y) < 700 && targetable(o, e)).sort((u, v) => dist(o.x, o.y, u.x, u.y) - dist(o.x, o.y, v.x, v.y))[0];
        d.a += dt * (tgt ? 2.2 : 3);
        const cx = tgt ? tgt.x : o.x, cy = tgt ? tgt.y : o.y, R = tgt ? 110 : 48, k = d === RG.find(q => q.owner === o.id && !q.scout) ? 0 : Math.PI;
        const tx = cx + Math.cos(d.a + k) * R, ty = cy + Math.sin(d.a + k) * R, sp = 520 * dt, dd = dist(d.x, d.y, tx, ty);
        if (dd > sp) { d.x += (tx - d.x) / dd * sp; d.y += (ty - d.y) / dd * sp; } else { d.x = tx; d.y = ty; }
        if (tgt) { d.shotT -= dt; if (d.shotT <= 0) { d.shotT = 1.3; for (let s = 0; s < 3; s++) setTimeout(() => { if (d.hp <= 0 || tgt.hp <= 0 || gameState !== 'PLAYING') return; const a = Math.atan2(tgt.y - d.y, tgt.x - d.x) + (Math.random() - 0.5) * 0.08; spawnBullet(o, d.x, d.y, a, { speed: 24, damage: 7 * (o.dmgMult || 1), range: dist(d.x, d.y, o.x, o.y) + 300, color: '#c4b5fd', size: 2.6, trail: 22 }); AudioSys.playAt('smg', d.x, d.y, 0.1); }, s * 90); } }
    }
}

/* ============================== 2) KÉO ============================== */
WEAPONS.SCISSORS = { id: 'SCISSORS', name: 'Kéo', icon: '✂️', type: 'MELEE', mode: 'charge', chargeTime: 0.6, aim: 'arc', color: '#e2e8f0', damage: 18, fireRate: 18, range: 92, durability: 50, maxDurability: 50, moveScale: 1.05, width: 5, len: 36, tier: 3, desc: 'Đánh thường: chém 2 nhát rồi đâm tầm ngắn. Giữ rồi thả: ném 2 lưỡi kéo bay 2 vòng cung đối xứng, ghép lại ở điểm cuối và xoay 1 giây rồi bay thẳng về (đánh thường để thu về sớm). Lưỡi kéo ném ra bỏ qua mọi lớp phòng thủ.' };
BASE_WEIGHTS.SCISSORS = 5;
const scOut = p => SC.some(f => f.owner === p.id && f.kind !== 'scBig');
function scThrow(p, ang) {
    if (p.scLock > world.time) { if (!p.isBot) floatText(p.x, p.y - 30, '✂️ Kéo đang hồi lực…', '#94a3b8', 12); return; }
    const d = Math.max(90, Math.min(300, (p.manualEngaged && p.aimDist) || 240)), free = rayFree(p.x, p.y, ang, d), D = Math.max(70, free.d);
    const tx = p.x + Math.cos(ang) * D, ty = p.y + Math.sin(ang) * D;
    [-1, 1].forEach(sd => SC.push({ kind: 'scBlade', owner: p.id, x0: p.x, y0: p.y, tx, ty, a: ang, sd, t: 0, T: 0.32, hit: new Set() }));
    AudioSys.playAt('whoosh', p.x, p.y, 0.5); floatText(p.x, p.y - 40, '✂️ PHI KÉO', '#e2e8f0', 13);
}
function scRecall(p) { SC.forEach(f => { if (f.owner === p.id && f.kind === 'scSpin') { f.left = 0; } }); }
function scFire(p, w, ang, charge, mult) {
    p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    if (scOut(p)) { p.cooldown = 8; scRecall(p); return; } // đánh thường khi kéo đang bay = thu về sớm
    if (charge >= 0.9 || p.scNextThrow) { p.scNextThrow = false; p.cooldown = 16; return scThrow(p, ang); }
    if (world.time - (p.scLast || -9) > 1.2) p.scN = 0; p.scLast = world.time;
    const n = (p.scN = ((p.scN || 0) % 3) + 1), dmg = w.damage * r2(p) * mult;
    if (n < 3) {
        p.cooldown = w.fireRate * p.fireRateMult;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 92 + p.radius, color: '#e2e8f0', width: 7, life: 0.18, maxLife: 0.18, swing: n === 1 ? -1 : 1, line: false, arc: 1.05 });
        hitArc(p, w, ang, 92, 1.05, dmg); AudioSys.playAt('swing', p.x, p.y, 0.45);
    } else {
        p.cooldown = 22 * p.fireRateMult;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 70 + p.radius, color: '#f8fafc', width: 6, life: 0.16, maxLife: 0.16, swing: 1, line: true });
        lineFoes(p, ang, 70 + p.radius, 18).forEach(e => { dealDamage(e, dmg * 1.5, p.id, { melee: true, knock: 260, angle: ang }); p.stats.hits++; });
        AudioSys.playAt('swing', p.x, p.y, 0.5);
    }
}
function updateSC(dt) {
    for (let i = SC.length - 1; i >= 0; i--) {
        const f = SC[i], o = players.find(q => q.id === f.owner); if (!o || o.hp <= 0) { SC.splice(i, 1); continue; }
        const dmgT = (e, d) => { trueDamage(e, d, o.id); spark(e.x, e.y, '#f8fafc', 6, 200); };
        if (f.kind === 'scBlade') { // bay theo vòng cung đối xứng tới điểm hẹn
            f.t += dt; const u = Math.min(1, f.t / f.T), nx = -Math.sin(f.a), ny = Math.cos(f.a), bulge = Math.sin(u * Math.PI) * 90 * f.sd;
            f.x = f.x0 + (f.tx - f.x0) * u + nx * bulge; f.y = f.y0 + (f.ty - f.y0) * u + ny * bulge;
            enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && dist(e.x, e.y, f.x, f.y) < e.radius + 16) { f.hit.add(e.id); dmgT(e, 14 * r2(o)); } });
            if (u >= 1) { SC.splice(i, 1); if (f.sd > 0) SC.push({ kind: 'scSpin', owner: o.id, x: f.tx, y: f.ty, left: 1, tick: 0 }); }
        } else if (f.kind === 'scSpin') { // ghép lại, xoay 1 giây
            f.left -= dt; f.tick += dt;
            if (f.tick >= 0.15) { f.tick = 0; enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, f.x, f.y) < e.radius + 48) dmgT(e, 6 * r2(o)); }); for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner !== o.id && dist(b.x, b.y, f.x, f.y) < 52) bullets.splice(j, 1); } }
            if (f.left <= 0) { SC.splice(i, 1); SC.push({ kind: 'scBack', owner: o.id, x: f.x, y: f.y, hit: new Set() }); }
        } else if (f.kind === 'scBack') { // bay thẳng về
            const sp = 900 * dt, d = dist(f.x, f.y, o.x, o.y); if (d < sp + o.radius) { SC.splice(i, 1); spark(o.x, o.y, '#f8fafc', 4, 120); continue; }
            const a = Math.atan2(o.y - f.y, o.x - f.x); f.x += Math.cos(a) * sp; f.y += Math.sin(a) * sp;
            enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && dist(e.x, e.y, f.x, f.y) < e.radius + 18) { f.hit.add(e.id); dmgT(e, 16 * r2(o)); } });
        } else if (f.kind === 'scBig') { // Kỹ Thuật Cao: kéo khổng lồ hủy diệt trên đường bay
            const st = 760 * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
            enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && dist(e.x, e.y, f.x, f.y) < e.radius + 40) { f.hit.add(e.id); dmgT(e, f.dmg); e.st.slow = Math.max(e.st.slow || 0, 1); } });
            for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner !== o.id && dist(b.x, b.y, f.x, f.y) < 46) bullets.splice(j, 1); }
            const ob = pointInObstacle(f.x, f.y, 0);
            if (ob) { if (ob.wood || ob.temp !== undefined) damageObstacle(ob, 200, o); else if (!f.wall) { SC.splice(i, 1); spark(f.x, f.y, '#f8fafc', 14, 260); continue; } }
            if (f.d >= f.max) SC.splice(i, 1);
        }
    }
}
// Kỹ Thuật Cao: giữ càng lâu càng mạnh — đứng yên, kéo xoay; sau 1 giây tạo vùng sát thương & phá đạn; thả: phóng ra (giữ 2 giây: xuyên tường)
function scHeldSlot(p) { const i = (p.skills || []).findIndex(s => s.id === 'hightech'); return i >= 0 && p.skHeld && p.skHeld[i] && p.skills[i].cd <= 0 ? i : -1; }
function scHT(p) {
    const i = (p.skills || []).findIndex(s => s.id === 'hightech');
    let h = p.isBot ? 1.2 + Math.random() * 0.9 : world.time - ((p.skDownAt && p.skDownAt[i]) || world.time);
    h = Math.min(2.2, h);
    const a = aimDir(p), m = muzzle(p, getCurrentWeapon(p), a);
    SC.push({ kind: 'scBig', owner: p.id, x: m.x, y: m.y, a, d: 0, max: 320 + 260 * Math.min(2, h), dmg: (30 + 32 * Math.min(2, h)) * r2(p), wall: h >= 2, hit: new Set(), size: 18 + h * 10 });
    p.scLock = world.time + 2; p.scChargeT = 0;
    addShake(4 + h * 3); AudioSys.playAt('whoosh', p.x, p.y, 0.7);
    floatText(p.x, p.y - 44, h >= 2 ? '✂️ KÉO HỦY DIỆT · XUYÊN TƯỜNG' : `✂️ KÉO HỦY DIỆT ${Math.round(h * 50)}%`, '#f8fafc', 15);
}
function scMaster(p) { const a = aimDir(p), s = umbFreeSpot(p, p.x - Math.cos(a) * 170, p.y - Math.sin(a) * 170); startTravel(p, s.x, s.y, 0.25, null, null, 20); p.scNextThrow = true; floatText(p.x, p.y - 44, '✂️ LÙI · ĐÒN KẾ PHI KÉO', '#e2e8f0', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.5); }

/* ============================== 3) MA ĐAO NGÀN LƯỠI (làm lại) ============================== */
WEAPONS.MADAO.desc = 'Thanh đao ghép từ ngàn mảnh vỡ nối bằng khí tím đen. THÀNH KIẾM VỠ: mọi đòn bỏ qua toàn bộ phòng thủ. THIÊN NHẬN PHÂN THÂN: mỗi đòn/kỹ năng tách mảnh đao găm lên địch hoặc rơi quanh đó; GIỮ để thu mảnh về (xuyên giáp trên đường về, đòn kế ×1.5). Combo: chém · chém · đâm phóng lưỡi · lướt chém. GIẢI PHÓNG: thu mảnh tích %, đủ 100% giữ → VẠN NHẬN QUY TÔNG. Kỹ năng riêng (phím 4 / nút ⚔): thu toàn bộ mảnh rồi phóng thẳng.';
const mdShards = p => MDS.filter(s => s.owner === p.id);
function mdDrop(p, x, y, n, tid) { for (let i = 0; i < n; i++) { const t = Math.random() * Math.PI * 2, r = tid !== undefined ? 6 + Math.random() * 10 : 10 + Math.random() * 40; MDS.push({ owner: p.id, x: x + Math.cos(t) * r, y: y + Math.sin(t) * r, ox: Math.cos(t) * r, oy: Math.sin(t) * r, tid, t: 6, a: Math.random() * 6 }); } while (mdShards(p).length > 30) MDS.splice(MDS.findIndex(s => s.owner === p.id), 1); }
const mdT = (p, e, d) => { trueDamage(e, d * (p.mdEmp > 0 ? 1.25 : 1), p.id); }; // THÀNH KIẾM VỠ: bỏ qua phòng thủ
function mdRecall(p, from) { // thu mảnh về: xuyên giáp trên đường về, tích Giải Phóng, đòn kế ×1.5
    const list = mdShards(p).filter(s => dist(s.x, s.y, p.x, p.y) < (from || 520));
    list.forEach(s => { MDS.splice(MDS.indexOf(s), 1); W6.push({ kind: 'mdFly', owner: p.id, x: s.x, y: s.y, hit: new Set(), t: 1.5 }); });
    if (list.length) { p.mdGauge = Math.min(100, (p.mdGauge || 0) + list.length * 9); p.mdBoost = true; floatText(p.x, p.y - 44, `🗡 THU ${list.length} MẢNH · ${Math.round(p.mdGauge)}%`, '#c084fc', 13); AudioSys.playAt('rail', p.x, p.y, 0.3); }
    return list.length;
}
const W6 = [];
madaoFire = function (p, w, ang, charge, mult) {
    p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    if (p.mdField) { p.cooldown = 10; p.mdField.t = 0; return; } // tái kích hoạt: thu đao đoạt mệnh
    if (charge >= 0.9) {
        if ((p.mdGauge || 0) >= 100) return mdUltimate(p, ang);
        p.cooldown = 16; const n = mdRecall(p); if (!n) floatText(p.x, p.y - 30, 'Không có mảnh đao gần', '#94a3b8', 12); return;
    }
    if (world.time - (p.mdLast || -9) > 1.3) p.mdN = 0; p.mdLast = world.time;
    const n = (p.mdN = ((p.mdN || 0) % 4) + 1), boost = p.mdBoost ? 1.5 : 1, reach = p.mdEmp > 0 ? 1.3 : 1; p.mdBoost = false; if (p.mdEmp > 0) p.mdEmp--;
    const dmg = w.damage * r2(p) * mult * boost;
    let hit = [];
    if (n <= 2) {
        p.cooldown = w.fireRate * p.fireRateMult;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 100 * reach + p.radius, color: '#a855f7', width: 10, life: 0.2, maxLife: 0.2, swing: n === 1 ? -1 : 1, line: false, arc: 1.2 });
        hit = arcFoes(p, ang, 100 * reach, 1.2); hit.forEach(e => mdT(p, e, dmg)); AudioSys.playAt('swing', p.x, p.y, 0.5);
    } else if (n === 3) { // đâm phóng lưỡi về phía trước
        p.cooldown = 22 * p.fireRateMult; const free = rayFree(p.x, p.y, ang, 240 * reach);
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: free.d, color: '#c084fc', width: 7, life: 0.2, maxLife: 0.2, swing: 1, line: true });
        hit = lineFoes(p, ang, free.d + 10, 16); hit.forEach(e => mdT(p, e, dmg * 1.2));
        mdDrop(p, p.x + Math.cos(ang) * free.d, p.y + Math.sin(ang) * free.d, 2); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
    } else { // lướt chém
        p.cooldown = 26 * p.fireRateMult; p.dashTime = 0.14; p.dashAngle = ang;
        p.shotQueue.push({ t: 0.15, fn: () => { if (p.hp <= 0) return; slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 115 * reach + p.radius, color: '#a855f7', width: 13, life: 0.24, maxLife: 0.24, swing: 1, line: false, arc: 1.4 }); arcFoes(p, ang, 115 * reach, 1.4).forEach(e => { mdT(p, e, dmg * 1.4); mdDrop(p, e.x, e.y, 1, e.id); }); AudioSys.playAt('swing', p.x, p.y, 0.6); } });
    }
    hit.forEach(e => mdDrop(p, e.x, e.y, 1, e.id)); // tích lưỡi đao lên địch
    if (n !== 4 && hit.length === 0) mdDrop(p, p.x + Math.cos(ang) * 80, p.y + Math.sin(ang) * 80, 1);
    p.stats.hits += hit.length; if (hit.length) { reduceDurability(p, w, 1); hitStop(0.03); }
};
function mdUltimate(p, ang) { // VẠN NHẬN QUY TÔNG
    p.mdGauge = 0; p.cooldown = 20;
    p.mdField = { x: p.x, y: p.y, R: 260, t: 4, tick: 0 };
    flash('#7e22ce', 0.15); addShake(10); AudioSys.playAt('legend', p.x, p.y, 0.6);
    if (p === localPlayer()) showBanner('🗡 VẠN NHẬN QUY TÔNG', 'Giữ/đánh lần nữa: THU ĐAO ĐOẠT MỆNH', '#c084fc', 1.6, 40);
    floatText(p.x, p.y - 50, '🗡 VẠN NHẬN QUY TÔNG!', '#c084fc', 18);
}
function updateMD(dt) {
    const now = world.time;
    for (let i = MDS.length - 1; i >= 0; i--) { const s = MDS[i]; s.t -= dt; s.a += dt * 3; if (s.tid !== undefined) { const e = players.find(q => q.id === s.tid); if (e && e.hp > 0) { s.x = e.x + s.ox; s.y = e.y + s.oy; } else s.tid = undefined; } if (s.t <= 0) MDS.splice(i, 1); }
    for (let i = W6.length - 1; i >= 0; i--) { // mảnh bay về: xuyên giáp trên đường về
        const f = W6[i], o = players.find(q => q.id === f.owner); if (!o || o.hp <= 0) { W6.splice(i, 1); continue; }
        if (f.kind === 'mdFly') { const sp = (f.fast ? 1300 : 950) * dt, d = dist(f.x, f.y, o.x, o.y); if (d < sp + o.radius) { W6.splice(i, 1); continue; } const a = Math.atan2(o.y - f.y, o.x - f.x); f.x += Math.cos(a) * sp; f.y += Math.sin(a) * sp; enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && dist(e.x, e.y, f.x, f.y) < e.radius + 10) { f.hit.add(e.id); trueDamage(e, (f.dmg || 8) * r2(o), o.id); spark(e.x, e.y, '#c084fc', 4, 160); } }); }
        else if (f.kind === 'mdVolley') { const st = 950 * dt; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st; enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && segDist(e.x, e.y, f.x - Math.cos(f.a) * st, f.y - Math.sin(f.a) * st, f.x, f.y) < e.radius + 30) { f.hit.add(e.id); trueDamage(e, f.dmg, o.id); spark(e.x, e.y, '#e9d5ff', 14, 280); floatText(e.x, e.y - 40, `🗡 ×${f.n}`, '#e9d5ff', 14); } }); if (f.d >= f.max || pointInObstacle(f.x, f.y, 0)) W6.splice(i, 1); }
    }
    players.forEach(p => {
        if (p.hp <= 0) { p.mdField = null; p.mdTornadoT = 0; return; }
        const F = p.mdField;
        if (F) { // giai đoạn 1: trận địa mảnh đao
            F.t -= dt; F.tick += dt;
            if (F.tick >= 0.2) { F.tick = 0; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, F.x, F.y) < F.R + e.radius) { trueDamage(e, 6 * r2(p), p.id); e.st.blind = Math.max(e.st.blind || 0, 0.4); if (Math.random() < 0.3) spark(e.x, e.y, '#c084fc', 3, 160); } }); }
            if (F.t <= 0) { // giai đoạn 2: thu đao đoạt mệnh
                p.mdField = null;
                for (let k = 0; k < 28; k++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * F.R; W6.push({ kind: 'mdFly', owner: p.id, x: F.x + Math.cos(a) * r, y: F.y + Math.sin(a) * r, hit: new Set(), dmg: 14, fast: true }); }
                MDS.filter(s => s.owner === p.id).forEach(s => { W6.push({ kind: 'mdFly', owner: p.id, x: s.x, y: s.y, hit: new Set(), dmg: 14, fast: true }); MDS.splice(MDS.indexOf(s), 1); });
                addShake(8); AudioSys.playAt('rail', p.x, p.y, 0.6); floatText(p.x, p.y - 50, '🗡 THU ĐAO ĐOẠT MỆNH!', '#e9d5ff', 17);
            }
        }
        if (p.mdTornadoT > now) { // lốc mảnh vỡ: chặn / đánh bật đạn
            for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner === p.id || dist(b.x, b.y, p.x, p.y) > 80) continue; if (now < p.mdTornadoT - 0.5 && !b.explosive) { b.owner = p.id; b.angle = Math.atan2(b.y - p.y, b.x - p.x); b.life = Math.max(b.life, 0.8); b.color = '#c084fc'; } else bullets.splice(j, 1); }
            if (Math.random() < 0.4) enemiesOf(p).forEach(e => { if (dist(e.x, e.y, p.x, p.y) < 75 + e.radius) trueDamage(e, 2 * r2(p), p.id); });
        }
        if (p.mdExCd > 0) p.mdExCd -= dt;
    });
}
// Kỹ Thuật Cao: MA ĐAO BỘ (tái kích hoạt khi lốc đang xoay: LƯỚT BIẾN ẢNH, không tốn hồi chiêu)
function mdStep(p) {
    const a = aimDir(p), D = Math.max(60, Math.min(260, p.skillDist || 240)), s = umbFreeSpot(p, p.x + Math.cos(a) * D, p.y + Math.sin(a) * D), ax = p.x, ay = p.y;
    startTravel(p, s.x, s.y, 0.18, null, null, 8); p.st.invuln = Math.max(p.st.invuln || 0, 0.2); afterImages(p, ax, ay, s.x, s.y, 6, '#a855f7');
    const passed = enemiesOf(p).filter(e => !(e.air > 0) && segDist(e.x, e.y, ax, ay, s.x, s.y) < e.radius + 30);
    p.shotQueue.push({ t: 0.25, fn: () => { passed.forEach(e => { if (e.hp > 0) { trueDamage(e, 24 * r2(p), p.id); mdDrop(p, e.x, e.y, 1, e.id); USK.push({ kind: 'xcut', x: e.x, y: e.y, a, t: 0.4, maxT: 0.4 }); } }); if (passed.length) AudioSys.playAt('crit', p.x, p.y, 0.5); } });
    p.mdEmp = 3; p.mdTornadoT = world.time + 2.2; p.st.haste = Math.max(p.st.haste || 0, 2);
    floatText(p.x, p.y - 44, '🗡 MA ĐAO BỘ · LỐC MẢNH VỠ', '#c084fc', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
}
function mdBlink(p) { // lướt biến ảnh: kéo toàn bộ mảnh chém ngang qua điểm đích
    p.mdTornadoT = 0; const a = aimDir(p), D = Math.max(60, Math.min(300, p.skillDist || 260)), s = umbFreeSpot(p, p.x + Math.cos(a) * D, p.y + Math.sin(a) * D), ax = p.x, ay = p.y;
    decoys.push({ x: ax, y: ay, angle: p.angle, speed: 0, owner: p.id, t: 1.5, hp: 30, color: p.color, radius: p.radius, label: p.label });
    startTravel(p, s.x, s.y, 0.14, null, null, 6); afterImages(p, ax, ay, s.x, s.y, 8, '#c084fc');
    const n = mdShards(p).length; MDS.filter(q => q.owner === p.id).forEach(q => MDS.splice(MDS.indexOf(q), 1));
    p.shotQueue.push({ t: 0.16, fn: () => { [0, Math.PI].forEach(o => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + o, range: 130, color: '#a855f7', width: 14, life: 0.3, maxLife: 0.3, swing: 1, line: false, arc: Math.PI / 2 })); enemiesOf(p).forEach(e => { if (!(e.air > 0) && (dist(e.x, e.y, p.x, p.y) < 130 + e.radius || segDist(e.x, e.y, ax, ay, p.x, p.y) < e.radius + 30)) trueDamage(e, (20 + 4 * n) * r2(p), p.id); }); addShake(6); AudioSys.playAt('crit', p.x, p.y, 0.6); } });
    floatText(p.x, p.y - 44, `🗡 LƯỚT BIẾN ẢNH (+${n} mảnh)`, '#e9d5ff', 15);
}
// Bậc Thầy: TRẢM KHÔNG ĐOẠN MẠCH
function mdMaster(p) {
    const a = aimDir(p), near = mdShards(p).filter(s => s.tid === undefined && dist(s.x, s.y, p.x, p.y) < 320), n = near.length;
    near.forEach(s => { MDS.splice(MDS.indexOf(s), 1); W6.push({ kind: 'mdFly', owner: p.id, x: s.x, y: s.y, hit: new Set(), dmg: 6 }); });
    const R = 220 + Math.min(140, n * 20), dmg = (40 + 6 * n) * r2(p);
    W6.push({ kind: 'mdBigBlade', owner: p.id, a, R, t: 0.5, x: p.x, y: p.y });
    p.shotQueue.push({ t: 0.3, fn: () => {
        if (p.hp <= 0) return;
        enemiesOf(p).forEach(e => { const d = dist(e.x, e.y, p.x, p.y); if (e.air > 0 || d > R + e.radius || Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) > 0.55) return; trueDamage(e, dmg, p.id); if (d < R * 0.5) { e.st.root = Math.max(e.st.root || 0, 1.2); floatText(e.x, e.y - 44, '⛓ TRÓI', '#c084fc', 13); } else { e.stun = Math.max(e.stun, 0.6); } mdDrop(p, e.x, e.y, 1, e.id); });
        addShake(10); hitStop(0.07); AudioSys.playAt('slam', p.x, p.y, 0.7);
    } });
    floatText(p.x, p.y - 44, `🗡 TRẢM KHÔNG ĐOẠN MẠCH${n ? ` (+${n} mảnh)` : ''}`, '#c084fc', 15);
}
// KỸ NĂNG RIÊNG: thu toàn bộ mảnh rồi phóng thẳng (sát thương theo số mảnh; mảnh bay về cũng gây sát thương)
function mdExclusive(p) {
    if (!p || p.hp <= 0 || getCurrentWeapon(p).id !== 'MADAO') return;
    if (p.mdExCd > 0) { if (!p.isBot) floatText(p.x, p.y - 30, `⚔ ${Math.ceil(p.mdExCd)}s`, '#94a3b8', 12); return; }
    const list = mdShards(p), n = list.length;
    if (!n) { if (!p.isBot) floatText(p.x, p.y - 30, 'Chưa có mảnh đao', '#94a3b8', 12); return; }
    p.mdExCd = 10;
    list.forEach(s => { MDS.splice(MDS.indexOf(s), 1); W6.push({ kind: 'mdFly', owner: p.id, x: s.x, y: s.y, hit: new Set(), dmg: 8, fast: true }); });
    const a = p.isBot ? (enemyOf(p) ? Math.atan2(enemyOf(p).y - p.y, enemyOf(p).x - p.x) : p.angle) : p.angle;
    p.st.root = Math.max(p.st.root || 0, 0.35);
    p.shotQueue.push({ t: 0.35, fn: () => { if (p.hp <= 0) return; W6.push({ kind: 'mdVolley', owner: p.id, x: p.x, y: p.y, a, d: 0, max: 650, dmg: (20 + 7 * n) * r2(p), n, hit: new Set() }); addShake(7); AudioSys.playAt('rail', p.x, p.y, 0.7); } });
    floatText(p.x, p.y - 50, `⚔ VẠN ĐAO QUY NHẤT ×${n}`, '#e9d5ff', 16);
}
window.addEventListener('keydown', e => { if (e.code === 'Digit4' && ['PLAYING', 'KO'].includes(gameState)) mdExclusive(localPlayer()); });
(function () { // nút kỹ năng riêng (máy tính & điện thoại)
    const b = document.createElement('button'); b.id = 'md-ex'; b.textContent = '⚔'; b.title = 'Vạn Đao Quy Nhất (phím 4)';
    b.style.cssText = 'position:fixed;right:18px;bottom:220px;z-index:58;width:54px;height:54px;border-radius:50%;border:2px solid #a855f7;background:rgba(46,16,101,.85);color:#f5f3ff;font:800 22px system-ui;display:none;touch-action:manipulation';
    document.body.appendChild(b);
    ['touchstart', 'mousedown'].forEach(ev => b.addEventListener(ev, e => { e.stopPropagation(); e.preventDefault(); mdExclusive(localPlayer()); }, { passive: false }));
})();

/* ============================== MÓC VÀO HỆ THỐNG ============================== */
const _fireWeaponR2 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && w.id === 'SCISSORS') { if (p.disarmT > world.time) return; return scFire(p, w, ang, charge || 0, attackMult(p, w)); }
    return _fireWeaponR2(p, w, ang, charge, enemy);
};
const _castSkillR2 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], w = getCurrentWeapon(p);
    if (s && s.id === 'hightech' && w && w.id === 'MADAO' && p.mdTornadoT > world.time) { // tái kích hoạt trong lúc lốc: không tốn hồi chiêu
        if (aimVec && Math.hypot(aimVec.x, aimVec.y) > 0.25) { p.skillAng = Math.atan2(aimVec.y, aimVec.x); p.skillDist = Math.min(1, Math.hypot(aimVec.x, aimVec.y)) * 300; } else p.skillAng = p.angle;
        return mdBlink(p);
    }
    return _castSkillR2(p, slot, aimVec);
};
const _meleeTechR2 = meleeTechCast;
meleeTechCast = function (p) { const w = getCurrentWeapon(p); if (w.id === 'SCISSORS') return scMaster(p); if (w.id === 'MADAO') return mdMaster(p); return _meleeTechR2(p); };
const _gunModR2 = gunModCast;
gunModCast = function (p) { const w = getCurrentWeapon(p); if (w.id === 'ENERGY') return rgDrones(p); return _gunModR2(p); };
Object.assign(HT, { ENERGY: ['LUỒNG ĐIỆN DO THÁM', rgScout], SCISSORS: ['KÉO HỦY DIỆT', scHT], MADAO: ['MA ĐAO BỘ', mdStep] });
Object.assign(HT_PROFILE, { ENERGY: { aim: 'dir', R: 900, shape: 'line', w: 60, col: '167,139,250', tag: '⚡ LỘ VỊ TRÍ + DRONE DO THÁM' }, SCISSORS: { aim: 'dir', R: 580, shape: 'line', w: 80, col: '226,232,240', tag: 'GIỮ CÀNG LÂU CÀNG MẠNH · 2s XUYÊN TƯỜNG' }, MADAO: { aim: 'dir', R: 260, shape: 'line', w: 60, col: '168,85,247', tag: 'LƯỚT · LỐC MẢNH VỠ (bấm lại: LƯỚT BIẾN ẢNH)' } });
Object.assign(MELEE_P, { SCISSORS: 'Kéo ném ra bay nhanh hơn 20%.', MADAO: 'Thu mảnh tích Giải Phóng nhanh gấp rưỡi.' });
Object.assign(GUN_P, { ENERGY: 'Drone bền gấp đôi.' });
const _skillProfileR2 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'ENERGY' && id === 'gunMod') return { aim: null, shape: 'selfaoe', aoe: 220, col: '196,181,253', tag: '🛸 2 DRONE · TỰ TÌM ĐỊCH' };
    if (w && w.id === 'SCISSORS' && id === 'meleeTech') return { aim: 'dir', R: 170, shape: 'line', w: 30, col: '226,232,240', tag: 'LÙI · ĐÒN KẾ PHI KÉO' };
    if (w && w.id === 'MADAO' && id === 'meleeTech') { const n = mdShards(p).filter(s => s.tid === undefined && dist(s.x, s.y, p.x, p.y) < 320).length; return { aim: 'dir', R: 220 + Math.min(140, n * 20), shape: 'cone', half: 0.55, col: '168,85,247', tag: n ? `+${n} MẢNH` : '' }; }
    return _skillProfileR2(p, id);
};
const _upeR2 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR2(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    updateRG(dt); updateSC(dt); updateMD(dt);
    players.forEach(p => {
        if (p.hp <= 0) return; const w = getCurrentWeapon(p);
        // Kéo · Kỹ Thuật Cao đang giữ: đứng yên, kéo xoay; sau 1 giây: vùng sát thương + phá đạn
        if (w && w.id === 'SCISSORS' && scHeldSlot(p) >= 0) {
            const i = scHeldSlot(p), h = world.time - (p.skDownAt[i] || world.time); p.scChargeT = h; p.st.root = Math.max(p.st.root || 0, 0.06);
            if (h >= 1) { p.scZoneT = (p.scZoneT || 0) + dt; if (p.scZoneT >= 0.25) { p.scZoneT = 0; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 110 + e.radius) trueDamage(e, 5 * r2(p), p.id); }); } for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < 110) { spark(b.x, b.y, '#f8fafc', 3, 140); bullets.splice(j, 1); } } }
        } else if (p.scChargeT) p.scChargeT = 0;
        // bot dùng kỹ năng riêng của Ma Đao
        if (p.isBot && w && w.id === 'MADAO' && !(p.mdExCd > 0) && mdShards(p).length >= 6 && Math.random() < dt) mdExclusive(p);
        if (p.isBot && w && w.id === 'MADAO' && (p.mdGauge || 0) >= 100 && !p.mdField && enemiesOf(p).some(e => dist(e.x, e.y, p.x, p.y) < 240)) mdUltimate(p, p.angle);
    });
    const me = localPlayer(), btn = $('md-ex');
    if (btn) { const show = me && me.hp > 0 && getCurrentWeapon(me).id === 'MADAO'; btn.style.display = show ? 'block' : 'none'; if (show) btn.textContent = me.mdExCd > 0 ? Math.ceil(me.mdExCd) : `⚔${mdShards(me).length}`; }
};
const _resetRoundR2 = resetPlayerForRound;
resetPlayerForRound = function (p) { for (const A of [RG, SC, MDS, W6]) for (let i = A.length - 1; i >= 0; i--) if (A[i].owner === p.id) A.splice(i, 1); p.mdField = null; p.mdGauge = 0; p.mdTornadoT = 0; p.mdExCd = 0; return _resetRoundR2(p); };

/* ============================== HÌNH VẼ ============================== */
Object.assign(ART2, {
    SCISSORS: (c, w, r, x0, ch, now, p) => {
        const out = p && scOut(p), open = ch * 0.35 + 0.12;
        [-1, 1].forEach(sd => { c.save(); c.translate(x0, 0); c.rotate(sd * open); c.strokeStyle = '#1f2937'; c.lineWidth = 3; c.beginPath(); c.ellipse(-6, sd * 5, 5, 3.4, 0, 0, Math.PI * 2); c.stroke(); c.strokeStyle = '#ef4444'; c.lineWidth = 1.6; c.stroke(); // tay cầm
            if (!out) blade(c, [[0, -1.6 * sd], [28, -0.6 * sd], [32, 0], [26, 1.2 * sd], [0, 1.8 * sd]], '#f8fafc', '#64748b'); c.restore(); });
        c.fillStyle = '#e5e7eb'; c.beginPath(); c.arc(x0, 0, 2, 0, Math.PI * 2); c.fill(); outl(c, 0.6);
    },
    MADAO: (c, w, r, x0, ch, now, p) => {
        metal(c, x0 - 7, -2.4, 10, 4.8, '#1c1917', 1.8); c.fillStyle = '#581c87'; c.beginPath(); c.moveTo(x0 + 2, -6); c.lineTo(x0 + 6, 0); c.lineTo(x0 + 2, 6); c.lineTo(x0 - 1, 0); c.closePath(); c.fill(); outl(c, 0.8);
        const frags = 9, n = p ? mdShards(p).length : 0, missing = Math.min(frags - 2, Math.floor(n / 3));
        for (let i = 0; i < frags; i++) { // lưỡi ghép từ mảnh vỡ, khí tím đen nối các mảnh
            const x = x0 + 6 + i * 4.4, gone = i >= frags - missing; if (gone) continue;
            const jy = Math.sin(i * 2.3) * 0.8 + (ch > 0.2 ? Math.sin(now * 20 + i) * ch * 1.5 : 0);
            c.fillStyle = i % 2 ? '#d8b4fe' : '#a78bfa'; c.beginPath(); c.moveTo(x, -3 + jy); c.lineTo(x + 4, -2.4 + jy); c.lineTo(x + 3.6, 2.6 + jy); c.lineTo(x - 0.4, 3 + jy); c.closePath(); c.fill(); outl(c, 0.5);
        }
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(147,51,234,${0.55 + Math.sin(now * 6) * 0.25})`; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0 + 5, 0); for (let i = 0; i <= 8; i++) c.lineTo(x0 + 6 + i * 4.4, Math.sin(now * 8 + i) * 1.2); c.stroke(); c.restore();
        if (p && (p.mdGauge || 0) > 0) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x0 - 6, 6, 20, 2.6); c.fillStyle = (p.mdGauge >= 100) ? '#f0abfc' : '#a855f7'; c.fillRect(x0 - 6, 6, 20 * Math.min(1, p.mdGauge / 100), 2.6); }
    }
});
const _drawW2FxR2 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR2(now);
    ctx.save(); ctx.lineCap = 'round';
    // drone
    RG.forEach(d => { ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(now * 6); ctx.fillStyle = d.scout ? '#e9d5ff' : '#7c3aed'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(196,181,253,0.8)'; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(11, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(11, 0, 3, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); ctx.fillStyle = `rgba(196,181,253,${0.5 + Math.sin(now * 12) * 0.3})`; ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI * 2); ctx.fill(); });
    // kéo
    SC.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return;
        if (f.kind === 'scBlade') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(now * 22 * f.sd); blade(ctx, [[-14, -2], [14, -0.8], [18, 0], [12, 1.6], [-14, 2.2]], '#f8fafc', '#64748b'); ctx.restore(); }
        else if (f.kind === 'scSpin' || f.kind === 'scBack') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(now * 26); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(241,245,249,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 1.6); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; [0, Math.PI].forEach(o2 => { ctx.save(); ctx.rotate(o2); blade(ctx, [[0, -2], [34, -0.8], [40, 0], [32, 1.6], [0, 2.4]], '#f8fafc', '#64748b'); ctx.restore(); }); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        else if (f.kind === 'scBig') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(now * 30); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(241,245,249,0.2)'; ctx.beginPath(); ctx.arc(0, 0, f.size * 2.4, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; [0, Math.PI].forEach(o2 => { ctx.save(); ctx.rotate(o2); blade(ctx, [[0, -4], [f.size * 2, -1.5], [f.size * 2.4, 0], [f.size * 1.9, 3], [0, 4.5]], '#ffffff', '#475569'); ctx.restore(); }); ctx.restore(); }
    });
    players.forEach(p => { // Kéo · đang giữ Kỹ Thuật Cao
        if (p.hp <= 0 || !(p.scChargeT > 0)) return; const h = Math.min(2, p.scChargeT), k = h / 2;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(now * (10 + h * 10)); [0, Math.PI].forEach(o2 => { ctx.save(); ctx.rotate(o2); blade(ctx, [[p.radius, -2], [p.radius + 30 + h * 12, -0.8], [p.radius + 34 + h * 12, 0], [p.radius + 28 + h * 12, 1.6], [p.radius, 2.4]], '#f8fafc', '#64748b'); ctx.restore(); }); ctx.restore();
        if (h >= 1) { ctx.strokeStyle = `rgba(241,245,249,${0.3 + Math.sin(now * 14) * 0.15})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 110, 0, Math.PI * 2); ctx.stroke(); }
        ctx.strokeStyle = h >= 2 ? '#fde047' : '#e2e8f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
    });
    // mảnh Ma Đao + dòng khí tím
    const me = localPlayer();
    MDS.forEach(s => { const o = players.find(q => q.id === s.owner); if (o && o === me && s.tid === undefined) { ctx.strokeStyle = 'rgba(126,34,206,0.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(o.x, o.y); ctx.stroke(); } ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(168,85,247,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#d8b4fe'; ctx.beginPath(); ctx.moveTo(-5, -1.6); ctx.lineTo(6, 0); ctx.lineTo(-5, 1.6); ctx.closePath(); ctx.fill(); ctx.restore(); });
    W6.forEach(f => {
        if (f.kind === 'mdFly') { ctx.save(); const o = players.find(q => q.id === f.owner); if (o) { const a = Math.atan2(o.y - f.y, o.x - f.x); ctx.translate(f.x, f.y); ctx.rotate(a); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(192,132,252,0.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.fillStyle = '#f5d0fe'; ctx.beginPath(); ctx.moveTo(-5, -1.6); ctx.lineTo(7, 0); ctx.lineTo(-5, 1.6); ctx.closePath(); ctx.fill(); } ctx.restore(); }
        else if (f.kind === 'mdVolley') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.globalCompositeOperation = 'lighter'; const L = 40 + Math.min(80, f.n * 4); ctx.fillStyle = 'rgba(168,85,247,0.35)'; ctx.fillRect(-L, -14, L, 28); for (let i = 0; i < Math.min(14, f.n); i++) { ctx.fillStyle = '#f5d0fe'; const y = (i % 5 - 2) * 6, x = -((i * 7) % L); ctx.beginPath(); ctx.moveTo(x - 6, y - 1.6); ctx.lineTo(x + 6, y); ctx.lineTo(x - 6, y + 1.6); ctx.closePath(); ctx.fill(); } ctx.restore(); }
        else if (f.kind === 'mdBigBlade') { const o = players.find(q => q.id === f.owner); if (!o) return; f.t -= 1 / 60; const k = Math.max(0, f.t / 0.5), fall = 1 - k; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(f.a); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(147,51,234,${0.18 * k + 0.05})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, f.R, -0.55, 0.55); ctx.closePath(); ctx.fill(); ctx.rotate(-0.9 + fall * 0.9); const g = ctx.createLinearGradient(0, 0, f.R, 0); g.addColorStop(0, 'rgba(168,85,247,0)'); g.addColorStop(1, `rgba(233,213,255,${0.9 * k + 0.1})`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(f.R, -3); ctx.lineTo(f.R + 14, 0); ctx.lineTo(f.R, 4); ctx.lineTo(10, 8); ctx.closePath(); ctx.fill(); ctx.restore(); }
    });
    players.forEach(p => {
        if (p.hp <= 0) return;
        if (p.mdField) { const F = p.mdField; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(F.x, F.y, 10, F.x, F.y, F.R); g.addColorStop(0, 'rgba(88,28,135,0.05)'); g.addColorStop(1, 'rgba(126,34,206,0.25)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(F.x, F.y, F.R, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < 40; i++) { const a = now * (2 + (i % 5)) + i * 2.4, r = ((i * 53) % F.R); ctx.save(); ctx.translate(F.x + Math.cos(a) * r, F.y + Math.sin(a) * r); ctx.rotate(a * 3); ctx.fillStyle = 'rgba(233,213,255,0.85)'; ctx.beginPath(); ctx.moveTo(-5, -1.5); ctx.lineTo(6, 0); ctx.lineTo(-5, 1.5); ctx.closePath(); ctx.fill(); ctx.restore(); } ctx.restore(); }
        if (p.mdTornadoT > world.time) { ctx.save(); ctx.translate(p.x, p.y); for (let i = 0; i < 14; i++) { const a = now * 9 + i * Math.PI * 2 / 14, r = 40 + (i % 3) * 14; ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = '#d8b4fe'; ctx.beginPath(); ctx.moveTo(-5, -1.5); ctx.lineTo(6, 0); ctx.lineTo(-5, 1.5); ctx.closePath(); ctx.fill(); ctx.restore(); } ctx.restore(); }
    });
    ctx.restore();
};
