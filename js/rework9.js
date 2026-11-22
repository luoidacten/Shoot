/** ==================== HIỆU CHỈNH ONLINE · 4 MOULD ĐỘC QUYỀN · THẺ ĐỘC QUYỀN THAY LỢI THẾ ====================
 *  Nạp sau rework8.js.
 */

/* ============================== 1) 4 mould mới chỉ dành cho Chỉ Huy Sư Đoàn ============================== */
const VT_EXCL = ['eshield', 'esword', 'egun', 'beam'];
VT_EXCL.forEach(k => { VT[k].excl = true; VT[k].bt += ' · 🎖️ ĐỘC QUYỀN CHỈ HUY'; });
const _makeWeaponR9 = makeWeapon;
makeWeapon = function (id, p) {
    const w = _makeWeaponR9(id, p);
    if (w && w.id === 'VANTUONG' && w.mods && !isCmd(p) && w.mods.some(k => VT[k].excl)) { // gậy thường: chỉ 12 mould gốc
        const pick = L => L[Math.floor(Math.random() * L.length)], a = pick(VT_IDS.filter(k => VT[k].type === 'MELEE' && !VT[k].excl)), b = pick(VT_IDS.filter(k => VT[k].type === 'GUN' && !VT[k].excl));
        w.mods = Math.random() < 0.5 ? [a, b] : [b, a]; w.mi = 0; vtSetType(w);
    }
    return w;
};
WEAPONS.VANTUONG.desc = WEAPONS.VANTUONG.desc.replace(/Gậy biến hình \d+ MOULD \([^)]*\)/, `Gậy biến hình 12 MOULD (${VT_IDS.filter(k => !VT[k].excl).map(k => VT[k].icon + ' ' + VT[k].name).join(' · ')}) + 4 mould ĐỘC QUYỀN của thẻ Chỉ Huy Sư Đoàn (${VT_EXCL.map(k => VT[k].icon + ' ' + VT[k].name).join(' · ')})`);

/* ============================== 2) Thẻ độc quyền xoá lợi thế cũ, thay bằng lợi thế của thẻ ============================== */
ADVANTAGES.sevenAdv = { icon: '✂️', name: 'Sát Thủ Số 7', desc: CARDS.seven.desc, exclusive: true };
ADVANTAGES.cmdAdv = { icon: '🎖️', name: 'Chỉ Huy Sư Đoàn', desc: CARDS.commander.desc, exclusive: true };
CARDS.seven.desc += ' ⚠ Chọn thẻ này sẽ XOÁ lợi thế hiện tại, thay bằng lợi thế Sát Thủ Số 7.';
CARDS.commander.desc += ' ⚠ Chọn thẻ này sẽ XOÁ lợi thế hiện tại, thay bằng lợi thế Chỉ Huy Sư Đoàn.';
const _applyBuildR9 = applyBuild;
applyBuild = function (p) {
    const want = isSeven(p) ? 'sevenAdv' : isCmd(p) ? 'cmdAdv' : null;
    if (want && p.adv !== want) {
        const old = ADVANTAGES[p.adv]; p.advOld = p.adv; p.adv = want; p.minimap = false;
        if (gameState === 'PLAYING' || gameState === 'AUG_DONE' || gameState === 'COUNTDOWN') floatText(p.x, p.y - 70, `${old ? old.icon + ' ' + old.name + ' → ' : ''}${ADVANTAGES[want].icon} ${ADVANTAGES[want].name}`, '#fde68a', 13);
    }
    return _applyBuildR9(p);
};

/* ============================== 3) Bảng Hiệu Chỉnh cho máy khách online ============================== */
// chủ phòng: khách bấm Hiệu Chỉnh → gửi lệnh mở bảng về máy khách; khách chọn xong → gửi lựa chọn lên chủ phòng
const _vtCalibrateR9 = vtCalibrate;
vtCalibrate = function (p) {
    const w = getCurrentWeapon(p);
    if (p && p.remote && !p.isBot && net.role === 'host' && w && w.id === 'VANTUONG' && w.mods) { netSendTo(p.id, { t: 'vtCal', mods: w.mods.slice() }); return; }
    return _vtCalibrateR9(p);
};
const _vtCalApplyR9 = vtCalApply;
vtCalApply = function (p, sel) {
    if (net.role === 'guest') { netSend({ t: 'vtCalSet', sel }); return; }
    return _vtCalApplyR9(p, sel);
};
const _onNetDataR9 = onNetData;
onNetData = function (m) {
    if (m && m.t === 'vtCal' && Array.isArray(m.mods)) { vtCal = { sel: m.mods.filter(k => VT[k]).slice(0, 2) }; $('vt-cal').style.display = 'flex'; vtCalRender(); AudioSys.play('select', 0.4); return; }
    return _onNetDataR9(m);
};
const _onHostDataR9 = onHostData;
onHostData = function (g, m) {
    if (m && m.t === 'vtCalSet') {
        const p = players.find(q => q.id === g.id), sel = Array.isArray(m.sel) ? m.sel.filter(k => typeof k === 'string' && VT[k]) : [];
        if (p && sel.length === 2 && sel[0] !== sel[1] && has(p, 'calibrate') && (isCmd(p) || !sel.some(k => VT[k].excl))) vtCalApply(p, sel);
        return;
    }
    return _onHostDataR9(g, m);
};
