import { describe, test, expect, afterEach } from 'vitest';
import {
  chatgptSend,
  chatgptGetCount,
  chatgptGetResponse,
} from './chatgptInjector';

afterEach(() => {
  document.body.innerHTML = '';
});

async function evalInDom(code, setupFn) {
  document.body.innerHTML = '';
  setupFn();
  const wrapped = `(${code})`;
  return eval(wrapped);
}

describe('chatgptInjector', () => {
  describe('chatgptSend', () => {
    test('textarea + send button', async () => {
      const result = await evalInDom(chatgptSend('hello world'), () => {
        document.body.innerHTML = `<textarea id="prompt-textarea"></textarea>`;
        const btn = document.createElement('button');
        btn.setAttribute('data-testid', 'send-button');
        btn.disabled = false;
        document.body.appendChild(btn);
      });
      expect(result.success).toBe(true);
      expect(result.method).toBe('button');
      const textarea = document.querySelector('#prompt-textarea');
      expect(textarea.value).toBe('hello world');
    });

    test('contenteditable fallback', async () => {
      const result = await evalInDom(chatgptSend('test'), () => {
        document.body.innerHTML = `<div contenteditable="true"></div>`;
        const btn = document.createElement('button');
        btn.setAttribute('aria-label', 'Send prompt');
        btn.disabled = false;
        document.body.appendChild(btn);
      });
      expect(result.success).toBe(true);
    });

    test('no input = failure', async () => {
      const result = await evalInDom(chatgptSend('msg'), () => {
        document.body.innerHTML = '';
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input not found');
    });
  });

  describe('chatgptGetCount sync', () => {
    test('3 assistant messages', () => {
      document.body.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('div');
        el.setAttribute('data-message-author-role', 'assistant');
        document.body.appendChild(el);
      }
      const code = chatgptGetCount();
      const wrapped = `(${code})`;
      expect(eval(wrapped)).toBe(3);
    });

    test('0 assistant messages', () => {
      document.body.innerHTML = '';
      const code = chatgptGetCount();
      const wrapped = `(${code})`;
      expect(eval(wrapped)).toBe(0);
    });
  });

  describe('chatgptGetResponse', () => {
    test('done=true with sufficient text', async () => {
      const result = await evalInDom(chatgptGetResponse(1), () => {
        const msg = document.createElement('div');
        msg.setAttribute('data-message-author-role', 'assistant');
        msg.innerText = 'A'.repeat(50);
        document.body.appendChild(msg);
        const msg2 = document.createElement('div');
        msg2.setAttribute('data-message-author-role', 'assistant');
        msg2.innerText = 'B'.repeat(50);
        document.body.appendChild(msg2);
      });
      expect(result.done).toBe(true);
      expect(result.text.length).toBeGreaterThanOrEqual(10);
    });

    test('done=false when stop button visible', async () => {
      const result = await evalInDom(chatgptGetResponse(0), () => {
        const btn = document.createElement('button');
        btn.setAttribute('data-testid', 'stop-button');
        Object.defineProperty(btn, 'offsetParent', { value: document.body, writable: true });
        document.body.appendChild(btn);
      });
      expect(result.done).toBe(false);
      expect(result.reason).toBe('stop-btn-visible');
    });
  });
});
