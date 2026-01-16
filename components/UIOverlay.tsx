
import React from 'react';
import { GameState, GameLevel, Turn } from '../types';

interface Props {
  playerHp: number;
  aiHp: number;
  level: GameLevel;
  gameState: GameState;
  onStart: () => void;
  onNext: () => void;
  currentTurn: Turn;
  timeLeft: number;
}

const UIOverlay: React.FC<Props> = ({ playerHp, aiHp, level, gameState, onStart, onNext, currentTurn, timeLeft }) => {
  // 荣誉等级计算逻辑
  const getHonorRank = (levelId: number) => {
    if (levelId === 100 && gameState === GameState.GAME_WIN) return { title: '挂逼对吧', color: 'text-fuchsia-400' };
    if (levelId >= 91) return { title: '超凡入圣', color: 'text-amber-400' };
    if (levelId >= 81) return { title: '箭魂至尊', color: 'text-orange-500' };
    if (levelId >= 71) return { title: '飞羽无双', color: 'text-red-400' };
    if (levelId >= 61) return { title: '箭道强者', color: 'text-purple-400' };
    if (levelId >= 51) return { title: '百步穿杨', color: 'text-emerald-400' };
    if (levelId >= 41) return { title: '射箭高手', color: 'text-cyan-400' };
    if (levelId >= 31) return { title: '射箭达人', color: 'text-blue-400' };
    if (levelId >= 21) return { title: '射击小子', color: 'text-lime-400' };
    if (levelId >= 11) return { title: '有点东西', color: 'text-slate-300' };
    return { title: '菜鸡射手', color: 'text-slate-500' };
  };

  const honor = getHonorRank(level.id);

  const formatTime = (seconds: number) => {
    if (seconds < 0) return "∞";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* 顶部栏：血条和关卡 */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2 w-64">
          <div className="flex justify-between text-sm font-bold text-blue-400">
            <span>玩家</span>
            <span>{playerHp}/100</span>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-blue-500 transition-all duration-300" 
              style={{ width: `${playerHp}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="bg-slate-900/80 px-6 py-2 rounded-full border border-slate-700 shadow-xl backdrop-blur-sm">
            <span className="text-xl font-black text-white tracking-widest">
              第 {level.id} 关 / 共 100 关
            </span>
          </div>
          {gameState === GameState.PLAYING && (
            <div className={`px-4 py-1 rounded-full border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm text-sm font-mono font-bold ${timeLeft <= 10 && timeLeft > 0 ? 'text-red-500 animate-pulse scale-110' : 'text-slate-300'}`}>
               倒计时: {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 w-64 items-end text-right">
          <div className="flex justify-between w-full text-sm font-bold text-red-400">
            <span>{aiHp}/100</span>
            <span>对手 (AI)</span>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 w-full">
            <div 
              className="h-full bg-red-500 transition-all duration-300 ml-auto" 
              style={{ width: `${aiHp}%` }}
            />
          </div>
        </div>
      </div>

      {/* 回合指示器 */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center transition-all duration-500">
          <div className={`px-4 py-1 rounded text-xs font-bold uppercase tracking-widest shadow-lg ${
            currentTurn === Turn.PLAYER ? 'bg-blue-600 animate-pulse' : 
            currentTurn === Turn.AI ? 'bg-red-600 animate-pulse' : 'bg-slate-600'
          }`}>
            {currentTurn === Turn.PLAYER ? '你的回合' : 
             currentTurn === Turn.AI ? 'AI 正在决策...' : '箭矢飞行中'}
          </div>
        </div>
      )}

      {/* 菜单界面 */}
      {gameState !== GameState.PLAYING && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-md pointer-events-auto">
          <div className="bg-slate-900 p-10 rounded-2xl border-2 border-slate-700 shadow-2xl text-center max-w-md w-full">
            {gameState === GameState.START && (
              <>
                <h1 className="text-4xl font-black text-white mb-4 italic tracking-tighter uppercase">
                   弓箭对决 <span className="text-blue-500">AI挑战</span>
                </h1>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  控制角度和力度，在回合制对决中击败 AI。
                  注意每关的倒计时限制！
                </p>
                <div className="space-y-3 mb-8 text-left text-sm text-slate-300 bg-slate-800/50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded">🖱️</span>
                    <span>滚轮调整角度，左键长按蓄力</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded">🔄</span>
                    <span>箭头击中墙体可发生反弹 (最多3次)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded">⏱️</span>
                    <span>时间耗尽未击杀 AI 即算失败</span>
                  </div>
                </div>
                <button 
                  onClick={onStart}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 text-xl"
                >
                  开始对决
                </button>
              </>
            )}

            {gameState === GameState.LEVEL_WIN && (
              <>
                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                   <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                   </svg>
                </div>
                <h2 className="text-3xl font-black text-white mb-2 italic">关卡胜利!</h2>
                <p className="text-slate-400 mb-8">成功通过第 {level.id} 关</p>
                <button 
                  onClick={onNext}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  进入下一关
                </button>
              </>
            )}

            {gameState === GameState.GAME_OVER && (
              <>
                <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                   </svg>
                </div>
                <h2 className="text-3xl font-black text-white mb-1 italic">挑战失败</h2>
                <div className="mb-6">
                  <p className="text-slate-500 text-sm uppercase tracking-widest mb-1">当前荣誉等级</p>
                  <p className={`text-4xl font-black ${honor.color} drop-shadow-lg`}>{honor.title}</p>
                </div>
                <p className="text-slate-400 mb-8 italic">
                  {timeLeft <= 0 ? "时间耗尽，AI 逃脱了！" : `你在第 ${level.id} 关倒下了...`}
                </p>
                <button 
                  onClick={onStart}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  再次挑战此关
                </button>
              </>
            )}

            {gameState === GameState.GAME_WIN && (
              <>
                <div className="w-24 h-24 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                   <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                   </svg>
                </div>
                <h2 className="text-4xl font-black text-white mb-1 italic tracking-tight">传奇终章!</h2>
                <div className="mb-6">
                  <p className="text-slate-500 text-sm uppercase tracking-widest mb-1">至高荣誉等级</p>
                  <p className={`text-5xl font-black ${honor.color} drop-shadow-[0_0_15px_rgba(192,38,211,0.5)]`}>{honor.title}</p>
                </div>
                <p className="text-slate-400 mb-8 italic">你完成了所有 100 个关卡的极致挑战！</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  重回巅峰
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 控制提示 */}
      <div className="flex justify-center">
        <div className="bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-700/50 flex gap-6 text-xs text-slate-400">
           <div className="flex items-center gap-2"><span className="text-blue-400 font-bold">鼠标滚轮</span> 调整角度</div>
           <div className="flex items-center gap-2"><span className="text-blue-400 font-bold">长按左键</span> 蓄力</div>
           <div className="flex items-center gap-2"><span className="text-blue-400 font-bold">弹跳</span> 碰撞反弹(3次)</div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
