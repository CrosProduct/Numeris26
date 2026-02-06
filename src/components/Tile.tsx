import { motion } from 'framer-motion';

interface TileProps {
    id: number; // Unique ID (source index)
    value: number;
    onClick: () => void;
    initial?: any;
    animate?: any;
    round: number;
    draggable?: boolean;
}

export const Tile = ({ id, value, onClick, initial, animate, round, draggable = false }: TileProps) => {
    return (
        <motion.div
            layoutId={`tile-r${round}-${id}`}
            className="tile"
            onPointerDown={onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={initial}
            animate={animate}
            drag={draggable}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            transition={{
                type: "spring",
                stiffness: 800,
                damping: 40,
                mass: 1
            }}
        >
            {value}
        </motion.div>
    );
};
