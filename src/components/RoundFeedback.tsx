import { motion, AnimatePresence } from 'framer-motion';

interface RoundFeedbackProps {
    status: 'round_won_anim' | 'round_lost_anim';
    duration?: number;
}

export const RoundFeedback = ({ status, duration }: RoundFeedbackProps) => {
    const isWin = status === 'round_won_anim';

    const formatTime = (ms: number) => {
        const min = Math.floor(ms / 60000);
        const sec = Math.floor((ms % 60000) / 1000);
        const msec = ms % 1000;
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${msec.toString().padStart(3, '0')}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                className="feedback-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    zIndex: 50,
                    pointerEvents: 'none',
                    gap: '2rem'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '50%',
                            backgroundColor: isWin ? '#22c55e' : '#ef4444',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}
                    >
                        {isWin ? (
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ) : (
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        )}
                    </motion.div>

                    {isWin && duration !== undefined && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                fontSize: '1.2rem',
                                fontWeight: 500,
                                color: '#6b7280' // Grey color
                            }}
                        >
                            Round completed in {formatTime(duration)}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
