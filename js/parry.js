/** ==================== HIỆU ỨNG PHẢN ĐẠN MƯỢT HƠN · THẺ PHẢN ĐÒN ====================
 *  Nạp sau weaponkit.js.
 */

/* ============================== PHẢN ĐẠN: phát hiện mọi viên đạn đổi chủ (Phản Xạ, Katana, Kiếm Vô Niệm, thế đỡ, tường phản xạ…) ============================== */
function reflectFx(b) {
    const col = b.color && b.color[0] === '#' ? b.color : '#fde68a';
    ring(b.x, b.y, 4, 34, '#fef9c3', 0.28, 3);
    directionalSpark(b.x, b.y, b.angle, '#fde68a', 7, 360, 0.35);
    spark(b.x, b.y, col, 4, 140, 0.25, 2);
}
function trackReflects() {
    bullets.forEach(b => {
        if (b._own === undefined) { b._own = b.owner; b._ang = b.angle; return; }
        const turned = Math.abs(angleDiff(b.angle, b._ang)) > 1.2 && !b.boomerang && !b.homing && !(b.bounces >= 0 && b._bn !== undefined && b.bounces < b._bn);
        if (b.owner !== b._own || (turned && b.owner !== b._own)) { b.refT = world.time; reflectFx(b); }
        b._own = b.owner; b._ang = b.angle; b._bn = b.bounces;
    });
}
const _upe12 = updatePartyExtras;
updatePartyExtras = function (dt) { trackReflects(); _upe12(dt); trackReflects(); };
// gửi cờ "vừa bị phản" cho máy khách để vẽ hào quang
const _buildSnapshot12 = buildSnapshot;
buildSnapshot = function () {
    const s = _buildSnapshot12();
    s.rf = []; bullets.forEach((b, i) => { if (b.refT && world.time - b.refT < 0.6) s.rf.push(i); });
    return s;
};
const _applySnapshot12 = applySnapshot;
applySnapshot = function (s) { _applySnapshot12(s); (s.rf || []).forEach(i => { if (bullets[i]) bullets[i].refT = world.time; }); };
// vẽ: hào quang + vệt sáng uốn theo hướng mới
const _drawBulletFx12 = drawBulletFx;
drawBulletFx = function (b) {
    _drawBulletFx12(b);
    if (!b.refT) return;
    const age = world.time - b.refT; if (age > 0.6 || age < 0) return;
    const k = 1 - age / 0.6, L = 38 * k + 10, a = b.angle;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const tx = b.x - Math.cos(a) * L, ty = b.y - Math.sin(a) * L;
    const g = ctx.createLinearGradient(tx, ty, b.x, b.y); g.addColorStop(0, 'rgba(254,240,138,0)'); g.addColorStop(1, `rgba(254,240,138,${0.85 * k})`);
    ctx.strokeStyle = g; ctx.lineWidth = (b.size || 2) * 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
    const h = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 14 + 10 * k); h.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); h.addColorStop(0.4, `rgba(253,224,71,${0.5 * k})`); h.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(b.x, b.y, 14 + 10 * k, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
};

/* ============================== THẺ PHẢN ĐÒN ============================== */
defP('counterStrike', '🔁', 'Phản Đòn', 'Đang cầm vũ khí cận chiến (hoặc tay không) mà bị đánh cận chiến: có cơ hội chặn đòn và phản lại toàn bộ sát thương, làm kẻ đánh choáng 0.4 giây. Cơ hội: 25% · Katana 50% · Khiên 75%. Mỗi lần phản tốn rất nhiều độ bền vũ khí (1/4 độ bền tối đa).', p => { p.counterStrike = true; });
COMBOS.push({ id: 'counterMaster', a: 'counterStrike', b: 'meleeTech', name: 'Bậc Thầy Phản Đòn', desc: 'Phản Đòn +15% cơ hội và chỉ tốn một nửa độ bền.' });
(COMBOS_OF.counterStrike = COMBOS_OF.counterStrike || []).push(COMBOS[COMBOS.length - 1]); (COMBOS_OF.meleeTech = COMBOS_OF.meleeTech || []).push(COMBOS[COMBOS.length - 1]);
function counterChance(p, w) { const base = w.id === 'KATANA' ? 0.5 : (w.id === 'SHIELD' || w.id === 'ROUNDSHIELD') ? 0.75 : 0.25; return Math.min(0.9, base + (combo(p, 'counterMaster') ? 0.15 : 0)); }
const _dealDamage12 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (opts.melee && !opts.counter && target && target.st && target.hp > 0 && target.counterStrike && attackerId !== -1 && !(target.st.invuln > 0)) {
        const atk = players.find(q => q.id === attackerId), w = getCurrentWeapon(target);
        const melee = w.type === 'MELEE' || w.type === 'SHIELD' || w.id === 'NONE';
        if (atk && atk !== target && atk.hp > 0 && melee && !w.out && Math.random() < counterChance(target, w)) {
            const a = Math.atan2(atk.y - target.y, atk.x - target.x);
            // hiệu ứng phản đòn
            slashes.push({ x: target.x, y: target.y, ownerId: target.id, angle: a, range: target.radius + 40, color: '#fde047', width: 10, life: 0.22, maxLife: 0.22, swing: 1, line: false });
            ring(target.x, target.y, 6, 46, '#fde047', 0.3, 4); directionalSpark(target.x + Math.cos(a) * 18, target.y + Math.sin(a) * 18, a, '#fef08a', 8, 300, 0.35);
            floatText(target.x, target.y - 36, '🔁 PHẢN ĐÒN!', '#fde047', 15); AudioSys.playAt('block', target.x, target.y, 0.6); hitStop(0.06); addShake(5);
            atk.stun = Math.max(atk.stun, 0.4);
            if (w.durability !== undefined) { const cost = Math.max(2, Math.round((w.maxDurability || w.durability) * (combo(target, 'counterMaster') ? 0.125 : 0.25))); reduceDurability(target, w, cost); }
            return _dealDamage12(atk, dmg, target.id, { melee: true, counter: true, angle: a, knock: 260, noThorns: true });
        }
    }
    return _dealDamage12(target, dmg, attackerId, opts);
};
const _applyBuild12 = applyBuild;
applyBuild = function (p) { p.counterStrike = false; return _applyBuild12(p); };
