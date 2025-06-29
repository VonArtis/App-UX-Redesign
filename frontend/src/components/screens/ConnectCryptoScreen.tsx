import React, { useState } from 'react';
import type { ConnectionScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useApp } from '../../context/AppContext';

export const ConnectCryptoScreen: React.FC<ConnectionScreenProps> = ({ onConnect, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const { user, setUser } = useApp();

  const handleMetaMaskConnect = async () => {
    setLoading(true);
    setSelectedWallet('metamask');
    
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          // Update user as crypto connected with real address
          setUser({ ...(user || {}), crypto_connected: true, wallet_type: 'metamask', wallet_address: accounts[0] });
          alert('MetaMask connected successfully!');
          onConnect?.();
        }
      } else {
        alert('Please install MetaMask extension to connect');
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      if (error.code === 4001) {
        alert('Connection was rejected. Please try again and approve the connection.');
      } else {
        alert('Failed to connect MetaMask. Please try again.');
      }
    } finally {
      setLoading(false);
      setSelectedWallet('');
    }
  };

  const handleWalletConnect = async () => {
    setLoading(true);
    setSelectedWallet('walletconnect');
    
    try {
      // Simulate WalletConnect flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful connection
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      setUser({ ...(user || {}), crypto_connected: true, wallet_type: 'walletconnect', wallet_address: mockAddress });
      
      alert('WalletConnect connected successfully!');
      onConnect?.();
    } catch (error) {
      console.error('WalletConnect error:', error);
      alert('Failed to connect via WalletConnect. Please try again.');
    } finally {
      setLoading(false);
      setSelectedWallet('');
    }
  };

  const handleCoinbaseConnect = async () => {
    setLoading(true);
    setSelectedWallet('coinbase');
    
    try {
      // Simulate Coinbase Wallet connection
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      // Mock successful connection
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      setUser({ ...(user || {}), crypto_connected: true, wallet_type: 'coinbase', wallet_address: mockAddress });
      
      alert('Coinbase Wallet connected successfully!');
      onConnect?.();
    } catch (error) {
      console.error('Coinbase Wallet error:', error);
      alert('Failed to connect Coinbase Wallet. Please try again.');
    } finally {
      setLoading(false);
      setSelectedWallet('');
    }
  };

  const handleTrustWalletConnect = async () => {
    setLoading(true);
    setSelectedWallet('trustwallet');
    
    try {
      // Check if Trust Wallet is available
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isTrust) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          // Update user as crypto connected with real address
          setUser({ ...(user || {}), crypto_connected: true, wallet_type: 'trustwallet', wallet_address: accounts[0] });
          alert('Trust Wallet connected successfully!');
          onConnect?.();
        }
      } else {
        // If Trust Wallet not detected, provide download link
        if (window.confirm('Trust Wallet not detected. Would you like to download it?')) {
          window.open('https://trustwallet.com/browser-extension', '_blank');
        }
      }
    } catch (error) {
      console.error('Trust Wallet connection error:', error);
      if (error.code === 4001) {
        alert('Connection was rejected. Please try again and approve the connection.');
      } else {
        alert('Failed to connect Trust Wallet. Please try again.');
      }
    } finally {
      setLoading(false);
      setSelectedWallet('');
    }
  };

  const handleOtherWallet = async () => {
    setLoading(true);
    setSelectedWallet('other');
    
    try {
      // Generic wallet connection simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      setUser({ ...(user || {}), crypto_connected: true, wallet_type: 'other', wallet_address: mockAddress });
      
      alert('Wallet connected successfully!');
      onConnect?.();
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
      setSelectedWallet('');
    }
  };

  const handleSkip = () => {
    onBack?.();
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Connect Wallet" onBack={onBack} />

      <Card padding="lg" className="space-y-4 mb-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 9.75c-.465 2.023-1.688 2.023-1.688 2.023l1.688-7.523s-7.125 0-7.125 3.375c0 1.125.75 1.5.75 1.5s-1.5.75-1.5 2.625c0 2.625 3 2.625 3 2.625s-1.5 1.125-1.5 2.625c0 2.25 3.375 2.25 3.375 2.25h3z"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Connect Your Wallet</h2>
        </div>
        
        <p className="text-sm text-gray-400 text-center mb-4">
          Connect your crypto wallet to access DeFi features and make secure investments.
        </p>
        
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <span>Multiple wallet support</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <span>Secure signature authentication</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <span>Mobile & desktop compatible</span>
          </div>
        </div>
      </Card>

      {/* Wallet Options */}
      <div className="space-y-3 mb-6">
        <Button
          onClick={handleMetaMaskConnect}
          loading={loading && selectedWallet === 'metamask'}
          disabled={loading}
          fullWidth
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {loading && selectedWallet === 'metamask' ? (
            'Connecting MetaMask...'
          ) : (
            <>🦊 Connect MetaMask</>
          )}
        </Button>
        
        <Button
          onClick={handleTrustWalletConnect}
          loading={loading && selectedWallet === 'trustwallet'}
          disabled={loading}
          fullWidth
          size="lg"
          variant="secondary"
          className="border-blue-500 text-blue-400 hover:bg-blue-900/20"
        >
          {loading && selectedWallet === 'trustwallet' ? (
            'Connecting Trust Wallet...'
          ) : (
            <>🛡️ Trust Wallet</>
          )}
        </Button>
        
        <Button
          onClick={handleWalletConnect}
          loading={loading && selectedWallet === 'walletconnect'}
          disabled={loading}
          fullWidth
          size="lg"
          variant="secondary"
          className="border-purple-500 text-purple-400 hover:bg-purple-900/20"
        >
          {loading && selectedWallet === 'walletconnect' ? (
            'Connecting WalletConnect...'
          ) : (
            <>🔗 WalletConnect</>
          )}
        </Button>
        
        <Button
          onClick={handleCoinbaseConnect}
          loading={loading && selectedWallet === 'coinbase'}
          disabled={loading}
          fullWidth
          size="lg"
          variant="secondary"
          className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
        >
          {loading && selectedWallet === 'coinbase' ? (
            'Connecting Coinbase...'
          ) : (
            <>💙 Coinbase Wallet</>
          )}
        </Button>
        
        <Button
          onClick={handleOtherWallet}
          loading={loading && selectedWallet === 'other'}
          disabled={loading}
          fullWidth
          size="lg"
          variant="secondary"
          className="border-gray-500 text-gray-400 hover:bg-gray-900/20"
        >
          {loading && selectedWallet === 'other' ? (
            'Connecting...'
          ) : (
            <>🔐 Other Wallets</>
          )}
        </Button>
      </div>

      {/* Skip Option */}
      <Card className="bg-gray-900/50 border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-3">
            You can connect a wallet later from your dashboard or profile settings.
          </p>
          <Button
            onClick={handleSkip}
            variant="secondary"
            disabled={loading}
            className="text-gray-400 hover:text-white"
          >
            Skip for Now
          </Button>
        </div>
      </Card>
    </div>
  );
};