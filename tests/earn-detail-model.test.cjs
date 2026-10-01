const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, filename);

const { applyEarnAction, createEarnDemoProcessor, earnComposition, earnOverview, earnPoolValue, formatEarnUsd } = require('../components/earn-model.ts');
const { EARN_RANGES, createEarnSession, earnHistoryChange, earnPoolHistory, earnPoolStatistics, earnRecentActivity, restoreEarnSession, serializeEarnSession } = require('../components/earn-detail-model.ts');
const draft = { poolId: 'xlm-usdc', asset: 'USDC', mode: 'deposit', amount: '100.1234567' };
function commit(session, mode = 'deposit', amount = draft.amount) {
  const result = applyEarnAction(session.state, { ...draft, mode, amount, id: `earn-demo-${session.actions.length + 1}` });
  assert.equal(result.ok, true, result.message);
  return { state: result.state, actions: [...session.actions, result.action] };
}

test('all pool histories are deterministic, ordered, labelled USD values and end at current deposits', () => {
  const session = createEarnSession();
  for (const pool of session.state.pools) {
    const sizes = [];
    for (const range of EARN_RANGES) {
      const points = earnPoolHistory(pool, [], range);
      assert.deepEqual(points, earnPoolHistory(pool, [], range));
      assert.ok(points.every((point, i) => point.value > 0 && (i === 0 || point.time > points[i - 1].time)));
      assert.equal(earnHistoryChange(points).current, Number(earnPoolValue(pool)) / 1e20);
      sizes.push(points.length);
    }
    assert.deepEqual(sizes, [25, 169, 721, 2161]);
    assert.notEqual(earnHistoryChange(earnPoolHistory(pool, [], '1D')).percent, earnHistoryChange(earnPoolHistory(pool, [], '1W')).percent);
  }
});

test('buy and sell update chart, activity and composition together without creating fees or trading volume', () => {
  const original = createEarnSession();
  const bought = commit(original);
  const pool = bought.state.pools.find(pool => pool.id === draft.poolId);
  const history = earnPoolHistory(pool, bought.actions, '1D');
  const activity = earnRecentActivity(pool, bought.actions);
  assert.equal(activity[0].action, 'Buy');
  assert.equal(formatEarnUsd(activity[0].value), '$100.12');
  assert.equal(history.at(-1).value.toFixed(2), '3000100.12');
  assert.equal(formatEarnUsd(earnPoolStatistics(pool).deposits), '$3,000,100.12');
  assert.ok(Math.abs(earnComposition(pool).reduce((sum, part) => sum + part.percent, 0) - 100) < 1e-8);
  assert.notEqual(earnComposition(pool)[0].percent, earnComposition(original.state.pools[0])[0].percent);
  assert.deepEqual(earnPoolStatistics(pool).fees24h, earnPoolStatistics(original.state.pools[0]).fees24h);
  assert.deepEqual(earnPoolStatistics(pool).volume24h, earnPoolStatistics(original.state.pools[0]).volume24h);
  assert.equal(earnOverview(bought.state).feesEarned, earnOverview(original.state).feesEarned);
  const sold = commit(bought, 'withdraw');
  const nextPool = sold.state.pools.find(pool => pool.id === draft.poolId);
  assert.deepEqual(nextPool, original.state.pools[0]);
  assert.deepEqual(sold.state.balances, original.state.balances);
  assert.equal(earnRecentActivity(nextPool, sold.actions)[0].action, 'Sell');
  assert.equal(earnPoolHistory(nextPool, sold.actions, 'All').at(-1).value, 3000000);
});

test('session replay preserves exact amounts, balances, positions, history and activity', () => {
  const session = commit(commit(createEarnSession()), 'withdraw', '0.0000001');
  const restored = restoreEarnSession(serializeEarnSession(session));
  assert.deepEqual(restored, session);
  for (const pool of session.state.pools) {
    assert.deepEqual(earnPoolHistory(pool, session.actions, '1W'), earnPoolHistory(pool, restored.actions, '1W'));
    assert.deepEqual(earnRecentActivity(pool, session.actions), earnRecentActivity(pool, restored.actions));
  }
});

test('bad journals reset safely, including duplicate ids, excessive amounts and malformed commands', () => {
  const fresh = createEarnSession();
  for (const raw of [null, '', '{broken', '{}', 'null', '{"version":2,"actions":[]}', JSON.stringify({ version: 1, actions: [null] }),
    JSON.stringify({ version: 1, actions: [{ ...draft, id: 'earn-demo-1', amount: '9999999999999' }] }),
    JSON.stringify({ version: 1, actions: [{ ...draft, id: 'earn-demo-1', amount: '0.00000001' }] }),
    JSON.stringify({ version: 1, actions: [{ ...draft, id: 'earn-demo-1' }, { ...draft, id: 'earn-demo-1' }] })]) {
    assert.deepEqual(restoreEarnSession(raw), fresh);
  }
});

test('restored processors continue unique action ids and reject concurrent requests', async () => {
  const restored = commit(createEarnSession());
  let finish;
  const processor = createEarnDemoProcessor(restored.state, () => new Promise(resolve => { finish = resolve; }));
  const first = processor.submit(draft);
  const duplicate = await processor.submit(draft);
  assert.equal(duplicate.ok, false);
  finish();
  const result = await first;
  assert.equal(result.ok, true);
  assert.equal(result.action.id, 'earn-demo-2');
  assert.equal(result.state.completedActionIds.length, 2);
});

test('activities are distinct for each pool, newest first, and never fake explorer links', () => {
  const session = createEarnSession();
  const ids = new Set();
  for (const pool of session.state.pools) {
    const rows = earnRecentActivity(pool, []);
    assert.equal(rows.length, 16);
    assert.ok(rows.every((row, index) => row.amount > 0n && row.value > 0n && !row.yours && (index === 0 || row.time < rows[index - 1].time)));
    rows.forEach(row => { assert.equal(ids.has(row.id), false); ids.add(row.id); });
  }
});
