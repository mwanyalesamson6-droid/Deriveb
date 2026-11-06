import React, { useMemo } from 'react';
import { MarketMetrics, SyntheticIndex, TickData } from '../types/deriv';
import { TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';

interface TickChartViewerProps {
  metrics: MarketMetrics;
  index: SyntheticIndex;
  recentTicks: TickData[];
}

export const TickChartViewer: React.FC<TickChartViewerProps> = ({
  metrics,
  index,
  recentTicks,
}) => {
  const isUp = metrics.priceChange >= 0;
  const isEven = metrics.lastDigit % 2 === 0;

  // Generate SVG path for tick chart
  const chartData = useMemo(() => {
    if (recentTicks.length < 2) return { path: '', areaPath: '', min: 0, max: 1, points: [] };

    const prices = recentTicks.map(t => t.quote);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const width = 640;
    const height = 140;
    const padding = 16;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    const points = recentTicks.map((t, i) => {
      const x = padding + (i / (recentTicks.length - 1)) * chartWidth;
      const normalizedY = (t.quote - min) / range;
      const y = height - padding - normalizedY * chartHeight;
      return { x, y, quote: t.quote, digit: t.lastDigit, epoch: t.epoch };
    });

    const path = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`, '');
    const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)},${height} L ${points[0].x.toFixed(1)},${height} Z`;

    return { path, areaPath, min, max, points };
  }, [recentTicks]);

  // Last 20 digits slice
  const last20Digits = useMemo(() => {
    return recentTicks.slice(-20).map(t => t.lastDigit);
  }, [recentTicks]);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
      {/* Top Header of Chart */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">{index.displayName}</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {index.symbol}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Decimals: {index.decimals}</span>
            <span>·</span>
            <span>Volatility Rate: {index.volatilityRate}%</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Tick Stream</span>
            </span>
          </div>
        </div>

        {/* Price & Change */}
        <div className="text-right">
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {metrics.latestPrice.toFixed(index.decimals)}
          </div>
          <div
            className={`text-xs font-mono font-medium flex items-center justify-end gap-1 ${
              isUp ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>
              {isUp ? '+' : ''}
              {metrics.priceChange.toFixed(index.decimals)} ({isUp ? '+' : ''}
              {metrics.priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Tick Chart + Hero Last Digit + Quick Digits summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 my-5">
        {/* Real-time SVG Chart */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Price Momentum Trajectory (Last {recentTicks.length} Ticks)</span>
            <span className="font-mono">
              High: {chartData.max.toFixed(index.decimals)} | Low: {chartData.min.toFixed(index.decimals)}
            </span>
          </div>

          <div className="w-full h-36 bg-slate-950/60 rounded-lg border border-slate-800/80 p-2 overflow-hidden relative">
            <svg
              viewBox="0 0 640 140"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="tickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={isUp ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid guide lines */}
              <line x1="0" y1="35" x2="640" y2="35" stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
              <line x1="0" y1="70" x2="640" y2="70" stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
              <line x1="0" y1="105" x2="640" y2="105" stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />

              {/* Area path */}
              {chartData.areaPath && (
                <path d={chartData.areaPath} fill="url(#tickGradient)" />
              )}

              {/* Line path */}
              {chartData.path && (
                <path
                  d={chartData.path}
                  fill="none"
                  stroke={isUp ? '#10b981' : '#f43f5e'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Latest Point Indicator */}
              {chartData.points.length > 0 && (
                <circle
                  cx={chartData.points[chartData.points.length - 1].x}
                  cy={chartData.points[chartData.points.length - 1].y}
                  r="5"
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  className="animate-pulse"
                />
              )}
            </svg>
          </div>
        </div>

        {/* Hero Last Digit Panel */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950/70 border border-slate-800 rounded-lg text-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
            Current Tick Digit
          </span>
          <div
            key={metrics.lastDigit + '-' + metrics.latestPrice}
            className={`text-6xl font-extrabold font-mono transition-transform duration-150 transform scale-100 ${
              isEven ? 'text-cyan-400' : 'text-purple-400'
            }`}
          >
            {metrics.lastDigit}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                isEven
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              }`}
            >
              {isEven ? 'EVEN' : 'ODD'}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                metrics.lastDigit > 4
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              {metrics.lastDigit > 4 ? 'OVER 4' : 'UNDER 5'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            Streak: {metrics.consecutiveParityStreak.count} {metrics.consecutiveParityStreak.type}
          </div>
        </div>
      </div>

      {/* Last 20 Digits Tape */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Consecutive Digits Tape (Oldest → Latest)</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <span>Even: {metrics.evenPercentage}%</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              <span>Odd: {metrics.oddPercentage}%</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {last20Digits.map((digit, idx) => {
            const isDigitEven = digit % 2 === 0;
            const isLatest = idx === last20Digits.length - 1;
            return (
              <div
                key={idx}
                className={`flex-1 min-w-[32px] h-9 rounded flex items-center justify-center font-mono font-bold text-sm border transition-all ${
                  isLatest ? 'ring-2 ring-emerald-400 scale-105' : ''
                } ${
                  isDigitEven
                    ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40'
                    : 'bg-purple-950/40 text-purple-300 border-purple-800/40'
                }`}
              >
                {digit}
              </div>
            );
          })}
        </div>
      </div>

      {/* 0 - 9 Digit Frequency Distribution Histogram */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>0-9 Digit Frequency Distribution (Last {recentTicks.length} Ticks)</span>
          </span>
          <span className="text-slate-500">Expected Mean: 10%</span>
        </div>

        <div className="grid grid-cols-10 gap-2">
          {metrics.digitPercentages.map((pct, digit) => {
            const isCold = pct <= 6;
            const isHot = pct >= 15;
            const isDigitEven = digit % 2 === 0;

            return (
              <div
                key={digit}
                className="flex flex-col items-center bg-slate-950/40 border border-slate-800/60 rounded p-2 text-center"
              >
                <div className="text-xs font-mono font-bold text-slate-300 mb-1">{digit}</div>
                <div className="w-full h-14 bg-slate-900 rounded-sm overflow-hidden flex flex-col justify-end p-0.5 relative">
                  {/* 10% baseline mark */}
                  <div
                    className="absolute w-full border-t border-slate-600/50"
                    style={{ bottom: '25%' }}
                    title="10% theoretical expected baseline"
                  />
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${
                      isHot
                        ? 'bg-emerald-500'
                        : isCold
                        ? 'bg-rose-500/80'
                        : isDigitEven
                        ? 'bg-cyan-500/70'
                        : 'bg-purple-500/70'
                    }`}
                    style={{ height: `${Math.min(100, pct * 2.5)}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono mt-1 text-slate-400 font-medium">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
