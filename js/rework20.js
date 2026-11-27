/** ==================== REWORK 20 — NHÂN THEO TỈ LỆ MÁU MỚI ====================
 *  Máu cơ bản 200 → 600 (rework14) nên mọi con số tính theo mốc 200 cũ yếu đi ×3. Hệ số HEALK = 600 / 200.
 *  · HỒI MÁU CỐ ĐỊNH (+25, +35, 4 máu/giây…): đã nhân HEALK ngay tại chỗ trong các file gốc (34 chỗ, dạng `(x) * HEALK`).
 *    KHÔNG nhân: hồi theo % máu tối đa, hút máu theo % sát thương (đã tự đúng tỉ lệ), hồi máu Chỉ Huy (đã tính theo máu mới).
 *  · MÁU THÊM: Robot/Titan (form), Giáp Robot (Mech +300), biến cố Titan (+200) → ×HEALK.
 *  · SÁT THƯƠNG KỸ NĂNG / PHÉP ×HEALK: đòn trực tiếp (ngữ cảnh rework19), đạn/vật ném/vùng tạo bởi kỹ năng,
 *    không kích của kỹ năng, quân triệu hồi. Đòn đánh thường của vũ khí KHÔNG đổi (súng đã chỉnh riêng ở rework15).
 *  · KHIÊN từ kỹ năng / phép ×HEALK.
 */
const HEALK = (typeof BASE_HP_R14 !== 'undefined' ? BASE_HP_R14 : 600) / 200;

/* ---------- sát thương kỹ năng ---------- */
let strikeOwner20 = null; // khi đang cập nhật không kích: chủ nào chỉ có không kích từ kỹ năng
function skillDmg20(target, attackerId, opts) {
    if (attackerId === -1 || attackerId === undefined) return false;
    if (opts && opts.summon) return true;                               // quân triệu hồi
    if (typeof isSkillDmgR19 === 'function' && isSkillDmgR19(opts)) return true; // đòn trực tiếp / đạn của kỹ năng
    if (opts && opts.zone && target) {                                   // vùng do kỹ năng tạo
        const z = zones.find(q => q._skill && q.owner === attackerId && dist(q.x, q.y, target.x, target.y) < (q.r || 0) + target.radius);
        if (z) return true;
    }
    return strikeOwner20 !== null && strikeOwner20.has(attackerId);       // không kích do kỹ năng gọi
}
const _dealDamageR20 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && !(opts && opts.raw) && skillDmg20(target, attackerId, opts)) dmg *= HEALK;
    return _dealDamageR20(target, dmg, attackerId, opts);
};
const _trueDamageR20 = trueDamage;
trueDamage = function (target, T, attackerId) { return _trueDamageR20(target, skillDmg20(target, attackerId, {}) ? T * HEALK : T, attackerId); };
// không kích: trong lúc cập nhật, chủ nào có không kích đang chạy mà TẤT CẢ đều do kỹ năng tạo → tính là sát thương kỹ năng
const _updateStrikesR20 = updateStrikes;
updateStrikes = function (dt) {
    const own = new Map(); strikes.forEach(s => { if (!s || s.owner === undefined) return; const o = own.get(s.owner) || { sk: 0, other: 0 }; if (s._skill) o.sk++; else o.other++; own.set(s.owner, o); });
    const set = new Set(); own.forEach((o, id) => { if (o.sk && !o.other) set.add(id); });
    strikeOwner20 = set; const nb = bullets.length;
    try { return _updateStrikesR20(dt); } finally { strikeOwner20 = null; for (let i = nb; i < bullets.length; i++) { const b = bullets[i]; if (b && set.has(b.owner)) b._skill = true; } }
};
// nổ do kỹ năng (explode gọi ngoài ngữ cảnh nhưng từ vật/không kích đã gắn _skill) đã được rework19 chạy lại trong ngữ cảnh kỹ năng

/* ---------- khiên từ kỹ năng / phép ---------- */
function shieldUp20(p, fn) {
    const s0 = (p && p.st && p.st.shield) || 0, r = fn();
    if (p && p.st && p.st.shield > s0) p.st.shield = s0 + (p.st.shield - s0) * HEALK;
    return r;
}
const _castSkillR20 = castSkill;
castSkill = function (p, slot, aimVec) { return shieldUp20(p, () => _castSkillR20(p, slot, aimVec)); };
const _castSpellR20 = castSpell;
castSpell = function (p, i) { return shieldUp20(p, () => _castSpellR20(p, i)); };

/* ---------- máu Robot / Titan (form) ---------- */
const _upeR20 = updatePartyExtras;
updatePartyExtras = function (dt) {
    const r = _upeR20(dt);
    players.forEach(p => { if (p.form && !p.form._hk20) { p.form._hk20 = true; p.form.hp *= HEALK; p.form.maxHp *= HEALK; } });
    return r;
};

/* ---------- kỹ năng gây sát thương CHẬM (sau khi castSkill đã xong) ---------- */
// đạn sinh ra từ không kích do kỹ năng gọi (vd. Kỹ Thuật Cao súng lục bắn dần từng loạt) → mang nhãn kỹ năng
const _spawnBulletR20 = spawnBullet;
spawnBullet = function (p) { const b = _spawnBulletR20.apply(this, arguments); if (b && p && strikeOwner20 && strikeOwner20.has(p.id)) b._skill = true; return b; };
// nhảy / lướt bắt đầu trong kỹ năng → cú đáp (landEffect) tính là kỹ năng
const _startTravelR20 = startTravel;
startTravel = function (p) { const r = _startTravelR20.apply(this, arguments); if (p) p._landSkill20 = typeof SRC19 !== 'undefined' && SRC19.skill > 0; return r; };
const _landEffectR20 = landEffect;
landEffect = function (p, kind, o) {
    if (p && p._landSkill20) { p._landSkill20 = false; SRC19.skill++; try { return _landEffectR20(p, kind, o); } finally { SRC19.skill--; } }
    return _landEffectR20(p, kind, o);
};
// Bậc Thầy Kim Cô: đáp tự động (hết giờ) cũng là kỹ năng
const _ruyiPerchLandR20 = ruyiPerchLand;
ruyiPerchLand = function (p, x, y) { SRC19.skill++; try { return _ruyiPerchLandR20(p, x, y); } finally { SRC19.skill--; } };
