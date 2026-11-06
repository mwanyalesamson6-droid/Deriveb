import React from 'react';
import { BotConfig } from '../types/deriv';
import { Settings, Shield, DollarSign, Sliders, Zap, CheckCircle2 } from 'lucide-react';

interface BotConfigPanelProps {
  config: BotConfig;
  onChangeConfig: (newConfig: BotConfig) => void;
  isBotRunning: boolean;
}

export const BotConfigPanel: React.FC<BotConfigPanelProps> = ({
  config,
  onChangeConfig,
  isBotRunning,
}) => {
  const update = (partial: Partial<BotConfig>) => {
    onChangeConfig({ ...config, ...partial });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Bot Execution & Capital Safeguards
            </h3>
            <p className="text-xs text-slate-400">
              Customize investment parameters, recovery multipliers, and strict safety ceilings
            </p>
          </div>
        </div>

        {isBotRunning && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Live Configuration Locked
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Base Stake */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Base Investment ($)</span>
            <span className="font-mono text-emerald-400">${config.baseStake.toFixed(2)}</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.35"
              step="0.5"
              disabled={isBotRunning}
              value={config.baseStake}
              onChange={(e) => update({ baseStake: Math.max(0.35, parseFloat(e.target.value) || 1) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-[11px] text-slate-500">Deriv minimum stake: $0.35 USD</span>
        </div>

        {/* Money Management */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Money Management Mode
          </label>
          <select
            disabled={isBotRunning}
            value={config.moneyManagement}
            onChange={(e) => update({ moneyManagement: e.target.value as any })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="martingale">Martingale (Loss Recovery)</option>
            <option value="dalembert">D'Alembert (+1 Step on Loss)</option>
            <option value="fixed">Fixed Stake (Zero Compounding)</option>
          </select>
          <span className="text-[11px] text-slate-500">
            {config.moneyManagement === 'martingale'
              ? `Multiplies by ${config.martingaleMultiplier}x on loss`
              : config.moneyManagement === 'dalembert'
              ? 'Adds 1 base unit after a loss'
              : 'Constant stake size on every trade'}
          </span>
        </div>

        {/* Martingale Multiplier */}
        {config.moneyManagement === 'martingale' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Martingale Multiplier</span>
              <span className="font-mono text-cyan-400">{config.martingaleMultiplier}x</span>
            </label>
            <input
              type="number"
              min="1.5"
              max="2.5"
              step="0.1"
              disabled={isBotRunning}
              value={config.martingaleMultiplier}
              onChange={(e) => update({ martingaleMultiplier: parseFloat(e.target.value) || 2.0 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-500">Max steps: {config.maxMartingaleSteps}</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Contract Duration (Ticks)
            </label>
            <select
              disabled={isBotRunning}
              value={config.durationTicks}
              onChange={(e) => update({ durationTicks: parseInt(e.target.value, 10) || 1 })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={1}>1 Tick (Ultra Fast)</option>
              <option value={2}>2 Ticks (Standard)</option>
              <option value={3}>3 Ticks (Steady)</option>
              <option value={5}>5 Ticks (Trend Following)</option>
            </select>
            <span className="text-[11px] text-slate-500">Settles after specified ticks</span>
          </div>
        )}

        {/* Min Confidence Gate */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Min Confidence Gate</span>
            <span className="font-mono text-emerald-400">{config.minConfidenceThreshold}%</span>
          </label>
          <input
            type="range"
            min="70"
            max="95"
            step="1"
            disabled={isBotRunning}
            value={config.minConfidenceThreshold}
            onChange={(e) => update({ minConfidenceThreshold: parseInt(e.target.value, 10) || 80 })}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>70% (Frequent)</span>
            <span>80% (Recommended)</span>
            <span>95% (Strict)</span>
          </div>
        </div>
      </div>

      {/* Safety Ceilings Row */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Take Profit */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-emerald-400">Take Profit Limit ($)</span>
            <span className="text-xs font-mono font-bold text-white">${config.targetProfit}</span>
          </div>
          <input
            type="number"
            min="1"
            step="5"
            disabled={isBotRunning}
            value={config.targetProfit}
            onChange={(e) => update({ targetProfit: Math.max(1, parseFloat(e.target.value) || 20) })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">Locks profits & stops automatically</span>
        </div>

        {/* Stop Loss */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-rose-400">Stop Loss Limit ($)</span>
            <span className="text-xs font-mono font-bold text-white">-${config.stopLoss}</span>
          </div>
          <input
            type="number"
            min="1"
            step="5"
            disabled={isBotRunning}
            value={config.stopLoss}
            onChange={(e) => update({ stopLoss: Math.max(1, parseFloat(e.target.value) || 50) })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">Hard stop to protect account equity</span>
        </div>

        {/* Max Consecutive Losses */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-amber-400">Max Consecutive Losses</span>
            <span className="text-xs font-mono font-bold text-white">{config.maxConsecutiveLosses}</span>
          </div>
          <input
            type="number"
            min="2"
            max="10"
            disabled={isBotRunning}
            value={config.maxConsecutiveLosses}
            onChange={(e) => update({ maxConsecutiveLosses: Math.max(2, parseInt(e.target.value, 10) || 4) })}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">Emergency stop during market anomalies</span>
        </div>
      </div>

      {/* Toggles for AI Dynamic Stake and Duration */}
      <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-slate-300">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.aiDynamicStake}
            onChange={(e) => update({ aiDynamicStake: e.target.checked })}
            className="w-4 h-4 rounded accent-emerald-500"
          />
          <span>AI Dynamic Stake (Scales proportionally with signal confidence)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.aiDynamicDuration}
            onChange={(e) => update({ aiDynamicDuration: e.target.checked })}
            className="w-4 h-4 rounded accent-emerald-500"
          />
          <span>AI Dynamic Duration (Adapts 1-2 ticks based on volatility velocity)</span>
        </label>
      </div>
    </div>
  );
};
