import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import InputBar from './InputBar';

describe('InputBar Component', () => {
  test('shows Prepare Debaters button when idle', () => {
    const onPrepareMock = vi.fn();
    render(
      <InputBar isDebating={false} isComplete={false} onPrepareDebaters={onPrepareMock} onSend={() => {}} />
    );
    const prepareBtn = screen.getByText('🥊 Prepare Debaters');
    expect(prepareBtn).toBeInTheDocument();
    fireEvent.click(prepareBtn);
    expect(onPrepareMock).toHaveBeenCalledTimes(1);
  });

  test('calls onSend with input text and clears input', () => {
    const onSendMock = vi.fn();
    render(
      <InputBar isDebating={false} isComplete={false} onSend={onSendMock} />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    const sendBtn = screen.getByTitle('Send to both AIs');
    fireEvent.click(sendBtn);
    
    expect(onSendMock).toHaveBeenCalledWith('Hello world');
    expect(input.value).toBe('');
  });

  test('shows stop button when debating and calls onReset', () => {
    const onResetMock = vi.fn();
    render(
      <InputBar isDebating={true} isComplete={false} onReset={onResetMock} onSend={() => {}} />
    );
    
    const stopBtn = screen.getByTitle('Stop debate');
    expect(stopBtn).toBeInTheDocument();
    fireEvent.click(stopBtn);
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });

  test('shows final verdict button when complete and calls onRequestConclusion', () => {
    const onConclusionMock = vi.fn();
    render(
      <InputBar isDebating={false} isComplete={true} hasVerdict={false} onRequestConclusion={onConclusionMock} onSend={() => {}} />
    );
    
    const verdictBtn = screen.getByText('🏁 Get Final Verdict');
    expect(verdictBtn).toBeInTheDocument();
    fireEvent.click(verdictBtn);
    expect(onConclusionMock).toHaveBeenCalledTimes(1);
  });

  test('handles hover on buttons', () => {
    render(<InputBar isDebating={false} isComplete={false} />);
    const prepareBtn = screen.getByText('🥊 Prepare Debaters');
    fireEvent.mouseEnter(prepareBtn);
    expect(prepareBtn.style.background).toBe('rgba(74, 144, 217, 0.25)');
    fireEvent.mouseLeave(prepareBtn);
    expect(prepareBtn.style.background).toBe('rgba(74, 144, 217, 0.12)');
  });

  test('handles hover on stop button', () => {
    render(<InputBar isDebating={true} isComplete={false} />);
    const stopBtn = screen.getByTitle('Stop debate');
    fireEvent.mouseEnter(stopBtn);
    expect(stopBtn.style.background).toBe('rgba(244, 67, 54, 0.22)');
    fireEvent.mouseLeave(stopBtn);
    expect(stopBtn.style.background).toBe('rgba(244, 67, 54, 0.1)');
  });

  test('handles hover on get final verdict button', () => {
    render(<InputBar isDebating={false} isComplete={true} hasVerdict={false} />);
    const verdictBtn = screen.getByText('🏁 Get Final Verdict');
    fireEvent.mouseEnter(verdictBtn);
    expect(verdictBtn.style.background).toBe('rgba(199, 125, 255, 0.3)');
    fireEvent.mouseLeave(verdictBtn);
    expect(verdictBtn.style.background).toBe('rgba(199, 125, 255, 0.15)');
  });

  test('handles enter key to send', () => {
    const onSendMock = vi.fn();
    render(<InputBar isDebating={false} isComplete={false} onSend={onSendMock} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(onSendMock).toHaveBeenCalledWith('Test');
  });
});
