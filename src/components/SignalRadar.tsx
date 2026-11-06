import React from 'react';
import { SignalConfirmation, BotStatus } from '../types/deriv';
import {
  Radar,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Zap,
} from 'lucide-react';

interface SignalRadarProps {
  confirmation: SignalConfirmation;
  botStatus: BotStatus;
  threshold: number;
}

export const SignalRadar: React.FC<SignalRadarProps> = ({
  confirmation,
  botStatus,
  threshold,
}) => {
  const isConfirmed = confirmation.isValid;
  const isRunning = botStatus !== 'idle' && botStatus !== 'stopped';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radar className={`w-4 h-4 ${isRunning && !isConfirmed ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Multi-Indicator Signal Confirmation Radar
            </h3>
            <p className="text-xs text-slate-400">
              Only executes when all technical and statistical gates are confirmed
            </p>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">Confidence Score</div>
            <div
              className={`text-xl font-bold font-mono ${
                confirmation.score >= threshold ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {confirmation.score}%{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">
                (Min: {threshold}%)
              </span>
            </div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isConfirmed
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isConfirmed ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Signal Confirmed</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>Waiting & Searching</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rationale Banner */}
      <div className="my-4 p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-start gap-3">
        <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">AI Strategy Diagnosis: </span>
          {confirmation.explanation}.{' '}
          {isConfirmed ? (
            <span className="text-emerald-400 font-medium">
              Targeting {confirmation.contractType}{' '}
              {confirmation.barrier !== undefined ? `Barrier ${confirmation.barrier}` : ''} on{' '}
              {confirmation.targetSymbol} ({confirmation.recommendedDuration} tick duration, $
              {confirmation.recommendedStake.toFixed(2)} stake).
            </span>
          ) : (
            <span className="text-amber-300 font-medium">
              Entry withheld to preserve capital until conditions reach {threshold}% confirmation threshold.
            </span>
          )}
        </div>
      </div>

      {/* Indicator Confirmation Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {confirmation.indicators.map((ind, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border transition-all ${
              ind.passed
                ? 'bg-slate-950/40 border-emerald-500/30'
                : 'bg-slate-950/20 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-300">{ind.name}</span>
              {ind.passed ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
            </div>
            <div className="text-sm font-mono font-bold text-white mb-1">{ind.value}</div>
            <p className="text-[11px] text-slate-400 leading-snug">{ind.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
