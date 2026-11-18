/** ==================== ĐIỀU KHIỂN: PHÉP BỔ TRỢ KÉO ĐỂ NGẮM · KHIÊN TRÒN 2 DẠNG ====================
 *  Nạp sau brain.js.
 */

/* ============================== PHÉP CẦN HƯỚNG: kéo nút để ngắm, THẢ RA mới dùng ============================== */
const AIM_SPELLS = ['missile', 'iceWall', 'blind', 'flash'];
const SP_KEYS = ['sp1', 'sp2', 'sp3'];
handleSpellButtons = function (p, input, allowAct) {
    if (!p.spells) return;
    p.lastMoveIn = Math.hypot(input.move.x, input.move.y);
    p.spHold = p.spHold || {};
    ['sp1', 'sp2', 'sp3', 'it1', 'it2'].forEach(k => {
        const down = !!input[k], was = !!(p.wasSp && p.wasSp[k]);
        if (k[0] === 's') {
            const i = +k[2] - 1, s = p.spells[i], aimed = !!s && AIM_SPELLS.includes(s.id);
            if (down) { // nhớ hướng kéo cuối cùng (hoặc huỷ nếu kéo về giữa)
                const v = input[k + 'aim'];
                if (input[k + 'cancel']) p.spHold[k] = 'cancel';
                else if (v && Math.hypot(v.x, v.y) > 0.25) p.spHold[k] = { x: v.x, y: v.y };
            }
            const fire = aimed ? (was && !down) : (down && !was);
            if (fire && allowAct && p.hp > 0 && s && (p.stun <= 0 || s.id === 'cleanse')) {
                const h = p.spHold[k];
                if (h !== 'cancel') {
                    p.spellAimAng = h ? Math.atan2(h.y, h.x) : undefined;
                    try { castSpell(p, i); } finally { p.spellAimAng = undefined; }
                } else if (!p.isBot) floatText(p.x, p.y - 30, 'Huỷ', '#94a3b8', 11);
            }
            if (!down) delete p.spHold[k];
        } else if (down && !was && allowAct && p.hp > 0 && p.stun <= 0) useItem(p, +k[2] - 1);
        (p.wasSp = p.wasSp || {})[k] = down;
    });
};
// cảm ứng: kéo nút phép
const _handleTouch8 = handleTouch;
handleTouch = function (e) {
    const pre = new Map(touches);
    _handleTouch8(e);
    if (gameState !== 'PLAYING' && gameState !== 'COUNTDOWN') return;
    const inp = touchInputs.p1, L = touchLayout();
    for (const t of e.changedTouches) {
        const id = t.identifier, x = t.clientX, y = t.clientY;
        if (e.type === 'touchstart') {
            const td = touches.get(id);
            if (td && SP_KEYS.includes(td.k)) { inp[td.k + 'aim'] = null; inp[td.k + 'cancel'] = false; }
        } else if (e.type === 'touchmove') {
            const td = touches.get(id); if (!td || !SP_KEYS.includes(td.k)) continue;
            const dx = x - td.sx, dy = y - td.sy, d = Math.hypot(dx, dy), maxD = L.A.r * 1.7;
            if (d > 14) { inp[td.k + 'aim'] = { x: dx / d * Math.min(1, d / maxD), y: dy / d * Math.min(1, d / maxD) }; inp[td.k + 'cancel'] = false; td.eng = true; }
            else if (td.eng) { inp[td.k + 'aim'] = null; inp[td.k + 'cancel'] = true; }
            skillStick[td.k] = { sx: td.sx, sy: td.sy, x, y, cancel: !!inp[td.k + 'cancel'] };
        } else {
            const td = pre.get(id);
            if (td && SP_KEYS.includes(td.k)) { skillStick[td.k] = null; setTimeout(() => { inp[td.k + 'aim'] = null; inp[td.k + 'cancel'] = false; }, 50); }
        }
    }
};
const _mergeInput8 = mergeInput;
mergeInput = function (...list) {
    const out = _mergeInput8(...list);
    list.forEach(i => { if (!i) return; SP_KEYS.forEach(k => { if (i[k + 'aim']) out[k + 'aim'] = i[k + 'aim']; if (i[k + 'cancel']) out[k + 'cancel'] = true; }); });
    return out;
};
// mạng: gửi hướng ngắm phép
const _netSend8 = netSend;
netSend = function (msg) {
    if (net.role === 'guest' && msg && msg.t === 'in' && window.__lastInp) {
        const i = window.__lastInp; msg.sa = {};
        SP_KEYS.forEach(k => { const v = i[k + 'aim']; if (v) msg.sa[k] = { x: Math.round(v.x * 20) / 20, y: Math.round(v.y * 20) / 20 }; if (i[k + 'cancel']) msg.sa[k] = 'c'; });
    }
    return _netSend8(msg);
};
const _onHostData8 = onHostData;
onHostData = function (g, m) { _onHostData8(g, m); if (m && m.t === 'in') g.remote.sa = m.sa || {}; };
const _netRemoteInput8 = netRemoteInput;
netRemoteInput = function (id) {
    const out = _netRemoteInput8(id), g = net.guests.find(x => x.id === id);
    if (g && g.remote.sa) SP_KEYS.forEach(k => { const v = g.remote.sa[k]; if (v === 'c') out[k + 'cancel'] = true; else if (v) out[k + 'aim'] = v; });
    return out;
};
// vẽ: núm kéo trên nút phép + mũi tên hướng từ nhân vật
const _drawTouch8 = drawTouchControls;
drawTouchControls = function (p) {
    _drawTouch8(p);
    const L = touchLayout(), zoom = camera.zoom, W = SCREEN_W, H = SCREEN_H;
    SP_KEYS.forEach(k => {
        const st = skillStick[k], s = p.spells && p.spells[+k[2] - 1];
        if (!st || !s) return;
        const b = L.row.find(r => r.k === k); if (!b) return;
        const dx = st.x - st.sx, dy = st.y - st.sy, d = Math.min(b.r * 1.3, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
        ctx.fillStyle = st.cancel ? 'rgba(248,113,113,0.85)' : 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, b.r * 0.38, 0, Math.PI * 2); ctx.fill();
        if (!AIM_SPELLS.includes(s.id) || st.cancel || Math.hypot(dx, dy) < 14) return;
        const px = (p.x - camera.x) * zoom + W / 2, py = (p.y - camera.y) * zoom + H / 2, len = (s.id === 'missile' ? 260 : s.id === 'flash' ? 200 : 140) * zoom;
        ctx.save(); ctx.strokeStyle = 'rgba(253,224,71,0.85)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(253,224,71,0.9)'; ctx.beginPath();
        const ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len;
        ctx.moveTo(ex + Math.cos(a) * 10, ey + Math.sin(a) * 10); ctx.lineTo(ex + Math.cos(a + 2.5) * 10, ey + Math.sin(a + 2.5) * 10); ctx.lineTo(ex + Math.cos(a - 2.5) * 10, ey + Math.sin(a - 2.5) * 10); ctx.fill();
        ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(SPELLS[s.id].icon + ' THẢ ĐỂ DÙNG', ex, ey - 16);
        ctx.restore();
    });
    // Khiên Tròn: nhãn riêng cho 2 nút
    const w = getCurrentWeapon(p);
    if (w.id === 'ROUNDSHIELD' && L.B) {
        const tag = (b, t, c) => { ctx.save(); ctx.font = `700 9px ${FONT}`; const tw = ctx.measureText(t).width + 10; ctx.fillStyle = 'rgba(6,10,24,0.8)'; rrect(ctx, b.x - tw / 2, b.y + b.r + 3, tw, 14, 7); ctx.fill(); ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, b.x, b.y + b.r + 10); ctx.restore(); };
        tag(L.A, w.out && !w.planted ? 'ĐANG BAY' : 'GIỮ: NÉM', '#7dd3fc');
        tag(L.B, w.planted ? 'THU KHIÊN' : '🧱 DỰNG', '#fde68a');
    }
};
// spellAim (tactics.js) và Tốc Biến (extra.js) ưu tiên hướng vừa kéo
const _spellAim8 = spellAim;
spellAim = function (p) { return p.spellAimAng !== undefined ? p.spellAimAng : _spellAim8(p); };
const _flashMove8 = flashMove;
flashMove = function (p, D) {
    if (p.spellAimAng === undefined) return _flashMove8(p, D);
    const md = p.moveDir, li = p.lastMoveIn; p.moveDir = p.spellAimAng; p.lastMoveIn = 1;
    try { return _flashMove8(p, D); } finally { p.moveDir = md; p.lastMoveIn = li; }
};

/* ============================== KHIÊN TRÒN: 2 DẠNG ============================== */
// Nút đánh: chạm = húc, giữ rồi thả = NÉM khiên nảy qua 3 mục tiêu (như cũ)
// Nút B: chạm = DỰNG khiên trước mặt thành bức chắn (140 máu, 6 giây), chạm lần nữa = thu về; giữ = vứt vũ khí
function toggleShieldWall(p, w) {
    if (w.planted) {
        const i = obstacles.indexOf(w.planted); if (i >= 0) obstacles.splice(i, 1);
        w.planted = null; w.out = false; floatText(p.x, p.y - 30, 'THU KHIÊN', '#7dd3fc', 13); AudioSys.playAt('ui', p.x, p.y, 0.3);
        return;
    }
    if (w.out) return; // đang ném đi
    const a = p.angle, horiz = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a));
    for (const d of [42, 60, 80]) {
        const o = placeTempWall(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, horiz, 76, 6, false);
        if (o) {
            o.ice = false; o.hp = o.maxHp = 140; o.shieldOf = p.id; o.shieldColor = w.color;
            w.planted = o; w.out = true;
            floatText(p.x, p.y - 30, '🧱 DỰNG KHIÊN', '#fde68a', 13); AudioSys.playAt('block', p.x, p.y, 0.45); addShake(3);
            return;
        }
    }
    floatText(p.x, p.y - 30, 'Không đủ chỗ', '#94a3b8', 12);
}
const _handleThrow8 = handleThrowButton;
handleThrowButton = function (p, w, input, dt, allowAct, enemy) {
    if (w.id !== 'ROUNDSHIELD') return _handleThrow8(p, w, input, dt, allowAct, enemy);
    if (!allowAct) { p.bHeldT = 0; return; }
    if (input.b) {
        p.bHeldT = (p.bHeldT || 0) + dt;
        if (p.bHeldT >= 0.35 && !p.bThrown) { p.bThrown = true; if (!w.out) throwWeapon(p, w, enemy); }
    } else if (p.bHeldT > 0) {
        if (!p.bThrown) toggleShieldWall(p, w);
        p.bHeldT = 0; p.bThrown = false;
    }
};
// khiên dựng bị phá / hết giờ → về tay
const _upe8 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upe8(dt);
    players.forEach(p => (p.inventory || []).forEach(w => { if (w.planted && !obstacles.includes(w.planted)) { w.planted = null; w.out = false; if (p.hp > 0) floatText(p.x, p.y - 30, 'KHIÊN VỀ TAY', '#7dd3fc', 12); } }));
};
// PC: gợi ý phím cho Khiên Tròn
const _drawHUD8 = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUD8(W, H, now);
    const me = localPlayer();
    if (!me || isTouch || me.hp <= 0 || getCurrentWeapon(me).id !== 'ROUNDSHIELD') return;
    const w = getCurrentWeapon(me);
    ctx.save(); ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(253,230,138,0.9)';
    ctx.fillText(`🔵 Chuột trái / F: chạm húc · giữ NÉM khiên   ·   Chuột phải / G: ${w.planted ? 'THU khiên' : 'DỰNG khiên'}`, W / 2, H - 62);
    ctx.restore();
};
// vẽ khiên dựng (máy chủ / chơi offline): đè hình khiên lên bức chắn
const _drawDecoys8 = drawDecoys;
drawDecoys = function (now) {
    _drawDecoys8(now);
    obstacles.forEach(o => {
        if (!o.shieldOf) return;
        ctx.save(); ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
        const horiz = o.w > o.h, L = Math.max(o.w, o.h);
        if (!horiz) ctx.rotate(Math.PI / 2);
        const g = ctx.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#0369a1');
        ctx.fillStyle = g; rrect(ctx, -L / 2, -12, L, 24, 10); ctx.fill();
        ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        if (o.hp < o.maxHp) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-L / 2, -18, L, 3); ctx.fillStyle = '#7dd3fc'; ctx.fillRect(-L / 2, -18, L * o.hp / o.maxHp, 3); }
        ctx.restore();
    });
};

/* Bot hẹn giờ chọn thẻ nhưng màn chọn đã đổi giai đoạn (bỏ lượt, chọn chỉ số…): bỏ qua an toàn */
const _botPickCard8 = botPickCard;
botPickCard = function (p, ids, kind) {
    if (!Array.isArray(ids) || !ids.length || ids.some(id => id === undefined || (kind === 'build' && !CARDS[id]))) return 0;
    return _botPickCard8(p, ids, kind);
};
