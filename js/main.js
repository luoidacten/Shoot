/** ==================== KHỞI ĐỘNG & VÒNG LẶP ==================== */
let lastTime = 0;

function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000 || 0, 0.05);
    lastTime = ts;
    requestAnimationFrame(loop); // đăng ký trước để một lỗi bất ngờ không làm đứng game
    try {
        pollGamepadMenus();
        update(dt);
        draw();
    } catch (err) { console.error(err); }
}

// Ẩn tab → tự tạm dừng
document.addEventListener('visibilitychange', () => { if (document.hidden && ['PLAYING', 'COUNTDOWN', 'KO'].includes(gameState)) togglePause(true); });

// Mở khóa âm thanh ở lần chạm đầu tiên (yêu cầu của trình duyệt di động)
window.addEventListener('pointerdown', () => AudioSys.init(), { once: true });

// Hook gỡ lỗi (dùng khi test tự động)
window.__game = { players, world, crates, bullets, settings, get state() { return gameState; } };

requestAnimationFrame(loop);
