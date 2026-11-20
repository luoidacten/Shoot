'use strict';
/* =====================================================================
 *  GIAO DIỆN BẢNG CHIẾN THUẬT: vỏ máy gồ ghề, màn hình hologram, lưới toạ độ phát sáng,
 *  bản đồ nét sáng, quét radar, điểm của bạn nhấp nháy, nút bấm phát sáng.
 *  tactical.js gọi tabletChrome() (trước phần xem trước mục tiêu) và tabletFooter() (sau cùng).
 * ===================================================================== */
const TAB_THEMES = {
    air:    { label: 'CHỈ HUY KHÔNG KÍCH', bez: ['#3a2f1d', '#1f1810', '#120d08'], scr: ['#1f1608', '#140d05', '#090502'], G: '251,191,36', deco: 'hazard', sweep: 'line' },
    smoke:  { label: 'TÁC CHIẾN KHÓI', bez: ['#323b47', '#1c232c', '#0e1217'], scr: ['#1b242e', '#131a22', '#0a0e13'], G: '186,198,214', deco: 'fog', sweep: 'line' },
    recon:  { label: 'TRINH SÁT · RADAR', bez: ['#16352a', '#0d2219', '#06130d'], scr: ['#04241b', '#031912', '#020d08'], G: '74,222,128', deco: 'rings', sweep: 'radar' },
    troop:  { label: 'HẬU CẦN & BỘ BINH', bez: ['#363c20', '#22260f', '#121507'], scr: ['#161c0b', '#0f1307', '#070903'], G: '190,242,100', deco: 'camo', sweep: 'line' },
    eng:    { label: 'CÔNG BINH · BẢN VẼ KỸ THUẬT', bez: ['#1e3a5f', '#13284a', '#0a1a33'], scr: ['#0d3f78', '#0a3466', '#072a52'], G: '219,234,254', deco: 'blueprint', sweep: 'none' },
    cell:   { label: 'LƯỚI Ô · KHOÁ TOẠ ĐỘ', bez: ['#3b1f3f', '#25122a', '#140818'], scr: ['#1d0b25', '#14071a', '#0a030d'], G: '232,121,249', deco: 'digits', sweep: 'line' },
    vision: { label: 'QUAN SÁT · TẦM NHÌN', bez: ['#3d3417', '#26200d', '#141106'], scr: ['#1d1a07', '#131105', '#090802'], G: '253,224,71', deco: 'rings', sweep: 'radar' },
    base:   { label: 'BẢNG CHIẾN THUẬT · TRỰC TUYẾN', bez: ['#2b3546', '#161e2b', '#0b111b'], scr: ['#08202c', '#061723', '#030d16'], G: '125,211,252', deco: null, sweep: 'line' }
};
const TAB_KIND = { airstrike: 'air', carpet: 'air', laser: 'air', napalm: 'air', arty: 'air', orbital: 'air', incend: 'air', cluster: 'air', sweep: 'air', markBomb: 'air', guideBomb: 'air',
    smokes: 'smoke', smokeCut: 'smoke', blanket: 'smoke', uav: 'recon', supply: 'troop', para: 'troop', markPara: 'troop', struct: 'eng',
    burnCell: 'cell', markCells: 'cell', gravCells: 'cell', cageCell: 'cell', enlight: 'vision', overlord: 'vision' };
const tabTheme = () => TAB_THEMES[TAB_KIND[picker && picker.kind] || 'base'];
function tabletChrome(me, R, T, W, H, now, open, full) {
    const X = x => R.x + x * R.k, Y = y => R.y + y * R.k, col = T.col, TH = tabTheme(), G = TH.G;
    // nền tối mờ phía sau
    const bg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7);
    bg.addColorStop(0, 'rgba(2,8,18,0.55)'); bg.addColorStop(1, 'rgba(0,2,8,0.82)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.translate(0, (1 - open) * 40);
    // ---- vỏ máy ----
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
    const bez = ctx.createLinearGradient(0, R.fy, 0, R.fy + R.fh); bez.addColorStop(0, TH.bez[0]); bez.addColorStop(0.5, TH.bez[1]); bez.addColorStop(1, TH.bez[2]);
    ctx.fillStyle = bez; rrect(ctx, R.fx, R.fy, R.fw, R.fh, 20); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#4b5a73'; ctx.lineWidth = 2.5; rrect(ctx, R.fx, R.fy, R.fw, R.fh, 20); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; rrect(ctx, R.fx + 3, R.fy + 3, R.fw - 6, R.fh - 6, 17); ctx.stroke();
    ctx.strokeStyle = hexA(col, 0.55 + 0.15 * Math.sin(now * 2)); ctx.lineWidth = 1.5; rrect(ctx, R.fx + 8, R.fy + 8, R.fw - 16, R.fh - 16, 13); ctx.stroke();
    // ốc vít 4 góc
    [[R.fx + 15, R.fy + 15], [R.fx + R.fw - 15, R.fy + 15], [R.fx + 15, R.fy + R.fh - 15], [R.fx + R.fw - 15, R.fy + R.fh - 15]].forEach(([x, y]) => {
        const g = ctx.createRadialGradient(x - 1, y - 1, 0.5, x, y, 4.5); g.addColorStop(0, '#cbd5e1'); g.addColorStop(1, '#334155');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 2.5, y - 2.5); ctx.lineTo(x + 2.5, y + 2.5); ctx.stroke();
    });
    // gờ bám hai bên
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 6; i++) { const y = R.fy + R.fh / 2 - 30 + i * 11; ctx.fillRect(R.fx + 4, y, 8, 3); ctx.fillRect(R.fx + R.fw - 12, y, 8, 3); }
    if (TH.deco === 'hazard') { // sọc cảnh báo vàng đen ở đáy vỏ
        ctx.save(); rrect(ctx, R.fx + 40, R.fy + R.fh - 8, R.fw - 80, 5, 2.5); ctx.clip();
        for (let x = R.fx + 30 + ((now * 20) % 14); x < R.fx + R.fw - 30; x += 14) { ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.moveTo(x, R.fy + R.fh - 3); ctx.lineTo(x + 7, R.fy + R.fh - 8); ctx.lineTo(x + 14, R.fy + R.fh - 8); ctx.lineTo(x + 7, R.fy + R.fh - 3); ctx.fill(); }
        ctx.restore();
    } else if (TH.deco === 'camo') { // rằn ri trên vỏ
        ctx.save(); rrect(ctx, R.fx, R.fy, R.fw, R.fh, 20); ctx.clip(); let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < 26; i++) { ctx.fillStyle = ['rgba(77,92,38,0.35)', 'rgba(40,48,20,0.4)', 'rgba(110,98,60,0.25)'][i % 3]; ctx.beginPath(); ctx.ellipse(R.fx + rnd() * R.fw, R.fy + (rnd() < 0.5 ? rnd() * 50 : R.fh - rnd() * 50), 20 + rnd() * 30, 8 + rnd() * 10, rnd() * 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
    }
    // ---- thanh tiêu đề ----
    const hy = R.fy + 12;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = Math.sin(now * 4) > 0 ? '#22c55e' : '#14532d'; ctx.beginPath(); ctx.arc(R.fx + 30, hy + 3, 3, 0, Math.PI * 2); ctx.fill(); // đèn trạng thái
    ctx.fillStyle = `rgb(${G})`; ctx.font = `700 9px ${FONT}`; ctx.fillText(TH.label, R.fx + 38, hy + 3); const lw = ctx.measureText(TH.label).width;
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i < 3 + (Math.sin(now * 1.3) > 0 ? 1 : 0) ? `rgb(${G})` : `rgba(${G},0.25)`; ctx.fillRect(R.fx + 48 + lw + i * 4, hy + 6 - i * 2.2, 2.5, 2 + i * 2.2); } // vạch sóng
    const tm = Math.max(0, world.time || 0), clock = `${String(Math.floor(tm / 60)).padStart(2, '0')}:${String(Math.floor(tm % 60)).padStart(2, '0')}`;
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(148,163,184,0.85)'; ctx.font = `700 9px ${FONT}`; ctx.fillText(`T+${clock}  ·  ${MAP_W}×${MAP_H}`, R.fx + R.fw - 30, hy + 3);
    // chip tên kỹ năng
    ctx.font = `800 14px ${FONT}`; ctx.textAlign = 'left';
    const tw = ctx.measureText(T.name).width + 26, ty = R.fy + 22;
    const tg = ctx.createLinearGradient(R.fx + 22, ty, R.fx + 22 + tw, ty); tg.addColorStop(0, hexA(col, 0.35)); tg.addColorStop(1, hexA(col, 0.08));
    ctx.fillStyle = tg; rrect(ctx, R.fx + 22, ty, tw, 19, 9.5); ctx.fill(); ctx.strokeStyle = hexA(col, 0.9); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#f8fafc'; ctx.fillText(T.name, R.fx + 35, ty + 10);
    // chip hướng dẫn bước
    const step = `▸ ${T.steps[Math.min(T.steps.length - 1, picker.pts.length)]}`;
    ctx.font = `700 11px ${FONT}`; const sw = ctx.measureText(step).width + 22, sx = R.fx + R.fw - 22 - sw;
    ctx.fillStyle = 'rgba(15,23,42,0.85)'; rrect(ctx, sx, ty, sw, 19, 9.5); ctx.fill();
    ctx.strokeStyle = hexA(col, 0.4 + 0.3 * Math.sin(now * 5)); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#e2e8f0'; ctx.fillText(step, sx + 11, ty + 10);
    // ---- màn hình ----
    const scr = ctx.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h); scr.addColorStop(0, TH.scr[0]); scr.addColorStop(0.55, TH.scr[1]); scr.addColorStop(1, TH.scr[2]);
    ctx.fillStyle = scr; ctx.fillRect(R.x, R.y, R.w, R.h);
    // lưới phụ (mỗi 100) và lưới ô (mỗi 400)
    const cell = 400, cols = Math.ceil(MAP_W / cell), rows = Math.ceil(MAP_H / cell);
    ctx.strokeStyle = `rgba(${G},${TH.deco === 'blueprint' ? 0.12 : 0.05})`; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 100; x < MAP_W; x += 100) { ctx.moveTo(X(x), R.y); ctx.lineTo(X(x), R.y + R.h); }
    for (let y = 100; y < MAP_H; y += 100) { ctx.moveTo(R.x, Y(y)); ctx.lineTo(R.x + R.w, Y(y)); }
    ctx.stroke();
    ctx.strokeStyle = `rgba(${G},${TH.deco === 'blueprint' ? 0.45 : 0.22})`; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i < cols; i++) { ctx.moveTo(X(i * cell), R.y); ctx.lineTo(X(i * cell), R.y + R.h); }
    for (let j = 1; j < rows; j++) { ctx.moveTo(R.x, Y(j * cell)); ctx.lineTo(R.x + R.w, Y(j * cell)); }
    ctx.stroke();
    // dấu + tại giao điểm
    ctx.strokeStyle = `rgba(${G},0.45)`; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i < cols; i++) for (let j = 1; j < rows; j++) { const x = X(i * cell), y = Y(j * cell); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); }
    ctx.stroke();
    // nhãn trục (chip nhỏ ngoài màn hình)
    ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < cols; i++) { const cx = X(Math.min(MAP_W, i * cell + cell / 2)); if (cx > R.x + R.w) continue; ctx.fillStyle = `rgba(${G},0.14)`; rrect(ctx, cx - 7, R.y - 12, 14, 10, 3); ctx.fill(); ctx.fillStyle = `rgb(${G})`; ctx.fillText(String.fromCharCode(65 + i), cx, R.y - 7); }
    for (let j = 0; j < rows; j++) { const cy = Y(Math.min(MAP_H, j * cell + cell / 2)); if (cy > R.y + R.h) continue; ctx.fillStyle = `rgba(${G},0.14)`; rrect(ctx, R.x - 15, cy - 5, 12, 10, 3); ctx.fill(); ctx.fillStyle = `rgb(${G})`; ctx.fillText(String(j + 1), R.x - 9, cy); }
    // ---- nội dung (cắt trong màn hình) ----
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    // tên ô mờ ở góc mỗi ô
    ctx.fillStyle = `rgba(${G},0.18)`; ctx.font = `700 ${Math.max(7, Math.round(cell * R.k * 0.09))}px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) ctx.fillText(`${String.fromCharCode(65 + i)}${j + 1}`, X(i * cell) + 3, Y(j * cell) + 3);
    if (TH.deco === 'fog') { for (let i = 0; i < 7; i++) { const fx = R.x + ((i * 0.37 + now * 0.02 * (1 + i % 3)) % 1.2 - 0.1) * R.w, fy = R.y + (0.15 + (i * 0.29) % 0.75) * R.h, fr = R.w * (0.12 + (i % 3) * 0.04); const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr); g.addColorStop(0, 'rgba(203,213,225,0.10)'); g.addColorStop(1, 'rgba(203,213,225,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill(); } }
    if (TH.deco === 'rings') { ctx.strokeStyle = `rgba(${G},0.10)`; ctx.lineWidth = 1; for (let rr = 400; rr < 3000; rr += 400) { ctx.beginPath(); ctx.arc(X(me.x), Y(me.y), rr * R.k, 0, Math.PI * 2); ctx.stroke(); } }
    if (TH.deco === 'blueprint') { ctx.fillStyle = 'rgba(219,234,254,0.5)'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(`BV-${String(Math.floor(MAP_W / 10)).padStart(4, '0')} · TỈ LỆ 1:${Math.round(1 / R.k)}`, R.x + R.w - 8, R.y + R.h - 6); ctx.strokeStyle = 'rgba(219,234,254,0.35)'; ctx.strokeRect(R.x + R.w - 150, R.y + R.h - 22, 144, 18); }
    if (TH.deco === 'digits') { ctx.fillStyle = `rgba(${G},0.07)`; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; for (let c2 = 0; c2 < 14; c2++) { const xx = R.x + 8 + c2 * (R.w / 14), off = (now * 30 + c2 * 47) % (R.h + 60); for (let k2 = 0; k2 < 6; k2++) ctx.fillText(((c2 * 7 + k2 * 3 + Math.floor(now * 4)) % 2).toString(), xx, R.y + off - k2 * 11 - 30); } }
    if (full) {
        const z = world.zone;
        if (z && z.r) { // ngoài vòng bo: tô tím mờ
            ctx.save(); ctx.fillStyle = 'rgba(126,34,206,0.16)'; ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.arc(X(z.x), Y(z.y), z.r * R.k, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore();
            ctx.strokeStyle = 'rgba(96,165,250,0.95)'; ctx.lineWidth = 2; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -now * 12; ctx.beginPath(); ctx.arc(X(z.x), Y(z.y), z.r * R.k, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        }
        bushes.forEach(b => { // bụi: hình tròn có gạch chéo
            const x = X(b.x), y = Y(b.y), r = Math.max(2, b.r * R.k);
            ctx.fillStyle = 'rgba(34,197,94,0.22)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(74,222,128,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let d = -r; d < r; d += 4) { ctx.moveTo(x + d, y - r); ctx.lineTo(x + d + r, y + r); } ctx.stroke(); ctx.restore();
            ctx.strokeStyle = 'rgba(74,222,128,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
        });
        obstacles.forEach(o => {
            if (o.energy) return;
            const x = X(o.x), y = Y(o.y), w = Math.max(1.5, o.w * R.k), h = Math.max(1.5, o.h * R.k);
            if (o.wood) { ctx.fillStyle = 'rgba(217,119,6,0.55)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(251,191,36,0.85)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
            else { ctx.fillStyle = o.ice ? 'rgba(125,211,252,0.45)' : 'rgba(148,163,184,0.35)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = o.ice ? '#bae6fd' : 'rgba(226,232,240,0.9)'; ctx.lineWidth = 1.2; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
        });
        crates.forEach(c => { if (c.type === 'TRAP' || c.type === 'FAKE') return; ctx.fillStyle = c.type === 'LEGEND' ? '#facc15' : c.type === 'SUPPORT' ? '#4ade80' : '#fb923c'; ctx.beginPath(); ctx.moveTo(X(c.x), Y(c.y) - 3.5); ctx.lineTo(X(c.x) + 3.5, Y(c.y)); ctx.lineTo(X(c.x), Y(c.y) + 3.5); ctx.lineTo(X(c.x) - 3.5, Y(c.y)); ctx.closePath(); ctx.fill(); });
        players.forEach(q => {
            if (!(q.hp > 0) || q === me || !(sameTeam(me, q) || targetable(me, q) || isSpotted(q, me.id))) return;
            const x = X(q.x), y = Y(q.y), ally = sameTeam(me, q);
            ctx.fillStyle = hexA(q.color, 0.25); ctx.beginPath(); ctx.arc(x, y, 9 + Math.sin(now * 6) * 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = q.color; ctx.beginPath(); if (ally) ctx.arc(x, y, 4.5, 0, Math.PI * 2); else { ctx.moveTo(x, y - 6); ctx.lineTo(x + 5.5, y + 4); ctx.lineTo(x - 5.5, y + 4); ctx.closePath(); } ctx.fill();
            ctx.strokeStyle = '#020617'; ctx.lineWidth = 1.5; ctx.stroke();
        });
        pings.forEach(pg => { const a = pg.life / pg.maxLife; ctx.strokeStyle = `rgba(248,113,113,${0.8 * a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X(pg.x), Y(pg.y), 4 + (1 - a) * 9, 0, Math.PI * 2); ctx.stroke(); });
    }
    if (TH.sweep === 'radar') { // tia quét xoay quanh vị trí của bạn
        const ang = (now * 1.6) % (Math.PI * 2), mx0 = X(me.x), my0 = Y(me.y), RR = Math.hypot(R.w, R.h);
        for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(${G},${0.11 * (1 - i / 14)})`; ctx.beginPath(); ctx.moveTo(mx0, my0); ctx.arc(mx0, my0, RR, ang - (i + 1) * 0.045, ang - i * 0.045); ctx.closePath(); ctx.fill(); }
        ctx.strokeStyle = `rgba(${G},0.6)`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx0, my0); ctx.lineTo(mx0 + Math.cos(ang) * RR, my0 + Math.sin(ang) * RR); ctx.stroke();
    } else if (TH.sweep === 'line') {
        const sweep = (now * 0.45) % 1.15, sx2 = R.x + R.w * sweep;
        const sg = ctx.createLinearGradient(sx2 - 90, 0, sx2, 0); sg.addColorStop(0, `rgba(${G},0)`); sg.addColorStop(1, `rgba(${G},0.16)`);
        ctx.fillStyle = sg; ctx.fillRect(sx2 - 90, R.y, 90, R.h);
        ctx.fillStyle = `rgba(${G},0.55)`; ctx.fillRect(sx2 - 1, R.y, 1.5, R.h);
    }
    // bạn: vòng toả + nón nhìn + mũi tên
    const mx = X(me.x), my = Y(me.y), pulse = (now * 1.2) % 1;
    ctx.strokeStyle = hexA(me.color, 0.6 * (1 - pulse)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, 6 + pulse * 22, 0, Math.PI * 2); ctx.stroke();
    const cg = ctx.createRadialGradient(mx, my, 0, mx, my, 34); cg.addColorStop(0, hexA(me.color, 0.35)); cg.addColorStop(1, hexA(me.color, 0));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(mx, my); ctx.arc(mx, my, 34, me.angle - 0.5, me.angle + 0.5); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(mx, my); ctx.rotate(me.angle);
    ctx.fillStyle = me.color; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#e2e8f0'; ctx.font = `700 8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('BẠN', mx, my + 9);
    // ngoặc góc màn hình
    ctx.strokeStyle = hexA(col, 0.8); ctx.lineWidth = 2;
    [[R.x, R.y, 1, 1], [R.x + R.w, R.y, -1, 1], [R.x, R.y + R.h, 1, -1], [R.x + R.w, R.y + R.h, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x + sx * 18, y + sy * 2); ctx.lineTo(x + sx * 2, y + sy * 2); ctx.lineTo(x + sx * 2, y + sy * 18); ctx.stroke(); });
    // la bàn + thước tỉ lệ
    const ccx = R.x + R.w - 26, ccy = R.y + 26;
    ctx.fillStyle = 'rgba(2,6,23,0.6)'; ctx.beginPath(); ctx.arc(ccx, ccy, 15, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(${G},0.6)`; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#f87171'; ctx.beginPath(); ctx.moveTo(ccx, ccy - 11); ctx.lineTo(ccx + 3.5, ccy); ctx.lineTo(ccx - 3.5, ccy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(ccx, ccy + 11); ctx.lineTo(ccx + 3.5, ccy); ctx.lineTo(ccx - 3.5, ccy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e2e8f0'; ctx.font = `700 7px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('B', ccx, ccy - 20);
    const L = 400 * R.k, bx = R.x + 12, by = R.y + R.h - 12;
    ctx.strokeStyle = 'rgba(226,232,240,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by); ctx.lineTo(bx + L, by); ctx.lineTo(bx + L, by - 4); ctx.stroke();
    ctx.fillStyle = 'rgba(226,232,240,0.85)'; ctx.font = `700 8px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('1 Ô = 400', bx + L / 2, by - 3);
    // vạch quét màn hình + lóa kính
    if (TH.deco !== 'blueprint') { ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = R.y; y < R.y + R.h; y += 3) ctx.fillRect(R.x, y, R.w, 1); }
    const gl = ctx.createLinearGradient(R.x, R.y, R.x + R.w * 0.6, R.y + R.h * 0.6); gl.addColorStop(0, 'rgba(255,255,255,0.06)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(R.x, R.y, R.w, R.h);
    const vg = ctx.createRadialGradient(R.x + R.w / 2, R.y + R.h / 2, Math.min(R.w, R.h) * 0.35, R.x + R.w / 2, R.y + R.h / 2, Math.max(R.w, R.h) * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = vg; ctx.fillRect(R.x, R.y, R.w, R.h);
    ctx.textBaseline = 'middle';
    // (vùng cắt còn mở: phần xem trước mục tiêu vẽ tiếp rồi tactical.js gọi ctx.restore())
}
function tabletFooter(R, T, pts, full, now) {
    const btn = (b, label, c0, c1, fg, glow) => {
        ctx.save();
        if (glow) { ctx.shadowColor = c1; ctx.shadowBlur = 12; }
        const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); g.addColorStop(0, c0); g.addColorStop(1, c1);
        ctx.fillStyle = g; rrect(ctx, b.x, b.y, b.w, b.h, b.h / 2); ctx.fill(); ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; rrect(ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, b.h / 2 - 1); ctx.stroke();
        ctx.fillStyle = fg; ctx.font = `800 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
    };
    btn(R.cancel, '✖ HUỶ', '#b91c1c', '#7f1d1d', '#fee2e2', false);
    if (T.multi) btn(R.ok, `✔ XÁC NHẬN ${pts.length}/${T.need}`, pts.length ? '#16a34a' : '#475569', pts.length ? '#14532d' : '#1e293b', '#ecfdf5', pts.length > 0);
    ctx.fillStyle = 'rgba(148,163,184,0.8)'; ctx.font = `600 10px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(full ? '🗺 Bản Đồ Nhỏ: hiện tường, bụi, hòm, vòng bo, địch, tiếng động' : '◌ Bản đồ tĩnh: chỉ thấy vị trí của bạn (lợi thế Bản Đồ Nhỏ hiện thêm)', R.fx + 24, R.fy + R.fh - 23);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 5; i++) ctx.fillRect(R.fx + R.fw / 2 - 22 + i * 10, R.fy + R.fh - 9, 6, 2); // loa
}

/* ============================== HIỂN THỊ TÁC DỤNG TRÊN BẢNG ============================== */
function tabPreview(R, T, pts, h, col, now, open) {
    const X = x => R.x + x * R.k, Y = y => R.y + y * R.k, c7 = col.length === 7 ? col : '#fbbf24';
    const label = (x, y, txt) => { ctx.font = `700 9px ${FONT}`; const w = ctx.measureText(txt).width + 8; ctx.fillStyle = 'rgba(2,6,23,0.85)'; rrect(ctx, x - w / 2, y - 6, w, 12, 4); ctx.fill(); ctx.strokeStyle = hexA(c7, 0.8); ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#f8fafc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 0.5); };
    // vùng tác dụng: lõi đậm, vòng ngoài đứt quãng xoay, vạch chia, nhãn bán kính
    const area = (q, r, ghost) => {
        const x = X(q.x), y = Y(q.y), rr = Math.max(4, r * R.k), pulse = ghost ? 0.6 + 0.4 * Math.sin(now * 7) : 1;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, hexA(c7, 0.38 * pulse)); g.addColorStop(0.7, hexA(c7, 0.16 * pulse)); g.addColorStop(1, hexA(c7, 0.05));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(x, y); ctx.rotate(now * (ghost ? 1.2 : 0.5));
        ctx.strokeStyle = hexA(c7, ghost ? 0.7 : 1); ctx.lineWidth = 2; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(rr - 6, 0); ctx.lineTo(rr + 4, 0); ctx.stroke(); }
        ctx.restore();
        ctx.strokeStyle = hexA(c7, 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, rr * 0.5, 0, Math.PI * 2); ctx.stroke();
        if (!ghost && rr > 18) label(x, y - rr - 9, `R ${Math.round(r)}`);
    };
    // ghim đánh dấu: hình giọt nước có bóng
    const pin = (q, txt) => {
        const x = X(q.x), y = Y(q.y);
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(x, y - 2);
        const g = ctx.createLinearGradient(0, -22, 0, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, c7); g.addColorStop(1, hexA(c7, 0.85));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-9, -10, -10, -16, -10, -19); ctx.arc(0, -19, 10, Math.PI, 0); ctx.bezierCurveTo(10, -16, 9, -10, 0, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.3; ctx.stroke();
        ctx.fillStyle = '#0b1020'; ctx.font = `800 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, -19);
        ctx.restore();
    };
    // hành lang có mũi tên chạy theo hướng
    const corridor = (ax, ay, bx, by, wpx, solid) => {
        const L = Math.hypot(bx - ax, by - ay); if (L < 2) return; const a = Math.atan2(by - ay, bx - ax);
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
        const g = ctx.createLinearGradient(0, -wpx / 2, 0, wpx / 2); g.addColorStop(0, hexA(c7, 0.08)); g.addColorStop(0.5, hexA(c7, solid ? 0.32 : 0.2)); g.addColorStop(1, hexA(c7, 0.08));
        ctx.fillStyle = g; ctx.fillRect(0, -wpx / 2, L, wpx);
        ctx.strokeStyle = hexA(c7, 0.85); ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now * 30;
        ctx.beginPath(); ctx.moveTo(0, -wpx / 2); ctx.lineTo(L, -wpx / 2); ctx.moveTo(0, wpx / 2); ctx.lineTo(L, wpx / 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = hexA(c7, 0.9); ctx.lineWidth = 2;
        for (let d = (now * 60) % 22; d < L - 4; d += 22) { ctx.beginPath(); ctx.moveTo(d - 4, -4); ctx.lineTo(d + 1, 0); ctx.lineTo(d - 4, 4); ctx.stroke(); }
        ctx.restore();
    };
    const plane = (x, y, a, s = 1) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.fillStyle = c7; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-2, -2); ctx.lineTo(-4, -10); ctx.lineTo(-7, -10); ctx.lineTo(-6, -2); ctx.lineTo(-10, -2); ctx.lineTo(-12, -5); ctx.lineTo(-13, -5); ctx.lineTo(-12, 0); ctx.lineTo(-13, 5); ctx.lineTo(-12, 5); ctx.lineTo(-10, 2); ctx.lineTo(-6, 2); ctx.lineTo(-7, 10); ctx.lineTo(-4, 10); ctx.lineTo(-2, 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
    if (T.r) {
        pts.forEach((q, i) => { area(q, T.r, false); pin(q, String(i + 1)); });
        if (h && pts.length < T.need) area(h, T.r, true);
        if (T.need > 1) label(R.x + R.w / 2, R.y + 12, `ĐÃ CHỌN ${pts.length}/${T.need}`);
    } else if (T.dir) {
        if (pts[0]) {
            const a0 = pts[0], dir = h ? Math.atan2(h.y - a0.y, h.x - a0.x) : 0, Lm = Math.hypot(MAP_W, MAP_H);
            ctx.strokeStyle = hexA(c7, 0.35); ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
            ctx.beginPath(); ctx.moveTo(X(a0.x - Math.cos(dir) * Lm), Y(a0.y - Math.sin(dir) * Lm)); ctx.lineTo(X(a0.x + Math.cos(dir) * Lm), Y(a0.y + Math.sin(dir) * Lm)); ctx.stroke(); ctx.setLineDash([]);
            corridor(X(a0.x - Math.cos(dir) * 300), Y(a0.y - Math.sin(dir) * 300), X(a0.x + Math.cos(dir) * 300), Y(a0.y + Math.sin(dir) * 300), Math.max(8, 210 * R.k), true);
            pin(a0, '✕');
            if (h) { plane(X(a0.x + Math.cos(dir) * 330), Y(a0.y + Math.sin(dir) * 330), dir, 1.1); label(X(a0.x), Y(a0.y) + 12, 'VÙNG RẢI BOM 600'); }
        } else if (h) area(h, 40, true);
    } else if (T.line) {
        if (pts[0]) {
            const b = h ? clampLen(pts[0], h, T.line) : null;
            if (b) {
                corridor(X(pts[0].x), Y(pts[0].y), X(b.x), Y(b.y), Math.max(8, 90 * R.k), true);
                pin(b, 'B');
                const len = Math.round(Math.hypot(b.x - pts[0].x, b.y - pts[0].y));
                label((X(pts[0].x) + X(b.x)) / 2, (Y(pts[0].y) + Y(b.y)) / 2 - Math.max(8, 45 * R.k) - 8, `${len} / ${T.line}`);
            }
            pin(pts[0], 'A');
        } else if (h) area(h, 40, true);
    }
    // tâm ngắm: 4 ngoặc góc xoay + toạ độ ô
    if (h) {
        const hx = X(h.x), hy = Y(h.y), s = 11 + Math.sin(now * 6) * 1.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.6;
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(Math.PI / 4 * Math.sin(now * 0.8) * 0.2);
        [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a * s, b * (s - 5)); ctx.lineTo(a * s, b * s); ctx.lineTo(a * (s - 5), b * s); ctx.stroke(); });
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        const cx = Math.floor(Math.max(0, Math.min(MAP_W - 1, h.x)) / 400), cy = Math.floor(Math.max(0, Math.min(MAP_H - 1, h.y)) / 400);
        label(hx + 26, hy - 16, `${String.fromCharCode(65 + cx)}${cy + 1}`);
    }
}
