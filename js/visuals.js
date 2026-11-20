'use strict';
/* =====================================================================
 *  ĐỒ HOẠ TOÀN DIỆN: vẽ lại nốt vũ khí · sàn có hoa văn · tường / thùng gỗ / bao cát / băng 3D
 *  hòm · bụi cây · khói dạng mây · viền tối màn hình. Nạp sau edge.js.
 * ===================================================================== */

/* ============================== VŨ KHÍ CÒN LẠI ============================== */
const tablet = (c, x, y, w, h, col, now, kind) => { // thiết bị bảng chiến thuật: khung + màn hình phát sáng
    metal(c, x, y, w, h, '#1f2937', 2.5, 0.4);
    const sx = x + 2, sy = y + 2, sw = w - 4, sh = h - 4;
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = hexA(col, 0.55 + Math.sin(now * 3) * 0.1); c.fillRect(sx, sy, sw, sh);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(sx + sw * i / 3, sy); c.lineTo(sx + sw * i / 3, sy + sh); c.moveTo(sx, sy + sh * i / 3); c.lineTo(sx + sw, sy + sh * i / 3); c.stroke(); }
    const bx = sx + sw * (0.5 + 0.3 * Math.sin(now * 1.7)), by = sy + sh * (0.5 + 0.3 * Math.cos(now * 1.3));
    c.fillStyle = kind === 'para' ? '#fef08a' : '#fecaca'; c.beginPath(); c.arc(bx, by, 1.3, 0, Math.PI * 2); c.fill();
    c.restore();
};
Object.assign(ART2, {
    SAR: (c, w, r, x0) => {
        metal(c, x0 - 15, -3.5, 9, 7, '#111827', 2); metal(c, x0 - 7, -3.6, 16, 7.2, '#334155', 1.5); metal(c, x0 + 8, -3, 16, 6, '#1e293b', 2);
        metal(c, x0 + 9, 2.6, 13, 4.2, '#4d7c0f', 2, 0.3); // ống phóng lựu dưới nòng
        metal(c, x0 + 23, -1.4, 6, 2.8, '#0f172a', 1); c.save(); c.translate(x0 + 3, 3); c.rotate(0.2); metal(c, 0, 0, 4, 8, '#0f172a', 1); c.restore();
        metal(c, x0 - 1, -7.2, 8, 3.4, '#0f172a', 1.5); MUZ.SAR = x0 + 29;
    },
    ENERGY: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 6, -5.5, 24, 11, '#4c1d95', 5, 0.5);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) { c.fillStyle = `rgba(196,181,253,${0.35 + 0.35 * Math.sin(now * 8 - i)})`; c.fillRect(x0 - 1 + i * 5, -3, 3, 6); }
        const g = c.createRadialGradient(x0 + 20, 0, 0, x0 + 20, 0, 7); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, 'rgba(167,139,250,0.8)'); g.addColorStop(1, 'rgba(124,58,237,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x0 + 20, 0, 7, 0, Math.PI * 2); c.fill(); c.restore();
        metal(c, x0 + 1, 5, 4, 5, '#2e1065', 1); MUZ.ENERGY = x0 + 22;
    },
    TESLA: (c, w, r, x0, ch, now, p) => {
        metal(c, x0 - 6, -5.5, 18, 11, '#1e3a8a', 3); c.fillStyle = '#b45309'; for (let i = 0; i < 4; i++) c.fillRect(x0 - 3 + i * 3.5, -6, 2, 12); // cuộn dây đồng
        metal(c, x0 + 11, -6.5, 10, 2.4, '#cbd5e1', 1, 0.6); metal(c, x0 + 11, 4.1, 10, 2.4, '#cbd5e1', 1, 0.6);
        c.fillStyle = '#e0f2fe'; c.beginPath(); c.arc(x0 + 21, -5.3, 1.8, 0, Math.PI * 2); c.arc(x0 + 21, 5.3, 1.8, 0, Math.PI * 2); c.fill();
        if (p && p.aiming) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(191,219,254,0.95)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0 + 21, -5.3); for (let i = 1; i <= 4; i++) c.lineTo(x0 + 21 + (Math.random() - 0.5) * 4, -5.3 + i * 2.65); c.stroke(); c.restore(); }
        MUZ.TESLA = x0 + 22;
    },
    NET: (c, w, r, x0) => {
        metal(c, x0 - 6, -4, 22, 8, '#6b7280', 3); metal(c, x0 + 1, 3.5, 4, 6, '#374151', 1);
        c.fillStyle = '#e5e7eb'; c.beginPath(); c.arc(x0 + 19, 0, 5.5, 0, Math.PI * 2); c.fill(); outl(c, 1);
        c.strokeStyle = '#6b7280'; c.lineWidth = 0.7; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x0 + 15, i * 3); c.lineTo(x0 + 23, i * 3); c.moveTo(x0 + 19 + i * 3, -4.5); c.lineTo(x0 + 19 + i * 3, 4.5); c.stroke(); }
        MUZ.NET = x0 + 24;
    },
    BOOMERANG: (c, w, r, x0, ch) => {
        if (w.mag <= 0) return; // đang bay
        c.translate(r + 8, 0); c.rotate(-0.5 - ch * 0.6);
        const g = c.createLinearGradient(-4, -12, 8, 12); g.addColorStop(0, '#fbbf24'); g.addColorStop(1, '#b45309');
        c.beginPath(); c.moveTo(-3, -13); c.quadraticCurveTo(7, 0, -3, 13); c.lineTo(2.5, 11); c.quadraticCurveTo(10, 0, 2.5, -11); c.closePath(); c.fillStyle = g; c.fill(); outl(c, 1.1);
        c.strokeStyle = '#7c2d12'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(1, -9); c.quadraticCurveTo(7, 0, 1, 9); c.stroke();
    },
    GRENADE: (c, w, r) => {
        const g = c.createRadialGradient(r + 3, 5, 1, r + 5, 7, 6.5); g.addColorStop(0, '#6ee7b7'); g.addColorStop(1, '#065f46');
        c.fillStyle = g; c.beginPath(); c.arc(r + 5, 7, 6, 0, Math.PI * 2); c.fill(); outl(c, 1);
        c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(r - 1, 7); c.lineTo(r + 11, 7); c.moveTo(r + 5, 1); c.lineTo(r + 5, 13); c.stroke();
        metal(c, r + 3, -0.5, 4, 3, '#a8a29e', 1); c.strokeStyle = '#d6d3d1'; c.lineWidth = 0.9; c.beginPath(); c.arc(r + 8.5, 0.5, 2, 0, Math.PI * 2); c.stroke();
    },
    EMPGREN: (c, w, r, x0, ch, now) => {
        const g = c.createRadialGradient(r + 3, 5, 1, r + 5, 7, 6.5); g.addColorStop(0, '#bae6fd'); g.addColorStop(1, '#075985');
        c.fillStyle = g; c.beginPath(); c.arc(r + 5, 7, 6, 0, Math.PI * 2); c.fill(); outl(c, 1);
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(125,211,252,${0.6 + Math.sin(now * 12) * 0.3})`; c.lineWidth = 1.2; c.beginPath(); c.arc(r + 5, 7, 3, 0, Math.PI * 2); c.stroke(); c.restore();
        metal(c, r + 3, -0.5, 4, 3, '#cbd5e1', 1);
    },
    RAPIER: (c, w, r, x0, ch) => {
        const b = ch * 8;
        metal(c, r - 7 - b, -2, 10, 4, '#1e293b', 1.5); c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(r - 8 - b, 0, 2, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#fbbf24'; c.lineWidth = 1.8; c.beginPath(); c.arc(r + 4 - b, 0, 5.5, -1.5, 1.5); c.stroke(); // tay bảo hộ cong
        blade(c, [[r + 5 - b, -1.3], [r + 54 - b, -0.2], [r + 56 - b, 0], [r + 54 - b, 0.2], [r + 5 - b, 1.3]], '#f8fafc', '#bae6fd');
        if (ch > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(224,242,254,${ch})`; c.lineWidth = 2; c.beginPath(); c.moveTo(r + 5, 0); c.lineTo(r + 56, 0); c.stroke(); c.restore(); }
    },
    CHAINSAW: (c, w, r, x0, ch, now, p) => {
        metal(c, r - 7, -7, 15, 14, '#ea580c', 3.5, 0.5); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(r - 5, -2, 11, 1.2); c.fillRect(r - 5, 1, 11, 1.2);
        metal(c, r + 7, -4.5, 26, 9, '#9ca3af', 4.5, 0.6);
        const off = p && p.aiming ? (now * 70) % 4 : 0; c.fillStyle = '#111827';
        for (let i = 0; i < 8; i++) { const x = r + 8 + ((i * 3.4 + off) % 26); c.beginPath(); c.moveTo(x, -5.5); c.lineTo(x + 1.6, -6.8); c.lineTo(x + 3, -5.5); c.fill(); c.beginPath(); c.moveTo(x, 5.5); c.lineTo(x + 1.6, 6.8); c.lineTo(x + 3, 5.5); c.fill(); }
        metal(c, r - 4, -9, 8, 2.6, '#1f2937', 1);
    },
    LIGHTSABER: (c, w, r, x0, ch, now, p) => {
        const col = saberColor(p), cc = col.length === 7 ? col : '#4ade80';
        metal(c, r - 7, -2.6, 14, 5.2, '#9ca3af', 1.5, 0.6); c.fillStyle = '#1f2937'; c.fillRect(r - 4, -2.8, 1.6, 5.6); c.fillRect(r, -2.8, 1.6, 5.6);
        c.fillStyle = '#ef4444'; c.fillRect(r + 3, -3.2, 2, 1.4);
        c.save(); c.globalCompositeOperation = 'lighter';
        const L = 40 + (p && p.saberRush ? 4 : 0) + Math.sin(now * 40) * 0.6;
        c.lineCap = 'round';
        c.strokeStyle = hexA(cc, 0.22); c.lineWidth = 13; c.beginPath(); c.moveTo(r + 7, 0); c.lineTo(r + 7 + L, 0); c.stroke();
        c.strokeStyle = hexA(cc, 0.6); c.lineWidth = 6; c.beginPath(); c.moveTo(r + 7, 0); c.lineTo(r + 7 + L, 0); c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(r + 7, 0); c.lineTo(r + 7 + L, 0); c.stroke();
        c.restore();
    },
    SHIELD: (c, w, r, x0, ch, now, p) => {
        const guard = p && p.aiming, R = r + (guard ? 12 : 9), sp = guard ? 1.35 : 1.0;
        c.save();
        c.fillStyle = guard ? 'rgba(148,163,184,0.3)' : 'rgba(148,163,184,0.16)'; c.beginPath(); c.arc(0, 0, R, -sp, sp); c.lineTo(0, 0); c.fill();
        c.lineCap = 'round';
        c.strokeStyle = '#1e293b'; c.lineWidth = guard ? 10 : 8; c.beginPath(); c.arc(0, 0, R, -sp, sp); c.stroke();
        const g = c.createLinearGradient(R - 6, -R, R + 4, R); g.addColorStop(0, '#e2e8f0'); g.addColorStop(0.5, '#94a3b8'); g.addColorStop(1, '#475569');
        c.strokeStyle = g; c.lineWidth = guard ? 7 : 5.5; c.beginPath(); c.arc(0, 0, R, -sp, sp); c.stroke();
        c.strokeStyle = 'rgba(250,204,21,0.8)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, R + (guard ? 2 : 1.5), -sp * 0.9, sp * 0.9); c.stroke();
        c.fillStyle = '#facc15'; c.beginPath(); c.arc(R, 0, 3.2, 0, Math.PI * 2); c.fill(); outl(c, 1);
        c.restore();
    },
    ROUNDSHIELD: (c, w, r, x0, ch, now, p) => {
        if (w.out) return;
        if (p && p.aiming && (p.charge || 0) > 0.08) {
            const g = c.createRadialGradient(r + 5, -3, 2, r + 8, 0, 14); g.addColorStop(0, '#e0f2fe'); g.addColorStop(0.6, '#0ea5e9'); g.addColorStop(1, '#075985');
            c.fillStyle = g; c.beginPath(); c.arc(r + 8, 0, 13, 0, Math.PI * 2); c.fill(); outl(c, 1.4);
            c.strokeStyle = '#fbbf24'; c.lineWidth = 1.6; c.beginPath(); c.arc(r + 8, 0, 9, 0, Math.PI * 2); c.stroke();
            c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(r + 8, 0, 3, 0, Math.PI * 2); c.fill(); return;
        }
        const g = c.createLinearGradient(r + 2, 0, r + 12, 0); g.addColorStop(0, '#075985'); g.addColorStop(0.5, '#38bdf8'); g.addColorStop(1, '#bae6fd');
        rrect(c, r + 2, -17, 10, 34, 5); c.fillStyle = g; c.fill(); outl(c, 1.4);
        c.strokeStyle = '#fbbf24'; c.lineWidth = 1.2; rrect(c, r + 4, -14, 6, 28, 3); c.stroke();
        c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(r + 7, 0, 2.6, 0, Math.PI * 2); c.fill();
    },
    BAT: (c, w, r, x0, ch) => {
        c.rotate(-ch * 1.2);
        const g = c.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, '#fcd34d'); g.addColorStop(0.5, '#d97706'); g.addColorStop(1, '#92400e');
        c.beginPath(); c.moveTo(r - 6, -1.8); c.lineTo(r + 18, -2.4); c.quadraticCurveTo(r + 40, -5.5, r + 42, 0); c.quadraticCurveTo(r + 40, 5.5, r + 18, 2.4); c.lineTo(r - 6, 1.8); c.closePath(); c.fillStyle = g; c.fill(); outl(c, 1.1);
        c.fillStyle = '#1f2937'; c.fillRect(r - 6, -2, 9, 4); c.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 3; i++) c.fillRect(r - 5 + i * 3, -2, 1, 4); // băng quấn cán
        c.fillStyle = '#b91c1c'; c.font = '700 4px sans-serif'; c.fillText('★', r + 30, 1.5);
        if (ch >= 0.9) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(253,224,71,0.45)'; c.beginPath(); c.ellipse(r + 28, 0, 16, 8, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    },
    LONGSWORD: (c, w, r, x0, ch, now, p) => {
        const E = (typeof ELEMS !== 'undefined' && ELEMS[w.elem]) || { col: '#e5e7eb' }, col = E.col;
        metal(c, r - 9, -2.2, 12, 4.4, '#3f3f46', 2); c.fillStyle = col; c.beginPath(); c.arc(r - 10, 0, 2.6, 0, Math.PI * 2); c.fill(); outl(c, 0.8);
        metal(c, r + 2, -8, 3.4, 16, '#a1a1aa', 1.2, 0.6); c.fillStyle = col; c.beginPath(); c.arc(r + 3.7, 0, 1.6, 0, Math.PI * 2); c.fill();
        blade(c, [[r + 5.5, -2.6], [r + 46, -1.6], [r + 53, 0], [r + 46, 1.6], [r + 5.5, 2.6]], '#f1f5f9', '#94a3b8');
        c.save(); c.globalCompositeOperation = 'lighter';
        const stk = p && p.swordStk && (p.swordStkT || 0) > world.time ? p.swordStk : 0;
        c.globalAlpha = 0.35 + stk * 0.1 + Math.sin(now * 4) * 0.12; c.strokeStyle = col; c.lineWidth = 1.6 + stk * 0.3;
        c.beginPath(); c.moveTo(r + 7, 0); c.lineTo(r + 50, 0); c.stroke(); c.restore();
    },
    XBOWX: (c, w, r, x0) => {
        metal(c, r - 7, -3, 28, 6, '#78350f', 2, 0.3);
        c.strokeStyle = '#292524'; c.lineWidth = 3.4; c.beginPath(); c.arc(r + 14, 0, 12, -Math.PI / 2.2, Math.PI / 2.2, true); c.stroke();
        c.strokeStyle = '#78716c'; c.lineWidth = 1.6; c.beginPath(); c.arc(r + 14, 0, 12, -Math.PI / 2.2, Math.PI / 2.2, true); c.stroke();
        c.strokeStyle = '#f1f5f9'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(r + 10.5, -11); c.lineTo(r + 4, 0); c.lineTo(r + 10.5, 11); c.stroke();
        c.fillStyle = '#d4d4d8'; c.fillRect(r + 4, -0.9, 20, 1.8); c.fillStyle = '#ef4444'; c.beginPath(); c.arc(r + 25, 0, 3, 0, Math.PI * 2); c.fill(); outl(c, 0.8);
        glint(c, r + 24, -1, 0.8); MUZ.XBOWX = r + 26;
    },
    XBOWR: (c, w, r, x0, ch, now, p) => {
        metal(c, r - 7, -3.6, 30, 7.2, '#713f12', 2, 0.3); metal(c, r + 1, -10, 15, 6.4, '#a16207', 1.5, 0.3);
        c.fillStyle = '#e7e5e4'; for (let i = 0; i < 4; i++) c.fillRect(r + 3 + i * 3.2, -9.4, 1.2, 5.2); // tên trong hộp
        c.strokeStyle = '#292524'; c.lineWidth = 3.2; c.beginPath(); c.arc(r + 16, 0, 11, -Math.PI / 2.3, Math.PI / 2.3, true); c.stroke();
        c.strokeStyle = '#f1f5f9'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(r + 13, -10); c.lineTo(r + 6, 0); c.lineTo(r + 13, 10); c.stroke();
        const k = p ? Math.min(1, (p.xbRamp || 0) / 14) : 0;
        if (k > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(253,224,71,${0.2 + k * 0.4})`; c.fillRect(r - 4, -4, 30, 8); c.restore(); }
        MUZ.XBOWR = r + 26;
    },
    AIRCALL: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 2, -4.5, 13, 9, '#3f6212', 2.5); c.fillStyle = '#1a2e05'; for (let i = 0; i < 3; i++) c.fillRect(x0, -2.5 + i * 2, 6, 0.9);
        c.strokeStyle = '#111827'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0 + 9, -4); c.lineTo(x0 + 16, -11); c.stroke(); // ăng-ten
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = Math.sin(now * 6) > 0 ? '#ef4444' : '#7f1d1d'; c.beginPath(); c.arc(x0 + 16, -11, 1.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(163,230,53,0.8)'; c.fillRect(x0 + 7, -2.5, 3, 2); c.restore();
    },
    LASERDES: (c, w, r, x0, ch, now) => {
        metal(c, x0 - 4, -5, 16, 4.4, '#831843', 2); metal(c, x0 - 4, 0.6, 16, 4.4, '#831843', 2); metal(c, x0 + 1, -1, 5, 2, '#1f2937', 1);
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(244,63,94,${0.6 + Math.sin(now * 9) * 0.3})`; c.beginPath(); c.arc(x0 + 12.5, -2.8, 1.6, 0, Math.PI * 2); c.arc(x0 + 12.5, 2.8, 1.6, 0, Math.PI * 2); c.fill(); c.restore();
    },
    BOMBTAB: (c, w, r, x0, ch, now) => tablet(c, x0 - 3, -7, 16, 14, '#ea580c', now),
    SMOKETAB: (c, w, r, x0, ch, now) => tablet(c, x0 - 3, -7, 16, 14, '#94a3b8', now),
    ORBITAB: (c, w, r, x0, ch, now) => tablet(c, x0 - 3, -7, 16, 14, '#a855f7', now),
    MARKBOMB: (c, w, r, x0, ch, now) => tablet(c, x0 - 3, -7, 16, 14, '#ef4444', now),
    MARKPARA: (c, w, r, x0, ch, now) => tablet(c, x0 - 3, -7, 16, 14, '#22c55e', now, 'para'),
    GUIDEBOMB: (c, w, r, x0, ch, now) => tablet(c, x0 - 3, -7, 16, 14, '#f59e0b', now),
    CELLBURN: (c, w, r, x0, ch, now) => tablet(c, x0 - 3, -7, 16, 14, '#f97316', now)
});

/* ============================== SÀN BẢN ĐỒ (họa tiết theo chủ đề) ============================== */
const _floorCache = {};
function floorPattern(ti) {
    if (_floorCache[ti]) return _floorCache[ti];
    const th = THEMES[ti] || THEMES[0], S = 240, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.fillStyle = th.floor; g.fillRect(0, 0, S, S);
    let seed = 1 + ti * 97; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 1400; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.05)'; g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2); } // hạt nhiễu
    for (let i = 0; i < 5; i++) { const x = rnd() * S, y = rnd() * S, rr = 14 + rnd() * 30; const sg = g.createRadialGradient(x, y, 0, x, y, rr); sg.addColorStop(0, 'rgba(0,0,0,0.12)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); } // vệt bẩn
    // ô lát 120×120: rãnh tối + gờ sáng
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; for (let k = 0; k <= S; k += 120) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, S); g.moveTo(0, k); g.lineTo(S, k); g.stroke(); }
    g.strokeStyle = th.grid.replace(/[\d.]+\)$/, '0.14)'); g.lineWidth = 1; for (let k = 2; k <= S; k += 120) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, S); g.moveTo(0, k); g.lineTo(S, k); g.stroke(); }
    g.strokeStyle = th.grid; g.lineWidth = 1; for (let k = 60; k < S; k += 120) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, S); g.moveTo(0, k); g.lineTo(S, k); g.stroke(); } // lưới phụ mờ
    g.fillStyle = 'rgba(255,255,255,0.07)'; [8, 112, 128, 232].forEach(x => [8, 112, 128, 232].forEach(y => { g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); })); // đinh tán góc ô
    return (_floorCache[ti] = ctx.createPattern(cv, 'repeat'));
}
function drawFloor2(th, vx0, vx1, vy0, vy1) {
    const pat = floorPattern(world.theme || 0);
    ctx.fillStyle = pat || th.floor; ctx.fillRect(Math.max(0, vx0), Math.max(0, vy0), Math.min(MAP_W, vx1) - Math.max(0, vx0), Math.min(MAP_H, vy1) - Math.max(0, vy0));
    // ánh sáng trung tâm dịu
    const g = ctx.createRadialGradient(MAP_W / 2, MAP_H / 2, 0, MAP_W / 2, MAP_H / 2, Math.max(MAP_W, MAP_H) * 0.6);
    g.addColorStop(0, hexA(th.accent.length === 7 ? th.accent : '#3b4a7a', 0.08)); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g; ctx.fillRect(Math.max(0, vx0), Math.max(0, vy0), Math.min(MAP_W, vx1) - Math.max(0, vx0), Math.min(MAP_H, vy1) - Math.max(0, vy0));
}

/* ============================== TƯỜNG / THÙNG GỖ / BAO CÁT / BĂNG ============================== */
function drawObstacle2(o, now) {
    const depth = o.wood ? 9 : o.sandbag ? 8 : 15, x = o.x, y = o.y, w = o.w, h = o.h;
    // bóng đổ mềm
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x + 7, y + 11, w, h + depth * 0.4, 4); ctx.fill();
    if (o.ice) {
        ctx.fillStyle = 'rgba(14,90,130,0.85)'; ctx.fillRect(x, y + depth * 0.6, w, h);
        const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, o.reflect ? '#f0f9ff' : '#bae6fd'); g.addColorStop(0.5, o.reflect ? '#bae6fd' : '#7dd3fc'); g.addColorStop(1, '#38bdf8');
        ctx.fillStyle = o.hit > 0 ? '#fff' : g; ctx.globalAlpha = 0.9; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(x + w * 0.2, y + 3); ctx.lineTo(x + 3, y + h * 0.3); ctx.stroke();
        return;
    }
    if (o.cage) { // lồng nhốt: thanh sắt
        ctx.fillStyle = '#0e3a4a'; ctx.fillRect(x, y + 6, w, h);
        ctx.fillStyle = o.hit > 0 ? '#fff' : '#22d3ee'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(8,47,73,0.6)'; const long = Math.max(w, h); for (let d = 6; d < long; d += 12) { if (w > h) ctx.fillRect(x + d, y, 3, h); else ctx.fillRect(x, y + d, w, 3); }
        return;
    }
    // mặt hông (khối 3D)
    const side = o.wood ? '#3b2716' : o.sandbag ? '#57452a' : '#0d1222';
    const sg = ctx.createLinearGradient(0, y + h, 0, y + h + depth); sg.addColorStop(0, side); sg.addColorStop(1, '#05070d');
    ctx.fillStyle = sg; ctx.fillRect(x, y + h - 2, w, depth + 2);
    if (o.wood) {
        const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#b07a45'); g.addColorStop(1, '#7a4f28');
        ctx.fillStyle = o.hit > 0 ? '#fff' : g; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(60,32,12,0.55)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 2, y + h * k / 4); ctx.lineTo(x + w - 2, y + h * k / 4); ctx.stroke(); } // ván gỗ
        ctx.strokeStyle = 'rgba(60,32,12,0.7)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x + 5, y + 5); ctx.lineTo(x + w - 5, y + h - 5); ctx.stroke(); // nẹp chéo
        ctx.strokeStyle = '#3d2410'; ctx.lineWidth = 2.5; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
        ctx.fillStyle = '#9ca3af'; [[3, 3], [w - 7, 3], [3, h - 7], [w - 7, h - 7]].forEach(([a, b]) => ctx.fillRect(x + a, y + b, 4, 4)); // ke góc kim loại
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 3, y + 2, w - 6, 2);
        if (o.hp < o.maxHp) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y - 8, w, 4); ctx.fillStyle = '#f59e0b'; ctx.fillRect(x, y - 8, w * o.hp / o.maxHp, 4); }
        return;
    }
    if (o.sandbag) {
        ctx.fillStyle = o.hit > 0 ? '#fff' : '#a68a5b'; ctx.fillRect(x, y, w, h);
        const long = w >= h, n = Math.max(2, Math.round((long ? w : h) / 22));
        for (let i = 0; i < n; i++) for (let row = 0; row < 2; row++) {
            const L = (long ? w : h) / n, off = row ? L / 2 : 0, a = (long ? x : y) + i * L + off - (row ? L / 2 : 0);
            const bx = long ? a : x + row * w / 2, by = long ? y + row * h / 2 : a, bw = long ? L - 2 : w / 2 - 1, bh = long ? h / 2 - 1 : L - 2;
            const g = ctx.createLinearGradient(bx, by, bx, by + bh); g.addColorStop(0, '#d6bf8e'); g.addColorStop(1, '#8a6f40');
            rrect(ctx, bx + 1, by + 1, Math.max(2, bw), Math.max(2, bh), 4); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(70,50,20,0.6)'; ctx.lineWidth = 1; ctx.stroke();
        }
        return;
    }
    // tường bê tông / kim loại
    const th = THEMES[world.theme || 0], acc = th.accent.length === 7 ? th.accent : '#3b4a7a';
    const g = ctx.createLinearGradient(x, y, x + w * 0.3, y + h); g.addColorStop(0, shade(acc, -0.05)); g.addColorStop(1, shade(acc, -0.55));
    ctx.fillStyle = o.hit > 0 ? '#fff' : g; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x, y, w, 2.5); ctx.fillRect(x, y, 2.5, h); // gờ sáng trên-trái
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(x, y + h - 2.5, w, 2.5); ctx.fillRect(x + w - 2.5, y, 2.5, h); // gờ tối dưới-phải
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.2; // khe ghép tấm
    if (w >= h) for (let d = 60; d < w - 10; d += 60) { ctx.beginPath(); ctx.moveTo(x + d, y + 2); ctx.lineTo(x + d, y + h - 2); ctx.stroke(); }
    else for (let d = 60; d < h - 10; d += 60) { ctx.beginPath(); ctx.moveTo(x + 2, y + d); ctx.lineTo(x + w - 2, y + d); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; // đinh tán
    if (w >= h) for (let d = 30; d < w; d += 60) { ctx.beginPath(); ctx.arc(x + d, y + h / 2, 1.5, 0, Math.PI * 2); ctx.fill(); }
    else for (let d = 30; d < h; d += 60) { ctx.beginPath(); ctx.arc(x + w / 2, y + d, 1.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = hexA(acc, 0.9); ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    if (o.temp) { ctx.strokeStyle = `rgba(251,191,36,${0.35 + Math.sin(now * 4) * 0.15})`; ctx.setLineDash([6, 5]); ctx.strokeRect(x + 3, y + 3, w - 6, h - 6); ctx.setLineDash([]); }
    if (o.maxHp && o.hp < o.maxHp && !o.wood) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y - 7, w, 3); ctx.fillStyle = '#94a3b8'; ctx.fillRect(x, y - 7, w * o.hp / o.maxHp, 3); }
}

/* ============================== HÒM ============================== */
function drawCrateBody(c, s, col, look) {
    const h = s / 2;
    ctx.fillStyle = shade(col, -0.5); rrect(ctx, -h, -h + s * 0.18, s, s * 0.82, 5); ctx.fill(); // mặt trước
    const g = ctx.createLinearGradient(0, -h, 0, h * 0.4); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, shade(col, -0.1));
    rrect(ctx, -h, -h, s, s * 0.78, 5); ctx.fillStyle = g; ctx.fill(); // nắp
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; rrect(ctx, -h, -h, s, s, 5); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-h, s * 0.26, s, 2); // khe nắp
    ctx.fillStyle = '#cbd5e1'; [[-h, -h], [h - 5, -h], [-h, h - 5], [h - 5, h - 5]].forEach(([a, b]) => { rrect(ctx, a, b, 5, 5, 1.5); ctx.fill(); }); // góc kim loại
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-h + 5, -h + 3, s - 10, 2);
    ctx.fillStyle = 'rgba(15,23,42,0.75)'; ctx.font = `700 ${Math.round(s * 0.42)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(look === 'LEGEND' ? '★' : look === 'SUPPORT' ? '✚' : '⌖', 0, -s * 0.08); ctx.textBaseline = 'alphabetic';
}

/* ============================== BỤI CÂY ============================== */
drawBushes = function (now) {
    const me = localPlayer();
    bushes.forEach(b => {
        const mineInside = me && dist(me.x, me.y, b.x, b.y) < b.r;
        const anyInside = players.some(p => p.hp > 0 && dist(p.x, p.y, b.x, b.y) < b.r);
        const alpha = mineInside ? 0.45 : (localId() === null && anyInside) ? 0.7 : 0.97;
        const fade = b.t !== undefined ? Math.min(1, b.t / 1) : 1;
        ctx.save(); ctx.globalAlpha = alpha * fade;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(b.x + 6, b.y + 10, b.r * 1.02, b.r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
        const seed = b.seed || 0, n = 9;
        const blob = (x, y, rr, c0, c1) => { const g = ctx.createRadialGradient(x - rr * 0.35, y - rr * 0.4, rr * 0.1, x, y, rr); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); };
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + seed, rr = b.r * 0.58, sw = Math.sin(now * 1.4 + i + seed) * 2.2; blob(b.x + Math.cos(a) * rr + sw, b.y + Math.sin(a) * rr, b.r * 0.46, '#22a04b', '#0f4d24'); }
        for (let i = 0; i < 5; i++) { const a = i * 1.26 + seed * 1.7, rr = b.r * 0.3, sw = Math.sin(now * 1.7 + i * 2 + seed) * 1.6; blob(b.x + Math.cos(a) * rr + sw, b.y + Math.sin(a) * rr, b.r * 0.42, '#34c25f', '#14632f'); }
        blob(b.x, b.y - 2, b.r * 0.4, '#4ade80', '#166534');
        ctx.fillStyle = 'rgba(187,247,208,0.35)'; // điểm sáng lá
        for (let i = 0; i < 9; i++) { const a = i * 2.39 + seed, rr = b.r * (0.2 + (i % 3) * 0.2); ctx.beginPath(); ctx.ellipse(b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr - 3, 3.2, 1.6, a, 0, Math.PI * 2); ctx.fill(); }
        if (b.burning > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(251,146,60,${0.25 + Math.sin(now * 14) * 0.1})`; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
    });
};

/* ============================== KHÓI DẠNG MÂY ============================== */
function smokePuffs(z) {
    if (z._puffs && z._pr === z.r) return z._puffs;
    let s = Math.abs(Math.round(z.x * 13 + z.y * 7)) % 2147483647 || 1; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const out = []; for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * z.r * 0.62; out.push({ a, d, r: z.r * (0.32 + rnd() * 0.22), sp: (rnd() - 0.5) * 0.5, ph: rnd() * 6, sh: 0.8 + rnd() * 0.3 }); }
    z._puffs = out; z._pr = z.r; return out;
}
const _drawAirZones34 = drawAirZones;
drawAirZones = function (now) {
    // khói vẽ riêng (mây nhiều lớp), phần còn lại (hố đen…) giữ như cũ
    const sm = zones.filter(z => z.type === 'smoke');
    sm.forEach(z => { z._t = z.type; z.type = '_smoke'; });
    try { _drawAirZones34(now); } finally { sm.forEach(z => { z.type = z._t; }); }
    sm.forEach(z => {
        const lid = localId(), mine = lid !== null && (z.owner === lid || sameTeamId(lid, z.owner));
        let k = Math.max(0, Math.min(1, z.t / 0.8)) * Math.min(1, (z.maxT - z.t + 0.05) / 0.35 + 0.3);
        if (mine) { ctx.save(); ctx.strokeStyle = `rgba(203,213,225,${0.5 * k})`; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -now * 20; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); k *= 0.25; }
        const tint = z.phase === 7 ? '186,230,253' : '178,186,204';
        ctx.save();
        smokePuffs(z).forEach(pf => {
            const a = pf.a + now * pf.sp, d = pf.d * (0.92 + Math.sin(now * 0.7 + pf.ph) * 0.08), px = z.x + Math.cos(a) * d, py = z.y + Math.sin(a) * d, rr = pf.r * (1 + Math.sin(now * 0.9 + pf.ph) * 0.06);
            const g = ctx.createRadialGradient(px - rr * 0.25, py - rr * 0.3, rr * 0.1, px, py, rr);
            g.addColorStop(0, `rgba(${tint},${0.55 * k * pf.sh})`); g.addColorStop(0.6, `rgba(${tint},${0.38 * k * pf.sh})`); g.addColorStop(1, `rgba(${tint},0)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rr, 0, Math.PI * 2); ctx.fill();
        });
        const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r * 0.8); g.addColorStop(0, `rgba(${tint},${0.5 * k})`); g.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
};

/* ============================== VIỀN TỐI MÀN HÌNH (tập trung vào giữa) ============================== */
let _vigCv = null, _vigKey = '';
const _drawEnemyArrows34 = drawEnemyArrows;
drawEnemyArrows = function (zoom) {
    if (gameState === 'PLAYING' || gameState === 'KO' || gameState === 'COUNTDOWN') {
        const W = SCREEN_W, H = SCREEN_H, key = W + 'x' + H;
        if (_vigKey !== key) { _vigCv = document.createElement('canvas'); _vigCv.width = Math.max(1, Math.round(W / 2)); _vigCv.height = Math.max(1, Math.round(H / 2)); const v = _vigCv.getContext('2d'); const g = v.createRadialGradient(_vigCv.width / 2, _vigCv.height / 2, Math.min(W, H) * 0.22, _vigCv.width / 2, _vigCv.height / 2, Math.max(W, H) * 0.42); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,6,0.42)'); v.fillStyle = g; v.fillRect(0, 0, _vigCv.width, _vigCv.height); _vigKey = key; }
        ctx.drawImage(_vigCv, 0, 0, W, H);
    }
    _drawEnemyArrows34(zoom);
};
