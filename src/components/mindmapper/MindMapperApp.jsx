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
import { PanelLeft } from 'lucide-react';
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

const FlowCanvas = ({ compact = false, quickAddType = null, onQuickAddConsumed = null }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { screenToFlowPosition } = useReactFlow();
    const wrapperRef = useRef(null);

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

            const labels = {
                core_problem: 'WHAT IS THE PROBLEM?',
                core_feature: 'HOW TO SOLVE IT?',
                frontend: 'UI COMPONENT',
                backend: 'SERVER LOGIC',
                database: 'DATA SCHEMA'
            };

            const newNode = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: { label: labels[type] || type.toUpperCase() },
            };

            setNodes((nds) => nds.concat(newNode));
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
        const labels = {
            core_problem: 'WHAT IS THE PROBLEM?',
            core_feature: 'HOW TO SOLVE IT?',
            frontend: 'UI COMPONENT',
            backend: 'SERVER LOGIC',
            database: 'DATA SCHEMA'
        };
        const newNode = {
            id: `${quickAddType}-${Date.now()}`,
            type: quickAddType,
            position,
            data: { label: labels[quickAddType] || quickAddType.toUpperCase() },
        };
        setNodes((nds) => nds.concat(newNode));
        onQuickAddConsumed?.();
    }, [quickAddType, onQuickAddConsumed, screenToFlowPosition, setNodes]);

    return (
        <div ref={wrapperRef} style={{ flex: 1, position: 'relative', background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
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
            {!isCompact && <MindMapperSidebar onQuickAdd={setQuickAddType} />}
            {isCompact && panelOpen && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 25 }}>
                    <MindMapperSidebar compact onClose={() => setPanelOpen(false)} onQuickAdd={setQuickAddType} />
                </div>
            )}
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
                <FlowCanvas compact={isCompact} quickAddType={quickAddType} onQuickAddConsumed={() => setQuickAddType(null)} />
            </ReactFlowProvider>
        </div>
    );
}
