// Gsum.cjs <dir> : reads every G*.out in <dir>, prints one summary table (gate, check, status, measured value). Exit 1 on any FAIL / MISSING.
const fs = require('fs'), path = require('path');
const dir = process.argv[2]; const wide = process.argv.includes('--wide');
const rows = [];
for (const f of fs.readdirSync(dir).filter((f) => /\.out$/.test(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
  for (const l of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) { if (!l.startsWith('@@R\t')) continue; const [, gate, check, status, ...v] = l.split('\t'); rows.push({ gate, check, status, value: v.join(' ') }); }
  const txt = fs.readFileSync(path.join(dir, f), 'utf8'); if (!/@@R/.test(txt) && txt.trim()) rows.push({ gate: f.replace('.out', ''), check: 'script produced no result rows', status: 'FAIL', value: txt.trim().split('\n').slice(-2).join(' | ').slice(0, 200) });
}
const W = wide ? 400 : 150; const pad = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n));
const order = (a, b) => parseInt(a.gate.replace(/\D/g, '') || 99) - parseInt(b.gate.replace(/\D/g, '') || 99);
rows.sort(order);
console.log(`${pad('GATE', 5)} ${pad('CHECK', 74)} ${pad('RESULT', 8)} MEASURED`);
for (const r of rows) console.log(`${pad(r.gate, 5)} ${pad(r.check, 74)} ${pad(r.status, 8)} ${r.value.slice(0, W)}`);
const c = (s) => rows.filter((r) => r.status === s).length;
console.log(`\n${rows.length} checks: ${c('PASS')} PASS, ${c('FAIL')} FAIL, ${c('MISSING')} MISSING (counted as FAIL), ${c('SKIP')} SKIP (not a pass)`);
process.exit(c('FAIL') + c('MISSING') ? 1 : 0);
