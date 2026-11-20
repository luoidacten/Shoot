'use strict';
/* =====================================================================
 *  LÀM ĐẸP: bản đồ rộng hơn · vẽ lại người chơi · vẽ lại vũ khí · hiệu ứng / VFX · sửa lỗi ném khiên
 *  Nạp sau botmind.js. render.js gọi drawCharacter() để vẽ thân người chơi.
 * ===================================================================== */

/* ============================== BẢN ĐỒ RỘNG HƠN 15% ============================== */
const MAP_SCALE = 1.15;
const _setMapSize32 = setMapSize;
setMapSize = function (w, h) {
    if (net.role === 'guest') return _setMapSize32(w, h); // máy khách nhận đúng kích thước từ chủ phòng
    return _setMapSize32(Math.round(w * MAP_SCALE), Math.round(h * MAP_SCALE));
};

/* ============================== NGƯỜI CHƠI ============================== */
/** Vẽ thân nhân vật (đã dịch tới tâm & xoay theo hướng nhìn). Gọi từ render.js */
function drawCharacter(p, w, now) {
    const R = p.radius, col = p.color.length === 7 ? p.color : '#94a3b8';
    const sp = Math.hypot(p.vx || 0, p.vy || 0), moving = sp > 40, ph = now * 15 + p.id * 1.3;
    const melee = w.type === 'MELEE' || w.type === 'SHIELD' || w.id === 'NONE';
    // chân bước
    if (moving) {
        const s = Math.sin(ph) * R * 0.42;
        ctx.fillStyle = '#1e293b';
        [[s, -R * 0.4], [-s, R * 0.4]].forEach(([fx, fy]) => { ctx.beginPath(); ctx.ellipse(fx, fy, R * 0.4, R * 0.22, 0, 0, Math.PI * 2); ctx.fill(); });
    }
    // ba lô sau lưng
    ctx.fillStyle = shade(col, -0.5); rrect(ctx, -R * 1.08, -R * 0.55, R * 0.58, R * 1.1, R * 0.22); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = shade(col, -0.25); ctx.fillRect(-R * 1.0, -R * 0.12, R * 0.42, R * 0.24);
    // vai / thân (bầu dục rộng ngang)
    const bg = ctx.createRadialGradient(-R * 0.25, -R * 0.45, R * 0.1, 0, 0, R * 1.1);
    bg.addColorStop(0, shade(col, 0.45)); bg.addColorStop(0.55, col); bg.addColorStop(1, shade(col, -0.45));
    ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.8, R * 1.04, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    // giáp ngực + dây đeo chéo
    ctx.strokeStyle = shade(col, -0.55); ctx.lineWidth = R * 0.16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-R * 0.45, -R * 0.82); ctx.lineTo(R * 0.3, R * 0.8); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(-R * 0.2, -R * 0.55, R * 0.35, R * 0.2, -0.4, 0, Math.PI * 2); ctx.fill();
    // tay (găng) theo kiểu vũ khí
    const glove = (x, y) => {
        ctx.fillStyle = '#1f2937'; ctx.beginPath(); ctx.arc(x, y, R * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = shade(col, 0.1); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, R * 0.3, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
    };
    if (w.type !== 'SHIELD') {
        if (melee) {
            const punch = w.id === 'NONE' && p.cooldown > w.fireRate * (p.fireRateMult || 1) * 0.6 ? 8 : 0;
            glove(R * 0.75 + punch, R * 0.6); glove(R * 0.75, -R * 0.6);
        } else if (['PISTOL', 'SPISTOL', 'REVOLVER', 'DUAL', 'GRENADE', 'EMPGREN'].includes(w.id)) { glove(R * 0.95, R * 0.42); glove(R * 0.95, -R * 0.42); }
        else { glove(R * 0.82, R * 0.32); glove(R * 1.5, -R * 0.12); }
    }
    // đầu + mũ
    const hx = R * 0.1, hr = R * 0.6;
    const hg = ctx.createRadialGradient(hx - hr * 0.4, -hr * 0.45, hr * 0.1, hx, 0, hr);
    hg.addColorStop(0, shade(col, 0.6)); hg.addColorStop(0.6, shade(col, 0.1)); hg.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, 0, hr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1.6; ctx.stroke();
    // sọc mũ riêng theo người chơi
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    const st = p.id % 3;
    if (st === 0) { ctx.beginPath(); ctx.moveTo(hx - hr * 0.85, 0); ctx.lineTo(hx + hr * 0.2, 0); ctx.stroke(); }
    else if (st === 1) { ctx.beginPath(); ctx.arc(hx, 0, hr * 0.62, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke(); }
    else { [-0.3, 0.3].forEach(o => { ctx.beginPath(); ctx.moveTo(hx - hr * 0.8, hr * o); ctx.lineTo(hx, hr * o); ctx.stroke(); }); }
    // kính chắn (visor) phát sáng
    const vg = ctx.createLinearGradient(hx, -hr, hx + hr, hr);
    vg.addColorStop(0, 'rgba(15,23,42,0.95)'); vg.addColorStop(1, 'rgba(30,41,59,0.95)');
    ctx.strokeStyle = vg; ctx.lineWidth = hr * 0.55; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(hx, 0, hr * 0.68, -0.95, 0.95); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexA(col, 0.85); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx, 0, hr * 0.68, -0.75, 0.75); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(hx + hr * 0.55, -hr * 0.32, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // điểm sáng đỉnh mũ
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(hx - hr * 0.35, -hr * 0.4, hr * 0.28, hr * 0.15, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.lineCap = 'butt';
}

/* ============================== VŨ KHÍ (vẽ lại) ============================== */
const outl = (c, lw = 1.2) => { c.lineWidth = lw; c.strokeStyle = 'rgba(0,0,0,0.75)'; c.stroke(); };
/** khối kim loại có đổ bóng trên/dưới */
function metal(c, x, y, w, h, base, rad = 1.5, gloss = 0.4) {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, shade(base, gloss)); g.addColorStop(0.45, base); g.addColorStop(1, shade(base, -0.45));
    rrect(c, x, y, w, h, Math.min(rad, h / 2, w / 2)); c.fillStyle = g; c.fill(); outl(c);
}
function blade(c, pts, a, b) { // lưỡi dao: chuyển màu theo chiều dọc + viền
    const g = c.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, a); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, b);
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = g; c.fill(); outl(c, 1);
}
const wood = (c, x, y, w, h, rad = 2) => { metal(c, x, y, w, h, '#92400e', rad, 0.25); c.strokeStyle = 'rgba(69,26,3,0.5)'; c.lineWidth = 0.6; for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(x + 1, y + h * i / 3); c.lineTo(x + w - 1, y + h * i / 3 + 0.5); c.stroke(); } };
const glint = (c, x, y, s = 1.4) => { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill(); c.restore(); };
const MUZ = {}; // đầu nòng (toạ độ đã chia 1.25) để vẽ chớp nòng đúng chỗ
const ART2 = {
    PISTOL: (c, w, r, x0) => { metal(c, x0 - 1, 0, 5, 8, '#334155', 1.5); metal(c, x0 - 2, -3.5, 17, 5.5, '#94a3b8', 1.5); c.fillStyle = '#0f172a'; c.fillRect(x0 + 13, -2.5, 3, 3); c.fillStyle = '#1e293b'; for (let i = 0; i < 4; i++) c.fillRect(x0 + 1 + i * 2, -3, 1, 4.5); glint(c, x0 + 6, -2.8, 0.9); MUZ.PISTOL = x0 + 16; },
    SPISTOL: (c, w, r, x0) => { ART2.PISTOL(c, w, r, x0); metal(c, x0 + 15, -3, 13, 4.5, '#1f2937', 2.2, 0.3); c.fillStyle = 'rgba(148,163,184,0.5)'; for (let i = 0; i < 3; i++) c.fillRect(x0 + 18 + i * 3.5, -2.8, 1, 4); MUZ.SPISTOL = x0 + 28; },
    REVOLVER: (c, w, r, x0, ch, now, p) => {
        wood(c, x0 - 4, 0.5, 6, 8, 2.5); metal(c, x0 + 6, -2, 18, 3.6, '#a8a29e', 1.5, 0.6);
        c.fillStyle = '#57534e'; c.beginPath(); c.arc(x0 + 4, 0, 5.2, 0, Math.PI * 2); c.fill(); outl(c);
        c.fillStyle = '#292524'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + (p ? p.shotCount || 0 : 0); c.beginPath(); c.arc(x0 + 4 + Math.cos(a) * 2.8, Math.sin(a) * 2.8, 1.1, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#d6d3d1'; c.fillRect(x0 + 21, -3.2, 1.5, 1.4); glint(c, x0 + 12, -1.3, 0.8); MUZ.REVOLVER = x0 + 24;
    },
    DUAL: (c, w, r, x0) => { [-7, 7].forEach(oy => { metal(c, x0 - 1, oy + 0.5, 4, 6, '#3f3f46', 1.2); metal(c, x0 - 2, oy - 2.6, 15, 5, '#e2e8f0', 1.5, 0.5); c.fillStyle = '#0f172a'; c.fillRect(x0 + 11, oy - 1.4, 2.5, 2.5); glint(c, x0 + 5, oy - 2, 0.8); }); MUZ.DUAL = x0 + 14; },
    SMG: (c, w, r, x0) => {
        c.strokeStyle = '#475569'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0 - 4, -2); c.lineTo(x0 - 12, -3); c.lineTo(x0 - 12, 3); c.lineTo(x0 - 4, 2); c.stroke(); // báng gập
        metal(c, x0 - 4, -3.5, 20, 7, '#27272a', 2); metal(c, x0 + 8, -3, 10, 6, w.color || '#ca8a04', 1.5);
        c.fillStyle = '#0a0a0a'; for (let i = 0; i < 3; i++) c.fillRect(x0 + 9.5 + i * 3, -1.5, 1.6, 3);
        metal(c, x0 + 3, 3, 3.5, 9, '#18181b', 1); metal(c, x0 + 17, -1.6, 5, 3.2, '#3f3f46', 1); MUZ.SMG = x0 + 22;
    },
    AR: (c, w, r, x0) => {
        metal(c, x0 - 16, -3.5, 10, 7, '#1c1917', 2); // báng
        metal(c, x0 - 7, -3.5, 16, 7, '#2d3748', 1.5); metal(c, x0 + 8, -3, 15, 6, w.color || '#3f6212', 2);
        c.fillStyle = 'rgba(0,0,0,0.45)'; for (let i = 0; i < 4; i++) c.fillRect(x0 + 10 + i * 3.2, -2.4, 1.2, 4.8);
        c.save(); c.translate(x0 + 3, 3); c.rotate(0.25); metal(c, 0, 0, 4, 9, '#111827', 1.2); c.restore(); // băng đạn cong
        metal(c, x0 + 22, -1.4, 7, 2.8, '#111827', 1);
        metal(c, x0 - 2, -7.5, 9, 3.6, '#0f172a', 1.5); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#ef4444'; c.beginPath(); c.arc(x0 + 6.5, -5.7, 1, 0, Math.PI * 2); c.fill(); c.restore();
        MUZ.AR = x0 + 29;
    },
    SHOTGUN: (c, w, r, x0) => {
        wood(c, x0 - 16, -3.2, 12, 6.4, 3); metal(c, x0 - 5, -3.6, 10, 7.2, '#3f3f46', 1.5);
        metal(c, x0 + 4, -3.6, 22, 3.4, '#52525b', 1.2, 0.6); metal(c, x0 + 4, 0.2, 22, 3.4, '#52525b', 1.2, 0.6);
        wood(c, x0 + 8, 2.5, 10, 4.2, 2); // tay bơm
        c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(x0 + 26, -1.9, 1.2, 0, Math.PI * 2); c.arc(x0 + 26, 1.9, 1.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = w.color || '#9f1239'; c.fillRect(x0 - 3, -4.4, 6, 1.2); MUZ.SHOTGUN = x0 + 27;
    },
    SNIPER: (c, w, r, x0, ch) => {
        metal(c, x0 - 18, -3.5, 13, 7, '#1e1b4b', 3); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x0 - 16, -2.5, 8, 1.2);
        metal(c, x0 - 6, -3.2, 18, 6.4, w.color || '#6b21a8', 1.5); metal(c, x0 + 11, -1.5, 30, 3, '#27272a', 1, 0.6);
        metal(c, x0 + 39, -2.4, 6, 4.8, '#111827', 1); // hãm nòng
        metal(c, x0 + 1, -9.5, 16, 4.6, '#0f172a', 2); metal(c, x0 - 1, -10.3, 4, 6.2, '#1e293b', 1); metal(c, x0 + 15, -10.3, 4, 6.2, '#1e293b', 1);
        c.save(); c.globalCompositeOperation = 'lighter'; const k = 0.4 + ch * 0.6; c.fillStyle = `rgba(196,181,253,${k})`; c.beginPath(); c.ellipse(x0 + 19, -7.2, 1.2, 2.4, 0, 0, Math.PI * 2); c.fill();
        if (ch > 0) { c.fillStyle = `rgba(216,180,254,${ch * 0.45})`; c.beginPath(); c.arc(x0 + 19, -7.2, 3 + ch * 4, 0, Math.PI * 2); c.fill(); } c.restore();
        metal(c, x0 + 2, 3, 4, 6, '#18181b', 1); MUZ.SNIPER = x0 + 45;
    },
    MINIGUN: (c, w, r, x0, ch, now, p) => {
        metal(c, x0 - 2, 4, 10, 8, '#365314', 1.5); // hộp đạn
        metal(c, x0 - 10, -8, 18, 16, '#7c2d12', 4);
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0 - 8, -6, 14, 2);
        const spin = (p && p.spinUp ? p.spinUp * 40 : 0) + now * (p && p.aiming ? 30 : 2);
        for (let i = 0; i < 6; i++) { const oy = Math.sin(spin + i * Math.PI / 3) * 4.5, front = Math.cos(spin + i * Math.PI / 3) > 0; c.globalAlpha = front ? 1 : 0.6; metal(c, x0 + 7, oy - 1.3, 26, 2.6, front ? '#9ca3af' : '#6b7280', 1, 0.6); }
        c.globalAlpha = 1; metal(c, x0 + 29, -6, 4, 12, '#f97316', 1.5); metal(c, x0 + 14, -6, 3, 12, '#44403c', 1);
        MUZ.MINIGUN = x0 + 33;
    },
    RAILGUN: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 10, -5, 18, 10, '#0f172a', 3); metal(c, x0 + 6, -5.2, 30, 3, '#155e75', 1, 0.5); metal(c, x0 + 6, 2.2, 30, 3, '#155e75', 1, 0.5);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) { const on = ch > i / 5; c.fillStyle = `rgba(34,211,238,${on ? 0.85 : 0.25})`; c.fillRect(x0 + 9 + i * 5.5, -2, 3, 4); }
        c.strokeStyle = `rgba(103,232,249,${0.25 + ch * 0.6 + Math.sin(now * 30) * 0.1})`; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + 8, 0); c.lineTo(x0 + 36, 0); c.stroke();
        c.restore(); MUZ.RAILGUN = x0 + 36;
    },
    ROCKET: (c, w, r, x0) => {
        metal(c, x0 - 14, -6, 34, 12, '#374151', 5, 0.5); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x0 - 6, -6, 2, 12); c.fillRect(x0 + 10, -6, 2, 12);
        c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(x0 + 20, -5); c.lineTo(x0 + 27, 0); c.lineTo(x0 + 20, 5); c.closePath(); c.fill(); outl(c, 1);
        metal(c, x0 - 17, -5, 4, 10, '#fbbf24', 1.5); metal(c, x0, -10, 6, 4, '#111827', 1); metal(c, x0 + 2, 5, 4, 6, '#1f2937', 1); MUZ.ROCKET = x0 + 26;
    },
    LAUNCHER: (c, w, r, x0) => {
        metal(c, x0 - 10, -3, 10, 6, '#1a2e05', 2); c.fillStyle = '#4d7c0f'; c.beginPath(); c.arc(x0 + 3, 0, 7, 0, Math.PI * 2); c.fill(); outl(c);
        c.fillStyle = '#1a2e05'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.beginPath(); c.arc(x0 + 3 + Math.cos(a) * 4, Math.sin(a) * 4, 1.4, 0, Math.PI * 2); c.fill(); }
        metal(c, x0 + 9, -4, 14, 8, '#365314', 2.5); metal(c, x0 + 21, -4.6, 3, 9.2, '#84cc16', 1); MUZ.LAUNCHER = x0 + 24;
    },
    FLAME: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 8, 2, 10, 9, '#dc2626', 4, 0.5); c.fillStyle = '#fef08a'; c.fillRect(x0 - 6, 4, 6, 1.2);
        metal(c, x0 - 6, -4, 22, 7, '#78350f', 2.5); metal(c, x0 + 15, -2.5, 6, 5, '#a8a29e', 1.5, 0.6);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(56,189,248,${0.55 + Math.sin(now * 22) * 0.3})`; c.beginPath(); c.ellipse(x0 + 23, 0, 2.6, 1.6, 0, 0, Math.PI * 2); c.fill(); c.restore();
        MUZ.FLAME = x0 + 22;
    },
    KNIFE: (c, w, r) => {
        metal(c, r - 4, -2.4, 9, 4.8, '#3f3f46', 2); c.fillStyle = 'rgba(0,0,0,0.4)'; for (let i = 0; i < 3; i++) c.fillRect(r - 2 + i * 2.5, -2.4, 0.8, 4.8);
        metal(c, r + 4.5, -4, 2.2, 8, '#a8a29e', 1); blade(c, [[r + 7, -3], [r + 22, -0.5], [r + 24, 0.3], [r + 7, 3]], '#94a3b8', '#64748b');
    },
    DAGGERS: (c, w, r) => { [-7, 7].forEach(oy => { metal(c, r - 3, oy - 2, 6, 4, '#57534e', 1.5); metal(c, r + 2.5, oy - 3, 1.8, 6, '#d6d3d1', 1); blade(c, [[r + 4.5, oy - 2.3], [r + 18, oy], [r + 4.5, oy + 2.3]], '#cbd5e1', '#64748b'); }); },
    KATANA: (c, w, r, x0, ch) => {
        const b = ch * 10;
        metal(c, r - 10 - b, -2.6, 14, 5.2, '#111827', 2); c.fillStyle = '#e2e8f0'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(r - 9 - b + i * 3.4, -2.6); c.lineTo(r - 7.3 - b + i * 3.4, 0); c.lineTo(r - 9 - b + i * 3.4, 2.6); c.fill(); }
        c.fillStyle = '#facc15'; c.beginPath(); c.ellipse(r + 4.5 - b, 0, 1.8, 5.2, 0, 0, Math.PI * 2); c.fill(); outl(c, 1);
        blade(c, [[r + 6 - b, -2.4], [r + 30 - b, -4.2], [r + 48 - b, -1.6], [r + 46 - b, 0.2], [r + 6 - b, 2.4]], '#e0f2fe', '#7dd3fc');
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(r + 8 - b, 0.8); c.quadraticCurveTo(r + 28 - b, -0.8, r + 45 - b, -0.6); c.stroke(); // vân hamon
        if (ch > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(125,211,252,${ch})`; c.lineWidth = 3; c.beginPath(); c.moveTo(r + 6, -1); c.lineTo(r + 48, -1.5); c.stroke(); c.restore(); }
    },
    SPEAR: (c, w, r, x0, ch) => {
        const b = ch * 14;
        const g = c.createLinearGradient(0, -2, 0, 2); g.addColorStop(0, '#b45309'); g.addColorStop(1, '#78350f');
        c.fillStyle = g; rrect(c, r - 16 - b, -1.6, 52, 3.2, 1.5); c.fill(); outl(c, 0.8);
        c.fillStyle = '#dc2626'; c.beginPath(); c.moveTo(r + 34 - b, -2); c.lineTo(r + 30 - b, -5); c.lineTo(r + 30 - b, 5); c.lineTo(r + 34 - b, 2); c.fill(); // tua đỏ
        metal(c, r + 33 - b, -2.2, 4, 4.4, '#a8a29e', 1);
        blade(c, [[r + 37 - b, -4.5], [r + 46 - b, -2.5], [r + 53 - b, 0], [r + 46 - b, 2.5], [r + 37 - b, 4.5]], '#f1f5f9', '#94a3b8');
    },
    HAMMER: (c, w, r, x0, ch) => {
        c.rotate(-ch * 1.4);
        const g = c.createLinearGradient(0, -2, 0, 2); g.addColorStop(0, '#a16207'); g.addColorStop(1, '#713f12');
        c.fillStyle = g; rrect(c, r - 6, -2, 32, 4, 1.5); c.fill(); outl(c, 0.8);
        metal(c, r + 20, -10, 15, 20, '#57534e', 3, 0.5); metal(c, r + 19, -10.5, 3, 21, '#a8a29e', 1, 0.6); metal(c, r + 33, -10.5, 3, 21, '#a8a29e', 1, 0.6);
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(r + 23, -8, 8, 2);
        if (ch >= 0.9) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(253,224,71,0.5)'; c.fillRect(r + 17, -12, 21, 24); c.restore(); }
    },
    GREATSWORD: (c, w, r, x0, ch) => {
        const b = ch * 8;
        metal(c, r - 12 - b, -2.6, 14, 5.2, '#292524', 2); c.fillStyle = '#facc15'; c.beginPath(); c.arc(r - 13 - b, 0, 2.6, 0, Math.PI * 2); c.fill();
        metal(c, r + 1 - b, -8, 4, 16, '#b45309', 1.5, 0.5);
        blade(c, [[r + 5 - b, -5], [r + 50 - b, -4.5], [r + 58 - b, 0], [r + 50 - b, 4.5], [r + 5 - b, 5]], '#e5e7eb', '#9ca3af');
        c.strokeStyle = 'rgba(71,85,105,0.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(r + 8 - b, 0); c.lineTo(r + 48 - b, 0); c.stroke(); // rãnh máu
    },
    AXE: (c, w, r, x0, ch) => {
        const g = c.createLinearGradient(0, -2, 0, 2); g.addColorStop(0, '#a16207'); g.addColorStop(1, '#713f12');
        c.fillStyle = g; rrect(c, r - 6, -1.8, 30, 3.6, 1.5); c.fill(); outl(c, 0.8);
        blade(c, [[r + 18, -2], [r + 22, -12], [r + 30, -9], [r + 31, 0], [r + 30, 9], [r + 22, 12], [r + 18, 2]], '#cbd5e1', '#64748b');
        metal(c, r + 16, -3, 5, 6, '#44403c', 1);
    },
    BOW: (c, w, r, x0, ch, now, p) => {
        const pull = ch * 9;
        c.strokeStyle = '#3f2a14'; c.lineWidth = 5; c.beginPath(); c.arc(r + 2, 0, 14, -1.25, 1.25); c.stroke();
        c.strokeStyle = '#a16207'; c.lineWidth = 3; c.beginPath(); c.arc(r + 2, 0, 14, -1.25, 1.25); c.stroke();
        c.strokeStyle = '#facc15'; c.lineWidth = 3.2; c.beginPath(); c.arc(r + 2, 0, 14, -0.18, 0.18); c.stroke(); // tay cầm
        const tx = r + 2 + Math.cos(1.25) * 14, ty = Math.sin(1.25) * 14;
        c.strokeStyle = '#f8fafc'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(tx, -ty); c.lineTo(r + 6 - pull, 0); c.lineTo(tx, ty); c.stroke();
        if (p && (p.aiming || ch > 0)) {
            c.fillStyle = '#d6d3d1'; c.fillRect(r + 6 - pull, -0.8, 23, 1.6);
            c.fillStyle = '#e2e8f0'; c.beginPath(); c.moveTo(r + 28 - pull, -2.8); c.lineTo(r + 34 - pull, 0); c.lineTo(r + 28 - pull, 2.8); c.fill(); outl(c, 0.8);
            c.fillStyle = '#ef4444'; c.beginPath(); c.moveTo(r + 6 - pull, 0); c.lineTo(r + 10 - pull, -3); c.lineTo(r + 12 - pull, 0); c.lineTo(r + 10 - pull, 3); c.fill();
        }
    }
};
const _drawWeaponArt32 = drawWeaponArt;
drawWeaponArt = function (c, w, r, now, p) {
    if (!w) return;
    // vũ khí nằm trên đất / đang bay (không có người cầm): khiên vẽ thành đĩa xoay — trước đây vẽ cung bán kính âm làm hỏng cả khung hình
    if (!p && w.type === 'SHIELD') {
        const R = w.id === 'ROUNDSHIELD' ? 12 : 14;
        c.save();
        const g = c.createRadialGradient(-3, -3, 1, 0, 0, R); g.addColorStop(0, '#e2e8f0'); g.addColorStop(0.6, w.id === 'ROUNDSHIELD' ? '#0ea5e9' : '#64748b'); g.addColorStop(1, '#1e293b');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill(); outl(c, 1.6);
        c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R * 0.62, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#facc15'; c.beginPath(); c.arc(0, 0, 3, 0, Math.PI * 2); c.fill();
        c.restore(); return;
    }
    if (!p && r < 0) { c.save(); c.translate(r - 6, 0); try { return drawWeaponArt(c, w, 6, now, { radius: 6, recoil: 0, charge: 0, fake: true, id: -1 }); } finally { c.restore(); } }
    const f = ART2[w.id];
    if (!f) { try { return _drawWeaponArt32(c, w, r, now, p); } catch (e) { return; } }
    const rc = p ? (p.recoil || 0) * 5 : 0, ch = p ? (p.charge || 0) : 0;
    c.save(); c.scale(1.25, 1.25); const rs = r / 1.25;
    try { f(c, w, rs, rs - 4 - rc / 1.25, ch, now, p && !p.fake ? p : null); } catch (e) {} finally { c.restore(); }
    if (w.legendary) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = hexA(w.color && w.color.length === 7 ? w.color : '#facc15', 0.25 + Math.sin(now * 8) * 0.15); c.beginPath(); c.ellipse(r + 16, 0, 26, 9, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
};

/* ============================== VFX ============================== */
// chớp nòng: đúng đầu nòng, nhiều lớp, tia lửa hai bên
drawMuzzleFlash = function (c, w, p) {
    const k = Math.min(1, p.muzzle / 0.06), mz = MUZ[w.id], x = mz !== undefined ? mz * 1.25 + 2 : (p.radius + (w.len || 12) * 1.15 + 6), s = 7 + (w.width || 4) * 1.4;
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, 0);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 2); g.addColorStop(0, `rgba(255,255,235,${k})`); g.addColorStop(0.35, `rgba(255,205,90,${0.75 * k})`); g.addColorStop(1, 'rgba(255,110,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 2, 0, Math.PI * 2); c.fill();
    c.fillStyle = `rgba(255,244,200,${k})`;
    c.beginPath(); c.moveTo(0, -s * 0.35); c.lineTo(s * 2.4, 0); c.lineTo(0, s * 0.35); c.closePath(); c.fill(); // lưỡi lửa chính
    [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 0.9, sd * s * 0.95); c.lineTo(s * 0.3, sd * s * 0.15); c.closePath(); c.fill(); });
    c.fillStyle = `rgba(255,255,255,${k})`; c.beginPath(); c.arc(0, 0, s * 0.35, 0, Math.PI * 2); c.fill();
    c.restore();
};
// đạn: quầng sáng + vệt thon dần + lõi trắng
const _drawBulletFx32 = drawBulletFx;
drawBulletFx = function (b) {
    const c = b.color || '#ffe48a', tl = (b.trail || 26) * 1.35, cx = Math.cos(b.angle), cy = Math.sin(b.angle);
    const tx = b.x - cx * tl, ty = b.y - cy * tl;
    const g = ctx.createLinearGradient(tx, ty, b.x, b.y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, hexA(c.length === 7 ? c : '#ffe48a', 0.35)); g.addColorStop(1, c);
    ctx.strokeStyle = g; ctx.lineWidth = b.size * 3; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.globalAlpha = 0.25; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 3.2, 0, Math.PI * 2); ctx.fill(); // quầng
    ctx.globalAlpha = 1;
    _drawBulletFx32(b);
};
// vụ nổ: sóng xung kích trắng, than hồng bay, khói đen dày dần
const _explosionFx32 = explosionFx;
explosionFx = function (x, y, radius = 160) {
    _explosionFx32(x, y, radius);
    const lv = typeof fxLv === 'function' ? fxLv() : 2, n = lv === 2 ? 1 : lv === 1 ? 0.7 : 0.35;
    ring(x, y, radius * 0.15, radius * 1.05, '#fff7ed', 0.22, 3);
    ring(x, y, radius * 0.1, radius * 0.7, '#fb923c', 0.4, 6);
    for (let i = 0; i < Math.round(14 * n); i++) { const a = Math.random() * Math.PI * 2, s = 150 + Math.random() * 380; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: 0.5 + Math.random() * 0.5, maxLife: 1, color: Math.random() < 0.5 ? '#fdba74' : '#fef08a', size: 1.6 + Math.random() * 1.8, glow: true, drag: 0.93 }); }
    for (let i = 0; i < Math.round(6 * n); i++) { const a = Math.random() * Math.PI * 2, d = Math.random() * radius * 0.35; particles.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30 - 20, life: 0.9 + Math.random() * 0.6, maxLife: 1.5, color: 'rgba(30,27,32,0.5)', size: 14 + Math.random() * 10, grow: 40, drag: 0.96 }); }
};
// bụi chân khi chạy (chỉ khi thấy được người đó, không làm lộ người tàng hình / trong bụi / khói)
const _upe32 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe32(dt);
    if (gameState !== 'PLAYING' || (typeof fxLv === 'function' && fxLv() === 0)) return;
    players.forEach(p => {
        if (p.hp <= 0 || p.air > 0 || (p.st && p.st.invis > 0) || inBush(p.x, p.y) || inSmoke(p.x, p.y)) return;
        const sp = Math.hypot(p.vx || 0, p.vy || 0); if (sp < 120 || Math.random() > dt * (sp > 200 ? 9 : 5)) return;
        if (!canSee(p.x, p.y, 20)) return;
        const a = Math.atan2(p.vy, p.vx) + Math.PI;
        particles.push({ x: p.x + Math.cos(a) * p.radius * 0.8 + (Math.random() - 0.5) * 8, y: p.y + Math.sin(a) * p.radius * 0.8 + p.radius * 0.4, vx: Math.cos(a) * 20, vy: Math.sin(a) * 20 - 8, life: 0.45, maxLife: 0.45, color: 'rgba(148,163,184,0.25)', size: 5 + Math.random() * 3, grow: 18, drag: 0.9 });
    });
};
// trúng đòn: thêm tia lửa văng theo hướng đạn
const _dealDamage32 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const hp0 = target && target.hp;
    const r = _dealDamage32(target, dmg, attackerId, opts);
    if (target && target.hp < hp0 && opts.angle !== undefined && !opts.zone && (typeof fxLv !== 'function' || fxLv() > 0) && canSee(target.x, target.y, 20) && targetableLocal(target)) {
        for (let i = 0; i < 5; i++) { const a = opts.angle + (Math.random() - 0.5) * 1.1, s = 120 + Math.random() * 220; particles.push({ x: target.x, y: target.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.25, maxLife: 0.25, color: opts.melee ? '#fecaca' : '#fde68a', size: 1.6, glow: true, drag: 0.85 }); }
    }
    return r;
};
function targetableLocal(t) { const me = localPlayer(); return !me || me === t || me.hp <= 0 || sameTeam(me, t) || targetable(me, t); }
