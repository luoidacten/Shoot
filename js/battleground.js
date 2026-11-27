/** ==================== BATTLEGROUND · 20 NGƯỜI ====================
 *  Bản đồ cực lớn, chia nhiều vùng địa hình (thành phố, pháo đài, rừng, sa mạc, băng nguyên, núi lửa, đầm lầy, hẻm núi,
 *  phế tích, đồng cỏ) + một con sông vắt ngang. Vòng bo thu nhiều đợt. Hạ gục nhận thẻ ngẫu nhiên. Một trận, người cuối cùng thắng.
 *  Bảng chiến thuật chỉ hiện vùng quanh bạn (trừ UAV, Tiếp tế, Quỹ đạo — xem toàn bản đồ). Nạp sau sandbox.js.
 */
const BG = { on: false, N: 20, W: 6400, H: 4800, regions: [], placed: [], zs: null, prev: null };
const BG_FULL_TAC = ['uav', 'supply', 'orbital']; // bảng chiến thuật xem được toàn bản đồ
const BIOMES = {
    city:     { name: 'THÀNH PHỐ', icon: '🏙️', tint: 'rgba(148,163,184,0.10)', map: '#475569' },
    fortress: { name: 'PHÁO ĐÀI', icon: '🏰', tint: 'rgba(168,162,158,0.12)', map: '#78716c' },
    forest:   { name: 'RỪNG RẬM', icon: '🌲', tint: 'rgba(34,197,94,0.16)', map: '#166534' },
    desert:   { name: 'SA MẠC', icon: '🏜️', tint: 'rgba(234,179,8,0.16)', map: '#a16207' },
    glacier:  { name: 'BĂNG NGUYÊN', icon: '🧊', tint: 'rgba(186,230,253,0.18)', map: '#0e7490' },
    volcano:  { name: 'NÚI LỬA', icon: '🌋', tint: 'rgba(239,68,68,0.15)', map: '#991b1b' },
    swamp:    { name: 'ĐẦM LẦY', icon: '🐸', tint: 'rgba(77,124,15,0.2)', map: '#3f6212' },
    canyon:   { name: 'HẺM NÚI', icon: '⛰️', tint: 'rgba(180,83,9,0.16)', map: '#9a3412' },
    ruins:    { name: 'PHẾ TÍCH', icon: '🏚️', tint: 'rgba(120,113,108,0.10)', map: '#57534e' },
    plains:   { name: 'ĐỒNG CỎ', icon: '🌾', tint: 'rgba(132,204,22,0.07)', map: '#4d7c0f' }
};
// màu cho người chơi 9–20
PCOLORS.push('#84cc16', '#06b6d4', '#e11d48', '#8b5cf6', '#f59e0b', '#14b8a6', '#d946ef', '#64748b', '#22c55e', '#0ea5e9', '#f43f5e', '#a3a3a3');
PBULLET.push('#d9f99d', '#a5f3fc', '#fecdd3', '#ddd6fe', '#fde68a', '#99f6e4', '#f5d0fe', '#cbd5e1', '#bbf7d0', '#bae6fd', '#fecdd3', '#e5e5e5');
MAP_NAMES.bg = 'CHIẾN TRƯỜNG';

/* ============================== VÀO TRẬN ============================== */
function startBattleground() {
    if (typeof SB !== 'undefined' && SB.on) sbExit();
    AudioSys.init(); paused = false;
    BG.prev = BG.prev || { mode: settings.mode, maxWins: settings.maxWins };
    settings.mode = 'bot'; settings.maxWins = 1; saveSettings();
    document.body.classList.remove('pvp'); if (isTouch) goFullscreen();
    BG.on = true;
    players.length = 0;
    for (let id = 1; id <= BG.N; id++) players.push(createPlayer(id, id === 1 ? 'human' : 'bot'));
    currentRound = 1; pickCount = 0; killFeed.length = 0;
    if (typeof matchPreDone !== 'undefined') { matchPreDone = false; phaseQueue = []; phaseDone = null; augState.phase = null; }
    AudioSys.startMusic(); AudioSys.setIntensity(0);
    openAugmentScreen();
}
function bgExit() { if (!BG.on) return; BG.on = false; if (BG.prev) { settings.mode = BG.prev.mode; settings.maxWins = BG.prev.maxWins || 4; BG.prev = null; } }
const _goMenuBG = goMenu;
goMenu = function () { bgExit(); return _goMenuBG(); };
const _startMatchBG = startMatch;
startMatch = function () { if (BG.on) return startBattleground(); return _startMatchBG(); }; // nút TÁI ĐẤU
const _setMapSizeBG = setMapSize;
setMapSize = function (w, h) { return BG.on && net.role !== 'guest' ? _setMapSizeBG(BG.W, BG.H) : _setMapSizeBG(w, h); };
const _pickMapBG = pickMapType;
pickMapType = function () { return BG.on ? 'bg' : _pickMapBG(); };
const _generateMapBG = generateMap;
generateMap = function (type) { if (type === 'bg') { world.mapType = 'bg'; world.lastMap = 'bg'; world.theme = 0; return bgGenerate(); } return _generateMapBG(type); };

/* ============================== SINH BẢN ĐỒ ============================== */
function bgOverlap(x, y, w, h, pad) { return obstacles.some(b => x < b.x + b.w + pad && x + w > b.x - pad && y < b.y + b.h + pad && y + h > b.y - pad); }
function bgWall(x, y, w, h, o = {}, pad = 16) {
    if (x < 30 || y < 30 || x + w > MAP_W - 30 || y + h > MAP_H - 30) return false;
    if (bgOverlap(x, y, w, h, pad)) return false;
    if (zones.some(z => (z.type === 'water' || z.type === 'lava') && x < z.x + z.r && x + w > z.x - z.r && y < z.y + z.r && y + h > z.y - z.r)) return false;
    const ob = { x, y, w, h, wood: false, ...o }; if (ob.wood) { ob.hp = ob.maxHp = ob.hp || 90; ob.hit = 0; }
    obstacles.push(ob); return true;
}
const bgWood = (x, y, s = 50) => bgWall(x, y, s, s, { wood: true }, 20);
function bgBush(x, y, r) { if (bushes.some(b => dist(b.x, b.y, x, y) < b.r + r * 0.6)) return; if (obstacles.some(o => x + r * 0.7 > o.x && x - r * 0.7 < o.x + o.w && y + r * 0.7 > o.y && y - r * 0.7 < o.y + o.h)) return; bushes.push({ x, y, r, seed: Math.random() * 10 }); }
function bgZone(type, x, y, r, extra = {}) { zones.push({ type, x, y, r, t: Infinity, maxT: Infinity, tick: 0, ...extra }); }
const rnd = (a, b) => a + Math.random() * (b - a);
/** phòng kín có cửa: tường dày T, các cạnh trong `doors` có khe cửa */
function bgRoom(x, y, w, h, T, doors, o = {}) {
    const gap = 74;
    const side = (sx, sy, len, horiz, door) => {
        if (!door) return horiz ? bgWall(sx, sy, len, T, o, 2) : bgWall(sx, sy, T, len, o, 2);
        const d0 = rnd(len * 0.25, len * 0.75 - gap);
        if (horiz) { bgWall(sx, sy, d0, T, o, 2); bgWall(sx + d0 + gap, sy, len - d0 - gap, T, o, 2); }
        else { bgWall(sx, sy, T, d0, o, 2); bgWall(sx, sy + d0 + gap, T, len - d0 - gap, o, 2); }
    };
    side(x, y, w, true, doors.includes('n')); side(x, y + h - T, w, true, doors.includes('s'));
    side(x, y + T, h - 2 * T, false, doors.includes('w')); side(x + w - T, y + T, h - 2 * T, false, doors.includes('e'));
}
const BUILD = {
    city(R) { // các khối nhà có cửa, đường phố giữa, thùng gỗ
        const cols = 3, rows = 3, cw = R.w / cols, ch = R.h / rows;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
            if (Math.random() < 0.15) { bgWood(R.x + i * cw + cw / 2 - 25, R.y + j * ch + ch / 2 - 25); continue; }
            const w = rnd(cw * 0.5, cw * 0.72), h = rnd(ch * 0.5, ch * 0.72), x = R.x + i * cw + (cw - w) / 2, y = R.y + j * ch + (ch - h) / 2;
            const ds = ['n', 's', 'e', 'w'].sort(() => Math.random() - 0.5).slice(0, 2);
            bgRoom(x, y, w, h, 22, ds);
            if (Math.random() < 0.7) bgWood(x + w / 2 - 22, y + h / 2 - 22, 44);
        }
        for (let k = 0; k < 6; k++) bgWood(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), 40);
    },
    fortress(R) { // tường thành lớn, 4 cổng, tháp góc, sân trong
        const S = Math.min(R.w, R.h) * 0.72, x = R.x + (R.w - S) / 2, y = R.y + (R.h - S) / 2, T = 34;
        bgRoom(x, y, S, S, T, ['n', 's', 'e', 'w']);
        [[x - 20, y - 20], [x + S - 50, y - 20], [x - 20, y + S - 50], [x + S - 50, y + S - 50]].forEach(([tx, ty]) => bgWall(tx, ty, 70, 70, {}, 0));
        const cx = x + S / 2, cy = y + S / 2;
        bgWall(cx - 50, cy - 50, 100, 100, {}, 10); // tháp giữa
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; bgWood(cx + Math.cos(a) * S * 0.28 - 25, cy + Math.sin(a) * S * 0.28 - 25); }
        for (let k = 0; k < 4; k++) bgBush(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), rnd(55, 80));
    },
    forest(R) {
        for (let k = 0; k < 18; k++) bgBush(rnd(R.x + 60, R.x + R.w - 60), rnd(R.y + 60, R.y + R.h - 60), rnd(70, 120));
        for (let k = 0; k < 22; k++) { const s = rnd(26, 38); bgWall(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), s, s, { tree: true }, 30); } // thân cây
        for (let k = 0; k < 4; k++) bgWood(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h));
    },
    desert(R) {
        for (let k = 0; k < 5; k++) bgZone('sand', rnd(R.x + 150, R.x + R.w - 150), rnd(R.y + 150, R.y + R.h - 150), rnd(120, 210));
        for (let k = 0; k < 10; k++) { const w = rnd(50, 130), h = rnd(40, 90); bgWall(rnd(R.x, R.x + R.w - w), rnd(R.y, R.y + R.h - h), w, h, { rock: true }, 40); }
        for (let k = 0; k < 3; k++) bgBush(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), rnd(45, 60));
    },
    glacier(R) {
        for (let k = 0; k < 5; k++) bgZone('icefloor', rnd(R.x + 140, R.x + R.w - 140), rnd(R.y + 140, R.y + R.h - 140), rnd(110, 180));
        for (let k = 0; k < 8; k++) { const horiz = Math.random() < 0.5, L = rnd(120, 260); bgWall(rnd(R.x, R.x + R.w - L), rnd(R.y, R.y + R.h - L), horiz ? L : 30, horiz ? 30 : L, { ice: true }, 30); }
    },
    volcano(R) {
        const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
        bgZone('lava', cx, cy, rnd(110, 140), { phase: Math.random() * 8 });
        for (let k = 0; k < 4; k++) { const a = Math.random() * 6.28, d = rnd(280, Math.min(R.w, R.h) * 0.42); bgZone('lava', cx + Math.cos(a) * d, cy + Math.sin(a) * d, rnd(70, 110), { phase: Math.random() * 8 }); }
        for (let k = 0; k < 12; k++) { const w = rnd(40, 110), h = rnd(40, 110); bgWall(rnd(R.x, R.x + R.w - w), rnd(R.y, R.y + R.h - h), w, h, { rock: true }, 36); }
    },
    swamp(R) {
        for (let k = 0; k < 9; k++) bgZone('water', rnd(R.x + 100, R.x + R.w - 100), rnd(R.y + 100, R.y + R.h - 100), rnd(60, 120));
        for (let k = 0; k < 12; k++) bgBush(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), rnd(55, 95));
        for (let k = 0; k < 5; k++) bgWood(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), 44);
    },
    canyon(R) { // các vách núi dài, khe hở để đi qua
        const vert = R.w > R.h ? false : true, n = 4;
        for (let i = 1; i <= n; i++) {
            const along = vert ? R.h : R.w, pos = (vert ? R.x + R.w * i / (n + 1) : R.y + R.h * i / (n + 1)) + rnd(-40, 40);
            let s = 0;
            while (s < along) { const L = rnd(200, 420), g = rnd(90, 150); if (vert) bgWall(pos, R.y + s, 44, Math.min(L, along - s), { rock: true }, 4); else bgWall(R.x + s, pos, Math.min(L, along - s), 44, { rock: true }, 4); s += L + g; }
        }
        for (let k = 0; k < 4; k++) bgBush(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), rnd(50, 75));
    },
    ruins(R) { // mảnh tường gãy hình chữ L, đống gạch gỗ
        for (let k = 0; k < 14; k++) {
            const x = rnd(R.x + 40, R.x + R.w - 200), y = rnd(R.y + 40, R.y + R.h - 200), a = rnd(80, 190), b = rnd(80, 190);
            bgWall(x, y, a, 24, {}, 24); if (Math.random() < 0.7) bgWall(x, y + 24, 24, b, {}, 0);
        }
        for (let k = 0; k < 8; k++) bgWood(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), rnd(36, 52));
        for (let k = 0; k < 4; k++) bgBush(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), rnd(50, 80));
    },
    plains(R) {
        for (let k = 0; k < 7; k++) bgBush(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), rnd(55, 90));
        for (let k = 0; k < 7; k++) bgWood(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h), rnd(40, 56));
        for (let k = 0; k < 4; k++) { const L = rnd(140, 240); Math.random() < 0.5 ? bgWall(rnd(R.x, R.x + R.w - L), rnd(R.y, R.y + R.h), L, 18, { wood: true, hp: 70 }, 30) : bgWall(rnd(R.x, R.x + R.w), rnd(R.y, R.y + R.h - L), 18, L, { wood: true, hp: 70 }, 30); } // hàng rào
    }
};
function bgGenerate() {
    BG.regions = [];
    const cols = 4, rows = 3, cw = MAP_W / cols, ch = MAP_H / rows;
    const pool = ['forest', 'desert', 'glacier', 'volcano', 'swamp', 'canyon', 'ruins', 'plains', 'forest', 'plains'].sort(() => Math.random() - 0.5);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        let b;
        if (j === 1 && i === 1) b = 'city'; else if (j === 1 && i === 2) b = 'fortress'; else b = pool.pop() || 'plains';
        BG.regions.push({ x: i * cw, y: j * ch, w: cw, h: ch, b });
    }
    // sông vắt ngang bản đồ (có chỗ cạn để lội qua / cầu)
    const amp = MAP_H * 0.12, base = MAP_H * (Math.random() < 0.5 ? 0.33 : 0.67), ph = Math.random() * 6;
    let gapAt = 0;
    for (let x = 60; x < MAP_W - 60; x += 110) {
        if (x > gapAt + 900) { gapAt = x; continue; } // khe cầu
        const y = base + Math.sin(x / MAP_W * Math.PI * 2.2 + ph) * amp;
        const reg = BG.regions.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
        if (reg && (reg.b === 'city' || reg.b === 'fortress')) continue;
        bgZone('water', x, y, rnd(80, 100));
    }
    BG.regions.forEach(R => { const m = 70; BUILD[R.b]({ x: R.x + m, y: R.y + m, w: R.w - 2 * m, h: R.h - 2 * m }); });
    // hòm thính rải khắp bản đồ
    for (let k = 0; k < 150; k++) { const x = rnd(80, MAP_W - 80), y = rnd(80, MAP_H - 80); if (!pointInObstacle(x, y, 30) && !zones.some(z => z.type === 'lava' && dist(z.x, z.y, x, y) < z.r)) crates.push(makeCrate(x, y)); }
    // hòm thẻ nâng cấp: xanh (chọn 1/3) và vàng (chọn 1/4, hồi máu) — hiếm hơn ở rìa, nhiều hơn ở giữa
    for (let k = 0, n = 0; k < 400 && n < 54; k++) { const x = rnd(100, MAP_W - 100), y = rnd(100, MAP_H - 100); if (pointInObstacle(x, y, 30) || zones.some(z => (z.type === 'lava' || z.type === 'water') && dist(z.x, z.y, x, y) < z.r + 10)) continue; const gold = n < 10; if (gold && dist(x, y, MAP_W / 2, MAP_H / 2) > MAP_W * 0.33) continue; const c = makeCrate(x, y, gold ? 'CARDGOLD' : 'CARDBOX'); c.size = gold ? 32 : 28; crates.push(c); n++; }
    BG.placed = [];
}
const bgRegionAt = (x, y) => BG.regions.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);

/* ============================== XUẤT PHÁT RẢI RÁC ============================== */
const _spawnAtBG = spawnAt;
spawnAt = function (p) {
    if (!BG.on || world.mapType !== 'bg') return _spawnAtBG(p);
    let best = null, bd = -1;
    for (let k = 0; k < 60; k++) {
        const x = rnd(120, MAP_W - 120), y = rnd(120, MAP_H - 120);
        if (pointInObstacle(x, y, p.radius + 12) || zones.some(z => (z.type === 'water' || z.type === 'lava') && dist(z.x, z.y, x, y) < z.r + 20)) continue;
        const d = BG.placed.reduce((m, q) => Math.min(m, dist(q.x, q.y, x, y)), 1e9);
        if (d > bd) { bd = d; best = { x, y }; }
    }
    best = best || { x: MAP_W / 2, y: MAP_H / 2 };
    p.x = best.x; p.y = best.y; p.angle = Math.atan2(MAP_H / 2 - p.y, MAP_W / 2 - p.x);
    BG.placed.push(best);
};
const _initRoundBG = initRound;
initRound = function () {
    if (!BG.on) return _initRoundBG();
    BG.placed = [];
    const r = _initRoundBG();
    // vòng bo nhiều đợt
    const z = world.zone, R0 = Math.hypot(MAP_W, MAP_H) / 2 + 50;
    Object.assign(z, { x: MAP_W / 2, y: MAP_H / 2, r: R0, startR: R0, sx: MAP_W / 2, sy: MAP_H / 2, tx: MAP_W / 2, ty: MAP_H / 2, endR: R0 });
    world.zoneDelay = 1e9; world.airdropTimer = 25;
    BG.zs = { i: -1, phase: 'wait', t: 0, wait: 40 };
    bgNextStage();
    players.forEach(p => { p.bgPlace = 0; p.bgKills = 0; });
    showBanner('🌍 CHIẾN TRƯỜNG · 20 NGƯỜI', 'Người cuối cùng sống sót chiến thắng · Hạ gục nhận thẻ ngẫu nhiên', '#fde047', 3, 44);
    return r;
};
const BG_STAGES = [{ wait: 45, dur: 55, f: 0.6 }, { wait: 35, dur: 45, f: 0.38 }, { wait: 30, dur: 40, f: 0.22 }, { wait: 25, dur: 35, f: 0.11 }, { wait: 20, dur: 30, f: 0.045 }, { wait: 15, dur: 30, f: 0 }];
function bgNextStage() {
    const S = BG.zs, z = world.zone; S.i++;
    const st = BG_STAGES[S.i]; if (!st) { S.phase = 'done'; return; }
    const toR = z.startR * st.f, slack = Math.max(0, z.r - toR) * 0.85, a = Math.random() * Math.PI * 2, d = Math.random() * slack;
    let tx = z.x + Math.cos(a) * d, ty = z.y + Math.sin(a) * d;
    const m = Math.min(toR, 400); tx = Math.max(m, Math.min(MAP_W - m, tx)); ty = Math.max(m, Math.min(MAP_H - m, ty));
    Object.assign(S, { phase: 'wait', t: st.wait, wait: st.wait, dur: st.dur, fromR: z.r, toR, fromX: z.x, fromY: z.y, toX: tx, toY: ty });
    z.tx = tx; z.ty = ty; z.endR = Math.max(60, toR); // bot hướng về vùng an toàn tiếp theo
}
function bgZoneUpdate(dt) {
    const S = BG.zs, z = world.zone; if (!S || !z) return;
    world.zoneDelay = 1e9;
    if (S.phase === 'wait') { S.t -= dt; if (S.t <= 0) { S.phase = 'shrink'; S.t = 0; AudioSys.play('alarm', 0.5); AudioSys.setIntensity(Math.min(2, 1 + S.i * 0.3)); showBanner('VÒNG BO THU HẸP!', `Đợt ${S.i + 1}/${BG_STAGES.length}`, '#c084fc', 2, 44); world.zonePhase = 1; } }
    else if (S.phase === 'shrink') {
        S.t = Math.min(1, S.t + dt / S.dur); const e = S.t * S.t * (3 - 2 * S.t);
        z.r = S.fromR + (S.toR - S.fromR) * e; z.x = S.fromX + (S.toX - S.fromX) * e; z.y = S.fromY + (S.toY - S.fromY) * e;
        if (S.t >= 1) { if (S.i >= BG_STAGES.length - 2) world.meteorRate = Math.max(world.meteorRate, 0.5); bgNextStage(); }
    }
}
const _updateWorldBG = updateWorld;
updateWorld = function (dt) { if (BG.on && world.mapType === 'bg') bgZoneUpdate(dt); return _updateWorldBG(dt); };
// nhiều hòm thính hơn trên bản đồ lớn
const _spawnCrateBG = spawnCrate;
spawnCrate = function (force) { return _spawnCrateBG(force || (BG.on && crates.length < 110)); };

/* ============================== HẠ GỤC: XẾP HẠNG + PHẦN THƯỞNG ============================== */
const _killPlayerBG = killPlayer;
killPlayer = function (dead, killerId) {
    if (!BG.on || dead.dead) return _killPlayerBG(dead, killerId);
    const aliveBefore = players.filter(q => q.hp > 0 || q === dead).length;
    dead.bgPlace = aliveBefore;
    const r = _killPlayerBG(dead, killerId);
    const k = players.find(q => q.id === killerId && q !== dead);
    if (k && k.hp > 0) { k.bgKills = (k.bgKills || 0) + 1; bgReward(k); }
    const me = localPlayer();
    if (me && dead === me && gameState === 'PLAYING') showBanner(`HẠNG #${dead.bgPlace} / ${BG.N}`, `☠ ${me.bgKills || 0} hạ gục · đang theo dõi trận đấu (tạm dừng → Thoát để về menu)`, '#ff4d5e', 3, 44);
    return r;
};
function bgCardPool(p) {
    const skills = (p.build || []).filter(id => CARDS[id] && CARDS[id].kind === 'S').length;
    return Object.keys(CARDS).filter(id => { const c = CARDS[id]; return c && (c.kind === 'S' || c.kind === 'P') && !c.comboOnly && !c.evo && !c.masterOnly && !(p.build || []).includes(id) && (c.kind === 'P' || skills < 3) && id !== 'weaponMaster'; });
}
function bgReward(p, forcedId, heal = 40) {
    const skills = (p.build || []).filter(id => CARDS[id] && CARDS[id].kind === 'S').length;
    const pool = Object.keys(CARDS).filter(id => { const c = CARDS[id]; return c && (c.kind === 'S' || c.kind === 'P') && !c.comboOnly && !c.evo && !c.masterOnly && !(p.build || []).includes(id) && (c.kind === 'P' || skills < 3) && id !== 'weaponMaster'; });
    const id = forcedId !== undefined ? forcedId : pool[Math.floor(Math.random() * pool.length)];
    const hp = p.hp, x = p.x, y = p.y, a = p.angle, inv = p.inventory.map(w => w), idx = p.weaponIdx, ar = p.armor, sp = (p.spells || []).map(s => ({ ...s }));
    const skCd = {}; (p.skills || []).forEach(s => skCd[s.id] = s.cd);
    if (id) p.build.push(id);
    const brain = p.brain;
    resetPlayerForRound(p);
    p.x = x; p.y = y; p.angle = a; p.inventory = inv; p.weaponIdx = idx; p.armor = Math.max(p.armor || 0, ar || 0); p.spells = sp; p.brain = brain;
    (p.skills || []).forEach(s => { if (skCd[s.id] !== undefined) s.cd = skCd[s.id]; });
    p.hp = Math.min(p.maxHp, hp + heal); p.ghostHp = p.hp; p.spawnShield = 0;
    if (id) { floatText(p.x, p.y - 52, `🎁 ${CARDS[id].icon} ${CARDS[id].name}`, '#fde047', 14); if (p === localPlayer()) showBanner('🎁 THẺ MỚI!', `${CARDS[id].icon} ${CARDS[id].name}`, '#fde047', 1.8, 36); }
    ring(p.x, p.y, 6, 60, '#fde047', 0.4, 4);
}

/* ============================== KẾT THÚC: BẢNG XẾP HẠNG ============================== */
const _showGameOverBG = showGameOver;
showGameOver = function () {
    if (!BG.on) return _showGameOverBG();
    players.forEach(p => { if (!p.bgPlace) p.bgPlace = p.hp > 0 ? 1 : BG.N; });
    const me = localPlayer();
    const sorted = players.slice().sort((a, b) => a.bgPlace - b.bgPlace);
    let show = sorted.slice(0, 7); if (me && !show.includes(me)) show.push(me);
    const keep = players.slice(); players.length = 0; players.push(...show);
    show.forEach(p => { p.score = BG.N + 1 - p.bgPlace; p.label = `#${p.bgPlace} ${p.label.replace(/^#\d+ /, '')}`; });
    try { _showGameOverBG(); } finally { players.length = 0; players.push(...keep); }
    const w = sorted[0];
    $('go-title').textContent = me && me.bgPlace === 1 ? '🏆 BẠN CHIẾN THẮNG CHIẾN TRƯỜNG!' : `${w.label} THẮNG CHIẾN TRƯỜNG`;
    $('go-title').style.color = w.color;
    $('go-score').textContent = me ? `Bạn: hạng #${me.bgPlace}/${BG.N} · ☠ ${me.bgKills || 0} hạ gục · ${Math.round(me.stats.dmg)} sát thương` : '';
};

/* ============================== BẢNG CHIẾN THUẬT: CHỈ VÙNG QUANH BẠN ============================== */
const BG_WIN = { w: 2600, h: 1700 };
function bgWin() {
    if (!BG.on || world.mapType !== 'bg' || !picker || BG_FULL_TAC.includes(picker.kind)) return null;
    if (!picker.bgWin) {
        const me = localPlayer() || { x: MAP_W / 2, y: MAP_H / 2 };
        const w = Math.min(BG_WIN.w, MAP_W), h = Math.min(BG_WIN.h, MAP_H);
        picker.bgWin = { ox: Math.max(0, Math.min(MAP_W - w, me.x - w / 2)), oy: Math.max(0, Math.min(MAP_H - h, me.y - h / 2)), w, h };
    }
    return picker.bgWin;
}
const BG_XK = ['x', 'x1', 'x2', 'ax', 'bx', 'sx', 'tx', 'cx', 'ex', 'x0'], BG_YK = ['y', 'y1', 'y2', 'ay', 'by', 'sy', 'ty', 'cy', 'ey', 'y0'];
function bgShiftObj(o, ox, oy) { const c = { ...o }; BG_XK.forEach(k => { if (typeof c[k] === 'number') c[k] -= ox; }); BG_YK.forEach(k => { if (typeof c[k] === 'number') c[k] -= oy; }); return c; }
/** chạy fn trong "không gian cửa sổ": bản đồ tạm thu về cửa sổ quanh người chơi */
function bgInWindow(fn, shiftWorld) {
    const V = bgWin(); if (!V) return fn();
    const mw = MAP_W, mh = MAP_H;
    MAP_W = V.w; MAP_H = V.h;
    const saved = [];
    try {
        if (shiftWorld) {
            const inWin = (x, y, pad = 0) => x > -pad && y > -pad && x < V.w + pad && y < V.h + pad;
            const swap = (arr, map) => { const orig = arr.slice(); saved.push([arr, orig]); const nw = []; orig.forEach(o => { const c = map(o); if (c) nw.push(c); }); arr.length = 0; arr.push(...nw); };
            swap(obstacles, o => { const x0 = Math.max(o.x, V.ox), y0 = Math.max(o.y, V.oy), x1 = Math.min(o.x + o.w, V.ox + V.w), y1 = Math.min(o.y + o.h, V.oy + V.h); return x1 > x0 && y1 > y0 ? { ...o, x: x0 - V.ox, y: y0 - V.oy, w: x1 - x0, h: y1 - y0 } : null; });
            [bushes, zones, crates, airdrops, players, decoys, mines, turrets, items, strikes].forEach(arr => swap(arr, o => { const c = bgShiftObj(o, V.ox, V.oy); return typeof c.x !== 'number' || inWin(c.x, c.y, (c.r || 0) + 40) || arr === players || arr === strikes ? c : null; }));
            const zz = world.zone; saved.push(['zone', zz]); world.zone = bgShiftObj(zz, V.ox, V.oy);
            const pk = picker; saved.push(['picker', { pts: pk.pts, hover: pk.hover, a: pk.a }]);
            pk.pts = (pk.pts || []).map(q => bgShiftObj(q, V.ox, V.oy)); if (pk.hover && typeof pk.hover === 'object') pk.hover = bgShiftObj(pk.hover, V.ox, V.oy); if (pk.a && typeof pk.a === 'object') pk.a = bgShiftObj(pk.a, V.ox, V.oy);
        }
        return fn();
    } finally {
        MAP_W = mw; MAP_H = mh;
        for (const [arr, orig] of saved.reverse()) {
            if (arr === 'zone') world.zone = orig;
            else if (arr === 'picker') { if (picker) Object.assign(picker, orig); }
            else { arr.length = 0; arr.push(...orig); }
        }
    }
}
const _drawPickerBG = drawPicker;
drawPicker = function (me, W, H, now) {
    if (!bgWin()) return _drawPickerBG(me, W, H, now);
    const r = bgInWindow(() => _drawPickerBG(players.find(q => q.id === me.id) || me, W, H, now), true);
    // nhãn: chỉ hiện vùng quanh bạn
    const R = bgInWindow(() => pickerRect(), false);
    ctx.save(); ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(253,224,71,0.85)';
    ctx.fillText('📍 Chiến trường: bảng chỉ hiện vùng quanh bạn', R.x + R.w - 10, R.y + R.h - 10); ctx.restore();
    return r;
};
const _pickerPointBG = pickerPoint;
pickerPoint = function (cx, cy) {
    const V = bgWin(); if (!V) return _pickerPointBG(cx, cy);
    const r = bgInWindow(() => _pickerPointBG(cx, cy), false);
    return r && typeof r === 'object' ? { x: r.x + V.ox, y: r.y + V.oy } : r;
};

/* ============================== VẼ: VÙNG ĐỊA HÌNH · HUD · BẢN ĐỒ NHỎ ============================== */
const _drawNetZonesBG = drawNetZones;
drawNetZones = function (now) {
    if (BG.on && world.mapType === 'bg' && BG.regions.length) {
        const hw = SCREEN_W / 2 / camera.zoom, hh = SCREEN_H / 2 / camera.zoom, vx0 = camera.x - hw, vx1 = camera.x + hw, vy0 = camera.y - hh, vy1 = camera.y + hh;
        BG.regions.forEach(R => {
            if (R.x > vx1 || R.x + R.w < vx0 || R.y > vy1 || R.y + R.h < vy0) return;
            const B = BIOMES[R.b]; ctx.fillStyle = B.tint; ctx.fillRect(R.x, R.y, R.w, R.h);
            ctx.save(); ctx.globalAlpha = 0.07; ctx.font = `900 ${Math.round(R.w * 0.09)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
            ctx.fillText(`${B.icon} ${B.name}`, R.x + R.w / 2, R.y + R.h / 2); ctx.restore();
        });
    }
    return _drawNetZonesBG(now);
};
const _drawScoreStripBG = drawScoreStrip;
drawScoreStrip = function (W, now) {
    if (!BG.on || world.mapType !== 'bg') return _drawScoreStripBG(W, now);
    const me = localPlayer(), alive = players.filter(p => p.hp > 0).length, S = BG.zs;
    let zs = '';
    if (S) zs = S.phase === 'wait' ? `🟣 BO THU SAU ${Math.ceil(S.t)}s` : S.phase === 'shrink' ? `🟣 VÒNG BO ĐANG THU (${S.i + 1}/${BG_STAGES.length})` : '🔥 TỬ CHIẾN';
    const txt = `🌍 CÒN SỐNG ${alive}/${BG.N}   ☠ ${me ? me.bgKills || 0 : 0}   ${zs}`;
    ctx.save(); ctx.font = `800 ${isTouch ? 11 : 14}px ${FONT}`; const tw = ctx.measureText(txt).width + 30;
    rrect(ctx, W / 2 - tw / 2, 8, tw, 32, 10); ctx.fillStyle = 'rgba(6,10,24,0.8)'; ctx.fill(); ctx.strokeStyle = 'rgba(253,224,71,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f8fafc'; ctx.fillText(txt, W / 2, 25);
    const reg = me && bgRegionAt(me.x, me.y);
    if (reg) { ctx.font = `700 11px ${FONT}`; ctx.fillStyle = 'rgba(226,232,240,0.75)'; ctx.fillText(`${BIOMES[reg.b].icon} ${BIOMES[reg.b].name}`, W / 2, 50); }
    ctx.restore();
};
const _drawHUDBG = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUDBG(W, H, now);
    if (!BG.on || world.mapType !== 'bg' || !['PLAYING', 'KO', 'COUNTDOWN'].includes(gameState)) return;
    const me = localPlayer(); if (!me) return;
    // thông báo khi bước vào vùng địa hình mới
    const reg = bgRegionAt(me.x, me.y);
    if (reg && me.hp > 0 && me.bgReg !== reg) { if (me.bgReg) showBanner(`${BIOMES[reg.b].icon} ${BIOMES[reg.b].name}`, '', '#e2e8f0', 1.2, 32); me.bgReg = reg; }
    // bản đồ nhỏ của chiến trường: vùng địa hình · vòng bo hiện tại & tiếp theo · vị trí của bạn (không hiện địch)
    const S = isTouch ? Math.min(110, W * 0.13) : Math.min(170, W * 0.2), k = S / MAP_W, mh = MAP_H * k, x0 = 14, y0 = isTouch ? 78 : 100;
    ctx.save(); ctx.globalAlpha = 0.92;
    rrect(ctx, x0 - 4, y0 - 4, S + 8, mh + 8, 8); ctx.fillStyle = 'rgba(6,10,24,0.82)'; ctx.fill();
    BG.regions.forEach(R => { ctx.fillStyle = BIOMES[R.b].map; ctx.globalAlpha = 0.55; ctx.fillRect(x0 + R.x * k, y0 + R.y * k, R.w * k, R.h * k); });
    ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(56,189,248,0.8)'; zones.forEach(z => { if (z.type === 'water') { ctx.beginPath(); ctx.arc(x0 + z.x * k, y0 + z.y * k, Math.max(1, z.r * k), 0, Math.PI * 2); ctx.fill(); } });
    const z = world.zone;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, S, mh); ctx.clip();
    if (z) { ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x0 + z.x * k, y0 + z.y * k, z.r * k, 0, Math.PI * 2); ctx.stroke();
        if (BG.zs && BG.zs.phase !== 'done') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(x0 + BG.zs.toX * k, y0 + BG.zs.toY * k, Math.max(2, BG.zs.toR * k), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); } }
    ctx.restore();
    if (me.hp > 0) { ctx.fillStyle = me.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x0 + me.x * k, y0 + me.y * k, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    airdrops.forEach(d => { ctx.fillStyle = '#facc15'; ctx.fillRect(x0 + d.x * k - 2, y0 + d.y * k - 2, 4, 4); });
    ctx.restore();
};

/* ============================== MENU ============================== */
(function () {
    const after = $('sandbox-btn') || $('start-btn'); if (!after) return;
    const b = document.createElement('button'); b.className = 'menu-btn'; b.id = 'bg-btn'; b.textContent = '🌍 BATTLEGROUND · 20 NGƯỜI';
    b.style.marginTop = '8px'; b.style.width = '100%'; b.style.borderColor = 'rgba(253,224,71,0.5)';
    after.insertAdjacentElement('afterend', b); b.addEventListener('click', () => startBattleground());
})();

/* ============================== HIỆU NĂNG (bản đồ lớn, 20 người) ============================== */
// loại nhanh bằng khung bao: đoạn thẳng không chạm khung vật cản thì chắc chắn không cắt (kết quả y hệt bản gốc)
const _segRectBG = segRect;
segRect = function (x1, y1, x2, y2, o) {
    if ((x1 < x2 ? x2 : x1) < o.x || (x1 < x2 ? x1 : x2) > o.x + o.w || (y1 < y2 ? y2 : y1) < o.y || (y1 < y2 ? y1 : y2) > o.y + o.h) return -1;
    return _segRectBG(x1, y1, x2, y2, o);
};
wallsBetween = function (x1, y1, x2, y2, cap = 4) {
    const mnx = Math.min(x1, x2), mxx = Math.max(x1, x2), mny = Math.min(y1, y2), mxy = Math.max(y1, y2);
    let n = 0;
    for (const o of obstacles) { if (o.energy || o.x > mxx || o.x + o.w < mnx || o.y > mxy || o.y + o.h < mny) continue; if (_segRectBG(x1, y1, x2, y2, o) >= 0 && ++n >= cap) break; }
    return n;
};
inBush = function (x, y) { for (const b of bushes) { const dx = x - b.x, dy = y - b.y; if (dx > -b.r && dx < b.r && dy > -b.r && dy < b.r && dx * dx + dy * dy < b.r * b.r) return b; } return null; };
// chiến trường: địch ở quá xa (ngoài mọi tầm nhìn) thì không thể nhắm — bỏ qua phép tính tốn kém
const _targetableBG = targetable;
targetable = function (v, t) {
    if (BG.on && v && t && t.hp > 0 && v.x !== undefined && Math.abs(v.x - t.x) + Math.abs(v.y - t.y) > 2400 && !(t.st && t.st.reveal > 0) && !(v.id !== undefined && isSpotted(t, v.id))) return false;
    return _targetableBG(v, t);
};

/* ============================== VẼ: CÂY · ĐÁ · CHI TIẾT MẶT ĐẤT THEO VÙNG ============================== */
const _drawObstacle2BG = drawObstacle2;
drawObstacle2 = function (o, now) {
    if (o.tree) { // thân cây + tán lá
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2, R = o.w * 1.25;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx + 8, cy + 10, R, R * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5b3a1e'; ctx.beginPath(); ctx.arc(cx, cy, o.w / 2, 0, Math.PI * 2); ctx.fill();
        const s = (o.x * 7 + o.y * 3) % 10;
        [[0, 0, 1], [-0.45, -0.3, 0.7], [0.45, -0.2, 0.72], [0.1, 0.45, 0.68]].forEach(([dx, dy, k], i) => {
            const g = ctx.createRadialGradient(cx + dx * R - R * 0.2, cy + dy * R - R * 0.3, 2, cx + dx * R, cy + dy * R, R * k);
            g.addColorStop(0, i % 2 ? '#4ade80' : '#22c55e'); g.addColorStop(1, '#14532d');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + dx * R, cy + dy * R + Math.sin(now * 1.3 + s + i) * 0.8, R * k, 0, Math.PI * 2); ctx.fill();
        });
        return;
    }
    if (o.rock) { // khối đá gồ ghề
        const x = o.x, y = o.y, w = o.w, h = o.h, seed = (o.x * 13 + o.y * 7) % 1;
        ctx.fillStyle = 'rgba(0,0,0,0.38)'; rrect(ctx, x + 6, y + 10, w, h, 10); ctx.fill();
        const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#a8a29e'); g.addColorStop(0.5, '#78716c'); g.addColorStop(1, '#44403c');
        ctx.fillStyle = g; ctx.beginPath();
        const n = 9; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, j = 0.85 + 0.15 * Math.sin(i * 2.7 + seed * 9); ctx.lineTo(x + w / 2 + Math.cos(t) * w / 2 * j, y + h / 2 + Math.sin(t) * h / 2 * j); }
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w * 0.25, y + h * 0.3); ctx.lineTo(x + w * 0.5, y + h * 0.45); ctx.lineTo(x + w * 0.45, y + h * 0.7); ctx.stroke();
        if (o.hit > 0) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill(); }
        return;
    }
    return _drawObstacle2BG(o, now);
};
// chi tiết mặt đất: rải theo lưới cố định (không đổi khi di chuyển), chỉ vẽ phần đang nhìn thấy
const BG_DECO = {
    forest:   (x, y, r) => { ctx.fillStyle = r < 0.5 ? 'rgba(34,197,94,0.22)' : 'rgba(21,128,61,0.25)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x + i * 5 - 5, y, 2, 6, (i - 1) * 0.4, 0, Math.PI * 2); ctx.fill(); } },
    plains:   (x, y, r) => { ctx.strokeStyle = 'rgba(163,230,53,0.25)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = -1; i <= 1; i++) { ctx.moveTo(x + i * 4, y + 5); ctx.lineTo(x + i * 6, y - 6); } ctx.stroke(); },
    desert:   (x, y, r) => { ctx.strokeStyle = 'rgba(250,204,21,0.14)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 30, 40, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); if (r < 0.3) { ctx.fillStyle = 'rgba(254,240,138,0.18)'; ctx.fillRect(x + 10, y - 8, 3, 3); } },
    glacier:  (x, y, r) => { ctx.fillStyle = 'rgba(240,249,255,0.10)'; ctx.beginPath(); ctx.ellipse(x, y, 26 + r * 20, 12 + r * 8, r * 3, 0, Math.PI * 2); ctx.fill(); },
    volcano:  (x, y, r, now) => { ctx.strokeStyle = `rgba(249,115,22,${0.18 + Math.sin(now * 2 + r * 9) * 0.08})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 18, y - 6); ctx.lineTo(x - 4, y + 2); ctx.lineTo(x + 6, y - 4); ctx.lineTo(x + 20, y + 6); ctx.stroke(); },
    swamp:    (x, y, r) => { ctx.fillStyle = 'rgba(63,98,18,0.22)'; ctx.beginPath(); ctx.ellipse(x, y, 22 + r * 14, 10 + r * 6, r * 2, 0, Math.PI * 2); ctx.fill(); },
    canyon:   (x, y, r) => { ctx.fillStyle = 'rgba(180,83,9,0.18)'; ctx.beginPath(); ctx.arc(x, y, 3 + r * 3, 0, Math.PI * 2); ctx.arc(x + 9, y + 5, 2 + r * 2, 0, Math.PI * 2); ctx.fill(); },
    ruins:    (x, y, r) => { ctx.fillStyle = 'rgba(168,162,158,0.18)'; ctx.fillRect(x, y, 8 + r * 8, 5); ctx.fillRect(x + 12, y + 6, 5, 4); },
    city:     (x, y, r) => { ctx.fillStyle = 'rgba(226,232,240,0.07)'; if (r < 0.5) ctx.fillRect(x - 20, y - 2, 40, 4); else ctx.fillRect(x - 2, y - 20, 4, 40); },
    fortress: (x, y, r) => { ctx.strokeStyle = 'rgba(214,211,209,0.08)'; ctx.lineWidth = 1; ctx.strokeRect(x - 22, y - 14, 44, 28); }
};
const _drawNetZonesBG2 = drawNetZones;
drawNetZones = function (now) {
    if (BG.on && world.mapType === 'bg' && BG.regions.length) {
        const hw = SCREEN_W / 2 / camera.zoom + 60, hh = SCREEN_H / 2 / camera.zoom + 60, vx0 = camera.x - hw, vx1 = camera.x + hw, vy0 = camera.y - hh, vy1 = camera.y + hh, G = 90;
        ctx.save();
        for (let gx = Math.floor(vx0 / G) * G; gx < vx1; gx += G) for (let gy = Math.floor(vy0 / G) * G; gy < vy1; gy += G) {
            const h = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453, r = h - Math.floor(h); if (r > 0.62) continue;
            const x = gx + r * G, y = gy + ((r * 7.3) % 1) * G, R = bgRegionAt(x, y); if (!R) continue;
            BG_DECO[R.b](x, y, r, now);
        }
        ctx.restore();
    }
    return _drawNetZonesBG2(now);
};

/* ============================== HÒM THẺ NÂNG CẤP ============================== */
const _openCrateBG = openCrate;
openCrate = function (p, index) {
    const c = crates[index];
    if (!c || (c.type !== 'CARDBOX' && c.type !== 'CARDGOLD')) return _openCrateBG(p, index);
    crates.splice(index, 1);
    const gold = c.type === 'CARDGOLD', n = gold ? 4 : 3;
    const pool = bgCardPool(p).sort(() => Math.random() - 0.5), choices = pool.slice(0, n);
    ring(c.x, c.y, 8, 70, gold ? '#facc15' : '#a78bfa', 0.5, 5); spark(c.x, c.y, gold ? '#fde68a' : '#c4b5fd', 18, 260);
    AudioSys.playAt(gold ? 'legend' : 'pickup', c.x, c.y, 0.4);
    if (gold) { p.hp = Math.min(p.maxHp, p.hp + (40) * HEALK); p.armor = Math.min(Math.max(150, p.maxArmor || 0), (p.armor || 0) + 30); }
    if (!choices.length) return;
    if (p.isBot || p.remote) { // bot: chọn ngay (ưu tiên thẻ tạo phối hợp)
        const combo1 = choices.find(id => (COMBOS_OF[id] || []).some(cb => p.build.includes(cb.a === id ? cb.b : cb.a)));
        bgReward(p, combo1 || choices[0], gold ? 0 : 15); return;
    }
    (p.bgPending = p.bgPending || []).push({ choices, gold });
    floatText(p.x, p.y - 50, gold ? '🟨 RƯƠNG VÀNG! +1 thẻ (chọn 1/4)' : '🟪 RƯƠNG THẺ! +1 thẻ (chọn 1/3)', gold ? '#fde047' : '#c4b5fd', 15);
    bagRender();
};

/* ============================== TÚI ĐỒ ============================== */
(function bagStyle() {
    const css = `
#bg-bag{position:fixed;top:14px;right:66px;z-index:60;border:1px solid rgba(253,224,71,.5);background:rgba(15,23,42,.9);color:#fef3c7;border-radius:10px;padding:7px 11px;font:800 13px system-ui,sans-serif;cursor:pointer}
#bg-bag .badge{display:inline-block;min-width:18px;margin-left:6px;padding:1px 5px;border-radius:9px;background:#e11d48;color:#fff;font-size:11px}
#bg-bag-panel{position:fixed;top:60px;right:12px;bottom:12px;width:min(380px,calc(100vw - 24px));z-index:59;display:flex;flex-direction:column;background:rgba(10,15,28,.95);border:1px solid rgba(253,224,71,.35);border-radius:14px;color:#e2e8f0;font:13px system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5);overflow:hidden}
#bg-bag.hidden,#bg-bag-panel.hidden,#ff-btn.hidden{display:none}
#bg-bag-panel .h{padding:10px 12px;font-weight:800;color:#fde68a;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(148,163,184,.18)}
#bg-bag-panel .b{flex:1;overflow-y:auto;padding:8px 10px 14px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
#bg-bag-panel,#bg-bag-panel *{touch-action:pan-y}
#bg-bag-panel .l{font-size:11px;color:#94a3b8;letter-spacing:.06em;margin:10px 0 4px;font-weight:700}
#bg-bag-panel .it{display:flex;gap:8px;align-items:center;width:100%;border:1px solid rgba(148,163,184,.22);background:rgba(30,41,59,.6);border-radius:9px;padding:7px 8px;margin-bottom:5px;color:#e2e8f0;text-align:left;font:12px system-ui,sans-serif}
#bg-bag-panel button.it{cursor:pointer}#bg-bag-panel button.it:hover{border-color:#fde047}
#bg-bag-panel .it i{font-style:normal;font-size:19px;flex:none}
#bg-bag-panel .it small{display:block;color:#94a3b8;font-size:10.5px;margin-top:2px}
#bg-bag-panel .pick{border-color:rgba(167,139,250,.6);background:rgba(76,29,149,.35)}
#bg-bag-panel .pick.gold{border-color:rgba(250,204,21,.7);background:rgba(113,63,18,.4)}
#bg-bag-panel .x{border:1px solid rgba(148,163,184,.3);background:rgba(30,41,59,.7);color:#cbd5e1;border-radius:8px;padding:4px 9px;cursor:pointer;font:700 12px system-ui,sans-serif}
#ff-btn{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:61;border:1px solid rgba(125,211,252,.6);background:rgba(15,23,42,.9);color:#e0f2fe;border-radius:12px;padding:10px 18px;font:800 15px system-ui,sans-serif;cursor:pointer}
`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const btn = document.createElement('button'); btn.id = 'bg-bag'; btn.className = 'hidden'; document.body.appendChild(btn);
    const pan = document.createElement('div'); pan.id = 'bg-bag-panel'; pan.className = 'hidden'; document.body.appendChild(pan);
    const ff = document.createElement('button'); ff.id = 'ff-btn'; ff.className = 'hidden'; ff.textContent = '⏩ TUA ×1'; document.body.appendChild(ff);
    btn.addEventListener('click', () => { BG.bagOpen = !BG.bagOpen; bagRender(); });
    ['touchstart', 'touchmove', 'touchend', 'mousedown', 'wheel'].forEach(ev => { pan.addEventListener(ev, e => e.stopPropagation(), { passive: true }); ff.addEventListener(ev, e => e.stopPropagation(), { passive: true }); });
    pan.addEventListener('click', bagClick);
    ff.addEventListener('click', () => { FF.speed = FF.speed >= 8 ? 1 : FF.speed * 2; ff.textContent = `⏩ TUA ×${FF.speed}`; AudioSys.play('ui', 0.3); });
    window.addEventListener('keydown', e => { if (BG.on && e.code === 'KeyJ' && ['PLAYING', 'KO', 'COUNTDOWN'].includes(gameState)) { BG.bagOpen = !BG.bagOpen; bagRender(); } });
})();
function bagRender() {
    const btn = $('bg-bag'), pan = $('bg-bag-panel'), me = localPlayer();
    const show = BG.on && me && ['PLAYING', 'KO', 'COUNTDOWN'].includes(gameState) && me.hp > 0;
    btn.classList.toggle('hidden', !show); pan.classList.toggle('hidden', !show || !BG.bagOpen);
    if (!show) return;
    const pend = (me.bgPending || []).length;
    const bh = `🎒 TÚI ĐỒ (J)${pend ? `<span class="badge">${pend}</span>` : ''}`; if (btn._h !== bh) { btn._h = bh; btn.innerHTML = bh; }
    if (!BG.bagOpen) return;
    const esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    let h = `<div class="h"><span>🎒 TÚI ĐỒ</span><button class="x" data-a="close">✕</button></div><div class="b">`;
    if (pend) {
        const P = me.bgPending[0];
        h += `<div class="l">${P.gold ? '🟨 RƯƠNG VÀNG' : '🟪 RƯƠNG THẺ'} · CHỌN 1 THẺ NÂNG CẤP${pend > 1 ? ` (còn ${pend - 1} rương nữa)` : ''}</div>`;
        P.choices.forEach(id => { const c = CARDS[id]; const cb = (COMBOS_OF[id] || []).filter(x => me.build.includes(x.a === id ? x.b : x.a)).map(x => x.name);
            h += `<button class="it pick ${P.gold ? 'gold' : ''}" data-a="pick" data-v="${id}"><i>${c.icon || '🃏'}</i><span><b>${esc2(c.name)}</b> <small>${c.kind === 'S' ? '⚡ Kỹ năng' : '🛡 Nội tại'} · ${esc2(strip(c.desc)).slice(0, 170)}</small>${cb.length ? `<small style="color:#fde047">⚡ Mở phối hợp: ${esc2(cb.join(', '))}</small>` : ''}</span></button>`; });
        h += `<button class="it" data-a="skip"><i>❤️</i><span><b>Bỏ qua</b> <small>Đổi lấy +35 máu</small></span></button>`;
    }
    h += `<div class="l">VŨ KHÍ</div>`;
    me.inventory.forEach((w, i) => { const am = w.magSize ? `${w.mag}/${w.reserve}` : w.durability !== undefined ? `độ bền ${Math.ceil(w.durability)}/${w.maxDurability}` : ''; h += `<button class="it" data-a="slot" data-v="${i}"><i>${w.icon || '✊'}</i><span><b>${i === me.weaponIdx ? '▶ ' : ''}${esc2(w.name)}</b> <small>${am}${i !== me.weaponIdx ? ' · chạm để cầm' : ' · đang cầm'}</small></span></button>`; });
    if ((me.items || []).length) { h += `<div class="l">VẬT PHẨM</div>`; me.items.forEach((it, i) => { const I = ITEMS[it.id]; if (I) h += `<button class="it" data-a="item" data-v="${i}"><i>${I.icon}</i><span><b>${esc2(I.name)}</b> <small>chạm để dùng · còn ${it.uses}</small></span></button>`; }); }
    if ((me.spells || []).length) { h += `<div class="l">PHÉP BỔ TRỢ</div>`; me.spells.forEach(s => { const S = SPELLS[s.id]; if (S) h += `<div class="it"><i>${S.icon}</i><span><b>${esc2(S.name)}</b> <small>${s.cd > 0 ? `hồi ${Math.ceil(s.cd)}s` : 'sẵn sàng'}</small></span></div>`; }); }
    h += `<div class="l">BỘ THẺ (${me.build.length})</div>`;
    me.build.forEach(id => { const c = CARDS[id]; if (c) h += `<div class="it"><i>${c.icon || '🃏'}</i><span><b>${esc2(c.name)}</b> <small>${c.kind === 'S' ? '⚡ Kỹ năng' : '🛡 Nội tại'} · ${esc2(strip(c.desc)).slice(0, 120)}</small></span></div>`; });
    const cs = (me.combos || []).map(id => COMBOS.find(x => x.id === id)).filter(Boolean);
    if (cs.length) { h += `<div class="l">PHỐI HỢP ĐANG CÓ</div>`; cs.forEach(c => { h += `<div class="it"><i>⚡</i><span><b style="color:#fde047">${esc2(c.name)}</b> <small>${esc2(strip(c.desc)).slice(0, 120)}</small></span></div>`; }); }
    h += `<div class="l" style="margin-top:12px">Mở hòm 🟪 / 🟨 trên bản đồ để nhận thẻ. Trận không dừng khi mở túi — cẩn thận!</div></div>`;
    if (pan._h !== h) { pan._h = h; pan.innerHTML = h; }
}
function bagClick(e) {
    const t = e.target.closest('[data-a]'); if (!t) return;
    const me = localPlayer(); if (!me || me.hp <= 0) return;
    const a = t.dataset.a, v = t.dataset.v;
    AudioSys.play('ui', 0.3);
    if (a === 'close') { BG.bagOpen = false; }
    else if (a === 'pick') { const P = (me.bgPending || []).shift(); if (P && P.choices.includes(v)) bgReward(me, v, 0); }
    else if (a === 'skip') { (me.bgPending || []).shift(); me.hp = Math.min(me.maxHp, me.hp + (35) * HEALK); floatText(me.x, me.y - 40, '+' + 35 * HEALK, '#4ade80', 15); }
    else if (a === 'slot') { const i = +v; if (i !== me.weaponIdx && me.inventory[i]) { me.weaponIdx = i; me.charge = 0; const w = getCurrentWeapon(me); floatText(me.x, me.y - 26, `${w.icon} ${w.name}`, '#fff', 13); } }
    else if (a === 'item') { if (typeof useItem === 'function') useItem(me, +v); }
    bagRender();
}
let bagTick = 0;

/* ============================== TUA NHANH KHI ĐANG XEM ============================== */
const FF = { speed: 1 };
const _updateFF = update;
update = function (rawDt) {
    const me = localPlayer();
    const watching = me && me.hp <= 0 && ['PLAYING', 'KO'].includes(gameState) && settings.mode !== 'online' && !paused;
    const ffb = $('ff-btn');
    if (ffb) ffb.classList.toggle('hidden', !watching);
    if (!watching && FF.speed !== 1) { FF.speed = 1; if (ffb) ffb.textContent = '⏩ TUA ×1'; }
    let r;
    const n = watching ? FF.speed : 1;
    for (let i = 0; i < n; i++) r = _updateFF(rawDt);
    // túi đồ: cập nhật nút / bảng định kỳ
    bagTick -= rawDt; if (bagTick <= 0) { bagTick = 0.5; if (BG.on || !$('bg-bag').classList.contains('hidden')) bagRender(); }
    return r;
};
const _goMenuBag = goMenu;
goMenu = function () { BG.bagOpen = false; const r = _goMenuBag(); bagRender(); const f = $('ff-btn'); if (f) f.classList.add('hidden'); return r; };

/* ============================== VẼ HÒM THẺ ============================== */
const _drawW2FxBag = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxBag(now);
    if (!BG.on) return;
    crates.forEach(c => {
        if (c.type !== 'CARDBOX' && c.type !== 'CARDGOLD') return;
        const gold = c.type === 'CARDGOLD', s = c.size, bob = Math.sin(now * 3 + c.blinkOffset) * 2;
        ctx.save(); ctx.translate(c.x, c.y + bob);
        ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.6); g.addColorStop(0, gold ? 'rgba(250,204,21,0.45)' : 'rgba(167,139,250,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        const gr = ctx.createLinearGradient(0, -s / 2, 0, s / 2); gr.addColorStop(0, gold ? '#fde047' : '#a78bfa'); gr.addColorStop(1, gold ? '#a16207' : '#4c1d95');
        rrect(ctx, -s / 2, -s / 2, s, s, 6); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-s / 2 + 3, -2, s - 6, 4);
        ctx.font = `${Math.round(s * 0.55)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🃏', 0, 1);
        ctx.restore();
    });
};

/* ============================== BUFF PHÉP TIẾP TẾ KHẨN ============================== */
// thêm 1 hộp hỗ trợ + 1 vũ khí tốt rơi xuống đất; 20% là đồ HUYỀN THOẠI (chỉ có trong thính)
if (SPELLS.supplyDrop) {
    const m = SPELLS.supplyDrop, f = m.cast;
    m.desc = 'Sau 1.5 giây: 2 hộp hỗ trợ + 1 VŨ KHÍ TỐT rơi quanh bạn (20% là đồ HUYỀN THOẠI), bạn nhận ngay +30 giáp và nạp đầy băng đạn.';
    m.cast = p => {
        f(p);
        const a = p.angle, spot = o => { for (let k = 0; k < 8; k++) { const t = a + o + k * 0.5, x = p.x + Math.cos(t) * 75, y = p.y + Math.sin(t) * 75; if (!pointInObstacle(x, y, 20) && x > 40 && y > 40 && x < MAP_W - 40 && y < MAP_H - 40) return { x, y }; } return { x: p.x, y: p.y }; };
        const s1 = spot(1.3), s2 = spot(-1.3);
        const legend = Math.random() < 0.2;
        [s1, s2].forEach((s, i) => zones.push({ type: 'artyWarn', x: s.x, y: s.y, r: 30, t: 1.5, maxT: 1.5, owner: p.id, tick: 0 }));
        p.shotQueue.push({ t: 1.5, fn: () => {
            crates.push(makeCrate(s1.x, s1.y, 'SUPPORT')); ring(s1.x, s1.y, 6, 50, '#93c5fd', 0.4, 4);
            const pool = legend && typeof LEGEND_POOL !== 'undefined' && LEGEND_POOL.length ? LEGEND_POOL
                : Object.keys(BASE_WEIGHTS).filter(id => WEAPONS[id] && (WEAPONS[id].tier || 1) >= 2 && WEAPONS[id].type !== 'THROWABLE' && !(typeof LEGEND_POOL !== 'undefined' && LEGEND_POOL.includes(id)));
            const id = pool[Math.floor(Math.random() * pool.length)];
            if (id && WEAPONS[id]) {
                const w = makeWeapon(id, p); if (legend) w.legendary = true;
                dropGroundWeapon(p, w, s2.x, s2.y, 40);
                ring(s2.x, s2.y, 8, legend ? 110 : 60, legend ? '#facc15' : '#e2e8f0', 0.5, legend ? 7 : 4); spark(s2.x, s2.y, legend ? '#fde047' : '#e2e8f0', legend ? 30 : 10, 300);
                floatText(s2.x, s2.y - 30, `${legend ? '🌟 HUYỀN THOẠI: ' : '📦 '}${WEAPONS[id].icon} ${WEAPONS[id].name}`, legend ? '#fde047' : '#e2e8f0', legend ? 17 : 13);
                if (legend) { AudioSys.playAt('legend', s2.x, s2.y, 0.5); if (p === localPlayer()) showBanner('🌟 TIẾP TẾ HUYỀN THOẠI!', `${WEAPONS[id].icon} ${WEAPONS[id].name}`, '#fde047', 2, 40); }
            }
        } });
    };
}
