
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export const HIGHWAY_WIDTH = 600;
export const LANES = 4;
export const LANE_WIDTH = HIGHWAY_WIDTH / LANES;

export const LAP_DISTANCE = 5000; // Distance units per lap

export const PHYSICS = {
  ACCELERATION: 0.2,
  BRAKE: 0.5,
  FRICTION: 0.99,
  MAX_SPEED: 25,
  BOOST_MAX_SPEED: 45,
  BOOST_ACCELERATION: 0.6,
  BOOST_CHARGE_RATE: 0.3,
  BOOST_CONSUME_RATE: 0.8,
  TRAFFIC_SPEED_MIN: 5,
  TRAFFIC_SPEED_MAX: 12,
  LANE_CHANGE_SPEED: 0.15,
  GRAVITY: 0.5,
  JUMP_FORCE: 12,
  CENTRIFUGAL_FORCE: 0.05
};

export const COLORS = {
  ASPHALT: '#1e293b',
  MARKING: '#facc15',
  CITY_SIDE: '#0f172a',
  DESERT_SIDE: '#78350f',
  P1: '#3b82f6',
  P2: '#f97316',
  TRAFFIC: ['#94a3b8', '#ef4444', '#10b981', '#ffffff'],
  BOOST: '#06b6d4',
  RAMP: '#fbbf24',
  TURBO: '#22c55e',
  OIL: '#000000',
  HEALTH: '#ef4444'
};
