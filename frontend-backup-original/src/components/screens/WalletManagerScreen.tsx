import React, { useState, useEffect } from 'react';
import type { ScreenProps, ConnectedWallet } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';

// === PHASE 2: WALLET MANAGER SCREEN (EXACT SPECIFICATION) ===

export const WalletManagerScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const { user, connected_wallets, primary_wallet, connectWallet, disconnectWallet, setPrimaryWallet, renameWallet } = useApp();
  const [loading, setLoading] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<ConnectedWallet | null>(null);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState('');

  const handleConnectWallet = async (type: string, address: string) => {
    try {
      setLoading(true);
      await connectWallet(type, address, ['ethereum', 'polygon', 'bsc']);
      setShowConnectModal(false);
      alert('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert(`Error: ${error.message || 'Failed to connect wallet'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectWallet = async (walletId: string) => {
    if (!confirm('Are you sure you want to remove this wallet?')) return;

    try {
      setLoading(true);
      await disconnectWallet(walletId);
      alert('Wallet removed successfully!');
    } catch (error: any) {
      console.error('Error removing wallet:', error);
      alert(`Error: ${error.message || 'Failed to remove wallet'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (walletId: string) => {
    try {
      setLoading(true);
      await setPrimaryWallet(walletId);
      alert('Primary wallet updated successfully!');
    } catch (error: any) {
      console.error('Error setting primary wallet:', error);
      alert(`Error: ${error.message || 'Failed to set primary wallet'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameWallet = async (walletId: string, name: string) => {
    try {
      setLoading(true);
      await renameWallet(walletId, name);
      setEditingWallet(null);
      setNewWalletName('');
      alert('Wallet renamed successfully!');
    } catch (error: any) {
      console.error('Error renaming wallet:', error);
      alert(`Error: ${error.message || 'Failed to rename wallet'}`);
    } finally {
      setLoading(false);
    }
  };

  const getWalletTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'metamask':
        return '🦊';
      case 'trustwallet':
        return '🛡️';
      case 'walletconnect':
        return '🔗';
      case 'coinbase':
        return '🔵';
      default:
        return '💼';
    }
  };

  const getNetworkBadge = (network: string) => {
    const networkColors: { [key: string]: string } = {
      ethereum: 'bg-blue-100 text-blue-800',
      polygon: 'bg-purple-100 text-purple-800',
      bsc: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span 
        key={network}
        className={`px-2 py-1 text-xs rounded-full ${networkColors[network] || 'bg-gray-100 text-gray-800'}`}
      >
        {network.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <FullScreenLoader text="Managing wallets..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ScreenHeader 
        title="Wallet Manager" 
        onBack={onBack}
      />

      <div className="p-4 space-y-6">
        {/* Header Stats */}
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {connected_wallets.length} of 5 Wallets Connected
            </h2>
            <p className="text-gray-600">
              {primary_wallet ? `Primary: ${primary_wallet.name || primary_wallet.type}` : 'No primary wallet set'}
            </p>
          </div>
        </Card>

        {/* Add Wallet Button */}
        {connected_wallets.length < 5 && (
          <Button
            onClick={() => setShowConnectModal(true)}
            variant="primary"
            className="w-full py-4 text-lg"
          >
            + Connect New Wallet
          </Button>
        )}

        {/* Connected Wallets List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Connected Wallets</h3>
          
          {connected_wallets.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">💼</div>
                <h4 className="text-lg font-medium mb-2">No Wallets Connected</h4>
                <p className="text-sm">Connect your first wallet to get started with VonVault DeFi</p>
              </div>
            </Card>
          ) : (
            connected_wallets.map((wallet) => (
              <Card key={wallet.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-3xl">
                      {getWalletTypeIcon(wallet.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {editingWallet === wallet.id ? (
                          <input
                            type="text"
                            value={newWalletName}
                            onChange={(e) => setNewWalletName(e.target.value)}
                            className="text-lg font-semibold bg-white border rounded px-2 py-1"
                            placeholder={wallet.name || wallet.type}
                            onBlur={() => {
                              if (newWalletName.trim()) {
                                handleRenameWallet(wallet.id, newWalletName.trim());
                              } else {
                                setEditingWallet(null);
                                setNewWalletName('');
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && newWalletName.trim()) {
                                handleRenameWallet(wallet.id, newWalletName.trim());
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <h4 
                            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                            onClick={() => {
                              setEditingWallet(wallet.id);
                              setNewWalletName(wallet.name || wallet.type);
                            }}
                          >
                            {wallet.name || `${wallet.type} Wallet`}
                          </h4>
                        )}
                        
                        {wallet.is_primary && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 font-mono">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {wallet.networks.map(network => getNetworkBadge(network))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {!wallet.is_primary && (
                      <Button
                        onClick={() => handleSetPrimary(wallet.id)}
                        variant="outline"
                        size="sm"
                      >
                        Set Primary
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleDisconnectWallet(wallet.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Connect Wallet Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Connect New Wallet</h3>
              
              <div className="space-y-3">
                {[
                  { type: 'metamask', name: 'MetaMask', icon: '🦊' },
                  { type: 'trustwallet', name: 'Trust Wallet', icon: '🛡️' },
                  { type: 'walletconnect', name: 'WalletConnect', icon: '🔗' },
                  { type: 'coinbase', name: 'Coinbase Wallet', icon: '🔵' }
                ].map((walletType) => (
                  <Button
                    key={walletType.type}
                    onClick={() => {
                      // For demo, using a mock address. In real implementation, this would trigger wallet connection
                      const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
                      handleConnectWallet(walletType.type, mockAddress);
                    }}
                    variant="outline"
                    className="w-full justify-start py-3"
                  >
                    <span className="text-2xl mr-3">{walletType.icon}</span>
                    {walletType.name}
                  </Button>
                ))}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setShowConnectModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Navigate to Other Screens */}
        <div className="space-y-3">
          <Button
            onClick={() => onNavigate?.('crypto')}
            variant="outline"
            className="w-full py-3"
          >
            View Crypto Balances
          </Button>
          
          <Button
            onClick={() => onNavigate?.('crypto-deposit')}
            variant="outline"
            className="w-full py-3"
          >
            Deposit Crypto
          </Button>
        </div>
      </div>
    </div>
  );
};