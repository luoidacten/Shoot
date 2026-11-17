/** ==================== VÒNG ĐỜI TRẬN ĐẤU ==================== */
let gameState = 'MENU';
let currentRound = 1, currentDestiny = null, countdown = 0, koTimer = 0, roundEndingTimer = 0;
let heartTimer = 0;

function createPlayer(id) {
    const bot = (settings.mode === 'bot' && id === 1) || !!window.__botBoth; // __botBoth: chế độ xem bot tự đấu (test)
    return {
        id, color: id === 1 ? COLORS.p1 : COLORS.p2, label: bot ? 'BOT' : settings.mode === 'online' ? (id === 1 ? 'ĐỎ' : 'XANH') : id === 1 ? 'P1' : 'P2', isBot: bot, brain: bot ? createBrain() : null,
        score: 0, build: [], minor: [], roundPerks: [], inventory: [{ ...WEAPONS.KNIFE }, { ...WEAPONS.NONE }], weaponIdx: 0,
        stats: { dmg: 0, shots: 0, hits: 0, crates: 0 }
    };
}

function resetPlayerForRound(p) {
    p.maxHp = 130; p.maxArmor = 0; p.radius = 15;
    p.dmgMult = 1; p.vulnMult = 1; p.moveMult = 1; p.fireRateMult = 1; p.spreadMult = 1; p.cdMult = 1; p.meleeMult = 1;
    p.vampire = p.thorns = p.martyr = p.magnet = p.berserk = p.ghost = p.regen = p.blastRounds = false;
    p.aimshot = p.noMind = p.scavenger = p.eagle = p.silent = p.lastStand = p.hunter = p.quickSwap = p.pyro = p.zoneImmune = false;
    p.roundVamp = 0; p.regenDelay = 3;
    p.bounces = 0; p.aiSpread = 0;
    p.inventory = [{ ...WEAPONS.KNIFE }, { ...WEAPONS.NONE }]; p.weaponIdx = 0;
    applyBuild(p);
    p.hp = p.maxHp; p.ghostHp = p.maxHp; p.armor = p.maxArmor; p.tricksterUsed = false;
    p.x = p.id === 1 ? MAP_W / 2 - 340 : MAP_W / 2 + 340; p.y = MAP_H / 2;
    p.angle = p.id === 1 ? 0 : Math.PI;
    p.vx = p.vy = p.kx = p.ky = 0;
    p.cooldown = 0; p.dashTime = 0; p.recoil = 0; p.muzzle = 0; p.hitFlash = 0; p.stun = 0;
    p.spawnShield = 0; p.ghostT = 0; p.lastHurt = -10; p.dmgGhostDelay = 0; p.shotCount = 0;
    p.wasA = p.wasB = p.wasC = false; p.dead = false; p.zoneTick = 0;
    if (p.brain) p.brain = createBrain();
}

function startMatch() {
    AudioSys.init();
    saveSettings();
    paused = false;
    players.length = 0;
    players.push(createPlayer(1), createPlayer(2));
    currentRound = 1;
    AudioSys.startMusic(); AudioSys.setIntensity(0);
    openAugmentScreen(); // hiệp 1: chọn thẻ định hình trước khi vào trận
}

function startDestinyIntro() {
    gameState = 'DESTINY';
    // hiệp đầu luôn bình yên cho dễ làm quen; hiệp sau mới bốc thăm
    currentDestiny = currentRound === 1 ? DESTINIES[0] : DESTINIES[1 + Math.floor(Math.random() * (DESTINIES.length - 1))];
    if (net.role === 'host') netSend({ t: 'destiny', di: DESTINIES.indexOf(currentDestiny), rd: currentRound });
    clearFootprints();
    playDestinyRoll(currentDestiny, initRound);
}

function initRound() {
    resetWorld();
    generateMap(pickMapType());
    players.forEach(resetPlayerForRound);
    for (let i = 0; i < 12; i++) spawnCrate(true);
    if (currentDestiny) currentDestiny.apply();
    roundStartPerks();
    players.forEach(p => { p.ghostHp = p.hp; });
    camera.x = (players[0].x + players[1].x) / 2; camera.y = (players[0].y + players[1].y) / 2; camera.zoom = 0.6;
    fx.slowMo = 0; fx.hitStop = 0;
    countdown = 3; gameState = "COUNTDOWN"; AudioSys.play("count", 0.4);
    AudioSys.setIntensity(0);
    const mp = players.filter(p => p.score === settings.maxWins - 1);
    if (mp.length === 2) showBanner('TRẬN QUYẾT ĐỊNH', 'Ai thắng hiệp này là nhà vô địch!', '#ffd23f', 2.6, 54);
    else if (mp.length === 1) showBanner(`HIỆP ${currentRound}`, `${mp[0].label} chỉ cần 1 hiệp nữa — MATCH POINT!`, mp[0].color, 2.6, 54);
    else showBanner(`HIỆP ${currentRound}`, `${MAP_NAMES[world.mapType]} · ${currentDestiny.name}`, '#ffffff', 2.4, 58);
    players.forEach(p => { if (p.newCombos && p.newCombos.length) { const nm = p.newCombos.join(', '); setTimeout(() => floatText(p.x, p.y - 40, '⚡ ' + nm, '#fde047', 18, { life: 2.5 }), 900); p.newCombos = []; } });
    showScreen(null);
}

function killPlayer(dead, killerId) {
    if (dead.dead) return;
    dead.hp = 0; dead.dead = true;
    // nổ xác
    spark(dead.x, dead.y, dead.color, 40, 500, 0.9, 4); ring(dead.x, dead.y, 10, 140, dead.color, 0.6, 8);
    addDecal(dead.x, dead.y, 30, dead.color, 0.55, 8);
    smoke(dead.x, dead.y, 8);
    addShake(18); flash('#ffffff', 0.35); vibrate(200);
    if (dead.martyr) {
        floatText(dead.x, dead.y - 30, 'ÔM BOM!! 💣', '#ff4d5e', 22, { life: 1.4 });
        for (let i = 0; i < 3; i++) { const a = Math.random() * 6.28; items.push({ x: dead.x, y: dead.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 8, vx: Math.cos(a) * 280, vy: Math.sin(a) * 280, thrown: true, ownerId: dead.id, fuse: 1.1 + i * 0.15, z: 0, vz: 200 }); }
    }
    if (gameState === 'PLAYING') {
        gameState = 'KO'; koTimer = dead.martyr ? 2.6 : 1.8;
        fx.slowMo = 1.4; fx.zoomPunch = 1;
        camera.focus = { x: dead.x, y: dead.y };
        AudioSys.play('ko', 0.4);
        showBanner('K.O.!', '', '#ff4d5e', 1.6, 96);
    }
}

function finishRound() {
    const alive = players.filter(p => p.hp > 0);
    let text, sub = '', color = '#fff';
    if (alive.length === 1) {
        const w = alive[0]; w.score++;
        text = `${w.label} THẮNG HIỆP!`; color = w.color;
        if (w.hp <= w.maxHp * 0.15) sub = `Thoát chết trong gang tấc với ${Math.ceil(w.hp)} HP!`;
        else if (w.hp >= w.maxHp * 0.9) sub = 'Không một vết xước — HỦY DIỆT!';
    } else { text = 'HÒA!'; sub = 'Cả hai cùng nằm xuống…'; }
    showBanner(text, sub, color, 2.2, 54);
    gameState = 'ROUND_OVER'; roundEndingTimer = 2.4;
    camera.focus = null;
}

function updatePlayer(p, dt) {
    if (p.hp <= 0) return;
    const allowAct = gameState === 'PLAYING' || gameState === 'KO';
    let input = p.isBot ? botThink(p, dt) : (net.role === 'host' && p.id === 2) ? netRemoteInput() : readHumanInput(p.id);
    if (!allowAct || p.stun > 0) input = { move: { x: 0, y: 0 }, a: false, b: false, c: false, s1: false, s2: false };
    if (Math.hypot(input.move.x, input.move.y) > 0.2) p.moveDir = Math.atan2(input.move.y, input.move.x);
    const w = getCurrentWeapon(p);
    const enemy = enemyOf(p);

    p.recoil = Math.max(0, (p.recoil || 0) - dt * 8); p.muzzle = Math.max(0, p.muzzle - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt); p.stun = Math.max(0, p.stun - dt); p.spawnShield = Math.max(0, p.spawnShield - dt);
    // thanh máu "bóng" tụt chậm
    p.dmgGhostDelay -= dt;
    if (p.dmgGhostDelay <= 0) p.ghostHp += (p.hp - p.ghostHp) * Math.min(1, dt * 5); if (p.ghostHp < p.hp) p.ghostHp = p.hp;

    // Đổi vũ khí
    if (input.c && !p.wasC) {
        p.weaponIdx = otherSlot(p);
        const nw = getCurrentWeapon(p);
        floatText(p.x, p.y - 26, `${nw.icon} ${nw.name}`, '#fff', 13);
        AudioSys.play('ui'); if (!p.quickSwap) p.cooldown = Math.max(p.cooldown, 6);
    }
    p.wasC = input.c;
    // Kỹ năng
    if (allowAct) {
        if (input.s1 && !p.wasS1) castSkill(p, 0);
        if (input.s2 && !p.wasS2) castSkill(p, 1);
    }
    p.wasS1 = !!input.s1; p.wasS2 = !!input.s2;

    // Di chuyển (có quán tính; băng thì trơn)
    let speed = 175 * (w.moveScale || 1) * p.moveMult * (p.st.haste > 0 ? 1.5 : 1) * (p.st.slow > 0 ? 0.5 : 1);
    if (p.st.haste > 0 && Math.random() < 0.3) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, color: hexA(p.color, 0.35), size: p.radius * 0.8 });
    const tvx = input.move.x * speed, tvy = input.move.y * speed;
    const accel = world.ice ? 2.2 : 16;
    p.vx += (tvx - p.vx) * Math.min(1, accel * dt); p.vy += (tvy - p.vy) * Math.min(1, accel * dt);
    if (p.dashTime > 0) { p.dashTime -= dt; p.vx = Math.cos(p.dashAngle) * 720; p.vy = Math.sin(p.dashAngle) * 720; spark(p.x, p.y, '#7dd3fc', 2, 40, 0.3, 3); }
    // lực đẩy lùi
    p.x += (p.vx + p.kx) * dt; p.y += (p.vy + p.ky) * dt;
    const kd = Math.pow(world.ice ? 0.2 : 0.002, dt); p.kx *= kd; p.ky *= kd;
    resolveCircle(p, p.radius);

    // Ngắm tự động
    let target = p.angle;
    const range = w.type === 'GUN' || w.type === 'THROWABLE' ? w.range : 170;
    const tgt = p.dashTime <= 0 ? aimTargetFor(p, range * 1.3) : null; // địch hoặc phân thân
    if (tgt) target = Math.atan2(tgt.y - p.y, tgt.x - p.x);
    else if (Math.hypot(input.move.x, input.move.y) > 0.2) target = Math.atan2(input.move.y, input.move.x);
    if (p.dashTime <= 0) p.angle += angleDiff(target, p.angle) * Math.min(1, 14 * dt);

    // Bóng ma
    const moving = Math.hypot(input.move.x, input.move.y) > 0.1;
    if (p.ghost) { if (!moving && !input.a) p.ghostT += dt; else p.ghostT = Math.max(0, p.ghostT - dt * 3); }
    // Tái tạo
    if (p.regen && world.time - p.lastHurt > p.regenDelay && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 5 * dt);

    // Nam châm
    if (p.magnet) crates.forEach(c => {
        const d = dist(p.x, p.y, c.x, c.y);
        if (d < 360 && d > p.radius + 10) {
            const a = Math.atan2(p.y - c.y, p.x - c.x);
            c.x += Math.cos(a) * 140 * dt; c.y += Math.sin(a) * 140 * dt; resolveCircle(c, c.size / 2);
        }
    });

    // Nhặt hòm
    for (let i = crates.length - 1; i >= 0; i--) if (dist(p.x, p.y, crates[i].x, crates[i].y) < p.radius + crates[i].size / 2) openCrate(p, i);

    // Tấn công
    if (p.cooldown > 0) p.cooldown -= dt * 60;
    const pressA = input.a && !p.wasA; p.wasA = input.a;
    const pressB = input.b && !p.wasB; p.wasB = input.b;
    if (allowAct) {
        const trigger = w.automatic ? input.a : pressA;
        if (trigger && p.cooldown <= 0) useWeapon(p, w, enemy);
        if (pressB && w.id !== 'NONE') throwWeapon(p, w, enemy);
    }

    // Ngoài vòng bo
    const z = world.zone;
    if (dist(p.x, p.y, z.x, z.y) > z.r && !p.zoneImmune) {
        p.zoneTick = (p.zoneTick || 0) + dt;
        if (p.zoneTick > 0.25) {
            p.zoneTick = 0;
            const dps = world.zonePhase === 2 ? 22 : 10;
            dealDamage(p, dps * 0.25, -1, { zone: true, raw: true });
            spark(p.x, p.y, '#c084fc', 4, 120, 0.4, 2);
            floatText(p.x, p.y - 20, '-' + Math.round(dps * 0.25), '#c084fc', 12);
        }
    }
}

function updateCamera(dt) {
    const alive = players.filter(p => p.hp > 0);
    const W = SCREEN_W, H = SCREEN_H;
    let tx, ty, tz;
    const me = localPlayer();
    if (camera.focus && gameState === 'KO') {
        tx = camera.focus.x; ty = camera.focus.y; tz = Math.min(1.6, Math.max(W, H) / 900);
    } else if (fowActive()) {
        // sương mù chiến trận: camera bám theo chính mình, nhìn hơi về phía trước
        const f = me.hp > 0 ? me : (alive[0] || me);
        tx = f.x + Math.cos(f.angle) * 70; ty = f.y + Math.sin(f.angle) * 70;
        tz = Math.max(0.4, Math.min(1.2, Math.min(W, H) / (isTouch ? 660 : 860)));
    } else {
        const list = alive.length ? alive : players;
        const xs = list.map(p => p.x), ys = list.map(p => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
        tx = (minX + maxX) / 2; ty = (minY + maxY) / 2;
        const padX = 250, padY = 220;
        const hudPad = isTouch ? 0.78 : 0.86; // chừa chỗ cho HUD
        tz = Math.min(W * hudPad / (maxX - minX + padX), H * hudPad / (maxY - minY + padY));
        tz = Math.max(0.3, Math.min(tz, Math.min(W, H) / 380));
    }
    if (gameState === 'COUNTDOWN') tz *= 0.92 + (1 - countdown / 3) * 0.08;
    camera.x += (tx - camera.x) * Math.min(1, 5 * dt); camera.y += (ty - camera.y) * Math.min(1, 5 * dt);
    camera.zoom += (tz - camera.zoom) * Math.min(1, 3 * dt);
    const hw = W / 2 / camera.zoom, hh = H / 2 / camera.zoom;
    camera.x = hw * 2 > MAP_W + 200 ? MAP_W / 2 : Math.max(hw - 100, Math.min(MAP_W + 100 - hw, camera.x));
    camera.y = hh * 2 > MAP_H + 200 ? MAP_H / 2 : Math.max(hh - 100, Math.min(MAP_H + 100 - hh, camera.y));
}

function update(rawDt) {
    if (paused) return;
    if (net.role === 'guest') { guestUpdate(rawDt); return; }
    if (!['PLAYING', 'COUNTDOWN', 'KO', 'ROUND_OVER'].includes(gameState)) { updateFx(rawDt); return; }

    // khựng hình khi trúng đòn mạnh
    if (fx.hitStop > 0) { fx.hitStop -= rawDt; updateCamera(rawDt); return; }
    let dt = rawDt;
    if (fx.slowMo > 0) { fx.slowMo -= rawDt; dt *= 0.3; }
    updateFx(dt);

    if (gameState === 'COUNTDOWN') {
        const before = Math.ceil(countdown);
        countdown -= rawDt;
        if (Math.ceil(countdown) !== before && countdown > 0) AudioSys.play('count', 0.4);
        if (countdown <= 0) {
            gameState = 'PLAYING'; AudioSys.play('go', 0.4);
            players.forEach(p => p.spawnShield = 1.2);
            showBanner('ĐÁNH!', '', '#ffd23f', 0.9, 110);
        }
    }

    players.forEach(p => updatePlayer(p, dt));
    if (gameState !== 'COUNTDOWN') {
        updateWorld(dt);
        updateAbilities(dt);
        updateBullets(dt);
        updateItems(dt);
    }
    for (let i = slashes.length - 1; i >= 0; i--) { slashes[i].life -= dt; if (slashes[i].life <= 0) slashes.splice(i, 1); }
    for (let i = beams.length - 1; i >= 0; i--) { beams[i].life -= dt; if (beams[i].life <= 0) beams.splice(i, 1); }
    updateCamera(rawDt);
    updateFootprints(dt);
    if (net.role === 'host') netHostTick(rawDt);

    // tim đập khi máu thấp
    const low = players.some(p => !p.isBot && (localId() === null || p.id === localId()) && p.hp > 0 && p.hp < p.maxHp * 0.3);
    if (low && gameState === 'PLAYING') { heartTimer -= rawDt; if (heartTimer <= 0) { AudioSys.play('heart', 0.5); heartTimer = 0.85; } }

    if (gameState === 'KO') { koTimer -= rawDt; if (koTimer <= 0) finishRound(); }
    if (gameState === 'ROUND_OVER') {
        roundEndingTimer -= rawDt;
        if (roundEndingTimer <= 0) {
            if (players.some(p => p.score >= settings.maxWins)) showGameOver();
            else { currentRound++; openAugmentScreen(); }
        }
    }
}
