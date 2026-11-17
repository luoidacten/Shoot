/** ==================== ONLINE 2 MÁY (WebRTC P2P qua PeerJS) ====================
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
function netSend(msg) { if (net.conn && net.conn.open) { try { net.conn.send(msg); } catch (e) {} } }

async function hostRoom() {
    netLeave(true);
    setNetStatus('Đang mở phòng…');
    try { await loadPeerLib(); } catch (e) { setNetStatus(e.message, 'err'); return; }
    net.code = randomCode();
    net.peer = new Peer(ROOM_PREFIX + net.code);
    net.peer.on('open', () => {
        $('room-code').textContent = net.code; $('room-code-box').classList.remove('hidden');
        setNetStatus('Đã tạo phòng. Gửi mã cho bạn bè và chờ họ vào…', 'wait');
    });
    net.peer.on('connection', conn => {
        if (net.conn) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
        bindConn(conn, 'host');
    });
    net.peer.on('error', e => {
        if (e.type === 'unavailable-id') return hostRoom();
        setNetStatus('Lỗi mạng: ' + e.type, 'err');
    });
    net.peer.on('disconnected', () => { if (net.peer && !net.peer.destroyed) net.peer.reconnect(); });
}

async function joinRoom(code) {
    code = (code || '').trim().toUpperCase();
    if (code.length !== 5) { setNetStatus('Mã phòng gồm 5 ký tự', 'err'); return; }
    netLeave(true);
    setNetStatus('Đang tìm phòng ' + code + '…');
    try { await loadPeerLib(); } catch (e) { setNetStatus(e.message, 'err'); return; }
    net.peer = new Peer();
    net.peer.on('open', () => {
        const conn = net.peer.connect(ROOM_PREFIX + code, { reliable: true, serialization: 'json' });
        bindConn(conn, 'guest');
        setTimeout(() => { if (!net.role && net.conn === conn) setNetStatus('Không kết nối được. Kiểm tra mã phòng hoặc mạng (một số mạng 4G chặn kết nối P2P).', 'err'); }, 12000);
    });
    net.peer.on('error', e => setNetStatus(e.type === 'peer-unavailable' ? 'Không tìm thấy phòng ' + code : 'Lỗi mạng: ' + e.type, 'err'));
}

function bindConn(conn, role) {
    net.conn = conn;
    conn.on('open', () => {
        net.role = role; net.myId = role === 'host' ? 1 : 2;
        settings.mode = 'online';
        document.body.classList.add('online');
        document.body.classList.toggle('me1', role === 'host'); document.body.classList.toggle('me2', role === 'guest');
        AudioSys.init();
        if (role === 'host') {
            setNetStatus('Đối thủ đã vào! Bắt đầu…', 'ok');
            netSend({ t: 'hello', maxWins: settings.maxWins });
            setTimeout(() => startMatch(), 600);
        } else {
            setNetStatus('Đã vào phòng! Chờ chủ phòng bắt đầu…', 'ok');
            players.length = 0;
            AudioSys.startMusic();
        }
    });
    conn.on('data', onNetData);
    conn.on('close', () => netDisconnected());
    conn.on('error', () => netDisconnected());
}

function netDisconnected() {
    if (!net.role) return;
    const wasIn = gameState !== 'MENU';
    netLeave(true);
    if (wasIn) { goMenu(); }
    showScreen('online-screen');
    setNetStatus('Mất kết nối với đối thủ.', 'err');
}

function netLeave(silent) {
    const c = net.conn, p = net.peer;
    net.conn = null; net.peer = null; net.role = null; net.events.length = 0;
    try { c && c.close(); } catch (e) {}
    try { p && p.destroy(); } catch (e) {}
    document.body.classList.remove('online', 'me1', 'me2');
    $('room-code-box').classList.add('hidden');
    if (!silent) setNetStatus('');
}

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
        thorns: p.thorns, label: p.label, color: p.color, isBot: false, dead: p.dead, stats: p.stats, moveMult: p.moveMult, kx: R1(p.kx), ky: R1(p.ky), dashTime: R1(p.dashTime),
        st: p.st, skills: p.skills, build: p.build, minor: p.minor, combos: p.combos, superCharge: p.superCharge, superNeed: p.superNeed,
        silent: p.silent, hunter: p.hunter, eagle: p.eagle, aimshot: p.aimshot, pyro: p.pyro, noMind: p.noMind
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
        cr: crates.map(c => [R1(c.x), R1(c.y), c.size, c.type, R1(c.blinkOffset), R1(c.born)]),
        ob: obstacles.map(o => [R1(o.x), R1(o.y), R1(o.w), R1(o.h), o.wood ? 1 : 0, o.hp || 0, o.maxHp || 0, o.hit > 0 ? 1 : 0, o.ice ? 1 : 0, o.reflect ? 1 : 0]),
        zn: zones.map(z => [z.type, R1(z.x), R1(z.y), R1(z.r), R1(z.t), z.maxT, z.owner, z.phase || 0]),
        tu: turrets.map(t => [R1(t.x), R1(t.y), t.owner, R1(t.angle * 100) / 100, R1(t.t), t.color]),
        mi: mines.map(m => [R1(m.x), R1(m.y), m.owner, R1(m.arm)]),
        dc: decoys.map(d => [R1(d.x), R1(d.y), d.owner, R1(d.angle * 100) / 100, d.color, d.radius, d.label]),
        me: meteors.map(m => [R1(m.x), R1(m.y), R1(m.warningTime), m.maxT]),
        ad: airdrops.map(d => [R1(d.x), R1(d.y), R1(d.t), d.maxT]),
        sl: slashes.map(s => [s.ownerId, R1(s.angle * 100) / 100, s.range, s.color, s.width, R1(s.life * 100) / 100, s.maxLife, s.swing]),
        bm: beams.map(b => [R1(b.x1), R1(b.y1), R1(b.x2), R1(b.y2), R1(b.life * 100) / 100, b.maxLife, b.color]),
        ev: net.events.splice(0)
    };
}
function netHostTick(dt) {
    net.sendT += dt;
    if (net.sendT >= 1 / 30) { net.sendT = 0; netSend(buildSnapshot()); }
}
/** Lấy input của khách — có "chốt" để không mất các cú bấm quá nhanh */
function netRemoteInput() {
    const r = net.remote;
    const out = { move: r.move, a: r.a || r.la, b: r.b || r.lb, c: r.c || r.lc, s1: r.s1 || r.ls1, s2: r.s2 || r.ls2 };
    r.la = r.lb = r.lc = r.ls1 = r.ls2 = false;
    return out;
}

/** ---------- MÁY KHÁCH ---------- */
let guestDestinyRolling = false;
function onNetData(m) {
    if (!m || !m.t) return;
    if (m.t === 'full') { setNetStatus('Phòng đã đủ người.', 'err'); return; }
    if (net.role === 'host') {
        if (m.t === 'in') {
            const r = net.remote, i = m.i;
            r.move = i.move; if (i.a && !r.a) r.la = true; if (i.b && !r.b) r.lb = true; if (i.c && !r.c) r.lc = true;
            if (i.s1 && !r.s1) r.ls1 = true; if (i.s2 && !r.s2) r.ls2 = true;
            r.a = i.a; r.b = i.b; r.c = i.c; r.s1 = i.s1; r.s2 = i.s2;
        } else if (m.t === 'pick') pickAugmentByIndex(2, m.idx, true);
        return;
    }
    // ---- khách ----
    switch (m.t) {
        case 'hello': settings.maxWins = m.maxWins; break;
        case 'destiny':
            currentRound = m.rd; currentDestiny = DESTINIES[m.di]; gameState = 'DESTINY';
            if (m.rd === 1) { players.length = 0; AudioSys.startMusic(); }
            clearDecals(); clearFootprints(); [bullets, items, particles, texts, rings, slashes, beams].forEach(a => a.length = 0);
            guestDestinyRolling = true;
            playDestinyRoll(currentDestiny, () => { guestDestinyRolling = false; });
            break;
        case 'aug': guestOpenAugments(m); break;
        case 'over': showGameOver(); break;
        case 's': applySnapshot(m); break;
    }
}

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
        p.tx = sp.x; p.ty = sp.y; p.ta = sp.angle;
    });
    players.forEach(p => { p.cardSet = new Set(p.build || []); p.comboSet = new Set(p.combos || []); });
    const me = localPlayer();
    if (me) { if (net.lastHp !== null && me.hp < net.lastHp - 0.5) vibrate(me.hp <= 0 ? 200 : 25); net.lastHp = me.hp; }

    bullets.length = 0; s.b.forEach(b => bullets.push({ x: b[0], y: b[1], angle: b[2], speed: b[3], color: b[4], size: b[5], trail: b[6], explosive: !!b[7], blastSmall: !!b[8] }));
    items.length = 0; s.it.forEach(i => items.push({ x: i[0], y: i[1], angle: i[2], type: { id: i[3], color: i[4], len: i[5] }, fuse: i[6], z: i[7] }));
    crates.length = 0; s.cr.forEach(c => crates.push({ x: c[0], y: c[1], size: c[2], type: c[3], blinkOffset: c[4], born: c[5] }));
    obstacles.length = 0; s.ob.forEach(o => obstacles.push({ x: o[0], y: o[1], w: o[2], h: o[3], wood: !!o[4], hp: o[5], maxHp: o[6], hit: o[7] ? 0.1 : 0, ice: !!o[8], reflect: !!o[9], temp: o[8] ? 1 : undefined }));
    zones.length = 0; s.zn.forEach(z => zones.push({ type: z[0], x: z[1], y: z[2], r: z[3], t: z[4], maxT: z[5], owner: z[6], phase: z[7], tick: 0 }));
    turrets.length = 0; s.tu.forEach(t => turrets.push({ x: t[0], y: t[1], owner: t[2], angle: t[3], t: t[4], color: t[5] }));
    mines.length = 0; s.mi.forEach(m => mines.push({ x: m[0], y: m[1], owner: m[2], arm: m[3] }));
    decoys.length = 0; s.dc.forEach(d => decoys.push({ x: d[0], y: d[1], owner: d[2], angle: d[3], color: d[4], radius: d[5], label: d[6] }));
    meteors.length = 0; s.me.forEach(m => meteors.push({ x: m[0], y: m[1], warningTime: m[2], maxT: m[3] }));
    airdrops.length = 0; s.ad.forEach(d => airdrops.push({ x: d[0], y: d[1], t: d[2], maxT: d[3] }));
    slashes.length = 0; s.sl.forEach(l => slashes.push({ ownerId: l[0], angle: l[1], range: l[2], color: l[3], width: l[4], life: l[5], maxLife: l[6], swing: l[7] }));
    beams.length = 0; s.bm.forEach(b => beams.push({ x1: b[0], y1: b[1], x2: b[2], y2: b[3], life: b[4], maxLife: b[5], color: b[6] }));

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

function guestUpdate(dt) {
    updateFx(dt);
    // gửi phím bấm: 30 lần/giây, hoặc ngay khi nút thay đổi
    const inp = readHumanInput(2);
    const key = `${inp.a}${inp.b}${inp.c}${inp.s1}${inp.s2}`;
    net.inT += dt;
    if (net.inT >= 1 / 30 || key !== net.lastIn) {
        net.inT = 0; net.lastIn = key;
        netSend({ t: 'in', i: { move: { x: R1(inp.move.x * 10) / 10, y: R1(inp.move.y * 10) / 10 }, a: inp.a, b: inp.b, c: inp.c, s1: inp.s1, s2: inp.s2 } });
    }
    if (!['COUNTDOWN', 'PLAYING', 'KO', 'ROUND_OVER'].includes(gameState)) return;
    let sdt = fx.slowMo > 0 ? dt * 0.3 : dt;
    const me = localPlayer();
    players.forEach(p => {
        if (p.tx === undefined) return;
        if (p === me && gameState === 'PLAYING' && p.hp > 0 && !(p.stun > 0) && !(p.dashTime > 0)) {
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

/** Chọn thẻ phía khách */
function guestOpenAugments(m) {
    gameState = 'AUGMENT'; net.augPicked = false;
    currentRound = m.round || currentRound;
    clearPlayersForPick();
    showScreen('augment-screen');
    $('aug-score').textContent = `${m.score[0]} — ${m.score[1]} · HIỆP ${currentRound}`;
    augState.kind = m.kind; augState.choices[2] = m.ids; augState.picked[2] = null;
    renderPickCards(2, m.ids, m.kind, m.owned, m.minor, m.bonus, i => guestPick(i));
}
function clearPlayersForPick() { [bullets, items, slashes, beams, zones, turrets, mines, decoys].forEach(a => a.length = 0); }
function guestPick(idx) {
    if (net.augPicked || !augState.choices[2][idx]) return;
    net.augPicked = true; augState.picked[2] = augState.choices[2][idx];
    AudioSys.play('select', 0.4);
    $('p2-cards').querySelectorAll('.aug-card').forEach((c, i) => c.classList.add(i === idx ? 'selected' : 'disabled'));
    $('p2-wait').classList.remove('hidden');
    netSend({ t: 'pick', idx });
}

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
