import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col items-center justify-center p-6 text-center selection:bg-[#006194]/20">
          <div className="w-16 h-16 rounded-2xl bg-[#fee2e2] text-[#ef4444] flex items-center justify-center mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-xs text-[#64748b] max-w-sm mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred in TravelMate.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-xl bg-[#006194] text-white text-xs font-bold shadow-sm hover:bg-[#007bb9] active:scale-95 transition-all"
              type="button"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#f1f5f9] text-[#475569] text-xs font-bold hover:bg-[#e2e8f0] active:scale-95 transition-all"
              type="button"
            >
              Reset Cache &amp; Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
