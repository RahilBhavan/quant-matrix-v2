import React, { useEffect, useState, memo } from 'react';
import { MarketData, MatrixStatus } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { walletService } from '../services/web3/walletService';
import { ChainId } from '../services/web3/chainConfig';
import { ethers } from 'ethers';
import { isMarketOpen } from '../services/marketDataService';
import { useAccessibilitySafe } from '../context/AccessibilityContext';
import { Zap, ZapOff } from 'lucide-react';
import { MevProtectionToggle } from './MevProtectionToggle';
import { ChainSelector } from './ChainSelector';
import { MarketMoment } from './MarketMoment';

interface HUDProps {
  status: MatrixStatus;
  marketData: MarketData;
  onOpenBacktest: () => void;
  onOpenLibrary: () => void;
  onOpenPriceChart: () => void;
  onOpenPortfolio: () => void;
}

export const HUD: React.FC<HUDProps> = memo(({ status, marketData, onOpenBacktest, onOpenLibrary, onOpenPriceChart, onOpenPortfolio }) => {
  const { state: portfolio } = usePortfolio();
  const { reduceMotion, highContrast, toggleReduceMotion, toggleHighContrast } = useAccessibilitySafe();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [networkName, setNetworkName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChainId, setCurrentChainId] = useState<ChainId | null>(null);

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = () => {
      if (walletService.isConnected()) {
        const address = walletService.getConnectedAddress();
        setIsConnected(true);
        setWalletAddress(address);
        if (address) {
          updateBalance(address);
          updateNetwork();
        }
      }
    };

    checkConnection();
  }, []);

  // Update chain state when wallet connects
  useEffect(() => {
    if (isConnected) {
      setCurrentChainId(walletService.getCurrentChainId());
    }
  }, [isConnected]);

  const updateBalance = async (address: string) => {
    try {
      const balance = await walletService.getBalance(address);
      setEthBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const updateNetwork = async () => {
    try {
      const network = await walletService.getNetwork();
      setNetworkName(network.name);
    } catch (error) {
      console.error('Failed to fetch network:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const address = await walletService.connect();
      setIsConnected(true);
      setWalletAddress(address);
      await updateBalance(address);
      await updateNetwork();
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setError(error.message || 'Failed to connect wallet');
      setTimeout(() => setError(null), 5000); // Clear error after 5s
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await walletService.disconnect();
    setIsConnected(false);
    setWalletAddress(null);
    setEthBalance('0');
    setNetworkName('');
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  const dailyPL = portfolio.totalEquity - 100000;
  const dailyPLPercent = (dailyPL / 100000) * 100;

  const marketStatus = isMarketOpen() ? 'OPEN' : 'CLOSED';

  return (
    <>
      {/* Top Left: Identity (PRD §3.1) */}
      <div className="fixed top-6 left-8 z-50 pointer-events-none">
        <h1 className="font-sans font-bold text-lg tracking-[0.15em] leading-none pointer-events-auto cursor-default uppercase">
          QUANT MATRIX
          <span className="ml-2 text-[10px] font-mono font-normal opacity-50">[BETA]</span>
        </h1>
      </div>

      {/* Top Right: Market Moment + Wallet (PRD §3.2) */}
      <div className="fixed top-6 right-8 z-50 text-right font-mono text-xs space-y-3">
        {/* Market Moment Ticker */}
        <MarketMoment className="justify-end" />

        {/* Wallet Connection */}
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`
              px-4 py-2 border border-white/40 transition-all pointer-events-auto uppercase tracking-widest
              ${isConnecting
                ? 'opacity-30 cursor-wait'
                : 'hover:bg-white hover:text-black cursor-pointer'
              }
            `}
          >
            {isConnecting ? 'CONNECTING...' : 'CONNECT'}
          </button>
        ) : (
          <div className="pointer-events-auto space-y-1">
            <div className="flex items-center justify-end gap-2">
              <span className="opacity-50 uppercase tracking-widest">WALLET</span>
              <span
                className="font-bold cursor-pointer hover:underline"
                onClick={handleDisconnect}
                title="Click to disconnect"
              >
                {walletAddress && truncateAddress(walletAddress)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="opacity-50">BALANCE</span>
              <span className="font-bold text-white">
                {parseFloat(ethBalance).toFixed(4)} ETH
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="opacity-50">NETWORK</span>
              <ChainSelector
                currentChainId={currentChainId}
                onChainSelect={async (chainId) => {
                  await walletService.switchChain(chainId);
                  setCurrentChainId(chainId);
                  if (walletAddress) updateBalance(walletAddress);
                }}
                showTestnets={true}
              />
            </div>
            {/* MEV Protection Toggle */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <MevProtectionToggle />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500 text-red-500 text-[10px] max-w-[200px] pointer-events-none">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Left: Navigation (PRD §3.3) */}
      <div className="fixed bottom-32 left-8 z-50 hidden md:flex flex-col gap-2 font-mono text-xs">
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="w-1.5 h-1.5 bg-white" />
          <span className="uppercase tracking-widest">[01] WORKSPACE</span>
        </div>
        <button
          onClick={onOpenBacktest}
          className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity text-left group"
        >
          <span className="w-1.5 h-1.5 border border-white/50 group-hover:border-white" />
          <span className="uppercase tracking-widest group-hover:underline">[02] BACKTEST</span>
        </button>
        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity text-left group"
        >
          <span className="w-1.5 h-1.5 border border-white/50 group-hover:border-white" />
          <span className="uppercase tracking-widest group-hover:underline">[03] LIBRARY</span>
        </button>
        <button
          onClick={onOpenPriceChart}
          className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity text-left group"
        >
          <span className="w-1.5 h-1.5 border border-white/50 group-hover:border-white" />
          <span className="uppercase tracking-widest group-hover:underline">[04] CHARTS</span>
        </button>
        <button
          onClick={onOpenPortfolio}
          className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity text-left group"
        >
          <span className="w-1.5 h-1.5 border border-white/50 group-hover:border-white" />
          <span className="uppercase tracking-widest group-hover:underline">[05] PORTFOLIO</span>
        </button>
      </div>

      {/* Bottom Right: System Status (PRD - white indicators only) */}
      <div className="fixed bottom-32 right-8 z-50 text-right font-mono text-xs pointer-events-none space-y-1">
        <div className="flex items-center justify-end gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-white' : 'border border-white/50'}`} />
          <span className="uppercase tracking-widest opacity-70">WALLET: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'OPTIMAL' || status === 'EXECUTING' ? 'bg-white' : 'border border-white/50'}`} />
          <span className="uppercase tracking-widest opacity-70">SYSTEM: {status}</span>
        </div>
        {isConnected && networkName && (
          <div className="flex items-center justify-end gap-2 opacity-50">
            <span className="uppercase tracking-widest">CHAIN: {networkName.toUpperCase()}</span>
          </div>
        )}

        {/* Accessibility Toggle */}
        <div className="mt-4 pt-2 border-t border-white/20 pointer-events-auto flex gap-2 justify-end">
          <button
            onClick={toggleReduceMotion}
            className={`p-1.5 border transition-all ${reduceMotion ? 'border-white bg-white text-black' : 'border-white/20 hover:border-white'
              }`}
            title={reduceMotion ? 'Enable animations' : 'Reduce motion'}
            aria-pressed={reduceMotion}
            aria-label="Toggle reduced motion"
          >
            {reduceMotion ? <ZapOff size={12} /> : <Zap size={12} />}
          </button>
        </div>
      </div>
    </>
  );
});

HUD.displayName = 'HUD';
