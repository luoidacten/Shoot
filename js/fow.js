/** ==================== SƯƠNG MÙ CHIẾN TRẬN · DẤU CHÂN · ÂM THANH ĐỊNH VỊ ==================== */
const VISION = 430;
const footprints = [];   // dấu chân trên sàn
const pings = [];        // gợn sóng âm thanh phát ra từ trong sương
const stepTrack = {};
let visPoly = null;      // đa giác tầm nhìn của khung hình hiện tại

function localPlayer() { const id = localId(); return id ? players.find(p => p.id === id && p.x !== undefined) : null; }
function fowActive() { return (settings.mode === 'online' || (settings.mode === 'bot' && settings.fow)) && !!localPlayer(); }
function visionRange(viewer) {
    const v = viewer || localPlayer();
    let m = v && v.eagle ? 1.3 : 1;
    if (v && v.watchman && v.stillT >= 0.5) m *= combo(v, 'overwatch') ? 1.8 : 1.4;
    return (world.darkness ? 260 : VISION) * m;
}

/** Từ (ax,ay) có nhìn thấy điểm (x,y) không — bị tường che và giới hạn tầm nhìn */
function canSeeFrom(ax, ay, x, y, pad = 0, viewer) { return dist(ax, ay, x, y) < visionRange(viewer) + pad && lineOfSight(ax, ay, x, y); }
function canSee(x, y, pad = 0) {
    const me = localPlayer();
    if (!fowActive() || !me || me.hp <= 0) return true; // chết rồi thì được xem toàn cảnh
    return canSeeFrom(me.x, me.y, x, y, pad, me);
}

/** Đa giác tầm nhìn: bắn tia ra mọi hướng + hướng tới góc vật cản để mép bóng sắc nét */
function computeVisibility(px, py, R) {
    const angles = [];
    const N = isTouch ? 96 : 140; // điện thoại: ít tia hơn cho nhẹ
    for (let i = 0; i < N; i++) angles.push((i / N) * Math.PI * 2 - Math.PI);
    for (const o of obstacles) {
        for (const [cx, cy] of [[o.x, o.y], [o.x + o.w, o.y], [o.x, o.y + o.h], [o.x + o.w, o.y + o.h]]) {
            if (dist(px, py, cx, cy) > R + 40) continue;
            const a = Math.atan2(cy - py, cx - px);
            angles.push(a - 0.002, a + 0.002);
        }
    }
    angles.sort((a, b) => a - b);
    const near = obstacles.filter(o => o.x < px + R && o.x + o.w > px - R && o.y < py + R && o.y + o.h > py - R);
    const pts = [];
    for (const a of angles) {
        const ex = px + Math.cos(a) * R, ey = py + Math.sin(a) * R;
        let tmin = 1;
        for (const o of near) { const t = segRect(px, py, ex, ey, o); if (t >= 0 && t < tmin) tmin = t; }
        if (tmin < 1) tmin = Math.min(1, tmin + 14 / R); // để lộ mặt tường
        pts.push(px + (ex - px) * tmin, py + (ey - py) * tmin);
    }
    return pts;
}

/** Dấu chân + tiếng bước chân — tính từ vị trí hiển thị nên chạy được ở cả máy chủ lẫn máy khách */
function updateFootprints(dt) {
    for (let i = footprints.length - 1; i >= 0; i--) { footprints[i].t -= dt; if (footprints[i].t <= 0) footprints.splice(i, 1); }
    if (footprints.length > 500) footprints.splice(0, footprints.length - 500);
    for (let i = pings.length - 1; i >= 0; i--) { pings[i].life -= dt; if (pings[i].life <= 0) pings.splice(i, 1); }
    if (!['PLAYING', 'KO', 'COUNTDOWN'].includes(gameState)) return;
    players.forEach(p => {
        if (p.hp <= 0 || p.x === undefined) return;
        let s = stepTrack[p.id];
        if (!s) s = stepTrack[p.id] = { x: p.x, y: p.y, acc: 0, side: 1, dir: p.angle };
        const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy);
        s.x = p.x; s.y = p.y;
        if (d > 80) { s.acc = 0; return; } // dịch chuyển tức thời
        if (d > 0.3) s.dir = Math.atan2(dy, dx);
        if (d / Math.max(dt, 0.001) < 40) return; // đứng yên / trôi nhẹ
        s.acc += d;
        const stride = 30 + p.radius * 0.8;
        if (s.acc < stride) return;
        s.acc = 0; s.side *= -1;
        if (p.ghostT > 1 || p.silent) return;
        const ox = Math.cos(s.dir + Math.PI / 2) * 5 * s.side, oy = Math.sin(s.dir + Math.PI / 2) * 5 * s.side;
        footprints.push({ x: p.x + ox, y: p.y + oy, a: s.dir, color: p.color, owner: p.id, t: 18, maxT: 18, size: p.radius / 15 });
        // tiếng bước chân (của mình nhỏ, của địch to hơn để còn nghe ngóng)
        const mine = p.id === localId();
        net.mute++;
        try { AudioSys.playAt('step', p.x, p.y, (mine ? 0.06 : 0.3) * Math.min(1.4, p.radius / 15), 800); }
        finally { net.mute--; }
    });
}

/** Gọi khi nghe thấy một âm thanh: nếu nguồn nằm trong sương thì hiện gợn sóng */
function onHeard(type, x, y) {
    if (!fowActive() || canSee(x, y, 10)) return;
    const me = localPlayer(); if (!me) return;
    const kind = type === 'step' ? 'step' : type === 'explosion' ? 'boom' : ['swing', 'hit', 'crit', 'block'].includes(type) ? 'melee' : 'gun';
    if (kind === 'step' && dist(me.x, me.y, x, y) > (me.adv === 'minimap' ? 1300 : 800)) return;
    const jit = kind === 'step' ? 30 : 50;
    pings.push({ x: x + (Math.random() - 0.5) * jit, y: y + (Math.random() - 0.5) * jit, kind, life: kind === 'step' ? 0.7 : 1.1, maxLife: kind === 'step' ? 0.7 : 1.1 });
}

function drawFootprints(vx0, vx1, vy0, vy1) {
    const me = localPlayer();
    footprints.forEach(f => {
        if (f.x < vx0 || f.x > vx1 || f.y < vy0 || f.y > vy1) return;
        // Thợ Săn thấy dấu chân địch lâu gấp đôi (18s), người thường 9s
        const win = me && me.hunter && f.owner !== me.id ? 18 : 9;
        const age = f.maxT - f.t; if (age > win) return;
        const k = 1 - age / win;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a);
        ctx.globalAlpha = 0.5 * k;
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.ellipse(2 * f.size, 0, 5 * f.size, 3 * f.size, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-5 * f.size, 0, 2.6 * f.size, 2.4 * f.size, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
    ctx.globalAlpha = 1;
}

function drawFogOfWar(zoom) {
    const me = localPlayer();
    const W = SCREEN_W, H = SCREEN_H;
    if (fogCanvas.width !== canvas.width || fogCanvas.height !== canvas.height) { fogCanvas.width = canvas.width; fogCanvas.height = canvas.height; }
    fogCtx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.clearRect(0, 0, W, H);
    fogCtx.fillStyle = 'rgba(3, 5, 12, 0.9)'; fogCtx.fillRect(0, 0, W, H);
    if (me.hp > 0) {
        const R = visionRange();
        visPoly = computeVisibility(me.x, me.y, R);
        const sx = x => (x - camera.x) * zoom + W / 2, sy = y => (y - camera.y) * zoom + H / 2;
        fogCtx.globalCompositeOperation = 'destination-out';
        const g = fogCtx.createRadialGradient(sx(me.x), sy(me.y), R * 0.2 * zoom, sx(me.x), sy(me.y), R * zoom);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.7, 'rgba(0,0,0,0.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        fogCtx.fillStyle = g;
        fogCtx.beginPath();
        for (let i = 0; i < visPoly.length; i += 2) { const X = sx(visPoly[i]), Y = sy(visPoly[i + 1]); i ? fogCtx.lineTo(X, Y) : fogCtx.moveTo(X, Y); }
        fogCtx.closePath(); fogCtx.fill();
        // quầng sáng nhỏ quanh thân để luôn thấy mình
        fogCtx.fillStyle = 'rgba(0,0,0,0.9)'; fogCtx.beginPath(); fogCtx.arc(sx(me.x), sy(me.y), 34 * zoom, 0, Math.PI * 2); fogCtx.fill();
        // vụ nổ soi sáng sương mù
        particles.forEach(pt => {
            if (!pt.glow || pt.size < 20) return;
            fogCtx.fillStyle = 'rgba(0,0,0,0.75)'; fogCtx.beginPath(); fogCtx.arc(sx(pt.x), sy(pt.y), pt.size * 1.6 * zoom, 0, Math.PI * 2); fogCtx.fill();
        });
    } else {
        fogCtx.clearRect(0, 0, W, H);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fogCanvas, 0, 0);
    ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
}

/** Gợn sóng âm thanh (vẽ đè lên sương mù) + mũi tên chỉ hướng khi ngoài màn hình */
function drawPings(zoom) {
    if (!pings.length) return;
    const W = SCREEN_W, H = SCREEN_H;
    const col = { step: '200,210,235', gun: '255,170,60', boom: '255,80,60', melee: '230,230,255' };
    pings.forEach(p => {
        const k = 1 - p.life / p.maxLife;
        let x = (p.x - camera.x) * zoom + W / 2, y = (p.y - camera.y) * zoom + H / 2;
        const c = col[p.kind];
        const off = x < 20 || y < 20 || x > W - 20 || y > H - 20;
        if (off) {
            // kẹp vào mép màn hình và vẽ mũi tên
            const a = Math.atan2(y - H / 2, x - W / 2);
            x = Math.max(24, Math.min(W - 24, x)); y = Math.max(24, Math.min(H - 24, y));
            ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = 1 - k;
            ctx.fillStyle = `rgb(${c})`; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.fill();
            ctx.restore();
            return;
        }
        const base = p.kind === 'step' ? 14 : p.kind === 'boom' ? 60 : 30;
        ctx.strokeStyle = `rgba(${c},${(1 - k) * 0.9})`;
        ctx.lineWidth = p.kind === 'step' ? 1.5 : 2.5;
        for (let i = 0; i < (p.kind === 'step' ? 1 : 2); i++) {
            ctx.beginPath(); ctx.arc(x, y, (base * (0.4 + k) + i * 10) * Math.max(0.6, zoom), 0, Math.PI * 2); ctx.stroke();
        }
        if (p.kind === 'gun') { ctx.fillStyle = `rgba(${c},${1 - k})`; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    });
}

function clearFootprints() { footprints.length = 0; pings.length = 0; for (const k in stepTrack) delete stepTrack[k]; }
