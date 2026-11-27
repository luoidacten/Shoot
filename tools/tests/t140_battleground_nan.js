const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const logs = new Map();
const one = async (k) => { const pg = await b.newPage({ viewport: { width: 1100, height: 620 } });
  pg.on('console', m => { const t = m.text(); if (t.startsWith('NAN') || t.startsWith('ESTK') || m.type() === 'error') logs.set(t.slice(0, 900), (logs.get(t.slice(0, 900)) || 0) + 1); });
  await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
  await pg.evaluate(() => {
    const ce = console.error.bind(console); let n = 0;
    console.error = function (...a) { if (n++ < 4) console.log('ESTK ' + a.map(x => x && x.stack ? x.stack.split('\n').slice(0, 7).join(' | ') : String(x)).join(' ')); return ce(...a); };
    window.__botBoth = true; startBattleground();
    const seen = new Set();
    setInterval(() => {
      if (gameState !== 'PLAYING') return;
      players.forEach(p => { const bad = ['x', 'y', 'hp', 'kx', 'ky', 'vx', 'vy', 'angle', 'radius', 'airH'].filter(k => typeof p[k] === 'number' && !isFinite(p[k])); if (bad.length && !seen.has('p' + p.id)) { seen.add('p' + p.id); const w = getCurrentWeapon(p); console.log(`NAN player ${p.id} [${bad}] x=${p.x} hp=${p.hp} wep=${w && w.id}${w && w.mods ? ':' + w.mods : ''} adv=${p.adv} build=${p.build} isBot=${p.isBot} travel=${JSON.stringify(p.travel)} form=${p.form && p.form.kind}`); } });
      for (const [name, arr] of [['bullets', bullets], ['items', items], ['zones', zones], ['W13', W13], ['W17', W17], ['strikes', strikes], ['decoys', decoys]]) arr.forEach(o => { if (o && ['x', 'y', 'r'].some(k => typeof o[k] === 'number' && !isFinite(o[k]))) { const key = name + ':' + (o.kind || (o.type && (o.type.id || o.type))); if (!seen.has(key)) { seen.add(key); console.log(`NAN ${key} ${JSON.stringify(o, (kk, v) => typeof v === 'number' && !isFinite(v) ? 'NaN!' : v).slice(0, 300)}`); } } });
    }, 50);
  });
  await pg.waitForTimeout(170000); await pg.close(); };
await Promise.all([one(1), one(2), one(3)]);
console.log([...logs].map(([k, n]) => `×${n} ${k}`).join('\n') || 'không thấy NaN'); await b.close(); })();
