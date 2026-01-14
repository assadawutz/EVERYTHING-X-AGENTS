import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props!: Readonly<ErrorBoundaryProps>;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 max-w-md w-full">
             <h2 className="text-xl font-bold text-red-600 mb-4">Application Error</h2>
             <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg overflow-auto text-left mb-6">
               {this.state.error?.message}
             </pre>
             <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
               Reload Application
             </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>
);