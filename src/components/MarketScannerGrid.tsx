import React, { useState } from 'react';
import { MarketMetrics, SyntheticIndex } from '../types/deriv';
import { SYNTHETIC_INDICES } from '../services/derivIndices';
import { TrendingUp, TrendingDown, Layers, Zap, ArrowRight, Check } from 'lucide-react';

interface MarketScannerGridProps {
  metricsMap: Map<string, MarketMetrics>;
  activeSymbol: string;
  onSelectIndex: (symbol: string) => void;
  tradingMode: string;
}

export const MarketScannerGrid: React.FC<MarketScannerGridProps> = ({
  metricsMap,
  activeSymbol,
  onSelectIndex,
  tradingMode,
}) => {
  const [filter, setFilter] = useState<'all' | 'standard' | 'one_second'>('all');

  const filteredIndices = SYNTHETIC_INDICES.filter((idx) => {
    if (filter === 'standard') return !idx.isOneSecond;
    if (filter === 'one_second') return idx.isOneSecond;
    return true;
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Synthetic Volatility Indices Scanner
          </h3>
          <p className="text-xs text-slate-400">
            Real-time live pricing, parity balance, and AI signal readiness across all indexes
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All (10)
          </button>
          <button
            onClick={() => setFilter('standard')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'standard'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard (2s)
          </button>
          <button
            onClick={() => setFilter('one_second')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filter === 'one_second'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1-Second (1s)
          </button>
        </div>
      </div>

      {/* Grid of Index Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4">
        {filteredIndices.map((idx) => {
          const m = metricsMap.get(idx.symbol);
          const isSelected = activeSymbol === idx.symbol;
          const isUp = m ? m.priceChange >= 0 : true;

          const eoScore = m ? m.evenOddSignalScore : 50;
          const ouScore = m ? m.overUnderSignalScore : 50;

          return (
            <div
              key={idx.symbol}
              onClick={() => onSelectIndex(idx.symbol)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>{idx.shortName}</span>
                    {isSelected && (
                      <span className="text-[10px] text-emerald-400 font-semibold px-1 rounded bg-emerald-500/10">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{idx.symbol}</div>
                </div>

                {m && (
                  <div
                    className={`text-sm font-extrabold font-mono w-7 h-7 rounded flex items-center justify-center border ${
                      m.lastDigit % 2 === 0
                        ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40'
                        : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                    }`}
                  >
                    {m.lastDigit}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="my-2">
                <div className="text-base font-bold font-mono text-white">
                  {m ? m.latestPrice.toFixed(idx.decimals) : '---.--'}
                </div>
                {m && (
                  <div
                    className={`text-[11px] font-mono flex items-center gap-0.5 ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>
                      {isUp ? '+' : ''}
                      {m.priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Even / Odd Parity Bar */}
              {m && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>E: {m.evenPercentage}%</span>
                    <span>O: {m.oddPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-purple-900/40 rounded-full overflow-hidden flex">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{ width: `${m.evenPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Signal Scores */}
              {m && (
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      ouScore >= 75
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    O/U {ouScore}%
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      eoScore >= 75
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    E/O {eoScore}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
