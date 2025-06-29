import React, { useState, useEffect } from 'react';
import type { ScreenProps, Investment } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const InvestmentsScreen: React.FC<ScreenProps> = ({ onBack, onNavigate }) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useApp();

  useEffect(() => {
    fetchInvestments();
    
    // Failsafe: Ensure loading stops after 10 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      if (user?.token) {
        const data = await apiService.getInvestments(user.token);
        setInvestments(data.investments || []);
      } else {
        // No token - show empty state
        setInvestments([]);
      }
    } catch (error) {
      console.error('Error fetching investments:', error);
      // On error, show empty array instead of sample data
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate investment metrics
  const calculateInvestmentMetrics = (investment: Investment) => {
    if (!investment.created_at) return null;
    
    const createdDate = new Date(investment.created_at);
    const currentDate = new Date();
    const termEndDate = new Date(createdDate.getTime() + (investment.term * 30 * 24 * 60 * 60 * 1000)); // term in months
    
    const totalDays = Math.floor((termEndDate.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
    const elapsedDays = Math.floor((currentDate.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    
    // Calculate earned interest so far (simple interest calculation)
    const annualRate = investment.rate / 100;
    const dailyRate = annualRate / 365;
    const earnedInterest = investment.amount * dailyRate * elapsedDays;
    const totalExpectedReturn = investment.amount * (annualRate * (investment.term / 12));
    
    return {
      totalDays,
      elapsedDays,
      remainingDays,
      earnedInterest,
      totalExpectedReturn,
      currentValue: investment.amount + earnedInterest,
      progressPercentage: Math.min(100, (elapsedDays / totalDays) * 100),
      isCompleted: remainingDays <= 0
    };
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDays = (days: number) => {
    if (days === 0) return "Completed";
    if (days === 1) return "1 day";
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''}`;
    return `${months}m ${remainingDays}d`;
  };

  if (loading) {
    return <FullScreenLoader text="Loading your investments..." />;
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="My Investments" onBack={onBack} />

      {investments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-xl font-semibold mb-2">No Investments Yet</h3>
          <p className="text-gray-400 mb-6">Start your investment journey with VonVault</p>
          <Button
            onClick={() => onNavigate?.('new-investment')}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            Make Your First Investment
          </Button>
        </div>
      ) : (
        <>
          {/* Portfolio Summary */}
          <Card className="mb-6 bg-gradient-to-r from-green-900/50 to-blue-900/50 border-green-500/30">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">💼</span>
              Portfolio Summary
            </h2>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-400">Total Invested</div>
                <div className="text-lg font-bold text-white">
                  {formatAmount(investments.reduce((sum, inv) => sum + inv.amount, 0))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Earned</div>
                <div className="text-lg font-bold text-green-400">
                  {formatAmount(investments.reduce((sum, inv) => {
                    const metrics = calculateInvestmentMetrics(inv);
                    return sum + (metrics?.earnedInterest || 0);
                  }, 0))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Current Value</div>
                <div className="text-lg font-bold text-blue-400">
                  {formatAmount(investments.reduce((sum, inv) => {
                    const metrics = calculateInvestmentMetrics(inv);
                    return sum + (metrics?.currentValue || inv.amount);
                  }, 0))}
                </div>
              </div>
            </div>
          </Card>

          {/* Individual Investments */}
          <div className="space-y-4">
            {investments.map((investment) => {
              const metrics = calculateInvestmentMetrics(investment);
              
              return (
                <Card key={investment.id} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{investment.name}</h3>
                      <div className="text-sm text-gray-400">
                        {investment.membership_level && (
                          <span className="capitalize">{investment.membership_level} Member Plan</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">{investment.rate}% APY</div>
                      <div className="text-xs text-gray-400">{investment.term} months</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-400">Principal Amount</div>
                      <div className="text-lg font-semibold">{formatAmount(investment.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Current Value</div>
                      <div className="text-lg font-semibold text-blue-400">
                        {formatAmount(metrics?.currentValue || investment.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Interest Earned</div>
                      <div className="text-lg font-semibold text-green-400">
                        {formatAmount(metrics?.earnedInterest || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Time Remaining</div>
                      <div className="text-lg font-semibold">
                        {metrics?.isCompleted ? (
                          <span className="text-green-400">✅ Completed</span>
                        ) : (
                          formatDays(metrics?.remainingDays || 0)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {metrics && !metrics.isCompleted && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{metrics.progressPercentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${metrics.progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-600">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        Status: <span className="text-green-400 capitalize">{investment.status}</span>
                      </span>
                      {metrics?.totalExpectedReturn && (
                        <span className="text-gray-400">
                          Expected Return: <span className="text-white font-semibold">
                            {formatAmount(metrics.totalExpectedReturn)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={() => onNavigate?.('new-investment')}
            fullWidth
            size="lg"
            className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            + Make New Investment
          </Button>
        </>
      )}
    </div>
  );
};