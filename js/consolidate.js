/** ==================== GỘP NHÓM THẺ "BẢNG CHIẾN THUẬT" ====================
 *  Chỉ còn 5 thẻ chính xuất hiện khi chọn. 21 thẻ còn lại chỉ có được qua PHỐI HỢP:
 *   - Kỹ năng biến thể: ghép thẻ chính + 1 thẻ ngoài nhóm → kỹ năng chính được nâng cấp thành biến thể.
 *   - Nội tại hỗ trợ: ghép 2 thẻ ngoài nhóm → được tặng thêm nội tại đó.
 */
const TAC_MAIN = ['airstrike', 'artyCall', 'tacSmoke', 'uavScan', 'structWall'];
const TAC_GRANTS = [
    // Không Kích → các đợt máy bay
    { a: 'airstrike', b: 'killStreak', grant: 'carpetBomb' },
    { a: 'airstrike', b: 'flameTurret', grant: 'napalmStrike' },
    { a: 'airstrike', b: 'commander', grant: 'sweepStrike' },
    // Pháo Kích → đòn một điểm cực mạnh
    { a: 'artyCall', b: 'phoenix', grant: 'incendiary' },
    { a: 'artyCall', b: 'explosiveTurret', grant: 'clusterBomb' },
    { a: 'artyCall', b: 'glassCannon', grant: 'orbitalStrike' },
    // Khói Chiến Thuật → khói diện rộng
    { a: 'tacSmoke', b: 'phaseWalk', grant: 'smokeCut' },
    { a: 'tacSmoke', b: 'ghostForm', grant: 'blanketSmoke' },
    // Trinh Sát UAV → vệ tinh & tiếp viện
    { a: 'uavScan', b: 'precision', grant: 'orbitalLaser' },
    { a: 'uavScan', b: 'packLeader', grant: 'paraSquad' },
    { a: 'uavScan', b: 'scrapper', grant: 'airSupply' },
    // Cấu Trúc Hoá → các đòn chọn ô lưới
    { a: 'structWall', b: 'markShot', grant: 'markCells' },
    { a: 'structWall', b: 'portal', grant: 'gravCells' },
    { a: 'structWall', b: 'fortress', grant: 'cageCell' },
    // Nội tại hỗ trợ (ghép 2 thẻ ngoài nhóm)
    { a: 'hotBarrel', b: 'overclockT', grant: 'fastComms' },
    { a: 'engineer', b: 'periscope', grant: 'radioman' },
    { a: 'hightech', b: 'adaptive', grant: 'quickLink' },
    { a: 'sixthSense', b: 'catEye', grant: 'silentTab' },
    { a: 'decoyCrate', b: 'scarecrow', grant: 'decoySignal' },
    { a: 'thermal', b: 'backSight', grant: 'eavesdrop' },
    { a: 'elsu', b: 'deadeye', grant: 'satLink' },
    { a: 'scout', b: 'wideLens', grant: 'miniMapCard' },
    { a: 'hollowPoint', b: 'growth', grant: 'bigPayload' },
    { a: 'headshot', b: 'focusBeam', grant: 'targetPainter' },
    { a: 'bulletArmor', b: 'fullHp', grant: 'bunker' }
].filter(g => CARDS[g.a] && CARDS[g.b] && CARDS[g.grant]);

(function consolidateTactical() {
    const merged = new Set(TAC_GRANTS.map(g => g.grant));
    // 1) bỏ các phối hợp cũ dính tới thẻ bị gộp (chúng không còn tự xuất hiện nữa)
    for (let i = COMBOS.length - 1; i >= 0; i--) if (merged.has(COMBOS[i].a) || merged.has(COMBOS[i].b)) COMBOS.splice(i, 1);
    // 2) thêm phối hợp mở khoá
    TAC_GRANTS.forEach(g => {
        const G = CARDS[g.grant], up = G.kind === 'S' && TAC_MAIN.includes(g.a) ? g.a : null;
        COMBOS.push({ id: 'g_' + g.grant, a: g.a, b: g.b, name: G.name, grant: g.grant, upgrade: up,
            desc: (up ? `${CARDS[up].name} nâng cấp thành ${G.icon} ${G.name}: ` : `Nhận thêm nội tại ${G.icon} ${G.name}: `) + G.desc.replace(/<[^>]+>/g, '') });
        G.comboOnly = true;
    });
    // 3) dựng lại bảng tra phối hợp
    for (const k in COMBOS_OF) delete COMBOS_OF[k];
    COMBOS.forEach(c => { (COMBOS_OF[c.a] = COMBOS_OF[c.a] || []).push(c); (COMBOS_OF[c.b] = COMBOS_OF[c.b] || []).push(c); });
    for (const id in COMBOS_OF) if (COMBOS_OF[id].length > 3) console.warn('Thẻ có hơn 3 phối hợp:', id, COMBOS_OF[id].length);
})();

/** Áp phần thưởng của phối hợp mở khoá mỗi hiệp: tặng nội tại / nâng cấp kỹ năng chính */
const _applyBuildTac = applyBuild;
applyBuild = function (p) {
    _applyBuildTac(p);
    COMBOS.forEach(c => {
        if (!c.grant || !p.comboSet || !p.comboSet.has(c.id)) return;
        const G = CARDS[c.grant];
        p.cardSet.add(c.grant);
        if (G.kind === 'P' && G.apply) G.apply(p);
        if (c.upgrade && p.skills) { const s = p.skills.find(q => q.id === c.upgrade); if (s) s.id = c.grant; }
    });
};
