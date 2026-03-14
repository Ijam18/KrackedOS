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
  mobileMaxInset = '48px 0px 74px 0px',
  chromeVariant = 'mac'
}) => {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const mobileInsets = useMemo(() => ['102px 16px 148px 16px', '82px 12px 116px 12px', mobileInset], [mobileInset]);
  const [mobileInsetIndex, setMobileInsetIndex] = useState(2);

  useEffect(() => {
    if (mobileMode) return () => {};

    const previousUserSelect = typeof document !== 'undefined' ? document.body.style.userSelect : '';
    const previousWebkitUserSelect = typeof document !== 'undefined' ? document.body.style.WebkitUserSelect : '';
    const previousCursor = typeof document !== 'undefined' ? document.body.style.cursor : '';

    const lockPointer = (cursor = '') => {
      if (typeof document === 'undefined') return;
      document.body.style.userSelect = 'none';
      document.body.style.WebkitUserSelect = 'none';
      document.body.style.cursor = cursor;
    };

    const unlockPointer = () => {
      if (typeof document === 'undefined') return;
      document.body.style.userSelect = previousUserSelect;
      document.body.style.WebkitUserSelect = previousWebkitUserSelect;
      document.body.style.cursor = previousCursor;
    };

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
        const { edge, sx, sy, ow, oh, wx, wy } = resizeRef.current;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        let nw = ow;
        let nh = oh;
        let nx = wx;
        let ny = wy;

        if (edge.includes('e')) nw = Math.max(320, ow + dx);
        if (edge.includes('s')) nh = Math.max(220, oh + dy);
        if (edge.includes('w')) {
          nw = Math.max(320, ow - dx);
          nx = wx + (ow - nw);
        }
        if (edge.includes('n')) {
          nh = Math.max(220, oh - dy);
          ny = wy + (oh - nh);
        }

        if (frameRef.current) {
          if (edge.includes('w')) frameRef.current.style.left = `${nx}px`;
          if (edge.includes('n')) frameRef.current.style.top = `${ny}px`;
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
        unlockPointer();
      }

      if (resizeRef.current) {
        const { edge, sx, sy, ow, oh, wx, wy } = resizeRef.current;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        let nw = ow;
        let nh = oh;
        let nx = wx;
        let ny = wy;

        if (edge.includes('e')) nw = Math.max(320, ow + dx);
        if (edge.includes('s')) nh = Math.max(220, oh + dy);
        if (edge.includes('w')) {
          nw = Math.max(320, ow - dx);
          nx = wx + (ow - nw);
        }
        if (edge.includes('n')) {
          nh = Math.max(220, oh - dy);
          ny = wy + (oh - nh);
        }

        if (edge.includes('w') || edge.includes('n')) onMove(nx, ny);
        if (onResize) onResize(nw, nh);
        resizeRef.current = null;
        unlockPointer();
      }
    };

    document.addEventListener('mousemove', onMM);
    document.addEventListener('mouseup', onMU);
    return () => {
      unlockPointer();
      document.removeEventListener('mousemove', onMM);
      document.removeEventListener('mouseup', onMU);
    };
  }, [mobileMode, onMove, onResize]);

  useEffect(() => setMobileInsetIndex(2), [mobileInset]);

  if (!winState?.isOpen || winState?.isMinimized) return null;
  const isMax = Boolean(winState.isMaximized);

  const boxStyle = mobileMode
    ? { position: 'absolute', inset: isMax ? mobileMaxInset : mobileInsets[mobileInsetIndex] || mobileInset, zIndex: winState.zIndex, borderRadius: isMax ? '0px' : '18px' }
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

  const isMacChrome = chromeVariant === 'mac';
  const frameStyle = isMacChrome
    ? {
        background: 'rgba(14,18,28,0.84)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 34px 90px rgba(2,6,23,0.52), 0 18px 38px rgba(15,23,42,0.26)',
        backdropFilter: 'blur(22px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.1)'
      }
    : {
        background: '#111827',
        boxShadow: '0 28px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)'
      };
  const titleBarStyle = isMacChrome
    ? {
        background: 'linear-gradient(180deg, rgba(33,38,52,0.94) 0%, rgba(18,22,34,0.96) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }
    : {
        background: '#f5d000',
        borderBottom: '2px solid rgba(0,0,0,0.15)'
      };
  const titleTextStyle = isMacChrome
    ? {
        color: '#f8fafc',
        fontFamily: '"SF Pro Display", "Segoe UI", system-ui, sans-serif',
        fontSize: mobileMode ? '12px' : '13px',
        fontWeight: 600,
        letterSpacing: '0.01em'
      }
    : {
        color: '#0b1220',
        fontFamily: 'monospace',
        fontWeight: 900,
        fontSize: '13px'
      };
  const trafficLights = [
    { color: '#ff5f57', action: onClose, label: 'Close window' },
    { color: '#ffbd2f', action: onMinimize, label: 'Minimize window' },
    { color: '#28c840', action: onMaximize, label: isMax ? 'Restore window' : 'Maximize window' }
  ];

  return (
    <div
      ref={frameRef}
      onMouseDown={onFocus}
      style={{ ...boxStyle, ...frameStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <div
        onMouseDown={(e) => {
          if (isMax || mobileMode) return;
          e.preventDefault();
          e.stopPropagation();
          dragRef.current = { sx: e.clientX, sy: e.clientY, wx: winState.x, wy: winState.y };
          if (typeof document !== 'undefined') {
            document.body.style.userSelect = 'none';
            document.body.style.WebkitUserSelect = 'none';
            document.body.style.cursor = 'grabbing';
          }
        }}
        onDoubleClick={onMaximize}
        style={{ ...titleBarStyle, padding: mobileMode ? '10px 12px' : '10px 14px', minHeight: mobileMode ? '46px' : '44px', display: 'flex', alignItems: 'center', cursor: (isMax || mobileMode) ? 'default' : 'grab', userSelect: 'none', flexShrink: 0, position: 'relative' }}
      >
        <div style={{ display: 'flex', gap: '6px', zIndex: 1 }}>
          {trafficLights.map(({ color, action, label }) => (
            <button
              key={color}
              type="button"
              aria-label={label}
              title={label}
              onClick={(e) => { e.stopPropagation(); action(); }}
              style={{ width: 12, height: 12, borderRadius: '50%', background: color, border: '1px solid rgba(0,0,0,0.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}
            />
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', pointerEvents: 'none' }}>
          {AppIcon && <AppIcon size={14} color={isMacChrome ? 'rgba(248,250,252,0.9)' : '#0b1220'} />}
          <span style={titleTextStyle}>{title}</span>
        </div>
        {mobileMode && !isMax && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileInsetIndex((prev) => (prev + 1) % mobileInsets.length);
            }}
            style={{ marginLeft: 'auto', zIndex: 1, border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, background: 'rgba(255,255,255,0.08)', color: '#f8fafc', fontFamily: '"SF Pro Text", "Segoe UI", system-ui, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.02em', padding: '4px 9px', lineHeight: 1 }}
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
            e.preventDefault();
            e.stopPropagation();
            resizeRef.current = { edge, sx: e.clientX, sy: e.clientY, ow: winState.w, oh: winState.h, wx: winState.x, wy: winState.y };
            if (typeof document !== 'undefined') {
              document.body.style.userSelect = 'none';
              document.body.style.WebkitUserSelect = 'none';
              document.body.style.cursor = style.cursor;
            }
          }}
        />
      ))}
    </div>
  );
};

export default WindowFrame;
