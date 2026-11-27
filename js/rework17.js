/** ==================== REWORK 17 ====================
 *  1) CƯA MÁY làm lại hoàn toàn: giữ = cưa liên tục RỒ MÁY (sát thương tăng dần), dính & kéo mục tiêu, XÉ THỊT, xé khiên;
 *     NHIỆT tăng khi cưa → quá nhiệt máy chết 1.6s; thả ra khi đã rồ ≥ 60% = LAO CƯA. Bậc Thầy: ĐĨA CƯA BAY. KTC: BÃO CƯA.
 *  2) Buff VẠN TƯỢNG toàn diện (sát thương / chịu đòn / tốc chạy / độ bền), mould ĐIỂM ĐÁNH DẤU mạnh nhất; buff thẻ CHỈ HUY SƯ ĐOÀN.
 *  3) Vẽ lại đầu gậy riêng cho từng mould (16 mould).
 *  4) HUYỀN CƠ: dạng Mở chặn đạn → đứng yên; dạng Huyền Cơ chặn đạn → bị chậm.
 */
const W17 = [];

/* ============================== 1) CƯA MÁY ============================== */
Object.assign(WEAPONS.CHAINSAW, { mode: 'auto', fireRate: 1, damage: 5, range: 78, durability: 90, maxDurability: 90, moveScale: 0.92,
    desc: 'GIỮ để cưa: máy RỒ dần (sát thương ×1 → ×2.5 trong 1.2 giây), lưỡi cưa DÍNH & kéo địch phía trước, làm chậm, xé khiên; cưa liên tục 1 giây trên cùng 1 người → XÉ THỊT (sát thương chuẩn). Cưa nóng dần — đầy NHIỆT thì máy chết 1.6 giây. THẢ RA khi đã rồ ≥ 60% → LAO CƯA xuyên qua địch. Khi đang rồ máy nhận ít hơn 30% sát thương.' });
const sawM17 = (p, w) => attackMult(p, w) * (p.meleeMult || 1);
function sawFire17(p, w, ang) {
    const now = world.time;
    p.angle = ang;
    if ((p.sawJam || 0) > now) { if (!p.isBot && (p._sawMsg || 0) < now) { p._sawMsg = now + 0.7; floatText(p.x, p.y - 34, '🔥 QUÁ NHIỆT!', '#f87171', 12); } p.cooldown = 4; return; }
    const gap = now - (p.sawLastT || -9), dt = Math.min(0.05, Math.max(0, gap));
    p.sawRev = gap < 0.2 ? Math.min(1, (p.sawRev || 0) + dt / 1.2) : 0.05;
    if (gap >= 0.2) { p.sawAcc = 0.08; AudioSys.playAt('whoosh', p.x, p.y, 0.35); }
    p.sawLastT = now; p.lastFireT = now; p.cooldown = 0; p.sawDashOk = true;
    if (inBush(p.x, p.y)) p.st.exposed = 1.2;
    p.sawHeat = Math.min(100, (p.sawHeat || 0) + dt * (has(p, 'meleeTech') ? 20 : 28));
    if (p.sawHeat >= 100) { // quá nhiệt
        p.sawJam = now + 1.6; p.sawHeat = 55; p.sawRev = 0; p.sawDashOk = false;
        smoke(p.x + Math.cos(ang) * 30, p.y + Math.sin(ang) * 30, 8, 'rgba(120,113,108,0.55)', 18); spark(p.x, p.y, '#f87171', 10, 200);
        floatText(p.x, p.y - 40, '💨 MÁY CHẾT — QUÁ NHIỆT', '#f87171', 14); AudioSys.playAt('block', p.x, p.y, 0.5);
        return;
    }
    p.sawRevT = p.sawRev > 0.4 ? now + 0.15 : 0; // giảm 30% sát thương nhận (weaponkit.js)
    p.sawAcc = (p.sawAcc || 0) + dt;
    if ((p._sawSnd || 0) < now) { p._sawSnd = now + 0.11; AudioSys.playAt('smg', p.x, p.y, 0.25 + p.sawRev * 0.3, 1600); AudioSys.playAt('chainsaw', p.x, p.y, 0.5, 1600); }
    let n = 0; while (p.sawAcc >= 0.08 && n < 3) { p.sawAcc -= 0.08; n++; sawTick17(p, w, ang); }
    if (n) onAttack(p);
}
function sawTick17(p, w, ang) {
    const now = world.time, m = sawM17(p, w), rev = p.sawRev || 0, R = 70;
    const tx = p.x + Math.cos(ang) * (p.radius + 40), ty = p.y + Math.sin(ang) * (p.radius + 40);
    const hits = arcFoes(p, ang, R, 0.55);
    hits.forEach(e => {
        dealDamage(e, 4 * (1 + 1.5 * rev) * m, p.id, { melee: true, knock: 1, angle: ang });
        e.st.slow = Math.max(e.st.slow || 0, 0.4);
        if (e.st.shield > 0) e.st.shield = Math.max(0, e.st.shield - 6);
        if (!e.travel) { e.kx += (tx - e.x) * 2.2; e.ky += (ty - e.y) * 2.2; } // dính lưỡi cưa
        e.sawN = (e.sawBy === p.id && now - (e.sawT || -9) < 0.3 ? (e.sawN || 0) : 0) + 0.08; e.sawBy = p.id; e.sawT = now;
        if (e.sawN >= 1) { e.sawN = 0; trueDamage(e, 14 * m, p.id); floatText(e.x, e.y - 44, '🩸 XÉ THỊT', '#ef4444', 13); spark(e.x, e.y, '#dc2626', 10, 240); }
        p.stats.hits++;
    });
    if (hits.length) { spark(tx, ty, Math.random() < 0.5 ? '#fbbf24' : '#f87171', 3, 220); if (Math.random() < 0.3) addShake(1.5); }
    else if (Math.random() < 0.25) spark(tx, ty, '#fde68a', 1, 120);
    const o = pointInObstacle(tx, ty, 6); if (o) { damageObstacle(o, 4 * (1 + rev), p); spark(tx, ty, '#d6d3d1', 2, 160); }
    for (const d of decoys) if (d.owner !== p.id && dist(tx, ty, d.x, d.y) < d.radius + 20) d.hp = 0;
    p.sawWear = (p.sawWear || 0) + (hits.length ? 0.08 : 0.03); // độ bền: ~2 điểm / giây khi cưa trúng
    if (p.sawWear >= 0.5) { p.sawWear = 0; reduceDurability(p, w, 4); }
}
function sawDash17(p, w) {
    const a = p.angle, rev = p.sawRev || 0, m = sawM17(p, w), D = Math.max(40, Math.min(180, rayFree(p.x, p.y, a, 190).d - p.radius));
    p.sawRev = 0; p.sawDashOk = false;
    p.dashTime = D / 900; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln || 0, 0.15);
    lineFoes(p, a, D + 30, 22).forEach(e => { dealDamage(e, 22 * (1 + rev) * m, p.id, { melee: true, knock: 320, angle: a }); e.stun = Math.max(e.stun, 0.35); spark(e.x, e.y, '#fb923c', 12, 300); });
    W17.push({ kind: 'sawDash', owner: p.id, x0: p.x, y0: p.y, a, D, t: 0.3, T: 0.3 });
    afterImages(p, p.x, p.y, p.x + Math.cos(a) * D, p.y + Math.sin(a) * D, 3, '#fb923c');
    floatText(p.x, p.y - 40, '🪚 LAO CƯA!', '#fb923c', 14); AudioSys.playAt('swing', p.x, p.y, 0.7); addShake(4);
    reduceDurability(p, w, 6);
}
const _fireWeaponR17 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && w.id === 'CHAINSAW') { if (p.disarmT > world.time) { p.cooldown = Math.max(p.cooldown, 6); return; } return sawFire17(p, w, ang); }
    return _fireWeaponR17(p, w, ang, charge, enemy);
};
// Bậc Thầy: ĐĨA CƯA BAY · KTC: BÃO CƯA
const _meleeTechR17 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'CHAINSAW') {
        const a = aimDir(p);
        W17.push({ kind: 'disc', owner: p.id, x: p.x, y: p.y, a, d: 0, max: 330, back: false, hit: new Set(), t: 4, spin: 0 });
        p.sawHeat = 0; p.sawJam = 0;
        floatText(p.x, p.y - 44, '🪚 ĐĨA CƯA BAY · TẢN NHIỆT', '#fb923c', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.6); AudioSys.playAt('smg', p.x, p.y, 0.5);
        return;
    }
    return _meleeTechR17(p);
};
HT.CHAINSAW = ['BÃO CƯA', p => { p.sawStormT = world.time + 1.6; p.sawStormTick = 0; p.sawHeat = 0; p.sawJam = 0; W17.push({ kind: 'storm', owner: p.id, t: 1.6, T: 1.6 }); floatText(p.x, p.y - 44, '🌪 BÃO CƯA', '#fb923c', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.7); }];
HT_PROFILE.CHAINSAW = { aim: null, shape: 'selfaoe', aoe: 100, col: '251,146,60', tag: '1.6s · NỔ MÁY' };
MELEE_P.CHAINSAW = 'Nóng chậm hơn 30%; hút 15% sát thương thành máu.';
const _skillProfileR17 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'CHAINSAW' && id === 'meleeTech') return { aim: 'dir', R: 330, shape: 'line', w: 40, col: '251,146,60', tag: 'ĐĨA ĐI + VỀ · XUYÊN' };
    return _skillProfileR17(p, id);
};

/* ============================== 2) BUFF VẠN TƯỢNG + CHỈ HUY ============================== */
// mọi mould: sát thương ×1.2, chịu đòn ×0.88, chạy ×1.05 · ĐIỂM ĐÁNH DẤU: sát thương ×1.5, chịu đòn ×0.8, chạy ×1.12
Object.keys(VT).forEach(k => {
    const B = VT[k].buff, mk = k === 'marker';
    B.out = (B.out || 1) * (mk ? 1.5 : 1.2); B.inn = (B.inn || 1) * (mk ? 0.8 : 0.88); B.spd = (B.spd || 1) * (mk ? 1.12 : 1.05);
    VT[k].bt = (VT[k].bt || '') + (mk ? ' · ★ MẠNH NHẤT: sát thương +50%, nhận ít hơn 20%, chạy +12%' : ' · Vạn Tượng: sát thương +20%, nhận ít hơn 12%, chạy +5%');
});
Object.assign(WEAPONS.VANTUONG, { durability: 120, maxDurability: 120 });
// Điểm Đánh Dấu: dấu nổ to & nhanh hơn
const _vtMarkUpR17 = updatePartyExtras;
updatePartyExtras = function (dt) {
    W10.forEach(f => { if (f.kind === 'mark' && !f._r17) { f._r17 = true; if (f.dmg) f.dmg *= 1.25; if (f.r) f.r *= 1.3; } });
    return _vtMarkUpR17(dt);
};
// Chỉ Huy Sư Đoàn: +200 máu, hồi chiêu nhanh hơn 25%, +10% sát thương, hồi 4 máu/giây khi không bị đánh 3 giây
const _resetR17 = resetPlayerForRound;
resetPlayerForRound = function (p) {
    const r = _resetR17(p);
    if (isCmd(p) && p.maxHp > 1) { p.maxHp += 200; p.hp = p.maxHp; p.ghostHp = p.maxHp; p.cdMult *= 0.75; p.dmgMult *= 1.1; }
    return r;
};
if (CARDS.commander) CARDS.commander.desc = (CARDS.commander.desc || '') + '<br><b>Buff:</b> +200 máu, hồi chiêu nhanh hơn 25%, +10% sát thương, tự hồi 4 máu/giây khi 3 giây không bị đánh.';

/* ============================== 4) HUYỀN CƠ: cái giá của việc chặn đạn ============================== */
const _blockArcR17 = blockBulletsArc;
blockBulletsArc = function (p, a, half, R, reflect) {
    const n = _blockArcR17(p, a, half, R, reflect);
    const w = n && half < Math.PI && getCurrentWeapon(p);
    if (w && w.id === 'UMBRELLA') {
        if (w.form === 1) { p.st.root = Math.max(p.st.root || 0, 0.45); p.vx = p.vy = 0; if (!p.isBot && (p._umbMsg || 0) < world.time) { p._umbMsg = world.time + 1; floatText(p.x, p.y - 40, '☂️ ĐỠ ĐẠN — ĐỨNG YÊN', '#38bdf8', 12); } }
        else if (w.form === 2) { p.st.slow = Math.max(p.st.slow || 0, 0.9); if (!p.isBot && (p._umbMsg || 0) < world.time) { p._umbMsg = world.time + 1; floatText(p.x, p.y - 40, '⚔️ ĐỠ ĐẠN — CHẬM LẠI', '#c084fc', 12); } }
    }
    return n;
};
WEAPONS.UMBRELLA.desc = (WEAPONS.UMBRELLA.desc || '') + ' Dạng MỞ: chặn đạn thì phải ĐỨNG YÊN. Dạng HUYỀN CƠ: chặn đạn thì bị CHẬM.';

/* ============================== CẬP NHẬT MỖI KHUNG ============================== */
const _upeR17 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR17(dt);
    const now = world.time;
    for (let i = W17.length - 1; i >= 0; i--) {
        const f = W17[i]; if (!f) continue; f.t -= dt; const o = players.find(q => q.id === f.owner);
        if (!o || f.t <= 0) { W17.splice(i, 1); continue; }
        if (f.kind === 'disc') {
            f.spin += dt; const sp = 760 * dt;
            if (!f.back) { const nx = f.x + Math.cos(f.a) * sp, ny = f.y + Math.sin(f.a) * sp; if (pointInObstacle(nx, ny, 4) || f.d >= f.max) { f.back = true; f.hit.clear(); } else { f.x = nx; f.y = ny; f.d += sp; } }
            else { const d = dist(f.x, f.y, o.x, o.y); if (d < 24 || o.hp <= 0) { W17.splice(i, 1); continue; } const b = Math.atan2(o.y - f.y, o.x - f.x); f.x += Math.cos(b) * sp; f.y += Math.sin(b) * sp; }
            enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && !(e.air > 0) && dist(e.x, e.y, f.x, f.y) < e.radius + 22) { f.hit.add(e.id); dealDamage(e, 24 * (o.meleeMult || 1), o.id, { melee: true, knock: 160, angle: Math.atan2(e.y - f.y, e.x - f.x) }); e.st.slow = Math.max(e.st.slow || 0, 1); spark(e.x, e.y, '#fb923c', 8, 240); } });
            for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (!b) continue; if (b.owner !== o.id && dist(b.x, b.y, f.x, f.y) < 26) { spark(b.x, b.y, '#fde68a', 3, 140); bullets.splice(j, 1); } }
            const ob = pointInObstacle(f.x, f.y, 10); if (ob && ob.wood) damageObstacle(ob, 6, o);
        }
    }
    players.forEach(p => {
        if (p.hp <= 0) return;
        const w = getCurrentWeapon(p), saw = w && w.id === 'CHAINSAW';
        // cưa: nguội dần, thả ra = lao cưa
        if ((p.sawHeat || 0) > 0 && now - (p.sawLastT || -9) > 0.2) p.sawHeat = Math.max(0, p.sawHeat - dt * 35);
        if (saw && p.sawDashOk && (p.sawRev || 0) >= 0.6 && now - p.sawLastT > 0.1 && now - p.sawLastT < 0.4 && !(p.stun > 0) && !p.travel) sawDash17(p, w);
        if (now - (p.sawLastT || -9) > 0.4) { p.sawDashOk = false; if ((p.sawRev || 0) > 0 && now - p.sawLastT > 0.2) p.sawRev = 0; }
        // bão cưa
        if ((p.sawStormT || 0) > now) {
            p.sawStormTick = (p.sawStormTick || 0) + dt;
            if (p.sawStormTick >= 0.1) { p.sawStormTick = 0; enemiesOf(p).forEach(e => { const d = dist(e.x, e.y, p.x, p.y); if (!(e.air > 0) && d < 100 + e.radius) { dealDamage(e, 7 * (p.meleeMult || 1), p.id, { melee: true, knock: 1 }); e.kx += (p.x - e.x) * 1.5; e.ky += (p.y - e.y) * 1.5; spark(e.x, e.y, '#fb923c', 2, 160); } }); for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (!b) continue; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < 100) bullets.splice(j, 1); } }
        } else if (p.sawStormT && p.sawStormT <= now) { p.sawStormT = 0; explode(p.x, p.y, p.id, 32, 120); floatText(p.x, p.y - 44, '💥 NỔ MÁY', '#fb923c', 14); }
        // Chỉ Huy: tự hồi máu
        if (isCmd(p) && now - (p.lastHurt || -9) > 3 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 4 * dt);
    });
};
const _resetSawR17 = resetPlayerForRound;
resetPlayerForRound = function (p) { const r = _resetSawR17(p); Object.assign(p, { sawRev: 0, sawHeat: 0, sawJam: 0, sawLastT: -9, sawDashOk: false, sawStormT: 0, sawWear: 0 }); for (let i = W17.length - 1; i >= 0; i--) if (W17[i].owner === p.id) W17.splice(i, 1); return r; };

/* ============================== VẼ ============================== */
function drawDisc17(c, x, y, R, rot, hot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); for (let i = 0; i < 24; i++) { const r = i % 2 ? R : R * 0.8, t = i * Math.PI / 12; c.lineTo(Math.cos(t) * r, Math.sin(t) * r); } c.closePath();
    const g = c.createRadialGradient(0, 0, 2, 0, 0, R); g.addColorStop(0, '#f1f5f9'); g.addColorStop(0.6, '#94a3b8'); g.addColorStop(1, hot ? '#f97316' : '#475569'); c.fillStyle = g; c.fill();
    c.lineWidth = 1; c.strokeStyle = 'rgba(15,23,42,0.8)'; c.stroke();
    c.fillStyle = '#1e293b'; c.beginPath(); c.arc(0, 0, R * 0.22, 0, Math.PI * 2); c.fill(); c.restore();
}
const _drawW2FxR17 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR17(now);
    const c = ctx; c.save();
    W17.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = 1 - f.t / f.T;
        if (f.kind === 'disc') { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(251,146,60,0.35)'; c.lineWidth = 4; c.beginPath(); c.arc(f.x, f.y, 24, f.spin * 30, f.spin * 30 + 2.2); c.stroke(); c.restore(); drawDisc17(c, f.x, f.y, 18, f.spin * 30, true); }
        else if (f.kind === 'storm') { c.save(); c.translate(o.x, o.y); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(251,146,60,${0.45 - k * 0.12})`; c.lineWidth = 6 - k * 1.5; c.beginPath(); c.arc(0, 0, 60 + k * 18, now * 14 + k * 2, now * 14 + k * 2 + 2.4); c.stroke(); } c.restore(); for (let k = 0; k < 3; k++) { const t = now * 12 + k * Math.PI * 2 / 3; drawDisc17(c, o.x + Math.cos(t) * 78, o.y + Math.sin(t) * 78, 11, now * 40, true); } }
        else if (f.kind === 'sawDash') { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(251,146,60,${0.6 * (1 - u)})`; c.lineWidth = 14 * (1 - u) + 2; c.beginPath(); c.moveTo(f.x0, f.y0); c.lineTo(f.x0 + Math.cos(f.a) * f.D, f.y0 + Math.sin(f.a) * f.D); c.stroke(); c.restore(); }
    });
    // đồng hồ RỒ MÁY / NHIỆT của cưa
    players.forEach(p => {
        if (p.hp <= 0) return; const w = getCurrentWeapon(p); if (!w || w.id !== 'CHAINSAW') return;
        const rev = p.sawRev || 0, heat = p.sawHeat || 0, jam = (p.sawJam || 0) > now; if (rev <= 0.02 && heat <= 1 && !jam) return;
        const y = p.y + p.radius + 9, W = 30;
        c.fillStyle = 'rgba(15,23,42,0.7)'; c.fillRect(p.x - W / 2 - 1, y - 1, W + 2, 7);
        c.fillStyle = rev >= 0.6 ? '#fdba74' : '#fb923c'; c.fillRect(p.x - W / 2, y, W * rev, 2.5);
        c.fillStyle = jam ? (Math.sin(now * 20) > 0 ? '#ef4444' : '#7f1d1d') : heat > 75 ? '#ef4444' : '#fca5a5'; c.fillRect(p.x - W / 2, y + 3.2, W * (jam ? 1 : heat / 100), 2.3);
        if (jam && Math.random() < 0.3) smoke(p.x + Math.cos(p.angle) * 24, p.y + Math.sin(p.angle) * 24, 1, 'rgba(120,113,108,0.4)', 10);
    });
    c.restore();
};

/* ---------- Cưa Máy cầm tay ---------- */
ART2.CHAINSAW = (c, w, r, x0, ch, now, p) => {
    const rev = p ? (p.sawRev || 0) : 0, heat = p ? (p.sawHeat || 0) / 100 : 0, jam = p && (p.sawJam || 0) > world.time;
    const shake = rev > 0.05 && !jam ? (Math.random() - 0.5) * (0.6 + rev) : 0;
    c.save(); c.translate(0, shake);
    metal(c, x0 - 12, -7, 16, 14, '#c2410c', 3, 0.45); // thân máy
    c.fillStyle = '#1c1917'; for (let i = 0; i < 3; i++) c.fillRect(x0 - 10 + i * 4, -5.5, 2, 11); // khe tản nhiệt
    metal(c, x0 - 9, -10, 9, 3.5, '#292524', 1.5); // tay cầm trên
    c.fillStyle = '#fbbf24'; c.fillRect(x0 + 1, -6.5, 2.5, 13);
    // lam cưa
    const L = 30; metal(c, x0 + 4, -3.6, L, 7.2, '#94a3b8', 3.5, 0.5);
    c.fillStyle = '#e2e8f0'; c.fillRect(x0 + 6, -1, L - 6, 1.2);
    // xích chạy
    const off = (now * (6 + rev * 40)) % 4;
    c.fillStyle = heat > 0.75 ? '#f87171' : '#1f2937';
    for (let i = -1; i < L / 4 + 1; i++) { const x = x0 + 5 + i * 4 + off; if (x < x0 + 4 || x > x0 + 4 + L) continue; c.fillRect(x, -5.2, 2.2, 1.6); c.fillRect(x0 + 4 + L - (x - x0 - 4), 3.6, 2.2, 1.6); }
    c.beginPath(); c.arc(x0 + 4 + L, 0, 3.6, -Math.PI / 2, Math.PI / 2); c.fillStyle = heat > 0.75 ? '#fca5a5' : '#64748b'; c.fill(); outl(c, 0.7);
    if (heat > 0.5) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(239,68,68,${(heat - 0.5) * 0.8})`; c.fillRect(x0 + 4, -4, L, 8); c.restore(); }
    if (rev > 0.3 && !jam && Math.random() < 0.4) { c.fillStyle = 'rgba(253,230,138,0.9)'; c.beginPath(); c.arc(x0 + 4 + L + 2, (Math.random() - 0.5) * 6, 1 + Math.random(), 0, Math.PI * 2); c.fill(); }
    c.restore();
    MUZ.CHAINSAW = x0 + 4 + L;
};

/* ============================== 3) ĐẦU GẬY RIÊNG CHO TỪNG MOULD ============================== */
const VT_HEAD17 = {
    thunder: (c, x, now, col) => { // chĩa sét 3 nhánh
        metal(c, x - 2, -3, 6, 6, '#a16207', 1.5);
        c.strokeStyle = col; c.lineWidth = 2; c.lineJoin = 'round';
        [-1, 0, 1].forEach(k => { c.beginPath(); c.moveTo(x + 3, k * 2); c.lineTo(x + 7, k * 5); c.lineTo(x + 5, k * 5 + 1.5); c.lineTo(x + 12, k * 6.5); c.stroke(); });
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(254,240,138,${0.5 + Math.random() * 0.5})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 12, -6.5); for (let i = 0; i < 4; i++) c.lineTo(x + 12 + (Math.random() - 0.5) * 4, -6.5 + i * 4.3); c.stroke(); c.restore();
    },
    steel: (c, x, now, col) => { // chuỳ thép lục giác có đinh tán
        c.beginPath(); for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3; c.lineTo(x + 6 + Math.cos(t) * 8, Math.sin(t) * 8); } c.closePath();
        const g = c.createLinearGradient(x, -8, x, 8); g.addColorStop(0, '#e2e8f0'); g.addColorStop(1, '#475569'); c.fillStyle = g; c.fill(); outl(c, 1);
        c.fillStyle = '#1e293b'; for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3 + Math.PI / 6; c.beginPath(); c.arc(x + 6 + Math.cos(t) * 5, Math.sin(t) * 5, 1, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#94a3b8'; c.beginPath(); c.arc(x + 6, 0, 2.2, 0, Math.PI * 2); c.fill();
    },
    laser: (c, x, now, col) => { // nòng phát laser mảnh, thấu kính đỏ
        metal(c, x - 1, -3.5, 13, 7, '#1f2937', 2); metal(c, x + 2, -4.5, 3, 9, '#374151', 1);
        c.fillStyle = col; c.beginPath(); c.arc(x + 12, 0, 2.8, 0, Math.PI * 2); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(244,63,94,${0.35 + Math.sin(now * 10) * 0.2})`; c.beginPath(); c.arc(x + 12, 0, 6, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(254,205,211,0.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 12, 0); c.stroke(); c.restore();
    },
    cannon: (c, x, now, col) => { // nòng pháo đồng ngắn, miệng loe
        metal(c, x - 1, -5, 11, 10, '#b45309', 3, 0.5); metal(c, x + 9, -6.5, 4, 13, '#78350f', 1.5);
        c.fillStyle = '#0c0a09'; c.beginPath(); c.arc(x + 13, 0, 3.6, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fde68a'; c.fillRect(x + 2, -5, 1.2, 10); c.fillRect(x + 6, -5, 1.2, 10);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(251,146,60,${0.25 + Math.sin(now * 5) * 0.15})`; c.beginPath(); c.arc(x + 13, 0, 4.5, 0, Math.PI * 2); c.fill(); c.restore();
    },
    marker: (c, x, now, col) => { // đèn hiệu chỉ điểm: tâm ngắm xoay + ăng-ten + hào quang hồng (mạnh nhất)
        c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(x + 7, 0, 1, x + 7, 0, 15); gl.addColorStop(0, 'rgba(244,114,182,0.7)'); gl.addColorStop(1, 'rgba(244,114,182,0)'); c.fillStyle = gl; c.beginPath(); c.arc(x + 7, 0, 15, 0, Math.PI * 2); c.fill(); c.restore();
        c.strokeStyle = '#475569'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 2, -3); c.lineTo(x - 1, -10); c.stroke(); c.fillStyle = Math.sin(now * 8) > 0 ? '#f9a8d4' : '#831843'; c.beginPath(); c.arc(x - 1, -10, 1.4, 0, Math.PI * 2); c.fill();
        c.save(); c.translate(x + 7, 0); c.rotate(now * 2.5);
        c.fillStyle = col; c.beginPath(); c.moveTo(0, -6); c.lineTo(6, 0); c.lineTo(0, 6); c.lineTo(-6, 0); c.closePath(); c.fill(); outl(c, 0.8);
        c.strokeStyle = '#fdf2f8'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, 8.5, 0, Math.PI * 2); c.stroke();
        for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, -7); c.lineTo(0, -11); c.stroke(); }
        c.restore(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 7, 0, 1.5, 0, Math.PI * 2); c.fill();
    },
    white: (c, x, now, col) => { // đũa phép ảo thuật: thân đen, đầu trắng, sao lấp lánh
        metal(c, x - 1, -2.6, 11, 5.2, '#0f172a', 2); c.fillStyle = '#f8fafc'; c.fillRect(x + 8, -2.8, 5, 5.6); outl(c, 0.6);
        for (let i = 0; i < 3; i++) { const t = now * 3 + i * 2.1, sx = x + 12 + Math.cos(t) * 6, sy = Math.sin(t) * 6; c.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 2) * 0.5})`; c.beginPath(); for (let j = 0; j < 8; j++) { const rr = j % 2 ? 0.6 : 2, a = j * Math.PI / 4; c.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } c.fill(); }
    },
    frost: (c, x, now, col) => { // cụm tinh thể băng
        [[0, 0, 13, 4], [2, -4, 9, 3], [2, 4, 9, 3], [-1, -6, 6, 2.4], [-1, 6, 6, 2.4]].forEach(([dx, dy, L, W], i) => {
            const a = Math.atan2(dy, 6); c.save(); c.translate(x + dx, dy * 0.5); c.rotate(a * 0.9);
            c.beginPath(); c.moveTo(0, -W); c.lineTo(L * 0.7, -W * 0.8); c.lineTo(L, 0); c.lineTo(L * 0.7, W * 0.8); c.lineTo(0, W); c.closePath();
            c.fillStyle = i ? 'rgba(186,230,253,0.85)' : 'rgba(224,242,254,0.95)'; c.fill(); c.strokeStyle = '#0284c7'; c.lineWidth = 0.7; c.stroke(); c.restore();
        });
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(125,211,252,${0.25 + Math.sin(now * 4) * 0.1})`; c.beginPath(); c.arc(x + 6, 0, 10, 0, Math.PI * 2); c.fill(); c.restore();
    },
    flame: (c, x, now, col) => { // đuốc lửa
        metal(c, x - 1, -4, 7, 8, '#57534e', 2); c.fillStyle = '#292524'; c.fillRect(x + 5, -5, 2, 10);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { const fl = Math.sin(now * (14 + i * 3) + i) * 1.5; c.fillStyle = ['rgba(239,68,68,0.6)', 'rgba(249,115,22,0.7)', 'rgba(253,224,71,0.85)'][i]; c.beginPath(); c.moveTo(x + 6, -5 + i * 1.5); c.quadraticCurveTo(x + 16 - i * 2 + fl, -1, x + 20 - i * 3 + fl, 0); c.quadraticCurveTo(x + 16 - i * 2 + fl, 1, x + 6, 5 - i * 1.5); c.closePath(); c.fill(); }
        c.restore();
    },
    gravity: (c, x, now, col) => { // quả cầu tím có vành xoay
        const g = c.createRadialGradient(x + 6, -1, 1, x + 7, 0, 7); g.addColorStop(0, '#ddd6fe'); g.addColorStop(0.5, '#7c3aed'); g.addColorStop(1, '#1e1b4b'); c.fillStyle = g; c.beginPath(); c.arc(x + 7, 0, 6.5, 0, Math.PI * 2); c.fill(); outl(c, 0.8);
        c.save(); c.translate(x + 7, 0); [0, 1].forEach(k => { c.save(); c.rotate(now * (k ? -2 : 3) + k); c.scale(1, 0.35); c.strokeStyle = k ? 'rgba(196,181,253,0.8)' : 'rgba(167,139,250,0.9)'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, 10 + k * 2, 0, Math.PI * 2); c.stroke(); c.restore(); }); c.restore();
    },
    wind: (c, x, now, col) => { // cánh quạt gió xoay
        metal(c, x - 1, -2.5, 6, 5, '#065f46', 1.5);
        c.save(); c.translate(x + 8, 0); c.rotate(now * 18);
        for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(4, -2, 8, -1); c.quadraticCurveTo(5, 2, 0, 0); c.fillStyle = 'rgba(110,231,183,0.9)'; c.fill(); c.strokeStyle = '#047857'; c.lineWidth = 0.6; c.stroke(); }
        c.restore(); c.fillStyle = '#ecfdf5'; c.beginPath(); c.arc(x + 8, 0, 1.6, 0, Math.PI * 2); c.fill();
    },
    blood: (c, x, now, col) => { // lưỡi hái máu cong + giọt máu
        metal(c, x - 1, -2.5, 6, 5, '#450a0a', 1.5);
        c.beginPath(); c.moveTo(x + 4, -2); c.quadraticCurveTo(x + 16, -12, x + 20, -2); c.quadraticCurveTo(x + 14, -6, x + 6, 2); c.closePath();
        const g = c.createLinearGradient(x + 4, -10, x + 20, 0); g.addColorStop(0, '#fecaca'); g.addColorStop(1, '#991b1b'); c.fillStyle = g; c.fill(); outl(c, 0.8);
        const dy = ((now * 10) % 8); c.fillStyle = '#dc2626'; c.beginPath(); c.arc(x + 17, 1 + dy, 1.3, 0, Math.PI * 2); c.fill();
    },
    chain: (c, x, now, col) => { // xích treo + móc
        c.strokeStyle = '#94a3b8'; c.lineWidth = 1.5; const sw = Math.sin(now * 4) * 2;
        for (let i = 0; i < 3; i++) { c.save(); c.translate(x + 2 + i * 4.5, sw * i * 0.4); c.rotate(i % 2 ? Math.PI / 2 : 0); c.beginPath(); c.ellipse(0, 0, 2.8, 1.6, 0, 0, Math.PI * 2); c.stroke(); c.restore(); }
        c.save(); c.translate(x + 15, sw * 1.2); c.strokeStyle = '#cbd5e1'; c.lineWidth = 2; c.beginPath(); c.arc(0, 2.5, 3.5, -Math.PI / 2, Math.PI * 0.9); c.stroke(); c.restore();
    },
    eshield: (c, x, now, col) => { // đĩa khiên năng lượng lục giác
        c.save(); c.translate(x + 6, 0);
        c.beginPath(); for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3 + Math.PI / 6; c.lineTo(Math.cos(t) * 9, Math.sin(t) * 9); } c.closePath();
        c.fillStyle = `rgba(56,189,248,${0.35 + Math.sin(now * 5) * 0.1})`; c.fill(); c.strokeStyle = '#e0f2fe'; c.lineWidth = 1.2; c.stroke();
        c.strokeStyle = 'rgba(186,230,253,0.6)'; c.lineWidth = 0.6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-8 + i * 0, 0); const t = i * Math.PI / 3; c.moveTo(Math.cos(t) * -8, Math.sin(t) * -8); c.lineTo(Math.cos(t) * 8, Math.sin(t) * 8); c.stroke(); }
        c.restore();
    },
    esword: (c, x, now, col) => { // lưỡi kiếm năng lượng
        metal(c, x - 2, -5, 3, 10, '#64748b', 1);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(125,211,252,0.35)'; c.beginPath(); c.moveTo(x + 1, -4.5); c.lineTo(x + 22, 0); c.lineTo(x + 1, 4.5); c.closePath(); c.fill(); c.restore();
        c.fillStyle = '#e0f2fe'; c.beginPath(); c.moveTo(x + 1, -2.5); c.lineTo(x + 20, 0); c.lineTo(x + 1, 2.5); c.closePath(); c.fill(); outl(c, 0.6);
    },
    egun: (c, x, now, col) => { // nòng súng vàng + thước ngắm
        metal(c, x - 1, -3.5, 14, 7, '#a16207', 2, 0.5); metal(c, x + 12, -2.4, 5, 4.8, '#facc15', 1.2);
        c.fillStyle = '#0c0a09'; c.fillRect(x + 16, -1, 1.5, 2); metal(c, x + 3, -6.5, 5, 3, '#713f12', 1);
        c.fillStyle = '#ef4444'; c.beginPath(); c.arc(x + 5.5, -5.5, 0.9, 0, Math.PI * 2); c.fill();
    },
    beam: (c, x, now, col) => { // lăng kính phát sóng
        c.save(); c.translate(x + 6, 0); c.rotate(now * 1.5);
        c.beginPath(); c.moveTo(0, -8); c.lineTo(7, 0); c.lineTo(0, 8); c.lineTo(-7, 0); c.closePath(); const g = c.createLinearGradient(-7, -8, 7, 8); g.addColorStop(0, '#fae8ff'); g.addColorStop(1, '#a21caf'); c.fillStyle = g; c.fill(); outl(c, 0.8); c.restore();
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(232,121,249,0.8)'; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i <= 10; i++) { const xx = x + 12 + i * 1.2; c.lineTo(xx, Math.sin(i * 1.2 - now * 20) * 2.5); } c.stroke(); c.restore();
    }
};
ART2.VANTUONG = (c, w, r, x0, ch, now, p) => {
    const key = w.mods ? vtCur(w) : 'thunder', M = VT[key] || VT.thunder, other = w.mods ? VT[vtOther(w)] : null, hx = x0 + 34;
    // cán gậy: gỗ + đai kim loại theo màu mould
    wood(c, x0 - 10, -2.2, 44, 4.4, 2);
    c.fillStyle = M.col; c.fillRect(x0 - 2, -2.6, 2, 5.2); c.fillRect(x0 + 14, -2.6, 2, 5.2); c.fillRect(hx - 4, -2.8, 3, 5.6);
    if (other) { c.fillStyle = other.col; c.beginPath(); c.arc(x0 - 8, 0, 2.2, 0, Math.PI * 2); c.fill(); outl(c, 0.5); } // ngọc ở chuôi = mould còn lại
    // hào quang đổi mould
    if ((p && p._vtSwapFx || 0) > world.time) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = M.col + '55'; c.beginPath(); c.arc(hx + 7, 0, 16, 0, Math.PI * 2); c.fill(); c.restore(); }
    c.save(); (VT_HEAD17[key] || VT_HEAD17.thunder)(c, hx, now, M.col); c.restore();
    if (ch > 0.1) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = hexA(M.col, 0.25 + ch * 0.4); c.beginPath(); c.arc(hx + 7, 0, 6 + ch * 6, 0, Math.PI * 2); c.fill(); c.restore(); }
    MUZ.VANTUONG = hx + 14;
};
