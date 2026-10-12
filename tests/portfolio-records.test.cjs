const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, path) => module._compile(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, path);
const { emptyRecords, parsePortfolioRecords, cumulativePnl, netPnl, optionHistory, deduplicate } = require('../components/portfolio-records.ts');
const { CURRENT_USER } = require('../components/options-market.ts');
const { formatFinancialWithAsset, formatSignedFinancial } = require('../components/financial-format.ts');
const now = Date.UTC(2026, 8, 19), day = 86400000;
const outcome = (id, amount, extra = {}) => ({ id, at: now - day, product: 'options', currency: 'USDC', kind: 'trade-close', provenance: 'confirmed', pnl: { basis: 'net', amount }, ...extra });

test('net outcomes never double-count fees; gross subtracts recorded fees once', () => {
  assert.equal(netPnl(outcome('net', 12.125)), 12.125);
  assert.equal(netPnl(outcome('gross', 0, { pnl: { basis: 'gross', amount: 12.125, fees: 2.1 } })), 10.025);
});
test('realized P&L formatting is signed, neutral at zero, and keeps two decimals plus currency', () => {
  assert.equal(formatFinancialWithAsset(Number(formatSignedFinancial(12.125).replace('+', '')), 'USDC'), '12.13 USDC');
  assert.equal(formatSignedFinancial(12.125), '+12.13');
  assert.equal(formatSignedFinancial(-12.125), '−12.13');
  assert.equal(formatSignedFinancial(0), '0.00');
  assert.equal(formatSignedFinancial(Number.NaN), '—');
});
test('combined chart excludes spot, payments, previews and future outcomes', () => {
  const records = [outcome('a', 10), outcome('b', -4, { product: 'perpetuals' }), outcome('spot', 100, { product: 'spot' }), outcome('payment', 100, { kind: 'payment' }), outcome('preview', 100, { provenance: 'preview' }), outcome('future', 100, { at: now + 1 })];
  assert.equal(cumulativePnl(records, 'Overall', 'All', now).at(-1).value, 6);
  assert.equal(cumulativePnl(records, 'Options', 'All', now).at(-1).value, 10);
  assert.equal(cumulativePnl(records, 'Perpetuals', 'All', now).at(-1).value, -4);
});
test('period boundaries, chronological accumulation and stable deduplication', () => {
  const records = [outcome('last', -2), outcome('first', 3, { at: now - 7 * day }), outcome('old', 50, { at: now - 7 * day - 1 }), outcome('last', -2)];
  assert.deepEqual(cumulativePnl(records, 'Overall', '1W', now).map(p => p.value), [3, 1]);
  assert.equal(cumulativePnl(records, 'Overall', '1M', now).at(-1).value, 51);
  assert.deepEqual(cumulativePnl([], 'Overall', 'All', now), []);
  assert.equal(cumulativePnl([outcome('zero', 0)], 'Overall', 'All', now)[0].value, 0);
  assert.equal(deduplicate([{ id: 'a' }, { id: 'a' }]).length, 1);
});
test('storage validates wallet, network, malformed input and genuine outcomes', () => {
  const data = emptyRecords('wallet-a');
  assert.deepEqual(parsePortfolioRecords(JSON.stringify(data), 'wallet-a'), data);
  assert.throws(() => parsePortfolioRecords(JSON.stringify(data), 'wallet-b'));
  assert.throws(() => parsePortfolioRecords(JSON.stringify({ ...data, network: 'public' }), 'wallet-a'));
  assert.throws(() => parsePortfolioRecords('null', 'wallet-a'));
  assert.throws(() => parsePortfolioRecords('{', 'wallet-a'));
  assert.throws(() => parsePortfolioRecords(JSON.stringify({ ...data, outcomes: [outcome('x', 1, { kind: 'payment' })] }), 'wallet-a'));
});
test('partial option closes preserve original fill size and separate unfilled orders', () => {
  const position = { id: 'open', fillId: 'fill', pairId: 'BTC-USDC', optionSide: 'call', direction: 'long', strike: 70000, expirationId: '30-oct', quantity: 3, premium: 42.125, counterparty: 'maker', openedAt: now - day, status: 'open' };
  const state = { sequence: 1, fills: [], notifications: [], positions: [position, { ...position, id: 'close', quantity: 2, status: 'closed', closedAt: now, exitPremium: 50 }], orders: [{ ...position, id: 'unfilled', owner: CURRENT_USER, orderSide: 'sell', limitPremium: 60, remainingQuantity: 2, createdAt: now, expiresAt: now + day, status: 'cancelled', cancelledAt: now }] };
  const rows = optionHistory(state, now);
  assert.equal(rows.find(row => row.id === 'fill:fill').size, 5);
  assert.equal(rows.find(row => row.id === 'close:close').side, 'Sell');
  assert.equal(rows.find(row => row.id === 'order:unfilled').status, 'Cancelled');
  assert.equal(rows.length, 3);
  assert.ok(rows.every(row => !('pnl' in row)));
  assert.deepEqual(optionHistory(null, now), []);
});

test('confirmed receipt survives corrupt archive and refresh, recovers without duplicate or account leakage', () => {
  const values = new Map();
  global.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const modulePath = require.resolve('../components/portfolio-storage.ts');
  let storage = require(modulePath);
  const key = storage.portfolioStorageKey('receipt-wallet');
  const hash = 'c'.repeat(64);
  const payment = { id: hash, at: now, position: { id: hash, marketId: 'BTC-USDC', side: 'long', margin: 20, transactionHash: hash } };
  values.set(key, '{');
  storage.queueConfirmedPayment('receipt-wallet', payment);
  assert.ok(values.has(key + ':pending-payments'));
  assert.throws(() => storage.readPortfolioRecords('receipt-wallet'));
  assert.equal(storage.readPortfolioRecords('other-wallet').payments.length, 0);
  // Simulate reloading the module: recovery must come from the durable journal.
  delete require.cache[modulePath]; storage = require(modulePath);
  values.set(key, JSON.stringify(emptyRecords('receipt-wallet')));
  const recovered = storage.readPortfolioRecords('receipt-wallet');
  assert.equal(recovered.payments.length, 1);
  assert.equal(recovered.payments[0].id, hash);
  assert.equal(values.has(key + ':pending-payments'), false);
  recovered.payments[0].hidden = true;
  values.set(key, JSON.stringify(recovered));
  storage.queueConfirmedPayment('receipt-wallet', { ...payment, at: now + 1 });
  const duplicate = storage.readPortfolioRecords('receipt-wallet');
  assert.equal(duplicate.payments.length, 1);
  assert.equal(duplicate.payments[0].at, now);
  assert.equal(duplicate.payments[0].hidden, true);
});

test('receipt stays in memory when browser blocks writes, and retries after storage returns', () => {
  const values = new Map();
  let blocked = true;
  global.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (blocked) throw new Error('Quota exceeded'); values.set(key, value); }, removeItem: key => values.delete(key) };
  const { queueConfirmedPayment, readPortfolioRecords } = require('../components/portfolio-storage.ts');
  const hash = 'd'.repeat(64);
  queueConfirmedPayment('quota-wallet', { id: hash, at: now, position: { id: hash, marketId: 'ETH-USDC', side: 'short', margin: 10, transactionHash: hash } });
  assert.throws(() => readPortfolioRecords('quota-wallet'));
  blocked = false;
  assert.equal(readPortfolioRecords('quota-wallet').payments[0].id, hash);
});
