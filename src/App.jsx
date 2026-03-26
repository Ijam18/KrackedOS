import React, { useEffect, useState } from 'react';
import { ToastProvider } from './components/ToastNotification';
import IjamOSWorkspace from './features/ijam-os/IjamOSWorkspace';
import { DEFAULT_PROFILE, useOsRuntime } from './features/ijam-os/os-core';
import { getDeviceMode, getIjamOsMode } from './utils/deviceMode';

function UnsupportedPhoneFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at top, rgba(37,99,235,0.32), transparent 42%), linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        color: '#f8fafc'
      }}
    >
      <div
        style={{
          width: 'min(100%, 420px)',
          borderRadius: '28px',
          border: '1px solid rgba(148,163,184,0.22)',
          background: 'rgba(15,23,42,0.84)',
          boxShadow: '0 28px 80px rgba(2,6,23,0.6)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          padding: '28px 22px',
          textAlign: 'center',
          fontFamily: '"SF Pro Display", "Segoe UI", system-ui, sans-serif'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.16em', color: '#93c5fd', marginBottom: '14px' }}>
          DEVICE NOT SUPPORTED
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700, lineHeight: 1.05, marginBottom: '14px' }}>
          KRACKED_OS is not available on phone
        </div>
        <p style={{ margin: 0, color: '#cbd5e1', fontSize: '15px', lineHeight: 1.6 }}>
          Open this on iPad, tablet, or desktop for the full workspace experience.
        </p>
        <div
          style={{
            marginTop: '22px',
            borderRadius: '18px',
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(30,41,59,0.54)',
            padding: '14px 16px',
            fontSize: '13px',
            color: '#e2e8f0',
            lineHeight: 1.5
          }}
        >
          Minimum supported mode: tablet landscape or desktop browser.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [deviceMode, setDeviceMode] = useState(() => (
    typeof window === 'undefined' ? 'desktop' : getDeviceMode(window.innerWidth)
  ));
  const [currentUser, setCurrentUser] = useState(DEFAULT_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { runtime, isReady, error } = useOsRuntime();

  useEffect(() => {
    const onResize = () => setDeviceMode(getDeviceMode(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!runtime) return;
    let active = true;

    runtime.settings.loadProfile()
      .then((profile) => {
        if (!active) return;
        setCurrentUser({ ...DEFAULT_PROFILE, ...(profile || {}) });
        setProfileLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setCurrentUser(DEFAULT_PROFILE);
        setProfileLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [runtime]);

  useEffect(() => {
    if (!runtime || !profileLoaded) return;
    runtime.settings.saveProfile(currentUser).catch(() => {});
  }, [currentUser, profileLoaded, runtime]);

  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#020617', color: '#f8fafc', fontFamily: 'monospace' }}>
        Bootstrapping KRACKED_OS runtime...
      </div>
    );
  }

  if (error || !runtime) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#020617', color: '#f8fafc', fontFamily: 'monospace', padding: 24, textAlign: 'center' }}>
        Failed to initialize KRACKED_OS runtime.
      </div>
    );
  }

  if (deviceMode === 'phone') {
    return <UnsupportedPhoneFallback />;
  }

  return (
    <ToastProvider>
      <IjamOSWorkspace
        runtime={runtime}
        session={null}
        currentUser={currentUser}
        isMobileView={deviceMode !== 'desktop'}
        deviceMode={deviceMode}
        ijamOsMode={getIjamOsMode(deviceMode)}
        setPublicPage={() => {}}
        setCurrentUser={setCurrentUser}
      />
    </ToastProvider>
  );
}
