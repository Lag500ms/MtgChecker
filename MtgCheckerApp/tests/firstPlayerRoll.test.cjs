const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = path.join(__dirname, '..', 'src', 'features', 'lifetracker', 'firstPlayerRoll.ts');
const js = ts.transpileModule(fs.readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const m = { exports: {} };
new Function('module', 'exports', js)(m, m.exports);
const { pickFirstPlayerRoll } = m.exports;

test('2, 3 and 4 players have a unique highest D20 roll', () => {
  for (const count of [2, 3, 4]) {
    for (let n = 0; n < 500; n++) {
      const { winnerIndex, values } = pickFirstPlayerRoll(count);
      assert.equal(values.length, count);
      assert.ok(winnerIndex >= 0 && winnerIndex < count);
      assert.ok(values.every(value => Number.isInteger(value) && value >= 1 && value <= 20));
      assert.equal(Math.max(...values), values[winnerIndex]);
      assert.equal(values.filter(v => v === values[winnerIndex]).length, 1);
    }
  }
});

test('every player can be chosen as first player', () => {
  for (const count of [2, 3, 4]) {
    const winners = Array.from({ length: count }, (_, i) =>
      pickFirstPlayerRoll(count, (() => {
        let first = true;
        return () => {
          if (first) { first = false; return (i + 0.5) / count; }
          return 0.25;
        };
      })()).winnerIndex);
    assert.deepEqual(winners, Array.from({ length: count }, (_, i) => i));
  }
});


