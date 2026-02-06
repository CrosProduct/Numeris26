import { useEffect, useState } from 'react';

interface TimerBarProps {
    roundStartTime: number;
    currentTime: number;
    isPlaying: boolean;
}

export const TimerBar = ({ roundStartTime, currentTime, isPlaying, finalDuration }: TimerBarProps & { finalDuration?: number }) => {
    const [blink, setBlink] = useState(false);

    const elapsed = finalDuration !== undefined ? finalDuration : (currentTime - roundStartTime);
    const progress = Math.min((elapsed / 60000) * 100, 100); // 60000ms = 1 minute
    const isWarning = elapsed >= 50000; // Last 10 seconds

    // Blink effect for last 10 seconds
    useEffect(() => {
        if (!isWarning || (!isPlaying && finalDuration === undefined)) return;

        const interval = setInterval(() => {
            setBlink(prev => !prev);
        }, 500); // Blink every 500ms

        return () => clearInterval(interval);
    }, [isWarning, isPlaying, finalDuration]);

    // Determine if we should show based on isPlaying OR if we are in animation state (checked via App)
    // But we let App decide whether to render the component at all.

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '5px',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: isWarning
                        ? (blink ? '#ef4444' : '#dc2626')
                        : '#3b82f6',
                    transition: (isWarning || finalDuration !== undefined) ? 'none' : 'width 0.1s linear',
                }}
            />
        </div>
    );
};
