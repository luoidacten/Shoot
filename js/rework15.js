/** ==================== REWORK 15 — SÚNG: 2 BĂNG ĐẠN = 1 MẠNG ====================
 *  Mục tiêu: bắn trúng hết 2 băng đạn (băng gốc, không thẻ) là hạ đủ 600 máu → mỗi băng ≥ 300 sát thương.
 *  Hệ số đo bằng Playwright (tools/tests/t136.js): bắn hết 1 băng vào hình nộm 600 máu, trúng hết, đã tính cả giảm "dễ trúng".
 *  · Súng nào 1 băng < 300 → tăng sát thương (×300 / sát thương đo được). Súng đã ≥ 300 → giữ nguyên.
 *  · SNIPER đặc biệt: mỗi viên trúng gây ĐÚNG 100 (bỏ qua chí mạng / buff) → phải trúng đủ 6 viên (2 băng × 3).
 *  · Không áp: Hỏa Mai (999), Boomerang (không có băng — bay về), Súng Lưới (súng khống chế), súng chiến thuật / đa hình.
 *  Áp theo vũ khí kẻ tấn công đang cầm (giống rework14), viên đạn mang theo id vũ khí bắn ra (b.wid) nếu có.
 */
const MAG_TARGET_R15 = 300;
const MAG_DMG_R15 = { // sát thương đo được của 1 băng (trước khi buff, không tính tự ném vũ khí khi hết đạn)
    PISTOL: 187, REVOLVER: 215, SMG: 210, AR: 182, SHOTGUN: 163, ROCKET: 165, LAUNCHER: 268, ENERGY: 154, TESLA: 150,
    RAILGUN: 68, SPISTOL: 248, XBOWX: 292, XBOWR: 285, ICEGUN: 187, DARTS: 96, BOMB: 168, FIREBOMBW: 195
};
const GUN_BUFF_R15 = {};
Object.keys(MAG_DMG_R15).forEach(id => { GUN_BUFF_R15[id] = Math.max(1, Math.round(MAG_TARGET_R15 / MAG_DMG_R15[id] * 100) / 100); });
const SNIPER_HIT_R15 = 100;

function gunWidR15(A, opts) { const b = opts && opts.bullet; if (b && b.wid) return b.wid; const w = getCurrentWeapon(A); return w && w.id; }
const _dealDamageR15 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && target.hp > 0 && attackerId !== -1 && attackerId !== undefined) {
        const A = players.find(q => q.id === attackerId);
        if (A && A !== target) {
            const wid = gunWidR15(A, opts);
            if (wid === 'SNIPER' && opts.bullet && !opts.raw) return _dealDamageR15(target, SNIPER_HIT_R15, attackerId, Object.assign({}, opts, { raw: true }));
            if (!opts.raw && GUN_BUFF_R15[wid]) dmg *= GUN_BUFF_R15[wid];
        }
    }
    return _dealDamageR15(target, dmg, attackerId, opts);
};
const _trueDamageR15 = trueDamage;
trueDamage = function (target, T, attackerId) {
    const A = attackerId !== -1 && players.find(q => q.id === attackerId), w = A && A !== target && getCurrentWeapon(A);
    return _trueDamageR15(target, T * ((w && GUN_BUFF_R15[w.id]) || 1), attackerId);
};
Object.keys(GUN_BUFF_R15).forEach(id => { const w = WEAPONS[id]; if (w && GUN_BUFF_R15[id] > 1 && w.desc !== undefined) w.desc = (w.desc || '') + ` (Sát thương ×${GUN_BUFF_R15[id]}: 2 băng = 1 mạng.)`; else if (w && GUN_BUFF_R15[id] > 1) w.desc = `Sát thương ×${GUN_BUFF_R15[id]}: 2 băng = 1 mạng.`; });
WEAPONS.SNIPER.desc = (WEAPONS.SNIPER.desc || '') + ' Mỗi viên trúng gây đúng 100 sát thương (không chí mạng): trúng đủ 6 viên = 2 băng mới hạ 1 mạng.';
