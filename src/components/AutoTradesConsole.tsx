import React, { useState } from 'react';
import {
  BotConfig,
  BotStatus,
  ContractType,
  DerivAccount,
  TradingMode,
} from '../types/deriv';
import {
  Sparkles,
  Zap,
  Play,
  Pause,
  Layers,
  TrendingUp,
  Key,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Terminal,
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface AutoTradesConsoleProps {
  account: DerivAccount;
  isConnected: boolean;
  botStatus: BotStatus;
  tradingMode: TradingMode;
  onSelectMode: (mode: TradingMode) => void;
  onToggleAutoTrades: () => void;
  statusMessage: string;
  confidenceScore: number;
  activeSymbolName: string;
  scannerLogs: Array<{ time: string; text: string; type: 'scan' | 'signal' | 'switch' | 'trade' | 'win' | 'loss' }>;
  onAuthorizeToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  onDisconnectAccount: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  config: BotConfig;
  onOpenConfig: () => void;
}

export const AutoTradesConsole: React.FC<AutoTradesConsoleProps> = ({
  account,
  isConnected,
  botStatus,
  tradingMode,
  onSelectMode,
  onToggleAutoTrades,
  statusMessage,
  confidenceScore,
  activeSymbolName,
  scannerLogs,
  onAuthorizeToken,
  onDisconnectAccount,
  soundEnabled,
  onToggleSound,
  config,
  onOpenConfig,
}) => {
  const [quickToken, setQuickToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const isRunning = botStatus !== 'idle' && botStatus !== 'stopped';

  const handleQuickConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickToken.trim()) return;
    setIsSubmittingToken(true);
    setTokenError(null);
    const res = await onAuthorizeToken(quickToken.trim());
    setIsSubmittingToken(false);
    if (!res.success) {
      setTokenError(res.error || 'Failed to connect Deriv API token');
    } else {
      setQuickToken('');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden">
      {/* Top Banner: Quick Deriv API Token Bar like Trader Vexis */}
      <div className="pb-4 mb-5 border-b border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Account Info Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
              account.isAuthorized
                ? account.isVirtual
                  ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}
          >
            {account.isAuthorized ? (account.isVirtual ? 'DEMO' : 'LIVE') : 'DEMO'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">
                {account.isAuthorized ? (account.isVirtual ? 'Deriv Demo Account' : 'Deriv Real Account') : 'Deriv Virtual Sandbox'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ({account.loginId})
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Balance:</span>
              <span className="text-emerald-400 font-bold text-sm">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.currency}
              </span>
              <span className="text-slate-500">·</span>
              <span className={`text-[10px] ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isConnected ? 'WebSocket Live' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Token Input / Disconnect Button */}
        <div className="flex items-center gap-2">
          {!account.isAuthorized ? (
            <form onSubmit={handleQuickConnect} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="Paste Deriv API Token to Go Live"
                  value={quickToken}
                  onChange={(e) => setQuickToken(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono w-56 sm:w-64 focus:outline-none focus:border-emerald-500 pr-7"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-white"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmittingToken || !quickToken.trim()}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isSubmittingToken ? 'Authorizing...' : 'Go Live'}</span>
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Token Authorized
              </span>
              <button
                onClick={onDisconnectAccount}
                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded border border-slate-800 hover:border-rose-900/40 transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
            title={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {tokenError && (
        <div className="mb-4 p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
          {tokenError}
        </div>
      )}

      {/* Main Auto Trades Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Strategy Modes & Big Start Switch (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white tracking-tight">
                  Auto Trades Engine (Continuous Autonomous Execution)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Active: <strong className="text-white">{activeSymbolName}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Select an auto-trading mode below. The AI scanner continuously scans the live Deriv markets in real time, identifies trends, switches indices automatically, and executes trades <strong className="text-emerald-400">only when confirmation signals are verified</strong>.
            </p>

            {/* 3 Auto Modes (Over/Under, Even/Odd, Universal) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {/* Mode 1: Auto Over / Under */}
              <button
                onClick={() => onSelectMode('auto_over_under')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  tradingMode === 'auto_over_under'
                    ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm">Auto Over / Under</span>
                  </div>
                  {tradingMode === 'auto_over_under' && (
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Continuously scans digit void & skewness across all indexes. Auto-switches to the best Over / Under opportunity and executes.
                </p>
              </button>

              {/* Mode 2: Auto Even / Odd */}
              <button
                onClick={() => onSelectMode('auto_even_odd')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  tradingMode === 'auto_even_odd'
                    ? 'bg-purple-600/15 border-purple-500 ring-1 ring-purple-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-sm">Auto Even / Odd</span>
                  </div>
                  {tradingMode === 'auto_even_odd' && (
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Continuously scans parity clusters & streaks across all indexes. Auto-switches to the strongest Even / Odd setup and executes.
                </p>
              </button>
            </div>
          </div>

          {/* Big Tactile START / STOP AUTO TRADES Button */}
          <div className="pt-2">
            <button
              onClick={onToggleAutoTrades}
              className={`w-full py-4 rounded-xl font-extrabold text-base tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-3 ${
                isRunning
                  ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500/60 hover:bg-rose-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 ring-4 ring-emerald-500/25 shadow-emerald-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current animate-pulse" />
                  <span>PAUSE AUTO TRADES</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>ACTIVATE CONTINUOUS AUTO TRADES</span>
                </>
              )}
            </button>

            {/* Status indicator bar under the button */}
            <div className="mt-3 flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning
                      ? botStatus === 'in_trade'
                        ? 'bg-blue-400 animate-ping'
                        : 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="text-slate-300 font-medium">
                  {statusMessage}
                </span>
              </div>

              <button
                onClick={onOpenConfig}
                className="text-slate-400 hover:text-white underline font-mono text-[11px]"
              >
                Stake: ${config.currentStake.toFixed(2)} | Target: +${config.targetProfit}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Scanner Activity Terminal Feed (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[260px] bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Autonomous Scanner Stream</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{isRunning ? 'SCANNING LIVE' : 'STANDBY'}</span>
            </div>
          </div>

          {/* Terminal log messages container */}
          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
            {scannerLogs.length === 0 ? (
              <div className="text-slate-600 italic py-8 text-center">
                Waiting for scanner initialization... Start auto trades to watch live market analysis.
              </div>
            ) : (
              scannerLogs.slice(0, 20).map((log, i) => (
                <div
                  key={i}
                  className={`leading-snug ${
                    log.type === 'win'
                      ? 'text-emerald-400 font-semibold'
                      : log.type === 'loss'
                      ? 'text-rose-400 font-semibold'
                      : log.type === 'switch'
                      ? 'text-cyan-300'
                      : log.type === 'trade'
                      ? 'text-amber-300'
                      : log.type === 'signal'
                      ? 'text-purple-300'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600 text-[10px]">{log.time} · </span>
                  <span>{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
