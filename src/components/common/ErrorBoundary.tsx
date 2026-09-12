import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="ads-card"
          role="alert"
          style={{
            padding: "var(--ads-s8)",
            borderColor: "rgba(215, 0, 21, 0.34)",
            margin: "var(--ads-s4) 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "var(--ads-s4)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "var(--ads-red-tint)",
              color: "var(--ads-red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.014em", color: "var(--ads-ink)", margin: 0 }}>
              {this.props.fallbackTitle || "Something went wrong in this section"}
            </h3>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.5, color: "var(--ads-ink-secondary)", margin: "0.35rem 0 0 0", maxWidth: "480px" }}>
              {this.state.error?.message || "An unexpected rendering error occurred. Please try reloading."}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="ads-btn ads-btn--primary"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
