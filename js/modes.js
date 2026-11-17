/** ==================== ĐỒNG ĐỘI · 8 NGƯỜI · BIẾN CỐ PHÒNG · TẦM NHÌN · HUD/NÚT MỚI ==================== */
PCOLORS.push('#c084fc', '#fb923c', '#2dd4bf', '#f472b6');
PNAMES.push('TÍM', 'CAM', 'NGỌC', 'HỒNG');
const TEAM_COLORS = ['#ff4d5e', '#3ba8ff', '#4ade80', '#fbbf24'];

/* ============================== ĐỒNG ĐỘI ============================== */
function teamCount() { return Math.max(2, Math.ceil(players.length / 2)); }
/** Luật ĐỒNG ĐỘI (theo hiệp): người thứ 1,2,3,4 ở các đội khác nhau, bot xếp vào cho đủ cặp */
function teamOf(p) { return world.team ? (Math.max(0, players.indexOf(p)) % teamCount()) + 1 : p.id; }
function sameTeam(a, b) { return !!(a && b && a !== b && world.team && teamOf(a) === teamOf(b)); }
function sameTeamId(id1, id2) { if (!world.team || id1 === id2) return false; const a = players.find(q => q.id === id1), b = players.find(q => q.id === id2); return sameTeam(a, b); }
function enemiesOf(p) { return players.filter(e => e.id !== p.id && e.hp > 0 && e.x !== undefined && !sameTeam(p, e)); }
function aliveSides() { return new Set(players.filter(p => p.hp > 0).map(teamOf)).size; }
function finishRound() {
    const alive = players.filter(p => p.hp > 0);
    const sides = [...new Set(alive.map(teamOf))];
    let text, sub = '', color = '#fff';
    if (sides.length === 1 && alive.length) {
        const winners = players.filter(p => teamOf(p) === sides[0]), w = alive[0];
        winners.forEach(p => p.score++);
        text = world.team ? `ĐỘI ${sides[0]} THẮNG HIỆP!` : `${w.label} THẮNG HIỆP!`; color = w.color;
        if (alive.some(p => p.mech)) { winners.forEach(p => p.score++); sub = '🤖 Thắng khi lái ROBOT: +2 điểm!'; }
        else if (w.hp <= w.maxHp * 0.15) sub = `Thoát chết trong gang tấc với ${Math.ceil(w.hp)} HP!`;
    } else { text = 'HÒA!'; sub = 'Không ai trụ lại…'; }
    showBanner(text, sub, color, 2.2, 54);
    gameState = 'ROUND_OVER'; roundEndingTimer = 2.4;
    camera.focus = null;
}
const _killPlayer = killPlayer;
killPlayer = function (dead, killerId) {
    if (dead.dead) return;
    if (dead.mech) {
        const others = players.filter(p => p.hp > 0 && p !== dead);
        others.forEach(p => p.score++);
        showBanner('ROBOT BỊ HẠ!', 'Mọi người còn sống +1 điểm', '#fde047', 1.8, 40);
    }
    _killPlayer(dead, killerId);
};

/* ============================== BIẾN CỐ PHÒNG (vận mệnh mới) ============================== */
DESTINIES.push(
    { name: 'TRỜI SÁNG', desc: 'Nắng chói chang: hiệp này không có sương mù, ai cũng thấy hết!', apply: () => { world.bright = true; } },
    { name: 'ĐỒNG ĐỘI', desc: 'Hiệp này chia cặp 2 người 1 đội (người chơi khác đội, bot chia đều). Đội còn sống cuối cùng cùng ăn điểm!', apply: () => { world.team = true; } },
    { name: 'THÊM NGƯỜI THÊM VUI', desc: 'Thêm 4 bot vào hiệp này, bản đồ rộng hơn. Càng đông càng loạn!', more: true, apply: () => {} },
    { name: 'ĐẤU TRƯỜNG MỞ RỘNG', desc: 'Bản đồ hiệp này rộng hơn hẳn.', wide: true, apply: () => {} },
    { name: 'ZOMBIE TRÀN', desc: 'Zombie xuất hiện ngày càng nhiều và tấn công tất cả!', apply: () => { world.event = 'zombie'; world.zombieT = 4; world.zombieGap = 3; } },
    { name: 'PHÒNG PING 999+', desc: 'Mạng lag kinh hoàng: mọi thao tác trễ 0.35 giây!', apply: () => { world.event = 'ping'; } },
    { name: 'THỜI GIAN BẤT ỔN', desc: 'Thời gian lúc nhanh lúc chậm, không báo trước!', apply: () => { world.event = 'chaos'; world.timeScale = 1; world.chaosT = 3; } },
    { name: 'KHÍ ĐỘC', desc: 'Không khí nhiễm độc: máu ai cũng tụt dần.', apply: () => { world.event = 'poison'; } },
    { name: 'GIẢ LẬP ROBOT', desc: 'Một con robot ở giữa map. Lái nó và thắng: +2 điểm. Robot bị hạ: mọi người còn sống +1.', apply: () => { world.event = 'robot'; world.robot = { x: world.zone.x, y: world.zone.y }; } },
    { name: 'PHÒNG GƯƠNG', desc: 'Ảo giác! Mỗi người có 2 bản sao gương. Đâu mới là thật?', apply: () => { world.event = 'mirror'; } }
);
const _initRound = initRound;
initRound = function () {
    world.event = null; world.robot = null; world.timeScale = 1; world.team = false; world.bright = false;
    removeTempBots();
    const d = currentDestiny || {};
    if (d.more) { for (let k = 0; k < 4; k++) { let id = 1; while (players.some(q => q.id === id)) id++; const b = createPlayer(id, 'bot'); b.temp = true; b.label = 'BOT+' + id; b.build = randomBuild(); players.push(b); } }
    const big = players.length > 4 || d.wide;
    setMapSize(big ? 3200 : 2400, big ? 2400 : 1800);
    _initRound();
};
function removeTempBots() { for (let i = players.length - 1; i >= 0; i--) if (players[i].temp) players.splice(i, 1); }
function randomBuild() { const ids = Object.keys(CARDS); const out = []; while (out.length < Math.min(3, pickCount)) { const id = ids[Math.floor(Math.random() * ids.length)]; if (!out.includes(id) && !(CARDS[id].kind === 'S' && out.filter(x => CARDS[x].kind === 'S').length >= 2)) out.push(id); } return out; }
const _openAug = openAugmentScreen;
openAugmentScreen = function () { removeTempBots(); world.team = false; return _openAug(); };
const _showGameOver = showGameOver;
showGameOver = function () { removeTempBots(); return _showGameOver(); };
function setMapSize(w, h) {
    if (MAP_W === w && MAP_H === h) return;
    MAP_W = w; MAP_H = h;
    decalCanvas.width = Math.round(MAP_W * DECAL_SCALE); decalCanvas.height = Math.round(MAP_H * DECAL_SCALE);
}
function updateModes(dt) {
    const ev = world.event;
    if (gameState !== 'PLAYING') return;
    if (ev === 'zombie') {
        world.zombieT -= dt;
        const n = decoys.filter(d => d.kind === 'zombie').length;
        if (world.zombieT <= 0 && n < 30) {
            world.zombieGap = Math.max(0.6, world.zombieGap * 0.93); world.zombieT = world.zombieGap;
            const z = world.zone, a = Math.random() * Math.PI * 2, r = Math.min(z.r, 900) * (0.6 + Math.random() * 0.35);
            const x = z.x + Math.cos(a) * r, y = z.y + Math.sin(a) * r;
            if (!pointInObstacle(x, y, 16)) { decoys.push({ x, y, angle: 0, speed: 95 + Math.random() * 45 + world.time, owner: -1, t: 999, hp: 45, color: '#65a30d', radius: 14, label: 'ZOMBIE', kind: 'zombie' }); smoke(x, y, 5, 'rgba(101,163,13,0.4)', 14); }
        }
        decoys.forEach(d => {
            if (d.kind !== 'zombie') return;
            const t = players.filter(p => p.hp > 0).sort((a, b) => dist(a.x, a.y, d.x, d.y) - dist(b.x, b.y, d.x, d.y))[0]; if (!t) return;
            d.angle = Math.atan2(t.y - d.y, t.x - d.x); d.speed = Math.min(d.speed, 190);
            d.bite = (d.bite || 0) - dt;
            if (dist(t.x, t.y, d.x, d.y) < t.radius + d.radius + 4 && d.bite <= 0 && !(t.air > 0)) { d.bite = 0.8; dealDamage(t, 9, -1, { raw: true, angle: d.angle, knock: 160 }); floatText(t.x, t.y - 30, 'BỊ CẮN!', '#84cc16', 13); }
        });
    } else if (ev === 'chaos') {
        world.chaosT -= dt;
        if (world.chaosT <= 0) { world.chaosT = 2.5 + Math.random() * 3; world.timeScale = [0.55, 0.7, 1, 1.35, 1.7][Math.floor(Math.random() * 5)]; showBanner(world.timeScale > 1 ? 'TĂNG TỐC!' : world.timeScale < 1 ? 'CHẬM LẠI…' : 'BÌNH THƯỜNG', `x${world.timeScale}`, '#c084fc', 0.9, 34); }
    } else if (ev === 'poison') {
        world.poisonT = (world.poisonT || 0) + dt;
        if (world.poisonT > 0.5) { world.poisonT = 0; players.forEach(p => { if (p.hp > 1) dealDamage(p, 1.2, -1, { zone: true, raw: !p.gasMask }); }); }
    } else if (ev === 'robot' && world.robot) {
        const r = world.robot, p = players.find(q => q.hp > 0 && dist(q.x, q.y, r.x, r.y) < q.radius + 30);
        if (p) {
            world.robot = null; p.mech = true;
            p.maxHp += 200; p.hp += 200; p.radius += 8; p.dmgMult *= 1.4; p.moveMult *= 0.8;
            showBanner(`${p.label} LÁI ROBOT!`, 'Hạ nó: mọi người còn sống +1 điểm', p.color, 1.8, 40);
            ring(p.x, p.y, 10, 120, '#fde047', 0.6, 8); AudioSys.play('legend', 0.35);
        }
    } else if (ev === 'mirror') {
        players.forEach(p => {
            if (p.hp <= 0) return;
            const spots = [[MAP_W - p.x, p.y, Math.PI - p.angle], [p.x, MAP_H - p.y, -p.angle]];
            p.mirrors = p.mirrors || [];
            spots.forEach(([x, y, a], i) => {
                let m = p.mirrors[i];
                if (!m || !decoys.includes(m)) {
                    if (m && (p.mirrorCd = p.mirrorCd || [])[i] === undefined) p.mirrorCd[i] = world.time + 4;
                    if (m && world.time < p.mirrorCd[i]) return;
                    m = { x, y, angle: a, speed: 0, owner: p.id, t: 999, hp: 30, color: p.color, radius: p.radius, label: p.label, kind: 'mirror' };
                    decoys.push(m); p.mirrors[i] = m; if (p.mirrorCd) p.mirrorCd[i] = undefined;
                }
                m.x = x; m.y = y; m.angle = a;
            });
        });
    }
    if (world.event !== 'mirror') players.forEach(p => { p.mirrors = null; });
}
/** Ping 999+: trễ input (chạy ở máy chủ) */
const pingQ = {};
function lagInput(id, inp) {
    if (world.event !== 'ping' || gameState !== 'PLAYING' || net.role === 'guest') return inp;
    const q = pingQ[id] = pingQ[id] || [];
    q.push({ t: world.time, inp: JSON.parse(JSON.stringify(inp)) });
    let out = null;
    while (q.length && q[0].t <= world.time - 0.35) out = q.shift().inp;
    if (out) q.lastOut = out;
    return q.lastOut || { move: { x: 0, y: 0 } };
}
/** Thời gian bất ổn: đổi tốc độ cả trận */
const _update = update;
update = function (rawDt) { _update(world.event === 'chaos' && gameState === 'PLAYING' && net.role !== 'guest' ? rawDt * (world.timeScale || 1) : rawDt); };

/* ============================== INPUT: thêm kỹ năng 3, phép, vật phẩm ============================== */
const EXTRA_BTN = ['s3', 'sp1', 'sp2', 'sp3', 'it1', 'it2'];
const EXTRA_KEYS = {
    p1: { s3: ['KeyE', 'KeyY'], sp1: ['KeyZ'], sp2: ['KeyX'], sp3: ['KeyV'], it1: ['KeyC'], it2: ['KeyB'] },
    p2: { s3: ['KeyU', 'Numpad6'], sp1: ['KeyN', 'Numpad7'], sp2: ['KeyM', 'Numpad8'], sp3: ['Numpad9'], it1: ['Numpad0'], it2: ['NumpadDecimal'] }
};
const _keyboardInput = keyboardInput;
keyboardInput = function (map) {
    const o = _keyboardInput(map), ex = map === KEYMAP.p1 ? EXTRA_KEYS.p1 : EXTRA_KEYS.p2;
    EXTRA_BTN.forEach(k => { if (anyKey(ex[k])) o[k] = true; });
    return o;
};
const _mergeInput = mergeInput;
mergeInput = function (...list) {
    const out = _mergeInput(...list);
    list.forEach(i => { if (!i) return; EXTRA_BTN.forEach(k => { if (i[k]) out[k] = true; }); if (i.s3aim) out.s3aim = i.s3aim; if (i.s3cancel) out.s3cancel = true; });
    return out;
};
const _readHumanInput = readHumanInput;
readHumanInput = function (id) { const r = _readHumanInput(id); window.__lastInp = r; return lagInput(id, r); };
const _netRemoteInput = netRemoteInput;
netRemoteInput = function (id) {
    const out = _netRemoteInput(id), g = net.guests.find(x => x.id === id);
    if (g) { const r = g.remote; EXTRA_BTN.forEach(k => { out[k] = !!(r[k] || r['l' + k]); r['l' + k] = false; }); out.s3aim = r.s3aim; out.s3cancel = r.s3cancel; }
    return lagInput(id, out);
};
const _onHostData = onHostData;
onHostData = function (g, m) {
    _onHostData(g, m);
    if (m && m.t === 'in' && m.x) { const r = g.remote; EXTRA_BTN.forEach(k => { if (m.x[k] && !r[k]) r['l' + k] = true; r[k] = !!m.x[k]; }); r.s3aim = m.x.s3aim; r.s3cancel = m.x.s3cancel; }
};
const _netSend = netSend;
netSend = function (msg) {
    if (net.role === 'guest' && msg && msg.t === 'in' && window.__lastInp) { const i = window.__lastInp, x = {}; EXTRA_BTN.forEach(k => { if (i[k]) x[k] = true; }); if (i.s3aim) x.s3aim = { x: Math.round(i.s3aim.x * 20) / 20, y: Math.round(i.s3aim.y * 20) / 20 }; if (i.s3cancel) x.s3cancel = true; msg.x = x; }
    return _netSend(msg);
};

/* ============================== MẠNG: gửi thêm dữ liệu ============================== */
const _snapPlayer = snapPlayer;
snapPlayer = function (p) {
    return Object.assign(_snapPlayer(p), { spells: p.spells, items: p.items, railLv: p.railLv || 1, mech: !!p.mech, antiMelee: p.antiMelee, gasMask: p.gasMask, bag: p.bag });
};
const _buildSnapshot = buildSnapshot;
buildSnapshot = function () { const s = _buildSnapshot(); s.x = { mw: MAP_W, mh: MAP_H, ev: world.event, ts: world.timeScale, rb: world.robot, br: !!world.bright, team: world.team }; return s; };
const _applySnapshot = applySnapshot;
applySnapshot = function (s) {
    if (s.x) { setMapSize(s.x.mw, s.x.mh); world.event = s.x.ev; world.timeScale = s.x.ts; world.robot = s.x.rb; world.bright = !!s.x.br; world.team = !!s.x.team; }
    _applySnapshot(s);
    const ids = new Set(s.pl.map(q => q.id));
    for (let i = players.length - 1; i >= 0; i--) if (!ids.has(players[i].id)) players.splice(i, 1);
};

/* ============================== TẦM NHÌN: Sniper, Cung, Railgun, Elsu, Ưng Trạm, đồng đội ============================== */
function visionAt(v, ang) {
    let base = visionRange(v);
    if (!v || !v.inventory) return base;
    const w = getCurrentWeapon(v), elsu = v.cardSet && v.cardSet.has('elsu');
    if (w.id === 'BOW') base *= 1.15;
    if (w.id === 'RAILGUN' && (v.railLv || 1) >= 2) base *= 1.4;
    if (!v.aiming) return base;
    const fwd = Math.abs(angleDiff(ang, v.aimAngle !== undefined ? v.aimAngle : v.angle));
    if (w.id === 'SNIPER' && v.charge > 0) {
        const half = Math.max(0.1, spreadAt(w, v.charge) * 0.6 + 0.08);
        if (fwd < half) return Math.max(base, chargeRange(w, v.charge, v) + 40);
        return elsu ? base : base * (1 - 0.4 * v.charge);
    }
    if (elsu && w.type === 'GUN' && fwd < 0.35) return base * 1.6;
    return base;
}
function canSeeFrom(ax, ay, x, y, pad = 0, viewer) {
    const R = viewer && viewer.inventory ? visionAt(viewer, Math.atan2(y - ay, x - ax)) : visionRange(viewer);
    return dist(ax, ay, x, y) < R + pad && lineOfSight(ax, ay, x, y);
}
function myWards(me) { return decoys.filter(d => (d.kind === 'ward' || decoyKind(d) === 'ward') && d.owner === me.id); }
function canSee(x, y, pad = 0) {
    const me = localPlayer();
    if (!fowActive() || !me || me.hp <= 0) return true;
    if (canSeeFrom(me.x, me.y, x, y, pad, me)) return true;
    if (players.some(q => q.hp > 0 && sameTeam(me, q) && canSeeFrom(q.x, q.y, x, y, pad, q))) return true;
    return myWards(me).some(d => dist(d.x, d.y, x, y) < 300 + pad && lineOfSight(d.x, d.y, x, y));
}
function visPolyFn(px, py, Rf, Rmax) {
    const angles = [], N = isTouch ? 96 : 140;
    for (let i = 0; i < N; i++) angles.push((i / N) * Math.PI * 2 - Math.PI);
    for (const o of obstacles) for (const [cx, cy] of [[o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h]]) {
        if (dist(px, py, cx, cy) > Rmax + 40) continue;
        const a = Math.atan2(cy - py, cx - px); angles.push(a - 0.002, a + 0.002);
    }
    angles.sort((a, b) => a - b);
    const near = obstacles.filter(o => o.x < px + Rmax && o.x + o.w > px - Rmax && o.y < py + Rmax && o.y + o.h > py - Rmax);
    const pts = [];
    for (const a of angles) {
        const R = Rf(a), ex = px + Math.cos(a) * R, ey = py + Math.sin(a) * R;
        let tmin = 1;
        for (const o of near) { const t = segRect(px, py, ex, ey, o); if (t >= 0 && t < tmin) tmin = t; }
        if (tmin < 1) tmin = Math.min(1, tmin + 14 / R);
        pts.push(px + (ex - px) * tmin, py + (ey - py) * tmin);
    }
    return pts;
}
function drawFogOfWar(zoom) {
    const me = localPlayer(), W = SCREEN_W, H = SCREEN_H;
    if (fogCanvas.width !== canvas.width || fogCanvas.height !== canvas.height) { fogCanvas.width = canvas.width; fogCanvas.height = canvas.height; }
    fogCtx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.clearRect(0, 0, W, H);
    fogCtx.fillStyle = 'rgba(3, 5, 12, 0.9)'; fogCtx.fillRect(0, 0, W, H);
    if (me.hp > 0) {
        const sx = x => (x - camera.x) * zoom + W / 2, sy = y => (y - camera.y) * zoom + H / 2;
        fogCtx.globalCompositeOperation = 'destination-out';
        const cut = (px, py, Rf, base, Rmax) => {
            const pts = visPolyFn(px, py, Rf, Rmax);
            const g = fogCtx.createRadialGradient(sx(px), sy(py), base * 0.2 * zoom, sx(px), sy(py), Rmax * zoom);
            const k = Math.min(0.95, base / Rmax);
            g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(k * 0.7, 'rgba(0,0,0,0.95)'); g.addColorStop(k, Rmax > base * 1.05 ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
            fogCtx.fillStyle = g; fogCtx.beginPath();
            for (let i = 0; i < pts.length; i += 2) { const X = sx(pts[i]), Y = sy(pts[i + 1]); i ? fogCtx.lineTo(X, Y) : fogCtx.moveTo(X, Y); }
            fogCtx.closePath(); fogCtx.fill();
        };
        const base = visionRange(me);
        let Rmax = base; for (let a = -Math.PI; a < Math.PI; a += 0.05) Rmax = Math.max(Rmax, visionAt(me, a));
        cut(me.x, me.y, a => visionAt(me, a), base, Rmax);
        players.forEach(q => { if (q.hp > 0 && sameTeam(me, q)) { const b = visionRange(q); cut(q.x, q.y, () => b, b, b); } });
        myWards(me).forEach(d => cut(d.x, d.y, () => 300, 300, 300));
        fogCtx.fillStyle = 'rgba(0,0,0,0.9)'; fogCtx.beginPath(); fogCtx.arc(sx(me.x), sy(me.y), 34 * zoom, 0, Math.PI * 2); fogCtx.fill();
        particles.forEach(pt => { if (!pt.glow || pt.size < 20) return; fogCtx.fillStyle = 'rgba(0,0,0,0.75)'; fogCtx.beginPath(); fogCtx.arc(sx(pt.x), sy(pt.y), pt.size * 1.6 * zoom, 0, Math.PI * 2); fogCtx.fill(); });
    } else fogCtx.clearRect(0, 0, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fogCanvas, 0, 0);
    ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
}

/* ============================== VẼ: vật thể mới ============================== */
const KIND_BY_LABEL = { 'ƯNG TRẠM': 'ward', 'DRONE': 'drone', 'BÙ NHÌN': 'scarecrow', 'ZOMBIE': 'zombie' };
function decoyKind(d) { return d.kind || KIND_BY_LABEL[d.label] || null; }
const _drawDecoys = drawDecoys;
drawDecoys = function (now) {
    const all = decoys.slice(), special = all.filter(d => ['ward', 'drone', 'scarecrow'].includes(decoyKind(d)));
    decoys.length = 0; decoys.push(...all.filter(d => !special.includes(d)));
    _drawDecoys(now);
    decoys.length = 0; decoys.push(...all);
    special.forEach(d => {
        if (localId() !== null && d.owner !== localId() && !canSee(d.x, d.y, 12)) return;
        const k = decoyKind(d), mine = d.owner === localId();
        ctx.save(); ctx.translate(d.x, d.y);
        if (k === 'ward') {
            if (mine) { ctx.strokeStyle = 'rgba(56,189,248,0.25)'; ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 300, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(0, 8, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#334155'; ctx.fillRect(-3, -18, 6, 24);
            ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(10, -18); ctx.lineTo(-10, -18); ctx.closePath(); ctx.fill();
            ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(56,189,248,${0.4 + Math.sin(now * 5) * 0.2})`; ctx.beginPath(); ctx.arc(0, -22, 7, 0, Math.PI * 2); ctx.fill();
        } else if (k === 'drone') {
            ctx.rotate(d.angle); ctx.fillStyle = '#1e293b'; ctx.fillRect(-7, -7, 14, 14);
            ctx.fillStyle = 'rgba(147,197,253,0.6)'; [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 5 + Math.sin(now * 40) * 1.5, 0, Math.PI * 2); ctx.fill(); });
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(5, 0, 2, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -16); ctx.moveTo(-14, -6); ctx.lineTo(14, -6); ctx.stroke();
            ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(0, -20, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111'; ctx.fillRect(-4, -22, 2, 2); ctx.fillRect(2, -22, 2, 2);
            ctx.fillStyle = '#a16207'; ctx.beginPath(); ctx.moveTo(-11, -26); ctx.lineTo(11, -26); ctx.lineTo(0, -36); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    });
};
const _drawNetZones = drawNetZones;
drawNetZones = function (now) {
    _drawNetZones(now);
    zones.forEach(z => {
        if (z.type === 'emp') {
            ctx.strokeStyle = `rgba(56,189,248,${0.5 + Math.sin(now * 12) * 0.25})`; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.lineDashOffset = -now * 30;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(56,189,248,0.08)'; ctx.fill();
            if (Math.random() < 0.3) beams.push({ x1: z.x, y1: z.y, x2: z.x + (Math.random() - 0.5) * z.r * 1.6, y2: z.y + (Math.random() - 0.5) * z.r * 1.6, life: 0.08, maxLife: 0.08, color: '#7dd3fc', zig: 1 });
        } else if (z.type === 'poison') {
            const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r);
            g.addColorStop(0, 'rgba(132,204,22,0.35)'); g.addColorStop(1, 'rgba(101,163,13,0.05)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        }
    });
    if (world.robot) {
        const r = world.robot;
        ctx.save(); ctx.translate(r.x, r.y);
        ctx.fillStyle = `rgba(253,224,71,${0.15 + Math.sin(now * 4) * 0.08})`; ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
        ctx.font = `34px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🤖', 0, -2);
        ctx.font = `700 11px ${FONT}`; ctx.fillStyle = '#fde047'; ctx.fillText('LÁI ROBOT', 0, 34);
        ctx.restore();
    }
};
const _drawPlayerExtras = drawPlayerExtras;
drawPlayerExtras = function (p, w, now) {
    _drawPlayerExtras(p, w, now);
    if (p.mech) { ctx.save(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4; rrect(ctx, p.x - p.radius - 6, p.y - p.radius - 6, p.radius * 2 + 12, p.radius * 2 + 12, 6); ctx.stroke(); ctx.restore(); }
    if (w.id === 'RAILGUN' && p.aiming && (p.railLv || 1) >= 2) {
        const L = chargeRange(w, 1, p), half = p.railLv >= 3 ? 44 : 20, a = p.aimAngle !== undefined ? p.aimAngle : p.angle;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
        ctx.fillStyle = `rgba(239,68,68,${0.12 + Math.sin(now * 14) * 0.06})`; ctx.fillRect(p.radius, -half, L, half * 2);
        ctx.strokeStyle = 'rgba(248,113,113,0.8)'; ctx.lineWidth = 1.5; ctx.strokeRect(p.radius, -half, L, half * 2);
        ctx.restore();
    }
    if (world.team && localPlayer() && sameTeam(localPlayer(), p)) { ctx.strokeStyle = 'rgba(74,222,128,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2); ctx.stroke(); }
};

/* ============================== NÚT CẢM ỨNG: 3 kỹ năng + hàng phép/vật phẩm ============================== */
function touchLayout() {
    const W = SCREEN_W, H = SCREEN_H, m = Math.min(W, H);
    const rA = Math.max(36, Math.min(64, m * 0.13));
    const ax = W - rA - Math.max(20, W * 0.03), ay = H - rA - Math.max(14, H * 0.045);
    const d = rA * 2.1, rs = rA * 0.58;
    const at = (deg, dd, r) => ({ x: ax + Math.cos(deg * Math.PI / 180) * dd, y: ay + Math.sin(deg * Math.PI / 180) * dd, r });
    const L = { A: { x: ax, y: ay, r: rA }, S1: at(180, d, rs), S2: at(222, d, rs), S3: at(264, d, rs), B: at(302, rA * 1.6, rA * 0.42), C: at(150, rA * 1.62, rA * 0.4),
        stick: { x: Math.max(110, W * 0.15), y: H - Math.max(110, H * 0.3), r: Math.max(56, m * 0.16) } };
    // 3 phép bổ trợ: hàng dưới, giữa màn hình lệch phải một chút
    const rr = rA * 0.42, y = H - rr - 8, gap = rr * 2.4, cx = W * 0.58;
    L.row = ['sp1', 'sp2', 'sp3'].map((k, i) => ({ k, x: cx + (i - 1) * gap, y, r: rr }));
    // vật phẩm: phía trên cụm nút kỹ năng, lệch trái; vật phẩm 2 nằm trên vật phẩm 1, cách một khoảng
    const ir = rA * 0.52, ix = L.S3.x - rA * 0.45, iy = L.S3.y - L.S3.r - ir - 12;
    L.row.push({ k: 'it1', x: ix, y: iy, r: ir }, { k: 'it2', x: ix, y: iy - ir * 2 - 14, r: ir });
    return L;
}
const _handleTouch = handleTouch;
handleTouch = function (e) {
    if (gameState !== 'PLAYING' && gameState !== 'COUNTDOWN') return;
    const pre = new Map(touches);
    _handleTouch(e);
    const L = touchLayout(), inp = touchInputs.p1, me = localPlayer();
    const nSp = me && me.spells ? me.spells.length : 2, nIt = me ? itemSlots(me) : 1;
    const row = L.row.filter(b => b.k[0] === 's' ? +b.k[2] <= nSp : +b.k[2] <= nIt);
    for (const t of e.changedTouches) {
        const x = t.clientX, y = t.clientY, id = t.identifier;
        if (e.type === 'touchstart') {
            let k = null;
            if (dist(x, y, L.S3.x, L.S3.y) < L.S3.r * 1.25 && me && me.skills && me.skills[2]) k = 's3';
            else { const b = row.find(b => dist(x, y, b.x, b.y) < b.r * 1.35); if (b) k = b.k; }
            if (!k) continue;
            const old = touches.get(id); if (old && old.k === 'stick') { stickOrigin.p1 = null; inp.move = { x: 0, y: 0 }; }
            inp[k] = true; if (k === 's3') { inp.s3aim = null; inp.s3cancel = false; }
            touches.set(id, { k, sx: x, sy: y });
        } else if (e.type === 'touchmove') {
            const td = touches.get(id); if (!td || td.k !== 's3') continue;
            const dx = x - td.sx, dy = y - td.sy, d = Math.hypot(dx, dy), maxD = L.A.r * 1.7;
            if (d > 14) { inp.s3aim = { x: dx / d * Math.min(1, d / maxD), y: dy / d * Math.min(1, d / maxD) }; inp.s3cancel = false; td.eng = true; }
            else if (td.eng) { inp.s3aim = null; inp.s3cancel = true; }
            skillStick.s3 = { sx: td.sx, sy: td.sy, x, y, cancel: !!inp.s3cancel };
        } else {
            const td = pre.get(id);
            if (td && td.k === 's3') { inp.s3aim = null; inp.s3cancel = false; skillStick.s3 = null; }
        }
    }
};
const _drawTouchControls = drawTouchControls;
drawTouchControls = function (p) {
    _drawTouchControls(p);
    const L = touchLayout(), inp = touchInputs.p1;
    const s = p.skills && p.skills[2], c = s && CARDS[s.id];
    if (c) {
        lqButton(L.S3, inp.s3, c.icon, s.cd > 0 ? Math.ceil(s.cd) : '', s.cd > 0 ? s.cd / Math.max(0.1, skillCooldown(p, s.id)) : 0, '#22d3ee');
        const st = skillStick.s3;
        if (st && inp.s3) { const dx = st.x - st.sx, dy = st.y - st.sy, d = Math.min(L.S3.r * 1.3, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); ctx.fillStyle = st.cancel ? 'rgba(248,113,113,0.85)' : 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(L.S3.x + Math.cos(a) * d, L.S3.y + Math.sin(a) * d, L.S3.r * 0.35, 0, Math.PI * 2); ctx.fill(); }
    }
    drawSpellRow(p, L.row, inp);
};
function drawSpellRow(p, row, inp) {
    row.forEach(b => {
        if (b.k[0] === 's') {
            const sp = p.spells && p.spells[+b.k[2] - 1]; if (!sp) return;
            const def = SPELLS[sp.id], cd = sp.cd > 0 ? sp.cd / spellCd(p, sp.id) : 0;
            lqButton(b, inp && inp[b.k], def.icon, sp.cd > 0 ? Math.ceil(sp.cd) : '', cd, '#facc15');
        } else {
            const i = +b.k[2] - 1; if (i >= itemSlots(p)) return;
            const it = p.items && p.items[i];
            if (it) { lqButton(b, inp && inp[b.k], ITEMS[it.id].icon, it.uses > 1 ? 'x' + it.uses : '', 0, '#a78bfa'); }
            else { ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#a78bfa'; ctx.setLineDash([3, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.85, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
        }
    });
}
/** PC: thanh kỹ năng/phép/vật phẩm ở giữa đáy màn hình */
const _drawHUD = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUD(W, H, now);
    const me = localPlayer() || (settings.mode === 'pvp' ? players[0] : null);
    if (!isTouch && me) {
        const slots = [];
        (me.skills || []).forEach((s, i) => slots.push({ icon: CARDS[s.id].icon, key: ['R', 'T', 'E'][i], cd: s.cd, max: skillCooldown(me, s.id), col: '#22d3ee' }));
        (me.spells || []).forEach((s, i) => slots.push({ icon: SPELLS[s.id].icon, key: ['Z', 'X', 'V'][i], cd: s.cd, max: spellCd(me, s.id), col: '#facc15' }));
        for (let i = 0; i < itemSlots(me); i++) { const it = me.items && me.items[i]; slots.push({ icon: it ? ITEMS[it.id].icon : '', key: ['C', 'B'][i], cd: 0, max: 1, col: '#a78bfa', empty: !it }); }
        const r = 20, gap = 50, x0 = W / 2 - (slots.length - 1) * gap / 2, y = H - 30;
        slots.forEach((s, i) => {
            const b = { x: x0 + i * gap, y, r };
            if (s.empty) { ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = s.col; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.85, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
            else lqButton(b, false, s.icon, s.cd > 0 ? Math.ceil(s.cd) : '', s.cd > 0 ? s.cd / Math.max(0.1, s.max) : 0, s.col);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `700 9px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(s.key, b.x, b.y - r - 4);
        });
    }
    // biến cố đang diễn ra
    const ev = world.event;
    if (ev && gameState === 'PLAYING') {
        const t = { zombie: '🧟 ZOMBIE TRÀN', ping: '📶 PING 999+', chaos: `⏱ THỜI GIAN x${world.timeScale || 1}`, poison: '☣ KHÍ ĐỘC', robot: '🤖 GIẢ LẬP ROBOT', mirror: '🪞 PHÒNG GƯƠNG' }[ev];
        ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = ev === 'ping' && Math.sin(now * 8) > 0 ? '#f87171' : '#fde68a';
        ctx.fillText(t || '', W / 2, 78);
        if (ev === 'poison') { ctx.fillStyle = 'rgba(101,163,13,0.08)'; ctx.fillRect(0, 0, W, H); }
    }
};

/* Luật TRỜI SÁNG: tắt sương mù cả hiển thị lẫn luật nhìn thấy */
const _fowActive = fowActive;
fowActive = function () { return !world.bright && _fowActive(); };
const _fogGameplay = fogGameplay;
fogGameplay = function () { return !world.bright && _fogGameplay(); };
