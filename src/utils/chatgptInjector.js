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
  const els = document.querySelectorAll('[data-message-author-role="assistant"]');
  if (els.length > 0) return els.length;
  // Fallback selectors
  const fallback = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
  return Math.floor(fallback.length / 2); // every turn has user + assistant, so half
})()
`;

/** Poll: Check if ChatGPT has a new response. minCount = number of responses already seen. */
export const chatgptGetResponse = (minCount) => `
(() => {
  const minCount = ${minCount};

  // Check for stop button — if actively generating, stop button is visible
  // Be specific: only block if the STOP button is present and visible (not the send button)
  const stopBtn = document.querySelector('button[data-testid="stop-button"]');
  if (stopBtn && stopBtn.offsetParent !== null) {
    return { done: false, text: null, reason: 'stop-btn-visible' };
  }

  // Count assistant messages
  let messages = document.querySelectorAll('[data-message-author-role="assistant"]');
  if (messages.length === 0) {
    // Fallback: look for conversation turns and get AI ones
    const turns = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    if (turns.length > 0) {
      // Filter to only assistant turns (they have [data-message-author-role="assistant"] inside)
      const assistantTurns = Array.from(turns).filter(t => t.querySelector('[data-message-author-role="assistant"]'));
      if (assistantTurns.length > minCount) {
        const last = assistantTurns[assistantTurns.length - 1];
        const text = (last.innerText || last.textContent || '').trim();
        if (text && text.length >= 10) return { done: true, text, via: 'turns-fallback' };
      }
      return { done: false, text: null, reason: 'turns-count-too-low', found: assistantTurns.length, need: minCount + 1 };
    }
    return { done: false, text: null, reason: 'no-messages' };
  }

  if (messages.length <= minCount) {
    return { done: false, text: null, reason: 'count-too-low', found: messages.length, need: minCount + 1 };
  }

  const last = messages[messages.length - 1];
  const text = (last.innerText || last.textContent || '').trim();

  if (!text || text.length < 10) {
    return { done: false, text: null, reason: 'text-too-short', found: messages.length };
  }

  return { done: true, text, found: messages.length };
})()
`;


