/** ==================== ÂM THANH (tổng hợp bằng WebAudio, không cần file) ==================== */
const AudioSys = {
    ctx: null, master: null, sfx: null, music: null, noise: null,
    sfxOn: true, musicOn: true,
    lastPlay: {},

    init() {
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            this.ctx = new AC();
            const comp = this.ctx.createDynamicsCompressor();
            comp.threshold.value = -14; comp.ratio.value = 6;
            this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
            this.sfx = this.ctx.createGain(); this.sfx.gain.value = 1;
            this.music = this.ctx.createGain(); this.music.gain.value = 0.35;
            this.sfx.connect(comp); this.music.connect(comp); comp.connect(this.master); this.master.connect(this.ctx.destination);
            const len = this.ctx.sampleRate;
            this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const d = this.noise.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },

    setSfx(on) { this.sfxOn = on; if (this.sfx) this.sfx.gain.value = on ? 1 : 0; },
    setMusic(on) { this.musicOn = on; if (this.music) this.music.gain.value = on ? 0.35 : 0; },

    tone(type, f0, f1, dur, vol, t, dest) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, t);
        if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        o.connect(g); g.connect(dest || this._dest || this.sfx); o.start(t); o.stop(t + dur + 0.02);
    },
    burst(dur, vol, freq, t, type = 'lowpass', dest) {
        const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
        s.buffer = this.noise; f.type = type; f.frequency.value = freq;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        s.connect(f); f.connect(g); g.connect(dest || this._dest || this.sfx);
        s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    },

    /** Âm thanh định vị: to/nhỏ theo khoảng cách, lệch trái/phải theo hướng so với người nghe */
    playAt(type, x, y, vol = 0.25, range = 1500) {
        if (!this.ctx) return;
        const me = typeof localPlayer === 'function' ? localPlayer() : null;
        if (!me) return this.play(type, vol);
        const d = dist(me.x, me.y, x, y), att = 1 - d / range;
        if (typeof onHeard === 'function') onHeard(type, x, y);
        if (att <= 0.02) return;
        const pan = Math.max(-1, Math.min(1, (x - me.x) / 450));
        net.mute++;
        try { this.play(type, vol * att * att * (type === 'step' ? 1 : 0.6 + 0.4 / Math.max(0.3, att)), pan); } finally { net.mute--; }
    },

    play(type, vol = 0.25, pan = 0) {
        if (!this.ctx || !this.sfxOn) return;
        const t = this.ctx.currentTime;
        // chống dồn âm: giới hạn tần suất của cùng một loại âm thanh
        const gap = { shoot: 0.03, hit: 0.04, smg: 0.035, ui: 0.03, step: 0.04 }[type] || 0;
        if (gap && this.lastPlay[type] && t - this.lastPlay[type] < gap) return;
        this.lastPlay[type] = t;
        this._dest = null;
        if (pan && this.ctx.createStereoPanner) { const pn = this.ctx.createStereoPanner(); pn.pan.value = pan; pn.connect(this.sfx); this._dest = pn; }
        const rp = 0.92 + Math.random() * 0.16; // biến thiên cao độ nhẹ cho đỡ nhàm

        switch (type) {
            case 'shoot': this.tone('square', 520 * rp, 120, 0.09, vol * 0.6, t); this.burst(0.06, vol * 0.8, 3500, t, 'highpass'); break;
            case 'smg': this.tone('square', 700 * rp, 200, 0.05, vol * 0.4, t); this.burst(0.04, vol * 0.6, 4000, t, 'highpass'); break;
            case 'shotgun': this.burst(0.25, vol * 1.6, 1400, t); this.tone('sawtooth', 160, 40, 0.2, vol, t); break;
            case 'shoot_heavy': this.tone('sawtooth', 240 * rp, 40, 0.35, vol * 1.2, t); this.burst(0.3, vol * 1.2, 900, t); break;
            case 'rail': this.tone('sine', 2200, 300, 0.4, vol * 0.8, t); this.tone('sawtooth', 110, 55, 0.5, vol, t); this.burst(0.15, vol, 6000, t, 'highpass'); break;
            case 'swing': this.burst(0.12, vol * 0.7, 2200 * rp, t, 'bandpass'); break;
            case 'hit': this.tone('triangle', 320 * rp, 70, 0.1, vol * 0.9, t); this.burst(0.05, vol * 0.6, 1800, t); break;
            case 'crit': this.tone('square', 900, 200, 0.15, vol * 0.6, t); this.tone('triangle', 200, 50, 0.2, vol, t); break;
            case 'block': this.tone('square', 1400 * rp, 900, 0.06, vol * 0.5, t); this.tone('sine', 2600, 2000, 0.12, vol * 0.3, t); break;
            case 'explosion':
                this.burst(0.9, vol * 2.2, 700, t); this.tone('sine', 120, 25, 0.8, vol * 2, t); this.tone('square', 80, 20, 0.4, vol * 0.6, t); break;
            case 'pickup': [523, 659, 784].forEach((f, i) => this.tone('triangle', f, f, 0.1, vol * 0.6, t + i * 0.06)); break;
            case 'legend': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone('square', f, f, 0.14, vol * 0.35, t + i * 0.07)); break;
            case 'ui': this.tone('square', 660, 660, 0.04, vol * 0.4, t); break;
            case 'select': this.tone('triangle', 440, 880, 0.12, vol * 0.6, t); break;
            case 'tick': this.tone('sine', 1500, 1500, 0.04, vol * 0.5, t); break;
            case 'count': this.tone('square', 440, 440, 0.15, vol * 0.5, t); break;
            case 'go': this.tone('square', 880, 880, 0.35, vol * 0.5, t); this.tone('sawtooth', 220, 220, 0.4, vol * 0.4, t); break;
            case 'heart': this.tone('sine', 70, 40, 0.12, vol * 1.4, t); this.tone('sine', 60, 35, 0.12, vol * 1.1, t + 0.16); break;
            case 'alarm': this.tone('sawtooth', 500, 900, 0.3, vol * 0.4, t); this.tone('sawtooth', 500, 900, 0.3, vol * 0.4, t + 0.35); break;
            case 'ko': this.tone('sawtooth', 300, 30, 1.2, vol * 1.2, t); this.burst(1.0, vol * 1.5, 500, t); this.tone('sine', 60, 30, 1.5, vol * 1.5, t); break;
            case 'trick': this.tone('sine', 300, 1200, 0.3, vol * 0.6, t); this.tone('sine', 1200, 300, 0.3, vol * 0.4, t + 0.3); break;
            case 'destiny':
                this.tone('sine', 220, 440, 1.6, vol * 0.8, t); this.tone('triangle', 330, 660, 1.6, vol * 0.4, t); break;
            case 'slam': this.tone('sawtooth', 110, 40, 0.6, vol * 1.2, t); this.burst(0.4, vol, 1200, t); this.tone('square', 880, 880, 0.2, vol * 0.3, t); break;
            case 'win': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone('square', f, f, 0.25, vol * 0.4, t + i * 0.12)); break;
            case 'whoosh': this.burst(0.5, vol * 0.8, 600, t, 'bandpass'); break;
            case 'reload': this.tone('square', 300, 300, 0.05, vol * 0.4, t); this.tone('square', 500, 500, 0.05, vol * 0.4, t + 0.12); this.burst(0.05, vol * 0.4, 3000, t + 0.06, 'highpass'); break;
            case 'step': this.burst(0.06, vol, 380 * rp, t); this.tone('sine', 95 * rp, 45, 0.07, vol * 0.7, t); break;
        }
        this._dest = null;
    },

    /** ---------- Nhạc nền procedural ---------- */
    seq: { on: false, step: 0, next: 0, intensity: 0, timer: null },
    startMusic() {
        if (!this.ctx || this.seq.on) return;
        this.seq.on = true; this.seq.step = 0; this.seq.next = this.ctx.currentTime + 0.1;
        this.seq.timer = setInterval(() => this.schedule(), 50);
    },
    stopMusic() { this.seq.on = false; clearInterval(this.seq.timer); },
    setIntensity(i) { this.seq.intensity = i; },
    schedule() {
        if (!this.seq.on || !this.ctx) return;
        const bpm = [108, 124, 146][this.seq.intensity] || 108;
        const stepDur = 60 / bpm / 4;
        const bass = [0, 0, 7, 0, 3, 0, 10, 7, 0, 0, 7, 0, 5, 3, 2, 3];
        const root = [55, 55, 49, 52][Math.floor(this.seq.step / 64) % 4];
        while (this.seq.next < this.ctx.currentTime + 0.15) {
            const s = this.seq.step % 16, t = this.seq.next, I = this.seq.intensity;
            if (s % 4 === 0) this.tone('sine', 140, 40, 0.22, 0.7, t, this.music);                          // kick
            if (I >= 1 && (s === 4 || s === 12)) this.burst(0.14, 0.35, 1800, t, 'bandpass', this.music);  // snare
            if (s % 2 === 1 || I >= 2) this.burst(0.03, I >= 2 ? 0.14 : 0.09, 8000, t, 'highpass', this.music); // hat
            const n = bass[s];
            if (s % 2 === 0 || I >= 1) this.tone('sawtooth', root * Math.pow(2, n / 12), root * Math.pow(2, n / 12), stepDur * 0.9, 0.12, t, this.music);
            if (I >= 2 && s % 4 === 2) this.tone('square', root * 4 * Math.pow(2, bass[(s + 5) % 16] / 12), root * 4, stepDur, 0.04, t, this.music);
            this.seq.next += stepDur; this.seq.step++;
        }
    }
};
