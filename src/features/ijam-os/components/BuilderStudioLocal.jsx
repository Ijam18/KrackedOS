import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import BugSquash from '../../../components/game/BugSquash';

const LOCAL_GAME_KEY = 'ijamos_game_state';

const DEFAULT_GAME_STATE = {
  vibes: 0,
  total_vibes_earned: 0,
  level: 1,
  xp: 0,
  last_idle_claim: new Date().toISOString()
};

const getLevel = (xp) => {
  if (xp >= 2500) return 7;
  if (xp >= 1500) return 6;
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
};

export default function BuilderStudioLocal() {
  const [loading, setLoading] = useState(true);
  const [playingBugSquash, setPlayingBugSquash] = useState(false);
  const [gameState, setGameState] = useState(DEFAULT_GAME_STATE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_GAME_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setGameState({ ...DEFAULT_GAME_STATE, ...parsed });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(LOCAL_GAME_KEY, JSON.stringify(gameState));
    }
  }, [gameState, loading]);

  const stats = useMemo(() => {
    const level = getLevel(gameState.xp || 0);
    return {
      level,
      toNext: Math.max(0, (level * 150) - (gameState.xp || 0))
    };
  }, [gameState.xp]);

  const handleBugSquashComplete = (score) => {
    setPlayingBugSquash(false);
    if (score <= 0) return;

    setGameState((prev) => {
      const nextXp = (prev.xp || 0) + score;
      const nextLevel = getLevel(nextXp);
      return {
        ...prev,
        vibes: (prev.vibes || 0) + score,
        total_vibes_earned: (prev.total_vibes_earned || 0) + score,
        xp: nextXp,
        level: nextLevel,
        last_idle_claim: new Date().toISOString()
      };
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)', minHeight: '100%' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <div>Loading Local Studio...</div>
      </div>
    );
  }

  return (
    <div className="os-thin-scroll" style={{ padding: '14px', minHeight: '100%', background: 'linear-gradient(180deg, #f7faff 0%, #edf3fb 100%)', color: '#0f172a', overflowY: 'auto' }}>
      <div style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(148,163,184,0.24)', borderRadius: '18px', padding: '18px', boxShadow: '0 16px 40px rgba(148,163,184,0.16)', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '6px' }}>LOCAL ARCADE</div>
        <div style={{ fontSize: '24px', color: '#0f172a', fontWeight: 700 }}>Builder Studio</div>
        <div style={{ fontSize: '13px', color: '#475569', marginTop: '6px' }}>Local-only arcade mode with browser-saved progress.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(148,163,184,0.24)', borderRadius: '18px', padding: '16px', boxShadow: '0 16px 40px rgba(148,163,184,0.16)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>LEVEL</div>
          <div style={{ fontSize: '24px', color: '#0f172a', fontWeight: 700 }}>{stats.level}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(148,163,184,0.24)', borderRadius: '18px', padding: '16px', boxShadow: '0 16px 40px rgba(148,163,184,0.16)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>VIBES</div>
          <div style={{ fontSize: '24px', color: '#047857', fontWeight: 700 }}>{gameState.vibes || 0}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(148,163,184,0.24)', borderRadius: '18px', padding: '16px', boxShadow: '0 16px 40px rgba(148,163,184,0.16)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>XP</div>
          <div style={{ fontSize: '24px', color: '#0369a1', fontWeight: 700 }}>{gameState.xp || 0}</div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(148,163,184,0.24)', borderRadius: '18px', padding: '16px', boxShadow: '0 16px 40px rgba(148,163,184,0.16)' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          className="btn"
          onClick={() => setPlayingBugSquash(true)}
          style={{ background: 'rgba(37,99,235,0.12)', color: '#0f172a', border: '1px solid rgba(29,78,216,0.22)', fontWeight: 700, borderRadius: '12px' }}
        >
          PLAY BUG SQUASH
        </button>
        <button
          className="btn"
          onClick={() => setGameState(DEFAULT_GAME_STATE)}
          style={{ background: '#fff1f2', color: '#be123c', border: '1px solid rgba(244,63,94,0.18)', fontWeight: 700, borderRadius: '12px' }}
        >
          RESET LOCAL STATS
        </button>
      </div>

      <div style={{ marginTop: '14px', fontSize: '12px', color: '#64748b' }}>
        Local-only arcade mode active. Progress is saved in browser storage.
      </div>
      </div>

      {playingBugSquash && (
        <BugSquash
          onComplete={handleBugSquashComplete}
          onClose={() => setPlayingBugSquash(false)}
        />
      )}
    </div>
  );
}
