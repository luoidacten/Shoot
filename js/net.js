/** ==================== ONLINE 4 MÁY (WebRTC P2P qua PeerJS) ====================
 *  Chủ phòng (P1) chạy toàn bộ mô phỏng, gửi ảnh chụp trạng thái 30 lần/giây.
 *  Khách (P2) gửi phím bấm, nhận trạng thái, tự dựng hiệu ứng + dự đoán chuyển động của chính mình.
 */
const net = {
    role: null, peer: null, conn: null, myId: 1, code: '',
    events: [], mute: 0, sendT: 0, inT: 0, lastIn: '',
    remote: { move: { x: 0, y: 0 }, a: false, b: false, c: false, s1: false, s2: false, la: false, lb: false, lc: false, ls1: false, ls2: false },
    augPicked: false, lastHp: null
};
const ROOM_PREFIX = 'dtkn-arena-v1-';

function loadPeerLib() {
    return new Promise((resolve, reject) => {
        if (window.Peer) return resolve();
        const urls = ['https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js', 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];
        let i = 0;
        const next = () => {
            if (i >= urls.length) return reject(new Error('Không tải được thư viện mạng (kiểm tra Internet)'));
            const s = document.createElement('script'); s.src = urls[i++];
            s.onload = () => window.Peer ? resolve() : next(); s.onerror = next;
            document.head.appendChild(s);
        };
        next();
    });
}
function randomCode() { const c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function setNetStatus(t, cls = '') { const el = $('net-status'); el.textContent = t; el.className = 'net-status ' + cls; }






/** Bọc các hàm hiệu ứng: ở chủ phòng, mỗi lần gọi sẽ được ghi lại để phát lại ở máy khách */
const NET_FX = ['spark', 'directionalSpark', 'smoke', 'createBlood', 'ring', 'floatText', 'damageNumber', 'addDecal', 'addScorch', 'addShake', 'hitStop', 'flash', 'showBanner', 'explosionFx'];
(function wrapForNet() {
    NET_FX.forEach(name => {
        const orig = window[name];
        window[name] = function (...args) {
            if (net.role === 'host' && !net.mute) net.events.push([name, args]);
            net.mute++;
            try { return orig.apply(this, args); } finally { net.mute--; }
        };
    });
    const play = AudioSys.play.bind(AudioSys), playAt = AudioSys.playAt.bind(AudioSys);
    AudioSys.play = (t, v, pan) => { if (net.role === 'host' && !net.mute) net.events.push(['snd', [t, v]]); return play(t, v, pan); };
    AudioSys.playAt = (t, x, y, v, r) => {
        if (net.role === 'host' && !net.mute) net.events.push(['sndAt', [t, x, y, v, r]]);
        net.mute++; try { return playAt(t, x, y, v, r); } finally { net.mute--; }
    };
})();

/** ---------- CHỦ PHÒNG ---------- */
const R1 = v => Math.round(v * 10) / 10;
function snapPlayer(p) {
    return {
        id: p.id, x: R1(p.x), y: R1(p.y), angle: R1(p.angle * 10) / 10, hp: R1(p.hp), maxHp: p.maxHp, ghostHp: R1(p.ghostHp), armor: R1(p.armor), maxArmor: p.maxArmor,
        radius: p.radius, inventory: p.inventory, weaponIdx: p.weaponIdx, score: p.score, cooldown: R1(p.cooldown), fireRateMult: p.fireRateMult,
        recoil: R1(p.recoil), muzzle: R1(p.muzzle * 100) / 100, hitFlash: R1(p.hitFlash * 100) / 100, stun: R1(p.stun), spawnShield: R1(p.spawnShield), ghostT: R1(p.ghostT),
        thorns: p.thorns, label: p.label, color: p.color, isBot: p.isBot, dead: p.dead, stats: p.stats, moveMult: p.moveMult, kx: R1(p.kx), ky: R1(p.ky), dashTime: R1(p.dashTime),
        st: p.st, skills: p.skills, build: p.build, minor: p.minor, combos: p.combos, superCharge: p.superCharge, superNeed: p.superNeed,
        silent: p.silent, hunter: p.hunter, eagle: p.eagle, aimshot: p.aimshot, pyro: p.pyro, noMind: p.noMind,
        aiming: p.aiming, aimAngle: R1((p.aimAngle || 0) * 100) / 100, charge: R1((p.charge || 0) * 100) / 100, cancelShot: p.cancelShot, manualEngaged: p.manualEngaged, aimDist: Math.round(p.aimDist || 0),
        stillT: R1(p.stillT || 0), spinUp: R1(p.spinUp || 0), shotCount: p.shotCount, sniperNest: p.sniperNest, watchman: p.watchman, saboteur: p.saboteur, collector: p.collector, bushStalker: p.bushStalker, bigMag: p.bigMag, air: R1(p.air || 0), airH: R1(p.airH || 0), jet: p.jetT > 0, lastFireT: R1(p.lastFireT || -9), vault: p.vault
    };
}
function buildSnapshot() {
    const z = world.zone;
    return {
        t: 's', gs: gameState, cd: R1(countdown), rd: currentRound, di: DESTINIES.indexOf(currentDestiny), mw: settings.maxWins,
        sm: R1(fx.slowMo), cf: camera.focus || null, mi: AudioSys.seq.intensity,
        w: { mapType: world.mapType, time: R1(world.time), zonePhase: world.zonePhase, darkness: world.darkness, ice: world.ice, infiniteAmmo: world.infiniteAmmo, theme: world.theme, zoneDelay: world.zoneDelay,
             zone: { x: R1(z.x), y: R1(z.y), r: R1(z.r), tx: R1(z.tx), ty: R1(z.ty), endR: z.endR } },
        pl: players.map(snapPlayer),
        b: bullets.map(b => [R1(b.x), R1(b.y), R1(b.angle * 100) / 100, b.speed, b.color, b.size, b.trail || 26, b.explosive ? 1 : 0, b.blastSmall ? 1 : 0]),
        it: items.map(i => [R1(i.x), R1(i.y), R1(i.angle), i.type.id, i.type.color, i.type.len || 14, R1(i.fuse), R1(i.z || 0)]),
        cr: crates.map(c => [R1(c.x), R1(c.y), c.size, c.type, R1(c.blinkOffset), R1(c.born), c.owner || 0, c.look || '']),
        bu: bushes.map(b => [R1(b.x), R1(b.y), R1(b.r), R1(b.seed), b.t === undefined ? -1 : R1(b.t), b.owner || 0]),
        ob: obstacles.map(o => [R1(o.x), R1(o.y), R1(o.w), R1(o.h), o.wood ? 1 : 0, o.hp || 0, o.maxHp || 0, o.hit > 0 ? 1 : 0, o.ice ? 1 : 0, o.reflect ? 1 : 0, o.sandbag ? 1 : 0, o.ownerPass || 0, o.shieldOf || 0]),
        zn: zones.map(z => [z.type, R1(z.x), R1(z.y), R1(z.r), R1(z.t), z.maxT, z.owner, z.phase || 0, z.totem ? 1 : 0]),
        tu: turrets.map(t => [R1(t.x), R1(t.y), t.owner, R1(t.angle * 100) / 100, R1(t.t), t.color]),
        mi: mines.map(m => [R1(m.x), R1(m.y), m.owner, R1(m.arm), m.kind || 'spike', R1(m.angle || 0), R1(m.x2 || 0), R1(m.y2 || 0)]),
        dc: decoys.map(d => [R1(d.x), R1(d.y), d.owner, R1(d.angle * 100) / 100, d.color, d.radius, d.label]),
        me: meteors.map(m => [R1(m.x), R1(m.y), R1(m.warningTime), m.maxT]),
        ad: airdrops.map(d => [R1(d.x), R1(d.y), R1(d.t), d.maxT]),
        sl: slashes.map(s => [s.ownerId, R1(s.angle * 100) / 100, s.range, s.color, s.width, R1(s.life * 100) / 100, s.maxLife, s.swing, s.line ? 1 : 0]),
        bm: beams.map(b => [R1(b.x1), R1(b.y1), R1(b.x2), R1(b.y2), R1(b.life * 100) / 100, b.maxLife, b.color, b.zig ? 1 : 0]),
        ev: net.events.splice(0)
    };
}
function netHostTick(dt) {
    net.sendT += dt;
    if (net.sendT >= 1 / 30) { net.sendT = 0; netSend(buildSnapshot()); }
}

/** ---------- MÁY KHÁCH ---------- */
let guestDestinyRolling = false;

function applySnapshot(s) {
    const IN = ['COUNTDOWN', 'PLAYING', 'KO', 'ROUND_OVER'];
    if (gameState === 'GAMEOVER' || gameState === 'AUGMENT' || gameState === 'AUG_DONE') { if (!IN.includes(s.gs)) return; }
    gameState = s.gs; countdown = s.cd; currentRound = s.rd; currentDestiny = DESTINIES[s.di] || currentDestiny; settings.maxWins = s.mw;
    fx.slowMo = s.sm; camera.focus = s.cf; AudioSys.setIntensity(s.mi);
    Object.assign(world, s.w);
    const zone = world.zone; zone.sx = zone.x; zone.sy = zone.y;

    s.pl.forEach(sp => {
        let p = players.find(q => q.id === sp.id);
        if (!p) { p = { ...sp, tx: sp.x, ty: sp.y, ta: sp.angle }; players.push(p); players.sort((a, b) => a.id - b.id); return; }
        const keep = { x: p.x, y: p.y, angle: p.angle };
        Object.assign(p, sp);
        // dịch chuyển xa (hồi sinh, Ảo Thuật Gia) → nhảy thẳng tới
        if (dist(keep.x, keep.y, sp.x, sp.y) < 150) { p.x = keep.x; p.y = keep.y; p.angle = keep.angle; }
        p.tx = sp.x; p.ty = sp.y; p.ta = sp.aiming ? sp.aimAngle : sp.angle;
    });
    players.forEach(p => { p.cardSet = new Set(p.build || []); p.comboSet = new Set(p.combos || []); });
    const me = localPlayer();
    if (me) { if (net.lastHp !== null && me.hp < net.lastHp - 0.5) vibrate(me.hp <= 0 ? 200 : 25); net.lastHp = me.hp; }

    bullets.length = 0; s.b.forEach(b => bullets.push({ x: b[0], y: b[1], angle: b[2], speed: b[3], color: b[4], size: b[5], trail: b[6], explosive: !!b[7], blastSmall: !!b[8] }));
    items.length = 0; s.it.forEach(i => items.push({ x: i[0], y: i[1], angle: i[2], type: { id: i[3], color: i[4], len: i[5] }, fuse: i[6], z: i[7] }));
    crates.length = 0; s.cr.forEach(c => crates.push({ x: c[0], y: c[1], size: c[2], type: c[3], blinkOffset: c[4], born: c[5], owner: c[6], look: c[7] }));
    obstacles.length = 0; s.ob.forEach(o => obstacles.push({ x: o[0], y: o[1], w: o[2], h: o[3], wood: !!o[4], hp: o[5], maxHp: o[6], hit: o[7] ? 0.1 : 0, ice: !!o[8], reflect: !!o[9], sandbag: !!o[10], ownerPass: o[11] || undefined, temp: (o[8] || o[10] || o[12]) ? 1 : undefined, shieldOf: o[12] || undefined }));
    bushes.length = 0; (s.bu || []).forEach(b => bushes.push({ x: b[0], y: b[1], r: b[2], seed: b[3], t: b[4] < 0 ? undefined : b[4], owner: b[5] }));
    zones.length = 0; s.zn.forEach(z => zones.push({ type: z[0], x: z[1], y: z[2], r: z[3], t: z[4] === null ? Infinity : z[4], maxT: z[5], owner: z[6], phase: z[7], tick: 0, totem: !!z[8] }));
    turrets.length = 0; s.tu.forEach(t => turrets.push({ x: t[0], y: t[1], owner: t[2], angle: t[3], t: t[4], color: t[5] }));
    mines.length = 0; s.mi.forEach(m => mines.push({ x: m[0], y: m[1], owner: m[2], arm: m[3], kind: m[4], angle: m[5], x2: m[6], y2: m[7] }));
    decoys.length = 0; s.dc.forEach(d => decoys.push({ x: d[0], y: d[1], owner: d[2], angle: d[3], color: d[4], radius: d[5], label: d[6] }));
    meteors.length = 0; s.me.forEach(m => meteors.push({ x: m[0], y: m[1], warningTime: m[2], maxT: m[3] }));
    airdrops.length = 0; s.ad.forEach(d => airdrops.push({ x: d[0], y: d[1], t: d[2], maxT: d[3] }));
    slashes.length = 0; s.sl.forEach(l => slashes.push({ ownerId: l[0], angle: l[1], range: l[2], color: l[3], width: l[4], life: l[5], maxLife: l[6], swing: l[7], line: !!l[8] }));
    beams.length = 0; s.bm.forEach(b => beams.push({ x1: b[0], y1: b[1], x2: b[2], y2: b[3], life: b[4], maxLife: b[5], color: b[6], zig: b[7] }));

    // phát lại hiệu ứng / âm thanh
    s.ev.forEach(([name, args]) => {
        try {
            if (name === 'snd') AudioSys.play(args[0], args[1]);
            else if (name === 'sndAt') AudioSys.playAt(args[0], args[1], args[2], args[3], args[4]);
            else if (typeof window[name] === 'function') window[name](...args);
        } catch (e) {}
    });
    if (IN.includes(gameState) && !guestDestinyRolling) {
        if (!$('augment-screen').classList.contains('hidden') || !$('gameover-screen').classList.contains('hidden') || !$('online-screen').classList.contains('hidden')) showScreen(null);
        $('pause-btn').classList.add('hidden');
    }
}

const rv = v => v ? { x: Math.round(v.x * 20) / 20, y: Math.round(v.y * 20) / 20 } : null;
function guestUpdate(dt) {
    updateFx(dt);
    // gửi phím bấm: 30 lần/giây, hoặc ngay khi nút thay đổi
    const inp = readHumanInput(net.myId);
    const key = `${inp.a}${inp.b}${inp.c}${inp.s1}${inp.s2}${inp.aim ? Math.round(Math.atan2(inp.aim.y, inp.aim.x) * 8) : ''}`;
    net.inT += dt;
    if (net.inT >= 1 / 30 || key !== net.lastIn) {
        net.inT = 0; net.lastIn = key;
        netSend({ t: 'in', i: { move: { x: R1(inp.move.x * 10) / 10, y: R1(inp.move.y * 10) / 10 }, a: inp.a, b: inp.b, c: inp.c, s1: inp.s1, s2: inp.s2, aim: inp.aim ? { x: R1(inp.aim.x * 10) / 10, y: R1(inp.aim.y * 10) / 10 } : null, aimActive: !!inp.aimActive, aimMouse: !!inp.aimMouse, aimDist: inp.aimDist ? Math.round(inp.aimDist) : 0, s1aim: rv(inp.s1aim), s2aim: rv(inp.s2aim), s1cancel: !!inp.s1cancel, s2cancel: !!inp.s2cancel } });
    }
    if (!['COUNTDOWN', 'PLAYING', 'KO', 'ROUND_OVER'].includes(gameState)) return;
    let sdt = fx.slowMo > 0 ? dt * 0.3 : dt;
    const me = localPlayer();
    if (me) { guestSkillView(me, inp); me.aimMag = inp.aim ? Math.min(1, Math.hypot(inp.aim.x, inp.aim.y)) : 0; me.aiming = !!inp.a && gameState === 'PLAYING'; if (inp.aim && Math.hypot(inp.aim.x, inp.aim.y) > 0.3) { me.aimAngle = Math.atan2(inp.aim.y, inp.aim.x); me.manualEngaged = true; } }
    players.forEach(p => {
        if (p.tx === undefined) return;
        if (p === me && gameState === 'PLAYING' && p.hp > 0 && !(p.stun > 0) && !(p.dashTime > 0) && !(p.air > 0)) {
            // dự đoán chuyển động của chính mình cho mượt, rồi kéo nhẹ về vị trí thật
            const w = getCurrentWeapon(p);
            const sp = 175 * (w.moveScale || 1) * (p.moveMult || 1) * (p.st && p.st.haste > 0 ? 1.5 : 1) * (p.st && p.st.slow > 0 ? 0.5 : 1);
            p.x += inp.move.x * sp * sdt; p.y += inp.move.y * sp * sdt;
            resolveCircle(p, p.radius);
            const k = Math.min(1, sdt * 6); p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
        } else {
            const k = Math.min(1, dt * 16); p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
        }
        p.angle += angleDiff(p.ta, p.angle) * Math.min(1, dt * 16);
    });
    bullets.forEach(b => { b.x += Math.cos(b.angle) * b.speed * 60 * sdt; b.y += Math.sin(b.angle) * b.speed * 60 * sdt; });
    for (let i = slashes.length - 1; i >= 0; i--) { slashes[i].life -= sdt; if (slashes[i].life <= 0) slashes.splice(i, 1); }
    for (let i = beams.length - 1; i >= 0; i--) { beams[i].life -= sdt; if (beams[i].life <= 0) beams.splice(i, 1); }
    updateFootprints(dt);
    updateCamera(dt);
    if (me && me.hp > 0 && me.hp < me.maxHp * 0.3 && gameState === 'PLAYING') { heartTimer -= dt; if (heartTimer <= 0) { AudioSys.play('heart', 0.5); heartTimer = 0.85; } }
}

function clearPlayersForPick() { [bullets, items, slashes, beams, zones, turrets, mines, decoys].forEach(a => a.length = 0); }

/** ---------- Màn hình sảnh ---------- */
$('host-btn').addEventListener('click', () => { AudioSys.init(); AudioSys.play('ui'); hostRoom(); });
$('join-btn').addEventListener('click', () => { AudioSys.init(); AudioSys.play('ui'); joinRoom($('join-input').value); });
$('join-input').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') joinRoom($('join-input').value); });
$('join-input').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
$('copy-link-btn').addEventListener('click', async () => {
    const link = location.origin + location.pathname + '#join=' + net.code;
    try { await navigator.clipboard.writeText(link); setNetStatus('Đã chép link mời! Gửi cho bạn bè nhé.', 'ok'); }
    catch (e) { setNetStatus('Link mời: ' + link, 'wait'); }
});
$('online-back-btn').addEventListener('click', () => { netLeave(); goMenu(); });

// Mở bằng link mời: …#join=ABCDE
window.addEventListener('load', () => {
    const m = location.hash.match(/join=([A-Za-z0-9]{5})/);
    if (m) {
        settings.mode = 'online';
        document.querySelectorAll('.seg[data-opt="mode"] button').forEach(b => b.classList.toggle('active', b.dataset.val === 'online'));
        showScreen('online-screen'); $('join-input').value = m[1].toUpperCase();
        history.replaceState(null, '', location.pathname);
        setTimeout(() => joinRoom(m[1]), 300);
    }
});
