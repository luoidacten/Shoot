const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await b.newPage(); const errs = [];
pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await pg.goto('http://localhost:8765/index.html'); await pg.waitForTimeout(800);
const run = async (online) => pg.evaluate(async (online) => {
  settings.mode = 'bot'; settings.count = 4; startMatch(); await new Promise(r => setTimeout(r, 500));
  net.role = online ? 'host' : null; const _ns = netSend; netSend = () => {};
  const more = DESTINIES.find(d => d.more); currentDestiny = more; const n0 = players.length;
  initRound(); const n1 = players.length, name1 = currentDestiny.name;
  // đường quay biến cố: ép Math.random bốc đúng "more"
  const idx = DESTINIES.indexOf(more), R = Math.random; currentRound = 2;
  Math.random = () => (idx - 1 + 0.5) / (DESTINIES.length - 1); let rolled;
  augState.phase = null; try { startDestinyIntro(); } finally { Math.random = R; } await new Promise(r => setTimeout(r, 300)); rolled = gameState + ':' + currentDestiny.name + ' · banner=' + ((document.getElementById('destiny-name')||{}).textContent || [...document.querySelectorAll('[id*=destiny]')].map(e=>e.textContent.slice(0,40)).join('/'));
  netSend = _ns; net.role = null;
  return `${online ? 'ONLINE ' : 'OFFLINE'}: người ${n0}→${n1}, biến cố hiệp="${name1}", quay ra="${rolled}"`;
}, online);
console.log(await run(false)); console.log(await run(true));
console.log(errs.join('\n') || 'NO ERRORS'); await b.close(); })();
