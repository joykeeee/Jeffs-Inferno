import {
  CircleId,
  DANTE_CIRCLES,
  ExitPortal,
  GhostSkin,
  HazardOrb,
  LevelData,
  MovingPlatform,
  PushBlock,
  SoulKey,
  SoulWisp,
  TileType,
} from '../types';

export interface PlayerRenderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  isGrounded: boolean;
  isFloating: boolean;
  isDashing: boolean;
  invulnerableTimer: number;
  hasShield: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  currentLife: number;
}

export class PixelRenderer {
  private particles: Particle[] = [];
  private ambientParticles: Particle[] = [];
  private frameCount: number = 0;

  constructor() {
    this.initAmbientParticles();
  }

  private initAmbientParticles() {
    this.ambientParticles = [];
    for (let i = 0; i < 40; i++) {
      this.ambientParticles.push({
        x: Math.random() * 768,
        y: Math.random() * 480,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() > 0.6 ? 2 : 1,
        color: '#ffffff',
        alpha: 0.2 + Math.random() * 0.5,
        maxLife: 1000,
        currentLife: 0,
      });
    }
  }

  public addBurst(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.0 + Math.random() * 2.0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() > 0.5 ? 2 : 3,
        color,
        alpha: 1.0,
        maxLife: 25 + Math.random() * 15,
        currentLife: 0,
      });
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    player: PlayerRenderState,
    skin: GhostSkin
  ) {
    this.frameCount++;
    const circle = DANTE_CIRCLES[level.circleId];

    // 1. Background
    this.drawBackground(ctx, level.circleId, circle.bgGradient);

    // 2. Ambient Atmosphere particles (snow, sparks, wind, stars)
    this.drawAmbient(ctx, level.circleId, circle.themeColor);

    // 3. Tilemap
    this.drawTiles(ctx, level, circle.themeColor, circle.secondaryColor);

    // 4. Interactive Entities
    this.drawPushBlocks(ctx, level.pushBlocks, circle.themeColor);
    this.drawMovingPlatforms(ctx, level.movingPlatforms, circle.themeColor);
    this.drawSoulKeys(ctx, level.keys);
    this.drawSoulWisps(ctx, level.wisps);
    this.drawHazardOrbs(ctx, level.hazardOrbs, circle.themeColor);

    // 5. Exit Portal & Virgil Guide
    this.drawExitPortal(ctx, level.exitPortal, circle.themeColor, level.doors.every((d) => d.isOpen));

    // 6. Jeff the Ghost
    this.drawJeff(ctx, player, skin);

    // 7. Dynamic Particles
    this.drawDynamicParticles(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, circleId: CircleId, bgGradient: [string, string]) {
    const w = 768;
    const h = 480;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, bgGradient[0]);
    grad.addColorStop(1, bgGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Distant parallax pixel pillars / landscape
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let i = 0; i < 8; i++) {
      const px = i * 110 + 20;
      const ph = 120 + (i % 3) * 60;
      ctx.fillRect(px, h - ph, 40, ph);
      // Pillar top cap
      ctx.fillRect(px - 4, h - ph, 48, 8);
    }

    // Distant subtle arches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(i * 200 + 80, 200, 60, Math.PI, 0);
      ctx.stroke();
    }
  }

  private drawAmbient(ctx: CanvasRenderingContext2D, circleId: CircleId, themeColor: string) {
    const w = 768;
    const h = 480;

    this.ambientParticles.forEach((p) => {
      p.currentLife++;

      if (circleId === 9) {
        // Cocytus snow
        p.vy = 0.8;
        p.vx = Math.sin((this.frameCount + p.y) * 0.05) * 0.4;
      } else if (circleId === 7 || circleId === 6) {
        // Phlegethon / Dis rising sparks
        p.vy = -0.9;
        p.vx = (Math.random() - 0.5) * 0.3;
      } else if (circleId === 2) {
        // Lust storm wind
        p.vx = 2.5;
        p.vy = (Math.random() - 0.5) * 0.4;
      } else if (circleId === 3) {
        // Gluttony sleet
        p.vy = 2.0;
        p.vx = -0.5;
      } else if (circleId === 0) {
        // Stars twinkle
        p.alpha = 0.2 + Math.abs(Math.sin((this.frameCount + p.x) * 0.08)) * 0.8;
      } else {
        // Gentle float
        p.vy = Math.sin((this.frameCount + p.x) * 0.03) * 0.2;
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.fillStyle = circleId === 0 ? '#fef08a' : themeColor;
      ctx.globalAlpha = p.alpha * 0.6;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    });

    ctx.globalAlpha = 1.0;
  }

  private drawTiles(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    themeColor: string,
    secondaryColor: string
  ) {
    const ts = level.tileSize;

    for (let y = 0; y < level.heightInTiles; y++) {
      for (let x = 0; x < level.widthInTiles; x++) {
        const tile = level.tiles[y][x];
        const px = x * ts;
        const py = y * ts;

        if (tile === TileType.EMPTY) continue;

        switch (tile) {
          case TileType.SOLID: {
            // Pixelated stone brick
            ctx.fillStyle = '#18181b';
            ctx.fillRect(px, py, ts, ts);

            // Brick border highlight
            ctx.fillStyle = secondaryColor;
            ctx.fillRect(px, py, ts, 2);
            ctx.fillRect(px, py, 2, ts);

            // Shadow border
            ctx.fillStyle = '#09090b';
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillRect(px + ts - 2, py, 2, ts);

            // Brick joint pattern
            if ((x + y) % 2 === 0) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
              ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
            }
            break;
          }

          case TileType.ICE: {
            // Cocytus translucent ice
            ctx.fillStyle = '#083344';
            ctx.fillRect(px, py, ts, ts);

            // Cyan frost shine
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(px, py, ts, 3);
            ctx.fillStyle = '#7dd3fc';
            ctx.fillRect(px + 4, py + 6, ts - 10, 2);
            ctx.fillRect(px + 12, py + 12, 6, 2);
            break;
          }

          case TileType.CRUMBLING: {
            // Check state
            const crumbState = level.crumblingTiles.find((c) => c.x === x && c.y === y);
            if (crumbState && crumbState.state === 'broken') {
              // Invisible or dissolving ghost rubble
              ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
              ctx.fillRect(px + 8, py + 8, 4, 4);
              continue;
            }

            const shakeOffset =
              crumbState && crumbState.state === 'crumbling'
                ? (Math.sin(this.frameCount * 0.8) * 2)
                : 0;

            ctx.fillStyle = '#27272a';
            ctx.fillRect(px + shakeOffset, py, ts, ts);
            // Crack lines
            ctx.fillStyle = '#e4e4e7';
            ctx.fillRect(px + 4 + shakeOffset, py + 2, 2, 6);
            ctx.fillRect(px + 6 + shakeOffset, py + 8, 6, 2);
            ctx.fillRect(px + 12 + shakeOffset, py + 10, 2, 8);
            break;
          }

          case TileType.ONE_WAY: {
            // Thin ledge with runic trim
            ctx.fillStyle = '#27272a';
            ctx.fillRect(px, py, ts, 6);
            ctx.fillStyle = themeColor;
            ctx.fillRect(px + 2, py + 1, ts - 4, 2);
            break;
          }

          case TileType.SPIKE_UP: {
            // Clean stylized crystal spikes, NO blood
            ctx.fillStyle = '#71717a';
            // Draw 2 small triangular crystal teeth
            ctx.beginPath();
            ctx.moveTo(px, py + ts);
            ctx.lineTo(px + ts * 0.25, py + 4);
            ctx.lineTo(px + ts * 0.5, py + ts);
            ctx.lineTo(px + ts * 0.75, py + 4);
            ctx.lineTo(px + ts, py + ts);
            ctx.closePath();
            ctx.fill();

            // Glow tip
            ctx.fillStyle = themeColor;
            ctx.fillRect(px + ts * 0.25 - 1, py + 4, 2, 2);
            ctx.fillRect(px + ts * 0.75 - 1, py + 4, 2, 2);
            break;
          }

          case TileType.SPIKE_DOWN: {
            ctx.fillStyle = '#71717a';
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + ts * 0.25, py + ts - 4);
            ctx.lineTo(px + ts * 0.5, py);
            ctx.lineTo(px + ts * 0.75, py + ts - 4);
            ctx.lineTo(px + ts, py);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = themeColor;
            ctx.fillRect(px + ts * 0.25 - 1, py + ts - 6, 2, 2);
            ctx.fillRect(px + ts * 0.75 - 1, py + ts - 6, 2, 2);
            break;
          }

          case TileType.PRESSURE_PLATE: {
            const plate = level.pressurePlates.find((p) => p.x === x && p.y === y);
            const isPressed = plate?.isPressed;

            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(px, py + ts - 4, ts, 4);

            ctx.fillStyle = isPressed ? themeColor : '#eab308';
            const plateHeight = isPressed ? 2 : 5;
            ctx.fillRect(px + 3, py + ts - plateHeight, ts - 6, plateHeight);
            break;
          }

          case TileType.DOOR_LOCKED: {
            const door = level.doors.find((d) => d.x === x && (d.y === y || d.y + 1 === y));
            if (door?.isOpen) {
              // Open gate: faint runic doorway frame
              ctx.strokeStyle = themeColor;
              ctx.strokeRect(px + 2, py, ts - 4, ts);
              continue;
            }

            // Locked iron gate
            ctx.fillStyle = '#18181b';
            ctx.fillRect(px + 2, py, ts - 4, ts);

            // Vertical iron bars
            ctx.fillStyle = '#71717a';
            ctx.fillRect(px + 4, py, 3, ts);
            ctx.fillRect(px + ts - 7, py, 3, ts);

            // Runic lock
            ctx.fillStyle = themeColor;
            ctx.fillRect(px + 8, py + 8, 8, 8);
            ctx.fillStyle = '#09090b';
            ctx.fillRect(px + 11, py + 11, 2, 3);
            break;
          }

          case TileType.LEVER: {
            const lever = level.levers.find((l) => l.x === x && l.y === y);
            const active = lever?.isActive;

            // Base
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(px + 4, py + ts - 6, ts - 8, 6);

            // Stick
            ctx.strokeStyle = active ? themeColor : '#a1a1aa';
            ctx.lineWidth = 3;
            ctx.beginPath();
            if (active) {
              ctx.moveTo(px + ts / 2, py + ts - 6);
              ctx.lineTo(px + ts - 4, py + 6);
            } else {
              ctx.moveTo(px + ts / 2, py + ts - 6);
              ctx.lineTo(px + 4, py + 6);
            }
            ctx.stroke();

            // Knob
            ctx.fillStyle = active ? '#22c55e' : '#ef4444';
            ctx.fillRect(active ? px + ts - 6 : px + 2, py + 4, 5, 5);
            break;
          }

          case TileType.WIND_UP: {
            // Rising updraft stream
            const windY = (this.frameCount * 2) % ts;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(px + 6, py + ts - windY, 3, 4);
            ctx.fillRect(px + 14, py + ts - ((windY + 12) % ts), 3, 4);
            break;
          }

          case TileType.BOUNCER: {
            // Bouncy spongy mushroom / spring pad
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(px + ts / 2, py + ts - 4, 10, Math.PI, 0);
            ctx.fill();

            // Cap spots
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px + 8, py + ts - 10, 2, 2);
            ctx.fillRect(px + 14, py + ts - 12, 2, 2);
            break;
          }
        }
      }
    }
  }

  private drawPushBlocks(ctx: CanvasRenderingContext2D, blocks: PushBlock[], themeColor: string) {
    blocks.forEach((block) => {
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(block.x, block.y, block.width, block.height);

      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);

      // Carved rune in the center
      ctx.fillStyle = themeColor;
      ctx.fillRect(block.x + block.width / 2 - 2, block.y + block.height / 2 - 2, 4, 4);
    });
  }

  private drawMovingPlatforms(ctx: CanvasRenderingContext2D, platforms: MovingPlatform[], themeColor: string) {
    platforms.forEach((p) => {
      ctx.fillStyle = '#27272a';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Edge glow
      ctx.fillStyle = themeColor;
      ctx.fillRect(p.x, p.y, p.width, 2);
      ctx.fillRect(p.x, p.y + p.height - 2, p.width, 2);

      // Cog indicators
      ctx.fillStyle = '#a1a1aa';
      ctx.fillRect(p.x + 4, p.y + 4, 3, 3);
      ctx.fillRect(p.x + p.width - 7, p.y + 4, 3, 3);
    });
  }

  private drawSoulKeys(ctx: CanvasRenderingContext2D, keys: SoulKey[]) {
    keys.forEach((k) => {
      if (k.collected) return;
      const floatY = k.y + Math.sin(this.frameCount * 0.08) * 3;

      // Glow halo
      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.beginPath();
      ctx.arc(k.x + 8, floatY + 8, 12, 0, Math.PI * 2);
      ctx.fill();

      // Golden pixel key
      ctx.fillStyle = '#facc15';
      // Ring
      ctx.fillRect(k.x + 2, floatY + 2, 6, 6);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(k.x + 4, floatY + 4, 2, 2);
      // Stem
      ctx.fillStyle = '#facc15';
      ctx.fillRect(k.x + 8, floatY + 4, 6, 2);
      // Teeth
      ctx.fillRect(k.x + 11, floatY + 6, 2, 3);
      ctx.fillRect(k.x + 13, floatY + 6, 2, 2);
    });
  }

  private drawSoulWisps(ctx: CanvasRenderingContext2D, wisps: SoulWisp[]) {
    wisps.forEach((w) => {
      if (w.collected) return;
      const floatY = w.y + Math.sin(this.frameCount * 0.1 + w.floatOffset) * 4;

      // Outer glow
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(w.x + 8, floatY + 8, 10, 0, Math.PI * 2);
      ctx.fill();

      // Pixel Soul Wisp diamond
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(w.x + 8, floatY + 2);
      ctx.lineTo(w.x + 13, floatY + 8);
      ctx.lineTo(w.x + 8, floatY + 14);
      ctx.lineTo(w.x + 3, floatY + 8);
      ctx.closePath();
      ctx.fill();

      // Core sparkle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w.x + 7, floatY + 7, 2, 2);
    });
  }

  private drawHazardOrbs(ctx: CanvasRenderingContext2D, orbs: HazardOrb[], themeColor: string) {
    orbs.forEach((orb) => {
      const px = orb.currentX;
      const py = orb.currentY;

      // Hazard aura
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.beginPath();
      ctx.arc(px, py, orb.size, 0, Math.PI * 2);
      ctx.fill();

      // Core pixel spark
      ctx.fillStyle = '#f87171';
      ctx.fillRect(px - 5, py - 5, 10, 10);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px - 2, py - 2, 4, 4);

      // Orbiting spark teeth
      const toothAngle = this.frameCount * 0.1;
      for (let i = 0; i < 4; i++) {
        const a = toothAngle + (Math.PI / 2) * i;
        const tx = px + Math.cos(a) * (orb.size - 2);
        const ty = py + Math.sin(a) * (orb.size - 2);
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(tx - 1, ty - 1, 2, 2);
      }
    });
  }

  private drawExitPortal(
    ctx: CanvasRenderingContext2D,
    portal: ExitPortal,
    themeColor: string,
    isUnlocked: boolean
  ) {
    const cx = portal.x + portal.width / 2;
    const cy = portal.y + portal.height / 2;

    // Outer vortex rings
    const rot = this.frameCount * 0.05;
    for (let i = 3; i >= 1; i--) {
      ctx.strokeStyle = isUnlocked ? themeColor : '#71717a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, (portal.width / 2) * (i / 3), (portal.height / 2) * (i / 3), rot * (i % 2 === 0 ? 1 : -1), 0, Math.PI * 2);
      ctx.stroke();
    }

    // Portal core
    ctx.fillStyle = isUnlocked ? '#ffffff' : '#18181b';
    ctx.beginPath();
    ctx.arc(cx, cy, isUnlocked ? 8 + Math.sin(this.frameCount * 0.1) * 2 : 6, 0, Math.PI * 2);
    ctx.fill();

    // Virgil's gentle silhouette standing near portal guide
    const virgilX = portal.x - 22;
    const virgilY = portal.y + portal.height - 24;

    // Virgil Cloak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(virgilX + 6, virgilY);
    ctx.lineTo(virgilX + 14, virgilY + 24);
    ctx.lineTo(virgilX - 2, virgilY + 24);
    ctx.closePath();
    ctx.fill();

    // Virgil Lantern
    const lanternY = virgilY + 10 + Math.sin(this.frameCount * 0.06) * 2;
    ctx.fillStyle = '#facc15';
    ctx.fillRect(virgilX + 12, lanternY, 4, 6);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.beginPath();
    ctx.arc(virgilX + 14, lanternY + 3, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawJeff(ctx: CanvasRenderingContext2D, player: PlayerRenderState, skin: GhostSkin) {
    // If invulnerable, flicker
    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 20) % 2 === 0) {
      return;
    }

    const bob = Math.sin(this.frameCount * 0.1) * 2;
    const px = player.x;
    const py = player.y + bob;
    const w = player.width;
    const h = player.height;

    // Spectral dash trail
    if (player.isDashing) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.fillRect(px - player.facing * 8, py, w, h);
      ctx.fillRect(px - player.facing * 16, py, w, h);
    }

    // Ethereal outer glow aura
    ctx.fillStyle = skin.glowColor;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(px + w / 2, py + h / 2, w * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Ecto-Shield aura if active
    if (player.hasShield) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + w / 2, py + h / 2, w * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Jeff's Body (Ethereal Ghost Silhouette)
    ctx.fillStyle = skin.mainColor;

    // Dome head
    ctx.beginPath();
    ctx.arc(px + w / 2, py + 8, w / 2 - 1, Math.PI, 0);
    ctx.lineTo(px + w - 1, py + h - 4);

    // Wavy scalloped ghost tail
    const wave = Math.sin(this.frameCount * 0.2);
    ctx.lineTo(px + w * 0.8, py + h - 2 + wave * 2);
    ctx.lineTo(px + w * 0.5, py + h - 5);
    ctx.lineTo(px + w * 0.2, py + h - 2 - wave * 2);
    ctx.lineTo(px + 1, py + h - 4);

    ctx.closePath();
    ctx.fill();

    // Cute Expressive Ghost Eyes
    ctx.fillStyle = skin.eyeColor;
    const eyeLookX = player.facing === 1 ? 2 : -2;
    const isBlinking = this.frameCount % 180 < 8;

    if (isBlinking) {
      // Closed happy slits
      ctx.fillRect(px + 5 + eyeLookX, py + 8, 3, 1);
      ctx.fillRect(px + 12 + eyeLookX, py + 8, 3, 1);
    } else {
      // Big expressive pixel eyes
      ctx.fillRect(px + 5 + eyeLookX, py + 6, 3, 4);
      ctx.fillRect(px + 12 + eyeLookX, py + 6, 3, 4);

      // Eye glint highlights
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 5 + eyeLookX, py + 6, 1, 1);
      ctx.fillRect(px + 12 + eyeLookX, py + 6, 1, 1);
    }

    // Cute spectral blush dots
    ctx.fillStyle = skin.glowColor;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(px + 3, py + 10, 2, 2);
    ctx.fillRect(px + 15, py + 10, 2, 2);
    ctx.globalAlpha = 1.0;

    // Glide floating wings / aura when hovering
    if (player.isFloating) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(px - 3, py + 6, 3, 4);
      ctx.fillRect(px + w, py + 6, 3, 4);
    }
  }

  private drawDynamicParticles(ctx: CanvasRenderingContext2D) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.currentLife++;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = Math.max(0, 1 - p.currentLife / p.maxLife);

      if (p.currentLife >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
  }
}
