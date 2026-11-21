/** ==================== SANDBOX · LUYỆN TẬP ====================
 *  Chọn bất kỳ vũ khí / thẻ / phép / lợi thế; thả hình nộm hoặc bot; bật tắt hồi chiêu, bất tử, đạn, sương mù,
 *  đổi thời tiết, bản đồ; đo sát thương (DPS). Không có vòng bo, không hết hiệp, chết thì hồi sinh. Nạp sau weapons2.js.
 */
const SB = {
    on: false, noCd: true, god: false, ammo: true, fow: false, dHp: 500, dMode: 'still', dWep: 'NONE', slot: 0,
    map: 'arena', weather: 'clear', tab: 'wep', q: '', kind: 'all', hits: [], total: 0, last: 0, lastName: '', panel: true
};
const SB_MAX = 8;

/* ============================== VÀO / THOÁT ============================== */
function startSandbox() {
    AudioSys.init(); paused = false;
    SB.prevMode = settings.mode; SB.prevFow = settings.fow;
    settings.mode = 'bot'; settings.fow = SB.fow;
    document.body.classList.remove('pvp');
    if (isTouch) goFullscreen();
    if (isTouch) SB.panel = false;
    SB.on = true; SB.hits = []; SB.total = 0; SB.last = 0;
    players.length = 0;
    const me = createPlayer(1, 'human'); me.adv = null; me.spells = []; players.push(me);
    currentRound = 1; pickCount = 0; killFeed.length = 0;
    if (typeof matchPreDone !== 'undefined') matchPreDone = true;
    currentDestiny = DESTINIES[0];
    AudioSys.startMusic(); AudioSys.setIntensity(0);
    sbRestart(true);
    for (let i = 0; i < 2; i++) sbAddDummy(false);
    sbPanel(true);
}
function sbRestart(first) {
    const me = players[0], keep = sbLoadout(me);
    const others = players.slice(1).map(p => ({ id: p.id, dummy: p.dummy, wep: p.sbWep }));
    initRound();
    countdown = first ? 0.6 : 0.2;
    world.weather = { id: SB.weather, windA: Math.random() * Math.PI * 2, seq: (world.weather ? world.weather.seq || 0 : 0) + 1, boltT: 4 };
    if (!first) sbRestore(me, keep);
    players.slice(1).forEach(p => sbPlaceDummy(p));
    sbFixZone();
}
function sbLoadout(p) { return { inv: (p.inventory || []).map(w => w.id), idx: p.weaponIdx || 0, form: (p.inventory || []).map(w => w.form) }; }
function sbRestore(p, L) {
    if (!L) return;
    p.inventory = L.inv.map((id, i) => { const w = makeWeapon(id, p); if (L.form[i] !== undefined) w.form = L.form[i]; return w; });
    p.weaponIdx = Math.min(L.idx, p.inventory.length - 1);
}
/** áp lại thẻ / lợi thế mà giữ nguyên vị trí & vũ khí */
function sbRebuild(p) {
    const x = p.x, y = p.y, a = p.angle, L = sbLoadout(p);
    resetPlayerForRound(p);
    p.x = x; p.y = y; p.angle = a; sbRestore(p, L);
    (p.spells || []).forEach(s => s.cd = 0);
}
function sbFixZone() { world.zoneDelay = world.time + 9999; if (!world.zone) return; Object.assign(world.zone, { r: 99999, startR: 99999, endR: 99999, x: MAP_W / 2, y: MAP_H / 2, sx: MAP_W / 2, sy: MAP_H / 2, tx: MAP_W / 2, ty: MAP_H / 2 }); }
function sbExit() {
    if (!SB.on) return;
    SB.on = false; sbPanel(false);
    if (SB.prevMode) settings.mode = SB.prevMode; settings.fow = SB.prevFow !== undefined ? SB.prevFow : settings.fow;
}
const _goMenuSB = goMenu;
goMenu = function () { sbExit(); return _goMenuSB(); };
const _startMatchSB = startMatch;
startMatch = function () { if (SB.on) { sbExit(); } return _startMatchSB(); };
const _pickMapSB = pickMapType;
pickMapType = function () { return SB.on ? SB.map : _pickMapSB(); };

/* ============================== HÌNH NỘM & BOT ============================== */
function sbAddDummy(fight) {
    if (players.length >= SB_MAX) { floatText(players[0].x, players[0].y - 40, `Tối đa ${SB_MAX} người`, '#94a3b8', 13); return; }
    let id = 2; while (players.some(q => q.id === id)) id++;
    const p = createPlayer(id, 'bot');
    p.dummy = !fight; p.label = fight ? 'BOT ' + id : 'HÌNH NỘM'; p.adv = null; p.spells = [];
    if (fight) { const pool = Object.keys(BASE_WEIGHTS).filter(k => WEAPONS[k] && WEAPONS[k].type !== 'THROWABLE'); p.sbWep = pool[Math.floor(Math.random() * pool.length)]; }
    else p.sbWep = SB.dWep;
    players.push(p);
    resetPlayerForRound(p);
    sbPlaceDummy(p, true);
    AudioSys.play('ui');
    sbRenderSoon();
}
function sbPlaceDummy(p, near) {
    const me = players[0], n = players.indexOf(p);
    if (p.dummy) { p.maxHp = SB.dHp; p.hp = p.maxHp; p.ghostHp = p.hp; }
    if (p.sbWep && p.sbWep !== 'NONE') { p.inventory = [makeWeapon(p.sbWep, p), { ...WEAPONS.NONE }]; p.weaponIdx = 0; }
    else if (p.dummy) { p.inventory = [{ ...WEAPONS.NONE }, { ...WEAPONS.NONE }]; p.weaponIdx = 0; }
    if (!me) return;
    for (let k = 0; k < 24; k++) {
        const a = (n - 1) * 0.9 - 0.9 + k * 0.5, d = 230 + (k % 3) * 60;
        const x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d;
        if (x > 60 && y > 60 && x < MAP_W - 60 && y < MAP_H - 60 && !pointInObstacle(x, y, p.radius + 6)) { p.x = x; p.y = y; break; }
    }
    p.home = { x: p.x, y: p.y }; p.angle = Math.atan2(me.y - p.y, me.x - p.x);
    p.spawnShield = 0;
}
function sbClearDummies() { players.splice(1); sbRenderSoon(); }
const _botThinkSB = botThink;
botThink = function (p, dt) {
    if (SB.on && p.dummy) {
        const idle = { move: { x: 0, y: 0 }, a: false, b: false, c: false, s1: false, s2: false };
        if (SB.dMode === 'still') return idle;
        if (SB.dMode === 'move') {
            const h = p.home || p, t = world.time + p.id * 1.7, tx = h.x + Math.cos(t * 0.9) * 140, ty = h.y + Math.sin(t * 1.3) * 90;
            const d = Math.hypot(tx - p.x, ty - p.y) || 1; idle.move = { x: (tx - p.x) / d, y: (ty - p.y) / d }; return idle;
        }
    }
    return _botThinkSB(p, dt);
};

/* ============================== CHẾT → HỒI SINH, KHÔNG HẾT HIỆP ============================== */
const _killPlayerSB = killPlayer;
killPlayer = function (dead, killerId) {
    if (!SB.on) return _killPlayerSB(dead, killerId);
    if (dead.dead) return;
    const gs = gameState; gameState = 'SANDBOX';
    try { _killPlayerSB(dead, killerId); } finally { gameState = gs; }
    dead.sbRespawn = world.time + (dead.id === 1 ? 2 : 1.2);
    if (dead.id === 1) showBanner('BẠN ĐÃ BỊ HẠ', 'Hồi sinh sau 2 giây…', '#ff4d5e', 1.6, 44);
    else floatText(dead.x, dead.y - 40, '☠ HẠ GỤC', '#fca5a5', 16);
};
const _updateSB = update;
update = function (rawDt) {
    if (SB.on && ['PLAYING', 'COUNTDOWN'].includes(gameState)) {
        sbFixZone();
        world.infiniteAmmo = SB.ammo;
        const me = players[0];
        if (me && me.hp > 0) {
            if (SB.god) { me.hp = me.maxHp; me.stun = 0; }
            if (SB.noCd) { (me.skills || []).forEach(s => { if (s.cd > 0) s.cd = 0; }); (me.spells || []).forEach(s => { if (s.cd > 0) s.cd = 0; }); (me.items || []).forEach(it => { if (it && it.cd > 0) it.cd = 0; }); }
            if (SB.ammo) me.inventory.forEach(w => { if (w.magSize && w.mag <= 0) { w.mag = effMag(me, w); w.reloading = false; } });
        }
        players.forEach(p => { if (p.id !== 1 && p.spawnShield > 0) p.spawnShield = 0; });
        players.forEach(p => {
            if (!p.dead || !p.sbRespawn || world.time < p.sbRespawn) return;
            const L = sbLoadout(p);
            p.dead = false; p.sbRespawn = 0;
            if (p.id === 1) { resetPlayerForRound(p); sbRestore(p, L); p.spawnShield = 1; (p.spells || []).forEach(s => s.cd = 0); }
            else { p.st = freshStatus(); p.stun = 0; p.hp = p.maxHp; p.ghostHp = p.hp; if (p.home) { p.x = p.home.x; p.y = p.home.y; } if (p.sbWep && p.sbWep !== 'NONE' && getCurrentWeapon(p).id === 'NONE') { p.inventory = [makeWeapon(p.sbWep, p), { ...WEAPONS.NONE }]; p.weaponIdx = 0; } }
            ring(p.x, p.y, 8, 70, p.color, 0.5, 4);
        });
        if (gameState === 'KO' || gameState === 'ROUND_OVER') gameState = 'PLAYING';
    }
    const r = _updateSB(rawDt);
    if (SB.on && (gameState === 'KO' || gameState === 'ROUND_OVER')) gameState = 'PLAYING';
    if (SB.on) sbTickPanel(rawDt);
    return r;
};

/* ============================== ĐO SÁT THƯƠNG ============================== */
const _dealDamageSB = dealDamage;
dealDamage = function (target, dmg, attackerId, opts = {}) {
    if (!SB.on || attackerId !== 1 || !target || target.id === 1) return _dealDamageSB(target, dmg, attackerId, opts);
    const h0 = target.hp + (target.armor || 0) + ((target.st && target.st.shield) || 0);
    const r = _dealDamageSB(target, dmg, attackerId, opts);
    const h1 = Math.max(0, target.hp) + (target.armor || 0) + ((target.st && target.st.shield) || 0);
    const d = h0 - h1;
    if (d > 0) { SB.hits.push({ t: world.time, d }); SB.total += d; SB.last = d; SB.lastName = getCurrentWeapon(players[0]).name; }
    return r;
};
function sbDps() { const now = world.time; SB.hits = SB.hits.filter(h => now - h.t < 5); const s = SB.hits.reduce((a, h) => a + h.d, 0); const span = SB.hits.length ? Math.max(1, now - SB.hits[0].t) : 1; return { dps: s / span, s5: s }; }

/* ============================== BẢNG ĐIỀU KHIỂN ============================== */
(function sbStyle() {
    const css = `
#sb-toggle{position:fixed;top:64px;right:12px;z-index:60;border:1px solid rgba(148,163,184,.4);background:rgba(15,23,42,.88);color:#e2e8f0;border-radius:10px;padding:7px 11px;font:700 13px system-ui,sans-serif;cursor:pointer}
#sb-panel{position:fixed;top:104px;right:12px;bottom:12px;width:min(370px,calc(100vw - 24px));z-index:59;display:flex;flex-direction:column;background:rgba(10,15,28,.94);border:1px solid rgba(56,189,248,.35);border-radius:14px;color:#e2e8f0;font:13px system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5);overflow:hidden}
#sb-panel.hidden,#sb-toggle.hidden{display:none}
#sb-panel .sb-head{padding:10px 12px 6px;border-bottom:1px solid rgba(148,163,184,.18)}
#sb-panel .sb-title{font-weight:800;letter-spacing:.06em;color:#7dd3fc;display:flex;justify-content:space-between;align-items:center}
#sb-panel .sb-dps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}
#sb-panel .sb-dps div{background:rgba(30,41,59,.8);border-radius:8px;padding:5px 6px;text-align:center}
#sb-panel .sb-dps b{display:block;font-size:17px;color:#fde68a;font-variant-numeric:tabular-nums}
#sb-panel .sb-dps span{font-size:10px;color:#94a3b8;letter-spacing:.05em}
#sb-panel .sb-tabs{display:flex;gap:4px;padding:8px 10px 0;flex-wrap:wrap}
#sb-panel .sb-tabs button,#sb-panel .sb-chip{border:1px solid rgba(148,163,184,.3);background:rgba(30,41,59,.7);color:#cbd5e1;border-radius:8px;padding:5px 9px;font:600 12px system-ui,sans-serif;cursor:pointer}
#sb-panel .sb-tabs button.on,#sb-panel .sb-chip.on{background:#0ea5e9;border-color:#38bdf8;color:#fff}
#sb-panel .sb-body{flex:1;overflow-y:auto;padding:8px 10px 12px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
#sb-panel,#sb-panel *{touch-action:pan-y}#sb-panel input,#sb-panel select{touch-action:manipulation;user-select:text;-webkit-user-select:text}
#sb-panel .sb-row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0;align-items:center}
#sb-panel .sb-lbl{font-size:11px;color:#94a3b8;letter-spacing:.06em;margin:10px 0 2px;font-weight:700}
#sb-panel .sb-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}
#sb-panel .sb-it{display:flex;gap:7px;align-items:center;border:1px solid rgba(148,163,184,.2);background:rgba(30,41,59,.55);border-radius:8px;padding:6px 7px;cursor:pointer;text-align:left;color:#e2e8f0;font:12px system-ui,sans-serif;min-width:0}
#sb-panel .sb-it:hover{border-color:#38bdf8}
#sb-panel .sb-it.on{border-color:#facc15;background:rgba(250,204,21,.14)}
#sb-panel .sb-it i{font-style:normal;font-size:17px;flex:none}
#sb-panel .sb-it span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#sb-panel .sb-it small{display:block;color:#94a3b8;font-size:10px}
#sb-panel .sb-list .sb-it{width:100%;margin-bottom:4px}
#sb-panel .sb-list .sb-it span{white-space:normal}
#sb-panel input.sb-q{width:100%;box-sizing:border-box;background:#0f172a;border:1px solid rgba(148,163,184,.35);border-radius:8px;color:#e2e8f0;padding:7px 9px;font:13px system-ui,sans-serif}
#sb-panel .t1{color:#cbd5e1}#sb-panel .t2{color:#86efac}#sb-panel .t3{color:#93c5fd}#sb-panel .t4{color:#d8b4fe}#sb-panel .t5{color:#fde68a}
@media (pointer:coarse){#sb-panel{top:52px;bottom:6px;max-height:none;width:min(340px,calc(100vw - 24px));font-size:12px}#sb-panel .sb-head{padding:6px 10px 4px}#sb-panel .sb-dps{margin-top:4px}#sb-panel .sb-dps div{padding:2px 4px}#sb-panel .sb-tabs{padding:5px 8px 0}#sb-panel .sb-tabs button{padding:4px 7px}#sb-toggle{top:12px;right:76px}#sb-panel .sb-dps b{font-size:14px}}
#sb-panel .sb-note{font-size:11px;color:#94a3b8;margin-top:6px;line-height:1.45}
`;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    const t = document.createElement('button'); t.id = 'sb-toggle'; t.className = 'hidden'; t.textContent = '🧪 SANDBOX (J)'; document.body.appendChild(t);
    const p = document.createElement('div'); p.id = 'sb-panel'; p.className = 'hidden'; document.body.appendChild(p);
    t.addEventListener('click', () => { SB.panel = !SB.panel; sbPanel(true); });
    ['keydown', 'keyup'].forEach(ev => p.addEventListener(ev, e => { if (e.target.tagName === 'INPUT') e.stopPropagation(); }));
    ['touchstart', 'touchmove', 'touchend', 'mousedown', 'wheel'].forEach(ev => p.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
    p.addEventListener('click', sbClick);
    p.addEventListener('input', e => { if (e.target.classList.contains('sb-q')) { SB.q = e.target.value; sbRenderList(); } });
    window.addEventListener('keydown', e => { if (SB.on && e.code === 'KeyJ' && e.target.tagName !== 'INPUT') { SB.panel = !SB.panel; sbPanel(true); } });
    // nút vào sandbox ở menu chính
    const start = $('start-btn');
    if (start) { const b = document.createElement('button'); b.className = 'menu-btn'; b.id = 'sandbox-btn'; b.textContent = '🧪 SANDBOX · LUYỆN TẬP'; b.style.marginTop = '8px'; b.style.width = '100%'; start.insertAdjacentElement('afterend', b); b.addEventListener('click', () => startSandbox()); }
})();
function sbPanel(show) {
    $('sb-toggle').classList.toggle('hidden', !show);
    $('sb-panel').classList.toggle('hidden', !show || !SB.panel);
    if (show && SB.panel) sbRender();
}
let sbRenderPending = false;
function sbRenderSoon() { if (sbRenderPending) return; sbRenderPending = true; setTimeout(() => { sbRenderPending = false; if (SB.on && SB.panel) sbRender(); }, 30); }
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const stripTags = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function sbRender() {
    const el = $('sb-panel'), me = players[0]; if (!el || !me) return;
    const tabs = [['wep', '🔫 Vũ khí'], ['card', '🃏 Thẻ'], ['spell', '✨ Phép'], ['adv', '⭐ Lợi thế'], ['world', '🌍 Thế giới']];
    el.innerHTML = `<div class="sb-head"><div class="sb-title"><span>🧪 SANDBOX</span><span><button class="sb-chip" data-act="reset-dps">↺ Đo lại</button> <button class="sb-chip" data-act="close">✕</button></span></div>
      <div class="sb-dps"><div><b id="sb-d1">0</b><span>DPS (5s)</span></div><div><b id="sb-d2">0</b><span>ĐÒN CUỐI</span></div><div><b id="sb-d3">0</b><span>TỔNG</span></div></div></div>
      <div class="sb-tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${SB.tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="sb-body" id="sb-body"></div>`;
    sbRenderBody();
}
function sbRenderBody() {
    const b = $('sb-body'), me = players[0]; if (!b || !me) return;
    const chip = (act, val, label, on) => `<button class="sb-chip ${on ? 'on' : ''}" data-act="${act}" data-val="${esc(val)}">${label}</button>`;
    if (SB.tab === 'wep') {
        const cur = me.inventory.map(w => `${w.icon} ${esc(w.name)}`);
        const all = Object.values(WEAPONS).filter(w => w && w.id && w.name);
        const group = (title, f) => { const L = all.filter(f); return L.length ? `<div class="sb-lbl">${title} (${L.length})</div><div class="sb-grid">${L.map(w => `<button class="sb-it ${me.inventory[SB.slot] && me.inventory[SB.slot].id === w.id ? 'on' : ''}" data-act="wep" data-val="${w.id}"><i>${w.icon || '❔'}</i><span class="t${Math.min(5, w.tier || 1)}">${esc(w.name)}${LEGEND_POOL && LEGEND_POOL.includes && LEGEND_POOL.includes(w.id) ? ' 🪂' : ''}</span></button>`).join('')}</div>` : ''; };
        b.innerHTML = `<div class="sb-lbl">Ô ĐANG GẮN</div><div class="sb-row">${chip('slot', 0, '① ' + (cur[0] || '-'), SB.slot === 0)}${chip('slot', 1, '② ' + (cur[1] || '-'), SB.slot === 1)}</div>
          ${group('CẬN CHIẾN', w => w.type === 'MELEE' || w.type === 'SHIELD')}${group('SÚNG', w => w.type === 'GUN')}${group('VẬT NÉM', w => w.type === 'THROWABLE')}
          <div class="sb-note">🪂 = chỉ rơi trong thính. Màu tên theo bậc vũ khí.</div>`;
        return;
    }
    if (SB.tab === 'card') {
        b.innerHTML = `<input class="sb-q" placeholder="Tìm thẻ (tên / mô tả)…" value="${esc(SB.q)}">
          <div class="sb-row">${chip('kind', 'all', 'Tất cả', SB.kind === 'all')}${chip('kind', 'S', '⚡ Kỹ năng', SB.kind === 'S')}${chip('kind', 'P', '🛡 Nội tại', SB.kind === 'P')}${chip('kind', 'mine', '✔ Đang có', SB.kind === 'mine')}${chip('clear-cards', '', '🗑 Xoá hết', false)}</div>
          <div id="sb-combos" class="sb-note"></div><div class="sb-list" id="sb-list"></div>`;
        sbRenderList(); return;
    }
    if (SB.tab === 'spell') {
        const have = (me.spells || []).map(s => s.id);
        b.innerHTML = `<div class="sb-note">Chọn tối đa 3 phép (phím Z / X / V). Đang có: ${have.length ? have.map(id => SPELLS[id] ? SPELLS[id].icon + ' ' + SPELLS[id].name : id).join(' · ') : 'chưa có'}</div>
          <div class="sb-list">${Object.keys(SPELLS).map(id => { const s = SPELLS[id]; return `<button class="sb-it ${have.includes(id) ? 'on' : ''}" data-act="spell" data-val="${id}"><i>${s.icon}</i><span><b>${esc(s.name)}</b> <small>Hồi ${s.cd || '?'}s · ${esc(stripTags(s.desc)).slice(0, 140)}</small></span></button>`; }).join('')}</div>`;
        return;
    }
    if (SB.tab === 'adv') {
        b.innerHTML = `<div class="sb-list"><button class="sb-it ${!me.adv ? 'on' : ''}" data-act="adv" data-val=""><i>🚫</i><span><b>Không có lợi thế</b></span></button>
          ${ADV_IDS.map(id => { const a = ADVANTAGES[id]; return `<button class="sb-it ${me.adv === id ? 'on' : ''}" data-act="adv" data-val="${id}"><i>${a.icon}</i><span><b>${esc(a.name)}</b> <small>${esc(stripTags(a.desc)).slice(0, 160)}</small></span></button>`; }).join('')}</div>`;
        return;
    }
    // thế giới
    const maps = typeof ALL_MAPS !== 'undefined' ? ALL_MAPS : Object.keys(MAP_NAMES);
    b.innerHTML = `<div class="sb-lbl">BẢN THÂN</div><div class="sb-row">
        ${chip('tg', 'noCd', '⏱ Không hồi chiêu', SB.noCd)}${chip('tg', 'god', '❤️ Bất tử', SB.god)}${chip('tg', 'ammo', '♾ Đạn vô hạn', SB.ammo)}${chip('tg', 'fow', '🌫 Sương mù', SB.fow)}
        ${chip('heal', '', '💚 Hồi đầy máu', false)}</div>
      <div class="sb-lbl">MỤC TIÊU (${players.length - 1}/${SB_MAX - 1})</div><div class="sb-row">
        ${chip('add-dummy', '', '🎯 + Hình nộm', false)}${chip('add-bot', '', '🤖 + Bot thật', false)}${chip('clear-dummy', '', '🗑 Xoá hết', false)}${chip('pull', '', '📍 Gọi lại gần', false)}</div>
      <div class="sb-row">Máu hình nộm: ${[200, 500, 5000].map(h => chip('dhp', h, h === 5000 ? '5000' : String(h), SB.dHp === h)).join('')}</div>
      <div class="sb-row">Hành vi: ${chip('dmode', 'still', '🧍 Đứng yên', SB.dMode === 'still')}${chip('dmode', 'move', '🚶 Đi lại', SB.dMode === 'move')}${chip('dmode', 'fight', '⚔️ Đánh trả', SB.dMode === 'fight')}</div>
      <div class="sb-row">Vũ khí hình nộm: <select class="sb-chip" data-act="dwep">${['NONE', ...Object.keys(WEAPONS).filter(k => k !== 'NONE')].map(k => `<option value="${k}" ${SB.dWep === k ? 'selected' : ''}>${WEAPONS[k].icon || ''} ${esc(WEAPONS[k].name)}</option>`).join('')}</select></div>
      <div class="sb-lbl">THỜI TIẾT</div><div class="sb-row">${Object.keys(WEATHERS).map(k => chip('wx', k, WEATHERS[k].name, (world.weather && world.weather.id) === k)).join('')}</div>
      <div class="sb-lbl">BẢN ĐỒ (tạo lại)</div><div class="sb-row">${maps.map(k => chip('map', k, MAP_NAMES[k] || k, SB.map === k)).join('')}</div>
      <div class="sb-row">${chip('crates', '', '📦 Thả 6 thùng đồ', false)}${chip('airdrop', '', '🪂 Gọi thính', false)}${chip('exit', '', '🚪 Về menu', false)}</div>
      <div class="sb-note">Không có vòng bo và không hết hiệp. Chết thì hồi sinh. Phím <b>J</b> ẩn/hiện bảng. Bảng đo DPS chỉ tính sát thương bạn gây ra.</div>`;
    b.querySelector('select[data-act="dwep"]').addEventListener('change', e => { SB.dWep = e.target.value; players.slice(1).forEach(p => { if (p.dummy) { p.sbWep = SB.dWep; sbPlaceDummy(p); } }); });
}
function sbRenderList() {
    const L = $('sb-list'), me = players[0]; if (!L || !me) return;
    const q = SB.q.trim().toLowerCase();
    const items = Object.values(CARDS).filter(c => c && c.id && c.name && (c.kind === 'S' || c.kind === 'P'))
        .filter(c => SB.kind === 'all' || (SB.kind === 'mine' ? me.build.includes(c.id) : c.kind === SB.kind))
        .filter(c => !q || (c.name + ' ' + stripTags(c.desc)).toLowerCase().includes(q))
        .sort((a, b) => (me.build.includes(b.id) - me.build.includes(a.id)) || a.name.localeCompare(b.name, 'vi'));
    L.innerHTML = items.slice(0, 160).map(c => `<button class="sb-it ${me.build.includes(c.id) ? 'on' : ''}" data-act="card" data-val="${c.id}"><i>${c.icon || '🃏'}</i><span><b>${esc(c.name)}</b> <small>${c.kind === 'S' ? '⚡ Kỹ năng' : '🛡 Nội tại'} · ${esc(stripTags(c.desc)).slice(0, 150)}</small></span></button>`).join('') + (items.length > 160 ? `<div class="sb-note">…còn ${items.length - 160} thẻ, gõ để lọc</div>` : '') + (!items.length ? '<div class="sb-note">Không có thẻ phù hợp</div>' : '');
    const cb = $('sb-combos');
    if (cb) { const cs = (me.combos || []).map(id => { const c = COMBOS.find(x => x.id === id); return c ? c.name : id; }); cb.innerHTML = `Kỹ năng: ${(me.skills || []).length}/3 (R/T/E) · Phối hợp đang kích hoạt: ${cs.length ? '<b style="color:#fde047">' + cs.map(esc).join(', ') + '</b>' : 'không có'}`; }
}
function sbClick(e) {
    const t = e.target.closest('[data-tab],[data-act]'); if (!t || t.tagName === 'SELECT') return;
    const me = players[0]; if (!me) return;
    if (t.dataset.tab) { SB.tab = t.dataset.tab; sbRender(); return; }
    const act = t.dataset.act, v = t.dataset.val;
    AudioSys.play('ui', 0.3);
    switch (act) {
        case 'close': SB.panel = false; sbPanel(true); return;
        case 'reset-dps': SB.hits = []; SB.total = 0; SB.last = 0; break;
        case 'slot': SB.slot = +v; break;
        case 'wep': {
            while (me.inventory.length < 2) me.inventory.push({ ...WEAPONS.NONE });
            me.inventory[SB.slot] = makeWeapon(v, me); me.weaponIdx = SB.slot; me.cooldown = 0; me.charge = 0;
            floatText(me.x, me.y - 30, `${WEAPONS[v].icon} ${WEAPONS[v].name}`, '#fff', 14); break;
        }
        case 'kind': SB.kind = v; break;
        case 'clear-cards': me.build = []; sbRebuild(me); break;
        case 'card': {
            const i = me.build.indexOf(v);
            if (i >= 0) me.build.splice(i, 1);
            else {
                if (CARDS[v].kind === 'S' && me.build.filter(id => CARDS[id].kind === 'S').length >= 3) { floatText(me.x, me.y - 30, 'Tối đa 3 kỹ năng — bỏ bớt trước', '#fca5a5', 13); break; }
                me.build.push(v);
            }
            sbRebuild(me);
            const ne = me.combos.length; if (i < 0 && ne) floatText(me.x, me.y - 46, `⚡ ${ne} phối hợp`, '#fde047', 13);
            sbRenderList(); return;
        }
        case 'spell': {
            me.spells = me.spells || [];
            const i = me.spells.findIndex(s => s.id === v);
            if (i >= 0) me.spells.splice(i, 1); else { if (me.spells.length >= 3) me.spells.shift(); me.spells.push({ id: v, cd: 0 }); }
            break;
        }
        case 'adv': {
            if (me.adv === 'techStart' && v !== 'techStart') { const k = me.build.indexOf('hightech'); if (k >= 0) me.build.splice(k, 1); }
            me.adv = v || null;
            if (v === 'techStart' && !me.build.includes('hightech')) me.build.push('hightech');
            sbRebuild(me); break;
        }
        case 'tg': SB[v] = !SB[v]; if (v === 'fow') settings.fow = SB.fow; if (v === 'ammo' && !SB.ammo) world.infiniteAmmo = false; break;
        case 'heal': me.hp = me.maxHp; me.armor = me.maxArmor || 0; me.st = Object.assign(freshStatus(), { invis: me.st.invis }); me.stun = 0; break;
        case 'add-dummy': sbAddDummy(false); return;
        case 'add-bot': sbAddDummy(true); return;
        case 'clear-dummy': sbClearDummies(); return;
        case 'pull': players.slice(1).forEach(p => { p.dead = false; p.sbRespawn = 0; if (p.hp <= 0) p.hp = p.maxHp; sbPlaceDummy(p); }); break;
        case 'dhp': SB.dHp = +v; players.slice(1).forEach(p => { if (p.dummy) { p.maxHp = SB.dHp; p.hp = p.maxHp; p.ghostHp = p.hp; } }); break;
        case 'dmode': SB.dMode = v; players.slice(1).forEach(p => { if (p.dummy && p.brain) p.brain = createBrain(); }); break;
        case 'wx': SB.weather = v; world.weather = { id: v, windA: Math.random() * Math.PI * 2, seq: (world.weather ? world.weather.seq || 0 : 0) + 1, boltT: 3 }; if (typeof weatherFx !== 'undefined') weatherFx.length = 0; break;
        case 'map': SB.map = v; sbRestart(false); break;
        case 'crates': for (let i = 0; i < 6; i++) spawnCrate(true); break;
        case 'airdrop': sbAirdrop(me); break;
        case 'exit': goMenu(); return;
    }
    sbRender();
}
function sbAirdrop(me) {
    const pool = (typeof LEGEND_POOL !== 'undefined' && LEGEND_POOL.length) ? LEGEND_POOL : ['ROCKET'];
    const id = pool[Math.floor(Math.random() * pool.length)], a = Math.random() * Math.PI * 2;
    const x = Math.max(60, Math.min(MAP_W - 60, me.x + Math.cos(a) * 120)), y = Math.max(60, Math.min(MAP_H - 60, me.y + Math.sin(a) * 120));
    dropGroundWeapon(me, makeWeapon(id, me), x, y, 30);
    ring(x, y, 10, 80, '#facc15', 0.6, 5); floatText(x, y - 30, `🪂 ${WEAPONS[id].name}`, '#facc15', 15);
}
let sbTickT = 0;
function sbTickPanel(dt) {
    sbTickT -= dt; if (sbTickT > 0) return; sbTickT = 0.2;
    const d = sbDps(), f = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    f('sb-d1', Math.round(d.dps)); f('sb-d2', Math.round(SB.last)); f('sb-d3', Math.round(SB.total));
}
// HUD: nhãn chế độ thay cho "HIỆP 1"
const _drawHUDSB = drawHUD;
drawHUD = function (W, H, now) {
    _drawHUDSB(W, H, now);
    if (!SB.on) return;
    ctx.save(); ctx.font = `800 13px ${FONT}`; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    const s = `🧪 SANDBOX${SB.god ? ' · BẤT TỬ' : ''}${SB.noCd ? ' · KHÔNG HỒI CHIÊU' : ''}`;
    ctx.strokeText(s, 16, H - 16); ctx.fillStyle = '#7dd3fc'; ctx.fillText(s, 16, H - 16); ctx.restore();
};
// không có vòng bo / tỉ số: ẩn dải tỉ số trên cùng, bo không bao giờ thu
const _drawScoreStripSB = drawScoreStrip;
drawScoreStrip = function (W, now) { if (SB.on) return; return _drawScoreStripSB(W, now); };
const _rollWeatherSB = rollWeather;
rollWeather = function () { return SB.on ? SB.weather : _rollWeatherSB(); };
