/** ==================== REWORK 14 — CÂN BẰNG ====================
 *  · Máu cơ bản 200 → 600 (cộng thêm sau khi áp thẻ, nên thẻ +máu vẫn cộng như cũ).
 *  · Vũ khí DỄ TRÚNG (tự tìm mục tiêu, đánh tức thì, phun/toả rộng, bỏ qua phòng thủ) giảm sát thương; Ma Đao giảm nhẹ.
 *    Áp theo vũ khí kẻ tấn công ĐANG CẦM (gồm cả Bậc Thầy / Trang Bị Phụ / KTC dùng khi cầm vũ khí đó).
 *  · Súng Hỏa Mai: 500 → 999 sát thương chuẩn.
 */
const BASE_HP_R14 = 600;
const EASY_NERF_R14 = {
    TESLA: 0.8, FLAME: 0.8, ICEGUN: 0.8, EWHIP: 0.8, URUMI: 0.8, RAILGUN: 0.8,
    SHOTGUN: 0.8, SAR: 0.8, MOBGEAR: 0.8, DISC: 0.8, XBOWR: 0.8, MINIGUN: 0.8,
    MADAO: 0.9 // Ma Đao ("Ám đao"): chỉ giảm nhẹ
};

/* ---------- máu cơ bản ---------- */
const _resetR14 = resetPlayerForRound;
resetPlayerForRound = function (p) {
    const r = _resetR14(p);
    if (p.maxHp > 1) { p.maxHp += BASE_HP_R14 - 200; p.hp = p.maxHp; p.ghostHp = p.maxHp; }
    return r;
};

/* ---------- giảm sát thương vũ khí dễ trúng ---------- */
function nerfR14(attackerId, target) {
    if (attackerId === -1 || attackerId === undefined) return 1;
    const A = players.find(q => q.id === attackerId); if (!A || A === target) return 1;
    const w = getCurrentWeapon(A); return (w && EASY_NERF_R14[w.id]) || 1;
}
const _dealDamageR14 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && !opts.raw) dmg *= nerfR14(attackerId, target);
    return _dealDamageR14(target, dmg, attackerId, opts);
};
const _trueDamageR14 = trueDamage;
trueDamage = function (target, T, attackerId) { return _trueDamageR14(target, T * nerfR14(attackerId, target), attackerId); };
Object.keys(EASY_NERF_R14).forEach(id => { const w = WEAPONS[id]; if (w && w.desc && !w.desc.includes('DỄ TRÚNG')) w.desc += ` (Vũ khí DỄ TRÚNG: sát thương ×${EASY_NERF_R14[id]}.)`; });

/* ---------- Hỏa Mai 999 ---------- */
const _musketFixR14 = musketFix;
musketFix = function (p, w, ang, charge, mine) {
    const r = _musketFixR14(p, w, ang, charge, mine);
    (mine || []).forEach(b => { b.damage = 999; b.trueDmg = 999; });
    return r;
};
WEAPONS.MUSKET.desc = WEAPONS.MUSKET.desc.replace(/500 SÁT THƯƠNG CHUẨN/g, '999 SÁT THƯƠNG CHUẨN');
