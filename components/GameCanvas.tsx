
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  HIGHWAY_WIDTH, 
  LANE_WIDTH, 
  LANES, 
  PHYSICS, 
  COLORS,
  LAP_DISTANCE
} from '../constants.ts';
import { CarState, TrafficCar, Particle, PlayerConfig, RaceResult, DeviceMode, RoadFeature, FeatureType } from '../types.ts';
import { audioManager } from '../services/audio.ts';

interface GameCanvasProps {
  players: PlayerConfig[];
  onFinish: (results: RaceResult[]) => void;
  onLeave: () => void;
  theme: 'CITY' | 'DESERT';
  deviceMode: DeviceMode;
}

const drawDetailedCar = (ctx: CanvasRenderingContext2D, color: string, width: number, height: number, type: 'sedan' | 'truck' | 'sport' | 'player' = 'sedan', carX: number = 0) => {
  ctx.save();
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.rect(-width/2 + 6, -height/2 + 6, width, height);
  ctx.fill();

  // Body Base
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-width/2, -height/2, width, height, type === 'truck' ? 4 : 12);
  ctx.fill();

  // Metallic Reflection (Dynamic based on X position)
  const reflectionX = (carX / CANVAS_WIDTH) * width;
  const grad = ctx.createLinearGradient(-width/2, 0, width/2, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0.2)');
  grad.addColorStop(Math.max(0, Math.min(1, 0.5 + (carX - CANVAS_WIDTH/2)/500)), 'rgba(255,255,255,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Windshield
  ctx.fillStyle = '#0f172a';
  const windshieldY = type === 'truck' ? -height * 0.42 : -height * 0.25;
  const windshieldH = type === 'truck' ? height * 0.18 : height * 0.3;
  ctx.beginPath();
  ctx.roundRect(-width * 0.38, windshieldY, width * 0.76, windshieldH, 4);
  ctx.fill();
  
  // Windshield Shine
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-width * 0.2, windshieldY + 5);
  ctx.lineTo(width * 0.1, windshieldY + windshieldH - 5);
  ctx.stroke();

  // Lights
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#fef08a';
  ctx.fillRect(-width * 0.45, -height * 0.48, width * 0.2, height * 0.1);
  ctx.fillRect(width * 0.25, -height * 0.48, width * 0.2, height * 0.1);

  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.fillRect(-width * 0.4, height * 0.38, width * 0.2, height * 0.1);
  ctx.fillRect(width * 0.2, height * 0.38, width * 0.2, height * 0.1);

  // Wheels
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#020617';
  const wheelW = width * 0.15;
  const wheelH = height * 0.2;
  ctx.fillRect(-width/2 - wheelW/2, -height/2 + height * 0.15, wheelW, wheelH);
  ctx.fillRect(width/2 - wheelW/2, -height/2 + height * 0.15, wheelW, wheelH);
  ctx.fillRect(-width/2 - wheelW/2, height/2 - height * 0.35, wheelW, wheelH);
  ctx.fillRect(width/2 - wheelW/2, height/2 - height * 0.35, wheelW, wheelH);

  ctx.restore();
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ players, onFinish, onLeave, theme, deviceMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerCars, setPlayerCars] = useState<CarState[]>([]);
  const [traffic, setTraffic] = useState<TrafficCar[]>([]);
  const [features, setFeatures] = useState<RoadFeature[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const particles = useRef<Particle[]>([]);
  const keys = useRef<Set<string>>(new Set());
  const requestRef = useRef<number>(0);
  const trafficCounter = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const collidedTrafficIds = useRef<Set<number>>(new Set());
  const screenShake = useRef<number>(0);

  const getRoadX = (dist: number) => {
    return Math.sin(dist * 0.0005) * 300 + 
           Math.sin(dist * 0.0012) * 150 +
           Math.cos(dist * 0.0003) * 100;
  };

  useEffect(() => {
    audioManager.startMusic();
    return () => audioManager.stopMusic();
  }, []);

  useEffect(() => {
    const initialPlayers: CarState[] = players.map((p, i) => {
      const lane = i + 1;
      const initialDist = 0;
      const roadX = getRoadX(initialDist);
      const highwayLeft = (CANVAS_WIDTH - HIGHWAY_WIDTH) / 2 + roadX;
      const x = highwayLeft + (lane * LANE_WIDTH) - (LANE_WIDTH / 2);
      
      return {
        x, y: CANVAS_HEIGHT - 150, vx: 0, z: 0, vz: 0,
        targetX: x, speed: 0, distance: initialDist, laps: 1,
        finished: false, color: p.color, name: p.name,
        lane, health: 100, boost: 0, isBoosting: false, isAirborne: false
      };
    });
    setPlayerCars(initialPlayers);
  }, [players]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Escape') setIsPaused(prev => !prev);
    keys.current.add(e.code);
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => keys.current.delete(e.code), []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleTouch = (key: string, start: boolean) => {
    if (start) {
      keys.current.add(key);
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      keys.current.delete(key);
    }
  };

  const spawnTraffic = useCallback((dist: number) => {
    const lane = Math.floor(Math.random() * LANES);
    const speed = PHYSICS.TRAFFIC_SPEED_MIN + Math.random() * (PHYSICS.TRAFFIC_SPEED_MAX - PHYSICS.TRAFFIC_SPEED_MIN);
    const newTraffic: TrafficCar = {
      id: trafficCounter.current++, x: 0, y: -200, speed, lane,
      color: COLORS.TRAFFIC[Math.floor(Math.random() * COLORS.TRAFFIC.length)],
      type: Math.random() > 0.8 ? 'truck' : (Math.random() > 0.6 ? 'sport' : 'sedan')
    };
    setTraffic(prev => [...prev.filter(t => t.y < CANVAS_HEIGHT + 200), newTraffic]);
  }, []);

  const update = useCallback(() => {
    if (isPaused || gameOver) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    frameCount.current++;
    collidedTrafficIds.current.clear();
    const currentLeadDistance = playerCars.length > 0 ? Math.max(...playerCars.map(p => p.distance)) : 0;
    
    if (frameCount.current % 60 === 0) spawnTraffic(currentLeadDistance);
    if (screenShake.current > 0) screenShake.current *= 0.9;

    setPlayerCars(prevPlayers => {
      const updated = prevPlayers.map((player, idx) => {
        if (player.health <= 0) return player;
        const controls = idx === 0 
          ? { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', boost: 'ShiftRight' }
          : { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', boost: 'ShiftLeft' };

        let nextPlayer = { ...player };

        // Physics: Vertical (Jumps)
        if (nextPlayer.isAirborne) {
          nextPlayer.vz -= PHYSICS.GRAVITY;
          nextPlayer.z += nextPlayer.vz;
          if (nextPlayer.z <= 0) {
            nextPlayer.z = 0; nextPlayer.vz = 0; nextPlayer.isAirborne = false;
            screenShake.current = 10;
          }
        }

        // Physics: Road Curvature pull
        const currentRoadX = getRoadX(nextPlayer.distance);
        const lookAheadRoadX = getRoadX(nextPlayer.distance + 20);
        nextPlayer.vx += (lookAheadRoadX - currentRoadX) * 0.15;

        // Steering: Smooth lateral velocity
        const steerForce = 1.2;
        if (keys.current.has(controls.left)) nextPlayer.vx -= steerForce;
        if (keys.current.has(controls.right)) nextPlayer.vx += steerForce;
        nextPlayer.vx *= 0.85; // Lateral friction
        nextPlayer.x += nextPlayer.vx;

        // Acceleration
        const canSuperBoost = nextPlayer.boost >= 100;
        if (keys.current.has(controls.boost) && canSuperBoost) nextPlayer.isBoosting = true;

        if (nextPlayer.isBoosting) {
          nextPlayer.speed += PHYSICS.BOOST_ACCELERATION;
          nextPlayer.boost -= PHYSICS.BOOST_CONSUME_RATE;
          if (nextPlayer.boost <= 0) { nextPlayer.boost = 0; nextPlayer.isBoosting = false; }
        } else {
          if (keys.current.has(controls.up)) {
            nextPlayer.speed += PHYSICS.ACCELERATION;
            nextPlayer.boost = Math.min(100, nextPlayer.boost + PHYSICS.BOOST_CHARGE_RATE);
          } else if (keys.current.has(controls.down)) {
            nextPlayer.speed -= PHYSICS.BRAKE;
          } else {
            nextPlayer.speed *= PHYSICS.FRICTION;
          }
        }

        const maxSpd = nextPlayer.isBoosting ? PHYSICS.BOOST_MAX_SPEED : PHYSICS.MAX_SPEED;
        nextPlayer.speed = Math.max(0, Math.min(maxSpd, nextPlayer.speed));
        nextPlayer.distance += nextPlayer.speed;
        nextPlayer.laps = Math.floor(nextPlayer.distance / LAP_DISTANCE) + 1;

        // Bound check
        const hLeft = (CANVAS_WIDTH - HIGHWAY_WIDTH) / 2 + currentRoadX;
        if (nextPlayer.x < hLeft || nextPlayer.x > hLeft + HIGHWAY_WIDTH) {
          nextPlayer.speed *= 0.98;
          if (nextPlayer.speed > 5) nextPlayer.health -= 0.05;
        }
        nextPlayer.x = Math.max(hLeft - 60, Math.min(hLeft + HIGHWAY_WIDTH + 60, nextPlayer.x));

        // Traffic Collision
        traffic.forEach(t => {
          if (Math.abs(nextPlayer.x - t.x) < 38 && Math.abs(nextPlayer.y - t.y) < 75 && !nextPlayer.isAirborne) {
            nextPlayer.health -= 15;
            nextPlayer.speed *= 0.4;
            nextPlayer.vx = (nextPlayer.x > t.x ? 15 : -15);
            screenShake.current = 20;
            audioManager.playCollision();
            collidedTrafficIds.current.add(t.id);
            for(let i=0; i<6; i++) {
              particles.current.push({
                x: nextPlayer.x, y: nextPlayer.y,
                vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                life: 1.0, color: t.color, size: 3 + Math.random() * 3
              });
            }
          }
        });

        // Player-Player Bump
        prevPlayers.forEach((other, oIdx) => {
          if (idx !== oIdx && !nextPlayer.isAirborne && !other.isAirborne) {
            const dx = Math.abs(nextPlayer.x - other.x);
            const dy = Math.abs(nextPlayer.y - other.y);
            if (dx < 40 && dy < 80) {
              const push = (nextPlayer.x > other.x ? 5 : -5);
              nextPlayer.vx += push;
              nextPlayer.speed *= 0.99;
            }
          }
        });

        if (nextPlayer.isBoosting) {
          particles.current.push({
            x: nextPlayer.x + (Math.random() - 0.5) * 15, y: nextPlayer.y + 35,
            vx: (Math.random() - 0.5) * 5, vy: nextPlayer.speed * 0.5,
            life: 0.8, color: COLORS.BOOST, size: 2 + Math.random() * 4
          });
        }
        return nextPlayer;
      });

      const globalMaxSpeed = updated.length > 0 ? Math.max(...updated.map(p => p.speed)) : 0;
      audioManager.updateMusicIntensity(globalMaxSpeed, updated.some(p => p.isBoosting));

      setTraffic(prevTraffic => prevTraffic
        .filter(t => !collidedTrafficIds.current.has(t.id))
        .map(t => {
          const currentRelDist = currentLeadDistance + (CANVAS_HEIGHT - t.y);
          const roadBase = (CANVAS_WIDTH - HIGHWAY_WIDTH) / 2 + getRoadX(currentRelDist);
          return { ...t, y: t.y + (t.speed - (globalMaxSpeed * 0.5)), x: roadBase + (t.lane * LANE_WIDTH) + (LANE_WIDTH / 2) };
        })
      );

      setFeatures(prev => prev.map(f => ({ ...f, y: f.y + globalMaxSpeed })));

      if (updated.length > 0 && updated.every(p => p.health <= 0) && !gameOver) {
        setGameOver(true);
        audioManager.stopMusic();
        const finalResults: RaceResult[] = updated.map(p => ({
          playerName: p.name, distance: Math.floor(p.distance / 100),
          topSpeed: Math.floor(PHYSICS.MAX_SPEED * 10), rank: 0, laps: p.laps
        })).sort((a,b) => b.distance - a.distance).map((r, i) => ({...r, rank: i+1}));
        setTimeout(() => onFinish(finalResults), 1500);
      }
      return updated;
    });

    requestRef.current = requestAnimationFrame(update);
  }, [playerCars, spawnTraffic, onFinish, gameOver, features, isPaused, traffic]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.save();
      if (screenShake.current > 0) ctx.translate((Math.random() - 0.5) * screenShake.current, (Math.random() - 0.5) * screenShake.current);
      
      const camDist = playerCars.length > 0 ? Math.max(...playerCars.map(p => p.distance)) : 0;
      
      // Draw World
      ctx.fillStyle = theme === 'CITY' ? '#0f172a' : '#78350f';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const segHeight = 25;
      for (let y = 0; y < CANVAS_HEIGHT; y += segHeight) {
        const distAtY = camDist + (CANVAS_HEIGHT - y);
        const roadX1 = getRoadX(distAtY);
        const roadX2 = getRoadX(distAtY + segHeight);
        const hLeft1 = (CANVAS_WIDTH - HIGHWAY_WIDTH) / 2 + roadX1;
        const hLeft2 = (CANVAS_WIDTH - HIGHWAY_WIDTH) / 2 + roadX2;

        ctx.fillStyle = theme === 'CITY' ? '#1e1b4b' : '#451a03';
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(hLeft1, y); ctx.lineTo(hLeft2, y + segHeight); ctx.lineTo(0, y + segHeight); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hLeft1 + HIGHWAY_WIDTH, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.lineTo(CANVAS_WIDTH, y + segHeight); ctx.lineTo(hLeft2 + HIGHWAY_WIDTH, y + segHeight); ctx.fill();
        ctx.fillStyle = COLORS.ASPHALT;
        ctx.beginPath(); ctx.moveTo(hLeft1, y); ctx.lineTo(hLeft1 + HIGHWAY_WIDTH, y); ctx.lineTo(hLeft2 + HIGHWAY_WIDTH, y + segHeight); ctx.lineTo(hLeft2, y + segHeight); ctx.fill();

        const lapIdx = Math.floor(distAtY / LAP_DISTANCE);
        if (distAtY % LAP_DISTANCE < 50) {
           ctx.fillStyle = 'rgba(255,255,255,0.8)';
           ctx.fillRect(hLeft1, y, HIGHWAY_WIDTH, segHeight/2);
        }
      }

      // Traffic
      traffic.forEach(t => {
        ctx.save();
        ctx.translate(t.x, t.y);
        drawDetailedCar(ctx, t.color, t.type === 'truck' ? 45 : 35, t.type === 'truck' ? 80 : 65, t.type, t.x);
        ctx.restore();
      });

      // Players
      playerCars.forEach(p => {
        if (p.health > 0) {
          ctx.save();
          ctx.translate(p.x, p.y - p.z);
          const scale = 1 + p.z / 200;
          ctx.scale(scale, scale);
          drawDetailedCar(ctx, p.color, 40, 75, 'player', p.x);
          ctx.restore();
        }
      });

      // Particles
      particles.current.forEach((p, i) => {
        if (p.life > 0) {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
          p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        }
      });
      ctx.globalAlpha = 1;
      ctx.restore();
    };
    render();
  }, [playerCars, traffic, theme]);

  const MobileControl = ({ playerIdx }: { playerIdx: number }) => {
    const isP1 = playerIdx === 0;
    const c = isP1 
      ? { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', boost: 'ShiftRight' }
      : { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', boost: 'ShiftLeft' };

    return (
      <div className={`flex flex-col gap-2 p-4 pointer-events-auto bg-black/20 backdrop-blur-sm rounded-3xl ${isP1 ? 'items-start' : 'items-end'}`}>
        <div className="flex gap-2">
          <button 
            onPointerDown={() => handleTouch(c.up, true)} onPointerUp={() => handleTouch(c.up, false)} onPointerLeave={() => handleTouch(c.up, false)}
            className="w-16 h-16 bg-blue-500/20 border border-white/10 rounded-xl flex items-center justify-center text-2xl active:bg-blue-500/40 active:scale-95 transition-all"
          >🔥</button>
        </div>
        <div className="flex gap-2">
          <button 
            onPointerDown={() => handleTouch(c.left, true)} onPointerUp={() => handleTouch(c.left, false)} onPointerLeave={() => handleTouch(c.left, false)}
            className="w-16 h-16 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-2xl active:bg-blue-500/40 active:scale-95 transition-all"
          >◀</button>
          <button 
            onPointerDown={() => handleTouch(c.down, true)} onPointerUp={() => handleTouch(c.down, false)} onPointerLeave={() => handleTouch(c.down, false)}
            className="w-16 h-16 bg-red-500/20 border border-white/10 rounded-xl flex items-center justify-center text-2xl active:bg-red-500/40 active:scale-95 transition-all"
          >🛑</button>
          <button 
            onPointerDown={() => handleTouch(c.right, true)} onPointerUp={() => handleTouch(c.right, false)} onPointerLeave={() => handleTouch(c.right, false)}
            className="w-16 h-16 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-2xl active:bg-blue-500/40 active:scale-95 transition-all"
          >▶</button>
        </div>
        <button 
          onPointerDown={() => handleTouch(c.boost, true)} onPointerUp={() => handleTouch(c.boost, false)} onPointerLeave={() => handleTouch(c.boost, false)}
          className={`w-full py-2 rounded-xl font-black italic text-xs transition-all ${playerCars[playerIdx]?.boost >= 100 ? 'bg-cyan-500 text-white animate-pulse' : 'bg-slate-700 text-slate-400'}`}
        >NITRO</button>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
      <div className="flex-1 w-full relative flex items-center justify-center">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full max-h-full object-contain border-4 border-slate-700 shadow-2xl rounded-lg bg-black" />
        
        {/* HUD */}
        <div className="absolute top-4 left-4 flex flex-col gap-4 pointer-events-none z-10">
          {playerCars.map((car, idx) => (
            <div key={idx} className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border-l-4 w-64 shadow-2xl" style={{ borderLeftColor: car.color }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-orbitron font-black text-sm text-white italic">{car.name}</span>
                <span className="font-orbitron text-blue-400 text-xs font-bold">LAP {car.laps}</span>
              </div>
              <div className="text-2xl font-orbitron font-black text-white italic leading-none mb-2">{Math.floor(car.speed * 12)} <span className="text-[10px] text-blue-400">KM/H</span></div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${car.health}%` }} />
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full transition-all ${car.boost >= 100 ? 'bg-cyan-400' : 'bg-blue-600'}`} style={{ width: `${car.boost}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Controls Layout */}
        {deviceMode === 'MOBILE' && !gameOver && (
          <div className="absolute bottom-0 left-0 w-full flex justify-between p-4 pointer-events-none z-20">
            <MobileControl playerIdx={0} />
            {players.length === 2 && <MobileControl playerIdx={1} />}
          </div>
        )}

        <div className="absolute top-4 right-4 z-20">
          <button onClick={() => setIsPaused(true)} className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-xl hover:bg-white/10 transition-all">⚙️</button>
        </div>
      </div>

      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center shadow-2xl">
            <h2 className="text-4xl font-orbitron font-black text-white mb-6 italic uppercase">Paused</h2>
            <div className="space-y-4">
              <button onClick={() => setIsPaused(false)} className="w-full py-4 bg-blue-600 text-white font-orbitron font-bold rounded-xl shadow-xl">RESUME</button>
              <button onClick={onLeave} className="w-full py-4 bg-slate-800 text-white font-orbitron font-bold rounded-xl">LEAVE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
