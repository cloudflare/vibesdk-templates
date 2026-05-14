import VoiceConversation from '@/components/VoiceConversation';

export function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 gap-8">
      <header className="text-center max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Voice Assistant</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Tap the mic, speak naturally, then pause. The assistant listens, thinks,
          and replies aloud.
        </p>
      </header>
      <VoiceConversation />
    </main>
  );
}
