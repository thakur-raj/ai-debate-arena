import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import SettingsModal from './SettingsModal';

describe('SettingsModal Component', () => {
  const defaultSettings = {
    rounds: 2,
    delay: 2,
    detailMode: 1,
    theme: 'dark'
  };

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <SettingsModal isOpen={false} settings={defaultSettings} onSave={() => {}} onClose={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders properly when isOpen is true', () => {
    render(<SettingsModal isOpen={true} settings={defaultSettings} onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
    expect(screen.getByText('Number of Rounds')).toBeInTheDocument();
  });

  test('calls onSave with updated settings when save button is clicked', () => {
    const onSaveMock = vi.fn();
    render(<SettingsModal isOpen={true} settings={defaultSettings} onSave={onSaveMock} onClose={() => {}} />);
    
    // Find the number inputs (spinbuttons)
    const inputs = screen.getAllByRole('spinbutton');
    // inputs[0] is rounds
    fireEvent.change(inputs[0], { target: { value: '5' } });
    
    // Find the select dropdowns (combobox)
    const selects = screen.getAllByRole('combobox');
    // selects[0] is Detail Mode, selects[1] is Theme
    fireEvent.change(selects[1], { target: { value: 'light' } });

    // Click Save
    const saveButton = screen.getByText('Save Settings');
    fireEvent.click(saveButton);
    
    expect(onSaveMock).toHaveBeenCalledWith({
      ...defaultSettings,
      rounds: 5,
      theme: 'light'
    });
  });

  test('calls onClose when cancel button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<SettingsModal isOpen={true} settings={defaultSettings} onSave={() => {}} onClose={onCloseMock} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('handles changing delay and detail mode', () => {
    render(<SettingsModal isOpen={true} settings={defaultSettings} onSave={() => {}} onClose={() => {}} />);
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[1], { target: { value: '5' } }); // delay
    expect(inputs[1].value).toBe('5');

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '-1' } }); // detail mode
    expect(selects[0].value).toBe('-1');
  });
});
