try {
  Object.defineProperty(navigator, 'webdriver', {
    configurable: true,
    get: () => false
  });
} catch {
  // Ignore unsupported overrides.
}

try {
  if (!window.chrome) {
    Object.defineProperty(window, 'chrome', {
      configurable: true,
      value: { runtime: {} }
    });
  }
} catch {
  // Ignore unsupported overrides.
}
