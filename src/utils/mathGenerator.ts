import type { Formula, Operator, Slot } from '../types';

// Seeded random number generator (Mulberry32)
// Returns a function that generates a random float between 0 and 1
export function createRNG(seed: number) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export function getRandomInt(min: number, max: number, rng?: () => number): number {
    const r = rng ? rng() : Math.random();
    return Math.floor(r * (max - min + 1)) + min;
}

export function getRandomOperator(rng?: () => number): Operator {
    const ops: Operator[] = ['+', '-', 'x', '/'];
    const r = rng ? rng() : Math.random();
    return ops[Math.floor(r * ops.length)];
}

export interface RoundData {
    formulas: Formula[];
    poolNumbers: number[];
}

export function generateRound(roundId: number, useSameOperator: boolean = false, baseSeed?: number): RoundData {
    const rng = baseSeed !== undefined ? createRNG(baseSeed + roundId) : undefined;

    const formulas: Formula[] = [];
    const poolNumbers: number[] = [];
    const fixedOperator = useSameOperator ? getRandomOperator(rng) : null;

    for (let i = 0; i < 3; i++) {
        const operator = fixedOperator || getRandomOperator(rng);
        let nA, nB, nC;

        if (operator === '/') {
            nB = getRandomInt(1, 10, rng);
            nC = getRandomInt(1, 10, rng);
            nA = nB * nC;
        } else {
            nA = getRandomInt(0, 10, rng);
            nB = getRandomInt(0, 10, rng);

            if (operator === '+') {
                nC = nA + nB;
            } else if (operator === '-') {
                nC = nA - nB;
            } else { // x
                nC = nA * nB;
            }
        }

        // Create Initial Slots (Empty)
        // IDs: A, B, C. 
        // Formula ID: f1, f2, f3. So slots: s1A, s1B...
        const fId = `f${i + 1}`;

        // We store the numbers generated in the pool
        poolNumbers.push(nA, nB, nC);

        const slotA: Slot = { id: `s${i + 1}A`, value: null, isActive: false, isError: false };
        const slotB: Slot = { id: `s${i + 1}B`, value: null, isActive: false, isError: false };
        const slotC: Slot = { id: `s${i + 1}C`, value: null, isActive: false, isError: false };

        formulas.push({
            id: fId,
            operator,
            slots: [slotA, slotB, slotC],
            isSolved: false,
        });
    }

    // Shuffle pool
    for (let i = poolNumbers.length - 1; i > 0; i--) {
        const r = rng ? rng() : Math.random();
        const j = Math.floor(r * (i + 1));
        [poolNumbers[i], poolNumbers[j]] = [poolNumbers[j], poolNumbers[i]];
    }

    return { formulas, poolNumbers };
}

export function evaluateFormula(a: number, b: number, c: number, op: Operator): boolean {
    switch (op) {
        case '+': return a + b === c;
        case '-': return a - b === c;
        case 'x': return a * b === c;
        case '/': return b !== 0 && a / b === c;
        default: return false;
    }
}
