/** ==================== 6 VŨ KHÍ MỚI ====================
 *  Roi Xích · Roi Điện · Lưỡi Hái · Huyền Cơ (ô 3 dạng) · Súng Băng · Súng Hỏa Mai
 *  Mỗi vũ khí có nội tại + kỹ năng Bậc Thầy (Kỹ Thuật Cận Chiến / Trang Bị Phụ) và Kỹ Thuật Cao. Nạp sau weather.js.
 */
Object.assign(WEAPONS, {
    WHIP:     { id: 'WHIP', name: 'Roi Xích', icon: '🪝', type: 'MELEE', mode: 'charge', chargeTime: 0.9, aim: 'line', color: '#a8a29e', damage: 16, fireRate: 30, range: 180, durability: 30, maxDurability: 30, moveScale: 1.0, width: 3, len: 30, tier: 2, desc: 'Chạm: quất xa 180 (đầu roi ×2, quá gần yếu). Giữ rồi thả: quất kéo địch về / kéo mình tới vật cản. Trúng 2 lần liên tiếp làm chậm.' },
    EWHIP:    { id: 'EWHIP', name: 'Roi Điện', icon: '⚡', type: 'MELEE', mode: 'charge', chargeTime: 0.9, aim: 'line', color: '#67e8f9', damage: 20, fireRate: 30, range: 190, durability: 30, maxDurability: 30, moveScale: 1.0, width: 3, len: 30, tier: 3, desc: 'Như Roi Xích nhưng mỗi đòn trúng phóng sét lan sang 2 địch gần; đầu roi làm tê liệt.' },
    SCYTHE:   { id: 'SCYTHE', name: 'Lưỡi Hái', icon: '🌙', type: 'MELEE', mode: 'charge', chargeTime: 1.0, aim: 'arc', color: '#a78bfa', damage: 34, fireRate: 52, range: 112, durability: 28, maxDurability: 28, moveScale: 0.92, width: 5, len: 42, tier: 3, desc: 'Chém rộng 180° rất chậm. Giữ rồi thả: xoay 360°. Mỗi địch trúng hồi 10% máu (tràn thành khiên). Hạ gục: ngụy trang, hồi đầy độ bền, tăng tốc, lộ kẻ yếu nhất.' },
    UMBRELLA: { id: 'UMBRELLA', name: 'Huyền Cơ', icon: '☂️', type: 'MELEE', mode: 'charge', chargeTime: 0.8, aim: 'line', color: '#f472b6', damage: 12, fireRate: 22, range: 110, durability: 40, maxDurability: 40, moveScale: 1.0, width: 4, len: 34, tier: 2, desc: 'Ô 3 dạng. Gập: đâm như giáo · Mở: súng + chắn đạn phía trước · Huyền Cơ: kiếm + khiên trước mặt khi không đánh. Giữ rồi thả để chuyển dạng (mỗi lần chuyển là 1 chiêu). Sau khi chuyển: buff riêng của dạng mới (Gập: +50% tốc chạy · Mở: -30% sát thương nhận · Huyền Cơ: +30% tốc đánh) và 3 đòn đầu được cường hoá.' },
    ICEGUN:   { id: 'ICEGUN', name: 'Súng Băng', icon: '🧊', type: 'GUN', mode: 'auto', aim: 'line', color: '#7dd3fc', damage: 2.6, fireRate: 6, speed: 0, spread: 0, range: 300, magSize: 90, mag: 90, reserve: 90, reloadTime: 2.0, moveScale: 0.95, width: 7, len: 22, tier: 2, desc: 'Giữ để phun tia băng. Làm chậm dần, trúng liên tục 2 giây thì đóng băng 1 giây. Bắn xuống đất tạo vệt băng trơn. Khắc chế lửa, nhưng lửa làm tan băng.' },
    MUSKET:   { id: 'MUSKET', name: 'Súng Hỏa Mai', icon: '🧨', type: 'GUN', mode: 'charge', chargeTime: 1.0, narrow: [0.5, 0.015], aim: 'line', color: '#b45309', damage: 100, fireRate: 30, speed: 34, spread: 0.3, range: 900, magSize: 1, mag: 1, reserve: 8, reloadTime: 2.2, moveScale: 0.9, width: 5, len: 40, tier: 3, desc: 'Giữ để ngắm. Một viên, gần như một phát chết. Tiếng nổ cực lớn (nghe rất xa). Mỗi phát phải nạp lại.' }
});
Object.assign(BASE_WEIGHTS, { WHIP: 6, EWHIP: 4, SCYTHE: 4, UMBRELLA: 6, ICEGUN: 6, MUSKET: 5 });
AIM_ZOOM.MUSKET = 0.78;
const W2_IDS = ['WHIP', 'EWHIP', 'SCYTHE', 'UMBRELLA', 'ICEGUN', 'MUSKET'];
const W2FX = []; // hiệu ứng riêng (chỉ để vẽ): roi, dấu sao, lưỡi hái bay, ô bay
const mtK = p => has(p, 'meleeTech');
const gmK = p => has(p, 'gunMod');

function rayFree(x, y, a, max, step = 8) { // khoảng cách tới vật cản / mép bản đồ đầu tiên
    for (let d = step; d <= max; d += step) {
        const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
        if (px < 4 || py < 4 || px > MAP_W - 4 || py > MAP_H - 4 || pointInObstacle(px, py, 0)) return { d: d - step, wall: true };
    }
    return { d: max, wall: false };
}
function lineFoes(p, a, reach, pad) {
    return enemiesOf(p).filter(e => {
        if (e.air > 0) return false;
        const d = dist(p.x, p.y, e.x, e.y); if (d > reach + e.radius) return false;
        const tx = p.x + Math.cos(a) * reach, ty = p.y + Math.sin(a) * reach;
        return segDist(e.x, e.y, p.x, p.y, tx, ty) < e.radius + pad && lineOfSight(p.x, p.y, e.x, e.y);
    }).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y));
}
function arcFoes(p, a, reach, half) {
    return enemiesOf(p).filter(e => {
        if (e.air > 0) return false;
        const d = dist(p.x, p.y, e.x, e.y), da = Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a));
        if (d < p.radius + e.radius + 14 && da < Math.max(half, 1.7)) return true;
        return d < p.radius + e.radius + reach && da < half && lineOfSight(p.x, p.y, e.x, e.y);
    });
}
function hitDecoysObs(p, x, y, r, dmg) {
    for (const d of decoys) if (d.owner !== p.id && dist(x, y, d.x, d.y) < d.radius + r) d.hp = 0;
    const o = pointInObstacle(x, y, 6); if (o) damageObstacle(o, dmg, p);
}
function blockBulletsArc(p, a, half, R, reflect) { // chặn đạn trong cung phía trước; trả về số viên chặn được
    let n = 0;
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; if (b.owner === p.id || b.flame && !reflect) continue;
        const d = dist(p.x, p.y, b.x, b.y); if (d > R) continue;
        if (half < Math.PI && Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), a)) > half) continue;
        if (reflect && !b.explosive) { b.owner = p.id; b.angle = Math.atan2(b.y - p.y, b.x - p.x); b.life = Math.max(b.life, 0.8); b.color = '#f9a8d4'; spark(b.x, b.y, '#f9a8d4', 4, 160); }
        else { spark(b.x, b.y, '#fbcfe8', 4, 140); bullets.splice(i, 1); }
        n++;
    }
    if (n) AudioSys.playAt('block', p.x, p.y, 0.25);
    return n;
}

/* ============================== ROI XÍCH · ROI ĐIỆN ============================== */
function whipLash(p, w, a, charge, mult, opts = {}) {
    const elec = w.id === 'EWHIP', col = elec ? '#67e8f9' : '#d6d3d1';
    const reach = (opts.reach || w.range) * (combo(p, 'sword_brawler') ? 1.1 : 1);
    const free = rayFree(p.x, p.y, a, reach);
    const pull = charge >= 0.9 && !opts.noPull;
    AudioSys.playAt('swing', p.x, p.y, 0.45); p.stats.shots++;
    const foes = lineFoes(p, a, free.d + 20, 12);
    let len = free.d;
    if (pull && foes.length) len = Math.min(len, dist(p.x, p.y, foes[0].x, foes[0].y));
    W2FX.push({ kind: 'whip', owner: p.id, a, len, t: 0.24, maxT: 0.24, col, elec, pull });
    const hitList = pull ? foes.slice(0, 1) : foes;
    const tipK = mtK(p) && !elec ? 2.5 : 2;
    hitList.forEach(e => {
        const d = dist(p.x, p.y, e.x, e.y) - e.radius;
        let dmg = w.damage * (p.meleeMult || 1) * mult * (opts.dmgK || 1);
        let tip = false;
        if (d >= reach * 0.66) { dmg *= tipK; tip = true; }
        else if (d < 60) dmg *= 0.5; // quá gần: roi không có lực
        const ea = Math.atan2(e.y - p.y, e.x - p.x);
        dealDamage(e, dmg, p.id, { angle: pull ? ea + Math.PI : ea, knock: pull ? 900 : (tip ? 220 : 90), melee: true });
        p.stats.hits++;
        if (tip) { floatText(e.x, e.y - 40, elec ? '⚡ ĐẦU ROI!' : '💥 ĐẦU ROI!', elec ? '#67e8f9' : '#fde68a', 14); spark(e.x, e.y, elec ? '#a5f3fc' : '#fde68a', 10, 260); AudioSys.playAt('crit', e.x, e.y, 0.35); }
        // 2 đòn trúng liên tiếp → chậm
        const now = world.time;
        if (e.whipBy === p.id && now - (e.whipT || -9) < 2.2) { e.st.slow = Math.max(e.st.slow || 0, 1.6); floatText(e.x, e.y - 26, '🐌 CHẬM', '#94a3b8', 12); e.whipT = -9; }
        else { e.whipBy = p.id; e.whipT = now; }
        if (elec) {
            if (tip) e.stun = Math.max(e.stun, 0.35);
            chainZap(p, e, dmg * 0.55, mtK(p) ? 3 : 2);
        }
        if (opts.root) { e.st.root = Math.max(e.st.root || 0, opts.root); floatText(e.x, e.y - 52, '⛓ TRÓI!', '#fbbf24', 15); ring(e.x, e.y, 6, 40, '#fbbf24', 0.4, 4); }
        if (pull) { e.stun = Math.max(e.stun, 0.25); floatText(e.x, e.y - 52, '🪝 KÉO!', '#fde68a', 15); }
    });
    if (pull && !foes.length && free.wall && free.d > 40) { // kéo mình tới vật cản
        p.dashTime = Math.min(0.35, (free.d - p.radius - 4) / 720); p.dashAngle = a;
        floatText(p.x, p.y - 34, '🪝 MÓC TƯỜNG!', '#fde68a', 13); AudioSys.playAt('whoosh', p.x, p.y, 0.4);
    }
    const tx = p.x + Math.cos(a) * len, ty = p.y + Math.sin(a) * len;
    hitDecoysObs(p, tx, ty, 16, w.damage * 0.5);
    spark(tx, ty, col, 5, 180);
    if (hitList.length) { reduceDurability(p, w, 1); hitStop(0.05); addShake(3); }
    return hitList;
}
function chainZap(p, from, dmg, n) {
    const seen = new Set([from.id]); let cur = from;
    for (let k = 0; k < n; k++) {
        const nx = enemiesOf(p).filter(e => !seen.has(e.id) && dist(cur.x, cur.y, e.x, e.y) < 170).sort((u, v) => dist(cur.x, cur.y, u.x, u.y) - dist(cur.x, cur.y, v.x, v.y))[0];
        if (!nx) break;
        beams.push({ x1: cur.x, y1: cur.y, x2: nx.x, y2: nx.y, life: 0.22, maxLife: 0.22, color: '#67e8f9', zig: true });
        dealDamage(nx, dmg, p.id, { melee: true, knock: 1 }); nx.st.slow = Math.max(nx.st.slow || 0, 0.6);
        spark(nx.x, nx.y, '#a5f3fc', 6, 200); seen.add(nx.id); cur = nx;
    }
    if (n && cur !== from) AudioSys.playAt('rail', from.x, from.y, 0.3);
}

/* ============================== LƯỠI HÁI ============================== */
function scytheSwing(p, w, a, charge, mult, isSuper) {
    const spin = charge >= 0.9;
    AudioSys.playAt('swing', p.x, p.y, 0.6); p.stats.shots++;
    const reach = w.range * (spin ? 1.3 : 1) * (isSuper ? 1.4 : 1);
    let dmg = w.damage * (p.meleeMult || 1) * mult * (spin ? 1.25 : 1) * (isSuper ? 2.5 : 1);
    if (spin) {
        [0, Math.PI].forEach(o => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + o, range: reach + p.radius, color: '#c4b5fd', width: 13, life: 0.3, maxLife: 0.3, swing: 1, line: false, arc: Math.PI / 2 }));
        ring(p.x, p.y, p.radius, reach + p.radius, '#a78bfa', 0.35, 6); floatText(p.x, p.y - 34, '🌙 VÒNG GẶT!', '#c4b5fd', 14);
    } else slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: reach + p.radius, color: '#a78bfa', width: 12, life: 0.3, maxLife: 0.3, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false, arc: Math.PI / 2 });
    const hit = arcFoes(p, a, reach, spin ? Math.PI + 0.01 : Math.PI / 2);
    let kills = 0;
    hit.forEach(e => {
        const ea = Math.atan2(e.y - p.y, e.x - p.x);
        let dd = dmg;
        if (p.reaperArm) { dd *= e.hp < e.maxHp * 0.5 ? 4 : 2; floatText(e.x, e.y - 50, e.hp < e.maxHp * 0.5 ? '☠ ×4' : '☠ ×2', '#e9d5ff', 17); }
        dealDamage(e, dd, p.id, { angle: ea, knock: 200, melee: true, super: isSuper }); p.stats.hits++;
        scytheHeal(p, (mtK(p) ? 0.15 : 0.1) * p.maxHp);
        smoke(e.x, e.y, 3, 'rgba(167,139,250,0.35)', 10);
        if (e.hp <= 0) kills++;
    });
    if (p.reaperArm) p.reaperArm = false;
    if (isSuper) { p.superCharge = 0; floatText(p.x, p.y - 36, 'SIÊU ĐÒN!', '#fde047', 18); }
    hitDecoysObs(p, p.x + Math.cos(a) * reach * 0.6, p.y + Math.sin(a) * reach * 0.6, reach * 0.6, dmg);
    if (hit.length) { reduceDurability(p, w, 1); hitStop(0.07); addShake(5); }
    if (kills) reapKill(p, w);
}
function scytheHeal(p, amt) {
    const room = p.maxHp - p.hp;
    p.hp = Math.min(p.maxHp, p.hp + amt);
    const over = amt - Math.max(0, room);
    if (over > 0) { p.st.shield = Math.min(80, (p.st.shield || 0) + over); p.st.shieldT = Math.max(p.st.shieldT || 0, 4); }
    floatText(p.x, p.y - 22, '+' + Math.round(amt), '#c4b5fd', 12);
}
function reapKill(p, w) {
    setInvis(p, 'camo', 2.5); if (typeof invisAs === 'function') invisAs(p, 'camo');
    w.durability = w.maxDurability; p.st.haste = Math.max(p.st.haste || 0, 2.5);
    const weak = enemiesOf(p).sort((u, v) => u.hp - v.hp)[0];
    if (weak) { spotFor(weak, p.id, 6); floatText(weak.x, weak.y - 50, '👁 CON MỒI', '#e9d5ff', 14); }
    floatText(p.x, p.y - 46, '☠ GẶT!', '#c4b5fd', 18); ring(p.x, p.y, 10, 120, '#a78bfa', 0.5, 5); AudioSys.playAt('trick', p.x, p.y, 0.4);
}

/* ============================== HUYỀN CƠ (ô 3 dạng) ============================== */
const UMB_FORMS = [
    { name: 'Gập', icon: '🌂', col: '#f472b6', tr: 'Bật lùi · bất tử 1s' },
    { name: 'Mở', icon: '☂️', col: '#38bdf8', tr: 'Đẩy ô · choáng + kéo · bắn chùm' },
    { name: 'Huyền Cơ', icon: '⚔️', col: '#c084fc', tr: 'Ném ô · lướt tới · +giáp' }
];
const UMB_TR = [{ dir: Math.PI, D: 130 }, { dir: 0, D: 230 }, { dir: 0, D: 230 }];
/* Sau mỗi lần chuyển dạng: buff riêng của dạng mới (4 giây) + 3 đòn đầu được cường hoá */
const UMB_BUFF = [
    { name: 'PHI Ô', desc: '+50% tốc chạy 3s', pow: 'Đâm xuyên: +70% sát thương, +35% tầm, làm chậm & chảy máu' },
    { name: 'TÁN CHE', desc: '-30% sát thương nhận 4s', pow: 'Đạn chùm: mỗi phát 3 viên, +30% sát thương, làm chậm' },
    { name: 'SÁT Ý', desc: '+30% tốc đánh 4s', pow: 'Kiếm Ý: +70% sát thương, chém rộng, choáng 0.35s, hút máu' }
];
function umbPower(p, f) {
    const B = p.umbBuff;
    if (!B || B.f !== f || B.n <= 0 || B.t < world.time) return false;
    B.n--; return true;
}
function umbAttack(p, w, a, charge, mult, isSuper) {
    const f = w.form || 0;
    if (charge >= 0.9) return umbTransition(p, w, a);
    const pw = umbPower(p, f), left = pw ? p.umbBuff.n : 0;
    const dmg = w.damage * (p.meleeMult || 1) * mult * (isSuper ? 2.5 : 1) * (pw ? (f === 1 ? 1.3 : 1.7) : 1);
    p.stats.shots++;
    if (pw) { floatText(p.x, p.y - 44, `✦ ${3 - left}/3`, UMB_FORMS[f].col, 13); spark(p.x + Math.cos(a) * 24, p.y + Math.sin(a) * 24, UMB_FORMS[f].col, 6, 220); }
    if (f === 0) { // đâm như giáo
        const reach = w.range * (pw ? 1.35 : 1) + p.radius;
        AudioSys.playAt('swing', p.x, p.y, pw ? 0.6 : 0.4);
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: reach, color: pw ? '#fde68a' : '#f9a8d4', width: pw ? 10 : 6, life: 0.16, maxLife: 0.16, swing: 1, line: true });
        if (pw) beams.push({ x1: p.x, y1: p.y, x2: p.x + Math.cos(a) * reach, y2: p.y + Math.sin(a) * reach, life: 0.14, maxLife: 0.14, color: '#f472b6' });
        const hit = lineFoes(p, a, reach, pw ? 22 : 18);
        hit.forEach(e => {
            dealDamage(e, dmg * 1.25, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: pw ? 420 : 260, melee: true }); p.stats.hits++;
            if (pw) { e.st.slow = Math.max(e.st.slow || 0, 1.2); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 2); e.st.burnBy = p.id; } floatText(e.x, e.y - 40, '🩸 XUYÊN!', '#f9a8d4', 13); }
        });
        if (hit.length) { reduceDurability(p, w, 1); hitStop(pw ? 0.07 : 0.04); addShake(pw ? 5 : 3); }
        hitDecoysObs(p, p.x + Math.cos(a) * (reach - p.radius), p.y + Math.sin(a) * (reach - p.radius), 14, dmg);
    } else if (f === 1) { // súng
        const m = muzzle(p, w, a);
        const n = pw ? 3 : 1, boom = p.umbBoom > 0;
        if (boom) { p.umbBoom--; floatText(p.x, p.y - 30, `💥 ĐẠN NỔ ${3 - p.umbBoom}/3`, '#fb923c', 12); }
        for (let i = 0; i < n; i++) spawnBullet(p, m.x, m.y, a + (n > 1 ? (i - 1) * 0.12 : 0) + (Math.random() - 0.5) * 0.06, { speed: 22, damage: dmg * 0.8, range: 430, color: boom ? '#fb923c' : pw ? '#fde68a' : '#7dd3fc', size: boom ? 6.5 : pw ? 3.6 : 3, trail: boom ? 46 : pw ? 40 : 30, slow: pw ? 0.8 : 0, explosive: boom && i === 0, blastSmall: boom && i === 0 });
        AudioSys.playAt(pw ? 'shotgun' : 'shoot', p.x, p.y, 0.25); p.muzzle = 0.05; p.recoil = 1; addShake(pw ? 2 : 1);
        p.cooldown *= p.umbRapidT > world.time ? 0.45 : 0.75;
        if (Math.random() < 0.25) reduceDurability(p, w, 1);
    } else { // kiếm
        const reach = w.range * (pw ? 1.2 : 1);
        AudioSys.playAt('swing', p.x, p.y, pw ? 0.7 : 0.5);
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: reach + p.radius, color: pw ? '#f0abfc' : '#d8b4fe', width: pw ? 14 : 9, life: 0.22, maxLife: 0.22, swing: (p.strikeN = (p.strikeN || 0) + 1) % 2 ? 1 : -1, line: false, arc: pw ? Math.PI / 1.6 : undefined });
        const hit = arcFoes(p, a, reach, pw ? Math.PI / 1.7 : Math.PI / 2.2);
        hit.forEach(e => {
            dealDamage(e, dmg * 1.15, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 180, melee: true }); p.stats.hits++;
            if (pw) { e.stun = Math.max(e.stun, 0.35); p.hp = Math.min(p.maxHp, p.hp + 6); ring(e.x, e.y, 4, 34, '#f0abfc', 0.3, 3); }
        });
        if (hit.length) { reduceDurability(p, w, 1); hitStop(pw ? 0.07 : 0.04); addShake(pw ? 5 : 3); }
        hitDecoysObs(p, p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60, 40, dmg);
    }
    if (p.umbFuryT > world.time) p.cooldown *= 0.7; // Sát Ý: +30% tốc đánh
}
function umbTransition(p, w, a) {
    const f = w.form || 0, next = (f + 1) % 3;
    if (mtK(p)) { p.armor = Math.min(Math.max(150, p.maxArmor || 0), (p.armor || 0) + 20); }
    if (f === 0) { // gập → mở: bật lùi, bất tử 1s
        const D = Math.min(UMB_TR[0].D, rayFree(p.x, p.y, a + Math.PI, UMB_TR[0].D).d);
        p.dashTime = Math.max(0.05, D / 720); p.dashAngle = a + Math.PI; p.st.invuln = Math.max(p.st.invuln || 0, 1);
        smoke(p.x, p.y, 5, 'rgba(244,114,182,0.35)', 12); ring(p.x, p.y, 6, 60, '#38bdf8', 0.35, 4);
        floatText(p.x, p.y - 36, '☂️ BẬT Ô!', '#38bdf8', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.4);
    } else if (f === 1) { // mở → huyền cơ: đẩy ô về trước
        p.umbPush = { t: 0.32, a, hit: new Set() };
        p.dashTime = 0.32; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln || 0, 0.15);
        floatText(p.x, p.y - 36, '☂️ ĐẨY Ô!', '#c084fc', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
    } else { // huyền cơ → gập: ném ô rồi lướt tới
        const D = Math.max(40, rayFree(p.x, p.y, a, UMB_TR[2].D).d);
        const tx = p.x + Math.cos(a) * D, ty = p.y + Math.sin(a) * D;
        W2FX.push({ kind: 'umbFly', owner: p.id, x0: p.x, y0: p.y, x: tx, y: ty, a, t: 0.22, maxT: 0.22 });
        p.shotQueue.push({ t: 0.22, fn: () => {
            if (p.hp <= 0) return;
            const d = dist(p.x, p.y, tx, ty); const aa = Math.atan2(ty - p.y, tx - p.x);
            p.dashTime = Math.min(0.4, d / 720); p.dashAngle = aa;
            p.armor = Math.min(Math.max(150, p.maxArmor || 0), (p.armor || 0) + 40);
            floatText(p.x, p.y - 36, '🛡 +40 GIÁP', '#93c5fd', 13); ring(tx, ty, 6, 50, '#f472b6', 0.3, 3);
            enemiesOf(p).forEach(e => { if (dist(e.x, e.y, tx, ty) < 50 + e.radius) dealDamage(e, 14 * (p.meleeMult || 1), p.id, { melee: true, knock: 200, angle: aa }); });
        } });
        floatText(p.x, p.y - 36, '☂️ NÉM Ô!', '#f472b6', 14); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
    }
    w.form = next;
    spark(p.x, p.y, UMB_FORMS[next].col, 8, 180);
    floatText(p.x, p.y - 54, `${UMB_FORMS[next].icon} ${UMB_FORMS[next].name.toUpperCase()}`, UMB_FORMS[next].col, 13);
    umbEnterForm(p, next);
}
function umbEnterForm(p, next) {
    const w = getCurrentWeapon(p); if (w && w.id === 'UMBRELLA') w.form = next;
    const UB = UMB_BUFF[next];
    p.umbBuff = { f: next, n: 3, t: world.time + 8 };
    if (next === 0) p.st.haste = Math.max(p.st.haste || 0, 3);
    if (next === 1) p.umbGuardT = world.time + 4;
    if (next === 2) p.umbFuryT = world.time + 4;
    p.umbAuraT = world.time + (next === 0 ? 3 : 4);
    floatText(p.x, p.y - 72, `✦ ${UB.name}: ${UB.desc}`, UMB_FORMS[next].col, 12);
    ring(p.x, p.y, 8, 70, UMB_FORMS[next].col, 0.45, 4);
}
function updateUmbrella(p, w, dt) {
    const f = w.form || 0;
    const P = p.umbPush;
    if (P) {
        P.t -= dt;
        const fx = p.x + Math.cos(P.a) * (p.radius + 26), fy = p.y + Math.sin(P.a) * (p.radius + 26);
        blockBulletsArc(p, P.a, 1.2, 80, false);
        enemiesOf(p).forEach(e => {
            if (e.air > 0) return;
            if (dist(e.x, e.y, fx, fy) < e.radius + 30 || P.hit.has(e.id) && dist(e.x, e.y, p.x, p.y) < 120) {
                if (!P.hit.has(e.id)) { P.hit.add(e.id); dealDamage(e, 8 * (p.meleeMult || 1), p.id, { melee: true, knock: 1 }); floatText(e.x, e.y - 40, '☂️ BỊ ĐẨY!', '#c084fc', 13); }
                e.stun = Math.max(e.stun, 0.35);
                const nx = p.x + Math.cos(P.a) * (p.radius + e.radius + 12), ny = p.y + Math.sin(P.a) * (p.radius + e.radius + 12);
                if (!pointInObstacle(nx, ny, e.radius)) { e.x = nx; e.y = ny; }
            }
        });
        if (Math.random() < 0.5) smoke(fx, fy, 1, 'rgba(192,132,252,0.3)', 10);
        if (P.t <= 0) { // kết thúc: bắn chùm
            p.umbPush = null;
            const m = muzzle(p, w, P.a);
            for (let i = 0; i < 7; i++) spawnBullet(p, m.x, m.y, P.a + (Math.random() - 0.5) * 0.6, { speed: 18 + Math.random() * 5, damage: 6 * (p.meleeMult || 1), range: 230, color: '#e9d5ff', size: 3, knock: 140, trail: 20 });
            AudioSys.playAt('shotgun', p.x, p.y, 0.5); addShake(5); p.muzzle = 0.06;
            floatText(p.x, p.y - 36, '💥 BẮN CHÙM!', '#e9d5ff', 13);
        }
        return;
    }
    if (p.umbDome > world.time) { blockBulletsArc(p, 0, Math.PI, 95, true); return; }
    if (f === 1) blockBulletsArc(p, p.angle, 0.85, p.radius + 34, gmK(p));
    else if (f === 2 && world.time - (p.lastFireT || -9) > 0.45) blockBulletsArc(p, p.angle, 0.8, p.radius + 30, false);
}

/* ============================== SÚNG BĂNG ============================== */
function iceFire(p, w, ang) {
    const rofMult = p.fireRateMult * (p.st.rage > 0 ? 0.75 : 1);
    p.cooldown = w.fireRate * rofMult; p.ghostT = 0; p.angle = ang; p.lastFireT = world.time;
    if (inBush(p.x, p.y)) p.st.exposed = 1.2;
    onAttack(p);
    if (!world.infiniteAmmo) w.mag--; else w.mag = Math.max(1, w.mag - 1);
    p.stats.shots++; p.muzzle = 0.03;
    const m = muzzle(p, w, ang), R = w.range;
    const free = rayFree(m.x, m.y, ang, R, 6);
    const foes = enemiesOf(p).filter(e => !(e.air > 0) && dist(m.x, m.y, e.x, e.y) < free.d + e.radius && segDist(e.x, e.y, m.x, m.y, m.x + Math.cos(ang) * free.d, m.y + Math.sin(ang) * free.d) < e.radius + 10)
        .sort((u, v) => dist(m.x, m.y, u.x, u.y) - dist(m.x, m.y, v.x, v.y));
    const e = foes[0];
    const L = e ? dist(m.x, m.y, e.x, e.y) : free.d;
    const ex = m.x + Math.cos(ang) * L, ey = m.y + Math.sin(ang) * L;
    beams.push({ x1: m.x, y1: m.y, x2: ex, y2: ey, life: 0.09, maxLife: 0.09, color: '#7dd3fc' });
    if (Math.random() < 0.6) particles.push({ x: ex + (Math.random() - 0.5) * 16, y: ey + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.5, maxLife: 0.5, color: Math.random() < 0.5 ? '#e0f2fe' : '#7dd3fc', size: 3 });
    if (Math.random() < 0.15) AudioSys.playAt('whoosh', p.x, p.y, 0.08);
    // khắc chế lửa: dập đạn lửa trên đường tia
    for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (b.flame && b.owner !== p.id && segDist(b.x, b.y, m.x, m.y, ex, ey) < 16) { bullets.splice(i, 1); if (Math.random() < 0.3) smoke(b.x, b.y, 1, 'rgba(226,232,240,0.4)', 8); } }
    for (let i = zones.length - 1; i >= 0; i--) { const z = zones[i]; if (z.type === 'fire' && dist(z.x, z.y, ex, ey) < z.r + 10) { z.t -= 0.25; if (z.t <= 0) { zones.splice(i, 1); smoke(z.x, z.y, 4, 'rgba(226,232,240,0.45)', 14); } } }
    if (e) {
        const dmgM = attackMult(p, w);
        dealDamage(e, w.damage * dmgM, p.id, { angle: ang, knock: 1 });
        p.stats.hits++;
        chill(e, p, w.fireRate / 60 * rofMult * 1.15);
    } else {
        // tia xuống đất: vệt băng trơn
        p.iceFloorT = (p.iceFloorT || 0) + w.fireRate / 60;
        if (p.iceFloorT > 0.18 && !zones.some(z => z.type === 'icefloor' && z.iceGun && dist(z.x, z.y, ex, ey) < 30)) {
            p.iceFloorT = 0;
            zones.push({ type: 'icefloor', x: ex, y: ey, r: 40, t: 5, maxT: 5, tick: 0, owner: p.id, iceGun: true });
        }
    }
    if (w.mag <= 0 && w.reserve <= 0 && !world.infiniteAmmo) p.autoThrowT = 0.45;
}
function chill(e, p, add) {
    if (e.st.burn > 0) { e.st.burn = Math.max(0, e.st.burn - 0.5); add *= 0.5; if (Math.random() < 0.2) smoke(e.x, e.y, 1, 'rgba(226,232,240,0.5)', 10); }
    const ew = getCurrentWeapon(e); if (ew && ew.flame) add *= 1.5; // khắc chế súng lửa
    const now = world.time;
    if (now - (e.iceLast || -9) > 0.5) e.iceB = 0;
    e.iceLast = now; e.iceB = (e.iceB || 0) + add; e.iceBy = p.id;
    e.st.slow = Math.max(e.st.slow || 0, 0.4 + e.iceB * 0.4);
    const need = gmK(p) ? 1.4 : 2;
    if (e.iceB >= need) freezeP(e, 1, p);
}
function freezeP(e, t, p) {
    e.stun = Math.max(e.stun, t); e.frozenT = world.time + t; e.iceB = 0;
    floatText(e.x, e.y - 44, '🧊 ĐÓNG BĂNG!', '#bae6fd', 15); ring(e.x, e.y, 6, 50, '#e0f2fe', 0.4, 4); spark(e.x, e.y, '#e0f2fe', 12, 200);
    AudioSys.playAt('block', e.x, e.y, 0.4);
}

/* ============================== SÚNG HỎA MAI ============================== */
const _chargeRangeW2 = chargeRange;
chargeRange = function (w, c, p) { if (w && w.id === 'MUSKET') return 300 + 600 * c; return _chargeRangeW2(w, c, p); };
function musketFix(p, w, ang, charge, mine) {
    const full = charge >= 0.95;
    mine.forEach(b => {
        b.damage *= 0.55 + 0.8 * charge; b.speed = 34 + 10 * charge; b.size = 4.5; b.knock = 380; b.trail = 80; b.color = '#fde68a';
        b.angle = ang + (Math.random() - 0.5) * spreadAt(w, charge) * (p.spreadMult || 1);
        b.life = Math.max(10, chargeRange(w, charge, p)) / (b.speed * 60);
    });
    p.loudT = world.time + 0.8;
    AudioSys.playAt('shoot_heavy', p.x, p.y, 0.7, 3200); AudioSys.playAt('explosion', p.x, p.y, 0.25, 3200);
    addShake(full ? 9 : 6); p.kx -= Math.cos(ang) * 220; p.ky -= Math.sin(ang) * 220;
    const m = muzzle(p, w, ang);
    for (let i = 0; i < 8; i++) particles.push({ x: m.x, y: m.y, vx: Math.cos(ang) * (60 + Math.random() * 120) + (Math.random() - 0.5) * 80, vy: Math.sin(ang) * (60 + Math.random() * 120) + (Math.random() - 0.5) * 80, life: 1.2, maxLife: 1.2, color: 'rgba(214,211,209,0.4)', size: 8 + Math.random() * 6, grow: true });
    if (full) floatText(p.x, p.y - 34, '🧨 ĐOÀNG!', '#fde68a', 16);
    w.reloadTime = gmK(p) ? 1.4 : 2.2;
}
// tiếng nổ hỏa mai: nghe xa gấp 2.4 lần
const _hearReachW2 = hearReach;
hearReach = function (v, kind, x, y) {
    const R = _hearReachW2(v, kind, x, y);
    if (kind === 'gun' && players.some(q => q.loudT > world.time && dist(q.x, q.y, x, y) < 80)) return R * 2.4;
    return R;
};

/* ============================== MÓC VÀO HỆ THỐNG BẮN ============================== */
const _fireMeleeW2 = fireMelee;
fireMelee = function (p, w, ang, charge, mult, isSuper, enemy) {
    if (w.id === 'WHIP' || w.id === 'EWHIP') { whipLash(p, w, ang, charge || 0, (mult || 1) * (isSuper ? 2.5 : 1)); if (isSuper) p.superCharge = 0; return; }
    if (w.id === 'SCYTHE') return scytheSwing(p, w, ang, charge || 0, mult || 1, isSuper);
    if (w.id === 'UMBRELLA') return umbAttack(p, w, ang, charge || 0, mult || 1, isSuper);
    return _fireMeleeW2(p, w, ang, charge, mult, isSuper, enemy);
};
const _fireWeaponW2 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && w.id === 'ICEGUN') return iceFire(p, w, ang);
    if (w && w.id === 'SCYTHE' && p.reapTp && p.reapTp.t > world.time) { // Gặt Hồn: đòn kế tiếp dịch chuyển tới lưỡi hái
        const T = p.reapTp; p.reapTp = null;
        if (!pointInObstacle(T.x, T.y, p.radius)) { smoke(p.x, p.y, 6, 'rgba(167,139,250,0.4)', 14); p.x = T.x; p.y = T.y; ring(p.x, p.y, 6, 70, '#a78bfa', 0.4, 4); floatText(p.x, p.y - 40, '🌙 DỊCH CHUYỂN!', '#c4b5fd', 14); AudioSys.playAt('trick', p.x, p.y, 0.4); }
    }
    if (w && w.id === 'MUSKET') {
        const n = bullets.length;
        const r = _fireWeaponW2(p, w, ang, charge, enemy);
        musketFix(p, w, ang, charge || 0, bullets.slice(n).filter(b => b.owner === p.id));
        return r;
    }
    return _fireWeaponW2(p, w, ang, charge, enemy);
};

/* ============================== CẬP NHẬT MỖI KHUNG ============================== */
const _upeW2 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeW2(dt);
    for (let i = W2FX.length - 1; i >= 0; i--) {
        const f = W2FX[i]; f.t -= dt;
        if (f.kind === 'cres') updateCrescent(f, dt);
        if (f.kind === 'umbFly') { const o = players.find(q => q.id === f.owner); if (o) { const k = 1 - Math.max(0, f.t) / f.maxT; const cx = f.x0 + (f.x - f.x0) * k, cy = f.y0 + (f.y - f.y0) * k; for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner !== o.id && dist(b.x, b.y, cx, cy) < 28) { spark(b.x, b.y, '#fbcfe8', 4, 140); bullets.splice(j, 1); } } } }
        if (f.kind === 'tether') updateTether(f, dt);
        if (f.t <= 0) W2FX.splice(i, 1);
    }
    if (gameState !== 'PLAYING') return;
    players.forEach(p => {
        if (p.hp <= 0) return;
        const w = getCurrentWeapon(p);
        if (w && w.id === 'UMBRELLA') updateUmbrella(p, w, dt); else p.umbPush = null;
        if (p.frozenT > world.time) {
            if (p.st.burn > 0) { p.frozenT = 0; p.stun = Math.min(p.stun, 0.05); floatText(p.x, p.y - 40, '🔥 TAN BĂNG', '#fb923c', 12); smoke(p.x, p.y, 4, 'rgba(226,232,240,0.5)', 12); }
            else if (Math.random() < 0.2) particles.push({ x: p.x + (Math.random() - 0.5) * 30, y: p.y + (Math.random() - 0.5) * 30, vx: 0, vy: -20, life: 0.4, maxLife: 0.4, color: '#e0f2fe', size: 2 });
        }
        if (p.reaperPass > world.time && Math.random() < 0.4) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.35, maxLife: 0.35, color: 'rgba(167,139,250,0.3)', size: p.radius * 0.8 });
    });
    // lửa làm tan vệt băng
    for (let i = zones.length - 1; i >= 0; i--) {
        const z = zones[i];
        if (z.type === 'icefloor' && z.iceGun && zones.some(q => q.type === 'fire' && dist(q.x, q.y, z.x, z.y) < q.r + z.r * 0.5)) { zones.splice(i, 1); smoke(z.x, z.y, 2, 'rgba(226,232,240,0.45)', 12); continue; }
        if (z.type === 'blizzard') updateBlizzard(z, dt);
    }
};

/* ============================== BẬC THẦY ============================== */
Object.assign(MELEE_P, {
    WHIP: 'Đầu roi ×2.5 thay vì ×2.', EWHIP: 'Sét lan thêm 1 mục tiêu (3).', SCYTHE: 'Mỗi địch trúng hồi 15% máu.',
    UMBRELLA: 'Mỗi lần chuyển dạng +20 giáp.'
});
Object.assign(GUN_P, { ICEGUN: 'Đóng băng sau 1.4 giây thay vì 2.', MUSKET: 'Nạp đạn nhanh hơn (1.4 giây).', UMBRELLA: 'Dạng Mở phản lại đạn chặn được.' });

const _meleeTechCastW2 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'UMBRELLA' && (w.form || 0) !== 1) return umbMT(p, w, a);
    if (w.id === 'WHIP') { // Lốc Xích: 1s báo trước (ngôi sao) rồi xoay quất mọi hướng, hồi 20% máu
        W2FX.push({ kind: 'star', owner: p.id, t: 1, maxT: 1, col: '#fde68a' });
        floatText(p.x, p.y - 40, '⭐ LỐC XÍCH...', '#fde68a', 14); AudioSys.playAt('ui', p.x, p.y, 0.3);
        p.shotQueue.push({ t: 1, fn: () => {
            if (p.hp <= 0) return;
            for (let k = 0; k < 8; k++) W2FX.push({ kind: 'whip', owner: p.id, a: k * Math.PI / 4, len: 200, t: 0.3, maxT: 0.3, col: '#fde68a' });
            enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < 200 + e.radius) { dealDamage(e, 30 * (p.meleeMult || 1), p.id, { melee: true, knock: 380, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.st.slow = Math.max(e.st.slow || 0, 1.5); } });
            p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.2); floatText(p.x, p.y - 30, '+20% MÁU', '#4ade80', 14);
            ring(p.x, p.y, 10, 210, '#fde68a', 0.45, 6); addShake(7); AudioSys.playAt('slam', p.x, p.y, 0.5);
            floatText(p.x, p.y - 46, '🌀 LỐC XÍCH!', '#fde68a', 17);
        } });
        return;
    }
    if (w.id === 'EWHIP') { // Lôi Phạt: sét giáng xuống 3 địch gần nhất
        castFx(p, '#67e8f9', true);
        floatText(p.x, p.y - 40, '⚡ LÔI PHẠT!', '#67e8f9', 16);
        enemiesOf(p).filter(e => dist(p.x, p.y, e.x, e.y) < 340 && lineOfSight(p.x, p.y, e.x, e.y)).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y)).slice(0, 3).forEach((e, i) => {
            p.shotQueue.push({ t: 0.12 * i, fn: () => {
                if (e.hp <= 0) return;
                beams.push({ x1: e.x + 20, y1: e.y - 260, x2: e.x, y2: e.y, life: 0.3, maxLife: 0.3, color: '#a5f3fc', zig: true });
                beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, life: 0.2, maxLife: 0.2, color: '#67e8f9', zig: true });
                dealDamage(e, 30 * (p.meleeMult || 1), p.id, { melee: true, knock: 1 }); e.stun = Math.max(e.stun, 0.7);
                ring(e.x, e.y, 5, 60, '#a5f3fc', 0.35, 4); spark(e.x, e.y, '#e0f2fe', 14, 260); AudioSys.playAt('rail', e.x, e.y, 0.5); addShake(4);
            } });
        });
        return;
    }
    if (w.id === 'SCYTHE') { // Gặt Hồn: lưỡi hái trăng khuyết bay xa, xuyên địch, phá đạn; đòn kế tiếp dịch chuyển tới đó
        W2FX.push({ kind: 'cres', owner: p.id, x: p.x, y: p.y, a, sp: 620, d: 0, max: 560, t: 2, maxT: 2, hit: new Set() });
        floatText(p.x, p.y - 40, '🌙 GẶT HỒN!', '#c4b5fd', 16); AudioSys.playAt('whoosh', p.x, p.y, 0.6); castFx(p, '#a78bfa', false);
        return;
    }
    if (w.id === 'UMBRELLA') { // Ô Xoay: xoay ô chém quanh người + phản đạn 1.5s
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 120, color: '#f9a8d4', width: 12, life: 0.3, maxLife: 0.3, swing: 1, line: false, arc: Math.PI / 2 });
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + Math.PI, range: 120, color: '#f9a8d4', width: 12, life: 0.3, maxLife: 0.3, swing: 1, line: false, arc: Math.PI / 2 });
        enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 120 + e.radius) { dealDamage(e, 22 * (p.meleeMult || 1), p.id, { melee: true, knock: 300, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.stun = Math.max(e.stun, 0.4); } });
        p.umbDome = world.time + 1.5; ring(p.x, p.y, 8, 120, '#f472b6', 0.4, 5);
        floatText(p.x, p.y - 40, '☂️ Ô XOAY!', '#f472b6', 16); AudioSys.playAt('swing', p.x, p.y, 0.6);
        return;
    }
    return _meleeTechCastW2(p);
};
const _gunModCastW2 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'ICEGUN') { // Bão Tuyết
        const d = Math.max(100, Math.min(400, p.skillDist || 320)), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        zones.push({ type: 'blizzard', x, y, r: 170, t: 5, maxT: 5, tick: 0, owner: p.id });
        floatText(p.x, p.y - 40, '❄️ BÃO TUYẾT!', '#bae6fd', 16); ring(x, y, 10, 170, '#e0f2fe', 0.5, 5); AudioSys.playAt('whoosh', x, y, 0.5);
        return;
    }
    if (w.id === 'MUSKET') { // ném thuốc súng: nổ hình quạt, choáng + mù
        const d = 90, x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        W2FX.push({ kind: 'powder', owner: p.id, x, y, a, t: 0.5, maxT: 0.5 });
        for (let i = 0; i < 14; i++) particles.push({ x: p.x, y: p.y, vx: Math.cos(a + (Math.random() - 0.5) * 0.9) * (120 + Math.random() * 200), vy: Math.sin(a + (Math.random() - 0.5) * 0.9) * (120 + Math.random() * 200), life: 0.5, maxLife: 0.5, color: '#44403c', size: 3 });
        floatText(p.x, p.y - 40, '🧨 THUỐC SÚNG!', '#fdba74', 15);
        p.shotQueue.push({ t: 0.5, fn: () => {
            if (p.hp <= 0) return;
            const R = 270, half = 0.65;
            enemiesOf(p).forEach(e => {
                const dd = dist(p.x, p.y, e.x, e.y);
                if (dd < R + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < half && lineOfSight(p.x, p.y, e.x, e.y)) {
                    dealDamage(e, 26 * (p.dmgMult || 1), p.id, { knock: 420, angle: a }); e.stun = Math.max(e.stun, 1);
                    if (!has(e, 'nightVision')) { e.st.blind = Math.max(e.st.blind || 0, 2.5); floatText(e.x, e.y - 44, '😵 CHOÁNG + MÙ!', '#fdba74', 14); }
                }
            });
            for (let i = 0; i < 26; i++) { const t = a + (Math.random() - 0.5) * half * 2, s = 200 + Math.random() * 420; particles.push({ x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, vx: Math.cos(t) * s, vy: Math.sin(t) * s, life: 0.45, maxLife: 0.45, color: Math.random() < 0.5 ? '#fde68a' : '#fb923c', size: 4, glow: true }); }
            W2FX.push({ kind: 'fan', owner: p.id, x: p.x, y: p.y, a, R, half, t: 0.35, maxT: 0.35 });
            flash('#fde68a', 0.15); addShake(9); AudioSys.playAt('explosion', p.x, p.y, 0.6, 3000);
        } });
        return;
    }
    if (w.id === 'UMBRELLA') return umbGM(p, w, a);
    return _gunModCastW2(p);
};
// Trang Bị Phụ dùng được với Huyền Cơ (ô cũng là súng)
const _castSkillW2 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], w = getCurrentWeapon(p);
    if (s && s.id === 'gunMod' && w && w.id === 'UMBRELLA') { w.type = 'GUN'; try { return _castSkillW2(p, slot, aimVec); } finally { w.type = 'MELEE'; } }
    return _castSkillW2(p, slot, aimVec);
};
CARDS.meleeTech.desc += '<br>Roi Xích = Lốc Xích · Roi Điện = Lôi Phạt · Lưỡi Hái = Gặt Hồn · Huyền Cơ = Ô Xoay.';
CARDS.gunMod.desc += '<br>Súng Băng = Bão Tuyết · Súng Hỏa Mai = Thuốc Súng · Huyền Cơ = Mưa Kim (Huyền Cơ dùng được cả 3 kỹ năng Bậc Thầy).';

function updateCrescent(f, dt) {
    const o = players.find(q => q.id === f.owner); if (!o || f.d >= f.max) { f.t = Math.min(f.t, 0); return; }
    const step = f.sp * dt; f.x += Math.cos(f.a) * step; f.y += Math.sin(f.a) * step; f.d += step;
    const wall = pointInObstacle(f.x, f.y, 0) || f.x < 4 || f.y < 4 || f.x > MAP_W - 4 || f.y > MAP_H - 4;
    for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (b.owner !== o.id && dist(b.x, b.y, f.x, f.y) < 44) { spark(b.x, b.y, '#c4b5fd', 4, 150); bullets.splice(i, 1); } }
    enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && dist(e.x, e.y, f.x, f.y) < e.radius + 40) { f.hit.add(e.id); dealDamage(e, 38 * (o.meleeMult || 1), o.id, { melee: true, knock: 220, angle: f.a }); e.st.slow = Math.max(e.st.slow || 0, 1); scytheHeal(o, o.maxHp * 0.1); if (e.hp <= 0) reapKill(o, getCurrentWeapon(o)); } });
    if (Math.random() < 0.7) particles.push({ x: f.x, y: f.y, vx: 0, vy: 0, life: 0.35, maxLife: 0.35, color: 'rgba(167,139,250,0.4)', size: 10 });
    if (wall || f.d >= f.max) {
        if (wall) { f.x -= Math.cos(f.a) * 24; f.y -= Math.sin(f.a) * 24; }
        o.reapTp = { x: f.x, y: f.y, t: world.time + 5 }; f.d = f.max; f.t = 0;
        ring(f.x, f.y, 6, 50, '#a78bfa', 0.5, 4); floatText(f.x, f.y - 20, '🌙', '#c4b5fd', 18);
    }
}
function updateTether(f, dt) {
    const o = players.find(q => q.id === f.owner), e = players.find(q => q.id === f.target);
    if (!o || !e || o.hp <= 0 || e.hp <= 0) { f.t = 0; return; }
    f.tick = (f.tick || 0) + dt;
    if (f.tick >= 0.25) { f.tick = 0; dealDamage(e, 5 * (o.meleeMult || 1), o.id, { melee: true, knock: 1 }); e.st.slow = Math.max(e.st.slow || 0, 0.4); beams.push({ x1: o.x, y1: o.y, x2: e.x, y2: e.y, life: 0.15, maxLife: 0.15, color: '#67e8f9', zig: true }); }
    const d = dist(o.x, o.y, e.x, e.y);
    if (d > 300) { // giật lại
        const a = Math.atan2(o.y - e.y, o.x - e.x); e.kx = (e.kx || 0) + Math.cos(a) * 700; e.ky = (e.ky || 0) + Math.sin(a) * 700; e.stun = Math.max(e.stun, 0.6);
        dealDamage(e, 16 * (o.meleeMult || 1), o.id, { melee: true, knock: 1 }); floatText(e.x, e.y - 44, '⚡ GIẬT!', '#67e8f9', 15); AudioSys.playAt('rail', e.x, e.y, 0.5); f.t = 0;
    }
}
function updateBlizzard(z, dt) {
    const o = players.find(q => q.id === z.owner);
    z.tick += dt;
    players.forEach(e => {
        if (e.hp <= 0 || e.air > 0 || (o && (e === o || sameTeam(o, e)))) return;
        if (dist(e.x, e.y, z.x, z.y) > z.r) return;
        e.st.slow = Math.max(e.st.slow || 0, 0.6);
        if (o) chill(e, o, dt * 0.45);
    });
    if (z.tick > 0.5) { z.tick = 0; players.forEach(e => { if (e.hp > 0 && o && e !== o && !sameTeam(o, e) && dist(e.x, e.y, z.x, z.y) < z.r) dealDamage(e, 4, z.owner, { zone: true }); }); }
    for (let k = 0; k < 2; k++) { const r = Math.sqrt(Math.random()) * z.r, t = Math.random() * 6.28; particles.push({ x: z.x + Math.cos(t) * r, y: z.y + Math.sin(t) * r, vx: 80, vy: 40, life: 0.6, maxLife: 0.6, color: Math.random() < 0.5 ? '#f8fafc' : '#bae6fd', size: 2 }); }
}

/* ============================== KỸ THUẬT CAO ============================== */
Object.assign(HT, {
    WHIP: ['XÍCH TRÓI', p => { const w = getCurrentWeapon(p); whipLash(p, w, aimDir(p), 0, 1.3, { reach: 260, root: 1.5, noPull: true }); floatText(p.x, p.y - 40, '⛓ XÍCH TRÓI!', '#fbbf24', 15); }],
    EWHIP: ['XÍCH SÉT', p => {
        const w = getCurrentWeapon(p), hit = whipLash(p, w, aimDir(p), 0, 1.2, { reach: 300, noPull: true });
        if (hit.length) { W2FX.push({ kind: 'tether', owner: p.id, target: hit[0].id, t: 3, maxT: 3 }); floatText(hit[0].x, hit[0].y - 52, '⚡ BỊ XÍCH!', '#67e8f9', 15); }
    }],
    SCYTHE: ['TỬ THẦN LƯỚT', p => {
        const a = aimDir(p), ox = p.x, oy = p.y;
        let tx = p.x, ty = p.y;
        for (let d = 260; d >= 40; d -= 10) { const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d; if (x > p.radius && y > p.radius && x < MAP_W - p.radius && y < MAP_H - p.radius && !pointInObstacle(x, y, p.radius + 2)) { tx = x; ty = y; break; } }
        decoys.push({ x: ox, y: oy, angle: p.angle, speed: 0, owner: p.id, t: 3, hp: 40, color: p.color, radius: p.radius, label: p.label, soul: true });
        for (let k = 0; k <= 8; k++) smoke(ox + (tx - ox) * k / 8, oy + (ty - oy) * k / 8, 1, 'rgba(167,139,250,0.4)', 14);
        p.x = tx; p.y = ty; p.kx = p.ky = 0;
        setInvis(p, 'camo', 3); if (typeof invisAs === 'function') invisAs(p, 'camo');
        p.st.haste = Math.max(p.st.haste || 0, 3); p.reaperPass = world.time + 2; p.reaperNext = world.time + 6;
        ring(tx, ty, 6, 70, '#a78bfa', 0.4, 4); floatText(tx, ty - 40, '☠ TỬ THẦN LƯỚT!', '#c4b5fd', 15); AudioSys.playAt('trick', tx, ty, 0.5);
    }],
    UMBRELLA: ['HUYỀN CƠ BIẾN', p => umbHT(p)],
    ICEGUN: ['TƯỢNG BĂNG', p => {
        const e = enemiesOf(p).filter(q => dist(p.x, p.y, q.x, q.y) < 480 && targetable(p, q)).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y))[0];
        if (!e) { floatText(p.x, p.y - 34, 'Không có mục tiêu', '#94a3b8', 12); return; }
        beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, life: 0.3, maxLife: 0.3, color: '#bae6fd' });
        dealDamage(e, 15 * (p.dmgMult || 1), p.id, { knock: 1 }); freezeP(e, 2, p); floatText(e.x, e.y - 58, '🗿 TƯỢNG BĂNG!', '#e0f2fe', 16);
    }],
    MUSKET: ['BỤI CÂY', p => {
        const a = aimDir(p), x = p.x + Math.cos(a) * 30, y = p.y + Math.sin(a) * 30;
        bushes.push({ x, y, r: 100, t: 15, owner: p.id, grown: true, seed: Math.random() * 10 });
        for (let i = 0; i < 12; i++) particles.push({ x: x + (Math.random() - 0.5) * 140, y: y + (Math.random() - 0.5) * 140, vx: 0, vy: -40, life: 0.6, maxLife: 0.6, color: '#4ade80', size: 3 });
        floatText(p.x, p.y - 40, '🌿 BỤI CÂY!', '#4ade80', 15); AudioSys.playAt('ui', p.x, p.y, 0.3);
    }]
});
// Tử Thần Lướt: đạn xuyên qua (không trúng) · đòn kế tiếp ×2 (×4 với địch dưới 50% máu)
const _dealDamageW2 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && target.reaperPass > world.time && !opts.melee && !opts.zone) return 0;
    if (target && target.umbGuardT > world.time) dmg *= 0.7; // Huyền Cơ · Tán Che
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && atk !== target && atk.reaperNext > world.time && !opts.zone && getCurrentWeapon(atk).id !== 'SCYTHE') {
        atk.reaperNext = 0; dmg *= target.hp < target.maxHp * 0.5 ? 4 : 2;
    }
    return _dealDamageW2(target, dmg, attackerId, opts);
};
const _fireMeleeW2b = fireMelee;
fireMelee = function (p, w, ang, charge, mult, isSuper, enemy) {
    if (w.id === 'SCYTHE' && p.reaperNext > world.time) { p.reaperNext = 0; p.reaperArm = true; }
    return _fireMeleeW2b(p, w, ang, charge, mult, isSuper, enemy);
};

/* ============================== VÙNG NGẮM ============================== */
Object.assign(HT_PROFILE, {
    WHIP: { aim: 'dir', R: 260, shape: 'line', w: 24, col: '251,191,36' }, EWHIP: { aim: 'dir', R: 300, shape: 'line', w: 24, col: '103,232,249' },
    SCYTHE: { aim: 'dir', R: 260, shape: 'line', w: 40, col: '196,181,253' }, UMBRELLA: { aim: null, shape: 'selfaoe', aoe: 95, col: '244,114,182' },
    ICEGUN: { aim: 'dir', R: 480, shape: 'cone', half: 0.5, col: '186,230,253' }, MUSKET: { aim: 'dir', R: 80, shape: 'point', aoe: 100, col: '74,222,128' }
});
const _skillProfileW2 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p).id;
    if (id === 'meleeTech') {
        if (w === 'WHIP') return { aim: null, shape: 'selfaoe', aoe: 200, col: '253,230,138', tag: '⭐ 1s' };
        if (w === 'EWHIP') return { aim: null, shape: 'selfaoe', aoe: 340, col: '103,232,249' };
        if (w === 'SCYTHE') return { aim: 'dir', R: 560, shape: 'line', w: 80, col: '196,181,253' };
        if (w === 'UMBRELLA') return { aim: null, shape: 'selfaoe', aoe: 120, col: '244,114,182' };
    }
    if (id === 'gunMod') {
        if (w === 'ICEGUN') return { aim: 'point', R: 400, shape: 'point', aoe: 170, col: '186,230,253' };
        if (w === 'MUSKET') return { aim: 'dir', R: 270, shape: 'cone', half: 0.65, col: '253,186,116' };
        if (w === 'UMBRELLA') return { aim: 'dir', R: 440, shape: 'cone', half: 0.4, col: '125,211,252' };
    }
    return _skillProfileW2(p, id);
};

/* ============================== VẼ: VŨ KHÍ ============================== */
Object.assign(ART2, {
    WHIP: (c, w, r, x0, ch, now, p) => {
        wood(c, x0 - 4, -2.5, 13, 5, 2); metal(c, x0 + 8, -3, 3, 6, '#57534e', 1);
        c.strokeStyle = '#78716c'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x0 + 11, 0); // cuộn xích
        for (let i = 0; i < 6; i++) c.lineTo(x0 + 13 + i * 2.6, Math.sin(now * 6 + i) * (2 + ch * 3) + (i % 2 ? 2 : -2));
        c.stroke(); c.fillStyle = '#d6d3d1'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x0 + 13 + i * 2.6, i % 2 ? 2 : -2, 1.1, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#fbbf24'; c.beginPath(); c.moveTo(x0 + 28, -2.5); c.lineTo(x0 + 33, 0); c.lineTo(x0 + 28, 2.5); c.closePath(); c.fill(); outl(c, 0.8);
        if (ch >= 0.9) glint(c, x0 + 31, 0, 2.2);
    },
    EWHIP: (c, w, r, x0, ch, now, p) => {
        metal(c, x0 - 4, -2.8, 13, 5.6, '#1e293b', 2); c.fillStyle = '#22d3ee'; c.fillRect(x0 - 1, -0.8, 7, 1.6);
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(103,232,249,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 9, 0);
        for (let i = 0; i < 7; i++) c.lineTo(x0 + 11 + i * 2.8, Math.sin(now * 14 + i * 1.7) * (2.5 + ch * 3));
        c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.8; c.stroke();
        c.fillStyle = `rgba(165,243,252,${0.5 + Math.sin(now * 20) * 0.3})`; c.beginPath(); c.arc(x0 + 31, 0, 3 + ch * 2, 0, Math.PI * 2); c.fill();
        c.restore();
    },
    SCYTHE: (c, w, r, x0, ch, now, p) => {
        c.rotate(-ch * 0.9);
        wood(c, x0 - 10, -1.8, 44, 3.6, 1.6); // cán dài
        metal(c, x0 + 32, -3, 4, 6, '#3f3f46', 1);
        const g = c.createLinearGradient(x0 + 30, -26, x0 + 40, 4); g.addColorStop(0, '#ede9fe'); g.addColorStop(0.5, '#a78bfa'); g.addColorStop(1, '#4c1d95');
        c.beginPath(); c.moveTo(x0 + 34, -2); c.quadraticCurveTo(x0 + 52, -14, x0 + 38, -32); c.quadraticCurveTo(x0 + 44, -14, x0 + 30, -4); c.closePath();
        c.fillStyle = g; c.fill(); outl(c, 1);
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(196,181,253,${0.4 + Math.sin(now * 4) * 0.2 + ch * 0.4})`; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(x0 + 35, -3); c.quadraticCurveTo(x0 + 50, -14, x0 + 38, -31); c.stroke(); c.restore();
    },
    UMBRELLA: (c, w, r, x0, ch, now, p) => {
        const f = w.form || 0, col = UMB_FORMS[f].col;
        if (f === 0) { // gập: thân nhọn
            c.strokeStyle = '#78350f'; c.lineWidth = 2; c.beginPath(); c.arc(x0 - 3, 3, 3, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); // tay cầm cong
            metal(c, x0 - 3, -1.2, 30, 2.4, '#9ca3af', 1);
            c.beginPath(); c.moveTo(x0 + 6, -3.5); c.lineTo(x0 + 28, -1); c.lineTo(x0 + 34, 0); c.lineTo(x0 + 28, 1); c.lineTo(x0 + 6, 3.5); c.closePath(); c.fillStyle = col; c.fill(); outl(c, 1);
            glint(c, x0 + 33, 0, 1);
        } else if (f === 1) { // mở: tán ô chắn trước mặt
            metal(c, x0 - 3, -1.2, 18, 2.4, '#9ca3af', 1);
            const R = 15; c.save(); c.translate(x0 + 16, 0);
            const g = c.createRadialGradient(-4, 0, 2, 0, 0, R); g.addColorStop(0, '#e0f2fe'); g.addColorStop(1, col);
            c.beginPath(); c.arc(-2, 0, R, -1.25, 1.25); c.quadraticCurveTo(2, 0, Math.cos(-1.25) * R - 2, Math.sin(-1.25) * R); c.fillStyle = g; c.fill(); outl(c, 1.2);
            c.strokeStyle = 'rgba(15,23,42,0.4)'; c.lineWidth = 0.8; for (const t of [-0.7, 0, 0.7]) { c.beginPath(); c.moveTo(-2, 0); c.lineTo(-2 + Math.cos(t) * R, Math.sin(t) * R); c.stroke(); }
            c.restore();
        } else { // huyền cơ: lưỡi kiếm rút ra từ cán, tán ô nhỏ sau lưng
            metal(c, x0 - 4, -2, 9, 4, '#4c1d95', 1.5);
            blade(c, [[x0 + 5, -2.2], [x0 + 34, -1.2], [x0 + 39, 0], [x0 + 34, 1.2], [x0 + 5, 2.2]], '#e9d5ff', '#7c3aed');
            c.save(); c.globalAlpha = 0.85; c.beginPath(); c.arc(x0 - 6, 0, 9, Math.PI * 0.6, Math.PI * 1.4); c.lineTo(x0 - 6, 0); c.fillStyle = col; c.fill(); outl(c, 0.8); c.restore();
        }
        MUZ.UMBRELLA = x0 + 30;
    },
    ICEGUN: (c, w, r, x0, ch, now, p) => {
        metal(c, x0 - 6, -4, 12, 8, '#cbd5e1', 2.5, 0.5); // bình nén
        metal(c, x0 + 5, -3, 14, 6, '#0ea5e9', 2); metal(c, x0 + 18, -2, 6, 4, '#e0f2fe', 1.5);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(186,230,253,${0.45 + Math.sin(now * 5) * 0.2})`; c.fillRect(x0 + 7, -1, 10, 2); c.restore();
        metal(c, x0 - 2, 3, 3.5, 7, '#334155', 1); glint(c, x0 - 2, -2, 1.1);
        for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(224,242,254,0.85)'; c.beginPath(); c.moveTo(x0 + 20 + i * 1.5, -2); c.lineTo(x0 + 21 + i * 1.5, -5 - i); c.lineTo(x0 + 22 + i * 1.5, -2); c.fill(); }
        MUZ.ICEGUN = x0 + 24;
    },
    MUSKET: (c, w, r, x0, ch, now, p) => {
        wood(c, x0 - 18, -3, 30, 6, 3); // báng & thân gỗ dài
        metal(c, x0 + 8, -1.8, 34, 3.6, '#57534e', 1.2, 0.6); // nòng dài
        c.fillStyle = '#b45309'; [x0 + 14, x0 + 26].forEach(x => c.fillRect(x, -2.6, 2, 5.2)); // đai đồng
        metal(c, x0 - 2, -5, 6, 3, '#a16207', 1); // cò súng / ổ thuốc
        c.fillStyle = '#292524'; c.fillRect(x0 + 41, -1, 1.5, 2);
        if (ch > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(253,186,116,${0.3 + ch * 0.4})`; c.beginPath(); c.arc(x0 + 1, -5, 2 + ch * 1.5, 0, Math.PI * 2); c.fill(); c.restore(); }
        MUZ.MUSKET = x0 + 43;
    }
});

/* ============================== VẼ: HIỆU ỨNG TRONG THẾ GIỚI ============================== */
function drawW2Fx(now) {
    const me = localPlayer();
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    W2FX.forEach(f => {
        const o = players.find(q => q.id === f.owner);
        const k = Math.max(0, f.t / f.maxT), pr = 1 - k;
        if (f.kind === 'whip' && o) { // roi: vươn ra rồi thu về, uốn sóng
            const ext = Math.sin(Math.min(1, pr * 1.6) * Math.PI * 0.5) * (pr < 0.6 ? 1 : 1 - (pr - 0.6) / 0.4 * 0.9);
            const L = f.len * Math.max(0.05, ext), nx = -Math.sin(f.a), ny = Math.cos(f.a), amp = 14 * (1 - pr) * (f.pull ? 0.5 : 1);
            ctx.beginPath(); ctx.moveTo(o.x, o.y);
            const N = 14; let tx = o.x, ty = o.y;
            for (let i = 1; i <= N; i++) { const s = i / N, wv = Math.sin(s * Math.PI * 2.2 - pr * 9) * amp * s * (1 - s * 0.4); tx = o.x + Math.cos(f.a) * L * s + nx * wv; ty = o.y + Math.sin(f.a) * L * s + ny * wv; ctx.lineTo(tx, ty); }
            if (f.elec) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA('#67e8f9', 0.45 * k + 0.2); ctx.lineWidth = 7; ctx.stroke(); ctx.restore(); }
            ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 4.5; ctx.stroke();
            ctx.strokeStyle = f.col; ctx.lineWidth = 2.4; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = hexA(f.elec ? '#a5f3fc' : '#fde68a', 0.9); ctx.beginPath(); ctx.arc(tx, ty, 4 + (pr > 0.3 && pr < 0.6 ? 4 : 0), 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (f.kind === 'star' && o) { // báo trước Lốc Xích
            ctx.save(); ctx.translate(o.x, o.y - o.radius - 26); ctx.rotate(now * 4);
            const s = 9 + pr * 6; ctx.fillStyle = hexA('#fde68a', 0.6 + 0.4 * Math.sin(now * 20)); ctx.beginPath();
            for (let i = 0; i < 10; i++) { const rr = i % 2 ? s * 0.45 : s, t = i * Math.PI / 5; ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr); }
            ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
            ctx.strokeStyle = hexA('#fde68a', 0.25 + pr * 0.35); ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(o.x, o.y, 200 * (0.3 + pr * 0.7), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        } else if (f.kind === 'cres') { // lưỡi hái trăng khuyết bay
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 46); g.addColorStop(0, 'rgba(237,233,254,0.9)'); g.addColorStop(1, 'rgba(124,58,237,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 42, -1.3, 1.3); ctx.arc(-14, 0, 34, 1.15, -1.15, true); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 40, -1.2, 1.2); ctx.stroke(); ctx.restore();
        } else if (f.kind === 'umbFly') {
            const kk = Math.min(1, pr), cx = f.x0 + (f.x - f.x0) * kk, cy = f.y0 + (f.y - f.y0) * kk;
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(now * 18); ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.5)'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * 1.047) * 16, Math.sin(i * 1.047) * 16); ctx.stroke(); }
            ctx.restore();
        } else if (f.kind === 'tether' && o) {
            const e = players.find(q => q.id === f.target); if (e) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA('#67e8f9', 0.35 + Math.sin(now * 30) * 0.2); ctx.lineWidth = 2; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(e.x, e.y); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
        } else if (f.kind === 'powder') { // cảnh báo hình quạt
            if (o) { ctx.fillStyle = `rgba(253,186,116,${0.08 + pr * 0.18})`; ctx.strokeStyle = `rgba(253,186,116,${0.4 + pr * 0.4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.arc(o.x, o.y, 270, f.a - 0.65, f.a + 0.65); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        } else if (f.kind === 'fan') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(f.x, f.y, 10, f.x, f.y, f.R); g.addColorStop(0, `rgba(255,251,235,${k})`); g.addColorStop(0.5, `rgba(253,186,116,${0.6 * k})`); g.addColorStop(1, 'rgba(234,88,12,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.R * (0.6 + pr * 0.4), f.a - f.half, f.a + f.half); ctx.closePath(); ctx.fill(); ctx.restore();
        }
    });
    // mặt đất: điểm dịch chuyển của Gặt Hồn
    if (me && me.reapTp && me.reapTp.t > world.time) { const T = me.reapTp; ctx.strokeStyle = hexA('#a78bfa', 0.5 + Math.sin(now * 6) * 0.3); ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(T.x, T.y, me.radius + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(T.x, T.y); ctx.strokeStyle = 'rgba(167,139,250,0.18)'; ctx.stroke(); }
    // bão tuyết
    zones.forEach(z => { if (z.type !== 'blizzard') return; const a = Math.min(1, z.t) * 0.9; ctx.fillStyle = `rgba(224,242,254,${0.14 * a})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(186,230,253,${0.6 * a})`; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -now * 30; ctx.stroke(); ctx.setLineDash([]); });
    // người bị đóng băng: khối băng · Huyền Cơ: khiên/dạng
    players.forEach(p => {
        if (p.hp <= 0) return;
        if (p.frozenT > world.time) { ctx.save(); ctx.fillStyle = 'rgba(186,230,253,0.45)'; ctx.strokeStyle = 'rgba(240,249,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const t = i * Math.PI / 3 + 0.3, rr = p.radius + 7 + (i % 2) * 4; ctx.lineTo(p.x + Math.cos(t) * rr, p.y + Math.sin(t) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
        else if (p.iceB > 0.2 && world.time - (p.iceLast || -9) < 0.5) { ctx.strokeStyle = `rgba(186,230,253,${Math.min(0.8, p.iceB / 2)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p.iceB / 2)); ctx.stroke(); }
        const w = getCurrentWeapon(p);
        if (w && w.id === 'UMBRELLA' && (!p.st.invis || p === me)) drawUmbUI(p, w, now, p === me);
        if (p.umbDome > world.time) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA('#f472b6', 0.55 + Math.sin(now * 10) * 0.2); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 92, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = 'rgba(244,114,182,0.08)'; ctx.fill(); ctx.restore(); }
    });
    ctx.restore();
}
function drawUmbUI(p, w, now, mine) {
    const f = w.form || 0, col = UMB_FORMS[f].col;
    // khiên phía trước (dạng Mở luôn có, Huyền Cơ khi không đánh)
    const shield = f === 1 || (f === 2 && world.time - (p.lastFireT || -9) > 0.45);
    if (shield && !p.umbPush) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(col, 0.5); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + (f === 1 ? 30 : 26), p.angle - (f === 1 ? 0.85 : 0.8), p.angle + (f === 1 ? 0.85 : 0.8)); ctx.stroke(); ctx.restore(); }
    if (!mine) return;
    // hào quang buff & số đòn cường hoá còn lại
    const B = p.umbBuff;
    if (p.umbAuraT > world.time) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = hexA(UMB_FORMS[f].col, 0.35 + Math.sin(now * 8) * 0.15); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 9, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    if (B && B.f === f && B.n > 0 && B.t > world.time) {
        const yy = p.y - p.radius - 42;
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(p.x + (i - 1) * 11, yy); ctx.rotate(Math.PI / 4); ctx.fillStyle = i < B.n ? UMB_FORMS[f].col : 'rgba(100,116,139,0.45)'; ctx.fillRect(-3.5, -3.5, 7, 7); if (i < B.n) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(-3.5, -3.5, 7, 7); } ctx.restore(); }
    }
    // 3 chấm dạng trên đầu
    const y = p.y - p.radius - 30;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p.x + (i - 1) * 12, y, i === f ? 4.5 : 3, 0, Math.PI * 2); ctx.fillStyle = i === f ? UMB_FORMS[i].col : 'rgba(148,163,184,0.5)'; ctx.fill(); if (i === f) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); } }
    // đang giữ: hiện hướng + khoảng cách chuyển dạng
    const ch = p.charge || 0;
    if (ch > 0.1) {
        const T = UMB_TR[f], a = p.angle + T.dir, ready = ch >= 0.9;
        const D = f === 1 ? 0.32 * 720 : Math.max(30, rayFree(p.x, p.y, a, T.D).d);
        const ex = p.x + Math.cos(a) * D, ey = p.y + Math.sin(a) * D, nc = UMB_FORMS[(f + 1) % 3].col;
        ctx.save(); ctx.strokeStyle = hexA(nc, ready ? 0.95 : 0.4); ctx.lineWidth = ready ? 3 : 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -now * 40;
        ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * p.radius, p.y + Math.sin(a) * p.radius); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = hexA(nc, ready ? 0.95 : 0.45); ctx.beginPath(); ctx.moveTo(ex + Math.cos(a) * 10, ey + Math.sin(a) * 10); ctx.lineTo(ex + Math.cos(a + 2.5) * 10, ey + Math.sin(a + 2.5) * 10); ctx.lineTo(ex + Math.cos(a - 2.5) * 10, ey + Math.sin(a - 2.5) * 10); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(ex, ey, p.radius, 0, Math.PI * 2); ctx.strokeStyle = hexA(nc, 0.35); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        const label = (ready ? '▶ ' : '') + `${UMB_FORMS[(f + 1) % 3].icon} ${UMB_FORMS[f].tr} · ✦ ${UMB_BUFF[(f + 1) % 3].name}`;
        ctx.strokeText(label, p.x, y - 12); ctx.fillStyle = ready ? nc : '#cbd5e1'; ctx.fillText(label, p.x, y - 12);
        ctx.restore();
    }
}
const _drawZoneW2 = drawZone;
drawZone = function (now) { try { drawW2Fx(now); } catch (e) {} return _drawZoneW2(now); };

/* ============================== HUYỀN CƠ: KỸ NĂNG THEO DẠNG ============================== */
function umbFreeSpot(p, x, y) { // điểm đáp không nằm trong vật cản (lùi dần về phía người chơi)
    const a = Math.atan2(y - p.y, x - p.x), D = dist(p.x, p.y, x, y);
    for (let d = D; d >= 0; d -= 12) { const px = p.x + Math.cos(a) * d, py = p.y + Math.sin(a) * d; if (px > p.radius && py > p.radius && px < MAP_W - p.radius && py < MAP_H - p.radius && !pointInObstacle(px, py, p.radius + 2)) return { x: px, y: py }; }
    return { x: p.x, y: p.y };
}
function umbRing(p, x, y, n, dmg, off, col, spd = 18, range = 320) {
    for (let i = 0; i < n; i++) spawnBullet(p, x, y, off + i * Math.PI * 2 / n, { speed: spd, damage: dmg * (p.meleeMult || 1), range: range + dist(p.x, p.y, x, y), color: col, size: 3.4, trail: 26, knock: 90, bounces: 0 });
}
function umbJump(p, x, y, T, h, fn) { const L = umbFreeSpot(p, x, y); startTravel(p, L.x, L.y, T, 'umbLand', { fn }, h); }
const _landEffectW2 = landEffect;
landEffect = function (p, kind, o) { if (kind === 'umbLand') { try { o && o.fn && o.fn(p); } catch (e) {} return; } return _landEffectW2(p, kind, o); };

// Kỹ Thuật Cận Chiến
function umbMT(p, w, a) {
    const f = w.form || 0;
    if (f === 0) { // Đâm ô xoáy: ô xoay trước mặt, gây sát thương + chặn & phản đạn; kết thúc kéo địch lại + choáng
        W2FX.push({ kind: 'umbDrill', owner: p.id, a, t: 1.3, maxT: 1.3, tick: 0 });
        floatText(p.x, p.y - 40, '🌀 Ô XOÁY PHÁ!', '#f472b6', 16); AudioSys.playAt('whoosh', p.x, p.y, 0.6); castFx(p, '#f472b6', false);
        return;
    }
    // dạng Huyền Cơ: lướt nhẹ rồi chém tròn 360°
    p.dashTime = 0.16; p.dashAngle = a; p.st.invuln = Math.max(p.st.invuln || 0, 0.16);
    smoke(p.x, p.y, 4, 'rgba(192,132,252,0.35)', 12);
    p.shotQueue.push({ t: 0.17, fn: () => {
        if (p.hp <= 0) return;
        const R = 135;
        [0, Math.PI].forEach(o => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + o, range: R, color: '#f0abfc', width: 15, life: 0.32, maxLife: 0.32, swing: 1, line: false, arc: Math.PI / 2 }));
        ring(p.x, p.y, p.radius, R, '#c084fc', 0.4, 7); addShake(6); AudioSys.playAt('swing', p.x, p.y, 0.8);
        let n = 0;
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < R + e.radius) { dealDamage(e, 28 * (p.meleeMult || 1), p.id, { melee: true, knock: 320, angle: Math.atan2(e.y - p.y, e.x - p.x) }); n++; p.stats.hits++; } });
        p.st.haste = Math.max(p.st.haste || 0, 2.5);
        if (n) {
            const heal = p.maxHp * 0.08 * Math.min(3, n); p.hp = Math.min(p.maxHp, p.hp + heal);
            p.st.shield = Math.min(90, (p.st.shield || 0) + 25 + 10 * n); p.st.shieldT = Math.max(p.st.shieldT || 0, 4);
            floatText(p.x, p.y - 30, `+${Math.round(heal)} · 🛡 KHIÊN`, '#f0abfc', 13); hitStop(0.06);
        }
        floatText(p.x, p.y - 48, '⚔️ HUYỀN CƠ TOÀN TRẢM!', '#d8b4fe', 16);
    } });
}
function updateUmbDrill(f, dt) {
    const o = players.find(q => q.id === f.owner); if (!o || o.hp <= 0) { f.t = 0; return; }
    f.a = o.angle; // ô xoay theo hướng nhìn
    const D = o.radius + 46, x = o.x + Math.cos(f.a) * D, y = o.y + Math.sin(f.a) * D; f.x = x; f.y = y;
    for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (b.owner === o.id || dist(b.x, b.y, x, y) > 62) continue; if (b.explosive) { bullets.splice(i, 1); continue; } b.owner = o.id; b.angle = Math.atan2(b.y - o.y, b.x - o.x) + (Math.random() - 0.5) * 0.3; b.life = Math.max(b.life, 0.8); b.color = '#f9a8d4'; spark(b.x, b.y, '#f9a8d4', 3, 140); }
    f.tick += dt;
    if (f.tick >= 0.15) { f.tick = 0; enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, x, y) < e.radius + 44) { dealDamage(e, 5 * (o.meleeMult || 1), o.id, { melee: true, knock: 60, angle: f.a }); spark(e.x, e.y, '#f9a8d4', 3, 160); } }); if (Math.random() < 0.5) AudioSys.playAt('swing', x, y, 0.15); }
    if (f.t - dt <= 0) { // kết thúc: kéo địch trong vùng rộng về trước ô + choáng
        const R = 240;
        enemiesOf(o).forEach(e => {
            if (e.air > 0 || dist(e.x, e.y, x, y) > R + e.radius || !lineOfSight(x, y, e.x, e.y)) return;
            const ea = Math.atan2(y - e.y, x - e.x), d = Math.max(0, dist(e.x, e.y, x, y) - 30);
            const nx = e.x + Math.cos(ea) * d * 0.85, ny = e.y + Math.sin(ea) * d * 0.85;
            if (!pointInObstacle(nx, ny, e.radius)) { beams.push({ x1: e.x, y1: e.y, x2: nx, y2: ny, life: 0.2, maxLife: 0.2, color: '#f472b6' }); e.x = nx; e.y = ny; }
            e.stun = Math.max(e.stun, 0.9); dealDamage(e, 12 * (o.meleeMult || 1), o.id, { melee: true, knock: 1 });
            floatText(e.x, e.y - 44, '🌀 BỊ KÉO!', '#f472b6', 14);
        });
        ring(x, y, 10, R, '#f472b6', 0.5, 6); addShake(7); AudioSys.playAt('slam', x, y, 0.5);
    }
}
// Trang Bị Phụ (dạng Mở): quạt kim + tốc chạy + tốc bắn + 3 phát tiếp theo là đạn nổ
function umbGM(p, w, a) {
    if ((w.form || 0) !== 1) { w.form = 1; floatText(p.x, p.y - 56, '☂️ MỞ', '#38bdf8', 13); }
    const m = muzzle(p, w, a);
    for (let i = 0; i < 10; i++) p.shotQueue.push({ t: i * 0.03, fn: () => { if (p.hp <= 0) return; spawnBullet(p, m.x, m.y, a + (i - 4.5) * 0.08, { speed: 22, damage: 10 * (p.dmgMult || 1), range: 440, color: '#7dd3fc', size: 3, trail: 28 }); } });
    p.st.haste = Math.max(p.st.haste || 0, 3); p.umbRapidT = world.time + 4; p.umbBoom = 3;
    AudioSys.playAt('smg', p.x, p.y, 0.4); floatText(p.x, p.y - 40, '☂️ MƯA KIM · TỐC BẮN · 3 ĐẠN NỔ', '#7dd3fc', 14);
    ring(p.x, p.y, 8, 60, '#38bdf8', 0.4, 4);
}
// Kỹ Thuật Cao: chuỗi chiêu theo dạng, kết thúc chuyển dạng tiếp theo
function umbHT(p) {
    const w = getCurrentWeapon(p); if (!w || w.id !== 'UMBRELLA') return;
    const f = w.form || 0, a = aimDir(p);
    const pt = R => { const d = Math.max(80, Math.min(R, p.skillDist || R * 0.8)); return { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d }; };
    if (f === 0) { // nhảy lên → cắm ô xuống điểm đáp: choáng → vòng đạn → chuyển Mở
        const T = pt(320);
        floatText(p.x, p.y - 40, '🌂 CẮM Ô!', '#f472b6', 16); AudioSys.playAt('whoosh', p.x, p.y, 0.5);
        umbJump(p, T.x, T.y, 0.5, 95, q => {
            W2FX.push({ kind: 'umbPlant', owner: q.id, x: q.x, y: q.y, t: 1.1, maxT: 1.1 });
            ring(q.x, q.y, 10, 120, '#f472b6', 0.5, 7); addShake(10); AudioSys.playAt('slam', q.x, q.y, 0.6);
            enemiesOf(q).forEach(e => { if (!(e.air > 0) && dist(q.x, q.y, e.x, e.y) < 120 + e.radius) { dealDamage(e, 20 * (q.meleeMult || 1), q.id, { melee: true, knock: 260, angle: Math.atan2(e.y - q.y, e.x - q.x) }); e.stun = Math.max(e.stun, 1.1); } });
            const cx = q.x, cy = q.y;
            q.shotQueue.push({ t: 0.3, fn: () => { umbRing(q, cx, cy, 18, 9, Math.random(), '#fbcfe8'); AudioSys.playAt('shotgun', cx, cy, 0.5); } });
            q.shotQueue.push({ t: 0.45, fn: () => { if (q.hp > 0) umbEnterForm(q, 1); floatText(q.x, q.y - 56, '☂️ MỞ', '#38bdf8', 13); } });
        });
        return;
    }
    if (f === 1) { // ném ô lên trời: 3 đợt đạn tròn loạn xạ → nhảy bay tới điểm đáp → chuyển Huyền Cơ
        const T = pt(380), sx = p.x, sy = p.y;
        W2FX.push({ kind: 'umbSky', owner: p.id, x: sx, y: sy, t: 1.25, maxT: 1.25 });
        floatText(p.x, p.y - 40, '☂️ Ô THIÊN VŨ!', '#38bdf8', 16); AudioSys.playAt('whoosh', p.x, p.y, 0.6);
        for (let k = 0; k < 3; k++) p.shotQueue.push({ t: 0.3 + k * 0.3, fn: () => {
            if (p.hp <= 0) return;
            for (let i = 0; i < 14; i++) { const ang = Math.random() * Math.PI * 2; spawnBullet(p, sx, sy, ang, { speed: 14 + Math.random() * 9, damage: 8 * (p.meleeMult || 1), range: 260 + Math.random() * 120 + dist(p.x, p.y, sx, sy), color: '#bae6fd', size: 3.2, trail: 22, knock: 80, bounces: 0 }); }
            AudioSys.playAt('smg', sx, sy, 0.4); ring(sx, sy, 6, 50, '#7dd3fc', 0.3, 3);
        } });
        p.shotQueue.push({ t: 1.05, fn: () => {
            if (p.hp <= 0) return;
            umbJump(p, T.x, T.y, 0.7, 130, q => { ring(q.x, q.y, 8, 90, '#c084fc', 0.45, 5); addShake(5); umbEnterForm(q, 2); floatText(q.x, q.y - 56, '⚔️ HUYỀN CƠ', '#c084fc', 13); });
        } });
        return;
    }
    // dạng Huyền Cơ: chém 1 vòng → ném khiên ra trước → nhảy tới chỗ khiên, đáp xuống chém choáng → chuyển Gập
    const R = 120;
    [0, Math.PI].forEach(o => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + o, range: R, color: '#d8b4fe', width: 13, life: 0.3, maxLife: 0.3, swing: 1, line: false, arc: Math.PI / 2 }));
    enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < R + e.radius) dealDamage(e, 20 * (p.meleeMult || 1), p.id, { melee: true, knock: 240, angle: Math.atan2(e.y - p.y, e.x - p.x) }); });
    AudioSys.playAt('swing', p.x, p.y, 0.7);
    const D = Math.max(60, rayFree(p.x, p.y, a, Math.max(120, Math.min(340, p.skillDist || 300))).d), tx = p.x + Math.cos(a) * D, ty = p.y + Math.sin(a) * D;
    W2FX.push({ kind: 'umbFly', owner: p.id, x0: p.x, y0: p.y, x: tx, y: ty, a, t: 0.35, maxT: 0.35, shield: true });
    floatText(p.x, p.y - 40, '⚔️ TRẢM THIÊN!', '#d8b4fe', 16);
    p.shotQueue.push({ t: 0.38, fn: () => {
        if (p.hp <= 0) return;
        umbJump(p, tx, ty, 0.42, 90, q => {
            const RR = 105;
            [0, Math.PI].forEach(o => slashes.push({ x: q.x, y: q.y, ownerId: q.id, angle: a + o, range: RR, color: '#f0abfc', width: 16, life: 0.3, maxLife: 0.3, swing: -1, line: false, arc: Math.PI / 2 }));
            enemiesOf(q).forEach(e => { if (!(e.air > 0) && dist(q.x, q.y, e.x, e.y) < RR + e.radius) { dealDamage(e, 30 * (q.meleeMult || 1), q.id, { melee: true, knock: 280, angle: Math.atan2(e.y - q.y, e.x - q.x) }); e.stun = Math.max(e.stun, 1); floatText(e.x, e.y - 44, '💫 CHOÁNG!', '#f0abfc', 13); } });
            ring(q.x, q.y, 10, RR, '#f0abfc', 0.45, 7); addShake(9); hitStop(0.06); AudioSys.playAt('slam', q.x, q.y, 0.5);
            umbEnterForm(q, 0); floatText(q.x, q.y - 56, '🌂 GẬP', '#f472b6', 13);
        });
    } });
}
// cập nhật / vẽ hiệu ứng mới
const _upeW2u = updatePartyExtras;
updatePartyExtras = function (dt) {
    W2FX.forEach(f => { if (f.kind === 'umbDrill' && f.t > 0) updateUmbDrill(f, dt); });
    W2FX.forEach(f => { if (f.kind === 'umbFly' && f.shield) { const o = players.find(q => q.id === f.owner); if (!o) return; const k = 1 - Math.max(0, f.t) / f.maxT, cx = f.x0 + (f.x - f.x0) * k, cy = f.y0 + (f.y - f.y0) * k; enemiesOf(o).forEach(e => { if (dist(e.x, e.y, cx, cy) < e.radius + 22 && !(f.hitSet || (f.hitSet = new Set())).has(e.id)) { f.hitSet.add(e.id); dealDamage(e, 12 * (o.meleeMult || 1), o.id, { melee: true, knock: 200, angle: f.a }); } }); } });
    return _upeW2u(dt);
};
const _drawW2FxU = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxU(now);
    ctx.save();
    W2FX.forEach(f => {
        const pr = 1 - Math.max(0, f.t) / f.maxT;
        if (f.kind === 'umbDrill' && f.x !== undefined) {
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(now * 22);
            ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(244,114,182,0.18)'; ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#f472b6' : '#fbcfe8'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 26, i * Math.PI / 4, (i + 1) * Math.PI / 4); ctx.closePath(); ctx.fill(); }
            ctx.strokeStyle = 'rgba(15,23,42,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            const o = players.find(q => q.id === f.owner);
            if (o && f.t < 0.5) { ctx.strokeStyle = `rgba(244,114,182,${0.25 + (0.5 - f.t)})`; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(f.x, f.y, 240 * (1 - f.t), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
        } else if (f.kind === 'umbPlant') {
            const k = Math.max(0, f.t / f.maxT);
            ctx.save(); ctx.globalAlpha = Math.min(1, k * 2); ctx.translate(f.x, f.y);
            ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
            ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(0, -34, 22, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(15,23,42,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 0, 26 * (1 + pr), 8 * (1 + pr), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        } else if (f.kind === 'umbSky') {
            const up = Math.sin(Math.min(1, pr * 1.6) * Math.PI / 2) * 120, k = Math.max(0, f.t / f.maxT);
            ctx.save(); ctx.globalAlpha = Math.min(1, k * 3); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.translate(f.x, f.y - up); ctx.rotate(now * 9); ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.5)'; ctx.lineWidth = 1; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * Math.PI / 4) * 24, Math.sin(i * Math.PI / 4) * 24); ctx.stroke(); }
            ctx.restore();
        } else if (f.kind === 'umbFly' && f.shield) {
            const kk = Math.min(1, pr), cx = f.x0 + (f.x - f.x0) * kk, cy = f.y0 + (f.y - f.y0) * kk;
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(192,132,252,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            ctx.strokeStyle = 'rgba(192,132,252,0.35)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 26, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        }
    });
    ctx.restore();
};
// vùng ngắm theo dạng
const _skillProfileW2u = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'UMBRELLA') {
        const f = w.form || 0;
        if (id === 'meleeTech') return f === 0 ? { aim: 'dir', R: 240, shape: 'cone', half: 0.9, col: '244,114,182', tag: '🌀 Ô XOÁY' } : f === 2 ? { aim: 'dir', R: 115, shape: 'point', aoe: 135, col: '192,132,252', tag: '⚔️ TOÀN TRẢM' } : { aim: null, shape: 'selfaoe', aoe: 120, col: '244,114,182' };
        if (id === 'gunMod') return { aim: 'dir', R: 440, shape: 'cone', half: 0.4, col: '125,211,252', tag: '💥 3 ĐẠN NỔ' };
        if (id === 'hightech') return f === 0 ? { aim: 'point', R: 320, shape: 'point', aoe: 120, arc: true, col: '244,114,182', tag: '🌂 CẮM Ô → MỞ' } : f === 1 ? { aim: 'point', R: 380, shape: 'point', aoe: 70, arc: true, col: '56,189,248', tag: '☂️ THIÊN VŨ → HUYỀN CƠ' } : { aim: 'point', R: 340, shape: 'point', aoe: 105, arc: true, col: '192,132,252', tag: '⚔️ TRẢM THIÊN → GẬP' };
    }
    return _skillProfileW2u(p, id);
};
CARDS.meleeTech.desc += '<br><b>Huyền Cơ</b> theo dạng: Gập = Ô Xoáy Phá (ô xoay trước mặt, phản đạn, kết thúc kéo địch + choáng) · Mở = Ô Xoay · Huyền Cơ = Toàn Trảm (lướt + chém 360°, tốc chạy, trúng thì hồi máu + khiên).';
CARDS.gunMod.desc += '<br><b>Huyền Cơ</b>: Mưa Kim + tốc chạy + tốc bắn; 3 phát tiếp theo là đạn nổ.';
