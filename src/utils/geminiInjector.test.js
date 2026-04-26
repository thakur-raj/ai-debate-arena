import { describe, test, expect, afterEach } from 'vitest';
import {
  geminiClickInput,
  geminiClickSend,
  geminiGetCount,
  geminiGetResponse,
} from './geminiInjector';

afterEach(() => { document.body.innerHTML = ''; });

async function evalInDom(code, setupFn) {
  document.body.innerHTML = '';
  setupFn();
  const wrapped = `(${code})`;
  return eval(wrapped);
}

describe('geminiInjector', () => {
  describe('geminiClickInput', () => {
    test('finds ql-editor', async () => {
      const result = await evalInDom(geminiClickInput(), () => {
        document.body.innerHTML = `<div class="ql-editor" contenteditable="true">existing</div>`;
      });
      expect(result.found).toBe(true);
    });

    test('empty DOM = not found', async () => {
      const result = await evalInDom(geminiClickInput(), () => {});
      expect(result.found).toBe(false);
    });
  });

  describe('geminiClickSend', () => {
    test('button via aria-label', async () => {
      const result = await evalInDom(geminiClickSend(), () => {
        const btn = document.createElement('button');
        btn.setAttribute('aria-label', 'Send message');
        btn.disabled = false;
        document.body.appendChild(btn);
      });
      expect(result.method).toBe('button');
      expect(result.sel).toContain('Send message');
    });

    test('enter-fallback when contenteditable exists but no button', async () => {
      const result = await evalInDom(geminiClickSend(), () => {
        document.body.innerHTML = `<div class="ql-editor" contenteditable="true"></div>`;
      });
      expect(result.method).toBe('enter-fallback');
    });

    test('none when nothing', async () => {
      const result = await evalInDom(geminiClickSend(), () => {});
      expect(result.method).toBe('none');
    });
  });

  describe('geminiGetCount sync', () => {
    test('count model-response elements', () => {
      document.body.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const el = document.createElement('model-response');
        document.body.appendChild(el);
      }
      const code = geminiGetCount();
      expect(eval(`(${code})`)).toBe(4);
    });
  });

  describe('geminiGetResponse', () => {
    test('done=true with text >= 20', async () => {
      const result = await evalInDom(geminiGetResponse(0), () => {
        const resp = document.createElement('model-response');
        resp.innerText = 'A'.repeat(50);
        document.body.appendChild(resp);
      });
      expect(result.done).toBe(true);
      expect(result.text.length).toBeGreaterThanOrEqual(20);
    });

    test('done=false when stop button visible', async () => {
      const result = await evalInDom(geminiGetResponse(0), () => {
        const btn = document.createElement('button');
        btn.setAttribute('aria-label', 'Stop generating');
        Object.defineProperty(btn, 'offsetParent', { value: document.body, writable: true });
        document.body.appendChild(btn);
      });
      expect(result.done).toBe(false);
    });
  });
});
