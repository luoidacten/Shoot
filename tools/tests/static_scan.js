const fs = require('fs'), path = require('path');
const NM = '/opt/node-tools/node_modules/';
const acorn = require(NM + 'acorn'), walk = require(NM + 'acorn-walk');
const ROOT = '/home/user/Shoot/';
const order = fs.readFileSync(ROOT + 'index.html', 'utf8').match(/src="js\/[a-z0-9_]+\.js/g).map(s => s.slice(5));
const ev = {}; // name -> events
const saved = {}; // savedVar -> origName
const mapKeys = {}; // "MAP.KEY" -> [files]
const defs = {}; // defS/defP id -> files
const parseErr = [];
const add = (n, e) => (ev[n] = ev[n] || []).push(e);
const ASTS = {};
for (const f of order) {
  const src = fs.readFileSync(ROOT + f, 'utf8'); let ast;
  try { ast = acorn.parse(src, { ecmaVersion: 2023, sourceType: 'script', locations: true }); } catch (e) { parseErr.push(f + ': ' + e.message); continue; }
  ASTS[f] = { ast, src };
  for (const st of ast.body) {
    const line = st.loc.start.line;
    if (st.type === 'FunctionDeclaration') add(st.id.name, { k: 'decl', f, line });
    else if (st.type === 'VariableDeclaration') for (const d of st.declarations) { if (d.id.type === 'Identifier') { add(d.id.name, { k: st.kind, f, line }); if (d.init && d.init.type === 'Identifier') saved[d.id.name] = d.init.name; } }
    else if (st.type === 'ExpressionStatement') {
      const x = st.expression;
      if (x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'Identifier') {
        const ids = new Set(); walk.full(x.right, n => { if (n.type === 'Identifier') ids.add(n.name); });
        add(x.left.name, { k: 'reassign', f, line, ids: [...ids] });
      }
      if (x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'MemberExpression' && x.left.object.type === 'Identifier') {
        const key = x.left.computed ? (x.left.property.type === 'Literal' ? x.left.property.value : null) : x.left.property.name;
        if (key != null) (mapKeys[x.left.object.name + '.' + key] = mapKeys[x.left.object.name + '.' + key] || []).push(f + ':' + line);
      }
      if (x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && x.callee.object.name === 'Object' && x.callee.property.name === 'assign' && x.arguments[0] && x.arguments[0].type === 'Identifier') {
        const M = x.arguments[0].name;
        x.arguments.slice(1).forEach(a => { if (a.type === 'ObjectExpression') a.properties.forEach(p => { if (p.key) { const k = p.key.name || p.key.value; (mapKeys[M + '.' + k] = mapKeys[M + '.' + k] || []).push(f + ':' + p.loc.start.line); } }); });
      }
      if (x.type === 'CallExpression' && x.callee.type === 'Identifier' && /^def[SP]$/.test(x.callee.name) && x.arguments[0] && x.arguments[0].type === 'Literal') (defs[x.callee.name + ':' + x.arguments[0].value] = defs[x.callee.name + ':' + x.arguments[0].value] || []).push(f + ':' + line);
    }
  }
}
console.log('PARSE ERRORS:', parseErr.length ? parseErr : 'none');
// A: const/let declared twice
console.log('\n=== KHAI BÁO const/let TRÙNG (lỗi nạp) ===');
for (const n in ev) { const d = ev[n].filter(e => e.k === 'const' || e.k === 'let'); if (d.length > 1 || (d.length && ev[n].some(e => e.k === 'decl'))) console.log(n, ev[n].filter(e => e.k !== 'reassign').map(e => e.k + '@' + e.f + ':' + e.line).join(', ')); }
// B: function decl after reassign (wrapper bị xoá) / function declared nhiều lần
console.log('\n=== HÀM KHAI BÁO LẠI (đè mất bản trước / wrapper) ===');
for (const n in ev) {
  const es = ev[n]; const decls = es.filter(e => e.k === 'decl'); if (decls.length < 2 && !(decls.length && es.findIndex(e => e.k === 'reassign') >= 0 && order.indexOf(decls[0].f) > Math.min(...es.filter(e => e.k === 'reassign').map(e => order.indexOf(e.f))))) continue;
  console.log(n + ': ' + es.map(e => e.k + '@' + e.f + ':' + e.line).join(' → '));
}
// C: reassign không gọi hàm cũ
console.log('\n=== GÁN ĐÈ KHÔNG GỌI HÀM CŨ (cắt chuỗi wrapper) ===');
for (const n in ev) for (const e of ev[n]) if (e.k === 'reassign') {
  const prevVars = Object.keys(saved).filter(s => saved[s] === n);
  if (!e.ids.some(i => prevVars.includes(i) || i === n)) { const idx = ev[n].indexOf(e); if (idx > 0) console.log(n + ' @' + e.f + ':' + e.line + '  (trước đó: ' + ev[n].slice(0, idx).map(x => x.k + '@' + x.f).join(', ') + ')'); }
}
// D: map keys defined multiple times
console.log('\n=== MỤC BẢNG ĐỊNH NGHĨA NHIỀU LẦN (bản sau đè bản trước) ===');
const MAPS = ['HT', 'HT_PROFILE', 'WEAPONS', 'MELEE_P', 'GUN_P', 'ART2', 'SPELLS', 'ADVANTAGES', 'VT', 'TAC', 'CARDS', 'PICKER_WEAPONS', 'SND_MAP18', 'MUZ'];
for (const k in mapKeys) { const M = k.split('.')[0]; if (!MAPS.includes(M) || mapKeys[k].length < 2) continue; const files = new Set(mapKeys[k].map(s => s.split(':')[0])); if (files.size < 2 && mapKeys[k].length < 2) continue; console.log(k + ': ' + mapKeys[k].join(', ')); }
console.log('\n=== defS/defP TRÙNG ID ===');
for (const k in defs) if (defs[k].length > 1) console.log(k + ': ' + defs[k].join(', '));
fs.writeFileSync('globals.json', JSON.stringify(Object.keys(ev)));
console.log('\n=== HT vs HT_PROFILE: file định nghĩa cuối cùng khác nhau ===');
const last = k => mapKeys[k] ? mapKeys[k][mapKeys[k].length - 1] : null;
for (const k in mapKeys) if (k.startsWith('HT.')) { const id = k.slice(3), a = last(k), b = last('HT_PROFILE.' + id); if (!b) console.log(id + ': HT@' + a + ' — KHÔNG có HT_PROFILE (dùng mặc định)'); else if (a.split(':')[0] !== b.split(':')[0]) console.log(id + ': HT@' + a + '  HT_PROFILE@' + b); }
console.log('\n=== MELEE auto-mode ===');
