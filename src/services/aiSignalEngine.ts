import {
  BotConfig,
  ContractType,
  MarketMetrics,
  SignalConfirmation,
  TickData,
} from '../types/deriv';
import {
  calculateDigitDistribution,
  calculateEMA,
  calculateOverUnderStats,
  calculateParityStats,
  calculateRSI,
  calculateVolatilityScore,
} from './technicalAnalysis';

/**
 * Computes comprehensive real-time metrics for a given tick series of an index.
 */
export function analyzeMarket(symbol: string, ticks: TickData[]): MarketMetrics {
  const latestTick = ticks[ticks.length - 1] || { quote: 0, lastDigit: 0 };
  const prevTick = ticks[ticks.length - 2] || latestTick;

  const prices = ticks.map(t => t.quote);
  const priceChange = latestTick.quote - prevTick.quote;
  const priceChangePercent = prevTick.quote !== 0 ? (priceChange / prevTick.quote) * 100 : 0;

  // Parity statistics (last 40 ticks)
  const recentSlice = ticks.slice(-40);
  const parity = calculateParityStats(recentSlice);

  // Digit distribution (0 to 9)
  const dist = calculateDigitDistribution(recentSlice);

  // Over / Under relative to barrier 4
  const ou4 = calculateOverUnderStats(recentSlice, 4);

  // Technical Indicators
  const rsi = calculateRSI(prices, 14);
  const emaFast = calculateEMA(prices, 9);
  const emaSlow = calculateEMA(prices, 21);

  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (emaFast > emaSlow * 1.0001) trend = 'bullish';
  else if (emaFast < emaSlow * 0.9999) trend = 'bearish';

  const volatilityScore = calculateVolatilityScore(prices.slice(-20));

  // Compute Even/Odd Signal Score
  let eoScore = 50;
  let eoType: 'DIGITEVEN' | 'DIGITODD' = parity.evenPercentage > 50 ? 'DIGITEVEN' : 'DIGITODD';
  let eoReason = 'Parity evenly balanced';

  // Statistical anomaly detection: if one side has > 62% in last 40 ticks
  if (parity.evenPercentage >= 62) {
    eoScore += (parity.evenPercentage - 50) * 1.5;
    eoType = 'DIGITEVEN';
    eoReason = `High Even clustering (${parity.evenPercentage}% in last 40 ticks)`;
  } else if (parity.oddPercentage >= 62) {
    eoScore += (parity.oddPercentage - 50) * 1.5;
    eoType = 'DIGITODD';
    eoReason = `High Odd clustering (${parity.oddPercentage}% in last 40 ticks)`;
  }

  // Consecutive streak mean reversion boost (e.g. 4+ streak)
  if (parity.consecutiveParityStreak.count >= 4) {
    // If streak is long, high probability of parity pivot or strong continuation
    const oppositeType = parity.consecutiveParityStreak.type === 'even' ? 'DIGITODD' : 'DIGITEVEN';
    eoScore = Math.max(eoScore, 75 + parity.consecutiveParityStreak.count * 2.5);
    eoType = oppositeType;
    eoReason = `${parity.consecutiveParityStreak.count} consecutive ${parity.consecutiveParityStreak.type}s detected; mean reversion pivot expected`;
  }

  // RSI alignment boost
  if (rsi > 70 && eoType === 'DIGITODD') eoScore += 5;
  if (rsi < 30 && eoType === 'DIGITEVEN') eoScore += 5;

  eoScore = Math.min(95, Math.round(eoScore));

  // Compute Over/Under Signal Score & optimal barrier
  let ouScore = 50;
  let ouType: 'DIGITOVER' | 'DIGITUNDER' = 'DIGITOVER';
  let ouBarrier = 4;
  let ouReason = 'Digit spread balanced';

  // Test barrier 2 (High win rate Over), barrier 7 (High win rate Under), and barrier 4/5
  const countOver2 = recentSlice.filter(t => t.lastDigit > 2).length;
  const pctOver2 = Math.round((countOver2 / Math.max(1, recentSlice.length)) * 100);

  const countUnder7 = recentSlice.filter(t => t.lastDigit < 7).length;
  const pctUnder7 = Math.round((countUnder7 / Math.max(1, recentSlice.length)) * 100);

  if (pctOver2 >= 75 && trend === 'bullish') {
    ouScore = 80 + Math.min(15, (pctOver2 - 75) * 1.2);
    ouType = 'DIGITOVER';
    ouBarrier = 2;
    ouReason = `Strong bullish tick momentum; ${pctOver2}% digits > 2`;
  } else if (pctUnder7 >= 75 && trend === 'bearish') {
    ouScore = 80 + Math.min(15, (pctUnder7 - 75) * 1.2);
    ouType = 'DIGITUNDER';
    ouBarrier = 7;
    ouReason = `Strong bearish tick impulse; ${pctUnder7}% digits < 7`;
  } else if (ou4.overPercentage >= 65) {
    ouScore = 75 + (ou4.overPercentage - 50);
    ouType = 'DIGITOVER';
    ouBarrier = 4;
    ouReason = `High digit dominance (${ou4.overPercentage}% digits > 4)`;
  } else if (ou4.underPercentage >= 65) {
    ouScore = 75 + (ou4.underPercentage - 50);
    ouType = 'DIGITUNDER';
    ouBarrier = 4;
    ouReason = `Low digit dominance (${ou4.underPercentage}% digits < 4)`;
  }

  ouScore = Math.min(95, Math.round(ouScore));

  return {
    symbol,
    latestPrice: latestTick.quote,
    previousPrice: prevTick.quote,
    priceChange,
    priceChangePercent,
    lastDigit: latestTick.lastDigit,
    ticks,
    evenCount: parity.evenCount,
    oddCount: parity.oddCount,
    evenPercentage: parity.evenPercentage,
    oddPercentage: parity.oddPercentage,
    consecutiveParityStreak: parity.consecutiveParityStreak,
    digitCounts: dist.counts,
    digitPercentages: dist.percentages,
    overCount: ou4.overCount,
    underCount: ou4.underCount,
    overPercentage: ou4.overPercentage,
    underPercentage: ou4.underPercentage,
    rsi,
    emaFast,
    emaSlow,
    trend,
    volatilityScore,
    evenOddSignalScore: eoScore,
    evenOddRecommendedType: eoType,
    evenOddReason: eoReason,
    overUnderSignalScore: ouScore,
    overUnderRecommendedType: ouType,
    overUnderRecommendedBarrier: ouBarrier,
    overUnderReason: ouReason,
  };
}

/**
 * Validates whether the signal satisfies strict confirmation criteria.
 * Enforces "it trades only when signals confirmed are ok. if not then it waits".
 */
export function evaluateSignalConfirmation(
  metrics: MarketMetrics,
  mode: 'auto_even_odd' | 'auto_over_under' | 'manual',
  manualType: ContractType,
  config: BotConfig,
  currentBalance: number
): SignalConfirmation {
  let score = 50;
  let contractType: ContractType = 'DIGITEVEN';
  let barrier: number | undefined = undefined;
  let explanation = '';
  const indicators: SignalConfirmation['indicators'] = [];

  const threshold = config.minConfidenceThreshold;

  if (mode === 'auto_even_odd') {
    score = metrics.evenOddSignalScore;
    contractType = metrics.evenOddRecommendedType || 'DIGITEVEN';
    explanation = metrics.evenOddReason || 'Analyzing parity dynamics';

    // Indicator 1: Parity distribution imbalance
    const parityEdge = Math.max(metrics.evenPercentage, metrics.oddPercentage);
    const parityPassed = parityEdge >= 58 || metrics.consecutiveParityStreak.count >= 3;
    indicators.push({
      name: 'Digit Parity Frequency',
      value: `${parityEdge}% ${metrics.evenPercentage > metrics.oddPercentage ? 'Even' : 'Odd'} (Streak: ${metrics.consecutiveParityStreak.count})`,
      passed: parityPassed,
      description: parityPassed
        ? 'Statistically significant parity imbalance verified'
        : 'Parity too evenly distributed (neutral risk)',
    });

    // Indicator 2: RSI Oscillator & Reversion
    const rsiAligned =
      (contractType === 'DIGITEVEN' && metrics.rsi <= 65) ||
      (contractType === 'DIGITODD' && metrics.rsi >= 35);
    indicators.push({
      name: 'RSI (14) Momentum',
      value: `${metrics.rsi}`,
      passed: rsiAligned,
      description: rsiAligned ? 'RSI momentum supports entry direction' : 'RSI momentum divergent',
    });

    // Indicator 3: Tick Volatility Stability
    const volStable = metrics.volatilityScore >= 20 && metrics.volatilityScore <= 85;
    indicators.push({
      name: 'Index Volatility Regime',
      value: `${metrics.volatilityScore}/100`,
      passed: volStable,
      description: volStable
        ? 'Healthy tick flow without anomalous whip-saw'
        : 'Extreme volatility risk detected',
    });

    // Indicator 4: Streak Exhaustion / Clustering
    const streakConfirm = metrics.consecutiveParityStreak.count >= 2;
    indicators.push({
      name: 'Digit Cluster Gate',
      value: `${metrics.consecutiveParityStreak.count} ticks`,
      passed: streakConfirm,
      description: streakConfirm
        ? 'Cluster depth confirmed for actionable entry'
        : 'Waiting for 2+ consecutive cluster confirmation',
    });
  } else if (mode === 'auto_over_under') {
    score = metrics.overUnderSignalScore;
    contractType = metrics.overUnderRecommendedType || 'DIGITOVER';
    barrier = metrics.overUnderRecommendedBarrier || 4;
    explanation = metrics.overUnderReason || 'Analyzing digit spread';

    // Indicator 1: Barrier Probability Edge
    const edge = Math.max(metrics.overPercentage, metrics.underPercentage);
    const edgePassed = edge >= 60 || barrier === 2 || barrier === 7;
    indicators.push({
      name: `Barrier ${barrier} Edge`,
      value: `${edge}% ${contractType === 'DIGITOVER' ? 'Over' : 'Under'}`,
      passed: edgePassed,
      description: edgePassed ? 'Mathematical edge exceeds safety baseline' : 'Insufficient probability edge',
    });

    // Indicator 2: Trend Alignment (EMA Fast vs Slow)
    const trendPassed =
      (contractType === 'DIGITOVER' && metrics.trend !== 'bearish') ||
      (contractType === 'DIGITUNDER' && metrics.trend !== 'bullish');
    indicators.push({
      name: 'Price Trend Alignment',
      value: `${metrics.trend.toUpperCase()} (EMA 9/21)`,
      passed: trendPassed,
      description: trendPassed
        ? 'Macro tick trend aligns with digit trajectory'
        : 'Counter-trend entry detected, awaiting alignment',
    });

    // Indicator 3: Extreme Digit Suppression
    const coldDigits = metrics.digitPercentages.filter(p => p < 7).length;
    indicators.push({
      name: 'Cold Digit Anomaly',
      value: `${coldDigits} cold digits (<7%)`,
      passed: coldDigits >= 2,
      description:
        coldDigits >= 2 ? 'Specific digit suppression creates statistical void' : 'Digits uniformly dispersed',
    });

    // Indicator 4: Volatility Band
    const volCheck = metrics.volatilityScore >= 25;
    indicators.push({
      name: 'Volatility Expansion',
      value: `${metrics.volatilityScore}/100`,
      passed: volCheck,
      description: volCheck ? 'Dynamic tick motion confirms follow-through' : 'Market stagnant, low follow-through',
    });
  } else {
    // Manual mode
    contractType = manualType;
    score = 70;
    explanation = 'Manual mode: observing indicator alignment before execution';
    indicators.push({
      name: 'User Strategy Mode',
      value: manualType,
      passed: true,
      description: 'Manual parameter active',
    });
  }

  // Check if ALL or sufficient indicators passed
  const passedCount = indicators.filter(i => i.passed).length;
  const isConfirmed = score >= threshold && passedCount >= Math.ceil(indicators.length * 0.75);

  // Dynamic Stake & Duration determination
  let recommendedStake = config.currentStake;
  if (config.aiDynamicStake) {
    // Scale stake conservatively based on confidence: base stake * 1.0 up to 1.3 for 90%+ confidence
    const confidenceMultiplier = score >= 90 ? 1.25 : score >= 85 ? 1.1 : 1.0;
    recommendedStake = Math.round(config.currentStake * confidenceMultiplier * 100) / 100;
  }

  let recommendedDuration = config.durationTicks;
  if (config.aiDynamicDuration) {
    // Fast 1 tick for 1s indexes or high volatility; 2 ticks for smoother trends
    recommendedDuration = metrics.volatilityScore > 65 ? 1 : 2;
  }

  const statusText = isConfirmed
    ? `SIGNAL CONFIRMED (${score}%) — Executing ${contractType} ${barrier !== undefined ? `Barrier ${barrier}` : ''}`
    : `WAITING FOR CONFIRMED SIGNAL (${score}% / Required ${threshold}%) — Searching for optimal entry`;

  return {
    isValid: isConfirmed,
    score,
    targetSymbol: metrics.symbol,
    contractType,
    barrier,
    recommendedDuration,
    recommendedStake,
    statusText,
    indicators,
    explanation,
  };
}
