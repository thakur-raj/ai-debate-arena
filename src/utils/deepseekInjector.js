/**
 * DeepSeek Webview Injector
 *
 * Text is inserted via Electron's native webview.insertText() in the
 * orchestrator — not here. These helpers only handle focus and send.
 */

/** Step 1: Focus DeepSeek's input and select all existing content */
export const deepseekClickInput = () => `
(async () => {
  const selectors = [
    'textarea.d96f2d2a',
    'textarea[placeholder*="Message DeepSeek"]',
    'textarea',
    '[contenteditable="true"]',
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
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      try {
        input.setSelectionRange(0, input.value.length);
      } catch (e) {
        // fall through to selectAll
      }
    }
  }

  return { found: true };
})()
`;

/** Step 2: Click DeepSeek's send button (or press Enter as fallback) */
export const deepseekClickSend = () => `
(async () => {
  await new Promise(r => setTimeout(r, 300));

  // The Send button in DeepSeek has dynamic classes, but typically has an upward arrow or similar.
  const btnSelectors = [
    '._52c986b:not(:has(.ds-icon-stop))', // Try to exclude the stop button if it uses the same container
    'div[role="button"]:has(svg)',
    '.send-button',
  ];

  const exactBtn = document.querySelector('._52c986b');
  if (exactBtn && exactBtn.getAttribute('aria-disabled') !== 'true') {
    exactBtn.click();
    return { method: 'exact-class' };
  }

  // Better approach: Find buttons in the same container as the textarea
  const textarea = document.querySelector('textarea');
  if (textarea) {
    let container = textarea.parentElement;
    for (let i = 0; i < 5; i++) {
      if (container) container = container.parentElement;
    }
    
    if (container) {
      const btns = Array.from(container.querySelectorAll('div[role="button"]'));
      const validBtns = btns.filter(b => {
        // Exclude disabled
        if (b.getAttribute('aria-disabled') === 'true') return false;
        // Exclude stop buttons
        if (b.innerHTML.includes('stop') || b.querySelector('.ds-icon-stop')) return false;
        // Must have an SVG
        if (!b.querySelector('svg')) return false;
        // Exclude buttons with text (like "Smart Search", "Deep thinking")
        if (b.innerText && b.innerText.trim().length > 0) return false;
        return true;
      });

      if (validBtns.length > 0) {
        // The send button is usually the last icon-only button
        const sendBtn = validBtns[validBtns.length - 1];
        sendBtn.click();
        return { method: 'container-heuristic' };
      }
    }
  }

  for (const sel of btnSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const btn = el.tagName === 'BUTTON' ? el : el.closest('button') || el;
      if (btn && !btn.disabled) {
        btn.click();
        return { method: 'button', sel };
      }
    }
  }

  if (textarea) {
    textarea.focus();
    // Multiline prompts often require Ctrl+Enter or Cmd+Enter to send!
    textarea.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
      ctrlKey: true, metaKey: true,
      bubbles: true, cancelable: true,
    }));
    textarea.dispatchEvent(new KeyboardEvent('keyup', {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13, 
      ctrlKey: true, metaKey: true, bubbles: true,
    }));
    return { method: 'enter-fallback' };
  }

  return { method: 'none' };
})()
`;

/** 
 * Get the current baseline.
 * Returns an object with both max virtual-list-item-key AND a hash of all current .ds-markdown text.
 * Whichever is available will be used for detection.
 * 
 * NOTE: The orchestrator stores this as a number. We return the max key if available,
 * otherwise we return the count of .ds-markdown elements.
 */
export const deepseekGetCount = () => `
(() => {
  // Try virtual list key approach first
  const items = document.querySelectorAll('[data-virtual-list-item-key]');
  if (items.length > 0) {
    let maxKey = 0;
    items.forEach(el => {
      const k = parseInt(el.getAttribute('data-virtual-list-item-key'), 10);
      if (!isNaN(k) && k > maxKey) maxKey = k;
    });
    if (maxKey > 0) return maxKey;
  }
  // Fallback: count .ds-markdown elements
  return document.querySelectorAll('.ds-markdown').length;
})()
`;

/** 
 * Poll for a new DeepSeek response.
 * 
 * Dual-mode strategy:
 * Mode A (preferred): Use data-virtual-list-item-key — immune to virtual list evictions
 * Mode B (fallback): Compare .ds-markdown count — works if virtual list keys are absent
 * 
 * The orchestrator's STABILITY_CHECKS (2 polls with same text) handles streaming detection.
 */
export const deepseekGetResponse = (minCount) => `
(() => {
  const minKey = ${minCount};

  // ── Mode A: Virtual list key ──
  const vlistItems = Array.from(document.querySelectorAll('[data-virtual-list-item-key]'));
  let maxKey = 0;
  vlistItems.forEach(el => {
    const k = parseInt(el.getAttribute('data-virtual-list-item-key'), 10);
    if (!isNaN(k) && k > maxKey) maxKey = k;
  });

  const usingVlist = maxKey > 0;

  if (usingVlist) {
    if (maxKey <= minKey) {
      return { done: false, text: null, reason: 'vlist-count-too-low', maxKey, minKey };
    }
  } else {
    // ── Mode B: .ds-markdown count fallback ──
    const mdCount = document.querySelectorAll('.ds-markdown').length;
    if (mdCount <= minKey) {
      return { done: false, text: null, reason: 'md-count-too-low', mdCount, minKey };
    }
  }

  // Get the last .ds-markdown content
  const markdowns = document.querySelectorAll('.ds-markdown');
  if (markdowns.length === 0) {
    return { done: false, text: null, reason: 'no-markdown', maxKey };
  }

  const last = markdowns[markdowns.length - 1];
  const text = (last.innerText || last.textContent || '').trim();

  if (!text || text.length < 10) {
    return { done: false, text: null, reason: 'text-too-short', maxKey };
  }

  // Safety: reject our own injected cross-prompts
  if (
    text.includes('ChatGPT responded:') ||
    text.includes('Google Gemini responded:') ||
    text.includes('DeepSeek responded:') ||
    text.includes('Do you agree or disagree?') ||
    text.includes('Do you maintain your position')
  ) {
    return { done: false, text: null, reason: 'cross-prompt-echo', maxKey };
  }

  return { done: true, text, maxKey, mode: usingVlist ? 'vlist' : 'mdcount' };
})()
`;





