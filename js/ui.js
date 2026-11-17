/** ==================== GIAO DIỆN DOM: menu, vận mệnh, chọn lõi, tạm dừng, tổng kết ==================== */
const $ = id => document.getElementById(id);
const settings = { mode: 'bot', diff: 1, maxWins: 4, fow: true, count: 4 }; // BO7: ai thắng 4 hiệp trước

function refreshMenuGroups() {
    $('diff-group').classList.remove('disabled');
    $('fow-group').classList.toggle('disabled', settings.mode !== 'bot');
    $('start-btn').textContent = settings.mode === 'online' ? 'VÀO SẢNH' : 'VÀO TRẬN';
}
function optValue(opt) { return String(opt === 'mode' ? settings.mode : opt === 'diff' ? settings.diff : opt === 'fow' ? (settings.fow ? 1 : 0) : opt === 'count' ? settings.count : settings.maxWins); }

// --- Tuỳ chọn menu ---
document.querySelectorAll('.seg').forEach(seg => {
    seg.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        seg.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
        const opt = seg.dataset.opt, v = b.dataset.val;
        if (opt === 'mode') settings.mode = v;
        if (opt === 'diff') settings.diff = +v;
        if (opt === 'bo') settings.maxWins = +v;
        if (opt === 'fow') settings.fow = v === '1';
        if (opt === 'count') settings.count = +v;
        refreshMenuGroups();
        AudioSys.init(); AudioSys.play('ui');
    });
});
try {
    const saved = JSON.parse(localStorage.getItem('dtkn-settings') || 'null');
    if (saved) Object.assign(settings, saved);
    settings.maxWins = 4;
} catch (e) {}
document.querySelectorAll('.seg').forEach(seg => seg.querySelectorAll('button').forEach(x => x.classList.toggle('active', x.dataset.val === optValue(seg.dataset.opt))));
refreshMenuGroups();
function saveSettings() { try { localStorage.setItem('dtkn-settings', JSON.stringify(settings)); } catch (e) {} }

function showScreen(id) {
    ['menu-screen', 'online-screen', 'destiny-screen', 'augment-screen', 'pause-screen', 'gameover-screen'].forEach(s => $(s).classList.toggle('hidden', s !== id));
    $('pause-btn').classList.toggle('hidden', id !== null || settings.mode === 'online');
}

// --- Vận mệnh: quay số kiểu máy đánh bạc ---
function playDestinyRoll(destiny, done) {
    showScreen('destiny-screen');
    const names = document.querySelectorAll('.d-name'), descs = document.querySelectorAll('.d-desc');
    document.querySelectorAll('.d-round').forEach(e => e.textContent = currentRound);
    descs.forEach(d => { d.classList.remove('show'); d.textContent = destiny.desc; });
    names.forEach(n => { n.classList.remove('landed'); n.classList.add('rolling'); });
    AudioSys.play('destiny', 0.25);
    let delay = 45, elapsed = 0;
    const tick = () => {
        if (elapsed < 1500) {
            const fake = DESTINIES[Math.floor(Math.random() * DESTINIES.length)].name;
            names.forEach(n => n.textContent = fake);
            AudioSys.play('tick', 0.15);
            elapsed += delay; delay *= 1.12;
            if (gameState === 'DESTINY') setTimeout(tick, delay);
        } else {
            names.forEach(n => { n.textContent = destiny.name; n.classList.remove('rolling'); void n.offsetWidth; n.classList.add('landed'); });
            AudioSys.play('slam', 0.35);
            setTimeout(() => descs.forEach(d => d.classList.add('show')), 250);
            setTimeout(() => { if (gameState !== 'DESTINY') return; showScreen(null); done(); }, 2600);
        }
    };
    tick();
}

// --- Chọn thẻ trước mỗi hiệp: hiệp lẻ = định hình (S/P), hiệp chẵn = chỉ số ---
const augState = { choices: { 1: [], 2: [] }, picked: { 1: null, 2: null }, kind: 'build' };

function ownedRowHTML(build, minor) {
    const b = (build || []).map(id => `<span class="own ${CARDS[id].kind}">${CARDS[id].icon}</span>`).join('');
    const combos = COMBOS.filter(c => (build || []).includes(c.a) && (build || []).includes(c.b)).map(c => `<span class="own-combo">⚡${c.name}</span>`).join('');
    const m = (minor || []).map(id => STAT_BY_ID[id].icon).join('');
    return b + (m ? ` <span class="own-minor">${m}</span>` : '') + (combos ? `<div class="own-combos">${combos}</div>` : '');
}




// --- Tạm dừng ---
let paused = false;
function togglePause(force) {
    if (settings.mode === 'online') return; // online không tạm dừng được
    const can = ['PLAYING', 'COUNTDOWN', 'KO'].includes(gameState);
    if (!can && !paused) return;
    paused = force !== undefined ? force : !paused;
    $('pause-screen').classList.toggle('hidden', !paused);
    $('pause-btn').classList.toggle('hidden', paused);
    AudioSys.play('ui');
}
$('pause-btn').addEventListener('click', () => togglePause(true));
$('resume-btn').addEventListener('click', () => togglePause(false));
$('sfx-btn').addEventListener('click', () => { AudioSys.setSfx(!AudioSys.sfxOn); $('sfx-btn').textContent = `🔊 ÂM THANH: ${AudioSys.sfxOn ? 'BẬT' : 'TẮT'}`; });
$('music-btn').addEventListener('click', () => { AudioSys.setMusic(!AudioSys.musicOn); $('music-btn').textContent = `🎵 NHẠC: ${AudioSys.musicOn ? 'BẬT' : 'TẮT'}`; });
$('quit-btn').addEventListener('click', () => { paused = false; goMenu(); });

// --- Tổng kết trận ---
$('rematch-btn').addEventListener('click', () => startMatch());
$('menu-btn').addEventListener('click', () => goMenu());
$('start-btn').addEventListener('click', () => {
    if (isTouch) goFullscreen();
    if (settings.mode === 'online') { AudioSys.init(); AudioSys.play('ui'); saveSettings(); showScreen('online-screen'); if (!net.peer) setNetStatus(''); }
    else startMatch();
});

function goMenu() {
    if (net.role) netLeave();
    gameState = 'MENU';
    AudioSys.stopMusic();
    showScreen('menu-screen');
    $('pause-btn').classList.add('hidden');
}
