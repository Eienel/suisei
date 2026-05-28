import { useEffect, useRef, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useApp } from '@/state/app';
import { questById } from '@/data/quests';
import { callAgent } from '@/sui/agent';
import { Send } from 'lucide-react';

interface Msg {
  who: 'suisei' | 'you';
  text: string;
}

/**
 * Persistent right-side chat panel. For Sprint 0 the agent voice is
 * scripted: when the active quest or phase changes, Suisei pushes the
 * next line. Swap point for the Claude Haiku proxy is `agentReply()`.
 */
export function SuiseiChat() {
  const currentQuest = useApp((s) => s.currentQuest);
  const phase = useApp((s) => s.questPhase);
  const badges = useApp((s) => s.badges);
  const account = useCurrentAccount();
  const quest = currentQuest ? questById(currentQuest) : undefined;

  const [messages, setMessages] = useState<Msg[]>([
    {
      who: 'suisei',
      text:
        "I'm Suisei. I'll walk you through Sui by doing Sui with you. Pick a quest and I'll narrate.",
    },
  ]);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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
    if (!text || thinking) return;
    setDraft('');
    const next = [...messages, { who: 'you' as const, text }];
    setMessages(next);
    setThinking(true);

    const history = next.map((m) => ({
      role: m.who === 'suisei' ? ('assistant' as const) : ('user' as const),
      content: m.text,
    }));

    const result = await callAgent({
      questId: quest?.id ?? null,
      phase,
      address: account?.address ?? null,
      badgesEarned: badges.length,
      messages: history,
    });

    const reply =
      result?.reply ?? scriptedFallback(text, quest?.id ?? null, phase);
    setMessages((m) => [...m, { who: 'suisei', text: reply }]);
    setThinking(false);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[340px] shrink-0 border-l border-night-line/70 bg-night-deep/60">
      <header className="px-4 py-3 border-b border-night-line/70 flex items-center gap-2.5">
        <SuiseiMark />
        <div className="leading-tight">
          <p className="font-display font-semibold text-cream text-sm">Suisei</p>
          <p className="text-[10px] text-cream-mute font-mono uppercase tracking-[0.16em]">
            {quest ? `Quest ${quest.number}` : 'Idle'}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-sage font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse-soft" />
          live
        </span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <Bubble key={i} m={m} />
        ))}
        {thinking && (
          <div className="text-[13px] text-cream-mute font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-butter animate-pulse-soft" />
            Suisei is thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-night-line/70 p-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask Suisei…"
          disabled={thinking}
          className="flex-1 bg-night rounded-pill px-4 py-2 text-sm border border-night-line focus:border-butter/60 focus:outline-none placeholder:text-cream-mute text-cream disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={thinking || !draft.trim()}
          className="px-3 rounded-pill bg-butter/20 border border-butter/40 text-butter hover:bg-butter/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send"
        >
          <Send size={14} />
        </button>
      </form>
    </aside>
  );
}

function SuiseiMark() {
  return (
    <span className="relative inline-flex w-8 h-8 items-center justify-center rounded-[10px] bg-cream">
      <span className="w-3.5 h-3.5 rounded-[6px] bg-butter" />
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-terracotta border-2 border-night-deep" />
    </span>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.who === 'suisei') {
    return (
      <div className="text-[14px] leading-relaxed">
        <p className="eyebrow text-butter mb-1">Suisei</p>
        <p className="text-cream">{m.text}</p>
      </div>
    );
  }
  return (
    <div className="text-[14px] leading-relaxed text-right">
      <p className="eyebrow text-cream-mute mb-1">You</p>
      <p className="text-cream-dim">{m.text}</p>
    </div>
  );
}

/**
 * Sprint 0 scripted voice. Each (quest, phase) gets a single line.
 * Sprint 1+ replaces this with a Claude Haiku call via the agent proxy.
 */
function scriptedLine(questId: string, phase: string): string | null {
  const lines: Record<string, Record<string, string>> = {
    zklogin: {
      intro:
        "Quest 1: zkLogin. You'll get a wallet by signing in with Google. No seed phrase, no extension. The wallet address is yours; Mysten just helps you prove you own it.",
      scaffold:
        "There's no Move to write here. The magic is that the address you got is a normal Sui address that can sign normal transactions. Hit sign in to see it.",
      deploy: "Nothing to deploy yet, zkLogin is client-side. Moving on.",
      interact:
        "Tap 'Mint my first badge' below. I'll wrap the transaction so you pay zero gas.",
      badge: "Minting your first soulbound proof. Watch the chain confirm it.",
      done:
        "You have a wallet, an on-chain badge, and you spent nothing. Welcome to Sui.",
    },
    sponsored: {
      intro:
        "Quest 2: sponsored transactions. On Ethereum, an empty wallet can do nothing — no ETH, no gas. Sui lets a third party (the app) sign the gas object so your first action costs you literally zero.",
      interact:
        "You'll sign the intent, the app signs the gas. Two signatures, one transaction. Hit 'Mint, on the house' when you're ready.",
      badge:
        "Sponsor is signing the gas object. Then you sign the intent. Then the network executes — atomically.",
      done:
        "Notice your wallet balance: unchanged. The sponsor ate the gas. This is how Sui apps onboard a non-crypto user without a seed phrase, a faucet, or a credit card.",
    },
    abilities: {
      intro:
        "Quest 3: Move abilities. Solidity has no equivalent. The compiler refuses to let you write unsafe code — that refusal is the safety, not a runtime check.",
      interact:
        "Look at the badge struct. Pick the abilities that make it soulbound. Add `store` and you've just made it tradable. Add `drop` and someone can delete your proof. Add `copy` and there's no scarcity. The right answer is `has key` and nothing else.",
      badge:
        "Compiler accepted it. That's the lesson: you didn't have to remember any rules, the type system enforced them.",
      done:
        "Every badge in your wallet from this quest forward is protected by exactly this declaration. Type-level safety, not vigilance.",
    },
    capability: {
      intro:
        "Quest 4: the capability pattern. EVM's reflex is `require(msg.sender == owner)`. Sui's reflex is to make admin power an object you hold. Holding it is the authorization.",
      interact:
        "Three function signatures for an admin mint. Pick the one where the type system enforces the guard — not a runtime check, not a hardcoded address.",
      badge:
        "Signature accepted. That cap is now transferable, wrappable in a multisig, sendable to a DAO. The contract never has to know who the admin is.",
      done:
        "This pattern composes. A cap can be inside a wallet, a contract, a multisig, a timelock — and the mint function just keeps working. That's why Sui devs reach for it.",
    },
    soulbound: {
      intro:
        "Quest 5: now feel what soulbound actually means. Quest 3 declared the abilities; this one runs three different attacks against your badge and shows them all being refused — at compile time.",
      interact:
        "Click each attack to see the Move compiler's error verbatim. The first tries to transfer, the second wraps it in a Bag, the third tries to silently drop it. None of them link.",
      badge:
        "All three blocked, structurally. Type system did the work — you didn't write a single `require`.",
      done:
        "Compare this to EVM SBTs, which are just ERC-721s with `_beforeTokenTransfer` reverting. That's a runtime guard you have to remember. Sui's is a binary that won't even produce.",
    },
    ptb: {
      intro:
        "Quest 6: programmable transaction blocks. EVM composability means writing a contract that orchestrates other contracts. Sui's transaction itself is the orchestrator — up to 1024 operations, atomic or not at all.",
      interact:
        "Run the same payment two ways. As one PTB, then as four separate transactions where step three throws. The state difference is the lesson.",
      badge:
        "PTB rolls back cleanly. Sequential leaves you reconciling a half-split coin and a stranded transfer. Atomicity is a transaction-level guarantee, not a contract-level pattern.",
      done:
        "This is why Sui devs reach for flash loans, batched DEX routes, multi-step claims with one signature. The transaction is the unit of atomicity.",
    },
    walrus_seal: {
      intro:
        "Quest 7: Walrus and Seal. Walrus is decentralized blob storage on Sui. Seal is threshold encryption gated by an on-chain Move policy. Together they give you 'public ciphertext, conditional reads' — a primitive most chains can't express without a trusted off-chain server.",
      interact:
        "Write a short message, seal it, publish to Walrus. Then watch a badge-holder decrypt it cleanly while an empty wallet gets refused by the policy.",
      badge:
        "Storage layer is public, durable, content-addressed. Policy layer is on chain and Move-typed. Compose the two and you've got encrypted-but-permissionless data.",
      done:
        "This is the Walrus track bounty. Build something with it: gated lore for an NFT collection, paywalled JSON, private comments under a public post.",
    },
    deepbook_grad: {
      intro:
        "Quest 8: the graduate. DeepBook is Sui's fully on-chain central-limit orderbook. No AMM curve, no off-chain market maker, no relayer. Just Move, holding state, matching crosses on price-time priority.",
      interact:
        "Place a limit order against the SUI/USDC book. If it crosses, it fills. If not, it rests. Either outcome counts — orderbook semantics are the lesson.",
      badge:
        "Order routed. You're about to mint the graduate badge — eighth and last. The set is complete.",
      done:
        "You've shipped on the whole stack. Now plug @suisei/sui-skills-mcp into Claude Desktop or Cursor and let your own agent do this — and then anything else you want it to.",
    },
  };
  return lines[questId]?.[phase] ?? null;
}

/**
 * Last-resort reply when the agent proxy is unreachable / not configured.
 * Keeps Suisei coherent on local dev and lets the demo run without an
 * Anthropic key in env.
 */
function scriptedFallback(
  _userText: string,
  questId: string | null,
  _phase: string,
): string {
  if (!questId) {
    return "I'm running scripted right now — set ANTHROPIC_API_KEY on the Vercel project and I'll come alive. Pick a quest from the hub and I'll narrate.";
  }
  return "I'm scripted to the current quest right now. The interactive me runs through /api/agent — once the host's ANTHROPIC_API_KEY is set, I'll answer freely.";
}
