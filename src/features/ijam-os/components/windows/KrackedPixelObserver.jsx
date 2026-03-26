import React, { useEffect, useMemo, useRef } from 'react';

const TILE = 16;
const COLS = 20;
const ROWS = 12;
const SCALE = 3;

const ZONE_THEME = {
  Boot: [
    { id: 'command', x0: 0, x1: 6, color: '#14324a' },
    { id: 'build', x0: 7, x1: 13, color: '#1f2436' },
    { id: 'launch', x0: 14, x1: 19, color: '#243619' }
  ],
  Stabilize: [
    { id: 'command', x0: 0, x1: 6, color: '#173227' },
    { id: 'shield', x0: 7, x1: 13, color: '#311c24' },
    { id: 'build', x0: 14, x1: 19, color: '#20334b' }
  ],
  Scale: [
    { id: 'intel', x0: 0, x1: 6, color: '#3a3215' },
    { id: 'build', x0: 7, x1: 13, color: '#1b2f45' },
    { id: 'launch', x0: 14, x1: 19, color: '#19361d' }
  ],
  Launch: [
    { id: 'command', x0: 0, x1: 5, color: '#26213c' },
    { id: 'launch', x0: 6, x1: 13, color: '#3d2617' },
    { id: 'shield', x0: 14, x1: 19, color: '#2c1b22' }
  ],
  Maintain: [
    { id: 'command', x0: 0, x1: 6, color: '#203439' },
    { id: 'build', x0: 7, x1: 13, color: '#1b2b42' },
    { id: 'shield', x0: 14, x1: 19, color: '#2c2323' }
  ]
};

const ROLE_COLORS = {
  master: '#22c55e',
  analyst: '#f5d000',
  engineer: '#93c5fd',
  security: '#ef4444',
  devops: '#fb923c'
};

const AGENT_BLUEPRINT = [
  { id: 'master', name: 'Moon', role: 'master' },
  { id: 'analyst', name: 'Ara', role: 'analyst' },
  { id: 'engineer', name: 'Ezra', role: 'engineer' },
  { id: 'security', name: 'Sari', role: 'security' },
  { id: 'devops', name: 'Dian', role: 'devops' }
];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function zonesForChapter(chapterLabel) {
  return ZONE_THEME[chapterLabel] || ZONE_THEME.Boot;
}

function laneZone(lane, chapterLabel) {
  return zonesForChapter(chapterLabel).find((zone) => zone.id === lane) || zonesForChapter(chapterLabel)[1] || zonesForChapter(chapterLabel)[0];
}

function zoneRange(zone) {
  return { minX: zone.x0 + 0.7, maxX: zone.x1 + 0.3, minY: 1.5, maxY: ROWS - 1.5 };
}

function pickTarget(zone) {
  const r = zoneRange(zone);
  return { tx: rand(r.minX, r.maxX), ty: rand(r.minY, r.maxY) };
}

function createAgents(chapterLabel) {
  return AGENT_BLUEPRINT.map((agent, index) => {
    const zone = zonesForChapter(chapterLabel)[index % zonesForChapter(chapterLabel).length];
    const range = zoneRange(zone);
    const x = rand(range.minX, range.maxX);
    const y = rand(range.minY, range.maxY);
    const target = pickTarget(zone);
    return { ...agent, lane: zone.id, x, y, tx: target.tx, ty: target.ty, speed: rand(0.005, 0.01) };
  });
}

export default function KrackedPixelObserver({
  focusedWindowLabel,
  latestEvent = null,
  missionLabel = '',
  agentDesk = [],
  upgrades = [],
  missionProgressPct = 0,
  activeIncident = null,
  chapterLabel = 'Boot'
}) {
  const canvasRef = useRef(null);
  const agentsRef = useRef(createAgents(chapterLabel));
  const frameRef = useRef(null);
  const lastTsRef = useRef(0);
  const pulseRef = useRef(0);
  const bubbleRef = useRef('');
  const bubbleUntilRef = useRef(0);

  const missionBubble = useMemo(
    () => (activeIncident ? `${activeIncident.label} | contain now` : `${missionLabel} | ${missionProgressPct}%`),
    [activeIncident, missionLabel, missionProgressPct]
  );

  useEffect(() => {
    agentsRef.current = agentsRef.current.map((agent) => {
      const desk = agentDesk.find((item) => item.id === agent.id);
      if (!desk) return agent;
      const zone = laneZone(desk.lane, chapterLabel);
      const next = pickTarget(zone);
      return {
        ...agent,
        lane: zone.id,
        tx: next.tx,
        ty: next.ty,
        speed: desk.burstActive ? 0.013 : desk.assigned ? 0.01 : 0.006
      };
    });
  }, [agentDesk, chapterLabel]);

  useEffect(() => {
    agentsRef.current = createAgents(chapterLabel);
  }, [chapterLabel]);

  useEffect(() => {
    if (!latestEvent) return;
    bubbleRef.current = latestEvent.message || missionBubble;
    bubbleUntilRef.current = performance.now() + 5000;
  }, [latestEvent, missionBubble]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const width = COLS * TILE * SCALE;
    const height = ROWS * TILE * SCALE;
    canvas.width = width;
    canvas.height = height;

    const drawGrid = () => {
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.scale(SCALE, SCALE);
      zonesForChapter(chapterLabel).forEach((zone) => {
        ctx.fillStyle = zone.color;
        ctx.fillRect(zone.x0 * TILE, 0, (zone.x1 - zone.x0 + 1) * TILE, ROWS * TILE);
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x * TILE, 0);
        ctx.lineTo(x * TILE, ROWS * TILE);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE);
        ctx.lineTo(COLS * TILE, y * TILE);
        ctx.stroke();
      }
      if (activeIncident) {
        ctx.fillStyle = 'rgba(239,68,68,0.3)';
        ctx.fillRect(8 * TILE, 3 * TILE, 4 * TILE, 4 * TILE);
      }
      ctx.restore();
    };

    const drawAgent = (agent, pulse) => {
      const px = agent.x * TILE * SCALE;
      const py = agent.y * TILE * SCALE;
      const body = 14 + pulse * 2;
      ctx.fillStyle = ROLE_COLORS[agent.role] || '#93c5fd';
      ctx.fillRect(px - body / 2, py - body / 2, body, body);
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - body / 2, py - body / 2, body, body);
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15,23,42,0.88)';
      const textW = ctx.measureText(agent.name).width + 10;
      ctx.fillRect(px - textW / 2, py - 22, textW, 14);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(agent.name, px, py - 11);
    };

    const drawBubble = (ts) => {
      const text = ts < bubbleUntilRef.current && bubbleRef.current ? `EVENT> ${bubbleRef.current}` : `MASTER> ${missionBubble}`;
      const x = 12;
      const y = height - 32;
      ctx.font = '12px monospace';
      const w = Math.min(width - 24, ctx.measureText(text).width + 18);
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.fillRect(x, y, w, 20);
      ctx.strokeStyle = activeIncident ? '#ef4444' : '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, 20);
      ctx.fillStyle = activeIncident ? '#fecaca' : '#86efac';
      ctx.fillText(text, x + w / 2, y + 14);
    };

    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      pulseRef.current += dt * 0.01 + (upgrades.find((upgrade) => upgrade.id === 'auto_dispatch')?.level || 0) * 0.02;
      const pulse = Math.sin(pulseRef.current + agentDesk.filter((agent) => agent.assigned).length * 0.08) > 0 ? 1 : 0;
      agentsRef.current = agentsRef.current.map((agent) => {
        const dx = agent.tx - agent.x;
        const dy = agent.ty - agent.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.15) {
          const desk = agentDesk.find((item) => item.id === agent.id);
          const next = pickTarget(laneZone(desk?.lane || agent.lane, chapterLabel));
          return { ...agent, tx: next.tx, ty: next.ty };
        }
        const step = agent.speed * dt;
        return {
          ...agent,
          x: agent.x + (dx / dist) * step,
          y: agent.y + (dy / dist) * step
        };
      });
      drawGrid();
      agentsRef.current.slice().sort((a, b) => a.y - b.y).forEach((agent) => drawAgent(agent, pulse));
      drawBubble(ts);
      if (focusedWindowLabel) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#f5d000';
        ctx.fillText(`FOCUS: ${focusedWindowLabel}`, width - 110, 16);
      }
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [activeIncident, agentDesk, chapterLabel, focusedWindowLabel, missionBubble, upgrades]);

  return (
    <div style={{ border: '2px solid #1f2937', borderRadius: '10px', overflow: 'hidden', background: '#020617' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block', imageRendering: 'pixelated' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(2,6,23,0.96)' }}>
        {agentDesk.map((agent) => (
          <div key={agent.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', borderRadius: '999px', padding: '6px 10px', background: agent.assigned ? 'rgba(15,23,42,0.92)' : 'rgba(15,23,42,0.62)', border: `1px solid ${ROLE_COLORS[agent.id] || '#94a3b8'}` }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '999px', background: ROLE_COLORS[agent.id] || '#94a3b8', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700 }}>{agent.label}</span>
            <span style={{ fontSize: '10px', color: agent.assigned ? '#86efac' : '#94a3b8' }}>{agent.assigned ? 'active' : 'standby'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
