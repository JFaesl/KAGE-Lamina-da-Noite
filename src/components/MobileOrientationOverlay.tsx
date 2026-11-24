import { Maximize2, RotateCw } from 'lucide-react';

interface MobileOrientationOverlayProps {
  onRequestLandscapeFullscreen: () => void;
  onEnableForcedLandscape: () => void;
}

export function MobileOrientationOverlay({
  onRequestLandscapeFullscreen,
  onEnableForcedLandscape,
}: MobileOrientationOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060912]/96 backdrop-blur-lg px-6 py-8 text-center text-slate-50">
      <div className="max-w-xs w-full flex flex-col items-center">
        {/* Animated Rotating Smartphone Graphic */}
        <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-600/15 blur-xl" aria-hidden="true" />
          <svg
            viewBox="0 0 80 80"
            className="w-20 h-20 animate-rotate-landscape drop-shadow-[0_0_16px_rgba(225,29,72,0.4)]"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="22"
              y="10"
              width="36"
              height="60"
              rx="6"
              fill="#0F172A"
              stroke="#FB7185"
              strokeWidth="2.5"
            />
            <rect x="26" y="16" width="28" height="44" rx="2" fill="#1E293B" />
            <circle cx="40" cy="65" r="2.2" fill="#FDE047" />
            <path d="M33 38L47 38M42 33L47 38L42 43" stroke="#38BDF8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 className="font-display font-extrabold text-xl tracking-wide text-white mb-2">
          Gire o celular para a horizontal
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          KAGE: Lâmina da Noite roda em tela horizontal (paisagem) com controles de toque completos para katana, esquiva, pulo e ninjutsu.
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            onClick={onRequestLandscapeFullscreen}
            className="min-h-[48px] w-full px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 active:scale-[0.98] border border-rose-300/45 text-white font-display font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(225,29,72,0.38)] cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 shrink-0" />
            <span>Ativar Tela Cheia Horizontal</span>
          </button>

          <button
            type="button"
            onClick={onEnableForcedLandscape}
            className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-slate-900/90 active:scale-[0.98] border border-white/15 text-slate-200 font-display font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-4 h-4 shrink-0 text-amber-300" />
            <span>Forçar Modo Horizontal na Tela</span>
          </button>
        </div>
      </div>
    </div>
  );
}
