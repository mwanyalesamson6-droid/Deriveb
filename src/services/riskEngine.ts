import { BotConfig, BotPerformance, TradeRecord } from '../types/deriv';

export class RiskManager {
  /**
   * Computes the next stake based on the last trade result and configured money management rules.
   */
  public static calculateNextStake(
    config: BotConfig,
    lastTrade: TradeRecord | null,
    consecutiveLosses: number
  ): { nextStake: number; reason: string } {
    if (!lastTrade) {
      return { nextStake: config.baseStake, reason: 'Initial base stake' };
    }

    if (lastTrade.status === 'won') {
      return { nextStake: config.baseStake, reason: 'Trade won; reset to base stake' };
    }

    // Trade was lost
    switch (config.moneyManagement) {
      case 'martingale': {
        if (consecutiveLosses >= config.maxMartingaleSteps) {
          return {
            nextStake: config.baseStake,
            reason: `Max Martingale steps (${config.maxMartingaleSteps}) reached; reset to base stake for safety`,
          };
        }
        const next = Math.round(lastTrade.stake * config.martingaleMultiplier * 100) / 100;
        return {
          nextStake: next,
          reason: `Loss recovery step ${consecutiveLosses + 1} (${config.martingaleMultiplier}x multiplier)`,
        };
      }

      case 'dalembert': {
        const step = config.baseStake;
        const next = Math.round((lastTrade.stake + step) * 100) / 100;
        return {
          nextStake: next,
          reason: `D'Alembert recovery (+${step} base unit)`,
        };
      }

      case 'fixed':
      default:
        return { nextStake: config.baseStake, reason: 'Fixed stake mode' };
    }
  }

  /**
   * Checks whether the session has reached Take Profit, Stop Loss, or Max Consecutive Losses.
   */
  public static checkSafetyLimits(
    performance: BotPerformance,
    config: BotConfig,
    consecutiveLosses: number
  ): { shouldStop: boolean; reason?: string } {
    if (performance.netProfit >= config.targetProfit) {
      return {
        shouldStop: true,
        reason: `Take Profit goal reached (+${performance.netProfit.toFixed(2)}$ >= ${config.targetProfit}$)! Profits secured.`,
      };
    }

    if (performance.netProfit <= -Math.abs(config.stopLoss)) {
      return {
        shouldStop: true,
        reason: `Stop Loss floor reached (${performance.netProfit.toFixed(2)}$ <= -${config.stopLoss}$)! Bot stopped to preserve capital.`,
      };
    }

    if (consecutiveLosses >= config.maxConsecutiveLosses) {
      return {
        shouldStop: true,
        reason: `Max consecutive losses reached (${consecutiveLosses}). Halting to protect balance during market anomaly.`,
      };
    }

    return { shouldStop: false };
  }

  /**
   * Recalculates full performance KPIs from trades list.
   */
  public static computePerformance(trades: TradeRecord[]): BotPerformance {
    let wins = 0;
    let losses = 0;
    let netProfit = 0;
    let currentStreak = 0;
    let streakType: 'win' | 'loss' | 'none' = 'none';
    let highestWinStreak = 0;
    let tempWinStreak = 0;
    let maxDrawdown = 0;
    let peakProfit = 0;

    for (const t of trades) {
      if (t.status === 'won') {
        wins++;
        netProfit += t.profit;
        tempWinStreak++;
        if (tempWinStreak > highestWinStreak) highestWinStreak = tempWinStreak;
      } else if (t.status === 'lost') {
        losses++;
        netProfit -= t.stake;
        tempWinStreak = 0;
      }

      if (netProfit > peakProfit) {
        peakProfit = netProfit;
      }
      const drawdown = peakProfit - netProfit;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Determine current streak from newest trades
    if (trades.length > 0) {
      const latest = trades[0];
      if (latest.status === 'won' || latest.status === 'lost') {
        streakType = latest.status === 'won' ? 'win' : 'loss';
        currentStreak = 1;
        for (let i = 1; i < trades.length; i++) {
          if (trades[i].status === latest.status) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    const totalTrades = wins + losses;
    const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 0;

    return {
      totalTrades,
      wins,
      losses,
      winRate,
      netProfit: Math.round(netProfit * 100) / 100,
      currentStreak,
      streakType,
      highestWinStreak,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    };
  }
}
