/** ==================== REWORK 21 ====================
 *  1) Mô tả theo tỉ lệ máu mới (×HEALK) + GIÁP ×HEALK.
 *  2) Vẽ vật ném của kỹ năng bằng hình vũ khí thật (drawSpinWep21) — Búa Sấm Ném.
 *  3) RÌU SĂN làm lại: chém tích đạn vào 2 nòng → giữ thả = song nòng bắn sát nách (bật lùi); hết đạn → ném rìu xoáy.
 *  4) TRƯỜNG KIẾM làm lại: 5 hệ Kim · Thủy · Mộc · Hỏa · Thổ — mỗi hệ đánh khác hẳn, đòn 3 riêng, giữ thả = Hoá Hành sang hệ kế (tương sinh),
 *     tương khắc +30%, Bậc Thầy Ngũ Hành Luân Trảm, KTC tuyệt kỹ riêng từng hệ.
 *  5) Vũ khí mới BÙA: 10 hiệu ứng ngẫu nhiên (3 buff · 4 debuff · 2 sát thương · 1 đặc biệt), lá kế tiếp hiện trên tay, giữ thả = đổi lá.
 *  6) Thẻ BẬC THẦY NGUYÊN TỐ: đòn đánh kèm nguyên tố ngẫu nhiên; đủ 5 hệ lên 1 địch → Ngũ Hành Hợp Nhất; cộng hưởng Trường Kiếm.
 */
const W21 = [];
const _push21 = W21.push.bind(W21);
W21.push = function (...a) { a.forEach(f => { if (f && typeof SRC19 !== 'undefined' && SRC19.skill > 0) f._skill = true; }); return _push21(...a); };
const now21 = () => world.time;

/* ============================== 2) VẼ VẬT NÉM BẰNG HÌNH VŨ KHÍ THẬT ============================== */
function drawSpinWep21(c, id, x, y, rot, scale, glow) {
    const w = WEAPONS[id]; if (!w) return;
    c.save(); c.translate(x, y);
    if (glow) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 2, 0, 0, 26 * scale); g.addColorStop(0, hexA(glow, 0.45)); g.addColorStop(1, hexA(glow, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 26 * scale, 0, Math.PI * 2); c.fill(); c.restore(); }
    c.rotate(rot); c.scale(scale, scale); c.translate(-16, 0);
    try { drawWeaponArt(c, w, 6, world.time, { radius: 6, recoil: 0, charge: 0, fake: true, id: -1 }); } catch (e) {}
    c.restore();
}

/* ============================== 1) GIÁP ×HEALK + MÔ TẢ ============================== */
const _resetR21 = resetPlayerForRound;
resetPlayerForRound = function (p) {
    const r = _resetR21(p);
    if (p.maxArmor > 0) { p.maxArmor *= HEALK; p.armor = p.maxArmor; }
    p._ar21 = p.armor || 0;
    return r;
};
function armorTick21() { // giáp nhận thêm giữa hiệp (bộ giáp, nhặt đồ, kỹ năng…) → ×HEALK
    players.forEach(p => {
        const a = p.armor || 0, prev = p._ar21 === undefined ? a : p._ar21;
        if (a > prev + 0.01) p.armor = prev + (a - prev) * HEALK;
        p._ar21 = p.armor || 0;
    });
}
// mô tả: số hồi máu / sát thương kỹ năng / khiên / giáp nhân theo tỉ lệ máu mới
function scaleDesc21(txt, kinds) {
    if (!txt || txt.includes('⁣')) return txt;
    const k = n => { const v = parseFloat(n) * HEALK; return String(Math.round(v * 10) / 10); };
    let s = txt;
    if (kinds.heal) {
        s = s.replace(/(\d+(?:\.\d+)?)(\s*)(máu\/giây|máu\/s|HP)/g, (m, n, sp, u) => k(n) + sp + u);
        s = s.replace(/(hồi|Hồi|\+)(\s*)(\d+(?:\.\d+)?)(\s*)máu(?!\s*tối đa|\/)/g, (m, a, sp, n, sp2) => a + sp + k(n) + sp2 + 'máu');
    }
    if (kinds.dmg) s = s.replace(/(?<![%\d.])(\d+(?:\.\d+)?)(\s*)sát thương/g, (m, n, sp) => k(n) + sp + 'sát thương');
    if (kinds.shield) s = s.replace(/(?<![%\d.])(\d+(?:\.\d+)?)(\s*)khiên/g, (m, n, sp) => k(n) + sp + 'khiên').replace(/khiên(\s*)(\d+(?:\.\d+)?)(?!\s*%|\d)/g, (m, sp, n) => 'khiên' + sp + k(n));
    if (kinds.armor) s = s.replace(/(?<![%\d.])(\d+(?:\.\d+)?)(\s*)giáp/g, (m, n, sp) => k(n) + sp + 'giáp');
    return s === txt ? txt : s + '⁣'; // dấu ẩn: đã nhân, không nhân lại
}
window.addEventListener('load', () => {
    try {
        Object.values(CARDS).forEach(cd => { if (!cd || typeof cd.desc !== 'string') return; cd.desc = scaleDesc21(cd.desc, cd.kind === 'S' ? { heal: 1, dmg: 1, shield: 1, armor: 1 } : { heal: 1, armor: 1 }); });
        if (typeof SPELLS !== 'undefined') Object.values(SPELLS).forEach(sp => { if (sp && typeof sp.desc === 'string') sp.desc = scaleDesc21(sp.desc, { heal: 1, dmg: 1, shield: 1, armor: 1 }); });
        if (typeof ADVANTAGES !== 'undefined') Object.values(ADVANTAGES).forEach(a => { if (a && typeof a.desc === 'string') a.desc = scaleDesc21(a.desc, { heal: 1, armor: 1 }); });
    } catch (e) { console.warn('scaleDesc21', e); }
});

/* ============================== 3) RÌU SĂN ============================== */
Object.assign(WEAPONS.AXEGUN, { mode: 'charge', chargeTime: 0.45, range: 95, aim: 'arc', durability: 45, maxDurability: 45,
    desc: 'Rìu gắn SONG NÒNG. Chém: chém – chém – BỔ (choáng); mỗi lần chém trúng NẠP 1 ĐẠN vào nòng (tối đa 2) và đánh DẤU SĂN lên địch. Giữ rồi thả: BẮN SÁT NÁCH bằng mọi đạn đã nạp (2 nòng = 14 viên + bật lùi xa), trúng kẻ có Dấu Săn +35% sát thương. Không còn đạn: giữ thả = NÉM RÌU XOÁY bay ra rồi quay về.' });
function agFire21(p, w, ang, charge) {
    const now = now21(), m = attackMult(p, w) * (p.meleeMult || 1);
    if (w.out21) { if (!p.isBot) floatText(p.x, p.y - 30, '🪓 Rìu đang bay', '#94a3b8', 11); p.cooldown = 6; return; }
    w.ch = w.ch || 0;
    if (charge >= 0.9) {
        if (w.ch > 0) { // BẮN SÁT NÁCH
            meleeBook(p, w, ang, 26);
            const n = w.ch, m0 = muzzle(p, w, ang); w.ch = 0;
            for (let i = 0; i < 7 * n; i++) { const b = spawnBullet(p, m0.x, m0.y, ang + (Math.random() - 0.5) * (n > 1 ? 0.75 : 0.5), { speed: 17 + Math.random() * 6, damage: 13 * attackMult(p, w), range: 240, knock: 140, size: 3.2, trail: 22, color: n > 1 ? '#fb923c' : '#fde68a', burn: n > 1 }); b.ag21 = true; }
            p.kx -= Math.cos(ang) * 200 * n; p.ky -= Math.sin(ang) * 200 * n;
            if (n > 1) { p.dashTime = 0.16; p.dashAngle = ang + Math.PI; floatText(p.x, p.y - 40, '💥💥 SONG NÒNG!', '#fb923c', 15); } else floatText(p.x, p.y - 40, '💥 BÙM!', '#fde68a', 13);
            directionalSpark(m0.x, m0.y, ang, '#fde68a', 10 * n, 460, 0.5); smoke(m0.x, m0.y, 3 * n, 'rgba(214,211,209,0.4)', 14);
            AudioSys.playAt('shotgun', p.x, p.y, 0.6 + 0.2 * n); addShake(4 + 3 * n);
            return;
        }
        // NÉM RÌU XOÁY
        meleeBook(p, w, ang, 30); w.out21 = true;
        W21.push({ kind: 'axeSpin', owner: p.id, x: p.x, y: p.y, a: ang, d: 0, max: 300, back: false, hit: new Set(), dmg: 30 * m, t: 4, spin: 0, wid: w });
        floatText(p.x, p.y - 36, '🪓 RÌU XOÁY', '#e5e7eb', 13); AudioSys.playAt('throw', p.x, p.y, 0.6);
        return;
    }
    const n = (p.ag21N = now - (p.ag21T || -9) < 1.2 ? ((p.ag21N || 0) % 3) + 1 : 1); p.ag21T = now;
    meleeBook(p, w, ang, n === 3 ? 28 : 18);
    const R = n === 3 ? 112 : 96, half = n === 3 ? 0.55 : 1.05, dmg = (n === 3 ? 40 : 26) * m;
    slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: R + p.radius, color: n === 3 ? '#fca5a5' : '#e5e7eb', width: n === 3 ? 14 : 10, life: 0.2, maxLife: 0.2, swing: n === 2 ? -1 : 1, line: n === 3 });
    const hit = arcFoes(p, ang, R, half);
    hit.forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: n === 3 ? 320 : 160, angle: Math.atan2(e.y - p.y, e.x - p.x) }); e.ag21Mark = now + 2.5; e.ag21By = p.id; if (n === 3) e.stun = Math.max(e.stun, 0.35); p.stats.hits++; });
    if (hit.length) { const before = w.ch; w.ch = Math.min(2, w.ch + 1); if (w.ch > before) floatText(p.x, p.y - 30, `🔶 NẠP ${w.ch}/2`, '#fdba74', 12); hitStop(n === 3 ? 0.06 : 0.035); addShake(n === 3 ? 5 : 2); }
    AudioSys.playAt(n === 3 ? 'slam' : 'swing', p.x, p.y, 0.5);
    hitDecoysObs(p, p.x + Math.cos(ang) * 60, p.y + Math.sin(ang) * 60, 40, dmg);
}
function agHunt21(p) { // Bậc Thầy: TRUY SĂN
    const w = getCurrentWeapon(p), a = aimDir(p);
    const e = enemiesOf(p).filter(q => q.hp > 0 && !(q.air > 0) && dist(p.x, p.y, q.x, q.y) < 320 && Math.abs(angleDiff(Math.atan2(q.y - p.y, q.x - p.x), a)) < 0.8 && targetable(p, q)).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y))[0];
    if (e) {
        const b = Math.atan2(e.y - p.y, e.x - p.x), s = umbFreeSpot(p, e.x - Math.cos(b) * (e.radius + p.radius + 6), e.y - Math.sin(b) * (e.radius + p.radius + 6));
        startTravel(p, s.x, s.y, 0.22, 'umbLand', { fn: q => { if (e.hp <= 0) return; dealDamage(e, 40 * (q.meleeMult || 1), q.id, { melee: true, knock: 260, angle: b }); e.stun = Math.max(e.stun, 0.5); e.ag21Mark = world.time + 2.5; e.ag21By = q.id; slashes.push({ x: q.x, y: q.y, ownerId: q.id, angle: b, range: 120, color: '#fca5a5', width: 14, life: 0.22, maxLife: 0.22, swing: 1, line: true }); AudioSys.playAt('slam', q.x, q.y, 0.6); } }, 30);
        if (w && w.id === 'AXEGUN') w.ch = 2; floatText(p.x, p.y - 44, '🎯 TRUY SĂN · NẠP ĐỦ 2 NÒNG', '#fdba74', 14);
    } else { const s = umbFreeSpot(p, p.x + Math.cos(a) * 200, p.y + Math.sin(a) * 200); startTravel(p, s.x, s.y, 0.25, null, null, 20); if (w && w.id === 'AXEGUN') w.ch = Math.min(2, (w.ch || 0) + 1); floatText(p.x, p.y - 44, '🎯 TRUY SĂN', '#fdba74', 13); }
}
function agDragon21(p) { // KTC: SONG LONG BẠO PHÁT
    const w = getCurrentWeapon(p), a = aimDir(p), s = umbFreeSpot(p, p.x - Math.cos(a) * 150, p.y - Math.sin(a) * 150);
    startTravel(p, s.x, s.y, 0.3, null, null, 40);
    [0.05, 0.3].forEach(t => p.shotQueue.push({ t, fn: () => { if (p.hp <= 0) return; const m0 = { x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24 };
        for (let i = 0; i < 12; i++) spawnBullet(p, m0.x, m0.y, a + (Math.random() - 0.5) * 0.7, { speed: 15 + Math.random() * 6, damage: 10, range: 280, knock: 160, size: 3.6, trail: 26, color: '#f97316', burn: true });
        for (let k = 1; k <= 3; k++) zones.push({ type: 'fire', x: p.x + Math.cos(a) * 70 * k, y: p.y + Math.sin(a) * 70 * k, r: 45, t: 3, maxT: 3, owner: p.id, tick: 0 });
        AudioSys.playAt('shotgun', p.x, p.y, 0.9); AudioSys.playAt('flame', p.x, p.y, 0.6); addShake(8); } }));
    if (w && w.id === 'AXEGUN') w.ch = 0;
    floatText(p.x, p.y - 44, '🐉 SONG LONG BẠO PHÁT', '#f97316', 15);
}

/* ============================== 4) TRƯỜNG KIẾM NGŨ HÀNH ============================== */
const NH21 = {
    KIM:  { name: 'Kim',  icon: '⚙️', col: '#e5e7eb', glow: '#f8fafc', next: 'THUY', khac: 'MOC', cd: 15, R: 100, dmg: 30, t: 'nhanh · xuyên giáp 25% · đòn 3 phóng 3 KIM CHÂM xuyên' },
    THUY: { name: 'Thủy', icon: '💧', col: '#38bdf8', glow: '#bae6fd', next: 'MOC',  khac: 'HOA', cd: 22, R: 128, dmg: 24, t: 'tầm xa · làm chậm, 3 đòn liền ĐÓNG BĂNG · đòn 3 THỦY BA sóng nước đẩy lùi' },
    MOC:  { name: 'Mộc',  icon: '🌿', col: '#4ade80', glow: '#bbf7d0', next: 'HOA',  khac: 'THO', cd: 22, R: 96,  dmg: 24, t: 'hút 15% máu · đòn 3 DÂY LEO mọc thẳng trói địch' },
    HOA:  { name: 'Hỏa',  icon: '🔥', col: '#f97316', glow: '#fde047', next: 'THO',  khac: 'KIM', cd: 20, R: 100, dmg: 26, t: 'cháy cộng dồn, vết chém để lửa · đòn 3 HỎA LONG phun lửa hình nón' },
    THO:  { name: 'Thổ',  icon: '⛰️', col: '#b45309', glow: '#fcd34d', next: 'KIM',  khac: 'THUY', cd: 30, R: 104, dmg: 40, t: 'chậm mà nặng, cầm nhận ít hơn 20% sát thương · đòn 3 ĐỊA CHẤN đá trồi hất tung + vách đá' }
};
const NH_ORDER21 = ['KIM', 'THUY', 'MOC', 'HOA', 'THO'];
Object.assign(WEAPONS.LONGSWORD, { mode: 'charge', chargeTime: 0.55, durability: 45, maxDurability: 45,
    desc: 'Kiếm NGŨ HÀNH — 5 hệ đánh khác hẳn nhau: ' + NH_ORDER21.map(k => `${NH21[k].icon} ${NH21[k].name}: ${NH21[k].t}`).join(' · ') + '. Giữ rồi thả: HOÁ HÀNH sang hệ kế (Kim→Thủy→Mộc→Hỏa→Thổ→Kim) kèm bùng nổ của hệ mới. Đánh kẻ cầm Trường Kiếm hệ bị KHẮC +30%.' });
function lsSet21(w, E) { const N = NH21[E]; w.elem = E; w.color = N.col; w.name = `Trường Kiếm · ${N.name}`; w.range = N.R; }
const _makeWeaponR21 = makeWeapon;
makeWeapon = function (id, p) {
    const w = _makeWeaponR21(id, p);
    if (w && w.id === 'LONGSWORD') lsSet21(w, NH21[w.elem] ? w.elem : NH_ORDER21[Math.floor(Math.random() * 5)]);
    if (w && w.id === 'BUA') w.nextFx = buaRoll21();
    return w;
};
const elemBoost21 = p => (has(p, 'meleeTech') ? 1.3 : 1) * (has(p, 'elemMaster') ? 1.5 : 1);
// hiệu ứng trúng của từng hệ (dùng chung cho kiếm, Bậc Thầy, thẻ Bậc Thầy Nguyên Tố)
function nhHit21(p, e, E, dmg, K, small) {
    const now = now21();
    if (E === 'KIM') { trueDamage(e, dmg * 0.25 * K, p.id); spark(e.x, e.y, '#f8fafc', 5, 260); }
    else if (E === 'THUY') { e.st.slow = Math.max(e.st.slow || 0, 1.1 * K); if (!small) { e.thuy21 = (e.thuy21By === p.id && now - (e.thuy21T || -9) < 2.5 ? (e.thuy21 || 0) : 0) + 1; e.thuy21By = p.id; e.thuy21T = now; if (e.thuy21 >= 3) { e.thuy21 = 0; e.frozenT = now + 1 * K; e.stun = Math.max(e.stun, 1 * K); floatText(e.x, e.y - 44, '❄️ ĐÓNG BĂNG', '#7dd3fc', 14); ring(e.x, e.y, 5, 44, '#bae6fd', 0.4, 4); } } }
    else if (E === 'MOC') { p.hp = Math.min(p.maxHp, p.hp + dmg * 0.15 * K); if (Math.random() < 0.3) spark(p.x, p.y, '#4ade80', 3, 80); }
    else if (E === 'HOA') { if (!e.pyro) { e.st.burn = Math.min(6, Math.max(e.st.burn || 0, 0) + 1.2 * K); e.st.burnBy = p.id; } }
    else if (E === 'THO') { e.kx += Math.cos(Math.atan2(e.y - p.y, e.x - p.x)) * 160 * K; e.ky += Math.sin(Math.atan2(e.y - p.y, e.x - p.x)) * 160 * K; if (!small) e.stun = Math.max(e.stun, 0.2 * K); }
}
function lsFire21(p, w, ang, charge) {
    const now = now21(), E = NH21[w.elem] ? w.elem : 'KIM', N = NH21[E], K = elemBoost21(p);
    if (charge >= 0.9) { // HOÁ HÀNH
        const ne = N.next; lsSet21(w, ne); meleeBook(p, w, ang, has(p, 'elemMaster') ? 6 : 14); p.ls21N = 2; // đòn kế là đòn 3 của hệ mới
        nhBurst21(p, ne, K);
        return;
    }
    const n = (p.ls21N = now - (p.ls21T || -9) < 1.3 ? ((p.ls21N || 0) % 3) + 1 : 1); p.ls21T = now;
    meleeBook(p, w, ang, n === 3 ? N.cd + 8 : N.cd);
    const m = attackMult(p, w) * (p.meleeMult || 1), dmg = N.dmg * m * (n === 3 ? 1.3 : 1);
    if (n < 3 || E === 'KIM' || E === 'THO') { // chém thường (Kim/Thổ cả đòn 3 cũng chém rồi kèm chiêu)
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: ang, range: N.R + p.radius, color: N.col, width: E === 'THO' ? 15 : E === 'KIM' ? 7 : 10, life: E === 'KIM' ? 0.14 : 0.22, maxLife: E === 'KIM' ? 0.14 : 0.22, swing: n === 2 ? -1 : 1, line: false });
        const hit = arcFoes(p, ang, N.R, E === 'THUY' ? 1.2 : 1.0);
        hit.forEach(e => { let dd = dmg * lsKhac21(p, e, E); dealDamage(e, dd, p.id, { melee: true, knock: E === 'THO' ? 380 : 150, angle: Math.atan2(e.y - p.y, e.x - p.x) }); nhHit21(p, e, E, dd, K); p.stats.hits++; });
        if (hit.length) { hitStop(E === 'THO' ? 0.07 : 0.035); addShake(E === 'THO' ? 6 : 2); }
        if (E === 'HOA') zones.push({ type: 'fire', x: p.x + Math.cos(ang) * 70, y: p.y + Math.sin(ang) * 70, r: 38, t: 1.5, maxT: 1.5, owner: p.id, tick: 0 });
        if (E === 'THUY') W21.push({ kind: 'splash', owner: p.id, x: p.x + Math.cos(ang) * 80, y: p.y + Math.sin(ang) * 80, a: ang, t: 0.4, T: 0.4 });
        AudioSys.playAt(E === 'THO' ? 'ground' : E === 'KIM' ? 'clang' : 'swing', p.x, p.y, 0.45);
        hitDecoysObs(p, p.x + Math.cos(ang) * 60, p.y + Math.sin(ang) * 60, 40, dmg);
    }
    if (n === 3) lsThird21(p, w, ang, E, dmg, K);
}
function lsKhac21(p, e, E) { const ew = getCurrentWeapon(e); if (ew && ew.id === 'LONGSWORD' && NH21[E].khac === ew.elem) { floatText(e.x, e.y - 52, `${NH21[E].icon} KHẮC!`, NH21[E].col, 13); return 1.3; } return 1; }
function lsThird21(p, w, ang, E, dmg, K) {
    const N = NH21[E];
    if (E === 'KIM') { [-0.14, 0, 0.14].forEach(o => W21.push({ kind: 'kimBlade', owner: p.id, x: p.x + Math.cos(ang) * 20, y: p.y + Math.sin(ang) * 20, a: ang + o, d: 0, max: 420, sp: 1100, dmg: 22 * (p.meleeMult || 1), hit: new Set(), t: 1 })); AudioSys.playAt('throw', p.x, p.y, 0.6); floatText(p.x, p.y - 40, '⚙️ KIM CHÂM', N.col, 13); }
    else if (E === 'THUY') { W21.push({ kind: 'wave', owner: p.id, x: p.x, y: p.y, a: ang, d: 0, max: 360, sp: 620, dmg: dmg, hit: new Set(), t: 1, K }); AudioSys.playAt('whoosh', p.x, p.y, 0.6); floatText(p.x, p.y - 40, '💧 THỦY BA', N.col, 13); }
    else if (E === 'MOC') { const free = rayFree(p.x, p.y, ang, 300); W21.push({ kind: 'vine', owner: p.id, x: p.x, y: p.y, a: ang, L: free.d, t: 1.4, T: 1.4 }); lineFoes(p, ang, free.d + 10, 22).forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: 1 }); e.st.root = Math.max(e.st.root || 0, 1.2 * K); nhHit21(p, e, 'MOC', dmg, K); floatText(e.x, e.y - 44, '🌿 TRÓI', N.col, 13); }); AudioSys.playAt('whip', p.x, p.y, 0.6); floatText(p.x, p.y - 40, '🌿 DÂY LEO', N.col, 13); }
    else if (E === 'HOA') { W21.push({ kind: 'cone', owner: p.id, x: p.x, y: p.y, a: ang, R: 190, t: 0.45, T: 0.45 }); enemiesOf(p).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 190 + e.radius && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) < 0.6) { dealDamage(e, dmg * 1.2, p.id, { melee: true, knock: 200, angle: ang }); nhHit21(p, e, 'HOA', dmg, K); nhHit21(p, e, 'HOA', dmg, K); } }); [1, 2].forEach(k => zones.push({ type: 'fire', x: p.x + Math.cos(ang) * 75 * k, y: p.y + Math.sin(ang) * 75 * k, r: 45, t: 2.5, maxT: 2.5, owner: p.id, tick: 0 })); AudioSys.playAt('flame', p.x, p.y, 0.8); floatText(p.x, p.y - 40, '🔥 HỎA LONG', N.col, 13); }
    else { // THO
        const free = rayFree(p.x, p.y, ang, 280); W21.push({ kind: 'spikes', owner: p.id, x: p.x, y: p.y, a: ang, L: free.d, t: 0.9, T: 0.9 });
        lineFoes(p, ang, free.d + 10, 30).forEach(e => { dealDamage(e, dmg, p.id, { melee: true, knock: 200, angle: ang }); e.stun = Math.max(e.stun, 0.6 * K); floatText(e.x, e.y - 44, '⛰️ HẤT TUNG', N.col, 13); });
        const ex = p.x + Math.cos(ang) * Math.min(free.d, 240), ey = p.y + Math.sin(ang) * Math.min(free.d, 240), nx = -Math.sin(ang), ny = Math.cos(ang);
        if (!pointInObstacle(ex, ey, 14)) obstacles.push({ x: ex - 22 - Math.abs(nx) * 16, y: ey - 22 - Math.abs(ny) * 16, w: 44 + Math.abs(nx) * 32, h: 44 + Math.abs(ny) * 32, wood: false, temp: 4, hp: 200, maxHp: 200, rock21: true });
        addShake(8); AudioSys.playAt('ground', p.x, p.y, 0.8); floatText(p.x, p.y - 40, '⛰️ ĐỊA CHẤN', N.col, 13);
    }
}
function nhBurst21(p, E, K) { // bùng nổ khi Hoá Hành
    const N = NH21[E]; ring(p.x, p.y, 8, 110, N.col, 0.4, 6); floatText(p.x, p.y - 46, `${N.icon} HOÁ HÀNH: ${N.name.toUpperCase()}`, N.col, 14); AudioSys.playAt('magic', p.x, p.y, 0.5);
    const near = enemiesOf(p).filter(e => !(e.air > 0) && dist(e.x, e.y, p.x, p.y) < 110 + e.radius);
    if (E === 'KIM') near.forEach(e => dealDamage(e, 20 * (p.meleeMult || 1), p.id, { melee: true, knock: 200, angle: Math.atan2(e.y - p.y, e.x - p.x) }));
    else if (E === 'THUY') near.forEach(e => { e.st.slow = Math.max(e.st.slow || 0, 1.5); dealDamage(e, 10, p.id, { knock: 380, angle: Math.atan2(e.y - p.y, e.x - p.x) }); });
    else if (E === 'MOC') { p.hp = Math.min(p.maxHp, p.hp + 15 * HEALK); near.forEach(e => { e.st.root = Math.max(e.st.root || 0, 0.8); }); }
    else if (E === 'HOA') { for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI * 2; zones.push({ type: 'fire', x: p.x + Math.cos(t) * 80, y: p.y + Math.sin(t) * 80, r: 34, t: 2, maxT: 2, owner: p.id, tick: 0 }); } }
    else { p.st.shield = Math.max(p.st.shield || 0, 0) + 60; p.st.shieldT = Math.max(p.st.shieldT || 0, 3); near.forEach(e => { e.stun = Math.max(e.stun, 0.4); }); }
}
function lsMaster21(p) { // Bậc Thầy: NGŨ HÀNH LUÂN TRẢM
    const a = aimDir(p), K = elemBoost21(p);
    NH_ORDER21.forEach((E, i) => p.shotQueue.push({ t: i * 0.1, fn: () => { if (p.hp <= 0) return; const N = NH21[E], b = a + (i - 2) * 0.35;
        slashes.push({ x: p.x, y: p.y, ownerId: p.id, angle: b, range: 150, color: N.col, width: 12, life: 0.22, maxLife: 0.22, swing: i % 2 ? 1 : -1, line: false });
        arcFoes(p, b, 150, 0.6).forEach(e => { dealDamage(e, 16 * (p.meleeMult || 1), p.id, { melee: true, knock: 120, angle: b }); nhHit21(p, e, E, 16, K); });
        AudioSys.playAt('swing', p.x, p.y, 0.4); } }));
    const w = getCurrentWeapon(p); if (w && w.id === 'LONGSWORD') p.ls21N = 2;
    floatText(p.x, p.y - 46, '☯ NGŨ HÀNH LUÂN TRẢM', '#fde68a', 15);
}
function lsUlt21(p) { // KTC: tuyệt kỹ theo hệ
    const w = getCurrentWeapon(p), E = (w && NH21[w.elem]) ? w.elem : 'KIM', a = aimDir(p), d = Math.max(120, Math.min(380, p.skillDist || 300)), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d, N = NH21[E];
    if (E === 'KIM') { for (let i = 0; i < 14; i++) p.shotQueue.push({ t: 0.25 + i * 0.05, fn: () => { const r = Math.sqrt(Math.random()) * 130, t = Math.random() * 6.28, x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r; beams.push({ x1: x + 14, y1: y - 280, x2: x, y2: y, life: 0.2, maxLife: 0.2, color: '#f8fafc' }); enemiesOf(p).forEach(e => { if (dist(e.x, e.y, x, y) < e.radius + 26) { dealDamage(e, 12, p.id, { knock: 1 }); trueDamage(e, 4, p.id); } }); } }); zones.push({ type: 'artyWarn', x: cx, y: cy, r: 130, t: 0.25, maxT: 0.25, owner: p.id, tick: 0 }); }
    else if (E === 'THUY') { [-0.5, 0, 0.5].forEach(o => W21.push({ kind: 'wave', owner: p.id, x: p.x, y: p.y, a: a + o, d: 0, max: 460, sp: 560, dmg: 30, hit: new Set(), t: 1.5, K: 1.5, big: true })); }
    else if (E === 'MOC') { W21.push({ kind: 'thorns', owner: p.id, x: cx, y: cy, R: 140, t: 4, T: 4, tick: 0 }); }
    else if (E === 'HOA') { for (let i = 0; i < 7; i++) { const t = i / 7 * Math.PI * 2; zones.push({ type: 'fire', x: cx + Math.cos(t) * 80, y: cy + Math.sin(t) * 80, r: 55, t: 4, maxT: 4, owner: p.id, tick: 0 }); } zones.push({ type: 'fire', x: cx, y: cy, r: 70, t: 4, maxT: 4, owner: p.id, tick: 0 }); explode(cx, cy, p.id, 30, 130); }
    else { for (let k = 0; k < 3; k++) p.shotQueue.push({ t: k * 0.25, fn: () => { ring(cx, cy, 10, 90 + k * 50, N.col, 0.4, 7); addShake(7); AudioSys.playAt('ground', cx, cy, 0.7); enemiesOf(p).forEach(e => { const dd = dist(e.x, e.y, cx, cy); if (!(e.air > 0) && dd < 90 + k * 50 + e.radius && dd > k * 50 - 20) { dealDamage(e, 18, p.id, { knock: 260, angle: Math.atan2(e.y - cy, e.x - cx) }); e.stun = Math.max(e.stun, 0.4); } }); } }); }
    floatText(p.x, p.y - 46, `${N.icon} ${{ KIM: 'VẠN KIẾM QUY TÔNG', THUY: 'HỒNG THỦY', MOC: 'RỪNG GAI', HOA: 'BIỂN LỬA', THO: 'SƠN BĂNG ĐỊA LIỆT' }[E]}`, N.col, 15);
}

/* ============================== 5) BÙA ============================== */
WEAPONS.BUA = { id: 'BUA', name: 'Bùa', icon: '📜', type: 'GUN', mode: 'charge', chargeTime: 0.6, aim: 'line', color: '#facc15', damage: 40, fireRate: 26, speed: 1, spread: 0, range: 480, magSize: 5, mag: 5, reserve: 15, reloadTime: 2.0, moveScale: 1.05, width: 6, len: 10, tier: 3,
    desc: 'Ném lá BÙA bay hơi bám mục tiêu. Mỗi lá mang 1 trong 10 phép NGẪU NHIÊN (lá kế tiếp hiện trên tay & ô đạn): 🛡 Hộ Thân · 💨 Thần Tốc · 😡 Cuồng Nộ (buff cho mình) · 定 Định Thân · 🔒 Phong Ấn · 🌫 Mù Loà · ☠ Độc Chú (trói buộc địch) · ⚡ Lôi Phù · 🔥 Hỏa Phù (sát thương) · 🔄 Hoán Vị (đổi chỗ với địch). Giữ rồi thả: ĐỔI LÁ (rút lá khác).' };
BASE_WEIGHTS.BUA = 5;
const BUA_FX21 = {
    HO_THAN:  { n: 'Hộ Thân',  i: '🛡', col: '#60a5fa', k: 'buff' },
    THAN_TOC: { n: 'Thần Tốc', i: '💨', col: '#34d399', k: 'buff' },
    CUONG_NO: { n: 'Cuồng Nộ', i: '😡', col: '#f87171', k: 'buff' },
    DINH:     { n: 'Định Thân', i: '定', col: '#facc15', k: 'debuff' },
    PHONG_AN: { n: 'Phong Ấn', i: '🔒', col: '#a78bfa', k: 'debuff' },
    MU:       { n: 'Mù Loà',   i: '🌫', col: '#94a3b8', k: 'debuff' },
    DOC:      { n: 'Độc Chú',  i: '☠', col: '#84cc16', k: 'debuff' },
    LOI:      { n: 'Lôi Phù',  i: '⚡', col: '#67e8f9', k: 'dmg' },
    HOA:      { n: 'Hỏa Phù',  i: '🔥', col: '#fb923c', k: 'dmg' },
    HOAN_VI:  { n: 'Hoán Vị',  i: '🔄', col: '#f0abfc', k: 'special' }
};
const BUA_IDS21 = Object.keys(BUA_FX21);
function buaRoll21(not) { let k; do { k = BUA_IDS21[Math.floor(Math.random() * BUA_IDS21.length)]; } while (k === not); return k; }
function buaSelf21(p, fx) { // phép buff: cháy ngay trong tay khi ném
    const F = BUA_FX21[fx];
    if (fx === 'HO_THAN') { p.st.shield = (p.st.shield || 0) + 50 * HEALK; p.st.shieldT = Math.max(p.st.shieldT || 0, 4); }
    else if (fx === 'THAN_TOC') { p.st.haste = Math.max(p.st.haste || 0, 3); p.hp = Math.min(p.maxHp, p.hp + 20 * HEALK); }
    else if (fx === 'CUONG_NO') p.st.rage = Math.max(p.st.rage || 0, 4);
    ring(p.x, p.y, 6, 50, F.col, 0.4, 4); floatText(p.x, p.y - 48, `${F.i} ${F.n.toUpperCase()}`, F.col, 14); AudioSys.playAt(fx === 'HO_THAN' ? 'shield_up' : fx === 'THAN_TOC' ? 'heal' : 'magic', p.x, p.y, 0.5);
}
function buaApply21(o, f, e, x, y) { // lá bùa trúng địch e (hoặc rơi tại x,y khi trượt)
    const fx = f.fx, F = BUA_FX21[fx], now = now21();
    if (e) { dealDamage(e, f.dmg, o.id, { knock: 120, angle: Math.atan2(e.y - f.y, e.x - f.x) }); floatText(e.x, e.y - 50, `${F.i} ${F.n.toUpperCase()}`, F.col, 14); }
    if (F.k === 'buff') return;
    if (fx === 'DINH' && e) dinhThan(e, 1.4, o.id);
    else if (fx === 'PHONG_AN' && e) { e.disarmT = Math.max(e.disarmT || 0, now + 2); e.charge = 0; (e.skills || []).forEach(s => { s.cd = Math.max(s.cd, 2); }); }
    else if (fx === 'MU' && e) { e.st.blind = Math.max(e.st.blind || 0, 2.5); smoke(e.x, e.y, 6, 'rgba(148,163,184,0.5)', 16); }
    else if (fx === 'DOC' && e) { e.doc21 = { by: o.id, until: now + 4, tick: 0 }; e.st.slow = Math.max(e.st.slow || 0, 2); }
    else if (fx === 'LOI') { const tx = e ? e.x : x, ty = e ? e.y : y; for (let k = 0; k < 3; k++) beams.push({ x1: tx + (Math.random() - 0.5) * 40, y1: ty - 320, x2: tx, y2: ty, life: 0.25, maxLife: 0.25, color: '#a5f3fc', zig: true }); enemiesOf(o).forEach(q => { if (dist(q.x, q.y, tx, ty) < 70 + q.radius) { dealDamage(q, 45 * (f.k || 1), o.id, { knock: 80 }); q.stun = Math.max(q.stun, 0.3); } }); if (e) chainZap(o, e, 25 * (f.k || 1), 2); AudioSys.playAt('zap', tx, ty, 0.7); }
    else if (fx === 'HOA') { const tx = e ? e.x : x, ty = e ? e.y : y; explode(tx, ty, o.id, 45 * (f.k || 1), 110); zones.push({ type: 'fire', x: tx, y: ty, r: 70, t: 3, maxT: 3, owner: o.id, tick: 0 }); }
    else if (fx === 'HOAN_VI' && e && !(e.air > 0)) { const ox = o.x, oy = o.y; afterImages(o, o.x, o.y, e.x, e.y, 4, '#f0abfc'); o.x = e.x; o.y = e.y; e.x = ox; e.y = oy; e.stun = Math.max(e.stun, 0.5); AudioSys.playAt('teleport', o.x, o.y, 0.6); }
    else if (!e) floatText(x, y - 20, '📜 bùa tan', '#94a3b8', 11);
}
function buaThrow21(p, a, fx, o = {}) {
    const F = BUA_FX21[fx];
    if (F.k === 'buff') buaSelf21(p, fx);
    W21.push(Object.assign({ kind: 'bua', owner: p.id, x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18, a, sp: 640, d: 0, max: 480, fx, dmg: 40 * attackMult(p, getCurrentWeapon(p) || WEAPONS.BUA), t: 2, spin: 0 }, o));
    AudioSys.playAt('throw', p.x, p.y, 0.4);
}
function buaFire21(p, w, ang, charge) {
    if (w.mag <= 0) return;
    if (!w.nextFx) w.nextFx = buaRoll21();
    if (charge >= 0.9) { // đổi lá
        p.cooldown = 30 * p.fireRateMult; p.lastFireT = world.time; w.nextFx = buaRoll21(w.nextFx); const F = BUA_FX21[w.nextFx];
        floatText(p.x, p.y - 40, `📜 ĐỔI LÁ → ${F.i} ${F.n}`, F.col, 13); AudioSys.playAt('spell', p.x, p.y, 0.4); return;
    }
    p.cooldown = w.fireRate * p.fireRateMult; p.lastFireT = world.time; p.angle = ang; onAttack(p); p.stats.shots++; if (inBush(p.x, p.y)) p.st.exposed = 1.2;
    if (!world.infiniteAmmo) w.mag--;
    buaThrow21(p, ang, w.nextFx); w.nextFx = buaRoll21();
}
const _ammoTextR21 = ammoText;
ammoText = function (w) {
    if (w && w.id === 'BUA' && w.nextFx && !w.reloading) return `${BUA_FX21[w.nextFx].i} ${w.mag}/${w.magSize}`;
    if (w && w.id === 'AXEGUN') return '🔶'.repeat(w.ch || 0) + '▫'.repeat(2 - (w.ch || 0));
    return _ammoTextR21(w);
};

/* ============================== 6) THẺ BẬC THẦY NGUYÊN TỐ ============================== */
defP('elemMaster', '☯', 'Bậc Thầy Nguyên Tố', 'Mỗi đòn đánh thường trúng có 45% kèm 1 NGUYÊN TỐ ngẫu nhiên: ⚙️ Kim (thêm 25% sát thương xuyên giáp) · 💧 Thủy (làm chậm) · 🌿 Mộc (hút máu) · 🔥 Hỏa (cháy) · ⛰️ Thổ (đẩy lùi). Đánh đủ 5 nguyên tố lên 1 địch trong 6 giây → NGŨ HÀNH HỢP NHẤT (nổ lớn, trói + cháy). Cộng hưởng TRƯỜNG KIẾM: hệ của kiếm luôn kích hoạt kèm, hiệu ứng ngũ hành ×1.5, Hoá Hành gần như tức thì.', p => { p.elemMaster = true; });
function emProc21(A, target, dmg) {
    const now = now21(); if (!target || target.hp <= 0) return;
    target.em21 = target.em21 && target.em21.by === A.id && now - target.em21.t < 6 ? target.em21 : { by: A.id, set: new Set(), t: now };
    if ((target.em21.cd || 0) > now) return; target.em21.cd = now + 0.22; // tránh shotgun kích hoạt hàng loạt
    const w = getCurrentWeapon(A), list = [];
    if (w && w.id === 'LONGSWORD' && NH21[w.elem]) list.push(w.elem);
    if (Math.random() < 0.45) { const miss = NH_ORDER21.filter(E => !target.em21.set.has(E) && !list.includes(E)); list.push(miss.length && Math.random() < 0.6 ? miss[Math.floor(Math.random() * miss.length)] : NH_ORDER21[Math.floor(Math.random() * 5)]); }
    list.forEach(E => { nhHit21(A, target, E, dmg, w && w.id === 'LONGSWORD' ? 1.5 : 1, true); target.em21.set.add(E); target.em21.t = now; if (Math.random() < 0.5) floatText(target.x + (Math.random() - 0.5) * 20, target.y - 30, NH21[E].icon, NH21[E].col, 12); });
    if (target.em21.set.size >= 5) { // NGŨ HÀNH HỢP NHẤT
        target.em21 = null;
        W21.push({ kind: 'unity', owner: A.id, x: target.x, y: target.y, t: 0.7, T: 0.7 });
        enemiesOf(A).forEach(e => { if (dist(e.x, e.y, target.x, target.y) < 110 + e.radius) { dealDamage(e, 60, A.id, { knock: 300, angle: Math.atan2(e.y - target.y, e.x - target.x) }); e.st.root = Math.max(e.st.root || 0, 1.2); if (!e.pyro) { e.st.burn = Math.max(e.st.burn || 0, 3); e.st.burnBy = A.id; } } });
        floatText(target.x, target.y - 60, '☯ NGŨ HÀNH HỢP NHẤT!', '#fde68a', 17); addShake(9); AudioSys.playAt('magic', target.x, target.y, 0.8);
    }
}
let emBusy21 = false;
const _dealDamageR21 = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    const hpBefore = target ? target.hp : 0;
    // Thổ: cầm Trường Kiếm hệ Thổ nhận ít hơn 20%
    if (target && !opts.raw) { const tw = getCurrentWeapon(target); if (tw && tw.id === 'LONGSWORD' && tw.elem === 'THO' && attackerId !== target.id) dmg *= 0.8; }
    const r = _dealDamageR21(target, dmg, attackerId, opts);
    if (!emBusy21 && target && attackerId !== -1 && attackerId !== undefined && !opts.zone && !opts.raw && !opts.summon && target.hp < hpBefore) {
        const A = players.find(q => q.id === attackerId);
        if (A && A !== target && has(A, 'elemMaster') && !(typeof isSkillDmgR19 === 'function' && isSkillDmgR19(opts)) && (opts.melee || opts.bullet)) { emBusy21 = true; try { emProc21(A, target, hpBefore - target.hp); } finally { emBusy21 = false; } }
    }
    return r;
};

/* ============================== MÓC VÀO HỆ THỐNG ============================== */
const _fireWeaponR21 = fireWeapon;
fireWeapon = function (p, w, ang, charge, enemy) {
    if (w && (w.id === 'AXEGUN' || w.id === 'LONGSWORD' || w.id === 'BUA')) {
        if (p.disarmT > world.time) { p.cooldown = Math.max(p.cooldown, 6); return; }
        if (w.id === 'AXEGUN') return agFire21(p, w, ang, charge || 0);
        if (w.id === 'LONGSWORD') return lsFire21(p, w, ang, charge || 0);
        return buaFire21(p, w, ang, charge || 0);
    }
    return _fireWeaponR21(p, w, ang, charge, enemy);
};
const _axeFireR21 = axeFire; // AI bot gọi thẳng axeFire → chuyển sang Rìu Săn mới
axeFire = function (p, w, ang, charge, mult, enemy) { if (w && w.id === 'AXEGUN') return agFire21(p, w, ang, charge || 0); return _axeFireR21(p, w, ang, charge, mult, enemy); };
const _meleeTechR21 = meleeTechCast;
meleeTechCast = function (p) { const w = getCurrentWeapon(p); if (w && w.id === 'AXEGUN') return agHunt21(p); if (w && w.id === 'LONGSWORD') return lsMaster21(p); return _meleeTechR21(p); };
const _gunModR21 = gunModCast;
gunModCast = function (p) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'BUA') { const a = aimDir(p), used = new Set(); [-0.25, 0, 0.25].forEach(o => { let fx; do { fx = buaRoll21(); } while (used.has(fx)); used.add(fx); buaThrow21(p, a + o, fx, { dmg: 14, k: 0.5 }); }); floatText(p.x, p.y - 46, '📜 TAM PHÙ LIÊN PHÁT', '#facc15', 15); return; }
    return _gunModR21(p);
};
Object.assign(HT, {
    AXEGUN: ['SONG LONG BẠO PHÁT', p => agDragon21(p)],
    LONGSWORD: ['NGŨ HÀNH TUYỆT KỸ', p => lsUlt21(p)],
    BUA: ['VẠN PHÙ TRẬN', p => { BUA_IDS21.forEach((fx, i) => p.shotQueue.push({ t: i * 0.07, fn: () => { if (p.hp <= 0) return; const e = enemiesOf(p).filter(q => q.hp > 0 && dist(q.x, q.y, p.x, p.y) < 480 && targetable(p, q)).sort((u, v) => dist(p.x, p.y, u.x, u.y) - dist(p.x, p.y, v.x, v.y))[i % 3]; buaThrow21(p, e ? Math.atan2(e.y - p.y, e.x - p.x) : i / 10 * Math.PI * 2, fx, { dmg: 8, k: 0.3 }); } })); floatText(p.x, p.y - 46, '📜 VẠN PHÙ TRẬN · 10 LÁ', '#facc15', 15); }]
});
Object.assign(HT_PROFILE, {
    AXEGUN: { aim: 'dir', R: 280, shape: 'cone', half: 0.4, col: '249,115,22', tag: 'BẬT LÙI · 2 LOẠT LỬA' },
    LONGSWORD: { aim: 'point', R: 380, shape: 'point', aoe: 140, arc: true, col: '253,230,138', tag: 'TUYỆT KỸ THEO HỆ' },
    BUA: { aim: null, shape: 'selfaoe', aoe: 480, col: '250,204,21', tag: '10 LÁ · ĐỦ 10 PHÉP' }
});
Object.assign(MELEE_P, { AXEGUN: 'Truy Săn nạp đủ 2 nòng.', LONGSWORD: 'Hiệu ứng ngũ hành mạnh hơn 30%.' });
GUN_P.BUA = 'Tam Phù Liên Phát: 3 lá 3 phép khác nhau.';
const _skillProfileR21 = skillProfile;
skillProfile = function (p, id) {
    const w = getCurrentWeapon(p);
    if (w && w.id === 'AXEGUN' && id === 'meleeTech') return { aim: 'dir', R: 320, shape: 'cone', half: 0.8, col: '253,186,116', tag: 'LAO TỚI · NẠP 2 NÒNG' };
    if (w && w.id === 'LONGSWORD' && id === 'meleeTech') return { aim: 'dir', R: 150, shape: 'cone', half: 0.95, col: '253,230,138', tag: '5 NHÁT 5 HỆ' };
    if (w && w.id === 'BUA' && id === 'gunMod') return { aim: 'dir', R: 480, shape: 'cone', half: 0.3, col: '250,204,21', tag: '3 LÁ · 3 PHÉP' };
    return _skillProfileR21(p, id);
};

/* ============================== CẬP NHẬT ============================== */
function step21(f, dt, now) { // trả về true = xoá
    const o = players.find(q => q.id === f.owner);
        if (!o) { return true; }
        if (f.kind === 'axeSpin') {
            f.spin += dt; const sp = 760 * dt;
            if (!f.back) { const nx = f.x + Math.cos(f.a) * sp, ny = f.y + Math.sin(f.a) * sp; if (pointInObstacle(nx, ny, 4) || f.d >= f.max) { f.back = true; f.hit.clear(); } else { f.x = nx; f.y = ny; f.d += sp; } }
            else { const d = dist(f.x, f.y, o.x, o.y); if (d < 26 || o.hp <= 0 || f.t <= 0) { if (f.wid) f.wid.out21 = false; return true; } const b = Math.atan2(o.y - f.y, o.x - f.x); f.x += Math.cos(b) * sp * 1.15; f.y += Math.sin(b) * sp * 1.15; }
            enemiesOf(o).forEach(e => { if (!f.hit.has(e.id) && !(e.air > 0) && dist(e.x, e.y, f.x, f.y) < e.radius + 24) { f.hit.add(e.id); dealDamage(e, f.dmg, o.id, { melee: true, knock: 220, angle: Math.atan2(e.y - f.y, e.x - f.x) }); e.ag21Mark = now + 2.5; e.ag21By = o.id; if (f.wid) f.wid.ch = Math.min(2, (f.wid.ch || 0) + 1); spark(e.x, e.y, '#e5e7eb', 8, 240); } });
            return false;
        }
        if (f.kind === 'kimBlade' || f.kind === 'wave' || f.kind === 'bua') {
            if (f.kind === 'bua') { // hơi bám mục tiêu
                f.spin += dt; const tg = enemiesOf(o).filter(e => e.hp > 0 && !(e.air > 0) && dist(e.x, e.y, f.x, f.y) < 260 && Math.abs(angleDiff(Math.atan2(e.y - f.y, e.x - f.x), f.a)) < 0.7).sort((u, v) => dist(f.x, f.y, u.x, u.y) - dist(f.x, f.y, v.x, v.y))[0];
                if (tg) f.a += Math.max(-2.4 * dt, Math.min(2.4 * dt, angleDiff(Math.atan2(tg.y - f.y, tg.x - f.x), f.a)));
            }
            const st = f.sp * dt, nx = f.x + Math.cos(f.a) * st, ny = f.y + Math.sin(f.a) * st;
            if (pointInObstacle(nx, ny, 3) || f.d >= f.max || f.t <= 0) { if (f.kind === 'bua') buaApply21(o, f, null, f.x, f.y); return true; }
            f.x = nx; f.y = ny; f.d += st;
            const R = f.kind === 'wave' ? (f.big ? 70 : 55) : f.kind === 'bua' ? 10 : 8;
            let done = false;
            for (const e of enemiesOf(o)) {
                if (e.air > 0 || dist(e.x, e.y, f.x, f.y) > e.radius + R) return false;
                if (f.kind === 'bua') { buaApply21(o, f, e); done = true; break; }
                if (f.hit.has(e.id)) return false; f.hit.add(e.id);
                if (f.kind === 'kimBlade') { dealDamage(e, f.dmg, o.id, { melee: true, knock: 90, angle: f.a }); nhHit21(o, e, 'KIM', f.dmg, elemBoost21(o)); spark(e.x, e.y, '#f8fafc', 6, 260); }
                else { dealDamage(e, f.dmg, o.id, { melee: true, knock: 340, angle: f.a }); nhHit21(o, e, 'THUY', f.dmg, f.K || 1); }
            }
            if (done) { return true; }
            if (f.kind === 'wave') for (let j = bullets.length - 1; j >= 0; j--) { const b = bullets[j]; if (b && b.owner !== o.id && dist(b.x, b.y, f.x, f.y) < R) bullets.splice(j, 1); }
            return false;
        }
        if (f.kind === 'thorns') { f.tick += dt; if (f.tick >= 0.3) { f.tick = 0; enemiesOf(o).forEach(e => { if (!(e.air > 0) && dist(e.x, e.y, f.x, f.y) < f.R + e.radius) { dealDamage(e, 6, o.id, { knock: 1 }); e.st.root = Math.max(e.st.root || 0, 0.4); e.st.slow = Math.max(e.st.slow || 0, 0.6); } }); if (dist(o.x, o.y, f.x, f.y) < f.R) o.hp = Math.min(o.maxHp, o.hp + 2 * HEALK); } }
    return f.t <= 0;
}
const _upeR21 = updatePartyExtras;
updatePartyExtras = function (dt) {
    _upeR21(dt);
    armorTick21();
    const now = now21();
    for (let i = W21.length - 1; i >= 0; i--) {
        const f = W21[i]; if (!f) continue; f.t -= dt;
        const sk = !!f._skill && typeof SRC19 !== 'undefined'; if (sk) SRC19.skill++; let rm = false;
        try { rm = step21(f, dt, now); } finally { if (sk) SRC19.skill--; }
        if (rm) { const j = W21.indexOf(f); if (j >= 0) W21.splice(j, 1); }
    }
    players.forEach(p => {
        if (p.doc21 && p.hp > 0) { if (p.doc21.until <= now) p.doc21 = null; else { p.doc21.tick += dt; if (p.doc21.tick >= 0.5) { p.doc21.tick = 0; trueDamage(p, 9, p.doc21.by); if (Math.random() < 0.5) spark(p.x, p.y, '#84cc16', 3, 90); } } }
        const w = p.hp > 0 && getCurrentWeapon(p);
    });
};
const _resetR21b = resetPlayerForRound;
resetPlayerForRound = function (p) { const r = _resetR21b(p); p.doc21 = null; p.em21 = null; p.ls21N = 0; p.ag21N = 0; for (let i = W21.length - 1; i >= 0; i--) if (W21[i].owner === p.id) W21.splice(i, 1); (p.inventory || []).forEach(w => { if (w) w.out21 = false; }); return r; };

/* ============================== VẼ ============================== */
function drawBuaPaper21(c, x, y, rot, s, col, ic) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.fillStyle = '#fde68a'; c.fillRect(-5, -9, 10, 18); c.strokeStyle = '#b45309'; c.lineWidth = 0.8; c.strokeRect(-5, -9, 10, 18);
    c.strokeStyle = '#dc2626'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-2.5, -6); c.lineTo(2.5, -6); c.moveTo(0, -6); c.lineTo(0, 6); c.moveTo(-2.5, -1); c.lineTo(2.5, 2); c.moveTo(-2.5, 4); c.lineTo(2.5, 4); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(0, -7, 1.8, 0, Math.PI * 2); c.fill();
    c.restore();
}
const _drawW2FxR21 = drawW2Fx;
drawW2Fx = function (now) {
    _drawW2FxR21(now);
    const c = ctx; c.save();
    W21.forEach(f => {
        const o = players.find(q => q.id === f.owner); if (!o) return; const u = f.T ? 1 - Math.max(0, f.t) / f.T : 0;
        if (f.kind === 'axeSpin') drawSpinWep21(c, 'AXEGUN', f.x, f.y, f.spin * 22, 1.5, '#e5e7eb');
        else if (f.kind === 'kimBlade') { c.save(); c.translate(f.x, f.y); c.rotate(f.a); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(248,250,252,0.4)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-26, 0); c.lineTo(0, 0); c.stroke(); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#f1f5f9'; c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -3); c.lineTo(-6, 3); c.closePath(); c.fill(); c.strokeStyle = '#475569'; c.lineWidth = 0.8; c.stroke(); c.restore(); }
        else if (f.kind === 'wave') { const R = f.big ? 70 : 55; c.save(); c.translate(f.x, f.y); c.rotate(f.a); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(56,189,248,${0.55 - k * 0.15})`; c.lineWidth = 7 - k * 2; c.beginPath(); c.arc(-k * 10, 0, R, -0.9, 0.9); c.stroke(); } c.fillStyle = 'rgba(186,230,253,0.25)'; c.beginPath(); c.arc(0, 0, R, -0.9, 0.9); c.arc(-14, 0, R - 8, 0.9, -0.9, true); c.fill(); c.restore(); }
        else if (f.kind === 'bua') { const F = BUA_FX21[f.fx]; c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = hexA(F.col, 0.35); c.beginPath(); c.arc(f.x, f.y, 13, 0, Math.PI * 2); c.fill(); c.restore(); drawBuaPaper21(c, f.x, f.y, f.spin * 9, 1.25, F.col); c.font = '10px sans-serif'; c.textAlign = 'center'; c.fillText(F.i, f.x, f.y - 16); }
        else if (f.kind === 'splash') { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const t = f.a + (k - 2.5) * 0.3; c.fillStyle = `rgba(125,211,252,${0.7 * (1 - u)})`; c.beginPath(); c.arc(f.x + Math.cos(t) * 30 * u, f.y + Math.sin(t) * 30 * u, 3, 0, Math.PI * 2); c.fill(); } c.restore(); }
        else if (f.kind === 'vine') { c.save(); c.translate(o === null ? f.x : f.x, f.y); c.rotate(f.a); const L = f.L * Math.min(1, u * 5), k = 1 - Math.max(0, (u - 0.7) / 0.3); c.globalAlpha = k; c.strokeStyle = '#166534'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); for (let x = 0; x <= L; x += 10) c.lineTo(x, Math.sin(x * 0.12) * 6); c.stroke(); c.strokeStyle = '#4ade80'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#86efac'; for (let x = 15; x < L; x += 26) { c.beginPath(); c.ellipse(x, Math.sin(x * 0.12) * 6 - 5, 5, 2.5, -0.6, 0, Math.PI * 2); c.fill(); } c.restore(); }
        else if (f.kind === 'cone') { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(f.x, f.y, 10, f.x, f.y, f.R); g.addColorStop(0, `rgba(254,240,138,${0.9 * (1 - u)})`); g.addColorStop(0.5, `rgba(249,115,22,${0.6 * (1 - u)})`); g.addColorStop(1, 'rgba(220,38,38,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(f.x, f.y); c.arc(f.x, f.y, f.R * (0.5 + u * 0.5), f.a - 0.6, f.a + 0.6); c.closePath(); c.fill(); c.restore(); }
        else if (f.kind === 'spikes') { c.save(); c.translate(f.x, f.y); c.rotate(f.a); const L = f.L * Math.min(1, u * 4), k = 1 - Math.max(0, (u - 0.6) / 0.4); c.globalAlpha = k; for (let x = 24; x < L; x += 22) { const h = 14 + (x % 3) * 4; c.fillStyle = '#92400e'; c.beginPath(); c.moveTo(x - 9, 6); c.lineTo(x, -h); c.lineTo(x + 9, 6); c.closePath(); c.fill(); c.strokeStyle = '#451a03'; c.lineWidth = 1; c.stroke(); c.fillStyle = '#d6a15a'; c.beginPath(); c.moveTo(x - 3, 2); c.lineTo(x, -h + 4); c.lineTo(x + 2, 2); c.closePath(); c.fill(); } c.restore(); }
        else if (f.kind === 'thorns') { c.save(); c.globalAlpha = Math.min(1, f.t); c.strokeStyle = 'rgba(74,222,128,0.5)'; c.lineWidth = 2; c.setLineDash([4, 6]); c.beginPath(); c.arc(f.x, f.y, f.R, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); for (let k = 0; k < 14; k++) { const t = k * 2.4 + 1, r = (k * 37 % 100) / 100 * f.R, x = f.x + Math.cos(t) * r, y = f.y + Math.sin(t) * r, h = 10 + Math.sin(now * 3 + k) * 3; c.fillStyle = '#15803d'; c.beginPath(); c.moveTo(x - 5, y + 4); c.lineTo(x, y - h); c.lineTo(x + 5, y + 4); c.closePath(); c.fill(); } c.restore(); }
        else if (f.kind === 'unity') { c.save(); c.globalCompositeOperation = 'lighter'; NH_ORDER21.forEach((E, k) => { const t = now * 4 + k * Math.PI * 2 / 5, r = 30 + u * 80; c.fillStyle = hexA(NH21[E].col, 1 - u); c.beginPath(); c.arc(f.x + Math.cos(t) * r, f.y + Math.sin(t) * r, 8, 0, Math.PI * 2); c.fill(); }); c.strokeStyle = `rgba(253,230,138,${1 - u})`; c.lineWidth = 4; c.beginPath(); c.arc(f.x, f.y, 110 * u, 0, Math.PI * 2); c.stroke(); c.restore(); }
    });
    // Dấu Săn của Rìu Săn
    players.forEach(p => { if ((p.ag21Mark || 0) > now && p.hp > 0) { c.save(); c.strokeStyle = `rgba(248,113,113,${0.5 + Math.sin(now * 10) * 0.3})`; c.lineWidth = 1.6; c.translate(p.x, p.y); for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(p.radius + 4, 0); c.lineTo(p.radius + 10, 0); c.stroke(); } c.restore(); } });
    c.restore();
};
// đạn Rìu Săn trúng kẻ có Dấu Săn: +35%
const _dealDamageR21b = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (target && opts && opts.bullet && opts.bullet.ag21 && target.ag21By === attackerId && (target.ag21Mark || 0) > now21()) dmg *= 1.35;
    return _dealDamageR21b(target, dmg, attackerId, opts);
};

/* ---------- hình cầm tay ---------- */
ART2.AXEGUN = (c, w, r, x0, ch, now, p) => {
    wood(c, x0 - 8, -2.3, 40, 4.6, 2);
    metal(c, x0 + 2, 2.6, 26, 2.6, '#3f3f46', 1); metal(c, x0 + 2, 5.4, 26, 2.6, '#3f3f46', 1); // 2 nòng dưới cán
    c.fillStyle = '#0a0a0a'; c.fillRect(x0 + 27, 2.9, 1.5, 2); c.fillRect(x0 + 27, 5.7, 1.5, 2);
    const n = w.ch || 0; for (let k = 0; k < 2; k++) { c.fillStyle = k < n ? '#fb923c' : '#3f3f46'; c.beginPath(); c.arc(x0 + 4 + k * 4, -4.4, 1.5, 0, Math.PI * 2); c.fill(); }
    // lưỡi rìu
    c.beginPath(); c.moveTo(x0 + 24, -2); c.quadraticCurveTo(x0 + 30, -13, x0 + 40, -14); c.quadraticCurveTo(x0 + 37, -4, x0 + 40, 4); c.quadraticCurveTo(x0 + 30, 2, x0 + 24, 2); c.closePath();
    const g = c.createLinearGradient(x0 + 24, -14, x0 + 40, 4); g.addColorStop(0, '#f1f5f9'); g.addColorStop(0.6, '#94a3b8'); g.addColorStop(1, '#475569'); c.fillStyle = g; c.fill(); outl(c, 1);
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 + 39, -13); c.quadraticCurveTo(x0 + 36, -4, x0 + 39, 3); c.stroke();
    if (ch > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(251,146,60,${ch * 0.6})`; c.beginPath(); c.arc(x0 + 29, 4, 3 + ch * 2, 0, Math.PI * 2); c.fill(); c.restore(); }
    MUZ.AXEGUN = x0 + 29;
};
ART2.LONGSWORD = (c, w, r, x0, ch, now, p) => {
    const E = NH21[w.elem] ? w.elem : 'KIM', N = NH21[E];
    metal(c, x0 - 7, -1.8, 9, 3.6, '#292524', 1.2); // chuôi
    c.fillStyle = N.col; c.beginPath(); c.arc(x0 - 8, 0, 2.2, 0, Math.PI * 2); c.fill(); outl(c, 0.5);
    metal(c, x0 + 1, -6, 3, 12, E === 'THO' ? '#78350f' : '#a16207', 1); // chắn tay
    const L = 38, bx = x0 + 4;
    c.beginPath(); c.moveTo(bx, -2.6); c.lineTo(bx + L - 6, -2.4); c.lineTo(bx + L, 0); c.lineTo(bx + L - 6, 2.4); c.lineTo(bx, 2.6); c.closePath();
    let g = c.createLinearGradient(0, -3, 0, 3);
    if (E === 'KIM') { g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#cbd5e1'); g.addColorStop(1, '#64748b'); }
    else if (E === 'THUY') { g.addColorStop(0, 'rgba(224,242,254,0.95)'); g.addColorStop(0.5, 'rgba(56,189,248,0.75)'); g.addColorStop(1, 'rgba(3,105,161,0.9)'); }
    else if (E === 'MOC') { g.addColorStop(0, '#bbf7d0'); g.addColorStop(0.5, '#a16207'); g.addColorStop(1, '#713f12'); }
    else if (E === 'HOA') { g.addColorStop(0, '#fef08a'); g.addColorStop(0.5, '#f97316'); g.addColorStop(1, '#7f1d1d'); }
    else { g.addColorStop(0, '#d6d3d1'); g.addColorStop(0.5, '#a8a29e'); g.addColorStop(1, '#57534e'); }
    c.fillStyle = g; c.fill(); outl(c, E === 'THO' ? 1.4 : 0.9);
    c.save(); c.globalCompositeOperation = 'lighter';
    if (E === 'KIM') { const sx = bx + ((now * 40) % (L + 20)) - 10; c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(sx, -2, 3, 4); }
    else if (E === 'THUY') { c.strokeStyle = 'rgba(186,230,253,0.8)'; c.lineWidth = 0.8; c.beginPath(); for (let x = 0; x <= L - 4; x += 2) c.lineTo(bx + x, Math.sin(x * 0.5 - now * 8) * 1.2); c.stroke(); }
    else if (E === 'MOC') { c.fillStyle = '#4ade80'; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(bx + 8 + k * 11, -3.5 + (k % 2) * 7, 3, 1.4, k % 2 ? 0.6 : -0.6, 0, Math.PI * 2); c.fill(); } }
    else if (E === 'HOA') { for (let k = 0; k < 5; k++) { const x = bx + 4 + k * 7, h = 4 + Math.sin(now * 14 + k) * 2.5; c.fillStyle = `rgba(253,186,116,${0.6})`; c.beginPath(); c.moveTo(x - 2, -2); c.quadraticCurveTo(x, -2 - h, x + 2, -2); c.fill(); } }
    else { c.fillStyle = 'rgba(214,161,90,0.6)'; for (let k = 0; k < 4; k++) c.fillRect(bx + 5 + k * 8, -1.5 + (k % 2), 3, 1.5); }
    c.fillStyle = hexA(N.glow, 0.15 + ch * 0.5); c.beginPath(); c.ellipse(bx + L / 2, 0, L / 2 + 4, 5 + ch * 3, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    MUZ.LONGSWORD = bx + L;
};
ART2.BUA = (c, w, r, x0, ch, now, p) => {
    const F = BUA_FX21[w.nextFx] || BUA_FX21.DINH;
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = hexA(F.col, 0.3 + Math.sin(now * 5) * 0.1 + ch * 0.3); c.beginPath(); c.arc(x0 + 8, 0, 11 + ch * 4, 0, Math.PI * 2); c.fill(); c.restore();
    drawBuaPaper21(c, x0 + 3, 2, -0.25, 0.85, '#a16207'); // lá sau
    drawBuaPaper21(c, x0 + 8, 0, Math.PI / 2 + (ch > 0.05 ? Math.sin(now * 30) * 0.15 : 0), 1, F.col);
    MUZ.BUA = x0 + 14;
};
