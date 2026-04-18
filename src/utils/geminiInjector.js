/**
 * Gemini Webview Injector
 *
 * Text is inserted via Electron's native webview.insertText() in the
 * orchestrator — not here. These helpers only handle focus and send.
 */

/** Step 1: Focus Gemini's input and select all existing content */
export const geminiClickInput = () => `
(async () => {
  const selectors = [
    '.ql-editor',
    'rich-textarea .ql-editor',
    '[contenteditable="true"][role="textbox"]',
    'p-text-input div[contenteditable]',
    'div[contenteditable="true"]',
  ];

  let input = null;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) { input = el; break; }
  }

  if (!input) return { found: false };

  input.click();
  input.focus();

  try {
    const range = document.createRange();
    range.selectNodeContents(input);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (_) {
    document.execCommand('selectAll', false, null);
  }

  return { found: true };
})()
`;

/** Step 2: Click Gemini's send button (or press Enter as fallback) */
export const geminiClickSend = () => `
(async () => {
  await new Promise(r => setTimeout(r, 300));

  const btnSelectors = [
    'button[aria-label="Send message"]',
    'button.send-button',
    'button[mattooltip="Send message"]',
    'button[jsname="Qx7uuf"]',
    '.trailing-actions button:last-of-type',
    '.input-buttons-wrapper button:last-of-type',
    'form button[type="submit"]',
  ];

  for (const sel of btnSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const btn = el.tagName === 'BUTTON' ? el : el.closest('button');
      if (btn && !btn.disabled) {
        btn.click();
        return { method: 'button', sel };
      }
    }
  }

  const input = document.querySelector('.ql-editor, [contenteditable="true"]');
  if (input) {
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
      bubbles: true, cancelable: true,
    }));
    input.dispatchEvent(new KeyboardEvent('keyup', {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true,
    }));
    return { method: 'enter-fallback' };
  }

  return { method: 'none' };
})()
`;

/** Get current count of model responses (used as baseline before sending prompt) */
export const geminiGetCount = () => `
(() => {
  return document.querySelectorAll('model-response').length;
})()
`;

/** Poll: Check if Gemini has a new response. minCount = number of responses already seen. */
export const geminiGetResponse = (minCount) => `
(async () => {
  // Only treat as loading if the spinner is actually VISIBLE
  const spinner = document.querySelector('mat-progress-spinner, .loading-indicator');
  if (spinner && spinner.offsetParent !== null) return { done: false, text: null };

  // Stop button visible = still streaming
  const stopBtn = document.querySelector(
    'button[aria-label="Stop response"], button[aria-label="Stop generating"], .stop-button'
  );
  if (stopBtn && stopBtn.offsetParent !== null) return { done: false, text: null };

  // Count model-response elements — we need more than minCount
  const responses = document.querySelectorAll('model-response');
  if (responses.length <= (${minCount} || 0)) return { done: false, text: null };

  // Get the LAST model response text
  const last = responses[responses.length - 1];
  const text = (last.innerText || last.textContent || '').trim();

  if (!text || text.length < 20) return { done: false, text: null };

  return { done: true, text };
})()
`;


