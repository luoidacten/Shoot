'use strict';
/* =====================================================================
 *  GỌN LẠI THẺ BẢNG CHIẾN THUẬT
 *  19 thẻ gọi hoả lực bằng bảng → chỉ giữ 5 thẻ ĐẶC TRƯNG trong bộ bài.
 *  14 thẻ còn lại thành THẺ PHỐI HỢP: không bốc ngẫu nhiên được, chỉ hiện ra khi bạn
 *  đã có thẻ chính + đúng thẻ ghép; chọn thẻ phối hợp sẽ THAY thẻ chính (giữ thẻ ghép).
 *  Nạp sau cells.js. Dùng lại hệ thống .evo (tiến hoá) có sẵn trong tactics.js.
 * ===================================================================== */
const TAC_MAIN = ['airstrike', 'tacSmoke', 'paraSquad', 'structWall', 'markCells'];
const FUSE = {
    // ✈️ Không Kích
    carpetBomb:   ['airstrike', 'bigPayload'],
    napalmStrike: ['airstrike', 'lavaWalker'],
    clusterBomb:  ['airstrike', 'explosive'],
    orbitalLaser: ['airstrike', 'targetPainter'],
    // 🌫️ Khói Chiến Thuật
    smokeCut:     ['tacSmoke', 'radioman'],
    blanketSmoke: ['tacSmoke', 'silentSmoke'],
    uavScan:      ['tacSmoke', 'controlEye'],
    // 🪂 Lính Nhảy Dù
    airSupply:    ['paraSquad', 'scavenger'],
    sweepStrike:  ['paraSquad', 'commander'],
    // 🧱 Cấu Trúc Hoá Chiến Thuật
    cageCell:     ['structWall', 'trapper'],
    // 🎯 Đánh Dấu Ô
    gravCells:    ['markCells', 'bunker'],
    artyCall:     ['markCells', 'fastComms'],
    orbitalStrike:['markCells', 'satLink'],
    incendiary:   ['markCells', 'pyro'],
};
for (const id in FUSE) {
    if (!CARDS[id] || !FUSE[id].every(n => CARDS[n])) { console.warn('Thiếu thẻ phối hợp:', id, FUSE[id]); continue; }
    CARDS[id].evo = { need: FUSE[id], replaces: FUSE[id][0] };
    CARDS[id].fuse = true;
}
/** các thẻ phối hợp mà thẻ này góp phần tạo ra */
function fusesOf(id) { return Object.keys(FUSE).filter(f => CARDS[f] && CARDS[f].fuse && FUSE[f].includes(id)); }

const _cardHTML25 = cardHTML;
cardHTML = function (id, kind, owned, keyLabel) {
    if (kind === 'stat' || kind === 'adv' || kind === 'spell' || !CARDS[id]) return _cardHTML25(id, kind, owned, keyLabel);
    const c = CARDS[id];
    if (c.fuse) {
        const [a, b] = c.evo.need;
        return `<span class="aug-key">${keyLabel || ''}</span><span class="aug-rarity tag-S">THẺ PHỐI HỢP · ${c.cd}s</span><div class="aug-icon">${c.icon}</div><div class="aug-name">${c.name}</div><div class="aug-desc">${c.desc}</div><div class="combos"><div class="combo on">🔗 ${CARDS[a].icon} ${CARDS[a].name} + ${CARDS[b].icon} ${CARDS[b].name}<i>Thay thế ${CARDS[a].name}, giữ ${CARDS[b].name}.</i></div></div>`;
    }
    let html = _cardHTML25(id, kind, owned, keyLabel);
    const fs = fusesOf(id);
    if (fs.length) {
        const own = new Set(owned || []);
        const rows = fs.map(f => {
            const other = FUSE[f][0] === id ? FUSE[f][1] : FUSE[f][0], on = own.has(other);
            return `<div class="combo ${on ? 'on' : ''}">🧬 <b>${CARDS[f].icon} ${CARDS[f].name}</b> <span>+ ${CARDS[other].icon} ${CARDS[other].name}</span></div>`;
        }).join('');
        html += `<div class="combos">${rows}</div>`;
    }
    return html;
};
const _cardClass25 = cardClass;
cardClass = function (id, kind, owned) {
    if (kind !== 'stat' && kind !== 'adv' && kind !== 'spell' && CARDS[id] && CARDS[id].fuse) return 'skill legend evo';
    return _cardClass25(id, kind, owned);
};
