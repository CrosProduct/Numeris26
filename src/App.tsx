
import { useGameLogic } from './hooks/useGameLogic';
import { FormulaArea } from './components/FormulaArea';
import { PoolArea } from './components/PoolArea';
import { RoundFeedback } from './components/RoundFeedback';
import { TimerBar } from './components/TimerBar';
import type { Difficulty } from './types';
import './components/Layout.css';
import { useState } from 'react';

function App() {
  const { gameState, startGame, quitGame, goToStart, handleTileClick, handleUndo, roundStartTime, stats, playBubble, getDailySeed } = useGameLogic();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [punchedButton, setPunchedButton] = useState<string | null>(null);

  const handleDifficultyChange = (d: Difficulty) => {
    setSelectedDifficulty(d);
    playBubble();
    setPunchedButton(`diff-${d}`);
    setTimeout(() => setPunchedButton(null), 200);
  };

  const formatTime = (ms?: number) => {
    if (ms === undefined) return '--:--.---';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const msec = ms % 1000;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${msec.toString().padStart(3, '0')}`;
  };

  const formatDisplayNameDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  const convertToEmojiNumbers = (text: string) => {
    const map: { [key: string]: string } = {
      '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
      '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣'
    };
    return text.split('').map(char => map[char] || char).join('');
  };

  const handleShare = async () => {
    if (stats.dailyChallenge.status === 'none') return;

    const timeText = formatTime(stats.dailyChallenge.time);
    const emojiTime = convertToEmojiNumbers(timeText);
    const dateStr = formatDisplayNameDate(stats.dailyChallenge.date);

    const resultText = stats.dailyChallenge.status === 'completed'
      ? `Completed in ${emojiTime}`
      : 'Quit';

    const shareText = `Numeris Daily Challenge\n${resultText}\non ${dateStr}`;
    const shareUrl = 'https://numeris26-76e59.web.app';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Numeris26',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          alert("Copied to clipboard!");
        }
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert("Copied to clipboard!");
    }
  };

  const now = new Date();

  return (
    <>
      <div className="landscape-warning">
        <div className="landscape-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
            <path d="M12 18h.01"></path>
          </svg>
        </div>
        <h2>Please Rotate Your Device</h2>
        <p>Numeris26 is best experienced in portrait mode.</p>
      </div>
      <div className="app-container">
        {gameState.status !== 'start' && (
          <div className="header">
            {gameState.status !== 'game_over' && (
              <button className="btn-quit" onClick={quitGame} aria-label="Quit game">×</button>
            )}
            <div className="history-dots">
              {Array.from({ length: gameState.difficulty === 'easy' ? 1 : 3 }).map((_, i) => {
                let status = '';
                if (i < gameState.roundHistory.length) {
                  status = gameState.roundHistory[i] === 'won' ? 'won' : 'lost';
                } else if (i === gameState.round - 1 && gameState.status === 'playing') {
                  status = 'current';
                }
                return <div key={i} className={`dot ${status}`} />;
              })}
            </div>
            <div className="timer">{convertToEmojiNumbers(formatTime(gameState.timer))}</div>
            <TimerBar
              key={gameState.round}
              roundStartTime={roundStartTime}
              currentTime={Date.now()}
              isPlaying={gameState.status === 'playing'}
              finalDuration={gameState.roundDuration}
            />
          </div>
        )}

        <div className="game-area">
          {['playing', 'round_won_anim', 'round_lost_anim'].includes(gameState.status) ? (
            <>
              <FormulaArea formulas={gameState.formulas} onUndo={handleUndo} round={gameState.round} />
              <PoolArea poolNumbers={gameState.poolNumbers} onTileClick={handleTileClick} isNewRound={gameState.isNewRound} round={gameState.round} />

              {(gameState.status === 'round_won_anim' || gameState.status === 'round_lost_anim') && (
                <RoundFeedback status={gameState.status} duration={gameState.roundDuration} />
              )}
            </>
          ) : null}

          {gameState.status === 'start' && (
            <div className="overlay start-overlay">
              <h1 className="main-title">Numeris26</h1>

              <section className="panel-section daily-section">
                <div className="daily-header">
                  <div className="daily-title-container">
                    <h2 className="section-title">Daily Challenge</h2>
                    <span className="seed-display">#{getDailySeed()}</span>
                  </div>
                  <div className="calendar-icon">
                    <div className="calendar-month">{now.toLocaleString('en-US', { month: 'short' }).toUpperCase()}</div>
                    <div className="calendar-day">{now.getDate()}</div>
                  </div>
                </div>

                <div className="daily-controls">
                  {stats.dailyChallenge.status === 'none' ? (
                    <button className="btn-primary btn-daily" onClick={() => startGame('hard', true)}>Play</button>
                  ) : (
                    <div className="daily-result-container">
                      <div className="daily-result-text">
                        {stats.dailyChallenge.status === 'completed'
                          ? `Completed in ${convertToEmojiNumbers(formatTime(stats.dailyChallenge.time))}`
                          : 'Aborted'}
                      </div>
                      <div className="daily-actions">
                        <button
                          className="btn-secondary btn-share"
                          onClick={handleShare}
                          disabled={stats.dailyChallenge.status === 'quit'}
                        >
                          Share
                        </button>
                        <button
                          className="btn-secondary btn-revisit"
                          onClick={() => startGame('hard', true, true)}
                        >
                          ReVisit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="panel-section practice-section">
                <h2 className="section-title">Practice</h2>

                <div className="difficulty-selector">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <label key={d} className={`difficulty-option ${selectedDifficulty === d ? 'active' : ''} ${punchedButton === `diff-${d}` ? 'punch' : ''}`}>
                      <input
                        type="radio"
                        name="difficulty"
                        value={d}
                        checked={selectedDifficulty === d}
                        onChange={() => handleDifficultyChange(d as Difficulty)}
                      />
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </label>
                  ))}
                </div>

                <button className="btn-primary btn-practice-start" onClick={() => startGame(selectedDifficulty)}>Start</button>

                <div className="stats-spreadsheet-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Difficulty</th>
                        <th>Rounds</th>
                        <th>Today's Best</th>
                        <th>Best since {formatDisplayNameDate(stats.startDate)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => {
                        const s = stats.difficultyStats[d];
                        return (
                          <tr key={d}>
                            <td className="diff-name">{d.charAt(0).toUpperCase() + d.slice(1)}</td>
                            <td>{s.totalRounds.toString()}</td>
                            <td>{formatTime(s.todayBestTime)}</td>
                            <td>{formatTime(s.allTimeBestTime)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {gameState.status === 'game_over' && (
            <div className="overlay">
              {(() => {
                const score = gameState.roundHistory.filter(r => r === 'won').length;
                const totalTimeSec = gameState.timer / 1000;
                const maxRounds = gameState.difficulty === 'easy' ? 1 : 3;
                let message = "Game Over";

                const praises = [
                  "Superhuman!", "Insane!", "Legend!", "Unstoppable!", "Mastermind!",
                  "Incredible!", "Genius!", "Superb!", "Brilliant!", "Outstanding!",
                  "Amazing!", "Fantastic!", "Impressive!", "Fast!", "Excellent!",
                  "Solid!", "Keep it up!", "Great job!", "Good job!", "Great!"
                ];

                if (score === maxRounds) {
                  if (totalTimeSec < 40 * maxRounds) {
                    let index = Math.max(0, Math.floor(totalTimeSec * 0.5 / maxRounds));
                    message = praises[Math.min(index, praises.length - 1)];
                  } else {
                    message = "Flawless!";
                  }
                } else if (score >= maxRounds * 0.6) {
                  message = "Nice!";
                } else if (score > 0) {
                  message = "Cool!";
                }

                return <h1 className="praise-message">{message}</h1>;
              })()}
              <h2>Score: {gameState.roundHistory.filter(r => r === 'won').length} / {gameState.difficulty === 'easy' ? 1 : 3}</h2>
              <button
                className={`btn-primary ${punchedButton === 'back-to-menu' ? 'punch' : ''}`}
                onClick={() => {
                  goToStart();
                  setPunchedButton('back-to-menu');
                  setTimeout(() => setPunchedButton(null), 200);
                }}
              >
                Back to Menu
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
