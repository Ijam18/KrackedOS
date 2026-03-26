import React, { useMemo, useState } from 'react';
import { Bot, CheckCircle2, Coins, Crown, Gauge, Pickaxe, Rocket, Search, ShieldCheck, Sparkles, TimerReset, Wrench, Zap } from 'lucide-react';
import KrackedPixelObserver from './KrackedPixelObserver';

const ROLE_META = {
  master: { icon: Bot, color: '#22c55e' },
  analyst: { icon: Search, color: '#f5d000' },
  engineer: { icon: Wrench, color: '#60a5fa' },
  security: { icon: ShieldCheck, color: '#ef4444' },
  devops: { icon: Rocket, color: '#fb923c' }
};

const panelStyle = {
  background: 'rgba(255,255,255,0.84)',
  border: '1px solid rgba(148,163,184,0.22)',
  borderRadius: '20px',
  boxShadow: '0 16px 40px rgba(148,163,184,0.14)'
};

function formatEta(seconds) {
  if (seconds == null) return 'Auto-progressing';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function formatFamily(label) {
  return label.replaceAll('_', ' ');
}

export default function KrackedMissionConsole({
  currentUser,
  focusedWindowLabel,
  openWindowsCount,
  missionEvents = [],
  latestMissionEvent = null,
  missionState,
  onToggleAssignment,
  onBuyUpgrade,
  onClaimMissionReward,
  onCycleLane,
  onCycleStance,
  onChooseSpecialization,
  onPrestigeCampaign
}) {
  const [upgradeTab, setUpgradeTab] = useState('session');
  const {
    mission,
    upcomingMission,
    missionProgress,
    missionProgressPct,
    missionClaimReady,
    etaSeconds,
    campaignPercent,
    chapterRows = [],
    currentChapter,
    completedMissionIds = [],
    prestigeReady,
    prestigeCount,
    campaignClears,
    economy,
    agentDesk = [],
    upgrades,
    feed = [],
    recommendedAction,
    activeIncident
  } = missionState || {};

  const visibleUpgrades = useMemo(() => upgrades?.[upgradeTab] || [], [upgradeTab, upgrades]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.08fr) minmax(340px, 0.92fr)', gap: '12px', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) minmax(0,1fr)', gap: '12px', minHeight: 0 }}>
        <div style={{ ...panelStyle, padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>CAMPAIGN</div>
              <div style={{ fontSize: '26px', color: '#0f172a', fontWeight: 800, lineHeight: 1.05 }}>{mission?.title || 'Mission offline'}</div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px', maxWidth: '560px', lineHeight: 1.6 }}>{mission?.objective}</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: '16px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.16)', minWidth: '170px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>CAMPAIGN STATUS</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{campaignPercent || 0}%</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>{completedMissionIds.length}/{chapterRows.reduce((sum, chapter) => sum + chapter.total, 0)} nodes cleared</div>
            </div>
          </div>

          <div style={{ marginTop: '16px', background: 'rgba(248,250,252,0.94)', border: '1px solid rgba(226,232,240,0.92)', borderRadius: '16px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', color: '#475569', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span>{Math.round(missionProgress || 0)}/{mission?.requiredProgress || 0} progress</span>
              <span>{missionProgressPct || 0}%</span>
            </div>
            <div style={{ height: '12px', background: '#dbe5f1', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${missionProgressPct || 0}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginTop: '12px' }}>
              <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ETA</div><div style={{ marginTop: '4px', fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>{formatEta(etaSeconds)}</div></div>
              <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Reward</div><div style={{ marginTop: '4px', fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>+{mission?.rewardOps || 0} ops</div></div>
              <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Blueprints</div><div style={{ marginTop: '4px', fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>+{mission?.rewardBlueprints || 0}</div></div>
              <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Type</div><div style={{ marginTop: '4px', fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>{mission?.type || 'Unknown'}</div></div>
            </div>
          </div>

          <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.55 }}>{recommendedAction}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={onClaimMissionReward} disabled={!missionClaimReady} style={{ border: '1px solid rgba(34,197,94,0.22)', background: missionClaimReady ? 'rgba(16,185,129,0.12)' : 'rgba(226,232,240,0.65)', color: missionClaimReady ? '#047857' : '#94a3b8', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: 700, cursor: missionClaimReady ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} />{missionClaimReady ? 'Claim mission' : 'Mission running'}</button>
                <button type="button" onClick={onPrestigeCampaign} disabled={!prestigeReady} style={{ border: '1px solid rgba(168,85,247,0.24)', background: prestigeReady ? 'rgba(168,85,247,0.12)' : 'rgba(226,232,240,0.65)', color: prestigeReady ? '#7c3aed' : '#94a3b8', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', fontWeight: 700, cursor: prestigeReady ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Crown size={14} />{prestigeReady ? 'Prestige campaign' : 'Prestige locked'}</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px' }}>
              <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Current chapter</div><div style={{ marginTop: '4px', fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{currentChapter?.label || mission?.chapter}</div></div>
              <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Upcoming</div><div style={{ marginTop: '4px', fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{upcomingMission?.title || 'Campaign end'}</div></div>
              <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: activeIncident ? 'rgba(254,242,242,0.94)' : 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Incident</div><div style={{ marginTop: '4px', fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{activeIncident ? activeIncident.label : 'Stable'}</div></div>
            </div>
          </div>
        </div>

        <div style={{ ...panelStyle, padding: '14px', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>AGENTS</div><div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>Rotate lanes and stances to manage fatigue, synergy, and mission fit.</div></div>
            <div style={{ fontSize: '12px', color: '#475569' }}>Prestige <span style={{ color: '#0f172a', fontWeight: 700 }}>{prestigeCount}</span> � Clears <span style={{ color: '#0f172a', fontWeight: 700 }}>{campaignClears}</span></div>
          </div>
          <div className="os-thin-scroll" style={{ display: 'grid', gap: '8px', overflowY: 'auto', maxHeight: '100%', paddingRight: '4px' }}>
            {agentDesk.map((agent) => {
              const meta = ROLE_META[agent.id] || ROLE_META.devops;
              const Icon = meta.icon;
              return (
                <div key={agent.id} style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '16px', padding: '12px 14px', display: 'grid', gap: '10px', background: agent.assigned ? 'rgba(239,246,255,0.94)' : 'rgba(248,250,252,0.94)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '12px', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(226,232,240,0.92)' }}><Icon size={16} color={meta.color} /></div>
                      <div>
                        <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700 }}>{agent.label}</div>
                        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>Rank {agent.rank} � {agent.outputPerSec.toFixed(1)}/sec {agent.favored ? '� Favored' : ''}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '7px 10px', borderRadius: '999px', background: agent.burstActive ? 'rgba(250,204,21,0.14)' : agent.assigned ? 'rgba(37,99,235,0.1)' : 'rgba(226,232,240,0.9)', color: agent.burstActive ? '#a16207' : agent.assigned ? '#1d4ed8' : '#64748b', fontSize: '11px', fontWeight: 700 }}>{agent.burstActive ? 'Burst active' : agent.assigned ? 'Assigned' : 'Standby'}</span>
                      <span style={{ padding: '7px 10px', borderRadius: '999px', background: agent.fatigue >= 50 ? 'rgba(254,242,242,0.95)' : 'rgba(248,250,252,0.95)', color: agent.fatigue >= 50 ? '#b91c1c' : '#475569', fontSize: '11px', fontWeight: 700 }}>Fatigue {Math.round(agent.fatigue)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '8px' }}>
                    <button type="button" onClick={() => onToggleAssignment(agent.id)} style={{ border: '1px solid rgba(148,163,184,0.24)', background: '#fff', color: '#0f172a', borderRadius: '10px', padding: '8px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{agent.assigned ? 'Set standby' : 'Assign'}</button>
                    <button type="button" onClick={() => onCycleLane(agent.id)} style={{ border: '1px solid rgba(148,163,184,0.24)', background: '#fff', color: '#0f172a', borderRadius: '10px', padding: '8px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Lane: {formatFamily(agent.lane)}</button>
                    <button type="button" onClick={() => onCycleStance(agent.id)} style={{ border: '1px solid rgba(148,163,184,0.24)', background: '#fff', color: '#0f172a', borderRadius: '10px', padding: '8px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Stance: {formatFamily(agent.stance)}</button>
                    <button type="button" onClick={() => onChooseSpecialization(agent.id)} disabled={!agent.specializationReady} style={{ border: '1px solid rgba(148,163,184,0.24)', background: agent.specialization ? 'rgba(250,245,255,0.9)' : '#fff', color: !agent.specializationReady && !agent.specialization ? '#94a3b8' : '#0f172a', borderRadius: '10px', padding: '8px 10px', fontSize: '11px', fontWeight: 700, cursor: agent.specializationReady ? 'pointer' : 'default' }}>{agent.specialization ? formatFamily(agent.specialization) : agent.specializationReady ? 'Pick spec' : 'Spec @ rank 3'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <KrackedPixelObserver focusedWindowLabel={focusedWindowLabel} latestEvent={latestMissionEvent} missionLabel={mission?.title} agentDesk={agentDesk} upgrades={[...(upgrades?.session || []), ...(upgrades?.blueprint || [])]} missionProgressPct={missionProgressPct} activeIncident={activeIncident} chapterLabel={mission?.chapter} />
      </div>

      <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) minmax(0,1fr)', gap: '12px', minHeight: 0 }}>
        <div style={{ ...panelStyle, padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>ECONOMY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
            <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Ops</div><div style={{ marginTop: '4px', fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>{economy?.opsEnergy || 0}</div></div>
            <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Blueprints</div><div style={{ marginTop: '4px', fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>{economy?.blueprints || 0}</div></div>
            <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Fragments</div><div style={{ marginTop: '4px', fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>{economy?.signalFragments || 0}</div></div>
            <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Passive/sec</div><div style={{ marginTop: '4px', fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>{economy?.passivePerSec || 0}</div></div>
          </div>
          <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
            <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Combo</div><div style={{ marginTop: '4px', fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{economy?.comboCount || 0}</div></div>
            <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Streak</div><div style={{ marginTop: '4px', fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{economy?.streakCount || 0}</div></div>
            <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Drift</div><div style={{ marginTop: '4px', fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{economy?.driftPenaltyPct || 0}%</div></div>
            <div style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}><div style={{ fontSize: '11px', color: '#64748b' }}>Signals</div><div style={{ marginTop: '4px', fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{missionEvents.length}</div></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateRows: 'minmax(220px, 1fr) minmax(220px, 1fr)', gap: '12px', minHeight: 0 }}>
          <div className="os-thin-scroll" style={{ ...panelStyle, padding: '14px', minHeight: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>EVENTS</div><div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>Real workspace signals converted into long-run campaign momentum.</div></div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: 700, fontSize: '12px' }}><Zap size={14} />{focusedWindowLabel || 'Desktop'} � {openWindowsCount} windows</div>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {feed.slice(0, 10).map((entry) => (
                <div key={entry.id} style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{entry.label}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.5 }}>{entry.detail}</div>
                    </div>
                    <span style={{ color: entry.opsDelta >= 0 ? '#047857' : '#b91c1c', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>{entry.opsDelta > 0 ? `+${entry.opsDelta}` : entry.opsDelta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="os-thin-scroll" style={{ ...panelStyle, padding: '14px', minHeight: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>UPGRADES</div><div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>Layered upgrades for session power, permanent progression, and perk unlocks.</div></div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['session', 'blueprint', 'perks'].map((tab) => (
                  <button key={tab} type="button" onClick={() => setUpgradeTab(tab)} style={{ border: '1px solid rgba(148,163,184,0.24)', background: upgradeTab === tab ? 'rgba(37,99,235,0.12)' : '#fff', color: '#0f172a', borderRadius: '999px', padding: '7px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>{tab}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {visibleUpgrades.map((upgrade) => (
                <div key={upgrade.id} style={{ border: '1px solid rgba(226,232,240,0.92)', borderRadius: '14px', background: 'rgba(248,250,252,0.94)', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>{upgrade.label}</div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{upgrade.level != null ? `Lv ${upgrade.level}` : upgrade.unlocked ? 'Unlocked' : 'Locked'}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>{upgrade.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#0f172a', fontWeight: 700 }}>{upgradeTab === 'perks' ? <Pickaxe size={12} /> : upgradeTab === 'blueprint' ? <Sparkles size={12} /> : <Coins size={12} />}Cost {upgrade.cost}</div>
                    <button type="button" onClick={() => onBuyUpgrade(upgrade.id, upgradeTab === 'perks' ? 'perk' : upgradeTab)} disabled={upgrade.unlocked || !upgrade.canBuy} style={{ border: '1px solid rgba(148,163,184,0.24)', background: upgrade.unlocked ? 'rgba(220,252,231,0.8)' : upgrade.canBuy ? '#fff' : 'rgba(226,232,240,0.68)', color: upgrade.unlocked ? '#047857' : upgrade.canBuy ? '#0f172a' : '#94a3b8', borderRadius: '10px', padding: '8px 10px', fontSize: '11px', fontWeight: 700, cursor: !upgrade.unlocked && upgrade.canBuy ? 'pointer' : 'default' }}>{upgrade.unlocked ? 'Unlocked' : 'Upgrade'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
