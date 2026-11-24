import { NinjutsuType } from './types';

export type AchievementId =
  | 'no_damage_stage'
  | 'combo_50'
  | 'combo_15'
  | 'boss_speedrun'
  | 'moon_fury_triple'
  | 'shuriken_parry'
  | 'ninjutsu_master'
  | 'shogun_hard'
  | 'karma_guardian'
  | 'karma_crimson';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  badgeColor: string;
  icon: 'shield' | 'sword' | 'crown' | 'bolt' | 'moon' | 'star' | 'scroll' | 'shogun';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'no_damage_stage',
    title: 'Sombra Intocável',
    description: 'Completar um estágio sem sofrer dano na vida.',
    badgeColor: '#34D399',
    icon: 'shield',
  },
  {
    id: 'combo_50',
    title: 'Tempestade de Aço',
    description: 'Executar um combo contínuo de 50 golpes.',
    badgeColor: '#FBBF24',
    icon: 'crown',
  },
  {
    id: 'boss_speedrun',
    title: 'Relâmpago Carmesim',
    description: 'Derrotar um chefe em menos de 1 minuto após sua aparição.',
    badgeColor: '#38BDF8',
    icon: 'bolt',
  },
  {
    id: 'combo_15',
    title: 'Lâmina Implacável',
    description: 'Alcançar o rank Shinobi Supremo (combo de 15 golpes).',
    badgeColor: '#F59E0B',
    icon: 'sword',
  },
  {
    id: 'moon_fury_triple',
    title: 'Eclipse Total',
    description: 'Acertar 3 ou mais inimigos com uma única Fúria da Lua.',
    badgeColor: '#FB7185',
    icon: 'moon',
  },
  {
    id: 'shuriken_parry',
    title: 'Reflexo Shinobi',
    description: 'Aparar um projétil inimigo com um golpe de katana.',
    badgeColor: '#67E8F9',
    icon: 'star',
  },
  {
    id: 'ninjutsu_master',
    title: 'Mestre das 6 Artes',
    description: 'Conjurar todos os 6 Ninjutsus (Ikazuchi, Karyū, Fushin, Mijin, Bunshin e Visão Noturna).',
    badgeColor: '#A78BFA',
    icon: 'scroll',
  },
  {
    id: 'shogun_hard',
    title: 'Lenda do Clã Oboro',
    description: 'Derrotar Kurogane na Fase 4 jogando no modo Difícil.',
    badgeColor: '#E11D48',
    icon: 'shogun',
  },
  {
    id: 'karma_guardian',
    title: 'Guardião da Lua Clara',
    description: 'Concluir uma fase com alinhamento Honra Luminosa (+40 Karma ou mais) e nenhum civil ferido.',
    badgeColor: '#34D399',
    icon: 'shield',
  },
  {
    id: 'karma_crimson',
    title: 'Caminho Carmesim',
    description: 'Alcançar o alinhamento Demônio Carmesim (-40 Karma ou menos).',
    badgeColor: '#FB7185',
    icon: 'moon',
  },
];

export interface AchievementStoreData {
  unlocked: Partial<Record<AchievementId, number>>;
  ninjutsuUsed: NinjutsuType[];
}

const STORAGE_KEY = 'kage_achievements_v1';

export function loadAchievements(): AchievementStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlocked: {}, ninjutsuUsed: [] };
    const parsed = JSON.parse(raw) as Partial<AchievementStoreData>;
    return {
      unlocked: parsed.unlocked && typeof parsed.unlocked === 'object' ? parsed.unlocked : {},
      ninjutsuUsed: Array.isArray(parsed.ninjutsuUsed) ? parsed.ninjutsuUsed : [],
    };
  } catch {
    return { unlocked: {}, ninjutsuUsed: [] };
  }
}

export function saveAchievements(data: AchievementStoreData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures
  }
}

export function unlockAchievementInStore(id: AchievementId): {
  store: AchievementStoreData;
  newlyUnlocked: AchievementDef | null;
} {
  const store = loadAchievements();
  if (store.unlocked[id]) {
    return { store, newlyUnlocked: null };
  }
  store.unlocked[id] = Date.now();
  saveAchievements(store);
  const def = ACHIEVEMENTS.find((a) => a.id === id) ?? null;
  return { store, newlyUnlocked: def };
}

export function recordNinjutsuUsedInStore(kind: NinjutsuType): {
  store: AchievementStoreData;
  newlyUnlocked: AchievementDef | null;
} {
  const store = loadAchievements();
  if (!store.ninjutsuUsed.includes(kind)) {
    store.ninjutsuUsed.push(kind);
    saveAchievements(store);
  }
  const allSix: NinjutsuType[] = ['ikazuchi', 'karyu', 'fushin', 'mijin', 'bunshin', 'yagan'];
  if (allSix.every((n) => store.ninjutsuUsed.includes(n))) {
    return unlockAchievementInStore('ninjutsu_master');
  }
  return { store, newlyUnlocked: null };
}
