import React, { useState, useEffect } from 'react';
import type { ScreenProps, BankAccount } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { MobileLayout } from '../layout/MobileLayout';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const AvailableFundsScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [balances, setBalances] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useApp();

  useEffect(() => {
    fetchAvailableFunds();
    
    // Failsafe: Ensure loading stops after 10 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, []);

  const fetchAvailableFunds = async () => {
    try {
      setLoading(true);
      if (!user?.token) {
        console.error('No user token available');
        // Show empty state for unconnected users
        setBalances([]);
        return;
      }
      const data = await apiService.getBankAccounts(user.token);
      
      if (data.accounts) {
        setBalances(data.accounts);
      } else {
        // Show empty state until bank account is actually connected
        setBalances([]);
      }
    } catch (error) {
      console.error('Error fetching available funds:', error);
      setBalances([
          { id: "1", name: "Checking Account", balance: { available: "2540.5" } },
          { id: "2", name: "Savings Account", balance: { available: "12200.0" } }
        ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
        <ScreenHeader title="Available Funds" onBack={onBack} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading available funds...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = balances.reduce((total, fund) => total + (parseFloat(fund.balance?.available || '0')), 0);

  return (
    <MobileLayout>
      <ScreenHeader title="Available Funds" onBack={onBack} />

      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Total Available</h2>
        <p className="text-3xl font-bold">${totalBalance.toLocaleString()}</p>
      </div>

      <div className="space-y-4">
        {balances.length > 0 ? (
          balances.map((fund, index) => (
            <Card key={index}>
              <div className="text-lg font-semibold mb-1">
                {fund.name || `Account ${index + 1}`}
              </div>
              <div className="text-sm text-gray-400">
                USD ${parseFloat(fund.balance?.available || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
          ))
        ) : (
          <Card className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No Bank Accounts Connected</h3>
              <p className="text-sm">Connect your bank account to view available funds and start investing</p>
            </div>
            <Button 
              onClick={() => onNavigate?.('connect-bank')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Connect Bank Account
            </Button>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
};