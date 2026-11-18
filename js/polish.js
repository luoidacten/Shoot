/** ==================== ĐỘ BỀN CẬN CHIẾN · HỒI CHIÊU · VÙNG NGẮM KỸ NĂNG ĐÚNG HÌNH · HIỆU ỨNG KỸ NĂNG ====================
 *  Nạp sau parry.js.
 */

/* ============================== ĐỘ BỀN VŨ KHÍ CẬN CHIẾN ×2.5 ============================== */
for (const k in WEAPONS) {
    const w = WEAPONS[k];
    if ((w.type === 'MELEE' || w.type === 'SHIELD') && w.durability !== undefined) { w.maxDurability = Math.round((w.maxDurability || w.durability) * 2.5); w.durability = w.maxDurability; }
}

/* ============================== HỒI CHIÊU: Katana & Kiếm Liễu giảm mạnh ============================== */
const _skillCd13 = skillCooldown;
skillCooldown = function (p, id) {
    let cd = _skillCd13(p, id);
    if (id === 'meleeTech') { const w = getCurrentWeapon(p).id; cd *= w === 'KATANA' ? 0.45 : w === 'RAPIER' ? 0.4 : 0.85; }
    return Math.max(1, cd);
};

/* ============================== HỒ SƠ NGẮM THEO VŨ KHÍ ============================== */
// aim: 'dir' (kéo hướng) | 'point' (kéo điểm) | null (chạm là dùng)  ·  shape: line | cone | point | self
function skillProfile(p, id) {
    const w = getCurrentWeapon(p).id;
    if (id === 'meleeTech') {
        switch (w) {
            case 'KATANA': return (p.katN || 0) % 3 === 2 ? { aim: 'dir', R: 380, shape: 'line', w: 68, col: '125,211,252', tag: '⚔ TUYỆT KỸ' } : { aim: 'dir', R: 230, shape: 'line', w: 52, col: '224,242,254' };
            case 'LIGHTSABER': return { aim: 'dir', R: 160, shape: 'line', w: 44 };
            case 'RAPIER': return (p.rapN || 0) % 5 === 4 ? { aim: 'dir', R: 120, shape: 'point', aoe: 120, col: '224,242,254', tag: '⭐ TINH KIẾM' } : { aim: 'dir', R: 480, shape: 'line', w: 16, col: '224,242,254' };
            case 'SPEAR': return { aim: 'point', R: 300, shape: 'point', aoe: 90, arc: true, col: '253,230,138' };
            case 'GREATSWORD': {
                if (p.gsParry && p.gsParry.t > world.time) return { aim: 'dir', R: 185, shape: 'cone', half: 1.2, col: '251,113,133', tag: '💢 PHẢN KÍCH' };
                const i = (p.skills || []).findIndex(s => s.id === 'meleeTech'), held = p.skHeld && p.skHeld[i] && p.skDownAt && world.time - p.skDownAt[i] >= 0.35;
                return held ? { aim: 'point', R: 260, shape: 'point', aoe: 140, arc: true, col: '251,113,133', tag: 'THẢ: NHẢY CHÉM' } : { aim: 'point', R: 260, shape: 'self', aoe: 40, col: '251,113,133', tag: 'CHẠM: THẾ ĐỠ · GIỮ: KÉO LÊ' };
            }
            case 'ROUNDSHIELD': return { aim: 'dir', R: 340, shape: 'line', w: 30, col: '125,211,252' };
            case 'KNIFE': return { aim: 'dir', R: 120, shape: 'line', w: 34, col: '196,181,253' };
            default: return { aim: null }; // Song Đao, Búa, Rìu, Cưa, Khiên, tay không: dùng tại chỗ
        }
    }
    if (id === 'gunMod') {
        switch (w) {
            case 'AR': case 'SAR': return { aim: 'dir', R: 520, shape: 'line', w: 14, col: '251,146,60' };
            case 'SHOTGUN': return { aim: 'dir', R: 520, shape: 'line', w: 12 };
            case 'DUAL': return { aim: 'dir', R: 520, shape: 'line', w: 26, col: '167,139,250' };
            case 'ENERGY': return { aim: 'dir', R: 620, shape: 'line', w: 40, col: '167,139,250' };
            case 'FLAME': return { aim: 'dir', R: 480, shape: 'line', w: 24, endAoe: 85, col: '249,115,22' };
            case 'SNIPER': return { aim: 'dir', R: 1000, shape: 'cone', half: 0.35, col: '165,180,252' };
            case 'REVOLVER': return { aim: 'dir', R: 600, shape: 'cone', half: 0.55, col: '251,191,36' };
            case 'PISTOL': case 'SPISTOL': return { aim: 'dir', R: 420, shape: 'cone', half: 0.45, col: '253,230,138' };
            case 'LAUNCHER': return { aim: 'dir', R: 400, shape: 'cone', half: 0.45, col: '132,204,22' };
            case 'ROCKET': return { aim: 'dir', R: 900, shape: 'cone', half: 0.25, col: '255,122,26' };
            case 'NET': return { aim: 'dir', R: 480, shape: 'cone', half: 0.3 };
            case 'BOOMERANG': return { aim: 'dir', R: 380, shape: 'cone', half: 0.4, col: '245,158,11' };
            case 'BOW': return { aim: 'point', R: 600, shape: 'point', aoe: 120, col: '190,242,100' };
            case 'SMG': case 'MINIGUN': case 'RAILGUN': case 'TESLA': return { aim: null };
            default: return { aim: 'dir', R: 400, shape: 'line', w: 18 };
        }
    }
    return null;
}
function withProfile(p, fn) {
    const saved = [];
    (p.skills || []).forEach(s => {
        const pr = skillProfile(p, s.id); if (!pr) return;
        const c = CARDS[s.id]; saved.push([c, c.aim, c.aimR]); c.aim = pr.aim || undefined; if (pr.R) c.aimR = pr.R;
    });
    try { return fn(); } finally { saved.forEach(([c, a, r]) => { c.aim = a; c.aimR = r; }); }
}
function attachShape(p) {
    const v = p.skillAimView; if (!v) return;
    const s = p.skills && p.skills[v.slot]; const pr = s && skillProfile(p, s.id); if (pr && pr.shape) v.shape = pr;
}
const _handleSkillButtons13 = handleSkillButtons;
handleSkillButtons = function (p, input, allowAct) { const r = withProfile(p, () => _handleSkillButtons13(p, input, allowAct)); attachShape(p); return r; };
const _castSkill13 = castSkill;
castSkill = function (p, slot, aimVec) { return withProfile(p, () => _castSkill13(p, slot, aimVec)); };
const _guestSkillView13 = guestSkillView;
guestSkillView = function (me, inp) { const r = withProfile(me, () => _guestSkillView13(me, inp)); attachShape(me); return r; };

/** Vẽ vùng ngắm đúng hình kỹ năng */
const _drawExtraAim13 = drawExtraAim;
drawExtraAim = function (p, w, now) {
    const v = p.skillAimView;
    if (!v || !v.shape) return _drawExtraAim13(p, w, now);
    const S = v.shape, col = v.cancel ? '248,113,113' : v.ready === false ? '148,163,184' : (S.col || '34,211,238'), R = S.R || v.range, pulse = 0.75 + Math.sin(now * 8) * 0.25;
    ctx.save();
    ctx.strokeStyle = `rgba(${col},0.22)`; ctx.lineWidth = 2; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    if (!v.cancel) {
        if (S.shape === 'line') {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(v.ang);
            const hw = S.w / 2, g = ctx.createLinearGradient(p.radius, 0, R, 0); g.addColorStop(0, `rgba(${col},0.06)`); g.addColorStop(1, `rgba(${col},0.42)`);
            ctx.fillStyle = g; rrect(ctx, p.radius, -hw, R - p.radius, S.w, Math.min(hw, 10)); ctx.fill();
            ctx.strokeStyle = `rgba(${col},${0.9 * pulse})`; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = `rgba(${col},0.95)`; ctx.beginPath(); ctx.moveTo(R + 12, 0); ctx.lineTo(R - 6, -hw - 4); ctx.lineTo(R - 6, hw + 4); ctx.closePath(); ctx.fill();
            ctx.restore();
            if (S.endAoe) { const x = p.x + Math.cos(v.ang) * R, y = p.y + Math.sin(v.ang) * R; ctx.fillStyle = `rgba(${col},0.18)`; ctx.beginPath(); ctx.arc(x, y, S.endAoe, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = `rgba(${col},0.8)`; ctx.stroke(); }
        } else if (S.shape === 'cone') {
            const g = ctx.createRadialGradient(p.x, p.y, p.radius, p.x, p.y, R); g.addColorStop(0, `rgba(${col},0.05)`); g.addColorStop(1, `rgba(${col},0.35)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, R, v.ang - S.half, v.ang + S.half); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = `rgba(${col},${0.9 * pulse})`; ctx.lineWidth = 2; ctx.stroke();
        } else if (S.shape === 'point') {
            const d = Math.min(R, v.d || R), x = p.x + Math.cos(v.ang) * d, y = p.y + Math.sin(v.ang) * d;
            ctx.strokeStyle = `rgba(${col},0.6)`; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(p.x, p.y);
            if (S.arc) ctx.quadraticCurveTo((p.x + x) / 2, (p.y + y) / 2 - d * 0.45, x, y); else ctx.lineTo(x, y);
            ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = `rgba(${col},${0.16 + 0.08 * pulse})`; ctx.beginPath(); ctx.arc(x, y, S.aoe || 70, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(${col},0.95)`; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, (S.aoe || 70) * (0.4 + 0.6 * ((now * 1.5) % 1)), 0, Math.PI * 2); ctx.strokeStyle = `rgba(${col},0.35)`; ctx.stroke();
        } else if (S.shape === 'self') {
            ctx.strokeStyle = `rgba(${col},${0.8 * pulse})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 14, v.ang - 1.2, v.ang + 1.2); ctx.stroke();
        }
        if (S.tag) { ctx.fillStyle = `rgba(${col},1)`; ctx.font = `700 11px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(S.tag, p.x, p.y - p.radius - 40); }
    }
    ctx.restore();
    p.skillAimView = null; try { _drawExtraAim13(p, w, now); } finally { p.skillAimView = v; }
};

/* ============================== HIỆU ỨNG KỸ NĂNG ĐẸP HƠN ============================== */
const WEP_FX_COL = { KATANA: '#7dd3fc', LIGHTSABER: null, RAPIER: '#e0f2fe', SPEAR: '#fde68a', AXE: '#fca5a5', GREATSWORD: '#fb7185', CHAINSAW: '#f97316', ROUNDSHIELD: '#7dd3fc', KNIFE: '#c4b5fd', DAGGERS: '#c084fc', HAMMER: '#d6d3d1', SHIELD: '#93c5fd', NONE: '#fde047' };
function techColor(p) { const id = getCurrentWeapon(p).id; return WEP_FX_COL[id] === null ? saberColor(p) : (WEP_FX_COL[id] || '#fde68a'); }
const _meleeTechCast13 = meleeTechCast;
meleeTechCast = function (p) {
    const col = techColor(p);
    ring(p.x, p.y, 6, 46, col, 0.3, 4); spark(p.x, p.y, col, 10, 220, 0.4, 2);
    p.fxTrailT = world.time + 0.45; p.fxTrailCol = col;
    return _meleeTechCast13(p);
};
const _gunModCast13 = gunModCast;
gunModCast = function (p) {
    const a = aimDir(p), m0 = muzzle(p, getCurrentWeapon(p), a);
    directionalSpark(m0.x, m0.y, a, '#fde68a', 8, 380, 0.4); ring(m0.x, m0.y, 4, 26, '#fef3c7', 0.22, 3);
    return _gunModCast13(p);
};
function updatePolishFx(dt) {
    players.forEach(p => {
        if (p.hp <= 0) return;
        // hư ảnh khi lướt bằng kỹ năng
        if ((p.fxTrailT > world.time || p.star) && Math.random() < 0.9) particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.28, maxLife: 0.28, color: hexA(p.fxTrailCol || p.color, 0.45), size: p.radius * 0.95, glow: true });
    });
    bullets.forEach(b => {
        if (b.fxQi && Math.random() < 0.8) particles.push({ x: b.x - Math.cos(b.angle) * 8, y: b.y - Math.sin(b.angle) * 8, vx: -Math.cos(b.angle) * 40 + (Math.random() - 0.5) * 30, vy: -Math.sin(b.angle) * 40 + (Math.random() - 0.5) * 30, life: 0.3, maxLife: 0.3, color: '#e0f2fe', size: 3, glow: true });
    });
}
const _upe13 = updatePartyExtras;
updatePartyExtras = function (dt) { _upe13(dt); updatePolishFx(dt); };
// đáp đất sau cú nhảy: sóng chấn đẹp hơn
const _landEffect13 = landEffect;
landEffect = function (p, land, o) {
    const r = _landEffect13(p, land, o);
    if (land === 'slam' && o) { const col = o.color || '#fde68a'; ring(p.x, p.y, 14, (o.r || 100) * 1.2, col, 0.45, 8); ring(p.x, p.y, 8, (o.r || 100) * 0.6, '#ffffff', 0.3, 4); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; directionalSpark(p.x + Math.cos(a) * 20, p.y + Math.sin(a) * 20, a, col, 1, 300, 0.5); } addDecal && addDecal(p.x, p.y, (o.r || 100) * 0.5, 'rgba(0,0,0,1)', 0.25, 10); }
    return r;
};
