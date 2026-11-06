import { TickData } from '../types/deriv';

/**
 * Extracts the authentic last digit from a Deriv price quote based on index decimal places.
 */
export function extractLastDigit(quote: number, decimals: number = 2): number {
  if (isNaN(quote)) return 0;
  const str = quote.toFixed(decimals);
  const lastChar = str.slice(-1);
  const digit = parseInt(lastChar, 10);
  return isNaN(digit) ? 0 : digit;
}

/**
 * Calculates Relative Strength Index (RSI) for a list of tick prices.
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Math.round(rsi * 10) / 10;
}

/**
 * Calculates Exponential Moving Average (EMA).
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1];

  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((acc, val) => acc + val, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Calculates parity statistics (Even vs Odd) on a tick slice.
 */
export function calculateParityStats(ticks: TickData[]) {
  if (ticks.length === 0) {
    return {
      evenCount: 0,
      oddCount: 0,
      evenPercentage: 50,
      oddPercentage: 50,
      consecutiveParityStreak: { type: 'even' as const, count: 0 },
    };
  }

  let evenCount = 0;
  let oddCount = 0;

  for (const t of ticks) {
    if (t.lastDigit % 2 === 0) {
      evenCount++;
    } else {
      oddCount++;
    }
  }

  const total = ticks.length;
  const evenPercentage = Math.round((evenCount / total) * 100);
  const oddPercentage = 100 - evenPercentage;

  // Streak detection from the newest ticks
  let streakCount = 1;
  const latestParity = ticks[ticks.length - 1].lastDigit % 2 === 0 ? 'even' : 'odd';

  for (let i = ticks.length - 2; i >= 0; i--) {
    const p = ticks[i].lastDigit % 2 === 0 ? 'even' : 'odd';
    if (p === latestParity) {
      streakCount++;
    } else {
      break;
    }
  }

  return {
    evenCount,
    oddCount,
    evenPercentage,
    oddPercentage,
    consecutiveParityStreak: {
      type: latestParity as 'even' | 'odd',
      count: streakCount,
    },
  };
}

/**
 * Calculates 0-9 digit frequency distribution.
 */
export function calculateDigitDistribution(ticks: TickData[]) {
  const counts = Array(10).fill(0);
  for (const t of ticks) {
    if (t.lastDigit >= 0 && t.lastDigit <= 9) {
      counts[t.lastDigit]++;
    }
  }

  const total = Math.max(1, ticks.length);
  const percentages = counts.map(c => Math.round((c / total) * 100));

  return {
    counts,
    percentages,
  };
}

/**
 * Computes Over/Under stats relative to a barrier (e.g. 4 or 5).
 */
export function calculateOverUnderStats(ticks: TickData[], barrier: number = 4) {
  if (ticks.length === 0) {
    return {
      overCount: 0,
      underCount: 0,
      overPercentage: 50,
      underPercentage: 50,
    };
  }

  let overCount = 0;
  let underCount = 0;

  for (const t of ticks) {
    if (t.lastDigit > barrier) {
      overCount++;
    } else if (t.lastDigit < barrier) {
      underCount++;
    }
  }

  const total = Math.max(1, overCount + underCount);
  const overPercentage = Math.round((overCount / total) * 100);
  const underPercentage = 100 - overPercentage;

  return {
    overCount,
    underCount,
    overPercentage,
    underPercentage,
  };
}

/**
 * Calculates tick volatility score from price standard deviations.
 */
export function calculateVolatilityScore(prices: number[]): number {
  if (prices.length < 5) return 50;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const normalized = (stdDev / (mean || 1)) * 10000;
  return Math.min(100, Math.max(10, Math.round(normalized * 10) / 10));
}
