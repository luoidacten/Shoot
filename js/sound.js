/** ==================== ÂM THANH THẬT: nhạc nền, hiệu ứng, khán giả ====================
 *  Nhạc: tricksntraps (CC0) · Hiệu ứng: Kenney (CC0), "50 CC0 Sci-fi SFX" (CC0)
 *  Khán giả: Gregor Quendel — Free Crowd Cheering Sounds (CC-BY 4.0)
 *  Thiếu file nào thì dùng lại tiếng tổng hợp cũ.
 */
const SND = { man: null, buf: {}, loading: false, lastSfx: {}, music: { key: null, cur: null }, amb: null };
fetch('assets/audio/audio.json?v=1', { cache: 'no-cache' }).then(r => r.json()).then(m => { SND.man = m; sndLoad(); }).catch(() => {});
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

/* ---------- Nhạc nền: đổi bài theo diễn biến, chuyển mượt 1.5 giây ---------- */
function musicPlay(key) {
    const c = AudioSys.ctx;
    if (!c || !SND.man || !SND.man.music[key] || SND.music.key === key) return;
    SND.music.key = key;
    const el = new Audio('assets/audio/' + SND.man.music[key] + '?v=1'); el.loop = true;
    const g = c.createGain(); g.gain.value = 0;
    try { c.createMediaElementSource(el).connect(g); } catch (e) { return; }
    g.connect(AudioSys.music);
    el.play().catch(() => {});
    g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(1, c.currentTime + 1.5);
    const old = SND.music.cur;
    if (old) {
        old.g.gain.cancelScheduledValues(c.currentTime); old.g.gain.setValueAtTime(old.g.gain.value, c.currentTime);
        old.g.gain.linearRampToValueAtTime(0, c.currentTime + 1.5);
        setTimeout(() => { old.el.pause(); old.el.removeAttribute('src'); old.el.load(); }, 1700);
    }
    SND.music.cur = { el, g };
}
function wantedMusic() {
    if (!AudioSys.musicOn) return SND.music.key;
    const s = gameState;
    if (['AUGMENT', 'AUG_DONE', 'DESTINY'].includes(s)) return 'pick';
    if (['COUNTDOWN', 'PLAYING', 'KO', 'ROUND_OVER'].includes(s)) {
        const decider = players.some(p => p.score >= settings.maxWins - 1);
        const alive = players.filter(p => p.hp > 0).length;
        if (decider || (world && world.zonePhase === 2) || (players.length > 2 && alive === 2 && s === 'PLAYING')) return 'final';
        return currentRound % 2 ? 'battle1' : 'battle2';
    }
    return 'menu';
}
// tắt bộ phát nhạc tổng hợp cũ khi đã có nhạc thật
const _sndStartMusic = AudioSys.startMusic.bind(AudioSys);
AudioSys.startMusic = function () { if (!SND.man) _sndStartMusic(); };
setInterval(() => {
    if (!AudioSys.ctx || !SND.man) return;
    if (AudioSys.seq && AudioSys.seq.on) AudioSys.stopMusic();
    const k = wantedMusic(); if (k && k !== SND.music.key) musicPlay(k);
    crowdAmbience(['PLAYING', 'KO'].includes(gameState));
}, 300);

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
