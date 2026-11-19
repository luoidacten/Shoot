/** ==================== HUD KIỂU LIÊN QUÂN · NÚT CẢM ỨNG · HIỆU ỨNG CHÉM / ĐÂM / BẮN ==================== */

/* ---------------- HUD ---------------- */
function drawHUD(W, H, now) {
    const locals = settings.mode === 'pvp' ? players.filter(p => !p.isBot && p.id <= 2) : players.filter(p => p.id === localId());
    locals.forEach((p, i) => drawMyPanel(p, i === 0 ? 10 : W - Math.min(300, W * 0.36) - 10, 10, now));
    drawScoreStrip(W, now);
    drawKillFeed(W, now);
    const me = localPlayer();
    if (me && me.hp <= 0 && gameState === 'PLAYING') {
        ctx.font = `700 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillText('👁 ĐANG THEO DÕI — chờ hiệp sau', W / 2, H - 22);
    }
}

function drawMyPanel(p, x, y, now) {
    const w = Math.min(300, Math.max(220, SCREEN_W * 0.3)), h = 56;
    ctx.save(); ctx.translate(x, y);
    // nền kính mờ
    const bg = ctx.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, 'rgba(6,10,24,0.85)'); bg.addColorStop(1, 'rgba(6,10,24,0.35)');
    rrect(ctx, 0, 0, w, h, 12); ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = hexA(p.color, 0.5); ctx.lineWidth = 1.2; ctx.stroke();
    // chân dung
    const ag = ctx.createRadialGradient(22, 22, 4, 28, 28, 24); ag.addColorStop(0, shade(p.color, 0.4)); ag.addColorStop(1, shade(p.color, -0.3));
    ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(28, 28, 21, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `700 12px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.label.length > 4 ? p.label.slice(0, 4) : p.label, 28, 29);
    // điểm thắng (sao)
    for (let i = 0; i < settings.maxWins; i++) {
        ctx.fillStyle = i < p.score ? COLORS.gold : 'rgba(255,255,255,0.18)';
        ctx.font = `9px ${FONT}`; ctx.fillText('★', 10 + i * 12, h - 4);
    }
    // máu
    const bx = 56, bw = w - 64;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; rrect(ctx, bx, 9, bw, 15, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; rrect(ctx, bx, 9, Math.max(0, bw * p.ghostHp / p.maxHp), 15, 4); ctx.fill();
    const hpk = Math.max(0, p.hp) / p.maxHp;
    const hg = ctx.createLinearGradient(0, 9, 0, 24);
    if (hpk > 0.3) { hg.addColorStop(0, '#86efac'); hg.addColorStop(1, '#16a34a'); } else { hg.addColorStop(0, '#fca5a5'); hg.addColorStop(1, '#dc2626'); }
    if (hpk > 0) { ctx.fillStyle = hg; rrect(ctx, bx, 9, Math.max(5, bw * hpk), 15, 4); ctx.fill(); }
    // vạch chia mỗi 50 máu
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    for (let v = 50; v < p.maxHp; v += 50) { const xx = bx + bw * v / p.maxHp; ctx.beginPath(); ctx.moveTo(xx, 10); ctx.lineTo(xx, 23); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(Math.max(0, p.hp))} / ${p.maxHp}`, bx + bw / 2, 17);
    // giáp + siêu đòn
    if (p.armor > 0) { ctx.fillStyle = COLORS.armor; ctx.fillRect(bx, 26, bw * Math.min(1, p.armor / Math.max(150, p.maxArmor)), 3); }
    if (p.aimshot) { ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(bx, 30, bw, 2); ctx.fillStyle = '#fde047'; ctx.fillRect(bx, 30, bw * Math.min(1, (p.superCharge || 0) / (p.superNeed || 5)), 2); }
    // nội tại + phối hợp + vũ khí
    ctx.textAlign = 'left'; ctx.font = `12px ${FONT}`; ctx.fillStyle = '#fff';
    const pasIds = (p.build || []).filter(id => CARDS[id] && CARDS[id].kind === 'P');
    const pas = pasIds.filter(id => !hasIcon(id)).map(id => CARDS[id].icon).join('');
    let tx = bx;
    if (!isTouch) {
        (p.skills || []).forEach((s, i) => {
            const c = CARDS[s.id]; if (!c) return;
            if (hasIcon(s.id)) drawGIcon(ctx, s.id, tx + 9, 40, 20, s.cd > 0 ? 0.45 : 1); else { ctx.globalAlpha = s.cd > 0 ? 0.45 : 1; ctx.fillText(c.icon, tx, 44); ctx.globalAlpha = 1; }
            if (s.cd > 0) { ctx.font = `700 9px ${FONT}`; ctx.fillStyle = '#fde68a'; ctx.fillText(Math.ceil(s.cd), tx + 14, 47); ctx.font = `12px ${FONT}`; ctx.fillStyle = '#fff'; }
            tx += 26;
        });
        const cw = getCurrentWeapon(p);
        ctx.fillText(`${cw.icon || '✊'} ${ammoText(cw)}`, w - 70, 44);
    }
    pasIds.filter(id => hasIcon(id)).forEach(id => { drawGIcon(ctx, id, tx + 9, 40, 20); tx += 21; });
    ctx.fillText(pas + ((p.combos || []).length ? '  ⚡' + p.combos.length : ''), tx, 44);
    ctx.restore();
}

function drawScoreStrip(W, now) {
    const n = players.length, cw = 34, tw = n * cw + 20;
    const z = world.zone;
    let label, col = '#cbd5e1';
    if (world.time < world.zoneDelay) label = `BO THU SAU ${Math.ceil(world.zoneDelay - world.time)}s`;
    else if (world.zonePhase === 1) { label = 'VÒNG BO ĐANG THU'; col = '#c084fc'; }
    else { label = 'TỬ CHIẾN'; col = '#ff4d5e'; }
    const me = localPlayer();
    const outside = me && me.hp > 0 && dist(me.x, me.y, z.x, z.y) > z.r;
    ctx.save(); ctx.translate(W / 2, 8);
    rrect(ctx, -tw / 2, 0, tw, 32, 10); ctx.fillStyle = 'rgba(6,10,24,0.78)'; ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    players.forEach((p, i) => {
        const x = -tw / 2 + 10 + cw * i + cw / 2;
        ctx.globalAlpha = p.hp > 0 ? 1 : 0.35;
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x, 16, 12, 0, Math.PI * 2); ctx.fill();
        if (p.id === localId()) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.fillStyle = '#fff'; ctx.font = `700 13px ${FONT}`; ctx.fillText(p.score, x, 17);
        if (p.hp <= 0) { ctx.font = `10px ${FONT}`; ctx.fillText('☠', x + 10, 6); }
    });
    ctx.globalAlpha = 1;
    ctx.font = `700 10px ${FONT}`; ctx.fillStyle = COLORS.gold;
    ctx.fillText(`HIỆP ${currentRound} · ${MAP_NAMES[world.mapType] || ''} · CÒN ${players.filter(p => p.hp > 0).length}`, 0, 42);
    ctx.fillStyle = outside && Math.sin(now * 10) > 0 ? '#ff4d5e' : col; ctx.fillText(outside ? '⚠ NGOÀI VÒNG BO!' : label, 0, 55);
    ctx.restore();
}

function drawKillFeed(W, now) {
    const t = performance.now();
    for (let i = killFeed.length - 1; i >= 0; i--) if (t - killFeed[i].born > 5000) killFeed.splice(i, 1);
    ctx.save(); ctx.font = `700 11px ${FONT}`; ctx.textBaseline = 'middle';
    killFeed.forEach((k, i) => {
        // bảng hạ gục: bên trái, dưới thanh máu (bên phải dành cho vật phẩm)
        const y = 80 + i * 22, a = Math.min(1, (5000 - (t - k.born)) / 600);
        const s = `${k.a}  ⚔  ${k.b}`, tw = ctx.measureText(s).width + 20;
        ctx.globalAlpha = a; rrect(ctx, 10, y - 9, tw, 18, 6); ctx.fillStyle = 'rgba(6,10,24,0.7)'; ctx.fill();
        ctx.textAlign = 'left';
        ctx.fillStyle = k.ac; ctx.fillText(k.a, 20, y);
        const wa = ctx.measureText(k.a + '  ').width;
        ctx.fillStyle = '#fca5a5'; ctx.fillText('⚔', 20 + wa, y);
        ctx.fillStyle = k.bc; ctx.fillText(k.b, 20 + wa + ctx.measureText('⚔  ').width, y);
    });
    ctx.restore();
}

/* ---------------- Nút cảm ứng ---------------- */
function drawTouchControls(p) {
    const L = touchLayout(), inp = touchInputs.p1, now = performance.now() / 1000;
    // joystick
    const o = stickOrigin.p1, jR = L.stick.r;
    const jX = o ? o.x : L.stick.x, jY = o ? o.y : L.stick.y;
    ctx.save(); ctx.globalAlpha = o ? 0.95 : 0.5;
    ctx.fillStyle = 'rgba(10,20,45,0.35)'; ctx.beginPath(); ctx.arc(jX, jY, jR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(147,197,253,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    if (Math.hypot(inp.move.x, inp.move.y) > 0.1) { const a = Math.atan2(inp.move.y, inp.move.x); ctx.strokeStyle = 'rgba(147,197,253,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(jX, jY, jR, a - 0.4, a + 0.4); ctx.stroke(); }
    const kx = jX + inp.move.x * jR * 0.62, ky = jY + inp.move.y * jR * 0.62;
    const g = ctx.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, jR * 0.42);
    g.addColorStop(0, 'rgba(219,234,254,0.95)'); g.addColorStop(1, 'rgba(59,130,246,0.75)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(kx, ky, jR * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const w = getCurrentWeapon(p), ow = p.inventory[otherSlot(p)];
    // nút đánh: viền đạn kiểu Brawl Stars
    lqButton(L.A, inp.a, w.icon || '✊', '', 0, p.color);
    drawAmmoRing(L.A, p, w, now);
    if (aimStick.p1 && inp.a) {
        const s = aimStick.p1, dx = s.x - s.sx, dy = s.y - s.sy, d = Math.min(L.A.r * 1.2, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
        ctx.fillStyle = p.cancelShot ? 'rgba(248,113,113,0.85)' : 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(L.A.x + Math.cos(a) * d, L.A.y + Math.sin(a) * d, L.A.r * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    const canRl = w.magSize && !w.noReload && w.reloadMode !== 'single' && w.mag < effMag(p, w) && (w.reserve > 0 || world.infiniteAmmo);
    lqButton(L.B, inp.b, canRl ? '⟳' : '↗', canRl ? 'NẠP' : 'NÉM', 0, '#f59e0b');
    lqButton(L.C, inp.c, ow.icon || '✊', '', 0, '#a855f7');
    [L.S1, L.S2].forEach((b, i) => {
        const s = p.skills && p.skills[i], c = s && CARDS[s.id];
        if (!c) { ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#94a3b8'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.8, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); return; }
        const k = 's' + (i + 1), cd = s.cd > 0 ? s.cd / Math.max(0.1, skillCooldown(p, s.id)) : 0;
        lqButton(b, inp[k], ic('card', s.id, c.icon), s.cd > 0 ? Math.ceil(s.cd) : '', cd, '#22d3ee');
        const st = skillStick[k];
        if (st && inp[k]) {
            const dx = st.x - st.sx, dy = st.y - st.sy, d = Math.min(b.r * 1.3, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
            ctx.strokeStyle = st.cancel ? 'rgba(248,113,113,0.9)' : 'rgba(34,211,238,0.6)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.35, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = st.cancel ? 'rgba(248,113,113,0.85)' : 'rgba(255,255,255,0.75)';
            ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
        }
    });
}
function lqButton(b, pressed, icon, sub, cd, accent) {
    ctx.save(); ctx.translate(b.x, b.y);
    const r = b.r * (pressed ? 0.93 : 1);
    const g = ctx.createRadialGradient(0, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, pressed ? 'rgba(255,255,255,0.45)' : 'rgba(70,90,140,0.55)'); g.addColorStop(1, 'rgba(8,14,32,0.72)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hexA(accent, pressed ? 1 : 0.7); ctx.lineWidth = 2.5; ctx.stroke();
    if (cd > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, cd)); ctx.fill();
    }
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = cd > 0 ? 0.55 : 1;
    ctx.font = `${Math.round(r * 0.78)}px ${FONT}`; ctx.fillText(icon, 0, sub !== '' && cd <= 0 ? -r * 0.08 : 2);
    ctx.globalAlpha = 1;
    if (sub !== '') {
        ctx.font = `700 ${Math.round(cd > 0 ? r * 0.55 : r * 0.3)}px ${FONT}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        const y = cd > 0 ? 2 : r * 0.55; ctx.strokeText(sub, 0, y); ctx.fillStyle = cd > 0 ? '#fde68a' : '#fff'; ctx.fillText(sub, 0, y);
    }
    ctx.restore();
}
function drawAmmoRing(b, p, w, now) {
    const R = b.r + 6;
    ctx.save(); ctx.translate(b.x, b.y); ctx.lineCap = 'round';
    if (w.magSize) {
        const n = Math.min(effMag(p, w), 30), gap = n > 12 ? 0.03 : 0.08, span = Math.PI * 1.1, a0 = -Math.PI / 2 - span / 2;
        for (let i = 0; i < n; i++) {
            const s = a0 + i * span / n + gap / 2, e = a0 + (i + 1) * span / n - gap / 2;
            const full = i < Math.round(w.mag * n / Math.min(effMag(p, w), 30) * Math.min(1, effMag(p, w) / n));
            ctx.strokeStyle = full ? '#fde047' : 'rgba(255,255,255,0.15)'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(0, 0, R, s, e); ctx.stroke();
        }
        if (w.reloading || (w.reloadMode === 'single' && w.reloadT > 0)) {
            ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, R + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, w.reloadT / w.reloadTime)); ctx.stroke();
        }
        ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(b.r * 0.28)}px ${FONT}`; ctx.textAlign = 'center';
        ctx.fillText(ammoText(w), 0, b.r * 0.62);
    } else if (w.durability !== undefined && w.durability < 900) {
        const k = w.durability / w.maxDurability;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = k > 0.3 ? '#a5f3fc' : '#f87171'; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
    }
    if (p.charge > 0) { ctx.strokeStyle = p.charge >= 0.9 ? '#fde047' : '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, b.r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.charge); ctx.stroke(); }
    ctx.restore();
}

/* ---------------- Mũi tên chỉ địch (thẻ tầm nhìn / bị lộ) ---------------- */
function drawEnemyArrows(zoom) {
    const me = localPlayer(); if (!me || me.hp <= 0 || gameState !== 'PLAYING') return;
    const sense = me.eagle || me.watchman || me.hunter;
    const W = SCREEN_W, H = SCREEN_H, now = performance.now() / 1000;
    enemiesOf(me).forEach(e => {
        const revealed = (e.st && e.st.reveal > 0) || isSpotted(e, me.id);
        const d = dist(me.x, me.y, e.x, e.y);
        const sensed = sense && d < visionRange(me) * 1.7 && !(e.st && e.st.invis > 0);
        if (!revealed && !sensed) return;
        let x = (e.x - camera.x) * zoom + W / 2, y = (e.y - camera.y) * zoom + H / 2;
        const on = x > 30 && y > 70 && x < W - 30 && y < H - 30;
        if (on && targetable(me, e) && canSee(e.x, e.y, e.radius)) return;
        ctx.save();
        if (on) {
            ctx.translate(x, y); ctx.rotate(now * 2);
            ctx.strokeStyle = hexA(e.color, 0.9); ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(16, 0); ctx.lineTo(0, 16); ctx.lineTo(-16, 0); ctx.closePath(); ctx.stroke();
        } else {
            const a = Math.atan2(y - H / 2, x - W / 2);
            x = Math.max(28, Math.min(W - 28, x)); y = Math.max(78, Math.min(H - 28, y));
            ctx.translate(x, y);
            ctx.fillStyle = 'rgba(6,10,24,0.75)'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = e.color; ctx.lineWidth = 2; ctx.stroke();
            ctx.save(); ctx.rotate(a); ctx.fillStyle = e.color; ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(14, -7); ctx.lineTo(14, 7); ctx.fill(); ctx.restore();
            ctx.fillStyle = '#fff'; ctx.font = `700 10px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(d / 10) + 'm', 0, 1);
        }
        ctx.restore();
    });
}

/* ---------------- Hiệu ứng chém / đâm ---------------- */
function drawSlashFx(s, so) {
    const k = s.life / s.maxLife, t = 1 - k, col = s.color && s.color[0] === '#' ? s.color : '#f1f5f9';
    ctx.save(); ctx.translate(so.x, so.y - (so.airH || 0)); ctx.rotate(s.angle);
    ctx.globalCompositeOperation = 'lighter';
    if (s.line) {
        // ĐÂM: mũi nhọn phóng ra + vệt tốc độ
        const L = s.range, ext = L * (0.5 + 0.5 * Math.min(1, t * 3.5)), base = so.radius * 0.6, wd = 3 + s.width * 0.8;
        const g = ctx.createLinearGradient(base, 0, ext, 0);
        g.addColorStop(0, hexA(col, 0)); g.addColorStop(0.65, hexA(col, 0.6 * k)); g.addColorStop(1, `rgba(255,255,255,${k})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(base, -wd); ctx.quadraticCurveTo(ext * 0.7, -wd * 0.6, ext, 0); ctx.quadraticCurveTo(ext * 0.7, wd * 0.6, base, wd); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = hexA(col, 0.55 * k); ctx.lineWidth = 1.5;
        for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(L * 0.25, sgn * wd * 2.2); ctx.lineTo(ext * 0.85, sgn * wd * 0.7); ctx.stroke(); }
        ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.beginPath(); ctx.arc(ext, 0, 2 + wd * 0.5 * k, 0, Math.PI * 2); ctx.fill();
        // tia sáng chữ thập ở mũi
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * k})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ext - 8 * k, 0); ctx.lineTo(ext + 10 * k, 0); ctx.moveTo(ext, -8 * k); ctx.lineTo(ext, 8 * k); ctx.stroke();
    } else {
        // CHÉM: lưỡi trăng khuyết quét qua, dày ở đầu lưỡi, mảnh dần về đuôi
        const sw = s.swing || 1, span = 2.4, prog = Math.min(1, t * 2.4 + 0.25);
        const a0 = -span / 2 * sw, aE = a0 + span * sw * prog, R = s.range, th = (s.width * 1.5 + 5) * (0.5 + 0.5 * k);
        const N = 16;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) { const u = i / N, a = a0 + (aE - a0) * u; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
        for (let i = N; i >= 0; i--) { const u = i / N, a = a0 + (aE - a0) * u, ww = th * (0.08 + 0.92 * u * u); ctx.lineTo(Math.cos(a) * (R - ww), Math.sin(a) * (R - ww)); }
        ctx.closePath();
        const g = ctx.createRadialGradient(0, 0, Math.max(1, R - th), 0, 0, R + 2);
        g.addColorStop(0, hexA(col, 0)); g.addColorStop(0.55, hexA(col, 0.55 * k)); g.addColorStop(1, `rgba(255,255,255,${0.95 * k})`);
        ctx.fillStyle = g; ctx.fill();
        // vệt mờ phía sau
        ctx.strokeStyle = hexA(col, 0.18 * k); ctx.lineWidth = th * 1.6;
        ctx.beginPath(); ctx.arc(0, 0, R - th * 0.8, Math.min(a0, aE), Math.max(a0, aE)); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.beginPath(); ctx.arc(Math.cos(aE) * R, Math.sin(aE) * R, 2 + 3 * k, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

/* ---------------- Đạn & tia ---------------- */
function drawBulletFx(b) {
    const tl = b.trail || 26, c = b.color || '#ffe48a';
    const tx = b.x - Math.cos(b.angle) * tl, ty = b.y - Math.sin(b.angle) * tl;
    const g = ctx.createLinearGradient(tx, ty, b.x, b.y);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, c);
    ctx.strokeStyle = g; ctx.lineWidth = b.size * 2.4; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineWidth = b.size * 1.1;
    ctx.beginPath(); ctx.moveTo(b.x - Math.cos(b.angle) * tl * 0.6, b.y - Math.sin(b.angle) * tl * 0.6); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, b.size * 1.6, b.size * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (b.explosive && !b.blastSmall) { ctx.fillStyle = 'rgba(255,140,40,0.5)'; ctx.beginPath(); ctx.arc(b.x, b.y, 12, 0, Math.PI * 2); ctx.fill(); }
}
function drawZigBeam(bm) {
    const k = bm.life / bm.maxLife, dx = bm.x2 - bm.x1, dy = bm.y2 - bm.y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const seg = Math.max(3, Math.round(L / 22));
    for (const [wd, col] of [[7 * k + 2, hexA(bm.color, 0.35 * k)], [2 * k + 1, `rgba(255,255,255,${k})`]]) {
        ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1);
        for (let i = 1; i < seg; i++) { const u = i / seg, j = (Math.random() - 0.5) * 18; ctx.lineTo(bm.x1 + dx * u + nx * j, bm.y1 + dy * u + ny * j); }
        ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    }
}
function drawMuzzleFlash(c, w, p) {
    const k = Math.min(1, p.muzzle / 0.06), x = (p.radius + (w.len || 12) * 1.15 + 6), s = 7 + (w.width || 4) * 1.4;
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, 0);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.6); g.addColorStop(0, `rgba(255,255,230,${k})`); g.addColorStop(0.4, `rgba(255,200,80,${0.7 * k})`); g.addColorStop(1, 'rgba(255,120,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, s * 1.6, 0, Math.PI * 2); c.fill();
    c.fillStyle = `rgba(255,240,180,${k})`; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2 + Math.PI / 2, r = i % 2 ? s * 0.35 : (i === 0 ? s * 1.8 : s); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.fill();
    c.restore();
}

/* ---------------- Vẽ thêm quanh người chơi ---------------- */
function drawPlayerExtras(p, w, now) {
    // khiên Súng Năng Lượng
    if (w.id === 'ENERGY' && w.eShield > 0 && world.time - (p.lastFireT || -9) > 0.6) {
        const k = w.eShield / (w.eShieldMax || 80);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(167,139,250,${0.35 + 0.5 * k})`; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 16, p.angle - 1.1, p.angle + 1.1); ctx.stroke();
        ctx.strokeStyle = `rgba(237,233,254,${0.5 * k})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 20, p.angle - 1.0, p.angle + 1.0); ctx.stroke();
        ctx.restore();
    }
    // tích điện (Súng Điện)
    if (p.st && p.st.zap > 0.05) {
        ctx.save(); ctx.strokeStyle = `rgba(147,197,253,${0.4 + p.st.zap * 0.6})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p.st.zap); ctx.stroke(); ctx.restore();
    }
}
function drawAirShadow(p) {
    if (!(p.airH > 0)) return;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + p.radius * 0.6, p.radius * (1.1 - p.airH / 300), p.radius * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    if (p.jet) { ctx.strokeStyle = 'rgba(251,146,60,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(p.x, p.y + p.radius * 0.6, p.radius + 6, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
}
/** Vùng ngắm kỹ năng + vùng đáp xuống của Búa/Đại Đao (chỉ người điều khiển thấy) */
function drawExtraAim(p, w, now) {
    const v = p.skillAimView;
    if (v) {
        ctx.save();
        ctx.strokeStyle = 'rgba(34,211,238,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
        ctx.beginPath(); ctx.arc(p.x, p.y, v.range, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        const col = v.cancel ? '248,113,113' : v.ready === false ? '148,163,184' : '34,211,238';
        if (!v.cancel) {
            if (v.kind === 'dir') {
                ctx.translate(p.x, p.y); ctx.rotate(v.ang);
                const g = ctx.createLinearGradient(0, 0, v.range, 0); g.addColorStop(0, `rgba(${col},0.05)`); g.addColorStop(1, `rgba(${col},0.4)`);
                ctx.fillStyle = g; ctx.fillRect(p.radius, -12, v.range - p.radius, 24);
                ctx.strokeStyle = `rgba(${col},0.9)`; ctx.lineWidth = 2; ctx.strokeRect(p.radius, -12, v.range - p.radius, 24);
                ctx.beginPath(); ctx.moveTo(v.range + 10, 0); ctx.lineTo(v.range - 6, -14); ctx.lineTo(v.range - 6, 14); ctx.closePath(); ctx.fillStyle = `rgba(${col},0.9)`; ctx.fill();
            } else {
                const x = p.x + Math.cos(v.ang) * v.d, y = p.y + Math.sin(v.ang) * v.d;
                ctx.strokeStyle = `rgba(${col},0.5)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(x, y); ctx.stroke();
                ctx.fillStyle = `rgba(${col},0.25)`; ctx.beginPath(); ctx.arc(x, y, 70, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = `rgba(${col},0.95)`; ctx.lineWidth = 2.5; ctx.stroke();
            }
        }
        ctx.restore();
    }
    // Búa / Đại Đao: tụ đủ lực → hiện vùng đáp xuống
    if (p.aiming && (w.id === 'HAMMER' || w.id === 'GREATSWORD') && (p.charge || 0) >= 0.9) {
        const range = w.id === 'GREATSWORD' ? 290 : 210, r = w.id === 'GREATSWORD' ? 150 : 95;
        const d = slamDistance(p, w, range), a = p.aimAngle !== undefined ? p.aimAngle : p.angle;
        const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        ctx.save();
        ctx.strokeStyle = 'rgba(253,224,71,0.25)'; ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, range, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = `rgba(253,224,71,${0.18 + Math.sin(now * 10) * 0.06})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(253,224,71,0.95)'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo((p.x + x) / 2, (p.y + y) / 2 - d * 0.4, x, y); ctx.stroke();
        ctx.restore();
    }
}
function drawNetZones(now) {
    zones.forEach(z => {
        if (z.type !== 'net') return;
        const k = Math.min(1, z.t / 0.5);
        ctx.save(); ctx.globalAlpha = 0.75 * k;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(229,231,235,0.08)'; ctx.fill(); ctx.clip();
        ctx.strokeStyle = 'rgba(229,231,235,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (let d = -z.r; d <= z.r; d += 16) { ctx.moveTo(z.x + d - z.r, z.y - z.r); ctx.lineTo(z.x + d + z.r, z.y + z.r); ctx.moveTo(z.x + d + z.r, z.y - z.r); ctx.lineTo(z.x + d - z.r, z.y + z.r); }
        ctx.stroke(); ctx.restore();
        ctx.strokeStyle = `rgba(229,231,235,${0.7 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
    });
}

/* ---------------- Hình vẽ vũ khí mới ---------------- */
function drawNewWeaponArt(c, w, r, x0, ch, box, now, p) {
    switch (w.id) {
        case 'RAPIER': {
            const back = ch * 8;
            box(r - 6 - back, -2, 9, 4, '#334155');
            c.strokeStyle = '#fbbf24'; c.lineWidth = 2; c.beginPath(); c.arc(r + 4 - back, 0, 5, -1.4, 1.4); c.stroke();
            const g = c.createLinearGradient(r + 5, 0, r + 50, 0); g.addColorStop(0, '#f8fafc'); g.addColorStop(1, '#bae6fd');
            c.fillStyle = g; c.beginPath(); c.moveTo(r + 5 - back, -1.4); c.lineTo(r + 52 - back, 0); c.lineTo(r + 5 - back, 1.4); c.closePath(); c.fill();
            if (ch > 0.3) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(224,242,254,${ch})`; c.lineWidth = 2; c.beginPath(); c.moveTo(r + 5, 0); c.lineTo(r + 54, 0); c.stroke(); }
            break;
        }
        case 'GREATSWORD': {
            c.rotate(-ch * 1.2);
            c.fillStyle = '#7c2d12'; c.fillRect(r - 10, -2.5, 24, 5); // cán dài
            box(r + 12, -4, 4, 8, '#fbbf24', 1);
            const g = c.createLinearGradient(r + 16, -10, r + 52, 6); g.addColorStop(0, '#fecdd3'); g.addColorStop(1, '#e11d48');
            c.fillStyle = g; c.beginPath(); c.moveTo(r + 16, -3); c.quadraticCurveTo(r + 36, -14, r + 54, -8); c.quadraticCurveTo(r + 44, 2, r + 16, 4); c.closePath(); c.fill();
            c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.5; c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(r + 20, -4, 22, 1.5);
            if (ch >= 0.9) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(251,113,133,0.45)'; c.beginPath(); c.arc(r + 36, -4, 16, 0, Math.PI * 2); c.fill(); }
            break;
        }
        case 'ENERGY': {
            box(x0 - 2, -5, 20, 10, '#4c1d95', 4);
            c.fillStyle = '#a78bfa'; c.fillRect(x0 + 2, -2, 12, 4);
            c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(196,181,253,${0.5 + Math.sin(now * 8) * 0.3})`;
            c.beginPath(); c.arc(x0 + 20, 0, 4, 0, Math.PI * 2); c.fill();
            break;
        }
        case 'AXE': {
            c.rotate(-ch * 1.1);
            c.fillStyle = '#78350f'; c.fillRect(r - 6, -2, 30, 4);
            const g = c.createLinearGradient(r + 18, -12, r + 34, 6); g.addColorStop(0, '#f1f5f9'); g.addColorStop(1, '#64748b');
            c.fillStyle = g; c.beginPath(); c.moveTo(r + 18, -3); c.quadraticCurveTo(r + 34, -16, r + 36, -4); c.quadraticCurveTo(r + 34, 8, r + 18, 4); c.closePath(); c.fill();
            c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.5; c.stroke(); break;
        }
        case 'ROUNDSHIELD': {
            if (w.out) break; // đã ném đi / đang dựng: tay không
            if (p && p.aiming && (p.charge || 0) > 0.08) { // chuẩn bị ném: khiên tròn
                const g = c.createRadialGradient(r + 6, -3, 2, r + 8, 0, 14); g.addColorStop(0, '#bae6fd'); g.addColorStop(1, '#0369a1');
                c.fillStyle = g; c.beginPath(); c.arc(r + 8, 0, 13, 0, Math.PI * 2); c.fill();
                c.strokeStyle = '#fbbf24'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(r + 8, 0, 3, 0, Math.PI * 2); c.fill(); break;
            }
            // bình thường: tấm khiên dựng dọc trước mặt (nhìn từ trên xuống)
            const g = c.createLinearGradient(r + 2, 0, r + 12, 0); g.addColorStop(0, '#0369a1'); g.addColorStop(1, '#7dd3fc');
            c.fillStyle = g; rrect(c, r + 2, -17, 10, 34, 5); c.fill();
            c.strokeStyle = '#e0f2fe'; c.lineWidth = 1.5; c.stroke();
            c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(r + 7, 0, 3, 0, Math.PI * 2); c.fill(); break;
        }
        case 'SPISTOL': box(x0, -3, 14, 6, '#475569'); box(x0 + 13, -2.5, 12, 5, '#1e293b'); box(x0 - 2, 1, 5, 7, '#334155'); break;
        case 'SAR': box(x0 - 2, -3.5, 20, 7, '#334155'); box(x0 + 17, -3, 14, 6, '#0f172a'); box(x0 + 4, 2, 4, 7, '#1e293b'); break;
        case 'EMPGREN': c.fillStyle = '#0ea5e9'; c.beginPath(); c.arc(r + 5, 7, 5.5, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#e0f2fe'; c.lineWidth = 1.5; c.beginPath(); c.arc(r + 5, 7, 3, 0, Math.PI * 2); c.stroke(); break;
        case 'TESLA': {
            box(x0 - 4, -5, 16, 10, '#1e3a8a', 3);
            c.fillStyle = '#93c5fd'; for (let i = 0; i < 3; i++) c.fillRect(x0 + 1 + i * 4, -6, 2, 12);
            c.strokeStyle = '#cbd5e1'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 12, -4); c.lineTo(x0 + 20, -6); c.moveTo(x0 + 12, 4); c.lineTo(x0 + 20, 6); c.stroke();
            if (p && p.aiming) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(191,219,254,0.9)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 + 20, -6); for (let i = 0; i < 4; i++) c.lineTo(x0 + 20 + (Math.random() - 0.5) * 4, -6 + i * 4); c.stroke(); }
            break;
        }
    }
}
