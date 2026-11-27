/** ==================== REWORK 19 — SỬA SAU ĐỢT RÀ SOÁT ====================
 *  NGUỒN SÁT THƯƠNG: gắn nhãn cho đạn / vật ném / vùng / hàng đợi tạo ra bởi
 *    · ĐÒN ĐÁNH THƯỜNG (fireWeapon)  → _atkW = id vũ khí
 *    · KỸ NĂNG / PHÉP (castSkill, castSpell) → _skill = true
 *  Dùng để:
 *    · rework15 (súng 2 băng = 1 mạng, Sniper 100/viên): CHỈ áp cho đòn bắn thường — trước đây áp cả kỹ năng,
 *      phép, vùng lửa của thẻ khác khi đang cầm súng (Railgun KTC ×4.4, súng lục KTC ×1.6…).
 *    · rework14 (giảm vũ khí dễ trúng): không áp cho kỹ năng / phép.
 */
const SRC19 = { atk: [], skill: 0 };
const curAtk19 = () => SRC19.skill > 0 ? null : (SRC19.atk.length ? SRC19.atk[SRC19.atk.length - 1] : null);
function tag19(o) { if (!o || typeof o !== 'object') return; if (SRC19.skill > 0) o._skill = true; else { const w = curAtk19(); if (w && !o._atkW) o._atkW = w; } }
function wrapQ19(q) { // hàng đợi chiêu trễ: chạy lại trong đúng ngữ cảnh lúc tạo
    if (!q || typeof q.fn !== 'function' || q._r19) return; q._r19 = true;
    const f = q.fn, skill = SRC19.skill > 0, w = curAtk19();
    if (skill) q.fn = function () { SRC19.skill++; try { return f.apply(this, arguments); } finally { SRC19.skill--; } };
    else if (w) q.fn = function () { SRC19.atk.push(w); try { return f.apply(this, arguments); } finally { SRC19.atk.pop(); } };
}
// chạy fn trong ngữ cảnh, rồi gắn nhãn mọi thứ mới sinh ra trong lúc đó
function runCtx19(kind, wid, p, fn) {
    const L = { b: bullets.length, i: items.length, z: zones.length, s: strikes.length, w13: W13.length, w17: W17.length, q: p && p.shotQueue ? p.shotQueue.length : 0 };
    if (kind === 'skill') SRC19.skill++; else SRC19.atk.push(wid);
    try { return fn(); }
    finally {
        for (let i = L.b; i < bullets.length; i++) tag19(bullets[i]);
        for (let i = L.i; i < items.length; i++) tag19(items[i]);
        for (let i = L.z; i < zones.length; i++) tag19(zones[i]);
        for (let i = L.s; i < strikes.length; i++) tag19(strikes[i]);
        for (let i = L.w13; i < W13.length; i++) tag19(W13[i]);
        for (let i = L.w17; i < W17.length; i++) tag19(W17[i]);
        if (p && p.shotQueue) for (let i = L.q; i < p.shotQueue.length; i++) wrapQ19(p.shotQueue[i]);
        if (kind === 'skill') SRC19.skill--; else SRC19.atk.pop();
    }
}
const runObj19 = (f, p, fn) => f && f._skill ? runCtx19('skill', null, p, fn) : f && f._atkW ? runCtx19('atk', f._atkW, p, fn) : fn();

const _fireWeaponR19 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) { if (!w || SRC19.skill > 0) return _fireWeaponR19(p, w, ang, charge, enemy); return runCtx19('atk', w.id, p, () => _fireWeaponR19(p, w, ang, charge, enemy)); };
const _castSkillR19 = castSkill;
castSkill = function (p, slot, aimVec) { return runCtx19('skill', null, p, () => _castSkillR19(p, slot, aimVec)); };
const _castSpellR19 = castSpell;
castSpell = function (p, i) { return runCtx19('skill', null, p, () => _castSpellR19(p, i)); };
const _spawnBulletR19 = spawnBullet;
spawnBullet = function () { const b = _spawnBulletR19.apply(this, arguments); tag19(b); return b; };
// vật ném của rework13 / rework17: gây sát thương lúc cập nhật → chạy lại trong ngữ cảnh lúc ném
const _bombBlowR19 = bombBlow; bombBlow = f => runObj19(f, null, () => _bombBlowR19(f));
const _fireShatterR19 = fireShatter; fireShatter = f => runObj19(f, null, () => _fireShatterR19(f));
const _starHitR19 = starHit; starHit = (o, e, f) => runObj19(f, o, () => _starHitR19(o, e, f));
// nổ từ đạn / lựu đạn đã gắn nhãn (Pháo, Phóng Lựu…)
const _explodeR19 = explode;
explode = function (x, y, ownerId, dmg, R) {
    if (SRC19.skill > 0 || SRC19.atk.length) return _explodeR19(x, y, ownerId, dmg, R);
    const src = bullets.find(b => b.owner === ownerId && (b._atkW || b._skill) && Math.abs(b.x - x) < 1 && Math.abs(b.y - y) < 1) || items.find(it => it.ownerId === ownerId && (it._atkW || it._skill) && Math.abs(it.x - x) < 1 && Math.abs(it.y - y) < 1);
    return src ? runObj19(src, null, () => _explodeR19(x, y, ownerId, dmg, R)) : _explodeR19(x, y, ownerId, dmg, R);
};

/* ---------- nguồn sát thương cho rework14 / rework15 ---------- */
// trả về id vũ khí nếu sát thương này đến từ ĐÒN ĐÁNH THƯỜNG của vũ khí đó; null nếu là kỹ năng / phép / nguồn khác
function gunSrcR19(A, target, opts) {
    if (SRC19.skill > 0) return null;
    const b = opts && opts.bullet;
    if (b) return b._skill ? null : (b._atkW || null);
    const a = curAtk19(); if (a) return a;
    if (opts && opts.zone && A && target) { const z = zones.find(q => q._atkW && q.owner === A.id && dist(q.x, q.y, target.x, target.y) < (q.r || 0) + target.radius); return z ? z._atkW : null; }
    return null;
}
const isSkillDmgR19 = opts => SRC19.skill > 0 || !!(opts && opts.bullet && opts.bullet._skill);

/* ---------- LƯỚI AN TOÀN: giá trị NaN ---------- */
// góc quay hỏng (ví dụ quay về phía kẻ địch chưa có toạ độ) → đặt lại, tránh hỏng âm thanh / hình vẽ cả trận
const _upeR19 = updatePartyExtras;
updatePartyExtras = function (dt) {
    const r = _upeR19(dt);
    players.forEach(p => {
        if (typeof p.angle === 'number' && !isFinite(p.angle)) p.angle = 0;
        if (typeof p.aimAngle === 'number' && !isFinite(p.aimAngle)) p.aimAngle = p.angle;
        ['kx', 'ky', 'vx', 'vy'].forEach(k => { if (typeof p[k] === 'number' && !isFinite(p[k])) p[k] = 0; });
        if (typeof p.x === 'number') { if (isFinite(p.x) && isFinite(p.y)) { p._lx19 = p.x; p._ly19 = p.y; } else if (p._lx19 !== undefined) { p.x = p._lx19; p.y = p._ly19; } }
    });
    return r;
};
// âm thanh có toạ độ / âm lượng hỏng → bỏ qua thay vì văng lỗi AudioParam
const _playAtR19 = AudioSys.playAt, _playR19 = AudioSys.play;
AudioSys.playAt = function (type, x, y, vol, range) { if (!isFinite(x) || !isFinite(y) || (vol !== undefined && !isFinite(vol))) return; return _playAtR19.call(this, type, x, y, vol, range); };
AudioSys.play = function (type, vol, pan) { if ((vol !== undefined && !isFinite(vol)) || (pan !== undefined && !isFinite(pan))) return; return _playR19.call(this, type, vol, pan); };
// góc đẩy lùi hỏng (tính từ toạ độ người chưa xuất hiện) → bỏ, để dealDamage tự tính lại
const _dealDamageR19 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (opts && opts.angle !== undefined && !isFinite(opts.angle)) { opts = Object.assign({}, opts); delete opts.angle; }
    if (!isFinite(dmg)) return;
    if (opts.angle === undefined && attackerId !== -1 && target) { const A = players.find(q => q.id === attackerId); if (A && (!isFinite(A.x) || !isFinite(A.y) || !isFinite(target.x))) opts = Object.assign({}, opts, { angle: Math.random() * 6.28 }); }
    return _dealDamageR19(target, dmg, attackerId, opts);
};
