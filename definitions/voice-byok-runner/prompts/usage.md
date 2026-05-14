# Usage Guide — Voice BYOK Runner

This template ships with a working voice-conversation component. Customize the visuals and the assistant's personality, but do NOT rewrite the BYOK + VAD plumbing — the wiring is correct as shipped.

## What's already wired (DO NOT change unless you understand why)

1. **Token mint on mount** — `src/components/VoiceConversation.tsx` fetches `${API_BASE}/api/apps/${APP_ID}/byok-token` once when the component mounts. The returned JWT is cached in a ref and used as `Authorization: Bearer ${token}` for all proxy calls. The platform validates the appId-origin binding before minting (cross-user defense).

2. **Voice Activity Detection (VAD) auto-stop** — clicking the mic starts recording. A `requestAnimationFrame` loop runs `AnalyserNode.getFloatTimeDomainData()` and computes RMS amplitude. Recording stops automatically after `SILENCE_DURATION_MS` of silence following the user's first detected voice. **No manual second-tap.** A `MAX_RECORDING_MS` failsafe also caps any single recording.

3. **gpt-4o-audio-preview round-trip** — each voice turn sends base64 webm audio, receives base64 wav audio, plays it back via `new Audio(URL.createObjectURL(...))`. ONE call per turn. No separate STT/TTS endpoints.

4. **`serviceName` fallback chain** — if the proxy returns 404 (no key found for the placeholder `<EXACT_SERVICE_NAME>`), the component automatically retries with `OpenAI`, `openai`, `OPENAI` in order. Only after all candidates 404 does it surface "Please add your OpenAI key in Settings".

5. **401 retry** — if the JWT expires mid-session (1-hour TTL), the component re-fetches `byok-token` once and retries the proxy call with the fresh token. Loops forbidden — exactly one retry.

## What you SHOULD customize

### Visual identity
- **`src/pages/HomePage.tsx`** — the page that wraps `VoiceConversation`. Change layout, headline, branding, color scheme. The component itself is centered and self-contained; surrounding content is up to you.
- **`src/components/VoiceConversation.tsx`** — the mic button JSX is at the bottom of the file (the `return (...)` block). Change the icon (currently 🎙), the label text, the button shape, the ring colors. **Do not rewrite the state machine or effect hooks** — they're correct as shipped.
- Inline classes use Tailwind (already configured in the reference).

### Assistant personality
- The constant `SYSTEM_PROMPT` near the top of `VoiceConversation.tsx` reads `'You are a helpful voice assistant. Keep replies under 2 sentences.'` Replace with your assistant's persona. Keep it short — long voice replies feel sluggish.
- The constant `VOICE` selects the OpenAI voice. Default `'alloy'`. Other options: `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`.

### VAD tuning (constants near top of `VoiceConversation.tsx`)
| Constant | Default | Effect |
|---|---|---|
| `SILENCE_THRESHOLD` | `0.015` | RMS amplitude (0–1) below which counts as silence. Lower = more sensitive (catches quieter speakers); higher = more tolerant of background noise. |
| `SILENCE_DURATION_MS` | `1500` | How long to hold below threshold AFTER the user's first detected voice before auto-stop. Lower = snappier turn-taking (1000ms feels brisk); higher = more pause-tolerant (2000ms allows hesitation mid-sentence). |
| `MAX_RECORDING_MS` | `30000` | Failsafe ceiling on a single recording. If reached, recording stops regardless of VAD state. |

### `serviceName` placeholder
- `PRIMARY_SERVICE_NAME` is `'<EXACT_SERVICE_NAME>'`. **Replace this with the user's actual stored key name when generating an app for a specific user.** Ask the user, or check if they've mentioned it. If you don't know, leave the placeholder — the fallback chain catches the most common cases.

## What you MUST NOT do

- ❌ Don't replace `MediaRecorder` with `SpeechRecognition`. SpeechRecognition is browser-native STT (Chromium-only, lower quality, requires separate TTS). The whole point of this template is server-side `gpt-4o-audio-preview` doing STT + reasoning + TTS in one call.
- ❌ Don't replace `gpt-4o-audio-preview` audio playback with `window.speechSynthesis`. That's browser-native TTS and bypasses the OpenAI voice quality the user is paying for.
- ❌ Don't add `credentials: 'include'` to the proxy fetch. Auth is `Authorization: Bearer ${byokToken}` only. Cookies don't travel cross-subdomain anyway, and the platform's CSRF middleware would block cookie-bearing POSTs from sandbox origins.
- ❌ Don't construct relative URLs (`fetch('/api/proxy/external')`). From a sandbox subdomain those hit the user's own Vite server, not the platform. Always use `${API_BASE}/api/proxy/external` where `API_BASE = window.__STARTVIBECODE_API || ''`.
- ❌ Don't add a chat-history UI, message list, or transcript display unless the user explicitly asks. This template is voice-first; visual output is a state indicator (idle/listening/processing/speaking/error), not a transcript.
- ❌ Don't wrap the whole app in extra routes or providers unless the user asks for multi-page navigation. The single-page voice landing is the design.

## Error UX (already handled by the component)

| Status | User-visible behavior |
|---|---|
| Mounting | Button shows "Connecting…" while byok-token mint is in flight. Disabled. |
| Mic permission denied | "Please allow microphone access in your browser settings." Tap to retry. |
| 401 from proxy (token expired) | Auto-refetches once and retries the proxy call. If still 401: "Voice session expired, please refresh the page." |
| 404 from proxy (no matching key) | Tries the `serviceName` fallbacks. If all 404: "Please add your OpenAI key in Settings → External API Keys to use voice features." |
| Other 5xx / network error | "Voice service unavailable. Please try again." |

The component never surfaces raw error strings (`event.error`, fetch errors, etc.) to the user — only the friendly messages above.

## File overview

```
src/
├── pages/HomePage.tsx           ← page wrapper; customize visuals here
└── components/
    └── VoiceConversation.tsx    ← the mic + state + BYOK + VAD; tune constants near the top
```

The reference scaffold provides everything else (Vite, React, Tailwind, ErrorBoundary, etc.). You don't need to add any new files for a working voice app — just customize what's already here.
