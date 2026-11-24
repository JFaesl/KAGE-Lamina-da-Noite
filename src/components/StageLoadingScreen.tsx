import { useEffect, useRef, useState } from 'react';
import { ChevronRight, RefreshCw, ShieldAlert, Sparkles, Swords } from 'lucide-react';
import { getTipsForNinjutsu, STAGE_HAZARD_BRIEFS } from '../game/combatTips';
import { DIFFICULTIES, Difficulty, NINJUTSU_LIST, NinjutsuType, STAGES, StageId } from '../game/types';

interface StageLoadingScreenProps {
  stageId: StageId;
  difficulty: Difficulty;
  selectedNinjutsu: NinjutsuType;
  isTouchDevice?: boolean;
  onSelectNinjutsu: (kind: NinjutsuType) => void;
  onComplete: () => void;
}

const LOAD_DURATION_MS = 2800;

export function StageLoadingScreen({
  stageId,
  difficulty,
  selectedNinjutsu,
  isTouchDevice = false,
  onSelectNinjutsu,
  onComplete,
}: StageLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [holdOpen, setHoldOpen] = useState(false);
  const holdOpenRef = useRef(false);
  holdOpenRef.current = holdOpen;

  const stageMeta = STAGES.find((s) => s.id === stageId) ?? STAGES[0];
  const diffMeta = DIFFICULTIES[difficulty];
  const activeArt = NINJUTSU_LIST.find((n) => n.id === selectedNinjutsu) ?? NINJUTSU_LIST[0];
  const requiredArt = NINJUTSU_LIST.find((n) => n.id === stageMeta.requiredJutsu) ?? NINJUTSU_LIST[0];
  const tips = getTipsForNinjutsu(selectedNinjutsu);
  const tip = tips[tipIndex % tips.length];
  const hazardBrief = STAGE_HAZARD_BRIEFS[stageId];
  const comboSteps = isTouchDevice ? tip.mobileSequence : tip.desktopSequence;

  useEffect(() => {
    setTipIndex(0);
  }, [selectedNinjutsu]);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / LOAD_DURATION_MS) * 100);
      setProgress(pct);
      if (pct < 100) {
        rafId = requestAnimationFrame(tick);
      } else if (!holdOpenRef.current) {
        onComplete();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onComplete();
      } else if (e.code === 'Digit1') {
        setHoldOpen(true);
        onSelectNinjutsu('ikazuchi');
      } else if (e.code === 'Digit2') {
        setHoldOpen(true);
        onSelectNinjutsu('karyu');
      } else if (e.code === 'Digit3') {
        setHoldOpen(true);
        onSelectNinjutsu('fushin');
      } else if (e.code === 'Digit4') {
        setHoldOpen(true);
        onSelectNinjutsu('mijin');
      } else if (e.code === 'Digit5') {
        setHoldOpen(true);
        onSelectNinjutsu('bunshin');
      } else if (e.code === 'Digit6') {
        setHoldOpen(true);
        onSelectNinjutsu('yagan');
      } else if (e.code === 'Tab') {
        e.preventDefault();
        setHoldOpen(true);
        setTipIndex((prev) => (prev + 1) % tips.length);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onComplete, onSelectNinjutsu, tips.length]);

  const handleCycleTip = () => {
    setHoldOpen(true);
    setTipIndex((prev) => (prev + 1) % tips.length);
  };

  const handleChooseNinjutsu = (kind: NinjutsuType) => {
    setHoldOpen(true);
    onSelectNinjutsu(kind);
  };

  return (
    <div
      className="absolute inset-0 z-40 overflow-hidden bg-[#060912]/90 backdrop-blur-md text-slate-50 select-none"
      role="status"
      aria-live="polite"
    >
      {/* Atmospheric Accent Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 48%, ${stageMeta.accentHex}24 0%, rgba(6, 9, 18, 0.72) 52%, rgba(4, 6, 12, 0.94) 100%)`,
        }}
      />

      {/* TOP-LEFT CORNER: Dica de Combate · Combo Sugerido */}
      <aside className="absolute top-3 left-3 sm:top-5 sm:left-5 [@media(max-height:520px)]:top-2.5 [@media(max-height:520px)]:left-2.5 z-20 w-[min(320px,44vw)] sm:w-[340px] [@media(max-height:520px)]:w-[260px] rounded-xl bg-slate-950/88 backdrop-blur-md border border-white/12 p-3 sm:p-4 [@media(max-height:520px)]:p-2.5 shadow-[0_14px_38px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Swords className="w-3.5 h-3.5 shrink-0" style={{ color: activeArt.color }} />
            <span className="font-display font-bold text-[11px] tracking-wide text-slate-200 truncate">
              Dica de Combate · Combo
            </span>
          </div>
          <span
            className="font-mono-tabular text-[10px] font-bold shrink-0"
            style={{ color: activeArt.color }}
          >
            {activeArt.name}
          </span>
        </div>

        <p className="font-display font-bold text-xs sm:text-sm text-white leading-snug mb-1.5">
          {tip.comboName}
        </p>

        <div className="flex flex-wrap items-center gap-1 mb-2">
          {comboSteps.map((step, idx) => (
            <span key={`${step}-${idx}`} className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/15 font-mono-tabular text-[10px] font-semibold text-amber-200">
                {step}
              </kbd>
              {idx < comboSteps.length - 1 && (
                <span className="text-slate-500 text-[10px]" aria-hidden="true">
                  →
                </span>
              )}
            </span>
          ))}
        </div>

        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed [@media(max-height:520px)]:line-clamp-2">
          {tip.comboSummary}
        </p>
      </aside>

      {/* TOP-RIGHT CORNER: Inteligência do Estágio & Chefe */}
      <aside className="absolute top-3 right-3 sm:top-5 sm:right-5 [@media(max-height:520px)]:top-2.5 [@media(max-height:520px)]:right-2.5 z-20 w-[min(310px,44vw)] sm:w-[320px] [@media(max-height:520px)]:w-[250px] rounded-xl bg-slate-950/88 backdrop-blur-md border border-white/12 p-3 sm:p-4 [@media(max-height:520px)]:p-2.5 shadow-[0_14px_38px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-300" />
            <span className="font-display font-bold text-[11px] tracking-wide text-slate-200 truncate">
              Preparação do Estágio
            </span>
          </div>
          <span className="font-mono-tabular text-[10px] font-semibold text-amber-300 shrink-0">
            {diffMeta.label}
          </span>
        </div>

        <div className="text-xs text-slate-200 mb-1.5">
          <span className="text-slate-400">Chefe:</span>{' '}
          <span className="font-display font-bold text-rose-300">{stageMeta.bossName}</span>
        </div>

        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-1.5 [@media(max-height:520px)]:line-clamp-2">
          <span className="font-semibold" style={{ color: requiredArt.color }}>
            {requiredArt.name} ({requiredArt.key}):
          </span>{' '}
          {stageMeta.requiredJutsuReason}
        </p>

        <p className="text-[11px] text-slate-400 leading-snug [@media(max-height:520px)]:hidden">
          {hazardBrief}
        </p>
      </aside>

      {/* BOTTOM-LEFT CORNER: Estratégia Específica da Ninjutsu Selecionada */}
      <aside className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 [@media(max-height:520px)]:bottom-2.5 [@media(max-height:520px)]:left-2.5 z-20 w-[min(330px,45vw)] sm:w-[350px] [@media(max-height:520px)]:w-[265px] rounded-xl bg-slate-950/88 backdrop-blur-md border border-white/12 p-3 sm:p-4 [@media(max-height:520px)]:p-2.5 shadow-[0_14px_38px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: activeArt.color }} />
            <span className="font-display font-bold text-[11px] tracking-wide text-slate-200 truncate">
              Estratégia · {activeArt.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCycleTip}
            className="min-h-[28px] px-2 rounded-md bg-slate-900/90 border border-white/12 hover:border-white/30 text-[10px] font-display font-semibold text-slate-200 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            title="Ver outra dica para esta Ninjutsu (Tab)"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Outra dica</span>
          </button>
        </div>

        <p className="font-display font-bold text-xs sm:text-sm text-white leading-snug mb-1">
          {tip.strategyTitle}
        </p>
        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed [@media(max-height:520px)]:line-clamp-2">
          {tip.strategyText}
        </p>
      </aside>

      {/* BOTTOM-RIGHT CORNER: Sinergia Tática + Ação Rápida */}
      <aside className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 [@media(max-height:520px)]:bottom-2.5 [@media(max-height:520px)]:right-2.5 z-20 w-[min(320px,45vw)] sm:w-[340px] [@media(max-height:520px)]:w-[265px] rounded-xl bg-slate-950/88 backdrop-blur-md border border-white/12 p-3 sm:p-4 [@media(max-height:520px)]:p-2.5 shadow-[0_14px_38px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-display font-bold text-[11px] tracking-wide text-slate-200 truncate">
            {tip.synergyTitle}
          </span>
          <span className="font-mono-tabular text-[10px] text-slate-400 shrink-0">
            Dica {(tipIndex % tips.length) + 1}/{tips.length}
          </span>
        </div>

        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed mb-2.5 [@media(max-height:520px)]:mb-2 [@media(max-height:520px)]:line-clamp-2">
          {tip.synergyText}
        </p>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono-tabular text-slate-400 truncate">
            {progress >= 100
              ? 'Estágio pronto'
              : `Carregando ${Math.round(progress)}%`}
          </span>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-95 border border-rose-300/40 text-white font-display font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_6px_20px_rgba(225,29,72,0.35)]"
          >
            <span>{progress >= 100 || holdOpen ? 'Entrar na Fase' : 'Pular'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* CENTER FOCAL STAGE BANNER + PROGRESS + LIVE NINJUTSU SWITCHER */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6 pointer-events-none">
        <div className="pointer-events-auto max-w-md w-full text-center flex flex-col items-center">
          <div className="text-xs font-mono-tabular text-slate-400 tracking-wider mb-1">
            Carregando Estágio {stageMeta.index + 1} de {STAGES.length}
          </div>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl [@media(max-height:520px)]:text-xl text-white tracking-tight leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
            {stageMeta.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 mb-3 [@media(max-height:520px)]:mb-2">
            {stageMeta.subtitle}
          </p>

          {/* Smooth Progress Bar */}
          <div className="w-full max-w-[300px] h-2 rounded-full bg-slate-900/90 border border-white/12 overflow-hidden mb-3 [@media(max-height:520px)]:mb-2">
            <div
              className="h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${stageMeta.accentHex}, ${activeArt.color})`,
              }}
            />
          </div>

          {/* Live Ninjutsu Selector to Inspect Combat Tips */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 mb-1.5">
              Troque a Ninjutsu para ver combos e estratégias
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {NINJUTSU_LIST.map((art) => {
                const selected = art.id === selectedNinjutsu;
                const recommended = art.id === stageMeta.requiredJutsu;
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => handleChooseNinjutsu(art.id)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-[11px] font-display font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      selected
                        ? 'bg-slate-900 text-white shadow-md scale-[1.03]'
                        : 'bg-slate-950/75 border-white/12 text-slate-300 hover:border-white/30 hover:text-white'
                    }`}
                    style={
                      selected
                        ? { borderColor: art.color, boxShadow: `0 0 14px ${art.color}44` }
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
        </div>
      </div>
    </div>
  );
}
