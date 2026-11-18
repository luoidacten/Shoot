/** ==================== BẬC THẦY (gộp) · BẬC THẦY VŨ KHÍ · NÉM ĐỒ · NÚT NÉM KÉO ĐỂ NGẮM · MEDKIT · HỘP HỖ TRỢ ====================
 *  Nạp sau controls.js.
 */

/* ============================== GỘP LỢI THẾ ============================== */
// "Cận Chiến" gộp vào Bậc Thầy Cận Chiến, "Bắn Chuẩn" gộp vào Bậc Thầy Tầm Xa
['meleeOnly', 'gunsOnly'].forEach(id => { const i = ADV_IDS.indexOf(id); if (i >= 0) ADV_IDS.splice(i, 1); });
Object.assign(ADVANTAGES.meleeMaster, { desc: 'Chỉ dùng vũ khí cận chiến (hòm chỉ ra cận chiến). Có thẻ Kỹ Thuật Cận Chiến: mỗi vũ khí cận chiến 1 nội tại (P) + 1 kỹ năng (S) riêng. Cận chiến +25% sát thương, chạy nhanh 10%, nhận ít hơn 18% sát thương đạn & nổ. Bù lại: mất lần nâng cấp đầu.' });
Object.assign(ADVANTAGES.rangeMaster, { desc: 'Chỉ dùng súng (hòm chỉ ra súng, khởi đầu cầm súng lục). Có thẻ Trang Bị Phụ: mỗi loại súng 1 nội tại (P) + 1 kỹ năng (S) riêng. Súng chính xác hơn 35%, tầm nhìn, tầm bắn, tốc bắn +15%. Bù lại: -20 máu và mất lần nâng cấp đầu.' });
ADVANTAGES.weaponMaster = { icon: '🗡️🏹', name: 'Bậc Thầy Vũ Khí', desc: 'Có cả 2 Bậc Thầy: Kỹ Thuật Cận Chiến + Trang Bị Phụ, dùng được mọi vũ khí, +10% tốc chạy, +15% sát thương. Bù lại: mất 3 lần nâng cấp đầu tiên.' };
ADVANTAGES.thrower = { icon: '🤾', name: 'Ném Đồ', desc: 'Vũ khí ném đi gây gấp 1.8 sát thương và bay nhanh hơn; lựu đạn nổ mạnh và rộng hơn 30%, ném xa hơn; khiên / rìu ném mạnh hơn 40%.' };
ADV_IDS.push('weaponMaster', 'thrower');
CARDS.meleeTech.masterOnly = true; CARDS.gunMod.masterOnly = true; // chỉ có qua lợi thế Bậc Thầy
const _advPhase9 = advPhase;
advPhase = function () {
    const ph = _advPhase9(), op = ph.onPick;
    ph.onPick = (p, id) => { op(p, id); if (id === 'weaponMaster') ['meleeTech', 'gunMod'].forEach(c => { if (!p.build.includes(c)) p.build.push(c); }); };
    return ph;
};
const isMeleeWep = w => !!w && (w.type === 'MELEE' || w.type === 'SHIELD') && w.id !== 'NONE';
const isGunWep = w => !!w && w.type === 'GUN';
const isMeleeOrFist = w => isMeleeWep(w) || (!!w && w.id === 'NONE'); // tay không cũng là cận chiến
// Bậc Thầy chỉ nhận đúng loại vũ khí của mình
const _makeWeapon9 = makeWeapon;
makeWeapon = function (id, p) {
    const W = WEAPONS[id];
    if (p && W && id !== 'NONE') {
        if (p.adv === 'meleeMaster' && !isMeleeWep(W)) id = weightedWeapon(isMeleeWep);
        else if (p.adv === 'rangeMaster' && !isGunWep(W)) id = weightedWeapon(isGunWep);
    }
    return _makeWeapon9(id, p);
};
const _applyBuild9 = applyBuild;
applyBuild = function (p) {
    _applyBuild9(p);
    if (p.adv === 'meleeMaster') { p.meleeMult = (p.meleeMult || 1) * 1.25; p.moveMult *= 1.1; }
    if (p.adv === 'rangeMaster') p.spreadMult *= 0.65;
    if (p.adv === 'weaponMaster') { p.moveMult *= 1.1; p.dmgMult *= 1.15; }
    p.prevHp = undefined;
};
const _resetRound9 = resetPlayerForRound;
resetPlayerForRound = function (p) {
    _resetRound9(p);
    if (p.adv === 'rangeMaster') p.inventory = p.inventory.map(w => isMeleeWep(w) ? makeWeapon('PISTOL', p) : w);
    if (p.adv === 'meleeMaster') p.inventory = p.inventory.map(w => w.type === 'GUN' || w.type === 'THROWABLE' ? makeWeapon('KNIFE', p) : w);
    p.prevHp = p.hp;
};

/* ============================== NỘI TẠI (P) + KỸ NĂNG (S) THEO TỪNG VŨ KHÍ ============================== */
const MELEE_P = {
    KNIFE: 'Đâm sau lưng / phục kích (đang tàng hình, trong bụi hoặc địch không thấy bạn) ×3 sát thương; đòn đánh luôn là đâm.',
    DAGGERS: 'Mỗi đòn thứ 3 gây chảy máu 2 giây.', KATANA: 'Hút 10% sát thương thành máu.', LIGHTSABER: 'Mỗi đòn trúng giảm 1 giây hồi chiêu kỹ năng cận chiến.',
    RAPIER: '+30% chí mạng.', SPEAR: 'Đánh trúng từ xa (trên 60) +25% sát thương.', HAMMER: 'Đòn đánh làm choáng 0.4 giây.', AXE: 'Đòn đánh làm chậm 1 giây.',
    GREATSWORD: '+15% sát thương, đẩy lùi mạnh hơn.', CHAINSAW: 'Hút 15% sát thương thành máu.', SHIELD: 'Mỗi đòn trúng +10 giáp.', ROUNDSHIELD: 'Khiên ném nảy thêm 2 mục tiêu.', NONE: 'Đấm +20% sát thương; mỗi cú đấm thứ 3 làm choáng 0.5 giây.'
};
const GUN_P = {
    PISTOL: '+20% chí mạng.', SPISTOL: '+20% chí mạng.', REVOLVER: '+25% sát thương.', DUAL: 'Mỗi viên trúng hồi 1 máu.', AR: 'Vùng headshot rộng hơn, +10% sát thương.', SAR: 'Vùng headshot rộng hơn, +10% sát thương.',
    SMG: 'Đạn làm chậm 0.3 giây.', MINIGUN: 'Đạn xuyên tường chỉ sau 1 giây sấy.', SHOTGUN: 'Bắn gần (dưới 120) +30%.', SNIPER: 'Bắn xa (trên 400) +25% và làm lộ địch 3 giây.',
    BOW: 'Bắn xa (trên 400) +25% và làm lộ địch 3 giây.', RAILGUN: 'Bắn xa (trên 400) +25% và làm lộ địch 3 giây.', FLAME: 'Lửa đốt lâu gấp đôi.'
};
CARDS.meleeTech.desc = '<b>Chỉ hoạt động khi cầm vũ khí cận chiến hoặc tay không.</b><br><b>P theo vũ khí:</b> Dao = đâm lén/phục kích ×3 (đòn luôn là đâm) · Song Đao = chảy máu · Katana = hút máu · Kiếm Ánh Sáng = giảm hồi chiêu · Kiếm Liễu = chí mạng · Giáo = đâm xa mạnh · Búa = choáng · Rìu = làm chậm · Đại Đao = mạnh & đẩy xa · Cưa = hút máu · Khiên = +giáp · Khiên Tròn = nảy thêm · Tay không = đấm mạnh, cú thứ 3 choáng.<br><b>S theo vũ khí:</b> Dao = lướt nhỏ + đòn sau ×1.5 · Song Đao = Ám Sát · Katana/Kiếm = Nhất Kiếm · Giáo = Giáo Xuyên · Búa/Rìu/Đại Đao = Địa Chấn · Khiên = Phản Đòn · Cưa = Cuồng Cưa · Tay không = Đấm Ngàn Cân (sóng chấn hất văng).';
CARDS.gunMod.desc = '<b>Chỉ hoạt động khi cầm súng.</b><br><b>P theo súng:</b> Súng lục = chí mạng · Ổ Quay = sát thương · Song Súng = hút máu · AR = headshot · SMG = làm chậm · Gatling = xuyên tường sớm · Shotgun = gần mạnh · Bắn tỉa/Cung/Railgun = xa mạnh + lộ địch · Phun lửa = đốt lâu.<br><b>S theo súng:</b> AR = phóng lựu dưới nòng · SMG/Gatling = băng trống · Shotgun = đạn sên · Bắn tỉa/Cung/Railgun = ống ngắm nhiệt · Súng lục = đạn nảy · súng khác = ống phóng 3 lựu.';
// kỹ năng chỉ dùng được khi cầm đúng loại vũ khí; Dao: lướt nhỏ
const _castSkill9 = castSkill;
castSkill = function (p, slot, aimVec) {
    const s = p.skills && p.skills[slot];
    if (s && s.cd <= 0) {
        const w = getCurrentWeapon(p);
        if (s.id === 'meleeTech' && !isMeleeOrFist(w)) { if (!p.isBot) floatText(p.x, p.y - 30, 'Cần vũ khí cận chiến', '#94a3b8', 12); return; }
        if (s.id === 'gunMod' && !isGunWep(w)) { if (!p.isBot) floatText(p.x, p.y - 30, 'Cần cầm súng', '#94a3b8', 12); return; }
    }
    return _castSkill9(p, slot, aimVec);
};
const _meleeTechCast9 = meleeTechCast;
meleeTechCast = function (p) {
    const w = getCurrentWeapon(p);
    if (w.id === 'KNIFE') { // lướt nhỏ, đòn kế tiếp ×1.5
        p.dashTime = 0.12; p.dashAngle = aimDir(p); p.st.invuln = Math.max(p.st.invuln, 0.15); p.st.empower = Math.max(p.st.empower || 0, 1);
        smoke(p.x, p.y, 4, 'rgba(120,90,160,0.3)', 10); floatText(p.x, p.y - 34, '🔪 LƯỚT', '#c084fc', 14); return;
    }
    return _meleeTechCast9(p);
};
// Dao luôn đâm; Khiên Tròn nảy thêm
const _fireMelee9 = fireMelee;
fireMelee = function (p, w, ang, charge, mult, isSuper, enemy) {
    const active = has(p, 'meleeTech');
    if (active && w.id === 'KNIFE') { const s0 = w.strike; w.strike = 'stab'; try { return _fireMelee9(p, w, ang, charge, mult, isSuper, enemy); } finally { w.strike = s0; } }
    const n = items.length, r = _fireMelee9(p, w, ang, charge, mult, isSuper, enemy);
    if (active && w.id === 'ROUNDSHIELD') for (let i = n; i < items.length; i++) if (items[i].custom === 'chain' && items[i].ownerId === p.id) items[i].left += 2;
    return r;
};
const _spawnBullet9 = spawnBullet;
spawnBullet = function (p, x, y, ang, o) {
    const b = _spawnBullet9(p, x, y, ang, o);
    if (p && p.st && has(p, 'gunMod')) {
        const id = b.wid;
        if (id === 'PISTOL' || id === 'SPISTOL') b.critC = (b.critC || 0) + 0.2;
        if (id === 'AR' || id === 'SAR') b.headR = (b.headR || 0.45) * 1.3;
        if (id === 'MINIGUN' && (p.holdFireT || 0) >= 1) { b.ghostN = 99; b.color = '#c4b5fd'; }
    }
    return b;
};
const _dealDamage9 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    let after = null;
    if (atk && atk !== target && target && target.st && target.hp > 0 && !opts.zone) {
        const w = getCurrentWeapon(atk);
        if (opts.melee && has(atk, 'meleeTech') && isMeleeOrFist(w)) {
            const behind = Math.abs(angleDiff(Math.atan2(atk.y - target.y, atk.x - target.x), target.angle)) > 2.0;
            const ambush = atk.st.invis > 0 || inBush(atk.x, atk.y) || !targetable(target, atk);
            switch (w.id) {
                case 'KNIFE': if (behind || ambush) { dmg *= 3; floatText(target.x, target.y - 48, behind ? '🔪 ĐÂM LÉN ×3' : '🔪 PHỤC KÍCH ×3', '#c084fc', 15); } break;
                case 'DAGGERS': atk.dagN = (atk.dagN || 0) + 1; if (atk.dagN % 3 === 0 && !target.pyro) { target.st.burn = Math.max(target.st.burn || 0, 2); target.st.burnBy = atk.id; } break;
                case 'KATANA': after = d => { atk.hp = Math.min(atk.maxHp, atk.hp + d * 0.1); }; break;
                case 'CHAINSAW': after = d => { atk.hp = Math.min(atk.maxHp, atk.hp + d * 0.15); }; break;
                case 'LIGHTSABER': (atk.skills || []).forEach(s => { if (s.id === 'meleeTech' && s.cd > 0) s.cd = Math.max(0, s.cd - 1); }); break;
                case 'RAPIER': atk.critChance = (atk.critChance || 0) + 0.3; after = () => { atk.critChance -= 0.3; }; break;
                case 'SPEAR': if (dist(atk.x, atk.y, target.x, target.y) > 60 + target.radius) dmg *= 1.25; break;
                case 'HAMMER': target.stun = Math.max(target.stun, 0.4); break;
                case 'AXE': target.st.slow = Math.max(target.st.slow || 0, 1); break;
                case 'GREATSWORD': dmg *= 1.15; opts = { ...opts, knock: (opts.knock || 100) * 1.5 }; break;
                case 'NONE': atk.fistN = (atk.fistN || 0) + 1; dmg *= 1.2; if (atk.fistN % 3 === 0) { target.stun = Math.max(target.stun, 0.5); floatText(target.x, target.y - 46, '👊 CHOÁNG!', '#fde047', 13); } break;
                case 'SHIELD': atk.armor = Math.min(Math.max(150, atk.maxArmor), (atk.armor || 0) + 10); break;
            }
        } else if (opts.bullet && has(atk, 'gunMod')) {
            const b = opts.bullet, id = b.wid, d = dist(atk.x, atk.y, target.x, target.y);
            switch (id) {
                case 'REVOLVER': dmg *= 1.25; break;
                case 'AR': case 'SAR': dmg *= 1.1; break;
                case 'DUAL': atk.hp = Math.min(atk.maxHp, atk.hp + 1); break;
                case 'SMG': target.st.slow = Math.max(target.st.slow || 0, 0.3); break;
                case 'SHOTGUN': if (d < 120) dmg *= 1.3; break;
                case 'SNIPER': case 'BOW': case 'RAILGUN': if (d > 400) { dmg *= 1.25; spotFor(target, atk.id, 3); } break;
                case 'FLAME': if (!target.pyro) { target.st.burn = Math.max(target.st.burn || 0, 4); target.st.burnBy = atk.id; } break;
            }
        }
    }
    const hp0 = target ? target.hp : 0;
    try { return _dealDamage9(target, dmg, attackerId, opts); }
    finally { if (after) after(Math.max(0, hp0 - Math.max(0, target.hp))); }
};

/* ============================== NÉM ĐỒ ============================== */
const _throwWeapon9 = throwWeapon;
throwWeapon = function (p, wep, enemy) {
    const n = items.length, a0 = p.aimAngle, m0 = p.manualEngaged;
    if (p.throwAimAng !== undefined) { p.aimAngle = p.throwAimAng; p.manualEngaged = true; }
    try { _throwWeapon9(p, wep, enemy); } finally { if (p.throwAimAng !== undefined) { p.aimAngle = a0; p.manualEngaged = m0; } }
    if (p.adv === 'thrower') for (let i = n; i < items.length; i++) { const it = items[i]; if (it.ownerId === p.id && it.dmg) { it.dmg *= 1.8; it.vx *= 1.25; it.vy *= 1.25; } }
};
const _throwGrenade9 = throwGrenade;
throwGrenade = function (p, w, ang, d) {
    const n = items.length;
    if (p.throwAimAng !== undefined) ang = p.throwAimAng;
    if (p.adv === 'thrower') d *= 1.3;
    _throwGrenade9(p, w, ang, d);
    if (p.adv === 'thrower') for (let i = n; i < items.length; i++) { const it = items[i]; if (it.ownerId !== p.id) continue; it.vx *= 1.3; it.vy *= 1.3; if (it.blast) it.blast = [it.blast[0] * 1.3, it.blast[1] * 1.3]; else if (it.type && it.type.id === 'GRENADE') it.blast = [120 * 1.3, 160 * 1.3]; }
};
const _throwSpinner9 = throwSpinner;
throwSpinner = function (p, w, ang, mult, kind) { const n = items.length; _throwSpinner9(p, w, ang, mult, kind); if (p.adv === 'thrower') for (let i = n; i < items.length; i++) if (items[i].ownerId === p.id && items[i].dmg) items[i].dmg *= 1.4; };

/* ============================== NÚT NÉM (B): KÉO ĐỂ NGẮM, THẢ RA ĐỂ NÉM ============================== */
const _handleThrow9 = handleThrowButton;
handleThrowButton = function (p, w, input, dt, allowAct, enemy) {
    const v = input.baim, aimed = v && Math.hypot(v.x, v.y) > 0.3;
    if (allowAct && input.b && (aimed || p.bAimVec)) { // đang kéo nút ném
        if (aimed) p.bAimVec = { x: v.x, y: v.y };
        if (input.bcancel) p.bAimVec = 'cancel';
        p.bHeldT = 0; p.bThrown = false; return;
    }
    if (!input.b && p.bAimVec) { // thả ra
        const vec = p.bAimVec; p.bAimVec = null; p.bHeldT = 0; p.bThrown = false;
        if (vec === 'cancel' || !allowAct || w.id === 'NONE') return;
        p.throwAimAng = Math.atan2(vec.y, vec.x);
        try {
            if (w.type === 'THROWABLE') { if (p.cooldown <= 0) { throwGrenade(p, w, p.throwAimAng, 120 + Math.min(1, Math.hypot(vec.x, vec.y)) * 300); p.cooldown = w.fireRate; } }
            else if (!w.out) throwWeapon(p, w, null);
        } finally { p.throwAimAng = undefined; }
        return;
    }
    return _handleThrow9(p, w, input, dt, allowAct, enemy);
};
// cảm ứng: kéo nút B
const _handleTouch9 = handleTouch;
handleTouch = function (e) {
    const pre = new Map(touches);
    _handleTouch9(e);
    if (gameState !== 'PLAYING' && gameState !== 'COUNTDOWN') return;
    const inp = touchInputs.p1, L = touchLayout();
    for (const t of e.changedTouches) {
        const id = t.identifier, x = t.clientX, y = t.clientY, td = touches.get(id);
        if (e.type === 'touchstart' && td && td.k === 'b') { td.sx = x; td.sy = y; inp.baim = null; inp.bcancel = false; }
        else if (e.type === 'touchmove' && td && td.k === 'b' && td.sx !== undefined) {
            const dx = x - td.sx, dy = y - td.sy, d = Math.hypot(dx, dy), maxD = L.A.r * 1.7;
            if (d > 16) { inp.baim = { x: dx / d * Math.min(1, d / maxD), y: dy / d * Math.min(1, d / maxD) }; inp.bcancel = false; td.eng = true; }
            else if (td.eng) { inp.baim = null; inp.bcancel = true; }
            skillStick.b = { sx: td.sx, sy: td.sy, x, y, cancel: !!inp.bcancel };
        } else if (e.type !== 'touchstart' && e.type !== 'touchmove') {
            const o = pre.get(id); if (o && o.k === 'b') { skillStick.b = null; setTimeout(() => { inp.baim = null; inp.bcancel = false; }, 50); }
        }
    }
};
const _mergeInput9 = mergeInput;
mergeInput = function (...list) { const out = _mergeInput9(...list); list.forEach(i => { if (!i) return; if (i.baim) out.baim = i.baim; if (i.bcancel) out.bcancel = true; }); return out; };
const _netSend9 = netSend;
netSend = function (msg) {
    if (net.role === 'guest' && msg && msg.t === 'in' && window.__lastInp) { const i = window.__lastInp; if (i.baim) msg.ba = { x: Math.round(i.baim.x * 20) / 20, y: Math.round(i.baim.y * 20) / 20 }; if (i.bcancel) msg.bc = 1; }
    return _netSend9(msg);
};
const _onHostData9 = onHostData;
onHostData = function (g, m) { _onHostData9(g, m); if (m && m.t === 'in') { g.remote.ba = m.ba || null; g.remote.bc = !!m.bc; } };
const _netRemoteInput9 = netRemoteInput;
netRemoteInput = function (id) { const out = _netRemoteInput9(id), g = net.guests.find(x => x.id === id); if (g) { if (g.remote.ba) out.baim = g.remote.ba; if (g.remote.bc) out.bcancel = true; } return out; };
const _drawTouch9 = drawTouchControls;
drawTouchControls = function (p) {
    _drawTouch9(p);
    const st = skillStick.b, L = touchLayout();
    if (!st || !L.B) return;
    const dx = st.x - st.sx, dy = st.y - st.sy, d = Math.min(L.B.r * 1.3, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
    ctx.fillStyle = st.cancel ? 'rgba(248,113,113,0.85)' : 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(L.B.x + Math.cos(a) * d, L.B.y + Math.sin(a) * d, L.B.r * 0.4, 0, Math.PI * 2); ctx.fill();
    if (st.cancel || Math.hypot(dx, dy) < 16) return;
    const z = camera.zoom, px = (p.x - camera.x) * z + SCREEN_W / 2, py = (p.y - camera.y) * z + SCREEN_H / 2, w = getCurrentWeapon(p);
    const len = (w.type === 'THROWABLE' ? 120 + Math.min(1, Math.hypot(dx, dy) / (L.A.r * 1.7)) * 300 : 260) * z;
    ctx.save(); ctx.strokeStyle = 'rgba(251,191,36,0.9)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); ctx.stroke(); ctx.setLineDash([]);
    if (w.type === 'THROWABLE') { ctx.strokeStyle = 'rgba(251,146,60,0.8)'; ctx.beginPath(); ctx.arc(px + Math.cos(a) * len, py + Math.sin(a) * len, 40 * z, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#fbbf24'; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('THẢ ĐỂ NÉM', px + Math.cos(a) * len, py + Math.sin(a) * len - 14);
    ctx.restore();
};

/* ============================== MEDKIT: tăng MỌI nguồn hồi máu, nhặt hộp hỗ trợ luôn hồi máu ============================== */
Object.assign(ADVANTAGES.medkit, { desc: 'Mọi nguồn hồi máu mạnh hơn 30%. Nhặt hộp hỗ trợ luôn hồi thêm 25 máu. Không bị trúng đòn 2.5 giây thì tự hồi máu, càng lâu càng nhanh (tới 10/giây).' });
function updateMedkit() {
    players.forEach(p => {
        if (p.adv !== 'medkit' || p.hp <= 0) { p.prevHp = p.hp; return; }
        if (p.prevHp !== undefined && p.hp > p.prevHp && gameState === 'PLAYING') p.hp = Math.min(p.maxHp, p.hp + (p.hp - p.prevHp) * 0.3);
        p.prevHp = p.hp;
    });
}
const _upe9 = updatePartyExtras;
updatePartyExtras = function (dt) { updateMedkit(); _upe9(dt); updateMedkit(); };

/* ============================== HỘP HỖ TRỢ: 10 LOẠI, MỖI LOẠI MỘT HÌNH & MÀU ============================== */
const SUPPLY = {
    med:     { w: 22, name: 'Hộp Y Tế', col: '#22c55e', shape: 'box', icon: '✚', fx: p => supplyHeal(p, 45) },
    mega:    { w: 6, name: 'Tim Lớn', col: '#ef4444', shape: 'heart', icon: '', fx: p => supplyHeal(p, 80) },
    armor:   { w: 16, name: 'Thùng Giáp', col: '#3b82f6', shape: 'hex', icon: '⛨', fx: p => { p.armor = Math.min(Math.max(150, p.maxArmor), (p.armor || 0) + 50); return '+50 GIÁP'; } },
    ammo:    { w: 16, name: 'Hộp Đạn', col: '#eab308', shape: 'can', icon: '⁞', fx: p => { const w = getCurrentWeapon(p); if (w.magSize) { w.reserve += w.noReload ? 0 : w.magSize * (p.scavenger ? 3 : 2); if (w.noReload) w.mag = effMag(p, w); } return '+ĐẠN'; } },
    shield:  { w: 8, name: 'Viên Năng Lượng', col: '#06b6d4', shape: 'diamond', icon: '', fx: p => { p.st.shield = Math.max(p.st.shield, 60); p.st.shieldT = Math.max(p.st.shieldT, 6); return '+60 KHIÊN'; } },
    speed:   { w: 8, name: 'Lon Tăng Lực', col: '#f97316', shape: 'cyl', icon: '⚡', fx: p => { p.st.haste = Math.max(p.st.haste, 4); supplyHeal(p, 15); return 'TĂNG LỰC!'; } },
    rage:    { w: 6, name: 'Bình Cuồng Nộ', col: '#a855f7', shape: 'flask', icon: '', fx: p => { p.st.rage = Math.max(p.st.rage, 4); return 'CUỒNG NỘ!'; } },
    regen:   { w: 8, name: 'Thảo Dược', col: '#84cc16', shape: 'leaf', icon: '', fx: p => { p.st.heal = Math.max(p.st.heal || 0, 6); p.st.healRate = Math.max(p.st.healRate || 0, 7); return 'HỒI MÁU DẦN'; } },
    gift:    { w: 6, name: 'Hộp Quà', col: '#ec4899', shape: 'gift', icon: '', fx: p => giveItem(p) ? 'QUÀ!' : supplyHeal(p, 30) },
    holy:    { w: 4, name: 'Nước Thánh', col: '#7dd3fc', shape: 'drop', icon: '', fx: p => { cleanseNow(p); supplyHeal(p, 20); return 'THANH TẨY'; } }
};
function supplyHeal(p, n) { p.hp = Math.min(p.maxHp, p.hp + n * (p.scavenger ? 2 : 1)); spark(p.x, p.y, '#4ade80', 10, 120); return `+${n} HP`; }
const SUPPLY_IDS = Object.keys(SUPPLY);
function rollSupply() { const tot = SUPPLY_IDS.reduce((s, k) => s + SUPPLY[k].w, 0); let r = Math.random() * tot; for (const k of SUPPLY_IDS) { if (r < SUPPLY[k].w) return k; r -= SUPPLY[k].w; } return 'med'; }
const _makeCrate9 = makeCrate;
makeCrate = function (x, y, type) { const c = _makeCrate9(x, y, type); if (c.type === 'SUPPORT' && !c.look) c.look = rollSupply(); return c; };
const _openCrate9 = openCrate;
openCrate = function (p, index) {
    const c = crates[index];
    if (!c || c.type !== 'SUPPORT' || !SUPPLY[c.look]) return _openCrate9(p, index);
    const S = SUPPLY[c.look];
    crates.splice(index, 1); p.stats.crates++; AudioSys.play('pickup');
    const txt = S.fx(p);
    if (p.adv === 'medkit' && !['med', 'mega'].includes(c.look)) supplyHeal(p, 25);
    floatText(p.x, p.y - 24, `${S.name}: ${txt || ''}`, S.col, 15);
    if (p.scrapper) (p.skills || []).forEach(s => { if (SUMMON_SKILLS.includes(s.id) && s.cd > 0) s.cd = Math.max(0, s.cd - 3); });
};
/** Vẽ hộp hỗ trợ theo loại (render.js gọi) */
function drawSupportCrate(c, s, bob, now) {
    const S = SUPPLY[c.look]; if (!S) return false;
    const col = S.col, x = c.x, y = c.y + bob - 2, h = s / 2;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + s * 0.55, s * 0.55, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, s * 1.4); g.addColorStop(0, hexA(col, 0.32)); g.addColorStop(1, hexA(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 1.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(x, y);
    const grad = ctx.createLinearGradient(0, -h, 0, h); grad.addColorStop(0, shade(col, 0.35)); grad.addColorStop(1, shade(col, -0.3));
    ctx.fillStyle = grad; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath();
    switch (S.shape) {
        case 'heart': ctx.moveTo(0, h * 0.9); ctx.bezierCurveTo(-h * 1.4, -h * 0.1, -h * 0.6, -h * 1.2, 0, -h * 0.4); ctx.bezierCurveTo(h * 0.6, -h * 1.2, h * 1.4, -h * 0.1, 0, h * 0.9); break;
        case 'hex': for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(Math.cos(a) * h * 1.05, Math.sin(a) * h * 1.05); } ctx.closePath(); break;
        case 'diamond': ctx.moveTo(0, -h * 1.15); ctx.lineTo(h * 0.8, 0); ctx.lineTo(0, h * 1.15); ctx.lineTo(-h * 0.8, 0); ctx.closePath(); break;
        case 'cyl': rrect(ctx, -h * 0.6, -h, h * 1.2, h * 2, h * 0.5); break;
        case 'can': rrect(ctx, -h * 1.1, -h * 0.75, h * 2.2, h * 1.5, 4); break;
        case 'flask': ctx.moveTo(-h * 0.25, -h); ctx.lineTo(h * 0.25, -h); ctx.lineTo(h * 0.25, -h * 0.3); ctx.lineTo(h * 0.9, h * 0.9); ctx.lineTo(-h * 0.9, h * 0.9); ctx.lineTo(-h * 0.25, -h * 0.3); ctx.closePath(); break;
        case 'leaf': ctx.ellipse(0, 0, h * 0.6, h * 1.05, 0.6, 0, Math.PI * 2); break;
        case 'drop': ctx.moveTo(0, -h * 1.15); ctx.bezierCurveTo(h * 1.1, 0, h * 0.8, h, 0, h); ctx.bezierCurveTo(-h * 0.8, h, -h * 1.1, 0, 0, -h * 1.15); break;
        case 'gift': rrect(ctx, -h, -h * 0.7, h * 2, h * 1.7, 4); break;
        default: rrect(ctx, -h, -h, h * 2, h * 2, 5);
    }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    if (S.shape === 'gift') { ctx.fillStyle = '#fde68a'; ctx.fillRect(-2.5, -h * 0.7, 5, h * 1.7); ctx.fillRect(-h, 0, h * 2, 4); ctx.beginPath(); ctx.ellipse(-5, -h * 0.85, 5, 3, -0.5, 0, Math.PI * 2); ctx.ellipse(5, -h * 0.85, 5, 3, 0.5, 0, Math.PI * 2); ctx.fill(); }
    else if (S.shape === 'cyl') { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-h * 0.6, -h * 0.3, h * 1.2, 4); }
    else if (S.shape === 'flask') { ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(now * 6) * 0.15})`; ctx.beginPath(); ctx.arc(-2, h * 0.4, 3, 0, Math.PI * 2); ctx.arc(3, h * 0.2, 2, 0, Math.PI * 2); ctx.fill(); }
    else if (S.shape === 'leaf') { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-h * 0.5, h * 0.7); ctx.lineTo(h * 0.5, -h * 0.7); ctx.stroke(); }
    else if (S.shape === 'heart' || S.shape === 'diamond' || S.shape === 'drop') { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(-h * 0.25, -h * 0.3, h * 0.2, 0, Math.PI * 2); ctx.fill(); }
    if (S.icon) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = `700 ${Math.round(s * 0.55)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(S.icon, 0, 1); }
    ctx.restore();
    return true;
}
