/** ==================== MC BÌNH LUẬN VIÊN · 5 BẢN ĐỒ ĐỊA HÌNH MỚI ==================== */

/* ============================== MC BÌNH LUẬN VIÊN (cầm loa) ============================== */
const MC = { voice: null, toast: null, lastSay: -9 };
function mcPickVoice() {
    try { const vs = window.speechSynthesis ? speechSynthesis.getVoices() : []; MC.voice = vs.find(v => /^vi/i.test(v.lang)) || null; } catch (e) { MC.voice = null; }
}
if (window.speechSynthesis) { mcPickVoice(); speechSynthesis.onvoiceschanged = mcPickVoice; }
function mcOn() { return settings.mc !== false; }
/** Tiếng "rè rè" của loa trước khi nói */
function mcChirp() {
    if (!AudioSys.ctx || !AudioSys.sfxOn) return;
    const t = AudioSys.ctx.currentTime;
    AudioSys.tone('sine', 1700, 2300, 0.18, 0.05, t);
    AudioSys.burst(0.08, 0.12, 2600, t + 0.02, 'bandpass');
    AudioSys.tone('square', 900, 900, 0.04, 0.05, t + 0.2);
}
/** Không có giọng tiếng Việt → nói "bíp bíp" qua loa (giống nhân vật hoạt hình) */
function mcBlips(text) {
    if (!AudioSys.ctx || !AudioSys.sfxOn) return;
    const ctxA = AudioSys.ctx, t = ctxA.currentTime + 0.25;
    const bp = ctxA.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 2.5; bp.connect(AudioSys.sfx);
    text.split(/\s+/).slice(0, 18).forEach((w, i) => AudioSys.tone('square', 260 + Math.random() * 220, 200 + Math.random() * 160, 0.07, 0.07, t + i * 0.1, bp));
}
function mcTalking(on) { const el = document.getElementById('mc'); if (el) el.classList.toggle('talking', on); }
function mcSpeak(text) {
    if (!mcOn()) return;
    mcChirp(); mcTalking(true);
    let spoke = false;
    try {
        if (window.speechSynthesis && MC.voice) {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.voice = MC.voice; u.lang = MC.voice.lang; u.rate = 1.1; u.pitch = 0.8; u.volume = 1;
            u.onend = () => mcTalking(false); u.onerror = () => mcTalking(false);
            setTimeout(() => speechSynthesis.speak(u), 220); spoke = true;
        }
    } catch (e) {}
    if (!spoke) { mcBlips(text); setTimeout(() => mcTalking(false), Math.min(4500, 600 + text.length * 45)); }
}
/** Bình luận trong trận: hiện khung "loa" trên màn hình + đọc to (đồng bộ cho máy khách) */
function mcSay(text, prio) {
    if (net.role === 'host' && !net.mute) net.events.push(['mcSay', [text, prio]]);
    const now = performance.now() / 1000;
    if (!prio && now - MC.lastSay < 2.5) return;
    MC.lastSay = now;
    MC.toast = { text, born: now };
    mcSpeak(text);
}
const pick = a => a[Math.floor(Math.random() * a.length)];
function destinyLine(d) {
    const n = currentRound, name = d.name.toLowerCase();
    return pick([
        `A lô a lô! Hiệp ${n}, vận mệnh là: ${name}! ${d.desc}`,
        `Thưa quý vị khán giả! Hiệp ${n} sẽ là... ${name}! ${d.desc}`,
        `Ối giời ơi! ${name}! ${d.desc} Chúc các đấu sĩ may mắn!`,
        `Bình luận viên xin thông báo: hiệp ${n}, ${name}. ${d.desc}`
    ]);
}
const _playDestinyRoll = playDestinyRoll;
playDestinyRoll = function (destiny, done) {
    _playDestinyRoll(destiny, done);
    mcTalking(false);
    setTimeout(() => { if (gameState === 'DESTINY') mcSpeak(destinyLine(destiny)); }, 1500);
};
// Bình luận khi hạ gục / hết hiệp (chạy ở máy chủ)
const _killPlayerMC = killPlayer;
killPlayer = function (dead, killerId) {
    if (dead.dead) return;
    const firstBlood = players.every(p => p.hp > 0 || p === dead);
    _killPlayerMC(dead, killerId);
    if (net.role === 'guest') return;
    const k = players.find(q => q.id === killerId && q !== dead);
    if (!k) { if (gameState === 'PLAYING') mcSay(pick([`${dead.label} tự làm khổ mình rồi!`, `Ôi, ${dead.label} gục ngã một cách lãng xẹt!`])); return; }
    k.roundKills = (k.roundKills || 0) + 1;
    const alive = players.filter(p => p.hp > 0).length;
    if (alive <= 1) return; // để bình luận hết hiệp lo
    if (k.roundKills >= 3) mcSay(pick([`Không ai cản nổi ${k.label}! Ba mạng rồi!`, `${k.label} đang hủy diệt cả đấu trường!`]), true);
    else if (k.roundKills === 2) mcSay(pick([`${k.label} hai mạng liên tiếp! Hăng máu quá!`, `Lại là ${k.label}! Cú đúp!`]), true);
    else if (firstBlood) mcSay(pick([`Máu đầu tiên! ${k.label} hạ gục ${dead.label}!`, `${k.label} mở tỉ số, ${dead.label} phải ra chuồng gà!`]), true);
    else mcSay(pick([`${k.label} tiễn ${dead.label} về nước!`, `${dead.label} đã bị loại! Còn ${alive} người!`]));
};
const _finishRoundMC = finishRound;
finishRound = function () {
    _finishRoundMC();
    players.forEach(p => p.roundKills = 0);
    const alive = players.filter(p => p.hp > 0);
    if (!alive.length) { mcSay('Hòa! Không còn ai đứng vững!', true); return; }
    const w = alive[0], top = Math.max(...players.map(p => p.score));
    if (top >= settings.maxWins) mcSay(`Và nhà vô địch là... ${players.find(p => p.score === top).label}! Một trận đấu tuyệt vời!`, true);
    else if (w.hp < w.maxHp * 0.15) mcSay(`${w.label} thắng trong gang tấc, chỉ còn ${Math.ceil(w.hp)} máu! Tim tôi muốn rớt ra ngoài!`, true);
    else if (w.score === settings.maxWins - 1) mcSay(`${w.label} thắng hiệp! Chỉ còn một hiệp nữa là vô địch!`, true);
    else mcSay(pick([`${w.label} thắng hiệp ${currentRound}!`, `Hiệp ${currentRound} thuộc về ${w.label}!`]), true);
};
/** Khung lời bình trên màn hình */
const _drawHUDmc = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUDmc(W, H, now);
    const t = MC.toast; if (!t) return;
    const age = performance.now() / 1000 - t.born; if (age > 3.6) { MC.toast = null; return; }
    const a = Math.min(1, age * 5, (3.6 - age) * 2.5);
    ctx.save(); ctx.globalAlpha = a; ctx.font = `700 13px ${FONT}`;
    const tw = Math.min(W - 40, ctx.measureText(t.text).width + 60), x = W / 2 - tw / 2, y = 92;
    rrect(ctx, x, y, tw, 28, 14); ctx.fillStyle = 'rgba(30,12,60,0.85)'; ctx.fill();
    ctx.strokeStyle = 'rgba(192,132,252,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
    drawMiniOrb(x + 16, y + 14, 11, now);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = `rgba(192,132,252,${0.5 + Math.sin(now * 12) * 0.4})`; ctx.lineWidth = 1.5;
    for (let i = 1; i <= 2; i++) { ctx.beginPath(); ctx.arc(x + 16, y + 14, 11 + i * 4, -0.5, 0.5); ctx.stroke(); }
    ctx.font = `700 13px ${FONT}`; ctx.fillStyle = '#f5f3ff';
    let s = t.text; while (ctx.measureText(s).width > tw - 56 && s.length > 4) s = s.slice(0, -2);
    ctx.fillText(s === t.text ? s : s + '…', x + 40, y + 15);
    ctx.restore();
};

/* ============================== 5 BẢN ĐỒ ĐỊA HÌNH MỚI ============================== */
THEMES.push(
    { floor: '#08131a', grid: 'rgba(90,180,220,0.07)', accent: '#1e4f6a' },   // 4 Đảo Sông
    { floor: '#121214', grid: 'rgba(200,200,210,0.06)', accent: '#4a4a55' },  // 5 Thành Cổ
    { floor: '#14100b', grid: 'rgba(220,170,110,0.06)', accent: '#5a3f22' },  // 6 Nhà Kho
    { floor: '#1c150a', grid: 'rgba(240,200,120,0.07)', accent: '#7a5a2a' },  // 7 Sa Mạc
    { floor: '#0b1420', grid: 'rgba(180,220,255,0.08)', accent: '#3a6a8a' }   // 8 Băng Nguyên
);
Object.assign(MAP_NAMES, { river: 'ĐẢO SÔNG', fortress: 'THÀNH CỔ', warehouse: 'NHÀ KHO', desert: 'SA MẠC', glacier: 'BĂNG NGUYÊN' });
const ALL_MAPS = ['arena', 'maze', 'inferno', 'jungle', 'river', 'fortress', 'warehouse', 'desert', 'glacier'];
function pickMapType() {
    if (currentRound === 1) return 'arena';
    const list = ALL_MAPS.filter(t => t !== world.lastMap);
    return list[Math.floor(Math.random() * list.length)];
}
function spawnPts() {
    const n = Math.max(2, players.length), out = [];
    for (let i = 0; i < n; i++) { const a = Math.PI + i * Math.PI * 2 / n + (n === 4 ? Math.PI / 4 : 0); out.push({ x: MAP_W / 2 + Math.cos(a) * (n > 2 ? 470 : 340), y: MAP_H / 2 + Math.sin(a) * (n > 2 ? 360 : 0) }); }
    return out;
}
const mWall = (x, y, w, h, extra) => ({ x, y, w, h, wood: false, ...extra });
const mBox = (x, y, s) => ({ x, y, w: s, h: s, wood: true, hp: 90, maxHp: 90, hit: 0 });
function mapFree(o, pad = 90) {
    const sp = spawnPts();
    if (sp.some(s => s.x > o.x - pad && s.x < o.x + o.w + pad && s.y > o.y - pad && s.y < o.y + o.h + pad)) return false;
    return !obstacles.some(b => o.x < b.x + b.w + 30 && o.x + o.w > b.x - 30 && o.y < b.y + b.h + 30 && o.y + o.h > b.y - 30);
}
function addSym(o, check = true) {
    if (check && !mapFree(o)) return false;
    const m = { ...o, x: MAP_W - o.x - o.w, y: MAP_H - o.y - o.h };
    if (check && !mapFree(m)) return false;
    obstacles.push(o, m); return true;
}
function groundPair(type, x, y, r) {
    zones.push({ type, x, y, r, t: Infinity, maxT: Infinity, tick: 0 }, { type, x: MAP_W - x, y: MAP_H - y, r, t: Infinity, maxT: Infinity, tick: 0 });
}
function scatterCover(n, woodChance = 0.4) {
    let placed = 0, tries = 0;
    while (placed < n && tries++ < 300) {
        const wood = Math.random() < woodChance;
        let w, h;
        if (wood) w = h = 46 + Math.random() * 24; else if (Math.random() < 0.5) { w = 110 + Math.random() * 120; h = 30; } else { w = 30; h = 110 + Math.random() * 120; }
        const o = wood ? mBox(80 + Math.random() * (MAP_W / 2 - 140), 80 + Math.random() * (MAP_H - 200), w) : mWall(80 + Math.random() * (MAP_W / 2 - 120 - w), 80 + Math.random() * (MAP_H - 160 - h), w, h);
        if (addSym(o)) placed++;
    }
}
const NEW_MAPS = {
    /** Đảo Sông: dòng sông uốn lượn cắt ngang (lội nước chậm 30%), 2 khúc cạn để băng qua */
    river() {
        world.theme = 4;
        const cy = MAP_H / 2, fords = [MAP_W * 0.28, MAP_W * 0.72];
        for (let x = -40; x <= MAP_W + 40; x += 50) {
            if (fords.some(f => Math.abs(x - f) < 90)) continue;
            zones.push({ type: 'water', x, y: cy + Math.sin(x / MAP_W * Math.PI * 2) * 150, r: 78, t: Infinity, maxT: Infinity, tick: 0 });
        }
        scatterCover(10, 0.35);
        addBushes(spawnPts(), 4);
    },
    /** Thành Cổ: thành vuông giữa map, 4 cổng, tháp ở 4 góc */
    fortress() {
        world.theme = 5;
        const cx = MAP_W / 2, cy = MAP_H / 2, R = 290, T = 28, G = 100, half = (2 * R - G) / 2;
        obstacles.push(
            mWall(cx - R, cy - R, half, T), mWall(cx + G / 2, cy - R, half, T),
            mWall(cx - R, cy + R - T, half, T), mWall(cx + G / 2, cy + R - T, half, T),
            mWall(cx - R, cy - R, T, half), mWall(cx - R, cy + G / 2, T, half),
            mWall(cx + R - T, cy - R, T, half), mWall(cx + R - T, cy + G / 2, T, half),
            mWall(cx - R - 30, cy - R - 30, 70, 70), mWall(cx + R - 40, cy - R - 30, 70, 70),
            mWall(cx - R - 30, cy + R - 40, 70, 70), mWall(cx + R - 40, cy + R - 40, 70, 70),
            mWall(cx - 40, cy - 40, 80, 80)
        );
        [[cx - 150, cy - 150], [cx + 100, cy + 100]].forEach(([x, y]) => obstacles.push(mBox(x, y, 50)));
        scatterCover(8, 0.5);
        addBushes(spawnPts(), 3);
    },
    /** Nhà Kho: dãy kệ hàng song song + chồng thùng gỗ phá được */
    warehouse() {
        world.theme = 6;
        for (let x = 170; x < MAP_W / 2 - 80; x += 210) for (let y = 130; y < MAP_H - 260; y += 270) {
            if (Math.random() < 0.8) addSym(mWall(x, y, 28, 170));
            if (Math.random() < 0.6) addSym(mBox(x + 60, y + 50 + Math.random() * 60, 48 + Math.random() * 14));
            if (Math.random() < 0.35) addSym(mBox(x + 120, y + 20 + Math.random() * 100, 46));
        }
    },
    /** Sa Mạc: khối đá lớn rải rác, hố cát lún (chậm 50%) */
    desert() {
        world.theme = 7;
        let n = 0, tries = 0;
        while (n < 6 && tries++ < 200) {
            const x = 120 + Math.random() * (MAP_W / 2 - 300), y = 120 + Math.random() * (MAP_H - 360), w = 70 + Math.random() * 90, h = 60 + Math.random() * 90;
            if (addSym(mWall(x, y, w, h))) { addSym(mWall(x + w * 0.4, y + h, w * 0.6, 40), true); n++; }
        }
        let s = 0; tries = 0;
        while (s < 4 && tries++ < 200) {
            const r = 70 + Math.random() * 50, x = 140 + Math.random() * (MAP_W / 2 - 240), y = 140 + Math.random() * (MAP_H - 280);
            if (spawnPts().some(p => dist(p.x, p.y, x, y) < r + 80) || obstacles.some(o => x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h)) continue;
            groundPair('sand', x, y, r); s++;
        }
        scatterCover(4, 0.6);
    },
    /** Băng Nguyên: mặt băng trơn trượt + tường băng không phá được */
    glacier() {
        world.theme = 8;
        let n = 0, tries = 0;
        while (n < 5 && tries++ < 200) {
            const r = 110 + Math.random() * 80, x = 160 + Math.random() * (MAP_W / 2 - 260), y = 160 + Math.random() * (MAP_H - 320);
            if (zones.some(z => dist(z.x, z.y, x, y) < z.r + r)) continue;
            groundPair('icefloor', x, y, r); n++;
        }
        let w = 0; tries = 0;
        while (w < 7 && tries++ < 300) {
            const horiz = Math.random() < 0.5, L = 120 + Math.random() * 140;
            const o = mWall(80 + Math.random() * (MAP_W / 2 - 200), 80 + Math.random() * (MAP_H - 260), horiz ? L : 30, horiz ? 30 : L, { ice: true });
            if (addSym(o)) w++;
        }
        scatterCover(3, 0.5);
    }
};
const _generateMap = generateMap;
generateMap = function (type = 'arena') {
    if (!NEW_MAPS[type]) { _generateMap(type); if (world.theme >= 4 && !['maze', 'inferno', 'jungle'].includes(type)) world.theme %= 4; return; }
    world.mapType = type; world.lastMap = type;
    NEW_MAPS[type]();
};
/** Hiệu ứng mặt đất: nước (chậm, dập lửa), cát lún (chậm), băng (trơn) */
function updateTerrain() {
    players.forEach(p => {
        p.wading = false; p.onIce = false;
        if (p.hp <= 0 || p.air > 0) return;
        for (const z of zones) {
            if (z.type !== 'water' && z.type !== 'sand' && z.type !== 'icefloor') continue;
            if (dist(p.x, p.y, z.x, z.y) > z.r) continue;
            if (z.type === 'water') { p.wading = true; if (p.st.burn > 0) p.st.burn = 0; }
            else if (z.type === 'sand') p.st.slow = Math.max(p.st.slow, 0.1);
            else p.onIce = true;
        }
    });
}
const _upeMaps = updatePartyExtras;
updatePartyExtras = function (dt) { _upeMaps(dt); updateTerrain(); };
/** Vẽ nước / cát / băng (dưới chân người chơi) */
const _drawNetZonesMaps = drawNetZones;
drawNetZones = function (now) {
    const groups = { water: [], sand: [], icefloor: [] };
    zones.forEach(z => { if (groups[z.type]) groups[z.type].push(z); });
    const blob = (list, fill, edge) => {
        if (!list.length) return;
        ctx.beginPath(); list.forEach(z => { ctx.moveTo(z.x + z.r, z.y); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); });
        if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 8; ctx.stroke(); }
        ctx.fillStyle = fill; ctx.fill();
    };
    blob(groups.water, 'rgba(14,90,140,0.75)', 'rgba(125,211,252,0.25)');
    groups.water.forEach((z, i) => { ctx.strokeStyle = `rgba(186,230,253,${0.12 + 0.1 * Math.sin(now * 2 + i)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (0.4 + 0.15 * Math.sin(now * 1.5 + i)), 0.3, 2.2); ctx.stroke(); });
    blob(groups.sand, 'rgba(180,140,70,0.55)', 'rgba(120,85,35,0.6)');
    groups.sand.forEach(z => { ctx.strokeStyle = 'rgba(90,60,20,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.5, now * 1.2, now * 1.2 + 4); ctx.stroke(); ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.25, -now * 2, -now * 2 + 4); ctx.stroke(); });
    blob(groups.icefloor, 'rgba(186,230,253,0.28)', 'rgba(224,242,254,0.45)');
    groups.icefloor.forEach(z => { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(z.x - z.r * 0.5, z.y - z.r * 0.2); ctx.lineTo(z.x + z.r * 0.1, z.y + z.r * 0.3); ctx.lineTo(z.x + z.r * 0.5, z.y - z.r * 0.1); ctx.stroke(); });
    _drawNetZonesMaps(now);
};

/** Quả cầu loa có con mắt (bản nhỏ vẽ trên màn hình trận) */
function drawMiniOrb(x, y, r, now) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 1, x, y, r);
    g.addColorStop(0, '#f5f3ff'); g.addColorStop(0.35, '#8b5cf6'); g.addColorStop(1, '#2e1065');
    ctx.save(); ctx.shadowColor = '#8b5cf6'; ctx.shadowBlur = 10;
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const blink = (now % 4) < 0.12 ? 0.15 : 1;
    ctx.fillStyle = '#eef2ff'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.62, r * 0.36 * blink, 0, 0, Math.PI * 2); ctx.fill();
    const lx = Math.sin(now * 1.3) * r * 0.2;
    ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(x + lx, y, r * 0.26 * blink, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#05010f'; ctx.beginPath(); ctx.arc(x + lx, y, r * 0.12 * blink, 0, Math.PI * 2); ctx.fill();
}
$('mc-btn').addEventListener('click', () => {
    settings.mc = !mcOn(); saveSettings();
    if (!settings.mc && window.speechSynthesis) speechSynthesis.cancel();
    $('mc-btn').textContent = `📢 BÌNH LUẬN VIÊN: ${mcOn() ? 'BẬT' : 'TẮT'}`;
});
$('mc-btn').textContent = `📢 BÌNH LUẬN VIÊN: ${mcOn() ? 'BẬT' : 'TẮT'}`;
