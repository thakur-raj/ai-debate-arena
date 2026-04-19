# ⚔️ AI Debate Arena

<p align="center">
  <strong>An automated, multi-round debate platform where ChatGPT, Google Gemini, and DeepSeek face off in real-time.</strong>
</p>

![AI Debate Arena](https://via.placeholder.com/800x400/0a0a12/c77dff?text=AI+Debate+Arena) <!-- Replace with an actual screenshot -->

## 🌟 Overview

**AI Debate Arena** is an Electron-based application that embeds ChatGPT, Google Gemini, and DeepSeek into isolated webviews and orchestrates an automated three-way debate between them. You simply provide a topic or question, select the number of rounds, configure your debate settings, and the application acts as the moderator—feeding each AI's response to the others as counter-arguments.

## ✨ Key Features

- **🤖 vs ✨ vs 🐳 Three-Way Multi-Round Debates:** Configure up to 10 rounds of back-and-forth debate between three of the most powerful LLMs in the world.
- **🔄 Automated Cross-Sharing:** The application's orchestrator automatically extracts arguments from one AI and feeds them as counter-prompts to the others without manual intervention.
- **🥊 Prepare Debaters Mode:** Prime all AIs for a concise, punchy debate mode before starting, ensuring high-quality, brief arguments tailored to the debate setting.
- **⚙️ Advanced Configuration:** 
  - **Custom Message Delays:** Tweak the delay between messages to account for network speed and AI response times.
  - **Response Detail Modes:** Control the verbosity and format of the AIs' responses.
- **🏁 Final Verdict & Conclusion Phase:** Once the debate rounds conclude, the platform requests a structured final verdict from all AIs summarizing their definitive positions.
- **🏆 Judge the Winner:** Review the beautifully formatted debate transcript with stabilized scrolling, and cast your vote for the AI that made the most compelling case in the interactive Conclusion Panel.
- **🔒 Secure & Persistent Sessions:** Uses robust session management with isolated Electron webview partitions (`persist:chatgpt`, `persist:gemini`, `persist:deepseek`) to safely persist your login sessions without interfering with your main browser. 

## 🛠️ Tech Stack & Architecture

- **Desktop Framework:** [Electron](https://www.electronjs.org/) (Handles webview isolation and cross-origin orchestration)
- **Frontend Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** Vanilla CSS with a custom Glassmorphism design system and modern UI tokens.
- **Orchestration Logic:** A robust custom React hook (`useDebateOrchestrator`) manages the complex state machine of the debate (priming, rounds, waiting for responses, concluding).
- **DOM Injection:** Custom JavaScript injectors (`chatgptInjector.js`, `geminiInjector.js`, `deepseekInjector.js`) are safely executed within the webviews to read AI responses and simulate user input.

### Core Architecture Components
- **`useDebateOrchestrator.js`**: The brains of the operation. Manages the debate state machine, orchestrates the turns, and handles the handoff between the three models.
- **`WebviewPanel.jsx`**: A reusable component that safely wraps Electron's `<webview>` tags, handling events like `dom-ready` and IPC messages to eliminate rendering errors.
- **`ConclusionPanel.jsx`**: The final phase UI where users can review the summarized arguments and cast their vote for the winner.
- **`SettingsModal.jsx`**: A comprehensive configuration system allowing users to fine-tune the orchestrator's timing and behavior.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- Standard accounts for ChatGPT, Google Gemini, and DeepSeek (you will need to log into them inside the app).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ai-debate-arena.git
   cd ai-debate-arena
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application (Development Mode):**
   ```bash
   npm run dev
   ```

### First Run & Login
When you open the app for the first time, the webviews for ChatGPT, Gemini, and DeepSeek will prompt you to log in. 
1. Log into ChatGPT on its respective panel.
2. Log into Google Gemini on its respective panel.
3. Log into DeepSeek on its respective panel.
4. Once logged in, your sessions are saved automatically across restarts!

## 💡 How to Use

1. **Configure Settings:** Click the settings icon to open the Settings modal. Here you can tweak message delays and response detail modes to your liking.
2. **Prime the AIs:** Click the **🥊 Prepare Debaters** button at the bottom before your first debate to instruct the AIs to keep their answers short and punchy.
3. **Set Rounds:** Choose the number of debate rounds (1-10) in the input bar.
4. **Start the Debate:** Type your question or topic and hit **Send**.
5. **Watch it Unfold:** The app will handle the rest, capturing responses and passing them back and forth. The transcript will automatically scroll to keep you up to date.
6. **Get Final Verdict:** After the rounds are done, the conclusion phase can be triggered to show their final concluding statements.
7. **Vote:** Cast your vote for the winner in the final Conclusion Panel!

## 🔧 Troubleshooting & Clearing Cache

Because this application relies on reading the DOM of third-party web apps (ChatGPT, Gemini, DeepSeek), it is sensitive to UI changes on those platforms. 

### Quick Restart & Cleanup
If you see a blank screen or the app is hanging, run this cleanup command in your terminal to kill stale processes and restart:

**Mac/Linux:**
```bash
pkill -f "electron ." 2>/dev/null; pkill -f "vite" 2>/dev/null; lsof -ti:5173,5174,5175 | xargs kill -9 2>/dev/null; sleep 1 && npm run dev
```

### Full Cache Clear
If you need to completely reset the Vite cache or Electron state:
```bash
rm -rf node_modules/.vite
npm run dev
```

*Note: The app spoofs a standard Chrome User-Agent at the Electron session level to prevent AI platforms from blocking the webviews.*

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 

**Important note for contributors:** Since this project relies on DOM selectors (`document.querySelector`) to interact with external platforms, it *will* break if ChatGPT, Gemini, or DeepSeek update their UI. PRs to update broken selectors in `src/utils/*Injector.js` files are highly appreciated and are the most common maintenance tasks for this project.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Disclaimer & Terms of Use

**This is an independent, open-source educational project.** 

- **No Affiliation:** This project is not affiliated with, endorsed by, or sponsored by OpenAI, Google, or DeepSeek. 
- **Trademarks:** "ChatGPT", "Google Gemini", and "DeepSeek" are trademarks of their respective owners.
- **Terms of Service:** This application automates web browser interactions (DOM scraping and UI automation). Using this software may violate the Terms of Service of OpenAI, Google, or DeepSeek. By using or modifying this codebase, you assume all risks associated with your accounts, including but not limited to account suspension, banning, or rate-limiting.
- **Liability:** The author(s) of this project assume **zero liability** for any damages, account bans, or legal repercussions resulting from the use of this software. The code is provided strictly for educational purposes to demonstrate Electron webview capabilities and React state machines.

## 📝 License

This project is distributed under the **MIT License**. You are free to use, modify, and distribute this software, subject to the conditions of the license. 

See the [`LICENSE`](LICENSE) file for more information.
