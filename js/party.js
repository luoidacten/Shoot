/** ==================== 4 NGƯỜI CHƠI · AIM THỦ CÔNG · VŨ KHÍ, THẺ ĐỊA HÌNH · ONLINE 4 MÁY ====================
 *  File này nạp sau các file lõi: các hàm cùng tên ở đây là phiên bản mới (đã gỡ bản cũ).
 */
const PCOLORS = ['#ff4d5e', '#3ba8ff', '#4ade80', '#fbbf24', '#a855f7', '#f97316', '#ec4899', '#2dd4bf'];
const PBULLET = ['#ffb3a8', '#bfe3ff', '#bbf7d0', '#fde68a', '#e9d5ff', '#fed7aa', '#fbcfe8', '#99f6e4'];
const PNAMES = ['ĐỎ', 'XANH', 'LỤC', 'VÀNG', 'TÍM', 'CAM', 'HỒNG', 'NGỌC'];
const MAX_PLAYERS = 8;
const MAX_PICKS = 5;
let pickCount = 0;
const pColor = id => PCOLORS[(id - 1) % PCOLORS.length] || '#ffffff';

/* ============================== NGƯỜI CHƠI & MỤC TIÊU ============================== */
function enemiesOf(p) { return players.filter(e => e.id !== p.id && e.hp > 0 && e.x !== undefined); }
/** Địch "chính": ưu tiên kẻ đang nhìn thấy, gần nhất */
function enemyOf(p) {
    let best = null, bd = 1e9, bv = false;
    for (const e of enemiesOf(p)) {
        const v = targetable(p, e), d = dist(p.x, p.y, e.x, e.y);
        if ((v && !bv) || (v === bv && d < bd)) { best = e; bd = d; bv = v; }
    }
    return best || players.find(e => e.id !== p.id) || null;
}
function aimTargetFor(p, range) {
    let best = null, bd = range;
    for (const e of enemiesOf(p)) { if (!targetable(p, e)) continue; const d = dist(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
    decoys.forEach(dc => { if (dc.owner !== p.id) { const d = dist(p.x, p.y, dc.x, dc.y); if (d < bd && (!fogGameplay() || canSeeFrom(p.x, p.y, dc.x, dc.y, 0, p))) { bd = d; best = dc; } } });
    return best;
}
function botTarget(p) {
    const B = p.brain, vis = enemiesOf(p).filter(e => targetable(p, e));
    if (vis.length) { vis.sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y)); B.targetId = vis[0].id; return vis[0]; }
    const keep = players.find(q => q.id === B.targetId && q.hp > 0);
    if (keep) return keep;
    const all = enemiesOf(p).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y));
    if (all[0]) B.targetId = all[0].id;
    return all[0] || null;
}
function localId() {
    if (settings.mode === 'online') return net.myId;
    if (settings.mode === 'bot') return 1;
    return null;
}

function createPlayer(id, kind) {
    const bot = kind === 'bot' || !!window.__botBoth;
    const label = bot ? 'BOT ' + id : settings.mode === 'online' ? PNAMES[id - 1] : settings.mode === 'bot' ? 'BẠN' : 'P' + id;
    return {
        id, color: pColor(id), label, isBot: bot, remote: kind === 'remote', brain: bot ? createBrain() : null,
        score: 0, build: [], minor: [], roundPerks: [], inventory: [{ ...WEAPONS.KNIFE }, { ...WEAPONS.NONE }], weaponIdx: 0,
        stats: { dmg: 0, shots: 0, hits: 0, crates: 0, kills: 0 }
    };
}
function spawnAt(p) {
    const n = players.length, i = Math.max(0, players.indexOf(p));
    const a = Math.PI + i * Math.PI * 2 / n + (n === 4 ? Math.PI / 4 : 0);
    const rx = n > 4 ? MAP_W * 0.36 : n > 2 ? 470 : 340, ry = n > 4 ? MAP_H * 0.34 : n > 2 ? 360 : 0;
    p.x = MAP_W / 2 + Math.cos(a) * rx; p.y = MAP_H / 2 + Math.sin(a) * ry;
    p.angle = Math.atan2(MAP_H / 2 - p.y, MAP_W / 2 - p.x);
    if (pointInObstacle(p.x, p.y, p.radius + 4)) {
        outer: for (let r = 20; r < 260; r += 20) for (let k = 0; k < 12; k++) {
            const x = p.x + Math.cos(k * 0.52) * r, y = p.y + Math.sin(k * 0.52) * r;
            if (!pointInObstacle(x, y, p.radius + 4) && x > 40 && y > 40 && x < MAP_W - 40 && y < MAP_H - 40) { p.x = x; p.y = y; break outer; }
        }
    }
}

function startMatch() {
    AudioSys.init(); saveSettings(); paused = false;
    if (isTouch && settings.mode === 'pvp') settings.mode = 'bot';
    document.body.classList.toggle('pvp', settings.mode === 'pvp');
    if (isTouch) goFullscreen();
    players.length = 0;
    const n = Math.max(2, Math.min(MAX_PLAYERS, settings.count || 4));
    if (settings.mode === 'online') {
        const humans = [1, ...net.guests.map(g => g.id)];
        const total = Math.min(MAX_PLAYERS, Math.max(humans.length, n));
        for (let id = 1; id <= MAX_PLAYERS && players.length < total; id++) {
            if (humans.includes(id)) players.push(createPlayer(id, id === 1 ? 'human' : 'remote'));
            else if (players.length + (humans.filter(h => h > id).length) < total) players.push(createPlayer(id, 'bot'));
        }
    } else {
        for (let id = 1; id <= n; id++) players.push(createPlayer(id, id === 1 || (settings.mode === 'pvp' && id === 2) ? 'human' : 'bot'));
    }
    currentRound = 1; pickCount = 0; killFeed.length = 0;
    AudioSys.startMusic(); AudioSys.setIntensity(0);
    openAugmentScreen();
}

function killPlayer(dead, killerId) {
    if (dead.dead) return;
    dead.hp = 0; dead.dead = true;
    spark(dead.x, dead.y, dead.color, 40, 500, 0.9, 4); ring(dead.x, dead.y, 10, 140, dead.color, 0.6, 8);
    addDecal(dead.x, dead.y, 30, dead.color, 0.55, 8);
    smoke(dead.x, dead.y, 8);
    addShake(14); vibrate(dead.id === localId() ? 300 : 80);
    if (dead.martyr) {
        floatText(dead.x, dead.y - 30, 'ÔM BOM!! 💣', '#ff4d5e', 22, { life: 1.4 });
        for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28; items.push({ x: dead.x, y: dead.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 8, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, thrown: true, ownerId: dead.id, fuse: 1.1 + i * 0.15, z: 0, vz: 200 }); }
    }
    const killer = players.find(q => q.id === killerId && q !== dead);
    if (killer) killer.stats.kills = (killer.stats.kills || 0) + 1;
    killFeedAdd(killer ? killer.label : '☠', killer ? killer.color : '#94a3b8', dead.label, dead.color);
    const alive = players.filter(p => p.hp > 0);
    if (gameState === 'PLAYING' && aliveSides() <= 1) {
        gameState = 'KO'; koTimer = dead.martyr ? 2.6 : 1.8;
        fx.slowMo = 1.4; fx.zoomPunch = 1; flash('#ffffff', 0.35);
        camera.focus = { x: dead.x, y: dead.y };
        AudioSys.play('ko', 0.4);
        showBanner('K.O.!', '', '#ff4d5e', 1.6, 96);
    } else if (gameState === 'PLAYING') {
        AudioSys.playAt('ko', dead.x, dead.y, 0.25);
        if (dead.id === localId()) showBanner('BẠN ĐÃ BỊ HẠ', 'Đang theo dõi trận đấu…', '#ff4d5e', 2.2, 44);
        else if (killer && killer.id === localId()) showBanner('HẠ GỤC!', `Còn ${alive.length - 1} đối thủ`, killer.color, 1.4, 50);
    }
}

/* ---------- Bảng hạ gục (góc phải trên) ---------- */
const killFeed = [];
function killFeedAdd(a, ac, b, bc) {
    if (net.role === 'host' && !net.mute) net.events.push(['killFeedAdd', [a, ac, b, bc]]);
    killFeed.push({ a, ac, b, bc, born: performance.now() });
    if (killFeed.length > 4) killFeed.shift();
}

/* ============================== ĐIỀU KHIỂN CẢM ỨNG (kiểu Liên Quân) ============================== */
const skillStick = { s1: null, s2: null };
function touchLayout() {
    const W = SCREEN_W, H = SCREEN_H, m = Math.min(W, H);
    const rA = Math.max(36, Math.min(64, m * 0.13));
    const ax = W - rA - Math.max(20, W * 0.03), ay = H - rA - Math.max(14, H * 0.045);
    const d = rA * 2.1, rs = rA * 0.6;
    const at = (deg, dd, r) => ({ x: ax + Math.cos(deg * Math.PI / 180) * dd, y: ay + Math.sin(deg * Math.PI / 180) * dd, r });
    return { A: { x: ax, y: ay, r: rA }, S1: at(186, d, rs), S2: at(234, d, rs), B: at(282, d * 0.95, rA * 0.48), C: at(152, rA * 1.62, rA * 0.4), stick: { x: Math.max(110, W * 0.15), y: H - Math.max(110, H * 0.3), r: Math.max(56, m * 0.16) } };
}
function handleTouch(e) {
    if (gameState !== 'PLAYING' && gameState !== 'COUNTDOWN') return;
    e.preventDefault();
    const L = touchLayout(), inp = touchInputs.p1;
    const inBtn = (x, y, b, s = 1.25) => dist(x, y, b.x, b.y) < b.r * s;
    for (const t of e.changedTouches) {
        const x = t.clientX, y = t.clientY, id = t.identifier;
        if (e.type === 'touchstart') {
            if (inBtn(x, y, L.A, 1.3)) { inp.a = true; inp.aim = { x: 0, y: 0 }; inp.aimActive = true; touches.set(id, { k: 'a', sx: x, sy: y }); }
            else if (inBtn(x, y, L.S1)) { inp.s1 = true; inp.s1aim = null; inp.s1cancel = false; touches.set(id, { k: 's1', sx: x, sy: y }); }
            else if (inBtn(x, y, L.S2)) { inp.s2 = true; inp.s2aim = null; inp.s2cancel = false; touches.set(id, { k: 's2', sx: x, sy: y }); }
            else if (inBtn(x, y, L.B, 1.45)) { inp.b = true; touches.set(id, { k: 'b' }); }
            else if (inBtn(x, y, L.C, 1.5)) { inp.c = true; touches.set(id, { k: 'c' }); }
            else if (x < SCREEN_W * 0.5) { stickOrigin.p1 = { x, y }; touches.set(id, { k: 'stick', sx: x, sy: y }); }
        } else if (e.type === 'touchmove') {
            const td = touches.get(id); if (!td) continue;
            const dx = x - td.sx, dy = y - td.sy, d = Math.hypot(dx, dy);
            if (td.k === 'a') {
                const maxD = L.A.r * 1.6;
                inp.aim = d < 12 ? { x: 0, y: 0 } : { x: dx / d * Math.min(1, d / maxD), y: dy / d * Math.min(1, d / maxD) };
                aimStick.p1 = { sx: td.sx, sy: td.sy, x, y };
            } else if (td.k === 's1' || td.k === 's2') {
                const maxD = L.A.r * 1.7;
                if (d > 14) { inp[td.k + 'aim'] = { x: dx / d * Math.min(1, d / maxD), y: dy / d * Math.min(1, d / maxD) }; inp[td.k + 'cancel'] = false; td.eng = true; }
                else if (td.eng) { inp[td.k + 'aim'] = null; inp[td.k + 'cancel'] = true; }
                skillStick[td.k] = { sx: td.sx, sy: td.sy, x, y, cancel: !!inp[td.k + 'cancel'] };
            } else if (td.k === 'stick') {
                const maxD = L.stick.r * 0.85, dd = Math.min(d, maxD), a = Math.atan2(dy, dx), m = dd < 6 ? 0 : dd / maxD;
                inp.move = { x: Math.cos(a) * m, y: Math.sin(a) * m };
            }
        } else {
            const td = touches.get(id); if (!td) continue;
            if (td.k === 'stick') { inp.move = { x: 0, y: 0 }; stickOrigin.p1 = null; }
            else inp[td.k] = false;
            if (td.k === 'a') { inp.aim = { x: 0, y: 0 }; inp.aimActive = false; aimStick.p1 = null; }
            if (td.k === 's1' || td.k === 's2') { inp[td.k + 'aim'] = null; inp[td.k + 'cancel'] = false; skillStick[td.k] = null; }
            touches.delete(id);
        }
    }
}
function readHumanInput(id) {
    if (settings.mode !== 'pvp') return mergeInput(touchInputs.p1, keyboardInput(KEYMAP.p1), keyboardInput(KEYMAP.p2), gamepadInput(0), mouseInput(id));
    return id === 1 ? mergeInput(keyboardInput(KEYMAP.p1), gamepadInput(0), mouseInput(1)) : mergeInput(keyboardInput(KEYMAP.p2), gamepadInput(1));
}

/** Toàn màn hình + khoá ngang (điện thoại) */
function goFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return;
    try {
        const r = req.call(el, { navigationUI: 'hide' });
        const lock = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} };
        if (r && r.then) r.then(lock).catch(() => {}); else lock();
    } catch (e) {}
}

/* ============================== NGẮM (thủ công, chạm nhẹ = hỗ trợ) ============================== */
function assistAngle(p, w) {
    const melee = w.type === 'MELEE' || w.type === 'SHIELD';
    const R = (w.mode === 'charge' && w.narrow ? chargeRange(w, 0.5, p) : (w.range || 170)) * (melee ? 1.6 : 1.15);
    const t = aimTargetFor(p, R);
    return t ? Math.atan2(t.y - p.y, t.x - p.x) : p.angle;
}
function handleAttack(p, w, input, dt, allowAct, enemy) {
    const held = !!input.a && allowAct;
    const aimMag = input.aim ? Math.hypot(input.aim.x, input.aim.y) : 0;
    const pressed = held && !p.wasHeldA;
    if (held) {
        p.aHeldT = (p.aHeldT || 0) + dt;
        if (aimMag > 0.3) { p.manualAim = Math.atan2(input.aim.y, input.aim.x); p.manualEngaged = true; p.cancelShot = false; p.aimDist = input.aimDist || 0; p.aimMag = Math.min(1, aimMag); }
        else if (p.manualEngaged && input.aimActive && aimMag < 0.15) p.cancelShot = true;
    }
    if (p.manualEngaged && p.manualAim != null) p.aimAngle = p.manualAim;
    else if (p.isBot) { const t = aimTargetFor(p, (w.range || 170) * (w.type === 'MELEE' || w.type === 'SHIELD' ? 1.6 : 1.3)); p.aimAngle = t ? Math.atan2(t.y - p.y, t.x - p.x) : p.angle; }
    else if (pressed) p.aimAngle = w.mode === 'auto' ? assistAngle(p, w) : p.angle; // súng liên thanh: chạm là khoá hướng gần nhất
    else if (p.aimAngle === undefined) p.aimAngle = p.angle;
    p.aiming = held;
    if (p.cooldown > 0) p.cooldown -= dt * 60;
    if (p.st.zap > 0) p.st.zap = Math.max(0, p.st.zap - dt * 0.5);

    tickReload(p, w, dt);
    if (p.shotQueue && p.shotQueue.length) {
        for (let i = p.shotQueue.length - 1; i >= 0; i--) { const q = p.shotQueue[i]; if (!q) continue; q.t -= dt; if (q.t <= 0) { p.shotQueue.splice(i, 1); q.fn(); } }
    }
    if (p.autoThrowT > 0) { p.autoThrowT -= dt; if (p.autoThrowT <= 0 && getCurrentWeapon(p) === w && !hasAmmo(w)) { floatText(p.x, p.y - 30, 'HẾT ĐẠN — NÉM!', '#f5b100', 14); throwWeapon(p, w, enemy); return; } }

    const ready = p.cooldown <= 0 && !w.reloading && (!w.magSize || w.mag > 0);
    const released = !held && p.wasHeldA;
    // chạm nhẹ (không kéo, thả nhanh) → hỗ trợ ngắm vào địch gần nhất
    if (released && !p.isBot && !p.manualEngaged && (p.aHeldT || 0) < 0.22) p.aimAngle = assistAngle(p, w);
    p.wasHeldA = held;

    if (w.mode === 'auto') {
        if (w.spin) p.spinUp = held ? Math.min(1.2, (p.spinUp || 0) + dt) : 0;
        if (held && ready) fireWeapon(p, w, p.aimAngle, 0, enemy);
        else if (held && w.magSize && w.mag <= 0) emptyFeedback(p, w);
    } else if (w.mode === 'charge') {
        p.saberRush = false;
        if (w.saber && held && (p.charge || 0) >= 1 && w.durability > 0) {
            p.saberRush = true;
            p.saberT = (p.saberT || 0) + dt;
            if (p.saberT > 0.25) { p.saberT = 0; reduceDurability(p, w, 1); }
            cutBullets(p, p.aimAngle, p.radius + 60, 1.7);
            if (Math.random() < 0.5) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.25, maxLife: 0.25, color: hexA(saberColor(p), 0.5), size: p.radius, glow: true });
        }
        if (held && ready) {
            let rate = 1 / (w.chargeTime || 1);
            if (p.sniperNest && p.stillT >= 0.5) rate *= 2;
            if (combo(p, 'turretMode') && p.st.anchor > 0) rate = 99;
            p.charge = Math.min(1, (p.charge || 0) + dt * rate);
        }
        if (released) {
            if (!p.cancelShot && (p.charge > 0 || ready)) { if (ready) fireWeapon(p, w, p.aimAngle, p.charge || 0, enemy); else emptyFeedback(p, w); }
            p.charge = 0;
        }
    } else {
        if (released && !p.cancelShot) {
            if (ready) fireWeapon(p, w, p.aimAngle, 0, enemy);
            else if (p.cooldown > 0 && p.cooldown < 12) p.tapBuffer = 0.25;
            else emptyFeedback(p, w);
        }
        if (p.tapBuffer > 0) { p.tapBuffer -= dt; if (ready) { p.tapBuffer = 0; fireWeapon(p, w, p.aimAngle, 0, enemy); } }
    }
    if (!held) { p.manualEngaged = false; p.manualAim = null; p.cancelShot = false; p.aHeldT = 0; p.aimMag = 0; if (w.mode !== 'charge') p.charge = 0; }
    if (!held && w.mode === 'charge' && !released) p.charge = 0;
}

/* ============================== CẬN CHIẾN: ĐÂM / CHÉM / ĐẠP ĐẤT ============================== */
function saberColor(p) { return p ? ({ 1: '#f87171', 2: '#38bdf8', 3: '#4ade80', 4: '#facc15' })[p.id] || '#4ade80' : '#4ade80'; }
function strikeKind(p, w) {
    p.strikeN = world.time - (p.strikeT || -9) < 1.1 ? (p.strikeN || 0) + 1 : 1; p.strikeT = world.time;
    return w.strike === 'stab' ? 'stab' : w.strike === 'combo' ? (p.strikeN % 3 === 0 ? 'stab' : 'slash') : 'slash';
}
function fireMelee(p, w, ang, charge, mult, isSuper) {
    AudioSys.playAt('swing', p.x, p.y);
    p.stats.shots++;
    let reach = (w.type === 'SHIELD' ? 34 : w.range) * (combo(p, 'sword_brawler') ? 1.25 : 1) * (isSuper ? 1.6 : 1);
    let dmg = w.damage * (p.meleeMult || 1) * mult * (isSuper ? 2.5 : 1);
    let knock = 160, arc = Math.PI / 1.8, stun = 0, slow = 0, width = 6;
    let kind = strikeKind(p, w);
    switch (w.id) {
        case 'KNIFE':
            if (kind === 'stab') { dmg *= 1.8; floatText(p.x, p.y - 30, 'ĐÂM!', '#f1f5f9', 13); }
            p.kx += Math.cos(ang) * 180; p.ky += Math.sin(ang) * 180; break;
        case 'DAGGERS': p.kx += Math.cos(ang) * 120; p.ky += Math.sin(ang) * 120; knock = 60; width = 4; break;
        case 'KATANA':
            p.dashTime = 0.15 + charge * 0.2; p.dashAngle = ang; dmg *= 1 + charge * 0.6; knock = 260; width = 10;
            smoke(p.x, p.y, 3, 'rgba(56,189,248,0.3)', 10);
            bullets.forEach(b => {
                if (b.owner !== p.id && dist(p.x, p.y, b.x, b.y) < 100 && !b.explosive) {
                    b.owner = p.id; b.angle = Math.atan2(b.y - p.y, b.x - p.x); b.life = 1.2; b.color = '#7dd3fc';
                    spark(b.x, b.y, '#7dd3fc', 5, 200); floatText(b.x, b.y, 'PHẢN!', '#7dd3fc', 14);
                }
            });
            break;
        case 'SPEAR':
            knock = 300; width = 5;
            if (charge >= 0.9) { p.dashTime = 0.22; p.dashAngle = ang; dmg *= 1.8; reach *= 1.2; floatText(p.x, p.y - 30, 'LAO GIÁO!', '#fbbf24', 13); }
            break;
        case 'RAPIER':
            knock = 140; width = 3;
            if (charge >= 0.9) { p.dashTime = 0.2; p.dashAngle = ang; dmg *= 1.7; reach *= 1.35; floatText(p.x, p.y - 30, 'LƯỚT ĐÂM!', '#e0f2fe', 13); smoke(p.x, p.y, 3, 'rgba(224,242,254,0.3)', 10); }
            else { p.kx += Math.cos(ang) * 130; p.ky += Math.sin(ang) * 130; }
            break;
        case 'HAMMER':
            knock = 380; width = 14;
            if (charge >= 0.9) { startLeapSlam(p, w, ang, { r: 95, dmg: (w.damage + 26) * (p.meleeMult || 1) * mult, stun: 1.4, knock: 680, range: 210, color: '#d6d3d1' }); reduceDurability(p, w, 1); return; }
            break;
        case 'GREATSWORD':
            knock = 420; arc = Math.PI / 1.3; width = 16; addShake(4);
            if (charge >= 0.9) { startLeapSlam(p, w, ang, { r: 150, dmg: (w.damage + 14) * (p.meleeMult || 1) * mult, stun: 0.9, knock: 260, range: 290, color: '#fb7185' }); reduceDurability(p, w, 1); return; }
            break;
        case 'CHAINSAW': knock = 20; slow = 0.4; arc = 0.9; width = 8; break;
        case 'SHIELD': knock = 640; stun = 0.5; width = 12; break;
        case 'NONE': knock = 140; break;
        case 'LIGHTSABER': {
            knock = 260; arc = Math.PI / 1.5; width = 8;
            if (kind === 'stab') { dmg *= 1.5; reach *= 1.35; }
            const n = cutBullets(p, ang, p.radius + reach * 1.1, kind === 'stab' ? 0.5 : arc);
            if (n) floatText(p.x, p.y - 30, `CHẺ ${n} ĐẠN!`, saberColor(p), 13);
            if (charge >= 1) { dmg *= 1.4; p.kx += Math.cos(ang) * 260; p.ky += Math.sin(ang) * 260; }
            AudioSys.playAt('rail', p.x, p.y, 0.15);
            break;
        }
    }
    if (kind === 'stab' && w.id !== 'SPEAR' && w.id !== 'RAPIER' && w.id !== 'LIGHTSABER') reach *= 1.15;
    const col = w.id === 'LIGHTSABER' ? saberColor(p) : w.id === 'KATANA' ? '#7dd3fc' : w.id === 'CHAINSAW' ? '#fb923c' : w.id === 'SPEAR' ? '#fde68a' : w.id === 'GREATSWORD' ? '#fb7185' : w.id === 'RAPIER' ? '#e0f2fe' : '#f1f5f9';
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: reach + p.radius, color: col, width, arc, life: kind === 'stab' ? 0.15 : w.id === 'GREATSWORD' ? 0.26 : 0.2, maxLife: kind === 'stab' ? 0.15 : w.id === 'GREATSWORD' ? 0.26 : 0.2, swing: p.swingDir = -(p.swingDir || 1), line: kind === 'stab' });
    if (isSuper) { p.superCharge = 0; ring(p.x, p.y, 10, reach + p.radius, '#fde047', 0.3, 6); floatText(p.x, p.y - 36, 'SIÊU ĐÒN!', '#fde047', 18); }
    if (w.id === 'CHAINSAW') reduceDurability(p, w, 1);

    const hx = p.x + Math.cos(ang) * (p.radius + reach * 0.6), hy = p.y + Math.sin(ang) * (p.radius + reach * 0.6);
    for (const d of decoys) if (d.owner !== p.id && dist(hx, hy, d.x, d.y) < d.radius + reach * 0.7) d.hp = 0;
    const o = pointInObstacle(hx, hy, 10); if (o) damageObstacle(o, dmg * (combo(p, 'wrecking') ? 5 : 1), p);

    let any = false;
    // vùng trúng: đòn lướt (Katana, Giáo lao, Kiếm Liễu lướt) tính dọc cả quãng lướt; đòn đâm có bề rộng hợp lý; đứng sát luôn trúng
    const dashLen = p.dashTime > 0 && Math.abs(angleDiff(p.dashAngle, ang)) < 0.2 ? p.dashTime * 720 : 0;
    const stabW = w.id === 'SPEAR' ? 24 : 18;
    const capsule = (e, len, wd) => { const ex = p.x + Math.cos(ang) * len, ey = p.y + Math.sin(ang) * len, dx = ex - p.x, dy = ey - p.y, t = Math.max(0, Math.min(1, ((e.x - p.x) * dx + (e.y - p.y) * dy) / (dx * dx + dy * dy || 1))); return dist(e.x, e.y, p.x + dx * t, p.y + dy * t) < e.radius + wd; };
    if (dashLen > 0) slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: p.radius + dashLen + reach, color: col, width: width + 4, life: 0.22, maxLife: 0.22, swing: 1, line: true });
    for (const e of enemiesOf(p)) {
        if (e.air > 0) continue; // đang bay → né được cận chiến
        let hit;
        const d0 = dist(p.x, p.y, e.x, e.y), da = Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang));
        if (d0 < p.radius + e.radius + 14 && da < 1.7) hit = true; // sát người
        else if (kind === 'stab') hit = capsule(e, p.radius + reach + dashLen, stabW);
        else hit = (d0 < p.radius + e.radius + reach && da < arc) || (dashLen > 0 && capsule(e, p.radius + dashLen + reach * 0.6, Math.max(26, reach * 0.45)));
        if (!hit) continue;
        const hitAng = Math.atan2(e.y - p.y, e.x - p.x);
        let dd = dmg;
        if (w.id === 'DAGGERS' && Math.abs(angleDiff(e.angle, hitAng)) < 1.0) { dd *= 2; floatText(e.x, e.y - 34, 'ĐÂM LÉN!', '#f1f5f9', 15); }
        p.stats.hits++; any = true;
        dealDamage(e, dd, p.id, { angle: hitAng, knock, melee: true, burn: p.pyro, super: isSuper, slow });
        if (stun) e.stun = Math.max(e.stun, stun);
    }
    if (any) {
        if (w.id !== 'NONE' && w.type !== 'SHIELD' && w.id !== 'CHAINSAW') reduceDurability(p, w, 1);
        if (w.id !== 'CHAINSAW') { hitStop(w.id === 'KATANA' || w.id === 'HAMMER' || w.id === 'GREATSWORD' ? 0.09 : 0.05); addShake(5); }
    }
}
/** Khoảng cách đáp xuống của cú phóng (theo độ kéo ngắm, hoặc tự nhắm địch gần) */
function slamDistance(p, w, range) {
    if (p.manualEngaged) return p.aimDist ? Math.min(range, p.aimDist) : Math.max(60, (p.aimMag || 0.7) * range);
    const t = aimTargetFor(p, range * 1.2);
    return t ? Math.min(range, dist(p.x, p.y, t.x, t.y)) : range * 0.7;
}
function startLeapSlam(p, w, ang, o) {
    const d = slamDistance(p, w, o.range);
    startTravel(p, p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d, 0.5, 'slam', o, 90);
    floatText(p.x, p.y - 34, w.id === 'GREATSWORD' ? 'PHÓNG THIÊN!' : 'NHẢY ĐẬP!', o.color, 15);
    AudioSys.playAt('whoosh', p.x, p.y, 0.5);
    smoke(p.x, p.y, 6, 'rgba(200,200,220,0.35)', 16);
}

function fireRail(p, mX, mY, wep, ang, mult) {
    AudioSys.playAt('rail', p.x, p.y); addShake(9); flash('#22d3ee', 0.15);
    const L = chargeRange(wep, p.charge || 1, p), ex = mX + Math.cos(ang) * L, ey = mY + Math.sin(ang) * L;
    beams.push({ x1: mX, y1: mY, x2: ex, y2: ey, life: 0.35, maxLife: 0.35, color: '#22d3ee' });
    p.kx -= Math.cos(ang) * 300; p.ky -= Math.sin(ang) * 300;
    obstacles.slice().forEach(o => { if (segRect(mX, mY, ex, ey, o) >= 0) damageObstacle(o, 60, p); });
    const dx = ex - mX, dy = ey - mY;
    for (const e of enemiesOf(p)) {
        const t = Math.max(0, Math.min(1, ((e.x - mX) * dx + (e.y - mY) * dy) / (dx * dx + dy * dy)));
        if (dist(e.x, e.y, mX + dx * t, mY + dy * t) < e.radius + 8) { p.stats.hits++; dealDamage(e, wep.damage * mult, p.id, { angle: ang, knock: wep.knock }); hitStop(0.08); }
    }
    for (let i = 0; i < 20; i++) { const t = Math.random(); spark(mX + (ex - mX) * t * 0.5, mY + (ey - mY) * t * 0.5, '#67e8f9', 1, 80, 0.4, 2); }
}

/** Súng Điện: phóng điện liên tục hình quạt trước mặt; trúng đủ ~1 giây tích điện sẽ giật choáng */
function fireTesla(p, w, ang, dmgM, m0) {
    const R = w.range, arc = 0.45;
    let hitAny = false;
    for (const e of enemiesOf(p)) {
        const d = dist(p.x, p.y, e.x, e.y);
        if (d > R + e.radius || e.air > 0) continue;
        if (Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) > arc || !lineOfSight(p.x, p.y, e.x, e.y)) continue;
        hitAny = true;
        dealDamage(e, w.damage * dmgM, p.id, { angle: ang, knock: 15, noCharge: true });
        e.st.zap = (e.st.zap || 0) + (w.fireRate / 60) * 1.6;
        beams.push({ x1: m0.x, y1: m0.y, x2: e.x, y2: e.y, life: 0.12, maxLife: 0.12, color: '#93c5fd', zig: 1 });
        if (e.st.zap >= 1) {
            e.st.zap = 0; e.stun = Math.max(e.stun, 0.8);
            dealDamage(e, 16 * dmgM, p.id, { angle: ang, knock: 220 });
            floatText(e.x, e.y - 34, 'GIẬT ĐIỆN!', '#93c5fd', 15); ring(e.x, e.y, 5, 55, '#93c5fd', 0.3);
        }
    }
    if (!hitAny || Math.random() < 0.5) {
        const a2 = ang + (Math.random() - 0.5) * arc * 2, L = R * (0.45 + Math.random() * 0.55);
        let ex = m0.x + Math.cos(a2) * L, ey = m0.y + Math.sin(a2) * L;
        beams.push({ x1: m0.x, y1: m0.y, x2: ex, y2: ey, life: 0.1, maxLife: 0.1, color: '#bfdbfe', zig: 1 });
    }
    if (Math.random() < 0.35) AudioSys.playAt('rail', p.x, p.y, 0.05);
}
/** Súng Năng Lượng: khiên trước mặt khi không bắn */
function energyShieldUp(p, w) { return w && w.id === 'ENERGY' && w.eShield > 0 && world.time - (p.lastFireT || -9) > 0.6; }
function energyBlock(p, w, b) {
    if (!energyShieldUp(p, w) || b.explosive || b.hook) return false;
    if (Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) > 1.15) return false;
    w.eShield -= b.damage || 10; w.eHitT = world.time;
    spark(b.x, b.y, '#c4b5fd', 6, 200, 0.3, 2); AudioSys.playAt('block', p.x, p.y, 0.25);
    if (w.eShield <= 0) { w.eShield = 0; w.eBroken = world.time; floatText(p.x, p.y - 30, 'KHIÊN VỠ!', '#a78bfa', 14); ring(p.x, p.y, 10, 50, '#a78bfa', 0.3); }
    return true;
}

/* ============================== DI CHUYỂN ĐỊA HÌNH: bay, nhảy, phi móc, vượt rào ============================== */
function startTravel(p, x1, y1, T, land, o, h = 60) {
    x1 = Math.max(p.radius, Math.min(MAP_W - p.radius, x1)); y1 = Math.max(p.radius, Math.min(MAP_H - p.radius, y1));
    p.travel = { x0: p.x, y0: p.y, x1, y1, t: 0, T, land, o, h };
    p.air = T; p.dashTime = 0;
}
function updateTravel(p, dt) {
    const tr = p.travel; tr.t += dt;
    const k = Math.min(1, tr.t / tr.T), e = tr.land === 'grapple' ? k * k : k;
    p.x = tr.x0 + (tr.x1 - tr.x0) * e; p.y = tr.y0 + (tr.y1 - tr.y0) * e;
    p.vx = p.vy = p.kx = p.ky = 0;
    p.air = Math.max(0.01, tr.T - tr.t); p.airH = Math.sin(k * Math.PI) * tr.h;
    if (k >= 1) { p.travel = null; p.air = 0; p.airH = 0; resolveCircle(p, p.radius); landEffect(p, tr.land, tr.o); }
}
function landEffect(p, kind, o) {
    if (kind === 'slam') {
        const x = p.x, y = p.y;
        ring(x, y, 10, o.r, o.color, 0.45, 9); spark(x, y, o.color, 26, 360, 0.5, 4); addScorch(x, y, o.r * 0.5); addShake(14);
        AudioSys.playAt('slam', x, y, 0.6); AudioSys.playAt('explosion', x, y, 0.2);
        floatText(x, y - 40, 'ĐẠP ĐẤT!', o.color, 17);
        for (const e of enemiesOf(p)) {
            if (e.air > 0 || dist(x, y, e.x, e.y) > o.r + e.radius) continue;
            p.stats.hits++;
            dealDamage(e, o.dmg, p.id, { angle: Math.atan2(e.y - y, e.x - x), knock: o.knock, melee: true });
            e.stun = Math.max(e.stun, o.stun);
        }
        obstacles.slice().forEach(ob => { if (dist(x, y, ob.x + ob.w / 2, ob.y + ob.h / 2) < o.r + 30) damageObstacle(ob, 60, p); });
        hitStop(0.08);
    } else if (kind === 'leap') {
        const big = combo(p, 'leap_titan'), fist = combo(p, 'leap_brawler');
        const r = big ? 160 : 110, dmg = 25 * (big ? 2 : 1) * (fist ? 2 : 1);
        ring(p.x, p.y, 10, r, '#a3e635', 0.4, 7); spark(p.x, p.y, '#bef264', 18, 300); addShake(9); AudioSys.playAt('slam', p.x, p.y, 0.45);
        for (const e of enemiesOf(p)) {
            if (e.air > 0 || dist(p.x, p.y, e.x, e.y) > r + e.radius) continue;
            dealDamage(e, dmg, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 380 });
            e.st.slow = Math.max(e.st.slow, 2); if (fist) e.stun = Math.max(e.stun, 0.5);
        }
    } else if (kind === 'grapple') {
        p.st.empower = Math.max(p.st.empower, 1);
        if (combo(p, 'grap_nest')) { p.stillT = 2; p.st.reveal = 0; }
        if (combo(p, 'grap_anchor')) p.st.anchor = Math.max(p.st.anchor, 2);
        spark(p.x, p.y, '#facc15', 10, 200); AudioSys.playAt('block', p.x, p.y, 0.3);
    } else if (kind === 'vault') {
        p.st.haste = Math.max(p.st.haste, combo(p, 'vault_swift') ? 2 : 1);
        if (combo(p, 'vault_silent')) { p.st.invis = Math.max(p.st.invis, 1); invisAs(p, 'camo'); }
        smoke(p.x, p.y, 3, 'rgba(200,200,220,0.3)', 10);
    } else if (kind === 'jet') {
        shockwave(p.x, p.y, p.id, 120, 15);
        if (combo(p, 'jet_martyr')) explode(p.x, p.y, p.id, 70, 130);
    }
}
/** Gọi thay cho bước "cộng vận tốc + va chạm" trong updatePlayer */
function terrainMove(p, input, dt) {
    const moving = Math.hypot(input.move.x, input.move.y) > 0.1;
    if (p.bulldozer) {
        p.kx *= 0.5; p.ky *= 0.5;
        for (const o of obstacles.slice()) {
            if (!(o.wood || o.sandbag || o.temp !== undefined) || o.ownerPass === p.id) continue;
            const nx = Math.max(o.x, Math.min(p.x, o.x + o.w)), ny = Math.max(o.y, Math.min(p.y, o.y + o.h));
            if (dist(p.x, p.y, nx, ny) < p.radius + 3 && moving && damageObstacle(o, 9999, p)) {
                floatText(p.x, p.y - 30, 'ỦI!', '#fbbf24', 13);
                if (combo(p, 'doz_demo')) p.armor = Math.min(Math.max(150, p.maxArmor), p.armor + 20);
            }
        }
        if (combo(p, 'doz_armor') && moving && !(p.ramCd > world.time)) {
            for (const e of enemiesOf(p)) if (dist(p.x, p.y, e.x, e.y) < p.radius + e.radius + 3 && !(e.air > 0)) {
                p.ramCd = world.time + 1.5;
                dealDamage(e, 15, p.id, { angle: Math.atan2(e.y - p.y, e.x - p.x), knock: 560 }); e.stun = Math.max(e.stun, 0.3);
                floatText(e.x, e.y - 30, 'HÚC!', '#fbbf24', 15); break;
            }
        }
    }
    if (p.jetT > 0) {
        p.jetT -= dt; p.air = Math.max(0.01, p.jetT); p.airH = 34 + Math.sin(world.time * 8) * 4;
        if (Math.random() < 0.7) particles.push({ x: p.x + (Math.random() - 0.5) * 8, y: p.y + 6, vx: (Math.random() - 0.5) * 30, vy: 90, life: 0.35, maxLife: 0.35, color: Math.random() < 0.5 ? '#fb923c' : '#fde047', size: 5, glow: true });
        if (combo(p, 'jet_linger')) { p.jetFireT = (p.jetFireT || 0) - dt; if (p.jetFireT <= 0) { p.jetFireT = 0.3; zones.push({ type: 'fire', x: p.x, y: p.y, r: 50, t: 2, maxT: 2, owner: p.id, tick: 0 }); } }
        if (p.jetT <= 0) { p.jetT = 0; p.air = 0; p.airH = 0; resolveCircle(p, p.radius); landEffect(p, 'jet'); }
    }
    if (p.air > 0) { p.x = Math.max(p.radius, Math.min(MAP_W - p.radius, p.x)); p.y = Math.max(p.radius, Math.min(MAP_H - p.radius, p.y)); return; }
    const bx = p.x, by = p.y;
    resolveCircle(p, p.radius);
    // Vượt Rào: chạy vào vật cản là bật nhảy qua
    if (p.vault && moving && world.time > (p.hopReady || 0) && Math.hypot(input.move.x, input.move.y) > 0.6) {
        const a = Math.atan2(input.move.y, input.move.x);
        if (pointInObstacle(p.x + Math.cos(a) * (p.radius + 6), p.y + Math.sin(a) * (p.radius + 6), 1) || dist(bx, by, p.x, p.y) > 0.5) {
            p.pushT = (p.pushT || 0) + dt;
            if (p.pushT > 0.18) {
                for (let d = 30; d <= 160; d += 10) {
                    const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
                    if (x < p.radius || y < p.radius || x > MAP_W - p.radius || y > MAP_H - p.radius) break;
                    if (!pointInObstacle(x, y, p.radius)) { if (d > 34) { startTravel(p, x, y, 0.32, 'vault', null, 40); p.hopReady = world.time + (combo(p, 'vault_swift') ? 1 : 2.5) + (combo(p, 'vault_silent') ? 1 : 0); AudioSys.playAt('whoosh', p.x, p.y, 0.3); } break; }
                }
                p.pushT = 0;
            }
        } else p.pushT = 0;
    }
}

/* ============================== KỸ NĂNG: ngắm bằng kéo nút ============================== */
function aimDir(p) { return p.skillAng !== undefined ? p.skillAng : p.angle; }
function moveDir(p) { return p.skillAimed ? p.skillAng : (p.moveDir !== undefined ? p.moveDir : p.angle); }
function skillRange(card) { return card.aimR || card.range || 300; }
function throwSkillItem(p, id, color, maxD) {
    const ang = aimDir(p), d = Math.max(80, Math.min(maxD, p.skillDist || maxD * 0.7));
    items.push({ x: p.x, y: p.y, type: { id, color }, skill: true, angle: 0, spin: 10, vx: Math.cos(ang) * d * 3.1, vy: Math.sin(ang) * d * 3.1, thrown: true, ownerId: p.id, fuse: 0.6, z: 0, vz: 240 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.3);
}
function castSkill(p, slot, aimVec) {
    const s = p.skills && p.skills[slot];
    if (!s) return;
    if (s.cd > 0) { if (!p.isBot) floatText(p.x, p.y - 30, `${Math.ceil(s.cd)}s`, '#94a3b8', 12); return; }
    const card = CARDS[s.id], R = skillRange(card);
    const aimed = !!aimVec && Math.hypot(aimVec.x, aimVec.y) > 0.25;
    p.skillAimed = aimed;
    if (aimed) { p.skillAng = Math.atan2(aimVec.y, aimVec.x); p.skillDist = Math.min(1, Math.hypot(aimVec.x, aimVec.y)) * R; }
    else {
        const e = enemyTargetable(p, R + 120);
        p.skillAng = e ? Math.atan2(e.y - p.y, e.x - p.x) : p.angle;
        p.skillDist = e ? Math.min(R, dist(p.x, p.y, e.x, e.y)) : R * 0.7;
    }
    if (card.aim) p.angle = p.skillAng;
    card.cast(p, enemyOf(p));
    p.skillAimed = false;
    s.cd = skillCooldown(p, s.id);
    p.stats.skills = (p.stats.skills || 0) + 1;
    skillText(p, card.icon + ' ' + card.name);
}
/** Nút kỹ năng: kỹ năng không cần ngắm → bấm là dùng; cần ngắm → giữ/kéo để chọn, thả ra mới dùng */
function handleSkillButtons(p, input, allowAct) {
    p.skillAimView = null;
    for (let i = 0; i < 3; i++) {
        const k = 's' + (i + 1), held = !!input[k] && allowAct, was = !!p['wasS' + (i + 1)];
        const s = p.skills && p.skills[i], card = s && CARDS[s.id];
        let vec = input[k + 'aim'] || null;
        if (card && !vec && input.aimMouse && input.aim) { const R = skillRange(card), m = Math.min(1, (input.aimDist || R) / R); vec = { x: input.aim.x * m, y: input.aim.y * m }; }
        if (card && card.aim) {
            if (held) {
                p['sAim' + i] = vec; p['sCancel' + i] = !!input[k + 'cancel'];
                if (!p.isBot && vec && Math.hypot(vec.x, vec.y) > 0.25) p.skillAimView = { slot: i, ang: Math.atan2(vec.y, vec.x), d: Math.min(1, Math.hypot(vec.x, vec.y)) * skillRange(card), kind: card.aim, range: skillRange(card), ready: s.cd <= 0 };
                else if (!p.isBot && p['sCancel' + i]) p.skillAimView = { slot: i, cancel: true, kind: card.aim, range: skillRange(card), ang: p.angle, d: 0 };
            } else if (was && allowAct) {
                if (p['sCancel' + i]) floatText(p.x, p.y - 26, 'HUỶ', '#f87171', 12);
                else castSkill(p, i, p['sAim' + i]);
                p['sAim' + i] = null; p['sCancel' + i] = false;
            }
        } else if (held && !was && allowAct) castSkill(p, i, null);
        p['wasS' + (i + 1)] = held;
    }
}
function guestSkillView(me, inp) {
    me.skillAimView = null;
    (me.skills || []).forEach((s, i) => {
        const card = CARDS[s.id], v = inp['s' + (i + 1) + 'aim'];
        if (card && card.aim && inp['s' + (i + 1)] && v && Math.hypot(v.x, v.y) > 0.25) me.skillAimView = { slot: i, ang: Math.atan2(v.y, v.x), d: Math.min(1, Math.hypot(v.x, v.y)) * skillRange(card), kind: card.aim, range: skillRange(card), ready: s.cd <= 0 };
    });
}

/* ============================== BẪY (nhiều địch) ============================== */
function updateTraps(dt) {
    for (let i = mines.length - 1; i >= 0; i--) {
        const m = mines[i]; if (!m) continue; if (m.arm > 0) { m.arm -= dt; continue; }
        const owner = players.find(q => q.id === m.owner);
        if (!owner) continue;
        for (const e of enemiesOf(owner)) {
            if (e.air > 0) continue;
            const half = e.saboteur ? 0.5 : 1;
            let fired = false;
            if (m.kind === 'claymore') {
                const d = dist(m.x, m.y, e.x, e.y);
                if (d < 160 && Math.abs(angleDiff(Math.atan2(e.y - m.y, e.x - m.x), m.angle)) < 0.7 && lineOfSight(m.x, m.y, e.x, e.y)) {
                    fired = true;
                    const n = combo(owner, 'clay_trapper') ? 10 : 6, bush = combo(owner, 'ambushMine') && inBush(m.x, m.y) ? 1.5 : 1;
                    for (let k = 0; k < n; k++) bullets.push({ x: m.x, y: m.y, px: m.x, py: m.y, angle: m.angle + (Math.random() - 0.5) * 0.9, speed: 18, damage: trapDmg(owner, 11) * bush * half, life: 0.5, owner: m.owner, color: '#fca5a5', size: 3, knock: 140, bounces: 0, trail: 20 });
                    AudioSys.playAt('shotgun', m.x, m.y, 0.4); spark(m.x, m.y, '#fca5a5', 12, 260);
                    if (e.saboteur) floatText(e.x, e.y - 30, 'GỠ MÌN!', '#94a3b8', 13);
                }
            } else if (m.kind === 'wire') {
                const dx = m.x2 - m.x, dy = m.y2 - m.y, L = dx * dx + dy * dy || 1;
                const t = Math.max(0, Math.min(1, ((e.x - m.x) * dx + (e.y - m.y) * dy) / L));
                if (dist(e.x, e.y, m.x + dx * t, m.y + dy * t) < e.radius) {
                    fired = true;
                    dealDamage(e, trapDmg(owner, 15) * half, m.owner, {});
                    e.st.reveal = Math.max(e.st.reveal, combo(owner, 'trip_hunter') ? 8 : 5); e.st.slow = Math.max(e.st.slow, 2);
                    if (combo(owner, 'trip_trapper')) e.stun = Math.max(e.stun, 0.6);
                    floatText(e.x, e.y - 34, 'VẤP DÂY!', '#f87171', 15); AudioSys.playAt('alarm', m.x, m.y, 0.2);
                }
            } else if (dist(e.x, e.y, m.x, m.y) < e.radius + 14) {
                fired = true;
                spark(m.x, m.y, '#e5e7eb', 16, 260, 0.4, 3); ring(m.x, m.y, 5, 60, '#f87171', 0.3);
                dealDamage(e, trapDmg(owner, 40) * half, m.owner, { knock: 0 });
                e.st.root = Math.max(e.st.root || 0, combo(owner, 'trapper_trap') ? 1.6 : 1);
                floatText(e.x, e.y - 30, e.saboteur ? 'GỠ BẪY!' : 'DÍNH BẪY!', '#f87171', 16);
                if (combo(owner, 'trap_hunter')) e.st.reveal = Math.max(e.st.reveal, 4);
                AudioSys.playAt('crit', m.x, m.y, 0.4);
            }
            if (fired) { mines.splice(i, 1); break; }
        }
    }
}
function obstacleOwnerFlip(b, o) { return o && o.owner ? o.owner : b.owner; }

/** Mỗi khung hình (máy chủ): vùng lưới, khiên năng lượng hồi, điện tích tan dần */
function updatePartyExtras(dt) {
    zones.forEach(z => {
        if (z.type !== 'net') return;
        players.forEach(p => { if (p.id !== z.owner && p.hp > 0 && !(p.air > 0) && dist(p.x, p.y, z.x, z.y) < z.r) { p.st.slow = Math.max(p.st.slow, 0.2); p.st.glued = 0.2; } });
    });
    players.forEach(p => {
        if (p.hp <= 0 || !p.inventory) return;
        p.inventory.forEach(w => {
            if (w.id !== 'ENERGY') return;
            if (world.time - (w.eBroken || -9) > 3 && world.time - (p.lastFireT || -9) > 0.6 && world.time - (w.eHitT || -9) > 0.8) w.eShield = Math.min(w.eShieldMax || 80, (w.eShield || 0) + 22 * dt);
        });
    });
}

/* ============================== 5 THẺ VƯỢT ĐỊA HÌNH ============================== */
defS('jetpack', '🚀', 'Cất Cánh', 14, 'engage', 'Đeo ba lô tên lửa bay lên 2.5 giây: vượt mọi tường & địa hình, vẫn bắn được, né mọi đòn cận chiến & bẫy. Đáp đất hất văng địch xung quanh.', p => {
    p.jetT = 2.5; p.air = 2.5; p.travel = null;
    p.st.haste = Math.max(p.st.haste, 2.5);
    ring(p.x, p.y, 5, 70, '#fb923c', 0.4, 6); smoke(p.x, p.y, 8, 'rgba(200,200,220,0.4)', 16); AudioSys.playAt('explosion', p.x, p.y, 0.15);
}, 300);
defS('grapple', '🧗', 'Móc Leo', 9, 'engage', 'Phóng dây móc vào tường/vật cản rồi phi tới đó (đang bay né cận chiến). Đòn kế tiếp +50%.', p => {
    const a = aimDir(p), R = 420;
    let tx = p.x + Math.cos(a) * R, ty = p.y + Math.sin(a) * R, hitWall = false;
    for (let d = 20; d <= R; d += 10) {
        const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        if (x < 0 || y < 0 || x > MAP_W || y > MAP_H) { tx = p.x + Math.cos(a) * (d - 20); ty = p.y + Math.sin(a) * (d - 20); break; }
        if (pointInObstacle(x, y, 0)) { tx = p.x + Math.cos(a) * Math.max(0, d - p.radius - 6); ty = p.y + Math.sin(a) * Math.max(0, d - p.radius - 6); hitWall = true; break; }
    }
    beams.push({ x1: p.x, y1: p.y, x2: tx, y2: ty, life: 0.3, maxLife: 0.3, color: '#facc15' });
    startTravel(p, tx, ty, Math.max(0.12, dist(p.x, p.y, tx, ty) / 1100), 'grapple', null, 20);
    if (hitWall) spark(tx, ty, '#facc15', 8, 180);
    AudioSys.playAt('whoosh', p.x, p.y, 0.4);
}, 420);
defS('leap', '🦘', 'Bước Nhảy Vọt', 10, 'engage', 'Nhảy vọt tới vùng chọn (bay qua tường). Đáp đất: 25 sát thương và làm chậm địch xung quanh.', p => {
    let R = 300 * (combo(p, 'leap_brawler') ? 0.8 : 1) * (combo(p, 'jet_leap') && p.jetT > 0 ? 2 : 1);
    const d = Math.min(R, p.skillDist || R * 0.7), a = aimDir(p);
    p.jetT = 0;
    startTravel(p, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 0.5, 'leap', null, 80);
    AudioSys.playAt('whoosh', p.x, p.y, 0.4);
}, 300);
defP('vault', '🤸', 'Vượt Rào', 'Chạy vào tường/vật cản sẽ tự bật nhảy qua (mỗi 2.5 giây). Tiếp đất được tăng tốc 1 giây.', p => { p.vault = true; });
defP('bulldozer', '🚜', 'Xe Ủi', 'Chạm vào thùng gỗ, bao cát, tường băng là ủi nát ngay. Bị đẩy lùi ít hơn 50%.', p => { p.bulldozer = true; });

// Pháo Sáng, EMP, Cuồng Bạo: phiên bản nhiều địch
defS('flare', '🎆', 'Pháo Sáng', 12, 'reveal', 'Bắn pháo sáng: lộ vị trí mọi địch trong bán kính 900 trong 3 giây (xuyên sương mù, có mũi tên chỉ hướng) và chúng nhận thêm 15% sát thương.', p => {
    const t = combo(p, 'flare_hunter') ? 6 : 3;
    enemiesOf(p).forEach(e => { if (dist(p.x, p.y, e.x, e.y) < 900) { e.st.reveal = Math.max(e.st.reveal, t); e.st.mark = Math.max(e.st.mark, t); ring(e.x, e.y, 10, 120, '#fde047', 0.6, 6); } });
    flash('#fde047', 0.08); AudioSys.play('legend', 0.25);
});
const _empCast = CARDS.emp.cast;
defS('emp', '📡', 'Xung EMP', 15, 'engage', CARDS.emp.desc, p => {
    const r = combo(p, 'blackout') ? 390 : 260;

    _empCast(p);
    enemiesOf(p).forEach(e => {
        if (dist(p.x, p.y, e.x, e.y) >= r) { if (combo(p, 'emp_flare') && dist(p.x, p.y, e.x, e.y) < 600) e.st.reveal = Math.max(e.st.reveal, 3); return; }
        e.st.silence = 3; e.skills.forEach(s => s.cd = Math.max(s.cd, 3));
        if (combo(p, 'blackout') || combo(p, 'emp_flare')) e.st.reveal = Math.max(e.st.reveal, 3);
    });
}, 260);
CARDS.rage.cast = p => { p.st.rage = combo(p, 'rage_berserk') && p.hp < p.maxHp * 0.5 ? 6 : 4; ring(p.x, p.y, 5, 70, '#ef4444', 0.4); AudioSys.playAt('crit', p.x, p.y, 0.4); };

/** Kỹ năng cần ngắm: 'dir' = theo hướng, 'point' = chọn vùng */
const SKILL_AIM = { dash: ['dir', 170], blink: ['dir', 260], smoke: ['point', 320], hook: ['dir', 520], turret: ['dir', 90], wall: ['dir', 120], decoy: ['dir', 220], freeze: ['dir', 600], firebomb: ['point', 360], gravity: ['point', 380], claymore: ['dir', 160], tripwire: ['dir', 220], glueBomb: ['point', 340], decoyCrate: ['dir', 90], barricade: ['dir', 110], grapple: ['dir', 420], leap: ['point', 300], storm: null };
for (const id in SKILL_AIM) if (CARDS[id] && SKILL_AIM[id]) { CARDS[id].aim = SKILL_AIM[id][0]; CARDS[id].aimR = SKILL_AIM[id][1]; }

/* ============================== 18 PHỐI HỢP MỚI ============================== */
const NEW_COMBOS = [
    { id: 'jet_martyr', a: 'jetpack', b: 'martyr', name: 'Bom Rơi', desc: 'Cất Cánh đáp đất kèm một vụ nổ lớn. Cất Cánh hồi chiêu +3 giây.' },
    { id: 'jet_linger', a: 'jetpack', b: 'lingering', name: 'Phản Lực Lửa', desc: 'Khi bay để lại vệt lửa phía sau. Cất Cánh hồi chiêu +2 giây.' },
    { id: 'jet_leap', a: 'jetpack', b: 'leap', name: 'Phi Hành Gia', desc: 'Bước Nhảy dùng khi đang bay sẽ xa gấp đôi (kết thúc bay). Cất Cánh hồi chiêu +2 giây.' },
    { id: 'grap_nest', a: 'grapple', b: 'sniperNest', name: 'Ổ Bắn Trên Cao', desc: 'Phi móc tới nơi là vào trạng thái Tổ Bắn Tỉa ngay. Móc Leo hồi chiêu +2 giây.' },
    { id: 'grap_anchor', a: 'grapple', b: 'anchor', name: 'Neo Móc', desc: 'Phi móc tới nơi tự cắm Neo 2 giây (không bị đẩy, giảm sát thương).' },
    { id: 'leap_brawler', a: 'leap', b: 'brawler', name: 'Cú Đấm Trời Giáng', desc: 'Bước Nhảy đáp đất gấp đôi sát thương và choáng 0.5 giây. Tầm nhảy -20%.' },
    { id: 'leap_titan', a: 'leap', b: 'titan', name: 'Khổng Lồ Giậm Chân', desc: 'Đáp đất rộng hơn, gấp đôi sát thương. Bước Nhảy hồi chiêu +3 giây.' },
    { id: 'vault_swift', a: 'vault', b: 'swift', name: 'Parkour', desc: 'Vượt Rào chỉ hồi 1 giây, tiếp đất tăng tốc 2 giây. Máu tối đa -10.' },
    { id: 'vault_silent', a: 'vault', b: 'silent', name: 'Ninja', desc: 'Vượt Rào xong được tàng hình 1 giây. Vượt Rào hồi thêm 1 giây.' },
    { id: 'doz_demo', a: 'bulldozer', b: 'demolisher', name: 'Máy Ủi Hạng Nặng', desc: 'Mỗi vật cản bị ủi cho 20 giáp. Tốc chạy -5%.' },
    { id: 'doz_armor', a: 'bulldozer', b: 'armorP', name: 'Xe Tăng', desc: 'Chạy vào địch sẽ húc văng (15 sát thương, choáng). Tốc chạy -5%.' },
    { id: 'rage_berserk', a: 'rage', b: 'berserk', name: 'Huyết Chiến', desc: 'Cuồng Bạo kéo dài 6 giây khi dưới 50% máu. Cuồng Bạo hồi chiêu +3 giây.' },
    { id: 'regen_vamp', a: 'regen', b: 'vampire', name: 'Huyết Mạch', desc: 'Tái Tạo hồi 8 máu/giây. Hút Máu chỉ còn 18%.' },
    { id: 'freeze_glue', a: 'freeze', b: 'glueBomb', name: 'Băng Keo', desc: 'Cầu băng trúng địch đang dính keo sẽ đóng băng (choáng 0.8 giây).' },
    { id: 'storm_rage', a: 'storm', b: 'rage', name: 'Bão Lửa', desc: 'Mưa Đạn gây bỏng. Mưa Đạn hồi chiêu +3 giây.' },
    { id: 'emp_flare', a: 'emp', b: 'flare', name: 'Radar', desc: 'EMP làm lộ mọi địch trong bán kính 600 suốt 3 giây.' },
    { id: 'ammo_fast', a: 'ammoDrop', b: 'fastReload', name: 'Tiếp Tế Nhanh', desc: 'Thả Hộp Đạn hồi chiêu nhanh hơn 40%.' },
    { id: 'drop_magnet', a: 'airdropCall', b: 'magnetPulse', name: 'Nam Châm Tiếp Tế', desc: 'Gọi Tiếp Tế làm mới ngay hồi chiêu Xung Từ.' }
];
NEW_COMBOS.forEach(c => { COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
for (const id in COMBOS_OF) if (COMBOS_OF[id].length > 3) console.warn('Thẻ có hơn 3 phối hợp:', id, COMBOS_OF[id].length);

/* ============================== CHỌN THẺ (tối đa 5 lần, hiệp lẻ) ============================== */
function isPickRound(r) { return r % 2 === 1 && pickCount < MAX_PICKS; }
function isBuildRound(r) { return true; }
function pickSide(pid) { if (settings.mode === 'pvp') return pid <= 2 ? pid : 0; return pid === localId() ? 2 : 0; }
function scoreLine() { return players.map(p => p.score).join(' — '); }
function renderPickCards(side, pid, ids, kind, owned, minor, bonus, onPick) {
    const p = players.find(q => q.id === pid);
    const who = pid === localId() ? 'BẠN' : p ? p.label : 'P' + pid;
    const hint = side === 1 ? 'F / G / H / 4' : "1 / 2 / 3 / 4";
    document.querySelector(`.p${side}-side .aug-title`).innerHTML = `<span style="color:${pColor(pid)}">${who}</span> · CHỌN NÂNG CẤP <span class="aug-hint">${hint}</span>`;
    $(`p${side}-bonus`).classList.toggle('hidden', !bonus);
    $(`p${side}-wait`).classList.add('hidden');
    $(`p${side}-owned`).innerHTML = ownedRowHTML(owned, minor);
    const box = $(`p${side}-cards`); box.innerHTML = '';
    const keys = settings.mode === 'pvp' ? (side === 1 ? ['F', 'G', 'H', '4'] : ['K', 'L', ';', "'"]) : ['1', '2', '3', '4'];
    ids.forEach((id, i) => {
        const d = document.createElement('div');
        d.className = 'aug-card ' + cardClass(id, kind, owned);
        d.innerHTML = cardHTML(id, kind, owned, keys[i]);
        d.addEventListener('click', () => onPick(i));
        box.appendChild(d);
    });
}
function openAugmentScreen() {
    if (!isPickRound(currentRound)) { players.forEach(p => p.roundPerks = []); startDestinyIntro(); return; }
    gameState = 'AUGMENT';
    showScreen('augment-screen');
    $('augment-screen').classList.toggle('solo', settings.mode !== 'pvp');
    augState.kind = 'build'; augState.choices = {}; augState.picked = {};
    $('aug-score').textContent = `${scoreLine()} · NÂNG CẤP ${pickCount + 1}/${MAX_PICKS}`;
    const top = Math.max(...players.map(q => q.score));
    players.forEach(p => {
        p.roundPerks = [];
        const bonus = p.score < top;
        augState.choices[p.id] = cardsForPick(p, 'build', bonus ? 4 : 3);
        p.pickBonus = bonus;
        const side = pickSide(p.id);
        if (side) renderPickCards(side, p.id, augState.choices[p.id], 'build', p.build, p.minor, bonus, i => pickAugmentByIndex(p.id, i));
        if (p.remote) netSendTo(p.id, { t: 'aug', kind: 'build', ids: augState.choices[p.id], score: scoreLine(), bonus, owned: p.build, minor: p.minor, round: currentRound, n: pickCount + 1 });
        if (p.isBot) setTimeout(() => pickAugmentByIndex(p.id, botPickCard(p, augState.choices[p.id], 'build'), true), 700 + Math.random() * 1000);
    });
}
function pickAugmentByIndex(pid, idx, fromRemote) {
    if (gameState !== 'AUGMENT' || augState.picked[pid]) return;
    const p = players.find(q => q.id === pid); if (!p) return;
    if ((p.isBot || p.remote) && !fromRemote) return;
    const id = augState.choices[pid] && augState.choices[pid][idx]; if (!id) return;
    augState.picked[pid] = id;
    const side = pickSide(pid);
    if (side) {
        AudioSys.play('select', 0.4);
        $(`p${side}-cards`).querySelectorAll('.aug-card').forEach((c, i) => c.classList.add(i === idx ? 'selected' : 'disabled'));
        $(`p${side}-wait`).classList.remove('hidden');
    }
    if (players.every(q => augState.picked[q.id])) {
        gameState = 'AUG_DONE'; pickCount++;
        setTimeout(() => {
            if (gameState !== 'AUG_DONE') return; // đã thoát trận
            players.forEach(q => {
                const pick = augState.picked[q.id];
                q.newCombos = (COMBOS_OF[pick] || []).filter(c => q.build.includes(c.a === pick ? c.b : c.a)).map(c => c.name);
                q.build.push(pick);
            });
            startDestinyIntro();
        }, 900);
    }
}

/* ============================== TỔNG KẾT (nhiều người) ============================== */
function showGameOver() {
    gameState = 'GAMEOVER';
    AudioSys.stopMusic(); AudioSys.play('win', 0.4);
    const ps = players.slice().sort((a, b) => b.score - a.score || b.stats.dmg - a.stats.dmg), w = ps[0];
    $('go-title').textContent = `${w.label} VÔ ĐỊCH!`; $('go-title').style.color = w.color;
    $('go-score').textContent = ps.map(p => p.score).join(' — ');
    const acc = p => p.stats.shots ? Math.round(100 * p.stats.hits / p.stats.shots) + '%' : '—';
    const rows = [
        ['Hạ gục', p => p.stats.kills || 0],
        ['Sát thương', p => Math.round(p.stats.dmg)],
        ['Chính xác', acc],
        ['Hòm thính', p => p.stats.crates],
        ['Bộ thẻ', p => (p.build || []).map(id => CARDS[id] ? CARDS[id].icon : '').join('') || '—'],
        ['Phối hợp', p => COMBOS.filter(c => (p.build || []).includes(c.a) && (p.build || []).includes(c.b)).length]
    ];
    $('go-stats').innerHTML = `<tr><td></td>${ps.map(p => `<td style="color:${p.color};font-weight:700">${p.label}</td>`).join('')}</tr>` + rows.map(([n, f]) => {
        const vals = ps.map(f), nums = vals.map(v => parseFloat(v)), mx = Math.max(...nums.filter(x => !isNaN(x)));
        return `<tr><td>${n}</td>${vals.map((v, i) => `<td class="${!isNaN(nums[i]) && nums[i] === mx && mx > 0 ? 'best' : ''}">${v}</td>`).join('')}</tr>`;
    }).join('');
    if (net.role === 'host') { netSend(buildSnapshot()); netSend({ t: 'over' }); }
    const guest = net.role === 'guest';
    $('rematch-btn').disabled = guest;
    $('rematch-btn').textContent = guest ? 'CHỜ CHỦ PHÒNG…' : 'TÁI ĐẤU';
    showScreen('gameover-screen');
}

/* ============================== CAMERA ============================== */
function updateCamera(dt) {
    const alive = players.filter(p => p.hp > 0);
    const W = SCREEN_W, H = SCREEN_H;
    let tx, ty, tz;
    const me = localPlayer();
    if (camera.focus && gameState === 'KO') {
        tx = camera.focus.x; ty = camera.focus.y; tz = Math.min(1.6, Math.max(W, H) / 900);
    } else if (me) {
        let f = me;
        if (me.hp <= 0) f = players.find(q => q.id === me.lastHitBy && q.hp > 0) || alive[0] || me;
        tx = f.x + Math.cos(f.angle) * 60; ty = f.y + Math.sin(f.angle) * 60;
        tz = Math.max(0.4, Math.min(1.25, Math.min(W, H) / (isTouch ? 600 : 800)));
    } else {
        const humans = alive.filter(p => !p.isBot), list = humans.length ? humans : alive.length ? alive : players;
        const xs = list.map(p => p.x), ys = list.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        tx = (minX + maxX) / 2; ty = (minY + maxY) / 2;
        tz = Math.min(W * 0.84 / (maxX - minX + 300), H * 0.8 / (maxY - minY + 260));
        tz = Math.max(0.3, Math.min(tz, Math.min(W, H) / 420));
    }
    if (gameState === 'COUNTDOWN') tz *= 0.92 + (1 - countdown / 3) * 0.08;
    camera.x += (tx - camera.x) * Math.min(1, 5 * dt); camera.y += (ty - camera.y) * Math.min(1, 5 * dt);
    camera.zoom += (tz - camera.zoom) * Math.min(1, 3 * dt);
    const hw = W / 2 / camera.zoom, hh = H / 2 / camera.zoom;
    camera.x = hw * 2 > MAP_W + 200 ? MAP_W / 2 : Math.max(hw - 100, Math.min(MAP_W + 100 - hw, camera.x));
    camera.y = hh * 2 > MAP_H + 200 ? MAP_H / 2 : Math.max(hh - 100, Math.min(MAP_H + 100 - hh, camera.y));
}

/* ============================== ONLINE 4 MÁY (chủ phòng + 3 khách) ============================== */
net.guests = []; net.lobby = null;
function netSend(msg) {
    if (net.role === 'host') net.guests.forEach(g => { if (g.conn.open) { try { g.conn.send(msg); } catch (e) {} } });
    else if (net.conn && net.conn.open) { try { net.conn.send(msg); } catch (e) {} }
}
function netSendTo(id, msg) { const g = net.guests.find(x => x.id === id); if (g && g.conn.open) { try { g.conn.send(msg); } catch (e) {} } }
function blankRemote() { return { move: { x: 0, y: 0 }, a: false, b: false, c: false, s1: false, s2: false, la: false, lb: false, lc: false, ls1: false, ls2: false }; }
function enterOnline() { settings.mode = 'online'; document.body.classList.add('online'); document.body.classList.remove('pvp'); AudioSys.init(); }
function lobbyIds() { return [1, ...net.guests.map(g => g.id)].sort((a, b) => a - b); }
function renderLobby() {
    const el = $('lobby-list');
    const ids = net.role === 'host' ? lobbyIds() : (net.lobby || []);
    if (!net.role || !ids.length) { el.classList.add('hidden'); $('lobby-start').classList.add('hidden'); return; }
    const total = Math.min(MAX_PLAYERS, Math.max(ids.length, settings.count || 4));
    let html = '';
    for (let id = 1; id <= MAX_PLAYERS; id++) {
        const human = ids.includes(id), bot = !human && id <= total;
        html += `<div class="lobby-slot ${human ? 'on' : bot ? 'bot' : 'off'}" style="--c:${pColor(id)}"><b>${PNAMES[id - 1]}</b><span>${human ? (id === net.myId ? 'BẠN' : id === 1 ? 'CHỦ PHÒNG' : 'NGƯỜI CHƠI') : bot ? '🤖 BOT' : '—'}</span></div>`;
    }
    el.innerHTML = html; el.classList.remove('hidden');
    $('lobby-start').classList.toggle('hidden', net.role !== 'host');
}
function broadcastLobby() { netSend({ t: 'lobby', ids: lobbyIds(), count: settings.count }); renderLobby(); }

async function hostRoom() {
    netLeave(true);
    setNetStatus('Đang mở phòng…');
    try { await loadPeerLib(); } catch (e) { setNetStatus(e.message, 'err'); return; }
    net.code = randomCode(); net.guests = [];
    net.peer = new Peer(ROOM_PREFIX + net.code);
    net.peer.on('open', () => {
        net.role = 'host'; net.myId = 1; enterOnline();
        $('room-code').textContent = net.code; $('room-code-box').classList.remove('hidden');
        setNetStatus('Đã tạo phòng! Gửi mã cho tối đa 7 bạn. Chỗ trống sẽ là bot.', 'wait');
        renderLobby();
    });
    net.peer.on('connection', conn => {
        conn.on('open', () => {
            const used = net.guests.map(g => g.id); let id = 2; while (used.includes(id)) id++;
            if (id > MAX_PLAYERS || !['MENU', 'GAMEOVER'].includes(gameState)) { try { conn.send({ t: id > MAX_PLAYERS ? 'full' : 'busy' }); } catch (e) {} setTimeout(() => conn.close(), 300); return; }
            const g = { id, conn, remote: blankRemote() };
            net.guests.push(g);
            conn.on('data', m => onHostData(g, m));
            conn.on('close', () => guestLeft(g)); conn.on('error', () => guestLeft(g));
            conn.send({ t: 'welcome', id, maxWins: settings.maxWins });
            AudioSys.play('select', 0.4);
            setNetStatus(`${PNAMES[id - 1]} đã vào phòng! (${net.guests.length + 1}/${MAX_PLAYERS})`, 'ok');
            broadcastLobby();
        });
    });
    net.peer.on('error', e => { if (e.type === 'unavailable-id') return hostRoom(); setNetStatus('Lỗi mạng: ' + e.type, 'err'); });
    net.peer.on('disconnected', () => { if (net.peer && !net.peer.destroyed) net.peer.reconnect(); });
}
function guestLeft(g) {
    const i = net.guests.indexOf(g); if (i < 0) return;
    net.guests.splice(i, 1);
    const p = players.find(q => q.id === g.id);
    if (p && gameState !== 'MENU' && gameState !== 'GAMEOVER') {
        p.remote = false; p.isBot = true; p.brain = createBrain(); p.label = 'BOT ' + p.id;
        showBanner(`${PNAMES[p.id - 1]} RỜI PHÒNG`, 'Bot sẽ thay thế', p.color, 1.6, 34);
        if (gameState === 'AUGMENT' && !augState.picked[p.id]) pickAugmentByIndex(p.id, 0, true);
    }
    broadcastLobby();
}
async function joinRoom(code) {
    code = (code || '').trim().toUpperCase();
    if (code.length !== 5) { setNetStatus('Mã phòng gồm 5 ký tự', 'err'); return; }
    netLeave(true);
    setNetStatus('Đang tìm phòng ' + code + '…');
    try { await loadPeerLib(); } catch (e) { setNetStatus(e.message, 'err'); return; }
    net.peer = new Peer();
    net.peer.on('open', () => {
        const conn = net.peer.connect(ROOM_PREFIX + code, { reliable: true, serialization: 'json' });
        net.conn = conn;
        conn.on('open', () => { net.role = 'guest'; enterOnline(); setNetStatus('Đã vào phòng! Chờ chủ phòng bắt đầu…', 'ok'); players.length = 0; AudioSys.startMusic(); });
        conn.on('data', onNetData);
        conn.on('close', () => netDisconnected()); conn.on('error', () => netDisconnected());
        setTimeout(() => { if (!net.role && net.conn === conn) setNetStatus('Không kết nối được. Kiểm tra mã phòng hoặc mạng (một số mạng 4G chặn kết nối P2P).', 'err'); }, 12000);
    });
    net.peer.on('error', e => setNetStatus(e.type === 'peer-unavailable' ? 'Không tìm thấy phòng ' + code : 'Lỗi mạng: ' + e.type, 'err'));
}
function netDisconnected() {
    if (net.role !== 'guest') return;
    const wasIn = gameState !== 'MENU';
    netLeave(true);
    if (wasIn) goMenu();
    showScreen('online-screen');
    setNetStatus('Mất kết nối với chủ phòng.', 'err');
}
function netLeave(silent) {
    const c = net.conn, p = net.peer, gs = net.guests || [];
    net.conn = null; net.peer = null; net.role = null; net.events.length = 0; net.guests = []; net.lobby = null;
    try { c && c.close(); } catch (e) {}
    gs.forEach(g => { try { g.conn.close(); } catch (e) {} });
    try { p && p.destroy(); } catch (e) {}
    document.body.classList.remove('online', 'me1', 'me2');
    $('room-code-box').classList.add('hidden');
    renderLobby();
    if (!silent) setNetStatus('');
}
function onHostData(g, m) {
    if (!m || !m.t) return;
    if (m.t === 'in') {
        const r = g.remote, i = m.i;
        r.move = i.move; if (i.a && !r.a) r.la = true; if (i.b && !r.b) r.lb = true; if (i.c && !r.c) r.lc = true;
        if (i.s1 && !r.s1) r.ls1 = true; if (i.s2 && !r.s2) r.ls2 = true;
        Object.assign(r, { a: i.a, b: i.b, c: i.c, s1: i.s1, s2: i.s2, aim: i.aim, aimActive: i.aimActive, aimMouse: i.aimMouse, aimDist: i.aimDist, s1aim: i.s1aim, s2aim: i.s2aim, s1cancel: i.s1cancel, s2cancel: i.s2cancel });
    } else if (m.t === 'pick') pickAugmentByIndex(g.id, m.idx, true);
}
function netRemoteInput(id) {
    const g = net.guests.find(x => x.id === id);
    if (!g) return { move: { x: 0, y: 0 }, a: false, b: false, c: false, s1: false, s2: false };
    const r = g.remote;
    // nút kỹ năng bấm-nhả quá nhanh: giữ "đang bấm" 1 khung, khung sau mới nhả
    const s1 = r.s1 || r.ls1, s2 = r.s2 || r.ls2;
    const out = { move: r.move, a: r.a || r.la, b: r.b || r.lb, c: r.c || r.lc, s1, s2, aim: r.aim, aimActive: r.aimActive, aimMouse: r.aimMouse, aimDist: r.aimDist, s1aim: r.s1aim, s2aim: r.s2aim, s1cancel: r.s1cancel, s2cancel: r.s2cancel };
    r.la = r.lb = r.lc = r.ls1 = r.ls2 = false;
    return out;
}
function onNetData(m) {
    if (!m || !m.t) return;
    switch (m.t) {
        case 'full': setNetStatus('Phòng đã đủ 4 người.', 'err'); return;
        case 'busy': setNetStatus('Phòng đang trong trận, chờ ván sau nhé.', 'err'); return;
        case 'welcome': net.myId = m.id; settings.maxWins = m.maxWins; setNetStatus(`Bạn là ${PNAMES[m.id - 1]}. Chờ chủ phòng bắt đầu…`, 'ok'); break;
        case 'lobby': net.lobby = m.ids; settings.count = m.count; renderLobby(); break;
        case 'destiny':
            currentRound = m.rd; currentDestiny = DESTINIES[m.di]; gameState = 'DESTINY';
            if (m.rd === 1) { players.length = 0; AudioSys.startMusic(); killFeed.length = 0; }
            clearDecals(); clearFootprints(); [bullets, items, particles, texts, rings, slashes, beams].forEach(a => a.length = 0);
            guestDestinyRolling = true;
            playDestinyRoll(currentDestiny, () => { guestDestinyRolling = false; });
            break;
        case 'aug': guestOpenAugments(m); break;
        case 'over': showGameOver(); break;
        case 's': applySnapshot(m); break;
    }
}
function guestOpenAugments(m) {
    gameState = 'AUGMENT'; net.augPicked = false; net.augIds = m.ids;
    currentRound = m.round || currentRound;
    clearPlayersForPick();
    showScreen('augment-screen'); $('augment-screen').classList.add('solo');
    $('aug-score').textContent = `${m.score} · NÂNG CẤP ${m.n || 1}/${MAX_PICKS}`;
    renderPickCards(2, net.myId, m.ids, m.kind, m.owned, m.minor, m.bonus, i => guestPick(i));
}
function guestPick(idx) {
    if (net.augPicked || !net.augIds || !net.augIds[idx]) return;
    net.augPicked = true;
    AudioSys.play('select', 0.4);
    $('p2-cards').querySelectorAll('.aug-card').forEach((c, i) => c.classList.add(i === idx ? 'selected' : 'disabled'));
    $('p2-wait').classList.remove('hidden');
    netSend({ t: 'pick', idx });
}
$('lobby-start').addEventListener('click', () => { if (net.role === 'host') { AudioSys.play('ui'); startMatch(); } });
