import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import ConclusionPanel from './ConclusionPanel';
import { DEBATE_STATUS } from '../hooks/useDebateOrchestrator';

const enabledAIs = { chatgpt: true, gemini: true, deepseek: true, perplexity: true };

const makeRound = (overrides = {}) => ({
  round: 0,
  label: 'Round 0',
  chatgpt: 'ChatGPT says hello',
  gemini: 'Gemini says hi',
  deepseek: 'DeepSeek says hey',
  perplexity: 'Perplexity says yo',
  ...overrides,
});

describe('ConclusionPanel', () => {
  test('shows empty state when idle and no rounds', () => {
    render(<ConclusionPanel status={DEBATE_STATUS.IDLE} rounds={[]} enabledAIs={enabledAIs} />);
    expect(screen.getByText(/Type a question below/)).toBeDefined();
  });

  test('does not show empty state when debating', () => {
    render(<ConclusionPanel status={DEBATE_STATUS.SENDING_INITIAL} rounds={[]} enabledAIs={enabledAIs} />);
    expect(screen.queryByText(/Type a question below/)).toBeNull();
  });

  test('shows debating indicator when status is active', () => {
    render(<ConclusionPanel status={DEBATE_STATUS.WAITING_INITIAL} rounds={[]} enabledAIs={enabledAIs} />);
    expect(screen.getByText(/Debating…/)).toBeDefined();
  });

  test('shows done status pill when complete', () => {
    const { container } = render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={[]} enabledAIs={enabledAIs} />);
    expect(screen.getByText('Done')).toBeDefined();
    const pill = container.querySelector('.status-pill.done');
    expect(pill).not.toBeNull();
  });

  test('renders round transcript text', () => {
    const rounds = [makeRound()];
    render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />);
    expect(screen.getByText('ChatGPT says hello')).toBeDefined();
    expect(screen.getByText('Gemini says hi')).toBeDefined();
    expect(screen.getByText('DeepSeek says hey')).toBeDefined();
    expect(screen.getByText('Perplexity says yo')).toBeDefined();
  });

  test('shows FinalConclusionCard when complete', () => {
    const rounds = [makeRound()];
    render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />);
    expect(screen.getByText(/Debate Complete/)).toBeDefined();
  });

  test('request final verdict button fires callback', () => {
    const onRequestConclusion = vi.fn();
    const rounds = [makeRound()];
    render(
      <ConclusionPanel
        status={DEBATE_STATUS.COMPLETE}
        rounds={rounds}
        onRequestConclusion={onRequestConclusion}
        enabledAIs={enabledAIs}
      />
    );
    fireEvent.click(screen.getByText(/Request Final Verdict/));
    expect(onRequestConclusion).toHaveBeenCalledTimes(1);
  });

  test('shows verdict requested text when hasVerdict', () => {
    const rounds = [makeRound({ isFinalVerdict: true, round: 999, label: 'Final Verdict' })];
    render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />);
    expect(screen.getByText(/final verdict requested/i)).toBeDefined();
  });

  test('vote buttons appear for all enabled AIs', () => {
    const rounds = [makeRound()];
    const { container } = render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />);
    expect(container.querySelector('#vote-chatgpt-btn')).not.toBeNull();
    expect(container.querySelector('#vote-gemini-btn')).not.toBeNull();
    expect(container.querySelector('#vote-deepseek-btn')).not.toBeNull();
    expect(container.querySelector('#vote-perplexity-btn')).not.toBeNull();
  });

  test('vote selection shows winner and change button', () => {
    const rounds = [makeRound()];
    const { container } = render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />);
    fireEvent.click(container.querySelector('#vote-chatgpt-btn'));
    expect(screen.getByText(/ChatGPT wins/)).toBeDefined();
    expect(screen.getByText('Change')).toBeDefined();
  });

  test('change button resets vote', () => {
    const rounds = [makeRound()];
    const { container } = render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />);
    fireEvent.click(container.querySelector('#vote-chatgpt-btn'));
    fireEvent.click(screen.getByText('Change'));
    expect(screen.queryByText(/ChatGPT wins/)).toBeNull();
    expect(container.querySelector('#vote-chatgpt-btn')).not.toBeNull();
  });

  test('resets vote on new debate start', () => {
    const rounds = [makeRound()];
    const { container, rerender } = render(
      <ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />
    );
    fireEvent.click(container.querySelector('#vote-chatgpt-btn'));
    expect(screen.getByText(/ChatGPT wins/)).toBeDefined();

    rerender(
      <ConclusionPanel status={DEBATE_STATUS.SENDING_INITIAL} rounds={[]} enabledAIs={enabledAIs} />
    );
    expect(screen.queryByText(/ChatGPT wins/)).toBeNull();
  });

  test('only shows enabled AI vote buttons', () => {
    const rounds = [makeRound()];
    const partialAIs = { chatgpt: true, gemini: false, deepseek: true, perplexity: false };
    const { container } = render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={partialAIs} />);
    expect(container.querySelector('#vote-chatgpt-btn')).not.toBeNull();
    expect(container.querySelector('#vote-gemini-btn')).toBeNull();
    expect(container.querySelector('#vote-deepseek-btn')).not.toBeNull();
    expect(container.querySelector('#vote-perplexity-btn')).toBeNull();
  });

  test('shows AI names in transcript header', () => {
    const rounds = [makeRound()];
    render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />);
    const container = document.querySelector('.debate-vs');
    expect(container.textContent).toContain('ChatGPT');
    expect(container.textContent).toContain('Gemini');
    expect(container.textContent).toContain('DeepSeek');
    expect(container.textContent).toContain('Perplexity');
  });

  test('round count shows correct number', () => {
    const rounds = [makeRound({ round: 0 }), makeRound({ round: 1 })];
    render(<ConclusionPanel status={DEBATE_STATUS.COMPLETE} rounds={rounds} enabledAIs={enabledAIs} />);
    expect(screen.getByText(/2 Rounds/)).toBeDefined();
  });
});
