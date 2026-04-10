/**
 * PixiJS v8 restaurant scene.
 * Imported dynamically (inside useEffect) — never runs during SSR.
 *
 * Layout: 6 cols × 4 rows, 160 px per tile
 *
 *  Row 0: walls (flag @ col 2, menuboard @ col 5)
 *  Row 1: shelf-1 | shelf-2 | plant+watercooler | empty | receptionist-desk (2-tile)
 *  Row 2: front-facing chairs × 4 | empty × 2
 *  Row 3: wooden-desk + back-chair × 4 | empty × 2
 */
import {
  AnimatedSprite,
  type Application,
  Assets,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  Texture,
  TextureSource,
} from "pixi.js";

import {
  type Character,
  CharacterState,
  Direction,
  isReadingLabel,
  updateCharacter,
} from "./engine";

// ── Scene dimensions ───────────────────────────────────────────────
const SCENE_TILE = 160; // environment tile size (px)
const COLS = 6;
const ROWS = 4;
export const CANVAS_W = COLS * SCENE_TILE; // 960
export const CANVAS_H = ROWS * SCENE_TILE; // 640

const T = SCENE_TILE;

// ── Character sprite-sheet constants ──────────────────────────────
// Sheet layout: 7 cols × 16 px, 3 direction rows × 32 px
// cols: 0=walk1 1=walk2 2=walk3  3=type1 4=type2  5=read1 6=read2
// rows: 0=down  1=up   2=right   (left = scale.x flip)
const PNG_W = 16;
const PNG_H = 32;
const CHAR_ZOOM = 5; // characters render at 80 × 160 px against 160 px tiles

const WALK_SPD = 1 / (0.15 * 60); // ≈ 0.111 frames/tick → 0.15 s/frame
const TYPE_SPD = 1 / (0.3 * 60); //  ≈ 0.056 frames/tick → 0.30 s/frame
const SITTING_OFFSET = 6 * CHAR_ZOOM; // 18 px (lifts sprite up when seated)

// ── Walkable tile centres (canvas px) ─────────────────────────────
// Open floor in right half: cols 3-5, rows 1-3
const WALKABLE: { x: number; y: number }[] = [
  { x: 3.5 * T, y: 1.5 * T },
  { x: 4.5 * T, y: 1.5 * T },
  { x: 5.5 * T, y: 1.5 * T },
  { x: 3.5 * T, y: 2.5 * T },
  { x: 4.5 * T, y: 2.5 * T },
  { x: 5.5 * T, y: 2.5 * T },
  { x: 3.5 * T, y: 3.5 * T },
  { x: 4.5 * T, y: 3.5 * T },
  { x: 5.5 * T, y: 3.5 * T },
];

// ── Environment asset URLs ────────────────────────────────────────
const ENV = {
  wall: "/assets/environment/wall.png",
  floor: "/assets/environment/floor.png",
  shelf1: "/assets/environment/shelf-1.png",
  shelf2: "/assets/environment/shelf-2.png",
  plant: "/assets/environment/plant.png",
  watercooler: "/assets/environment/watercooler.png",
  flag: "/assets/environment/malaysian-flag.png",
  menuboard: "/assets/environment/menu-board.png",
  receptionistDesk: "/assets/environment/receptionist-desk.png",
  frontChair: "/assets/environment/front-facing-plastic-chair.png",
  backChair: "/assets/environment/back-facing-plastic-chair.png",
  woodenDesk: "/assets/environment/wooden-desk.png",
} as const;

// ── Animation keys ────────────────────────────────────────────────
type DirKey = "down" | "up" | "right";
type AnimKey =
  | `walk-${DirKey}`
  | `type-${DirKey}`
  | `read-${DirKey}`
  | `idle-${DirKey}`;

function animKey(
  state: CharacterState,
  dir: Direction,
  label: string | null,
): AnimKey {
  const d: DirKey =
    dir === Direction.DOWN ? "down" : dir === Direction.UP ? "up" : "right";
  if (state === CharacterState.WALK) return `walk-${d}`;
  if (state === CharacterState.TYPE)
    return isReadingLabel(label) ? `read-${d}` : `type-${d}`;
  return `idle-${d}`;
}

type AnimMap = Record<AnimKey, Texture[]>;

function buildAnimMap(base: Texture): AnimMap {
  const f = (col: number, row: number) =>
    new Texture({
      source: base.source,
      frame: new Rectangle(col * PNG_W, row * PNG_H, PNG_W, PNG_H),
    });
  const fs = (cols: number[], row: number) => cols.map((c) => f(c, row));
  return {
    "walk-down": fs([0, 1, 2, 1], 0),
    "walk-up": fs([0, 1, 2, 1], 1),
    "walk-right": fs([0, 1, 2, 1], 2),
    "type-down": fs([3, 4], 0),
    "type-up": fs([3, 4], 1),
    "type-right": fs([3, 4], 2),
    "read-down": fs([5, 6], 0),
    "read-up": fs([5, 6], 1),
    "read-right": fs([5, 6], 2),
    "idle-down": fs([1], 0),
    "idle-up": fs([1], 1),
    "idle-right": fs([1], 2),
  };
}

// ── Seated NPC FSM ────────────────────────────────────────────────
// Cycles TYPE ↔ IDLE at random intervals; never walks.
const NPC_TYPE_MIN = 2.0;
const NPC_TYPE_MAX = 6.0;
const NPC_IDLE_MIN = 1.0;
const NPC_IDLE_MAX = 3.5;
const NPC_TYPE_FRAME_DUR = 0.3; // seconds per typing frame

function updateSeatedNpc(ch: PixiChar, dt: number): void {
  ch.frameTimer += dt;
  if (ch.state === CharacterState.TYPE) {
    if (ch.frameTimer >= NPC_TYPE_FRAME_DUR) {
      ch.frameTimer -= NPC_TYPE_FRAME_DUR;
      ch.frame = (ch.frame + 1) % 2;
    }
    ch.wanderTimer -= dt;
    if (ch.wanderTimer <= 0) {
      ch.state = CharacterState.IDLE;
      ch.frame = 0;
      ch.frameTimer = 0;
      ch.wanderTimer =
        NPC_IDLE_MIN + Math.random() * (NPC_IDLE_MAX - NPC_IDLE_MIN);
    }
  } else {
    ch.frame = 0;
    ch.wanderTimer -= dt;
    if (ch.wanderTimer <= 0) {
      ch.state = CharacterState.TYPE;
      ch.frame = 0;
      ch.frameTimer = 0;
      ch.wanderTimer =
        NPC_TYPE_MIN + Math.random() * (NPC_TYPE_MAX - NPC_TYPE_MIN);
    }
  }
}

// ── Main-agent pacing constants ───────────────────────────────────
const PACE_SPEED = 110; // canvas px / s
const PACE_WALK_FRAME_DUR = 0.15; // s per walk frame
const PAUSE_MIN = 1.8; // s standing idle at each end (min)
const PAUSE_MAX = 3.2; // s standing idle at each end (max)

// ── PixiChar ──────────────────────────────────────────────────────
interface PixiChar extends Character {
  sprite: AnimatedSprite;
  animations: AnimMap;
  prevKey: AnimKey;
  zBoost: number;
  seated: boolean; // true = always apply SITTING_OFFSET, use seated NPC FSM
}

// ── Speech bubble helpers ─────────────────────────────────────────
function labelToDialog(label: string | null): string {
  if (!label) return "On it...";
  const clean = label.trim().replace(/[.!?…]+$/, "");
  const lower = clean.charAt(0).toLowerCase() + clean.slice(1);
  if (/^\w+ing\b/.test(lower)) return `I'm ${lower}...`;
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}...`;
}

// ── Public API ─────────────────────────────────────────────────────
export interface PixiScene {
  update(
    dt: number,
    label: string | null,
    taskLabel: string | null,
    isReasoning: boolean,
  ): void;
  destroy(): void;
}

export async function createPixiScene(app: Application): Promise<PixiScene> {
  TextureSource.defaultOptions.scaleMode = "nearest";

  // Load all assets in parallel
  // char_5 is the main agent sprite; chars 1–3 are NPC palettes
  const charUrls = [5, 1, 2, 3].map((i) => `/assets/characters/char_${i}.png`);
  const envUrls = Object.values(ENV);

  const [charTexMap, envTexMap] = await Promise.all([
    Assets.load<Texture>(charUrls),
    Assets.load<Texture>(envUrls),
  ]);

  const baseTex = charUrls.map((u) => charTexMap[u]);
  const e = (key: keyof typeof ENV) => envTexMap[ENV[key]];

  // ── Stage ────────────────────────────────────────────────────────
  const stage = app.stage;
  stage.sortableChildren = true;

  // helper: add sprite with z
  function add(tex: Texture, x: number, y: number, z: number) {
    const s = new Sprite(tex);
    s.position.set(x, y);
    s.zIndex = z;
    stage.addChild(s);
    return s;
  }

  // ── Floor (all tiles, base layer) ────────────────────────────────
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      add(e("floor"), col * T, row * T, 0);
    }
  }

  // ── Row 0: walls ─────────────────────────────────────────────────
  for (let col = 0; col < COLS; col++) {
    add(e("wall"), col * T, 0, 10);
  }
  // Flag: 128 × 64 — centered in col 2 wall tile
  add(e("flag"), 2 * T + (T - 128) / 2, (T - 64) / 2, 20);
  // Menuboard: 128 × 96 — centred horizontally and vertically in col 5 wall tile (same row as flag)
  add(e("menuboard"), 5 * T + (T - 128) / 2, (T - 96) / 2, 20);

  // ── Row 1: shelves, plant, watercooler, receptionist desk ────────
  // shelf-1 (160×160) fills tile exactly at col 0
  add(e("shelf1"), 0, T, 2 * T);
  // shelf-2 (160×160) at col 1
  add(e("shelf2"), T, T, 2 * T);
  // plant (64×64) — bottom-aligned, left half of col 2
  add(e("plant"), 2 * T, 2 * T - 64, 2 * T);
  // watercooler (96×96) — bottom-aligned, right of plant in col 2
  add(e("watercooler"), 2 * T + 64, 2 * T - 96, 2 * T);
  const DESK_W = 448;
  // receptionist desk (448×96) — right-aligned to canvas edge, bottom at row 1 bottom
  add(e("receptionistDesk"), CANVAS_W - DESK_W, 2 * T - 96, 2 * T);

  // ── Row 2: front-facing chairs (cols 0-3, bottom-aligned) ────────
  for (let col = 0; col < 4; col++) {
    // 96×96, centered in tile, bottom of row 2
    add(e("frontChair"), col * T + (T - 96) / 2, 3 * T - 96, 3 * T);
  }

  // ── Row 3: wooden desks (top-aligned) + back chairs (bottom-aligned) ──
  for (let col = 0; col < 4; col++) {
    // wooden desk (160×96) — top of row 3
    add(e("woodenDesk"), col * T, 3 * T, 3 * T + 96);
    // back-facing chair (96×96) — bottom of row 3, centered
    add(e("backChair"), col * T + (T - 96) / 2, 4 * T - 96, 4 * T);
  }

  // ── Characters ───────────────────────────────────────────────────
  // Main agent sits at desk col 1 (UP-facing = looking at monitor)
  // Seated y: positioned so they appear inside the back chair + desk
  // CHAR_ZOOM=5 → sprite 80×160, SITTING_OFFSET=30.
  // DESK_Y=528: sprite top=528+30-160=398 (above desk at y=480), bottom=558 (within desk 480-576).
  // zIndex=528 < desk zIndex 576 → desk covers mid-body; back-chair (640) covers legs.

  // Receptionist desk: 448 × 96, right-aligned to canvas edge, bottom at y=2*T=320, zIndex=320.
  // CHAR_ZOOM=5 → sprite 80×160 px, SITTING_OFFSET=30.
  // RECEPTION_Y=210: sprite top = 210+30-160 = 80, visible above desk top (y=224) = 144 px
  // → full head + torso above counter. sprite bottom=240, zIndex=210 < 320 ✓.
  const RECEPTION_X = CANVAS_W - DESK_W / 2; // centre of right-aligned desk (736)
  const RECEPTION_Y = 210;

  const charDefs: Array<{
    id: number;
    x: number;
    y: number;
    dir: Direction;
    palette: number;
    isMain: boolean;
    wanderTimer: number;
    state: CharacterState;
    frameStart: number; // initial animation frame (for desyncing NPCs)
    zBoost: number; // added to ch.y when computing sprite zIndex
    seated: boolean;
  }> = [
    // Main agent: idle receptionist — stands at desk, never wanders, talks via speech bubble.
    // zBoost=0 keeps zIndex=210 below desk zIndex=320 → desk renders over lower body ✓.
    {
      id: 0,
      x: RECEPTION_X,
      y: RECEPTION_Y,
      dir: Direction.DOWN,
      palette: 0,
      isMain: true,
      wanderTimer: 0,
      state: CharacterState.IDLE,
      frameStart: 0,
      zBoost: 0,
      seated: false,
    },
    // NPCs: seated in front-facing chairs (cols 0–2), facing the observer (DOWN).
    // isMain=false + seated=true → use updateSeatedNpc (TYPE↔IDLE cycling, no walk).
    // Staggered wanderTimer + frameStart so they're never in sync.
    // zBoost=T → zIndex 420+160=580 > front-chair 480 → char in front of chair ✓.
    {
      id: 1,
      x: 0.5 * T,
      y: 420,
      dir: Direction.DOWN,
      palette: 1,
      isMain: false,
      wanderTimer: 1.3,
      state: CharacterState.TYPE,
      frameStart: 0,
      zBoost: T,
      seated: true,
    },
    {
      id: 2,
      x: 1.5 * T,
      y: 420,
      dir: Direction.DOWN,
      palette: 2,
      isMain: false,
      wanderTimer: 2.5,
      state: CharacterState.IDLE,
      frameStart: 0,
      zBoost: T,
      seated: true,
    },
    {
      id: 3,
      x: 2.5 * T,
      y: 420,
      dir: Direction.DOWN,
      palette: 3,
      isMain: false,
      wanderTimer: 3.9,
      state: CharacterState.TYPE,
      frameStart: 1,
      zBoost: T,
      seated: true,
    },
  ];

  const pixiChars: PixiChar[] = charDefs.map((def) => {
    const animations = buildAnimMap(baseTex[def.palette]);
    const initKey: AnimKey = animKey(def.state, def.dir, null);
    const sprite = new AnimatedSprite(animations[initKey]);
    sprite.animationSpeed =
      def.state === CharacterState.TYPE ? TYPE_SPD : WALK_SPD;
    sprite.anchor.set(0.5, 1.0); // bottom-centre pivot
    sprite.scale.x = def.dir === Direction.LEFT ? -CHAR_ZOOM : CHAR_ZOOM;
    sprite.scale.y = CHAR_ZOOM;
    const sitOff = def.state === CharacterState.TYPE ? SITTING_OFFSET : 0;
    sprite.position.set(def.x, def.y + sitOff);
    sprite.zIndex = def.y + def.zBoost;
    if (def.state === CharacterState.TYPE) sprite.play();
    stage.addChild(sprite);

    return {
      id: def.id,
      state: def.state,
      dir: def.dir,
      x: def.x,
      y: def.y,
      targetX: def.x,
      targetY: def.y,
      frame: def.frameStart,
      frameTimer: def.frameStart * NPC_TYPE_FRAME_DUR,
      wanderTimer: def.wanderTimer,
      palette: def.palette,
      isMain: def.isMain,
      currentLabel: null,
      sprite,
      animations,
      prevKey: initKey,
      zBoost: def.zBoost,
      seated: def.seated,
    };
  });

  // ── Speech bubble ────────────────────────────────────────────────
  // Anchor at the bottom (foot) of the main char sprite — bubble draws below.
  const BUBBLE_AY = charDefs[0].y + SITTING_OFFSET; // foot of main agent sprite

  const bubbleGfx = new Graphics();
  const bubbleText = new Text({
    text: "",
    style: new TextStyle({
      fontFamily: "ui-monospace, monospace",
      fontSize: 15,
      fontWeight: "500",
      fill: 0xd8d8f0,
      wordWrap: true,
      wordWrapWidth: 280,
    }),
  });
  bubbleGfx.zIndex = 990;
  bubbleText.zIndex = 991;
  bubbleGfx.visible = false;
  bubbleText.visible = false;
  stage.addChild(bubbleGfx);
  stage.addChild(bubbleText);

  let bubbleTimer = 0;
  let prevTool: string | null = null;

  // ── Main-agent pacing state ───────────────────────────────────────
  // Pacing bounds: 60 px margin inside each end of the desk
  const paceLeftX = CANVAS_W - DESK_W + 60;
  const paceRightX = CANVAS_W - 60;
  type PacePhase = "idle" | "walk" | "pause";
  let pacePhase: PacePhase = "idle";
  let pauseTimer = 0;

  // ── Per-frame update ─────────────────────────────────────────────
  function update(
    dt: number,
    label: string | null,
    taskLabel: string | null,
    isReasoning: boolean,
  ) {
    const isActive = !!(label || isReasoning);
    const mainCh = pixiChars[0];

    // --- Main-agent pacing FSM (walk → pause+bubble → walk → …) ---
    if (!isActive) {
      // Nothing to do: stand still wherever the agent is.
      if (mainCh.state === CharacterState.WALK) {
        mainCh.state = CharacterState.IDLE;
        mainCh.frame = 0;
        mainCh.frameTimer = 0;
        mainCh.dir = Direction.DOWN;
      }
      pacePhase = "idle";
    } else {
      if (pacePhase === "idle") {
        // Kick off first walk
        const mid = (paceLeftX + paceRightX) / 2;
        mainCh.targetX = mainCh.x <= mid ? paceRightX : paceLeftX;
        mainCh.state = CharacterState.WALK;
        mainCh.frame = 0;
        mainCh.frameTimer = 0;
        mainCh.dir =
          mainCh.targetX > mainCh.x ? Direction.RIGHT : Direction.LEFT;
        pacePhase = "walk";
      }

      if (pacePhase === "walk") {
        // Advance walk animation
        mainCh.frameTimer += dt;
        if (mainCh.frameTimer >= PACE_WALK_FRAME_DUR) {
          mainCh.frameTimer -= PACE_WALK_FRAME_DUR;
          mainCh.frame = (mainCh.frame + 1) % 4;
        }
        // Move toward target
        const dx = mainCh.targetX - mainCh.x;
        const step = PACE_SPEED * dt;
        if (Math.abs(dx) <= step) {
          // Arrived — stop, face forward, start pause
          mainCh.x = mainCh.targetX;
          mainCh.state = CharacterState.IDLE;
          mainCh.frame = 0;
          mainCh.frameTimer = 0;
          mainCh.dir = Direction.DOWN;
          pauseTimer = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN);
          pacePhase = "pause";
        } else {
          mainCh.x += Math.sign(dx) * step;
          mainCh.dir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
        }
      } else if (pacePhase === "pause") {
        pauseTimer -= dt;
        if (pauseTimer <= 0) {
          // Done pausing — walk to the other end
          mainCh.targetX = mainCh.x <= paceLeftX ? paceRightX : paceLeftX;
          mainCh.state = CharacterState.WALK;
          mainCh.frame = 0;
          mainCh.frameTimer = 0;
          mainCh.dir =
            mainCh.targetX > mainCh.x ? Direction.RIGHT : Direction.LEFT;
          pacePhase = "walk";
        }
      }
    }

    // --- NPC FSM + sprite sync for all characters ---
    for (const ch of pixiChars) {
      ch.currentLabel = ch.isMain ? label : null;
      if (ch.seated) {
        updateSeatedNpc(ch, dt);
      } else if (!ch.isMain) {
        updateCharacter(ch, dt, WALKABLE);
      }
      // (main agent FSM already handled above)

      const key = animKey(ch.state, ch.dir, ch.currentLabel);
      if (key !== ch.prevKey) {
        ch.sprite.textures = ch.animations[key];
        ch.sprite.animationSpeed = key.startsWith("walk") ? WALK_SPD : TYPE_SPD;
        if (ch.state === CharacterState.IDLE) {
          ch.sprite.gotoAndStop(0);
        } else {
          ch.sprite.gotoAndPlay(0);
        }
        ch.prevKey = key;
      } else {
        if (ch.state === CharacterState.IDLE && ch.sprite.playing)
          ch.sprite.stop();
        else if (ch.state !== CharacterState.IDLE && !ch.sprite.playing)
          ch.sprite.play();
      }

      const wantScaleX = ch.dir === Direction.LEFT ? -CHAR_ZOOM : CHAR_ZOOM;
      if (ch.sprite.scale.x !== wantScaleX) ch.sprite.scale.x = wantScaleX;

      // Main agent and seated NPCs always keep the sitting offset regardless of state.
      const sitOff =
        ch.isMain || ch.seated || ch.state === CharacterState.TYPE
          ? SITTING_OFFSET
          : 0;
      ch.sprite.position.set(ch.x, ch.y + sitOff);
      ch.sprite.zIndex = ch.y + ch.zBoost;
    }

    // --- Speech bubble (only while agent is paused/idle, not walking) ---
    let bubbleContent: string | null = null;
    if (pacePhase === "pause") {
      if (label) {
        if (label !== prevTool) {
          bubbleTimer = 0;
          prevTool = label;
        }
        bubbleTimer += dt;
        const TOOL_DUR = 2.5;
        const CYCLE = TOOL_DUR + 2.0;
        const phase = bubbleTimer % CYCLE;
        bubbleContent =
          taskLabel && phase > TOOL_DUR
            ? `This is for ${taskLabel.charAt(0).toLowerCase()}${taskLabel.slice(1)}`
            : labelToDialog(label);
      } else if (isReasoning) {
        bubbleContent = "Hmm, I'm thinking...";
      }
    }

    if (!bubbleContent) {
      bubbleGfx.visible = false;
      bubbleText.visible = false;
      return;
    }

    bubbleText.text = bubbleContent;
    bubbleGfx.visible = true;
    bubbleText.visible = true;

    const PAD_X = 18;
    const PAD_Y = 13;
    const TAIL_H = 14;
    const RADIUS = 10;
    const MARGIN = 6;

    // Anchor tracks the main agent's current x (they may have stopped at either end).
    const anchorX = mainCh.x;
    const anchorY = BUBBLE_AY;

    const bw = bubbleText.width + PAD_X * 2;
    const bh = bubbleText.height + PAD_Y * 2;
    let bx = anchorX - bw / 2;
    if (bx < MARGIN) bx = MARGIN;
    if (bx + bw > CANVAS_W - MARGIN) bx = CANVAS_W - MARGIN - bw;
    // Bubble body sits BELOW the anchor; tail base is the top edge of the box.
    const by = anchorY + TAIL_H;
    const tailX = Math.min(
      Math.max(anchorX, bx + RADIUS + 6),
      bx + bw - RADIUS - 6,
    );
    const tailBaseY = by; // tail base at top of bubble body

    bubbleText.position.set(bx + PAD_X, by + PAD_Y);

    bubbleGfx.clear();
    bubbleGfx
      .roundRect(bx + 1, by + 2, bw, bh, RADIUS)
      .fill({ color: 0x000000, alpha: 0.3 });
    bubbleGfx
      .roundRect(bx, by, bw, bh, RADIUS)
      .fill({ color: 0x12121e, alpha: 0.93 });
    bubbleGfx
      .roundRect(bx, by, bw, bh, RADIUS)
      .stroke({ color: 0x8c8cd2, width: 1.5, alpha: 0.7 });
    // Tail: base at top of bubble, tip points UP to character foot.
    bubbleGfx
      .poly([tailX - 5, tailBaseY, tailX + 5, tailBaseY, tailX, anchorY])
      .fill({ color: 0x12121e, alpha: 0.93 });
    bubbleGfx
      .moveTo(tailX - 5, tailBaseY + 1)
      .lineTo(tailX, anchorY)
      .stroke({ color: 0x8c8cd2, width: 1.5, alpha: 0.7 });
    bubbleGfx
      .moveTo(tailX + 5, tailBaseY + 1)
      .lineTo(tailX, anchorY)
      .stroke({ color: 0x8c8cd2, width: 1.5, alpha: 0.7 });
  }

  function destroy() {
    for (const ch of pixiChars) ch.sprite.destroy();
    bubbleGfx.destroy();
    bubbleText.destroy();
  }

  return { update, destroy };
}
