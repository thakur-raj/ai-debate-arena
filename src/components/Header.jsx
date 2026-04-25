import React, { memo } from 'react';
import { DEBATE_STATUS } from '../hooks/useDebateOrchestrator';

const Header = memo(function Header({ status, rounds, progress, onOpenSettings }) {
  const isDebating = status !== DEBATE_STATUS.IDLE && status !== DEBATE_STATUS.COMPLETE;
  const isComplete = status === DEBATE_STATUS.COMPLETE;

  const statusLabel = {
    [DEBATE_STATUS.IDLE]: 'Ready',
    [DEBATE_STATUS.SENDING_INITIAL]: 'Sending prompt…',
    [DEBATE_STATUS.WAITING_INITIAL]: 'Waiting for initial responses…',
    [DEBATE_STATUS.CROSS_SHARING]: 'Cross-sharing responses…',
    [DEBATE_STATUS.WAITING_ROUND]: `Debating — Round ${rounds.length}…`,
    [DEBATE_STATUS.COMPLETE]: '✓ Debate complete',
  }[status] || 'Ready';

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo"><img src="/icon.png" alt="" style={{ width: 24, height: 24 }} /></div>
        <span className="header-title">AI Debate Arena</span>
        {isDebating && (
          <span className="round-badge">
            <span className="dot active" />
            {statusLabel}
          </span>
        )}
        {isComplete && (
          <span className="round-badge" style={{ borderColor: 'rgba(199,125,255,0.4)', color: 'var(--conclusion-color)' }}>
            <span className="dot" style={{ background: 'var(--conclusion-color)' }} />
            Debate Complete — {rounds.length} round{rounds.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="header-right">
        {isDebating && (
          <div style={{ width: 120 }}>
            <div className="debate-progress">
              <div className="debate-progress-fill" style={{ width: `${Math.min(progress * 100, 95)}%` }} />
            </div>
          </div>
        )}
        <div className="round-badge">
          <span style={{ color: 'var(--chatgpt-color)' }}>GPT</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>vs</span>
          <span style={{ color: 'var(--gemini-color)' }}>Gemini</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>vs</span>
          <span style={{ color: 'var(--deepseek-color, #4d90fe)' }}>DeepSeek</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>vs</span>
          <span style={{ color: 'var(--perplexity-color)' }}>Perplexity</span>
        </div>
        <button
          onClick={onOpenSettings}
          title="Settings"
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 18, marginLeft: 8, padding: 4,
            transition: 'color 0.2s', display: 'flex', alignItems: 'center'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
});

export default Header;
