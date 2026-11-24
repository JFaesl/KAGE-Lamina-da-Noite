import { useEffect, useRef } from 'react';
import { BestiaryEntry } from '../game/bestiary';
import { getPixelAtlas, WalkableSpriteSet } from '../game/pixelSprites';

interface BestiarySpritePreviewProps {
  entry: BestiaryEntry;
  unlocked: boolean;
  loopMode: 'cycle' | 'attack';
}

export function BestiarySpritePreview({ entry, unlocked, loopMode }: BestiarySpritePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const atlas = getPixelAtlas();
    const spriteSet: WalkableSpriteSet = atlas[entry.type];
    let rafId = 0;
    const startTime = performance.now();

    const renderFrame = (now: number) => {
      const t = (now - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      // HD-2D dark dojo pedestal backdrop
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#050812');
      skyGrad.addColorStop(0.65, '#0B1222');
      skyGrad.addColorStop(1, '#121A2E');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Glowing atmospheric moon halo
      const moonGrad = ctx.createRadialGradient(w - 56, 48, 4, w - 56, 48, 52);
      moonGrad.addColorStop(0, unlocked ? `${entry.accentColor}44` : 'rgba(225,29,72,0.2)');
      moonGrad.addColorStop(0.45, 'rgba(225, 29, 72, 0.12)');
      moonGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = moonGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(251, 113, 133, 0.28)';
      ctx.beginPath();
      ctx.arc(w - 56, 48, 22, 0, Math.PI * 2);
      ctx.fill();

      // Floor pedestal with specular rim light
      const floorY = h - 52;
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
      floorGrad.addColorStop(0, '#1E293B');
      floorGrad.addColorStop(1, '#090E1A');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, floorY, w, h - floorY);

      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = unlocked ? entry.accentColor : '#475569';
      ctx.fillRect(0, floorY, w, 2);
      ctx.restore();

      const baseX = Math.round(w * 0.42);
      const baseY = h - 36;

      if (!unlocked) {
        // Locked silhouette preview (2x sharp)
        const sil = spriteSet.idle.flash;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 0.22;
        ctx.translate(baseX, baseY);
        ctx.scale(2, 2);
        ctx.drawImage(sil, -Math.round(sil.width / 2), -sil.height);
        ctx.restore();

        ctx.font = '700 28px "Outfit", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748B';
        ctx.fillText('???', baseX, baseY - 52);
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      // Compute animation timeline
      const period = loopMode === 'attack' ? 1.35 : 2.5;
      const phase = t % period;

      let sprite = spriteSet.idle.normal;
      let offsetX = 0;
      let offsetY = 0;
      let lean = 0;
      let isWindup = false;
      let isAttack = false;
      let atkProgress = 0;

      if (loopMode === 'attack') {
        if (phase < 0.35) {
          sprite = spriteSet.idle.normal;
        } else if (phase < 0.78) {
          sprite = spriteSet.windup.normal;
          isWindup = true;
          offsetX = -6;
        } else if (phase < 1.15) {
          sprite = spriteSet.atk.normal;
          isAttack = true;
          atkProgress = (phase - 0.78) / 0.37;
          offsetX = entry.previewKind === 'dash_slash' ? Math.round(atkProgress * 56) : 18;
          lean = entry.previewKind === 'dash_slash' ? 0.14 : 0.08;
        } else {
          sprite = spriteSet.idle.normal;
        }
      } else {
        if (phase < 0.45) {
          sprite = spriteSet.idle.normal;
        } else if (phase < 1.25) {
          const walkFrames = [spriteSet.walk1, spriteSet.walk2, spriteSet.walk3, spriteSet.idle];
          sprite = walkFrames[Math.floor((phase - 0.45) * 8) % 4].normal;
          offsetX = Math.round(Math.sin((phase - 0.45) * Math.PI) * 16);
        } else if (phase < 1.72) {
          sprite = spriteSet.windup.normal;
          isWindup = true;
          offsetX = -6;
        } else if (phase < 2.18) {
          sprite = spriteSet.atk.normal;
          isAttack = true;
          atkProgress = (phase - 1.72) / 0.46;
          offsetX = entry.previewKind === 'dash_slash' ? Math.round(atkProgress * 52) : 18;
          lean = entry.previewKind === 'dash_slash' ? 0.14 : 0.08;
        } else {
          sprite = spriteSet.idle.normal;
        }
      }

      if (entry.previewKind === 'slam' && isWindup) {
        offsetY = -Math.round(Math.sin(((phase % 0.45) / 0.45) * Math.PI) * 10);
      }

      // Smooth radial ground contact shadow
      const sx = baseX + offsetX;
      const sy = baseY + 2;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(1, 0.32);
      const shadowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
      shadowGrad.addColorStop(0, 'rgba(3, 6, 14, 0.78)');
      shadowGrad.addColorStop(1, 'rgba(3, 6, 14, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Windup telegraph
      if (isWindup) {
        if (entry.previewKind === 'slam') {
          ctx.save();
          ctx.fillStyle = 'rgba(225, 29, 72, 0.22)';
          ctx.beginPath();
          ctx.ellipse(baseX, baseY - 2, 72, 16, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FB7185';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        } else if (entry.previewKind === 'dash_slash') {
          ctx.save();
          const dashGrad = ctx.createLinearGradient(baseX + 20, 0, baseX + 104, 0);
          dashGrad.addColorStop(0, 'rgba(225, 29, 72, 0.85)');
          dashGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
          ctx.strokeStyle = dashGrad;
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(baseX + 20, baseY - 36);
          ctx.lineTo(baseX + 104, baseY - 36);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Dash afterimage (2x crisp)
      if (isAttack && entry.previewKind === 'dash_slash') {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = 0.35;
        ctx.translate(baseX, baseY + 4);
        ctx.scale(2, 2);
        ctx.drawImage(
          spriteSet.atk.flash,
          -Math.round(sprite.width / 2),
          -sprite.height
        );
        ctx.restore();
      }

      // Draw enemy sprite at 2x HD-2D crisp resolution
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(baseX + offsetX, baseY + offsetY + 4);
      if (lean !== 0) {
        ctx.transform(1, 0, -lean, 1, 0, 0);
      }
      ctx.scale(2, 2);
      ctx.drawImage(sprite, -Math.round(sprite.width / 2), -sprite.height);
      ctx.restore();

      // Windup overhead star glint
      if (isWindup) {
        const gx = baseX + offsetX;
        const gy = baseY + offsetY - sprite.height * 2 - 12;
        const glintColor = entry.category === 'Chefe' ? '#FB7185' : '#FBBF24';
        ctx.save();
        ctx.shadowColor = glintColor;
        ctx.shadowBlur = 12;
        ctx.fillStyle = glintColor;
        ctx.beginPath();
        ctx.moveTo(gx, gy - 9);
        ctx.lineTo(gx + 2.5, gy - 2.5);
        ctx.lineTo(gx + 9, gy);
        ctx.lineTo(gx + 2.5, gy + 2.5);
        ctx.lineTo(gx, gy + 9);
        ctx.lineTo(gx - 2.5, gy + 2.5);
        ctx.lineTo(gx - 9, gy);
        ctx.lineTo(gx - 2.5, gy - 2.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Attack VFX (tapered slash arc / kunai streak / glowing shockwave)
      if (isAttack) {
        if (entry.previewKind === 'kunai') {
          const kx = baseX + 36 + Math.round(atkProgress * 124);
          const ky = baseY - 68;
          const kGrad = ctx.createLinearGradient(kx - 28, ky, kx + 10, ky);
          kGrad.addColorStop(0, 'rgba(251, 113, 133, 0)');
          kGrad.addColorStop(0.7, '#FB7185');
          kGrad.addColorStop(1, '#FFFFFF');
          ctx.save();
          ctx.strokeStyle = kGrad;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(kx - 28, ky);
          ctx.lineTo(kx + 10, ky);
          ctx.stroke();
          ctx.restore();
        } else if (entry.previewKind === 'slam') {
          const r = 28 + atkProgress * 72;
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - atkProgress);
          ctx.shadowColor = entry.accentColor;
          ctx.shadowBlur = 14;
          ctx.strokeStyle = entry.accentColor;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(baseX + offsetX, baseY - 4, r, r * 0.34, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - atkProgress * 0.85);
          ctx.shadowColor = entry.accentColor;
          ctx.shadowBlur = 14;
          ctx.strokeStyle = entry.accentColor;
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(baseX + offsetX + 16, baseY - 64, 48, -1.0, 0.9);
          ctx.stroke();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [entry, unlocked, loopMode]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={224}
      className="w-full max-w-[260px] aspect-[320/224] rounded-lg border border-white/15 bg-[#050812] shadow-inner"
    />
  );
}
