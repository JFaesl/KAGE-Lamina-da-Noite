import {Component, type ErrorInfo, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class GameErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  state: ErrorBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('KAGE runtime error:', error, info);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-full bg-[#070B14] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl border border-rose-500/40 bg-slate-950/90 p-5 text-center shadow-2xl">
            <h1 className="font-display font-bold text-lg text-rose-300">
              Erro ao iniciar KAGE: Lâmina da Noite
            </h1>
            <p className="mt-2 text-xs font-mono text-slate-300 break-words">
              {this.state.error.message || 'Erro inesperado no navegador.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Recarregar Jogo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <GameErrorBoundary>
    <App />
  </GameErrorBoundary>,
);
