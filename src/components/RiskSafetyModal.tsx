import React from 'react';
import { X, ShieldCheck, AlertTriangle, Cpu, TrendingUp, CheckCircle2 } from 'lucide-react';

interface RiskSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RiskSafetyModal: React.FC<RiskSafetyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Algorithmic Safety & Capital Preservation Architecture
            </h2>
            <p className="text-xs text-slate-400">
              How the multi-indicator confirmation engine and capital limits protect your account
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: Signal Confirmation Gate */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>1. Why The Bot Waits & Does Not Trade Continuously</span>
            </div>
            <p className="text-slate-400">
              The primary differentiator of this bot is the <strong className="text-slate-200">Strict Signal Confirmation Gate</strong>. Most retail bots blow accounts by trading every single tick in random market noise. This engine evaluates 5 simultaneous factors:
            </p>
            <ul className="mt-2 space-y-1 text-slate-300 list-disc list-inside pl-1">
              <li>Digit Parity Cluster & Deviation from 50/50</li>
              <li>RSI (14) Momentum Alignment</li>
              <li>EMA (9 vs 21) Macro Trend Direction</li>
              <li>Tick Volatility Velocity & Spike Suppression</li>
              <li>Extreme Digit Void / Cold Digit Anomaly</li>
            </ul>
            <p className="mt-2 text-slate-400">
              If the cumulative confidence score is below your selected threshold (default 80%), the bot <span className="text-amber-400 font-semibold">patiently waits</span> in surveillance mode until market conditions align.
            </p>
          </div>

          {/* Section 2: Over/Under & Even/Odd Automated Market Scanners */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>2. Multi-Index Trend Scanning Logic</span>
            </div>
            <p className="text-slate-400">
              When you click <strong className="text-blue-300">"AI Scan Over / Under"</strong> or <strong className="text-purple-300">"AI Scan Even / Odd"</strong>:
            </p>
            <ul className="mt-2 space-y-1 text-slate-300 list-disc list-inside pl-1">
              <li>The scanner evaluates all 10 Deriv Synthetic Volatility Indices in real-time.</li>
              <li>It identifies indices undergoing strong statistical skew (e.g. 70%+ odd streak or suppressed digits 0-3).</li>
              <li>It automatically switches the active trading index to the highest probability candidate.</li>
              <li>It selects optimal contract parameters (barrier level and 1-2 tick duration).</li>
            </ul>
          </div>

          {/* Section 3: Recovery Engine & Money Management */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>3. "Never Lose" Recovery & Safe Capital Boundaries</span>
            </div>
            <p className="text-slate-400">
              In financial trading, market variance always exists. Our recovery engine implements three essential safeguards:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                <span className="font-semibold text-emerald-400 block mb-0.5">Take Profit Ceiling</span>
                Pauses bot immediately upon reaching target profit, locking in gains.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                <span className="font-semibold text-rose-400 block mb-0.5">Stop Loss Floor</span>
                Hard cutoff protecting your remaining balance against adverse anomalies.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                <span className="font-semibold text-amber-400 block mb-0.5">Max Consecutive Loss Breaker</span>
                Halts trading if e.g. 4 consecutive losses occur, preventing tilt.
              </div>
            </div>
          </div>

          {/* Section 4: Risk Disclosure */}
          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-[11px] text-slate-500">
            <strong className="text-slate-400">Important Financial Notice: </strong>
            Synthetic volatility indices are simulated markets driven by cryptographically secure random number generators. Always test thoroughly in Virtual Sandbox Mode before deploying real funds. Never invest money you cannot afford to lose.
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors"
          >
            I Understand the Risk Controls
          </button>
        </div>
      </div>
    </div>
  );
};
