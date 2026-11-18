/** ==================== VẼ ==================== */
const camera = { x: MAP_W / 2, y: MAP_H / 2, zoom: 1 };
const fogCanvas = document.createElement('canvas');
const fogCtx = fogCanvas.getContext('2d');
const FONT = '"Chakra Petch", "Segoe UI", sans-serif';

function rrect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

function draw() {
    const W = SCREEN_W, H = SCREEN_H, now = performance.now() / 1000;
    ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
    if (!players.length || !world.zone || players.some(p => p.x === undefined)) { return; }
    const th = THEMES[world.theme];

    ctx.save();
    const zoom = camera.zoom * (1 + fx.zoomPunch * 0.08);
    ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-camera.x, -camera.y);
    if (fx.shake > 0 && !paused) ctx.translate((Math.random() - 0.5) * fx.shake, (Math.random() - 0.5) * fx.shake);

    const vx0 = camera.x - W / 2 / zoom - 40, vx1 = camera.x + W / 2 / zoom + 40;
    const vy0 = camera.y - H / 2 / zoom - 40, vy1 = camera.y + H / 2 / zoom + 40;

    // ---- Sàn ----
    ctx.fillStyle = th.floor; ctx.fillRect(0, 0, MAP_W, MAP_H);
    ctx.strokeStyle = th.grid; ctx.lineWidth = 2; ctx.beginPath();
    const gx0 = Math.max(0, Math.floor(vx0 / 60) * 60), gy0 = Math.max(0, Math.floor(vy0 / 60) * 60);
    for (let x = gx0; x <= Math.min(MAP_W, vx1); x += 60) { ctx.moveTo(x, Math.max(0, vy0)); ctx.lineTo(x, Math.min(MAP_H, vy1)); }
    for (let y = gy0; y <= Math.min(MAP_H, vy1); y += 60) { ctx.moveTo(Math.max(0, vx0), y); ctx.lineTo(Math.min(MAP_W, vx1), y); }
    ctx.stroke();
    // vòng tròn trang trí trung tâm
    ctx.strokeStyle = hexA(th.accent.length === 7 ? th.accent : '#334155', 0.5); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(MAP_W / 2, MAP_H / 2, 220, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(MAP_W / 2, MAP_H / 2, 60, 0, Math.PI * 2); ctx.stroke();
    ctx.drawImage(decalCanvas, 0, 0, MAP_W, MAP_H);
    drawFootprints(vx0, vx1, vy0, vy1);
    // viền bản đồ
    ctx.strokeStyle = '#2b3556'; ctx.lineWidth = 14; ctx.strokeRect(-7, -7, MAP_W + 14, MAP_H + 14);

    // ---- Cảnh báo sao băng ----
    meteors.forEach(m => {
        const k = 1 - m.warningTime / m.maxT;
        ctx.fillStyle = `rgba(255,60,60,${0.08 + k * 0.18})`; ctx.beginPath(); ctx.arc(m.x, m.y, 85, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(255,90,90,${0.5 + k * 0.5})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(m.x, m.y, 85 * (1 - k) + 4, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(m.x, m.y, 85, 0, Math.PI * 2); ctx.stroke();
        // thiên thạch đang lao xuống
        const h = (1 - k) * 700;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gx = m.x - h * 0.5, gy = m.y - h;
        const g = ctx.createLinearGradient(gx - 40, gy - 80, gx, gy); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, 'rgba(255,200,120,0.9)');
        ctx.strokeStyle = g; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(gx - 50, gy - 100); ctx.lineTo(gx, gy); ctx.stroke();
        ctx.fillStyle = '#fff1c4'; ctx.beginPath(); ctx.arc(gx, gy, 9, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    });
    // ---- Thính vàng đang rơi ----
    airdrops.forEach(d => {
        const k = 1 - d.t / d.maxT;
        ctx.fillStyle = `rgba(255,210,63,${0.1 + k * 0.2})`; ctx.beginPath(); ctx.arc(d.x, d.y, 50, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -now * 40;
        ctx.beginPath(); ctx.arc(d.x, d.y, 50, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(d.x, d.y, 18 * k + 4, 10 * k + 2, 0, 0, Math.PI * 2); ctx.fill();
        const h = (1 - k) * 500;
        ctx.save(); ctx.translate(d.x, d.y - h);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-16, -14); ctx.lineTo(0, -60); ctx.lineTo(16, -14); ctx.stroke();
        ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(0, -60, 26, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(-16, -16, 32, 32); ctx.fillStyle = '#b8860b'; ctx.fillRect(-16, -3, 32, 6);
        ctx.restore();
    });

    drawGroundZones(now);
    drawNetZones(now);
    drawMines(now);
    drawTrapsExtra(now);

    // ---- Vật cản (giả 3D) ----
    obstacles.forEach(o => {
        if (o.x > vx1 || o.x + o.w < vx0 || o.y > vy1 || o.y + o.h < vy0) return;
        if (o.shieldOf || o.energy) return; // khiên dựng / khiên năng lượng: vẽ riêng hình tấm khiên, không vẽ khối tường
        const depth = o.wood ? 8 : 14;
        ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(o.x + 8, o.y + 12, o.w, o.h);
        ctx.fillStyle = o.wood ? '#3b2716' : o.sandbag ? '#57452a' : o.ice ? '#1e5f80' : '#121829'; ctx.fillRect(o.x, o.y + depth, o.w, o.h);
        let top = o.wood ? COLORS.woodTop : o.sandbag ? '#a68a5b' : o.ice ? (o.reflect ? '#e0f2fe' : '#7dd3fc') : COLORS.wallTop;
        if (o.hit > 0) top = '#fff';
        ctx.fillStyle = top; ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = o.wood ? COLORS.woodEdge : COLORS.wallEdge; ctx.lineWidth = 2; ctx.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
        if (o.wood) {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(o.x + 5, o.y + 5); ctx.lineTo(o.x + o.w - 5, o.y + o.h - 5); ctx.moveTo(o.x + o.w - 5, o.y + 5); ctx.lineTo(o.x + 5, o.y + o.h - 5); ctx.stroke();
            if (o.hp < o.maxHp) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(o.x, o.y - 8, o.w, 4); ctx.fillStyle = '#f59e0b'; ctx.fillRect(o.x, o.y - 8, o.w * o.hp / o.maxHp, 4); }
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(o.x + 3, o.y + 3, o.w - 6, 4);
        }
    });

    // ---- Hòm thính ----
    crates.forEach(c => {
        if (c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) return;
        const age = world.time - c.born, pop = Math.min(1, age * 4);
        const bob = Math.sin(now * 3 + c.blinkOffset) * 2;
        const s = c.size * (0.6 + 0.4 * pop);
        const look = c.type === 'FAKE' ? c.look : c.type;
        if (c.type === 'SUPPORT' && c.look && typeof drawSupportCrate === 'function' && drawSupportCrate(c, s, bob, now)) return; // hộp hỗ trợ nhiều loại
        let col = look === 'SUPPORT' ? COLORS.crate_sup : look === 'LEGEND' ? COLORS.gold : COLORS.crate_wep;
        // bẫy nguỵ trang thành hòm vũ khí, thỉnh thoảng nháy đỏ
        if (c.type === 'TRAP' && Math.sin(now * 2 + c.blinkOffset * 3) > 0.93) col = '#ff3344';
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + s * 0.55, s * 0.55, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(c.x, c.y + bob, 0, c.x, c.y + bob, s * 1.4);
        g.addColorStop(0, hexA(col, c.type === 'LEGEND' ? 0.55 : 0.28)); g.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y + bob, s * 1.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.save(); ctx.translate(c.x, c.y + bob - 2);
        rrect(ctx, -s / 2, -s / 2, s, s, 5); ctx.fillStyle = col; ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-s / 2, s * 0.1, s, s * 0.4);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-s / 2 + 3, -s / 2 + 3, s - 6, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        if (c.type === 'SUPPORT') { ctx.fillRect(-s / 4, -2.5, s / 2, 5); ctx.fillRect(-2.5, -s / 4, 5, s / 2); }
        else if (look === 'LEGEND') { ctx.font = `bold ${s * 0.6}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', 0, 1); }
        else { ctx.fillRect(-s / 3, -2.5, s / 1.5, 5); ctx.fillRect(-s / 3, -s / 4, 4, s / 2); ctx.fillRect(s / 3 - 4, -s / 4, 4, s / 2); }
        ctx.restore();
        // chủ hòm giả / Nhà Sưu Tầm nhìn ra được
        const me = localPlayer();
        if ((c.type === 'FAKE' && (c.owner === localId() || (me && (me.collector || me.saboteur)))) || (c.type === 'TRAP' && me && me.collector)) {
            ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.strokeRect(c.x - s / 2 - 4, c.y + bob - s / 2 - 6, s + 8, s + 8); ctx.setLineDash([]);
        }
    });

    // ---- Vật ném ----
    items.forEach(i => {
        const z = i.z || 0;
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(i.x, i.y + 4, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(i.x, i.y - z * 0.15); ctx.rotate(i.angle);
        if (i.type.id === 'GRENADE') {
            ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#065f46'; ctx.fillRect(-2, -10, 4, 4);
            if (i.fuse > 0) {
                const blink = Math.floor(now * (i.fuse < 0.6 ? 20 : 8)) % 2 === 0;
                if (blink) { ctx.fillStyle = '#ff3344'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); }
                ctx.rotate(-i.angle);
                ctx.strokeStyle = 'rgba(255,60,60,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 160, 0, Math.PI * 2 * (i.fuse / 1.5)); ctx.stroke();
            }
        } else if (i.type.id === 'SMOKE' || i.type.id === 'FIREBOMB' || i.type.id === 'GRAVITY') {
            ctx.fillStyle = i.type.color; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        } else {
            if (WEAPONS[i.type.id]) drawWeaponArt(ctx, WEAPONS[i.type.id], -12, now, null);
            else { ctx.fillStyle = i.type.color === 'transparent' ? '#fff' : i.type.color; ctx.fillRect(-(i.type.len || 14) / 2, -3, i.type.len || 14, 6); }
        }
        ctx.restore();
    });

    // ---- Nhát chém ----
    slashes.forEach(s => {
        const so = players.find(q => q.id === s.ownerId); if (!so || so.hp <= 0 || !canSee(so.x, so.y, so.radius + s.range)) return;
        drawSlashFx(s, so);
    });

    // ---- Người chơi ----
    drawTurrets(now);
    drawDecoys(now);
    players.forEach(p => drawPlayer(p, now));
    drawBushes(now);
    drawAirZones(now); // khói, hố đen phủ lên trên

    // ---- Đạn ----
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    bullets.forEach(b => {
        if (drawSpecialBullet(b, now)) return;
        drawBulletFx(b);
    });
    beams.forEach(bm => {
        if (bm.zig) { drawZigBeam(bm); return; }
        const k = bm.life / bm.maxLife;
        ctx.strokeStyle = hexA(bm.color, k * 0.5); ctx.lineWidth = 18 * k; ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 4 * k + 1; ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    });
    ctx.restore();

    // ---- Hạt ----
    particles.forEach(pt => {
        const a = Math.max(0, Math.min(1, pt.life / (pt.maxLife || 1)));
        if (pt.glow) { ctx.globalCompositeOperation = 'lighter'; }
        ctx.globalAlpha = a; ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(0.5, pt.size * (pt.grow ? 1 : 0.5 + a * 0.5)), 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    });
    ctx.globalAlpha = 1;
    rings.forEach(r => {
        const k = 1 - r.life / r.maxLife;
        ctx.strokeStyle = hexA(r.color, 1 - k); ctx.lineWidth = r.width * (1 - k) + 1;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - k, 3)), 0, Math.PI * 2); ctx.stroke();
    });

    // ---- Vòng bo ----
    drawZone(now);

    // ---- Chữ nổi (luôn quay về phía người chơi gần nhất trên màn cảm ứng) ----
    texts.forEach(t => {
        const k = t.life / t.maxLife;
        ctx.save(); ctx.translate(t.x, t.y);
        if (isTouch && settings.mode === 'pvp' && t.y < camera.y) ctx.rotate(Math.PI);
        const s = 1 + t.pop * 0.5;
        ctx.scale(s / camera.zoom * Math.min(1.4, Math.max(0.8, camera.zoom)), s / camera.zoom * Math.min(1.4, Math.max(0.8, camera.zoom)));
        ctx.globalAlpha = Math.min(1, k * 2.5);
        ctx.font = `700 ${t.size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(t.text, 0, 0);
        ctx.fillStyle = t.color; ctx.fillText(t.text, 0, 0);
        ctx.restore();
    });
    ctx.globalAlpha = 1;

    ctx.restore(); // hết camera

    // ---- Sương mù ----
    if (fowActive()) { drawFogOfWar(zoom); drawPings(zoom); }
    else if (world.darkness) drawFog(zoom);
    drawEnemyArrows(zoom);

    // ---- Lớp màn hình ----
    drawScreenFx(W, H, now);
    if (gameState === 'PLAYING' || gameState === 'COUNTDOWN' || gameState === 'KO' || gameState === 'ROUND_OVER') {
        if (isTouch && localPlayer()) drawTouchControls(localPlayer());
        drawHUD(W, H, now);
    }
    drawBanners(W, H);
    if (gameState === 'COUNTDOWN') drawCountdown(W, H);
}

function drawZone(now) {
    const z = world.zone;
    if (z.r > Math.hypot(MAP_W, MAP_H)) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(-200, -200, MAP_W + 400, MAP_H + 400); ctx.arc(z.x, z.y, Math.max(0, z.r), 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(110, 30, 180, 0.28)'; ctx.fill();
    // sọc chéo
    ctx.clip();
    ctx.strokeStyle = 'rgba(190, 120, 255, 0.08)'; ctx.lineWidth = 14;
    const off = (now * 40) % 60;
    ctx.beginPath();
    for (let x = -MAP_H - 200 + off; x < MAP_W + 200; x += 60) { ctx.moveTo(x, -200); ctx.lineTo(x + MAP_H + 400, MAP_H + 200); }
    ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(200, 130, 255, 0.9)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(z.x, z.y, Math.max(0, z.r), 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(200, 130, 255, 0.25)'; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.arc(z.x, z.y, Math.max(0, z.r), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // vòng mục tiêu
    if (world.zonePhase === 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([16, 12]);
        ctx.beginPath(); ctx.arc(z.tx, z.ty, z.endR, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
}

function drawPlayer(p, now) {
    if (p.hp <= 0) return;
    const me = localPlayer();
    const st = p.st || {};
    let alpha = 1;
    if (p.id !== localId()) {
        const ally = me && sameTeam(me, p), seenBy = (st.reveal > 0) || isSpotted(p, localId()) || ally;
        if (!canSee(p.x, p.y, p.radius) && !seenBy) return; // khuất trong sương mù
        if (me && me.hp > 0 && !targetable(me, p) && !ally) return; // tàng hình / trong khói
        if (!me && ((st.invis > 0 && !(st.reveal > 0)) || (inSmoke(p.x, p.y) && !(st.reveal > 0)))) alpha = 0.12 + Math.sin(now * 10) * 0.05; // chơi chung 1 máy: chỉ còn bóng mờ
    } else if (st.invis > 0 || inSmoke(p.x, p.y)) alpha = 0.45;
    const w = getCurrentWeapon(p);
    if (p.ghostT > 1) alpha = Math.min(alpha, 0.13 + Math.sin(now * 10) * 0.04);
    drawStatusUnder(p, now, alpha);
    drawAirShadow(p);
    ctx.save(); ctx.translate(0, -(p.airH || 0)); // đang bay: vẽ cao lên

    ctx.save(); ctx.globalAlpha = alpha;
    // bóng + quầng sáng đội
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(p.x + 3, p.y + p.radius * 0.7, p.radius * 1.05, p.radius * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(p.x, p.y, p.radius * 0.5, p.x, p.y, p.radius * 3.2);
    g.addColorStop(0, hexA(p.color, 0.35)); g.addColorStop(1, hexA(p.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // vòng chỉ hướng dưới chân
    ctx.strokeStyle = hexA(p.color, 0.6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 7, p.angle - 0.5, p.angle + 0.5); ctx.stroke();

    // vạch ngắm kiểu Brawl Stars (Nhắm Bắn) — chỉ người điều khiển mới thấy
    const mineView = p.id === localId() || localId() === null;
    if (p.aiming && mineView) drawAimZone(p, w, now); // vùng ngắm chỉ người bắn thấy
    else if (p.aimshot && mineView) drawAimGuide(p, w, now);
    if (mineView) drawExtraAim(p, w, now);

    ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    const rc = (p.recoil || 0) * 5;
    // vũ khí (mỗi loại một kiểu)
    drawWeaponArt(ctx, w, p.radius, now, p);
    if (p.muzzle > 0 && w.type === 'GUN' && w.id !== 'TESLA') drawMuzzleFlash(ctx, w, p);
    // tay
    if (w.type !== 'SHIELD') {
        ctx.fillStyle = shade(p.color, -0.2);
        const punch = w.id === 'NONE' && p.cooldown > w.fireRate * p.fireRateMult * 0.6 ? 8 : 0;
        ctx.beginPath(); ctx.arc(p.radius * 0.75 + punch, p.radius * 0.6, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.radius * 0.75, -p.radius * 0.6, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    // thân
    const bg = ctx.createRadialGradient(-p.radius * 0.35, -p.radius * 0.35, p.radius * 0.1, 0, 0, p.radius);
    bg.addColorStop(0, shade(p.color, 0.45)); bg.addColorStop(0.6, p.color); bg.addColorStop(1, shade(p.color, -0.35));
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    // kính mắt
    ctx.fillStyle = 'rgba(10,14,30,0.85)'; rrect(ctx, p.radius * 0.15, -p.radius * 0.5, p.radius * 0.7, p.radius, p.radius * 0.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(p.radius * 0.45, -p.radius * 0.3, p.radius * 0.18, p.radius * 0.18);
    if (p.thorns) {
        ctx.fillStyle = '#facc15';
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(p.radius - 1, -3); ctx.lineTo(p.radius + 6, 0); ctx.lineTo(p.radius - 1, 3); ctx.fill(); ctx.restore(); }
    }
    if (p.hitFlash > 0) { ctx.fillStyle = `rgba(255,255,255,${p.hitFlash * 8})`; ctx.beginPath(); ctx.arc(0, 0, p.radius + 1, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();

    ctx.save(); ctx.globalAlpha = alpha;
    // khiên hồi sinh
    if (p.spawnShield > 0) {
        ctx.strokeStyle = `rgba(255,255,255,${0.3 + Math.sin(now * 20) * 0.2})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2); ctx.stroke();
    }
    drawPlayerExtras(p, w, now);
    drawStatusOver(p, now);
    // choáng
    if (p.stun > 0) {
        ctx.fillStyle = '#facc15'; ctx.font = `14px ${FONT}`; ctx.textAlign = 'center';
        for (let i = 0; i < 3; i++) { const a = now * 6 + i * 2.1; ctx.fillText('★', p.x + Math.cos(a) * 16, p.y - p.radius - 8 + Math.sin(a) * 5); }
    }
    // thanh máu nhỏ trên đầu
    const bw = 40, by = p.y - p.radius - 14;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; rrect(ctx, p.x - bw / 2 - 1, by - 1, bw + 2, 7, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(p.x - bw / 2, by, bw * Math.max(0, p.ghostHp) / p.maxHp, 5);
    const hpk = Math.max(0, p.hp) / p.maxHp;
    ctx.fillStyle = hpk > 0.5 ? '#4ade80' : hpk > 0.25 ? '#facc15' : '#ff4d5e'; ctx.fillRect(p.x - bw / 2, by, bw * hpk, 5);
    if (p.armor > 0) { ctx.fillStyle = COLORS.armor; ctx.fillRect(p.x - bw / 2, by + 6, bw * Math.min(1, p.armor / 150), 2); }
    if (mineView || localId() === null) drawAmmoBar(p, w, p.x - bw / 2, by + (p.armor > 0 ? 9 : 7), bw);
    // nhãn
    ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = p.color;
    const ty = by - 6;
    if (isTouch && settings.mode === 'pvp' && p.id === 1) { ctx.save(); ctx.translate(p.x, p.y + p.radius + 16); ctx.rotate(Math.PI); ctx.fillText(p.label, 0, 0); ctx.restore(); }
    else ctx.fillText(p.label, p.x, ty);
    ctx.restore();
    ctx.restore();
}

function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function drawFog(zoom) {
    const W = SCREEN_W, H = SCREEN_H;
    if (fogCanvas.width !== canvas.width || fogCanvas.height !== canvas.height) { fogCanvas.width = canvas.width; fogCanvas.height = canvas.height; }
    fogCtx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.fillStyle = 'rgba(2,3,8,0.97)'; fogCtx.fillRect(0, 0, W, H);
    fogCtx.globalCompositeOperation = 'destination-out';
    players.forEach(p => {
        if (p.hp <= 0) return;
        const sx = (p.x - camera.x) * zoom + W / 2, sy = (p.y - camera.y) * zoom + H / 2, r = 300 * zoom;
        const g = fogCtx.createRadialGradient(sx, sy, r * 0.15, sx, sy, r);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        fogCtx.fillStyle = g; fogCtx.beginPath(); fogCtx.arc(sx, sy, r, 0, Math.PI * 2); fogCtx.fill();
    });
    // vụ nổ soi sáng bóng tối
    particles.forEach(pt => {
        if (!pt.glow || pt.size < 20) return;
        const sx = (pt.x - camera.x) * zoom + W / 2, sy = (pt.y - camera.y) * zoom + H / 2;
        fogCtx.fillStyle = 'rgba(0,0,0,0.8)'; fogCtx.beginPath(); fogCtx.arc(sx, sy, pt.size * 2 * zoom, 0, Math.PI * 2); fogCtx.fill();
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(fogCanvas, 0, 0);
    ctx.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
}

function drawScreenFx(W, H, now) {
    // viền đỏ máu thấp (ở phía người chơi đó trên cảm ứng)
    players.forEach(p => {
        if (p.hp <= 0 || p.hp > p.maxHp * 0.3 || p.isBot || (localId() !== null && p.id !== localId())) return;
        const k = 0.35 + Math.sin(now * 6) * 0.15;
        let g;
        if (isTouch && settings.mode === 'pvp') {
            g = p.id === 1 ? ctx.createLinearGradient(0, 0, 0, H * 0.3) : ctx.createLinearGradient(0, H, 0, H * 0.7);
        } else {
            g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
        }
        g.addColorStop(isTouch && settings.mode === 'pvp' ? 0 : 1, `rgba(220,20,40,${k})`); g.addColorStop(isTouch && settings.mode === 'pvp' ? 1 : 0, 'rgba(220,20,40,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    // vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    if (fx.flash > 0) { ctx.globalAlpha = fx.flash; ctx.fillStyle = fx.flashColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    // slow-mo: viền điện ảnh
    if (fx.slowMo > 0) {
        const bh = Math.min(1, fx.slowMo * 2) * H * 0.08;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
    }
}





function drawBanners(W, H) {
    banners.forEach(b => {
        const t = 1 - b.life / b.maxLife;
        const inK = Math.min(1, t * 6), outK = Math.min(1, b.life * 3);
        const scale = 1 + (1 - inK) * 0.8;
        const draws = isTouch && settings.mode === 'pvp' ? [[W / 2, H * 0.71, 0], [W / 2, H * 0.29, Math.PI]] : [[W / 2, H * 0.24, 0]];
        draws.forEach(([x, y, rot]) => {
            ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale); ctx.globalAlpha = outK * inK;
            const size = isTouch ? b.size * 0.62 : b.size;
            ctx.font = `700 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const tw = ctx.measureText(b.text).width;
            const g = ctx.createLinearGradient(-tw / 2 - 60, 0, tw / 2 + 60, 0);
            g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.2, 'rgba(0,0,0,0.6)'); g.addColorStop(0.8, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g; ctx.fillRect(-tw / 2 - 60, -size * 0.75, tw + 120, size * (b.sub ? 2.1 : 1.5));
            ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(b.text, 0, 0);
            ctx.fillStyle = b.color; ctx.fillText(b.text, 0, 0);
            if (b.sub) { ctx.font = `600 ${size * 0.32}px ${FONT}`; ctx.fillStyle = '#e2e8f0'; ctx.fillText(b.sub, 0, size * 0.85); }
            ctx.restore();
        });
    });
}

function drawCountdown(W, H) {
    const n = Math.ceil(countdown);
    const frac = countdown - Math.floor(countdown);
    const s = 1 + frac * 0.8;
    const draws = isTouch && settings.mode === 'pvp' ? [[W / 2, H / 2, 0]] : [[W / 2, H * 0.6, 0]];
    draws.forEach(([x, y, r]) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, frac * 3 + 0.2);
        ctx.font = `700 ${isTouch ? 70 : 110}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(n, 0, 0);
        ctx.fillStyle = n === 1 ? '#ff4d5e' : n === 2 ? '#ffd23f' : '#fff'; ctx.fillText(n, 0, 0);
        ctx.restore();
    });
}

/* ==================== VẼ KỸ NĂNG & VÙNG HIỆU ỨNG ==================== */
function drawGroundZones(now) {
    zones.forEach(z => {
        if (z.type === 'lava') {
            const on = lavaActive(z), warm = lavaWarming(z);
            const g = ctx.createRadialGradient(z.x, z.y, z.r * 0.1, z.x, z.y, z.r);
            if (on) { g.addColorStop(0, 'rgba(255,220,120,0.95)'); g.addColorStop(0.5, 'rgba(255,110,30,0.85)'); g.addColorStop(1, 'rgba(180,30,10,0.5)'); }
            else { g.addColorStop(0, warm && Math.sin(now * 20) > 0 ? 'rgba(255,120,40,0.7)' : 'rgba(90,30,20,0.85)'); g.addColorStop(1, 'rgba(40,15,10,0.6)'); }
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = on ? 'rgba(255,170,60,0.9)' : warm ? 'rgba(255,90,40,0.9)' : 'rgba(120,50,30,0.8)'; ctx.lineWidth = 4; ctx.stroke();
            if (on && Math.random() < 0.4) particles.push({ x: z.x + (Math.random() - 0.5) * z.r * 1.4, y: z.y + (Math.random() - 0.5) * z.r * 1.4, vx: 0, vy: -40, life: 0.6, maxLife: 0.6, color: '#fb923c', size: 4, glow: true });
            if (!on) { ctx.font = `700 ${Math.round(z.r * 0.35)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = warm ? '#fde047' : 'rgba(255,255,255,0.18)'; ctx.fillText(warm ? '⚠' : '🔥', z.x, z.y); ctx.textBaseline = 'alphabetic'; }
        } else if (z.type === 'fire') {
            const k = Math.min(1, z.t / 0.5);
            const g = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.r);
            g.addColorStop(0, `rgba(255,200,80,${0.55 * k})`); g.addColorStop(0.7, `rgba(255,90,20,${0.4 * k})`); g.addColorStop(1, 'rgba(255,60,0,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (1 + Math.sin(now * 12) * 0.03), 0, Math.PI * 2); ctx.fill();
        }
    });
}
function drawAirZones(now) {
    zones.forEach(z => {
        if (z.type === 'smoke') {
            const lid = localId(), mine = lid !== null && (z.owner === lid || sameTeamId(lid, z.owner));
            let k = Math.max(0, Math.min(1, z.t / 0.8));
            if (mine) { // khói của mình: chỉ mờ nhẹ + viền đứt để còn nhìn rõ bên trong
                ctx.save(); ctx.strokeStyle = `rgba(203,213,225,${0.5 * k})`; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -now * 20;
                ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
                k *= 0.22;
            }
            for (let i = 0; i < 7; i++) {
                const a = i * 0.9 + now * 0.3, rr = z.r * 0.45;
                ctx.fillStyle = `rgba(150,160,180,${0.38 * k})`;
                ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * rr, z.y + Math.sin(a) * rr, z.r * 0.62, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = `rgba(170,180,200,${0.55 * k})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.7, 0, Math.PI * 2); ctx.fill();
        } else if (z.type === 'gravity') {
            ctx.save(); ctx.translate(z.x, z.y);
            for (let i = 0; i < 3; i++) {
                ctx.rotate(now * 3 + i);
                ctx.strokeStyle = `rgba(168,85,247,${0.5 - i * 0.12})`; ctx.lineWidth = 6 - i;
                ctx.beginPath(); ctx.arc(0, 0, z.r * (0.35 + i * 0.25), 0, Math.PI * 1.3); ctx.stroke();
            }
            ctx.fillStyle = '#0b0016'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
        }
    });
}
function drawMines(now) {
    mines.forEach(m => {
        // bẫy của địch là vô hình; chơi chung 1 máy thì chỉ thấy rất mờ
        if (localId() !== null && m.owner !== localId()) return;
        ctx.globalAlpha = localId() === null ? 0.22 : 0.8;
        ctx.strokeStyle = pColor(m.owner); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(m.x, m.y, 12, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + now; ctx.beginPath(); ctx.moveTo(m.x + Math.cos(a) * 6, m.y + Math.sin(a) * 6); ctx.lineTo(m.x + Math.cos(a) * 14, m.y + Math.sin(a) * 14); ctx.stroke(); }
        ctx.globalAlpha = 1;
    });
}
function drawTurrets(now) {
    turrets.forEach(t => {
        if (localId() !== null && t.owner !== localId() && !canSee(t.x, t.y, 12)) return;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(t.x + 3, t.y + 8, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(t.x, t.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = t.color; ctx.lineWidth = 3; ctx.stroke();
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.angle); ctx.fillStyle = '#94a3b8'; ctx.fillRect(0, -3, 18, 6); ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, t.t / 8)); ctx.stroke();
    });
}
function drawDecoys(now) {
    decoys.forEach(d => {
        if (localId() !== null && d.owner !== localId() && !canSee(d.x, d.y, d.radius)) return;
        ctx.globalAlpha = d.owner === localId() ? 0.5 : 1;
        ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.angle);
        ctx.fillStyle = 'rgba(10,14,30,0.85)'; rrect(ctx, d.radius * 0.15, -d.radius * 0.5, d.radius * 0.7, d.radius, d.radius * 0.3); ctx.fill();
        ctx.restore();
        ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = d.color; ctx.fillText(d.label || '', d.x, d.y - d.radius - 8);
        ctx.globalAlpha = 1;
    });
}
function drawStatusUnder(p, now, alpha) {
    const st = p.st || {};
    if (st.rage > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,40,40,${0.25 * alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 2 + Math.sin(now * 15) * 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    if (st.haste > 0) { ctx.strokeStyle = `rgba(250,204,21,${0.6 * alpha})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 12, now * 8, now * 8 + 2); ctx.stroke(); }
}
function drawStatusOver(p, now) {
    const st = p.st || {};
    if (st.shield > 0) {
        ctx.fillStyle = 'rgba(103,232,249,0.15)'; ctx.strokeStyle = `rgba(103,232,249,${0.6 + Math.sin(now * 8) * 0.2})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (st.reflect > 0) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now * 60; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 14, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (st.invuln > 0) { ctx.strokeStyle = `rgba(253,224,71,${0.5 + Math.sin(now * 25) * 0.4})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2); ctx.stroke(); }
    if (st.slow > 0) { ctx.fillStyle = 'rgba(147,197,253,0.3)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2); ctx.fill(); }
    if (st.burn > 0 && Math.random() < 0.4) particles.push({ x: p.x + (Math.random() - 0.5) * 16, y: p.y, vx: 0, vy: -60, life: 0.35, maxLife: 0.35, color: '#fb923c', size: 4, glow: true });
    if (st.mark > 0) {
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; const r = p.radius + 16 + Math.sin(now * 6) * 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a) * (r - 6), p.y + Math.sin(a) * (r - 6)); ctx.lineTo(p.x + Math.cos(a) * (r + 6), p.y + Math.sin(a) * (r + 6)); ctx.stroke(); }
    }
    if (p.aimshot && (p.superCharge || 0) >= (p.superNeed || 5)) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(253,224,71,${0.6 + Math.sin(now * 10) * 0.3})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
}
/** Vạch ngắm kiểu Brawl Stars: dải mờ hiện tầm bắn và hướng */
function drawAimGuide(p, w, now) {
    const range = w.type === 'GUN' ? Math.min(w.range, 700) : w.type === 'THROWABLE' ? 450 : (w.range || 30) + p.radius;
    const ready = (p.superCharge || 0) >= (p.superNeed || 5);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    if (w.type === 'GUN') {
        const half = Math.max(6, range * Math.tan(Math.max(0.02, (w.spread || 0) * p.spreadMult) / 2));
        ctx.fillStyle = ready ? 'rgba(253,224,71,0.14)' : 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.moveTo(p.radius, -5); ctx.lineTo(range, -half); ctx.lineTo(range, half); ctx.lineTo(p.radius, 5); ctx.fill();
        ctx.strokeStyle = ready ? 'rgba(253,224,71,0.6)' : 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -now * 40;
        ctx.beginPath(); ctx.moveTo(p.radius + 4, 0); ctx.lineTo(range, 0); ctx.stroke(); ctx.setLineDash([]);
    } else {
        ctx.fillStyle = ready ? 'rgba(253,224,71,0.16)' : 'rgba(255,255,255,0.08)';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, range, -1.1, 1.1); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
}
