import React, { useState } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useApp } from '../../context/AppContext';

export const WithdrawalScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; account?: string }>({});
  const { user } = useApp();

  // Check if user is verified
  const isVerified = user?.email_verified && user?.phone_verified;

  const validateForm = () => {
    const newErrors: { amount?: string; account?: string } = {};
    
    if (!account) {
      newErrors.account = 'Please select a bank account';
    }
    
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWithdraw = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate withdrawal API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      const accountName = account === 'checking' ? 'Checking Account' : 'Savings Account';
      alert(`Successfully withdrew $${parseFloat(amount).toLocaleString()} to ${accountName}`);
      setAmount('');
      setAccount('');
      setErrors({});
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Withdraw Funds" onBack={onBack} />

      {!isVerified ? (
        // User not verified - show verification requirement
        <Card className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h4 className="text-lg font-medium mb-2 text-yellow-400">Verification Required</h4>
          <p className="text-sm mb-6">To withdraw funds, please verify your email and phone number first for security and compliance.</p>
          
          <div className="bg-yellow-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-yellow-400">⚠️</span>
              <h5 className="font-medium text-yellow-300">Security & Compliance</h5>
            </div>
            <div className="text-sm text-yellow-200 space-y-2">
              <div className="flex items-center space-x-2">
                <span className={user?.email_verified ? "text-green-400" : "text-yellow-400"}>
                  {user?.email_verified ? "✅" : "📧"}
                </span>
                <span>Email Verification {user?.email_verified ? "(Complete)" : "(Required)"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={user?.phone_verified ? "text-green-400" : "text-yellow-400"}>
                  {user?.phone_verified ? "✅" : "📱"}
                </span>
                <span>Phone Verification {user?.phone_verified ? "(Complete)" : "(Required)"}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => onNavigate?.('email-verification')}
              variant="primary"
              className="w-full py-3"
              disabled={user?.email_verified}
            >
              {user?.email_verified ? "Email Verified ✅" : "Verify Email Address"}
            </Button>
            <Button
              onClick={() => onNavigate?.('sms-verification')}
              variant="outline"
              className="w-full py-3"
              disabled={user?.phone_verified}
            >
              {user?.phone_verified ? "Phone Verified ✅" : "Verify Phone Number"}
            </Button>
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            Verification helps protect your funds and ensures regulatory compliance
          </div>
        </Card>
      ) : (
        // User is verified - show withdrawal form
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Bank Account <span className="text-red-400">*</span>
            </label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full p-3 border border-purple-500 bg-gray-900 text-white rounded-lg focus:border-purple-400 focus:outline-none"
            >
              <option value="">Select account</option>
              <option value="checking">Checking Account (*****1234)</option>
              <option value="savings">Savings Account (*****5678)</option>
            </select>
            {errors.account && <p className="text-red-400 text-sm mt-1">{errors.account}</p>}
          </div>
          
          <Input
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            prefix="$"
            required
            error={errors.amount}
          />

          <Button
            onClick={handleWithdraw}
            loading={loading}
            disabled={!amount || !account}
            fullWidth
            size="lg"
            variant="danger"
          >
            Withdraw Funds
          </Button>
        </div>
      )}
    </div>
  );
};