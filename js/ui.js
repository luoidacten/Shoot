/** ==================== GIAO DIỆN DOM: menu, vận mệnh, chọn lõi, tạm dừng, tổng kết ==================== */
const $ = id => document.getElementById(id);
const settings = { mode: 'pvp', diff: 1, maxWins: 4, fow: true }; // BO7: ai thắng 4 hiệp trước

function refreshMenuGroups() {
    $('diff-group').classList.toggle('disabled', settings.mode !== 'bot');
    $('fow-group').classList.toggle('disabled', settings.mode !== 'bot');
    $('start-btn').textContent = settings.mode === 'online' ? 'VÀO SẢNH' : 'VÀO TRẬN';
}
function optValue(opt) { return String(opt === 'mode' ? settings.mode : opt === 'diff' ? settings.diff : opt === 'fow' ? (settings.fow ? 1 : 0) : settings.maxWins); }

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
            setTimeout(tick, delay);
        } else {
            names.forEach(n => { n.textContent = destiny.name; n.classList.remove('rolling'); void n.offsetWidth; n.classList.add('landed'); });
            AudioSys.play('slam', 0.35);
            setTimeout(() => descs.forEach(d => d.classList.add('show')), 250);
            setTimeout(() => { showScreen(null); done(); }, 2600);
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

/** Vẽ các lá bài của một người chơi (dùng chung cho chủ phòng & máy khách online) */
function renderPickCards(pid, ids, kind, owned, minor, bonus, onPick) {
    const title = kind === 'build' ? 'CHỌN ĐỊNH HÌNH' : 'NÂNG CẤP CHỈ SỐ';
    const who = settings.mode === 'online' ? (pid === net.myId ? 'BẠN' : 'ĐỊCH') : (players[pid - 1] && players[pid - 1].isBot ? '🤖 BOT' : 'P' + pid);
    const hint = pid === 1 ? 'F / G / H / 4' : "K / L / ; / '";
    document.querySelector(`.p${pid}-side .aug-title`).innerHTML = `${who} · ${title} <span class="aug-hint">${hint}</span>`;
    $(`p${pid}-bonus`).classList.toggle('hidden', !bonus);
    $(`p${pid}-wait`).classList.add('hidden');
    $(`p${pid}-owned`).innerHTML = ownedRowHTML(owned, minor);
    const box = $(`p${pid}-cards`); box.innerHTML = '';
    const keys = (settings.mode !== 'pvp') ? ['F·K', 'G·L', 'H·;', "4·'"] : pid === 1 ? ['F', 'G', 'H', '4'] : ['K', 'L', ';', "'"];
    ids.forEach((id, i) => {
        const d = document.createElement('div');
        d.className = 'aug-card ' + cardClass(id, kind, owned);
        d.innerHTML = cardHTML(id, kind, owned, keys[i]);
        d.addEventListener('click', () => onPick(i));
        box.appendChild(d);
    });
}

function openAugmentScreen() {
    gameState = 'AUGMENT';
    showScreen('augment-screen');
    const kind = isBuildRound(currentRound) ? 'build' : 'stat';
    $('augment-screen').classList.toggle('solo', settings.mode === 'bot');
    augState.kind = kind;
    $('aug-score').textContent = `${players[0].score} — ${players[1].score} · HIỆP ${currentRound}`;
    augState.picked = { 1: null, 2: null };
    players.forEach(p => {
        p.roundPerks = [];
        const bonus = p.score < enemyOf(p).score; // lội ngược dòng: thêm 1 lá
        augState.choices[p.id] = cardsForPick(p, kind, bonus ? 4 : 3);
        p.pickBonus = bonus;
        renderPickCards(p.id, augState.choices[p.id], kind, p.build, p.minor, bonus, i => pickAugmentByIndex(p.id, i));
    });
    if (settings.mode === 'online') {
        const g = players[1];
        netSend({ t: 'aug', kind, ids: augState.choices[2], score: [players[0].score, g.score], bonus: g.pickBonus, owned: g.build, minor: g.minor, round: currentRound });
    }
    players.forEach(p => {
        if (p.isBot) setTimeout(() => pickAugmentByIndex(p.id, botPickCard(p, augState.choices[p.id], kind), true), 900 + Math.random() * 1200);
    });
}

function pickAugmentByIndex(pid, idx, fromBot) {
    if (gameState !== 'AUGMENT' || augState.picked[pid]) return;
    const p = players[pid - 1];
    if (p.isBot && !fromBot) return;
    if (settings.mode === 'online' && pid === 2 && !fromBot) return; // P2 chọn từ máy khách
    const id = augState.choices[pid][idx]; if (!id) return;
    augState.picked[pid] = id;
    AudioSys.play('select', 0.4);
    $(`p${pid}-cards`).querySelectorAll('.aug-card').forEach((c, i) => c.classList.add(i === idx ? 'selected' : 'disabled'));
    $(`p${pid}-wait`).classList.remove('hidden');
    if (augState.picked[1] && augState.picked[2]) {
        gameState = 'AUG_DONE';
        setTimeout(() => {
            players.forEach(q => {
                const pick = augState.picked[q.id];
                if (augState.kind === 'build') {
                    const newCombos = (COMBOS_OF[pick] || []).filter(c => q.build.includes(c.a === pick ? c.b : c.a));
                    q.build.push(pick);
                    q.newCombos = newCombos.map(c => c.name);
                } else if (STAT_BY_ID[pick].round) q.roundPerks.push(pick);
                else q.minor.push(pick);
            });
            startDestinyIntro();
        }, 1000);
    }
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
function showGameOver() {
    gameState = 'GAMEOVER';
    AudioSys.stopMusic(); AudioSys.play('win', 0.4);
    const [p1, p2] = players, w = p1.score > p2.score ? p1 : p2;
    $('go-title').textContent = `${w.label} VÔ ĐỊCH!`;
    $('go-title').style.color = w.color;
    $('go-score').textContent = `${p1.score} — ${p2.score}`;
    const acc = p => p.stats.shots ? Math.round(100 * p.stats.hits / p.stats.shots) + '%' : '—';
    const rows = [
        ['Sát thương gây ra', p => Math.round(p.stats.dmg)],
        ['Độ chính xác', acc],
        ['Hòm thính đã mở', p => p.stats.crates],
        ['Phát bắn / đòn đánh', p => p.stats.shots],
        ['Bộ kỹ năng', p => p.build.map(id => CARDS[id].icon).join('') || '—'],
        ['Phối hợp', p => COMBOS.filter(c => p.build.includes(c.a) && p.build.includes(c.b)).length]
    ];
    $('go-stats').innerHTML = `<tr><td class="c1">${p1.label}</td><td></td><td class="c2">${p2.label}</td></tr>` + rows.map(([n, f]) => {
        const a = f(p1), b = f(p2), na = parseFloat(a), nb = parseFloat(b);
        const ba = !isNaN(na) && !isNaN(nb) && na > nb ? 'best' : '', bb = !isNaN(na) && !isNaN(nb) && nb > na ? 'best' : '';
        return `<tr><td class="${ba}">${a}</td><td>${n}</td><td class="${bb}">${b}</td></tr>`;
    }).join('');
    if (net.role === 'host') { netSend(buildSnapshot()); netSend({ t: 'over' }); }
    const guest = net.role === 'guest';
    $('rematch-btn').disabled = guest;
    $('rematch-btn').textContent = guest ? 'CHỜ CHỦ PHÒNG…' : 'TÁI ĐẤU';
    showScreen('gameover-screen');
}
$('rematch-btn').addEventListener('click', () => startMatch());
$('menu-btn').addEventListener('click', () => goMenu());
$('start-btn').addEventListener('click', () => {
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
