import React, { memo, useState, useRef, useEffect } from 'react';

const InputBar = memo(function InputBar({ onSend, disabled, onReset, isDebating, isComplete, onRequestConclusion, onPrepareDebaters, hasVerdict }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isIdle = !isDebating && !isComplete;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Prepare Debaters banner — always visible when idle ── */}
      {(isIdle || isComplete) && !isDebating && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '7px 16px', gap: 12,
          background: 'var(--accent-soft)',
          borderTop: '1px solid var(--accent-glow)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            First time? Prime both AIs for debate mode before asking your question.
          </span>
          <button
            id="prepare-debaters-btn"
            onClick={onPrepareDebaters}
            style={{
              padding: '7px 18px', borderRadius: 8,
              border: '1px solid var(--accent-glow)',
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-soft)'}
          >
            🥊 Prepare Debaters
          </button>
        </div>
      )}

      {/* ── Final Verdict banner — shown when debate is done ── */}
      {isComplete && !hasVerdict && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px 16px', gap: 12,
          background: 'var(--conclusion-soft)',
          borderTop: '1px solid var(--conclusion-glow)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Debate complete — want each AI to give a final conclusion?
          </span>
          <button
            id="get-final-verdict-input-btn"
            onClick={onRequestConclusion}
            style={{
              padding: '7px 18px', borderRadius: 8,
              border: '1px solid var(--conclusion-glow)',
              background: 'var(--conclusion-soft)',
              color: 'var(--conclusion-color)',
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
              whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--conclusion-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--conclusion-soft)'}
          >
            🏁 Get Final Verdict
          </button>
        </div>
      )}

      {isComplete && hasVerdict && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '6px 16px',
          background: 'var(--conclusion-soft)',
          borderTop: '1px solid var(--conclusion-glow)',
          fontSize: 11, color: 'var(--text-muted)',
        }}>
          ✓ Final verdict requested — scroll the right panel to see conclusions
        </div>
      )}

      {/* ── Main input bar ── */}
      <div className="input-bar">

        {/* Text input */}
        <div className="input-wrap" style={{ marginLeft: 8 }}>
          <textarea
            ref={textareaRef}
            id="debate-prompt-input"
            className="input-field"
            placeholder="Ask anything — ChatGPT and Gemini will debate the answer…"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
        </div>

        {/* Stop button — only while debating */}
        {isDebating && (
          <button
            id="stop-debate-btn"
            onClick={onReset}
            title="Stop debate"
            style={{
              width: 44, height: 44, borderRadius: 12,
              border: '1px solid rgba(244,67,54,0.4)',
              background: 'rgba(244,67,54,0.1)', color: '#f44336',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,67,54,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,67,54,0.1)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
          </button>
        )}

        {/* Send button */}
        <button
          id="send-debate-btn"
          className={`send-btn ${disabled ? 'loading' : ''}`}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          title="Send to both AIs"
        >
          {disabled ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
});

export default InputBar;
