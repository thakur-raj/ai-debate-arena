/**
 * Perplexity AI Webview Injector
 * 
 * Based on Perplexity's actual DOM structure:
 * - Input: <div id="ask-input"> with <p><span> inside
 * - Exact selector: #ask-input > p > span
 * - Submit button: <button aria-label="Submit">
 */

/** Step 1: Focus Perplexity's input and select all existing content */
export const perplexityClickInput = () => `
(async () => {
  const selectors = [
    '#ask-input > p > span',
    '#ask-input',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    'textarea[placeholder*="Ask"], textarea[placeholder*="ask"]',
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
    if (input.tagName === 'TEXTAREA') {
      input.select();
    } else {
      const range = document.createRange();
      range.selectNodeContents(input);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  } catch (_) {
    input.dispatchEvent(new InputEvent('beforeinput', {
      inputType: 'selectAll',
      bubbles: true,
      cancelable: true
    }));
  }

  return { found: true };
})()
`;

/** Step 2: Click Perplexity's submit button (or press Enter as fallback) */
export const perplexityClickSend = () => `
(async () => {
  await new Promise(r => setTimeout(r, 300));

  const btnSelectors = [
    'button[aria-label="Submit"]',
    'button[aria-label*="Ask"], button[aria-label*="ask"]',
    'button[data-testid*="send"], button[data-testid*="submit"]',
    'button.send-button, button.submit-button',
    'button[type="submit"]',
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

  // Fallback: press Enter in the input
  const input = document.querySelector('#ask-input, div[contenteditable="true"]');
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

/** Get current count of Perplexity responses */
export const perplexityGetCount = () => `
(() => {
  // Count Perplexity response elements
  // Look for response containers or message bubbles
  const selectors = [
    'div[data-testid*="message"]:not([data-role="user"])',
    'div[data-role="assistant"], div[role="assistant"]',
    'div.prose, article.prose',
    '.markdown.prose',
  ];
  
  let maxCount = 0;
  for (const sel of selectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > maxCount) maxCount = els.length;
  }
  
  return maxCount;
})()
`;

/** Poll: Check if Perplexity has a new response. minCount = number of responses already seen. */
export const perplexityGetResponse = (minCount) => `
(async () => {
  const minCount = ${minCount};

  // Check for streaming/thinking indicators
  const streamingSelectors = [
    'div[class*="streaming"], div[class*="typing"]',
    'div[data-streaming="true"]',
    '.cursor-blink, .typing-indicator',
    'button[aria-label*="Stop"], button[aria-label*="stop"]',
    'svg[class*="spinner"], svg[class*="loading"]',
    '.animate-spin',
  ];

  for (const sel of streamingSelectors) {
    const el = document.querySelector(sel);
    if (el && el.offsetParent !== null) {
      return { done: false, text: null, reason: 'streaming' };
    }
  }

  // Count responses
  const responseSelectors = [
    'div[data-testid*="message"]:not([data-role="user"])',
    'div[data-role="assistant"], div[role="assistant"]',
    'div.prose:not(:has(button))',
    'article.prose',
    '.markdown.prose',
  ];

  let responses = [];
  for (const sel of responseSelectors) {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      responses = Array.from(els);
      break;
    }
  }

  if (responses.length <= minCount) {
    return { done: false, text: null, reason: 'no-new-response' };
  }

  // Get the most recent response
  const lastResponse = responses[responses.length - 1];
  
  // Extract text
  let text = '';
  
  if (lastResponse.innerText) {
    text = lastResponse.innerText
      .replace(/\\[\\d+\\]/g, '') // Remove [1], [2] citation markers
      .replace(/\\^\\[\\d+\\]/g, '') // Remove ^[1] superscript citations
      .replace(/\\s+/g, ' ') // Normalize whitespace
      .trim();
  } else if (lastResponse.textContent) {
    text = lastResponse.textContent
      .replace(/\\[\\d+\\]/g, '')
      .replace(/\\^\\[\\d+\\]/g, '')
      .replace(/\\s+/g, ' ')
      .trim();
  }

  // If text is too short, it might not be a complete response
  if (!text || text.length < 20) {
    return { done: false, text: null, reason: 'text-too-short' };
  }

  // Check if this looks like a complete response
  const hasEndingPunctuation = /[.!?\\"']\\s*$/.test(text);
  if (!hasEndingPunctuation && text.length < 100) {
    return { done: false, text: null, reason: 'incomplete-response' };
  }

  return { done: true, text };
})()
`;