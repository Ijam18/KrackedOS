import React from 'react';

const DesktopIcon = ({
  label,
  icon: Icon,
  iconNode,
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
}) => {
  const usesRawIcon = Boolean(imageSrc || iconNode);

  return (
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
        gap: isPhoneMode ? '4px' : '6px',
        background: 'transparent',
        border: usesRawIcon ? 'none' : '1px solid transparent',
        cursor: 'pointer',
        padding: isPhoneMode ? '8px 6px' : (isTabletMode ? '10px' : '12px'),
        borderRadius: '16px',
        transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
        outline: isDropTarget ? '2px dashed rgba(245,208,0,0.85)' : 'none',
        outlineOffset: isDropTarget ? '3px' : 0
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = usesRawIcon ? 'transparent' : 'rgba(255,255,255,0.14)';
        e.currentTarget.style.borderColor = usesRawIcon ? 'transparent' : 'rgba(255,255,255,0.18)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          background: usesRawIcon ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.44) 0%, rgba(15,23,42,0.22) 100%)',
          border: usesRawIcon ? 'none' : '1px solid rgba(255,255,255,0.12)',
          color,
          padding: 0,
          borderRadius: '18px',
          boxShadow: usesRawIcon ? 'none' : '0 12px 24px rgba(2,6,23,0.18)',
          width: isPhoneMode ? '56px' : '68px',
          height: isPhoneMode ? '56px' : '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: usesRawIcon ? 'none' : 'blur(10px)',
          WebkitBackdropFilter: usesRawIcon ? 'none' : 'blur(10px)'
        }}
      >
        {iconNode ? (
          iconNode
        ) : imageSrc ? (
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
      <span
        style={{
          color: '#f8fafc',
          fontSize: isPhoneMode ? '10px' : '11px',
          fontWeight: 700,
          fontFamily: '"SF Pro Text", "Segoe UI", system-ui, sans-serif',
          textShadow: '0 1px 3px rgba(2,6,23,0.7)',
          lineHeight: 1.2,
          padding: '2px 8px',
          borderRadius: '999px',
          background: 'rgba(15,23,42,0.36)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        {label}
      </span>
    </button>
  );
};

export default DesktopIcon;
