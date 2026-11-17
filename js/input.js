/** ==================== ĐIỀU KHIỂN: Cảm ứng + Bàn phím + Tay cầm ==================== */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let SCREEN_W = window.innerWidth, SCREEN_H = window.innerHeight;
let PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, ('ontouchstart' in window) ? 1.5 : 2); // điện thoại: giảm độ phân giải cho mượt
let isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch');

function resize() {
    SCREEN_W = window.innerWidth; SCREEN_H = window.innerHeight;
    canvas.width = SCREEN_W * PIXEL_RATIO; canvas.height = SCREEN_H * PIXEL_RATIO;
}
window.addEventListener('resize', resize);
resize();

// Bố cục: P1 ngồi phía trên (đảo ngược), P2 ngồi phía dưới
const P1_CONTROLS = { joystick: { x: 0.87, y: 0.22, r: 0.085 }, btnA: { x: 0.09, y: 0.2, r: 0.058, label: '⚔', color: '#ff4d5e' }, btnB: { x: 0.2, y: 0.3, r: 0.04, label: '↗', color: '#f5b100' }, btnC: { x: 0.2, y: 0.09, r: 0.034, label: '⇄', color: '#a855f7' }, btnS1: { x: 0.31, y: 0.2, r: 0.045, color: '#22d3ee' }, btnS2: { x: 0.09, y: 0.42, r: 0.045, color: '#22d3ee' } };
const P2_CONTROLS = { joystick: { x: 0.13, y: 0.78, r: 0.085 }, btnA: { x: 0.91, y: 0.8, r: 0.058, label: '⚔', color: '#3ba8ff' }, btnB: { x: 0.8, y: 0.7, r: 0.04, label: '↗', color: '#f5b100' }, btnC: { x: 0.8, y: 0.91, r: 0.034, label: '⇄', color: '#a855f7' }, btnS1: { x: 0.69, y: 0.8, r: 0.045, color: '#22d3ee' }, btnS2: { x: 0.91, y: 0.58, r: 0.045, color: '#22d3ee' } };

const touchInputs = { p1: { move: { x: 0, y: 0 }, a: false, b: false, c: false, s1: false, s2: false }, p2: { move: { x: 0, y: 0 }, a: false, b: false, c: false, s1: false, s2: false } };
const stickOrigin = { p1: null, p2: null }; // joystick nổi: tâm đặt tại điểm chạm
const touches = new Map();
const aimStick = { p1: null, p2: null }; // vị trí kéo nút đánh để vẽ

function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function checkZone(x, y, cfg, scale = 1.25) { return dist(x, y, cfg.x * SCREEN_W, cfg.y * SCREEN_H) < Math.min(SCREEN_W, SCREEN_H * 1.8) * cfg.r * scale; }
function ctrlR(cfg) { return Math.min(SCREEN_W, SCREEN_H * 1.8) * cfg.r; }

function handleTouch(e) {
    if (gameState !== 'PLAYING' && gameState !== 'COUNTDOWN') return;
    e.preventDefault();
    for (const t of e.changedTouches) {
        const x = t.clientX, y = t.clientY;
        if (e.type === 'touchstart') {
            const side = settings.mode === 'pvp' && y < SCREEN_H / 2 ? 'p1' : 'p2'; // đấu máy / online: cả màn hình là của mình
            const C = side === 'p1' ? P1_CONTROLS : P2_CONTROLS;
            const inp = touchInputs[side];
            if (checkZone(x, y, C.btnA, 1.35)) { inp.a = true; inp.aim = { x: 0, y: 0 }; inp.aimActive = true; touches.set(t.identifier, { side, k: 'a', sx: x, sy: y }); }
            else if (checkZone(x, y, C.btnB, 1.4)) { inp.b = true; touches.set(t.identifier, { side, k: 'b' }); }
            else if (checkZone(x, y, C.btnC, 1.4)) { inp.c = true; touches.set(t.identifier, { side, k: 'c' }); }
            else if (checkZone(x, y, C.btnS1, 1.35)) { inp.s1 = true; touches.set(t.identifier, { side, k: 's1' }); }
            else if (checkZone(x, y, C.btnS2, 1.35)) { inp.s2 = true; touches.set(t.identifier, { side, k: 's2' }); }
            else {
                // nửa màn hình phía joystick = vùng joystick nổi
                const stickSide = side === 'p1' ? x > SCREEN_W * 0.45 : x < SCREEN_W * 0.55;
                if (stickSide) { stickOrigin[side] = { x, y }; touches.set(t.identifier, { side, k: 'stick', sx: x, sy: y }); }
            }
        } else if (e.type === 'touchmove') {
            const td = touches.get(t.identifier);
            if (td && td.k === 'a') {
                // kéo nút đánh: vector ngắm (kiểu Brawl Stars)
                const dx = x - td.sx, dy = y - td.sy, d = Math.hypot(dx, dy), maxD = ctrlR(P1_CONTROLS.btnA) * 1.6;
                touchInputs[td.side].aim = d < 12 ? { x: 0, y: 0 } : { x: dx / d * Math.min(1, d / maxD), y: dy / d * Math.min(1, d / maxD) };
                aimStick[td.side] = { sx: td.sx, sy: td.sy, x, y };
            }
            if (td && td.k === 'stick') {
                const dx = x - td.sx, dy = y - td.sy, maxD = ctrlR(P1_CONTROLS.joystick) * 0.85;
                const d = Math.min(Math.hypot(dx, dy), maxD), a = Math.atan2(dy, dx);
                const m = d < 6 ? 0 : d / maxD;
                touchInputs[td.side].move = { x: Math.cos(a) * m, y: Math.sin(a) * m };
            }
        } else {
            const td = touches.get(t.identifier);
            if (td) {
                if (td.k === 'stick') { touchInputs[td.side].move = { x: 0, y: 0 }; stickOrigin[td.side] = null; }
                else touchInputs[td.side][td.k] = false;
                if (td.k === 'a') { touchInputs[td.side].aim = { x: 0, y: 0 }; touchInputs[td.side].aimActive = false; aimStick[td.side] = null; }
                touches.delete(t.identifier);
            }
        }
    }
}
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(ev => canvas.addEventListener(ev, handleTouch, { passive: false }));

/** ---------- Bàn phím ---------- */
const keys = new Set();
const KEYMAP = {
    p1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], a: ['KeyF', 'Space'], b: ['KeyG'], c: ['KeyH', 'KeyQ'], s1: ['KeyR'], s2: ['KeyT'] },
    p2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], a: ['KeyK', 'Comma', 'Numpad1', 'Enter'], b: ['KeyL', 'Period', 'Numpad2'], c: ['Semicolon', 'Slash', 'Numpad3'], s1: ['KeyI', 'Numpad4'], s2: ['KeyO', 'Numpad5'] }
};
window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (isTouch && !e.code.startsWith('Audio')) { isTouch = false; document.body.classList.remove('touch'); }
    onKeyPress(e.code);
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
const anyKey = list => list.some(k => keys.has(k));

function keyboardInput(map) {
    let x = (anyKey(map.right) ? 1 : 0) - (anyKey(map.left) ? 1 : 0);
    let y = (anyKey(map.down) ? 1 : 0) - (anyKey(map.up) ? 1 : 0);
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return { move: { x, y }, a: anyKey(map.a), b: anyKey(map.b), c: anyKey(map.c), s1: anyKey(map.s1), s2: anyKey(map.s2) };
}

/** ---------- Tay cầm ---------- */
function gamepadInput(index) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[index];
    if (!gp) return null;
    let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
    if (Math.hypot(x, y) < 0.2) { x = 0; y = 0; }
    const btn = i => gp.buttons[i] && gp.buttons[i].pressed;
    let ax = gp.axes[2] || 0, ay = gp.axes[3] || 0;
    const aim = Math.hypot(ax, ay) > 0.3 ? { x: ax, y: ay } : null;
    return { move: { x, y }, a: btn(0) || btn(7), b: btn(1) || btn(6), c: btn(2), s1: btn(3) || btn(4), s2: btn(5), aim };
}

function mergeInput(...list) {
    const out = { move: { x: 0, y: 0 }, a: false, b: false, c: false, s1: false, s2: false };
    list.forEach(i => {
        if (!i) return;
        if (Math.hypot(i.move.x, i.move.y) > Math.hypot(out.move.x, out.move.y)) out.move = { ...i.move };
        out.a = out.a || i.a; out.b = out.b || i.b; out.c = out.c || i.c; out.s1 = out.s1 || !!i.s1; out.s2 = out.s2 || !!i.s2;
        if (i.aim && (!out.aim || Math.hypot(i.aim.x, i.aim.y) > Math.hypot(out.aim.x, out.aim.y))) out.aim = { ...i.aim };
        if (i.aimActive) out.aimActive = true;
        if (i.aimMouse) out.aimMouse = true;
    });
    return out;
}

/** ---------- Chuột (PC): di chuột để ngắm, chuột trái = đánh, chuột phải = nạp/ném, lăn chuột = đổi vũ khí ---------- */
const mouse = { x: 0, y: 0, left: false, right: false, active: false, wheel: false };
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
canvas.addEventListener('mousedown', e => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    if (e.button === 0) mouse.left = true; else if (e.button === 2) mouse.right = true; else if (e.button === 1) mouse.wheel = true;
    if (isTouch && e.pointerType !== 'touch' && !e.sourceCapabilities?.firesTouchEvents) { isTouch = false; document.body.classList.remove('touch'); }
});
window.addEventListener('mouseup', e => { if (e.button === 0) mouse.left = false; else if (e.button === 2) mouse.right = false; else if (e.button === 1) mouse.wheel = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', e => { if (mouse.active) { mouse.wheelPulse = true; e.preventDefault(); } }, { passive: false });
/** Người chơi dùng chuột: online/đấu máy = chính mình; 2 người = P1 (tay trái WASD, tay phải chuột) */
function mouseOwnerId() { return settings.mode === 'pvp' ? 1 : localId(); }
function mouseInput(id) {
    if (!mouse.active || isTouch || mouseOwnerId() !== id) return null;
    const p = players.find(q => q.id === id); if (!p || p.x === undefined) return null;
    const z = camera.zoom * (1 + fx.zoomPunch * 0.08);
    const wx = (mouse.x - SCREEN_W / 2) / z + camera.x, wy = (mouse.y - SCREEN_H / 2) / z + camera.y;
    const dx = wx - p.x, dy = wy - p.y, d = Math.hypot(dx, dy) || 1;
    const c = !!mouse.wheelPulse; mouse.wheelPulse = false;
    return { move: { x: 0, y: 0 }, a: mouse.left, b: mouse.right, c: c || mouse.wheel, s1: false, s2: false, aim: { x: dx / d, y: dy / d }, aimMouse: true, aimDist: d };
}

/** Lấy input của người chơi (id 1 / 2). Trong chế độ đấu máy, người chơi (P2) dùng được cả 2 bộ phím. */
function readHumanInput(id) {
    if (settings.mode === 'online' || (settings.mode === 'bot' && id === 2)) {
        return mergeInput(touchInputs.p2, keyboardInput(KEYMAP.p1), keyboardInput(KEYMAP.p2), gamepadInput(0), mouseInput(id));
    }
    return id === 1 ? mergeInput(touchInputs.p1, keyboardInput(KEYMAP.p1), gamepadInput(0), mouseInput(1))
                    : mergeInput(touchInputs.p2, keyboardInput(KEYMAP.p2), gamepadInput(1), mouseInput(2));
}

/** Phím tắt ngoài trận (chọn lõi, tạm dừng) */
let padPrev = [{}, {}];
function pollGamepadMenus() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < 2; i++) {
        const gp = pads && pads[i]; if (!gp) continue;
        [0, 1, 2, 9].forEach(b => {
            const pressed = gp.buttons[b] && gp.buttons[b].pressed;
            if (pressed && !padPrev[i][b]) onPadPress(i, b);
            padPrev[i][b] = pressed;
        });
    }
}
function onPadPress(pad, btn) {
    if (btn === 9) { togglePause(); return; }
    if (gameState === 'AUGMENT') {
        const idx = btn === 0 ? 0 : btn === 1 ? 1 : 2;
        if (net.role === 'guest') guestPick(idx);
        else pickAugmentByIndex(settings.mode === 'bot' ? 2 : settings.mode === 'online' ? 1 : pad + 1, idx);
    } else if (gameState === 'MENU' && btn === 0) startMatch();
}
function onKeyPress(code) {
    if (code === 'Escape' || code === 'KeyP') { togglePause(); return; }
    if (gameState === 'AUGMENT') {
        const p1 = { KeyF: 0, KeyG: 1, KeyH: 2, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
        const p2 = { KeyK: 0, KeyL: 1, Semicolon: 2, Comma: 0, Period: 1, Slash: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2, Quote: 3 };
        if (settings.mode === 'bot' || settings.mode === 'online') {
            const idx = p1[code] ?? p2[code];
            if (idx !== undefined) { if (net.role === 'guest') guestPick(idx); else pickAugmentByIndex(settings.mode === 'online' ? 1 : 2, idx); }
        } else {
            if (p1[code] !== undefined) pickAugmentByIndex(1, p1[code]);
            if (p2[code] !== undefined) pickAugmentByIndex(2, p2[code]);
        }
    } else if (gameState === 'MENU' && code === 'Enter') startMatch();
}
