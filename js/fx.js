/** ==================== HIỆU ỨNG: hạt, chữ nổi, rung, khựng hình, slow-mo, vết loang ==================== */
const particles = [];
const texts = [];
const rings = [];
const fx = { shake: 0, hitStop: 0, slowMo: 0, flash: 0, flashColor: '#fff', zoomPunch: 0 };

// Lớp vết loang (máu, vết cháy) vẽ một lần, giữ nguyên cả hiệp — nửa độ phân giải để nhẹ máy
const DECAL_SCALE = 0.5;
const decalCanvas = document.createElement('canvas');
decalCanvas.width = MAP_W * DECAL_SCALE; decalCanvas.height = MAP_H * DECAL_SCALE;
const decalCtx = decalCanvas.getContext('2d');
function clearDecals() { decalCtx.clearRect(0, 0, decalCanvas.width, decalCanvas.height); }

function addDecal(...a) { return addDecalRaw(...a); }
function addDecalRaw(x, y, r, color, alpha = 0.5, count = 1) {
    decalCtx.save(); decalCtx.globalAlpha = alpha; decalCtx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const ox = (Math.random() - 0.5) * r * 2.2, oy = (Math.random() - 0.5) * r * 2.2;
        const rr = r * (0.3 + Math.random() * 0.7);
        decalCtx.beginPath(); decalCtx.arc((x + ox) * DECAL_SCALE, (y + oy) * DECAL_SCALE, rr * DECAL_SCALE, 0, Math.PI * 2); decalCtx.fill();
    }
    decalCtx.restore();
}
function addScorch(x, y, r) {
    const g = decalCtx.createRadialGradient(x * DECAL_SCALE, y * DECAL_SCALE, 0, x * DECAL_SCALE, y * DECAL_SCALE, r * DECAL_SCALE);
    g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(0.6, 'rgba(20,10,5,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    decalCtx.fillStyle = g; decalCtx.beginPath(); decalCtx.arc(x * DECAL_SCALE, y * DECAL_SCALE, r * DECAL_SCALE, 0, Math.PI * 2); decalCtx.fill();
}

function spark(x, y, color, n = 6, speed = 200, life = 0.4, size = 2.5, glow = true) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.6), maxLife: life, color, size: size * (0.6 + Math.random() * 0.8), glow, drag: 0.9 });
    }
}
function directionalSpark(x, y, angle, color, n = 5, speed = 300, spread = 0.6) {
    for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - 0.5) * spread, s = speed * (0.4 + Math.random() * 0.6);
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.25 + Math.random() * 0.2, maxLife: 0.4, color, size: 2 + Math.random() * 2, glow: true, drag: 0.88 });
    }
}
function smoke(x, y, n = 6, color = 'rgba(80,80,100,0.5)', size = 18) {
    for (let i = 0; i < n; i++) {
        particles.push({ x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.8 + Math.random() * 0.6, maxLife: 1.4, color, size: size * (0.6 + Math.random() * 0.8), grow: 30, drag: 0.96 });
    }
}
function createBlood(x, y, color, angle) {
    for (let i = 0; i < 10; i++) {
        const a = angle !== undefined ? angle + (Math.random() - 0.5) * 1.2 : Math.random() * Math.PI * 2, s = 80 + Math.random() * 260;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, maxLife: 0.9, color, size: 2 + Math.random() * 2.5, drag: 0.86, decal: true });
    }
}
function ring(x, y, r0, r1, color, life = 0.35, width = 4) { rings.push({ x, y, r0, r1, color, life, maxLife: life, width }); }

function floatText(x, y, text, color, size = 16, opts = {}) {
    texts.push({ x: x + (Math.random() - 0.5) * 14, y, text: String(text), color, size, life: opts.life || 0.9, maxLife: opts.life || 0.9, vy: opts.vy || -70, pop: 1 });
}
function damageNumber(x, y, dmg, big) {
    const v = Math.round(dmg); if (v <= 0) return;
    floatText(x, y - 18, v, big ? '#ffd23f' : '#ffffff', big ? 26 : 16 + Math.min(10, v / 10), { vy: -110 });
}

function addShake(amt) { fx.shake = Math.min(28, fx.shake + amt); }
function hitStop(t) { fx.hitStop = Math.max(fx.hitStop, t); }
function flash(color, a = 0.5) { fx.flash = a; fx.flashColor = color; }
function vibrate(ms) { if (isTouch && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) try { navigator.vibrate(ms); } catch (e) {} }

/** Banner lớn giữa màn hình */
const banners = [];
function showBanner(text, sub = '', color = '#fff', dur = 1.6, size = 64) {
    banners.length = 0;
    banners.push({ text, sub, color, life: dur, maxLife: dur, size });
}

function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; if (!p) continue;
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const k = Math.pow(p.drag || 1, dt * 60); p.vx *= k; p.vy *= k;
        if (p.grow) p.size += p.grow * dt;
        if (p.life <= 0) {
            if (p.decal) addDecalRaw(p.x, p.y, p.size * 1.6, p.color, 0.45);
            particles.splice(i, 1);
        }
    }
    const cap = isTouch ? 450 : 900; // điện thoại: giới hạn hạt thấp hơn
    if (particles.length > cap) particles.splice(0, particles.length - cap);
    for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i]; if (!t) continue; t.life -= dt; t.y += t.vy * dt; t.vy *= Math.pow(0.9, dt * 60); t.pop = Math.max(0, t.pop - dt * 6);
        if (t.life <= 0) texts.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) { rings[i].life -= dt; if (rings[i].life <= 0) rings.splice(i, 1); }
    for (let i = banners.length - 1; i >= 0; i--) { banners[i].life -= dt; if (banners[i].life <= 0) banners.splice(i, 1); }
    fx.shake = Math.max(0, fx.shake - dt * 60);
    fx.flash = Math.max(0, fx.flash - dt * 2.5);
    fx.zoomPunch = Math.max(0, fx.zoomPunch - dt * 1.5);
}

/** Hình ảnh vụ nổ (tách riêng để máy khách online cũng vẽ được) */
function explosionFx(x, y, radius = 160) {
    addShake(14); hitStop(0.04); flash('#ffb347', 0.25);
    for (let i = 0; i < 36; i++) {
        const a = Math.random() * Math.PI * 2, s = 100 + Math.random() * 420;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35 + Math.random() * 0.4, maxLife: 0.7, color: ['#fff3b0', '#ffb347', '#ff5e3a', '#ff2e63'][i % 4], size: 3 + Math.random() * 7, glow: true, drag: 0.88 });
    }
    smoke(x, y, 10, 'rgba(60,50,60,0.55)', 26);
    particles.push({ x, y, vx: 0, vy: 0, life: 0.15, maxLife: 0.15, color: '#fff', size: radius * 0.55, glow: true });
    ring(x, y, 10, radius, '#ffb347', 0.35, 8);
    addScorch(x, y, radius * 0.55);
}
