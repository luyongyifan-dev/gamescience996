
import { GameLevel } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 600;
export const GRAVITY = 1.0; // 略微增加重力
export const SPEED_MULTIPLIER = 0.45;
export const MAX_POWER = 85; // 增加力度上限以应对更复杂的抛物线
export const MIN_POWER = 5;
export const PLAYER_X = 100;
export const AI_X = 1100;
export const BASE_DAMAGE = 10;
export const MAX_BOUNCES = 3; // 箭头最大弹跳次数

// 生成 100 个关卡
export const LEVELS: GameLevel[] = Array.from({ length: 100 }, (_, i) => {
  const progress = i / 99; // 0 to 1
  return {
    id: i + 1,
    aiAccuracy: 0.15 + progress * 0.75, // 从 0.15 到 0.9 递增
    aiVariance: 25 - progress * 24.5, // 误差从 25 度降至 0.5 度
    obstacleCount: Math.floor(4 + progress * 12), // 障碍物数量增加
    maxObstacleHeight: 150 + progress * 400, // 高度增加
    playerY: 100 + (Math.random() * 350),
    aiY: 100 + (Math.random() * 350)
  };
});
