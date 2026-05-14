import { useCallback, useEffect, useRef, useState } from 'react';

// =====================================================================
// VAD (Voice Activity Detection) tuning — adjust these to make detection
// more or less sensitive. See prompts/usage.md for guidance.
// =====================================================================
const SILENCE_THRESHOLD = 0.015;     // RMS amplitude (0-1); below this counts as silence
const SILENCE_DURATION_MS = 1500;    // hold below threshold this long AFTER first voice → auto-stop
const MAX_RECORDING_MS = 30000;      // failsafe ceiling on a single recording

// =====================================================================
// Service-name fallback chain — tried in order on 404 from the proxy.
// AI builder should replace <EXACT_SERVICE_NAME> with the user's actual
// stored key name in Settings → External API Keys. If left as placeholder,
// the fallback chain catches the most common variations.
// =====================================================================
const PRIMARY_SERVICE_NAME = '<EXACT_SERVICE_NAME>';
const SERVICE_NAME_FALLBACKS = ['OpenAI', 'openai', 'OPENAI'];

// =====================================================================
// Assistant personality — customize for your app's persona.
// =====================================================================
const SYSTEM_PROMPT = 'You are a helpful voice assistant. Keep replies under 2 sentences.';
const VOICE = 'alloy'; // alloy | ash | ballad | coral | echo | sage | shimmer

type Status = 'connecting' | 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface ByokTokenResponse {
  data: { token: string; expiresIn: number };
}

interface ChatCompletion {
  choices: Array<{ message: { audio?: { data: string } } }>;
}

declare global {
  interface Window {
    __STARTVIBECODE_API?: string;
    __APP_ID?: string;
  }
}

export default function VoiceConversation() {
  const [status, setStatus] = useState<Status>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs (NOT useState — recording objects in state cause re-render loops).
  const byokTokenRef = useRef<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const recordStartRef = useRef<number>(0);
  const lastVoiceAtRef = useRef<number>(0);
  const voiceDetectedRef = useRef<boolean>(false);

  const API_BASE =
    typeof window !== 'undefined' ? window.__STARTVIBECODE_API || '' : '';
  const APP_ID =
    typeof window !== 'undefined'
      ? window.__APP_ID || (import.meta.env.VITE_APP_ID as string | undefined)
      : undefined;

  // ── 1. Mint BYOK token ───────────────────────────────────────────────
  const fetchByokToken = useCallback(async (): Promise<string | null> => {
    if (!APP_ID) return null;
    try {
      const r = await fetch(`${API_BASE}/api/apps/${APP_ID}/byok-token`);
      if (!r.ok) return null;
      const json = (await r.json()) as ByokTokenResponse;
      byokTokenRef.current = json.data.token;
      return json.data.token;
    } catch {
      return null;
    }
  }, [API_BASE, APP_ID]);

  useEffect(() => {
    if (!APP_ID) {
      setStatus('error');
      setErrorMessage('App ID unavailable. Please refresh the page.');
      return;
    }
    fetchByokToken().then((tok) => {
      if (tok) {
        setStatus('idle');
      } else {
        setStatus('error');
        setErrorMessage('Voice service unavailable. Please refresh.');
      }
    });
  }, [APP_ID, fetchByokToken]);

  // ── 2. Cleanup on unmount ────────────────────────────────────────────
  useEffect(() => {
    return cleanupRecording;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanupRecording() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }

  // ── 3. VAD loop ──────────────────────────────────────────────────────
  // Runs every animation frame while recording. Stops when:
  //   - voice was heard at least once AND silence has held for SILENCE_DURATION_MS
  //   - OR total recording time hit MAX_RECORDING_MS (failsafe)
  // Pre-voice silence does NOT count; a slow-to-start user is not cut off.
  const vadLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const recorder = recorderRef.current;
    if (!analyser || !recorder || recorder.state !== 'recording') return;

    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sumSq = 0;
    for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
    const rms = Math.sqrt(sumSq / buf.length);

    const now = performance.now();
    if (rms > SILENCE_THRESHOLD) {
      lastVoiceAtRef.current = now;
      voiceDetectedRef.current = true;
    }

    const elapsed = now - recordStartRef.current;
    const sinceVoice = now - lastVoiceAtRef.current;

    if (voiceDetectedRef.current && sinceVoice >= SILENCE_DURATION_MS) {
      recorder.stop();
      return;
    }
    if (elapsed >= MAX_RECORDING_MS) {
      recorder.stop();
      return;
    }
    rafRef.current = requestAnimationFrame(vadLoop);
  }, []);

  // ── 4. Start recording ───────────────────────────────────────────────
  async function startRecording() {
    if (!byokTokenRef.current) return;
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const heardVoice = voiceDetectedRef.current;
        cleanupRecording();
        voiceDetectedRef.current = false;
        if (heardVoice && blob.size > 0) {
          processAudio(blob);
        } else {
          setStatus('idle');
        }
      };

      // Wire AnalyserNode for VAD on the SAME stream.
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const t0 = performance.now();
      recordStartRef.current = t0;
      lastVoiceAtRef.current = t0;
      voiceDetectedRef.current = false;

      recorder.start();
      setStatus('listening');
      rafRef.current = requestAnimationFrame(vadLoop);
    } catch (err) {
      console.error('Mic access failed', err);
      setStatus('error');
      setErrorMessage('Please allow microphone access in your browser settings.');
    }
  }

  // ── 5. Process recorded audio: BYOK proxy with serviceName fallback ──
  async function processAudio(blob: Blob) {
    setStatus('processing');
    try {
      const b64 = await blobToBase64(blob);
      const candidates = [PRIMARY_SERVICE_NAME, ...SERVICE_NAME_FALLBACKS];

      // Try each serviceName candidate; on 404, advance.
      // On 401, re-mint token and retry the full chain ONCE.
      let res = await tryCandidates(candidates, b64, byokTokenRef.current!);
      if (res.status === 401) {
        const fresh = await fetchByokToken();
        if (fresh) res = await tryCandidates(candidates, b64, fresh);
      }

      if (res.status === 404) {
        setStatus('error');
        setErrorMessage(
          'Please add your OpenAI key in Settings → External API Keys to use voice features.',
        );
        return;
      }
      if (res.status === 401) {
        setStatus('error');
        setErrorMessage('Voice session expired, please refresh the page.');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setErrorMessage('Voice service unavailable. Please try again.');
        return;
      }

      const data = (await res.json()) as ChatCompletion;
      const audioB64 = data.choices[0]?.message.audio?.data;
      if (!audioB64) {
        setStatus('error');
        setErrorMessage('No audio in response. Please try again.');
        return;
      }

      const bytes = Uint8Array.from(atob(audioB64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setStatus('idle');
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setStatus('error');
        setErrorMessage('Audio playback failed.');
      };
      setStatus('speaking');
      await audio.play();
    } catch (err) {
      console.error('Voice processing failed', err);
      setStatus('error');
      setErrorMessage('Voice service unavailable. Please try again.');
    }
  }

  async function tryCandidates(
    candidates: string[],
    b64: string,
    token: string,
  ): Promise<Response> {
    let last: Response | null = null;
    for (const serviceName of candidates) {
      const res = await callProxy(b64, token, serviceName);
      last = res;
      if (res.status !== 404) return res;
    }
    return last!; // last 404 if all candidates failed
  }

  function callProxy(
    audioB64: string,
    token: string,
    serviceName: string,
  ): Promise<Response> {
    return fetch(`${API_BASE}/api/proxy/external`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        serviceName,
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        body: {
          model: 'gpt-4o-audio-preview',
          modalities: ['text', 'audio'],
          audio: { voice: VOICE, format: 'wav' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'input_audio', input_audio: { data: audioB64, format: 'webm' } },
              ],
            },
          ],
        },
      }),
    });
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve((r.result as string).split(',')[1]);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  // ── 6. UI ────────────────────────────────────────────────────────────
  function handleClick() {
    if (status === 'idle' && byokTokenRef.current) {
      startRecording();
    } else if (status === 'error') {
      // Recover: clear error and re-check token
      setErrorMessage(null);
      if (byokTokenRef.current) {
        setStatus('idle');
      } else {
        setStatus('connecting');
        fetchByokToken().then((tok) => setStatus(tok ? 'idle' : 'error'));
      }
    }
  }

  const buttonLabel: Record<Status, string> = {
    connecting: 'Connecting…',
    idle: 'Tap to talk',
    listening: 'Listening…',
    processing: 'Thinking…',
    speaking: 'Speaking…',
    error: 'Tap to retry',
  };

  const ringClass: Record<Status, string> = {
    connecting: 'border-zinc-600',
    idle: 'border-zinc-500 hover:border-zinc-300',
    listening: 'border-blue-500 ring-4 ring-blue-500/20',
    processing: 'border-amber-500',
    speaking: 'border-emerald-500 ring-4 ring-emerald-500/30 animate-pulse',
    error: 'border-red-500',
  };

  const interactive = status === 'idle' || status === 'error';

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={!interactive}
        aria-label={buttonLabel[status]}
        className={[
          'w-48 h-48 rounded-full border-4 bg-zinc-900 text-zinc-100',
          'flex flex-col items-center justify-center gap-2',
          'transition-all duration-200',
          interactive ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-not-allowed opacity-90',
          ringClass[status],
        ].join(' ')}
      >
        <span className="text-5xl" aria-hidden="true">🎙</span>
        <span className="text-sm font-medium">{buttonLabel[status]}</span>
      </button>

      {errorMessage && (
        <p role="alert" className="text-sm text-red-400 text-center max-w-xs">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
