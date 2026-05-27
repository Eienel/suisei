import { Landmark } from 'lucide-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useTownStake, formatSui } from '@/sui/useTownStake';

/**
 * Small HUD pill showing the live onchain value backing the player's town —
 * the sum of all `StakedSui` principal in their wallet. Every Bank they
 * move from the DeFi district is one of those positions. The "your town
 * has value" emotional hook the user asked for.
 */
export function TownValueBadge() {
  const account = useCurrentAccount();
  const { data, isLoading } = useTownStake();

  if (!account?.address) return null;
  if (isLoading || !data) {
    return (
      <Pill>
        <Landmark size={12} className="text-fg-mute" />
        <span className="font-mono text-[11px] text-fg-mute">town value…</span>
      </Pill>
    );
  }
  if (data.count === 0) {
    return (
      <Pill>
        <Landmark size={12} className="text-fg-mute" />
        <span className="font-mono text-[11px] text-fg-mute">build a Bank to grow your town</span>
      </Pill>
    );
  }
  return (
    <Pill highlight>
      <Landmark size={12} className="text-accent-amber" />
      <span className="font-mono text-[11px] text-fg-dim">town value</span>
      <span className="font-mono text-[11px] font-semibold text-fg">
        {formatSui(data.totalMist)}
      </span>
      <span className="font-mono text-[10px] text-fg-mute">
        · {data.count} bank{data.count === 1 ? '' : 's'}
      </span>
    </Pill>
  );
}

function Pill({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div
      className={`glass rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 ${
        highlight ? 'shadow-glow-soft' : ''
      }`}
    >
      {children}
    </div>
  );
}
