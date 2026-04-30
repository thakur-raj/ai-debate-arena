// Debug logger for webview navigation events
// Captures OAuth URLs, navigation events, and sends to main process via console

const origOpen = window.open;
window.open = function() {
  console.log('[webview-debug] window.open called:', Array.from(arguments).map(a => String(a).slice(0, 200)));
  return origOpen.apply(this, arguments);
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('a');
  if (el && el.href && (el.href.includes('google.com') || el.href.includes('accounts.'))) {
    console.log('[webview-debug] Google link clicked:', el.href.slice(0, 300));
  }
}, true);
