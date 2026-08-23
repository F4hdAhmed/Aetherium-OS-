import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from '../icons/Icon';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected Aetherium renderer error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="startup-error">
        <span className="brand-mark brand-mark--hero"><Icon name="aetherium" size={36} /></span>
        <h1>Something interrupted your workspace</h1>
        <p>{this.state.error.message || 'An unexpected renderer error occurred.'}</p>
        <button className="button button--primary" onClick={() => window.location.reload()}>Reload Aetherium</button>
      </div>
    );
  }
}

