export type Operator = '+' | '-' | 'x' | '/';

export interface Slot {
    id: string; // e.g., 's1A', 's1B', 's1C'
    value: number | null; // The number placed here, or null if empty
    sourceIndex?: number; // Index in the pool where this number came from (for returning on fail/undo)
    expectedValue?: number; // Optional: needed for validation if we pre-calculate? Or we evaluate dynamically.
    isActive: boolean; // Is this the current target for the next tile?
    isError: boolean; // For visual feedback
}

export interface Formula {
    id: string; // 'f1', 'f2', 'f3'
    slots: [Slot, Slot, Slot]; // [A, B, C]
    operator: Operator;
    isSolved: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DifficultyStats {
    totalRounds: number;
    todayBestTime?: number; // in ms
    allTimeBestTime?: number; // in ms
}

export interface DailyChallengeState {
    date: string; // YYYY-MM-DD
    status: 'none' | 'quit' | 'completed';
    time?: number; // Total game time in ms
}

export interface GameStats {
    difficultyStats: Record<Difficulty, DifficultyStats>;
    dailyChallenge: DailyChallengeState;
    lastPlayedDate: string; // ISO date string (YYYY-MM-DD)
    startDate: string; // ISO date string
    streak: number; // Consecutive days of completed daily challenges
}

export interface GameState {
    round: number; // 1-x
    formulas: Formula[];
    poolNumbers: (number | null)[]; // The 9 numbers available in the pool (null if empty)
    status: 'start' | 'playing' | 'round_won_anim' | 'round_lost_anim' | 'game_over';
    timer: number; // Time in milliseconds
    roundHistory: ('won' | 'lost')[];
    isNewRound: boolean; // Track if this is a fresh round start for animations
    roundStartTime: number; // Unix timestamp in ms
    roundDuration?: number; // Duration of the round in ms (for feedback)
    difficulty: Difficulty;
    isDailyChallenge: boolean;
    isReVisit: boolean;
}
