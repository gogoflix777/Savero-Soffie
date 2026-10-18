import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Heart, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 p-3 shadow-lg shadow-rose-200/50 dark:bg-rose-950/50 dark:shadow-rose-950/50">
            <Heart className="h-8 w-8 text-rose-500 animate-pulse" />
          </div>
          <h2 className="mt-4 font-serif-title text-xl font-bold text-[#501522] dark:text-rose-100">
            Ada Sedikit Kendala Tampilan
          </h2>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#8a4f5c] dark:text-rose-300">
            Tenang, data perjalanan cinta kalian tetap aman tersimpan. Coba pulihkan atau muat ulang halaman ini.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-2xl border border-rose-300/80 bg-white px-4 py-2 text-xs font-bold text-[#8c2840] shadow-sm hover:bg-rose-50 active:scale-95 dark:border-rose-800 dark:bg-black/30 dark:text-rose-200"
            >
              Coba Pulihkan
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-95"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
