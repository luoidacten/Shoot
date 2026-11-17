/** ==================== THẾ GIỚI: bản đồ, vật cản, hòm thính, vòng bo ==================== */
const players = [], bullets = [], items = [], crates = [], obstacles = [], meteors = [], slashes = [], beams = [], airdrops = [];

const world = {
    time: 0, meteorRate: 0.04, darkness: false, ice: false, infiniteAmmo: false,
    zoneDelay: 18, zoneSpeed: 1, zone: null, zonePhase: 0, airdropTimer: 10, crateTimer: 0, theme: 0
};

const THEMES = [
    { floor: '#0a0d1c', grid: 'rgba(120,140,220,0.07)', accent: '#3b4a7a' },
    { floor: '#120a14', grid: 'rgba(220,120,180,0.06)', accent: '#6b2f5a' },
    { floor: '#071310', grid: 'rgba(100,220,170,0.06)', accent: '#1f5a48' },
    { floor: '#13100a', grid: 'rgba(230,180,90,0.06)', accent: '#6a4a1c' }
];

function resetWorld() {
    world.time = 0; world.meteorRate = 0.04; world.darkness = false; world.ice = false; world.infiniteAmmo = false;
    world.zoneDelay = 18; world.zoneSpeed = 1; world.zonePhase = 0; world.airdropTimer = 9; world.crateTimer = 0;
    world.theme = Math.floor(Math.random() * THEMES.length);
    const startR = Math.hypot(MAP_W, MAP_H) / 2 + 50;
    const tx = MAP_W / 2 + (Math.random() - 0.5) * 500, ty = MAP_H / 2 + (Math.random() - 0.5) * 360;
    world.zone = { x: MAP_W / 2, y: MAP_H / 2, r: startR, sx: MAP_W / 2, sy: MAP_H / 2, startR, tx, ty, endR: 170, t: 0 };
    [bullets, items, crates, obstacles, meteors, slashes, beams, airdrops, particles, texts, rings, zones, turrets, mines, decoys].forEach(a => a.length = 0);
    clearDecals();
}

const MAP_NAMES = { arena: 'ĐẤU TRƯỜNG', maze: 'MÊ CUNG', inferno: 'HỎA NGỤC' };
function pickMapType() {
    if (currentRound === 1) return 'arena';
    const r = Math.random();
    return r < 0.34 ? 'arena' : r < 0.67 ? 'maze' : 'inferno';
}

/** Sinh bản đồ đối xứng tâm → công bằng cho cả 2 bên */
function generateMap(type = 'arena') {
    world.mapType = type;
    if (type === 'maze') { world.theme = 2; return generateMaze(); }
    if (type === 'inferno') world.theme = 3;
    const cx = MAP_W / 2, cy = MAP_H / 2;
    const spawns = [{ x: cx - 340, y: cy }, { x: cx + 340, y: cy }];
    const tooClose = (o) => spawns.some(s => s.x > o.x - 110 && s.x < o.x + o.w + 110 && s.y > o.y - 110 && s.y < o.y + o.h + 110)
        || obstacles.some(b => o.x < b.x + b.w + 50 && o.x + o.w > b.x - 50 && o.y < b.y + b.h + 50 && o.y + o.h > b.y - 50);
    const add = (o) => {
        const m = { ...o, x: MAP_W - o.x - o.w, y: MAP_H - o.y - o.h };
        obstacles.push(o); obstacles.push(m);
    };
    // Trụ trung tâm
    const pillar = Math.random() < 0.5;
    if (pillar) obstacles.push({ x: cx - 45, y: cy - 45, w: 90, h: 90, wood: false });
    let tries = 0, placed = 0;
    const want = type === 'inferno' ? 9 : 15;
    while (placed < want && tries++ < 400) {
        const wood = Math.random() < 0.38;
        let w, h;
        if (wood) { w = h = 46 + Math.random() * 26; }
        else if (Math.random() < 0.5) { w = 140 + Math.random() * 160; h = 30 + Math.random() * 14; }
        else { w = 30 + Math.random() * 14; h = 140 + Math.random() * 160; }
        const o = { x: 80 + Math.random() * (MAP_W / 2 - 120 - w), y: 80 + Math.random() * (MAP_H - 160 - h), w, h, wood };
        if (tooClose(o)) continue;
        if (wood) { o.hp = o.maxHp = 90; o.hit = 0; }
        add(o); placed++;
    }
    if (type === 'inferno') {
        // Hồ dung nham: cháy 4.5 giây, nghỉ 3.5 giây, nháy cảnh báo trước khi bùng
        let n = 0, t2 = 0;
        while (n < 4 && t2++ < 200) {
            const r = 80 + Math.random() * 60;
            const x = 160 + Math.random() * (MAP_W / 2 - 260), y = 160 + Math.random() * (MAP_H - 320);
            if (spawns.some(s => dist(s.x, s.y, x, y) < r + 90)) continue;
            if (obstacles.some(o => x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h)) continue;
            if (zones.some(z => dist(z.x, z.y, x, y) < z.r + r + 60)) continue;
            const phase = Math.random() * 8;
            zones.push({ type: 'lava', x, y, r, phase, t: Infinity, maxT: Infinity, tick: 0 });
            zones.push({ type: 'lava', x: MAP_W - x, y: MAP_H - y, r, phase: (phase + 4) % 8, t: Infinity, maxT: Infinity, tick: 0 });
            n++;
        }
        zones.push({ type: 'lava', x: cx, y: cy - 260, r: 70, phase: 2, t: Infinity, maxT: Infinity, tick: 0 });
        zones.push({ type: 'lava', x: cx, y: cy + 260, r: 70, phase: 6, t: Infinity, maxT: Infinity, tick: 0 });
    }
}

/** Mê cung: lưới tường dày đặc, chừa khe ở các góc để luôn đi xuyên được */
function generateMaze() {
    const cx = MAP_W / 2, cy = MAP_H / 2, C = 200, T = 22, gap = 34;
    const spawns = [{ x: cx - 340, y: cy }, { x: cx + 340, y: cy }];
    const nearSpawn = o => spawns.some(s => s.x > o.x - 70 && s.x < o.x + o.w + 70 && s.y > o.y - 70 && s.y < o.y + o.h + 70);
    const add = o => { if (nearSpawn(o)) return; obstacles.push(o); obstacles.push({ ...o, x: MAP_W - o.x - o.w, y: MAP_H - o.y - o.h }); };
    const cols = Math.floor(MAP_W / C), rows = Math.floor(MAP_H / C);
    for (let i = 0; i < cols / 2; i++) {
        for (let j = 0; j < rows; j++) {
            const x0 = i * C, y0 = j * C;
            // tường đứng ở cạnh phải ô
            if (i < cols / 2 - 1 && Math.random() < 0.42) add({ x: x0 + C - T / 2, y: y0 + gap, w: T, h: C - gap * 2, wood: false });
            // tường ngang ở cạnh dưới ô
            if (j < rows - 1 && Math.random() < 0.42) add({ x: x0 + gap, y: y0 + C - T / 2, w: C - gap * 2, h: T, wood: false });
            // thùng gỗ rải rác giữa ô
            if (Math.random() < 0.12) { const o = { x: x0 + C / 2 - 26, y: y0 + C / 2 - 26, w: 52, h: 52, wood: true, hp: 90, maxHp: 90, hit: 0 }; add(o); }
        }
    }
}

function pointInObstacle(x, y, pad = 0) {
    for (const o of obstacles) if (x > o.x - pad && x < o.x + o.w + pad && y > o.y - pad && y < o.y + o.h + pad) return o;
    return null;
}
function insideZone(x, y, pad = 0) { return dist(x, y, world.zone.x, world.zone.y) < world.zone.r - pad; }

/** Đẩy hình tròn ra khỏi các khối chữ nhật */
function resolveCircle(ent, r) {
    for (const o of obstacles) {
        const nx = Math.max(o.x, Math.min(ent.x, o.x + o.w)), ny = Math.max(o.y, Math.min(ent.y, o.y + o.h));
        const dx = ent.x - nx, dy = ent.y - ny, d = Math.hypot(dx, dy);
        if (d < r) {
            if (d > 0.0001) { ent.x = nx + dx / d * r; ent.y = ny + dy / d * r; }
            else { // tâm nằm trong khối → đẩy ra cạnh gần nhất
                const l = ent.x - o.x, rr = o.x + o.w - ent.x, t = ent.y - o.y, b = o.y + o.h - ent.y, m = Math.min(l, rr, t, b);
                if (m === l) ent.x = o.x - r; else if (m === rr) ent.x = o.x + o.w + r; else if (m === t) ent.y = o.y - r; else ent.y = o.y + o.h + r;
            }
        }
    }
    ent.x = Math.max(r, Math.min(MAP_W - r, ent.x)); ent.y = Math.max(r, Math.min(MAP_H - r, ent.y));
}

/** Giao đoạn thẳng – hình chữ nhật (slab). Trả về t ∈ [0,1] hoặc -1 */
function segRect(x1, y1, x2, y2, o) {
    let t0 = 0, t1 = 1; const dx = x2 - x1, dy = y2 - y1;
    const clip = (p, q) => { if (p === 0) return q >= 0; const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } return true; };
    if (clip(-dx, x1 - o.x) && clip(dx, o.x + o.w - x1) && clip(-dy, y1 - o.y) && clip(dy, o.y + o.h - y1)) return t0;
    return -1;
}
function lineOfSight(x1, y1, x2, y2) { return !obstacles.some(o => segRect(x1, y1, x2, y2, o) >= 0); }

function damageObstacle(o, dmg) {
    if (!o.wood) return false;
    o.hp -= dmg; o.hit = 0.12;
    if (o.hp <= 0) {
        const i = obstacles.indexOf(o); if (i >= 0) obstacles.splice(i, 1);
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
        spark(cx, cy, '#a06c3c', 22, 320, 0.7, 4, false); smoke(cx, cy, 6);
        addDecal(cx, cy, o.w * 0.4, '#2b1b0e', 0.5, 5);
        AudioSys.play('hit', 0.4); addShake(4);
        if (Math.random() < 0.35) crates.push(makeCrate(cx, cy));
        return true;
    }
    return false;
}

function makeCrate(x, y, type) {
    if (!type) { const r = Math.random(); type = r > 0.87 ? 'TRAP' : r > 0.6 ? 'SUPPORT' : 'WEAPON'; }
    return { x, y, size: type === 'LEGEND' ? 34 : 28, blinkOffset: Math.random() * 10, type, born: world.time };
}

function spawnCrate(force) {
    if (!force && crates.length > 20) return;
    const z = world.zone;
    for (let k = 0; k < 14; k++) {
        const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * Math.max(80, z.r - 60);
        const x = z.x + Math.cos(a) * rr, y = z.y + Math.sin(a) * rr;
        if (x < 50 || y < 50 || x > MAP_W - 50 || y > MAP_H - 50) continue;
        if (pointInObstacle(x, y, 28)) continue;
        if (players.some(p => dist(p.x, p.y, x, y) < 90)) continue;
        crates.push(makeCrate(x, y)); return;
    }
}

function updateWorld(dt) {
    world.time += dt;
    const z = world.zone;
    // ---- Vòng bo ----
    if (world.time > world.zoneDelay) {
        const dur = 42 / world.zoneSpeed;
        z.t = Math.min(1, z.t + dt / dur);
        const e = z.t * z.t * (3 - 2 * z.t);
        z.r = z.startR + (z.endR - z.startR) * e;
        z.x = z.sx + (z.tx - z.sx) * e; z.y = z.sy + (z.ty - z.sy) * e;
        if (world.zonePhase === 0) {
            world.zonePhase = 1; AudioSys.play('alarm', 0.5); AudioSys.setIntensity(1);
            showBanner('VÒNG BO THU HẸP!', 'Ở ngoài vòng tím sẽ mất máu', '#c084fc', 2.2, 46);
        }
        if (z.t >= 1 && world.zonePhase === 1) {
            world.zonePhase = 2; AudioSys.play('alarm', 0.6); AudioSys.setIntensity(2);
            world.meteorRate = Math.max(world.meteorRate, 0.9);
            showBanner('TỬ CHIẾN!', 'Vòng bo đóng dần · Sao băng trút xuống', '#ff4d5e', 2.2, 60);
        }
        if (world.zonePhase === 2) z.r = Math.max(0, z.r - dt * 6);
    }

    // ---- Hòm thính thường ----
    world.crateTimer -= dt;
    if (world.crateTimer <= 0) { spawnCrate(); world.crateTimer = 0.9 + Math.random() * 0.8; }

    // ---- Thính vàng ----
    world.airdropTimer -= dt;
    if (world.airdropTimer <= 0) {
        world.airdropTimer = 17 + Math.random() * 6;
        for (let k = 0; k < 20; k++) {
            const a = Math.random() * Math.PI * 2, rr = Math.random() * Math.max(60, z.r * 0.6);
            const x = z.x + Math.cos(a) * rr, y = z.y + Math.sin(a) * rr;
            if (x < 80 || y < 80 || x > MAP_W - 80 || y > MAP_H - 80 || pointInObstacle(x, y, 40)) continue;
            airdrops.push({ x, y, t: 3.2, maxT: 3.2 });
            showBanner('📦 THÍNH VÀNG!', 'Vũ khí huyền thoại đang rơi — tranh ngay!', '#ffd23f', 2, 44);
            AudioSys.play('legend', 0.4);
            break;
        }
    }
    for (let i = airdrops.length - 1; i >= 0; i--) {
        const d = airdrops[i]; d.t -= dt;
        if (d.t <= 0) {
            airdrops.splice(i, 1);
            crates.push(makeCrate(d.x, d.y, 'LEGEND'));
            ring(d.x, d.y, 10, 120, '#ffd23f', 0.5, 6); spark(d.x, d.y, '#ffd23f', 30, 400, 0.6, 3);
            smoke(d.x, d.y, 10, 'rgba(255,220,120,0.25)', 22);
            addShake(8); AudioSys.play('slam', 0.4);
            players.forEach(p => { if (dist(p.x, p.y, d.x, d.y) < 40) dealDamage(p, 50, -1, { angle: Math.atan2(p.y - d.y, p.x - d.x) }); });
        }
    }

    // ---- Sao băng ----
    if (Math.random() < world.meteorRate * dt) {
        const near = Math.random() < 0.5 && players.length ? players[Math.floor(Math.random() * players.length)] : null;
        const x = near ? near.x + (Math.random() - 0.5) * 300 : Math.random() * MAP_W;
        const y = near ? near.y + (Math.random() - 0.5) * 300 : Math.random() * MAP_H;
        meteors.push({ x, y, warningTime: 1.8, maxT: 1.8 });
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]; m.warningTime -= dt;
        if (m.warningTime <= 0) { explode(m.x, m.y, -1, 70, 120); meteors.splice(i, 1); }
    }

    // ---- Hiệu ứng khối gỗ bị bắn ----
    obstacles.forEach(o => { if (o.hit > 0) o.hit -= dt; });
}
