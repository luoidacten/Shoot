'use strict';
/* =====================================================================
 *  BUFF 9 PHÉP BỔ TRỢ CÒN LẠI · HỆ THỐNG THỜI TIẾT
 *  Nạp sau balance.js.
 * ===================================================================== */

/* ============================== BUFF PHÉP (giữ nguyên các phối hợp phép cũ) ============================== */
function spellBuff(id, cd, desc, after, before) {
    const s = SPELLS[id]; if (!s) return; const f = s.cast;
    if (cd) s.cd = cd; if (desc) s.desc = desc;
    s.cast = p => { const ctx0 = before ? before(p) : null; const r = f(p); if (r !== false && after) after(p, ctx0); return r; };
}
spellBuff('flash', 32, 'Dịch chuyển tức thời ~270 theo hướng đang chạy, bất tử 0.3 giây và tăng tốc 1.2 giây.',
    p => { flashMove(p, 70); p.st.invuln = Math.max(p.st.invuln || 0, 0.3); p.st.haste = Math.max(p.st.haste || 0, 1.2); });
spellBuff('cleanse', 32, 'Gỡ mọi hiệu ứng xấu và MIỄN NHIỄM 3 giây (choáng, chậm, trói, câm lặng, keo, đốt, độc…), hồi 12% máu và tăng tốc 1.5 giây. Dùng được khi đang bị choáng.',
    p => { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.12); p.st.haste = Math.max(p.st.haste || 0, 1.5); });
spellBuff('sprint', 28, 'Tăng tốc mạnh 4.5 giây, gỡ làm chậm, bất tử 0.3 giây lúc bật.',
    p => { p.st.haste = Math.max(p.st.haste || 0, 4.5); p.st.invuln = Math.max(p.st.invuln || 0, 0.3); });
spellBuff('execute', 32, 'Bắn tia vào địch ít máu nhất trong 300: 42 + 26% máu đã mất (sát thương chuẩn). Hạ gục được → hồi ngay một nửa thời gian hồi chiêu.',
    (p, hp0) => { enemiesOf(p).forEach(e => { if (hp0 && hp0[e.id] !== undefined && e.hp < hp0[e.id]) { if (e.hp > 0) dealDamage(e, 12 + 0.06 * (e.maxHp - e.hp), p.id, { raw: true }); if (e.hp <= 0) p.execReset = true; } }); },
    p => { const m = {}; enemiesOf(p).forEach(e => m[e.id] = e.hp); return m; });
spellBuff('iceWall', 24, 'Dựng tường băng chắn đạn trước mặt, vuông góc hướng ngắm — bền hơn 50% và đứng lâu hơn (7 giây, phá được).',
    (p, n) => { obstacles.slice(n).forEach(o => { if (o.ice) { o.hp = (o.hp || 120) * 1.5; o.maxHp = (o.maxHp || 120) * 1.5; if (o.temp) o.temp += 2; } }); }, () => obstacles.length);
spellBuff('missile', 28, 'Bắn 1 quả tên lửa theo hướng ngắm (mạnh hơn 30%). Bay càng xa sát thương càng lớn (tối đa ×3.2), nổ lan khi chạm.',
    (p, n) => { bullets.slice(n).forEach(b => { if (b.owner === p.id) { b.damage = (b.damage || 0) * 1.3; b.size = (b.size || 6) * 1.15; b.dmgBoost = 1.3; } }); }, () => bullets.length);
spellBuff('blind', 28, 'Ném bom khói về phía trước, tăng tốc 3 giây. Địch trong vùng nổ bị MÙ 4 giây (tầm nhìn -55%).',
    p => { p.st.haste = Math.max(p.st.haste || 0, 3); enemiesOf(p).forEach(e => { if ((e.st.blind || 0) > 0) e.st.blind = Math.max(e.st.blind, 4); }); });
spellBuff('flareScan', 28, null, null);
spellBuff('smokeLine', 28, 'Dựng 4 cột khói thành hàng ngang trước mặt theo hướng kéo (7 giây).',
    (p, n) => { const z = zones.slice(n).filter(q => q.type === 'smoke'); z.forEach(q => { q.t += 2; q.maxT += 2; }); if (z.length >= 2) { const a = z[z.length - 1], b = z[z.length - 2]; zones.push({ type: 'smoke', x: a.x + (a.x - b.x), y: a.y + (a.y - b.y), r: a.r, t: a.t, maxT: a.maxT, owner: p.id, tick: 0 }); } }, () => zones.length);
// Trừng Phạt hạ gục → hồi một nửa
const _castSpell40 = castSpell;
castSpell = function (p, i) { const s = p && p.spells && p.spells[i]; const r = _castSpell40(p, i); if (s && p.execReset) { p.execReset = false; s.cd *= 0.5; floatText(p.x, p.y - 46, '⟲ HỒI MỘT NỬA', '#fca5a5', 12); } return r; };
// tên lửa: phần nổ cũng mạnh hơn
const _explode40 = explode;
explode = function (x, y, ownerId, dmgMax, radius) { const b = bullets.find(q => q.dmgBoost && Math.abs(q.x - x) < 40 && Math.abs(q.y - y) < 40); return _explode40(x, y, ownerId, b ? (dmgMax || 120) * b.dmgBoost : dmgMax, radius); };

/* ============================== THỜI TIẾT ==============================
 * Mỗi hiệp bốc 1 kiểu thời tiết (chủ phòng quyết định, đồng bộ online):
 *  ☀️ Quang Đãng · 🌧️ Mưa · ⛈️ Giông Bão · ❄️ Tuyết · 🌫️ Sương Dày · 🌪️ Gió Lớn · 🔥 Nắng Gắt */
const WEATHERS = {
    clear: { name: '☀️ QUANG ĐÃNG', w: 30, desc: 'Trời đẹp — không có gì đặc biệt.' },
    rain:  { name: '🌧️ MƯA', w: 14, desc: 'Tiếng chân & tiếng súng khó nghe hơn (-35% tầm nghe), lửa tắt nhanh gấp đôi.' },
    storm: { name: '⛈️ GIÔNG BÃO', w: 9, desc: 'Như mưa, kèm SÉT đánh ngẫu nhiên (cảnh báo 1 giây, 45 sát thương) — chớp sáng lộ cả vùng.' },
    snow:  { name: '❄️ TUYẾT', w: 11, desc: 'Mọi người chậm hơn 8%; tuyết rơi làm tầm nhìn giảm 10%.' },
    fog:   { name: '🌫️ SƯƠNG DÀY', w: 11, desc: 'Tầm nhìn mọi người giảm 25% — hợp phục kích.' },
    wind:  { name: '🌪️ GIÓ LỚN', w: 11, desc: 'Đạn & vật ném bị gió đẩy lệch; khói trôi theo gió và tan nhanh hơn.' },
    heat:  { name: '🔥 NẮNG GẮT', w: 9, desc: 'Lửa lan rộng hơn 30% và cháy lâu hơn; vụ nổ để lại vùng lửa nhỏ.' }
};
const wx = () => world.weather && world.weather.id;
function rollWeather() { const tot = Object.values(WEATHERS).reduce((a, b) => a + b.w, 0); let r = Math.random() * tot; for (const k in WEATHERS) { r -= WEATHERS[k].w; if (r <= 0) return k; } return 'clear'; }
const _initRound40 = initRound;
initRound = function () {
    const r = _initRound40();
    if (net.role !== 'guest') { const id = rollWeather(); world.weather = { id, windA: Math.random() * Math.PI * 2, seq: (world.weather ? world.weather.seq || 0 : 0) + 1, boltT: 4 }; }
    weatherFx.length = 0;
    const W = world.weather && WEATHERS[world.weather.id];
    if (W && world.weather.id !== 'clear') setTimeout(() => { if (gameState === 'COUNTDOWN' || gameState === 'PLAYING') floatText(camera.x, camera.y - 120, `THỜI TIẾT: ${W.name}`, '#e2e8f0', 22, { life: 2.6, vy: -15 }); }, 400);
    return r;
};
const _buildSnap40 = buildSnapshot;
buildSnapshot = function () { const s = _buildSnap40(); if (world.weather) s.wx = [world.weather.id, Math.round(world.weather.windA * 100) / 100, world.weather.seq]; return s; };
const _applySnap40 = applySnapshot;
applySnapshot = function (s) { _applySnap40(s); if (s.wx) world.weather = { id: s.wx[0], windA: s.wx[1], seq: s.wx[2] }; };
// ảnh hưởng: nghe · nhìn · tốc chạy · lửa · gió · sét
const _hearReach40 = hearReach;
hearReach = function (v, kind, x, y) { const r = _hearReach40(v, kind, x, y); return wx() === 'rain' || wx() === 'storm' ? r * 0.65 : r; };
const _visionRange40 = visionRange;
visionRange = function (viewer) { return _visionRange40(viewer) * (wx() === 'fog' ? 0.75 : wx() === 'snow' ? 0.9 : 1); };
const _visionAt40 = visionAt;
visionAt = function (v, ang) { return _visionAt40(v, ang) * (wx() === 'fog' ? 0.75 : wx() === 'snow' ? 0.9 : 1); };
const _upe40 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe40(dt);
    const W = world.weather; if (!W || gameState !== 'PLAYING') return;
    if (W.id === 'snow') players.forEach(p => { if (p._snowSeq !== W.seq) { p._snowSeq = W.seq; p.moveMult *= 0.92; } });
    if (net.role === 'guest') return;
    const wdx = Math.cos(W.windA || 0), wdy = Math.sin(W.windA || 0);
    zones.forEach(z => {
        if (z.type === 'fire' || z.type === 'cellFire') { if (W.id === 'rain' || W.id === 'storm') z.t -= dt; if (W.id === 'heat' && !z._heat) { z._heat = true; z.r *= 1.3; z.t *= 1.3; z.maxT *= 1.3; } }
        if (z.type === 'smoke' && W.id === 'wind') { z.x += wdx * 35 * dt; z.y += wdy * 35 * dt; z.t -= dt * 0.3; }
    });
    if (W.id === 'wind') {
        bullets.forEach(b => { b.x += wdx * 60 * dt; b.y += wdy * 60 * dt; });
        items.forEach(it => { if (it.thrown) { it.vx += wdx * 140 * dt; it.vy += wdy * 140 * dt; } });
    }
    if (W.id === 'storm') {
        W.boltT = (W.boltT || 6) - dt;
        if (W.boltT <= 0) {
            W.boltT = 5 + Math.random() * 4;
            const alive = players.filter(p => p.hp > 0); const tg = alive[Math.floor(Math.random() * alive.length)];
            if (tg) { const a = Math.random() * 6.28, d = Math.random() * 260, x = Math.max(60, Math.min(MAP_W - 60, tg.x + Math.cos(a) * d)), y = Math.max(60, Math.min(MAP_H - 60, tg.y + Math.sin(a) * d));
                zones.push({ type: 'boltWarn', x, y, r: 95, t: 1, maxT: 1, owner: -1, tick: 0 }); strikes.push({ kind: 'bolt', x, y, t: 1 }); }
        }
    }
};
const _updateStrikes40 = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikes40(dt);
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i]; if (s.kind !== 'bolt' || s.t > 0) continue; strikes.splice(i, 1);
        players.forEach(p => { if (p.hp > 0 && !(p.air > 0) && dist(p.x, p.y, s.x, s.y) < 95 + p.radius) { dealDamage(p, 45, -1, { zone: true, angle: Math.atan2(p.y - s.y, p.x - s.x), knock: 300 }); p.stun = Math.max(p.stun, 0.4); } });
        zones.push({ type: 'flareLight', x: s.x, y: s.y, r: 420, t: 0.6, maxT: 0.6, owner: -1, tick: 0 }); // chớp sét soi sáng
        beams.push({ x1: s.x + (Math.random() - 0.5) * 120, y1: s.y - 900, x2: s.x, y2: s.y, life: 0.35, maxLife: 0.35, color: '#e0f2fe', zig: 1 });
        ring(s.x, s.y, 10, 120, '#bae6fd', 0.4, 6); addShake(10); flash('#e0f2fe', 0.25); AudioSys.playAt('explosion', s.x, s.y, 0.5, 4000);
        bushes.forEach(b => { if (dist(b.x, b.y, s.x, s.y) < b.r + 60) b.burning = Math.max(b.burning || 0, 2); });
    }
};
const _explode40b = explode;
explode = function (x, y, ownerId, dmgMax, radius) { const r = _explode40b(x, y, ownerId, dmgMax, radius); if (wx() === 'heat' && net.role !== 'guest' && Math.random() < 0.6) zones.push({ type: 'fire', x, y, r: (radius || 160) * 0.35, t: 2.5, maxT: 2.5, owner: ownerId, tick: 0 }); return r; };
// vẽ cảnh báo sét
const _drawNetZones40 = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones40(now);
    zones.forEach(z => { if (z.type !== 'boltWarn') return; const k = 1 - z.t / z.maxT; ctx.save(); ctx.fillStyle = `rgba(186,230,253,${0.1 + k * 0.25})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(224,242,254,${0.5 + 0.4 * Math.sin(now * 30)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1 - k) + 4, 0, Math.PI * 2); ctx.stroke(); ctx.font = `700 26px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f0f9ff'; ctx.fillText('⚡', z.x, z.y); ctx.restore(); });
};
// lớp phủ màn hình: mưa, tuyết, sương, gió, nắng + nhãn thời tiết
const weatherFx = [];
const _drawEnemyArrows40 = drawEnemyArrows;
drawEnemyArrows = function (zoom) {
    const W = world.weather, live = gameState === 'PLAYING' || gameState === 'KO' || gameState === 'COUNTDOWN';
    if (W && live && W.id !== 'clear') {
        const SW = SCREEN_W, SH = SCREEN_H, lv = typeof fxLv === 'function' ? fxLv() : 2, n = lv === 0 ? 40 : lv === 1 ? 90 : 150;
        const wa = W.windA || 0, now = performance.now() / 1000;
        ctx.save();
        if (W.id === 'rain' || W.id === 'storm') {
            ctx.fillStyle = 'rgba(15,23,42,0.18)'; ctx.fillRect(0, 0, SW, SH);
            ctx.strokeStyle = 'rgba(186,230,253,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
            for (let i = 0; i < n; i++) { const x = ((i * 97.3 + now * 380) % (SW + 100)) - 50, y = ((i * 53.7 + now * 900 + i * i) % (SH + 60)) - 30; ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 16); }
            ctx.stroke();
        } else if (W.id === 'snow') {
            ctx.fillStyle = 'rgba(226,232,240,0.07)'; ctx.fillRect(0, 0, SW, SH);
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            for (let i = 0; i < n; i++) { const x = ((i * 89.1 + Math.sin(now + i) * 20 + now * 25) % (SW + 40)) - 20, y = ((i * 61.3 + now * 60) % (SH + 20)) - 10; ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.7, 0, Math.PI * 2); ctx.fill(); }
        } else if (W.id === 'fog') {
            for (let i = 0; i < 5; i++) { const x = ((i * 0.31 + now * 0.015) % 1.3 - 0.15) * SW, y = (0.2 + (i * 0.23) % 0.7) * SH, r = SW * 0.35; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(203,213,225,0.16)'); g.addColorStop(1, 'rgba(203,213,225,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
        } else if (W.id === 'wind') {
            ctx.strokeStyle = 'rgba(226,232,240,0.22)'; ctx.lineWidth = 1.5; ctx.beginPath();
            for (let i = 0; i < n / 3; i++) { const t = (i * 0.137 + now * 0.9) % 1, x = (i * 131.7) % SW, y = (i * 71.3) % SH, L = 40 + (i % 4) * 15; const px = x + Math.cos(wa) * t * 300, py = y + Math.sin(wa) * t * 300; ctx.moveTo(px, py); ctx.lineTo(px - Math.cos(wa) * L, py - Math.sin(wa) * L); }
            ctx.stroke();
        } else if (W.id === 'heat') {
            const g = ctx.createRadialGradient(SW / 2, SH / 2, Math.min(SW, SH) * 0.3, SW / 2, SH / 2, Math.max(SW, SH) * 0.7); g.addColorStop(0, 'rgba(251,146,60,0)'); g.addColorStop(1, 'rgba(234,88,12,0.18)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
        }
        // nhãn thời tiết (+ mũi tên gió)
        const T = WEATHERS[W.id]; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tw = ctx.measureText(T.name).width + 18, bx = SW / 2 - tw / 2, by = world.event ? 96 : 78;
        ctx.fillStyle = 'rgba(2,6,23,0.6)'; rrect(ctx, bx, by, tw, 18, 9); ctx.fill(); ctx.fillStyle = '#e2e8f0'; ctx.fillText(T.name, SW / 2, by + 9.5);
        if (W.id === 'wind') { ctx.save(); ctx.translate(SW / 2 + tw / 2 + 14, by + 9); ctx.rotate(wa); ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.moveTo(3, -4); ctx.lineTo(7, 0); ctx.lineTo(3, 4); ctx.stroke(); ctx.restore(); }
        ctx.restore();
    }
    _drawEnemyArrows40(zoom);
};

/* ============================== BUFF MẠNH: TƯỜNG BĂNG · MÀN KHÓI ============================== */
{
    const s = SPELLS.iceWall, f = s.cast; s.cd = 20;
    s.desc = 'Dựng TƯỜNG BĂNG LỚN (dài 260, 360 độ bền, 8 giây) vuông góc hướng ngắm — luôn dựng được (vướng người thì tự lùi ra). Tường DỘI NGƯỢC đạn, làm chậm địch chạm vào; khi vỡ nổ mảnh băng (30 sát thương, chậm 2 giây).';
    s.cast = p => {
        const n = obstacles.length; f(p);
        let made = obstacles.slice(n).filter(o => o.ice);
        if (!made.length) { // bị vướng người → thử xa hơn
            const a = p.angle, hz = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a));
            for (const d of [150, 190, 230, 110]) { const o = placeTempWall(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, hz, 170, 8, true); if (o) { made = [o]; break; } }
        }
        made.forEach(o => {
            const hz = o.w > o.h, L = 260;
            if (hz) { const cx = o.x + o.w / 2; o.x = cx - L / 2; o.w = L; o.h = 28; } else { const cy = o.y + o.h / 2; o.y = cy - L / 2; o.h = L; o.w = 28; }
            if (players.some(q => q.hp > 0 && q.x > o.x - q.radius && q.x < o.x + o.w + q.radius && q.y > o.y - q.radius && q.y < o.y + o.h + q.radius)) { if (hz) { o.x += (L - 170) / 2; o.w = 170; } else { o.y += (L - 170) / 2; o.h = 170; } } // không đè người
            o.hp = o.maxHp = 360; o.temp = 8; o.reflect = true; o.frost = true; o.owner = p.id;
        });
    };
}
const _damageObstacle41 = damageObstacle;
damageObstacle = function (o, dmg, by) {
    const r = _damageObstacle41(o, dmg, by);
    if (o && o.frost && !obstacles.includes(o) && !o._shattered) {
        o._shattered = true; const cx = o.x + o.w / 2, cy = o.y + o.h / 2, own = players.find(q => q.id === o.owner);
        ring(cx, cy, 10, 150, '#bae6fd', 0.4, 6); for (let i = 0; i < 24; i++) { const a = Math.random() * 6.28, s = 150 + Math.random() * 300; particles.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, maxLife: 0.5, color: '#e0f2fe', size: 3, glow: true, drag: 0.9 }); }
        players.forEach(e => { if (e.hp > 0 && (!own || (e !== own && !sameTeam(own, e))) && dist(e.x, e.y, cx, cy) < 150 + e.radius) { dealDamage(e, 30, own ? own.id : -1, { angle: Math.atan2(e.y - cy, e.x - cx), knock: 200 }); e.st.slow = Math.max(e.st.slow || 0, 2); } });
        AudioSys.playAt('block', cx, cy, 0.5);
    }
    return r;
};
{
    const s = SPELLS.smokeLine, f = s.cast; s.cd = 22;
    s.desc = 'Dựng 5 cột khói lớn thành hàng ngang trước mặt (8 giây). Bạn & đồng đội trong màn khói được TĂNG TỐC; địch trong màn khói bị LÀM CHẬM.';
    s.cast = p => {
        const n = zones.length; f(p);
        const z = zones.slice(n).filter(q => q.type === 'smoke');
        if (z.length >= 2) { const a = z[0], b = z[z.length - 1], dx = (b.x - a.x) / (z.length - 1), dy = (b.y - a.y) / (z.length - 1); zones.push({ type: 'smoke', x: a.x - dx, y: a.y - dy, r: a.r, t: a.t, maxT: a.maxT, owner: p.id, tick: 0 }); }
        zones.slice(n).forEach(q => { if (q.type === 'smoke') { q.r *= 1.15; q.t = q.maxT = 8; q.phase = HASTE_SMOKE; q.lineSmoke = true; } });
    };
}
const _upe41 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe41(dt);
    if (gameState !== 'PLAYING' || net.role === 'guest') return;
    zones.forEach(z => { if (!z.lineSmoke) return; const o = players.find(q => q.id === z.owner); players.forEach(e => { if (e.hp > 0 && o && e !== o && !sameTeam(o, e) && dist(e.x, e.y, z.x, z.y) < z.r) e.st.slow = Math.max(e.st.slow || 0, 0.2); }); });
    obstacles.forEach(o => { if (!o.frost) return; players.forEach(e => { if (e.hp > 0 && e.id !== o.owner && e.x > o.x - e.radius - 6 && e.x < o.x + o.w + e.radius + 6 && e.y > o.y - e.radius - 6 && e.y < o.y + o.h + e.radius + 6) e.st.slow = Math.max(e.st.slow || 0, 0.4); }); });
};
