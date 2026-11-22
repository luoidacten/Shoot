/** ==================== BẢNG CHIẾN THUẬT CHIA CẤP · ÉP XUNG MỚI · ĐỔI MOULD HỒI 1 GIÂY ====================
 *  Nạp sau rework10.js. (bgWin / drawPicker của battleground.js nạp sau → ghi đè khi trang tải xong)
 */

/* ============================== 1) BẢNG CHIẾN THUẬT 3 CẤP ============================== */
// Cấp 1 · MINI: chỉ khu vực quanh bạn · Cấp 2 · VÙNG: khu vực rộng · Cấp 3 · TOÀN BẢN ĐỒ
// Bản Đồ Nhỏ (lợi thế / thẻ) hoặc cầm Vạn Tượng: bảng +1 cấp (trừ đòn thường Điểm Đánh Dấu: luôn MINI)
const TAC_LEVEL = { vtMark: 1, incend: 1, cluster: 1, napalm: 1, supply: 1, smokes: 1, arty: 2, carpet: 2, laser: 2, smokeCut: 2, airstrike: 2, blanket: 2, uav: 2, orbital: 3, vtGiant: 3 };
const TAC_WIN = { 1: [1150, 780], 2: [2300, 1560] };
const TAC_LV_NAME = { 1: 'CẤP 1 · MINI — khu vực quanh bạn', 2: 'CẤP 2 · VÙNG — khu vực rộng', 3: 'CẤP 3 · TOÀN BẢN ĐỒ' };
function tacLevel(kind) {
    const me = localPlayer(); let lv = TAC_LEVEL[kind] || 3;
    if (lv < 3 && kind !== 'vtMark' && me && (me.adv === 'minimap' || has(me, 'miniMapCard') || (getCurrentWeapon(me) || {}).id === 'VANTUONG')) lv++;
    return Math.min(3, lv);
}
window.addEventListener('load', () => {
    const _bgWinR11 = bgWin;
    bgWin = function () {
        if (!picker) return null;
        const lv = picker.lv || (picker.lv = tacLevel(picker.kind));
        if (lv >= 3) return _bgWinR11();
        if (!picker.bgWin) {
            const me = localPlayer() || { x: MAP_W / 2, y: MAP_H / 2 }, [W0, H0] = TAC_WIN[lv], w = Math.min(W0, MAP_W), h = Math.min(H0, MAP_H);
            if (w >= MAP_W && h >= MAP_H) return null;
            picker.bgWin = { ox: Math.max(0, Math.min(MAP_W - w, me.x - w / 2)), oy: Math.max(0, Math.min(MAP_H - h, me.y - h / 2)), w, h };
        }
        return picker.bgWin;
    };
    const _drawPickerR11 = drawPicker;
    drawPicker = function (me, W, H, now) {
        const r = _drawPickerR11(me, W, H, now);
        if (!picker) return r;
        const lv = picker.lv || tacLevel(picker.kind), R = bgInWindow(() => pickerRect(), false), col = lv === 1 ? '#86efac' : lv === 2 ? '#fde047' : '#c4b5fd';
        ctx.save(); ctx.font = `800 12px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const txt = `🗺️ ${TAC_LV_NAME[lv]}`, tw = ctx.measureText(txt).width;
        ctx.fillStyle = 'rgba(2,6,23,0.75)'; ctx.fillRect(R.x + 6, R.y + 6, tw + 14, 20); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(R.x + 6, R.y + 6, tw + 14, 20);
        ctx.fillStyle = col; ctx.fillText(txt, R.x + 13, R.y + 20);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < lv ? col : 'rgba(148,163,184,0.35)'; ctx.fillRect(R.x + tw + 26 + i * 9, R.y + 20 - 5 - i * 3, 6, 5 + i * 3); }
        if (picker.kind === 'vtMark' && me) { const V = bgWin(), px = R.x + (me.x - (V ? V.ox : 0)) * R.k, py = R.y + (me.y - (V ? V.oy : 0)) * R.k; ctx.strokeStyle = 'rgba(244,114,182,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -now * 30; ctx.beginPath(); ctx.arc(px, py, 450 * R.k, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(244,114,182,0.06)'; ctx.fill(); }
        if (lv < 3) { const g = ctx.createRadialGradient(R.x + R.w / 2, R.y + R.h / 2, Math.min(R.w, R.h) * 0.35, R.x + R.w / 2, R.y + R.h / 2, Math.max(R.w, R.h) * 0.7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = g; ctx.fillRect(R.x, R.y, R.w, R.h); }
        ctx.restore();
        return r;
    };
});

/* ============================== 2) ÉP XUNG (mới): QUÁ TẢI → XẢ NHIỆT ============================== */
// 5 giây quá tải: tốc đánh +80%, mỗi đòn trúng tích 1 NHIỆT (tối đa 25, mỗi nhiệt +2% sát thương) nhưng nhận thêm 10% sát thương.
// Hết giờ: XẢ NHIỆT — nổ quanh người, càng nhiều nhiệt càng to. Mould Tia Lazer: Laser Tuyệt Diệt.
vtOverclock = function (p) {
    const w = getCurrentWeapon(p); if (!w || w.id !== 'VANTUONG' || !w.mods) { if (!p.isBot) floatText(p.x, p.y - 30, 'Cần cầm Vạn Tượng', '#94a3b8', 12); return; }
    if (vtCur(w) === 'beam') return vtLineAnnihilate(p);
    p.vtOC = { until: world.time + 5, heat: 0, ht: 0, c1: VT[w.mods[0]].col, c2: VT[w.mods[1]].col };
    W11.push({ kind: 'ocStart', owner: p.id, t: 0.5, T: 0.5 });
    floatText(p.x, p.y - 56, '⚡ ÉP XUNG · QUÁ TẢI!', '#fca5a5', 16); AudioSys.playAt('rail', p.x, p.y, 0.6); addShake(4);
};
function vtVent(p) {
    const O = p.vtOC; p.vtOC = null; if (!O || p.hp <= 0) return;
    const R = 120 + O.heat * 4, dmg = (24 + O.heat * 5) * (p.meleeMult || 1);
    enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < R + e.radius) { dealDamage(e, dmg, p.id, { knock: 480, angle: Math.atan2(e.y - p.y, e.x - p.x) }); if (O.heat >= 15) e.stun = Math.max(e.stun, 0.6); } });
    for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < R) bullets.splice(j, 1); }
    W11.push({ kind: 'vent', owner: p.id, x: p.x, y: p.y, R, c1: O.c1, c2: O.c2, t: 0.6, T: 0.6 });
    flash('#fb7185', 0.1); addShake(6 + O.heat * 0.4); AudioSys.playAt('explosion', p.x, p.y, 0.6);
    floatText(p.x, p.y - 56, `🔥 XẢ NHIỆT ×${O.heat}`, '#fdba74', 16);
}
CARDS.overclock.desc = 'QUÁ TẢI 5 giây: tốc đánh +80%, mỗi đòn trúng tích 1 NHIỆT (tối đa 25, mỗi nhiệt +2% sát thương) nhưng nhận thêm 10% sát thương. Hết giờ XẢ NHIỆT: nổ quanh người, nhiệt càng cao nổ càng to (≥15 nhiệt gây choáng). Mould Tia Lazer: LASER TUYỆT DIỆT.';
const _fireWeaponR11 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const r = _fireWeaponR11(p, w, ang, charge, enemy);
    if (w && w.id === 'VANTUONG' && p.vtOC && p.vtOC.until > world.time && (charge || 0) < 0.9) p.cooldown *= 0.55;
    return r;
};
const _dealDamageR11 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && atk !== target && atk.vtOC && atk.vtOC.until > world.time && !opts.zone) {
        dmg *= 1 + atk.vtOC.heat * 0.02;
        if (world.time - atk.vtOC.ht > 0.06 && target.hp > 0) { atk.vtOC.ht = world.time; atk.vtOC.heat = Math.min(25, atk.vtOC.heat + 1); }
    }
    if (target && target.vtOC && target.vtOC.until > world.time && atk && atk !== target) dmg *= 1.1;
    return _dealDamageR11(target, dmg, attackerId, opts);
};

/* ============================== 3) ĐỔI MOULD HỒI 1 GIÂY ============================== */
const _vtSwapR11 = vtSwap;
vtSwap = function (p, w) {
    if (!p._vtMirror) {
        if (p.vtSwapCd > world.time) { if (!p.isBot) floatText(p.x, p.y - 30, `🔄 ${(p.vtSwapCd - world.time).toFixed(1)}s`, '#94a3b8', 11); return; }
        p.vtSwapCd = world.time + 1;
    }
    return _vtSwapR11(p, w);
};

/* ============================== CẬP NHẬT + VẼ ============================== */
const _resetRoundR11 = resetPlayerForRound;
resetPlayerForRound = function (p) { p.vtOC = null; p.vtSwapCd = 0; return _resetRoundR11(p); };
const _upeR11 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR11(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => { if (p.vtOC && (p.hp <= 0 || p.vtOC.until <= world.time || getCurrentWeapon(p).id !== 'VANTUONG')) vtVent(p); else if (p.vtOC && Math.random() < 0.3) spark(p.x + (Math.random() - 0.5) * 20, p.y + (Math.random() - 0.5) * 20, Math.random() < 0.5 ? p.vtOC.c1 : '#fca5a5', 1, 120); });
    const me = localPlayer(), b = $('vt-swap');
    if (b && b.style.display !== 'none' && me && me.vtSwapCd > world.time) b.textContent = (me.vtSwapCd - world.time).toFixed(1);
};
const _drawW2FxR11 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR11(now);
    ctx.save(); ctx.lineCap = 'round';
    players.forEach(p => {
        const O = p.vtOC; if (!O || p.hp <= 0) return;
        const left = Math.max(0, O.until - world.time) / 5, hk = O.heat / 25;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, p.radius + 26 + hk * 20); g.addColorStop(0, `rgba(251,113,133,${0.25 + hk * 0.35})`); g.addColorStop(1, 'rgba(251,113,133,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 26 + hk * 20, 0, Math.PI * 2); ctx.fill();
        [O.c1, O.c2].forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 3; const a0 = now * (k ? -9 : 9); ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 8 + k * 5, a0, a0 + 1.6 + hk * 3); ctx.stroke(); });
        ctx.restore();
        ctx.strokeStyle = 'rgba(15,23,42,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 20, -Math.PI / 2, Math.PI * 1.5); ctx.stroke();
        ctx.strokeStyle = hk > 0.6 ? '#ef4444' : hk > 0.3 ? '#fb923c' : '#fde047'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hk); ctx.stroke();
        ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); ctx.stroke();
        ctx.font = `800 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fecaca'; ctx.fillText(`🔥${O.heat}`, p.x, p.y - p.radius - 30);
    });
    W11.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = 1 - Math.max(0, f.t) / f.T, k = 1 - u;
        if (f.kind === 'ocStart') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(252,165,165,${k})`; ctx.lineWidth = 5 * k + 1; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius + 10 + u * 60, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * 0.785 + u * 2; ctx.beginPath(); ctx.moveTo(o.x + Math.cos(a) * (o.radius + 6), o.y + Math.sin(a) * (o.radius + 6)); ctx.lineTo(o.x + Math.cos(a) * (o.radius + 18 + u * 50), o.y + Math.sin(a) * (o.radius + 18 + u * 50)); ctx.stroke(); } ctx.restore(); }
        else if (f.kind === 'vent') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.R); g.addColorStop(0, `rgba(255,255,255,${0.8 * k})`); g.addColorStop(0.4, `rgba(251,146,60,${0.5 * k})`); g.addColorStop(1, 'rgba(239,68,68,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.R * (0.4 + u * 0.6), 0, Math.PI * 2); ctx.fill(); [f.c1, f.c2].forEach((c, j) => { ctx.strokeStyle = c; ctx.globalAlpha = k; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, f.R * (0.3 + u * 0.8) + j * 10, 0, Math.PI * 2); ctx.stroke(); }); ctx.restore(); }
    });
    ctx.restore();
};
const _skillProfileR11 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (id === 'overclock' && !(w && w.mods && vtCur(w) === 'beam')) return { aim: null, shape: 'selfaoe', aoe: 120, col: '252,165,165', tag: p.vtOC ? `🔥 NHIỆT ${p.vtOC.heat}` : '⚡ QUÁ TẢI → XẢ NHIỆT' };
    return _skillProfileR11(p, id);
};
