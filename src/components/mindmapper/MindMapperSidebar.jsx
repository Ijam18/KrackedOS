import React from 'react';
import { Lightbulb, Layers, Layout, ServerCog, Database, RotateCcw, Trash2, X } from 'lucide-react';

const NODE_TYPES = [
    { type: 'core_problem', label: 'Core Problem', icon: Lightbulb, color: '#fca5a5' },
    { type: 'core_feature', label: 'MVP Feature', icon: Layers, color: '#fef08a' },
    { type: 'frontend', label: 'UI / Frontend', icon: Layout, color: '#bfdbfe' },
    { type: 'backend', label: 'Logic / Backend', icon: ServerCog, color: '#bbf7d0' },
    { type: 'database', label: 'Data / Storage', icon: Database, color: '#e9d5ff' },
];

export default function MindMapperSidebar({
    compact = false,
    onClose = null,
    onQuickAdd = null,
    selectedNode = null,
    onSelectedLabelChange = null,
    onDeleteSelected = null,
    onReset = null,
    nodeCount = 0
}) {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="os-thin-scroll" style={{
            width: compact ? 'min(76vw, 260px)' : '280px',
            background: 'rgba(255,255,255,0.88)',
            borderRight: '1px solid rgba(148,163,184,0.24)',
            boxShadow: '0 16px 40px rgba(148,163,184,0.16)',
            padding: compact ? '14px' : '24px',
            color: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            gap: compact ? '10px' : '16px',
            overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <h3 style={{ fontSize: compact ? '13px' : '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    MVP Components
                </h3>
                {compact && onClose && (
                    <button type="button" onClick={onClose} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: 'rgba(255,255,255,0.92)', color: '#334155', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} />
                    </button>
                )}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Drag these concepts onto the canvas. Map your biggest problem into 1-3 core features. Deconstruct each feature into its tech stack.
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                    type="button"
                    onClick={onReset}
                    style={{
                        border: '1px solid rgba(148,163,184,0.24)',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.92)',
                        color: '#334155',
                        padding: '8px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <RotateCcw size={13} />
                    Reset
                </button>
                <div style={{ padding: '8px 10px', borderRadius: '12px', background: 'rgba(248,250,252,0.92)', border: '1px solid rgba(148,163,184,0.18)', fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                    {nodeCount} node{nodeCount === 1 ? '' : 's'}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '8px' : '12px', marginTop: compact ? '6px' : '12px' }}>
                {NODE_TYPES.map((node) => {
                    const Icon = node.icon;
                    return (
                        <div
                            key={node.type}
                            onDragStart={(event) => onDragStart(event, node.type)}
                            onClick={() => onQuickAdd?.(node.type)}
                            draggable
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: compact ? '8px' : '12px',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 100%)',
                                border: '1px solid rgba(148,163,184,0.24)',
                                borderRadius: '16px',
                                padding: compact ? '9px' : '12px',
                                cursor: 'grab',
                                color: '#0f172a',
                                fontWeight: 700,
                                fontSize: compact ? '11px' : '13px',
                                transition: 'all 0.2s',
                                boxShadow: '0 12px 24px rgba(148,163,184,0.14)'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 30px rgba(96,165,250,0.18)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translate(0)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(148,163,184,0.14)'; }}
                        >
                            <div style={{ width: compact ? 28 : 34, height: compact ? 28 : 34, borderRadius: 12, background: `${node.color}22`, border: `1px solid ${node.color}55`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                <Icon size={compact ? 14 : 18} strokeWidth={2.2} color="#334155" />
                            </div>
                            {node.label}
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: compact ? '6px' : '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', letterSpacing: '0.06em' }}>
                    SELECTED NODE
                </div>
                {selectedNode ? (
                    <div style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: '16px', background: 'rgba(255,255,255,0.92)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                            {selectedNode.type.replaceAll('_', ' ').toUpperCase()}
                        </div>
                        <textarea
                            value={selectedNode.data?.label || ''}
                            onChange={(event) => onSelectedLabelChange?.(event.target.value)}
                            rows={3}
                            placeholder="Rename this node"
                            style={{
                                width: '100%',
                                resize: 'vertical',
                                border: '1px solid rgba(148,163,184,0.24)',
                                borderRadius: '12px',
                                padding: '10px 12px',
                                fontSize: '12px',
                                color: '#0f172a',
                                background: '#fff',
                                boxSizing: 'border-box'
                            }}
                        />
                        <button
                            type="button"
                            onClick={onDeleteSelected}
                            style={{
                                border: '1px solid rgba(239,68,68,0.24)',
                                borderRadius: '12px',
                                background: 'rgba(254,226,226,0.9)',
                                color: '#b91c1c',
                                padding: '9px 10px',
                                fontSize: '11px',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            <Trash2 size={13} />
                            Delete Selected
                        </button>
                    </div>
                ) : (
                    <div style={{ border: '1px dashed rgba(148,163,184,0.4)', borderRadius: '16px', background: 'rgba(248,250,252,0.84)', padding: '12px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                        Click a node to rename or delete it. Tip: press `Delete` / `Backspace` to remove the selected node.
                    </div>
                )}
            </div>
        </aside>
    );
}
