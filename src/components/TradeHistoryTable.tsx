import React, { useState } from 'react';
import { BotPerformance, TradeRecord } from '../types/deriv';
import {
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface TradeHistoryTableProps {
  performance: BotPerformance;
  trades: TradeRecord[];
  onClearHistory: () => void;
}

export const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({
  performance,
  trades,
  onClearHistory,
}) => {
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');

  const filteredTrades = trades.filter((t) => {
    if (filter === 'won') return t.status === 'won';
    if (filter === 'lost') return t.status === 'lost';
    return true;
  });

  const exportCSV = () => {
    if (trades.length === 0) return;
    const headers = [
      'Timestamp',
      'Contract ID',
      'Symbol',
      'Contract Type',
      'Barrier',
      'Stake',
      'Entry Spot',
      'Entry Digit',
      'Exit Spot',
      'Exit Digit',
      'Net Profit',
      'Status',
    ];
    const rows = trades.map((t) => [
      new Date(t.timestamp).toISOString(),
      t.contractId,
      t.symbol,
      t.contractType,
      t.barrier || '',
      t.stake,
      t.entrySpot,
      t.entryDigit,
      t.exitSpot || '',
      t.exitDigit ?? '',
      t.profit,
      t.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deriv_bot_trades_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isProfitable = performance.netProfit >= 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
      {/* KPI Performance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Net Profit */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Net Profit / Loss</span>
          <div
            className={`text-xl font-bold font-mono tracking-tight mt-1 ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isProfitable ? '+' : ''}${performance.netProfit.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Max Drawdown: -${performance.maxDrawdown.toFixed(2)}
          </span>
        </div>

        {/* Win Rate */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Win Rate</span>
          <div className="text-xl font-bold font-mono text-cyan-400 tracking-tight mt-1">
            {performance.winRate}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {performance.wins} Won · {performance.losses} Lost
          </span>
        </div>

        {/* Total Trades */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Total Executions</span>
          <div className="text-xl font-bold font-mono text-white tracking-tight mt-1">
            {performance.totalTrades}
          </div>
          <span className="text-[10px] text-slate-500">Autonomous contracts</span>
        </div>

        {/* Current Streak */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Current Streak</span>
          <div className="text-xl font-bold font-mono text-white tracking-tight mt-1 flex items-center gap-1.5">
            {performance.streakType === 'win' ? (
              <span className="text-emerald-400">+{performance.currentStreak} Wins</span>
            ) : performance.streakType === 'loss' ? (
              <span className="text-rose-400">-{performance.currentStreak} Losses</span>
            ) : (
              <span className="text-slate-400">None</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Best streak: +{performance.highestWinStreak} wins
          </span>
        </div>

        {/* Profit Factor / Strategy Status */}
        <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
          <span className="text-xs text-slate-400 font-medium">Recovery Status</span>
          <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight mt-1">
            Nominal
          </div>
          <span className="text-[10px] text-slate-500">Strict signal gate active</span>
        </div>
      </div>

      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-white tracking-tight">Execution Audit Log</h3>
          <span className="text-xs font-mono text-slate-400">({trades.length} recorded)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                filter === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('won')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                filter === 'won' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Won ({performance.wins})
            </button>
            <button
              onClick={() => setFilter('lost')}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                filter === 'lost' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lost ({performance.losses})
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={exportCSV}
            disabled={trades.length === 0}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClearHistory}
            disabled={trades.length === 0}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/40 disabled:opacity-40 transition-colors"
            title="Clear Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Trades Table */}
      {filteredTrades.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No trade records match current view. Run the bot or execute a scanner mode to begin recording.
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Time</th>
                <th className="py-2.5 px-3 font-semibold">Contract</th>
                <th className="py-2.5 px-3 font-semibold">Index</th>
                <th className="py-2.5 px-3 font-semibold text-right">Stake</th>
                <th className="py-2.5 px-3 font-semibold text-center">Entry Spot</th>
                <th className="py-2.5 px-3 font-semibold text-center">Exit Spot & Digit</th>
                <th className="py-2.5 px-3 font-semibold text-right">Net Profit</th>
                <th className="py-2.5 px-3 font-semibold text-center">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTrades.map((t) => {
                const isWon = t.status === 'won';
                const isPending = t.status === 'pending';
                const timeStr = new Date(t.timestamp).toLocaleTimeString();

                return (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">{timeStr}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-sans font-semibold text-white">
                        {t.contractType.replace('DIGIT', '')}
                      </span>{' '}
                      {t.barrier !== undefined && (
                        <span className="text-[10px] text-slate-400 font-sans">
                          (Barrier {t.barrier})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 font-medium">
                      {t.symbolName}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      ${t.stake.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {t.entrySpot}{' '}
                      <span className="font-bold text-slate-200">[{t.entryDigit}]</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {t.exitSpot !== undefined ? (
                        <span>
                          {t.exitSpot}{' '}
                          <span
                            className={`font-bold px-1 rounded ${
                              t.exitDigit! % 2 === 0
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            [{t.exitDigit}]
                          </span>
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 animate-spin" /> In Progress
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        isWon ? 'text-emerald-400' : isPending ? 'text-slate-400' : 'text-rose-400'
                      }`}
                    >
                      {isWon ? `+$${t.profit.toFixed(2)}` : isPending ? '---' : `-$${t.stake.toFixed(2)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {isWon ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> WON
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 animate-spin" /> OPEN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                          <XCircle className="w-3 h-3" /> LOST
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
