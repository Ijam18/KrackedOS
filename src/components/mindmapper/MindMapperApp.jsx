import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
    useReactFlow
} from '@xyflow/react';
import { PanelLeft, Plus, Scan } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import MindMapperSidebar from './MindMapperSidebar';
import { CoreProblemNode, CoreFeatureNode, FrontendNode, BackendNode, DatabaseNode } from './MindMapperNodes';

const nodeTypes = {
    core_problem: CoreProblemNode,
    core_feature: CoreFeatureNode,
    frontend: FrontendNode,
    backend: BackendNode,
    database: DatabaseNode,
};

const initialNodes = [];
const initialEdges = [];
const STORAGE_KEY = 'kracked_mindmapper_v1';

const NODE_LABELS = {
    core_problem: 'WHAT IS THE PROBLEM?',
    core_feature: 'HOW TO SOLVE IT?',
    frontend: 'UI COMPONENT',
    backend: 'SERVER LOGIC',
    database: 'DATA SCHEMA'
};

const buildStarterMap = () => {
    const baseX = 280;
    const baseY = 210;
    return {
        nodes: [
            { id: 'starter-problem', type: 'core_problem', position: { x: baseX, y: baseY }, data: { label: 'WHAT IS THE MAIN USER PROBLEM?' } },
            { id: 'starter-feature', type: 'core_feature', position: { x: baseX + 290, y: baseY }, data: { label: 'WHAT IS THE SIMPLEST MVP FEATURE?' } },
            { id: 'starter-frontend', type: 'frontend', position: { x: baseX + 610, y: baseY - 130 }, data: { label: 'WHAT SCREEN / UI IS NEEDED?' } },
            { id: 'starter-backend', type: 'backend', position: { x: baseX + 610, y: baseY }, data: { label: 'WHAT LOGIC / API IS NEEDED?' } },
            { id: 'starter-database', type: 'database', position: { x: baseX + 610, y: baseY + 130 }, data: { label: 'WHAT DATA MUST BE STORED?' } }
        ],
        edges: [
            { id: 'starter-e1', source: 'starter-problem', target: 'starter-feature', animated: true, style: { strokeWidth: 3, stroke: '#f5d000' } },
            { id: 'starter-e2', source: 'starter-feature', target: 'starter-frontend', animated: true, style: { strokeWidth: 3, stroke: '#f5d000' } },
            { id: 'starter-e3', source: 'starter-feature', target: 'starter-backend', animated: true, style: { strokeWidth: 3, stroke: '#f5d000' } },
            { id: 'starter-e4', source: 'starter-feature', target: 'starter-database', animated: true, style: { strokeWidth: 3, stroke: '#f5d000' } }
        ]
    };
};

const FlowCanvas = ({ compact = false, panelOpen = true, onClosePanel = null, quickAddType = null, onQuickAddRequest = null, onQuickAddConsumed = null }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(() => {
        if (typeof window === 'undefined') return initialNodes;
        try {
            const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
            return Array.isArray(saved.nodes) ? saved.nodes : initialNodes;
        } catch {
            return initialNodes;
        }
    });
    const [edges, setEdges, onEdgesChange] = useEdgesState(() => {
        if (typeof window === 'undefined') return initialEdges;
        try {
            const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
            return Array.isArray(saved.edges) ? saved.edges : initialEdges;
        } catch {
            return initialEdges;
        }
    });
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const { screenToFlowPosition, fitView } = useReactFlow();
    const wrapperRef = useRef(null);

    const selectedNode = nodes.find((node) => node.id === selectedNodeId) || null;

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { strokeWidth: 3, stroke: '#f5d000' } }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: { label: NODE_LABELS[type] || type.toUpperCase() },
            };

            setNodes((nds) => nds.concat(newNode));
            setSelectedNodeId(newNode.id);
        },
        [screenToFlowPosition, setNodes],
    );

    useEffect(() => {
        if (!quickAddType || !wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const position = screenToFlowPosition({
            x: rect.left + rect.width * 0.5,
            y: rect.top + rect.height * 0.45,
        });
        const newNode = {
            id: `${quickAddType}-${Date.now()}`,
            type: quickAddType,
            position,
            data: { label: NODE_LABELS[quickAddType] || quickAddType.toUpperCase() },
        };
        setNodes((nds) => nds.concat(newNode));
        setSelectedNodeId(newNode.id);
        onQuickAddConsumed?.();
    }, [quickAddType, onQuickAddConsumed, screenToFlowPosition, setNodes]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    }, [edges, nodes]);

    useEffect(() => {
        const handleDelete = (event) => {
            const target = event.target;
            const tagName = target?.tagName?.toLowerCase?.() || '';
            if (target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName)) return;
            if ((event.key !== 'Delete' && event.key !== 'Backspace') || !selectedNodeId) return;
            event.preventDefault();
            setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
            setSelectedNodeId(null);
        };
        window.addEventListener('keydown', handleDelete);
        return () => window.removeEventListener('keydown', handleDelete);
    }, [selectedNodeId, setEdges, setNodes]);

    const handleReset = useCallback(() => {
        const starter = buildStarterMap();
        setNodes(starter.nodes);
        setEdges(starter.edges);
        setSelectedNodeId(starter.nodes[0]?.id || null);
        window.setTimeout(() => fitView({ padding: 0.18, duration: 300 }), 0);
    }, [fitView, setEdges, setNodes]);

    const handleSelectedLabelChange = useCallback((nextLabel) => {
        setNodes((nds) => nds.map((node) => (
            node.id === selectedNodeId
                ? { ...node, data: { ...node.data, label: nextLabel } }
                : node
        )));
    }, [selectedNodeId, setNodes]);

    const handleDeleteSelected = useCallback(() => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
        setSelectedNodeId(null);
    }, [selectedNodeId, setEdges, setNodes]);

    return (
        <div ref={wrapperRef} style={{ flex: 1, position: 'relative', background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)', display: 'flex' }}>
            <div style={{ position: 'absolute', top: compact ? 10 : 20, right: compact ? 10 : 20, zIndex: 10, display: 'flex', gap: '8px' }}>
                <button
                    type="button"
                    onClick={() => {
                        const starter = buildStarterMap();
                        if (!nodes.length) {
                            setNodes(starter.nodes);
                            setEdges(starter.edges);
                            setSelectedNodeId(starter.nodes[0]?.id || null);
                        } else {
                            fitView({ padding: 0.18, duration: 300 });
                        }
                    }}
                    style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: '12px', background: 'rgba(255,255,255,0.94)', color: '#334155', width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(148,163,184,0.16)' }}
                    title="Fit map"
                >
                    <Scan size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onQuickAddRequest?.('core_feature');
                    }}
                    style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: '12px', background: 'rgba(255,255,255,0.94)', color: '#334155', width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(148,163,184,0.16)' }}
                    title="Quick add feature"
                >
                    <Plus size={16} />
                </button>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onPaneClick={() => setSelectedNodeId(null)}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: '14px', boxShadow: '0 12px 24px rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.94)', transform: compact ? 'scale(0.86)' : 'scale(1)', transformOrigin: 'top left' }} />
                <Background color="#cbd5e1" variant="dots" gap={20} size={2} />
            </ReactFlow>
            <div style={{ position: 'absolute', top: compact ? 10 : 20, left: compact ? 10 : 20, zIndex: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.94)', color: '#0f172a', padding: compact ? '8px 10px' : '12px 18px', borderRadius: '14px', fontWeight: 700, border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 12px 24px rgba(148,163,184,0.16)', fontSize: compact ? 10 : 12, maxWidth: compact ? '74vw' : 'none' }}>
                    1. IDENTIFY PROBLEM {'->'} 2. BRANCH TO FEATURES {'->'} 3. DECONSTRUCT TECH STACK
                </div>
            </div>
            {!nodes.length && (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ width: 'min(480px, 86%)', borderRadius: '22px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.9)', boxShadow: '0 18px 42px rgba(148,163,184,0.18)', padding: '24px', textAlign: 'center', color: '#334155' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Start with your main problem</div>
                        <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: 1.6 }}>
                            Drag a node from the sidebar, click a block to add it fast, or use the reset button to load a starter map.
                        </div>
                    </div>
                </div>
            )}
            <div style={{ position: 'absolute', left: compact ? 10 : 20, bottom: compact ? 10 : 20, zIndex: 10, pointerEvents: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.94)', color: '#475569', padding: '8px 12px', borderRadius: '12px', fontWeight: 700, border: '1px solid rgba(148,163,184,0.24)', boxShadow: '0 12px 24px rgba(148,163,184,0.12)', fontSize: '11px' }}>
                    Tip: select a node to rename or delete it.
                </div>
            </div>
            {(!compact || panelOpen) && (
                <div style={{ position: 'absolute', left: compact ? 0 : 20, top: compact ? 0 : 76, bottom: compact ? 0 : 'auto', zIndex: 24, width: compact ? 'min(76vw, 260px)' : 280 }}>
                    <MindMapperSidebar
                        compact={compact}
                        onClose={compact ? onClosePanel : null}
                        selectedNode={selectedNode}
                        onSelectedLabelChange={handleSelectedLabelChange}
                        onDeleteSelected={handleDeleteSelected}
                        onReset={handleReset}
                        onQuickAdd={onQuickAddRequest}
                        nodeCount={nodes.length}
                    />
                </div>
            )}
        </div>
    );
};

export default function MindMapperApp() {
    const [isCompact, setIsCompact] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 900 : false));
    const [panelOpen, setPanelOpen] = useState(() => !(typeof window !== 'undefined' ? window.innerWidth <= 900 : false));
    const [quickAddType, setQuickAddType] = useState(null);

    useEffect(() => {
        const onResize = () => {
            const compact = window.innerWidth <= 900;
            setIsCompact(compact);
            if (!compact) setPanelOpen(true);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)' }}>
            {isCompact && !panelOpen && (
                <button
                    type="button"
                    onClick={() => setPanelOpen(true)}
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
            <ReactFlowProvider>
                <FlowCanvas
                    compact={isCompact}
                    panelOpen={panelOpen}
                    onClosePanel={() => setPanelOpen(false)}
                    quickAddType={quickAddType}
                    onQuickAddRequest={setQuickAddType}
                    onQuickAddConsumed={() => setQuickAddType(null)}
                />
            </ReactFlowProvider>
        </div>
    );
}
