import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    void error;
    void errorInfo;
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-bold text-red-900">Erreur</h1>
            </div>
            <p className="text-red-700 mb-4">
              Une erreur inattendue s'est produite.
            </p>
            <details className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded">
              <summary className="cursor-pointer font-medium">Détails</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
