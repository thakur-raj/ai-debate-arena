import { describe, test, expect, afterEach } from 'vitest';
import {
  perplexityClickInput,
  perplexityClickSend,
  perplexityGetCount,
  perplexityGetResponse,
} from './perplexityInjector';

afterEach(() => { document.body.innerHTML = ''; });

async function evalInDom(code, setupFn) {
  document.body.innerHTML = '';
  setupFn();
  const wrapped = `(${code})`;
  return eval(wrapped);
}

describe('perplexityInjector', () => {
  describe('perplexityClickInput', () => {
    test('finds #ask-input > p > span', async () => {
      const result = await evalInDom(perplexityClickInput(), () => {
        document.body.innerHTML = `<div id="ask-input"><p><span contenteditable="true"></span></p></div>`;
      });
      expect(result.found).toBe(true);
    });

    test('empty DOM = not found', async () => {
      const result = await evalInDom(perplexityClickInput(), () => {});
      expect(result.found).toBe(false);
    });
  });

  describe('perplexityClickSend', () => {
    test('button via aria-label', async () => {
      const result = await evalInDom(perplexityClickSend(), () => {
        const btn = document.createElement('button');
        btn.setAttribute('aria-label', 'Submit');
        btn.disabled = false;
        document.body.appendChild(btn);
      });
      expect(result.method).toBe('button');
      expect(result.sel).toContain('Submit');
    });

    test('enter-fallback when input but no button', async () => {
      const result = await evalInDom(perplexityClickSend(), () => {
        document.body.innerHTML = `<div id="ask-input" contenteditable="true"></div>`;
      });
      expect(result.method).toBe('enter-fallback');
    });
  });

  describe('perplexityGetCount sync', () => {
    test('max count across selectors', () => {
      document.body.innerHTML = '';
      for (let i = 0; i < 2; i++) {
        const el = document.createElement('div');
        el.setAttribute('data-role', 'assistant');
        document.body.appendChild(el);
      }
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('div');
        el.className = 'prose';
        document.body.appendChild(el);
      }
      const code = perplexityGetCount();
      expect(eval(`(${code})`)).toBe(3);
    });
  });

  describe('perplexityGetResponse', () => {
    test('done=true with full response', async () => {
      const result = await evalInDom(perplexityGetResponse(0), () => {
        const msg = document.createElement('div');
        msg.setAttribute('data-role', 'assistant');
        msg.innerText = 'This is a complete response with ending punctuation.';
        document.body.appendChild(msg);
      });
      expect(result.done).toBe(true);
      expect(result.text.length).toBeGreaterThanOrEqual(20);
    });

    test('done=false when streaming', async () => {
      const result = await evalInDom(perplexityGetResponse(0), () => {
        const spinner = document.createElement('div');
        spinner.className = 'animate-spin';
        Object.defineProperty(spinner, 'offsetParent', { value: document.body, writable: true });
        document.body.appendChild(spinner);
      });
      expect(result.done).toBe(false);
      expect(result.reason).toBe('streaming');
    });

    test('done=false when text too short', async () => {
      const result = await evalInDom(perplexityGetResponse(0), () => {
        const msg = document.createElement('div');
        msg.setAttribute('data-role', 'assistant');
        msg.innerText = 'Hi';
        document.body.appendChild(msg);
      });
      expect(result.done).toBe(false);
      expect(result.reason).toBe('text-too-short');
    });

    test('strips citation markers', async () => {
      const result = await evalInDom(perplexityGetResponse(0), () => {
        const msg = document.createElement('div');
        msg.setAttribute('data-testid', 'message-assistant');
        msg.innerText = 'This is a response with [1] and ^[2] citations.';
        document.body.appendChild(msg);
      });
      expect(result.done).toBe(true);
      expect(result.text).not.toContain('[1]');
      expect(result.text).not.toContain('^[2]');
    });
  });
});
