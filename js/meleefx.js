/** ==================== LÀM LẠI KỸ NĂNG CẬN CHIẾN (Bậc Thầy Cận Chiến) ====================
 *  Dao Ảnh Sát · Song Đao Ám Sát Liên Hoàn · Búa Nện Đất 3 vòng · Khiên Xung Kích · Cưa Máy Vòng Cưa
 *  · Tay không Liên Hoàn Quyền · hình Song Rìu & hào quang Kiếm Ánh Sáng. Nạp sau gunfx.js.
 */
const _meleeTechCast15 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p), m = (p.meleeMult || 1) * 1.25;
    switch (w.id) {
        case 'KNIFE': { // Ảnh Sát: lướt xuyên qua, chém mọi kẻ trên đường rồi tàng hình (đòn sau ×3 nhờ nội tại phục kích)
            smoke(p.x, p.y, 7, 'rgba(91,33,182,0.45)', 16);
            hitLine(p, a, 170, 28, 28 * m, { melee: true, knock: 90 });
            slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 170, color: '#c4b5fd', width: 7, life: 0.25, maxLife: 0.25, swing: 1, line: true });
            p.dashTime = 0.16; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln, 0.22); p.st.empower = Math.max(p.st.empower || 0, 1);
            p.shotQueue.push({ t: 0.18, fn: () => { if (p.hp <= 0) return; p.st.invis = Math.max(p.st.invis, 1.6); invisAs(p, 'void'); smoke(p.x, p.y, 7, 'rgba(91,33,182,0.45)', 16); floatText(p.x, p.y - 34, '🌑 ẢNH SÁT · TÀNG HÌNH', '#c4b5fd', 14); } });
            AudioSys.playAt('whoosh', p.x, p.y, 0.5);
            return;
        }
        case 'DAGGERS': { // Ám Sát + liên hoàn 4 nhát
            const before = p.x;
            _meleeTechCast15(p);
            const e = enemiesOf(p).filter(q => dist(p.x, p.y, q.x, q.y) < 90).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y))[0];
            if (e) for (let i = 0; i < 4; i++) p.shotQueue.push({ t: 0.1 + i * 0.08, fn: () => {
                if (p.hp <= 0 || e.hp <= 0 || dist(p.x, p.y, e.x, e.y) > 110) return;
                const ang = Math.atan2(e.y - p.y, e.x - p.x) + (i % 2 ? 0.6 : -0.6);
                slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: 60, color: '#c084fc', width: 5, life: 0.12, maxLife: 0.12, swing: i % 2 ? 1 : -1, line: false });
                dealDamage(e, 12 * m, p.id, { melee: true, knock: 30 }); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 1.5); e.st.burnBy = p.id; }
                AudioSys.playAt('swing', p.x, p.y, 0.3);
            } });
            return;
        }
        case 'HAMMER': { // Nện Đất: 3 vòng sóng nứt đất lan ra, vòng cuối choáng
            addShake(12); hitStop(0.06); AudioSys.playAt('slam', p.x, p.y, 0.7);
            for (let i = 0; i < 3; i++) p.shotQueue.push({ t: i * 0.18, fn: () => {
                if (p.hp <= 0) return;
                const R = 80 + i * 65;
                ring(p.x, p.y, 14, R, i === 2 ? '#fde68a' : '#d6d3d1', 0.35, 9 - i * 2); addShake(5);
                for (let k = 0; k < 8; k++) { const t = k / 8 * Math.PI * 2 + i * 0.3; beams.push({ x1: p.x + Math.cos(t) * (R - 55), y1: p.y + Math.sin(t) * (R - 55), x2: p.x + Math.cos(t + 0.15) * R, y2: p.y + Math.sin(t + 0.15) * R, life: 0.5, maxLife: 0.5, color: '#78716c', zig: 1 }); }
                enemiesOf(p).forEach(e => { const d = dist(p.x, p.y, e.x, e.y); if (!(e.air > 0) && d < R + e.radius && d > R - 75) { dealDamage(e, 22 * m, p.id, { melee: true, knock: 260, angle: Math.atan2(e.y - p.y, e.x - p.x) }); if (i === 2) { e.stun = Math.max(e.stun, 1); floatText(e.x, e.y - 30, 'CHOÁNG!', '#fde68a', 13); } } });
            } });
            floatText(p.x, p.y - 38, '🔨 NỆN ĐẤT!', '#fde68a', 16);
            return;
        }
        case 'SHIELD': // Khiên Xung Kích: lao tới húc văng, choáng, phản đạn 2 giây
            p.dashTime = 0.3; p.dashAngle = a; p.st.reflect = Math.max(p.st.reflect, 2); p.st.shield = Math.max(p.st.shield, 30); p.st.shieldT = Math.max(p.st.shieldT, 3);
            p.shieldCharge = { t: world.time + 0.34, hit: [], a };
            floatText(p.x, p.y - 38, '🛡 KHIÊN XUNG KÍCH!', '#93c5fd', 16); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
            return;
        case 'CHAINSAW':
            _meleeTechCast15(p); p.sawSpin = world.time + 3; p.sawSpinT = 0;
            ring(p.x, p.y, 8, 70, '#f97316', 0.35, 5);
            return;
        case 'NONE': // Liên Hoàn Quyền: lao tới đấm 5 cú, cú cuối hất văng & choáng
            p.dashTime = 0.25; p.dashAngle = a; p.punchCombo = { n: 5, t: 0.05, a };
            floatText(p.x, p.y - 38, '👊 LIÊN HOÀN QUYỀN!', '#fde047', 16);
            return;
    }
    return _meleeTechCast15(p);
};
function updateMeleeFx(dt) {
    players.forEach(p => {
        if (p.hp <= 0 || !p.st) { p.shieldCharge = null; p.punchCombo = null; return; }
        // Khiên xung kích: húc trúng ai thì choáng & văng
        if (p.shieldCharge) {
            const C = p.shieldCharge;
            if (world.time > C.t) p.shieldCharge = null;
            else {
                if (Math.random() < 0.8) particles.push({ x: p.x + Math.cos(C.a) * 18, y: p.y + Math.sin(C.a) * 18, vx: -Math.cos(C.a) * 120, vy: -Math.sin(C.a) * 120, life: 0.25, maxLife: 0.25, color: 'rgba(147,197,253,0.55)', size: 6, glow: true });
                enemiesOf(p).forEach(e => {
                    if (C.hit.includes(e.id) || e.air > 0 || dist(p.x, p.y, e.x, e.y) > p.radius + e.radius + 26) return;
                    C.hit.push(e.id); dealDamage(e, 30 * (p.meleeMult || 1) * 1.25, p.id, { melee: true, knock: 520, angle: C.a + (Math.random() - 0.5) * 0.6 }); e.stun = Math.max(e.stun, 0.8);
                    ring(e.x, e.y, 6, 40, '#93c5fd', 0.3, 5); addShake(7); hitStop(0.05); AudioSys.playAt('block', e.x, e.y, 0.6);
                });
            }
        }
        // Cưa Máy: vòng cưa quanh người khi Cuồng Cưa
        if (p.sawSpin > world.time && getCurrentWeapon(p).id === 'CHAINSAW') {
            p.sawSpinT -= dt;
            if (Math.random() < 0.7) { const t = world.time * 14 + Math.random(); spark(p.x + Math.cos(t) * 52, p.y + Math.sin(t) * 52, Math.random() < 0.5 ? '#fbbf24' : '#f97316', 1, 160, 0.25, 2); }
            if (p.sawSpinT <= 0) { p.sawSpinT = 0.15; enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < 70 + e.radius) dealDamage(e, 6 * (p.meleeMult || 1), p.id, { melee: true, knock: 40 }); }); }
        }
        // Liên hoàn quyền
        if (p.punchCombo) {
            const P = p.punchCombo; P.t -= dt;
            if (P.t <= 0) {
                P.t = 0.08; const last = P.n === 1, a = P.a;
                const hx = p.x + Math.cos(a) * (p.radius + 26), hy = p.y + Math.sin(a) * (p.radius + 26);
                ring(hx, hy, 4, last ? 50 : 24, '#fde047', 0.2, last ? 6 : 3); spark(hx, hy, '#fef08a', last ? 12 : 4, last ? 320 : 180);
                enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(hx, hy, e.x, e.y) < (last ? 60 : 42) + e.radius) { dealDamage(e, (last ? 16 : 6) * (p.meleeMult || 1), p.id, { melee: true, knock: last ? 650 : 60, angle: a }); if (last) e.stun = Math.max(e.stun, 0.6); } });
                AudioSys.playAt(last ? 'slam' : 'hit', p.x, p.y, last ? 0.6 : 0.3); if (last) { addShake(8); hitStop(0.06); }
                if (--P.n <= 0) p.punchCombo = null;
            }
        }
    });
}
const _upe15 = updatePartyExtras;
updatePartyExtras = function (dt) { _upe15(dt); updateMeleeFx(dt); };
const _applyBuild15 = applyBuild;
applyBuild = function (p) { _applyBuild15(p); p.shieldCharge = null; p.punchCombo = null; p.sawSpin = 0; };

// vùng ngắm cho kỹ năng mới
const _skillProfile15 = skillProfile;
skillProfile = function (p, id) {
    if (id === 'meleeTech') {
        const w = getCurrentWeapon(p).id;
        if (w === 'KNIFE') return { aim: 'dir', R: 170, shape: 'line', w: 40, col: '196,181,253', tag: '🌑 ẢNH SÁT' };
        if (w === 'SHIELD') return { aim: 'dir', R: 240, shape: 'line', w: 56, col: '147,197,253', tag: '🛡 XUNG KÍCH' };
        if (w === 'NONE') return { aim: 'dir', R: 150, shape: 'line', w: 44, col: '253,224,71', tag: '👊 LIÊN HOÀN' };
    }
    return _skillProfile15(p, id);
};

// vẽ: Song Rìu cầm 2 tay có lửa · hào quang Kiếm Ánh Sáng · vòng cưa
const _drawPlayerExtras15 = drawPlayerExtras;
drawPlayerExtras = function (p, w, now) {
    _drawPlayerExtras15(p, w, now);
    if (p.dualAxe > world.time && w.id === 'AXE') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.fillStyle = '#78350f'; ctx.fillRect(p.radius - 6, -p.radius * 0.6 - 2, 26, 4);
        const g = ctx.createLinearGradient(p.radius + 14, -p.radius * 0.6 - 12, p.radius + 30, -p.radius * 0.6 + 6); g.addColorStop(0, '#fed7aa'); g.addColorStop(1, '#ea580c');
        ctx.fillStyle = g; ctx.beginPath(); const y0 = -p.radius * 0.6; ctx.moveTo(p.radius + 14, y0 - 3); ctx.quadraticCurveTo(p.radius + 30, y0 - 15, p.radius + 32, y0 - 4); ctx.quadraticCurveTo(p.radius + 30, y0 + 7, p.radius + 14, y0 + 3); ctx.closePath(); ctx.fill();
        ctx.restore();
        if (Math.random() < 0.6) particles.push({ x: p.x + Math.cos(p.angle) * (p.radius + 24) + (Math.random() - 0.5) * 10, y: p.y + Math.sin(p.angle) * (p.radius + 24) + (Math.random() - 0.5) * 10, vx: 0, vy: -50, life: 0.35, maxLife: 0.35, color: Math.random() < 0.5 ? '#f97316' : '#facc15', size: 4, glow: true });
    }
    if (p.saberEmp && p.saberEmp.t > world.time) {
        const col = saberColor(p);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, p.radius + 22); g.addColorStop(0, hexA(col, 0.45)); g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 22, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = hexA(col, 0.8); ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -now * 60; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 12, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = `700 10px ${FONT}`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText('✦'.repeat(Math.max(0, p.saberEmp.left)), p.x, p.y + p.radius + 22);
        ctx.restore();
    }
    if (p.sawSpin > world.time && w.id === 'CHAINSAW') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(now * 14);
        ctx.strokeStyle = 'rgba(249,115,22,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
    }
};
CARDS.meleeTech.desc = CARDS.meleeTech.desc.replace('Dao, Song Đao, Búa, Khiên, tay không: như cũ (lướt nhỏ, Ám Sát, Địa Chấn, Phản Đòn, Đấm Ngàn Cân).',
    '<b>Dao</b>: S Ảnh Sát — lướt xuyên chém mọi kẻ trên đường rồi tàng hình 1.6 giây (đòn kế ×3). <b>Song Đao</b>: S Ám Sát + 4 nhát liên hoàn gây chảy máu. <b>Búa</b>: S Nện Đất — 3 vòng sóng nứt đất, vòng cuối choáng. <b>Khiên</b>: S Xung Kích — lao húc văng, choáng, phản đạn. <b>Tay không</b>: S Liên Hoàn Quyền — 5 cú đấm, cú cuối hất văng. <b>Cưa Máy</b> thêm vòng cưa quanh người.');
