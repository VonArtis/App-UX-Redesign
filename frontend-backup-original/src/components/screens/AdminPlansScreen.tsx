import React, { useState, useEffect } from 'react';
import type { ScreenProps, InvestmentPlan, InvestmentPlanCreate } from '../../types';
import { ScreenHeader } from '../layout/ScreenHeader';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FullScreenLoader } from '../common/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';

export const AdminPlansScreen: React.FC<ScreenProps> = ({ onBack }) => {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<InvestmentPlanCreate>({
    name: '',
    description: '',
    rate: 0,
    term_days: 0,
    min_amount: 0,
    max_amount: undefined,
    is_active: true
  });
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const { user } = useApp();

  useEffect(() => {
    fetchInvestmentPlans();
  }, []);

  const fetchInvestmentPlans = async () => {
    try {
      setLoading(true);
      if (!user?.token) {
        console.error('No user token available');
        return;
      }
      const response = await apiService.getInvestmentPlans(user.token);
      setPlans(response.plans);
    } catch (error) {
      console.error('Error fetching investment plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLockPeriod = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rate: 0,
      term_days: 0,
      min_amount: 0,
      max_amount: undefined,
      is_active: true
    });
    setEditingPlan(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async () => {
    if (!user?.token) {
      alert('Please log in to manage investment plans');
      return;
    }

    if (!formData.name || formData.rate <= 0 || formData.term_days <= 0 || formData.min_amount <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    try {
      if (editingPlan) {
        // Update existing plan
        await apiService.updateInvestmentPlan(editingPlan.id, formData, user.token);
        alert('Investment plan updated successfully!');
      } else {
        // Create new plan
        await apiService.createInvestmentPlan(formData, user.token);
        alert('Investment plan created successfully!');
      }
      
      resetForm();
      fetchInvestmentPlans();
    } catch (error) {
      console.error('Error saving investment plan:', error);
      alert('Failed to save investment plan. Please try again.');
    }
  };

  const handleEdit = (plan: InvestmentPlan) => {
    setFormData({
      name: plan.name,
      description: plan.description,
      rate: plan.rate,
      term_days: plan.term_days,
      min_amount: plan.min_amount,
      max_amount: plan.max_amount,
      is_active: plan.is_active
    });
    setEditingPlan(plan);
    setShowCreateForm(true);
  };

  const handleDelete = async (plan: InvestmentPlan) => {
    if (!user?.token) return;

    const confirmed = window.confirm(`Are you sure you want to deactivate "${plan.name}"?`);
    if (!confirmed) return;

    try {
      await apiService.deleteInvestmentPlan(plan.id, user.token);
      alert('Investment plan deactivated successfully!');
      fetchInvestmentPlans();
    } catch (error) {
      console.error('Error deleting investment plan:', error);
      alert('Failed to deactivate investment plan. Please try again.');
    }
  };

  if (loading) {
    return <FullScreenLoader text="Loading investment plans..." />;
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 pt-12 pb-8">
      <ScreenHeader title="Manage Investment Plans" onBack={onBack} />

      {!showCreateForm ? (
        <>
          {/* Plans List */}
          <div className="space-y-4 mb-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`${!plan.is_active ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {!plan.is_active && (
                        <span className="text-xs bg-red-600 px-2 py-1 rounded">INACTIVE</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                  </div>
                  <div className="text-green-400 font-bold text-xl ml-4">
                    {plan.rate}%
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-4">
                  <div>
                    <span className="text-gray-500">Lock Period:</span>
                    <div className="text-white">{formatLockPeriod(plan.term_days)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Min Amount:</span>
                    <div className="text-white">${plan.min_amount.toLocaleString()}</div>
                  </div>
                  {plan.max_amount && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Max Amount:</span>
                      <div className="text-white">${plan.max_amount.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleEdit(plan)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  {plan.is_active && (
                    <Button
                      onClick={() => handleDelete(plan)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Create New Plan Button */}
          <Button
            onClick={() => setShowCreateForm(true)}
            fullWidth
            size="lg"
          >
            + Create New Investment Plan
          </Button>
        </>
      ) : (
        <>
          {/* Create/Edit Form */}
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold">
              {editingPlan ? 'Edit Investment Plan' : 'Create New Investment Plan'}
            </h2>

            <Input
              label="Plan Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Growth Plus Plan"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the investment plan"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <Input
              label="Annual Percentage Yield (APY) * (%)"
              type="number"
              value={formData.rate.toString()}
              onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
              placeholder="7.5"
              step="0.1"
            />

            <Input
              label="Lock Period * (days)"
              type="number"
              value={formData.term_days.toString()}
              onChange={(e) => setFormData({ ...formData, term_days: parseInt(e.target.value) || 0 })}
              placeholder="365"
            />

            <Input
              label="Minimum Investment Amount * ($)"
              type="number"
              value={formData.min_amount.toString()}
              onChange={(e) => setFormData({ ...formData, min_amount: parseFloat(e.target.value) || 0 })}
              placeholder="1000"
            />

            <Input
              label="Maximum Investment Amount ($) - Optional"
              type="number"
              value={formData.max_amount?.toString() || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                max_amount: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              placeholder="Leave empty for no limit"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2 accent-purple-600"
              />
              <label className="text-sm text-gray-300">Plan is active and available to users</label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4">
            <Button
              onClick={handleSubmit}
              className="flex-1"
            >
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
            <Button
              onClick={resetForm}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
};