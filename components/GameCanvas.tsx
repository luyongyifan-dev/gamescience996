
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Vector2, GameLevel, GameState, Obstacle, Arrow, Turn } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, SPEED_MULTIPLIER, PLAYER_X, AI_X, MAX_POWER, MIN_POWER, BASE_DAMAGE, MAX_BOUNCES } from '../constants';
import { audioService } from '../services/audioService';

interface Props {
  level: GameLevel;
  gameState: GameState;
  onHit: (target: 'player' | 'ai', damage: number) => void;
  turn: Turn;
  setTurn: React.Dispatch<React.SetStateAction<Turn>>;
}

const GameCanvas: React.FC<Props> = ({ level, gameState, onHit, turn, setTurn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerAngle, setPlayerAngle] = useState(-45);
  const [power, setPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [arrow, setArrow] = useState<Arrow | null>(null);
  const [aiDrawing, setAiDrawing] = useState(false);
  const [aiPowerPreview, setAiPowerPreview] = useState(0);
  const [aiAnglePreview, setAiAnglePreview] = useState(180);
  
  const chargingRef = useRef<number | null>(null);

  // 初始化障碍逻辑：包含地面、左右墙体
  useEffect(() => {
    const newObstacles: Obstacle[] = [];
    const center = CANVAS_WIDTH / 2;
    const wallAreaWidth = 300;

    // 1. 中央障碍墙
    for (let i = 0; i < level.obstacleCount; i++) {
      const width = 30 + Math.random() * 30;
      const height = Math.min(CANVAS_HEIGHT - 80, (level.maxObstacleHeight * 0.7) + (Math.random() * level.maxObstacleHeight * 0.3));
      newObstacles.push({
        pos: { 
          x: (center - wallAreaWidth / 2) + (i * (wallAreaWidth / level.obstacleCount)), 
          y: CANVAS_HEIGHT - height 
        },
        width,
        height,
        type: i % 2 === 0 ? 'stone' : 'wood'
      });
    }

    // 2. 随关卡增加：左右侧生成的反弹墙
    if (level.id > 10) {
        newObstacles.push({ pos: { x: 250, y: 150 }, width: 20, height: 200, type: 'wall' });
        newObstacles.push({ pos: { x: CANVAS_WIDTH - 270, y: 150 }, width: 20, height: 200, type: 'wall' });
    }

    // 3. 地面额外障碍
    if (level.id > 20) {
        newObstacles.push({ pos: { x: 400, y: CANVAS_HEIGHT - 40 }, width: 100, height: 40, type: 'stone' });
        newObstacles.push({ pos: { x: 700, y: CANVAS_HEIGHT - 40 }, width: 100, height: 40, type: 'stone' });
    }

    setObstacles(newObstacles);
    setArrow(null);
  }, [level]);

  useEffect(() => {
    if (turn === Turn.AI && gameState === GameState.PLAYING) {
      const thinkDelay = 600;
      const drawDuration = 1000;

      setTimeout(() => {
        const dx = PLAYER_X - AI_X;
        const dy = level.playerY - level.aiY;
        const dist = Math.abs(dx);
        
        // AI 倾向于高抛或平射
        const baseAngle = 180 + 15 + (Math.random() * 65); 
        const finalAngle = (baseAngle + (Math.random() - 0.5) * level.aiVariance) * (Math.PI / 180);
        
        const v2 = (dist * GRAVITY) / Math.abs(Math.sin(2 * finalAngle));
        let estimatedPower = Math.sqrt(v2) * 1.55;
        if (dy < -50) estimatedPower *= 1.1;
        if (dy > 50) estimatedPower *= 0.9;
        const finalPower = Math.min(MAX_POWER, estimatedPower + (Math.random() * 3));

        setAiAnglePreview(baseAngle);
        setAiDrawing(true);
        
        let start: number;
        const animateAiDraw = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = (timestamp - start) / drawDuration;
          if (progress < 1) {
            setAiPowerPreview(finalPower * progress);
            requestAnimationFrame(animateAiDraw);
          } else {
            setAiDrawing(false);
            setAiPowerPreview(0);
            fireArrow(AI_X, level.aiY, finalAngle, finalPower, 'ai');
          }
        };
        requestAnimationFrame(animateAiDraw);
      }, thinkDelay);
    }
  }, [turn, gameState, level]);

  const fireArrow = (x: number, y: number, angleRad: number, p: number, owner: 'player' | 'ai') => {
    audioService.playRelease();
    setArrow({
      pos: { x, y },
      velocity: {
        x: Math.cos(angleRad) * p * SPEED_MULTIPLIER,
        y: Math.sin(angleRad) * p * SPEED_MULTIPLIER
      },
      angle: angleRad,
      owner,
      active: true,
      power: p,
      peakHeight: y,
      bounces: 0
    });
    setTurn(Turn.ANIMATING);
  };

  const handleMouseDown = () => {
    if (turn !== Turn.PLAYER || gameState !== GameState.PLAYING) return;
    setIsCharging(true);
    setPower(MIN_POWER);
    audioService.playDraw();
    chargingRef.current = window.setInterval(() => {
      setPower(prev => Math.min(prev + 0.5, MAX_POWER)); 
    }, 16);
  };

  const handleMouseUp = () => {
    if (!isCharging) return;
    setIsCharging(false);
    if (chargingRef.current) clearInterval(chargingRef.current);
    fireArrow(PLAYER_X, level.playerY, playerAngle * (Math.PI / 180), power, 'player');
    setPower(0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (turn !== Turn.PLAYER || gameState !== GameState.PLAYING) return;
    setPlayerAngle(prev => {
      const next = prev + (e.deltaY > 0 ? 1 : -1);
      return Math.max(-110, Math.min(20, next));
    });
  };

  const drawArcher = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, angleDeg: number, currentPower: number, direction: 1 | -1) => {
    const angleRad = angleDeg * (Math.PI / 180);
    const drawAmount = (currentPower / MAX_POWER) * 15;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(direction, 1);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(-10, -5, 20, 40, 5); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -18, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, -20, 13, Math.PI, 0); ctx.fill();
    ctx.save();
    ctx.rotate(direction === 1 ? angleRad : -angleRad + Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(25, -35); ctx.lineTo(25 - drawAmount, 0); ctx.lineTo(25, 35); ctx.stroke();
    ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(10, 0, 40, -Math.PI/2.5, Math.PI/2.5); ctx.stroke();
    ctx.strokeStyle = '#fca5a5'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(25 - drawAmount, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(25, 0); ctx.stroke();
    if (currentPower > 0) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(25 - drawAmount - 5, 0); ctx.lineTo(60 - drawAmount, 0); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  const drawTrajectory = (ctx: CanvasRenderingContext2D, startX: number, startY: number, angleRad: number, p: number, isCharging: boolean) => {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    let currX = startX;
    let currY = startY;
    let currVx = Math.cos(angleRad) * p * SPEED_MULTIPLIER;
    let currVy = Math.sin(angleRad) * p * SPEED_MULTIPLIER;
    ctx.moveTo(currX, currY);
    // 缩短轨迹预测线长度
    const maxSteps = isCharging ? 20 : 6; 
    for (let i = 0; i < maxSteps; i++) {
      currX += currVx;
      currVy += GRAVITY * SPEED_MULTIPLIER;
      currY += currVy;
      // 简单碰撞预测（地面）
      if (currY > CANVAS_HEIGHT - 20) {
          currVy *= -0.6;
          currY = CANVAS_HEIGHT - 20;
      }
      const alpha = 1 - (i / maxSteps);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
      ctx.lineTo(currX, currY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(currX, currY);
    }
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      obstacles.forEach(obs => {
        const obsGrad = ctx.createLinearGradient(obs.pos.x, obs.pos.y, obs.pos.x + obs.width, obs.pos.y + obs.height);
        if (obs.type === 'stone') {
          obsGrad.addColorStop(0, '#475569'); obsGrad.addColorStop(1, '#1e293b');
        } else if (obs.type === 'wood') {
          obsGrad.addColorStop(0, '#92400e'); obsGrad.addColorStop(1, '#451a03');
        } else {
          obsGrad.addColorStop(0, '#38bdf8'); obsGrad.addColorStop(1, '#0369a1');
        }
        ctx.fillStyle = obsGrad;
        ctx.fillRect(obs.pos.x, obs.pos.y, obs.width, obs.height);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(obs.pos.x, obs.pos.y, obs.width, obs.height);
      });

      if (turn === Turn.PLAYER && gameState === GameState.PLAYING) {
        drawTrajectory(ctx, PLAYER_X, level.playerY, playerAngle * (Math.PI / 180), isCharging ? power : 25, isCharging);
      }

      drawArcher(ctx, PLAYER_X, level.playerY, '#3b82f6', playerAngle, power, 1);
      const displayAiAngle = aiDrawing ? (aiAnglePreview - 180) : -30;
      drawArcher(ctx, AI_X, level.aiY, '#ef4444', displayAiAngle, aiPowerPreview, -1);

      if (arrow && arrow.active) {
        const steps = 4; 
        let currentHit = false;
        for (let s = 0; s < steps && !currentHit; s++) {
          const subStepX = arrow.velocity.x / steps;
          const subStepY = arrow.velocity.y / steps;
          arrow.pos.x += subStepX;
          arrow.pos.y += subStepY;
          arrow.velocity.y += (GRAVITY * SPEED_MULTIPLIER) / steps;
          arrow.angle = Math.atan2(arrow.velocity.y, arrow.velocity.x);
          arrow.peakHeight = Math.min(arrow.peakHeight, arrow.pos.y);

          // 1. 墙体反弹逻辑
          for (const obs of obstacles) {
            if (arrow.pos.x > obs.pos.x && arrow.pos.x < obs.pos.x + obs.width &&
                arrow.pos.y > obs.pos.y && arrow.pos.y < obs.pos.y + obs.height) {
              
              if (arrow.bounces < MAX_BOUNCES) {
                // 判断撞击方位
                const fromLeft = Math.abs(arrow.pos.x - obs.pos.x);
                const fromRight = Math.abs(arrow.pos.x - (obs.pos.x + obs.width));
                const fromTop = Math.abs(arrow.pos.y - obs.pos.y);
                const fromBottom = Math.abs(arrow.pos.y - (obs.pos.y + obs.height));
                const min = Math.min(fromLeft, fromRight, fromTop, fromBottom);
                
                if (min === fromLeft || min === fromRight) arrow.velocity.x *= -0.8;
                else arrow.velocity.y *= -0.8;
                
                arrow.bounces++;
                audioService.playDamage();
              } else {
                currentHit = true;
                audioService.playDamage();
              }
              break;
            }
          }

          // 2. 地面反弹逻辑
          if (arrow.pos.y > CANVAS_HEIGHT - 20) {
            if (arrow.bounces < MAX_BOUNCES) {
              arrow.velocity.y *= -0.6;
              arrow.pos.y = CANVAS_HEIGHT - 21;
              arrow.bounces++;
              audioService.playDamage();
            } else {
              currentHit = true;
            }
          }

          // 3. 目标碰撞
          if (!currentHit) {
            const distToAi = Math.hypot(arrow.pos.x - AI_X, arrow.pos.y - level.aiY);
            const distToPlayer = Math.hypot(arrow.pos.x - PLAYER_X, arrow.pos.y - level.playerY);
            if (distToAi < 30 && arrow.owner === 'player') {
              onHit('ai', Math.floor(BASE_DAMAGE + Math.max(0, (level.playerY - arrow.peakHeight) / 5) + arrow.power / 1.5));
              currentHit = true;
            } else if (distToPlayer < 30 && arrow.owner === 'ai') {
              onHit('player', Math.floor(BASE_DAMAGE + Math.max(0, (level.aiY - arrow.peakHeight) / 5) + arrow.power / 1.5));
              currentHit = true;
            }
          }
        }

        if (currentHit) {
          setArrow(null);
          setTurn(arrow.owner === 'player' ? Turn.AI : Turn.PLAYER);
        } else if (arrow.pos.x < -1000 || arrow.pos.x > CANVAS_WIDTH + 1000) {
          setArrow(null);
          setTurn(arrow.owner === 'player' ? Turn.AI : Turn.PLAYER);
        }
      }

      if (arrow) {
        ctx.save();
        ctx.translate(arrow.pos.x, arrow.pos.y);
        ctx.rotate(arrow.angle);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(12, -4); ctx.lineTo(12, 4); ctx.fill();
        ctx.restore();
      }
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [arrow, obstacles, level, turn, gameState, playerAngle, power, isCharging, aiDrawing, aiPowerPreview, aiAnglePreview]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onWheel={handleWheel} className="cursor-crosshair block shadow-inner" />;
};

export default GameCanvas;
