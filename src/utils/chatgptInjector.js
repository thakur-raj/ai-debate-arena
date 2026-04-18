/**
 * ChatGPT Webview Injector
 * Returns JS strings to be executed inside the ChatGPT webview.
 */

/** Send a message to ChatGPT's chat input */
export const chatgptSend = (message) => `
(async () => {
  // Try multiple selectors for the input — ChatGPT updates their DOM occasionally
  const selectors = [
    '#prompt-textarea',
    'div[contenteditable="true"][data-lexical-editor]',
    'div[contenteditable="true"]',
    'textarea[tabindex="0"]',
  ];

  let input = null;
  for (const sel of selectors) {
    input = document.querySelector(sel);
    if (input) break;
  }

  if (!input) return { success: false, error: 'Input not found' };

  input.focus();

  // Clear existing content
  if (input.tagName === 'TEXTAREA') {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(message)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // For contenteditable (ProseMirror / Lexical)
    input.innerHTML = '';
    // Use execCommand for broad compatibility
    const success = document.execCommand('insertText', false, ${JSON.stringify(message)});
    if (!success) {
      // Fallback: set innerText and fire events
      input.innerText = ${JSON.stringify(message)};
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(message)} }));
    }
  }

  await new Promise(r => setTimeout(r, 800));

  // Find send button
  const btnSelectors = [
    'button[data-testid="send-button"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Send message"]',
    'button.send-button',
    'form button[type="submit"]',
  ];

  let sendBtn = null;
  for (const sel of btnSelectors) {
    const btn = document.querySelector(sel);
    if (btn && !btn.disabled) { sendBtn = btn; break; }
  }

  if (sendBtn) {
    sendBtn.click();
    return { success: true, method: 'button' };
  }

  // Fallback: press Enter
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
  return { success: true, method: 'enter' };
})()
`;

/** Get current count of assistant messages (used as baseline before sending prompt) */
export const chatgptGetCount = () => `
(() => {
  const selectors = [
    '[data-message-author-role="assistant"]',
    '.assistant-message .prose',
    'article[data-testid^="conversation-turn"] .whitespace-pre-wrap',
  ];
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) return els.length;
  }
  return 0;
})()
`;

/** Poll: Check if ChatGPT has a new response. minCount = number of responses already seen. */
export const chatgptGetResponse = (minCount) => `
(async () => {
  // Still streaming if stop button is visible
  const stopBtn = document.querySelector(
    'button[data-testid="stop-button"], button[aria-label="Stop generating"]'
  );
  if (stopBtn && stopBtn.offsetParent !== null) return { done: false, text: null };

  // Count all assistant messages — we need more than minCount
  const selectors = [
    '[data-message-author-role="assistant"]',
    '.assistant-message .prose',
    'article[data-testid^="conversation-turn"] .whitespace-pre-wrap',
  ];

  let messages = [];
  for (const sel of selectors) {
    messages = document.querySelectorAll(sel);
    if (messages.length > 0) break;
  }

  if (messages.length <= (${minCount} || 0)) return { done: false, text: null };

  const last = messages[messages.length - 1];
  const text = (last.innerText || last.textContent || '').trim();

  if (!text || text.length < 10) return { done: false, text: null };

  return { done: true, text };
})()
`;

