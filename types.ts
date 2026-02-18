
export enum GameMode {
  MENU = 'MENU',
  RACING = 'RACING',
  RESULTS = 'RESULTS'
}

export type DeviceMode = 'COMPUTER' | 'MOBILE';

export interface PlayerConfig {
  name: string;
  color: string;
}

export interface RaceResult {
  playerName: string;
  distance: number;
  topSpeed: number;
  rank: number;
  laps: number;
}

export interface TrafficCar {
  id: number;
  x: number;
  y: number;
  speed: number;
  lane: number;
  color: string;
  type: 'sedan' | 'truck' | 'sport';
}

export type FeatureType = 'RAMP' | 'TURBO' | 'OIL' | 'HEALTH';

export interface RoadFeature {
  id: number;
  x: number;
  y: number;
  type: FeatureType;
}

export interface CarState {
  x: number;
  y: number;
  vx: number;     // Lateral velocity for smooth steering
  z: number;      // Altitude for jumps
  vz: number;     // Vertical velocity
  targetX: number;
  speed: number;
  distance: number;
  laps: number;
  finished: boolean;
  color: string;
  name: string;
  lane: number;
  health: number;
  boost: number;
  isBoosting: boolean;
  isAirborne: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}
