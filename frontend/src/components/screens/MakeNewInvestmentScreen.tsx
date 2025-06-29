import React, { useState, useEffect } from 'react';
import type { ScreenProps, InvestmentPlan, MembershipStatus, ConnectedWallet } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { MembershipBadge } from '../common/MembershipBadge';
import { EnhancedProgressBar } from '../common/EnhancedProgressBar';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const MakeNewInvestmentScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  
  // === PHASE 2C: PRIMARY WALLET INTEGRATION ===
  const [selectedWallet, setSelectedWallet] = useState<ConnectedWallet | null>(null);
  const { user, fetchMembershipStatus, connected_wallets, primary_wallet } = useApp();

  useEffect(() => {
    // Set primary wallet as default for investments
    setSelectedWallet(primary_wallet);
    fetchInvestmentData();
  }, [primary_wallet]);

  const fetchInvestmentData = async () => {
    try {
      setLoading(true);
      console.log('Fetching investment data...', { hasToken: !!user?.token });
      
      if (!user?.token) {
        console.error('No user token available');
        setLoading(false);
        return;
      }

      const response = await apiService.getInvestmentPlans(user.token);
      console.log('Investment plans response:', response);
      
      setPlans(response.plans || []);
      setMembershipStatus(response.membership);
      
      if (response.plans && response.plans.length > 0) {
        setSelectedPlan(response.plans[0]);
      }
    } catch (error) {
      console.error('Error fetching investment data:', error);
      // Show error to user instead of silent failure
      alert(`Error loading investment plans: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatLockPeriod = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  const calculateProjectedReturn = () => {
    if (!amount || !selectedPlan) return 0;
    const principal = parseFloat(amount);
    const annualRate = selectedPlan.rate / 100;
    const timeInYears = selectedPlan.term_days / 365;
    return (principal * (1 + annualRate * timeInYears)).toFixed(2);
  };

  const getTierColorClass = (level: string) => {
    switch (level) {
      case 'club': return 'border-amber-500/50 bg-amber-500/5';
      case 'premium': return 'border-gray-400/50 bg-gray-400/5';
      case 'vip': return 'border-yellow-500/50 bg-yellow-500/5';
      case 'elite': return 'border-purple-500/50 bg-purple-500/5';
      default: return 'border-gray-700 bg-gray-800/50';
    }
  };

  const getTierAccentColor = (level: string) => {
    switch (level) {
      case 'club': return 'text-amber-400';
      case 'premium': return 'text-gray-300';
      case 'vip': return 'text-yellow-400';
      case 'elite': return 'text-purple-300';
      default: return 'text-gray-400';
    }
  };

  const handleInvest = async () => {
    if (!selectedPlan || !amount || parseFloat(amount) < selectedPlan.min_amount) {
      alert(`Minimum investment is ${formatAmount(selectedPlan?.min_amount || 0)}`);
      return;
    }

    if (parseFloat(amount) > selectedPlan.max_amount) {
      alert(`Maximum investment per transaction is ${formatAmount(selectedPlan.max_amount)}`);
      return;
    }

    // === PHASE 2A: ENHANCED 2FA VALIDATION FOR HIGH-VALUE INVESTMENTS ===
    const investmentAmount = parseFloat(amount);
    const enhanced2faValidation = apiService.validateEnhanced2FAForInvestment(user!, investmentAmount);
    
    if (!enhanced2faValidation.canProceed) {
      // Show Enhanced 2FA requirement dialog
      const userConfirmed = window.confirm(
        `🛡️ Enhanced Security Required\n\n` +
        `${enhanced2faValidation.message}\n\n` +
        `Would you like to set up Enhanced 2FA now?\n\n` +
        `This includes:\n` +
        `• Biometric authentication (fingerprint/Face ID)\n` +
        `• Push notification approval\n\n` +
        `Click OK to set up Enhanced 2FA, or Cancel to return.`
      );
      
      if (userConfirmed) {
        // Redirect to Enhanced 2FA setup
        onNavigate?.('enhanced-2fa-setup');
        return;
      } else {
        // User declined, return to amount selection
        return;
      }
    }

    // === PHASE 2C: PRIMARY WALLET VALIDATION ===
    if (!selectedWallet) {
      alert('Please connect a crypto wallet to make investments.');
      onNavigate?.('connect-crypto');
      return;
    }

    setInvesting(true);
    try {
      if (user?.token) {
        const investment = {
          name: selectedPlan.name,
          amount: parseFloat(amount),
          rate: selectedPlan.rate,
          term: Math.round(selectedPlan.term_days / 30), // Convert to months for backward compatibility
          wallet_id: selectedWallet.id, // Include wallet for transaction
          wallet_address: selectedWallet.address // Include wallet address
        };
        
        await apiService.createInvestment(investment, user.token);
        
        // Refresh membership status after investment
        await fetchMembershipStatus();
        
        alert(`Investment created successfully! 🎉\nUsing wallet: ${selectedWallet.name || selectedWallet.type}`);
        onBack?.();
      }
    } catch (error: any) {
      console.error('Investment creation error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create investment. Please try again.';
      alert(errorMessage);
    } finally {
      setInvesting(false);
    }
  };

  if (loading) {
    return <FullScreenLoader text="Loading investment options..." />;
  }

  // Check if user is verified for high-value investments
  const isVerified = user?.email_verified && user?.phone_verified;
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
        <ScreenHeader title="New Investment" onBack={onBack} />
        
        <Card className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h4 className="text-lg font-medium mb-2 text-yellow-400">Verification Required</h4>
          <p className="text-sm mb-6">To make investments and access financial features, please verify your email and phone number first.</p>
          
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
      </div>
    );
  }

  if (!membershipStatus) {
    return (
      <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
        <ScreenHeader title="New Investment" onBack={onBack} />
        <div className="text-center text-gray-400 mt-8">
          Unable to load membership status. Please try again.
        </div>
      </div>
    );
  }

  if (membershipStatus.level === "none") {
    return (
      <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
        <ScreenHeader title="New Investment" onBack={onBack} />
        
        <Card className="text-center animate-fade-in-up bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="text-6xl mb-6 animate-bounce">🚀</div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Start Your Investment Journey
          </h2>
          <p className="text-gray-400 mb-6">
            To become a Club Member and start investing, you need a minimum investment of {formatAmount(20000)}.
          </p>
          <p className="text-sm text-gray-500">
            Current total invested: {formatAmount(membershipStatus.total_invested)}
          </p>
          
          <div className="mt-6">
            <Button
              onClick={onBack}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const projectedReturn = calculateProjectedReturn();

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8 custom-scrollbar">
      <ScreenHeader title="New Investment" onBack={onBack} />

      {/* Enhanced Membership Status Header */}
      <Card className={`mb-6 ${getTierColorClass(membershipStatus.level)} border-2 card-hover-effect animate-fade-in-up`}>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-4">
            <div className="animate-float">
              <MembershipBadge 
                level={membershipStatus.level} 
                size="lg" 
                showRing={true}
                className="tier-badge-shadow"
              />
            </div>
            <div>
              <div className="font-bold text-xl">{membershipStatus.level_name}</div>
              <div className="text-gray-400 text-sm">
                {formatAmount(membershipStatus.total_invested)} invested
              </div>
            </div>
          </div>
          
          {membershipStatus.next_level && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Next Level</div>
              <div className="font-medium">{membershipStatus.next_level_name}</div>
              <div className="text-sm text-gray-500">
                {formatAmount(membershipStatus.amount_to_next || 0)} more
              </div>
            </div>
          )}
        </div>
        
        {/* Progress to next level */}
        {membershipStatus.next_level && (
          <div className="mt-4">
            <EnhancedProgressBar
              progress={((membershipStatus.total_invested) / (membershipStatus.total_invested + (membershipStatus.amount_to_next || 0))) * 100}
              level={membershipStatus.next_level}
              label="Membership Progress"
              animated={true}
            />
          </div>
        )}
      </Card>

      {/* Enhanced Plan Selection */}
      {plans.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Choose Your Investment Plan
          </h2>
          <div className="space-y-4">
            {plans.map((plan, index) => (
              <Card
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                hover
                className={`border-2 transition-all duration-300 cursor-pointer card-hover-effect animate-fade-in-up ${
                  selectedPlan?.id === plan.id 
                    ? `${getTierColorClass(membershipStatus.level)} ring-2 ring-purple-500/30 scale-105` 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start p-2">
                  <div className="flex items-center gap-3 flex-1">
                    <MembershipBadge level={membershipStatus.level} size="md" />
                    <div className="flex-1">
                      <div className="font-bold text-lg">{plan.name}</div>
                      <div className="text-sm text-gray-400 mt-1">{plan.description}</div>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="text-sm">
                          <span className="text-gray-500">Lock Period:</span>
                          <span className="text-white ml-1 font-medium">{formatLockPeriod(plan.term_days)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Range:</span>
                          <span className="text-white ml-1 font-medium">
                            {formatAmount(plan.min_amount)} - {formatAmount(plan.max_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center ml-4">
                    <div className={`text-4xl font-bold ${getTierAccentColor(membershipStatus.level)}`}>
                      {plan.rate}%
                    </div>
                    <div className="text-sm text-gray-400">APY</div>
                  </div>
                </div>
                
                {selectedPlan?.id === plan.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm text-green-400 font-medium">Selected Plan</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Amount Input */}
      {selectedPlan && (
        <Card className="mb-6 animate-slide-in-left">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">💰</span>
            Investment Amount
          </h3>
          
          <Input
            label="Enter Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            prefix="$"
            className="text-xl"
          />
          
          {/* Enhanced 2FA Requirement Indicator */}
          {amount && parseFloat(amount) >= 20000 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🛡️</span>
                <span className="text-sm font-semibold text-blue-400">Enhanced Security Required</span>
                <div className="px-2 py-1 bg-blue-900/50 rounded text-xs text-blue-300">
                  $20k+
                </div>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Investments of $20,000 or more require Enhanced 2FA for your protection.
              </p>
              <div className="flex items-center gap-2">
                {apiService.hasEnhanced2FA(user!) ? (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <span>✅</span>
                    <span>Enhanced 2FA enabled</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-orange-400">
                    <span>⚠️</span>
                    <span>Enhanced 2FA setup required</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-gray-400">Minimum</div>
              <div className="font-bold text-green-400">{formatAmount(selectedPlan.min_amount)}</div>
            </div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <div className="text-gray-400">Maximum</div>
              <div className="font-bold text-red-400">{formatAmount(selectedPlan.max_amount)}</div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Lock Period:</span>
              <span className="text-white font-medium">{formatLockPeriod(selectedPlan.term_days)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Annual Rate:</span>
              <span className={`font-bold ${getTierAccentColor(membershipStatus.level)}`}>{selectedPlan.rate}%</span>
            </div>
          </div>
        </Card>
      )}

      {/* === PHASE 2C: WALLET SELECTION FOR INVESTMENT === */}
      {amount && selectedPlan && connected_wallets.length > 0 && (
        <Card className="mb-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">💼</span>
            Select Wallet for Investment
          </h3>
          
          <div className="space-y-3">
            {connected_wallets.map((wallet) => (
              <div
                key={wallet.id}
                onClick={() => setSelectedWallet(wallet)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedWallet?.id === wallet.id
                    ? 'bg-blue-600/30 border-2 border-blue-400'
                    : 'bg-gray-800/30 border border-gray-600 hover:bg-gray-700/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {wallet.type === 'metamask' ? '🦊' :
                       wallet.type === 'trustwallet' ? '🛡️' :
                       wallet.type === 'walletconnect' ? '🔗' :
                       wallet.type === 'coinbase' ? '🔵' : '💼'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">
                          {wallet.name || `${wallet.type} Wallet`}
                        </span>
                        {wallet.is_primary && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 font-mono">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </div>
                    </div>
                  </div>
                  
                  {selectedWallet?.id === wallet.id && (
                    <div className="text-blue-400">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {!selectedWallet && (
              <div className="text-center text-yellow-400 text-sm">
                ⚠️ Please select a wallet to process your investment
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Enhanced Investment Summary */}
      {amount && selectedPlan && (
        <Card className="mb-6 bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/30 animate-slide-in-right">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-xl">📈</span>
            Investment Summary
          </h3>
          
          <div className="space-y-4">
            {/* Wallet Info in Summary */}
            {selectedWallet && (
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Payment Wallet:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {selectedWallet.type === 'metamask' ? '🦊' :
                       selectedWallet.type === 'trustwallet' ? '🛡️' :
                       selectedWallet.type === 'walletconnect' ? '🔗' :
                       selectedWallet.type === 'coinbase' ? '🔵' : '💼'}
                    </span>
                    <span className="text-white font-medium">
                      {selectedWallet.name || selectedWallet.type}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Investment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {formatAmount(parseFloat(amount))}
                </div>
                <div className="text-sm text-gray-400">Investment</div>
              </div>
              <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {formatAmount(parseFloat(String(projectedReturn)))}
                </div>
                <div className="text-sm text-gray-400">Projected Return</div>
              </div>
            </div>
            
            {/* Plan Summary */}
            <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lock Period:</span>
                <span className="text-white font-medium">{formatLockPeriod(selectedPlan.term_days)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">APY Rate:</span>
                <span className={`font-bold ${getTierAccentColor(membershipStatus.level)}`}>{selectedPlan.rate}%</span>
              </div>
              
              <hr className="border-gray-700 my-3" />
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Profit:</span>
                <span className="text-xl font-bold text-green-400">
                  +{formatAmount(parseFloat(String(projectedReturn)) - parseFloat(amount))}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 italic text-center">
              * Returns are projected based on the annual percentage yield and may vary
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced Action Buttons */}
      <div className="flex space-x-4">
        <Button 
          onClick={handleInvest}
          disabled={!amount || !selectedPlan || parseFloat(amount) < (selectedPlan?.min_amount || 0)}
          loading={investing}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-4"
        >
          {investing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🚀</span>
              Invest Now
            </span>
          )}
        </Button>
        
        <Button 
          onClick={onBack}
          variant="secondary"
          className="flex-1 py-4"
        >
          Cancel
        </Button>
      </div>
      
      {/* Investment Tips */}
      <Card className="mt-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <span className="text-lg">💡</span>
          Investment Tips
        </h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Higher membership tiers unlock better APY rates</li>
          <li>• Longer lock periods typically offer higher returns</li>
          <li>• Your membership level is based on total invested amount</li>
          <li>• Elite members can make unlimited $250K investments</li>
        </ul>
      </Card>
    </div>
  );
};