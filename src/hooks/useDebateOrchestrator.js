import { useCallback, useRef, useState } from 'react';
import { chatgptSend, chatgptGetResponse, chatgptGetCount } from '../utils/chatgptInjector';
import { geminiClickInput, geminiClickSend, geminiGetResponse, geminiGetCount } from '../utils/geminiInjector';

export const DEBATE_STATUS = {
  IDLE: 'idle',
  SENDING_INITIAL: 'sending_initial',
  WAITING_INITIAL: 'waiting_initial',
  CROSS_SHARING: 'cross_sharing',
  WAITING_ROUND: 'waiting_round',
  COMPLETE: 'complete',
};

const POLL_INTERVAL_MS = 2000;
const STABILITY_CHECKS = 2; // response must be stable for N polls before accepted

export function useDebateOrchestrator(chatgptRef, geminiRef) {
  const [status, setStatus] = useState(DEBATE_STATUS.IDLE);
  const [rounds, setRounds] = useState([]);
  const [aiStatuses, setAiStatuses] = useState({ chatgpt: 'idle', gemini: 'idle' });
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const pollerRef = useRef(null);
  const stabilityRef = useRef({ chatgpt: { text: null, count: 0 }, gemini: { text: null, count: 0 } });
  const currentRoundRef = useRef(0);
  const maxRoundsRef = useRef(2);
  const delayRef = useRef(2);
  const promptRef = useRef('');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const stopPolling = () => {
    if (pollerRef.current) { clearInterval(pollerRef.current); pollerRef.current = null; }
  };

  const exec = async (ref, code) => {
    try {
      return await ref.current.executeJavaScript(code);
    } catch (e) {
      console.error('executeJavaScript error:', e);
      return null;
    }
  };

  const getBaseCounts = async () => {
    const chatgpt = await exec(chatgptRef, chatgptGetCount());
    const gemini = await exec(geminiRef, geminiGetCount());
    return { chatgpt: chatgpt || 0, gemini: gemini || 0 };
  };

  /**
   * Send a message to Gemini using Electron's native webview.insertText().
   * This works at the OS input level, bypassing Quill/Angular JS issues.
   * Sequence: (1) focus+select-all via JS, (2) native insertText, (3) click send via JS.
   */
  const sendToGemini = async (message) => {
    // Step 1: Focus the input and select all existing content
    await exec(geminiRef, geminiClickInput());
    await new Promise(r => setTimeout(r, 400));

    // Step 2: Insert text via Electron's native API (replaces the selection)
    try {
      await geminiRef.current.insertText(message);
    } catch (e) {
      console.error('insertText failed:', e);
    }
    await new Promise(r => setTimeout(r, 600));

    // Step 3: Click the send button
    await exec(geminiRef, geminiClickSend());
  };

  const setAiStatus = (ai, s) =>
    setAiStatuses(prev => ({ ...prev, [ai]: s }));

  /** Poll both webviews until both have a NEW response, then call onBothDone */
  const pollForResponses = useCallback((minCounts, onBothDone) => {
    stabilityRef.current = {
      chatgpt: { text: null, count: 0, minCount: minCounts.chatgpt || 0 },
      gemini:  { text: null, count: 0, minCount: minCounts.gemini  || 0 },
    };

    pollerRef.current = setInterval(async () => {
      const st = stabilityRef.current;
      const pending = { chatgpt: !st.chatgpt.done, gemini: !st.gemini.done };

      // Poll ChatGPT
      if (pending.chatgpt) {
        const res = await exec(chatgptRef, chatgptGetResponse(st.chatgpt.minCount));
        if (res?.done && res.text) {
          if (res.text === st.chatgpt.text) {
            st.chatgpt.count++;
          } else {
            st.chatgpt.text = res.text;
            st.chatgpt.count = 1;
          }
          if (st.chatgpt.count >= STABILITY_CHECKS) {
            st.chatgpt.done = true;
            setAiStatus('chatgpt', 'done');
          }
        }
      }

      // Poll Gemini
      if (pending.gemini) {
        const res = await exec(geminiRef, geminiGetResponse(st.gemini.minCount));
        if (res?.done && res.text) {
          if (res.text === st.gemini.text) {
            st.gemini.count++;
          } else {
            st.gemini.text = res.text;
            st.gemini.count = 1;
          }
          if (st.gemini.count >= STABILITY_CHECKS) {
            st.gemini.done = true;
            setAiStatus('gemini', 'done');
          }
        }
      }

      // Both done?
      if (st.chatgpt.done && st.gemini.done) {
        setDebugInfo({
          chatgpt: `min: ${st.chatgpt.minCount} | done: ${st.chatgpt.done} | count: ${st.chatgpt.count} | len: ${st.chatgpt.text?.length || 0}`,
          gemini: `min: ${st.gemini.minCount} | done: ${st.gemini.done} | count: ${st.gemini.count} | len: ${st.gemini.text?.length || 0}`,
          active: false
        });
        stopPolling();
        onBothDone({ chatgpt: st.chatgpt.text, gemini: st.gemini.text });
      } else {
        setDebugInfo({
          chatgpt: `min: ${st.chatgpt.minCount} | done: ${st.chatgpt.done} | count: ${st.chatgpt.count} | len: ${st.chatgpt.text?.length || 0}`,
          gemini: `min: ${st.gemini.minCount} | done: ${st.gemini.done} | count: ${st.gemini.count} | len: ${st.gemini.text?.length || 0}`,
          active: true
        });
      }
    }, POLL_INTERVAL_MS);
  }, [chatgptRef, geminiRef]);

  const buildCrossPromptForGemini = (originalPrompt, chatgptResponse, round) =>
    round === 0
      ? `Regarding: "${originalPrompt}"\n\nChatGPT responded:\n"${chatgptResponse}"\n\nDo you agree or disagree? Challenge any incorrect points, build on what's right, and give your best answer.`
      : `ChatGPT just responded:\n"${chatgptResponse}"\n\nDo you maintain your position or do you want to revise it? Be direct and concise.`;

  const buildCrossPromptForChatGPT = (originalPrompt, geminiResponse, round) =>
    round === 0
      ? `Regarding: "${originalPrompt}"\n\nGoogle Gemini responded:\n"${geminiResponse}"\n\nDo you agree or disagree? Challenge any incorrect points, build on what's right, and give your best answer.`
      : `Google Gemini just responded:\n"${geminiResponse}"\n\nDo you maintain your position or do you want to revise it? Be direct and concise.`;

  /** Kick off a debate */
  const startDebate = useCallback(async (prompt, settings) => {
    if (status !== DEBATE_STATUS.IDLE) return;
    stopPolling();
    setRounds([]);
    setError(null);
    promptRef.current = prompt;
    maxRoundsRef.current = settings?.rounds || 2;
    delayRef.current = settings?.delay || 0;
    currentRoundRef.current = 0;

    // ── Round 0: Send initial prompt to both ──
    setStatus(DEBATE_STATUS.SENDING_INITIAL);
    setAiStatuses({ chatgpt: 'thinking', gemini: 'thinking' });

    // Capture baseline message count before sending anything
    const baseCounts = await getBaseCounts();

    if (delayRef.current > 0) await sleep(delayRef.current * 1000);
    await exec(chatgptRef, chatgptSend(prompt));

    if (delayRef.current > 0) await sleep(delayRef.current * 1000);
    await sendToGemini(prompt);

    setStatus(DEBATE_STATUS.WAITING_INITIAL);

    pollForResponses(baseCounts, async (responses) => {
      const round0 = { round: 0, label: 'Initial Response', ...responses };
      setRounds([round0]);
      currentRoundRef.current = 1;
      await runCrossShareRound(round0, 1, maxRoundsRef.current);
    });
  }, [status, chatgptRef, geminiRef, pollForResponses]);

  const runCrossShareRound = async (prevRound, roundNum, maxRounds) => {
    if (roundNum > maxRounds) {
      setStatus(DEBATE_STATUS.COMPLETE);
      setAiStatuses({ chatgpt: 'done', gemini: 'done' });
      return;
    }

    setStatus(DEBATE_STATUS.CROSS_SHARING);
    setAiStatuses({ chatgpt: 'thinking', gemini: 'thinking' });

    const chatgptCrossPrompt = buildCrossPromptForChatGPT(
      promptRef.current, prevRound.gemini, roundNum - 1
    );
    const geminiCrossPrompt = buildCrossPromptForGemini(
      promptRef.current, prevRound.chatgpt, roundNum - 1
    );

    // Capture baseline message count before sending cross prompts
    const baseCounts = await getBaseCounts();

    if (delayRef.current > 0) await sleep(delayRef.current * 1000);
    await exec(chatgptRef, chatgptSend(chatgptCrossPrompt));

    if (delayRef.current > 0) await sleep(delayRef.current * 1000);
    await sendToGemini(geminiCrossPrompt);

    setStatus(DEBATE_STATUS.WAITING_ROUND);

    pollForResponses(baseCounts, async (responses) => {
      const newRound = { round: roundNum, label: `Round ${roundNum}`, ...responses };
      setRounds(prev => [...prev, newRound]);
      currentRoundRef.current = roundNum + 1;
      await runCrossShareRound(newRound, roundNum + 1, maxRounds);
    });
  };

  const reset = useCallback(() => {
    stopPolling();
    setStatus(DEBATE_STATUS.IDLE);
    setRounds([]);
    setAiStatuses({ chatgpt: 'idle', gemini: 'idle' });
    setError(null);
  }, []);

  /**
   * Send a final "conclude your debate" prompt to both AIs after rounds finish.
   * Adds a special 'Final Verdict' round to the transcript.
   */
  const requestConclusion = useCallback(async () => {
    if (status !== DEBATE_STATUS.COMPLETE) return;

    const totalRounds = currentRoundRef.current;
    const concludePrompt =
      `Our debate on "${promptRef.current}" has now concluded after ${totalRounds} round(s) of exchange. ` +
      `Please provide your comprehensive FINAL VERDICT:\n\n` +
      `1. **Summary**: Briefly recap the strongest arguments made by BOTH sides during this debate.\n` +
      `2. **Your definitive position**: State clearly and confidently what the correct or best answer is, and why.\n` +
      `3. **Concessions**: Acknowledge any valid points raised by the opposing AI that you agree with.\n` +
      `4. **Verdict**: Give a single, decisive concluding statement — the ultimate takeaway a reader should walk away with.\n\n` +
      `Be thorough, fair, and conclusive. This is your final word on the matter.`;

    setStatus(DEBATE_STATUS.WAITING_ROUND);
    setAiStatuses({ chatgpt: 'thinking', gemini: 'thinking' });

    // Capture baseline message count before concluding
    const baseCounts = await getBaseCounts();

    if (delayRef.current > 0) await sleep(delayRef.current * 1000);
    await exec(chatgptRef, chatgptSend(concludePrompt));

    if (delayRef.current > 0) await sleep(delayRef.current * 1000);
    await sendToGemini(concludePrompt);

    pollForResponses(baseCounts, async (responses) => {
      setRounds(prev => [
        ...prev,
        { round: 999, label: '🏁 Final Verdict', isFinalVerdict: true, ...responses },
      ]);
      setStatus(DEBATE_STATUS.COMPLETE);
      setAiStatuses({ chatgpt: 'done', gemini: 'done' });
    });
  }, [status, chatgptRef, geminiRef, pollForResponses, sendToGemini]);

  const isDebating = status !== DEBATE_STATUS.IDLE && status !== DEBATE_STATUS.COMPLETE;
  const progress = rounds.length / ((maxRoundsRef.current || 2) + 1);

  /**
   * Prime both AIs for short, punchy debate-mode responses before the first question.
   * Just fires the prompt at both — no round tracking, user sees acknowledgements in the panels.
   */
  const prepareDebaters = useCallback(async (settings) => {
    let modeRules = '';
    if (settings?.detailMode === 1) {
      modeRules = `• BREVITY IS MANDATORY: Every response must be 3–5 sentences MAX. No long explanations.\n` +
                  `• Only expand with detail if the user explicitly asks "explain further" or "go deeper".\n`;
    } else if (settings?.detailMode === -1) {
      modeRules = `• DETAIL IS EXPECTED: Provide long, thorough explanations for your points.\n` +
                  `• Break down complex ideas and back them up with comprehensive reasoning.\n`;
    } else {
      modeRules = `• Respond with a natural, normal length. Let your own judgment decide how much detail is needed.\n`;
    }

    const prep =
      `You are about to enter DEBATE MODE. Follow these rules strictly for the rest of this conversation:\n\n` +
      modeRules +
      `• State your position clearly and confidently in the first sentence.\n` +
      `• Back it up with your single strongest reason or evidence.\n` +
      `• If challenged, counter-argue directly — do not repeat yourself.\n` +
      `• Your answers will be shared with a rival AI as debate input — make every word count.\n\n` +
      `This is a structured AI vs AI debate. Be sharp, assertive, and decisive.\n` +
      `Acknowledge these rules briefly and say you are ready. Then WAIT for the first question.`;

    setAiStatuses({ chatgpt: 'thinking', gemini: 'thinking' });

    const delay = settings?.delay || 0;
    if (delay > 0) await sleep(delay * 1000);
    await exec(chatgptRef, chatgptSend(prep));

    if (delay > 0) await sleep(delay * 1000);
    await sendToGemini(prep);

    // Give them a moment to respond, then flip back to idle
    setTimeout(() => setAiStatuses({ chatgpt: 'idle', gemini: 'idle' }), 6000);
  }, [chatgptRef, geminiRef]);

  return { status, rounds, aiStatuses, error, isDebating, progress, startDebate, reset, requestConclusion, prepareDebaters, debugInfo };
}
