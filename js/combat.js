/** ==================== CHIẾN ĐẤU ==================== */
function getCurrentWeapon(p) {
    if (!p.inventory || !p.inventory.length) return WEAPONS.NONE;
    if (!(p.weaponIdx >= 0 && p.weaponIdx < p.inventory.length)) p.weaponIdx = 0;
    return p.inventory[p.weaponIdx] || WEAPONS.NONE;
}
function otherSlot(p) { return 1 - p.weaponIdx; }
function angleDiff(a, b) { let d = a - b; while (d < -Math.PI) d += Math.PI * 2; while (d > Math.PI) d -= Math.PI * 2; return d; }
function enemyOf(p) { return players.find(e => e.id !== p.id); }

function useWeapon(p, wep, enemy) {
    p.cooldown = wep.fireRate * p.fireRateMult * (p.st && p.st.rage > 0 ? 0.75 : 1);
    p.ghostT = 0;
    const empowered = p.st && p.st.empower > 0 && wep.id !== 'NONE';
    const isSuper = p.aimshot && p.superCharge >= p.superNeed;

    if (wep.type === 'GUN') {
        if (wep.ammo <= 0) {
            floatText(p.x, p.y - 20, 'Hết đạn!', '#cbd5e1', 13); AudioSys.play('ui');
            const o = p.inventory[otherSlot(p)];
            if (o && o.id !== 'NONE' && !(o.type === 'GUN' && o.ammo <= 0)) { p.weaponIdx = otherSlot(p); floatText(p.x, p.y, o.name, '#fff', 13); }
            return;
        }
        onAttack(p);
        if (empowered) p.st.empower--;
        if (!world.infiniteAmmo) wep.ammo--;
        p.stats.shots++;
        p.recoil = 1;
        const mX = p.x + Math.cos(p.angle) * (p.radius + wep.len * 0.7), mY = p.y + Math.sin(p.angle) * (p.radius + wep.len * 0.7);
        p.muzzle = 0.06;
        directionalSpark(mX, mY, p.angle, '#ffe08a', 4, 380, 0.5);

        if (wep.hitscan) { fireRail(p, mX, mY, wep, enemy); return; }
        if (wep.id === 'ROCKET') {
            AudioSys.playAt('shoot_heavy', p.x, p.y); addShake(6);
            bullets.push({ x: mX, y: mY, px: mX, py: mY, angle: p.angle + (Math.random() - 0.5) * p.spreadMult * 0.08, speed: wep.speed, damage: 0, life: 3, owner: p.id, color: '#ff7a1a', explosive: true, size: 6, bounces: 0 });
            p.kx -= Math.cos(p.angle) * 260; p.ky -= Math.sin(p.angle) * 260;
            return;
        }
        if (wep.id === 'SNIPER') { AudioSys.playAt('shoot_heavy', p.x, p.y); addShake(5); }
        else if (wep.id === 'SHOTGUN') { AudioSys.playAt('shotgun', p.x, p.y); addShake(5); p.kx -= Math.cos(p.angle) * 120; p.ky -= Math.sin(p.angle) * 120; }
        else if (wep.automatic) { AudioSys.playAt('smg', p.x, p.y, 0.2); addShake(1); }
        else { AudioSys.playAt('shoot', p.x, p.y); addShake(2); }
        if (wep.id === 'MINIGUN') { p.kx -= Math.cos(p.angle) * 20; p.ky -= Math.sin(p.angle) * 20; }

        const count = wep.count || 1;
        const every = combo(p, 'aim_explosive') ? 7 : 5;
        for (let i = 0; i < count; i++) {
            p.shotCount = (p.shotCount || 0) + 1;
            const blast = (p.blastRounds && p.shotCount % every === 0) || (empowered && combo(p, 'reload_explosive') && i === 0);
            const spread = (Math.random() - 0.5) * wep.spread * p.spreadMult + (Math.random() - 0.5) * (p.aiSpread || 0);
            const sp = wep.speed * (count > 1 ? 0.85 + Math.random() * 0.3 : 1);
            bullets.push({
                x: mX, y: mY, px: mX, py: mY, angle: p.angle + spread, speed: sp, damage: wep.damage * (empowered ? 1.5 : 1), life: wep.range / (sp * 60) + 0.15, owner: p.id,
                color: wep.id === 'SNIPER' ? '#e9d5ff' : blast ? '#ff7a1a' : empowered ? '#fde047' : p.id === 1 ? '#ffb3a8' : '#bfe3ff',
                pierce: !!wep.pierce, bounces: p.bounces || 0, size: wep.id === 'SNIPER' ? 4 : blast ? 5 : 2.6, knock: wep.knock || 60,
                explosive: blast, blastSmall: blast, trail: wep.id === 'SNIPER' ? 90 : 26, burn: p.pyro
            });
        }
        if (isSuper) fireSuper(p, mX, mY);
    } else if (wep.type === 'THROWABLE') {
        throwGrenade(p, wep, enemy);
    } else if (wep.type === 'MELEE' || wep.type === 'SHIELD') {
        AudioSys.playAt('swing', p.x, p.y);
        onAttack(p);
        if (empowered) p.st.empower--;
        const isShield = wep.type === 'SHIELD';
        if (wep.dash) { p.dashTime = 0.17; p.dashAngle = p.angle; smoke(p.x, p.y, 3, 'rgba(56,189,248,0.3)', 10); }
        else if (!isShield) { p.kx += Math.cos(p.angle) * 180; p.ky += Math.sin(p.angle) * 180; }
        const reach = (isShield ? 34 : wep.range) * (combo(p, 'sword_brawler') ? 1.25 : 1) * (isSuper ? 1.6 : 1);
        if (isSuper) { p.superCharge = 0; ring(p.x, p.y, 10, reach + p.radius, '#fde047', 0.3, 6); floatText(p.x, p.y - 36, 'SIÊU ĐÒN!', '#fde047', 18); }
        // chém trúng phân thân
        for (let i = decoys.length - 1; i >= 0; i--) { const d = decoys[i]; if (d.owner !== p.id && dist(p.x, p.y, d.x, d.y) < p.radius + d.radius + reach) d.hp = 0; }
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: p.angle, range: reach + p.radius, color: wep.id === 'KATANA' ? '#7dd3fc' : isShield ? '#94a3b8' : '#f1f5f9', width: wep.id === 'KATANA' ? 10 : 6, life: 0.16, maxLife: 0.16, swing: p.swingDir = -(p.swingDir || 1) });

        // Katana: chém trúng đạn → phản đạn lại!
        if (wep.id === 'KATANA') {
            bullets.forEach(b => {
                if (b.owner !== p.id && dist(p.x, p.y, b.x, b.y) < 100 && !b.explosive) {
                    b.owner = p.id; b.angle = Math.atan2(b.y - p.y, b.x - p.x); b.life = 1.2; b.color = '#7dd3fc';
                    spark(b.x, b.y, '#7dd3fc', 5, 200); floatText(b.x, b.y, 'PHẢN!', '#7dd3fc', 14);
                }
            });
        }
        // khối gỗ phía trước
        const fx_ = p.x + Math.cos(p.angle) * (p.radius + reach * 0.6), fy_ = p.y + Math.sin(p.angle) * (p.radius + reach * 0.6);
        const o = pointInObstacle(fx_, fy_, 10); if (o) damageObstacle(o, wep.damage);

        if (enemy && enemy.hp > 0 && dist(p.x, p.y, enemy.x, enemy.y) < p.radius + enemy.radius + reach) {
            const d = angleDiff(Math.atan2(enemy.y - p.y, enemy.x - p.x), p.angle);
            if (Math.abs(d) < Math.PI / 1.8) {
                const ang = Math.atan2(enemy.y - p.y, enemy.x - p.x);
                p.stats.hits++;
                const md = wep.damage * (p.meleeMult || 1) * (empowered ? 1.5 : 1) * (isSuper ? 2.5 : 1);
                dealDamage(enemy, md, p.id, { angle: ang, knock: isShield ? 520 : isSuper ? 600 : wep.id === 'KATANA' ? 260 : 160, melee: true, burn: p.pyro, super: isSuper });
                if (wep.id !== 'NONE' && !isShield) reduceDurability(p, wep, 1);
                hitStop(wep.id === 'KATANA' ? 0.09 : 0.05); addShake(5);
            }
        }
        p.stats.shots++;
    }
}

/** Siêu đòn (Nhắm Bắn): viên đạn lớn xuyên thấu */
function fireSuper(p, mX, mY) {
    p.superCharge = 0;
    const boom = combo(p, 'aim_explosive');
    bullets.push({ x: mX, y: mY, px: mX, py: mY, angle: p.angle, speed: 24, damage: 55, life: 1.1, owner: p.id, color: '#fde047', size: 9, knock: 420, bounces: 0, pierce: true, super: true, trail: 80, explosive: boom, blastSmall: boom });
    AudioSys.playAt('rail', p.x, p.y, 0.3); addShake(7); flash('#fde047', 0.08);
    floatText(p.x, p.y - 36, 'SIÊU ĐÒN!', '#fde047', 18);
}

function fireRail(p, mX, mY, wep, enemy) {
    AudioSys.playAt('rail', p.x, p.y); addShake(9); flash('#22d3ee', 0.15);
    const L = 2600, ex = mX + Math.cos(p.angle) * L, ey = mY + Math.sin(p.angle) * L;
    beams.push({ x1: mX, y1: mY, x2: ex, y2: ey, life: 0.35, maxLife: 0.35, color: '#22d3ee' });
    p.kx -= Math.cos(p.angle) * 300; p.ky -= Math.sin(p.angle) * 300;
    obstacles.slice().forEach(o => { if (segRect(mX, mY, ex, ey, o) >= 0) damageObstacle(o, 60); });
    if (enemy && enemy.hp > 0) {
        // khoảng cách từ địch tới tia
        const dx = ex - mX, dy = ey - mY, t = Math.max(0, Math.min(1, ((enemy.x - mX) * dx + (enemy.y - mY) * dy) / (dx * dx + dy * dy)));
        if (dist(enemy.x, enemy.y, mX + dx * t, mY + dy * t) < enemy.radius + 8) {
            p.stats.hits++;
            dealDamage(enemy, wep.damage, p.id, { angle: p.angle, knock: wep.knock });
            hitStop(0.08);
        }
    }
    for (let i = 0; i < 30; i++) { const t = Math.random(); spark(mX + (ex - mX) * t * 0.5, mY + (ey - mY) * t * 0.5, '#67e8f9', 1, 80, 0.4, 2); }
}

function throwGrenade(p, wep, enemy) {
    if (!world.infiniteAmmo) wep.ammo--;
    let ang = p.angle, d = 320;
    if (enemy && enemy.hp > 0) { const de = dist(p.x, p.y, enemy.x, enemy.y); if (de < 650) { ang = Math.atan2(enemy.y - p.y, enemy.x - p.x); d = de; } }
    d = Math.min(520, Math.max(90, d));
    items.push({ x: p.x, y: p.y, type: { ...WEAPONS.GRENADE }, angle: 0, spin: 12, vx: Math.cos(ang) * d * 3.1, vy: Math.sin(ang) * d * 3.1, thrown: true, ownerId: p.id, fuse: 1.5, z: 0, vz: 260 });
    AudioSys.playAt('whoosh', p.x, p.y, 0.3);
    if (wep.ammo <= 0) p.inventory[p.weaponIdx] = { ...WEAPONS.NONE };
}

function throwWeapon(p, wep, enemy) {
    if (wep.id === 'NONE') return;
    if (wep.type === 'THROWABLE') { if (p.cooldown <= 0) { throwGrenade(p, wep, enemy); p.cooldown = wep.fireRate; } return; }
    p.inventory[p.weaponIdx] = { ...WEAPONS.NONE };
    let ang = p.angle;
    if (enemy && enemy.hp > 0 && dist(p.x, p.y, enemy.x, enemy.y) < 650) ang = Math.atan2(enemy.y - p.y, enemy.x - p.x);
    const dmg = wep.type === 'GUN' ? 14 + (wep.tier || 1) * 7 : Math.max(20, wep.damage * 0.8);
    items.push({ x: p.x, y: p.y, type: wep, angle: Math.random() * 6, spin: 18, vx: Math.cos(ang) * 900, vy: Math.sin(ang) * 900, thrown: true, ownerId: p.id, fuse: 0, dmg });
    AudioSys.playAt('whoosh', p.x, p.y, 0.35);
    floatText(p.x, p.y - 18, 'NÉM!', '#f5b100', 13);
}

function reduceDurability(p, wep, amount) {
    if (wep.durability === undefined) return;
    wep.durability -= amount;
    if (wep.durability <= 0) {
        floatText(p.x, p.y - 20, 'Gãy!', '#ff4d5e', 14); spark(p.x, p.y, wep.color, 10, 200);
        const i = p.inventory.indexOf(wep); if (i >= 0) p.inventory[i] = { ...WEAPONS.NONE };
    }
}

/** Gây sát thương — trung tâm của mọi hiệu ứng "đã tay" */
function dealDamage(target, baseDmg, attackerId, opts = {}) {
    if (target.hp <= 0 || baseDmg <= 0) return;
    if (target.spawnShield > 0 && !opts.zone) return;
    const attacker = attackerId !== -1 ? players.find(p => p.id === attackerId) : null;
    let mult = 1;
    if (attacker && !opts.raw) {
        mult *= attacker.dmgMult;
        if (attacker.berserk) mult *= 1 + (1 - Math.max(0, attacker.hp) / attacker.maxHp);
    }
    const st = target.st || {};
    if (st.invuln > 0) return;
    if (attacker && attacker !== target && !opts.raw) {
        if (attacker.st && attacker.st.rage > 0) mult *= 1.4;
        if (attacker.eagle && dist(attacker.x, attacker.y, target.x, target.y) > 300) mult *= 1.15;
        if (attacker.hunter && target.hp < target.maxHp * 0.5) mult *= 1.1;
        if (attacker.st && attacker.st.ambush > 0 && !opts.zone) { mult *= 1.3; attacker.st.ambush = 0; floatText(attacker.x, attacker.y - 30, 'ÁM SÁT!', '#c084fc', 14); }
        if (st.mark > 0) mult *= combo(attacker, 'flare_hunter') ? 1.25 : 1.15;
    }
    let dmg = baseDmg * mult * (opts.raw ? 1 : target.vulnMult);

    // khiên năng lượng
    if (st.shield > 0 && !opts.zone) {
        const a = Math.min(st.shield, dmg); st.shield -= a; dmg -= a;
        spark(target.x, target.y, '#67e8f9', 5, 160, 0.3, 2);
        if (st.shield <= 0) {
            st.shieldT = 0; ring(target.x, target.y, 10, 60, '#67e8f9', 0.3);
            if (combo(target, 'shield_thorns')) {
                ring(target.x, target.y, 10, 110, '#facc15', 0.4, 6);
                const e = enemyOf(target);
                if (e && e.hp > 0 && dist(e.x, e.y, target.x, target.y) < 110 + e.radius) dealDamage(e, 40, target.id, { noThorns: true, knock: 400 });
            }
        }
        if (dmg <= 0.01) return;
    }

    if (target.armor > 0 && !opts.zone) {
        const absorbed = Math.min(target.armor, dmg * 0.6);
        target.armor -= absorbed; dmg -= absorbed;
        spark(target.x, target.y, COLORS.armor, 4, 150, 0.3, 2);
    }

    // Bất Khuất
    if (target.hp - dmg <= 0 && target.lastStand && !target.lastStandUsed && target.maxHp > 1) {
        target.lastStandUsed = true;
        const god = combo(target, 'titan_last');
        target.hp = god ? target.maxHp * 0.3 : 1; st.invuln = god ? 3 : 1.5;
        ring(target.x, target.y, 10, 90, '#fde047', 0.5, 6); spark(target.x, target.y, '#fde047', 24, 300);
        floatText(target.x, target.y - 30, 'BẤT KHUẤT!', '#fde047', 22, { life: 1.3 });
        addShake(8); AudioSys.play('trick'); return;
    }

    target.hp -= dmg;
    target.hitFlash = 0.1; target.lastHurt = world.time; target.ghostT = 0;
    target.dmgGhostDelay = 0.45;
    const ang = opts.angle !== undefined ? opts.angle : attacker ? Math.atan2(target.y - attacker.y, target.x - attacker.x) : Math.random() * 6.28;
    if (opts.knock) { target.kx += Math.cos(ang) * opts.knock; target.ky += Math.sin(ang) * opts.knock; }
    if (!opts.zone) {
        createBlood(target.x, target.y, target.color, ang);
        damageNumber(target.x, target.y, dmg, dmg >= 40);
        AudioSys.playAt(dmg >= 40 ? 'crit' : 'hit', target.x, target.y, 0.3);
        addShake(Math.min(10, 2 + dmg / 10));
        vibrate(dmg >= 40 ? 60 : 20);
    }
    if (attacker && attacker !== target) { attacker.stats.dmg += dmg; }
    if (opts.burn && st.burn !== undefined && !target.pyro) { st.burn = Math.max(st.burn, 2); st.burnBy = attackerId; }
    if (opts.slow && st.slow !== undefined) { st.slow = Math.max(st.slow, opts.slow); floatText(target.x, target.y - 34, 'CHẬM!', '#93c5fd', 13); }

    if (attacker && attacker !== target && attacker.hp > 0 && !opts.zone) {
        const vamp = (attacker.vampire ? 0.25 : 0) + (attacker.roundVamp || 0);
        let heal = dmg * vamp;
        if (opts.storm && combo(attacker, 'storm_vampire')) heal += 8;
        if (heal > 0) { attacker.hp = Math.min(attacker.hp + heal, attacker.maxHp); spark(attacker.x, attacker.y, '#4ade80', 3, 80, 0.4, 2); }
        if (attacker.aimshot && !opts.super && !opts.noCharge && attacker.superCharge < attacker.superNeed) {
            attacker.superCharge++;
            if (attacker.superCharge >= attacker.superNeed) { floatText(attacker.x, attacker.y - 36, 'SIÊU ĐÒN SẴN SÀNG!', '#fde047', 14); AudioSys.playAt('select', attacker.x, attacker.y, 0.3); }
        }
    }
    if (target.thorns && attacker && attacker !== target && !opts.noThorns && attacker.hp > 0) {
        floatText(attacker.x, attacker.y - 22, 'Phản!', '#facc15', 13);
        const k = combo(target, 'thorns_armor') && target.armor > 0 ? 0.6 : 0.3;
        dealDamage(attacker, dmg * k, target.id, { noThorns: true, raw: true, noCharge: true });
    }
    if (target.hp <= 0) killPlayer(target, attacker && attacker !== target ? attacker.id : enemyOf(target).id);
}

function explode(x, y, ownerId, dmgMax = 120, radius = 160) {
    explosionFx(x, y, radius);
    AudioSys.playAt('explosion', x, y, 0.4, 2200);

    obstacles.slice().forEach(o => {
        const nx = Math.max(o.x, Math.min(x, o.x + o.w)), ny = Math.max(o.y, Math.min(y, o.y + o.h));
        if (dist(x, y, nx, ny) < radius) damageObstacle(o, dmgMax);
    });
    for (let i = crates.length - 1; i >= 0; i--) {
        const c = crates[i];
        if (c.type === 'TRAP' && dist(x, y, c.x, c.y) < radius * 0.7) { crates.splice(i, 1); setTimeout(() => { if (gameState === 'PLAYING' || gameState === 'KO') explode(c.x, c.y, ownerId, 60, 130); }, 120); }
    }
    players.forEach(p => {
        if (p.hp <= 0) return;
        const d = dist(x, y, p.x, p.y);
        if (d < radius + p.radius) {
            let dmg = dmgMax * Math.max(0.15, 1 - d / (radius + p.radius));
            const w = getCurrentWeapon(p);
            if (w.id === 'SHIELD' && Math.abs(angleDiff(Math.atan2(y - p.y, x - p.x), p.angle)) < Math.PI / 2.5) { dmg *= 0.3; reduceDurability(p, w, 30); }
            const self = ownerId === p.id;
            if (self) dmg *= 0.5;
            dealDamage(p, dmg, self ? -1 : ownerId, { angle: Math.atan2(p.y - y, p.x - x), knock: 520 });
        }
    });
}

/** Mở hòm thính */
function openCrate(p, index) {
    const crate = crates[index];
    const cur = getCurrentWeapon(p);

    if (crate.type === 'TRAP') {
        crates.splice(index, 1);
        floatText(p.x, p.y - 30, 'BẪY!! 💀', '#ff4d5e', 22);
        explode(crate.x, crate.y, -1, 55, 120);
        return;
    }
    if (crate.type === 'SUPPORT') {
        crates.splice(index, 1); p.stats.crates++;
        AudioSys.play('pickup');
        const roll = Math.random();
        if (roll < 0.4 || (roll >= 0.7 && cur.type !== 'GUN' && cur.type !== 'THROWABLE')) {
            const amt = (roll < 0.4 ? 45 : 30) * (p.scavenger ? 2 : 1);
            p.hp = Math.min(p.hp + amt, p.maxHp); spark(p.x, p.y, '#4ade80', 10, 120); floatText(p.x, p.y - 24, `+${amt} HP`, '#4ade80', 16);
        } else if (roll < 0.7) {
            const cap = Math.max(150, p.maxArmor);
            p.armor = Math.min(p.armor + 50, cap); spark(p.x, p.y, COLORS.armor, 10, 120); floatText(p.x, p.y - 24, '+50 GIÁP', COLORS.armor, 16);
        } else {
            const max = WEAPONS[cur.id].ammo;
            cur.ammo = Math.min(cur.ammo + Math.ceil(max * 0.6), max); floatText(p.x, p.y - 24, '+ĐẠN', '#fbbf24', 16);
        }
        return;
    }

    let key;
    if (crate.type === 'LEGEND') key = LEGEND_POOL[Math.floor(Math.random() * LEGEND_POOL.length)];
    else {
        let total = 0; for (const k in BASE_WEIGHTS) total += BASE_WEIGHTS[k];
        let r = Math.random() * total; key = 'SMG';
        for (const k in BASE_WEIGHTS) { if (r < BASE_WEIGHTS[k]) { key = k; break; } r -= BASE_WEIGHTS[k]; }
    }
    const nw = { ...WEAPONS[key] };

    // Trùng loại → nạp đầy
    const same = p.inventory.findIndex(w => w.id === nw.id);
    if (same >= 0) {
        const w = p.inventory[same];
        if (w.ammo !== undefined) w.ammo = Math.min(w.ammo + nw.ammo, WEAPONS[nw.id].ammo);
        if (w.durability !== undefined) w.durability = w.maxDurability;
        crates.splice(index, 1); p.stats.crates++;
        AudioSys.play('pickup'); floatText(p.x, p.y - 24, 'NẠP ' + nw.name, '#fde68a', 15);
        return;
    }
    // Chọn ô: ưu tiên ô yếu (tay không / dao). Thính vàng thì thay ô yếu hơn.
    let slot = -1;
    if (cur.tier <= 1) slot = p.weaponIdx;
    else if (p.inventory[otherSlot(p)].tier <= 1) slot = otherSlot(p);
    else if (crate.type === 'LEGEND') slot = p.inventory[0].tier <= p.inventory[1].tier ? 0 : 1;
    if (slot < 0) {
        if (!p.fullMsgT || world.time - p.fullMsgT > 1.5) { floatText(p.x, p.y - 24, 'Túi đầy — ném bớt (B)', '#94a3b8', 12); p.fullMsgT = world.time; }
        return;
    }
    crates.splice(index, 1); p.stats.crates++;
    p.inventory[slot] = nw; p.weaponIdx = slot;
    if (nw.legendary || crate.type === 'LEGEND') {
        AudioSys.play('legend', 0.4); ring(p.x, p.y, 10, 90, '#ffd23f', 0.5, 5);
        floatText(p.x, p.y - 30, '★ ' + nw.name.toUpperCase() + ' ★', '#ffd23f', 22, { life: 1.4 });
        showBanner(`${p.label} NHẶT ${nw.name.toUpperCase()}!`, '', p.color, 1.3, 36);
    } else {
        AudioSys.play('pickup');
        floatText(p.x, p.y - 24, nw.icon + ' ' + nw.name, '#fde68a', 16);
    }
}

/** Đạn */
function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.px = b.x; b.py = b.y;
        b.x += Math.cos(b.angle) * b.speed * 60 * dt; b.y += Math.sin(b.angle) * b.speed * 60 * dt;
        b.life -= dt;
        if (b.explosive && !b.blastSmall && Math.random() < 0.7) particles.push({ x: b.px, y: b.py, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, life: 0.5, maxLife: 0.5, color: 'rgba(120,120,130,0.4)', size: 6, grow: 18, drag: 0.95 });
        let dead = false;

        // tường biên
        if (b.x < 0 || b.x > MAP_W || b.y < 0 || b.y > MAP_H) {
            if (b.bounces > 0) { b.bounces--; if (b.x < 0 || b.x > MAP_W) b.angle = Math.PI - b.angle; else b.angle = -b.angle; b.x = Math.max(1, Math.min(MAP_W - 1, b.x)); b.y = Math.max(1, Math.min(MAP_H - 1, b.y)); }
            else dead = true;
        }
        // vật cản
        if (!dead) {
            for (const o of obstacles) {
                const t = segRect(b.px, b.py, b.x, b.y, o);
                if (t < 0) continue;
                const hx = b.px + (b.x - b.px) * t, hy = b.py + (b.y - b.py) * t;
                if (b.pierce) { if (!b.pierced) { b.pierced = new Set(); } if (!b.pierced.has(o)) { b.pierced.add(o); damageObstacle(o, 40); spark(hx, hy, '#e9d5ff', 6, 200); } continue; }
                if (o.wood) damageObstacle(o, b.damage || 30);
                if ((b.bounces > 0 || o.reflect) && !b.explosive) {
                    if (o.reflect) { b.owner = obstacleOwnerFlip(b); b.color = '#bae6fd'; } else b.bounces--;
                    const fromLeftRight = b.px < o.x || b.px > o.x + o.w;
                    b.angle = fromLeftRight ? Math.PI - b.angle : -b.angle;
                    b.x = hx; b.y = hy;
                    spark(hx, hy, '#fde68a', 4, 160, 0.25, 2);
                } else {
                    dead = true; b.x = hx; b.y = hy;
                    spark(hx, hy, o.wood ? '#c08a52' : '#cbd5e1', 5, 180, 0.25, 2);
                }
                break;
            }
        }
        // bẫy
        if (!dead) {
            for (let c = crates.length - 1; c >= 0; c--) {
                const cr = crates[c];
                if (cr.type === 'TRAP' && dist(b.x, b.y, cr.x, cr.y) < cr.size * 0.7) { crates.splice(c, 1); explode(cr.x, cr.y, b.owner, 60, 130); dead = true; break; }
            }
        }
        // người chơi
        if (!dead) {
            for (const p of players) {
                if (p.id === b.owner || p.hp <= 0) continue;
                // khoảng cách điểm tới đoạn đường đạn
                const dx = b.x - b.px, dy = b.y - b.py, L = dx * dx + dy * dy || 1;
                const t = Math.max(0, Math.min(1, ((p.x - b.px) * dx + (p.y - b.py) * dy) / L));
                if (dist(p.x, p.y, b.px + dx * t, b.py + dy * t) < p.radius + b.size + 2) {
                    const w = getCurrentWeapon(p);
                    if (p.st && p.st.reflect > 0 && !b.hook) {
                        // Phản Xạ: bẻ ngược viên đạn
                        b.owner = p.id; b.angle += Math.PI; b.life = 1.2; b.color = '#fde047'; b.x = b.px; b.y = b.py;
                        spark(b.x, b.y, '#fde047', 5, 200, 0.25, 2); AudioSys.playAt('block', p.x, p.y, 0.25);
                        break;
                    }
                    if (w.id === 'SHIELD' && !b.explosive && !b.hook && Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) < Math.PI / 2.4) {
                        spark(b.x, b.y, '#e2e8f0', 6, 220, 0.3, 2); AudioSys.playAt('block', p.x, p.y, 0.3); reduceDurability(p, w, b.damage > 50 ? 40 : 10);
                    } else if (!b.explosive || b.super) {
                        const owner = players.find(q => q.id === b.owner); if (owner) owner.stats.hits++;
                        dealDamage(p, b.damage, b.owner, { angle: b.angle, knock: b.knock, burn: b.burn, slow: b.freeze ? 2.5 : 0, storm: b.storm, super: b.super });
                        if (b.hook) hookHit(owner, p);
                        if (b.freeze) ring(p.x, p.y, 5, 40, '#93c5fd', 0.3);
                        if (b.damage >= 50) hitStop(0.07);
                    }
                    dead = true; break;
                }
            }
        }
        // phân thân
        if (!dead) {
            for (const d of decoys) {
                if (d.owner === b.owner) continue;
                if (dist(b.x, b.y, d.x, d.y) < d.radius + b.size + 2) { d.hp -= b.damage || 20; spark(b.x, b.y, d.color, 5, 150); dead = true; break; }
            }
        }
        if (dead && b.explosive) {
            if (b.blastSmall) explode(b.x, b.y, b.owner, 40, 90); else explode(b.x, b.y, b.owner, 130, 170);
        }
        if (dead || b.life <= 0) {
            if (!dead && b.explosive && !b.blastSmall) explode(b.x, b.y, b.owner, 130, 170);
            bullets.splice(i, 1);
        }
    }
}

/** Tường gương (Gương Băng) phản đạn: đạn đổi chủ sang người dựng tường */
function obstacleOwnerFlip(b) {
    const e = players.find(q => q.id !== b.owner);
    return e ? e.id : b.owner;
}

/** Vật ném: lựu đạn, vũ khí bị ném */
function updateItems(dt) {
    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it.fuse > 0) {
            it.fuse -= dt;
            if (it.fuse <= 0 && it.type.id === 'GRENADE') { explode(it.x, it.y, it.ownerId, 110, 160); items.splice(i, 1); continue; }
            if (it.fuse <= 0 && it.skill) { landSkillItem(it); items.splice(i, 1); continue; }
        }
        if (it.z !== undefined) { it.vz -= 900 * dt; it.z = Math.max(0, it.z + it.vz * dt); if (it.z === 0) it.vz = Math.abs(it.vz) * 0.4 > 40 ? Math.abs(it.vz) * 0.4 : 0; }
        if (!it.thrown) continue;
        const ox = it.x, oy = it.y;
        it.x += it.vx * dt; it.y += it.vy * dt;
        const k = Math.pow(0.95, dt * 60); it.vx *= k; it.vy *= k;
        it.angle += it.spin * dt;
        if (it.x < 5 || it.x > MAP_W - 5) { it.vx *= -0.6; it.x = ox; }
        if (it.y < 5 || it.y > MAP_H - 5) { it.vy *= -0.6; it.y = oy; }
        const o = pointInObstacle(it.x, it.y, 4);
        if (o) {
            const fromSide = ox < o.x - 4 || ox > o.x + o.w + 4;
            if (fromSide) it.vx *= -0.6; else it.vy *= -0.6;
            it.x = ox; it.y = oy;
            if (it.type.id !== 'GRENADE' && !it.skill) { if (o.wood) damageObstacle(o, it.dmg || 20); spark(it.x, it.y, '#cbd5e1', 5, 150); items.splice(i, 1); continue; }
        }
        let removed = false;
        for (const p of players) {
            if (p.id === it.ownerId || p.hp <= 0) continue;
            if (dist(it.x, it.y, p.x, p.y) < p.radius + 12) {
                if (it.type.id === 'GRENADE' || it.skill) { it.vx *= -0.4; it.vy *= -0.4; it.x = ox; it.y = oy; }
                else {
                    dealDamage(p, it.dmg || 20, it.ownerId, { angle: Math.atan2(it.vy, it.vx), knock: 380 });
                    p.stun = 0.35; floatText(p.x, p.y - 30, 'CHOÁNG!', '#f5b100', 14);
                    hitStop(0.06); items.splice(i, 1); removed = true;
                }
                break;
            }
        }
        if (removed) continue;
        if (Math.abs(it.vx) < 25 && Math.abs(it.vy) < 25) {
            if (it.type.id === 'GRENADE' || it.skill) it.thrown = false;
            else { spark(it.x, it.y, '#94a3b8', 3, 60); items.splice(i, 1); }
        }
    }
}
