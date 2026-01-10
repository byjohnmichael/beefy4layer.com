import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="bg-gray-800 rounded-xl p-8 max-w-lg text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong!</h2>
            <p className="text-gray-300 mb-4">
              The game encountered an error. Please try resetting.
            </p>
            <pre className="text-left text-xs text-red-300 bg-black/50 p-4 rounded mb-4 overflow-auto max-h-40">
              {this.state.error?.message}
              {this.state.errorInfo?.componentStack}
            </pre>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
            >
              Reset Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

