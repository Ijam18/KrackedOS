import React from 'react';

const DesktopIcon = ({
  label,
  icon: Icon,
  imageSrc,
  iconScale = 1,
  onClick,
  color = '#f5d000',
  isPhoneMode = false,
  isTabletMode = false,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDropTarget = false
}) => (
  <button
    onClick={onClick}
    draggable={draggable}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
    onDragEnd={onDragEnd}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isPhoneMode ? '0px' : '1px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: isPhoneMode ? '8px 6px' : (isTabletMode ? '10px' : '12px'),
      borderRadius: '12px',
      transition: 'background 0.2s',
      outline: isDropTarget ? '2px dashed rgba(245,208,0,0.85)' : 'none',
      outlineOffset: isDropTarget ? '3px' : 0
    }}
    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(245,208,0,0.12)'; }}
    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
  >
    <div
      style={{
        background: 'transparent',
        border: 'none',
        color,
        padding: 0,
        borderRadius: '14px',
        boxShadow: 'none',
        width: isPhoneMode ? '56px' : '68px',
        height: isPhoneMode ? '56px' : '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`${label} icon`}
          style={{
            width: isPhoneMode ? '50px' : '64px',
            height: isPhoneMode ? '50px' : '64px',
            objectFit: 'contain',
            imageRendering: 'auto',
            transform: `scale(${iconScale})`,
            transformOrigin: 'center center'
          }}
        />
      ) : (
        <Icon size={isPhoneMode ? 34 : 42} />
      )}
    </div>
    <span style={{ color: '#fff', fontSize: isPhoneMode ? '10px' : '11px', fontWeight: 800, fontFamily: 'monospace', textShadow: '1px 1px 4px #000' }}>{label}</span>
  </button>
);

export default DesktopIcon;
