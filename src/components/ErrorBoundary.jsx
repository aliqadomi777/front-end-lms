import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Optionally log error
    if (this.props.onError) this.props.onError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 text-center text-red-600">
            <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
            <p>Please try refreshing the page or contact support.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
