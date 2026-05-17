import { create } from 'zustand';
import { useWorld } from '@/state/world';
import { sfx } from '@/audio/sfx';
import { AgentResponseSchema, type AgentResponse } from './schema.js';
import { applyActions } from './applyActions.js';
import type { ChatTurn } from './runAgent.js';

export type AgentPhase = 'idle' | 'thinking' | 'building' | 'clarify' | 'error';

export interface AttachedImage {
  /** Object URL for preview (revoke on detach). */
  previewUrl: string;
  /** Base64 (no data: prefix) for the API payload. */
  base64: string;
  mimeType: string;
  name: string;
}

interface AgentState {
  phase: AgentPhase;
  narration: string | null;
  error: string | null;
  totalActions: number;
  appliedActions: number;
  abortController: AbortController | null;

  /** Conversational history — oldest → newest, max 6 turns. */
  history: ChatTurn[];
  /** When phase==='clarify' this holds the latest question + suggestions. */
  clarify: { question: string; suggestions: string[] } | null;
  /** Pending image attachment (next submit consumes it). */
  attachedImage: AttachedImage | null;

  submit: (prompt: string) => Promise<void>;
  cancel: () => void;
  clearError: () => void;
  resetConversation: () => void;
  attachImage: (img: AttachedImage) => void;
  detachImage: () => void;
}

const HISTORY_LIMIT = 6;

export const useAgent = create<AgentState>((set, get) => ({
  phase: 'idle',
  narration: null,
  error: null,
  totalActions: 0,
  appliedActions: 0,
  abortController: null,
  history: [],
  clarify: null,
  attachedImage: null,

  cancel: () => {
    get().abortController?.abort();
  },

  clearError: () => set({ error: null }),

  resetConversation: () => {
    const cur = get().attachedImage;
    if (cur) URL.revokeObjectURL(cur.previewUrl);
    set({
      history: [],
      clarify: null,
      narration: null,
      error: null,
      attachedImage: null,
      phase: 'idle',
    });
  },

  attachImage: (img) => {
    const cur = get().attachedImage;
    if (cur) URL.revokeObjectURL(cur.previewUrl);
    set({ attachedImage: img });
  },

  detachImage: () => {
    const cur = get().attachedImage;
    if (cur) URL.revokeObjectURL(cur.previewUrl);
    set({ attachedImage: null });
  },

  submit: async (prompt) => {
    const image = get().attachedImage;
    const hasText = !!prompt.trim();
    if (!hasText && !image) return;

    get().abortController?.abort();
    const controller = new AbortController();

    set({
      abortController: controller,
      phase: 'thinking',
      narration: null,
      error: null,
      totalActions: 0,
      appliedActions: 0,
      clarify: null,
    });

    const history = get().history;
    const world = useWorld.getState().blocks;
    let result: AgentResponse;
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt,
          world,
          image: image ? { base64: image.base64, mimeType: image.mimeType } : undefined,
          history: history.length > 0 ? history : undefined,
        }),
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

    // Append the user turn (image attachments are consumed here)
    const userText = hasText ? prompt : '[reference image attached]';
    const nextHistory = trimHistory([
      ...history,
      { role: 'user', text: userText },
    ]);

    // Image is one-shot — drop it after sending so it doesn't repeat
    if (image) {
      URL.revokeObjectURL(image.previewUrl);
    }

    // Clarify branch: model wants more info before building
    if (
      result.actions.length === 0 &&
      result.clarifyingQuestion &&
      result.clarifyingQuestion.trim()
    ) {
      set({
        phase: 'clarify',
        narration: result.narration,
        clarify: {
          question: result.clarifyingQuestion,
          suggestions: result.suggestions ?? [],
        },
        history: trimHistory([
          ...nextHistory,
          { role: 'assistant', text: result.clarifyingQuestion },
        ]),
        attachedImage: null,
      });
      return;
    }

    set({
      phase: 'building',
      narration: result.narration,
      totalActions: result.actions.length,
      appliedActions: 0,
      history: trimHistory([
        ...nextHistory,
        { role: 'assistant', text: result.narration },
      ]),
      attachedImage: null,
    });

    try {
      for (let i = 0; i < result.actions.length; i++) {
        await applyActions([result.actions[i]], controller.signal);
        set({ appliedActions: i + 1 });
      }
      sfx.chime();
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

function trimHistory(turns: ChatTurn[]): ChatTurn[] {
  if (turns.length <= HISTORY_LIMIT) return turns;
  return turns.slice(turns.length - HISTORY_LIMIT);
}
