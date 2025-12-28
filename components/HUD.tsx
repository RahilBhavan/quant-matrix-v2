import React, { useEffect, useState, memo } from 'react';
import { MarketData, MatrixStatus } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { walletService } from '../services/web3/walletService';
import { ethers } from 'ethers';

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
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [networkName, setNetworkName] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      {/* Top Left: Identity */}
      <div className="fixed top-6 left-8 z-50 pointer-events-none">
        <h1 className="font-sans font-black text-2xl tracking-tighter leading-none hover:animate-glitch pointer-events-auto cursor-default">
          QUANT MATRIX<br />
          <span className="text-xs font-mono font-normal tracking-widest opacity-60">
            DEFI_BUILDER_v2
          </span>
        </h1>
      </div>

      {/* Top Right: Wallet Connection */}
      <div className="fixed top-6 right-8 z-50 text-right font-mono text-xs space-y-1">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className={`
              px-4 py-2 border transition-all pointer-events-auto
              ${isConnecting
                ? 'border-white/30 text-white/30 cursor-wait'
                : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black cursor-pointer'
              }
            `}
          >
            {isConnecting ? 'CONNECTING...' : 'CONNECT_WALLET'}
          </button>
        ) : (
          <div className="pointer-events-auto">
            <div className="flex items-center justify-end gap-2">
              <span className="opacity-50">WALLET</span>
              <span
                className="font-bold text-cyan-500 cursor-pointer hover:opacity-70"
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
              <span className={`font-bold ${networkName === 'sepolia' ? 'text-green-500' : 'text-yellow-500'}`}>
                {networkName.toUpperCase()}
              </span>
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

      {/* Bottom Left: Navigation */}
      <div className="fixed bottom-32 left-8 z-50 hidden md:flex flex-col gap-2 font-mono text-xs opacity-80">
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="w-2 h-2 bg-white"></span>
          [01] WORKSPACE
        </div>
        <div
          onClick={onOpenBacktest}
          className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer interactive-zone"
        >
          <span className="w-2 h-2 border border-white"></span>
          [02] BACKTEST
        </div>
        <div
          onClick={onOpenLibrary}
          className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer interactive-zone"
        >
          <span className="w-2 h-2 border border-white"></span>
          [03] LIBRARY
        </div>
        <div
          onClick={onOpenPriceChart}
          className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer interactive-zone"
        >
          <span className="w-2 h-2 border border-white"></span>
          [04] PRICE_CHART
        </div>
        <div
          onClick={onOpenPortfolio}
          className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer interactive-zone"
        >
          <span className="w-2 h-2 border border-white"></span>
          [05] PORTFOLIO
        </div>
      </div>

      {/* Bottom Right: System Status */}
      <div className="fixed bottom-32 right-8 z-50 text-right font-mono text-xs pointer-events-none">
        <div className="flex items-center justify-end gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}></span>
          <span className="uppercase">WALLET: {isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
        <div className="flex items-center justify-end gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${status === 'OPTIMAL' ? 'bg-green-500' :
              status === 'CRITICAL' ? 'bg-red-500' : 'bg-white'
            } animate-pulse`}></span>
          <span className="uppercase">SYSTEM: {status}</span>
        </div>
        {isConnected && networkName && (
          <div className="opacity-50 mt-1">
            CHAIN: {networkName.toUpperCase()}
          </div>
        )}
      </div>
    </>
  );
});

HUD.displayName = 'HUD';
