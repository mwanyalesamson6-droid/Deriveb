import React, { useState } from 'react';
import { DerivAccount } from '../types/deriv';
import { X, Key, CheckCircle, AlertCircle, Eye, EyeOff, ShieldAlert, ExternalLink } from 'lucide-react';

interface ApiTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: DerivAccount;
  onAuthorize: (token: string) => Promise<{ success: boolean; error?: string }>;
  onDisconnect: () => void;
  onResetVirtualBalance: () => void;
}

export const ApiTokenModal: React.FC<ApiTokenModalProps> = ({
  isOpen,
  onClose,
  account,
  onAuthorize,
  onDisconnect,
  onResetVirtualBalance,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Please enter your Deriv API token');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await onAuthorize(tokenInput.trim());
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('Successfully connected and authorized with Deriv!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Failed to authorize token. Verify token scopes and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Deriv API Token Integration
            </h2>
            <p className="text-xs text-slate-400">
              Paste your API token to connect your live or demo Deriv account
            </p>
          </div>
        </div>

        {/* Current Connection Status */}
        {account.isAuthorized ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Account Connected
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                {account.isVirtual ? 'DEMO / VIRTUAL' : 'REAL LIVE ACCOUNT'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 text-slate-300">
              <div>
                <span className="text-slate-400 font-sans">Login ID:</span> {account.loginId}
              </div>
              <div>
                <span className="text-slate-400 font-sans">Currency:</span> {account.currency}
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-sans">Live Balance:</span>{' '}
                <span className="text-emerald-400 font-bold text-sm">
                  ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} {account.currency}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onDisconnect}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline"
              >
                Disconnect & Use Virtual Sandbox
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-400 transition-colors"
              >
                Ready to Trade
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl mb-5 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <span className="text-white font-medium">Currently in Virtual Sandbox Mode: </span>
              Trading uses real live ticks from Deriv with $10,000 virtual balance. Enter your Deriv API token below to execute real contracts.
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Deriv API Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="e.g. a1-b2c3d4e5f6g7h8i9j0k"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Verifying with Deriv...' : 'Connect Deriv API'}
            </button>
            <button
              type="button"
              onClick={onResetVirtualBalance}
              className="px-3 py-2.5 bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
              title="Reset Virtual Demo balance back to $10,000"
            >
              Reset Virtual
            </button>
          </div>
        </form>

        {/* Instructions */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="font-semibold text-slate-300">How to generate your token on Deriv:</div>
          <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
            <li>Log in to Deriv (app.deriv.com)</li>
            <li>Go to <span className="text-white">Account Settings → API Token</span></li>
            <li>Give your token a name (e.g. "DerivAIBot")</li>
            <li>Check the <span className="text-emerald-400 font-medium">Read</span> and <span className="text-emerald-400 font-medium">Trade</span> scopes</li>
            <li>Click Create, copy the token, and paste it here</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
