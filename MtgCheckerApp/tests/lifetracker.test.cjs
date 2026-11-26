const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const sourceFile = path.join(__dirname, '..', 'src', 'features', 'lifetracker', 'gameState.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourceFile, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const m = { exports: {} };
new Function('module', 'exports', compiled)(m, m.exports);
const { createNewMatch, matchReducer, serializeMatch, restoreMatch, commanderDamageKey } = m.exports;
const change = (state, action) => matchReducer(state, action);

test('4 players begin with 40 life and zero counters', () => {
  const state = createNewMatch();
  assert.equal(state.players.length, 4);
  for (const p of state.players) {
    assert.equal(p.life, 40);
    assert.equal(p.poison, 0);
  }
});

test('life can go negative; undo restores it', () => {
  let s = change(createNewMatch(), { type: 'adjust', playerId: 'p1', field: 'life', delta: -45 });
  assert.equal(s.players[0].life, -5);
  s = change(s, { type: 'undo' });
  assert.equal(s.players[0].life, 40);
});

test('poison counters cannot become negative', () => {
  let s = change(createNewMatch(), { type: 'adjust', playerId: 'p1', field: 'poison', delta: -1 });
  assert.equal(s.players[0].poison, 0);
  assert.equal(s.history.length, 0);
  s = change(s, { type: 'adjust', playerId: 'p1', field: 'poison', delta: 10 });
  assert.equal(s.players[0].poison, 10);
});

test('commander damage changes life, but removing zero damage does not heal', () => {
  let s = change(createNewMatch(), { type: 'commanderDamage', targetId: 'p1', attackerId: 'p2', slot: 'main', delta: 7 });
  assert.equal(s.players[0].life, 33);
  s = change(s, { type: 'commanderDamage', targetId: 'p1', attackerId: 'p2', slot: 'main', delta: -20 });
  assert.equal(s.players[0].life, 40);
  const old = s;
  s = change(s, { type: 'commanderDamage', targetId: 'p1', attackerId: 'p2', slot: 'main', delta: -1 });
  assert.equal(s, old);
});

test('partner commander damage counts independently', () => {
  let s = change(createNewMatch(), { type: 'partner', playerId: 'p2' });
  s = change(s, { type: 'commanderDamage', targetId: 'p1', attackerId: 'p2', slot: 'main', delta: 13 });
  s = change(s, { type: 'commanderDamage', targetId: 'p1', attackerId: 'p2', slot: 'partner', delta: 8 });
  assert.equal(s.players[0].life, 19);
  assert.equal(s.players[0].commanderDamageReceived.p2, 13);
  assert.equal(s.players[0].commanderDamageReceived[commanderDamageKey('p2', 'partner')], 8);
});

test('monarch and initiative ownership is unique', () => {
  let s = change(createNewMatch(), { type: 'monarch', playerId: 'p2' });
  s = change(s, { type: 'monarch', playerId: 'p3' });
  s = change(s, { type: 'initiative', playerId: 'p1' });
  assert.deepEqual(s.players.map(p => p.isMonarch), [false, false, true, false]);
  assert.deepEqual(s.players.map(p => p.hasInitiative), [true, false, false, false]);
});

test('match persistence restores history, names and partner damage', () => {
  let s = change(createNewMatch(), { type: 'rename', playerId: 'p3', name: 'Vinh' });
  s = change(s, { type: 'partner', playerId: 'p2' });
  s = change(s, { type: 'commanderDamage', targetId: 'p3', attackerId: 'p2', slot: 'partner', delta: 10 });
  const restored = restoreMatch(serializeMatch(s));
  assert.ok(restored);
  assert.equal(restored.players[2].name, 'Vinh');
  assert.equal(restored.players[2].life, 30);
  assert.equal(restored.players[1].hasPartner, true);
  assert.equal(restored.history.length, 3);
  assert.equal(restored.undoStack.length, 0);
});

test('3-player game can be saved and restored', () => {
  const state = createNewMatch(3, 40);
  assert.equal(state.players.length, 3);
  const saved = restoreMatch(serializeMatch(state));
  assert.ok(saved);
  assert.equal(saved.playerCount, 3);
  assert.equal(saved.players.length, 3);
});

test('bad saved data is ignored and 2-player reset works', () => {
  assert.equal(restoreMatch('{broken'), null);
  const s = change(createNewMatch(), { type: 'reset', count: 2, life: 40 });
  assert.equal(s.players.length, 2);
});
