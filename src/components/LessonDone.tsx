import { useEffect, useRef } from 'react';
import { Check, ArrowRight, Home, Cuboid } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import type { Lesson } from '@/data/lessons';
import { LESSONS, SANDBOX_UNLOCK_COUNT, totalQuestions } from '@/data/lessons';
import { useApp } from '@/state/app';
import { useWorld } from '@/state/world';
import { useSaveWorld } from '@/sui/useSaveWorld';
import { SaveWorldButton } from './SaveWorldButton';
import { ShareButton } from './ShareButton';
import { AuthButton } from './AuthButton';

export function LessonDone({
  lesson,
  onNext,
  onHome,
}: {
  lesson: Lesson;
  onNext: (() => void) | null;
  onHome: () => void;
}) {
  const completed = useApp((s) => s.completedLessons);
  const setScreen = useApp((s) => s.setScreen);
  const sandboxUnlocked = useApp((s) => s.isSandboxUnlocked());
  const justUnlockedSandbox =
    completed.length === SANDBOX_UNLOCK_COUNT && sandboxUnlocked;
  const placed = useWorld((s) => s.blocks.length);
  const isFinal = completed.length === LESSONS.length;
  const totalQs = totalQuestions();

  // Auto-mint Crypto 101 NFT on the lesson-6 done screen IF:
  //   - this is the final lesson done
  //   - a wallet is connected
  //   - the lessons NFT hasn't already been minted
  //   - we haven't already kicked off this auto-mint in this session
  // The wallet still prompts to sign, but the user doesn't have to dig
  // for the button.
  const account = useCurrentAccount();
  const { save, phase, kind: savedKind, hasLessons } = useSaveWorld();
  const autoTriggered = useRef(false);
  useEffect(() => {
    if (!isFinal) return;
    if (!account?.address) return;
    if (hasLessons) return;
    if (autoTriggered.current) return;
    if (phase !== 'idle' && savedKind === 'lessons') return;
    autoTriggered.current = true;
    // Tiny delay so the screen has a chance to render first.
    const t = setTimeout(() => {
      save({ kind: 'lessons' }).catch(() => { /* surfaced in SaveWorldButton */ });
    }, 800);
    return () => clearTimeout(t);
  }, [isFinal, account?.address, hasLessons, phase, savedKind, save]);

  return (
    <div className="fixed inset-0 bg-ink flex items-center justify-center p-6">
      <div className="rounded-2xl p-8 max-w-md w-full bg-ink-soft border border-ink-line text-center animate-rise-in">
        <div className="w-16 h-16 rounded-full bg-accent-cyan/15 text-accent-cyan flex items-center justify-center mx-auto mb-4">
          <Check size={32} />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-accent-cyan mb-1">
          {isFinal ? 'Town complete' : 'Lesson complete'}
        </p>
        <h2 className="text-2xl font-semibold text-fg mb-2 tracking-tight">{lesson.title}</h2>
        <p className="text-sm text-fg-mute mb-4">
          {lesson.district} added · {placed} blocks placed of {totalQs} possible
        </p>

        {isFinal && (
          <div className="mt-4 mb-2 rounded-xl border border-accent-amber/40 bg-accent-amber/10 p-3 text-left">
            <p className="text-accent-amber text-xs font-mono uppercase tracking-widest mb-1">
              All six districts built
            </p>
            <p className="text-fg-dim text-sm leading-relaxed mb-3">
              {account
                ? hasLessons
                  ? 'Your Crypto 101 NFT is already on chain — visible on the leaderboard and at /town/your-address.'
                  : 'Auto-minting your Crypto 101 NFT now — sign the prompt when your wallet asks. This freezes the town as a one-time achievement.'
                : 'Connect a wallet below to mint this exact town as a Crypto 101 NFT — a one-time commemorative record of finishing every lesson.'}
            </p>
            <div className="flex flex-wrap gap-2 items-center">
              <SaveWorldButton kind="lessons" />
            </div>
          </div>
        )}

        {!isFinal && justUnlockedSandbox && (
          <div className="mt-4 mb-2 rounded-xl border border-accent-violet/40 bg-accent-violet/10 p-3 text-left">
            <p className="text-accent-violet text-xs font-mono uppercase tracking-widest mb-1">
              Sandbox unlocked
            </p>
            <p className="text-fg-dim text-sm leading-relaxed">
              You finished 3 lessons — free-play with the AI Builder Agent is now open.
            </p>
          </div>
        )}

        {/* Onchain row — only shown for non-final lessons (final has its own callout above) */}
        {!isFinal && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-ink-line/60 pt-5">
            <ShareButton />
            <AuthButton />
          </div>
        )}

        <div className="flex flex-col gap-2 mt-6">
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="btn-primary flex items-center justify-center gap-1.5"
            >
              Next lesson
              <ArrowRight size={14} />
            </button>
          )}
          {(isFinal || justUnlockedSandbox) && (
            <button
              type="button"
              onClick={() => setScreen('sandbox')}
              className="rounded-lg px-4 py-2 font-semibold bg-accent-violet text-ink hover:bg-accent-violet/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Cuboid size={14} />
              Open Sandbox
            </button>
          )}
          <button
            type="button"
            onClick={onHome}
            className="btn-ghost flex items-center justify-center gap-1.5"
          >
            <Home size={14} />
            Back to lessons
          </button>
        </div>
      </div>
    </div>
  );
}
