/** ==================== VẠN TƯỢNG +4 MOULD · CHỈ HUY SƯ ĐOÀN · SÁT THỦ SỐ 7 (chỉnh) · MA ĐAO GIẢI PHÓNG GĐ3 ====================
 *  Nạp sau rework6.js.
 */
const W11 = [];

/* ============================== 1) VẠN TƯỢNG LÀ VŨ KHÍ ĐA HÌNH ============================== */
window.addEventListener('load', () => { if (typeof POLY_WEPS !== 'undefined' && !POLY_WEPS.includes('VANTUONG')) POLY_WEPS.push('VANTUONG'); }); // POLY_WEPS khai báo trong fixes.js (nạp sau)

/* ============================== 2) +4 MOULD (tổng 16: 8 gần · 8 xa) ============================== */
Object.assign(VT, {
    eshield: { name: 'KHIÊN NĂNG LƯỢNG', icon: '🛡️', col: '#38bdf8', type: 'MELEE', buff: { inn: 0.8 }, bt: 'nhận ít hơn 20%, chắn đạn phía trước',
        A: (p, w, a, m) => { meleeBook(p, w, a, 24); vtSlash(p, a, 85, '#7dd3fc', 1, 1.3); const h = cubeArc(p, a, 85, 1.3, 16 * vM(p) * m, { knock: 340, stun: 0.25 }); vtDur(p, w, h); AudioSys.playAt('block', p.x, p.y, 0.45); },
        S: { fn: p => { p.st.shield = Math.min(150, (p.st.shield || 0) + 50); p.st.shieldT = Math.max(p.st.shieldT || 0, 4); vtTxt(p, '🛡️ +50 KHIÊN', '#7dd3fc'); ring(p.x, p.y, 6, 50, '#38bdf8', 0.4, 4); } },
        K: ['M', 'PHÁO ĐÀI NĂNG LƯỢNG', { fn: p => { W11.push({ kind: 'dome', owner: p.id, x: p.x, y: p.y, R: 120, t: 3.5, T: 3.5 }); AudioSys.playAt('block', p.x, p.y, 0.7); } }],
        prof: { aim: null, shape: 'selfaoe', aoe: 120 } },
    esword: { name: 'ĐẦU KIẾM', icon: '🗡️', col: '#e0f2fe', type: 'MELEE', buff: { out: 1.12 }, bt: 'sát thương +12%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 18); vtSlash(p, a, 105, '#e0f2fe'); const h = cubeArc(p, a, 105, 1.1, 19 * vM(p) * m, { knock: 160 }); vtDur(p, w, h); p.vtSwN = (p.vtSwN || 0) + 1; if (p.vtSwN % 3 === 0) htBullet(p, a, { damage: 22 * vM(p) * m, speed: 24, size: 6, pierce: true, color: '#e0f2fe', life: 0.5, trail: 40 }); AudioSys.playAt('swing', p.x, p.y, 0.45); },
        S: { fn: p => { const a = p.angle; p.dashTime = 0.16; p.dashAngle = a; p.shotQueue.push({ t: 0.16, fn: () => { vtSlash(p, a, 115, '#f8fafc', 1, 1.2); cubeArc(p, a, 115, 1.2, 24 * vM(p), { knock: 220 }); } }); vtTxt(p, '🗡️ BẠT KIẾM'); } },
        K: ['M', 'KIẾM VŨ', { mirror: true, fn: p => { for (let i = 0; i < 6; i++) p.shotQueue.push({ t: 0.25 + i * 0.1, fn: () => { if (p.hp <= 0) return; const e = vtNear(p, 520); const a = e ? Math.atan2(e.y - p.y, e.x - p.x) : p.angle + (i - 2.5) * 0.25; htBullet(p, a, { damage: 20 * vM(p), speed: 26, size: 6, pierce: true, color: '#bae6fd', life: 0.7, trail: 50 }); AudioSys.playAt('whoosh', p.x, p.y, 0.25); } }); W11.push({ kind: 'swords', owner: p.id, t: 0.85, T: 0.85 }); } }],
        prof: { aim: null, shape: 'selfaoe', aoe: 520 } },
    egun: { name: 'ĐẦU SÚNG', icon: '🔫', col: '#fbbf24', type: 'GUN', buff: { spd: 1.08 }, bt: 'chạy nhanh +8%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 14); for (let i = 0; i < 2; i++) p.shotQueue.push({ t: i * 0.07, fn: () => { if (p.hp <= 0) return; cubeShot(p, p.angle + (Math.random() - 0.5) * 0.05, { speed: 26, damage: 11 * vD(p) * m, range: 520, color: '#fde047', size: 3 }); AudioSys.playAt('smg', p.x, p.y, 0.15); } }); },
        S: { mirror: true, fn: p => { for (let i = -3; i <= 2; i++) cubeShot(p, p.angle + (i + 0.5) * 0.11, { damage: 10 * vD(p), range: 420, color: '#fde047' }); AudioSys.playAt('shotgun', p.x, p.y, 0.4); vtTxt(p, '🔫 XẢ QUẠT'); } },
        K: ['G', 'TRỌNG SÚNG LIÊN THANH', { fn: p => { p.vtGat = { t: 2, tick: 0 }; p.st.slow = Math.max(p.st.slow || 0, 2); } }],
        prof: { aim: 'dir', R: 520, shape: 'cone', half: 0.12 } },
    beam: { name: 'TIA LAZER', icon: '〰️', col: '#e879f9', type: 'GUN', buff: { out: 1.08 }, bt: 'sát thương +8%',
        A: (p, w, a, m) => { meleeBook(p, w, a, 30); p.vtBeam = { t: 0.5, tick: 0, dmg: 5 * vD(p) * m, R: 420, w: 8 }; },
        S: { fn: p => { p.vtSweep = { t: 0.6, a0: p.angle - 1.05, tick: 0 }; vtTxt(p, '〰️ QUÉT LAZER'); } },
        K: ['G', 'QUANG TRỤ', { fn: p => { p.vtBeam = { t: 2, tick: 0, dmg: 9 * vD(p), R: 650, w: 22, big: true }; p.st.root = Math.max(p.st.root || 0, 2); AudioSys.playAt('rail', p.x, p.y, 0.6); } }],
        prof: { aim: 'dir', R: 650, shape: 'line', w: 44 } }
});
VT_IDS.length = 0; VT_IDS.push(...Object.keys(VT));
WEAPONS.VANTUONG.desc = WEAPONS.VANTUONG.desc.replace(/Gậy biến hình \d+ MOULD \([^)]*\)/, `Gậy biến hình ${VT_IDS.length} MOULD (${VT_IDS.map(k => VT[k].icon + ' ' + VT[k].name).join(' · ')})`);
// tia lazer: chiếu theo hướng nhìn, xuyên tường thì dừng
function vtBeamTick(p, a, R, wd, dmg) { const free = rayFree(p.x, p.y, a, R), ex = p.x + Math.cos(a) * free.d, ey = p.y + Math.sin(a) * free.d; enemiesOf(p).forEach(e => { if (!(e.air > 0) && segDist(e.x, e.y, p.x, p.y, ex, ey) < e.radius + wd) dealDamage(e, dmg, p.id, { knock: 20, angle: a }); }); return { ex, ey }; }

/* ============================== 3) THẺ ĐỘC NHẤT: CHỈ HUY SƯ ĐOÀN ============================== */
defS('calibrate', '🎛️', 'Hiệu Chỉnh', 6, 'buff', 'Mở BẢNG HIỆU CHỈNH: chọn 2 mould bất kỳ (trong 16) cho cây Vạn Tượng đang cầm, triển khai ngay.', p => vtCalibrate(p));
CARDS.calibrate.masterOnly = true;
defP('commander', '🎖️', 'Chỉ Huy Sư Đoàn', 'Chỉ xuất hiện ở LẦN CHỌN ĐẦU TIÊN. Cố định 2 cây VẠN TƯỢNG ở 2 túi (không gãy, không ném, không nhặt vũ khí khác). Có ngay: BẬC THẦY (chiêu riêng của mould) · HIỆU CHỈNH (tự chọn 2 mould cho mỗi gậy) · KỸ THUẬT CAO đặc trưng VẠN TƯỢNG QUY NHẤT (2 mould cùng xuất trận 6 giây). Bù lại: KHÔNG BAO GIỜ được chọn nâng cấp.', p => { p.moveMult *= 1.05; });
CARDS.commander.masterOnly = true;
const isCmd = p => !!p && (p.build || []).includes('commander');
function cmdArm(p) { if (!isCmd(p)) return; const ok = (p.inventory || []).length === 2 && p.inventory.every(w => w.id === 'VANTUONG' && w.mods); if (!ok) { p.inventory = [_makeWeaponCmd('VANTUONG', p), _makeWeaponCmd('VANTUONG', p)]; p.weaponIdx = 0; } }
const _makeWeaponCmd = makeWeapon;
makeWeapon = function (id, p) { if (isCmd(p) && id && id !== 'NONE' && id !== 'VANTUONG') id = 'VANTUONG'; return _makeWeaponCmd(id, p); };
const _wepAllowedCmd = wepAllowed;
wepAllowed = function (p, w) { if (isCmd(p) && w && w.id !== 'VANTUONG') return false; return _wepAllowedCmd(p, w); };
const _reduceDurCmd = reduceDurability;
reduceDurability = function (p, wep, amount) { if (isCmd(p) && wep && wep.id === 'VANTUONG') return; return _reduceDurCmd(p, wep, amount); };
const _throwWeaponCmd = throwWeapon;
throwWeapon = function (p, wep, enemy) { if (isCmd(p)) return; return _throwWeaponCmd(p, wep, enemy); };
const _applyBuildCmd = applyBuild;
applyBuild = function (p) {
    if (isCmd(p)) { p.build = p.build.filter(id => id === 'commander' || (CARDS[id] && CARDS[id].kind !== 'S')); ['meleeTech', 'hightech', 'overclock'].forEach(c => { if (!p.build.includes(c)) p.build.push(c); }); }
    const r = _applyBuildCmd(p); cmdArm(p); return r;
};
const _resetRoundCmd = resetPlayerForRound;
resetPlayerForRound = function (p) { const r = _resetRoundCmd(p); cmdArm(p); p.vtFuse = 0; p.vtGat = null; p.vtBeam = null; p.vtSweep = null; p.mdP3 = 0; for (let i = W11.length - 1; i >= 0; i--) if (W11[i].owner === p.id) W11.splice(i, 1); return r; };
const _skipsPickCmd = skipsPick;
skipsPick = function (p) { return isCmd(p) || _skipsPickCmd(p); };
// chỉ ở lần chọn đầu tiên; không ra cùng lúc với Sát Thủ Số 7
const _cardsForPickCmd = cardsForPick;
cardsForPick = function (p, kind, n) {
    const out = _cardsForPickCmd(p, kind, n);
    if (kind === 'build' && pickCount === 0 && !(p.build || []).length && !out.includes('seven') && !['polyMaster', 'weaponMaster', 'rangeMaster', 'meleeMaster'].includes(p.adv) && Math.random() < 0.3 && out.length) out[Math.floor(Math.random() * out.length)] = 'commander';
    return out;
};
const _cardClassCmd = cardClass;
cardClass = function (id, kind, owned) { if (id === 'commander' && kind !== 'stat') return 'skill legend'; return _cardClassCmd(id, kind, owned); };
// Kỹ thuật cao đặc trưng: VẠN TƯỢNG QUY NHẤT — cả 2 mould cùng xuất trận
const _htVT = HT.VANTUONG[1];
HT.VANTUONG = ['ĐỔI MOULD / QUY NHẤT', p => {
    const w = getCurrentWeapon(p);
    if (!isCmd(p) || !w.mods) return _htVT(p);
    p.vtFuse = world.time + 6; const A = VT[w.mods[0]], B = VT[w.mods[1]];
    W11.push({ kind: 'fuse', owner: p.id, t: 0.7, T: 0.7, c1: A.col, c2: B.col });
    [A, B].forEach(M => { try { M.S.fn(p, w); } catch (e) { } });
    floatText(p.x, p.y - 56, `🎖️ VẠN TƯỢNG QUY NHẤT ${A.icon}+${B.icon}`, '#f0abfc', 16); flash('#c084fc', 0.08); addShake(6); AudioSys.playAt('legend', p.x, p.y, 0.5);
}];

/* ---------- HUD Hiệu Chỉnh ---------- */
let vtCal = null;
(function () {
    const st = document.createElement('style');
    st.textContent = `#vt-cal{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 40%,rgba(76,29,149,.35),rgba(2,6,23,.78));backdrop-filter:blur(3px);font-family:system-ui,sans-serif}
#vt-cal .box{width:min(760px,94vw);max-height:90vh;overflow:auto;padding:18px 18px 14px;border-radius:18px;background:linear-gradient(160deg,rgba(30,27,75,.96),rgba(15,23,42,.97));border:1px solid rgba(196,181,253,.45);box-shadow:0 0 0 1px rgba(255,255,255,.04) inset,0 20px 60px rgba(0,0,0,.6),0 0 40px rgba(167,139,250,.25)}
#vt-cal h2{margin:0 0 2px;font-size:20px;letter-spacing:.08em;color:#f5f3ff;text-align:center}#vt-cal .sub{color:#a5b4fc;font-size:12px;text-align:center;margin-bottom:12px}
#vt-cal .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}#vt-cal .col h3{margin:0 0 8px;font-size:12px;letter-spacing:.2em;color:#c4b5fd;text-align:center}
#vt-cal .m{display:flex;gap:10px;align-items:center;width:100%;margin:0 0 6px;padding:6px 9px;border-radius:12px;border:1px solid rgba(148,163,184,.25);background:rgba(15,23,42,.7);color:#e2e8f0;text-align:left;cursor:pointer;transition:transform .08s,border-color .15s,background .15s}
#vt-cal .m:hover{transform:translateY(-1px);border-color:rgba(196,181,253,.7)}#vt-cal .m.on{border-color:var(--c);background:linear-gradient(90deg,color-mix(in srgb,var(--c) 28%,transparent),rgba(15,23,42,.75));box-shadow:0 0 14px color-mix(in srgb,var(--c) 45%,transparent)}
#vt-cal .ic{font-size:19px;width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:rgba(255,255,255,.06)}#vt-cal .nm{font-weight:800;font-size:13px}#vt-cal .bf{font-size:11px;color:#94a3b8}#vt-cal .k{font-size:11px;color:#c4b5fd}
#vt-cal .bar{position:sticky;bottom:-14px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;margin:10px -18px -14px;padding:10px 12px 12px;background:linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,.97) 30%);border-radius:0 0 18px 18px}#vt-cal .slot{min-width:130px;padding:8px 10px;border-radius:12px;border:1px dashed rgba(196,181,253,.5);color:#ddd6fe;text-align:center;font-weight:700}
#vt-cal .go{padding:10px 22px;border-radius:12px;border:0;font-weight:900;letter-spacing:.06em;color:#1e1b4b;background:linear-gradient(90deg,#c4b5fd,#f0abfc);cursor:pointer}#vt-cal .go:disabled{opacity:.4;cursor:default}#vt-cal .x{padding:10px 16px;border-radius:12px;border:1px solid rgba(148,163,184,.4);background:transparent;color:#cbd5e1;cursor:pointer}
@media (max-width:560px){#vt-cal .cols{grid-template-columns:1fr}}`;
    document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'vt-cal'; document.body.appendChild(d);
    ['pointerdown', 'mousedown', 'touchstart', 'click', 'wheel'].forEach(ev => d.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
    window.addEventListener('keydown', e => { if (vtCal && e.code === 'Escape') { vtCalClose(); e.stopPropagation(); } }, { capture: true });
})();
function vtCalRender() {
    const d = $('vt-cal'); if (!d || !vtCal) return;
    const card = k => { const M = VT[k], on = vtCal.sel.includes(k); return `<button class="m ${on ? 'on' : ''}" style="--c:${M.col}" data-k="${k}"><span class="ic">${M.icon}</span><span><div class="nm" style="color:${M.col}">${M.name}</div><div class="bf">Buff: ${M.bt}</div><div class="k">${M.K[0] === 'M' ? 'Bậc Thầy' : 'Trang Bị Phụ'}: ${M.K[1]}</div></span></button>`; };
    const near = VT_IDS.filter(k => VT[k].type === 'MELEE'), far = VT_IDS.filter(k => VT[k].type === 'GUN');
    const slot = i => { const k = vtCal.sel[i]; return `<div class="slot">${k ? VT[k].icon + ' ' + VT[k].name : `MOULD ${i + 1}`}</div>`; };
    d.innerHTML = `<div class="box"><h2>🎛️ HIỆU CHỈNH VẠN TƯỢNG</h2><div class="sub">Chọn 2 mould triển khai cho cây gậy đang cầm · trận đấu vẫn tiếp diễn</div><div class="cols"><div class="col"><h3>⚔ ĐÁNH GẦN</h3>${near.map(card).join('')}</div><div class="col"><h3>🎯 ĐÁNH XA</h3>${far.map(card).join('')}</div></div><div class="bar">${slot(0)}${slot(1)}<button class="go" ${vtCal.sel.length === 2 ? '' : 'disabled'}>TRIỂN KHAI</button><button class="x">HỦY</button></div></div>`;
    d.querySelectorAll('.m').forEach(b => b.onclick = () => { const k = b.dataset.k, s = vtCal.sel, i = s.indexOf(k); if (i >= 0) s.splice(i, 1); else { if (s.length >= 2) s.shift(); s.push(k); } AudioSys.play('tick', 0.3); vtCalRender(); });
    d.querySelector('.go').onclick = () => { if (vtCal.sel.length === 2) vtCalApply(localPlayer(), vtCal.sel.slice()); vtCalClose(); };
    d.querySelector('.x').onclick = vtCalClose;
}
function vtCalClose() { vtCal = null; const d = $('vt-cal'); if (d) d.style.display = 'none'; }
function vtCalApply(p, sel) {
    const w = p && getCurrentWeapon(p); if (!w || w.id !== 'VANTUONG' || p.hp <= 0) return;
    w.mods = sel; w.mi = 0; vtSetType(w); const M = VT[sel[0]];
    try { M.S.fn(p, w); } catch (e) { }
    W11.push({ kind: 'fuse', owner: p.id, t: 0.6, T: 0.6, c1: VT[sel[0]].col, c2: VT[sel[1]].col });
    floatText(p.x, p.y - 56, `🎛️ TRIỂN KHAI ${VT[sel[0]].icon} ${VT[sel[1]].icon}`, '#c4b5fd', 15); AudioSys.playAt('rail', p.x, p.y, 0.4);
}
function vtCalibrate(p) {
    const w = getCurrentWeapon(p);
    if (!w || w.id !== 'VANTUONG') { if (!p.isBot) floatText(p.x, p.y - 30, 'Cần cầm Vạn Tượng', '#94a3b8', 12); return; }
    if (p === localPlayer() && !p.isBot && net.role !== 'guest') { vtCal = { sel: w.mods.slice() }; $('vt-cal').style.display = 'flex'; vtCalRender(); AudioSys.play('select', 0.4); return; }
    // bot / người chơi từ xa: tự chọn 1 gần + 1 xa khác bộ hiện tại
    const pick = L => L[Math.floor(Math.random() * L.length)], a = pick(VT_IDS.filter(k => VT[k].type === 'MELEE')), b = pick(VT_IDS.filter(k => VT[k].type === 'GUN'));
    vtCalApply(p, [a, b]);
}

/* ============================== 4) SÁT THỦ SỐ 7: túi 1 Ma Đao · túi 2 Kéo · phối hợp + kỹ năng định hướng ============================== */
CARDS.seven.desc = 'Chỉ xuất hiện ở LẦN CHỌN ĐẦU TIÊN. Túi 1: MA ĐAO NGÀN LƯỠI · Túi 2: KÉO — không gãy, không ném, không nhặt vũ khí khác. Có ngay: BẬC THẦY · KỸ THUẬT CAO · VẠN ĐAO QUY NHẤT (kỹ năng định hướng: thu toàn bộ mảnh đao rồi phóng thẳng). Phối hợp SONG NHẬN: Kéo đánh trúng để lại mảnh Ma Đao lên địch và nạp Giải Phóng; đổi vũ khí tung Xẻ Gió. Chạy +10%. Bù lại: KHÔNG BAO GIỜ được chọn nâng cấp.';
defS('mdBlades', '⚔️', 'Vạn Đao Quy Nhất', 9, 'engage', 'Thu toàn bộ mảnh Ma Đao (cả mảnh đang găm trên địch) rồi phóng thẳng theo hướng chọn; càng nhiều mảnh càng mạnh, mảnh bay về cũng gây sát thương.', p => {
    const i = p.inventory.findIndex(w => w.id === 'MADAO'); if (i < 0) return; if (p.weaponIdx !== i) p.weaponIdx = i;
    if (!mdShards(p).length) for (let k = 0; k < 4; k++) mdDrop(p, p.x, p.y, 1); // không có mảnh: tách 4 mảnh gốc
    p.mdExCd = 0; mdExclusive(p); p.mdExCd = 0;
}, 650);
CARDS.mdBlades.aim = 'dir'; CARDS.mdBlades.aimR = 650; CARDS.mdBlades.masterOnly = true;
const _sevenArmR7 = sevenArm;
sevenArm = function (p) { _sevenArmR7(p); if (isSeven(p) && p.inventory[0] && p.inventory[0].id !== 'MADAO') p.inventory.reverse(); };

/* ============================== 5) MA ĐAO: Giải Phóng bất tử + choáng, giai đoạn 3 ============================== */
const _madaoFireR7 = madaoFire;
madaoFire = function (p, w, ang, charge, mult) {
    if (p.mdP3 > world.time) return mdPhase3(p, ang);
    return _madaoFireR7(p, w, ang, charge, mult);
};
function mdPhase3(p, a) { // lướt theo hướng chọn rồi mảnh tụ thành kiếm đâm thẳng
    p.mdP3 = 0; p.cooldown = 30; p.lastFireT = world.time; p.angle = a;
    const L = Math.max(40, rayFree(p.x, p.y, a, 200).d - p.radius), s = umbFreeSpot(p, p.x + Math.cos(a) * L, p.y + Math.sin(a) * L);
    afterImages(p, p.x, p.y, s.x, s.y, 6, '#c084fc'); startTravel(p, s.x, s.y, 0.16, null, null, 6); p.st.invuln = Math.max(p.st.invuln || 0, 0.6);
    W11.push({ kind: 'mdGather', owner: p.id, a, t: 0.38, T: 0.38 });
    p.shotQueue.push({ t: 0.4, fn: () => {
        if (p.hp <= 0) return;
        const free = rayFree(p.x, p.y, a, 560), ex = p.x + Math.cos(a) * free.d, ey = p.y + Math.sin(a) * free.d;
        W11.push({ kind: 'mdThrustBig', owner: p.id, x: p.x, y: p.y, a, L: free.d, t: 0.6, T: 0.6 });
        enemiesOf(p).forEach(e => { if (segDist(e.x, e.y, p.x, p.y, ex, ey) < e.radius + 38) { trueDamage(e, 140 * (p.meleeMult || 1), p.id); e.stun = Math.max(e.stun, 0.6); USK.push({ kind: 'xcut', x: e.x, y: e.y, a, t: 0.45, maxT: 0.45 }); floatText(e.x, e.y - 50, '🗡 VẠN NHẬN NHẤT KIẾM', '#f5d0fe', 14); } });
        for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (b.owner !== p.id && segDist(b.x, b.y, p.x, p.y, ex, ey) < 40) bullets.splice(i, 1); }
        p.kx -= Math.cos(a) * 140; p.ky -= Math.sin(a) * 140; flash('#a855f7', 0.12); addShake(12); hitStop(0.1); AudioSys.playAt('rail', p.x, p.y, 0.9); AudioSys.playAt('crit', p.x, p.y, 0.7);
    } });
    floatText(p.x, p.y - 56, '🗡 GIAI ĐOẠN 3 · VẠN NHẬN NHẤT KIẾM', '#e9d5ff', 16);
}

/* ============================== MÓC CHUNG ============================== */
const _dealDamageR7 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 && players.find(q => q.id === attackerId);
    if (atk && atk !== target) {
        const w = getCurrentWeapon(atk);
        // Vạn Tượng Quy Nhất: buff của mould thứ 2 cũng có hiệu lực
        if (w && w.id === 'VANTUONG' && w.mods && atk.vtFuse > world.time) { const B = VT[vtOther(w)].buff; if (B.out) dmg *= B.out; if (B.steal) atk.hp = Math.min(atk.maxHp, atk.hp + dmg * B.steal); }
        // Song Nhận: Kéo trúng → mảnh Ma Đao + nạp Giải Phóng
        if (w && w.id === 'SCISSORS' && isSeven(atk) && target.hp > 0 && !(target.svShardT > world.time)) { target.svShardT = world.time + 0.3; mdDrop(atk, target.x, target.y, 1, target.id); atk.mdGauge = Math.min(100, (atk.mdGauge || 0) + 4); }
    }
    const tw = target && target.inventory && getCurrentWeapon(target);
    if (tw && tw.id === 'VANTUONG' && tw.mods && target.vtFuse > world.time && atk && atk !== target) { const B = VT[vtOther(tw)].buff; if (B.inn) dmg *= B.inn; }
    if (tw && tw.id === 'VANTUONG' && tw.mods && vtCur(tw) === 'eshield' && atk && atk !== target && !opts.zone && Math.abs(angleDiff(Math.atan2(atk.y - target.y, atk.x - target.x), target.angle)) < 0.9) dmg *= 0.7;
    return _dealDamageR7(target, dmg, attackerId, opts);
};
const _fireWeaponR7 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const r = _fireWeaponR7(p, w, ang, charge, enemy);
    // Quy Nhất: đòn thường bắn kèm đòn của mould còn lại (60%)
    if (w && w.id === 'VANTUONG' && w.mods && p.vtFuse > world.time && (charge || 0) < 0.9) { const O = VT[vtOther(w)], cd = p.cooldown; try { O.A(p, w, ang, attackMult(p, w) * 0.6); } catch (e) { } p.cooldown = cd; }
    return r;
};
const _upeR7 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR7(dt);
    if (gameState !== 'PLAYING' && gameState !== 'KO') return;
    players.forEach(p => {
        if (p.hp <= 0) { p.vtBeam = p.vtGat = p.vtSweep = null; p._mdWas = false; return; }
        const w = getCurrentWeapon(p);
        // Ma Đao Giải Phóng: bất tử, choáng kẻ bên trong; hết GĐ2 → mở GĐ3
        if (p.mdField) { p.st.invuln = Math.max(p.st.invuln || 0, 0.15); const F = p.mdField; enemiesOf(p).forEach(e => { if (dist(e.x, e.y, F.x, F.y) < F.R + e.radius) e.stun = Math.max(e.stun, 0.25); }); p._mdWas = true; }
        else if (p._mdWas) { p._mdWas = false; p.mdP3 = world.time + 3; floatText(p.x, p.y - 64, '🗡 GĐ3: ĐÁNH THEO HƯỚNG ĐỂ LƯỚT & ĐÂM', '#f0abfc', 13); }
        if (p.isBot && p.mdP3 > world.time && w && w.id === 'MADAO' && world.time > p.mdP3 - 2.4) { const e = vtNear(p, 560); mdPhase3(p, e ? Math.atan2(e.y - p.y, e.x - p.x) : p.angle); }
        // Khiên năng lượng: chắn đạn phía trước
        if (w && w.id === 'VANTUONG' && w.mods && vtCur(w) === 'eshield') for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b.owner === p.id || b.explosive || dist(b.x, b.y, p.x, p.y) > p.radius + 26 || Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) > 0.9) continue; spark(b.x, b.y, '#7dd3fc', 4, 140); bullets.splice(j, 1); }
        // tia lazer liên tục
        const Bm = p.vtBeam; if (Bm) { Bm.t -= dt; Bm.tick += dt; if (Bm.tick >= 0.1) { Bm.tick = 0; Bm.end = vtBeamTick(p, p.angle, Bm.R, Bm.w, Bm.dmg); } if (Bm.t <= 0 || !w || w.id !== 'VANTUONG') p.vtBeam = null; }
        const Sw = p.vtSweep; if (Sw) { Sw.t -= dt; Sw.tick += dt; Sw.a = Sw.a0 + (1 - Sw.t / 0.6) * 2.1; if (Sw.tick >= 0.06) { Sw.tick = 0; Sw.end = vtBeamTick(p, Sw.a, 380, 10, 6 * vD(p)); } if (Sw.t <= 0) p.vtSweep = null; }
        const G = p.vtGat; if (G) { G.t -= dt; G.tick += dt; if (G.tick >= 0.07) { G.tick = 0; cubeShot(p, p.angle + (Math.random() - 0.5) * 0.12, { speed: 26, damage: 9 * vD(p), range: 560, color: '#fde047', size: 3 }); p.muzzle = 0.04; AudioSys.playAt('smg', p.x, p.y, 0.12); } if (G.t <= 0) p.vtGat = null; }
        // Quy Nhất: tốc chạy của mould thứ 2
        if (p.vtFuse > world.time && w && w.id === 'VANTUONG' && w.mods) { const s = VT[vtOther(w)].buff.spd; if (s && p.moveMult === p._vtAfter) { p.moveMult *= s; p._vtAfter = p.moveMult; } }
    });
    for (let i = W11.length - 1; i >= 0; i--) {
        const f = W11[i], o = players.find(q => q.id === f.owner); if (!o) { W11.splice(i, 1); continue; }
        f.t -= dt;
        if (f.kind === 'dome') { for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j], ow = players.find(q => q.id === b.owner); if (b.owner === o.id || (ow && sameTeam(o, ow))) continue; const d = dist(b.x, b.y, f.x, f.y); if (Math.abs(d - f.R) < 18 || d < f.R) { spark(b.x, b.y, '#7dd3fc', 4, 140); bullets.splice(j, 1); } } if (dist(o.x, o.y, f.x, f.y) < f.R) o.st.shieldT = Math.max(o.st.shieldT || 0, 0.2); }
        if (f.t <= 0) W11.splice(i, 1);
    }
};
// Quy Nhất: tốc chạy — rework6 đặt lại moveMult mỗi khung theo _vtBase; bù ở đây để không cộng dồn
const _skillProfileR7 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (id === 'calibrate') return { aim: null, shape: 'self', aoe: 40, col: '196,181,253', tag: '🎛️ CHỌN 2 MOULD' };
    if (id === 'hightech' && w && w.id === 'VANTUONG' && w.mods && isCmd(p)) return { aim: null, shape: 'selfaoe', aoe: 80, col: '240,171,252', tag: `QUY NHẤT ${VT[w.mods[0]].icon}+${VT[w.mods[1]].icon}` };
    if (id === 'mdBlades') return { aim: 'dir', R: 650, shape: 'line', w: 60, col: '233,213,255', tag: `⚔ ${p.mdExCd !== undefined ? mdShards(p).length : 0} MẢNH` };
    return _skillProfileR7(p, id);
};

/* ============================== HÌNH VẼ ============================== */
const _drawW2FxR7 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR7(now);
    ctx.save(); ctx.lineCap = 'round';
    players.forEach(p => {
        if (p.hp <= 0) return;
        const Bm = p.vtBeam; if (Bm && Bm.end) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; [[Bm.w * 2.2, 'rgba(232,121,249,0.35)'], [Bm.w, 'rgba(245,208,254,0.85)'], [Bm.w * 0.35, 'rgba(255,255,255,0.95)']].forEach(([wd, c]) => { ctx.strokeStyle = c; ctx.lineWidth = wd * (0.85 + Math.sin(now * 40) * 0.15); ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.angle) * 26, p.y + Math.sin(p.angle) * 26); ctx.lineTo(Bm.end.ex, Bm.end.ey); ctx.stroke(); }); ctx.fillStyle = 'rgba(245,208,254,0.8)'; ctx.beginPath(); ctx.arc(Bm.end.ex, Bm.end.ey, Bm.w * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        const Sw = p.vtSweep; if (Sw && Sw.end) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(245,208,254,0.85)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(Sw.end.ex, Sw.end.ey); ctx.stroke(); ctx.restore(); }
        if (p.vtFuse > world.time) { const w = getCurrentWeapon(p); if (w && w.mods) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; [0, 1].forEach(k => { ctx.strokeStyle = VT[w.mods[k]].col; ctx.globalAlpha = 0.6; ctx.lineWidth = 3; const a0 = now * (k ? -5 : 5); ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 9 + k * 5, a0, a0 + 2.4); ctx.stroke(); }); ctx.restore(); } }
        if (p.mdP3 > world.time) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(240,171,252,${0.5 + Math.sin(now * 12) * 0.3})`; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(p.angle) * 220, p.y + Math.sin(p.angle) * 220); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
    });
    W11.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = 1 - Math.max(0, f.t) / f.T, k = 1 - u;
        if (f.kind === 'dome') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(f.x, f.y, f.R * 0.6, f.x, f.y, f.R); g.addColorStop(0, 'rgba(56,189,248,0.02)'); g.addColorStop(1, `rgba(125,211,252,${0.25 + Math.sin(now * 6) * 0.08})`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.R, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(186,230,253,${Math.min(1, f.t)})`; ctx.lineWidth = 2.5; ctx.stroke(); for (let i = 0; i < 6; i++) { const a = i * 1.047 + now * 0.5; ctx.beginPath(); ctx.moveTo(f.x + Math.cos(a) * f.R * 0.5, f.y + Math.sin(a) * f.R * 0.5); ctx.lineTo(f.x + Math.cos(a) * f.R, f.y + Math.sin(a) * f.R); ctx.strokeStyle = 'rgba(125,211,252,0.25)'; ctx.lineWidth = 1; ctx.stroke(); } ctx.restore(); }
        else if (f.kind === 'swords') { for (let i = 0; i < 6; i++) { if (u > 0.3 + i * 0.12) continue; const a = now * 6 + i * 1.047, x = o.x + Math.cos(a) * 46, y = o.y + Math.sin(a) * 46; ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(3, 6); ctx.lineTo(-3, 6); ctx.closePath(); ctx.fill(); ctx.restore(); } }
        else if (f.kind === 'fuse') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; [f.c1, f.c2].forEach((c, j) => { ctx.strokeStyle = c; ctx.globalAlpha = k; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius + 10 + u * 50 + j * 8, 0, Math.PI * 2); ctx.stroke(); }); ctx.restore(); }
        else if (f.kind === 'mdGather') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 18; i++) { const a = i * 0.35, r = 140 * k + 10; mdShard(ctx, o.x + Math.cos(a) * r, o.y + Math.sin(a) * r, a + Math.PI, 1, 0.9); } ctx.restore(); }
        else if (f.kind === 'mdThrustBig') { // kiếm tụ từ mảnh vỡ đâm thẳng
            const reach = f.L * r3Ease(Math.min(1, u / 0.3)), fade = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.globalAlpha = fade;
            ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(147,51,234,0.3)'; ctx.fillRect(0, -40, reach, 80);
            ctx.globalCompositeOperation = 'source-over'; ctx.beginPath(); ctx.moveTo(10, -16); ctx.lineTo(reach - 30, -12); ctx.lineTo(reach + 20, 0); ctx.lineTo(reach - 30, 12); ctx.lineTo(10, 16); ctx.closePath(); const g = ctx.createLinearGradient(0, -16, 0, 16); g.addColorStop(0, '#7e22ce'); g.addColorStop(0.5, '#2e1065'); g.addColorStop(1, '#14052e'); ctx.fillStyle = g; ctx.fill();
            ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(233,213,255,0.6)'; ctx.lineWidth = 1; for (let x = 30; x < reach; x += 26) { ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x - 6, 0); ctx.lineTo(x + 4, 18); ctx.stroke(); } ctx.restore();
            ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = '#e879f9'; ctx.shadowBlur = 18; ctx.strokeStyle = 'rgba(250,232,255,0.95)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(10, -16); ctx.lineTo(reach - 30, -12); ctx.lineTo(reach + 20, 0); ctx.stroke(); ctx.restore();
        }
    });
    ctx.restore();
};
