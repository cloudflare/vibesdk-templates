# Template Selection — Voice BYOK Runner

Voice-first React SPA. Single mic button. Server-side voice via OpenAI gpt-4o-audio-preview, routed through the platform's BYOK proxy with the user's stored OpenAI key.

Use when:
- The user asks for a voice assistant, voice coach, voice tutor, conversational AI, or any "voice-only" / "no text input" experience.
- The interaction is real-time speech: user speaks, AI replies aloud, repeat.
- A small, focused, mic-button-centric UI is preferred over a chat thread or transcript display.
- Natural turn-taking is desired (tap once, speak, pause → AI responds; not press-and-hold).

Avoid when:
- The user wants a text chat UI as the primary interaction (use `c-code-react-runner` and add a small voice component if needed).
- Voice is one feature among many — a richer general-purpose template with a voice component bolted on is more flexible.
- The user explicitly wants browser-native voice (`window.speechSynthesis` / `SpeechRecognition`) instead of OpenAI quality. This template uses server-side OpenAI audio exclusively.

Built with:
- React + Vite + Tailwind (from `vite-reference` base)
- Native `MediaRecorder` + `AudioContext` `AnalyserNode` for Voice Activity Detection (no `SpeechRecognition`)
- Platform endpoints `/api/apps/:id/byok-token` (mint JWT) and `/api/proxy/external` (proxy to OpenAI with the user's stored key)
- `gpt-4o-audio-preview` for audio-in/audio-out in a single round-trip per voice turn
- Deterministic 401 retry (auto-refetch JWT once) and `serviceName` fallback chain (handles common variations like `OpenAI`, `openai`, `OPENAI`)

Prerequisites the platform must satisfy at runtime (already true in production):
- The HTMLRewriter injects `window.__STARTVIBECODE_API` and `window.__APP_ID` into served HTML
- `AI_PROXY_JWT_SECRET` is configured on the worker
- The user has stored an OpenAI key in Settings → External API Keys

If those prereqs are missing, the component shows a graceful error message ("Voice service unavailable" / "Please add your OpenAI key in Settings"). It does NOT fall back to browser-native voice.
