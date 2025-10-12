"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

import { clientConfig } from "@/config/client";
import { recordClientException } from "@/lib/observability";

type ClientErrorBoundaryProps = {
  children: ReactNode;
};

type ClientErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class ClientErrorBoundary extends Component<ClientErrorBoundaryProps, ClientErrorBoundaryState> {
  state: ClientErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ClientErrorBoundaryState {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    await recordClientException(
      error,
      { componentStack: errorInfo.componentStack ?? undefined },
      clientConfig.telemetryEndpoint,
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto mt-12 max-w-lg rounded-3xl border border-white/10 bg-black/40 p-8 text-center text-white shadow-lg">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-white/70">
            Our team has been notified. Please refresh to continue enjoying the Rayon Sports experience.
          </p>
          <button
            type="button"
            className="btn-primary mt-6 w-full"
            onClick={this.handleRetry}
            aria-label="Reload the application"
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ClientErrorBoundary;
