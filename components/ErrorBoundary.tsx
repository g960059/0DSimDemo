import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode, fallback?: React.ReactNode}, {hasError: boolean, error?: Error}> {
    constructor(props: {children: React.ReactNode, fallback?: React.ReactNode}) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-900 text-white rounded">
                    <h2 className="text-xl font-bold">Something went wrong.</h2>
                    <pre className="text-xs mt-2 overflow-auto">{this.state.error?.toString()}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}
