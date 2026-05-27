import { useEffect } from 'react';
import { Landmark, Store, Droplets, ExternalLink, Loader2, Check, AlertCircle, Sparkles, ArrowRightCircle } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { World } from './World';
import { HUD } from './HUD';
import { Toolbar } from './Toolbar';
import { useWorld } from '@/state/world';
import { useApp } from '@/state/app';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { music } from '@/audio/music';
import { BUILDINGS, evaluateAll, captureBuildingCells, type DefiAction, type BuildingProgress, type BuildingBlueprint } from '@/defi/buildings';
import { useStake } from '@/defi/useStake';

/**
 * DeFi District — its own world slice with fixed blueprint plots. Players
 * build the blueprint (timber walls + roof + door + a feature block) and
 * the completed building "activates" a real onchain DeFi action.
 *
 * v1 ships the Bank (native staking via 0x3::sui_system). Market (swap)
 * and Pool (LP) live as visible plots but their activations are stubbed
 * pending Cetus / liquid-staking integration.
 */
export function DefiDistrict() {
  const setMode = useWorld((s) => s.setMode);
  const blocks = useWorld((s) => s.blocks);
  const account = useCurrentAccount();

  useEffect(() => {
    setMode('defi');
  }, [setMode]);

  useEffect(() => {
    music.start();
    return () => music.stop();
  }, []);

  const progress = evaluateAll(blocks);

  return (
    <div className="fixed inset-0 bg-ink overflow-hidden">
      <ErrorBoundary fallback={(err) => <DistrictFallback message={err.message} />}>
        <World />
      </ErrorBoundary>

      <HUD />

      <div className="absolute bottom-3 sm:bottom-5 left-14 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-2 sm:w-auto">
        <Toolbar />
      </div>

      <BuildingsPanel progress={progress} walletConnected={!!account?.address} />
    </div>
  );
}

function BuildingsPanel({
  progress,
  walletConnected,
}: {
  progress: Record<string, BuildingProgress>;
  walletConnected: boolean;
}) {
  return (
    <aside className="absolute top-16 sm:top-20 right-3 sm:right-5 z-20 pointer-events-auto w-[280px] sm:w-[300px] max-h-[calc(100vh-9rem)] overflow-y-auto">
      <div className="glass rounded-2xl p-4 shadow-glass space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent-cyan">
            DeFi District
          </p>
          <h2 className="text-lg font-semibold text-fg leading-tight">
            Build · Activate · Earn
          </h2>
          <p className="text-xs text-fg-mute mt-1 leading-relaxed">
            Fill a blueprint plot with the right blocks. Completing it triggers a real onchain action on Sui testnet.
          </p>
        </div>

        {BUILDINGS.map((b) => (
          <BuildingCard
            key={b.id}
            blueprint={b}
            progress={progress[b.id]}
            walletConnected={walletConnected}
          />
        ))}
      </div>
    </aside>
  );
}

function BuildingCard({
  blueprint,
  progress,
  walletConnected,
}: {
  blueprint: BuildingBlueprint;
  progress: BuildingProgress;
  walletConnected: boolean;
}) {
  const Icon = iconFor(blueprint.action);
  const pct = Math.round((progress.filled / progress.total) * 100);
  const accent = accentFor(blueprint.action);

  return (
    <div className="rounded-xl bg-ink-soft/60 border border-ink-line/80 p-3">
      <div className="flex items-start gap-2.5 mb-2">
        <span
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}22`, color: accent }}
        >
          <Icon size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-fg text-sm leading-tight">{blueprint.label}</div>
          <div className="text-[11px] font-mono text-fg-mute mt-0.5">
            {progress.filled} / {progress.total} blocks · {pct}%
          </div>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-ink-line overflow-hidden mb-2">
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: progress.complete ? accent : `${accent}66`,
          }}
        />
      </div>

      <p className="text-[11px] text-fg-mute leading-relaxed mb-2">{blueprint.blurb}</p>

      <ActivateRow blueprint={blueprint} progress={progress} walletConnected={walletConnected} />
    </div>
  );
}

function ActivateRow({
  blueprint,
  progress,
  walletConnected,
}: {
  blueprint: BuildingBlueprint;
  progress: BuildingProgress;
  walletConnected: boolean;
}) {
  if (!blueprint.enabled) {
    return (
      <div className="text-[11px] font-mono text-fg-mute">Coming soon — v1 post-deadline.</div>
    );
  }

  if (blueprint.action === 'stake') {
    return <BankActivate blueprint={blueprint} progress={progress} walletConnected={walletConnected} />;
  }

  // Swap (Market) — placeholder until Cetus integration lands.
  if (!progress.complete) {
    return (
      <div className="text-[11px] font-mono text-fg-mute">
        Place {progress.total - progress.filled} more block{progress.total - progress.filled === 1 ? '' : 's'} to complete.
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled
      className="text-[11px] font-mono text-fg-mute bg-ink-line/60 px-2.5 py-1.5 rounded-md cursor-not-allowed"
      title="Swap activation arrives with the Cetus integration"
    >
      Activate (swap coming)
    </button>
  );
}

function BankActivate({
  blueprint,
  progress,
  walletConnected,
}: {
  blueprint: BuildingBlueprint;
  progress: BuildingProgress;
  walletConnected: boolean;
}) {
  const { phase, error, txDigest, stakedSuiId, stake, canStake, reset } = useStake();
  const startTransfer = useWorld((s) => s.startTransfer);
  const setScreen = useApp((s) => s.setScreen);

  const handleMove = () => {
    const defiBlocks = useWorld.getState().defiBlocks;
    const cells = captureBuildingCells(blueprint, defiBlocks);
    if (!cells) return; // shouldn't happen — button only shows when complete
    startTransfer({
      blueprintId: blueprint.id,
      sourceAnchor: blueprint.anchor,
      cells,
      stakedSuiId: stakedSuiId ?? undefined,
      txDigest: txDigest ?? undefined,
    });
    setScreen('sandbox');
    reset(); // clear stake state — fresh plot will be empty for the next build
  };

  if (!progress.complete) {
    return (
      <div className="text-[11px] font-mono text-fg-mute">
        Place {progress.total - progress.filled} more block{progress.total - progress.filled === 1 ? '' : 's'} to complete.
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div className="text-[11px] font-mono text-accent-amber flex items-center gap-1.5">
        <AlertCircle size={11} /> Sign in (top-right) to activate.
      </div>
    );
  }

  if (phase === 'success' && txDigest) {
    return (
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-accent-cyan flex items-center gap-1.5">
          <Check size={11} /> Staked 1 SUI on testnet.
        </div>
        {stakedSuiId && (
          <div className="text-[10px] font-mono text-fg-mute truncate" title={stakedSuiId}>
            StakedSui · {short(stakedSuiId)}
          </div>
        )}
        <button
          type="button"
          onClick={handleMove}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-accent-cyan text-ink px-3 py-1.5 rounded-md hover:bg-accent-cyan/90 transition-colors"
        >
          <ArrowRightCircle size={11} /> Move to your town
        </button>
        <a
          href={`https://testnet.suivision.xyz/txblock/${txDigest}`}
          target="_blank"
          rel="noreferrer"
          className="block text-[11px] font-mono text-fg-mute hover:text-fg inline-flex items-center gap-1"
        >
          view tx <ExternalLink size={9} />
        </a>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="space-y-1">
        <div className="text-[11px] font-mono text-accent-magenta flex items-center gap-1.5">
          <AlertCircle size={11} /> {error ?? 'Stake failed'}
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-[10px] font-mono text-fg-mute hover:text-fg"
        >
          retry
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => stake()}
      disabled={!canStake || phase === 'signing'}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-fg text-ink px-3 py-1.5 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-wait transition-colors"
    >
      {phase === 'signing' ? (
        <>
          <Loader2 size={11} className="animate-spin" /> Signing…
        </>
      ) : (
        <>
          <Sparkles size={11} /> Activate · Stake 1 SUI
        </>
      )}
    </button>
  );
}

function DistrictFallback({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-magenta mb-2">
          3D scene unavailable
        </p>
        <h2 className="text-xl font-semibold text-fg mb-2">Your browser blocked WebGL</h2>
        <p className="text-sm text-fg-mute leading-relaxed mb-3">
          The DeFi district needs WebGL2 to render. Try Chrome / Firefox on desktop.
        </p>
        <p className="text-[11px] font-mono text-fg-mute opacity-60">{message}</p>
      </div>
    </div>
  );
}

function iconFor(action: DefiAction) {
  if (action === 'stake') return Landmark;
  if (action === 'swap') return Store;
  return Droplets;
}

function accentFor(action: DefiAction): string {
  if (action === 'stake') return '#FACC15'; // wallet keystone yellow
  if (action === 'swap') return '#F472B6';  // token prism pink
  return '#FFB020';                          // defi vault amber
}

function short(s: string): string {
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}
