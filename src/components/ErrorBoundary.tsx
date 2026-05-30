import { Component, type ReactNode } from 'react';

interface Props {
  fallback?: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // eslint-disable-next-line no-console
    console.error('[BlockBuilders] runtime error', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="fixed inset-0 z-50 bg-night text-cream flex items-center justify-center p-6 font-sans">
          <div className="card-night p-6 max-w-md w-full">
            <p className="eyebrow text-terracotta mb-2">Something broke</p>
            <h2 className="font-display text-xl font-semibold mb-3 text-cream">
              Suisei couldn't mount
            </h2>
            <p className="text-sm text-cream-dim mb-4 leading-relaxed">
              A runtime error stopped the boot. If you're on a very old browser,
              try a recent Chrome / Firefox / Safari.
            </p>
            <pre className="text-[11px] font-mono text-cream-dim bg-night-deep/60 border border-night-line rounded-card p-3 overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={this.reset}
              className="btn-primary mt-4"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
