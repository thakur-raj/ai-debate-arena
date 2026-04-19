import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Header from './Header';
import { DEBATE_STATUS } from '../hooks/useDebateOrchestrator';

describe('Header Component', () => {
  test('renders logo and basic title', () => {
    render(<Header status={DEBATE_STATUS.IDLE} rounds={[]} maxRounds={2} progress={0} onOpenSettings={() => {}} />);
    expect(screen.getByText('AI Debate Arena')).toBeInTheDocument();
    expect(screen.getByText('GPT')).toBeInTheDocument();
    expect(screen.getByText('Gemini')).toBeInTheDocument();
  });

  test('shows current status when debating', () => {
    render(<Header status={DEBATE_STATUS.CROSS_SHARING} rounds={[{}]} maxRounds={2} progress={0.5} onOpenSettings={() => {}} />);
    expect(screen.getByText('Cross-sharing responses…')).toBeInTheDocument();
  });

  test('shows completion badge when complete', () => {
    render(<Header status={DEBATE_STATUS.COMPLETE} rounds={[{}, {}]} maxRounds={2} progress={1} onOpenSettings={() => {}} />);
    expect(screen.getByText('Debate Complete — 2 rounds')).toBeInTheDocument();
  });

  test('calls onOpenSettings when gear icon is clicked', () => {
    const onSettingsMock = vi.fn();
    render(<Header status={DEBATE_STATUS.IDLE} rounds={[]} maxRounds={2} progress={0} onOpenSettings={onSettingsMock} />);
    const settingsBtn = screen.getByTitle('Settings');
    fireEvent.click(settingsBtn);
    expect(onSettingsMock).toHaveBeenCalledTimes(1);
  });

  test('handles mouse hover on settings button', () => {
    render(<Header status={DEBATE_STATUS.IDLE} rounds={[]} maxRounds={2} progress={0} onOpenSettings={() => {}} />);
    const settingsBtn = screen.getByTitle('Settings');
    fireEvent.mouseEnter(settingsBtn);
    expect(settingsBtn.style.color).toBe('var(--text-primary)');
    fireEvent.mouseLeave(settingsBtn);
    expect(settingsBtn.style.color).toBe('var(--text-muted)');
  });
});
