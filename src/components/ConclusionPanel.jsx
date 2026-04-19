import React, { useState } from 'react';
import { DEBATE_STATUS } from '../hooks/useDebateOrchestrator';

function RoundCard({ round, enabledAIs }) {
  return (
    <div className="round-card">
      <div className="round-card-header">
        <span>⚡</span>
        {round.label}
      </div>
      {enabledAIs?.chatgpt && (
        <div className="round-entry">
          <div className="round-entry-label chatgpt">🤖 ChatGPT</div>
          <div className="round-entry-text">{round.chatgpt}</div>
        </div>
      )}
      {enabledAIs?.chatgpt && (enabledAIs?.gemini || enabledAIs?.deepseek || enabledAIs?.perplexity) && <div className="glow-divider" />}
      {enabledAIs?.gemini && (
        <div className="round-entry">
          <div className="round-entry-label gemini">✨ Gemini</div>
          <div className="round-entry-text">{round.gemini}</div>
        </div>
      )}
      {enabledAIs?.gemini && (enabledAIs?.deepseek || enabledAIs?.perplexity) && <div className="glow-divider" />}
      {enabledAIs?.deepseek && (
        <div className="round-entry">
          <div className="round-entry-label deepseek" style={{ color: 'var(--deepseek-color)' }}>🐳 DeepSeek</div>
          <div className="round-entry-text">{round.deepseek}</div>
        </div>
      )}
      {enabledAIs?.deepseek && enabledAIs?.perplexity && <div className="glow-divider" />}
      {enabledAIs?.perplexity && (
        <div className="round-entry">
          <div className="round-entry-label perplexity" style={{ color: 'var(--perplexity-color)' }}>🔍 Perplexity</div>
          <div className="round-entry-text">{round.perplexity}</div>
        </div>
      )}
    </div>
  );
}


function VotePanel({ onVote, winner, enabledAIs }) {
  if (winner) {
    const isGPT = winner === 'chatgpt';
    const isGemini = winner === 'gemini';
    const isDeepSeek = winner === 'deepseek';
    const isPerplexity = winner === 'perplexity';

    let color = 'rgba(74,144,217,0.4)';
    let bg = 'rgba(74,144,217,0.12)';
    let text = 'Google Gemini';
    let icon = '✨';
    let varColor = 'var(--gemini-color)';

    if (isGPT) {
      color = 'rgba(16,163,127,0.4)';
      bg = 'rgba(16,163,127,0.12)';
      text = 'ChatGPT';
      icon = '🤖';
      varColor = 'var(--chatgpt-color)';
    } else if (isDeepSeek) {
      color = 'rgba(77,107,254,0.4)';
      bg = 'rgba(77,107,254,0.12)';
      text = 'DeepSeek';
      icon = '🐳';
      varColor = 'var(--deepseek-color)';
    } else if (isPerplexity) {
      color = 'rgba(138,43,226,0.4)';
      bg = 'rgba(138,43,226,0.12)';
      text = 'Perplexity AI';
      icon = '🔍';
      varColor = 'var(--perplexity-color)';
    }

    return (
      <div style={{
        padding: '12px 14px',
        borderRadius: 10,
        background: bg,
        border: `1px solid ${color}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: varColor }}>
            🏆 {text} wins!
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Your verdict — start a new debate below
          </div>
        </div>
        <button
          onClick={() => onVote(null)}
          style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Who made the better argument?
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {enabledAIs?.chatgpt && (
          <button
            id="vote-chatgpt-btn"
            onClick={() => onVote('chatgpt')}
            style={{
              flex: 1, padding: '10px 6px', borderRadius: 10,
              border: '1px solid rgba(16,163,127,0.4)',
              background: 'rgba(16,163,127,0.1)',
              color: 'var(--chatgpt-color)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,163,127,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,163,127,0.1)'}
          >
            🤖 GPT
          </button>
        )}
        {enabledAIs?.gemini && (
          <button
            id="vote-gemini-btn"
            onClick={() => onVote('gemini')}
            style={{
              flex: 1, padding: '10px 6px', borderRadius: 10,
              border: '1px solid rgba(74,144,217,0.4)',
              background: 'rgba(74,144,217,0.1)',
              color: 'var(--gemini-color)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,144,217,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(74,144,217,0.1)'}
          >
            ✨ Gemini
          </button>
        )}
        {enabledAIs?.deepseek && (
          <button
            id="vote-deepseek-btn"
            onClick={() => onVote('deepseek')}
            style={{
              flex: 1, padding: '10px 6px', borderRadius: 10,
              border: '1px solid rgba(77,107,254,0.4)',
              background: 'rgba(77,107,254,0.1)',
              color: 'var(--deepseek-color)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(77,107,254,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(77,107,254,0.1)'}
          >
            🐳 DeepSeek
          </button>
        )}
        {enabledAIs?.perplexity && (
          <button
            id="vote-perplexity-btn"
            onClick={() => onVote('perplexity')}
            style={{
              flex: 1, padding: '10px 6px', borderRadius: 10,
              border: '1px solid rgba(138,43,226,0.4)',
              background: 'rgba(138,43,226,0.1)',
              color: 'var(--perplexity-color)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(138,43,226,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(138,43,226,0.1)'}
          >
            🔍 Perplexity
          </button>
        )}
      </div>
    </div>
  );
}

function FinalConclusionCard({ rounds, onVote, winner, onRequestConclusion, hasVerdict, enabledAIs }) {
  return (
    <div className="conclusion-final-card" style={{ flexShrink: 0 }}>
      <div className="conclusion-final-title">🏆 Debate Complete — {rounds.length} Round{rounds.length !== 1 ? 's' : ''}</div>
      <div className="conclusion-final-text">
        The AIs have exchanged their arguments. Scroll down to read the full transcript.
      </div>

      {/* Get Final Verdict button */}
      {!hasVerdict && (
        <button
          id="get-final-verdict-btn"
          onClick={onRequestConclusion}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 10,
            border: '1px solid rgba(199,125,255,0.5)',
            background: 'rgba(199,125,255,0.12)',
            color: 'var(--conclusion-color)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            transition: 'all 0.2s', letterSpacing: '0.2px',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(199,125,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(199,125,255,0.12)'}
        >
          🏁 Request Final Verdict from Participants
        </button>
      )}
      {hasVerdict && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          ✓ Final verdict requested — scroll down to see their conclusions
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(199,125,255,0.2)', paddingTop: 12, marginTop: 4 }}>
        <VotePanel onVote={onVote} winner={winner} enabledAIs={enabledAIs} />
      </div>
    </div>
  );
}

export default function ConclusionPanel({ status, rounds, onRequestConclusion, enabledAIs }) {
  const [winner, setWinner] = useState(null);

  const isDebating = status !== DEBATE_STATUS.IDLE && status !== DEBATE_STATUS.COMPLETE;
  const isComplete = status === DEBATE_STATUS.COMPLETE;
  const isEmpty = rounds.length === 0 && !isDebating;
  const hasVerdict = rounds.some(r => r.isFinalVerdict);

  React.useEffect(() => {
    if (status === DEBATE_STATUS.SENDING_INITIAL) setWinner(null);
  }, [status]);

  return (
    <div className="panel">
      <div className="panel-header conclusion">
        <div className="panel-title-row">
          <div className="ai-icon conclusion">🏆</div>
          <span className="panel-name">Debate Transcript</span>
        </div>
        {isDebating && (
          <div className="status-pill thinking">
            <span className="status-dot" />
            <span className="thinking-dots"><span /><span /><span /></span>
          </div>
        )}
        {isComplete && (
          <div className="status-pill done">
            <span className="status-dot" />
            Done
          </div>
        )}
      </div>

      <div className="conclusion-panel">
        {isEmpty && (
          <div className="conclusion-empty">
            <div className="conclusion-empty-icon">⚔️</div>
            <p className="conclusion-empty-text">
              Type a question below and hit <strong>Send</strong>.<br />
              ChatGPT, Gemini, DeepSeek, and Perplexity will debate the answer here.
            </p>
          </div>
        )}

        {isComplete && (
          <FinalConclusionCard
            rounds={rounds}
            onVote={setWinner}
            winner={winner}
            onRequestConclusion={onRequestConclusion}
            hasVerdict={hasVerdict}
            enabledAIs={enabledAIs}
          />
        )}


        {rounds.length > 0 && (
          <>
            <div className="debate-vs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '4px' }}>
              {enabledAIs?.chatgpt && <span style={{ color: 'var(--chatgpt-color)' }}>ChatGPT</span>}
              {enabledAIs?.chatgpt && (enabledAIs?.gemini || enabledAIs?.deepseek || enabledAIs?.perplexity) && <span>&nbsp;⚔️&nbsp;</span>}
              {enabledAIs?.gemini && <span style={{ color: 'var(--gemini-color)' }}>Gemini</span>}
              {enabledAIs?.gemini && (enabledAIs?.deepseek || enabledAIs?.perplexity) && <span>&nbsp;⚔️&nbsp;</span>}
              {enabledAIs?.deepseek && <span style={{ color: 'var(--deepseek-color)' }}>DeepSeek</span>}
              {enabledAIs?.deepseek && enabledAIs?.perplexity && <span>&nbsp;⚔️&nbsp;</span>}
              {enabledAIs?.perplexity && <span style={{ color: 'var(--perplexity-color)' }}>Perplexity</span>}
              <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 4 }}>— click a round to expand</span>
            </div>

            {rounds.map((r) => (
              <RoundCard key={r.round} round={r} enabledAIs={enabledAIs} />
            ))}
          </>
        )}

        {isDebating && (
          <div className="round-card" style={{ borderColor: 'rgba(255,193,7,0.2)' }}>
            <div className="round-card-header" style={{ color: '#ffc107' }}>
              <span>⏳</span> Debating…
            </div>
            <div className="round-entry">
              <div className="round-entry-text" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                <span className="thinking-dots" style={{ color: 'var(--text-muted)' }}>
                  <span /><span /><span />
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
