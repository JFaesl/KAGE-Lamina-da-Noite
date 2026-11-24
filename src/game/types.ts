export type GameScreenState =
  | 'TITLE_MENU'
  | 'LOADING_STAGE'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'VICTORY'
  | 'GAME_OVER';

export type StageId =
  | 'village'
  | 'bamboo'
  | 'neon_city'
  | 'fortress'
  | 'harbor'
  | 'mines'
  | 'snow_peak'
  | 'temple_ruins'
  | 'bullet_train'
  | 'eclipse_citadel';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type NinjutsuType = 'ikazuchi' | 'karyu' | 'fushin' | 'mijin' | 'bunshin' | 'yagan';

export interface NinjutsuMeta {
  id: NinjutsuType;
  key: string;
  name: string;
  subtitle: string;
  color: string;
}

export const NINJUTSU_LIST: NinjutsuMeta[] = [
  {
    id: 'ikazuchi',
    key: '1',
    name: 'Ikazuchi',
    subtitle: 'Escudo de Trovão (3 golpes)',
    color: '#38BDF8',
  },
  {
    id: 'karyu',
    key: '2',
    name: 'Karyū',
    subtitle: 'Dragões de Fogo em linha',
    color: '#F97316',
  },
  {
    id: 'fushin',
    key: '3',
    name: 'Fushin',
    subtitle: 'Agilidade e salto supremos',
    color: '#10B981',
  },
  {
    id: 'mijin',
    key: '4',
    name: 'Mijin',
    subtitle: 'Explosão sombria em área',
    color: '#E11D48',
  },
  {
    id: 'bunshin',
    key: '5',
    name: 'Bunshin',
    subtitle: 'Invoca 2 Clones das Sombras',
    color: '#A78BFA',
  },
  {
    id: 'yagan',
    key: '6',
    name: 'Visão Noturna',
    subtitle: 'Dissipa neblina densa e identifica inimigos (14s)',
    color: '#2DD4BF',
  },
];

export interface StageMeta {
  id: StageId;
  index: number;
  title: string;
  subtitle: string;
  bossName: string;
  accentHex: string;
  requiredJutsu: NinjutsuType;
  requiredJutsuReason: string;
  denseFog?: boolean;
}

export const STAGES: StageMeta[] = [
  {
    id: 'village',
    index: 0,
    title: 'Fase 1 · Templos da Lua',
    subtitle: 'Vila Feudal & Telhados',
    bossName: 'Kagerou, Capitão Ronin',
    accentHex: '#E11D48',
    requiredJutsu: 'ikazuchi',
    requiredJutsuReason: 'Rompe o selo elétrico da guarda de Kagerou.',
  },
  {
    id: 'bamboo',
    index: 1,
    title: 'Fase 2 · Floresta de Bambu',
    subtitle: 'Bambuzal, Cachoeiras & Neblina Densa',
    bossName: 'Hotaru, Mestra Kunoichi',
    accentHex: '#10B981',
    requiredJutsu: 'yagan',
    requiredJutsuReason: 'Dissipa a neblina densa da floresta e identifica Hotaru na névoa.',
    denseFog: true,
  },
  {
    id: 'neon_city',
    index: 2,
    title: 'Fase 3 · Metrópole Néon',
    subtitle: 'Cidade Noturna & Ferrovia',
    bossName: 'Raiden, Ninja Cibernético',
    accentHex: '#D946EF',
    requiredJutsu: 'karyu',
    requiredJutsuReason: 'Dragões de fogo derretem o escudo cibernético de Raiden.',
  },
  {
    id: 'fortress',
    index: 3,
    title: 'Fase 4 · Base do Shogun',
    subtitle: 'Laboratório & Fortaleza',
    bossName: 'Kurogane, O Shogun Sombrio',
    accentHex: '#F59E0B',
    requiredJutsu: 'mijin',
    requiredJutsuReason: 'Explosão sombria estilhaça a armadura de Kurogane.',
  },
  {
    id: 'harbor',
    index: 4,
    title: 'Fase 5 · Porto da Névoa',
    subtitle: 'Docas & Navios Negreiros',
    bossName: 'Umigame, Capitão Pirata',
    accentHex: '#38BDF8',
    requiredJutsu: 'bunshin',
    requiredJutsuReason: 'Clones das sombras flanqueiam o escudo duplo de Umigame.',
  },
  {
    id: 'mines',
    index: 5,
    title: 'Fase 6 · Minas de Obsidiana',
    subtitle: 'Cavernas & Cristais Sombrios',
    bossName: 'Tetsujin, Golem de Ferro',
    accentHex: '#F97316',
    requiredJutsu: 'karyu',
    requiredJutsuReason: 'Chamas intensas fundem a couraça mineral de Tetsujin.',
  },
  {
    id: 'snow_peak',
    index: 6,
    title: 'Fase 7 · Pico Nevado Akagi',
    subtitle: 'Penhascos & Tempestade Branca',
    bossName: 'Yuki, Dama da Nevasca',
    accentHex: '#67E8F9',
    requiredJutsu: 'fushin',
    requiredJutsuReason: 'Velocidade do vento atravessa a nevasca de Yuki.',
  },
  {
    id: 'temple_ruins',
    index: 7,
    title: 'Fase 8 · Floresta do Santuário',
    subtitle: 'Mata Sombria, Neblina & Selos Antigos',
    bossName: 'Enma, Sacerdote Demoníaco',
    accentHex: '#A78BFA',
    requiredJutsu: 'yagan',
    requiredJutsuReason: 'Dissipa a neblina densa da mata sombria e revela os selos de Enma.',
    denseFog: true,
  },
  {
    id: 'bullet_train',
    index: 8,
    title: 'Fase 9 · Trem Blindado',
    subtitle: 'Vagões em Alta Velocidade',
    bossName: 'Tetsuo, Lâmina Fantasma',
    accentHex: '#F472B6',
    requiredJutsu: 'bunshin',
    requiredJutsuReason: 'Clones cercam Tetsuo no teto estreito do trem.',
  },
  {
    id: 'eclipse_citadel',
    index: 9,
    title: 'Fase 10 · Cidadela do Eclipse',
    subtitle: 'Torre Suprema da Lua Negra',
    bossName: 'Akuma, Imperador do Eclipse',
    accentHex: '#FACC15',
    requiredJutsu: 'mijin',
    requiredJutsuReason: 'Explosão máxima rompe o Selo Final do Eclipse.',
  },
];

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  playerMaxHp: number;
  enemyDamageMult: number;
  enemyHpMult: number;
  enemySpeedMult: number;
  windupMult: number;
  scoreMult: number;
  healDropBonus: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Fácil',
    description: '140 HP · Inimigos mais lentos · Mais curas',
    playerMaxHp: 140,
    enemyDamageMult: 0.7,
    enemyHpMult: 0.85,
    enemySpeedMult: 0.88,
    windupMult: 1.25,
    scoreMult: 0.85,
    healDropBonus: 0.18,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: '100 HP · Experiência arcade balanceada',
    playerMaxHp: 100,
    enemyDamageMult: 1.0,
    enemyHpMult: 1.0,
    enemySpeedMult: 1.0,
    windupMult: 1.0,
    scoreMult: 1.0,
    healDropBonus: 0,
  },
  hard: {
    id: 'hard',
    label: 'Difícil',
    description: '80 HP · Inimigos implacáveis · Pontos 1.5×',
    playerMaxHp: 80,
    enemyDamageMult: 1.45,
    enemyHpMult: 1.25,
    enemySpeedMult: 1.15,
    windupMult: 0.82,
    scoreMult: 1.5,
    healDropBonus: -0.06,
  },
};

export interface Platform {
  id: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  z: number;
  style: 'roof' | 'bamboo_deck' | 'catwalk' | 'balcony';
}

export type HazardKind =
  | 'temple_fire'
  | 'electric_pool'
  | 'poison_mire'
  | 'molten_lava'
  | 'frost_fissure'
  | 'eclipse_fire'
  | 'cave_rockfall';

export interface EnvironmentalHazard {
  id: number;
  kind: HazardKind;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  damagePerTick: number;
  tickInterval: number;
  label: string;
  life?: number;
  maxLife?: number;
  isStormDynamic?: boolean;
}

export interface FallingDebris {
  id: number;
  x: number;
  y: number;
  z: number;
  groundZ: number;
  vz: number;
  radius: number;
  warnTimer: number;
  maxWarn: number;
  state: 'warning' | 'falling' | 'impacted';
  impactTimer: number;
  damage: number;
  seed: number;
  rockKind: 'obsidian' | 'stalactite' | 'ruin_stone';
}

export type EnemyType =
  | 'scout'
  | 'ronin'
  | 'kunoichi'
  | 'oni'
  | 'boss_kagerou'
  | 'boss_hotaru'
  | 'boss_raiden'
  | 'boss_kurogane'
  | 'boss_umigame'
  | 'boss_tetsujin'
  | 'boss_yuki'
  | 'boss_enma'
  | 'boss_tetsuo'
  | 'boss_akuma';

export interface ScarfNode {
  x: number;
  y: number;
}

export interface Afterimage {
  x: number;
  y: number;
  z: number;
  facing: 1 | -1;
  alpha: number;
  pose: 'dash' | 'somersault' | 'air' | 'airKick';
  frameIndex?: number;
  lean?: number;
  squashX?: number;
  squashY?: number;
  tint?: 'shadow' | 'crimson' | 'cyan';
}

export interface Player {
  x: number;
  y: number;
  z: number;
  groundZ: number;
  vx: number;
  vy: number;
  vz: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  chi: number;
  maxChi: number;
  shurikens: number;
  maxShurikens: number;
  shurikenRecharge: number;
  jumpsUsed: number;
  somersaultTimer: number;
  activeNinjutsu: NinjutsuType;
  shieldHits: number;
  fushinTimer: number;
  nightVisionTimer: number;
  comboStep: 0 | 1 | 2 | 3 | 4;
  attackTimer: number;
  attackDuration: number;
  attackHitIds: Set<number>;
  queuedAttack: boolean;
  throwTimer: number;
  hurtTimer: number;
  dashTimer: number;
  dashCooldown: number;
  invulnTimer: number;
  hitFlashTimer: number;
  squashX: number;
  squashY: number;
  runCycle: number;
  specialTimer: number;
  moonFury: number;
  maxMoonFury: number;
  moonFuryTimer: number;
  scarf: ScarfNode[];
}

export type EnemyAIState = 'idle' | 'chase' | 'windup' | 'attack' | 'recover' | 'hurt' | 'retreat';

export interface Enemy {
  id: number;
  type: EnemyType;
  name: string;
  isBoss: boolean;
  x: number;
  y: number;
  z: number;
  groundZ: number;
  vx: number;
  vy: number;
  vz: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  aiState: EnemyAIState;
  stateTimer: number;
  attackCooldown: number;
  attackKind: 'melee' | 'ranged' | 'slam' | 'dash_slash' | 'summon';
  hitFlashTimer: number;
  squashX: number;
  squashY: number;
  runCycle: number;
  superArmor: boolean;
  bossPhase: 1 | 2;
  summonedAdds: boolean;
  summonCooldown: number;
  jutsuSealActive: boolean;
  dashTargetX?: number;
  dashTargetY?: number;
  alertTimer?: number;
  alertFlashTimer?: number;
  patrolAnchorX?: number;
  patrolDir?: 1 | -1;
  hazardStatus?: 'shock' | 'burn' | 'poison' | 'frost' | null;
  hazardSlowTimer?: number;
  hazardStunTimer?: number;
  hazardDotTimer?: number;
  hazardDotTickTimer?: number;
  crateBumpCooldown?: number;
}

export interface ShadowClone {
  id: number;
  x: number;
  y: number;
  z: number;
  groundZ: number;
  vx: number;
  vy: number;
  vz: number;
  facing: 1 | -1;
  life: number;
  maxLife: number;
  attackCooldown: number;
  attackTimer: number;
  throwTimer: number;
  runCycle: number;
}

export interface Projectile {
  id: number;
  fromPlayer: boolean;
  kind: 'shuriken' | 'kunai' | 'fire_dragon';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  rotation: number;
  life: number;
  radius: number;
  hitIds?: Set<number>;
  countForPrecision?: boolean;
}

export type PickupKind = 'onigiri' | 'chi_scroll' | 'jade' | 'shuriken_pack';

export interface Pickup {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  z: number;
  vz: number;
  life: number;
  bobPhase: number;
}

export interface Crate {
  id: number;
  kind: 'wooden_crate' | 'stone_lantern' | 'fire_brazier';
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  hitFlashTimer: number;
  wobble: number;
  drop: PickupKind;
}

export interface Civilian {
  id: number;
  x: number;
  y: number;
  z: number;
  facing: 1 | -1;
  state: 'captive' | 'rescued' | 'harmed';
  timer: number;
  bobPhase: number;
  hitFlashTimer: number;
}

export interface Particle {
  active: boolean;
  kind: 'spark' | 'blood_ink' | 'blood_pixel' | 'petal' | 'smoke' | 'dust' | 'ember' | 'leaf' | 'lightning';
  x: number;
  y: number;
  z: number;
  groundZ?: number;
  splattered?: boolean;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
}

export interface SurfaceMark {
  x: number;
  y: number;
  z: number;
  platformId: number | null;
  kind: 'katana_slash' | 'blood_splat';
  angle: number;
  length: number;
  thickness: number;
  color: string;
  life: number;
  maxLife: number;
  seed: number;
}

export interface SlashArc {
  x: number;
  y: number;
  z: number;
  facing: 1 | -1;
  step: 1 | 2 | 3 | 4;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
}

export interface FloatingText {
  x: number;
  y: number;
  z: number;
  vy: number;
  text: string;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

export interface HudSnapshot {
  stageId: StageId;
  stageIndex: number;
  stageTitle: string;
  difficulty: Difficulty;
  hp: number;
  maxHp: number;
  chi: number;
  maxChi: number;
  shurikens: number;
  maxShurikens: number;
  activeNinjutsu: NinjutsuType;
  requiredJutsu: NinjutsuType;
  requiredJutsuBroken: boolean;
  clonesCount: number;
  shieldHits: number;
  fushinTimer: number;
  nightVisionTimer: number;
  denseFog: boolean;
  weatherKind: WeatherKind;
  weatherLabel: string;
  weatherEffect: string;
  weatherDetectionPct: number;
  weatherDetectionRange: number;
  weatherTacticalTip: string;
  activeHazardWarning: {
    kind: HazardKind;
    label: string;
    inside: boolean;
  } | null;
  score: number;
  comboCount: number;
  comboDecayPct: number;
  maxCombo: number;
  comboDamageMult: number;
  comboRank: string;
  moonFury: number;
  maxMoonFury: number;
  karma: number;
  karmaLabel: string;
  karmaAlignment: KarmaAlignmentId;
  karmaReward: KarmaFinalReward | null;
  civiliansRescued: number;
  civiliansHarmed: number;
  stageCiviliansRescued: number;
  stageCiviliansHarmed: number;
  stageCiviliansTotal: number;
  waveIndex: number;
  totalWaves: number;
  zoneName: string;
  enemiesDefeated: number;
  elapsedSeconds: number;
  goPrompt: boolean;
  boss: {
    name: string;
    hp: number;
    maxHp: number;
    phase: 1 | 2;
    sealActive: boolean;
  } | null;
  bossIntro: {
    bossName: string;
    subtitle: string;
    accentHex: string;
  } | null;
  bannerText: string | null;
  performance: StagePerformanceEval;
}

export type KarmaAlignmentId = 'luminous' | 'protector' | 'neutral' | 'ruthless' | 'crimson';

export interface KarmaDialogueLine {
  speaker: string;
  role: string;
  tone: 'honor' | 'neutral' | 'shadow';
  text: string;
}

export interface KarmaFinalReward {
  alignmentId: KarmaAlignmentId;
  alignmentTitle: string;
  badgeLabel: string;
  rewardItemName: string;
  rewardTitle: string;
  rewardDescription: string;
  baseBonusPoints: number;
  perUnitBonus: number;
  unitLabel: string;
  unitCount: number;
  totalRewardPoints: number;
  accentColor: string;
}

export type StageRankGrade = 'S' | 'A' | 'B' | 'C';

export interface StagePerformanceEval {
  rank: StageRankGrade;
  performanceScore: number;
  elapsedSeconds: number;
  damageTaken: number;
  comboAccuracy: number;
  maxCombo: number;
  timeGrade: StageRankGrade;
  damageGrade: StageRankGrade;
  comboGrade: StageRankGrade;
}

export interface InputState {
  held: {
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  };
  justPressed: {
    attack: boolean;
    shuriken: boolean;
    jump: boolean;
    dash: boolean;
    special: boolean;
    moonFury: boolean;
  };
  jumpBufferTimer: number;
  attackBufferTimer: number;
}

export type WeatherKind = 'clear' | 'snow' | 'rain' | 'fog' | 'storm' | 'ash';

export interface WeatherDrop {
  x: number;
  y: number;
  speed: number;
  vx: number;
  length: number;
  size: number;
  alpha: number;
  layer: 0 | 1;
  phase: number;
}

export interface WeatherSplash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  kind: WeatherKind;
}

export interface WeatherState {
  currentKind: WeatherKind;
  targetKind: WeatherKind;
  blend: number;
  intensity: number;
  targetIntensity: number;
  windX: number;
  targetWindX: number;
  lightningAlpha: number;
  visibilityPenalty: number;
  drops: WeatherDrop[];
  splashes: WeatherSplash[];
}

