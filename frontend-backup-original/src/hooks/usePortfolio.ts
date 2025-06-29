// Custom hook for portfolio management
import { useState, useEffect } from 'react';
import type { Portfolio, User } from '../types';
import { apiService } from '../services/api';

export const usePortfolio = (user: User | null) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    if (!user?.token) {
      setPortfolio(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getPortfolio(user.token);
      setPortfolio(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch portfolio';
      setError(errorMessage);
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch portfolio when user changes
  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  const refetch = () => {
    fetchPortfolio();
  };

  return {
    portfolio,
    loading,
    error,
    fetchPortfolio,
    refetch
  };
};