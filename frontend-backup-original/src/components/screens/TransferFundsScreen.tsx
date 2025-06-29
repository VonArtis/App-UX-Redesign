import React, { useState } from 'react';
import type { ScreenProps } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const TransferFundsScreen: React.FC<ScreenProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; recipient?: string }>({});

  const validateForm = () => {
    const newErrors: { amount?: string; recipient?: string } = {};
    
    if (!recipient) {
      newErrors.recipient = 'Recipient is required';
    }
    
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTransfer = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate transfer API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Successfully transferred $${parseFloat(amount).toLocaleString()} to ${recipient}`);
      setAmount('');
      setRecipient('');
      setErrors({});
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Transfer Funds" onBack={onBack} />

      <div className="space-y-5">
        <Input
          label="Recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient address or email"
          required
          error={errors.recipient}
        />
        
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
          onClick={handleTransfer}
          loading={loading}
          disabled={!amount || !recipient}
          fullWidth
          size="lg"
        >
          Send Funds
        </Button>
      </div>
    </div>
  );
};