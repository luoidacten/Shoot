/** ==================== CHIẾN ĐẤU ==================== */
function getCurrentWeapon(p) {
    if (!p.inventory || !p.inventory.length) return WEAPONS.NONE;
    if (!(p.weaponIdx >= 0 && p.weaponIdx < p.inventory.length)) p.weaponIdx = 0;
    return p.inventory[p.weaponIdx] || WEAPONS.NONE;
}
function otherSlot(p) { return 1 - p.weaponIdx; }
function angleDiff(a, b) { let d = a - b; while (d < -Math.PI) d += Math.PI * 2; while (d > Math.PI) d -= Math.PI * 2; return d; }

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
        if (entrenched(attacker)) mult *= 1.25;
    }
    if (!opts.zone && !opts.raw) {
        if (entrenched(target)) mult *= combo(target, 'fortress') ? 0.65 : 0.8;
        if (st.anchor > 0) mult *= 0.6;
        if (target.reloadShield && getCurrentWeapon(target).reloading) mult *= 0.7;
        if (opts.melee && attacker) { const sw = getCurrentWeapon(target); if (sw.type === 'SHIELD' && Math.abs(angleDiff(Math.atan2(attacker.y - target.y, attacker.x - target.x), target.angle)) < Math.PI / 2.4) { mult *= 0.3; reduceDurability(target, sw, 8); spark(target.x, target.y, '#e2e8f0', 6, 200, 0.3, 2); } }
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
                enemiesOf(target).forEach(e => { if (dist(e.x, e.y, target.x, target.y) < 110 + e.radius) dealDamage(e, 40, target.id, { noThorns: true, knock: 400 }); });
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
    if (attacker && attacker !== target) { attacker.stats.dmg += dmg; target.lastHitBy = attacker.id; }
    if (opts.burn && st.burn !== undefined && !target.pyro) { st.burn = Math.max(st.burn, 2); st.burnBy = attackerId; }
    if (opts.slow && st.slow !== undefined) { st.slow = Math.max(st.slow, opts.slow); floatText(target.x, target.y - 34, 'CHẬM!', '#93c5fd', 13); }

    if (attacker && attacker !== target && attacker.hp > 0 && !opts.zone) {
        const vamp = (attacker.vampire ? (combo(attacker, 'regen_vamp') ? 0.18 : 0.25) : 0) + (attacker.roundVamp || 0);
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
        const k = (combo(target, 'thorns_armor') && target.armor > 0) || (combo(target, 'ironStatue') && st.anchor > 0) ? 0.6 : 0.3;
        dealDamage(attacker, dmg * k, target.id, { noThorns: true, raw: true, noCharge: true });
    }
    if (target.hp <= 0) killPlayer(target, attacker && attacker !== target ? attacker.id : (target.lastHitBy || -1));
}

function explode(x, y, ownerId, dmgMax = 120, radius = 160) {
    dmgMax *= 1.4; // bom & vũ khí nổ mạnh hơn
    explosionFx(x, y, radius);
    const exOwner = players.find(q => q.id === ownerId);
    if (exOwner && exOwner.lingering) { const t = combo(exOwner, 'lingerFire') ? 4 : 2; zones.push({ type: 'fire', x, y, r: radius * 0.6, t, maxT: t, owner: ownerId, tick: 0 }); }
    if (exOwner && combo(exOwner, 'napalm')) zones.forEach(z => { if (z.type === 'glue' && z.owner === ownerId && dist(x, y, z.x, z.y) < z.r + radius) { z.type = 'fire'; z.t = Math.max(z.t, 3); } });
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
            if (w.type === 'SHIELD' && Math.abs(angleDiff(Math.atan2(y - p.y, x - p.x), p.angle)) < Math.PI / 2.5) { dmg *= 0.3; reduceDurability(p, w, 30); }
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

    if (crate.type === 'FAKE') {
        if (crate.owner === p.id) return;
        triggerFakeCrate(crate, index, p); return;
    }
    if (crate.type === 'TRAP') {
        if (p.collector) return; // Nhà Sưu Tầm nhận ra bẫy
        crates.splice(index, 1);
        floatText(p.x, p.y - 30, 'BẪY!! 💀', '#ff4d5e', 22);
        explode(crate.x, crate.y, -1, 55, 120);
        return;
    }
    if (crate.type === 'SUPPORT') {
        crates.splice(index, 1); p.stats.crates++;
        AudioSys.play('pickup');
        const roll = Math.random();
        if (roll < 0.4 || (roll >= 0.7 && !cur.magSize)) {
            const amt = (roll < 0.4 ? 45 : 30) * (p.scavenger ? 2 : 1);
            p.hp = Math.min(p.hp + amt, p.maxHp); spark(p.x, p.y, '#4ade80', 10, 120); floatText(p.x, p.y - 24, `+${amt} HP`, '#4ade80', 16);
        } else if (roll < 0.7) {
            const cap = Math.max(150, p.maxArmor);
            p.armor = Math.min(p.armor + 50, cap); spark(p.x, p.y, COLORS.armor, 10, 120); floatText(p.x, p.y - 24, '+50 GIÁP', COLORS.armor, 16);
        } else {
            if (cur.magSize) { cur.reserve += cur.noReload ? 0 : cur.magSize * (p.scavenger ? 2 : 1); if (cur.noReload) cur.mag = effMag(p, cur); }
            floatText(p.x, p.y - 24, '+ĐẠN', '#fbbf24', 16);
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
    const nw = makeWeapon(key, p);

    // Trùng loại → nạp đầy
    const same = p.inventory.findIndex(w => w.id === nw.id);
    if (same >= 0) {
        const w = p.inventory[same];
        if (w.magSize) { if (w.noReload) w.mag = effMag(p, w); else w.reserve += w.magSize * 2; }
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
        if (b.boomerang && updateBoomerang(b, dt)) { bullets.splice(i, 1); continue; }
        b.x += Math.cos(b.angle) * b.speed * 60 * dt; b.y += Math.sin(b.angle) * b.speed * 60 * dt;
        b.life -= dt;
        if (b.flame) b.size += dt * 22;
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
                if (o.ownerPass === b.owner) continue; // bắn xuyên bao cát của mình
                const t = segRect(b.px, b.py, b.x, b.y, o);
                if (t < 0) continue;
                if (b.boomerang) { b.back = true; b.x = b.px; b.y = b.py; spark(b.x, b.y, '#f59e0b', 3, 120); break; }
                const hx = b.px + (b.x - b.px) * t, hy = b.py + (b.y - b.py) * t;
                if (b.pierce) { if (!b.pierced) { b.pierced = new Set(); } if (!b.pierced.has(o)) { b.pierced.add(o); damageObstacle(o, 40); spark(hx, hy, '#e9d5ff', 6, 200); } continue; }
                if (o.wood || o.temp !== undefined) damageObstacle(o, b.damage || 30, players.find(q => q.id === b.owner));
                if ((b.bounces > 0 || o.reflect) && !b.explosive) {
                    if (o.reflect) { b.owner = obstacleOwnerFlip(b, o); b.color = '#bae6fd'; } else b.bounces--;
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
                if (p.id === b.owner || p.hp <= 0 || sameTeamId(p.id, b.owner)) continue;
                // khoảng cách điểm tới đoạn đường đạn
                const dx = b.x - b.px, dy = b.y - b.py, L = dx * dx + dy * dy || 1;
                const t = Math.max(0, Math.min(1, ((p.x - b.px) * dx + (p.y - b.py) * dy) / L));
                if (dist(p.x, p.y, b.px + dx * t, b.py + dy * t) < p.radius + b.size + 2) {
                    const w = getCurrentWeapon(p);
                    if (b.boomerang) {
                        const key = b.back ? 'hitBack' : 'hitOut';
                        if (!b[key]) { b[key] = true; const ow = players.find(q => q.id === b.owner); if (ow) ow.stats.hits++; dealDamage(p, b.damage, b.owner, { angle: b.angle, knock: 200 }); }
                        break;
                    }
                    if (p.st && p.st.reflect > 0 && !b.hook) {
                        // Phản Xạ: bẻ ngược viên đạn
                        b.owner = p.id; b.angle += Math.PI; b.life = 1.2; b.color = '#fde047'; b.x = b.px; b.y = b.py;
                        spark(b.x, b.y, '#fde047', 5, 200, 0.25, 2); AudioSys.playAt('block', p.x, p.y, 0.25);
                        break;
                    }
                    if (energyBlock(p, w, b)) { b.hitP = true; } else if (w.type === 'SHIELD' && !b.explosive && !b.hook && Math.abs(angleDiff(Math.atan2(b.y - p.y, b.x - p.x), p.angle)) < Math.PI / 2.4) {
                        spark(b.x, b.y, '#e2e8f0', 6, 220, 0.3, 2); AudioSys.playAt('block', p.x, p.y, 0.3); reduceDurability(p, w, b.damage > 50 ? 40 : 10);
                    } else if (!b.explosive || b.super) {
                        const owner = players.find(q => q.id === b.owner); if (owner) owner.stats.hits++;
                        dealDamage(p, b.damage * (b.falloff ? Math.max(0.35, 1 - dist(b.sx, b.sy, p.x, p.y) / b.falloff) : 1), b.owner, { angle: b.angle, knock: b.knock, burn: b.burn, slow: b.freeze ? 2.5 : (b.slowHit || 0), storm: b.storm, super: b.super });
                        if (b.root && p.st) { p.st.root = Math.max(p.st.root || 0, b.root); floatText(p.x, p.y - 34, 'BỊ TRÓI!', '#e5e7eb', 14); ring(p.x, p.y, 5, 30, '#e5e7eb', 0.4); }
                        if (b.hook) hookHit(owner, p);
                        if (b.freeze) ring(p.x, p.y, 5, 40, '#93c5fd', 0.3);
                        if (b.net) { p.stun = Math.max(p.stun, 1.1); b.hitP = true; floatText(p.x, p.y - 48, 'CHOÁNG!', '#e5e7eb', 14); }
                        if (b.freeze && p.st.glued > 0 && combo(owner, 'freeze_glue')) { p.stun = Math.max(p.stun, 0.8); floatText(p.x, p.y - 48, 'ĐÓNG BĂNG!', '#93c5fd', 15); }
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
        if ((dead || b.life <= 0) && b.net && !b.hitP) { zones.push({ type: 'net', x: b.x, y: b.y, r: 105, t: 4, maxT: 4, owner: b.owner, tick: 0 }); spark(b.x, b.y, '#e5e7eb', 10, 160); }
        if (dead || b.life <= 0) {
            if (!dead && b.explosive && !b.blastSmall) explode(b.x, b.y, b.owner, 130, 170);
            bullets.splice(i, 1);
        }
    }
}


/** Vật ném: lựu đạn, vũ khí bị ném */
function updateItems(dt) {
    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it.custom) { if (updateCustomItem(it, dt)) items.splice(i, 1); continue; }
        if (it.fuse > 0) {
            it.fuse -= dt;
            if (it.fuse <= 0 && it.type.id === 'GRENADE') { explode(it.x, it.y, it.ownerId, it.blast ? it.blast[0] : 110, it.blast ? it.blast[1] : 160); items.splice(i, 1); continue; }
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
