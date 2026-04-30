import React, { memo, useState, useEffect } from 'react';

const SettingsModal = memo(function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-glow)',
        borderRadius: 16,
        padding: '24px',
        width: 440,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        animation: 'fadeSlideIn 0.2s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚙️ Settings
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 20, padding: 4
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Rounds */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              Number of Rounds
            </label>
            <input
              type="number"
              min={1} max={10}
              value={localSettings.rounds}
              onChange={e => handleChange('rounds', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none'
              }}
            />
          </div>

          {/* Delay */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              Delay between messages (seconds)
            </label>
            <input
              type="number"
              min={0} max={15} step={0.5}
              value={localSettings.delay}
              onChange={e => handleChange('delay', Math.max(0, Math.min(15, parseFloat(e.target.value) || 0)))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none'
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Helps prevent AI platforms from treating automated input as spam.
            </div>
          </div>

          {/* Detail Mode */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              Response Detail (Debater Prep)
            </label>
            <select
              value={localSettings.detailMode}
              onChange={e => handleChange('detailMode', parseInt(e.target.value))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                appearance: 'none'
              }}
            >
              <option value={1}>Short & Brief (Concise answers)</option>
              <option value={0}>Normal (Let AI decide length)</option>
              <option value={-1}>Detailed (Long, explained answers)</option>
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
               This dictates how the AIs are primed when you click &ldquo;Prepare Debaters&rdquo;.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
            Theme
          </label>
          <select
            value={localSettings.theme || 'dark'}
            onChange={e => handleChange('theme', e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              appearance: 'none'
            }}
          >
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Font Size */}
        <div style={{ marginTop: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
            Font Size: {localSettings.fontSize || 14}px
          </label>
          <input
            type="range"
            min={10} max={22} step={1}
            value={localSettings.fontSize || 14}
            onChange={e => handleChange('fontSize', parseInt(e.target.value))}
            style={{
              width: '100%', cursor: 'pointer',
              accentColor: 'var(--accent)'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            <span>10px</span>
            <span>22px</span>
          </div>
        </div>

        {/* Layout */}
        <div style={{ marginTop: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
            Panel Layout
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleChange('layout', 'side-by-side')}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                border: localSettings.layout === 'side-by-side' ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: localSettings.layout === 'side-by-side' ? 'var(--accent-soft)' : 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: 13, fontWeight: 600
              }}
            >
              ⊞ Side-by-Side
            </button>
            <button
              onClick={() => handleChange('layout', 'stacked')}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                border: localSettings.layout === 'stacked' ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: localSettings.layout === 'stacked' ? 'var(--accent-soft)' : 'var(--bg-surface)',
                color: 'var(--text-primary)', fontSize: 13, fontWeight: 600
              }}
            >
              ⊟ Stacked
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 8, background: 'transparent',
            color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600
          }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{
            padding: '8px 24px', borderRadius: 8, background: 'var(--border-glow)',
            color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600
          }}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
});

export default SettingsModal;
