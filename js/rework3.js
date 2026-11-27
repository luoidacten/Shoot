/** ==================== ĐẠI ĐAO & GẬY BÓNG CHÀY: kỹ năng mới ====================
 *  Nạp sau rework2.js.
 */
const W7 = [];
const r3m = p => p.meleeMult || 1;
const r3Ease = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
function r3Land(e) { if (e.travel) { e.x = e.travel.x1; e.y = e.travel.y1; e.travel = null; } e.air = 0; e.airH = 0; } // ép kẻ đang bay rơi xuống

/* ============================== ĐẠI ĐAO ============================== */
// BẬC THẦY: PHÁ THIÊN TAM THỨC — bấm liên tiếp trong 2 giây để ra thức kế tiếp
function gsStage1(p, a) { // Bạt Sơn: lướt kéo lê đao rồi hất tung
    p.gsChain = { stage: 1, t: world.time + 2.2, a };
    p.dashTime = 0.22; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln || 0, 0.15);
    W7.push({ kind: 'gsDrag', owner: p.id, t: 0.24, T: 0.24 });
    p.shotQueue.push({ t: 0.22, fn: () => {
        if (p.hp <= 0) return;
        W7.push({ kind: 'gsUpcut', owner: p.id, a, R: 160, t: 0.35, T: 0.35 });
        let n = 0;
        enemiesOf(p).forEach(e => {
            if (e.air > 0 || dist(e.x, e.y, p.x, p.y) > 160 + e.radius || Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) > 1.05) return;
            dealDamage(e, 46 * r3m(p), p.id, { melee: true, knock: 1 }); n++;
            startTravel(e, e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40, 0.9, null, null, 70); e.stun = Math.max(e.stun, 0.9);
            floatText(e.x, e.y - 50, '⤴ HẤT TUNG', '#fb7185', 13); p.gsLift = e.id;
        });
        if (n) { hitStop(0.06); addShake(6); } AudioSys.playAt('swing', p.x, p.y, 0.7);
    } });
    floatText(p.x, p.y - 44, '⚔ THỨC 1 · BẠT SƠN', '#fb7185', 14);
}
function gsStage2(p, a) { // Đoạn Nhạc: nhảy lên bổ xuống, ép kẻ đang bay rơi đập đất
    p.gsChain.stage = 2; p.gsChain.t = world.time + 2.2;
    const tgt = players.find(q => q.id === p.gsLift && q.hp > 0 && dist(q.x, q.y, p.x, p.y) < 320);
    const D = Math.max(60, Math.min(220, p.skillDist || 180)), tx = tgt ? tgt.x - Math.cos(a) * 30 : p.x + Math.cos(a) * D, ty = tgt ? tgt.y - Math.sin(a) * 30 : p.y + Math.sin(a) * D;
    const s = umbFreeSpot(p, tx, ty); startTravel(p, s.x, s.y, 0.4, null, null, 90); p.st.invuln = Math.max(p.st.invuln || 0, 0.4);
    W7.push({ kind: 'gsRaise', owner: p.id, a, t: 0.4, T: 0.4 });
    p.shotQueue.push({ t: 0.41, fn: () => {
        if (p.hp <= 0) return;
        const R = 135; W7.push({ kind: 'gsSlam', owner: p.id, x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, a, R, t: 0.8, T: 0.8 });
        enemiesOf(p).forEach(e => { if (dist(e.x, e.y, p.x, p.y) > R + e.radius) return; const lifted = e.air > 0; r3Land(e); dealDamage(e, (lifted ? 78 : 58) * r3m(p), p.id, { melee: true, knock: 120, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, lifted ? 0.9 : 0.5); if (lifted) floatText(e.x, e.y - 44, '💥 ĐẬP ĐẤT!', '#fda4af', 15); });
        addShake(12); hitStop(0.08); AudioSys.playAt('slam', p.x, p.y, 0.8); smoke(p.x, p.y, 8, 'rgba(120,113,108,0.45)', 24);
    } });
    floatText(p.x, p.y - 44, '⚔ THỨC 2 · ĐOẠN NHẠC', '#fb7185', 14);
}
function gsStage3(p) { // Hồi Toàn Long Quyển: xoay đao 2 vòng hút địch vào rồi hất văng
    p.gsChain = null; p.gsSpin = { t: 0.9, tick: 0, n: 0 };
    p.st.root = Math.max(p.st.root || 0, 0.9);
    floatText(p.x, p.y - 44, '⚔ THỨC 3 · HỒI TOÀN LONG QUYỂN', '#fb7185', 15); AudioSys.playAt('whoosh', p.x, p.y, 0.7);
}
// KỸ THUẬT CAO: HUYẾT LONG TRẢM — tụ huyết khí 0.55 giây (giảm 40% sát thương nhận vào), chém ra trăng máu khổng lồ
function gsHT(p) {
    const a = aimDir(p); p.gsHtT = world.time + 0.55; p.gsHtA = a; p.st.root = Math.max(p.st.root || 0, 0.6);
    W7.push({ kind: 'gsGather', owner: p.id, t: 0.55, T: 0.55 });
    p.shotQueue.push({ t: 0.55, fn: () => {
        if (p.hp <= 0) return; const A = p.gsHtA;
        W7.push({ kind: 'gsWave', owner: p.id, x: p.x + Math.cos(A) * 30, y: p.y + Math.sin(A) * 30, x0: p.x, y0: p.y, a: A, d: 0, max: 560, hit: new Set(), t: 9, T: 9 });
        p.kx -= Math.cos(A) * 160; p.ky -= Math.sin(A) * 160;
        addShake(10); hitStop(0.05); AudioSys.playAt('slam', p.x, p.y, 0.6); AudioSys.playAt('whoosh', p.x, p.y, 0.8);
        floatText(p.x, p.y - 50, '🩸 HUYẾT LONG TRẢM!', '#f43f5e', 17);
    } });
    floatText(p.x, p.y - 44, '🩸 TỤ HUYẾT KHÍ…', '#fda4af', 13);
}

/* ============================== GẬY BÓNG CHÀY ============================== */
// BẬC THẦY: BÓNG NẢY HOME RUN — tung bóng rồi đập: bóng nảy tường 3 lần, trúng địch thì choáng + bay đập tường, rồi bật sang kẻ gần nhất
function batBall(p) {
    const a = aimDir(p), w = getCurrentWeapon(p), sp = 980;
    W7.push({ kind: 'bbToss', owner: p.id, a, t: 0.16, T: 0.16 });
    p.shotQueue.push({ t: 0.16, fn: () => {
        if (p.hp <= 0) return;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 80 + p.radius, color: '#fde047', width: 12, life: 0.2, maxLife: 0.2, swing: 1, line: false });
        W7.push({ kind: 'bball', owner: p.id, x: p.x + Math.cos(a) * 26, y: p.y + Math.sin(a) * 26, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, bounce: 3, chain: 3, last: -1, t: 3, T: 3, trail: [] });
        AudioSys.playAt('crit', p.x, p.y, 0.5); hitStop(0.04); addShake(3);
        floatText(p.x, p.y - 44, '⚾ BÓNG NẢY HOME RUN!', '#fde047', 15);
    } });
    if (w) reduceDurability(p, w, 1);
}
// KỸ THUẬT CAO: giữ nguyên thế đỡ bóng, nhưng nếu đánh bật được đạn thì cú kết thúc thành GRAND SLAM xoay 360°
const _batHTR3 = batHT;
batHT = function (p) { p.batRefl = 0; return _batHTR3(p); };
HT.BAT = ['ĐỠ BÓNG · GRAND SLAM', batHT];
const _updBatStanceR3 = updateBatStance;
updateBatStance = function (p) {
    const was = p.batStance > world.time, n0 = was ? bullets.filter(b => b.owner === p.id).length : 0;
    _updBatStanceR3(p);
    if (was && p.batStance > world.time) { const d = bullets.filter(b => b.owner === p.id).length - n0; if (d > 0) p.batRefl = (p.batRefl || 0) + d; }
    if (was && !p.batStance && (p.batRefl || 0) > 0 && p.hp > 0) { // vừa kết thúc thế đỡ
        const w = getCurrentWeapon(p); p.batRefl = 0;
        if (w.id === 'BAT') { [1, 2, 3].forEach(k => batSwing(p, w, p.angle + k * Math.PI / 2, 1, 1.2, false, 1)); W7.push({ kind: 'bbSlam', owner: p.id, t: 0.45, T: 0.45 }); floatText(p.x, p.y - 50, '⚾ GRAND SLAM!', '#fde047', 18); addShake(9); }
    }
};

/* ============================== MÓC VÀO HỆ THỐNG ============================== */
const _meleeTechR3 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p);
    if (w.id === 'GREATSWORD') { const a = aimDir(p), C = p.gsChain; if (C && C.t > world.time && C.stage === 1) return gsStage2(p, a); if (C && C.t > world.time && C.stage === 2) return gsStage3(p); return gsStage1(p, a); }
    if (w.id === 'BAT') return batBall(p);
    return _meleeTechR3(p);
};
const _castSkillR3 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], r = _castSkillR3(p, slot, aimVec);
    if (s && s.id === 'meleeTech' && p.gsChain && p.gsChain.t > world.time) s.cd = 0; // còn thức kế tiếp: chưa tính hồi chiêu
    return r;
};
HT.GREATSWORD = ['HUYẾT LONG TRẢM', gsHT];
HT_PROFILE.GREATSWORD = { aim: 'dir', R: 560, shape: 'line', w: 110, col: '244,63,94', tag: '🩸 TỤ KHÍ 0.55s → TRĂNG MÁU' };
const _skillProfileR3 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && id === 'meleeTech' && w.id === 'GREATSWORD') { const C = p.gsChain && p.gsChain.t > world.time ? p.gsChain.stage : 0; return C === 1 ? { aim: 'dir', R: 220, shape: 'point', aoe: 135, col: '251,113,133', tag: 'THỨC 2 · ĐOẠN NHẠC' } : C === 2 ? { aim: null, shape: 'selfaoe', aoe: 150, col: '251,113,133', tag: 'THỨC 3 · HỒI TOÀN' } : { aim: 'dir', R: 320, shape: 'cone', half: 1.05, col: '251,113,133', tag: 'THỨC 1 · BẠT SƠN (hất tung)' }; }
    if (w && id === 'meleeTech' && w.id === 'BAT') return { aim: 'dir', R: 700, shape: 'line', w: 16, col: '253,224,71', tag: '⚾ NẢY TƯỜNG 3 · BẬT 3 MỤC TIÊU' };
    return _skillProfileR3(p, id);
};
MELEE_P.GREATSWORD = '+15% sát thương, +15% hút máu, nhận ít hơn 10% sát thương.';
MELEE_P.BAT = 'Địch bị đánh bay đập tường nhận thêm 50% sát thương.';
WEAPONS.GREATSWORD.desc = (WEAPONS.GREATSWORD.desc || '') + ' · BẬC THẦY: PHÁ THIÊN TAM THỨC (bấm 3 lần: lướt hất tung → nhảy bổ đập đất → xoay đao hút rồi hất văng). KTC: HUYẾT LONG TRẢM (tụ khí rồi chém trăng máu xuyên thấu, để lại vết máu phát nổ).';
WEAPONS.BAT.desc = (WEAPONS.BAT.desc || '') + ' · BẬC THẦY: BÓNG NẢY HOME RUN. KTC: thế đỡ bóng — đánh bật được đạn thì kết thúc bằng GRAND SLAM 360°.';
const _dealDamageR3 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) { if (target && target.gsHtT > world.time) dmg *= 0.6; return _dealDamageR3(target, dmg, attackerId, opts); };
const _resetRoundR3 = resetPlayerForRound;
resetPlayerForRound = function (p) { for (let i = W7.length - 1; i >= 0; i--) if (W7[i].owner === p.id) W7.splice(i, 1); p.gsChain = null; p.gsSpin = null; p.gsHtT = 0; p.batRefl = 0; return _resetRoundR3(p); };

const _upeR3 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR3(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => {
        if (p.hp <= 0) { p.gsChain = null; p.gsSpin = null; return; }
        if (p.gsChain && (p.gsChain.t <= world.time || getCurrentWeapon(p).id !== 'GREATSWORD')) { // hết thời gian nối thức: tính hồi chiêu
            p.gsChain = null; const s = (p.skills || []).find(q => q.id === 'meleeTech'); if (s) s.cd = skillCooldown(p, 'meleeTech');
        }
        const S = p.gsSpin;
        if (S) {
            S.t -= dt; S.tick += dt;
            if (S.tick >= 0.18 && S.t > 0) { S.tick = 0; S.n++; enemiesOf(p).forEach(e => { const d = dist(e.x, e.y, p.x, p.y); if (e.air > 0 || d > 160 + e.radius) return; dealDamage(e, 13 * r3m(p), p.id, { melee: true, knock: 1 }); const a = Math.atan2(p.y - e.y, p.x - e.x), k = Math.min(40, Math.max(0, d - p.radius - e.radius - 10)); e.x += Math.cos(a) * k * 0.5; e.y += Math.sin(a) * k * 0.5; }); AudioSys.playAt('swing', p.x, p.y, 0.35); }
            if (S.t <= 0) { // hất văng
                p.gsSpin = null;
                enemiesOf(p).forEach(e => { if (e.air > 0 || dist(e.x, e.y, p.x, p.y) > 170 + e.radius) return; const a = Math.atan2(e.y - p.y, e.x - p.x); dealDamage(e, 42 * r3m(p), p.id, { melee: true, knock: 650, angle: a }); e.stun = Math.max(e.stun, 0.45); });
                W7.push({ kind: 'gsBurst', owner: p.id, x: p.x, y: p.y, t: 0.5, T: 0.5 }); addShake(10); hitStop(0.06); AudioSys.playAt('slam', p.x, p.y, 0.7);
                const s = (p.skills || []).find(q => q.id === 'meleeTech'); if (s) s.cd = skillCooldown(p, 'meleeTech');
            }
        }
    });
    for (let i = W7.length - 1; i >= 0; i--) {
        const f = W7[i]; if (!f) continue; const o = players.find(q => q.id === f.owner);
        if (!o) { W7.splice(i, 1); continue; }
        f.t -= dt;
        if (f.kind === 'gsWave') { // trăng máu bay xa, xuyên thấu, phá đạn
            const st = 820 * dt, prog = f.d / f.max, half = 50 + 50 * prog; f.x += Math.cos(f.a) * st; f.y += Math.sin(f.a) * st; f.d += st;
            enemiesOf(o).forEach(e => { if (f.hit.has(e.id) || e.air > 0) return; const rx = e.x - f.x, ry = e.y - f.y, along = rx * Math.cos(f.a) + ry * Math.sin(f.a), side = -rx * Math.sin(f.a) + ry * Math.cos(f.a); if (Math.abs(along) < 26 + e.radius && Math.abs(side) < half + e.radius) { f.hit.add(e.id); dealDamage(e, 72 * r3m(o), o.id, { melee: true, knock: 420, angle: f.a }); e.st.slow = Math.max(e.st.slow || 0, 1.2); spark(e.x, e.y, '#f43f5e', 14, 280); } });
            for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (!b) continue; if (b.owner === o.id) continue; const rx = b.x - f.x, ry = b.y - f.y; if (Math.abs(rx * Math.cos(f.a) + ry * Math.sin(f.a)) < 30 && Math.abs(-rx * Math.sin(f.a) + ry * Math.cos(f.a)) < half) bullets.splice(j, 1); }
            if (f.d >= f.max || pointInObstacle(f.x, f.y, 0)) { W7.splice(i, 1); W7.push({ kind: 'gsScar', owner: o.id, x0: f.x0, y0: f.y0, x1: f.x, y1: f.y, a: f.a, t: 1.1, T: 1.1, boom: false }); }
            continue;
        }
        if (f.kind === 'gsScar' && !f.boom && f.t <= 0.55) { // vết máu phát nổ
            f.boom = true;
            enemiesOf(o).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, f.x0, f.y0, f.x1, f.y1) < 44 + e.radius) { dealDamage(e, 30 * r3m(o), o.id, { melee: true, knock: 1 }); e.st.slow = Math.max(e.st.slow || 0, 1.5); } });
            AudioSys.playAt('explosion', (f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2, 0.4); addShake(5);
        }
        if (f.kind === 'bball') { // bóng chày nảy tường & bật sang mục tiêu kế
            f.trail.push([f.x, f.y]); if (f.trail.length > 10) f.trail.shift();
            const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt;
            if (pointInObstacle(nx, ny, 5) || nx < 5 || ny < 5 || nx > MAP_W - 5 || ny > MAP_H - 5) {
                const bx = pointInObstacle(nx, f.y, 5) || nx < 5 || nx > MAP_W - 5, by = pointInObstacle(f.x, ny, 5) || ny < 5 || ny > MAP_H - 5;
                if (bx || !by) f.vx = -f.vx; if (by || !bx) f.vy = -f.vy;
                f.bounce--; spark(f.x, f.y, '#fde047', 6, 160); AudioSys.playAt('block', f.x, f.y, 0.3);
                if (f.bounce < 0) { W7.splice(i, 1); continue; }
            } else { f.x = nx; f.y = ny; }
            const e = enemiesOf(o).find(q => q.id !== f.last && !(q.air > 0) && dist(q.x, q.y, f.x, f.y) < q.radius + 7);
            if (e) {
                const a = Math.atan2(f.vy, f.vx);
                dealDamage(e, 34 * r3m(o), o.id, { melee: true, knock: 380, angle: a }); e.stun = Math.max(e.stun, 0.7); e.batFly = { by: o.id, t: 0.45, power: 0.6, ang: a };
                floatText(e.x, e.y - 44, '⚾ BỐP!', '#fde047', 14); spark(e.x, e.y, '#fef9c3', 12, 260); hitStop(0.04); AudioSys.playAt('crit', e.x, e.y, 0.4);
                f.last = e.id; f.chain--;
                const nxt = enemiesOf(o).filter(q => q.id !== e.id && !(q.air > 0) && dist(q.x, q.y, e.x, e.y) < 420).sort((u, v) => dist(u.x, u.y, e.x, e.y) - dist(v.x, v.y, e.x, e.y))[0];
                const sp = Math.hypot(f.vx, f.vy);
                if (nxt && f.chain > 0) { const b = Math.atan2(nxt.y - e.y, nxt.x - e.x); f.vx = Math.cos(b) * sp; f.vy = Math.sin(b) * sp; }
                else if (f.chain <= 0) { W7.splice(i, 1); continue; }
                else { f.vx = -f.vx; f.vy = -f.vy; }
            }
        }
        if (f.t <= 0) W7.splice(i, 1);
    }
};

/* ============================== HÌNH VẼ ============================== */
function gsBladeShape(c, L, wid) { // lưỡi đại đao: bản rộng, sống dày, mũi vát
    c.beginPath(); c.moveTo(0, -wid * 0.45); c.lineTo(L * 0.82, -wid * 0.55); c.lineTo(L, -wid * 0.1); c.lineTo(L * 0.9, wid * 0.5); c.lineTo(0, wid * 0.5); c.closePath();
}
const _drawW2Fx3 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2Fx3(now);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    W7.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return;
        const u = 1 - Math.max(0, f.t) / f.T;
        if (f.kind === 'gsDrag') { // tia lửa kéo lê
            for (let i = 0; i < 3; i++) { const a = o.angle + Math.PI + (Math.random() - 0.5) * 0.8; spark(o.x - Math.cos(o.angle) * 26, o.y - Math.sin(o.angle) * 26, i ? '#fdba74' : '#fef3c7', 1, 160); }
            ctx.strokeStyle = 'rgba(244,63,94,0.35)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(o.x - Math.cos(o.angle) * 20, o.y - Math.sin(o.angle) * 20); ctx.lineTo(o.x - Math.cos(o.angle) * 90, o.y - Math.sin(o.angle) * 90); ctx.stroke();
        } else if (f.kind === 'gsUpcut' || f.kind === 'gsRaise') { // vung đao từ dưới lên (vệt trăng máu dọc theo hướng)
            const up = f.kind === 'gsUpcut', fade = up ? 1 - u : 0.8, R = up ? f.R : 70;
            const sweep = up ? r3Ease(Math.min(1, u / 0.5)) : 1, a0 = f.a + (up ? 1.05 : -2.2), a1 = a0 + (up ? -2.1 : 0.6) * sweep;
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade;
            const g = ctx.createRadialGradient(o.x, o.y, R * 0.4, o.x, o.y, R + 6); g.addColorStop(0, 'rgba(127,29,29,0)'); g.addColorStop(0.7, 'rgba(244,63,94,0.5)'); g.addColorStop(1, 'rgba(254,205,211,0.95)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, R + 4, Math.min(a0, a1), Math.max(a0, a1)); ctx.arc(o.x, o.y, R * 0.45, Math.max(a0, a1), Math.min(a0, a1), true); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(255,241,242,0.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(o.x, o.y, R + 2, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); ctx.restore();
            if (!up) { ctx.save(); ctx.translate(o.x, o.y - (o.airH || 0)); ctx.rotate(f.a - 1.6 + u * 0.4); ctx.fillStyle = '#9f1239'; gsBladeShape(ctx, 70, 16); ctx.fill(); ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
        } else if (f.kind === 'gsSlam' || f.kind === 'gsBurst') { // nện đất: vết nứt đỏ + sóng chấn
            const k = 1 - u, x = f.x !== undefined ? f.x : o.x, y = f.y !== undefined ? f.y : o.y, R = f.R || 170;
            ctx.save(); ctx.translate(x, y);
            ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 4, 0, 0, R); g.addColorStop(0, `rgba(254,205,211,${0.55 * k})`); g.addColorStop(0.45, `rgba(244,63,94,${0.3 * k})`); g.addColorStop(1, 'rgba(127,29,29,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(251,113,133,${k})`; ctx.lineWidth = 4 * k + 1; ctx.beginPath(); ctx.arc(0, 0, 20 + r3Ease(Math.min(1, u * 1.6)) * R, 0, Math.PI * 2); ctx.stroke();
            if (f.kind === 'gsSlam') { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = `rgba(69,10,10,${0.75 * k})`; ctx.lineWidth = 2.5; for (let i = 0; i < 9; i++) { let a = i * 0.7 + (f.a || 0), px = 0, py = 0; ctx.beginPath(); ctx.moveTo(0, 0); for (let j = 0; j < 5; j++) { a += Math.sin(i * 5 + j * 3) * 0.45; px += Math.cos(a) * 15; py += Math.sin(a) * 15; ctx.lineTo(px, py); } ctx.stroke(); } ctx.strokeStyle = `rgba(251,113,133,${0.5 * k})`; ctx.lineWidth = 1; ctx.stroke(); }
            ctx.restore();
        } else if (f.kind === 'gsGather') { // huyết khí tụ về lưỡi đao
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 14; i++) { const a = i * 0.449 + now * 2, r = 120 * (1 - ((u + i * 0.07) % 1)); ctx.fillStyle = `rgba(244,63,94,${0.7 * (1 - r / 120)})`; ctx.beginPath(); ctx.arc(o.x + Math.cos(a) * r, o.y + Math.sin(a) * r, 3, 0, Math.PI * 2); ctx.fill(); }
            const g = ctx.createRadialGradient(o.x, o.y, 4, o.x, o.y, 60); g.addColorStop(0, `rgba(254,205,211,${0.5 * u})`); g.addColorStop(1, 'rgba(244,63,94,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, 60, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (f.kind === 'gsWave') { // trăng máu
            const prog = Math.min(1, f.d / f.max), half = 50 + 50 * prog, fade = prog > 0.85 ? (1 - prog) / 0.15 : 1;
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.globalAlpha = Math.max(0, fade);
            ctx.fillStyle = 'rgba(69,10,10,0.5)'; ctx.beginPath(); ctx.moveTo(-10, -half); ctx.quadraticCurveTo(34, 0, -10, half); ctx.quadraticCurveTo(8, 0, -10, -half); ctx.fill();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, 'rgba(244,63,94,0)'); g.addColorStop(0.6, 'rgba(244,63,94,0.75)'); g.addColorStop(1, 'rgba(255,228,230,0.95)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-18, -half); ctx.quadraticCurveTo(30, 0, -18, half); ctx.quadraticCurveTo(0, 0, -18, -half); ctx.fill();
            ctx.strokeStyle = 'rgba(255,241,242,0.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-16, -half); ctx.quadraticCurveTo(28, 0, -16, half); ctx.stroke();
            for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(253,164,175,0.6)'; ctx.beginPath(); ctx.arc(-30 - i * 12 - Math.random() * 8, (Math.random() - 0.5) * half * 1.6, 2.5, 0, Math.PI * 2); ctx.fill(); }
            ctx.restore();
        } else if (f.kind === 'gsScar') { // vết máu trên đất, nổ khi đủ giờ
            const k = Math.max(0, f.t / f.T);
            ctx.save(); ctx.strokeStyle = `rgba(127,29,29,${0.7 * k})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
            ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = f.boom ? `rgba(254,205,211,${k})` : `rgba(244,63,94,${0.4 + Math.sin(now * 25) * 0.3})`; ctx.lineWidth = f.boom ? 30 * k : 3; ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke(); ctx.restore();
        } else if (f.kind === 'bbToss') { // tung bóng lên
            const h = Math.sin(u * Math.PI) * 26; ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(o.x + Math.cos(f.a) * 18, o.y + Math.sin(f.a) * 18 - h, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1; ctx.stroke();
        } else if (f.kind === 'bball') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; f.trail.forEach(([x, y], i) => { ctx.fillStyle = `rgba(253,224,71,${(i + 1) / f.trail.length * 0.35})`; ctx.beginPath(); ctx.arc(x, y, 2 + i * 0.4, 0, Math.PI * 2); ctx.fill(); }); ctx.restore();
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(now * 20); ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-6, 0, 4.5, -1, 1); ctx.stroke(); ctx.beginPath(); ctx.arc(6, 0, 4.5, Math.PI - 1, Math.PI + 1); ctx.stroke(); ctx.restore();
        } else if (f.kind === 'bbSlam') {
            const k = 1 - u; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(253,224,71,${k})`; ctx.lineWidth = 8 * k + 1; ctx.beginPath(); ctx.arc(o.x, o.y, 30 + u * 90, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
    });
    players.forEach(p => { // Hồi Toàn: đại đao xoay quanh người
        if (p.hp <= 0 || !p.gsSpin) return; const a = now * 16;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(244,63,94,0.3)'; ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(p.x, p.y, 120, a - 2.4, a); ctx.stroke(); ctx.strokeStyle = 'rgba(255,228,230,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 150, a - 1.6, a); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.fillStyle = '#9f1239'; gsBladeShape(ctx, 150, 18); ctx.fill(); ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#1c1917'; ctx.fillRect(-8, -4, 22, 8); ctx.restore();
    });
    ctx.restore();
};
