"use client";

import { useEffect, useRef } from "react";

/**
 * 3D rotating sphere with scan line effect
 */
export function ParticleCanvas({ size = 120 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = size;
    const H = size;
    const cx = W / 2;
    const cy = H / 2;
    const radius = W * 0.38;

    let time = 0;
    let lastTime = 0;
    let animationId: number;

    // Generate sphere dots using fibonacci sphere distribution
    const dots: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 200; i++) {
      const theta = Math.acos(1 - 2 * (i / 200));
      const phi = Math.sqrt(200 * Math.PI) * theta;
      dots.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
      });
    }

    const animate = (ts: number) => {
      if (!lastTime) lastTime = ts;
      time += (ts - lastTime) * 0.00025;
      lastTime = ts;

      ctx.clearRect(0, 0, W, H);

      const rotY = time * 0.5;
      const scanLine = Math.sin(time * 2.5) * radius;

      for (const d of dots) {
        // Rotate around Y axis
        const x = d.x * Math.cos(rotY) - d.z * Math.sin(rotY);
        const z = d.x * Math.sin(rotY) + d.z * Math.cos(rotY);
        const y = d.y;

        // Calculate depth scale and scan line influence
        const scale = (z + radius * 1.5) / (radius * 2.5);
        const distScan = Math.abs(y - scanLine);
        const scanInf =
          distScan < 25 ? Math.cos((distScan / 25) * (Math.PI / 2)) : 0;

        const dotSize = Math.max(0, scale * 1.5 + scanInf * 2);
        const opacity = Math.max(0, scale * 0.6 + scanInf * 0.4);

        ctx.beginPath();
        ctx.arc(cx + x, cy + y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [size]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} />
    </div>
  );
}

/**
 * Full loading animation with particles and glitch text
 */
export function LoadingAnimation() {
  return (
    <div className="relative w-full h-full min-h-[200px] bg-[#0a0a0a] overflow-hidden">
      <nav className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="font-mono text-[#00ffff] text-sm">&lt;dev/&gt;</div>
      </nav>

      <section className="flex items-center justify-center h-full">
        <ParticleCanvas />
        <h1
          className="relative z-10 text-4xl md:text-6xl font-bold text-white animate-glitch"
          data-text="Hello World"
        >
          Hello World
        </h1>
      </section>

      <style jsx>{`
        .animate-glitch {
          animation: glitch 2s infinite;
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
      `}</style>
    </div>
  );
}
