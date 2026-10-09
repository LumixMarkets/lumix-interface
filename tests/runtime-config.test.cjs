const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(path.resolve(__dirname, '..'));

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, filename);

const { LUMIX_PUBLIC_CONFIG } = require('../components/runtime-config.ts');

test('public deployment configuration is environment-backed and testnet-only', () => {
  assert.equal(LUMIX_PUBLIC_CONFIG.stellar.id, 'testnet');
  assert.equal(LUMIX_PUBLIC_CONFIG.stellar.passphrase, 'Test SDF Network ; September 2015');
  assert.equal(LUMIX_PUBLIC_CONFIG.bluxAppId, process.env.NEXT_PUBLIC_BLUX_APP_ID);
  assert.equal(LUMIX_PUBLIC_CONFIG.stellar.horizonUrl, process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL);
  assert.equal(LUMIX_PUBLIC_CONFIG.stellar.sorobanRpcUrl, process.env.NEXT_PUBLIC_STELLAR_RPC_URL);
  assert.equal(LUMIX_PUBLIC_CONFIG.stellar.usdcIssuer, process.env.NEXT_PUBLIC_STELLAR_USDC_ISSUER);
  assert.equal(LUMIX_PUBLIC_CONFIG.stellar.perpetualsPaymentDestination, process.env.NEXT_PUBLIC_PERPETUALS_PAYMENT_DESTINATION);
  assert.match(LUMIX_PUBLIC_CONFIG.stellar.usdcIssuer, /^G[A-Z2-7]{55}$/);
  assert.match(LUMIX_PUBLIC_CONFIG.stellar.usdcSacAddress, /^C[A-Z2-7]{55}$/);
});

test('deployment values are no longer embedded in application source', () => {
  const sourceFiles = fs.readdirSync(path.resolve(__dirname, '../components'))
    .filter(filename => /\.(ts|tsx)$/.test(filename) && filename !== 'runtime-config.ts');
  const source = sourceFiles.map(filename => fs.readFileSync(path.resolve(__dirname, '../components', filename), 'utf8')).join('\n');
  const configuredValues = [
    process.env.NEXT_PUBLIC_BLUX_APP_ID,
    process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL,
    process.env.NEXT_PUBLIC_STELLAR_USDC_ISSUER,
    process.env.NEXT_PUBLIC_STELLAR_USDC_SAC_ADDRESS,
    process.env.NEXT_PUBLIC_PERPETUALS_PAYMENT_DESTINATION,
  ];

  for (const value of configuredValues) {
    assert.ok(value);
    assert.equal(source.includes(value), false);
  }
});
