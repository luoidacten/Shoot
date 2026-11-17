/** ==================== CẤU HÌNH CHUNG ==================== */
const MAP_W = 2400;
const MAP_H = 1800;

const COLORS = {
    p1: '#ff4d5e', p2: '#3ba8ff',
    bg: '#05060f', floor: '#0a0d1c', grid: 'rgba(120, 140, 200, 0.06)',
    wall: '#1b2237', wallTop: '#2a3452', wallEdge: '#3d4a70',
    wood: '#5a3b22', woodTop: '#7a5230', woodEdge: '#a06c3c',
    bullet: '#ffe48a', armor: '#5ad1ff', gold: '#ffd23f',
    crate_wep: '#f59e0b', crate_sup: '#10b981', crate_trap: '#f59e0b', zone: '#a855f7'
};


// Vũ khí đã chuyển sang js/weapons.js

/** ==================== VẬN MỆNH ==================== */
const DESTINIES = [
    { name:'NGÀY BÌNH YÊN',       desc:'Không có gì đặc biệt. Sự bình yên trước cơn bão…', apply: () => {} },
    { name:'CƠN MƯA THÍNH',       desc:'Giao hàng tận răng! 24 hòm thính rơi xuống ngay lập tức.', apply: () => { for (let i = 0; i < 24; i++) spawnCrate(true); } },
    { name:'NGÀY TẬN THẾ',        desc:'Mưa sao băng trút xuống liên tục. Nhìn vòng đỏ mà chạy!', apply: () => { world.meteorRate = 1.4; } },
    { name:'ĐẤU TRƯỜNG CHẾT CHÓC',desc:'Mọi người chỉ còn 1 MÁU. Một chạm là bay màu!', apply: () => { players.forEach(p => { p.hp = 1; p.maxHp = 1; p.armor = 0; p.trickster = false; }); } },
    { name:'SÂN BÊ TÔNG',         desc:'Không còn chỗ nấp. Mọi vật cản bị xóa sổ!', apply: () => { obstacles.length = 0; } },
    { name:'SƯƠNG MÙ DÀY ĐẶC',    desc:'Tầm nhìn thu hẹp cực độ. Kẻ thù có thể ngay sau lưng.', apply: () => { world.darkness = true; } },
    { name:'ĐUA XE F1',           desc:'Tốc độ di chuyển của tất cả x2.2! Chóng mặt chưa?', apply: () => { players.forEach(p => p.moveMult *= 2.2); } },
    { name:'CĂN PHÒNG CHẬT HẸP',  desc:'Cả hai bị đặt sát nhau ngay giây đầu tiên. Chém!', apply: () => {
        obstacles.splice(0, obstacles.length, ...obstacles.filter(o => Math.abs(o.x + o.w/2 - MAP_W/2) > 260 || Math.abs(o.y + o.h/2 - MAP_H/2) > 160));
        players[0].x = MAP_W/2 - 110; players[0].y = MAP_H/2; players[1].x = MAP_W/2 + 110; players[1].y = MAP_H/2;
        world.zoneDelay = 8;
    } },
    { name:'SÂN BĂNG',            desc:'Mặt đất trơn như mỡ. Phanh gấp là không có cửa!', apply: () => { world.ice = true; } },
    { name:'ĐẠN VÔ HẠN',          desc:'Không bao giờ hết đạn. Xả thoải mái!', apply: () => { world.infiniteAmmo = true; } },
    { name:'KHO BÁU HUYỀN THOẠI', desc:'Mỗi người được tặng một vũ khí huyền thoại ngay khi bắt đầu.', apply: () => { players.forEach(p => { p.inventory[1] = { ...WEAPONS[LEGEND_POOL[Math.floor(Math.random()*2)]] }; }); } },
    { name:'VÒNG BO TỬ THẦN',     desc:'Vòng bo thu hẹp ngay lập tức và nhanh gấp đôi!', apply: () => { world.zoneDelay = 2; world.zoneSpeed = 2; } }
];
