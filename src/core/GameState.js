export const MULTIPLIERS_DATA = {
  10: [25, 5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5, 25],
  11: [50, 10, 3, 1.5, 0.5, 0.2, 0.2, 0.5, 1.5, 3, 10, 50],
  12: [100, 20, 5, 2, 1, 0.3, 0.2, 0.3, 1, 2, 5, 20, 100],
  13: [150, 30, 8, 3, 1.2, 0.5, 0.2, 0.2, 0.5, 1.2, 3, 8, 30, 150],
  14: [200, 50, 12, 4, 1.5, 0.5, 0.2, 0.2, 0.2, 0.5, 1.5, 4, 12, 50, 200],
  15: [300, 80, 20, 6, 2, 0.8, 0.2, 0.2, 0.2, 0.8, 2, 6, 20, 80, 300],
  16: [500, 120, 30, 10, 3, 1, 0.4, 0.2, 0.2, 0.2, 0.4, 1, 3, 10, 30, 120, 500]
};

export const config = {
  initialBalance: 1000,
  minBet: 5,
  maxBet: 1000,
  betStep: 5,
  launchCooldown: 400,
  autoPlaySpeed: 300
};

export const gameState = {
  balance: config.initialBalance,
  currentBet: 10,
  rows: 16,
  activeBalls: new Set(),
  lastLaunchTime: 0,
  isAutoMode: false,
  autoplayRemaining: 0,
  autoplayInterval: null
};
