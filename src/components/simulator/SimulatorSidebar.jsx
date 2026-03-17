import React from 'react';
import { Laptop, Brain, Github, Cloud, Database, BarChart3, Globe, Smartphone, X } from 'lucide-react';

const NODE_TYPES = [
    { type: 'laptop', label: 'Dev Machine', icon: Laptop, color: '#f8fafc' },
    { type: 'ai', label: 'AI Brain', icon: Brain, color: '#e2e8f0' },
    { type: 'browser', label: 'Localhost UI', icon: Globe, color: '#c7d2fe' },
    { type: 'github', label: 'GitHub Repo', icon: Github, color: '#fef08a' },
    { type: 'vercel', label: 'Vercel Edge', icon: Cloud, color: '#86efac' },
    { type: 'supabase', label: 'Supabase Auth/DB', icon: Database, color: '#fca5a5' },
    { type: 'analytics', label: 'Web Analytics', icon: BarChart3, color: '#fcd34d' },
    { type: 'public_user', label: 'Public Audience', icon: Smartphone, color: '#d8b4fe' },
];

export default function SimulatorSidebar({ compact = false, onClose = null, onQuickAdd = null }) {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="os-thin-scroll" style={{
            width: compact ? 'min(76vw, 250px)' : '260px',
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
                    Devices & Servers
                </h3>
                {compact && onClose && (
                    <button type="button" onClick={onClose} style={{ border: '1px solid rgba(148,163,184,0.24)', borderRadius: 10, background: 'rgba(255,255,255,0.92)', color: '#334155', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} />
                    </button>
                )}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Drag these nodes onto the canvas to construct your architecture. Connect them to simulate data flow.
            </p>

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
        </aside>
    );
}
