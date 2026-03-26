import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'ijamos_mission_control_v2';
const BASE_OFFLINE_CAP_MS = 1000 * 60 * 60 * 8;
const TICK_MS = 1000;
const COMBO_WINDOW_MS = 18000;
const SPECIALIZATION_RANK = 3;

export const MISSION_AGENTS = [
  { id: 'master', label: 'Master Agent', defaultLane: 'command', specs: ['coordination', 'economy'] },
  { id: 'analyst', label: 'Analyst', defaultLane: 'intel', specs: ['insight_burst', 'efficiency_scanner'] },
  { id: 'engineer', label: 'Engineer', defaultLane: 'build', specs: ['throughput', 'quality_stability'] },
  { id: 'security', label: 'Security', defaultLane: 'shield', specs: ['shield', 'incident_hunter'] },
  { id: 'devops', label: 'DevOps', defaultLane: 'launch', specs: ['speed_launch', 'uptime_keeper'] }
];

const LANES = ['command', 'intel', 'build', 'shield', 'launch'];
const STANCES = ['balanced', 'push', 'recover'];
const CHAPTERS = ['Boot', 'Stabilize', 'Scale', 'Launch', 'Maintain'];

const MISSIONS = [
  { id: 'boot-recon', chapter: 'Boot', type: 'Recon', title: 'Signal Recon', objective: 'Scan the workspace and establish the first operating rhythm.', requiredProgress: 110, rewardOps: 34, rewardBlueprints: 0, favoredRoles: ['analyst', 'master'], modifiers: { fragment: 0.1, burst: 0.15 }, unlock: 'Boot lane online' },
  { id: 'boot-build', chapter: 'Boot', type: 'Build', title: 'Workspace Assembly', objective: 'Stitch tools together and form a stable builder loop.', requiredProgress: 135, rewardOps: 40, rewardBlueprints: 0, favoredRoles: ['engineer', 'master'], modifiers: { passive: 0.18 }, unlock: 'Build lane reinforced' },
  { id: 'boot-secure', chapter: 'Boot', type: 'Secure', title: 'Cold Boot Hardening', objective: 'Reduce early drift and lock in a safer operating posture.', requiredProgress: 150, rewardOps: 46, rewardBlueprints: 1, favoredRoles: ['security', 'analyst'], modifiers: { incident: 0.25 }, unlock: 'Chapter clear: Boot' },
  { id: 'stabilize-recovery', chapter: 'Stabilize', type: 'Recovery', title: 'Recovery Sweep', objective: 'Clear noise and rebalance the operation before scaling.', requiredProgress: 165, rewardOps: 50, rewardBlueprints: 0, favoredRoles: ['security', 'master'], modifiers: { fatigue: 0.32 }, unlock: 'Recovery lane online' },
  { id: 'stabilize-build', chapter: 'Stabilize', type: 'Build', title: 'Stable Build Grid', objective: 'Maintain engineering throughput without quality drift.', requiredProgress: 185, rewardOps: 56, rewardBlueprints: 0, favoredRoles: ['engineer', 'security'], modifiers: { passive: 0.24 }, unlock: 'Build grid upgraded' },
  { id: 'stabilize-secure', chapter: 'Stabilize', type: 'Secure', title: 'Shield Wall', objective: 'Establish incident response and hold the loop under stress.', requiredProgress: 210, rewardOps: 65, rewardBlueprints: 1, favoredRoles: ['security', 'master'], modifiers: { incident: 0.35 }, unlock: 'Chapter clear: Stabilize' },
  { id: 'scale-recon', chapter: 'Scale', type: 'Recon', title: 'Pattern Mining', objective: 'Find the best signals for scaling without wasting momentum.', requiredProgress: 220, rewardOps: 66, rewardBlueprints: 0, favoredRoles: ['analyst', 'engineer'], modifiers: { fragment: 0.2 }, unlock: 'Signal fragments improved' },
  { id: 'scale-build', chapter: 'Scale', type: 'Build', title: 'Throughput Forge', objective: 'Expand output without exhausting the active crew.', requiredProgress: 250, rewardOps: 74, rewardBlueprints: 0, favoredRoles: ['engineer', 'devops'], modifiers: { passive: 0.3 }, unlock: 'Throughput lane upgraded' },
  { id: 'scale-recovery', chapter: 'Scale', type: 'Recovery', title: 'Load Balancer', objective: 'Redistribute fatigue and keep the operation growing cleanly.', requiredProgress: 275, rewardOps: 82, rewardBlueprints: 1, favoredRoles: ['master', 'devops'], modifiers: { fatigue: 0.42 }, unlock: 'Chapter clear: Scale' },
  { id: 'launch-recon', chapter: 'Launch', type: 'Recon', title: 'Release Readiness Scan', objective: 'Validate which signals matter before the public launch.', requiredProgress: 285, rewardOps: 88, rewardBlueprints: 0, favoredRoles: ['analyst', 'devops'], modifiers: { fragment: 0.24 }, unlock: 'Launch map revealed' },
  { id: 'launch-deploy', chapter: 'Launch', type: 'Deploy', title: 'Release Window', objective: 'Convert build, proof, and deployment energy into a public push.', requiredProgress: 315, rewardOps: 96, rewardBlueprints: 0, favoredRoles: ['devops', 'engineer', 'master'], modifiers: { deploy: 0.34 }, unlock: 'Deploy loop boosted' },
  { id: 'launch-secure', chapter: 'Launch', type: 'Secure', title: 'Launch Guard', objective: 'Protect the release window from avoidable incidents.', requiredProgress: 340, rewardOps: 110, rewardBlueprints: 2, favoredRoles: ['security', 'devops'], modifiers: { incident: 0.4, deploy: 0.12 }, unlock: 'Chapter clear: Launch' },
  { id: 'maintain-recovery', chapter: 'Maintain', type: 'Recovery', title: 'Post-Launch Recovery', objective: 'Absorb post-launch strain and keep the system from degrading.', requiredProgress: 350, rewardOps: 115, rewardBlueprints: 0, favoredRoles: ['master', 'security'], modifiers: { fatigue: 0.48 }, unlock: 'Maintenance protocols active' },
  { id: 'maintain-build', chapter: 'Maintain', type: 'Build', title: 'Uptime Fabric', objective: 'Keep delivery steady while the operation matures.', requiredProgress: 380, rewardOps: 125, rewardBlueprints: 0, favoredRoles: ['engineer', 'devops'], modifiers: { passive: 0.42 }, unlock: 'Sustained throughput online' },
  { id: 'maintain-deploy', chapter: 'Maintain', type: 'Deploy', title: 'Signal Sovereignty', objective: 'Complete the campaign and establish a prestige-ready operation.', requiredProgress: 420, rewardOps: 150, rewardBlueprints: 3, favoredRoles: ['master', 'devops', 'engineer'], modifiers: { deploy: 0.45, fragment: 0.25 }, unlock: 'Campaign clear: prestige unlocked' }
];

const SESSION_UPGRADES = [
  { id: 'workflow_matrix', label: 'Workflow Matrix', description: 'Increase event-to-ops conversion.', baseCost: 22, family: 'session', category: 'economy' },
  { id: 'auto_dispatch', label: 'Auto-Dispatch', description: 'Increase passive progress from assigned agents.', baseCost: 28, family: 'session', category: 'automation' },
  { id: 'signal_compression', label: 'Signal Compression', description: 'Improve combo windows and bursts.', baseCost: 24, family: 'session', category: 'economy' },
  { id: 'incident_firewall', label: 'Incident Firewall', description: 'Reduce incident pressure and drift spikes.', baseCost: 30, family: 'session', category: 'control' },
  { id: 'release_protocol', label: 'Release Protocol', description: 'Boost deploy mission rewards and output.', baseCost: 34, family: 'session', category: 'control' }
];

const BLUEPRINT_UPGRADES = [
  { id: 'permanent_workflow', label: 'Permanent Workflow', description: 'Start each run with stronger event gains.', baseCost: 2, family: 'blueprint', category: 'economy' },
  { id: 'permanent_automation', label: 'Permanent Automation', description: 'Increase passive progress every campaign.', baseCost: 2, family: 'blueprint', category: 'automation' },
  { id: 'long_range_comms', label: 'Long Range Comms', description: 'Increase offline cap and fragment yield.', baseCost: 3, family: 'blueprint', category: 'economy' },
  { id: 'incident_doctrine', label: 'Incident Doctrine', description: 'Reduce recurring incident severity.', baseCost: 3, family: 'blueprint', category: 'control' }
];

const PERKS = [
  { id: 'perk_combo_architect', label: 'Combo Architect', description: 'Combo windows generate extra fragments.', cost: 25, family: 'perk', category: 'mastery' },
  { id: 'perk_shield_network', label: 'Shield Network', description: 'Security incidents resolve faster.', cost: 28, family: 'perk', category: 'mastery' },
  { id: 'perk_release_hunter', label: 'Release Hunter', description: 'Deploy missions pay extra ops and progress.', cost: 32, family: 'perk', category: 'control' },
  { id: 'perk_focus_surge', label: 'Focus Surge', description: 'Matching streaks amplify bursts.', cost: 22, family: 'perk', category: 'mastery' }
];

function round2(value) { return Math.round(value * 100) / 100; }
function getMissionById(id) { return MISSIONS.find((mission) => mission.id === id) || MISSIONS[0]; }
function getMissionIndex(id) { return Math.max(0, MISSIONS.findIndex((mission) => mission.id === id)); }
function appendFeedEntry(feed, entry) { return [entry, ...feed].slice(0, 24); }
function hasPerk(state, perkId) { return state.unlockedPerkIds.includes(perkId); }
function cost(def, level) { return def.family === 'session' ? Math.round(def.baseCost * Math.pow(1.6, level)) : Math.round(def.baseCost + level * 2); }
function rankFromXp(xp) { return Math.min(8, 1 + Math.floor(xp / 90)); }
function defaultLevels(defs) { return Object.fromEntries(defs.map((item) => [item.id, 0])); }
function defaultAgents() { return Object.fromEntries(MISSION_AGENTS.map((agent) => [agent.id, { xp: 0, rank: 1, fatigue: 0, lane: agent.defaultLane, assigned: ['master', 'analyst', 'engineer'].includes(agent.id), stance: 'balanced', specialization: null }])); }
function createDefaultState() { return { currentMissionId: MISSIONS[0].id, missionProgress: 0, opsEnergy: 28, blueprints: 0, signalFragments: 0, prestigeCount: 0, campaignClears: 0, prestigeReady: false, sessionUpgradeLevels: defaultLevels(SESSION_UPGRADES), blueprintUpgradeLevels: defaultLevels(BLUEPRINT_UPGRADES), unlockedPerkIds: [], completedMissionIds: [], agents: defaultAgents(), activeIncident: null, incidentPressure: 0, comboRole: null, comboCount: 0, comboExpiresAt: 0, streakRole: null, streakCount: 0, feed: [], lastComputedAt: Date.now() }; }

function loadState() {
  if (typeof window === 'undefined') return createDefaultState();
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    const defaults = createDefaultState();
    return { ...defaults, ...raw, sessionUpgradeLevels: { ...defaults.sessionUpgradeLevels, ...(raw.sessionUpgradeLevels || {}) }, blueprintUpgradeLevels: { ...defaults.blueprintUpgradeLevels, ...(raw.blueprintUpgradeLevels || {}) }, agents: Object.fromEntries(MISSION_AGENTS.map((agent) => [agent.id, { ...defaults.agents[agent.id], ...((raw.agents || {})[agent.id] || {}) }])), unlockedPerkIds: Array.isArray(raw.unlockedPerkIds) ? raw.unlockedPerkIds : [], completedMissionIds: Array.isArray(raw.completedMissionIds) ? raw.completedMissionIds : [], feed: Array.isArray(raw.feed) ? raw.feed.slice(0, 24) : [] };
  } catch {
    return createDefaultState();
  }
}
function inferRoleFromEvent(evt) {
  if (evt?.meta?.roleHint) return evt.meta.roleHint;
  const type = evt?.type || '';
  const message = `${evt?.message || ''}`.toLowerCase();
  if (type.includes('lesson') || message.includes('lesson')) return 'analyst';
  if (type.includes('terminal') || type.includes('prompt') || message.includes('prompt')) return 'engineer';
  if (message.includes('settings') || message.includes('trash')) return 'security';
  if (message.includes('deploy') || message.includes('vercel') || message.includes('github') || message.includes('supabase')) return 'devops';
  return 'master';
}

function inferEventType(evt) {
  const text = `${evt?.type || ''} ${evt?.message || ''}`.toLowerCase();
  if (text.includes('lesson')) return 'lesson';
  if (text.includes('deploy') || text.includes('vercel') || text.includes('live url')) return 'deploy';
  if (text.includes('settings') || text.includes('stats')) return 'builder';
  return 'generic';
}

function specializationBonus(agent, missionType) {
  if (!agent.specialization) return 1;
  const map = {
    coordination: 1.08,
    economy: 1.06,
    insight_burst: missionType === 'Recon' ? 1.16 : 1.04,
    efficiency_scanner: missionType === 'Recon' ? 1.1 : 1.03,
    throughput: missionType === 'Build' ? 1.16 : 1.04,
    quality_stability: missionType === 'Build' || missionType === 'Recovery' ? 1.1 : 1.03,
    shield: missionType === 'Secure' ? 1.16 : 1.04,
    incident_hunter: missionType === 'Secure' || missionType === 'Recovery' ? 1.12 : 1.03,
    speed_launch: missionType === 'Deploy' ? 1.18 : 1.04,
    uptime_keeper: missionType === 'Maintain' || missionType === 'Recovery' ? 1.1 : 1.03
  };
  return map[agent.specialization] || 1;
}

function computeProduction(state, nowTs = Date.now()) {
  const mission = getMissionById(state.currentMissionId);
  const laneSet = new Set(MISSION_AGENTS.filter((agent) => state.agents[agent.id].assigned).map((agent) => state.agents[agent.id].lane));
  const outputs = {};
  let favoredAssigned = 0;
  let baseTotal = 0;
  MISSION_AGENTS.forEach((agentMeta) => {
    const agent = state.agents[agentMeta.id];
    if (!agent.assigned) { outputs[agentMeta.id] = 0; return; }
    const favored = mission.favoredRoles.includes(agentMeta.id);
    if (favored) favoredAssigned += 1;
    const fatiguePenalty = Math.max(0.5, 1 - agent.fatigue * 0.0075);
    const stanceBonus = agent.stance === 'push' ? 1.18 : agent.stance === 'recover' ? 0.84 : 1;
    const comboBonus = state.comboRole === agentMeta.id && state.comboExpiresAt > nowTs ? 1 + Math.min(0.8, state.comboCount * 0.12) : 1;
    const rankBonus = 1 + (agent.rank - 1) * 0.08;
    const favoredBonus = favored ? 1.26 : 1;
    const passiveBonus = 1 + (state.sessionUpgradeLevels.auto_dispatch || 0) * 0.1 + (state.blueprintUpgradeLevels.permanent_automation || 0) * 0.08 + (mission.modifiers.passive || 0);
    const deployBonus = mission.type === 'Deploy' ? 1 + (state.sessionUpgradeLevels.release_protocol || 0) * 0.06 + (mission.modifiers.deploy || 0) : 1;
    const synergyBonus = laneSet.has('build') && laneSet.has('launch') && (agentMeta.id === 'engineer' || agentMeta.id === 'devops') ? 1.08 : laneSet.has('shield') && laneSet.has('command') && (agentMeta.id === 'security' || agentMeta.id === 'master') ? 1.06 : 1;
    const output = (0.48 + agent.rank * 0.26 + (state.sessionUpgradeLevels.workflow_matrix || 0) * 0.06 + (state.blueprintUpgradeLevels.permanent_workflow || 0) * 0.08) * fatiguePenalty * stanceBonus * comboBonus * rankBonus * favoredBonus * passiveBonus * deployBonus * synergyBonus * specializationBonus(agent, mission.type) * (1 + state.prestigeCount * 0.08);
    outputs[agentMeta.id] = output;
    baseTotal += output;
  });
  let driftPenalty = favoredAssigned === 0 ? 0.32 : favoredAssigned === 1 ? 0.14 : 0;
  if (mission.type === 'Deploy' && !laneSet.has('launch')) driftPenalty += 0.12;
  if (mission.type === 'Secure' && !state.agents.security.assigned) driftPenalty += 0.18;
  driftPenalty = Math.max(0, driftPenalty - (state.sessionUpgradeLevels.incident_firewall || 0) * 0.04 - (state.blueprintUpgradeLevels.incident_doctrine || 0) * 0.05);
  const incidentPenalty = state.activeIncident ? Math.max(0.68, 0.84 - (state.sessionUpgradeLevels.incident_firewall || 0) * 0.05 - (state.blueprintUpgradeLevels.incident_doctrine || 0) * 0.04) : 1;
  const coordination = favoredAssigned > 1 ? 1 + (favoredAssigned - 1) * 0.11 : 1;
  const totalOutput = baseTotal * coordination * (1 - driftPenalty) * incidentPenalty;
  return { mission, outputs, totalOutput, opsPerSec: totalOutput * (0.1 + (state.sessionUpgradeLevels.auto_dispatch || 0) * 0.03), fragmentRate: 0.02 + (mission.modifiers.fragment || 0) + (state.blueprintUpgradeLevels.long_range_comms || 0) * 0.02 + (hasPerk(state, 'perk_combo_architect') ? 0.02 : 0), driftPenalty, fatigueRelief: (mission.type === 'Recovery' ? 0.32 : 0.1) + (mission.modifiers.fatigue || 0), compression: state.sessionUpgradeLevels.signal_compression || 0 };
}

function maybeCreateIncident(nextState) {
  if (nextState.activeIncident || nextState.incidentPressure < 100) return nextState;
  return { ...nextState, incidentPressure: 25, activeIncident: { id: `incident-${Date.now()}`, label: nextState.currentMissionId.includes('deploy') ? 'Release drag' : 'Operational drift', remaining: 100 }, feed: appendFeedEntry(nextState.feed, { id: `incident-feed-${Date.now()}`, type: 'incident', label: 'Incident detected', detail: 'Output is reduced until security or recovery work clears it.', opsDelta: 0, role: 'security', ts: new Date().toISOString() }) };
}

function applyPassive(prevState, elapsedMs) {
  const nowTs = Date.now();
  if (elapsedMs <= 0) return { ...prevState, lastComputedAt: nowTs };
  const seconds = elapsedMs / 1000;
  const production = computeProduction(prevState, nowTs);
  const mission = production.mission;
  const nextAgents = Object.fromEntries(MISSION_AGENTS.map((agentMeta) => {
    const agent = prevState.agents[agentMeta.id];
    const fatigueDelta = !agent.assigned ? -production.fatigueRelief * 0.8 * seconds : (agent.stance === 'push' ? 1.7 : agent.stance === 'recover' ? 0.35 : 0.9) * seconds - production.fatigueRelief * seconds;
    return [agentMeta.id, { ...agent, fatigue: Math.max(0, agent.fatigue + fatigueDelta) }];
  }));
  let activeIncident = prevState.activeIncident;
  let feed = prevState.feed;
  if (activeIncident && prevState.agents.security.assigned) {
    const shieldBonus = hasPerk(prevState, 'perk_shield_network') ? 10 : 0;
    const nextRemaining = Math.max(0, activeIncident.remaining - ((5 + prevState.agents.security.rank * 0.6 + shieldBonus) * seconds));
    activeIncident = nextRemaining <= 0 ? null : { ...activeIncident, remaining: nextRemaining };
    if (!activeIncident) feed = appendFeedEntry(feed, { id: `incident-resolved-${Date.now()}`, type: 'incident_resolved', label: 'Incident resolved', detail: 'Security stabilized the campaign flow.', opsDelta: 0, role: 'security', ts: new Date().toISOString() });
  }
  return maybeCreateIncident({ ...prevState, agents: nextAgents, missionProgress: Math.min(mission.requiredProgress, prevState.missionProgress + production.totalOutput * seconds), opsEnergy: round2(prevState.opsEnergy + production.opsPerSec * seconds), signalFragments: round2(prevState.signalFragments + production.fragmentRate * seconds), incidentPressure: Math.max(0, prevState.incidentPressure + ((production.driftPenalty * 40) + (activeIncident ? 8 : 0) - (prevState.agents.security.assigned ? 6 : 0)) * seconds), activeIncident, feed, lastComputedAt: nowTs });
}

function buildChapterRows(completedMissionIds, currentMissionId) {
  return CHAPTERS.map((chapter) => {
    const nodes = MISSIONS.filter((mission) => mission.chapter === chapter).map((mission) => ({ ...mission, completed: completedMissionIds.includes(mission.id), active: mission.id === currentMissionId }));
    const completed = nodes.filter((node) => node.completed).length;
    return { id: chapter.toLowerCase(), label: chapter, nodes, completed, total: nodes.length, percent: Math.round((completed / Math.max(1, nodes.length)) * 100) };
  });
}
export function useMissionControlState({ missionEvents = [] }) {
  const [state, setState] = useState(loadState);
  const processedEventIdsRef = useRef(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    setState((prev) => {
      const cap = BASE_OFFLINE_CAP_MS * (1 + (prev.blueprintUpgradeLevels.long_range_comms || 0) * 0.3);
      const elapsedMs = Math.min(cap, Math.max(0, Date.now() - (prev.lastComputedAt || Date.now())));
      if (elapsedMs <= 0) return prev;
      const next = applyPassive(prev, elapsedMs);
      return { ...next, feed: appendFeedEntry(next.feed, { id: `offline-${Date.now()}`, type: 'offline_gain', label: 'Offline accumulation resolved', detail: `Recovered ${Math.round(elapsedMs / 60000)} min of campaign activity.`, opsDelta: 0, role: 'master', ts: new Date().toISOString() }) };
    });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setState((prev) => applyPassive(prev, TICK_MS)), TICK_MS);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!missionEvents.length) return;
    const unseen = missionEvents.slice().reverse().filter((evt) => {
      if (processedEventIdsRef.current.has(evt.id)) return false;
      processedEventIdsRef.current.add(evt.id);
      return true;
    });
    if (!unseen.length) return;
    setState((prev) => unseen.reduce((acc, evt) => {
      const mission = getMissionById(acc.currentMissionId);
      const role = inferRoleFromEvent(evt);
      const eventType = inferEventType(evt);
      const comboActive = acc.comboRole === role && acc.comboExpiresAt > Date.now();
      const comboCount = comboActive ? acc.comboCount + 1 : 1;
      const streakCount = acc.streakRole === role ? acc.streakCount + 1 : 1;
      const favored = mission.favoredRoles.includes(role);
      const deployBonus = mission.type === 'Deploy' && (eventType === 'deploy' || hasPerk(acc, 'perk_release_hunter')) ? 1.25 + (acc.sessionUpgradeLevels.release_protocol || 0) * 0.06 : 1;
      const energyGain = Math.max(3, Math.round((4 + (acc.sessionUpgradeLevels.workflow_matrix || 0) + (acc.blueprintUpgradeLevels.permanent_workflow || 0)) * (favored ? 1.24 : 1) * (1 + (comboCount - 1) * 0.16) * deployBonus));
      const progressGain = Math.max(3, Math.round(((favored ? 6 : 3) + (acc.sessionUpgradeLevels.workflow_matrix || 0)) * (1 + Math.min(0.5, (streakCount - 1) * 0.08)) * (eventType === 'lesson' ? 1.2 : 1) * (eventType === 'deploy' ? 1.35 : 1)));
      const fragments = round2(1 + (eventType === 'lesson' ? 1 : 0) + (eventType === 'deploy' ? 1 : 0) + comboCount * (hasPerk(acc, 'perk_combo_architect') ? 0.5 : 0) + (mission.modifiers.fragment || 0) * 2);
      const xpGain = Math.round((8 + comboCount * 2 + (favored ? 3 : 0)) * (eventType === 'lesson' ? 1.15 : 1));
      const agent = acc.agents[role];
      const nextXp = agent.xp + xpGain;
      const nextRank = rankFromXp(nextXp);
      let feed = appendFeedEntry(acc.feed, { id: `evt-${evt.id}`, type: evt.type, label: evt.message, detail: `+${energyGain} ops | +${progressGain} progress | +${fragments} fragments`, opsDelta: energyGain, role, ts: evt.ts || new Date().toISOString() });
      if (nextRank > agent.rank) feed = appendFeedEntry(feed, { id: `rank-${role}-${Date.now()}`, type: 'rank_up', label: `${MISSION_AGENTS.find((item) => item.id === role)?.label || role} ranked up`, detail: `Reached rank ${nextRank}.`, opsDelta: 0, role, ts: new Date().toISOString() });
      return { ...acc, opsEnergy: acc.opsEnergy + energyGain, signalFragments: round2(acc.signalFragments + fragments), missionProgress: Math.min(mission.requiredProgress, acc.missionProgress + progressGain), comboRole: role, comboCount, comboExpiresAt: Date.now() + COMBO_WINDOW_MS + (acc.sessionUpgradeLevels.signal_compression || 0) * 2500, streakRole: role, streakCount, incidentPressure: Math.max(0, acc.incidentPressure - (role === 'security' ? 9 : role === 'master' ? 4 : 0)), activeIncident: acc.activeIncident && role === 'security' ? { ...acc.activeIncident, remaining: Math.max(0, acc.activeIncident.remaining - 18 - nextRank * 2) } : acc.activeIncident, agents: { ...acc.agents, [role]: { ...agent, xp: nextXp, rank: nextRank, fatigue: Math.max(0, agent.fatigue - (agent.stance === 'recover' ? 4 : 1)) } }, feed, lastComputedAt: Date.now() };
    }, prev));
  }, [missionEvents]);

  const toggleAssignment = (roleId) => setState((prev) => ({ ...prev, agents: { ...prev.agents, [roleId]: { ...prev.agents[roleId], assigned: !prev.agents[roleId].assigned } }, feed: appendFeedEntry(prev.feed, { id: `assign-${roleId}-${Date.now()}`, type: 'assignment', label: `${MISSION_AGENTS.find((agent) => agent.id === roleId)?.label || roleId} assignment updated`, detail: prev.agents[roleId].assigned ? 'Moved to standby' : 'Assigned to campaign lane', opsDelta: 0, role: roleId, ts: new Date().toISOString() }) }));
  const cycleLane = (roleId) => setState((prev) => { const current = prev.agents[roleId]; return { ...prev, agents: { ...prev.agents, [roleId]: { ...current, lane: LANES[(LANES.indexOf(current.lane) + 1) % LANES.length] } } }; });
  const cycleStance = (roleId) => setState((prev) => { const current = prev.agents[roleId]; return { ...prev, agents: { ...prev.agents, [roleId]: { ...current, stance: STANCES[(STANCES.indexOf(current.stance) + 1) % STANCES.length] } } }; });
  const chooseSpecialization = (roleId) => setState((prev) => {
    const current = prev.agents[roleId];
    if (current.rank < SPECIALIZATION_RANK || current.specialization) return prev;
    const agentMeta = MISSION_AGENTS.find((agent) => agent.id === roleId);
    return { ...prev, agents: { ...prev.agents, [roleId]: { ...current, specialization: agentMeta?.specs[0] || null } }, feed: appendFeedEntry(prev.feed, { id: `spec-${roleId}-${Date.now()}`, type: 'specialization', label: `${agentMeta?.label || roleId} specialization locked in`, detail: `Selected ${agentMeta?.specs[0] || 'specialization'}.`, opsDelta: 0, role: roleId, ts: new Date().toISOString() }) };
  });
  const buyUpgrade = (upgradeId, family = 'session') => setState((prev) => {
    if (family === 'session') {
      const def = SESSION_UPGRADES.find((item) => item.id === upgradeId);
      if (!def) return prev;
      const upgradeCost = cost(def, prev.sessionUpgradeLevels[upgradeId] || 0);
      if (prev.opsEnergy < upgradeCost) return prev;
      return { ...prev, opsEnergy: round2(prev.opsEnergy - upgradeCost), sessionUpgradeLevels: { ...prev.sessionUpgradeLevels, [upgradeId]: (prev.sessionUpgradeLevels[upgradeId] || 0) + 1 }, feed: appendFeedEntry(prev.feed, { id: `session-upgrade-${upgradeId}-${Date.now()}`, type: 'upgrade', label: `${def.label} upgraded`, detail: `Spent ${upgradeCost} ops on a session upgrade.`, opsDelta: -upgradeCost, role: 'master', ts: new Date().toISOString() }) };
    }
    if (family === 'blueprint') {
      const def = BLUEPRINT_UPGRADES.find((item) => item.id === upgradeId);
      if (!def) return prev;
      const upgradeCost = cost(def, prev.blueprintUpgradeLevels[upgradeId] || 0);
      if (prev.blueprints < upgradeCost) return prev;
      return { ...prev, blueprints: prev.blueprints - upgradeCost, blueprintUpgradeLevels: { ...prev.blueprintUpgradeLevels, [upgradeId]: (prev.blueprintUpgradeLevels[upgradeId] || 0) + 1 } };
    }
    const perk = PERKS.find((item) => item.id === upgradeId);
    if (!perk || prev.unlockedPerkIds.includes(upgradeId) || prev.signalFragments < perk.cost) return prev;
    return { ...prev, signalFragments: round2(prev.signalFragments - perk.cost), unlockedPerkIds: [...prev.unlockedPerkIds, upgradeId], feed: appendFeedEntry(prev.feed, { id: `perk-${upgradeId}-${Date.now()}`, type: 'perk', label: `${perk.label} unlocked`, detail: `Spent ${perk.cost} fragments on a permanent perk.`, opsDelta: 0, role: 'master', ts: new Date().toISOString() }) };
  });

  const claimMissionReward = () => setState((prev) => {
    const mission = getMissionById(prev.currentMissionId);
    if (prev.completedMissionIds.includes(mission.id) || prev.missionProgress < mission.requiredProgress) return prev;
    const currentIndex = getMissionIndex(mission.id);
    const nextMission = MISSIONS[currentIndex + 1] || null;
    const completedMissionIds = [...prev.completedMissionIds, mission.id];
    const chapterMissionIds = MISSIONS.filter((item) => item.chapter === mission.chapter).map((item) => item.id);
    const chapterClear = chapterMissionIds.every((id) => completedMissionIds.includes(id));
    const allCleared = completedMissionIds.length >= MISSIONS.length;
    let feed = appendFeedEntry(prev.feed, { id: `claim-${mission.id}-${Date.now()}`, type: 'mission_claim', label: `${mission.title} completed`, detail: `Claimed ${mission.rewardOps} ops and ${mission.rewardBlueprints} blueprints. ${mission.unlock}`, opsDelta: mission.rewardOps, role: 'master', ts: new Date().toISOString() });
    if (chapterClear) feed = appendFeedEntry(feed, { id: `chapter-${mission.chapter}-${Date.now()}`, type: 'chapter_clear', label: `${mission.chapter} chapter cleared`, detail: 'Campaign chapter rewards collected.', opsDelta: 0, role: 'master', ts: new Date().toISOString() });
    return { ...prev, currentMissionId: nextMission?.id || mission.id, missionProgress: nextMission ? 0 : mission.requiredProgress, opsEnergy: prev.opsEnergy + mission.rewardOps, blueprints: prev.blueprints + mission.rewardBlueprints + (chapterClear ? 1 : 0), completedMissionIds, prestigeReady: allCleared || prev.prestigeReady, feed, lastComputedAt: Date.now() };
  });

  const prestigeCampaign = () => setState((prev) => {
    if (!prev.prestigeReady) return prev;
    const base = createDefaultState();
    return { ...base, blueprints: prev.blueprints, signalFragments: prev.signalFragments, prestigeCount: prev.prestigeCount + 1, campaignClears: prev.campaignClears + 1, blueprintUpgradeLevels: prev.blueprintUpgradeLevels, unlockedPerkIds: prev.unlockedPerkIds, agents: Object.fromEntries(MISSION_AGENTS.map((agent) => [agent.id, { ...base.agents[agent.id], xp: prev.agents[agent.id].xp, rank: prev.agents[agent.id].rank, specialization: prev.agents[agent.id].specialization }])), feed: appendFeedEntry([], { id: `prestige-${Date.now()}`, type: 'prestige', label: 'Campaign prestige activated', detail: 'Session systems reset while permanent progress remains.', opsDelta: 0, role: 'master', ts: new Date().toISOString() }), lastComputedAt: Date.now() };
  });

  const mission = useMemo(() => getMissionById(state.currentMissionId), [state.currentMissionId]);
  const nextMission = useMemo(() => MISSIONS[getMissionIndex(state.currentMissionId) + 1] || null, [state.currentMissionId]);
  const production = useMemo(() => computeProduction(state), [state]);
  const missionProgressPct = Math.round((state.missionProgress / mission.requiredProgress) * 100);
  const missionClaimReady = state.missionProgress >= mission.requiredProgress && !state.completedMissionIds.includes(mission.id);
  const etaSeconds = missionClaimReady || production.totalOutput <= 0 ? null : Math.max(0, Math.ceil((mission.requiredProgress - state.missionProgress) / production.totalOutput));
  const chapters = useMemo(() => buildChapterRows(state.completedMissionIds, state.currentMissionId), [state.completedMissionIds, state.currentMissionId]);

  const agentDesk = useMemo(() => MISSION_AGENTS.map((agentMeta) => {
    const agent = state.agents[agentMeta.id];
    return { ...agentMeta, ...agent, favored: mission.favoredRoles.includes(agentMeta.id), burstActive: state.comboRole === agentMeta.id && state.comboExpiresAt > Date.now(), outputPerSec: agent.assigned ? production.outputs[agentMeta.id] || 0 : 0, specializationChoices: agentMeta.specs, specializationReady: agent.rank >= SPECIALIZATION_RANK && !agent.specialization };
  }), [mission.favoredRoles, production.outputs, state.agents, state.comboExpiresAt, state.comboRole]);

  const upgrades = useMemo(() => ({
    session: SESSION_UPGRADES.map((upgrade) => ({ ...upgrade, level: state.sessionUpgradeLevels[upgrade.id] || 0, cost: cost(upgrade, state.sessionUpgradeLevels[upgrade.id] || 0), canBuy: state.opsEnergy >= cost(upgrade, state.sessionUpgradeLevels[upgrade.id] || 0) })),
    blueprint: BLUEPRINT_UPGRADES.map((upgrade) => ({ ...upgrade, level: state.blueprintUpgradeLevels[upgrade.id] || 0, cost: cost(upgrade, state.blueprintUpgradeLevels[upgrade.id] || 0), canBuy: state.blueprints >= cost(upgrade, state.blueprintUpgradeLevels[upgrade.id] || 0) })),
    perks: PERKS.map((perk) => ({ ...perk, unlocked: state.unlockedPerkIds.includes(perk.id), canBuy: !state.unlockedPerkIds.includes(perk.id) && state.signalFragments >= perk.cost }))
  }), [state.blueprintUpgradeLevels, state.blueprints, state.opsEnergy, state.sessionUpgradeLevels, state.signalFragments, state.unlockedPerkIds]);

  const economy = useMemo(() => ({ opsEnergy: Math.round(state.opsEnergy), blueprints: Math.floor(state.blueprints), signalFragments: Math.floor(state.signalFragments), passivePerSec: Number(production.totalOutput.toFixed(1)), passiveOpsPerSec: Number(production.opsPerSec.toFixed(2)), driftPenaltyPct: Math.round(production.driftPenalty * 100), comboCount: state.comboExpiresAt > Date.now() ? state.comboCount : 0, streakRole: state.streakRole, streakCount: state.streakCount }), [production.driftPenalty, production.opsPerSec, production.totalOutput, state.blueprints, state.comboCount, state.comboExpiresAt, state.opsEnergy, state.signalFragments, state.streakCount, state.streakRole]);

  const recommendedAction = useMemo(() => {
    if (state.prestigeReady) return 'Prestige is unlocked. Reset the campaign when you want a stronger permanent loop.';
    if (missionClaimReady) return 'Claim the mission reward and advance the campaign map.';
    const specReady = agentDesk.find((agent) => agent.specializationReady);
    if (specReady) return `Lock in ${specReady.label}'s specialization to strengthen their mission role.`;
    const buyablePerk = upgrades.perks.find((perk) => perk.canBuy);
    if (buyablePerk) return `Spend fragments on ${buyablePerk.label} for a permanent idle modifier.`;
    const inactiveFavored = agentDesk.find((agent) => agent.favored && !agent.assigned);
    if (inactiveFavored) return `Assign ${inactiveFavored.label} to capitalize on this mission's favored roles.`;
    return 'Keep working across KRACKED_OS. Real actions drive combos, fragments, and rank gains.';
  }, [agentDesk, missionClaimReady, state.prestigeReady, upgrades.perks]);

  return {
    missionState: { mission, upcomingMission: nextMission, missionProgress: state.missionProgress, missionProgressPct, missionClaimReady, etaSeconds, campaignPercent: Math.round((state.completedMissionIds.length / MISSIONS.length) * 100), chapterRows: chapters, currentChapter: chapters.find((chapter) => chapter.label === mission.chapter) || chapters[0], completedMissionIds: state.completedMissionIds, prestigeReady: state.prestigeReady, prestigeCount: state.prestigeCount, campaignClears: state.campaignClears, economy, agentDesk, upgrades, feed: state.feed, recommendedAction, totalAssignedOutput: production.totalOutput, activeIncident: state.activeIncident, comboRole: state.comboRole, comboExpiresAt: state.comboExpiresAt },
    missionActions: { toggleAssignment, cycleLane, cycleStance, chooseSpecialization, buyUpgrade, claimMissionReward, prestigeCampaign }
  };
}
