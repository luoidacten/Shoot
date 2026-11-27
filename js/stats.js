/** ==================== CON ĐƯỜNG ĐỘC TÔN · NÂNG CẤP CHỈ SỐ · 10 THẺ CHỈ SỐ · PHỐI HỢP ====================
 *  Nạp sau summons.js. Chỉ số của Độc Tôn lưu trong p.minor dạng 'id*hệ_số' (ví dụ 'dmg*1.75').
 */

/* ============================== BẢNG CHỈ SỐ (hệ số k nhân vào mọi con số) ============================== */
const pct = (x, k) => Math.round(x * k * 100);
const num = (x, k) => Math.round(x * k);
const SOLO_STATS = {
    // 6 chỉ số cũ
    hp:    { icon: '❤️', name: 'Máu', fmt: k => `+${num(25, k)} máu tối đa.`, apply: (p, k) => { p.maxHp += 25 * k; } },
    dmg:   { icon: '🗡️', name: 'Sát Thương', fmt: k => `+${pct(0.1, k)}% sát thương.`, apply: (p, k) => { p.dmgMult *= 1 + 0.1 * k; } },
    spd:   { icon: '👟', name: 'Tốc Chạy', fmt: k => `+${pct(0.08, k)}% tốc chạy.`, apply: (p, k) => { p.moveMult *= 1 + 0.08 * k; } },
    cdr:   { icon: '⏳', name: 'Hồi Chiêu', fmt: k => `Kỹ năng hồi nhanh hơn ${pct(0.12, k)}%.`, apply: (p, k) => { p.cdMult *= Math.max(0.4, 1 - 0.12 * k); } },
    rof:   { icon: '🔫', name: 'Tốc Đánh', fmt: k => `+${pct(0.13, k)}% tốc đánh.`, apply: (p, k) => { p.fireRateMult *= Math.max(0.4, 1 - 0.13 * k); } },
    arm:   { icon: '🦺', name: 'Giáp', fmt: k => `Mỗi hiệp khởi đầu thêm ${num(30, k)} giáp.`, apply: (p, k) => { p.maxArmor += 30 * k; } },
    // 4 chỉ số mới
    vis:   { icon: '👁️', name: 'Tầm Nhìn', fmt: k => `+${pct(0.12, k)}% tầm nhìn (vùng sáng & đèn pin).`, apply: (p, k) => { p.statVis *= 1 + 0.12 * k; } },
    crit:  { icon: '🎯', name: 'Chí Mạng', fmt: k => `+${pct(0.06, k)}% tỉ lệ chí mạng.`, apply: (p, k) => { p.critChance += 0.06 * k; } },
    acc:   { icon: '➰', name: 'Chính Xác', fmt: k => `Đạn tỏa ít hơn ${pct(0.15, k)}%.`, apply: (p, k) => { p.spreadMult *= Math.max(0.3, 1 - 0.15 * k); } },
    regen: { icon: '💚', name: 'Hồi Máu', fmt: k => `Không bị đánh 3 giây: hồi ${(1.5 * k).toFixed(1)} máu/giây.`, apply: (p, k) => { p.statRegen += 1.5 * k; } },
    // 4 nâng cấp nhiều chỉ số
    bal:   { icon: '⚖️', name: 'Toàn Diện', multi: true, fmt: k => `+${num(12, k)} máu, +${pct(0.05, k)}% sát thương, +${pct(0.04, k)}% tốc chạy.`, apply: (p, k) => { p.maxHp += 12 * k; p.dmgMult *= 1 + 0.05 * k; p.moveMult *= 1 + 0.04 * k; } },
    tank:  { icon: '🛡️', name: 'Chiến Binh', multi: true, fmt: k => `+${num(30, k)} máu, +${num(20, k)} giáp mỗi hiệp, -3% tốc chạy.`, apply: (p, k) => { p.maxHp += 30 * k; p.maxArmor += 20 * k; p.moveMult *= 0.97; } },
    hunt:  { icon: '🏹', name: 'Thợ Săn', multi: true, fmt: k => `+${pct(0.08, k)}% sát thương, +${pct(0.08, k)}% tầm nhìn, +${pct(0.03, k)}% chí mạng.`, apply: (p, k) => { p.dmgMult *= 1 + 0.08 * k; p.statVis *= 1 + 0.08 * k; p.critChance += 0.03 * k; } },
    agile: { icon: '💨', name: 'Linh Hoạt', multi: true, fmt: k => `+${pct(0.08, k)}% tốc chạy, +${pct(0.08, k)}% tốc đánh, kỹ năng hồi nhanh ${pct(0.08, k)}%.`, apply: (p, k) => { p.moveMult *= 1 + 0.08 * k; p.fireRateMult *= Math.max(0.4, 1 - 0.08 * k); p.cdMult *= Math.max(0.4, 1 - 0.08 * k); } }
};
const SOLO_IDS = Object.keys(SOLO_STATS);
const parseStat = e => { const [id, k] = String(e).split('*'); return { id, k: k ? +k : 1 }; };

/* ============================== LỢI THẾ: CON ĐƯỜNG ĐỘC TÔN ============================== */
ADVANTAGES.soloPath = { icon: '👑', name: 'Con Đường Độc Tôn', desc: 'Không nhận thẻ kỹ năng / nội tại nữa. Mỗi lần nâng cấp nhận 2 gói chỉ số, cấp càng về sau càng cao và mạnh (cấp I ×1.5 → cấp V ×3.5). Có cả gói kép.' };
ADV_IDS.push('soloPath');
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
const soloTier = p => Math.max(1, Math.min(6, p.soloTier || 1));
const soloK = p => 1 + 0.5 * soloTier(p); // cấp I ×1.5 → cấp V ×3.5
function statPhase(n) {
    return { kind: 'solo', render: 'solo', title: '👑 CON ĐƯỜNG ĐỘC TÔN · CHỌN CHỈ SỐ',
        label: p => `CHỌN GÓI CHỈ SỐ ${n}/2 · CẤP ${ROMAN[soloTier(p)]}`,
        who: p => p.adv === 'soloPath' && (p.soloDue || 0) >= n,
        choices: () => { const pool = SOLO_IDS.slice(), out = []; while (out.length < 4 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return out; },
        ctx: p => ({ k: soloK(p), tier: soloTier(p) }),
        bot: (p, ids) => Math.floor(Math.random() * ids.length),
        onPick: (p, id) => { p.minor.push(id + '*' + soloK(p).toFixed(2)); p.soloPicks = (p.soloPicks || 0) + 1; } };
}
const _cardHTML5 = cardHTML;
cardHTML = function (id, kind, owned, keyLabel) {
    if (kind === 'solo') { const s = SOLO_STATS[id], k = (pickCtx && pickCtx.k) || 1.5; return `<span class="aug-key">${keyLabel || ''}</span><span class="aug-rarity">${s.multi ? 'GÓI KÉP' : 'GÓI CHỈ SỐ'} · CẤP ${ROMAN[(pickCtx && pickCtx.tier) || 1]}</span><div class="aug-icon">${s.icon}</div><div class="aug-name">${s.name}</div><div class="aug-desc">${s.fmt(k)}</div>`; }
    return _cardHTML5(id, kind, owned, keyLabel);
};
const _cardClass5 = cardClass;
cardClass = function (id, kind, owned) { if (kind === 'solo') return SOLO_STATS[id].multi ? 'rare legend' : 'rare'; return _cardClass5(id, kind, owned); };
const _ownedRow5 = ownedRowHTML;
ownedRowHTML = function (build, minor) {
    const st = (minor || []).map(e => { const s = SOLO_STATS[parseStat(e).id]; return s ? s.icon : ''; }).join('');
    return _ownedRow5((build || []).filter(id => id !== '__solo'), []) + (st ? ` <span class="own-minor">${st}</span>` : '');
};
// màn nâng cấp thường: người Độc Tôn bỏ qua, chọn chỉ số sau khi mọi người chốt
const SOLO_WAIT = '👑 ĐỘC TÔN · CHỌN CHỈ SỐ SAU KHI MỌI NGƯỜI CHỐT';
const _openAug5 = openAugmentScreen;
openAugmentScreen = function () {
    const pick = isPickRound(currentRound), lp = players.find(q => q.id === localId());
    if (pick && lp && lp.adv === 'soloPath') pickCtx = { label: SOLO_WAIT };
    _openAug5();
    if (!pick || gameState !== 'AUGMENT' || augState.phase) return;
    players.forEach(p => {
        if (p.adv !== 'soloPath' || augState.picked[p.id]) return;
        augState.picked[p.id] = '__solo';
        p.soloDue = 2; p.soloTier = pickCount + 1; // lần nâng cấp thứ mấy = cấp mấy
        const side = pickSide(p.id);
        if (side) { $(`p${side}-cards`).innerHTML = ''; $(`p${side}-wait`).classList.remove('hidden'); }
    });
    if (players.every(q => augState.picked[q.id])) pickAugmentByIndex(-1, 0, true); // kích hoạt kết thúc nếu ai cũng Độc Tôn
};
const _pickAug5 = pickAugmentByIndex;
pickAugmentByIndex = function (pid, idx, fromRemote) {
    if (pid === -1) { // mọi người đều là Độc Tôn: tự đóng màn nâng cấp
        if (gameState !== 'AUGMENT' || augState.phase) return;
        gameState = 'AUG_DONE'; pickCount++;
        setTimeout(() => { if (gameState === 'AUG_DONE') startDestinyIntro(); }, 600);
        return;
    }
    return _pickAug5(pid, idx, fromRemote);
};
const _netSendTo5 = netSendTo;
netSendTo = function (id, msg) {
    if (msg && msg.t === 'aug' && msg.kind === 'build' && !msg.ctx) { const p = players.find(q => q.id === id); if (p && p.adv === 'soloPath') { msg.ids = []; msg.ctx = { label: SOLO_WAIT }; } }
    return _netSendTo5(id, msg);
};
const _sdi5 = startDestinyIntro;
startDestinyIntro = function () {
    if (augState.phase) return;
    players.forEach(p => { p.build = (p.build || []).filter(id => id !== '__solo'); });
    if (players.some(p => p.adv === 'soloPath' && p.soloDue > 0)) {
        runPhases([statPhase(1), statPhase(2)], () => { players.forEach(p => p.soloDue = 0); _sdi5(); });
        return;
    }
    _sdi5();
};

/* ============================== 10 THẺ LIÊN QUAN CHỈ SỐ ============================== */
defP('growth', '🌱', 'Lớn Dần', 'Mỗi hiệp đã qua: +6 máu tối đa và +2% sát thương (cộng dồn).', p => { const r = Math.max(0, currentRound - 1); p.maxHp += (combo(p, 'growJug') ? 10 : 6) * r; p.dmgMult *= 1 + 0.02 * r; if (combo(p, 'growBal')) p.moveMult *= 1 + 0.02 * r; });
defP('momentum', '🏃', 'Đà Tiến', 'Chạy liên tục 1.5 giây: +15% sát thương cho tới khi dừng lại.', p => { p.momentum = true; });
defP('glassCannon', '🍷', 'Pháo Thủy Tinh', '+30% sát thương, -30 máu tối đa.', p => { p.dmgMult *= 1.3; p.maxHp -= 30; });
defP('juggernaut', '🦏', 'Xe Tăng Thịt', '+60 máu tối đa, -10% tốc chạy.', p => { p.maxHp += 60; p.moveMult *= 0.9; });
defP('adaptive', '🔄', 'Thích Nghi', 'Mỗi 25 sát thương nhận vào trong hiệp: giảm 1% sát thương nhận (tối đa 20%).', p => { p.adaptive = true; });
defP('balanced', '⚖️', 'Cân Bằng', '+10% máu tối đa, sát thương, tốc chạy và tốc đánh.', p => { const k = combo(p, 'balAlt') ? 0.15 : 0.1; p.maxHp *= 1 + k; p.dmgMult *= 1 + k; p.moveMult *= 1 + k; p.fireRateMult *= 1 - k; });
defP('desperate', '🩹', 'Liều Mạng', 'Dưới 40% máu: +25% sát thương và nhận ít hơn 20% sát thương.', p => { p.desperate = true; });
defP('fullHp', '💯', 'Sung Sức', 'Khi đầy máu: gây thêm 20% sát thương.', p => { p.fullHp = true; });
defP('armorPlate', '🪖', 'Giáp Dày', '+50 giáp mỗi hiệp. Không bị đánh 4 giây: giáp hồi 2/giây.', p => { p.maxArmor += 50; p.armorPlate = true; });
defP('killStreak', '🔥', 'Chuỗi Hạ Gục', 'Mỗi lần hạ gục trong hiệp: +12% sát thương (cộng dồn).', p => { p.killStreak = true; });

/* ============================== 12 PHỐI HỢP MỚI ============================== */
[
    { id: 'growJug', a: 'growth', b: 'juggernaut', name: 'Khổng Lồ Tăng Trưởng', desc: 'Lớn Dần cho +10 máu mỗi hiệp thay vì 6.' },
    { id: 'growBal', a: 'growth', b: 'balanced', name: 'Phát Triển Toàn Diện', desc: 'Lớn Dần cho thêm +2% tốc chạy mỗi hiệp.' },
    { id: 'glassCrit', a: 'glassCannon', b: 'critEye', name: 'Đại Bác Pha Lê', desc: '+10% chí mạng nữa.' },
    { id: 'glassFull', a: 'glassCannon', b: 'fullHp', name: 'Đòn Phủ Đầu', desc: 'Sung Sức +35% thay vì 20%.' },
    { id: 'jugArmor', a: 'juggernaut', b: 'armorPlate', name: 'Pháo Đài Di Động', desc: 'Giáp Dày hồi 4 giáp/giây.' },
    { id: 'adaptJug', a: 'adaptive', b: 'juggernaut', name: 'Da Thép', desc: 'Thích Nghi giảm tối đa 35%.' },
    { id: 'momVault', a: 'momentum', b: 'vault', name: 'Parkour Chiến Đấu', desc: 'Đà Tiến chỉ cần chạy 0.8 giây.' },
    { id: 'streakMom', a: 'killStreak', b: 'momentum', name: 'Không Thể Cản', desc: 'Đã hạ gục ít nhất 1 người: Đà Tiến +30% thay vì 15%.' },
    { id: 'streakChain', a: 'killStreak', b: 'critChain', name: 'Sát Thần', desc: 'Mỗi lần hạ gục làm mới mọi kỹ năng.' },
    { id: 'desperateAdren', a: 'desperate', b: 'adrenaline', name: 'Liều Chết', desc: 'Liều Mạng kích hoạt từ dưới 60% máu.' },
    { id: 'balAlt', a: 'balanced', b: 'altChoice', name: 'Hoàn Hảo', desc: 'Cân Bằng +15% thay vì 10%.' },
    { id: 'armorBunker', a: 'armorPlate', b: 'reloadShield', name: 'Công Sự', desc: 'Đứng yên 1 giây: Giáp Dày hồi gấp đôi.' }
].forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
for (const id in COMBOS_OF) if (COMBOS_OF[id].length > 3 && id !== 'invis') console.warn('Thẻ có hơn 3 phối hợp:', id, COMBOS_OF[id].length);

/* ============================== ÁP DỤNG ============================== */
const _applyBuild5 = applyBuild;
applyBuild = function (p) {
    p.build = (p.build || []).filter(id => id !== '__solo');
    ['momentum', 'adaptive', 'desperate', 'fullHp', 'armorPlate', 'killStreak'].forEach(k => p[k] = false);
    p.statVis = 1; p.statRegen = 0; p.runT = 0; p.adaptTaken = 0; p.roundKills = p.stats ? (p.stats.kills || 0) : 0;
    const minor = p.minor || []; p.minor = []; // tự áp dụng chỉ số (có hệ số)
    try { _applyBuild5(p); } finally { p.minor = minor; }
    minor.forEach(e => { const { id, k } = parseStat(e); if (SOLO_STATS[id]) SOLO_STATS[id].apply(p, k); else if (STAT_BY_ID[id] && STAT_BY_ID[id].apply) STAT_BY_ID[id].apply(p); });
    if (combo(p, 'glassCrit')) p.critChance += 0.1;
    p.maxHp = Math.max(30, Math.round(p.maxHp));
};
const _dealDamage5 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const atk = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    if (atk && atk !== target && atk.st && !opts.raw) {
        if (atk.momentum && atk.runT >= (combo(atk, 'momVault') ? 0.8 : 1.5)) dmg *= combo(atk, 'streakMom') && (atk.stats.kills || 0) > atk.roundKills ? 1.3 : 1.15;
        if (atk.desperate && atk.hp < atk.maxHp * (combo(atk, 'desperateAdren') ? 0.6 : 0.4)) dmg *= 1.25;
        if (atk.fullHp && atk.hp >= atk.maxHp - 0.5) dmg *= combo(atk, 'glassFull') ? 1.35 : 1.2;
        if (atk.killStreak) dmg *= 1 + 0.12 * Math.max(0, (atk.stats.kills || 0) - atk.roundKills);
    }
    if (target && target.st && target.hp > 0 && !opts.raw) {
        if (target.desperate && target.hp < target.maxHp * (combo(target, 'desperateAdren') ? 0.6 : 0.4)) dmg *= 0.8;
        if (target.adaptive) { dmg *= 1 - Math.min(combo(target, 'adaptJug') ? 0.35 : 0.2, 0.01 * Math.floor((target.adaptTaken || 0) / 25)); target.adaptTaken = (target.adaptTaken || 0) + dmg; }
    }
    return _dealDamage5(target, dmg, attackerId, opts);
};
const _killPlayer5 = killPlayer;
killPlayer = function (dead, killerId) {
    const was = dead.dead;
    _killPlayer5(dead, killerId);
    const k = players.find(q => q.id === killerId);
    if (!was && dead.dead && k && combo(k, 'streakChain')) { (k.skills || []).forEach(s => s.cd = 0); (k.spells || []).forEach(s => s.cd = 0); floatText(k.x, k.y - 40, '☠ SÁT THẦN!', '#f87171', 16); }
};
function updateStats(dt) {
    players.forEach(p => {
        if (p.hp <= 0 || !p.st || gameState !== 'PLAYING') return;
        // Đà Tiến: đo quãng đường di chuyển
        const moved = p.lastPx !== undefined ? dist(p.x, p.y, p.lastPx, p.lastPy) : 0;
        p.lastPx = p.x; p.lastPy = p.y;
        p.runT = moved > 60 * dt ? (p.runT || 0) + dt : 0;
        const idle = world.time - (p.lastHurt || -10);
        if (p.statRegen > 0 && idle > 3 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + (p.statRegen * dt) * HEALK);
        if (p.armorPlate && idle > 4 && p.armor < p.maxArmor) p.armor = Math.min(p.maxArmor, p.armor + (combo(p, 'jugArmor') ? 4 : 2) * (combo(p, 'armorBunker') && (p.stillT || 0) >= 1 ? 2 : 1) * dt);
    });
}
const _upe5 = updatePartyExtras;
updatePartyExtras = function (dt) { _upe5(dt); updateStats(dt); };
const _visionRange5 = visionRange;
visionRange = function (viewer) { const v = viewer || localPlayer(); return _visionRange5(viewer) * ((v && v.statVis) || 1); };
const _snapPlayer5 = snapPlayer;
snapPlayer = function (p) { return Object.assign(_snapPlayer5(p), { statVis: p.statVis || 1 }); };
