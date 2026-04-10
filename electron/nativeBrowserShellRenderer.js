const api = window.kdNativeBrowserShell;
const params = new URLSearchParams(window.location.search);
const windowKey = params.get('windowKey') || '';

const backButton = document.getElementById('back-button');
const forwardButton = document.getElementById('forward-button');
const reloadButton = document.getElementById('reload-button');
const homeButton = document.getElementById('home-button');
const addressForm = document.getElementById('address-form');
const addressInput = document.getElementById('address-input');
const titleNode = document.getElementById('browser-title');
const statusNode = document.getElementById('browser-status');

function renderState(state = {}) {
  if (!state || state.windowKey !== windowKey) return;
  document.title = state.title || 'KDBROWSER';
  titleNode.textContent = state.title || 'KDBROWSER';
  addressInput.value = state.url || '';
  backButton.disabled = !state.canGoBack;
  forwardButton.disabled = !state.canGoForward;
  statusNode.textContent = state.error
    ? state.error
    : (state.isLoading ? 'Loading...' : '');
}

async function bootstrap() {
  const state = await api.getWindowState(windowKey);
  renderState(state);
}

addressForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await api.navigate(windowKey, addressInput.value);
});

backButton.addEventListener('click', () => {
  api.action(windowKey, 'back').catch(() => {});
});

forwardButton.addEventListener('click', () => {
  api.action(windowKey, 'forward').catch(() => {});
});

reloadButton.addEventListener('click', () => {
  api.action(windowKey, 'reload').catch(() => {});
});

homeButton.addEventListener('click', () => {
  api.action(windowKey, 'home').catch(() => {});
});

window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
    event.preventDefault();
    addressInput.focus();
    addressInput.select();
  }
});

api.onState((payload) => {
  renderState(payload);
});

bootstrap().catch((error) => {
  statusNode.textContent = error instanceof Error ? error.message : 'Failed to start native browser shell.';
});
