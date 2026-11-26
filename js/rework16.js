/** ==================== REWORK 16 — ĐỘ BỀN ====================
 *  · Vũ khí cận chiến / khiên / đa hình: MỖI LẦN RA ĐÒN −1 độ bền, dù trúng hay trượt (bỏ −1 khi trúng cũ để không trừ 2 lần).
 *  · CHẶN ĐẠN tốn rất nhanh & nhiều: mọi viên đạn địch bị chặn / chém / phản quanh người cầm vũ khí cận chiến → −max(2, sát thương/8).
 *    (dò chung mỗi khung: đạn địch biến mất / đổi chủ sát người mà không trúng ai, không chạm tường, chưa hết tầm)
 *  · Vũ khí COMBO: độ bền = số đòn combo × 5 → múa được 5 lượt combo là gãy và bị ném đi.
 *  · Giữ nguyên miễn trừ của thẻ độc quyền (Sát Thủ 7: Ma Đao/Kéo · Chỉ Huy: Vạn Tượng) — nằm ở các wrapper bên trong.
 */
const COMBO_LEN_R16 = { KNIFE: 3, KATANA: 3, LIGHTSABER: 3, AXE: 3, RUYIBANG: 3, LONGSWORD: 3, SNAKESWORD: 3, SCISSORS: 3, STAFF: 4, URUMI: 4 };
const COMBO_ROUNDS_R16 = 5;
const isPolyR16 = w => !!w && ((typeof POLY_WEPS !== 'undefined' && POLY_WEPS.includes(w.id)) || w.id === 'VANTUONG');
const durWepR16 = w => !!w && w.id !== 'NONE' && (w.type === 'MELEE' || w.type === 'SHIELD' || isPolyR16(w));

/* ---------- độ bền vũ khí combo / vũ khí đa hình chưa có độ bền ---------- */
const _makeWeaponR16 = makeWeapon;
makeWeapon = function (id, p) {
    const w = _makeWeaponR16(id, p);
    if (!w) return w;
    const L = COMBO_LEN_R16[w.id], base = WEAPONS[w.id] && (WEAPONS[w.id].maxDurability || WEAPONS[w.id].durability);
    if (L && base && w.durability !== undefined && !w._r16) { const k = L * COMBO_ROUNDS_R16 / base; w.durability = Math.max(1, Math.round(w.durability * k)); w.maxDurability = Math.max(1, Math.round((w.maxDurability || base) * k)); w._r16 = true; }
    if (isPolyR16(w) && w.durability === undefined) { w.durability = w.maxDurability = 40; }
    return w;
};
Object.keys(COMBO_LEN_R16).forEach(id => { const w = WEAPONS[id]; if (w && w.desc !== undefined) w.desc += ` (Độ bền: ${COMBO_ROUNDS_R16} lượt combo — mỗi đòn trúng hay trượt đều tốn.)`; });

/* ---------- mỗi đòn đều tốn; bỏ trừ-khi-trúng ---------- */
let durAllowR16 = 0;
const _reduceDurR16 = reduceDurability;
reduceDurability = function (p, wep, amount) {
    if (!durAllowR16 && durWepR16(wep) && amount <= 3) return; // −1/−2 khi đánh trúng: đã tính theo mỗi đòn
    if (!durAllowR16 && wep && wep.type === 'SHIELD' && amount >= 10) amount *= 2; // khiên chặn đạn: tốn gấp đôi
    return _reduceDurR16(p, wep, amount);
};
function spendDurR16(p, w, n) { durAllowR16++; try { reduceDurability(p, w, n); } finally { durAllowR16--; } }
const _fireWeaponR16 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    const t0 = p.lastFireT, r = _fireWeaponR16(p, w, ang, charge, enemy);
    if (durWepR16(w) && p.lastFireT !== t0 && p.lastFireT === world.time && w.durability !== undefined && getCurrentWeapon(p) === w) spendDurR16(p, w, 1);
    return r;
};

/* ---------- chặn đạn ---------- */
const hitBulletsR16 = new WeakSet();
const _dealDamageR16 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) { if (opts && opts.bullet) hitBulletsR16.add(opts.bullet); return _dealDamageR16(target, dmg, attackerId, opts); };
let bulSnapR16 = new Map();
function blockScanR16(dt) {
    const alive = new Set(bullets), holders = players.filter(p => p.hp > 0 && durWepR16(getCurrentWeapon(p)) && getCurrentWeapon(p).durability !== undefined);
    if (holders.length) bulSnapR16.forEach((s, b) => {
        const gone = !alive.has(b), flipped = !gone && b.owner !== s.owner;
        if (!gone && !flipped) return;
        if (hitBulletsR16.has(b) || b.hitP && !flipped) return;           // trúng người
        if (gone && (s.life <= dt * 1.5 || pointInObstacle(s.x + Math.cos(s.a) * s.sp, s.y + Math.sin(s.a) * s.sp, 2))) return; // hết tầm / chạm tường
        const p = holders.find(q => q.id !== s.owner && (flipped ? b.owner === q.id : true) && dist(q.x, q.y, s.x, s.y) < q.radius + 70 && !sameTeamR16(q.id, s.owner));
        if (!p) return;
        const w = getCurrentWeapon(p), cost = Math.max(2, Math.ceil((s.dmg || 8) / 8));
        spendDurR16(p, w, cost);
        if (!p.isBot && w.durability > 0 && (p._r16T || 0) < world.time) { p._r16T = world.time + 0.4; floatText(p.x, p.y - 40, `🛡 −${cost} độ bền`, '#fca5a5', 11); }
    });
    bulSnapR16 = new Map();
    bullets.forEach(b => { if (b.owner !== undefined) bulSnapR16.set(b, { x: b.x, y: b.y, a: b.angle || 0, sp: (b.speed || 20) * 1.2, owner: b.owner, dmg: b.damage, life: b.life }); });
}
const sameTeamR16 = (a, b) => typeof sameTeamId === 'function' ? sameTeamId(a, b) : false;
const _upeR16 = updatePartyExtras;
updatePartyExtras = function (dt) { const r = _upeR16(dt); if (gameState === 'PLAYING' || gameState === 'KO') blockScanR16(dt); else bulSnapR16.clear(); return r; };
