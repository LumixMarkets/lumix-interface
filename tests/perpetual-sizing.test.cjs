const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, path) => module._compile(ts.transpileModule(
  fs.readFileSync(path, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, path);
const { parsePerpetualAmount, formatPerpetualInput, perpetualSizeInput, perpetualMarginInput,
  perpetualLeverageLevels, perpetualMarkets, executablePrice } = require('../components/perpetuals-market.ts');

test('seven-decimal input stays exact and malformed values are rejected', () => {
  assert.equal(formatPerpetualInput(parsePerpetualAmount('.1234567')), '0.1234567');
  assert.equal(formatPerpetualInput(parsePerpetualAmount('100.')), '100');
  assert.equal(perpetualSizeInput('0.1', 3, 'quote', NaN), '0.3');
  for (const text of ['', '.', '1e3', '-1', '+1', '2.3.4', '1,000', '100 USD', ' 100', '0.12345678']) {
    assert.equal(parsePerpetualAmount(text), undefined, text);
  }
});

test('editing notional size derives margin and leverage scales that same margin', () => {
  const margin = perpetualMarginInput('1234.5678901', 5, 'quote', NaN);
  assert.equal(margin, '246.913578');
  assert.equal(perpetualSizeInput(margin, 10, 'quote', NaN), '2469.13578');
  assert.equal(perpetualMarginInput('', 5, 'quote', 1), undefined);
});

test('base-asset edits use the existing executable price, with one rounding to the payment precision', () => {
  const price = executablePrice(perpetualMarkets['BTC-USDC'], 'long');
  assert.ok(Math.abs(price - 112525.34214) < 1e-9);
  assert.equal(perpetualMarginInput('0.01', 5, 'base', price), '225.0506843');
  assert.equal(perpetualSizeInput('225.0506843', 5, 'base', price), '0.01');
  assert.notEqual(perpetualMarginInput('0.01', 5, 'base', executablePrice(perpetualMarkets['BTC-USDC'], 'short')), '225.0506843');
});

test('unit switches derive both views without changing the canonical margin', () => {
  for (const market of Object.values(perpetualMarkets)) {
    const margin = '123.4567891', price = executablePrice(market, 'long');
    const quote = perpetualSizeInput(margin, 5, 'quote', price);
    for (let count = 0; count < 20; count++) {
      assert.ok(perpetualSizeInput(margin, 5, 'base', price));
      assert.equal(perpetualSizeInput(margin, 5, 'quote', price), quote);
    }
    assert.equal(quote, '617.2839455');
  }
});

test('missing prices disable base conversion while quote sizing remains available', () => {
  for (const price of [0, -1, NaN, Infinity]) {
    assert.equal(perpetualSizeInput('100', 5, 'base', price), '');
    assert.equal(perpetualMarginInput('1', 5, 'base', price), undefined);
    assert.equal(perpetualSizeInput('100', 5, 'quote', price), '500');
  }
});

test('markers use the supported range and step for every configured market', () => {
  for (const market of Object.values(perpetualMarkets)) {
    const levels = perpetualLeverageLevels(market);
    assert.equal(levels[0], market.minimumLeverage);
    assert.equal(levels.at(-1), market.maximumLeverage);
    assert.ok(levels.every(level => level >= market.minimumLeverage && level <= market.maximumLeverage
      && (level - market.minimumLeverage) % market.leverageStep === 0));
    assert.equal(new Set(levels).size, levels.length);
  }
});
