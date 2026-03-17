import React, { useMemo } from 'react';
import { Bot, Rocket, Search, ShieldCheck, Wrench } from 'lucide-react';
import KrackedPixelObserver from './KrackedPixelObserver';

const AGENT_CARDS = [
  { id: 'master', label: 'Master Agent', icon: Bot, color: '#22c55e' },
  { id: 'analyst', label: 'Analyst', icon: Search, color: '#f5d000' },
  { id: 'engineer', label: 'Engineer', icon: Wrench, color: '#60a5fa' },
  { id: 'security', label: 'Security', icon: ShieldCheck, color: '#ef4444' },
  { id: 'devops', label: 'DevOps', icon: Rocket, color: '#fb923c' }
];

const stageLabels = [
  'Discovery',
  'Brainstorm',
  'Requirements',
  'Architecture',
  'Implementation',
  'Quality',
  'Deployment',
  'Release'
];

const panelStyle = {
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: '18px',
  boxShadow: '0 16px 40px rgba(148,163,184,0.16)'
};

export default function KrackedMissionConsole({
  currentUser,
  userRank,
  userVibes,
  completedLessonsCount,
  totalLessons,
  focusedWindowLabel,
  openWindowsCount,
  missionEvents = [],
  latestMissionEvent = null
}) {
  const completionPct = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
  const activeStageCount = Math.max(1, Math.min(stageLabels.length, Math.ceil((completionPct / 100) * stageLabels.length)));
  const activeStages = stageLabels.slice(0, activeStageCount);

  const statusText = useMemo(() => {
    if (completionPct >= 100) return 'Mission complete. Ready for release cycle.';
    if (completionPct >= 70) return 'Execution stable. Prepare quality and deployment.';
    if (completionPct >= 40) return 'Core build in progress. Keep shipping.';
    return 'Bootstrapping mission track. Start with discovery.';
  }, [completionPct]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(280px, 1fr)', gap: '12px', height: '100%', minHeight: 0 }}>
      <div style={{ ...panelStyle, padding: '16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>MISSION BRIEF</div>
        <div style={{ fontSize: '20px', color: '#0f172a', fontWeight: 700 }}>{currentUser?.name || 'Local Builder'}</div>
        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{userRank} · {userVibes} vibes</div>

        <div style={{ marginTop: '12px', background: 'rgba(248,250,252,0.94)', border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
            <span>Progress</span>
            <span>{completionPct}%</span>
          </div>
          <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>{completedLessonsCount}/{totalLessons} learning modules complete</div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>ACTIVE TRACK</div>
        <div className="os-thin-scroll" style={{ marginTop: '8px', display: 'grid', gap: '6px', overflowY: 'auto', paddingRight: '4px' }}>
          {activeStages.map((stage) => (
            <div key={stage} style={{ background: 'rgba(248,250,252,0.94)', border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', padding: '10px 12px', color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
              {stage}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto auto', gap: '12px', minHeight: 0 }}>
        <div style={{ ...panelStyle, padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '5px', letterSpacing: '0.08em' }}>SYSTEM TELEMETRY</div>
          <div style={{ fontSize: '12px', color: '#475569' }}>Focused window: <span style={{ color: '#0f172a', fontWeight: 700 }}>{focusedWindowLabel || 'Desktop'}</span></div>
          <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>Open windows: <span style={{ color: '#047857', fontWeight: 700 }}>{openWindowsCount}</span></div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '7px' }}>{statusText}</div>
        </div>

        <KrackedPixelObserver
          focusedWindowLabel={focusedWindowLabel}
          completionPct={completionPct}
          latestEvent={latestMissionEvent}
        />

        <div className="os-thin-scroll" style={{ ...panelStyle, padding: '14px', minHeight: 0, overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '8px', letterSpacing: '0.08em' }}>AGENT ROSTER</div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {AGENT_CARDS.map((agent) => {
              const Icon = agent.icon;
              return (
                <div key={agent.id} style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(248,250,252,0.94)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={14} color={agent.color} />
                    <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>{agent.label}</span>
                  </div>
                  <span style={{ color: '#047857', fontSize: '11px', fontWeight: 700 }}>ONLINE</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...panelStyle, padding: '12px', minHeight: 0 }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '7px', letterSpacing: '0.08em' }}>LIVE EVENTS</div>
          <div className="os-thin-scroll" style={{ display: 'grid', gap: '6px', maxHeight: '94px', overflowY: 'auto', paddingRight: '2px' }}>
            {missionEvents.slice(0, 5).map((evt) => (
              <div key={evt.id} style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '12px', background: 'rgba(248,250,252,0.94)', padding: '8px 10px' }}>
                <div style={{ fontSize: '10px', color: '#047857', fontWeight: 700, marginBottom: '2px' }}>{evt.type.toUpperCase()}</div>
                <div style={{ fontSize: '11px', color: '#0f172a' }}>{evt.message}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...panelStyle, padding: '12px 14px', fontSize: '11px', color: '#475569' }}>
          KRACKED_OS Mission Console: keep one active objective, ship in small verified increments.
        </div>
      </div>
    </div>
  );
}
