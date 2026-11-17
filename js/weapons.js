/** ==================== VŨ KHÍ (kiểu Brawl Stars) ====================
 *  mode: 'tap'    → thả nút là bắn (hiện vùng bắn khi đang giữ)
 *        'auto'   → giữ nút để xả liên tục
 *        'charge' → giữ để tụ lực, thả để bắn
 *  Súng có băng đạn (mag) + dự trữ (reserve). Hết băng tự nạp; chạm nhẹ nút Ném để nạp chủ động.
 *  Hết sạch đạn → tự động ném vũ khí vào địch.
 *  aim: 'line' | 'arc' | 'lineMelee' | 'lob' | 'boomer'
 */
const WEAPONS = {
    // ---------- CẬN CHIẾN ----------
    NONE:     { id:'NONE', name:'Tay không', icon:'✊', type:'MELEE', mode:'tap', aim:'arc', color:'transparent', damage:10, fireRate:18, range:30, moveScale:1.15, width:0, len:0, tier:0 },
    KNIFE:    { id:'KNIFE', name:'Dao', icon:'🔪', type:'MELEE', mode:'tap', aim:'arc', color:'#cbd5e1', damage:30, fireRate:18, range:46, durability:10, maxDurability:10, moveScale:1.1, width:4, len:14, tier:1, desc:'Đòn thứ 3 liên tiếp x1.8' },
    DAGGERS:  { id:'DAGGERS', name:'Song Đao', icon:'🗡️', type:'MELEE', mode:'tap', aim:'arc', color:'#e2e8f0', damage:15, fireRate:8, range:40, durability:30, maxDurability:30, moveScale:1.15, width:3, len:12, tier:2, desc:'Đâm sau lưng x2' },
    KATANA:   { id:'KATANA', name:'Katana', icon:'⚔️', type:'MELEE', mode:'charge', chargeTime:0.7, aim:'arc', color:'#38bdf8', damage:46, fireRate:32, range:88, durability:12, maxDurability:12, moveScale:1.05, width:4, len:36, tier:3, desc:'Giữ để lướt chém xa hơn, chém đạn' },
    SPEAR:    { id:'SPEAR', name:'Giáo', icon:'🔱', type:'MELEE', mode:'charge', chargeTime:0.6, aim:'lineMelee', color:'#fbbf24', damage:30, fireRate:30, range:125, durability:12, maxDurability:12, moveScale:1.0, width:3, len:44, tier:3, desc:'Đâm xa; giữ để lao tới' },
    HAMMER:   { id:'HAMMER', name:'Búa Tạ', icon:'🔨', type:'MELEE', mode:'charge', chargeTime:0.9, aim:'arc', color:'#78716c', damage:42, fireRate:48, range:62, durability:9, maxDurability:9, moveScale:0.82, width:10, len:28, tier:3, desc:'Giữ để nện đất: choáng diện rộng' },
    CHAINSAW: { id:'CHAINSAW', name:'Cưa Máy', icon:'🪚', type:'MELEE', mode:'auto', aim:'arc', color:'#f97316', damage:5, fireRate:4, range:54, durability:150, maxDurability:150, moveScale:0.9, width:8, len:26, tier:3, desc:'Giữ để cưa liên tục, làm chậm' },
    LIGHTSABER:{ id:'LIGHTSABER', name:'Kiếm Ánh Sáng', icon:'🗡️', type:'MELEE', mode:'charge', chargeTime:0.25, aim:'arc', color:'#4ade80', damage:34, fireRate:22, range:72, durability:40, maxDurability:40, moveScale:1.08, width:4, len:42, tier:4, saber:true, desc:'Chém tan đạn; giữ để lao tới (tốn độ bền)' },
    SHIELD:   { id:'SHIELD', name:'Khiên', icon:'🛡️', type:'SHIELD', mode:'charge', chargeTime:0.4, aim:'arc', color:'#64748b', damage:18, fireRate:28, range:34, durability:200, maxDurability:200, moveScale:0.82, width:8, len:20, tier:2, desc:'Giữ để thủ, thả để húc' },
    // ---------- TẦM XA ----------
    PISTOL:   { id:'PISTOL', name:'Súng lục', icon:'🔫', type:'GUN', mode:'tap', aim:'line', color:'#94a3b8', damage:18, fireRate:12, speed:20, spread:0.06, range:520, magSize:6, mag:6, reserve:18, reloadTime:1.0, moveScale:1.0, width:4, len:13, tier:2 },
    REVOLVER: { id:'REVOLVER', name:'Ổ Quay', icon:'🤠', type:'GUN', mode:'charge', chargeTime:0.45, aim:'line', color:'#a16207', damage:26, fireRate:22, speed:22, spread:0.04, range:560, magSize:6, mag:6, reserve:12, reloadTime:1.8, moveScale:1.0, width:5, len:15, tier:3, desc:'Giữ để xả hết ổ đạn' },
    SMG:      { id:'SMG', name:'SMG', icon:'💨', type:'GUN', mode:'auto', aim:'line', color:'#fbbf24', damage:7, fireRate:5, speed:21, spread:0.28, range:460, magSize:30, mag:30, reserve:60, reloadTime:1.2, moveScale:0.92, width:3, len:11, tier:3 },
    DUAL:     { id:'DUAL', name:'Song Súng', icon:'🔫', type:'GUN', mode:'auto', aim:'line', color:'#d4d4d8', damage:8, fireRate:6, speed:20, spread:0.14, range:440, magSize:24, mag:24, reserve:48, reloadTime:1.4, moveScale:1.0, width:3, len:11, tier:3, dual:true },
    AR:       { id:'AR', name:'Súng Trường', icon:'🪖', type:'GUN', mode:'tap', aim:'line', color:'#4d7c0f', damage:11, fireRate:28, speed:22, spread:0.28, range:560, magSize:3, mag:3, reserve:6, reloadTime:1.4, moveScale:0.95, width:5, len:22, tier:3, desc:'Sấy 5 viên: 2 thẳng, 3 tỏa xa' },
    SHOTGUN:  { id:'SHOTGUN', name:'Shotgun', icon:'💥', type:'GUN', mode:'tap', aim:'line', color:'#e11d48', damage:12, fireRate:32, speed:16, spread:0.42, range:330, magSize:3, mag:3, reserve:9, reloadTime:0.6, reloadMode:'single', count:7, moveScale:0.88, width:6, len:17, tier:3, knock:220 },
    SNIPER:   { id:'SNIPER', name:'Bắn tỉa', icon:'🎯', type:'GUN', mode:'charge', chargeTime:1.3, narrow:[0.55, 0], aim:'line', color:'#a855f7', damage:80, fireRate:30, speed:30, spread:0.22, range:700, magSize:3, mag:3, reserve:3, reloadTime:1.3, reloadMode:'single', moveScale:0.85, width:5, len:36, tier:4, knock:300, desc:'Giữ để ngắm: hẹp dần, xa & nhanh hơn' },
    BOW:      { id:'BOW', name:'Cung', icon:'🏹', type:'GUN', mode:'charge', chargeTime:1.0, narrow:[0.5, 0.01], aim:'line', color:'#a3e635', damage:15, fireRate:24, speed:26, spread:0.12, range:560, magSize:6, mag:6, reserve:0, noReload:true, moveScale:1.0, width:3, len:26, tier:3, desc:'Chạm: 3 mũi liền; giữ đủ lâu: 1 mũi xuyên xa cực mạnh' },
    ROCKET:   { id:'ROCKET', name:'Pháo', icon:'🚀', type:'GUN', mode:'tap', aim:'line', color:'#1f2937', damage:0, fireRate:50, speed:12, spread:0, range:1400, magSize:1, mag:1, reserve:2, reloadTime:1.8, explosive:true, moveScale:0.75, width:10, len:22, tier:4 },
    LAUNCHER: { id:'LAUNCHER', name:'Súng Phóng Lựu', icon:'🧨', type:'GUN', mode:'tap', aim:'lob', color:'#65a30d', damage:0, fireRate:26, range:420, magSize:4, mag:4, reserve:4, reloadTime:1.6, moveScale:0.9, width:8, len:18, tier:3, desc:'Lựu đạn nảy, nổ sau 0.9s' },
    FLAME:    { id:'FLAME', name:'Phun Lửa', icon:'🔥', type:'GUN', mode:'auto', aim:'line', color:'#ea580c', damage:3, fireRate:3, speed:9, spread:0.35, range:210, magSize:80, mag:80, reserve:80, reloadTime:2.0, moveScale:0.92, width:8, len:20, tier:3, flame:true, desc:'Phun lửa gây bỏng' },
    // ---------- ĐẶC BIỆT ----------
    NET:      { id:'NET', name:'Súng Lưới', icon:'🕸️', type:'GUN', mode:'tap', aim:'line', color:'#e5e7eb', damage:8, fireRate:30, speed:13, spread:0, range:480, magSize:2, mag:2, reserve:2, reloadTime:1.6, moveScale:1.0, width:7, len:16, tier:2, desc:'Trói chân địch 1.3 giây' },
    BOOMERANG:{ id:'BOOMERANG', name:'Boomerang', icon:'🪃', type:'GUN', mode:'charge', chargeTime:0.6, aim:'boomer', color:'#d97706', damage:26, fireRate:20, speed:16, spread:0, range:260, magSize:1, mag:1, reserve:0, noReload:true, durability:14, maxDurability:14, moveScale:1.05, width:6, len:14, tier:3, desc:'Bay đi rồi quay về, trúng cả 2 lượt' },
    GRENADE:  { id:'GRENADE', name:'Lựu đạn', icon:'💣', type:'THROWABLE', mode:'charge', chargeTime:1.0, aim:'lob', color:'#10b981', damage:0, fireRate:24, range:450, magSize:3, mag:3, reserve:0, noReload:true, moveScale:1.0, width:8, len:8, tier:2 },
    // ---------- MỚI ----------
    RAPIER:   { id:'RAPIER', name:'Kiếm Liễu', icon:'🤺', type:'MELEE', mode:'charge', chargeTime:0.35, aim:'lineMelee', strike:'stab', color:'#e0f2fe', damage:24, fireRate:14, range:84, durability:30, maxDurability:30, moveScale:1.12, width:2, len:40, tier:3, desc:'Chỉ đâm; giữ để lướt đâm xuyên' },
    GREATSWORD:{ id:'GREATSWORD', name:'Đại Đao', icon:'🪓', type:'MELEE', mode:'charge', chargeTime:1.0, aim:'arc', strike:'slash', color:'#f43f5e', damage:58, fireRate:46, range:96, durability:14, maxDurability:14, moveScale:0.86, width:9, len:48, tier:4, desc:'Chém rộng cực mạnh nhưng chậm; giữ để phóng lên trời, chọn vùng đạp xuống gây choáng' },
    ENERGY:   { id:'ENERGY', name:'Súng Năng Lượng', icon:'🔋', type:'GUN', mode:'tap', aim:'line', color:'#a78bfa', damage:16, fireRate:16, speed:22, spread:0.05, range:520, magSize:8, mag:8, reserve:16, reloadTime:1.4, moveScale:0.95, width:6, len:18, tier:3, eShield:80, eShieldMax:80, desc:'Không bắn sẽ dựng khiên năng lượng trước mặt (bị phá được)' },
    TESLA:    { id:'TESLA', name:'Súng Điện', icon:'⚡', type:'GUN', mode:'auto', aim:'arc', color:'#60a5fa', damage:2.6, fireRate:6, speed:0, spread:0, range:300, magSize:60, mag:60, reserve:60, reloadTime:1.8, moveScale:0.92, width:7, len:18, tier:3, desc:'Phóng điện liên tục phía trước; trúng đủ lâu sẽ bị giật choáng' },
    // ---------- HUYỀN THOẠI (thính vàng) ----------
    MINIGUN:  { id:'MINIGUN', name:'Minigun', icon:'🌪️', type:'GUN', mode:'auto', aim:'line', color:'#f97316', damage:6, fireRate:2.4, speed:24, spread:0.2, range:520, magSize:150, mag:150, reserve:0, noReload:true, moveScale:0.62, width:7, len:26, tier:5, legendary:true, spin:true, desc:'Càng giữ càng bắn nhanh' },
    RAILGUN:  { id:'RAILGUN', name:'Railgun', icon:'⚡', type:'GUN', mode:'charge', chargeTime:0.9, narrow:[0.4, 0], aim:'line', color:'#22d3ee', damage:85, fireRate:30, range:2600, magSize:1, mag:1, reserve:3, reloadTime:1.5, moveScale:0.8, width:6, len:32, hitscan:true, tier:5, legendary:true, knock:350, spread:0, desc:'Phải tụ đủ 60% mới bắn' }
};
const BASE_WEIGHTS = { LIGHTSABER: 4, SMG: 15, SHOTGUN: 14, PISTOL: 10, AR: 14, REVOLVER: 9, DUAL: 9, GRENADE: 9, SNIPER: 7, BOW: 9, KATANA: 7, SPEAR: 7, HAMMER: 6, DAGGERS: 7, CHAINSAW: 5, SHIELD: 5, ROCKET: 4, LAUNCHER: 5, FLAME: 6, NET: 5, BOOMERANG: 6 };
const LEGEND_POOL = ['MINIGUN', 'RAILGUN', 'ROCKET', 'SNIPER'];
Object.assign(BASE_WEIGHTS, { RAPIER: 7, GREATSWORD: 6, ENERGY: 7, TESLA: 6 });
// Đâm / chém / combo
Object.assign(WEAPONS.KNIFE, { strike: 'combo', desc: 'Chém, chém, ĐÂM (đòn 3 x1.8)' });
Object.assign(WEAPONS.DAGGERS, { strike: 'stab' }); Object.assign(WEAPONS.SPEAR, { strike: 'stab' }); Object.assign(WEAPONS.SHIELD, { strike: 'stab' });
['KATANA', 'HAMMER', 'CHAINSAW', 'NONE'].forEach(k => WEAPONS[k].strike = 'slash');
// Buff mạnh: Kiếm Ánh Sáng, Khiên, Súng Lưới
Object.assign(WEAPONS.LIGHTSABER, { strike: 'combo', damage: 42, durability: 60, maxDurability: 60, desc: 'Chém, chém, ĐÂM; chẻ đạn; giữ để lao tới' });
Object.assign(WEAPONS.SHIELD, { damage: 28, durability: 320, maxDurability: 320, desc: 'Chặn đạn & giảm 70% đòn cận chiến phía trước; húc gây choáng' });
Object.assign(WEAPONS.NET, { magSize: 3, mag: 3, reserve: 3, speed: 15, desc: 'Trúng: trói + choáng. Trượt: bung lưới làm chậm mạnh 4 giây' });
Object.assign(WEAPONS.HAMMER, { desc: 'Giữ để nhảy lên đập xuống: vùng nhỏ, đẩy lùi mạnh, choáng lâu' });
// Giảm mạnh tầm bắn & tầm đánh (tầm xa vẫn hơn cận chiến nhiều)
for (const k in WEAPONS) { const w = WEAPONS[k]; if (k === 'NONE') continue; w.range = Math.round(w.range * (w.type === 'GUN' || w.type === 'THROWABLE' ? 0.6 : 0.85)); }

/* ---------------- Băng đạn ---------------- */
function effMag(p, w) {
    if (!w.magSize) return 0;
    let m = w.magSize;
    if (p && p.bigMag) m += w.magSize >= 10 ? Math.ceil(w.magSize * 0.3) : 1;
    if (p && combo(p, 'drumMag')) m += w.magSize >= 10 ? Math.ceil(w.magSize * 0.2) : 1;
    return m;
}
/** Tạo vũ khí mới cho người chơi (áp dụng Băng Đạn Mở Rộng...) */
function makeWeapon(id, p) {
    const w = { ...WEAPONS[id] };
    if (w.magSize) {
        w.mag = effMag(p, w);
        if (p && p.bigMag && !w.noReload) w.reserve += w.magSize;
        if (p && p.collector && !w.noReload) w.reserve += w.magSize;
    }
    w.reloadT = 0; w.reloading = false;
    return w;
}
/** Độ toả hiện tại của vũ khí thu hẹp dần (giống chiêu 2 của Elsu) */
function spreadAt(w, c) {
    if (!w.narrow) return w.spread || 0;
    const e = c * c * (3 - 2 * c); // mượt: hẹp chậm lúc đầu, nhanh dần rồi chốt lại
    return w.narrow[0] + (w.narrow[1] - w.narrow[0]) * e;
}
/** Tầm bay tối đa thực tế (vùng ngắm vẽ đúng bằng giá trị này).
 *  Sniper: không ngắm chỉ bay rất ngắn (ngắn hơn shotgun), ngắm càng lâu càng xa. */
function chargeRange(w, c, p) {
    switch (w.id) {
        case 'SNIPER': return (110 + 990 * c) * (p && p.sniperNest && p.stillT >= 0.5 ? 1.2 : 1);
        case 'BOW': return c < 0.35 ? 200 : 200 + 700 * c;
        case 'RAILGUN': return 200 + 1000 * c;
        case 'AR': return 400;
        default: return w.range || 500;
    }
}
function hasAmmo(w) { return !w.magSize || w.mag > 0 || w.reserve > 0 || world.infiniteAmmo; }
function ammoText(w) {
    if (w.magSize) {
        if (w.reloading) return '⟳';
        if (world.infiniteAmmo) return `${w.mag}/∞`;
        return w.noReload ? `${w.mag}` : `${w.mag}/${w.reserve}`;
    }
    if (w.durability !== undefined) return w.durability > 900 ? '∞' : Math.round(100 * w.durability / w.maxDurability) + '%';
    return '';
}
function reloadRate(p) { return (p.fastReload ? 1 / 0.6 : 1) * (p.st && p.st.anchor > 0 ? 1.2 : 1); }

function startReload(p, w, manual) {
    if (!w.magSize || w.noReload || w.reloadMode === 'single' || w.reloading) return false;
    if (w.mag >= effMag(p, w)) return false;
    if (w.reserve <= 0 && !world.infiniteAmmo) return false;
    w.reloading = true; w.reloadT = 0;
    AudioSys.playAt('reload', p.x, p.y, 0.35);
    if (manual) floatText(p.x, p.y - 26, 'NẠP ĐẠN', '#fde68a', 12);
    if (combo(p, 'armoredReload')) { p.st.shield = Math.max(p.st.shield, 25); p.st.shieldT = Math.max(p.st.shieldT, 2); }
    return true;
}
function tickReload(p, w, dt) {
    if (!w.magSize || w.noReload) return;
    w.reloadT = w.reloadT || 0;
    const em = effMag(p, w), rate = reloadRate(p);
    if (w.reloadMode === 'single') {
        // nạp từng viên liên tục (kiểu Brawl Stars)
        if (w.mag < em && (w.reserve > 0 || world.infiniteAmmo) && p.charge <= 0) {
            w.reloadT += dt * rate;
            if (w.reloadT >= w.reloadTime) { w.reloadT = 0; w.mag++; if (!world.infiniteAmmo) w.reserve--; AudioSys.playAt('tick', p.x, p.y, 0.15); }
        } else w.reloadT = 0;
        return;
    }
    if (w.mag <= 0 && !w.reloading) startReload(p, w, false);
    if (w.reloading) {
        w.reloadT += dt * rate;
        if (w.reloadT >= w.reloadTime) {
            const need = em - w.mag, take = world.infiniteAmmo ? need : Math.min(need, w.reserve);
            w.mag += take; if (!world.infiniteAmmo) w.reserve -= take;
            w.reloading = false; w.reloadT = 0;
            AudioSys.playAt('ui', p.x, p.y, 0.3);
        }
    }
}

/* ---------------- Ngắm + bắn ---------------- */
function emptyFeedback(p, w) {
    if (!w.magSize) return;
    if (w.reloading) return;
    if (world.time - (p.emptyT || -9) < 0.8) return;
    p.emptyT = world.time;
    floatText(p.x, p.y - 22, w.mag <= 0 && w.reserve <= 0 ? 'Hết đạn!' : 'Đang nạp…', '#cbd5e1', 12);
    AudioSys.playAt('ui', p.x, p.y, 0.2);
}

/** Hệ số sát thương của đòn này (tiêu hao các buff "một lần") */
function attackMult(p, w) {
    let m = 1;
    if (p.st.empower > 0 && w.id !== 'NONE') { m *= 1.5; p.st.empower--; }
    if (p.st.quickdraw > 0) { m *= 1.3; p.st.quickdrawShots = (p.st.quickdrawShots || 1) - 1; if (p.st.quickdrawShots <= 0) p.st.quickdraw = 0; }
    if (p.st.ambushBush > 0) { m *= 1.4; p.st.ambushBush = 0; floatText(p.x, p.y - 30, 'PHỤC KÍCH!', '#4ade80', 13); }
    return m;
}
function muzzle(p, w, ang, side = 0) {
    const d = p.radius + (w.len || 10) * 0.7;
    return { x: p.x + Math.cos(ang) * d + Math.cos(ang + Math.PI / 2) * side, y: p.y + Math.sin(ang) * d + Math.sin(ang + Math.PI / 2) * side };
}
function spawnBullet(p, x, y, ang, o) {
    const sp = o.speed || 20;
    const b = {
        x, y, px: x, py: y, angle: ang, speed: sp, damage: o.damage, life: Math.max(10, (o.range || 500) - dist(p.x, p.y, x, y)) / (sp * 60), owner: p.id, // dừng đúng mép vùng ngắm (tính từ tâm người bắn)
        color: o.color || PBULLET[(p.id - 1) % 4], size: o.size || 2.6, knock: o.knock || 60,
        bounces: o.bounces !== undefined ? o.bounces : (p.bounces || 0), pierce: !!o.pierce, explosive: !!o.explosive, blastSmall: !!o.blastSmall,
        trail: o.trail || 26, burn: o.burn !== undefined ? o.burn : p.pyro, slowHit: o.slow || 0, root: o.root || 0,
        flame: !!o.flame, net: !!o.net, arrow: !!o.arrow
    };
    bullets.push(b); return b;
}
/** Bắn 1 viên súng thường (có đạn nổ / viên cuối...) */
function gunBullet(p, w, ang, o) {
    p.shotCount = (p.shotCount || 0) + 1;
    const every = combo(p, 'aim_explosive') ? 7 : 5;
    const blast = (p.blastRounds && p.shotCount % every === 0) || o.blast;
    const m = muzzle(p, w, ang, o.side || 0);
    return spawnBullet(p, m.x, m.y, ang, { ...o, explosive: blast || o.explosive, blastSmall: blast || o.blastSmall, color: blast ? '#ff7a1a' : o.color });
}

function fireWeapon(p, w, ang, charge, enemy) {
    const rofMult = p.fireRateMult * (p.st.rage > 0 ? 0.75 : 1) * (p.st.anchor > 0 ? 0.77 : 1);
    p.cooldown = (w.spin ? Math.max(w.fireRate, 8 - (p.spinUp || 0) * 5) : w.fireRate) * rofMult;
    p.ghostT = 0; p.angle = ang; p.lastFireT = world.time;
    if (inBush(p.x, p.y)) p.st.exposed = 1.2; // tấn công trong bụi sẽ lộ ra một lúc
    onAttack(p);
    const mult = attackMult(p, w);
    const isSuper = p.aimshot && p.superCharge >= p.superNeed;

    if (w.type === 'MELEE' || w.type === 'SHIELD') { fireMelee(p, w, ang, charge, mult, isSuper, enemy); return; }
    if (w.type === 'THROWABLE') {
        let d = 300;
        if (p.manualEngaged) d = p.aimDist ? p.aimDist : 150 + charge * 400;
        else if (enemy && enemy.hp > 0 && targetable(p, enemy)) d = dist(p.x, p.y, enemy.x, enemy.y);
        throwGrenade(p, w, ang, d);
        return;
    }
    // ---- súng ----
    const last = w.magSize && w.mag === 1 && p.lastBullet;
    let lastMult = last ? (combo(p, 'drumMag') ? 1.4 : 1.6) : 1;
    if (!world.infiniteAmmo || w.noReload) w.mag--;
    else w.mag = Math.max(1, w.mag - 1);
    if (w.id === 'BOOMERANG') w.mag = 0; // đang bay
    if (last) floatText(p.x, p.y - 30, 'VIÊN CUỐI!', '#fde047', 12);
    p.stats.shots++; p.recoil = 1; p.muzzle = 0.06;
    const dmgM = mult * lastMult;
    const extra = last ? { pierce: true, blast: combo(p, 'finalBlast') } : {};
    const spreadM = p.spreadMult, ai = p.aiSpread || 0;
    const rnd = s => (Math.random() - 0.5) * (s * spreadM + ai);
    const m0 = muzzle(p, w, ang);
    if (!w.flame && w.id !== 'TESLA') directionalSpark(m0.x, m0.y, ang, '#ffe08a', 3, 340, 0.5);

    switch (w.id) {
        case 'AR': {
            AudioSys.playAt('shoot', p.x, p.y, 0.3);
            // 5 viên: 2 viên đầu thẳng tâm, 3 viên sau tỏa và bay xa hơn
            for (let i = 0; i < 5; i++) {
                const straight = i < 2;
                p.shotQueue.push({ t: i * 0.045, fn: () => { if (p.hp <= 0) return; gunBullet(p, w, ang + (straight ? rnd(0.02) : rnd(w.spread)), { speed: straight ? 24 : 21, damage: w.damage * dmgM, range: straight ? 350 : 400, ...extra }); AudioSys.playAt('smg', p.x, p.y, 0.15); } });
            }
            addShake(2); break;
        }
        case 'REVOLVER': {
            if (charge >= 1 && w.mag > 0) {
                // xả ổ: bắn hết số đạn còn lại thật nhanh
                const n = w.mag + 1; w.mag = 0;
                for (let i = 0; i < n; i++) p.shotQueue.push({ t: i * 0.07, fn: () => { gunBullet(p, w, ang + rnd(0.35), { speed: 21, damage: w.damage * 0.8 * dmgM, range: 290 }); AudioSys.playAt('shoot', p.x, p.y, 0.3); addShake(2); } });
                floatText(p.x, p.y - 30, 'XẢ Ổ!', '#fbbf24', 14);
            } else { gunBullet(p, w, ang + rnd(w.spread), { speed: w.speed, damage: w.damage * dmgM, range: w.range, knock: 120, ...extra }); AudioSys.playAt('shoot_heavy', p.x, p.y, 0.25); addShake(3); }
            break;
        }
        case 'SNIPER': {
            const c = charge, nest = p.sniperNest && p.stillT >= 0.5 ? 1.2 : 1;
            gunBullet(p, w, ang + rnd(spreadAt(w, c)), { speed: 30 + 30 * c, damage: w.damage * dmgM, range: chargeRange(w, c, p), size: 4, color: '#e9d5ff', pierce: true, knock: 300, trail: 90 });
            AudioSys.playAt('shoot_heavy', p.x, p.y); addShake(5); p.kx -= Math.cos(ang) * 120; p.ky -= Math.sin(ang) * 120; break;
        }
        case 'BOW': {
            if (charge >= 0.35) {
                const full = charge >= 0.98;
                spawnBullet(p, m0.x, m0.y, ang + rnd(spreadAt(w, charge)), { speed: 26 + 22 * charge, damage: (22 + 40 * charge) * dmgM, range: chargeRange(w, charge, p), size: 3 + charge, color: '#3f4a3a', pierce: full, knock: 120 + 140 * charge, trail: 6, arrow: true });
                addShake(1); // cung bắn không phát tiếng
                if (full) floatText(p.x, p.y - 28, 'MŨI TÊN XUYÊN!', '#a3e635', 13);
            } else {
                for (let i = 0; i < 3; i++) p.shotQueue.push({ t: i * 0.09, fn: () => { const mm = muzzle(p, w, ang); spawnBullet(p, mm.x, mm.y, ang + rnd(w.spread), { speed: w.speed, damage: w.damage * dmgM, range: chargeRange(w, 0, p), size: 2.5, color: '#bef264', arrow: true, trail: 34 }); } });
            }
            break;
        }
        case 'ROCKET':
            AudioSys.playAt('shoot_heavy', p.x, p.y); addShake(6);
            spawnBullet(p, m0.x, m0.y, ang + rnd(0.06), { speed: w.speed, damage: 0, range: w.range, color: '#ff7a1a', explosive: true, size: 6, bounces: 0 });
            p.kx -= Math.cos(ang) * 260; p.ky -= Math.sin(ang) * 260; break;
        case 'LAUNCHER': {
            const e = enemy && targetable(p, enemy) ? enemy : null;
            const d = Math.min(w.range, Math.max(120, p.manualEngaged ? (p.aimDist || w.range * 0.8) : e ? dist(p.x, p.y, e.x, e.y) : 320));
            items.push({ x: m0.x, y: m0.y, type: { id: 'GRENADE', color: '#84cc16' }, angle: 0, spin: 14, vx: Math.cos(ang) * d * 3.1, vy: Math.sin(ang) * d * 3.1, thrown: true, ownerId: p.id, fuse: 0.9, z: 0, vz: 300, blast: [65 * dmgM, 120] });
            AudioSys.playAt('shoot_heavy', p.x, p.y, 0.2); break;
        }
        case 'FLAME':
            for (let i = 0; i < 2; i++) spawnBullet(p, m0.x, m0.y, ang + rnd(w.spread), { speed: w.speed + Math.random() * 4, damage: w.damage * dmgM, range: w.range, size: 6, color: '#fb923c', flame: true, burn: true, bounces: 0, trail: 1, knock: 10 });
            if (Math.random() < 0.3) AudioSys.playAt('whoosh', p.x, p.y, 0.1);
            break;
        case 'NET':
            spawnBullet(p, m0.x, m0.y, ang, { speed: w.speed, damage: w.damage * dmgM, range: w.range, size: 9, color: '#e5e7eb', net: true, root: 1.3, slow: 1.5, bounces: 0, trail: 10 });
            AudioSys.playAt('whoosh', p.x, p.y, 0.35); break;
        case 'BOOMERANG': {
            const range = 260 + 220 * charge;
            const b = spawnBullet(p, m0.x, m0.y, ang, { speed: w.speed, damage: w.damage * dmgM, range: 99999, size: 7, color: '#f59e0b', bounces: 0, trail: 1 });
            b.boomerang = true; b.outDist = range; b.travel = 0; b.hitOut = false; b.hitBack = false; b.life = 6;
            reduceDurability(p, w, 1);
            AudioSys.playAt('whoosh', p.x, p.y, 0.4); break;
        }
        case 'RAILGUN':
            if (charge < 0.6) { w.mag++; floatText(p.x, p.y - 26, 'Chưa đủ lực!', '#67e8f9', 12); p.cooldown = 10; return; }
            fireRail(p, m0.x, m0.y, w, ang + rnd(spreadAt(w, charge)), dmgM); break;
        case 'TESLA': fireTesla(p, w, ang, dmgM, m0); break;
        case 'SHOTGUN':
            AudioSys.playAt('shotgun', p.x, p.y); addShake(5); p.kx -= Math.cos(ang) * 120; p.ky -= Math.sin(ang) * 120;
            for (let i = 0; i < w.count; i++) gunBullet(p, w, ang + rnd(w.spread), { speed: w.speed * (0.85 + Math.random() * 0.3), damage: w.damage * dmgM, range: w.range, knock: w.knock, ...(i === 0 ? extra : {}) });
            break;
        default: { // PISTOL, SMG, DUAL, MINIGUN
            const side = w.dual ? ((p.dualSide = -(p.dualSide || 1)) * 6) : 0;
            gunBullet(p, w, ang + rnd(w.spread), { speed: w.speed, damage: w.damage * dmgM, range: w.range, side, ...extra });
            if (w.mode === 'auto') { AudioSys.playAt('smg', p.x, p.y, 0.18); addShake(1); } else { AudioSys.playAt('shoot', p.x, p.y); addShake(2); }
            if (w.id === 'MINIGUN') { p.kx -= Math.cos(ang) * 20; p.ky -= Math.sin(ang) * 20; }
        }
    }
    if (isSuper) fireSuper(p, m0.x, m0.y);
    if (w.magSize && w.mag <= 0 && w.reserve <= 0 && !world.infiniteAmmo && w.id !== 'BOOMERANG') p.autoThrowT = 0.45;
}


/** Siêu đòn (Nhắm Bắn): viên đạn lớn xuyên thấu */
function fireSuper(p, mX, mY) {
    p.superCharge = 0;
    const boom = combo(p, 'aim_explosive');
    bullets.push({ x: mX, y: mY, px: mX, py: mY, angle: p.aimAngle !== undefined ? p.aimAngle : p.angle, speed: 24, damage: 55, life: 1.1, owner: p.id, color: '#fde047', size: 9, knock: 420, bounces: 0, pierce: true, super: true, trail: 80, explosive: boom, blastSmall: boom });
    AudioSys.playAt('rail', p.x, p.y, 0.3); addShake(7); flash('#fde047', 0.08);
    floatText(p.x, p.y - 36, 'SIÊU ĐÒN!', '#fde047', 18);
}


function throwGrenade(p, w, ang, d) {
    if (!world.infiniteAmmo) w.mag--;
    d = Math.min(330, Math.max(70, d));
    items.push({ x: p.x, y: p.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 12, vx: Math.cos(ang) * d * 3.1, vy: Math.sin(ang) * d * 3.1, thrown: true, ownerId: p.id, fuse: 1.5, z: 0, vz: 260 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.3);
    if (w.mag <= 0) p.inventory[p.weaponIdx] = { ...WEAPONS.NONE };
}

/** Ném vũ khí đang cầm (giữ nút Ném, hoặc hết đạn tự ném) */
function throwWeapon(p, wep, enemy) {
    if (wep.id === 'NONE') return;
    const idx = p.inventory.indexOf(wep);
    if (idx >= 0) p.inventory[idx] = { ...WEAPONS.NONE };
    let ang = p.aimAngle !== undefined ? p.aimAngle : p.angle;
    if (enemy && enemy.hp > 0 && targetable(p, enemy) && dist(p.x, p.y, enemy.x, enemy.y) < 650 && !p.manualEngaged) ang = Math.atan2(enemy.y - p.y, enemy.x - p.x);
    const dmg = wep.type === 'GUN' ? 14 + (wep.tier || 1) * 7 : Math.max(20, wep.damage * 0.8);
    items.push({ x: p.x, y: p.y, type: { id: wep.id, color: wep.color, len: wep.len }, angle: Math.random() * 6, spin: 18, vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900, thrown: true, ownerId: p.id, fuse: 0, dmg });
    AudioSys.playAt('whoosh', p.x, p.y, 0.35);
    floatText(p.x, p.y - 18, 'NÉM!', '#f5b100', 13);
}

/** Nút B: chạm nhẹ = nạp đạn (nếu được), giữ = ném */
function handleThrowButton(p, w, input, dt, allowAct, enemy) {
    if (!allowAct) { p.bHeldT = 0; return; }
    if (input.b) {
        p.bHeldT = (p.bHeldT || 0) + dt;
        if (p.bHeldT >= 0.35 && !p.bThrown) { p.bThrown = true; if (w.id !== 'NONE') throwWeapon(p, w, enemy); }
    } else if (p.bHeldT > 0) {
        if (!p.bThrown && w.id !== 'NONE') {
            const canReload = w.magSize && !w.noReload && w.reloadMode !== 'single' && w.mag < effMag(p, w) && (w.reserve > 0 || world.infiniteAmmo);
            if (canReload) startReload(p, w, true);
            else if (w.type === 'THROWABLE') { if (p.cooldown <= 0) { throwGrenade(p, w, p.aimAngle || p.angle, enemy && targetable(p, enemy) ? dist(p.x, p.y, enemy.x, enemy.y) : 300); p.cooldown = w.fireRate; } }
            else throwWeapon(p, w, enemy);
        }
        p.bHeldT = 0; p.bThrown = false;
    }
}

/** Boomerang: bay ra rồi quay về chủ */
function updateBoomerang(b, dt) {
    const owner = players.find(q => q.id === b.owner);
    b.travel += b.speed * 60 * dt;
    if (!b.back && b.travel >= b.outDist) b.back = true;
    if (b.back) {
        if (!owner || owner.hp <= 0) return true;
        b.angle = Math.atan2(owner.y - b.y, owner.x - b.x);
        if (dist(b.x, b.y, owner.x, owner.y) < owner.radius + 10) {
            const w = owner.inventory.find(x => x.id === 'BOOMERANG');
            if (w) { w.mag = 1; AudioSys.playAt('ui', owner.x, owner.y, 0.3); }
            return true;
        }
    }
    return false;
}

/** Kiếm Ánh Sáng: chẻ đôi các viên đạn địch trong vùng chém */
function cutBullets(p, ang, reach, arc) {
    let n = 0;
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.owner === p.id || b.boomerang) continue;
        if (dist(p.x, p.y, b.x, b.y) > reach) continue;
        if (Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), ang)) > arc) continue;
        if (b.explosive) { explode(b.x, b.y, b.owner, 60, 100); }
        else { directionalSpark(b.x, b.y, b.angle + 0.6, saberColor(p), 3, 220, 0.4); directionalSpark(b.x, b.y, b.angle - 0.6, saberColor(p), 3, 220, 0.4); }
        bullets.splice(i, 1); n++;
    }
    if (n) AudioSys.playAt('block', p.x, p.y, 0.3);
    return n;
}
