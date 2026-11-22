/** ==================== HIỆU ỨNG CHÉM/ĐÂM MỚI · LÀM LẠI HỎA MAI, XÍCH KIẾM (URUMI), KIẾM XÀ, ÁM KHÍ ====================
 *  Nạp sau weapons5.js.
 */

/* ============================== 1) HIỆU ỨNG CHÉM · ĐÂM ============================== */
// Chém: vệt kiếm quét theo cung (đầu vệt chạy trước, đuôi đuổi theo), mép lưỡi sáng, vệt tốc độ, tia sáng ở đầu lưỡi
//        + lúc đầu thoáng hiện vùng trúng đòn thật (để thấy chính xác đòn trúng tới đâu).
// Đâm: mũi thọc phóng nhanh rồi rút, thân thon dần, vòng xung ở mũi, vùng trúng hình thanh.
const easeOut = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
drawSlashFx = function (s, so) {
    const k = Math.max(0, s.life / s.maxLife), t = 1 - k, col = s.color && s.color[0] === '#' && s.color.length === 7 ? s.color : '#f1f5f9';
    ctx.save(); ctx.translate(so.x, so.y - (so.airH || 0)); ctx.rotate(s.angle); ctx.lineCap = 'round';
    const R = s.range, fade = Math.min(1, k * 1.6);
    if (s.line) {
        const base = (so.radius || 15) * 0.7, out = easeOut(t * 4.5), ext = base + (R - base) * out * (t > 0.55 ? 1 - (t - 0.55) * 0.4 : 1), wd = 3 + s.width * 0.5;
        // viền vùng trúng (chớp nhẹ lúc đầu)
        if (t < 0.35) { ctx.strokeStyle = hexA(col, 0.35 * (1 - t / 0.35)); ctx.lineWidth = 1; ctx.setLineDash([5, 5]); rrect(ctx, base, -wd * 2.2, R - base, wd * 4.4, wd * 2); ctx.stroke(); ctx.setLineDash([]); }
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = hexA(col, 0.35 * fade); ctx.lineWidth = wd * 4.5; ctx.beginPath(); ctx.moveTo(base + (ext - base) * 0.35, 0); ctx.lineTo(ext, 0); ctx.stroke(); // quầng
        const g = ctx.createLinearGradient(base, 0, ext, 0); g.addColorStop(0, hexA(col, 0)); g.addColorStop(0.45, hexA(col, 0.9 * fade)); g.addColorStop(1, `rgba(255,255,255,${fade})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(base, -wd * 0.6); ctx.lineTo(ext - wd * 2.6, -wd * 1.2); ctx.lineTo(ext + wd * 1.6, 0); ctx.lineTo(ext - wd * 2.6, wd * 1.2); ctx.lineTo(base, wd * 0.6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${fade})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(base + (ext - base) * 0.3, 0); ctx.lineTo(ext + wd * 1.2, 0); ctx.stroke(); // lõi trắng
        ctx.strokeStyle = hexA(col, 0.6 * fade); ctx.lineWidth = 1.2;
        for (const sg of [-1, 1]) { const off = wd * (2 + t * 3); ctx.beginPath(); ctx.moveTo(base + (ext - base) * 0.15, sg * off); ctx.lineTo(ext - wd * 3.2, sg * off * 0.4); ctx.stroke(); } // vệt tốc độ
        const pr = Math.min(1, t * 3); ctx.strokeStyle = `rgba(255,255,255,${0.85 * fade})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ext, 0, 5 + pr * 12, -1.15, 1.15); ctx.stroke(); // vòng xung ở mũi
        ctx.fillStyle = `rgba(255,255,255,${fade})`; ctx.beginPath(); ctx.arc(ext, 0, 2.5 + 3 * fade, 0, Math.PI * 2); ctx.fill();
    } else {
        const sw = s.swing || 1, half = s.arc ? Math.min(Math.PI, s.arc) : 1.15, span = half * 2;
        const head = easeOut(t * 3), tail = easeOut(Math.max(0, t - 0.3) * 1.45);
        const a0 = -half * sw, aH = a0 + span * sw * head, aT = a0 + span * sw * tail;
        const th = Math.min(R * 0.6, Math.max(12, s.width * 1.7 + 9));
        // viền vùng trúng (chớp nhẹ lúc đầu)
        if (t < 0.35) { ctx.strokeStyle = hexA(col, 0.3 * (1 - t / 0.35)); ctx.lineWidth = 1; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, -half, half); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); }
        ctx.globalCompositeOperation = 'lighter';
        const lo = Math.min(aT, aH), hi = Math.max(aT, aH);
        if (hi - lo > 0.01) {
            ctx.strokeStyle = hexA(col, 0.2 * fade); ctx.lineWidth = th * 1.5; ctx.beginPath(); ctx.arc(0, 0, R - th * 0.5, lo, hi); ctx.stroke(); // quầng
            const N = 22; ctx.beginPath();
            for (let i = 0; i <= N; i++) { const u = i / N, a = aT + (aH - aT) * u; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
            for (let i = N; i >= 0; i--) { const u = i / N, a = aT + (aH - aT) * u, ww = th * (0.1 + 0.9 * Math.pow(u, 1.3)); ctx.lineTo(Math.cos(a) * (R - ww), Math.sin(a) * (R - ww)); }
            ctx.closePath();
            const g = ctx.createRadialGradient(0, 0, Math.max(1, R - th), 0, 0, R + 1); g.addColorStop(0, hexA(col, 0.05 * fade)); g.addColorStop(0.45, hexA(col, 0.85 * fade)); g.addColorStop(1, `rgba(255,255,255,${fade})`);
            ctx.fillStyle = g; ctx.fill(); // thân vệt
            ctx.strokeStyle = `rgba(255,255,255,${fade})`; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, R, lo + (hi - lo) * 0.15, hi); ctx.stroke(); // mép lưỡi
            ctx.strokeStyle = hexA(col, 0.5 * fade); ctx.lineWidth = 1.2;
            [0.6, 0.76].forEach(f => { ctx.beginPath(); ctx.arc(0, 0, R * f, lo + (hi - lo) * 0.35, hi); ctx.stroke(); }); // vệt tốc độ
        }
        const hx = Math.cos(aH) * R, hy = Math.sin(aH) * R;
        ctx.fillStyle = `rgba(255,255,255,${fade})`; ctx.beginPath(); ctx.arc(hx, hy, 2.5 + 3 * fade, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * fade})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx - 8 * fade, hy); ctx.lineTo(hx + 8 * fade, hy); ctx.moveTo(hx, hy - 8 * fade); ctx.lineTo(hx, hy + 8 * fade); ctx.stroke();
    }
    ctx.restore();
};

/* ============================== 2) SÚNG HỎA MAI ============================== */
// Nội tại THẾ NGẮM: khi đang ngắm (giữ) thì khụy xuống, đứng yên
const _upeMusket = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeMusket(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => {
        if (p.hp <= 0) return; const w = getCurrentWeapon(p);
        p.musketCrouch = !!(w && w.id === 'MUSKET' && ((p.charge || 0) > 0.02 || p.musketReady));
        if (p.musketCrouch) { p.st.root = Math.max(p.st.root || 0, 0.06); p.vx *= 0.5; p.vy *= 0.5; }
    });
};
// vào thế ngắm (Kỹ Thuật Cao): phát kế tiếp luôn như tụ lực đầy
const _fireWeaponMusket = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && w.id === 'MUSKET' && p.musketReady) { p.musketReady = false; charge = 1; floatText(p.x, p.y - 44, '🎯 THẾ NGẮM: TỤ LỰC ĐẦY', '#fde68a', 13); }
    return _fireWeaponMusket(p, w, ang, charge, enemy);
};
const _gunModMusket = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'MUSKET') { // nhảy lùi → ném thuốc súng như cũ → nạp đạn ngay
        const a = aimDir(p), s = umbFreeSpot(p, p.x - Math.cos(a) * 170, p.y - Math.sin(a) * 170);
        floatText(p.x, p.y - 44, '🧨 LÙI · THUỐC SÚNG · NẠP!', '#fdba74', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
        startTravel(p, s.x, s.y, 0.3, 'umbLand', { fn: q => {
            const ang0 = q.skillAng; q.skillAng = a; try { _gunModMusket(q); } finally { q.skillAng = ang0; }
            const ww = getCurrentWeapon(q);
            if (ww && ww.id === 'MUSKET' && ww.mag < 1 && ww.reserve > 0) { ww.mag = 1; ww.reserve--; ww.reloading = false; floatText(q.x, q.y - 30, '⚡ NẠP ĐẠN NGAY', '#fde68a', 13); AudioSys.playAt('reload', q.x, q.y, 0.4); }
        } }, 45);
        return;
    }
    return _gunModMusket(p);
};
HT.MUSKET = ['KHÓI ĐEN · THẾ NGẮM', p => {
    const a = aimDir(p), d = Math.max(80, Math.min(320, p.skillDist || 220)), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    zones.push({ type: 'smoke', x, y, r: 150, t: 7, maxT: 7, owner: p.id, tick: 0, dark: true });
    for (let i = 0; i < 14; i++) particles.push({ x: x + (Math.random() - 0.5) * 120, y: y + (Math.random() - 0.5) * 120, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, life: 1.4, maxLife: 1.4, color: 'rgba(15,15,20,0.55)', size: 16, grow: true });
    const weak = enemiesOf(p).filter(e => dist(e.x, e.y, p.x, p.y) < 800).sort((u, v) => u.hp - v.hp)[0];
    if (weak) { spotFor(weak, p.id, 7); floatText(weak.x, weak.y - 52, '👁 MÁU THẤP NHẤT', '#fca5a5', 14); }
    p.musketReady = true;
    floatText(p.x, p.y - 44, '🌑 KHÓI ĐEN · VÀO THẾ NGẮM', '#e5e7eb', 15); AudioSys.playAt('whoosh', x, y, 0.5);
}];
HT_PROFILE.MUSKET = { aim: 'point', R: 320, shape: 'point', aoe: 150, arc: true, col: '82,82,91', tag: '🌑 KHÓI ĐEN + 👁 MÁU THẤP NHẤT' };
GUN_P.MUSKET = 'Nạp đạn nhanh hơn (2.8 giây thay vì 4.2).';
WEAPONS.MUSKET.desc += ' Nội tại THẾ NGẮM: khi ngắm sẽ khụy xuống, đứng yên.';
// khói đen: phủ màu tối
const _drawW2FxSmoke = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxSmoke(now);
    zones.forEach(z => { if (z.type !== 'smoke' || !z.dark) return; const a = Math.min(1, z.t / 1.2) * 0.55; const g = ctx.createRadialGradient(z.x, z.y, z.r * 0.2, z.x, z.y, z.r); g.addColorStop(0, `rgba(10,10,14,${a})`); g.addColorStop(1, 'rgba(10,10,14,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); });
    players.forEach(p => { if (p.hp > 0 && p.musketCrouch && (!p.st.invis || p === localPlayer())) { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + p.radius * 0.6, p.radius * 1.3, p.radius * 0.45, 0, 0, Math.PI * 2); ctx.fill(); ctx.font = `11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fde68a'; ctx.fillText('🎯', p.x - p.radius - 8, p.y - p.radius); ctx.restore(); } });
};

/* ============================== 3) XÍCH KIẾM (URUMI) ============================== */
// Nội tại LOẠN VŨ: bỏ qua phòng thủ. Combo: chém trái · chém phải · quất kéo (xa hơn, kéo địch về, choáng nhẹ) · xoay tròn (đau nhất)
WEAPONS.URUMI.name = 'Xích Kiếm (Urumi)';
WEAPONS.URUMI.desc = 'Nội tại LOẠN VŨ: mọi đòn BỎ QUA PHÒNG THỦ. Combo 4 đòn: chém trái · chém phải · quất kéo (xa hơn, kéo địch về phía bạn, choáng nhẹ) · xoay tròn (sát thương lớn nhất).';
function urumiLash(p, ang, len, col) { W2FX.push({ kind: 'whip', owner: p.id, a: ang, len, t: 0.24, maxT: 0.24, col: col || '#f1f5f9' }); }
urumiStrike = function (p, w, ang, enemy, mult) {
    const now = world.time;
    if (now - (p.urLast || -9) > 1.3) p.urN = 0;
    p.urLast = now; p.lastFireT = now; p.angle = ang; onAttack(p); p.stats.shots++;
    const dmg = w.damage * w4MM(p) * mult;
    if (p.urStab > 0) { // sau Kỹ Thuật Cao: 2 đòn kế luôn là đâm
        p.urStab--; p.cooldown = 20 * p.fireRateMult;
        const free = rayFree(p.x, p.y, ang, 230);
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: free.d, color: '#f8fafc', width: 6, life: 0.18, maxLife: 0.18, swing: 1, line: true });
        lineFoes(p, ang, free.d + 10, 14).forEach(e => { trueDamage(e, dmg * 1.4, p.id); spark(e.x, e.y, '#f8fafc', 8, 240); p.stats.hits++; });
        AudioSys.playAt('swing', p.x, p.y, 0.5); floatText(p.x, p.y - 34, 'ĐÂM!', '#f8fafc', 12);
        return;
    }
    const n = p.urSpinNext ? 4 : (p.urN = ((p.urN || 0) % 4) + 1); p.urSpinNext = false; if (n === 4) p.urN = 4;
    let hit = [];
    if (n <= 2) { // chém trái / phải
        p.cooldown = 16 * p.fireRateMult; const sd = n === 1 ? -1 : 1;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 130 + p.radius, color: '#e2e8f0', width: 7, life: 0.2, maxLife: 0.2, swing: sd, line: false, arc: 1.1 });
        for (let i = 0; i < 3; i++) urumiLash(p, ang + sd * (0.7 - i * 0.7), 125);
        hit = arcFoes(p, ang, 130, 1.1); hit.forEach(e => trueDamage(e, dmg, p.id));
        AudioSys.playAt('swing', p.x, p.y, 0.45);
    } else if (n === 3) { // quất kéo
        p.cooldown = 22 * p.fireRateMult; const free = rayFree(p.x, p.y, ang, 220); urumiLash(p, ang, free.d, '#fde68a');
        hit = lineFoes(p, ang, free.d + 10, 16);
        hit.forEach(e => { trueDamage(e, dmg * 1.1, p.id); const a = Math.atan2(p.y - e.y, p.x - e.x), d = Math.max(0, dist(p.x, p.y, e.x, e.y) - p.radius - e.radius - 30); const nx = e.x + Math.cos(a) * d * 0.7, ny = e.y + Math.sin(a) * d * 0.7; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } e.stun = Math.max(e.stun, 0.35); floatText(e.x, e.y - 40, '⛓ KÉO VỀ', '#fde68a', 12); });
        AudioSys.playAt('whoosh', p.x, p.y, 0.5);
    } else { // xoay tròn
        p.cooldown = 30 * p.fireRateMult; p.urN = 0;
        for (let i = 0; i < 8; i++) urumiLash(p, ang + i * Math.PI / 4, 145, i % 2 ? '#f8fafc' : '#cbd5e1');
        [0, Math.PI].forEach(o => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang + o, range: 145 + p.radius, color: '#f8fafc', width: 10, life: 0.3, maxLife: 0.3, swing: 1, line: false, arc: Math.PI / 2 }));
        hit = enemiesOf(p).filter(e => !(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 150 + e.radius); hit.forEach(e => { trueDamage(e, dmg * 2, p.id); if (has(p, 'meleeTech')) { const ea = Math.atan2(p.y - e.y, p.x - e.x), dd = Math.max(0, dist(p.x, p.y, e.x, e.y) - p.radius - e.radius - 15) * 0.35; const nx = e.x + Math.cos(ea) * dd, ny = e.y + Math.sin(ea) * dd; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } } });
        ring(p.x, p.y, 8, 150, '#e2e8f0', 0.35, 5); AudioSys.playAt('swing', p.x, p.y, 0.8); floatText(p.x, p.y - 36, '〰️ XOAY XÍCH!', '#f8fafc', 13);
    }
    p.stats.hits += hit.length;
    if (hit.length) { reduceDurability(p, w, 1); hitStop(n === 4 ? 0.06 : 0.03); addShake(n === 4 ? 5 : 2); }
};
HT.URUMI = ['LỐC KIẾM', p => { // quất 2 lần, tạo lốc kiếm ở điểm cuối hút nhẹ vào tâm; 2 đòn kế luôn là đâm
    const a = aimDir(p), d = Math.max(80, Math.min(240, p.skillDist || 220)), free = rayFree(p.x, p.y, a, d), x = p.x + Math.cos(a) * free.d, y = p.y + Math.sin(a) * free.d;
    [0, 0.12].forEach((t, i) => p.shotQueue.push({ t, fn: () => { if (p.hp <= 0) return; urumiLash(p, a + (i ? 0.12 : -0.12), free.d, '#f8fafc'); lineFoes(p, a, free.d + 10, 14).forEach(e => trueDamage(e, 14 * w4MM(p), p.id)); AudioSys.playAt('swing', p.x, p.y, 0.4); } }));
    p.shotQueue.push({ t: 0.25, fn: () => { W4FX.push({ kind: 'urVortex', owner: p.id, x, y, t: 2.2, maxT: 2.2, tick: 0 }); ring(x, y, 6, 90, '#e2e8f0', 0.4, 4); } });
    p.urStab = 2; floatText(p.x, p.y - 44, '🌪 LỐC KIẾM', '#f8fafc', 15);
}];
HT_PROFILE.URUMI = { aim: 'point', R: 240, shape: 'point', aoe: 90, col: '248,250,252', tag: '🌪 LỐC KIẾM · 2 ĐÒN ĐÂM' };
// Bậc Thầy: lướt lên, cảnh báo 0.5 giây, xoay kiếm 2 vòng hút địch vào, choáng nhẹ; đòn kế là xoay
function urumiMaster(p) {
    const a = aimDir(p), D = Math.max(40, rayFree(p.x, p.y, a, 150).d - p.radius);
    p.dashTime = D / 720; p.dashAngle = a;
    W4FX.push({ kind: 'urWarn', owner: p.id, t: 0.6, maxT: 0.6 });
    floatText(p.x, p.y - 44, '〰️ LOẠN VŨ TOÀN XOÁY…', '#f8fafc', 14);
    [0.5, 0.8].forEach((t, i) => p.shotQueue.push({ t, fn: () => {
        if (p.hp <= 0) return;
        for (let j = 0; j < 8; j++) urumiLash(p, j * Math.PI / 4 + i * 0.4, 160, '#f8fafc');
        enemiesOf(p).forEach(e => { if (e.air > 0 || dist(e.x, e.y, p.x, p.y) > 165 + e.radius) return; trueDamage(e, 24 * w4MM(p), p.id); const ea = Math.atan2(p.y - e.y, p.x - e.x), dd = Math.max(0, dist(p.x, p.y, e.x, e.y) - p.radius - e.radius - 12); const nx = e.x + Math.cos(ea) * dd * 0.6, ny = e.y + Math.sin(ea) * dd * 0.6; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } e.stun = Math.max(e.stun, 0.4); });
        ring(p.x, p.y, 8, 165, '#e2e8f0', 0.4, 6); addShake(6); AudioSys.playAt('swing', p.x, p.y, 0.8);
    } }));
    p.urSpinNext = true;
}

/* ============================== 4) KIẾM XÀ ============================== */
// Combo: chém · chém · ĐÂM (lướt tới, đau hơn, tê liệt). Nội tại: đâm sau lưng sát thương & độc mạnh hơn.
WEAPONS.SNAKESWORD.desc = 'Combo: chém · chém · ĐÂM (lướt tới nhẹ, đau hơn, tê liệt 1 giây). Mọi đòn gây ĐỘC cộng dồn. Nội tại: đâm SAU LƯNG gây ×1.8 sát thương và độc gấp đôi. Giữ: lưỡi tách đốt vươn xa như roi.';
const isBehind = (p, e) => Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), (e.angle || 0) + Math.PI)) < 1.1;
snakeStrike = function (p, w, ang, charge, mult) {
    p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
    const dmg = w.damage * w4MM(p) * mult;
    if (charge >= 0.9) { // vươn xa như roi
        p.cooldown = w.fireRate * p.fireRateMult;
        const free = rayFree(p.x, p.y, ang, 180); W2FX.push({ kind: 'whip', owner: p.id, a: ang, len: free.d, t: 0.28, maxT: 0.28, col: '#4ade80' });
        AudioSys.playAt('swing', p.x, p.y, 0.5); lineFoes(p, ang, free.d + 10, 14).forEach(e => snakeHit(p, e, dmg * 1.2)); return;
    }
    if (world.time - (p.snkLast || -9) > 1.3) p.snkN = 0; p.snkLast = world.time;
    const stab = p.snkStabNext || (p.snkN = ((p.snkN || 0) % 3) + 1) === 3; p.snkStabNext = false;
    if (stab) {
        p.cooldown = 24 * p.fireRateMult; p.kx += Math.cos(ang) * 230; p.ky += Math.sin(ang) * 230; p.snkN = 3;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 120 + p.radius, color: '#86efac', width: 7, life: 0.18, maxLife: 0.18, swing: 1, line: true });
        const hit = lineFoes(p, ang, 120 + p.radius, 18);
        hit.forEach(e => {
            const back = isBehind(p, e) || p.snkShrinkT > world.time;
            snakeHit(p, e, dmg * 1.6 * (back ? (has(p, 'meleeTech') ? 2.2 : 1.8) : 1));
            e.disarmT = world.time + 1; e.charge = 0; e.cooldown = Math.max(e.cooldown || 0, 60);
            if (back) { e.snakePoison = Math.min(8, (e.snakePoison || 0) + 2); floatText(e.x, e.y - 56, '🐍 ĐÂM SAU LƯNG!', '#22c55e', 15); }
            floatText(e.x, e.y - 44, '⛓ TÊ LIỆT', '#4ade80', 12);
        });
        if (hit.length) { reduceDurability(p, w, 1); hitStop(0.06); addShake(4); }
        AudioSys.playAt('swing', p.x, p.y, 0.55); return;
    }
    p.cooldown = w.fireRate * p.fireRateMult; AudioSys.playAt('swing', p.x, p.y, 0.45);
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 86 + p.radius, color: '#4ade80', width: 8, life: 0.18, maxLife: 0.18, swing: p.snkN === 1 ? -1 : 1, line: false, arc: Math.PI / 2.3 });
    const hit = arcFoes(p, ang, 86, Math.PI / 2.3); hit.forEach(e => snakeHit(p, e, dmg));
    if (hit.length) { reduceDurability(p, w, 1); hitStop(0.03); }
};
// không còn tê liệt mỗi đòn thứ 3 trong snakeHit (giờ đòn đâm mới tê liệt)
snakeHit = function (p, e, dmg) {
    dealDamage(e, dmg, p.id, { melee: true, knock: 120, angle: Math.atan2(e.y - p.y, e.x - p.x) }); p.stats.hits++;
    e.snakePoison = Math.min(8, (e.snakePoison || 0) + 1); e.snakePoisonT = world.time + 3; e.snakeBy = p.id; spark(e.x, e.y, '#86efac', 6, 180);
};
HT.SNAKESWORD = ['XÀ ẢNH', p => { // tàng hình, thu nhỏ, chạy nhanh; đòn kế luôn là đâm
    setInvis(p, 'camo', 4); if (typeof invisAs === 'function') invisAs(p, 'camo');
    if (!(p.snkShrinkT > world.time)) { p.snkR0 = p.radius; p.radius = Math.round(p.radius * 0.7); }
    p.snkShrinkT = world.time + 4; p.st.haste = Math.max(p.st.haste || 0, 4); p.snkStabNext = true;
    smoke(p.x, p.y, 5, 'rgba(34,197,94,0.35)', 14); floatText(p.x, p.y - 44, '🐍 XÀ ẢNH', '#4ade80', 15); AudioSys.playAt('trick', p.x, p.y, 0.4);
}];
HT_PROFILE.SNAKESWORD = { aim: null, shape: 'selfaoe', aoe: 40, col: '74,222,128', tag: '🐍 TÀNG HÌNH · THU NHỎ · ĐÂM' };
function snakeMaster(p) { // ném dao; trúng thì lướt tới mục tiêu và choáng
    const a = aimDir(p), m = muzzle(p, getCurrentWeapon(p), a);
    const b = spawnBullet(p, m.x, m.y, a, { speed: 26, damage: 18 * w4MM(p), range: 420, size: 4, color: '#86efac', trail: 40, knock: 60 }); b.snakeKnife = true;
    floatText(p.x, p.y - 44, '🗡 PHI XÀ ĐAO', '#4ade80', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
}
const _dealDamageSnake = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && target && !opts.melee && !opts.zone) {
        const b = bullets.find(q => q.snakeKnife && q.owner === attackerId && dist(q.x, q.y, target.x, target.y) < target.radius + 30);
        if (b) { b.snakeKnife = false; target.stun = Math.max(target.stun, 0.9); const s = umbFreeSpot(atk, target.x - Math.cos(b.angle) * (target.radius + atk.radius + 6), target.y - Math.sin(b.angle) * (target.radius + atk.radius + 6)); startTravel(atk, s.x, s.y, Math.max(0.1, dist(atk.x, atk.y, s.x, s.y) / 1400), null, null, 10); afterImages(atk, atk.x, atk.y, s.x, s.y, 4, '#4ade80'); floatText(target.x, target.y - 50, '💫 CHOÁNG', '#86efac', 13); }
    }
    return _dealDamageSnake(target, dmg, attackerId, opts);
};

/* ============================== 5) ÁM KHÍ ============================== */
// Nội tại HOA BƯỚC: ném thường thì lướt nhẹ theo hướng di chuyển
WEAPONS.DARTS.desc = 'Ném kim gần như VÔ HÌNH, bay rất nhanh. Nội tại HOA BƯỚC: mỗi lần ném lướt nhẹ theo hướng đang di chuyển. Đổi vũ khí: tự ném vòng 12 kim làm chậm & ngắt đòn đánh thường.';
function hoaBuoc(p, D) {
    const moving = Math.hypot(p.vx || 0, p.vy || 0) > 40;
    const a = moving ? (p.moveDir !== undefined ? p.moveDir : Math.atan2(p.vy, p.vx)) : p.angle + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
    const d = Math.max(0, rayFree(p.x, p.y, a, D).d - p.radius);
    if (d > 10) { p.dashTime = d / 720; p.dashAngle = a; if (Math.random() < 0.6) smoke(p.x, p.y, 1, 'rgba(244,244,245,0.3)', 8); }
}
const _fireWeaponDarts = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (!w || w.id !== 'DARTS') return _fireWeaponDarts(p, w, ang, charge, enemy);
    if (p.dartMulti > 0) { // sau Bậc Thầy: 3 đòn kế bắn 5 phi tiêu
        p.dartMulti--; p.cooldown = w.fireRate * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++;
        for (let i = 0; i < 5; i++) needle(p, ang + (i - 2) * 0.1, { dmg: 13 * w4DM(p), speed: 30, slow: 0.6 });
        if (!world.infiniteAmmo && w.magSize) w.mag = Math.max(0, w.mag - 1);
        AudioSys.playAt('whoosh', p.x, p.y, 0.25); hoaBuoc(p, 70); return;
    }
    const r = _fireWeaponDarts(p, w, ang, charge, enemy);
    hoaBuoc(p, 70);
    return r;
};
HT.DARTS = ['HOA VŨ TAM TRÙNG', p => { // 3 đợt vòng kim; mỗi đợt kích Hoa Bước lướt xa hơn
    for (let k = 0; k < 3; k++) p.shotQueue.push({ t: k * 0.28, fn: () => { if (p.hp <= 0) return; needleRing(p, 12, 9); hoaBuoc(p, 140); } });
    floatText(p.x, p.y - 44, '🌸 HOA VŨ TAM TRÙNG', '#f1f5f9', 15);
}];
HT_PROFILE.DARTS = { aim: null, shape: 'selfaoe', aoe: 260, col: '226,232,240', tag: '3 ĐỢT · LƯỚT XA' };
function dartsMaster(p) { // nhảy lên trời bay theo hướng chọn, lộn nhào phóng phi tiêu xuống dọc đường bay; 3 đòn kế bắn 5 phi tiêu
    const a = aimDir(p), d = Math.max(120, Math.min(340, p.skillDist || 300)), s = umbFreeSpot(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    startTravel(p, s.x, s.y, 0.8, 'umbLand', { fn: q => { needleRing(q, 10, 8); } }, 150);
    W4FX.push({ kind: 'dartFlip', owner: p.id, t: 0.8, maxT: 0.8 });
    for (let k = 0; k < 9; k++) p.shotQueue.push({ t: 0.06 + k * 0.08, fn: () => { if (p.hp <= 0) return; for (let i = 0; i < 4; i++) { const t = Math.random() * Math.PI * 2; needle(p, t, { x: p.x, y: p.y, dmg: 9 * w4DM(p), slow: 0.8, range: 170, speed: 20 }); } } });
    p.dartMulti = 3; floatText(p.x, p.y - 44, '🤸 PHI TIÊU LỘN NHÀO · 3 ĐÒN ×5', '#f1f5f9', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
}

/* ============================== BẬC THẦY: móc vào chuỗi kỹ năng ============================== */
const _meleeTechRw = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'URUMI') return urumiMaster(p);
    if (w && w.id === 'SNAKESWORD') return snakeMaster(p);
    return _meleeTechRw(p);
};
const _gunModRw = gunModCast;
gunModCast = function (p) { const w = getCurrentWeapon(p); if (w && w.id === 'DARTS') return dartsMaster(p); return _gunModRw(p); };
Object.assign(MELEE_P, { URUMI: 'Đòn xoay tròn hút nhẹ địch vào.', SNAKESWORD: 'Đâm sau lưng ×2.2 thay vì ×1.8.' });
const _skillProfileRw = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && id === 'meleeTech' && w.id === 'URUMI') return { aim: 'dir', R: 150, shape: 'line', w: 40, col: '248,250,252', tag: '⚠ 0.5s · XOAY 2 VÒNG' };
    if (w && id === 'meleeTech' && w.id === 'SNAKESWORD') return { aim: 'dir', R: 420, shape: 'line', w: 14, col: '74,222,128', tag: 'TRÚNG → LƯỚT + CHOÁNG' };
    if (w && id === 'gunMod' && w.id === 'DARTS') return { aim: 'point', R: 340, shape: 'point', aoe: 60, arc: true, col: '226,232,240', tag: '🤸 BAY · 3 ĐÒN ×5' };
    return _skillProfileRw(p, id);
};
CARDS.meleeTech.desc += '<br>Xích Kiếm (Urumi) = Loạn Vũ Toàn Xoáy · Kiếm Xà = Phi Xà Đao.';
CARDS.gunMod.desc += '<br>Ám Khí = Phi Tiêu Lộn Nhào · Hỏa Mai = Lùi · Thuốc Súng · Nạp.';

/* ============================== CẬP NHẬT · VẼ ============================== */
const _upeRw = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeRw(dt);
    W4FX.forEach(f => { // lốc kiếm hút nhẹ vào tâm
        if (f.kind !== 'urVortex' || f.t <= 0) return; const o = players.find(q => q.id === f.owner); if (!o) return;
        f.tick += dt;
        enemiesOf(o).forEach(e => { const d = dist(e.x, e.y, f.x, f.y); if (e.air > 0 || d > 110) return; const a = Math.atan2(f.y - e.y, f.x - e.x), mv = Math.min(d, 90 * dt); const nx = e.x + Math.cos(a) * mv, ny = e.y + Math.sin(a) * mv; if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; } });
        if (f.tick >= 0.25) { f.tick = 0; enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, f.x, f.y) < 95 + e.radius) trueDamage(e, 6 * w4MM(o), o.id); }); }
    });
    players.forEach(p => { if (p.snkShrinkT && p.snkShrinkT <= world.time) { p.snkShrinkT = 0; if (p.snkR0) p.radius = p.snkR0; } });
};
const _drawW2FxRw = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxRw(now);
    ctx.save(); ctx.lineCap = 'round';
    W4FX.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const k = Math.max(0, f.t / f.maxT);
        if (f.kind === 'urVortex') { ctx.save(); ctx.translate(f.x, f.y); ctx.globalCompositeOperation = 'lighter'; for (let j = 0; j < 6; j++) { const a = now * 9 + j * Math.PI / 3; ctx.strokeStyle = `rgba(241,245,249,${0.55 * Math.min(1, k * 3)})`; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 10; i++) { const u = i / 10, r = 15 + u * 80, aa = a + u * 2.4; ctx.lineTo(Math.cos(aa) * r, Math.sin(aa) * r); } ctx.stroke(); } ctx.restore(); }
        else if (f.kind === 'urWarn') { const pr = 1 - k; ctx.strokeStyle = `rgba(248,113,113,${0.4 + pr * 0.5})`; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -now * 40; ctx.beginPath(); ctx.arc(o.x, o.y, 165, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = `rgba(248,113,113,${0.08 + pr * 0.1})`; ctx.beginPath(); ctx.arc(o.x, o.y, 165 * pr, 0, Math.PI * 2); ctx.fill(); }
        else if (f.kind === 'dartFlip') { ctx.save(); ctx.translate(o.x, o.y - (o.airH || 0)); ctx.rotate((1 - k) * Math.PI * 4); ctx.strokeStyle = 'rgba(241,245,249,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, o.radius + 8, 0, Math.PI * 1.4); ctx.stroke(); ctx.restore(); }
    });
    ctx.restore();
};
