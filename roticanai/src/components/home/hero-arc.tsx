"use client";

import { motion } from "motion/react";
import Image from "next/image";

// Mobile: 3 images — center visible, left/right peeking from edges
const mobileImages = [
  {
    src: "/hero-arc/left-3.png",
    className: "absolute -left-[8%] top-[8%] -rotate-[18deg]",
    imgClass: "w-[28vw] h-auto",
    width: 138,
    height: 138,
  },
  {
    src: "/hero-arc/center.png",
    className: "absolute left-1/2 -translate-x-1/2 top-[0%]",
    imgClass: "w-[52vw] h-auto",
    width: 171,
    height: 73,
  },
  {
    src: "/hero-arc/right-0.png",
    className: "absolute -right-[8%] top-[8%] rotate-[18deg]",
    imgClass: "w-[28vw] h-auto",
    width: 138,
    height: 138,
  },
] as const;

// Desktop: 9 images placed on a real circle.
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

// Circle config — all in vw so the circle is truly round in pixels
const CIRCLE_RADIUS_VW = 42;
const CIRCLE_CENTER_X_VW = 50;
const CIRCLE_CENTER_Y_VW = 62;
// Arc from 190° to 350° (270° = top center)
const START_ANGLE_DEG = 190;
const END_ANGLE_DEG = 350;
// Dampen rotation so edge images don't go fully sideways
const ROTATION_SCALE = 0.45;

function getCirclePositions(count: number) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const angleDeg = START_ANGLE_DEG + t * (END_ANGLE_DEG - START_ANGLE_DEG);
    const angleRad = (angleDeg * Math.PI) / 180;

    const x = CIRCLE_CENTER_X_VW + CIRCLE_RADIUS_VW * Math.cos(angleRad);
    const y = CIRCLE_CENTER_Y_VW + CIRCLE_RADIUS_VW * Math.sin(angleRad);
    const rotation = (angleDeg - 270) * ROTATION_SCALE;

    positions.push({ x, y, rotation });
  }
  return positions;
}

const desktopPositions = getCirclePositions(desktopImageSrcs.length);

const rise = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
} as const;

export function HeroArc() {
  return (
    <>
      {/* Mobile arc — 3 images, edges peek from sides */}
      <div className="relative h-[38vw] w-full overflow-hidden md:hidden">
        {mobileImages.map((img) => (
          <motion.div key={img.src} className={img.className} {...rise}>
            <Image
              src={img.src}
              alt=""
              width={img.width}
              height={img.height}
              className={img.imgClass}
            />
          </motion.div>
        ))}
      </div>

      {/* Desktop arc - images placed on a real circle */}
      <div className="hidden md:block">
        {desktopImageSrcs.map((src, i) => {
          const pos = desktopPositions[i];
          return (
            <div
              key={src}
              className="fixed z-0"
              style={{
                left: `${pos.x}vw`,
                top: `${pos.y}vw`,
                transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
              }}
            >
              <motion.div {...rise}>
                <Image
                  src={src}
                  alt=""
                  width={138}
                  height={138}
                  className="md:w-28 lg:w-32 h-auto"
                />
              </motion.div>
            </div>
          );
        })}
      </div>
    </>
  );
}
