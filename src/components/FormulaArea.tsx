import type { Formula, Slot } from '../types';
import { Tile } from './Tile';

interface FormulaAreaProps {
    formulas: Formula[];
    onUndo: (fIndex: number, sIndex: number) => void;
    round: number;
}

const SlotComponent = ({ slot, fIndex, sIndex, onUndo, round }: { slot: Slot, fIndex: number, sIndex: number, onUndo: any, round: number }) => {
    const classes = `slot ${slot.isActive ? 'active' : ''} ${slot.isError ? 'error' : ''}`;

    return (
        <div className={classes}>
            {slot.value !== null && slot.sourceIndex !== undefined && (
                <Tile
                    id={slot.sourceIndex}
                    value={slot.value}
                    onClick={() => onUndo(fIndex, sIndex)}
                    round={round}
                    draggable={true}
                />
            )}
        </div>
    );
};

export const FormulaArea = ({ formulas, onUndo, round }: FormulaAreaProps) => {
    return (
        <div className="formula-area">
            {formulas.map((formula, fIndex) => (
                <div key={formula.id} className="formula-row">
                    <SlotComponent slot={formula.slots[0]} fIndex={fIndex} sIndex={0} onUndo={onUndo} round={round} />

                    <span className="operator">{formula.operator === 'x' ? '×' : formula.operator}</span>

                    <SlotComponent slot={formula.slots[1]} fIndex={fIndex} sIndex={1} onUndo={onUndo} round={round} />

                    <span className="equals">=</span>

                    <SlotComponent slot={formula.slots[2]} fIndex={fIndex} sIndex={2} onUndo={onUndo} round={round} />
                </div>
            ))}
        </div>
    );
};
