import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { HudSnapshot, NINJUTSU_LIST, NinjutsuType } from '../game/types';

interface MobileTouchControlsProps {
  hud: HudSnapshot;
  rotated90?: boolean;
  onTouchMove: (dir: 'left' | 'right' | 'up' | 'down', active: boolean) => void;
  onTouchAction: (action: 'attack' | 'shuriken' | 'jump' | 'dash' | 'special' | 'moonFury') => void;
  onSelectNinjutsu: (kind: NinjutsuType) => void;
}

interface DirState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

const EMPTY_DIRS: DirState = { left: false, right: false, up: false, down: false };

export function MobileTouchControls({
  hud,
  rotated90 = false,
  onTouchMove,
  onTouchAction,
  onSelectNinjutsu,
}: MobileTouchControlsProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const prevDirsRef = useRef<DirState>(EMPTY_DIRS);

  const [dirs, setDirs] = useState<DirState>(EMPTY_DIRS);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pressedAction, setPressedAction] = useState<string | null>(null);

  const specialReady = hud.chi >= hud.maxChi;
  const moonFuryReady = hud.moonFury >= hud.maxMoonFury;
  const activeArt = NINJUTSU_LIST.find((n) => n.id === hud.activeNinjutsu) ?? NINJUTSU_LIST[0];

  const syncDirs = useCallback(
    (next: DirState) => {
      const prev = prevDirsRef.current;
      if (prev.left !== next.left) onTouchMove('left', next.left);
      if (prev.right !== next.right) onTouchMove('right', next.right);
      if (prev.up !== next.up) onTouchMove('up', next.up);
      if (prev.down !== next.down) onTouchMove('down', next.down);
      prevDirsRef.current = next;
      setDirs(next);
    },
    [onTouchMove]
  );

  const releasePad = useCallback(() => {
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    syncDirs(EMPTY_DIRS);
  }, [syncDirs]);

  useEffect(() => {
    return () => {
      onTouchMove('left', false);
      onTouchMove('right', false);
      onTouchMove('up', false);
      onTouchMove('down', false);
    };
  }, [onTouchMove]);

  const updateStickFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rawDx = clientX - cx;
      const rawDy = clientY - cy;

      // When forced CSS 90deg clockwise rotation is active, map screen deltas into rotated container axes
      const dx = rotated90 ? rawDy : rawDx;
      const dy = rotated90 ? -rawDx : rawDy;

      const maxRadius = Math.max(36, Math.min(rect.width, rect.height) * 0.36);
      const dist = Math.hypot(dx, dy);
      const deadZone = 11;

      if (dist < deadZone) {
        setKnobOffset({ x: 0, y: 0 });
        syncDirs(EMPTY_DIRS);
        return;
      }

      const clampedDist = Math.min(maxRadius, dist);
      const nx = dx / dist;
      const ny = dy / dist;
      setKnobOffset({ x: nx * clampedDist, y: ny * clampedDist });

      const threshold = 0.34;
      syncDirs({
        left: nx < -threshold,
        right: nx > threshold,
        up: ny < -threshold,
        down: ny > threshold,
      });
    },
    [rotated90, syncDirs]
  );

  const handlePadPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    activePointerId.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture errors on older browsers
    }
    updateStickFromPointer(e.clientX, e.clientY);
  };

  const handlePadPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    updateStickFromPointer(e.clientX, e.clientY);
  };

  const handlePadPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    releasePad();
  };

  const triggerAction = (
    e: ReactPointerEvent<HTMLButtonElement>,
    action: 'attack' | 'shuriken' | 'jump' | 'dash' | 'special' | 'moonFury'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setPressedAction(action);
    onTouchAction(action);
  };

  const releaseAction = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setPressedAction(null);
  };

  const handleCycleNinjutsu = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const idx = NINJUTSU_LIST.findIndex((n) => n.id === hud.activeNinjutsu);
    const next = NINJUTSU_LIST[(idx + 1) % NINJUTSU_LIST.length];
    onSelectNinjutsu(next.id);
  };

  return (
    <div className="pointer-events-none safe-area-hud w-full flex items-end justify-between px-3 sm:px-5 pb-2.5 sm:pb-4 select-none">
      {/* LEFT THUMB ZONE: 8-Way Virtual Analog + Directional Pad */}
      <div className="pointer-events-auto flex flex-col items-start gap-1.5">
        <div
          ref={padRef}
          role="application"
          aria-label="Controle direcional de movimento"
          onPointerDown={handlePadPointerDown}
          onPointerMove={handlePadPointerMove}
          onPointerUp={handlePadPointerUp}
          onPointerCancel={handlePadPointerUp}
          onLostPointerCapture={releasePad}
          className="touch-control-surface relative w-[124px] h-[124px] sm:w-[138px] sm:h-[138px] rounded-full bg-slate-950/62 backdrop-blur-md border-2 border-white/18 shadow-[0_8px_28px_rgba(0,0,0,0.6),inset_0_0_24px_rgba(255,255,255,0.04)] flex items-center justify-center"
        >
          {/* Subtle crosshair guides */}
          <div className="pointer-events-none absolute inset-3 rounded-full border border-white/8" aria-hidden="true" />

          {/* Directional chevrons */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold transition-colors ${
              dirs.up ? 'text-amber-300 scale-115' : 'text-slate-400/75'
            }`}
          >
            ▲
          </span>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold transition-colors ${
              dirs.down ? 'text-amber-300 scale-115' : 'text-slate-400/75'
            }`}
          >
            ▼
          </span>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold transition-colors ${
              dirs.left ? 'text-amber-300 scale-115' : 'text-slate-400/75'
            }`}
          >
            ◀
          </span>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold transition-colors ${
              dirs.right ? 'text-amber-300 scale-115' : 'text-slate-400/75'
            }`}
          >
            ▶
          </span>

          {/* Movable thumbstick nub */}
          <div
            aria-hidden="true"
            className="pointer-events-none w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-slate-700/95 via-slate-800/95 to-slate-950/95 border-2 border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.75)] flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
              borderColor:
                dirs.left || dirs.right || dirs.up || dirs.down
                  ? 'rgba(251, 191, 36, 0.85)'
                  : 'rgba(255, 255, 255, 0.28)',
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/15 border border-white/25" />
          </div>
        </div>
      </div>

      {/* RIGHT THUMB ZONE: Ergonomic Arcade Combat Cluster */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* Upper Utility Row: Ninjutsu Cycle + Ninjutsu Cast + Fúria da Lua */}
        <div className="flex items-center gap-2">
          {moonFuryReady && (
            <button
              type="button"
              onPointerDown={(e) => triggerAction(e, 'moonFury')}
              onPointerUp={releaseAction}
              onPointerCancel={releaseAction}
              aria-label="Ativar Fúria da Lua"
              className={`touch-control-surface min-w-[54px] h-[46px] px-3 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 border-2 border-yellow-200 text-white font-display font-extrabold text-[11px] tracking-wide shadow-[0_0_20px_rgba(244,63,94,0.65)] transition-transform ${
                pressedAction === 'moonFury' ? 'scale-90' : 'scale-100'
              }`}
            >
              FÚRIA
            </button>
          )}

          <button
            type="button"
            onPointerDown={handleCycleNinjutsu}
            aria-label="Trocar arte Ninjutsu"
            className="touch-control-surface min-w-[44px] h-[44px] px-2.5 rounded-full bg-slate-950/72 backdrop-blur-md border border-white/20 text-slate-200 font-display font-bold text-[10px] flex flex-col items-center justify-center leading-tight active:scale-90 transition-transform"
          >
            <span className="text-amber-300 text-[11px] leading-none">⇄</span>
            <span className="truncate max-w-[46px]">{activeArt.key}·Arte</span>
          </button>

          <button
            type="button"
            onPointerDown={(e) => triggerAction(e, 'special')}
            onPointerUp={releaseAction}
            onPointerCancel={releaseAction}
            aria-label={`Usar Ninjutsu ${activeArt.name}`}
            className={`touch-control-surface min-w-[58px] h-[48px] px-3 rounded-full backdrop-blur-md border-2 font-display font-extrabold text-[11px] tracking-wide flex flex-col items-center justify-center leading-tight transition-transform ${
              specialReady
                ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-yellow-100 text-slate-950 shadow-[0_0_22px_rgba(251,191,36,0.55)]'
                : 'bg-slate-950/65 border-sky-400/30 text-sky-200/80'
            } ${pressedAction === 'special' ? 'scale-90' : 'scale-100'}`}
          >
            <span>JUTSU</span>
            <span className="font-mono-tabular text-[9px] font-bold">
              {specialReady ? 'PRONTO' : `${hud.chi}%`}
            </span>
          </button>
        </div>

        {/* Lower Primary Combat Diamond/Arc */}
        <div className="flex items-end gap-2 sm:gap-2.5">
          {/* Esquiva Sombria (Dash) */}
          <button
            type="button"
            onPointerDown={(e) => triggerAction(e, 'dash')}
            onPointerUp={releaseAction}
            onPointerCancel={releaseAction}
            aria-label="Esquiva Sombria"
            className={`touch-control-surface w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full backdrop-blur-md border-2 flex flex-col items-center justify-center leading-tight transition-transform ${
              hud.activeHazardWarning
                ? 'bg-sky-900/90 border-yellow-300 text-yellow-200 shadow-[0_0_18px_rgba(253,224,71,0.45)]'
                : 'bg-slate-950/72 border-indigo-400/45 text-indigo-100 shadow-lg'
            } ${pressedAction === 'dash' ? 'scale-90' : 'scale-100'}`}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 mb-0.5" fill="none" aria-hidden="true">
              <path d="M3 10H14M10 5L15 10L10 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display font-bold text-[9px]">ESQUIVA</span>
          </button>

          {/* Shuriken */}
          <button
            type="button"
            onPointerDown={(e) => triggerAction(e, 'shuriken')}
            onPointerUp={releaseAction}
            onPointerCancel={releaseAction}
            aria-label="Lançar Shuriken"
            className={`touch-control-surface relative w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-full bg-sky-950/80 backdrop-blur-md border-2 border-sky-400/65 text-sky-100 flex flex-col items-center justify-center leading-tight shadow-lg transition-transform ${
              pressedAction === 'shuriken' ? 'scale-90' : 'scale-100'
            }`}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 mb-0.5" fill="none" aria-hidden="true">
              <path d="M10 1.5L12.3 7.7L18.5 10L12.3 12.3L10 18.5L7.7 12.3L1.5 10L7.7 7.7L10 1.5Z" fill="#7DD3FC" />
              <circle cx="10" cy="10" r="2" fill="#0F172A" />
            </svg>
            <span className="font-display font-bold text-[9px]">KUNAI</span>
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-slate-950 border border-sky-400/70 text-[9px] font-mono-tabular font-bold text-yellow-300 flex items-center justify-center">
              {hud.shurikens}
            </span>
          </button>

          {/* Pular (Jump / Double Jump) */}
          <button
            type="button"
            onPointerDown={(e) => triggerAction(e, 'jump')}
            onPointerUp={releaseAction}
            onPointerCancel={releaseAction}
            aria-label="Pular"
            className={`touch-control-surface w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-full bg-emerald-950/78 backdrop-blur-md border-2 border-emerald-400/60 text-emerald-100 flex flex-col items-center justify-center leading-tight shadow-lg transition-transform -translate-y-2 ${
              pressedAction === 'jump' ? 'scale-90' : 'scale-100'
            }`}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 mb-0.5" fill="none" aria-hidden="true">
              <path d="M10 15V5M5 10L10 5L15 10" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display font-bold text-[9px]">PULAR</span>
          </button>

          {/* Primary Katana Slash Button (Largest, Bottom-Right) */}
          <button
            type="button"
            onPointerDown={(e) => triggerAction(e, 'attack')}
            onPointerUp={releaseAction}
            onPointerCancel={releaseAction}
            aria-label="Atacar com Katana"
            className={`touch-control-surface w-[68px] h-[68px] sm:w-[74px] sm:h-[74px] rounded-full bg-gradient-to-b from-rose-600/92 to-rose-800/95 backdrop-blur-md border-2 border-rose-300/80 text-white flex flex-col items-center justify-center leading-tight shadow-[0_8px_26px_rgba(225,29,72,0.5)] transition-transform ${
              pressedAction === 'attack' ? 'scale-90 brightness-125' : 'scale-100'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 mb-0.5" fill="none" aria-hidden="true">
              <path d="M4 20L19 5M19 5L21 7L7 21L4 20Z" fill="#FFFFFF" />
              <path d="M7 14L10 17" stroke="#FDE047" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <span className="font-display font-extrabold text-[10px] tracking-wider">KATANA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
