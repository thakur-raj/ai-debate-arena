import React, { useRef, useState } from 'react';
import Header from './components/Header.jsx';
import WebviewPanel from './components/WebviewPanel.jsx';
import ConclusionPanel from './components/ConclusionPanel.jsx';
import InputBar from './components/InputBar.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { useDebateOrchestrator, DEBATE_STATUS } from './hooks/useDebateOrchestrator.js';

export default function App() {
  const chatgptRef = useRef(null);
  const geminiRef  = useRef(null);
  const deepseekRef = useRef(null);
  
  const [settings, setSettings] = useState({
    rounds: 2,
    delay: 2, // seconds
    detailMode: 1 // 1: short, 0: normal, -1: long
  });
  const [showSettings, setShowSettings] = useState(false);

  const { status, rounds, aiStatuses, isDebating, progress, startDebate, reset, requestConclusion, prepareDebaters, debugInfo } =
    useDebateOrchestrator(chatgptRef, geminiRef, deepseekRef);

  const handleSend = (prompt) => {
    if (status === DEBATE_STATUS.COMPLETE) reset();
    startDebate(prompt, settings);
  };

  return (
    <div className="app-shell">
      <Header
        status={status}
        rounds={rounds}
        maxRounds={settings.rounds}
        progress={progress}
        onOpenSettings={() => setShowSettings(true)}
        debugInfo={debugInfo}
      />

      <div className="panels-area">
        <WebviewPanel
          ref={chatgptRef}
          id="chatgpt-webview"
          name="ChatGPT"
          icon="🤖"
          colorClass="chatgpt"
          url="https://chatgpt.com"
          partition="persist:chatgpt"
          aiStatus={aiStatuses.chatgpt}
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
        />

        <ConclusionPanel
          status={status}
          rounds={rounds}
          onRequestConclusion={requestConclusion}
        />
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
        onSettingsChange={setSettings}
      />
    </div>
  );
}
