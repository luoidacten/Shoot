/** ==================== BOT THÔNG MINH: UTILITY AI + 8 TÍNH CÁCH ẨN ====================
 *  Mỗi bot có 1 tính cách ẩn (chỉ lộ ở bảng tổng kết). Cứ 0.3 giây bot chấm điểm (utility) 7 ý định:
 *  ĐÁNH · THẢ DIỀU (giữ khoảng cách) · ĐÁNH VÒNG SƯỜN · RÚT LUI · NHẶT ĐỒ · PHỤC KÍCH · TRUY LÙNG
 *  và theo đuổi ý định điểm cao nhất (có quán tính để không đổi ý liên tục).
 *  Né đạn, tránh nguy hiểm, bóp cò, dùng kỹ năng vẫn do AI gốc (ai.js) lo.
 */
const PERSONAS = {
    berserker: { name: 'Hổ Báo', icon: '😤', agg: 1.0, caution: 0.1, greed: 0.3, patience: 0.0, flank: 0.2, range: 0.6, opp: 0.4 },
    cautious:  { name: 'Thận Trọng', icon: '🧐', agg: 0.4, caution: 1.0, greed: 0.5, patience: 0.4, flank: 0.2, range: 1.2, opp: 0.3 },
    ambusher:  { name: 'Rình Rập', icon: '🐍', agg: 0.6, caution: 0.5, greed: 0.3, patience: 1.0, flank: 0.3, range: 1.0, opp: 0.5 },
    flanker:   { name: 'Du Kích', icon: '🦊', agg: 0.7, caution: 0.4, greed: 0.3, patience: 0.2, flank: 1.0, range: 0.9, opp: 0.4 },
    looter:    { name: 'Tham Lam', icon: '💰', agg: 0.5, caution: 0.5, greed: 1.0, patience: 0.2, flank: 0.3, range: 1.0, opp: 0.3 },
    marksman:  { name: 'Xạ Thủ', icon: '🎯', agg: 0.5, caution: 0.7, greed: 0.4, patience: 0.5, flank: 0.2, range: 1.5, opp: 0.4 },
    vulture:   { name: 'Kẻ Cơ Hội', icon: '🦅', agg: 0.6, caution: 0.6, greed: 0.4, patience: 0.3, flank: 0.4, range: 1.0, opp: 1.0 },
    tactician: { name: 'Chiến Thuật Gia', icon: '🧠', agg: 0.7, caution: 0.6, greed: 0.5, patience: 0.4, flank: 0.6, range: 1.0, opp: 0.6 }
};
const PERSONA_IDS = Object.keys(PERSONAS);
const INTENT_NAME = { fight: 'ĐÁNH', kite: 'THẢ DIỀU', flank: 'VÒNG SƯỜN', retreat: 'RÚT LUI', loot: 'NHẶT ĐỒ', ambush: 'PHỤC KÍCH', hunt: 'TRUY LÙNG' };

const _createBrain6 = createBrain;
createBrain = function () {
    const B = _createBrain6();
    B.persona = PERSONA_IDS[Math.floor(Math.random() * PERSONA_IDS.length)];
    B.intent = 'hunt'; B.thinkT = 0; B.flankSide = Math.random() < 0.5 ? 1 : -1; B.flankT = 0;
    return B;
};
const persona = p => PERSONAS[(p.brain && p.brain.persona) || 'tactician'];

/** Chọn mục tiêu bằng điểm: thấy được, gần, máu thấp (Kẻ Cơ Hội), kẻ vừa đánh mình, giữ mục tiêu cũ */
botTarget = function (p) {
    const B = p.brain || (p.brain = createBrain()), P = persona(p);
    let best = null, bs = -1e9;
    for (const e of enemiesOf(p)) {
        const vis = targetable(p, e), d = dist(p.x, p.y, e.x, e.y);
        let s = (vis ? 3 : 0) - d / 450 + P.opp * 1.6 * (1 - e.hp / e.maxHp) + (p.lastHitBy === e.id ? 0.9 : 0) + (e.id === B.targetId ? 0.6 : 0);
        if (!vis && !(B.lastSeen && world.time - B.lastSeen.t < 6)) s -= 1;
        if (s > bs) { bs = s; best = e; }
    }
    if (best) B.targetId = best.id;
    return best;
};

function nearestBush(p, maxD, toward) {
    let best = null, bd = maxD;
    bushes.forEach(b => {
        if (b.burning || !insideZone(b.x, b.y, 40)) return;
        let d = dist(p.x, p.y, b.x, b.y);
        if (toward) d += dist(b.x, b.y, toward.x, toward.y) * 0.35; // ưu tiên bụi nằm trên đường địch tới
        if (d < bd) { bd = d; best = b; }
    });
    return best;
}
function bestCrate(p, maxD) {
    let best = null, bd = maxD;
    crates.forEach(c => {
        if (c.type === 'TRAP' || !insideZone(c.x, c.y, 30)) return;
        const d = dist(p.x, p.y, c.x, c.y) - (c.type === 'LEGEND' ? 300 : 0);
        if (d < bd) { bd = d; best = c; }
    });
    return best;
}
/** Chấm điểm các ý định */
function scoreIntents(p) {
    const B = p.brain, P = persona(p), e = players.find(q => q.id === B.targetId && q.hp > 0);
    const vis = !!(e && targetable(p, e)), d = e ? dist(p.x, p.y, e.x, e.y) : 1e9;
    const hpR = p.hp / p.maxHp, w = getCurrentWeapon(p), gun = w.type === 'GUN' && hasAmmo(w);
    const eMelee = e && ['MELEE', 'SHIELD'].includes(getCurrentWeapon(e).type);
    const weak = (w.tier || 0) <= 1 && ((p.inventory[otherSlot(p)] || {}).tier || 0) <= 1;
    const wantD = gun ? Math.min(w.range * (0.45 + 0.25 * P.range), 700) : 60;
    const U = {
        fight: vis ? (0.45 + 0.5 * P.agg) * (0.35 + 0.65 * hpR) + P.opp * 0.45 * (1 - e.hp / e.maxHp) + (gun || d < 160 ? 0.1 : -0.25) : 0,
        kite: vis && gun ? P.caution * 0.7 * (d < wantD ? 1 : 0.35) + (eMelee ? 0.25 : 0) : 0,
        flank: vis && d > 180 && d < 650 ? P.flank * 0.75 * (0.6 + 0.4 * hpR) : 0,
        retreat: Math.pow(1 - hpR, 1.5) * (0.45 + P.caution) * (vis ? 1 : 0.35) - P.agg * 0.25,
        loot: crates.length ? (weak ? 0.65 : 0.15) * (0.4 + P.greed) * (vis && d < 300 ? 0.4 : 1) : 0,
        ambush: !vis ? P.patience * 0.6 * (nearestBush(p, 450) ? 1 : 0.15) : (d > 350 && inBush(p.x, p.y) ? P.patience * 0.55 : 0),
        hunt: vis ? 0.05 : 0.38
    };
    if (U[B.intent] !== undefined) U[B.intent] += 0.12; // quán tính: không đổi ý liên tục
    let best = 'hunt'; for (const k in U) if (U[k] > U[best]) best = k;
    return { best, e, vis, d, wantD };
}
/** Hướng đi cho ý định đã chọn (null = để AI gốc tự lo) */
function intentMove(p, info, dt) {
    const B = p.brain, e = info.e, z = world.zone;
    switch (B.intent) {
        case 'kite': {
            if (!e || info.d > info.wantD) return null;
            B.strafeT = (B.strafeT || 0) - dt; if (B.strafeT <= 0) { B.strafeT = 0.7 + Math.random(); B.strafeDir = -(B.strafeDir || 1); }
            return Math.atan2(p.y - e.y, p.x - e.x) + (B.strafeDir || 1) * 0.7;
        }
        case 'flank': {
            if (!e) return null;
            B.flankT -= dt; if (B.flankT <= 0) { B.flankT = 3 + Math.random() * 2; if (Math.random() < 0.3) B.flankSide *= -1; }
            const a0 = Math.atan2(p.y - e.y, p.x - e.x) + B.flankSide * 1.25, R = Math.max(200, Math.min(320, info.wantD));
            const tx = e.x + Math.cos(a0) * R, ty = e.y + Math.sin(a0) * R;
            return dist(p.x, p.y, tx, ty) > 30 ? Math.atan2(ty - p.y, tx - p.x) : null;
        }
        case 'retreat': {
            const sup = crates.filter(c => c.type === 'SUPPORT' && insideZone(c.x, c.y, 30)).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))[0];
            if (sup && dist(p.x, p.y, sup.x, sup.y) < 450 && (!e || dist(sup.x, sup.y, e.x, e.y) > dist(p.x, p.y, e.x, e.y))) return Math.atan2(sup.y - p.y, sup.x - p.x);
            if (e && info.vis) { const away = Math.atan2(p.y - e.y, p.x - e.x), toZ = Math.atan2(z.y - p.y, z.x - p.x); return dist(p.x, p.y, z.x, z.y) > z.r * 0.7 ? toZ : away; }
            const b = nearestBush(p, 400); return b && !inBush(p.x, p.y) ? Math.atan2(b.y - p.y, b.x - p.x) : null;
        }
        case 'loot': { const c = bestCrate(p, 900); return c ? Math.atan2(c.y - p.y, c.x - p.x) : null; }
        case 'ambush': {
            if (inBush(p.x, p.y)) return 'hold';
            const b = nearestBush(p, 450, B.lastSeen); return b ? Math.atan2(b.y - p.y, b.x - p.x) : null;
        }
    }
    return null; // fight / hunt: AI gốc
}

const _botThink6 = botThink;
botThink = function (p, dt) {
    const out = _botThink6(p, dt), B = p.brain;
    if (!B || gameState !== 'PLAYING') return out;
    B.thinkT -= dt;
    if (B.thinkT <= 0) { B.thinkT = 0.3; const info = scoreIntents(p); B.intent = info.best; B.info = info; }
    // nguy hiểm, né đạn, ngoài bo: để AI gốc xử lý
    const z = world.zone;
    if (B.dodgeT > 0 || dist(p.x, p.y, z.x, z.y) > z.r - 60 || !B.info) return out;
    const info = B.info; info.e = players.find(q => q.id === B.targetId && q.hp > 0); if (info.e) info.d = dist(p.x, p.y, info.e.x, info.e.y);
    const ang = intentMove(p, info, dt);
    if (ang === 'hold') { out.move = { x: 0, y: 0 }; return out; }
    if (ang === null) return out;
    const a = steer(p, ang);
    // tách khỏi người khác cho đỡ dính
    let mx = Math.cos(a), my = Math.sin(a);
    players.forEach(q => { if (q === p || q.hp <= 0) return; const dd = dist(p.x, p.y, q.x, q.y), R = p.radius + q.radius + 40; if (dd < R && dd > 0.01) { const k = (1 - dd / R) * 1.4; mx += (p.x - q.x) / dd * k; my += (p.y - q.y) / dd * k; } });
    B.mv2 = B.mv2 || { x: mx, y: my };
    const k = Math.min(1, dt * 6); B.mv2.x += (mx - B.mv2.x) * k; B.mv2.y += (my - B.mv2.y) * k;
    const m = Math.hypot(B.mv2.x, B.mv2.y) || 1;
    out.move = { x: B.mv2.x / m, y: B.mv2.y / m };
    return out;
};

/* Tổng kết: lộ tính cách ẩn của bot */
const _showGameOver6 = showGameOver;
showGameOver = function () {
    _showGameOver6();
    const ps = players.slice().sort((a, b) => b.score - a.score || b.stats.dmg - a.stats.dmg);
    if (!ps.some(p => p.brain && p.brain.persona)) return;
    const row = document.createElement('tr');
    row.innerHTML = `<td>Tính cách</td>${ps.map(p => { const P = p.brain && PERSONAS[p.brain.persona]; return `<td>${P ? P.icon + ' ' + P.name : '—'}</td>`; }).join('')}`;
    $('go-stats').appendChild(row);
};
