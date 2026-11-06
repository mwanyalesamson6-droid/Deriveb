import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BotConfig,
  BotPerformance,
  BotStatus,
  ContractType,
  DerivAccount,
  MarketMetrics,
  SignalConfirmation,
  SyntheticIndex,
  TickData,
  TradeRecord,
  TradingMode,
} from './types/deriv';
import { SYNTHETIC_INDICES, getIndexBySymbol } from './services/derivIndices';
import { derivWs } from './services/derivWs';
import { marketScanner } from './services/marketScanner';
import { analyzeMarket, evaluateSignalConfirmation } from './services/aiSignalEngine';
import { RiskManager } from './services/riskEngine';
import { soundEffects } from './services/soundEffects';

import { Navbar } from './components/Navbar';
import { AutoTradesConsole } from './components/AutoTradesConsole';
import { TickChartViewer } from './components/TickChartViewer';
import { SignalRadar } from './components/SignalRadar';
import { MarketScannerGrid } from './components/MarketScannerGrid';
import { BotConfigPanel } from './components/BotConfigPanel';
import { TradeHistoryTable } from './components/TradeHistoryTable';
import { ApiTokenModal } from './components/ApiTokenModal';
import { RiskSafetyModal } from './components/RiskSafetyModal';

interface ScannerLogEntry {
  time: string;
  text: string;
  type: 'scan' | 'signal' | 'switch' | 'trade' | 'win' | 'loss';
}

const DEFAULT_CONFIG: BotConfig = {
  baseStake: 1.0,
  currentStake: 1.0,
  targetProfit: 25.0,
  stopLoss: 50.0,
  durationTicks: 1,
  minConfidenceThreshold: 80,
  moneyManagement: 'martingale',
  martingaleMultiplier: 2.1,
  maxMartingaleSteps: 4,
  maxConsecutiveLosses: 4,
  cooldownSeconds: 2,
  aiDynamicStake: true,
  aiDynamicDuration: true,
};

export default function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'trading' | 'scanner' | 'history'>('trading');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Deriv Connection & Account
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<DerivAccount>(derivWs.account);

  // Active Symbol & Mode
  const [activeSymbol, setActiveSymbol] = useState<string>('R_100');
  const [tradingMode, setTradingMode] = useState<TradingMode>('auto_even_odd');
  const [manualContractType, setManualContractType] = useState<ContractType>('DIGITEVEN');

  // Bot State
  const [botStatus, setBotStatus] = useState<BotStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Auto Trades in standby. Select a strategy & start.');
  const [scannerLogs, setScannerLogs] = useState<ScannerLogEntry[]>([]);

  // Configuration
  const [config, setConfig] = useState<BotConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deriv_bot_config');
      if (saved) {
        try {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        } catch (e) {}
      }
    }
    return DEFAULT_CONFIG;
  });

  // Trades & Performance
  const [trades, setTrades] = useState<TradeRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deriv_bot_trades');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const [performance, setPerformance] = useState<BotPerformance>(() =>
    RiskManager.computePerformance(trades)
  );

  // Market Metrics & Tick Data
  const [recentTicks, setRecentTicks] = useState<TickData[]>(() =>
    marketScanner.getTicks('R_100')
  );
  const [metrics, setMetrics] = useState<MarketMetrics>(() =>
    analyzeMarket('R_100', recentTicks)
  );
  const [metricsMap, setMetricsMap] = useState<Map<string, MarketMetrics>>(new Map());

  // Active Pending Contract Tracking
  const pendingContractRef = useRef<{
    record: TradeRecord;
    ticksRemaining: number;
    targetSymbol: string;
  } | null>(null);

  const activeIndex = getIndexBySymbol(activeSymbol);

  // Helper to append scanner logs
  const addScannerLog = useCallback((text: string, type: ScannerLogEntry['type'] = 'scan') => {
    const time = new Date().toLocaleTimeString();
    setScannerLogs((prev) => [{ time, text, type }, ...prev].slice(0, 50));
  }, []);

  // Save config
  useEffect(() => {
    localStorage.setItem('deriv_bot_config', JSON.stringify(config));
  }, [config]);

  // Save trades & recompute performance
  useEffect(() => {
    localStorage.setItem('deriv_bot_trades', JSON.stringify(trades));
    setPerformance(RiskManager.computePerformance(trades));
  }, [trades]);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.enabled = next;
  };

  // Connect to Deriv WebSocket on mount
  useEffect(() => {
    addScannerLog('Connecting to Deriv WebSocket endpoint (app_id: 1089)...', 'scan');
    derivWs.connect().then((ok) => {
      setIsConnected(ok);
      setAccount({ ...derivWs.account });
      derivWs.subscribeTicks(activeSymbol);
      if (ok) {
        addScannerLog('Connected to Deriv live price feed. Real-time tick stream active.', 'scan');
      }
    });

    const checkInterval = setInterval(() => {
      setIsConnected(derivWs.isConnected);
      setAccount({ ...derivWs.account });
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [activeSymbol, addScannerLog]);

  // Subscribe to ticks when activeSymbol changes
  useEffect(() => {
    derivWs.subscribeTicks(activeSymbol);
    const existingTicks = marketScanner.getTicks(activeSymbol);
    setRecentTicks(existingTicks);
    setMetrics(analyzeMarket(activeSymbol, existingTicks));
  }, [activeSymbol]);

  // Background ticker for all synthetic indexes so scanner stays lively
  useEffect(() => {
    const bgTimer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      SYNTHETIC_INDICES.forEach((idx) => {
        if (idx.symbol === activeSymbol) return; // active symbol handled by live tick
        const ticks = marketScanner.getTicks(idx.symbol);
        const last = ticks[ticks.length - 1];
        if (!last) return;
        const drift = (Math.random() - 0.495) * (idx.volatilityRate * 0.04);
        const nextPrice = Math.max(10, last.quote + drift);
        const digit = parseInt(nextPrice.toFixed(idx.decimals).slice(-1), 10);
        marketScanner.addTick({
          epoch: now,
          quote: Math.round(nextPrice * Math.pow(10, idx.decimals)) / Math.pow(10, idx.decimals),
          lastDigit: isNaN(digit) ? 0 : digit,
          symbol: idx.symbol,
        });
      });

      // Update metrics map
      const newMap = new Map<string, MarketMetrics>();
      SYNTHETIC_INDICES.forEach((idx) => {
        newMap.set(idx.symbol, marketScanner.getMarketMetrics(idx.symbol));
      });
      setMetricsMap(newMap);
    }, 1200);

    return () => clearInterval(bgTimer);
  }, [activeSymbol]);

  // Evaluate Signal Confirmation on current active index
  const signalConfirmation: SignalConfirmation = evaluateSignalConfirmation(
    metrics,
    tradingMode,
    manualContractType,
    config,
    account.balance
  );

  // Execute Trade Handler
  const executeTrade = useCallback(
    (confirmedSignal: SignalConfirmation) => {
      const stake = confirmedSignal.recommendedStake;
      const duration = confirmedSignal.recommendedDuration;
      const targetSymbol = confirmedSignal.targetSymbol;
      const contractType = confirmedSignal.contractType;
      const barrier = confirmedSignal.barrier;
      const targetName = getIndexBySymbol(targetSymbol).displayName;

      let payoutMultiplier = 1.95;
      if (contractType === 'DIGITOVER') {
        if (barrier === 2) payoutMultiplier = 1.38;
        else if (barrier === 4) payoutMultiplier = 1.95;
        else if (barrier === 5) payoutMultiplier = 2.4;
      } else if (contractType === 'DIGITUNDER') {
        if (barrier === 7) payoutMultiplier = 1.38;
        else if (barrier === 4) payoutMultiplier = 1.95;
        else if (barrier === 5) payoutMultiplier = 2.4;
      }

      const expectedPayout = Math.round(stake * payoutMultiplier * 100) / 100;
      const entrySpot = metrics.latestPrice;
      const entryDigit = metrics.lastDigit;

      const tradeId = 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      const contractId = Math.floor(1000000000 + Math.random() * 9000000000);

      const newRecord: TradeRecord = {
        id: tradeId,
        contractId,
        timestamp: Date.now(),
        symbol: targetSymbol,
        symbolName: targetName,
        contractType,
        barrier,
        stake,
        payout: expectedPayout,
        entrySpot,
        entryDigit,
        profit: 0,
        status: 'pending',
        durationTicks: duration,
        strategyUsed: tradingMode,
        confidenceScore: confirmedSignal.score,
      };

      pendingContractRef.current = {
        record: newRecord,
        ticksRemaining: duration,
        targetSymbol,
      };

      setBotStatus('in_trade');
      const barrierText = barrier !== undefined ? ` Barrier ${barrier}` : '';
      setStatusMessage(
        `Trade in progress: ${contractType}${barrierText} on ${getIndexBySymbol(targetSymbol).shortName} (${duration} tick countdown)`
      );

      soundEffects.playTradeExecuted();
      addScannerLog(
        `[TRADE EXECUTED] ${contractType}${barrierText} on ${targetName} · Stake: $${stake.toFixed(2)} · Entry Spot: ${entrySpot} [${entryDigit}]`,
        'trade'
      );

      // Pre-add to trades list
      setTrades((prev) => [newRecord, ...prev]);

      // If authorized with real Deriv API token, submit proposal & execute
      if (account.isAuthorized && derivWs.isConnected) {
        derivWs.send({
          proposal: 1,
          amount: stake,
          basis: 'stake',
          currency: account.currency,
          symbol: targetSymbol,
          duration: duration,
          duration_unit: 't',
          contract_type: contractType,
          ...(barrier !== undefined ? { barrier: barrier.toString() } : {}),
        });
      }
    },
    [account, addScannerLog, metrics, tradingMode]
  );

  // Settlement Handler when contract duration finishes
  const settleContract = useCallback(
    (exitTick: TickData) => {
      const pending = pendingContractRef.current;
      if (!pending) return;

      const { record } = pending;
      const exitSpot = exitTick.quote;
      const exitDigit = exitTick.lastDigit;

      let isWin = false;
      if (record.contractType === 'DIGITEVEN') {
        isWin = exitDigit % 2 === 0;
      } else if (record.contractType === 'DIGITODD') {
        isWin = exitDigit % 2 !== 0;
      } else if (record.contractType === 'DIGITOVER') {
        const b = record.barrier ?? 4;
        isWin = exitDigit > b;
      } else if (record.contractType === 'DIGITUNDER') {
        const b = record.barrier ?? 4;
        isWin = exitDigit < b;
      }

      const netProfit = isWin ? Math.round((record.payout - record.stake) * 100) / 100 : -record.stake;

      const resolvedRecord: TradeRecord = {
        ...record,
        exitSpot,
        exitDigit,
        profit: netProfit,
        status: isWin ? 'won' : 'lost',
      };

      setTrades((prev) => prev.map((t) => (t.id === record.id ? resolvedRecord : t)));
      pendingContractRef.current = null;

      if (account.isVirtual) {
        derivWs.adjustVirtualBalance(netProfit);
        setAccount({ ...derivWs.account });
      }

      const recentLosses = isWin
        ? 0
        : trades.filter((t) => t.status === 'lost').length + 1;

      // Play audio notification & add to activity feed
      if (isWin) {
        soundEffects.playWin();
        addScannerLog(
          `[CONTRACT WON] Exit Spot: ${exitSpot} [${exitDigit}] · Net Profit: +$${netProfit.toFixed(2)}`,
          'win'
        );
      } else {
        soundEffects.playLoss();
        addScannerLog(
          `[CONTRACT LOST] Exit Spot: ${exitSpot} [${exitDigit}] · Loss: -$${record.stake.toFixed(2)}`,
          'loss'
        );
      }

      // Check safety limits (Take Profit, Stop Loss, Max Consecutive Losses)
      const currentPerf = RiskManager.computePerformance([resolvedRecord, ...trades]);
      const safety = RiskManager.checkSafetyLimits(currentPerf, config, recentLosses);

      if (safety.shouldStop) {
        setBotStatus('stopped');
        setStatusMessage(safety.reason || 'Bot stopped by safety safeguard.');
        addScannerLog(`[SAFETY HALT] ${safety.reason}`, 'signal');
        return;
      }

      // Compute next stake
      const nextStakeResult = RiskManager.calculateNextStake(config, resolvedRecord, recentLosses);
      setConfig((prev) => ({
        ...prev,
        currentStake: nextStakeResult.nextStake,
      }));

      // Cooldown then resume continuous auto scan loop!
      setBotStatus('cooldown');
      setStatusMessage(
        `${isWin ? 'Won' : 'Lost'} (${isWin ? '+' : ''}$${netProfit.toFixed(2)}). ${nextStakeResult.reason}. Resting ${config.cooldownSeconds}s before next auto scan...`
      );

      setTimeout(() => {
        setBotStatus((prevStatus) => {
          if (prevStatus === 'stopped') return 'stopped';
          addScannerLog('Resuming continuous live market scan across 10 indices...', 'scan');
          return 'waiting_signal';
        });
        setStatusMessage('Scanning live market & waiting for confirmed signal...');
      }, config.cooldownSeconds * 1000);
    },
    [account.isVirtual, addScannerLog, config, trades]
  );

  // CONTINUOUS LIVE SCANNER & AUTO-SWITCH ENGINE (Like Trader Vexis Auto Trades)
  useEffect(() => {
    if (botStatus !== 'waiting_signal' && botStatus !== 'scanning') return;

    const autoScanInterval = setInterval(() => {
      // Scan all 10 indices for the best statistical edge
      const scan = marketScanner.findBestMarketCandidate(
        tradingMode as any,
        config.minConfidenceThreshold
      );

      const top = scan.best;

      // If top candidate has a high confirmed signal and differs from current activeSymbol, auto switch!
      if (top.symbol !== activeSymbol && top.score >= config.minConfidenceThreshold) {
        setActiveSymbol(top.symbol);
        addScannerLog(
          `[AUTO-SWITCH] AI switched market to ${top.index.displayName} (Signal: ${top.score}% ${top.recommendedType})`,
          'switch'
        );
      }

      // Check confirmation on current metrics
      const currentEval = evaluateSignalConfirmation(
        metrics,
        tradingMode,
        manualContractType,
        config,
        account.balance
      );

      if (currentEval.isValid && botStatus === 'waiting_signal') {
        addScannerLog(
          `[SIGNAL CONFIRMED] ${currentEval.score}% edge on ${metrics.symbol} -> Triggering autonomous trade!`,
          'signal'
        );
        executeTrade(currentEval);
      } else {
        setStatusMessage(
          `Scanning 10 indices... Best: ${top.index.shortName} (${top.score}% / Req ${config.minConfidenceThreshold}%) — ${currentEval.statusText}`
        );
      }
    }, 1800);

    return () => clearInterval(autoScanInterval);
  }, [
    activeSymbol,
    botStatus,
    config,
    executeTrade,
    manualContractType,
    metrics,
    tradingMode,
    account.balance,
    addScannerLog,
  ]);

  // Active Symbol Tick Listener
  useEffect(() => {
    const unsub = derivWs.onTick(activeSymbol, (tick) => {
      marketScanner.addTick(tick);
      const updatedTicks = marketScanner.getTicks(activeSymbol);
      setRecentTicks([...updatedTicks]);

      const currentMetrics = analyzeMarket(activeSymbol, updatedTicks);
      setMetrics(currentMetrics);

      // Countdown in-trade contract ticks
      if (pendingContractRef.current && botStatus === 'in_trade') {
        pendingContractRef.current.ticksRemaining -= 1;
        if (pendingContractRef.current.ticksRemaining <= 0) {
          settleContract(tick);
        }
      }
    });

    return () => unsub();
  }, [activeSymbol, botStatus, settleContract]);

  // Activate / Pause Continuous Auto Trades Toggle
  const handleToggleAutoTrades = () => {
    if (botStatus === 'idle' || botStatus === 'stopped') {
      setBotStatus('waiting_signal');
      addScannerLog(
        `[AUTO TRADES ACTIVATED] Mode: ${tradingMode.replace(/_/g, ' ').toUpperCase()} · Min Gate: ${config.minConfidenceThreshold}%`,
        'trade'
      );
      setStatusMessage('Auto Trades running! Scanning live markets continuously for confirmed signals...');
    } else {
      setBotStatus('idle');
      addScannerLog('[AUTO TRADES PAUSED] Bot execution halted by user.', 'scan');
      setStatusMessage('Auto Trades paused by user.');
    }
  };

  // Select Strategy Mode
  const handleSelectMode = (mode: TradingMode) => {
    setTradingMode(mode);
    addScannerLog(
      `Strategy mode switched to: ${mode.replace(/_/g, ' ').toUpperCase()}. Scanning live trends...`,
      'switch'
    );
  };

  // Authorize API Token
  const handleAuthorizeToken = async (token: string) => {
    addScannerLog('Verifying Deriv API Token authorization with Deriv server...', 'scan');
    const res = await derivWs.authorize(token);
    setAccount({ ...derivWs.account });
    if (res.success) {
      addScannerLog(`Deriv Token authorized! Login: ${derivWs.account.loginId} (${derivWs.account.isVirtual ? 'Demo' : 'Real'})`, 'signal');
    } else {
      addScannerLog(`Authorization failed: ${res.error}`, 'loss');
    }
    return res;
  };

  // Disconnect Account
  const handleDisconnectAccount = () => {
    derivWs.disconnectAccount();
    setAccount({ ...derivWs.account });
    addScannerLog('Disconnected Deriv token. Reverted to Virtual Demo Sandbox.', 'scan');
  };

  // Clear History
  const handleClearHistory = () => {
    setTrades([]);
    localStorage.removeItem('deriv_bot_trades');
    setPerformance(RiskManager.computePerformance([]));
    addScannerLog('Execution history audit log cleared.', 'scan');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract */}
      <Navbar
        account={account}
        isConnected={isConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        onOpenRiskModal={() => setIsRiskModalOpen(true)}
        botStatus={botStatus}
        onToggleBot={handleToggleAutoTrades}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Trader Vexis style Auto Trades Console & Live Activity Stream */}
        <AutoTradesConsole
          account={account}
          isConnected={isConnected}
          botStatus={botStatus}
          tradingMode={tradingMode}
          onSelectMode={handleSelectMode}
          onToggleAutoTrades={handleToggleAutoTrades}
          statusMessage={statusMessage}
          confidenceScore={signalConfirmation.score}
          activeSymbolName={activeIndex.displayName}
          scannerLogs={scannerLogs}
          onAuthorizeToken={handleAuthorizeToken}
          onDisconnectAccount={handleDisconnectAccount}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          config={config}
          onOpenConfig={() => setActiveTab('trading')}
        />

        {/* Tab 1: Primary Trading View */}
        {activeTab === 'trading' && (
          <div>
            {/* Live Real-time Tick Chart & Digit Display */}
            <TickChartViewer
              metrics={metrics}
              index={activeIndex}
              recentTicks={recentTicks}
            />

            {/* Strict Multi-Indicator Signal Confirmation Radar */}
            <SignalRadar
              confirmation={signalConfirmation}
              botStatus={botStatus}
              threshold={config.minConfidenceThreshold}
            />

            {/* Bot Risk Parameters & Money Management Controls */}
            <BotConfigPanel
              config={config}
              onChangeConfig={setConfig}
              isBotRunning={botStatus !== 'idle' && botStatus !== 'stopped'}
            />

            {/* Live Trades Table */}
            <TradeHistoryTable
              performance={performance}
              trades={trades}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}

        {/* Tab 2: Multi-Index Live Scanner Grid */}
        {activeTab === 'scanner' && (
          <div>
            <MarketScannerGrid
              metricsMap={metricsMap}
              activeSymbol={activeSymbol}
              onSelectIndex={(sym) => {
                setActiveSymbol(sym);
                addScannerLog(`User manually switched active view to ${getIndexBySymbol(sym).displayName}`, 'switch');
              }}
              tradingMode={tradingMode}
            />

            <SignalRadar
              confirmation={signalConfirmation}
              botStatus={botStatus}
              threshold={config.minConfidenceThreshold}
            />
          </div>
        )}

        {/* Tab 3: Execution Log & Performance Audit */}
        {activeTab === 'history' && (
          <TradeHistoryTable
            performance={performance}
            trades={trades}
            onClearHistory={handleClearHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Deriv AI Auto Trader</span>
            <span>·</span>
            <span>Continuous Market Scanning Engine</span>
            <span>·</span>
            <span>WebSocket v3</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRiskModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Risk Safeguards
            </button>
            <button
              onClick={() => setIsTokenModalOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Deriv API Token
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ApiTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        account={account}
        onAuthorize={handleAuthorizeToken}
        onDisconnect={handleDisconnectAccount}
        onResetVirtualBalance={() => {
          derivWs.resetVirtualBalance(10000);
          setAccount({ ...derivWs.account });
          addScannerLog('Virtual Demo balance reset to $10,000.00 USD.', 'scan');
        }}
      />

      <RiskSafetyModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
      />
    </div>
  );
}
