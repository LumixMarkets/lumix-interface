// Browser-only wallet fixture. Never imported by the app and never contacts a wallet.
async function setEarnWalletFixture(page, connected = true, address = 'GEARNDEMOACCOUNT') {
  await page.waitForFunction(() => {
    const heading = document.querySelector('.earn-intro h1');
    let fiber = heading?.[Object.keys(heading).find(key => key.startsWith('__reactFiber$'))];
    while (fiber) {
      let hook = fiber.memoizedState;
      while (hook) {
        if (hook.queue?.dispatch && typeof hook.memoizedState?.sendTransaction === 'function') return hook.memoizedState.isReady;
        hook = hook.next;
      }
      fiber = fiber.return;
    }
    return false;
  });
  return page.evaluate(({ initiallyConnected, address }) => {
    const heading = document.querySelector('.earn-intro h1');
    let fiber = heading?.[Object.keys(heading).find(key => key.startsWith('__reactFiber$'))];
    while (fiber) {
      let hook = fiber.memoizedState;
      while (hook) {
        if (hook.queue?.dispatch && typeof hook.memoizedState?.sendTransaction === 'function') {
          // Suppress asynchronous SDK updates for this isolated test context.
          // The app's real connection entry point remains untouched in production.
          hook.queue.__earnOriginalDispatch ??= hook.queue.dispatch;
          hook.queue.__earnSuppressedDispatch ??= () => {};
          const dispatch = hook.queue.__earnOriginalDispatch;
          hook.queue.dispatch = hook.queue.__earnSuppressedDispatch;
          const original = hook.memoizedState;
          window.__earnWalletConnections = 0;
          window.__earnWalletSignatures = 0;
          const publish = authenticated => dispatch({
            ...original, isReady: true, isConnecting: false, isAuthenticated: authenticated,
            address: authenticated ? address : undefined,
            connectionMessage: '',
            connect: async () => { window.__earnWalletConnections += 1; publish(true); },
            disconnect: () => publish(false),
            sendTransaction: async () => { window.__earnWalletSignatures += 1; throw new Error('Earn must not sign transactions'); },
            swapAssets: async () => { window.__earnWalletSignatures += 1; throw new Error('Earn must not swap assets'); },
          });
          publish(initiallyConnected);
          return true;
        }
        hook = hook.next;
      }
      fiber = fiber.return;
    }
    return false;
  }, { initiallyConnected: connected, address });
}

async function loadAllEarnPools(page, expect) {
  await expect(page.locator('tr[data-pool]').first()).toBeVisible();
  await page.locator('.earn-load-sentinel').scrollIntoViewIfNeeded();
  await expect(page.locator('tr[data-pool]')).toHaveCount(6);
  await page.evaluate(() => window.scrollTo(0, 0));
}

module.exports = { setEarnWalletFixture, loadAllEarnPools };
