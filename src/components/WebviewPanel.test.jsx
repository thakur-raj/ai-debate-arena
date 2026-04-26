import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import WebviewPanel from './WebviewPanel';

// jsdom doesn't support <webview>. Register as custom element before tests.
beforeAll(() => {
  if (!customElements.get('webview')) {
    try {
      customElements.define('webview', class extends HTMLElement {});
    } catch (e) {
      // Name may be rejected in some jsdom versions; ignore
    }
  }
});

describe('WebviewPanel', () => {
  const defaultProps = {
    id: 'chatgpt-panel',
    name: 'ChatGPT',
    icon: '🤖',
    colorClass: 'chatgpt-color',
    url: 'https://chatgpt.com',
    partition: 'persist:chatgpt',
  };

  const renderPanel = (props = {}) => {
    const utils = render(<WebviewPanel {...defaultProps} {...props} />);
    return { container: utils.container, ...utils };
  };

  test('renders panel name and icon', () => {
    renderPanel();
    expect(screen.getByText('ChatGPT')).toBeDefined();
  });

  test('shows loading overlay initially when enabled', () => {
    renderPanel({ enabled: true });
    expect(screen.getByText(/Loading ChatGPT/)).toBeDefined();
  });

  test('shows disabled overlay when not enabled', () => {
    renderPanel({ enabled: false });
    expect(screen.getByText(/ChatGPT is disabled/)).toBeDefined();
  });

  test('falls back after 8s timeout', () => {
    vi.useFakeTimers();
    renderPanel({ enabled: true });
    act(() => { vi.advanceTimersByTime(8000); });
    expect(screen.queryByText(/Loading ChatGPT/)).toBeNull();
    vi.useRealTimers();
  });

  test('toggle checkbox calls onToggle', () => {
    const onToggle = vi.fn();
    renderPanel({ onToggle });
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('checkbox reflects enabled state', () => {
    const { rerender } = render(<WebviewPanel {...defaultProps} enabled={true} />);
    expect(screen.getByRole('checkbox').checked).toBe(true);
    rerender(<WebviewPanel {...defaultProps} enabled={false} />);
    expect(screen.getByRole('checkbox').checked).toBe(false);
  });

  test('shows status label for idle status', () => {
    renderPanel({ aiStatus: 'idle' });
    expect(screen.getByText('Ready')).toBeDefined();
  });

  test('shows Responded for done status', () => {
    renderPanel({ aiStatus: 'done' });
    expect(screen.getByText('Responded')).toBeDefined();
  });

  test('shows Error for error status', () => {
    renderPanel({ aiStatus: 'error' });
    expect(screen.getByText('Error')).toBeDefined();
  });

  test('shows thinking dots for thinking status', () => {
    const { container } = renderPanel({ aiStatus: 'thinking' });
    const dots = container.querySelector('.thinking-dots');
    expect(dots).not.toBeNull();
  });

  test('applies correct color class to header', () => {
    const { container } = renderPanel({ colorClass: 'gemini-color' });
    const header = container.querySelector('.panel-header');
    expect(header.classList.contains('gemini-color')).toBe(true);
  });
});
