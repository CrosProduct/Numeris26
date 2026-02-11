import { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';
import type { GameState, Slot, Difficulty, GameStats, DifficultyStats } from '../types';
import { generateRound, evaluateFormula } from '../utils/mathGenerator';

// Sounds (enable when files exist)
const soundWinShort = new Howl({ src: ['/sounds/win_short.mp3'] });
const soundFailShort = new Howl({ src: ['/sounds/fail_short.mp3'] });
const soundWinLong = new Howl({ src: ['/sounds/win_long.mp3'] });
const soundFailLong = new Howl({ src: ['/sounds/fail_long.mp3'] });
const soundBlow = new Howl({ src: ['/sounds/blow.mp3'] });
const soundUndo = new Howl({ src: ['/sounds/undo.mp3'] });
const soundStart = new Howl({ src: ['/sounds/start.mp3'] });
const soundFinal = new Howl({ src: ['/sounds/final.mp3'] });
const soundBubble = new Howl({ src: ['/sounds/bubble.mp3'] });

// Helper to get local date string YYYY-MM-DD
export const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function useGameLogic() {
    const [gameState, setGameState] = useState<GameState>({
        round: 1,
        formulas: [],
        poolNumbers: [],
        status: 'start',
        timer: 0,
        roundHistory: [],
        isNewRound: false,
        roundStartTime: 0,
        difficulty: 'medium', // Default
        isDailyChallenge: false,
        isReVisit: false,
    });

    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);
    const lastCountedRoundRef = useRef<string>(""); // Format: "difficulty-round"

    const [stats, setStats] = useState<GameStats>(() => {
        const saved = localStorage.getItem('numeris26-stats');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        const defaultDifficultyStats: Record<Difficulty, DifficultyStats> = {
            easy: { totalRounds: 0 },
            medium: { totalRounds: 0 },
            hard: { totalRounds: 0 },
        };

        const defaultStats: GameStats = {
            difficultyStats: defaultDifficultyStats,
            dailyChallenge: { date: today, status: 'none' },
            lastPlayedDate: today,
            startDate: today,
            streak: 0,
        };

        if (saved) {
            const parsed = JSON.parse(saved);
            // Migration: if it's the old format (has dailyCount/allTimeCount)
            if ('dailyCount' in parsed) {
                // Initialize new structure with old allTimeCount for Medium (just to preserve something)
                defaultDifficultyStats.medium.totalRounds = parsed.allTimeCount || 0;
                return { ...defaultStats, startDate: parsed.startDate || today };
            }

            const s = parsed as GameStats;
            // Ensure streak exists (migration)
            const currentStreak = s.streak ?? 0;

            // Handle date change
            if (s.lastPlayedDate !== today) {
                const updatedDifficultyStats = { ...s.difficultyStats };
                (Object.keys(updatedDifficultyStats) as Difficulty[]).forEach(d => {
                    updatedDifficultyStats[d] = { ...updatedDifficultyStats[d], todayBestTime: undefined };
                });

                // Check if previous day's challenge was completed
                const previousDayCompleted = s.dailyChallenge.status === 'completed';
                const newStreak = previousDayCompleted ? currentStreak : 0;

                return {
                    ...s,
                    difficultyStats: updatedDifficultyStats,
                    dailyChallenge: s.dailyChallenge.date === today ? s.dailyChallenge : { date: today, status: 'none' },
                    lastPlayedDate: today,
                    streak: newStreak
                };
            }
            return { ...s, streak: currentStreak };
        }

        return defaultStats;
    });

    // Save stats whenever they change
    useEffect(() => {
        localStorage.setItem('numeris26-stats', JSON.stringify(stats));
    }, [stats]);

    // Check for day change while app is running
    useEffect(() => {
        const checkDayChange = () => {
            const today = getLocalDateString();

            setStats(prev => {
                // If the stored date is different from today, perform reset
                if (prev.lastPlayedDate !== today) {
                    const updatedDifficultyStats = { ...prev.difficultyStats };
                    (Object.keys(updatedDifficultyStats) as Difficulty[]).forEach(d => {
                        updatedDifficultyStats[d] = { ...updatedDifficultyStats[d], todayBestTime: undefined };
                    });

                    return {
                        ...prev,
                        difficultyStats: updatedDifficultyStats,
                        dailyChallenge: prev.dailyChallenge.date === today ? prev.dailyChallenge : { date: today, status: 'none' },
                        lastPlayedDate: today
                    };
                }

                // Also check specifically for daily challenge date mismatch to be safe
                if (prev.dailyChallenge.date !== today) {
                    return {
                        ...prev,
                        dailyChallenge: { date: today, status: 'none' }
                    };
                }

                return prev;
            });
        };

        // Check immediately, then every minute, and on visibility change
        checkDayChange();
        const interval = setInterval(checkDayChange, 60000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkDayChange();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const incrementRoundCount = useCallback((roundId: string, difficulty: Difficulty) => {
        if (lastCountedRoundRef.current === roundId) return;
        lastCountedRoundRef.current = roundId;

        setStats(prev => {
            const newStats = { ...prev };
            newStats.difficultyStats[difficulty] = {
                ...newStats.difficultyStats[difficulty],
                totalRounds: (newStats.difficultyStats[difficulty].totalRounds || 0) + 1
            };
            return newStats;
        });
    }, []);

    const recordGameCompletion = useCallback((difficulty: Difficulty, isDaily: boolean, isReVisit: boolean, time: number) => {
        const today = getLocalDateString();
        setStats(prev => {
            const next = { ...prev, lastPlayedDate: today };

            if (isDaily && !isReVisit && prev.dailyChallenge.status === 'none') {
                next.dailyChallenge = { date: today, status: 'completed', time };
                // Increment streak on first completion of the day
                next.streak = (prev.streak || 0) + 1;
            } else if (!isDaily) {
                const current = next.difficultyStats[difficulty];
                const newTodayBest = current.todayBestTime ? Math.min(current.todayBestTime, time) : time;
                const newAllTimeBest = current.allTimeBestTime ? Math.min(current.allTimeBestTime, time) : time;
                next.difficultyStats[difficulty] = {
                    ...current,
                    todayBestTime: newTodayBest,
                    allTimeBestTime: newAllTimeBest
                };
            }
            return next;
        });
    }, []);

    const recordChallengeQuit = useCallback(() => {
        const today = getLocalDateString();
        setStats(prev => {
            if (prev.dailyChallenge.status === 'none') {
                return {
                    ...prev,
                    dailyChallenge: { date: today, status: 'quit' },
                    lastPlayedDate: today,
                    streak: 0 // Reset streak on quit
                };
            }
            return prev;
        });
    }, []);



    const playBubble = useCallback(() => {
        soundBubble.play();
    }, []);

    // Debug function to reset daily challenge
    const resetDailyChallenge = useCallback(() => {
        const today = getLocalDateString();
        setStats(prev => ({
            ...prev,
            dailyChallenge: { date: today, status: 'none' },
            lastPlayedDate: today
        }));
    }, []);

    const getDailySeed = useCallback(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return (now.getFullYear() * 1000) + dayOfYear;
    }, []);

    const startNextRound = useCallback((roundNum: number, currentDifficulty?: Difficulty, isDaily?: boolean, isReVisit?: boolean) => {
        const difficulty = currentDifficulty || gameState.difficulty;
        const isDailyChallenge = isDaily !== undefined ? isDaily : gameState.isDailyChallenge;
        const useSameOperator = (difficulty === 'easy' || difficulty === 'medium') && !isDailyChallenge;

        const seed = isDailyChallenge ? getDailySeed() : undefined;
        const { formulas, poolNumbers } = generateRound(roundNum, useSameOperator, seed);

        // Play start sound when round begins
        soundStart.play();



        // Set first slot of first formula as active
        if (formulas.length > 0 && formulas[0].slots.length > 0) {
            formulas[0].slots[0].isActive = true;
        }

        setGameState(prev => ({
            ...prev,
            round: roundNum,
            formulas,
            poolNumbers,
            status: 'playing',
            isNewRound: true,
            roundStartTime: Date.now(),
            roundDuration: undefined,
            isDailyChallenge,
            isReVisit: isReVisit !== undefined ? isReVisit : prev.isReVisit,
        }));
    }, [gameState.difficulty, gameState.isDailyChallenge, gameState.isReVisit, getDailySeed]);

    const startGame = useCallback((difficulty: Difficulty, isDailyChallenge: boolean = false, isReVisit: boolean = false) => {
        accumulatedTimeRef.current = 0;
        startTimeRef.current = Date.now();

        setGameState({
            round: 1,
            formulas: [],
            poolNumbers: [],
            status: 'start',
            timer: 0,
            roundHistory: [],
            isNewRound: false,
            roundStartTime: 0,
            roundDuration: undefined,
            difficulty: difficulty,
            isDailyChallenge,
            isReVisit,
        });

        lastCountedRoundRef.current = ""; // Reset for new game
        startNextRound(1, difficulty, isDailyChallenge);
    }, [startNextRound]);

    // Timer Logic: Start/Stop based on status
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = window.setInterval(() => {
            if (gameState.status !== 'playing') return;

            const now = Date.now();
            const elapsed = now - startTimeRef.current + accumulatedTimeRef.current;

            const roundElapsed = now - gameState.roundStartTime;

            if (roundElapsed >= 60000) {
                // Round Timeout!
                soundFailShort.play();
                soundFailLong.play();
                incrementRoundCount(`${gameState.difficulty}-${gameState.round}`, gameState.difficulty);

                setGameState(prev => {
                    const newHistory = [...prev.roundHistory, 'lost' as const];
                    const maxRounds = prev.difficulty === 'easy' ? 1 : 3;

                    setTimeout(() => {
                        if (prev.round < maxRounds) {
                            startNextRound(prev.round + 1);
                        } else {
                            if (prev.isDailyChallenge && !prev.isReVisit) {
                                recordChallengeQuit();
                            }
                            soundFinal.play();
                            setGameState(p => ({ ...p, status: 'game_over', roundHistory: newHistory }));
                        }
                    }, 2000);

                    return {
                        ...prev,
                        status: 'round_lost_anim',
                        timer: elapsed,
                        roundHistory: newHistory,
                        roundDuration: 60000
                    };
                });
                if (timerRef.current) clearInterval(timerRef.current);
                return;
            }

            setGameState(prev => ({ ...prev, timer: elapsed }));
        }, 30);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState.status, gameState.difficulty, gameState.roundStartTime, startNextRound, incrementRoundCount]);

    // Evaluation Effect
    useEffect(() => {
        if (gameState.status !== 'playing') return;

        const fullFormulaIndex = gameState.formulas.findIndex(f =>
            !f.isSolved && f.slots.every(s => s.value !== null)
        );

        if (fullFormulaIndex !== -1) {
            const formula = gameState.formulas[fullFormulaIndex];
            const [sA, sB, sC] = formula.slots;

            const isCorrect = evaluateFormula(sA.value!, sB.value!, sC.value!, formula.operator);

            if (isCorrect) {
                soundWinShort.play();
                const isLastFormula = fullFormulaIndex === 2;

                if (isLastFormula) {
                    soundWinLong.play();
                    incrementRoundCount(`${gameState.difficulty}-${gameState.round}`, gameState.difficulty);
                }

                setGameState(prev => {
                    const newFormulas = [...prev.formulas];
                    const currentF = { ...newFormulas[fullFormulaIndex], isSolved: true };
                    newFormulas[fullFormulaIndex] = currentF;

                    let roundWon = false;
                    if (fullFormulaIndex < 2) {
                        newFormulas[fullFormulaIndex + 1].slots[0].isActive = true;
                    } else {
                        roundWon = true;
                    }

                    const duration = Date.now() - prev.roundStartTime;
                    const newState = {
                        ...prev,
                        formulas: newFormulas,
                        roundDuration: duration
                    };

                    if (roundWon) {
                        const newHistory = [...prev.roundHistory, 'won' as const];
                        if (timerRef.current) clearInterval(timerRef.current);

                        const maxRounds = prev.difficulty === 'easy' ? 1 : 3;
                        const elapsedTotal = Date.now() - startTimeRef.current + accumulatedTimeRef.current;

                        if (prev.round < maxRounds) {
                            setTimeout(() => startNextRound(prev.round + 1), 2000);
                            newState.status = 'round_won_anim';
                        } else {
                            // WON THE ENTIRE GAME
                            recordGameCompletion(prev.difficulty, prev.isDailyChallenge, prev.isReVisit, elapsedTotal);
                            setTimeout(() => {
                                soundFinal.play();
                                setGameState(p => ({ ...p, status: 'game_over' }));
                            }, 2000);
                            newState.status = 'round_won_anim';
                        }
                        newState.roundHistory = newHistory;
                    }

                    return newState;
                });
            } else {
                soundFailShort.play();
                const timerId = setTimeout(() => {
                    soundUndo.play();
                    setGameState(prev => {
                        const newFormulas = prev.formulas.map(f => ({
                            ...f,
                            slots: f.slots.map(s => ({ ...s })) as [Slot, Slot, Slot]
                        }));
                        const newPool = [...prev.poolNumbers];
                        const currentF = newFormulas[fullFormulaIndex];
                        const resetSlots = currentF.slots.map(s => {
                            if (s.value !== null && s.sourceIndex !== undefined) {
                                newPool[s.sourceIndex] = s.value;
                            }
                            return {
                                ...s,
                                value: null,
                                sourceIndex: undefined,
                                isActive: false,
                                isError: false
                            };
                        });
                        resetSlots[0].isActive = true;
                        currentF.slots = resetSlots as [Slot, Slot, Slot];
                        return { ...prev, formulas: newFormulas, poolNumbers: newPool };
                    });
                }, 300);
                return () => clearTimeout(timerId);
            }
        }
    }, [gameState.formulas, gameState.status, gameState.roundStartTime, startNextRound, incrementRoundCount, recordGameCompletion]);

    const handleTileClick = useCallback((_val: number, poolIndex: number) => {
        if (gameState.status !== 'playing') return;

        setGameState(prev => {
            if (prev.status !== 'playing') return prev;

            let activeFIndex = -1;
            let activeSIndex = -1;

            outer: for (let f = 0; f < prev.formulas.length; f++) {
                for (let s = 0; s < 3; s++) {
                    if (prev.formulas[f].slots[s].isActive) {
                        activeFIndex = f;
                        activeSIndex = s;
                        break outer;
                    }
                }
            }

            if (activeFIndex === -1) return prev;
            if (prev.poolNumbers[poolIndex] === null) return prev;

            soundBlow.play();

            const newFormulas = prev.formulas.map(f => ({
                ...f,
                slots: [...f.slots] as [Slot, Slot, Slot]
            }));
            const newPool = [...prev.poolNumbers];

            const numberToMove = newPool[poolIndex]!;
            newPool[poolIndex] = null;

            const currentFormula = newFormulas[activeFIndex];
            const currentSlots = currentFormula.slots;

            currentSlots[activeSIndex] = {
                ...currentSlots[activeSIndex],
                value: numberToMove,
                sourceIndex: poolIndex,
                isActive: false,
            };

            let nextSIndex = activeSIndex + 1;
            if (nextSIndex < 3) {
                currentSlots[nextSIndex].isActive = true;
            }

            return {
                ...prev,
                formulas: newFormulas,
                poolNumbers: newPool,
                isNewRound: false,
            };
        });
    }, [gameState.status]);

    const handleUndo = useCallback((fIndex: number, sIndex: number) => {
        setGameState(prev => {
            const newFormulas = prev.formulas.map(f => ({
                ...f,
                slots: f.slots.map(s => ({ ...s })) as [Slot, Slot, Slot]
            }));
            const newPool = [...prev.poolNumbers];
            const clickedFormula = newFormulas[fIndex];
            const clickedSlot = clickedFormula.slots[sIndex];

            if (clickedSlot.value === null) return prev;

            soundUndo.play();

            for (let f = 0; f < 3; f++) {
                if (f < fIndex) continue;
                const formula = newFormulas[f];
                const startS = (f === fIndex) ? sIndex : 0;
                for (let s = startS; s < 3; s++) {
                    const slot = formula.slots[s];
                    if (slot.value !== null && slot.sourceIndex !== undefined) {
                        newPool[slot.sourceIndex] = slot.value;
                        slot.value = null;
                        slot.sourceIndex = undefined;
                    }
                    slot.isActive = false;
                    formula.isSolved = false;
                }
            }

            clickedFormula.slots[sIndex].isActive = true;

            return {
                ...prev,
                formulas: newFormulas,
                poolNumbers: newPool
            };
        });
    }, []);

    const quitGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        soundFailLong.play();

        if (gameState.isDailyChallenge && !gameState.isReVisit) {
            recordChallengeQuit();
        }

        setGameState(prev => ({ ...prev, status: 'start' }));
    }, [gameState.isDailyChallenge, gameState.isReVisit, recordChallengeQuit]);

    const goToStart = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        soundBubble.play();
        setGameState(prev => ({ ...prev, status: 'start' }));
    }, []);

    return {
        gameState,
        startGame,
        quitGame,
        goToStart,
        handleTileClick,
        handleUndo,
        roundStartTime: gameState.roundStartTime,
        stats,
        playBubble,
        getDailySeed,
        resetDailyChallenge
    };
}
