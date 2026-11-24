import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { Gamepad2, Maximize2, Minimize2, Pause, Volume2, VolumeX } from 'lucide-react';
import { DIFFICULTIES, HudSnapshot, NINJUTSU_LIST, NinjutsuType } from '../game/types';
import { MobileTouchControls } from './MobileTouchControls';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  showTouchControls: boolean;
  rotated90?: boolean;
  isFullscreen?: boolean;
  onToggleTouchControls: () => void;
  onToggleFullscreen?: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onSelectNinjutsu: (kind: NinjutsuType) => void;
  onTouchMove: (dir: 'left' | 'right' | 'up' | 'down', active: boolean) => void;
  onTouchAction: (action: 'attack' | 'shuriken' | 'jump' | 'dash' | 'special' | 'moonFury') => void;
}

function NinjutsuIcon({ kind }: { kind: NinjutsuType }) {
  if (kind === 'ikazuchi') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M13.5 2.5L6 13.5H11.5L10 21.5L18 10.5H12.5L13.5 2.5Z"
          fill="#38BDF8"
          stroke="#FDE047"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'karyu') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M12.5 2.5C15 6.5 18.5 8.5 17.5 14.5C16.8 18.5 14 21 11.5 21C8 21 6 18 6.8 14C7.4 11 9.5 9.5 9.8 6.5C11.2 8 12.2 9.5 12.2 12C13 9 13 6 12.5 2.5Z"
          fill="#F97316"
          stroke="#FDBA74"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M12 12.5C13.3 14.5 14 16 13.5 18.2C13 19.6 12 20.5 11.2 20.5C10 20.5 9.3 19.2 9.6 17.4C9.9 15.8 10.9 14.2 12 12.5Z"
          fill="#FEF08A"
        />
      </svg>
    );
  }
  if (kind === 'fushin') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <circle cx="12" cy="5.5" r="2.2" fill="#E2E8F0" />
        <path
          d="M7 10.5L12 9L17 10.5M12 9V15.5M12 15.5L8.5 20.5M12 15.5L15.5 20.5"
          stroke="#34D399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'mijin') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M12 2L14.2 8.2L20.5 6L15.8 11.2L22 13L15.8 14.8L19.5 20.5L13.5 16.5L12 22L10.5 16.5L4.5 20.5L8.2 14.8L2 13L8.2 11.2L3.5 6L9.8 8.2L12 2Z"
          fill="#FB7185"
        />
        <circle cx="12" cy="12" r="2.6" fill="#FEF08A" />
      </svg>
    );
  }
  if (kind === 'bunshin') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <rect x="4" y="5" width="7" height="14" rx="2.5" fill="#7C3AED" opacity="0.7" />
        <rect x="5.5" y="7" width="4" height="2" rx="1" fill="#DDD6FE" />
        <rect x="13" y="5" width="7" height="14" rx="2.5" fill="#A78BFA" />
        <rect x="14.5" y="7" width="4" height="2" rx="1" fill="#FFFFFF" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M2.5 12C5 7.5 8.5 6 12 6C15.5 6 19 7.5 21.5 12C19 16.5 15.5 18 12 18C8.5 18 5 16.5 2.5 12Z"
        fill="#0F766E"
        stroke="#2DD4BF"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.4" fill="#2DD4BF" />
      <ellipse cx="12" cy="12" rx="1.1" ry="2.6" fill="#042F2E" />
    </svg>
  );
}

function getComboTierVisual(comboCount: number, comboRank: string) {
  if (comboCount >= 15) {
    return {
      label: comboCount >= 25 ? 'LENDA DAS SOMBRAS' : comboRank || 'SHINOBI SUPREMO',
      borderColor: 'rgba(253, 224, 71, 0.9)',
      bgClass: 'bg-gradient-to-br from-rose-950/92 via-slate-950/92 to-amber-950/90',
      glowShadow:
        '0 0 30px rgba(250, 204, 21, 0.48), 0 0 56px rgba(225, 29, 72, 0.42), 0 10px 28px rgba(0,0,0,0.7)',
      numberClass: 'text-yellow-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.75)]',
      rankClass: 'text-amber-300',
      barGradient: 'linear-gradient(90deg, #E11D48 0%, #F59E0B 55%, #FEF08A 100%)',
      barGlow: '0 0 12px rgba(250, 204, 21, 0.8)',
      flashColor: 'rgba(253, 224, 71, 0.85)',
    };
  }
  if (comboCount >= 10) {
    return {
      label: comboRank || 'KAGE',
      borderColor: 'rgba(251, 113, 133, 0.85)',
      bgClass: 'bg-gradient-to-br from-rose-950/90 to-slate-950/92',
      glowShadow:
        '0 0 24px rgba(244, 63, 94, 0.52), 0 0 42px rgba(225, 29, 72, 0.3), 0 8px 24px rgba(0,0,0,0.65)',
      numberClass: 'text-rose-200 drop-shadow-[0_0_10px_rgba(251,113,133,0.7)]',
      rankClass: 'text-rose-300',
      barGradient: 'linear-gradient(90deg, #BE123C 0%, #FB7185 60%, #FDE047 100%)',
      barGlow: '0 0 10px rgba(251, 113, 133, 0.75)',
      flashColor: 'rgba(251, 113, 133, 0.8)',
    };
  }
  if (comboCount >= 6) {
    return {
      label: comboRank || 'JŌNIN',
      borderColor: 'rgba(251, 146, 60, 0.78)',
      bgClass: 'bg-gradient-to-br from-orange-950/88 to-slate-950/92',
      glowShadow:
        '0 0 20px rgba(249, 115, 22, 0.42), 0 8px 22px rgba(0,0,0,0.6)',
      numberClass: 'text-orange-200 drop-shadow-[0_0_8px_rgba(251,146,60,0.65)]',
      rankClass: 'text-orange-300',
      barGradient: 'linear-gradient(90deg, #EA580C 0%, #FB923C 60%, #FDE047 100%)',
      barGlow: '0 0 8px rgba(251, 146, 60, 0.7)',
      flashColor: 'rgba(251, 146, 60, 0.75)',
    };
  }
  if (comboCount >= 3) {
    return {
      label: comboRank || 'CHŪNIN',
      borderColor: 'rgba(251, 191, 36, 0.65)',
      bgClass: 'bg-slate-950/88',
      glowShadow: '0 0 16px rgba(251, 191, 36, 0.32), 0 6px 20px rgba(0,0,0,0.55)',
      numberClass: 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]',
      rankClass: 'text-amber-300',
      barGradient: 'linear-gradient(90deg, #D97706 0%, #FBBF24 70%, #FEF08A 100%)',
      barGlow: '0 0 8px rgba(251, 191, 36, 0.6)',
      flashColor: 'rgba(251, 191, 36, 0.65)',
    };
  }
  return {
    label: comboCount === 1 ? 'IMPACTO' : 'COMBO',
    borderColor: 'rgba(56, 189, 248, 0.45)',
    bgClass: 'bg-slate-950/84',
    glowShadow: '0 0 12px rgba(56, 189, 248, 0.24), 0 6px 16px rgba(0,0,0,0.5)',
    numberClass: 'text-sky-200',
    rankClass: 'text-sky-300',
    barGradient: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)',
    barGlow: '0 0 6px rgba(56, 189, 248, 0.55)',
    flashColor: 'rgba(56, 189, 248, 0.55)',
  };
}

function ComboMeter({
  comboCount,
  comboDecayPct,
  comboRank,
  comboBonusPct,
}: {
  comboCount: number;
  comboDecayPct: number;
  comboRank: string;
  comboBonusPct: number;
}) {
  if (comboCount < 1) return null;

  const tier = getComboTierVisual(comboCount, comboRank);
  // Progressive scale grows smoothly with combo count (0.94 at 1 hit up to 1.30 at 24+ hits)
  const scale = Number(Math.min(1.3, 0.94 + Math.min(24, comboCount) * 0.015).toFixed(3));
  const heatPct = Math.min(100, Math.max(8, Math.round((comboCount / 20) * 100)));
  const totalSegments = 10;
  const litSegments = Math.min(totalSegments, Math.max(1, Math.ceil((comboCount / 20) * totalSegments)));

  return (
    <div
      className="pointer-events-none absolute right-3 md:right-6 top-full mt-2.5 z-20 origin-top-right transition-transform duration-150 ease-out"
      style={{ transform: `scale(${scale})` }}
      aria-live="polite"
    >
      <div
        className={`relative min-w-[152px] sm:min-w-[176px] rounded-xl backdrop-blur-md border px-3.5 py-2 transition-[box-shadow,border-color] duration-150 ${tier.bgClass}`}
        style={{
          borderColor: tier.borderColor,
          boxShadow: tier.glowShadow,
        }}
      >
        {/* Immediate impact shockwave ring on every hit */}
        <div
          key={`flash-${comboCount}`}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl border-2 animate-combo-flash"
          style={{ borderColor: tier.flashColor }}
        />

        {/* Impact pop header */}
        <div key={comboCount} className="animate-combo-impact flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <span
              className={`font-display font-extrabold leading-none tabular-nums ${
                comboCount >= 15
                  ? 'text-3xl'
                  : comboCount >= 10
                    ? 'text-2xl'
                    : comboCount >= 3
                      ? 'text-xl'
                      : 'text-lg'
              } ${tier.numberClass}`}
            >
              {comboCount}×
            </span>
            <span className="font-display font-bold text-[10px] tracking-widest text-slate-200 uppercase">
              {comboCount === 1 ? 'GOLPE' : 'COMBO'}
            </span>
          </div>

          <span className={`font-display font-bold text-[10px] tracking-wider uppercase ${tier.rankClass}`}>
            {tier.label}
          </span>
        </div>

        {/* Segmented intensity meter (grows & glows as combo climbs) */}
        <div className="mt-1.5 flex items-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: totalSegments }).map((_, idx) => {
            const lit = idx < litSegments;
            return (
              <span
                key={idx}
                className="h-1.5 flex-1 rounded-sm transition-all duration-150"
                style={{
                  background: lit ? tier.barGradient : 'rgba(15, 23, 42, 0.85)',
                  boxShadow: lit ? tier.barGlow : 'none',
                  opacity: lit ? 1 : 0.65,
                }}
              />
            );
          })}
        </div>

        {/* Damage bonus & remaining combo timer */}
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-mono-tabular">
          <span className="text-slate-300">
            {comboBonusPct > 0 ? (
              <span className="font-bold text-amber-300">+{comboBonusPct}% DANO</span>
            ) : (
              <span>CARGA {heatPct}%</span>
            )}
          </span>
          <span className="text-slate-400">
            {((comboDecayPct / 100) * 3.2).toFixed(1)}s
          </span>
        </div>

        {/* Smooth combo decay hairline bar */}
        <div className="mt-1 h-[3px] w-full rounded-full bg-slate-900/90 overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-75"
            style={{
              width: `${comboDecayPct}%`,
              background: tier.barGradient,
              boxShadow: tier.barGlow,
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface KarmaBurstState {
  id: number;
  direction: 'positive' | 'negative';
  delta: number;
  karmaValue: number;
  karmaLabel: string;
}

interface KarmaParticleSpec {
  id: number;
  originX: number;
  originY: number;
  tx: number;
  ty: number;
  size: number;
  shape: 'orb' | 'diamond' | 'streak';
  color: string;
  glow: string;
  delayMs: number;
  durationMs: number;
  rotDeg: number;
  scale: number;
}

const POSITIVE_KARMA_PALETTE = [
  { color: '#34D399', glow: 'rgba(52, 211, 153, 0.92)' },
  { color: '#2DD4BF', glow: 'rgba(45, 212, 191, 0.9)' },
  { color: '#FDE047', glow: 'rgba(253, 224, 71, 0.95)' },
  { color: '#67E8F9', glow: 'rgba(103, 232, 249, 0.88)' },
  { color: '#ECFDF5', glow: 'rgba(167, 243, 208, 0.95)' },
];

const NEGATIVE_KARMA_PALETTE = [
  { color: '#FB7185', glow: 'rgba(251, 113, 133, 0.95)' },
  { color: '#E11D48', glow: 'rgba(225, 29, 72, 0.95)' },
  { color: '#FB923C', glow: 'rgba(251, 146, 60, 0.9)' },
  { color: '#C084FC', glow: 'rgba(192, 132, 252, 0.9)' },
  { color: '#FDBA74', glow: 'rgba(253, 186, 116, 0.88)' },
];

function buildKarmaParticles(burstId: number, direction: 'positive' | 'negative'): KarmaParticleSpec[] {
  const palette = direction === 'positive' ? POSITIVE_KARMA_PALETTE : NEGATIVE_KARMA_PALETTE;
  const count = 22;
  const particles: KarmaParticleSpec[] = [];

  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random scatter per burst so every change feels lively & varied
    const seed = Math.sin((burstId * 97 + i * 31.7) * 12.9898) * 43758.5453;
    const randA = seed - Math.floor(seed);
    const seed2 = Math.sin((burstId * 53 + i * 67.3) * 78.233) * 19341.231;
    const randB = seed2 - Math.floor(seed2);

    const baseAngle = (i / count) * Math.PI * 2 + (randA - 0.5) * 0.42;
    const distance = 36 + randB * 62;
    const biasY = direction === 'positive' ? -18 - randA * 18 : 14 + randA * 16;
    const tx = Math.cos(baseAngle) * distance * 1.25;
    const ty = Math.sin(baseAngle) * distance * 0.78 + biasY;

    const tone = palette[(i + burstId) % palette.length];
    const shape: KarmaParticleSpec['shape'] =
      i % 3 === 0 ? 'diamond' : i % 4 === 1 ? 'streak' : 'orb';

    particles.push({
      id: i,
      originX: 18 + randA * 64,
      originY: 28 + randB * 44,
      tx: Math.round(tx),
      ty: Math.round(ty),
      size: shape === 'streak' ? 3 + Math.round(randB * 2) : 4 + Math.round(randA * 5),
      shape,
      color: tone.color,
      glow: tone.glow,
      delayMs: Math.round(randA * 130),
      durationMs: 680 + Math.round(randB * 460),
      rotDeg: Math.round((direction === 'positive' ? 1 : -1) * (90 + randB * 220)),
      scale: Number((0.95 + randA * 0.45).toFixed(2)),
    });
  }

  return particles;
}

function KarmaParticleBurst({ burst }: { burst: KarmaBurstState }) {
  const particles = buildKarmaParticles(burst.id, burst.direction);
  const isPositive = burst.direction === 'positive';
  const deltaText =
    burst.delta > 0 ? `+${burst.delta} KARMA` : `${burst.delta} KARMA`;

  return (
    <div
      key={`karma-burst-${burst.id}`}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible z-30"
    >
      {/* Expanding luminous shockwave ring */}
      <div
        className="absolute inset-0 rounded-lg border-2 animate-karma-ring"
        style={{
          borderColor: isPositive ? 'rgba(52, 211, 153, 0.95)' : 'rgba(244, 63, 94, 0.95)',
          boxShadow: isPositive
            ? '0 0 22px rgba(52, 211, 153, 0.75), inset 0 0 12px rgba(253, 224, 71, 0.45)'
            : '0 0 22px rgba(244, 63, 94, 0.78), inset 0 0 12px rgba(192, 132, 252, 0.45)',
        }}
      />

      {/* Radiating colorful particles */}
      {particles.map((p) => {
        const style = {
          left: `${p.originX}%`,
          top: `${p.originY}%`,
          width: p.shape === 'streak' ? `${p.size * 2.6}px` : `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.color,
          boxShadow: `0 0 ${p.size + 5}px ${p.glow}`,
          animationDelay: `${p.delayMs}ms`,
          animationDuration: `${p.durationMs}ms`,
          '--kp-tx': `${p.tx}px`,
          '--kp-ty': `${p.ty}px`,
          '--kp-rot': `${p.rotDeg}deg`,
          '--kp-scale': p.scale,
        } as CSSProperties;

        return (
          <span
            key={p.id}
            style={style}
            className={`absolute animate-karma-particle ${
              p.shape === 'orb'
                ? 'rounded-full'
                : p.shape === 'diamond'
                  ? 'rounded-[1px] rotate-45'
                  : 'rounded-full'
            }`}
          />
        );
      })}

      {/* Floating Karma delta callout */}
      <span
        className={`absolute left-1/2 -bottom-5 whitespace-nowrap font-display font-extrabold text-[11px] tracking-wider px-1.5 py-0.5 rounded-md border animate-karma-delta ${
          isPositive
            ? 'bg-emerald-950/92 border-emerald-300/80 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.6)]'
            : 'bg-rose-950/92 border-rose-400/80 text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.65)]'
        }`}
      >
        {deltaText}
      </span>
    </div>
  );
}

export function GameHud({
  hud,
  muted,
  showTouchControls,
  rotated90 = false,
  isFullscreen = false,
  onToggleTouchControls,
  onToggleFullscreen,
  onToggleMute,
  onPause,
  onSelectNinjutsu,
  onTouchMove,
  onTouchAction,
}: GameHudProps) {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const chiPct = Math.max(0, Math.min(100, (hud.chi / hud.maxChi) * 100));
  const moonFuryPct = Math.max(0, Math.min(100, (hud.moonFury / hud.maxMoonFury) * 100));
  const hpStatus = hpPct > 55 ? 'ESTÁVEL' : hpPct > 25 ? 'FERIDO' : 'CRÍTICO';
  const specialReady = hud.chi >= hud.maxChi;
  const moonFuryReady = hud.moonFury >= hud.maxMoonFury;
  const diffLabel = DIFFICULTIES[hud.difficulty].label;
  const activeArt = NINJUTSU_LIST.find((n) => n.id === hud.activeNinjutsu) ?? NINJUTSU_LIST[0];
  const requiredArt = NINJUTSU_LIST.find((n) => n.id === hud.requiredJutsu) ?? NINJUTSU_LIST[0];
  const paddedShurikens = String(hud.shurikens).padStart(3, '0');
  const comboBonusPct = Math.round((hud.comboDamageMult - 1) * 100);

  const prevKarmaRef = useRef<{
    karma: number;
    rescued: number;
    harmed: number;
  }>({
    karma: hud.karma,
    rescued: hud.civiliansRescued,
    harmed: hud.civiliansHarmed,
  });
  const burstSeqRef = useRef(0);
  const [karmaBurst, setKarmaBurst] = useState<KarmaBurstState | null>(null);

  useEffect(() => {
    const prev = prevKarmaRef.current;
    const rawDelta = hud.karma - prev.karma;
    const isFreshReset =
      hud.karma === 0 &&
      hud.civiliansRescued === 0 &&
      hud.civiliansHarmed === 0 &&
      (prev.karma !== 0 || prev.rescued !== 0 || prev.harmed !== 0);

    let effectiveDelta = 0;
    if (!isFreshReset) {
      if (Math.abs(rawDelta) >= 10) {
        effectiveDelta = rawDelta;
      } else if (hud.karma >= 100 && hud.civiliansRescued > prev.rescued) {
        effectiveDelta = 15;
      } else if (hud.karma <= -100 && hud.civiliansHarmed > prev.harmed) {
        effectiveDelta = -25;
      }
    }

    prevKarmaRef.current = {
      karma: hud.karma,
      rescued: hud.civiliansRescued,
      harmed: hud.civiliansHarmed,
    };

    if (effectiveDelta !== 0) {
      burstSeqRef.current += 1;
      const nextId = burstSeqRef.current;
      setKarmaBurst({
        id: nextId,
        direction: effectiveDelta > 0 ? 'positive' : 'negative',
        delta: effectiveDelta,
        karmaValue: hud.karma,
        karmaLabel: hud.karmaLabel,
      });

      const timer = window.setTimeout(() => {
        setKarmaBurst((curr) => (curr && curr.id === nextId ? null : curr));
      }, 1350);
      return () => window.clearTimeout(timer);
    }
  }, [hud.karma, hud.karmaLabel, hud.civiliansRescued, hud.civiliansHarmed]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
      {/* Modern Translucent HD-2D Top HUD Bar */}
      <div>
        <div className="relative pointer-events-auto w-full bg-slate-950/82 backdrop-blur-md border-b border-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.45)] px-2.5 sm:px-3 md:px-5 py-1.5 sm:py-2 [@media(max-height:520px)]:py-1 flex items-center justify-between gap-2 md:gap-4">
          {/* Left: Smooth HP gauge + Shuriken counter + Fúria da Lua */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
            <div className="min-w-[112px] sm:min-w-[130px] md:min-w-[164px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-display font-bold text-[11px] tracking-wider text-amber-400">
                  VIDA
                </span>
                <span className="text-[10px] font-mono-tabular text-slate-300">
                  {hud.hp}/{hud.maxHp} · {hpStatus}
                </span>
              </div>
              <div
                className="relative h-2.5 w-full rounded-md bg-slate-900/90 border border-white/12 overflow-hidden"
                aria-label={`Vida ${hud.hp} de ${hud.maxHp}`}
              >
                <div
                  className={`h-full rounded-sm transition-[width] duration-150 ${
                    hpPct > 55
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : hpPct > 25
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-rose-600 to-rose-400'
                  }`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5 text-[10px] font-mono-tabular">
                <span className={specialReady ? 'text-amber-300 font-bold' : 'text-sky-400'}>
                  CHI {hud.chi}%
                </span>
                <span
                  className="text-slate-300"
                  title={`Civis nesta fase: ${hud.stageCiviliansRescued} salvos / ${hud.stageCiviliansHarmed} feridos de ${hud.stageCiviliansTotal}`}
                >
                  CIVIS{' '}
                  <span className="text-emerald-300 font-bold">{hud.civiliansRescued}</span>
                  <span className="text-slate-500">/</span>
                  <span className={hud.civiliansHarmed > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {hud.civiliansHarmed}
                  </span>
                </span>
              </div>
            </div>

            {/* Shuriken Counter (hidden on compact mobile where Kunai touch button displays count) */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/75 border border-white/10">
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FDE047" />
                <circle cx="12" cy="12" r="2.2" fill="#0F172A" />
              </svg>
              <span className="font-display font-bold text-sm md:text-base text-yellow-300 font-mono-tabular leading-none">
                {paddedShurikens}
              </span>
            </div>

            {/* Fúria da Lua Gauge */}
            <button
              type="button"
              onClick={() => {
                if (moonFuryReady) onTouchAction('moonFury');
              }}
              disabled={!moonFuryReady}
              title={
                moonFuryReady
                  ? 'Fúria da Lua pronta! Pressione F ou clique para ativar o ataque de área'
                  : 'Fúria da Lua: acerte golpes de katana para carregar'
              }
              className={`flex flex-col justify-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border text-left transition-all shrink-0 ${
                moonFuryReady
                  ? 'border-amber-300/70 bg-rose-950/85 shadow-[0_0_18px_rgba(244,63,94,0.4)] cursor-pointer'
                  : 'border-white/10 bg-slate-900/70 cursor-default'
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-1.5">
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none">
                  <path
                    d="M12.5 9.5A5.5 5.5 0 0 1 6.5 3.5A5.5 5.5 0 1 0 12.5 9.5Z"
                    fill={moonFuryReady ? '#FDE047' : '#FB7185'}
                  />
                </svg>
                <span
                  className={`font-display font-bold text-[10px] tracking-wide whitespace-nowrap ${
                    moonFuryReady ? 'text-yellow-300' : 'text-rose-300'
                  }`}
                >
                  <span className="md:hidden">{moonFuryReady ? 'FÚRIA!' : 'FÚRIA'}</span>
                  <span className="hidden md:inline">
                    {moonFuryReady ? 'FÚRIA DA LUA (F)' : 'FÚRIA DA LUA'}
                  </span>
                </span>
                <span className="font-mono-tabular text-[10px] font-bold text-slate-200 ml-0.5 sm:ml-1">
                  {hud.moonFury}%
                </span>
              </div>
              <div className="w-20 sm:w-24 md:w-32 h-1.5 rounded-full bg-slate-950 border border-white/10 mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-150 ${
                    moonFuryReady
                      ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-200'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400'
                  }`}
                  style={{ width: `${moonFuryPct}%` }}
                />
              </div>
            </button>

            {/* Karma Alignment Meter (visible on wide HUD) */}
            <div
              key={karmaBurst ? `karma-meter-${karmaBurst.id}` : 'karma-meter-idle'}
              className={`relative hidden xl:flex flex-col justify-center min-w-[152px] px-2.5 py-1.5 rounded-lg border overflow-visible transition-[border-color,box-shadow,background-color] duration-200 ${
                karmaBurst
                  ? karmaBurst.direction === 'positive'
                    ? 'border-emerald-300/90 bg-emerald-950/75 shadow-[0_0_24px_rgba(52,211,153,0.5)] animate-karma-positive'
                    : 'border-rose-400/90 bg-rose-950/75 shadow-[0_0_24px_rgba(244,63,94,0.55)] animate-karma-negative'
                  : 'border-white/10 bg-slate-900/70'
              }`}
              title={`Alinhamento: ${hud.karmaLabel} · Fase ${hud.stageCiviliansRescued}/${hud.stageCiviliansTotal} salvos · Total ${hud.civiliansRescued} salvos / ${hud.civiliansHarmed} feridos`}
            >
              {karmaBurst && <KarmaParticleBurst burst={karmaBurst} />}
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono-tabular leading-none">
                <span
                  className={`font-display font-bold tracking-wide truncate ${
                    hud.karma >= 15
                      ? 'text-emerald-300'
                      : hud.karma <= -15
                        ? 'text-rose-300'
                        : 'text-amber-300'
                  }`}
                >
                  {hud.karmaLabel}
                </span>
                <span className="font-bold text-slate-200 shrink-0">
                  {hud.karma >= 0 ? `+${hud.karma}` : hud.karma}
                </span>
              </div>
              <div className="relative w-full h-1.5 rounded-full bg-slate-950 border border-white/10 mt-1.5 overflow-hidden">
                <div
                  className="absolute left-1/2 top-0 bottom-0 w-px bg-white/35 z-10"
                  aria-hidden="true"
                />
                {hud.karma >= 0 ? (
                  <div
                    className="absolute top-0 bottom-0 left-1/2 bg-gradient-to-r from-emerald-500 to-teal-300 transition-[width] duration-150"
                    style={{ width: `${Math.min(50, (hud.karma / 100) * 50)}%` }}
                  />
                ) : (
                  <div
                    className="absolute top-0 bottom-0 right-1/2 bg-gradient-to-l from-rose-600 to-orange-400 transition-[width] duration-150"
                    style={{ width: `${Math.min(50, (Math.abs(hud.karma) / 100) * 50)}%` }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-1 text-[9px] font-mono-tabular text-slate-400 leading-none">
                <span>
                  Salvos <strong className="text-emerald-300">{hud.civiliansRescued}</strong>
                </span>
                <span>
                  Feridos <strong className={hud.civiliansHarmed > 0 ? 'text-rose-300' : 'text-slate-300'}>{hud.civiliansHarmed}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Center: 6 Ninjutsu Cards + Chi progress */}
          <div className="flex flex-col items-center shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              {NINJUTSU_LIST.map((art) => {
                const selected = art.id === hud.activeNinjutsu;
                const isRequired = art.id === hud.requiredJutsu;
                const fogNeedAlert = art.id === 'yagan' && hud.denseFog && hud.nightVisionTimer <= 0;
                const sealNeedAlert = isRequired && Boolean(hud.boss?.sealActive);
                return (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => onSelectNinjutsu(art.id)}
                    title={`${art.key} · ${art.name}: ${art.subtitle}${isRequired ? ' (Jutsu obrigatório desta fase)' : ''}`}
                    aria-label={`Selecionar Ninjutsu ${art.name}`}
                    className={`relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                      selected
                        ? 'border-2 border-rose-400 bg-slate-900 shadow-[0_0_12px_rgba(244,63,94,0.38)]'
                        : isRequired || fogNeedAlert
                          ? 'border border-amber-400/80 bg-slate-900/90 hover:border-amber-300'
                          : 'border border-white/12 bg-slate-900/75 hover:border-white/30'
                    } ${sealNeedAlert || fogNeedAlert ? 'ring-2 ring-teal-300/80' : ''}`}
                  >
                    <NinjutsuIcon kind={art.id} />
                    {isRequired && (
                      <span
                        className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1 rounded text-[7px] font-display font-bold leading-tight border ${
                          hud.requiredJutsuBroken && !hud.boss?.sealActive
                            ? 'bg-emerald-950 border-emerald-400/70 text-emerald-300'
                            : 'bg-amber-950 border-amber-300/80 text-yellow-200'
                        }`}
                      >
                        FASE
                      </span>
                    )}
                    <span className="absolute bottom-0.5 right-1 text-[8px] font-mono-tabular font-bold text-slate-200 leading-none">
                      {art.key}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="w-full h-1 rounded-full bg-slate-800/90 mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-150 ${
                  specialReady
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-200'
                    : 'bg-gradient-to-r from-sky-500 to-cyan-300'
                }`}
                style={{ width: `${chiPct}%` }}
              />
            </div>
            <div className="hidden lg:flex items-center gap-2 text-[10px] mt-0.5 whitespace-nowrap">
              <span className={specialReady ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                {specialReady ? `PRONTO (E) · ${activeArt.name}` : activeArt.name}
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span
                className={
                  hud.boss?.sealActive
                    ? 'text-yellow-300 font-bold'
                    : hud.requiredJutsuBroken
                      ? 'text-emerald-400 font-semibold'
                      : 'text-amber-300/90'
                }
              >
                Fase: {requiredArt.name} ({requiredArt.key})
              </span>
              {hud.shieldHits > 0 && (
                <span className="text-sky-400 font-bold">Escudo:{hud.shieldHits}</span>
              )}
              {hud.fushinTimer > 0 && (
                <span className="text-emerald-400 font-bold">Fushin:{hud.fushinTimer}s</span>
              )}
              {hud.nightVisionTimer > 0 && (
                <span className="text-teal-300 font-bold">Visão:{hud.nightVisionTimer}s</span>
              )}
              {hud.clonesCount > 0 && (
                <span className="text-violet-300 font-bold">Clones:{hud.clonesCount}</span>
              )}
            </div>
          </div>

          {/* Right: Stage/Score & Controls */}
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="hidden md:flex items-center gap-2.5">
              <div className="text-right">
                <div className="text-[11px] text-slate-300 whitespace-nowrap">
                  <span className="font-medium text-white">{hud.stageTitle}</span>
                  <span className="mx-1.5 text-slate-600" aria-hidden="true">·</span>
                  <span className="text-amber-400 font-semibold">{diffLabel}</span>
                </div>
                <div className="flex items-center justify-end gap-2.5 font-mono-tabular mt-0.5">
                  <div
                    className="flex items-center gap-1.5 text-[10px]"
                    title={`Etapa ${hud.waveIndex} de ${hud.totalWaves}: ${hud.zoneName}`}
                  >
                    <span className={hud.waveIndex === hud.totalWaves ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      Etapa {hud.waveIndex}/{hud.totalWaves}
                      {hud.waveIndex === hud.totalWaves ? ' · CHEFE' : ''}
                    </span>
                    <span className="flex items-center gap-1" aria-hidden="true">
                      {Array.from({ length: hud.totalWaves }).map((_, idx) => {
                        const stepNum = idx + 1;
                        const completed = stepNum < hud.waveIndex;
                        const current = stepNum === hud.waveIndex;
                        const isBossStep = stepNum === hud.totalWaves;
                        return (
                          <span
                            key={stepNum}
                            className={`block w-2 h-2 rounded-full border ${
                              current
                                ? isBossStep
                                  ? 'bg-rose-500 border-yellow-300'
                                  : 'bg-amber-400 border-amber-200'
                                : completed
                                  ? 'bg-emerald-500 border-emerald-300'
                                  : 'bg-slate-900 border-slate-600'
                            }`}
                          />
                        );
                      })}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-yellow-300">
                    {hud.score.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={onToggleTouchControls}
                aria-label={showTouchControls ? 'Ocultar botões na tela' : 'Mostrar botões na tela'}
                title={showTouchControls ? 'Ocultar controles de toque' : 'Ativar controles de toque na tela'}
                className={`min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                  showTouchControls
                    ? 'bg-rose-950/85 border-rose-400/60 text-rose-200'
                    : 'bg-slate-900/80 border-white/12 text-slate-300 hover:text-white hover:border-white/30'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
              </button>
              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia horizontal'}
                  title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia horizontal'}
                  className="min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-lg flex items-center justify-center bg-slate-900/80 border border-white/12 text-slate-200 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'Ativar som' : 'Silenciar som'}
                className="min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-lg flex items-center justify-center bg-slate-900/80 border border-white/12 text-slate-200 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onPause}
                aria-label="Pausar jogo"
                className="min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-lg flex items-center justify-center bg-slate-900/80 border border-white/12 text-slate-200 hover:text-white hover:border-white/30 transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compact/Mobile HUD Karma Shift Particle Callout (shown below left HUD on < xl viewports) */}
          {karmaBurst && (
            <div
              key={`karma-compact-${karmaBurst.id}`}
              aria-live="polite"
              className="pointer-events-none xl:hidden absolute left-3 md:left-5 top-full mt-2.5 z-20"
            >
              <div
                className={`relative min-w-[154px] rounded-xl backdrop-blur-md border px-3 py-1.5 overflow-visible animate-karma-toast ${
                  karmaBurst.direction === 'positive'
                    ? 'bg-emerald-950/90 border-emerald-300/85 shadow-[0_0_24px_rgba(52,211,153,0.48)]'
                    : 'bg-rose-950/90 border-rose-400/85 shadow-[0_0_24px_rgba(244,63,94,0.52)]'
                }`}
              >
                <KarmaParticleBurst burst={karmaBurst} />
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono-tabular leading-none">
                  <span
                    className={`font-display font-bold tracking-wide uppercase ${
                      karmaBurst.direction === 'positive' ? 'text-emerald-200' : 'text-rose-200'
                    }`}
                  >
                    {karmaBurst.karmaLabel}
                  </span>
                  <span className="font-bold text-white">
                    {karmaBurst.karmaValue >= 0 ? `+${karmaBurst.karmaValue}` : karmaBurst.karmaValue}
                  </span>
                </div>
                <div className="relative w-full h-1.5 rounded-full bg-slate-950/90 border border-white/15 mt-1.5 overflow-hidden">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40 z-10" aria-hidden="true" />
                  {karmaBurst.karmaValue >= 0 ? (
                    <div
                      className="absolute top-0 bottom-0 left-1/2 bg-gradient-to-r from-emerald-500 to-teal-300"
                      style={{ width: `${Math.min(50, (karmaBurst.karmaValue / 100) * 50)}%` }}
                    />
                  ) : (
                    <div
                      className="absolute top-0 bottom-0 right-1/2 bg-gradient-to-l from-rose-600 to-orange-400"
                      style={{ width: `${Math.min(50, (Math.abs(karmaBurst.karmaValue) / 100) * 50)}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          <ComboMeter
            comboCount={hud.comboCount}
            comboDecayPct={hud.comboDecayPct}
            comboRank={hud.comboRank}
            comboBonusPct={comboBonusPct}
          />
        </div>

        {/* Weather Cycle, Dense Forest Fog & Hazard Alerts */}
        <div className="mx-auto mt-2 flex flex-wrap items-center justify-center gap-2 px-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg backdrop-blur-md border text-[10px] font-mono-tabular font-semibold tracking-wide shadow-md ${
              hud.weatherKind === 'clear'
                ? 'bg-rose-950/78 border-rose-400/45 text-rose-100'
                : hud.weatherKind === 'snow'
                  ? 'bg-slate-900/80 border-cyan-300/45 text-cyan-100'
                  : hud.weatherKind === 'fog'
                    ? 'bg-teal-950/80 border-teal-300/45 text-teal-100'
                    : hud.weatherKind === 'storm'
                      ? 'bg-indigo-950/85 border-sky-300/65 text-sky-100'
                      : 'bg-sky-950/80 border-sky-400/45 text-sky-100'
            }`}
            title={`Clima atual: ${hud.weatherLabel} (${hud.weatherEffect}) · ${hud.weatherTacticalTip}`}
          >
            {hud.weatherKind === 'clear' ? (
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none">
                <circle cx="8" cy="8" r="5" fill="#FB7185" />
                <circle cx="10.2" cy="6.8" r="3" fill="#881337" />
              </svg>
            ) : hud.weatherKind === 'snow' ? (
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none">
                <path d="M8 2V14M2 8H14M4 4L12 12M12 4L4 12" stroke="#E0F2FE" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : hud.weatherKind === 'fog' ? (
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none">
                <path d="M2 5H12M4 8.5H14M3 12H11" stroke="#5EEAD4" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : hud.weatherKind === 'storm' ? (
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none">
                <path d="M9.5 1.5L4.5 9H8L6.5 14.5L12 7H8.5L9.5 1.5Z" fill="#7DD3FC" stroke="#FDE047" strokeWidth="0.9" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none">
                <path d="M5 3L3.5 7.5M9.5 4L8 9M13 2.5L11.5 7.5" stroke="#7DD3FC" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
            <span>{hud.weatherLabel.toUpperCase()}</span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-amber-300">{hud.weatherEffect}</span>
            <span className="hidden sm:inline text-slate-400" aria-hidden="true">·</span>
            <span className="hidden sm:inline text-slate-200/90 font-normal">{hud.weatherTacticalTip}</span>
          </div>

          {hud.denseFog && (
            <div
              className={`px-3 py-1 rounded-lg backdrop-blur-md border text-[10px] font-mono-tabular font-semibold tracking-wide shadow-md ${
                hud.nightVisionTimer > 0
                  ? 'bg-teal-950/82 border-teal-400/60 text-teal-100'
                  : 'bg-slate-950/85 border-teal-400/70 text-teal-200'
              }`}
            >
              {hud.nightVisionTimer > 0
                ? `VISÃO NOTURNA ATIVA (${hud.nightVisionTimer}s) · ALVOS IDENTIFICADOS (+20% DANO)`
                : 'NÉVOA DENSA · USE EMBOSCADAS OU VISÃO NOTURNA (6+E)'}
            </div>
          )}
          {hud.activeHazardWarning && (
            <div
              className={`px-3 py-1 rounded-lg backdrop-blur-md border text-[10px] font-mono-tabular font-semibold tracking-wide shadow-md ${
                hud.activeHazardWarning.inside
                  ? 'bg-rose-950/90 border-yellow-300/80 text-yellow-200'
                  : 'bg-amber-950/85 border-amber-400/60 text-amber-100'
              }`}
            >
              ⚠ {hud.activeHazardWarning.label.toUpperCase()} ·{' '}
              {hud.activeHazardWarning.kind === 'cave_rockfall'
                ? 'IMPACTO IMINENTE! DESVIE COM ESQUIVA SOMBRIA (SHIFT)'
                : hud.activeHazardWarning.inside
                  ? 'DANO CONTÍNUO! USE ESQUIVA SOMBRIA (SHIFT)'
                  : 'ATRAVESSE COM ESQUIVA SOMBRIA (SHIFT)'}
            </div>
          )}
        </div>

        {/* Boss HP Strip */}
        {hud.boss && (
          <div className="mx-auto mt-2.5 w-80 sm:w-[420px] rounded-xl bg-slate-950/88 backdrop-blur-md border border-rose-500/45 px-4 py-2 shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-display font-bold text-rose-300 truncate">
                {hud.boss.name}
              </span>
              <span className="font-mono-tabular text-yellow-300 shrink-0 ml-2">
                {hud.boss.phase === 2 ? 'FASE II · ' : ''}
                {hud.boss.hp}/{hud.boss.maxHp}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-700 via-rose-500 to-amber-400 transition-[width] duration-150"
                style={{ width: `${Math.max(0, (hud.boss.hp / hud.boss.maxHp) * 100)}%` }}
              />
            </div>
            {hud.boss.sealActive && (
              <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono-tabular">
                <span className="text-amber-300 font-bold">
                  SELO ATIVO (-85% DANO)
                </span>
                <span className="text-yellow-200 font-bold">
                  QUEBRE COM {requiredArt.name.toUpperCase()} ({requiredArt.key}+E)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle Area: Wave Banner & Advance Arrow */}
      <div className="relative flex-1 flex items-center justify-center px-4">
        {hud.bannerText && (
          <div className="rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-400/50 px-6 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.75)]">
            <p className="font-display font-bold text-sm md:text-base text-yellow-200 tracking-wide">
              {hud.bannerText}
            </p>
          </div>
        )}

        {hud.goPrompt && (
          <div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-emerald-400/60 px-4 py-2 flex items-center gap-2 shadow-lg">
            <span className="font-display font-bold text-xs md:text-sm text-emerald-300">
              AVANÇAR
            </span>
            <span className="text-emerald-300 font-bold text-base" aria-hidden="true">→</span>
          </div>
        )}
      </div>

      {/* Ergonomic Multi-Touch Virtual Gamepad (works in mobile landscape & toggleable anytime) */}
      {showTouchControls && (
        <MobileTouchControls
          hud={hud}
          rotated90={rotated90}
          onTouchMove={onTouchMove}
          onTouchAction={onTouchAction}
          onSelectNinjutsu={onSelectNinjutsu}
        />
      )}
    </div>
  );
}
