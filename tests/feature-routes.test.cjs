const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

require.extensions['.ts'] = (module, path) => module._compile(ts.transpileModule(
  fs.readFileSync(path, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText, path);

const {
  APP_ROUTES,
  FEATURES,
  PRODUCT_NAVIGATION,
  isAvailableProductRoute,
  resolveAvailableReturnRoute,
} = require('../components/app-routes.ts');

test('feature availability is centralized and matches the launch configuration', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(FEATURES).map(([feature, configuration]) => [feature, configuration.comingSoon])),
    { spot: false, options: false, perpetuals: false, earnVaults: false, portfolio: false },
  );
});

test('every product remains navigable and Spot is the shared home destination', () => {
  assert.equal(APP_ROUTES.home, APP_ROUTES.spot);
  assert.equal(PRODUCT_NAVIGATION.length, 5);
  assert.deepEqual(PRODUCT_NAVIGATION.map(item => item.route), [
    '/spot',
    '/options',
    '/perpetuals',
    '/earn',
    '/portfolio',
  ]);
  assert.equal(new Set(PRODUCT_NAVIGATION.map(item => item.route)).size, PRODUCT_NAVIGATION.length);
});

test('back navigation accepts only currently available product routes', () => {
  assert.equal(isAvailableProductRoute('/portfolio'), true);
  assert.equal(isAvailableProductRoute('/earn'), true);
  assert.equal(resolveAvailableReturnRoute('/options'), '/options');
  assert.equal(resolveAvailableReturnRoute('/portfolio'), '/portfolio');
  assert.equal(resolveAvailableReturnRoute('/earn'), '/earn');
  assert.equal(resolveAvailableReturnRoute('/missing'), APP_ROUTES.spot);
  assert.equal(resolveAvailableReturnRoute('https://example.com'), APP_ROUTES.spot);
  assert.equal(resolveAvailableReturnRoute(null), APP_ROUTES.spot);
});
