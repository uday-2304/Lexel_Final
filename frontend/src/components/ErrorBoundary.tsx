'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#ffcccc', color: '#990000', height: '100vh', width: '100vw', overflow: 'auto' }}>
          <h2>Application Crashed!</h2>
          <p><strong>Error:</strong> {this.state.error?.toString()}</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Component Stack Trace</summary>
            {this.state.errorInfo?.componentStack}
          </details>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Error Stack</summary>
            {this.state.error?.stack}
          </details>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px' }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
