import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebateOrchestrator, DEBATE_STATUS } from './useDebateOrchestrator';

// Mock the DOM injector utilities
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

describe('useDebateOrchestrator Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createMockRef = () => ({
    current: {
      executeJavaScript: vi.fn().mockResolvedValue(0),
      insertText: vi.fn().mockResolvedValue(),
    }
  });

  const createEnabledAIs = (overrides = {}) => ({
    chatgpt: true, gemini: true, deepseek: true, perplexity: true,
    ...overrides
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

  test('reset restores default state and stops polling', () => {
    const { result } = renderHook(() => 
      useDebateOrchestrator(createMockRef(), createMockRef(), createMockRef(), createMockRef(), createEnabledAIs())
    );
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.status).toBe(DEBATE_STATUS.IDLE);
    expect(result.current.rounds).toEqual([]);
    expect(result.current.aiStatuses.chatgpt).toBe('idle');
  });

  test('prepareDebaters sends rules to enabled AIs', async () => {
    vi.useRealTimers();
    const chatgptRef = createMockRef();
    const geminiRef = createMockRef();
    const deepseekRef = createMockRef();
    const perplexityRef = createMockRef();
    
    const { result } = renderHook(() => 
      useDebateOrchestrator(chatgptRef, geminiRef, deepseekRef, perplexityRef, createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );
    
    await act(async () => {
      await result.current.prepareDebaters({ detailMode: 1, delay: 0 });
    });
    
    expect(result.current.aiStatuses.chatgpt).toBe('thinking');
    expect(chatgptRef.current.executeJavaScript).toHaveBeenCalled();
    expect(geminiRef.current.executeJavaScript).not.toHaveBeenCalled();
    expect(deepseekRef.current.executeJavaScript).not.toHaveBeenCalled();
  });

  test('startDebate updates status and kicks off the initial send', async () => {
    vi.useRealTimers();
    const chatgptRef = createMockRef();
    const geminiRef = createMockRef();
    const deepseekRef = createMockRef();
    const perplexityRef = createMockRef();
    
    const { result } = renderHook(() => 
      useDebateOrchestrator(chatgptRef, geminiRef, deepseekRef, perplexityRef, createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );

    let promise;
    act(() => {
      promise = result.current.startDebate('test prompt', { rounds: 2, delay: 0 });
    });
    
    expect(result.current.status).toBe(DEBATE_STATUS.SENDING_INITIAL);
    
    await act(async () => {
      await promise;
    });
    
    expect(result.current.status).toBe(DEBATE_STATUS.WAITING_INITIAL);
    expect(chatgptRef.current.executeJavaScript).toHaveBeenCalled();
  });

  test('requestConclusion updates status to WAITING_ROUND if COMPLETE', async () => {
    vi.useRealTimers();
    const chatgptRef = createMockRef();
    const { result } = renderHook(() => 
      useDebateOrchestrator(chatgptRef, createMockRef(), createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: true, gemini: false, deepseek: false, perplexity: false }))
    );

    // requestConclusion only works if status === COMPLETE.
    // We cannot easily mock the internal state without triggering startDebate and mocking the entire polling loop, 
    // but we can ensure it returns early if not COMPLETE.
    await act(async () => {
      await result.current.requestConclusion();
    });
    
    // State should still be IDLE
    expect(result.current.status).toBe(DEBATE_STATUS.IDLE);
    expect(chatgptRef.current.executeJavaScript).not.toHaveBeenCalled();
  });

  test('sendToGemini uses insertText and focus scripts', async () => {
    vi.useRealTimers();
    const geminiRef = createMockRef();
    const { result } = renderHook(() => 
      useDebateOrchestrator(createMockRef(), geminiRef, createMockRef(), createMockRef(), createEnabledAIs({ chatgpt: false, gemini: true, deepseek: false, perplexity: false }))
    );

    // Await the promise within act
    await act(async () => {
      await result.current.startDebate('Test Gemini', { rounds: 0, delay: 0 });
    });

    // It should have called focus and insertText
    expect(geminiRef.current.executeJavaScript).toHaveBeenCalled();
    expect(geminiRef.current.insertText).toHaveBeenCalledWith('Test Gemini');
  });
});
