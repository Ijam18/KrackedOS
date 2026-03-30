import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
    useReactFlow,
    Handle,
    Position,
    BaseEdge
} from '@xyflow/react';
import {
    Bot,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    Download,
    Eye,
    FileText,
    FolderOpen,
    GitBranch,
    Lightbulb,
    PanelLeft,
    Pencil,
    Plus,
    RotateCcw,
    Scan,
    Save,
    ShieldCheck,
    Sparkles,
    StickyNote,
    Package,
    Target,
    Trash2,
    Upload,
    Users,
    Wand2
} from 'lucide-react';
import '@xyflow/react/dist/style.css';

const STORAGE_KEY = 'kracked_idea_to_prompt_v1';
const LEGACY_MINDMAP_KEY = 'kracked_mindmapper_v1';
const UI_FONT = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
const IDEAS_STORAGE_VERSION = 2;

const NODE_CATALOG = {
    role: {
        label: 'Role',
        icon: Bot,
        color: '#c4b5fd',
        accent: '#7c3aed',
        category: 'core',
        description: 'Define the AI persona and embed the preferred tech stack here.'
    },
    objective: {
        label: 'Objective',
        icon: Target,
        color: '#fde68a',
        accent: '#d97706',
        category: 'core',
        description: 'State the business problem the app must solve.'
    },
    target_user: {
        label: 'Target User',
        icon: Users,
        color: '#bfdbfe',
        accent: '#2563eb',
        category: 'core',
        description: 'Describe who the product is for and what context they are in.'
    },
    feature: {
        label: 'Feature',
        icon: Sparkles,
        color: '#bbf7d0',
        accent: '#16a34a',
        category: 'core',
        description: 'List one must-have product capability per node.'
    },
    constraint: {
        label: 'Constraint',
        icon: ShieldCheck,
        color: '#fecaca',
        accent: '#dc2626',
        category: 'delivery',
        description: 'Guardrails, limitations, and non-negotiables.'
    },
    output: {
        label: 'Output',
        icon: FileText,
        color: '#fbcfe8',
        accent: '#db2777',
        category: 'delivery',
        description: 'Define how the AI should respond and what to deliver.'
    },
    reference: {
        label: 'Reference',
        icon: Lightbulb,
        color: '#bae6fd',
        accent: '#0284c7',
        category: 'signals',
        description: 'Competitor, inspiration, or benchmark product.'
    },
    unique_value: {
        label: 'Unique Value',
        icon: Wand2,
        color: '#fdba74',
        accent: '#ea580c',
        category: 'signals',
        description: 'What makes this idea meaningfully different.'
    },
    flow: {
        label: 'Flow',
        icon: GitBranch,
        color: '#ddd6fe',
        accent: '#7c3aed',
        category: 'delivery',
        description: 'Important sequence, build order, or user flow notes.'
    },
    custom: {
        label: 'Custom Note',
        icon: StickyNote,
        color: '#e2e8f0',
        accent: '#475569',
        category: 'notes',
        description: 'Any extra context that should be attached to the final prompt.'
    }
};

const REQUIRED_TYPES = ['role', 'objective', 'target_user', 'feature', 'constraint', 'output'];
const DOCK_GROUPS = [
    {
        key: 'core',
        label: 'ROFCO Core',
        helper: 'Place the main brief nodes first so the map has a working backbone.',
        types: ['role', 'objective', 'target_user', 'feature']
    },
    {
        key: 'delivery',
        label: 'Rules + Output',
        helper: 'Add constraints, output format, and sequencing that shape execution.',
        types: ['constraint', 'output', 'flow']
    },
    {
        key: 'signals',
        label: 'References',
        helper: 'Attach inspiration, benchmarks, and differentiators that sharpen the brief.',
        types: ['reference', 'unique_value']
    },
    {
        key: 'notes',
        label: 'Notes',
        helper: 'Keep miscellaneous context here when it should not override ROFCO.',
        types: ['custom']
    }
];
const REVIEW_SECTION_ORDER = ['role', 'objective', 'features', 'constraints', 'output'];
const EDGE_TYPE = 'orthogonal';
const FIT_VIEW_PADDING = 0.28;
const DEFAULT_LANE_KEY = 'saas';
const STARTER_LAYOUT = {
    backboneY: 290,
    topRailY: -70,
    bottomRailY: 540,
    backboneXs: {
        role: 40,
        objective: 380,
        featureStart: 760,
        featureGap: 360,
        constraint: 1480,
        output: 1840
    },
    topRailSlots: [380, 1020, 1380, 1740, 2100, 2460],
    bottomRailSlots: [900, 1260, 1620, 1980, 2340],
    overflowGap: 380
};

const IDEA_LANES = [
    {
        key: 'creative',
        label: 'Creative / Brand Site',
        icon: Sparkles,
        accent: '#db2777',
        summary: 'Best for storytelling, visual identity, launches, and campaigns.',
        helper: 'Use this when the site is mostly about narrative, mood, sections, and CTA flow.'
    },
    {
        key: 'saas',
        label: 'SaaS / Dashboard',
        icon: Bot,
        accent: '#2563eb',
        summary: 'Best for apps with workflows, accounts, dashboards, and repeated tasks.',
        helper: 'Use this when the product solves an operational problem and likely needs structured app screens.'
    },
    {
        key: 'tools',
        label: 'Tool / Utility',
        icon: Wand2,
        accent: '#16a34a',
        summary: 'Best for focused utilities with clear inputs, outputs, and edge cases.',
        helper: 'Use this when the product is a calculator, generator, checker, converter, or workflow helper.'
    },
    {
        key: 'marketplace',
        label: 'Marketplace / Directory',
        icon: Users,
        accent: '#ea580c',
        summary: 'Best for discovery, listings, search, profiles, and matching.',
        helper: 'Use this when people need to browse, compare, or connect around items, services, or people.'
    },
    {
        key: 'portfolio',
        label: 'Portfolio / Personal Brand',
        icon: Lightbulb,
        accent: '#7c3aed',
        summary: 'Best for personal proof, case studies, social links, and inbound trust.',
        helper: 'Use this when the goal is showcasing work, credibility, and a clear call-to-action.'
    },
    {
        key: 'community',
        label: 'Community / Membership',
        icon: Users,
        accent: '#0891b2',
        summary: 'Best for groups, resources, gated spaces, and recurring engagement.',
        helper: 'Use this when the product grows around participation, discussion, or member-only value.'
    },
    {
        key: 'ai_app',
        label: 'AI App / Agent Workflow',
        icon: Bot,
        accent: '#0f766e',
        summary: 'Best for prompt flows, agent actions, approvals, and AI-assisted tasks.',
        helper: 'Use this when model behavior, output quality, and user review loops are core to the app.'
    }
];

const PRODUCT_GOAL_OPTIONS = [
    { value: 'storytelling', label: 'Storytelling / launch' },
    { value: 'workflow', label: 'Workflow / dashboard' },
    { value: 'utility', label: 'Simple tool / utility' },
    { value: 'discovery', label: 'Discovery / listings' },
    { value: 'credibility', label: 'Portfolio / credibility' },
    { value: 'community', label: 'Community / members' },
    { value: 'ai', label: 'AI-assisted flow' }
];

const ONBOARDING_STARTER_EXAMPLES = [
    {
        key: 'creator-hub',
        label: 'Creator Hub',
        metadata: {
            projectName: 'Creator Hub',
            audience: 'independent creators selling digital offers',
            problemStatement: 'Creators struggle to present offers, capture leads, and manage lightweight customer requests in one focused flow.',
            desiredOutcome: 'help creators launch faster and convert visitors into paying clients or subscribers',
            productGoal: 'workflow',
            laneKey: 'saas',
            shipTarget: 'Web app',
            status: 'Scoping'
        }
    },
    {
        key: 'brand-launch',
        label: 'Brand Launch Site',
        metadata: {
            projectName: 'Studio Vale Launch',
            audience: 'design-conscious customers discovering a new lifestyle brand',
            problemStatement: 'The brand needs a memorable online launch that explains the story and makes people care quickly.',
            desiredOutcome: 'turn first-time visitors into interested subscribers or buyers',
            productGoal: 'storytelling',
            laneKey: 'creative',
            shipTarget: 'Web app',
            status: 'Draft'
        }
    },
    {
        key: 'lead-tool',
        label: 'Lead Qualifier Tool',
        metadata: {
            projectName: 'Lead Qualifier',
            audience: 'small agencies evaluating inbound leads',
            problemStatement: 'Teams waste time manually checking if leads are a fit before discovery calls.',
            desiredOutcome: 'score leads quickly and show a clear next action',
            productGoal: 'utility',
            laneKey: 'tools',
            shipTarget: 'Internal tool',
            status: 'Ready to build'
        }
    },
    {
        key: 'ai-research',
        label: 'AI Research Assistant',
        metadata: {
            projectName: 'Research Copilot',
            audience: 'operators and founders collecting market insights',
            problemStatement: 'People gather messy research from many sources and struggle to turn it into structured decisions.',
            desiredOutcome: 'guide users from raw research input to usable summaries and next steps',
            productGoal: 'ai',
            laneKey: 'ai_app',
            shipTarget: 'Web app',
            status: 'Scoping'
        }
    }
];

const OMNI_LAYOUT = {
    source: [
        { id: 'out-top', position: Position.Top },
        { id: 'out-right', position: Position.Right },
        { id: 'out-bottom', position: Position.Bottom },
        { id: 'out-left', position: Position.Left }
    ],
    target: [
        { id: 'in-top', position: Position.Top },
        { id: 'in-right', position: Position.Right },
        { id: 'in-bottom', position: Position.Bottom },
        { id: 'in-left', position: Position.Left }
    ]
};

const HANDLE_LAYOUTS = Object.fromEntries(
    Object.keys(NODE_CATALOG).map((type) => [type, OMNI_LAYOUT])
);

const CONNECTION_RULES = Object.fromEntries(
    Object.keys(NODE_CATALOG).map((sourceType) => [
        sourceType,
        Object.keys(NODE_CATALOG).map((targetType) => ({
                target: targetType,
                family: 'main'
            }))
    ])
);

const EDGE_FAMILY_STYLES = {
    main: { strokeWidth: 3, strokeDasharray: '10 8' },
    support: { strokeWidth: 3, strokeDasharray: '8 8' }
};

const handlePositionStyle = (position, override = {}) => {
    if (position === Position.Top) return { top: -7, ...override };
    if (position === Position.Bottom) return { bottom: -7, ...override };
    if (position === Position.Left) return { left: -7, ...override };
    return { right: -7, ...override };
};

const NODE_EDITOR_HELPERS = {
    role: 'Use this for AI persona, preferred stack, and engineering stance only.',
    objective: 'Use this for the business problem being solved, not the feature list.',
    target_user: 'Use this for who has the problem and what context they are in.',
    feature: 'Use one node per must-have capability. Do not place constraints or user info here.',
    constraint: 'Use this for limits, rules, and non-negotiables only.',
    output: 'Use this for what the AI should deliver and how it should respond.',
    reference: 'Use this only for external inspiration, competitors, or benchmarks.',
    unique_value: 'Use this only for the differentiator that makes the idea stand out.',
    flow: 'Use this only for order, sequence, or rollout notes.',
    custom: 'Use this for appendix notes that should not override ROFCO sections.'
};

const BASE_NODE_STYLE = {
    width: 220,
    borderRadius: 18,
    border: '2px solid #0f172a',
    boxShadow: '0 12px 28px rgba(15,23,42,0.18)',
    color: '#0f172a',
    padding: 14,
    fontFamily: UI_FONT
};

const handleStyle = {
    width: 10,
    height: 10,
    border: '2px solid #ffffff',
    background: '#0f172a'
};

const getConnectionRule = (sourceType, targetType) => (
    (CONNECTION_RULES[sourceType] || []).find((rule) => rule.target === targetType) || null
);

const getHandlePosition = (handleId) => {
    if (handleId?.includes('top')) return Position.Top;
    if (handleId?.includes('right')) return Position.Right;
    if (handleId?.includes('bottom')) return Position.Bottom;
    return Position.Left;
};

const pickAnchorHandles = (sourceNode, targetNode) => {
    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;

    if (Math.abs(dy) >= Math.abs(dx)) {
        if (dy >= 0) return { sourceHandle: 'out-bottom', targetHandle: 'in-top' };
        return { sourceHandle: 'out-top', targetHandle: 'in-bottom' };
    }

    if (dx >= 0) return { sourceHandle: 'out-right', targetHandle: 'in-left' };
    return { sourceHandle: 'out-left', targetHandle: 'in-right' };
};

const buildEdgePayload = (sourceNode, targetNode, params = {}) => {
    const rule = getConnectionRule(sourceNode?.type, targetNode?.type);
    if (!rule) return null;
    const anchorHandles = pickAnchorHandles(sourceNode, targetNode);
    const color = NODE_CATALOG[sourceNode.type]?.accent || '#2563eb';
    const familyStyle = EDGE_FAMILY_STYLES[rule.family] || EDGE_FAMILY_STYLES.main;
    return {
        ...params,
        id: params.id || `${sourceNode.id}-${targetNode.id}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: params.sourceHandle || anchorHandles.sourceHandle,
        targetHandle: params.targetHandle || anchorHandles.targetHandle,
        type: EDGE_TYPE,
        animated: false,
        style: {
            stroke: color,
            ...familyStyle
        },
        data: {
            family: rule.family,
            sourceType: sourceNode.type,
            targetType: targetNode.type,
            stroke: color
        }
    };
};

const isValidSemanticConnection = (connection, nodes) => {
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);
    if (!sourceNode || !targetNode || sourceNode.id === targetNode.id) return false;
    const rule = getConnectionRule(sourceNode.type, targetNode.type);
    if (!rule) return false;
    return true;
};

const normalizeStoredEdges = (edges, nodes) => {
    if (!Array.isArray(edges)) return [];
    return edges.reduce((accumulator, edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);
        const normalized = buildEdgePayload(sourceNode, targetNode, { id: edge.id });
        if (normalized) accumulator.push(normalized);
        return accumulator;
    }, []);
};

const buildOrthogonalPath = ({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, family = 'main' }) => {
    const primaryOffset = family === 'main' ? 62 : 48;
    const secondaryOffset = family === 'main' ? 46 : 34;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;

    if ((sourcePosition === Position.Bottom && targetPosition === Position.Top) || (sourcePosition === Position.Top && targetPosition === Position.Bottom)) {
        const sourceDirection = sourcePosition === Position.Bottom ? 1 : -1;
        const targetDirection = targetPosition === Position.Top ? -1 : 1;
        const exitY = sourceY + sourceDirection * primaryOffset;
        const entryY = targetY + targetDirection * primaryOffset;
        const midY = Math.abs(dy) > 160 ? (exitY + entryY) / 2 : exitY;
        return `M ${sourceX} ${sourceY} L ${sourceX} ${exitY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${entryY} L ${targetX} ${targetY}`;
    }

    if ((sourcePosition === Position.Right && targetPosition === Position.Left) || (sourcePosition === Position.Left && targetPosition === Position.Right)) {
        const sourceDirection = sourcePosition === Position.Right ? 1 : -1;
        const targetDirection = targetPosition === Position.Left ? -1 : 1;
        const exitX = sourceX + sourceDirection * primaryOffset;
        const entryX = targetX + targetDirection * primaryOffset;
        const midX = Math.abs(dx) > 210 ? (exitX + entryX) / 2 : exitX;
        return `M ${sourceX} ${sourceY} L ${exitX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${entryX} ${targetY} L ${targetX} ${targetY}`;
    }

    if (sourcePosition === Position.Bottom && targetPosition === Position.Left) {
        const exitY = sourceY + primaryOffset;
        const entryX = targetX - secondaryOffset;
        const bridgeY = Math.abs(dy) > 140 ? exitY : sourceY + primaryOffset * 0.78;
        return `M ${sourceX} ${sourceY} L ${sourceX} ${exitY} L ${entryX} ${exitY} L ${entryX} ${targetY} L ${targetX} ${targetY}`;
    }

    if (sourcePosition === Position.Bottom && targetPosition === Position.Right) {
        const exitY = sourceY + primaryOffset;
        const entryX = targetX + secondaryOffset;
        const bridgeY = Math.abs(dy) > 140 ? exitY : sourceY + primaryOffset * 0.78;
        return `M ${sourceX} ${sourceY} L ${sourceX} ${exitY} L ${entryX} ${exitY} L ${entryX} ${targetY} L ${targetX} ${targetY}`;
    }

    if (sourcePosition === Position.Right && targetPosition === Position.Top) {
        const exitX = sourceX + primaryOffset;
        const entryY = targetY - secondaryOffset;
        return `M ${sourceX} ${sourceY} L ${exitX} ${sourceY} L ${exitX} ${entryY} L ${targetX} ${entryY} L ${targetX} ${targetY}`;
    }

    if (sourcePosition === Position.Left && targetPosition === Position.Top) {
        const exitX = sourceX - primaryOffset;
        const entryY = targetY - secondaryOffset;
        return `M ${sourceX} ${sourceY} L ${exitX} ${sourceY} L ${exitX} ${entryY} L ${targetX} ${entryY} L ${targetX} ${targetY}`;
    }

    if (sourcePosition === Position.Right && targetPosition === Position.Bottom) {
        const exitX = sourceX + primaryOffset;
        const entryY = targetY + secondaryOffset;
        return `M ${sourceX} ${sourceY} L ${exitX} ${sourceY} L ${exitX} ${entryY} L ${targetX} ${entryY} L ${targetX} ${targetY}`;
    }

    if (sourcePosition === Position.Left && targetPosition === Position.Bottom) {
        const exitX = sourceX - primaryOffset;
        const entryY = targetY + secondaryOffset;
        return `M ${sourceX} ${sourceY} L ${exitX} ${sourceY} L ${exitX} ${entryY} L ${targetX} ${entryY} L ${targetX} ${targetY}`;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
        const direction = dx >= 0 ? 1 : -1;
        const exitX = sourceX + direction * primaryOffset;
        const entryX = targetX - direction * secondaryOffset;
        return `M ${sourceX} ${sourceY} L ${exitX} ${sourceY} L ${exitX} ${targetY} L ${entryX} ${targetY} L ${targetX} ${targetY}`;
    }

    const direction = dy >= 0 ? 1 : -1;
    const exitY = sourceY + direction * primaryOffset;
    const entryY = targetY - direction * secondaryOffset;
    return `M ${sourceX} ${sourceY} L ${sourceX} ${exitY} L ${targetX} ${exitY} L ${targetX} ${entryY} L ${targetX} ${targetY}`;
};

function OrthogonalEdge(props) {
    const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, data = {} } = props;
    const path = buildOrthogonalPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        family: data.family || 'main'
    });

    return (
        <BaseEdge
            id={id}
            path={path}
            interactionWidth={0}
            style={{
                ...style,
                pointerEvents: 'none'
            }}
        />
    );
}

function createNodeComponent(type) {
    const definition = NODE_CATALOG[type];
    const Icon = definition.icon;
    const layout = HANDLE_LAYOUTS[type] || { source: [], target: [] };

    return function IdeaNode({ data, selected, isConnectable }) {
        return (
            <div
                style={{
                    ...BASE_NODE_STYLE,
                    background: definition.color,
                    borderColor: selected ? definition.accent : '#0f172a',
                    boxShadow: selected
                        ? `0 0 0 4px ${definition.accent}22, 0 16px 34px rgba(15,23,42,0.2)`
                        : '0 12px 28px rgba(15,23,42,0.18)'
                }}
            >
                {layout.target.map((handle) => (
                    <Handle
                        key={`${type}-${handle.id}`}
                        type="target"
                        id={handle.id}
                        position={handle.position}
                        isConnectable={isConnectable}
                        style={{ ...handleStyle, ...handlePositionStyle(handle.position, handle.style) }}
                    />
                ))}
                {layout.source.map((handle) => (
                    <Handle
                        key={`${type}-${handle.id}`}
                        type="source"
                        id={handle.id}
                        position={handle.position}
                        isConnectable={isConnectable}
                        style={{ ...handleStyle, ...handlePositionStyle(handle.position, handle.style) }}
                    />
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.9)',
                            border: `1px solid ${definition.accent}55`,
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0
                        }}
                    >
                        <Icon size={17} color={definition.accent} strokeWidth={2.2} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#334155' }}>
                            {definition.label}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>
                            {data.title || `Untitled ${definition.label}`}
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: 11, color: '#334155', lineHeight: 1.45, minHeight: 34 }}>
                    {data.details || definition.description}
                </div>
                {type === 'feature' && (
                    <div style={{ marginTop: 12, display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(15,23,42,0.08)', fontSize: 10, fontWeight: 700, color: '#334155' }}>
                        Priority {data.priority || 1}
                    </div>
                )}
            </div>
        );
    };
}

const nodeTypes = Object.fromEntries(
    Object.keys(NODE_CATALOG).map((type) => [type, createNodeComponent(type)])
);
const edgeTypes = { [EDGE_TYPE]: OrthogonalEdge };

const getLaneConfig = (laneKey) => IDEA_LANES.find((lane) => lane.key === laneKey) || IDEA_LANES.find((lane) => lane.key === DEFAULT_LANE_KEY);

const recommendLaneKey = (metadata = {}) => {
    if (metadata?.laneKey) return metadata.laneKey;

    switch (metadata?.productGoal) {
        case 'storytelling':
            return 'creative';
        case 'workflow':
            return 'saas';
        case 'utility':
            return 'tools';
        case 'discovery':
            return 'marketplace';
        case 'credibility':
            return 'portfolio';
        case 'community':
            return 'community';
        case 'ai':
            return 'ai_app';
        default:
            return DEFAULT_LANE_KEY;
    }
};

const buildLaneRecommendationReasons = (metadata = {}) => {
    const reasons = [];
    const goalOption = PRODUCT_GOAL_OPTIONS.find((option) => option.value === metadata?.productGoal);

    if (goalOption) {
        reasons.push(`Primary goal points to ${goalOption.label.toLowerCase()}.`);
    }

    if (metadata?.shipTarget) {
        reasons.push(`Ship target is ${metadata.shipTarget.toLowerCase()}.`);
    }

    if (metadata?.problemStatement) {
        if (/dashboard|workflow|manage|track|admin|system/i.test(metadata.problemStatement)) {
            reasons.push('Problem description sounds workflow-heavy.');
        }
        if (/story|brand|launch|visual|campaign/i.test(metadata.problemStatement)) {
            reasons.push('Problem description sounds narrative or brand-led.');
        }
        if (/tool|generator|checker|calculator|convert/i.test(metadata.problemStatement)) {
            reasons.push('Problem description sounds like a focused utility.');
        }
        if (/community|member|group/i.test(metadata.problemStatement)) {
            reasons.push('Problem description points to recurring engagement or membership.');
        }
        if (/ai|assistant|prompt|agent|automation/i.test(metadata.problemStatement)) {
            reasons.push('Problem description suggests an AI-assisted flow.');
        }
    }

    if (metadata?.desiredOutcome) {
        if (/convert|signup|buy|launch/i.test(metadata.desiredOutcome)) {
            reasons.push('Desired outcome sounds conversion-oriented.');
        }
        if (/review|summar|recommend|generate|score/i.test(metadata.desiredOutcome)) {
            reasons.push('Desired outcome depends on structured outputs or decisions.');
        }
    }

    return reasons.length ? reasons.slice(0, 3) : ['This lane best matches the current onboarding inputs.'];
};

const EMPTY_SCRAPE_STATE = {
    scrapeStatus: 'idle',
    scrapeError: '',
    scrapedAt: '',
    designTheme: '',
    fontDirection: '',
    colorPalette: '',
    flowStructure: '',
    referenceSummary: ''
};

const DEFAULT_IDEA_METADATA = {
    projectName: '',
    audience: '',
    problemStatement: '',
    desiredOutcome: '',
    productGoal: 'workflow',
    laneKey: DEFAULT_LANE_KEY,
    status: 'Draft',
    shipTarget: 'Web app',
    referenceUrl: '',
    ...EMPTY_SCRAPE_STATE
};

const buildReferenceSummary = (result) => {
    if (!result) return '';
    const lines = [
        `${result.title || 'Reference'}`,
        `Theme: ${result.designTheme || 'Not detected'}`,
        `Fonts: ${result.fontDirection || 'Not detected'}`,
        `Palette: ${result.colorPalette || 'Not detected'}`,
        `Flow: ${result.flowStructure || 'Not detected'}`
    ];
    return lines.join('\n');
};

const runLocalReferenceScrape = async ({ referenceUrl }) => {
    if (typeof window === 'undefined') {
        throw new Error('Reference scraping is only available in a browser or desktop runtime.');
    }

    if (window.krackedOS?.reference?.scrape) {
        return window.krackedOS.reference.scrape({
            referenceUrl
        });
    }

    const response = await fetch('/__idea-to-prompt/scrape-reference', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            referenceUrl
        })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload?.error || 'Failed to scrape reference URL.');
    }

    return payload;
};

const canUseBrowserDevScrape = typeof window !== 'undefined' && Boolean(window.location?.port === '5173');

const canRunReferenceScrape = () => {
    if (typeof window === 'undefined') return false;
    if (window.krackedOS?.reference?.scrape) return true;
    return canUseBrowserDevScrape;
};

const buildReferenceScrapeUnavailableError = () => {
    throw new Error('Reference scraping is available in Electron desktop or the local Vite dev server.');
};

const runReferenceScrape = async ({ referenceUrl }) => {
    if (!canRunReferenceScrape()) {
        buildReferenceScrapeUnavailableError();
    }

    return runLocalReferenceScrape({
        referenceUrl
    });
};

const inferRoleProfile = (metadata = {}) => {
    const laneKey = recommendLaneKey(metadata);
    const shipTarget = metadata?.shipTarget || 'Web app';
    const productGoal = metadata?.productGoal || 'workflow';
    const isPrototype = /prototype/i.test(shipTarget);
    const isDesktop = /desktop/i.test(shipTarget);
    const isMobileWeb = /mobile web/i.test(shipTarget);
    const isInternal = /internal tool/i.test(shipTarget);

    const laneProfiles = {
        creative: {
            title: isDesktop ? 'Senior Creative Product Designer' : 'Senior Frontend Brand Designer',
            stack: isPrototype
                ? 'Use React + Vite with lightweight mock data. Prioritize visual polish, fast iteration, and expressive section design.'
                : 'Use React + Vite + Tailwind CSS. Prioritize visual storytelling, polished sections, and reusable content blocks.',
            stance: isMobileWeb
                ? 'Think mobile-first, keep section rhythm tight, and make the CTA obvious on smaller screens.'
                : 'Focus on narrative pacing, visual identity, and a memorable launch-ready experience.'
        },
        saas: {
            title: isInternal ? 'Senior Internal Tools Engineer' : 'Senior Fullstack SaaS Engineer',
            stack: isPrototype
                ? 'Use React + Vite with mock state first, but structure screens like a real product workflow.'
                : isDesktop
                    ? 'Use React + Vite + Tauri + Supabase. Prioritize dependable CRUD flows, auth, and operational clarity.'
                    : 'Use React + Vite + Supabase. Add auth, relational data, and clear dashboard workflows.',
            stance: 'Ship boring reliable product flows, keep MVP scope tight, and make core actions obvious.'
        },
        tools: {
            title: isInternal ? 'Senior Workflow Tools Engineer' : 'Senior Product Engineer for Utilities',
            stack: isPrototype
                ? 'Use React + Vite with local state and sample data so the input-output flow can be tested fast.'
                : isDesktop
                    ? 'Use React + Vite + Tauri for a focused desktop utility with quick local interactions.'
                    : 'Use React + Vite. Keep dependencies light, validate inputs clearly, and optimize for one fast job.',
            stance: 'Prefer low-friction UX, immediate results, and minimal setup before the user gets value.'
        },
        marketplace: {
            title: 'Senior Marketplace Product Engineer',
            stack: isPrototype
                ? 'Use React + Vite with mocked listings and filters to validate discovery flow before backend depth.'
                : 'Use React + Vite + Supabase. Support listings, profiles, filtering, and trust-building metadata.',
            stance: 'Design for fast discovery, credible comparisons, and simple trust signals in the first release.'
        },
        portfolio: {
            title: 'Senior Portfolio Experience Designer',
            stack: isPrototype
                ? 'Use React + Vite with static content and lightweight animation to validate the story fast.'
                : 'Use React + Vite + Tailwind CSS with MDX or a simple CMS-ready content model for case studies.',
            stance: 'Make proof, positioning, and the next CTA clearer than the competition.'
        },
        community: {
            title: 'Senior Community Product Designer',
            stack: isPrototype
                ? 'Use React + Vite with mocked member flows to validate onboarding and engagement loops first.'
                : 'Use React + Vite + Supabase. Support auth, gated resources, profiles, and recurring participation loops.',
            stance: 'Keep member value concrete, onboarding simple, and repeat engagement easy to understand.'
        },
        ai_app: {
            title: 'Senior AI Product Engineer',
            stack: isPrototype
                ? 'Use React + Vite with mocked AI responses first, but preserve the real prompt and review flow.'
                : 'Use React + Vite + Supabase + OpenAI API. Support prompt orchestration, stored runs, and human review steps.',
            stance: 'Make model behavior inspectable, keep outputs editable, and preserve human-in-the-loop quality control.'
        }
    };

    const selectedProfile = laneProfiles[laneKey] || laneProfiles[DEFAULT_LANE_KEY];
    const goalNote = productGoal === 'ai'
        ? 'Treat the AI workflow as a product feature, not just a hidden helper.'
        : productGoal === 'storytelling'
            ? 'Bias the implementation toward clarity of story and presentation.'
            : productGoal === 'utility'
                ? 'Bias the implementation toward speed, clarity, and fast task completion.'
                : 'Bias the implementation toward the main repeatable workflow.';

    return {
        title: selectedProfile.title,
        details: `${selectedProfile.stack} ${selectedProfile.stance} ${goalNote}`
    };
};

const getLaneStarterPack = (metadata = {}) => {
    const lane = getLaneConfig(recommendLaneKey(metadata));
    const projectName = metadata?.projectName || 'New Product';
    const audience = metadata?.audience || 'people with the problem';
    const problem = metadata?.problemStatement || 'help users solve an important problem';
    const desiredOutcome = metadata?.desiredOutcome || 'give the user a clear, useful outcome fast';
    const roleProfile = inferRoleProfile(metadata);

    const lanePacks = {
        creative: {
            objective: `Launch a memorable website for ${projectName}`,
            objectiveDetails: `Translate the brand story into a polished web experience so visitors quickly understand why ${projectName} matters.`,
            features: [
                {
                    title: 'Narrative landing flow',
                    details: `Guide visitors from the core tension around ${problem} into the promise, proof, and CTA without filler.`,
                    priority: 1
                },
                {
                    title: 'Distinctive visual direction',
                    details: `Use layout, typography, and imagery choices that make ${projectName} feel specific instead of generic.`,
                    priority: 2
                }
            ],
            constraint: 'Keep the experience sharp, visually intentional, and conversion-aware',
            constraintDetails: 'Avoid bloated sections, generic stock layouts, or copy that weakens the story.',
            output: 'Produce a polished brand or launch website prompt',
            outputDetails: 'Return a build brief that specifies section flow, design direction, content hierarchy, and CTA behavior.',
            optionalNodes: [
                {
                    type: 'reference',
                    title: 'Inspiration references',
                    details: `Collect 1-2 sites whose mood or pacing feels adjacent to ${projectName}.`
                },
                {
                    type: 'unique_value',
                    title: 'Emotional hook',
                    details: `Name the one feeling or takeaway visitors should remember after seeing ${projectName}.`
                }
            ],
            helper: 'Starter pack generated from onboarding: brand-led flow, strong visual direction, and conversion-aware storytelling.'
        },
        saas: {
            objective: `Help ${audience} solve ${problem}`,
            objectiveDetails: `Turn the current messy workflow into a clearer product system so users can ${desiredOutcome}.`,
            features: [
                {
                    title: 'Core workflow dashboard',
                    details: 'Give users one place to see status, next actions, and progress across the main repeated job.',
                    priority: 1
                },
                {
                    title: 'Action-oriented task flow',
                    details: `Let the user complete the core workflow without confusion, dead ends, or unnecessary navigation.`,
                    priority: 2
                }
            ],
            constraint: 'Keep MVP scope tight and operationally clear',
            constraintDetails: 'Prefer dependable CRUD flows, practical state handling, and a small number of key screens first.',
            output: 'Produce a build-ready SaaS app prompt',
            outputDetails: 'Return a build brief that defines core screens, auth/data assumptions, and the main product workflow.',
            optionalNodes: [
                {
                    type: 'flow',
                    title: 'Primary user flow',
                    details: 'Map the shortest path from first entry to repeated daily use.'
                }
            ],
            helper: 'Starter pack generated from onboarding: operational workflow, structured screens, and dependable app defaults.'
        },
        tools: {
            objective: `Build a focused tool for ${audience}`,
            objectiveDetails: `Help them ${problem} and quickly ${desiredOutcome} with minimal setup or cognitive load.`,
            features: [
                {
                    title: 'Clear input setup',
                    details: 'Make it obvious what the user needs to provide before the tool can run.',
                    priority: 1
                },
                {
                    title: 'Useful result output',
                    details: 'Return a result that is immediately actionable, copyable, or reusable.',
                    priority: 2
                }
            ],
            constraint: 'Avoid feature bloat outside the main utility',
            constraintDetails: 'Optimize for one strong job first, with clean validation and quick completion.',
            output: 'Produce a concise utility app prompt',
            outputDetails: 'Return a build brief with tight scope, edge-case handling, and clear input-output expectations.',
            optionalNodes: [
                {
                    type: 'flow',
                    title: 'Result path',
                    details: 'Describe how the user moves from input to result in the fewest necessary steps.'
                }
            ],
            helper: 'Starter pack generated from onboarding: one-job utility, clean validation, and fast result delivery.'
        },
        marketplace: {
            objective: `Help ${audience} discover the right option faster`,
            objectiveDetails: `Organize choices around ${problem} so users can compare, evaluate, and ${desiredOutcome}.`,
            features: [
                {
                    title: 'Search and browse listings',
                    details: 'Let users filter and compare options quickly without getting lost.',
                    priority: 1
                },
                {
                    title: 'Listing detail and trust signals',
                    details: 'Show enough profile detail, proof, and context for confident decision-making.',
                    priority: 2
                }
            ],
            constraint: 'Keep ranking, trust, and listing logic simple in MVP',
            constraintDetails: 'Start with clear taxonomy, strong filtering, and lightweight profile quality signals.',
            output: 'Produce a marketplace or directory app prompt',
            outputDetails: 'Return a build brief that covers discovery flow, listing structure, profile details, and trust cues.',
            optionalNodes: [
                {
                    type: 'reference',
                    title: 'Discovery benchmark',
                    details: 'Reference one marketplace or directory with especially clear browse and filter behavior.'
                }
            ],
            helper: 'Starter pack generated from onboarding: listings, discovery, and trust-building purchase or selection flow.'
        },
        portfolio: {
            objective: `Show why ${projectName} matters`,
            objectiveDetails: `Build trust with ${audience} by turning the work, proof, and positioning into a focused narrative.`,
            features: [
                {
                    title: 'Proof-driven case studies',
                    details: 'Highlight outcomes, process, and credibility in a way that feels specific and earned.',
                    priority: 1
                },
                {
                    title: 'Clear next-action path',
                    details: 'Make inquiry, contact, or booking actions feel direct instead of buried.',
                    priority: 2
                }
            ],
            constraint: 'Keep the story credible and remove filler sections',
            constraintDetails: 'Prioritize proof over fluff, and keep the CTA path obvious for the right audience.',
            output: 'Produce a portfolio or personal brand site prompt',
            outputDetails: 'Return a build brief that emphasizes proof structure, case studies, and CTA conversion.',
            optionalNodes: [
                {
                    type: 'unique_value',
                    title: 'Signature point of view',
                    details: `State what makes ${projectName} or its creator feel distinct from lookalike portfolios.`
                }
            ],
            helper: 'Starter pack generated from onboarding: credibility, proof, and a sharp call-to-action path.'
        },
        community: {
            objective: `Create a community experience for ${audience}`,
            objectiveDetails: `Help members around ${problem} in a way that drives repeat visits and lets them ${desiredOutcome}.`,
            features: [
                {
                    title: 'Member entry and orientation',
                    details: 'Make it easy to understand the value, first actions, and what members should do next.',
                    priority: 1
                },
                {
                    title: 'Resources or participation hub',
                    details: 'Give members a clear home for useful assets, updates, or recurring participation.',
                    priority: 2
                }
            ],
            constraint: 'Do not overload MVP with too many community mechanics',
            constraintDetails: 'Start with a simple loop for member value before adding deep engagement systems.',
            output: 'Produce a community or membership platform prompt',
            outputDetails: 'Return a build brief that defines member onboarding, recurring value, and the minimal engagement loop.',
            optionalNodes: [
                {
                    type: 'flow',
                    title: 'Member loop',
                    details: 'Describe the loop that brings members back after the first visit.'
                }
            ],
            helper: 'Starter pack generated from onboarding: member onboarding, repeat value, and a simple engagement loop.'
        },
        ai_app: {
            objective: `Help ${audience} use AI to ${problem}`,
            objectiveDetails: `Guide them through an AI-assisted workflow so they can ${desiredOutcome} without losing trust or control.`,
            features: [
                {
                    title: 'Prompt or task setup flow',
                    details: 'Collect the right context before the model runs so the output has enough grounding.',
                    priority: 1
                },
                {
                    title: 'Review and refine output',
                    details: 'Let users inspect, edit, approve, and reuse results confidently before anything final happens.',
                    priority: 2
                }
            ],
            constraint: 'Keep model behavior transparent and outputs editable',
            constraintDetails: 'Avoid black-box magic. Show inputs, preserve revisions, and support human review.',
            output: 'Produce an AI app or agent workflow prompt',
            outputDetails: 'Return a build brief that defines prompt flow, run states, review steps, and AI-assisted delivery rules.',
            optionalNodes: [
                {
                    type: 'flow',
                    title: 'AI run loop',
                    details: 'Describe setup, generation, review, and approval as a visible product flow.'
                },
                {
                    type: 'custom',
                    title: 'AI workflow target',
                    details: desiredOutcome
                }
            ],
            helper: 'Starter pack generated from onboarding: prompt flow, review loop, and human-in-the-loop output quality.'
        }
    };

    return {
        lane,
        roleProfile,
        ...lanePacks[lane.key]
    };
};

const buildScrapedReferenceNodes = (metadata = {}) => {
    const nodes = [];

    if (metadata?.referenceSummary) {
        nodes.push({
            type: 'reference',
            title: 'Reference insight',
            details: metadata.referenceSummary
        });
    }

    if (metadata?.designTheme || metadata?.fontDirection || metadata?.colorPalette || metadata?.flowStructure) {
        nodes.push({
            type: 'custom',
            title: 'Scraped inspiration digest',
            details: [
                metadata?.designTheme ? `Theme: ${metadata.designTheme}` : '',
                metadata?.fontDirection ? `Fonts: ${metadata.fontDirection}` : '',
                metadata?.colorPalette ? `Palette: ${metadata.colorPalette}` : '',
                metadata?.flowStructure ? `Flow: ${metadata.flowStructure}` : ''
            ].filter(Boolean).join('\n')
        });
    }

    return nodes;
};

const getStarterSupportRail = (nodeType) => (
    ['target_user', 'reference', 'unique_value'].includes(nodeType) ? 'top' : 'bottom'
);

const getStarterSupportTargetId = (nodeType) => (nodeType === 'reference' ? 'starter-objective' : 'starter-output');

const buildStarterSupportLayout = ({ optionalNodes = [], scrapedNodes = [] } = {}) => {
    const topNodes = [];
    const bottomNodes = [];
    const pushToRail = (node) => {
        if (getStarterSupportRail(node.type) === 'top') {
            topNodes.push(node);
            return;
        }
        bottomNodes.push(node);
    };

    pushToRail({
        type: 'target_user',
        id: 'starter-user',
        title: optionalNodes.targetUser.title,
        details: optionalNodes.targetUser.details
    });

    [...optionalNodes.sideNodes, ...scrapedNodes].forEach((node) => {
        pushToRail(node);
    });

    const assignRailPositions = (nodes, slots, y) => nodes.map((node, index) => ({
        ...node,
        position: {
            x: slots[index] ?? (slots[slots.length - 1] + ((index - slots.length + 1) * STARTER_LAYOUT.overflowGap)),
            y
        }
    }));

    return [
        ...assignRailPositions(topNodes, STARTER_LAYOUT.topRailSlots, STARTER_LAYOUT.topRailY),
        ...assignRailPositions(bottomNodes, STARTER_LAYOUT.bottomRailSlots, STARTER_LAYOUT.bottomRailY)
    ];
};

const createIdeaNode = (type, position, overrides = {}) => {
    const definition = NODE_CATALOG[type];
    return {
        id: overrides.id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        position,
        style: {
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            width: 'auto'
        },
        data: {
            title: overrides.title || definition.label,
            details: overrides.details || '',
            priority: overrides.priority || (type === 'feature' ? 1 : 1),
            required: REQUIRED_TYPES.includes(type),
            ...overrides.data
        }
    };
};

const buildStarterDocument = (metadata = {}) => {
    const projectName = metadata?.projectName || 'New Product';
    const audience = metadata?.audience || 'people with the problem';
    const problem = metadata?.problemStatement || 'help users solve an important problem';
    const starterPack = getLaneStarterPack(metadata);
    const backboneXs = STARTER_LAYOUT.backboneXs;

    const backboneNodes = [
        createIdeaNode('role', { x: backboneXs.role, y: STARTER_LAYOUT.backboneY }, {
            id: 'starter-role',
            title: starterPack.roleProfile.title,
            details: starterPack.roleProfile.details
        }),
        createIdeaNode('objective', { x: backboneXs.objective, y: STARTER_LAYOUT.backboneY }, {
            id: 'starter-objective',
            title: starterPack.objective,
            details: starterPack.objectiveDetails
        }),
        ...starterPack.features.map((feature, index) => createIdeaNode('feature', {
            x: backboneXs.featureStart + (index * backboneXs.featureGap),
            y: STARTER_LAYOUT.backboneY
        }, {
            id: `starter-feature-${index + 1}`,
            title: feature.title,
            details: feature.details,
            priority: feature.priority || index + 1
        })),
        createIdeaNode('constraint', { x: backboneXs.constraint, y: STARTER_LAYOUT.backboneY }, {
            id: 'starter-constraint',
            title: starterPack.constraint,
            details: starterPack.constraintDetails
        }),
        createIdeaNode('output', { x: backboneXs.output, y: STARTER_LAYOUT.backboneY }, {
            id: 'starter-output',
            title: starterPack.output,
            details: starterPack.outputDetails
        })
    ];

    const scrapedReferenceNodes = buildScrapedReferenceNodes(metadata);
    const supportDescriptors = buildStarterSupportLayout({
        optionalNodes: {
            targetUser: {
                title: audience,
                details: `Primary audience for ${projectName}. They need help with ${problem}.`
            },
            sideNodes: (starterPack.optionalNodes || []).map((node, index) => ({
                ...node,
                id: `starter-optional-${node.type}-${index + 1}`
            }))
        },
        scrapedNodes: scrapedReferenceNodes.map((node, index) => ({
            ...node,
            id: `starter-scrape-${node.type}-${index + 1}`
        }))
    });

    const sideNodes = supportDescriptors.map((node) => createIdeaNode(node.type, node.position, {
        id: node.id,
        title: node.title,
        details: node.details
    }));

    const nodes = [...backboneNodes, ...sideNodes];
    const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const featureIds = starterPack.features.map((_, index) => `starter-feature-${index + 1}`);
    const linearEdgeIds = [
        ['starter-role', 'starter-objective', 'e-role-objective'],
        ['starter-objective', featureIds[0], 'e-objective-feature-1'],
        ...featureIds.slice(0, -1).map((featureId, index) => [featureId, featureIds[index + 1], `e-feature-${index + 1}-${index + 2}`]),
        [featureIds[featureIds.length - 1], 'starter-constraint', 'e-feature-constraint'],
        ['starter-constraint', 'starter-output', 'e-constraint-output']
    ];

    const sideEdgeIds = [
        ['starter-user', 'starter-objective', 'e-user-objective'],
        ...supportDescriptors
            .filter((node) => node.id !== 'starter-user')
            .map((node, index) => {
            const targetId = getStarterSupportTargetId(node.type);
            return [node.id, targetId, `e-support-${node.type}-${index + 1}`];
        })
    ];

    const edges = [...linearEdgeIds, ...sideEdgeIds]
        .map(([sourceId, targetId, edgeId]) => buildEdgePayload(byId[sourceId], byId[targetId], { id: edgeId }))
        .filter(Boolean);

    return {
        nodes,
        edges,
        meta: {
            laneKey: starterPack.lane.key,
            laneLabel: starterPack.lane.label,
            helper: starterPack.helper
        }
    };
};

const createIdeaRecord = ({
    name = 'New Idea',
    graph = buildStarterDocument(),
    draftPrompt = '',
    promptDirty = false,
    syncedGeneratedPrompt = '',
    metadata = {},
    importedLegacy = false
} = {}) => ({
    id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    graph,
    draftPrompt,
    promptDirty,
    syncedGeneratedPrompt: syncedGeneratedPrompt || buildRoFcoPrompt(graph.nodes),
    metadata: {
        ...DEFAULT_IDEA_METADATA,
        projectName: name,
        ...metadata
    },
    importedLegacy,
    updatedAt: Date.now()
});

const sanitizeFilenamePart = (value, fallback = 'idea') => {
    const normalized = String(value || fallback)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized || fallback;
};

const downloadTextFile = (filename, content, mimeType = 'text/plain;charset=utf-8') => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

const serializeIdeaExport = (idea) => ({
    version: IDEAS_STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'kracked-idea-to-prompt',
    idea
});

const normalizeImportedIdeaPayload = (payload) => {
    const rawIdea = payload?.idea || payload;
    if (!rawIdea || !Array.isArray(rawIdea.graph?.nodes) || !rawIdea.graph.nodes.length) {
        throw new Error('Imported file does not contain a valid idea graph.');
    }

    const graph = {
        nodes: rawIdea.graph.nodes,
        edges: normalizeStoredEdges(rawIdea.graph.edges, rawIdea.graph.nodes)
    };

    return createIdeaRecord({
        name: rawIdea.name || 'Imported Idea',
        graph,
        draftPrompt: rawIdea.draftPrompt || '',
        promptDirty: Boolean(rawIdea.promptDirty),
        syncedGeneratedPrompt: rawIdea.syncedGeneratedPrompt || buildRoFcoPrompt(graph.nodes),
        metadata: rawIdea.metadata || {},
        importedLegacy: Boolean(rawIdea.importedLegacy)
    });
};

const mapLegacyNodeType = (legacyType) => {
    switch (legacyType) {
        case 'core_problem':
            return 'objective';
        case 'core_feature':
            return 'feature';
        default:
            return 'custom';
    }
};

const importLegacyMindMap = () => {
    if (typeof window === 'undefined') return null;
    try {
        const saved = JSON.parse(window.localStorage.getItem(LEGACY_MINDMAP_KEY) || '{}');
        if (!Array.isArray(saved.nodes) || !saved.nodes.length) return null;
        const nodes = saved.nodes.map((node, index) => {
            const mappedType = mapLegacyNodeType(node.type);
            return {
                id: node.id || `legacy-${index}`,
                type: mappedType,
                position: node.position || { x: 120 + (index % 4) * 180, y: 120 + Math.floor(index / 4) * 150 },
                data: {
                    title: node.data?.label || NODE_CATALOG[mappedType].label,
                    details: node.type === 'core_problem' || node.type === 'core_feature'
                        ? ''
                        : `Imported from legacy ${String(node.type || 'mind map').replaceAll('_', ' ')} node.`,
                    priority: mappedType === 'feature' ? Math.max(1, index + 1) : 1,
                    required: REQUIRED_TYPES.includes(mappedType)
                }
            };
        });
        const edges = Array.isArray(saved.edges) ? saved.edges : [];
        return { nodes, edges, importedLegacy: true };
    } catch {
        return null;
    }
};

const loadStoredDocument = () => {
    if (typeof window === 'undefined') {
        return {
            ideas: [createIdeaRecord({ name: 'Starter Idea' })],
            activeIdeaId: null
        };
    }

    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        if (saved?.version === IDEAS_STORAGE_VERSION && Array.isArray(saved.ideas) && saved.ideas.length) {
            const ideas = saved.ideas.map((idea, index) => {
                const graph = {
                    nodes: Array.isArray(idea.graph?.nodes) ? idea.graph.nodes : buildStarterDocument().nodes,
                    edges: normalizeStoredEdges(idea.graph?.edges, Array.isArray(idea.graph?.nodes) ? idea.graph.nodes : [])
                };
                return {
                    id: idea.id || `idea-${index}`,
                    name: idea.name || `Idea ${index + 1}`,
                    graph,
                    draftPrompt: idea.draftPrompt || '',
                    promptDirty: Boolean(idea.promptDirty),
                    syncedGeneratedPrompt: idea.syncedGeneratedPrompt || buildRoFcoPrompt(graph.nodes),
                    metadata: {
                        ...DEFAULT_IDEA_METADATA,
                        projectName: idea.metadata?.projectName || idea.name || `Idea ${index + 1}`,
                        audience: idea.metadata?.audience || '',
                        problemStatement: idea.metadata?.problemStatement || '',
                        desiredOutcome: idea.metadata?.desiredOutcome || '',
                        productGoal: idea.metadata?.productGoal || 'workflow',
                        laneKey: idea.metadata?.laneKey || DEFAULT_LANE_KEY,
                        status: idea.metadata?.status || 'Draft',
                        shipTarget: idea.metadata?.shipTarget || 'Web app',
                        referenceUrl: idea.metadata?.referenceUrl || idea.metadata?.websiteReferenceUrl || idea.metadata?.designReferenceUrl || '',
                        scrapeStatus: idea.metadata?.scrapeStatus || 'idle',
                        scrapeError: idea.metadata?.scrapeError || '',
                        scrapedAt: idea.metadata?.scrapedAt || '',
                        designTheme: idea.metadata?.designTheme || '',
                        fontDirection: idea.metadata?.fontDirection || '',
                        colorPalette: idea.metadata?.colorPalette || '',
                        flowStructure: idea.metadata?.flowStructure || '',
                        referenceSummary: idea.metadata?.referenceSummary || idea.metadata?.websiteReferenceSummary || idea.metadata?.designReferenceSummary || ''
                    },
                    importedLegacy: Boolean(idea.importedLegacy),
                    updatedAt: idea.updatedAt || Date.now()
                };
            });
            const activeIdeaId = ideas.some((idea) => idea.id === saved.activeIdeaId) ? saved.activeIdeaId : ideas[0].id;
            return { ideas, activeIdeaId };
        }
        if (saved?.graph?.nodes && Array.isArray(saved.graph.nodes)) {
            const normalizedNodes = saved.graph.nodes;
            const graph = {
                nodes: normalizedNodes,
                edges: normalizeStoredEdges(saved.graph.edges, normalizedNodes)
            };
            const migratedIdea = createIdeaRecord({
                name: 'Current Idea',
                graph,
                draftPrompt: saved.lastEditedPrompt || '',
                promptDirty: Boolean(saved.lastEditedPrompt),
                syncedGeneratedPrompt: saved.generatedPrompt || buildRoFcoPrompt(graph.nodes),
                importedLegacy: false
            });
            return { ideas: [migratedIdea], activeIdeaId: migratedIdea.id };
        }
    } catch {
        // Ignore malformed storage and fall through to defaults.
    }

    const legacy = importLegacyMindMap();
    if (legacy) {
        const graph = {
            nodes: legacy.nodes,
            edges: normalizeStoredEdges(legacy.edges, legacy.nodes)
        };
        const importedIdea = createIdeaRecord({
            name: 'Imported Idea',
            graph,
            importedLegacy: true
        });
        return { ideas: [importedIdea], activeIdeaId: importedIdea.id };
    }

    const starterIdea = createIdeaRecord({ name: 'Starter Idea' });
    return { ideas: [starterIdea], activeIdeaId: starterIdea.id };
};

const groupedNodesFromGraph = (nodes) => {
    const ordered = [...nodes].sort((left, right) => {
        if (left.type === 'feature' && right.type === 'feature') {
            return (left.data?.priority || 1) - (right.data?.priority || 1);
        }
        return left.position.y - right.position.y || left.position.x - right.position.x;
    });

    return ordered.reduce((accumulator, node) => {
        if (!accumulator[node.type]) accumulator[node.type] = [];
        accumulator[node.type].push(node);
        return accumulator;
    }, {});
};

const buildCompletenessSummary = (nodesByType) => REQUIRED_TYPES.map((type) => ({
    type,
    label: NODE_CATALOG[type].label,
    count: nodesByType[type]?.length || 0,
    complete: Boolean(nodesByType[type]?.length)
}));

const buildWarnings = (summary) => summary
    .filter((item) => !item.complete)
    .map((item) => `Missing ${item.label.toLowerCase()} node.`);

const buildReviewSections = (nodes) => {
    const grouped = groupedNodesFromGraph(nodes);
    const role = grouped.role?.[0];
    const objective = grouped.objective?.[0];
    const targetUser = grouped.target_user?.[0];
    const output = grouped.output?.[0];
    const referenceNodes = grouped.reference || [];
    const uniqueValueNodes = grouped.unique_value || [];
    const flowNodes = grouped.flow || [];
    const customNodes = grouped.custom || [];
    const featureNodes = grouped.feature || [];
    const constraintNodes = grouped.constraint || [];

    const featureLines = featureNodes.length
        ? featureNodes.map((node, index) => {
            const detail = node.data?.details ? ` - ${node.data.details}` : '';
            return `${index + 1}. ${node.data?.title || 'Feature'}${detail}`;
        }).join('\n')
        : '1. Define the core MVP feature.\n2. Break it into clear product capabilities.';

    const constraintLines = constraintNodes.length
        ? constraintNodes.map((node) => `- ${node.data?.title || 'Constraint'}${node.data?.details ? `: ${node.data.details}` : ''}`).join('\n')
        : '- Keep the implementation practical, scoped, and shippable.';

    const referenceLines = [
        ...referenceNodes.map((node) => `- Reference: ${node.data?.title || 'Reference'}${node.data?.details ? ` — ${node.data.details}` : ''}`),
        ...uniqueValueNodes.map((node) => `- Unique value: ${node.data?.title || 'Differentiator'}${node.data?.details ? ` — ${node.data.details}` : ''}`)
    ];

    const outputNotes = [
        output?.data?.title || 'Return a clear build-ready deliverable.',
        output?.data?.details || 'Confirm the brief, then produce complete code in a structured sequence.',
        ...flowNodes.map((node) => `${node.data?.title || 'Flow'}${node.data?.details ? ` — ${node.data.details}` : ''}`)
    ].filter(Boolean);

    const supportNotes = customNodes.map((node) => `- ${node.data?.title || 'Supporting note'}${node.data?.details ? `: ${node.data.details}` : ''}`);
    return {
        role: {
            key: 'role',
            heading: '[R] ROLE',
            sourceType: 'role',
            sourceCount: grouped.role?.length || 0,
            complete: Boolean(grouped.role?.length),
            sourceLabel: grouped.role?.length ? `Role comes from ${grouped.role.length} map node${grouped.role.length === 1 ? '' : 's'}.` : 'Role incomplete.',
            body: `Persona: ${role?.data?.title || 'Senior Fullstack Engineer'}
Implementation stance: ${role?.data?.details || 'Use proven tools, ship complete code, and keep decisions mobile-first.'}`
        },
        objective: {
            key: 'objective',
            heading: '[O] OBJECTIVE',
            sourceType: 'objective',
            sourceCount: (grouped.objective?.length || 0) + (grouped.target_user?.length || 0),
            complete: Boolean(grouped.objective?.length) && Boolean(grouped.target_user?.length),
            sourceLabel: `Objective uses ${grouped.objective?.length || 0} objective node and ${grouped.target_user?.length || 0} target user node${(grouped.target_user?.length || 0) === 1 ? '' : 's'}.`,
            body: `Problem to solve:
${objective?.data?.title || 'Define the main business problem clearly.'}
${objective?.data?.details || 'Describe the user pain in concrete terms.'}

Target user:
${targetUser?.data?.title || 'Define the primary target user.'}
${targetUser?.data?.details || 'Explain who they are, what context they are in, and why this matters.'}
${referenceLines.length ? `\nContext notes:\n${referenceLines.join('\n')}` : ''}`
        },
        features: {
            key: 'features',
            heading: '[F] FEATURES',
            sourceType: 'feature',
            sourceCount: grouped.feature?.length || 0,
            complete: Boolean(grouped.feature?.length),
            sourceLabel: grouped.feature?.length ? `Features come from ${grouped.feature.length} feature node${grouped.feature.length === 1 ? '' : 's'}.` : 'Features incomplete.',
            body: `Build these capabilities in priority order:
${featureLines}`
        },
        constraints: {
            key: 'constraints',
            heading: '[C] CONSTRAINTS',
            sourceType: 'constraint',
            sourceCount: grouped.constraint?.length || 0,
            complete: Boolean(grouped.constraint?.length),
            sourceLabel: grouped.constraint?.length ? `Constraints come from ${grouped.constraint.length} constraint node${grouped.constraint.length === 1 ? '' : 's'}.` : 'Constraints incomplete.',
            body: constraintLines
        },
        output: {
            key: 'output',
            heading: '[O] OUTPUT',
            sourceType: 'output',
            sourceCount: (grouped.output?.length || 0) + (grouped.flow?.length || 0) + (grouped.custom?.length || 0),
            complete: Boolean(grouped.output?.length),
            sourceLabel: `Output uses ${grouped.output?.length || 0} output node, ${grouped.flow?.length || 0} flow node${(grouped.flow?.length || 0) === 1 ? '' : 's'}, and ${grouped.custom?.length || 0} custom appendix node${(grouped.custom?.length || 0) === 1 ? '' : 's'}.`,
            body: `Expected output and delivery style:
${outputNotes.map((line, index) => `${index + 1}. ${line}`).join('\n')}

Execution rules:
1. Restate the app briefly before coding.
2. Surface any critical ambiguity in one concise question if needed.
3. Build complete code, not placeholders.
4. Keep the work scoped to the MVP first.
5. Verify the implementation path and expected test flow.
${supportNotes.length ? `\nSupporting notes:\n${supportNotes.join('\n')}` : ''}`
        }
    };
};

const buildRoFcoPrompt = (nodes) => {
    const sections = buildReviewSections(nodes);

    return `You are ${sections.role.body.replace(/^Persona:\s*/, '').split('\n')[0] || 'a senior product-minded fullstack engineer'}.

═══════════════════════════════════════════════════════════════════
${sections.role.heading}
═══════════════════════════════════════════════════════════════════
${sections.role.body}

═══════════════════════════════════════════════════════════════════
${sections.objective.heading}
═══════════════════════════════════════════════════════════════════
${sections.objective.body}

═══════════════════════════════════════════════════════════════════
${sections.features.heading}
═══════════════════════════════════════════════════════════════════
${sections.features.body}

═══════════════════════════════════════════════════════════════════
${sections.constraints.heading}
═══════════════════════════════════════════════════════════════════
${sections.constraints.body}

═══════════════════════════════════════════════════════════════════
${sections.output.heading}
═══════════════════════════════════════════════════════════════════
${sections.output.body}

End goal: produce a master prompt that another AI coding assistant can execute with minimal follow-up.`;
};

const buildIdeaSummary = ({ name, metadata, completenessSummary, warnings, nodes }) => {
    const featureNodes = nodes.filter((node) => node.type === 'feature');
    return [
        `Project: ${metadata?.projectName || name}`,
        `Audience: ${metadata?.audience || 'Not set yet'}`,
        `Problem: ${metadata?.problemStatement || 'Not set yet'}`,
        `Desired outcome: ${metadata?.desiredOutcome || 'Not set yet'}`,
        `Lane: ${getLaneConfig(metadata?.laneKey || recommendLaneKey(metadata)).label}`,
        `Status: ${metadata?.status || 'Draft'}`,
        `Ship target: ${metadata?.shipTarget || 'Web app'}`,
        `Required sections ready: ${completenessSummary.filter((item) => item.complete).length}/${completenessSummary.length}`,
        `Feature count: ${featureNodes.length}`,
        warnings.length ? `Warnings: ${warnings.join(' ')}` : 'Warnings: None'
    ].join('\n');
};

const buildHandoffPackMarkdown = ({ idea, prompt, reviewSections, completenessSummary, warnings, generatedAt }) => {
    const sectionMarkdown = REVIEW_SECTION_ORDER.map((sectionKey) => {
        const section = reviewSections[sectionKey];
        return `## ${section.heading.replace(/[\[\]]/g, '')}\n\n${section.body}`;
    }).join('\n\n');

    return `# ${idea.metadata?.projectName || idea.name} Handoff Pack

Generated from KRACKED_OS Idea to Prompt on ${generatedAt}.

## Project Metadata

- Project: ${idea.metadata?.projectName || idea.name}
- Audience: ${idea.metadata?.audience || 'Not set yet'}
- Problem: ${idea.metadata?.problemStatement || 'Not set yet'}
- Desired outcome: ${idea.metadata?.desiredOutcome || 'Not set yet'}
- Product lane: ${getLaneConfig(idea.metadata?.laneKey || recommendLaneKey(idea.metadata)).label}
- Status: ${idea.metadata?.status || 'Draft'}
- Ship target: ${idea.metadata?.shipTarget || 'Web app'}

## Builder Summary

\`\`\`text
${buildIdeaSummary({
    name: idea.name,
    metadata: idea.metadata,
    completenessSummary,
    warnings,
    nodes: idea.graph?.nodes || []
})}
\`\`\`

## Derived Review

${sectionMarkdown}

## Master Prompt

\`\`\`text
${prompt}
\`\`\`
`;
};

function IdeaCanvas({
    compact,
    panelOpen,
    onClosePanel,
    activeStep,
    onStepChange,
    quickAddType,
    onQuickAddRequest,
    onQuickAddConsumed,
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    setNodes,
    onNodesChange,
    setEdges,
    onEdgesChange,
    completenessSummary,
    warnings,
    promptDraft,
    onPromptDraftChange,
    onRegeneratePrompt,
    onResetPrompt,
    promptDirty,
    promptCopied,
    onCopyPrompt,
    importedLegacy,
    ideaMetadata,
    onIdeaMetadataChange,
    onScrapeReferenceUrls,
    onApplyOnboardingTemplate,
    onLoadOnboardingExample,
    reviewSections,
    isReadyForReview,
    promptNeedsRegenerate,
    onJumpToNodeType,
    ideas,
    activeIdeaId,
    activeIdeaName,
    onSelectIdea,
    onCreateIdea,
    onRenameIdea,
    onDeleteIdea,
    onSaveIdea,
    onExportIdea,
    onExportPrompt,
    onExportHandoffPack,
    onImportIdea,
    onClearCanvas,
    activeDockGroup,
    onDockGroupChange,
    nodesTrayOpen,
    onSetNodesTrayOpen
}) {
    const { screenToFlowPosition, fitView } = useReactFlow();
    const wrapperRef = useRef(null);
    const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;
    const [reviewTab, setReviewTab] = useState('summary');
    const canScrapeReferences = canRunReferenceScrape();
    const recommendedLane = getLaneConfig(recommendLaneKey(ideaMetadata));
    const RecommendedLaneIcon = recommendedLane.icon;
    const recommendationReasons = buildLaneRecommendationReasons(ideaMetadata);
    const inferredRoleProfile = inferRoleProfile({
        ...ideaMetadata,
        laneKey: recommendLaneKey(ideaMetadata)
    });
    const starterPackPreview = getLaneStarterPack({
        ...ideaMetadata,
        laneKey: recommendLaneKey(ideaMetadata)
    });
    const scrapeStatus = ideaMetadata?.scrapeStatus || 'idle';
    const scrapeReady = scrapeStatus === 'ready';
    const scrapeRunning = scrapeStatus === 'loading';

    const addNodeOfType = useCallback((type, preferredPosition = null) => {
        const position = preferredPosition || (
            wrapperRef.current
                ? (() => {
                    const rect = wrapperRef.current.getBoundingClientRect();
                    return screenToFlowPosition({
                        x: rect.left + rect.width * 0.52,
                        y: rect.top + rect.height * 0.42
                    });
                })()
                : { x: 260, y: 180 }
        );

        const newNode = createIdeaNode(type, position);
        setNodes((currentNodes) => currentNodes.concat(newNode));
        setSelectedNodeId(newNode.id);
    }, [screenToFlowPosition, setNodes, setSelectedNodeId]);

    const onConnect = useCallback(
        (params) => {
            if (!isValidSemanticConnection(params, nodes)) return;
            const sourceNode = nodes.find((node) => node.id === params.source);
            const targetNode = nodes.find((node) => node.id === params.target);
            const nextEdge = buildEdgePayload(sourceNode, targetNode, params);
            if (!nextEdge) return;
            setEdges((currentEdges) => {
                const withoutDuplicate = currentEdges.filter((edge) => !(edge.source === nextEdge.source && edge.target === nextEdge.target));
                return addEdge(nextEdge, withoutDuplicate);
            });
        },
        [nodes, setEdges]
    );

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        if (!type || !NODE_CATALOG[type]) return;
        addNodeOfType(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    }, [addNodeOfType, screenToFlowPosition]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    useEffect(() => {
        if (!quickAddType) return;
        addNodeOfType(quickAddType);
        onQuickAddConsumed?.();
    }, [addNodeOfType, onQuickAddConsumed, quickAddType]);

    useEffect(() => {
        if (activeStep !== 'review') {
            setReviewTab('summary');
        }
    }, [activeStep]);

    useEffect(() => {
        if (!nodes.length) return;
        window.setTimeout(() => fitView({ padding: FIT_VIEW_PADDING, duration: 280 }), 0);
    }, [fitView, nodes.length]);

    useEffect(() => {
        const handleDelete = (event) => {
            const target = event.target;
            const tagName = target?.tagName?.toLowerCase?.() || '';
            if (target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName)) return;
            if ((event.key !== 'Delete' && event.key !== 'Backspace') || !selectedNodeId) return;
            event.preventDefault();
            setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNodeId));
            setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
            setSelectedNodeId(null);
        };

        window.addEventListener('keydown', handleDelete);
        return () => window.removeEventListener('keydown', handleDelete);
    }, [selectedNodeId, setEdges, setNodes, setSelectedNodeId]);

    const handleResetToStarter = useCallback(() => {
        const starter = buildStarterDocument({
            ...ideaMetadata,
            laneKey: recommendLaneKey(ideaMetadata)
        });
        setNodes(starter.nodes);
        setEdges(starter.edges);
        setSelectedNodeId(starter.nodes[0]?.id || null);
        window.setTimeout(() => fitView({ padding: FIT_VIEW_PADDING, duration: 320 }), 0);
    }, [fitView, ideaMetadata, setEdges, setNodes, setSelectedNodeId]);

    const handleSelectedFieldChange = useCallback((field, value) => {
        setNodes((currentNodes) => currentNodes.map((node) => {
            if (node.id !== selectedNodeId) return node;
            return {
                ...node,
                data: {
                    ...node.data,
                    [field]: field === 'priority' ? Math.max(1, Number(value) || 1) : value
                }
            };
        }));
    }, [selectedNodeId, setNodes]);

    const handleDeleteSelected = useCallback(() => {
        if (!selectedNodeId) return;
        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== selectedNodeId));
        setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
        setSelectedNodeId(null);
    }, [selectedNodeId, setEdges, setNodes, setSelectedNodeId]);

    const missingRequired = completenessSummary.filter((item) => !item.complete).map((item) => item.type);
    const activeDock = DOCK_GROUPS.find((group) => group.key === activeDockGroup) || DOCK_GROUPS[0];
    const dockTypes = activeDock.types;
    const contentInsetTop = compact ? 58 : activeStep === 'review' ? 96 : 78;

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: 'linear-gradient(180deg, #f2f6fc 0%, #e8eef8 100%)' }}>
            {compact && !panelOpen && (
                <button
                    type="button"
                    onClick={() => onStepChange(`${activeStep}:panel`)}
                    style={{
                        position: 'absolute',
                        left: 10,
                        top: 10,
                        zIndex: 26,
                        border: '1px solid rgba(148,163,184,0.24)',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.94)',
                        color: '#334155',
                        width: 34,
                        height: 34,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <PanelLeft size={16} />
                </button>
            )}

            <div style={{ position: 'absolute', top: compact ? 10 : 18, left: compact ? 52 : 18, right: compact ? 10 : 18, zIndex: 15, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(148,163,184,0.22)', boxShadow: '0 12px 26px rgba(148,163,184,0.14)' }}>
                        <FolderOpen size={15} color="#475569" />
                        <select
                            value={activeIdeaId}
                            onChange={(event) => onSelectIdea(event.target.value)}
                            style={{ border: 'none', background: 'transparent', color: '#0f172a', fontWeight: 800, fontSize: 12, outline: 'none', minWidth: compact ? 130 : 180 }}
                        >
                            {ideas.map((idea) => (
                                <option key={idea.id} value={idea.id}>{idea.name}</option>
                            ))}
                        </select>
                        <button type="button" onClick={onCreateIdea} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: '#fff', color: '#334155', width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="New idea">
                            <Plus size={14} />
                        </button>
                        <button type="button" onClick={onRenameIdea} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: '#fff', color: '#334155', width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Rename idea">
                            <Pencil size={13} />
                        </button>
                        <button type="button" onClick={onDeleteIdea} style={{ border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, background: 'rgba(254,242,242,0.95)', color: '#b91c1c', width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title="Delete idea">
                            <Trash2 size={13} />
                        </button>
                    </div>

                    <div style={{ display: 'inline-flex', padding: 4, borderRadius: 16, background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(148,163,184,0.22)', boxShadow: '0 12px 26px rgba(148,163,184,0.14)', gap: 4 }}>
                        {[
                            { key: 'onboarding', label: 'Step 0: Find Idea' },
                            { key: 'map', label: 'Step 1: Build Map' },
                            { key: 'review', label: 'Step 2: Review Prompt' }
                        ].map((step) => {
                            const isActive = activeStep === step.key;
                            const isReview = step.key === 'review';
                            const canOpen = !isReview || isReadyForReview;
                            return (
                                <button
                                    key={step.key}
                                    type="button"
                                    onClick={() => canOpen && onStepChange(step.key)}
                                    style={{
                                        border: 'none',
                                        borderRadius: 12,
                                        padding: '9px 14px',
                                        background: isActive ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : (isReview && !canOpen ? 'rgba(241,245,249,0.9)' : 'transparent'),
                                        color: isActive ? '#ffffff' : (isReview && !canOpen ? '#94a3b8' : '#334155'),
                                        fontWeight: 800,
                                        fontSize: 12,
                                        cursor: canOpen ? 'pointer' : 'not-allowed',
                                        opacity: canOpen ? 1 : 0.82
                                    }}
                                >
                                    {step.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {activeStep === 'map' && (
                        <>
                            <button
                                type="button"
                                onClick={onSaveIdea}
                                style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, background: 'rgba(255,255,255,0.94)', color: '#334155', width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(148,163,184,0.16)' }}
                                title="Save idea"
                            >
                                <Save size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={onImportIdea}
                                style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, background: 'rgba(255,255,255,0.94)', color: '#334155', width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(148,163,184,0.16)' }}
                                title="Import idea JSON"
                            >
                                <Upload size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={onExportIdea}
                                style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, background: 'rgba(255,255,255,0.94)', color: '#334155', width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(148,163,184,0.16)' }}
                                title="Export idea JSON"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => fitView({ padding: FIT_VIEW_PADDING, duration: 320 })}
                                style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, background: 'rgba(255,255,255,0.94)', color: '#334155', width: 38, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(148,163,184,0.16)' }}
                                title="Fit map"
                            >
                                <Scan size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={handleResetToStarter}
                                style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, background: 'rgba(255,255,255,0.94)', color: '#334155', padding: '0 12px', height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 12px 24px rgba(148,163,184,0.16)', fontWeight: 700, fontSize: 12 }}
                            >
                                <RotateCcw size={15} />
                                Load Starter
                            </button>
                            <button
                                type="button"
                                onClick={onClearCanvas}
                                style={{ border: '1px solid rgba(239,68,68,0.24)', borderRadius: 12, background: 'rgba(254,242,242,0.95)', color: '#b91c1c', padding: '0 12px', height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 12px 24px rgba(148,163,184,0.16)', fontWeight: 700, fontSize: 12 }}
                            >
                                <Trash2 size={15} />
                                Blank Canvas
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ position: 'absolute', top: contentInsetTop, left: compact ? 10 : 18, right: compact ? 10 : 18, bottom: compact ? 10 : 18, minHeight: 0, display: 'flex' }}>
                {activeStep === 'onboarding' ? (
                    <div style={{ flex: 1, minWidth: 0, minHeight: 0, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 22px 50px rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.84)', display: 'grid', gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: 0 }}>
                        <div className="os-thin-scroll" style={{ padding: compact ? 16 : 22, overflowY: 'auto', borderRight: compact ? 'none' : '1px solid rgba(148,163,184,0.16)' }}>
                            <div style={{ maxWidth: 760 }}>
                                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Step 0</div>
                                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>Find the right product direction first</div>
                                <div style={{ marginTop: 10, fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                                    Before building the ROFCO map, define the problem, the audience, and what kind of product this should become. Then we can generate a stronger starter graph instead of dropping you onto a blank canvas.
                                </div>
                            </div>

                            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Project name</label>
                                    <input
                                        value={ideaMetadata?.projectName || ''}
                                        onChange={(event) => onIdeaMetadataChange('projectName', event.target.value)}
                                        placeholder="Example: Creator Hub"
                                        style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#0f172a', background: '#fff' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Who is this for?</label>
                                    <input
                                        value={ideaMetadata?.audience || ''}
                                        onChange={(event) => onIdeaMetadataChange('audience', event.target.value)}
                                        placeholder="Example: solo founders, local businesses, creators"
                                        style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#0f172a', background: '#fff' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>What problem matters most?</label>
                                    <textarea
                                        value={ideaMetadata?.problemStatement || ''}
                                        onChange={(event) => onIdeaMetadataChange('problemStatement', event.target.value)}
                                        rows={4}
                                        placeholder="Describe the pain or friction clearly."
                                        style={{ width: '100%', resize: 'vertical', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#0f172a', background: '#fff' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>What should the user get at the end?</label>
                                    <textarea
                                        value={ideaMetadata?.desiredOutcome || ''}
                                        onChange={(event) => onIdeaMetadataChange('desiredOutcome', event.target.value)}
                                        rows={4}
                                        placeholder="Describe the useful outcome or transformation."
                                        style={{ width: '100%', resize: 'vertical', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#0f172a', background: '#fff' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>What kind of product is this?</label>
                                    <select
                                        value={ideaMetadata?.productGoal || 'workflow'}
                                        onChange={(event) => onIdeaMetadataChange('productGoal', event.target.value)}
                                        style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#0f172a', background: '#fff' }}
                                    >
                                        {PRODUCT_GOAL_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Ship target</label>
                                    <select
                                        value={ideaMetadata?.shipTarget || 'Web app'}
                                        onChange={(event) => onIdeaMetadataChange('shipTarget', event.target.value)}
                                        style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#0f172a', background: '#fff' }}
                                    >
                                        {['Web app', 'Mobile web', 'Desktop app', 'Internal tool', 'Prototype'].map((option) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: 11, fontWeight: 800, color: '#475569' }}>Reference URL</label>
                                    <input
                                        value={ideaMetadata?.referenceUrl || ''}
                                        onChange={(event) => onIdeaMetadataChange('referenceUrl', event.target.value)}
                                        placeholder="https://example.com"
                                        style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#0f172a', background: '#fff' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-start', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={onScrapeReferenceUrls}
                                    disabled={scrapeRunning || !canScrapeReferences}
                                    style={{ border: '1px solid rgba(15,118,110,0.28)', borderRadius: 14, background: (scrapeRunning || !canScrapeReferences) ? 'rgba(226,232,240,0.96)' : 'linear-gradient(135deg, #0f766e, #115e59)', color: (scrapeRunning || !canScrapeReferences) ? '#64748b' : '#fff', padding: '12px 16px', fontWeight: 800, fontSize: 13, opacity: (scrapeRunning || !canScrapeReferences) ? 0.82 : 1 }}
                                >
                                    {!canScrapeReferences ? 'Scrape Unavailable' : (scrapeRunning ? 'Scraping Reference...' : 'Fetch Design Inspiration')}
                                </button>
                            </div>

                            {scrapeRunning && (
                                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 12, border: '1px solid rgba(15,118,110,0.16)', background: 'rgba(240,253,250,0.92)', color: '#115e59', fontSize: 12, fontWeight: 700 }}>
                                    Scraping theme, fonts, palette, and flow...
                                </div>
                            )}

                            {!scrapeRunning && ideaMetadata?.scrapeError && (
                                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(254,242,242,0.95)', color: '#991b1b', fontSize: 12, lineHeight: 1.55 }}>
                                    {ideaMetadata.scrapeError}
                                </div>
                            )}

                            {!scrapeRunning && scrapeReady && (
                                <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                                    {[
                                        { key: 'theme', label: 'Theme', value: ideaMetadata?.designTheme || 'Not detected', accent: '#0f766e' },
                                        { key: 'fonts', label: 'Fonts', value: ideaMetadata?.fontDirection || 'Not detected', accent: '#7c3aed' },
                                        { key: 'palette', label: 'Palette', value: ideaMetadata?.colorPalette || 'Not detected', accent: '#ea580c' },
                                        { key: 'flow', label: 'Flow', value: ideaMetadata?.flowStructure || 'Not detected', accent: '#2563eb' }
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            style={{
                                                borderRadius: 16,
                                                border: `1px solid ${item.accent}22`,
                                                background: '#fff',
                                                padding: 12,
                                                boxShadow: '0 12px 24px rgba(148,163,184,0.08)'
                                            }}
                                        >
                                            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: item.accent }}>
                                                {item.label}
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                                                {item.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: 18 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 10 }}>Quick start examples</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {ONBOARDING_STARTER_EXAMPLES.map((example) => (
                                        <button
                                            key={example.key}
                                            type="button"
                                            onClick={() => onLoadOnboardingExample(example.metadata)}
                                            style={{ border: '1px solid rgba(148,163,184,0.22)', borderRadius: 999, background: 'rgba(255,255,255,0.95)', color: '#334155', padding: '9px 12px', fontSize: 12, fontWeight: 800 }}
                                        >
                                            {example.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={onApplyOnboardingTemplate}
                                    style={{ border: '1px solid rgba(37,99,235,0.28)', borderRadius: 14, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '12px 16px', fontWeight: 800, fontSize: 13 }}
                                >
                                    Use Recommended Setup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onStepChange('map')}
                                    style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, background: 'rgba(255,255,255,0.96)', color: '#334155', padding: '12px 16px', fontWeight: 800, fontSize: 13 }}
                                >
                                    Skip to Map
                                </button>
                            </div>
                        </div>

                        <div className="os-thin-scroll" style={{ padding: compact ? 16 : 22, overflowY: 'auto', background: 'linear-gradient(180deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.92) 100%)' }}>
                            <div style={{ borderRadius: 20, border: `1px solid ${recommendedLane.accent}33`, background: '#fff', padding: 18, boxShadow: '0 16px 36px rgba(148,163,184,0.12)' }}>
                                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: recommendedLane.accent }}>Recommended Lane</div>
                                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 42, height: 42, borderRadius: 14, background: `${recommendedLane.accent}15`, border: `1px solid ${recommendedLane.accent}30`, display: 'grid', placeItems: 'center' }}>
                                        <RecommendedLaneIcon size={20} color={recommendedLane.accent} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 19, fontWeight: 900, color: '#0f172a' }}>{recommendedLane.label}</div>
                                        <div style={{ marginTop: 4, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{recommendedLane.summary}</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 14, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                    {recommendedLane.helper}
                                </div>
                                <div style={{ marginTop: 14, borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(248,250,252,0.82)', padding: 12 }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                                        Auto Role + Stack
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
                                        {inferredRoleProfile.title}
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                        {inferredRoleProfile.details}
                                    </div>
                                </div>
                                <div style={{ marginTop: 14, borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(248,250,252,0.82)', padding: 12 }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                                        Why this lane
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {recommendationReasons.map((reason) => (
                                            <div key={reason} style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                                                - {reason}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginTop: 14, borderRadius: 16, border: scrapeReady ? '1px solid rgba(15,118,110,0.2)' : '1px solid rgba(148,163,184,0.18)', background: 'rgba(248,250,252,0.82)', padding: 12 }}>
                                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: 8 }}>
                                        Scraped Inspiration
                                    </div>
                                    {scrapeReady ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                                <strong>Theme:</strong> {ideaMetadata?.designTheme || 'Not detected'}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                                <strong>Fonts:</strong> {ideaMetadata?.fontDirection || 'Not detected'}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                                <strong>Palette:</strong> {ideaMetadata?.colorPalette || 'Not detected'}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                                <strong>Flow:</strong> {ideaMetadata?.flowStructure || 'Not detected'}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                                            Add one reference URL, then run scrape to extract theme, typography direction, colour palette, and page flow structure.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                                {IDEA_LANES.map((lane) => {
                                    const Icon = lane.icon;
                                    const isActive = lane.key === recommendedLane.key;
                                    return (
                                        <button
                                            key={lane.key}
                                            type="button"
                                            onClick={() => onIdeaMetadataChange('laneKey', lane.key)}
                                            style={{
                                                textAlign: 'left',
                                                border: isActive ? `1px solid ${lane.accent}40` : '1px solid rgba(148,163,184,0.18)',
                                                borderRadius: 18,
                                                background: isActive ? `linear-gradient(135deg, ${lane.accent}14, rgba(255,255,255,0.96))` : 'rgba(255,255,255,0.94)',
                                                padding: 14,
                                                display: 'flex',
                                                gap: 12,
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            <div style={{ width: 38, height: 38, borderRadius: 14, background: `${lane.accent}15`, border: `1px solid ${lane.accent}28`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                                <Icon size={18} color={lane.accent} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{lane.label}</div>
                                                <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{lane.summary}</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : activeStep === 'map' ? (
                    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'grid', gridTemplateColumns: compact ? '1fr' : '320px minmax(0, 1fr)', gap: compact ? 0 : 14 }}>
                        {(!compact || panelOpen) && (
                            <aside className="os-thin-scroll" style={{
                                position: compact ? 'absolute' : 'relative',
                                left: compact ? 0 : 'auto',
                                top: compact ? 0 : 'auto',
                                bottom: compact ? 0 : 'auto',
                                zIndex: compact ? 24 : 'auto',
                                width: compact ? 'min(82vw, 320px)' : 'auto',
                                minHeight: 0,
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(244,248,253,0.97) 100%)',
                                border: '1px solid rgba(148,163,184,0.22)',
                                borderRadius: compact ? 18 : 24,
                                boxShadow: compact ? '0 22px 50px rgba(148,163,184,0.22)' : '0 14px 36px rgba(148,163,184,0.12)',
                                padding: compact ? 14 : 16,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                overflowY: 'auto'
                            }}>
                                {compact && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="button" onClick={onClosePanel} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: '#fff', color: '#334155', width: 30, height: 30 }}>
                                            <PanelLeft size={12} />
                                        </button>
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                    {completenessSummary.map((item) => (
                                        <div key={item.type} style={{ borderRadius: 14, padding: '10px 12px', background: item.complete ? 'rgba(220,252,231,0.95)' : 'rgba(255,255,255,0.95)', color: item.complete ? '#166534' : '#334155', border: item.complete ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(148,163,184,0.2)' }}>
                                            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.76 }}>{item.complete ? 'Ready' : 'Missing'}</div>
                                            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800 }}>{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {importedLegacy && (
                                    <div style={{ borderRadius: 16, border: '1px solid rgba(234,88,12,0.24)', background: 'rgba(255,237,213,0.9)', padding: 12, fontSize: 11, color: '#9a3412', lineHeight: 1.55 }}>
                                        Legacy builder data was imported as a starting graph. Review custom nodes and fill in missing ROFCO sections before copying the prompt.
                                    </div>
                                )}

                                {warnings.length > 0 && (
                                    <div style={{ borderRadius: 16, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(254,242,242,0.95)', padding: 12 }}>
                                        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b91c1c', marginBottom: 8 }}>
                                            Prompt Warnings
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {warnings.map((warning) => (
                                                <div key={warning} style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.45 }}>
                                                    {warning}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{ borderRadius: 18, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(255,255,255,0.96)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569' }}>
                                        Project Metadata
                                    </div>
                                    <input
                                        value={ideaMetadata?.projectName || ''}
                                        onChange={(event) => onIdeaMetadataChange('projectName', event.target.value)}
                                        placeholder="Project name"
                                        style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                    />
                                    <input
                                        value={ideaMetadata?.audience || ''}
                                        onChange={(event) => onIdeaMetadataChange('audience', event.target.value)}
                                        placeholder="Audience or market"
                                        style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                        <select
                                            value={ideaMetadata?.status || 'Draft'}
                                            onChange={(event) => onIdeaMetadataChange('status', event.target.value)}
                                            style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                        >
                                            {['Draft', 'Scoping', 'Ready to build', 'In progress'].map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={ideaMetadata?.shipTarget || 'Web app'}
                                            onChange={(event) => onIdeaMetadataChange('shipTarget', event.target.value)}
                                            style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                        >
                                            {['Web app', 'Mobile web', 'Desktop app', 'Internal tool', 'Prototype'].map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ borderRadius: 18, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(255,255,255,0.96)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                                        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569' }}>
                                            Selected Node
                                        </div>
                                        {selectedNode && (
                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                                                {NODE_CATALOG[selectedNode.type]?.label || selectedNode.type}
                                            </div>
                                        )}
                                    </div>
                                    {selectedNode ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, padding: '10px 12px', borderRadius: 12, background: 'rgba(248,250,252,0.94)', border: '1px solid rgba(148,163,184,0.18)' }}>
                                                {NODE_EDITOR_HELPERS[selectedNode.type] || 'Keep this note specific so the generated prompt stays clear.'}
                                            </div>
                                            <input
                                                value={selectedNode.data?.title || ''}
                                                onChange={(event) => handleSelectedFieldChange('title', event.target.value)}
                                                placeholder="Node title"
                                                style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                            />
                                            <textarea
                                                value={selectedNode.data?.details || ''}
                                                onChange={(event) => handleSelectedFieldChange('details', event.target.value)}
                                                rows={6}
                                                placeholder="More detail for this section"
                                                style={{ width: '100%', resize: 'vertical', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                            />
                                            {selectedNode.type === 'feature' && (
                                                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                                                    Priority
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={selectedNode.data?.priority || 1}
                                                        onChange={(event) => handleSelectedFieldChange('priority', event.target.value)}
                                                        style={{ width: '100%', border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                                    />
                                                </label>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleDeleteSelected}
                                                style={{ border: '1px solid rgba(239,68,68,0.24)', borderRadius: 12, background: 'rgba(254,226,226,0.92)', color: '#b91c1c', padding: '10px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                                            >
                                                Delete Selected
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ border: '1px dashed rgba(148,163,184,0.42)', borderRadius: 16, background: 'rgba(248,250,252,0.84)', padding: 12, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                                            Click a node to edit it. Use `Delete` or `Backspace` to remove the selected node.
                                        </div>
                                    )}
                                </div>
                            </aside>
                        )}

                        <div style={{ minWidth: 0, minHeight: 0, display: 'grid', gridTemplateRows: 'minmax(0, 1fr)' }}>
                            <div ref={wrapperRef} style={{ minHeight: 0, minWidth: 0, display: 'flex' }}>
                                <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.24)', background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(241,245,249,0.92) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 16px 36px rgba(148,163,184,0.16)' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: compact ? '12px 14px' : '14px 16px', background: 'linear-gradient(180deg, rgba(248,250,252,0.94) 0%, rgba(248,250,252,0.72) 100%)', borderBottom: '1px solid rgba(148,163,184,0.18)' }}>
                                        <div>
                                            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Logical Workspace</div>
                                            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Map the ROFCO graph</div>
                                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '4px 9px', background: `${recommendedLane.accent}14`, border: `1px solid ${recommendedLane.accent}24`, color: recommendedLane.accent, fontSize: 10, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                                    <RecommendedLaneIcon size={12} />
                                                    {recommendedLane.label}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.45 }}>
                                                    {starterPackPreview.helper}
                                                </div>
                                            </div>
                                        </div>
                                        {!isReadyForReview && (
                                            <div style={{ maxWidth: compact ? 180 : 260, fontSize: 11, color: '#475569', lineHeight: 1.45, textAlign: 'right' }}>
                                                Complete the required ROFCO nodes first, then review the generated prompt.
                                            </div>
                                        )}
                                    </div>

                                    <ReactFlow
                                        className="idea-to-prompt-flow"
                                        nodes={nodes}
                                        edges={edges}
                                        onNodesChange={onNodesChange}
                                        onEdgesChange={onEdgesChange}
                                        onConnect={onConnect}
                                        isValidConnection={(connection) => isValidSemanticConnection(connection, nodes)}
                                        onDrop={onDrop}
                                        onDragOver={onDragOver}
                                        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                                        onPaneClick={() => setSelectedNodeId(null)}
                                        nodeTypes={nodeTypes}
                                        edgeTypes={edgeTypes}
                                        fitView
                                    >
                                        <Controls style={{ marginTop: compact ? 58 : 64, border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, boxShadow: '0 12px 24px rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.94)', transform: compact ? 'scale(0.86)' : 'scale(1)', transformOrigin: 'top left' }} />
                                        <Background color="#cbd5e1" variant="dots" gap={20} size={2} />
                                    </ReactFlow>

                                    {!nodes.length && (
                                        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                                            <div style={{ width: 'min(500px, 88%)', borderRadius: 24, border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 42px rgba(148,163,184,0.18)', padding: 24, textAlign: 'center', color: '#334155' }}>
                                                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Step 1: map the idea</div>
                                                <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.6 }}>
                                                    Add the required sections first, then connect supporting notes around them. Prompt review comes after the map is complete.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 'map' && nodesTrayOpen && (
                                        <div style={{ position: 'absolute', left: compact ? 12 : 16, right: compact ? 12 : 16, bottom: compact ? 74 : 86, zIndex: 11, borderRadius: 22, border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.94)', boxShadow: '0 18px 42px rgba(148,163,184,0.2)', overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid rgba(148,163,184,0.16)', background: 'rgba(248,250,252,0.9)' }}>
                                                <div>
                                                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>Device-Type Selection</div>
                                                    <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{activeDock.label}</div>
                                                    <div style={{ marginTop: 4, fontSize: 11, color: '#64748b', lineHeight: 1.45 }}>{activeDock.helper}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onSetNodesTrayOpen(false)}
                                                    style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: '#fff', color: '#334155', width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Hide node picker details"
                                                >
                                                    <ChevronDown size={15} />
                                                </button>
                                            </div>

                                            <div style={{ padding: 14 }}>
                                                <div className="os-thin-scroll" style={{ maxHeight: compact ? 240 : 196, overflowY: 'auto' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                                        {dockTypes.map((type) => {
                                                            const definition = NODE_CATALOG[type];
                                                            const Icon = definition.icon;
                                                            const isRecommended = missingRequired.includes(type);
                                                            return (
                                                                <button
                                                                    key={type}
                                                                    type="button"
                                                                    draggable
                                                                    onDragStart={(event) => {
                                                                        event.dataTransfer.setData('application/reactflow', type);
                                                                        event.dataTransfer.effectAllowed = 'move';
                                                                    }}
                                                                    onClick={() => onQuickAddRequest(type)}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 10,
                                                                        padding: '12px',
                                                                        borderRadius: 16,
                                                                        border: isRecommended ? `1px solid ${definition.accent}55` : '1px solid rgba(148,163,184,0.2)',
                                                                        background: isRecommended ? `linear-gradient(135deg, ${definition.accent}18, rgba(255,255,255,0.96))` : 'rgba(255,255,255,0.96)',
                                                                        color: '#0f172a',
                                                                        boxShadow: isRecommended ? `0 12px 26px ${definition.accent}18` : '0 10px 20px rgba(148,163,184,0.1)',
                                                                        cursor: 'grab',
                                                                        textAlign: 'left'
                                                                    }}
                                                                >
                                                                    <div style={{ width: 34, height: 34, borderRadius: 12, background: `${definition.accent}18`, border: `1px solid ${definition.accent}30`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                                                        <Icon size={16} color={definition.accent} />
                                                                    </div>
                                                                    <div style={{ minWidth: 0 }}>
                                                                        <div style={{ fontSize: 12, fontWeight: 900 }}>
                                                                            {definition.label}{isRecommended ? ' (Next)' : ''}
                                                                        </div>
                                                                        <div style={{ marginTop: 3, fontSize: 10, color: '#64748b', lineHeight: 1.45 }}>
                                                                            {definition.description}
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 'map' && (
                                        <div style={{ position: 'absolute', left: '50%', bottom: compact ? 12 : 16, transform: 'translateX(-50%)', zIndex: 11, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 16px 36px rgba(148,163,184,0.18)' }}>
                                        {DOCK_GROUPS.map((group) => {
                                            const Icon = NODE_CATALOG[group.types[0]].icon;
                                            const isActive = group.key === activeDock.key;
                                            const pendingCount = group.types.filter((type) => missingRequired.includes(type)).length;
                                            return (
                                                <button
                                                    key={group.key}
                                                    type="button"
                                                    onClick={() => {
                                                        const isSameGroup = group.key === activeDock.key;
                                                        onDockGroupChange(group.key);
                                                        onSetNodesTrayOpen(isSameGroup ? !nodesTrayOpen : true);
                                                    }}
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 14,
                                                        border: isActive && nodesTrayOpen ? '1px solid rgba(37,99,235,0.28)' : '1px solid rgba(148,163,184,0.18)',
                                                        background: isActive && nodesTrayOpen ? 'linear-gradient(135deg, rgba(37,99,235,0.14), rgba(59,130,246,0.08))' : 'rgba(255,255,255,0.96)',
                                                        color: isActive && nodesTrayOpen ? '#1d4ed8' : '#334155',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative',
                                                        boxShadow: isActive && nodesTrayOpen ? '0 10px 24px rgba(37,99,235,0.14)' : 'none'
                                                    }}
                                                    title={`${group.label}${pendingCount ? ` - ${pendingCount} required missing` : ''}`}
                                                >
                                                    <Icon size={18} />
                                                    {pendingCount > 0 && (
                                                        <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center' }}>
                                                            {pendingCount}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        </div>
                                    )}

                                    <div style={{ position: 'absolute', right: compact ? 12 : 16, bottom: compact ? 12 : 16, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                        <button
                                            type="button"
                                            onClick={() => onStepChange('review')}
                                            style={{
                                                border: isReadyForReview ? '1px solid rgba(37,99,235,0.32)' : '1px solid rgba(148,163,184,0.24)',
                                                borderRadius: 14,
                                                background: isReadyForReview ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(255,255,255,0.96)',
                                                color: isReadyForReview ? '#ffffff' : '#334155',
                                                padding: '12px 16px',
                                                fontWeight: 800,
                                                fontSize: 12,
                                                boxShadow: isReadyForReview ? '0 14px 28px rgba(37,99,235,0.24)' : '0 12px 24px rgba(148,163,184,0.12)'
                                            }}
                                        >
                                            {isReadyForReview ? 'Generate Prompt Review' : 'Review Incomplete Prompt'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, minWidth: 0, minHeight: 0, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 22px 50px rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.84)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: compact ? '14px' : '18px', borderBottom: '1px solid rgba(148,163,184,0.18)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Step 2: Prompt Review</div>
                                <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                                    Review the structured brief, final prompt, or full builder handoff without leaving this screen.
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => onStepChange('map')} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, background: 'rgba(255,255,255,0.96)', color: '#334155', padding: '10px 12px', fontWeight: 800, fontSize: 12 }}>
                                    Back to Map
                                </button>
                                <button type="button" onClick={onRegeneratePrompt} style={{ border: '1px solid rgba(37,99,235,0.24)', borderRadius: 12, background: 'rgba(239,246,255,0.95)', color: '#1d4ed8', padding: '10px 12px', fontWeight: 800, fontSize: 12 }}>
                                    Regenerate
                                </button>
                                <button type="button" onClick={onCopyPrompt} style={{ border: '1px solid rgba(37,99,235,0.32)', borderRadius: 12, background: promptCopied ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', padding: '10px 14px', fontWeight: 800, fontSize: 12 }}>
                                    {promptCopied ? 'Copied' : 'Copy Prompt'}
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, padding: compact ? '12px 14px 0' : '14px 18px 0', flexWrap: 'wrap' }}>
                            {[
                                { key: 'summary', label: 'Summary', Icon: Eye },
                                { key: 'prompt', label: 'Prompt', Icon: FileText },
                                { key: 'handoff', label: 'Handoff', Icon: Package }
                            ].map((tab) => {
                                const isActive = reviewTab === tab.key;
                                const Icon = tab.Icon;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setReviewTab(tab.key)}
                                        style={{
                                            border: isActive ? '1px solid rgba(37,99,235,0.28)' : '1px solid rgba(148,163,184,0.2)',
                                            borderRadius: 12,
                                            background: isActive ? 'linear-gradient(135deg, rgba(37,99,235,0.14), rgba(59,130,246,0.08))' : 'rgba(255,255,255,0.92)',
                                            color: isActive ? '#1d4ed8' : '#334155',
                                            padding: '9px 12px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontWeight: 800,
                                            fontSize: 12
                                        }}
                                    >
                                        <Icon size={14} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ minHeight: 0, flex: 1, padding: compact ? '12px 14px 14px' : '14px 18px 18px' }}>
                            <div className="os-thin-scroll" style={{ height: '100%', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(248,250,252,0.72)', overflowY: 'auto', padding: compact ? 14 : 18, boxSizing: 'border-box' }}>
                                <div style={{ marginBottom: 14, borderRadius: 16, border: promptNeedsRegenerate ? '1px solid rgba(245,158,11,0.24)' : '1px solid rgba(148,163,184,0.18)', background: '#ffffff', padding: 12, fontSize: 12, color: promptNeedsRegenerate ? '#92400e' : '#475569', lineHeight: 1.55 }}>
                                    {promptNeedsRegenerate
                                        ? 'Map changed. Review is out of date. Regenerate to sync the latest meaning.'
                                        : promptDirty
                                            ? 'Prompt has wording edits. Use Prompt Only when you just need execution text.'
                                            : 'Review is synced. Use Builder Handoff when you need fuller project context.'}
                                </div>

                                {reviewTab === 'summary' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {REVIEW_SECTION_ORDER.map((sectionKey) => {
                                            const section = reviewSections[sectionKey];
                                            return (
                                                <div key={sectionKey} style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(255,255,255,0.96)', padding: 14 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                        <div>
                                                            <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{section.heading}</div>
                                                            <div style={{ marginTop: 4, fontSize: 11, color: section.complete ? '#166534' : '#b91c1c', fontWeight: 700 }}>
                                                                {section.sourceLabel}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => onJumpToNodeType(section.sourceType)}
                                                            style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: 'rgba(255,255,255,0.96)', color: '#334155', padding: '6px 9px', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                                        >
                                                            Edit in Map
                                                            <ChevronRight size={12} />
                                                        </button>
                                                    </div>
                                                    <div style={{ marginTop: 8, fontSize: 11, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: "'Courier New', monospace" }}>
                                                        {section.body}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {reviewTab === 'prompt' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>
                                        <div style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: '#ffffff', padding: 12, fontSize: 12, color: '#475569', lineHeight: 1.55 }}>
                                            `Prompt Only` exports just the final execution prompt for another AI coding assistant.
                                        </div>
                                        <textarea
                                            value={promptDraft}
                                            onChange={(event) => onPromptDraftChange(event.target.value)}
                                            spellCheck={false}
                                            style={{ width: '100%', minHeight: compact ? 420 : 520, border: '1px solid rgba(148,163,184,0.18)', outline: 'none', resize: 'vertical', borderRadius: 16, padding: 18, boxSizing: 'border-box', background: 'rgba(255,255,255,0.96)', color: '#0f172a', fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.72 }}
                                        />
                                    </div>
                                )}

                                {reviewTab === 'handoff' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: '#ffffff', padding: 12, fontSize: 12, color: '#475569', lineHeight: 1.55 }}>
                                            `Builder Handoff` bundles metadata, ROFCO summary, warnings, and the final prompt for a teammate or future session.
                                        </div>
                                        <div style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(255,255,255,0.96)', padding: 16, fontSize: 12, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: "'Courier New', monospace" }}>
                                            {buildHandoffPackMarkdown({
                                                idea: {
                                                    id: activeIdeaId,
                                                    name: activeIdeaName,
                                                    graph: { nodes, edges },
                                                    metadata: ideaMetadata
                                                },
                                                prompt: promptDraft || buildRoFcoPrompt(nodes),
                                                reviewSections,
                                                completenessSummary,
                                                warnings,
                                                generatedAt: 'preview'
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function IdeaCanvasWithProvider(props) {
    return (
        <ReactFlowProvider>
            <IdeaCanvas {...props} />
        </ReactFlowProvider>
    );
}

export default function IdeaToPromptApp() {
    const initialState = useMemo(() => loadStoredDocument(), []);
    const initialIdeas = useMemo(
        () => (Array.isArray(initialState.ideas) && initialState.ideas.length ? initialState.ideas : [createIdeaRecord({ name: 'Starter Idea' })]),
        [initialState]
    );
    const [ideas, setIdeas] = useState(initialIdeas);
    const [activeIdeaId, setActiveIdeaId] = useState(initialState.activeIdeaId || initialIdeas[0]?.id || null);
    const activeIdea = useMemo(
        () => ideas.find((idea) => idea.id === activeIdeaId) || ideas[0],
        [activeIdeaId, ideas]
    );
    const [nodes, setNodes, onNodesChange] = useNodesState(activeIdea?.graph?.nodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(activeIdea?.graph?.edges || []);
    const [selectedNodeId, setSelectedNodeId] = useState(activeIdea?.graph?.nodes?.[0]?.id || null);
    const [isCompact, setIsCompact] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 960 : false));
    const [panelOpen, setPanelOpen] = useState(() => !(typeof window !== 'undefined' ? window.innerWidth <= 960 : false));
    const [activeStep, setActiveStep] = useState('onboarding');
    const [quickAddType, setQuickAddType] = useState(null);
    const [promptDraft, setPromptDraft] = useState(activeIdea?.draftPrompt || '');
    const [promptDirty, setPromptDirty] = useState(Boolean(activeIdea?.promptDirty));
    const [promptCopied, setPromptCopied] = useState(false);
    const [nodesTrayOpen, setNodesTrayOpen] = useState(() => !(typeof window !== 'undefined' ? window.innerWidth <= 960 : false));
    const [activeDockGroup, setActiveDockGroup] = useState('core');
    const importedLegacy = Boolean(activeIdea?.importedLegacy);
    const [syncedGeneratedPrompt, setSyncedGeneratedPrompt] = useState(() => activeIdea?.syncedGeneratedPrompt || buildRoFcoPrompt(activeIdea?.graph?.nodes || []));
    const [ideaMetadata, setIdeaMetadata] = useState(() => ({
        ...DEFAULT_IDEA_METADATA,
        projectName: activeIdea?.name || 'Starter Idea',
        ...(activeIdea?.metadata || {})
    }));

    const generatedPrompt = useMemo(() => buildRoFcoPrompt(nodes), [nodes]);
    const reviewSections = useMemo(() => buildReviewSections(nodes), [nodes]);
    const nodesByType = useMemo(() => groupedNodesFromGraph(nodes), [nodes]);
    const completenessSummary = useMemo(() => buildCompletenessSummary(nodesByType), [nodesByType]);
    const warnings = useMemo(() => buildWarnings(completenessSummary), [completenessSummary]);
    const isReadyForReview = useMemo(() => completenessSummary.every((item) => item.complete), [completenessSummary]);
    const promptNeedsRegenerate = promptDirty && syncedGeneratedPrompt && syncedGeneratedPrompt !== generatedPrompt;

    useEffect(() => {
        const onResize = () => {
            const compact = window.innerWidth <= 960;
            setIsCompact(compact);
            if (!compact) setPanelOpen(true);
            if (!compact) setNodesTrayOpen(true);
        };

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (!promptDirty) {
            setPromptDraft(generatedPrompt);
            setSyncedGeneratedPrompt(generatedPrompt);
        }
    }, [generatedPrompt, promptDirty]);

    useEffect(() => {
        if (!activeIdea) return;
        setNodes(activeIdea.graph.nodes);
        setEdges(activeIdea.graph.edges);
        setPromptDraft(activeIdea.draftPrompt || '');
        setPromptDirty(Boolean(activeIdea.promptDirty));
        setSyncedGeneratedPrompt(activeIdea.syncedGeneratedPrompt || buildRoFcoPrompt(activeIdea.graph.nodes));
        setIdeaMetadata({
            ...DEFAULT_IDEA_METADATA,
            projectName: activeIdea.name || 'Idea',
            ...(activeIdea.metadata || {})
        });
        setSelectedNodeId(activeIdea.graph.nodes[0]?.id || null);
    }, [activeIdeaId, setEdges, setNodes]);

    useEffect(() => {
        if (!activeIdeaId) return;
        setIdeas((currentIdeas) => currentIdeas.map((idea) => (
            idea.id === activeIdeaId
                ? {
                    ...idea,
                    graph: { nodes, edges },
                    draftPrompt: promptDraft,
                    promptDirty,
                    syncedGeneratedPrompt,
                    metadata: ideaMetadata,
                    updatedAt: Date.now()
                }
                : idea
        )));
    }, [activeIdeaId, promptDraft, edges, ideaMetadata, nodes, promptDirty, syncedGeneratedPrompt]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: IDEAS_STORAGE_VERSION,
            ideas,
            activeIdeaId
        }));
    }, [activeIdeaId, ideas]);

    const handlePromptDraftChange = useCallback((value) => {
        setPromptDraft(value);
        setPromptDirty(value !== generatedPrompt);
    }, [generatedPrompt]);

    const handleRegeneratePrompt = useCallback(() => {
        setPromptDraft(generatedPrompt);
        setPromptDirty(false);
        setSyncedGeneratedPrompt(generatedPrompt);
    }, [generatedPrompt]);

    const handleCopyPrompt = useCallback(() => {
        navigator.clipboard.writeText(promptDraft || generatedPrompt);
        setPromptCopied(true);
        window.setTimeout(() => setPromptCopied(false), 1800);
    }, [generatedPrompt, promptDraft]);

    const handleSaveIdea = useCallback(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: IDEAS_STORAGE_VERSION,
            ideas,
            activeIdeaId
        }));
    }, [activeIdeaId, ideas]);

    const handleExportIdea = useCallback(() => {
        if (!activeIdea) return;
        const payload = serializeIdeaExport({
            ...activeIdea,
            graph: { nodes, edges },
            draftPrompt: promptDraft,
            promptDirty,
            syncedGeneratedPrompt
        });
        const filename = `${sanitizeFilenamePart(activeIdea.name, 'idea')}.kracked-idea.json`;
        downloadTextFile(filename, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    }, [activeIdea, edges, nodes, promptDraft, promptDirty, syncedGeneratedPrompt]);

    const handleExportPrompt = useCallback(() => {
        if (!activeIdea) return;
        const promptToExport = promptDraft || generatedPrompt;
        const filename = `${sanitizeFilenamePart(activeIdea.name, 'idea')}-prompt.md`;
        const content = `# ${activeIdea.name}\n\nGenerated from KRACKED_OS Idea to Prompt on ${new Date().toISOString()}.\n\n---\n\n\`\`\`text\n${promptToExport}\n\`\`\`\n`;
        downloadTextFile(filename, content, 'text/markdown;charset=utf-8');
    }, [activeIdea, generatedPrompt, promptDraft]);

    const handleExportHandoffPack = useCallback(() => {
        if (!activeIdea) return;
        const ideaForExport = {
            ...activeIdea,
            graph: { nodes, edges },
            metadata: ideaMetadata
        };
        const filename = `${sanitizeFilenamePart(activeIdea.name, 'idea')}-handoff-pack.md`;
        const content = buildHandoffPackMarkdown({
            idea: ideaForExport,
            prompt: promptDraft || generatedPrompt,
            reviewSections,
            completenessSummary,
            warnings,
            generatedAt: new Date().toISOString()
        });
        downloadTextFile(filename, content, 'text/markdown;charset=utf-8');
    }, [activeIdea, completenessSummary, edges, generatedPrompt, ideaMetadata, nodes, promptDraft, reviewSections, warnings]);

    const handleImportIdea = useCallback(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.onchange = async (event) => {
            const file = event.target?.files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                const importedIdea = normalizeImportedIdeaPayload(parsed);
                setIdeas((currentIdeas) => [importedIdea, ...currentIdeas]);
                setActiveIdeaId(importedIdea.id);
                setActiveStep('onboarding');
                setPanelOpen(!isCompact);
            } catch (error) {
                window.alert(error instanceof Error ? error.message : 'Failed to import idea file.');
            }
        };

        input.click();
    }, [isCompact]);

    const handleStepChange = useCallback((step) => {
        if (step === 'onboarding' || step === 'map' || step === 'review') {
            setActiveStep(step);
            if (step === 'review') setPanelOpen(true);
            return;
        }

        if (step.endsWith(':panel')) {
            setPanelOpen(true);
        }
    }, []);

    const handleJumpToNodeType = useCallback((nodeType) => {
        const selected = nodes.find((node) => node.type === nodeType) || null;
        setActiveStep('map');
        setPanelOpen(true);
        if (selected) {
            setSelectedNodeId(selected.id);
        }
    }, [nodes]);

    const handleSelectIdea = useCallback((ideaId) => {
        if (ideaId === activeIdeaId) return;
        setActiveIdeaId(ideaId);
        setActiveStep('map');
    }, [activeIdeaId]);

    const handleIdeaMetadataChange = useCallback((field, value) => {
        setIdeaMetadata((current) => ({
            ...current,
            [field]: value,
            ...(field === 'referenceUrl' ? EMPTY_SCRAPE_STATE : {})
        }));
    }, []);

    const handleLoadOnboardingExample = useCallback((nextMetadata) => {
        setIdeaMetadata((current) => ({
            ...DEFAULT_IDEA_METADATA,
            ...current,
            ...nextMetadata
        }));
    }, []);

    const handleScrapeReferenceUrls = useCallback(async () => {
        const referenceUrl = String(ideaMetadata?.referenceUrl || '').trim();

        if (!referenceUrl) {
            window.alert('Add a reference URL first.');
            return;
        }

        setIdeaMetadata((current) => ({
            ...current,
            scrapeStatus: 'loading',
            scrapeError: ''
        }));

        try {
            const result = await runReferenceScrape({ referenceUrl });
            setIdeaMetadata((current) => ({
                ...current,
                scrapeStatus: 'ready',
                scrapeError: '',
                scrapedAt: result?.fetchedAt || new Date().toISOString(),
                designTheme: result?.merged?.designTheme || '',
                fontDirection: result?.merged?.fontDirection || '',
                colorPalette: result?.merged?.colorPalette || '',
                flowStructure: result?.merged?.flowStructure || '',
                referenceSummary: buildReferenceSummary(result?.reference)
            }));
        } catch (error) {
            setIdeaMetadata((current) => ({
                ...current,
                ...EMPTY_SCRAPE_STATE,
                scrapeStatus: 'error',
                scrapeError: error instanceof Error ? error.message : 'Failed to scrape reference URL.'
            }));
        }
    }, [ideaMetadata]);

    const handleApplyOnboardingTemplate = useCallback(() => {
        const nextMetadata = {
            ...ideaMetadata,
            laneKey: recommendLaneKey(ideaMetadata)
        };
        const starter = buildStarterDocument(nextMetadata);
        setIdeaMetadata(nextMetadata);
        setNodes(starter.nodes);
        setEdges(starter.edges);
        setSelectedNodeId(starter.nodes[0]?.id || null);
        setPromptDirty(false);
        setActiveStep('map');
    }, [ideaMetadata, setEdges, setNodes]);

    const handleClearCanvas = useCallback(() => {
        if (!window.confirm('Clear all nodes and start with a blank canvas?')) return;
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
        setPromptDirty(false);
        setActiveStep('map');
    }, [setEdges, setNodes]);

    const handleCreateIdea = useCallback(() => {
        const nextName = window.prompt('Idea name', `Idea ${ideas.length + 1}`);
        if (!nextName) return;
        const nextIdea = createIdeaRecord({ name: nextName.trim() || `Idea ${ideas.length + 1}` });
        setIdeas((currentIdeas) => [nextIdea, ...currentIdeas]);
        setActiveIdeaId(nextIdea.id);
        setActiveStep('onboarding');
    }, [ideas.length]);

    const handleRenameIdea = useCallback(() => {
        if (!activeIdea) return;
        const nextName = window.prompt('Rename idea', activeIdea.name);
        if (!nextName) return;
        setIdeas((currentIdeas) => currentIdeas.map((idea) => (
            idea.id === activeIdea.id
                ? { ...idea, name: nextName.trim() || activeIdea.name, updatedAt: Date.now() }
                : idea
        )));
    }, [activeIdea]);

    const handleDeleteIdea = useCallback(() => {
        if (!activeIdea) return;
        const confirmed = window.confirm(`Delete "${activeIdea.name}" from local cache?`);
        if (!confirmed) return;
        setIdeas((currentIdeas) => {
            const remaining = currentIdeas.filter((idea) => idea.id !== activeIdea.id);
            if (remaining.length) {
                setActiveIdeaId(remaining[0].id);
                return remaining;
            }
            const fallbackIdea = createIdeaRecord({ name: 'Starter Idea' });
            setActiveIdeaId(fallbackIdea.id);
            return [fallbackIdea];
        });
        setActiveStep('map');
    }, [activeIdea]);

    return (
        <IdeaCanvasWithProvider
            compact={isCompact}
            panelOpen={panelOpen}
            onClosePanel={() => setPanelOpen(false)}
            activeStep={activeStep}
            onStepChange={handleStepChange}
            quickAddType={quickAddType}
            onQuickAddRequest={setQuickAddType}
            onQuickAddConsumed={() => setQuickAddType(null)}
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            setNodes={setNodes}
            onNodesChange={onNodesChange}
            setEdges={setEdges}
            onEdgesChange={onEdgesChange}
            completenessSummary={completenessSummary}
            warnings={warnings}
            promptDraft={promptDraft}
            onPromptDraftChange={handlePromptDraftChange}
            onRegeneratePrompt={handleRegeneratePrompt}
            onResetPrompt={handleRegeneratePrompt}
            promptDirty={promptDirty}
            promptCopied={promptCopied}
            onCopyPrompt={handleCopyPrompt}
            importedLegacy={importedLegacy}
            ideaMetadata={ideaMetadata}
            onIdeaMetadataChange={handleIdeaMetadataChange}
            onScrapeReferenceUrls={handleScrapeReferenceUrls}
            onApplyOnboardingTemplate={handleApplyOnboardingTemplate}
            onLoadOnboardingExample={handleLoadOnboardingExample}
            reviewSections={reviewSections}
            isReadyForReview={isReadyForReview}
            promptNeedsRegenerate={promptNeedsRegenerate}
            onJumpToNodeType={handleJumpToNodeType}
            ideas={ideas}
            activeIdeaId={activeIdeaId}
            activeIdeaName={activeIdea?.name || 'Idea'}
            onSelectIdea={handleSelectIdea}
            onCreateIdea={handleCreateIdea}
            onRenameIdea={handleRenameIdea}
            onDeleteIdea={handleDeleteIdea}
            onSaveIdea={handleSaveIdea}
            onExportIdea={handleExportIdea}
            onExportPrompt={handleExportPrompt}
            onExportHandoffPack={handleExportHandoffPack}
            onImportIdea={handleImportIdea}
            onClearCanvas={handleClearCanvas}
            activeDockGroup={activeDockGroup}
            onDockGroupChange={setActiveDockGroup}
            nodesTrayOpen={nodesTrayOpen}
            onSetNodesTrayOpen={setNodesTrayOpen}
        />
    );
}
