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
    ChevronUp,
    Copy,
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
    Target,
    Trash2,
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
        description: 'Define the AI persona and embed the preferred tech stack here.'
    },
    objective: {
        label: 'Objective',
        icon: Target,
        color: '#fde68a',
        accent: '#d97706',
        description: 'State the business problem the app must solve.'
    },
    target_user: {
        label: 'Target User',
        icon: Users,
        color: '#bfdbfe',
        accent: '#2563eb',
        description: 'Describe who the product is for and what context they are in.'
    },
    feature: {
        label: 'Feature',
        icon: Sparkles,
        color: '#bbf7d0',
        accent: '#16a34a',
        description: 'List one must-have product capability per node.'
    },
    constraint: {
        label: 'Constraint',
        icon: ShieldCheck,
        color: '#fecaca',
        accent: '#dc2626',
        description: 'Guardrails, limitations, and non-negotiables.'
    },
    output: {
        label: 'Output',
        icon: FileText,
        color: '#fbcfe8',
        accent: '#db2777',
        description: 'Define how the AI should respond and what to deliver.'
    },
    reference: {
        label: 'Reference',
        icon: Lightbulb,
        color: '#fde68a',
        accent: '#ca8a04',
        description: 'Competitor, inspiration, or benchmark product.'
    },
    unique_value: {
        label: 'Unique Value',
        icon: Wand2,
        color: '#fdba74',
        accent: '#ea580c',
        description: 'What makes this idea meaningfully different.'
    },
    flow: {
        label: 'Flow',
        icon: GitBranch,
        color: '#ddd6fe',
        accent: '#7c3aed',
        description: 'Important sequence, build order, or user flow notes.'
    },
    custom: {
        label: 'Custom Note',
        icon: StickyNote,
        color: '#e2e8f0',
        accent: '#475569',
        description: 'Any extra context that should be attached to the final prompt.'
    }
};

const REQUIRED_TYPES = ['role', 'objective', 'target_user', 'feature', 'constraint', 'output'];
const OPTIONAL_TYPES = ['reference', 'unique_value', 'flow', 'custom'];
const REVIEW_SECTION_ORDER = ['role', 'objective', 'features', 'constraints', 'output'];
const EDGE_TYPE = 'orthogonal';
const FIT_VIEW_PADDING = 0.28;

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

const CONNECTION_RULES = {
    role: [{ target: 'objective', family: 'main' }],
    target_user: [{ target: 'objective', family: 'main' }],
    objective: [{ target: 'feature', family: 'main' }],
    feature: [{ target: 'output', family: 'main' }],
    constraint: [{ target: 'output', family: 'support' }],
    unique_value: [{ target: 'output', family: 'support' }],
    flow: [{ target: 'output', family: 'support' }],
    custom: [{ target: 'output', family: 'support' }],
    reference: [{ target: 'objective', family: 'support' }]
};

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
    const primaryOffset = family === 'main' ? 52 : 40;
    const secondaryOffset = family === 'main' ? 38 : 30;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;

    if ((sourcePosition === Position.Bottom && targetPosition === Position.Top) || (sourcePosition === Position.Top && targetPosition === Position.Bottom)) {
        const sourceDirection = sourcePosition === Position.Bottom ? 1 : -1;
        const targetDirection = targetPosition === Position.Top ? -1 : 1;
        const exitY = sourceY + sourceDirection * primaryOffset;
        const entryY = targetY + targetDirection * primaryOffset;
        const midY = Math.abs(dy) > 140 ? (exitY + entryY) / 2 : exitY;
        return `M ${sourceX} ${sourceY} L ${sourceX} ${exitY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${entryY} L ${targetX} ${targetY}`;
    }

    if ((sourcePosition === Position.Right && targetPosition === Position.Left) || (sourcePosition === Position.Left && targetPosition === Position.Right)) {
        const sourceDirection = sourcePosition === Position.Right ? 1 : -1;
        const targetDirection = targetPosition === Position.Left ? -1 : 1;
        const exitX = sourceX + sourceDirection * primaryOffset;
        const entryX = targetX + targetDirection * primaryOffset;
        const midX = Math.abs(dx) > 180 ? (exitX + entryX) / 2 : exitX;
        return `M ${sourceX} ${sourceY} L ${exitX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${entryX} ${targetY} L ${targetX} ${targetY}`;
    }

    if (sourcePosition === Position.Bottom && targetPosition === Position.Left) {
        const exitY = sourceY + primaryOffset;
        const entryX = targetX - secondaryOffset;
        const bridgeY = Math.abs(dy) > 120 ? exitY : sourceY + primaryOffset * 0.7;
        return `M ${sourceX} ${sourceY} L ${sourceX} ${exitY} L ${entryX} ${exitY} L ${entryX} ${targetY} L ${targetX} ${targetY}`;
    }

    if (sourcePosition === Position.Bottom && targetPosition === Position.Right) {
        const exitY = sourceY + primaryOffset;
        const entryX = targetX + secondaryOffset;
        const bridgeY = Math.abs(dy) > 120 ? exitY : sourceY + primaryOffset * 0.7;
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

    return <BaseEdge id={id} path={path} style={style} />;
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

const createIdeaNode = (type, position, overrides = {}) => {
    const definition = NODE_CATALOG[type];
    return {
        id: overrides.id || `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        position,
        data: {
            title: overrides.title || definition.label,
            details: overrides.details || '',
            priority: overrides.priority || (type === 'feature' ? 1 : 1),
            required: REQUIRED_TYPES.includes(type),
            ...overrides.data
        }
    };
};

const buildStarterDocument = () => {
    const nodes = [
        createIdeaNode('target_user', { x: 20, y: 190 }, { id: 'starter-user', title: 'Solo builders and beginner founders', details: 'People who know the problem they want to solve but struggle to structure the build brief clearly.' }),
        createIdeaNode('role', { x: 380, y: 10 }, { id: 'starter-role', title: 'Senior Fullstack Engineer', details: 'Use React + Vite + Supabase. Think mobile-first, ship complete code, and prefer boring reliable solutions.' }),
        createIdeaNode('objective', { x: 380, y: 230 }, { id: 'starter-objective', title: 'Help solo founders turn ideas into build-ready specs', details: 'The app should convert messy thoughts into a clean prompt that an AI coding assistant can execute.' }),
        createIdeaNode('feature', { x: 820, y: 130 }, { id: 'starter-feature-1', title: 'Structured idea graph', details: 'Let users map problem, user, features, constraints, and output requirements visually.', priority: 1 }),
        createIdeaNode('feature', { x: 820, y: 430 }, { id: 'starter-feature-2', title: 'Editable master prompt', details: 'Generate a ROFCO prompt automatically, but allow manual edits before copying.', priority: 2 }),
        createIdeaNode('constraint', { x: 360, y: 520 }, { id: 'starter-constraint', title: 'Keep the shell unchanged', details: 'Do not redesign the macOS-like shell. Scope is app behavior and workflow only.' }),
        createIdeaNode('unique_value', { x: 1290, y: 40 }, { id: 'starter-uv', title: 'Graph becomes source of truth', details: 'The prompt should stay aligned with what was captured visually, not a disconnected form.' }),
        createIdeaNode('output', { x: 1280, y: 250 }, { id: 'starter-output', title: 'Produce a ROFCO master prompt', details: 'Return a clear build brief with Role, Objective, Features, Constraints, and Output instructions.' }),
        createIdeaNode('custom', { x: 1290, y: 490 }, { id: 'starter-custom', title: 'Custom Note', details: 'Any extra context that should be attached to the final prompt.' })
    ];

    const byId = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const edges = [
        buildEdgePayload(byId['starter-user'], byId['starter-objective'], { id: 'e-user-objective' }),
        buildEdgePayload(byId['starter-role'], byId['starter-objective'], { id: 'e-role-objective' }),
        buildEdgePayload(byId['starter-objective'], byId['starter-feature-1'], { id: 'e-objective-feature-1' }),
        buildEdgePayload(byId['starter-objective'], byId['starter-feature-2'], { id: 'e-objective-feature-2' }),
        buildEdgePayload(byId['starter-feature-1'], byId['starter-output'], { id: 'e-feature-output' }),
        buildEdgePayload(byId['starter-constraint'], byId['starter-output'], { id: 'e-constraint-output' }),
        buildEdgePayload(byId['starter-uv'], byId['starter-output'], { id: 'e-uv-output' }),
        buildEdgePayload(byId['starter-custom'], byId['starter-output'], { id: 'e-custom-output' })
    ].filter(Boolean);

    return { nodes, edges };
};

const createIdeaRecord = ({
    name = 'New Idea',
    graph = buildStarterDocument(),
    draftPrompt = '',
    promptDirty = false,
    syncedGeneratedPrompt = '',
    importedLegacy = false
} = {}) => ({
    id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    graph,
    draftPrompt,
    promptDirty,
    syncedGeneratedPrompt: syncedGeneratedPrompt || buildRoFcoPrompt(graph.nodes),
    importedLegacy,
    updatedAt: Date.now()
});

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
    nodesTrayOpen,
    onToggleNodesTray
}) {
    const { screenToFlowPosition, fitView } = useReactFlow();
    const wrapperRef = useRef(null);
    const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;

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
        const starter = buildStarterDocument();
        setNodes(starter.nodes);
        setEdges(starter.edges);
        setSelectedNodeId(starter.nodes[0]?.id || null);
        window.setTimeout(() => fitView({ padding: FIT_VIEW_PADDING, duration: 320 }), 0);
    }, [fitView, setEdges, setNodes, setSelectedNodeId]);

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
    const guidedTypes = [...missingRequired, ...OPTIONAL_TYPES];

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)' }}>
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
                    <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 12px 24px rgba(148,163,184,0.12)', fontSize: 11, fontWeight: 700, color: '#475569' }}>
                        {activeIdeaName} saved in cache
                    </div>
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
                    {activeStep === 'review' && (
                        <button
                            type="button"
                            onClick={onCopyPrompt}
                            style={{ border: '1px solid rgba(37,99,235,0.32)', borderRadius: 12, background: promptCopied ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', padding: '0 14px', height: 38, display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 12, boxShadow: '0 14px 28px rgba(37,99,235,0.24)' }}
                        >
                            {promptCopied ? <Check size={15} /> : <Copy size={15} />}
                            {promptCopied ? 'Copied' : 'Copy Prompt'}
                        </button>
                    )}
                </div>
            </div>

            {(!compact || panelOpen) && (
                <aside className="os-thin-scroll" style={{
                    position: 'absolute',
                    left: compact ? 0 : 18,
                    top: compact ? 0 : 78,
                    bottom: compact ? 0 : 18,
                    zIndex: 24,
                    width: compact ? 'min(78vw, 300px)' : 310,
                    background: 'rgba(255,255,255,0.92)',
                    border: '1px solid rgba(148,163,184,0.24)',
                    borderRadius: compact ? 0 : 20,
                    boxShadow: '0 22px 50px rgba(148,163,184,0.18)',
                    padding: compact ? 14 : 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Idea to Prompt</div>
                            <div style={{ marginTop: 4, fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                                Build the map first. Prompt review comes after this and only refines wording from the map.
                            </div>
                        </div>
                        {compact && (
                            <button type="button" onClick={onClosePanel} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: 'rgba(255,255,255,0.92)', color: '#334155', width: 28, height: 28 }}>
                                <PanelLeft size={12} />
                            </button>
                        )}
                    </div>

                    {importedLegacy && (
                        <div style={{ borderRadius: 16, border: '1px solid rgba(234,88,12,0.24)', background: 'rgba(255,237,213,0.9)', padding: 12, fontSize: 11, color: '#9a3412', lineHeight: 1.55 }}>
                            Legacy Mind Map data was imported as a starting graph. Review custom nodes and fill in missing ROFCO sections before copying the prompt.
                        </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {completenessSummary.map((item) => (
                            <div key={item.type} style={{ borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800, background: item.complete ? 'rgba(220,252,231,0.95)' : 'rgba(254,226,226,0.95)', color: item.complete ? '#166534' : '#b91c1c', border: item.complete ? '1px solid rgba(22,163,74,0.18)' : '1px solid rgba(239,68,68,0.18)' }}>
                                {item.complete ? 'Ready' : 'Missing'} {item.label}
                            </div>
                        ))}
                    </div>

                    <div style={{ border: '1px solid rgba(148,163,184,0.2)', borderRadius: 18, background: 'rgba(255,255,255,0.92)', padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569', marginBottom: 10 }}>
                            Selected Node
                        </div>
                        {selectedNode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
                                    {NODE_CATALOG[selectedNode.type]?.label || selectedNode.type}
                                </div>
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
                                    rows={4}
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

                    {warnings.length > 0 && (
                        <div style={{ borderRadius: 18, border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(254,242,242,0.95)', padding: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b91c1c', marginBottom: 8 }}>
                                Prompt Warnings
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {warnings.map((warning) => (
                                    <div key={warning} style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.45 }}>
                                        {warning}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            )}

            <div ref={wrapperRef} style={{ flex: 1, minWidth: 0, minHeight: 0, padding: compact ? '58px 10px 10px' : '78px 18px 18px', display: 'flex' }}>
                {activeStep === 'map' ? (
                    <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 22px 50px rgba(148,163,184,0.16)' }}>
                        <ReactFlow
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
                            <Controls style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 14, boxShadow: '0 12px 24px rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.94)', transform: compact ? 'scale(0.86)' : 'scale(1)', transformOrigin: 'top left' }} />
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
                        <div style={{ position: 'absolute', right: compact ? 10 : 16, bottom: compact ? 10 : 16, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            {!isReadyForReview && (
                                <div style={{ maxWidth: 320, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(148,163,184,0.22)', boxShadow: '0 12px 24px rgba(148,163,184,0.12)', fontSize: 11, lineHeight: 1.55, color: '#475569' }}>
                                    Complete the required ROFCO nodes first, then review the generated prompt.
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => onStepChange('review')}
                                style={{
                                    border: isReadyForReview ? '1px solid rgba(37,99,235,0.32)' : '1px solid rgba(148,163,184,0.24)',
                                    borderRadius: 14,
                                    background: isReadyForReview ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(255,255,255,0.94)',
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
                        <div style={{ position: 'absolute', left: compact ? 10 : 16, right: compact ? 10 : 16, bottom: compact ? 10 : 16, zIndex: 11, pointerEvents: 'none' }}>
                            <div style={{ pointerEvents: 'auto', borderRadius: 20, border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.92)', boxShadow: '0 18px 42px rgba(148,163,184,0.18)', overflow: 'hidden' }}>
                                <button
                                    type="button"
                                    onClick={onToggleNodesTray}
                                    style={{ width: '100%', border: 'none', background: 'rgba(248,250,252,0.94)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f172a', fontWeight: 800, fontSize: 12 }}
                                >
                                    <span>Guided Nodes</span>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', fontWeight: 700 }}>
                                        {guidedTypes.length} available
                                        {nodesTrayOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                                    </span>
                                </button>
                                {nodesTrayOpen && (
                                    <div className="os-thin-scroll" style={{ padding: 12, maxHeight: compact ? 188 : 170, overflowY: 'auto' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                                            {guidedTypes.map((type) => {
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
                                                            padding: '10px 12px',
                                                            borderRadius: 14,
                                                            border: isRecommended ? `1px solid ${definition.accent}55` : '1px solid rgba(148,163,184,0.24)',
                                                            background: isRecommended ? `${definition.accent}12` : 'rgba(255,255,255,0.94)',
                                                            color: '#0f172a',
                                                            boxShadow: '0 10px 22px rgba(148,163,184,0.12)',
                                                            cursor: 'grab',
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        <div style={{ width: 30, height: 30, borderRadius: 12, background: `${definition.accent}18`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                                            <Icon size={15} color={definition.accent} />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 800 }}>
                                                                {definition.label}{isRecommended ? ' (Next)' : ''}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.45 }}>
                                                                {definition.description}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, minWidth: 0, minHeight: 0, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 22px 50px rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.84)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: compact ? '14px' : '18px', borderBottom: '1px solid rgba(148,163,184,0.18)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Step 2: Review the ROFCO</div>
                                <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                                    This review is derived from the map. Change meaning in the map, then regenerate here if needed.
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => onStepChange('map')} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, background: 'rgba(255,255,255,0.96)', color: '#334155', padding: '10px 12px', fontWeight: 800, fontSize: 12 }}>
                                    Back to Map
                                </button>
                                <button type="button" onClick={onRegeneratePrompt} style={{ border: '1px solid rgba(37,99,235,0.24)', borderRadius: 12, background: 'rgba(239,246,255,0.95)', color: '#1d4ed8', padding: '10px 12px', fontWeight: 800, fontSize: 12 }}>
                                    Regenerate
                                </button>
                                <button type="button" onClick={onResetPrompt} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 12, background: 'rgba(255,255,255,0.96)', color: '#334155', padding: '10px 12px', fontWeight: 800, fontSize: 12 }}>
                                    Sync Back to Generated
                                </button>
                                <button type="button" onClick={onCopyPrompt} style={{ border: '1px solid rgba(37,99,235,0.32)', borderRadius: 12, background: promptCopied ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', padding: '10px 14px', fontWeight: 800, fontSize: 12 }}>
                                    {promptCopied ? 'Copied' : 'Copy Prompt'}
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '280px 1fr', gap: 0, minHeight: 0, flex: 1 }}>
                            <div className="os-thin-scroll" style={{ borderRight: compact ? 'none' : '1px solid rgba(148,163,184,0.18)', borderBottom: compact ? '1px solid rgba(148,163,184,0.18)' : 'none', background: 'rgba(248,250,252,0.92)', padding: 16, overflowY: 'auto' }}>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 12 }}>
                                    Derived Review
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {REVIEW_SECTION_ORDER.map((sectionKey) => {
                                        const section = reviewSections[sectionKey];
                                        return (
                                            <div key={sectionKey} style={{ borderRadius: 14, border: '1px solid rgba(148,163,184,0.18)', background: '#ffffff', padding: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{section.heading.replace(/[\[\]]/g, '')}</div>
                                                        <div style={{ marginTop: 4, fontSize: 11, color: section.complete ? '#166534' : '#b91c1c', fontWeight: 700 }}>
                                                            {section.complete ? section.sourceLabel : section.sourceLabel}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => onJumpToNodeType(section.sourceType)}
                                                        style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: 'rgba(255,255,255,0.96)', color: '#334155', padding: '6px 9px', fontSize: 10, fontWeight: 800 }}
                                                    >
                                                        Edit in Map
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ marginTop: 16, borderRadius: 16, border: promptNeedsRegenerate ? '1px solid rgba(245,158,11,0.24)' : '1px solid rgba(148,163,184,0.18)', background: '#ffffff', padding: 12, fontSize: 12, color: promptNeedsRegenerate ? '#92400e' : '#475569', lineHeight: 1.55 }}>
                                    {promptNeedsRegenerate
                                        ? 'Map changed. Prompt review is now out of date. Regenerate to sync.'
                                        : promptDirty
                                            ? 'Prompt has wording edits, but the current review still matches the latest map structure.'
                                            : 'Prompt review is synced to the current map.'}
                                </div>
                            </div>
                            <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                                <div className="os-thin-scroll" style={{ padding: 18, borderBottom: '1px solid rgba(148,163,184,0.18)', background: 'rgba(248,250,252,0.66)', overflowY: 'auto', maxHeight: compact ? 220 : 270 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {REVIEW_SECTION_ORDER.map((sectionKey) => {
                                            const section = reviewSections[sectionKey];
                                            return (
                                                <div key={sectionKey} style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(255,255,255,0.95)', padding: 14 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                                                        <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>{section.heading}</div>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: section.complete ? '#166534' : '#b91c1c' }}>
                                                            {section.sourceCount} source node{section.sourceCount === 1 ? '' : 's'}
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: 8, fontSize: 11, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: "'Courier New', monospace" }}>
                                                        {section.body}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <textarea
                                    value={promptDraft}
                                    onChange={(event) => onPromptDraftChange(event.target.value)}
                                    spellCheck={false}
                                    style={{ width: '100%', minHeight: 0, flex: 1, border: 'none', outline: 'none', resize: 'none', padding: 18, boxSizing: 'border-box', background: 'rgba(255,255,255,0.88)', color: '#0f172a', fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.72 }}
                                />
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
    const [activeStep, setActiveStep] = useState('map');
    const [quickAddType, setQuickAddType] = useState(null);
    const [promptDraft, setPromptDraft] = useState(activeIdea?.draftPrompt || '');
    const [promptDirty, setPromptDirty] = useState(Boolean(activeIdea?.promptDirty));
    const [promptCopied, setPromptCopied] = useState(false);
    const [nodesTrayOpen, setNodesTrayOpen] = useState(() => !(typeof window !== 'undefined' ? window.innerWidth <= 960 : false));
    const importedLegacy = Boolean(activeIdea?.importedLegacy);
    const [syncedGeneratedPrompt, setSyncedGeneratedPrompt] = useState(() => activeIdea?.syncedGeneratedPrompt || buildRoFcoPrompt(activeIdea?.graph?.nodes || []));

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
                    updatedAt: Date.now()
                }
                : idea
        )));
    }, [activeIdeaId, promptDraft, edges, nodes, promptDirty, syncedGeneratedPrompt]);

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

    const handleStepChange = useCallback((step) => {
        if (step === 'map' || step === 'review') {
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

    const handleCreateIdea = useCallback(() => {
        const nextName = window.prompt('Idea name', `Idea ${ideas.length + 1}`);
        if (!nextName) return;
        const nextIdea = createIdeaRecord({ name: nextName.trim() || `Idea ${ideas.length + 1}` });
        setIdeas((currentIdeas) => [nextIdea, ...currentIdeas]);
        setActiveIdeaId(nextIdea.id);
        setActiveStep('map');
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
            nodesTrayOpen={nodesTrayOpen}
            onToggleNodesTray={() => setNodesTrayOpen((open) => !open)}
        />
    );
}
