import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KRACKED_COLORS } from '../../constants/theme';

/* ── Main Component ──────────────────────────────────── */
const KrackedInteractiveLoading = ({
    bootPhase,
    bootProgress,
    onConfirmBoot,
    systemTime,
    systemDate
}) => {
    const isReady = bootPhase === 'ready';
    const isIdle = bootPhase === 'idle';
    const isBooting = bootPhase === 'booting' || bootPhase === 'waking';

    return (
        <AnimatePresence mode="wait">
            <motion.section
                id="resources-page"
                key="interactive-lock-screen"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 2, filter: 'blur(20px)' }}
                transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: (typeof window !== 'undefined' && window.innerWidth <= 640) ? 'url("/media/KDPhoneWallpaper.png")' : 'url("/media/KDLoadscreen.png")',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    userSelect: 'none',
                    fontFamily: '"Press Start 2P", "Courier New", monospace',
                    color: '#f8fafc',
                    zIndex: 1000
                }}
            >
                {/* ── Scoped CSS animations ── */}
                <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                        
                        @keyframes kil-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
                        @keyframes kil-glow { 0%,100%{opacity:0.4} 50%{opacity:1} }
                        @keyframes kil-scan {
                            0%  { transform: translateY(-100%); opacity:0 }
                            30% { opacity:0.1 }
                            70% { opacity:0.1 }
                            100%{ transform: translateY(100vh); opacity:0 }
                        }

                        /* Mobile refinements */
                        @media (max-width: 640px) {
                            .panel-cluster {
                                transform: scale(0.9) translateY(-5%) !important;
                                top: 25% !important;
                                bottom: 25% !important;
                                left: 5% !important;
                                right: 5% !important;
                            }
                            .sky-text {
                                top: 8% !important;
                                font-size: 8px !important;
                                width: 90% !important;
                                padding: 0 10px !important;
                            }
                        }

                        /* Ultra-narrow (Fold/Small Phones) */
                        @media (max-width: 360px) {
                            .panel-cluster {
                                transform: scale(0.75) translateY(-10%) !important;
                            }
                        }
                    `}</style>

                {/* Scan line overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    overflow: 'hidden', pointerEvents: 'none',
                    zIndex: 10
                }}>
                    <div style={{
                        width: '100%', height: '4px',
                        background: 'linear-gradient(90deg, transparent, rgba(245,208,0,0.1), transparent)',
                        animation: 'kil-scan 4s linear infinite'
                    }} />
                </div>

                {/* ── Interactive UI Layer (Pinned to Box) ── */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    maxWidth: '1920px',
                    maxHeight: '1080px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>

                    {/* Functional Box Overlay */}
                    <div className="panel-cluster" style={{
                        position: 'absolute',
                        top: '21%',
                        left: '10%',
                        right: '10%',
                        bottom: '23%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease'
                    }}>
                        {/* Header Row: "X" Close Button */}
                        <div style={{ height: '11%', position: 'relative' }}>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('close-ijam-os'))}
                                style={{
                                    position: 'absolute',
                                    right: '2.5%',
                                    top: '15%',
                                    width: '4%',
                                    minWidth: '24px',
                                    height: '70%',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    zIndex: 20
                                }}
                                title="Close OS"
                            />
                        </div>

                        {/* Main Body (Clock & Button) */}
                        <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                            {/* Left Panel (Brown Box): Clock, Date & Encouragement */}
                            <div style={{
                                width: '45.5%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                paddingRight: '0%'
                            }}>
                                <div style={{
                                    color: '#fff',
                                    fontFamily: '"Press Start 2P"',
                                    textAlign: 'center',
                                    textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginRight: '-8px',
                                    marginTop: '-20px'
                                }}>
                                    <div style={{ fontSize: 'clamp(10px, 3vw, 14px)' }}>{systemTime}</div>
                                    <div style={{
                                        fontSize: 'clamp(8px, 2.5vw, 12px)',
                                        opacity: 0.8,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        lineHeight: '1.2'
                                    }}>
                                        {systemDate.split(',').map((part, i, arr) => (
                                            <div key={i}>
                                                {part.trim()}{i < arr.length - 1 ? ',' : ''}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Gap between panels */}
                            <div style={{ width: '9%' }} />

                            {/* Right Panel (Light Brown Box): CLICK TO ENTER */}
                            <div style={{
                                width: '45.5%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '0%'
                            }}>
                                <motion.button
                                    onClick={onConfirmBoot}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: '4px 8px',
                                        width: 'fit-content',
                                        minWidth: '80px',
                                        background: '#f5d000',
                                        color: '#000',
                                        fontSize: 'clamp(7px, 2vw, 9px)',
                                        fontWeight: 900,
                                        cursor: 'pointer',
                                        fontFamily: '"Press Start 2P"',
                                        textTransform: 'uppercase',
                                        border: 'none',
                                        outline: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: '-12px',
                                        marginTop: '-20px',
                                        boxShadow: `
                                                inset -2px -2px 0px 0px #b59b00,
                                                inset 2px 2px 0px 0px #fff7cc,
                                                2px 2px 0px 0px #000
                                            `
                                    }}
                                >
                                    CLICK<br />TO ENTER
                                </motion.button>
                            </div>
                        </div>

                        {/* Encouragement Typing Animation (In the Sky) */}
                        <motion.div
                            className="sky-text"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: { opacity: 1 },
                                visible: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.08,
                                        delayChildren: 2.0
                                    }
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: '10%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: 'clamp(7px, 2.5vw, 10px)',
                                color: '#f5d000',
                                fontFamily: '"Press Start 2P"',
                                textAlign: 'center',
                                textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
                                zIndex: 10,
                                width: '100%',
                                padding: '0 20px'
                            }}
                        >
                            {"READY TO MASTER VIBE CODING?".split("").map((char, i) => (
                                <motion.span
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, display: 'none' },
                                        visible: { opacity: 1, display: 'inline' }
                                    }}
                                >
                                    {char}
                                </motion.span>
                            ))}
                        </motion.div>
                    </div>

                </div>

                {/* Progress Bar (Very bottom fixed) */}
                {!isIdle && (
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 'clamp(150px, 40%, 600px)',
                        height: '6px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <motion.div
                            style={{
                                height: '100%',
                                background: '#f5d000',
                                width: `${bootProgress}%`
                            }}
                        />
                    </div>
                )}
            </motion.section>
        </AnimatePresence>
    );
};

export default KrackedInteractiveLoading;

