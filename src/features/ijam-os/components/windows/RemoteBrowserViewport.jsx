import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KDBROWSER_HOME_URL } from '../../os-core/browserState';

const ACTIVE_POLL_MS = 1800;
const IDLE_POLL_MS = 6000;
const DEFAULT_REMOTE_WIDTH = 1440;
const DEFAULT_REMOTE_HEIGHT = 900;

function normalizeRemoteUrl(value, fallbackProtocol = 'https:') {
  const raw = String(value || '').trim();
  if (!raw) return KDBROWSER_HOME_URL;

  try {
    return new URL(raw).toString();
  } catch {
    return new URL(`${fallbackProtocol}//${raw}`).toString();
  }
}

function mapPointerButton(button = 0) {
  if (button === 1) return 'middle';
  if (button === 2) return 'right';
  return 'left';
}

function getModifiers(event) {
  const modifiers = [];
  if (event.altKey) modifiers.push('alt');
  if (event.ctrlKey) modifiers.push('control');
  if (event.metaKey) modifiers.push('meta');
  if (event.shiftKey) modifiers.push('shift');
  return modifiers;
}

function mapKeyboardKey(key = '') {
  const keyMap = {
    Alt: 'Alt',
    ' ': 'Space',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    ArrowUp: 'Up',
    Backspace: 'Backspace',
    Control: 'Control',
    Delete: 'Delete',
    End: 'End',
    Enter: 'Enter',
    Escape: 'Escape',
    Home: 'Home',
    Insert: 'Insert',
    Meta: 'Meta',
    PageDown: 'PageDown',
    PageUp: 'PageUp',
    Shift: 'Shift',
    Tab: 'Tab'
  };

  if (keyMap[key]) return keyMap[key];
  if (typeof key === 'string' && key.length === 1) return key;
  return key || '';
}

function isPrintableKey(key = '') {
  return typeof key === 'string' && (key.length === 1 || key === ' ');
}

function isRemoteSessionMissingError(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /remote browser session not found/i.test(message);
}

function isRemoteSessionRecoverableError(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /remote browser session not found|remote browser page is unavailable|failed to restore the page|browser context closed|target page, context or browser has been closed/i.test(message);
}

export default function RemoteBrowserViewport({
  active,
  profileId,
  remoteState,
  runtime,
  tab,
  onPersistedUpdate,
  onStatePatch
}) {
  const remoteApi = runtime?.browser?.remote || null;
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasContextRef = useRef(null);
  const pendingNavigationRef = useRef('');
  const lastMoveAtRef = useRef(0);
  const resizeTimeoutRef = useRef(null);
  const resizeInFlightRef = useRef(false);
  const queuedResizeRef = useRef(null);
  const lastResizeSignatureRef = useRef('');
  const retryTimeoutRef = useRef(null);
  const pollTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const currentSessionIdRef = useRef('');
  const streamSocketRef = useRef(null);
  const streamSessionIdRef = useRef('');
  const frameDrawSequenceRef = useRef(0);
  const pendingPointerDownRef = useRef(null);
  const fallbackImageUrlRef = useRef('');
  const sessionId = remoteState?.remoteSessionId || '';
  const [retryToken, setRetryToken] = useState(0);
  const [readySessionId, setReadySessionId] = useState('');
  const [hasFrame, setHasFrame] = useState(false);
  const [streamConnected, setStreamConnected] = useState(false);
  const isSessionReady = Boolean(sessionId) && readySessionId === sessionId;

  useEffect(() => {
    currentSessionIdRef.current = sessionId;
  }, [sessionId]);

  const isSupersededSession = useCallback((candidateSessionId = '') => {
    const currentSessionId = currentSessionIdRef.current || '';
    return Boolean(candidateSessionId) && Boolean(currentSessionId) && candidateSessionId !== currentSessionId;
  }, []);

  const revokeFallbackImageUrl = useCallback(() => {
    if (fallbackImageUrlRef.current && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(fallbackImageUrlRef.current);
    }
    fallbackImageUrlRef.current = '';
  }, []);

  const clearCanvas = useCallback(() => {
    revokeFallbackImageUrl();
    frameDrawSequenceRef.current += 1;
    const canvas = canvasRef.current;
    const context = canvasContextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
    }
    setHasFrame(false);
  }, [revokeFallbackImageUrl]);

  const scheduleRetry = useCallback((delay = 400) => {
    if (typeof window === 'undefined') return;
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = window.setTimeout(() => {
      retryTimeoutRef.current = null;
      setRetryToken((value) => value + 1);
    }, delay);
  }, []);

  const closeStream = useCallback((expectedSessionId = '') => {
    const currentStreamSessionId = streamSessionIdRef.current || '';
    if (expectedSessionId && currentStreamSessionId && currentStreamSessionId !== expectedSessionId) {
      return;
    }

    if (reconnectTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const socket = streamSocketRef.current;
    streamSocketRef.current = null;
    streamSessionIdRef.current = '';
    setStreamConnected(false);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }, []);

  const resetRemoteSession = useCallback((expectedSessionId = currentSessionIdRef.current || '', delay = 240) => {
    if (isSupersededSession(expectedSessionId)) return;

    pendingNavigationRef.current = '';
    resizeInFlightRef.current = false;
    queuedResizeRef.current = null;
    lastResizeSignatureRef.current = '';
    pendingPointerDownRef.current = null;
    if (resizeTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = null;
    }
    if (pollTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    closeStream(expectedSessionId);
    clearCanvas();
    onStatePatch?.({
      remoteSessionId: '',
      remoteCommittedUrl: '',
      remoteRevision: 0,
      isLoading: true,
      error: ''
    });
    setReadySessionId('');
    scheduleRetry(delay);
  }, [clearCanvas, closeStream, isSupersededSession, onStatePatch, scheduleRetry]);

  const applyRemoteSnapshot = useCallback((session) => {
    if (!session) return;
    setReadySessionId(session.sessionId || '');

    onStatePatch?.({
      remoteSessionId: session.sessionId,
      remoteCommittedUrl: session.url,
      remoteRevision: session.revision,
      remoteViewportWidth: session.width,
      remoteViewportHeight: session.height,
      url: session.url || tab?.url,
      title: session.title || tab?.title,
      isLoading: Boolean(session.isLoading),
      canGoBack: Boolean(session.canGoBack),
      canGoForward: Boolean(session.canGoForward),
      error: session.error || ''
    });

    if (session.url) {
      onPersistedUpdate?.(session.url, session.title || tab?.title);
    }
  }, [onPersistedUpdate, onStatePatch, tab?.title, tab?.url]);

  const ensureCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (!canvasContextRef.current) {
      canvasContextRef.current = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true
      });
    }
    return canvasContextRef.current;
  }, []);

  const drawFrameToCanvas = useCallback((source, width, height) => {
    const canvas = canvasRef.current;
    const context = ensureCanvasContext();
    if (!canvas || !context || !width || !height) return;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);
    setHasFrame(true);
  }, [ensureCanvasContext]);

  const paintFrameBlob = useCallback(async (frameBlob, expectedSessionId) => {
    if (!frameBlob || isSupersededSession(expectedSessionId)) return;
    const drawSequence = ++frameDrawSequenceRef.current;

    try {
      if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(frameBlob);
        if (drawSequence !== frameDrawSequenceRef.current || isSupersededSession(expectedSessionId)) {
          bitmap.close();
          return;
        }
        drawFrameToCanvas(bitmap, bitmap.width, bitmap.height);
        bitmap.close();
        return;
      }

      if (typeof window === 'undefined' || typeof Image === 'undefined') return;
      const objectUrl = URL.createObjectURL(frameBlob);
      revokeFallbackImageUrl();
      fallbackImageUrlRef.current = objectUrl;

      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          if (drawSequence === frameDrawSequenceRef.current && !isSupersededSession(expectedSessionId)) {
            drawFrameToCanvas(image, image.naturalWidth || 0, image.naturalHeight || 0);
          }
          resolve();
        };
        image.onerror = reject;
        image.src = objectUrl;
      });
    } catch (error) {
      if (isSupersededSession(expectedSessionId)) return;
      onStatePatch?.({
        error: error instanceof Error ? error.message : 'Failed to paint the live browser frame.'
      });
    }
  }, [drawFrameToCanvas, isSupersededSession, onStatePatch, revokeFallbackImageUrl]);

  const sendStreamMessage = useCallback((payload, expectedSessionId = sessionId) => {
    const socket = streamSocketRef.current;
    if (
      !socket
      || streamSessionIdRef.current !== expectedSessionId
      || socket.readyState !== WebSocket.OPEN
    ) {
      return false;
    }

    try {
      socket.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }, [sessionId]);

  const ensureRemoteSize = useCallback(() => {
    if (!sessionId || !isSessionReady || !remoteApi?.resize || !containerRef.current || typeof window === 'undefined') return;
    const requestSessionId = sessionId;

    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const width = Math.min(1180, Math.max(960, Math.round(rect.width)));
    const height = Math.min(760, Math.max(540, Math.round(rect.height)));
    const sizeSignature = `${width}x${height}`;

    if (lastResizeSignatureRef.current === sizeSignature && !queuedResizeRef.current && !resizeInFlightRef.current) {
      return;
    }

    if (resizeInFlightRef.current) {
      queuedResizeRef.current = { width, height };
      return;
    }

    resizeInFlightRef.current = true;
    lastResizeSignatureRef.current = sizeSignature;

    onStatePatch?.({
      remoteViewportWidth: width,
      remoteViewportHeight: height
    });

    remoteApi.resize(requestSessionId, width, height)
      .then((session) => {
        if (isSupersededSession(requestSessionId)) return;
        applyRemoteSnapshot(session);
      })
      .catch((error) => {
        if (isSupersededSession(requestSessionId)) return;
        if (isRemoteSessionMissingError(error)) {
          resetRemoteSession(requestSessionId, 160);
          return;
        }
        onStatePatch?.({
          error: error instanceof Error ? error.message : 'Failed to resize the remote browser viewport.'
        });
      })
      .finally(() => {
        if (isSupersededSession(requestSessionId)) return;
        resizeInFlightRef.current = false;
        const queuedResize = queuedResizeRef.current;
        queuedResizeRef.current = null;
        if (!queuedResize) return;

        const queuedSignature = `${queuedResize.width}x${queuedResize.height}`;
        if (queuedSignature === lastResizeSignatureRef.current) return;

        if (typeof window !== 'undefined') {
          window.setTimeout(() => {
            if (isSupersededSession(requestSessionId)) return;
            ensureRemoteSize();
          }, 0);
        }
      });
  }, [applyRemoteSnapshot, isSessionReady, isSupersededSession, onStatePatch, remoteApi, resetRemoteSession, sessionId]);

  useEffect(() => {
    if (!remoteApi?.createSession || sessionId) return undefined;

    let cancelled = false;
    const rect = containerRef.current?.getBoundingClientRect?.();
    const width = Math.min(1180, Math.max(960, Math.round(rect?.width || DEFAULT_REMOTE_WIDTH)));
    const height = Math.min(760, Math.max(540, Math.round(rect?.height || DEFAULT_REMOTE_HEIGHT)));

    remoteApi.createSession({
      sessionId: tab?.id,
      profileId,
      url: normalizeRemoteUrl(tab?.url || KDBROWSER_HOME_URL),
      title: tab?.title || 'KDBROWSER',
      width,
      height,
      active
    }).then((session) => {
      if (cancelled || isSupersededSession(session?.sessionId || '')) return;
      applyRemoteSnapshot(session);
    }).catch((error) => {
      if (cancelled) return;
      onStatePatch?.({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start the remote browser session.'
      });
      scheduleRetry(900);
    });

    return () => {
      cancelled = true;
    };
  }, [active, applyRemoteSnapshot, isSupersededSession, onStatePatch, profileId, remoteApi, scheduleRetry, sessionId, tab?.id, tab?.title, tab?.url, retryToken]);

  useEffect(() => {
    if (!sessionId || !isSessionReady || !remoteApi?.getStreamUrl || typeof WebSocket === 'undefined') {
      closeStream(sessionId);
      return undefined;
    }

    let cancelled = false;
    const requestSessionId = sessionId;
    const streamUrl = remoteApi.getStreamUrl(requestSessionId);
    if (!streamUrl) return undefined;

    const scheduleReconnect = () => {
      if (cancelled || typeof window === 'undefined' || isSupersededSession(requestSessionId)) return;
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        openSocket();
      }, active ? 260 : 720);
    };

    const openSocket = () => {
      if (cancelled || isSupersededSession(requestSessionId)) return;
      closeStream(requestSessionId);
      setStreamConnected(false);

      const socket = new WebSocket(streamUrl);
      socket.binaryType = 'blob';
      streamSocketRef.current = socket;
      streamSessionIdRef.current = requestSessionId;

      socket.onopen = () => {
        if (cancelled || isSupersededSession(requestSessionId) || streamSocketRef.current !== socket) {
          socket.close();
          return;
        }
        setStreamConnected(true);
        sendStreamMessage({ type: 'activity', active }, requestSessionId);
      };

      socket.onmessage = (event) => {
        if (cancelled || isSupersededSession(requestSessionId) || streamSocketRef.current !== socket) return;

        if (typeof event.data === 'string') {
          try {
            const payload = JSON.parse(event.data);
            if (payload?.type === 'state') {
              applyRemoteSnapshot(payload.session);
              return;
            }
            if (payload?.type === 'error') {
              const error = new Error(payload.error || 'Remote browser stream failed.');
              if (isRemoteSessionMissingError(error)) {
                resetRemoteSession(requestSessionId, 140);
                return;
              }
              onStatePatch?.({
                error: error.message
              });
            }
          } catch {
            // Ignore malformed stream payloads.
          }
          return;
        }

        const nextFrameBlob = event.data instanceof Blob
          ? event.data
          : new Blob([event.data], { type: 'image/jpeg' });
        paintFrameBlob(nextFrameBlob, requestSessionId).catch(() => {});
      };

      socket.onerror = () => {
        if (streamSocketRef.current !== socket) return;
        setStreamConnected(false);
      };

      socket.onclose = () => {
        const isCurrentSocket = streamSocketRef.current === socket;
        if (isCurrentSocket) {
          streamSocketRef.current = null;
          streamSessionIdRef.current = '';
          setStreamConnected(false);
        }
        if (cancelled || isSupersededSession(requestSessionId) || !isCurrentSocket) return;
        scheduleReconnect();
      };
    };

    openSocket();
    return () => {
      cancelled = true;
      closeStream(requestSessionId);
    };
  }, [active, applyRemoteSnapshot, closeStream, isSessionReady, isSupersededSession, onStatePatch, paintFrameBlob, remoteApi, resetRemoteSession, sendStreamMessage, sessionId]);

  useEffect(() => {
    if (!sessionId || !isSessionReady) return undefined;
    const requestSessionId = sessionId;

    if (!sendStreamMessage({ type: 'activity', active }, requestSessionId)) {
      remoteApi?.setActivity?.(requestSessionId, active).catch(() => {});
    }

    return undefined;
  }, [active, isSessionReady, remoteApi, sendStreamMessage, sessionId]);

  useEffect(() => {
    if (!sessionId || !remoteApi?.getSession) return undefined;

    let cancelled = false;
    const clearPollTimeout = () => {
      if (pollTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(pollTimeoutRef.current);
      }
      pollTimeoutRef.current = null;
    };

    const poll = async () => {
      try {
        const session = await remoteApi.getSession(sessionId);
        if (cancelled || isSupersededSession(sessionId)) return;
        applyRemoteSnapshot(session);
      } catch (error) {
        if (cancelled) return;
        if (isRemoteSessionMissingError(error)) {
          clearPollTimeout();
          resetRemoteSession(sessionId, 180);
          return;
        }
        onStatePatch?.({
          error: error instanceof Error ? error.message : 'Failed to refresh the remote browser session.'
        });
      }

      if (!cancelled && typeof window !== 'undefined') {
        clearPollTimeout();
        pollTimeoutRef.current = window.setTimeout(poll, active ? ACTIVE_POLL_MS : IDLE_POLL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearPollTimeout();
    };
  }, [active, applyRemoteSnapshot, isSupersededSession, onStatePatch, remoteApi, resetRemoteSession, sessionId]);

  useEffect(() => {
    if (!sessionId || !remoteApi?.navigate) return undefined;

    const targetUrl = normalizeRemoteUrl(tab?.url || KDBROWSER_HOME_URL);
    const committedUrl = normalizeRemoteUrl(remoteState?.remoteCommittedUrl || remoteState?.url || targetUrl);
    if (targetUrl === committedUrl || pendingNavigationRef.current === targetUrl) {
      return undefined;
    }

    const requestSessionId = sessionId;
    pendingNavigationRef.current = targetUrl;
    remoteApi.navigate(requestSessionId, targetUrl)
      .then((session) => {
        pendingNavigationRef.current = '';
        if (isSupersededSession(requestSessionId)) return;
        applyRemoteSnapshot(session);
      })
      .catch((error) => {
        pendingNavigationRef.current = '';
        if (isSupersededSession(requestSessionId)) return;
        if (isRemoteSessionMissingError(error)) {
          resetRemoteSession(requestSessionId);
          return;
        }
        onStatePatch?.({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to navigate the remote browser session.'
        });
      });

    return undefined;
  }, [applyRemoteSnapshot, isSupersededSession, onStatePatch, remoteApi, remoteState?.remoteCommittedUrl, remoteState?.url, resetRemoteSession, sessionId, tab?.url]);

  useEffect(() => {
    if (!sessionId || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      if (typeof window === 'undefined') return;
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        ensureRemoteSize();
      }, 120);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (resizeTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [ensureRemoteSize, sessionId]);

  const toRemotePoint = useCallback((event) => {
    const rect = containerRef.current?.getBoundingClientRect?.();
    if (!rect?.width || !rect?.height) {
      return { x: 0, y: 0 };
    }

    const remoteWidth = remoteState?.remoteViewportWidth || DEFAULT_REMOTE_WIDTH;
    const remoteHeight = remoteState?.remoteViewportHeight || DEFAULT_REMOTE_HEIGHT;
    const x = Math.max(0, Math.min(remoteWidth, Math.round(((event.clientX - rect.left) / rect.width) * remoteWidth)));
    const y = Math.max(0, Math.min(remoteHeight, Math.round(((event.clientY - rect.top) / rect.height) * remoteHeight)));
    return { x, y };
  }, [remoteState?.remoteViewportHeight, remoteState?.remoteViewportWidth]);

  const sendInput = useCallback((inputEvent, { allowHttpFallback = true } = {}) => {
    if (!sessionId || !isSessionReady) return;
    const requestSessionId = sessionId;

    if (sendStreamMessage({ type: 'input', event: inputEvent }, requestSessionId)) {
      return;
    }

    if (!allowHttpFallback) {
      return;
    }

    remoteApi?.input?.(requestSessionId, inputEvent).catch((error) => {
      if (isSupersededSession(requestSessionId)) return;
      if (isRemoteSessionRecoverableError(error)) {
        resetRemoteSession(requestSessionId);
        return;
      }
      onStatePatch?.({
        error: error instanceof Error ? error.message : 'Failed to send input to the remote browser session.'
      });
    });
  }, [isSessionReady, isSupersededSession, onStatePatch, remoteApi, resetRemoteSession, sendStreamMessage, sessionId]);

  const handleMouseMove = useCallback((event) => {
    const pointerDown = pendingPointerDownRef.current;
    if (pointerDown) {
      const point = toRemotePoint(event);
      const movedEnough = Math.abs(point.x - pointerDown.x) > 6 || Math.abs(point.y - pointerDown.y) > 6;
      if (!pointerDown.flushed && movedEnough) {
        pointerDown.flushed = true;
        sendInput({
          type: 'mouseDown',
          x: pointerDown.x,
          y: pointerDown.y,
          button: pointerDown.button,
          clickCount: pointerDown.clickCount
        });
      }

      if (pointerDown.flushed) {
        sendInput({
          type: 'mouseMove',
          ...point
        }, { allowHttpFallback: false });
      }
      return;
    }

    const now = Date.now();
    if (now - lastMoveAtRef.current < 42) return;
    lastMoveAtRef.current = now;
    sendInput({
      type: 'mouseMove',
      ...toRemotePoint(event)
    }, { allowHttpFallback: false });
  }, [sendInput, toRemotePoint]);

  const handleMouseDown = useCallback((event) => {
    event.preventDefault();
    containerRef.current?.focus?.();
    const point = toRemotePoint(event);
    pendingPointerDownRef.current = {
      ...point,
      button: mapPointerButton(event.button),
      clickCount: Math.max(1, event.detail || 1),
      flushed: false
    };
  }, [toRemotePoint]);

  const handleMouseUp = useCallback((event) => {
    event.preventDefault();
    const point = toRemotePoint(event);
    const button = mapPointerButton(event.button);
    const clickCount = Math.max(1, event.detail || 1);
    const pointerDown = pendingPointerDownRef.current;
    pendingPointerDownRef.current = null;

    if (pointerDown && pointerDown.button === button) {
      const movedEnough = Math.abs(point.x - pointerDown.x) > 6 || Math.abs(point.y - pointerDown.y) > 6;
      if (!pointerDown.flushed && !movedEnough) {
        sendInput({
          type: 'mouseClick',
          ...point,
          button,
          clickCount
        });
        return;
      }

      if (!pointerDown.flushed) {
        sendInput({
          type: 'mouseDown',
          x: pointerDown.x,
          y: pointerDown.y,
          button: pointerDown.button,
          clickCount: pointerDown.clickCount
        });
      }
    }

    sendInput({
      type: 'mouseUp',
      ...point,
      button,
      clickCount
    });
  }, [sendInput, toRemotePoint]);

  const handleWheel = useCallback((event) => {
    sendInput({
      type: 'mouseWheel',
      ...toRemotePoint(event),
      deltaX: Math.round(event.deltaX),
      deltaY: Math.round(event.deltaY)
    }, { allowHttpFallback: false });
  }, [sendInput, toRemotePoint]);

  const handleKeyDown = useCallback((event) => {
    if (!sessionId) return;

    const keyCode = mapKeyboardKey(event.key);
    if (!keyCode) return;

    event.preventDefault();
    const isPlainTextInput = isPrintableKey(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (isPlainTextInput) {
      sendInput({
        type: 'char',
        keyCode: event.key,
        modifiers: getModifiers(event)
      });
      return;
    }

    sendInput({
      type: 'keyPress',
      keyCode,
      modifiers: getModifiers(event)
    });
  }, [sendInput, sessionId]);

  useEffect(() => () => {
    pendingPointerDownRef.current = null;
    closeStream();
    clearCanvas();
    if (retryTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(retryTimeoutRef.current);
    }
    if (pollTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(pollTimeoutRef.current);
    }
    if (resizeTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(resizeTimeoutRef.current);
    }
  }, [clearCanvas, closeStream]);

  return (
    <div
      ref={containerRef}
      role="application"
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        position: 'absolute',
        inset: 0,
        display: active ? 'block' : 'none',
        overflow: 'hidden',
        background: '#111827',
        outline: 'none',
        touchAction: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'auto'
        }}
      />

      {!hasFrame || remoteState?.isLoading ? (
        <div
          style={{
            position: 'absolute',
            right: '12px',
            bottom: '12px',
            padding: '8px 10px',
            borderRadius: '999px',
            background: 'rgba(15,23,42,0.78)',
            color: '#f8fafc',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          {streamConnected ? 'Streaming live browser...' : 'Connecting remote browser...'}
        </div>
      ) : null}
    </div>
  );
}
