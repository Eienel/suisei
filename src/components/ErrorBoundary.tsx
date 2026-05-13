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
        <div className="fixed inset-0 z-50 bg-ink text-fg flex items-center justify-center p-6 font-sans">
          <div className="glass rounded-2xl p-6 max-w-md w-full shadow-glass">
            <p className="font-mono text-xs uppercase tracking-widest text-accent-magenta mb-2">
              Something broke
            </p>
            <h2 className="text-xl font-semibold mb-3">BlockBuilders couldn't mount</h2>
            <p className="text-sm text-fg-mute mb-4 leading-relaxed">
              We hit a runtime error. If you're on iOS Safari or an older device,
              try Chrome/Firefox desktop — the 3D scene needs WebGL2.
            </p>
            <pre className="text-[11px] font-mono text-fg-dim bg-ink-soft/60 border border-ink-line rounded-md p-3 overflow-auto max-h-40">
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
