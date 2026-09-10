import { soundEngine } from '../audio/soundEngine';
import {
  CircleId,
  LevelData,
  PlayerStats,
  PushBlock,
  TileType,
} from '../types';
import { LEVEL_HEIGHT, LEVEL_WIDTH, TILE_SIZE } from './proceduralGenerator';
import { PlayerRenderState } from './renderer';

export interface PlayerPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  isGrounded: boolean;
  isFloating: boolean;
  floatTimer: number;
  canDoubleJump: boolean;
  isDashing: boolean;
  dashTimer: number;
  dashCooldownTimer: number;
  invulnerableTimer: number;
  hasRoomShield: boolean;
  checkpointX: number;
  checkpointY: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  jumpPressed: boolean;
  dash: boolean;
}

const GRAVITY = 0.28;
const FLOAT_GRAVITY = 0.05;
const MAX_FALL_SPEED = 5.8;
const BASE_MOVE_SPEED = 2.6;
const BASE_JUMP_FORCE = -7.2;
const BASE_FLOAT_MAX_TIME = 2.0; // seconds of hover float
const DASH_SPEED = 7.5;
const DASH_DURATION = 0.16; // seconds
const COYOTE_TIME_MAX = 0.12; // seconds (~7 frames)
const JUMP_BUFFER_MAX = 0.12; // seconds (~7 frames)

export class PhysicsEngine {
  public update(
    player: PlayerPhysicsState,
    input: InputState,
    level: LevelData,
    stats: PlayerStats,
    dt: number,
    onKeyCollected: (keyId: string) => void,
    onWispCollected: (wispId: string, value: number) => void,
    onPlayerHurt: () => void,
    onDoorOpened: () => void,
    addParticleBurst: (x: number, y: number, color: string, count?: number) => void
  ) {
    // 1. Dash handling
    if (player.dashCooldownTimer > 0) {
      player.dashCooldownTimer -= dt;
    }
    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer -= dt;
    }

    if (
      input.dash &&
      stats.hasPhantomDash &&
      player.dashCooldownTimer <= 0 &&
      !player.isDashing
    ) {
      player.isDashing = true;
      player.dashTimer = DASH_DURATION;
      player.dashCooldownTimer = stats.dashCooldownDuration;
      player.vx = player.facing * DASH_SPEED;
      player.vy = 0;
      soundEngine.playDash();
      addParticleBurst(player.x + 10, player.y + 10, '#38bdf8', 10);
    }

    if (player.isDashing) {
      player.dashTimer -= dt;
      if (player.dashTimer <= 0) {
        player.isDashing = false;
      }
    }

    // 2. Horizontal Movement
    const moveSpeed = BASE_MOVE_SPEED * stats.moveSpeedMultiplier;
    const standingTile = this.getTileAt(level, player.x + player.width / 2, player.y + player.height + 1);
    const hasIceCleats = stats.relics.some((r) => r.id === 'cocytus_cleats');
    const isSlippery = standingTile === TileType.ICE && !hasIceCleats;

    if (!player.isDashing) {
      if (input.left) {
        player.facing = -1;
        if (isSlippery) {
          player.vx = Math.max(player.vx - 0.2, -moveSpeed);
        } else {
          player.vx = -moveSpeed;
        }
      } else if (input.right) {
        player.facing = 1;
        if (isSlippery) {
          player.vx = Math.min(player.vx + 0.2, moveSpeed);
        } else {
          player.vx = moveSpeed;
        }
      } else {
        // Friction
        if (isSlippery) {
          player.vx *= 0.94;
        } else {
          player.vx = 0;
        }
      }
    }

    // 3. Jump and Float (Ghost Mechanics)
    const maxFloatTime = BASE_FLOAT_MAX_TIME * stats.floatDurationMultiplier;

    // Coyote timer update: grant grace period when walking off edges
    if (player.isGrounded) {
      player.coyoteTimer = COYOTE_TIME_MAX;
    } else if (player.coyoteTimer > 0) {
      player.coyoteTimer -= dt;
    }

    // Jump buffer update: buffer input slightly before landing
    if (input.jumpPressed) {
      player.jumpBufferTimer = JUMP_BUFFER_MAX;
    } else if (player.jumpBufferTimer > 0) {
      player.jumpBufferTimer -= dt;
    }

    // Execute jump if buffered and eligible
    if (player.jumpBufferTimer > 0) {
      if (player.isGrounded || player.coyoteTimer > 0) {
        player.vy = BASE_JUMP_FORCE * stats.jumpForceMultiplier;
        player.isGrounded = false;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
        player.floatTimer = maxFloatTime;
        soundEngine.playJump();
        addParticleBurst(player.x + 10, player.y + player.height, '#ffffff', 5);
      } else if (player.canDoubleJump && stats.relics.some((r) => r.id === 'stygian_feather')) {
        player.vy = BASE_JUMP_FORCE * stats.jumpForceMultiplier * 0.92;
        player.canDoubleJump = false;
        player.jumpBufferTimer = 0;
        player.floatTimer = maxFloatTime;
        soundEngine.playJump();
        addParticleBurst(player.x + 10, player.y + player.height, '#c084fc', 8);
      }
    }

    // Variable jump height: early release cuts upward momentum for precise short hops
    if (!input.jump && player.vy < -2.2) {
      player.vy *= 0.55;
    }

    // Floating/Gliding when holding jump in air (ethereal ghost glide)
    if (input.jump && !player.isGrounded && player.vy > -1.0 && player.floatTimer > 0) {
      player.isFloating = true;
      player.floatTimer -= dt;
      player.vy += FLOAT_GRAVITY;
      if (player.vy > 0.85) player.vy = 0.85; // Buoyant glide
      if (Math.random() < 0.12) {
        soundEngine.playFloat();
      }
    } else {
      player.isFloating = false;
      if (!player.isDashing) {
        player.vy += GRAVITY;
      }
    }

    if (player.vy > MAX_FALL_SPEED) {
      player.vy = MAX_FALL_SPEED;
    }

    // 4. Update Moving Platforms
    this.updateMovingPlatforms(level, dt);

    // 5. Update Crumbling Tiles
    this.updateCrumblingTiles(level, dt);

    // 6. Update Hazard Orbs
    this.updateHazardOrbs(level);

    // 7. Horizontal collision with tiles & push blocks
    player.x += player.vx;
    this.resolveHorizontalTileCollisions(player, level, stats);
    this.resolvePushBlockPushing(player, level, dt);

    // 8. Vertical collision with tiles & platforms
    player.isGrounded = false;
    player.y += player.vy;
    this.resolveVerticalTileCollisions(player, level);
    this.resolveMovingPlatformCollisions(player, level);

    // Reset double jump & float timer on landing
    if (player.isGrounded) {
      player.canDoubleJump = true;
      player.floatTimer = maxFloatTime;

      // Update safe checkpoint if standing on a stable, solid tile
      const standing = this.getTileAt(level, player.x + player.width / 2, player.y + player.height + 1);
      if (standing === TileType.SOLID || standing === TileType.ICE || standing === TileType.ONE_WAY) {
        player.checkpointX = player.x;
        player.checkpointY = player.y;
      }
    }

    // 9. Interactive Tiles (Wind, Bouncer, Spikes, Levers, Plates)
    this.handleTileInteractions(
      player,
      level,
      stats,
      onPlayerHurt,
      onDoorOpened,
      addParticleBurst
    );

    // 10. Item pickups & magnet
    this.handleItemPickups(
      player,
      level,
      stats,
      onKeyCollected,
      onWispCollected,
      addParticleBurst
    );

    // 11. Hazard collisions (Sparks / Orbs)
    if (!player.isDashing && player.invulnerableTimer <= 0) {
      level.hazardOrbs.forEach((orb) => {
        const dist = Math.hypot(
          player.x + player.width / 2 - orb.currentX,
          player.y + player.height / 2 - orb.currentY
        );
        if (dist < orb.size + player.width / 3) {
          this.applyPlayerDamage(player, onPlayerHurt, addParticleBurst);
        }
      });
    }

    // 12. Check Push Blocks onto Pressure Plates
    this.checkPressurePlates(level, onDoorOpened);
  }

  private applyPlayerDamage(
    player: PlayerPhysicsState,
    onPlayerHurt: () => void,
    addParticleBurst: (x: number, y: number, color: string, count?: number) => void
  ) {
    if (player.hasRoomShield) {
      player.hasRoomShield = false;
      player.invulnerableTimer = 1.0;
      soundEngine.playSwitch();
      addParticleBurst(player.x + 10, player.y + 10, '#c084fc', 12);
      return;
    }

    player.invulnerableTimer = 1.5;
    soundEngine.playHurt();
    addParticleBurst(player.x + 10, player.y + 10, '#f87171', 10);
    onPlayerHurt();
  }

  private resolveHorizontalTileCollisions(
    player: PlayerPhysicsState,
    level: LevelData,
    stats: PlayerStats
  ) {
    const ts = level.tileSize;
    const minTx = Math.floor(player.x / ts);
    const maxTx = Math.floor((player.x + player.width) / ts);
    const minTy = Math.floor(player.y / ts);
    const maxTy = Math.floor((player.y + player.height - 1) / ts);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (tx < 0 || tx >= level.widthInTiles || ty < 0 || ty >= level.heightInTiles) continue;
        const tile = level.tiles[ty][tx];

        if (this.isSolidTile(tile, level, tx, ty)) {
          if (player.vx > 0) {
            player.x = tx * ts - player.width;
            player.vx = 0;
          } else if (player.vx < 0) {
            player.x = (tx + 1) * ts;
            player.vx = 0;
          }
        }
      }
    }
  }

  private resolveVerticalTileCollisions(player: PlayerPhysicsState, level: LevelData) {
    const ts = level.tileSize;
    const minTx = Math.floor(player.x / ts);
    const maxTx = Math.floor((player.x + player.width - 1) / ts);
    const minTy = Math.floor(player.y / ts);
    const maxTy = Math.floor((player.y + player.height) / ts);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (tx < 0 || tx >= level.widthInTiles || ty < 0 || ty >= level.heightInTiles) continue;
        const tile = level.tiles[ty][tx];

        if (this.isSolidTile(tile, level, tx, ty)) {
          if (player.vy > 0) {
            // Landing on top of tile
            player.y = ty * ts - player.height;
            player.vy = 0;
            player.isGrounded = true;

            // Check if crumbling tile
            if (tile === TileType.CRUMBLING) {
              const crumb = level.crumblingTiles.find((c) => c.x === tx && c.y === ty);
              if (crumb && crumb.state === 'idle') {
                crumb.state = 'crumbling';
                crumb.steppedTimer = 0.45;
              }
            }
          } else if (player.vy < 0) {
            // Hitting ceiling
            player.y = (ty + 1) * ts;
            player.vy = 0;
          }
        } else if (tile === TileType.ONE_WAY) {
          // Landing on one-way platform only when falling from above
          const platformTop = ty * ts;
          const prevPlayerBottom = player.y + player.height - player.vy;
          if (player.vy > 0 && prevPlayerBottom <= platformTop + 4 && player.y + player.height >= platformTop) {
            player.y = platformTop - player.height;
            player.vy = 0;
            player.isGrounded = true;
          }
        }
      }
    }
  }

  private isSolidTile(tile: TileType, level: LevelData, tx: number, ty: number): boolean {
    if (tile === TileType.SOLID || tile === TileType.ICE) return true;
    if (tile === TileType.CRUMBLING) {
      const crumb = level.crumblingTiles.find((c) => c.x === tx && c.y === ty);
      return crumb ? crumb.state !== 'broken' : true;
    }
    if (tile === TileType.DOOR_LOCKED) {
      const door = level.doors.find((d) => d.x === tx && (d.y === ty || d.y + 1 === ty));
      return door ? !door.isOpen : true;
    }
    return false;
  }

  private resolveMovingPlatformCollisions(player: PlayerPhysicsState, level: LevelData) {
    level.movingPlatforms.forEach((p) => {
      // Check if landing on platform from above
      const playerBottom = player.y + player.height;
      const prevPlayerBottom = playerBottom - player.vy;

      if (
        player.vy >= 0 &&
        prevPlayerBottom <= p.y + 4 &&
        playerBottom >= p.y &&
        player.x + player.width > p.x &&
        player.x < p.x + p.width
      ) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.isGrounded = true;

        // Carry player with moving platform
        if (!p.isVertical) {
          player.x += p.speed * p.direction;
        } else {
          player.y += p.speed * p.direction;
        }
      }
    });
  }

  private resolvePushBlockPushing(player: PlayerPhysicsState, level: LevelData, dt: number) {
    level.pushBlocks.forEach((block) => {
      // Block physics (fall)
      if (!block.isGrounded) {
        block.vy += GRAVITY;
        block.y += block.vy;

        // Floor collision for push block
        const ts = level.tileSize;
        const btx = Math.floor((block.x + block.width / 2) / ts);
        const bty = Math.floor((block.y + block.height) / ts);
        if (bty < level.heightInTiles && this.isSolidTile(level.tiles[bty][btx], level, btx, bty)) {
          block.y = bty * ts - block.height;
          block.vy = 0;
          block.isGrounded = true;
        }
      }

      // Check if player pushes block
      const isTouchingX =
        player.y + player.height > block.y + 2 &&
        player.y < block.y + block.height - 2;

      if (isTouchingX) {
        // Player pushes from left
        if (player.x + player.width >= block.x && player.x < block.x && player.vx > 0) {
          block.x += player.vx;
          player.x = block.x - player.width;
          block.isGrounded = false;
        }
        // Player pushes from right
        else if (player.x <= block.x + block.width && player.x + player.width > block.x + block.width && player.vx < 0) {
          block.x += player.vx;
          player.x = block.x + block.width;
          block.isGrounded = false;
        }
      }

      // Allow standing on push block
      if (
        player.vy >= 0 &&
        player.y + player.height >= block.y &&
        player.y + player.height - player.vy <= block.y + 4 &&
        player.x + player.width > block.x + 2 &&
        player.x < block.x + block.width - 2
      ) {
        player.y = block.y - player.height;
        player.vy = 0;
        player.isGrounded = true;
      }
    });
  }

  private handleTileInteractions(
    player: PlayerPhysicsState,
    level: LevelData,
    stats: PlayerStats,
    onPlayerHurt: () => void,
    onDoorOpened: () => void,
    addParticleBurst: (x: number, y: number, color: string, count?: number) => void
  ) {
    const ts = level.tileSize;
    const centerTx = Math.floor((player.x + player.width / 2) / ts);
    const centerTy = Math.floor((player.y + player.height / 2) / ts);
    const bottomTy = Math.floor((player.y + player.height - 2) / ts);

    if (centerTx < 0 || centerTx >= level.widthInTiles || centerTy < 0 || centerTy >= level.heightInTiles) return;

    const tileAtCenter = level.tiles[centerTy][centerTx];
    const tileAtBottom = bottomTy < level.heightInTiles ? level.tiles[bottomTy][centerTx] : TileType.EMPTY;

    // Wind updraft
    if (tileAtCenter === TileType.WIND_UP || tileAtBottom === TileType.WIND_UP) {
      const windBoost = stats.relics.some((r) => r.id === 'tailwind_charm') ? 1.4 : 1.0;
      player.vy = -4.6 * windBoost;
      player.isFloating = true;
      if (Math.random() < 0.15) {
        soundEngine.playFloat();
      }
    }

    // Bouncer
    if (tileAtBottom === TileType.BOUNCER) {
      const bounceBoost = stats.relics.some((r) => r.id === 'tailwind_charm') ? 1.3 : 1.0;
      player.vy = -8.2 * bounceBoost;
      player.isGrounded = false;
      soundEngine.playJump();
      addParticleBurst(player.x + 10, player.y + player.height, '#4ade80', 8);
    }

    // Hazard Spikes (Up or Down)
    if (
      (tileAtBottom === TileType.SPIKE_UP || tileAtCenter === TileType.SPIKE_DOWN) &&
      !player.isDashing &&
      player.invulnerableTimer <= 0
    ) {
      this.applyPlayerDamage(player, onPlayerHurt, addParticleBurst);
      // Safely respawn at most recent solid checkpoint ledge
      player.x = player.checkpointX;
      player.y = player.checkpointY;
      player.vx = 0;
      player.vy = -2.0;
      player.isFloating = false;
      addParticleBurst(player.x + 10, player.y + 10, '#38bdf8', 8);
    }

    // Lever interaction
    level.levers.forEach((lever) => {
      const lpx = lever.x * ts;
      const lpy = lever.y * ts;
      if (
        Math.abs(player.x + player.width / 2 - (lpx + ts / 2)) < ts &&
        Math.abs(player.y + player.height / 2 - (lpy + ts / 2)) < ts
      ) {
        if (!lever.isActive) {
          lever.isActive = true;
          soundEngine.playSwitch();
          addParticleBurst(lpx + ts / 2, lpy + ts / 2, '#22c55e', 8);
          // Open connected doors
          level.doors.forEach((door) => {
            door.isOpen = true;
            level.tiles[door.y][door.x] = TileType.EMPTY;
            level.tiles[door.y + 1][door.x] = TileType.EMPTY;
          });
          soundEngine.playDoorOpen();
          onDoorOpened();
        }
      }
    });
  }

  private handleItemPickups(
    player: PlayerPhysicsState,
    level: LevelData,
    stats: PlayerStats,
    onKeyCollected: (keyId: string) => void,
    onWispCollected: (wispId: string, value: number) => void,
    addParticleBurst: (x: number, y: number, color: string, count?: number) => void
  ) {
    // Keys
    level.keys.forEach((key) => {
      if (key.collected) return;
      const dist = Math.hypot(player.x + player.width / 2 - (key.x + 8), player.y + player.height / 2 - (key.y + 8));
      if (dist < 18) {
        key.collected = true;
        soundEngine.playKey();
        addParticleBurst(key.x + 8, key.y + 8, '#facc15', 12);
        // Unlock all doors
        level.doors.forEach((door) => {
          door.isOpen = true;
          level.tiles[door.y][door.x] = TileType.EMPTY;
          level.tiles[door.y + 1][door.x] = TileType.EMPTY;
        });
        soundEngine.playDoorOpen();
        onKeyCollected(key.id);
      }
    });

    // Soul Wisps & Magnet
    const magnetRange = stats.soulMagnetRange;
    level.wisps.forEach((wisp) => {
      if (wisp.collected) return;

      const dx = player.x + player.width / 2 - (wisp.x + 8);
      const dy = player.y + player.height / 2 - (wisp.y + 8);
      const dist = Math.hypot(dx, dy);

      // Magnet pull
      if (magnetRange > 0 && dist < magnetRange) {
        wisp.x += (dx / dist) * 3.5;
        wisp.y += (dy / dist) * 3.5;
      }

      if (dist < 16) {
        wisp.collected = true;
        soundEngine.playWisp();
        addParticleBurst(wisp.x + 8, wisp.y + 8, '#38bdf8', 8);
        onWispCollected(wisp.id, wisp.value);
      }
    });
  }

  private checkPressurePlates(level: LevelData, onDoorOpened: () => void) {
    const ts = level.tileSize;

    level.pressurePlates.forEach((plate) => {
      const px = plate.x * ts;
      const py = plate.y * ts;

      // Check if any pushblock is sitting on plate
      const isPressedByBlock = level.pushBlocks.some(
        (b) =>
          Math.abs(b.x - px) < ts * 0.8 &&
          Math.abs(b.y + b.height - (py + ts)) < 6
      );

      const previouslyPressed = plate.isPressed;
      plate.isPressed = isPressedByBlock;

      if (!previouslyPressed && plate.isPressed) {
        soundEngine.playSwitch();
        level.doors.forEach((door) => {
          door.isOpen = true;
          level.tiles[door.y][door.x] = TileType.EMPTY;
          level.tiles[door.y + 1][door.x] = TileType.EMPTY;
        });
        soundEngine.playDoorOpen();
        onDoorOpened();
      }
    });
  }

  private updateMovingPlatforms(level: LevelData, dt: number) {
    level.movingPlatforms.forEach((p) => {
      const minX = Math.min(p.startX, p.targetX);
      const maxX = Math.max(p.startX, p.targetX);
      const minY = Math.min(p.startY, p.targetY);
      const maxY = Math.max(p.startY, p.targetY);

      if (!p.isVertical) {
        p.x += p.speed * p.direction;
        if (p.direction === 1 && p.x >= maxX) {
          p.x = maxX;
          p.direction = -1;
        } else if (p.direction === -1 && p.x <= minX) {
          p.x = minX;
          p.direction = 1;
        }
      } else {
        p.y += p.speed * p.direction;
        if (p.direction === 1 && p.y >= maxY) {
          p.y = maxY;
          p.direction = -1;
        } else if (p.direction === -1 && p.y <= minY) {
          p.y = minY;
          p.direction = 1;
        }
      }
    });
  }

  private updateCrumblingTiles(level: LevelData, dt: number) {
    level.crumblingTiles.forEach((crumb) => {
      if (crumb.state === 'crumbling') {
        crumb.steppedTimer -= dt;
        if (crumb.steppedTimer <= 0) {
          crumb.state = 'broken';
          crumb.respawnTimer = 3.0;
        }
      } else if (crumb.state === 'broken') {
        crumb.respawnTimer -= dt;
        if (crumb.respawnTimer <= 0) {
          crumb.state = 'idle';
        }
      }
    });
  }

  private updateHazardOrbs(level: LevelData) {
    level.hazardOrbs.forEach((orb) => {
      orb.angle += orb.speed;
      orb.currentX = orb.centerX + Math.cos(orb.angle) * orb.radius;
      orb.currentY = orb.centerY + Math.sin(orb.angle) * orb.radius;
    });
  }

  private getTileAt(level: LevelData, x: number, y: number): TileType {
    const tx = Math.floor(x / level.tileSize);
    const ty = Math.floor(y / level.tileSize);
    if (tx < 0 || tx >= level.widthInTiles || ty < 0 || ty >= level.heightInTiles) {
      return TileType.SOLID;
    }
    return level.tiles[ty][tx];
  }
}
