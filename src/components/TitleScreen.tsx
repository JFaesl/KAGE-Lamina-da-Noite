import { useEffect, useState } from 'react';
import { Maximize2, Minimize2, Trophy, Volume2, VolumeX } from 'lucide-react';
import { DIFFICULTIES, Difficulty, NINJUTSU_LIST, NinjutsuType, STAGES, StageId } from '../game/types';
import BACKDROP_URL from '../assets/images/title_ninja_backdrop_1795024279641.jpg';

interface TitleScreenProps {
  selectedStage: StageId;
  selectedNinjutsu: NinjutsuType;
  difficulty: Difficulty;
  bestScore: number;
  muted: boolean;
  isFullscreen?: boolean;
  isTouchDevice?: boolean;
  unlockedAchievements: number;
  totalAchievements: number;
  achievementsModalOpen: boolean;
  onSelectStage: (stage: StageId) => void;
  onSelectNinjutsu: (kind: NinjutsuType) => void;
  onSelectDifficulty: (diff: Difficulty) => void;
  onToggleMute: () => void;
  onToggleFullscreen?: () => void;
  onOpenAchievements: () => void;
  onStart: () => void;
}

export function TitleScreen({
  selectedStage,
  selectedNinjutsu,
  difficulty,
  bestScore,
  muted,
  isFullscreen = false,
  isTouchDevice = false,
  unlockedAchievements,
  totalAchievements,
  achievementsModalOpen,
  onSelectStage,
  onSelectNinjutsu,
  onSelectDifficulty,
  onToggleMute,
  onToggleFullscreen,
  onOpenAchievements,
  onStart,
}: TitleScreenProps) {
  const [imgError, setImgError] = useState(false);
  const activeDiff = DIFFICULTIES[difficulty];
  const selectedMeta = STAGES.find((s) => s.id === selectedStage) ?? STAGES[0];
  const selectedJutsu = NINJUTSU_LIST.find((n) => n.id === selectedMeta.requiredJutsu) ?? NINJUTSU_LIST[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (achievementsModalOpen) return;
      if (e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStart, achievementsModalOpen]);

  return (
    <div className="relative w-full h-full overflow-y-auto overflow-x-hidden bg-[#070B14] text-slate-50">
      {!imgError ? (
        <img
          src={BACKDROP_URL}
          alt="Shinobi sob a lua carmesim em cenário noturno"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="fixed inset-0 w-full h-full object-cover object-center scale-[1.02] pointer-events-none"
        />
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-[radial-gradient(circle_at_76%_28%,rgba(225,29,72,0.34),transparent_42%),linear-gradient(125deg,#070B14_0%,#111827_55%,#1E1B2E_100%)] pointer-events-none"
        />
      )}

      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-r from-[#060912]/96 via-[#060912]/76 to-[#060912]/15 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-gradient-to-t from-[#060912]/92 via-transparent to-[#060912]/45 pointer-events-none"
      />

      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenAchievements}
          className="min-h-[42px] px-3 sm:px-4 flex items-center gap-2 rounded-lg bg-slate-950/75 backdrop-blur-md border border-white/12 text-amber-300 hover:text-amber-200 hover:border-amber-400/50 transition-all cursor-pointer shadow-lg"
        >
          <Trophy className="w-4 h-4 shrink-0" />
          <span className="font-display font-semibold text-xs whitespace-nowrap">
            Conquistas ({unlockedAchievements}/{totalAchievements}) · Bestiário
          </span>
        </button>
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia horizontal'}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia horizontal'}
            className="min-w-[42px] min-h-[42px] px-2.5 flex items-center justify-center rounded-lg bg-slate-950/75 backdrop-blur-md border border-white/12 text-slate-200 hover:text-white hover:border-white/30 transition-all cursor-pointer shadow-lg"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Ativar som' : 'Silenciar som'}
          className="min-w-[42px] min-h-[42px] px-2.5 flex items-center justify-center rounded-lg bg-slate-950/75 backdrop-blur-md border border-white/12 text-slate-200 hover:text-white hover:border-white/30 transition-all cursor-pointer shadow-lg"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative z-10 min-h-full max-w-[1440px] mx-auto px-5 sm:px-8 md:px-14 py-4 sm:py-7 [@media(max-height:520px)]:py-3 flex flex-col justify-between gap-3">
        <div className="my-auto max-w-xl pt-10 sm:pt-0 [@media(max-height:520px)]:pt-0">
          <div className="mb-4 flex items-center gap-4">
            <svg
              viewBox="0 0 96 96"
              className="w-16 h-16 md:w-20 md:h-20 shrink-0 drop-shadow-[0_0_24px_rgba(225,29,72,0.55)]"
              role="img"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="kageMoonGrad" cx="40%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#FDA4AF" />
                  <stop offset="45%" stopColor="#E11D48" />
                  <stop offset="100%" stopColor="#881337" />
                </radialGradient>
                <linearGradient id="kageBladeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94A3B8" />
                  <stop offset="55%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
              </defs>
              <circle cx="48" cy="48" r="34" fill="url(#kageMoonGrad)" />
              <circle cx="59" cy="43" r="24" fill="#070B14" opacity="0.92" />
              <path
                d="M14 78 L78 16 L83 20 L20 82 Z"
                fill="url(#kageBladeGrad)"
              />
              <rect
                x="23"
                y="63"
                width="13"
                height="4.5"
                rx="1.5"
                transform="rotate(-44 23 63)"
                fill="#F59E0B"
              />
            </svg>

            <div>
              <h1 className="font-display font-extrabold text-5xl md:text-6xl tracking-[0.08em] text-white leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
                KAGE
              </h1>
              <p className="font-display font-semibold text-xs md:text-sm tracking-[0.28em] text-rose-400 uppercase mt-1.5">
                Lâmina da Noite
              </p>
            </div>
          </div>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-md mb-4">
            Domine a katana, shurikens, o salto duplo Hassō-tobi e 6 artes Ninjutsu (incluindo Clones Bunshin e Visão Noturna) em 10 fases desafiadoras.
          </p>

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span>Selecionar Fase (10 Cenários)</span>
              <span className="text-amber-300/95 font-mono-tabular">
                Jutsu Chave: {selectedJutsu.name} ({selectedJutsu.key})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[214px] overflow-y-auto pr-1">
              {STAGES.map((st) => {
                const active = st.id === selectedStage;
                const reqArt = NINJUTSU_LIST.find((n) => n.id === st.requiredJutsu) ?? NINJUTSU_LIST[0];
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStage(st.id)}
                    className={`text-left px-3 py-2.5 rounded-lg border backdrop-blur-md transition-all cursor-pointer ${
                      active
                        ? 'bg-rose-950/55 border-rose-400/80 text-white shadow-[0_0_20px_rgba(225,29,72,0.2)]'
                        : 'bg-slate-950/70 border-white/10 text-slate-300 hover:border-white/25 hover:bg-slate-900/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xs font-bold truncate">
                        {st.title}
                      </span>
                      <span
                        className="shrink-0 text-[10px] font-mono-tabular font-semibold"
                        style={{ color: reqArt.color }}
                      >
                        {reqArt.key} · {reqArt.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400 truncate">
                        {st.subtitle}
                      </span>
                      {st.denseFog && (
                        <span className="shrink-0 text-[10px] font-mono-tabular font-semibold text-teal-300">
                          Neblina
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-300 mt-2">
              <span className="font-semibold" style={{ color: selectedJutsu.color }}>
                {selectedJutsu.name}:
              </span>{' '}
              {selectedMeta.requiredJutsuReason}
            </p>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
              <span>Ninjutsu Selecionada</span>
              <span className="text-[11px] text-slate-400">Dicas táticas no carregamento</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {NINJUTSU_LIST.map((art) => {
                const active = art.id === selectedNinjutsu;
                const recommended = art.id === selectedMeta.requiredJutsu;
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => onSelectNinjutsu(art.id)}
                    title={`${art.name}: ${art.subtitle}`}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] font-display font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      active
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-950/70 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                    style={
                      active
                        ? { borderColor: art.color, boxShadow: `0 0 12px ${art.color}40` }
                        : undefined
                    }
                  >
                    <span className="font-mono-tabular text-[10px]" style={{ color: art.color }}>
                      {art.key}
                    </span>
                    <span>{art.name}</span>
                    {recommended && (
                      <span className="text-[9px] font-mono-tabular text-amber-300">★</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-xs font-medium text-slate-400 mb-2">Modo de Jogo</div>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-lg">
              {(['easy', 'normal', 'hard'] as Difficulty[]).map((diffKey) => {
                const cfg = DIFFICULTIES[diffKey];
                const active = difficulty === diffKey;
                return (
                  <button
                    key={diffKey}
                    type="button"
                    onClick={() => onSelectDifficulty(diffKey)}
                    className={`min-h-[38px] px-4 py-1.5 text-xs font-display font-bold rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? diffKey === 'hard'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : diffKey === 'easy'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{activeDiff.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={onStart}
              className="min-h-[48px] px-8 py-3 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:translate-y-0.5 border border-rose-300/40 text-white font-display font-bold text-sm tracking-wide transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_8px_28px_rgba(225,29,72,0.42)]"
            >
              Iniciar Jogo
            </button>

            {bestScore > 0 && (
              <div className="text-sm text-slate-300 font-mono-tabular">
                <span className="text-slate-400">Recorde</span>
                <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
                <span className="text-amber-400 font-bold">{bestScore.toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Single flat control-hint line */}
        <p className="text-xs text-slate-400 tracking-wide">
          {isTouchDevice
            ? 'Mobile Horizontal: Analógico Esquerdo Mover · Botões Katana, Kunai, Pular (2×), Esquiva, Jutsu & Fúria da Lua'
            : 'WASD Mover · J Katana · K Shuriken · Espaço×2 Hassō-tobi (+K Leque Aéreo) · Shift Esquivar · 1-6 / E Ninjutsu · F Fúria da Lua · Esc Pausar'}
        </p>
      </div>
    </div>
  );
}
