'use strict';
/* =====================================================================
 *  BOT GIỐNG NGƯỜI + BOT HỌC NGƯỜI CHƠI + NGHE CHỈ BIẾT HƯỚNG
 *  - Nhận thức: tầm nhìn có hạn (kể cả khi tắt sương mù), bị khói/tường/bụi chặn, phản xạ 0.2–0.4s,
 *    nhớ vị trí cuối 3–5s, xoay tâm có tốc độ tối đa, nghe tiếng chỉ biết HƯỚNG (đoán khoảng cách).
 *  - Bắn như người: lệch tâm lúc đầu rồi kéo dần, bắn theo loạt ở tầm xa, hoảng khi bị bắn lén,
 *    bắn đè vị trí cuối, bắn thăm dò bụi/khói, ném lựu vào chỗ vừa nấp.
 *  - Hit & run, bị truy đuổi: chạy lắt léo + tìm vật cản che, thả khói/tường chặn đường,
 *    phục kích ngược sau góc tường, chỉ quay lại bắn khi địch quá sát; cắt đuôi xong mới hồi máu.
 *  - Tính cách (Hổ Báo = Rusher, Thận Trọng = Camper, Tham Lam = Loot Goblin…) + nhiễu quyết định.
 *  - HỌC NGƯỜI CHƠI (lưu trên máy): khắc chế thói quen + bắt chước chiêu người chơi hay dùng.
 *  - Người chơi nghe tiếng chỉ thấy hướng; thẻ Cảm Quan Địa Chấn / lợi thế Giác Quan Nhạy Bén nghe rõ vị trí.
 *  Nạp sau sight.js.
 * ===================================================================== */
const BM = {
    react: [[0.45, 0.65], [0.22, 0.4], [0.14, 0.26]], // thời gian phản ứng (dễ / vừa / ác mộng)
    turn: [4.5, 7.5, 11],                               // tốc độ xoay tâm tối đa (rad/giây)
    err: [0.5, 0.3, 0.17],                              // độ lệch tâm phát đầu
    sight: 760                                          // tầm nhìn bot khi TẮT sương mù
};
const bmDiff = () => Math.max(0, Math.min(2, settings.diff === undefined ? 1 : settings.diff));
const rr = (a, b) => a + Math.random() * (b - a);
const isHuman = q => !!q && !q.isBot && !q.temp;

/* ============================== NGHE: thẻ & lợi thế nghe rõ vị trí ============================== */
defP('seismic', '📳', 'Cảm Quan Địa Chấn', 'Nghe rõ VỊ TRÍ của mọi âm thanh (tiếng chân, tiếng súng, tiếng chém): gợn sóng hiện đúng chỗ phát ra tiếng như trước, cả trên bản đồ nhỏ & bảng chiến thuật.', p => {});
ADVANTAGES.keenSense = { icon: '👂', name: 'Giác Quan Nhạy Bén', desc: 'Nghe rõ VỊ TRÍ tiếng chân & mọi âm thanh (như thẻ Cảm Quan Địa Chấn), đồng thời nhìn xa hơn 12%.' };
ADV_IDS.push('keenSense');
const hearsExact = p => !!p && (has(p, 'seismic') || p.adv === 'keenSense');
const keenK = v => v && v.adv === 'keenSense' ? 1.12 : 1;
const _visionAt31 = visionAt;
visionAt = function (v, ang) { return _visionAt31(v, ang) * keenK(v); };
const _nearRadius31 = nearRadius;
nearRadius = function (v) { return _nearRadius31(v) * keenK(v); };
const _visionRange31 = visionRange;
visionRange = function (viewer) { return _visionRange31(viewer) * keenK(viewer || localPlayer()); };

/* ============================== TẦM NGHE: gần hơn, bị vật cản làm nghẹt ============================== */
const HEAR_R = { step: 600, melee: 550, gun: 950, boom: 1300 }; // xa hơn tầm nhìn một chút
defP('keenEar', '🎧', 'Tai Nghe Xuyên Vách', 'Âm thanh truyền qua vật cản gần như không bị giảm (mỗi lớp tường chỉ -8% thay vì -35%), và nghe xa hơn 35%.', p => {});
{ const c = { id: 'deepListen', a: 'keenEar', b: 'seismic', name: 'Nghe Thấu Đất', desc: 'Nghe xa hơn thêm 25%: nghe rõ vị trí từ rất xa, xuyên nhiều lớp tường.' }; COMBOS.push(c); (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); }
function wallsBetween(x1, y1, x2, y2, cap = 4) { let n = 0; for (const o of obstacles) { if (o.energy) continue; if (segRect(x1, y1, x2, y2, o) >= 0 && ++n >= cap) break; } return n; }
/** tầm nghe thực tế của người nghe tới nguồn âm (đã trừ vật cản) */
function hearReach(v, kind, x, y) {
    let R = HEAR_R[kind] || 600;
    if (v.adv === 'minimap' || has(v, 'miniMapCard')) R *= kind === 'step' ? 1.4 : 1.15;
    if (combo(v, 'bigEar')) R *= 1.3;
    if (has(v, 'keenEar')) R *= 1.35;
    if (combo(v, 'deepListen')) R *= 1.25;
    const n = wallsBetween(v.x, v.y, x, y);
    return R * Math.pow(has(v, 'keenEar') ? 0.92 : 0.65, n);
}
const soundKind = type => type === 'step' ? 'step' : type === 'explosion' ? 'boom' : ['swing', 'hit', 'crit', 'block'].includes(type) ? 'melee' : 'gun';
const _onHeard31 = onHeard;
onHeard = function (type, x, y) {
    const me = localPlayer();
    if (me && me.hp > 0 && dist(me.x, me.y, x, y) > hearReach(me, soundKind(type), x, y)) return; // quá xa / bị tường chặn tiếng
    return _onHeard31(type, x, y);
};
/* ============================== NGƯỜI CHƠI: nghe chỉ thấy HƯỚNG ============================== */
const MINI_NEAR = 520; // bản đồ nhỏ / bảng: tiếng ở gần vẫn hiện rõ chỗ
const _drawPings31 = drawPings;
drawPings = function (zoom) {
    const me = localPlayer();
    if (!pings.length || !me || hearsExact(me)) return _drawPings31(zoom);
    const W = SCREEN_W, H = SCREEN_H, cx = (me.x - camera.x) * zoom + W / 2, cy = (me.y - camera.y) * zoom + H / 2;
    const col = { step: '200,210,235', gun: '255,170,60', boom: '255,80,60', melee: '230,230,255' };
    pings.forEach(p => {
        const k = 1 - p.life / p.maxLife, a = Math.atan2(p.y - me.y, p.x - me.x), d = dist(me.x, me.y, p.x, p.y);
        const near = Math.max(0, 1 - d / 1400), R = 62 + (p.kind === 'boom' ? 14 : 0), half = p.kind === 'step' ? 0.22 : 0.32;
        ctx.save(); ctx.strokeStyle = `rgba(${col[p.kind]},${(1 - k) * (0.45 + 0.5 * near)})`; ctx.lineWidth = (p.kind === 'step' ? 3 : 5) * (0.6 + 0.6 * near); ctx.lineCap = 'round';
        for (let i = 0; i < (p.kind === 'step' ? 1 : 2); i++) { ctx.beginPath(); ctx.arc(cx, cy, R + i * 9 + k * 10, a - half, a + half); ctx.stroke(); }
        ctx.restore();
    });
};
function withNearPings(me, fn) {
    if (!me || hearsExact(me)) return fn();
    const all = pings.slice(); pings.length = 0; all.forEach(pg => { if (dist(me.x, me.y, pg.x, pg.y) < MINI_NEAR) pings.push(pg); });
    try { return fn(); } finally { const keep = new Set(pings); all.forEach(pg => { if (!keep.has(pg)) pings.push(pg); }); }
}
const _drawMinimap31 = drawMinimap;
drawMinimap = function (me, W, H, now) { return withNearPings(me, () => _drawMinimap31(me, W, H, now)); };
const _drawPicker31 = drawPicker;
drawPicker = function (me, W, H, now) { return withNearPings(me, () => _drawPicker31(me, W, H, now)); };

/* ============================== HỌC NGƯỜI CHƠI (lưu trên máy) ============================== */
const LEARN_KEY = 'dtkn-botlearn';
const LP0 = { n: 0, engageD: 360, bush: 0.08, smoke: 0.04, melee: 0.3, rush: 0.3, throwPM: 0.2, probe: 0.04, smokePM: 0.2, hitRun: 0.1 };
let LP = { ...LP0 };
try { Object.assign(LP, JSON.parse(localStorage.getItem(LEARN_KEY) || '{}')); } catch (e) {}
const LR = { t: 0, bushT: 0, smokeT: 0, closeT: 0, combatT: 0, meleeDmg: 0, dmg: 0, dSum: 0, dN: 0, throws: 0, shots: 0, probes: 0, smokes: 0, hits: 0, hitRuns: 0, pend: [] };
function learnReset() { Object.assign(LR, { t: 0, bushT: 0, smokeT: 0, closeT: 0, combatT: 0, meleeDmg: 0, dmg: 0, dSum: 0, dN: 0, throws: 0, shots: 0, probes: 0, smokes: 0, hits: 0, hitRuns: 0, pend: [] }); }
function learnCommit() {
    if (LR.t < 8 || settings.mode === 'online' && net.role === 'guest') { learnReset(); return; }
    const a = Math.max(0.15, 1 / (LP.n + 1)), m = LR.t / 60, ema = (k, v) => { if (isFinite(v)) LP[k] = LP[k] * (1 - a) + v * a; };
    ema('bush', LR.bushT / LR.t); ema('smoke', LR.smokeT / LR.t);
    if (LR.combatT > 3) ema('rush', LR.closeT / LR.combatT);
    if (LR.dN) ema('engageD', LR.dSum / LR.dN);
    if (LR.dmg > 30) ema('melee', LR.meleeDmg / LR.dmg);
    ema('throwPM', LR.throws / m); ema('smokePM', LR.smokes / m);
    if (LR.shots > 4) ema('probe', LR.probes / LR.shots);
    if (LR.hits > 2) ema('hitRun', LR.hitRuns / LR.hits);
    LP.n++;
    try { localStorage.setItem(LEARN_KEY, JSON.stringify(LP)); } catch (e) {}
    learnReset();
}
/** Hệ số bot rút ra từ những gì đã học (chưa học gì = bình thường) */
function learnK() {
    if (!LP.n) return { probe: 1, kite: 1, rush: 1, bait: 1, throwR: 0, smoke: 1, hitRun: 1, bush: false, smokeHunt: false };
    return {
        probe: 0.7 + LP.probe * 5 + (LP.bush > 0.18 ? 0.6 : 0) + (LP.smoke > 0.1 ? 0.4 : 0), // bắt chước + khắc chế người hay núp
        kite: LP.engageD < 230 || LP.melee > 0.5 ? 1.5 : 1,                                 // người chơi đánh gần → bot giữ khoảng cách
        rush: LP.engageD > 480 ? 1.4 : 1,                                                    // người chơi bắn xa → bot áp sát / vòng sườn
        bait: 1 + LP.rush * 1.5,                                                             // người chơi hay đuổi → bot phục kích ngược
        throwR: LP.throwPM,                                                                  // bắt chước ném vũ khí
        smoke: 1 + LP.smokePM * 0.8,                                                         // bắt chước dùng khói
        hitRun: 0.6 + LP.hitRun * 3,                                                         // bắt chước đánh rồi rút
        bush: LP.bush > 0.18, smokeHunt: LP.smoke > 0.1
    };
}
function learnSummary() {
    if (!LP.n) return '';
    const t = [];
    if (LP.engageD < 230 || LP.melee > 0.5) t.push('bạn hay áp sát → bot giữ khoảng cách'); else if (LP.engageD > 480) t.push('bạn hay bắn xa → bot áp sát & vòng sườn');
    if (LP.bush > 0.18) t.push('bạn hay núp bụi → bot bắn thăm dò bụi');
    if (LP.smoke > 0.1) t.push('bạn hay vào khói → bot bắn vào khói');
    if (LP.rush > 0.45) t.push('bạn hay đuổi theo → bot phục kích sau góc tường');
    if (LP.throwPM > 0.6) t.push('bot học bạn ném vũ khí');
    if (LP.probe > 0.12) t.push('bot học bạn bắn thăm dò');
    if (LP.hitRun > 0.25) t.push('bot học bạn đánh rồi rút');
    if (LP.smokePM > 0.6) t.push('bot học bạn dùng khói');
    return `🧠 Bot đã học bạn (${LP.n} hiệp): ` + (t.length ? t.join(' · ') : 'chưa thấy thói quen rõ rệt');
}
function learnTick(dt) {
    if (gameState !== 'PLAYING' || net.role === 'guest') return;
    const bots = players.filter(q => q.isBot && q.hp > 0);
    players.forEach(h => {
        if (!isHuman(h) || h.hp <= 0) return;
        LR.t += dt;
        if (inBush(h.x, h.y)) LR.bushT += dt;
        if (inSmoke(h.x, h.y)) LR.smokeT += dt;
        let dn = 1e9; bots.forEach(b => { if (!sameTeam(h, b)) dn = Math.min(dn, dist(h.x, h.y, b.x, b.y)); });
        if (dn < 700) { LR.combatT += dt; if (dn < 260) LR.closeT += dt; }
    });
    for (let i = LR.pend.length - 1; i >= 0; i--) { // đánh trúng rồi lùi ra xa trong 1.6 giây = hit & run
        const q = LR.pend[i], h = players.find(x => x.id === q.h), b = players.find(x => x.id === q.b);
        if (!h || !b) { LR.pend.splice(i, 1); continue; }
        if (dist(h.x, h.y, b.x, b.y) > q.d + 150) { LR.hitRuns++; LR.pend.splice(i, 1); }
        else if (world.time - q.t > 1.6) LR.pend.splice(i, 1);
    }
}
const _finishRound31 = finishRound;
finishRound = function () { learnCommit(); return _finishRound31(); };
const _showGameOver31 = showGameOver;
showGameOver = function () {
    _showGameOver31();
    const s = learnSummary(), tb = $('go-stats'); if (!s || !tb) return;
    const row = document.createElement('tr'); row.innerHTML = `<td colspan="99" style="text-align:left;font-size:0.72rem;color:#a5b4fc;padding-top:6px">${s}</td>`; tb.appendChild(row);
};
const _throwWeapon31 = throwWeapon;
throwWeapon = function (p, wep, enemy) { if (isHuman(p) && gameState === 'PLAYING') LR.throws++; return _throwWeapon31(p, wep, enemy); };
const _fireWeapon31 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (isHuman(p) && gameState === 'PLAYING' && w.type === 'GUN') { LR.shots++; if (!enemiesOf(p).some(e => targetable(p, e) && dist(p.x, p.y, e.x, e.y) < (w.range || 400) * 1.1)) LR.probes++; }
    return _fireWeapon31(p, w, ang, charge, enemy);
};
const _landSkillItem31 = landSkillItem;
landSkillItem = function (it) { const o = players.find(q => q.id === it.ownerId); if (isHuman(o) && it.type && it.type.id === 'SMOKE') LR.smokes++; return _landSkillItem31(it); };
const _castSpell31 = castSpell;
castSpell = function (p, i) { const s = p && p.spells && p.spells[i]; if (isHuman(p) && s && s.cd <= 0 && ['smokeLine', 'smokeBomb', 'blind'].includes(s.id)) LR.smokes++; return _castSpell31(p, i); };

/* ============================== NHẬN THỨC CỦA BOT ============================== */
const _targetable31 = targetable;
targetable = function (viewer, t) {
    const ok = _targetable31(viewer, t);
    if (!viewer || !viewer.isBot || !viewer.brain || !t || !t.inventory || t === viewer || viewer.x === undefined) return ok;
    let raw = ok;
    const marked = (t.st && t.st.reveal > 0) || isSpotted(t, viewer.id);
    if (raw && !marked && !fogGameplay()) raw = dist(viewer.x, viewer.y, t.x, t.y) < BM.sight * keenK(viewer) && lineOfSight(viewer.x, viewer.y, t.x, t.y); // tắt sương mù: bot vẫn không nhìn xuyên tường / quá xa
    return botAware(viewer, t, raw, marked);
};
/** Phản xạ: phải thấy liên tục đủ 0.2–0.4 giây (tuỳ độ khó) mới phản ứng */
function botAware(p, t, raw, marked) {
    const B = p.brain, A = B.aw || (B.aw = {}), now = world.time;
    if (!raw) return false;
    let a = A[t.id];
    if (!a || now - a.last > 0.35) {
        const R = BM.react[bmDiff()]; let r = rr(R[0], R[1]);
        const m = B.memo && B.memo[t.id]; if (m && now - m.t < 2.5) r *= 0.5;    // vừa thấy xong: nhận ra nhanh hơn
        if (B.preAim > now && Math.abs(angleDiff(Math.atan2(t.y - p.y, t.x - p.x), B.aimA === undefined ? p.angle : B.aimA)) < 0.5) r *= 0.3; // đã chĩa sẵn tâm
        if (B.panicT > 0) r *= 1.3;
        if (marked) r *= 0.6;
        a = A[t.id] = { start: now, last: now, r, fresh: true };
    }
    a.last = now;
    return now - a.start >= a.r;
}

/* ============================== NGHE (bot): chỉ biết hướng, đoán khoảng cách ============================== */
function botHear(p, e, d) {
    const B = p.brain, now = world.time, w = getCurrentWeapon(e);
    const kind = e.muzzle > 0 && !w.silent ? 'gun' : (!e.silent && !(typeof smokeMuted === 'function' && smokeMuted(e)) && Math.hypot(e.vx || 0, e.vy || 0) > 60) ? 'step' : null;
    if (!kind || !(d < hearReach(p, kind, e.x, e.y) * (kind === 'step' ? 0.75 + bmDiff() * 0.15 : 1))) return;
    B.hearCd = B.hearCd || {}; if ((B.hearCd[e.id] || 0) > now) return; B.hearCd[e.id] = now + 0.35;
    let gx, gy;
    if (hearsExact(p)) { gx = e.x + rr(-40, 40); gy = e.y + rr(-40, 40); }
    else { const a = Math.atan2(e.y - p.y, e.x - p.x) + rr(-0.12, 0.12), dd = d * rr(0.65, 1.35); gx = p.x + Math.cos(a) * dd; gy = p.y + Math.sin(a) * dd; }
    gx = Math.max(20, Math.min(MAP_W - 20, gx)); gy = Math.max(20, Math.min(MAP_H - 20, gy));
    B.heard = { x: gx, y: gy, t: now, id: e.id, gun: e.muzzle > 0 };
    if (e.id === B.targetId || !B.lastSeen || now - B.lastSeen.t > 2) B.lastSeen = { x: gx, y: gy, t: now, guess: true };
}

/* ============================== VẬT CẢN ĐỂ NẤP ============================== */
function coverPoint(p, from) {
    const B = p.brain; if (B.cover && B.cover.t > world.time && B.cover.fx === Math.round(from.x / 60)) return B.cover.pt;
    let best = null, bd = 1e9;
    for (const o of obstacles) {
        if (o.energy || o.w * o.h < 1200) continue;
        const ox = o.x + o.w / 2, oy = o.y + o.h / 2, d0 = dist(p.x, p.y, ox, oy); if (d0 > 420) continue;
        const a = Math.atan2(oy - from.y, ox - from.x), R = Math.hypot(o.w, o.h) / 2 + p.radius + 20;
        const x = ox + Math.cos(a) * R, y = oy + Math.sin(a) * R;
        if (x < p.radius || y < p.radius || x > MAP_W - p.radius || y > MAP_H - p.radius || pointInObstacle(x, y, p.radius)) continue;
        if (_los30(from.x, from.y, x, y)) continue; // không che được
        const s = dist(p.x, p.y, x, y) - Math.min(200, dist(from.x, from.y, x, y)) * 0.3;
        if (s < bd) { bd = s; best = { x, y }; }
    }
    B.cover = { pt: best, t: world.time + 0.6, fx: Math.round(from.x / 60) };
    return best;
}
const HINDER_SKILLS = ['smoke', 'speedSmoke', 'freeze', 'firebomb', 'glueBomb', 'wall', 'barricade', 'decoy', 'poisonGas', 'blink', 'dash', 'invis', 'haste'];
const hasLoaded = w => w.type === 'GUN' ? (w.mag > 0 && !w.reloading) : w.id !== 'NONE';
const memOf = (B, id) => B.memo && B.memo[id];
/* ============================== TÍNH CÁCH: thêm 6 tính cách + "nét hành vi" quyết định hành động ============================== */
Object.assign(PERSONAS, {
    coward:   { name: 'Nhát Gan', icon: '😰', agg: 0.3, caution: 1.2, greed: 0.4, patience: 0.3, flank: 0.1, range: 1.3, opp: 0.5 },
    veteran:  { name: 'Cựu Binh', icon: '🎖️', agg: 0.6, caution: 0.7, greed: 0.3, patience: 0.6, flank: 0.6, range: 1.1, opp: 0.6 },
    trickster:{ name: 'Ma Mãnh', icon: '🃏', agg: 0.7, caution: 0.5, greed: 0.3, patience: 0.8, flank: 0.5, range: 0.9, opp: 0.5 },
    sentinel: { name: 'Lính Canh', icon: '🛡️', agg: 0.5, caution: 0.8, greed: 0.2, patience: 0.9, flank: 0.1, range: 1.3, opp: 0.3 },
    stalker:  { name: 'Thợ Săn Đầu Người', icon: '🐺', agg: 0.8, caution: 0.3, greed: 0.2, patience: 0.3, flank: 0.5, range: 0.9, opp: 1.0 },
    daredevil:{ name: 'Liều Mạng', icon: '🤪', agg: 1.0, caution: 0.0, greed: 0.6, patience: 0.0, flank: 0.3, range: 0.5, opp: 0.6 }
});
['coward', 'veteran', 'trickster', 'sentinel', 'stalker', 'daredevil'].forEach(id => PERSONA_IDS.includes(id) || PERSONA_IDS.push(id));
/** Nét hành vi: panic = hoảng chạy về đồng đội · vet = vừa chạy vừa nạp, bình tĩnh · bait = phục kích ngược
 *  sup = bắn đè · probe = bắn thăm dò · thr = ném vũ khí · hr = đánh rồi rút · mem = nhớ (giây) · hold = giữ chốt · chase = bám đuổi */
const TRAITS = {
    berserker: { panic: 0, vet: 0, bait: 0.6, sup: 1.2, probe: 0.8, thr: 1.0, hr: 0.5, mem: 3, hold: 0.6, chase: 1.3 },
    cautious:  { panic: 1, vet: 0, bait: 0.5, sup: 0.6, probe: 1.0, thr: 0.2, hr: 1.0, mem: 5, hold: 1.2, chase: 0.6 },
    ambusher:  { panic: 0, vet: 1, bait: 1.6, sup: 0.6, probe: 0.8, thr: 0.4, hr: 1.2, mem: 5, hold: 1.4, chase: 0.8 },
    flanker:   { panic: 0, vet: 0, bait: 1.0, sup: 0.8, probe: 0.8, thr: 0.5, hr: 1.4, mem: 4, hold: 0.6, chase: 1.0 },
    looter:    { panic: 1, vet: 0, bait: 0.6, sup: 0.6, probe: 0.6, thr: 0.6, hr: 0.8, mem: 3, hold: 0.6, chase: 0.7 },
    marksman:  { panic: 0, vet: 1, bait: 1.0, sup: 1.2, probe: 1.0, thr: 0.2, hr: 1.2, mem: 5, hold: 1.3, chase: 0.7 },
    vulture:   { panic: 0, vet: 0, bait: 0.8, sup: 1.0, probe: 1.2, thr: 0.6, hr: 1.0, mem: 4, hold: 0.8, chase: 1.4 },
    tactician: { panic: 0, vet: 1, bait: 1.2, sup: 1.2, probe: 1.2, thr: 0.5, hr: 1.2, mem: 5, hold: 1.0, chase: 1.0 },
    coward:    { panic: 1, vet: 0, bait: 0.2, sup: 0.4, probe: 0.6, thr: 0.3, hr: 0.8, mem: 3, hold: 1.0, chase: 0.3 },
    veteran:   { panic: 0, vet: 1, bait: 1.4, sup: 1.3, probe: 1.4, thr: 0.4, hr: 1.5, mem: 5, hold: 1.0, chase: 1.0 },
    trickster: { panic: 0, vet: 0, bait: 2.0, sup: 0.8, probe: 1.6, thr: 1.2, hr: 1.3, mem: 4, hold: 1.0, chase: 0.9 },
    sentinel:  { panic: 0, vet: 1, bait: 1.0, sup: 1.6, probe: 1.0, thr: 0.2, hr: 0.6, mem: 5, hold: 2.0, chase: 0.3 },
    stalker:   { panic: 0, vet: 0, bait: 0.8, sup: 1.0, probe: 1.5, thr: 0.8, hr: 0.8, mem: 6, hold: 0.4, chase: 2.0 },
    daredevil: { panic: 0, vet: 0, bait: 0.4, sup: 1.4, probe: 0.6, thr: 2.0, hr: 0.4, mem: 3, hold: 0.2, chase: 1.6 }
};
/* ---- 5 tính cách CỰC ĐOAN ---- */
Object.assign(PERSONAS, {
    frenzy:  { name: 'Cuồng Chiến', icon: '👹', agg: 1.6, caution: 0, greed: 0.1, patience: 0, flank: 0.1, range: 0.4, opp: 0.5, extreme: true },
    hermit:  { name: 'Rắn Nằm Im', icon: '🐍', agg: 0.4, caution: 0.9, greed: 0.1, patience: 2.0, flank: 0, range: 1.4, opp: 0.4, extreme: true },
    madman:  { name: 'Kẻ Điên', icon: '🤡', agg: 0.9, caution: 0.3, greed: 0.5, patience: 0.2, flank: 0.6, range: 0.8, opp: 0.4, extreme: true },
    craven:  { name: 'Hèn Nhát Cực Độ', icon: '🐔', agg: 0.1, caution: 2.0, greed: 0.6, patience: 0.4, flank: 0, range: 1.6, opp: 0.2, extreme: true },
    carrion: { name: 'Kền Kền', icon: '🦴', agg: 0.5, caution: 0.8, greed: 0.3, patience: 0.6, flank: 0.4, range: 1.1, opp: 3.0, extreme: true }
});
['frenzy', 'hermit', 'madman', 'craven', 'carrion'].forEach(id => PERSONA_IDS.includes(id) || PERSONA_IDS.push(id));
Object.assign(TRAITS, {
    // Cuồng Chiến: không bao giờ lùi, không hồi máu, lao thẳng vào, bám tới chết
    frenzy:  { panic: 0, vet: 0, bait: 0, sup: 1.5, probe: 0.4, thr: 2.0, hr: 0, mem: 6, hold: 0, chase: 3.0, noRetreat: true },
    // Rắn Nằm Im: gần như không rời chỗ nấp, chỉ bắn khi chắc ăn, không đi săn
    hermit:  { panic: 0, vet: 1, bait: 2.0, sup: 0.3, probe: 0.3, thr: 0, hr: 0.4, mem: 6, hold: 4.0, chase: 0, camp: true },
    // Kẻ Điên: bắn bừa liên tục vào mọi tiếng động/bụi/khói, quyết định thất thường
    madman:  { panic: 0, vet: 0, bait: 1.0, sup: 3.0, probe: 4.0, thr: 2.5, hr: 1.0, mem: 4, hold: 0.5, chase: 1.2, noise: 0.35 },
    // Hèn Nhát Cực Độ: thấy địch là chạy, chỉ đánh khi bị dồn vào sát (< 150)
    craven:  { panic: 1, vet: 0, bait: 0, sup: 0.2, probe: 0.5, thr: 0.5, hr: 0.5, mem: 3, hold: 1.5, chase: 0, flee: true },
    // Kền Kền: chỉ nhắm kẻ máu thấp, đứng ngoài chờ người khác đánh nhau rồi mới vào ăn
    carrion: { panic: 0, vet: 1, bait: 1.0, sup: 1.0, probe: 1.0, thr: 0.4, hr: 1.2, mem: 6, hold: 1.5, chase: 1.5, scavenge: true }
});
// tính cách cực đoan hiếm hơn (khoảng 1/5 số bot)
const _createBrain31 = createBrain;
createBrain = function () {
    const B = _createBrain31();
    if (PERSONAS[B.persona] && PERSONAS[B.persona].extreme && Math.random() < 0.55) { const n = PERSONA_IDS.filter(id => !PERSONAS[id].extreme); B.persona = n[Math.floor(Math.random() * n.length)]; }
    return B;
};
const TR = p => TRAITS[(p.brain && p.brain.persona) || 'tactician'] || TRAITS.tactician;
const MEM_T = new Proxy({}, { get: (_, k) => (TRAITS[k] || TRAITS.tactician).mem });

/* ============================== CHẤM ĐIỂM Ý ĐỊNH (thay bản cũ) ============================== */
Object.assign(INTENT_NAME, { hitrun: 'ĐÁNH RỒI RÚT', evade: 'CẮT ĐUÔI', bait: 'PHỤC KÍCH NGƯỢC', heal: 'HỒI MÁU' });
function updateChase(p, e, vis, d) {
    const B = p.brain, now = world.time;
    const retreating = ['retreat', 'evade', 'heal'].includes(B.intent) || (B.hr && B.hr.phase === 'out');
    const m = e && memOf(B, e.id), memAge = m ? now - m.t : 99;
    if (e && retreating && (vis || memAge < 1)) {
        const closing = (e.vx || 0) * (p.x - e.x) + (e.vy || 0) * (p.y - e.y) > 0, hurt = now - (B.hurtT || -9) < 1;
        B.chaseT = (d < 430 && (closing || hurt)) ? Math.min(4, (B.chaseT || 0) + 0.3) : Math.max(0, (B.chaseT || 0) - 0.3);
    } else B.chaseT = Math.max(0, (B.chaseT || 0) - 0.3);
    if (!vis && B.visPrev) B.lostAt = now;
    B.visPrev = vis; B.lostT = vis ? 0 : now - (B.lostAt || now);
    if (!vis && B.lostT > 3) B.chaseT = 0;
    const was = B.chased; B.chased = B.chaseT >= 1.5;
    if (was && !B.chased) B.escapedAt = now;
}
const hasHealTool = p => (p.skills || []).some(s => CARDS[s.id] && CARDS[s.id].ai === 'heal' && s.cd <= 0) || (p.spells || []).some(s => s.id === 'heal' && s.cd <= 0) || (p.items || []).some(it => ['bigPotion', 'medkit'].includes(it.id)) || p.adv === 'medkit' || p.regen;
scoreIntents = function (p) {
    const B = p.brain, P = persona(p), K = learnK(), now = world.time;
    const e = players.find(q => q.id === B.targetId && q.hp > 0);
    const vis = !!(e && targetable(p, e)), d = e ? dist(p.x, p.y, e.x, e.y) : 1e9;
    const hpR = p.hp / p.maxHp, w = getCurrentWeapon(p), gun = w.type === 'GUN' && hasAmmo(w);
    const eMelee = e && ['MELEE', 'SHIELD'].includes(getCurrentWeapon(e).type);
    const weak = (w.tier || 0) <= 1 && ((p.inventory[otherSlot(p)] || {}).tier || 0) <= 1;
    const wantD = gun ? Math.min(w.range * (0.45 + 0.25 * P.range) * (K.kite > 1 ? 1.2 : 1), 720) : 60;
    updateChase(p, e, vis, d);
    const m = e && memOf(B, e.id), recent = vis || (m && now - m.t < 2);
    const rusher = B.persona === 'berserker', camper = B.persona === 'cautious', goblin = B.persona === 'looter';
    const groundWep = items.some(it => it.wt && !it.thrown && it.ground > 0.6 && dist(p.x, p.y, it.x, it.y) < 600 && (WEAPONS[it.type.id] || {}).tier > (w.tier || 0));
    const U = {
        fight: vis ? ((0.45 + 0.5 * P.agg) * (0.35 + 0.65 * hpR) + P.opp * 0.45 * (1 - e.hp / e.maxHp) + (gun || d < 160 ? 0.1 : -0.25)) * (rusher ? 1.3 : 1) * K.rush : 0,
        kite: vis && gun ? (P.caution * 0.7 * (d < wantD ? 1 : 0.35) + (eMelee ? 0.25 : 0)) * K.kite : 0,
        flank: vis && d > 180 && d < 650 ? P.flank * 0.75 * (0.6 + 0.4 * hpR) * K.rush : 0,
        retreat: (rusher ? (hpR < 0.25 ? 0.9 : 0) : Math.pow(1 - hpR, 1.5) * (0.45 + P.caution) * (vis ? 1 : 0.35) - P.agg * 0.25) * (camper ? 1.4 : 1),
        loot: (crates.length || groundWep ? (weak || groundWep ? 0.65 : 0.15) * (0.4 + P.greed) * (vis && d < 300 ? (groundWep ? 0.7 : 0.4) : 1) : 0) * (goblin ? 1.5 : 1),
        ambush: (!vis ? P.patience * 0.6 * (nearestBush(p, 450) ? 1 : 0.15) : (d > 350 && inBush(p.x, p.y) ? P.patience * 0.55 : 0)) * (camper ? 1.4 : 1) * TR(p).hold,
        hunt: vis ? 0.05 : 0.38 * TR(p).chase,
        hitrun: recent && hpR > 0.3 && (gun || ['KATANA', 'RAPIER', 'SPEAR', 'DAGGERS', 'KNIFE'].includes(w.id)) ? (0.35 + P.flank * 0.35 + P.patience * 0.2 + (['flanker', 'ambusher', 'tactician', 'marksman'].includes(B.persona) ? 0.25 : 0)) * K.hitRun * TR(p).hr : 0,
        evade: B.chased ? 1.1 + (1 - hpR) * 0.8 : 0,
        bait: B.chased && B.lostT > 0 && B.lostT < 0.8 && hasLoaded(w) && (P.agg >= 0.6 || K.bait > 1.5 || TR(p).bait >= 1.2) ? (0.6 * Math.max(P.agg, 0.5) * K.bait + 0.25) * TR(p).bait : 0,
        heal: !B.chased && !vis && B.lostT > 3 && hpR < 0.7 && hasHealTool(p) ? 0.95 : 0
    };
    const T = TR(p);
    if (T.noRetreat) { U.retreat = U.evade = U.heal = U.bait = U.kite = U.hitrun = U.ambush = 0; U.fight *= 1.5; U.hunt = vis ? 0.05 : 0.9; }
    if (T.camp) { U.hunt = 0.05; U.flank = 0; U.loot *= 0.3; U.fight *= vis && d < 500 ? 1 : 0.3; }
    if (T.flee && e && vis) { if (d > 150) { U.fight = 0; U.flank = 0; U.hitrun = 0; U.retreat = Math.max(U.retreat, 1.1); } else U.fight += 0.6; }
    if (T.scavenge && e && vis && e.hp / e.maxHp > 0.5 && players.filter(q => q.hp > 0).length > 2) { U.fight *= 0.3; U.flank *= 0.3; U.ambush += 0.5; }
    if (B.chased) U.retreat *= 0.5; // bị đuổi: không chạy thẳng đơn điệu mà cắt đuôi
    if (B.intent === 'bait' && (B.baitT || 0) > now) U.bait += 0.5;
    if (B.hr && B.hr.phase === 'out' && B.hr.t > now) U.hitrun += 0.4;
    if (U[B.intent] !== undefined) U[B.intent] += 0.12; // quán tính
    { const nz = T.noise || 0.05; for (const k in U) if (U[k] > 0) U[k] += rr(-nz, nz); } // nhiễu quyết định: không lặp kịch bản
    let best = 'hunt'; for (const k in U) if (U[k] > U[best]) best = k;
    if (best === 'bait' && B.intent !== 'bait') B.baitT = now + rr(1.2, 1.8);
    if (best === 'hitrun' && (!B.hr || B.intent !== 'hitrun')) B.hr = { phase: 'in', t: now + 4, mag0: w.mag, hp0: p.hp };
    return { best, e, vis, d, wantD };
};
const _intentMove31 = intentMove;
intentMove = function (p, info, dt) {
    const B = p.brain, e = info.e, now = world.time;
    switch (B.intent) {
        case 'evade': {
            const from = e || B.lastSeen || p;
            const zig = () => { B.zigT = (B.zigT || 0) - dt; if (B.zigT <= 0) { B.zigT = rr(0.25, 0.5); B.zig = -(B.zig || 0.55); } return B.zig || 0.55; };
            const panic = TR(p).panic > 0;
            const mate = world.team && players.filter(q => q !== p && q.hp > 0 && sameTeam(p, q)).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))[0];
            if (panic && mate && dist(p.x, p.y, mate.x, mate.y) > 120) return Math.atan2(mate.y - p.y, mate.x - p.x) + zig() * 0.5; // nhát gan: chạy về đồng đội
            const c = coverPoint(p, from);
            if (c && dist(p.x, p.y, c.x, c.y) > 24) return Math.atan2(c.y - p.y, c.x - p.x) + zig() * 0.6;
            if (c) return 'hold';
            return Math.atan2(p.y - from.y, p.x - from.x) + zig();
        }
        case 'bait': return 'hold'; // núp sau góc, chĩa sẵn tâm
        case 'heal': {
            const m = e && memOf(B, e.id), from = m || B.lastSeen; if (!from) return 'hold';
            const c = coverPoint(p, from); return c && dist(p.x, p.y, c.x, c.y) > 24 ? Math.atan2(c.y - p.y, c.x - p.x) : 'hold';
        }
        case 'hitrun': {
            const hr = B.hr || (B.hr = { phase: 'in', t: now + 4 });
            if (hr.phase === 'out') {
                const from = e || B.lastSeen || p, c = coverPoint(p, from);
                if (c && dist(p.x, p.y, c.x, c.y) > 24) return Math.atan2(c.y - p.y, c.x - p.x);
                return c ? 'hold' : Math.atan2(p.y - from.y, p.x - from.x) + Math.sin(now * 3) * 0.5;
            }
            if (!e) return null;
            const want = info.wantD || 300, ang = Math.atan2(e.y - p.y, e.x - p.x);
            if (info.d > want) return ang;
            B.strafeT = (B.strafeT || 0) - dt; if (B.strafeT <= 0) { B.strafeT = rr(0.4, 0.9); B.strafeDir = -(B.strafeDir || 1); }
            return ang + (B.strafeDir || 1) * Math.PI / 2;
        }
        case 'loot': {
            const w = getCurrentWeapon(p);
            const g = items.filter(it => it.wt && !it.thrown && it.ground > 0.6 && (WEAPONS[it.type.id] || {}).tier > (w.tier || 0)).sort((a, b) => dist(p.x, p.y, a.x, a.y) - dist(p.x, p.y, b.x, b.y))[0];
            if (g && dist(p.x, p.y, g.x, g.y) < 600) { B.greedT = now + 0.5; return dist(p.x, p.y, g.x, g.y) < 10 ? 'hold' : Math.atan2(g.y - p.y, g.x - p.x) + Math.sin(now * 9) * 0.35; } // tham đồ nhưng vừa chạy vừa lắc
            break;
        }
    }
    return _intentMove31(p, info, dt);
};

/* ============================== VÒNG LẶP BOT: tai · mắt · tay ============================== */
const _botThink31 = botThink;
botThink = function (p, dt) {
    const B = p.brain || (p.brain = createBrain());
    if (gameState !== 'PLAYING' || p.hp <= 0) return _botThink31(p, dt);
    const now = world.time, K = learnK(), L = bmDiff(), w = getCurrentWeapon(p);
    if (B.panicT > 0) B.panicT -= dt;
    // 1. tai: địch không thấy → chỉ nghe được hướng (tắt tiếng chúng khi AI gốc chạy để nó không biết chính xác)
    const muted = [];
    enemiesOf(p).forEach(e => { const d = dist(p.x, p.y, e.x, e.y); if (targetable(p, e)) return; botHear(p, e, d); muted.push([e, e.muzzle, e.silent]); });
    muted.forEach(([e]) => { e.muzzle = 0; e.silent = true; });
    let out; try { out = _botThink31(p, dt); } finally { muted.forEach(([e, m, s]) => { e.muzzle = m; e.silent = s; }); }
    // 2. mắt: trí nhớ ngắn hạn
    B.memo = B.memo || {};
    const e = players.find(q => q.id === B.targetId && q.hp > 0);
    const vis = !!(e && targetable(p, e)), d = e ? dist(p.x, p.y, e.x, e.y) : 1e9;
    enemiesOf(p).forEach(q => { if (targetable(p, q)) B.memo[q.id] = { x: q.x, y: q.y, t: now }; });
    for (const id in B.memo) if (now - B.memo[id].t > (MEM_T[B.persona] || 4)) delete B.memo[id];
    const m = e && B.memo[e.id], memAge = m ? now - m.t : 99;
    // 3. tâm ngắm: lệch lúc đầu, kéo dần, xoay có giới hạn
    const aw = e && B.aw && B.aw[e.id];
    if (vis && aw && aw.fresh) { aw.fresh = false; B.aimErr = (Math.random() < 0.5 ? -1 : 1) * BM.err[L] * rr(0.6, 1.2) * (B.panicT > 0 ? 1.7 : 1) * (B.preAim > now ? 0.4 : 1); }
    let goal = null, fireExtra = false, probe = false;
    const gunOk = w.type === 'GUN' && w.mag > 0 && !w.reloading;
    const evading = B.intent === 'evade' && d > 150; // bị đuổi: chỉ quay lại bắn khi địch quá sát
    if (vis && !evading) {
        const lead = L === 2 ? 0.12 : L === 1 ? 0.05 : 0;
        goal = Math.atan2(e.y + (e.vy || 0) * lead - p.y, e.x + (e.vx || 0) * lead - p.x);
    } else if (!vis && m && memAge < 2.3 && memAge > 0.2 && !evading) {
        goal = Math.atan2(m.y - p.y, m.x - p.x); // chĩa vào chỗ vừa mất dấu
        if (B.intent === 'bait') B.preAim = now + 0.4;
        // bắn đè / ném lựu vào chỗ vừa nấp
        const agg = persona(p).agg;
        if (B.intent !== 'bait' && B.intent !== 'evade' && B.intent !== 'heal' && memAge < 1.4 && agg * TR(p).sup >= 0.5 && dist(p.x, p.y, m.x, m.y) < (w.range || 0) * 0.95) {
            if (gunOk && w.mag > 2 && _los30(p.x, p.y, m.x, m.y)) fireExtra = true;
            if (w.type === 'THROWABLE' && memAge > 0.4) fireExtra = true;
        }
    } else if (!vis && B.heard && now - B.heard.t < 1.3) {
        goal = Math.atan2(B.heard.y - p.y, B.heard.x - p.x); // quay đầu về phía tiếng động (mất thời gian quay)
    } else if (Math.hypot(out.move.x, out.move.y) > 0.2) {
        goal = Math.atan2(out.move.y, out.move.x);
        // kiểm tra góc khuất khi đi săn: liếc vào bụi gần
        if (!vis && B.intent === 'hunt') { const b = nearestBush(p, 260); if (b && Math.sin(now * 1.3 + p.id) > 0.3) goal = Math.atan2(b.y - p.y, b.x - p.x); }
    }
    // 4. bắn thăm dò bụi / khói (học người chơi)
    B.probeCd = (B.probeCd || 0) - dt;
    if (!vis && gunOk && w.mag > 2 && B.probeCd <= 0 && B.intent !== 'evade' && B.intent !== 'heal') {
        const ref = (B.heard && now - B.heard.t < 2 && B.heard) || (m && memAge < 4 && m);
        let spot = null;
        if (ref) {
            const bu = bushes.find(b => !b.burning && dist(b.x, b.y, ref.x, ref.y) < 170);
            const sm = zones.find(z => z.type === 'smoke' && z.t > 0 && dist(z.x, z.y, ref.x, ref.y) < z.r + 80);
            spot = bu || sm || (B.heard && now - B.heard.t < (TR(p).probe > 2 ? 1.5 : 0.6) ? ref : null);
        } else if (K.bush) { const bu = nearestBush(p, 380); if (bu && !inBush(p.x, p.y)) spot = bu; }
        if (spot && dist(p.x, p.y, spot.x, spot.y) < (w.range || 400) && Math.random() < 0.3 * K.probe * TR(p).probe) { B.probe = { x: spot.x + rr(-30, 30), y: spot.y + rr(-30, 30), t: now + rr(0.35, 0.7) }; }
        B.probeCd = rr(2.2, 3.6) / Math.max(0.5, K.probe * TR(p).probe);
    }
    if (!vis && B.probe && B.probe.t > now) { goal = Math.atan2(B.probe.y - p.y, B.probe.x - p.x); probe = true; }
    // xoay tâm
    if (goal !== null) {
        if (B.aimA === undefined) B.aimA = p.angle;
        const df = angleDiff(goal, B.aimA), mx = BM.turn[L] * (B.panicT > 0 ? 0.8 : 1) * dt;
        B.aimA += Math.max(-mx, Math.min(mx, df));
    } else if (B.aimA === undefined) B.aimA = p.angle;
    B.aimErr = (B.aimErr || 0) * Math.exp(-dt * 3.2);
    const jitter = B.panicT > 0 ? Math.sin(now * 23 + p.id) * 0.14 : 0;
    const A = B.aimA + B.aimErr + jitter;
    out.aim = { x: Math.cos(A), y: Math.sin(A) }; out.aimMouse = true; out.aimDist = vis ? d : 300;
    const onTarget = goal !== null && Math.abs(angleDiff(goal, A)) < 0.22;
    // 5. bóp cò
    if (evading) out.a = false;
    if (vis && w.mode === 'auto' && d > 350) { // bắn theo loạt ở tầm xa
        B.burstT = (B.burstT || 0) - dt;
        if (B.burstT <= 0) { B.bursting = !B.bursting; B.burstT = B.bursting ? rr(0.3, 0.55) : rr(0.2, 0.4); }
        if (!B.bursting) out.a = false;
    }
    if (!vis && (fireExtra || probe) && onTarget) {
        if (w.mode === 'auto') out.a = true;
        else if (w.mode === 'charge') out.a = (p.charge || 0) < (w.type === 'THROWABLE' ? 0.35 : 0.3);
        else { B.tog = !B.tog; out.a = B.tog; }
    }
    if (B.intent === 'bait' && !vis) out.a = false;
    // 6. đánh rồi rút: chuyển pha
    if (B.intent === 'hitrun' && B.hr) {
        const hr = B.hr;
        if (hr.phase === 'in') {
            const shot = hr.mag0 !== undefined && w.magSize ? hr.mag0 - w.mag : 0, hurt = p.hp < (hr.hp0 || p.hp) - 12;
            if (shot >= Math.max(2, Math.ceil((w.magSize || 4) * 0.45)) || hurt || (w.type !== 'GUN' && p.lastFireT > now - 0.2) || now > hr.t) { hr.phase = 'out'; hr.t = now + rr(1.2, 2); }
        } else {
            out.a = vis && d < 140; // đang rút: chỉ bắn khi bị áp sát
            if (w.magSize && !w.noReload && w.mag < effMag(p, w) && !w.reloading && (w.reserve > 0 || world.infiniteAmmo)) { B.rTog = !B.rTog; out.b = B.rTog; } // vừa rút vừa nạp
            if (now > hr.t) { hr.phase = 'in'; hr.t = now + rr(2.5, 4); hr.mag0 = w.mag; hr.hp0 = p.hp; }
        }
    }
    // 7. bị đuổi: thả khói / chặn đường, cựu binh vừa chạy vừa nạp
    if (B.chased && p.hp < p.maxHp * 0.7 && p.skills) p.skills.forEach((s, i) => { if (s.cd <= 0 && HINDER_SKILLS.includes(s.id) && Math.random() < dt * 2.5 * K.smoke) out['s' + (i + 1)] = true; });
    if (B.intent === 'evade' && TR(p).vet > 0 && w.magSize && !w.noReload && w.mag < effMag(p, w) * 0.6 && !w.reloading) { B.rTog = !B.rTog; out.b = B.rTog; }
    // cắt đuôi xong: hồi máu ngay chỗ nấp
    if (B.intent === 'heal' && p.skills) p.skills.forEach((s, i) => { if (s.cd <= 0 && CARDS[s.id] && CARDS[s.id].ai === 'heal') out['s' + (i + 1)] = true; });
    // 8. bắt chước người chơi: ném vũ khí khi áp sát
    if (vis && d < 300 && (K.throwR > 0.5 || TR(p).thr > 1) && w.id !== 'NONE' && (w.type !== 'GUN' || !hasAmmo(w) || (w.tier || 1) <= 1) && Math.random() < dt * 0.08 * Math.max(K.throwR, 0.6) * TR(p).thr) B.throwHold = 0.4;
    return out;
};
// bị bắn lén → hoảng 1.5 giây, biết hướng đạn tới
const _dealDamage31 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const a = attackerId >= 0 ? players.find(q => q.id === attackerId) : null;
    if (a && target && a !== target && gameState === 'PLAYING') {
        if (isHuman(a) && target.isBot && !opts.zone) { LR.dmg += dmg; if (opts.melee) LR.meleeDmg += dmg; const dd = dist(a.x, a.y, target.x, target.y); LR.dSum += dd; LR.dN++; LR.hits++; if (LR.pend.length < 20) LR.pend.push({ h: a.id, b: target.id, d: dd, t: world.time }); }
        if (target.isBot && target.brain) {
            const B = target.brain; B.hurtT = world.time;
            if (!targetable(target, a)) {
                B.panicT = 1.5;
                const ang = Math.atan2(a.y - target.y, a.x - target.x) + rr(-0.2, 0.2), dd = dist(a.x, a.y, target.x, target.y) * rr(0.7, 1.3);
                B.heard = { x: target.x + Math.cos(ang) * dd, y: target.y + Math.sin(ang) * dd, t: world.time, id: a.id };
                B.lastSeen = { x: B.heard.x, y: B.heard.y, t: world.time, guess: true };
            }
        }
    }
    return _dealDamage31(target, dmg, attackerId, opts);
};
// phép / vật phẩm của bot: bị đuổi thì ưu tiên chặn đường, cắt đuôi xong thì hồi máu
const _botSpells31 = botSpells;
botSpells = function (p, dt) {
    const B = p.brain;
    if (B && gameState === 'PLAYING' && (p.spellThinkT || 0) - dt <= 0) {
        const chased = B.chased && p.hp < p.maxHp * 0.75, safe = B.intent === 'heal';
        if (chased || safe) {
            const want = chased ? ['smokeLine', 'smokeBomb', 'iceWall', 'blind', 'flash', 'sprint', 'scareDoll'] : ['heal', 'bigPotion', 'medkit', 'shieldPotion'];
            (p.spells || []).forEach((s, i) => { if (s.cd <= 0 && want.includes(s.id) && Math.random() < 0.6) castSpell(p, i); });
            (p.items || []).forEach((it, i) => { if (want.includes(it.id) && Math.random() < 0.5) useItem(p, i); });
        }
    }
    return _botSpells31(p, dt);
};
const _upe31 = updatePartyExtras;
updatePartyExtras = function (dt) { _upe31(dt); learnTick(dt); };
const _initRound31 = initRound;
initRound = function () { learnReset(); return _initRound31(); };
