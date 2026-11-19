/** ==================== ICON VẼ BỞI GEMINI (atlas assets/icons.webp) ====================
 *  Thẻ (S/P), phép bổ trợ (sp:id), vật phẩm (it:id). Chưa có icon thì vẫn dùng emoji cũ.
 */
const GICON = { img: new Image(), map: null, cell: 96, cols: 16, rows: 1, ready: false };
fetch('assets/icons.json?v=2', { cache: 'no-cache' }).then(r => r.json()).then(j => {
    GICON.map = j.ids; GICON.cell = j.cell; GICON.cols = j.cols;
    GICON.img.onload = () => {
        GICON.rows = Math.round(GICON.img.height / GICON.cell); GICON.ready = true;
        document.documentElement.style.setProperty('--gicon-size', `${GICON.cols * 100}% ${GICON.rows * 100}%`);
    };
    GICON.img.src = 'assets/icons.webp?v=2';
}).catch(() => {});
function iconKey(kind, id) { return kind === 'spell' ? 'sp:' + id : kind === 'item' ? 'it:' + id : id; }
function hasIcon(key) { return GICON.ready && GICON.map && GICON.map[key] !== undefined; }
/** Chuỗi đánh dấu cho các hàm vẽ chữ trên canvas: '#ic:key' (nếu có icon) hoặc emoji gốc */
function ic(kind, id, fallback) { const k = iconKey(kind, id); return hasIcon(k) ? '#ic:' + k : fallback; }
function drawGIcon(c, key, x, y, size, alpha = 1) {
    const i = GICON.map[key], s = GICON.cell;
    c.save(); c.globalAlpha *= alpha;
    c.drawImage(GICON.img, (i % GICON.cols) * s, Math.floor(i / GICON.cols) * s, s, s, x - size / 2, y - size / 2, size, size);
    c.restore();
}
function giconHTML(key, fallback) {
    if (!hasIcon(key)) return fallback;
    const i = GICON.map[key], col = i % GICON.cols, row = Math.floor(i / GICON.cols);
    const px = GICON.cols > 1 ? col / (GICON.cols - 1) * 100 : 0, py = GICON.rows > 1 ? row / (GICON.rows - 1) * 100 : 0;
    return `<span class="gicon" style="background-position:${px}% ${py}%"></span>`;
}

/* ---------- Canvas: nút bấm nhận '#ic:key' ---------- */
const _lqButtonIc = lqButton;
lqButton = function (b, pressed, icon, sub, cd, accent) {
    if (typeof icon === 'string' && icon.startsWith('#ic:')) {
        _lqButtonIc(b, pressed, '', sub, cd, accent);
        const r = b.r * (pressed ? 0.93 : 1), y = sub !== '' && !(cd > 0) ? b.y - r * 0.12 : b.y;
        drawGIcon(ctx, icon.slice(4), b.x, y, r * 1.55, cd > 0 ? 0.55 : 1);
        if (cd > 0 && sub !== '') { // vẽ lại số hồi chiêu đè lên icon
            ctx.save(); ctx.font = `700 ${Math.round(r * 0.55)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(sub, b.x, b.y + 2); ctx.fillStyle = '#fde68a'; ctx.fillText(sub, b.x, b.y + 2); ctx.restore();
        }
        return;
    }
    return _lqButtonIc(b, pressed, icon, sub, cd, accent);
};

/* ---------- DOM: thẻ chọn nâng cấp & hàng thẻ đã có ---------- */
const _cardHTMLIc = cardHTML;
cardHTML = function (id, kind, owned, keyLabel, ...rest) {
    const html = _cardHTMLIc(id, kind, owned, keyLabel, ...rest);
    const key = pickKey(id, kind);
    if (!key || !hasIcon(key)) return html;
    return html.replace(/<div class="(aug-icon|tile-icon)">[^<]*<\/div>/, (m, cls) => `<div class="${cls}">${giconHTML(key, '')}</div>`);
};
function pickKey(id, kind) { return kind === 'spell' ? 'sp:' + id : kind === 'adv' ? 'adv:' + id : kind === 'solo' ? 'solo:' + id : CARDS[id] ? id : null; }
/* Ô chọn nhanh trên bảng chiến thuật (tactics.js) */
if (typeof pickIcon === 'function') {
    const _pickIconIc = pickIcon;
    pickIcon = function (id, kind) { const k = pickKey(id, kind), e = _pickIconIc(id, kind); return k && hasIcon(k) ? giconHTML(k, e) : e; };
}
const _ownedRowHTMLIc = ownedRowHTML;
ownedRowHTML = function (build, ...rest) {
    let html = _ownedRowHTMLIc(build, ...rest), i = 0;
    return html.replace(/<span class="own (\w+)">[^<]*<\/span>/g, (m, k) => { const id = (build || [])[i++]; return id && hasIcon(id) ? `<span class="own ${k}">${giconHTML(id, '')}</span>` : m; });
};
