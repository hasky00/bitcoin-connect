import {assert} from '@open-wc/testing';
import {requestProvider, closeModal} from '../api';
import store from '../state/store';
import {WebLNProvider} from '@webbtc/webln-types';

suite('requestProvider', () => {
  const resetStore = () => {
    closeModal();
    store.setState({
      route: '/start',
      routeHistory: [],
      connected: false,
      connecting: false,
      connectorName: undefined,
      error: undefined,
      modalOpen: false,
      provider: undefined,
      connector: undefined,
      connectorConfig: undefined,
      info: undefined,
    });
  };

  setup(() => {
    resetStore();
  });

  teardown(() => {
    resetStore();
  });

  test('resolves when a provider connects before the modal closes', async () => {
    const connectedProvider = {} as WebLNProvider;
    const providerPromise = requestProvider();

    store.setState({connected: true, provider: connectedProvider});
    const provider = await providerPromise;

    assert.strictEqual(provider, connectedProvider);
    assert.isTrue(store.getState().modalOpen);
  });

  test('rejects with an Error when the modal closes without a provider', async () => {
    let error: unknown;
    const providerPromise = requestProvider();

    store.setState({modalOpen: false});
    try {
      await providerPromise;
    } catch (err) {
      error = err;
    }

    assert.instanceOf(error, Error);
    assert.equal((error as Error).message, 'Modal closed without connecting');
  });

  test('does not resolve after rejecting on modal close, even if a connection happens later', async () => {
    const connectedProvider = {} as WebLNProvider;
    let resolved = false;
    const providerPromise = requestProvider().then((provider) => {
      resolved = true;
      return provider;
    });

    let error: unknown;
    store.setState({modalOpen: false});
    try {
      await providerPromise;
    } catch (err) {
      error = err;
    }

    store.setState({connected: true, provider: connectedProvider});
    await Promise.resolve();

    assert.instanceOf(error, Error);
    assert.isFalse(resolved);
  });
});
