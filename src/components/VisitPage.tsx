import { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SuiClient } from '@mysten/sui/client';
import { SUI_RPC_URL, WORLD_TYPE, WALRUS_AGGREGATOR } from '@/sui/config';
import type { Block as BlockData } from '@/types';
import { Block } from './Block';
import { ErrorBoundary } from './ErrorBoundary';
import { ArrowLeft, Copy, Check, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  address: string;
}

interface LoadState {
  phase: 'loading' | 'ready' | 'empty' | 'error';
  blocks: BlockData[];
  worldName: string | null;
  version: number;
  blockCount: number;
  txDigest: string | null;
  error: string | null;
}

const isMobile =
  typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

/**
 * Read-only viewer for someone else's town. Looks up their latest
 * World NFT on Sui, pulls the metadata blob from Walrus, renders the
 * blocks in an auto-orbiting canvas.
 *
 * Public — no auth required.
 */
export function VisitPage({ address }: Props) {
  const [state, setState] = useState<LoadState>({
    phase: 'loading',
    blocks: [],
    worldName: null,
    version: 0,
    blockCount: 0,
    txDigest: null,
    error: null,
  });
  const [copied, setCopied] = useState(false);

  const shortAddr = useMemo(
    () => `${address.slice(0, 6)}…${address.slice(-4)}`,
    [address]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!WORLD_TYPE) throw new Error('Move package not configured');

        const client = new SuiClient({ url: SUI_RPC_URL });
        const objects = await client.getOwnedObjects({
          owner: address,
          filter: { StructType: WORLD_TYPE },
          options: { showContent: true },
          limit: 25,
        });

        if (cancelled) return;
        if (!objects.data.length) {
          setState((s) => ({ ...s, phase: 'empty' }));
          return;
        }

        // Pick the World with the highest version
        let best: { metadata_uri: string; name: string; version: number; block_count: number } | null = null;
        for (const obj of objects.data) {
          const content = obj.data?.content;
          if (!content || content.dataType !== 'moveObject') continue;
          const fields = (content as { fields: Record<string, unknown> }).fields;
          const v = Number(fields.version ?? 0);
          if (!best || v > best.version) {
            best = {
              name: String(fields.name ?? ''),
              metadata_uri: String(fields.metadata_uri ?? ''),
              version: v,
              block_count: Number(fields.block_count ?? 0),
            };
          }
        }

        if (!best) {
          setState((s) => ({ ...s, phase: 'empty' }));
          return;
        }

        // Parse walrus://blobId
        const m = best.metadata_uri.match(/^walrus:\/\/(.+)$/);
        if (!m) {
          throw new Error(`Unsupported metadata URI: ${best.metadata_uri}`);
        }
        const blobId = m[1];
        const res = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);
        if (!res.ok) throw new Error(`Walrus ${res.status}`);
        const payload = (await res.json()) as { blocks?: BlockData[] };
        if (!Array.isArray(payload.blocks)) throw new Error('Bad world payload');

        if (cancelled) return;
        setState({
          phase: 'ready',
          blocks: payload.blocks,
          worldName: best.name || 'Untitled town',
          version: best.version,
          blockCount: best.block_count,
          txDigest: null,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          phase: 'error',
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const goHome = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard might be blocked; ignore */
    }
  };

  return (
    <div className="fixed inset-0 bg-ink">
      {/* HUD top */}
      <header className="absolute top-0 inset-x-0 z-20 px-4 sm:px-6 py-3 flex items-center gap-3 pointer-events-none">
        <button
          type="button"
          onClick={goHome}
          className="btn-ghost text-sm flex items-center gap-1.5 pointer-events-auto"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex-1" />
        <div className="pointer-events-auto rounded-xl border border-ink-line bg-ink-soft/80 backdrop-blur px-3 py-1.5 text-xs font-mono text-fg-dim">
          {shortAddr}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="pointer-events-auto rounded-xl border border-ink-line bg-ink-soft/80 backdrop-blur px-3 py-1.5 text-xs font-mono text-fg-mute hover:text-fg flex items-center gap-1.5"
        >
          {copied ? <Check size={12} className="text-accent-cyan" /> : <Copy size={12} />}
          {copied ? 'copied' : 'share'}
        </button>
      </header>

      {/* 3D viewer */}
      <ErrorBoundary>
        <Canvas
          shadows={!isMobile}
          gl={{
            antialias: !isMobile,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
          }}
          camera={{ position: [14, 11, 14], fov: 42, near: 0.1, far: 200 }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
        >
          <color attach="background" args={['#070A14']} />
          <fog attach="fog" args={['#070A14', 30, 90]} />

          {!isMobile && <SoftShadows size={28} samples={10} focus={0.7} />}

          <ambientLight intensity={0.35} />
          <hemisphereLight args={['#5B83FF', '#0A0E1A', 0.55]} />
          <directionalLight
            position={[12, 18, 8]}
            intensity={1.2}
            castShadow={!isMobile}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
          />
          <directionalLight position={[-10, 6, -8]} intensity={0.45} color="#5B83FF" />

          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
            <planeGeometry args={[120, 120]} />
            <meshStandardMaterial color="#0F1422" roughness={0.95} metalness={0.05} />
          </mesh>
          <gridHelper args={[64, 64, '#1F2638', '#161B2A']} position={[0, -0.499, 0]} />

          {state.phase === 'ready' &&
            state.blocks.map((b) => (
              <Block key={b.id} block={b} selected={false} onSelect={() => {}} />
            ))}

          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            autoRotate
            autoRotateSpeed={0.6}
            minDistance={6}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2 - 0.05}
            target={[0, 1, 0]}
          />
        </Canvas>
      </ErrorBoundary>

      {/* Bottom badge */}
      <footer className="absolute bottom-4 inset-x-0 z-20 px-4 flex justify-center pointer-events-none">
        {state.phase === 'loading' && (
          <div className="pointer-events-auto rounded-full bg-ink-soft/80 backdrop-blur border border-ink-line px-4 py-2 text-sm text-fg-dim flex items-center gap-2 font-mono">
            <Loader2 size={14} className="animate-spin" />
            looking up town on sui…
          </div>
        )}
        {state.phase === 'empty' && (
          <div className="pointer-events-auto rounded-full bg-ink-soft/80 backdrop-blur border border-ink-line px-4 py-2 text-sm text-fg-mute font-mono">
            no town here yet · {shortAddr} hasn't saved one
          </div>
        )}
        {state.phase === 'error' && (
          <div className="pointer-events-auto rounded-xl bg-accent-magenta/15 border border-accent-magenta/40 px-4 py-2 text-sm text-accent-magenta flex items-center gap-2 font-mono">
            <AlertCircle size={14} />
            {state.error}
          </div>
        )}
        {state.phase === 'ready' && (
          <div className="pointer-events-auto rounded-xl bg-ink-soft/80 backdrop-blur border border-ink-line px-4 py-2 text-sm text-fg-dim font-mono flex items-center gap-3">
            <span className="text-fg">{state.worldName}</span>
            <span className="text-fg-mute">·</span>
            <span>{state.blockCount} blocks</span>
            <span className="text-fg-mute">·</span>
            <span>v{state.version}</span>
          </div>
        )}
      </footer>
    </div>
  );
}
