import { EnemyType } from './types';

export interface BestiaryEntry {
  type: EnemyType;
  name: string;
  title: string;
  category: 'Tropa' | 'Chefe';
  stageLabel: string;
  hp: number;
  damage: number;
  speed: number;
  attackStyle: string;
  weakness: string;
  accentColor: string;
  previewKind: 'slash' | 'kunai' | 'slam' | 'dash_slash';
  lore: string;
}

export const BESTIARY_ENTRIES: BestiaryEntry[] = [
  {
    type: 'scout',
    name: 'Batedor Sombrio',
    title: 'Infiltrador do Clã Oboro',
    category: 'Tropa',
    stageLabel: 'Todas as Fases',
    hp: 52,
    damage: 10,
    speed: 170,
    attackStyle: 'Avanço rápido e corte curto de tantō',
    weakness: 'Baixa resistência; vulnerável a combos rápidos e shurikens.',
    accentColor: '#38BDF8',
    previewKind: 'slash',
    lore: 'Novatos treinados nas sombras da vila feudal. Compensam a armadura leve com velocidade para cercar o invasor pelos flancos.',
  },
  {
    type: 'ronin',
    name: 'Ronin Ashigaru',
    title: 'Espadachim Renegado',
    category: 'Tropa',
    stageLabel: 'Todas as Fases',
    hp: 82,
    damage: 14,
    speed: 120,
    attackStyle: 'Corte pesado frontal de katana',
    weakness: 'Recuperação lenta após golpe; ideal para contra-ataques.',
    accentColor: '#F59E0B',
    previewKind: 'slash',
    lore: 'Antigos soldados sem mestre que venderam suas lâminas ao Shogun Sombrio em troca de ouro manchado pela lua carmesim.',
  },
  {
    type: 'kunoichi',
    name: 'Kunoichi',
    title: 'Atiradora Ágil',
    category: 'Tropa',
    stageLabel: 'Todas as Fases',
    hp: 60,
    damage: 11,
    speed: 158,
    attackStyle: 'Arremesso de kunai e salto mortal evasivo',
    weakness: 'Aparar a kunai com a katana gera Chi e Fúria da Lua.',
    accentColor: '#E879F9',
    previewKind: 'kunai',
    lore: 'Especialistas em emboscadas de longa distância. Costumam ocupar telhados elevados e recuar com acrobacias quando pressionadas.',
  },
  {
    type: 'oni',
    name: 'Oni Guardião',
    title: 'Brutamontes Blindado',
    category: 'Tropa',
    stageLabel: 'Fases 2 a 10',
    hp: 160,
    damage: 22,
    speed: 84,
    attackStyle: 'Esmagamento sísmico em área com super armadura',
    weakness: 'Golpes pesados do combo (3º/4º hit) quebram sua postura.',
    accentColor: '#FB7185',
    previewKind: 'slam',
    lore: 'Guerreiros colossais com máscaras demoníacas forjadas em ferro negro. Seus golpes fazem tremer até as fundações de pedra.',
  },
  {
    type: 'boss_kagerou',
    name: 'Kagerou, Capitão Ronin',
    title: 'Guardião dos Templos',
    category: 'Chefe',
    stageLabel: 'Fase 1 · Templos da Lua',
    hp: 300,
    damage: 18,
    speed: 138,
    attackStyle: 'Investida cortante, impacto e convocação de batedores',
    weakness: 'Selo quebrado com Ikazuchi (1).',
    accentColor: '#10B981',
    previewKind: 'dash_slash',
    lore: 'Comandante implacável da guarnição lunar. Jurou proteger os portões do clã até o último suspiro de sua lâmina esmeralda.',
  },
  {
    type: 'boss_hotaru',
    name: 'Hotaru, Mestra Kunoichi',
    title: 'Espectro do Bambuzal',
    category: 'Chefe',
    stageLabel: 'Fase 2 · Floresta de Bambu',
    hp: 340,
    damage: 17,
    speed: 175,
    attackStyle: 'Emboscadas velozes na neblina e chuva de golpes',
    weakness: 'Selo e camuflagem dissipados com Visão Noturna (6).',
    accentColor: '#2DD4BF',
    previewKind: 'dash_slash',
    lore: 'Mestra das ilusões da floresta fechada. Utiliza a neblina densa das cachoeiras para ocultar seus passos antes de atacar.',
  },
  {
    type: 'boss_raiden',
    name: 'Raiden, Ninja Cibernético',
    title: 'Sentinela da Ferrovia Néon',
    category: 'Chefe',
    stageLabel: 'Fase 3 · Metrópole Néon',
    hp: 380,
    damage: 20,
    speed: 165,
    attackStyle: 'Cortes supersônicos e sobrecarga de área',
    weakness: 'Selo cibernético derretido com Karyū (2).',
    accentColor: '#D946EF',
    previewKind: 'dash_slash',
    lore: 'Shinobi reconstruído com implantes de alta tensão nos laboratórios clandestinos da metrópole. Move-se como um relâmpago néon.',
  },
  {
    type: 'boss_kurogane',
    name: 'Kurogane, O Shogun Sombrio',
    title: 'Senhor da Fortaleza',
    category: 'Chefe',
    stageLabel: 'Fase 4 · Base do Shogun',
    hp: 440,
    damage: 21,
    speed: 148,
    attackStyle: 'Golpes sísmicos de armadura negra e reforços de elite',
    weakness: 'Armadura estilhaçada com Mijin (4).',
    accentColor: '#F59E0B',
    previewKind: 'slam',
    lore: 'Tirano blindado que usurpou o domínio das chamas. Sua couraça forjada em aço maldito resiste a ataques comuns.',
  },
  {
    type: 'boss_umigame',
    name: 'Umigame, Capitão Pirata',
    title: 'Corsário da Névoa',
    category: 'Chefe',
    stageLabel: 'Fase 5 · Porto da Névoa',
    hp: 460,
    damage: 21,
    speed: 142,
    attackStyle: 'Guarda dupla naval e investidas no convés',
    weakness: 'Escudo flanqueado por Clones Bunshin (5).',
    accentColor: '#38BDF8',
    previewKind: 'slam',
    lore: 'Contrabandista dos mares do norte que fornece armas proibidas ao exército sombrio sob a proteção da maré noturna.',
  },
  {
    type: 'boss_tetsujin',
    name: 'Tetsujin, Golem de Ferro',
    title: 'Colosso de Obsidiana',
    category: 'Chefe',
    stageLabel: 'Fase 6 · Minas de Obsidiana',
    hp: 520,
    damage: 25,
    speed: 118,
    attackStyle: 'Ondas de choque esmagadoras com força brutal',
    weakness: 'Couraça mineral fundida por Karyū (2).',
    accentColor: '#F97316',
    previewKind: 'slam',
    lore: 'Autômato ancestral animado por cristais ígneos nas galerias subterrâneas. Cada passo seu abre fissuras na rocha viva.',
  },
  {
    type: 'boss_yuki',
    name: 'Yuki, Dama da Nevasca',
    title: 'Espírito do Pico Akagi',
    category: 'Chefe',
    stageLabel: 'Fase 7 · Pico Nevado Akagi',
    hp: 490,
    damage: 21,
    speed: 182,
    attackStyle: 'Investidas gélidas velozes no topo da tormenta',
    weakness: 'Vento cortante de Fushin (3) rompe sua barreira.',
    accentColor: '#67E8F9',
    previewKind: 'dash_slash',
    lore: 'Guardã solitária das geleiras eternas. Sua lâmina cristalina acompanha os ventos cortantes da nevasca branca.',
  },
  {
    type: 'boss_enma',
    name: 'Enma, Sacerdote Demoníaco',
    title: 'Oráculo da Mata Sombria',
    category: 'Chefe',
    stageLabel: 'Fase 8 · Floresta do Santuário',
    hp: 540,
    damage: 23,
    speed: 152,
    attackStyle: 'Rituais na neblina densa e invocação de Onis',
    weakness: 'Selos ocultos revelados com Visão Noturna (6).',
    accentColor: '#A78BFA',
    previewKind: 'slam',
    lore: 'Sumo sacerdote corrompido por pergaminhos proibidos. Envolve o santuário da floresta em névoa espessa para ocultar seus ritos.',
  },
  {
    type: 'boss_tetsuo',
    name: 'Tetsuo, Lâmina Fantasma',
    title: 'Assassino do Expresso',
    category: 'Chefe',
    stageLabel: 'Fase 9 · Trem Blindado',
    hp: 580,
    damage: 24,
    speed: 192,
    attackStyle: 'Cortes em altíssima velocidade sobre os vagões',
    weakness: 'Velocidade neutralizada por Clones Bunshin (5).',
    accentColor: '#F472B6',
    previewKind: 'dash_slash',
    lore: 'Mercenário lendário contratado para interceptar qualquer invasor a caminho da cidadela final. Nunca erra um duelo em movimento.',
  },
  {
    type: 'boss_akuma',
    name: 'Akuma, Imperador do Eclipse',
    title: 'Soberano da Lua Negra',
    category: 'Chefe',
    stageLabel: 'Fase 10 · Cidadela do Eclipse',
    hp: 680,
    damage: 27,
    speed: 170,
    attackStyle: 'Fúria total do eclipse, investidas e guardas de elite',
    weakness: 'Selo Supremo estilhaçado apenas com Mijin (4).',
    accentColor: '#FACC15',
    previewKind: 'slam',
    lore: 'A mente por trás da maldição da lua carmesim. Do alto da torre do eclipse, comanda as trevas que ameaçam todo o clã shinobi.',
  },
];

export interface BestiaryRecord {
  defeatedCount: number;
  firstDefeatedAt: number;
}

export interface BestiaryStoreData {
  entries: Partial<Record<EnemyType, BestiaryRecord>>;
}

const BESTIARY_STORAGE_KEY = 'kage_bestiary_v1';

export function loadBestiary(): BestiaryStoreData {
  try {
    const raw = localStorage.getItem(BESTIARY_STORAGE_KEY);
    if (!raw) return { entries: {} };
    const parsed = JSON.parse(raw) as Partial<BestiaryStoreData>;
    return {
      entries: parsed.entries && typeof parsed.entries === 'object' ? parsed.entries : {},
    };
  } catch {
    return { entries: {} };
  }
}

export function saveBestiary(data: BestiaryStoreData): void {
  try {
    localStorage.setItem(BESTIARY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures
  }
}

export function recordEnemyDefeatedInStore(type: EnemyType): {
  store: BestiaryStoreData;
  isFirstDiscovery: boolean;
} {
  const store = loadBestiary();
  const prev = store.entries[type];
  const isFirstDiscovery = !prev || prev.defeatedCount <= 0;
  store.entries[type] = {
    defeatedCount: (prev?.defeatedCount ?? 0) + 1,
    firstDefeatedAt: prev?.firstDefeatedAt ?? Date.now(),
  };
  saveBestiary(store);
  return { store, isFirstDiscovery };
}
