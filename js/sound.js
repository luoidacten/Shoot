/** ==================== ÂM THANH THẬT: nhạc nền, hiệu ứng, khán giả ====================
 *  Nhạc: tricksntraps (CC0) · Hiệu ứng: Kenney (CC0), "50 CC0 Sci-fi SFX" (CC0)
 *  Khán giả: Gregor Quendel — Free Crowd Cheering Sounds (CC-BY 4.0)
 *  Thiếu file nào thì dùng lại tiếng tổng hợp cũ.
 */
const SND = { man: null, buf: {}, loading: false, lastSfx: {}, music: { key: null, cur: null }, amb: null };
fetch('assets/audio/audio.json?v=2', { cache: 'no-cache' }).then(r => r.json()).then(m => { SND.man = m; sndLoad(); }).catch(() => {});
function sndLoad() {
    if (SND.loading || !SND.man || !AudioSys.ctx) return;
    SND.loading = true;
    const jobs = [];
    for (const k in SND.man.sfx) SND.man.sfx[k].forEach(f => jobs.push([k, f]));
    for (const k in SND.man.crowd) jobs.push([k, SND.man.crowd[k]]);
    jobs.forEach(([k, f]) => fetch('assets/audio/' + f).then(r => r.arrayBuffer()).then(a => AudioSys.ctx.decodeAudioData(a))
        .then(b => { (SND.buf[k] = SND.buf[k] || []).push(b); }).catch(() => {}));
}
const _sndInit = AudioSys.init.bind(AudioSys);
AudioSys.init = function () { _sndInit(); sndLoad(); };

/* ---------- Hiệu ứng ---------- */
const SFX_GAP = { shoot: 0.035, smg: 0.04, hit: 0.045, ui: 0.03, block: 0.05, cheer_small: 1.2, cheer_big: 2.5 };
const SFX_VOL = { shoot: 0.75, smg: 0.55, shoot_heavy: 1, shotgun: 1.1, rail: 1, explosion: 1.35, slam: 1.1, hit: 0.75, crit: 1, block: 0.8, trick: 0.8,
    pickup: 0.8, legend: 0.9, select: 0.7, ui: 0.55, reload: 0.8, count: 0.7, go: 1, destiny: 0.8, confirm: 0.8, glitch: 0.6, cheer_small: 1.1, cheer_big: 1.2, cheer_win: 1.3 };
const _sndPlay = AudioSys.play;
AudioSys.play = function (t, v = 0.25, pan = 0) {
    const list = SND.buf[t], c = AudioSys.ctx;
    if (!list || !c || !AudioSys.sfxOn) return _sndPlay.call(AudioSys, t, v, pan);
    if (net.role === 'host' && !net.mute) net.events.push(['snd', [t, v]]);
    const now = c.currentTime;
    if (SFX_GAP[t] && now - (SND.lastSfx[t] || 0) < SFX_GAP[t]) return;
    SND.lastSfx[t] = now;
    const src = c.createBufferSource();
    src.buffer = list[Math.floor(Math.random() * list.length)];
    if (!t.startsWith('cheer')) src.playbackRate.value = 0.93 + Math.random() * 0.14; // đổi cao độ nhẹ cho đỡ nhàm
    const g = c.createGain(); g.gain.value = Math.min(2.2, v * 3.2 * (SFX_VOL[t] || 1));
    src.connect(g);
    let node = g;
    if (pan && c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = pan; g.connect(pn); node = pn; }
    node.connect(AudioSys.sfx);
    src.start();
};

/* ---------- Nhạc nền ----------
 *  - Ít đổi bài: menu ↔ trận. Cả trận giữ 1 bài; chỉ đổi 1 lần sang "System Overload" khi có người tới hiệp quyết định.
 *  - Màn chọn thẻ / vận mệnh / tạm dừng / K.O.: nhạc trận nhỏ lại và "đục" đi (lọc âm cao) thay vì đổi bài.
 *  - Đổi bài: hoà trộn kiểu equal-power 3 giây; bài cũ được giữ vị trí, quay lại thì phát tiếp chứ không từ đầu.
 *  - Mỗi bài có 2 đầu phát tự nối vòng lặp bằng hoà trộn 4 giây → không hụt tiếng khi lặp.
 */
const MUS = { tracks: {}, key: null, matchTrack: null, duck: null, lp: null, last: 0 };
function musBus() {
    const c = AudioSys.ctx;
    if (!MUS.duck) {
        MUS.lp = c.createBiquadFilter(); MUS.lp.type = 'lowpass'; MUS.lp.frequency.value = 20000; MUS.lp.Q.value = 0.5;
        MUS.duck = c.createGain(); MUS.duck.gain.value = 1;
        MUS.lp.connect(MUS.duck); MUS.duck.connect(AudioSys.music);
    }
    return MUS.lp;
}
function musTrack(key) {
    if (MUS.tracks[key]) return MUS.tracks[key];
    const c = AudioSys.ctx, url = 'assets/audio/' + SND.man.music[key] + '?v=2';
    const head = () => { const el = new Audio(url); el.preload = 'auto'; const g = c.createGain(); g.gain.value = 0; c.createMediaElementSource(el).connect(g); g.connect(musBus()); return { el, g }; };
    const t = (MUS.tracks[key] = { key, heads: [head(), head()], cur: 0, vol: 0, target: 0, looping: false, loopT: 0 });
    // chính file nhạc báo sắp hết bài (không phụ thuộc bộ đếm giờ) → bắt đầu nối vòng lặp
    t.heads.forEach((hd, i) => {
        hd.el.addEventListener('timeupdate', () => musLoopStart(t, i));
        hd.el.addEventListener('ended', () => { if (t.cur === i && !t.looping) { musLoopStart(t, i, true); } });
    });
    return t;
}
function musLoopStart(t, i, force) {
    const h = t.heads[i], o = t.heads[1 - i];
    if (t.cur !== i || t.looping || t.vol <= 0.001) return;
    if (!force && !(h.el.duration && h.el.currentTime > h.el.duration - 4)) return;
    t.looping = true; t.loopT = force ? 4 : 0; o.el.currentTime = 0; o.el.play().catch(() => {});
}
function musWanted() {
    const s = gameState, inMatch = players.length && ['AUGMENT', 'AUG_DONE', 'DESTINY', 'COUNTDOWN', 'PLAYING', 'KO', 'ROUND_OVER', 'GAMEOVER'].includes(s);
    if (!inMatch) { MUS.matchTrack = null; return 'menu'; }
    if (currentRound === 1 && !MUS.matchTrack && ['AUGMENT', 'AUG_DONE', 'DESTINY'].includes(s)) return 'pick'; // chọn thẻ đầu trận
    if (!MUS.matchTrack) MUS.matchTrack = Math.random() < 0.5 ? 'battle1' : 'battle2';
    if (s !== 'GAMEOVER' && players.some(p => p.score >= settings.maxWins - 1)) MUS.matchTrack = 'final';
    return MUS.matchTrack;
}
function musDuck() {
    const s = gameState;
    if (paused || s === 'GAMEOVER' || (['AUGMENT', 'AUG_DONE', 'DESTINY'].includes(s) && MUS.key !== 'pick')) return [0.5, 900];
    if (s === 'KO') return [0.65, 1400];
    if (s === 'ROUND_OVER') return [0.75, 2600];
    if (s === 'COUNTDOWN') return [0.85, 5000];
    return [1, 20000];
}
function musTick(dt) {
    const c = AudioSys.ctx; if (!c || !SND.man) return;
    const want = musWanted();
    if (want !== MUS.key && SND.man.music[want]) {
        if (MUS.key) musTrack(MUS.key).target = 0;
        musTrack(want).target = 1; MUS.key = want;
    }
    const [dg, df] = musDuck();
    musBus(); MUS.duck.gain.setTargetAtTime(dg, c.currentTime, 0.35); MUS.lp.frequency.setTargetAtTime(df, c.currentTime, 0.35);
    for (const t of Object.values(MUS.tracks)) {
        t.vol += Math.sign(t.target - t.vol) * Math.min(Math.abs(t.target - t.vol), dt / 3);
        let h = t.heads[t.cur], o = t.heads[1 - t.cur];
        if (t.vol > 0.001) {
            if (h.el.paused && !h.el.ended) h.el.play().catch(() => {});
            const d = h.el.duration;
            if (d && !t.looping && h.el.currentTime > d - 4) musLoopStart(t, t.cur);
        }
        let mix = 0;
        if (t.looping) {
            t.loopT += dt; mix = Math.min(1, t.loopT / 4);
            if (mix >= 1) { h.el.pause(); t.cur = 1 - t.cur; t.looping = false; mix = 0; h = t.heads[t.cur]; o = t.heads[1 - t.cur]; }
        }
        const L = Math.sin(Math.max(0, t.vol) * Math.PI / 2);
        h.g.gain.setTargetAtTime(L * Math.cos(mix * Math.PI / 2), c.currentTime, 0.04);
        o.g.gain.setTargetAtTime(L * Math.sin(mix * Math.PI / 2), c.currentTime, 0.04);
        if (t.vol <= 0.001 && t.target === 0) t.heads.forEach(x => { if (!x.el.paused) x.el.pause(); }); // giữ vị trí để lần sau phát tiếp
    }
}
// tắt bộ phát nhạc tổng hợp cũ khi đã có nhạc thật
const _sndStartMusic = AudioSys.startMusic.bind(AudioSys);
AudioSys.startMusic = function () { if (!SND.man) _sndStartMusic(); };
setInterval(() => {
    if (!AudioSys.ctx || !SND.man) return;
    if (AudioSys.seq && AudioSys.seq.on) AudioSys.stopMusic();
    const now = performance.now(), dt = Math.min(0.2, (now - (MUS.last || now)) / 1000); MUS.last = now;
    try { musTick(dt); } catch (e) {}
    crowdAmbience(['PLAYING', 'KO'].includes(gameState));
}, 50);

/* ---------- Khán giả: tiếng rì rầm nền trong trận ---------- */
function crowdAmbience(on) {
    const c = AudioSys.ctx, b = SND.buf.ambience; if (!c || !b) return;
    if (on && !SND.amb && AudioSys.sfxOn) {
        const src = c.createBufferSource(), g = c.createGain();
        src.buffer = b[0]; src.loop = true; g.gain.value = 0;
        src.connect(g); g.connect(AudioSys.sfx); src.start();
        g.gain.linearRampToValueAtTime(0.16, c.currentTime + 2);
        SND.amb = { src, g };
    } else if ((!on || !AudioSys.sfxOn) && SND.amb) {
        const a = SND.amb; SND.amb = null;
        a.g.gain.cancelScheduledValues(c.currentTime); a.g.gain.setValueAtTime(a.g.gain.value, c.currentTime);
        a.g.gain.linearRampToValueAtTime(0, c.currentTime + 1.2);
        setTimeout(() => { try { a.src.stop(); } catch (e) {} }, 1400);
    }
}

/* ---------- Khoảnh khắc "cháy": hò reo, chuỗi hạ gục ---------- */
const STREAK_TXT = { 2: ['HAI MẠNG!', '#fbbf24'], 3: ['BA MẠNG!', '#f97316'], 4: ['TỨ SÁT!', '#ef4444'], 5: ['HUỶ DIỆT!', '#e879f9'] };
const _sndKill = killPlayer;
killPlayer = function (dead, killerId) {
    if (dead.dead) return;
    const k = players.find(q => q.id === killerId && q !== dead);
    _sndKill(dead, killerId);
    if (net.role === 'guest') return;
    if (!k) { AudioSys.play('cheer_small', 0.2); return; }
    // bộ đếm riêng cho chuỗi hạ gục trong hiệp
    k.sndStreak = (k.sndStreakRound === currentRound ? k.sndStreak : 0) + 1; k.sndStreakRound = currentRound;
    const n = k.sndStreak;
    if (n >= 2) {
        const [txt, col] = STREAK_TXT[Math.min(5, n)];
        showBanner(txt, k.label, col, 1.5, 64); flash(col, 0.12); addShake(10);
        AudioSys.play('cheer_big', 0.32);
    } else AudioSys.play('cheer_small', 0.22);
};
const _sndFinish = finishRound;
finishRound = function () { _sndFinish(); if (net.role !== 'guest') AudioSys.play('cheer_big', 0.35); };
const _sndOver = showGameOver;
showGameOver = function () { _sndOver(); if (net.role !== 'guest') AudioSys.play('cheer_win', 0.4); };
const _sndBanner = showBanner;
showBanner = function (text, ...rest) {
    const r = _sndBanner(text, ...rest);
    if (text === 'ĐÁNH!' && net.role !== 'guest' && !net.mute) { AudioSys.play('cheer_small', 0.25); AudioSys.play('glitch', 0.2); }
    return r;
};

/* ---------- Âm mới (nhóm A/B/C): độ to & khoảng cách tối thiểu giữa 2 lần phát ---------- */
Object.assign(SFX_VOL, { whoosh: 0.55, swing: 0.7, alarm: 0.7, tick: 0.45, step: 0.3, heart: 1.1, ko: 1.1, win: 1.2, flame: 0.45, chainsaw: 0.4, bow: 0.7,
    laser: 0.8, teleport: 0.8, zap: 0.6, ground: 1, clang: 0.75, glass: 0.9, ricochet: 0.6, sniper: 1, cannon: 1.1, magic: 0.8, spell: 0.8, whip: 0.9,
    freeze: 0.8, heal: 0.75, shield: 0.8, shield_up: 0.8, throw: 0.6 });
Object.assign(SFX_GAP, { whoosh: 0.05, swing: 0.05, step: 0.06, tick: 0.05, flame: 0.09, chainsaw: 0.09, zap: 0.06, clang: 0.05, ricochet: 0.05, heart: 0.4 });
