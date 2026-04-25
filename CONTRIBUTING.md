# Contributing

Thanks for your interest in AI Debate Arena!

## Getting Started

1. Fork the repo at `https://github.com/thakur-raj/ai-debate-arena`
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ai-debate-arena.git`
3. Install dependencies: `npm install`
4. Run in dev mode: `npm run dev`

## Development Workflow

- **Branch naming**: `fix/description`, `feat/description`, `chore/description`
- **Code style**: Run `npm run lint` before committing
- **Tests**: Run `npm test` — all tests must pass
- **Build**: Run `npm run build` to verify production build

## Project Structure

```
main.js              — Electron main process
preload.js           — Electron preload (exposes platform)
src/
  App.jsx            — Root component
  components/        — React components (Header, InputBar, etc.)
  hooks/             — useDebateOrchestrator (core debate logic)
  utils/             — Webview injectors (chatgpt, gemini, deepseek, perplexity)
```

## Updating Injectors

Each AI platform has an injector in `src/utils/`. If a platform changes its DOM, update the selectors in the corresponding injector file. Test by running a debate with that AI enabled.

## Pull Request Process

1. Update the report.md if your change affects project analysis
2. Ensure lint and tests pass
3. Open a PR against `main` with a clear description of the change

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful, constructive, and inclusive.
