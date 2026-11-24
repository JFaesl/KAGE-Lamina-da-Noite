import { getPixelAtlas, PixelSpriteAtlas } from './pixelSprites';
import {
  Afterimage,
  Civilian,
  Crate,
  Enemy,
  EnvironmentalHazard,
  FallingDebris,
  FloatingText,
  NINJUTSU_LIST,
  Particle,
  Pickup,
  Platform,
  Player,
  Projectile,
  ShadowClone,
  SlashArc,
  STAGES,
  StageId,
  SurfaceMark,
  WeatherState,
} from './types';

export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 720;
export const PIXEL_WIDTH = 640;
export const PIXEL_HEIGHT = 360;
export const PIXEL_SCALE = 0.5;

export const FLOOR_TOP = 392;
export const FLOOR_BOTTOM = 664;
const P_FLOOR_TOP = Math.round(FLOOR_TOP * PIXEL_SCALE); // 196

interface RenderState {
  stageId: StageId;
  time: number;
  cameraX: number;
  shakeX: number;
  shakeY: number;
  specialFlash: number;
  moonFuryFlash: number;
  platforms: Platform[];
  hazards: EnvironmentalHazard[];
  fallingDebris: FallingDebris[];
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  crates: Crate[];
  civilians: Civilian[];
  clones: ShadowClone[];
  particles: Particle[];
  slashArcs: SlashArc[];
  surfaceMarks: SurfaceMark[];
  floatingTexts: FloatingText[];
  afterimages: Afterimage[];
  weather: WeatherState;
}

function px(val: number): number {
  return Math.round(val * PIXEL_SCALE);
}

// ============================================================
// CACHED SEAMLESS 16-BIT STONE & WOOD PATTERNS (60fps Zero-Lag)
// ============================================================
const patternCache = new Map<string, CanvasPattern | null>();

function getCobblePattern(
  ctx: CanvasRenderingContext2D,
  key: string,
  mortar: string,
  dark: string,
  mid: string,
  hi: string,
  rim: string
): CanvasPattern | null {
  if (patternCache.has(key)) return patternCache.get(key) ?? null;

  const tile = document.createElement('canvas');
  tile.width = 96;
  tile.height = 48;
  const tctx = tile.getContext('2d')!;
  tctx.imageSmoothingEnabled = false;

  tctx.fillStyle = mortar;
  tctx.fillRect(0, 0, 96, 48);

  // Hand-crafted organic chiseled river-stone slabs in staggered rows
  const rows = [
    [
      { x: 1, w: 22 },
      { x: 25, w: 28 },
      { x: 55, w: 18 },
      { x: 75, w: 20 },
    ],
    [
      { x: -10, w: 24 },
      { x: 16, w: 20 },
      { x: 38, w: 26 },
      { x: 66, w: 29 },
    ],
    [
      { x: 2, w: 26 },
      { x: 30, w: 20 },
      { x: 52, w: 24 },
      { x: 78, w: 17 },
    ],
    [
      { x: -6, w: 20 },
      { x: 16, w: 28 },
      { x: 46, w: 22 },
      { x: 70, w: 25 },
    ],
  ];

  rows.forEach((stones, rIdx) => {
    const y = rIdx * 12 + 1;
    const h = 10;
    for (let sIdx = 0; sIdx < stones.length; sIdx++) {
      const s = stones[sIdx];
      const tone = (rIdx * 3 + sIdx) % 3;
      // Outer chiseled shadow
      tctx.fillStyle = dark;
      tctx.fillRect(s.x, y + 1, s.w, h - 1);
      tctx.fillRect(s.x + 1, y, s.w - 2, h);
      // Mid stone face
      tctx.fillStyle = tone === 0 ? dark : mid;
      tctx.fillRect(s.x + 1, y + 1, s.w - 2, h - 2);
      // Top-left facet highlight
      tctx.fillStyle = tone === 2 ? hi : mid;
      tctx.fillRect(s.x + 2, y + 1, s.w - 5, h - 4);
      // Crisp specular stone rim
      tctx.fillStyle = rim;
      tctx.fillRect(s.x + 2, y + 1, Math.max(4, s.w - 8), 1);
      tctx.fillRect(s.x + 1, y + 2, 2, 2);
      // Subtle surface crack/speckle
      tctx.fillStyle = mortar;
      tctx.fillRect(s.x + Math.floor(s.w * 0.55), y + 4, 2, 1);
    }
  });

  const pat = ctx.createPattern(tile, 'repeat');
  patternCache.set(key, pat);
  return pat;
}

function drawDitherBand(
  ctx: CanvasRenderingContext2D,
  yStart: number,
  height: number,
  colorA: string,
  colorB: string
): void {
  const grad = ctx.createLinearGradient(0, yStart, 0, yStart + height);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);
  ctx.fillStyle = grad;
  ctx.fillRect(-10, yStart, PIXEL_WIDTH + 20, height + 1);
}

/**
 * Draws a thick 5-tone cylindrical bamboo stalk with wood grain & beveled nodes.
 */
function drawThickBambooStalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  yTop: number,
  yBottom: number,
  width: number,
  segHeight: number,
  phase = 0
): void {
  // Cylindrical shading bands from dark edge -> bright specular -> deep edge
  ctx.fillStyle = '#072214';
  ctx.fillRect(x, yTop, width, yBottom - yTop);
  ctx.fillStyle = '#124D2D';
  ctx.fillRect(x + 1, yTop, Math.max(1, width - 2), yBottom - yTop);
  ctx.fillStyle = '#227D49';
  ctx.fillRect(x + 2, yTop, Math.max(1, width - 4), yBottom - yTop);
  if (width >= 7) {
    ctx.fillStyle = '#4ADE80';
    ctx.fillRect(x + 3, yTop, 2, yBottom - yTop);
    ctx.fillStyle = '#86EFAC';
    ctx.fillRect(x + 3, yTop, 1, yBottom - yTop);
  }

  // Natural bamboo internode rings + pale highlight lip + node shadow
  for (let y = yTop + (phase % segHeight); y < yBottom; y += segHeight) {
    ctx.fillStyle = '#04140B';
    ctx.fillRect(x - 1, y, width + 2, 2);
    ctx.fillStyle = '#6EE7B7';
    ctx.fillRect(x + 1, y - 1, Math.max(1, width - 2), 1);
    ctx.fillStyle = '#092B19';
    ctx.fillRect(x, y + 2, width, 2);
  }
}

/**
 * Draws a highly detailed 16-bit Japanese Dojo Pavilion with overlapping curved
 * kawara tiles, circular eave caps, wooden rafters, lattice shoji doors, and timber deck.
 */
function drawJapaneseDojoFacade(
  ctx: CanvasRenderingContext2D,
  x: number,
  yBase: number,
  width: number,
  height: number
): void {
  const roofH = 34;
  const roofTop = yBase - height;

  // Main wooden wall & inner eaves shadow
  ctx.fillStyle = '#2E1A0E';
  ctx.fillRect(x + 8, roofTop + roofH, width - 16, height - roofH);
  // Dark shadow cast under roof overhang
  ctx.fillStyle = '#1A0E07';
  ctx.fillRect(x + 8, roofTop + roofH, width - 16, 7);

  // Warm cedar horizontal beams
  ctx.fillStyle = '#7C4520';
  ctx.fillRect(x + 8, roofTop + roofH + 5, width - 16, 4);
  ctx.fillRect(x + 8, yBase - 16, width - 16, 4);

  // Recessed sliding shoji doors with fine wooden lattice
  for (let pxPos = x + 18; pxPos < x + width - 26; pxPos += 32) {
    ctx.fillStyle = '#4B2A15';
    ctx.fillRect(pxPos, roofTop + roofH + 11, 24, height - roofH - 29);
    ctx.fillStyle = '#8F5931';
    ctx.fillRect(pxPos + 2, roofTop + roofH + 13, 20, height - roofH - 33);
    // Fine vertical & horizontal lattice mullions
    ctx.fillStyle = '#331B0D';
    ctx.fillRect(pxPos + 8, roofTop + roofH + 13, 1, height - roofH - 33);
    ctx.fillRect(pxPos + 15, roofTop + roofH + 13, 1, height - roofH - 33);
    ctx.fillRect(pxPos + 2, roofTop + roofH + 22, 20, 1);
    ctx.fillRect(pxPos + 2, roofTop + roofH + 34, 20, 1);
    // Heavy cedar column
    ctx.fillStyle = '#231208';
    ctx.fillRect(pxPos - 5, roofTop + roofH + 5, 5, height - roofH - 5);
    ctx.fillStyle = '#5C3419';
    ctx.fillRect(pxPos - 4, roofTop + roofH + 5, 2, height - roofH - 5);
  }

  // Raised wooden veranda & under-deck posts
  ctx.fillStyle = '#170C06';
  ctx.fillRect(x + 4, yBase - 12, width - 8, 12);
  ctx.fillStyle = '#4B2A15';
  for (let vx = x + 10; vx < x + width - 12; vx += 14) {
    ctx.fillRect(vx, yBase - 11, 4, 11);
  }

  // Curved Kawara Tiled Roof with upturned corner eaves
  for (let row = 0; row < roofH; row++) {
    const t = row / roofH;
    const curve = Math.pow(t, 0.85);
    const inset = Math.round((1 - curve) * 24);
    const rx = x + inset;
    const rw = width - inset * 2;
    ctx.fillStyle = row < 4 ? '#64748B' : row % 4 === 0 ? '#0F172A' : '#1E293B';
    ctx.fillRect(rx, roofTop + row, rw, 1);
  }

  // Top ridge beam & upturned oni-gawara corner finials
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 20, roofTop - 3, width - 40, 5);
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(x + 22, roofTop - 2, width - 44, 2);
  ctx.fillStyle = '#64748B';
  ctx.fillRect(x - 4, roofTop + roofH - 6, 8, 5);
  ctx.fillRect(x + width - 4, roofTop + roofH - 6, 8, 5);

  // Individual semi-cylindrical vertical tile ribs + round bottom eave caps
  for (let tx = x + 14; tx < x + width - 14; tx += 8) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(tx - 1, roofTop + 5, 1, roofH - 5);
    ctx.fillStyle = '#334155';
    ctx.fillRect(tx, roofTop + 5, 4, roofH - 6);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(tx + 1, roofTop + 6, 2, roofH - 8);
    // Circular bottom eave cap (Nokimaru-gawara)
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(tx, roofTop + roofH - 4, 4, 3);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(tx + 1, roofTop + roofH - 3, 2, 1);
  }

  // Crisp row of wooden rafter beam ends beneath eaves
  ctx.fillStyle = '#140A05';
  ctx.fillRect(x + 4, roofTop + roofH, width - 8, 4);
  ctx.fillStyle = '#D97706';
  for (let rx = x + 8; rx < x + width - 8; rx += 5) {
    ctx.fillRect(rx, roofTop + roofH + 1, 3, 2);
  }
}

/**
 * Draws a weathered castle plaster & stone wall with jagged cracks and kawara tile cap.
 */
function drawCastleStoneWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  yBottom: number,
  width: number,
  height: number
): void {
  const yTop = yBottom - height;
  // Stucco plaster wall with subtle horizontal weathering
  ctx.fillStyle = '#525969';
  ctx.fillRect(x, yTop + 16, width, height - 16);
  ctx.fillStyle = '#656D80';
  ctx.fillRect(x + 2, yTop + 17, width - 4, 6);
  ctx.fillStyle = '#3C4250';
  ctx.fillRect(x, yBottom - 7, width, 7);

  // Jagged exposed stone cracks & moss patches
  ctx.fillStyle = '#252A36';
  ctx.fillRect(x + 20, yTop + 26, 18, 4);
  ctx.fillRect(x + 25, yTop + 30, 12, 4);
  ctx.fillRect(x + 28, yTop + 34, 6, 4);
  ctx.fillStyle = '#7A8296';
  ctx.fillRect(x + 22, yTop + 25, 10, 1);
  ctx.fillStyle = '#264A3B';
  ctx.fillRect(x + 16, yBottom - 8, 22, 8);
  ctx.fillRect(x + Math.floor(width * 0.65), yBottom - 6, 26, 6);

  // Multi-tone Kawara tile coping on top of wall
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(x - 3, yTop, width + 6, 17);
  ctx.fillStyle = '#334155';
  ctx.fillRect(x - 2, yTop + 1, width + 4, 4);
  for (let tx = x; tx < x + width; tx += 9) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(tx, yTop + 5, 5, 10);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(tx + 1, yTop + 6, 2, 7);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(tx, yTop + 14, 5, 3);
  }
}

export function renderGameFrame(ctx: CanvasRenderingContext2D, state: RenderState): void {
  const atlas = getPixelAtlas();
  const { stageId, time, cameraX, shakeX, shakeY, specialFlash } = state;

  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = '#05070D';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  ctx.save();
  ctx.translate(Math.round(shakeX), Math.round(shakeY));

  const pCam = Math.round(cameraX * PIXEL_SCALE);

  // 1. Multi-layer Parallax Backdrops (scaled crisply into 1280x720 with smooth gradients/moons)
  ctx.save();
  ctx.scale(2, 2);
  ctx.imageSmoothingEnabled = true;
  if (stageId === 'village') {
    drawVillageBackdrop(ctx, pCam, time);
  } else if (stageId === 'bamboo') {
    drawBambooBackdrop(ctx, pCam, time);
  } else if (stageId === 'neon_city') {
    drawNeonCityBackdrop(ctx, pCam, time);
  } else if (stageId === 'fortress') {
    drawFortressBackdrop(ctx, pCam, time);
  } else if (stageId === 'harbor') {
    drawHarborBackdrop(ctx, pCam, time);
  } else if (stageId === 'mines') {
    drawMinesBackdrop(ctx, pCam, time);
  } else if (stageId === 'snow_peak') {
    drawSnowPeakBackdrop(ctx, pCam, time);
  } else if (stageId === 'temple_ruins') {
    drawTempleRuinsBackdrop(ctx, pCam, time);
  } else if (stageId === 'bullet_train') {
    drawBulletTrainBackdrop(ctx, pCam, time);
  } else {
    drawEclipseCitadelBackdrop(ctx, pCam, time);
  }
  ctx.restore();

  // 1b. HD Volumetric Sky Lighting, Horizon Atmospheric Depth & Background Precipitation
  drawStageAtmosphericLighting(ctx, stageId, cameraX, time, state.weather);
  if (state.weather.lightningAlpha > 0.02) {
    ctx.fillStyle = `rgba(224, 242, 254, ${state.weather.lightningAlpha * 0.5})`;
    ctx.fillRect(-20, -20, LOGICAL_WIDTH + 40, FLOOR_TOP + 24);
  }
  drawWeatherLayer(ctx, state.weather, stageId, 0);

  // 2. World Floor & Architecture (Native 1280x720 world coordinates)
  ctx.save();
  ctx.translate(-Math.round(cameraX), 0);

  ctx.save();
  ctx.scale(2, 2);
  ctx.imageSmoothingEnabled = false;
  if (stageId === 'village') {
    drawVillageFloor(ctx, pCam, time);
  } else if (stageId === 'bamboo') {
    drawBambooFloor(ctx, pCam, time);
  } else if (stageId === 'neon_city') {
    drawNeonCityFloor(ctx, pCam, time);
  } else if (stageId === 'fortress') {
    drawFortressFloor(ctx, pCam, time);
  } else if (stageId === 'harbor') {
    drawHarborFloor(ctx, pCam, time);
  } else if (stageId === 'mines') {
    drawMinesFloor(ctx, pCam, time);
  } else if (stageId === 'snow_peak') {
    drawSnowPeakFloor(ctx, pCam, time);
  } else if (stageId === 'temple_ruins') {
    drawTempleRuinsFloor(ctx, pCam, time);
  } else if (stageId === 'bullet_train') {
    drawBulletTrainFloor(ctx, pCam, time);
  } else {
    drawEclipseCitadelFloor(ctx, pCam, time);
  }
  ctx.restore();

  // 2a. Modern HD Specular Floor Lighting & Ambient Occlusion
  drawStageFloorLighting(ctx, stageId, cameraX, time, state.weather);

  // 2b. Environmental Floor Hazards (HD native 1280x720)
  for (const hazard of state.hazards) {
    drawEnvironmentalHazardFloor(ctx, hazard, time, state.player, state.weather);
  }

  // 2b2. Falling Cave Debris Telegraph Shadows (main floor)
  for (const debris of state.fallingDebris) {
    if (debris.groundZ === 0) {
      drawFallingDebrisShadow(ctx, debris, time);
    }
  }

  // 2c. Temporary Katana Slash Gouges & Pixel-Art Blood Splatters on Main Floor
  for (const mark of state.surfaceMarks) {
    if (mark.platformId === null) {
      drawSurfaceMark(ctx, mark);
    }
  }

  // 2d. Player Tactical Perception / Detection Radius Indicator under weather penalty or Night Vision
  drawPlayerDetectionRing(ctx, state.player, stageId, state.weather, time);

  // 3. Multi-Layer Elevated Platforms + Depth-sorted Entities
  type DrawItem = { sortY: number; draw: () => void };
  const items: DrawItem[] = [];

  for (const hazard of state.hazards) {
    items.push({
      sortY: hazard.y2 + 2,
      draw: () => drawEnvironmentalHazardPlumes(ctx, hazard, time, state.weather),
    });
  }

  for (const debris of state.fallingDebris) {
    if (debris.groundZ > 0) {
      items.push({
        sortY: debris.y + 1,
        draw: () => drawFallingDebrisShadow(ctx, debris, time),
      });
    }
    items.push({
      sortY: debris.y + 18,
      draw: () => drawFallingDebrisRock(ctx, debris, time),
    });
  }

  for (const plat of state.platforms) {
    items.push({
      sortY: plat.y1 - 1,
      draw: () => {
        ctx.save();
        ctx.scale(2, 2);
        ctx.imageSmoothingEnabled = false;
        drawPixelPlatform(ctx, plat);
        ctx.restore();
        for (const mark of state.surfaceMarks) {
          if (mark.platformId === plat.id) {
            drawSurfaceMark(ctx, mark);
          }
        }
      },
    });
  }

  for (const crate of state.crates) {
    items.push({
      sortY: crate.y + (crate.z > 0 ? 12 : 0),
      draw: () => drawPixelCrate(ctx, atlas, crate, time),
    });
  }

  for (const pickup of state.pickups) {
    items.push({
      sortY: pickup.y + (pickup.z > 0 ? 12 : 0),
      draw: () => drawPixelPickup(ctx, atlas, pickup, time),
    });
  }

  for (const civ of state.civilians) {
    items.push({
      sortY: civ.y + (civ.z > 0 ? 12 : 0),
      draw: () => drawPixelCivilian(ctx, atlas, civ, time),
    });
  }

  for (const afterimage of state.afterimages) {
    items.push({
      sortY: afterimage.y - 0.1,
      draw: () => drawPixelAfterimage(ctx, atlas, afterimage),
    });
  }

  for (const enemy of state.enemies) {
    items.push({
      sortY: enemy.y + (enemy.groundZ > 0 ? 14 : 0),
      draw: () => drawPixelEnemy(ctx, atlas, enemy, time, stageId, state.player, state.weather),
    });
  }

  for (const clone of state.clones) {
    items.push({
      sortY: clone.y + (clone.groundZ > 0 ? 14 : 0),
      draw: () => drawPixelShadowClone(ctx, atlas, clone, time),
    });
  }

  items.push({
    sortY: state.player.y + (state.player.groundZ > 0 ? 14 : 0),
    draw: () => drawPixelPlayer(ctx, atlas, state.player, time),
  });

  for (const proj of state.projectiles) {
    items.push({
      sortY: proj.y + 16,
      draw: () => drawPixelProjectile(ctx, atlas, proj),
    });
  }

  items.sort((a, b) => a.sortY - b.sortY);
  for (const item of items) item.draw();

  // 4. HD Tapered Crescent Katana Slash Arcs
  for (const arc of state.slashArcs) {
    drawPixelSlashArc(ctx, arc);
  }

  // 5. HD Glowing Particles
  for (const p of state.particles) {
    if (!p.active) continue;
    drawPixelParticle(ctx, p);
  }

  // 6. Smooth Lightning Bolts during Ikazuchi / Special Flash
  if (specialFlash > 0.35 && state.player.activeNinjutsu === 'ikazuchi') {
    drawLightningBolts(ctx, Math.round(state.player.x), Math.round(state.player.y - state.player.z), time);
  }

  // 6b. Fúria da Lua Area Shockwave & Crimson Moon Eclipse
  if (state.player.moonFuryTimer > 0) {
    drawMoonFuryWave(ctx, state.player, time);
  }

  // 7. Crisp HD Floating Damage Numbers
  for (const ft of state.floatingTexts) {
    drawPixelFloatingText(ctx, ft);
  }

  ctx.restore(); // end world translation

  // 7b. Weather Atmosphere & Volumetric Mist / Night-Vision Filter Overlay
  const stageMeta = STAGES.find((s) => s.id === stageId);
  const weatherIsFog = state.weather.currentKind === 'fog' || (state.weather.targetKind === 'fog' && state.weather.blend > 0.25);
  drawWeatherVisibilityOverlay(ctx, state.weather, time, cameraX, state.player.nightVisionTimer > 0);
  if (stageMeta?.denseFog || weatherIsFog) {
    const fogStrength = stageMeta?.denseFog
      ? 1
      : state.weather.currentKind === 'fog'
        ? Math.min(1, state.weather.visibilityPenalty / 0.72)
        : Math.min(1, state.weather.blend);
    drawDenseForestFog(ctx, time, cameraX, state.player.nightVisionTimer > 0, fogStrength);
  }
  if (state.player.nightVisionTimer > 0) {
    drawNightVisionOverlay(ctx, time, state.player.nightVisionTimer);
  }

  // 7c. Foreground HD Precipitation & Ground Impact Ripples
  drawWeatherSplashes(ctx, state.weather, stageId);
  drawWeatherLayer(ctx, state.weather, stageId, 1);

  // 8. Ninjutsu & Moon Fury Screen Flash Overlay
  if (state.moonFuryFlash > 0.02) {
    ctx.fillStyle = `rgba(190, 18, 60, ${Math.min(0.42, state.moonFuryFlash * 0.4)})`;
    ctx.fillRect(-20, -20, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT + 40);
  } else if (specialFlash > 0.02) {
    const flashColor =
      state.player.activeNinjutsu === 'ikazuchi'
        ? `rgba(56, 189, 248, ${Math.min(0.4, specialFlash * 0.36)})`
        : state.player.activeNinjutsu === 'karyu'
          ? `rgba(249, 115, 22, ${Math.min(0.4, specialFlash * 0.36)})`
          : state.player.activeNinjutsu === 'fushin'
            ? `rgba(16, 185, 129, ${Math.min(0.35, specialFlash * 0.32)})`
            : state.player.activeNinjutsu === 'bunshin'
              ? `rgba(167, 139, 250, ${Math.min(0.38, specialFlash * 0.34)})`
              : state.player.activeNinjutsu === 'yagan'
                ? `rgba(45, 212, 191, ${Math.min(0.38, specialFlash * 0.34)})`
                : `rgba(225, 29, 72, ${Math.min(0.45, specialFlash * 0.4)})`;
    ctx.fillStyle = flashColor;
    ctx.fillRect(-20, -20, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT + 40);
  }

  // 9. Modern Cinematic Edge Vignette
  const vig = ctx.createRadialGradient(
    LOGICAL_WIDTH * 0.5,
    LOGICAL_HEIGHT * 0.48,
    LOGICAL_WIDTH * 0.28,
    LOGICAL_WIDTH * 0.5,
    LOGICAL_HEIGHT * 0.5,
    LOGICAL_WIDTH * 0.72
  );
  vig.addColorStop(0, 'rgba(5, 7, 13, 0)');
  vig.addColorStop(1, 'rgba(5, 7, 13, 0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.restore();
}

function drawStageAtmosphericLighting(
  ctx: CanvasRenderingContext2D,
  stageId: StageId,
  cameraX: number,
  time: number,
  weather: WeatherState
): void {
  ctx.save();
  // Horizon mist separation band between parallax backdrop & combat floor
  const horizonColor =
    stageId === 'fortress' || stageId === 'eclipse_citadel'
      ? 'rgba(136, 19, 55, 0.28)'
      : stageId === 'neon_city' || stageId === 'bullet_train'
        ? 'rgba(34, 211, 238, 0.2)'
        : stageId === 'bamboo' || stageId === 'temple_ruins'
          ? 'rgba(16, 185, 129, 0.22)'
          : stageId === 'snow_peak'
            ? 'rgba(186, 230, 253, 0.26)'
            : 'rgba(30, 58, 138, 0.24)';

  const hGrad = ctx.createLinearGradient(0, FLOOR_TOP - 110, 0, FLOOR_TOP + 12);
  hGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  hGrad.addColorStop(0.7, horizonColor);
  hGrad.addColorStop(1, 'rgba(5, 7, 13, 0.35)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, FLOOR_TOP - 110, LOGICAL_WIDTH, 122);

  // Subtle volumetric light rays drifting across sky
  if (weather.visibilityPenalty < 0.55) {
    ctx.globalCompositeOperation = 'lighter';
    const rayColor =
      stageId === 'fortress' || stageId === 'eclipse_citadel'
        ? 'rgba(251, 113, 133, 0.055)'
        : stageId === 'bamboo' || stageId === 'temple_ruins'
          ? 'rgba(52, 211, 153, 0.055)'
          : stageId === 'neon_city' || stageId === 'bullet_train'
            ? 'rgba(56, 189, 248, 0.06)'
            : 'rgba(224, 242, 254, 0.055)';
    for (let i = 0; i < 4; i++) {
      const rx = ((i * 360 - cameraX * 0.12 + Math.sin(time * 0.4 + i) * 30) % (LOGICAL_WIDTH + 300)) - 120;
      const grad = ctx.createLinearGradient(rx, 0, rx + 170, FLOOR_TOP);
      grad.addColorStop(0, rayColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 120, 0);
      ctx.lineTo(rx + 290, FLOOR_TOP);
      ctx.lineTo(rx + 130, FLOOR_TOP);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStageFloorLighting(
  ctx: CanvasRenderingContext2D,
  stageId: StageId,
  cameraX: number,
  time: number,
  weather: WeatherState
): void {
  ctx.save();
  // Ambient occlusion along the top wall/curb seam at FLOOR_TOP
  const aoGrad = ctx.createLinearGradient(0, FLOOR_TOP, 0, FLOOR_TOP + 34);
  aoGrad.addColorStop(0, 'rgba(4, 6, 14, 0.58)');
  aoGrad.addColorStop(1, 'rgba(4, 6, 14, 0)');
  ctx.fillStyle = aoGrad;
  ctx.fillRect(cameraX - 40, FLOOR_TOP, LOGICAL_WIDTH + 80, 34);

  // Subtle bottom depth shadow at bottom edge of play lane
  const bottomGrad = ctx.createLinearGradient(0, LOGICAL_HEIGHT - 84, 0, LOGICAL_HEIGHT);
  bottomGrad.addColorStop(0, 'rgba(4, 6, 14, 0)');
  bottomGrad.addColorStop(1, 'rgba(4, 6, 14, 0.48)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(cameraX - 40, LOGICAL_HEIGHT - 84, LOGICAL_WIDTH + 80, 84);

  // Wet ground specular reflections during rain / storm / neon city
  const isWet = weather.currentKind === 'rain' || weather.currentKind === 'storm' || stageId === 'neon_city';
  if (isWet) {
    ctx.globalCompositeOperation = 'lighter';
    const shimmer = 0.08 + 0.03 * Math.sin(time * 4);
    for (let rx = Math.floor(cameraX / 240) * 240; rx < cameraX + LOGICAL_WIDTH + 240; rx += 240) {
      const puddle = ctx.createRadialGradient(rx + 120, FLOOR_TOP + 130, 8, rx + 120, FLOOR_TOP + 130, 95);
      puddle.addColorStop(
        0,
        stageId === 'neon_city' ? `rgba(34, 211, 238, ${shimmer + 0.05})` : `rgba(125, 211, 252, ${shimmer})`
      );
      puddle.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = puddle;
      ctx.beginPath();
      ctx.ellipse(rx + 120, FLOOR_TOP + 130, 95, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawDenseForestFog(
  ctx: CanvasRenderingContext2D,
  time: number,
  cameraX: number,
  nightVisionActive: boolean,
  strength = 1
): void {
  ctx.save();
  const baseOpacity = (nightVisionActive ? 0.16 : 0.72) * Math.max(0.15, Math.min(1, strength));
  ctx.fillStyle = nightVisionActive
    ? `rgba(20, 83, 75, ${(0.11 * strength).toFixed(3)})`
    : `rgba(148, 184, 174, ${(0.22 * strength).toFixed(3)})`;
  ctx.fillRect(-20, 60, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT - 40);

  // Smooth volumetric mist puffs drifting across canopy & ground
  const layers = [
    { speed: 46, parallax: 0.32, y: 270, rx: 220, ry: 68, count: 6, rgb: '148, 184, 172' },
    { speed: -64, parallax: 0.55, y: 410, rx: 260, ry: 86, count: 7, rgb: '180, 212, 200' },
    { speed: 84, parallax: 0.82, y: 550, rx: 300, ry: 98, count: 8, rgb: '203, 224, 218' },
  ];

  for (let l = 0; l < layers.length; l++) {
    const lay = layers[l];
    const alpha = baseOpacity * (l === 2 ? 0.45 : l === 1 ? 0.36 : 0.28);
    const span = LOGICAL_WIDTH + 520;
    for (let i = 0; i < lay.count; i++) {
      const rawX = i * (span / lay.count) + time * lay.speed - cameraX * lay.parallax;
      const fx = ((rawX % span) + span) % span - 260;
      const fy = lay.y + Math.sin(time * 0.8 + i * 1.4 + l) * 16;
      const grad = ctx.createRadialGradient(fx, fy, lay.rx * 0.12, fx, fy, lay.rx);
      const col = nightVisionActive ? '45, 212, 191' : lay.rgb;
      grad.addColorStop(0, `rgba(${col}, ${alpha.toFixed(3)})`);
      grad.addColorStop(0.6, `rgba(${col}, ${(alpha * 0.5).toFixed(3)})`);
      grad.addColorStop(1, `rgba(${col}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(fx, fy, lay.rx, lay.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawNightVisionOverlay(ctx: CanvasRenderingContext2D, time: number, timer: number): void {
  ctx.save();
  const vig = ctx.createRadialGradient(
    LOGICAL_WIDTH * 0.5,
    LOGICAL_HEIGHT * 0.5,
    LOGICAL_WIDTH * 0.2,
    LOGICAL_WIDTH * 0.5,
    LOGICAL_HEIGHT * 0.5,
    LOGICAL_WIDTH * 0.68
  );
  vig.addColorStop(0, 'rgba(13, 148, 136, 0.06)');
  vig.addColorStop(1, 'rgba(4, 47, 46, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  ctx.fillStyle = 'rgba(45, 212, 191, 0.04)';
  for (let y = 0; y < LOGICAL_HEIGHT; y += 6) {
    ctx.fillRect(0, y, LOGICAL_WIDTH, 1);
  }
  const pulse = timer < 3 ? Math.floor(time * 12) % 2 === 0 : true;
  if (pulse) {
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, LOGICAL_WIDTH - 12, LOGICAL_HEIGHT - 12);
  }
  ctx.restore();
}

function drawWeatherVisibilityOverlay(
  ctx: CanvasRenderingContext2D,
  weather: WeatherState,
  time: number,
  cameraX: number,
  nightVisionActive: boolean
): void {
  const pen = weather.visibilityPenalty;
  ctx.save();

  // Crimson Full Moon clear-night aura & warm lunar glow when clear sky dominates
  if (pen < 0.16) {
    const clearStrength = Math.max(0, 1 - pen / 0.16);
    const pulse = 0.05 + Math.sin(time * 2.1) * 0.018;
    ctx.fillStyle = `rgba(225, 29, 72, ${(pulse * clearStrength).toFixed(3)})`;
    ctx.fillRect(-20, -20, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT + 40);

    const moonX = LOGICAL_WIDTH - 216;
    const moonY = 112;
    const halo = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 130);
    halo.addColorStop(0, `rgba(251, 113, 133, ${(0.28 * clearStrength).toFixed(3)})`);
    halo.addColorStop(0.5, `rgba(225, 29, 72, ${(0.12 * clearStrength).toFixed(3)})`);
    halo.addColorStop(1, 'rgba(225, 29, 72, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 130, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rain mist, blizzard whiteout, & dense fog veil proportional to current visibilityPenalty
  if (pen > 0.04) {
    const isBlizzard = weather.currentKind === 'snow' || (weather.targetKind === 'snow' && weather.blend > 0.45);
    const isFog = weather.currentKind === 'fog' || (weather.targetKind === 'fog' && weather.blend > 0.45);
    const nvFactor = nightVisionActive ? 0.34 : 1;

    if (isBlizzard) {
      const snowAlpha = Math.min(0.3, pen * 0.44) * nvFactor;
      ctx.fillStyle = `rgba(226, 232, 240, ${snowAlpha.toFixed(3)})`;
      ctx.fillRect(-20, -20, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT + 40);

      const span = LOGICAL_WIDTH + 440;
      for (let i = 0; i < 6; i++) {
        const rawX = i * (span / 6) - time * 260 - cameraX * 0.45;
        const bx = ((rawX % span) + span) % span - 220;
        const by = 160 + ((i * 94) % 420);
        const drift = ctx.createRadialGradient(bx, by, 20, bx, by, 210);
        drift.addColorStop(0, `rgba(248, 250, 252, ${(snowAlpha * 0.68).toFixed(3)})`);
        drift.addColorStop(1, 'rgba(248, 250, 252, 0)');
        ctx.fillStyle = drift;
        ctx.beginPath();
        ctx.ellipse(bx, by, 210, 48, -0.06, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (!isFog) {
      const rainAlpha = Math.min(0.2, pen * 0.46) * nvFactor;
      ctx.fillStyle = `rgba(15, 42, 68, ${rainAlpha.toFixed(3)})`;
      ctx.fillRect(-20, -20, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT + 40);
    }
  }

  ctx.restore();
}

function drawWeatherLayer(
  ctx: CanvasRenderingContext2D,
  weather: WeatherState,
  stageId: StageId,
  layer: 0 | 1
): void {
  const kind = weather.currentKind;
  if (weather.intensity <= 0.03 && kind === 'clear' && weather.targetKind === 'clear') return;

  const isClearing = kind === 'clear' && weather.targetKind === 'clear';
  const activeCount = isClearing
    ? Math.round(weather.drops.length * Math.max(0, weather.intensity))
    : Math.round(weather.drops.length * Math.min(1, Math.max(0.06, weather.intensity)));
  if (activeCount <= 0) return;

  const slantScale = weather.windX / 260;

  ctx.save();
  for (let i = 0; i < activeCount; i++) {
    const d = weather.drops[i];
    if (d.layer !== layer) continue;

    const dx = d.x * 2;
    const dy = d.y * 2;
    ctx.globalAlpha = d.alpha * Math.min(1, weather.intensity * 1.15);

    if (d.length <= 1) {
      // Soft glowing snowflakes or fortress ash in HD
      if (kind === 'ash' || (weather.targetKind === 'ash' && weather.blend > 0.5)) {
        ctx.fillStyle = i % 3 === 0 ? '#FBBF24' : i % 2 === 0 ? '#FB7185' : '#94A3B8';
      } else {
        ctx.fillStyle = stageId === 'village' && i % 5 === 0 ? '#FECDD3' : '#F8FAFC';
      }
      ctx.beginPath();
      ctx.arc(dx, dy, d.size * 1.15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sleek anti-aliased slanted rain streaks
      const streakColor =
        stageId === 'neon_city'
          ? i % 4 === 0
            ? '#67E8F9'
            : i % 7 === 0
              ? '#F0ABFC'
              : '#94A3B8'
          : stageId === 'bamboo'
            ? i % 3 === 0
              ? '#A7F3D0'
              : '#BAE6FD'
            : '#CBD5E1';
      ctx.strokeStyle = streakColor;
      ctx.lineWidth = layer === 1 ? 1.6 : 1.1;
      const len = d.length * 2.1;
      const dxShift = slantScale * len;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx + dxShift, dy + len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawWeatherSplashes(ctx: CanvasRenderingContext2D, weather: WeatherState, stageId: StageId): void {
  if (weather.splashes.length === 0) return;
  ctx.save();
  for (const sp of weather.splashes) {
    const t = sp.life / sp.maxLife;
    const sx = sp.x * 2;
    const sy = sp.y * 2;
    ctx.globalAlpha = Math.max(0, t * 0.65);
    if (sp.kind === 'snow') {
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (sp.kind === 'ash') {
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = stageId === 'neon_city' ? '#67E8F9' : '#BAE6FD';
      ctx.lineWidth = 1.2;
      const rx = (1 - t) * 9 + 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, rx * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLightningBolts(ctx: CanvasRenderingContext2D, targetX: number, targetY: number, time: number): void {
  const jitter = Math.sin(time * 60) * 16;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let b = -1; b <= 1; b++) {
    let bx = targetX + b * 130 + jitter;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    for (let y = 32; y <= targetY - 24; y += 32) {
      bx += (y % 64 === 0 ? 1 : -1) * 18 + Math.sin(time * 50 + y) * 6;
      ctx.lineTo(bx, y);
    }
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = '#F0F9FF';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawMoonFuryWave(ctx: CanvasRenderingContext2D, p: Player, time: number): void {
  const progress = Math.max(0, Math.min(1, 1 - p.moonFuryTimer / 0.72));
  const cx = p.x;
  const cy = p.y - p.z - 68;
  const maxR = 460 * progress + 36;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const bloom = ctx.createRadialGradient(cx, cy, 8, cx, cy, 110 + progress * 55);
  bloom.addColorStop(0, `rgba(254, 240, 138, ${Math.max(0, (1 - progress) * 0.7)})`);
  bloom.addColorStop(0.5, `rgba(225, 29, 72, ${Math.max(0, (1 - progress) * 0.55)})`);
  bloom.addColorStop(1, 'rgba(225, 29, 72, 0)');
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(cx, cy, 110 + progress * 55, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = Math.max(0, (1 - progress * 0.82) * 0.92);
  ctx.strokeStyle = '#FB7185';
  ctx.lineWidth = Math.max(3, (1 - progress) * 14);
  ctx.beginPath();
  ctx.ellipse(cx, p.y - p.groundZ - 12, maxR, maxR * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, p.y - p.groundZ - 12, maxR * 0.74, maxR * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = Math.floor(time * 24) % 2 === 0 ? '#FEF08A' : '#FB7185';
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + progress * 1.4;
    const rx = cx + Math.cos(ang) * maxR * 0.85;
    const ry = cy + Math.sin(ang) * maxR * 0.4;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 14, 4, ang, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================
// STAGE ENVIRONMENTAL HAZARDS (Modern HD Glow & Plasma Pools)
// ============================================================
function drawEnvironmentalHazardFloor(
  ctx: CanvasRenderingContext2D,
  h: EnvironmentalHazard,
  time: number,
  player: Player,
  weather: WeatherState
): void {
  const x0 = h.x1;
  const x1 = h.x2;
  const y0 = h.y1;
  const y1 = h.y2;
  const w = x1 - x0;
  const height = y1 - y0;
  const cx = (x0 + x1) * 0.5;
  const cy = (y0 + y1) * 0.5;
  const pulse = 0.5 + 0.5 * Math.sin(time * 8 + h.id);
  const stormBoost = weather.currentKind === 'storm' ? 0.22 : 0;

  let fadeAlpha = 1;
  if (h.life !== undefined && h.maxLife) {
    const age = h.maxLife - h.life;
    fadeAlpha = Math.min(1, age / 0.35, h.life / 0.8);
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, fadeAlpha);

  if (h.kind === 'electric_pool') {
    const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, Math.max(w, height) * 0.65);
    grad.addColorStop(0, `rgba(56, 189, 248, ${(0.48 + pulse * 0.16 + stormBoost).toFixed(3)})`);
    grad.addColorStop(0.65, h.isStormDynamic ? 'rgba(3, 105, 161, 0.78)' : 'rgba(14, 116, 144, 0.72)');
    grad.addColorStop(1, h.isStormDynamic ? 'rgba(8, 47, 73, 0.62)' : 'rgba(7, 34, 59, 0.88)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (h.isStormDynamic) {
      ctx.ellipse(cx, cy, w * 0.5, height * 0.5, 0, 0, Math.PI * 2);
    } else {
      ctx.roundRect(x0, y0, w, height, 8);
    }
    ctx.fill();

    // Caution industrial or crackling rainwater borders
    ctx.strokeStyle = pulse > 0.5 ? '#7DD3FC' : '#0284C7';
    ctx.lineWidth = h.isStormDynamic ? 1.8 : 2;
    ctx.stroke();

    // Smooth crackling voltage arcs
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = weather.currentKind === 'storm' ? 2.0 : 1.6;
    const arcCount = Math.max(3, Math.floor(height / 36));
    for (let a = 0; a < arcCount; a++) {
      const baseY = y0 + 18 + a * Math.max(22, (height - 32) / arcCount) + Math.sin(time * 14 + a) * 5;
      ctx.beginPath();
      ctx.moveTo(x0 + 10, baseY);
      for (let ax = x0 + 22; ax < x1 - 10; ax += 14) {
        ctx.lineTo(ax, baseY + Math.sin(time * 34 + ax * 0.3 + a) * 6);
      }
      ctx.stroke();
    }
  } else if (h.kind === 'poison_mire') {
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, height) * 0.65);
    grad.addColorStop(0, 'rgba(74, 222, 128, 0.52)');
    grad.addColorStop(0.7, 'rgba(20, 83, 45, 0.82)');
    grad.addColorStop(1, 'rgba(5, 46, 22, 0.92)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, height, 12);
    ctx.fill();
    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let bx = x0 + 16; bx < x1 - 16; bx += 22) {
      for (let by = y0 + 16; by < y1 - 16; by += 26) {
        const bubble = Math.sin(time * 5 + bx * 0.2 + by * 0.15);
        if (bubble > 0.15) {
          ctx.fillStyle = bubble > 0.65 ? '#BEF264' : '#4ADE80';
          ctx.beginPath();
          ctx.arc(bx, by, 2.5 + bubble * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (h.kind === 'frost_fissure') {
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, height) * 0.65);
    grad.addColorStop(0, 'rgba(165, 243, 252, 0.55)');
    grad.addColorStop(0.65, 'rgba(14, 116, 144, 0.78)');
    grad.addColorStop(1, 'rgba(8, 47, 73, 0.9)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, height, 8);
    ctx.fill();
    ctx.strokeStyle = '#A5F3FC';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    const isEclipse = h.kind === 'eclipse_fire';
    const isLava = h.kind === 'molten_lava';
    const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, Math.max(w, height) * 0.65);
    grad.addColorStop(0, isEclipse ? 'rgba(251, 113, 133, 0.65)' : 'rgba(251, 191, 36, 0.62)');
    grad.addColorStop(0.55, isEclipse ? 'rgba(159, 18, 57, 0.82)' : isLava ? 'rgba(194, 65, 12, 0.85)' : 'rgba(154, 52, 18, 0.82)');
    grad.addColorStop(1, isEclipse ? 'rgba(43, 7, 24, 0.92)' : 'rgba(41, 11, 7, 0.92)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, height, 10);
    ctx.fill();
    ctx.strokeStyle = isEclipse ? '#FB7185' : '#F97316';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Crisp tactical SHIFT crossing cue
  const distToPlayer = Math.abs(player.x - cx);
  if (distToPlayer < 290) {
    const blink = Math.floor(time * 8) % 2 === 0;
    ctx.fillStyle = 'rgba(7, 11, 20, 0.86)';
    ctx.beginPath();
    ctx.roundRect(cx - 52, cy - 13, 104, 26, 6);
    ctx.fill();
    ctx.strokeStyle = blink ? '#FDE047' : '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '700 12px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = blink ? '#FEF08A' : '#7DD3FC';
    ctx.fillText('SHIFT →→', cx, cy + 1);
  }

  ctx.restore();
}

function drawFallingDebrisShadow(ctx: CanvasRenderingContext2D, d: FallingDebris, time: number): void {
  if (d.state === 'impacted') return;
  const sy = d.y - d.groundZ;
  const warnPct =
    d.state === 'warning'
      ? Math.max(0.15, 1 - d.warnTimer / Math.max(0.1, d.maxWarn))
      : 1;
  const pulse = 0.5 + 0.5 * Math.sin(time * 22);

  ctx.save();
  // Dark shadow under rock
  ctx.fillStyle = `rgba(2, 6, 23, ${(0.25 + warnPct * 0.42).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(d.x, sy, d.radius * warnPct, d.radius * 0.52 * warnPct, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pulsing target ring
  ctx.strokeStyle = d.state === 'falling' || pulse > 0.45 ? '#FB7185' : '#FBBF24';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.ellipse(d.x, sy, d.radius, d.radius * 0.52, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crisp caution glyph inside ring
  ctx.font = '800 12px "Outfit", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = pulse > 0.5 ? '#FEF08A' : '#FB7185';
  ctx.fillText('▼', d.x, sy);
  ctx.restore();
}

function drawFallingDebrisRock(ctx: CanvasRenderingContext2D, d: FallingDebris, time: number): void {
  if (d.state === 'warning') return;

  if (d.state === 'impacted') {
    const t = 1 - Math.max(0, d.impactTimer / 0.45);
    const sy = d.y - d.groundZ;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + d.seed * 3;
      const dist = 10 + t * 44;
      const rx = d.x + Math.cos(ang) * dist;
      const ry = sy + Math.sin(ang) * dist * 0.48 - Math.sin(t * Math.PI) * 18;
      ctx.fillStyle = d.rockKind === 'obsidian' ? (i % 2 === 0 ? '#581C87' : '#334155') : '#64748B';
      ctx.fillRect(Math.round(rx) - 4, Math.round(ry) - 4, 8, 7);
    }
    ctx.restore();
    return;
  }

  const drawX = d.x;
  const drawY = d.y - d.z;
  const rot = time * (d.seed > 0.5 ? 6 : -6);

  ctx.save();
  ctx.translate(drawX, drawY);
  ctx.rotate(rot);

  if (d.rockKind === 'stalactite') {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-16, -24);
    ctx.lineTo(16, -22);
    ctx.lineTo(2, 26);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.moveTo(-14, -22);
    ctx.lineTo(0, -22);
    ctx.lineTo(1, 22);
    ctx.closePath();
    ctx.fill();
  } else {
    const isObsidian = d.rockKind === 'obsidian';
    ctx.fillStyle = isObsidian ? '#1E1B4B' : '#334155';
    ctx.beginPath();
    ctx.moveTo(-22, -10);
    ctx.lineTo(-8, -22);
    ctx.lineTo(16, -18);
    ctx.lineTo(22, 4);
    ctx.lineTo(8, 20);
    ctx.lineTo(-16, 16);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isObsidian ? '#6D28D9' : '#64748B';
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-6, -18);
    ctx.lineTo(10, -14);
    ctx.lineTo(2, 4);
    ctx.lineTo(-12, 8);
    ctx.closePath();
    ctx.fill();

    if (isObsidian) {
      ctx.fillStyle = '#C084FC';
      ctx.fillRect(-4, -10, 6, 4);
    }
  }

  ctx.restore();
}

function drawEnvironmentalHazardPlumes(
  ctx: CanvasRenderingContext2D,
  h: EnvironmentalHazard,
  time: number,
  weather: WeatherState
): void {
  const x0 = h.x1;
  const x1 = h.x2;
  const y0 = h.y1;
  const y1 = h.y2;
  const cols = Math.max(3, Math.floor((x1 - x0) / 28));
  const rows = Math.max(2, Math.floor((y1 - y0) / 52));
  const stormBoost = weather.currentKind === 'storm' ? 1.3 : 1;

  let fadeAlpha = 1;
  if (h.life !== undefined && h.maxLife) {
    const age = h.maxLife - h.life;
    fadeAlpha = Math.min(1, age / 0.35, h.life / 0.8);
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0.05, fadeAlpha);
  ctx.globalCompositeOperation = 'lighter';
  for (let r = 0; r <= rows; r++) {
    const py = y0 + 12 + (r / Math.max(1, rows)) * Math.max(8, y1 - y0 - 24);
    for (let c = 0; c < cols; c++) {
      const pxPos = x0 + 14 + (c / Math.max(1, cols - 1)) * Math.max(8, x1 - x0 - 28);
      const phase = time * 14 + c * 1.9 + r * 2.7;

      if (h.kind === 'electric_pool') {
        if (Math.sin(phase) > -0.1) {
          const arcH = (34 + (0.5 + 0.5 * Math.sin(phase * 1.7)) * 46) * stormBoost;
          const jitter = Math.sin(phase * 3.1) * 8;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pxPos, py);
          ctx.lineTo(pxPos + jitter * 0.6, py - arcH * 0.5);
          ctx.lineTo(pxPos + jitter, py - arcH);
          ctx.stroke();
          ctx.strokeStyle = '#F0F9FF';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      } else if (h.kind === 'poison_mire') {
        const plumeH = 24 + (0.5 + 0.5 * Math.sin(phase * 0.8)) * 32;
        const grad = ctx.createRadialGradient(pxPos, py - plumeH * 0.5, 2, pxPos, py - plumeH * 0.5, 18);
        grad.addColorStop(0, 'rgba(190, 242, 100, 0.65)');
        grad.addColorStop(1, 'rgba(74, 222, 128, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pxPos, py - plumeH * 0.6, 16, 0, Math.PI * 2);
        ctx.fill();
      } else if (h.kind === 'frost_fissure') {
        const spikeH = 32 + ((c + r) % 3) * 14;
        ctx.fillStyle = 'rgba(34, 211, 238, 0.72)';
        ctx.beginPath();
        ctx.moveTo(pxPos - 6, py);
        ctx.lineTo(pxPos, py - spikeH);
        ctx.lineTo(pxPos + 6, py);
        ctx.closePath();
        ctx.fill();
      } else {
        const isEclipse = h.kind === 'eclipse_fire';
        const flameH = 40 + (0.5 + 0.5 * Math.sin(phase)) * 40;
        const sway = Math.sin(phase * 1.3) * 6;
        const grad = ctx.createLinearGradient(pxPos, py, pxPos + sway, py - flameH);
        grad.addColorStop(0, isEclipse ? 'rgba(225, 29, 72, 0.85)' : 'rgba(234, 88, 12, 0.85)');
        grad.addColorStop(0.6, isEclipse ? 'rgba(251, 113, 133, 0.7)' : 'rgba(250, 204, 21, 0.75)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(pxPos - 8, py);
        ctx.quadraticCurveTo(pxPos - 4, py - flameH * 0.55, pxPos + sway, py - flameH);
        ctx.quadraticCurveTo(pxPos + 6, py - flameH * 0.45, pxPos + 8, py);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// ============================================================
// MULTI-LAYER ELEVATED PLATFORMS
// ============================================================
function drawPixelPlatform(ctx: CanvasRenderingContext2D, plat: Platform): void {
  const x0 = px(plat.x1);
  const x1 = px(plat.x2);
  const w = x1 - x0;
  const yFloor = px(plat.y1);
  const yBottom = px(plat.y2);
  const depthH = Math.max(12, yBottom - yFloor);
  const elev = px(plat.z);
  const topY = yFloor - elev;

  ctx.fillStyle = 'rgba(4, 6, 14, 0.5)';
  ctx.fillRect(x0 + 3, yFloor, w - 6, depthH);

  const pillarColor =
    plat.style === 'roof'
      ? '#3B2314'
      : plat.style === 'bamboo_deck'
        ? '#124D2D'
        : plat.style === 'catwalk'
          ? '#334155'
          : '#29151E';
  ctx.fillStyle = pillarColor;
  ctx.fillRect(x0 + 7, topY + 8, 6, elev + depthH - 8);
  ctx.fillRect(x1 - 13, topY + 8, 6, elev + depthH - 8);

  if (plat.style === 'roof') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x0, topY, w, depthH);
    for (let tx = x0 + 3; tx < x1 - 6; tx += 9) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(tx, topY + 2, 6, depthH - 4);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(tx + 1, topY + 2, 3, depthH - 5);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(tx, topY + depthH - 4, 6, 3);
    }
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(x0, topY, w, 2);
  } else if (plat.style === 'bamboo_deck') {
    ctx.fillStyle = '#16422A';
    ctx.fillRect(x0, topY, w, depthH);
    for (let tx = x0 + 2; tx < x1 - 4; tx += 8) {
      ctx.fillStyle = '#266E46';
      ctx.fillRect(tx, topY + 2, 5, depthH - 4);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(tx + 1, topY + 2, 2, depthH - 5);
    }
    ctx.fillStyle = '#86EFAC';
    ctx.fillRect(x0, topY, w, 2);
  } else if (plat.style === 'catwalk') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x0, topY, w, depthH);
    ctx.fillStyle = '#475569';
    for (let tx = x0 + 3; tx < x1 - 6; tx += 8) {
      ctx.fillRect(tx, topY + 3, 4, depthH - 6);
    }
    ctx.fillStyle = '#22D3EE';
    ctx.fillRect(x0, topY, w, 2);
    ctx.fillStyle = '#F59E0B';
    for (let hx = x0; hx < x1 - 6; hx += 14) {
      ctx.fillRect(hx, topY + depthH - 3, 7, 3);
    }
  } else {
    ctx.fillStyle = '#4A1827';
    ctx.fillRect(x0, topY, w, depthH);
    ctx.fillStyle = '#6B2236';
    ctx.fillRect(x0 + 3, topY + 3, w - 6, depthH - 6);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(x0, topY, w, 3);
  }
}

// ============================================================
// STAGE 1: TEMPLOS DA LUA (640x360 Realistic 16-Bit Art)
// ============================================================
function drawVillageBackdrop(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  ctx.fillStyle = '#03061A';
  ctx.fillRect(-10, -6, PIXEL_WIDTH + 20, P_FLOOR_TOP + 10);

  ctx.fillStyle = '#CBD5E1';
  for (let i = 0; i < 28; i++) {
    const sx = ((i * 89 + 29 - Math.floor(pCam * 0.04)) % PIXEL_WIDTH + PIXEL_WIDTH) % PIXEL_WIDTH;
    const sy = 10 + ((i * 37) % 88);
    if (Math.sin(time * 3 + i) > -0.3) ctx.fillRect(sx, sy, 1, 1);
  }

  // Layer 1 (0.05x): Crimson Full Moon
  const mx = 480 - Math.floor(pCam * 0.05);
  const my = 62;
  ctx.fillStyle = 'rgba(225, 29, 72, 0.22)';
  fillPixelCircle(ctx, mx, my, 46);
  ctx.fillStyle = '#9F1239';
  fillPixelCircle(ctx, mx, my, 30);
  ctx.fillStyle = '#E11D48';
  fillPixelCircle(ctx, mx - 2, my - 2, 26);
  ctx.fillStyle = '#FB7185';
  fillPixelCircle(ctx, mx - 6, my - 6, 16);

  // Layer 2 (0.14x): Mountain Range
  const mOff = -(Math.floor(pCam * 0.14) % 240);
  ctx.fillStyle = '#090F29';
  for (let rep = -1; rep < 4; rep++) {
    const bx = mOff + rep * 240;
    drawPixelTriangle(ctx, bx, P_FLOOR_TOP, bx + 85, 96, bx + 175, P_FLOOR_TOP);
    drawPixelTriangle(ctx, bx + 115, P_FLOOR_TOP, bx + 190, 108, bx + 265, P_FLOOR_TOP);
  }

  // Layer 3 (0.38x): Detailed Japanese Dojo Pavilions & Bamboo Groves
  const dOff = -(Math.floor(pCam * 0.38) % 390);
  for (let rep = -1; rep < 3; rep++) {
    const dx = dOff + rep * 390;
    drawJapaneseDojoFacade(ctx, dx + 26, P_FLOOR_TOP, 206, 114);
    for (let b = 0; b < 5; b++) {
      drawThickBambooStalk(ctx, dx + 258 + b * 21, 0, P_FLOOR_TOP, b % 2 === 0 ? 10 : 8, 32, b * 11);
    }
  }
}

function drawVillageFloor(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  for (let wx = Math.floor(start / 330) * 330; wx < end; wx += 330) {
    drawCastleStoneWall(ctx, wx, P_FLOOR_TOP, 204, 54);
  }

  // Seamless 5-tone Blue-Slate River Cobblestone Paving
  const pat = getCobblePattern(ctx, 'slate_cobble', '#070C1A', '#15233E', '#23385E', '#3A598C', '#6A8EC7');
  ctx.fillStyle = pat ?? '#15233E';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);

  // Wooden Bridge Segment in Zone 2
  const bStart = 630;
  const bEnd = 1140;
  if (end > bStart && start < bEnd) {
    const bx0 = Math.max(start, bStart);
    const bx1 = Math.min(end, bEnd);
    ctx.fillStyle = '#2B1912';
    ctx.fillRect(bx0, P_FLOOR_TOP, bx1 - bx0, PIXEL_HEIGHT - P_FLOOR_TOP);
    for (let x = Math.floor(bx0 / 18) * 18; x <= bx1; x += 18) {
      if (x < bStart || x > bEnd) continue;
      ctx.fillStyle = '#4A2C21';
      ctx.fillRect(x, P_FLOOR_TOP, 14, PIXEL_HEIGHT - P_FLOOR_TOP);
      ctx.fillStyle = '#6B4030';
      ctx.fillRect(x + 1, P_FLOOR_TOP, 3, PIXEL_HEIGHT - P_FLOOR_TOP);
    }
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(bx0, P_FLOOR_TOP - 26, bx1 - bx0, 5);
    for (let pxPos = Math.floor(bx0 / 72) * 72; pxPos <= bx1; pxPos += 72) {
      if (pxPos < bStart || pxPos > bEnd) continue;
      ctx.fillRect(pxPos - 3, P_FLOOR_TOP - 31, 7, 32);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(pxPos - 4, P_FLOOR_TOP - 33, 9, 3);
      ctx.fillStyle = '#7F1D1D';
    }
  }

  for (let lx = 90; lx <= 1860; lx += 195) {
    if (lx < start - 30 || lx > end + 30) continue;
    const flick = Math.sin(time * 6 + lx) > 0 ? 1 : 0;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(lx, P_FLOOR_TOP - 50, 3, 50);
    ctx.fillRect(lx, P_FLOOR_TOP - 50, 12, 3);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.fillRect(lx - 2, P_FLOOR_TOP - 50, 24 + flick * 2, 26);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(lx + 6, P_FLOOR_TOP - 43, 9, 13);
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(lx + 8, P_FLOOR_TOP - 40, 5, 8);
  }
}

// ============================================================
// STAGE 2: BAMBUZAL & CACHOEIRAS (Matching Reference Screenshot!)
// ============================================================
function drawBambooBackdrop(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  ctx.fillStyle = '#03061A';
  ctx.fillRect(-10, -6, PIXEL_WIDTH + 20, P_FLOOR_TOP + 10);

  // Layer 1 (0.05x): Emerald Moon
  const mx = 425 - Math.floor(pCam * 0.05);
  const my = 56;
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  fillPixelCircle(ctx, mx, my, 40);
  ctx.fillStyle = '#10B981';
  fillPixelCircle(ctx, mx, my, 24);
  ctx.fillStyle = '#6EE7B7';
  fillPixelCircle(ctx, mx - 4, my - 4, 16);

  // Layer 2 (0.18x): Distant Rocky Cliffs & Animated Pixel Waterfalls
  const wOff = -(Math.floor(pCam * 0.18) % 360);
  const flowOffset = Math.floor(time * 60) % 18;
  for (let rep = -1; rep < 3; rep++) {
    const cx = wOff + rep * 360;
    ctx.fillStyle = '#0B1A26';
    ctx.fillRect(cx + 24, 64, 110, P_FLOOR_TOP - 64);
    ctx.fillStyle = '#132B3A';
    ctx.fillRect(cx + 32, 70, 30, P_FLOOR_TOP - 70);
    ctx.fillStyle = '#0EA5E9';
    ctx.fillRect(cx + 66, 66, 36, P_FLOOR_TOP - 66);
    ctx.fillStyle = '#7DD3FC';
    for (let y = 66 + flowOffset; y < P_FLOOR_TOP; y += 18) {
      ctx.fillRect(cx + 72, y, 6, 9);
      ctx.fillRect(cx + 86, ((y + 7) % (P_FLOOR_TOP - 66)) + 66, 7, 7);
    }
    ctx.fillStyle = '#E0F2FE';
    ctx.fillRect(cx + 60, P_FLOOR_TOP - 9, 48, 9);
  }

  // Layer 3 (0.36x): Japanese Temple Building behind the bamboo grove
  const dOff = -(Math.floor(pCam * 0.36) % 420);
  for (let rep = -1; rep < 3; rep++) {
    drawJapaneseDojoFacade(ctx, dOff + rep * 420 + 100, P_FLOOR_TOP, 260, 122);
  }

  // Layer 4 (0.58x): Thick 5-Tone Segmented Green Bamboo Stalks!
  const b2 = -(Math.floor(pCam * 0.58) % 270);
  for (let rep = -1; rep < 4; rep++) {
    const gx = b2 + rep * 270;
    drawThickBambooStalk(ctx, gx + 18, 0, P_FLOOR_TOP, 10, 34, 6);
    drawThickBambooStalk(ctx, gx + 42, 0, P_FLOOR_TOP, 8, 29, 16);
    drawThickBambooStalk(ctx, gx + 70, 0, P_FLOOR_TOP, 12, 36, 3);
    drawThickBambooStalk(ctx, gx + 100, 0, P_FLOOR_TOP, 9, 32, 14);
    drawThickBambooStalk(ctx, gx + 154, 0, P_FLOOR_TOP, 11, 34, 8);
    drawThickBambooStalk(ctx, gx + 186, 0, P_FLOOR_TOP, 8, 28, 20);
    drawThickBambooStalk(ctx, gx + 222, 0, P_FLOOR_TOP, 12, 33, 0);
  }
}

function drawBambooFloor(ctx: CanvasRenderingContext2D, pCam: number, _time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  for (let wx = Math.floor(start / 380) * 380; wx < end; wx += 380) {
    drawCastleStoneWall(ctx, wx, P_FLOOR_TOP, 180, 56);
  }

  const pat = getCobblePattern(ctx, 'bamboo_cobble', '#070C1A', '#162544', '#253D69', '#3E6099', '#7098D4');
  ctx.fillStyle = pat ?? '#162544';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);

  const tx = 960;
  if (end > tx - 120 && start < tx + 120) {
    ctx.fillStyle = '#047857';
    ctx.fillRect(tx - 50, P_FLOOR_TOP - 110, 12, 110);
    ctx.fillRect(tx + 38, P_FLOOR_TOP - 110, 12, 110);
    ctx.fillRect(tx - 68, P_FLOOR_TOP - 86, 136, 9);
    ctx.fillStyle = '#065F46';
    ctx.fillRect(tx - 80, P_FLOOR_TOP - 114, 160, 10);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(tx - 84, P_FLOOR_TOP - 118, 168, 4);
  }

  for (let lx = 120; lx <= 1820; lx += 225) {
    if (lx < start - 30 || lx > end + 30) continue;
    ctx.fillStyle = '#334155';
    ctx.fillRect(lx, P_FLOOR_TOP - 32, 12, 32);
    ctx.fillStyle = '#475569';
    ctx.fillRect(lx - 3, P_FLOOR_TOP - 38, 18, 7);
    ctx.fillStyle = '#34D399';
    ctx.fillRect(lx + 3, P_FLOOR_TOP - 28, 6, 7);
  }
}

// ============================================================
// STAGE 3: METRÓPOLE NÉON & FERROVIA (640x360)
// ============================================================
function drawNeonCityBackdrop(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  ctx.fillStyle = '#060417';
  ctx.fillRect(-10, -6, PIXEL_WIDTH + 20, P_FLOOR_TOP + 10);

  const sOff = -(Math.floor(pCam * 0.15) % 330);
  for (let rep = -1; rep < 3; rep++) {
    const sx = sOff + rep * 330;
    ctx.fillStyle = '#110D22';
    ctx.fillRect(sx + 15, 70, 54, 126);
    ctx.fillRect(sx + 84, 42, 72, 154);
    ctx.fillRect(sx + 170, 84, 58, 112);
    ctx.fillRect(sx + 242, 58, 66, 138);
    ctx.fillStyle = '#FBBF24';
    for (let wy = 54; wy < 164; wy += 13) {
      ctx.fillRect(sx + 96, wy, 6, 6);
      ctx.fillRect(sx + 120, wy + 6, 6, 6);
      ctx.fillRect(sx + 256, wy + 10, 6, 6);
    }
  }

  const nOff = -(Math.floor(pCam * 0.35) % 360);
  const pulse = Math.floor(time * 4) % 2 === 0;
  for (let rep = -1; rep < 3; rep++) {
    const nx = nOff + rep * 360;
    ctx.fillStyle = '#191430';
    ctx.fillRect(nx + 26, 96, 92, 100);
    ctx.fillRect(nx + 176, 82, 110, 114);

    ctx.fillStyle = '#083344';
    ctx.fillRect(nx + 38, 104, 22, 56);
    ctx.strokeStyle = pulse ? '#22D3EE' : '#06B6D4';
    ctx.lineWidth = 1;
    ctx.strokeRect(nx + 38, 104, 22, 56);
    ctx.fillStyle = '#A5F3FC';
    ctx.fillRect(nx + 44, 112, 9, 6);
    ctx.fillRect(nx + 44, 126, 9, 9);
    ctx.fillRect(nx + 44, 142, 9, 9);

    ctx.fillStyle = '#4A044E';
    ctx.fillRect(nx + 188, 96, 84, 24);
    ctx.strokeStyle = pulse ? '#F472B6' : '#E879F9';
    ctx.strokeRect(nx + 188, 96, 84, 24);
    ctx.fillStyle = '#F5D0FE';
    ctx.fillRect(nx + 198, 105, 18, 6);
    ctx.fillRect(nx + 222, 105, 18, 6);
    ctx.fillRect(nx + 246, 105, 18, 6);
  }

  // Elevated Steel Railway Viaduct + Detailed Passing Train
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(-10, 162, PIXEL_WIDTH + 20, 14);
  ctx.fillStyle = '#334155';
  ctx.fillRect(-10, 159, PIXEL_WIDTH + 20, 4);
  const trestleOff = -(Math.floor(pCam * 0.58) % 96);
  for (let tx = trestleOff; tx < PIXEL_WIDTH + 48; tx += 96) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(tx, 176, 12, 22);
  }
  const trainX = ((Math.floor(time * 140) - Math.floor(pCam * 0.58)) % 1020 + 1020) % 1020 - 260;
  for (let c = 0; c < 3; c++) {
    const cx = trainX + c * 82;
    ctx.fillStyle = '#334155';
    ctx.fillRect(cx, 136, 72, 22);
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx + 2, 138, 68, 4);
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(cx, 148, 72, 4);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(cx + 8, 140, 12, 6);
    ctx.fillRect(cx + 30, 140, 12, 6);
    ctx.fillRect(cx + 52, 140, 12, 6);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(cx + 8, 158, 7, 3);
    ctx.fillRect(cx + 54, 158, 7, 3);
  }
}

function drawNeonCityFloor(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(start, P_FLOOR_TOP - 20, end - start, 20);
  ctx.fillStyle = '#22D3EE';
  ctx.fillRect(start, P_FLOOR_TOP - 20, end - start, 2);

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);
  for (let x = start; x < end; x += 26) {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x, P_FLOOR_TOP, 24, 14);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + 2, P_FLOOR_TOP, 20, 3);
  }

  ctx.fillStyle = '#F59E0B';
  for (let x = start; x < end; x += 42) {
    ctx.fillRect(x, P_FLOOR_TOP + 68, 22, 3);
  }

  const flick = Math.floor(time * 6) % 2;
  for (let pxPos = 180; pxPos <= 1830; pxPos += 285) {
    if (pxPos < start - 60 || pxPos > end + 60) continue;
    ctx.fillStyle = 'rgba(217, 70, 239, 0.25)';
    ctx.fillRect(pxPos, P_FLOOR_TOP + 34, 42 + flick * 3, 9);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.28)';
    ctx.fillRect(pxPos + 18, P_FLOOR_TOP + 92, 36, 8);
  }

  for (let lx = 135; lx <= 1830; lx += 225) {
    if (lx < start - 30 || lx > end + 30) continue;
    ctx.fillStyle = '#334155';
    ctx.fillRect(lx, P_FLOOR_TOP - 56, 5, 56);
    ctx.fillRect(lx, P_FLOOR_TOP - 56, 15, 4);
    ctx.fillStyle = '#22D3EE';
    ctx.fillRect(lx + 9, P_FLOOR_TOP - 52, 7, 4);
  }
}

// ============================================================
// STAGE 4: BASE & LABORATÓRIO DO SHOGUN (640x360)
// ============================================================
function drawFortressBackdrop(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  drawDitherBand(ctx, -6, 68, '#100409', '#200710');
  drawDitherBand(ctx, 62, 66, '#200710', '#380C18');
  drawDitherBand(ctx, 128, 76, '#380C18', '#4F141B');

  const cOff = -(Math.floor(pCam * 0.16) % 360);
  for (let rep = -1; rep < 3; rep++) {
    const cx = cOff + rep * 360;
    ctx.fillStyle = '#1E080E';
    ctx.fillRect(cx + 60, 68, 128, 128);
    ctx.fillRect(cx + 42, 62, 164, 12);
    ctx.fillRect(cx + 74, 36, 98, 30);
    ctx.fillRect(cx + 60, 30, 128, 9);
    ctx.fillRect(cx + 224, 50, 20, 146);
    ctx.fillRect(cx + 260, 72, 18, 124);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(cx + 102, 86, 14, 18);
    ctx.fillRect(cx + 132, 86, 14, 18);
  }

  const lOff = -(Math.floor(pCam * 0.4) % 270);
  const bubbleY = Math.floor(time * 26) % 36;
  for (let rep = -1; rep < 4; rep++) {
    const lx = lOff + rep * 270;
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(lx + 44, 92, 48, 102);
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(lx + 50, 102, 36, 80);
    ctx.fillStyle = '#10B981';
    ctx.fillRect(lx + 56, 110, 24, 66);
    ctx.fillStyle = '#A7F3D0';
    ctx.fillRect(lx + 62, 168 - bubbleY, 6, 6);
    ctx.fillRect(lx + 72, 152 - ((bubbleY + 18) % 36), 4, 4);
  }

  ctx.fillStyle = '#FBBF24';
  for (let i = 0; i < 24; i++) {
    const ex = ((i * 79 + Math.floor(time * 18)) % PIXEL_WIDTH + PIXEL_WIDTH) % PIXEL_WIDTH;
    const ey = ((196 - Math.floor(time * 36 + i * 28)) % 180 + 180) % 180;
    ctx.fillRect(ex, ey, 2, 2);
  }
}

function drawFortressFloor(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  ctx.fillStyle = '#1C1118';
  ctx.fillRect(start, P_FLOOR_TOP - 42, end - start, 42);
  ctx.fillStyle = '#331A22';
  for (let x = start; x <= end; x += 42) {
    ctx.fillRect(x, P_FLOOR_TOP - 50, 24, 9);
  }

  const pat = getCobblePattern(ctx, 'fortress_cobble', '#0D0710', '#1A1120', '#291B33', '#3D294A', '#5E4270');
  ctx.fillStyle = pat ?? '#1A1120';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);

  ctx.fillStyle = '#6B1226';
  ctx.fillRect(start, P_FLOOR_TOP + 38, end - start, 68);
  ctx.fillStyle = '#B45309';
  ctx.fillRect(start, P_FLOOR_TOP + 38, end - start, 3);
  ctx.fillRect(start, P_FLOOR_TOP + 104, end - start, 3);

  for (let pxPos = 105; pxPos <= 1830; pxPos += 210) {
    if (pxPos < start - 45 || pxPos > end + 45) continue;
    ctx.fillStyle = '#29151C';
    ctx.fillRect(pxPos - 7, P_FLOOR_TOP - 114, 15, 114);
    ctx.fillStyle = '#9F1239';
    ctx.fillRect(pxPos - 5, P_FLOOR_TOP - 96, 11, 54);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(pxPos - 3, P_FLOOR_TOP - 78, 6, 6);

    const bx = pxPos + 36;
    const flick = Math.floor(time * 10 + pxPos) % 2;
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx, P_FLOOR_TOP - 15, 15, 15);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fillRect(bx - 7, P_FLOOR_TOP - 36, 30, 30);
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(bx + 2, P_FLOOR_TOP - 25 - flick * 2, 11, 10 + flick * 2);
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(bx + 5, P_FLOOR_TOP - 22 - flick * 2, 5, 7);
  }
}

// ============================================================
// STAGE 5: PORTO DA NÉVOA (Docas & Navios Negreiros)
// ============================================================
function drawHarborBackdrop(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  drawDitherBand(ctx, -6, 74, '#030816', '#0B1730');
  drawDitherBand(ctx, 68, 66, '#0B1730', '#13284A');
  drawDitherBand(ctx, 134, 64, '#0B1D36', '#163554');

  // Pale mist moon
  const mx = 460 - Math.floor(pCam * 0.05);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
  fillPixelCircle(ctx, mx, 54, 34);
  ctx.fillStyle = '#E0F2FE';
  fillPixelCircle(ctx, mx, 54, 21);

  // Moonlit ocean strip + waves
  ctx.fillStyle = '#0B2545';
  ctx.fillRect(-10, 142, PIXEL_WIDTH + 20, 56);
  ctx.fillStyle = '#38BDF8';
  const waveShift = Math.floor(time * 28) % 24;
  for (let wx = -waveShift; wx < PIXEL_WIDTH + 24; wx += 24) {
    ctx.fillRect(wx, 152, 12, 2);
    ctx.fillRect(wx + 8, 168, 10, 2);
  }

  // Anchored Samurai Junk Ships with swaying lanterns
  const sOff = -(Math.floor(pCam * 0.28) % 360);
  const bob = Math.round(Math.sin(time * 2.2) * 2);
  for (let rep = -1; rep < 3; rep++) {
    const sx = sOff + rep * 360 + 50;
    ctx.fillStyle = '#1E1B18';
    ctx.fillRect(sx + 10, 138 + bob, 130, 34);
    ctx.fillRect(sx, 128 + bob, 150, 12);
    // Masts & Ribbed Sails
    ctx.fillStyle = '#44403C';
    ctx.fillRect(sx + 50, 44 + bob, 6, 86);
    ctx.fillRect(sx + 104, 58 + bob, 5, 72);
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx + 26, 54 + bob, 50, 58);
    ctx.fillRect(sx + 84, 68 + bob, 42, 46);
    ctx.fillStyle = '#0F172A';
    for (let ry = 62 + bob; ry < 110 + bob; ry += 10) {
      ctx.fillRect(sx + 26, ry, 50, 2);
    }
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(sx + 12, 124 + bob, 8, 8);
    ctx.fillRect(sx + 132, 124 + bob, 8, 8);
  }
}

function drawHarborFloor(ctx: CanvasRenderingContext2D, pCam: number, _time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(start, P_FLOOR_TOP - 16, end - start, 16);
  // Weathered timber dock planks
  ctx.fillStyle = '#2B1B12';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);
  for (let x = start; x < end; x += 20) {
    ctx.fillStyle = x % 40 === 0 ? '#4A2E1E' : '#3E2518';
    ctx.fillRect(x, P_FLOOR_TOP + 2, 18, PIXEL_HEIGHT - P_FLOOR_TOP - 4);
    ctx.fillStyle = '#6B442E';
    ctx.fillRect(x + 1, P_FLOOR_TOP + 2, 3, PIXEL_HEIGHT - P_FLOOR_TOP - 4);
  }
  for (let bx = 90; bx <= 1860; bx += 220) {
    if (bx < start - 30 || bx > end + 30) continue;
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(bx, P_FLOOR_TOP - 32, 14, 32);
    ctx.fillStyle = '#78716C';
    ctx.fillRect(bx - 2, P_FLOOR_TOP - 34, 18, 4);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(bx + 4, P_FLOOR_TOP - 20, 6, 8);
  }
}

// ============================================================
// STAGE 6: MINAS DE OBSIDIANA (Cavernas & Cristais Sombrios)
// ============================================================
function drawMinesBackdrop(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  drawDitherBand(ctx, -6, 80, '#09070C', '#1A111D');
  drawDitherBand(ctx, 74, 124, '#1A111D', '#291726');

  // Cavern Stalactites
  const cOff = -(Math.floor(pCam * 0.2) % 240);
  ctx.fillStyle = '#0D0812';
  for (let rep = -1; rep < 4; rep++) {
    const cx = cOff + rep * 240;
    drawPixelTriangle(ctx, cx, 0, cx + 22, 62, cx + 44, 0);
    drawPixelTriangle(ctx, cx + 80, 0, cx + 106, 78, cx + 134, 0);
    drawPixelTriangle(ctx, cx + 168, 0, cx + 190, 52, cx + 218, 0);
  }

  // Timber mine supports & glowing amber/crimson crystal clusters
  const mOff = -(Math.floor(pCam * 0.42) % 280);
  const glow = Math.floor(time * 5) % 2 === 0;
  for (let rep = -1; rep < 4; rep++) {
    const mx = mOff + rep * 280;
    ctx.fillStyle = '#3B2314';
    ctx.fillRect(mx + 20, 44, 14, P_FLOOR_TOP - 44);
    ctx.fillRect(mx + 140, 44, 14, P_FLOOR_TOP - 44);
    ctx.fillRect(mx + 14, 44, 146, 12);

    ctx.fillStyle = glow ? '#F97316' : '#EA580C';
    drawPixelTriangle(ctx, mx + 72, P_FLOOR_TOP, mx + 86, P_FLOOR_TOP - 46, mx + 100, P_FLOOR_TOP);
    ctx.fillStyle = '#FDE047';
    drawPixelTriangle(ctx, mx + 80, P_FLOOR_TOP, mx + 86, P_FLOOR_TOP - 32, mx + 92, P_FLOOR_TOP);
  }
}

function drawMinesFloor(ctx: CanvasRenderingContext2D, pCam: number, _time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  ctx.fillStyle = '#16111B';
  ctx.fillRect(start, P_FLOOR_TOP - 14, end - start, 14);
  const pat = getCobblePattern(ctx, 'mines_cobble', '#09060E', '#1C1626', '#2D223B', '#463559', '#6C5387');
  ctx.fillStyle = pat ?? '#1C1626';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);

  // Iron minecart rails
  ctx.fillStyle = '#475569';
  ctx.fillRect(start, P_FLOOR_TOP + 52, end - start, 3);
  ctx.fillRect(start, P_FLOOR_TOP + 68, end - start, 3);
  ctx.fillStyle = '#4B2E1E';
  for (let tx = start; tx < end; tx += 18) {
    ctx.fillRect(tx, P_FLOOR_TOP + 48, 6, 26);
  }
}

// ============================================================
// STAGE 7: PICO NEVADO AKAGI (Penhascos & Tempestade Branca)
// ============================================================
function drawSnowPeakBackdrop(ctx: CanvasRenderingContext2D, pCam: number, _time: number): void {
  drawDitherBand(ctx, -6, 70, '#071324', '#102A43');
  drawDitherBand(ctx, 64, 134, '#102A43', '#1E3A5F');

  const mx = 440 - Math.floor(pCam * 0.05);
  ctx.fillStyle = 'rgba(225, 29, 72, 0.2)';
  fillPixelCircle(ctx, mx, 58, 38);
  ctx.fillStyle = '#E11D48';
  fillPixelCircle(ctx, mx, 58, 24);

  const mOff = -(Math.floor(pCam * 0.16) % 280);
  for (let rep = -1; rep < 4; rep++) {
    const bx = mOff + rep * 280;
    ctx.fillStyle = '#1E3A5F';
    drawPixelTriangle(ctx, bx, P_FLOOR_TOP, bx + 90, 56, bx + 180, P_FLOOR_TOP);
    ctx.fillStyle = '#E2E8F0';
    drawPixelTriangle(ctx, bx + 62, 100, bx + 90, 56, bx + 118, 100);
    ctx.fillStyle = '#0F2540';
    drawPixelTriangle(ctx, bx + 130, P_FLOOR_TOP, bx + 210, 74, bx + 290, P_FLOOR_TOP);
    ctx.fillStyle = '#CBD5E1';
    drawPixelTriangle(ctx, bx + 184, 114, bx + 210, 74, bx + 236, 114);
  }

  const pOff = -(Math.floor(pCam * 0.42) % 300);
  for (let rep = -1; rep < 4; rep++) {
    const pxPos = pOff + rep * 300;
    ctx.fillStyle = '#0B1D2E';
    drawPixelTriangle(ctx, pxPos + 24, P_FLOOR_TOP, pxPos + 54, 104, pxPos + 84, P_FLOOR_TOP);
    ctx.fillStyle = '#F8FAFC';
    drawPixelTriangle(ctx, pxPos + 38, 134, pxPos + 54, 104, pxPos + 70, 134);
  }
}

function drawSnowPeakFloor(ctx: CanvasRenderingContext2D, pCam: number, _time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(start, P_FLOOR_TOP - 8, end - start, 8);
  const pat = getCobblePattern(ctx, 'snow_cobble', '#1E293B', '#475569', '#64748B', '#94A3B8', '#E2E8F0');
  ctx.fillStyle = pat ?? '#64748B';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);

  ctx.fillStyle = '#E0F2FE';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, 6);
}

// ============================================================
// STAGE 8: FLORESTA DO SANTUÁRIO (Mata Sombria, Neblina & Selos Antigos)
// ============================================================
function drawTempleRuinsBackdrop(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  drawDitherBand(ctx, -6, 90, '#040B10', '#0D1E21');
  drawDitherBand(ctx, 84, 114, '#0D1E21', '#152E2B');

  // Twisted haunted forest trees framing the sanctuary ruins
  const tOff = -(Math.floor(pCam * 0.22) % 240);
  for (let rep = -1; rep < 4; rep++) {
    const tx = tOff + rep * 240;
    ctx.fillStyle = '#091A16';
    ctx.fillRect(tx + 8, 22, 18, P_FLOOR_TOP - 22);
    ctx.fillRect(tx + 114, 34, 14, P_FLOOR_TOP - 34);
    ctx.fillStyle = '#0F2E24';
    fillPixelCircle(ctx, tx + 17, 28, 30);
    fillPixelCircle(ctx, tx + 121, 36, 26);
  }

  const pOff = -(Math.floor(pCam * 0.38) % 260);
  const pulse = Math.floor(time * 4) % 2 === 0;
  for (let rep = -1; rep < 4; rep++) {
    const sx = pOff + rep * 260;
    ctx.fillStyle = '#1E1B38';
    ctx.fillRect(sx + 24, 24, 34, P_FLOOR_TOP - 24);
    ctx.fillRect(sx + 18, 24, 46, 12);
    ctx.fillRect(sx + 160, 48, 62, P_FLOOR_TOP - 48);
    // Moss patches on ruins
    ctx.fillStyle = '#14532D';
    ctx.fillRect(sx + 24, 36, 12, 18);
    ctx.fillRect(sx + 162, 140, 20, 14);
    // Glowing arcane kanji rune seal
    ctx.fillStyle = pulse ? '#2DD4BF' : '#A78BFA';
    ctx.fillRect(sx + 177, 74, 28, 28);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(sx + 183, 80, 16, 16);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(sx + 189, 86, 4, 4);
  }
}

function drawTempleRuinsFloor(ctx: CanvasRenderingContext2D, pCam: number, _time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  ctx.fillStyle = '#1E1B38';
  ctx.fillRect(start, P_FLOOR_TOP - 18, end - start, 18);
  const pat = getCobblePattern(ctx, 'ruins_cobble', '#090714', '#1C1736', '#2D2554', '#463A7D', '#7665B5');
  ctx.fillStyle = pat ?? '#1C1736';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);
}

// ============================================================
// STAGE 9: TREM BLINDADO (Vagões em Alta Velocidade)
// ============================================================
function drawBulletTrainBackdrop(ctx: CanvasRenderingContext2D, _pCam: number, time: number): void {
  drawDitherBand(ctx, -6, 86, '#050817', '#111833');
  drawDitherBand(ctx, 80, 118, '#111833', '#1E1B4B');

  // High-speed blurred night city lights streaking past!
  const streakOffset = Math.floor(time * 420) % 320;
  for (let rep = -1; rep < 4; rep++) {
    const sx = rep * 320 - streakOffset;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(sx + 20, 62, 64, 136);
    ctx.fillRect(sx + 120, 44, 84, 154);
    ctx.fillStyle = '#22D3EE';
    ctx.fillRect(sx + 28, 92, 46, 3);
    ctx.fillStyle = '#F472B6';
    ctx.fillRect(sx + 132, 74, 62, 3);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(sx + 220, 136, 54, 2);
  }
}

function drawBulletTrainFloor(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(start, P_FLOOR_TOP - 14, end - start, 14);
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);

  // Armored train roof ribs & car dividers
  const blink = Math.floor(time * 8) % 2 === 0;
  for (let x = start; x < end; x += 28) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, P_FLOOR_TOP + 2, 22, PIXEL_HEIGHT - P_FLOOR_TOP - 4);
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 2, P_FLOOR_TOP + 4, 18, 4);
  }
  ctx.fillStyle = blink ? '#F472B6' : '#E11D48';
  ctx.fillRect(start, P_FLOOR_TOP + 4, end - start, 3);
}

// ============================================================
// STAGE 10: CIDADELA DO ECLIPSE (Torre Suprema da Lua Negra)
// ============================================================
function drawEclipseCitadelBackdrop(ctx: CanvasRenderingContext2D, pCam: number, time: number): void {
  drawDitherBand(ctx, -6, 70, '#08020A', '#1E0618');
  drawDitherBand(ctx, 64, 134, '#1E0618', '#3B0A28');

  // Grand Solar-Crimson Eclipse Moon!
  const mx = 320 - Math.floor(pCam * 0.04);
  const my = 66;
  ctx.fillStyle = 'rgba(250, 204, 21, 0.24)';
  fillPixelCircle(ctx, mx, my, 52);
  ctx.fillStyle = '#FACC15';
  fillPixelCircle(ctx, mx, my, 36);
  ctx.fillStyle = '#E11D48';
  fillPixelCircle(ctx, mx, my, 31);
  ctx.fillStyle = '#09030A';
  fillPixelCircle(ctx, mx, my, 25);

  // Citadel gothic spires
  const sOff = -(Math.floor(pCam * 0.24) % 300);
  for (let rep = -1; rep < 4; rep++) {
    const sx = sOff + rep * 300;
    ctx.fillStyle = '#180512';
    ctx.fillRect(sx + 34, 62, 32, P_FLOOR_TOP - 62);
    drawPixelTriangle(ctx, sx + 26, 62, sx + 50, 20, sx + 74, 62);
    ctx.fillRect(sx + 170, 74, 48, P_FLOOR_TOP - 74);
    drawPixelTriangle(ctx, sx + 162, 74, sx + 194, 34, sx + 226, 74);
    ctx.fillStyle = Math.floor(time * 5 + rep) % 2 === 0 ? '#FACC15' : '#FB7185';
    ctx.fillRect(sx + 46, 86, 8, 18);
    ctx.fillRect(sx + 188, 96, 12, 20);
  }
}

function drawEclipseCitadelFloor(ctx: CanvasRenderingContext2D, pCam: number, _time: number): void {
  const start = Math.max(-60, Math.floor((pCam - 30) / 48) * 48);
  const end = pCam + PIXEL_WIDTH + 90;

  ctx.fillStyle = '#200614';
  ctx.fillRect(start, P_FLOOR_TOP - 24, end - start, 24);
  const pat = getCobblePattern(ctx, 'eclipse_cobble', '#090208', '#1A0717', '#2E0D28', '#4A183E', '#7A2A63');
  ctx.fillStyle = pat ?? '#1A0717';
  ctx.fillRect(start, P_FLOOR_TOP, end - start, PIXEL_HEIGHT - P_FLOOR_TOP);

  ctx.fillStyle = '#FACC15';
  ctx.fillRect(start, P_FLOOR_TOP + 34, end - start, 3);
  ctx.fillRect(start, P_FLOOR_TOP + 108, end - start, 3);
}

// ============================================================
// ENTITIES & PROPS IN HD-2D (1280x720 Lighting + Crisp Sprites)
// ============================================================
function drawPixelShadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  z: number,
  groundZ: number,
  halfW: number
): void {
  const sx = x;
  const sy = y - groundZ;
  const heightAboveGround = Math.max(0, z - groundZ);
  const shrink = Math.max(0.45, 1 - heightAboveGround / 240);
  const rx = Math.max(14, halfW * 2 * shrink);
  const ry = Math.max(5, rx * 0.34);
  const grad = ctx.createRadialGradient(sx, sy, rx * 0.15, sx, sy, rx);
  grad.addColorStop(0, 'rgba(4, 6, 14, 0.72)');
  grad.addColorStop(0.65, 'rgba(4, 6, 14, 0.38)');
  grad.addColorStop(1, 'rgba(4, 6, 14, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpriteCentered(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  x: number,
  y: number,
  z: number,
  facing: 1 | -1,
  squashX = 1,
  squashY = 1,
  lean = 0,
  spinAngle = 0
): void {
  const sx = Math.round(x);
  const sy = Math.round(y - z);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(sx, sy);
  ctx.scale(facing * 2 * squashX, 2 * squashY);
  if (lean !== 0) {
    ctx.transform(1, 0, -lean, 1, 0, 0);
  }
  if (spinAngle !== 0) {
    ctx.translate(0, -Math.round(sprite.height / 2));
    ctx.rotate(spinAngle);
    ctx.drawImage(sprite, -Math.round(sprite.width / 2), -Math.round(sprite.height / 2));
  } else {
    ctx.drawImage(sprite, -Math.round(sprite.width / 2), -sprite.height + 2);
  }
  ctx.restore();
}

function drawPixelCrate(ctx: CanvasRenderingContext2D, atlas: PixelSpriteAtlas, crate: Crate, time: number): void {
  drawPixelShadow(ctx, crate.x, crate.y, crate.z, crate.z, 14);
  const pair = atlas.props[crate.kind];
  const img = crate.hitFlashTimer > 0 ? pair.flash : pair.normal;
  const wobbleX = crate.wobble > 0 ? Math.sin(time * 48) * 4 : 0;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    Math.round(crate.x - img.width + wobbleX),
    Math.round(crate.y - crate.z - img.height * 2),
    img.width * 2,
    img.height * 2
  );
  ctx.restore();
}

function drawPixelPickup(ctx: CanvasRenderingContext2D, atlas: PixelSpriteAtlas, p: Pickup, time: number): void {
  const bob = Math.sin(time * 6 + p.bobPhase) * 6;
  drawPixelShadow(ctx, p.x, p.y, p.z + 10, p.z, 8);
  const img = atlas.pickups[p.kind];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(p.x, p.y - p.z - 16 + bob, 2, p.x, p.y - p.z - 16 + bob, 24);
  const c =
    p.kind === 'onigiri'
      ? '52, 211, 153'
      : p.kind === 'chi_scroll'
        ? '56, 189, 248'
        : p.kind === 'jade'
          ? '251, 191, 36'
          : '226, 232, 240';
  glow.addColorStop(0, `rgba(${c}, 0.35)`);
  glow.addColorStop(1, `rgba(${c}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y - p.z - 16 + bob, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    Math.round(p.x - img.width),
    Math.round(p.y - p.z - img.height * 2 - 6 + bob),
    img.width * 2,
    img.height * 2
  );
  ctx.restore();
}

function drawPixelAfterimage(ctx: CanvasRenderingContext2D, atlas: PixelSpriteAtlas, img: Afterimage): void {
  ctx.save();
  const sprintFrames = [
    atlas.player.run1,
    atlas.player.run2,
    atlas.player.run3,
    atlas.player.run4,
    atlas.player.run5,
    atlas.player.run6,
  ];
  const pair =
    img.pose === 'somersault'
      ? atlas.player.somersault1
      : img.pose === 'airKick'
        ? atlas.player.airKick
        : img.pose === 'air'
          ? atlas.player.jump
          : sprintFrames[(img.frameIndex ?? 0) % 6];

  const spr = img.tint === 'shadow' && pair.ghost ? pair.ghost : pair.flash;

  if (img.pose === 'dash' || img.tint === 'shadow') {
    const sx = img.x;
    const sy = img.y - img.z;
    ctx.globalAlpha = Math.max(0, img.alpha * 0.55);
    for (let s = 0; s < 3; s++) {
      const ly = sy - 32 - s * 28;
      const len = 34 + s * 10;
      const lx = img.facing > 0 ? sx - len - 8 : sx + 8;
      const grad = ctx.createLinearGradient(lx, ly, lx + len, ly);
      grad.addColorStop(0, img.facing > 0 ? 'rgba(56, 189, 248, 0)' : 'rgba(224, 242, 254, 0.9)');
      grad.addColorStop(1, img.facing > 0 ? 'rgba(224, 242, 254, 0.9)' : 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(lx, ly, len, 3);
    }
  }

  ctx.globalAlpha = Math.max(0, img.alpha * (img.tint === 'shadow' ? 0.58 : 0.44));
  drawSpriteCentered(
    ctx,
    spr,
    img.x,
    img.y,
    img.z,
    img.facing,
    img.squashX ?? 1,
    img.squashY ?? 1,
    img.lean ?? 0
  );
  ctx.restore();
}

function drawPixelShadowClone(
  ctx: CanvasRenderingContext2D,
  atlas: PixelSpriteAtlas,
  clone: ShadowClone,
  time: number
): void {
  drawPixelShadow(ctx, clone.x, clone.y, clone.z, clone.groundZ, 13);
  const fadeAlpha = clone.life < 1.2 ? Math.max(0.2, clone.life / 1.2) : 0.88;
  ctx.save();
  ctx.globalAlpha = fadeAlpha;

  const cx = clone.x;
  const cy = clone.y - clone.z - 68;
  const aura = ctx.createRadialGradient(cx, cy, 8, cx, cy, 52);
  aura.addColorStop(0, 'rgba(167, 139, 250, 0.34)');
  aura.addColorStop(0.7, 'rgba(56, 189, 248, 0.14)');
  aura.addColorStop(1, 'rgba(167, 139, 250, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 44, 58, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = Math.floor(time * 16) % 2 === 0 ? 'rgba(167, 139, 250, 0.6)' : 'rgba(56, 189, 248, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx, clone.y - clone.groundZ - 4, 34, 11, 0, 0, Math.PI * 2);
  ctx.stroke();

  const speedMag = Math.hypot(clone.vx, clone.vy);
  const sprintFrames = [
    atlas.player.run1,
    atlas.player.run2,
    atlas.player.run3,
    atlas.player.run4,
    atlas.player.run5,
    atlas.player.run6,
  ];
  let pair = atlas.player.idle;
  if (clone.attackTimer > 0) {
    pair = atlas.player.atk2;
  } else if (clone.throwTimer > 0) {
    pair = atlas.player.throw;
  } else if (speedMag > 18) {
    pair = sprintFrames[Math.floor(clone.runCycle) % 6];
  }
  const spr = pair.ghost ?? pair.normal;
  drawSpriteCentered(ctx, spr, clone.x, clone.y, clone.z, clone.facing, 1, 1, speedMag > 20 ? 0.09 : 0);
  ctx.restore();
}

function drawPixelPlayer(ctx: CanvasRenderingContext2D, atlas: PixelSpriteAtlas, p: Player, time: number): void {
  drawPixelShadow(ctx, p.x, p.y, p.z, p.groundZ, 16);

  if (p.invulnTimer > 0 && p.dashTimer <= 0 && Math.floor(time * 24) % 2 === 0) {
    ctx.save();
    ctx.globalAlpha = 0.48;
  } else {
    ctx.save();
  }

  if (p.fushinTimer > 0) {
    const aura = ctx.createRadialGradient(p.x, p.y - p.z - 68, 10, p.x, p.y - p.z - 68, 62);
    aura.addColorStop(0, 'rgba(16, 185, 129, 0.34)');
    aura.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - p.z - 68, 48, 66, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p.somersaultTimer <= 0 && p.scarf.length > 1) {
    ctx.save();
    ctx.strokeStyle = p.hitFlashTimer > 0 ? '#FFFFFF' : '#E11D48';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < p.scarf.length - 1; i++) {
      ctx.lineWidth = Math.max(2.5, 7 - i * 0.75);
      ctx.beginPath();
      ctx.moveTo(p.scarf[i].x, p.scarf[i].y);
      ctx.lineTo(p.scarf[i + 1].x, p.scarf[i + 1].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  const speedMag = Math.hypot(p.vx, p.vy);
  const isMoving = speedMag > 22;
  const airborne = p.z > p.groundZ + 4;
  let pair = atlas.player.idle;
  let lean = 0;
  let spinAngle = 0;
  let breathScaleY = p.squashY;

  if (p.somersaultTimer > 0) {
    const somersaultFrames = [atlas.player.somersault1, atlas.player.somersault2, atlas.player.somersault3];
    pair = somersaultFrames[Math.floor(time * 24) % 3];
    spinAngle = time * 16;
  } else if (p.dashTimer > 0) {
    const sprintFrames = [
      atlas.player.run1,
      atlas.player.run2,
      atlas.player.run3,
      atlas.player.run4,
      atlas.player.run5,
      atlas.player.run6,
    ];
    pair = airborne ? atlas.player.jump : sprintFrames[Math.floor(p.runCycle) % 6];
    lean = 0.22;
  } else if (p.specialTimer > 0.15) {
    pair = atlas.player.cast;
    const cx = p.x;
    const cy = p.y - p.z - 76;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const castGlow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 74);
    castGlow.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
    castGlow.addColorStop(0.55, 'rgba(56, 189, 248, 0.28)');
    castGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = castGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 74, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (p.hurtTimer > 0) {
    pair = atlas.player.hurt;
    lean = -0.1;
  } else if (p.attackTimer > 0) {
    if (airborne) {
      pair = atlas.player.airKick;
      lean = 0.08;
    } else if (p.comboStep >= 3) {
      pair = atlas.player.atk3;
      lean = p.comboStep === 4 ? 0.14 : 0.08;
    } else if (p.comboStep === 2) {
      pair = atlas.player.atk2;
      lean = 0.05;
    } else {
      pair = atlas.player.atk1;
      lean = 0.06;
    }
  } else if (p.throwTimer > 0) {
    pair = atlas.player.throw;
    lean = 0.07;
  } else if (airborne) {
    pair = p.vz > 40 ? atlas.player.jump : atlas.player.fall;
    lean = Math.min(0.1, Math.abs(p.vx) / 3600);
  } else if (isMoving) {
    const sprintFrames = [
      atlas.player.run1,
      atlas.player.run2,
      atlas.player.run3,
      atlas.player.run4,
      atlas.player.run5,
      atlas.player.run6,
    ];
    pair = sprintFrames[Math.floor(p.runCycle) % 6];
    lean = Math.min(0.12, (speedMag / 340) * 0.11);
  } else {
    breathScaleY = p.squashY * (1 + Math.sin(time * 4.5) * 0.015);
  }

  const sprite = p.hitFlashTimer > 0 ? pair.flash : pair.normal;
  drawSpriteCentered(ctx, sprite, p.x, p.y, p.z, p.facing, p.squashX, breathScaleY, lean, spinAngle);

  // Moon Fury full-charge luminous crimson-gold ring & orb
  if (p.moonFury >= p.maxMoonFury && p.moonFuryTimer <= 0) {
    const cx = p.x;
    const cy = p.y - p.z - 72;
    const pulse = 0.5 + 0.5 * Math.sin(time * 8);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(251, 113, 133, ${(0.45 + pulse * 0.35).toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx, p.y - p.groundZ - 4, 42, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    const orbitAng = time * 5.2;
    const ox = cx + Math.cos(orbitAng) * 48;
    const oy = cy + Math.sin(orbitAng) * 24;
    const orbGlow = ctx.createRadialGradient(ox, oy, 1, ox, oy, 12);
    orbGlow.addColorStop(0, '#FEF08A');
    orbGlow.addColorStop(0.5, 'rgba(251, 113, 133, 0.8)');
    orbGlow.addColorStop(1, 'rgba(251, 113, 133, 0)');
    ctx.fillStyle = orbGlow;
    ctx.beginPath();
    ctx.arc(ox, oy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Ikazuchi Lightning Shield glowing orbs & energy ring
  if (p.shieldHits > 0) {
    const cx = p.x;
    const cy = p.y - p.z - 76;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 48, 56, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < p.shieldHits; i++) {
      const ang = time * 6.5 + (i * Math.PI * 2) / p.shieldHits;
      const ox = cx + Math.cos(ang) * 56;
      const oy = cy + Math.sin(ang) * 34;
      const orb = ctx.createRadialGradient(ox, oy, 1, ox, oy, 14);
      orb.addColorStop(0, '#FEF08A');
      orb.addColorStop(0.45, '#38BDF8');
      orb.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(ox, oy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawPixelCivilian(ctx: CanvasRenderingContext2D, atlas: PixelSpriteAtlas, civ: Civilian, time: number): void {
  drawPixelShadow(ctx, civ.x, civ.y, civ.z, civ.z, 13);
  const pair = civ.state === 'rescued' ? atlas.civilian.rescued : atlas.civilian.captive;
  const sprite = civ.hitFlashTimer > 0 ? pair.flash : pair.normal;
  const isHarmed = civ.state === 'harmed';
  const bobScale = civ.state === 'captive' ? 1 + Math.sin(time * 5 + civ.bobPhase) * 0.025 : 1;
  const scaleX = isHarmed ? 1.12 : 1;
  const scaleY = isHarmed ? 0.72 : bobScale;

  ctx.save();
  if (isHarmed) {
    ctx.globalAlpha = Math.max(0.2, Math.min(1, civ.timer / 0.65));
  } else if (civ.state === 'rescued') {
    ctx.globalAlpha = Math.max(0.25, Math.min(1, civ.timer / 0.55));
  }
  drawSpriteCentered(ctx, sprite, civ.x, civ.y, civ.z, civ.facing, scaleX, scaleY, isHarmed ? -0.25 * civ.facing : 0);
  ctx.restore();

  if (civ.state === 'captive') {
    const bx = civ.x;
    const by = civ.y - civ.z - sprite.height * 2 - 12 + Math.sin(time * 6 + civ.bobPhase) * 4;
    const blink = Math.floor(time * 6) % 2 === 0;
    ctx.save();
    ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
    ctx.beginPath();
    ctx.roundRect(bx - 30, by - 16, 60, 18, 4);
    ctx.fill();
    ctx.strokeStyle = blink ? '#34D399' : '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '700 11px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = blink ? '#34D399' : '#E0F2FE';
    ctx.fillText('REFÉM', bx, by - 7);
    ctx.restore();
  } else if (civ.state === 'rescued') {
    const bx = civ.x;
    const by = civ.y - civ.z - sprite.height * 2 - 14;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, civ.timer / 0.5));
    ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
    ctx.beginPath();
    ctx.roundRect(bx - 30, by - 16, 60, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '700 11px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#A7F3D0';
    ctx.fillText('SALVO!', bx, by - 7);
    ctx.restore();
  } else {
    const bx = civ.x;
    const by = civ.y - civ.z - sprite.height * 1.45 - 10;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, civ.timer / 0.45));
    ctx.fillStyle = 'rgba(127, 29, 29, 0.92)';
    ctx.beginPath();
    ctx.roundRect(bx - 32, by - 16, 64, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '700 11px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FECDD3';
    ctx.fillText('FERIDO', bx, by - 7);
    ctx.restore();
  }
}

function getEnemyShortTag(e: Enemy): string {
  if (e.isBoss) return 'CHEFE';
  if (e.type === 'scout') return 'BATEDOR';
  if (e.type === 'kunoichi') return 'KUNOICHI';
  if (e.type === 'ronin') return 'RONIN';
  return 'ONI';
}

function drawPlayerDetectionRing(
  ctx: CanvasRenderingContext2D,
  player: Player,
  stageId: StageId,
  weather: WeatherState,
  time: number
): void {
  const stageMeta = STAGES.find((s) => s.id === stageId);
  const nv = player.nightVisionTimer > 0;
  const kind = weather.currentKind;
  if (!nv && kind === 'clear' && !stageMeta?.denseFog) return;

  let radius = 460;
  if (nv) {
    radius = 480;
  } else if (kind === 'fog' || stageMeta?.denseFog) {
    radius = 235;
  } else if (kind === 'snow') {
    radius = 300;
  } else if (kind === 'storm') {
    radius = weather.lightningAlpha > 0.14 ? 540 : 390;
  }

  const rx = radius;
  const ry = Math.max(58, radius * 0.25);
  const cx = player.x;
  const cy = player.y - player.groundZ;

  ctx.save();
  const color = nv
    ? '45, 212, 191'
    : kind === 'fog'
      ? '94, 234, 212'
      : kind === 'snow'
        ? '224, 242, 254'
        : '125, 211, 252';
  const alpha = nv ? 0.24 + Math.sin(time * 4) * 0.04 : 0.17;
  ctx.strokeStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
  ctx.lineWidth = nv ? 2 : 1.5;
  ctx.setLineDash([12, 10]);
  ctx.lineDashOffset = -time * (nv ? 28 : 14);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  const aura = ctx.createRadialGradient(cx, cy, rx * 0.45, cx, cy, rx);
  aura.addColorStop(0, `rgba(${color}, 0)`);
  aura.addColorStop(0.92, `rgba(${color}, ${(alpha * 0.18).toFixed(3)})`);
  aura.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPixelEnemy(
  ctx: CanvasRenderingContext2D,
  atlas: PixelSpriteAtlas,
  e: Enemy,
  time: number,
  stageId: StageId,
  player: Player,
  weather: WeatherState
): void {
  const stageMeta = STAGES.find((s) => s.id === stageId);
  const isDenseFog = Boolean(stageMeta?.denseFog) || weather.currentKind === 'fog';
  const nightVisionActive = player.nightVisionTimer > 0;
  const lightningReveal = weather.currentKind === 'storm' && weather.lightningAlpha > 0.14;
  const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);

  let fogAlpha = 1;
  if (!nightVisionActive && !lightningReveal) {
    if (isDenseFog) {
      if (distToPlayer > 235) {
        fogAlpha = 0.13;
      } else if (distToPlayer > 100) {
        const t = (distToPlayer - 100) / (235 - 100);
        fogAlpha = 0.72 - t * 0.59;
      } else {
        fogAlpha = 0.9;
      }
    }
    if (weather.visibilityPenalty > 0.1) {
      const farCutoff =
        weather.currentKind === 'fog'
          ? 235
          : weather.currentKind === 'snow'
            ? 300
            : weather.currentKind === 'storm'
              ? 390
              : 460;
      const nearCutoff =
        weather.currentKind === 'fog'
          ? 96
          : weather.currentKind === 'snow'
            ? 125
            : 175;
      const minVis = Math.max(0.14, 1 - weather.visibilityPenalty * 1.05);
      let weatherAlpha = 1;
      if (distToPlayer > farCutoff) {
        weatherAlpha = minVis;
      } else if (distToPlayer > nearCutoff) {
        const t = (distToPlayer - nearCutoff) / (farCutoff - nearCutoff);
        weatherAlpha = 1 - t * (1 - minVis);
      }
      fogAlpha = Math.min(fogAlpha, weatherAlpha);
    }
    if (e.hitFlashTimer > 0) fogAlpha = Math.max(fogAlpha, 0.78);
  }

  ctx.save();
  ctx.globalAlpha = fogAlpha;
  drawPixelShadow(ctx, e.x, e.y, e.z, e.groundZ, e.isBoss || e.type === 'oni' ? 21 : 16);

  // Subtle Crimson Moon aggression glint when sky is clear
  if (weather.currentKind === 'clear' && e.hp > 0) {
    const pulse = 0.22 + 0.15 * Math.sin(time * 9 + e.id);
    const glint = ctx.createRadialGradient(e.x, e.y - e.z - 64, 4, e.x, e.y - e.z - 64, 42);
    glint.addColorStop(0, `rgba(251, 113, 133, ${pulse.toFixed(3)})`);
    glint.addColorStop(1, 'rgba(225, 29, 72, 0)');
    ctx.fillStyle = glint;
    ctx.beginPath();
    ctx.arc(e.x, e.y - e.z - 64, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  if (e.isBoss && e.jutsuSealActive && e.hp > 0) {
    const jutsuMeta = NINJUTSU_LIST.find((n) => n.id === stageMeta?.requiredJutsu) ?? NINJUTSU_LIST[0];
    const cx = e.x;
    const cy = e.y - e.z - 76;
    const pulse = Math.floor(time * 10) % 2 === 0;
    ctx.save();
    ctx.strokeStyle = jutsuMeta.color;
    ctx.lineWidth = pulse ? 3 : 2;
    ctx.globalAlpha = Math.min(1, fogAlpha + 0.25) * (pulse ? 0.9 : 0.65);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 66, 82, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = Math.min(1, fogAlpha + 0.35);
    ctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
    ctx.beginPath();
    ctx.roundRect(cx - 106, cy - 106, 212, 22, 6);
    ctx.fill();
    ctx.strokeStyle = jutsuMeta.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '700 11px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = jutsuMeta.color;
    ctx.fillText(`SELO: ${jutsuMeta.name.toUpperCase()} (${jutsuMeta.key})`, cx, cy - 95);
    ctx.restore();
  }

  if (e.aiState === 'windup' && (!isDenseFog || nightVisionActive || distToPlayer <= 190)) {
    if (e.attackKind === 'slam') {
      const pulse = Math.floor(time * 12) % 2 === 0;
      const slamGrad = ctx.createRadialGradient(e.x, e.y - e.groundZ, 12, e.x, e.y - e.groundZ, 114);
      slamGrad.addColorStop(0, pulse ? 'rgba(225, 29, 72, 0.44)' : 'rgba(251, 191, 36, 0.38)');
      slamGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = slamGrad;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y - e.groundZ, 114, 38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FB7185';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (e.attackKind === 'summon') {
      const pulse = Math.floor(time * 14) % 2 === 0;
      ctx.fillStyle = pulse ? 'rgba(225, 29, 72, 0.34)' : 'rgba(251, 191, 36, 0.28)';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y - e.groundZ - 8, 66, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pulse ? '#FDE047' : '#FB7185';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (e.attackKind === 'dash_slash' && e.dashTargetX !== undefined && e.dashTargetY !== undefined) {
      ctx.save();
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.85)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - e.groundZ - 34);
      ctx.lineTo(e.dashTargetX, e.dashTargetY - e.groundZ - 34);
      ctx.stroke();
      ctx.restore();
    }
  }

  const flash = e.hitFlashTimer > 0;
  const speedMag = Math.hypot(e.vx, e.vy);
  const isMoving = speedMag > 16;
  const set = atlas[e.type];
  let pair = set.idle;

  if (e.aiState === 'hurt') {
    pair = set.hurt;
  } else if (e.aiState === 'windup') {
    pair = set.windup;
  } else if (e.aiState === 'attack') {
    pair = set.atk;
  } else if (isMoving) {
    const walkFrames = [set.walk1, set.walk2, set.walk3, set.idle];
    pair = walkFrames[Math.floor(e.runCycle) % 4];
  }

  const sprite = flash ? pair.flash : pair.normal;
  const lean =
    e.aiState === 'hurt'
      ? -0.09
      : isMoving
        ? Math.min(0.09, (speedMag / Math.max(80, e.speed)) * 0.07)
        : 0;
  const breathY = !isMoving && e.aiState === 'chase' ? e.squashY * (1 + Math.sin(time * 4 + e.id) * 0.012) : e.squashY;
  drawSpriteCentered(ctx, sprite, e.x, e.y, e.z, e.facing, e.squashX, breathY, lean);

  // Visual feedback when enemies are affected by environmental obstacles (shock, frost, poison, burn, or crushed stun)
  if (e.hp > 0 && (e.hazardStatus || (e.hazardStunTimer ?? 0) > 0)) {
    const cx = e.x;
    const footY = e.y - e.z;
    const midY = footY - sprite.height * 1.05;
    ctx.save();
    if (e.hazardStatus === 'shock' && ((e.hazardStunTimer ?? 0) > 0 || (e.hazardSlowTimer ?? 0) > 0)) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = Math.floor(time * 24 + e.id) % 2 === 0 ? '#38BDF8' : '#FEF08A';
      ctx.lineWidth = 2;
      for (let arc = 0; arc < 2; arc++) {
        const yOff = midY - 22 + arc * 28;
        const j1 = Math.sin(time * 42 + e.id * 3 + arc * 5) * 14;
        const j2 = Math.cos(time * 38 + e.id * 2 + arc * 7) * 12;
        ctx.beginPath();
        ctx.moveTo(cx - 24, yOff + j1 * 0.4);
        ctx.lineTo(cx - 8, yOff - 8 + j2 * 0.4);
        ctx.lineTo(cx + 6, yOff + 8 + j1 * 0.35);
        ctx.lineTo(cx + 24, yOff - j2 * 0.35);
        ctx.stroke();
      }
    } else if (e.hazardStatus === 'frost' && (e.hazardSlowTimer ?? 0) > 0) {
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, footY - 4, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (e.hazardStatus === 'poison' && ((e.hazardDotTimer ?? 0) > 0 || (e.hazardSlowTimer ?? 0) > 0)) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.55)';
      for (let b = 0; b < 3; b++) {
        const phase = (time * 2.2 + e.id * 0.7 + b * 0.33) % 1;
        const bx = cx + Math.sin(time * 5 + b * 2.1 + e.id) * 18;
        const by = footY - 12 - phase * 68;
        ctx.beginPath();
        ctx.arc(bx, by, 3.5 * (1 - phase * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (e.hazardStatus === 'burn' && (e.hazardDotTimer ?? 0) > 0) {
      ctx.globalCompositeOperation = 'lighter';
      for (let f = 0; f < 3; f++) {
        const flick = Math.sin(time * 22 + f * 2.3 + e.id) * 5;
        const fx = cx + (f - 1) * 13 + flick * 0.4;
        const fy = footY - 18 - ((time * 48 + f * 19 + e.id * 7) % 44);
        ctx.fillStyle = f % 2 === 0 ? 'rgba(251, 146, 60, 0.78)' : 'rgba(253, 224, 71, 0.72)';
        ctx.beginPath();
        ctx.moveTo(fx, fy - 12);
        ctx.lineTo(fx + 6, fy + 4);
        ctx.lineTo(fx - 6, fy + 4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Daze stars above head when stunned by falling debris or impact
    if ((e.hazardStunTimer ?? 0) > 0 && e.hazardStatus !== 'shock') {
      const headY = footY - sprite.height * 2 - 6;
      ctx.fillStyle = '#FDE047';
      for (let s = 0; s < 3; s++) {
        const ang = time * 6.5 + (s * Math.PI * 2) / 3;
        const sx = cx + Math.cos(ang) * 16;
        const sy = headY + Math.sin(ang) * 5;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  const hiddenByStorm = !nightVisionActive && !lightningReveal && weather.visibilityPenalty > 0.45 && distToPlayer > 240;
  if (e.aiState === 'windup' && (!isDenseFog || nightVisionActive || lightningReveal || distToPlayer <= 215) && !hiddenByStorm) {
    const gx = e.x;
    const gy = e.y - e.z - sprite.height * 2 - 14;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const col = e.isBoss || e.type === 'oni' ? '#FB7185' : '#FBBF24';
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 10);
    ctx.lineTo(gx + 3, gy - 3);
    ctx.lineTo(gx + 10, gy);
    ctx.lineTo(gx + 3, gy + 3);
    ctx.lineTo(gx, gy + 10);
    ctx.lineTo(gx - 3, gy + 3);
    ctx.lineTo(gx - 10, gy);
    ctx.lineTo(gx - 3, gy - 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Stealth Patrol (?) vs Alerted (!) Weather Awareness Badge
  if (!e.isBoss && e.hp > 0 && e.aiState === 'idle' && (fogAlpha > 0.25 || nightVisionActive)) {
    const bx = e.x;
    const by = e.y - e.z - sprite.height * 2 - 22;
    ctx.save();
    ctx.globalAlpha = Math.max(0.45, fogAlpha);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(bx - 10, by - 10, 20, 18, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(94, 234, 212, 0.72)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.font = '800 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5EEAD4';
    ctx.fillText('?', bx, by - 1);
    ctx.restore();
  }

  const showHpBar =
    !e.isBoss &&
    e.hp > 0 &&
    (e.hp < e.maxHp || nightVisionActive) &&
    (!isDenseFog || nightVisionActive || lightningReveal || distToPlayer <= 160) &&
    (!hiddenByStorm || e.hitFlashTimer > 0);
  if (showHpBar) {
    const w = e.type === 'oni' ? 72 : 54;
    const bx = e.x - w * 0.5;
    const by = e.y - e.z - sprite.height * 2 - 14;
    ctx.fillStyle = 'rgba(7, 9, 18, 0.85)';
    ctx.beginPath();
    ctx.roundRect(bx - 2, by - 2, w + 4, 9, 3);
    ctx.fill();
    ctx.fillStyle = nightVisionActive ? '#2DD4BF' : '#E11D48';
    ctx.beginPath();
    ctx.roundRect(bx, by, Math.max(4, w * (e.hp / e.maxHp)), 5, 2);
    ctx.fill();
  }

  // Night-Vision Identification Tactical Brackets & Tag
  if (nightVisionActive && e.hp > 0) {
    const cx = e.x;
    const topY = e.y - e.z - sprite.height * 2;
    const halfW = e.isBoss || e.type === 'oni' ? 48 : 36;
    const boxH = sprite.height * 2;
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 2.5;
    const bLen = 12;
    ctx.beginPath();
    ctx.moveTo(cx - halfW, topY + bLen);
    ctx.lineTo(cx - halfW, topY);
    ctx.lineTo(cx - halfW + bLen, topY);
    ctx.moveTo(cx + halfW - bLen, topY);
    ctx.lineTo(cx + halfW, topY);
    ctx.lineTo(cx + halfW, topY + bLen);
    ctx.moveTo(cx - halfW, topY + boxH - bLen);
    ctx.lineTo(cx - halfW, topY + boxH);
    ctx.lineTo(cx - halfW + bLen, topY + boxH);
    ctx.moveTo(cx + halfW - bLen, topY + boxH);
    ctx.lineTo(cx + halfW, topY + boxH);
    ctx.lineTo(cx + halfW, topY + boxH - bLen);
    ctx.stroke();

    const tagY = e.isBoss && e.jutsuSealActive ? topY - 42 : topY - 24;
    ctx.fillStyle = 'rgba(4, 47, 46, 0.92)';
    ctx.beginPath();
    ctx.roundRect(cx - 48, tagY - 11, 96, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '700 10px "Outfit", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#99F6E4';
    ctx.fillText(getEnemyShortTag(e), cx, tagY - 2);
  }

  ctx.restore();
}

function drawPixelProjectile(ctx: CanvasRenderingContext2D, atlas: PixelSpriteAtlas, proj: Projectile): void {
  const sx = proj.x;
  const sy = proj.y - proj.z;
  const dir = proj.vx >= 0 ? 1 : -1;

  if (proj.kind === 'shuriken') {
    const trailGrad = ctx.createLinearGradient(sx - dir * 48, sy, sx, sy);
    trailGrad.addColorStop(0, 'rgba(226, 232, 240, 0)');
    trailGrad.addColorStop(1, 'rgba(254, 240, 138, 0.85)');
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx - dir * 48, sy);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(sx, sy);
    ctx.rotate(proj.rotation);
    ctx.drawImage(atlas.shuriken, -12, -12, 24, 24);
    ctx.restore();
  } else if (proj.kind === 'fire_dragon') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fGlow = ctx.createRadialGradient(sx, sy, 4, sx, sy, 38);
    fGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    fGlow.addColorStop(0.5, 'rgba(249, 115, 22, 0.45)');
    fGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = fGlow;
    ctx.beginPath();
    ctx.arc(sx, sy, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(sx, sy);
    ctx.scale(dir * 2, 2);
    ctx.drawImage(atlas.fire_dragon, -16, -6);
    ctx.restore();
  } else {
    const kGrad = ctx.createLinearGradient(sx - dir * 32, sy, sx + dir * 12, sy);
    kGrad.addColorStop(0, 'rgba(251, 113, 133, 0)');
    kGrad.addColorStop(0.7, '#FB7185');
    kGrad.addColorStop(1, '#FFFFFF');
    ctx.strokeStyle = kGrad;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx - dir * 24, sy);
    ctx.lineTo(sx + dir * 12, sy);
    ctx.stroke();
  }
}

function drawPixelSlashArc(ctx: CanvasRenderingContext2D, arc: SlashArc): void {
  const t = arc.life / arc.maxLife;
  const sx = arc.x;
  const sy = arc.y - arc.z - 76;
  const r = arc.radius;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(arc.facing, 1);
  ctx.globalAlpha = Math.min(1, t * 1.35);
  ctx.globalCompositeOperation = 'lighter';

  if (arc.step === 4) {
    const curR = r * (1.1 - t * 0.2);
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = 14 * t + 4;
    ctx.beginPath();
    ctx.arc(0, 0, curR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else {
    // Tapered crescent blade arc
    const startA = arc.step === 2 ? -1.1 : -1.15;
    const endA = arc.step === 2 ? 0.9 : 1.05;
    const outerR = r + 6;
    const innerR = Math.max(10, r - 18 * t - 6);
    ctx.fillStyle = arc.color;
    ctx.beginPath();
    ctx.arc(10, 0, outerR, startA, endA);
    ctx.arc(2, 0, innerR, endA, startA, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(10, 0, outerR - 2, startA + 0.12, endA - 0.12);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPixelParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const t = p.life / p.maxLife;
  const sx = p.x;
  const sy = p.y - p.z;
  const sz = Math.max(2.5, p.size * 0.75);
  ctx.save();
  ctx.globalAlpha = Math.max(0, t * p.alpha);

  if (p.kind === 'blood_pixel' || p.kind === 'blood_ink') {
    const snapX = Math.round(sx / 2) * 2;
    const snapY = Math.round(sy / 2) * 2;
    const pxSize = p.size >= 6 ? 6 : p.size >= 4 ? 4 : 2;
    ctx.fillStyle = p.color;
    ctx.fillRect(snapX - pxSize / 2, snapY - pxSize / 2, pxSize, pxSize);
    // Crisp dark crimson pixel edge + velocity streak when airborne
    ctx.fillStyle = '#450A0A';
    ctx.fillRect(snapX - pxSize / 2, snapY + pxSize / 2 - 2, pxSize, 2);
    if (Math.hypot(p.vx, p.vz) > 120) {
      const trailX = snapX - Math.sign(p.vx) * 2;
      const trailY = snapY + Math.sign(p.vz) * 2;
      ctx.fillStyle = p.color;
      ctx.fillRect(trailX - 1, trailY - 1, 2, 2);
    }
    if (pxSize >= 4) {
      ctx.fillStyle = '#FDA4AF';
      ctx.fillRect(snapX - pxSize / 2, snapY - pxSize / 2, 2, 2);
    }
  } else if (p.kind === 'spark' || p.kind === 'lightning') {
    ctx.globalCompositeOperation = 'lighter';
    const angle = Math.atan2(-p.vz, p.vx);
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 2.2, sz * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'smoke' || p.kind === 'dust') {
    const r = sz * (1.8 - t * 0.6);
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'petal' || p.kind === 'leaf') {
    ctx.translate(sx, sy);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, sz * 1.2, sz * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(sx, sy, sz * 0.75, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSurfaceMark(ctx: CanvasRenderingContext2D, mark: SurfaceMark): void {
  const fadeWindow = Math.min(1.8, mark.maxLife * 0.35);
  const fade = Math.max(0, Math.min(1, mark.life / fadeWindow));
  if (fade <= 0.01) return;

  const age = mark.maxLife - mark.life;
  const cx = Math.round(mark.x / 2) * 2;
  const cy = Math.round((mark.y - mark.z) / 2) * 2;

  ctx.save();
  ctx.globalAlpha = fade * (mark.kind === 'katana_slash' ? 0.88 : 0.84);

  if (mark.kind === 'katana_slash') {
    ctx.translate(cx, cy);
    ctx.scale(1, 0.54);
    ctx.rotate(mark.angle);

    const half = Math.round(mark.length / 2);
    const step = 4;
    const thick = Math.max(2, Math.round(mark.thickness / 2) * 2);

    // Pixel-stepped katana gouge across the surface
    for (let dx = -half; dx < half; dx += step) {
      const edgeTaper = Math.abs(dx) > half * 0.72 ? 2 : thick;
      const jitterY = ((mark.seed + dx) % 7 === 0 ? 2 : 0) - 1;
      // Deep carved shadow groove
      ctx.fillStyle = '#060810';
      ctx.fillRect(dx, Math.round(-edgeTaper / 2) + jitterY, step, edgeTaper);
      // Crimson/ember edge stain
      ctx.fillStyle = mark.color;
      ctx.fillRect(dx, Math.round(edgeTaper / 2) + jitterY, step, 2);
    }

    // Crisp freshly-cut metallic glint for first 0.45s
    if (age < 0.45) {
      ctx.globalAlpha = fade * (1 - age / 0.45) * 0.9;
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(-Math.round(half * 0.65), -2, Math.round(half * 1.3), 2);
    }

    // Tiny pixel chips beside the cut
    const chipOffset = (mark.seed % 11) - 5;
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-Math.round(half * 0.4) + chipOffset, -thick - 2, 2, 2);
    ctx.fillRect(Math.round(half * 0.35) - chipOffset, thick + 2, 2, 2);
  } else {
    // Pixel-art blood splatter cluster snapped to 2px grid
    const s = mark.seed;
    const baseW = Math.max(6, Math.round(mark.length / 2) * 2);
    const baseH = Math.max(4, Math.round((baseW * 0.45) / 2) * 2);

    // Dark dried-crimson core pixels
    ctx.fillStyle = '#450A0A';
    ctx.fillRect(cx - baseW / 2, cy - baseH / 2, baseW, baseH);

    // Primary crimson pixel pool
    ctx.fillStyle = mark.color;
    ctx.fillRect(cx - baseW / 2 + 2, cy - baseH / 2, Math.max(4, baseW - 4), Math.max(2, baseH - 2));

    // Bright pixel highlight on fresh splatter
    if (age < 1.2) {
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(cx - 2, cy - baseH / 2, 2, 2);
    }

    // Deterministic satellite pixel droplets around main splat
    const offsets = [
      [((s % 5) - 2) * 4 + 6, ((s >> 2) % 3) * 2 - 4, 4, 2],
      [-((s >> 3) % 4) * 4 - 6, ((s >> 5) % 3) * 2 - 2, 2, 2],
      [((s >> 4) % 4) * 4 + 2, ((s >> 6) % 3) * 2 + 4, 2, 2],
      [-((s >> 7) % 3) * 4 - 4, -((s >> 8) % 3) * 2 - 4, 4, 2],
    ];
    ctx.fillStyle = mark.color;
    for (const [ox, oy, ow, oh] of offsets) {
      ctx.fillRect(cx + ox, cy + oy, ow, oh);
    }
  }

  ctx.restore();
}

function drawPixelFloatingText(ctx: CanvasRenderingContext2D, ft: FloatingText): void {
  const t = ft.life / ft.maxLife;
  const sx = ft.x;
  const sy = ft.y - ft.z;
  const fontSize = Math.round((ft.scale > 1.1 ? 24 : 18) * Math.min(1.18, Math.max(0.95, ft.scale)));
  ctx.save();
  ctx.globalAlpha = Math.min(1, t * 2);
  ctx.font = `800 ${fontSize}px "Outfit", "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(7, 9, 18, 0.92)';
  ctx.strokeText(ft.text, sx, sy);
  ctx.fillStyle = ft.color;
  ctx.fillText(ft.text, sx, sy);
  ctx.restore();
}

function fillPixelCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
  ctx.fill();
}

function drawPixelTriangle(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.fill();
}
