import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Lightbulb, Layers, Layout, ServerCog, Database } from 'lucide-react';

const BaseNode = ({ id, label, icon: Icon, color, children, selected = false }) => (
    <div style={{
        background: color,
        border: selected ? '3px solid #2563eb' : '3px solid #0b1220',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: selected ? '0 0 0 4px rgba(37,99,235,0.16), 6px 6px 0px #0b1220' : '6px 6px 0px #0b1220',
        minWidth: '160px',
        fontFamily: 'monospace',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        color: '#0b1220'
    }}>
        <div style={{
            background: '#fff',
            borderRadius: '50%',
            padding: '8px',
            border: selected ? '3px solid #2563eb' : '3px solid #0b1220',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 2px 0px #0b1220'
        }}>
            <Icon size={24} strokeWidth={2.5} color="#0b1220" />
        </div>
        <div style={{ fontWeight: 900, fontSize: '13px', textAlign: 'center', marginTop: '4px' }}>
            {label}
        </div>
        {children}
    </div>
);

const handleBaseStyle = { background: '#0b1220', width: '12px', height: '12px', border: '2px solid white' };
const omniHandles = (isConnectable) => (
    <>
        <Handle type="target" position={Position.Top} id="in-top" isConnectable={isConnectable} style={{ ...handleBaseStyle, top: '-8px', left: '36%' }} />
        <Handle type="source" position={Position.Top} id="out-top" isConnectable={isConnectable} style={{ ...handleBaseStyle, top: '-8px', left: '64%' }} />
        <Handle type="target" position={Position.Right} id="in-right" isConnectable={isConnectable} style={{ ...handleBaseStyle, right: '-8px', top: '36%' }} />
        <Handle type="source" position={Position.Right} id="out-right" isConnectable={isConnectable} style={{ ...handleBaseStyle, right: '-8px', top: '64%' }} />
        <Handle type="target" position={Position.Bottom} id="in-bottom" isConnectable={isConnectable} style={{ ...handleBaseStyle, bottom: '-8px', left: '36%' }} />
        <Handle type="source" position={Position.Bottom} id="out-bottom" isConnectable={isConnectable} style={{ ...handleBaseStyle, bottom: '-8px', left: '64%' }} />
        <Handle type="target" position={Position.Left} id="in-left" isConnectable={isConnectable} style={{ ...handleBaseStyle, left: '-8px', top: '36%' }} />
        <Handle type="source" position={Position.Left} id="out-left" isConnectable={isConnectable} style={{ ...handleBaseStyle, left: '-8px', top: '64%' }} />
    </>
);

export const CoreProblemNode = ({ data, isConnectable, selected }) => (
    <BaseNode id="core_problem" label={data.label || 'CORE PROBLEM'} icon={Lightbulb} color="#fca5a5" selected={selected}>
        {omniHandles(isConnectable)}
    </BaseNode>
);

export const CoreFeatureNode = ({ data, isConnectable, selected }) => (
    <BaseNode id="core_feature" label={data.label || 'MVP FEATURE'} icon={Layers} color="#fef08a" selected={selected}>
        {omniHandles(isConnectable)}
    </BaseNode>
);

export const FrontendNode = ({ data, isConnectable, selected }) => (
    <BaseNode id="frontend" label={data.label || 'UI / FRONTEND'} icon={Layout} color="#bfdbfe" selected={selected}>
        {omniHandles(isConnectable)}
    </BaseNode>
);

export const BackendNode = ({ data, isConnectable, selected }) => (
    <BaseNode id="backend" label={data.label || 'LOGIC / BACKEND'} icon={ServerCog} color="#bbf7d0" selected={selected}>
        {omniHandles(isConnectable)}
    </BaseNode>
);

export const DatabaseNode = ({ data, isConnectable, selected }) => (
    <BaseNode id="database" label={data.label || 'DATA / STORAGE'} icon={Database} color="#e9d5ff" selected={selected}>
        {omniHandles(isConnectable)}
    </BaseNode>
);
