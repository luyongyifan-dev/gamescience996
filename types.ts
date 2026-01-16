
export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vector2;
  hp: number;
  maxHp: number;
  width: number;
  height: number;
}

export interface Obstacle {
  pos: Vector2;
  width: number;
  height: number;
  type: 'stone' | 'wood' | 'wall';
}

export interface Arrow {
  pos: Vector2;
  velocity: Vector2;
  angle: number;
  owner: 'player' | 'ai';
  active: boolean;
  power: number;
  peakHeight: number;
  bounces: number; // 新增：追踪弹跳次数
}

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  LEVEL_WIN = 'LEVEL_WIN',
  GAME_OVER = 'GAME_OVER',
  GAME_WIN = 'GAME_WIN'
}

export enum Turn {
  PLAYER = 'PLAYER',
  AI = 'AI',
  ANIMATING = 'ANIMATING'
}

export interface GameLevel {
  id: number;
  aiAccuracy: number; 
  aiVariance: number; 
  obstacleCount: number;
  maxObstacleHeight: number;
  playerY: number;
  aiY: number;
}
