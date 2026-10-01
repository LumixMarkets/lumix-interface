const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, filename);

const {
  EARN_ASSETS, USD_SCALE, applyEarnAction, createEarnDemoProcessor, createInitialEarnState,
  earnAmountInput, earnAssetValue, earnAvailableAmount, earnComposition, earnOverview,
  earnPoolValue, earnPositionValue, filterEarnPools, formatEarnAmount, formatEarnApr,
  formatEarnUsd, parseEarnAmount, validateEarnDraft,
} = require('../components/earn-model.ts');

const zero = BigInt(0);
const units = (amount, asset) => {
  const parsed = parseEarnAmount(amount, asset);
  assert.equal(parsed.ok, true);
  return parsed.units;
};
const options = (overrides = {}) => ({ tab: 'all', query: '', asset: 'All', sort: 'deposits', direction: 'desc', ...overrides });
const draft = (overrides = {}) => ({ poolId: 'xlm-usdc', asset: 'USDC', amount: '100', mode: 'deposit', ...overrides });
let sequence = 0;
const action = (state, overrides = {}) => {
  const result = applyEarnAction(state, { ...draft(overrides), id: `unit-${++sequence}` });
  assert.equal(result.ok, true, result.message);
  return result.state;
};

test('fixtures are deterministic, independent, use USDT0, and include existing positions', () => {
  const a = createInitialEarnState();
  const b = createInitialEarnState();
  assert.deepEqual(a, b);
  assert.equal(a.pools.length, 6);
  assert.equal(filterEarnPools(a, options({ tab: 'mine' })).length, 3);
  assert.equal(EARN_ASSETS.USDT0.precision, 6);
  assert.equal(EARN_ASSETS.USDT, undefined);
  assert.ok(a.pools.some(pool => pool.id === 'xlm-usdt0'));
  assert.ok(a.pools.some(pool => pool.id === 'usdc-usdt0'));
  a.balances.USDC = zero;
  assert.notEqual(b.balances.USDC, zero);
});

test('overview is the exact sum of pools and positions; fees are separate', () => {
  const state = createInitialEarnState();
  const overview = earnOverview(state);
  assert.equal(overview.totalDeposits, state.pools.reduce((total, pool) => total + earnPoolValue(pool), zero));
  assert.equal(formatEarnUsd(overview.totalDeposits), '$16,382,000.00');
  assert.equal(formatEarnUsd(overview.yourDeposits), '$4,837.50');
  assert.equal(formatEarnUsd(overview.feesEarned), '$35.62');
  assert.equal(overview.yourDeposits, state.pools.reduce((total, pool) => total + earnPositionValue(state, pool.id), zero));
  assert.equal(formatEarnApr(782), '7.82%');
});

for (const query of ['XLM / USDT0', 'xlm-usdt0', ' XLM  USDT0 ', 'xlm_usdt0']) {
  test(`pair search normalizes ${JSON.stringify(query)}`, () => {
    assert.deepEqual(filterEarnPools(createInitialEarnState(), options({ query })).map(pool => pool.id), ['xlm-usdt0']);
  });
}

test('asset names, pair search, asset filter and position tab work together', () => {
  const state = createInitialEarnState();
  assert.equal(filterEarnPools(state, options({ query: 'Stellar Lumens' })).length, 2);
  assert.equal(filterEarnPools(state, options({ query: 'bitcoin' })).length, 2);
  assert.equal(filterEarnPools(state, options({ asset: 'USDC' })).length, 3);
  assert.equal(filterEarnPools(state, options({ asset: 'USDT0' })).length, 4);
  assert.deepEqual(filterEarnPools(state, options({ tab: 'mine', asset: 'USDT0', query: 'Ethereum' })).map(pool => pool.id), ['eth-usdt0']);
  assert.deepEqual(filterEarnPools(state, options({ query: 'no such asset' })), []);
  assert.deepEqual(filterEarnPools(state, options({ tab: 'mine', asset: 'USDC', query: 'bitcoin' })), []);
});

for (const sort of ['deposits', 'apr', 'position']) {
  for (const direction of ['asc', 'desc']) {
    test(`${sort} sorts numerically ${direction} without mutating fixtures`, () => {
      const state = createInitialEarnState();
      const original = state.pools.map(pool => pool.id);
      const pools = filterEarnPools(state, options({ sort, direction }));
      const values = pools.map(pool => sort === 'apr' ? BigInt(pool.aprBps) : sort === 'position' ? earnPositionValue(state, pool.id) : earnPoolValue(pool));
      assert.ok(values.every((value, index) => index === 0 || (direction === 'asc' ? value >= values[index - 1] : value <= values[index - 1])));
      assert.deepEqual(state.pools.map(pool => pool.id), original);
      assert.deepEqual(filterEarnPools(state, options({ sort, direction })), pools);
    });
  }
}

for (const invalid of ['', ' ', '0', '0.0000000', '-1', '-0.0001', '.', '1.2.3', '1e3', 'NaN', 'Infinity', '10oops', '1,000', '+5', '0x10', '1_000', '1'.repeat(97)]) {
  test(`rejects invalid amount ${JSON.stringify(invalid.slice(0, 25))}`, () => {
    assert.equal(parseEarnAmount(invalid, 'USDC').ok, false);
  });
}

for (const [asset, amount] of [['XLM', '0.12345678'], ['USDC', '1.12345678'], ['USDT0', '0.0000001'], ['BTC', '0.000000001'], ['ETH', '0.0000000000000000001']]) {
  test(`${asset} rejects excess precision without rounding`, () => {
    assert.match(parseEarnAmount(amount, asset).message, /decimal places/);
  });
}

for (const [asset, amount] of [['XLM', '10000.1234567'], ['USDC', '0.0000001'], ['USDT0', '3500.654321'], ['BTC', '0.00000001'], ['ETH', '0.125000000000000001']]) {
  test(`${asset} round-trips smallest units and high precision losslessly`, () => {
    const amountUnits = units(amount, asset);
    assert.equal(earnAmountInput(amountUnits, asset), amount);
    assert.equal(units(earnAmountInput(amountUnits, asset), asset), amountUnits);
  });
}

test('parsing accepts ordinary decimal editing and USD formatting rounds consistently', () => {
  assert.equal(units('.5', 'USDC'), units('0.5', 'USDC'));
  assert.equal(units('001.50', 'USDC'), units('1.5', 'USDC'));
  assert.equal(units('1.', 'USDC'), units('1', 'USDC'));
  assert.equal(formatEarnUsd(USD_SCALE / BigInt(200)), '$0.01');
  assert.equal(formatEarnUsd(-USD_SCALE / BigInt(200)), '−$0.01');
  assert.equal(formatEarnAmount(units('10000.1234567', 'XLM'), 'XLM'), '10,000.1234567');
});

test('validation rejects unavailable pools, unrelated assets, excessive balances, and invalid modes', () => {
  const state = createInitialEarnState();
  assert.equal(validateEarnDraft(state, draft({ poolId: 'missing' })).ok, false);
  assert.equal(validateEarnDraft(state, draft({ asset: 'ETH' })).ok, false);
  assert.equal(validateEarnDraft(state, draft({ mode: 'swap' })).ok, false);
  assert.match(validateEarnDraft(state, draft({ amount: '5000.0000001' })).message, /Not enough USDC/);
  assert.match(validateEarnDraft(state, draft({ mode: 'withdraw', amount: '1500.0000001' })).message, /only withdraw/);
  assert.equal(validateEarnDraft(state, draft({ mode: 'withdraw', poolId: 'btc-usdc' })).ok, false);
});

test('depositing one asset updates all values atomically and never creates fees', () => {
  const state = createInitialEarnState();
  const before = earnOverview(state);
  const next = action(state);
  const change = earnAssetValue(units('100', 'USDC'), 'USDC');
  assert.equal(next.balances.USDC, state.balances.USDC - units('100', 'USDC'));
  assert.equal(next.balances.XLM, state.balances.XLM);
  assert.equal(next.positions['xlm-usdc'].supplied.USDC, units('1600', 'USDC'));
  assert.equal(next.positions['xlm-usdc'].supplied.XLM, state.positions['xlm-usdc'].supplied.XLM);
  assert.equal(next.pools[0].holdings.USDC, state.pools[0].holdings.USDC + units('100', 'USDC'));
  assert.equal(earnOverview(next).totalDeposits, before.totalDeposits + change);
  assert.equal(earnOverview(next).yourDeposits, before.yourDeposits + change);
  assert.equal(earnOverview(next).feesEarned, before.feesEarned);
  assert.deepEqual(state, createInitialEarnState(), 'The previous state is immutable.');
});

test('depositing an unpaired base asset creates a position and enters My deposits', () => {
  const state = action(createInitialEarnState(), { poolId: 'btc-usdt0', asset: 'BTC', amount: '0.00123456' });
  assert.equal(state.positions['btc-usdt0'].supplied.BTC, units('0.00123456', 'BTC'));
  assert.equal(state.positions['btc-usdt0'].supplied.USDT0, undefined);
  assert.equal(state.positions['btc-usdt0'].feesEarnedCents, zero);
  assert.equal(filterEarnPools(state, options({ tab: 'mine' })).length, 4);
});

test('partial and full withdrawals return precisely the selected asset and keep fees separate', () => {
  const initial = createInitialEarnState();
  const partial = action(initial, { mode: 'withdraw', amount: '123.4567890' });
  assert.equal(partial.positions['xlm-usdc'].supplied.USDC, units('1376.543211', 'USDC'));
  assert.equal(partial.balances.USDC, initial.balances.USDC + units('123.456789', 'USDC'));
  const quoteRemoved = action(partial, { mode: 'withdraw', amount: earnAmountInput(partial.positions['xlm-usdc'].supplied.USDC, 'USDC') });
  assert.equal(quoteRemoved.positions['xlm-usdc'].supplied.USDC, zero);
  assert.equal(earnPositionValue(quoteRemoved, 'xlm-usdc'), earnAssetValue(units('2000', 'XLM'), 'XLM'));
  const fullyRemoved = action(quoteRemoved, { mode: 'withdraw', asset: 'XLM', amount: '2000' });
  assert.equal(earnPositionValue(fullyRemoved, 'xlm-usdc'), zero);
  assert.equal(fullyRemoved.positions['xlm-usdc'].feesEarnedCents, initial.positions['xlm-usdc'].feesEarnedCents);
  assert.equal(filterEarnPools(fullyRemoved, options({ tab: 'mine' })).length, 2);
  assert.equal(earnOverview(fullyRemoved).feesEarned, earnOverview(initial).feesEarned);
});

test('Max deposits and full withdrawals conserve every asset, including 18-decimal ETH', () => {
  for (const asset of Object.keys(EARN_ASSETS)) {
    const initial = createInitialEarnState();
    const pool = initial.pools.find(candidate => candidate.assets.includes(asset));
    const available = earnAvailableAmount(initial, draft({ poolId: pool.id, asset }));
    const deposited = action(initial, { poolId: pool.id, asset, amount: earnAmountInput(available, asset) });
    assert.equal(deposited.balances[asset], zero);
    assert.equal(validateEarnDraft(deposited, draft({ poolId: pool.id, asset, amount: '0.0001' })).ok, false);
    const returned = action(deposited, { poolId: pool.id, asset, amount: earnAmountInput(available, asset), mode: 'withdraw' });
    assert.deepEqual(returned.balances, initial.balances);
    assert.equal(earnOverview(returned).yourDeposits, earnOverview(initial).yourDeposits);
    assert.equal(earnOverview(returned).feesEarned, earnOverview(initial).feesEarned);
    for (const candidate of initial.pools) {
      assert.equal(earnPositionValue(returned, candidate.id), earnPositionValue(initial, candidate.id));
    }
    assert.deepEqual(returned.pools, initial.pools);
  }
});

test('tiny high-precision deposits retain exact principal and dollar values', () => {
  const state = createInitialEarnState();
  const amount = '0.000000000000000001';
  const next = action(state, { poolId: 'eth-usdt0', asset: 'ETH', amount });
  assert.equal(earnOverview(next).yourDeposits - earnOverview(state).yourDeposits, BigInt(430000));
  const returned = action(next, { poolId: 'eth-usdt0', asset: 'ETH', amount, mode: 'withdraw' });
  assert.deepEqual(returned.balances, state.balances);
  assert.deepEqual(returned.positions, state.positions);
});

test('composition uses USD values, changes after actions, and safely handles an empty pool', () => {
  const initial = createInitialEarnState();
  assert.deepEqual(earnComposition(initial.pools[0]).map(part => part.percent), [50, 50]);
  const next = action(initial, { asset: 'XLM', amount: '1000' });
  const composition = earnComposition(next.pools[0]);
  assert.ok(composition[0].percent > 50);
  assert.equal(composition.reduce((sum, part) => sum + part.percent, 0), 100);
  assert.equal(composition.reduce((sum, part) => sum + part.value, zero), earnPoolValue(next.pools[0]));
  assert.deepEqual(earnComposition({ ...initial.pools[0], holdings: {} }).map(part => part.percent), [0, 0]);
});

test('balances shared between pools prevent spending an already-used balance', () => {
  const next = action(createInitialEarnState(), { amount: '5000' });
  assert.equal(validateEarnDraft(next, draft({ poolId: 'btc-usdc', amount: '1' })).ok, false);
  const withdrawn = action(next, { mode: 'withdraw', amount: '25' });
  assert.equal(validateEarnDraft(withdrawn, draft({ poolId: 'btc-usdc', amount: '25' })).ok, true);
  assert.equal(validateEarnDraft(withdrawn, draft({ poolId: 'btc-usdc', amount: '25.0000001' })).ok, false);
});

test('withdrawing all principal produces an empty My deposits list while preserving earned fees', () => {
  let state = createInitialEarnState();
  for (const pool of state.pools) {
    for (const asset of pool.assets) {
      const available = earnAvailableAmount(state, { poolId: pool.id, asset, mode: 'withdraw' });
      if (available > zero) state = action(state, { poolId: pool.id, asset, mode: 'withdraw', amount: earnAmountInput(available, asset) });
    }
  }
  assert.deepEqual(filterEarnPools(state, options({ tab: 'mine' })), []);
  assert.equal(earnOverview(state).yourDeposits, zero);
  assert.equal(formatEarnUsd(earnOverview(state).feesEarned), '$35.62');
});

test('a completed action ID cannot be applied twice', () => {
  const state = createInitialEarnState();
  const request = { ...draft(), id: 'same-request' };
  const result = applyEarnAction(state, request);
  assert.equal(result.ok, true);
  assert.equal(applyEarnAction(result.state, request).ok, false);
  assert.equal(applyEarnAction(state, { ...request, id: '' }).ok, false);
});

test('the processing gate rejects simultaneous submissions and captures the original draft', async () => {
  let release;
  const initial = createInitialEarnState();
  const processor = createEarnDemoProcessor(initial, () => new Promise(resolve => { release = resolve; }));
  const request = draft();
  const first = processor.submit(request);
  assert.equal(processor.isPending(), true);
  request.amount = '999';
  const duplicate = await processor.submit(draft());
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.message, /processing/);
  release();
  const result = await first;
  assert.equal(result.ok, true);
  assert.equal(result.state.balances.USDC, units('4900', 'USDC'));
  assert.equal(result.state.completedActionIds.length, 1);
  assert.equal(processor.isPending(), false);
});

test('simulation revalidates current balances between actions and invalid input never processes', async () => {
  let delays = 0;
  const processor = createEarnDemoProcessor(createInitialEarnState(), async () => { delays += 1; });
  assert.equal((await processor.submit(draft({ amount: '' }))).ok, false);
  assert.equal(delays, 0);
  assert.equal((await processor.submit(draft({ amount: '5000' }))).ok, true);
  assert.equal((await processor.submit(draft({ amount: '1' }))).ok, false);
  assert.equal(delays, 1);
});

test('failed processing is retryable and leaves the ledger unchanged', async () => {
  let failures = 1;
  const processor = createEarnDemoProcessor(createInitialEarnState(), async () => { if (failures-- > 0) throw new Error('Simulated failure'); });
  assert.equal((await processor.submit(draft())).ok, false);
  assert.equal(processor.isPending(), false);
  const result = await processor.submit(draft());
  assert.equal(result.ok, true);
  assert.equal(result.state.balances.USDC, units('4900', 'USDC'));
});
