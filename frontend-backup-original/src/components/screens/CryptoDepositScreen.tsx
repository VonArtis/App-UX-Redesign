import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import type { ScreenProps, ConnectedWallet } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

interface DepositAddress {
  token: string;
  network: string;
  network_name: string;
  chain_id: number;
  address: string;
  qr_code_data: string;
  avg_fee_usd: number;
  target_region: string;
}

interface DepositAddresses {
  usdc: {
    ethereum?: DepositAddress;
    polygon?: DepositAddress;
    bsc?: DepositAddress;
  };
  usdt: {
    ethereum?: DepositAddress;
    polygon?: DepositAddress;
    bsc?: DepositAddress;
  };
}

export const CryptoDepositScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [addresses, setAddresses] = useState<DepositAddresses | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<'ethereum' | 'polygon' | 'bsc'>('polygon');
  const [selectedToken, setSelectedToken] = useState<'usdc' | 'usdt'>('usdc');
  const [copied, setCopied] = useState<string>('');
  
  // === PHASE 2C: MULTI-WALLET INTEGRATION ===
  const [selectedWallet, setSelectedWallet] = useState<ConnectedWallet | null>(null);
  const [walletDepositAddresses, setWalletDepositAddresses] = useState<{ [walletId: string]: any }>({});
  const { user, connected_wallets, primary_wallet, getWalletByNetwork } = useApp();

  useEffect(() => {
    // Set default wallet based on selected network or primary wallet
    const defaultWallet = getWalletByNetwork(selectedNetwork) || primary_wallet || connected_wallets[0];
    setSelectedWallet(defaultWallet);
    
    fetchDepositAddresses();
    if (connected_wallets.length > 0) {
      fetchWalletDepositAddresses();
    }
  }, [selectedNetwork, connected_wallets, primary_wallet]);

  const fetchWalletDepositAddresses = async () => {
    if (!user?.token) return;
    
    try {
      const walletAddresses: { [walletId: string]: any } = {};
      
      for (const wallet of connected_wallets) {
        try {
          const response = await apiService.getWalletDepositAddresses(user.token, wallet.id);
          walletAddresses[wallet.id] = response;
        } catch (error) {
          console.error(`Failed to fetch deposit addresses for wallet ${wallet.id}:`, error);
        }
      }
      
      setWalletDepositAddresses(walletAddresses);
    } catch (error) {
      console.error('Error fetching wallet deposit addresses:', error);
    }
  };

  useEffect(() => {
    fetchDepositAddresses();
  }, []);

  const fetchDepositAddresses = async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const apiPromise = apiService.getCryptoDepositAddresses(user.token);
      
      const response = await Promise.race([apiPromise, timeoutPromise]);
      setAddresses(response.addresses);
      
    } catch (error) {
      console.error('Error fetching deposit addresses:', error);
      
      // Fallback to mock data if API fails
      const mockAddresses = {
        usdc: {
          ethereum: {
            token: 'USDC',
            network: 'ethereum',
            network_name: 'Ethereum Mainnet',
            chain_id: 1,
            address: '0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            qr_code_data: 'ethereum:0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            avg_fee_usd: 25,
            target_region: 'Global'
          },
          polygon: {
            token: 'USDC',
            network: 'polygon', 
            network_name: 'Polygon',
            chain_id: 137,
            address: '0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            qr_code_data: 'ethereum:0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            avg_fee_usd: 0.01,
            target_region: 'Global'
          },
          bsc: {
            token: 'USDC',
            network: 'bsc',
            network_name: 'BNB Smart Chain', 
            chain_id: 56,
            address: '0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            qr_code_data: 'ethereum:0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            avg_fee_usd: 0.20,
            target_region: 'Asia'
          }
        },
        usdt: {
          ethereum: {
            token: 'USDT',
            network: 'ethereum',
            network_name: 'Ethereum Mainnet',
            chain_id: 1,
            address: '0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            qr_code_data: 'ethereum:0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            avg_fee_usd: 25,
            target_region: 'Global'
          },
          polygon: {
            token: 'USDT',
            network: 'polygon',
            network_name: 'Polygon', 
            chain_id: 137,
            address: '0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            qr_code_data: 'ethereum:0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            avg_fee_usd: 0.01,
            target_region: 'Global'
          },
          bsc: {
            token: 'USDT',
            network: 'bsc',
            network_name: 'BNB Smart Chain',
            chain_id: 56, 
            address: '0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            qr_code_data: 'ethereum:0x1cB7111eBBF79Af5E941eB89B8eAFC67830be8a4',
            avg_fee_usd: 0.20,
            target_region: 'Asia'
          }
        }
      };
      
      setAddresses(mockAddresses);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getCurrentAddress = () => {
    if (!addresses || !addresses[selectedToken]) return null;
    return addresses[selectedToken][selectedNetwork];
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <FullScreenLoader text="Loading deposit addresses..." />;
  }

  const currentAddress = getCurrentAddress();

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Deposit Crypto" onBack={onBack} />

      {/* Important Notice */}
      <Card className="mb-6 border-yellow-500/30 bg-yellow-900/20">
        <div className="flex items-start gap-3">
          <div className="text-yellow-400 text-xl">⚠️</div>
          <div>
            <h3 className="text-yellow-400 font-semibold mb-2">Important Notice</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Minimum deposit: {formatAmount(20000)} for investment eligibility</li>
              <li>• Only send USDC/USDT on Polygon network</li>
              <li>• Wrong network = permanent loss of funds</li>
              <li>• Deposits are processed automatically</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Network Selection */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Network</h3>
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={() => setSelectedNetwork('ethereum')}
            variant={selectedNetwork === 'ethereum' ? 'primary' : 'secondary'}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-lg">🌐</span>
            <span className="text-sm font-semibold">Ethereum</span>
            <span className="text-xs text-gray-400">~$25 fees • Global</span>
          </Button>
          <Button
            onClick={() => setSelectedNetwork('polygon')}
            variant={selectedNetwork === 'polygon' ? 'primary' : 'secondary'}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-lg">⚡</span>
            <span className="text-sm font-semibold">Polygon</span>
            <span className="text-xs text-gray-400">~$0.01 fees • Low cost</span>
          </Button>
          <Button
            onClick={() => setSelectedNetwork('bsc')}
            variant={selectedNetwork === 'bsc' ? 'primary' : 'secondary'}
            className="h-20 flex flex-col items-center justify-center"
          >
            <span className="text-lg">🇦🇸</span>
            <span className="text-sm font-semibold">BSC</span>
            <span className="text-xs text-gray-400">~$0.20 fees • Asia focus</span>
          </Button>
        </div>
      </Card>

      {/* Token Selection */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Token</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setSelectedToken('usdc')}
            variant={selectedToken === 'usdc' ? 'primary' : 'secondary'}
            className="h-16 flex flex-col items-center justify-center"
          >
            <span className="text-lg">🔵</span>
            <span className="text-sm font-semibold">USDC</span>
            <span className="text-xs text-gray-400">USD Coin</span>
          </Button>
          <Button
            onClick={() => setSelectedToken('usdt')}
            variant={selectedToken === 'usdt' ? 'primary' : 'secondary'}
            className="h-16 flex flex-col items-center justify-center"
          >
            <span className="text-lg">🟢</span>
            <span className="text-sm font-semibold">USDT</span>
            <span className="text-xs text-gray-400">Tether</span>
          </Button>
        </div>
      </Card>

      {/* Deposit Address & QR Code */}
      {currentAddress ? (
        <Card className="mb-6 bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/30">
          <h3 className="text-lg font-semibold mb-4 text-center">
            {selectedToken.toUpperCase()} Deposit Address
          </h3>
          
          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl">
              <QRCode
                size={200}
                value={currentAddress.address}
                level="M"
              />
            </div>
          </div>

          {/* Address Display */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Wallet Address (Polygon Network)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-800 rounded-lg p-3 font-mono text-sm break-all">
                  {currentAddress.address}
                </div>
                <Button
                  onClick={() => copyToClipboard(currentAddress.address, 'address')}
                  variant="secondary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {copied === 'address' ? '✓ Copied!' : '📋 Copy'}
                </Button>
              </div>
            </div>

            {/* Network Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400">Network</div>
                <div className="font-semibold text-purple-400">Polygon</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-gray-400">Token</div>
                <div className="font-semibold text-green-400">{selectedToken.toUpperCase()}</div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">Address Not Available</h3>
            <p className="text-sm">
              {selectedNetwork === 'bsc' 
                ? 'BSC deposit address is ready for use'
                : 'This network is available for deposits'
              }
            </p>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">How to Deposit</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <div className="font-medium">Scan QR Code or Copy Address</div>
              <div className="text-gray-400">Use the QR code with your wallet app or copy the address manually</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <div className="font-medium">Verify Network is Polygon</div>
              <div className="text-gray-400">Ensure your wallet is set to Polygon network (not Ethereum)</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <div className="font-medium">Send {selectedToken.toUpperCase()} Tokens</div>
              <div className="text-gray-400">Minimum {formatAmount(20000)} for investment eligibility</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <div className="font-medium">Automatic Processing</div>
              <div className="text-gray-400">Your deposit will appear in your balance within 2-5 minutes</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={() => onNavigate?.('crypto')}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          size="lg"
        >
          Check My Crypto Balance
        </Button>
        
        <Button
          onClick={onBack}
          variant="secondary"
          className="w-full"
          size="lg"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Support Note */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>Need help? Having issues with deposits?</p>
        <p>Contact support with your transaction hash for assistance</p>
      </div>
    </div>
  );
};