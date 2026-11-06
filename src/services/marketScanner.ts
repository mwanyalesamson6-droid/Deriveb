import { MarketMetrics, SyntheticIndex, TickData } from '../types/deriv';
import { SYNTHETIC_INDICES, getIndexBySymbol } from './derivIndices';
import { analyzeMarket } from './aiSignalEngine';
import { extractLastDigit } from './technicalAnalysis';

export interface ScanResult {
  symbol: string;
  index: SyntheticIndex;
  metrics: MarketMetrics;
  score: number;
  recommendedType: string;
  barrier?: number;
  reason: string;
}

export class MarketScannerService {
  private tickHistory: Map<string, TickData[]> = new Map();

  constructor() {
    this.seedInitialTicks();
  }

  /**
   * Seeds realistic synthetic price history so all indices have initial baseline metrics
   * before live ticks arrive from WebSocket.
   */
  private seedInitialTicks() {
    SYNTHETIC_INDICES.forEach((idx) => {
      const ticks: TickData[] = [];
      let basePrice = idx.volatilityRate * 12.345 + 1000;
      const now = Math.floor(Date.now() / 1000);

      for (let i = 60; i >= 0; i--) {
        const drift = (Math.random() - 0.49) * (idx.volatilityRate * 0.05);
        basePrice = Math.max(10, basePrice + drift);
        const digit = extractLastDigit(basePrice, idx.decimals);
        ticks.push({
          epoch: now - i * 2,
          quote: Math.round(basePrice * Math.pow(10, idx.decimals)) / Math.pow(10, idx.decimals),
          lastDigit: digit,
          symbol: idx.symbol,
        });
      }

      this.tickHistory.set(idx.symbol, ticks);
    });
  }

  /**
   * Appends an incoming live tick to the index buffer.
   */
  public addTick(tick: TickData) {
    let list = this.tickHistory.get(tick.symbol);
    if (!list) {
      list = [];
      this.tickHistory.set(tick.symbol, list);
    }

    list.push(tick);
    if (list.length > 150) {
      list.shift(); // keep last 150 ticks
    }
  }

  public getTicks(symbol: string): TickData[] {
    return this.tickHistory.get(symbol) || [];
  }

  public getMarketMetrics(symbol: string): MarketMetrics {
    const ticks = this.getTicks(symbol);
    return analyzeMarket(symbol, ticks);
  }

  public getAllMetrics(): MarketMetrics[] {
    return SYNTHETIC_INDICES.map(idx => this.getMarketMetrics(idx.symbol));
  }

  /**
   * Scans all indices and finds the optimal market for Over / Under trading.
   */
  public scanForOverUnder(): {
    bestMatch: ScanResult;
    allResults: ScanResult[];
  } {
    const allResults: ScanResult[] = SYNTHETIC_INDICES.map((idx) => {
      const metrics = this.getMarketMetrics(idx.symbol);
      return {
        symbol: idx.symbol,
        index: idx,
        metrics,
        score: metrics.overUnderSignalScore,
        recommendedType: metrics.overUnderRecommendedType || 'DIGITOVER',
        barrier: metrics.overUnderRecommendedBarrier || 4,
        reason: metrics.overUnderReason || 'Digit distribution scan',
      };
    });

    // Sort descending by score
    allResults.sort((a, b) => b.score - a.score);

    return {
      bestMatch: allResults[0],
      allResults,
    };
  }

  /**
   * Scans all indices and finds the optimal market for Even / Odd trading.
   */
  public scanForEvenOdd(): {
    bestMatch: ScanResult;
    allResults: ScanResult[];
  } {
    const allResults: ScanResult[] = SYNTHETIC_INDICES.map((idx) => {
      const metrics = this.getMarketMetrics(idx.symbol);
      return {
        symbol: idx.symbol,
        index: idx,
        metrics,
        score: metrics.evenOddSignalScore,
        recommendedType: metrics.evenOddRecommendedType || 'DIGITEVEN',
        reason: metrics.evenOddReason || 'Parity balance scan',
      };
    });

    // Sort descending by score
    allResults.sort((a, b) => b.score - a.score);

    return {
      bestMatch: allResults[0],
      allResults,
    };
  }

  /**
   * Evaluates all indices and finds the highest confirmed candidate matching the trading mode.
   * If a candidate meets or exceeds minConfidence, it is returned as confirmed.
   */
  public findBestMarketCandidate(
    mode: 'auto_even_odd' | 'auto_over_under' | 'universal',
    minConfidence: number
  ): {
    best: ScanResult;
    isConfirmed: boolean;
    allResults: ScanResult[];
  } {
    let allResults: ScanResult[] = [];

    if (mode === 'auto_even_odd') {
      const scan = this.scanForEvenOdd();
      allResults = scan.allResults;
    } else if (mode === 'auto_over_under') {
      const scan = this.scanForOverUnder();
      allResults = scan.allResults;
    } else {
      // Universal mode: evaluates both Over/Under and Even/Odd across all indexes
      const eo = this.scanForEvenOdd().allResults;
      const ou = this.scanForOverUnder().allResults;
      allResults = [...eo, ...ou].sort((a, b) => b.score - a.score);
    }

    const top = allResults[0];
    const isConfirmed = top.score >= minConfidence;

    return {
      best: top,
      isConfirmed,
      allResults,
    };
  }
}

export const marketScanner = new MarketScannerService();
