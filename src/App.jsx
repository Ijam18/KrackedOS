import React, { useEffect, useState } from 'react';
import { ToastProvider } from './components/ToastNotification';
import IjamOSWorkspace from './features/ijam-os/IjamOSWorkspace';
import { DEFAULT_PROFILE, useOsRuntime } from './features/ijam-os/os-core';

const getDeviceMode = () => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width <= 640) return 'phone';
  if (width <= 1024) return 'tablet';
  return 'desktop';
};

const getIjamOsMode = (deviceMode) => {
  if (deviceMode === 'phone') return 'ios_phone';
  if (deviceMode === 'tablet') return 'ios_tablet';
  return 'mac_desktop';
};

export default function App() {
  const [deviceMode, setDeviceMode] = useState(getDeviceMode());
  const [currentUser, setCurrentUser] = useState(DEFAULT_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { runtime, isReady, error } = useOsRuntime();

  useEffect(() => {
    const onResize = () => setDeviceMode(getDeviceMode());
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
