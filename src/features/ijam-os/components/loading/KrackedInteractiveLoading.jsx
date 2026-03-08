import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './KrackedInteractiveLoading.css';

const ASSETS = {
    sky: '/kdacademy/assets/backgrounds/sky.png',
    far: '/kdacademy/assets/boot/boot-layer-far.png',
    mid: '/kdacademy/assets/boot/boot-layer-mid.png',
    front: '/kdacademy/assets/boot/boot-layer-front.png'
};

const SPARKLES = [
    { x: '8%', y: '10%', size: 8, delay: 0.1 },
    { x: '14%', y: '28%', size: 6, delay: 1.1 },
    { x: '50%', y: '14%', size: 7, delay: 0.5 },
    { x: '84%', y: '12%', size: 8, delay: 0.7 },
    { x: '90%', y: '28%', size: 5, delay: 1.4 },
    { x: '18%', y: '72%', size: 6, delay: 0.3 },
    { x: '76%', y: '74%', size: 7, delay: 1.6 }
];

function splitDateLines(value) {
    const lines = String(value || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

    return lines.length ? lines : ['Sun', 'Mar 8', '2026'];
}

function Layer({ className, src, animate, transition }) {
    return (
        <motion.img
            alt=""
            aria-hidden="true"
            className={className}
            draggable="false"
            src={src}
            animate={animate}
            transition={transition}
        />
    );
}

function SegmentedProgress({ progress }) {
    const segments = 20;
    const filled = Math.round((Math.max(0, Math.min(100, progress || 0)) / 100) * segments);

    return (
        <div className="boot-progress-track" aria-hidden="true">
            {Array.from({ length: segments }).map((_, index) => (
                <span
                    key={index}
                    className={`boot-progress-segment ${index < filled ? 'is-filled' : ''}`}
                />
            ))}
        </div>
    );
}

const KrackedInteractiveLoading = ({
    bootPhase,
    bootProgress,
    onConfirmBoot,
    systemTime,
    systemDate
}) => {
    const isProgressPhase = bootPhase === 'booting' || bootPhase === 'waking';
    const phaseLabel = isProgressPhase ? 'PORTAL STABILIZING' : 'LOCAL BUILDER ONLINE';
    const helperLabel = isProgressPhase ? 'LOADING QUEST DATA...' : 'YOUR ADVENTURE AWAITS';
    const dateLines = splitDateLines(systemDate);

    return (
        <AnimatePresence mode="wait">
            <motion.section
                id="resources-page"
                key="interactive-lock-screen"
                className="boot-screen-root"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="boot-scene">
                    <Layer
                        className="boot-layer boot-layer-sky"
                        src={ASSETS.sky}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    />
                    <Layer
                        className="boot-layer boot-layer-far"
                        src={ASSETS.far}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="boot-halftone-band" />
                    <Layer
                        className="boot-layer boot-layer-mid"
                        src={ASSETS.mid}
                        animate={{ y: [0, 3, 0] }}
                        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                    />
                    <Layer
                        className="boot-layer boot-layer-front"
                        src={ASSETS.front}
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                    />
                    <div className="boot-scene-shade" />
                    <div className="boot-scanlines" />
                    <motion.div
                        className="boot-scan-sweep"
                        animate={{ y: ['-18%', '110%'] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    />
                    {SPARKLES.map((sparkle, index) => (
                        <motion.div
                            key={index}
                            className="boot-sparkle"
                            style={{
                                left: sparkle.x,
                                top: sparkle.y,
                                width: `${sparkle.size}px`,
                                height: `${sparkle.size}px`
                            }}
                            animate={{ y: [0, -7, 0], opacity: [0.45, 1, 0.45], scale: [1, 1.2, 1] }}
                            transition={{ duration: 3.2 + sparkle.delay, delay: sparkle.delay, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    ))}
                    <div className="boot-horizon-glow" />
                </div>

                <div className="boot-content">
                    <motion.div
                        className="boot-brand"
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="boot-brand-title" aria-label="<KD/>">
                            <img
                                src="/kdacademy/assets/boot/boot-brand-kd.svg"
                                alt="<KD/>"
                                className="boot-brand-logo"
                                draggable="false"
                            />
                        </div>
                        <div className="boot-brand-stack">
                            <div className="boot-brand-subtitle">
                                <span className="boot-brand-subtitle-main">KRACKED</span>
                                <span className="boot-brand-subtitle-accent">DEVS</span>
                            </div>
                            <div className="boot-brand-caption">FROM MALAYSIA</div>
                            <div className="boot-brand-caption">FOR EVERYONE</div>
                        </div>
                    </motion.div>

                    <div className="boot-tagline">READY TO MASTER VIBE CODING?</div>

                    <motion.div
                        className="boot-panel"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.45, delay: 0.1 }}
                    >
                        <button
                            type="button"
                            className="boot-close-button"
                            title="Close OS"
                            onClick={() => window.dispatchEvent(new CustomEvent('close-ijam-os'))}
                        >
                            X
                        </button>

                        <div className="boot-panel-header">
                            <span className="boot-panel-orb" />
                            <span className="boot-panel-orb" />
                            <span className="boot-panel-orb" />
                            <div className="boot-panel-label">KRACKED PORTAL</div>
                        </div>

                        <div className="boot-panel-body">
                            <div className="boot-status-card">
                                <div className="boot-time">{systemTime || '06:41 AM'}</div>
                                <div className="boot-date">
                                    {dateLines.map((line) => (
                                        <div key={line}>{line}</div>
                                    ))}
                                </div>
                                <div className="boot-status-pill">{phaseLabel}</div>
                            </div>

                            <div className="boot-action-card">
                                <div className="boot-helper">{helperLabel}</div>
                                <motion.button
                                    type="button"
                                    className="boot-enter-button"
                                    onClick={onConfirmBoot}
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.96, y: 1 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    CLICK
                                    <br />
                                    TO ENTER
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="boot-footer">
                    {isProgressPhase && (
                        <div className="boot-progress-shell">
                            <div className="boot-progress-label">LOADING... {Math.round(bootProgress || 0)}%</div>
                            <SegmentedProgress progress={bootProgress} />
                        </div>
                    )}
                </div>
            </motion.section>
        </AnimatePresence>
    );
};

export default KrackedInteractiveLoading;
