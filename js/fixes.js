/** ==================== SỬA LỖI QUAN TRỌNG · BÁO LỘ VỊ TRÍ · LỢI THẾ BẬC THẦY ĐA HÌNH ====================
 *  Nạp sau battleground.js.
 */

/* ============================== 1) ONLINE: MÁY KHÁCH KẸT Ở MÀN VẬN MỆNH (MC) ============================== */
// Nếu chủ phòng đã vào trận trước khi máy khách quay xong vận mệnh, màn MC không bao giờ tự tắt → không chơi được.
const _applySnapFix = applySnapshot;
applySnapshot = function (s) {
    const r = _applySnapFix(s);
    if (['COUNTDOWN', 'PLAYING', 'KO', 'ROUND_OVER'].includes(gameState)) {
        const stuck = ['destiny-screen', 'augment-screen'].some(id => $(id) && !$(id).classList.contains('hidden'));
        if (stuck) { showScreen(null); guestDestinyRolling = false; }
    }
    return r;
};

/* ============================== 2) BẢNG CHIẾN THUẬT KHÔNG BAO GIỜ KẸT ============================== */
function tacFail(where, e) {
    try { console.warn('[bảng chiến thuật]', where, e); } catch (_) {}
    picker = null;
    const me = localPlayer(); if (me) floatText(me.x, me.y - 40, 'Bảng chiến thuật gặp lỗi — đã đóng', '#fca5a5', 13);
}
const _drawPickerFix = drawPicker;
drawPicker = function (me, W, H, now) { ctx.save(); try { return _drawPickerFix(me, W, H, now); } catch (e) { tacFail('vẽ', e); } finally { ctx.restore(); } };
const _pickerTapFix = pickerTap;
pickerTap = function (cx, cy) { try { return _pickerTapFix(cx, cy); } catch (e) { tacFail('chạm', e); return true; } };
const _updateTacFix = update;
update = function (rawDt) {
    if (picker) {
        const me = localPlayer();
        const t0 = picker.t0 !== undefined ? picker.t0 : (picker.t0 = world.time);
        // tự đóng: chết, hết hiệp / không còn trong trận, hoặc để mở quá lâu
        if (!me || me.hp <= 0 || !['PLAYING', 'KO'].includes(gameState) || world.time - t0 > 30) picker = null;
    }
    return _updateTacFix(rawDt);
};
const _initRoundFix = initRound;
initRound = function () { picker = null; return _initRoundFix(); };

/* ============================== 3) BÁO KHI BẠN BỊ LỘ VỊ TRÍ ============================== */
function exposedReasons(me) {
    const st = me.st || {}, now = world.time, out = [];
    if (st.reveal > 0) out.push(['📡 Lộ vị trí', st.reveal]);
    let spot = 0; if (st.spot) for (const k in st.spot) spot = Math.max(spot, st.spot[k] - now);
    if (spot > 0) out.push(['👁 Bị theo dõi', spot]);
    if (st.mark > 0) out.push(['🎯 Bị đánh dấu', st.mark]);
    if (st.exposed > 0 && inBush(me.x, me.y)) out.push(['🌿 Lộ khỏi bụi', st.exposed]);
    if (me.loudT > now) out.push(['🔊 Tiếng súng lớn', me.loudT - now]);
    return out;
}
const _drawHUDExpo = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUDExpo(W, H, now);
    const me = localPlayer(); if (!me || me.hp <= 0 || !['PLAYING', 'KO'].includes(gameState)) { if (me) me._expo = false; return; }
    const R = exposedReasons(me), on = R.length > 0;
    if (on && !me._expo) { AudioSys.play('tick', 0.35); floatText(me.x, me.y - 46, '👁 BẠN BỊ LỘ!', '#f87171', 15); }
    me._expo = on;
    if (!on) return;
    const txt = '👁 BẠN ĐANG BỊ LỘ VỊ TRÍ · ' + R.map(([n, t]) => `${n} ${Math.ceil(t)}s`).join(' · ');
    ctx.save(); ctx.font = `800 ${isTouch ? 11 : 13}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(txt).width + 26, y = (typeof BG !== 'undefined' && BG.on) ? 74 : 62, pulse = 0.75 + Math.sin(now * 8) * 0.25;
    rrect(ctx, W / 2 - tw / 2, y - 13, tw, 26, 9); ctx.fillStyle = `rgba(127,29,29,${0.78 * pulse + 0.1})`; ctx.fill();
    ctx.strokeStyle = 'rgba(248,113,113,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fee2e2'; ctx.fillText(txt, W / 2, y + 1); ctx.restore();
};
const _drawW2FxExpo = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxExpo(now);
    const me = localPlayer(); if (!me || me.hp <= 0 || !me._expo) return;
    ctx.save(); ctx.strokeStyle = `rgba(248,113,113,${0.45 + Math.sin(now * 8) * 0.3})`; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now * 30;
    ctx.beginPath(); ctx.arc(me.x, me.y, me.radius + 13, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
};

/* ============================== 4) LỢI THẾ MỚI: BẬC THẦY ĐA HÌNH ============================== */
const POLY_WEPS = ['UMBRELLA', 'GUNBLADE', 'SUNMOON', 'AXECANNON', 'AXEGUN', 'SANJIE', 'MULTICUBE'];
ADVANTAGES.polyMaster = { icon: '🔄', name: 'Bậc Thầy Đa Hình', desc: 'Chỉ dùng được VŨ KHÍ ĐA HÌNH (Huyền Cơ · Gunblade · Nhật Nguyệt Cung · Pháo Rìu · Rìu Săn · Tam Khúc Côn · Đa Khí Cụ) — mỗi hiệp khởi đầu với 2 cái khác nhau, hòm thính chỉ ra vũ khí đa hình. Giống Bậc Thầy Vũ Khí: có sẵn đủ 3 kỹ năng (Kỹ Thuật Cận Chiến + Trang Bị Phụ + Kỹ Thuật Cao), dùng được ở MỌI DẠNG, không chọn nâng cấp nữa. Nội tại ĐA HÌNH: mỗi lần vũ khí đổi dạng → +20% sát thương 3 giây, tăng tốc 1 giây, mọi kỹ năng hồi nhanh 1.5 giây.' };
ADV_IDS.push('polyMaster');
const isPoly = p => !!p && p.adv === 'polyMaster';
const pickPoly = except => { const L = POLY_WEPS.filter(id => id !== except); return L[Math.floor(Math.random() * L.length)]; };
const _makeWeaponPoly = makeWeapon;
makeWeapon = function (id, p) { if (isPoly(p) && id && id !== 'NONE' && !POLY_WEPS.includes(id)) id = pickPoly(); return _makeWeaponPoly(id, p); };
const _wepAllowedPoly = wepAllowed;
wepAllowed = function (p, w) { if (isPoly(p) && w && w.id !== 'NONE' && !POLY_WEPS.includes(w.id)) return false; return _wepAllowedPoly(p, w); };
const _resetRoundPoly = resetPlayerForRound;
resetPlayerForRound = function (p) {
    _resetRoundPoly(p);
    if (isPoly(p)) { const a = pickPoly(), b = pickPoly(a); p.inventory = [makeWeapon(a, p), makeWeapon(b, p)]; p.weaponIdx = 0; p._pmForm = null; }
};
const _applyBuildPoly = applyBuild;
applyBuild = function (p) {
    if (isPoly(p)) { p.build = (p.build || []).filter(id => WM_CARDS.includes(id) || (CARDS[id] && CARDS[id].kind !== 'S')); WM_CARDS.forEach(c => { if (!p.build.includes(c)) p.build.push(c); }); }
    const r = _applyBuildPoly(p);
    if (isPoly(p)) { p.dmgMult *= 1.1; p.moveMult *= 1.05; }
    return r;
};
const _skipsPickPoly = skipsPick;
skipsPick = function (p) { return isPoly(p) || _skipsPickPoly(p); };
// 3 kỹ năng Bậc Thầy dùng được ở mọi dạng của vũ khí đa hình
const polyType = w => w.id === 'SANJIE' ? 'MELEE' : w.id === 'MULTICUBE' ? cubeForm(w).type : (w.id === 'AXECANNON' || w.id === 'AXEGUN') ? ((w.form || 'axe') === 'axe' ? 'MELEE' : 'GUN') : w.id === 'GUNBLADE' ? (w.form === 'blade' ? 'MELEE' : 'GUN') : w.id === 'SUNMOON' ? ((w.form || 'sun') === 'sun' ? 'GUN' : 'MELEE') : 'MELEE';
const _castSkillPoly = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot], w = getCurrentWeapon(p);
    if (isPoly(p) && s && w && POLY_WEPS.includes(w.id) && (s.id === 'meleeTech' || s.id === 'gunMod')) {
        w.type = s.id === 'meleeTech' ? 'MELEE' : 'GUN';
        try { return _castSkillPoly(p, slot, aimVec); } finally { w.type = polyType(w); }
    }
    return _castSkillPoly(p, slot, aimVec);
};
// nội tại: mỗi lần đổi dạng
const _upePoly = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upePoly(dt);
    if (gameState !== 'PLAYING') return;
    players.forEach(p => {
        if (!isPoly(p) || p.hp <= 0) return;
        const w = getCurrentWeapon(p); if (!w || !POLY_WEPS.includes(w.id)) { p._pmForm = null; return; }
        const key = w.id + ':' + (w.form === undefined ? (w.id === 'GUNBLADE' ? 'gun' : w.id === 'SUNMOON' ? 'sun' : (w.id === 'AXECANNON' || w.id === 'AXEGUN') ? 'axe' : 0) : w.form);
        if (p._pmForm && p._pmForm !== key && p._pmForm.split(':')[0] === w.id) {
            p.pmBuffT = world.time + 3; p.st.haste = Math.max(p.st.haste || 0, 1);
            (p.skills || []).forEach(s => { if (s.cd > 0) s.cd = Math.max(0, s.cd - 1.5); });
            floatText(p.x, p.y - 60, '🔄 ĐA HÌNH +20%', '#a5f3fc', 13); ring(p.x, p.y, 6, 60, '#67e8f9', 0.4, 4);
        }
        p._pmForm = key;
    });
};
const _dealDamagePoly = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && atk !== target && atk.pmBuffT > world.time) dmg *= 1.2;
    return _dealDamagePoly(target, dmg, attackerId, opts);
};
// quầng xanh khi đang có buff đa hình
const _drawW2FxPoly = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxPoly(now);
    players.forEach(p => { if (p.hp > 0 && p.pmBuffT > world.time && (!p.st.invis || p === localPlayer())) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(103,232,249,${0.35 + Math.sin(now * 10) * 0.15})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 7, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } });
};

/* ============================== VŨ KHÍ ĐA HÌNH LÀ NHÁNH RIÊNG ============================== */
// Bậc Thầy Cận Chiến / Bậc Thầy Tầm Xa không lấy được vũ khí đa hình
const noPoly = p => !!p && (p.adv === 'meleeMaster' || p.adv === 'rangeMaster');
const _makeWeaponNoPoly = makeWeapon;
makeWeapon = function (id, p) {
    if (noPoly(p) && POLY_WEPS.includes(id)) id = weightedWeapon(W => !POLY_WEPS.includes(W.id) && (p.adv === 'meleeMaster' ? isMeleeWep(W) : isGunWep(W)));
    return _makeWeaponNoPoly(id, p);
};
const _wepAllowedNoPoly = wepAllowed;
wepAllowed = function (p, w) { if (noPoly(p) && w && POLY_WEPS.includes(w.id)) return false; return _wepAllowedNoPoly(p, w); };
['meleeMaster', 'rangeMaster'].forEach(id => { if (ADVANTAGES[id]) ADVANTAGES[id].desc += ' Không dùng được VŨ KHÍ ĐA HÌNH (nhánh riêng).'; });
