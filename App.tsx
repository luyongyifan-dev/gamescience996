
import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { GameState, GameLevel, Turn } from './types';
import { LEVELS } from './constants';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [playerHp, setPlayerHp] = useState(100);
  const [aiHp, setAiHp] = useState(100);
  const [currentTurn, setCurrentTurn] = useState<Turn>(Turn.PLAYER);
  const [shake, setShake] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const currentLevel = LEVELS[currentLevelIdx];

  // Calculate duration based on level ID
  const getLevelDuration = (levelId: number): number => {
    if (levelId === 100) return -1; // No limit
    if (levelId >= 61) return 300;
    if (levelId >= 31) return 120;
    if (levelId >= 21) return 60;
    if (levelId >= 11) return 45;
    return 30;
  };

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
    setPlayerHp(100);
    setAiHp(100);
    setCurrentTurn(Turn.PLAYER);
    setTimeLeft(getLevelDuration(currentLevel.id));
  };

  const handleNextLevel = () => {
    if (currentLevelIdx < LEVELS.length - 1) {
      const nextIdx = currentLevelIdx + 1;
      setCurrentLevelIdx(nextIdx);
      setAiHp(100);
      setPlayerHp(100);
      setGameState(GameState.PLAYING);
      setCurrentTurn(Turn.PLAYER);
      setTimeLeft(getLevelDuration(LEVELS[nextIdx].id));
    } else {
      setGameState(GameState.GAME_WIN);
    }
  };

  // Timer Effect
  useEffect(() => {
    let timer: number;
    if (gameState === GameState.PLAYING && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState(GameState.GAME_OVER);
            audioService.playLose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleHit = useCallback((target: 'player' | 'ai', damage: number) => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
    audioService.playHit();

    if (target === 'ai') {
      setAiHp(prev => {
        const next = Math.max(0, prev - damage);
        if (next === 0) {
          setTimeout(() => {
            if (currentLevelIdx === LEVELS.length - 1) {
              setGameState(GameState.GAME_WIN);
              audioService.playWin();
            } else {
              setGameState(GameState.LEVEL_WIN);
              audioService.playWin();
            }
          }, 1000);
        }
        return next;
      });
    } else {
      setPlayerHp(prev => {
        const next = Math.max(0, prev - damage);
        if (next === 0) {
          setTimeout(() => {
            setGameState(GameState.GAME_OVER);
            audioService.playLose();
          }, 1000);
        }
        return next;
      });
    }
  }, [currentLevelIdx]);

  return (
    <div className={`relative w-full h-screen flex items-center justify-center bg-slate-950 overflow-hidden ${shake ? 'shake' : ''}`}>
      <div className="relative shadow-2xl border-4 border-slate-800 rounded-lg overflow-hidden bg-slate-900">
        <GameCanvas 
          level={currentLevel}
          gameState={gameState}
          onHit={handleHit}
          turn={currentTurn}
          setTurn={setCurrentTurn}
        />
        
        <UIOverlay 
          playerHp={playerHp}
          aiHp={aiHp}
          level={currentLevel}
          gameState={gameState}
          onStart={handleStartGame}
          onNext={handleNextLevel}
          currentTurn={currentTurn}
          timeLeft={timeLeft}
        />
      </div>

      {/* Background Ambience / Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
         <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-600 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default App;
