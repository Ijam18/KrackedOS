import React, { useEffect, useMemo, useRef, useState } from 'react';

const WindowFrame = ({
  winState,
  title,
  AppIcon,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  children,
  mobileMode = false,
  mobileInset = '58px 8px 14px 8px',
  mobileMaxInset = '48px 0px 74px 0px'
}) => {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const mobileInsets = useMemo(() => ([
    '102px 16px 148px 16px',
    '82px 12px 116px 12px',
    mobileInset
  ]), [mobileInset]);
  const [mobileInsetIndex, setMobileInsetIndex] = useState(2);

  useEffect(() => {
    if (mobileMode) return () => {};

    const onMM = (e) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.sx;
        const dy = e.clientY - dragRef.current.sy;
        if (frameRef.current) {
          frameRef.current.style.left = `${dragRef.current.wx + dx}px`;
          frameRef.current.style.top = `${dragRef.current.wy + dy}px`;
        }
      }

      if (resizeRef.current) {
        const { edge, sx, sy, ow, oh } = resizeRef.current;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        let nw = ow;
        let nh = oh;
        if (edge.includes('e')) nw = Math.max(320, ow + dx);
        if (edge.includes('s')) nh = Math.max(220, oh + dy);
        if (edge.includes('w')) nw = Math.max(320, ow - dx);
        if (edge.includes('n')) nh = Math.max(220, oh - dy);
        if (frameRef.current) {
          if (edge.includes('e') || edge.includes('w')) frameRef.current.style.width = `${nw}px`;
          if (edge.includes('s') || edge.includes('n')) frameRef.current.style.height = `${nh}px`;
        }
      }
    };

    const onMU = (e) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.sx;
        const dy = e.clientY - dragRef.current.sy;
        onMove(dragRef.current.wx + dx, dragRef.current.wy + dy);
        dragRef.current = null;
      }

      if (resizeRef.current) {
        const { edge, sx, sy, ow, oh } = resizeRef.current;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        let nw = ow;
        let nh = oh;
        if (edge.includes('e')) nw = Math.max(320, ow + dx);
        if (edge.includes('s')) nh = Math.max(220, oh + dy);
        if (edge.includes('w')) nw = Math.max(320, ow - dx);
        if (edge.includes('n')) nh = Math.max(220, oh - dy);
        if (onResize) onResize(nw, nh);
        resizeRef.current = null;
      }
    };

    document.addEventListener('mousemove', onMM);
    document.addEventListener('mouseup', onMU);
    return () => {
      document.removeEventListener('mousemove', onMM);
      document.removeEventListener('mouseup', onMU);
    };
  }, [mobileMode, onMove, onResize]);

  useEffect(() => {
    setMobileInsetIndex(2);
  }, [mobileInset]);

  if (!winState?.isOpen || winState?.isMinimized) return null;
  const isMax = Boolean(winState.isMaximized);

  const boxStyle = mobileMode
    ? {
      position: 'absolute',
      inset: isMax ? mobileMaxInset : (mobileInsets[mobileInsetIndex] || mobileInset),
      zIndex: winState.zIndex,
      borderRadius: isMax ? '0px' : '18px'
    }
    : isMax
      ? { position: 'absolute', inset: '28px 0 0 0', zIndex: winState.zIndex, borderRadius: 0 }
      : { position: 'absolute', left: winState.x, top: winState.y, width: winState.w, height: winState.h, zIndex: winState.zIndex, borderRadius: '10px' };

  const resizeHandles = [
    { edge: 'e', style: { right: 0, top: '8px', width: '6px', height: 'calc(100% - 16px)', cursor: 'ew-resize' } },
    { edge: 's', style: { bottom: 0, left: '8px', height: '6px', width: 'calc(100% - 16px)', cursor: 'ns-resize' } },
    { edge: 'w', style: { left: 0, top: '8px', width: '6px', height: 'calc(100% - 16px)', cursor: 'ew-resize' } },
    { edge: 'n', style: { top: 0, left: '8px', height: '6px', width: 'calc(100% - 16px)', cursor: 'ns-resize' } },
    { edge: 'se', style: { right: 0, bottom: 0, width: '14px', height: '14px', cursor: 'nwse-resize' } },
    { edge: 'sw', style: { left: 0, bottom: 0, width: '14px', height: '14px', cursor: 'nesw-resize' } },
    { edge: 'ne', style: { right: 0, top: 0, width: '14px', height: '14px', cursor: 'nesw-resize' } },
    { edge: 'nw', style: { left: 0, top: 0, width: '14px', height: '14px', cursor: 'nwse-resize' } }
  ];

  return (
    <div
      ref={frameRef}
      onMouseDown={onFocus}
      style={{ ...boxStyle, display: 'flex', flexDirection: 'column', background: '#111827', overflow: 'hidden', boxShadow: '0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)' }}
    >
      <div
        onMouseDown={(e) => {
          if (isMax || mobileMode) return;
          e.stopPropagation();
          dragRef.current = { sx: e.clientX, sy: e.clientY, wx: winState.x, wy: winState.y };
        }}
        onDoubleClick={onMaximize}
        style={{ background: '#f5d000', padding: '7px 12px', display: 'flex', alignItems: 'center', cursor: (isMax || mobileMode) ? 'default' : 'grab', userSelect: 'none', flexShrink: 0, position: 'relative', borderBottom: '2px solid rgba(0,0,0,0.15)' }}
      >
        <div style={{ display: 'flex', gap: '6px', zIndex: 1 }}>
          {[['#ef4444', 'x', onClose], ['#f59e0b', '-', onMinimize], ['#22c55e', isMax ? '+' : 'o', onMaximize]].map(([bg, sym, fn]) => (
            <button
              key={`${bg}-${sym}`}
              onClick={(e) => { e.stopPropagation(); fn(); }}
              style={{ width: 13, height: 13, borderRadius: '50%', background: bg, border: '1px solid rgba(0,0,0,0.2)', cursor: 'pointer', fontSize: '8px', color: mobileMode ? '#111827' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontWeight: 900, transition: 'color 0.1s' }}
              onMouseEnter={(e) => { if (!mobileMode) e.currentTarget.style.color = '#000'; }}
              onMouseLeave={(e) => { if (!mobileMode) e.currentTarget.style.color = 'transparent'; }}
            >
              {sym}
            </button>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', fontFamily: 'monospace', fontWeight: 900, fontSize: '13px', color: '#0b1220', pointerEvents: 'none' }}>
          {AppIcon && <AppIcon size={14} />}
          {title}
        </div>
        {mobileMode && !isMax && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileInsetIndex((prev) => (prev + 1) % mobileInsets.length);
            }}
            style={{ marginLeft: 'auto', zIndex: 1, border: '1px solid rgba(15,23,42,0.35)', borderRadius: 8, background: 'rgba(255,255,255,0.72)', color: '#0b1220', fontSize: 9, fontWeight: 800, letterSpacing: '0.02em', padding: '3px 7px', lineHeight: 1 }}
          >
            SIZE
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
      {!mobileMode && !isMax && onResize && resizeHandles.map(({ edge, style }) => (
        <div
          key={edge}
          style={{ position: 'absolute', zIndex: 10, ...style }}
          onMouseDown={(e) => {
            e.stopPropagation();
            resizeRef.current = { edge, sx: e.clientX, sy: e.clientY, ow: winState.w, oh: winState.h };
          }}
        />
      ))}
    </div>
  );
};

export default WindowFrame;
