import React, { useState, useEffect } from 'react';
import { walletService } from '../../services/web3/walletService';
import { DataText } from '../ui/Typography';

export const WalletButton: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [network, setNetwork] = useState<string>('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const connected = walletService.isConnected();
    setIsConnected(connected);

    if (connected) {
      const addr = walletService.getConnectedAddress();
      setAddress(addr);

      if (addr) {
        const bal = await walletService.getBalance(addr);
        setBalance((Number(bal) / 1e18).toFixed(4));
      }

      const isOnSepolia = await walletService.isOnSepolia();
      setNetwork(isOnSepolia ? 'SEPOLIA' : 'UNKNOWN');
    }
  };

  const handleConnect = async () => {
    try {
      await walletService.connect();
      await checkConnection();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnect();
    setIsConnected(false);
    setAddress(null);
    setBalance('0');
  };

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        className="px-4 py-2 border border-ink text-ink font-mono text-small uppercase hover:bg-ink hover:text-white transition-fast cursor-pointer"
      >
        [ DISCONNECTED ]
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-none ${network === 'SEPOLIA' ? 'bg-success' : 'bg-error'}`} />
        <DataText className="text-small">{network}</DataText>
      </div>
      <button
        onClick={handleDisconnect}
        className="px-4 py-2 bg-ink text-white font-mono text-small hover:bg-orange transition-fast cursor-pointer"
      >
        [ {address?.slice(0, 6)}...{address?.slice(-4)} | {balance} ETH ]
      </button>
    </div>
  );
};
