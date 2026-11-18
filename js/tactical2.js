/** ==================== BẢNG CHIẾN THUẬT (phần 2) ====================
 *  Lính Nhảy Dù · Đợt Càn · Cấu Trúc Hoá Chiến Thuật (vẽ tường) · 3 vũ khí đánh dấu (dùng dần)
 *  Lợi thế Bản Đồ Chiến Thuật · Tiếng ồn khi mở bảng + 5 nâng cấp · Khói + Bom Độc · Kỹ Thuật Cao theo từng vũ khí
 *  Vũ khí nhảy: tổng thời gian tối đa 0.75 giây. Nạp sau tactical.js.
 */

/* ============================== LOẠI MỤC TIÊU MỚI ============================== */
Object.assign(TAC, {
    para:      { name: '🪂 LÍNH NHẢY DÙ', need: 1, r: 90, col: '#84cc16', steps: ['CHẠM ĐIỂM THẢ 3 LÍNH DÙ'] },
    sweep:     { name: '🌊 ĐỢT CÀN', need: 2, line: 1100, col: '#f43f5e', steps: ['CHẠM ĐIỂM BẮT ĐẦU', 'CHẠM ĐIỂM KẾT THÚC (tối đa 1100)'] },
    struct:    { name: '🧱 CẤU TRÚC HOÁ CHIẾN THUẬT', draw: true, multi: true, need: 1, ink: 900, col: '#94a3b8', steps: ['KÉO NGÓN TAY ĐỂ VẼ TƯỜNG · XONG BẤM XÁC NHẬN'] },
    markBomb:  { name: '🎯 THẢ BOM ĐÁNH DẤU', need: 3, multi: true, r: 110, col: '#ef4444', steps: ['CHẠM 1–3 ĐIỂM · BẤM XÁC NHẬN (dùng dần cũng được)'] },
    markPara:  { name: '🪖 THẢ LÍNH ĐÁNH DẤU', need: 3, multi: true, r: 70, col: '#a3e635', steps: ['CHẠM 1–3 ĐIỂM · BẤM XÁC NHẬN (dùng dần cũng được)'] },
    guideBomb: { name: '🧭 THẢ BOM ĐỊNH HƯỚNG', draw: true, multi: true, need: 1, ink: 1000, col: '#fb923c', steps: ['KÉO ĐỂ VẼ ĐƯỜNG BOM · XONG BẤM XÁC NHẬN'] }
});
const tacT = () => { const T = TAC[picker.kind] || TAC.carpet; return picker.need ? { ...T, need: picker.need } : T; };
const BRK = { x: -1, y: -1 }; // ngắt nét vẽ
const isBrk = q => q.x < 0 && q.y < 0;
function inkUsed(pts) { let s = 0; for (let i = 1; i < pts.length; i++) if (!isBrk(pts[i]) && !isBrk(pts[i - 1])) s += dist(pts[i].x, pts[i].y, pts[i - 1].x, pts[i - 1].y); return s; }
function strokes(pts) { const out = []; let cur = []; (pts || []).forEach(q => { if (isBrk(q)) { if (cur.length) out.push(cur); cur = []; } else cur.push(q); }); if (cur.length) out.push(cur); return out; }
function alongStrokes(pts, step, fn) { // gọi fn(x, y, i) mỗi `step` đơn vị dọc các nét
    let i = 0;
    strokes(pts).forEach(st => {
        if (st.length === 1) { fn(st[0].x, st[0].y, i++); return; }
        let carry = 0;
        for (let k = 1; k < st.length; k++) {
            const a = st[k - 1], b = st[k], L = dist(a.x, a.y, b.x, b.y);
            for (let d = carry; d <= L; d += step) { const t = L ? d / L : 0; fn(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, i++); carry = d + step - L; }
        }
    });
}

/* ============================== TIẾNG ỒN KHI MỞ BẢNG (rất lớn!) ============================== */
defP('silentTab', '📵', 'Bảng Cách Âm', 'Mở bảng chiến thuật chỉ phát tiếng nhỏ: vùng nghe thấy hẹp hơn 65% và lộ vị trí ngắn hơn.', p => {});
defP('decoySignal', '📻', 'Tín Hiệu Mồi', 'Tiếng của bảng chiến thuật phát ra ở một điểm giả cách bạn ~450. Địch không thấy vị trí thật.', p => {});
defP('eavesdrop', '👂', 'Máy Nghe Lén', 'Khi địch mở bảng chiến thuật, bạn thấy vị trí của họ 4 giây ở mọi khoảng cách.', p => {});
defP('satLink', '🛰️', 'Liên Kết Vệ Tinh', 'Bảng chiến thuật hiện đầy đủ như Bản Đồ Nhỏ: tường, bụi, vòng bo, địch, tiếng động.', p => {});
defP('quickLink', '⚡', 'Đường Truyền Nhanh', 'Mọi kỹ năng dùng bảng chiến thuật hồi chiêu nhanh hơn 20%.', p => {});
function tacNoise(p) {
    if (!p || p.hp <= 0) return;
    let lv = 1; if (has(p, 'silentTab')) lv *= 0.35; if (p.adv === 'tacMap') lv *= 0.5;
    const R = 1500 * lv, T = Math.max(0.5, 2 * lv), fake = has(p, 'decoySignal');
    let sx = p.x, sy = p.y;
    if (fake) { const a = Math.random() * 6.28; sx = Math.max(40, Math.min(MAP_W - 40, p.x + Math.cos(a) * 450)); sy = Math.max(40, Math.min(MAP_H - 40, p.y + Math.sin(a) * 450)); }
    enemiesOf(p).forEach(q => {
        if (has(q, 'eavesdrop')) { spotFor(p, q.id, 4); return; }
        if (!fake && dist(p.x, p.y, q.x, q.y) < R) spotFor(p, q.id, T);
    });
    AudioSys.playAt('alarm', sx, sy, 0.25 + 0.55 * lv, Math.max(500, R));
    if (lv > 0.4) { ring(sx, sy, 10, 160 * lv, '#fbbf24', 0.6, 3); floatText(sx, sy - 52, '📟 BẢNG CHIẾN THUẬT!', '#fbbf24', 12); }
}
const _openPicker17 = openPicker;
openPicker = function (src, slot, kind) {
    _openPicker17(src, slot, kind);
    const me = localPlayer(), T = TAC[kind] || {};
    if (src === 'weapon' && me) { const w = getCurrentWeapon(me); if (kind === 'markBomb' || kind === 'markPara') picker.need = Math.max(1, Math.min(3, w.mag)); if (kind === 'guideBomb') picker.ink = Math.max(0, w.mag) * 5; }
    if (T.draw && !picker.ink) picker.ink = T.ink * (me && has(me, 'bigPayload') ? 1.3 : 1);
    AudioSys.play('alarm', has(me, 'silentTab') ? 0.15 : 0.55); // bạn nghe rất to — địch cũng vậy
    if (net.role === 'guest') netSend({ t: 'tabOpen' }); else tacNoise(me);
};
const _onHostData17 = onHostData;
onHostData = function (g, m) { if (m && m.t === 'tabOpen') { tacNoise(players.find(q => q.id === g.id)); return; } return _onHostData17(g, m); };
// bot không mở bảng → phát tiếng khi gọi
const _castSkill17 = castSkill;
castSkill = function (p, slot, dir) {
    const s = p.skills && p.skills[slot], c = s && CARDS[s.id];
    if (c && c.picker && !p.pickTarget && s.cd <= 0) tacNoise(p);
    return _castSkill17(p, slot, dir);
};
const _skillCd17t = skillCooldown;
skillCooldown = function (p, id) { let cd = _skillCd17t(p, id); if (CARDS[id] && CARDS[id].picker && has(p, 'quickLink')) cd *= 0.8; return cd; };
// guest gửi được đường vẽ dài
const _onHostData17b = onHostData;
onHostData = function (g, m) {
    if (m && m.t === 'tgt' && Array.isArray(m.pts) && m.pts.length > 3 && Array.isArray(m.a) && Array.isArray(m.b)) {
        const p = players.find(q => q.id === g.id), pts = m.pts.slice(0, 160).map(q => ({ x: +q[0], y: +q[1] }));
        execTarget(p, m.src === 'weapon' ? 'weapon' : 'skill', +m.slot || 0, { x: +m.a[0], y: +m.a[1] }, { x: +m.b[0], y: +m.b[1] }, pts); return;
    }
    return _onHostData17b(g, m);
};

/* ============================== CHỌN / VẼ TRÊN BẢNG ============================== */
pickerTap = function (cx, cy) {
    const pt = pickerPoint(cx, cy), T = tacT();
    if (pt === 'cancel') { picker = null; AudioSys.play('ui'); return true; }
    if (pt === 'frame') return true;
    if (pt === 'ok') { if (picker.pts.some(q => !isBrk(q))) finishTac(); return true; }
    if (!pt) return false;
    if (T.draw) { if (picker.pts.length) picker.pts.push(BRK); if (inkUsed(picker.pts) < picker.ink) picker.pts.push(pt); picker.drawing = true; AudioSys.play('tick', 0.25); return true; }
    let q = pt;
    if (T.line && picker.pts.length === 1) q = clampLen(picker.pts[0], pt, T.line);
    picker.pts.push(q); AudioSys.play('tick', 0.35);
    if (picker.pts.length >= T.need) finishTac();
    return true;
};
function drawMove(e) {
    if (!picker || !picker.drawing) return;
    const t = e.changedTouches ? e.changedTouches[0] : e, q = pickerPoint(t.clientX, t.clientY);
    if (!q || typeof q !== 'object') return;
    if (e.cancelable) e.preventDefault(); e.stopPropagation();
    const pts = picker.pts, last = pts[pts.length - 1];
    if (!last || isBrk(last)) { pts.push(q); return; }
    const d = dist(last.x, last.y, q.x, q.y), left = picker.ink - inkUsed(pts);
    if (d < 22 || left <= 0 || pts.length > 150) return;
    pts.push(d > left ? clampLen(last, q, left) : q);
}
function drawUp() { if (picker) picker.drawing = false; }
window.addEventListener('mousemove', drawMove, { capture: true });
window.addEventListener('touchmove', drawMove, { capture: true, passive: false });
window.addEventListener('mouseup', drawUp, { capture: true });
window.addEventListener('touchend', drawUp, { capture: true });
const _drawPicker17 = drawPicker;
drawPicker = function (me, W, H, now) {
    const k = picker.kind, T0 = TAC[k], adv = me.adv;
    if (picker.need && T0) TAC[k] = { ...T0, need: picker.need };
    if (adv === 'tacMap' || has(me, 'satLink') || has(me, 'miniMapCard')) me.adv = 'minimap';
    try { _drawPicker17(me, W, H, now); } finally { TAC[k] = T0; me.adv = adv; }
    if (!T0 || !T0.draw) return;
    const R = pickerRect(), X = x => R.x + x * R.k, Y = y => R.y + y * R.k, used = inkUsed(picker.pts);
    ctx.save();
    ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strokes(picker.pts).forEach(st => {
        ctx.strokeStyle = hexA(T0.col, 0.35); ctx.lineWidth = Math.max(6, (k === 'struct' ? 36 : 85) * R.k * 2);
        ctx.beginPath(); st.forEach((q, i) => i ? ctx.lineTo(X(q.x), Y(q.y)) : ctx.moveTo(X(q.x), Y(q.y))); ctx.stroke();
        ctx.strokeStyle = T0.col; ctx.lineWidth = 3; ctx.stroke();
        if (st.length === 1) { ctx.fillStyle = T0.col; ctx.beginPath(); ctx.arc(X(st[0].x), Y(st[0].y), 4, 0, Math.PI * 2); ctx.fill(); }
    });
    ctx.restore();
    // thanh mực
    const bx = R.fx + 22, by = R.fy + R.fh - 40, bw = 220;
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; rrect(ctx, bx, by, bw, 8, 4); ctx.fill();
    ctx.fillStyle = T0.col; rrect(ctx, bx, by, bw * Math.max(0, 1 - used / Math.max(1, picker.ink)), 8, 4); ctx.fill();
    ctx.fillStyle = '#e2e8f0'; ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(k === 'guideBomb' ? `ĐIỆN LƯỢNG: ${Math.ceil((picker.ink - used) / 5)}/${Math.round(picker.ink / 5)}` : `VẬT LIỆU: ${Math.round(picker.ink - used)}/${Math.round(picker.ink)}`, bx + bw + 10, by + 4);
    const b = R.ok, has1 = picker.pts.some(q => !isBrk(q));
    ctx.fillStyle = has1 ? '#166534' : '#334155'; rrect(ctx, b.x, b.y, b.w, b.h, 9); ctx.fill();
    ctx.fillStyle = '#dcfce7'; ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('✔ XÁC NHẬN', b.x + b.w / 2, b.y + b.h / 2 + 1);
};

/* ============================== LÍNH DÙ ============================== */
SUMMON.para = { label: 'LÍNH DÙ', icon: '🪖', hp: 40, r: 12, sp: 150, t: 10, shoot: 4, rate: 0.7, range: 340 };
SM_BY_LABEL['LÍNH DÙ'] = 'para'; KIND_BY_LABEL['LÍNH DÙ'] = 'sm';
function paraDrop(p, x, y, n) {
    const warn = strikeWarnT(p, 1.3);
    for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, r = n > 1 ? 45 : 0, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        zones.push({ type: 'artyWarn', x: px, y: py, r: 26, t: warn, maxT: warn, owner: p.id, tick: 0 });
        strikes.push({ kind: 'paraLand', owner: p.id, x: px, y: py, t: warn + i * 0.15 });
    }
    AudioSys.playAt('whoosh', x, y, 0.4, 2500);
}
const _updateSummons17 = updateSummons;
updateSummons = function (dt) {
    const paras = decoys.filter(d => d.kind === 'sm' && d.sk === 'para');
    paras.forEach(d => d.kind = 'paraX'); // lính dù dùng AI riêng: giữ điểm thả, bắn từ xa
    try { _updateSummons17(dt); } finally { paras.forEach(d => d.kind = 'sm'); }
    paras.forEach(d => {
        const o = players.find(q => q.id === d.owner), S = SUMMON.para;
        if (!o || o.hp <= 0) { d.hp = 0; return; }
        d.cd -= dt;
        let e = null, best = 1e9;
        enemiesOf(o).forEach(q => { const dd = dist(d.x, d.y, q.x, q.y); if (!(q.air > 0) && dd < S.range && dd < best && !(q.st.invis > 0 && dd > 60) && lineOfSight(d.x, d.y, q.x, q.y)) { best = dd; e = q; } });
        let tx = null, ty = null;
        if (e) {
            d.angle = Math.atan2(e.y - d.y, e.x - d.x);
            if (best > 260) { tx = e.x; ty = e.y; }
            if (d.cd <= 0) { d.cd = S.rate * (0.8 + Math.random() * 0.4); bullets.push({ x: d.x + Math.cos(d.angle) * 14, y: d.y + Math.sin(d.angle) * 14, px: d.x, py: d.y, angle: d.angle + (Math.random() - 0.5) * 0.3, speed: 19, damage: S.shoot * (o.dmgMult || 1), life: S.range / (19 * 60) + 0.1, owner: o.id, color: '#d9f99d', size: 3.5, knock: 20, bounces: 0, trail: 20, summon: true }); AudioSys.playAt('smg', d.x, d.y, 0.1); }
        } else if (d.home && dist(d.x, d.y, d.home.x, d.home.y) > 50) { tx = d.home.x; ty = d.home.y; }
        if (tx !== null) {
            const a = Math.atan2(ty - d.y, tx - d.x), nx = d.x + Math.cos(a) * S.sp * dt, ny = d.y + Math.sin(a) * S.sp * dt;
            if (!pointInObstacle(nx, d.y, d.radius)) d.x = nx; if (!pointInObstacle(d.x, ny, d.radius)) d.y = ny;
            if (!e) d.angle = a;
        }
    });
};
const _drawSummonArt17 = drawSummonArt;
drawSummonArt = function (kind, d, r, now) {
    if (kind !== 'para') return _drawSummonArt17(kind, d, r, now);
    const C = ctx, a = d.angle || 0;
    C.save(); C.rotate(a);
    C.fillStyle = '#1f2937'; C.fillRect(r * 0.3, -2.5, r + 9, 5); // súng
    C.fillStyle = '#4d7c0f'; C.beginPath(); C.arc(0, 0, r, 0, Math.PI * 2); C.fill();
    C.strokeStyle = d.color; C.lineWidth = 2.5; C.stroke();
    C.fillStyle = '#365314'; C.beginPath(); C.arc(-1, 0, r * 0.62, 0, Math.PI * 2); C.fill(); // mũ cối
    C.fillStyle = 'rgba(255,255,255,0.18)'; C.beginPath(); C.arc(-3, -3, r * 0.25, 0, Math.PI * 2); C.fill();
    C.restore();
};

/* ============================== CẤU TRÚC HOÁ: tường rơi ============================== */
const WALL_SZ = 36;
function structWalls(p, pts) {
    const warn = strikeWarnT(p, 0.7); let n = 0;
    alongStrokes(pts, WALL_SZ, (x, y, i) => {
        if (n >= 40) return; n++;
        zones.push({ type: 'artyWarn', x, y, r: 22, t: warn + i * 0.03, maxT: warn + i * 0.03, owner: p.id, tick: 0 });
        strikes.push({ kind: 'wallDrop', owner: p.id, x, y, t: warn + i * 0.03 });
    });
    floatText(p.x, p.y - 42, '🧱 CẤU TRÚC HOÁ!', '#cbd5e1', 15); AudioSys.playAt('alarm', p.x, p.y, 0.2);
}
function landWall(s) {
    const o = players.find(q => q.id === s.owner), h = WALL_SZ / 2;
    players.forEach(e => {
        if (e.hp <= 0 || e.air > 0 || Math.abs(e.x - s.x) > h + e.radius || Math.abs(e.y - s.y) > h + e.radius) return;
        if (o && e.id !== o.id && !sameTeam(o, e)) { dealDamage(e, 55 * payload(o), o.id, { angle: Math.atan2(e.y - s.y, e.x - s.x), knock: 0 }); e.stun = Math.max(e.stun, 0.35); }
        const a = Math.atan2(e.y - s.y, e.x - s.x) || Math.random() * 6.28; e.x = s.x + Math.cos(a) * (h + e.radius + 6); e.y = s.y + Math.sin(a) * (h + e.radius + 6); // bị đẩy ra
    });
    obstacles.push({ x: s.x - h, y: s.y - h, w: WALL_SZ, h: WALL_SZ, wood: false, temp: 20, hp: 180, maxHp: 180 });
    spark(s.x, s.y, '#cbd5e1', 8, 200, 0.4, 3); addShake(2); if (Math.random() < 0.3) AudioSys.playAt('slam', s.x, s.y, 0.25);
}

/* ============================== ĐỢT CÀN ============================== */
function sweepStrike(p, a, b) {
    b = clampLen(a, b, 1100);
    const L = dist(a.x, a.y, b.x, b.y) || 1, ang = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(ang), ny = Math.cos(ang), warn = strikeWarnT(p, 1.0);
    warnLine(p, a.x, a.y, b.x, b.y, warn, true);
    let k = 0;
    for (let d = 0; d <= L; d += 85, k++) {
        const cx = a.x + Math.cos(ang) * d, cy = a.y + Math.sin(ang) * d;
        [-80, 0, 80].forEach(o => dropBomb(p, cx + nx * o, cy + ny * o, 50 * payload(p), 80 * payload(p), warn + k * 0.1));
    }
    floatText(p.x, p.y - 42, '🌊 ĐỢT CÀN!', '#fda4af', 18); AudioSys.playAt('alarm', p.x, p.y, 0.5, 3000);
}

/* ============================== CẬP NHẬT ============================== */
const _updateStrikes18 = updateStrikes;
updateStrikes = function (dt) {
    _updateStrikes18(dt);
    for (let i = strikes.length - 1; i >= 0; i--) {
        const s = strikes[i];
        if (s.kind === 'paraLand' && s.t <= 0) {
            strikes.splice(i, 1); const o = players.find(q => q.id === s.owner);
            if (o && o.hp > 0) { const d = summon(o, 'para', s.x, s.y); d.home = { x: d.x, y: d.y }; if (has(o, 'radioman')) { d.hp += 15; d.maxHp += 15; } ring(s.x, s.y, 6, 50, '#a3e635', 0.4, 3); smoke(s.x, s.y, 5, 'rgba(160,170,150,0.4)', 16); }
        } else if (s.kind === 'wallDrop' && s.t <= 0) { strikes.splice(i, 1); landWall(s); }
        else if (s.kind === 'htSpin') {
            s.tick -= dt; const o = players.find(q => q.id === s.owner);
            if (!o || o.hp <= 0) { strikes.splice(i, 1); continue; }
            s.x = o.x; s.y = o.y;
            if (s.tick <= 0) { s.tick = 0.1; slashes.push({ x: o.x, y: o.y, ownerId: o.id, angle: world.time * 14, range: 95, color: '#fca5a5', width: 9, life: 0.12, maxLife: 0.12, swing: 1, line: false }); enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(o.x, o.y, e.x, e.y) < 95 + e.radius) dealDamage(e, 9 * (o.meleeMult || 1), o.id, { melee: true, knock: 60, angle: Math.atan2(e.y - o.y, e.x - o.x) }); }); AudioSys.playAt('chainsaw', o.x, o.y, 0.15); }
            if (s.t <= 0) strikes.splice(i, 1);
        } else if (s.kind === 'htBurst') {
            s.tick -= dt; const o = players.find(q => q.id === s.owner);
            if (!o || o.hp <= 0) { strikes.splice(i, 1); continue; }
            while (s.tick <= 0 && s.n > 0) { s.tick += s.gap; s.n--; const a = (o.aimAngle !== undefined ? o.aimAngle : o.angle) + (Math.random() - 0.5) * s.spread; htBullet(o, a, { damage: s.dmg, color: s.color, size: 3.5 }); AudioSys.playAt(s.snd || 'smg', o.x, o.y, 0.15); }
            if (s.n <= 0) strikes.splice(i, 1);
        } else if (s.kind === 'htQuake' && s.t <= 0) {
            strikes.splice(i, 1); const o = players.find(q => q.id === s.owner); if (!o) continue;
            ring(s.x, s.y, 10, s.R, '#fde68a', 0.4, 7); addShake(6); AudioSys.playAt('slam', s.x, s.y, 0.4);
            enemiesOf(o).forEach(e => { const d = dist(s.x, s.y, e.x, e.y); if (!(e.air > 0) && d < s.R + e.radius && d > s.R - 110) { dealDamage(e, 26 * (o.meleeMult || 1), o.id, { melee: true, knock: 260, angle: Math.atan2(e.y - s.y, e.x - s.x) }); e.stun = Math.max(e.stun, 0.4); } });
        }
    }
};

/* ============================== 3 THẺ MỚI ============================== */
defS('paraSquad', '🪂', 'Lính Nhảy Dù', 30, 'engage', 'Mở bảng chiến thuật, chọn 1 điểm: 3 lính dù (40 máu, súng yếu) nhảy xuống, giữ vị trí và bắn địch trong 10 giây.', p => { const c = p.pickTarget ? p.pickTarget.a : autoPoint(p); paraDrop(p, c.x, c.y, 3); }, 2000);
defS('sweepStrike', '🌊', 'Đợt Càn', 40, 'engage', 'Mở bảng chiến thuật, chọn điểm đầu và cuối (tối đa 1100): một đợt bom 3 hàng càn quét từ đầu tới cuối (50 sát thương mỗi quả, trúng nhiều quả liền).', p => { const t = p.pickTarget || (() => { const e = autoPoint(p), a = Math.atan2(e.y - p.y, e.x - p.x); return { a: { x: p.x + Math.cos(a) * 120, y: p.y + Math.sin(a) * 120 }, b: { x: e.x + Math.cos(a) * 300, y: e.y + Math.sin(a) * 300 } }; })(); sweepStrike(p, t.a, t.b); }, 2000);
defS('structWall', '🧱', 'Cấu Trúc Hoá Chiến Thuật', 26, 'defend', 'Mở bảng chiến thuật, vẽ thoải mái (tổng 900). Bấm xác nhận: các khối tường rơi xuống dọc nét vẽ, đè trúng địch gây 55 sát thương + choáng, chặn di chuyển và đạn, phá được, tự biến mất sau 20 giây.', p => {
    let pts = p.pickPts;
    if (!pts || !pts.length) { const e = enemyOf(p), a = e ? Math.atan2(e.y - p.y, e.x - p.x) : p.angle, cx = p.x + Math.cos(a) * 90, cy = p.y + Math.sin(a) * 90, nx = -Math.sin(a), ny = Math.cos(a); pts = [{ x: cx - nx * 110, y: cy - ny * 110 }, { x: cx + nx * 110, y: cy + ny * 110 }]; }
    structWalls(p, pts);
}, 2000);
CARDS.paraSquad.picker = 'para'; CARDS.sweepStrike.picker = 'sweep'; CARDS.structWall.picker = 'struct';
FIRE_SKILLS.push('paraSquad', 'sweepStrike', 'structWall');

/* ============================== 3 VŨ KHÍ ĐÁNH DẤU (dùng dần) ============================== */
const tacW = (id, name, icon, color, mag, desc) => ({ id, name, icon, type: 'GUN', mode: 'tap', aim: 'line', color, damage: 0, fireRate: 40, speed: 1, spread: 0, range: 600, magSize: mag, mag, reserve: 0, noReload: true, moveScale: 1, width: 5, len: 12, tier: 3, desc });
WEAPONS.MARKBOMB = tacW('MARKBOMB', 'Thả Bom Đánh Dấu', '🎯', '#ef4444', 3, 'Mở bảng chiến thuật, chạm 1–3 điểm rồi xác nhận: mỗi điểm 1 quả bom lớn (110 sát thương). Không cần dùng hết 1 lần.');
WEAPONS.MARKPARA = tacW('MARKPARA', 'Thả Lính Đánh Dấu', '🪖', '#84cc16', 3, 'Mở bảng chiến thuật, chạm 1–3 điểm rồi xác nhận: mỗi điểm thả 1 lính dù. Không cần dùng hết 1 lần.');
WEAPONS.GUIDEBOMB = tacW('GUIDEBOMB', 'Thả Bom Định Hướng', '🧭', '#fb923c', 200, 'Mở bảng chiến thuật, vẽ đường bom (200 điện lượng, mỗi điện lượng = 5 đơn vị đường): bom rơi dọc nét vẽ. Dùng dần đến khi hết điện lượng.');
Object.assign(PICKER_WEAPONS, { MARKBOMB: 'markBomb', MARKPARA: 'markPara', GUIDEBOMB: 'guideBomb' });
Object.assign(BASE_WEIGHTS, { MARKBOMB: 2, MARKPARA: 2, GUIDEBOMB: 2 });
const TAC_WEAPONS = ['MARKBOMB', 'MARKPARA', 'GUIDEBOMB'];
const _useStrikeWeapon18 = useStrikeWeapon;
useStrikeWeapon = function (p, w, a, b) {
    if (!a && PICKER_WEAPONS[w.id]) tacNoise(p); // bot dùng không qua bảng
    if (!TAC_WEAPONS.includes(w.id)) return _useStrikeWeapon18(p, w, a, b);
    let pts = (p.pickPts || []).filter(q => !isBrk(q) || w.id === 'GUIDEBOMB');
    if (!a || !pts.length) { const c = autoPoint(p); pts = w.id === 'GUIDEBOMB' ? [{ x: c.x - 150, y: c.y }, { x: c.x + 150, y: c.y }] : [c]; }
    if (w.id === 'MARKBOMB') {
        pts = pts.slice(0, Math.min(3, w.mag));
        pts.forEach((q, i) => dropBomb(p, q.x, q.y, 110 * payload(p), 110 * payload(p), strikeWarnT(p, 1.0) + i * 0.15));
        w.mag -= pts.length; floatText(p.x, p.y - 42, `🎯 THẢ BOM ×${pts.length}`, '#fca5a5', 15);
    } else if (w.id === 'MARKPARA') {
        pts = pts.slice(0, Math.min(3, w.mag)); pts.forEach(q => paraDrop(p, q.x, q.y, 1));
        w.mag -= pts.length; floatText(p.x, p.y - 42, `🪖 THẢ LÍNH ×${pts.length}`, '#bef264', 15);
    } else {
        const ink = Math.min(inkUsed(pts) || 300, w.mag * 5), warn = strikeWarnT(p, 0.9); let k = 0, run = 0, prev = null;
        alongStrokes(pts, 70, (x, y) => { if (prev) run += dist(prev.x, prev.y, x, y); prev = { x, y }; if (run > ink + 1) return; dropBomb(p, x, y, 80 * payload(p), 85 * payload(p), warn + (k++) * 0.08); });
        w.mag -= Math.max(10, Math.ceil(ink / 5)); floatText(p.x, p.y - 42, '🧭 BOM ĐỊNH HƯỚNG!', '#fdba74', 15);
    }
    if (world.infiniteAmmo) w.mag = w.magSize;
    if (w.mag <= 0) { const i = p.inventory.indexOf(w); if (i >= 0) p.inventory[i] = { ...WEAPONS.NONE }; }
};

/* ============================== LỢI THẾ: BẢN ĐỒ CHIẾN THUẬT ============================== */
ADVANTAGES.tacMap = { icon: '📟', name: 'Bản Đồ Chiến Thuật', desc: 'Bảng chiến thuật hiện đầy đủ như Bản Đồ Nhỏ. Mỗi hiệp khởi đầu với 1 vũ khí đánh dấu; hòm vũ khí chỉ ra Thả Bom Đánh Dấu, Thả Lính Đánh Dấu hoặc Thả Bom Định Hướng. Tiếng ồn khi mở bảng nhỏ hơn một nửa.' };
ADV_IDS.push('tacMap');
const _resetRound18 = resetPlayerForRound;
resetPlayerForRound = function (p) {
    const r = _resetRound18(p);
    if (p.adv === 'tacMap' && p.inventory) {
        const w = makeWeapon(TAC_WEAPONS[Math.floor(Math.random() * 3)], p);
        const i = p.inventory.findIndex((q, k) => k > 0 && q.id === 'NONE');
        if (i >= 0) p.inventory[i] = w; else if (p.inventory.length < 3) p.inventory.push(w); else p.inventory[p.inventory.length - 1] = w;
    }
    return r;
};
const _openCrate18 = openCrate;
openCrate = function (p, index) {
    if (p.adv !== 'tacMap') return _openCrate18(p, index);
    const saved = { ...BASE_WEIGHTS }; for (const k in BASE_WEIGHTS) delete BASE_WEIGHTS[k]; TAC_WEAPONS.forEach(k => BASE_WEIGHTS[k] = 1);
    try { return _openCrate18(p, index); } finally { for (const k in BASE_WEIGHTS) delete BASE_WEIGHTS[k]; Object.assign(BASE_WEIGHTS, saved); }
};

/* ============================== KHÓI + BOM ĐỘC (Gas) ============================== */
const GAS_COMBO = { smoke: 'gasSmoke', tacSmoke: 'gasTac', smokeCut: 'gasCut', blanketSmoke: 'gasBlanket' };
[
    { id: 'gasSmoke', a: 'smoke', b: 'poisonGas', name: 'Khói Hơi Độc', desc: 'Khói của Bom Khói có độc: địch trong khói mất 12 máu/giây.' },
    { id: 'gasTac', a: 'tacSmoke', b: 'poisonGas', name: 'Khói Chiến Thuật Độc', desc: '3 điểm Khói Chiến Thuật đều có độc.' },
    { id: 'gasCut', a: 'smokeCut', b: 'poisonGas', name: 'Dải Khói Độc', desc: 'Máy bay Khói Cắt xả khói độc dọc đường bay.' },
    { id: 'gasBlanket', a: 'blanketSmoke', b: 'poisonGas', name: 'Sương Tử Thần', desc: 'Khói Mù Bao Phủ có độc trên cả vùng.' },
    { id: 'quietRadio', a: 'silentTab', b: 'decoySignal', name: 'Bóng Ma Vô Tuyến', desc: 'Mở bảng chiến thuật hoàn toàn im lặng, không ai nghe thấy.' },
    { id: 'netRecon', a: 'satLink', b: 'uavScan', name: 'Mạng Lưới Trinh Sát', desc: 'Trinh Sát UAV bay thêm 3 giây.' },
    { id: 'wiretap', a: 'eavesdrop', b: 'quickLink', name: 'Đánh Chặn Tín Hiệu', desc: 'Khi địch mở bảng chiến thuật, kỹ năng bảng của bạn hồi nhanh 3 giây.' },
    { id: 'paraElite', a: 'paraSquad', b: 'radioman', name: 'Biệt Kích Dù', desc: 'Lính Nhảy Dù thả 4 lính thay vì 3.' },
    { id: 'fortWall', a: 'structWall', b: 'bigPayload', name: 'Pháo Đài', desc: 'Tường Cấu Trúc Hoá bền gấp đôi.' },
    { id: 'doomSweep', a: 'sweepStrike', b: 'fastComms', name: 'Càn Quét Chớp Nhoáng', desc: 'Đợt Càn tiến nhanh gấp đôi.' }
].forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
// gắn nguồn cho khói rơi từ bảng chiến thuật
['tacSmokes', 'blanketSmoke', 'smokeCutStrike'].forEach((fn, i) => {
    const src = ['tacSmoke', 'blanketSmoke', 'smokeCut'][i], orig = window[fn];
    window[fn] = function (p, ...a) { const n = strikes.length; const r = orig(p, ...a); strikes.slice(n).forEach(s => s.src = src); return r; };
});
const _updateStrikes18b = updateStrikes;
updateStrikes = function (dt) {
    const known = new Set(strikes), planes = strikes.filter(s => s.kind === 'smokePlane' && s.src);
    const drops = strikes.filter(s => s.kind === 'smokeDrop' && s.src && s.t - dt <= 0);
    _updateStrikes18b(dt);
    strikes.forEach(s => { if (!known.has(s) && s.kind === 'smokeDrop' && !s.src) { const pl = planes.find(q => q.owner === s.owner); if (pl) s.src = pl.src; } });
    drops.forEach(d => { const z = zones.find(q => q.type === 'smoke' && q.x === d.x && q.y === d.y && !q.src); if (z) z.src = d.src; });
};
const _upe18 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe18(dt);
    zones.forEach(z => {
        if (z.type !== 'smoke' || z.gasDone || !(z.t > 0)) return;
        z.gasDone = true;
        const o = players.find(q => q.id === z.owner), cid = GAS_COMBO[z.src || 'smoke'];
        if (o && cid && combo(o, cid)) { zones.push({ type: 'poison', x: z.x, y: z.y, r: z.r * 0.95, t: z.t, maxT: z.t, owner: z.owner, tick: 0 }); }
    });
};
// phối hợp bảng chiến thuật
const _tacNoise18 = tacNoise;
tacNoise = function (p) {
    if (p && combo(p, 'quietRadio')) return;
    if (p) enemiesOf(p).forEach(q => { if (combo(q, 'wiretap')) (q.skills || []).forEach(s => { if (CARDS[s.id] && CARDS[s.id].picker) s.cd = Math.max(0, s.cd - 3); }); });
    return _tacNoise18(p);
};
const _uav18 = uavScan;
uavScan = function (p, x, y) { _uav18(p, x, y); if (combo(p, 'netRecon')) { const s = strikes[strikes.length - 1]; if (s && s.kind === 'uav') { s.t += 3; const z = zones.find(q => q.type === 'flareLight' && q.owner === p.id && q.x === x && q.y === y); if (z) { z.t += 3; z.maxT = z.t; } } } };
const _para18 = paraDrop;
paraDrop = function (p, x, y, n) { return _para18(p, x, y, n === 3 && combo(p, 'paraElite') ? 4 : n); };
const _landWall18 = landWall;
landWall = function (s) { _landWall18(s); const o = players.find(q => q.id === s.owner); if (o && combo(o, 'fortWall')) { const w = obstacles[obstacles.length - 1]; w.hp = w.maxHp = 360; } };
const _sweep18 = sweepStrike;
sweepStrike = function (p, a, b) {
    if (!combo(p, 'doomSweep')) return _sweep18(p, a, b);
    const n = strikes.length; _sweep18(p, a, b);
    const base = strikes.slice(n).reduce((m, s) => Math.min(m, s.t), 99);
    strikes.slice(n).forEach(s => { const z = zones.find(q => q.type === 'bombFall' && q.x === s.x && q.y === s.y); s.t = base + (s.t - base) / 2; if (z) { z.t = z.maxT = s.t; } });
};

/* ============================== KỸ THUẬT CAO: kỹ năng riêng cho từng vũ khí ============================== */
function htBullet(p, a, o) {
    const b = { x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, px: p.x, py: p.y, sx: p.x, sy: p.y, angle: a, speed: 18, damage: 10, life: 1, owner: p.id, color: '#fde68a', size: 4, knock: 40, bounces: 0, trail: 30, ...o };
    bullets.push(b); return b;
}
function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return dist(px, py, ax + dx * t, ay + dy * t); }
const fan = (p, n, spread, a, o) => { for (let i = 0; i < n; i++) htBullet(p, a + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0), o); };
const HT = {
    NONE:       ['THIẾT QUYỀN', p => { const a = aimDir(p); ring(p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60, 10, 120, '#fde68a', 0.35, 6); enemiesOf(p).forEach(e => { const d = dist(p.x, p.y, e.x, e.y); if (d < 170 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.8) { dealDamage(e, 34, p.id, { melee: true, knock: 700, angle: a }); e.stun = Math.max(e.stun, 0.5); } }); addShake(6); AudioSys.playAt('slam', p.x, p.y, 0.4); }],
    KNIFE:      ['ĐÂM LÉN', p => { const e = enemiesOf(p).filter(q => !(q.air > 0) && dist(p.x, p.y, q.x, q.y) < 340 && lineOfSight(p.x, p.y, q.x, q.y)).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y))[0]; if (!e) { p.st.invis = Math.max(p.st.invis || 0, 1.5); return; } const bx = e.x - Math.cos(e.angle) * (e.radius + p.radius + 4), by = e.y - Math.sin(e.angle) * (e.radius + p.radius + 4); smoke(p.x, p.y, 6, 'rgba(60,60,80,0.5)', 16); if (!pointInObstacle(bx, by, p.radius)) { p.x = bx; p.y = by; } p.angle = Math.atan2(e.y - p.y, e.x - p.x); dealDamage(e, getCurrentWeapon(p).damage * 2.6 * (p.meleeMult || 1), p.id, { melee: true, crit: true, angle: p.angle, knock: 120 }); slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: p.angle, range: 60, color: '#f87171', width: 8, life: 0.2, maxLife: 0.2, swing: 1, line: true }); }],
    DAGGERS:    ['MƯA PHI ĐAO', p => fan(p, 9, 1.2, aimDir(p), { damage: 15 * (p.meleeMult || 1), speed: 20, color: '#e5e7eb', size: 4, life: 0.6 })],
    KATANA:     ['NHẤT THIỂM', p => { const a = aimDir(p); let d = 280; while (d > 40 && pointInObstacle(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, p.radius)) d -= 20; const ax = p.x, ay = p.y, bx = p.x + Math.cos(a) * d, by = p.y + Math.sin(a) * d; startTravel(p, bx, by, 0.15, null, null, 6); beams.push({ x1: ax, y1: ay, x2: bx, y2: by, life: 0.35, maxLife: 0.35, color: '#fecaca' }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, ax, ay, bx, by) < 50 + e.radius) { dealDamage(e, 70 * (p.meleeMult || 1), p.id, { melee: true, angle: a, knock: 60 }); spark(e.x, e.y, '#fecaca', 10, 220); } }); hitStop(0.05); AudioSys.playAt('swing', p.x, p.y, 0.6); }],
    SPEAR:      ['PHÓNG GIÁO', p => htBullet(p, aimDir(p), { damage: 62 * (p.meleeMult || 1), speed: 24, size: 7, pierce: true, color: '#fcd34d', knock: 200, life: 0.8 })],
    HAMMER:     ['ĐỘNG ĐẤT', p => { [0, 0.25, 0.5].forEach((t, i) => strikes.push({ kind: 'htQuake', owner: p.id, x: p.x, y: p.y, t, R: 130 + i * 90 })); }],
    CHAINSAW:   ['CƯA XOÁY', p => strikes.push({ kind: 'htSpin', owner: p.id, x: p.x, y: p.y, t: 1.3, tick: 0 })],
    LIGHTSABER: ['SÓNG KIẾM SÁNG', p => htBullet(p, aimDir(p), { damage: 52 * (p.meleeMult || 1), speed: 14, size: 14, pierce: true, color: '#67e8f9', knock: 160, life: 0.9, trail: 60 })],
    SHIELD:     ['THÀNH TRÌ', p => { const a = aimDir(p), cx = p.x + Math.cos(a) * 70, cy = p.y + Math.sin(a) * 70; placeTempWall(cx, cy, Math.abs(Math.sin(a)) > Math.abs(Math.cos(a)), 170, 6, true); p.st.kevlar = Math.max(p.st.kevlar || 0, 2); }],
    ROUNDSHIELD:['KHIÊN DỘI', p => { let last = p; const hit = []; for (let k = 0; k < 3; k++) { const e = enemiesOf(p).filter(q => !hit.includes(q) && dist(last.x, last.y, q.x, q.y) < 420).sort((u, v) => dist(last.x, last.y, u.x, u.y) - dist(last.x, last.y, v.x, v.y))[0]; if (!e) break; beams.push({ x1: last.x, y1: last.y, x2: e.x, y2: e.y, life: 0.3, maxLife: 0.3, color: '#fde68a' }); dealDamage(e, 36 * (p.meleeMult || 1), p.id, { melee: true, knock: 180, angle: Math.atan2(e.y - last.y, e.x - last.x) }); e.stun = Math.max(e.stun, 0.3); hit.push(e); last = e; } AudioSys.playAt('block', p.x, p.y, 0.5); }],
    RAPIER:     ['THÍCH KIẾM LIÊN HOÀN', p => { const a = aimDir(p); for (let k = 0; k < 5; k++) setTimeout(() => { if (p.hp <= 0) return; slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + (Math.random() - 0.5) * 0.2, range: 120, color: '#e0e7ff', width: 5, life: 0.12, maxLife: 0.12, swing: 1, line: true }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, p.x, p.y, p.x + Math.cos(a) * 120, p.y + Math.sin(a) * 120) < 24 + e.radius) dealDamage(e, 16 * (p.meleeMult || 1), p.id, { melee: true, knock: 30, angle: a }); }); }, k * 70); }],
    GREATSWORD: ['TRẢM LONG', p => { const a = aimDir(p); slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a, range: 210, color: '#fb7185', width: 16, life: 0.35, maxLife: 0.35, swing: 1, line: false }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < 210 + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 1.2) dealDamage(e, 80 * (p.meleeMult || 1), p.id, { melee: true, knock: 500, angle: a }); }); addShake(10); hitStop(0.07); AudioSys.playAt('slam', p.x, p.y, 0.5); }],
    AXE:        ['RÌU BAY', p => htBullet(p, aimDir(p), { damage: 55 * (p.meleeMult || 1), speed: 16, size: 9, pierce: true, color: '#d6d3d1', knock: 220, life: 0.7 })],
    PISTOL:     ['BẮN QUẠT', p => strikes.push({ kind: 'htBurst', owner: p.id, n: 6, gap: 0.06, tick: 0, dmg: 24, spread: 0.12, color: '#fde68a', snd: 'pistol' })],
    REVOLVER:   ['SÁU VIÊN ĐỊNH MỆNH', p => fan(p, 6, 0.9, aimDir(p), { damage: 32, speed: 24, color: '#fca5a5', size: 4.5, life: 0.9, crit: true })],
    SMG:        ['MƯA ĐẠN', p => strikes.push({ kind: 'htBurst', owner: p.id, n: 30, gap: 0.033, tick: 0, dmg: 7, spread: 0.2, color: '#fef08a' })],
    DUAL:       ['VŨ ĐIỆU SONG SÚNG', p => { for (let i = 0; i < 24; i++) htBullet(p, i / 24 * Math.PI * 2, { damage: 10, speed: 18, color: '#fde68a', size: 3.5, life: 0.6 }); AudioSys.playAt('smg', p.x, p.y, 0.4); }],
    AR:         ['LỰU ĐẠN GẮN NÒNG', p => htBullet(p, aimDir(p), { damage: 0, speed: 15, size: 6, explosive: true, color: '#a3e635', life: 1.1 })],
    SAR:        ['BÓNG MA', p => { p.st.invis = Math.max(p.st.invis || 0, 2.5); const w = getCurrentWeapon(p); if (w.magSize) w.mag = effMag(p, w); }],
    SPISTOL:    ['ÁM SÁT', p => { p.st.invis = Math.max(p.st.invis || 0, 2); p.nextShotMult = 2; }],
    SHOTGUN:    ['ĐẠN RỒNG', p => fan(p, 11, 0.8, aimDir(p), { damage: 11, speed: 17, color: '#fb923c', size: 4, life: 0.45, burn: true, knock: 90 })],
    SNIPER:     ['PHÁT BẮN HOÀN HẢO', p => htBullet(p, aimDir(p), { damage: 140, speed: 40, size: 5, pierce: true, color: '#e9d5ff', life: 1.2, trail: 120, crit: true })],
    RAILGUN:    ['XUYÊN TÂM', p => { const a = aimDir(p), ax = p.x, ay = p.y, bx = p.x + Math.cos(a) * 1400, by = p.y + Math.sin(a) * 1400; beams.push({ x1: ax, y1: ay, x2: bx, y2: by, life: 0.4, maxLife: 0.4, color: '#a5f3fc' }); enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, ax, ay, bx, by) < 30 + e.radius) dealDamage(e, 110, p.id, { angle: a, knock: 300, crit: true }); }); addShake(8); AudioSys.playAt('rail', p.x, p.y, 0.7); }],
    BOW:        ['MƯA TÊN', p => { const a = aimDir(p), cx = p.x + Math.cos(a) * 330, cy = p.y + Math.sin(a) * 330; for (let i = 0; i < 12; i++) { const r = Math.sqrt(Math.random()) * 120, t = Math.random() * 6.28; dropBomb(p, cx + Math.cos(t) * r, cy + Math.sin(t) * r, 22, 40, 0.5 + Math.random() * 0.5); } }],
    ROCKET:     ['TÊN LỬA CHÙM', p => fan(p, 4, 0.5, aimDir(p), { damage: 0, speed: 13, size: 6, explosive: true, blastSmall: true, color: '#fb923c', life: 1.3, trail: 50 })],
    LAUNCHER:   ['MƯA LỰU', p => { const a = aimDir(p); [-0.5, -0.25, 0, 0.25, 0.5].forEach(o => items.push({ x: p.x, y: p.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 12, vx: Math.cos(a + o) * 850, vy: Math.sin(a + o) * 850, thrown: true, ownerId: p.id, fuse: 1.0, z: 0, vz: 260, blast: [70, 130] })); }],
    GRENADE:    ['LỰU ĐẠN CHÙM', p => { const a = aimDir(p); [-0.6, -0.3, 0, 0.3, 0.6].forEach(o => items.push({ x: p.x, y: p.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 12, vx: Math.cos(a + o) * 700, vy: Math.sin(a + o) * 700, thrown: true, ownerId: p.id, fuse: 1.1, z: 0, vz: 260, blast: [60, 120] })); }],
    EMPGREN:    ['XUNG ĐIỆN TỪ', p => { zones.push({ type: 'emp', x: p.x, y: p.y, r: 230, t: 2.5, maxT: 2.5, owner: p.id, tick: 0 }); ring(p.x, p.y, 10, 230, '#38bdf8', 0.5, 5); AudioSys.playAt('rail', p.x, p.y, 0.5); }],
    FLAME:      ['RỒNG LỬA', p => { const a = aimDir(p); for (let d = 60; d <= 360; d += 60) { const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d; zones.push({ type: 'fire', x, y, r: 55, t: 3.5, maxT: 3.5, owner: p.id, tick: 0 }); } AudioSys.playAt('flame', p.x, p.y, 0.5); }],
    TESLA:      ['BÃO ĐIỆN', p => { enemiesOf(p).filter(e => dist(p.x, p.y, e.x, e.y) < 460).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y)).slice(0, 4).forEach(e => { beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, life: 0.3, maxLife: 0.3, color: '#7dd3fc', zig: 1 }); dealDamage(e, 30, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 40 }); e.stun = Math.max(e.stun, 0.6); }); AudioSys.playAt('rail', p.x, p.y, 0.5); }],
    ENERGY:     ['QUẢ CẦU PLASMA', p => htBullet(p, aimDir(p), { damage: 30, speed: 9, size: 16, explosive: true, color: '#c4b5fd', life: 1.4, trail: 50 })],
    MINIGUN:    ['QUÁ NHIỆT', p => { p.st.rage = Math.max(p.st.rage, 3); p.fireBoost = 3; const w = getCurrentWeapon(p); if (w.magSize) w.mag = effMag(p, w); p.htFree = world.time + 3; }],
    NET:        ['LƯỚI KHỔNG LỒ', p => { const a = aimDir(p), x = p.x + Math.cos(a) * 250, y = p.y + Math.sin(a) * 250; zones.push({ type: 'net', x, y, r: 150, t: 4, maxT: 4, owner: p.id, tick: 0 }); enemiesOf(p).forEach(e => { if (dist(x, y, e.x, e.y) < 150 + e.radius) { e.st.root = Math.max(e.st.root || 0, 1.6); floatText(e.x, e.y - 34, 'BỊ TRÓI!', '#e5e7eb', 14); } }); }],
    BOOMERANG:  ['BÃO BOOMERANG', p => fan(p, 5, 1.4, aimDir(p), { damage: 26, speed: 15, size: 6, color: '#fbbf24', life: 0.9, knock: 180, bounces: 2 })]
};
weaponSkill = function (p) {
    const w = getCurrentWeapon(p), H = HT[w.id];
    if (!H) { if (PICKER_WEAPONS[w.id]) { w.mag = Math.min(w.magSize, w.mag + (w.id === 'GUIDEBOMB' ? 60 : 1)); floatText(p.x, p.y - 34, '📦 NẠP THÊM LƯỢT!', '#fde68a', 15); } return; }
    H[1](p); floatText(p.x, p.y - 36, H[0] + '!', '#fde68a', 15);
};
CARDS.hightech.desc = 'Mỗi vũ khí có kỹ năng riêng: Dao = Đâm Lén, Katana = Nhất Thiểm, Búa = Động Đất, Cưa = Cưa Xoáy, Khiên = Thành Trì, Shotgun = Đạn Rồng, Bắn tỉa = Phát Bắn Hoàn Hảo, Railgun = Xuyên Tâm, Cung = Mưa Tên, Súng Điện = Bão Điện, Lưới = Lưới Khổng Lồ… (35 kỹ năng). Vũ khí gọi hoả lực: nạp thêm 1 lượt.';
// Minigun Quá Nhiệt: không tốn đạn 3 giây · Lục Giảm Thanh Ám Sát: phát kế x2
const _fireWeapon18 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const n = bullets.length, m0 = w && w.mag;
    const r = _fireWeapon18(p, w, ang, charge, enemy);
    if (p.nextShotMult && bullets.length > n) { bullets.slice(n).forEach(b => { if (b.owner === p.id) b.damage *= p.nextShotMult; }); p.nextShotMult = 0; }
    if (p.htFree > world.time && w && w.magSize && w.mag < m0) w.mag = m0;
    return r;
};

/* ============================== VŨ KHÍ NHẢY: tối đa 0.75 giây ============================== */
for (const k in LEAP_WIND) LEAP_WIND[k] = Math.min(LEAP_WIND[k], 0.45);
const _startLeap18 = startLeapSlam;
startLeapSlam = function (p, w, ang, o) { if (!p.leapBypass && o) o = { ...o, wind: Math.min(o.wind !== undefined ? o.wind : (LEAP_WIND[w.id] || 0.45), 0.45) }; return _startLeap18(p, w, ang, o); };
const _startTravel18 = startTravel;
startTravel = function (p, x1, y1, T, land, o, h) { if (land === 'slam' || land === 'leap') T = Math.min(T, 0.3); return _startTravel18(p, x1, y1, T, land, o, h); };
