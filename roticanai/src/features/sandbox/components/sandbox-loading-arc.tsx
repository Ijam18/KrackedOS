"use client";

import { useAnimationFrame } from "motion/react";
import Image from "next/image";
import { useState } from "react";

const desktopImageSrcs = [
  "/hero-arc/left-0.png",
  "/hero-arc/left-1.png",
  "/hero-arc/left-2.png",
  "/hero-arc/left-3.png",
  "/hero-arc/center.png",
  "/hero-arc/right-0.png",
  "/hero-arc/right-1.png",
  "/hero-arc/right-2.png",
  "/hero-arc/right-3.png",
];

const mobileImageSrcs = [
  "/hero-arc/left-2.png",
  "/hero-arc/left-3.png",
  "/hero-arc/center.png",
  "/hero-arc/right-0.png",
  "/hero-arc/right-1.png",
];

const IMAGE_SIZES: Record<string, { width: number; height: number }> = {
  "/hero-arc/center.png": { width: 171, height: 73 },
  "/hero-arc/right-1.png": { width: 169, height: 105 },
};
const DEFAULT_SIZE = { width: 138, height: 138 };

// Desktop circle config — all in vw
const CIRCLE_RADIUS_VW = 42;
const CIRCLE_CENTER_X_VW = 50;
const CIRCLE_CENTER_Y_VW = 62;
const START_ANGLE_DEG = 190;
const END_ANGLE_DEG = 350;
const ROTATION_SCALE = 0.45;

// Mobile circle config — uses vw so the arc is round
const M_CIRCLE_RADIUS_VW = 50;
const M_CIRCLE_CENTER_X_VW = 50;
const M_CIRCLE_CENTER_Y_VW = 130;
const M_START_ANGLE_DEG = 220;
const M_END_ANGLE_DEG = 320;
const M_ROTATION_SCALE = 0.45;

// Degrees per second — full revolution in 60s
const DEGREES_PER_SECOND = 6;

function getCirclePosition(
  angleDeg: number,
  cx: number,
  cy: number,
  r: number,
  rotScale: number,
) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
    rotation: (angleDeg - 270) * rotScale,
  };
}

/** Wrap an angle so it stays within [startDeg, endDeg) — conveyor belt effect */
function wrapAngle(angle: number, startDeg: number, endDeg: number) {
  const span = endDeg - startDeg;
  return startDeg + ((((angle - startDeg) % span) + span) % span);
}

function getBaseAngles(count: number, startDeg: number, endDeg: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return startDeg + t * (endDeg - startDeg);
  });
}

const desktopBaseAngles = getBaseAngles(
  desktopImageSrcs.length,
  START_ANGLE_DEG,
  END_ANGLE_DEG,
);
const mobileBaseAngles = getBaseAngles(
  mobileImageSrcs.length,
  M_START_ANGLE_DEG,
  M_END_ANGLE_DEG,
);

export function SandboxLoadingArc() {
  const [angleOffset, setAngleOffset] = useState(0);

  useAnimationFrame((_, delta) => {
    // Counter-clockwise = negative offset
    setAngleOffset((prev) => prev - (delta / 1000) * DEGREES_PER_SECOND);
  });

  return (
    <>
      {/* Mobile arc */}
      <div className="relative flex-1 w-full md:hidden">
        {mobileImageSrcs.map((src, i) => {
          const angle = wrapAngle(
            mobileBaseAngles[i] + angleOffset,
            M_START_ANGLE_DEG,
            M_END_ANGLE_DEG,
          );
          const pos = getCirclePosition(
            angle,
            M_CIRCLE_CENTER_X_VW,
            M_CIRCLE_CENTER_Y_VW,
            M_CIRCLE_RADIUS_VW,
            M_ROTATION_SCALE,
          );
          const size = IMAGE_SIZES[src] ?? DEFAULT_SIZE;
          return (
            <div
              key={src}
              className="absolute"
              style={{
                left: `${pos.x}vw`,
                top: `${pos.y}vw`,
                transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
              }}
            >
              <Image
                src={src}
                alt=""
                width={size.width}
                height={size.height}
                className="w-24 h-auto"
              />
            </div>
          );
        })}
      </div>

      {/* Desktop arc */}
      <div className="hidden md:block absolute inset-0 pointer-events-none">
        {desktopImageSrcs.map((src, i) => {
          const angle = wrapAngle(
            desktopBaseAngles[i] + angleOffset,
            START_ANGLE_DEG,
            END_ANGLE_DEG,
          );
          const pos = getCirclePosition(
            angle,
            CIRCLE_CENTER_X_VW,
            CIRCLE_CENTER_Y_VW,
            CIRCLE_RADIUS_VW,
            ROTATION_SCALE,
          );
          const size = IMAGE_SIZES[src] ?? DEFAULT_SIZE;
          return (
            <div
              key={src}
              className="absolute"
              style={{
                left: `${pos.x}vw`,
                top: `${pos.y}vw`,
                transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
              }}
            >
              <Image
                src={src}
                alt=""
                width={size.width}
                height={size.height}
                className="md:w-28 lg:w-32 h-auto"
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
