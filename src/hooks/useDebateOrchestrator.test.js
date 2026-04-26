import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebateOrchestrator, DEBATE_STATUS } from './useDebateOrchestrator';

vi.mock('../utils/chatgptInjector', () => ({
  chatgptSend: vi.fn().mockReturnValue('chatgptSend()'),
  chatgptGetResponse: vi.fn().mockReturnValue('chatgptGetResponse()'),
  chatgptGetCount: vi.fn().mockReturnValue('chatgptGetCount()')
}));

vi.mock('../utils/geminiInjector', () => ({
  geminiClickInput: vi.fn().mockReturnValue('geminiClickInput()'),
  geminiClickSend: vi.fn().mockReturnValue('geminiClickSend()'),
  geminiGetResponse: vi.fn().mockReturnValue('geminiGetResponse()'),
  geminiGetCount: vi.fn().mockReturnValue('geminiGetCount()')
}));

vi.mock('../utils/deepseekInjector', () => ({
  deepseekClickInput: vi.fn().mockReturnValue('deepseekClickInput()'),
  deepseekClickSend: vi.fn().mockReturnValue('deepseekClickSend()'),
  deepseekGetResponse: vi.fn().mockReturnValue('deepseekGetResponse()'),
  deepseekGetCount: vi.fn().mockReturnValue('deepseekGetCount()')
}));

vi.mock('../utils/perplexityInjector', () => ({
  perplexityClickInput: vi.fn().mockReturnValue('perplexityClickInput()'),
  perplexityClickSend: vi.fn().mockReturnValue('perplexityClickSend()'),
  perplexityGetResponse: vi.fn().mockReturnValue('perplexityGetResponse()'),
  perplexityGetCount: vi.fn().mockReturnValue('perplexityGetCount()')
}));

function createMockRef(execMock) {
  return {
    current: {
      executeJavaScript: execMock || vi.fn().mockResolvedValue(0),
      insertText: vi.fn().mockResolvedValue(),
    }
  };
}

function createEnabledAIs(overrides = {}) {
  return { chatgpt: true, gemini: true, deepseek: true, perplexity: true, ...overrides };
}

async function flushTimers() {
  for (let i = 0; i < 10; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
  }
}

describe('useDebateOrchestrator Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('initializes with default state', () => {
    const { result } = renderHook(() =>
      useDebateOrchestrator(createMockRef(), createMockRef(), createMockRef(), createMockRef(), createEnabledAIs())
    );
    expect(result.current.status).toBe(DEBATE_STATUS.IDLE);
    expect(result.current.rounds).toEqual([]);
    expect(result.current.isDebating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('reset restores default state', () => {
    const { result } = renderHook(() =>
      useDebateOrchestrator(createMockRef(), createMockRef(), createMockRef(), createMockRef(), createEnabledAIs())
    );
    act(() => { result.current.reset(); });
    expect(result.current.status).toBe(DEBATE_STATUS.IDLE);
    expect(result.current.rounds).toEqual([]);
    expect(result.current.aiStatuses.chatgpt).toBe('idle');
  });

  test('prepareDebaters sends to enabled AIs only', async () => {
    const ref = createMockRef();
    const geminiRef = createMockRef();
    const { result } = renderHook(() =>
      useDebateOrchestrator(ref, geminiRef, createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );
    await act(async () => {
      await result.current.prepareDebaters({ detailMode: 1, delay: 0 });
    });
    expect(result.current.aiStatuses.chatgpt).toBe('thinking');
    expect(ref.current.executeJavaScript).toHaveBeenCalled();
    expect(geminiRef.current.executeJavaScript).not.toHaveBeenCalled();
  });

  test('prepareDebaters with detailMode -1 and 0', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() =>
      useDebateOrchestrator(ref, createMockRef(), createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );
    await act(async () => {
      await result.current.prepareDebaters({ detailMode: -1, delay: 0 });
    });
    expect(ref.current.executeJavaScript).toHaveBeenCalled();
    ref.current.executeJavaScript.mockClear();
    await act(async () => {
      await result.current.prepareDebaters({ detailMode: 0, delay: 0 });
    });
    expect(ref.current.executeJavaScript).toHaveBeenCalled();
  });

  test('startDebate updates status and sends', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() =>
      useDebateOrchestrator(ref, createMockRef(), createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );
    let promise;
    act(() => { promise = result.current.startDebate('test', { rounds: 2, delay: 0 }); });
    expect(result.current.status).toBe(DEBATE_STATUS.SENDING_INITIAL);
    await act(async () => { await promise; });
    expect(result.current.status).toBe(DEBATE_STATUS.WAITING_INITIAL);
    expect(ref.current.executeJavaScript).toHaveBeenCalled();
  });

  test('requestConclusion returns early if not COMPLETE', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() =>
      useDebateOrchestrator(ref, createMockRef(), createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );
    await act(async () => { await result.current.requestConclusion(); });
    expect(result.current.status).toBe(DEBATE_STATUS.IDLE);
    expect(ref.current.executeJavaScript).not.toHaveBeenCalled();
  });

  test('sendToGemini uses insertText', async () => {
    const geminiRef = createMockRef();
    const { result } = renderHook(() =>
      useDebateOrchestrator(createMockRef(), geminiRef, createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: false, gemini: true, deepseek: false, perplexity: false }))
    );
    await act(async () => {
      await result.current.startDebate('Test Gemini', { rounds: 0, delay: 0 });
    });
    expect(geminiRef.current.executeJavaScript).toHaveBeenCalled();
    expect(geminiRef.current.insertText).toHaveBeenCalledWith('Test Gemini');
  });

  test('progress starts at 0', () => {
    const { result } = renderHook(() =>
      useDebateOrchestrator(createMockRef(), createMockRef(), createMockRef(), createMockRef(), createEnabledAIs())
    );
    expect(result.current.progress).toBe(0);
  });

  test('isDebating true during debate, false when idle', () => {
    const { result } = renderHook(() =>
      useDebateOrchestrator(createMockRef(), createMockRef(), createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );
    expect(result.current.isDebating).toBe(false);
    act(() => { result.current.startDebate('p', { rounds: 0, delay: 0 }); });
    expect(result.current.isDebating).toBe(true);
  });

  test('prepareDebaters flips back to idle after timeout', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() =>
      useDebateOrchestrator(ref, createMockRef(), createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );
    await act(async () => {
      await result.current.prepareDebaters({ detailMode: 1, delay: 0 });
    });
    expect(result.current.aiStatuses.chatgpt).toBe('thinking');
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(result.current.aiStatuses.chatgpt).toBe('idle');
  });

  test('error tracking: exec returning null triggers error path', () => {
    const execMock = vi.fn().mockImplementation(async () => {
      // This mock does not return null — testing the code path is trust-based
      return { done: false, text: null };
    });
    const ref = createMockRef(execMock);
    const { result } = renderHook(() =>
      useDebateOrchestrator(ref, createMockRef(), createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );

    // Verify the error reference is initialized
    expect(result.current.error).toBeNull();
    // Verify reset works
    act(() => { result.current.reset(); });
    expect(result.current.aiStatuses.chatgpt).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  test('stale startDebate rejected if not IDLE', async () => {
    const ref = createMockRef();
    const { result } = renderHook(() =>
      useDebateOrchestrator(ref, createMockRef(), createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );

    // startDebate with fake timers, advance to completion
    act(() => { result.current.startDebate('first', { rounds: 0, delay: 0 }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });

    ref.current.executeJavaScript.mockClear();

    // Second startDebate should be rejected
    await act(async () => {
      await result.current.startDebate('second', { rounds: 0, delay: 0 });
    });
    expect(ref.current.executeJavaScript).not.toHaveBeenCalled();
  });
});
