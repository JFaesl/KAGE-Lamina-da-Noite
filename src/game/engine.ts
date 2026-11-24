import {
  AchievementDef,
  AchievementId,
  recordNinjutsuUsedInStore,
  unlockAchievementInStore,
} from './achievements';
import { NinjaAudio } from './audio';
import { recordEnemyDefeatedInStore } from './bestiary';
import {
  computeKarmaFinalReward,
  getKarmaAlignmentId,
  getKarmaLabel,
  recordKarmaEndingInStore,
} from './karma';
import { FLOOR_BOTTOM, FLOOR_TOP, LOGICAL_WIDTH, PIXEL_HEIGHT, PIXEL_WIDTH, renderGameFrame } from './renderer';
import {
  Afterimage,
  Civilian,
  Crate,
  DIFFICULTIES,
  Difficulty,
  Enemy,
  EnemyType,
  EnvironmentalHazard,
  FallingDebris,
  FloatingText,
  HudSnapshot,
  InputState,
  KarmaFinalReward,
  NINJUTSU_LIST,
  NinjutsuType,
  Particle,
  Pickup,
  PickupKind,
  Platform,
  Player,
  Projectile,
  ShadowClone,
  SlashArc,
  STAGES,
  StageId,
  SurfaceMark,
  WeatherDrop,
  WeatherKind,
  WeatherState,
} from './types';

interface ZoneDef {
  name: string;
  triggerX: number;
  lockCamX: number;
  isBoss?: boolean;
  spawns: Array<{ type: EnemyType; offsetX: number; y: number; elevated?: boolean }>;
}

interface StageDef {
  id: StageId;
  platforms: Omit<Platform, 'id'>[];
  zones: ZoneDef[];
  crates: Array<{ x: number; y: number; z?: number; kind: Crate['kind']; drop: PickupKind }>;
  civilians: Array<{ x: number; y: number; z?: number; facing?: 1 | -1 }>;
}

const WORLD_MIN_X = 36;
const WORLD_MAX_X = 3804;
const MAX_CAMERA_X = 3840 - LOGICAL_WIDTH; // 2560

const STAGE_DEFS: Record<StageId, StageDef> = {
  village: {
    id: 'village',
    platforms: [
      { x1: 420, x2: 720, y1: 420, y2: 495, z: 102, style: 'roof' },
      { x1: 1520, x2: 1860, y1: 425, y2: 500, z: 108, style: 'roof' },
      { x1: 2120, x2: 2420, y1: 505, y2: 580, z: 92, style: 'roof' },
      { x1: 3020, x2: 3380, y1: 425, y2: 500, z: 106, style: 'roof' },
    ],
    zones: [
      {
        name: 'Entrada da Vila',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'scout', offsetX: 880, y: 465 },
          { type: 'kunoichi', offsetX: 570, y: 455, elevated: true },
          { type: 'ronin', offsetX: 1120, y: 545 },
          { type: 'scout', offsetX: 1250, y: 445 },
        ],
      },
      {
        name: 'Ponte das Lanternas',
        triggerX: 1240,
        lockCamX: 1180,
        spawns: [
          { type: 'ronin', offsetX: 1180 + 1040, y: 485 },
          { type: 'kunoichi', offsetX: 1690, y: 460, elevated: true },
          { type: 'kunoichi', offsetX: 2260, y: 540, elevated: true },
          { type: 'scout', offsetX: 1180 - 30, y: 560 },
          { type: 'ronin', offsetX: 1180 + 1180, y: 605 },
        ],
      },
      {
        name: 'Telhado do Clã',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_kagerou', offsetX: 2560 + 1080, y: 525 }],
      },
    ],
    crates: [
      { x: 560, y: 455, z: 102, kind: 'wooden_crate', drop: 'shuriken_pack' },
      { x: 1100, y: 618, kind: 'stone_lantern', drop: 'onigiri' },
      { x: 1690, y: 460, z: 108, kind: 'wooden_crate', drop: 'chi_scroll' },
      { x: 2420, y: 616, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 3200, y: 460, z: 106, kind: 'stone_lantern', drop: 'onigiri' },
    ],
    civilians: [
      { x: 645, y: 455, z: 102, facing: -1 },
      { x: 1580, y: 560, facing: -1 },
      { x: 2740, y: 590, facing: -1 },
    ],
  },
  bamboo: {
    id: 'bamboo',
    platforms: [
      { x1: 380, x2: 700, y1: 430, y2: 505, z: 98, style: 'bamboo_deck' },
      { x1: 1460, x2: 1800, y1: 425, y2: 500, z: 108, style: 'bamboo_deck' },
      { x1: 2040, x2: 2360, y1: 515, y2: 590, z: 96, style: 'bamboo_deck' },
      { x1: 2940, x2: 3320, y1: 428, y2: 505, z: 106, style: 'bamboo_deck' },
    ],
    zones: [
      {
        name: 'Trilha das Cachoeiras',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'scout', offsetX: 900, y: 460 },
          { type: 'kunoichi', offsetX: 540, y: 465, elevated: true },
          { type: 'ronin', offsetX: 1080, y: 585 },
          { type: 'kunoichi', offsetX: 1240, y: 560 },
        ],
      },
      {
        name: 'Santuário Torii',
        triggerX: 1260,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1140, y: 525 },
          { type: 'kunoichi', offsetX: 1630, y: 460, elevated: true },
          { type: 'kunoichi', offsetX: 2190, y: 550, elevated: true },
          { type: 'ronin', offsetX: 1180 - 40, y: 590 },
        ],
      },
      {
        name: 'Clareira Esmeralda',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_hotaru', offsetX: 2560 + 1090, y: 525 }],
      },
    ],
    crates: [
      { x: 540, y: 465, z: 98, kind: 'stone_lantern', drop: 'chi_scroll' },
      { x: 1080, y: 620, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 1630, y: 460, z: 108, kind: 'wooden_crate', drop: 'shuriken_pack' },
      { x: 2420, y: 612, kind: 'wooden_crate', drop: 'jade' },
      { x: 3130, y: 465, z: 106, kind: 'stone_lantern', drop: 'onigiri' },
    ],
    civilians: [
      { x: 625, y: 465, z: 98, facing: -1 },
      { x: 1715, y: 460, z: 108, facing: -1 },
      { x: 2720, y: 585, facing: -1 },
    ],
  },
  neon_city: {
    id: 'neon_city',
    platforms: [
      { x1: 400, x2: 730, y1: 428, y2: 502, z: 104, style: 'catwalk' },
      { x1: 1470, x2: 1820, y1: 425, y2: 500, z: 110, style: 'catwalk' },
      { x1: 2050, x2: 2370, y1: 512, y2: 586, z: 94, style: 'catwalk' },
      { x1: 2950, x2: 3320, y1: 425, y2: 500, z: 106, style: 'catwalk' },
    ],
    zones: [
      {
        name: 'Avenida Néon',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'scout', offsetX: 880, y: 470 },
          { type: 'kunoichi', offsetX: 560, y: 465, elevated: true },
          { type: 'ronin', offsetX: 1100, y: 580 },
          { type: 'scout', offsetX: 1240, y: 445 },
        ],
      },
      {
        name: 'Viaduto Ferroviário',
        triggerX: 1260,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1120, y: 520 },
          { type: 'kunoichi', offsetX: 1640, y: 460, elevated: true },
          { type: 'kunoichi', offsetX: 2200, y: 545, elevated: true },
          { type: 'ronin', offsetX: 1180 - 35, y: 590 },
        ],
      },
      {
        name: 'Estação Sombria',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_raiden', offsetX: 2560 + 1090, y: 525 }],
      },
    ],
    crates: [
      { x: 560, y: 465, z: 104, kind: 'wooden_crate', drop: 'shuriken_pack' },
      { x: 1080, y: 620, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 1640, y: 460, z: 110, kind: 'wooden_crate', drop: 'chi_scroll' },
      { x: 2420, y: 612, kind: 'wooden_crate', drop: 'jade' },
      { x: 3130, y: 465, z: 106, kind: 'wooden_crate', drop: 'onigiri' },
    ],
    civilians: [
      { x: 650, y: 465, z: 104, facing: -1 },
      { x: 1540, y: 580, facing: -1 },
      { x: 2740, y: 590, facing: -1 },
    ],
  },
  fortress: {
    id: 'fortress',
    platforms: [
      { x1: 420, x2: 740, y1: 428, y2: 502, z: 104, style: 'balcony' },
      { x1: 1480, x2: 1840, y1: 425, y2: 500, z: 112, style: 'balcony' },
      { x1: 2060, x2: 2380, y1: 515, y2: 590, z: 94, style: 'balcony' },
      { x1: 2960, x2: 3340, y1: 425, y2: 500, z: 108, style: 'balcony' },
    ],
    zones: [
      {
        name: 'Muralha das Brasas',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'ronin', offsetX: 880, y: 465 },
          { type: 'oni', offsetX: 1120, y: 535 },
          { type: 'kunoichi', offsetX: 580, y: 465, elevated: true },
          { type: 'scout', offsetX: 1040, y: 605 },
        ],
      },
      {
        name: 'Salão Carmesim',
        triggerX: 1260,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1100, y: 475 },
          { type: 'oni', offsetX: 1180 + 1240, y: 600 },
          { type: 'kunoichi', offsetX: 1650, y: 460, elevated: true },
          { type: 'ronin', offsetX: 1180 - 35, y: 560 },
        ],
      },
      {
        name: 'Trono do Shogun',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_kurogane', offsetX: 2560 + 1090, y: 525 }],
      },
    ],
    crates: [
      { x: 580, y: 465, z: 104, kind: 'fire_brazier', drop: 'chi_scroll' },
      { x: 1090, y: 618, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 1660, y: 460, z: 112, kind: 'fire_brazier', drop: 'shuriken_pack' },
      { x: 2440, y: 616, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 3150, y: 462, z: 108, kind: 'fire_brazier', drop: 'onigiri' },
    ],
    civilians: [
      { x: 665, y: 465, z: 104, facing: -1 },
      { x: 1740, y: 460, z: 112, facing: -1 },
      { x: 2740, y: 590, facing: -1 },
    ],
  },
  harbor: {
    id: 'harbor',
    platforms: [
      { x1: 420, x2: 740, y1: 430, y2: 505, z: 96, style: 'roof' },
      { x1: 1500, x2: 1840, y1: 425, y2: 500, z: 104, style: 'roof' },
      { x1: 2080, x2: 2400, y1: 510, y2: 585, z: 92, style: 'roof' },
      { x1: 2980, x2: 3340, y1: 428, y2: 502, z: 102, style: 'roof' },
    ],
    zones: [
      {
        name: 'Cais da Neblina',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'scout', offsetX: 880, y: 465 },
          { type: 'ronin', offsetX: 1080, y: 565 },
          { type: 'kunoichi', offsetX: 580, y: 465, elevated: true },
          { type: 'scout', offsetX: 1220, y: 455 },
        ],
      },
      {
        name: 'Ponte dos Contrabandistas',
        triggerX: 1250,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1100, y: 515 },
          { type: 'kunoichi', offsetX: 1670, y: 460, elevated: true },
          { type: 'ronin', offsetX: 1180 + 1220, y: 600 },
          { type: 'scout', offsetX: 1180 - 30, y: 550 },
        ],
      },
      {
        name: 'Convés do Capitão',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_umigame', offsetX: 2560 + 1080, y: 525 }],
      },
    ],
    crates: [
      { x: 560, y: 465, z: 96, kind: 'wooden_crate', drop: 'chi_scroll' },
      { x: 1090, y: 615, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 1660, y: 460, z: 104, kind: 'stone_lantern', drop: 'shuriken_pack' },
      { x: 2420, y: 610, kind: 'wooden_crate', drop: 'chi_scroll' },
      { x: 3150, y: 465, z: 102, kind: 'wooden_crate', drop: 'onigiri' },
    ],
    civilians: [
      { x: 660, y: 465, z: 96, facing: -1 },
      { x: 1600, y: 575, facing: -1 },
      { x: 2740, y: 590, facing: -1 },
    ],
  },
  mines: {
    id: 'mines',
    platforms: [
      { x1: 400, x2: 720, y1: 428, y2: 502, z: 100, style: 'catwalk' },
      { x1: 1480, x2: 1820, y1: 425, y2: 500, z: 108, style: 'catwalk' },
      { x1: 2050, x2: 2370, y1: 512, y2: 586, z: 94, style: 'catwalk' },
      { x1: 2960, x2: 3320, y1: 425, y2: 500, z: 106, style: 'catwalk' },
    ],
    zones: [
      {
        name: 'Galeria dos Cristais',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'ronin', offsetX: 890, y: 470 },
          { type: 'oni', offsetX: 1120, y: 560 },
          { type: 'kunoichi', offsetX: 560, y: 465, elevated: true },
          { type: 'scout', offsetX: 1210, y: 450 },
        ],
      },
      {
        name: 'Trilhos Profundos',
        triggerX: 1260,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1090, y: 495 },
          { type: 'ronin', offsetX: 1180 + 1230, y: 595 },
          { type: 'kunoichi', offsetX: 1650, y: 460, elevated: true },
          { type: 'kunoichi', offsetX: 2210, y: 545, elevated: true },
        ],
      },
      {
        name: 'Fornalha de Obsidiana',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_tetsujin', offsetX: 2560 + 1090, y: 525 }],
      },
    ],
    crates: [
      { x: 560, y: 465, z: 100, kind: 'wooden_crate', drop: 'shuriken_pack' },
      { x: 1090, y: 618, kind: 'fire_brazier', drop: 'chi_scroll' },
      { x: 1650, y: 460, z: 108, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 2430, y: 615, kind: 'fire_brazier', drop: 'jade' },
      { x: 3140, y: 462, z: 106, kind: 'fire_brazier', drop: 'onigiri' },
    ],
    civilians: [
      { x: 645, y: 465, z: 100, facing: -1 },
      { x: 1730, y: 460, z: 108, facing: -1 },
      { x: 2740, y: 585, facing: -1 },
    ],
  },
  snow_peak: {
    id: 'snow_peak',
    platforms: [
      { x1: 390, x2: 710, y1: 428, y2: 502, z: 106, style: 'bamboo_deck' },
      { x1: 1470, x2: 1810, y1: 425, y2: 500, z: 114, style: 'bamboo_deck' },
      { x1: 2050, x2: 2370, y1: 515, y2: 590, z: 98, style: 'bamboo_deck' },
      { x1: 2950, x2: 3330, y1: 425, y2: 500, z: 110, style: 'bamboo_deck' },
    ],
    zones: [
      {
        name: 'Encosta Congelada',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'scout', offsetX: 880, y: 460 },
          { type: 'kunoichi', offsetX: 550, y: 465, elevated: true },
          { type: 'ronin', offsetX: 1080, y: 575 },
          { type: 'kunoichi', offsetX: 1240, y: 520 },
        ],
      },
      {
        name: 'Desfiladeiro Branco',
        triggerX: 1260,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1120, y: 525 },
          { type: 'kunoichi', offsetX: 1640, y: 460, elevated: true },
          { type: 'kunoichi', offsetX: 2210, y: 550, elevated: true },
          { type: 'ronin', offsetX: 1180 - 35, y: 585 },
        ],
      },
      {
        name: 'Altar da Nevasca',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_yuki', offsetX: 2560 + 1090, y: 525 }],
      },
    ],
    crates: [
      { x: 550, y: 465, z: 106, kind: 'stone_lantern', drop: 'chi_scroll' },
      { x: 1080, y: 615, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 1640, y: 460, z: 114, kind: 'stone_lantern', drop: 'shuriken_pack' },
      { x: 2420, y: 610, kind: 'wooden_crate', drop: 'chi_scroll' },
      { x: 3140, y: 462, z: 110, kind: 'stone_lantern', drop: 'onigiri' },
    ],
    civilians: [
      { x: 635, y: 465, z: 106, facing: -1 },
      { x: 1580, y: 565, facing: -1 },
      { x: 2740, y: 590, facing: -1 },
    ],
  },
  temple_ruins: {
    id: 'temple_ruins',
    platforms: [
      { x1: 420, x2: 740, y1: 428, y2: 502, z: 102, style: 'balcony' },
      { x1: 1480, x2: 1840, y1: 425, y2: 500, z: 110, style: 'balcony' },
      { x1: 2060, x2: 2380, y1: 515, y2: 590, z: 94, style: 'balcony' },
      { x1: 2960, x2: 3340, y1: 425, y2: 500, z: 106, style: 'balcony' },
    ],
    zones: [
      {
        name: 'Cripta dos Selos',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'ronin', offsetX: 880, y: 465 },
          { type: 'oni', offsetX: 1120, y: 550 },
          { type: 'kunoichi', offsetX: 580, y: 465, elevated: true },
          { type: 'scout', offsetX: 1220, y: 595 },
        ],
      },
      {
        name: 'Câmara Rúnica',
        triggerX: 1260,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1090, y: 485 },
          { type: 'oni', offsetX: 1180 + 1230, y: 595 },
          { type: 'kunoichi', offsetX: 1650, y: 460, elevated: true },
          { type: 'ronin', offsetX: 1180 - 30, y: 555 },
        ],
      },
      {
        name: 'Santuário Profano',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_enma', offsetX: 2560 + 1090, y: 525 }],
      },
    ],
    crates: [
      { x: 580, y: 465, z: 102, kind: 'stone_lantern', drop: 'chi_scroll' },
      { x: 1090, y: 618, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 1660, y: 460, z: 110, kind: 'stone_lantern', drop: 'chi_scroll' },
      { x: 2440, y: 616, kind: 'wooden_crate', drop: 'jade' },
      { x: 3150, y: 462, z: 106, kind: 'fire_brazier', drop: 'onigiri' },
    ],
    civilians: [
      { x: 660, y: 465, z: 102, facing: -1 },
      { x: 1740, y: 460, z: 110, facing: -1 },
      { x: 2740, y: 590, facing: -1 },
    ],
  },
  bullet_train: {
    id: 'bullet_train',
    platforms: [
      { x1: 400, x2: 730, y1: 430, y2: 505, z: 96, style: 'catwalk' },
      { x1: 1470, x2: 1820, y1: 425, y2: 500, z: 104, style: 'catwalk' },
      { x1: 2050, x2: 2370, y1: 512, y2: 586, z: 92, style: 'catwalk' },
      { x1: 2950, x2: 3320, y1: 425, y2: 500, z: 104, style: 'catwalk' },
    ],
    zones: [
      {
        name: 'Vagão de Carga',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'scout', offsetX: 880, y: 470 },
          { type: 'kunoichi', offsetX: 560, y: 465, elevated: true },
          { type: 'ronin', offsetX: 1100, y: 580 },
          { type: 'oni', offsetX: 1240, y: 495 },
        ],
      },
      {
        name: 'Teto do Expresso',
        triggerX: 1260,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1110, y: 520 },
          { type: 'kunoichi', offsetX: 1640, y: 460, elevated: true },
          { type: 'kunoichi', offsetX: 2200, y: 545, elevated: true },
          { type: 'scout', offsetX: 1180 - 30, y: 575 },
        ],
      },
      {
        name: 'Locomotiva Fantasma',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_tetsuo', offsetX: 2560 + 1090, y: 525 }],
      },
    ],
    crates: [
      { x: 560, y: 465, z: 96, kind: 'wooden_crate', drop: 'chi_scroll' },
      { x: 1080, y: 620, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 1640, y: 460, z: 104, kind: 'wooden_crate', drop: 'shuriken_pack' },
      { x: 2420, y: 612, kind: 'wooden_crate', drop: 'chi_scroll' },
      { x: 3130, y: 465, z: 104, kind: 'wooden_crate', drop: 'onigiri' },
    ],
    civilians: [
      { x: 645, y: 465, z: 96, facing: -1 },
      { x: 1560, y: 580, facing: -1 },
      { x: 2740, y: 590, facing: -1 },
    ],
  },
  eclipse_citadel: {
    id: 'eclipse_citadel',
    platforms: [
      { x1: 420, x2: 740, y1: 428, y2: 502, z: 104, style: 'balcony' },
      { x1: 1480, x2: 1840, y1: 425, y2: 500, z: 112, style: 'balcony' },
      { x1: 2060, x2: 2380, y1: 515, y2: 590, z: 96, style: 'balcony' },
      { x1: 2960, x2: 3340, y1: 425, y2: 500, z: 108, style: 'balcony' },
    ],
    zones: [
      {
        name: 'Escadaria do Eclipse',
        triggerX: 0,
        lockCamX: 0,
        spawns: [
          { type: 'ronin', offsetX: 880, y: 465 },
          { type: 'oni', offsetX: 1120, y: 540 },
          { type: 'kunoichi', offsetX: 580, y: 465, elevated: true },
          { type: 'oni', offsetX: 1220, y: 605 },
        ],
      },
      {
        name: 'Nave da Lua Negra',
        triggerX: 1260,
        lockCamX: 1180,
        spawns: [
          { type: 'oni', offsetX: 1180 + 1090, y: 475 },
          { type: 'oni', offsetX: 1180 + 1230, y: 600 },
          { type: 'kunoichi', offsetX: 1650, y: 460, elevated: true },
          { type: 'kunoichi', offsetX: 2210, y: 550, elevated: true },
        ],
      },
      {
        name: 'Trono do Imperador',
        triggerX: 2660,
        lockCamX: 2560,
        isBoss: true,
        spawns: [{ type: 'boss_akuma', offsetX: 2560 + 1090, y: 525 }],
      },
    ],
    crates: [
      { x: 580, y: 465, z: 104, kind: 'fire_brazier', drop: 'chi_scroll' },
      { x: 1090, y: 618, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 1660, y: 460, z: 112, kind: 'fire_brazier', drop: 'chi_scroll' },
      { x: 2440, y: 616, kind: 'wooden_crate', drop: 'onigiri' },
      { x: 3150, y: 462, z: 108, kind: 'fire_brazier', drop: 'onigiri' },
    ],
    civilians: [
      { x: 665, y: 465, z: 104, facing: -1 },
      { x: 1740, y: 460, z: 112, facing: -1 },
      { x: 2740, y: 590, facing: -1 },
    ],
  },
};

const STAGE_HAZARDS: Record<StageId, Array<Omit<EnvironmentalHazard, 'id'>>> = {
  village: [
    { kind: 'temple_fire', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 7, tickInterval: 0.28, label: 'Chamas do Templo' },
    { kind: 'temple_fire', x1: 1880, x2: 2010, y1: 420, y2: 535, damagePerTick: 7, tickInterval: 0.28, label: 'Chamas do Templo' },
    { kind: 'temple_fire', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 8, tickInterval: 0.28, label: 'Chamas do Templo' },
  ],
  bamboo: [
    { kind: 'poison_mire', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 7, tickInterval: 0.28, label: 'Poça Tóxica' },
    { kind: 'poison_mire', x1: 1870, x2: 2005, y1: 525, y2: 654, damagePerTick: 7, tickInterval: 0.28, label: 'Poça Tóxica' },
    { kind: 'poison_mire', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 8, tickInterval: 0.28, label: 'Poça Tóxica' },
  ],
  neon_city: [
    { kind: 'electric_pool', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 8, tickInterval: 0.26, label: 'Poça Elétrica' },
    { kind: 'electric_pool', x1: 1875, x2: 2010, y1: 420, y2: 540, damagePerTick: 8, tickInterval: 0.26, label: 'Poça Elétrica' },
    { kind: 'electric_pool', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 8, tickInterval: 0.26, label: 'Poça Elétrica' },
    { kind: 'electric_pool', x1: 3070, x2: 3205, y1: 530, y2: 652, damagePerTick: 8, tickInterval: 0.26, label: 'Poça Elétrica' },
  ],
  fortress: [
    { kind: 'electric_pool', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 8, tickInterval: 0.26, label: 'Poça Elétrica do Laboratório' },
    { kind: 'electric_pool', x1: 1885, x2: 2020, y1: 420, y2: 545, damagePerTick: 8, tickInterval: 0.26, label: 'Poça Elétrica do Laboratório' },
    { kind: 'electric_pool', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 9, tickInterval: 0.26, label: 'Poça Elétrica do Laboratório' },
    { kind: 'electric_pool', x1: 3075, x2: 3210, y1: 530, y2: 652, damagePerTick: 9, tickInterval: 0.26, label: 'Poça Elétrica do Laboratório' },
  ],
  harbor: [
    { kind: 'electric_pool', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 8, tickInterval: 0.26, label: 'Água Eletrificada' },
    { kind: 'electric_pool', x1: 1880, x2: 2015, y1: 525, y2: 652, damagePerTick: 8, tickInterval: 0.26, label: 'Água Eletrificada' },
    { kind: 'electric_pool', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 8, tickInterval: 0.26, label: 'Água Eletrificada' },
  ],
  mines: [
    { kind: 'molten_lava', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 9, tickInterval: 0.26, label: 'Fenda de Magma' },
    { kind: 'molten_lava', x1: 1875, x2: 2010, y1: 420, y2: 540, damagePerTick: 9, tickInterval: 0.26, label: 'Fenda de Magma' },
    { kind: 'molten_lava', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 9, tickInterval: 0.26, label: 'Fenda de Magma' },
    { kind: 'molten_lava', x1: 3075, x2: 3210, y1: 530, y2: 652, damagePerTick: 9, tickInterval: 0.26, label: 'Fenda de Magma' },
  ],
  snow_peak: [
    { kind: 'frost_fissure', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 8, tickInterval: 0.26, label: 'Fenda Criogênica' },
    { kind: 'frost_fissure', x1: 1875, x2: 2010, y1: 525, y2: 652, damagePerTick: 8, tickInterval: 0.26, label: 'Fenda Criogênica' },
    { kind: 'frost_fissure', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 9, tickInterval: 0.26, label: 'Fenda Criogênica' },
  ],
  temple_ruins: [
    { kind: 'temple_fire', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 9, tickInterval: 0.25, label: 'Fogo Profano do Templo' },
    { kind: 'temple_fire', x1: 1880, x2: 2015, y1: 420, y2: 540, damagePerTick: 9, tickInterval: 0.25, label: 'Fogo Profano do Templo' },
    { kind: 'temple_fire', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 9, tickInterval: 0.25, label: 'Fogo Profano do Templo' },
    { kind: 'temple_fire', x1: 3075, x2: 3210, y1: 530, y2: 652, damagePerTick: 9, tickInterval: 0.25, label: 'Fogo Profano do Templo' },
  ],
  bullet_train: [
    { kind: 'electric_pool', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 9, tickInterval: 0.25, label: 'Trilho de Alta Tensão' },
    { kind: 'electric_pool', x1: 1875, x2: 2010, y1: 420, y2: 540, damagePerTick: 9, tickInterval: 0.25, label: 'Trilho de Alta Tensão' },
    { kind: 'electric_pool', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 10, tickInterval: 0.25, label: 'Trilho de Alta Tensão' },
    { kind: 'electric_pool', x1: 3075, x2: 3210, y1: 530, y2: 652, damagePerTick: 10, tickInterval: 0.25, label: 'Trilho de Alta Tensão' },
  ],
  eclipse_citadel: [
    { kind: 'electric_pool', x1: 1295, x2: 1430, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 10, tickInterval: 0.24, label: 'Poça de Energia Negra' },
    { kind: 'eclipse_fire', x1: 1880, x2: 2015, y1: 420, y2: 540, damagePerTick: 10, tickInterval: 0.24, label: 'Chamas do Eclipse' },
    { kind: 'eclipse_fire', x1: 2480, x2: 2615, y1: FLOOR_TOP + 2, y2: FLOOR_BOTTOM - 2, damagePerTick: 10, tickInterval: 0.24, label: 'Chamas do Eclipse' },
    { kind: 'eclipse_fire', x1: 3075, x2: 3210, y1: 530, y2: 652, damagePerTick: 10, tickInterval: 0.24, label: 'Chamas do Eclipse' },
  ],
};

interface TimeWeatherStop {
  kind: WeatherKind;
  intensity: number;
  windX: number;
  visibilityPenalty: number;
  detectionPct: number;
  playerDetectionRange: number;
  enemyDetectionRange: number;
  label: string;
  effect: string;
  tacticalTip: string;
  toastText: string;
  toastColor: string;
}

const WEATHER_MIN_DURATION = 12;
const WEATHER_MAX_DURATION = 20;

const TIME_WEATHER_CYCLE: TimeWeatherStop[] = [
  {
    kind: 'rain',
    intensity: 0.68,
    windX: -68,
    visibilityPenalty: 0.3,
    detectionPct: 55,
    playerDetectionRange: 460,
    enemyDetectionRange: 430,
    label: 'Chuva',
    effect: '-Visib. / Detecção 55%',
    tacticalTip: 'Chuva abafa passos · Distância média',
    toastText: 'CLIMA ALEATÓRIO: CHUVA (DETECÇÃO 55%)',
    toastColor: '#38BDF8',
  },
  {
    kind: 'storm',
    intensity: 1.0,
    windX: -125,
    visibilityPenalty: 0.44,
    detectionPct: 45,
    playerDetectionRange: 390,
    enemyDetectionRange: 365,
    label: 'Tempestade',
    effect: 'Raios & Detecção 45%',
    tacticalTip: 'Raios revelam alvos · Evite poças',
    toastText: 'CLIMA ALEATÓRIO: TEMPESTADE! POÇAS & RAIOS!',
    toastColor: '#7DD3FC',
  },
  {
    kind: 'snow',
    intensity: 0.96,
    windX: -148,
    visibilityPenalty: 0.62,
    detectionPct: 35,
    playerDetectionRange: 300,
    enemyDetectionRange: 285,
    label: 'Neve',
    effect: '--Visib. / Detecção 35%',
    tacticalTip: 'Nevasca reduz alcance · Flanqueie lento',
    toastText: 'CLIMA ALEATÓRIO: NEVASCA (DETECÇÃO 35%)',
    toastColor: '#E0F2FE',
  },
  {
    kind: 'fog',
    intensity: 0.16,
    windX: -22,
    visibilityPenalty: 0.8,
    detectionPct: 26,
    playerDetectionRange: 235,
    enemyDetectionRange: 225,
    label: 'Névoa Densa',
    effect: 'Furtivo · Detecção 26%',
    tacticalTip: 'Visão curta · Emboscadas ou Visão Noturna (6+E)',
    toastText: 'CLIMA ALEATÓRIO: NÉVOA DENSA (DETECÇÃO 26%)',
    toastColor: '#5EEAD4',
  },
  {
    kind: 'clear',
    intensity: 0,
    windX: -12,
    visibilityPenalty: 0,
    detectionPct: 100,
    playerDetectionRange: 960,
    enemyDetectionRange: 900,
    label: 'Lua Carmesim',
    effect: 'Detecção 100% / +Agressiv.',
    tacticalTip: 'Visão total · Inimigos agressivos',
    toastText: 'CLIMA ALEATÓRIO: LUA CARMESIM (DETECÇÃO 100%)',
    toastColor: '#FB7185',
  },
];

export class NinjaGameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public audio: NinjaAudio;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private running = false;
  private paused = false;

  private stageId: StageId = 'village';
  private difficulty: Difficulty = 'normal';

  private time = 0;
  private elapsedSeconds = 0;
  private hitstopTimer = 0;
  private shakeTrauma = 0;
  private shakeDirX = 0;
  private shakeDirY = 0;
  private shakePhase = 0;
  private specialFlash = 0;
  private moonFuryFlash = 0;

  private cameraX = 0;
  private currentZoneIndex = 0;
  private zoneActive = true;
  private zoneCleared = false;
  private bannerText: string | null = null;
  private bannerTimer = 0;

  private nextId = 1;
  private score = 0;
  private comboCount = 0;
  private comboDecayTimer = 0;
  private maxCombo = 0;
  private enemiesDefeated = 0;
  private karma = 0;
  private civiliansRescued = 0;
  private civiliansHarmed = 0;
  private stageCiviliansRescued = 0;
  private stageCiviliansHarmed = 0;
  private stageCiviliansTotal = 0;
  private lastVictoryKarmaReward: KarmaFinalReward | null = null;

  private platforms: Platform[] = [];
  private hazards: EnvironmentalHazard[] = [];
  private fallingDebris: FallingDebris[] = [];
  private debrisSpawnTimer = 2.6;
  private stormPuddleTimer = 1.4;
  private enemyHazardTimers = new Map<number, number>();
  private hazardTickTimer = 0;
  private hazardDashGraceTimer = 0;
  private hazardWarnCooldown = 0;
  private hazardCrossedCooldown = 0;
  private hazardSlowActive = false;
  private activeHazardWarning: HudSnapshot['activeHazardWarning'] = null;
  private player!: Player;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private pickups: Pickup[] = [];
  private crates: Crate[] = [];
  private civilians: Civilian[] = [];
  private clones: ShadowClone[] = [];
  private particles: Particle[] = [];
  private slashArcs: SlashArc[] = [];
  private surfaceMarks: SurfaceMark[] = [];
  private floatingTexts: FloatingText[] = [];
  private afterimages: Afterimage[] = [];
  private sealHintCooldown = 0;
  private ambientSpawnTimer = 0;
  private coyoteTimer = 0;
  private dashTrailTimer = 0;
  private playerPeakZ = 0;
  private katanaChainTimer = 0;
  private tookDamageThisStage = false;
  private damageTakenThisStage = 0;
  private stageMaxCombo = 0;
  private stageAttackAttempts = 0;
  private stageAttackHits = 0;
  private currentSwingHit = false;
  private bossSpawnTimestamp: number | null = null;
  private bossIntroTimer = 0;
  private activeBossIntro: { bossName: string; subtitle: string; accentHex: string } | null = null;
  private weather!: WeatherState;
  private weatherCycleTimer = 0;
  private weatherCycleIndex = 0;
  private nextWeatherDuration = 15;
  private lightningTimer = 4.2;

  private input: InputState = {
    held: { left: false, right: false, up: false, down: false },
    justPressed: { attack: false, shuriken: false, jump: false, dash: false, special: false, moonFury: false },
    jumpBufferTimer: 0,
    attackBufferTimer: 0,
  };

  private onHudUpdate: (snapshot: HudSnapshot) => void;
  private onGameEnd: (outcome: 'STAGE_CLEAR' | 'VICTORY' | 'GAME_OVER', snapshot: HudSnapshot) => void;
  private onAchievementUnlock?: (achievement: AchievementDef) => void;
  private onBestiaryUpdate?: () => void;
  private hudEmitTimer = 0;
  private lastHudHash = '';

  constructor(
    canvas: HTMLCanvasElement,
    audio: NinjaAudio,
    initialStage: StageId,
    initialDifficulty: Difficulty,
    onHudUpdate: (snapshot: HudSnapshot) => void,
    onGameEnd: (outcome: 'STAGE_CLEAR' | 'VICTORY' | 'GAME_OVER', snapshot: HudSnapshot) => void,
    onAchievementUnlock?: (achievement: AchievementDef) => void,
    onBestiaryUpdate?: () => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not acquire 2D rendering context');
    }
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    this.audio = audio;
    this.stageId = initialStage;
    this.difficulty = initialDifficulty;
    this.onHudUpdate = onHudUpdate;
    this.onGameEnd = onGameEnd;
    this.onAchievementUnlock = onAchievementUnlock;
    this.onBestiaryUpdate = onBestiaryUpdate;

    this.initParticlePool();
    this.resetStage(initialStage, initialDifficulty, 0);
    this.bindEvents();
  }

  private initParticlePool(): void {
    this.particles = [];
    for (let i = 0; i < 240; i++) {
      this.particles.push({
        active: false,
        kind: 'spark',
        x: 0,
        y: 0,
        z: 0,
        groundZ: 0,
        splattered: false,
        vx: 0,
        vy: 0,
        vz: 0,
        size: 3,
        color: '#FFFFFF',
        alpha: 1,
        life: 0,
        maxLife: 1,
        rotation: 0,
        vRot: 0,
      });
    }
  }

  public resetStage(stageId: StageId, difficulty: Difficulty, carryScore = 0, carryCampaign = false): void {
    this.stageId = stageId;
    this.difficulty = difficulty;
    const diffCfg = DIFFICULTIES[difficulty];
    const stageDef = STAGE_DEFS[stageId];

    this.time = 0;
    this.elapsedSeconds = 0;
    this.hitstopTimer = 0;
    this.shakeTrauma = 0;
    this.shakeDirX = 0;
    this.shakeDirY = 0;
    this.shakePhase = 0;
    this.specialFlash = 0;
    this.moonFuryFlash = 0;
    this.cameraX = 0;
    this.coyoteTimer = 0;
    this.dashTrailTimer = 0;
    this.playerPeakZ = 0;
    this.katanaChainTimer = 0;
    this.tookDamageThisStage = false;
    this.damageTakenThisStage = 0;
    this.stageMaxCombo = 0;
    this.stageAttackAttempts = 0;
    this.stageAttackHits = 0;
    this.currentSwingHit = false;
    this.bossSpawnTimestamp = null;
    this.bossIntroTimer = 0;
    this.activeBossIntro = null;
    this.currentZoneIndex = 0;
    this.zoneActive = false;
    this.zoneCleared = false;
    this.score = carryScore;
    this.comboCount = 0;
    this.comboDecayTimer = 0;
    this.stageCiviliansRescued = 0;
    this.stageCiviliansHarmed = 0;
    this.stageCiviliansTotal = stageDef.civilians.length;
    this.lastVictoryKarmaReward = null;
    if (!carryCampaign && carryScore === 0) {
      this.maxCombo = 0;
      this.enemiesDefeated = 0;
      this.karma = 0;
      this.civiliansRescued = 0;
      this.civiliansHarmed = 0;
    }
    this.nextId = 1;

    this.platforms = stageDef.platforms.map((pl) => ({ ...pl, id: this.nextId++ }));
    this.hazards = STAGE_HAZARDS[stageId].map((hz) => ({ ...hz, id: this.nextId++ }));
    this.fallingDebris = [];
    this.debrisSpawnTimer = stageId === 'mines' ? 1.8 : 3.2;
    this.stormPuddleTimer = 1.5;
    this.enemyHazardTimers.clear();
    this.hazardTickTimer = 0;
    this.hazardDashGraceTimer = 0;
    this.hazardWarnCooldown = 0;
    this.hazardCrossedCooldown = 0;
    this.hazardSlowActive = false;
    this.activeHazardWarning = null;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.crates = [];
    this.civilians = [];
    this.clones = [];
    this.sealHintCooldown = 0;
    this.slashArcs = [];
    this.surfaceMarks = [];
    this.floatingTexts = [];
    this.afterimages = [];
    for (const p of this.particles) p.active = false;

    this.initOrTransitionWeather(stageId, carryScore > 0);

    const startX = 220;
    const startY = 530;
    this.player = {
      x: startX,
      y: startY,
      z: 0,
      groundZ: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: 1,
      hp: diffCfg.playerMaxHp,
      maxHp: diffCfg.playerMaxHp,
      chi: 100, // Start with 1 full Ninjutsu charge ready (Revenge of Shinobi style!)
      maxChi: 100,
      shurikens: 8,
      maxShurikens: 8,
      shurikenRecharge: 0,
      jumpsUsed: 0,
      somersaultTimer: 0,
      activeNinjutsu: this.player ? this.player.activeNinjutsu : 'ikazuchi',
      shieldHits: 0,
      fushinTimer: 0,
      nightVisionTimer: 0,
      comboStep: 0,
      attackTimer: 0,
      attackDuration: 0.22,
      attackHitIds: new Set(),
      queuedAttack: false,
      throwTimer: 0,
      hurtTimer: 0,
      dashTimer: 0,
      dashCooldown: 0,
      invulnTimer: 0,
      hitFlashTimer: 0,
      squashX: 1,
      squashY: 1,
      runCycle: 0,
      specialTimer: 0,
      moonFury: 0,
      maxMoonFury: 100,
      moonFuryTimer: 0,
      scarf: Array.from({ length: 6 }, (_, i) => ({ x: startX - i * 8, y: startY - 96 })),
    };

    for (const spot of stageDef.crates) {
      this.crates.push({
        id: this.nextId++,
        kind: spot.kind,
        x: spot.x,
        y: spot.y,
        z: spot.z ?? 0,
        hp: 30,
        maxHp: 30,
        hitFlashTimer: 0,
        wobble: 0,
        drop: spot.drop,
      });
    }

    for (const spot of stageDef.civilians) {
      this.civilians.push({
        id: this.nextId++,
        x: spot.x,
        y: spot.y,
        z: spot.z ?? 0,
        facing: spot.facing ?? -1,
        state: 'captive',
        timer: 0,
        bobPhase: Math.random() * Math.PI * 2,
        hitFlashTimer: 0,
      });
    }

    for (let i = 0; i < 14; i++) {
      this.spawnBiomeParticle(Math.random() * LOGICAL_WIDTH);
    }

    this.activateZone(0);
    this.emitHud(true);
  }

  public selectNinjutsu(kind: NinjutsuType): void {
    this.player.activeNinjutsu = kind;
    this.emitHud(true);
  }

  private getSupportingPlatformZ(x: number, y: number, currentZ: number): number {
    let highest = 0;
    for (const plat of this.platforms) {
      if (x >= plat.x1 && x <= plat.x2 && y >= plat.y1 && y <= plat.y2 && currentZ >= plat.z - 6) {
        if (plat.z > highest) highest = plat.z;
      }
    }
    return highest;
  }

  private spawnBiomeParticle(x: number): void {
    if (this.stageId === 'village') {
      this.spawnParticle({
        kind: 'petal',
        x,
        y: FLOOR_TOP + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP),
        z: 100 + Math.random() * 240,
        vx: -32 - Math.random() * 28,
        vy: 8 + Math.random() * 14,
        vz: -20 - Math.random() * 14,
        size: 5,
        color: Math.random() > 0.35 ? '#FDA4AF' : '#FB7185',
        alpha: 0.85,
        maxLife: 5.5,
      });
    } else if (this.stageId === 'bamboo') {
      this.spawnParticle({
        kind: 'leaf',
        x,
        y: FLOOR_TOP + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP),
        z: 100 + Math.random() * 240,
        vx: -26 - Math.random() * 22,
        vy: 10 + Math.random() * 14,
        vz: -16 - Math.random() * 14,
        size: 5,
        color: Math.random() > 0.4 ? '#34D399' : '#10B981',
        alpha: 0.82,
        maxLife: 5.5,
      });
    } else if (this.stageId === 'neon_city' || this.stageId === 'bullet_train') {
      this.spawnParticle({
        kind: 'spark',
        x,
        y: FLOOR_TOP + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP),
        z: 120 + Math.random() * 220,
        vx: -28 + (Math.random() - 0.5) * 18,
        vy: 0,
        vz: -165 - Math.random() * 85,
        size: 3,
        color: Math.random() > 0.45 ? '#22D3EE' : '#E879F9',
        alpha: 0.78,
        maxLife: 1.6,
      });
    } else if (this.stageId === 'snow_peak' || this.stageId === 'harbor') {
      this.spawnParticle({
        kind: 'petal',
        x,
        y: FLOOR_TOP + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP),
        z: 100 + Math.random() * 240,
        vx: -48 - Math.random() * 34,
        vy: 8 + Math.random() * 14,
        vz: -24 - Math.random() * 16,
        size: 4,
        color: this.stageId === 'snow_peak' ? '#E0F2FE' : '#7DD3FC',
        alpha: 0.75,
        maxLife: 4.5,
      });
    } else {
      this.spawnParticle({
        kind: 'ember',
        x,
        y: FLOOR_TOP + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP),
        z: 10 + Math.random() * 120,
        vx: -18 + (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 16,
        vz: 48 + Math.random() * 44,
        size: 4,
        color: this.stageId === 'temple_ruins' ? '#A78BFA' : Math.random() > 0.4 ? '#FBBF24' : '#FB7185',
        alpha: 0.9,
        maxLife: 3.2,
      });
    }
  }

  public start(): void {
    this.audio.unlock();
    this.paused = false;
    if (!this.running) {
      this.running = true;
      this.lastTimestamp = performance.now();
      this.rafId = requestAnimationFrame(this.loop);
    }
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    if (!paused) {
      this.lastTimestamp = performance.now();
    } else {
      this.clearHeldInputs();
    }
  }

  public destroy(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbindEvents();
  }

  public triggerTouchAction(action: 'attack' | 'shuriken' | 'jump' | 'dash' | 'special' | 'moonFury'): void {
    this.audio.unlock();
    if (action === 'attack') {
      this.input.justPressed.attack = true;
      this.input.attackBufferTimer = 0.18;
    } else if (action === 'jump') {
      this.input.justPressed.jump = true;
      this.input.jumpBufferTimer = 0.14;
    } else {
      this.input.justPressed[action] = true;
    }
  }

  public setTouchMove(dir: 'left' | 'right' | 'up' | 'down', active: boolean): void {
    this.input.held[dir] = active;
  }

  public clearTouchInputs(): void {
    this.clearHeldInputs();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.paused || !this.running) return;
    const code = e.code;

    if (code === 'ArrowLeft' || code === 'KeyA') this.input.held.left = true;
    else if (code === 'ArrowRight' || code === 'KeyD') this.input.held.right = true;
    else if (code === 'ArrowUp' || code === 'KeyW') this.input.held.up = true;
    else if (code === 'ArrowDown' || code === 'KeyS') this.input.held.down = true;
    else if (code === 'KeyJ' || code === 'KeyZ') {
      if (!e.repeat) {
        this.input.justPressed.attack = true;
        this.input.attackBufferTimer = 0.18;
      }
    } else if (code === 'KeyK' || code === 'KeyX') {
      if (!e.repeat) this.input.justPressed.shuriken = true;
    } else if (code === 'Space') {
      e.preventDefault();
      if (!e.repeat) {
        this.input.justPressed.jump = true;
        this.input.jumpBufferTimer = 0.14;
      }
    } else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyL' || code === 'KeyC') {
      if (!e.repeat) this.input.justPressed.dash = true;
    } else if (code === 'KeyE' || code === 'KeyQ' || code === 'KeyU') {
      if (!e.repeat) this.input.justPressed.special = true;
    } else if (code === 'KeyF' || code === 'KeyR') {
      if (!e.repeat) this.input.justPressed.moonFury = true;
    } else if (code === 'Digit1') {
      this.selectNinjutsu('ikazuchi');
    } else if (code === 'Digit2') {
      this.selectNinjutsu('karyu');
    } else if (code === 'Digit3') {
      this.selectNinjutsu('fushin');
    } else if (code === 'Digit4') {
      this.selectNinjutsu('mijin');
    } else if (code === 'Digit5') {
      this.selectNinjutsu('bunshin');
    } else if (code === 'Digit6') {
      this.selectNinjutsu('yagan');
    } else if (code === 'Tab') {
      e.preventDefault();
      const idx = NINJUTSU_LIST.findIndex((n) => n.id === this.player.activeNinjutsu);
      const next = NINJUTSU_LIST[(idx + 1) % NINJUTSU_LIST.length];
      this.selectNinjutsu(next.id);
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'KeyA') this.input.held.left = false;
    else if (code === 'ArrowRight' || code === 'KeyD') this.input.held.right = false;
    else if (code === 'ArrowUp' || code === 'KeyW') this.input.held.up = false;
    else if (code === 'ArrowDown' || code === 'KeyS') this.input.held.down = false;
  };

  private handleCanvasPointerDown = (e: PointerEvent): void => {
    if (this.paused || !this.running) return;
    if (e.pointerType !== 'mouse') return;
    this.audio.unlock();
    if (e.button === 0) {
      this.input.justPressed.attack = true;
      this.input.attackBufferTimer = 0.18;
    } else if (e.button === 2) {
      this.input.justPressed.shuriken = true;
    }
  };

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };

  private clearHeldInputs = (): void => {
    this.input.held.left = false;
    this.input.held.right = false;
    this.input.held.up = false;
    this.input.held.down = false;
    this.input.justPressed.attack = false;
    this.input.justPressed.shuriken = false;
    this.input.justPressed.jump = false;
    this.input.justPressed.dash = false;
    this.input.justPressed.special = false;
    this.input.justPressed.moonFury = false;
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clearHeldInputs);
    this.canvas.addEventListener('pointerdown', this.handleCanvasPointerDown);
    this.canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private unbindEvents(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.clearHeldInputs);
    this.canvas.removeEventListener('pointerdown', this.handleCanvasPointerDown);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private activateZone(index: number): void {
    const stageDef = STAGE_DEFS[this.stageId];
    const zone = stageDef.zones[index];
    this.currentZoneIndex = index;
    this.zoneActive = true;
    this.zoneCleared = false;
    if (zone.isBoss) {
      const stageMeta = STAGES.find((s) => s.id === this.stageId) ?? STAGES[0];
      this.bannerText = null;
      this.bannerTimer = 0;
      this.bossIntroTimer = 2.25;
      this.activeBossIntro = {
        bossName: stageMeta.bossName,
        subtitle: `Etapa ${index + 1}/${stageDef.zones.length} · ${zone.name}`,
        accentHex: stageMeta.accentHex,
      };
      this.bossSpawnTimestamp = this.elapsedSeconds + 2.25;
      this.triggerShake(0.45, 0, 6);
    } else {
      this.bannerText = `Etapa ${index + 1}/${stageDef.zones.length} · ${zone.name}`;
      this.bannerTimer = 2.4;
    }

    this.audio.playGong(Boolean(zone.isBoss));

    for (const sp of zone.spawns) {
      const e = this.spawnEnemy(sp.type, sp.offsetX, sp.y);
      if (sp.elevated) {
        const platZ = this.getSupportingPlatformZ(sp.offsetX, sp.y, 200);
        if (platZ > 0) {
          e.z = platZ;
          e.groundZ = platZ;
        }
      }
    }

    if (this.difficulty === 'hard' && !zone.isBoss) {
      this.spawnEnemy('scout', zone.lockCamX + 80, 505);
    }

    this.emitHud(true);
  }

  private spawnEnemy(type: EnemyType, x: number, y: number): Enemy {
    const diffCfg = DIFFICULTIES[this.difficulty];
    const configs: Record<
      EnemyType,
      {
        name: string;
        hp: number;
        speed: number;
        damage: number;
        radius: number;
        superArmor: boolean;
        isBoss: boolean;
      }
    > = {
      scout: { name: 'Batedor Sombrio', hp: 52, speed: 170, damage: 10, radius: 22, superArmor: false, isBoss: false },
      ronin: { name: 'Ronin Ashigaru', hp: 82, speed: 120, damage: 14, radius: 24, superArmor: false, isBoss: false },
      kunoichi: { name: 'Kunoichi', hp: 60, speed: 158, damage: 11, radius: 20, superArmor: false, isBoss: false },
      oni: { name: 'Oni Guardião', hp: 160, speed: 84, damage: 22, radius: 32, superArmor: true, isBoss: false },
      boss_kagerou: {
        name: 'Kagerou, Capitão Ronin',
        hp: 300,
        speed: 138,
        damage: 18,
        radius: 32,
        superArmor: true,
        isBoss: true,
      },
      boss_hotaru: {
        name: 'Hotaru, Mestra Kunoichi',
        hp: 340,
        speed: 175,
        damage: 17,
        radius: 30,
        superArmor: true,
        isBoss: true,
      },
      boss_raiden: {
        name: 'Raiden, Ninja Cibernético',
        hp: 380,
        speed: 165,
        damage: 20,
        radius: 32,
        superArmor: true,
        isBoss: true,
      },
      boss_kurogane: {
        name: 'Kurogane, O Shogun Sombrio',
        hp: 440,
        speed: 148,
        damage: 21,
        radius: 34,
        superArmor: true,
        isBoss: true,
      },
      boss_umigame: {
        name: 'Umigame, Capitão Pirata',
        hp: 460,
        speed: 142,
        damage: 21,
        radius: 33,
        superArmor: true,
        isBoss: true,
      },
      boss_tetsujin: {
        name: 'Tetsujin, Golem de Ferro',
        hp: 520,
        speed: 118,
        damage: 25,
        radius: 35,
        superArmor: true,
        isBoss: true,
      },
      boss_yuki: {
        name: 'Yuki, Dama da Nevasca',
        hp: 490,
        speed: 182,
        damage: 21,
        radius: 30,
        superArmor: true,
        isBoss: true,
      },
      boss_enma: {
        name: 'Enma, Sacerdote Demoníaco',
        hp: 540,
        speed: 152,
        damage: 23,
        radius: 32,
        superArmor: true,
        isBoss: true,
      },
      boss_tetsuo: {
        name: 'Tetsuo, Lâmina Fantasma',
        hp: 580,
        speed: 192,
        damage: 24,
        radius: 32,
        superArmor: true,
        isBoss: true,
      },
      boss_akuma: {
        name: 'Akuma, Imperador do Eclipse',
        hp: 680,
        speed: 170,
        damage: 27,
        radius: 36,
        superArmor: true,
        isBoss: true,
      },
    };

    const cfg = configs[type];
    const scaledHp = Math.round(cfg.hp * diffCfg.enemyHpMult);
    const enemy: Enemy = {
      id: this.nextId++,
      type,
      name: cfg.name,
      isBoss: cfg.isBoss,
      x,
      y,
      z: 0,
      groundZ: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: x > this.player.x ? -1 : 1,
      hp: scaledHp,
      maxHp: scaledHp,
      speed: cfg.speed * diffCfg.enemySpeedMult,
      damage: Math.max(4, Math.round(cfg.damage * diffCfg.enemyDamageMult)),
      radius: cfg.radius,
      aiState: 'chase',
      stateTimer: 0.4 + Math.random() * 0.4,
      attackCooldown: 0.6 + Math.random() * 0.6,
      attackKind: type === 'kunoichi' ? 'ranged' : type === 'oni' ? 'slam' : 'melee',
      hitFlashTimer: 0,
      squashX: 1,
      squashY: 1,
      runCycle: Math.random() * 6,
      superArmor: cfg.superArmor,
      bossPhase: 1,
      summonedAdds: false,
      summonCooldown: cfg.isBoss ? (this.difficulty === 'hard' ? 3.5 : 5.2) : 0,
      jutsuSealActive: cfg.isBoss,
      alertTimer: 0,
      alertFlashTimer: 0,
      patrolAnchorX: x,
      patrolDir: Math.random() < 0.5 ? 1 : -1,
    };
    this.enemies.push(enemy);
    return enemy;
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;
    const rawDt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    const dt = Math.min(Math.max(rawDt, 0), 0.05);

    if (!this.paused) {
      this.update(dt);
    }
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.time += dt;
    this.elapsedSeconds += dt;

    if (this.input.jumpBufferTimer > 0) this.input.jumpBufferTimer -= dt;
    if (this.input.attackBufferTimer > 0) this.input.attackBufferTimer -= dt;

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerText = null;
    }

    if (this.specialFlash > 0) this.specialFlash = Math.max(0, this.specialFlash - dt * 2.0);
    if (this.moonFuryFlash > 0) this.moonFuryFlash = Math.max(0, this.moonFuryFlash - dt * 1.9);
    if (this.shakeTrauma > 0) this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.4);
    const dirDecay = Math.exp(-18 * dt);
    this.shakeDirX *= dirDecay;
    this.shakeDirY *= dirDecay;
    if (Math.abs(this.shakeDirX) < 0.05) this.shakeDirX = 0;
    if (Math.abs(this.shakeDirY) < 0.05) this.shakeDirY = 0;
    if (this.shakeTrauma > 0) this.shakePhase += dt * 52;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.clearEdgeInputs();
      return;
    }

    if (this.bossIntroTimer > 0) {
      this.bossIntroTimer -= dt;
      this.updateEffects(dt);
      this.updateWeather(dt);
      this.updateCameraAndZones(dt);
      this.clearEdgeInputs();
      if (this.bossIntroTimer <= 0) {
        this.bossIntroTimer = 0;
        this.activeBossIntro = null;
        this.bossSpawnTimestamp = this.elapsedSeconds;
        this.emitHud(true);
      }
      return;
    }

    if (this.comboCount > 0) {
      this.comboDecayTimer -= dt;
      if (this.comboDecayTimer <= 0) this.comboCount = 0;
    }

    this.ambientSpawnTimer -= dt;
    if (this.ambientSpawnTimer <= 0) {
      this.ambientSpawnTimer = 0.28;
      this.spawnBiomeParticle(this.cameraX + Math.random() * LOGICAL_WIDTH + (this.stageId === 'fortress' ? 0 : 120));
    }

    if (this.sealHintCooldown > 0) this.sealHintCooldown = Math.max(0, this.sealHintCooldown - dt);
    const stageMeta = STAGES.find((s) => s.id === this.stageId);
    const hasSealedBoss = this.enemies.some((e) => e.isBoss && e.hp > 0 && e.jutsuSealActive);
    const activeFog = Boolean(stageMeta?.denseFog) || this.weather?.currentKind === 'fog';
    const needsFogVision = activeFog && this.player.nightVisionTimer <= 0 && this.enemies.some((e) => e.hp > 0);
    if ((hasSealedBoss || needsFogVision) && this.player.chi < this.player.maxChi) {
      this.player.chi = Math.min(this.player.maxChi, this.player.chi + (needsFogVision ? 14 : 11) * dt);
    }

    this.updateHazards(dt);
    this.updatePlayer(dt);
    this.updateClones(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateCrates(dt);
    this.updateCivilians(dt);
    this.updateEffects(dt);
    this.updateWeather(dt);
    this.updateCameraAndZones(dt);

    this.clearEdgeInputs();

    this.hudEmitTimer -= dt;
    if (this.hudEmitTimer <= 0) {
      this.hudEmitTimer = 0.05;
      this.emitHud(false);
    }
  }

  private clearEdgeInputs(): void {
    this.input.justPressed.attack = false;
    this.input.justPressed.shuriken = false;
    this.input.justPressed.jump = false;
    this.input.justPressed.dash = false;
    this.input.justPressed.special = false;
    this.input.justPressed.moonFury = false;
  }

  private updatePlayer(dt: number): void {
    const p = this.player;

    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.hitFlashTimer > 0) p.hitFlashTimer -= dt;
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.specialTimer > 0) p.specialTimer -= dt;
    if (p.moonFuryTimer > 0) p.moonFuryTimer = Math.max(0, p.moonFuryTimer - dt);
    if (p.throwTimer > 0) p.throwTimer -= dt;
    if (p.hurtTimer > 0) p.hurtTimer -= dt;
    if (p.somersaultTimer > 0) p.somersaultTimer -= dt;
    if (p.fushinTimer > 0) p.fushinTimer = Math.max(0, p.fushinTimer - dt);
    if (p.nightVisionTimer > 0) p.nightVisionTimer = Math.max(0, p.nightVisionTimer - dt);
    if (this.katanaChainTimer > 0) {
      this.katanaChainTimer = Math.max(0, this.katanaChainTimer - dt);
      if (this.katanaChainTimer <= 0 && p.attackTimer <= 0) {
        p.comboStep = 0;
      }
    }

    p.squashX += (1 - p.squashX) * Math.min(1, dt * 16);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 16);

    const rechargeInterval = p.fushinTimer > 0 ? 0.42 : 0.85;
    if (p.shurikens < p.maxShurikens) {
      p.shurikenRecharge += dt;
      if (p.shurikenRecharge >= rechargeInterval) {
        p.shurikenRecharge = 0;
        p.shurikens++;
      }
    }

    // Cast Selected Ninjutsu Power (Revenge of Shinobi style!)
    if (this.input.justPressed.special && p.chi >= p.maxChi && p.specialTimer <= 0) {
      this.triggerNinjutsu(p.activeNinjutsu);
    }

    // Fúria da Lua Area Special Attack
    if (this.input.justPressed.moonFury && p.moonFury >= p.maxMoonFury && p.moonFuryTimer <= 0) {
      this.triggerMoonFury();
    }

    // Shadow Dash (Esquiva Sombria) with Ghost Trail
    if (this.input.justPressed.dash && p.dashCooldown <= 0 && p.dashTimer <= 0) {
      p.dashTimer = 0.22;
      p.dashCooldown = 0.68;
      p.invulnTimer = Math.max(p.invulnTimer, 0.26);
      p.attackTimer = 0;
      p.somersaultTimer = 0;
      p.squashX = 1.25;
      p.squashY = 0.8;
      this.dashTrailTimer = 0.024;
      const moveX = (this.input.held.right ? 1 : 0) - (this.input.held.left ? 1 : 0);
      if (moveX !== 0) p.facing = moveX > 0 ? 1 : -1;
      this.audio.playDash();
      this.afterimages.push({
        x: p.x,
        y: p.y,
        z: p.z,
        facing: p.facing,
        alpha: 0.95,
        pose: 'dash',
        frameIndex: Math.floor(p.runCycle) % 6,
        lean: 0.16,
        squashX: 1.12,
        squashY: 0.9,
        tint: 'shadow',
      });
      for (let i = 0; i < 6; i++) {
        this.spawnParticle({
          kind: i < 2 ? 'spark' : 'smoke',
          x: p.x,
          y: p.y,
          z: p.z + 20 + i * 10,
          vx: -p.facing * (70 + Math.random() * 110),
          vy: (Math.random() - 0.5) * 40,
          vz: 15 + Math.random() * 35,
          size: i < 2 ? 5 : 8 + Math.random() * 5,
          color: i < 2 ? '#38BDF8' : '#64748B',
          alpha: 0.72,
          maxLife: 0.34,
        });
      }
    }

    const fushinJumpMult = p.fushinTimer > 0 ? 1.22 : 1.0;
    const isGrounded = p.z <= p.groundZ + 2;
    if (isGrounded) {
      this.coyoteTimer = 0.11;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // Jump & Signature Hassō-tobi Double-Jump Somersault (with Coyote Time!)
    if (this.input.jumpBufferTimer > 0 && p.dashTimer <= 0) {
      const canFirstJump = isGrounded || (this.coyoteTimer > 0 && p.jumpsUsed === 0);
      if (canFirstJump) {
        p.vz = 525 * fushinJumpMult;
        p.z = p.groundZ + 1;
        p.jumpsUsed = 1;
        this.coyoteTimer = 0;
        this.input.jumpBufferTimer = 0;
        p.squashX = 0.84;
        p.squashY = 1.22;
        this.audio.playJump();
        this.spawnDustBurst(p.x, p.y, p.groundZ, 5);
      } else if (p.jumpsUsed < 2) {
        // HASSŌ-TOBI SOMERSAULT!
        p.vz = 550 * fushinJumpMult;
        p.jumpsUsed = 2;
        p.somersaultTimer = 0.58;
        p.attackTimer = 0;
        this.input.jumpBufferTimer = 0;
        this.audio.playSomersault();
        this.spawnFloatingText(p.x, p.y, p.z + 125, 'HASSŌ-TOBI!', '#38BDF8', 0.9);
        this.afterimages.push({
          x: p.x,
          y: p.y,
          z: p.z,
          facing: p.facing,
          alpha: 0.9,
          pose: 'somersault',
        });
      }
    }

    // Shuriken Throw (Single star normally; 5-Star Hassō-tobi Fan Spread during Somersault!)
    if (this.input.justPressed.shuriken && p.shurikens > 0 && p.dashTimer <= 0) {
      if (p.somersaultTimer > 0) {
        const cost = Math.min(p.shurikens, 2);
        p.shurikens -= cost;
        this.audio.playShuriken(true);
        const angles = [-0.55, -0.25, 0, 0.25, 0.55];
        for (const ang of angles) {
          const speed = 640;
          this.projectiles.push({
            id: this.nextId++,
            fromPlayer: true,
            kind: 'shuriken',
            x: p.x + p.facing * 24,
            y: p.y,
            z: p.z + 52,
            vx: p.facing * Math.cos(ang) * speed,
            vy: Math.sin(ang) * 140,
            vz: -Math.abs(Math.sin(ang)) * 180 - 90,
            damage: 16,
            rotation: 0,
            life: 1.15,
            radius: 15,
          });
        }
      } else {
        p.shurikens--;
        this.stageAttackAttempts++;
        this.audio.playShuriken(false);
        this.projectiles.push({
          id: this.nextId++,
          fromPlayer: true,
          kind: 'shuriken',
          x: p.x + p.facing * 42,
          y: p.y,
          z: p.z + 82,
          vx: p.facing * 720,
          vy: 0,
          vz: 0,
          damage: 18,
          rotation: 0,
          life: 1.35,
          radius: 16,
          countForPrecision: true,
        });
        // Iconic fiery hand-blast sparks from Revenge of Shinobi screenshot!
        for (let i = 0; i < 5; i++) {
          this.spawnParticle({
            kind: 'spark',
            x: p.x + p.facing * (44 + i * 7),
            y: p.y,
            z: p.z + 82 + (Math.random() - 0.5) * 10,
            vx: p.facing * (140 + Math.random() * 140),
            vy: 0,
            vz: (Math.random() - 0.5) * 40,
            size: i < 2 ? 9 : 6,
            color: i < 2 ? '#FEF08A' : '#F97316',
            alpha: 0.95,
            maxLife: 0.14,
          });
        }
      }
      p.throwTimer = 0.16;
      p.squashX = 1.12;
      p.squashY = 0.92;
    }

    // Close-quarters Advanced 4-Hit Katana Combo + Mid-Air Slash
    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (this.input.attackBufferTimer > 0 && p.attackTimer < p.attackDuration * 0.68 && p.comboStep < 4) {
        p.queuedAttack = true;
      }
      this.evaluatePlayerMeleeHitbox();
      if (p.attackTimer <= 0) {
        if (p.queuedAttack && p.comboStep < 4) {
          p.queuedAttack = false;
          this.input.attackBufferTimer = 0;
          this.startPlayerAttack((p.comboStep + 1) as 1 | 2 | 3 | 4);
        } else {
          p.queuedAttack = false;
          this.katanaChainTimer = p.comboStep >= 4 ? 0 : 0.48;
          if (p.comboStep >= 4) p.comboStep = 0;
        }
      }
    } else if (this.input.attackBufferTimer > 0 && p.dashTimer <= 0) {
      this.input.attackBufferTimer = 0;
      p.somersaultTimer = 0;
      const isAir = p.z > p.groundZ + 12;
      if (isAir) {
        this.startPlayerAttack(3);
        p.vx = p.facing * 360;
        p.vz = Math.max(p.vz, 110);
        this.afterimages.push({
          x: p.x,
          y: p.y,
          z: p.z,
          facing: p.facing,
          alpha: 0.85,
          pose: 'airKick',
        });
      } else {
        const nextStep =
          this.katanaChainTimer > 0 && p.comboStep > 0 && p.comboStep < 4
            ? ((p.comboStep + 1) as 1 | 2 | 3 | 4)
            : 1;
        this.startPlayerAttack(nextStep);
      }
    }

    // Fluid Movement Velocity with Smooth Exponential Acceleration & Inertia
    const speedBoost = p.fushinTimer > 0 ? 1.35 : 1.0;
    const hazardSlowMult = this.hazardSlowActive ? 0.56 : 1.0;
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      p.vx = p.facing * 690 * speedBoost;
      p.vy = ((this.input.held.down ? 1 : 0) - (this.input.held.up ? 1 : 0)) * 225;
      this.dashTrailTimer -= dt;
      if (this.dashTrailTimer <= 0) {
        this.dashTrailTimer = 0.025;
        this.afterimages.push({
          x: p.x,
          y: p.y,
          z: p.z,
          facing: p.facing,
          alpha: 0.9,
          pose: p.z > p.groundZ + 4 ? 'air' : 'dash',
          frameIndex: Math.floor(p.runCycle) % 6,
          lean: 0.22,
          squashX: 1.16,
          squashY: 0.88,
          tint: 'shadow',
        });
        this.spawnParticle({
          kind: 'spark',
          x: p.x - p.facing * 14,
          y: p.y,
          z: p.z + 28 + Math.random() * 52,
          vx: -p.facing * (180 + Math.random() * 120),
          vy: 0,
          vz: (Math.random() - 0.5) * 20,
          size: 4,
          color: Math.random() > 0.4 ? '#38BDF8' : '#E0F2FE',
          alpha: 0.85,
          maxLife: 0.16,
        });
      }
    } else {
      const mx = (this.input.held.right ? 1 : 0) - (this.input.held.left ? 1 : 0);
      const my = (this.input.held.down ? 1 : 0) - (this.input.held.up ? 1 : 0);
      const len = Math.hypot(mx, my) || 1;
      const moveSpeedX = (p.attackTimer > 0 && p.z <= p.groundZ + 4 ? 135 : 325) * speedBoost * hazardSlowMult;
      const moveSpeedY = (p.attackTimer > 0 && p.z <= p.groundZ + 4 ? 85 : 218) * speedBoost * hazardSlowMult;

      const targetVx = (mx / len) * moveSpeedX * (mx !== 0 ? 1 : 0);
      const targetVy = (my / len) * moveSpeedY * (my !== 0 ? 1 : 0);

      const hasInput = mx !== 0 || my !== 0;
      const rate = isGrounded ? (hasInput ? 26 : 19) : hasInput ? 14 : 6;
      const blend = 1 - Math.exp(-rate * dt);

      p.vx += (targetVx - p.vx) * blend;
      p.vy += (targetVy - p.vy) * blend;
      if (!hasInput && Math.abs(p.vx) < 4) p.vx = 0;
      if (!hasInput && Math.abs(p.vy) < 4) p.vy = 0;

      if (mx !== 0 && p.attackTimer <= 0) {
        const nextFacing = mx > 0 ? 1 : -1;
        if (nextFacing !== p.facing && isGrounded && Math.abs(p.vx) > 120) {
          p.squashX = 0.88;
          p.squashY = 1.1;
          this.spawnDustBurst(p.x, p.y, p.groundZ, 2);
        }
        p.facing = nextFacing;
      }
    }

    if (p.somersaultTimer > 0 && Math.random() < 0.5) {
      this.afterimages.push({
        x: p.x,
        y: p.y,
        z: p.z,
        facing: p.facing,
        alpha: 0.65,
        pose: 'somersault',
      });
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Platform ground check & vertical gravity with crisp Apex Hang-Time
    p.groundZ = this.getSupportingPlatformZ(p.x, p.y, p.z);
    if (p.z > p.groundZ || p.vz > 0) {
      this.playerPeakZ = Math.max(this.playerPeakZ, p.z);
      p.z += p.vz * dt;
      const apexMult = Math.abs(p.vz) < 120 ? 0.72 : p.vz < 0 ? 1.06 : 1.0;
      p.vz -= 1540 * apexMult * dt;
      p.groundZ = this.getSupportingPlatformZ(p.x, p.y, p.z);
      if (p.z <= p.groundZ && p.vz <= 0) {
        const impactSpeed = -p.vz;
        const fallHeight = Math.max(0, this.playerPeakZ - p.groundZ);
        p.z = p.groundZ;
        p.vz = 0;
        p.jumpsUsed = 0;
        p.somersaultTimer = 0;
        this.playerPeakZ = p.groundZ;

        // Heavy impact feedback when landing from a high fall or high-velocity drop
        if (fallHeight >= 130 || impactSpeed >= 640) {
          const fallRatio = Math.min(
            1,
            Math.max((fallHeight - 130) / 160, (impactSpeed - 640) / 320)
          );
          p.squashX = 1.24 + fallRatio * 0.14;
          p.squashY = 0.78 - fallRatio * 0.08;
          this.triggerShake(0.32 + fallRatio * 0.36, 0, 8 + fallRatio * 8);
          this.audio.playLandingThud(0.45 + fallRatio * 0.55);
          this.spawnDustBurst(p.x, p.y, p.groundZ, Math.round(10 + fallRatio * 8));
          for (let i = 0; i < 6; i++) {
            const side = i % 2 === 0 ? 1 : -1;
            this.spawnParticle({
              kind: 'spark',
              x: p.x + side * 8,
              y: p.y,
              z: p.groundZ + 4,
              vx: side * (110 + Math.random() * 140),
              vy: (Math.random() - 0.5) * 45,
              vz: 35 + Math.random() * 65,
              size: 4,
              color: '#CBD5E1',
              alpha: 0.88,
              maxLife: 0.28,
            });
          }
        } else {
          p.squashX = 1.18;
          p.squashY = 0.85;
          this.spawnDustBurst(p.x, p.y, p.groundZ, 5);
        }
      }
    } else {
      this.playerPeakZ = p.groundZ;
    }

    const minBoundX = Math.max(WORLD_MIN_X, this.cameraX + 36);
    const maxBoundX = this.zoneActive
      ? Math.min(WORLD_MAX_X, this.cameraX + LOGICAL_WIDTH - 36)
      : WORLD_MAX_X;
    p.x = Math.max(minBoundX, Math.min(maxBoundX, p.x));
    p.y = Math.max(FLOOR_TOP + 12, Math.min(FLOOR_BOTTOM, p.y));

    const speedMag = Math.hypot(p.vx, p.vy);
    if (speedMag > 16) {
      p.runCycle += dt * (7 + (speedMag / 325) * 12);
    }

    const anchorX = p.x - p.facing * 10;
    const anchorY = p.y - p.z - 96;
    p.scarf[0].x = anchorX;
    p.scarf[0].y = anchorY;
    for (let i = 1; i < p.scarf.length; i++) {
      const prev = p.scarf[i - 1];
      const curr = p.scarf[i];
      curr.x += (-p.facing * 95 + Math.sin(this.time * 9 + i) * 32) * dt;
      curr.y += (Math.cos(this.time * 7 + i * 0.8) * 26 + 20) * dt;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.hypot(dx, dy) || 1;
      const segLen = 8.5;
      if (dist > segLen) {
        curr.x = prev.x + (dx / dist) * segLen;
        curr.y = prev.y + (dy / dist) * segLen;
      }
    }
  }

  private getComboDamageMultiplier(): number {
    if (this.comboCount >= 15) return 1.65;
    if (this.comboCount >= 10) return 1.45;
    if (this.comboCount >= 6) return 1.3;
    if (this.comboCount >= 3) return 1.15;
    return 1.0;
  }

  private getComboRankLabel(): string {
    if (this.comboCount >= 15) return 'SHINOBI SUPREMO';
    if (this.comboCount >= 10) return 'KAGE';
    if (this.comboCount >= 6) return 'JŌNIN';
    if (this.comboCount >= 3) return 'CHŪNIN';
    return '';
  }

  private startPlayerAttack(step: 1 | 2 | 3 | 4): void {
    const p = this.player;
    p.comboStep = step;
    this.stageAttackAttempts++;
    this.currentSwingHit = false;
    this.katanaChainTimer = 0;
    p.attackDuration = step === 4 ? 0.34 : step === 3 ? 0.27 : 0.19;
    p.attackTimer = p.attackDuration;
    p.attackHitIds.clear();
    p.squashX = step === 4 ? 1.3 : step === 3 ? 1.22 : 1.14;
    p.squashY = step === 4 ? 0.8 : step === 3 ? 0.86 : 0.92;
    p.x += p.facing * (step === 4 ? 26 : step === 3 ? 20 : 12);

    this.audio.playSlash(step);

    const empowered = this.comboCount >= 6;
    const arcColor =
      step === 4
        ? '#FBBF24'
        : step === 3
          ? '#E11D48'
          : empowered
            ? '#F59E0B'
            : '#38BDF8';

    this.slashArcs.push({
      x: p.x,
      y: p.y,
      z: p.z,
      facing: p.facing,
      step,
      life: step === 4 ? 0.24 : step === 3 ? 0.2 : 0.14,
      maxLife: step === 4 ? 0.24 : step === 3 ? 0.2 : 0.14,
      color: arcColor,
      radius: step === 4 ? 92 : step === 3 ? 72 : 56,
    });

    if (step === 4) {
      this.slashArcs.push({
        x: p.x,
        y: p.y,
        z: p.z,
        facing: p.facing,
        step: 3,
        life: 0.22,
        maxLife: 0.22,
        color: '#E11D48',
        radius: 82,
      });
    }
  }

  private evaluatePlayerMeleeHitbox(): void {
    const p = this.player;
    if (p.attackTimer < p.attackDuration * 0.2) return;

    const reachX = p.comboStep === 4 ? 124 : p.comboStep === 3 ? 102 : p.comboStep === 2 ? 88 : 82;
    const depthTol = p.comboStep === 4 ? 60 : 48;
    const baseDamage = p.comboStep === 4 ? 46 : p.comboStep === 3 ? 34 : p.comboStep === 2 ? 24 : 19;
    const comboMult = this.getComboDamageMultiplier();
    const damage = Math.round(baseDamage * comboMult);
    const isHeavy = p.comboStep >= 3;

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || p.attackHitIds.has(enemy.id)) continue;
      const dx = (enemy.x - p.x) * p.facing;
      const dy = Math.abs(enemy.y - p.y);
      const dz = Math.abs(enemy.z - p.z);
      const hitCondition =
        p.comboStep === 4
          ? Math.abs(enemy.x - p.x) <= reachX + enemy.radius && dy <= depthTol && dz <= 105
          : dx >= -26 && dx <= reachX + enemy.radius && dy <= depthTol && dz <= 98;
      if (hitCondition) {
        p.attackHitIds.add(enemy.id);
        if (!this.currentSwingHit) {
          this.currentSwingHit = true;
          this.stageAttackHits++;
        }
        const knockDir = p.comboStep === 4 && enemy.x < p.x ? -1 : p.facing;
        const jutsuSource: NinjutsuType | undefined =
          p.nightVisionTimer > 0
            ? 'yagan'
            : p.fushinTimer > 0
              ? 'fushin'
              : p.shieldHits > 0
                ? 'ikazuchi'
                : undefined;
        this.damageEnemy(enemy, damage, knockDir, isHeavy, {
          jutsuSource,
          fromKatana: true,
          comboStep: p.comboStep,
        });
        const furyGain =
          (p.comboStep === 4 ? 14 : p.comboStep === 3 ? 11 : 8) +
          Math.min(5, Math.floor(this.comboCount / 5));
        this.addMoonFury(furyGain);
        if (isHeavy && p.shurikens < p.maxShurikens) {
          p.shurikens = Math.min(p.maxShurikens, p.shurikens + (p.comboStep === 4 ? 2 : 1));
        }
      }
    }

    for (const crate of this.crates) {
      if (crate.hp <= 0 || p.attackHitIds.has(crate.id)) continue;
      const dx = (crate.x - p.x) * p.facing;
      const dy = Math.abs(crate.y - p.y);
      const dz = Math.abs(crate.z - p.z);
      if (dx >= -24 && dx <= reachX + 20 && dy <= depthTol && dz <= 72) {
        p.attackHitIds.add(crate.id);
        this.damageCrate(crate, damage);
      }
    }

    for (const civ of this.civilians) {
      if (civ.state !== 'captive' || p.attackHitIds.has(civ.id)) continue;
      const dx = (civ.x - p.x) * p.facing;
      const dy = Math.abs(civ.y - p.y);
      const dz = Math.abs(civ.z - p.z);
      const hitCondition =
        p.comboStep === 4
          ? Math.abs(civ.x - p.x) <= reachX + 14 && dy <= depthTol && dz <= 80
          : dx >= -20 && dx <= reachX + 14 && dy <= depthTol && dz <= 76;
      if (hitCondition) {
        p.attackHitIds.add(civ.id);
        this.harmCivilian(civ);
      }
    }
  }

  private addMoonFury(amount: number): void {
    const p = this.player;
    const wasReady = p.moonFury >= p.maxMoonFury;
    p.moonFury = Math.min(p.maxMoonFury, p.moonFury + amount);
    if (!wasReady && p.moonFury >= p.maxMoonFury) {
      this.spawnFloatingText(p.x, p.y, p.z + 115, 'FÚRIA PRONTA (F)!', '#FB7185', 1.15);
      this.audio.playPickup('chi');
      this.emitHud(true);
    }
  }

  private triggerMoonFury(): void {
    const p = this.player;
    p.moonFury = 0;
    p.moonFuryTimer = 0.72;
    p.specialTimer = 0.55;
    p.invulnTimer = Math.max(p.invulnTimer, 1.1);
    p.squashX = 1.32;
    p.squashY = 0.76;
    this.moonFuryFlash = 1.0;
    this.hitstopTimer = 0.065;
    this.triggerShake(0.92, 0, 12);
    this.audio.playMoonFury();
    this.spawnFloatingText(p.x, p.y, p.z + 108, 'FÚRIA DA LUA!', '#FB7185', 1.3);

    this.slashArcs.push(
      {
        x: p.x,
        y: p.y,
        z: p.z,
        facing: p.facing,
        step: 4,
        life: 0.45,
        maxLife: 0.45,
        color: '#E11D48',
        radius: 245,
      },
      {
        x: p.x,
        y: p.y,
        z: p.z,
        facing: p.facing,
        step: 4,
        life: 0.36,
        maxLife: 0.36,
        color: '#FDE047',
        radius: 175,
      }
    );

    const furyDamage = Math.round(95 * this.getComboDamageMultiplier());
    let furyHits = 0;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = Math.hypot(enemy.x - p.x, (enemy.y - p.y) * 1.25);
      if (dist <= 460) {
        furyHits++;
        const dir: 1 | -1 = enemy.x >= p.x ? 1 : -1;
        this.damageEnemy(enemy, furyDamage, dir, true, { fromKatana: true, comboStep: 4 });
        enemy.vz = Math.max(enemy.vz, 210);
      }
    }
    if (furyHits >= 3) {
      this.tryUnlockAchievement('moon_fury_triple');
    }

    for (const crate of this.crates) {
      if (crate.hp <= 0) continue;
      if (Math.hypot(crate.x - p.x, crate.y - p.y) <= 420) {
        this.damageCrate(crate, 60);
      }
    }

    for (let i = 0; i < 32; i++) {
      const ang = (i / 32) * Math.PI * 2;
      const spd = 250 + Math.random() * 260;
      this.spawnParticle({
        kind: i % 3 === 0 ? 'petal' : 'spark',
        x: p.x,
        y: p.y,
        z: p.z + 36,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.48,
        vz: 60 + Math.random() * 170,
        size: i % 2 === 0 ? 7 : 5,
        color: i % 3 === 0 ? '#FB7185' : i % 3 === 1 ? '#FDE047' : '#F8FAFC',
        alpha: 0.96,
        maxLife: 0.56,
      });
    }
    this.emitHud(true);
  }

  private triggerNinjutsu(kind: NinjutsuType): void {
    const p = this.player;
    p.chi = 0;
    p.specialTimer = 0.55;
    p.invulnTimer = Math.max(p.invulnTimer, 0.85);
    this.specialFlash = 0.9;
    this.triggerShake(0.62, 0, 5);
    this.hitstopTimer = 0.05;
    this.audio.playNinjutsu(kind);
    const artUnlock = recordNinjutsuUsedInStore(kind);
    if (artUnlock.newlyUnlocked) {
      this.notifyAchievementUnlocked(artUnlock.newlyUnlocked);
    }

    if (kind === 'ikazuchi') {
      // Lightning Shield (absorbs 3 hits + zaps nearby foes)
      p.shieldHits = 3;
      this.spawnFloatingText(p.x, p.y, p.z + 92, 'JUTSU DE IKAZUCHI!', '#38BDF8', 1.2);
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 290) {
          this.damageEnemy(enemy, 32, enemy.x >= p.x ? 1 : -1, true, { jutsuSource: 'ikazuchi' });
        }
      }
    } else if (kind === 'karyu') {
      // Fire Dragon Pillars sweeping horizontally across lanes!
      this.spawnFloatingText(p.x, p.y, p.z + 92, 'JUTSU DE KARYŪ!', '#F97316', 1.2);
      const laneOffsets = [-70, 0, 70];
      for (const dy of laneOffsets) {
        for (const dir of [-1, 1] as const) {
          this.projectiles.push({
            id: this.nextId++,
            fromPlayer: true,
            kind: 'fire_dragon',
            x: p.x + dir * 24,
            y: Math.max(FLOOR_TOP + 16, Math.min(FLOOR_BOTTOM - 16, p.y + dy)),
            z: p.z + 28,
            vx: dir * 560,
            vy: 0,
            vz: 0,
            damage: 55,
            rotation: 0,
            life: 1.4,
            radius: 34,
            hitIds: new Set(),
          });
        }
      }
    } else if (kind === 'fushin') {
      // Wind Agility & Super Jump
      p.fushinTimer = 11.0;
      p.shurikens = p.maxShurikens;
      this.spawnFloatingText(p.x, p.y, p.z + 92, 'JUTSU DE FUSHIN!', '#34D399', 1.2);
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        if (enemy.isBoss && Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 240) {
          this.breakBossJutsuSeal(enemy, 'fushin');
        }
      }
    } else if (kind === 'bunshin') {
      // Kage Bunshin: Summon 2 Shadow Clones that fight autonomously & shatter Bunshin seals
      this.spawnFloatingText(p.x, p.y, p.z + 92, 'JUTSU DE BUNSHIN!', '#A78BFA', 1.25);
      for (const offset of [-58, 58]) {
        const cx = Math.max(this.cameraX + 34, Math.min(this.cameraX + LOGICAL_WIDTH - 34, p.x + offset));
        const cy = Math.max(FLOOR_TOP + 18, Math.min(FLOOR_BOTTOM - 12, p.y + (offset < 0 ? -18 : 18)));
        const gZ = this.getSupportingPlatformZ(cx, cy, p.z + 20);
        this.clones.push({
          id: this.nextId++,
          x: cx,
          y: cy,
          z: gZ,
          groundZ: gZ,
          vx: 0,
          vy: 0,
          vz: 0,
          facing: offset > 0 ? 1 : -1,
          life: 9.5,
          maxLife: 9.5,
          attackCooldown: 0.25,
          attackTimer: 0,
          throwTimer: 0,
          runCycle: 0,
        });
        for (let k = 0; k < 10; k++) {
          this.spawnParticle({
            kind: 'smoke',
            x: cx,
            y: cy,
            z: gZ + 30,
            vx: (Math.random() - 0.5) * 140,
            vy: (Math.random() - 0.5) * 60,
            vz: 40 + Math.random() * 80,
            size: 6,
            color: k % 2 === 0 ? '#A78BFA' : '#38BDF8',
            alpha: 0.9,
            maxLife: 0.45,
          });
        }
      }
    } else if (kind === 'yagan') {
      // Yagan: Night-Vision Technique dissipates dense forest fog and identifies all enemies
      p.nightVisionTimer = 14.0;
      this.spawnFloatingText(p.x, p.y, p.z + 96, 'JUTSU DE VISÃO NOTURNA!', '#2DD4BF', 1.25);
      this.slashArcs.push({
        x: p.x,
        y: p.y,
        z: p.z,
        facing: p.facing,
        step: 4,
        life: 0.45,
        maxLife: 0.45,
        color: '#2DD4BF',
        radius: 260,
      });
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        if (enemy.isBoss && Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 760) {
          this.breakBossJutsuSeal(enemy, 'yagan');
        }
        if (enemy.hp > 0) {
          this.spawnFloatingText(enemy.x, enemy.y, enemy.z + 132, 'IDENTIFICADO!', '#5EEAD4', 0.95);
        }
      }
    } else {
      // Mijin Massive Screen-Wide Nova
      this.spawnFloatingText(p.x, p.y, p.z + 92, 'JUTSU DE MIJIN!', '#FB7185', 1.25);
      this.slashArcs.push({
        x: p.x,
        y: p.y,
        z: p.z,
        facing: p.facing,
        step: 4,
        life: 0.42,
        maxLife: 0.42,
        color: '#E11D48',
        radius: 210,
      });
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const dist = Math.hypot(enemy.x - p.x, (enemy.y - p.y) * 1.2);
        if (dist <= 420) {
          this.damageEnemy(enemy, 85, enemy.x >= p.x ? 1 : -1, true, { jutsuSource: 'mijin' });
        }
      }
      for (const crate of this.crates) {
        if (crate.hp <= 0) continue;
        if (Math.hypot(crate.x - p.x, crate.y - p.y) <= 360) {
          this.damageCrate(crate, 40);
        }
      }
    }

    for (let i = 0; i < 22; i++) {
      const ang = (i / 22) * Math.PI * 2;
      const spd = 210 + Math.random() * 220;
      this.spawnParticle({
        kind: 'spark',
        x: p.x,
        y: p.y,
        z: p.z + 36,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.45,
        vz: 40 + Math.random() * 140,
        size: 6,
        color:
          kind === 'ikazuchi'
            ? '#38BDF8'
            : kind === 'karyu'
              ? '#F97316'
              : kind === 'fushin'
                ? '#34D399'
                : kind === 'bunshin'
                  ? '#A78BFA'
                  : kind === 'yagan'
                    ? '#2DD4BF'
                    : '#FB7185',
        alpha: 0.95,
        maxLife: 0.5,
      });
    }
    this.emitHud(true);
  }

  private breakBossJutsuSeal(boss: Enemy, usedJutsu: NinjutsuType): boolean {
    if (!boss.isBoss || !boss.jutsuSealActive || boss.hp <= 0) return false;
    const stageMeta = STAGES.find((s) => s.id === this.stageId) ?? STAGES[0];
    if (usedJutsu !== stageMeta.requiredJutsu) return false;

    boss.jutsuSealActive = false;
    boss.hitFlashTimer = 0.22;
    this.triggerShake(0.62, 0, 8);
    this.audio.playGong(false);
    this.spawnFloatingText(boss.x, boss.y, boss.z + 158, 'SELO QUEBRADO!', '#FDE047', 1.28);
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2;
      this.spawnParticle({
        kind: 'spark',
        x: boss.x,
        y: boss.y,
        z: boss.z + 44,
        vx: Math.cos(ang) * (120 + Math.random() * 140),
        vy: Math.sin(ang) * 55,
        vz: 60 + Math.random() * 130,
        size: 6,
        color: i % 2 === 0 ? '#FDE047' : '#38BDF8',
        alpha: 1,
        maxLife: 0.5,
      });
    }
    boss.hp = Math.max(0, boss.hp - 75);
    if (boss.hp <= 0) {
      this.handleEnemyDefeated(boss);
    }
    this.emitHud(true);
    return true;
  }

  private updateClones(dt: number): void {
    if (this.clones.length === 0) return;
    const remaining: ShadowClone[] = [];

    for (const clone of this.clones) {
      clone.life -= dt;
      if (clone.life <= 0) {
        for (let i = 0; i < 8; i++) {
          this.spawnParticle({
            kind: 'smoke',
            x: clone.x,
            y: clone.y,
            z: clone.z + 30,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 50,
            vz: 40 + Math.random() * 70,
            size: 5,
            color: '#A78BFA',
            alpha: 0.85,
            maxLife: 0.38,
          });
        }
        continue;
      }

      if (clone.attackCooldown > 0) clone.attackCooldown -= dt;
      if (clone.attackTimer > 0) clone.attackTimer = Math.max(0, clone.attackTimer - dt);
      if (clone.throwTimer > 0) clone.throwTimer = Math.max(0, clone.throwTimer - dt);

      // Pick nearest enemy (prioritize boss if present)
      let target: Enemy | null = null;
      let bestScore = Infinity;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        const d = Math.hypot(e.x - clone.x, e.y - clone.y) - (e.isBoss ? 120 : 0);
        if (d < bestScore) {
          bestScore = d;
          target = e;
        }
      }

      if (target) {
        const dx = target.x - clone.x;
        const dy = target.y - clone.y;
        const distX = Math.abs(dx);
        const distY = Math.abs(dy);
        clone.facing = dx >= 0 ? 1 : -1;

        if (distX <= 76 && distY <= 44 && clone.attackCooldown <= 0) {
          clone.vx = 0;
          clone.vy = 0;
          clone.attackTimer = 0.22;
          clone.attackCooldown = 0.62;
          this.audio.playSlash(2);
          this.slashArcs.push({
            x: clone.x,
            y: clone.y,
            z: clone.z,
            facing: clone.facing,
            step: 2,
            life: 0.14,
            maxLife: 0.14,
            color: '#A78BFA',
            radius: 56,
          });
          this.damageEnemy(target, 24, clone.facing, false, {
            jutsuSource: 'bunshin',
            fromKatana: true,
            comboStep: 2,
          });
          this.addMoonFury(4);
        } else if (distX > 190 && distY < 38 && clone.attackCooldown <= 0) {
          clone.throwTimer = 0.16;
          clone.attackCooldown = 0.85;
          this.audio.playShuriken(false);
          this.projectiles.push({
            id: this.nextId++,
            fromPlayer: true,
            kind: 'shuriken',
            x: clone.x + clone.facing * 24,
            y: clone.y,
            z: clone.z + 64,
            vx: clone.facing * 680,
            vy: 0,
            vz: 0,
            damage: 16,
            rotation: 0,
            life: 1.1,
            radius: 16,
          });
        } else {
          const desiredX = target.x - clone.facing * 54;
          const tdx = desiredX - clone.x;
          const speed = 290;
          clone.vx = Math.abs(tdx) > 8 ? Math.sign(tdx) * speed : 0;
          clone.vy = distY > 10 ? Math.sign(dy) * speed * 0.65 : 0;
        }
      } else {
        // Follow behind player cleanly when no enemy is active
        const followX = this.player.x - this.player.facing * 64;
        const dx = followX - clone.x;
        const dy = this.player.y - clone.y;
        clone.facing = this.player.facing;
        clone.vx = Math.abs(dx) > 14 ? Math.sign(dx) * 260 : 0;
        clone.vy = Math.abs(dy) > 12 ? Math.sign(dy) * 160 : 0;
      }

      clone.x += clone.vx * dt;
      clone.y += clone.vy * dt;
      clone.x = Math.max(this.cameraX + 24, Math.min(this.cameraX + LOGICAL_WIDTH - 24, clone.x));
      clone.y = Math.max(FLOOR_TOP + 12, Math.min(FLOOR_BOTTOM, clone.y));
      clone.groundZ = this.getSupportingPlatformZ(clone.x, clone.y, clone.z + 18);
      clone.z = clone.groundZ;

      const mag = Math.hypot(clone.vx, clone.vy);
      if (mag > 16) clone.runCycle += dt * 11;
      remaining.push(clone);
    }

    this.clones = remaining;
  }

  private damageEnemy(
    enemy: Enemy,
    amount: number,
    knockDir: 1 | -1,
    heavy: boolean,
    options?: {
      bypassSeal?: boolean;
      jutsuSource?: NinjutsuType;
      fromProjectile?: boolean;
      fromKatana?: boolean;
      comboStep?: number;
    }
  ): void {
    const diffCfg = DIFFICULTIES[this.difficulty];
    if (options?.jutsuSource) {
      this.breakBossJutsuSeal(enemy, options.jutsuSource);
      if (enemy.hp <= 0) return;
    } else if (this.player.nightVisionTimer > 0 && enemy.isBoss && enemy.jutsuSealActive) {
      this.breakBossJutsuSeal(enemy, 'yagan');
      if (enemy.hp <= 0) return;
    }

    const stageMeta = STAGES.find((s) => s.id === this.stageId) ?? STAGES[0];
    let finalAmount = amount;
    if (enemy.isBoss && enemy.jutsuSealActive && !options?.bypassSeal) {
      finalAmount = Math.max(2, Math.round(amount * 0.15));
      this.player.chi = Math.min(this.player.maxChi, this.player.chi + 8);
      if (this.sealHintCooldown <= 0) {
        this.sealHintCooldown = 1.6;
        const reqMeta = NINJUTSU_LIST.find((n) => n.id === stageMeta.requiredJutsu) ?? NINJUTSU_LIST[0];
        this.spawnFloatingText(
          enemy.x,
          enemy.y,
          enemy.z + 165,
          `SELO! USE ${reqMeta.name.toUpperCase()} (${reqMeta.key})`,
          reqMeta.color,
          1.05
        );
      }
    } else if (stageMeta.denseFog) {
      if (this.player.nightVisionTimer > 0) {
        finalAmount = Math.round(amount * 1.2);
      } else if (!options?.bypassSeal) {
        const distToPlayer = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (distToPlayer > 110 || options?.fromProjectile) {
          finalAmount = Math.max(3, Math.round(amount * 0.45));
          if (this.sealHintCooldown <= 0) {
            this.sealHintCooldown = 1.9;
            this.spawnFloatingText(
              enemy.x,
              enemy.y,
              enemy.z + 150,
              'NEBLINA! USE VISÃO NOTURNA (6)',
              '#2DD4BF',
              0.98
            );
          }
        }
      }
    }

    const wasUnaware = enemy.aiState === 'idle' || (enemy.alertTimer ?? 0) <= 0;
    if (wasUnaware && !enemy.isBoss && this.weather.currentKind !== 'clear') {
      finalAmount = Math.round(finalAmount * 1.3);
      this.spawnFloatingText(enemy.x, enemy.y, enemy.z + 158, 'EMBOSCADA! +30%', '#5EEAD4', 1.02);
    }

    enemy.hp -= finalAmount;
    enemy.hitFlashTimer = 0.1;
    enemy.alertTimer = 5.2;
    enemy.alertFlashTimer = 0.65;
    if (enemy.aiState === 'idle') {
      enemy.aiState = 'chase';
    }
    for (const other of this.enemies) {
      if (other.id !== enemy.id && other.hp > 0 && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 185) {
        other.alertTimer = Math.max(other.alertTimer ?? 0, 4.2);
        if (other.aiState === 'idle') {
          other.aiState = 'chase';
          other.alertFlashTimer = 0.65;
        }
      }
    }
    enemy.squashX = 0.8;
    enemy.squashY = 1.2;

    this.comboCount++;
    this.comboDecayTimer = 3.2;
    if (this.comboCount > this.maxCombo) this.maxCombo = this.comboCount;
    if (this.comboCount > this.stageMaxCombo) this.stageMaxCombo = this.comboCount;
    if (this.comboCount >= 15) this.tryUnlockAchievement('combo_15');
    if (this.comboCount >= 50) this.tryUnlockAchievement('combo_50');

    const multiplier = (1 + Math.min(3, Math.floor(this.comboCount / 5) * 0.5)) * diffCfg.scoreMult;
    this.score += Math.round((heavy ? 75 : 40) * multiplier);
    this.player.chi = Math.min(this.player.maxChi, this.player.chi + (heavy ? 12 : 7));

    this.hitstopTimer = Math.max(this.hitstopTimer, heavy ? 0.065 : 0.032);
    this.triggerShake(heavy ? 0.36 : 0.16, knockDir * (heavy ? 5 : 2), heavy ? 3 : 1);
    this.audio.playHit(heavy);

    this.spawnFloatingText(
      enemy.x + (Math.random() - 0.5) * 16,
      enemy.y,
      enemy.z + (enemy.isBoss || enemy.type === 'oni' ? 148 : 120),
      `${finalAmount}`,
      heavy ? '#FBBF24' : '#F8FAFC',
      heavy ? 1.2 : 0.95
    );

    if (options?.fromKatana) {
      this.spawnKatanaImpactVfx(enemy, knockDir, heavy, options.comboStep ?? (heavy ? 3 : 1));
    } else {
      for (let i = 0; i < (heavy ? 10 : 6); i++) {
        this.spawnParticle({
          kind: i % 2 === 0 ? 'spark' : 'blood_ink',
          x: enemy.x,
          y: enemy.y,
          z: enemy.z + 36,
          groundZ: enemy.groundZ,
          vx: knockDir * (90 + Math.random() * 210),
          vy: (Math.random() - 0.5) * 90,
          vz: 70 + Math.random() * 140,
          size: 5,
          color: i % 2 === 0 ? '#FDE68A' : '#E11D48',
          alpha: 0.95,
          maxLife: 0.28 + Math.random() * 0.18,
        });
      }
    }

    const knockForce = heavy ? 270 : 120;
    if (!enemy.superArmor || heavy || enemy.hp <= 0) {
      enemy.vx = knockDir * knockForce;
      if (heavy) enemy.vz = 140;
      if (!enemy.superArmor || enemy.aiState !== 'windup') {
        enemy.aiState = 'hurt';
        enemy.stateTimer = heavy ? 0.34 : 0.22;
      }
    } else {
      enemy.vx = knockDir * 45;
    }

    if (enemy.isBoss && enemy.bossPhase === 1 && enemy.hp > 0 && enemy.hp <= enemy.maxHp * 0.5) {
      enemy.bossPhase = 2;
      enemy.speed *= 1.22;
      enemy.jutsuSealActive = true;
      this.spawnFloatingText(enemy.x, enemy.y, 115, 'FASE II · SELO RENOVADO!', '#E11D48', 1.22);
      this.audio.playGong(true);
      this.triggerShake(0.78, 0, 9);
      if (!enemy.summonedAdds) {
        enemy.summonedAdds = true;
        this.summonBossMinions(enemy, 2);
      }
    }

    if (enemy.hp <= 0) {
      this.handleEnemyDefeated(enemy);
    }
  }

  private getBossMinionPool(bossType: EnemyType): EnemyType[] {
    if (bossType === 'boss_kagerou') return ['scout', 'ronin'];
    if (bossType === 'boss_hotaru') return ['kunoichi', 'scout'];
    if (bossType === 'boss_raiden') return ['kunoichi', 'ronin'];
    if (bossType === 'boss_umigame') return ['scout', 'ronin'];
    if (bossType === 'boss_tetsujin') return ['ronin', 'oni'];
    if (bossType === 'boss_yuki') return ['kunoichi', 'scout'];
    if (bossType === 'boss_enma') return ['kunoichi', 'oni'];
    if (bossType === 'boss_tetsuo') return ['scout', 'kunoichi', 'ronin'];
    return ['ronin', 'kunoichi', 'oni'];
  }

  private summonBossMinions(boss: Enemy, desiredCount: number): void {
    const maxActiveMinions = this.difficulty === 'hard' ? 4 : 3;
    const activeMinions = this.enemies.filter((e) => !e.isBoss && e.hp > 0).length;
    const slots = Math.max(0, maxActiveMinions - activeMinions);
    const toSpawn = Math.min(desiredCount, slots);
    if (toSpawn <= 0) return;

    const pool = this.getBossMinionPool(boss.type);
    const stageDef = STAGE_DEFS[this.stageId];
    const bossArenaPlat = stageDef.platforms[stageDef.platforms.length - 1];

    this.spawnFloatingText(boss.x, boss.y, boss.z + 150, 'CAPANGAS!', '#FB7185', 1.2);
    this.audio.playGong(false);
    this.triggerShake(0.4, 0, 5);

    for (let i = 0; i < toSpawn; i++) {
      const mType = pool[(Math.floor(Math.random() * pool.length) + i) % pool.length];
      const spawnFromLeft = i % 2 === 0 ? boss.x > this.cameraX + LOGICAL_WIDTH * 0.5 : boss.x <= this.cameraX + LOGICAL_WIDTH * 0.5;
      let sx = spawnFromLeft ? this.cameraX + 68 : this.cameraX + LOGICAL_WIDTH - 68;
      let sy = i % 2 === 0 ? 458 : 596;
      let sz = 0;

      if (mType === 'kunoichi' && bossArenaPlat && Math.random() < 0.55) {
        sx = (bossArenaPlat.x1 + bossArenaPlat.x2) * 0.5 + (Math.random() - 0.5) * 90;
        sy = (bossArenaPlat.y1 + bossArenaPlat.y2) * 0.5;
        sz = bossArenaPlat.z;
      }

      const minion = this.spawnEnemy(mType, sx, sy);
      if (sz > 0) {
        minion.z = sz;
        minion.groundZ = sz;
      }
      minion.hitFlashTimer = 0.14;

      for (let k = 0; k < 10; k++) {
        const ang = (k / 10) * Math.PI * 2;
        this.spawnParticle({
          kind: k % 2 === 0 ? 'smoke' : 'spark',
          x: sx,
          y: sy,
          z: sz + 34,
          vx: Math.cos(ang) * (45 + Math.random() * 65),
          vy: Math.sin(ang) * 24,
          vz: 40 + Math.random() * 75,
          size: k % 2 === 0 ? 6 : 4,
          color: k % 2 === 0 ? '#E11D48' : '#FDE047',
          alpha: 0.9,
          maxLife: 0.42,
        });
      }
    }
  }

  private handleEnemyDefeated(enemy: Enemy): void {
    const diffCfg = DIFFICULTIES[this.difficulty];
    this.enemiesDefeated++;
    const baseBonus = enemy.isBoss ? 1500 : enemy.type === 'oni' ? 350 : enemy.type === 'kunoichi' ? 200 : 140;
    this.score += Math.round(baseBonus * diffCfg.scoreMult);

    const bestiaryUpdate = recordEnemyDefeatedInStore(enemy.type);
    this.onBestiaryUpdate?.();
    if (bestiaryUpdate.isFirstDiscovery) {
      this.spawnFloatingText(enemy.x, enemy.y, enemy.z + 118, 'NOVO NO BESTIÁRIO!', '#38BDF8', 0.95);
    }

    for (let i = 0; i < 12; i++) {
      this.spawnParticle({
        kind: 'smoke',
        x: enemy.x,
        y: enemy.y,
        z: enemy.z + 30,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 90,
        vz: 60 + Math.random() * 140,
        size: 7,
        color: i % 3 === 0 ? '#FB7185' : '#475569',
        alpha: 0.85,
        maxLife: 0.5,
      });
    }

    const dropChance = Math.max(0.1, (enemy.type === 'oni' ? 0.9 : 0.22) + diffCfg.healDropBonus);
    if (Math.random() < dropChance) {
      const r = Math.random();
      const kind: PickupKind = r < 0.45 ? 'onigiri' : r < 0.75 ? 'chi_scroll' : 'shuriken_pack';
      this.pickups.push({
        id: this.nextId++,
        kind,
        x: enemy.x,
        y: enemy.y,
        z: enemy.z + 20,
        vz: 160,
        life: 16,
        bobPhase: Math.random() * Math.PI * 2,
      });
    }

    if (enemy.isBoss) {
      for (const minion of this.enemies) {
        if (minion.id !== enemy.id && minion.hp > 0) {
          for (let i = 0; i < 8; i++) {
            this.spawnParticle({
              kind: 'smoke',
              x: minion.x,
              y: minion.y,
              z: minion.z + 32,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 60,
              vz: 50 + Math.random() * 90,
              size: 6,
              color: '#94A3B8',
              alpha: 0.85,
              maxLife: 0.42,
            });
          }
        }
      }
      this.enemies = this.enemies.filter((e) => e.id === enemy.id);
      this.zoneCleared = true;
      this.zoneActive = false;
      this.emitHud(true);
      this.triggerShake(0.88, 0, 10);
      this.audio.playGong(true);

      if (!this.tookDamageThisStage) {
        this.tryUnlockAchievement('no_damage_stage');
      }
      if (this.bossSpawnTimestamp !== null && this.elapsedSeconds - this.bossSpawnTimestamp < 60) {
        this.tryUnlockAchievement('boss_speedrun');
      }
      if (this.stageId === 'fortress' && this.difficulty === 'hard') {
        this.tryUnlockAchievement('shogun_hard');
      }
      if (this.karma >= 40 && this.civiliansHarmed === 0) {
        this.tryUnlockAchievement('karma_guardian');
      }

      const isFinalStage = this.stageId === 'eclipse_citadel';
      window.setTimeout(() => {
        if (this.running) {
          this.setPaused(true);
          if (isFinalStage) {
            const reward = computeKarmaFinalReward(
              this.karma,
              this.civiliansRescued,
              this.civiliansHarmed,
              this.enemiesDefeated,
              DIFFICULTIES[this.difficulty].scoreMult
            );
            this.score += reward.totalRewardPoints;
            this.lastVictoryKarmaReward = reward;
            recordKarmaEndingInStore(this.karma, reward, this.civiliansRescued, this.civiliansHarmed);
          }
          this.onGameEnd(isFinalStage ? 'VICTORY' : 'STAGE_CLEAR', this.buildHudSnapshot());
        }
      }, 850);
    }
  }

  private tryUnlockAchievement(id: AchievementId): void {
    const { newlyUnlocked } = unlockAchievementInStore(id);
    if (newlyUnlocked) {
      this.notifyAchievementUnlocked(newlyUnlocked);
    }
  }

  private notifyAchievementUnlocked(achievement: AchievementDef): void {
    this.audio.playAchievement();
    this.onAchievementUnlock?.(achievement);
  }

  private damageCrate(crate: Crate, dmg: number): void {
    crate.hp -= dmg;
    crate.hitFlashTimer = 0.1;
    crate.wobble = 1;
    this.audio.playHit(false);
    for (let i = 0; i < 6; i++) {
      this.spawnParticle({
        kind: 'dust',
        x: crate.x,
        y: crate.y,
        z: crate.z + 24,
        vx: (Math.random() - 0.5) * 140,
        vy: (Math.random() - 0.5) * 60,
        vz: 60 + Math.random() * 90,
        size: 5,
        color: crate.kind === 'wooden_crate' ? '#B45309' : '#64748B',
        alpha: 0.9,
        maxLife: 0.4,
      });
    }
    if (crate.hp <= 0) {
      this.score += Math.round(100 * DIFFICULTIES[this.difficulty].scoreMult);
      this.pickups.push({
        id: this.nextId++,
        kind: crate.drop,
        x: crate.x,
        y: crate.y,
        z: crate.z + 24,
        vz: 210,
        life: 20,
        bobPhase: Math.random() * 6,
      });
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    const diffCfg = DIFFICULTIES[this.difficulty];
    const weatherMod = this.getWeatherModifiers();

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;

      if (e.hitFlashTimer > 0) e.hitFlashTimer -= dt;
      if ((e.alertTimer ?? 0) > 0) e.alertTimer = Math.max(0, (e.alertTimer ?? 0) - dt);
      if ((e.alertFlashTimer ?? 0) > 0) e.alertFlashTimer = Math.max(0, (e.alertFlashTimer ?? 0) - dt);
      if ((e.hazardSlowTimer ?? 0) > 0) e.hazardSlowTimer = Math.max(0, (e.hazardSlowTimer ?? 0) - dt);
      if ((e.hazardStunTimer ?? 0) > 0) e.hazardStunTimer = Math.max(0, (e.hazardStunTimer ?? 0) - dt);
      if ((e.crateBumpCooldown ?? 0) > 0) e.crateBumpCooldown = Math.max(0, (e.crateBumpCooldown ?? 0) - dt);

      // Process lingering burn / poison obstacle effects on enemies
      if ((e.hazardDotTimer ?? 0) > 0) {
        e.hazardDotTimer = Math.max(0, (e.hazardDotTimer ?? 0) - dt);
        e.hazardDotTickTimer = (e.hazardDotTickTimer ?? 0.45) - dt;
        if (Math.random() < dt * 7) {
          const dotColor = e.hazardStatus === 'poison' ? '#4ADE80' : '#FB923C';
          this.spawnParticle({
            kind: e.hazardStatus === 'poison' ? 'smoke' : 'ember',
            x: e.x + (Math.random() - 0.5) * 26,
            y: e.y + (Math.random() - 0.5) * 12,
            z: e.z + 20 + Math.random() * 48,
            vx: (Math.random() - 0.5) * 35,
            vy: (Math.random() - 0.5) * 18,
            vz: 45 + Math.random() * 65,
            size: e.hazardStatus === 'poison' ? 4 : 3.5,
            color: dotColor,
            alpha: 0.85,
            maxLife: 0.32,
          });
        }
        if ((e.hazardDotTickTimer ?? 0) <= 0) {
          e.hazardDotTickTimer = 0.55;
          const baseDot = e.hazardStatus === 'burn' ? 7 : 6;
          const dotDmg = e.jutsuSealActive ? 2 : e.isBoss ? Math.max(3, Math.round(baseDot * 0.7)) : baseDot;
          e.hp -= dotDmg;
          e.hitFlashTimer = Math.max(e.hitFlashTimer, 0.06);
          const dotCol = e.hazardStatus === 'poison' ? '#4ADE80' : '#FB923C';
          this.spawnFloatingText(e.x, e.y, e.z + (e.isBoss ? 142 : 112), `-${dotDmg}`, dotCol, 0.84);
          if (e.hp <= 0) {
            this.score += Math.round(65 * diffCfg.scoreMult);
            this.spawnFloatingText(
              e.x,
              e.y,
              e.z + 138,
              e.hazardStatus === 'poison' ? 'ENVENENADO!' : 'INCINERADO!',
              dotCol,
              0.98
            );
            this.handleEnemyDefeated(e);
            continue;
          }
        }
      }

      if ((e.hazardSlowTimer ?? 0) <= 0 && (e.hazardStunTimer ?? 0) <= 0 && (e.hazardDotTimer ?? 0) <= 0) {
        e.hazardStatus = null;
      }

      const enemyHazardSlowMult =
        (e.hazardSlowTimer ?? 0) > 0
          ? e.hazardStatus === 'frost'
            ? 0.45
            : e.hazardStatus === 'poison'
              ? 0.54
              : 0.62
          : 1.0;

      if (e.attackCooldown > 0) e.attackCooldown -= dt * (1 / weatherMod.cooldownMult) * enemyHazardSlowMult;
      e.squashX += (1 - e.squashX) * Math.min(1, dt * 14);
      e.squashY += (1 - e.squashY) * Math.min(1, dt * 14);

      e.groundZ = this.getSupportingPlatformZ(e.x, e.y, e.z);
      if (e.z > e.groundZ || e.vz > 0) {
        e.z += e.vz * dt;
        e.vz -= 1300 * dt;
        e.groundZ = this.getSupportingPlatformZ(e.x, e.y, e.z);
        if (e.z <= e.groundZ && e.vz <= 0) {
          e.z = e.groundZ;
          e.vz = 0;
        }
      }

      e.stateTimer -= dt;

      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const distX = Math.abs(dx);
      const distY = Math.abs(dy);
      const distToPlayer = Math.hypot(dx, dy);
      const enemyDetectRange = this.getEnemyDetectionRange(e);
      const cloneDetected = this.clones.some((c) => Math.hypot(c.x - e.x, c.y - e.y) <= enemyDetectRange * 0.9);
      const inDetectionRange = distToPlayer <= enemyDetectRange || cloneDetected;
      const isAlerted =
        inDetectionRange ||
        (e.alertTimer ?? 0) > 0 ||
        (e.isBoss && e.hp < e.maxHp);

      if (inDetectionRange) {
        if (e.aiState === 'idle' && (e.alertTimer ?? 0) <= 0.05) {
          this.spawnFloatingText(e.x, e.y, e.z + 132, '!', '#FBBF24', 1.08);
          e.alertFlashTimer = 0.85;
        }
        e.alertTimer = Math.max(e.alertTimer ?? 0, 4.2);
      }

      if ((e.hazardStunTimer ?? 0) > 0 && !e.superArmor) {
        e.vx *= Math.pow(0.02, dt);
        e.vy = 0;
        if (e.aiState === 'windup' || e.aiState === 'attack') {
          e.aiState = 'hurt';
          e.stateTimer = Math.max(e.stateTimer, 0.14);
        }
      } else if (e.aiState === 'hurt') {
        e.vx *= Math.pow(0.015, dt);
        e.vy = 0;
        if (e.stateTimer <= 0) {
          e.aiState = 'chase';
          e.stateTimer = 0.2;
        }
      } else if (e.aiState === 'windup') {
        e.vx = 0;
        e.vy = 0;
        if (e.stateTimer <= 0) {
          this.executeEnemyAttack(e);
        }
      } else if (e.aiState === 'attack') {
        if (e.attackKind === 'dash_slash' && e.dashTargetX !== undefined && e.dashTargetY !== undefined) {
          const tdx = e.dashTargetX - e.x;
          const tdy = e.dashTargetY - e.y;
          const dist = Math.hypot(tdx, tdy) || 1;
          e.vx = (tdx / dist) * 740 * weatherMod.speedMult * enemyHazardSlowMult;
          e.vy = (tdy / dist) * 410 * weatherMod.speedMult * enemyHazardSlowMult;
          this.afterimages.push({
            x: e.x,
            y: e.y,
            z: e.z,
            facing: e.facing,
            alpha: 0.75,
            pose: 'dash',
          });
          if (Math.hypot(p.x - e.x, p.y - e.y) < 56 && Math.abs(p.z - e.z) < 48) {
            this.damagePlayer(e.damage, e.facing, true);
          }
        } else {
          e.vx *= Math.pow(0.05, dt);
          e.vy = 0;
        }
        if (e.stateTimer <= 0) {
          e.aiState = 'recover';
          e.stateTimer = (e.isBoss ? (e.bossPhase === 2 ? 0.34 : 0.52) : 0.45) * weatherMod.cooldownMult;
          e.attackCooldown =
            (e.isBoss ? (e.bossPhase === 2 ? 0.72 : 1.05) : 1.15 + Math.random() * 0.5) *
            diffCfg.windupMult *
            weatherMod.cooldownMult;
        }
      } else if (e.aiState === 'recover') {
        e.vx *= Math.pow(0.03, dt);
        e.vy = 0;
        if (e.stateTimer <= 0) e.aiState = 'chase';
      } else if (e.aiState === 'retreat') {
        e.vx *= Math.pow(0.18, dt);
        if (e.stateTimer <= 0) {
          e.aiState = 'chase';
          e.stateTimer = 0.25;
        }
      } else if (!isAlerted) {
        // Outside weather detection radius: patrol cautiously without aggro
        e.aiState = 'idle';
        const anchorX = e.patrolAnchorX ?? e.x;
        let dir = e.patrolDir ?? 1;
        const minBound = Math.max(this.cameraX + 42, anchorX - 68);
        const maxBound = Math.min(this.cameraX + LOGICAL_WIDTH - 42, anchorX + 68);
        if (e.x >= maxBound) dir = -1;
        else if (e.x <= minBound) dir = 1;
        e.patrolDir = dir;
        e.facing = dir;
        const patrolSpeed = e.speed * weatherMod.speedMult * enemyHazardSlowMult * 0.36;
        const desiredVx = e.groundZ > 0 ? 0 : dir * patrolSpeed;
        const steer = 1 - Math.exp(-8 * dt);
        e.vx += (desiredVx - e.vx) * steer;
        e.vy += (0 - e.vy) * steer;
      } else {
        e.aiState = 'chase';
        e.facing = dx >= 0 ? 1 : -1;
        let desiredVx = 0;
        let desiredVy = 0;
        const effectiveSpeed = e.speed * weatherMod.speedMult * enemyHazardSlowMult;

        if (e.type === 'kunoichi') {
          if (e.groundZ > 0) {
            if (distX <= 540 && e.attackCooldown <= 0) {
              e.aiState = 'windup';
              e.attackKind = 'ranged';
              e.stateTimer = 0.42 * diffCfg.windupMult * weatherMod.windupMult;
            }
          } else {
            // Nimble ninja backflip evade when player gets too close!
            if (distX < 135 && e.z <= e.groundZ + 2 && e.attackCooldown <= 0.4 && Math.random() < 0.08 * weatherMod.speedMult) {
              e.aiState = 'retreat';
              e.stateTimer = 0.42;
              e.vx = -e.facing * 320 * weatherMod.speedMult * enemyHazardSlowMult;
              e.vz = 280;
              this.spawnDustBurst(e.x, e.y, e.groundZ, 4);
            } else {
              const moveDirX = distX < 180 ? -e.facing : distX > 360 ? e.facing : 0;
              desiredVx = moveDirX * effectiveSpeed;
              desiredVy = Math.abs(dy) > 12 ? Math.sign(dy) * Math.min(1, Math.abs(dy) / 36) * effectiveSpeed * 0.65 : 0;
              if (distX >= 170 && distX <= 460 && distY < 32 && e.attackCooldown <= 0) {
                e.aiState = 'windup';
                e.attackKind = 'ranged';
                e.stateTimer = 0.42 * diffCfg.windupMult * weatherMod.windupMult;
              }
            }
          }
        } else if (e.isBoss) {
          if (e.summonCooldown > 0) e.summonCooldown -= dt * (1 / weatherMod.cooldownMult);
          const maxMinions = this.difficulty === 'hard' ? 4 : 3;
          const activeMinions = this.enemies.filter((m) => !m.isBoss && m.hp > 0).length;
          const meleeRange = 88;
          if (e.summonCooldown <= 0 && e.attackCooldown <= 0 && activeMinions < maxMinions) {
            e.aiState = 'windup';
            e.attackKind = 'summon';
            e.stateTimer = 0.7 * diffCfg.windupMult * weatherMod.windupMult;
            this.spawnFloatingText(e.x, e.y, e.z + 146, 'CHAMANDO REFORÇOS!', '#FBBF24', 1.05);
          } else if (
            distX > 220 &&
            distX < 520 &&
            e.attackCooldown <= 0 &&
            Math.random() < (this.weather.currentKind === 'clear' ? 0.068 : 0.045)
          ) {
            e.aiState = 'windup';
            e.attackKind = 'dash_slash';
            e.dashTargetX = p.x + e.facing * 60;
            e.dashTargetY = p.y;
            e.stateTimer = (e.bossPhase === 2 ? 0.46 : 0.6) * diffCfg.windupMult * weatherMod.windupMult;
          } else if (distX <= meleeRange && distY < 34 && Math.abs(p.z - e.z) < 55 && e.attackCooldown <= 0) {
            e.aiState = 'windup';
            e.attackKind = Math.random() < 0.38 ? 'slam' : 'melee';
            e.stateTimer =
              (e.attackKind === 'slam' ? 0.6 : e.bossPhase === 2 ? 0.34 : 0.45) *
              diffCfg.windupMult *
              weatherMod.windupMult;
          } else {
            const targetX = p.x - e.facing * 62;
            const tdx = targetX - e.x;
            desiredVx = Math.abs(tdx) > 10 ? Math.sign(tdx) * Math.min(1, Math.abs(tdx) / 32) * effectiveSpeed : 0;
            desiredVy = Math.abs(dy) > 10 ? Math.sign(dy) * Math.min(1, Math.abs(dy) / 32) * effectiveSpeed * 0.65 : 0;
          }
        } else {
          const attackRange = e.type === 'oni' ? 88 : 68;
          if (distX <= attackRange && distY < 32 && Math.abs(p.z - e.z) < 52 && e.attackCooldown <= 0) {
            e.aiState = 'windup';
            e.attackKind = e.type === 'oni' ? 'slam' : 'melee';
            e.stateTimer = (e.type === 'oni' ? 0.64 : e.type === 'scout' ? 0.34 : 0.45) * diffCfg.windupMult * weatherMod.windupMult;
          } else {
            const sideOffset = (e.id % 2 === 0 ? 1 : -1) * 52;
            const targetX = p.x + sideOffset;
            const tdx = targetX - e.x;
            desiredVx = Math.abs(tdx) > 10 ? Math.sign(tdx) * Math.min(1, Math.abs(tdx) / 34) * effectiveSpeed : 0;
            desiredVy = Math.abs(dy) > 10 ? Math.sign(dy) * Math.min(1, Math.abs(dy) / 34) * effectiveSpeed * 0.62 : 0;
          }
        }

        const steer = 1 - Math.exp(-11 * dt);
        e.vx += (desiredVx - e.vx) * steer;
        e.vy += (desiredVy - e.vy) * steer;
      }

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      // Solid arena obstacle (crate / stone lantern / fire brazier) collision for enemies
      for (const crate of this.crates) {
        if (crate.hp <= 0) continue;
        if (Math.abs(e.z - crate.z) > 42) continue;

        const halfW = 24 + e.radius * 0.45;
        const halfH = 18;
        const cdx = e.x - crate.x;
        const cdy = e.y - crate.y;
        const overlapX = halfW - Math.abs(cdx);
        const overlapY = halfH - Math.abs(cdy);

        if (overlapX > 0 && overlapY > 0) {
          const speedMagNow = Math.hypot(e.vx, e.vy);

          // Heavy enemies or charging bosses smash straight through crates
          if ((e.isBoss || e.type === 'oni') && (e.aiState === 'attack' || speedMagNow > 240)) {
            this.damageCrate(crate, 50);
            this.triggerShake(0.22, (cdx >= 0 ? -1 : 1) * 4, 2);
            continue;
          }

          // Knocked-back enemies slammed into obstacles take collision impact damage & trigger fire braziers
          if (e.aiState === 'hurt' && speedMagNow > 120 && (e.crateBumpCooldown ?? 0) <= 0) {
            e.crateBumpCooldown = 0.45;
            const rawImpact = e.isBoss ? 10 : 14;
            const impactDmg = e.jutsuSealActive ? Math.max(3, Math.round(rawImpact * 0.2)) : rawImpact;
            e.hp -= impactDmg;
            e.hitFlashTimer = 0.14;
            e.squashX = 0.76;
            e.squashY = 1.24;
            this.damageCrate(crate, 38);
            this.triggerShake(0.2, (cdx >= 0 ? 1 : -1) * 4, 2);
            this.score += Math.round(55 * diffCfg.scoreMult);
            this.spawnFloatingText(e.x, e.y, e.z + 124, `COLISÃO! -${impactDmg}`, '#FBBF24', 1.0);

            if (crate.kind === 'fire_brazier') {
              e.hazardStatus = 'burn';
              e.hazardDotTimer = Math.max(e.hazardDotTimer ?? 0, 2.6);
              e.hazardDotTickTimer = 0.45;
              e.hazardSlowTimer = Math.max(e.hazardSlowTimer ?? 0, 0.9);
              this.spawnFloatingText(e.x, e.y, e.z + 148, 'EM CHAMAS!', '#FB923C', 0.96);
              for (let k = 0; k < 8; k++) {
                this.spawnParticle({
                  kind: 'ember',
                  x: crate.x + (Math.random() - 0.5) * 20,
                  y: crate.y + (Math.random() - 0.5) * 12,
                  z: crate.z + 28 + Math.random() * 24,
                  vx: (Math.random() - 0.5) * 150,
                  vy: (Math.random() - 0.5) * 60,
                  vz: 75 + Math.random() * 110,
                  size: 4.5,
                  color: k % 2 === 0 ? '#FB923C' : '#FDE047',
                  alpha: 0.95,
                  maxLife: 0.36,
                });
              }
            }

            if (e.hp <= 0) {
              this.handleEnemyDefeated(e);
              break;
            }
          }

          // Contact with a live fire brazier singes enemies that brush directly against it
          if (crate.kind === 'fire_brazier' && crate.hp > 0 && (e.crateBumpCooldown ?? 0) <= 0) {
            e.crateBumpCooldown = 0.85;
            e.hazardStatus = 'burn';
            e.hazardDotTimer = Math.max(e.hazardDotTimer ?? 0, 2.0);
            e.hazardDotTickTimer = Math.min(e.hazardDotTickTimer ?? 0.45, 0.45);
            e.hazardSlowTimer = Math.max(e.hazardSlowTimer ?? 0, 0.6);
            this.spawnFloatingText(e.x, e.y, e.z + 122, 'QUEIMADURA!', '#FB923C', 0.9);
          }

          // Smooth physical separation so enemies route around intact obstacles without wedging
          if (overlapX < overlapY) {
            const pushDir = cdx >= 0 ? 1 : -1;
            e.x += pushDir * overlapX;
            if (e.aiState === 'hurt') {
              e.vx = pushDir * Math.abs(e.vx) * 0.32;
            } else {
              e.vx = 0;
              // Gently steer vertically around the obstacle when blocked horizontally
              const avoidDir = cdy >= 0 ? 1 : -1;
              e.y += avoidDir * Math.min(60 * dt, overlapY + 2);
            }
            if (e.aiState === 'idle') {
              e.patrolDir = pushDir as 1 | -1;
            }
          } else {
            const pushDir = cdy >= 0 ? 1 : -1;
            e.y += pushDir * overlapY;
            e.vy = 0;
          }
          crate.wobble = Math.max(crate.wobble, 0.35);
        }
      }

      if (e.hp <= 0) continue;

      e.y = Math.max(FLOOR_TOP + 14, Math.min(FLOOR_BOTTOM, e.y));
      e.x = Math.max(this.cameraX + 20, Math.min(this.cameraX + LOGICAL_WIDTH - 20, e.x));

      const eSpeedMag = Math.hypot(e.vx, e.vy);
      if (eSpeedMag > 14) {
        e.runCycle += dt * (4 + (eSpeedMag / Math.max(60, e.speed)) * 8);
      }
    }

    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }

  private executeEnemyAttack(e: Enemy): void {
    const p = this.player;
    const weatherMod = this.getWeatherModifiers();
    e.aiState = 'attack';

    if (e.attackKind === 'ranged') {
      e.stateTimer = 0.16;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dz = p.z - e.z;
      const len = Math.hypot(dx, dy, dz) || 1;
      const spd = 440 * weatherMod.projSpeedMult;
      this.audio.playShuriken(false);
      this.projectiles.push({
        id: this.nextId++,
        fromPlayer: false,
        kind: 'kunai',
        x: e.x + e.facing * 24,
        y: e.y,
        z: e.z + 78,
        vx: (dx / len) * spd,
        vy: (dy / len) * spd * 0.55,
        vz: (dz / len) * spd * 0.65,
        damage: e.damage,
        rotation: 0,
        life: 2.2,
        radius: 14,
      });
    } else if (e.attackKind === 'slam') {
      e.stateTimer = 0.25;
      e.squashX = e.isBoss ? 1.32 : 1.24;
      e.squashY = e.isBoss ? 0.72 : 0.78;
      if (e.isBoss) {
        this.triggerShake(e.bossPhase === 2 ? 0.85 : 0.72, 0, 12);
        this.audio.playLandingThud(1.0);
        this.spawnDustBurst(e.x, e.y, e.groundZ, 16);
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2;
          this.spawnParticle({
            kind: 'spark',
            x: e.x + Math.cos(ang) * 18,
            y: e.y + Math.sin(ang) * 8,
            z: e.groundZ + 6,
            vx: Math.cos(ang) * 230,
            vy: Math.sin(ang) * 95,
            vz: 45 + Math.random() * 80,
            size: 5,
            color: e.bossPhase === 2 ? '#FB7185' : '#FBBF24',
            alpha: 0.95,
            maxLife: 0.36,
          });
        }
      } else {
        this.triggerShake(0.38, 0, 7);
        this.spawnDustBurst(e.x, e.y, e.groundZ, 10);
      }
      this.audio.playHit(true);
      const dist = Math.hypot(p.x - e.x, (p.y - e.y) * 2.1);
      if (e.isBoss && dist <= 220) {
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.04);
      }
      if (dist <= 118 && Math.abs(p.z - e.z) < 42) {
        this.damagePlayer(e.damage, p.x >= e.x ? 1 : -1, e.isBoss);
      }
    } else if (e.attackKind === 'summon') {
      e.stateTimer = 0.28;
      e.squashX = 1.24;
      e.squashY = 0.8;
      const count = e.bossPhase === 2 || this.difficulty === 'hard' ? 2 : 1;
      this.summonBossMinions(e, count);
      e.summonCooldown = (e.bossPhase === 2 ? 8.5 : 11.5) * (this.difficulty === 'hard' ? 0.85 : 1);
    } else if (e.attackKind === 'dash_slash') {
      e.stateTimer = 0.22;
      this.triggerShake(e.bossPhase === 2 ? 0.58 : 0.46, e.facing * 10, 3);
      this.spawnDustBurst(e.x, e.y, e.groundZ, 8);
      this.audio.playSlash(3);
    } else {
      e.stateTimer = 0.18;
      if (e.isBoss) {
        this.triggerShake(e.bossPhase === 2 ? 0.44 : 0.34, e.facing * 7, 4);
      }
      this.audio.playSlash(1);
      this.slashArcs.push({
        x: e.x,
        y: e.y,
        z: e.z,
        facing: e.facing,
        step: 1,
        life: 0.12,
        maxLife: 0.12,
        color: '#FB7185',
        radius: e.isBoss ? 64 : 48,
      });
      const dx = (p.x - e.x) * e.facing;
      const dy = Math.abs(p.y - e.y);
      if (dx >= -15 && dx <= 78 && dy <= 38 && Math.abs(p.z - e.z) < 50) {
        this.damagePlayer(e.damage, e.facing, e.isBoss);
      }
    }
  }

  private damagePlayer(amount: number, knockDir: 1 | -1, heavy = false): void {
    const p = this.player;
    if (p.invulnTimer > 0 || p.hp <= 0) return;

    // Ikazuchi Lightning Shield absorbs damage!
    if (p.shieldHits > 0) {
      p.shieldHits--;
      p.invulnTimer = 0.7;
      this.audio.playNinjutsu('ikazuchi');
      this.triggerShake(0.35, knockDir * 4, 4);
      this.spawnFloatingText(p.x, p.y, p.z + 80, 'IKAZUCHI!', '#38BDF8', 1.05);
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 180) {
          this.damageEnemy(enemy, 20, enemy.x >= p.x ? 1 : -1, false, { jutsuSource: 'ikazuchi' });
        }
      }
      this.emitHud(true);
      return;
    }

    p.hp = Math.max(0, p.hp - amount);
    this.tookDamageThisStage = true;
    this.damageTakenThisStage += amount;
    p.invulnTimer = 0.85;
    p.hitFlashTimer = 0.14;
    p.hurtTimer = 0.24;
    p.attackTimer = 0;
    p.squashX = 0.82;
    p.squashY = 1.2;
    p.vx = knockDir * (heavy ? 260 : 210);
    this.comboCount = 0;

    this.hitstopTimer = heavy ? 0.075 : 0.055;
    this.triggerShake(heavy ? 0.64 : 0.42, knockDir * (heavy ? 9 : 5), heavy ? 5 : 3);
    this.audio.playPlayerHurt();

    this.spawnFloatingText(p.x, p.y, p.z + 75, `-${amount}`, '#FB7185', 1.05);
    this.emitHud(true);

    if (p.hp <= 0) {
      this.setPaused(true);
      this.onGameEnd('GAME_OVER', this.buildHudSnapshot());
    }
  }

  private getHazardColor(kind: EnvironmentalHazard['kind']): string {
    if (kind === 'electric_pool') return '#38BDF8';
    if (kind === 'poison_mire') return '#4ADE80';
    if (kind === 'frost_fissure') return '#A5F3FC';
    if (kind === 'eclipse_fire') return '#F43F5E';
    if (kind === 'cave_rockfall') return '#CBD5E1';
    return '#FB923C';
  }

  private updateDynamicStormPuddles(dt: number): void {
    // Expire temporary storm electrified puddles
    const nextHazards: EnvironmentalHazard[] = [];
    for (const h of this.hazards) {
      if (h.life !== undefined) {
        h.life -= dt;
        if (h.life <= 0) continue;
      }
      nextHazards.push(h);
    }
    this.hazards = nextHazards;

    const isStorming = this.weather.currentKind === 'storm' || this.weather.targetKind === 'storm';
    if (!isStorming) {
      this.stormPuddleTimer = Math.min(this.stormPuddleTimer, 0.9);
      return;
    }

    const activeStormPuddles = this.hazards.filter((h) => h.isStormDynamic).length;
    this.stormPuddleTimer -= dt;
    if (this.stormPuddleTimer <= 0 && activeStormPuddles < 2) {
      this.stormPuddleTimer = 3.6 + Math.random() * 1.8;
      this.spawnStormElectrifiedPuddle();
    }
  }

  private spawnStormElectrifiedPuddle(): void {
    const activeEnemy = this.enemies.find((e) => e.hp > 0);
    const minX = this.cameraX + 140;
    const maxX = this.cameraX + LOGICAL_WIDTH - 160;
    let cx = activeEnemy
      ? activeEnemy.x + (Math.random() - 0.5) * 140
      : this.player.x + this.player.facing * (180 + Math.random() * 160);
    cx = Math.max(minX, Math.min(maxX, cx));

    let cy = activeEnemy ? activeEnemy.y : 460 + Math.random() * 140;
    cy = Math.max(FLOOR_TOP + 54, Math.min(FLOOR_BOTTOM - 54, cy));

    // Avoid spawning directly beneath a stationary player at the exact start
    if (Math.abs(cx - this.player.x) < 95 && Math.abs(cy - this.player.y) < 55) {
      cx = cx < this.cameraX + LOGICAL_WIDTH * 0.5 ? Math.min(maxX, cx + 150) : Math.max(minX, cx - 150);
    }

    const halfW = 58 + Math.random() * 18;
    const halfH = 44 + Math.random() * 12;
    const x1 = Math.round(cx - halfW);
    const x2 = Math.round(cx + halfW);
    const y1 = Math.max(FLOOR_TOP + 4, Math.round(cy - halfH));
    const y2 = Math.min(FLOOR_BOTTOM - 4, Math.round(cy + halfH));

    this.hazards.push({
      id: this.nextId++,
      kind: 'electric_pool',
      x1,
      x2,
      y1,
      y2,
      damagePerTick: 8,
      tickInterval: 0.27,
      label: 'Poça Eletrificada (Tempestade)',
      life: 9.0,
      maxLife: 9.0,
      isStormDynamic: true,
    });

    this.weather.lightningAlpha = Math.max(this.weather.lightningAlpha, 0.55);
    this.audio.playHazardTick('electric_pool');
    this.spawnFloatingText(cx, cy, 48, 'RAIO! POÇA ELETRIFICADA!', '#7DD3FC', 0.96);
    for (let i = 0; i < 12; i++) {
      this.spawnParticle({
        kind: 'lightning',
        x: cx + (Math.random() - 0.5) * halfW * 1.4,
        y: cy + (Math.random() - 0.5) * halfH * 1.2,
        z: 10 + Math.random() * 54,
        vx: (Math.random() - 0.5) * 140,
        vy: (Math.random() - 0.5) * 50,
        vz: 70 + Math.random() * 120,
        size: 4,
        color: i % 2 === 0 ? '#E0F2FE' : '#38BDF8',
        alpha: 0.95,
        maxLife: 0.32,
      });
    }
  }

  private getCaveRockfallInterval(): number | null {
    if (this.stageId === 'mines') return 2.4 + Math.random() * 1.3;
    if (this.stageId === 'temple_ruins') return 3.8 + Math.random() * 1.6;
    if (this.stageId === 'fortress') return 5.2 + Math.random() * 1.8;
    return null;
  }

  private spawnFallingDebris(): void {
    const activeEnemies = this.enemies.filter((e) => e.hp > 0);
    const targetEnemy =
      activeEnemies.length > 0 && Math.random() < 0.62
        ? activeEnemies[Math.floor(Math.random() * activeEnemies.length)]
        : null;

    const minX = this.cameraX + 90;
    const maxX = this.cameraX + LOGICAL_WIDTH - 90;
    const rawX = targetEnemy
      ? targetEnemy.x + (Math.random() - 0.5) * 90
      : this.player.x + (Math.random() - 0.5) * 280;
    const x = Math.max(minX, Math.min(maxX, rawX));

    const rawY = targetEnemy
      ? targetEnemy.y + (Math.random() - 0.5) * 44
      : FLOOR_TOP + 28 + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP - 56);
    const y = Math.max(FLOOR_TOP + 18, Math.min(FLOOR_BOTTOM - 14, rawY));

    const surf = this.findSurfaceAt(x, y, 220);
    const rockKind: FallingDebris['rockKind'] =
      this.stageId === 'mines'
        ? Math.random() < 0.55
          ? 'obsidian'
          : 'stalactite'
        : 'ruin_stone';

    const maxWarn = this.stageId === 'mines' ? 1.15 : 1.3;
    this.fallingDebris.push({
      id: this.nextId++,
      x,
      y,
      z: surf.z + 460,
      groundZ: surf.z,
      vz: 0,
      radius: 48,
      warnTimer: maxWarn,
      maxWarn,
      state: 'warning',
      impactTimer: 0.45,
      damage: this.stageId === 'mines' ? 20 : 18,
      seed: Math.random(),
      rockKind,
    });
  }

  private updateFallingDebris(dt: number): boolean {
    const p = this.player;
    const interval = this.getCaveRockfallInterval();
    if (interval !== null) {
      this.debrisSpawnTimer -= dt;
      if (this.debrisSpawnTimer <= 0 && this.fallingDebris.length < 4) {
        this.debrisSpawnTimer = interval;
        this.spawnFallingDebris();
      }
    }

    let playerUnderDebris = false;
    const remaining: FallingDebris[] = [];

    for (const d of this.fallingDebris) {
      const distPlayer = Math.hypot(p.x - d.x, (p.y - d.y) * 1.25);
      if (d.state !== 'impacted' && distPlayer <= d.radius + 16 && Math.abs(p.z - d.groundZ) < 88) {
        playerUnderDebris = true;
      }

      if (d.state === 'warning') {
        d.warnTimer -= dt;
        // Ceiling rubble dust trickle telegraph
        if (Math.random() < dt * 11) {
          this.spawnParticle({
            kind: 'dust',
            x: d.x + (Math.random() - 0.5) * d.radius * 0.85,
            y: d.y + (Math.random() - 0.5) * 14,
            z: d.groundZ + 170 + Math.random() * 150,
            groundZ: d.groundZ,
            vx: (Math.random() - 0.5) * 26,
            vy: 0,
            vz: -160 - Math.random() * 110,
            size: 3,
            color: this.stageId === 'mines' ? '#A78BFA' : '#CBD5E1',
            alpha: 0.72,
            maxLife: 0.45,
          });
        }
        if (d.warnTimer <= 0) {
          d.state = 'falling';
          d.vz = -180;
        }
        remaining.push(d);
      } else if (d.state === 'falling') {
        d.vz -= 1780 * dt;
        d.z += d.vz * dt;
        if (d.z <= d.groundZ) {
          d.z = d.groundZ;
          d.state = 'impacted';
          this.handleDebrisImpact(d);
        }
        remaining.push(d);
      } else {
        d.impactTimer -= dt;
        if (d.impactTimer > 0) {
          remaining.push(d);
        }
      }
    }

    this.fallingDebris = remaining;
    return playerUnderDebris;
  }

  private handleDebrisImpact(d: FallingDebris): void {
    const p = this.player;
    const diffCfg = DIFFICULTIES[this.difficulty];
    this.audio.playRockfallImpact();
    this.triggerShake(0.42, (Math.random() - 0.5) * 4, 6);

    const surf = this.findSurfaceAt(d.x, d.y, d.groundZ + 16);
    this.spawnSurfaceMark({
      x: d.x,
      y: d.y,
      z: surf.z,
      platformId: surf.platformId,
      kind: 'katana_slash',
      angle: (d.seed - 0.5) * 0.9,
      length: 38,
      thickness: 3.4,
      color: this.stageId === 'mines' ? '#6D28D9' : '#64748B',
      maxLife: 6.5,
      seed: d.seed,
    });

    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const spd = 75 + Math.random() * 145;
      this.spawnParticle({
        kind: i % 3 === 0 ? 'spark' : 'dust',
        x: d.x,
        y: d.y,
        z: d.groundZ + 12,
        groundZ: d.groundZ,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.45,
        vz: 90 + Math.random() * 145,
        size: i % 2 === 0 ? 5 : 3,
        color:
          d.rockKind === 'obsidian'
            ? i % 3 === 0
              ? '#C084FC'
              : '#475569'
            : i % 3 === 0
              ? '#FDE047'
              : '#94A3B8',
        alpha: 0.94,
        maxLife: 0.48,
      });
    }

    // Damage enemies caught in the rockfall radius
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dist = Math.hypot(enemy.x - d.x, (enemy.y - d.y) * 1.25);
      if (dist <= d.radius + enemy.radius * 0.5 && Math.abs(enemy.z - d.groundZ) < 82) {
        const rawEnemyDmg = Math.round(d.damage * (enemy.isBoss ? 0.9 : 1.5));
        const enemyDmg = enemy.jutsuSealActive ? Math.max(4, Math.round(rawEnemyDmg * 0.2)) : rawEnemyDmg;
        enemy.hp -= enemyDmg;
        enemy.hitFlashTimer = 0.14;
        enemy.squashX = 1.24;
        enemy.squashY = 0.74;
        if (!enemy.superArmor || enemy.hp <= 0) {
          enemy.aiState = 'hurt';
          enemy.stateTimer = 0.38;
          enemy.hazardStunTimer = Math.max(enemy.hazardStunTimer ?? 0, enemy.isBoss ? 0.2 : 0.65);
          enemy.vx = (enemy.x >= d.x ? 1 : -1) * 145;
          enemy.vz = 110;
        }
        this.score += Math.round(60 * diffCfg.scoreMult);
        this.spawnFloatingText(enemy.x, enemy.y, enemy.z + 132, `ESMAGADO! -${enemyDmg}`, '#E2E8F0', 1.02);
        if (enemy.hp <= 0) {
          this.handleEnemyDefeated(enemy);
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // Break nearby crates
    for (const crate of this.crates) {
      if (crate.hp <= 0) continue;
      if (Math.hypot(crate.x - d.x, crate.y - d.y) <= d.radius + 16 && Math.abs(crate.z - d.groundZ) < 60) {
        this.damageCrate(crate, 35);
      }
    }

    // Damage player unless using Esquiva Sombria or invulnerable
    const distP = Math.hypot(p.x - d.x, (p.y - d.y) * 1.25);
    if (distP <= d.radius + 10 && Math.abs(p.z - d.groundZ) < 82) {
      if (p.dashTimer > 0 || this.hazardDashGraceTimer > 0 || p.invulnTimer > 0) {
        if (this.hazardCrossedCooldown <= 0) {
          this.hazardCrossedCooldown = 0.6;
          this.audio.playHazardPhase();
          this.spawnFloatingText(p.x, p.y, p.z + 104, 'ESQUIVA SOMBRIA!', '#38BDF8', 0.94);
        }
      } else {
        const pDmg = Math.max(6, Math.round(d.damage * diffCfg.enemyDamageMult));
        p.hp = Math.max(0, p.hp - pDmg);
        p.hitFlashTimer = 0.14;
        p.hurtTimer = 0.2;
        p.invulnTimer = 0.35;
        this.tookDamageThisStage = true;
        this.damageTakenThisStage += pDmg;
        this.comboCount = 0;
        this.spawnFloatingText(p.x, p.y, p.z + 88, `ESCOMBROS! -${pDmg}`, '#FB7185', 1.06);
        this.emitHud(true);
        if (p.hp <= 0) {
          this.setPaused(true);
          this.onGameEnd('GAME_OVER', this.buildHudSnapshot());
        }
      }
    }
  }

  private updateEnemyHazards(dt: number): void {
    const diffCfg = DIFFICULTIES[this.difficulty];
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const prevCd = this.enemyHazardTimers.get(enemy.id) ?? 0;
      const nextCd = Math.max(0, prevCd - dt);
      this.enemyHazardTimers.set(enemy.id, nextCd);

      let inside: EnvironmentalHazard | null = null;
      for (const h of this.hazards) {
        if (
          enemy.x >= h.x1 + 6 &&
          enemy.x <= h.x2 - 6 &&
          enemy.y >= h.y1 &&
          enemy.y <= h.y2 &&
          enemy.z < 92
        ) {
          inside = h;
          break;
        }
      }

      if (!inside) continue;

      // Apply continuous obstacle movement slowdown while inside floor hazards
      if (inside.kind === 'frost_fissure') {
        enemy.hazardStatus = 'frost';
        enemy.hazardSlowTimer = Math.max(enemy.hazardSlowTimer ?? 0, 1.5);
      } else if (inside.kind === 'poison_mire') {
        enemy.hazardStatus = 'poison';
        enemy.hazardSlowTimer = Math.max(enemy.hazardSlowTimer ?? 0, 1.6);
      } else if (inside.kind === 'electric_pool') {
        enemy.hazardStatus = 'shock';
        enemy.hazardSlowTimer = Math.max(enemy.hazardSlowTimer ?? 0, 0.75);
      } else {
        enemy.hazardStatus = 'burn';
        enemy.hazardSlowTimer = Math.max(enemy.hazardSlowTimer ?? 0, 0.7);
      }

      if (nextCd <= 0) {
        this.enemyHazardTimers.set(enemy.id, enemy.isBoss ? 0.56 : 0.42);
        const rawDmg = Math.max(5, Math.round(inside.damagePerTick * (enemy.isBoss ? 1.05 : 1.5)));
        const dmg = enemy.jutsuSealActive ? Math.max(2, Math.round(rawDmg * 0.18)) : rawDmg;

        enemy.hp -= dmg;
        enemy.hitFlashTimer = 0.1;
        enemy.squashX = 0.85;
        enemy.squashY = 1.15;

        const color = this.getHazardColor(inside.kind);
        let statusTag = '';

        if (inside.kind === 'electric_pool') {
          enemy.hazardStatus = 'shock';
          enemy.hazardStunTimer = Math.max(enemy.hazardStunTimer ?? 0, enemy.isBoss ? 0.18 : 0.52);
          if (!enemy.superArmor && enemy.hp > 0) {
            enemy.aiState = 'hurt';
            enemy.stateTimer = Math.max(enemy.stateTimer, 0.24);
          }
          statusTag = 'ELETROCUTADO!';
        } else if (inside.kind === 'frost_fissure') {
          enemy.hazardStatus = 'frost';
          enemy.hazardSlowTimer = Math.max(enemy.hazardSlowTimer ?? 0, 2.0);
          statusTag = 'CONGELADO!';
        } else if (inside.kind === 'poison_mire') {
          enemy.hazardStatus = 'poison';
          enemy.hazardSlowTimer = Math.max(enemy.hazardSlowTimer ?? 0, 2.0);
          enemy.hazardDotTimer = Math.max(enemy.hazardDotTimer ?? 0, 2.4);
          enemy.hazardDotTickTimer = Math.min(enemy.hazardDotTickTimer ?? 0.5, 0.5);
          statusTag = 'ENVENENADO!';
        } else {
          enemy.hazardStatus = 'burn';
          enemy.hazardDotTimer = Math.max(enemy.hazardDotTimer ?? 0, 2.4);
          enemy.hazardDotTickTimer = Math.min(enemy.hazardDotTickTimer ?? 0.5, 0.5);
          statusTag = 'EM CHAMAS!';
        }

        if (!enemy.superArmor && enemy.aiState !== 'windup' && enemy.hp > 0 && inside.kind !== 'electric_pool') {
          enemy.aiState = 'hurt';
          enemy.stateTimer = 0.14;
        }

        this.spawnFloatingText(
          enemy.x,
          enemy.y,
          enemy.z + (enemy.isBoss ? 142 : 112),
          `-${dmg}`,
          color,
          0.92
        );
        if (statusTag && enemy.hp > 0) {
          this.spawnFloatingText(
            enemy.x,
            enemy.y,
            enemy.z + (enemy.isBoss ? 164 : 132),
            statusTag,
            color,
            0.86
          );
        }
        for (let i = 0; i < 4; i++) {
          this.spawnParticle({
            kind: inside.kind === 'electric_pool' ? 'lightning' : inside.kind === 'poison_mire' ? 'smoke' : 'spark',
            x: enemy.x + (Math.random() - 0.5) * 20,
            y: enemy.y + (Math.random() - 0.5) * 10,
            z: enemy.z + 18 + Math.random() * 44,
            vx: (Math.random() - 0.5) * 120,
            vy: (Math.random() - 0.5) * 44,
            vz: 55 + Math.random() * 85,
            size: 4,
            color,
            alpha: 0.92,
            maxLife: 0.24,
          });
        }

        if (enemy.hp <= 0) {
          this.score += Math.round(75 * diffCfg.scoreMult);
          this.spawnFloatingText(enemy.x, enemy.y, enemy.z + 140, 'ARMADILHA!', '#FDE047', 1.0);
          this.handleEnemyDefeated(enemy);
        } else {
          this.score += Math.round(25 * diffCfg.scoreMult);
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }

  private updateHazards(dt: number): void {
    const p = this.player;
    if (this.hazardDashGraceTimer > 0) this.hazardDashGraceTimer = Math.max(0, this.hazardDashGraceTimer - dt);
    if (this.hazardWarnCooldown > 0) this.hazardWarnCooldown = Math.max(0, this.hazardWarnCooldown - dt);
    if (this.hazardCrossedCooldown > 0) this.hazardCrossedCooldown = Math.max(0, this.hazardCrossedCooldown - dt);
    if (this.hazardTickTimer > 0) this.hazardTickTimer = Math.max(0, this.hazardTickTimer - dt);

    this.updateDynamicStormPuddles(dt);
    const playerUnderDebris = this.updateFallingDebris(dt);
    this.updateEnemyHazards(dt);

    let insideHazard: EnvironmentalHazard | null = null;
    let nearbyHazard: EnvironmentalHazard | null = null;
    let minNearDist = 170;

    for (const h of this.hazards) {
      const inX = p.x >= h.x1 + 6 && p.x <= h.x2 - 6;
      const inY = p.y >= h.y1 && p.y <= h.y2;
      if (inX && inY && p.z < 92) {
        insideHazard = h;
        break;
      }
      const distX = p.x < h.x1 ? h.x1 - p.x : p.x > h.x2 ? p.x - h.x2 : 0;
      const distY = p.y < h.y1 ? h.y1 - p.y : p.y > h.y2 ? p.y - h.y2 : 0;
      const dist = Math.hypot(distX, distY);
      if (dist < minNearDist) {
        minNearDist = dist;
        nearbyHazard = h;
      }
    }

    if (insideHazard) {
      this.activeHazardWarning = { kind: insideHazard.kind, label: insideHazard.label, inside: true };

      if (p.dashTimer > 0 || this.hazardDashGraceTimer > 0) {
        // Esquiva Sombria cleanly phases through environmental hazards with zero damage!
        this.hazardSlowActive = false;
        if (p.dashTimer > 0) {
          this.hazardDashGraceTimer = 0.09;
        }
        if (this.hazardCrossedCooldown <= 0) {
          this.hazardCrossedCooldown = 0.65;
          this.audio.playHazardPhase();
          this.spawnFloatingText(p.x, p.y, p.z + 102, 'ESQUIVA SOMBRIA!', '#38BDF8', 0.92);
          for (let i = 0; i < 6; i++) {
            this.spawnParticle({
              kind: 'spark',
              x: p.x,
              y: p.y,
              z: p.z + 24 + Math.random() * 44,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 60,
              vz: 40 + Math.random() * 80,
              size: 4,
              color: '#38BDF8',
              alpha: 0.9,
              maxLife: 0.25,
            });
          }
        }
      } else {
        this.hazardSlowActive = true;
        if (this.hazardTickTimer <= 0) {
          const diffMult = DIFFICULTIES[this.difficulty].enemyDamageMult;
          const dmg = Math.max(4, Math.round(insideHazard.damagePerTick * diffMult));
          this.hazardTickTimer = insideHazard.tickInterval;
          p.hp = Math.max(0, p.hp - dmg);
          this.tookDamageThisStage = true;
          this.damageTakenThisStage += dmg;
          p.hitFlashTimer = 0.1;
          this.comboCount = 0;
          this.triggerShake(0.24, (Math.random() - 0.5) * 5, 3);
          this.audio.playHazardTick(insideHazard.kind);

          const color = this.getHazardColor(insideHazard.kind);

          this.spawnFloatingText(p.x, p.y, p.z + 78, `-${dmg}`, color, 0.95);
          if (this.hazardWarnCooldown <= 0) {
            this.hazardWarnCooldown = 2.4;
            this.spawnFloatingText(p.x, p.y, p.z + 108, 'USE ESQUIVA SOMBRIA (SHIFT)!', '#FDE047', 0.96);
          }

          for (let i = 0; i < 5; i++) {
            this.spawnParticle({
              kind: insideHazard.kind === 'electric_pool' ? 'lightning' : 'spark',
              x: p.x + (Math.random() - 0.5) * 20,
              y: p.y + (Math.random() - 0.5) * 10,
              z: p.z + 12 + Math.random() * 48,
              vx: (Math.random() - 0.5) * 140,
              vy: (Math.random() - 0.5) * 50,
              vz: 60 + Math.random() * 90,
              size: 4,
              color,
              alpha: 0.95,
              maxLife: 0.24,
            });
          }

          this.emitHud(true);
          if (p.hp <= 0) {
            this.setPaused(true);
            this.onGameEnd('GAME_OVER', this.buildHudSnapshot());
          }
        }
      }
    } else {
      this.hazardSlowActive = false;
      this.hazardTickTimer = Math.min(this.hazardTickTimer, 0.06);
      if (playerUnderDebris) {
        this.activeHazardWarning = {
          kind: 'cave_rockfall',
          label: 'Queda de Escombros',
          inside: true,
        };
      } else {
        this.activeHazardWarning = nearbyHazard
          ? { kind: nearbyHazard.kind, label: nearbyHazard.label, inside: false }
          : null;
      }
    }
  }

  private updateProjectiles(dt: number): void {
    const remaining: Projectile[] = [];

    for (const proj of this.projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.z += proj.vz * dt;
      proj.rotation += dt * 18;
      proj.life -= dt;

      if (
        proj.life <= 0 ||
        proj.z < -10 ||
        proj.x < this.cameraX - 90 ||
        proj.x > this.cameraX + LOGICAL_WIDTH + 90
      ) {
        continue;
      }

      let hit = false;
      if (proj.fromPlayer) {
        const isPiercing = proj.kind === 'fire_dragon';
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0) continue;
          if (isPiercing && proj.hitIds?.has(enemy.id)) continue;
          if (
            Math.abs(enemy.x - proj.x) <= enemy.radius + proj.radius &&
            Math.abs(enemy.y - proj.y) <= (isPiercing ? 48 : 34) &&
            Math.abs(enemy.z + 68 - proj.z) <= (isPiercing ? 96 : 74)
          ) {
            this.damageEnemy(enemy, proj.damage, proj.vx >= 0 ? 1 : -1, isPiercing, {
              fromProjectile: true,
              jutsuSource: isPiercing
                ? 'karyu'
                : this.player.nightVisionTimer > 0
                  ? 'yagan'
                  : this.clones.length > 0
                    ? 'bunshin'
                    : undefined,
            });
            if (proj.countForPrecision) {
              this.stageAttackHits++;
              proj.countForPrecision = false;
            }
            if (!isPiercing) {
              this.addMoonFury(3);
            }
            if (isPiercing) {
              proj.hitIds?.add(enemy.id);
            } else {
              hit = true;
              break;
            }
          }
        }
        if (!hit) {
          for (const crate of this.crates) {
            if (crate.hp <= 0) continue;
            if (
              Math.abs(crate.x - proj.x) <= 28 &&
              Math.abs(crate.y - proj.y) <= 32 &&
              Math.abs(crate.z + 20 - proj.z) <= 45
            ) {
              this.damageCrate(crate, proj.damage);
              if (!isPiercing) {
                hit = true;
                break;
              }
            }
          }
        }
        if (!hit && !isPiercing) {
          for (const civ of this.civilians) {
            if (civ.state !== 'captive') continue;
            if (
              Math.abs(civ.x - proj.x) <= 26 &&
              Math.abs(civ.y - proj.y) <= 32 &&
              Math.abs(civ.z + 44 - proj.z) <= 52
            ) {
              this.harmCivilian(civ);
              hit = true;
              break;
            }
          }
        }
      } else {
        // Enemy kunais are blocked by intact arena obstacles (crates, lanterns, braziers)
        for (const crate of this.crates) {
          if (crate.hp <= 0) continue;
          if (
            Math.abs(crate.x - proj.x) <= 28 &&
            Math.abs(crate.y - proj.y) <= 32 &&
            Math.abs(crate.z + 24 - proj.z) <= 58
          ) {
            this.damageCrate(crate, Math.max(10, Math.round(proj.damage * 0.85)));
            for (let k = 0; k < 4; k++) {
              this.spawnParticle({
                kind: 'spark',
                x: proj.x,
                y: proj.y,
                z: proj.z,
                vx: -proj.vx * 0.22 + (Math.random() - 0.5) * 90,
                vy: (Math.random() - 0.5) * 40,
                vz: 35 + Math.random() * 65,
                size: 3.5,
                color: '#FDE047',
                alpha: 0.92,
                maxLife: 0.2,
              });
            }
            hit = true;
            break;
          }
        }
        if (!hit) {
          const p = this.player;
          if (
            Math.abs(p.x - proj.x) <= 24 &&
            Math.abs(p.y - proj.y) <= 28 &&
            Math.abs(p.z + 68 - proj.z) <= 68
          ) {
            if (p.attackTimer > 0) {
              this.audio.playHit(false);
              this.spawnFloatingText(proj.x, proj.y, proj.z + 30, 'APARADO!', '#38BDF8', 0.9);
              this.score += 50;
              p.chi = Math.min(p.maxChi, p.chi + 10);
              this.addMoonFury(8);
              this.tryUnlockAchievement('shuriken_parry');
              hit = true;
            } else {
              this.damagePlayer(proj.damage, proj.vx >= 0 ? 1 : -1);
              hit = true;
            }
          }
        }
      }

      if (!hit) remaining.push(proj);
    }

    this.projectiles = remaining;
  }

  private updatePickups(dt: number): void {
    const p = this.player;
    const remaining: Pickup[] = [];

    for (const item of this.pickups) {
      item.life -= dt;
      const gZ = this.getSupportingPlatformZ(item.x, item.y, item.z);
      if (item.z > gZ || item.vz !== 0) {
        item.z += item.vz * dt;
        item.vz -= 980 * dt;
        if (item.z <= gZ) {
          item.z = gZ;
          item.vz = 0;
        }
      }

      if (Math.abs(item.x - p.x) < 38 && Math.abs(item.y - p.y) < 34 && Math.abs(item.z - p.z) < 55) {
        if (item.kind === 'onigiri') {
          p.hp = Math.min(p.maxHp, p.hp + 35);
          this.audio.playPickup('heal');
          this.spawnFloatingText(p.x, p.y, p.z + 75, '+35 HP', '#10B981', 1.05);
        } else if (item.kind === 'chi_scroll') {
          p.chi = Math.min(p.maxChi, p.chi + 50);
          this.audio.playPickup('chi');
          this.spawnFloatingText(p.x, p.y, p.z + 75, '+50 CHI', '#38BDF8', 1.05);
        } else if (item.kind === 'shuriken_pack') {
          p.shurikens = Math.min(p.maxShurikens, p.shurikens + 4);
          this.audio.playPickup('score');
          this.spawnFloatingText(p.x, p.y, p.z + 75, '+4 SHURIKENS', '#E2E8F0', 1.0);
        } else {
          this.score += Math.round(500 * DIFFICULTIES[this.difficulty].scoreMult);
          this.audio.playPickup('score');
          this.spawnFloatingText(p.x, p.y, p.z + 75, '+500 PTS', '#FBBF24', 1.05);
        }
        this.emitHud(true);
        continue;
      }

      if (item.life > 0) remaining.push(item);
    }

    this.pickups = remaining;
  }

  private updateCrates(dt: number): void {
    for (const c of this.crates) {
      if (c.hitFlashTimer > 0) c.hitFlashTimer -= dt;
      if (c.wobble > 0) c.wobble = Math.max(0, c.wobble - dt * 4);
    }
    this.crates = this.crates.filter((c) => c.hp > 0);
  }

  private updateCivilians(dt: number): void {
    const p = this.player;
    const remaining: Civilian[] = [];

    for (const civ of this.civilians) {
      civ.bobPhase += dt * 4;
      if (civ.hitFlashTimer > 0) civ.hitFlashTimer = Math.max(0, civ.hitFlashTimer - dt);

      if (civ.state === 'captive') {
        const closeToPlayer =
          Math.abs(civ.x - p.x) <= 44 &&
          Math.abs(civ.y - p.y) <= 38 &&
          Math.abs(civ.z - p.z) <= 55;
        if (closeToPlayer && p.hp > 0) {
          civ.state = 'rescued';
          civ.timer = 1.45;
          civ.facing = p.x >= civ.x ? 1 : -1;
          this.civiliansRescued += 1;
          this.stageCiviliansRescued += 1;
          this.karma = Math.min(100, this.karma + 15);
          const bonusPts = Math.round(400 * DIFFICULTIES[this.difficulty].scoreMult);
          this.score += bonusPts;
          p.hp = Math.min(p.maxHp, p.hp + 15);
          p.chi = Math.min(p.maxChi, p.chi + 20);
          p.shurikens = Math.min(p.maxShurikens, p.shurikens + 2);
          this.addMoonFury(15);
          this.audio.playPickup('heal');
          this.spawnFloatingText(civ.x, civ.y, civ.z + 82, 'RESGATADO! +15 KARMA', '#34D399', 1.12);
          this.spawnFloatingText(p.x, p.y, p.z + 96, '+15 HP  +20 CHI', '#6EE7B7', 0.95);
          for (let i = 0; i < 14; i++) {
            const ang = (i / 14) * Math.PI * 2;
            this.spawnParticle({
              kind: 'spark',
              x: civ.x,
              y: civ.y,
              z: civ.z + 36,
              vx: Math.cos(ang) * (50 + Math.random() * 80),
              vy: Math.sin(ang) * 28,
              vz: 60 + Math.random() * 90,
              size: 4,
              color: i % 2 === 0 ? '#34D399' : '#FDE047',
              alpha: 1,
              maxLife: 0.48,
            });
          }
          this.emitHud(true);
        }
        remaining.push(civ);
      } else {
        civ.timer -= dt;
        if (civ.timer > 0) remaining.push(civ);
      }
    }

    this.civilians = remaining;
  }

  private harmCivilian(civ: Civilian): void {
    if (civ.state !== 'captive') return;
    const p = this.player;
    civ.state = 'harmed';
    civ.timer = 0.85;
    civ.hitFlashTimer = 0.24;
    this.civiliansHarmed += 1;
    this.stageCiviliansHarmed += 1;
    this.karma = Math.max(-100, this.karma - 25);
    if (this.karma <= -40) {
      this.tryUnlockAchievement('karma_crimson');
    }

    const hpPenalty = 15;
    p.hp = Math.max(0, p.hp - hpPenalty);
    this.tookDamageThisStage = true;
    this.damageTakenThisStage += hpPenalty;
    p.hitFlashTimer = 0.14;
    this.comboCount = 0;
    this.triggerShake(0.45, p.facing * 4, 4);
    this.audio.playPlayerHurt();

    this.spawnFloatingText(civ.x, civ.y, civ.z + 82, 'CIVIL FERIDO! -25 KARMA', '#FB7185', 1.15);
    this.spawnFloatingText(p.x, p.y, p.z + 92, `-${hpPenalty} HP (KARMA)`, '#F43F5E', 1.0);
    const surf = this.findSurfaceAt(civ.x, civ.y, civ.z + 12);
    this.spawnSurfaceMark({
      x: civ.x,
      y: civ.y,
      z: surf.z,
      platformId: surf.platformId,
      kind: 'blood_splat',
      angle: Math.random() * Math.PI * 2,
      length: 18,
      thickness: 10,
      color: '#991B1B',
      maxLife: 7.5,
      seed: Math.random(),
    });
    for (let i = 0; i < 12; i++) {
      this.spawnParticle({
        kind: 'blood_pixel',
        x: civ.x,
        y: civ.y,
        z: civ.z + 36,
        groundZ: surf.z,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 48,
        vz: 65 + Math.random() * 110,
        size: i % 3 === 0 ? 4 : 3,
        color: i % 2 === 0 ? '#E11D48' : '#991B1B',
        alpha: 0.96,
        maxLife: 0.42,
      });
    }
    this.emitHud(true);

    if (p.hp <= 0) {
      this.setPaused(true);
      this.onGameEnd('GAME_OVER', this.buildHudSnapshot());
    }
  }

  private updateEffects(dt: number): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.z += pt.vz * dt;
      pt.rotation += pt.vRot * dt;
      if (pt.kind !== 'petal' && pt.kind !== 'leaf' && pt.kind !== 'ember' && pt.kind !== 'smoke') {
        pt.vz -= 680 * dt;
        const floorZ = pt.groundZ ?? 0;
        if (pt.z < floorZ) {
          if (pt.kind === 'blood_pixel' && !pt.splattered && Math.abs(pt.vz) > 95) {
            pt.splattered = true;
            const surf = this.findSurfaceAt(pt.x, pt.y, floorZ + 8);
            const sx = Math.max(surf.xMin, Math.min(surf.xMax, pt.x));
            const sy = Math.max(surf.yMin, Math.min(surf.yMax, pt.y));
            this.spawnSurfaceMark({
              x: sx,
              y: sy,
              z: surf.z,
              platformId: surf.platformId,
              kind: 'blood_splat',
              angle: 0,
              length: 6 + Math.random() * 6,
              thickness: 4,
              color: pt.color,
              maxLife: 5.5 + Math.random() * 2.5,
              seed: Math.floor(Math.random() * 10000),
            });
            pt.vx *= 0.42;
            pt.vy *= 0.42;
          }
          pt.z = floorZ;
          pt.vz *= pt.kind === 'blood_pixel' ? -0.18 : -0.3;
        }
      }
    }

    for (const arc of this.slashArcs) arc.life -= dt;
    this.slashArcs = this.slashArcs.filter((a) => a.life > 0);

    for (const mark of this.surfaceMarks) mark.life -= dt;
    this.surfaceMarks = this.surfaceMarks.filter((m) => m.life > 0);

    for (const ft of this.floatingTexts) {
      ft.life -= dt;
      ft.z += ft.vy * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);

    for (const img of this.afterimages) {
      img.alpha -= dt * (img.pose === 'dash' || img.tint === 'shadow' ? 3.1 : 4.4);
    }
    this.afterimages = this.afterimages.filter((img) => img.alpha > 0);
  }

  private getEnemyDetectionRange(e: Enemy): number {
    const kind = this.weather ? this.weather.currentKind : 'rain';
    const stageMeta = STAGES.find((s) => s.id === this.stageId);
    const stop = TIME_WEATHER_CYCLE.find((s) => s.kind === kind) ?? TIME_WEATHER_CYCLE[0];
    let base = stop.enemyDetectionRange;
    if (stageMeta?.denseFog && kind !== 'clear') {
      base = Math.min(base, 225);
    }
    if (kind === 'storm' && this.weather && this.weather.lightningAlpha > 0.14) {
      base = 650;
    }
    if (e.type === 'kunoichi') base *= 1.08;
    else if (e.type === 'oni') base *= 0.88;
    else if (e.isBoss) base *= 1.3;

    if (this.player.dashTimer > 0) {
      base *= 0.78;
    }
    if (this.specialFlash > 0.25 || this.player.moonFuryTimer > 0) {
      base += 140;
    }
    return Math.round(base);
  }

  private getPlayerDetectionRange(): number {
    if (this.player && this.player.nightVisionTimer > 0) {
      return 980;
    }
    const kind = this.weather ? this.weather.currentKind : 'rain';
    const stageMeta = STAGES.find((s) => s.id === this.stageId);
    const stop = TIME_WEATHER_CYCLE.find((s) => s.kind === kind) ?? TIME_WEATHER_CYCLE[0];
    let range = stop.playerDetectionRange;
    if (stageMeta?.denseFog && kind !== 'clear') {
      range = Math.min(range, 235);
    }
    if (kind === 'storm' && this.weather && this.weather.lightningAlpha > 0.14) {
      range = 740;
    }
    return range;
  }

  private getWeatherModifiers(): {
    speedMult: number;
    cooldownMult: number;
    windupMult: number;
    projSpeedMult: number;
    detectionPct: number;
    playerDetectionRange: number;
    label: string;
    effect: string;
    tacticalTip: string;
  } {
    const kind = this.weather ? this.weather.currentKind : 'rain';
    const nvActive = Boolean(this.player && this.player.nightVisionTimer > 0);
    const stop = TIME_WEATHER_CYCLE.find((s) => s.kind === kind) ?? TIME_WEATHER_CYCLE[0];
    const playerDetectionRange = this.getPlayerDetectionRange();
    const detectionPct = nvActive ? 100 : stop.detectionPct;
    const tacticalTip = nvActive ? 'Visão Noturna ativa: Detecção 100% (+20% Dano)' : stop.tacticalTip;

    if (kind === 'fog') {
      return {
        speedMult: 0.84,
        cooldownMult: 1.18,
        windupMult: 1.14,
        projSpeedMult: 0.82,
        detectionPct,
        playerDetectionRange,
        label: stop.label,
        effect: nvActive ? 'Visão Noturna 100%' : stop.effect,
        tacticalTip,
      };
    }
    if (kind === 'snow') {
      return {
        speedMult: 0.74,
        cooldownMult: 1.28,
        windupMult: 1.22,
        projSpeedMult: 0.72,
        detectionPct,
        playerDetectionRange,
        label: stop.label,
        effect: nvActive ? 'Visão Noturna 100%' : stop.effect,
        tacticalTip,
      };
    }
    if (kind === 'storm') {
      return {
        speedMult: 0.86,
        cooldownMult: 1.12,
        windupMult: 1.08,
        projSpeedMult: 0.84,
        detectionPct,
        playerDetectionRange,
        label: stop.label,
        effect: nvActive ? 'Raios & Visão 100%' : stop.effect,
        tacticalTip,
      };
    }
    if (kind === 'rain') {
      return {
        speedMult: 0.88,
        cooldownMult: 1.14,
        windupMult: 1.1,
        projSpeedMult: 0.86,
        detectionPct,
        playerDetectionRange,
        label: stop.label,
        effect: nvActive ? 'Visão Noturna 100%' : stop.effect,
        tacticalTip,
      };
    }
    return {
      speedMult: 1.16,
      cooldownMult: 0.84,
      windupMult: 0.9,
      projSpeedMult: 1.14,
      detectionPct: 100,
      playerDetectionRange: 960,
      label: stop.label,
      effect: stop.effect,
      tacticalTip,
    };
  }

  private getInitialWeatherIndex(stageId: StageId): number {
    if (stageId === 'harbor' || stageId === 'bullet_train') return 1; // Tempestade
    if (stageId === 'snow_peak') return 2; // Neve
    if (stageId === 'bamboo' || stageId === 'temple_ruins') return 3; // Névoa Densa
    if (stageId === 'fortress' || stageId === 'mines' || stageId === 'eclipse_citadel') return 4; // Lua Carmesim
    return 0; // Chuva
  }

  private rollNextWeatherDuration(): number {
    return WEATHER_MIN_DURATION + Math.random() * (WEATHER_MAX_DURATION - WEATHER_MIN_DURATION);
  }

  private pickRandomWeatherStop(currentKind: WeatherKind): TimeWeatherStop {
    const candidates = TIME_WEATHER_CYCLE.filter((s) => s.kind !== currentKind);
    const weights = candidates.map((s) => {
      if (s.kind === 'fog' || s.kind === 'snow' || s.kind === 'rain') return 1.35;
      if (s.kind === 'storm') return 1.05;
      return 0.85;
    });
    const total = weights.reduce((acc, w) => acc + w, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return candidates[i];
    }
    return candidates[0];
  }

  private initOrTransitionWeather(stageId: StageId, preservePrevious: boolean): void {
    this.weatherCycleIndex = this.getInitialWeatherIndex(stageId);
    this.weatherCycleTimer = 0;
    this.nextWeatherDuration = this.rollNextWeatherDuration();
    const initialStop = TIME_WEATHER_CYCLE[this.weatherCycleIndex];
    if (preservePrevious && this.weather) {
      this.weather.targetKind = initialStop.kind;
      this.weather.targetIntensity = initialStop.intensity;
      this.weather.targetWindX = initialStop.windX;
      this.weather.blend = 0;
      this.weather.splashes = [];
      return;
    }

    const seedKind: WeatherKind = initialStop.kind === 'clear' ? 'rain' : initialStop.kind;
    const drops: WeatherDrop[] = [];
    for (let i = 0; i < 150; i++) {
      drops.push(this.createWeatherDrop(seedKind, Math.random() * PIXEL_HEIGHT));
    }

    this.weather = {
      currentKind: initialStop.kind,
      targetKind: initialStop.kind,
      blend: 1,
      intensity: initialStop.intensity,
      targetIntensity: initialStop.intensity,
      windX: initialStop.windX,
      targetWindX: initialStop.windX,
      visibilityPenalty: initialStop.visibilityPenalty,
      lightningAlpha: 0,
      drops,
      splashes: [],
    };
    this.lightningTimer = 3.2;
  }

  private createWeatherDrop(kind: WeatherKind, yStart = -8): WeatherDrop {
    const layer: 0 | 1 = Math.random() < 0.48 ? 0 : 1;
    if (kind === 'fog') {
      return {
        x: Math.random() * (PIXEL_WIDTH + 80) - 40,
        y: yStart,
        speed: 14 + Math.random() * 14,
        vx: -18 - Math.random() * 16,
        length: 1,
        size: layer === 1 ? 2 : 1,
        alpha: layer === 1 ? 0.42 : 0.25,
        layer,
        phase: Math.random() * Math.PI * 2,
      };
    }
    if (kind === 'snow') {
      return {
        x: Math.random() * (PIXEL_WIDTH + 80) - 40,
        y: yStart,
        speed: layer === 1 ? 66 + Math.random() * 44 : 38 + Math.random() * 26,
        vx: (Math.random() - 0.5) * 18,
        length: 1,
        size: layer === 1 ? (Math.random() > 0.6 ? 2 : 1) : 1,
        alpha: layer === 1 ? 0.92 : 0.58,
        layer,
        phase: Math.random() * Math.PI * 2,
      };
    }
    if (kind === 'ash') {
      return {
        x: Math.random() * (PIXEL_WIDTH + 80) - 40,
        y: yStart,
        speed: layer === 1 ? 42 + Math.random() * 34 : 26 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 18,
        length: 1,
        size: layer === 1 ? 2 : 1,
        alpha: layer === 1 ? 0.88 : 0.52,
        layer,
        phase: Math.random() * Math.PI * 2,
      };
    }
    const isStorm = kind === 'storm';
    return {
      x: Math.random() * (PIXEL_WIDTH + 120) - 60,
      y: yStart,
      speed: (isStorm ? 360 : 265) + (layer === 1 ? 85 : 0) + Math.random() * 70,
      vx: 0,
      length: layer === 1 ? (isStorm ? 12 : 8) : isStorm ? 8 : 5,
      size: 1,
      alpha: layer === 1 ? 0.68 : 0.36,
      layer,
      phase: Math.random() * Math.PI * 2,
    };
  }

  private updateWeather(dt: number): void {
    const w = this.weather;
    const rate = 1 - Math.exp(-0.95 * dt);

    // Randomized dynamic weather transitions during each stage (rain -> fog / snow / storm / clear)
    this.weatherCycleTimer += dt;
    if (this.weatherCycleTimer >= this.nextWeatherDuration) {
      this.weatherCycleTimer = 0;
      this.nextWeatherDuration = this.rollNextWeatherDuration();
      const nextStop = this.pickRandomWeatherStop(w.currentKind);
      this.weatherCycleIndex = TIME_WEATHER_CYCLE.indexOf(nextStop);
      w.targetKind = nextStop.kind;
      w.targetIntensity = nextStop.intensity;
      w.targetWindX = nextStop.windX;
      if (w.currentKind !== nextStop.kind) {
        w.blend = 0;
      }
      this.spawnFloatingText(
        this.player.x,
        this.player.y,
        this.player.z + 104,
        nextStop.toastText,
        nextStop.toastColor,
        1.02
      );
      this.emitHud(true);
    }

    const targetStop = TIME_WEATHER_CYCLE.find((s) => s.kind === w.targetKind) ?? TIME_WEATHER_CYCLE[0];
    w.intensity += (w.targetIntensity - w.intensity) * rate;
    w.windX += (w.targetWindX - w.windX) * rate;
    w.visibilityPenalty += (targetStop.visibilityPenalty - w.visibilityPenalty) * rate;

    if (w.currentKind !== w.targetKind) {
      w.blend = Math.min(1, w.blend + dt * 0.42);
      if (w.blend >= 0.52) {
        w.currentKind = w.targetKind;
        this.emitHud(true);
      }
    }

    const gust = Math.sin(this.time * 0.65) * 18;
    const isClearing = w.currentKind === 'clear' && w.targetKind === 'clear';
    const activeCount = isClearing
      ? Math.round(w.drops.length * Math.max(0, w.intensity))
      : Math.round(w.drops.length * Math.min(1, Math.max(0.06, w.intensity)));

    // Distant lightning flashes only during heavy storms
    if (w.currentKind === 'storm' || w.targetKind === 'storm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 3.2 + Math.random() * 4.5;
        w.lightningAlpha = 0.42;
      }
    }
    if (w.lightningAlpha > 0) {
      w.lightningAlpha = Math.max(0, w.lightningAlpha - dt * 1.9);
    }

    for (let i = 0; i < w.drops.length; i++) {
      const d = w.drops[i];
      if (i >= activeCount) continue;

      const depthFactor = d.layer === 1 ? 1.0 : 0.58;
      const sway =
        w.currentKind === 'snow' || w.currentKind === 'ash' || w.currentKind === 'fog'
          ? Math.sin(this.time * 2.4 + d.phase) * 20
          : 0;
      d.x += ((w.windX + gust) * depthFactor + d.vx + sway) * dt;
      d.y += d.speed * dt;

      if (d.x < -30) d.x += PIXEL_WIDTH + 60;
      else if (d.x > PIXEL_WIDTH + 30) d.x -= PIXEL_WIDTH + 60;

      const impactY = d.layer === 1 ? 202 + ((i * 37) % 146) : 196 + ((i * 23) % 44);
      if (d.y >= impactY) {
        if (w.intensity > 0.18 && w.currentKind !== 'fog' && d.layer === 1 && w.splashes.length < 36 && Math.random() < 0.42) {
          const splashKind = w.currentKind === 'clear' ? 'rain' : w.currentKind;
          w.splashes.push({
            x: d.x,
            y: impactY,
            life: splashKind === 'snow' ? 0.28 : 0.16,
            maxLife: splashKind === 'snow' ? 0.28 : 0.16,
            kind: splashKind,
          });
        }
        const rawSpawnKind = w.blend < 1 && Math.random() < w.blend ? w.targetKind : w.currentKind;
        const spawnKind: WeatherKind = rawSpawnKind === 'clear' ? 'rain' : rawSpawnKind;
        w.drops[i] = this.createWeatherDrop(spawnKind, -6 - Math.random() * 18);
      }
    }

    for (const sp of w.splashes) {
      sp.life -= dt;
    }
    w.splashes = w.splashes.filter((sp) => sp.life > 0);
  }

  private updateCameraAndZones(dt: number): void {
    const stageDef = STAGE_DEFS[this.stageId];

    if (this.zoneActive && this.enemies.length === 0) {
      this.zoneActive = false;
      this.zoneCleared = true;
      if (this.currentZoneIndex < stageDef.zones.length - 1) {
        this.spawnFloatingText(this.player.x, this.player.y, this.player.z + 92, 'AVANÇAR →', '#10B981', 1.15);
      }
      this.emitHud(true);
    }

    if (!this.zoneActive && this.currentZoneIndex < stageDef.zones.length - 1) {
      const nextZone = stageDef.zones[this.currentZoneIndex + 1];
      if (this.player.x >= nextZone.triggerX) {
        this.activateZone(this.currentZoneIndex + 1);
      }
    }

    const targetCam = this.zoneActive
      ? stageDef.zones[this.currentZoneIndex].lockCamX
      : Math.max(0, Math.min(MAX_CAMERA_X, this.player.x - LOGICAL_WIDTH * 0.42));

    this.cameraX += (targetCam - this.cameraX) * Math.min(1, dt * 6);
  }

  private spawnParticle(opts: {
    kind: Particle['kind'];
    x: number;
    y: number;
    z: number;
    groundZ?: number;
    vx: number;
    vy: number;
    vz: number;
    size: number;
    color: string;
    alpha: number;
    maxLife: number;
  }): void {
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.kind = opts.kind;
        p.x = opts.x;
        p.y = opts.y;
        p.z = opts.z;
        p.groundZ = opts.groundZ ?? 0;
        p.splattered = false;
        p.vx = opts.vx;
        p.vy = opts.vy;
        p.vz = opts.vz;
        p.size = opts.size;
        p.color = opts.color;
        p.alpha = opts.alpha;
        p.life = opts.maxLife;
        p.maxLife = opts.maxLife;
        p.rotation = Math.random() * Math.PI * 2;
        p.vRot = (Math.random() - 0.5) * 9;
        return;
      }
    }
  }

  private findSurfaceAt(
    x: number,
    y: number,
    refZ: number
  ): {
    z: number;
    platformId: number | null;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } {
    let bestPlat: Platform | null = null;
    for (const plat of this.platforms) {
      if (x >= plat.x1 && x <= plat.x2 && y >= plat.y1 && y <= plat.y2 && refZ >= plat.z - 6) {
        if (!bestPlat || plat.z > bestPlat.z) {
          bestPlat = plat;
        }
      }
    }
    if (bestPlat) {
      return {
        z: bestPlat.z,
        platformId: bestPlat.id,
        xMin: bestPlat.x1 + 10,
        xMax: bestPlat.x2 - 10,
        yMin: bestPlat.y1 + 6,
        yMax: bestPlat.y2 - 6,
      };
    }
    return {
      z: 0,
      platformId: null,
      xMin: 24,
      xMax: 4200,
      yMin: FLOOR_TOP + 10,
      yMax: FLOOR_BOTTOM - 10,
    };
  }

  private spawnSurfaceMark(mark: Omit<SurfaceMark, 'life'>): void {
    if (this.surfaceMarks.length >= 80) {
      this.surfaceMarks.shift();
    }
    this.surfaceMarks.push({
      ...mark,
      life: mark.maxLife,
    });
  }

  private spawnKatanaImpactVfx(
    enemy: Enemy,
    knockDir: 1 | -1,
    heavy: boolean,
    comboStep: number
  ): void {
    const bloodColors = ['#991B1B', '#B91C1C', '#DC2626', '#E11D48', '#FB7185'];
    const bloodCount = heavy ? 16 : 10;
    for (let i = 0; i < bloodCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * 0.9;
      const speed = (heavy ? 140 : 95) + Math.random() * (heavy ? 260 : 190);
      this.spawnParticle({
        kind: 'blood_pixel',
        x: enemy.x + (Math.random() - 0.5) * 14,
        y: enemy.y + (Math.random() - 0.5) * 12,
        z: enemy.z + 32 + Math.random() * 34,
        groundZ: enemy.groundZ,
        vx: knockDir * Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed * 0.34,
        vz: (heavy ? 110 : 75) + Math.random() * 175,
        size: i % 3 === 0 ? 6 : 4,
        color: bloodColors[i % bloodColors.length],
        alpha: 0.98,
        maxLife: 0.38 + Math.random() * 0.24,
      });
    }

    // Metallic katana impact sparks
    for (let i = 0; i < (heavy ? 7 : 4); i++) {
      this.spawnParticle({
        kind: 'spark',
        x: enemy.x,
        y: enemy.y,
        z: enemy.z + 42 + Math.random() * 20,
        groundZ: enemy.groundZ,
        vx: knockDir * (130 + Math.random() * 210),
        vy: (Math.random() - 0.5) * 90,
        vz: 90 + Math.random() * 140,
        size: 5,
        color: i % 2 === 0 ? '#FEF08A' : '#F8FAFC',
        alpha: 0.95,
        maxLife: 0.22 + Math.random() * 0.14,
      });
    }

    // Temporary katana slash gouges & pixel blood splatters on the floor/platform surface
    const surf = this.findSurfaceAt(enemy.x, enemy.y, enemy.z + 16);
    const baseMarkX = Math.max(surf.xMin, Math.min(surf.xMax, enemy.x + knockDir * 12));
    const baseMarkY = Math.max(surf.yMin, Math.min(surf.yMax, enemy.y));
    const baseAngle =
      comboStep === 1
        ? knockDir * 0.32
        : comboStep === 2
          ? -knockDir * 0.38
          : comboStep === 3
            ? knockDir * 0.22
            : 0.06;

    this.spawnSurfaceMark({
      x: baseMarkX,
      y: baseMarkY,
      z: surf.z,
      platformId: surf.platformId,
      kind: 'katana_slash',
      angle: baseAngle + (Math.random() - 0.5) * 0.14,
      length: heavy ? 54 + Math.random() * 18 : 38 + Math.random() * 14,
      thickness: heavy ? 6 : 4,
      color: heavy ? '#FB7185' : '#E11D48',
      maxLife: heavy ? 7.5 : 5.5,
      seed: Math.floor(Math.random() * 10000),
    });

    if (heavy || comboStep >= 3) {
      this.spawnSurfaceMark({
        x: Math.max(surf.xMin, Math.min(surf.xMax, baseMarkX + knockDir * 14)),
        y: Math.max(surf.yMin, Math.min(surf.yMax, baseMarkY + (Math.random() - 0.5) * 14)),
        z: surf.z,
        platformId: surf.platformId,
        kind: 'katana_slash',
        angle: -baseAngle + (Math.random() - 0.5) * 0.18,
        length: 44 + Math.random() * 16,
        thickness: 4,
        color: '#F59E0B',
        maxLife: 7.0,
        seed: Math.floor(Math.random() * 10000),
      });
    }

    const splatCount = heavy ? 3 : 2;
    for (let s = 0; s < splatCount; s++) {
      const sx = Math.max(
        surf.xMin,
        Math.min(surf.xMax, enemy.x + knockDir * (14 + s * 18 + Math.random() * 14))
      );
      const sy = Math.max(surf.yMin, Math.min(surf.yMax, enemy.y + (Math.random() - 0.5) * 20));
      this.spawnSurfaceMark({
        x: sx,
        y: sy,
        z: surf.z,
        platformId: surf.platformId,
        kind: 'blood_splat',
        angle: 0,
        length: (heavy ? 16 : 12) + Math.random() * 8,
        thickness: 6,
        color: bloodColors[(s + 1) % bloodColors.length],
        maxLife: 7.2 + Math.random() * 2.4,
        seed: Math.floor(Math.random() * 10000),
      });
    }
  }

  private spawnDustBurst(x: number, y: number, z: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.spawnParticle({
        kind: 'dust',
        x: x + (Math.random() - 0.5) * 20,
        y,
        z: z + 4,
        vx: (Math.random() - 0.5) * 110,
        vy: (Math.random() - 0.5) * 35,
        vz: 20 + Math.random() * 55,
        size: 5,
        color: '#94A3B8',
        alpha: 0.5,
        maxLife: 0.32,
      });
    }
  }

  private spawnFloatingText(
    x: number,
    y: number,
    z: number,
    text: string,
    color: string,
    scale = 1
  ): void {
    this.floatingTexts.push({
      x,
      y,
      z,
      vy: 42,
      text,
      color,
      scale,
      life: 0.78,
      maxLife: 0.78,
    });
  }

  private computeStagePerformance(): HudSnapshot['performance'] {
    const elapsed = Math.floor(this.elapsedSeconds);
    const damage = Math.max(0, Math.round(this.damageTakenThisStage));
    const comboAccuracy =
      this.stageAttackAttempts > 0
        ? Math.min(100, Math.round((this.stageAttackHits / this.stageAttackAttempts) * 100))
        : 100;

    const timeGrade: HudSnapshot['performance']['timeGrade'] =
      elapsed <= 95 ? 'S' : elapsed <= 135 ? 'A' : elapsed <= 185 ? 'B' : 'C';
    const timeScore =
      elapsed <= 95
        ? 100
        : elapsed <= 135
          ? Math.round(92 - ((elapsed - 95) / 40) * 14)
          : elapsed <= 185
            ? Math.round(76 - ((elapsed - 135) / 50) * 20)
            : Math.max(25, Math.round(54 - ((elapsed - 185) / 80) * 29));

    const damageGrade: HudSnapshot['performance']['damageGrade'] =
      damage <= 15 ? 'S' : damage <= 45 ? 'A' : damage <= 90 ? 'B' : 'C';
    const damageScore =
      damage === 0
        ? 100
        : damage <= 15
          ? 95
          : damage <= 45
            ? Math.round(88 - ((damage - 15) / 30) * 14)
            : damage <= 90
              ? Math.round(72 - ((damage - 45) / 45) * 20)
              : Math.max(20, Math.round(50 - ((damage - 90) / 80) * 30));

    const comboBonus = Math.min(18, Math.round(this.stageMaxCombo * 1.1));
    const comboComposite = Math.min(100, Math.round(comboAccuracy * 0.84 + comboBonus));
    const comboGrade: HudSnapshot['performance']['comboGrade'] =
      comboComposite >= 86 && this.stageMaxCombo >= 8
        ? 'S'
        : comboComposite >= 70
          ? 'A'
          : comboComposite >= 50
            ? 'B'
            : 'C';

    const performanceScore = Math.max(
      0,
      Math.min(100, Math.round(timeScore * 0.35 + damageScore * 0.35 + comboComposite * 0.3))
    );
    const rank: HudSnapshot['performance']['rank'] =
      performanceScore >= 86 ? 'S' : performanceScore >= 70 ? 'A' : performanceScore >= 50 ? 'B' : 'C';

    return {
      rank,
      performanceScore,
      elapsedSeconds: elapsed,
      damageTaken: damage,
      comboAccuracy,
      maxCombo: this.stageMaxCombo,
      timeGrade,
      damageGrade,
      comboGrade,
    };
  }

  private buildHudSnapshot(): HudSnapshot {
    const stageMeta = STAGES.find((s) => s.id === this.stageId) ?? STAGES[0];
    const stageDef = STAGE_DEFS[this.stageId];
    const bossEnemy = this.enemies.find((e) => e.isBoss);
    const weatherMod = this.getWeatherModifiers();
    const performance = this.computeStagePerformance();
    return {
      stageId: this.stageId,
      stageIndex: stageMeta.index,
      stageTitle: stageMeta.title,
      difficulty: this.difficulty,
      hp: Math.ceil(this.player.hp),
      maxHp: this.player.maxHp,
      chi: Math.floor(this.player.chi),
      maxChi: this.player.maxChi,
      shurikens: this.player.shurikens,
      maxShurikens: this.player.maxShurikens,
      activeNinjutsu: this.player.activeNinjutsu,
      requiredJutsu: stageMeta.requiredJutsu,
      requiredJutsuBroken: bossEnemy ? !bossEnemy.jutsuSealActive : false,
      clonesCount: this.clones.length,
      shieldHits: this.player.shieldHits,
      fushinTimer: Math.ceil(this.player.fushinTimer),
      nightVisionTimer: Math.ceil(this.player.nightVisionTimer),
      denseFog: Boolean(stageMeta.denseFog) || this.weather?.currentKind === 'fog',
      score: this.score,
      comboCount: this.comboCount,
      comboDecayPct:
        this.comboCount > 0 ? Math.max(0, Math.min(100, Math.round((this.comboDecayTimer / 3.2) * 100))) : 0,
      maxCombo: this.maxCombo,
      comboDamageMult: this.getComboDamageMultiplier(),
      comboRank: this.getComboRankLabel(),
      moonFury: Math.floor(this.player.moonFury),
      maxMoonFury: this.player.maxMoonFury,
      waveIndex: this.currentZoneIndex + 1,
      totalWaves: stageDef.zones.length,
      zoneName: stageDef.zones[this.currentZoneIndex].name,
      enemiesDefeated: this.enemiesDefeated,
      elapsedSeconds: Math.floor(this.elapsedSeconds),
      goPrompt: this.zoneCleared && this.currentZoneIndex < stageDef.zones.length - 1,
      boss: bossEnemy
        ? {
            name: bossEnemy.name,
            hp: Math.max(0, Math.ceil(bossEnemy.hp)),
            maxHp: bossEnemy.maxHp,
            phase: bossEnemy.bossPhase,
            sealActive: bossEnemy.jutsuSealActive,
          }
        : null,
      bossIntro: this.activeBossIntro,
      bannerText: this.bannerText,
      karma: this.karma,
      karmaLabel: getKarmaLabel(this.karma),
      karmaAlignment: getKarmaAlignmentId(this.karma),
      karmaReward: this.lastVictoryKarmaReward,
      civiliansRescued: this.civiliansRescued,
      civiliansHarmed: this.civiliansHarmed,
      stageCiviliansRescued: this.stageCiviliansRescued,
      stageCiviliansHarmed: this.stageCiviliansHarmed,
      stageCiviliansTotal: this.stageCiviliansTotal,
      weatherKind: this.weather ? this.weather.currentKind : 'clear',
      weatherLabel: weatherMod.label,
      weatherEffect: weatherMod.effect,
      weatherDetectionPct: weatherMod.detectionPct,
      weatherDetectionRange: weatherMod.playerDetectionRange,
      weatherTacticalTip: weatherMod.tacticalTip,
      activeHazardWarning: this.activeHazardWarning,
      performance,
    };
  }

  private emitHud(force: boolean): void {
    const snap = this.buildHudSnapshot();
    const decayBucket = snap.comboCount > 0 ? Math.ceil(snap.comboDecayPct / 3) : 0;
    const hash = `${snap.stageId}|${snap.difficulty}|${snap.hp}|${snap.chi}|${snap.moonFury}|${snap.shurikens}|${snap.activeNinjutsu}|${snap.requiredJutsu}|${snap.requiredJutsuBroken}|${snap.clonesCount}|${snap.shieldHits}|${snap.fushinTimer}|${snap.nightVisionTimer}|${snap.denseFog}|${snap.weatherKind}|${snap.weatherDetectionPct}|${snap.activeHazardWarning?.kind ?? ''}:${snap.activeHazardWarning?.inside ?? false}|${snap.score}|${snap.comboCount}|${decayBucket}|${snap.comboDamageMult}|${snap.waveIndex}|${snap.goPrompt}|${snap.boss?.hp ?? -1}|${snap.boss?.sealActive ?? false}|${snap.bossIntro?.bossName ?? ''}|${snap.bannerText ?? ''}|${snap.karma}|${snap.civiliansRescued}|${snap.civiliansHarmed}|${snap.stageCiviliansRescued}|${snap.stageCiviliansHarmed}|${snap.karmaReward?.totalRewardPoints ?? 0}|${snap.performance.rank}:${snap.performance.damageTaken}:${snap.performance.comboAccuracy}`;
    if (force || hash !== this.lastHudHash) {
      this.lastHudHash = hash;
      this.onHudUpdate(snap);
    }
  }

  private triggerShake(trauma: number, dirX = 0, dirY = 0): void {
    this.shakeTrauma = Math.min(1, Math.max(this.shakeTrauma, trauma) + Math.min(this.shakeTrauma, trauma) * 0.35);
    this.shakeDirX = Math.max(-14, Math.min(14, this.shakeDirX + dirX));
    this.shakeDirY = Math.max(-14, Math.min(14, this.shakeDirY + dirY));
  }

  private render(): void {
    const power = Math.pow(this.shakeTrauma, 1.55);
    const shakeMag = power * 20;
    const oscX = Math.sin(this.shakePhase * 1.13) * 0.6 + (Math.random() * 2 - 1) * 0.4;
    const oscY = Math.cos(this.shakePhase * 1.47) * 0.6 + (Math.random() * 2 - 1) * 0.4;
    const shakeX = oscX * shakeMag + this.shakeDirX;
    const shakeY = oscY * shakeMag + this.shakeDirY;

    renderGameFrame(this.ctx, {
      stageId: this.stageId,
      time: this.time,
      cameraX: this.cameraX,
      shakeX,
      shakeY,
      specialFlash: this.specialFlash,
      moonFuryFlash: this.moonFuryFlash,
      platforms: this.platforms,
      hazards: this.hazards,
      fallingDebris: this.fallingDebris,
      player: this.player,
      enemies: this.enemies,
      projectiles: this.projectiles,
      pickups: this.pickups,
      crates: this.crates,
      civilians: this.civilians,
      clones: this.clones,
      particles: this.particles,
      slashArcs: this.slashArcs,
      surfaceMarks: this.surfaceMarks,
      floatingTexts: this.floatingTexts,
      afterimages: this.afterimages,
      weather: this.weather,
    });
  }
}
