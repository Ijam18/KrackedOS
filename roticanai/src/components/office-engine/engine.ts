/**
 * Character FSM for the pixel art office engine.
 */

export const TILE = 16;
export const ZOOM = 3;

export const CharacterState = {
  IDLE: "idle",
  WALK: "walk",
  TYPE: "type",
} as const;
export type CharacterState =
  (typeof CharacterState)[keyof typeof CharacterState];

export const Direction = {
  DOWN: 0,
  LEFT: 1,
  RIGHT: 2,
  UP: 3,
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export interface Character {
  id: number;
  state: CharacterState;
  dir: Direction;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  frame: number;
  frameTimer: number;
  wanderTimer: number;
  palette: number;
  isMain: boolean;
  currentLabel: string | null;
}

// ── Animation constants ───────────────────────────────────────────

const TYPE_FRAME_DURATION_SEC = 0.3;
const WALK_FRAME_DURATION_SEC = 0.15;
const WALK_SPEED_PX_PER_SEC = 48 * ZOOM;
const WANDER_PAUSE_MIN_SEC = 2.0;
const WANDER_PAUSE_MAX_SEC = 8.0;

// ── Label → animation ─────────────────────────────────────────────

const READING_PATTERNS = [
  "read",
  "search",
  "analyz",
  "fetch",
  "glob",
  "check",
  "look",
];

export function isReadingLabel(label: string | null): boolean {
  if (!label) return false;
  const l = label.toLowerCase();
  return READING_PATTERNS.some((p) => l.includes(p));
}

// ── Character FSM ─────────────────────────────────────────────────

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function updateCharacter(
  ch: Character,
  dt: number,
  walkableCenters: Array<{ x: number; y: number }>,
): void {
  ch.frameTimer += dt;

  switch (ch.state) {
    case CharacterState.TYPE: {
      if (ch.frameTimer >= TYPE_FRAME_DURATION_SEC) {
        ch.frameTimer -= TYPE_FRAME_DURATION_SEC;
        ch.frame = (ch.frame + 1) % 2;
      }
      if (ch.isMain) break;
      ch.wanderTimer -= dt;
      if (ch.wanderTimer <= 0) {
        ch.state = CharacterState.IDLE;
        ch.frame = 0;
        ch.frameTimer = 0;
        ch.wanderTimer = randomRange(
          WANDER_PAUSE_MIN_SEC,
          WANDER_PAUSE_MAX_SEC,
        );
      }
      break;
    }

    case CharacterState.IDLE: {
      ch.frame = 0;
      ch.wanderTimer -= dt;
      if (ch.wanderTimer <= 0) {
        if (walkableCenters.length > 0) {
          const target =
            walkableCenters[Math.floor(Math.random() * walkableCenters.length)];
          ch.targetX = target.x;
          ch.targetY = target.y;
          ch.state = CharacterState.WALK;
          ch.frame = 0;
          ch.frameTimer = 0;
        }
        ch.wanderTimer = randomRange(
          WANDER_PAUSE_MIN_SEC,
          WANDER_PAUSE_MAX_SEC,
        );
      }
      break;
    }

    case CharacterState.WALK: {
      if (ch.frameTimer >= WALK_FRAME_DURATION_SEC) {
        ch.frameTimer -= WALK_FRAME_DURATION_SEC;
        ch.frame = (ch.frame + 1) % 4;
      }

      const dx = ch.targetX - ch.x;
      const dy = ch.targetY - ch.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = WALK_SPEED_PX_PER_SEC * dt;

      if (dist <= step) {
        ch.x = ch.targetX;
        ch.y = ch.targetY;
        ch.state = CharacterState.IDLE;
        ch.wanderTimer = randomRange(
          WANDER_PAUSE_MIN_SEC,
          WANDER_PAUSE_MAX_SEC,
        );
        ch.frame = 0;
        ch.frameTimer = 0;
      } else {
        ch.x += (dx / dist) * step;
        ch.y += (dy / dist) * step;
        if (Math.abs(dx) >= Math.abs(dy)) {
          ch.dir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
        } else {
          ch.dir = dy > 0 ? Direction.DOWN : Direction.UP;
        }
      }
      break;
    }
  }
}
