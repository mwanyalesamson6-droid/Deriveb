import React from 'react';
import { ShieldCheck, Key, RefreshCw, AlertCircle, Wifi, Play, Pause } from 'lucide-react';
import { DerivAccount } from '../types/deriv';

interface NavbarProps {
  account: DerivAccount;
  isConnected: boolean;
  activeTab: 'trading' | 'scanner' | 'history';
  setActiveTab: (tab: 'trading' | 'scanner' | 'history') => void;
  onOpenTokenModal: () => void;
  onOpenRiskModal: () => void;
  botStatus: string;
  onToggleBot: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  account,
  isConnected,
  activeTab,
  setActiveTab,
  onOpenTokenModal,
  onOpenRiskModal,
  botStatus,
  onToggleBot,
}) => {
  const isRunning = botStatus !== 'idle' && botStatus !== 'stopped';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single line, no decorative tags) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
            AI
          </div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('trading');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-emerald-400 transition-colors"
          >
            Deriv AI Bot
          </a>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('trading')}
            className={`whitespace-nowrap pb-1 transition-colors ${
              activeTab === 'trading'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Trading Engine
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`whitespace-nowrap pb-1 transition-colors ${
              activeTab === 'scanner'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Market Scanner
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap pb-1 transition-colors ${
              activeTab === 'history'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Execution History
          </button>
          <button
            onClick={onOpenRiskModal}
            className="text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Risk Controls</span>
          </button>
        </nav>

        {/* Zone 3: Account & Connection Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Start/Pause Button in Top Bar */}
          <button
            onClick={onToggleBot}
            className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Bot</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Bot</span>
              </>
            )}
          </button>

          {/* Account Balance & Status Pill */}
          <button
            onClick={onOpenTokenModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors"
            title="Click to manage Deriv API token & account"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? (account.isAuthorized ? 'bg-emerald-400' : 'bg-cyan-400') : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-400 font-medium">
              {account.isAuthorized ? (account.isVirtual ? 'Demo' : 'Real') : 'Virtual'}
            </span>
            <span className="font-mono font-semibold text-emerald-400">
              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-[10px] text-slate-400">{account.currency}</span>
            </span>
            <Key className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>
      </div>
    </header>
  );
};
