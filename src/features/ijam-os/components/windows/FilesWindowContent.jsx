import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  ArrowUpWideNarrow,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Copy,
  ExternalLink,
  FileArchive,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe2,
  HardDrive,
  Home,
  Image,
  LayoutGrid,
  Link2,
  List,
  Monitor,
  PencilLine,
  RefreshCw,
  Scissors,
  Search,
  Terminal,
  Trash2,
  Undo2,
  Upload
} from 'lucide-react';

const UI_FONT = '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif';
const LABEL_FONT = '"Segoe UI", system-ui, sans-serif';

const NAV_ICON_MAP = {
  pc: Monitor,
  drive: HardDrive,
  workspace: FolderOpen,
  desktop: Monitor,
  folder: Folder,
  wallpapers: Image,
  community: Globe2,
  lessons: BookOpen,
  trash: Trash2
};

const ITEM_META = {
  app: { Icon: Monitor, typeLabel: 'App', iconColor: '#2563eb', iconBg: 'rgba(37,99,235,0.12)' },
  drive: { Icon: HardDrive, typeLabel: 'Local drive', iconColor: '#1d4ed8', iconBg: 'rgba(37,99,235,0.12)' },
  folder: { Icon: Folder, typeLabel: 'Folder', iconColor: '#c27803', iconBg: 'rgba(245,158,11,0.14)' },
  lesson: { Icon: BookOpen, typeLabel: 'Lesson file', iconColor: '#7c3aed', iconBg: 'rgba(124,58,237,0.14)' },
  url: { Icon: Link2, typeLabel: 'Shortcut', iconColor: '#0f766e', iconBg: 'rgba(13,148,136,0.14)' },
  default: { Icon: FileText, typeLabel: 'File', iconColor: '#475569', iconBg: 'rgba(100,116,139,0.14)' }
};

const shellStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  padding: '14px',
  gap: '12px',
  background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)',
  color: '#0f172a',
  fontFamily: UI_FONT
};

const glassPanelStyle = {
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(148,163,184,0.24)',
  borderRadius: '18px',
  boxShadow: '0 16px 40px rgba(148,163,184,0.16)'
};

const explorerSurfaceStyle = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.96) 100%)'
};

const commandButtonStyle = (enabled = true, accent = false) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  minHeight: '36px',
  padding: '0 14px',
  borderRadius: '12px',
  border: accent ? '1px solid rgba(29,78,216,0.22)' : '1px solid rgba(148,163,184,0.28)',
  background: accent ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.9)',
  color: enabled ? '#0f172a' : '#94a3b8',
  cursor: enabled ? 'pointer' : 'default',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: LABEL_FONT,
  opacity: enabled ? 1 : 0.62,
  transition: 'background 0.15s ease, border-color 0.15s ease'
});

const chromeButtonStyle = (enabled = true) => ({
  width: '36px',
  height: '36px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  border: '1px solid rgba(148,163,184,0.24)',
  background: enabled ? 'rgba(255,255,255,0.9)' : 'rgba(248,250,252,0.8)',
  color: enabled ? '#334155' : '#cbd5e1',
  cursor: enabled ? 'pointer' : 'default'
});

const commandBarButtonStyle = ({ enabled = true, active = false, iconOnly = false } = {}) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '34px',
  minWidth: iconOnly ? '34px' : 'auto',
  padding: iconOnly ? '0 8px' : '0 12px',
  borderRadius: '10px',
  border: active ? '1px solid rgba(37,99,235,0.22)' : '1px solid transparent',
  background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
  color: enabled ? '#334155' : '#94a3b8',
  cursor: enabled ? 'pointer' : 'default',
  fontSize: '12px',
  fontWeight: 500,
  fontFamily: LABEL_FONT,
  opacity: enabled ? 1 : 0.55
});

const commandDividerStyle = {
  width: '1px',
  height: '22px',
  background: 'rgba(203,213,225,0.92)'
};

const navButtonStyle = (active) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '9px 12px',
  border: active ? '1px solid rgba(29,78,216,0.2)' : '1px solid transparent',
  borderRadius: '12px',
  background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
  color: active ? '#0f172a' : '#334155',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: active ? 600 : 500,
  fontFamily: LABEL_FONT,
  textAlign: 'left'
});

const iconTileStyle = (selected) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '10px',
  minHeight: '128px',
  padding: '16px 12px 14px',
  borderRadius: '18px',
  border: `1px solid ${selected ? 'rgba(29,78,216,0.26)' : 'rgba(148,163,184,0.14)'}`,
  background: selected ? 'linear-gradient(180deg, rgba(219,234,254,0.96) 0%, rgba(239,246,255,0.94) 100%)' : 'rgba(255,255,255,0.68)',
  color: '#0f172a',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
  boxShadow: selected ? '0 10px 28px rgba(96,165,250,0.18)' : 'none'
});

const listRowBaseStyle = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 130px 180px',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  border: 'none',
  borderBottom: '1px solid rgba(226,232,240,0.88)',
  cursor: 'pointer',
  textAlign: 'left'
};

const detailButtonStyle = (tone = 'default') => {
  const variants = {
    default: {
      background: 'rgba(255,255,255,0.96)',
      color: '#0f172a',
      border: '1px solid rgba(148,163,184,0.26)'
    },
    primary: {
      background: '#2563eb',
      color: '#f8fafc',
      border: '1px solid #2563eb'
    },
    danger: {
      background: '#fff1f2',
      color: '#be123c',
      border: '1px solid rgba(244,63,94,0.22)'
    },
    success: {
      background: '#ecfdf5',
      color: '#047857',
      border: '1px solid rgba(16,185,129,0.2)'
    }
  };
  return {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '38px',
    padding: '0 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: LABEL_FONT,
    ...variants[tone]
  };
};

const getItemMeta = (item) => ITEM_META[item?.type] || ITEM_META.default;

const iconWrapStyle = (size) => ({
  width: size,
  height: size,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
});

function VsCodeFileGlyph({ label = 'TXT', accent = '#64748b', page = '#f8fafc', edge = '#d8dee9', size = 52 }) {
  const labelSize = size >= 70 ? 12 : size >= 52 ? 9 : 7;
  return (
    <div style={iconWrapStyle(size)}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M16 6h22l12 12v40H16z" fill={page} stroke={edge} strokeWidth="1.5" />
        <path d="M38 6v12h12" fill="#e2e8f0" />
        <path d="M38 6l12 12H38z" fill="#e2e8f0" stroke={edge} strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="18" y="36" width="28" height="12" rx="3.5" fill={accent} />
        <text x="32" y="45" textAnchor="middle" fontSize={labelSize} fontWeight="800" fontFamily="Segoe UI, Arial, sans-serif" fill="#ffffff">
          {label}
        </text>
      </svg>
    </div>
  );
}

function VsCodeFolderGlyph({ size = 52, accent = '#eab308' }) {
  return (
    <div style={iconWrapStyle(size)}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <path d="M8 18h16l5 5h27v6H8z" fill="#fde68a" />
        <path d="M8 24h48v25a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z" fill={accent} />
        <path d="M8 24h48" stroke="#f59e0b" strokeWidth="2" />
        <path d="M8 18h16l5 5h27" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function VsCodeDriveGlyph({ size = 52 }) {
  return (
    <div style={iconWrapStyle(size)}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect x="10" y="18" width="44" height="26" rx="6" fill="#60a5fa" />
        <rect x="10" y="22" width="44" height="18" rx="5" fill="#dbeafe" />
        <rect x="10" y="38" width="44" height="6" rx="3" fill="#2563eb" />
        <circle cx="46" cy="41" r="2" fill="#bfdbfe" />
        <circle cx="40" cy="41" r="2" fill="#bfdbfe" />
      </svg>
    </div>
  );
}

function DesktopAppGlyph({ item, size = 52 }) {
  const AppIcon = item?.data?.appIcon || Monitor;
  const imageSrc = item?.data?.desktopIconImage || '';
  const iconScale = item?.data?.desktopIconScale || 1;
  const iconColor = item?.data?.color || '#2563eb';

  return (
    <div style={iconWrapStyle(size)}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`${item?.name || 'App'} icon`}
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
            imageRendering: 'auto',
            transform: `scale(${iconScale})`,
            transformOrigin: 'center center'
          }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor
          }}
        >
          <AppIcon size={Math.max(18, Math.round(size * 0.62))} />
        </div>
      )}
    </div>
  );
}

function getVsCodeIconSpec(item) {
  const ext = (item?.ext || '').toLowerCase();
  const rawName = (item?.rawName || item?.name || '').toLowerCase();

  if (item?.type === 'app') return { kind: 'app' };
  if (item?.type === 'drive') return { kind: 'drive' };
  if (item?.type === 'folder') return { kind: 'folder' };
  if (item?.type === 'lesson') return { kind: 'file', label: 'MD', accent: '#7c3aed', page: '#faf5ff', edge: '#ddd6fe' };
  if (item?.type === 'url') return { kind: 'file', label: 'URL', accent: '#2563eb', page: '#eff6ff', edge: '#bfdbfe' };
  if (item?.type === 'wallpaper' || item?.type === 'image' || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].includes(ext)) {
    return { kind: 'file', label: 'IMG', accent: '#0ea5e9', page: '#f0f9ff', edge: '#bae6fd' };
  }
  if (ext === '.json') return { kind: 'file', label: '{}', accent: '#f59e0b', page: '#fffbeb', edge: '#fde68a' };
  if (ext === '.zip') return { kind: 'file', label: 'ZIP', accent: '#64748b', page: '#f8fafc', edge: '#cbd5e1' };
  if (ext === '.txt') return { kind: 'file', label: 'TXT', accent: '#3b82f6', page: '#eff6ff', edge: '#bfdbfe' };
  if (rawName === 'registry' || rawName === 'mounts') return { kind: 'file', label: 'CFG', accent: '#8b5cf6', page: '#f5f3ff', edge: '#ddd6fe' };
  return { kind: 'file', label: 'FILE', accent: '#64748b', page: '#f8fafc', edge: '#d8dee9' };
}

export function VsCodeExplorerIcon({ item, size = 52 }) {
  const spec = getVsCodeIconSpec(item);
  if (spec.kind === 'app') return <DesktopAppGlyph item={item} size={size} />;
  if (spec.kind === 'folder') return <VsCodeFolderGlyph size={size} />;
  if (spec.kind === 'drive') return <VsCodeDriveGlyph size={size} />;
  return <VsCodeFileGlyph label={spec.label} accent={spec.accent} page={spec.page} edge={spec.edge} size={size} />;
}

const renderNavIcon = (iconKey, active) => {
  const Icon = NAV_ICON_MAP[iconKey] || Folder;
  return <Icon size={16} color={active ? '#1d4ed8' : '#64748b'} />;
};

export default function FilesWindowContent({
  importInputRef,
  onFilesSelected,
  breadcrumbs,
  onNavigate,
  canGoBack,
  onBack,
  onUp,
  onHome,
  searchValue,
  onSearchChange,
  onClearSearch,
  onRefresh,
  onNewFolder,
  onCreateItem = () => {},
  onImport,
  canWrite,
  view,
  onViewChange,
  navSections,
  items,
  selectedItem,
  onItemClick,
  onOpenItem,
  onItemContextMenu,
  onCopy,
  onCut,
  onPaste,
  onSortToggle,
  onRename,
  onDelete,
  onRestore,
  isTrash,
  isNarrowScreen,
  currentPathLabel,
  canCopySelected = false,
  canCutSelected = false,
  canPaste = false,
  sortLabel = 'Name',
  showDetailsPane = true,
  onToggleDetails = () => {}
}) {
  const selectedMeta = selectedItem ? getItemMeta(selectedItem) : null;
  const selectedSummary = selectedItem?.data?.summary || selectedItem?.data?.description || '';
  const canOpenSelected = selectedItem && selectedItem.type !== 'folder' && selectedItem.type !== 'drive';
  const canMutateSelected = selectedItem && !selectedItem.data?.readonly && !isTrash;
  const canRenameSelected = Boolean(selectedItem && !selectedItem.data?.readonly && !isTrash);
  const searchScopeLabel = breadcrumbs[breadcrumbs.length - 1]?.label || 'KRACKED_OS';
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const newMenuRef = useRef(null);
  const newMenuItems = useMemo(() => ([
    { id: 'folder', label: 'Folder', Icon: Folder },
    { id: 'shortcut', label: 'Shortcut', Icon: Link2 },
    { id: 'bitmap', label: 'Bitmap image', Icon: FileImage },
    { id: 'text', label: 'Text Document', Icon: FileText },
    { id: 'zip', label: 'Compressed (zipped) Folder', Icon: FileArchive }
  ]), []);

  useEffect(() => {
    if (!isNewMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!newMenuRef.current?.contains(event.target)) {
        setIsNewMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsNewMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNewMenuOpen]);

  return (
    <div style={shellStyle}>
      <input ref={importInputRef} type="file" multiple style={{ display: 'none' }} onChange={onFilesSelected} />

      <div style={{ ...glassPanelStyle, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" onClick={onBack} disabled={!canGoBack} style={chromeButtonStyle(canGoBack)}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" disabled style={chromeButtonStyle(false)}>
              <ChevronRight size={16} />
            </button>
            <button type="button" onClick={onUp} disabled={!canGoBack} style={chromeButtonStyle(canGoBack)}>
              <ArrowUp size={16} />
            </button>
            <button type="button" onClick={onHome} style={chromeButtonStyle(true)}>
              <Home size={16} />
            </button>
            <button type="button" onClick={onRefresh} style={chromeButtonStyle(true)}>
              <RefreshCw size={16} />
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px', minHeight: '38px', borderRadius: '14px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.92)', overflow: 'hidden' }}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <ChevronRight size={14} color="#94a3b8" />}
                <button
                  type="button"
                  onClick={() => onNavigate(crumb.path)}
                  style={{ border: 'none', background: 'transparent', padding: 0, color: index === breadcrumbs.length - 1 ? '#0f172a' : '#334155', fontSize: '13px', fontWeight: index === breadcrumbs.length - 1 ? 600 : 500, fontFamily: LABEL_FONT, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div style={{ width: isNarrowScreen ? '100%' : '240px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', minHeight: '38px', borderRadius: '14px', border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(255,255,255,0.92)' }}>
            <Search size={15} color="#64748b" />
            <input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={`Search ${searchScopeLabel}`}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: '#0f172a', fontSize: '13px', fontFamily: LABEL_FONT }}
            />
            {searchValue && (
              <button type="button" onClick={onClearSearch} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', paddingTop: '2px', borderTop: '1px solid rgba(226,232,240,0.92)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <div ref={newMenuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => canWrite && setIsNewMenuOpen((prev) => !prev)}
                disabled={!canWrite}
                style={commandBarButtonStyle({ enabled: canWrite })}
              >
                <FolderPlus size={15} />
                New
                <ChevronDown size={13} />
              </button>
              {isNewMenuOpen && canWrite && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    minWidth: '236px',
                    padding: '8px 0',
                    borderRadius: '14px',
                    border: '1px solid rgba(148,163,184,0.28)',
                    background: 'rgba(252,253,255,0.98)',
                    boxShadow: '0 22px 48px rgba(15,23,42,0.18)',
                    backdropFilter: 'blur(18px)',
                    WebkitBackdropFilter: 'blur(18px)',
                    zIndex: 20
                  }}
                >
                  {newMenuItems.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        if (id === 'folder') {
                          onNewFolder();
                          return;
                        }
                        onCreateItem(id);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        border: 'none',
                        background: 'transparent',
                        color: '#0f172a',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 500,
                        fontFamily: LABEL_FONT
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = 'rgba(37,99,235,0.08)';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Icon size={16} color={id === 'folder' ? '#c27803' : '#2563eb'} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={onImport} disabled={!canWrite} style={commandBarButtonStyle({ enabled: canWrite })}>
              <Upload size={15} />
              Import
            </button>
            <span style={commandDividerStyle} />
            <button type="button" onClick={onCut} disabled={!canCutSelected} style={commandBarButtonStyle({ enabled: canCutSelected, iconOnly: true })}>
              <Scissors size={15} />
            </button>
            <button type="button" onClick={onCopy} disabled={!canCopySelected} style={commandBarButtonStyle({ enabled: canCopySelected, iconOnly: true })}>
              <Copy size={15} />
            </button>
            <button type="button" aria-label="Paste" title="Paste" onClick={onPaste} disabled={!canPaste} style={commandBarButtonStyle({ enabled: canPaste, iconOnly: true })}>
              <Clipboard size={15} />
            </button>
            <button type="button" aria-label="Rename" title="Rename" onClick={onRename} disabled={!canRenameSelected} style={commandBarButtonStyle({ enabled: canRenameSelected, iconOnly: true })}>
              <PencilLine size={15} />
            </button>
            <button type="button" aria-label="Delete" title="Delete" onClick={onDelete} disabled={!canMutateSelected} style={commandBarButtonStyle({ enabled: canMutateSelected, iconOnly: true })}>
              <Trash2 size={15} />
            </button>
            <span style={commandDividerStyle} />
            <button type="button" onClick={onSortToggle} style={commandBarButtonStyle({ enabled: true })}>
              <ArrowUpWideNarrow size={15} />
              Sort: {sortLabel}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => onViewChange(view === 'icons' ? 'list' : 'icons')} style={commandBarButtonStyle({ active: true })}>
              {view === 'icons' ? <LayoutGrid size={15} /> : <List size={15} />}
              View
            </button>
            <button type="button" onClick={onToggleDetails} style={commandBarButtonStyle({ active: showDetailsPane })}>
              Details
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: isNarrowScreen ? 'minmax(0, 1fr)' : (showDetailsPane ? '220px minmax(0, 1fr) 250px' : '220px minmax(0, 1fr)'), gap: '12px' }}>
        {!isNarrowScreen && (
          <aside style={{ ...glassPanelStyle, minHeight: 0, overflowY: 'auto', padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {navSections.map((section) => (
              <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ padding: '0 10px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  {section.label}
                </div>
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    style={navButtonStyle(item.active)}
                  >
                    {renderNavIcon(item.icon, item.active)}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </aside>
        )}

        <section style={{ ...glassPanelStyle, ...explorerSurfaceStyle, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {view === 'list' && (
            <div style={{ display: 'grid', gridTemplateColumns: isNarrowScreen ? 'minmax(0, 1fr) 110px' : 'minmax(0, 1fr) 130px 180px', gap: '12px', padding: '10px 16px', borderBottom: '1px solid rgba(226,232,240,0.9)', background: 'rgba(255,255,255,0.72)', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <span>Name</span>
              <span>Type</span>
              {!isNarrowScreen && <span>Location</span>}
            </div>
          )}

          <div style={{ ...explorerSurfaceStyle, flex: 1, minHeight: 0, height: '100%', width: '100%', overflowY: 'auto', padding: '0', display: 'flex', flexDirection: 'column' }}>
            {searchValue && (
              <div style={{ padding: '12px 16px 0', fontSize: '12px', color: '#64748b' }}>
                Search results for <span style={{ color: '#2563eb', fontWeight: 600 }}>{searchValue}</span>
              </div>
            )}

            {items.length === 0 ? (
              <div style={{ minHeight: '240px', display: 'grid', placeItems: 'center', padding: '24px', textAlign: 'center' }}>
                <div style={{ maxWidth: '280px' }}>
                  <div style={{ width: '72px', height: '72px', margin: '0 auto', borderRadius: '22px', display: 'grid', placeItems: 'center', background: 'rgba(226,232,240,0.8)', color: '#64748b' }}>
                    <Folder size={30} />
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                    {searchValue ? 'No files matched your search' : 'This folder is empty'}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                    {searchValue ? 'Try another keyword or clear the search field.' : 'Create a new folder or import files into this location.'}
                  </div>
                </div>
              </div>
            ) : view === 'icons' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(138px, 1fr))', gap: '12px', alignContent: 'start', minHeight: '100%', height: '100%', width: '100%', flex: 1, padding: '12px', boxSizing: 'border-box' }}>
                {items.map((item) => {
                  const meta = getItemMeta(item);
                  const selected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemClick(item)}
                      onDoubleClick={() => onOpenItem(item)}
                      onContextMenu={(event) => onItemContextMenu(event, item)}
                      style={iconTileStyle(selected)}
                      onMouseEnter={(event) => {
                        if (!selected) {
                          event.currentTarget.style.background = 'rgba(255,255,255,0.92)';
                          event.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(event) => {
                        if (!selected) {
                          event.currentTarget.style.background = 'rgba(255,255,255,0.68)';
                          event.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <VsCodeExplorerIcon item={item} size={58} />
                      <div style={{ fontSize: '13px', fontWeight: 600, textAlign: 'center', lineHeight: 1.35, wordBreak: 'break-word' }}>
                        {item.name.length > 30 ? `${item.name.slice(0, 27)}...` : item.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {item.ext || meta.typeLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ minHeight: '100%', height: '100%', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {items.map((item) => {
                  const meta = getItemMeta(item);
                  const selected = selectedItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemClick(item)}
                      onDoubleClick={() => onOpenItem(item)}
                      onContextMenu={(event) => onItemContextMenu(event, item)}
                      style={{ ...listRowBaseStyle, gridTemplateColumns: isNarrowScreen ? 'minmax(0, 1fr) 110px' : listRowBaseStyle.gridTemplateColumns, background: selected ? 'rgba(219,234,254,0.96)' : 'rgba(255,255,255,0.72)' }}
                      onMouseEnter={(event) => {
                        if (!selected) event.currentTarget.style.background = 'rgba(248,250,252,0.96)';
                      }}
                      onMouseLeave={(event) => {
                        if (!selected) event.currentTarget.style.background = 'rgba(255,255,255,0.72)';
                      }}
                    >
                      <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <VsCodeExplorerIcon item={item} size={38} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </div>
                          {isNarrowScreen && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.data?.path || item.data?.stage || currentPathLabel}
                            </div>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{meta.typeLabel}</span>
                      {!isNarrowScreen && (
                        <span style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.data?.path || item.data?.stage || currentPathLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {!isNarrowScreen && showDetailsPane && (
          <aside style={{ ...glassPanelStyle, minHeight: 0, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {selectedItem ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                  <VsCodeExplorerIcon item={selectedItem} size={78} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', lineHeight: 1.3, wordBreak: 'break-word' }}>
                      {selectedItem.name}
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                      {selectedItem.ext || selectedMeta.typeLabel}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(226,232,240,0.92)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Location
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '13px', color: '#0f172a', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {selectedItem.data?.path || selectedItem.path || currentPathLabel}
                    </div>
                  </div>
                  {selectedItem.data?.stage && (
                    <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(239,246,255,0.9)', border: '1px solid rgba(191,219,254,0.92)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Stage
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '13px', color: '#0f172a', lineHeight: 1.45 }}>
                        {selectedItem.data.stage}
                      </div>
                    </div>
                  )}
                  {selectedSummary && (
                    <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(226,232,240,0.92)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Summary
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '13px', color: '#334155', lineHeight: 1.55 }}>
                        {selectedSummary.slice(0, 220)}
                        {selectedSummary.length > 220 ? '...' : ''}
                      </div>
                    </div>
                  )}
                  {selectedItem.data?.steps && (
                    <div style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(226,232,240,0.92)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Contents
                      </div>
                      <div style={{ marginTop: '6px', fontSize: '13px', color: '#334155' }}>
                        {selectedItem.data.steps.length} step{selectedItem.data.steps.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', display: 'grid', gap: '8px' }}>
                  {canOpenSelected && (
                    <button type="button" onClick={() => onOpenItem(selectedItem)} style={detailButtonStyle('primary')}>
                      {selectedItem.type === 'url' ? <ExternalLink size={15} /> : <Terminal size={15} />}
                      Open
                    </button>
                  )}
                  {canMutateSelected && (
                    <>
                      <button type="button" onClick={onRename} style={detailButtonStyle()}>
                        <PencilLine size={15} />
                        Rename
                      </button>
                      <button type="button" onClick={onDelete} style={detailButtonStyle('danger')}>
                        <Trash2 size={15} />
                        Move to Trash
                      </button>
                    </>
                  )}
                  {isTrash && (
                    <button type="button" onClick={() => onRestore(selectedItem)} style={detailButtonStyle('success')}>
                      <Undo2 size={15} />
                      Restore
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '18px 10px' }}>
                <div>
                  <div style={{ width: '70px', height: '70px', margin: '0 auto', borderRadius: '22px', display: 'grid', placeItems: 'center', background: 'rgba(226,232,240,0.82)', color: '#64748b' }}>
                    <FolderOpen size={28} />
                  </div>
                  <div style={{ marginTop: '14px', fontSize: '17px', fontWeight: 600, color: '#0f172a' }}>
                    Select an item
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '13px', color: '#64748b', lineHeight: 1.55 }}>
                    Preview, metadata, and quick actions will appear here.
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      <div style={{ ...glassPanelStyle, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
          {selectedItem ? ` selected: ${selectedItem.name}${selectedItem.ext || ''}` : ''}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          {currentPathLabel} | {canWrite ? 'writable' : 'read-only'}
        </div>
      </div>
    </div>
  );
}
