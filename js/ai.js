/** ==================== BOT AI ==================== */
const BOT_LEVELS = [
    { react: 0.5, spread: 0.35, dodge: 0.0, avoidTraps: false, strafe: 0.4, aggression: 0.6 },
    { react: 0.25, spread: 0.12, dodge: 0.35, avoidTraps: true, strafe: 0.8, aggression: 0.8 },
    { react: 0.08, spread: 0.0, dodge: 0.8, avoidTraps: true, strafe: 1.0, aggression: 1.0 }
];

function createBrain() {
    return { aimT: 0, strafeDir: 1, strafeT: 0, stuckT: 0, lastX: 0, lastY: 0, wanderA: 0, wanderT: 0, dodgeT: 0, dodgeA: 0, swapCd: 0, prevA: false };
}

/** Chọn hướng đi tránh vật cản (quét quạt góc) */
function steer(p, ang) {
    const look = p.radius + 34;
    for (const off of [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.4, -2.4]) {
        const a = ang + off;
        const x = p.x + Math.cos(a) * look, y = p.y + Math.sin(a) * look;
        if (x < p.radius || y < p.radius || x > MAP_W - p.radius || y > MAP_H - p.radius) continue;
        if (!pointInObstacle(x, y, p.radius * 0.8)) return a;
    }
    return ang + Math.PI;
}

function botThink(p, dt) {
    const B = p.brain, L = BOT_LEVELS[settings.diff];
    const e = enemyOf(p);
    const w = getCurrentWeapon(p);
    const out = { move: { x: 0, y: 0 }, a: false, b: false, c: false };
    if (!e) return out;
    p.aiSpread = L.spread;

    const dE = dist(p.x, p.y, e.x, e.y);
    const los = lineOfSight(p.x, p.y, e.x, e.y);
    // Bot chỉ "thấy" địch như người: tàng hình, khói, sương mù đều che được — còn lại phải nghe tiếng
    let enemyVisible = targetable(p, e);
    if (enemyVisible) B.lastSeen = { x: e.x, y: e.y, t: world.time };
    else {
        const loud = e.muzzle > 0 ? 1400 : (!e.silent && Math.hypot(e.vx || 0, e.vy || 0) > 60) ? 380 + settings.diff * 120 : 0;
        if (dE < loud) B.lastSeen = { x: e.x + (Math.random() - 0.5) * 120, y: e.y + (Math.random() - 0.5) * 120, t: world.time };
    }
    let goal = null, goalAng = null, wantDist = 0;

    // --- 1. Nguy hiểm: ngoài bo, sao băng, lựu đạn ---
    const z = world.zone;
    const outZone = dist(p.x, p.y, z.x, z.y) > z.r - 60;
    let danger = null;
    meteors.forEach(m => { if (dist(p.x, p.y, m.x, m.y) < 150) danger = m; });
    items.forEach(it => { if (it.type.id === 'GRENADE' && it.fuse > 0 && dist(p.x, p.y, it.x, it.y) < 190) danger = it; });

    if (danger) goalAng = Math.atan2(p.y - danger.y, p.x - danger.x);
    else if (outZone) goalAng = Math.atan2(z.y - p.y, z.x - p.x);

    // --- 2. Né đạn ---
    if (B.dodgeT > 0) B.dodgeT -= dt;
    else if (L.dodge > 0) {
        for (const b of bullets) {
            if (b.owner === p.id) continue;
            const d = dist(b.x, b.y, p.x, p.y);
            if (d < 220 && Math.abs(angleDiff(Math.atan2(p.y - b.y, p.x - b.x), b.angle)) < 0.25 && Math.random() < L.dodge * dt * 8) {
                B.dodgeT = 0.3; B.dodgeA = b.angle + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2; break;
            }
        }
    }

    // --- 3. Quản lý vũ khí ---
    const other = p.inventory[otherSlot(p)];
    const usable = x => x && x.id !== 'NONE' && !(x.type === 'GUN' && x.ammo <= 0);
    B.swapCd -= dt;
    if (B.swapCd <= 0 && usable(other) && (!usable(w) || (other.tier || 0) > (w.tier || 0) + 0 && w.type !== 'GUN')) { out.c = true; B.swapCd = 0.8; }
    if (w.type === 'GUN' && w.ammo <= 0 && dE < 420 && los) out.b = true; // ném súng rỗng vào mặt

    const armed = usable(w) && w.id !== 'NONE' && (w.id !== 'KNIFE' || dE < 200);
    const needLoot = (w.tier || 0) <= 1 && (other.tier || 0) <= 1;

    if (goalAng === null) {
        if (needLoot && dE > 160) {
            // tìm hòm thính gần nhất
            let best = null, bd = 1e9;
            crates.forEach(c => {
                if (c.type === 'TRAP' && L.avoidTraps) return;
                if (!insideZone(c.x, c.y, 30)) return;
                let d = dist(p.x, p.y, c.x, c.y) - (c.type === 'LEGEND' ? 400 : 0) + (c.type === 'SUPPORT' ? 150 : 0);
                if (d < bd) { bd = d; best = c; }
            });
            if (best) goal = best;
        } else if (crates.some(c => c.type === 'LEGEND')) {
            const lg = crates.find(c => c.type === 'LEGEND');
            if (dist(p.x, p.y, lg.x, lg.y) < dE) goal = lg;
        }
        if (!goal && p.hp < p.maxHp * 0.4) {
            const sup = crates.filter(c => c.type === 'SUPPORT').sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))[0];
            if (sup && dist(p.x, p.y, sup.x, sup.y) < 500) goal = sup;
        }
        if (!goal && L.avoidTraps) {
            // né bẫy đang ở gần
        }
        if (goal) goalAng = Math.atan2(goal.y - p.y, goal.x - p.x);
    }

    // --- 4. Đánh nhau ---
    if (goalAng === null) {
        if (!enemyVisible && B.lastSeen && world.time - B.lastSeen.t < 8 && dist(p.x, p.y, B.lastSeen.x, B.lastSeen.y) > 50) {
            goalAng = Math.atan2(B.lastSeen.y - p.y, B.lastSeen.x - p.x); // lần theo dấu vết
        } else if (!enemyVisible) {
            B.wanderT -= dt; if (B.wanderT <= 0) { B.wanderT = 1.5; B.wanderA = Math.atan2(z.y - p.y, z.x - p.x) + (Math.random() - 0.5) * 2; }
            goalAng = B.wanderA;
        } else if (w.type === 'GUN') {
            wantDist = Math.min(w.range * 0.6, w.id === 'SHOTGUN' ? 170 : w.id === 'SNIPER' || w.id === 'RAILGUN' ? 600 : 320);
            const toE = Math.atan2(e.y - p.y, e.x - p.x);
            if (!los) goalAng = toE;
            else {
                B.strafeT -= dt; if (B.strafeT <= 0) { B.strafeT = 0.6 + Math.random() * 1.2; B.strafeDir *= -1; }
                const radial = dE > wantDist + 60 ? 1 : dE < wantDist - 60 ? -1 : 0;
                const sx = Math.cos(toE + Math.PI / 2) * B.strafeDir * L.strafe, sy = Math.sin(toE + Math.PI / 2) * B.strafeDir * L.strafe;
                const vx = Math.cos(toE) * radial + sx, vy = Math.sin(toE) * radial + sy;
                if (Math.hypot(vx, vy) > 0.1) goalAng = Math.atan2(vy, vx);
            }
        } else if (w.type === 'THROWABLE') {
            goalAng = dE > 380 ? Math.atan2(e.y - p.y, e.x - p.x) : dE < 200 ? Math.atan2(p.y - e.y, p.x - e.x) : null;
        } else {
            // cận chiến: lao vào (Bot dễ sẽ do dự)
            if (Math.random() < L.aggression || dE > 200) goalAng = Math.atan2(e.y - p.y, e.x - p.x);
        }
    }

    // --- 5. Bóp cò (có độ trễ phản xạ) ---
    if (enemyVisible && e.hp > 0) {
        const facing = Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), p.angle)) < 0.3;
        let wants = false;
        if (w.type === 'GUN' && w.ammo > 0) wants = los && dE < w.range * 0.95 && facing;
        else if (w.type === 'THROWABLE') wants = los && dE > 150 && dE < 520;
        else if (w.type === 'MELEE' || w.type === 'SHIELD') wants = dE < p.radius + e.radius + (w.range || 30) + (w.dash ? 120 : 6) && facing;
        if (wants) B.aimT += dt; else B.aimT = 0;
        if (B.aimT > L.react) {
            if (w.automatic) out.a = true;
            else { out.a = !B.prevA; }
        }
    }
    B.prevA = out.a;

    // --- 5b. Dùng kỹ năng ---
    out.s1 = false; out.s2 = false;
    B.skillT = (B.skillT || 0) - dt;
    if (p.skills && B.skillT <= 0 && gameState === 'PLAYING') {
        const incoming = bullets.some(b => b.owner !== p.id && dist(b.x, b.y, p.x, p.y) < 170 && Math.abs(angleDiff(Math.atan2(p.y - b.y, p.x - b.x), b.angle)) < 0.4);
        p.skills.forEach((s, i) => {
            if (s.cd > 0) return;
            const c = CARDS[s.id], range = c.range || 380;
            let use = false;
            switch (c.ai) {
                case 'engage': use = enemyVisible && dE < range && los; break;
                case 'escape': use = p.hp < p.maxHp * 0.45 && dE < 450; break;
                case 'buff': use = enemyVisible && dE < 520; break;
                case 'defend': use = incoming || (enemyVisible && dE < 160); break;
                case 'heal': use = p.hp < p.maxHp * 0.55; break;
                case 'reveal': use = !enemyVisible && world.time > 4; break;
                case 'place': use = enemyVisible && dE < 480; break;
            }
            if (use && Math.random() < 0.5 + settings.diff * 0.2) { out['s' + (i + 1)] = true; B.skillT = 0.6; }
        });
    }

    // tránh vùng lửa / hố đen của địch / dung nham đang cháy
    zones.forEach(zn => {
        const bad = (zn.type === 'fire' && zn.owner !== p.id && !p.pyro) || (zn.type === 'gravity' && zn.owner !== p.id) || (zn.type === 'lava' && !p.pyro && (lavaActive(zn) || lavaWarming(zn)));
        if (bad && dist(p.x, p.y, zn.x, zn.y) < zn.r + 30 && goalAng === null) goalAng = Math.atan2(p.y - zn.y, p.x - zn.x);
        else if (bad && dist(p.x, p.y, zn.x, zn.y) < zn.r + 30) goalAng = Math.atan2(p.y - zn.y, p.x - zn.x);
    });

    // --- 6. Di chuyển ---
    if (B.dodgeT > 0) goalAng = B.dodgeA;
    if (goalAng !== null) {
        const a = steer(p, goalAng);
        out.move = { x: Math.cos(a), y: Math.sin(a) };
    }
    // kẹt → đi lung tung một chút
    B.stuckT += dt;
    if (B.stuckT > 0.8) {
        if (dist(p.x, p.y, B.lastX, B.lastY) < 12 && goalAng !== null) { B.dodgeT = 0.45; B.dodgeA = Math.random() * Math.PI * 2; }
        B.stuckT = 0; B.lastX = p.x; B.lastY = p.y;
    }
    // tránh bẫy
    if (L.avoidTraps) crates.forEach(c => {
        if (c.type === 'TRAP' && dist(p.x, p.y, c.x, c.y) < 60) {
            const aw = Math.atan2(p.y - c.y, p.x - c.x); out.move.x += Math.cos(aw); out.move.y += Math.sin(aw);
            const m = Math.hypot(out.move.x, out.move.y) || 1; out.move.x /= m; out.move.y /= m;
        }
    });
    return out;
}

