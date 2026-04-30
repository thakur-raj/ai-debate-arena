import React, { useRef, useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import WebviewPanel from './components/WebviewPanel.jsx';
import ConclusionPanel from './components/ConclusionPanel.jsx';
import InputBar from './components/InputBar.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { useDebateOrchestrator, DEBATE_STATUS } from './hooks/useDebateOrchestrator.js';

export default function App() {
  const chatgptRef = useRef(null);
  const geminiRef = useRef(null);
  const deepseekRef = useRef(null);
  const perplexityRef = useRef(null);

  const platform = window.electronAPI?.platform || 'darwin';
  const platformClass = platform === 'win32' ? 'platform-win' : platform === 'linux' ? 'platform-linux' : '';

  const DEFAULT_SETTINGS = {
    rounds: 2,
    delay: 2,
    detailMode: 1,
    theme: 'light',
    fontSize: 14,
    layout: 'side-by-side'
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ai_debate_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    const theme = settings.theme;
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
      const handler = (e) => document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', `${settings.fontSize}px`);
  }, [settings.fontSize]);
  const [showSettings, setShowSettings] = useState(false);
  const [enabledAIs, setEnabledAIs] = useState({ chatgpt: true, gemini: true, deepseek: true, perplexity: true });
  const [activeTab, setActiveTab] = useState('debate'); // 'debate' or 'results'

  const toggleAI = (aiKey) => {
    setEnabledAIs(prev => ({ ...prev, [aiKey]: !prev[aiKey] }));
  };

  const { status, rounds, aiStatuses, isDebating, progress, startDebate, reset, requestConclusion, prepareDebaters } =
    useDebateOrchestrator(chatgptRef, geminiRef, deepseekRef, perplexityRef, enabledAIs);

  const handleSend = (prompt) => {
    if (status === DEBATE_STATUS.COMPLETE) reset();
    startDebate(prompt, settings);
  };

  return (
    <div className={`app-shell ${platformClass}`}>
      <Header
        status={status}
        rounds={rounds}
        maxRounds={settings.rounds}
        progress={progress}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'debate' ? 'active' : ''}`}
          onClick={() => setActiveTab('debate')}
        >
          <span className="tab-icon">⚔️</span>
          Debate View
        </button>
        <button
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          <span className="tab-icon">🏆</span>
          Results View
        </button>
      </div>

      <div className="panels-area">
        {/* Debate View - Always mounted but hidden when not active */}
        <div className={`debate-view ${activeTab === 'debate' ? 'active' : 'hidden'} ${settings.layout === 'stacked' ? 'stacked' : ''}`}>
          <WebviewPanel
            ref={chatgptRef}
            id="chatgpt-webview"
            name="ChatGPT"
            icon="🤖"
            colorClass="chatgpt"
            url="https://chatgpt.com"
            partition="persist:chatgpt"
            aiStatus={aiStatuses.chatgpt}
            enabled={enabledAIs.chatgpt}
            onToggle={() => toggleAI('chatgpt')}
          />

          <WebviewPanel
            ref={geminiRef}
            id="gemini-webview"
            name="Google Gemini"
            icon="✨"
            colorClass="gemini"
            url="https://gemini.google.com/app"
            partition="persist:gemini"
            aiStatus={aiStatuses.gemini}
            enabled={enabledAIs.gemini}
            onToggle={() => toggleAI('gemini')}
          />

          <WebviewPanel
            ref={deepseekRef}
            id="deepseek-webview"
            name="DeepSeek"
            icon="🐳"
            colorClass="deepseek"
            url="https://chat.deepseek.com/"
            partition="persist:deepseek"
            aiStatus={aiStatuses.deepseek}
            enabled={enabledAIs.deepseek}
            onToggle={() => toggleAI('deepseek')}
          />

          <WebviewPanel
            ref={perplexityRef}
            id="perplexity-webview"
            name="Perplexity AI"
            icon="🔍"
            colorClass="perplexity"
            url="https://www.perplexity.ai"
            partition="persist:perplexity"
            aiStatus={aiStatuses.perplexity}
            enabled={enabledAIs.perplexity}
            onToggle={() => toggleAI('perplexity')}
          />
        </div>

        {/* Results View - Always mounted but hidden when not active */}
        <div className={`results-view ${activeTab === 'results' ? 'active' : 'hidden'}`}>
          <ConclusionPanel
            status={status}
            rounds={rounds}
            onRequestConclusion={requestConclusion}
            enabledAIs={enabledAIs}
          />
        </div>
      </div>

      <InputBar
        onSend={handleSend}
        disabled={isDebating}
        onReset={reset}
        isDebating={isDebating}
        isComplete={status === DEBATE_STATUS.COMPLETE}
        onRequestConclusion={requestConclusion}
        onPrepareDebaters={() => prepareDebaters(settings)}
        hasVerdict={rounds.some(r => r.isFinalVerdict)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          localStorage.setItem('ai_debate_settings', JSON.stringify(newSettings));
          setShowSettings(false);
        }}
      />
    </div>
  );
}
