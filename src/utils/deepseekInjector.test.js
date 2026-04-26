import { describe, test, expect, afterEach } from 'vitest';
import {
  deepseekClickInput,
  deepseekClickSend,
  deepseekGetCount,
  deepseekGetResponse,
} from './deepseekInjector';

afterEach(() => { document.body.innerHTML = ''; });

async function evalInDom(code, setupFn) {
  document.body.innerHTML = '';
  setupFn();
  const wrapped = `(${code})`;
  return eval(wrapped);
}

describe('deepseekInjector', () => {
  describe('deepseekClickInput', () => {
    test('finds textarea', async () => {
      const result = await evalInDom(deepseekClickInput(), () => {
        document.body.innerHTML = `<textarea placeholder="Message DeepSeek"></textarea>`;
      });
      expect(result.found).toBe(true);
    });

    test('empty DOM = not found', async () => {
      const result = await evalInDom(deepseekClickInput(), () => {});
      expect(result.found).toBe(false);
    });
  });

  describe('deepseekClickSend', () => {
    test('exact class match', async () => {
      const result = await evalInDom(deepseekClickSend(), () => {
        const btn = document.createElement('div');
        btn.className = '_52c986b';
        btn.setAttribute('aria-disabled', 'false');
        document.body.appendChild(btn);
      });
      expect(result.method).toBe('exact-class');
    });

    test('textareas alone → enter-fallback', async () => {
      const result = await evalInDom(deepseekClickSend(), () => {
        document.body.innerHTML = `<textarea></textarea>`;
      });
      expect(result.method).toBe('enter-fallback');
    });
  });

  describe('deepseekGetCount sync', () => {
    test('virtual list key', () => {
      document.body.innerHTML = '';
      for (let i = 1; i <= 3; i++) {
        const el = document.createElement('div');
        el.setAttribute('data-virtual-list-item-key', String(i));
        document.body.appendChild(el);
      }
      const code = deepseekGetCount();
      expect(eval(`(${code})`)).toBe(3);
    });

    test('ds-markdown fallback', () => {
      document.body.innerHTML = '';
      for (let i = 0; i < 2; i++) {
        const el = document.createElement('div');
        el.className = 'ds-markdown';
        document.body.appendChild(el);
      }
      const code = deepseekGetCount();
      expect(eval(`(${code})`)).toBe(2);
    });
  });

  describe('deepseekGetResponse', () => {
    test('done=true via vlist', async () => {
      const result = await evalInDom(deepseekGetResponse(1), () => {
        const vitem = document.createElement('div');
        vitem.setAttribute('data-virtual-list-item-key', '3');
        document.body.appendChild(vitem);
        const md = document.createElement('div');
        md.className = 'ds-markdown';
        md.innerText = 'A'.repeat(50);
        document.body.appendChild(md);
      });
      expect(result.done).toBe(true);
      expect(result.text.length).toBeGreaterThanOrEqual(10);
    });

    test('rejects cross-prompt echo', async () => {
      const result = await evalInDom(deepseekGetResponse(1), () => {
        const vitem = document.createElement('div');
        vitem.setAttribute('data-virtual-list-item-key', '3');
        document.body.appendChild(vitem);
        const md = document.createElement('div');
        md.className = 'ds-markdown';
        md.innerText = 'ChatGPT responded:\nI think...';
        document.body.appendChild(md);
      });
      expect(result.done).toBe(false);
      expect(result.reason).toBe('cross-prompt-echo');
    });
  });
});
