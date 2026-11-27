/** ==================== LÀM LẠI KỸ NĂNG SÚNG (Bậc Thầy Tầm Xa) ====================
 *  Gatling xả loạn xạ · Bắn tỉa Mắt Diều Hâu · SMG Băng Trống thật · Shotgun đạn sên nổ mảnh
 *  · Song Súng cầu năng lượng phóng điện · Cung mưa tên rõ hơn · Súng Điện lồng điện mạnh hơn. Nạp sau polish.js.
 */
const slugs = [], orbs = [];
const _gunModCast14 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p), a = aimDir(p), m0 = muzzle(p, w, a);
    switch (w.id) {
        case 'MINIGUN': // Cuồng Phong: 2.5 giây xả đạn loạn xạ, hướng theo tay ngắm
            if (w.magSize) w.mag = Math.max(w.mag, effMag(p, w));
            p.gatStorm = { t: 2.5, tick: 0 }; p.gatSpin = null;
            floatText(p.x, p.y - 38, '🌪 CUỒNG PHONG!', '#fb923c', 16); AudioSys.playAt('alarm', p.x, p.y, 0.2); addShake(4);
            return;
        case 'SMG': case 'SAR':
            if (w.id === 'SAR') break;
            if (w.magSize) { w.mag = Math.max(w.mag, effMag(p, w)); w.reloading = false; }
            p.drumT = world.time + 4;
            ring(p.x, p.y, 8, 44, '#fde047', 0.35, 5); floatText(p.x, p.y - 38, '🥁 BĂNG TRỐNG: BẮN NHANH ×2 · ĐẠN NẢY', '#fde047', 14); AudioSys.playAt('select', p.x, p.y, 0.4);
            return;
        case 'SNIPER': // Mắt Diều Hâu: 4 giây — lộ địch phía trước, ngắm là đầy lực ngay, toàn chí mạng
            p.hawkT = world.time + 4; p.hawkAng = a; p.st.sureCrit = Math.max(p.st.sureCrit || 0, 4);
            ring(p.x, p.y, 10, 60, '#a5b4fc', 0.4, 4); flash('#a5b4fc', 0.06);
            floatText(p.x, p.y - 38, '🦅 MẮT DIỀU HÂU: tụ lực tức thì · toàn chí mạng', '#c7d2fe', 14);
            return;
        case 'SHOTGUN': { // đạn sên to, xuyên người, chạm tường / hết tầm thì nổ thành 10 mảnh
            const b = spawnBullet(p, m0.x, m0.y, a, { speed: 26, damage: 70, range: 560, color: '#fef3c7', size: 6, pierce: true, knock: 380, trail: 70, bounces: 0 });
            slugs.push({ b, owner: p.id }); p.kx -= Math.cos(a) * 260; p.ky -= Math.sin(a) * 260;
            directionalSpark(m0.x, m0.y, a, '#fde68a', 14, 460, 0.45); addShake(7); AudioSys.playAt('shotgun', p.x, p.y, 0.8);
            floatText(p.x, p.y - 38, '🔘 ĐẠN SÊN NỔ MẢNH', '#fef3c7', 14);
            return;
        }
        case 'DUAL': { // cầu năng lượng bay chậm, phóng điện vào địch xung quanh rồi nổ
            const b = spawnBullet(p, m0.x, m0.y, a, { speed: 7, damage: 30, range: 560, color: '#c4b5fd', size: 13, bounces: 1, trail: 10 });
            orbs.push({ b, owner: p.id, tick: 0 });
            floatText(p.x, p.y - 38, '🔮 CẦU NĂNG LƯỢNG', '#c4b5fd', 15); AudioSys.playAt('rail', p.x, p.y, 0.3);
            return;
        }
    }
    return _gunModCast14(p);
};
// Băng Trống: bắn nhanh gấp đôi, đạn nảy 1 lần
const _fireWeapon14 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const r = _fireWeapon14(p, w, ang, charge, enemy);
    if (p.drumT > world.time && w.type === 'GUN') p.cooldown *= 0.5;
    if (p.hawkT > world.time && w.id === 'SNIPER') { ring(p.x + Math.cos(ang) * 30, p.y + Math.sin(ang) * 30, 4, 30, '#c7d2fe', 0.2, 2); }
    return r;
};
const _spawnBullet14 = spawnBullet;
spawnBullet = function (p, x, y, ang, o) {
    const b = _spawnBullet14(p, x, y, ang, o);
    if (p && p.drumT > world.time && (b.wid === 'SMG')) { b.bounces = Math.max(b.bounces || 0, 1); b.color = '#fde047'; }
    return b;
};
function updateGunFx(dt) {
    players.forEach(p => {
        if (p.hp <= 0 || !p.st) { p.gatStorm = null; return; }
        const w = getCurrentWeapon(p);
        // Gatling: xả loạn xạ quanh hướng ngắm, tốc độ & tầm ngẫu nhiên
        if (p.gatStorm) {
            const G = p.gatStorm; G.t -= dt; G.tick -= dt;
            const aim = p.aimAngle !== undefined && p.aiming ? p.aimAngle : p.angle;
            while (G.tick <= 0) {
                G.tick += 0.022;
                for (let k = 0; k < 2; k++) {
                    const aa = aim + (Math.random() - 0.5) * 2.3, sp = 17 + Math.random() * 12, m = muzzle(p, w, aa);
                    spawnBullet(p, m.x, m.y, aa, { speed: sp, damage: 6, range: 380 + Math.random() * 260, color: Math.random() < 0.5 ? '#fdba74' : '#fde68a', size: 2.2 + Math.random(), trail: 14 + Math.random() * 20, bounces: 0 });
                }
                if (Math.random() < 0.5) directionalSpark(p.x + Math.cos(aim) * 22, p.y + Math.sin(aim) * 22, aim + (Math.random() - 0.5) * 1.5, '#fde68a', 2, 300, 0.2);
                if (Math.random() < 0.35) particles.push({ x: p.x, y: p.y, vx: Math.cos(aim + Math.PI / 2) * (60 + Math.random() * 60), vy: Math.sin(aim + Math.PI / 2) * (60 + Math.random() * 60), life: 0.35, maxLife: 0.35, color: '#eab308', size: 2 }); // vỏ đạn
            }
            p.recoil = 1; p.muzzle = 0.05; p.st.slow = Math.max(p.st.slow || 0, 0.05);
            if (Math.random() < 0.3) { AudioSys.playAt('smg', p.x, p.y, 0.25); addShake(1.5); }
            if (G.t <= 0) p.gatStorm = null;
        }
        // Mắt Diều Hâu: lộ địch trong nón 1000, ngắm là đầy lực
        if (p.hawkT > world.time) {
            const a = p.aiming && p.aimAngle !== undefined ? p.aimAngle : p.angle;
            enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 1000 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.4) spotFor(e, p.id, 0.3); });
            if (w.id === 'SNIPER' && p.aiming) p.charge = 1;
        }
        // Lồng điện Súng Điện mạnh hơn: cứ 1 giây giật choáng ngắn
        if (p.teslaCage) { p.teslaCage.stunT = (p.teslaCage.stunT || 0) - dt; if (p.teslaCage.stunT <= 0) { p.teslaCage.stunT = 1; enemiesOf(p).forEach(e => { if (dist(e.x, e.y, p.x, p.y) < 150 + e.radius && !(e.st.cleanseT > 0)) { e.stun = Math.max(e.stun, 0.3); dealDamage(e, 8, p.id, { noCharge: true }); floatText(e.x, e.y - 30, '⚡ GIẬT!', '#93c5fd', 12); } }); } }
        // Mưa tên rõ hơn: mũi tên rơi + cắm xuống đất
        if (p.arrowRain && world.time >= p.arrowRain.lockAt) {
            const A = p.arrowRain;
            for (let k = 0; k < 2; k++) { const aa = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 120, x = A.x + Math.cos(aa) * r, y = A.y + Math.sin(aa) * r; particles.push({ x: x - 30, y: y - 90, vx: 200, vy: 600, life: 0.15, maxLife: 0.15, color: '#d9f99d', size: 2.5, glow: true }); if (Math.random() < 0.3) spark(x, y, '#bef264', 2, 80, 0.2, 2); }
        }
    });
    // đạn sên: hết đường / chạm tường → nổ mảnh
    for (let i = slugs.length - 1; i >= 0; i--) {
        const S = slugs[i]; if (!S) continue;
        if (bullets.includes(S.b)) { S.x = S.b.x; S.y = S.b.y; S.a = S.b.angle; if (Math.random() < 0.7) particles.push({ x: S.b.x, y: S.b.y, vx: 0, vy: 0, life: 0.25, maxLife: 0.25, color: 'rgba(254,243,199,0.5)', size: 5, glow: true }); continue; }
        slugs.splice(i, 1);
        const o = players.find(q => q.id === S.owner); if (!o || S.x === undefined) continue;
        ring(S.x, S.y, 8, 50, '#fde68a', 0.3, 4); addShake(4); AudioSys.playAt('shotgun', S.x, S.y, 0.4);
        for (let k = 0; k < 10; k++) { const aa = (S.a || 0) + Math.PI + (Math.random() - 0.5) * 3.6; spawnBullet(o, S.x - Math.cos(S.a || 0) * 12, S.y - Math.sin(S.a || 0) * 12, aa, { speed: 18 + Math.random() * 6, damage: 9, range: 160, color: '#fde68a', size: 2, trail: 10, bounces: 0 }); }
    }
    // cầu năng lượng: phóng điện mỗi 0.25 giây, hết đường thì nổ
    for (let i = orbs.length - 1; i >= 0; i--) {
        const O = orbs[i]; if (!O) continue; const o = players.find(q => q.id === O.owner);
        if (bullets.includes(O.b)) {
            O.x = O.b.x; O.y = O.b.y; O.tick -= dt;
            if (Math.random() < 0.9) particles.push({ x: O.b.x + (Math.random() - 0.5) * 14, y: O.b.y + (Math.random() - 0.5) * 14, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.35, maxLife: 0.35, color: Math.random() < 0.5 ? '#c4b5fd' : '#e0e7ff', size: 3, glow: true });
            if (O.tick <= 0 && o) { O.tick = 0.25; enemiesOf(o).filter(e => dist(e.x, e.y, O.x, O.y) < 170).slice(0, 2).forEach(e => { beams.push({ x1: O.x, y1: O.y, x2: e.x, y2: e.y, life: 0.14, maxLife: 0.14, color: '#c4b5fd', zig: 1 }); dealDamage(e, 9, o.id, { noCharge: true }); e.st.slow = Math.max(e.st.slow || 0, 0.3); }); }
            continue;
        }
        orbs.splice(i, 1);
        if (o && O.x !== undefined) { explosionFx(O.x, O.y, 80); ring(O.x, O.y, 10, 100, '#c4b5fd', 0.4, 6); enemiesOf(o).forEach(e => { if (dist(e.x, e.y, O.x, O.y) < 100 + e.radius) dealDamage(e, 35, o.id, { angle: Math.atan2(e.y - O.y, e.x - O.x), knock: 260, noCharge: true }); }); }
    }
}
const _upe14 = updatePartyExtras;
updatePartyExtras = function (dt) { _upe14(dt); updateGunFx(dt); };
const _applyBuild14 = applyBuild;
applyBuild = function (p) { _applyBuild14(p); p.gatStorm = null; p.drumT = 0; p.hawkT = 0; };

/* ---------- vẽ: vòng băng trống, tâm ngắm Diều Hâu trên địch bị lộ ---------- */
const _drawPlayerExtras14 = drawPlayerExtras;
drawPlayerExtras = function (p, w, now) {
    _drawPlayerExtras14(p, w, now);
    if (p.drumT > world.time) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(now * 6);
        for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = 'rgba(253,224,71,0.85)'; ctx.fillRect(p.radius + 6, -2, 5, 4); }
        ctx.restore();
    }
    const me = localPlayer();
    if (me && me.hawkT > world.time && p !== me && p.hp > 0 && isSpotted(p, me.id)) {
        const r = p.radius + 10 + Math.sin(now * 8) * 2;
        ctx.save(); ctx.strokeStyle = 'rgba(248,113,113,0.95)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
        [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * (r - 6), p.y + Math.sin(a) * (r - 6)); ctx.lineTo(p.x + Math.cos(a) * (r + 8), p.y + Math.sin(a) * (r + 8)); ctx.stroke(); });
        ctx.restore();
    }
};
CARDS.gunMod.desc = CARDS.gunMod.desc
    .replace('<b>Song Súng</b>: P băng đạn +50% · S cầu năng lượng.', '<b>Song Súng</b>: P băng đạn +50% · S cầu năng lượng bay chậm phóng điện vào địch xung quanh rồi nổ.')
    .replace('<b>Gatling</b>: P đạn bay xa hơn · S xoay nòng bắn 360°.', '<b>Gatling</b>: P đạn bay xa hơn · S Cuồng Phong: 2.5 giây xả đạn loạn xạ theo hướng ngắm.')
    .replace('<b>Bắn tỉa</b>: P làm chậm, không để lại đường đạn · S ống ngắm nhiệt.', '<b>Bắn tỉa</b>: P làm chậm, không để lại đường đạn · S Mắt Diều Hâu 4 giây: lộ địch phía trước, ngắm là đầy lực ngay, toàn chí mạng.')
    .replace('Súng lục, AR, SMG, Shotgun: như cũ.', '<b>SMG</b>: S Băng Trống 4 giây (bắn nhanh ×2, đạn nảy). <b>Shotgun</b>: S đạn sên xuyên người, nổ thành 10 mảnh. Súng lục, AR: như cũ.')
    .replace('<b>Súng Điện</b>: P mạnh & làm chậm · S lồng điện.', '<b>Súng Điện</b>: P mạnh & làm chậm · S lồng điện (mỗi giây giật choáng).');
