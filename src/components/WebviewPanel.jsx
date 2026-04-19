import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';

const WebviewPanel = forwardRef(function WebviewPanel(
  { id, name, icon, colorClass, url, partition, aiStatus, enabled = true, onToggle },
  forwardedRef
) {
  const [loading, setLoading] = useState(true);
  const internalRef = useRef(null);

  // Combine internal ref (for effects) with forwarded ref (for parent's executeJavaScript)
  const setRefs = useCallback((node) => {
    internalRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  }, [forwardedRef]);

  // Attach dom-ready as a native DOM event (NOT a React synthetic event)
  useEffect(() => {
    const webview = internalRef.current;
    if (!webview) return;

    const handleDomReady = () => setLoading(false);
    webview.addEventListener('dom-ready', handleDomReady);

    // Also hide overlay after 8s as a safety fallback
    const fallback = setTimeout(() => setLoading(false), 8000);

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady);
      clearTimeout(fallback);
    };
  }, []);

  const statusLabel = {
    idle:     'Ready',
    thinking: 'Thinking…',
    done:     'Responded',
    error:    'Error',
  }[aiStatus] || 'Ready';

  return (
    <div className="panel" style={{ opacity: enabled ? 1 : 0.6, transition: 'opacity 0.2s' }}>
      <div className={`panel-header ${colorClass}`}>
        <div className="panel-title-row">
          <div className={`ai-icon ${colorClass}`}>{icon}</div>
          <span className="panel-name" style={{ marginRight: 8 }}>{name}</span>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={enabled} 
              onChange={onToggle} 
              style={{ accentColor: `var(--${colorClass}-color)`, cursor: 'pointer', margin: 0 }}
            />
          </label>
        </div>
        <div className={`status-pill ${aiStatus}`}>
          <span className="status-dot" />
          {aiStatus === 'thinking' ? (
            <span className="thinking-dots">
              <span /><span /><span />
            </span>
          ) : statusLabel}
        </div>
      </div>

      <div className="webview-wrap">
        {!enabled && (
          <div className="webview-overlay" style={{ background: 'rgba(10,10,18,0.6)', backdropFilter: 'blur(4px)', pointerEvents: 'all' }}>
            <p className="overlay-text" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
              {name} is disabled
            </p>
          </div>
        )}
        {loading && enabled && (
          <div className="webview-overlay">
            <div className="overlay-spinner" />
            <p className="overlay-text">
              Loading {name}…<br />
              <span style={{ fontSize: 11, opacity: 0.7 }}>Please log in if prompted</span>
            </p>
          </div>
        )}
        <webview
          ref={setRefs}
          id={id}
          src={url}
          partition={partition}
          style={{ width: '100%', height: '100%', display: 'flex' }}
          allowpopups="true"
        />
      </div>
    </div>
  );
});

export default WebviewPanel;

