export type SpriteMap = Record<string, HTMLCanvasElement>;

export interface SpritePair {
  normal: HTMLCanvasElement;
  flash: HTMLCanvasElement;
  ghost?: HTMLCanvasElement;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pxDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}

function drawDisk(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.fillStyle = color;
  const ir = Math.max(1, Math.round(r));
  for (let dy = -ir; dy <= ir; dy++) {
    for (let dx = -ir; dx <= ir; dx++) {
      if (dx * dx + dy * dy <= r * r + 0.25) {
        ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1);
      }
    }
  }
}

function drawShadedLimb(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r0: number,
  r1: number,
  hi: string,
  base: string,
  dark: string
): void {
  const steps = Math.max(Math.round(Math.hypot(x1 - x0, y1 - y0) * 1.5), 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    const r = r0 + (r1 - r0) * t;
    drawDisk(ctx, x, y, r, dark);
    drawDisk(ctx, x - 0.5, y - 0.5, Math.max(0.8, r - 0.8), base);
    if (r >= 2.2) {
      drawDisk(ctx, x - 1, y - 1, Math.max(0.6, r * 0.45), hi);
    }
  }
}

function drawLinePixels(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  thickness = 1
): void {
  ctx.fillStyle = color;
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    ctx.fillRect(x, y, thickness, thickness);
  }
}

function finalizeSprite(src: HTMLCanvasElement, outlineColor = '#050711'): SpritePair {
  const w = src.width;
  const h = src.height;
  const sCtx = src.getContext('2d')!;
  const img = sCtx.getImageData(0, 0, w, h);
  const data = img.data;

  const [outCanvas, outCtx] = makeCanvas(w, h);
  const [flashCanvas, flashCtx] = makeCanvas(w, h);
  const [ghostCanvas, ghostCtx] = makeCanvas(w, h);

  const isOpaque = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return data[(y * w + x) * 4 + 3] > 20;
  };

  outCtx.fillStyle = outlineColor;
  flashCtx.fillStyle = '#FFFFFF';
  ghostCtx.fillStyle = '#38BDF8';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isOpaque(x, y)) continue;
      if (isOpaque(x - 1, y) || isOpaque(x + 1, y) || isOpaque(x, y - 1) || isOpaque(x, y + 1)) {
        outCtx.fillRect(x, y, 1, 1);
        flashCtx.fillRect(x, y, 1, 1);
        ghostCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  outCtx.drawImage(src, 0, 0);

  flashCtx.fillStyle = '#FFFFFF';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isOpaque(x, y)) {
        flashCtx.fillRect(x, y, 1, 1);
        ghostCtx.fillStyle = (x + y) % 2 === 0 ? '#0F172A' : '#1E3A8A';
        ghostCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  return { normal: outCanvas, flash: flashCanvas, ghost: ghostCanvas };
}

// ============================================================
// 1. JOE MUSASHI SHINOBI (Mega Drive 16-Bit Sprite Sheet)
// ============================================================
const GI = {
  hi: '#FFFDF5',
  base: '#ECE2C6',
  mid: '#C7B893',
  dark: '#857658',
  redHi: '#FB7185',
  red: '#C81E3A',
  redDark: '#7F1124',
  skinHi: '#F4CEB6',
  skin: '#DFAA8B',
  skinDark: '#9A6347',
  steelHi: '#FFFFFF',
  steel: '#CBD5E1',
  steelDark: '#64748B',
  gold: '#F59E0B',
  goldHi: '#FDE68A',
  navy: '#1E293B',
  navyDark: '#0F172A',
};

type PlayerPose =
  | 'idle'
  | 'run1'
  | 'run2'
  | 'run3'
  | 'run4'
  | 'run5'
  | 'run6'
  | 'jump'
  | 'fall'
  | 'throw'
  | 'atk1'
  | 'atk2'
  | 'atk3'
  | 'airKick'
  | 'cast'
  | 'hurt';

function drawShinobiLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  kneeX: number,
  kneeY: number,
  ankleX: number,
  ankleY: number,
  front: boolean
): void {
  const thighHi = front ? GI.hi : GI.base;
  const thighBase = front ? GI.base : GI.mid;
  const thighDark = front ? GI.mid : GI.dark;
  const shinHi = front ? GI.redHi : GI.red;
  const shinBase = front ? GI.red : GI.redDark;

  // Muscular gi trousers tapering to knee wrap
  drawShadedLimb(ctx, hipX, hipY, kneeX, kneeY, 4.7, 3.6, thighHi, thighBase, thighDark);
  // Cloth fold accent
  drawLinePixels(ctx, (hipX + kneeX) / 2 - 1, (hipY + kneeY) / 2, kneeX, kneeY, thighDark, 1);
  // Crimson suneate (shin guards) with laced strap lines
  drawShadedLimb(ctx, kneeX, kneeY, ankleX, ankleY, 3.3, 2.4, shinHi, shinBase, GI.redDark);
  const midShinX = Math.round((kneeX + ankleX) / 2);
  const midShinY = Math.round((kneeY + ankleY) / 2);
  rect(ctx, midShinX - 2, midShinY - 1, 5, 1, GI.redDark);
  // Dark tabi boot with steel toe-cap highlight
  rect(ctx, ankleX - 4, ankleY, 10, 5, GI.navyDark);
  rect(ctx, ankleX - 3, ankleY + 1, 8, 2, GI.navy);
  rect(ctx, ankleX + 1, ankleY + 1, 4, 1, GI.steelDark);
}

function drawShinobiHead(
  ctx: CanvasRenderingContext2D,
  hx: number,
  hy: number,
  wave: number,
  flowingScarf: boolean
): void {
  // Trailing crimson hachimaki tails behind hood
  if (flowingScarf) {
    drawLinePixels(ctx, hx - 5, hy + 5, hx - 21, hy + 2 + wave, GI.red, 3);
    drawLinePixels(ctx, hx - 6, hy + 6, hx - 19, hy + 6 + wave, GI.redDark, 2);
    pxDot(ctx, hx - 21, hy + 2 + wave, GI.redHi);
  } else {
    drawLinePixels(ctx, hx - 5, hy + 5, hx - 14, hy + 11, GI.red, 3);
    drawLinePixels(ctx, hx - 6, hy + 6, hx - 13, hy + 13, GI.redDark, 2);
  }

  // Sculpted ninja hood (zukin) with jawline & brow shadow
  drawDisk(ctx, hx, hy + 7, 7.0, GI.mid);
  drawDisk(ctx, hx + 0.5, hy + 6, 6.2, GI.base);
  rect(ctx, hx - 4, hy + 1, 9, 4, GI.hi);
  // Crimson headband (hachimaki)
  rect(ctx, hx - 6, hy + 3, 13, 3, GI.red);
  rect(ctx, hx - 3, hy + 3, 8, 1, GI.redHi);
  // Exposed tanned brow + piercing eyes
  rect(ctx, hx - 1, hy + 6, 9, 4, GI.skin);
  rect(ctx, hx - 1, hy + 6, 8, 1, GI.skinDark);
  pxDot(ctx, hx + 2, hy + 8, GI.navyDark);
  pxDot(ctx, hx + 3, hy + 8, GI.steelHi);
  pxDot(ctx, hx + 6, hy + 8, GI.navyDark);
  pxDot(ctx, hx + 7, hy + 8, GI.steelHi);
  // Lower face mask (fukumen) with crisp folds
  rect(ctx, hx - 4, hy + 10, 10, 5, GI.base);
  rect(ctx, hx - 4, hy + 13, 9, 2, GI.mid);
  drawLinePixels(ctx, hx - 1, hy + 11, hx + 4, hy + 13, GI.dark, 1);
}

function drawShinobiBase(pose: PlayerPose): SpritePair {
  const W = 92;
  const H = 80;
  const [c, ctx] = makeCanvas(W, H);
  const cx = 36;
  const isRun =
    pose === 'run1' ||
    pose === 'run2' ||
    pose === 'run3' ||
    pose === 'run4' ||
    pose === 'run5' ||
    pose === 'run6';

  const bob =
    pose === 'run1' || pose === 'run4'
      ? -2
      : pose === 'run2' || pose === 'run5'
        ? 0
        : pose === 'run3' || pose === 'run6'
          ? 2
          : 0;
  const crouch = pose === 'idle' || pose === 'atk1' || pose === 'atk3' || pose === 'throw' ? 2 : 0;
  const leanX = isRun ? 4 : pose === 'throw' || pose === 'atk3' ? 5 : pose === 'hurt' ? -5 : 0;

  const torsoX = cx + leanX;
  const torsoY = 23 + bob + crouch;
  const headX = torsoX + (isRun ? 3 : pose === 'hurt' ? -2 : 1);
  const headY = 6 + bob + crouch;

  // Angled Katana Scabbard (Saya) strapped across back (visible when blade is sheathed or idle/running)
  if (pose !== 'atk1' && pose !== 'atk2' && pose !== 'atk3') {
    drawLinePixels(ctx, torsoX - 15, headY + 4, torsoX + 10, torsoY + 18, GI.navyDark, 3);
    drawLinePixels(ctx, torsoX - 15, headY + 4, torsoX + 9, torsoY + 17, GI.navy, 2);
    rect(ctx, torsoX - 17, headY + 2, 4, 3, GI.gold);
    pxDot(ctx, torsoX - 16, headY + 2, GI.goldHi);
  }

  // Back arm (tucked in readiness or swinging opposite stride)
  if (pose === 'idle' || pose === 'jump' || pose === 'fall' || pose === 'cast') {
    drawShadedLimb(ctx, torsoX - 7, torsoY + 3, torsoX - 13, torsoY + 12, 3.2, 2.5, GI.base, GI.mid, GI.dark);
    drawShadedLimb(ctx, torsoX - 13, torsoY + 12, torsoX - 10, torsoY + 19, 2.6, 2.1, GI.redHi, GI.red, GI.redDark);
  } else if (isRun) {
    const armPhase = pose === 'run1' || pose === 'run2' || pose === 'run3' ? -1 : 1;
    drawShadedLimb(
      ctx,
      torsoX - 6,
      torsoY + 4,
      torsoX - 14 + armPhase * 5,
      torsoY + 12,
      3.1,
      2.4,
      GI.base,
      GI.mid,
      GI.dark
    );
    drawShadedLimb(
      ctx,
      torsoX - 14 + armPhase * 5,
      torsoY + 12,
      torsoX - 11 + armPhase * 7,
      torsoY + 17,
      2.5,
      2.0,
      GI.red,
      GI.redDark,
      GI.redDark
    );
  }

  // Legs: 6-frame run cycle + jump/fall/throw/airKick/atk3/hurt
  const hipY = torsoY + 18;
  if (pose === 'airKick') {
    // Classic Revenge of Shinobi diagonal flying ninja kick!
    drawShinobiLeg(ctx, torsoX - 4, hipY, torsoX - 13, hipY + 7, torsoX - 15, hipY + 15, false);
    drawShadedLimb(ctx, torsoX + 4, hipY, torsoX + 18, hipY + 7, 4.6, 3.6, GI.hi, GI.base, GI.mid);
    drawShadedLimb(ctx, torsoX + 18, hipY + 7, torsoX + 29, hipY + 11, 3.4, 2.6, GI.redHi, GI.red, GI.redDark);
    rect(ctx, torsoX + 29, hipY + 9, 9, 6, GI.navyDark);
    rect(ctx, torsoX + 34, hipY + 10, 4, 3, GI.steelHi);
  } else if (pose === 'jump') {
    drawShinobiLeg(ctx, torsoX - 4, hipY, torsoX - 14, hipY + 8, torsoX - 14, hipY + 19, false);
    drawShinobiLeg(ctx, torsoX + 4, hipY - 1, torsoX + 15, hipY + 5, torsoX + 11, hipY + 16, true);
  } else if (pose === 'fall') {
    drawShinobiLeg(ctx, torsoX - 4, hipY, torsoX - 11, hipY + 13, torsoX - 13, hipY + 25, false);
    drawShinobiLeg(ctx, torsoX + 4, hipY, torsoX + 11, hipY + 12, torsoX + 9, hipY + 23, true);
  } else if (pose === 'run1') {
    // Frame 1: Front leg high drive, back leg kicking back
    drawShinobiLeg(ctx, torsoX - 3, hipY, torsoX - 14, hipY + 11, torsoX - 24, hipY + 20, false);
    drawShinobiLeg(ctx, torsoX + 3, hipY, torsoX + 17, hipY + 8, torsoX + 15, hipY + 22, true);
  } else if (pose === 'run2') {
    // Frame 2: Front foot planting forward, back knee swinging under
    drawShinobiLeg(ctx, torsoX - 3, hipY, torsoX - 8, hipY + 13, torsoX - 16, hipY + 25, false);
    drawShinobiLeg(ctx, torsoX + 3, hipY, torsoX + 14, hipY + 12, torsoX + 13, hipY + 26, true);
  } else if (pose === 'run3') {
    // Frame 3: Passing contact mid-stride
    drawShinobiLeg(ctx, torsoX - 2, hipY, torsoX + 2, hipY + 13, torsoX - 2, hipY + 26, false);
    drawShinobiLeg(ctx, torsoX + 2, hipY, torsoX + 8, hipY + 11, torsoX + 3, hipY + 25, true);
  } else if (pose === 'run4') {
    // Frame 4: Opposite leg high drive, front leg pushing off behind
    drawShinobiLeg(ctx, torsoX + 2, hipY, torsoX - 12, hipY + 12, torsoX - 22, hipY + 21, true);
    drawShinobiLeg(ctx, torsoX - 2, hipY, torsoX + 16, hipY + 9, torsoX + 15, hipY + 23, false);
  } else if (pose === 'run5') {
    // Frame 5: Opposite foot planting forward
    drawShinobiLeg(ctx, torsoX + 2, hipY, torsoX - 7, hipY + 13, torsoX - 14, hipY + 25, true);
    drawShinobiLeg(ctx, torsoX - 2, hipY, torsoX + 13, hipY + 12, torsoX + 14, hipY + 26, false);
  } else if (pose === 'run6') {
    // Frame 6: Passing contact reverse
    drawShinobiLeg(ctx, torsoX - 2, hipY, torsoX - 6, hipY + 13, torsoX - 10, hipY + 26, false);
    drawShinobiLeg(ctx, torsoX + 2, hipY, torsoX + 6, hipY + 12, torsoX + 4, hipY + 26, true);
  } else if (pose === 'throw' || pose === 'atk3') {
    // Wide dynamic martial-arts forward lunge
    drawShinobiLeg(ctx, torsoX - 5, hipY, torsoX - 16, hipY + 12, torsoX - 21, hipY + 26, false);
    drawShinobiLeg(ctx, torsoX + 5, hipY, torsoX + 16, hipY + 11, torsoX + 16, hipY + 26, true);
  } else if (pose === 'hurt') {
    drawShinobiLeg(ctx, torsoX - 4, hipY, torsoX - 10, hipY + 13, torsoX - 11, hipY + 26, false);
    drawShinobiLeg(ctx, torsoX + 4, hipY, torsoX + 9, hipY + 13, torsoX + 11, hipY + 26, true);
  } else {
    // Grounded combat stance (idle / atk1 / atk2 / cast)
    drawShinobiLeg(ctx, torsoX - 5, hipY, torsoX - 14, hipY + 12, torsoX - 16, hipY + 26, false);
    drawShinobiLeg(ctx, torsoX + 4, hipY, torsoX + 13, hipY + 12, torsoX + 11, hipY + 26, true);
  }

  // Torso: Layered White Gi + Black/Navy Inner Collar + Crimson Belt (Obi)
  drawShadedLimb(ctx, torsoX, torsoY + 3, torsoX, torsoY + 18, 9.5, 7.2, GI.hi, GI.base, GI.mid);
  rect(ctx, torsoX - 9, torsoY + 3, 4, 14, GI.mid);
  // Crisp diagonal V-lapel & gi wrinkles
  drawLinePixels(ctx, torsoX + 2, torsoY + 2, torsoX - 2, torsoY + 14, GI.dark, 1);
  drawLinePixels(ctx, torsoX - 3, torsoY + 2, torsoX + 4, torsoY + 14, GI.mid, 1);
  drawLinePixels(ctx, torsoX - 6, torsoY + 11, torsoX + 2, torsoY + 16, GI.dark, 1);
  rect(ctx, torsoX - 1, torsoY + 1, 4, 6, GI.navyDark);
  pxDot(ctx, torsoX + 1, torsoY + 3, GI.navy);
  // Crimson shoulder/collar trim & belt with hanging obi tail
  rect(ctx, torsoX - 8, torsoY, 16, 3, GI.red);
  rect(ctx, torsoX - 5, torsoY, 11, 1, GI.redHi);
  rect(ctx, torsoX - 8, torsoY + 17, 16, 4, GI.red);
  rect(ctx, torsoX - 8, torsoY + 19, 16, 2, GI.redDark);
  drawLinePixels(ctx, torsoX + 1, torsoY + 20, torsoX - 2, torsoY + 26, GI.red, 2);

  // Head + Hachimaki
  const wave = pose === 'run2' || pose === 'run5' ? 3 : pose === 'run3' || pose === 'run6' ? -2 : 0;
  drawShinobiHead(ctx, headX, headY, wave, isRun || pose === 'jump' || pose === 'fall' || pose === 'airKick');

  // Front Arm & Weapon Poses
  if (pose === 'throw') {
    // Iconic Revenge of Shinobi straight-arm kunai/shuriken throw!
    drawShadedLimb(ctx, torsoX + 6, torsoY + 4, torsoX + 18, torsoY + 3, 3.6, 2.7, GI.hi, GI.base, GI.mid);
    drawShadedLimb(ctx, torsoX + 18, torsoY + 3, torsoX + 26, torsoY + 3, 2.7, 2.2, GI.redHi, GI.red, GI.redDark);
    drawDisk(ctx, torsoX + 28, torsoY + 3, 2.3, GI.skin);
    pxDot(ctx, torsoX + 30, torsoY + 2, GI.steelHi);
  } else if (pose === 'atk1') {
    // Horizontal Katana Cut
    drawShadedLimb(ctx, torsoX + 6, torsoY + 4, torsoX + 17, torsoY + 4, 3.6, 2.8, GI.hi, GI.base, GI.mid);
    drawShadedLimb(ctx, torsoX + 17, torsoY + 4, torsoX + 24, torsoY + 4, 2.8, 2.4, GI.redHi, GI.red, GI.redDark);
    drawDisk(ctx, torsoX + 26, torsoY + 4, 2.4, GI.skin);
    rect(ctx, torsoX + 28, torsoY + 1, 2, 7, GI.gold);
    rect(ctx, torsoX + 30, torsoY + 2, 38, 2, GI.steelHi);
    rect(ctx, torsoX + 30, torsoY + 4, 36, 1, GI.steel);
    rect(ctx, torsoX + 30, torsoY + 5, 34, 1, GI.steelDark);
    pxDot(ctx, torsoX + 68, torsoY + 2, GI.steelHi);
  } else if (pose === 'atk2') {
    // Upward Diagonal Katana Slash
    drawShadedLimb(ctx, torsoX + 5, torsoY + 4, torsoX + 15, torsoY - 1, 3.6, 2.8, GI.hi, GI.base, GI.mid);
    drawShadedLimb(ctx, torsoX + 15, torsoY - 1, torsoX + 21, torsoY - 4, 2.8, 2.4, GI.redHi, GI.red, GI.redDark);
    drawDisk(ctx, torsoX + 22, torsoY - 5, 2.3, GI.skin);
    rect(ctx, torsoX + 24, torsoY - 8, 2, 6, GI.gold);
    drawLinePixels(ctx, torsoX + 25, torsoY - 6, torsoX + 54, torsoY - 24, GI.steelHi, 2);
    drawLinePixels(ctx, torsoX + 26, torsoY - 5, torsoX + 53, torsoY - 22, GI.steel, 1);
  } else if (pose === 'atk3') {
    // Heavy Extended Finishing Thrust/Cleave
    drawShadedLimb(ctx, torsoX + 6, torsoY + 4, torsoX + 20, torsoY + 5, 3.7, 2.9, GI.hi, GI.base, GI.mid);
    drawShadedLimb(ctx, torsoX + 20, torsoY + 5, torsoX + 27, torsoY + 5, 2.8, 2.4, GI.redHi, GI.red, GI.redDark);
    drawDisk(ctx, torsoX + 29, torsoY + 5, 2.5, GI.skin);
    rect(ctx, torsoX + 31, torsoY + 2, 2, 7, GI.goldHi);
    rect(ctx, torsoX + 33, torsoY + 3, 42, 2, GI.steelHi);
    rect(ctx, torsoX + 33, torsoY + 5, 40, 2, '#FB7185');
  } else if (pose === 'cast') {
    // Iconic Kuji-Kiri Ninja Hand Seal Stance!
    drawShadedLimb(ctx, torsoX + 6, torsoY + 4, torsoX + 12, torsoY + 9, 3.4, 2.7, GI.hi, GI.base, GI.mid);
    drawShadedLimb(ctx, torsoX + 12, torsoY + 9, torsoX + 11, torsoY + 2, 2.6, 2.2, GI.redHi, GI.red, GI.redDark);
    drawDisk(ctx, torsoX + 11, torsoY - 1, 2.4, GI.skinHi);
    rect(ctx, torsoX + 10, torsoY - 7, 2, 6, GI.skinHi);
    pxDot(ctx, torsoX + 11, torsoY - 9, '#FEF08A');
  } else if (pose === 'hurt') {
    drawShadedLimb(ctx, torsoX + 5, torsoY + 4, torsoX + 12, torsoY - 2, 3.3, 2.5, GI.hi, GI.base, GI.mid);
    drawDisk(ctx, torsoX + 13, torsoY - 4, 2.2, GI.skin);
  } else if (isRun) {
    const swing = pose === 'run1' || pose === 'run2' || pose === 'run3' ? 1 : -1;
    drawShadedLimb(
      ctx,
      torsoX + 5,
      torsoY + 4,
      torsoX + 14 - swing * 3,
      torsoY + 8,
      3.5,
      2.7,
      GI.hi,
      GI.base,
      GI.mid
    );
    drawShadedLimb(
      ctx,
      torsoX + 14 - swing * 3,
      torsoY + 8,
      torsoX + 20 - swing * 3,
      torsoY + 10,
      2.7,
      2.2,
      GI.redHi,
      GI.red,
      GI.redDark
    );
    drawDisk(ctx, torsoX + 21 - swing * 3, torsoY + 10, 2.1, GI.skin);
  } else {
    // Ready guard forearm
    drawShadedLimb(ctx, torsoX + 5, torsoY + 4, torsoX + 15, torsoY + 5, 3.6, 2.8, GI.hi, GI.base, GI.mid);
    drawShadedLimb(ctx, torsoX + 15, torsoY + 5, torsoX + 22, torsoY + 5, 2.9, 2.3, GI.redHi, GI.red, GI.redDark);
    drawDisk(ctx, torsoX + 24, torsoY + 5, 2.2, GI.skin);
    pxDot(ctx, torsoX + 25, torsoY + 4, GI.skinHi);
  }

  return finalizeSprite(c);
}

function drawSomersaultFrame(phase: 1 | 2 | 3): SpritePair {
  // Real tucked Ninja body spinning in mid-air (Hassō-tobi), not a generic orb!
  const [c, ctx] = makeCanvas(48, 48);
  const cx = 24;
  const cy = 24;
  const ang = ((phase - 1) * Math.PI * 2) / 3;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);

  // Tucked white gi back + shoulders
  drawDisk(ctx, -2, -2, 10.5, GI.mid);
  drawDisk(ctx, -1, -3, 9.5, GI.base);
  drawDisk(ctx, 1, -5, 6.2, GI.hi);
  // Crimson belt wrap
  rect(ctx, -10, -1, 20, 4, GI.red);
  rect(ctx, -6, -1, 12, 1, GI.redHi);
  // Tucked knees & crimson shin guards
  drawDisk(ctx, 7, 5, 5.2, GI.base);
  drawShadedLimb(ctx, 7, 6, -3, 12, 3.4, 2.6, GI.redHi, GI.red, GI.redDark);
  rect(ctx, -8, 10, 8, 5, GI.navyDark);
  // Hooded head tucked forward
  drawDisk(ctx, 4, -10, 6.0, GI.base);
  rect(ctx, -1, -13, 10, 3, GI.red);
  rect(ctx, 3, -10, 5, 3, GI.skin);
  // Trailing crimson headband streak
  drawLinePixels(ctx, -4, -12, -16, -6, GI.redHi, 3);

  ctx.restore();
  return finalizeSprite(c);
}

// ============================================================
// 2. ENEMIES & BOSSES (4-Beat Walk + Windup + Attack + Hurt)
// ============================================================
type EnemyFrameMode = 'idle' | 'walk1' | 'walk2' | 'walk3' | 'windup' | 'atk' | 'hurt';

function drawScout(mode: EnemyFrameMode): SpritePair {
  const [c, ctx] = makeCanvas(72, 70);
  const cx = mode === 'hurt' ? 28 : 34;
  const hi = '#64748B';
  const mid = '#334155';
  const dark = '#1E293B';
  const cyan = '#38BDF8';
  const bob = mode === 'walk1' || mode === 'walk3' ? -2 : mode === 'walk2' ? 1 : 0;

  if (mode === 'walk1') {
    drawShadedLimb(ctx, cx - 3, 38 + bob, cx - 15, 55, 4.3, 2.9, mid, dark, '#0F172A');
    drawShadedLimb(ctx, cx + 3, 38 + bob, cx + 15, 54, 4.3, 2.9, hi, mid, dark);
    rect(ctx, cx - 20, 55, 9, 5, '#0F172A');
    rect(ctx, cx + 13, 54, 9, 5, '#0F172A');
  } else if (mode === 'walk2') {
    drawShadedLimb(ctx, cx - 2, 38 + bob, cx - 4, 57, 4.3, 2.9, mid, dark, '#0F172A');
    drawShadedLimb(ctx, cx + 2, 38 + bob, cx + 5, 56, 4.3, 2.9, hi, mid, dark);
    rect(ctx, cx - 7, 57, 9, 5, '#0F172A');
    rect(ctx, cx + 3, 56, 9, 5, '#0F172A');
  } else if (mode === 'walk3') {
    drawShadedLimb(ctx, cx + 2, 38 + bob, cx - 11, 55, 4.3, 2.9, hi, mid, dark);
    drawShadedLimb(ctx, cx - 2, 38 + bob, cx + 12, 55, 4.3, 2.9, mid, dark, '#0F172A');
    rect(ctx, cx - 14, 55, 9, 5, '#0F172A');
    rect(ctx, cx + 10, 55, 9, 5, '#0F172A');
  } else {
    drawShadedLimb(ctx, cx - 4, 38, cx - 10, 56, 4.3, 2.9, mid, dark, '#0F172A');
    drawShadedLimb(ctx, cx + 4, 38, cx + 10, 56, 4.3, 2.9, hi, mid, dark);
    rect(ctx, cx - 14, 57, 9, 5, '#0F172A');
    rect(ctx, cx + 7, 57, 9, 5, '#0F172A');
  }

  // Back katana hilt
  drawLinePixels(ctx, cx - 13, 8 + bob, cx + 6, 36 + bob, '#0F172A', 3);
  rect(ctx, cx - 15, 6 + bob, 4, 3, GI.steel);

  drawShadedLimb(ctx, cx, 22 + bob, cx, 36 + bob, 8.6, 6.6, hi, mid, dark);
  rect(ctx, cx - 7, 35 + bob, 14, 3, cyan);
  drawDisk(ctx, cx, 13 + bob, 6.4, mid);
  drawDisk(ctx, cx + 1, 12 + bob, 5.1, hi);
  rect(ctx, cx - 1, 11 + bob, 7, 3, cyan);

  if (mode === 'windup') {
    drawShadedLimb(ctx, cx - 4, 24, cx - 12, 16, 3.0, 2.2, hi, mid, dark);
    drawLinePixels(ctx, cx - 12, 16, cx - 4, 4, GI.steelHi, 2);
  } else if (mode === 'atk') {
    drawShadedLimb(ctx, cx + 6, 23, cx + 21, 24, 3.0, 2.3, hi, mid, dark);
    rect(ctx, cx + 22, 22, 24, 2, GI.steelHi);
    rect(ctx, cx + 22, 24, 22, 1, cyan);
  } else if (mode === 'hurt') {
    drawShadedLimb(ctx, cx + 5, 23, cx + 11, 14, 3.0, 2.2, hi, mid, dark);
  } else {
    drawShadedLimb(ctx, cx + 5, 23 + bob, cx + 16, 26 + bob, 3.0, 2.2, hi, mid, dark);
    rect(ctx, cx + 17, 25 + bob, 12, 2, GI.steelHi);
  }

  return finalizeSprite(c);
}

function drawRonin(mode: EnemyFrameMode): SpritePair {
  const [c, ctx] = makeCanvas(92, 84);
  const cx = mode === 'hurt' ? 32 : 38;
  const bob = mode === 'walk1' || mode === 'walk3' ? -1 : mode === 'walk2' ? 1 : 0;

  const armorHi = '#DC2626';
  const armor = '#991B1B';
  const armorDark = '#5C1111';
  const hakamaHi = '#F7F1DF';
  const hakama = '#DDD3B5';
  const hakamaDark = '#9C9074';
  const kabutoHi = '#475569';
  const kabuto = '#1E293B';

  if (mode === 'walk1') {
    drawShadedLimb(ctx, cx - 5, 43 + bob, cx - 17, 59, 6.0, 5.0, hakama, hakamaDark, '#6B6049');
    drawShadedLimb(ctx, cx - 17, 59, cx - 20, 71, 3.5, 2.6, armorHi, armor, armorDark);
    rect(ctx, cx - 23, 71, 10, 5, '#111827');
    drawShadedLimb(ctx, cx + 5, 43 + bob, cx + 16, 59, 6.2, 5.2, hakamaHi, hakama, hakamaDark);
    drawShadedLimb(ctx, cx + 16, 59, cx + 15, 72, 3.6, 2.7, armorHi, armor, armorDark);
    rect(ctx, cx + 13, 72, 11, 5, '#111827');
  } else if (mode === 'walk2') {
    drawShadedLimb(ctx, cx - 3, 43 + bob, cx - 7, 60, 6.0, 5.0, hakama, hakamaDark, '#6B6049');
    drawShadedLimb(ctx, cx - 7, 60, cx - 8, 72, 3.5, 2.6, armorHi, armor, armorDark);
    rect(ctx, cx - 11, 72, 10, 5, '#111827');
    drawShadedLimb(ctx, cx + 3, 43 + bob, cx + 7, 59, 6.2, 5.2, hakamaHi, hakama, hakamaDark);
    drawShadedLimb(ctx, cx + 7, 59, cx + 6, 71, 3.6, 2.7, armorHi, armor, armorDark);
    rect(ctx, cx + 4, 71, 11, 5, '#111827');
  } else if (mode === 'walk3') {
    drawShadedLimb(ctx, cx + 3, 43 + bob, cx - 14, 59, 6.2, 5.2, hakamaHi, hakama, hakamaDark);
    drawShadedLimb(ctx, cx - 14, 59, cx - 16, 72, 3.5, 2.6, armorHi, armor, armorDark);
    rect(ctx, cx - 19, 72, 10, 5, '#111827');
    drawShadedLimb(ctx, cx - 3, 43 + bob, cx + 14, 59, 6.0, 5.0, hakama, hakamaDark, '#6B6049');
    drawShadedLimb(ctx, cx + 14, 59, cx + 13, 71, 3.6, 2.7, armorHi, armor, armorDark);
    rect(ctx, cx + 11, 71, 11, 5, '#111827');
  } else {
    drawShadedLimb(ctx, cx - 5, 43, cx - 13, 60, 6.0, 5.0, hakama, hakamaDark, '#6B6049');
    drawShadedLimb(ctx, cx - 13, 60, cx - 15, 72, 3.5, 2.6, armorHi, armor, armorDark);
    rect(ctx, cx - 18, 72, 10, 5, '#111827');
    drawShadedLimb(ctx, cx + 5, 43, cx + 13, 60, 6.2, 5.2, hakamaHi, hakama, hakamaDark);
    drawLinePixels(ctx, cx + 9, 46, cx + 12, 58, hakamaDark, 1);
    drawShadedLimb(ctx, cx + 13, 60, cx + 12, 72, 3.6, 2.7, armorHi, armor, armorDark);
    rect(ctx, cx + 9, 72, 11, 5, '#111827');
  }

  rect(ctx, cx - 12, 38 + bob, 24, 8, armor);
  rect(ctx, cx - 11, 39 + bob, 6, 6, armorHi);
  rect(ctx, cx + 4, 39 + bob, 6, 6, armorHi);
  rect(ctx, cx - 12, 41 + bob, 24, 1, armorDark);
  rect(ctx, cx - 12, 44 + bob, 24, 1, GI.gold);

  drawShadedLimb(ctx, cx, 22 + bob, cx, 36 + bob, 10.2, 8.2, armorHi, armor, armorDark);
  rect(ctx, cx - 8, 24 + bob, 16, 2, kabuto);
  rect(ctx, cx - 8, 28 + bob, 16, 2, armorDark);
  rect(ctx, cx - 14, 19 + bob, 6, 9, armorHi);
  rect(ctx, cx + 8, 19 + bob, 6, 9, armorHi);
  rect(ctx, cx - 14, 22 + bob, 6, 1, armorDark);
  rect(ctx, cx + 8, 22 + bob, 6, 1, armorDark);

  drawDisk(ctx, cx, 13 + bob, 7.5, kabuto);
  drawDisk(ctx, cx - 1, 11 + bob, 5.5, kabutoHi);
  rect(ctx, cx - 11, 15 + bob, 22, 5, kabuto);
  rect(ctx, cx - 10, 16 + bob, 20, 2, kabutoHi);
  drawLinePixels(ctx, cx - 3, 6 + bob, cx - 8, 2 + bob, GI.gold, 2);
  drawLinePixels(ctx, cx + 3, 6 + bob, cx + 8, 2 + bob, GI.gold, 2);
  rect(ctx, cx - 2, 12 + bob, 8, 5, GI.skin);
  rect(ctx, cx, 14 + bob, 5, 3, '#0F172A');

  if (mode === 'windup') {
    // Raised overhead two-handed samurai telegraph!
    drawShadedLimb(ctx, cx + 5, 22, cx + 10, 9, 3.6, 2.8, armorHi, armor, armorDark);
    rect(ctx, cx + 8, 5, 3, 6, GI.gold);
    drawLinePixels(ctx, cx + 9, 5, cx - 8, -1, GI.steelHi, 2);
  } else if (mode === 'atk') {
    drawShadedLimb(ctx, cx + 7, 23, cx + 22, 24, 3.6, 2.8, armorHi, armor, armorDark);
    drawDisk(ctx, cx + 24, 24, 2.4, GI.skin);
    rect(ctx, cx + 26, 21, 2, 7, GI.gold);
    rect(ctx, cx + 28, 22, 42, 2, GI.steelHi);
    rect(ctx, cx + 28, 24, 40, 1, GI.steel);
  } else if (mode === 'hurt') {
    drawShadedLimb(ctx, cx + 6, 24, cx + 13, 15, 3.5, 2.7, armorHi, armor, armorDark);
  } else {
    drawShadedLimb(ctx, cx + 6, 24 + bob, cx + 16, 28 + bob, 3.6, 2.8, armorHi, armor, armorDark);
    drawDisk(ctx, cx + 17, 28 + bob, 2.5, GI.skin);
    rect(ctx, cx + 17, 24 + bob, 3, 6, GI.gold);
    drawLinePixels(ctx, cx + 18, 24 + bob, cx + 24, 3 + bob, GI.steelHi, 2);
    drawLinePixels(ctx, cx + 19, 24 + bob, cx + 25, 4 + bob, GI.steel, 1);
  }

  return finalizeSprite(c);
}

function drawKunoichi(mode: EnemyFrameMode): SpritePair {
  const [c, ctx] = makeCanvas(68, 68);
  const cx = mode === 'hurt' ? 26 : 32;
  const hi = '#9333EA';
  const mid = '#581C87';
  const dark = '#3B0764';
  const mag = '#E879F9';
  const bob = mode === 'walk1' || mode === 'walk3' ? -2 : mode === 'walk2' ? 1 : 0;

  if (mode === 'walk1') {
    drawShadedLimb(ctx, cx - 3, 38 + bob, cx - 14, 55, 3.8, 2.6, mid, dark, '#1E0538');
    drawShadedLimb(ctx, cx + 3, 38 + bob, cx + 14, 55, 3.8, 2.6, hi, mid, dark);
    rect(ctx, cx - 16, 56, 7, 4, '#0F172A');
    rect(ctx, cx + 11, 56, 7, 4, '#0F172A');
  } else if (mode === 'walk2') {
    drawShadedLimb(ctx, cx - 2, 38 + bob, cx - 5, 57, 3.8, 2.6, mid, dark, '#1E0538');
    drawShadedLimb(ctx, cx + 2, 38 + bob, cx + 6, 56, 3.8, 2.6, hi, mid, dark);
    rect(ctx, cx - 7, 57, 7, 4, '#0F172A');
    rect(ctx, cx + 4, 56, 7, 4, '#0F172A');
  } else if (mode === 'walk3') {
    drawShadedLimb(ctx, cx + 2, 38 + bob, cx - 11, 55, 3.8, 2.6, hi, mid, dark);
    drawShadedLimb(ctx, cx - 2, 38 + bob, cx + 12, 56, 3.8, 2.6, mid, dark, '#1E0538');
    rect(ctx, cx - 14, 56, 7, 4, '#0F172A');
    rect(ctx, cx + 10, 56, 7, 4, '#0F172A');
  } else {
    drawShadedLimb(ctx, cx - 3, 38, cx - 10, 56, 3.8, 2.6, mid, dark, '#1E0538');
    drawShadedLimb(ctx, cx + 3, 38, cx + 10, 56, 3.8, 2.6, hi, mid, dark);
    rect(ctx, cx - 12, 50, 5, 7, mag);
    rect(ctx, cx + 8, 50, 5, 7, mag);
    rect(ctx, cx - 13, 57, 7, 4, '#0F172A');
    rect(ctx, cx + 7, 57, 7, 4, '#0F172A');
  }

  drawShadedLimb(ctx, cx, 21 + bob, cx, 36 + bob, 7.2, 5.5, hi, mid, dark);
  rect(ctx, cx - 6, 34 + bob, 12, 3, mag);
  drawLinePixels(ctx, cx - 5, 11 + bob, cx - 20, 17 + bob, mag, 3);
  drawDisk(ctx, cx, 12 + bob, 5.8, mid);
  drawDisk(ctx, cx + 1, 11 + bob, 4.5, hi);
  rect(ctx, cx, 11 + bob, 6, 3, '#FBCFE8');

  if (mode === 'windup') {
    drawShadedLimb(ctx, cx - 3, 22, cx - 12, 16, 2.8, 2.1, hi, mid, dark);
    pxDot(ctx, cx - 14, 15, GI.steelHi);
  } else if (mode === 'atk') {
    drawShadedLimb(ctx, cx + 4, 22, cx + 20, 22, 2.8, 2.1, hi, mid, dark);
    rect(ctx, cx + 21, 21, 11, 2, '#FB7185');
  } else if (mode === 'hurt') {
    drawShadedLimb(ctx, cx + 4, 22, cx + 10, 13, 2.8, 2.1, hi, mid, dark);
  } else {
    drawShadedLimb(ctx, cx + 4, 22 + bob, cx + 14, 24 + bob, 2.8, 2.1, hi, mid, dark);
    rect(ctx, cx + 16, 23 + bob, 9, 2, GI.steelHi);
  }

  return finalizeSprite(c);
}

function drawOni(mode: EnemyFrameMode): SpritePair {
  const [c, ctx] = makeCanvas(94, 90);
  const cx = mode === 'hurt' ? 36 : 42;
  const bob = mode === 'walk1' || mode === 'walk3' ? -1 : mode === 'walk2' ? 1 : 0;
  const skinHi = '#EF4444';
  const skin = '#B91C1C';
  const skinDark = '#7F1D1D';
  const ironHi = '#64748B';
  const iron = '#334155';
  const ironDark = '#1E293B';

  if (mode === 'walk1') {
    drawShadedLimb(ctx, cx - 8, 50 + bob, cx - 18, 67, 7.0, 5.5, skin, skinDark, skinDark);
    drawShadedLimb(ctx, cx + 8, 50 + bob, cx + 18, 66, 7.0, 5.5, skinHi, skin, skinDark);
    rect(ctx, cx - 23, 67, 12, 10, iron);
    rect(ctx, cx + 12, 66, 12, 10, ironHi);
    rect(ctx, cx - 24, 76, 13, 5, '#0F172A');
    rect(ctx, cx + 12, 75, 13, 5, '#0F172A');
  } else if (mode === 'walk2') {
    drawShadedLimb(ctx, cx - 6, 50 + bob, cx - 10, 68, 7.0, 5.5, skin, skinDark, skinDark);
    drawShadedLimb(ctx, cx + 6, 50 + bob, cx + 10, 68, 7.0, 5.5, skinHi, skin, skinDark);
    rect(ctx, cx - 15, 68, 12, 10, iron);
    rect(ctx, cx + 4, 68, 12, 10, ironHi);
    rect(ctx, cx - 16, 77, 13, 5, '#0F172A');
    rect(ctx, cx + 4, 77, 13, 5, '#0F172A');
  } else if (mode === 'walk3') {
    drawShadedLimb(ctx, cx + 6, 50 + bob, cx - 16, 67, 7.0, 5.5, skinHi, skin, skinDark);
    drawShadedLimb(ctx, cx - 6, 50 + bob, cx + 16, 67, 7.0, 5.5, skin, skinDark, skinDark);
    rect(ctx, cx - 20, 67, 12, 10, ironHi);
    rect(ctx, cx + 10, 67, 12, 10, iron);
    rect(ctx, cx - 21, 76, 13, 5, '#0F172A');
    rect(ctx, cx + 10, 76, 13, 5, '#0F172A');
  } else {
    drawShadedLimb(ctx, cx - 8, 50, cx - 14, 68, 7.0, 5.5, skin, skinDark, skinDark);
    drawShadedLimb(ctx, cx + 8, 50, cx + 14, 68, 7.0, 5.5, skinHi, skin, skinDark);
    rect(ctx, cx - 19, 68, 12, 10, iron);
    rect(ctx, cx + 8, 68, 12, 10, ironHi);
    rect(ctx, cx - 20, 77, 13, 5, '#0F172A');
    rect(ctx, cx + 8, 77, 13, 5, '#0F172A');
  }

  drawShadedLimb(ctx, cx, 24 + bob, cx, 46 + bob, 15.0, 12.5, ironHi, iron, ironDark);
  rect(ctx, cx - 12, 26 + bob, 24, 15, skin);
  rect(ctx, cx - 8, 28 + bob, 16, 9, skinHi);
  rect(ctx, cx - 14, 45 + bob, 28, 5, GI.gold);

  drawDisk(ctx, cx, 14 + bob, 9.0, skin);
  drawDisk(ctx, cx + 1, 12 + bob, 7.0, skinHi);
  drawLinePixels(ctx, cx - 7, 9 + bob, cx - 14, 1 + bob, GI.gold, 3);
  drawLinePixels(ctx, cx + 7, 9 + bob, cx + 14, 1 + bob, GI.gold, 3);
  rect(ctx, cx - 4, 13 + bob, 4, 3, '#FEF08A');
  rect(ctx, cx + 3, 13 + bob, 4, 3, '#FEF08A');

  if (mode === 'windup') {
    drawShadedLimb(ctx, cx + 12, 24, cx + 22, 12, 5.5, 4.2, skinHi, skin, skinDark);
    drawLinePixels(ctx, cx + 22, 12, cx + 34, 2, ironHi, 7);
  } else if (mode === 'atk') {
    drawShadedLimb(ctx, cx + 12, 26, cx + 24, 48, 5.5, 4.2, skinHi, skin, skinDark);
    drawLinePixels(ctx, cx + 24, 48, cx + 42, 74, ironHi, 8);
  } else if (mode === 'hurt') {
    drawShadedLimb(ctx, cx + 12, 25, cx + 18, 17, 5.4, 4.1, skinHi, skin, skinDark);
  } else {
    drawShadedLimb(ctx, cx + 12, 25 + bob, cx + 22, 42 + bob, 5.5, 4.2, skinHi, skin, skinDark);
    drawLinePixels(ctx, cx + 22, 42 + bob, cx + 36, 66 + bob, ironHi, 7);
  }

  return finalizeSprite(c);
}

function drawCivilian(rescued: boolean): SpritePair {
  const [c, ctx] = makeCanvas(64, 64);
  const cx = 32;
  const kimonoDark = '#115E59';
  const kimono = '#0D9488';
  const kimonoHi = '#5EEAD4';
  const sash = '#FBBF24';

  if (rescued) {
    // Standing grateful villager waving hands up
    rect(ctx, cx - 7, 46, 5, 11, '#1E293B');
    rect(ctx, cx + 2, 46, 5, 11, '#1E293B');
    rect(ctx, cx - 8, 56, 6, 3, '#D97706');
    rect(ctx, cx + 2, 56, 6, 3, '#D97706');

    drawShadedLimb(ctx, cx, 24, cx, 46, 8.5, 9.5, kimonoHi, kimono, kimonoDark);
    rect(ctx, cx - 8, 35, 16, 4, sash);

    // Raised celebratory arms
    drawShadedLimb(ctx, cx - 8, 26, cx - 15, 14, 3.2, 2.6, kimonoHi, kimono, kimonoDark);
    drawShadedLimb(ctx, cx + 8, 26, cx + 15, 14, 3.2, 2.6, kimonoHi, kimono, kimonoDark);
    drawDisk(ctx, cx - 16, 13, 2.4, GI.skinHi);
    drawDisk(ctx, cx + 16, 13, 2.4, GI.skinHi);

    // Head + hair bun
    drawDisk(ctx, cx, 14, 6.2, GI.skin);
    drawDisk(ctx, cx + 1, 13, 4.6, GI.skinHi);
    drawDisk(ctx, cx, 10, 6.4, '#0F172A');
    drawDisk(ctx, cx - 1, 5, 3.0, '#1E293B');
    rect(ctx, cx - 3, 14, 2, 2, '#0F172A');
    rect(ctx, cx + 2, 14, 2, 2, '#0F172A');
  } else {
    // Kneeling captive hostage with bound hands and rope
    rect(ctx, cx - 10, 48, 20, 8, kimonoDark);
    rect(ctx, cx - 8, 49, 16, 5, kimono);
    drawShadedLimb(ctx, cx, 32, cx, 49, 8.5, 9.5, kimonoHi, kimono, kimonoDark);
    rect(ctx, cx - 8, 40, 16, 4, sash);

    // Bound arms in front + golden rope
    drawShadedLimb(ctx, cx - 8, 34, cx - 2, 42, 3.2, 2.8, kimonoHi, kimono, kimonoDark);
    drawShadedLimb(ctx, cx + 8, 34, cx + 2, 42, 3.2, 2.8, kimonoHi, kimono, kimonoDark);
    rect(ctx, cx - 5, 41, 10, 3, '#FDE047');
    rect(ctx, cx - 4, 42, 8, 1, '#92400E');

    // Head looking nervously
    drawDisk(ctx, cx, 22, 6.2, GI.skin);
    drawDisk(ctx, cx + 1, 21, 4.6, GI.skinHi);
    drawDisk(ctx, cx, 18, 6.4, '#0F172A');
    drawDisk(ctx, cx - 1, 13, 2.8, '#1E293B');
    rect(ctx, cx - 3, 22, 2, 2, '#0F172A');
    rect(ctx, cx + 2, 22, 2, 2, '#0F172A');
  }

  return finalizeSprite(c);
}

function drawBoss(
  primaryDark: string,
  primary: string,
  primaryHi: string,
  trim: string,
  cape: string,
  blade: string,
  mode: EnemyFrameMode
): SpritePair {
  const [c, ctx] = makeCanvas(102, 90);
  const cx = mode === 'hurt' ? 36 : 42;
  const bob = mode === 'walk1' || mode === 'walk3' ? -1 : mode === 'walk2' ? 1 : 0;

  drawLinePixels(ctx, cx - 8, 23 + bob, cx - 30 - (mode === 'walk1' ? 4 : 0), 66 + bob, cape, 8);
  drawLinePixels(ctx, cx - 5, 25 + bob, cx - 18, 68 + bob, primaryDark, 5);

  if (mode === 'walk1') {
    drawShadedLimb(ctx, cx - 6, 46 + bob, cx - 20, 63, 6.2, 4.8, primary, primaryDark, '#0F172A');
    rect(ctx, cx - 24, 63, 9, 11, primaryHi);
    rect(ctx, cx - 25, 74, 11, 5, '#0F172A');
    drawShadedLimb(ctx, cx + 6, 46 + bob, cx + 19, 63, 6.4, 5.0, primaryHi, primary, primaryDark);
    rect(ctx, cx + 15, 63, 9, 11, trim);
    rect(ctx, cx + 14, 74, 12, 5, '#0F172A');
  } else if (mode === 'walk2') {
    drawShadedLimb(ctx, cx - 4, 46 + bob, cx - 9, 64, 6.2, 4.8, primary, primaryDark, '#0F172A');
    rect(ctx, cx - 13, 64, 9, 11, primaryHi);
    rect(ctx, cx - 14, 75, 11, 5, '#0F172A');
    drawShadedLimb(ctx, cx + 4, 46 + bob, cx + 9, 64, 6.4, 5.0, primaryHi, primary, primaryDark);
    rect(ctx, cx + 5, 64, 9, 11, trim);
    rect(ctx, cx + 4, 75, 12, 5, '#0F172A');
  } else if (mode === 'walk3') {
    drawShadedLimb(ctx, cx + 4, 46 + bob, cx - 17, 63, 6.4, 5.0, primaryHi, primary, primaryDark);
    rect(ctx, cx - 21, 63, 9, 11, trim);
    rect(ctx, cx - 22, 74, 11, 5, '#0F172A');
    drawShadedLimb(ctx, cx - 4, 46 + bob, cx + 17, 63, 6.2, 4.8, primary, primaryDark, '#0F172A');
    rect(ctx, cx + 13, 63, 9, 11, primaryHi);
    rect(ctx, cx + 12, 74, 12, 5, '#0F172A');
  } else {
    drawShadedLimb(ctx, cx - 6, 46, cx - 16, 64, 6.2, 4.8, primary, primaryDark, '#0F172A');
    rect(ctx, cx - 20, 64, 9, 11, primaryHi);
    rect(ctx, cx - 21, 75, 11, 5, '#0F172A');
    drawShadedLimb(ctx, cx + 6, 46, cx + 15, 64, 6.4, 5.0, primaryHi, primary, primaryDark);
    rect(ctx, cx + 11, 64, 9, 11, trim);
    rect(ctx, cx + 10, 75, 12, 5, '#0F172A');
  }

  drawShadedLimb(ctx, cx, 23 + bob, cx, 44 + bob, 12.5, 9.5, primaryHi, primary, primaryDark);
  rect(ctx, cx - 11, 41 + bob, 22, 4, trim);
  rect(ctx, cx - 16, 20 + bob, 7, 10, trim);
  rect(ctx, cx + 9, 20 + bob, 7, 10, trim);

  drawDisk(ctx, cx, 14 + bob, 8.2, '#0F172A');
  rect(ctx, cx - 13, 16 + bob, 26, 5, primaryHi);
  drawLinePixels(ctx, cx - 3, 7 + bob, cx - 12, 1 + bob, trim, 3);
  drawLinePixels(ctx, cx + 3, 7 + bob, cx + 12, 1 + bob, trim, 3);
  rect(ctx, cx - 2, 12 + bob, 9, 3, cape);

  if (mode === 'windup') {
    drawShadedLimb(ctx, cx + 7, 22, cx + 14, 8, 4.2, 3.2, primaryHi, primary, primaryDark);
    rect(ctx, cx + 12, 4, 4, 6, trim);
    drawLinePixels(ctx, cx + 13, 4, cx - 10, 0, blade, 3);
  } else if (mode === 'atk') {
    drawShadedLimb(ctx, cx + 9, 24, cx + 25, 25, 4.2, 3.2, primaryHi, primary, primaryDark);
    rect(ctx, cx + 26, 21, 3, 8, trim);
    rect(ctx, cx + 29, 23, 48, 3, blade);
    rect(ctx, cx + 29, 24, 46, 1, '#FFFFFF');
  } else if (mode === 'hurt') {
    drawShadedLimb(ctx, cx + 8, 24, cx + 14, 15, 4.2, 3.2, primaryHi, primary, primaryDark);
  } else {
    drawShadedLimb(ctx, cx + 8, 25 + bob, cx + 19, 30 + bob, 4.2, 3.2, primaryHi, primary, primaryDark);
    rect(ctx, cx + 20, 26 + bob, 3, 7, trim);
    drawLinePixels(ctx, cx + 21, 26 + bob, cx + 44, 7 + bob, blade, 3);
  }

  return finalizeSprite(c);
}

// ============================================================
// 3. PROPS, PICKUPS, SHURIKENS & FIRE DRAGON
// ============================================================
type Palette = Record<string, string>;

function compileSprite(rows: string[], palette: Palette, whiteFlash = false): HTMLCanvasElement {
  const height = rows.length;
  const width = rows[0]?.length ?? 1;
  const [canvas, ctx] = makeCanvas(width, height);
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = whiteFlash ? '#FFFFFF' : palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

function buildPair(rows: string[], palette: Palette): SpritePair {
  return {
    normal: compileSprite(rows, palette, false),
    flash: compileSprite(rows, palette, true),
  };
}

const PROP_PALETTE: Palette = {
  o: '#050711',
  b: '#78350F',
  B: '#B45309',
  l: '#D97706',
  s: '#334155',
  S: '#64748B',
  y: '#FBBF24',
  Y: '#FEF08A',
  r: '#E11D48',
  O: '#F97316',
  w: '#F8FAFC',
  g: '#10B981',
  c: '#38BDF8',
  C: '#E0F2FE',
};

const CRATE_ROWS = [
  'oooooooooooooooooooooooo',
  'oSSBBBBBBBBBBBBBBBBBBSSo',
  'oBllllllllllllllllllllBo',
  'oBllooollllllllllooollBo',
  'oBlllooollllllllooolllBo',
  'oBllllooollllllooollllBo',
  'oBlllllooollllooolllllBo',
  'oBlllllloooolooollllllBo',
  'oBlllllloooolooollllllBo',
  'oBlllllooollllooolllllBo',
  'oBllllooollllllooollllBo',
  'oBlllooollllllllooolllBo',
  'oBllooollllllllllooollBo',
  'oBllllllllllllllllllllBo',
  'oSSBBBBBBBBBBBBBBBBBBSSo',
  'oooooooooooooooooooooooo',
];

const LANTERN_PROP_ROWS = [
  '.....oooooooooo.....',
  '...ooSSSSSSSSSSoo...',
  '.ooSSSSSSSSSSSSSSoo.',
  '...oooooyYYYyoool...',
  '....ooyYYYYYYyoo....',
  '....ooyYYYYYYyoo....',
  '....ooyYYYYYYyoo....',
  '....ooooyyyyoooo....',
  '......oosSSsoo......',
  '......oossssoo......',
  '......oossssoo......',
  '.....ooosSSsooo.....',
  '....oooooooooooo....',
];

const BRAZIER_PROP_ROWS = [
  '.....o........o.....',
  '....oro......oro....',
  '...oryro....oryro...',
  '..oryYYro..oryYYro..',
  '..oSSSSSSooSSSSSSo..',
  '.oSSSSSSSSSSSSSSSSo.',
  '.osssssssssssssssso.',
  '..ooossssssssssooo..',
  '.....osSssssSso.....',
  '.....osssssssso.....',
  '....oosSssssSsoo....',
  '....oooooooooooo....',
];

const ONIGIRI_ROWS = [
  '......oooooo......',
  '.....owwwwwwo.....',
  '....owwwwwwwwo....',
  '...owwwwwwwwwwo...',
  '..owwwwwwwwwwwwo..',
  '.owwwSSSSSSSSwwwo.',
  '.owwwSSSSSSSSwwwo.',
  '.oooooooooooooooo.',
];

const SCROLL_ROWS = [
  '..oooooooooooooo..',
  '.obccCCCCCCCCccbo.',
  '.obccCCCCCCCCccbo.',
  '.obccCCCCCCCCccbo.',
  '.obccccccccccccbo.',
  '..oooooooooooooo..',
];

const JADE_ROWS = [
  '.....oooooo.....',
  '....ogGGGGgo....',
  '...ogGGGGGGgo...',
  '...ogGGGGGGgo...',
  '....oggggggo....',
  '.....oooooo.....',
];

const JADE_PALETTE: Palette = {
  ...PROP_PALETTE,
  g: '#059669',
  G: '#34D399',
};

const SHURIKEN_PACK_ROWS = [
  '..oooooooooooooo..',
  '.owwwSSSSSSSSwwwo.',
  '.owSSwwwwwwwwSSwo.',
  '.owwwSSSSSSSSwwwo.',
  '..oooooooooooooo..',
];

const SHURIKEN_ROWS = [
  '.....oo.....',
  '....owwo....',
  '....oSSo....',
  '..oowSSwoo..',
  '.owwSssSwwo.',
  'owwSswwsSwwo',
  'owwSswwsSwwo',
  '.owwSssSwwo.',
  '..oowSSwoo..',
  '....oSSo....',
  '....owwo....',
  '.....oo.....',
];

const FIRE_DRAGON_ROWS = [
  '...............ooooooo..........',
  '...........oorrrYYYYYYrooo......',
  '.......oorrrrOOOOYYYYYYYYYo.....',
  '....oorrrrOOOOYYYYYYYwwwwYYYo...',
  '..oorrOOOOYYYYYYYYYoowwwwYYYYo..',
  '.orOOOOOYYYYYYYYYYYooYYYYYYYYYo.',
  'orOOOOOYYYYYYYYYYYYYYYYYYYYYYo..',
  '.orOOOOOOYYYYYYYYYYOOOOOOOOOo...',
  '...oorrrrOOOOOOOOOOOOOOOOOo.....',
  '.....oorrrrrrrrrrrrrrrrrro......',
  '........ooooooooooooooooo.......',
];

export interface WalkableSpriteSet {
  idle: SpritePair;
  walk1: SpritePair;
  walk2: SpritePair;
  walk3: SpritePair;
  windup: SpritePair;
  atk: SpritePair;
  hurt: SpritePair;
}

export interface PixelSpriteAtlas {
  player: {
    idle: SpritePair;
    run1: SpritePair;
    run2: SpritePair;
    run3: SpritePair;
    run4: SpritePair;
    run5: SpritePair;
    run6: SpritePair;
    jump: SpritePair;
    fall: SpritePair;
    throw: SpritePair;
    atk1: SpritePair;
    atk2: SpritePair;
    atk3: SpritePair;
    airKick: SpritePair;
    cast: SpritePair;
    hurt: SpritePair;
    somersault1: SpritePair;
    somersault2: SpritePair;
    somersault3: SpritePair;
  };
  scout: WalkableSpriteSet;
  ronin: WalkableSpriteSet;
  kunoichi: WalkableSpriteSet;
  oni: WalkableSpriteSet;
  boss_kagerou: WalkableSpriteSet;
  boss_hotaru: WalkableSpriteSet;
  boss_raiden: WalkableSpriteSet;
  boss_kurogane: WalkableSpriteSet;
  boss_umigame: WalkableSpriteSet;
  boss_tetsujin: WalkableSpriteSet;
  boss_yuki: WalkableSpriteSet;
  boss_enma: WalkableSpriteSet;
  boss_tetsuo: WalkableSpriteSet;
  boss_akuma: WalkableSpriteSet;
  props: {
    wooden_crate: SpritePair;
    stone_lantern: SpritePair;
    fire_brazier: SpritePair;
  };
  civilian: {
    captive: SpritePair;
    rescued: SpritePair;
  };
  pickups: {
    onigiri: HTMLCanvasElement;
    chi_scroll: HTMLCanvasElement;
    jade: HTMLCanvasElement;
    shuriken_pack: HTMLCanvasElement;
  };
  shuriken: HTMLCanvasElement;
  fire_dragon: HTMLCanvasElement;
}

function buildEnemySet(builder: (mode: EnemyFrameMode) => SpritePair): WalkableSpriteSet {
  return {
    idle: builder('idle'),
    walk1: builder('walk1'),
    walk2: builder('walk2'),
    walk3: builder('walk3'),
    windup: builder('windup'),
    atk: builder('atk'),
    hurt: builder('hurt'),
  };
}

let cachedAtlas: PixelSpriteAtlas | null = null;

export function getPixelAtlas(): PixelSpriteAtlas {
  if (cachedAtlas) return cachedAtlas;
  cachedAtlas = {
    player: {
      idle: drawShinobiBase('idle'),
      run1: drawShinobiBase('run1'),
      run2: drawShinobiBase('run2'),
      run3: drawShinobiBase('run3'),
      run4: drawShinobiBase('run4'),
      run5: drawShinobiBase('run5'),
      run6: drawShinobiBase('run6'),
      jump: drawShinobiBase('jump'),
      fall: drawShinobiBase('fall'),
      throw: drawShinobiBase('throw'),
      atk1: drawShinobiBase('atk1'),
      atk2: drawShinobiBase('atk2'),
      atk3: drawShinobiBase('atk3'),
      airKick: drawShinobiBase('airKick'),
      cast: drawShinobiBase('cast'),
      hurt: drawShinobiBase('hurt'),
      somersault1: drawSomersaultFrame(1),
      somersault2: drawSomersaultFrame(2),
      somersault3: drawSomersaultFrame(3),
    },
    scout: buildEnemySet(drawScout),
    ronin: buildEnemySet(drawRonin),
    kunoichi: buildEnemySet(drawKunoichi),
    oni: buildEnemySet(drawOni),
    boss_kagerou: buildEnemySet((m) => drawBoss('#022C22', '#065F46', '#10B981', '#F59E0B', '#E11D48', '#F8FAFC', m)),
    boss_hotaru: buildEnemySet((m) => drawBoss('#2E1065', '#4C1D95', '#7E22CE', '#E879F9', '#38BDF8', '#F8FAFC', m)),
    boss_raiden: buildEnemySet((m) => drawBoss('#0F172A', '#1E293B', '#64748B', '#22D3EE', '#D946EF', '#38BDF8', m)),
    boss_kurogane: buildEnemySet((m) => drawBoss('#090D16', '#1E293B', '#475569', '#F59E0B', '#E11D48', '#F8FAFC', m)),
    boss_umigame: buildEnemySet((m) => drawBoss('#082F49', '#0E7490', '#38BDF8', '#FBBF24', '#E11D48', '#FEF08A', m)),
    boss_tetsujin: buildEnemySet((m) => drawBoss('#1C1917', '#44403C', '#78716C', '#F97316', '#B45309', '#FDE047', m)),
    boss_yuki: buildEnemySet((m) => drawBoss('#1E293B', '#94A3B8', '#E2E8F0', '#38BDF8', '#67E8F9', '#FFFFFF', m)),
    boss_enma: buildEnemySet((m) => drawBoss('#2E1065', '#581C87', '#A855F7', '#FDE047', '#E11D48', '#38BDF8', m)),
    boss_tetsuo: buildEnemySet((m) => drawBoss('#18181B', '#3F3F46', '#A1A1AA', '#F472B6', '#22D3EE', '#F8FAFC', m)),
    boss_akuma: buildEnemySet((m) => drawBoss('#1A040A', '#4C0519', '#9F1239', '#FACC15', '#FB7185', '#FEF08A', m)),
    props: {
      wooden_crate: buildPair(CRATE_ROWS, PROP_PALETTE),
      stone_lantern: buildPair(LANTERN_PROP_ROWS, PROP_PALETTE),
      fire_brazier: buildPair(BRAZIER_PROP_ROWS, PROP_PALETTE),
    },
    civilian: {
      captive: drawCivilian(false),
      rescued: drawCivilian(true),
    },
    pickups: {
      onigiri: compileSprite(ONIGIRI_ROWS, PROP_PALETTE),
      chi_scroll: compileSprite(SCROLL_ROWS, PROP_PALETTE),
      jade: compileSprite(JADE_ROWS, JADE_PALETTE),
      shuriken_pack: compileSprite(SHURIKEN_PACK_ROWS, PROP_PALETTE),
    },
    shuriken: compileSprite(SHURIKEN_ROWS, PROP_PALETTE),
    fire_dragon: compileSprite(FIRE_DRAGON_ROWS, PROP_PALETTE),
  };
  return cachedAtlas;
}
