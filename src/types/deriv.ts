export type TradingMode = 'auto_even_odd' | 'auto_over_under' | 'manual';

export type ContractType = 'DIGITEVEN' | 'DIGITODD' | 'DIGITOVER' | 'DIGITUNDER';

export type BotStatus = 'idle' | 'scanning' | 'waiting_signal' | 'signal_confirmed' | 'executing' | 'in_trade' | 'cooldown' | 'stopped';

export type AccountType = 'demo' | 'real';

export interface SyntheticIndex {
  symbol: string;
  displayName: string;
  shortName: string;
  decimals: number;
  volatilityRate: number; // e.g. 10, 25, 50, 75, 100
  isOneSecond?: boolean;
}

export interface TickData {
  epoch: number;
  quote: number;
  lastDigit: number;
  symbol: string;
}

export interface MarketMetrics {
  symbol: string;
  latestPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastDigit: number;
  ticks: TickData[];
  
  // Parity stats (last 50 ticks)
  evenCount: number;
  oddCount: number;
  evenPercentage: number;
  oddPercentage: number;
  consecutiveParityStreak: {
    type: 'even' | 'odd';
    count: number;
  };
  
  // Digit distribution (0 to 9 counts and percentages)
  digitCounts: number[]; // length 10
  digitPercentages: number[]; // length 10
  
  // Over/Under stats (relative to barrier, default barrier 4/5)
  overCount: number; // > barrier
  underCount: number; // < barrier
  overPercentage: number;
  underPercentage: number;
  
  // Technical Indicators
  rsi: number;
  emaFast: number;
  emaSlow: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  volatilityScore: number; // 0 - 100
  
  // Signal Scores
  evenOddSignalScore: number; // 0 - 100
  evenOddRecommendedType?: 'DIGITEVEN' | 'DIGITODD';
  evenOddReason?: string;
  
  overUnderSignalScore: number; // 0 - 100
  overUnderRecommendedType?: 'DIGITOVER' | 'DIGITUNDER';
  overUnderRecommendedBarrier?: number;
  overUnderReason?: string;
}

export interface SignalConfirmation {
  isValid: boolean;
  score: number; // 0 to 100
  targetSymbol: string;
  contractType: ContractType;
  barrier?: number;
  recommendedDuration: number; // in ticks (usually 1 - 3)
  recommendedStake: number;
  statusText: string;
  indicators: {
    name: string;
    value: string;
    passed: boolean;
    description: string;
  }[];
  explanation: string;
}

export interface BotConfig {
  baseStake: number;
  currentStake: number;
  targetProfit: number;
  stopLoss: number;
  durationTicks: number;
  minConfidenceThreshold: number; // e.g. 80%
  moneyManagement: 'martingale' | 'dalembert' | 'fixed';
  martingaleMultiplier: number; // usually 2.0 to 2.2
  maxMartingaleSteps: number;
  maxConsecutiveLosses: number;
  cooldownSeconds: number;
  aiDynamicStake: boolean;
  aiDynamicDuration: boolean;
}

export interface TradeRecord {
  id: string;
  contractId: string | number;
  timestamp: number;
  symbol: string;
  symbolName: string;
  contractType: ContractType;
  barrier?: number;
  stake: number;
  payout: number;
  entrySpot: number;
  entryDigit: number;
  exitSpot?: number;
  exitDigit?: number;
  profit: number;
  status: 'won' | 'lost' | 'pending';
  durationTicks: number;
  strategyUsed: string;
  confidenceScore: number;
}

export interface DerivAccount {
  isAuthorized: boolean;
  isVirtual: boolean;
  loginId: string;
  balance: number;
  currency: string;
  email?: string;
  token?: string;
}

export interface BotPerformance {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
  highestWinStreak: number;
  maxDrawdown: number;
}
