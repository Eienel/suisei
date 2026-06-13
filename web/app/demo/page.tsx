import { BlockchainVisualization } from '@/components/BlockchainVisualization';

export const metadata = {
  title: 'Blockchain Visualization Demo',
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-paper p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold text-ink">3D Blockchain Visualization</h1>
        <p className="mb-8 text-muted">
          Rotating cube (blockchain block) with floating particles (transactions).
          Respects reduced-motion preferences.
        </p>

        <div className="mb-8 overflow-hidden rounded-2xl border border-line-strong">
          <BlockchainVisualization />
        </div>

        <div className="space-y-4 rounded-2xl border border-line bg-paper-raised p-6">
          <h2 className="text-lg font-semibold text-ink">What you're seeing:</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <strong className="text-ink">Blue cube:</strong> Represents a blockchain block,
              continuously rotating in 3D space
            </li>
            <li>
              <strong className="text-ink">Floating particles:</strong> 40 light-blue dots
              representing transactions flowing through the network
            </li>
            <li>
              <strong className="text-ink">Wireframe:</strong> Subtle outline showing the
              block's structure
            </li>
            <li>
              <strong className="text-ink">Lighting:</strong> Dynamic point and ambient
              lighting for depth
            </li>
          </ul>

          <h2 className="mt-6 text-lg font-semibold text-ink">Where it could live on Suisei:</h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <strong className="text-ink">Hero section:</strong> Above the fold, 60% width
            </li>
            <li>
              <strong className="text-ink">Between Moat and Tools:</strong> As a visual
              transition
            </li>
            <li>
              <strong className="text-ink">Built section:</strong> Replacing or enhancing
              the CTA card
            </li>
            <li>
              <strong className="text-ink">Background element:</strong> Smaller, transparent,
              behind text
            </li>
          </ul>

          <p className="mt-6 text-xs text-faint">
            Created with Three.js. Uses Sui accent colors (#1746c7, #6aa3ff). Fully
            responsive and respects prefers-reduced-motion.
          </p>
        </div>
      </div>
    </main>
  );
}
