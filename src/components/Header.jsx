import React from 'react';
import { DEBATE_STATUS } from '../hooks/useDebateOrchestrator';

export default function Header({ status, rounds, maxRounds, progress, onOpenSettings, debugInfo }) {
  const isDebating = status !== DEBATE_STATUS.IDLE && status !== DEBATE_STATUS.COMPLETE;
  const isComplete = status === DEBATE_STATUS.COMPLETE;

  const statusLabel = {
    [DEBATE_STATUS.IDLE]:            'Ready',
    [DEBATE_STATUS.SENDING_INITIAL]: 'Sending prompt…',
    [DEBATE_STATUS.WAITING_INITIAL]: 'Waiting for initial responses…',
    [DEBATE_STATUS.CROSS_SHARING]:   'Cross-sharing responses…',
    [DEBATE_STATUS.WAITING_ROUND]:   `Debating — Round ${rounds.length}…`,
    [DEBATE_STATUS.COMPLETE]:        '✓ Debate complete',
  }[status] || 'Ready';

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">⚔️</div>
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
        {debugInfo && (
          <div style={{ fontSize: '9px', color: '#ff6b6b', fontFamily: 'monospace', textAlign: 'right', marginRight: '10px', display: 'flex', flexDirection: 'column', gap: '1px', maxWidth: '260px' }}>
            <span style={{ fontWeight: 'bold', color: debugInfo.active ? '#ff9900' : '#44ff44' }}>
              {debugInfo.active ? '⏳ POLLING' : '✅ DONE'}
            </span>
            <span style={{ color: '#aaa' }}>GPT: {debugInfo.chatgpt}</span>
            <span style={{ color: '#aaa' }}>Gem: {debugInfo.gemini}</span>
            <span style={{ color: debugInfo.active && debugInfo.deepseek?.includes('why:') ? '#ff6b6b' : '#aaa' }}>
              DSK: {debugInfo.deepseek || 'waiting...'}
            </span>
          </div>
        )}
        {isDebating && (
          <div style={{ width: 120 }}>
            <div className="debate-progress">
              <div className="debate-progress-fill" style={{ width: `${Math.min(progress * 100, 95)}%` }} />
            </div>
          </div>
        )}
        <div className="round-badge">
          <span style={{ color: 'var(--chatgpt-color)' }}>GPT</span>
          <span style={{ color: 'var(--text-muted)' }}>vs</span>
          <span style={{ color: 'var(--gemini-color)' }}>Gemini</span>
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
}
