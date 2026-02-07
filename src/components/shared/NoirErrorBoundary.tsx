"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface NoirErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface NoirErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class NoirErrorBoundary extends Component<NoirErrorBoundaryProps, NoirErrorBoundaryState> {
  constructor(props: NoirErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): NoirErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="max-w-md border border-[var(--aesthetic-error)]/60 bg-[var(--aesthetic-error)]/10 rounded-sm p-4">
          <h3 className="text-[var(--aesthetic-error)] font-typewriter font-bold text-sm uppercase tracking-wider mb-2">
            Rendering Error
          </h3>
          <p className="text-[var(--aesthetic-text)]/70 font-mono text-xs mb-3">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-3 py-1.5 text-xs uppercase tracking-widest font-typewriter border border-[var(--aesthetic-accent)]/50 text-[var(--aesthetic-accent)] bg-[var(--aesthetic-accent)]/10 rounded-sm hover:bg-[var(--aesthetic-accent)]/20 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
