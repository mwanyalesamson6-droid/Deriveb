import React from 'react';
import {
  Sparkles,
  Zap,
  Play,
  Pause,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import { BotStatus, TradingMode } from '../types/deriv';

interface HeroScannerActionsProps {
  tradingMode: TradingMode;
  botStatus: BotStatus;
  activeSymbol: string;
  activeSymbolName: string;
  onScanOverUnder: () => void;
  onScanEvenOdd: () => void;
  onToggleBot: () => void;
  isScanning: boolean;
  scanCategory: 'even_odd' | 'over_under' | null;
  statusMessage: string;
  confidenceScore: number;
}

export const HeroScannerActions: React.FC<HeroScannerActionsProps> = ({
  tradingMode,
  botStatus,
  activeSymbol,
  activeSymbolName,
  onScanOverUnder,
  onScanEvenOdd,
  onToggleBot,
  isScanning,
  scanCategory,
  statusMessage,
  confidenceScore,
}) => {
  const isRunning = botStatus !== 'idle' && botStatus !== 'stopped';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left side: Context & Mode Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-emerald-400">Autonomous Deriv Execution Engine</span>
            <span>·</span>
            <span className="font-mono">Active Index: {activeSymbolName}</span>
            <span>·</span>
            <span className="capitalize text-slate-300">
              Mode: {tradingMode.replace(/_/g, ' ')}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            AI Market Scanner & Algorithmic Execution
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Continuously monitors live Deriv tick momentum, digit distribution, and RSI parity. 
            Trades are triggered <span className="text-emerald-400 font-medium">only upon multi-indicator confirmation</span>, otherwise the bot waits in radar surveillance.
          </p>

          {/* Live Status Banner */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            {isRunning ? (
              botStatus === 'signal_confirmed' || botStatus === 'in_trade' ? (
                <div className="flex items-center gap-2 text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="font-medium">{statusMessage}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="font-medium">{statusMessage}</span>
                  <span className="text-slate-400">({confidenceScore}% confidence)</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-800/80 px-3 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Bot in standby. Select a scanner mode or start auto-trading.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Action Controls (Scan Over/Under, Scan Even/Odd, Start/Pause) */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          {/* Button 1: Scan Over / Under & Auto Switch */}
          <button
            onClick={onScanOverUnder}
            disabled={isScanning}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all border shadow-sm ${
              tradingMode === 'auto_over_under'
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 ring-1 ring-blue-500/30'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:border-blue-500/40'
            }`}
            title="Scan all synthetic indexes and automatically switch to trade Digits Over / Under"
          >
            {isScanning && scanCategory === 'over_under' ? (
              <Search className="w-4 h-4 text-blue-400 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 text-blue-400" />
            )}
            <div className="text-left">
              <div className="font-bold text-white">AI Scan Over / Under</div>
              <div className="text-[10px] text-slate-400">Auto-switch to best index</div>
            </div>
          </button>

          {/* Button 2: Scan Even / Odd & Auto Switch */}
          <button
            onClick={onScanEvenOdd}
            disabled={isScanning}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all border shadow-sm ${
              tradingMode === 'auto_even_odd'
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 ring-1 ring-purple-500/30'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 hover:border-purple-500/40'
            }`}
            title="Scan all synthetic indexes and automatically switch to trade Digits Even / Odd"
          >
            {isScanning && scanCategory === 'even_odd' ? (
              <Search className="w-4 h-4 text-purple-400 animate-spin" />
            ) : (
              <Layers className="w-4 h-4 text-purple-400" />
            )}
            <div className="text-left">
              <div className="font-bold text-white">AI Scan Even / Odd</div>
              <div className="text-[10px] text-slate-400">Auto-switch to best parity</div>
            </div>
          </button>

          {/* Main Bot Start / Pause Button */}
          <button
            onClick={onToggleBot}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all shadow-md ${
              isRunning
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 ring-2 ring-emerald-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Bot</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Trading</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
