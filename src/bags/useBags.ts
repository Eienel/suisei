/**
 * Bags / Solana hook stub.
 *
 * Sprint 0: returns nulls so the rest of the UI can branch on it.
 * Sprint 4 wires this up using @solana/wallet-adapter-react and the Bags SDK.
 *
 * See ./README.md for the integration plan.
 */

export interface BagsState {
  wallet: { address: string } | null;
  holdsToken: boolean;
  cosmetics: string[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  mintBadge: () => Promise<{ tx: string } | null>;
}

export function useBags(): BagsState {
  return {
    wallet: null,
    holdsToken: false,
    cosmetics: [],
    connect: async () => {
      // TODO(Sprint 4): open wallet adapter modal
      console.warn('[bags] connect() not yet wired');
    },
    disconnect: async () => {
      // TODO(Sprint 4)
    },
    mintBadge: async () => {
      // TODO(Sprint 4): call Bags SDK mint endpoint
      console.warn('[bags] mintBadge() not yet wired');
      return null;
    },
  };
}
