/** ==================== VŨ KHÍ MỚI · PHÉP BỔ TRỢ · VẬT PHẨM · THẺ MỚI ====================
 *  Nạp sau party.js / hud.js. Dùng cách "bọc" hàm cũ (gọi lại bản gốc) để ít đụng code cũ.
 */

/* ============================== VŨ KHÍ ============================== */
Object.assign(WEAPONS, {
    AXE:        { id:'AXE', name:'Rìu', icon:'🪓', type:'MELEE', mode:'charge', chargeTime:0.6, aim:'arc', strike:'slash', color:'#9ca3af', damage:30, fireRate:24, range:60, durability:26, maxDurability:26, moveScale:1.0, width:8, len:30, tier:3, desc:'Chém 2 phát, phát 3 bổ cực đau + choáng; giữ để ném rìu rồi thu về' },
    ROUNDSHIELD:{ id:'ROUNDSHIELD', name:'Khiên Tròn', icon:'🔵', type:'SHIELD', mode:'charge', chargeTime:0.6, aim:'arc', strike:'stab', color:'#0ea5e9', damage:16, fireRate:26, range:30, durability:140, maxDurability:140, moveScale:0.95, width:8, len:18, tier:2, desc:'Yếu hơn Khiên; giữ để ném khiên nảy qua nhiều mục tiêu rồi quay về' },
    SPISTOL:    { id:'SPISTOL', name:'Lục Giảm Thanh', icon:'🔇', type:'GUN', mode:'tap', aim:'line', color:'#475569', damage:13, fireRate:20, speed:26, spread:0.01, range:380, magSize:8, mag:8, reserve:24, reloadTime:1.4, moveScale:1.0, width:4, len:20, tier:2, silent:true, desc:'Không tiếng động, không lộ đường đạn; chậm & yếu nhưng chính xác, bắn xa' },
    SAR:        { id:'SAR', name:'AR Giảm Thanh', icon:'🤫', type:'GUN', mode:'tap', aim:'line', color:'#334155', damage:9, fireRate:22, speed:22, spread:0.2, range:330, magSize:4, mag:4, reserve:8, reloadTime:1.5, moveScale:0.95, width:5, len:24, tier:3, silent:true, desc:'Không tiếng động; sấy 7 viên, càng xa càng yếu' },
    EMPGREN:    { id:'EMPGREN', name:'Lựu Đạn Điện Từ', icon:'🧿', type:'THROWABLE', mode:'charge', chargeTime:1.0, aim:'lob', color:'#38bdf8', damage:0, fireRate:24, range:270, magSize:2, mag:2, reserve:0, noReload:true, moveScale:1.0, width:8, len:8, tier:2, desc:'Vùng khoá kỹ năng địch, hiệu ứng còn 2 giây sau khi rời vùng' }
});
Object.assign(BASE_WEIGHTS, { AXE: 7, ROUNDSHIELD: 5, SPISTOL: 7, SAR: 6, EMPGREN: 5 });
WEAPONS.FLAME.range = 175;           // phun lửa xa hơn chút
WEAPONS.BOW.spread = 0.32;           // cung chưa ngắm: hình nón rộng hơn
Object.assign(WEAPONS.SHIELD, { desc: 'Chặn đạn & cận chiến phía trước; GIỮ để hút địch phía trước về phía mình; húc gây choáng' });
Object.assign(WEAPONS.RAILGUN, { desc: 'Giữ thêm 1s: mức 2 (đứng yên, có giáp, mạnh hơn). Thêm 1s: mức 3 chiếu laser 1 giây, dùng hết đạn' });

/** Bắn súng giảm thanh: không âm thanh, không chớp nòng, đường đạn rất mờ */
function silentFire(p, w, ang) {
    p.cooldown = w.fireRate * p.fireRateMult * (p.st.rage > 0 ? 0.75 : 1); p.ghostT = 0; p.angle = ang; p.lastFireT = world.time;
    onAttack(p);
    const mult = attackMult(p, w);
    if (!world.infiniteAmmo) w.mag--; else w.mag = Math.max(1, w.mag - 1);
    p.stats.shots++; p.recoil = 0.4;
    const n = w.id === 'SAR' ? 7 : 1;
    for (let i = 0; i < n; i++) p.shotQueue.push({ t: i * 0.035, fn: () => {
        if (p.hp <= 0) return;
        const b = gunBullet(p, w, ang + (Math.random() - 0.5) * (w.spread * p.spreadMult + (p.aiSpread || 0)), { speed: w.speed, damage: w.damage * mult, range: w.range, color: '#475569', size: 1.5, trail: 5 });
        b.sx = p.x; b.sy = p.y; if (w.id === 'SAR') b.falloff = w.range;
    } });
    if (w.magSize && w.mag <= 0 && w.reserve <= 0 && !world.infiniteAmmo) p.autoThrowT = 0.45;
}

/** Railgun mức 2 / 3 */
function railSuper(p, w, ang) {
    p.cooldown = w.fireRate; p.ghostT = 0; p.angle = ang; p.lastFireT = world.time; p.stats.shots++;
    onAttack(p);
    const mult = attackMult(p, w), m = muzzle(p, w, ang);
    if (p.railLv >= 3) {
        p.railBurst = { t: 1, ang, tick: 0, mult };
        w.mag = 0; w.reserve = 0;
        floatText(p.x, p.y - 34, 'CHIẾU LASER!!', '#22d3ee', 20); flash('#22d3ee', 0.25); addShake(12);
        AudioSys.playAt('rail', p.x, p.y, 0.6);
    } else {
        w.mag--;
        floatText(p.x, p.y - 30, 'RAILGUN MỨC 2!', '#67e8f9', 15);
        fireRail(p, m.x, m.y, w, ang, mult * 1.6);
        if (w.mag <= 0 && w.reserve <= 0 && !world.infiniteAmmo) p.autoThrowT = 0.45;
    }
}
function updateRail(p, dt) {
    const w = getCurrentWeapon(p);
    if (w.id === 'RAILGUN' && p.aiming && p.charge >= 1) p.railT = (p.railT || 0) + dt;
    else if (!p.railBurst) p.railT = 0;
    const lv = p.railT >= 2 ? 3 : p.railT >= 1 ? 2 : 1;
    if (lv >= 2 && (p.railLv || 1) < 2) { p.st.shield = Math.max(p.st.shield, 30); p.st.shieldT = Math.max(p.st.shieldT, 3); floatText(p.x, p.y - 30, 'MỨC 2', '#67e8f9', 13); AudioSys.playAt('select', p.x, p.y, 0.3); }
    if (lv >= 3 && (p.railLv || 1) < 3) { floatText(p.x, p.y - 30, 'MỨC 3!', '#22d3ee', 15); AudioSys.playAt('alarm', p.x, p.y, 0.25); }
    p.railLv = p.railBurst ? 3 : lv;
    if (lv >= 2 && p.aiming) p.st.root = Math.max(p.st.root || 0, 0.1);
    const B = p.railBurst;
    if (B) {
        B.t -= dt; B.tick -= dt; p.st.root = Math.max(p.st.root || 0, 0.1); p.angle = B.ang;
        if (B.tick <= 0) {
            B.tick = 0.08;
            const m = muzzle(p, w.id === 'RAILGUN' ? w : WEAPONS.RAILGUN, B.ang), L = chargeRange(WEAPONS.RAILGUN, 1) * 1.1, half = 8 + 36 * Math.max(0, B.t);
            const ex = m.x + Math.cos(B.ang) * L, ey = m.y + Math.sin(B.ang) * L, nx = -Math.sin(B.ang), ny = Math.cos(B.ang);
            [-1, 0, 1].forEach(k => beams.push({ x1: m.x + nx * half * k * 0.7, y1: m.y + ny * half * k * 0.7, x2: ex + nx * half * k * 0.7, y2: ey + ny * half * k * 0.7, life: 0.12, maxLife: 0.12, color: '#22d3ee' }));
            const dx = ex - m.x, dy = ey - m.y;
            for (const e of enemiesOf(p)) {
                const t = Math.max(0, Math.min(1, ((e.x - m.x) * dx + (e.y - m.y) * dy) / (dx * dx + dy * dy)));
                if (dist(e.x, e.y, m.x + dx * t, m.y + dy * t) < e.radius + half) dealDamage(e, 24 * B.mult, p.id, { angle: B.ang, knock: 90, noCharge: true });
            }
            obstacles.slice().forEach(o => { if (segRect(m.x, m.y, ex, ey, o) >= 0) damageObstacle(o, 30, p); });
            addShake(3);
        }
        if (B.t <= 0) { p.railBurst = null; p.railT = 0; p.autoThrowT = 0.6; }
    }
}

/* ---------- Cận chiến mới: Rìu, Khiên Tròn ---------- */
const _fireMelee = fireMelee;
fireMelee = function (p, w, ang, charge, mult, isSuper) {
    if (w.out) return; // đang ném đi
    if (w.id === 'ROUNDSHIELD' && charge >= 0.9) return throwSpinner(p, w, ang, mult, 'chain');
    if (w.id === 'AXE' && charge >= 0.9) return throwSpinner(p, w, ang, mult, 'axe');
    if (w.id === 'AXE') {
        p.axeN = world.time - (p.axeT || -9) < 1.2 ? (p.axeN || 0) + 1 : 1; p.axeT = world.time;
        if (p.axeN % 3 === 0) {
            const before = new Map(enemiesOf(p).map(e => [e, e.hp])), d0 = w.damage;
            w.damage = d0 * 2.3; _fireMelee(p, w, ang, charge, mult, isSuper); w.damage = d0;
            before.forEach((h, e) => { if (e.hp < h) { e.stun = Math.max(e.stun, 0.9); floatText(e.x, e.y - 36, 'BỔ!', '#fca5a5', 17); } });
            addShake(8); hitStop(0.08);
            return;
        }
    }
    return _fireMelee(p, w, ang, charge, mult, isSuper);
};
/** Ném rìu (bay thẳng, trúng thì quay về) / khiên tròn (nảy qua 3 mục tiêu) */
function throwSpinner(p, w, ang, mult, kind) {
    w.out = true;
    let target = null;
    if (kind === 'chain') {
        const c = enemiesOf(p).filter(e => targetable(p, e) && dist(p.x, p.y, e.x, e.y) < 340 && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 0.6);
        c.sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y)); if (c[0]) target = c[0].id;
    }
    items.push({ custom: kind, x: p.x, y: p.y, vx: Math.cos(ang), vy: Math.sin(ang), angle: 0, spin: 18, ownerId: p.id, type: { id: w.id, color: w.color, len: w.len },
        hits: [], hitsB: [], left: 3, dmg: (kind === 'axe' ? w.damage * 1.6 : 26) * mult * (p.meleeMult || 1), travel: 0, maxD: kind === 'axe' ? 330 : 300, target, back: false, fuse: 0, z: 0, thrown: true });
    AudioSys.playAt('whoosh', p.x, p.y, 0.45);
    floatText(p.x, p.y - 30, kind === 'axe' ? 'NÉM RÌU!' : 'NÉM KHIÊN!', '#e2e8f0', 13);
}
function updateCustomItem(it, dt) {
    const owner = players.find(q => q.id === it.ownerId);
    const giveBack = () => { const w = owner && owner.inventory.find(x => x.out && x.id === it.type.id); if (w) w.out = false; };
    if (!owner || owner.hp <= 0) { giveBack(); return true; }
    it.angle += it.spin * dt;
    const sp = 780 * dt;
    let tx, ty;
    if (it.back) { tx = owner.x; ty = owner.y; }
    else if (it.target) { const t = players.find(q => q.id === it.target && q.hp > 0); if (t) { tx = t.x; ty = t.y; } else it.target = null; }
    if (tx === undefined) {
        it.x += it.vx * sp; it.y += it.vy * sp; it.travel += sp;
        if (it.travel > it.maxD || pointInObstacle(it.x, it.y, 2) || it.x < 0 || it.y < 0 || it.x > MAP_W || it.y > MAP_H) it.back = true;
        for (const e of enemiesOf(owner)) if (!it.hits.includes(e.id) && !(e.air > 0) && dist(it.x, it.y, e.x, e.y) < e.radius + 12) { spinnerHit(it, owner, e); break; }
    } else {
        const d = dist(it.x, it.y, tx, ty), a = Math.atan2(ty - it.y, tx - it.x);
        if (d < sp + 14) {
            if (it.back) { giveBack(); AudioSys.playAt('ui', owner.x, owner.y, 0.3); return true; }
            const t = players.find(q => q.id === it.target); if (t) spinnerHit(it, owner, t);
        } else { it.x += Math.cos(a) * sp; it.y += Math.sin(a) * sp; it.vx = Math.cos(a); it.vy = Math.sin(a); }
        if (it.back && it.custom === 'axe') for (const e of enemiesOf(owner)) if (!it.hitsB.includes(e.id) && !(e.air > 0) && dist(it.x, it.y, e.x, e.y) < e.radius + 12) {
            it.hitsB.push(e.id); dealDamage(e, it.dmg * 0.6, owner.id, { angle: a, knock: 200 });
        }
    }
    if (Math.random() < 0.4) particles.push({ x: it.x, y: it.y, vx: 0, vy: 0, life: 0.2, maxLife: 0.2, color: hexA(it.type.color || '#ffffff', 0.5), size: 6, glow: true });
    return false;
}
function spinnerHit(it, owner, e) {
    it.hits.push(e.id); owner.stats.hits++;
    dealDamage(e, it.dmg, owner.id, { angle: Math.atan2(e.y - it.y, e.x - it.x), knock: it.custom === 'axe' ? 320 : 220 });
    spark(e.x, e.y, '#e2e8f0', 8, 220);
    if (it.custom === 'chain') {
        it.left--;
        const next = enemiesOf(owner).filter(q => !it.hits.includes(q.id) && dist(q.x, q.y, e.x, e.y) < 280 && lineOfSight(e.x, e.y, q.x, q.y)).sort((a, b) => dist(a.x, a.y, e.x, e.y) - dist(b.x, b.y, e.x, e.y))[0];
        if (next && it.left > 0) { it.target = next.id; floatText(e.x, e.y - 30, 'NẢY!', '#7dd3fc', 13); }
        else { it.back = true; it.target = null; }
    } else { it.back = true; e.stun = Math.max(e.stun, 0.4); }
}

/* ---------- Lựu đạn điện từ, bom độc (vật ném kỹ năng) ---------- */
const _throwGrenade = throwGrenade;
throwGrenade = function (p, w, ang, d) {
    if (w.id !== 'EMPGREN') return _throwGrenade(p, w, ang, d);
    if (!world.infiniteAmmo) w.mag--;
    d = Math.min(330, Math.max(70, d));
    items.push({ x: p.x, y: p.y, type: { id: 'EMPGREN', color: '#38bdf8' }, skill: true, angle: 0, spin: 12, vx: Math.cos(ang) * d * 3.1, vy: Math.sin(ang) * d * 3.1, thrown: true, ownerId: p.id, fuse: 1.1, z: 0, vz: 260 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.3);
    if (w.mag <= 0) p.inventory[p.weaponIdx] = { ...WEAPONS.NONE };
};
const _landSkillItem = landSkillItem;
landSkillItem = function (it) {
    const owner = players.find(q => q.id === it.ownerId);
    if (it.type.id === 'EMPGREN') {
        zones.push({ type: 'emp', x: it.x, y: it.y, r: 140, t: 3.5, maxT: 3.5, owner: it.ownerId, tick: 0 });
        ring(it.x, it.y, 10, 140, '#38bdf8', 0.5, 6); flash('#38bdf8', 0.08); AudioSys.playAt('rail', it.x, it.y, 0.4);
    } else if (it.type.id === 'POISON') {
        const r = combo(owner, 'chemist') ? 180 : 130;
        zones.push({ type: 'poison', x: it.x, y: it.y, r, t: 5, maxT: 5, owner: it.ownerId, tick: 0 });
        smoke(it.x, it.y, 10, 'rgba(132,204,22,0.35)', 26); AudioSys.playAt('whoosh', it.x, it.y, 0.35);
    } else _landSkillItem(it);
};

/* ---------- Bắn: bọc fireWeapon ---------- */
const _fireWeapon = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w.silent) return silentFire(p, w, ang);
    if (w.id === 'RAILGUN' && (p.railLv || 1) >= 2 && charge >= 1) return railSuper(p, w, ang);
    return _fireWeapon(p, w, ang, charge, enemy);
};

/* ============================== PHÉP BỔ TRỢ (6) ============================== */
function flashMove(p, D) {
    const a = p.lastMoveIn > 0.2 ? p.moveDir : p.angle;
    smoke(p.x, p.y, 5, 'rgba(250,204,21,0.35)', 12);
    for (let d = D; d > 20; d -= 15) {
        const nx = p.x + Math.cos(a) * d, ny = p.y + Math.sin(a) * d;
        if (nx > p.radius && ny > p.radius && nx < MAP_W - p.radius && ny < MAP_H - p.radius && !pointInObstacle(nx, ny, p.radius)) { p.x = nx; p.y = ny; break; }
    }
    ring(p.x, p.y, 5, 50, '#facc15', 0.3); AudioSys.playAt('trick', p.x, p.y, 0.35);
}
const SPELLS = {
    flash:   { icon: '⚡', name: 'Tốc Biến', cd: 40, cast: p => { flashMove(p, combo(p, 'doubleFlash') ? 300 : 200); if (combo(p, 'doubleFlash')) { const s = (p.skills || []).find(q => q.id === 'blink'); if (s) s.cd = 0; } } },
    heal:    { icon: '💗', name: 'Hồi Máu', cd: 45, cast: p => { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.25); p.st.haste = Math.max(p.st.haste, 1); ring(p.x, p.y, 5, 60, '#4ade80', 0.4); AudioSys.playAt('pickup', p.x, p.y, 0.4); } },
    cleanse: { icon: '🌀', name: 'Thanh Tẩy', cd: 40, cast: p => { p.stun = 0; Object.assign(p.st, { slow: 0, root: 0, silence: 0, glued: 0, burn: 0 }); p.st.shield = Math.max(p.st.shield, 25); p.st.shieldT = Math.max(p.st.shieldT, 1.5); ring(p.x, p.y, 5, 55, '#e0f2fe', 0.4); AudioSys.playAt('select', p.x, p.y, 0.4); } },
    sprint:  { icon: '👟', name: 'Gia Tốc', cd: 35, cast: p => { p.st.haste = Math.max(p.st.haste, 3); p.st.slow = 0; AudioSys.playAt('go', p.x, p.y, 0.25); } },
    execute: { icon: '🗡', name: 'Trừng Phạt', cd: 40, cast: p => {
        const e = enemiesOf(p).filter(q => targetable(p, q) && dist(p.x, p.y, q.x, q.y) < 300).sort((a, b) => a.hp - b.hp)[0];
        if (!e) { if (!p.isBot) floatText(p.x, p.y - 30, 'Không có mục tiêu', '#94a3b8', 12); return false; }
        beams.push({ x1: p.x, y1: p.y, x2: e.x, y2: e.y, life: 0.25, maxLife: 0.25, color: '#f87171' });
        dealDamage(e, 30 + 0.2 * (e.maxHp - e.hp), p.id, { raw: true, angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 150 });
        floatText(e.x, e.y - 36, 'TRỪNG PHẠT!', '#f87171', 15);
    } },
    stunS:   { icon: '💫', name: 'Ngất Ngư', cd: 45, cast: p => {
        ring(p.x, p.y, 10, 150, '#facc15', 0.45, 7); AudioSys.playAt('slam', p.x, p.y, 0.35);
        enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 150 + e.radius && !(e.air > 0)) { e.stun = Math.max(e.stun, 0.8); floatText(e.x, e.y - 30, 'CHOÁNG!', '#facc15', 14); } });
    } }
};
const SPELL_IDS = Object.keys(SPELLS);
function randomSpells(n, have = []) { const pool = SPELL_IDS.filter(id => !have.includes(id)); const out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return out; }
function spellCd(p, id) { return SPELLS[id].cd * (p.arcanist ? 0.65 : 1) * (combo(p, 'grandMage') ? 0.85 : 1); }
function castSpell(p, i) {
    const s = p.spells && p.spells[i]; if (!s) return;
    if (s.cd > 0) { if (!p.isBot) floatText(p.x, p.y - 30, `${Math.ceil(s.cd)}s`, '#94a3b8', 12); return; }
    const def = SPELLS[s.id];
    if (def.cast(p) === false) return;
    s.cd = spellCd(p, s.id);
    if (combo(p, 'spellLib')) p.hp = Math.min(p.maxHp, p.hp + 10);
    floatText(p.x, p.y - 40, def.icon + ' ' + def.name, '#fde68a', 14);
}

/* ============================== VẬT PHẨM TIÊU HAO (12) ============================== */
const ITEMS = {};
SPELL_IDS.forEach(id => ITEMS[id] = { icon: SPELLS[id].icon, name: 'Cuộn ' + SPELLS[id].name, cast: SPELLS[id].cast });
Object.assign(ITEMS, {
    bigPotion:    { icon: '🧪', name: 'Bình Máu Lớn', cast: p => { p.hp = Math.min(p.maxHp, p.hp + 60); spark(p.x, p.y, '#4ade80', 12, 120); AudioSys.playAt('pickup', p.x, p.y, 0.4); } },
    shieldPotion: { icon: '🛡️', name: 'Thuốc Khiên', cast: p => { p.st.shield = Math.max(p.st.shield, 60); p.st.shieldT = Math.max(p.st.shieldT, 4); AudioSys.playAt('block', p.x, p.y, 0.4); } },
    smokeBomb:    { icon: '💨', name: 'Lựu Khói', cast: p => { zones.push({ type: 'smoke', x: p.x, y: p.y, r: 135, t: 5, maxT: 5, owner: p.id, tick: 0 }); smoke(p.x, p.y, 14, 'rgba(180,190,210,0.45)', 30); } },
    drone:        { icon: '🛸', name: 'Drone Định Vị', cast: p => { enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 750) spotFor(e, p.id, 4); }); ring(p.x, p.y, 10, 750, '#60a5fa', 0.6, 3); AudioSys.playAt('legend', p.x, p.y, 0.2); } },
    scareDoll:    { icon: '🎃', name: 'Bù Nhìn Mini', cast: p => placeScarecrow(p, 60) },
    ragePotion:   { icon: '🍷', name: 'Thuốc Cuồng Nộ', cast: p => { p.st.rage = Math.max(p.st.rage, 4); ring(p.x, p.y, 5, 60, '#ef4444', 0.4); AudioSys.playAt('crit', p.x, p.y, 0.35); } }
});
const ITEM_IDS = Object.keys(ITEMS);
function itemSlots(p) { return 1 + (p.pouch ? 1 : 0); }
function giveItem(p, id, quiet) {
    if (!p.items) p.items = [];
    if (p.items.length >= itemSlots(p)) return false;
    id = id || ITEM_IDS[Math.floor(Math.random() * ITEM_IDS.length)];
    p.items.push({ id, uses: combo(p, 'rareFind') ? 2 : 1 });
    if (!quiet) { floatText(p.x, p.y - 34, ITEMS[id].icon + ' ' + ITEMS[id].name, '#c4b5fd', 14); AudioSys.playAt('pickup', p.x, p.y, 0.3); }
    return true;
}
function useItem(p, i) {
    const it = p.items && p.items[i]; if (!it) return;
    if (ITEMS[it.id].cast(p) === false) return;
    floatText(p.x, p.y - 40, ITEMS[it.id].icon + ' ' + ITEMS[it.id].name, '#c4b5fd', 14);
    if (--it.uses <= 0) p.items.splice(i, 1);
}
const _openCrate = openCrate;
openCrate = function (p, index) {
    const c = crates[index];
    if (c && c.type === 'SUPPORT' && (combo(p, 'looter') || Math.random() < (p.pouch ? 0.6 : 0.4)) && giveItem(p)) { crates.splice(index, 1); p.stats.crates++; return; }
    return _openCrate(p, index);
};

/** Nút phép (sp1..sp3) và vật phẩm (it1..it2) — Thanh Tẩy dùng được cả khi bị choáng */
function handleSpellButtons(p, input, allowAct) {
    if (!p.spells) return;
    p.lastMoveIn = Math.hypot(input.move.x, input.move.y);
    ['sp1', 'sp2', 'sp3', 'it1', 'it2'].forEach(k => {
        const down = !!input[k], was = !!(p.wasSp && p.wasSp[k]);
        if (down && !was && allowAct && p.hp > 0) {
            if (k[0] === 's') { const i = +k[2] - 1, s = p.spells[i]; if (s && (p.stun <= 0 || s.id === 'cleanse')) castSpell(p, i); }
            else if (p.stun <= 0) useItem(p, +k[2] - 1);
        }
        (p.wasSp = p.wasSp || {})[k] = down;
    });
}
function botSpells(p, dt) {
    p.spellThinkT = (p.spellThinkT || 0) - dt;
    if (p.spellThinkT > 0 || gameState !== 'PLAYING') return;
    p.spellThinkT = 0.4;
    const e = enemyOf(p), d = e ? dist(p.x, p.y, e.x, e.y) : 1e9, vis = e && targetable(p, e), low = p.hp < p.maxHp * 0.35;
    const want = id => ({ heal: low, cleanse: p.stun > 0.3 || p.st.root > 0.3 || p.st.slow > 0.6, sprint: low && vis && d < 320, flash: p.hp < p.maxHp * 0.25 && vis && d < 220,
        execute: vis && d < 290 && e.hp < 45, stunS: vis && d < 140, bigPotion: p.hp < p.maxHp * 0.5, shieldPotion: vis && d < 300 && p.hp < p.maxHp * 0.6,
        smokeBomb: low && vis, drone: !vis && world.time > 6, scareDoll: vis && d < 350 && low, ragePotion: vis && d < 300 })[id];
    (p.spells || []).forEach((s, i) => { if (s.cd <= 0 && want(s.id) && Math.random() < 0.7) castSpell(p, i); });
    (p.items || []).forEach((it, i) => { if (want(it.id) && Math.random() < 0.5) useItem(p, i); });
}

/* ============================== ĐÁNH DẤU (chỉ người đánh dấu thấy) ============================== */
function spotFor(e, viewerId, t) { e.st.spot = e.st.spot || {}; e.st.spot[viewerId] = Math.max(e.st.spot[viewerId] || 0, world.time + t); }
function isSpotted(e, viewerId) { return !!(e && e.st && e.st.spot && e.st.spot[viewerId] > world.time); }

/* ============================== THẺ MỚI ============================== */
function placeScarecrow(p, hp) {
    const a = aimDir(p);
    const mk = (x, y) => decoys.push({ x, y, angle: 0, speed: 0, owner: p.id, t: 10, hp, color: '#d97706', radius: 15, label: 'BÙ NHÌN', kind: 'scarecrow' });
    mk(p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60);
    if (combo(p, 'scareArmy')) mk(p.x + Math.cos(a + 1) * 60, p.y + Math.sin(a + 1) * 60);
    AudioSys.playAt('ui', p.x, p.y, 0.3);
}
defP('vitality', '💪', 'Cường Thể', '+45 máu tối đa và +15 giáp mỗi hiệp.', p => { p.maxHp += combo(p, 'bigLife') ? 30 : 45; p.maxArmor += 15; });
defP('antiMelee', '🥋', 'Giáp Chống Cận Chiến', 'Nhận ít hơn 30% sát thương cận chiến; kẻ chém bạn bị đẩy lùi.', p => { p.antiMelee = true; });
defP('gasMask', '😷', 'Mặt Nạ Phòng Độc', 'Miễn khí độc & vùng độc; sát thương vòng bo, dung nham -30%.', p => { p.gasMask = true; });
defS('poisonGas', '☣️', 'Bom Độc', 13, 'engage', 'Ném bom tạo vùng độc 5 giây (12 sát thương/giây).', p => throwSkillItem(p, 'POISON', '#84cc16', 360), 360);
defS('scout', '🛸', 'Drone Do Thám', 14, 'reveal', 'Thả drone bay về phía trước 4 giây, đánh dấu địch gần nó (chỉ bạn thấy, có mũi tên chỉ).', p => {
    const a = aimDir(p);
    decoys.push({ x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, angle: a, speed: 230, owner: p.id, t: combo(p, 'recon') ? 6 : 4, hp: 25, color: '#60a5fa', radius: 10, label: 'DRONE', kind: 'drone' });
    AudioSys.playAt('whoosh', p.x, p.y, 0.3);
}, 500);
defS('scarecrow', '🎃', 'Bù Nhìn', 12, 'escape', 'Dựng bù nhìn 90 máu (10 giây) để hút đạn và đánh lừa địch.', p => placeScarecrow(p, 90));
defS('elsu', '🦅', 'Elsu', 16, 'place', 'Khi ngắm: đứng yên nhưng tầm nhìn phía trước xa gấp 1.6 (Bắn tỉa không bị thu hẹp tầm nhìn xung quanh). Kỹ năng: cắm Ưng Trạm cho tầm nhìn vùng 300 & phát hiện địch (bị phá được).', p => {
    const d = Math.min(420, p.skillDist || 300), a = aimDir(p);
    let x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    if (pointInObstacle(x, y, 12)) { x = p.x + Math.cos(a) * 40; y = p.y + Math.sin(a) * 40; }
    const mine = decoys.filter(q => q.kind === 'ward' && q.owner === p.id); if (mine.length >= 2) mine[0].hp = 0;
    decoys.push({ x, y, angle: 0, speed: 0, owner: p.id, t: 25, hp: combo(p, 'skyEye') ? 80 : 40, color: '#38bdf8', radius: 12, label: 'ƯNG TRẠM', kind: 'ward' });
    ring(x, y, 10, 300, '#38bdf8', 0.5, 3); AudioSys.playAt('legend', x, y, 0.2);
}, 420);
defS('hightech', '🛠️', 'Kỹ Thuật Cao', 12, 'engage', 'Kỹ năng đặc trưng đổi theo vũ khí đang cầm: cận chiến = Lốc Xoáy, súng = Xả Đạn, tụ lực = Phát Bắn Hoàn Hảo, ném/nổ = Mưa Bom, lửa/điện = Quá Tải, tay không = Chấn Động.', p => weaponSkill(p), 400);
defP('arcanist', '🔮', 'Phù Thủy Bổ Trợ', 'Phép bổ trợ hồi chiêu nhanh hơn 35%.', p => { p.arcanist = true; });
defP('spellbook', '📖', 'Túi Phép', 'Có 3 phép bổ trợ thay vì 2.', p => { p.spellbook = true; });
defP('bag', '🎒', 'Túi Đồ', 'Có 3 ô vũ khí; mỗi vũ khí đang mang +8% sát thương.', p => { p.bag = true; if (p.inventory.length < 3) p.inventory.push(combo(p, 'mobileArmory') ? makeWeapon(['SMG', 'SHOTGUN', 'AR', 'BOW'][Math.floor(Math.random() * 4)], p) : { ...WEAPONS.NONE }); });
defP('pouch', '👝', 'Túi Vật Dụng', 'Thêm 1 ô vật phẩm tiêu hao; hòm hỗ trợ dễ rơi vật phẩm hơn.', p => { p.pouch = true; });
defP('altChoice', '🧩', 'Lựa Chọn Thay Thế', 'Được giữ 3 kỹ năng (S) thay vì 2.', p => { p.altChoice = true; });

/** Kỹ Thuật Cao: kỹ năng theo vũ khí */
function weaponSkill(p) {
    const w = getCurrentWeapon(p), a = aimDir(p);
    if (w.id === 'NONE') { shockwave(p.x, p.y, p.id, 120, 20); return; }
    if (w.type === 'MELEE' || w.type === 'SHIELD') {
        const R = p.radius + (w.range || 40) + 45;
        [0, 1, 2, 3].forEach(i => slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: a + i * Math.PI / 2, range: R, color: '#fde68a', width: 10, life: 0.3, maxLife: 0.3, swing: 1, line: false }));
        enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(p.x, p.y, e.x, e.y) < R + e.radius) dealDamage(e, w.damage * 1.5 * (p.meleeMult || 1), p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 420, melee: true }); });
        floatText(p.x, p.y - 34, 'LỐC XOÁY!', '#fde68a', 15); AudioSys.playAt('swing', p.x, p.y, 0.6); return;
    }
    if (['SNIPER', 'BOW', 'RAILGUN', 'REVOLVER'].includes(w.id)) {
        if (w.mag <= 0) { w.mag = 1; }
        p.cooldown = 0; floatText(p.x, p.y - 34, 'PHÁT BẮN HOÀN HẢO!', '#e9d5ff', 15);
        fireWeapon(p, w, a, 1, null); return;
    }
    if (w.type === 'THROWABLE' || ['LAUNCHER', 'ROCKET'].includes(w.id)) {
        [-0.35, 0, 0.35].forEach(o => items.push({ x: p.x, y: p.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 12, vx: Math.cos(a + o) * 900, vy: Math.sin(a + o) * 900, thrown: true, ownerId: p.id, fuse: 1.1, z: 0, vz: 260, blast: [70, 130] }));
        floatText(p.x, p.y - 34, 'MƯA BOM!', '#fb923c', 15); return;
    }
    if (['FLAME', 'TESLA', 'ENERGY'].includes(w.id)) {
        p.st.rage = Math.max(p.st.rage, 3); if (w.magSize) w.mag = effMag(p, w); if (w.id === 'ENERGY') w.eShield = w.eShieldMax || 80;
        floatText(p.x, p.y - 34, 'QUÁ TẢI!', '#93c5fd', 15); return;
    }
    if (w.magSize) { w.mag = effMag(p, w); w.reloading = false; }
    p.st.rage = Math.max(p.st.rage, 2.5); p.fireBoost = 2.5;
    floatText(p.x, p.y - 34, 'XẢ ĐẠN!', '#fde047', 15);
}

/* ---------- Phối hợp mới (15) ---------- */
[
    { id: 'grandMage', a: 'arcanist', b: 'meditate', name: 'Đại Pháp Sư', desc: 'Phép bổ trợ hồi nhanh thêm 15%. Máu tối đa -10.' },
    { id: 'spellLib', a: 'spellbook', b: 'arcanist', name: 'Thư Viện Phép', desc: 'Mỗi lần dùng phép bổ trợ hồi 10 máu.' },
    { id: 'looter', a: 'pouch', b: 'scavenger', name: 'Kẻ Lượm Lặt', desc: 'Hòm hỗ trợ luôn rơi vật phẩm (nếu còn ô trống).' },
    { id: 'mobileArmory', a: 'bag', b: 'armory', name: 'Kho Di Động', desc: 'Ô vũ khí thứ 3 khởi đầu có sẵn một khẩu súng.' },
    { id: 'skyEye', a: 'elsu', b: 'watchman', name: 'Thiên Nhãn', desc: 'Ưng Trạm nhìn xa hơn 50% và bền gấp đôi.' },
    { id: 'recon', a: 'scout', b: 'tripwire', name: 'Trinh Sát Viên', desc: 'Drone bay lâu hơn (6 giây).' },
    { id: 'scareArmy', a: 'scarecrow', b: 'martyr', name: 'Bù Nhìn Bom', desc: 'Dựng 2 bù nhìn; bù nhìn bị phá sẽ phát nổ.' },
    { id: 'chemist', a: 'poisonGas', b: 'gasMask', name: 'Chuyên Gia Hóa Học', desc: 'Vùng độc rộng hơn; bạn đứng trong vùng độc hồi 4 máu/giây.' },
    { id: 'bigLife', a: 'vitality', b: 'laststand', name: 'Sinh Lực Dồi Dào', desc: 'Bất Khuất để lại 40 máu thay vì 1. Cường Thể chỉ còn +30 máu.' },
    { id: 'fullPlate', a: 'antiMelee', b: 'armorP', name: 'Giáp Thép Toàn Thân', desc: 'Giảm 45% sát thương cận chiến. Tốc chạy -5%.' },
    { id: 'gunsmith', a: 'hightech', b: 'fastReload', name: 'Kỹ Sư Vũ Khí', desc: 'Kỹ Thuật Cao hồi chiêu nhanh hơn 40%.' },
    { id: 'versatile', a: 'altChoice', b: 'meditate', name: 'Đa Năng', desc: 'Kỹ năng hồi nhanh thêm 10%. Máu tối đa -10.' },
    { id: 'rareFind', a: 'pouch', b: 'collector', name: 'Đồ Hiếm', desc: 'Mỗi vật phẩm nhặt được dùng được 2 lần.' },
    { id: 'doubleFlash', a: 'spellbook', b: 'blink', name: 'Song Tốc Biến', desc: 'Phép Tốc Biến xa hơn 50% và làm mới Dịch Chuyển.' },
    { id: 'survivor', a: 'gasMask', b: 'zoneRunner', name: 'Người Sống Sót', desc: 'Sát thương vòng bo và khí độc thêm -50%.' }
].forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
for (const id in COMBOS_OF) if (COMBOS_OF[id].length > 3) console.warn('Thẻ có hơn 3 phối hợp:', id, COMBOS_OF[id].length);
['poisonGas', 'scout', 'scarecrow', 'elsu', 'hightech'].forEach(id => { CARDS[id].aim = id === 'poisonGas' || id === 'elsu' ? 'point' : 'dir'; CARDS[id].aimR = CARDS[id].range || 300; });
CARDS.scarecrow.aimR = 90;

const _skillCooldown = skillCooldown;
skillCooldown = function (p, id) {
    let cd = _skillCooldown(p, id);
    if (id === 'hightech' && combo(p, 'gunsmith')) cd *= 0.6;
    if (combo(p, 'versatile')) cd *= 0.9;
    return cd;
};
const _applyBuild = applyBuild;
applyBuild = function (p) {
    p.antiMelee = p.gasMask = p.arcanist = p.spellbook = p.bag = p.pouch = p.altChoice = false;
    _applyBuild(p);
    if (combo(p, 'grandMage')) p.maxHp -= 10;
    if (combo(p, 'versatile')) p.maxHp -= 10;
    if (combo(p, 'fullPlate')) p.moveMult *= 0.95;
    if (p.spellbook && p.spells && p.spells.length < 3) p.spells.push(...randomSpells(1, p.spells.map(s => s.id)).map(id => ({ id, cd: 0 })));
};

/* ---------- Sát thương: chống cận chiến, mặt nạ, túi đồ, đồng đội ---------- */
const _dealDamage = dealDamage;
dealDamage = function (target, baseDmg, attackerId, opts = {}) {
    const attacker = attackerId !== -1 ? players.find(q => q.id === attackerId) : null;
    if (attacker && attacker !== target && sameTeam(attacker, target)) return;
    if (opts.melee && target.antiMelee && attacker) {
        baseDmg *= combo(target, 'fullPlate') ? 0.55 : 0.7;
        const a = Math.atan2(attacker.y - target.y, attacker.x - target.x); attacker.kx += Math.cos(a) * 300; attacker.ky += Math.sin(a) * 300;
    }
    if (opts.zone && attackerId === -1 && target.gasMask) baseDmg *= combo(target, 'survivor') ? 0.35 : 0.7;
    if (attacker && attacker.bag && !opts.raw) baseDmg *= 1 + 0.08 * attacker.inventory.filter(w => w.id !== 'NONE').length;
    if (combo(target, 'bigLife') && target.lastStand && !target.lastStandUsed && target.hp - baseDmg <= 0) {
        const r = _dealDamage(target, baseDmg, attackerId, opts);
        if (target.lastStandUsed && target.hp > 0) target.hp = Math.max(target.hp, 40);
        return r;
    }
    return _dealDamage(target, baseDmg, attackerId, opts);
};
/** Đổi vũ khí: vòng qua các ô (Túi Đồ có 3 ô) */
function otherSlot(p) { return (p.weaponIdx + 1) % Math.max(2, p.inventory.length); }

/* ---------- Mỗi khung hình (máy chủ) ---------- */
let prevScare = [];
function updateExtras(dt) {
    players.forEach(p => {
        if (p.hp <= 0 || !p.st) return;
        (p.spells || []).forEach(s => { if (s.cd > 0) s.cd = Math.max(0, s.cd - dt); });
        if (p.isBot) botSpells(p, dt);
        updateRail(p, dt);
        const w = getCurrentWeapon(p);
        // Khiên: giữ để hút địch phía trước
        if (w.id === 'SHIELD' && p.aiming && p.charge > 0.15) {
            enemiesOf(p).forEach(e => {
                if (e.air > 0) return;
                const d = dist(p.x, p.y, e.x, e.y), a = Math.atan2(e.y - p.y, e.x - p.x);
                if (d < 240 && d > p.radius + e.radius + 4 && Math.abs(angleDiff(a, p.angle)) < 0.6) { e.kx -= Math.cos(a) * 1500 * dt; e.ky -= Math.sin(a) * 1500 * dt; if (Math.random() < 0.15) directionalSpark(e.x, e.y, a + Math.PI, '#94a3b8', 1, 200, 0.2); }
            });
        }
        // Elsu: ngắm súng là đứng yên
        if (p.cardSet && p.cardSet.has('elsu') && p.aiming && w.type === 'GUN') p.st.root = Math.max(p.st.root || 0, 0.05);
        if (p.fireBoost > 0) p.fireBoost -= dt;
    });
    // vùng EMP, vùng độc
    zones.forEach(z => {
        if (z.type !== 'emp' && z.type !== 'poison') return;
        const owner = players.find(q => q.id === z.owner);
        z.tk = (z.tk || 0) + dt;
        players.forEach(p => {
            if (p.hp <= 0 || dist(p.x, p.y, z.x, z.y) > z.r) return;
            const enemy = !owner || (p.id !== z.owner && !sameTeam(owner, p));
            if (z.type === 'emp' && enemy) { if (!(p.st.silence > 0)) floatText(p.x, p.y - 34, 'KHOÁ KỸ NĂNG!', '#38bdf8', 13); p.st.silence = Math.max(p.st.silence, 2); }
            if (z.type === 'poison') {
                if (!enemy && combo(owner, 'chemist') && p.id === z.owner) p.hp = Math.min(p.maxHp, p.hp + 4 * dt);
                else if (enemy && !p.gasMask && z.tk > 0.25) dealDamage(p, 3, z.owner, { zone: true });
            }
        });
        if (z.tk > 0.25) z.tk = 0;
        if (z.type === 'poison' && Math.random() < 0.4) particles.push({ x: z.x + (Math.random() - 0.5) * z.r * 1.6, y: z.y + (Math.random() - 0.5) * z.r * 1.6, vx: 0, vy: -20, life: 0.8, maxLife: 0.8, color: 'rgba(132,204,22,0.35)', size: 10, grow: 1 });
    });
    // drone / Ưng Trạm đánh dấu địch; bù nhìn nổ
    decoys.forEach(d => {
        if (d.kind !== 'ward' && d.kind !== 'drone') return;
        const owner = players.find(q => q.id === d.owner); if (!owner) return;
        const R = d.kind === 'ward' ? (combo(owner, 'skyEye') ? 450 : 300) : 260;
        enemiesOf(owner).forEach(e => { if (dist(d.x, d.y, e.x, e.y) < R && !(e.st.invis > 0)) spotFor(e, owner.id, 0.4); });
    });
    prevScare.forEach(s => { if (!decoys.includes(s)) { const o = players.find(q => q.id === s.owner); if (o && combo(o, 'scareArmy')) explode(s.x, s.y, s.owner, 60, 120); } });
    prevScare = decoys.filter(d => d.kind === 'scarecrow');
    // bụi rậm bắt lửa
    bushes.forEach(bu => {
        if (bu.burning) return;
        const fire = zones.find(z => (z.type === 'fire' || (z.type === 'lava' && lavaActive(z))) && dist(z.x, z.y, bu.x, bu.y) < z.r + bu.r * 0.5)
            || bullets.find(b => b.flame && dist(b.x, b.y, bu.x, bu.y) < bu.r * 0.8);
        if (!fire) return;
        bu.burning = true; bu.t = 3;
        zones.push({ type: 'fire', x: bu.x, y: bu.y, r: bu.r, t: 3, maxT: 3, owner: fire.owner || -1, tick: 0 });
        floatText(bu.x, bu.y, '🔥 BỤI CHÁY!', '#fb923c', 14); AudioSys.playAt('explosion', bu.x, bu.y, 0.15);
    });
}
const _upe = updatePartyExtras;
updatePartyExtras = function (dt) { _upe(dt); updateExtras(dt); if (typeof updateModes === 'function') updateModes(dt); };

/* ---------- Mỗi hiệp: phép hồi xong, 1 vật phẩm ngẫu nhiên ---------- */
const _resetPlayerForRound = resetPlayerForRound;
resetPlayerForRound = function (p) {
    if (!p.spells) p.spells = randomSpells(2).map(id => ({ id, cd: 0 }));
    p.items = [];
    p.railT = 0; p.railLv = 1; p.railBurst = null; p.mech = false; p.fireBoost = 0; p.wasSp = {};
    _resetPlayerForRound(p);
    p.spells.forEach(s => s.cd = 0);
    giveItem(p, null, true);
};
