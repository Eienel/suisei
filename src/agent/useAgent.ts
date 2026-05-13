import { create } from 'zustand';
import { useWorld } from '@/state/world';
import { AgentResponseSchema, type AgentResponse } from './schema';
import { applyActions } from './applyActions';

export type AgentPhase = 'idle' | 'thinking' | 'building' | 'error';

interface AgentState {
  phase: AgentPhase;
  narration: string | null;
  error: string | null;
  /** Total actions in the current run (for progress bar). */
  totalActions: number;
  /** Actions applied so far in the current run. */
  appliedActions: number;
  abortController: AbortController | null;

  submit: (prompt: string) => Promise<void>;
  cancel: () => void;
  clearError: () => void;
}

/**
 * Global agent state — shared between PromptBar (writes) and
 * NarrationOverlay / progress views (reads).
 */
export const useAgent = create<AgentState>((set, get) => ({
  phase: 'idle',
  narration: null,
  error: null,
  totalActions: 0,
  appliedActions: 0,
  abortController: null,

  cancel: () => {
    get().abortController?.abort();
  },

  clearError: () => set({ error: null }),

  submit: async (prompt) => {
    if (!prompt.trim()) return;

    get().abortController?.abort();
    const controller = new AbortController();

    set({
      abortController: controller,
      phase: 'thinking',
      narration: null,
      error: null,
      totalActions: 0,
      appliedActions: 0,
    });

    const world = useWorld.getState().blocks;
    let result: AgentResponse;
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, world }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errBody?.error ?? `Agent error ${res.status}`);
      }
      const parsed = AgentResponseSchema.safeParse(await res.json());
      if (!parsed.success) {
        throw new Error(`Bad agent response: ${parsed.error.issues[0]?.message}`);
      }
      result = parsed.data;
    } catch (err) {
      if (controller.signal.aborted) {
        set({ phase: 'idle' });
        return;
      }
      set({
        phase: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    set({
      phase: 'building',
      narration: result.narration,
      totalActions: result.actions.length,
      appliedActions: 0,
    });

    try {
      for (let i = 0; i < result.actions.length; i++) {
        await applyActions([result.actions[i]], controller.signal);
        set({ appliedActions: i + 1 });
      }
      set({ phase: 'idle' });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        set({ phase: 'idle' });
        return;
      }
      set({
        phase: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
}));
