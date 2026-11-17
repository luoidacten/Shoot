/** ==================== ĐỒ HỌA VŨ KHÍ · VÙNG NGẮM · BỤI RẬM ==================== */

/** Vẽ vũ khí theo hệ toạ độ của nhân vật (đã xoay theo hướng nhìn, tâm = thân). r = bán kính thân. */
function drawWeaponArt(c, w, r, now, p) {
    const rc = p ? (p.recoil || 0) * 5 : 0;
    const ch = p ? (p.charge || 0) : 0;
    const x0 = r - 4 - rc;
    const outline = (fn) => { c.lineWidth = 2; c.strokeStyle = 'rgba(0,0,0,0.65)'; fn(); c.stroke(); };
    const box = (x, y, ww, hh, col, rad = 2) => { rrect(c, x, y, ww, hh, rad); c.fillStyle = col; c.fill(); outline(() => rrect(c, x, y, ww, hh, rad)); };
    c.save();
    c.scale(1.25, 1.25); r /= 1.25; // phóng to vũ khí cho dễ nhìn trên điện thoại (giữ nguyên vị trí tay)
    switch (w.id) {
        case 'NONE': break;
        case 'KNIFE': {
            box(r - 2, -2.5, 8, 5, '#3f3f46');
            c.fillStyle = '#e5e7eb'; c.beginPath(); c.moveTo(r + 6, -3.5); c.lineTo(r + 22, 0); c.lineTo(r + 6, 3); c.closePath(); c.fill(); outline(() => { c.beginPath(); c.moveTo(r + 6, -3.5); c.lineTo(r + 22, 0); c.lineTo(r + 6, 3); c.closePath(); });
            c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(r + 8, -2.5, 10, 1);
            break;
        }
        case 'DAGGERS': {
            [-7, 7].forEach(oy => { box(r - 3, oy - 2, 6, 4, '#57534e'); c.fillStyle = '#f1f5f9'; c.beginPath(); c.moveTo(r + 3, oy - 2.5); c.lineTo(r + 17, oy); c.lineTo(r + 3, oy + 2.5); c.fill(); });
            break;
        }
        case 'KATANA': {
            const back = ch * 10;
            box(r - 8 - back, -2.5, 12, 5, '#1e293b'); // chuôi quấn
            c.fillStyle = '#facc15'; c.fillRect(r + 3 - back, -5, 3, 10); // chắn tay
            const g = c.createLinearGradient(r + 6, 0, r + 46, 0); g.addColorStop(0, '#e0f2fe'); g.addColorStop(1, '#7dd3fc');
            c.fillStyle = g; c.beginPath(); c.moveTo(r + 6 - back, -2.5); c.quadraticCurveTo(r + 30 - back, -5, r + 46 - back, -1); c.lineTo(r + 6 - back, 2.5); c.closePath(); c.fill();
            if (ch > 0.2) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(125,211,252,${ch})`; c.lineWidth = 3; c.beginPath(); c.moveTo(r + 6, 0); c.lineTo(r + 46, 0); c.stroke(); }
            break;
        }
        case 'LIGHTSABER': {
            const col = saberColor(p);
            box(r - 6, -2.5, 12, 5, '#9ca3af'); c.fillStyle = '#374151'; c.fillRect(r - 3, -3, 2, 6); c.fillRect(r + 1, -3, 2, 6);
            c.globalCompositeOperation = 'lighter';
            const L = 40 + (p && p.saberRush ? 4 : 0) + Math.sin(now * 40) * 0.6;
            c.strokeStyle = hexA(col.length === 7 ? col : '#4ade80', 0.35); c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(r + 6, 0); c.lineTo(r + 6 + L, 0); c.stroke();
            c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.moveTo(r + 6, 0); c.lineTo(r + 6 + L, 0); c.stroke();
            c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(r + 6, 0); c.lineTo(r + 6 + L, 0); c.stroke();
            break;
        }
        case 'SPEAR': {
            const back = ch * 14;
            c.fillStyle = '#92400e'; c.fillRect(r - 14 - back, -1.5, 48, 3);
            c.fillStyle = '#fde68a'; c.beginPath(); c.moveTo(r + 34 - back, -5); c.lineTo(r + 50 - back, 0); c.lineTo(r + 34 - back, 5); c.closePath(); c.fill();
            outline(() => { c.beginPath(); c.moveTo(r + 34 - back, -5); c.lineTo(r + 50 - back, 0); c.lineTo(r + 34 - back, 5); c.closePath(); });
            c.fillStyle = '#dc2626'; c.fillRect(r + 30 - back, -3, 3, 6);
            break;
        }
        case 'HAMMER': {
            c.rotate(-ch * 1.4); // giơ búa lên khi tụ lực
            c.fillStyle = '#78350f'; c.fillRect(r - 4, -2, 28, 4);
            box(r + 20, -9, 14, 18, '#57534e', 3);
            c.fillStyle = '#a8a29e'; c.fillRect(r + 21, -8, 3, 16);
            if (ch >= 0.9) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(253,224,71,0.5)'; c.fillRect(r + 18, -11, 18, 22); }
            break;
        }
        case 'CHAINSAW': {
            box(r - 6, -6, 14, 12, '#ea580c', 3);
            c.fillStyle = '#d1d5db'; rrect(c, r + 8, -4, 24, 8, 4); c.fill();
            c.fillStyle = '#111827';
            const off = p && p.aiming ? (now * 60) % 4 : 0;
            for (let i = 0; i < 7; i++) c.fillRect(r + 9 + i * 3.4 + off * 0.5, -5, 1.5, 10);
            break;
        }
        case 'SHIELD': {
            const guard = p && p.aiming;
            const R = r + (guard ? 12 : 9), sp = guard ? 1.35 : 1.0;
            const g = c.createLinearGradient(R - 6, 0, R + 4, 0); g.addColorStop(0, '#475569'); g.addColorStop(1, '#cbd5e1');
            c.strokeStyle = g; c.lineWidth = guard ? 8 : 6; c.beginPath(); c.arc(0, 0, R, -sp, sp); c.stroke();
            c.fillStyle = guard ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.2)'; c.beginPath(); c.arc(0, 0, R, -sp, sp); c.lineTo(0, 0); c.fill();
            c.fillStyle = '#facc15'; c.beginPath(); c.arc(R, 0, 3, 0, Math.PI * 2); c.fill();
            break;
        }
        case 'PISTOL': box(x0, -3, 14, 6, '#64748b'); box(x0 - 2, 1, 5, 7, '#334155'); break;
        case 'REVOLVER': {
            box(x0, -2.5, 18, 5, '#a16207'); c.fillStyle = '#44403c'; c.beginPath(); c.arc(x0 + 4, 0, 5, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#78716c'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + (p ? p.shotCount || 0 : 0); c.beginPath(); c.arc(x0 + 4 + Math.cos(a) * 2.6, Math.sin(a) * 2.6, 1, 0, Math.PI * 2); c.fill(); }
            box(x0 - 3, 1.5, 5, 7, '#57534e');
            break;
        }
        case 'SMG': box(x0, -3, 16, 6, '#ca8a04'); box(x0 + 6, 2, 3, 8, '#1f2937'); c.fillStyle = '#111'; c.fillRect(x0 + 15, -1.5, 4, 3); break;
        case 'DUAL': [-7, 7].forEach(oy => { box(x0, oy - 2.5, 13, 5, '#d4d4d8'); box(x0 - 1, oy + 1, 4, 5, '#3f3f46'); }); break;
        case 'AR': {
            box(x0 - 8, -3, 30, 6, '#3f6212'); box(x0 - 14, -3.5, 8, 7, '#1a2e05');
            box(x0 + 5, 2, 4, 9, '#1c1917'); c.fillStyle = '#111'; c.fillRect(x0 + 21, -1.5, 6, 3);
            c.fillStyle = '#a3e635'; c.fillRect(x0 + 2, -5, 6, 2); // ống ngắm
            break;
        }
        case 'SHOTGUN': {
            box(x0 - 6, -3.5, 26, 7, '#9f1239'); c.fillStyle = '#111827'; c.fillRect(x0 + 18, -3, 4, 2.5); c.fillRect(x0 + 18, 0.5, 4, 2.5);
            box(x0 + 4, 3, 9, 4, '#7c2d12', 2);
            break;
        }
        case 'SNIPER': {
            box(x0 - 10, -2.5, 46, 5, '#6b21a8'); box(x0 - 14, -3.5, 8, 7, '#3b0764');
            box(x0 + 4, -8, 14, 4, '#1e1b4b', 2); c.fillStyle = '#c4b5fd'; c.beginPath(); c.arc(x0 + 18, -6, 1.6, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#111'; c.fillRect(x0 + 34, -1.5, 5, 3);
            if (ch > 0) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(216,180,254,${ch * 0.7})`; c.beginPath(); c.arc(x0 + 18, -6, 3 + ch * 3, 0, Math.PI * 2); c.fill(); }
            break;
        }
        case 'BOW': {
            const pull = ch * 9;
            c.strokeStyle = '#65a30d'; c.lineWidth = 3.5; c.beginPath(); c.arc(r + 2, 0, 14, -1.25, 1.25); c.stroke();
            const tx = r + 2 + Math.cos(1.25) * 14, ty = Math.sin(1.25) * 14;
            c.strokeStyle = '#ecfccb'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx, -ty); c.lineTo(r + 2 - pull + 4, 0); c.lineTo(tx, ty); c.stroke();
            if (p && (p.aiming || ch > 0)) { c.fillStyle = '#d9f99d'; c.fillRect(r + 6 - pull, -1, 22, 2); c.beginPath(); c.moveTo(r + 28 - pull, -3); c.lineTo(r + 33 - pull, 0); c.lineTo(r + 28 - pull, 3); c.fill(); }
            break;
        }
        case 'ROCKET': box(x0 - 10, -6, 30, 12, '#374151', 3); c.fillStyle = '#ef4444'; c.fillRect(x0 + 18, -5, 4, 10); c.fillStyle = '#fbbf24'; c.fillRect(x0 - 12, -4, 3, 8); break;
        case 'LAUNCHER': box(x0 - 4, -5, 22, 10, '#4d7c0f', 4); c.fillStyle = '#1a2e05'; c.beginPath(); c.arc(x0 + 2, 0, 4, 0, Math.PI * 2); c.fill(); c.fillStyle = '#84cc16'; c.fillRect(x0 + 16, -4, 3, 8); break;
        case 'FLAME': {
            box(x0 - 6, -4, 22, 8, '#9a3412', 3); box(x0 - 2, 3, 8, 8, '#ef4444', 4); // bình nhiên liệu
            c.fillStyle = '#fbbf24'; c.fillRect(x0 + 16, -2, 4, 4);
            c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(56,189,248,${0.5 + Math.sin(now * 20) * 0.3})`; c.beginPath(); c.arc(x0 + 21, 0, 2, 0, Math.PI * 2); c.fill();
            break;
        }
        case 'NET': box(x0 - 4, -4, 20, 8, '#9ca3af', 3); c.fillStyle = '#e5e7eb'; c.beginPath(); c.arc(x0 + 18, 0, 5, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#6b7280'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + 14, -4); c.lineTo(x0 + 22, 4); c.moveTo(x0 + 22, -4); c.lineTo(x0 + 14, 4); c.stroke(); break;
        case 'BOOMERANG': {
            if (w.mag <= 0) break; // đang bay
            c.translate(r + 8, 0); c.rotate(-0.5 - ch * 0.6);
            c.fillStyle = '#d97706'; c.beginPath(); c.moveTo(-3, -12); c.quadraticCurveTo(6, 0, -3, 12); c.lineTo(2, 10); c.quadraticCurveTo(9, 0, 2, -10); c.closePath(); c.fill();
            outline(() => { c.beginPath(); c.moveTo(-3, -12); c.quadraticCurveTo(6, 0, -3, 12); c.lineTo(2, 10); c.quadraticCurveTo(9, 0, 2, -10); c.closePath(); });
            break;
        }
        case 'GRENADE': c.fillStyle = '#10b981'; c.beginPath(); c.arc(r + 5, 7, 5.5, 0, Math.PI * 2); c.fill(); c.fillStyle = '#065f46'; c.fillRect(r + 3, 0, 4, 3); break;
        case 'MINIGUN': {
            box(x0 - 8, -7, 16, 14, '#7c2d12', 3);
            const spin = (p && p.spinUp ? p.spinUp * 40 : 0) + now * (p && p.aiming ? 30 : 2);
            for (let i = 0; i < 4; i++) { const oy = Math.sin(spin + i * Math.PI / 2) * 4; c.fillStyle = i % 2 ? '#9ca3af' : '#6b7280'; c.fillRect(x0 + 6, oy - 1.2, 26, 2.4); }
            c.fillStyle = '#f97316'; c.fillRect(x0 + 28, -5, 4, 10);
            break;
        }
        case 'RAILGUN': {
            box(x0 - 8, -4, 38, 8, '#155e75', 3);
            c.fillStyle = '#0e7490'; c.fillRect(x0 + 30, -5, 5, 3); c.fillRect(x0 + 30, 2, 5, 3);
            c.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 4; i++) { c.fillStyle = `rgba(34,211,238,${0.3 + (ch > i / 4 ? 0.6 : 0)})`; c.fillRect(x0 + i * 7, -2, 5, 4); }
            break;
        }
        default: box(x0, -(w.width || 4) / 2, w.len || 12, w.width || 4, w.color || '#999');
    }
    c.restore();
    // ánh vàng cho vũ khí huyền thoại
    if (w.legendary) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = hexA(w.color, 0.25 + Math.sin(now * 8) * 0.15); c.beginPath(); c.ellipse(r + 14, 0, 22, 8, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    // chớp đầu nòng
    if (p && p.muzzle > 0 && w.type === 'GUN' && !w.flame) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const mx = r + (w.len || 12) * 0.9;
        c.fillStyle = 'rgba(255,220,120,0.9)'; c.beginPath(); c.moveTo(mx, -6); c.lineTo(mx + 18 + Math.random() * 10, 0); c.lineTo(mx, 6); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(mx + 2, 0, 5, 0, Math.PI * 2); c.fill();
        c.restore();
    }
}

/** Vùng ngắm kiểu Brawl Stars (hiện khi đang giữ nút đánh) */
function drawAimZone(p, w, now) {
    const ang = p.aimAngle !== undefined ? p.aimAngle : p.angle;
    const ch = p.charge || 0;
    const ready = p.aimshot && (p.superCharge || 0) >= (p.superNeed || 5);
    const cancel = p.cancelShot;
    const col = cancel ? '255,80,80' : ready ? '253,224,71' : p.id === localId() || localId() === null ? '255,255,255' : '255,120,120';
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
    const kind = w.aim || (w.type === 'GUN' ? 'line' : 'arc');
    if (kind === 'line') {
        let range = chargeRange(w, ch, p), spread = (w.spread || 0) * p.spreadMult;
        if (w.narrow) spread = spreadAt(w, ch);
        if (w.id === 'BOW' && ch < 0.35) spread = w.spread;
        if (w.id === 'AR') spread = 0.28;
        // vạch mờ ở tầm tối đa khi tụ đầy (để biết còn dài được bao nhiêu)
        if (w.mode === 'charge' && w.narrow) {
            const maxR = chargeRange(w, 1, p);
            ctx.strokeStyle = `rgba(${col},0.18)`; ctx.lineWidth = 1; ctx.setLineDash([4, 10]);
            ctx.beginPath(); ctx.moveTo(range, 0); ctx.lineTo(maxR, 0); ctx.stroke(); ctx.setLineDash([]);
        }
        const half = Math.max(7, range * Math.tan(Math.max(0.02, spread) / 2));
        const g = ctx.createLinearGradient(p.radius, 0, range, 0);
        g.addColorStop(0, `rgba(${col},0.28)`); g.addColorStop(1, `rgba(${col},0.06)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(p.radius, -6); ctx.lineTo(range, -half); ctx.lineTo(range, half); ctx.lineTo(p.radius, 6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(${col},0.55)`; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = `rgba(${col},0.9)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(range, -half - 4); ctx.lineTo(range, half + 4); ctx.stroke();
        if (w.mode === 'charge') {
            // vạch tụ lực
            ctx.strokeStyle = `rgba(${ch >= 0.99 ? '253,224,71' : col},0.9)`; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(p.radius + 4, 0); ctx.lineTo(p.radius + 4 + (range - p.radius) * ch, 0); ctx.stroke();
            if (w.id === 'RAILGUN' && ch < 0.6) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(p.radius + (range - p.radius) * 0.6, -6, 2, 12); }
        }
    } else if (kind === 'lineMelee') {
        const range = (w.range + p.radius) * (ch >= 0.9 ? 1.25 : 1);
        ctx.fillStyle = `rgba(${col},0.2)`; ctx.fillRect(p.radius, -10, range - p.radius, 20);
        ctx.strokeStyle = `rgba(${col},0.6)`; ctx.lineWidth = 1.5; ctx.strokeRect(p.radius, -10, range - p.radius, 20);
        if (ch > 0) { ctx.fillStyle = `rgba(253,224,71,${0.4 * ch})`; ctx.fillRect(p.radius, -10, (range - p.radius) * ch, 20); }
    } else if (kind === 'lob') {
        const e = enemyOf(p);
        let d = p.manualEngaged ? (p.aimDist || (150 + ch * 400)) : (e && targetable(p, e) ? dist(p.x, p.y, e.x, e.y) : 300);
        d = Math.min(w.id === 'LAUNCHER' ? w.range : 520, Math.max(90, d));
        ctx.setLineDash([8, 8]); ctx.lineDashOffset = -now * 30; ctx.strokeStyle = `rgba(${col},0.6)`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.radius, 0); ctx.quadraticCurveTo(d / 2, -d * 0.35, d, 0); ctx.stroke(); ctx.setLineDash([]);
        const rr = w.id === 'LAUNCHER' ? 120 : 160;
        ctx.fillStyle = `rgba(${col},0.14)`; ctx.beginPath(); ctx.arc(d, 0, rr * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(${col},0.6)`; ctx.beginPath(); ctx.arc(d, 0, rr * 0.7, 0, Math.PI * 2); ctx.stroke();
    } else if (kind === 'boomer') {
        const range = 260 + 220 * ch;
        ctx.strokeStyle = `rgba(${col},0.55)`; ctx.lineWidth = 14; ctx.lineCap = 'round';
        ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(p.radius, 0); ctx.lineTo(range, 0); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(p.radius, 0); ctx.lineTo(range, 0); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(range, 0, 8, 0, Math.PI * 2); ctx.stroke();
    } else { // arc (cận chiến)
        let range = (w.type === 'SHIELD' ? 34 : w.range) + p.radius;
        if (w.id === 'HAMMER' && ch >= 0.9) range = p.radius + 40 + 140;
        const sp = w.id === 'CHAINSAW' ? 0.9 : 1.0;
        ctx.fillStyle = `rgba(${col},0.18)`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, range, -sp, sp); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(${col},0.55)`; ctx.lineWidth = 1.5; ctx.stroke();
        if (w.mode === 'charge' && ch > 0) { ctx.strokeStyle = `rgba(253,224,71,${0.4 + ch * 0.5})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, range * ch, -sp, sp); ctx.stroke(); }
    }
    if (cancel) { ctx.rotate(-ang); ctx.font = `700 13px ${FONT}`; ctx.fillStyle = '#ff6b6b'; ctx.textAlign = 'center'; ctx.fillText('HUỶ', 0, -p.radius - 26); }
    ctx.restore();
}

/** Thanh đạn chia ô dưới đầu (kiểu Brawl Stars) */
function drawAmmoBar(p, w, x, y, bw) {
    if (!w.magSize) return;
    const em = effMag(p, w);
    if (em > 12) { // súng liên thanh: một thanh liền
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, bw, 3);
        ctx.fillStyle = w.reloading ? '#94a3b8' : '#fb923c'; ctx.fillRect(x, y, bw * (w.reloading ? w.reloadT / w.reloadTime : w.mag / em), 3);
        return;
    }
    const gap = 2, seg = (bw - gap * (em - 1)) / em;
    for (let i = 0; i < em; i++) {
        const sx = x + i * (seg + gap);
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(sx, y, seg, 3);
        let k = i < w.mag ? 1 : 0;
        if (i === w.mag && (w.reloading || w.reloadMode === 'single')) k = Math.min(1, (w.reloadT || 0) / w.reloadTime);
        if (w.reloading && w.reloadMode !== 'single') k = i < w.mag ? 1 : (w.reloadT / w.reloadTime);
        ctx.fillStyle = i < w.mag ? '#fb923c' : '#94a3b8'; ctx.fillRect(sx, y, seg * k, 3);
    }
}

/** Đạn đặc biệt */
function drawSpecialBullet(b, now) {
    if (b.flame) {
        const k = Math.max(0, Math.min(1, b.life * 3));
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size);
        g.addColorStop(0, `rgba(255,240,180,${k})`); g.addColorStop(0.5, `rgba(251,146,60,${0.8 * k})`); g.addColorStop(1, 'rgba(220,38,38,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill();
        return true;
    }
    if (b.boomerang) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(now * 20);
        ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(-3, -11); ctx.quadraticCurveTo(6, 0, -3, 11); ctx.lineTo(2, 9); ctx.quadraticCurveTo(9, 0, 2, -9); ctx.closePath(); ctx.fill();
        ctx.restore(); return true;
    }
    if (b.net) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(now * 6);
        ctx.strokeStyle = '#f3f4f6'; ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-9, i * 5); ctx.lineTo(9, i * 5); ctx.moveTo(i * 5, -9); ctx.lineTo(i * 5, 9); ctx.stroke(); }
        ctx.restore(); return true;
    }
    if (b.arrow) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
        ctx.strokeStyle = b.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.fillStyle = '#f7fee7'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-3, -3); ctx.lineTo(-3, 3); ctx.fill();
        ctx.fillStyle = '#84cc16'; ctx.fillRect(-18, -2.5, 4, 5);
        ctx.restore(); return false; // vẫn vẽ vệt sáng
    }
    return false;
}

/** Bụi rậm: vẽ đè lên người chơi */
function drawBushes(now) {
    const me = localPlayer();
    bushes.forEach(b => {
        const mineInside = me && dist(me.x, me.y, b.x, b.y) < b.r;
        const anyInside = players.some(p => p.hp > 0 && dist(p.x, p.y, b.x, b.y) < b.r);
        const alpha = mineInside ? 0.45 : (localId() === null && anyInside) ? 0.7 : 0.95;
        const fade = b.t !== undefined ? Math.min(1, b.t / 1) : 1;
        ctx.globalAlpha = alpha * fade;
        const n = 7;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + b.seed, rr = b.r * 0.55;
            const sway = Math.sin(now * 1.5 + i + b.seed) * 2;
            ctx.fillStyle = i % 2 ? '#166534' : '#15803d';
            ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * rr + sway, b.y + Math.sin(a) * rr, b.r * 0.52, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.62, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(134,239,172,0.25)';
        for (let i = 0; i < 5; i++) { const a = i * 1.3 + b.seed; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * b.r * 0.4, b.y + Math.sin(a) * b.r * 0.4 - 4, b.r * 0.16, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
    });
}

/** Mìn định hướng, dây bẫy, vùng keo/hồi máu, hòm giả */
function drawTrapsExtra(now) {
    mines.forEach(m => {
        const me = localPlayer();
        const own = m.owner === localId();
        const seen = localId() === null || own || (me && me.saboteur && dist(me.x, me.y, m.x, m.y) < 160);
        if (!seen) return;
        ctx.globalAlpha = own || localId() === null ? (localId() === null ? 0.3 : 0.85) : 0.6;
        if (m.kind === 'claymore') {
            ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.angle);
            ctx.fillStyle = 'rgba(248,113,113,0.12)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 160, -0.7, 0.7); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#3f6212'; rrect(ctx, -6, -9, 10, 18, 3); ctx.fill(); ctx.strokeStyle = '#a3e635'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore();
        } else if (m.kind === 'wire') {
            ctx.strokeStyle = `rgba(248,113,113,${0.6 + Math.sin(now * 10) * 0.3})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x2, m.y2); ctx.stroke();
            ctx.fillStyle = '#ef4444'; [[m.x, m.y], [m.x2, m.y2]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); });
        } else if (localId() !== null && !own) { // bẫy gai địch (Kẻ Phá Hoại thấy)
            ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.x, m.y, 12, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
    });
    zones.forEach(z => {
        if (z.type === 'glue') {
            const k = Math.min(1, z.t / 0.5);
            ctx.fillStyle = `rgba(202,138,4,${0.35 * k})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(250,204,21,${0.25 * k})`;
            for (let i = 0; i < 6; i++) { const a = i + z.x * 0.01; ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * z.r * 0.5, z.y + Math.sin(a) * z.r * 0.5, z.r * 0.18, 0, Math.PI * 2); ctx.fill(); }
        } else if (z.type === 'heal') {
            ctx.strokeStyle = `rgba(74,222,128,${0.4 + Math.sin(now * 4) * 0.2})`; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -now * 20;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(74,222,128,0.08)'; ctx.fill();
            if (z.totem) { ctx.fillStyle = '#14532d'; ctx.fillRect(z.x - 4, z.y - 22, 8, 26); ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.arc(z.x, z.y - 24, 7 + Math.sin(now * 6), 0, Math.PI * 2); ctx.fill(); }
        }
    });
}

/** Cần ngắm trên màn cảm ứng (kéo nút đánh) */
function drawAimStick(side) {
    const a = aimStick[side]; if (!a) return;
    const dx = a.x - a.sx, dy = a.y - a.sy, d = Math.hypot(dx, dy);
    if (d < 12) return;
    ctx.save(); ctx.globalAlpha = 0.85;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(a.x, a.y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(a.x, a.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

/** Cảnh báo cho người bị ngắm: dải đỏ thu hẹp dần (thấy cả khi kẻ bắn khuất trong sương/bụi) */
function drawEnemyWarnings(now) {
    const me = localPlayer();
    if (!me || me.hp <= 0) return;
    players.forEach(p => {
        if (p.id === me.id || p.hp <= 0 || !(p.charge > 0)) return;
        const w = getCurrentWeapon(p); if (!w.narrow) return;
        const ch = p.charge, ang = p.aimAngle !== undefined ? p.aimAngle : p.angle;
        const range = w.id === 'SNIPER' ? 700 + 1200 * ch : w.id === 'BOW' ? 560 + 940 * ch : 1600;
        const d = dist(p.x, p.y, me.x, me.y);
        if (d > range + 40) return;
        const spread = spreadAt(w, ch), off = Math.abs(angleDiff(Math.atan2(me.y - p.y, me.x - p.x), ang));
        if (off > spread / 2 + 0.25) return; // không nằm trong đường ngắm
        const half = Math.max(5, range * Math.tan(Math.max(0.01, spread) / 2));
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
        const a = 0.18 + ch * 0.35 + (ch > 0.8 ? Math.sin(now * 30) * 0.12 : 0);
        ctx.fillStyle = `rgba(255,50,50,${a * 0.6})`;
        ctx.beginPath(); ctx.moveTo(p.radius, -5); ctx.lineTo(range, -half); ctx.lineTo(range, half); ctx.lineTo(p.radius, 5); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `rgba(255,80,80,${a + 0.2})`; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        if (ch > 0.5) floatTextOnce(me, '⚠ BỊ NGẮM!');
    });
}
function floatTextOnce(me, t) { if (world.time - (me.warnT || -9) > 1.5) { me.warnT = world.time; floatText(me.x, me.y - 40, t, '#ff6b6b', 14); } }
