const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('CONSOLE ' + m.text()); });
  await pg.goto('http://localhost:8765/index.html');
  await pg.evaluate(() => { window.__botBoth = true; settings.mode = 'bot'; settings.count = 4; startMatch(); });
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    await pg.waitForTimeout(1000);
    const s = await pg.evaluate(() => `${gameState}|r${currentRound}|ph:${augState.phase ? augState.phase.kind : '-'}|${$('aug-score').textContent}`);
    if (!seen.has(s)) { seen.add(s); console.log(i, s); }
    if (s.startsWith('GAMEOVER')) break;
  }
  console.log(await pg.evaluate(() => JSON.stringify(players.map(p => ({ id: p.id, adv: p.adv, spells: (p.spells || []).map(s => s.id), build: p.build, score: p.score })))));
  console.log(errs.slice(0, 15).join('\n') || 'NO ERRORS');
  await b.close();
})();
