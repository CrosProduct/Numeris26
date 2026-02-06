import { Tile } from './Tile';
import { AnimatePresence } from 'framer-motion';

interface PoolAreaProps {
    poolNumbers: (number | null)[];
    onTileClick: (val: number, index: number) => void;
    isNewRound?: boolean;
    round: number;
}

export const PoolArea = ({ poolNumbers, onTileClick, isNewRound = false, round }: PoolAreaProps) => {
    return (
        <div className="pool-area">
            <div className="pool-grid">
                {poolNumbers.map((num, i) => (
                    <div key={i} className="pool-slot">
                        <AnimatePresence mode="wait">
                            {num !== null && (
                                <Tile
                                    key={`pool-r${round}-${i}-${num}`}
                                    id={i}
                                    value={num}
                                    onClick={() => onTileClick(num, i)}
                                    round={round}
                                    initial={isNewRound ? { scale: 0.5, opacity: 0 } : undefined}
                                    animate={isNewRound ? {
                                        scale: 1,
                                        opacity: 1,
                                        transition: {
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 25,
                                            delay: i * 0.03
                                        }
                                    } : undefined}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};
