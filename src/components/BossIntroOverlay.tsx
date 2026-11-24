interface BossIntroOverlayProps {
  bossIntro: {
    bossName: string;
    subtitle: string;
    accentHex: string;
  } | null;
}

export function BossIntroOverlay({ bossIntro }: BossIntroOverlayProps) {
  if (!bossIntro) return null;

  return (
    <div
      key={bossIntro.bossName}
      className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden animate-boss-backdrop bg-slate-950/72 backdrop-blur-[2px]"
      aria-live="assertive"
    >
      {/* Top Cinematic Letterbox Bar */}
      <div
        className="w-full h-10 md:h-14 bg-gradient-to-b from-black via-slate-950/95 to-slate-950/80 border-b"
        style={{ borderColor: `${bossIntro.accentHex}88` }}
      />

      {/* Center Lateral Slide-In Confrontation Strip */}
      <div className="relative flex flex-col items-center justify-center px-6">
        <div
          className="relative w-full max-w-4xl py-6 md:py-8 px-6 bg-slate-950/88 backdrop-blur-xl border-y shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden animate-boss-stripe"
          style={{ borderColor: `${bossIntro.accentHex}AA` }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background: `radial-gradient(ellipse at center, ${bossIntro.accentHex}55 0%, transparent 70%)`,
            }}
          />
          <div className="relative animate-boss-slide-left text-center mb-1.5">
            <span
              className="inline-block font-display font-bold text-[11px] md:text-xs tracking-[0.28em] uppercase"
              style={{ color: bossIntro.accentHex }}
            >
              DUELO DECISIVO · {bossIntro.subtitle}
            </span>
          </div>

          <div className="relative animate-boss-slide-right text-center">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-wide text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              {bossIntro.bossName}
            </h2>
          </div>
        </div>
      </div>

      {/* Bottom Cinematic Letterbox Bar */}
      <div
        className="w-full h-10 md:h-14 bg-gradient-to-t from-black via-slate-950/95 to-slate-950/80 border-t"
        style={{ borderColor: `${bossIntro.accentHex}88` }}
      />
    </div>
  );
}
