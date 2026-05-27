import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { Sparkles, Send } from 'lucide-react';

interface Msg {
  who: 'suisei' | 'you';
  text: string;
}

/**
 * Persistent right-side chat panel. For Sprint 0 the agent voice is
 * scripted: when the active quest or phase changes, Suisei pushes the
 * next line. The seam to swap in the Claude Haiku proxy is the
 * `agentReply()` helper at the bottom.
 */
export function SuiseiChat() {
  const currentQuest = useApp((s) => s.currentQuest);
  const phase = useApp((s) => s.questPhase);
  const quest = currentQuest ? questById(currentQuest) : undefined;

  const [messages, setMessages] = useState<Msg[]>([
    {
      who: 'suisei',
      text:
        "I'm Suisei. I'll teach you Sui by doing Sui with you. Pick a quest — I'll talk you through it.",
    },
  ]);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Scripted Suisei: react to quest + phase changes.
  useEffect(() => {
    if (!quest) return;
    const line = scriptedLine(quest.id, phase);
    if (!line) return;
    setMessages((m) => {
      if (m[m.length - 1]?.text === line) return m;
      return [...m, { who: 'suisei', text: line }];
    });
  }, [quest, phase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setMessages((m) => [...m, { who: 'you', text }]);
    const reply = await agentReply(text, quest?.id ?? null);
    setMessages((m) => [...m, { who: 'suisei', text: reply }]);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[320px] shrink-0 border-l border-ink-line/40 bg-ink-soft/40">
      <header className="px-4 py-3 border-b border-ink-line/40 flex items-center gap-2">
        <span className="w-6 h-6 rounded-md bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center">
          <Sparkles size={12} className="text-accent-cyan" />
        </span>
        <span className="font-semibold text-sm">Suisei</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-fg-mute">
          {quest ? `Q${quest.number}` : 'idle'}
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <Bubble key={i} m={m} />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-ink-line/40 p-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Suisei…"
          className="flex-1 bg-ink rounded-md px-3 py-1.5 text-sm border border-ink-line/60 focus:border-accent-blue/60 focus:outline-none placeholder:text-fg-mute"
        />
        <button
          type="submit"
          className="px-2.5 rounded-md bg-accent-blue/20 border border-accent-blue/40 text-accent-cyan hover:bg-accent-blue/30 transition-colors"
          aria-label="Send"
        >
          <Send size={14} />
        </button>
      </form>
    </aside>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.who === 'suisei') {
    return (
      <div className="text-sm leading-relaxed">
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan mr-2">
          suisei
        </span>
        <span className="text-fg-dim">{m.text}</span>
      </div>
    );
  }
  return (
    <div className="text-sm leading-relaxed text-right">
      <span className="text-fg/90">{m.text}</span>
    </div>
  );
}

/**
 * Sprint 0 scripted voice. Each (quest, phase) gets a single line.
 * Sprint 1+ replaces this with a Claude Haiku call routed through the
 * serverless agent proxy.
 */
function scriptedLine(questId: string, phase: string): string | null {
  const lines: Record<string, Record<string, string>> = {
    zklogin: {
      intro:
        "Quest 1: zkLogin. You'll get a wallet by signing in with Google — no seed phrase, no extension. The wallet address is yours; Mysten just helps you prove you own it.",
      scaffold:
        'No Move to write here — the magic is the address you got is a normal Sui address that can sign normal transactions. Click sign in to see it.',
      deploy: "Deploying nothing — zkLogin is client-side. We'll move on.",
      interact: "Tap 'Mint badge' below and I'll wrap it in a Sponsored Tx so you pay $0 gas.",
      badge: 'Minting your first soulbound proof. Watch the chain confirm it.',
      done: 'You have a wallet, an on-chain badge, and you spent nothing. Welcome to Sui.',
    },
  };
  return lines[questId]?.[phase] ?? null;
}

async function agentReply(_userText: string, _questId: string | null): Promise<string> {
  await new Promise((r) => setTimeout(r, 350));
  return "I'll wire myself to Claude Haiku next sprint — for now I'm scripted to the current quest.";
}
