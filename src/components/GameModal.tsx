import { useState } from 'react';
import { Award, ChevronLeft, ChevronRight, Clock, MessageSquare, ShieldAlert, Swords, Trophy } from 'lucide-react';
import {
  computeKarmaFinalReward,
  getKarmaStageClearQuote,
  getKarmaVictoryDialogue,
} from '../game/karma';
import {
  DIFFICULTIES,
  HudSnapshot,
  NINJUTSU_LIST,
  STAGES,
  StageId,
  StageRankGrade,
} from '../game/types';

interface GameModalProps {
  mode: 'PAUSED' | 'STAGE_CLEAR' | 'VICTORY' | 'GAME_OVER';
  hud: HudSnapshot;
  unlockedAchievements: number;
  totalAchievements: number;
  onOpenAchievements: () => void;
  onResume?: () => void;
  onNextStage?: () => void;
  onSelectStage: (stageId: StageId) => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getRankStyle(grade: StageRankGrade): {
  title: string;
  badgeClass: string;
  letterClass: string;
  chipClass: string;
} {
  if (grade === 'S') {
    return {
      title: 'Mestre Shinobi',
      badgeClass: 'border-amber-400 bg-amber-950/50 shadow-[0_0_24px_rgba(251,191,36,0.28)]',
      letterClass: 'text-amber-300',
      chipClass: 'border-amber-400/70 bg-amber-500/20 text-amber-300',
    };
  }
  if (grade === 'A') {
    return {
      title: 'Sombra Letal',
      badgeClass: 'border-emerald-400 bg-emerald-950/45 shadow-[0_0_20px_rgba(52,211,153,0.2)]',
      letterClass: 'text-emerald-300',
      chipClass: 'border-emerald-400/70 bg-emerald-500/20 text-emerald-300',
    };
  }
  if (grade === 'B') {
    return {
      title: 'Guerreiro Ágil',
      badgeClass: 'border-sky-400 bg-sky-950/45',
      letterClass: 'text-sky-300',
      chipClass: 'border-sky-400/70 bg-sky-500/20 text-sky-300',
    };
  }
  return {
    title: 'Sobrevivente',
    badgeClass: 'border-rose-500/80 bg-rose-950/40',
    letterClass: 'text-rose-300',
    chipClass: 'border-rose-500/70 bg-rose-500/20 text-rose-300',
  };
}

export function GameModal({
  mode,
  hud,
  unlockedAchievements,
  totalAchievements,
  onOpenAchievements,
  onResume,
  onNextStage,
  onSelectStage,
  onRestart,
  onReturnTitle,
}: GameModalProps) {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  const diffCfg = DIFFICULTIES[hud.difficulty];
  const diffLabel = diffCfg.label;
  const perf = hud.performance;
  const rankStyle = getRankStyle(perf.rank);
  const showPerformanceEval = mode === 'STAGE_CLEAR' || mode === 'VICTORY';

  const victoryScript =
    mode === 'VICTORY'
      ? getKarmaVictoryDialogue(
          hud.karma,
          hud.civiliansRescued,
          hud.civiliansHarmed,
          hud.enemiesDefeated
        )
      : null;

  const finalReward =
    mode === 'VICTORY'
      ? hud.karmaReward ??
        computeKarmaFinalReward(
          hud.karma,
          hud.civiliansRescued,
          hud.civiliansHarmed,
          hud.enemiesDefeated,
          diffCfg.scoreMult
        )
      : null;

  const title =
    mode === 'PAUSED'
      ? 'Jogo Pausado'
      : mode === 'STAGE_CLEAR'
        ? 'Fase Concluída!'
        : mode === 'VICTORY' && victoryScript
          ? victoryScript.heading
          : 'Derrotado na Sombra';

  const subtitle =
    mode === 'PAUSED'
      ? `${hud.stageTitle} · Modo ${diffLabel}`
      : mode === 'STAGE_CLEAR'
        ? `Você venceu o chefe de ${hud.stageTitle}. Avance para o próximo cenário.`
        : mode === 'VICTORY' && victoryScript
          ? victoryScript.epilogue
          : `Você caiu em ${hud.stageTitle} (${diffLabel}).`;

  const karmaColor =
    hud.karma >= 15 ? 'text-emerald-400' : hud.karma <= -15 ? 'text-rose-400' : 'text-amber-300';

  const stageKarmaQuote =
    mode === 'STAGE_CLEAR'
      ? getKarmaStageClearQuote(
          hud.karma,
          hud.stageCiviliansRescued,
          hud.stageCiviliansHarmed,
          hud.stageCiviliansTotal
        )
      : null;

  const activeLineIndex = victoryScript
    ? Math.min(dialogueIndex, victoryScript.lines.length - 1)
    : 0;
  const currentDialogueLine = victoryScript ? victoryScript.lines[activeLineIndex] : null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/78 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-950/92 backdrop-blur-xl border border-white/12 rounded-xl p-5 md:p-6 text-slate-50 shadow-[0_24px_64px_rgba(0,0,0,0.78)] my-auto max-h-[94vh] overflow-y-auto">
        <div className="mb-4">
          {victoryScript && (
            <div
              className={`inline-block px-2.5 py-1 mb-2 rounded-md border text-[10px] font-display font-bold tracking-wider ${victoryScript.accentClass}`}
            >
              {victoryScript.badge}
            </div>
          )}
          <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-white mb-1">
            {title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">{subtitle}</p>
        </div>

        {/* Victory: Alignment-driven Multi-Character End-of-Game Dialogue */}
        {mode === 'VICTORY' && victoryScript && currentDialogueLine && (
          <div className="mb-4 rounded-xl bg-slate-900/75 border border-white/12 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="font-display text-[11px] font-bold tracking-wider text-slate-200 uppercase">
                  Diálogo Final · {hud.karmaLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowFullTranscript((prev) => !prev)}
                className="text-[11px] font-mono-tabular font-semibold text-sky-300 hover:text-sky-200 transition-colors cursor-pointer"
              >
                {showFullTranscript ? 'Modo Interativo' : 'Ver Tudo'}
              </button>
            </div>

            {showFullTranscript ? (
              <div className="space-y-2.5">
                {victoryScript.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-slate-950/75 border border-white/8 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span
                        className={`font-display font-bold ${
                          line.tone === 'honor'
                            ? 'text-emerald-300'
                            : line.tone === 'shadow'
                              ? 'text-rose-300'
                              : 'text-amber-300'
                        }`}
                      >
                        {line.speaker}
                      </span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="text-[11px] text-slate-400">{line.role}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      “{line.text}”
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="rounded-lg bg-slate-950/80 border border-white/10 px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`font-display font-bold text-xs sm:text-sm truncate ${
                          currentDialogueLine.tone === 'honor'
                            ? 'text-emerald-300'
                            : currentDialogueLine.tone === 'shadow'
                              ? 'text-rose-300'
                              : 'text-amber-300'
                        }`}
                      >
                        {currentDialogueLine.speaker}
                      </span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {currentDialogueLine.role}
                      </span>
                    </div>
                    <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">
                      {activeLineIndex + 1}/{victoryScript.lines.length}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                    “{currentDialogueLine.text}”
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2.5">
                  <button
                    type="button"
                    disabled={activeLineIndex === 0}
                    onClick={() => setDialogueIndex((i) => Math.max(0, i - 1))}
                    className="px-2.5 py-1.5 rounded-md border border-white/10 bg-slate-950/70 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>

                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    {victoryScript.lines.map((_, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === activeLineIndex
                            ? 'w-5 bg-amber-300'
                            : 'w-1.5 bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={activeLineIndex >= victoryScript.lines.length - 1}
                    onClick={() =>
                      setDialogueIndex((i) => Math.min(victoryScript.lines.length - 1, i + 1))
                    }
                    className="px-2.5 py-1.5 rounded-md border border-white/10 bg-slate-950/70 text-xs font-medium text-slate-200 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Victory: Final Karma Reward Breakdown */}
        {mode === 'VICTORY' && finalReward && (
          <div
            className="mb-4 rounded-xl border bg-slate-900/75 p-3.5"
            style={{ borderColor: `${finalReward.accentColor}66` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 shrink-0" style={{ color: finalReward.accentColor }} />
                <span
                  className="font-display text-[11px] font-bold tracking-wider uppercase"
                  style={{ color: finalReward.accentColor }}
                >
                  {finalReward.badgeLabel} · RECOMPENSA FINAL
                </span>
              </div>
              <span className="font-mono-tabular text-sm font-extrabold text-amber-300">
                +{finalReward.totalRewardPoints.toLocaleString('pt-BR')} PTS
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div>
                <div className="font-display font-bold text-base text-white">
                  {finalReward.rewardItemName}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Título Desbloqueado:{' '}
                  <span className="font-semibold" style={{ color: finalReward.accentColor }}>
                    {finalReward.rewardTitle}
                  </span>
                </div>
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-300 bg-slate-950/75 border border-white/10 rounded-lg px-2.5 py-1.5 shrink-0">
                Base +{finalReward.baseBonusPoints.toLocaleString('pt-BR')} ·{' '}
                {finalReward.unitCount} {finalReward.unitLabel} (+
                {(finalReward.perUnitBonus * finalReward.unitCount).toLocaleString('pt-BR')})
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {finalReward.rewardDescription}
            </p>
          </div>
        )}

        {showPerformanceEval ? (
          <div className="py-3.5 border-y border-white/10 mb-4 space-y-3.5">
            {/* Stage Performance Evaluation Panel */}
            <div className="bg-slate-900/65 border border-white/10 rounded-lg p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="font-display text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                  Avaliação de Performance
                </span>
                <span className="font-mono-tabular text-xs font-semibold text-slate-400">
                  Índice <span className="text-white font-bold">{perf.performanceScore}</span>/100
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                {/* Rank Emblem */}
                <div
                  className={`sm:w-32 shrink-0 border rounded-lg p-3 flex flex-col items-center justify-center text-center ${rankStyle.badgeClass}`}
                >
                  <span className="text-[10px] font-display font-bold tracking-widest text-slate-300 uppercase">
                    RANK
                  </span>
                  <span
                    className={`font-display font-extrabold text-5xl leading-none my-1 ${rankStyle.letterClass}`}
                  >
                    {perf.rank}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-200 leading-tight">
                    {rankStyle.title}
                  </span>
                </div>

                {/* Criteria Breakdown */}
                <div className="flex-1 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/75 border border-white/8 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 leading-tight">
                          Tempo de Conclusão
                        </div>
                        <div className="font-mono-tabular text-sm font-bold text-white">
                          {formatTime(perf.elapsedSeconds)}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 border rounded-md font-display font-bold text-xs ${
                        getRankStyle(perf.timeGrade).chipClass
                      }`}
                    >
                      {perf.timeGrade}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/75 border border-white/8 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 leading-tight">
                          Dano Recebido
                        </div>
                        <div className="font-mono-tabular text-sm font-bold text-white">
                          {perf.damageTaken} HP
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 border rounded-md font-display font-bold text-xs ${
                        getRankStyle(perf.damageGrade).chipClass
                      }`}
                    >
                      {perf.damageGrade}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/75 border border-white/8 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <Swords className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 leading-tight">
                          Precisão de Combos
                        </div>
                        <div className="font-mono-tabular text-sm font-bold text-white">
                          {perf.comboAccuracy}%{' '}
                          <span className="text-xs font-semibold text-amber-300">
                            · {perf.maxCombo}× máx
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 border rounded-md font-display font-bold text-xs ${
                        getRankStyle(perf.comboGrade).chipClass
                      }`}
                    >
                      {perf.comboGrade}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage Clear Karma Narrative Note */}
            {stageKarmaQuote && (
              <div className="rounded-lg bg-slate-900/65 border border-white/10 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-300 leading-snug">{stageKarmaQuote}</p>
                <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">
                  Fase: <strong className="text-emerald-300">{hud.stageCiviliansRescued}</strong>/
                  {hud.stageCiviliansTotal} salvos
                </span>
              </div>
            )}

            {/* Secondary Run Totals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <div className="text-[11px] text-slate-400">Pontuação</div>
                <div className="font-mono-tabular text-sm font-bold text-white">
                  {hud.score.toLocaleString('pt-BR')}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Inimigos</div>
                <div className="font-mono-tabular text-sm font-bold text-slate-200">
                  {hud.enemiesDefeated}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Karma</div>
                <div className={`font-mono-tabular text-xs font-bold ${karmaColor}`}>
                  {hud.karma >= 0 ? `+${hud.karma}` : hud.karma} · {hud.karmaLabel}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Civis (Total)</div>
                <div className="font-mono-tabular text-xs font-semibold text-slate-200">
                  <span className="text-emerald-400">{hud.civiliansRescued} salvos</span>
                  <span className="mx-1 text-slate-600">/</span>
                  <span className={hud.civiliansHarmed > 0 ? 'text-rose-400' : 'text-slate-400'}>
                    {hud.civiliansHarmed} fer.
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 py-4 border-y border-white/10 mb-5">
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Pontuação</div>
              <div className="font-mono-tabular text-xl font-bold text-white">
                {hud.score.toLocaleString('pt-BR')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Combo Máximo</div>
              <div className="font-mono-tabular text-xl font-bold text-amber-400">
                {hud.maxCombo}×
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Inimigos Derrotados</div>
              <div className="font-mono-tabular text-lg font-semibold text-slate-200">
                {hud.enemiesDefeated}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Tempo</div>
              <div className="font-mono-tabular text-lg font-semibold text-slate-200">
                {formatTime(hud.elapsedSeconds)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Karma</div>
              <div className={`font-mono-tabular text-sm font-bold ${karmaColor}`}>
                {hud.karma >= 0 ? `+${hud.karma}` : hud.karma} · {hud.karmaLabel}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Civis</div>
              <div className="font-mono-tabular text-sm font-semibold text-slate-200">
                <span className="text-emerald-400">{hud.civiliansRescued} salvos</span>
                <span className="mx-1.5 text-slate-600">/</span>
                <span className={hud.civiliansHarmed > 0 ? 'text-rose-400' : 'text-slate-400'}>
                  {hud.civiliansHarmed} feridos
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stage Switcher */}
        <div className="mb-5">
          <div className="text-xs font-medium text-slate-400 mb-2">Trocar de Fase (10 Fases)</div>
          <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-1">
            {STAGES.map((st) => {
              const isCurrent = st.id === hud.stageId;
              const reqArt = NINJUTSU_LIST.find((n) => n.id === st.requiredJutsu) ?? NINJUTSU_LIST[0];
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectStage(st.id)}
                  className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-950/35 border-amber-400/75 text-white'
                      : 'bg-slate-900/65 border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display text-[11px] font-bold truncate">
                      {st.title}
                    </span>
                    <span
                      className="shrink-0 text-[9px] font-mono-tabular font-bold"
                      style={{ color: reqArt.color }}
                    >
                      {reqArt.key}·{reqArt.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-slate-400 truncate">
                      {st.subtitle}
                    </span>
                    {st.denseFog && (
                      <span className="shrink-0 text-[9px] font-mono-tabular font-bold text-teal-300">
                        Neblina
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-col gap-2.5">
          {mode === 'PAUSED' && onResume && (
            <button
              type="button"
              onClick={onResume}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-300/40 text-white font-display font-bold text-xs tracking-wide transition-all cursor-pointer whitespace-nowrap shadow-lg"
            >
              Continuar
            </button>
          )}

          {mode === 'STAGE_CLEAR' && onNextStage && (
            <button
              type="button"
              onClick={onNextStage}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 border border-emerald-300/40 text-white font-display font-bold text-xs tracking-wide transition-all cursor-pointer whitespace-nowrap shadow-lg"
            >
              Próxima Fase
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className={`w-full min-h-[44px] px-5 py-2.5 rounded-lg font-display font-bold text-xs tracking-wide transition-all cursor-pointer whitespace-nowrap ${
              mode === 'PAUSED' || mode === 'STAGE_CLEAR'
                ? 'bg-slate-800/85 hover:bg-slate-700 text-slate-100 border border-white/12'
                : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-300/40 text-white shadow-lg'
            }`}
          >
            {mode === 'PAUSED' ? 'Reiniciar Fase' : 'Jogar Novamente'}
          </button>

          <button
            type="button"
            onClick={onOpenAchievements}
            className="w-full min-h-[42px] px-5 py-2 rounded-lg bg-slate-900/75 hover:bg-slate-800/85 text-amber-300 border border-white/12 hover:border-amber-400/50 font-display font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span>
              Conquistas ({unlockedAchievements}/{totalAchievements}) & Bestiário
            </span>
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border border-white/10 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            Voltar ao Título
          </button>
        </div>
      </div>
    </div>
  );
}
