// Multi-wallet management hook
import { useState, useEffect, useCallback } from 'react';
import type { User, ConnectedWallet } from '../types';
import { apiService } from '../services/api';

export const useMultiWallet = (user: User | null) => {
  const [connected_wallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [primary_wallet, setPrimaryWalletState] = useState<ConnectedWallet | null>(null);
  const [loading, setLoading] = useState(false);

  // === PHASE 2: MULTI-WALLET STATE MANAGEMENT (EXACT SPECIFICATION) ===

  // Fetch user wallets from backend
  const fetchWallets = useCallback(async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const response = await apiService.getUserWallets(user.token);
      
      if (response.wallets) {
        setConnectedWallets(response.wallets);
        
        // Set primary wallet
        const primaryWallet = response.wallets.find(
          (wallet: ConnectedWallet) => wallet.id === response.primary_wallet_id
        ) || null;
        setPrimaryWalletState(primaryWallet);
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  // Connect new wallet
  const connectWallet = useCallback(async (type: string, address: string, networks: string[]) => {
    if (!user?.token) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const response = await apiService.connectWallet(user.token, {
        type,
        address,
        networks
      });

      if (response.success) {
        await fetchWallets(); // Refresh wallet list
        return response.wallet;
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.token, fetchWallets]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async (walletId: string) => {
    if (!user?.token) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const response = await apiService.removeWallet(user.token, walletId);
      
      if (response.success) {
        await fetchWallets(); // Refresh wallet list
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.token, fetchWallets]);

  // Set primary wallet
  const setPrimaryWallet = useCallback(async (walletId: string) => {
    if (!user?.token) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const response = await apiService.setPrimaryWallet(user.token, walletId);
      
      if (response.success) {
        await fetchWallets(); // Refresh wallet list
      }
    } catch (error) {
      console.error('Failed to set primary wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.token, fetchWallets]);

  // Rename wallet
  const renameWallet = useCallback(async (walletId: string, name: string) => {
    if (!user?.token) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const response = await apiService.updateWallet(user.token, walletId, { name });
      
      if (response.success) {
        await fetchWallets(); // Refresh wallet list
      }
    } catch (error) {
      console.error('Failed to rename wallet:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user?.token, fetchWallets]);

  // Refresh wallet balances
  const refreshWalletBalances = useCallback(async () => {
    if (!user?.token || connected_wallets.length === 0) return;

    try {
      setLoading(true);
      // Refresh balances for all connected wallets
      for (const wallet of connected_wallets) {
        try {
          await apiService.getWalletBalance(user.token, wallet.id);
        } catch (error) {
          console.error(`Failed to refresh balance for wallet ${wallet.id}:`, error);
        }
      }
      await fetchWallets(); // Refresh wallet list with updated balances
    } catch (error) {
      console.error('Failed to refresh wallet balances:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.token, connected_wallets, fetchWallets]);

  // Get wallet by network
  const getWalletByNetwork = useCallback((network: string): ConnectedWallet | null => {
    // First try primary wallet if it supports the network
    if (primary_wallet && primary_wallet.networks.includes(network)) {
      return primary_wallet;
    }
    
    // Otherwise find any wallet that supports the network
    return connected_wallets.find(wallet => wallet.networks.includes(network)) || null;
  }, [primary_wallet, connected_wallets]);

  // Initialize wallets when user changes
  useEffect(() => {
    if (user?.token) {
      fetchWallets();
    } else {
      setConnectedWallets([]);
      setPrimaryWalletState(null);
    }
  }, [user?.token, fetchWallets]);

  return {
    connected_wallets,
    primary_wallet,
    loading,
    connectWallet,
    disconnectWallet,
    setPrimaryWallet,
    renameWallet,
    refreshWalletBalances,
    getWalletByNetwork,
    fetchWallets
  };
};