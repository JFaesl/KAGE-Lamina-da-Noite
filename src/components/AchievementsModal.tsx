import { useState } from 'react';
import { BookOpen, Lock, Swords, Trophy, X } from 'lucide-react';
import { ACHIEVEMENTS, AchievementStoreData } from '../game/achievements';
import { BESTIARY_ENTRIES, BestiaryStoreData } from '../game/bestiary';
import { EnemyType } from '../game/types';
import { AchievementIcon } from './AchievementToast';
import { BestiarySpritePreview } from './BestiarySpritePreview';

interface AchievementsModalProps {
  store: AchievementStoreData;
  bestiaryStore: BestiaryStoreData;
  onClose: () => void;
}

export function AchievementsModal({ store, bestiaryStore, onClose }: AchievementsModalProps) {
  const [activeTab, setActiveTab] = useState<'achievements' | 'bestiary'>('achievements');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Tropa' | 'Chefe'>('all');
  const [selectedType, setSelectedType] = useState<EnemyType>('scout');
  const [loopMode, setLoopMode] = useState<'cycle' | 'attack'>('cycle');

  const unlockedCount = ACHIEVEMENTS.filter((a) => Boolean(store.unlocked[a.id])).length;
  const discoveredCount = BESTIARY_ENTRIES.filter(
    (entry) => (bestiaryStore.entries[entry.type]?.defeatedCount ?? 0) > 0
  ).length;

  const filteredBestiary = BESTIARY_ENTRIES.filter((entry) =>
    categoryFilter === 'all' ? true : entry.category === categoryFilter
  );
  const selectedEntry =
    BESTIARY_ENTRIES.find((e) => e.type === selectedType) ?? BESTIARY_ENTRIES[0];
  const selectedRecord = bestiaryStore.entries[selectedEntry.type];
  const isSelectedUnlocked = Boolean(selectedRecord && selectedRecord.defeatedCount > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 backdrop-blur-sm p-4 md:p-6">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-950/94 backdrop-blur-xl border border-white/12 rounded-xl text-slate-50 shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-amber-400/60 bg-slate-900/90 flex items-center justify-center shrink-0">
              {activeTab === 'achievements' ? (
                <Trophy className="w-5 h-5 text-amber-400" />
              ) : (
                <BookOpen className="w-5 h-5 text-sky-400" />
              )}
            </div>
            <div>
              <h2 className="font-display font-bold text-base md:text-lg text-white">
                {activeTab === 'achievements' ? 'Conquistas Shinobi' : 'Bestiário do Clã Oboro'}
              </h2>
              <p className="text-xs text-slate-400 font-mono-tabular">
                {activeTab === 'achievements'
                  ? `${unlockedCount} de ${ACHIEVEMENTS.length} desbloqueadas`
                  : `${discoveredCount} de ${BESTIARY_ENTRIES.length} oponentes registrados`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="inline-flex items-center bg-slate-900/80 border border-white/10 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('achievements')}
                className={`px-3 py-1.5 rounded-md text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'achievements'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Conquistas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bestiary')}
                className={`px-3 py-1.5 rounded-md text-xs font-display font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'bestiary'
                    ? 'bg-sky-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bestiário ({discoveredCount}/{BESTIARY_ENTRIES.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela"
              className="min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center bg-slate-900/85 border border-white/12 text-slate-300 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeTab === 'achievements' ? (
          <div className="overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((ach) => {
              const unlockedAt = store.unlocked[ach.id];
              const isUnlocked = Boolean(unlockedAt);
              return (
                <div
                  key={ach.id}
                  className={`flex items-start gap-3 p-3.5 border rounded-lg transition-colors ${
                    isUnlocked
                      ? 'bg-slate-900/80 border-amber-400/50'
                      : 'bg-slate-900/40 border-white/8 opacity-75'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg border bg-slate-950 flex items-center justify-center shrink-0"
                    style={{ borderColor: isUnlocked ? `${ach.badgeColor}88` : '#334155' }}
                  >
                    {isUnlocked ? (
                      <AchievementIcon icon={ach.icon} color={ach.badgeColor} />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-display font-bold text-xs truncate ${
                          isUnlocked ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {ach.title}
                      </span>
                      {isUnlocked && (
                        <span className="text-[10px] font-mono-tabular font-bold text-emerald-400 shrink-0">
                          OBTIDA
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">{ach.description}</p>
                    {isUnlocked && unlockedAt && (
                      <p className="text-[10px] font-mono-tabular text-slate-500 mt-1">
                        {new Date(unlockedAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Filter + Enemy Roster */}
            <div className="w-full md:w-64 lg:w-72 border-b md:border-b-0 md:border-r border-white/10 flex flex-col max-h-52 md:max-h-none">
              <div className="flex items-center gap-1 p-2.5 border-b border-white/10 bg-slate-900/50">
                {(['all', 'Tropa', 'Chefe'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex-1 py-1.5 px-2 text-[11px] font-display font-bold rounded-md border transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-sky-500/20 border-sky-400/70 text-sky-200'
                        : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat === 'Tropa' ? 'Tropas' : 'Chefes'}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto p-2.5 space-y-1.5">
                {filteredBestiary.map((entry) => {
                  const rec = bestiaryStore.entries[entry.type];
                  const unlocked = Boolean(rec && rec.defeatedCount > 0);
                  const active = entry.type === selectedEntry.type;
                  return (
                    <button
                      key={entry.type}
                      type="button"
                      onClick={() => setSelectedType(entry.type)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                        active
                          ? 'bg-sky-950/55 border-sky-400/75 text-white'
                          : unlocked
                            ? 'bg-slate-900/60 border-white/8 text-slate-200 hover:border-white/25'
                            : 'bg-slate-900/30 border-white/6 text-slate-500 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xs font-bold truncate">
                          {unlocked ? entry.name : '??? · Desconhecido'}
                        </span>
                        {unlocked ? (
                          <span className="font-mono-tabular text-[10px] font-bold text-emerald-400 shrink-0">
                            ×{rec?.defeatedCount}
                          </span>
                        ) : (
                          <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 truncate">
                          {entry.stageLabel}
                        </span>
                        <span
                          className={`text-[9px] font-mono-tabular font-bold ${
                            entry.category === 'Chefe' ? 'text-rose-300' : 'text-slate-400'
                          }`}
                        >
                          {entry.category.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Enemy Dossier + Live Attack Animation */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="flex flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
                  <BestiarySpritePreview
                    entry={selectedEntry}
                    unlocked={isSelectedUnlocked}
                    loopMode={loopMode}
                  />
                  {isSelectedUnlocked && (
                    <div className="inline-flex items-center gap-1 bg-slate-900/80 border border-white/10 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLoopMode('cycle')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-mono-tabular font-bold cursor-pointer transition-colors ${
                          loopMode === 'cycle'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ciclo Completo
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoopMode('attack')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-mono-tabular font-bold cursor-pointer transition-colors ${
                          loopMode === 'attack'
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Animação de Ataque
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono-tabular font-bold ${
                        selectedEntry.category === 'Chefe' ? 'text-rose-300' : 'text-sky-300'
                      }`}
                    >
                      {selectedEntry.category.toUpperCase()}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      {selectedEntry.stageLabel}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-white leading-tight">
                    {isSelectedUnlocked ? selectedEntry.name : 'Oponente Não Registrado'}
                  </h3>
                  <p className="text-xs font-medium mt-0.5" style={{ color: selectedEntry.accentColor }}>
                    {isSelectedUnlocked ? selectedEntry.title : 'Derrote em combate para revelar os dados'}
                  </p>

                  {/* Base Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    <div className="bg-slate-900/75 border border-white/10 rounded-lg px-2.5 py-1.5">
                      <div className="text-[10px] text-slate-400">Vida Base</div>
                      <div className="font-mono-tabular text-sm font-bold text-emerald-400">
                        {isSelectedUnlocked ? selectedEntry.hp : '???'}
                      </div>
                    </div>
                    <div className="bg-slate-900/75 border border-white/10 rounded-lg px-2.5 py-1.5">
                      <div className="text-[10px] text-slate-400">Dano Base</div>
                      <div className="font-mono-tabular text-sm font-bold text-rose-400">
                        {isSelectedUnlocked ? selectedEntry.damage : '???'}
                      </div>
                    </div>
                    <div className="bg-slate-900/75 border border-white/10 rounded-lg px-2.5 py-1.5">
                      <div className="text-[10px] text-slate-400">Velocidade</div>
                      <div className="font-mono-tabular text-sm font-bold text-sky-400">
                        {isSelectedUnlocked ? selectedEntry.speed : '???'}
                      </div>
                    </div>
                    <div className="bg-slate-900/75 border border-white/10 rounded-lg px-2.5 py-1.5">
                      <div className="text-[10px] text-slate-400">Derrotados</div>
                      <div className="font-mono-tabular text-sm font-bold text-amber-300">
                        {selectedRecord?.defeatedCount ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isSelectedUnlocked ? (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="bg-slate-900/70 border border-white/10 rounded-lg p-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-display font-bold text-amber-300 mb-1">
                      <Swords className="w-3.5 h-3.5" />
                      <span>Padrão de Ataque & Fraqueza</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      <span className="font-semibold text-white">Ataque:</span> {selectedEntry.attackStyle}.
                    </p>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      <span className="font-semibold text-teal-300">Estratégia:</span> {selectedEntry.weakness}
                    </p>
                  </div>

                  <div className="bg-slate-900/70 border border-white/10 rounded-lg p-3.5">
                    <div className="text-[11px] font-display font-bold text-slate-300 mb-1">
                      Arquivos do Clã (Lore)
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedEntry.lore}</p>
                    {selectedRecord?.firstDefeatedAt && (
                      <p className="text-[10px] font-mono-tabular text-slate-500 mt-2">
                        Primeiro registro em {new Date(selectedRecord.firstDefeatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4 text-center">
                  <Lock className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Derrote este oponente durante o combate em <span className="text-slate-200 font-semibold">{selectedEntry.stageLabel}</span> para desbloquear suas estatísticas, história e animação de ataque no Bestiário.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
