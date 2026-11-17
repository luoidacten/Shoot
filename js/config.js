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


/** Vũ khí — tier dùng để quyết định ưu tiên nhặt */
const WEAPONS = {
    NONE:    { id:'NONE',    name:'Tay không', icon:'✊', type:'MELEE', color:'transparent', damage:8,  fireRate:20, range:28, moveScale:1.2, width:0, len:0, tier:0 },
    KNIFE:   { id:'KNIFE',   name:'Dao',       icon:'🔪', type:'MELEE', color:'#cbd5e1', damage:35, fireRate:24, range:46, durability:6, maxDurability:6, moveScale:1.1, width:4, len:14, tier:1 },
    PISTOL:  { id:'PISTOL',  name:'Súng lục',  icon:'🔫', type:'GUN', color:'#94a3b8', damage:16, fireRate:13, speed:19, spread:0.05, range:520, ammo:12, moveScale:1.0, width:4, len:13, tier:2 },
    SMG:     { id:'SMG',     name:'SMG',       icon:'💨', type:'GUN', color:'#fbbf24', damage:7,  fireRate:5,  speed:21, spread:0.3, range:460, ammo:50, moveScale:0.92, width:3, len:11, automatic:true, tier:3 },
    SHOTGUN: { id:'SHOTGUN', name:'Shotgun',   icon:'💥', type:'GUN', color:'#e11d48', damage:12, fireRate:40, speed:16, spread:0.42, range:340, ammo:8, count:7, moveScale:0.86, width:6, len:17, tier:3, knock:220 },
    SNIPER:  { id:'SNIPER',  name:'Bắn tỉa',   icon:'🎯', type:'GUN', color:'#a855f7', damage:95, fireRate:60, speed:46, spread:0.0, range:2500, ammo:3, moveScale:0.55, width:5, len:36, pierce:true, tier:4, knock:300 },
    ROCKET:  { id:'ROCKET',  name:'Pháo',      icon:'🚀', type:'GUN', color:'#1f2937', damage:0,  fireRate:60, speed:12, spread:0.0, range:2000, ammo:2, explosive:true, moveScale:0.7, width:10, len:22, tier:4 },
    KATANA:  { id:'KATANA',  name:'Katana',    icon:'⚔️', type:'MELEE', color:'#38bdf8', damage:55, fireRate:38, range:92, durability:10, maxDurability:10, moveScale:1.05, width:4, len:36, dash:true, tier:3 },
    SHIELD:  { id:'SHIELD',  name:'Khiên',     icon:'🛡️', type:'SHIELD', color:'#64748b', damage:15, fireRate:30, range:30, durability:200, maxDurability:200, moveScale:0.82, width:8, len:20, tier:2 },
    GRENADE: { id:'GRENADE', name:'Lựu đạn',   icon:'💣', type:'THROWABLE', color:'#10b981', damage:0, fireRate:30, range:450, ammo:3, moveScale:1.0, width:8, len:8, tier:2 },
    // Huyền thoại — chỉ có trong THÍNH VÀNG
    MINIGUN: { id:'MINIGUN', name:'Minigun',   icon:'🌪️', type:'GUN', color:'#f97316', damage:6,  fireRate:2.5, speed:24, spread:0.22, range:520, ammo:160, moveScale:0.6, width:7, len:26, automatic:true, tier:5, legendary:true },
    RAILGUN: { id:'RAILGUN', name:'Railgun',   icon:'⚡', type:'GUN', color:'#22d3ee', damage:85, fireRate:45, range:2600, ammo:4, moveScale:0.8, width:6, len:32, hitscan:true, tier:5, legendary:true, knock:350 }
};

const BASE_WEIGHTS = { SMG: 28, SHOTGUN: 26, PISTOL: 16, GRENADE: 14, SNIPER: 9, KATANA: 10, SHIELD: 7, ROCKET: 5 };
const LEGEND_POOL = ['MINIGUN', 'RAILGUN', 'ROCKET', 'SNIPER'];

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
