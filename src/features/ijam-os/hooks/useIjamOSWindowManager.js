import { useCallback, useMemo, useState } from 'react';

export const useIjamOSWindowManager = ({
  appRegistry,
  isTouchIjamMode,
  isPhoneMode = false,
  isTabletMode = false,
  getRestoredWindowMetrics = null,
  resolveOpenType = null,
  onAppOpen = null,
  onAppFocus = null
}) => {
  const [windowStates, setWindowStates] = useState({});
  const [focusedWindow, setFocusedWindow] = useState(null);
  const [zCounter, setZCounter] = useState(100);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [startMenuSearch, setStartMenuSearch] = useState('');

  const openApp = useCallback(
    (requestedType) => {
      const requestedAppCfg = appRegistry.find((a) => a.type === requestedType);
      if (!requestedAppCfg) return null;

      let type = requestedType;
      let appCfg = requestedAppCfg;
      const resolvedType = resolveOpenType?.(requestedType, requestedAppCfg);
      if (typeof resolvedType === 'string' && resolvedType.trim() && resolvedType !== requestedType) {
        const resolvedAppCfg = appRegistry.find((a) => a.type === resolvedType);
        if (!resolvedAppCfg) return null;
        type = resolvedType;
        appCfg = resolvedAppCfg;
      }

      const openResult = onAppOpen?.(requestedType, appCfg, {
        requestedType,
        resolvedType: type,
        requestedAppCfg,
        resolvedAppCfg: appCfg
      });
      if (openResult === false || openResult?.preventDefault) {
        return type;
      }

      setZCounter((z) => {
        const newZ = z + 1;
        setWindowStates((prev) => {
          if (isPhoneMode || isTouchIjamMode) {
            const vw = typeof window !== 'undefined' ? window.innerWidth : 430;
            const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
            const reset = {};
            appRegistry.forEach((app) => {
              reset[app.type] = {
                ...(prev[app.type] || {}),
                isOpen: false,
                isMinimized: false,
                isMaximized: false,
                zIndex: 0
              };
            });

            return {
              ...reset,
              [type]: {
                ...(prev[type] || {}),
                isOpen: true,
                isMinimized: false,
                isMaximized: false,
                x: 10,
                y: 58,
                w: Math.max(320, vw - 20),
                h: Math.max(400, vh - 84),
                zIndex: newZ
              }
            };
          }

          if (isTabletMode) {
            if (prev[type]?.isOpen) {
              return {
                ...prev,
                [type]: {
                  ...prev[type],
                  isMinimized: false,
                  zIndex: newZ
                }
              };
            }
            return {
              ...prev,
              [type]: {
                ...(prev[type] || {}),
                isOpen: true,
                isMinimized: false,
                isMaximized: false,
                zIndex: newZ
              }
            };
          }

          if (prev[type]?.isOpen) {
            return { ...prev, [type]: { ...prev[type], isMinimized: false, zIndex: newZ } };
          }

          const openCount = Object.values(prev).filter((w) => w.isOpen).length;
          const restoredMetrics = getRestoredWindowMetrics
            ? getRestoredWindowMetrics(appCfg, prev[type], openCount)
            : (() => {
                const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
                const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
                const w = Math.min(appCfg.defaultW, vw - 60);
                const h = Math.min(appCfg.defaultH, vh - 140);
                return {
                  x: Math.max(16, (vw - w) / 2 + openCount * 22 - 44),
                  y: Math.max(10, 30 + openCount * 22),
                  w,
                  h,
                  isMaximized: false
                };
              })();

          return {
            ...prev,
            [type]: {
              ...(prev[type] || {}),
              ...restoredMetrics,
              isOpen: true,
              isMinimized: false,
              zIndex: newZ
            }
          };
        });

        setFocusedWindow(type);
        return newZ;
      });

      return type;
    },
    [appRegistry, getRestoredWindowMetrics, isPhoneMode, isTabletMode, isTouchIjamMode, onAppOpen, resolveOpenType]
  );

  const closeApp = useCallback((type) => {
    setWindowStates((prev) => ({ ...prev, [type]: { ...(prev[type] || {}), isOpen: false } }));
    setFocusedWindow((f) => (f === type ? null : f));
  }, []);

  const closeAllApps = useCallback(() => {
    setWindowStates((prev) => {
      const next = { ...prev };
      appRegistry.forEach((app) => {
        next[app.type] = { ...(next[app.type] || {}), isOpen: false, isMinimized: false };
      });
      return next;
    });
    setFocusedWindow(null);
  }, [appRegistry]);

  const minimizeApp = useCallback((type) => {
    setWindowStates((prev) => ({ ...prev, [type]: { ...prev[type], isMinimized: true } }));
    setFocusedWindow((f) => (f === type ? null : f));
  }, []);

  const maximizeApp = useCallback((type) => {
    setWindowStates((prev) => ({ ...prev, [type]: { ...prev[type], isMaximized: !prev[type]?.isMaximized } }));
  }, []);

  const focusApp = useCallback((type) => {
    const appCfg = appRegistry.find((a) => a.type === type);
    onAppFocus?.(type, appCfg);
    setZCounter((z) => {
      const newZ = z + 1;
      setWindowStates((prev) => ({ ...prev, [type]: { ...prev[type], zIndex: newZ } }));
      setFocusedWindow(type);
      return newZ;
    });
  }, [appRegistry, onAppFocus]);

  const moveApp = useCallback((type, x, y) => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    setWindowStates((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        x: Math.max(0, Math.min(x, vw - 100)),
        y: Math.max(0, Math.min(y, vh - 60))
      }
    }));
  }, []);

  const resizeApp = useCallback((type, w, h) => {
    setWindowStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], w: Math.max(320, w), h: Math.max(220, h) }
    }));
  }, []);

  const mobileActiveWindow = useMemo(() => {
    if (focusedWindow && windowStates[focusedWindow]?.isOpen && !windowStates[focusedWindow]?.isMinimized) return focusedWindow;
    const open = appRegistry.find((app) => windowStates[app.type]?.isOpen && !windowStates[app.type]?.isMinimized);
    return open?.type || null;
  }, [appRegistry, focusedWindow, windowStates]);

  const activeWindow = focusedWindow;

  return {
    windowStates,
    focusedWindow,
    activeWindow,
    mobileActiveWindow,
    isStartMenuOpen,
    startMenuSearch,
    zCounter,
    openApp,
    closeApp,
    closeAllApps,
    minimizeApp,
    maximizeApp,
    focusApp,
    moveApp,
    resizeApp,
    setIsStartMenuOpen,
    setStartMenuSearch,
    setWindowStates,
    setFocusedWindow,
    setZCounter
  };
};
